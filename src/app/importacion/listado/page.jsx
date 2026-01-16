"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/context/AuthContext";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";
import Modal from "../../../components/ui/Modal";

export default function ListadoImportacionesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFinal, setFechaFinal] = useState("");
  const [numeroDespacho, setNumeroDespacho] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [selectedImportacion, setSelectedImportacion] = useState(null);
  const [importaciones, setImportaciones] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const [updateForm, setUpdateForm] = useState({
    fechaRegistro: "",
    numeroDespacho: "",
    redactadoPor: "",
    fechaLlegadaProductos: "",
    fechaAlmacen: "",
    productos: "",
    tipoCarga: "",
    estado: "",
    canal: "",
  });
  const [soloPendientes, setSoloPendientes] = useState(false);

  // Cargar importaciones desde la API
  useEffect(() => {
    if (user && !loading) {
      cargarImportaciones();
    }
  }, [user, loading]);

  const cargarImportaciones = async () => {
    try {
      setLoadingData(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch("/api/importaciones2026", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      const data = await response.json();

      // Mapear los datos de la API al formato esperado
      const mappedData = Array.isArray(data) ? data.map((item) => {
        // Normalizar estado: convertir "PRODUCCION" a "PRODUCCIÓN" si es necesario
        let estado = item.ESTADO_IMPORTACION || "";
        if (estado === "PRODUCCION") {
          estado = "PRODUCCIÓN";
        }

        // Asegurarse de que el ID sea un número y esté presente
        const id = typeof item.ID_IMPORTACIONES === 'number'
          ? item.ID_IMPORTACIONES
          : (item.ID_IMPORTACIONES ? parseInt(item.ID_IMPORTACIONES) : null);

        return {
          id: id, // ID de la fila seleccionada - se usará para el PUT
          fechaRegistro: item.FECHA_REGISTRO ? item.FECHA_REGISTRO.split(' ')[0] : "",
          numeroDespacho: item.NUMERO_DESPACHO || "",
          redactadoPor: item.RESPONSABLE || "",
          productos: item.PRODUCTOS || "",
          archivoPdf: item.ARCHIVO_PDF_URL || "",
          fechaLlegada: item.FECHA_LLEGADA_PRODUCTOS || "",
          tipoCarga: item.TIPO_CARGA || "",
          fechaAlmacen: item.FECHA_ALMACEN || "",
          estado: estado,
          canal: item.CANAL || "",
          fechaRecepcion: item.FECHA_RECEPCION || "",
          incidencias: item.INCIDENCIAS === "SI",
          // Datos originales completos de la API para referencia
          _original: item,
        };
      }) : [];

      setImportaciones(mappedData);
    } catch (err) {
      console.error('Error al cargar importaciones:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar las importaciones');
      setImportaciones([]);
    } finally {
      setLoadingData(false);
    }
  };


  // Filtrado automático
  const [filteredImportaciones, setFilteredImportaciones] = useState([]);

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

    // Establecer estado inicial
    handleResize();

    // Escuchar cambios de tamaño
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filtrado automático
  useEffect(() => {
    let filtered = [...importaciones];

    // Filtrar por número de despacho (búsqueda parcial, case insensitive)
    if (numeroDespacho.trim() !== "") {
      filtered = filtered.filter((item) =>
        (item.numeroDespacho || "").toUpperCase().includes(numeroDespacho.toUpperCase())
      );
    }

    // Filtrar por rango de fechas
    if (fechaInicio.trim() !== "") {
      // Convertir fecha de formato dd/mm/aaaa a Date para comparación
      const partsInicio = fechaInicio.split("/");
      if (partsInicio.length === 3) {
        const fechaInicioDate = new Date(parseInt(partsInicio[2]), parseInt(partsInicio[1]) - 1, parseInt(partsInicio[0]));
        filtered = filtered.filter((item) => {
          if (!item.fechaRegistro) return false;
          const itemDate = new Date(item.fechaRegistro);
          return itemDate >= fechaInicioDate;
        });
      }
    }

    if (fechaFinal.trim() !== "") {
      const partsFinal = fechaFinal.split("/");
      if (partsFinal.length === 3) {
        const fechaFinalDate = new Date(parseInt(partsFinal[2]), parseInt(partsFinal[1]) - 1, parseInt(partsFinal[0]));
        filtered = filtered.filter((item) => {
          if (!item.fechaRegistro) return false;
          const itemDate = new Date(item.fechaRegistro);
          return itemDate <= fechaFinalDate;
        });
      }
    }

    // Filtrar por despachos pendientes (sin fecha de recepción)
    if (soloPendientes) {
      filtered = filtered.filter((item) => !item.fechaRecepcion || item.fechaRecepcion.trim() === "" || item.fechaRecepcion === "null");
    }

    setFilteredImportaciones(filtered);
    setCurrentPage(1); // Resetear a la primera página cuando se filtra
  }, [importaciones, fechaInicio, fechaFinal, numeroDespacho, soloPendientes]);

  // Función para normalizar fechas para input type="date" (formato YYYY-MM-DD sin zona horaria)
  const normalizarFechaParaInput = (fechaString) => {
    if (!fechaString || fechaString === 'null' || fechaString === 'undefined' || fechaString === '') {
      return '';
    }
    try {
      // Si ya está en formato YYYY-MM-DD, devolverla tal cual
      if (/^\d{4}-\d{2}-\d{2}$/.test(fechaString)) {
        return fechaString;
      }

      let year, month, day;

      if (fechaString.includes('T') || fechaString.includes(' ')) {
        // Si tiene hora, tomar solo la parte de la fecha
        const partes = fechaString.split('T')[0].split(' ')[0];
        [year, month, day] = partes.split('-');
      } else if (fechaString.includes('-')) {
        // Fecha ISO: 2026-01-15
        [year, month, day] = fechaString.split('-');
      } else if (fechaString.includes('/')) {
        // Fecha en formato dd/mm/aaaa
        const partes = fechaString.split('/');
        if (partes.length === 3) {
          day = partes[0];
          month = partes[1];
          year = partes[2];
        } else {
          return '';
        }
      } else {
        return '';
      }

      // Asegurar formato con ceros a la izquierda
      const yearStr = String(year).padStart(4, '0');
      const monthStr = String(month).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');

      return `${yearStr}-${monthStr}-${dayStr}`;
    } catch {
      return '';
    }
  };

  const formatearFecha = (fechaString) => {
    if (!fechaString || fechaString === 'null' || fechaString === 'undefined' || fechaString === '') {
      return '-';
    }
    try {
      // Si la fecha ya está en formato dd/mm/aaaa, devolverla tal cual
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(fechaString)) {
        return fechaString;
      }

      // Para fechas en formato ISO (2026-01-15) o con hora, parsearlo sin zona horaria
      let fecha;
      if (fechaString.includes('T') || fechaString.includes(' ')) {
        // Si tiene hora, tomar solo la parte de la fecha
        const partes = fechaString.split('T')[0].split(' ')[0];
        const [year, month, day] = partes.split('-');
        fecha = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else if (fechaString.includes('-')) {
        // Fecha ISO sin hora: 2026-01-15
        const [year, month, day] = fechaString.split('-');
        fecha = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        // Intenta parsear como fecha normal
        fecha = new Date(fechaString);
      }

      if (isNaN(fecha.getTime())) {
        return fechaString;
      }

      return fecha.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return fechaString;
    }
  };

  const handleGuardarCambios = async () => {
    try {
      if (!selectedImportacion) {
        setError('No se ha seleccionado una importación');
        return;
      }

      // Obtener el ID de la importación seleccionada (de la fila de la tabla)
      // Intentar obtener el ID de múltiples fuentes posibles
      const importacionId = selectedImportacion.id
        || selectedImportacion.ID_IMPORTACIONES
        || selectedImportacion._original?.ID_IMPORTACIONES
        || selectedImportacion._original?.id;

      console.log('🔍 ID obtenido de selectedImportacion:', importacionId);
      console.log('🔍 selectedImportacion completa:', JSON.stringify(selectedImportacion, null, 2));

      if (!importacionId && importacionId !== 0) {
        setError('No se pudo obtener el ID de la importación. Por favor, intente nuevamente.');
        console.error('❌ selectedImportacion sin ID:', selectedImportacion);
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      // Preparar el payload según la estructura esperada por la API
      // Convertir "PRODUCCIÓN" de vuelta a "PRODUCCION" para la API
      let estadoParaAPI = updateForm.estado;
      if (estadoParaAPI === "PRODUCCIÓN") {
        estadoParaAPI = "PRODUCCION";
      }

      // Asegurarse de que el ID sea un número
      const idNumerico = typeof importacionId === 'number' ? importacionId : parseInt(importacionId);

      if (isNaN(idNumerico)) {
        setError('El ID de la importación no es válido.');
        console.error('ID inválido:', importacionId);
        return;
      }

      // Preparar el payload según la estructura esperada por la API
      // El backend espera:
      // - id en la raíz del body (data["id"])
      // - parámetro area=importacion en la URL
      // - solo los campos que el backend espera para area=importacion
      // - productos SIEMPRE debe estar presente (requerido por el backend)
      const productos = updateForm.productos || selectedImportacion.productos || "";

      const payload = {
        id: idNumerico, // ID en la raíz del body (requerido por el backend)
        productos: productos, // SIEMPRE requerido por el backend
        fecha_llegada_productos: updateForm.fechaLlegadaProductos || "",
        fecha_almacen: updateForm.fechaAlmacen || "",
        tipo_carga: updateForm.tipoCarga || "",
        estado_importacion: estadoParaAPI || "",
        canal: updateForm.canal || "",
      };

      console.log('📤 Enviando payload:', JSON.stringify(payload, null, 2));
      console.log('📤 ID de importación (numérico):', idNumerico);
      console.log('📤 Tipo de ID:', typeof idNumerico);
      console.log('📤 selectedImportacion completa:', JSON.stringify(selectedImportacion, null, 2));

      // Agregar parámetro area=importacion en la URL
      const response = await fetch("/api/importaciones2026?area=importacion", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }
        const errorData = await response.json();
        console.error('❌ Error de respuesta:', errorData);
        throw new Error(errorData.error || errorData.ERROR || `Error ${response.status}`);
      }

      // Cerrar modal de actualización
      setIsUpdateModalOpen(false);
      setSelectedImportacion(null);
      setError(null);

      // Mostrar modal de éxito
      setIsSuccessModalOpen(true);

      // Recargar datos
      await cargarImportaciones();
    } catch (err) {
      console.error('Error al guardar cambios:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar los cambios');
    }
  };

  const totalPages = Math.ceil(filteredImportaciones.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentImportaciones = filteredImportaciones.slice(startIndex, endIndex);

  const getEstadoBadge = (estado) => {
    const estadoUpper = String(estado || '').toUpperCase();
    const estados = {
      PENDIENTE: "bg-gradient-to-br from-gray-500 to-gray-600",
      PRODUCCION: "bg-gradient-to-br from-red-600 to-red-700",
      "PRODUCCIÓN": "bg-gradient-to-br from-red-600 to-red-700",
      TRANSITO: "bg-gradient-to-br from-yellow-500 to-yellow-600",
      ETA: "bg-gradient-to-br from-green-600 to-green-700",
      RECIBIDO: "bg-gradient-to-br from-blue-600 to-blue-700",
    };
    return estados[estadoUpper] || estados[estado] || "bg-gradient-to-br from-gray-500 to-gray-600";
  };

  const getCanalBadge = (canal) => {
    if (!canal) return "";
    const canales = {
      ROJO: "bg-gradient-to-br from-red-600 to-red-700",
      AMARILLO: "bg-gradient-to-br from-yellow-500 to-yellow-600",
      VERDE: "bg-gradient-to-br from-green-600 to-green-700",
    };
    return canales[canal] || "bg-gradient-to-br from-gray-500 to-gray-600";
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F7FAFF' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${sidebarOpen ? "lg:ml-60 ml-0" : "ml-0"
          }`}
      >
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto custom-scrollbar" style={{ background: '#F7FAFF' }}>
          <div className="max-w-[95%] mx-auto px-4 py-4">
            {/* Botón Volver */}
            <button
              onClick={() => router.push("/importacion")}
              className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-lg font-medium hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm ripple-effect relative overflow-hidden text-sm group"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver a Importación</span>
            </button>

            {/* Card contenedor blanco */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">
              {/* Header */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] rounded-xl flex items-center justify-center text-white shadow-sm">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'var(--font-poppins)' }}>Listado de Importaciones</h1>
                    <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: 'var(--font-poppins)' }}>
                      Consulta y gestión de todas las importaciones registradas
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center space-x-2 rounded-lg px-3 py-1.5 bg-green-50 border border-green-200">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-semibold text-green-700" style={{ fontFamily: 'var(--font-poppins)' }}>API Conectada</span>
                  </div>
                </div>
              </div>

              {/* Filtros */}
              <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <label className="block text-xs font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>Fecha Inicio</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="dd/mm/aaaa"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                      className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-300 placeholder:text-gray-400 text-gray-900"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                    />
                    <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="relative">
                  <label className="block text-xs font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>Fecha Final</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="dd/mm/aaaa"
                      value={fechaFinal}
                      onChange={(e) => setFechaFinal(e.target.value)}
                      className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-300 placeholder:text-gray-400 text-gray-900"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                    />
                    <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="relative">
                  <label className="block text-xs font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>N° de Despacho</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar..."
                      value={numeroDespacho}
                      onChange={(e) => setNumeroDespacho(e.target.value)}
                      className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-300 placeholder:text-gray-400 text-gray-900"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                    />
                    <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                <div className="flex flex-col justify-end">
                  <button
                    onClick={() => setSoloPendientes(!soloPendientes)}
                    className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 shadow-sm hover:shadow-md active:scale-95 ${soloPendientes
                        ? "bg-gradient-to-br from-blue-700 to-blue-800 text-white border-2 border-blue-800"
                        : "bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-500 hover:text-blue-600"
                      }`}
                    style={{ fontFamily: 'var(--font-poppins)', height: '42px' }}
                  >
                    <svg className={`w-5 h-5 ${soloPendientes ? "text-white" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Pendientes de Recepción</span>
                    {soloPendientes && (
                      <span className="flex h-2 w-2 rounded-full bg-white animate-pulse ml-1"></span>
                    )}
                  </button>
                </div>
              </div>

              {/* Tabla */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-blue-700 border-b-2 border-blue-800">
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">FECHA REGISTRO</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">N° DESPACHO</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">REDACTADO POR</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">PRODUCTOS</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ARCHIVO_PDF</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">FECHA LLEGADA</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">TIPO DE CARGA</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">FECHA DE ALMACÉN</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ESTADO</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">CANAL</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">FECHA<br />RECEPCIÓN</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">INCIDENCIAS</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {loadingData ? (
                        <tr>
                          <td colSpan={12} className="px-3 py-8 text-center">
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
                            </div>
                          </td>
                        </tr>
                      ) : filteredImportaciones.length === 0 ? (
                        <tr>
                          <td colSpan={12} className="px-3 py-8 text-center text-gray-500">
                            Sin registros
                          </td>
                        </tr>
                      ) : (
                        currentImportaciones.map((importacion) => (
                          <tr key={importacion.id} className="hover:bg-slate-200 transition-colors">
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{formatearFecha(importacion.fechaRegistro)}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] font-bold text-gray-700">{importacion.numeroDespacho}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{importacion.redactadoPor || "-"}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{importacion.productos || "-"}</td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              {importacion.archivoPdf && importacion.archivoPdf.trim() !== "" ? (
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const url = importacion.archivoPdf;

                                    if (!url || url.trim() === "") {
                                      alert("No hay enlace PDF disponible");
                                      return;
                                    }

                                    // Solo abrir en nueva pestaña, nunca cambiar la pestaña actual
                                    window.open(url, "_blank", "noopener,noreferrer");
                                  }}
                                  className="inline-flex items-center space-x-1 px-2.5 py-1 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                                  title="Abrir archivo PDF"
                                >
                                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ pointerEvents: 'none' }}>
                                    <path d="M6 2C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V7.41421C19 7.149 18.8946 6.89464 18.7071 6.70711L13.2929 1.29289C13.1054 1.10536 12.851 1 12.5858 1H6Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
                                    <path d="M13 1V6H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    <text x="12" y="15" fontSize="6" fill="currentColor" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="0.3">PDF</text>
                                  </svg>
                                  <span style={{ pointerEvents: 'none' }}>PDF</span>
                                </button>
                              ) : (
                                <button
                                  className="inline-flex items-center space-x-1 px-2.5 py-1 bg-gradient-to-br from-gray-400 to-gray-500 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                                  disabled
                                  title="Sin archivo PDF"
                                >
                                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ pointerEvents: 'none' }}>
                                    <path d="M6 2C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V7.41421C19 7.149 18.8946 6.89464 18.7071 6.70711L13.2929 1.29289C13.1054 1.10536 12.851 1 12.5858 1H6Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
                                    <path d="M13 1V6H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    <text x="12" y="15" fontSize="6" fill="currentColor" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="0.3">PDF</text>
                                  </svg>
                                  <span style={{ pointerEvents: 'none' }}>PDF</span>
                                </button>
                              )}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{formatearFecha(importacion.fechaLlegada)}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] font-bold text-gray-700">{importacion.tipoCarga || "-"}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{formatearFecha(importacion.fechaAlmacen)}</td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              {importacion.estado && (
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold text-white shadow-sm transition-all duration-200 ${getEstadoBadge(importacion.estado)}`} style={{ fontFamily: 'var(--font-poppins)' }}>
                                  {importacion.estado}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              {importacion.canal && (
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold text-white shadow-sm transition-all duration-200 ${getCanalBadge(importacion.canal)}`} style={{ fontFamily: 'var(--font-poppins)' }}>
                                  {importacion.canal}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{formatearFecha(importacion.fechaRecepcion)}</td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              {importacion.fechaRecepcion && importacion.fechaRecepcion.trim() !== "" && importacion.fechaRecepcion !== "null" ? (
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold text-white shadow-sm transition-all duration-200 ${importacion.incidencias
                                  ? "bg-gradient-to-br from-red-600 to-red-700"
                                  : "bg-gradient-to-br from-green-600 to-green-700"
                                  }`} style={{ fontFamily: 'var(--font-poppins)' }}>
                                  {importacion.incidencias ? "SI" : "NO"}
                                </span>
                              ) : (
                                <span className="text-[10px] text-gray-400 font-medium px-3">-</span>
                              )}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <button
                                onClick={() => {
                                  console.log('🔍 Seleccionando importación:', importacion);
                                  console.log('🔍 ID de la importación:', importacion.id);
                                  console.log('🔍 ID original:', importacion._original?.ID_IMPORTACIONES);

                                  // Guardar la importación completa para asegurar que el ID esté disponible
                                  setSelectedImportacion({
                                    ...importacion,
                                    // Asegurar que el ID esté presente
                                    id: importacion.id || importacion._original?.ID_IMPORTACIONES,
                                  });

                                  setUpdateForm({
                                    fechaRegistro: importacion.fechaRegistro || "",
                                    numeroDespacho: importacion.numeroDespacho || "",
                                    redactadoPor: importacion.redactadoPor || "",
                                    fechaLlegadaProductos: normalizarFechaParaInput(importacion.fechaLlegada) || "",
                                    fechaAlmacen: normalizarFechaParaInput(importacion.fechaAlmacen) || "",
                                    productos: importacion.productos || "",
                                    tipoCarga: importacion.tipoCarga || "",
                                    estado: importacion.estado || "",
                                    canal: importacion.canal || "",
                                  });
                                  setIsUpdateModalOpen(true);
                                }}
                                className="inline-flex items-center justify-center px-3 py-1.5 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                                title="Actualizar importación"
                                style={{ fontFamily: 'var(--font-poppins)' }}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} style={{ pointerEvents: 'none' }}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {/* Paginación */}
                <div className="bg-slate-200 px-3 py-2 flex items-center justify-between border-t-2 border-slate-300">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    «
                  </button>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    &lt;
                  </button>
                  <span className="text-[10px] text-gray-700 font-medium">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    &gt;
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    »
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal de Actualizar */}
      <Modal
        isOpen={isUpdateModalOpen}
        onClose={() => {
          setIsUpdateModalOpen(false);
          setSelectedImportacion(null);
          setUpdateForm({
            fechaRegistro: "",
            numeroDespacho: "",
            redactadoPor: "",
            fechaLlegadaProductos: "",
            fechaAlmacen: "",
            productos: "",
            tipoCarga: "",
            estado: "",
            canal: "",
          });
        }}
        title={`Actualizar Importación - ${selectedImportacion?.numeroDespacho || ""}`}
        size="lg"
        hideFooter
      >
        <div className="space-y-4">
          {/* Mensaje de error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Fecha Registro - No editable */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5" style={{ fontFamily: 'var(--font-poppins)' }}>
              Fecha Registro
            </label>
            <input
              type="text"
              value={formatearFecha(updateForm.fechaRegistro)}
              disabled
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm text-gray-500 bg-gray-100 cursor-not-allowed"
              style={{ fontFamily: 'var(--font-poppins)' }}
            />
          </div>

          {/* N° de Despacho - No editable */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5" style={{ fontFamily: 'var(--font-poppins)' }}>
              N° de Despacho
            </label>
            <input
              type="text"
              value={updateForm.numeroDespacho}
              disabled
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm text-gray-500 bg-gray-100 cursor-not-allowed"
              style={{ fontFamily: 'var(--font-poppins)' }}
            />
          </div>

          {/* Redactado Por - No editable */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5" style={{ fontFamily: 'var(--font-poppins)' }}>
              Redactado Por
            </label>
            <input
              type="text"
              value={updateForm.redactadoPor}
              disabled
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm text-gray-500 bg-gray-100 cursor-not-allowed"
              style={{ fontFamily: 'var(--font-poppins)' }}
            />
          </div>

          {/* Fecha Llegada de Productos - Editable */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5" style={{ fontFamily: 'var(--font-poppins)' }}>
              Fecha Llegada de Productos
            </label>
            <input
              type="date"
              value={updateForm.fechaLlegadaProductos}
              onChange={(e) => setUpdateForm({ ...updateForm, fechaLlegadaProductos: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white transition-all duration-200 hover:border-blue-300"
              style={{ fontFamily: 'var(--font-poppins)' }}
            />
          </div>

          {/* Fecha Almacén - Editable */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5" style={{ fontFamily: 'var(--font-poppins)' }}>
              Fecha Almacén
            </label>
            <input
              type="date"
              value={updateForm.fechaAlmacen}
              onChange={(e) => setUpdateForm({ ...updateForm, fechaAlmacen: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white transition-all duration-200 hover:border-blue-300"
              style={{ fontFamily: 'var(--font-poppins)' }}
            />
          </div>

          {/* Productos - Editable */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5" style={{ fontFamily: 'var(--font-poppins)' }}>
              Productos
            </label>
            <input
              type="text"
              value={updateForm.productos}
              onChange={(e) => setUpdateForm({ ...updateForm, productos: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white transition-all duration-200 hover:border-blue-300"
              style={{ fontFamily: 'var(--font-poppins)' }}
            />
          </div>

          {/* Tipo de Carga - Combo box editable */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5" style={{ fontFamily: 'var(--font-poppins)' }}>
              Tipo de Carga
            </label>
            <select
              value={updateForm.tipoCarga}
              onChange={(e) => setUpdateForm({ ...updateForm, tipoCarga: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white transition-all duration-200 hover:border-blue-300"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              <option value="">Seleccionar tipo de carga</option>
              <option value="1 CONTENEDOR 40 HQ">1 CONTENEDOR 40 HQ</option>
              <option value="1 CONTENEDOR 40 NOR">1 CONTENEDOR 40 NOR</option>
              <option value="1 CONTENEDOR 20 ST">1 CONTENEDOR 20 ST</option>
              <option value="CONSOLIDADO">CONSOLIDADO</option>
            </select>
          </div>

          {/* Estado - Combo box editable */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5" style={{ fontFamily: 'var(--font-poppins)' }}>
              Estado
            </label>
            <select
              value={updateForm.estado}
              onChange={(e) => setUpdateForm({ ...updateForm, estado: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white transition-all duration-200 hover:border-blue-300"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              <option value="">Seleccionar estado</option>
              <option value="PENDIENTE">PENDIENTE</option>
              <option value="PRODUCCION">PRODUCCIÓN</option>
              <option value="TRANSITO">TRANSITO</option>
              <option value="ETA">ETA</option>
            </select>
          </div>

          {/* Canal - Combo box editable */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5" style={{ fontFamily: 'var(--font-poppins)' }}>
              Canal
            </label>
            <select
              value={updateForm.canal}
              onChange={(e) => setUpdateForm({ ...updateForm, canal: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white transition-all duration-200 hover:border-blue-300"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              <option value="">Seleccione un Canal</option>
              <option value="ROJO">ROJO</option>
              <option value="VERDE">VERDE</option>
              <option value="AMARILLO">AMARILLO</option>
            </select>
          </div>

          {/* Botones */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setIsUpdateModalOpen(false);
                setSelectedImportacion(null);
                setUpdateForm({
                  fechaRegistro: "",
                  numeroDespacho: "",
                  redactadoPor: "",
                  fechaLlegadaProductos: "",
                  fechaAlmacen: "",
                  productos: "",
                  tipoCarga: "",
                  estado: "",
                  canal: "",
                });
                setError(null);
              }}
              className="px-4 py-2 text-sm font-semibold text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardarCambios}
              className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] hover:from-blue-800 hover:to-blue-900 hover:shadow-md hover:scale-105 active:scale-[0.98] rounded-lg transition-all duration-200 shadow-sm"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de Éxito */}
      <Modal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title="Éxito"
        size="md"
        primaryButtonText="Aceptar"
        onPrimaryButtonClick={() => setIsSuccessModalOpen(false)}
        hideFooter={false}
      >
        <div className="text-center py-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
            Importación Gestionada Exitosamente
          </p>
          <p className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-poppins)' }}>
            Los cambios se han guardado correctamente.
          </p>
        </div>
      </Modal>
    </div>
  );
}

