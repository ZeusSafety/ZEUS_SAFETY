"""Punto de entrada de Cloud Functions para el CRUD de importaciones."""

import json
import os
from typing import Any, Dict, List, Tuple
import jwt
import functions_framework
import pymysql
from google.cloud import storage
from datetime import timedelta


# -----------------------------------------------------------------------------
# Configuración
# -----------------------------------------------------------------------------

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")
INSTANCE_CONNECTION_NAME = os.getenv("INSTANCE_CONNECTION_NAME")
SECRET_KEY = os.getenv("JWT_SECRET_KEY")

DEFAULT_HEADERS: Dict[str, str] = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
}


# -----------------------------------------------------------------------------
# Conexión a MySQL
# -----------------------------------------------------------------------------

def get_connection() -> pymysql.connections.Connection:
    """Obtiene la conexión a la base de datos MySQL."""
    return pymysql.connect(
        user=DB_USER,
        password=DB_PASSWORD,
        unix_socket=f"/cloudsql/{INSTANCE_CONNECTION_NAME}",
        db=DB_NAME,
        cursorclass=pymysql.cursors.DictCursor,
    )


def test_connection() -> bool:
    """Verifica que la conexión a la base de datos sea válida."""
    try:
        conn = get_connection()
        with conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT 1")
        return True
    except Exception as exc:  # noqa: BLE001
        print("Error en test_connection:", exc)
        return False

# -----------------------------------------------------------------------------
# Utilidades / Token
# -----------------------------------------------------------------------------

def validacion_token(token: str, secret_key: str | None = SECRET_KEY) -> str | Dict[str, Any]:
    """Valida un token JWT y devuelve el payload o el mensaje de error."""
    if not secret_key:
        return "secret key no configurado"
    
    if not token or not isinstance(token, str):
        return "token no válido"
    
    try:
        return jwt.decode(token, secret_key, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return "token expirado"
    except jwt.InvalidTokenError as exc:
        return f"token no válido: {str(exc)}"
    except Exception as exc:  # noqa: BLE001
        return f"error al validar token: {str(exc)}"


# -----------------------------------------------------------------------------
# Google Cloud Storage
# -----------------------------------------------------------------------------

storage_client = storage.Client()
BUCKET_NAME = "archivos_sistema"
GCS_FOLDER = "incidencias_areas_zeus"


def upload_to_gcs(file):
    """
    Sube un archivo a Google Cloud Storage y devuelve la URL pública.
    Args: file: El objeto de archivo multipart/form-data.
    Returns: La URL del archivo subido o None si hay un error.
    """
    try:
        bucket = storage_client.bucket(BUCKET_NAME)
        object_name = f"{GCS_FOLDER}/{file.filename}"
        blob = bucket.blob(object_name)
        blob.upload_from_file(file, content_type=file.content_type)
        gcs_url = f"https://storage.googleapis.com/{BUCKET_NAME}/{object_name}"
        return gcs_url
    except Exception as e:
        print(f"Error al subir a Cloud Storage: {e}")
        return None


def get_signed_upload_url(filename: str, expiration_minutes: int = 15) -> Dict[str, str]:
    """
    Genera URL firmada para subida directa (PUT) y la URL final del objeto.
    El cliente sube el PDF a upload_url; final_url es la que se guarda en BD.
    """
    bucket = storage_client.bucket(BUCKET_NAME)
    blob_path = f"{GCS_FOLDER}/{filename}"
    blob = bucket.blob(blob_path)
    upload_url = blob.generate_signed_url(
        version="v4",
        expiration=timedelta(minutes=expiration_minutes),
        method="PUT",
        content_type="application/pdf",
    )
    final_url = f"https://storage.googleapis.com/{BUCKET_NAME}/{blob_path}"
    return {"upload_url": upload_url, "final_url": final_url}


# -----------------------------------------------------------------------------
# GET: Obtener URL firmada para subida directa a GCS
# -----------------------------------------------------------------------------
def upload_url_request(request, headers: Dict[str, str]) -> Tuple[str, int, Dict[str, str]]:
    """
    GET /upload-url?numero_despacho=XXX&filename=YYY
    Devuelve { upload_url, final_url } para que el cliente suba el PDF directo a GCS.
    """
    numero_despacho = request.args.get("numero_despacho")
    filename = request.args.get("filename")
    if not numero_despacho or not filename:
        return (
            json.dumps({"error": "numero_despacho y filename son requeridos"}),
            400,
            headers,
        )
    try:
        result = get_signed_upload_url(filename)
        return (json.dumps(result), 200, headers)
    except Exception as e:
        print(f"Error en get_signed_upload_url: {e}")
        return (json.dumps({"error": str(e)}), 500, headers)


# -----------------------------------------------------------------------------
# POST: Insertar una importación
# -----------------------------------------------------------------------------
def insert_importacion(request, headers: Dict[str, str]) -> Tuple[str, int, Dict[str, str]]:
    if request.is_json:
        data = request.get_json()
    else:
        data = request.form.to_dict()
        if "detalles" in data and isinstance(data["detalles"], str):
            data["detalles"] = json.loads(data["detalles"])

    param_post = request.args.get("param_post")
    conn = get_connection()

    try:
        url_archivo_gcs = data.get("archivo_pdf", "")

        if 'archivo_pdf' in request.files:
            file = request.files['archivo_pdf']
            if file.filename != '':
                subida_result = upload_to_gcs(file)
                if subida_result:
                    url_archivo_gcs = subida_result
                else:
                    raise Exception("Error al subir el archivo a Google Cloud Storage.")
        # -----------------------------------

        with conn.cursor() as cursor:
            if param_post == "importacion":
                cursor.callproc('sp_insertar_importacion', (
                    data["fecha_registro"], data["numero_despacho"], data["responsable"],
                    data["productos"], data["fecha_llegada_productos"], 
                    data["tipo_carga"], data["estado_importacion"]
                ))

            elif param_post == "ficha_importacion":
                params = (
                    data["numero_despacho"], 
                    data["tipo_carga"], 
                    data["generado_por"], 
                    data["fecha"], 
                    url_archivo_gcs
                )
                cursor.execute("CALL sp_insertar_ficha_importacion(%s, %s, %s, %s, %s)", params)
                result = cursor.fetchone()
                last_id = result['last_id'] if result and 'last_id' in result else None
                if not last_id:
                    cursor.execute("SELECT LAST_INSERT_ID() AS last_id")
                    last_id = cursor.fetchone()['last_id']
                if not last_id:
                    raise Exception("No se pudo obtener el ID de la ficha insertada.")

                sql_detalle = """
                INSERT INTO ficha_importacion_detalle
                (ID_FICHA_IMPORTACION, ITEM, PRODUCTO, CODIGO, UNIDAD_MEDIDA, CANTIDAD, CANTIDAD_EN_CAJA) 
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """
                for detalle in data["detalles"]:
                    valor_caja = detalle.get("cantidad_en_caja")
                    if valor_caja is None:
                        valor_caja = detalle.get("CANTIDAD_EN_CAJA")
                    if valor_caja is None:
                        valor_caja = 0
                    cursor.execute(sql_detalle, (
                        last_id, 
                        detalle["item"], 
                        detalle["producto"], 
                        detalle["codigo"], 
                        detalle["unidad_medida"], 
                        detalle["cantidad"],
                        valor_caja
                    ))
            
            elif param_post == "registro_completo_importacion":
                params_ficha = (
                    data["numero_despacho"], 
                    data["tipo_carga"], 
                    data["responsable"], 
                    data["fecha_registro"], 
                    url_archivo_gcs
                )
                cursor.execute("CALL sp_insertar_ficha_importacion(%s, %s, %s, %s, %s)", params_ficha)
                result = cursor.fetchone()
                last_id = result['last_id'] if result and 'last_id' in result else None
                if not last_id:
                    raise Exception("No se pudo obtener el ID de la ficha.")

                cursor.callproc('sp_insertar_importacion', (
                    data["fecha_registro"], data["numero_despacho"], data["responsable"],
                    data["productos"], data["fecha_llegada_productos"], 
                    data["tipo_carga"], data["estado_importacion"]
                ))

                sql_detalle = """
                INSERT INTO ficha_importacion_detalle
                (ID_FICHA_IMPORTACION, ITEM, PRODUCTO, CODIGO, UNIDAD_MEDIDA, CANTIDAD, CANTIDAD_EN_CAJA) 
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """
                for detalle in data["detalles"]:
                    valor_caja = detalle.get("cantidad_en_caja")
                    if valor_caja is None:
                        valor_caja = detalle.get("CANTIDAD_EN_CAJA")
                    if valor_caja is None:
                        valor_caja = 0
                    cursor.execute(sql_detalle, (
                        last_id, detalle["item"], detalle["producto"], 
                        detalle["codigo"], detalle["unidad_medida"], detalle["cantidad"], valor_caja
                    ))

            else:
                return (json.dumps({"ERROR": f"Parámetro '{param_post}' no reconocido"}), 400, headers)

            conn.commit()
            return (json.dumps({"message": "Registro exitoso", "url_archivo": url_archivo_gcs}), 201, headers)

    except Exception as e:
        if conn: conn.rollback()
        return (json.dumps({"error": f"Error: {str(e)}"}), 500, headers)
    finally:
        if conn: conn.close()


# -----------------------------------------------------------------------------
# GET: Listar importaciones
# -----------------------------------------------------------------------------
def listar_importaciones(request, headers):
    conn = get_connection()
    with conn:
        with conn.cursor() as cursor:
            id_importacion = request.args.get("id")
            nombre_despacho = request.args.get("despacho")
            ficha = request.args.get("ficha")
            facturacion = request.args.get("facturacion")
            logistica = request.args.get("logistica")

            if id_importacion:
                cursor.execute("SELECT * FROM IMPORTACIONES WHERE ID_IMPORTACIONES = %s AND ESTADO= 1", (id_importacion,))
                result = cursor.fetchone()
            elif nombre_despacho:
                sql= """WITH pdf as (
                SELECT ID,NUMERO_DESPACHO, ARCHIVO_PDF FROM ficha_importacion
                WHERE ESTADO = 1
                )
                select I.ID_IMPORTACIONES,I.NUMERO_DESPACHO,ficha.ARCHIVO_PDF AS ARCHIVO_PDF_URL
                from IMPORTACIONES as I
                inner join ficha_importacion AS ficha
                                ON ficha.ID = (SELECT MIN(ID) FROM pdf
                                        WHERE NUMERO_DESPACHO=I.NUMERO_DESPACHO
                                        ORDER BY ID DESC)
                                WHERE I.ESTADO = 1 AND I.NUMERO_DESPACHO = %s"""
                cursor.execute(sql, (nombre_despacho))
                result = cursor.fetchone()
                cursor.execute("SELECT ITEM,PRODUCTO,CODIGO,UNIDAD_MEDIDA,CANTIDAD, CANTIDAD_EN_CAJA from ficha_importacion_detalle where estado =1 and ID_FICHA_IMPORTACION = (SELECT MAX(ID) from ficha_importacion WHERE NUMERO_DESPACHO = %s)",(nombre_despacho))
                detalles = cursor.fetchall()
                result["detalles"] = detalles
            elif ficha:
                sql="SELECT NUMERO_DESPACHO,FECHA, TIPO_CARGA, GENERADO_POR, ARCHIVO_PDF FROM ficha_importacion WHERE ESTADO = 1 ORDER BY FECHA DESC;"
                cursor.execute(sql)
                result = cursor.fetchall()
            elif facturacion:
                sql="CALL extraccion_importacion('FACTURACION')"
                cursor.execute(sql)
                result = cursor.fetchall()
            elif logistica:
                sql="CALL extraccion_importacion('LOGISTICA')"
                cursor.execute(sql)
                result = cursor.fetchall()
            else:
                sql="CALL extraccion_importacion(' ')"
                cursor.execute(sql)
                result = cursor.fetchall()
    return (json.dumps(result, default=str), 200, headers)


# -----------------------------------------------------------------------------
# PUT: Actualizar importación
# -----------------------------------------------------------------------------
def actualizar_importacion(request, headers):
    area = request.args.get("area")
    conn = get_connection()

    content_type = request.headers.get("Content-Type", "").lower()
    is_multipart = "multipart/form-data" in content_type
    is_json_content = "application/json" in content_type or request.is_json
    data = {}
    
    try:
        if is_multipart:
            data = request.form.to_dict()
            if "id" in data:
                try:
                    data["id"] = int(data["id"])
                except (ValueError, TypeError):
                    return (json.dumps({"ERROR": "El campo 'id' debe ser un número válido"}), 400, headers)
        elif is_json_content:
            data = request.get_json()
            if data is None:
                data = {}
        else:
            try:
                data = request.get_json()
                if data is None:
                    data = request.form.to_dict()
                    if "id" in data:
                        try:
                            data["id"] = int(data["id"])
                        except (ValueError, TypeError):
                            return (json.dumps({"ERROR": "El campo 'id' debe ser un número válido"}), 400, headers)
            except Exception:
                data = request.form.to_dict()
                if "id" in data:
                    try:
                        data["id"] = int(data["id"])
                    except (ValueError, TypeError):
                        return (json.dumps({"ERROR": "El campo 'id' debe ser un número válido"}), 400, headers)
    except Exception as e:
        return (json.dumps({"ERROR": f"Error al procesar los datos: {str(e)}"}), 400, headers)

    with conn:
        with conn.cursor() as cursor:
            if "id" not in data:
                return (json.dumps({"ERROR": "Se requiere un id"}), 400, headers)

            if area == "logistica":
                sql = """
                    UPDATE IMPORTACIONES 
                    SET FECHA_RECEPCION = %s,
                        INCIDENCIAS = %s,
                        INCIDENCIA_REGISTRO = DATE_SUB(now(), INTERVAL 5 HOUR)
                    WHERE ID_IMPORTACIONES = %s 
                      AND ESTADO = 1;
                """
                cursor.execute(sql, (
                    data["fecha_recepcion"],
                    data["incidencias"],
                    data["id"]
                ))

            elif area == "importacion":
                cursor.execute("""
                SELECT NUMERO_DESPACHO, 
                        (SELECT COALESCE(MAX(version_pdf), 0) 
                    FROM ficha_importacion 
                        WHERE NUMERO_DESPACHO = I.NUMERO_DESPACHO) as ultima_version
                    FROM IMPORTACIONES I
                WHERE ID_IMPORTACIONES = %s
                """, (data["id"],))
                row = cursor.fetchone()
                if not row:
                    return (json.dumps({"error": "Importación no encontrada"}), 404, headers)

                numero_despacho = row['NUMERO_DESPACHO']
                ultima_version = row['ultima_version'] or 0
                nueva_version = ultima_version + 1

                # 2. PDF: desde archivo (FormData) o desde URL (subida directa a GCS)
                url_pdf_nuevo = None
                if 'archivo_pdf' in request.files:
                    file = request.files['archivo_pdf']
                    if file.filename != '':
                        url_pdf_nuevo = upload_to_gcs(file)
                        if not url_pdf_nuevo:
                            return (json.dumps({"error": "Error al subir el archivo PDF a GCS"}), 500, headers)

                # Cliente subió el PDF directo a GCS y envía la URL en el JSON
                if url_pdf_nuevo is None and data.get("archivo_pdf_url"):
                    url_pdf_nuevo = (data.get("archivo_pdf_url") or "").strip() or None

                # 3. GUARDAR EL HISTORIAL (ficha_importacion) - SOLO si hay PDF nuevo
                if url_pdf_nuevo:
                    sql_historial = """
                        INSERT INTO ficha_importacion 
                        (NUMERO_DESPACHO, GENERADO_POR, FECHA, ARCHIVO_PDF, ESTADO, version_pdf, TIPO_CARGA)
                        VALUES (%s, %s, NOW(), %s, '1', %s, %s)
                    """
                    tipo_carga = data.get("tipo_carga") or ""
                    responsable = data.get("responsable") or data.get("generado_por") or "Admin"
                    cursor.execute(sql_historial, (
                        numero_despacho,
                        responsable,
                        url_pdf_nuevo,
                        nueva_version,
                        tipo_carga
                    ))

                    cursor.execute("SELECT LAST_INSERT_ID() AS last_id")
                    nueva_ficha_id = cursor.fetchone()['last_id']

                    if "detalles" in data:
                        detalles_lista = data["detalles"]
                        if isinstance(detalles_lista, str):
                            detalles_lista = json.loads(detalles_lista)
                        sql_detalle = """
                            INSERT INTO ficha_importacion_detalle
                            (ID_FICHA_IMPORTACION, ITEM, PRODUCTO, CODIGO, UNIDAD_MEDIDA, CANTIDAD, CANTIDAD_EN_CAJA) 
                            VALUES (%s, %s, %s, %s, %s, %s, %s)
                        """
                        for det in detalles_lista:
                            valor_caja = det.get("cantidad_en_caja")
                            if valor_caja is None:
                                valor_caja = det.get("CANTIDAD_EN_CAJA")
                            if valor_caja is None:
                                valor_caja = 0
                            cursor.execute(sql_detalle, (
                                nueva_ficha_id, 
                                det.get("item"), 
                                det.get("producto"), 
                                det.get("codigo"), 
                                det.get("unidad_medida"), 
                                det.get("cantidad"),
                                valor_caja 
                            ))

                # 4. ACTUALIZAR LA IMPORTACIÓN ACTUAL - SIEMPRE
                productos = data.get("productos", "").strip() if data.get("productos") else ""
                fecha_llegada_productos = data.get("fecha_llegada_productos", "").strip() if data.get("fecha_llegada_productos") else None
                tipo_carga = data.get("tipo_carga", "").strip() if data.get("tipo_carga") else None
                estado_importacion = data.get("estado_importacion", "").strip() if data.get("estado_importacion") else ""
                canal = data.get("canal", "").strip() if data.get("canal") else None
                fecha_almacen = data.get("fecha_almacen", "").strip() if data.get("fecha_almacen") else None
                if fecha_llegada_productos == "":
                    fecha_llegada_productos = None
                if tipo_carga == "":
                    tipo_carga = None
                if canal == "":
                    canal = None
                if fecha_almacen == "":
                    fecha_almacen = None

                archivo_pdf_url_final = url_pdf_nuevo if url_pdf_nuevo else data.get("archivo_pdf_url")
                
                sql_update = """
                    UPDATE IMPORTACIONES 
                    SET PRODUCTOS = %s,
                        FECHA_LLEGADA_PRODUCTOS = %s,
                        TIPO_CARGA = %s,
                        ESTADO_IMPORTACION = %s,
                        CANAL = %s,
                        FECHA_ALMACEN = %s,
                        ARCHIVO_PDF_URL = %s
                    WHERE ID_IMPORTACIONES = %s
                      AND ESTADO = 1
                """
                if archivo_pdf_url_final:
                    cursor.execute(sql_update, (
                        productos,
                        fecha_llegada_productos,
                        tipo_carga,
                        estado_importacion,
                        canal,
                        fecha_almacen,
                        archivo_pdf_url_final,
                        data["id"]
                    ))
                else:
                    sql_update_sin_pdf = """
                        UPDATE IMPORTACIONES 
                        SET PRODUCTOS = %s,
                            FECHA_LLEGADA_PRODUCTOS = %s,
                            TIPO_CARGA = %s,
                            ESTADO_IMPORTACION = %s,
                            CANAL = %s,
                            FECHA_ALMACEN = %s
                        WHERE ID_IMPORTACIONES = %s
                          AND ESTADO = 1
                    """
                    cursor.execute(sql_update_sin_pdf, (
                        productos,
                        fecha_llegada_productos,
                        tipo_carga,
                        estado_importacion,
                        canal,
                        fecha_almacen,
                        data["id"]
                    ))

            elif area == "facturacion":
                sql = """
                    UPDATE IMPORTACIONES 
                    SET ESTADO_REGISTRO_FACTURACION = %s,
                        OBSERVACIONES_FACTURACION = %s,
                        FECHA_REGISTRO_FACTURACION = DATE_SUB(NOW(), INTERVAL 5 HOUR)
                    WHERE ESTADO = 1 
                      AND ID_IMPORTACIONES = %s;
                """
                cursor.execute(sql, (
                    data["estado_registro"],
                    data["observaciones"],
                    data["id"]
                ))

            else:
                return (json.dumps({"error": "unsupported method"}), 400, headers)

        conn.commit()

    return (json.dumps({'message': 'Importación actualizada'}), 200, headers)


# -----------------------------------------------------------------------------
# Handler HTTP principal
# -----------------------------------------------------------------------------
@functions_framework.http
def crud_http(request) -> Tuple[str, int, Dict[str, str]]:
    headers = DEFAULT_HEADERS

    if request.method == "OPTIONS":
        return ("", 204, headers)

    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return (json.dumps({"error": "Token requerido"}), 401, headers)
        if not isinstance(auth_header, str) or not auth_header.startswith("Bearer "):
            return (json.dumps({"error": "Formato de token no válido"}), 401, headers)

        token = auth_header.split(" ", 1)[1].strip()
        if not token:
            return (json.dumps({"error": "Token vacío"}), 401, headers)
        
        token_validation = validacion_token(token)
        if isinstance(token_validation, str):
            return (json.dumps({"error": token_validation}), 401, headers)

        if not test_connection():
            return (
                json.dumps({"error": "Error de conexión a la base de datos"}),
                500,
                headers,
            )

        # Ruta para URL firmada de subida directa a GCS (debe ir antes del GET genérico)
        path = (request.path or "").rstrip("/")
        if request.method == "GET" and (path == "upload-url" or path.endswith("/upload-url")):
            return upload_url_request(request, headers)

        if request.method == "POST":
            return insert_importacion(request, headers)
        if request.method == "GET":
            return listar_importaciones(request, headers)
        if request.method == "PUT":
            return actualizar_importacion(request, headers)

        return (json.dumps({"error": "Método no soportado"}), 405, headers)
    except Exception as exc:  # noqa: BLE001
        return (json.dumps({"error": str(exc)}), 500, headers)
