# Instrucciones para crear la tabla en Supabase

## Opción 1: Usando el SQL Editor de Supabase (Recomendado)

1. **Accede a tu proyecto en Supabase**
   - Ve a https://supabase.com
   - Inicia sesión y selecciona tu proyecto

2. **Abre el SQL Editor**
   - En el menú lateral, haz clic en "SQL Editor"
   - O ve directamente a: `https://supabase.com/dashboard/project/[TU_PROJECT_ID]/sql`

3. **Ejecuta el script**
   - Copia y pega el contenido del archivo `supabase_permisos_laborales_simple.sql`
   - Haz clic en "Run" o presiona `Ctrl + Enter` (Windows) / `Cmd + Enter` (Mac)

4. **Verifica que se creó la tabla**
   - Ve a "Table Editor" en el menú lateral
   - Deberías ver la tabla `permisos_laborales`

## Opción 2: Usando la CLI de Supabase

```bash
# Instalar Supabase CLI (si no lo tienes)
npm install -g supabase

# Iniciar sesión
supabase login

# Vincular tu proyecto
supabase link --project-ref tu-project-ref

# Ejecutar el script SQL
supabase db execute -f supabase_permisos_laborales_simple.sql
```

## Opción 3: Desde psql (PostgreSQL)

```bash
# Conectarte a tu base de datos de Supabase
psql "postgresql://postgres:[TU_PASSWORD]@db.[TU_PROJECT_REF].supabase.co:5432/postgres"

# Ejecutar el script
\i supabase_permisos_laborales_simple.sql
```

## Estructura de la tabla

La tabla `permisos_laborales` tiene los siguientes campos:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | BIGSERIAL | ID único (auto-incremental) |
| `fecha_registro` | TIMESTAMP | Fecha de registro (auto) |
| `nombre` | VARCHAR(100) | Área/Nombre del colaborador |
| `fecha_inicio` | TIMESTAMP | Fecha/hora inicio del permiso |
| `fecha_fin` | TIMESTAMP | Fecha/hora fin del permiso |
| `tipo_permiso` | VARCHAR(50) | Tipo: Asuntos Personales, Estudio ó Capacitación, Salud |
| `motivo` | TEXT | Motivo del permiso |
| `estado_solicitud` | VARCHAR(20) | Estado: PENDIENTE, APROBADO, RECHAZADO |
| `horas_solicitadas` | DECIMAL(5,2) | Horas solicitadas |
| `horas_cumplidas` | DECIMAL(5,2) | Horas cumplidas |
| `horas_faltantess` | DECIMAL(5,2) | Horas faltantes (calculado automático) |
| `archivos` | JSONB | Array JSON con URLs de archivos |
| `usuario_id` | VARCHAR(100) | ID del usuario que registra |
| `created_at` | TIMESTAMP | Fecha de creación (auto) |
| `updated_at` | TIMESTAMP | Fecha de actualización (auto) |

## Características automáticas

✅ **Horas faltantes**: Se calculan automáticamente cuando insertas o actualizas un registro
✅ **updated_at**: Se actualiza automáticamente cuando modificas un registro
✅ **Validaciones**: El tipo de permiso y estado solo aceptan valores válidos

## Ejemplo de inserción

```sql
INSERT INTO permisos_laborales (
    nombre,
    fecha_inicio,
    fecha_fin,
    tipo_permiso,
    motivo,
    estado_solicitud,
    horas_solicitadas,
    horas_cumplidas,
    archivos,
    usuario_id
) VALUES (
    'ADMINISTRACION',
    '2024-10-07 17:00:00',
    '2024-10-07 18:00:00',
    'Asuntos Personales',
    'Cita con el banco',
    'PENDIENTE',
    1.0,
    1.0,
    '[{"url": "https://drive.google.com/open?id=123"}]'::jsonb,
    'eliaszeus'
);
```

## Notas importantes

⚠️ **Si ya tienes una tabla con este nombre**, el script usará `CREATE TABLE IF NOT EXISTS`, así que no se sobrescribirá.

⚠️ **Para habilitar RLS (Row Level Security)** más adelante, ejecuta el script completo `supabase_permisos_laborales.sql` que incluye las políticas de seguridad.

## Verificar que funciona

```sql
-- Ver todos los permisos
SELECT * FROM permisos_laborales;

-- Ver estructura de la tabla
\d permisos_laborales

-- Ver triggers
SELECT * FROM pg_trigger WHERE tgrelid = 'permisos_laborales'::regclass;
```

