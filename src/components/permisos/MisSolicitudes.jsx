"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Modal from "../ui/Modal";

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
  const [permisoSeleccionado, setPermisoSeleccionado] = useState(null);
  const [modalProcedimientosOpen, setModalProcedimientosOpen] = useState(false);
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [modalRespuestaOpen, setModalRespuestaOpen] = useState(false);
  const [editandoPermiso, setEditandoPermiso] = useState(null);
  const [formEditar, setFormEditar] = useState({
    estado_solicitud: '',
    horas_cumplidas: '',
    estado_completado: ''
  });
  const [formRespuesta, setFormRespuesta] = useState({
    respuesta: ''
  });
  const [loadingEditar, setLoadingEditar] = useState(false);
  const [loadingRespuesta, setLoadingRespuesta] = useState(false);

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

  const abrirModalEditar = (permiso) => {
    setEditandoPermiso(permiso);
    setFormEditar({
      estado_solicitud: permiso.ESTADO_SOLICITUD || 'PENDIENTE',
      horas_cumplidas: permiso.HORAS_CUMPLIDAS || '',
      estado_completado: ''
    });
    setModalEditarOpen(true);
  };

  const abrirModalRespuesta = (permiso) => {
    setEditandoPermiso(permiso);
    setFormRespuesta({ respuesta: '' });
    setModalRespuestaOpen(true);
  };

  // Función para actualizar permiso
  const handleActualizarPermiso = async () => {
    if (!editandoPermiso || !editandoPermiso.ID) {
      setError('No se pudo identificar el permiso a actualizar');
      return;
    }

    setLoadingEditar(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const body = {
        id_permiso: editandoPermiso.ID,
      };

      // Solo agregar campos que tengan valor
      if (formEditar.estado_solicitud) {
        body.estado_solicitud = formEditar.estado_solicitud;
      }
      if (formEditar.horas_cumplidas) {
        body.horas_cumplidas = parseFloat(formEditar.horas_cumplidas);
      }
      if (formEditar.estado_completado) {
        body.estado_completado = formEditar.estado_completado;
      }

      const response = await fetch('/api/permisos-laborales-crud', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token?.startsWith('Bearer') ? token : `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      // Recargar permisos después de actualizar
      await cargarPermisos();
      setModalEditarOpen(false);
      setEditandoPermiso(null);
      alert('Permiso actualizado correctamente');
    } catch (error) {
      console.error('Error al actualizar permiso:', error);
      alert(`Error al actualizar permiso: ${error.message}`);
    } finally {
      setLoadingEditar(false);
    }
  };

  // Función para agregar respuesta
  const handleAgregarRespuesta = async () => {
    if (!editandoPermiso || !editandoPermiso.ID) {
      alert('No se pudo identificar el permiso');
      return;
    }

    if (!formRespuesta.respuesta || formRespuesta.respuesta.trim() === '') {
      alert('Debe ingresar una respuesta');
      return;
    }

    setLoadingRespuesta(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      // Obtener el ID del usuario actual (id_respondido_por)
      const usuarioId = user?.id || user?.name || '';
      if (!usuarioId) {
        throw new Error('No se pudo obtener el ID del usuario');
      }

      // TODO: Obtener el ID numérico real del colaborador desde la API
      const idRespondidoPor = 10; // Valor temporal, debería obtenerse de la API de colaboradores

      const body = {
        id_permiso: editandoPermiso.ID,
        respuesta: formRespuesta.respuesta.trim(),
        id_respondido_por: idRespondidoPor
      };

      const response = await fetch('/api/permisos-laborales-crud?metodo=agregar_respuesta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token?.startsWith('Bearer') ? token : `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      // Recargar permisos después de agregar respuesta
      await cargarPermisos();
      setModalRespuestaOpen(false);
      setEditandoPermiso(null);
      setFormRespuesta({ respuesta: '' });
      alert('Respuesta agregada correctamente');
    } catch (error) {
      console.error('Error al agregar respuesta:', error);
      alert(`Error al agregar respuesta: ${error.message}`);
    } finally {
      setLoadingRespuesta(false);
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
                  <div className="w-12 h-12 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] rounded-xl flex items-center justify-center text-white shadow-sm">
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
                        <tr className="bg-gradient-to-r from-blue-700 to-blue-800 border-b-2 border-blue-900">
                          <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Fecha Registro</th>
                          <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Nombre</th>
                          <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Fecha Inicio</th>
                          <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Fecha Fin</th>
                          <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Tipo Permiso</th>
                          <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Estado</th>
                          <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Horas Solicitadas</th>
                          <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Horas Cumplidas</th>
                          <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Horas Faltantes</th>
                          <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {permisosPaginados.map((permiso, index) => {
                          const archivos = parseArchivos(permiso.ARCHIVOS);
                          
                          return (
                            <tr key={permiso.ID || index} className="hover:bg-blue-50 transition-colors border-b border-gray-100">
                              <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{formatFecha(permiso.FECHA_REGISTRO)}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{permiso.NOMBRE || '-'}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{formatFecha(permiso.FECHA_INICIO)}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{formatFecha(permiso.FECHA_FIN)}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{permiso.TIPO_PERMISO || '-'}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold text-white shadow-sm transition-all duration-200 ${getEstadoBadge(permiso.ESTADO_SOLICITUD)}`} style={{ fontFamily: 'var(--font-poppins)' }}>
                                  {permiso.ESTADO_SOLICITUD || 'PENDIENTE'}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{permiso.HORAS_SOLICITADAS !== null && permiso.HORAS_SOLICITADAS !== undefined ? `${permiso.HORAS_SOLICITADAS}h` : '-'}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{permiso.HORAS_CUMPLIDAS !== null && permiso.HORAS_CUMPLIDAS !== undefined ? `${permiso.HORAS_CUMPLIDAS}h` : '-'}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{permiso.HORAS_FALTANTESS !== null && permiso.HORAS_FALTANTESS !== undefined ? `${permiso.HORAS_FALTANTESS}h` : '-'}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => verDetallePermiso(permiso)}
                                    className="inline-flex items-center justify-center px-3 py-1.5 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                                    title="Ver detalle"
                                    style={{ fontFamily: 'var(--font-poppins)' }}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" style={{pointerEvents: 'none'}}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => abrirModalEditar(permiso)}
                                    className="inline-flex items-center justify-center px-3 py-1.5 bg-gradient-to-br from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                                    title="Editar permiso"
                                    style={{ fontFamily: 'var(--font-poppins)' }}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" style={{pointerEvents: 'none'}}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => abrirModalRespuesta(permiso)}
                                    className="inline-flex items-center justify-center px-3 py-1.5 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                                    title="Agregar respuesta"
                                    style={{ fontFamily: 'var(--font-poppins)' }}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" style={{pointerEvents: 'none'}}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                    </svg>
                                  </button>
                                </div>
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

      {/* Modal para ver Detalle del Permiso */}
      <Modal
        isOpen={modalDetalleOpen}
        onClose={() => {
          setModalDetalleOpen(false);
          setPermisoSeleccionado(null);
        }}
        title="Detalle del Permiso"
        size="lg"
      >
        <div className="p-6 space-y-4">
          {permisoSeleccionado && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>Fecha de Registro</p>
                  <p className="text-sm font-medium text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>{formatFecha(permisoSeleccionado.FECHA_REGISTRO)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>Nombre</p>
                  <p className="text-sm font-medium text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>{permisoSeleccionado.NOMBRE || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>Fecha Inicio</p>
                  <p className="text-sm font-medium text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>{formatFecha(permisoSeleccionado.FECHA_INICIO)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>Fecha Fin</p>
                  <p className="text-sm font-medium text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>{formatFecha(permisoSeleccionado.FECHA_FIN)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>Tipo de Permiso</p>
                  <p className="text-sm font-medium text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>{permisoSeleccionado.TIPO_PERMISO || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>Estado</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white shadow-sm transition-all duration-200 ${getEstadoBadge(permisoSeleccionado.ESTADO_SOLICITUD)}`} style={{ fontFamily: 'var(--font-poppins)' }}>
                    {permisoSeleccionado.ESTADO_SOLICITUD || 'PENDIENTE'}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>Horas Solicitadas</p>
                  <p className="text-sm font-medium text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>{permisoSeleccionado.HORAS_SOLICITADAS !== null && permisoSeleccionado.HORAS_SOLICITADAS !== undefined ? `${permisoSeleccionado.HORAS_SOLICITADAS}h` : '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>Horas Cumplidas</p>
                  <p className="text-sm font-medium text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>{permisoSeleccionado.HORAS_CUMPLIDAS !== null && permisoSeleccionado.HORAS_CUMPLIDAS !== undefined ? `${permisoSeleccionado.HORAS_CUMPLIDAS}h` : '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>Horas Faltantes</p>
                  <p className="text-sm font-medium text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>{permisoSeleccionado.HORAS_FALTANTESS !== null && permisoSeleccionado.HORAS_FALTANTESS !== undefined ? `${permisoSeleccionado.HORAS_FALTANTESS}h` : '-'}</p>
                </div>
              </div>
              
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>Motivo</p>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-gray-900 whitespace-pre-wrap leading-relaxed text-sm font-normal" style={{ fontFamily: 'var(--font-poppins)' }}>
                    {permisoSeleccionado.MOTIVO || 'No especificado.'}
                  </p>
                </div>
              </div>

              {permisoSeleccionado.ARCHIVOS && parseArchivos(permisoSeleccionado.ARCHIVOS).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>Archivos</p>
                  <div className="space-y-2">
                    {parseArchivos(permisoSeleccionado.ARCHIVOS).map((archivo, idx) => (
                      <a
                        key={idx}
                        href={archivo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm hover:shadow-md"
                        style={{ fontFamily: 'var(--font-poppins)' }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Ver archivo {idx + 1}
                      </a>
                    ))}
                  </div>
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
            <p className="text-gray-900 font-medium leading-relaxed" style={{ fontFamily: 'var(--font-poppins)' }}>
              Este sistema permite consultar y gestionar tus permisos laborales de manera rápida y organizada. A continuación, se detalla su funcionamiento:
            </p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>
              <h6 className="font-bold text-gray-900 text-base" style={{ fontFamily: 'var(--font-poppins)' }}>🔎 Filtros</h6>
            </div>
            <ul className="text-sm text-gray-800 space-y-2 ml-10 list-disc" style={{ fontFamily: 'var(--font-poppins)' }}>
              <li>Filtra tus permisos por <strong className="text-gray-900">Tipo de Permiso</strong> (Asuntos Personales, Estudio ó Capacitación, Salud).</li>
              <li>Filtra por <strong className="text-gray-900">Estado</strong> (Pendiente, Aprobado, Rechazado).</li>
              <li>Puedes combinar ambos filtros para una búsqueda más específica.</li>
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
              <h6 className="font-bold text-gray-900 text-base" style={{ fontFamily: 'var(--font-poppins)' }}>📑 Visualización de Permisos</h6>
            </div>
            <ul className="text-sm text-gray-800 space-y-2 ml-10 list-disc" style={{ fontFamily: 'var(--font-poppins)' }}>
              <li>En la tabla podrás ver todos tus permisos con sus detalles: fechas, tipo, estado, horas solicitadas, cumplidas y faltantes.</li>
              <li>Haz clic en el botón <strong className="text-gray-900">Ver detalle</strong> en la columna Acciones para ver toda la información completa del permiso.</li>
              <li>En el detalle podrás ver el motivo y los archivos adjuntos (si los hay).</li>
            </ul>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h6 className="font-bold text-gray-900 text-base" style={{ fontFamily: 'var(--font-poppins)' }}>📊 Exportar a PDF</h6>
            </div>
            <ul className="text-sm text-gray-800 space-y-2 ml-10 list-disc" style={{ fontFamily: 'var(--font-poppins)' }}>
              <li>Puedes exportar el listado de tus permisos a PDF usando el botón <strong className="text-gray-900">Exportar a PDF</strong>.</li>
              <li>El PDF incluirá todos los permisos visibles según los filtros aplicados.</li>
            </ul>
          </div>
        </div>
      </Modal>

      {/* Modal para Editar Permiso */}
      <Modal
        isOpen={modalEditarOpen}
        onClose={() => {
          setModalEditarOpen(false);
          setEditandoPermiso(null);
        }}
        title="Editar Permiso Laboral"
        size="md"
      >
        <div className="p-6 space-y-4">
          {editandoPermiso && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                  Estado de la Solicitud
                </label>
                <select
                  value={formEditar.estado_solicitud}
                  onChange={(e) => setFormEditar(prev => ({ ...prev, estado_solicitud: e.target.value }))}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white hover:border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 transition-all duration-200"
                  style={{ fontFamily: 'var(--font-poppins)' }}
                >
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="APROBADO">Aprobado</option>
                  <option value="RECHAZADO">Rechazado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                  Horas Cumplidas
                </label>
                <input
                  type="number"
                  value={formEditar.horas_cumplidas}
                  onChange={(e) => setFormEditar(prev => ({ ...prev, horas_cumplidas: e.target.value }))}
                  step="0.5"
                  min="0"
                  placeholder="0.0"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white hover:border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-200"
                  style={{ fontFamily: 'var(--font-poppins)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                  Estado Completado (Opcional)
                </label>
                <select
                  value={formEditar.estado_completado}
                  onChange={(e) => setFormEditar(prev => ({ ...prev, estado_completado: e.target.value }))}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white hover:border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 transition-all duration-200"
                  style={{ fontFamily: 'var(--font-poppins)' }}
                >
                  <option value="">Seleccionar...</option>
                  <option value="COMPLETADO">Completado</option>
                  <option value="EN_PROCESO">En Proceso</option>
                  <option value="CANCELADO">Cancelado</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setModalEditarOpen(false);
                    setEditandoPermiso(null);
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                  style={{ fontFamily: 'var(--font-poppins)' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleActualizarPermiso}
                  disabled={loadingEditar}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-br from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold rounded-lg hover:shadow-md transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontFamily: 'var(--font-poppins)' }}
                >
                  {loadingEditar ? 'Actualizando...' : 'Actualizar'}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Modal para Agregar Respuesta */}
      <Modal
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
      </Modal>

    </div>
  );
}

