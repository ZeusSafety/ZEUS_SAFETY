"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/context/AuthContext";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";
import Modal from "../../../components/ui/Modal";

// Usar el proxy de Next.js para evitar problemas de CORS
const API_URL = "/api/solicitudes-incidencias";

export default function SolicitudesIncidenciasImportacionPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [solicitudes, setSolicitudes] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [errorAPI, setErrorAPI] = useState(null);
  
  // Filtros - Iniciar con IMPORTACION seleccionado por defecto
  const [areaRecepcion, setAreaRecepcion] = useState("IMPORTACION");

  // Filtros adicionales
  const [colaborador, setColaborador] = useState("");
  const [estado, setEstado] = useState("");
  const [mostrarIncidencias, setMostrarIncidencias] = useState(false);
  const [areaEmision, setAreaEmision] = useState("");
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  
  // Modales
  const [modalRequerimientosOpen, setModalRequerimientosOpen] = useState(false);
  const [modalRespuestasOpen, setModalRespuestasOpen] = useState(false);
  const [modalReprogramacionesOpen, setModalReprogramacionesOpen] = useState(false);
  const [modalHistorialReqExtraOpen, setModalHistorialReqExtraOpen] = useState(false);
  const [modalProcedimientosOpen, setModalProcedimientosOpen] = useState(false);
  const [textoModal, setTextoModal] = useState("");
  const [tituloModal, setTituloModal] = useState("");
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);

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

    // Filtrar por área de recepción (incialmente IMPORTACION)
    if (areaRecepcion && areaRecepcion.trim() !== "") {
      filtered = filtered.filter(s => {
        // Buscar el área en múltiples campos posibles
        const area = s.AREA_RECEPCION || s.area_recepcion || s.AREA_RECEPCION || s.AREA || s.area || "";
        return area && area.trim() !== "" && area.toUpperCase() === areaRecepcion.toUpperCase();
      });
    }

    // Filtrar por área de emisión (solo si hay un valor seleccionado)
    if (areaEmision && areaEmision.trim() !== "") {
      filtered = filtered.filter(s => {
        // Buscar el área en múltiples campos posibles
        const area = s.AREA_EMISION || s.area_emision || s.AREA_EMISION || s.AREA || s.area || "";
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
  }, [solicitudes, areaRecepcion, areaEmision, colaborador, estado, mostrarIncidencias]);

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
      doc.text("Reporte de Solicitudes e Incidencias - IMPORTACION - Zeus Safety", 14, 15);
      
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
      doc.save("Reporte_Solicitudes_IMPORTACION.pdf");
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
              onClick={() => router.push("/importacion")}
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
                                <button className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md">
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
    </div>
  );
}

