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
    NOMBRE_APELLIDO: '',
    DNI: '',
    FECHA_INICIO: '',
    HORA_INICIO: '',
    FECHA_FIN: '',
    HORA_FIN: '',
    TIPO_PERMISO: '',
    MOTIVO: '',
    ESTADO_SOLICITUD: 'PENDIENTE',
    HORAS_SOLICITADAS: '',
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

  // Calcular horas solicitadas automáticamente basándose en las fechas y horas
  useEffect(() => {
    if (formData.FECHA_INICIO && formData.HORA_INICIO && formData.FECHA_FIN && formData.HORA_FIN) {
      // Combinar fecha y hora de inicio
      const fechaHoraInicio = new Date(`${formData.FECHA_INICIO}T${formData.HORA_INICIO}`);
      // Combinar fecha y hora de fin
      const fechaHoraFin = new Date(`${formData.FECHA_FIN}T${formData.HORA_FIN}`);
      
      if (fechaHoraFin > fechaHoraInicio) {
        // Calcular la diferencia en milisegundos
        const diferenciaMs = fechaHoraFin - fechaHoraInicio;
        // Convertir a horas (redondear a 1 decimal)
        const horas = Math.round((diferenciaMs / (1000 * 60 * 60)) * 10) / 10;
        setFormData(prev => ({ ...prev, HORAS_SOLICITADAS: horas.toString() }));
      } else {
        setFormData(prev => ({ ...prev, HORAS_SOLICITADAS: '0.0' }));
      }
    } else {
      setFormData(prev => ({ ...prev, HORAS_SOLICITADAS: '' }));
    }
  }, [formData.FECHA_INICIO, formData.HORA_INICIO, formData.FECHA_FIN, formData.HORA_FIN]);

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
      if (!formData.NOMBRE_APELLIDO || formData.NOMBRE_APELLIDO.trim() === '') {
        throw new Error('Debe ingresar el Nombre y Apellido');
      }
      if (!formData.DNI || formData.DNI.trim() === '') {
        throw new Error('Debe ingresar el DNI');
      }
      if (!formData.FECHA_INICIO) {
        throw new Error('Debe seleccionar una Fecha de Inicio');
      }
      if (!formData.HORA_INICIO) {
        throw new Error('Debe seleccionar una Hora de Inicio');
      }
      if (!formData.FECHA_FIN) {
        throw new Error('Debe seleccionar una Fecha de Fin');
      }
      if (!formData.HORA_FIN) {
        throw new Error('Debe seleccionar una Hora de Fin');
      }
      if (!formData.TIPO_PERMISO) {
        throw new Error('Debe seleccionar un Tipo de Permiso');
      }
      if (!formData.MOTIVO || formData.MOTIVO.trim() === '') {
        throw new Error('Debe ingresar un Motivo');
      }
      // Validar que la fecha y hora fin sea posterior a la fecha y hora inicio
      const fechaHoraInicio = new Date(`${formData.FECHA_INICIO}T${formData.HORA_INICIO}`);
      const fechaHoraFin = new Date(`${formData.FECHA_FIN}T${formData.HORA_FIN}`);
      if (fechaHoraFin <= fechaHoraInicio) {
        throw new Error('La Fecha y Hora de Fin debe ser posterior a la Fecha y Hora de Inicio');
      }

      // Obtener el ID del área (usar el mapeo o un valor por defecto)
      const idAreaRecepcion = AREAS_MAP[formData.NOMBRE.toUpperCase()] || 1;
      
      // Obtener el ID del colaborador (usar el ID del usuario actual)
      // Nota: Esto debería venir de la API de colaboradores, por ahora usamos un valor temporal
      const idColaborador = user?.id || 5; // TODO: Obtener el ID real del colaborador desde la API
      
      // Mapear el tipo de permiso
      const tipoPermisoAPI = TIPO_PERMISO_MAP[formData.TIPO_PERMISO] || formData.TIPO_PERMISO.toUpperCase();
      
      // Combinar fecha y hora para el formato requerido (YYYY-MM-DD HH:mm:ss)
      const fechaInicio = `${formData.FECHA_INICIO} ${formData.HORA_INICIO}:00`;
      const fechaFin = `${formData.FECHA_FIN} ${formData.HORA_FIN}:00`;
      
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
        nombre_apellido: formData.NOMBRE_APELLIDO,
        dni: formData.DNI,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        tipo_permiso: tipoPermisoAPI,
        motivo: formData.MOTIVO,
        estado_solicitud: formData.ESTADO_SOLICITUD || 'PENDIENTE',
        horas_solicitadas: formData.HORAS_SOLICITADAS ? parseFloat(formData.HORAS_SOLICITADAS) : 0.0,
        horas_cumplidas: 0.0,
        horas_faltantess: formData.HORAS_SOLICITADAS ? parseFloat(formData.HORAS_SOLICITADAS) : 0.0,
        estado_completado: 'PENDIENTE',
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
          NOMBRE_APELLIDO: '',
          DNI: '',
          FECHA_INICIO: '',
          HORA_INICIO: '',
          FECHA_FIN: '',
          HORA_FIN: '',
          TIPO_PERMISO: '',
          MOTIVO: '',
          ESTADO_SOLICITUD: 'PENDIENTE',
          HORAS_SOLICITADAS: '',
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
            Área (NOMBRE)
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

        {/* NOMBRE_APELLIDO y DNI en grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
              Nombre y Apellido
            </label>
            <input
              type="text"
              name="NOMBRE_APELLIDO"
              value={formData.NOMBRE_APELLIDO}
              onChange={handleChange}
              required
              placeholder="Tu respuesta"
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white hover:border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-200"
              style={{ fontFamily: 'var(--font-poppins)' }}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
              DNI
            </label>
            <input
              type="text"
              name="DNI"
              value={formData.DNI}
              onChange={handleChange}
              required
              placeholder="Tu respuesta"
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white hover:border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-200"
              style={{ fontFamily: 'var(--font-poppins)' }}
            />
          </div>
        </div>

        {/* TIPO_PERMISO */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
            Tipo de Permiso
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
            Motivo
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

        {/* Cuadro de advertencia sobre horas */}
        <div className="bg-amber-50/80 border-2 border-amber-300/60 rounded-lg p-4 mb-4 backdrop-blur-sm">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-amber-900 mb-1.5" style={{ fontFamily: 'var(--font-poppins)' }}>
                ATENCIÓN CON LAS HORAS
              </h3>
              <p className="text-xs text-amber-800 leading-relaxed" style={{ fontFamily: 'var(--font-poppins)' }}>
                No es lo mismo seleccionar de <span className="font-semibold">(9:00 - 1:00)</span> que <span className="font-semibold">(9:00 - 13:00)</span>, la primera opción marcará como <span className="font-semibold">13 horas</span> de permiso y la segunda como <span className="font-semibold">4 horas</span> de permiso, por favor seleccionar de forma correcta los horarios por favor.
              </p>
            </div>
          </div>
        </div>

        {/* FECHA_INICIO y FECHA_FIN en la primera fila */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
              Fecha de Inicio
            </label>
            <input
              type="date"
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
              Fecha Fin
            </label>
            <input
              type="date"
              name="FECHA_FIN"
              value={formData.FECHA_FIN}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white hover:border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 transition-all duration-200"
              style={{ fontFamily: 'var(--font-poppins)' }}
            />
          </div>
        </div>

        {/* HORA_INICIO y HORA_FIN en la segunda fila */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
              Hora de Inicio
            </label>
            <input
              type="time"
              name="HORA_INICIO"
              value={formData.HORA_INICIO}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white hover:border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 transition-all duration-200"
              style={{ fontFamily: 'var(--font-poppins)' }}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
              Hora Fin
            </label>
            <input
              type="time"
              name="HORA_FIN"
              value={formData.HORA_FIN}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white hover:border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 transition-all duration-200"
              style={{ fontFamily: 'var(--font-poppins)' }}
            />
          </div>
        </div>

        {/* HORAS_SOLICITADAS - Calculado automáticamente */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
            Horas Solicitadas
          </label>
          <input
            type="number"
            name="HORAS_SOLICITADAS"
            value={formData.HORAS_SOLICITADAS}
            readOnly
            step="0.1"
            min="0"
            placeholder="0.0"
            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-700 font-medium cursor-not-allowed"
            style={{ fontFamily: 'var(--font-poppins)' }}
            title="Este campo se calcula automáticamente basándose en las fechas y horas de inicio y fin"
          />
          <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'var(--font-poppins)' }}>
            Calculado automáticamente
          </p>
        </div>

        {/* ARCHIVOS */}
        <div>
          <label className="block text-base font-bold text-gray-900 mb-3" style={{ fontFamily: 'var(--font-poppins)' }}>
            Adjuntar archivo de evidencia
          </label>
          
          {/* Mensajes informativos */}
          <div className="bg-blue-50/80 border border-blue-200/60 rounded-lg p-3 mb-4">
            <p className="text-xs text-blue-900 mb-2 leading-relaxed" style={{ fontFamily: 'var(--font-poppins)' }}>
              <span className="font-semibold">Se puede adjuntar como máximo 5 archivos.</span> Ejemplos de archivos de evidencia: Cita médica, Boucher, cronograma, etc.
            </p>
            <p className="text-xs text-blue-800 leading-relaxed" style={{ fontFamily: 'var(--font-poppins)' }}>
              Sube hasta 5 archivos compatibles: PDF, document o image. El tamaño máximo es de 10 MB por archivo.
            </p>
          </div>

          {/* Input de archivos con diseño mejorado */}
          <div className="relative">
            <input
              type="file"
              name="ARCHIVOS"
              onChange={(e) => {
                const nuevosArchivos = Array.from(e.target.files);
                const archivosExistentes = formData.ARCHIVOS || [];
                
                // Combinar archivos existentes con los nuevos
                const todosLosArchivos = [...archivosExistentes, ...nuevosArchivos];
                
                // Validar máximo 5 archivos en total
                if (todosLosArchivos.length > 5) {
                  setError(`Solo se pueden adjuntar máximo 5 archivos. Ya tienes ${archivosExistentes.length} archivo(s) seleccionado(s).`);
                  e.target.value = ''; // Limpiar el input
                  return;
                }
                
                // Validar tamaño máximo de 10 MB por archivo
                const archivosInvalidos = nuevosArchivos.filter(file => file.size > 10 * 1024 * 1024);
                if (archivosInvalidos.length > 0) {
                  setError(`Los siguientes archivos exceden el tamaño máximo de 10 MB: ${archivosInvalidos.map(f => f.name).join(', ')}`);
                  e.target.value = ''; // Limpiar el input
                  return;
                }
                
                // Validar que no haya archivos duplicados por nombre
                const nombresExistentes = archivosExistentes.map(f => f.name);
                const archivosDuplicados = nuevosArchivos.filter(f => nombresExistentes.includes(f.name));
                if (archivosDuplicados.length > 0) {
                  setError(`Los siguientes archivos ya están seleccionados: ${archivosDuplicados.map(f => f.name).join(', ')}`);
                  e.target.value = ''; // Limpiar el input
                  return;
                }
                
                setFormData(prev => ({ ...prev, ARCHIVOS: todosLosArchivos }));
                setError('');
                e.target.value = ''; // Limpiar el input para permitir seleccionar el mismo archivo nuevamente si es necesario
              }}
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.bmp,.webp"
              disabled={(formData.ARCHIVOS?.length || 0) >= 5}
              className="hidden"
              id="file-input"
              style={{ fontFamily: 'var(--font-poppins)' }}
            />
            <label
              htmlFor="file-input"
              className={`flex items-center justify-center space-x-2 w-full px-6 py-4 border-2 border-dashed rounded-lg transition-all duration-200 group ${
                (formData.ARCHIVOS?.length || 0) >= 5
                  ? 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-60 pointer-events-none'
                  : 'border-blue-300 bg-blue-50/30 hover:bg-blue-50/50 hover:border-blue-400 cursor-pointer'
              }`}
            >
              <svg className={`w-5 h-5 transition-colors ${
                (formData.ARCHIVOS?.length || 0) >= 5
                  ? 'text-gray-500'
                  : 'text-blue-600 group-hover:text-blue-700'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className={`text-sm font-semibold ${
                (formData.ARCHIVOS?.length || 0) >= 5
                  ? 'text-gray-600'
                  : 'text-blue-700 group-hover:text-blue-800'
              }`} style={{ fontFamily: 'var(--font-poppins)' }}>
                {(formData.ARCHIVOS?.length || 0) >= 5
                  ? 'Límite de archivos alcanzado (5/5)'
                  : `Agregar archivo${(formData.ARCHIVOS?.length || 0) > 0 ? ` (${(formData.ARCHIVOS?.length || 0)}/5)` : ''}`
                }
              </span>
            </label>
            {(formData.ARCHIVOS?.length || 0) >= 5 && (
              <p className="mt-2 text-xs text-gray-500 text-center" style={{ fontFamily: 'var(--font-poppins)' }}>
                Has alcanzado el límite máximo de 5 archivos. Elimina un archivo para agregar otro.
              </p>
            )}
          </div>

          {/* Lista de archivos seleccionados */}
          {formData.ARCHIVOS && formData.ARCHIVOS.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                Archivos seleccionados ({formData.ARCHIVOS.length}/5):
              </p>
              <div className="space-y-2">
                {formData.ARCHIVOS.map((archivo, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate" style={{ fontFamily: 'var(--font-poppins)' }}>
                          {archivo.name}
                        </p>
                        <p className="text-xs text-gray-500" style={{ fontFamily: 'var(--font-poppins)' }}>
                          {(archivo.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const nuevosArchivos = formData.ARCHIVOS.filter((_, i) => i !== index);
                        setFormData(prev => ({ ...prev, ARCHIVOS: nuevosArchivos }));
                      }}
                      className="ml-3 p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                      title="Eliminar archivo"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
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

