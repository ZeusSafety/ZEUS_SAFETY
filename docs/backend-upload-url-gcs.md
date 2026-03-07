# Backend: URL firmada para subida directa a GCS

**Código completo del backend con estos cambios:** ver `docs/backend_main_with_upload_url.py`. Puedes reemplazar tu `main.py` (o el archivo de entrada de Cloud Functions) por ese contenido.

El frontend ya no envía el PDF por la API (para evitar error 413 en producción). En su lugar:

1. El cliente pide una **URL firmada** al backend.
2. El cliente sube el PDF **directamente a Google Cloud Storage** con esa URL.
3. El cliente llama al **PUT de actualización** con el cuerpo en JSON incluyendo `archivo_pdf_url` (sin adjuntar archivo).

Tu backend Python debe implementar **dos cosas**:

---

## 1. Endpoint para obtener URL firmada de subida

**Método y ruta:** `GET /upload-url`

**Query params:**

- `numero_despacho` (string): ej. `GAAAAA`
- `filename` (string): ej. `Ficha_Importacion_GAAAAA_1730123456789.pdf`

**Respuesta exitosa (200):**

```json
{
  "upload_url": "https://storage.googleapis.com/tu-bucket/carpeta/archivo.pdf?X-Goog-Algorithm=...&X-Goog-Credential=...&X-Goog-Signature=...",
  "final_url": "https://storage.googleapis.com/tu-bucket/carpeta/archivo.pdf"
}
```

- `upload_url`: URL firmada para hacer **PUT** con el cuerpo binario del PDF (el cliente la usa una sola vez para subir).
- `final_url`: URL pública (o con firma de lectura si aplica) donde quedará el archivo; es la que debes guardar en BD como `ARCHIVO_PDF` / `ARCHIVO_PDF_URL`.

**Ejemplo en Flask (Python) con Google Cloud Storage:**

```python
from google.cloud import storage
from datetime import timedelta

# Nombre del bucket y carpeta (ajusta a tu proyecto)
GCS_BUCKET_NAME = "archivos_sistema"  # o el que uses
GCS_PREFIX = "incidencias_areas_zeus"  # carpeta dentro del bucket

def get_signed_upload_url(numero_despacho: str, filename: str, expiration_minutes: int = 15):
    """Genera URL firmada para subida (PUT) y la URL final del objeto."""
    client = storage.Client()
    bucket = client.bucket(GCS_BUCKET_NAME)
    blob_path = f"{GCS_PREFIX}/{filename}"
    blob = bucket.blob(blob_path)

    # URL firmada para subida: método PUT, Content-Type application/pdf
    upload_url = blob.generate_signed_url(
        version="v4",
        expiration=timedelta(minutes=expiration_minutes),
        method="PUT",
        content_type="application/pdf",
    )
    # URL final donde quedará el archivo (para guardar en BD)
    final_url = f"https://storage.googleapis.com/{GCS_BUCKET_NAME}/{blob_path}"
    return {"upload_url": upload_url, "final_url": final_url}

# En tu router Flask (o FastAPI):
@app.route("/upload-url", methods=["GET"])
def upload_url():
    numero_despacho = request.args.get("numero_despacho")
    filename = request.args.get("filename")
    if not numero_despacho or not filename:
        return json.dumps({"error": "numero_despacho y filename son requeridos"}), 400, headers
    try:
        result = get_signed_upload_url(numero_despacho, filename)
        return json.dumps(result), 200, headers
    except Exception as e:
        return json.dumps({"error": str(e)}), 500, headers
```

Asegúrate de que la ruta `/upload-url` esté registrada en la misma base URL que usas para importaciones (ej. `https://importaciones2026-2946605267.us-central1.run.app`).

---

## 2. PUT actualización aceptando `archivo_pdf_url` sin archivo

En `actualizar_importacion`, cuando `area == "importacion"`:

- Si el cliente envía **archivo en `request.files`** (FormData): seguir como hasta ahora (subir con `upload_to_gcs` y usar esa URL).
- Si el cliente **no** envía archivo pero sí envía **`archivo_pdf_url`** en el cuerpo (JSON): usar esa URL como `url_pdf_nuevo` y no subir nada.

Ejemplo de lógica:

```python
# Dentro de area == "importacion", donde hoy tienes:

url_pdf_nuevo = None
if 'archivo_pdf' in request.files:
    file = request.files['archivo_pdf']
    if file.filename != '':
        url_pdf_nuevo = upload_to_gcs(file)
        if not url_pdf_nuevo:
            return (json.dumps({"error": "Error al subir el archivo PDF a GCS"}), 500, headers)

# Añade este bloque:
if url_pdf_nuevo is None and data.get("archivo_pdf_url"):
    # Cliente subió el PDF directo a GCS y nos envía la URL final
    url_pdf_nuevo = data.get("archivo_pdf_url").strip()
    if not url_pdf_nuevo:
        url_pdf_nuevo = None
```

El resto del flujo (insertar en `ficha_importacion`, insertar detalles, actualizar `IMPORTACIONES` con `ARCHIVO_PDF_URL`) puede quedarse igual; solo asegúrate de que cuando haya `url_pdf_nuevo` (venga de archivo subido por backend o de `archivo_pdf_url`) se use esa URL.

---

## Resumen

| Paso | Quién | Acción |
|------|--------|--------|
| 1 | Frontend | GET `/api/importaciones2026/upload-url?numero_despacho=...&filename=...` |
| 2 | Backend | Responde `{ upload_url, final_url }` (generando la URL firmada con GCS) |
| 3 | Frontend | PUT al `upload_url` con el PDF (body binario, `Content-Type: application/pdf`) |
| 4 | Frontend | PUT `/api/importaciones2026?area=importacion` con JSON: `id`, `archivo_pdf_url`, `detalles`, etc. (sin archivo) |
| 5 | Backend | Usa `archivo_pdf_url` como `url_pdf_nuevo`, inserta ficha + detalles y actualiza importación |

Con esto el PDF no pasa por el servidor Next ni por el límite de tamaño de la petición; solo se transmite directamente al bucket.
