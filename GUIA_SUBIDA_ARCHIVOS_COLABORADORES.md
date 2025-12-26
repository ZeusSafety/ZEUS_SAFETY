# Guía: Implementación de Subida de Archivos para Colaboradores

## Resumen del Flujo (Basado en Productos)

En el sistema de productos, se utilizan **2 APIs** para subir y guardar imágenes:

1. **API de Subida de Archivos** (Google Cloud Storage)
2. **API de Base de Datos** (Actualizar registro)

---

## 📋 APIs Utilizadas

### 1. API de Subida de Archivos (Storage)

**URL Base:**
```
https://api-subida-archivos-2946605267.us-central1.run.app
```

**Para Productos:**
```
POST https://api-subida-archivos-2946605267.us-central1.run.app?bucket_name=archivos_sistema&folder_bucket=productos&method=no_encriptar
```

**Para Colaboradores:**
```
POST https://api-subida-archivos-2946605267.us-central1.run.app?bucket_name=archivos_colaboradores&folder_bucket=ZEUS_1&method=encriptar
```

**Parámetros:**
- `bucket_name`: Nombre del bucket en Google Cloud Storage
- `folder_bucket`: Carpeta dentro del bucket
- `method`: `encriptar` o `no_encriptar`

**Request:**
- Method: `POST`
- Body: `FormData` con el campo `file`
- Headers: No requiere Authorization (público)

**Response:**
```json
{
  "url": "https://storage.googleapis.com/archivos_colaboradores/ZEUS_1/archivo_encriptado.jpg"
}
```

---

### 2. API de Base de Datos (Backend)

**Para Productos:**
```
PUT /api/productos?method=ACTUALIZAR_IMAGEN_PRODUCTO
```

**Para Colaboradores (a implementar):**
```
PUT /api/colaboradores?method=ACTUALIZAR_IMAGEN_COLABORADOR
```

**Request Body:**
```json
{
  "id": 1,
  "ID": 1,
  "IMAGE_URL": "https://storage.googleapis.com/archivos_colaboradores/ZEUS_1/archivo.jpg",
  "NOMBRE": "Foto de Perfil",
  "TIPO": "FOTOCHECK"
}
```

---

## 🔄 Flujo Completo de Implementación

### Paso 1: Subir Archivo a Storage

```javascript
// 1. Crear FormData
const formData = new FormData();
formData.append('file', archivoSeleccionado);

// 2. Subir a Google Cloud Storage
const uploadResponse = await fetch(
  `https://api-subida-archivos-2946605267.us-central1.run.app?bucket_name=archivos_colaboradores&folder_bucket=ZEUS_1&method=encriptar`,
  {
    method: 'POST',
    body: formData,
  }
);

// 3. Obtener URL de la respuesta
const uploadData = await uploadResponse.json();
const imageUrl = uploadData.url;
```

### Paso 2: Guardar URL en Base de Datos

```javascript
// 1. Obtener token de autenticación
const token = localStorage.getItem("token");

// 2. Actualizar en base de datos
const updateResponse = await fetch(
  `/api/colaboradores?method=ACTUALIZAR_IMAGEN_COLABORADOR`,
  {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      id: colaboradorId,
      ID: colaboradorId,
      IMAGE_URL: imageUrl,
      NOMBRE: "Foto de Perfil",
      TIPO: "FOTOCHECK"
    })
  }
);
```

---

## 🗄️ Estructura de Base de Datos

### Tabla: `imagenes_colaboradores` (o similar)

Según la imagen proporcionada, la estructura es:

```sql
CREATE TABLE imagenes_colaboradores (
    ID INT PRIMARY KEY AUTO_INCREMENT,
    ID_COLABORADOR INT NOT NULL,
    NOMBRE VARCHAR(255) DEFAULT 'Foto de Perfil',
    TIPO VARCHAR(50) DEFAULT 'FOTOCHECK',
    IMAGE_URL TEXT NOT NULL,
    ESTADO INT DEFAULT 1,
    FOREIGN KEY (ID_COLABORADOR) REFERENCES colaboradores(ID)
);
```

### Campos por Defecto:
- `NOMBRE`: "Foto de Perfil"
- `TIPO`: "FOTOCHECK"
- `ESTADO`: 1 (activo)

---

## 📝 Comandos SQL

### 1. Crear Tabla (si no existe)

```sql
CREATE TABLE IF NOT EXISTS imagenes_colaboradores (
    ID INT PRIMARY KEY AUTO_INCREMENT,
    ID_COLABORADOR INT NOT NULL,
    NOMBRE VARCHAR(255) DEFAULT 'Foto de Perfil',
    TIPO VARCHAR(50) DEFAULT 'FOTOCHECK',
    IMAGE_URL TEXT NOT NULL,
    ESTADO INT DEFAULT 1,
    FECHA_CREACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FECHA_ACTUALIZACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ID_COLABORADOR) REFERENCES colaboradores(ID) ON DELETE CASCADE
);
```

### 2. INSERT - Insertar Nueva Imagen

```sql
INSERT INTO imagenes_colaboradores 
    (ID_COLABORADOR, NOMBRE, TIPO, IMAGE_URL, ESTADO)
VALUES 
    (?, 'Foto de Perfil', 'FOTOCHECK', ?, 1);
```

**Parámetros:**
- `ID_COLABORADOR`: ID del colaborador
- `IMAGE_URL`: URL obtenida de la API de subida

### 3. UPDATE - Actualizar Imagen Existente

```sql
UPDATE imagenes_colaboradores 
SET 
    IMAGE_URL = ?,
    NOMBRE = ?,
    TIPO = ?,
    FECHA_ACTUALIZACION = CURRENT_TIMESTAMP
WHERE 
    ID_COLABORADOR = ? 
    AND ESTADO = 1;
```

**Parámetros:**
- `IMAGE_URL`: Nueva URL de la imagen
- `NOMBRE`: "Foto de Perfil" (o el que se quiera)
- `TIPO`: "FOTOCHECK" (o el que se quiera)
- `ID_COLABORADOR`: ID del colaborador

### 4. SELECT - Obtener Imagen del Colaborador

```sql
SELECT 
    ID,
    ID_COLABORADOR,
    NOMBRE,
    TIPO,
    IMAGE_URL,
    ESTADO
FROM imagenes_colaboradores
WHERE 
    ID_COLABORADOR = ?
    AND ESTADO = 1
ORDER BY FECHA_CREACION DESC
LIMIT 1;
```

### 5. GET - Obtener Todas las Imágenes de un Colaborador

```sql
SELECT 
    ID,
    ID_COLABORADOR,
    NOMBRE,
    TIPO,
    IMAGE_URL,
    ESTADO,
    FECHA_CREACION
FROM imagenes_colaboradores
WHERE 
    ID_COLABORADOR = ?
    AND ESTADO = 1
ORDER BY FECHA_CREACION DESC;
```

---

## 🔌 Endpoints del Backend a Implementar

### 1. GET - Obtener Imagen del Colaborador

**URL:**
```
GET /api/colaboradores?method=obtener_imagen_colaborador&id_colaborador={id}
```

**Response:**
```json
{
  "id": 1,
  "id_colaborador": 1,
  "nombre": "Foto de Perfil",
  "tipo": "FOTOCHECK",
  "image_url": "https://storage.googleapis.com/...",
  "estado": 1
}
```

### 2. POST - Insertar Nueva Imagen

**URL:**
```
POST /api/colaboradores?method=insertar_imagen_colaborador
```

**Body:**
```json
{
  "id_colaborador": 1,
  "image_url": "https://storage.googleapis.com/...",
  "nombre": "Foto de Perfil",
  "tipo": "FOTOCHECK"
}
```

**Response:**
```json
{
  "success": true,
  "id": 1,
  "message": "Imagen insertada exitosamente"
}
```

### 3. PUT - Actualizar Imagen Existente

**URL:**
```
PUT /api/colaboradores?method=actualizar_imagen_colaborador
```

**Body:**
```json
{
  "id_colaborador": 1,
  "image_url": "https://storage.googleapis.com/...",
  "nombre": "Foto de Perfil",
  "tipo": "FOTOCHECK"
}
```

**Response:**
```json
{
  "success": true,
  "filas_afectadas": 1,
  "message": "Imagen actualizada exitosamente"
}
```

---

## 🎯 Lógica del Backend

### Flujo Recomendado:

1. **Al insertar/actualizar:**
   - Verificar si existe registro con `ID_COLABORADOR` y `ESTADO = 1`
   - Si existe → UPDATE
   - Si no existe → INSERT

2. **Al obtener:**
   - Buscar registro más reciente con `ID_COLABORADOR` y `ESTADO = 1`
   - Retornar `IMAGE_URL` o `null` si no existe

---

## 📌 URLs Completas para Colaboradores

### API de Subida de Archivos:
```
POST https://api-subida-archivos-2946605267.us-central1.run.app?bucket_name=archivos_colaboradores&folder_bucket=ZEUS_1&method=encriptar
```

### API de Base de Datos (Backend):
```
GET    /api/colaboradores?method=obtener_imagen_colaborador&id_colaborador={id}
POST   /api/colaboradores?method=insertar_imagen_colaborador
PUT    /api/colaboradores?method=actualizar_imagen_colaborador
```

---

## ✅ Resumen para Cursor

**Pregunta:** ¿Cuántas APIs necesitaste en productos?

**Respuesta:** **2 APIs**

1. **API de Subida de Archivos** (Google Cloud Storage):
   - URL: `https://api-subida-archivos-2946605267.us-central1.run.app`
   - Para colaboradores: `?bucket_name=archivos_colaboradores&folder_bucket=ZEUS_1&method=encriptar`
   - Método: `POST`
   - Body: `FormData` con campo `file`
   - Retorna: `{ "url": "..." }`

2. **API de Base de Datos** (Backend):
   - Endpoint: `/api/colaboradores?method=actualizar_imagen_colaborador`
   - Método: `PUT`
   - Body: `{ id_colaborador, image_url, nombre, tipo }`
   - Actualiza/Inserta en tabla `imagenes_colaboradores`

**Flujo:**
1. Subir archivo → Obtener URL
2. Guardar URL en BD con nombre y tipo por defecto

**Campos por defecto:**
- `NOMBRE`: "Foto de Perfil"
- `TIPO`: "FOTOCHECK"

