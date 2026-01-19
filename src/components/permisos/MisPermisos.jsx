"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Modal from "../ui/Modal";
import { div } from "framer-motion/client";

// API de permisos laborales (usando proxy de Next.js)
const API_PERMISOS_URL = "/api/permisos-laborales";

export default function MisSolicitudes({ onBack }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [permisos, setPermisos] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  console.log("🔵 MisSolicitudes component renderizado. User:", user);

  // Filtros
  const [tipoPermiso, setTipoPermiso] = useState("");
  const [estado, setEstado] = useState("");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Modales
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [modalRespuestaOpen, setModalRespuestaOpen] = useState(false);
  const [modalRequerimientosOpen, setModalRequerimientosOpen] = useState(false);
  const [modalRespuestasOpen, setModalRespuestasOpen] = useState(false);
  const [modalReprogramacionesOpen, setModalReprogramacionesOpen] = useState(false);
  const [modalHistorialReqExtraOpen, setModalHistorialReqExtraOpen] = useState(false);
  const [modalProcedimientosOpen, setModalProcedimientosOpen] = useState(false);
  const [textoModal, setTextoModal] = useState("");
  const [tituloModal, setTituloModal] = useState("");
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [permisoSeleccionado, setPermisoSeleccionado] = useState(null);
  const [editandoPermiso, setEditandoPermiso] = useState(null);
  const [formRespuesta, setFormRespuesta] = useState({ respuesta: '' });
  const [loadingRespuesta, setLoadingRespuesta] = useState(false);

  // Estados para el modal de Gestión de Requerimientos
  const [modalGestionRequerimientosOpen, setModalGestionRequerimientosOpen] = useState(false);
  const [formRequerimiento2, setFormRequerimiento2] = useState("");
  const [formRequerimiento3, setFormRequerimiento3] = useState("");
  const [formArchivo2, setFormArchivo2] = useState(null);
  const [formArchivo3, setFormArchivo3] = useState(null);
  const [mostrarRespuesta3, setMostrarRespuesta3] = useState(false);
  const [guardandoRequerimientos, setGuardandoRequerimientos] = useState(false);

  // Estado para modal de archivos
  const [modalArchivosOpen, setModalArchivosOpen] = useState(false);
  const [archivosSeleccionados, setArchivosSeleccionados] = useState([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Cargar permisos desde la API
  useEffect(() => {
    if (user) {
      cargarPermisos();
    }
  }, [user]);

  const cargarPermisos = async () => {
    try {
      setLoadingData(true);

      // Obtener el ID del usuario logueado
      // El user.id es el username (ej: "eliaszeus")
      const usuarioId = user?.id || user?.name || "";

      if (!usuarioId) {
        console.error("No se pudo obtener el ID del usuario. User object:", user);
        setPermisos([]);
        return;
      }

      console.log("Cargando permisos para usuario:", usuarioId);

      // Obtener el token de autenticación
      const token = localStorage.getItem('token');
      if (!token) {
        console.error("❌ No se encontró el token de autenticación");
        setPermisos([]);
        return;
      }

      // Llamar a la API de permisos laborales a través del proxy
      const url = `${API_PERMISOS_URL}?id=${encodeURIComponent(usuarioId)}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token?.startsWith('Bearer') ? token : `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Permisos recibidos de la API:', data);
        console.log('Tipo de datos:', typeof data, 'Es array?', Array.isArray(data));

        // Asegurar que sea un array
        if (Array.isArray(data)) {
          console.log(`✅ Se encontraron ${data.length} permisos`);
          setPermisos(data);
        } else if (data && typeof data === 'object') {
          // Si viene como objeto, intentar extraer un array
          const arrayData = data.data || data.permisos || data.result || [];
          console.log('Datos extraídos del objeto:', arrayData);
          setPermisos(Array.isArray(arrayData) ? arrayData : []);
        } else {
          console.warn('⚠️ La respuesta no es un array ni un objeto con array:', data);
          setPermisos([]);
        }
      } else {
        const errorText = await response.text();
        console.error("❌ Error al obtener permisos:", response.status, response.statusText);
        console.error("Respuesta de error:", errorText);
        try {
          const errorJson = JSON.parse(errorText);
          console.error("Error JSON:", errorJson);
        } catch (e) {
          console.error("Error como texto:", errorText);
        }
        setPermisos([]);
      }
    } catch (error) {
      console.error("Error al obtener permisos:", error);
      setPermisos([]);
    } finally {
      setLoadingData(false);
    }
  };

  // Filtrar permisos dinámicamente
  const permisosFiltrados = useMemo(() => {
    let filtered = [...permisos];

    // Filtrar por tipo de permiso
    if (tipoPermiso && tipoPermiso.trim() !== "") {
      filtered = filtered.filter(p => {
        const tipo = p.TIPO_PERMISO || p.tipo_permiso || "";
        return tipo && tipo.trim() !== "" && tipo.toUpperCase() === tipoPermiso.toUpperCase();
      });
    }

    // Filtrar por estado
    if (estado && estado.trim() !== "") {
      filtered = filtered.filter(p => {
        const estadoPermiso = p.ESTADO_SOLICITUD || p.estado_solicitud || "";
        return estadoPermiso && estadoPermiso.toUpperCase() === estado.toUpperCase();
      });
    }

    return filtered;
  }, [permisos, tipoPermiso, estado]);

  // Calcular paginación
  const totalPages = Math.ceil(permisosFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const permisosPaginados = permisosFiltrados.slice(startIndex, endIndex);

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [tipoPermiso, estado]);

  // Funciones para modales
  const verDetallePermiso = (permiso) => {
    setPermisoSeleccionado(permiso);
    setModalDetalleOpen(true);
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
    if (!estado) return "bg-gradient-to-br from-gray-500 to-gray-600";
    const estadoStr = String(estado).toLowerCase();
    const estados = {
      "pendiente": "bg-gradient-to-br from-yellow-500 to-yellow-600",
      "aprobado": "bg-gradient-to-br from-green-600 to-green-700",
      "rechazado": "bg-gradient-to-br from-red-600 to-red-700",
      "en proceso": "bg-gradient-to-br from-blue-600 to-blue-700",
    };
    return estados[estadoStr] || "bg-gradient-to-br from-gray-500 to-gray-600";
  };

  // Función para parsear archivos JSON
  const parseArchivos = (archivosStr) => {
    if (!archivosStr) return [];
    try {
      const parsed = JSON.parse(archivosStr);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  };

  // Función para descargar PDF
  const descargarPDF = (url, nombreArchivo = 'archivo.pdf') => {
    if (!url) {
      alert("No hay archivo disponible para descargar");
      return;
    }
    try {
      window.open(url, '_blank');
    } catch (error) {
      console.error("Error al abrir archivo:", error);
      alert("Error al abrir el archivo");
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
      doc.text("Reporte de Permisos Laborales - Zeus Safety", 14, 15);

      // Preparar datos para exportar
      const dataExport = permisosFiltrados.map(permiso => [
        formatFecha(permiso.FECHA_REGISTRO) || "-",
        permiso.NOMBRE || "-",
        formatFecha(permiso.FECHA_INICIO) || "-",
        formatFecha(permiso.FECHA_FIN) || "-",
        permiso.TIPO_PERMISO || "-",
        permiso.ESTADO_SOLICITUD || "PENDIENTE",
        permiso.HORAS_SOLICITADAS || "-",
        permiso.HORAS_CUMPLIDAS || "-",
        permiso.HORAS_FALTANTESS || "-"
      ]);

      // Columnas
      const headers = [
        "Fecha Registro",
        "Nombre",
        "Fecha Inicio",
        "Fecha Fin",
        "Tipo Permiso",
        "Estado",
        "Horas Solicitadas",
        "Horas Cumplidas",
        "Horas Faltantes"
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
      doc.save("Reporte_Mis_Permisos.pdf");
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
      <div className={`flex-1 flex flex-col overflow-hidden transition-all`}>
        <main className="flex-1 overflow-y-auto custom-scrollbar" style={{ background: '#F7FAFF' }}>
          <div className="max-w-[95%] mx-auto px-4 py-4">
            {/* Contenedor principal con fondo blanco */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6 mb-6">
              {/* Título con icono y API Conectada */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#002D5A] to-[#002D5A] rounded-xl flex items-center justify-center text-white shadow-sm">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>Mis Permisos Laborales</h1>
                    <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: 'var(--font-poppins)' }}>
                      Consulta y gestión de tus permisos laborales
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1.5 rounded-lg px-2.5 py-1 bg-green-50 border border-green-200">
                  <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs font-semibold text-green-700" style={{ fontFamily: 'var(--font-poppins)' }}>API Conectada</span>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="mb-6 flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => setModalProcedimientosOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-lg font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105 active:scale-[0.98] text-xs"
                  style={{ fontFamily: 'var(--font-poppins)' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Procedimientos
                </button>

                <button
                  onClick={handleExportarPDF}
                  className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105 active:scale-[0.98] text-xs ml-auto"
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

              {/* Filtros */}
              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                      Tipo de Permiso
                    </label>
                    <select
                      value={tipoPermiso}
                      onChange={(e) => setTipoPermiso(e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 transition-all duration-200 hover:border-blue-300 bg-white"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                    >
                      <option value="">Todos los tipos</option>
                      <option value="Asuntos Personales">Asuntos Personales</option>
                      <option value="Estudio ó Capacitación">Estudio ó Capacitación</option>
                      <option value="Salud">Salud</option>
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
                      <option value="PENDIENTE">Pendiente</option>
                      <option value="APROBADO">Aprobado</option>
                      <option value="RECHAZADO">Rechazado</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Tabla */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden mt-6">
                {loadingData ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
                    <span className="ml-3 text-gray-600" style={{ fontFamily: 'var(--font-poppins)' }}>Cargando permisos...</span>
                  </div>
                ) : permisosFiltrados.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-3">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 mb-2 font-semibold" style={{ fontFamily: 'var(--font-poppins)' }}>
                      {permisos.length === 0
                        ? "No hay permisos registrados para tu usuario."
                        : "No hay permisos que coincidan con los filtros aplicados."}
                    </p>
                    <p className="text-xs text-gray-400" style={{ fontFamily: 'var(--font-poppins)' }}>
                      {permisos.length === 0
                        ? "Si crees que esto es un error, contacta al administrador."
                        : "Intenta ajustar los filtros para ver más resultados."}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto justify-center text-center">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gradient-to-r from-blue-700 to-blue-800 border-b-2 border-blue-800">
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Fecha Consulta</th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>N° Solicitud</th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Registrado Por</th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Área de Envio</th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Tipo de Incidencia</th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Informe</th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Área de Recepción</th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Fecha Respuesta</th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Archivos</th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Motivo</th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {permisosPaginados.map((permiso, index) => {
                            const archivos = parseArchivos(permiso.ARCHIVOS || permiso.archivos);
                            const tieneReprogramaciones = !!(permiso.REPROGRAMACIONES || permiso.FECHA_REPROGRAMACION);
                            const motivo = permiso.MOTIVO || permiso.motivo || '-';

                            return (
                              <tr key={permiso.ID || permiso.id || index} className="hover:bg-blue-50 transition-colors">
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700 text-center" style={{ fontFamily: 'var(--font-poppins)' }}>{formatFecha(permiso.FECHA_REGISTRO || permiso.fecha_registro)}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700 text-center" style={{ fontFamily: 'var(--font-poppins)' }}>{permiso.ID || permiso.id || '-'}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700 text-center" style={{ fontFamily: 'var(--font-poppins)' }}>{permiso.REGISTRADO_POR || permiso.registrado_por || permiso.NOMBRE || permiso.nombre || '-'}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700 text-center" style={{ fontFamily: 'var(--font-poppins)' }}>{permiso.NOMBRE || permiso.nombre || permiso.AREA_ENVIO || permiso.area_envio || '-'}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700 text-center" style={{ fontFamily: 'var(--font-poppins)' }}>{permiso.TIPO_PERMISO || permiso.tipo_permiso || '-'}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700 text-center">
                                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold text-white shadow-sm transition-all duration-200 ${getEstadoBadge(permiso.ESTADO_SOLICITUD || permiso.estado_solicitud)}`} style={{ fontFamily: 'var(--font-poppins)' }}>
                                    {permiso.ESTADO_SOLICITUD || permiso.estado_solicitud || 'PENDIENTE'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700 text-center" style={{ fontFamily: 'var(--font-poppins)' }}>
                                  {permiso.AREA_RECEPCION || permiso.area_recepcion || permiso.AREA_RECEP || permiso.area_recep || permiso.RESPONDIDO_POR_AREA || permiso.respondido_por_area || '-'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700 text-center" style={{ fontFamily: 'var(--font-poppins)' }}>
                                  {formatFecha(permiso.FECHA_RESPUESTA || permiso.fecha_respuesta || permiso.FECHA_RESPU || permiso.fecha_respu || permiso.FECHA_RESP || permiso.fecha_resp)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700 text-center">
                                  {archivos && archivos.length > 0 ? (
                                    <button
                                      onClick={() => {
                                        setArchivosSeleccionados(archivos);
                                        setModalArchivosOpen(true);
                                      }}
                                      className="inline-flex items-center justify-center px-3 py-1.5 bg-gradient-to-br from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
                                      title={`Ver ${archivos.length} archivo(s)`}
                                      style={{ fontFamily: 'var(--font-poppins)' }}
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                      </svg>
                                    </button>
                                  ) : (
                                    <span className="text-gray-400" style={{ fontFamily: 'var(--font-poppins)' }}>-</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-[10px] text-gray-700 text-center">
                                  {motivo && motivo !== '-' ? (
                                    <button
                                      onClick={() => {
                                        setTextoModal(motivo);
                                        setTituloModal("Motivo del Permiso");
                                        setModalDetalleOpen(true);
                                      }}
                                      className="inline-flex items-center justify-center px-2 py-1.5 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
                                      title="Ver motivo completo"
                                      style={{ fontFamily: 'var(--font-poppins)' }}
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      </svg>
                                    </button>
                                  ) : (
                                    <span className="text-gray-400" style={{ fontFamily: 'var(--font-poppins)' }}>-</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700 text-center">
                                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold text-white shadow-sm transition-all duration-200 ${getEstadoBadge(permiso.ESTADO_SOLICITUD || permiso.estado_solicitud)}`} style={{ fontFamily: 'var(--font-poppins)' }}>
                                    {permiso.ESTADO_SOLICITUD || permiso.estado_solicitud || 'PENDIENTE'}
                                  </span>
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
      </div >

      {/* Modal para ver Detalle del Permiso */}
      < Modal
        isOpen={modalDetalleOpen}
        onClose={() => {
          setModalDetalleOpen(false);
          setPermisoSeleccionado(null);
        }
        }
        title={tituloModal}
        size="md"
      >
        <div className="p-4">
          <p className="text-gray-900 whitespace-pre-wrap">{textoModal}</p>
        </div>
      </Modal >

      {/* Modal para ver Reprogramaciones */}
      < Modal
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
          })}
        </div>
      </Modal >

      {/* Modal para ver Historial de Requerimientos Extra */}
      < Modal
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
      </Modal >

      {/* Modal de Gestión de Requerimientos */}
      < Modal
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

                    await cargarPermisos();

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
      </Modal >

      {/* Modal para ver Archivos */}
      < Modal
        isOpen={modalArchivosOpen}
        onClose={() => {
          setModalArchivosOpen(false);
          setArchivosSeleccionados([]);
        }}
        title="Archivos del Permiso"
        size="lg"
      >
        <div className="p-4">
          {archivosSeleccionados && archivosSeleccionados.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {archivosSeleccionados.map((archivo, idx) => {
                const urlArchivo = archivo.url || archivo.URL || archivo;
                const nombreArchivo = archivo.name || archivo.NAME || `Archivo ${idx + 1}`;
                return (
                  <a
                    key={idx}
                    href={urlArchivo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-cyan-50 to-cyan-100 hover:from-cyan-100 hover:to-cyan-200 border-2 border-cyan-300 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer group"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    </div>
                    <p className="text-xs font-semibold text-gray-700 text-center truncate w-full px-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                      {nombreArchivo}
                    </p>
                  </a>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500" style={{ fontFamily: 'var(--font-poppins)' }}>No hay archivos disponibles</p>
            </div>
          )}
        </div>
      </Modal >

      {/* Modal para Agregar Respuesta */}
      < Modal
        isOpen={modalRespuestaOpen}
        onClose={() => {
          setModalRespuestaOpen(false);
          setEditandoPermiso(null);
          setFormRespuesta({ respuesta: '' });
        }}
        title="Agregar Respuesta al Permiso"
        size="md"
      >
        <div className="p-6 space-y-4">
          {editandoPermiso && (
            <>
              <div>
                <p className="text-sm text-gray-600 mb-4" style={{ fontFamily: 'var(--font-poppins)' }}>
                  Permiso: <span className="font-semibold">{editandoPermiso.TIPO_PERMISO || 'N/A'}</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                  Respuesta <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formRespuesta.respuesta}
                  onChange={(e) => setFormRespuesta(prev => ({ ...prev, respuesta: e.target.value }))}
                  rows={5}
                  required
                  placeholder="Escribe tu respuesta aquí..."
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white hover:border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-200 resize-none"
                  style={{ fontFamily: 'var(--font-poppins)' }}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setModalRespuestaOpen(false);
                    setEditandoPermiso(null);
                    setFormRespuesta({ respuesta: '' });
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                  style={{ fontFamily: 'var(--font-poppins)' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAgregarRespuesta}
                  disabled={loadingRespuesta || !formRespuesta.respuesta.trim()}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-lg hover:shadow-md transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontFamily: 'var(--font-poppins)' }}
                >
                  {loadingRespuesta ? 'Agregando...' : 'Agregar Respuesta'}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal >

    </div >
  );
}
