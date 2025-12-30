"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const API_CRUD_URL = "/api/permisos-laborales-crud";

// Mapeo de áreas a IDs (ajustar según tu base de datos)
const AREAS_MAP = {
  'ADMINISTRACION': 1,
  'LOGISTICA': 2,
  'MARKETING': 3,
  'VENTAS': 4,
  'FACTURACION': 5,
  'IMPORTACION': 6,
  'SISTEMAS': 7,
  'GERENCIA': 8,
  'RECURSOS HUMANOS': 9
};

// Mapeo de tipos de permiso del formulario a la API
const TIPO_PERMISO_MAP = {
  'Asuntos Personales': 'ASUNTOS_PERSONALES',
  'Estudio ó Capacitación': 'ESTUDIO_CAPACITACION',
  'Salud': 'MEDICO'
};

// Mapeo de usuarios
const userMapping = {
  'hervinzeus': 'HERVIN',
  'kimberly': 'KIMBERLY',
  'evelyn': 'EVELYN',
  'joseph': 'JOSEPH',
  'alvaro': 'ALVARO',
  'victorzeus': 'VICTOR',
  'manuel': 'MANUEL',
  'eliaszeus': 'ELIAS',
  'sebastianzeus': 'SEBASTIAN',
  'sandrazeus': 'SANDRA',
  'joaquinzeus': 'JOAQUIN',
  'edgarzeus': 'EDGAR'
};

// Función para obtener el nombre completo del usuario actual
function getCurrentUserFullName(user) {
  if (!user) {
    // Intentar obtener del localStorage como fallback
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        const username = parsedUser?.name || parsedUser?.email || parsedUser?.id || '';
        return userMapping[username.toLowerCase()]
          ? userMapping[username.toLowerCase()].toUpperCase()
          : username.toUpperCase();
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  const username = user.name || user.email || user.id || '';
  return userMapping[username.toLowerCase()]
    ? userMapping[username.toLowerCase()].toUpperCase()
    : username.toUpperCase();
}

// Función para obtener la fecha y hora actual en zona horaria de Perú (America/Lima, UTC-5)
function getFechaHoraPeru() {
  const now = new Date();
  
  // Usar Intl.DateTimeFormat para obtener la fecha en zona horaria de Perú
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  // Formatear la fecha
  const parts = formatter.formatToParts(now);
  const year = parts.find(p => p.type === 'year').value;
  const month = parts.find(p => p.type === 'month').value;
  const day = parts.find(p => p.type === 'day').value;
  const hours = parts.find(p => p.type === 'hour').value;
  const minutes = parts.find(p => p.type === 'minute').value;
  const seconds = parts.find(p => p.type === 'second').value;
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export default function FormularioRegistroSolicitudes({ onBack }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    FECHA_REGISTRO: '',
    NOMBRE: '',
    FECHA_INICIO: '',
    FECHA_FIN: '',
    TIPO_PERMISO: '',
    MOTIVO: '',
    ESTADO_SOLICITUD: 'PENDIENTE',
    HORAS_SOLICITADAS: '',
    HORAS_CUMPLIDAS: '',
    HORAS_FALTANTESS: '',
    ARCHIVOS: []
  });

  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [numeroGenerado, setNumeroGenerado] = useState('');

  // Inicializar fecha y hora actual en zona horaria de Perú
  useEffect(() => {
    const fechaHora = getFechaHoraPeru();
    setFormData(prev => ({ ...prev, FECHA_REGISTRO: fechaHora }));
  }, []);

  // Inicializar NOMBRE con el área del usuario actual
  useEffect(() => {
    const nombreUsuario = getCurrentUserFullName(user);
    if (nombreUsuario) {
      // El NOMBRE es el área, no el nombre del usuario
      // Por defecto, usar el área del usuario o permitir que lo seleccione
      setFormData(prev => ({ ...prev, NOMBRE: '' }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'file') {
      setFormData(prev => ({ ...prev, [name]: files[0] || null }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Calcular horas faltantes automáticamente
  useEffect(() => {
    if (formData.HORAS_SOLICITADAS && formData.HORAS_CUMPLIDAS) {
      const solicitadas = parseFloat(formData.HORAS_SOLICITADAS) || 0;
      const cumplidas = parseFloat(formData.HORAS_CUMPLIDAS) || 0;
      const faltantes = Math.max(0, solicitadas - cumplidas);
      setFormData(prev => ({ ...prev, HORAS_FALTANTESS: faltantes.toString() }));
    } else if (formData.HORAS_SOLICITADAS) {
      setFormData(prev => ({ ...prev, HORAS_FALTANTESS: formData.HORAS_SOLICITADAS }));
    }
  }, [formData.HORAS_SOLICITADAS, formData.HORAS_CUMPLIDAS]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);
    setUploadProgress(0);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      // Validaciones básicas
      if (!formData.NOMBRE) {
        throw new Error('Debe seleccionar un Área (NOMBRE)');
      }
      if (!formData.FECHA_INICIO) {
        throw new Error('Debe seleccionar una Fecha de Inicio');
      }
      if (!formData.FECHA_FIN) {
        throw new Error('Debe seleccionar una Fecha de Fin');
      }
      if (!formData.TIPO_PERMISO) {
        throw new Error('Debe seleccionar un Tipo de Permiso');
      }
      if (!formData.MOTIVO || formData.MOTIVO.trim() === '') {
        throw new Error('Debe ingresar un Motivo');
      }

      // Validar que la fecha fin sea posterior a la fecha inicio
      if (new Date(formData.FECHA_FIN) < new Date(formData.FECHA_INICIO)) {
        throw new Error('La Fecha de Fin debe ser posterior a la Fecha de Inicio');
      }

      // Obtener el ID del área (usar el mapeo o un valor por defecto)
      const idAreaRecepcion = AREAS_MAP[formData.NOMBRE.toUpperCase()] || 1;
      
      // Obtener el ID del colaborador (usar el ID del usuario actual)
      // Nota: Esto debería venir de la API de colaboradores, por ahora usamos un valor temporal
      const idColaborador = user?.id || 5; // TODO: Obtener el ID real del colaborador desde la API
      
      // Mapear el tipo de permiso
      const tipoPermisoAPI = TIPO_PERMISO_MAP[formData.TIPO_PERMISO] || formData.TIPO_PERMISO.toUpperCase();
      
      // Convertir fechas al formato requerido (YYYY-MM-DD HH:mm:ss)
      const fechaInicio = formData.FECHA_INICIO.replace('T', ' ').substring(0, 19);
      const fechaFin = formData.FECHA_FIN.replace('T', ' ').substring(0, 19);
      
      // Preparar array de archivos (por ahora solo URLs, si se suben archivos reales, se procesarían primero)
      const archivosArray = [];
      if (formData.ARCHIVOS && formData.ARCHIVOS.length > 0) {
        // Por ahora, si hay archivos, se guardarían las URLs después de subirlos
        // Por simplicidad, dejamos el array vacío o agregamos URLs si ya las tienes
        archivosArray.push("https://ejemplo.com/archivo.pdf"); // TODO: Subir archivos y obtener URLs
      }

      // Preparar el body según la especificación de la API
      const body = {
        id_area_recepcion: idAreaRecepcion,
        id_colaborador: idColaborador,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        tipo_permiso: tipoPermisoAPI,
        motivo: formData.MOTIVO,
        estado_solicitud: formData.ESTADO_SOLICITUD || 'PENDIENTE',
        horas_solicitadas: formData.HORAS_SOLICITADAS ? parseFloat(formData.HORAS_SOLICITADAS) : null,
        archivos: archivosArray
      };

      // Simular progreso de carga
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Enviar datos a la API de permisos laborales usando el método agregar_permiso
      const url = `${API_CRUD_URL}?metodo=agregar_permiso`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token?.startsWith('Bearer') ? token : `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      const result = await response.json();
      setSuccess(true);

      // Capturar el ID generado en el backend y mostrarlo
      setNumeroGenerado(result.id || result.ID || 'N/A');

      // Resetear formulario después de 2 segundos
      setTimeout(() => {
        const fechaHora = getFechaHoraPeru();
        setFormData({
          FECHA_REGISTRO: fechaHora,
          NOMBRE: '',
          FECHA_INICIO: '',
          FECHA_FIN: '',
          TIPO_PERMISO: '',
          MOTIVO: '',
          ESTADO_SOLICITUD: 'PENDIENTE',
          HORAS_SOLICITADAS: '',
          HORAS_CUMPLIDAS: '',
          HORAS_FALTANTESS: '',
          ARCHIVOS: []
        });
        setNumeroGenerado('');
        setSuccess(false);
        setUploadProgress(0);
      }, 2000);

    } catch (err) {
      setError(err.message || 'Error al registrar el permiso laboral');
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6" style={{ boxShadow: '0px 4px 12px rgba(0,0,0,0.06)', borderRadius: '14px' }}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] rounded-xl flex items-center justify-center text-white shadow-sm">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'var(--font-poppins)' }}>REGISTRO DE PERMISOS LABORALES</h1>
            <p className="text-sm text-gray-600 font-medium mt-0.5" style={{ fontFamily: 'var(--font-poppins)' }}>Complete el formulario para registrar un nuevo permiso laboral</p>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* FECHA_REGISTRO - Solo lectura */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
            Fecha de Registro
          </label>
          <input
            type="text"
            value={formData.FECHA_REGISTRO || 'Generando...'}
            readOnly
            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-700 font-medium cursor-not-allowed"
            style={{ fontFamily: 'var(--font-poppins)' }}
          />
        </div>

        {/* NOMBRE (Área) */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
            Área (NOMBRE) <span className="text-red-500">*</span>
          </label>
          <select
            name="NOMBRE"
            value={formData.NOMBRE}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white hover:border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 transition-all duration-200"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            <option value="">Selecciona un Área...</option>
            <option value="ADMINISTRACION">ADMINISTRACION</option>
            <option value="LOGISTICA">LOGISTICA</option>
            <option value="MARKETING">MARKETING</option>
            <option value="VENTAS">VENTAS</option>
            <option value="FACTURACION">FACTURACIÓN</option>
            <option value="IMPORTACION">IMPORTACIÓN</option>
            <option value="SISTEMAS">SISTEMAS</option>
            <option value="GERENCIA">GERENCIA</option>
            <option value="RECURSOS HUMANOS">RECURSOS HUMANOS</option>
          </select>
        </div>

        {/* FECHA_INICIO y FECHA_FIN en grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
              Fecha de Inicio <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              name="FECHA_INICIO"
              value={formData.FECHA_INICIO}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white hover:border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 transition-all duration-200"
              style={{ fontFamily: 'var(--font-poppins)' }}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
              Fecha de Fin <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              name="FECHA_FIN"
              value={formData.FECHA_FIN}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white hover:border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 transition-all duration-200"
              style={{ fontFamily: 'var(--font-poppins)' }}
            />
          </div>
        </div>

        {/* TIPO_PERMISO */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
            Tipo de Permiso <span className="text-red-500">*</span>
          </label>
          <select
            name="TIPO_PERMISO"
            value={formData.TIPO_PERMISO}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white hover:border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 transition-all duration-200"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            <option value="">Selecciona un Tipo de Permiso...</option>
            <option value="Asuntos Personales">Asuntos Personales</option>
            <option value="Estudio ó Capacitación">Estudio ó Capacitación</option>
            <option value="Salud">Salud</option>
          </select>
        </div>

        {/* MOTIVO */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
            Motivo <span className="text-red-500">*</span>
          </label>
          <textarea
            name="MOTIVO"
            value={formData.MOTIVO}
            onChange={handleChange}
            rows={4}
            required
            placeholder="Describa el motivo del permiso..."
            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white hover:border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-200 resize-none"
            style={{ fontFamily: 'var(--font-poppins)' }}
          />
        </div>

        {/* ESTADO_SOLICITUD */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
            Estado de la Solicitud
          </label>
          <select
            name="ESTADO_SOLICITUD"
            value={formData.ESTADO_SOLICITUD}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white hover:border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 transition-all duration-200"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            <option value="PENDIENTE">Pendiente</option>
            <option value="APROBADO">Aprobado</option>
            <option value="RECHAZADO">Rechazado</option>
          </select>
        </div>

        {/* HORAS_SOLICITADAS, HORAS_CUMPLIDAS, HORAS_FALTANTESS en grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
              Horas Solicitadas
            </label>
            <input
              type="number"
              name="HORAS_SOLICITADAS"
              value={formData.HORAS_SOLICITADAS}
              onChange={handleChange}
              step="0.5"
              min="0"
              placeholder="0.0"
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white hover:border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-200"
              style={{ fontFamily: 'var(--font-poppins)' }}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
              Horas Cumplidas
            </label>
            <input
              type="number"
              name="HORAS_CUMPLIDAS"
              value={formData.HORAS_CUMPLIDAS}
              onChange={handleChange}
              step="0.5"
              min="0"
              placeholder="0.0"
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white hover:border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-200"
              style={{ fontFamily: 'var(--font-poppins)' }}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
              Horas Faltantes
            </label>
            <input
              type="number"
              name="HORAS_FALTANTESS"
              value={formData.HORAS_FALTANTESS}
              onChange={handleChange}
              step="0.5"
              min="0"
              readOnly
              placeholder="0.0"
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-700 font-medium cursor-not-allowed"
              style={{ fontFamily: 'var(--font-poppins)' }}
            />
          </div>
        </div>

        {/* ARCHIVOS */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
            Archivos (Opcional)
          </label>
          <input
            type="file"
            name="ARCHIVOS"
            onChange={(e) => {
              const files = Array.from(e.target.files);
              setFormData(prev => ({ ...prev, ARCHIVOS: files }));
            }}
            multiple
            accept="*/*"
            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white hover:border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 transition-all duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-br file:from-[#1E63F7] file:to-[#1E63F7] file:text-white hover:file:opacity-90 file:cursor-pointer"
            style={{ fontFamily: 'var(--font-poppins)' }}
          />
          {formData.ARCHIVOS && formData.ARCHIVOS.length > 0 && (
            <div className="mt-2 space-y-1">
              {formData.ARCHIVOS.map((archivo, index) => (
                <p key={index} className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-poppins)' }}>
                  Archivo {index + 1}: <span className="font-medium">{archivo.name}</span>
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Mensajes de error y éxito */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-medium text-green-800" style={{ fontFamily: 'var(--font-poppins)' }}>
              ¡Permiso laboral registrado correctamente!
              {numeroGenerado && <span className="block mt-1">ID: {numeroGenerado}</span>}
            </p>
          </div>
        )}

        {/* Barra de progreso */}
        {loading && uploadProgress > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>Registrando permiso...</span>
              <span className="text-sm font-bold text-[#1E63F7]" style={{ fontFamily: 'var(--font-poppins)' }}>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#1E63F7] to-[#3A8DFF] h-3 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex space-x-4 pt-4">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105 active:scale-[0.98]"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] hover:from-blue-800 hover:to-blue-900 text-white font-semibold rounded-lg hover:shadow-md hover:scale-105 active:scale-[0.98] transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            {loading ? 'Registrando...' : 'Registrar Permiso'}
          </button>
        </div>
      </form>
    </div>
  );
}

