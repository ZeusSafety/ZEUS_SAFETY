"use client";
/* eslint react/no-unescaped-entities: "off" */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../components/context/AuthContext";
import { Header } from "../../../../components/layout/Header";
import { Sidebar } from "../../../../components/layout/Sidebar";
import Modal from "../../../../components/ui/Modal";

export default function IncidenciasImportacionesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redirigir a login si no hay usuario
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Mantener la barra lateral abierta en desktop (>= 1024px) y colapsable en mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    // Estado inicial
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Estados para filtros
  const [filtros, setFiltros] = useState({
    fechaDesde: "",
    fechaHasta: "",
    numeroDespacho: "",
  });

  // Estados para modales
  const [modalDetalles, setModalDetalles] = useState(false);
  const [modalObservaciones, setModalObservaciones] = useState(false);
  const [incidenciaSeleccionada, setIncidenciaSeleccionada] = useState(null);
  const [modalActualizar, setModalActualizar] = useState(false);

  // Estados para el formulario de actualización
  const [incidenciaEditando, setIncidenciaEditando] = useState({
    id: "",
    fechaCorreccion: "",
    estado: "",
    respondidoPor: "",
    estadoDespacho: "",
    numeroDespacho: "",
  });

  // Estados para gestión de productos en el modal
  const [productosNuevos, setProductosNuevos] = useState([]);
  const [resultadoBusqueda, setResultadoBusqueda] = useState([]);
  const [buscandoProducto, setBuscandoProducto] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  const [nuevoProductoForm, setNuevoProductoForm] = useState({
    item: "",
    producto: "",
    codigo: "",
    unidadMedida: "",
    cantidad: "",
    cantidadEnCaja: "",
  });

  const [isUpdatingFields, setIsUpdatingFields] = useState(false);
  const [isSavingProducts, setIsSavingProducts] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [incidencias, setIncidencias] = useState([]);
  const [allIncidencias, setAllIncidencias] = useState([]); // Nuevo estado para datos originales

  // Estado para alertas personalizadas
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info" // success, error, warning, info
  });

  const showAlert = (title, message, type = "info") => {
    setAlertConfig({
      isOpen: true,
      title,
      message,
      type
    });
  };

  // Cargar incidencias desde la API
  const fetchIncidencias = async () => {
    try {
      const api = "https://incidenciaslogisticacrud-2946605267.us-central1.run.app";
      const response = await fetch(api);
      if (response.ok) {
        const data = await response.json();
        const mappedData = Array.isArray(data) ? data.map(item => ({
          id: item.ID_INCIDENCIA,
          fechaRegistro: item.FECHA_REGISTRO,
          numeroDespacho: item.NUMERO_DESPACHO,
          pdfInicial: item.PDF_INICIAL,
          pdfIncidencia: item.PDF_INCIDENCIA,
          fechaRecepcion: item.FECHA_RECEPCION,
          fechaCorreccion: item.FECHA_CORRECCION,
          tieneIncidencias: item.TIENE_INCIDENCIAS === "SI" || item.TIENE_INCIDENCIAS === true,
          estado: item.ESTADO_INCIDENCIA,
          solucionPdf: item.SOLUCION_PDF,
          respondidoPor: item.RESPONDIDO_POR,
          estadoDespacho: item.ESTADO_DESPACHO,
          fechaRegistroFacturacion: item.FECHA_REGISTRO_FACTURACION,
          observacionesFacturacion: item.OBSERVACIONES_FACTURACION,
          observaciones: item.OBSERVACIONES || item.observaciones,
          // Guardamos las originales por si acaso
          ...item
        })) : [];
        setIncidencias(mappedData);
        setAllIncidencias(mappedData);
      }
    } catch (error) {
      console.error("Error al cargar incidencias:", error);
    }
  };

  // Cargar productos de una incidencia específica
  const fetchProductosIncidencia = async (idIncidencia) => {
    try {
      const api = "https://incidenciaslogisticacrud-2946605267.us-central1.run.app";
      const response = await fetch(`${api}?id=${idIncidencia}`);

      if (response.ok) {
        const data = await response.json();
        console.log("📦 Productos recibidos de la API:", data);

        // Convertir a array si es un objeto individual
        let productos = Array.isArray(data) ? data : (data ? [data] : []);

        // Mapear productos al formato esperado
        const productosMapeados = productos.map((p, index) => ({
          item: p.ITEM || (index + 1),
          unidadMedida: p.UNIDAD_MEDIDA || "N/A",
          producto: p.PRODUCTO || "N/A",
          cantidadInicial: p.CANTIDAD_INICIAL || "0",
          cantidadRecibida: p.CANTIDAD_RECIBIDA || "0",
          motivo: p.MOTIVO || "Sin motivo especificado"
        }));

        console.log("✅ Productos mapeados:", productosMapeados);

        // Actualizar la incidencia seleccionada con los productos
        setIncidenciaSeleccionada(prev => ({
          ...prev,
          productosAfectados: productosMapeados
        }));
      } else {
        console.error("❌ Error al cargar productos:", response.status);
        setIncidenciaSeleccionada(prev => ({
          ...prev,
          productosAfectados: []
        }));
      }
    } catch (error) {
      console.error("❌ Error al cargar productos:", error);
      setIncidenciaSeleccionada(prev => ({
        ...prev,
        productosAfectados: []
      }));
    }
  };

  useEffect(() => {
    fetchIncidencias();
  }, []);

  // Función para buscar productos
  const handleProductSearch = async (query) => {
    if (!query) {
      setResultadoBusqueda([]);
      setShowAutocomplete(false);
      return;
    }
    setBuscandoProducto(true);
    try {
      const response = await fetch("https://productoscrud-2946605267.us-central1.run.app");
      if (response.ok) {
        const data = await response.json();
        const filtrados = data.filter(p =>
          (p.NOMBRE && p.NOMBRE.toLowerCase().includes(query.toLowerCase())) ||
          (p.CODIGO && p.CODIGO.toLowerCase().includes(query.toLowerCase()))
        );
        setResultadoBusqueda(filtrados.slice(0, 10));
        setShowAutocomplete(true);
      }
    } catch (error) {
      console.error("Error al buscar productos:", error);
    } finally {
      setBuscandoProducto(false);
    }
  };

  // Función para abrir el modal de actualización
  const handleOpenActualizar = (incidencia) => {
    setIncidenciaEditando({
      id: incidencia.ID_INCIDENCIA || incidencia.id,
      fechaCorreccion: incidencia.FECHA_CORRECCION ? incidencia.FECHA_CORRECCION.split(" ")[0] : "",
      estado: incidencia.ESTADO_INCIDENCIA || incidencia.estado || "",
      respondidoPor: incidencia.RESPONDIDO_POR || incidencia.respondidoPor || "",
      estadoDespacho: incidencia.ESTADO_DESPACHO || incidencia.estadoDespacho || "",
      numeroDespacho: incidencia.NUMERO_DESPACHO || incidencia.numeroDespacho || "",
    });
    setProductosNuevos([]);
    setModalActualizar(true);
  };

  // Función para actualizar solo los 4 campos
  const handleUpdateFields = async () => {
    if (!incidenciaEditando.fechaCorreccion || !incidenciaEditando.estado || !incidenciaEditando.respondidoPor || !incidenciaEditando.estadoDespacho) {
      showAlert("Campos Incompletos", "Por favor complete todos los campos requeridos", "warning");
      return;
    }
    setIsUpdatingFields(true);
    try {
      const data = {
        fecha_correcion: incidenciaEditando.fechaCorreccion,
        estado_incidencia: incidenciaEditando.estado,
        respondido_por: incidenciaEditando.respondidoPor,
        estado_despacho: incidenciaEditando.estadoDespacho,
        id: parseInt(incidenciaEditando.id)
      };
      const response = await fetch("https://incidenciaslogisticacrud-2946605267.us-central1.run.app", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (response.ok) {
        showAlert("Éxito", "Incidencia actualizada correctamente", "success");
        fetchIncidencias();
      }
    } catch (error) {
      console.error("Error al actualizar campos:", error);
      showAlert("Error", "Error al actualizar la incidencia", "error");
    } finally {
      setIsUpdatingFields(false);
    }
  };

  // Función para extraer importación inicial
  const handleExtractInitial = async () => {
    if (!incidenciaEditando.numeroDespacho) {
      showAlert("Atención", "No hay un número de despacho disponible para extraer", "warning");
      return;
    }

    setIsExtracting(true);
    try {
      console.log("🔄 Extrayendo importación inicial para despacho:", incidenciaEditando.numeroDespacho);
      const response = await fetch(`https://importacionesvr01crud-2946605267.us-central1.run.app?despacho=${encodeURIComponent(incidenciaEditando.numeroDespacho)}`);

      if (response.ok) {
        const data = await response.json();
        console.log("📦 Datos de importación recibidos:", data);

        if (data.detalles && Array.isArray(data.detalles) && data.detalles.length > 0) {
          const mapped = data.detalles.map((d, i) => ({
            item: d.ITEM || (i + 1),
            producto: d.PRODUCTO || "N/A",
            codigo: d.CODIGO || "N/A",
            unidadMedida: d.UNIDAD_MEDIDA || "N/A",
            cantidadEnCaja: 0,
            cantidad: d.CANTIDAD || 0,
          }));

          setProductosNuevos(mapped);
          showAlert("Éxito", `Se extrajeron ${mapped.length} productos de la importación inicial`, "success");
          console.log("✅ Productos extraídos:", mapped);
        } else {
          showAlert("Aviso", "No se encontraron productos en la importación inicial", "warning");
          console.log("⚠️ No hay detalles en la respuesta");
        }
      } else {
        showAlert("Error", "Error al extraer la importación inicial", "error");
        console.error("❌ Error en la respuesta:", response.status);
      }
    } catch (error) {
      console.error("❌ Error al extraer importación:", error);
      showAlert("Error", "Error al conectar con el servidor para extraer la importación", "error");
    } finally {
      setIsExtracting(false);
    }
  };

  // Función para guardar solo productos
  const handleSaveProducts = async () => {
    if (productosNuevos.length === 0) {
      showAlert("Atención", "No hay productos para guardar", "warning");
      return;
    }
    setIsSavingProducts(true);
    try {
      const payload = {
        numeroDespacho: incidenciaEditando.numeroDespacho || "N/A",
        redactadoPor: incidenciaEditando.respondidoPor,
        fecha: incidenciaEditando.fechaCorreccion,
        tipoCarga: "",
        productos: productosNuevos.map(p => ({
          numero: parseInt(p.item),
          producto: p.producto,
          codigo: p.codigo,
          unidad: p.unidadMedida,
          cantidad: parseFloat(p.cantidad),
          cantidadEnCaja: parseFloat(p.cantidadEnCaja)
        })),
        totalCantidad: productosNuevos.reduce((sum, p) => sum + (parseFloat(p.cantidad) || 0), 0),
        totalCantidadEnCaja: productosNuevos.reduce((sum, p) => sum + (parseFloat(p.cantidadEnCaja) || 0), 0)
      };
      const response = await fetch("https://generacionespdfappscript-2946605267.us-central1.run.app?metodo=ficha_importacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        showAlert("Éxito", "Productos guardados exitosamente", "success");
        setModalActualizar(false);
        fetchIncidencias();
      }
    } catch (error) {
      console.error("Error al guardar productos:", error);
      showAlert("Error", "Error al guardar los productos", "error");
    } finally {
      setIsSavingProducts(false);
    }
  };

  const addProductToList = () => {
    if (!nuevoProductoForm.producto || !nuevoProductoForm.codigo) {
      showAlert("Atención", "Debe seleccionar un producto", "warning");
      return;
    }
    setProductosNuevos([...productosNuevos, { ...nuevoProductoForm }]);
    setNuevoProductoForm({
      item: "",
      producto: "",
      codigo: "",
      unidadMedida: "",
      cantidad: "",
      cantidadEnCaja: "",
    });
  };

  const removeProductFromList = (index) => {
    const list = [...productosNuevos];
    list.splice(index, 1);
    setProductosNuevos(list);
  };

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const totalPages = Math.ceil(incidencias.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const incidenciasPaginadas = incidencias.slice(startIndex, endIndex);

  // Formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return "N/A";
    try {
      const date = new Date(fecha);
      const dia = String(date.getDate()).padStart(2, "0");
      const mes = String(date.getMonth() + 1).padStart(2, "0");
      const año = date.getFullYear();
      const horas = String(date.getHours()).padStart(2, "0");
      const minutos = String(date.getMinutes()).padStart(2, "0");
      return `${dia}/${mes}/${año}, ${horas}:${minutos}`;
    } catch (e) {
      return fecha;
    }
  };

  // Formatear fecha con AM/PM
  const formatearFechaAMPM = (fecha) => {
    if (!fecha) return "N/A";
    try {
      const date = new Date(fecha);
      const dia = String(date.getDate()).padStart(2, "0");
      const mes = String(date.getMonth() + 1).padStart(2, "0");
      const año = date.getFullYear();
      let horas = date.getHours();
      const minutos = String(date.getMinutes()).padStart(2, "0");
      const ampm = horas >= 12 ? "p. m." : "a. m.";
      horas = horas % 12;
      horas = horas ? horas : 12;
      return `${dia}/${mes}/${año}, ${String(horas).padStart(2, "0")}:${minutos} ${ampm}`;
    } catch (e) {
      return fecha;
    }
  };

  // Manejar ver detalles
  const handleVerDetalles = async (incidencia) => {
    setIncidenciaSeleccionada(incidencia);
    setModalDetalles(true);

    // Cargar productos desde la API
    const idIncidencia = incidencia.id || incidencia.ID_INCIDENCIA;
    console.log("🔍 Cargando productos para incidencia:", idIncidencia);
    await fetchProductosIncidencia(idIncidencia);
  };

  // Manejar ver observaciones
  const handleVerObservaciones = (incidencia) => {
    setIncidenciaSeleccionada(incidencia);
    setModalObservaciones(true);
  };

  // Manejar búsqueda
  const handleBuscar = () => {
    let filtrados = [...allIncidencias];

    if (filtros.fechaDesde) {
      filtrados = filtrados.filter(item => {
        if (!item.fechaRegistro) return false;
        // Comparar solo la parte de la fecha YYYY-MM-DD
        return item.fechaRegistro.split(' ')[0] >= filtros.fechaDesde;
      });
    }

    if (filtros.fechaHasta) {
      filtrados = filtrados.filter(item => {
        if (!item.fechaRegistro) return false;
        return item.fechaRegistro.split(' ')[0] <= filtros.fechaHasta;
      });
    }

    if (filtros.numeroDespacho) {
      // Normalizar: quitar espacios y pasar a minúsculas
      const termino = filtros.numeroDespacho.toLowerCase().replace(/\s+/g, '');
      filtrados = filtrados.filter(item =>
        item.numeroDespacho && item.numeroDespacho.toLowerCase().replace(/\s+/g, '').includes(termino)
      );
    }

    setIncidencias(filtrados);
    setCurrentPage(1);
    console.log(`Búsqueda completada. Encontrados: ${filtrados.length} registros.`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
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

      <div
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${sidebarOpen ? "lg:ml-60 ml-0" : "ml-0"
          }`}
      >
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto custom-scrollbar" style={{ background: '#F7FAFF' }}>
          <div className="max-w-[95%] mx-auto px-4 py-4">
            {/* Botón Volver */}
            <button
              onClick={() => router.push("/administracion")}
              className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-lg font-medium hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm ripple-effect relative overflow-hidden text-sm group"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver a Administración</span>
            </button>

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
                    <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>Incidencias Registradas</h1>
                    <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: 'var(--font-poppins)' }}>
                      Gestiona y revisa las incidencias de importaciones
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 rounded-lg px-3 py-1.5 bg-green-50 border border-green-200">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-semibold text-green-700" style={{ fontFamily: 'var(--font-poppins)' }}>API Conectada</span>
                </div>
              </div>

              {/* Filtros de Búsqueda */}
              <div className="mb-6">
                <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                  Filtros de Búsqueda
                </h3>
                <div className="flex items-end gap-4">
                  <div className="w-[160px]">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Fecha Desde:</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={filtros.fechaDesde}
                        onChange={(e) => setFiltros({ ...filtros, fechaDesde: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                      />
                    </div>
                  </div>
                  <div className="w-[160px]">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Fecha Hasta:</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={filtros.fechaHasta}
                        onChange={(e) => setFiltros({ ...filtros, fechaHasta: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Número de Despacho:</label>
                    <input
                      type="text"
                      value={filtros.numeroDespacho}
                      onChange={(e) => setFiltros({ ...filtros, numeroDespacho: e.target.value })}
                      placeholder="Buscar por número de despacho"
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                    />
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={handleBuscar}
                      className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105 active:scale-[0.98] text-sm"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span>Buscar</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Tabla y paginación */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-blue-700 to-blue-800 border-b-2 border-blue-900">
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>ID Incidencia</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Fecha de Registro</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Número de Despacho</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>PDF Inicial</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>PDF Incidencia</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Ver Detalles</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Fecha de Recepción</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Fecha de Corrección</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Incidencias?</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>ESTADO</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Solución PDF</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>RESPONDIDO POR</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>ESTADO DESPACHO</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>FECHA REGISTRO FACTURACIÓN</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>OBSERVACIONES FACTURACIÓN</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Actualizar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {incidenciasPaginadas.map((incidencia) => (
                        <tr key={incidencia.id} className="hover:bg-blue-50 transition-colors border-b border-gray-100">
                          <td className="px-4 py-3 whitespace-nowrap text-[10px] font-medium text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>{incidencia.id}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{formatearFecha(incidencia.fechaRegistro)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-[10px] font-bold text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{incidencia.numeroDespacho}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-[10px] relative" style={{ pointerEvents: 'auto' }}>
                            {incidencia.pdfInicial ? (
                              <div
                                className="pdf-button-container inline-flex items-center space-x-1 px-2.5 py-1 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                                style={{ fontFamily: 'var(--font-poppins)' }}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const url = incidencia.pdfInicial;
                                  if (!url || url.trim() === "") {
                                    showAlert("Atención", "No hay enlace PDF disponible", "warning");
                                    return;
                                  }
                                  window.open(url, "_blank", "noopener,noreferrer");
                                }}
                                role="button"
                                tabIndex={0}
                              >
                                <svg
                                  className="w-4 h-4"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M6 2C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V7.41421C19 7.149 18.8946 6.89464 18.7071 6.70711L13.2929 1.29289C13.1054 1.10536 12.851 1 12.5858 1H6Z"
                                    stroke="currentColor"
                                    strokeWidth={1.5}
                                    fill="none"
                                  />
                                  <path
                                    d="M13 1V6H18"
                                    stroke="currentColor"
                                    strokeWidth={1.5}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  <text
                                    x="12"
                                    y="15"
                                    fontSize={6}
                                    fill="currentColor"
                                    fontWeight="bold"
                                    textAnchor="middle"
                                    fontFamily="Arial, sans-serif"
                                    letterSpacing="0.3"
                                  >
                                    PDF
                                  </text>
                                </svg>
                              </div>
                            ) : (
                              <span className="text-gray-400">No disponible</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-[10px] relative" style={{ pointerEvents: 'auto' }}>
                            {incidencia.pdfIncidencia ? (
                              <div
                                className="pdf-button-container inline-flex items-center space-x-1 px-2.5 py-1 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                                style={{ fontFamily: 'var(--font-poppins)' }}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const url = incidencia.pdfIncidencia;
                                  if (!url || url.trim() === "") {
                                    showAlert("Atención", "No hay enlace PDF disponible", "warning");
                                    return;
                                  }
                                  window.open(url, "_blank", "noopener,noreferrer");
                                }}
                                role="button"
                                tabIndex={0}
                              >
                                <svg
                                  className="w-4 h-4"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M6 2C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V7.41421C19 7.149 18.8946 6.89464 18.7071 6.70711L13.2929 1.29289C13.1054 1.10536 12.851 1 12.5858 1H6Z"
                                    stroke="currentColor"
                                    strokeWidth={1.5}
                                    fill="none"
                                  />
                                  <path
                                    d="M13 1V6H18"
                                    stroke="currentColor"
                                    strokeWidth={1.5}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  <text
                                    x="12"
                                    y="15"
                                    fontSize={6}
                                    fill="currentColor"
                                    fontWeight="bold"
                                    textAnchor="middle"
                                    fontFamily="Arial, sans-serif"
                                    letterSpacing="0.3"
                                  >
                                    PDF
                                  </text>
                                </svg>
                              </div>
                            ) : (
                              <span className="text-gray-400">No disponible</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <button
                              onClick={() => handleVerDetalles(incidencia)}
                              className="flex items-center justify-center px-3 py-1.5 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                              style={{ fontFamily: 'var(--font-poppins)' }}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{formatearFecha(incidencia.fechaRecepcion)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{formatearFecha(incidencia.fechaCorreccion)}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold text-white shadow-sm transition-all duration-200 ${incidencia.tieneIncidencias
                              ? "bg-gradient-to-br from-green-600 to-green-700"
                              : "bg-gradient-to-br from-red-600 to-red-700"
                              }`} style={{ fontFamily: 'var(--font-poppins)' }}>
                              {incidencia.tieneIncidencias ? "SI" : "NO"}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold text-white shadow-sm transition-all duration-200 ${incidencia.estado === "COMPLETADO"
                              ? "bg-gradient-to-br from-green-600 to-green-700"
                              : incidencia.estado === "REVISADO"
                                ? "bg-gradient-to-br from-orange-500 to-orange-600"
                                : "bg-gradient-to-br from-gray-500 to-gray-600"
                              }`} style={{ fontFamily: 'var(--font-poppins)' }}>
                              {incidencia.estado}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-[10px] relative" style={{ pointerEvents: 'auto' }}>
                            {incidencia.solucionPdf ? (
                              <div
                                className="pdf-button-container inline-flex items-center space-x-1 px-2.5 py-1 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                                style={{ fontFamily: 'var(--font-poppins)' }}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const url = incidencia.solucionPdf;
                                  if (!url || url.trim() === "") {
                                    showAlert("Atención", "No hay enlace PDF disponible", "warning");
                                    return;
                                  }
                                  window.open(url, "_blank", "noopener,noreferrer");
                                }}
                                role="button"
                                tabIndex={0}
                              >
                                <svg
                                  className="w-4 h-4"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M6 2C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V7.41421C19 7.149 18.8946 6.89464 18.7071 6.70711L13.2929 1.29289C13.1054 1.10536 12.851 1 12.5858 1H6Z"
                                    stroke="currentColor"
                                    strokeWidth={1.5}
                                    fill="none"
                                  />
                                  <path
                                    d="M13 1V6H18"
                                    stroke="currentColor"
                                    strokeWidth={1.5}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  <text
                                    x="12"
                                    y="15"
                                    fontSize={6}
                                    fill="currentColor"
                                    fontWeight="bold"
                                    textAnchor="middle"
                                    fontFamily="Arial, sans-serif"
                                    letterSpacing="0.3"
                                  >
                                    PDF
                                  </text>
                                </svg>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{incidencia.respondidoPor}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold text-white shadow-sm transition-all duration-200 ${incidencia.estadoDespacho === "CONCLUIDO"
                              ? "bg-gradient-to-br from-green-600 to-green-700"
                              : "bg-gradient-to-br from-red-600 to-red-700"
                              }`} style={{ fontFamily: 'var(--font-poppins)' }}>
                              {incidencia.estadoDespacho}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>
                            {incidencia.fechaRegistroFacturacion ? formatearFechaAMPM(incidencia.fechaRegistroFacturacion) : "N/A"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {incidencia.observacionesFacturacion ? (
                              <button
                                onClick={() => handleVerObservaciones(incidencia)}
                                className="flex items-center justify-center px-3 py-1.5 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                style={{ fontFamily: 'var(--font-poppins)' }}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                            ) : (
                              <span className="text-gray-400 text-[10px]" style={{ fontFamily: 'var(--font-poppins)' }}>N/A</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <button
                              onClick={() => handleOpenActualizar(incidencia)}
                              className="flex items-center justify-center px-3 py-1.5 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                              style={{ fontFamily: 'var(--font-poppins)' }}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
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
                    onClick={() => setCurrentPage(currentPage - 1)}
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
                    onClick={() => setCurrentPage(currentPage + 1)}
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
              </div>
            </div>
            {/* Cierre del contenedor principal de la página (max-w-[95%]) */}
          </div>
        </main>
      </div>

      {/* Modal Ver Detalles */}
      <Modal
        isOpen={modalDetalles}
        onClose={() => {
          setModalDetalles(false);
          setIncidenciaSeleccionada(null);
        }}
        title="Detalles de la Incidencia"
        size="5xl"
      >
        {incidenciaSeleccionada && (
          <div className="space-y-6">
            {/* Productos Afectados */}
            <div className="bg-white rounded-xl border-2 border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  Productos Afectados
                </h4>
                <button className="flex items-center space-x-1.5 px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span>Generar PDF</span>
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-blue-700 border-b-2 border-blue-800">
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ITEM</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Unidad de Medida</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Producto</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Cantidad Inicial</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Cantidad Recibida</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Motivo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {incidenciaSeleccionada.productosAfectados && incidenciaSeleccionada.productosAfectados.length > 0 ? (
                      incidenciaSeleccionada.productosAfectados.map((producto, index) => (
                        <tr key={index} className="hover:bg-slate-200 transition-colors">
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{producto.item}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{producto.unidadMedida}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{producto.producto}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{producto.cantidadInicial}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{producto.cantidadRecibida}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{producto.motivo}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-3 py-2 text-center text-[10px] text-gray-500">
                          No hay productos afectados registrados
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Observaciones */}
            <div className="bg-white rounded-xl border-2 border-gray-200 p-4 shadow-sm">
              <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Observaciones
              </h4>
              <textarea
                value={incidenciaSeleccionada.observaciones || ""}
                readOnly
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm text-gray-900 bg-white resize-none"
                rows={6}
                style={{ overflowY: "auto" }}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Observaciones Facturación */}
      <Modal
        isOpen={modalObservaciones}
        onClose={() => {
          setModalObservaciones(false);
          setIncidenciaSeleccionada(null);
        }}
        title="Observaciones de Facturación"
        size="2xl"
      >
        {incidenciaSeleccionada && (
          <div className="bg-white rounded-xl border-2 border-gray-200 p-4 shadow-sm">
            <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Observaciones
            </h4>
            <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-sm text-gray-800 min-h-[100px] whitespace-pre-wrap">
              {incidenciaSeleccionada.observacionesFacturacion || "No hay observaciones registradas."}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Actualizar Incidencia */}
      <Modal
        isOpen={modalActualizar}
        onClose={() => setModalActualizar(false)}
        title="Actualizar Incidencia"
        size="5xl"
      >
        <div className="space-y-6 pb-4">
          {/* Sección 1: Formulario de Estado */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Fecha de Corrección:
                </label>
                <input
                  type="date"
                  value={incidenciaEditando.fechaCorreccion}
                  onChange={(e) => setIncidenciaEditando({ ...incidenciaEditando, fechaCorreccion: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 text-gray-900"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Estado:
                </label>
                <select
                  value={incidenciaEditando.estado}
                  onChange={(e) => setIncidenciaEditando({ ...incidenciaEditando, estado: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 text-gray-900"
                >
                  <option value="">Seleccionar...</option>
                  <option value="PENDIENTE">PENDIENTE</option>
                  <option value="REVISADO">REVISADO</option>
                  <option value="COMPLETADO">COMPLETADO</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Respondido Por:
                </label>
                <select
                  value={incidenciaEditando.respondidoPor}
                  onChange={(e) => setIncidenciaEditando({ ...incidenciaEditando, respondidoPor: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 text-gray-900"
                >
                  <option value="">Seleccionar...</option>
                  <option value="KIMBERLY">KIMBERLY</option>
                  <option value="HERVIN">HERVIN</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  Estado Despacho:
                </label>
                <select
                  value={incidenciaEditando.estadoDespacho}
                  onChange={(e) => setIncidenciaEditando({ ...incidenciaEditando, estadoDespacho: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 text-gray-900"
                >
                  <option value="">Seleccionar...</option>
                  <option value="CONCLUIDO">CONCLUIDO</option>
                  <option value="NO CONCLUIDO">NO CONCLUIDO</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleUpdateFields}
              disabled={isUpdatingFields}
              className="w-full mt-4 flex items-center justify-center space-x-2 py-3 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              {isUpdatingFields ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              <span>Actualizar Incidencia</span>
            </button>
          </div>

          {/* Sección 2: Agregar Producto */}
          <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 p-6 space-y-4">
            <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Agregar Producto con Incidencia
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[12px] font-bold text-gray-600 ml-1">Item:</label>
                <input
                  type="number"
                  placeholder="Número de item"
                  value={nuevoProductoForm.item}
                  onChange={(e) => setNuevoProductoForm({ ...nuevoProductoForm, item: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900"
                />
              </div>
              <div className="space-y-1 relative">
                <label className="text-[12px] font-bold text-gray-600 ml-1">Producto:</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar producto..."
                    value={nuevoProductoForm.producto}
                    onChange={(e) => {
                      setNuevoProductoForm({ ...nuevoProductoForm, producto: e.target.value });
                      handleProductSearch(e.target.value);
                    }}
                    onFocus={() => { if (resultadoBusqueda.length > 0) setShowAutocomplete(true); }}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900"
                  />
                  {buscandoProducto && (
                    <div className="absolute right-3 top-2.5">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}

                  {showAutocomplete && resultadoBusqueda.length > 0 && (
                    <div className="absolute z-[100] top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                      {resultadoBusqueda.map((p, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setNuevoProductoForm({ ...nuevoProductoForm, producto: p.NOMBRE, codigo: p.CODIGO });
                            setShowAutocomplete(false);
                          }}
                          className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                        >
                          <p className="text-sm font-bold text-gray-900">{p.NOMBRE}</p>
                          <p className="text-[11px] text-gray-500">Código: {p.CODIGO}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[12px] font-bold text-gray-600 ml-1">Código:</label>
                <input
                  type="text"
                  placeholder="Código automático"
                  value={nuevoProductoForm.codigo}
                  readOnly
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-900 cursor-not-allowed"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[12px] font-bold text-gray-600 ml-1">Unidad de Medida:</label>
                <select
                  value={nuevoProductoForm.unidadMedida}
                  onChange={(e) => setNuevoProductoForm({ ...nuevoProductoForm, unidadMedida: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900"
                >
                  <option value="">Seleccione...</option>
                  <option value="unidades">Unidades</option>
                  <option value="docenas">Docenas</option>
                  <option value="paquetes">Paquetes</option>
                  <option value="cajas">Cajas</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[12px] font-bold text-gray-600 ml-1">Cantidad:</label>
                <input
                  type="number"
                  placeholder="0"
                  value={nuevoProductoForm.cantidad}
                  onChange={(e) => setNuevoProductoForm({ ...nuevoProductoForm, cantidad: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[12px] font-bold text-gray-600 ml-1">Cantidad en Caja:</label>
                <input
                  type="number"
                  placeholder="0"
                  value={nuevoProductoForm.cantidadEnCaja}
                  onChange={(e) => setNuevoProductoForm({ ...nuevoProductoForm, cantidadEnCaja: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900"
                />
              </div>
            </div>

            <button
              onClick={addProductToList}
              className="mt-2 flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-br from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white rounded-full font-bold shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.95]"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Agregar a la Lista</span>
            </button>
          </div>

          {/* Sección 3: Tabla de Productos Agregados */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Productos Agregados
              </h4>
              <button
                onClick={handleExtractInitial}
                disabled={isExtracting}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
                style={{ fontFamily: 'var(--font-poppins)' }}
              >
                {isExtracting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                )}
                <span>Extraer Importación Inicial</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-700 to-blue-800 border-b-2 border-blue-900 text-white font-bold text-[11px] uppercase tracking-wider">
                    <th className="px-4 py-3 text-left">Item</th>
                    <th className="px-4 py-3 text-left">Producto</th>
                    <th className="px-4 py-3 text-left">Código</th>
                    <th className="px-4 py-3 text-left">Unidad</th>
                    <th className="px-4 py-3 text-left">Cant. en Caja</th>
                    <th className="px-4 py-3 text-left">Cantidad</th>
                    <th className="px-4 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {productosNuevos.length > 0 ? (
                    productosNuevos.map((p, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-xs text-gray-900 font-medium">{p.item}</td>
                        <td className="px-4 py-3 text-xs text-gray-700">{p.producto}</td>
                        <td className="px-4 py-3 text-xs text-gray-700">{p.codigo}</td>
                        <td className="px-4 py-3 text-xs text-gray-700">{p.unidadMedida}</td>
                        <td className="px-4 py-3 text-xs text-gray-700 font-bold">{p.cantidadEnCaja}</td>
                        <td className="px-4 py-3 text-xs text-gray-700 font-bold">{p.cantidad}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => removeProductFromList(idx)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500 italic">
                        No hay productos agregados a la lista local
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-100">
            <button
              onClick={() => setModalActualizar(false)}
              className="px-6 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 active:scale-[0.98]"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveProducts}
              disabled={isSavingProducts}
              className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-br from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 active:scale-[0.98] flex items-center space-x-2 disabled:opacity-50"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              {isSavingProducts ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
              )}
              <span>Guardar Solo Productos</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Alerta Personalizada */}
      <Modal
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })}
        title={alertConfig.title}
        size="md"
      >
        <div className="p-4">
          <div className="flex items-center gap-4 mb-6">
            {alertConfig.type === 'success' && (
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
            )}
            {alertConfig.type === 'error' && (
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </div>
            )}
            {alertConfig.type === 'warning' && (
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
            )}
            {alertConfig.type === 'info' && (
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
            )}
            <div className="flex-1">
              <p className="text-gray-800 text-sm font-medium leading-relaxed" style={{ fontFamily: 'var(--font-poppins)' }}>
                {alertConfig.message}
              </p>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button
              onClick={() => setAlertConfig({ ...alertConfig, isOpen: false })}
              className="px-6 py-2 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-sm font-bold shadow-md hover:shadow-lg active:scale-[0.98]"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              Aceptar
            </button>
          </div>
        </div>
      </Modal>
    </div >
  );
}

