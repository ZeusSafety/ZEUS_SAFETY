-- ============================================
-- VERSIÓN SIMPLIFICADA - SIN RLS
-- Ejecuta este script primero si no necesitas políticas de seguridad todavía
-- ============================================

-- Crear la tabla
CREATE TABLE IF NOT EXISTS permisos_laborales (
    id BIGSERIAL PRIMARY KEY,
    fecha_registro TIMESTAMP NOT NULL DEFAULT NOW(),
    nombre VARCHAR(100) NOT NULL,
    fecha_inicio TIMESTAMP NOT NULL,
    fecha_fin TIMESTAMP NOT NULL,
    tipo_permiso VARCHAR(50) NOT NULL CHECK (tipo_permiso IN ('Asuntos Personales', 'Estudio ó Capacitación', 'Salud')),
    motivo TEXT NOT NULL,
    estado_solicitud VARCHAR(20) DEFAULT 'PENDIENTE' CHECK (estado_solicitud IN ('PENDIENTE', 'APROBADO', 'RECHAZADO')),
    horas_solicitadas DECIMAL(5, 2) DEFAULT 0.0,
    horas_cumplidas DECIMAL(5, 2) DEFAULT 0.0,
    horas_faltantess DECIMAL(5, 2) DEFAULT 0.0,
    archivos JSONB DEFAULT '[]'::jsonb,
    usuario_id VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Índices básicos
CREATE INDEX IF NOT EXISTS idx_permisos_usuario_id ON permisos_laborales(usuario_id);
CREATE INDEX IF NOT EXISTS idx_permisos_fecha_inicio ON permisos_laborales(fecha_inicio);
CREATE INDEX IF NOT EXISTS idx_permisos_estado ON permisos_laborales(estado_solicitud);

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para updated_at
CREATE TRIGGER update_permisos_laborales_updated_at
    BEFORE UPDATE ON permisos_laborales
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Función para calcular horas_faltantess automáticamente
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

-- Trigger para calcular horas faltantes
CREATE TRIGGER calculate_permisos_horas_faltantes
    BEFORE INSERT OR UPDATE ON permisos_laborales
    FOR EACH ROW
    EXECUTE FUNCTION calculate_horas_faltantes();

