"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../../../components/context/AuthContext";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";
import Modal from "../../../components/ui/Modal";

// Usar el proxy de Next.js para evitar problemas de CORS
const API_URL = "/api/solicitudes-incidencias";

export default function SolicitudesIncidenciasLogisticaPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [solicitudes, setSolicitudes] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [errorAPI, setErrorAPI] = useState(null);
  
  // Mapeo de módulos a áreas de emisión
  const getAreaEmisionByModule = (path) => {
    if (path.includes("/gerencia/")) return ""; // Todas las áreas
    if (path.includes("/logistica/")) return "LOGISTICA";
    if (path.includes("/marketing/")) return "MARKETING";
    if (path.includes("/ventas/")) return "VENTAS";
    if (path.includes("/facturacion/")) return "FACTURACION";
    if (path.includes("/importacion/")) return "IMPORTACION";
    if (path.includes("/administracion/")) return "ADMINISTRACION";
    if (path.includes("/sistemas/")) return "SISTEMAS";
    if (path.includes("/recursos-humanos/")) return "RECURSOS HUMANOS";
    return ""; // Por defecto todas las áreas
  };
  
  // Filtros - Iniciar vacío para mostrar todas las áreas por defecto
  const [areaRecepcion, setAreaRecepcion] = useState("");

  // Filtros adicionales
  const [areaEmision, setAreaEmision] = useState(() => getAreaEmisionByModule(pathname || ""));
  const [colaborador, setColaborador] = useState("");
  const [estado, setEstado] = useState("");
  const [mostrarIncidencias, setMostrarIncidencias] = useState(false);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Modales
  const [modalRequerimientosOpen, setModalRequerimientosOpen] = useState(false);
  const [modalRespuestasOpen, setModalRespuestasOpen] = useState(false);
  const [modalReprogramacionesOpen, setModalReprogramacionesOpen] = useState(false);
  const [modalHistorialReqExtraOpen, setModalHistorialReqExtraOpen] = useState(false);
  const [modalProcedimientosOpen, setModalProcedimientosOpen] = useState(false);
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

  // Estados para el modal de Gestión de Requerimientos
  const [modalGestionRequerimientosOpen, setModalGestionRequerimientosOpen] = useState(false);
  const [formRequerimiento2, setFormRequerimiento2] = useState("");
  const [formRequerimiento3, setFormRequerimiento3] = useState("");
  const [formArchivo2, setFormArchivo2] = useState(null);
  const [formArchivo3, setFormArchivo3] = useState(null);
  const [mostrarRespuesta3, setMostrarRespuesta3] = useState(false);
  const [guardandoRequerimientos, setGuardandoRequerimientos] = useState(false);

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
      
      // Obtener todas las solicitudes de todas las áreas
      // Hacer múltiples llamadas para obtener solicitudes de todas las áreas
      const areas = ["logistica", "sistemas", "marketing", "ventas", "facturacion", "importacion", "administracion", "recursos-humanos"];
      const todasLasSolicitudes = [];
      
      // Hacer llamadas en paralelo para obtener todas las solicitudes
      const promesas = areas.map(async (area) => {
        try {
          const response = await fetch(`${API_URL}?listado=${area}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` })
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data)) {
              return data;
            }
          }
          return [];
        } catch (error) {
          console.error(`Error al obtener solicitudes de ${area}:`, error);
          return [];
        }
      });
      
      const resultados = await Promise.all(promesas);
      // Combinar todas las solicitudes y eliminar duplicados por ID
      const solicitudesUnicas = new Map();
      resultados.flat().forEach(solicitud => {
        const id = solicitud.ID_SOLICITUD || solicitud.id || solicitud.ID || solicitud.NUMERO_SOLICITUD;
        if (id && !solicitudesUnicas.has(id)) {
          solicitudesUnicas.set(id, solicitud);
        }
      });
      
      const data = Array.from(solicitudesUnicas.values());
      console.log('Datos recibidos de la API (todas las áreas):', data);
      
      setSolicitudes(data);
      setErrorAPI(null);
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

    // Filtrar por área de recepción (solo si hay un valor seleccionado)
    if (areaRecepcion && areaRecepcion.trim() !== "") {
      filtered = filtered.filter(s => {
        // Buscar el área en múltiples campos posibles
        const area = s.AREA_RECEPCION || s.area_recepcion || s.AREA_RECEPCION || s.AREA || s.area || "";
        return area && area.trim() !== "" && area.toUpperCase() === areaRecepcion.toUpperCase();
      });
    }

    // Filtrar por área de Emision (solo si hay un valor seleccionado)
    if (areaEmision && areaEmision.trim() !== "") {
      filtered = filtered.filter(s => {
        // Buscar el área en el campo AREA (que es el área de envío/emisión)
        const area = s.AREA || s.area || "";
        return area && area.trim() !== "" && area.toUpperCase() === areaEmision.toUpperCase();
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
  }, [solicitudes, areaRecepcion,areaEmision, colaborador, estado, mostrarIncidencias]);

  // Calcular paginación
  const totalPages = Math.ceil(solicitudesFiltradas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const solicitudesPaginadas = solicitudesFiltradas.slice(startIndex, endIndex);

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [areaRecepcion, areaEmision, colaborador, estado, mostrarIncidencias]);

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

  const abrirModalGestionRequerimientos = (solicitud) => {
    setSolicitudSeleccionada(solicitud);
    
    // Cargar datos existentes
    setFormRequerimiento2(solicitud.REQUERIMIENTO_2 || solicitud.requerimiento_2 || "");
    setFormRequerimiento3(solicitud.REQUERIMIENTO_3 || solicitud.requerimiento_3 || "");
    setFormArchivo2(null);
    setFormArchivo3(null);
    
    // Mostrar Respuesta 3 si ya tiene datos
    setMostrarRespuesta3(!!(solicitud.REQUERIMIENTO_3 || solicitud.requerimiento_3 || solicitud.INFORME_3 || solicitud.informe3));
    
    setModalGestionRequerimientosOpen(true);
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
      // Por ahora solo actualizamos el estado local
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

  const descargarPDF = (url, nombreArchivo) => {
    try {
      // Usar window.open para evitar problemas de CORS
      const link = document.createElement('a');
      link.href = url;
      link.download = nombreArchivo || 'informe.pdf';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error al descargar PDF:', error);
      // Si falla, intentar abrir directamente
      window.open(url, '_blank');
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
      doc.text("Reporte de Solicitudes e Incidencias - LOGISTICA - Zeus Safety", 14, 15);
      
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
      doc.save("Reporte_Solicitudes_LOGISTICA.pdf");
    } catch (error) {
      console.error("Error al exportar PDF:", error);
      alert("Error al exportar PDF. Asegúrate de tener conexión a internet.");
    }
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
              onClick={() => router.push("/logistica")}
              className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-lg font-medium hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm ripple-effect relative overflow-hidden text-sm group"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver a Logística</span>
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
                    <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>Listado de Solicitudes/Incidencias</h1>
                    <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: 'var(--font-poppins)' }}>
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
                <div hidden>
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
                    Área de Emisión
                  </label>
                  <select
                    value={areaEmision}
                    onChange={(e) => setAreaEmision(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 font-medium transition-all duration-200 hover:border-blue-300 bg-white cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%231E63F7%22 stroke-width=%222.5%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpath d=%22M6 9l6 6 6-6%22/%3E%3C/svg%3E')] bg-no-repeat bg-right pr-10 shadow-sm"
                    style={{
                      backgroundPosition: 'right 0.75rem center',
                      backgroundSize: '1.25rem 1.25rem',
                      paddingRight: '2.5rem'
                    }}
                  >
                    <option value="" className="py-2 px-3 text-gray-900 font-medium bg-white hover:bg-blue-50">Todas las áreas</option>
                    <option value="LOGISTICA" className="py-2 px-3 text-gray-900 font-medium bg-white hover:bg-blue-50">LOGISTICA</option>
                    <option value="MARKETING" className="py-2 px-3 text-gray-900 font-medium bg-white hover:bg-blue-50">MARKETING</option>
                    <option value="VENTAS" className="py-2 px-3 text-gray-900 font-medium bg-white hover:bg-blue-50">VENTAS</option>
                    <option value="FACTURACION" className="py-2 px-3 text-gray-900 font-medium bg-white hover:bg-blue-50">FACTURACIÓN</option>
                    <option value="IMPORTACION" className="py-2 px-3 text-gray-900 font-medium bg-white hover:bg-blue-50">IMPORTACIÓN</option>
                    <option value="ADMINISTRACION" className="py-2 px-3 text-gray-900 font-medium bg-white hover:bg-blue-50">ADMINISTRACION</option>
                    <option value="SISTEMAS" className="py-2 px-3 text-gray-900 font-medium bg-white hover:bg-blue-50">SISTEMAS</option>
                    <option value="RECURSOS HUMANOS" className="py-2 px-3 text-gray-900 font-medium bg-white hover:bg-blue-50">RECURSOS HUMANOS</option>
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
                  <div className="overflow-x-auto justify-center text-center">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gradient-to-r from-blue-700 to-blue-800 border-b-2 border-blue-900">
                          <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Fecha Consulta</th>
                          <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>N° Solicitud</th>
                          <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Registrado Por</th>
                          <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Área de Envio</th>
                          <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Con Incidencia</th>
                          <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Informe</th>
                          <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Área de Recepción</th>
                          <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Fecha Respuesta</th>
                          <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Respondido Por</th>
                          <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Respuesta</th>
                          <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Estado</th>
                          <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Con Reprogramación / Más Respuestas</th>
                          <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {solicitudesPaginadas.map((solicitud, index) => {
                          const tieneReprogramaciones = solicitud.REPROGRAMACIONES && 
                            (Array.isArray(solicitud.REPROGRAMACIONES) ? solicitud.REPROGRAMACIONES.length > 0 : 
                             (typeof solicitud.REPROGRAMACIONES === 'string' ? JSON.parse(solicitud.REPROGRAMACIONES || '[]').length > 0 : false));
                          
                          const tieneReqExtra = solicitud.REQUERIMIENTO_2 || solicitud.REQUERIMIENTO_3 || solicitud.INFORME_2 || solicitud.INFORME_3;
                          
                          return (
                            <tr key={solicitud.ID_SOLICITUD || solicitud.id || index} className="hover:bg-blue-50 transition-colors border-b border-gray-100">
                              <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{formatFecha(solicitud.FECHA_CONSULTA)}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{solicitud.NUMERO_SOLICITUD || '-'}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{solicitud.REGISTRADO_POR || '-'}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{solicitud.AREA || '-'}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{solicitud.RES_INCIDENCIA || '-'}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => mostrarTextoEnModal(solicitud.REQUERIMIENTOS || 'No especificado.', 'Requerimientos')}
                                    className="inline-flex items-center space-x-1 px-2.5 py-1 bg-gradient-to-br from-cyan-500 to-cyan-600 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                                    title="Ver Requerimientos"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" style={{pointerEvents: 'none'}}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    <span style={{pointerEvents: 'none'}}>Ver</span>
                                  </button>
                                  {solicitud.INFORME_SOLICITUD ? (
                                    <a
                                      href={solicitud.INFORME_SOLICITUD}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none bg-gradient-to-br from-red-500 to-red-600 text-white"
                                      title="Ver archivo PDF"
                                    >
                                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{pointerEvents: 'none'}}>
                                        <path d="M6 2C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V7.41421C19 7.149 18.8946 6.89464 18.7071 6.70711L13.2929 1.29289C13.1054 1.10536 12.851 1 12.5858 1H6Z" stroke="currentColor" strokeWidth="1.5" fill="none"></path>
                                        <path d="M13 1V6H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                                        <text x="12" y="15" fontSize="6" fill="currentColor" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="0.3">PDF</text>
                                      </svg>
                                      <span style={{pointerEvents: 'none'}}>PDF</span>
                                    </a>
                                  ) : (
                                    <button className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold cursor-not-allowed opacity-50 bg-gray-400 text-white">
                                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{pointerEvents: 'none'}}>
                                        <path d="M6 2C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V7.41421C19 7.149 18.8946 6.89464 18.7071 6.70711L13.2929 1.29289C13.1054 1.10536 12.851 1 12.5858 1H6Z" stroke="currentColor" strokeWidth="1.5" fill="none"></path>
                                        <path d="M13 1V6H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                                        <text x="12" y="15" fontSize="6" fill="currentColor" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="0.3">PDF</text>
                                      </svg>
                                      <span style={{pointerEvents: 'none'}}>PDF</span>
                                    </button>
                                  )}
                                  {tieneReqExtra && (
                                    <button
                                      onClick={() => verHistorialReqExtra(solicitud)}
                                      className="inline-flex items-center space-x-1 px-2.5 py-1 bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                                      title="Ver respuestas adicionales"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" style={{pointerEvents: 'none'}}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                                      </svg>
                                      <span style={{pointerEvents: 'none'}}>Extra</span>
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
                                    className="inline-flex items-center space-x-1 px-2.5 py-1 bg-gradient-to-br from-cyan-500 to-cyan-600 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                                    title="Ver Respuesta"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" style={{pointerEvents: 'none'}}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    <span style={{pointerEvents: 'none'}}>Ver</span>
                                  </button>
                                  {solicitud.INFORME_RESPUESTA ? (
                                    <a
                                      href={solicitud.INFORME_RESPUESTA}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none bg-gradient-to-br from-red-500 to-red-600 text-white"
                                      title="Ver archivo PDF"
                                    >
                                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{pointerEvents: 'none'}}>
                                        <path d="M6 2C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V7.41421C19 7.149 18.8946 6.89464 18.7071 6.70711L13.2929 1.29289C13.1054 1.10536 12.851 1 12.5858 1H6Z" stroke="currentColor" strokeWidth="1.5" fill="none"></path>
                                        <path d="M13 1V6H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                                        <text x="12" y="15" fontSize="6" fill="currentColor" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="0.3">PDF</text>
                                      </svg>
                                      <span style={{pointerEvents: 'none'}}>PDF</span>
                                    </a>
                                  ) : (
                                    <button className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold cursor-not-allowed opacity-50 bg-gray-400 text-white">
                                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{pointerEvents: 'none'}}>
                                        <path d="M6 2C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V7.41421C19 7.149 18.8946 6.89464 18.7071 6.70711L13.2929 1.29289C13.1054 1.10536 12.851 1 12.5858 1H6Z" stroke="currentColor" strokeWidth="1.5" fill="none"></path>
                                        <path d="M13 1V6H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                                        <text x="12" y="15" fontSize="6" fill="currentColor" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="0.3">PDF</text>
                                      </svg>
                                      <span style={{pointerEvents: 'none'}}>PDF</span>
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
                                  <div className="flex items-center gap-2 justify-center text-center">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border-2 bg-green-600 border-green-700 text-white">
                                      SI
                                    </span>
                                    <button
                                      onClick={() => verReprogramaciones(solicitud)}
                                      className="inline-flex items-center space-x-1 px-2.5 py-1 bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                                      title="Ver reprogramaciones"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" style={{pointerEvents: 'none'}}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                                      </svg>
                                      <span style={{pointerEvents: 'none'}}>Ver</span>
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
                                  onClick={() => abrirModalGestionRequerimientos(solicitud)}
                                  className="inline-flex items-center space-x-1 px-2.5 py-1 bg-gradient-to-br from-cyan-500 to-cyan-600 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                                  title="Gestionar requerimientos"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" style={{pointerEvents: 'none'}}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                  <span style={{pointerEvents: 'none'}}>Editar</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Paginación */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 flex items-center justify-between border-t border-gray-200">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1 || totalPages === 0}
                      className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                    >
                      «
                    </button>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1 || totalPages === 0}
                      className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                    >
                      &lt;
                    </button>
                    <span className="text-xs text-gray-700 font-semibold" style={{ fontFamily: 'var(--font-poppins)' }}>
                      Página {totalPages > 0 ? currentPage : 0} de {totalPages || 1}
                    </span>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                    >
                      &gt;
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                      style={{ fontFamily: 'var(--font-poppins)' }}
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
        <div className="p-6">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-gray-900 whitespace-pre-wrap leading-relaxed text-sm font-normal">{textoModal}</p>
          </div>
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
              return (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-3">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-medium">No hay reprogramaciones registradas.</p>
                </div>
              );
            }
            
            return reprogramaciones.map((reprog, idx) => (
              <div key={idx} className="border-2 border-blue-200 rounded-xl p-5 bg-gradient-to-br from-white to-blue-50/30 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-blue-200">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{idx + 1}</span>
                  </div>
                  <h6 className="font-bold text-blue-800 text-base">
                    {reprog.titulo || `Reprogramación ${idx + 1}`}
                  </h6>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 mt-0.5 flex-shrink-0">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Fecha</p>
                      <p className="text-sm font-medium text-gray-900">{formatFecha(reprog.FECHA_REPROGRAMACION || reprog.fecha)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 mt-0.5 flex-shrink-0">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Motivo</p>
                      <p className="text-sm text-gray-900 leading-relaxed bg-white rounded-lg p-3 border border-gray-200">
                        {reprog.RESPUESTA_REPROG || reprog.RESPUESTA || reprog.respuesta || 'No registrada'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 mt-0.5 flex-shrink-0">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Informe</p>
                      {reprog.INFORME_REPROG || reprog.INFORME || reprog.informe ? (
                        <a 
                          href={reprog.INFORME_REPROG || reprog.INFORME || reprog.informe} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm hover:shadow-md"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Ver archivo
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          No disponible
                        </span>
                      )}
                    </div>
                  </div>
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
                <div className="mb-6 border-2 border-blue-200 rounded-xl p-5 bg-gradient-to-br from-white to-blue-50/30 shadow-sm">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-blue-200">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">2</span>
                    </div>
                    <h6 className="font-bold text-blue-800 text-base">Respuesta 2</h6>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Contenido</p>
                      <textarea 
                        className="w-full p-3 border-2 border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-blue-500" 
                        rows="4" 
                        readOnly
                        value={solicitudSeleccionada.REQUERIMIENTO_2 || 'No registrado'}
                      />
                    </div>
                    {solicitudSeleccionada.FECHA_REQUERIMIENTO_2 && (
                      <div className="flex items-center gap-2 text-xs">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-gray-700 font-medium">Registrado: {formatFecha(solicitudSeleccionada.FECHA_REQUERIMIENTO_2)}</span>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Archivo</p>
                      {solicitudSeleccionada.INFORME_2 ? (
                        <a 
                          href={solicitudSeleccionada.INFORME_2} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm hover:shadow-md"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Ver archivo
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          No registrado
                        </span>
                      )}
                    </div>
                    {solicitudSeleccionada.FECHA_INFORME_2 && (
                      <div className="flex items-center gap-2 text-xs">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-gray-700 font-medium">Última actualización: {formatFecha(solicitudSeleccionada.FECHA_INFORME_2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {(solicitudSeleccionada.REQUERIMIENTO_3 || solicitudSeleccionada.INFORME_3) && (
                <div className="mb-6 border-2 border-blue-200 rounded-xl p-5 bg-gradient-to-br from-white to-blue-50/30 shadow-sm">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-blue-200">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">3</span>
                    </div>
                    <h6 className="font-bold text-blue-800 text-base">Respuesta 3</h6>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Contenido</p>
                      <textarea 
                        className="w-full p-3 border-2 border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-blue-500" 
                        rows="4" 
                        readOnly
                        value={solicitudSeleccionada.REQUERIMIENTO_3 || 'No registrado'}
                      />
                    </div>
                    {solicitudSeleccionada.FECHA_REQUERIMIENTO_3 && (
                      <div className="flex items-center gap-2 text-xs">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-gray-700 font-medium">Registrado: {formatFecha(solicitudSeleccionada.FECHA_REQUERIMIENTO_3)}</span>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Archivo</p>
                      {solicitudSeleccionada.INFORME_3 ? (
                        <a 
                          href={solicitudSeleccionada.INFORME_3} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm hover:shadow-md"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Ver archivo
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          No registrado
                        </span>
                      )}
                    </div>
                    {solicitudSeleccionada.FECHA_INFORME_3 && (
                      <div className="flex items-center gap-2 text-xs">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-gray-700 font-medium">Última actualización: {formatFecha(solicitudSeleccionada.FECHA_INFORME_3)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {!solicitudSeleccionada.REQUERIMIENTO_2 && !solicitudSeleccionada.REQUERIMIENTO_3 && 
               !solicitudSeleccionada.INFORME_2 && !solicitudSeleccionada.INFORME_3 && (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-3">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-medium">No hay respuestas adicionales registradas.</p>
                </div>
              )}
            </>
          )}
        </div>
      </Modal>

      {/* Modal de Procedimientos */}
      <Modal
        isOpen={modalProcedimientosOpen}
        onClose={() => setModalProcedimientosOpen(false)}
        title="📖 Procedimiento de Uso"
        size="lg"
      >
        <div className="p-6 space-y-6">
          <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-600">
            <p className="text-gray-900 font-medium leading-relaxed">Este sistema permite gestionar y dar seguimiento a las solicitudes de manera rápida y organizada. A continuación, se detalla su funcionamiento:</p>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>
              <h6 className="font-bold text-gray-900 text-base">🔎 Filtros</h6>
            </div>
            <ul className="text-sm text-gray-800 space-y-2 ml-10 list-disc">
              <li>Filtra las solicitudes por <strong className="text-gray-900">Área</strong>, <strong className="text-gray-900">Colaborador</strong>, <strong className="text-gray-900">Estado</strong> y <strong className="text-gray-900">Incidencia</strong>.</li>
              <li>El filtro de <strong className="text-gray-900">Colaborador</strong> funciona en tiempo real mientras escribes.</li>
              <li>Se permite hacer <strong className="text-gray-900">Filtros Combinados</strong> funciona en tiempo real.</li>
            </ul>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h6 className="font-bold text-gray-900 text-base">✍️ Responder Solicitudes</h6>
            </div>
            <ul className="text-sm text-gray-800 space-y-2 ml-10 list-disc">
              <li>En la columna <strong className="text-gray-900">Acciones</strong> podrás abrir el formulario de respuesta.</li>
              <li>Completa los campos de <em className="text-gray-900">Respondido por</em>, <em className="text-gray-900">Respuesta</em> e <em className="text-gray-900">Informe (opcional)</em>.</li>
              <li>Puedes adjuntar un archivo PDF y luego visualizarlo con el botón <strong className="text-gray-900">Ver archivo</strong>.</li>
            </ul>
            <div className="mt-3 bg-red-50 border-l-4 border-red-600 p-3 rounded">
              <p className="text-sm text-red-800 font-semibold">🚨 IMPORTANTE: SOLO TIENEN MÁXIMO 48 HORAS PARA RESPONDER O ATENDER UNA SOLICITUD/INCIDENCIA</p>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h6 className="font-bold text-gray-900 text-base">🔄 Reprogramaciones</h6>
            </div>
            <ul className="text-sm text-gray-800 space-y-2 ml-10 list-disc">
              <li>Si es necesario reprogramar, activa el <strong className="text-gray-900">checkbox de Reprogramación</strong>.</li>
              <li>Se permite máximo <strong className="text-gray-900">1 reprogramación</strong>.</li>
              <li>Si se trata de un caso complicado, se permite un máximo de <strong className="text-gray-900">3 reprogramaciones</strong>.</li>
              <li>Para agregar una nueva reprogramación, usa el <strong className="text-gray-900">botón verde ➕</strong> en la primera o segunda reprogramación.</li>
              <li>En los campos de reprogramación se puede escribir el <em className="text-gray-900">motivo</em> y opcionalmente un <em className="text-gray-900">link a documentos</em>.</li>
            </ul>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h6 className="font-bold text-gray-900 text-base">📑 Visualización</h6>
            </div>
            <ul className="text-sm text-gray-800 space-y-2 ml-10 list-disc">
              <li>Si una solicitud tiene reprogramaciones, en la columna <strong className="text-gray-900">Con reprogramación / Más Respuestas</strong> se mostrará <strong className="text-gray-900">SI</strong>.</li>
              <li>Al lado aparecerá un botón para abrir el detalle de todas las reprogramaciones registradas.</li>
            </ul>
          </div>
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

      {/* Modal de Gestión de Requerimientos */}
      <Modal
        isOpen={modalGestionRequerimientosOpen}
        onClose={() => {
          setModalGestionRequerimientosOpen(false);
          setSolicitudSeleccionada(null);
          setFormRequerimiento2("");
          setFormRequerimiento3("");
          setFormArchivo2(null);
          setFormArchivo3(null);
          setMostrarRespuesta3(false);
        }}
        title="Gestión de Requerimientos"
        size="lg"
      >
        {solicitudSeleccionada && (
          <div className="space-y-5">
            {/* Requerimiento inicial */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200/60 bg-slate-50">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#1E63F7]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">Requerimiento Inicial</h3>
                </div>
              </div>
              <div className="p-4">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {solicitudSeleccionada.REQUERIMIENTOS || solicitudSeleccionada.requerimientos || "No especificado."}
                </div>
              </div>
            </div>

            {/* Respuesta 2 */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200/60 bg-slate-50">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#1E63F7]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">Respuesta 2</h3>
                </div>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Texto */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Texto
                  </label>
                  <textarea
                    value={formRequerimiento2}
                    onChange={(e) => setFormRequerimiento2(e.target.value)}
                    rows={4}
                    placeholder="Ingrese el detalle de la respuesta 2..."
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E63F7] focus:border-[#1E63F7] outline-none text-sm text-gray-900 bg-white resize-y transition-all"
                  />
                  {solicitudSeleccionada.FECHA_REQUERIMIENTO_2 && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">Última actualización: {formatFecha(solicitudSeleccionada.FECHA_REQUERIMIENTO_2)}</span>
                    </div>
                  )}
                </div>

                {/* Archivo */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Archivo (opcional)
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex-shrink-0">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.xlsx,.xls,.jpg,.jpeg,.png,.zip,.rar"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setFormArchivo2(file);
                          }
                        }}
                        className="hidden"
                        id="archivo2-input"
                      />
                      <span className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] hover:opacity-90 text-white rounded-lg text-xs font-semibold cursor-pointer transition-all shadow-sm hover:shadow-md">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Seleccionar archivo
                      </span>
                    </label>
                    <span className="text-xs text-gray-600 flex-1">
                      {formArchivo2 ? (
                        <span className="text-[#1E63F7] font-medium">{formArchivo2.name}</span>
                      ) : (
                        "Ningún archivo seleccionado"
                      )}
                    </span>
                  </div>
                </div>

                {/* Exportar archivo actual */}
                <div>
                  {(solicitudSeleccionada.INFORME_2 || solicitudSeleccionada.informe2) ? (
                    <div className="space-y-2">
                      <button
                        onClick={() => descargarPDF(solicitudSeleccionada.INFORME_2 || solicitudSeleccionada.informe2, 'informe_respuesta_2.pdf')}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-red-500 to-red-600 hover:opacity-90 text-white rounded-lg text-xs font-semibold transition-all shadow-sm hover:shadow-md active:scale-[0.95]"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 2C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V7.41421C19 7.149 18.8946 6.89464 18.7071 6.70711L13.2929 1.29289C13.1054 1.10536 12.851 1 12.5858 1H6Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 1V6H18" />
                          <text x="12" y="15" fontSize="6" fill="currentColor" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="0.3">PDF</text>
                        </svg>
                        Exportar a PDF
                      </button>
                      {solicitudSeleccionada.FECHA_INFORME_2 && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">Registrado: {formatFecha(solicitudSeleccionada.FECHA_INFORME_2)}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      disabled
                      className="inline-flex items-center gap-2 px-3 py-2 bg-gray-200 text-gray-500 rounded-lg text-xs font-semibold cursor-not-allowed opacity-50"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 2C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V7.41421C19 7.149 18.8946 6.89464 18.7071 6.70711L13.2929 1.29289C13.1054 1.10536 12.851 1 12.5858 1H6Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 1V6H18" />
                        <text x="12" y="15" fontSize="6" fill="currentColor" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="0.3">PDF</text>
                      </svg>
                      Exportar a PDF
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Respuesta 3 */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200/60 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#1E63F7]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">Respuesta 3</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setMostrarRespuesta3(!mostrarRespuesta3)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold transition-all shadow-sm border border-gray-300"
                >
                  {mostrarRespuesta3 ? (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                      </svg>
                      Ocultar
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Añadir Respuesta 3
                    </>
                  )}
                </button>
              </div>

              {mostrarRespuesta3 && (
                <div className="p-4 space-y-4">
                  {/* Texto */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      Texto
                    </label>
                    <textarea
                      value={formRequerimiento3}
                      onChange={(e) => setFormRequerimiento3(e.target.value)}
                      rows={4}
                      placeholder="Ingrese el detalle de la respuesta 3..."
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E63F7] focus:border-[#1E63F7] outline-none text-sm text-gray-900 bg-white resize-y transition-all"
                    />
                    {solicitudSeleccionada.FECHA_REQUERIMIENTO_3 && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">Última actualización: {formatFecha(solicitudSeleccionada.FECHA_REQUERIMIENTO_3)}</span>
                      </div>
                    )}
                  </div>

                  {/* Archivo */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      Archivo (opcional)
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="flex-shrink-0">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.xlsx,.xls,.jpg,.jpeg,.png,.zip,.rar"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setFormArchivo3(file);
                            }
                          }}
                          className="hidden"
                          id="archivo3-input"
                        />
                        <span className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] hover:opacity-90 text-white rounded-lg text-xs font-semibold cursor-pointer transition-all shadow-sm hover:shadow-md">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          Seleccionar archivo
                        </span>
                      </label>
                      <span className="text-xs text-gray-600 flex-1">
                        {formArchivo3 ? (
                          <span className="text-[#1E63F7] font-medium">{formArchivo3.name}</span>
                        ) : (
                          "Ningún archivo seleccionado"
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Exportar archivo actual */}
                  <div>
                    {(solicitudSeleccionada.INFORME_3 || solicitudSeleccionada.informe3) ? (
                      <div className="space-y-2">
                        <button
                          onClick={() => descargarPDF(solicitudSeleccionada.INFORME_3 || solicitudSeleccionada.informe3, 'informe_respuesta_3.pdf')}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-red-500 to-red-600 hover:opacity-90 text-white rounded-lg text-xs font-semibold transition-all shadow-sm hover:shadow-md active:scale-[0.95]"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 2C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V7.41421C19 7.149 18.8946 6.89464 18.7071 6.70711L13.2929 1.29289C13.1054 1.10536 12.851 1 12.5858 1H6Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 1V6H18" />
                            <text x="12" y="15" fontSize="6" fill="currentColor" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="0.3">PDF</text>
                          </svg>
                          Exportar a PDF
                        </button>
                        {solicitudSeleccionada.FECHA_INFORME_3 && (
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium">Registrado: {formatFecha(solicitudSeleccionada.FECHA_INFORME_3)}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        disabled
                        className="inline-flex items-center gap-2 px-3 py-2 bg-gray-200 text-gray-500 rounded-lg text-xs font-semibold cursor-not-allowed opacity-50"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 2C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V7.41421C19 7.149 18.8946 6.89464 18.7071 6.70711L13.2929 1.29289C13.1054 1.10536 12.851 1 12.5858 1H6Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 1V6H18" />
                          <text x="12" y="15" fontSize="6" fill="currentColor" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="0.3">PDF</text>
                        </svg>
                        Exportar a PDF
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Botones */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200/60">
              <button
                onClick={() => {
                  setModalGestionRequerimientosOpen(false);
                  setSolicitudSeleccionada(null);
                  setFormRequerimiento2("");
                  setFormRequerimiento3("");
                  setFormArchivo2(null);
                  setFormArchivo3(null);
                  setMostrarRespuesta3(false);
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-xs font-semibold transition-all shadow-sm hover:shadow-md"
              >
                Cerrar
              </button>
              <button
                onClick={async () => {
                  if (!solicitudSeleccionada) return;

                  try {
                    setGuardandoRequerimientos(true);
                    const token = localStorage.getItem("token");
                    const idSolicitud = solicitudSeleccionada.ID_SOLICITUD || solicitudSeleccionada.id || solicitudSeleccionada.ID;

                    if (!idSolicitud) {
                      alert("No se encontró el ID de la solicitud.");
                      return;
                    }

                    const formData = new FormData();
                    formData.append('ID_SOLICITUD', idSolicitud);
                    
                    if (formRequerimiento2.trim()) {
                      formData.append('REQUERIMIENTO_2', formRequerimiento2.trim());
                    }
                    if (formArchivo2) {
                      formData.append('informe2', formArchivo2);
                    }
                    
                    if (mostrarRespuesta3) {
                      if (formRequerimiento3.trim()) {
                        formData.append('REQUERIMIENTO_3', formRequerimiento3.trim());
                      }
                      if (formArchivo3) {
                        formData.append('informe3', formArchivo3);
                      }
                    }

                    const response = await fetch(
                      `https://registrosolicitudeseincidencias-2946605267.us-central1.run.app?accion=requerimiento`,
                      {
                        method: 'PUT',
                        headers: {
                          ...(token && { 'Authorization': `Bearer ${token}` })
                        },
                        body: formData
                      }
                    );

                    if (!response.ok) {
                      const errorText = await response.text();
                      throw new Error(errorText || `Error ${response.status}`);
                    }

                    const data = await response.json();
                    console.log("Respuesta de actualización:", data);

                    await cargarSolicitudes();

                    setModalGestionRequerimientosOpen(false);
                    setSolicitudSeleccionada(null);
                    setFormRequerimiento2("");
                    setFormRequerimiento3("");
                    setFormArchivo2(null);
                    setFormArchivo3(null);
                    setMostrarRespuesta3(false);

                    alert("Requerimientos guardados correctamente.");
                  } catch (error) {
                    console.error("Error al guardar requerimientos:", error);
                    alert(`Error al guardar: ${error.message}`);
                  } finally {
                    setGuardandoRequerimientos(false);
                  }
                }}
                disabled={guardandoRequerimientos}
                className="px-4 py-2 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] hover:opacity-90 text-white rounded-lg text-xs font-semibold transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {guardandoRequerimientos ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Guardar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

