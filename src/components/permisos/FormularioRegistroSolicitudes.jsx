"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const API_PROXY_URL = "/api/solicitudes-incidencias";

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

// Función para obtener el número de solicitud
async function getNextSolicitudNumber(area) {
  if (!area) return '';
  
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No hay token de autenticación');
      throw new Error('No hay token de autenticación. Inicie sesión nuevamente.');
    }
    const authHeader = token.startsWith('Bearer') ? token : `Bearer ${token}`;
    
    const response = await fetch(API_PROXY_URL, { 
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({ area })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(errorData.error || `Error ${response.status}`);
    }
    
    const data = await response.json();
    return data.numeroSolicitud || '';
  } catch (error) {
    console.error('Error al obtener número de solicitud:', error);
    return '';
  }
}

export default function FormularioRegistroSolicitudes({ onBack }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    FECHA_CONSULTA: '',
    REGISTRADO_POR: '',
    AREA: '',
    NUMERO_SOLICITUD: '',
    CON_INCIDENCIA: false,
    RES_INCIDENCIA: '',
    REQUERIMIENTOS: '',
    INFORME: null,
    AREA_RECEPCION: '',
    ESTADO: 'PENDIENTE'
  });

  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loadingNumero, setLoadingNumero] = useState(false);

  // Inicializar fecha y hora actual
  useEffect(() => {
    const now = new Date();
    const fechaHora = now.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    setFormData(prev => ({ ...prev, FECHA_CONSULTA: fechaHora }));
  }, []);

  // Inicializar REGISTRADO_POR con el usuario actual
  useEffect(() => {
    const nombreUsuario = getCurrentUserFullName(user);
    if (nombreUsuario) {
      setFormData(prev => ({ ...prev, REGISTRADO_POR: nombreUsuario }));
    }
  }, [user]);

  // Obtener número de solicitud cuando cambia el área
  useEffect(() => {
    if (formData.AREA) {
      setLoadingNumero(true);
      getNextSolicitudNumber(formData.AREA).then(numero => {
        setFormData(prev => ({ ...prev, NUMERO_SOLICITUD: numero }));
        setLoadingNumero(false);
      }).catch(() => {
        setLoadingNumero(false);
      });
    } else {
      setFormData(prev => ({ ...prev, NUMERO_SOLICITUD: '' }));
    }
  }, [formData.AREA]);

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

  const handleIncidenciaChange = (e) => {
    const value = e.target.value.toUpperCase();
    setFormData(prev => ({ ...prev, RES_INCIDENCIA: value }));
  };

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
      if (!formData.AREA) {
        throw new Error('Debe seleccionar un Área de Emisión');
      }
      if (!formData.AREA_RECEPCION) {
        throw new Error('Debe seleccionar un Área de Recepción');
      }
      if (!formData.NUMERO_SOLICITUD) {
        throw new Error('No se pudo generar el número de solicitud');
      }

      // Crear FormData para enviar archivos
      const formDataToSend = new FormData();
      formDataToSend.append('REGISTRADO_POR', formData.REGISTRADO_POR);
      formDataToSend.append('NUMERO_SOLICITUD', formData.NUMERO_SOLICITUD);
      formDataToSend.append('AREA', formData.AREA);
      formDataToSend.append('REQUERIMIENTOS', formData.REQUERIMIENTOS || '');
      formDataToSend.append('AREA_RECEPCION', formData.AREA_RECEPCION);
      formDataToSend.append('ESTADO', formData.ESTADO);

      // Agregar RES_INCIDENCIA solo si CON_INCIDENCIA es true y tiene valor
      if (formData.CON_INCIDENCIA && formData.RES_INCIDENCIA) {
        formDataToSend.append('RES_INCIDENCIA', formData.RES_INCIDENCIA);
      } else {
        formDataToSend.append('RES_INCIDENCIA', '');
      }

      // Agregar archivo si existe
      if (formData.INFORME) {
        formDataToSend.append('informe', formData.INFORME);
      }

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

      // Enviar datos
      const response = await fetch(API_PROXY_URL, { 
        method: 'POST',
        headers: {
          'Authorization': token?.startsWith('Bearer') ? token : `Bearer ${token}`
        },
        body: formDataToSend
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      const result = await response.json();
      setSuccess(true);
      
      // Resetear formulario después de 2 segundos
      setTimeout(() => {
        const now = new Date();
        const fechaHora = now.toLocaleString('es-ES', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        setFormData({
          FECHA_CONSULTA: fechaHora,
          REGISTRADO_POR: getCurrentUserFullName(user) || '',
          AREA: '',
          NUMERO_SOLICITUD: '',
          CON_INCIDENCIA: false,
          RES_INCIDENCIA: '',
          REQUERIMIENTOS: '',
          INFORME: null,
          AREA_RECEPCION: '',
          ESTADO: 'PENDIENTE'
        });
        setSuccess(false);
        setUploadProgress(0);
      }, 2000);

    } catch (err) {
      setError(err.message || 'Error al registrar la solicitud');
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
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">REGISTRO DE SOLICITUDES E INCIDENCIAS</h1>
            <p className="text-sm text-gray-600 font-medium mt-0.5">Complete el formulario para registrar una nueva solicitud</p>
          </div>
        </div>
      </div>

      {/* Mensajes de error y éxito */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm font-medium text-green-800">¡Solicitud registrada correctamente!</p>
        </div>
      )}

      {/* Barra de progreso */}
      {loading && uploadProgress > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Subiendo solicitud...</span>
            <span className="text-sm font-bold text-[#1E63F7]">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#1E63F7] to-[#3A8DFF] h-3 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* FECHA_CONSULTA - Solo lectura */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2.5">
            Fecha y Hora de Consulta
          </label>
          <input
            type="text"
            value={formData.FECHA_CONSULTA}
            readOnly
            className="w-full px-4 py-3 border-2 rounded-xl bg-gray-100 border-gray-300 text-gray-700 font-medium cursor-not-allowed"
          />
        </div>

        {/* REGISTRADO_POR */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2.5">
            Registrado Por <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="REGISTRADO_POR"
            value={formData.REGISTRADO_POR}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border-2 rounded-xl bg-slate-200 border-gray-300 hover:border-gray-400 focus:ring-blue-500/30 focus:border-blue-500 focus:outline-none font-medium text-gray-900"
          />
        </div>

        {/* AREA DE EMISION */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2.5">
            Área de Emisión <span className="text-red-500">*</span>
          </label>
          <select
            name="AREA"
            value={formData.AREA}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border-2 rounded-xl bg-slate-200 border-gray-300 hover:border-gray-400 focus:ring-blue-500/30 focus:border-blue-500 focus:outline-none font-medium text-gray-900"
          >
            <option value="">Selecciona un Área...</option>
            <option value="LOGISTICA">LOGISTICA</option>
            <option value="MARKETING">MARKETING</option>
            <option value="VENTAS">VENTAS</option>
            <option value="FACTURACION">FACTURACIÓN</option>
            <option value="IMPORTACION">IMPORTACIÓN</option>
            <option value="ADMINISTRACION">ADMINISTRACION</option>
            <option value="SISTEMAS">SISTEMAS</option>
            <option value="GERENCIA">GERENCIA</option>
            <option value="RECURSOS HUMANOS">RECURSOS HUMANOS</option>
          </select>
        </div>

        {/* NUMERO_SOLICITUD - Generado automáticamente */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2.5">
            Número de Solicitud
          </label>
          <input
            type="text"
            value={loadingNumero ? 'Generando...' : formData.NUMERO_SOLICITUD}
            readOnly
            className="w-full px-4 py-3 border-2 rounded-xl bg-gray-100 border-gray-300 text-gray-700 font-medium cursor-not-allowed"
          />
        </div>

        {/* CON INCIDENCIA - Checkbox */}
        <div>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              name="CON_INCIDENCIA"
              checked={formData.CON_INCIDENCIA}
              onChange={handleChange}
              className="w-5 h-5 text-[#1E63F7] border-gray-300 rounded focus:ring-[#1E63F7] focus:ring-2"
            />
            <span className="text-sm font-semibold text-gray-800">¿Con Incidencia?</span>
          </label>
        </div>

        {/* RES_INCIDENCIA - Solo visible si CON_INCIDENCIA es true */}
        {formData.CON_INCIDENCIA && (
          <div className="animate-fadeIn">
            <label className="block text-sm font-semibold text-gray-800 mb-2.5">
              Responsable de la Incidencia
            </label>
            <input
              type="text"
              name="RES_INCIDENCIA"
              value={formData.RES_INCIDENCIA}
              onChange={handleIncidenciaChange}
              placeholder="Ingrese el nombre del responsable"
              className="w-full px-4 py-3 border-2 rounded-xl bg-slate-200 border-gray-300 hover:border-gray-400 focus:ring-blue-500/30 focus:border-blue-500 focus:outline-none font-medium text-gray-900 uppercase"
            />
          </div>
        )}

        {/* REQUERIMIENTOS */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2.5">
            Requerimientos
          </label>
          <textarea
            name="REQUERIMIENTOS"
            value={formData.REQUERIMIENTOS}
            onChange={handleChange}
            rows={4}
            placeholder="Describa los requerimientos..."
            className="w-full px-4 py-3 border-2 rounded-xl bg-slate-200 border-gray-300 hover:border-gray-400 focus:ring-blue-500/30 focus:border-blue-500 focus:outline-none font-medium text-gray-900 resize-none"
          />
        </div>

        {/* INFORME - Archivo */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2.5">
            Informe (Archivo)
          </label>
          <input
            type="file"
            name="INFORME"
            onChange={handleChange}
            accept="*/*"
            className="w-full px-4 py-3 border-2 rounded-xl bg-slate-200 border-gray-300 hover:border-gray-400 focus:ring-blue-500/30 focus:border-blue-500 focus:outline-none font-medium text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#1E63F7] file:text-white hover:file:bg-[#1E63F7] file:cursor-pointer"
          />
          {formData.INFORME && (
            <p className="mt-2 text-sm text-gray-600">
              Archivo seleccionado: <span className="font-medium">{formData.INFORME.name}</span>
            </p>
          )}
        </div>

        {/* AREA_RECEPCION */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2.5">
            Área de Recepción <span className="text-red-500">*</span>
          </label>
          <select
            name="AREA_RECEPCION"
            value={formData.AREA_RECEPCION}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border-2 rounded-xl bg-slate-200 border-gray-300 hover:border-gray-400 focus:ring-blue-500/30 focus:border-blue-500 focus:outline-none font-medium text-gray-900"
          >
            <option value="">Selecciona un Área...</option>
            <option value="LOGISTICA">LOGISTICA</option>
            <option value="MARKETING">MARKETING</option>
            <option value="VENTAS">VENTAS</option>
            <option value="FACTURACION">FACTURACIÓN</option>
            <option value="IMPORTACION">IMPORTACIÓN</option>
            <option value="ADMINISTRACION">ADMINISTRACION</option>
            <option value="SISTEMAS">SISTEMAS</option>
            <option value="GERENCIA">GERENCIA</option>
            <option value="RECURSOS HUMANOS">RECURSOS HUMANOS</option>
          </select>
        </div>

        {/* Botones */}
        <div className="flex space-x-4 pt-4">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] text-white font-semibold rounded-lg hover:shadow-md hover:scale-[1.01] transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Registrando...' : 'Registrar Solicitud'}
          </button>
        </div>
      </form>
    </div>
  );
}

