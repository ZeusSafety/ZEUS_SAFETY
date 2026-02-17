"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Modal from "../ui/Modal";

// Usar el proxy de Next.js para evitar problemas de CORS
const API_URL = "/api/solicitudes-incidencias";

export default function SolicitudesIncidenciasGerenciaPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [solicitudes, setSolicitudes] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // 1. mapeo de usuarios
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
    'edgarzeus': 'EDGAR',
    'dayanazeus': 'DAYANA',
    'yeimizeus': 'YEIMI',
    'josezeus': 'JOSE',
    'lizethzeus': 'LIZETH',
    'laritzazeus': 'LARITZA'
  };

  // 2. Modificar el estado inicial de colaborador
  // Inicialmente vacío para evitar errores de renderizado hidratado
  const [colaborador, setColaborador] = useState("");

  // 3. Efecto para inicializar el filtro según el usuario logeado
  useEffect(() => {
    if (user) {
      // Según tu consola, la propiedad es 'id' o 'name'
      const cuentaDetectada = user.id || user.name;

      if (cuentaDetectada) {
        const usuarioLogeado = String(cuentaDetectada).toLowerCase();
        const nombreReal = userMapping[usuarioLogeado];

        if (nombreReal) {
          console.log("✅ Match encontrado. Aplicando filtro para:", nombreReal);
          setColaborador(nombreReal);
        } else {
          console.log("❌ El usuario", usuarioLogeado, "no está en el userMapping");
        }
      }
    }
  }, [user]);

  // Filtros - Iniciar vacío para mostrar todas las áreas por defecto
  const [areaRecepcion, setAreaRecepcion] = useState("");
  const [estado, setEstado] = useState("");
  const [mostrarIncidencias, setMostrarIncidencias] = useState(false);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(13);

  // Modales
  const [modalRequerimientosOpen, setModalRequerimientosOpen] = useState(false);
  const [modalRespuestasOpen, setModalRespuestasOpen] = useState(false);
  const [modalReprogramacionesOpen, setModalReprogramacionesOpen] = useState(false);
  const [modalHistorialReqExtraOpen, setModalHistorialReqExtraOpen] = useState(false);
  const [modalProcedimientosOpen, setModalProcedimientosOpen] = useState(false);
  const [textoModal, setTextoModal] = useState("");
  const [tituloModal, setTituloModal] = useState("");
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);

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
      const token = localStorage.getItem("token");

      // Obtener todas las solicitudes de todas las áreas
      // Hacer múltiples llamadas para obtener solicitudes de todas las áreas
      const areas = ["logistica", "sistemas", "marketing", "ventas", "facturacion", "importacion", "administracion", "gerencia", "recursos-humanos"];

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

      let data = Array.from(solicitudesUnicas.values());

      // Ordenar por FECHA_CONSULTA de manera descendente (más recientes primero)
      data.sort((a, b) => {
        const fechaA = a.FECHA_CONSULTA || a.fecha_consulta || a.FECHA || a.fecha || "";
        const fechaB = b.FECHA_CONSULTA || b.fecha_consulta || b.FECHA || b.fecha || "";

        if (!fechaA && !fechaB) return 0;
        if (!fechaA) return 1; // Sin fecha al final
        if (!fechaB) return -1; // Sin fecha al final

        const dateA = new Date(fechaA);
        const dateB = new Date(fechaB);

        // Orden descendente: más recientes primero
        return dateB.getTime() - dateA.getTime();
      });

      console.log('Datos recibidos de la API (todas las áreas):', data);

      setSolicitudes(data);
    } catch (error) {
      console.error("Error al obtener datos:", error);
      setSolicitudes([]);
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

    // Filtrar por colaborador
    if (colaborador.trim()) {
      const term = colaborador.toLowerCase().trim();
      filtered = filtered.filter(s => {
        const registradoPor = (s.REGISTRADO_POR || s.registrado_por || "").toLowerCase().trim();
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

    // Filtrar incidencias (solo si el checkbox está activo, mostrar solo las que tienen incidencia)
    // Si el checkbox está desactivado, mostrar TODAS las solicitudes (con y sin incidencias)
    if (mostrarIncidencias) {
      // Si mostrarIncidencias está activo, mostrar solo las que tienen incidencia
      filtered = filtered.filter(s => {
        const incidencia = s.RES_INCIDENCIA || s.res_incidencia || "";
        return incidencia && incidencia.trim() !== "" && incidencia !== "-";
      });
    }
    // Si mostrarIncidencias está desactivado, no filtrar (mostrar todas)

    // Ordenar por FECHA_CONSULTA de manera descendente (más recientes primero)
    filtered.sort((a, b) => {
      const fechaA = a.FECHA_CONSULTA || a.fecha_consulta || a.FECHA || a.fecha || "";
      const fechaB = b.FECHA_CONSULTA || b.fecha_consulta || b.FECHA || b.fecha || "";

      if (!fechaA && !fechaB) return 0;
      if (!fechaA) return 1; // Sin fecha al final
      if (!fechaB) return -1; // Sin fecha al final

      const dateA = new Date(fechaA);
      const dateB = new Date(fechaB);

      // Orden descendente: más recientes primero
      return dateB.getTime() - dateA.getTime();
    });

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

  const abrirModalGestionRequerimientos = (solicitud) => {
    setSolicitudSeleccionada(solicitud);
    setFormRequerimiento2(solicitud.REQUERIMIENTO_2 || solicitud.requerimiento2 || "");
    setFormRequerimiento3(solicitud.REQUERIMIENTO_3 || solicitud.requerimiento3 || "");
    setFormArchivo2(null);
    setFormArchivo3(null);
    setMostrarRespuesta3(!!(solicitud.REQUERIMIENTO_3 || solicitud.requerimiento3 || solicitud.INFORME_3 || solicitud.informe3));
    setModalGestionRequerimientosOpen(true);
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

  // Función para descargar PDF
  const descargarPDF = (url, nombreArchivo) => {
    if (!url) {
      alert("No hay archivo disponible para descargar.");
      return;
    }
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = nombreArchivo || 'archivo.pdf';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error al descargar PDF:", error);
      alert("Error al descargar el archivo.");
    }
  };

  // Función para exportar PDF
  const handleExportarPDF = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF("landscape");

      // Título
      doc.setFontSize(14);
      doc.text("Reporte de Solicitudes e Incidencias - GERENCIA - Zeus Safety", 14, 15);

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
      doc.save("Reporte_Mis_Solicitudes.pdf");
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
    <div>
      <div className="max-w-[95%] mx-auto px-4 py-4 overflow-x-hidden">
        {/* Contenedor principal con fondo blanco */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6 mb-6 overflow-x-hidden">
          {/* Título con icono y botones de acción */}
          <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#002D5A] to-[#002D5A] rounded-xl flex items-center justify-center text-white shadow-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>Mis Solicitudes/Incidencias</h1>
                <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: 'var(--font-poppins)' }}>
                  Ver y gestionar Solicitudes/Incidencias
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className={`flex items-center space-x-2 rounded-lg px-3 py-1.5 ${loadingData
                ? 'bg-gray-50 border border-gray-200'
                : 'bg-green-50 border border-green-200'
                }`}>
                <svg className={`w-4 h-4 ${loadingData ? 'text-gray-600' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className={`text-sm font-semibold ${loadingData ? 'text-gray-700' : 'text-green-700'}`} style={{ fontFamily: 'var(--font-poppins)' }}>
                  {loadingData ? 'Conectando...' : 'API Conectada'}
                </span>
              </div>
              <button
                onClick={() => setModalProcedimientosOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md text-sm"
                style={{ fontFamily: 'var(--font-poppins)' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Procedimientos
              </button>
              <button
                onClick={handleExportarPDF}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md text-sm"
                style={{ fontFamily: 'var(--font-poppins)' }}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 2C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V7.41421C19 7.149 18.8946 6.89464 18.7071 6.70711L13.2929 1.29289C13.1054 1.10536 12.851 1 12.5858 1H6Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  <path d="M13 1V6H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <text x="12" y="15" fontSize="6" fill="currentColor" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="0.3">PDF</text>
                </svg>
                Exportar a PDF
              </button>
            </div>
          </div>

          {/* Filtros */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                  Área de Recepción
                </label>
                <select
                  value={areaRecepcion}
                  onChange={(e) => setAreaRecepcion(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 transition-all duration-200 hover:border-blue-300 bg-white"
                  style={{ fontFamily: 'var(--font-poppins)' }}
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
                  <option value="GERENCIA">GERENCIA</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                  Estado
                </label>
                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 transition-all duration-200 hover:border-blue-300 bg-white"
                  style={{ fontFamily: 'var(--font-poppins)' }}
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

              <div className="flex items-center mt-6">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mostrarIncidencias}
                    onChange={(e) => setMostrarIncidencias(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-semibold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>Mostrar Incidencias</span>
                </label>
              </div>
            </div>
          </div>

          {/* Tabla */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
            {loadingData ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
                <span className="ml-3 text-gray-600" style={{ fontFamily: 'var(--font-poppins)' }}>Cargando datos...</span>
              </div>
            ) : solicitudesFiltradas.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>No hay solicitudes disponibles.</p>
                <p className="text-xs text-gray-400" style={{ fontFamily: 'var(--font-poppins)' }}>Verifica los filtros o contacta al administrador.</p>
              </div>
            ) : (
              <>
                <div className="w-full overflow-x-auto">
                  <table className="w-full table-auto">
                    <thead>
                      <tr className="bg-gradient-to-r from-blue-700 to-blue-800 border-b-2 border-blue-800">
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
                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Más Requerimientos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {solicitudesPaginadas.map((solicitud, index) => {
                        const tieneReprogramaciones = solicitud.REPROGRAMACIONES &&
                          (Array.isArray(solicitud.REPROGRAMACIONES) ? solicitud.REPROGRAMACIONES.length > 0 :
                            (typeof solicitud.REPROGRAMACIONES === 'string' ? JSON.parse(solicitud.REPROGRAMACIONES || '[]').length > 0 : false));

                        const tieneReqExtra = solicitud.REQUERIMIENTO_2 || solicitud.REQUERIMIENTO_3 || solicitud.INFORME_2 || solicitud.INFORME_3;

                        return (
                          <tr key={solicitud.ID_SOLICITUD || solicitud.id || index} className="hover:bg-blue-50 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700 text-center" style={{ fontFamily: 'var(--font-poppins)' }}>{formatFecha(solicitud.FECHA_CONSULTA)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-[10px] font-medium text-gray-900 text-center" style={{ fontFamily: 'var(--font-poppins)' }}>{solicitud.NUMERO_SOLICITUD || '-'}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700 text-center" style={{ fontFamily: 'var(--font-poppins)' }}>{solicitud.REGISTRADO_POR || '-'}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700 text-center" style={{ fontFamily: 'var(--font-poppins)' }}>{solicitud.AREA || '-'}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700 text-center" style={{ fontFamily: 'var(--font-poppins)' }}>{solicitud.RES_INCIDENCIA || '-'}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700 text-center">
                              <div className="flex items-center gap-2 justify-center">
                                <button
                                  onClick={() => mostrarTextoEnModal(solicitud.REQUERIMIENTOS || 'No especificado.', 'Requerimientos')}
                                  className="inline-flex items-center justify-center px-2.5 py-1.5 bg-gradient-to-br from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                                  title="Ver Requerimientos"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </button>
                                {solicitud.INFORME_SOLICITUD ? (
                                  <a
                                    href={solicitud.INFORME_SOLICITUD}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                                    style={{ fontFamily: 'var(--font-poppins)' }}
                                  >
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M6 2C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V7.41421C19 7.149 18.8946 6.89464 18.7071 6.70711L13.2929 1.29289C13.1054 1.10536 12.851 1 12.5858 1H6Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
                                      <path d="M13 1V6H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                      <text x="12" y="15" fontSize="6" fill="currentColor" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="0.3">PDF</text>
                                    </svg>
                                    <span>PDF</span>
                                  </a>
                                ) : (
                                  <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-400 text-white rounded-lg text-[10px] font-semibold cursor-not-allowed" style={{ fontFamily: 'var(--font-poppins)' }}>
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M6 2C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V7.41421C19 7.149 18.8946 6.89464 18.7071 6.70711L13.2929 1.29289C13.1054 1.10536 12.851 1 12.5858 1H6Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
                                      <path d="M13 1V6H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                      <text x="12" y="15" fontSize="6" fill="currentColor" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="0.3">PDF</text>
                                    </svg>
                                    <span>Sin archivo</span>
                                  </button>
                                )}
                                {tieneReqExtra && (
                                  <button
                                    onClick={() => verHistorialReqExtra(solicitud)}
                                    className="inline-flex items-center justify-center px-2.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                                    title="Ver respuestas adicionales"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
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
                                      <path d="M6 2C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V7.41421C19 7.149 18.8946 6.89464 18.7071 6.70711L13.2929 1.29289C13.1054 1.10536 12.851 1 12.5858 1H6Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
                                      <path d="M13 1V6H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                      <text x="12" y="15" fontSize="6" fill="currentColor" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="0.3">PDF</text>
                                    </svg>
                                    Ver archivo
                                  </a>
                                ) : (
                                  <button className="px-2 py-1 bg-gray-400 text-white rounded text-[10px] font-semibold cursor-not-allowed">
                                    <svg className="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M6 2C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V7.41421C19 7.149 18.8946 6.89464 18.7071 6.70711L13.2929 1.29289C13.1054 1.10536 12.851 1 12.5858 1H6Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
                                      <path d="M13 1V6H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
                            <td className="px-3 py-2 text-center whitespace-nowrap text-[10px] text-gray-700">
                              {tieneReprogramaciones ? (
                                <div className="flex items-center gap-2 justify-center text-center">
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
                            <td className="px-3 py-2 whitespace-nowrap justify-center text-center">
                              <button
                                onClick={() => abrirModalGestionRequerimientos(solicitud)}
                                className="space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
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
            <p className="text-gray-900 whitespace-pre-wrap">{textoModal}</p>
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
                return <div className="text-center py-4 text-blue-500">No hay reprogramaciones registradas.</div>;
              }

              return reprogramaciones.map((reprog, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h6 className="font-semibold text-blue-700 mb-3">
                    {reprog.titulo || `Reprogramación ${idx + 1}`}
                  </h6>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-900"><strong>📅 Fecha:</strong> {formatFecha(reprog.FECHA_REPROGRAMACION || reprog.fecha)}</p>
                    <p className="text-gray-900"><strong>📝 Motivo:</strong> {reprog.RESPUESTA_REPROG || reprog.RESPUESTA || reprog.respuesta || 'No registrada'}</p>
                    <p className="text-gray-900"><strong>📄 Informe:</strong> {
                      reprog.INFORME_REPROG || reprog.INFORME || reprog.informe ? (
                        <a href={reprog.INFORME_REPROG || reprog.INFORME || reprog.informe} target="_blank" rel="noopener noreferrer" className="text-blue-700">
                          Ver archivo
                        </a>
                      ) : (
                        <span className="text-gray-900">No disponible</span>
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
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                      rows="3"
                      readOnly
                      value={solicitudSeleccionada.REQUERIMIENTO_2 || 'No registrado'}
                    />
                    {solicitudSeleccionada.FECHA_REQUERIMIENTO_2 && (
                      <p className="text-xs text-gray-800 mt-1">
                        🕒 Registrado: {formatFecha(solicitudSeleccionada.FECHA_REQUERIMIENTO_2)}
                      </p>
                    )}
                    <p className="mt-2 text-gray-900">
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
                      className="w-full p-2 border border-gray-300 text-gray-900 rounded-lg text-sm"
                      rows="3"
                      readOnly
                      value={solicitudSeleccionada.REQUERIMIENTO_3 || 'No registrado'}
                    />
                    {solicitudSeleccionada.FECHA_REQUERIMIENTO_3 && (
                      <p className="text-xs text-gray-900 mt-1">
                        🕒 Registrado: {formatFecha(solicitudSeleccionada.FECHA_REQUERIMIENTO_3)}
                      </p>
                    )}
                    <p className="mt-2 text-gray-900">
                      <strong>Archivo:</strong> {
                        solicitudSeleccionada.INFORME_3 ? (
                          <a href={solicitudSeleccionada.INFORME_3} target="_blank" rel="noopener noreferrer" className="ml-2 px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold">
                            Ver archivo
                          </a>
                        ) : (
                          <span className="ml-2 text-gray-900">No registrado</span>
                        )
                      }
                    </p>
                    {solicitudSeleccionada.FECHA_INFORME_3 && (
                      <p className="text-xs text-gray-900 mt-1">
                        🕒 Última actualización de archivo: {formatFecha(solicitudSeleccionada.FECHA_INFORME_3)}
                      </p>
                    )}
                  </div>
                )}

                {!solicitudSeleccionada.REQUERIMIENTO_2 && !solicitudSeleccionada.REQUERIMIENTO_3 &&
                  !solicitudSeleccionada.INFORME_2 && !solicitudSeleccionada.INFORME_3 && (
                    <div className="text-center py-4 text-gray-900">
                      No hay respuestas adicionales registradas.
                    </div>
                  )}
              </>
            )}
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
                      <svg className="w-4 h-4 text-[#002D5A]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
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
                      <svg className="w-4 h-4 text-[#002D5A]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
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
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002D5A] focus:border-[#002D5A] outline-none text-sm text-gray-900 bg-white resize-y transition-all"
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
                        <span className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-[#002D5A] to-[#002D5A] hover:opacity-90 text-white rounded-lg text-xs font-semibold cursor-pointer transition-all shadow-sm hover:shadow-md">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          Seleccionar archivo
                        </span>
                      </label>
                      <span className="text-xs text-gray-600 flex-1">
                        {formArchivo2 ? (
                          <span className="text-[#002D5A] font-medium">{formArchivo2.name}</span>
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
                      <svg className="w-4 h-4 text-[#002D5A]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
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
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002D5A] focus:border-[#002D5A] outline-none text-sm text-gray-900 bg-white resize-y transition-all"
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
                          <span className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-[#002D5A] to-[#002D5A] hover:opacity-90 text-white rounded-lg text-xs font-semibold cursor-pointer transition-all shadow-sm hover:shadow-md">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            Seleccionar archivo
                          </span>
                        </label>
                        <span className="text-xs text-gray-600 flex-1">
                          {formArchivo3 ? (
                            <span className="text-[#002D5A] font-medium">{formArchivo3.name}</span>
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
                        `/api/solicitudes-incidencias?accion=requerimiento`,
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
                  className="px-4 py-2 bg-gradient-to-br from-[#002D5A] to-[#002D5A] hover:opacity-90 text-white rounded-lg text-xs font-semibold transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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

        {/* Modal de Procedimientos */}
        <Modal
          isOpen={modalProcedimientosOpen}
          onClose={() => setModalProcedimientosOpen(false)}
          title="Procedimientos"
          size="lg"
        >
          <div className="p-4">
            <div className="space-y-4">
              <p className="text-gray-700 text-sm leading-relaxed">
                Aquí se mostrarán los procedimientos para el manejo de solicitudes e incidencias.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Información</h4>
                <p className="text-sm text-gray-600">
                  Los procedimientos detallados estarán disponibles próximamente.
                </p>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
