"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/context/AuthContext";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";
import Modal from "../../../components/ui/Modal";

// Usar el proxy de Next.js para evitar problemas de CORS
const API_URL = "/api/solicitudes-incidencias";

export default function SolicitudesIncidenciasPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [solicitudes, setSolicitudes] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [errorAPI, setErrorAPI] = useState(null);
  
  // Filtros - Iniciar con SISTEMAS seleccionado por defecto
  const [areaRecepcion, setAreaRecepcion] = useState("SISTEMAS");
  const [colaborador, setColaborador] = useState("");
  const [estado, setEstado] = useState("");
  const [mostrarIncidencias, setMostrarIncidencias] = useState(false);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  
  // Modales
  const [modalRequerimientosOpen, setModalRequerimientosOpen] = useState(false);
  const [modalRespuestasOpen, setModalRespuestasOpen] = useState(false);
  const [modalReprogramacionesOpen, setModalReprogramacionesOpen] = useState(false);
  const [modalHistorialReqExtraOpen, setModalHistorialReqExtraOpen] = useState(false);
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [textoModal, setTextoModal] = useState("");
  const [tituloModal, setTituloModal] = useState("");
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  
  // Estados para el formulario de edición
  const [formFechaRespuesta, setFormFechaRespuesta] = useState("");
  const [formRespondidoPor, setFormRespondidoPor] = useState("");
  const [formNombrePersona, setFormNombrePersona] = useState("");
  const [formRespuesta, setFormRespuesta] = useState("");
  const [formArchivoInforme, setFormArchivoInforme] = useState(null);
  const [formArchivoNombre, setFormArchivoNombre] = useState("");
  const [formEstado, setFormEstado] = useState("");
  const [formReprogramacion, setFormReprogramacion] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Detectar si es desktop y abrir sidebar automáticamente
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cargar solicitudes desde la API
  useEffect(() => {
    if (user) {
      cargarSolicitudes();
    }
  }, [user]);

  const cargarSolicitudes = async () => {
    try {
      setLoadingData(true);
      setErrorAPI(null);
      const token = localStorage.getItem("token");
      
      // Usar el proxy de Next.js que maneja CORS y autenticación
      // El parámetro listado se pasa como query param
      const response = await fetch(`${API_URL}?listado=sistemas`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log('Datos recibidos de la API:', data);
      
      if (Array.isArray(data)) {
        setSolicitudes(data);
        setErrorAPI(null);
      } else {
        setSolicitudes([]);
        setErrorAPI(null);
      }
    } catch (error) {
      console.error("Error al obtener datos:", error);
      setSolicitudes([]);
      setErrorAPI("Error al cargar datos");
    } finally {
      setLoadingData(false);
    }
  };

  // Filtrar solicitudes dinámicamente
  const solicitudesFiltradas = useMemo(() => {
    let filtered = [...solicitudes];

    // Filtrar por área de recepción
    if (areaRecepcion) {
      filtered = filtered.filter(s => {
        const area = s.AREA_RECEPCION || s.area_recepcion || "";
        return area === areaRecepcion;
      });
    }

    // Filtrar por colaborador
    if (colaborador.trim()) {
      const term = colaborador.toLowerCase();
      filtered = filtered.filter(s => {
        const registradoPor = (s.REGISTRADO_POR || s.registrado_por || "").toLowerCase();
        return registradoPor.includes(term);
      });
    }

    // Filtrar por estado
    if (estado) {
      filtered = filtered.filter(s => {
        const estadoSolicitud = s.ESTADO || s.estado || "";
        return estadoSolicitud === estado;
      });
    }

    // Filtrar incidencias
    if (!mostrarIncidencias) {
      filtered = filtered.filter(s => {
        const incidencia = s.RES_INCIDENCIA || s.res_incidencia || "";
        return !incidencia || incidencia.trim() === "" || incidencia === "-";
      });
    } else {
      // Si mostrarIncidencias está activo, mostrar solo las que tienen incidencia
      filtered = filtered.filter(s => {
        const incidencia = s.RES_INCIDENCIA || s.res_incidencia || "";
        return incidencia && incidencia.trim() !== "" && incidencia !== "-";
      });
    }

    return filtered;
  }, [solicitudes, areaRecepcion, colaborador, estado, mostrarIncidencias]);

  // Calcular paginación
  const totalPages = Math.ceil(solicitudesFiltradas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const solicitudesPaginadas = solicitudesFiltradas.slice(startIndex, endIndex);

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [areaRecepcion, colaborador, estado, mostrarIncidencias]);

  // Funciones para modales
  const mostrarTextoEnModal = (texto, titulo) => {
    setTextoModal(texto || "No especificado.");
    setTituloModal(titulo);
    if (titulo === "Requerimientos") {
      setModalRequerimientosOpen(true);
    } else if (titulo === "Respuesta") {
      setModalRespuestasOpen(true);
    }
  };

  const verReprogramaciones = (solicitud) => {
    setSolicitudSeleccionada(solicitud);
    setModalReprogramacionesOpen(true);
  };

  const verHistorialReqExtra = (solicitud) => {
    setSolicitudSeleccionada(solicitud);
    setModalHistorialReqExtraOpen(true);
  };

  const abrirModalEditar = (solicitud) => {
    setSolicitudSeleccionada(solicitud);
    
    // Formatear fecha para el input datetime-local
    let fechaFormateada = "";
    if (solicitud.FECHA_RESPUESTA) {
      try {
        const fecha = new Date(solicitud.FECHA_RESPUESTA);
        if (!isNaN(fecha.getTime())) {
          const year = fecha.getFullYear();
          const month = String(fecha.getMonth() + 1).padStart(2, '0');
          const day = String(fecha.getDate()).padStart(2, '0');
          const hours = String(fecha.getHours()).padStart(2, '0');
          const minutes = String(fecha.getMinutes()).padStart(2, '0');
          const seconds = String(fecha.getSeconds()).padStart(2, '0');
          fechaFormateada = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
        }
      } catch (e) {
        console.error("Error al formatear fecha:", e);
      }
    }
    
    setFormFechaRespuesta(fechaFormateada);
    setFormRespondidoPor(solicitud.RESPONDIDO_POR || "");
    setFormNombrePersona(solicitud.RESPONDIDO_POR || "");
    setFormRespuesta(solicitud.RESPUESTA_R || solicitud.RESPUESTA || "");
    setFormArchivoInforme(null);
    setFormArchivoNombre(solicitud.INFORME_RESPUESTA ? "Archivo existente" : "");
    setFormEstado(solicitud.ESTADO || "Pendiente");
    setFormReprogramacion(
      solicitud.REPROGRAMACIONES && Array.isArray(solicitud.REPROGRAMACIONES) && solicitud.REPROGRAMACIONES.length > 0 ||
      solicitud.FECHA_REPROGRAMACION || solicitud.RESPUESTA_REPROGRAMACION
    );
    setModalEditarOpen(true);
  };

  const handleGuardarEdicion = async () => {
    if (!solicitudSeleccionada) return;
    
    try {
      const token = localStorage.getItem("token");
      
      // Preparar datos para enviar
      const formData = new FormData();
      formData.append('id', solicitudSeleccionada.ID_SOLICITUD || solicitudSeleccionada.id || solicitudSeleccionada.ID);
      formData.append('fecha_respuesta', formFechaRespuesta);
      formData.append('respondido_por', formRespondidoPor);
      formData.append('nombre_persona', formNombrePersona);
      formData.append('respuesta', formRespuesta);
      formData.append('estado', formEstado);
      formData.append('reprogramacion', formReprogramacion ? '1' : '0');
      
      if (formArchivoInforme) {
        formData.append('informe', formArchivoInforme);
      }
      
      // Aquí harías la llamada a la API para actualizar
      const response = await fetch(`${API_URL}`, {
        method: 'PUT',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: formData
      });
      
      if (response.ok) {
        // Recargar solicitudes
        await cargarSolicitudes();
        setModalEditarOpen(false);
        alert("Respuesta actualizada correctamente");
      } else {
        alert("Error al actualizar la respuesta");
      }
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Error al guardar los cambios");
    }
  };

  // Función para formatear fecha
  const formatFecha = (value) => {
    if (!value) return '-';
    try {
      if (value instanceof Date && !isNaN(value)) {
        return value.toLocaleString('es-PE', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }
      const str = String(value);
      const noMicros = str.includes('.') ? str.split('.')[0] : str;
      const isoish = noMicros.replace(' ', 'T');
      const d = new Date(isoish);
      if (!isNaN(d)) {
        return d.toLocaleString('es-PE', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }
      return str;
    } catch (e) {
      return String(value);
    }
  };

  // Función para obtener badge de estado
  const getEstadoBadge = (estado) => {
    if (!estado) return "bg-gray-500 border-gray-600 text-white";
    const estadoStr = String(estado).toLowerCase();
    const estados = {
      "pendiente": "bg-yellow-500 border-yellow-600 text-white",
      "en revisión": "bg-orange-500 border-orange-600 text-white",
      "en revision": "bg-orange-500 border-orange-600 text-white",
      "en proceso": "bg-blue-600 border-blue-700 text-white",
      "completado": "bg-green-600 border-green-700 text-white",
      "requiere info": "bg-cyan-500 border-cyan-600 text-white",
      "rechazada": "bg-red-600 border-red-700 text-white",
    };
    return estados[estadoStr] || "bg-gray-500 border-gray-600 text-white";
  };

  // Función para exportar PDF
  const handleExportarPDF = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      
      const doc = new jsPDF("landscape");
      
      // Título
      doc.setFontSize(14);
      doc.text("Reporte de Solicitudes e Incidencias - SISTEMAS - Zeus Safety", 14, 15);
      
      // Preparar datos para exportar
      const dataExport = solicitudesFiltradas.map(solicitud => [
        formatFecha(solicitud.FECHA_CONSULTA) || "-",
        solicitud.NUMERO_SOLICITUD || "-",
        solicitud.REGISTRADO_POR || "-",
        solicitud.AREA || "-",
        solicitud.RES_INCIDENCIA || "-",
        solicitud.AREA_RECEPCION || "-",
        formatFecha(solicitud.FECHA_RESPUESTA) || "-",
        solicitud.RESPONDIDO_POR || "-",
        solicitud.ESTADO || "-",
        solicitud.REPROGRAMACIONES && Array.isArray(solicitud.REPROGRAMACIONES) && solicitud.REPROGRAMACIONES.length > 0 ? "SI" : "NO"
      ]);
      
      // Columnas
      const headers = [
        "Fecha Consulta",
        "N° Solicitud",
        "Registrado Por",
        "Área de Envio",
        "Con Incidencia",
        "Área de Recepción",
        "Fecha Respuesta",
        "Respondido Por",
        "Estado",
        "Reprogramación"
      ];
      
      // Insertar tabla
      autoTable(doc, {
        head: [headers],
        body: dataExport,
        startY: 25,
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [23, 162, 184] }
      });
      
      // Guardar PDF
      doc.save("Reporte_Solicitudes_SISTEMAS.pdf");
    } catch (error) {
      console.error("Error al exportar PDF:", error);
      alert("Error al exportar PDF. Asegúrate de tener conexión a internet.");
    }
  };

  // Función para escapar HTML
  const escapeHtml = (text) => {
    if (text === null || text === undefined) return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, function(m) { return map[m]; });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${sidebarOpen ? "lg:ml-60 ml-0" : "ml-0"}`}>
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar" style={{ background: '#F7FAFF' }}>
          <div className="max-w-[95%] mx-auto px-4 py-4">
            {/* Botón Volver */}
            <button
              onClick={() => router.push("/sistemas")}
              className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] text-white rounded-lg font-semibold hover:shadow-md hover:scale-105 transition-all duration-200 ripple-effect relative overflow-hidden text-sm group"
            >
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver</span>
            </button>

            {/* Contenedor principal con fondo blanco */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6 mb-6">
              {/* Título con icono y API Conectada */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] rounded-xl flex items-center justify-center text-white shadow-sm">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Listado de Solicitudes/Incidencias</h1>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                      Ver y gestionar Solicitudes/Incidencias
                    </p>
                  </div>
                </div>
                <div className={`flex items-center space-x-1.5 rounded-lg px-2.5 py-1 ${
                  loadingData 
                    ? 'bg-yellow-50 border border-yellow-200' 
                    : errorAPI 
                      ? 'bg-red-50 border border-red-200' 
                      : 'bg-green-50 border border-green-200'
                }`}>
                  {loadingData ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                      <span className="text-xs font-semibold text-yellow-700">Cargando...</span>
                    </>
                  ) : errorAPI ? (
                    <>
                      <svg className="w-3.5 h-3.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs font-semibold text-red-700">Error</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs font-semibold text-green-700">API Conectada</span>
                    </>
                  )}
                </div>
              </div>

              {/* Botones de acción */}
              <div className="mb-6 flex items-center gap-3 flex-wrap">
                <button 
                  onClick={() => setModalProcedimientosOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-lg font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Procedimientos
                </button>
                
                <button 
                  onClick={handleExportarPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md text-sm ml-auto"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 2C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V7.41421C19 7.149 18.8946 6.89464 18.7071 6.70711L13.2929 1.29289C13.1054 1.10536 12.851 1 12.5858 1H6Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                    <path d="M13 1V6H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <text x="12" y="15" fontSize="6" fill="currentColor" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="0.3">PDF</text>
                  </svg>
                  Exportar a PDF
                </button>
              </div>

              {/* Filtros */}
              <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Área de Recepción
                  </label>
                  <select
                    value={areaRecepcion}
                    onChange={(e) => setAreaRecepcion(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 transition-all duration-200 hover:border-blue-300 bg-white"
                  >
                    <option value="">Todas las áreas</option>
                    <option value="LOGISTICA">LOGISTICA</option>
                    <option value="MARKETING">MARKETING</option>
                    <option value="VENTAS">VENTAS</option>
                    <option value="FACTURACION">FACTURACIÓN</option>
                    <option value="IMPORTACION">IMPORTACIÓN</option>
                    <option value="ADMINISTRACION">ADMINISTRACION</option>
                    <option value="SISTEMAS">SISTEMAS</option>
                    <option value="RECURSOS HUMANOS">RECURSOS HUMANOS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Colaborador
                  </label>
                  <input
                    type="text"
                    placeholder="Escribe un nombre..."
                    value={colaborador}
                    onChange={(e) => setColaborador(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-200 hover:border-blue-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Estado
                  </label>
                  <select
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 transition-all duration-200 hover:border-blue-300 bg-white"
                  >
                    <option value="">Todos los estados</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="En Proceso">En Proceso</option>
                    <option value="En Revisión">En Revisión</option>
                    <option value="Requiere Info">Requiere Info</option>
                    <option value="Rechazada">Rechazada</option>
                    <option value="Completado">Completado</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={mostrarIncidencias}
                        onChange={(e) => setMostrarIncidencias(e.target.checked)}
                        className="w-5 h-5 text-[#1E63F7] border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-[#1E63F7]/30 focus:ring-offset-2 focus:border-[#1E63F7] transition-all duration-200 cursor-pointer appearance-none checked:bg-[#1E63F7] checked:border-[#1E63F7] hover:border-[#1E63F7]"
                      />
                      {mostrarIncidencias && (
                        <svg
                          className="absolute top-0.5 left-0.5 w-4 h-4 text-white pointer-events-none"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-gray-800 group-hover:text-[#1E63F7] transition-colors duration-200">
                      Mostrar Incidencias
                    </span>
                  </label>
                </div>
              </div>
              </div>

              {/* Tabla */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
              {loadingData ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
                  <span className="ml-3 text-gray-600">Cargando datos...</span>
                </div>
              ) : solicitudesFiltradas.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-2">No hay solicitudes disponibles.</p>
                  <p className="text-xs text-gray-400">Verifica los filtros o contacta al administrador.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-blue-700 border-b-2 border-blue-800">
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Fecha Consulta</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">N° Solicitud</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Registrado Por</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Área de Envio</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Con Incidencia</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Informe</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Área de Recepción</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Fecha Respuesta</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Respondido Por</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Respuesta</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Estado</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Con Reprogramación / Más Respuestas</th>
                          <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {solicitudesPaginadas.map((solicitud, index) => {
                          const tieneReprogramaciones = solicitud.REPROGRAMACIONES && 
                            (Array.isArray(solicitud.REPROGRAMACIONES) ? solicitud.REPROGRAMACIONES.length > 0 : 
                             (typeof solicitud.REPROGRAMACIONES === 'string' ? JSON.parse(solicitud.REPROGRAMACIONES || '[]').length > 0 : false));
                          
                          const tieneReqExtra = solicitud.REQUERIMIENTO_2 || solicitud.REQUERIMIENTO_3 || solicitud.INFORME_2 || solicitud.INFORME_3;
                          
                          return (
                            <tr key={solicitud.ID_SOLICITUD || solicitud.id || index} className="hover:bg-slate-200 transition-colors">
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{formatFecha(solicitud.FECHA_CONSULTA)}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{solicitud.NUMERO_SOLICITUD || '-'}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{solicitud.REGISTRADO_POR || '-'}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{solicitud.AREA || '-'}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{solicitud.RES_INCIDENCIA || '-'}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => mostrarTextoEnModal(solicitud.REQUERIMIENTOS || 'No especificado.', 'Requerimientos')}
                                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-semibold transition-colors"
                                    title="Ver Requerimientos"
                                  >
                                    <svg className="w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                  </button>
                                  {solicitud.INFORME_SOLICITUD ? (
                                    <a
                                      href={solicitud.INFORME_SOLICITUD}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-[10px] font-semibold transition-colors"
                                    >
                                      <svg className="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M6 2C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V7.41421C19 7.149 18.8946 6.89464 18.7071 6.70711L13.2929 1.29289C13.1054 1.10536 12.851 1 12.5858 1H6Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                                        <path d="M13 1V6H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        <text x="12" y="15" fontSize="6" fill="currentColor" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="0.3">PDF</text>
                                      </svg>
                                      Ver archivo
                                    </a>
                                  ) : (
                                    <button className="px-2 py-1 bg-gray-400 text-white rounded text-[10px] font-semibold cursor-not-allowed">
                                      <svg className="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M6 2C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V7.41421C19 7.149 18.8946 6.89464 18.7071 6.70711L13.2929 1.29289C13.1054 1.10536 12.851 1 12.5858 1H6Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                                        <path d="M13 1V6H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        <text x="12" y="15" fontSize="6" fill="currentColor" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="0.3">PDF</text>
                                      </svg>
                                      Sin archivo
                                    </button>
                                  )}
                                  {tieneReqExtra && (
                                    <button
                                      onClick={() => verHistorialReqExtra(solicitud)}
                                      className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-[10px] font-semibold transition-colors"
                                      title="Ver respuestas adicionales"
                                    >
                                      <svg className="w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{solicitud.AREA_RECEPCION || '-'}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{formatFecha(solicitud.FECHA_RESPUESTA)}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{solicitud.RESPONDIDO_POR || '-'}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => mostrarTextoEnModal(solicitud.RESPUESTA_R || solicitud.RESPUESTA || 'No especificado.', 'Respuesta')}
                                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-semibold transition-colors"
                                    title="Ver Respuesta"
                                  >
                                    <svg className="w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                  </button>
                                  {solicitud.INFORME_RESPUESTA ? (
                                    <a
                                      href={solicitud.INFORME_RESPUESTA}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-[10px] font-semibold transition-colors"
                                    >
                                      <svg className="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M6 2C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V7.41421C19 7.149 18.8946 6.89464 18.7071 6.70711L13.2929 1.29289C13.1054 1.10536 12.851 1 12.5858 1H6Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                                        <path d="M13 1V6H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        <text x="12" y="15" fontSize="6" fill="currentColor" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="0.3">PDF</text>
                                      </svg>
                                      Ver archivo
                                    </a>
                                  ) : (
                                    <button className="px-2 py-1 bg-gray-400 text-white rounded text-[10px] font-semibold cursor-not-allowed">
                                      <svg className="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M6 2C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V7.41421C19 7.149 18.8946 6.89464 18.7071 6.70711L13.2929 1.29289C13.1054 1.10536 12.851 1 12.5858 1H6Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                                        <path d="M13 1V6H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        <text x="12" y="15" fontSize="6" fill="currentColor" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="0.3">PDF</text>
                                      </svg>
                                      Sin archivo
                                    </button>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border-2 ${getEstadoBadge(solicitud.ESTADO)}`}>
                                  {solicitud.ESTADO || 'Pendiente'}
                                </span>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                                {tieneReprogramaciones ? (
                                  <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border-2 bg-green-600 border-green-700 text-white">
                                      SI
                                    </span>
                                    <button
                                      onClick={() => verReprogramaciones(solicitud)}
                                      className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-[10px] font-semibold transition-colors"
                                      title="Ver reprogramaciones"
                                    >
                                      <svg className="w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                                      </svg>
                                    </button>
                                  </div>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border-2 bg-red-600 border-red-700 text-white">
                                    NO
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-center">
                                <button 
                                  onClick={() => abrirModalEditar(solicitud)}
                                  className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                  <span>Editar</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Paginación */}
                  <div className="bg-slate-200 px-3 py-2 flex items-center justify-between border-t-2 border-slate-300">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1 || totalPages === 0}
                      className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      «
                    </button>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1 || totalPages === 0}
                      className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      &lt;
                    </button>
                    <span className="text-[10px] text-gray-700 font-medium">
                      Página {totalPages > 0 ? currentPage : 0} de {totalPages || 1}
                    </span>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      &gt;
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      »
                    </button>
                  </div>
                </>
              )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal para ver Requerimientos/Respuestas */}
      <Modal
        isOpen={modalRequerimientosOpen || modalRespuestasOpen}
        onClose={() => {
          setModalRequerimientosOpen(false);
          setModalRespuestasOpen(false);
        }}
        title={tituloModal}
        size="md"
      >
        <div className="p-4">
          <p className="text-gray-700 whitespace-pre-wrap">{textoModal}</p>
        </div>
      </Modal>

      {/* Modal para ver Reprogramaciones */}
      <Modal
        isOpen={modalReprogramacionesOpen}
        onClose={() => {
          setModalReprogramacionesOpen(false);
          setSolicitudSeleccionada(null);
        }}
        title="Reprogramaciones / Más Respuestas"
        size="lg"
      >
        <div className="p-4 space-y-4">
          {solicitudSeleccionada && (() => {
            let reprogramaciones = [];
            
            if (solicitudSeleccionada.REPROGRAMACIONES) {
              if (Array.isArray(solicitudSeleccionada.REPROGRAMACIONES)) {
                reprogramaciones = solicitudSeleccionada.REPROGRAMACIONES;
              } else if (typeof solicitudSeleccionada.REPROGRAMACIONES === 'string') {
                try {
                  reprogramaciones = JSON.parse(solicitudSeleccionada.REPROGRAMACIONES);
                } catch (e) {
                  reprogramaciones = [];
                }
              }
            }
            
            // Si no hay array, intentar con campos planos
            if (reprogramaciones.length === 0) {
              const reprog1 = solicitudSeleccionada.FECHA_REPROGRAMACION || solicitudSeleccionada.RESPUESTA_REPROGRAMACION || solicitudSeleccionada.INFORME_REPROGRAMACION;
              const reprog2 = solicitudSeleccionada.FECHA_REPROGRAMACION_2 || solicitudSeleccionada.RESPUESTA_2 || solicitudSeleccionada.INFORME_2;
              const reprog3 = solicitudSeleccionada.FECHA_REPROGRAMACION_3 || solicitudSeleccionada.RESPUESTA_3 || solicitudSeleccionada.INFORME_3;
              
              if (reprog1) reprogramaciones.push({
                titulo: '1ra Reprogramación',
                fecha: solicitudSeleccionada.FECHA_REPROGRAMACION,
                respuesta: solicitudSeleccionada.RESPUESTA_REPROGRAMACION || solicitudSeleccionada.RESPUESTA_REPROG,
                informe: solicitudSeleccionada.INFORME_REPROGRAMACION || solicitudSeleccionada.INFORME_REPROG
              });
              if (reprog2) reprogramaciones.push({
                titulo: '2da Reprogramación',
                fecha: solicitudSeleccionada.FECHA_REPROGRAMACION_2,
                respuesta: solicitudSeleccionada.RESPUESTA_2 || solicitudSeleccionada.RESPUESTA_REPROG_2,
                informe: solicitudSeleccionada.INFORME_2 || solicitudSeleccionada.INFORME_REPROG_2
              });
              if (reprog3) reprogramaciones.push({
                titulo: '3ra Reprogramación',
                fecha: solicitudSeleccionada.FECHA_REPROGRAMACION_3,
                respuesta: solicitudSeleccionada.RESPUESTA_3 || solicitudSeleccionada.RESPUESTA_REPROG_3,
                informe: solicitudSeleccionada.INFORME_3 || solicitudSeleccionada.INFORME_REPROG_3
              });
            }
            
            if (reprogramaciones.length === 0) {
              return <div className="text-center py-4 text-gray-500">No hay reprogramaciones registradas.</div>;
            }
            
            return reprogramaciones.map((reprog, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h6 className="font-semibold text-blue-700 mb-3">
                  {reprog.titulo || `Reprogramación ${idx + 1}`}
                </h6>
                <div className="space-y-2 text-sm">
                  <p><strong>📅 Fecha:</strong> {formatFecha(reprog.FECHA_REPROGRAMACION || reprog.fecha)}</p>
                  <p><strong>📝 Motivo:</strong> {reprog.RESPUESTA_REPROG || reprog.RESPUESTA || reprog.respuesta || 'No registrada'}</p>
                  <p><strong>📄 Informe:</strong> {
                    reprog.INFORME_REPROG || reprog.INFORME || reprog.informe ? (
                      <a href={reprog.INFORME_REPROG || reprog.INFORME || reprog.informe} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Ver archivo
                      </a>
                    ) : (
                      <span className="text-gray-400">No disponible</span>
                    )
                  }</p>
                </div>
              </div>
            ));
          })()}
        </div>
      </Modal>

      {/* Modal para ver Historial de Requerimientos Extra */}
      <Modal
        isOpen={modalHistorialReqExtraOpen}
        onClose={() => {
          setModalHistorialReqExtraOpen(false);
          setSolicitudSeleccionada(null);
        }}
        title="Detalle de Respuestas adicionales"
        size="lg"
      >
        <div className="p-4 space-y-4">
          {solicitudSeleccionada && (
            <>
              {(solicitudSeleccionada.REQUERIMIENTO_2 || solicitudSeleccionada.INFORME_2) && (
                <div className="mb-4">
                  <h6 className="font-bold text-blue-700 mb-2">Respuesta 2</h6>
                  <textarea 
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm" 
                    rows="3" 
                    readOnly
                    value={solicitudSeleccionada.REQUERIMIENTO_2 || 'No registrado'}
                  />
                  {solicitudSeleccionada.FECHA_REQUERIMIENTO_2 && (
                    <p className="text-xs text-gray-500 mt-1">
                      🕒 Registrado: {formatFecha(solicitudSeleccionada.FECHA_REQUERIMIENTO_2)}
                    </p>
                  )}
                  <p className="mt-2">
                    <strong>Archivo:</strong> {
                      solicitudSeleccionada.INFORME_2 ? (
                        <a href={solicitudSeleccionada.INFORME_2} target="_blank" rel="noopener noreferrer" className="ml-2 px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold">
                          Ver archivo
                        </a>
                      ) : (
                        <span className="ml-2 text-gray-400">No registrado</span>
                      )
                    }
                  </p>
                  {solicitudSeleccionada.FECHA_INFORME_2 && (
                    <p className="text-xs text-gray-500 mt-1">
                      🕒 Última actualización de archivo: {formatFecha(solicitudSeleccionada.FECHA_INFORME_2)}
                    </p>
                  )}
                </div>
              )}
              
              {(solicitudSeleccionada.REQUERIMIENTO_3 || solicitudSeleccionada.INFORME_3) && (
                <div className="mb-4">
                  <h6 className="font-bold text-blue-700 mb-2">Respuesta 3</h6>
                  <textarea 
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm" 
                    rows="3" 
                    readOnly
                    value={solicitudSeleccionada.REQUERIMIENTO_3 || 'No registrado'}
                  />
                  {solicitudSeleccionada.FECHA_REQUERIMIENTO_3 && (
                    <p className="text-xs text-gray-500 mt-1">
                      🕒 Registrado: {formatFecha(solicitudSeleccionada.FECHA_REQUERIMIENTO_3)}
                    </p>
                  )}
                  <p className="mt-2">
                    <strong>Archivo:</strong> {
                      solicitudSeleccionada.INFORME_3 ? (
                        <a href={solicitudSeleccionada.INFORME_3} target="_blank" rel="noopener noreferrer" className="ml-2 px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold">
                          Ver archivo
                        </a>
                      ) : (
                        <span className="ml-2 text-gray-400">No registrado</span>
                      )
                    }
                  </p>
                  {solicitudSeleccionada.FECHA_INFORME_3 && (
                    <p className="text-xs text-gray-500 mt-1">
                      🕒 Última actualización de archivo: {formatFecha(solicitudSeleccionada.FECHA_INFORME_3)}
                    </p>
                  )}
                </div>
              )}
              
              {!solicitudSeleccionada.REQUERIMIENTO_2 && !solicitudSeleccionada.REQUERIMIENTO_3 && 
               !solicitudSeleccionada.INFORME_2 && !solicitudSeleccionada.INFORME_3 && (
                <div className="text-center py-4 text-gray-500">
                  No hay respuestas adicionales registradas.
                </div>
              )}
            </>
          )}
        </div>
      </Modal>

      {/* Modal de Editar Respuesta */}
      <Modal
        isOpen={modalEditarOpen}
        onClose={() => {
          setModalEditarOpen(false);
          setSolicitudSeleccionada(null);
          setFormArchivoInforme(null);
          setFormArchivoNombre("");
        }}
        title="Actualizar Respuesta"
        size="lg"
      >
        <div className="p-6 space-y-6">
          {/* Datos de la respuesta */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-bold text-gray-900">Datos de la respuesta</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Fecha y Hora Respuesta
                </label>
                <input
                  type="datetime-local"
                  value={formFechaRespuesta}
                  onChange={(e) => setFormFechaRespuesta(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-gray-900 bg-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Respondido Por
                </label>
                <select
                  value={formRespondidoPor}
                  onChange={(e) => {
                    setFormRespondidoPor(e.target.value);
                    if (e.target.value !== "OTROS") {
                      setFormNombrePersona(e.target.value);
                    }
                  }}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-gray-900 bg-white"
                >
                  <option value="">Seleccionar...</option>
                  <option value="JOSEPH">JOSEPH</option>
                  <option value="JOSELYN">JOSELYN</option>
                  <option value="OTROS">OTROS</option>
                </select>
              </div>
            </div>
            
            {formRespondidoPor === "OTROS" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre de la persona
                </label>
                <input
                  type="text"
                  value={formNombrePersona}
                  onChange={(e) => setFormNombrePersona(e.target.value)}
                  placeholder="Escribe el nombre..."
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-gray-900 bg-white"
                />
              </div>
            )}
          </div>

          {/* Respuesta */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Respuesta
            </label>
            <textarea
              value={formRespuesta}
              onChange={(e) => setFormRespuesta(e.target.value)}
              rows={4}
              placeholder="Escribe la respuesta..."
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-gray-900 bg-white resize-y"
            />
          </div>

          {/* Informe */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Informe (Archivos PDF, rar, zip)
            </label>
            <div className="flex items-center gap-3">
              <label className="flex-shrink-0">
                <input
                  type="file"
                  accept=".pdf,.rar,.zip"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setFormArchivoInforme(file);
                      setFormArchivoNombre(file.name);
                    }
                  }}
                  className="hidden"
                />
                <span className="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold cursor-pointer transition-colors shadow-sm hover:shadow-md">
                  Seleccionar archivo
                </span>
              </label>
              <span className="text-sm text-gray-600 flex-1">
                {formArchivoNombre || "Ningún archivo seleccionado"}
              </span>
            </div>
          </div>

          {/* Estado */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Estado
            </label>
            <select
              value={formEstado}
              onChange={(e) => setFormEstado(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-gray-900 bg-white"
            >
              <option value="Pendiente">Pendiente</option>
              <option value="En Revisión">En Revisión</option>
              <option value="En Proceso">En Proceso</option>
              <option value="Completado">Completado</option>
              <option value="Requiere Info">Requiere Info</option>
              <option value="Rechazada">Rechazada</option>
            </select>
          </div>

          {/* Reprogramación */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="reprogramacion"
              checked={formReprogramacion}
              onChange={(e) => setFormReprogramacion(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="reprogramacion" className="text-sm font-semibold text-gray-700 cursor-pointer">
              Reprogramación / Más Respuestas
            </label>
          </div>

          {/* Botones */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setModalEditarOpen(false);
                setSolicitudSeleccionada(null);
                setFormArchivoInforme(null);
                setFormArchivoNombre("");
              }}
              className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardarEdicion}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-sm hover:shadow-md"
            >
              Guardar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
