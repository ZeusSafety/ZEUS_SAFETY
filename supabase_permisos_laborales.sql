-- ============================================
-- TABLA: permisos_laborales
-- Descripción: Almacena los permisos laborales de los colaboradores
-- ============================================

-- Crear la tabla
CREATE TABLE IF NOT EXISTS permisos_laborales (
    -- ID primario
    id BIGSERIAL PRIMARY KEY,
    
    -- Fecha de registro del permiso
    fecha_registro TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Nombre/Área del colaborador
    nombre VARCHAR(100) NOT NULL,
    
    -- Fechas del permiso
    fecha_inicio TIMESTAMP NOT NULL,
    fecha_fin TIMESTAMP NOT NULL,
    
    -- Tipo de permiso
    tipo_permiso VARCHAR(50) NOT NULL CHECK (tipo_permiso IN ('Asuntos Personales', 'Estudio ó Capacitación', 'Salud')),
    
    -- Motivo del permiso
    motivo TEXT NOT NULL,
    
    -- Estado de la solicitud
    estado_solicitud VARCHAR(20) DEFAULT 'PENDIENTE' CHECK (estado_solicitud IN ('PENDIENTE', 'APROBADO', 'RECHAZADO')),
    
    -- Horas
    horas_solicitadas DECIMAL(5, 2) DEFAULT 0.0,
    horas_cumplidas DECIMAL(5, 2) DEFAULT 0.0,
    horas_faltantess DECIMAL(5, 2) DEFAULT 0.0,
    
    -- Archivos (JSON array con URLs)
    archivos JSONB DEFAULT '[]'::jsonb,
    
    -- ID del usuario que registra el permiso
    usuario_id VARCHAR(100) NOT NULL,
    
    -- Campos de auditoría
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_permisos_usuario_id ON permisos_laborales(usuario_id);
CREATE INDEX IF NOT EXISTS idx_permisos_fecha_inicio ON permisos_laborales(fecha_inicio);
CREATE INDEX IF NOT EXISTS idx_permisos_fecha_fin ON permisos_laborales(fecha_fin);
CREATE INDEX IF NOT EXISTS idx_permisos_estado ON permisos_laborales(estado_solicitud);
CREATE INDEX IF NOT EXISTS idx_permisos_tipo ON permisos_laborales(tipo_permiso);
CREATE INDEX IF NOT EXISTS idx_permisos_nombre ON permisos_laborales(nombre);

-- Función para actualizar automáticamente el campo updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_permisos_laborales_updated_at
    BEFORE UPDATE ON permisos_laborales
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Función para calcular automáticamente horas_faltantess
CREATE OR REPLACE FUNCTION calculate_horas_faltantes()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.horas_solicitadas IS NOT NULL AND NEW.horas_cumplidas IS NOT NULL THEN
        NEW.horas_faltantess = GREATEST(0, NEW.horas_solicitadas - NEW.horas_cumplidas);
    ELSIF NEW.horas_solicitadas IS NOT NULL THEN
        NEW.horas_faltantess = NEW.horas_solicitadas;
    ELSE
        NEW.horas_faltantess = 0.0;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para calcular horas faltantes automáticamente
CREATE TRIGGER calculate_permisos_horas_faltantes
    BEFORE INSERT OR UPDATE ON permisos_laborales
    FOR EACH ROW
    EXECUTE FUNCTION calculate_horas_faltantes();

-- Comentarios en la tabla y columnas
COMMENT ON TABLE permisos_laborales IS 'Tabla que almacena los permisos laborales de los colaboradores';
COMMENT ON COLUMN permisos_laborales.id IS 'ID único del permiso';
COMMENT ON COLUMN permisos_laborales.fecha_registro IS 'Fecha y hora en que se registró el permiso';
COMMENT ON COLUMN permisos_laborales.nombre IS 'Nombre del área o colaborador';
COMMENT ON COLUMN permisos_laborales.fecha_inicio IS 'Fecha y hora de inicio del permiso';
COMMENT ON COLUMN permisos_laborales.fecha_fin IS 'Fecha y hora de fin del permiso';
COMMENT ON COLUMN permisos_laborales.tipo_permiso IS 'Tipo de permiso: Asuntos Personales, Estudio ó Capacitación, Salud';
COMMENT ON COLUMN permisos_laborales.motivo IS 'Motivo o descripción del permiso';
COMMENT ON COLUMN permisos_laborales.estado_solicitud IS 'Estado de la solicitud: PENDIENTE, APROBADO, RECHAZADO';
COMMENT ON COLUMN permisos_laborales.horas_solicitadas IS 'Número de horas solicitadas';
COMMENT ON COLUMN permisos_laborales.horas_cumplidas IS 'Número de horas cumplidas';
COMMENT ON COLUMN permisos_laborales.horas_faltantess IS 'Número de horas faltantes (calculado automáticamente)';
COMMENT ON COLUMN permisos_laborales.archivos IS 'Array JSON con URLs de archivos adjuntos';
COMMENT ON COLUMN permisos_laborales.usuario_id IS 'ID del usuario que registra el permiso';
COMMENT ON COLUMN permisos_laborales.created_at IS 'Fecha de creación del registro';
COMMENT ON COLUMN permisos_laborales.updated_at IS 'Fecha de última actualización del registro';

-- ============================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================

-- Habilitar RLS
ALTER TABLE permisos_laborales ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver sus propios permisos
CREATE POLICY "Users can view their own permisos"
    ON permisos_laborales
    FOR SELECT
    USING (auth.uid()::text = usuario_id OR usuario_id = current_setting('app.current_user_id', true));

-- Política: Los usuarios pueden insertar sus propios permisos
CREATE POLICY "Users can insert their own permisos"
    ON permisos_laborales
    FOR INSERT
    WITH CHECK (auth.uid()::text = usuario_id OR usuario_id = current_setting('app.current_user_id', true));

-- Política: Los usuarios pueden actualizar sus propios permisos
CREATE POLICY "Users can update their own permisos"
    ON permisos_laborales
    FOR UPDATE
    USING (auth.uid()::text = usuario_id OR usuario_id = current_setting('app.current_user_id', true));

-- Política: Los administradores pueden ver todos los permisos
-- (Ajusta según tu sistema de roles)
CREATE POLICY "Admins can view all permisos"
    ON permisos_laborales
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- ============================================
-- EJEMPLO DE INSERCIÓN
-- ============================================

/*
INSERT INTO permisos_laborales (
    fecha_registro,
    nombre,
    fecha_inicio,
    fecha_fin,
    tipo_permiso,
    motivo,
    estado_solicitud,
    horas_solicitadas,
    horas_cumplidas,
    horas_faltantess,
    archivos,
    usuario_id
) VALUES (
    NOW(),
    'ADMINISTRACION',
    '2024-10-07 17:00:00',
    '2024-10-07 18:00:00',
    'Asuntos Personales',
    'Cita con el banco, después de la cita, cuando me brinden el ticket de ventanilla adjuntaré la evidencia al excel compartido',
    'PENDIENTE',
    1.0,
    1.0,
    0.0,
    '[{"url": "https://drive.google.com/open?id=1EiYk8cgg1Wrn2kjcvSNxnVTZIhuvvIlk"}]'::jsonb,
    'eliaszeus'
);
*/

