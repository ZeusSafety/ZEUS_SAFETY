"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/context/AuthContext";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";
import { color } from "framer-motion";

// Componente Combobox personalizado con diseño de la imagen
const CustomCombobox = ({ value, onChange, options, placeholder, disabled = false, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const selectRef = useRef(null);
  const buttonRef = useRef(null);

  // Solo considerar seleccionado si el valor no está vacío y existe en las opciones
  const selectedOption = value && value !== "" ? options.find(opt => opt.value === value) : null;

  const handleSelect = (optionValue) => {
    if (disabled) return;
    onChange({ target: { value: optionValue } });
    setIsOpen(false);
  };

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = 200;
      setOpenUpward(spaceAbove > spaceBelow && spaceBelow < dropdownHeight);
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={selectRef}>
      {label && (
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          {label}
        </label>
      )}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`w-full px-3 py-2 rounded-lg focus:outline-none text-sm text-left flex items-center justify-between transition-all border-2 ${isOpen
          ? 'bg-blue-700 text-white border-blue-700'
          : selectedOption
            ? 'bg-blue-700 text-white border-blue-700'
            : 'bg-white border-gray-300 text-gray-500 hover:border-blue-300'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className="whitespace-nowrap overflow-hidden text-ellipsis">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`w-4 h-4 transition-transform flex-shrink-0 ml-2 ${isOpen ? 'transform rotate-180' : ''
            } ${isOpen || selectedOption ? 'text-white' : 'text-gray-400'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div
          className={`absolute z-50 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-xl overflow-hidden ${openUpward ? 'bottom-full mb-1' : 'top-full'
            }`}
          style={{ maxHeight: '200px', overflowY: 'auto' }}
        >
          {options.map((option, index) => (
            <button
              key={option.value || index}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`w-full px-3 py-2.5 text-sm text-left transition-colors border-b border-gray-100 last:border-b-0 ${value === option.value
                ? 'bg-blue-700 text-white font-semibold'
                : 'text-gray-900 hover:bg-blue-50'
                } ${index === 0 && !option.value ? 'text-gray-500 italic' : ''}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default function RegistroImportacionesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Estados para el formulario
  const [formData, setFormData] = useState({
    fechaRegistro: new Date().toISOString().split('T')[0],
    numeroDespacho: "",
    responsable: "",
    fechaLlegada: "",
    tipoCarga: "",
    estado: "",
    descripcionGeneral: "",
  });

  // Estados para productos
  const [productoBusqueda, setProductoBusqueda] = useState("");
  const [codigoProducto, setCodigoProducto] = useState("");
  const [sugerenciasProductos, setSugerenciasProductos] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [buscandoProductos, setBuscandoProductos] = useState(false);
  const [todosLosProductos, setTodosLosProductos] = useState([]);
  const [productosCargados, setProductosCargados] = useState(false);
  const sugerenciasRef = useRef(null);
  const productoInputRef = useRef(null);

  // Estados para detalle de producto
  const [detalleProducto, setDetalleProducto] = useState({
    unidadMedida: "",
    cantidad: "",
    cantidadCaja: "",
    imagen: null,
  });

  // Lista de productos agregados
  const [listaProductos, setListaProductos] = useState([]);

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

  // Función para obtener el token de autenticación
  const getAuthToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  };

  // Función para cargar todos los productos desde la API
  const cargarTodosLosProductos = async () => {
    if (productosCargados) {
      return;
    }

    const token = getAuthToken();
    if (!token) {
      console.error("No se encontró token de autenticación");
      return;
    }

    setBuscandoProductos(true);
    try {
      const url = `https://api-productos-zeus-2946605267.us-central1.run.app/productos/5?method=BUSQUEDA_PRODUCTO`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.error(`Error ${response.status}: ${response.statusText}`);
        setBuscandoProductos(false);
        return;
      }

      const data = await response.json();
      const productos = Array.isArray(data) ? data : (data.data || []);

      console.log("Productos cargados:", productos.length);
      setTodosLosProductos(productos);
      setProductosCargados(true);
    } catch (error) {
      console.error("Error al cargar productos:", error);
    } finally {
      setBuscandoProductos(false);
    }
  };

  // Función para filtrar productos localmente
  const filtrarProductos = (termino) => {
    if (todosLosProductos.length === 0) {
      setSugerenciasProductos([]);
      setMostrarSugerencias(false);
      return;
    }

    const terminoLower = termino.toLowerCase().trim();
    if (terminoLower.length < 1) {
      setSugerenciasProductos([]);
      setMostrarSugerencias(false);
      return;
    }

    const filtrados = todosLosProductos.filter((prod) => {
      const nombre = (prod.NOMBRE || prod.nombre || "").toLowerCase();
      const codigo = (prod.CODIGO || prod.codigo || "").toLowerCase();
      return nombre.includes(terminoLower) || codigo.includes(terminoLower);
    });

    setSugerenciasProductos(filtrados);
    setMostrarSugerencias(filtrados.length > 0);
  };

  // Función para buscar productos
  const buscarProductos = (termino) => {
    if (!termino || termino.trim().length < 1) {
      setSugerenciasProductos([]);
      setMostrarSugerencias(false);
      return;
    }

    // Si no hay productos cargados, cargarlos primero
    if (!productosCargados && todosLosProductos.length === 0) {
      cargarTodosLosProductos().then(() => {
        // Después de cargar, filtrar con el término
        filtrarProductos(termino);
      });
      return;
    }

    filtrarProductos(termino);
  };

  // Manejar cambio en búsqueda de producto
  const handleProductoBusquedaChange = (e) => {
    const valor = e.target.value;
    setProductoBusqueda(valor);
    buscarProductos(valor);
  };

  // Seleccionar producto
  const seleccionarProducto = (producto) => {
    const nombre = producto.NOMBRE || producto.nombre || "";
    const codigo = producto.CODIGO || producto.codigo || "";
    setProductoBusqueda(nombre);
    setCodigoProducto(codigo);
    setSugerenciasProductos([]);
    setMostrarSugerencias(false);
  };

  // Manejar focus en input de producto
  const handleProductoFocus = () => {
    // Cargar productos si no están cargados
    if (!productosCargados && todosLosProductos.length === 0) {
      cargarTodosLosProductos();
    }

    // Si hay texto y sugerencias previas, mostrarlas
    if (productoBusqueda && sugerenciasProductos.length > 0) {
      setMostrarSugerencias(true);
    }
  };

  // Agregar producto a la lista
  const agregarProductoALista = () => {
    if (!productoBusqueda || !codigoProducto) {
      alert("Por favor, seleccione un producto");
      return;
    }

    if (!detalleProducto.unidadMedida || !detalleProducto.cantidad) {
      alert("Por favor, complete la unidad de medida y cantidad");
      return;
    }

    const nuevoProducto = {
      id: Date.now(),
      producto: productoBusqueda,
      codigo: codigoProducto,
      unidadMedida: detalleProducto.unidadMedida,
      cantidad: detalleProducto.cantidad,
      cantidadCaja: detalleProducto.cantidadCaja || "",
      imagen: detalleProducto.imagen,
    };

    setListaProductos([...listaProductos, nuevoProducto]);

    // Limpiar campos
    setProductoBusqueda("");
    setCodigoProducto("");
    setDetalleProducto({
      unidadMedida: "",
      cantidad: "",
      cantidadCaja: "",
      imagen: null,
    });
  };

  // Eliminar producto de la lista
  const eliminarProducto = (id) => {
    setListaProductos(listaProductos.filter(p => p.id !== id));
  };

  // Registrar importación unificada
  const registrarImportacion = async () => {
    // 1. Validaciones previas
    if (
      !formData.numeroDespacho ||
      !formData.responsable ||
      !formData.fechaLlegada ||
      !formData.tipoCarga ||
      !formData.estado ||
      !formData.descripcionGeneral
    ) {
      alert("Por favor, complete todos los campos requeridos");
      return;
    }

    if (listaProductos.length === 0) {
      alert("Por favor, agregue al menos un producto en el detalle");
      return;
    }

    const token = getAuthToken();
    if (!token) {
      alert("Sesión expirada. Por favor, inicie sesión nuevamente.");
      return;
    }

    // 2. Mapeo de datos al formato del Backend
    const payload = {
      numero_despacho: formData.numeroDespacho,
      tipo_carga: formData.tipoCarga,
      responsable: formData.responsable,
      fecha_registro: formData.fechaRegistro + " 10:30:00", // Agregamos hora si el backend lo requiere como DATETIME
      fecha_llegada_productos: formData.fechaLlegada,
      estado_importacion: formData.estado,
      productos: formData.descripcionGeneral, // Equivale a descripción general
      archivo_pdf: "https://storage.googleapis.com/bucket/default.pdf", // Valor por defecto o dinámico
      detalles: listaProductos.map((prod, index) => ({
        item: index + 1,
        producto: prod.producto,
        codigo: prod.codigo,
        unidad_medida: prod.unidadMedida,
        cantidad: parseInt(prod.cantidad)
      }))
    };

    try {
      // 3. Petición a la API
      const url = `https://importaciones2026-2946605267.us-central1.run.app?param_post=registro_completo_importacion`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.status === "success") {
        alert("✅ Registro exitoso: Ficha e Importación guardadas correctamente.");
        router.push("/importacion");
      } else {
        throw new Error(result.error || "Error desconocido en el servidor");
      }
    } catch (error) {
      console.error("Error al registrar:", error);
      alert("❌ Error al registrar importación: " + error.message);
    }
  };

  // Cerrar sugerencias al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sugerenciasRef.current && !sugerenciasRef.current.contains(event.target) &&
        productoInputRef.current && !productoInputRef.current.contains(event.target)) {
        setMostrarSugerencias(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">REGISTRO DE IMPORTACIONES</h1>
                  </div>
                </div>
                <button className="flex items-center space-x-1.5 px-3 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Procedimiento</span>
                </button>
              </div>

              <div className="space-y-6">
                {/* Información General */}
                <div className="bg-white rounded-xl border-2 border-gray-200 p-4 shadow-sm">
                  <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">i</span>
                    </div>
                    Información General
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Fecha de Registro <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          value={formData.fechaRegistro}
                          onChange={(e) => setFormData({ ...formData, fechaRegistro: e.target.value })}
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                          required
                        />
                        <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        N° de Despacho <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.numeroDespacho}
                        onChange={(e) => setFormData({ ...formData, numeroDespacho: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                        required
                      />
                    </div>
                    <CustomCombobox
                      label="Responsable:"
                      value={formData.responsable}
                      onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                      placeholder="Seleccione un responsable"
                      options={[
                        { value: "", label: "Seleccione un responsable" },
                        { value: "HERVIN", label: "HERVIN" },
                        { value: "KIMBERLY", label: "KIMBERLY" },
                        { value: "YEIMI", label: "YEIMI" },
                      ]}
                    />
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Fecha de Llegada <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          value={formData.fechaLlegada}
                          onChange={(e) => setFormData({ ...formData, fechaLlegada: e.target.value })}
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                          required
                        />
                        <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                    <CustomCombobox
                      label="Tipo de carga:"
                      value={formData.tipoCarga}
                      onChange={(e) => setFormData({ ...formData, tipoCarga: e.target.value })}
                      placeholder="Seleccione el Tipo de Carga"
                      options={[
                        { value: "", label: "Seleccione el Tipo de Carga" },
                        { value: "1 CONTENEDOR 40 HQ", label: "1 CONTENEDOR 40 HQ" },
                        { value: "1 CONTENEDOR 40 NOR", label: "1 CONTENEDOR 40 NOR" },
                        { value: "1 CONTENEDOR 20 ST", label: "1 CONTENEDOR 20 ST" },
                        { value: "CONSOLIDADO", label: "CONSOLIDADO" },
                      ]}
                    />
                    <CustomCombobox
                      label="Estado:"
                      value={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                      placeholder="Seleccione un estado"
                      options={[
                        { value: "", label: "Seleccione un estado" },
                        { value: "PENDIENTE", label: "PENDIENTE" },
                        { value: "PRODUCCIÓN", label: "PRODUCCIÓN" },
                        { value: "TRÁNSITO", label: "TRÁNSITO" },
                        { value: "ETA", label: "ETA" },
                      ]}
                    />
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Descripción General de Productos <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.descripcionGeneral}
                      onChange={(e) => setFormData({ ...formData, descripcionGeneral: e.target.value })}
                      placeholder="Describa brevemente los productos que contiene esta importación..."
                      rows={3}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white resize-y"
                      required
                    />
                  </div>
                </div>

                {/* Detalle de Productos */}
                <div className="bg-white rounded-xl border-2 border-gray-200 p-4 shadow-sm">
                  <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    Detalle de Productos
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="relative">
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Producto:</label>
                      <input
                        ref={productoInputRef}
                        type="text"
                        value={productoBusqueda}
                        onChange={handleProductoBusquedaChange}
                        onFocus={handleProductoFocus}
                        placeholder="Buscar producto..."
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                      />
                      {buscandoProductos && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>
                        </div>
                      )}
                      {mostrarSugerencias && sugerenciasProductos.length > 0 && (
                        <div
                          ref={sugerenciasRef}
                          className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                        >
                          {sugerenciasProductos.map((prod, index) => (
                            <button
                              key={prod.ID || prod.id || index}
                              type="button"
                              onClick={() => seleccionarProducto(prod)}
                              className="w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                            >
                              <div className="text-sm font-medium text-gray-900">
                                {prod.NOMBRE || prod.nombre}
                              </div>
                              <div className="text-xs text-gray-500">
                                Código: {prod.CODIGO || prod.codigo}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Código:</label>
                      <input
                        type="text"
                        value={codigoProducto}
                        readOnly
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-gray-100 text-sm text-gray-900 cursor-not-allowed"
                      />
                    </div>
                    <CustomCombobox
                      label="Unidad de Medida:"
                      value={detalleProducto.unidadMedida}
                      onChange={(e) => setDetalleProducto({ ...detalleProducto, unidadMedida: e.target.value })}
                      placeholder="Seleccione..."
                      options={[
                        { value: "", label: "Seleccione..." },
                        { value: "UNIDAD", label: "UNIDAD" },
                        { value: "CAJA", label: "CAJA" },
                        { value: "DOCENA", label: "DOCENA" },
                        { value: "PAR", label: "PAR" },
                      ]}
                    />
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Cantidad:</label>
                      <input
                        type="number"
                        value={detalleProducto.cantidad}
                        onChange={(e) => setDetalleProducto({ ...detalleProducto, cantidad: e.target.value })}
                        min="1"
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Cantidad en Caja:</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={detalleProducto.cantidadCaja}
                          onChange={(e) => setDetalleProducto({ ...detalleProducto, cantidadCaja: e.target.value })}
                          min="0"
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ color: 'transparent' }}>.</label>
                      <button
                        onClick={agregarProductoALista}
                        className="flex items-center space-x-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>Agregar a la Lista</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tabla de Productos */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-blue-700 border-b-2 border-blue-800">
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">N°</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">PRODUCTO</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">CÓDIGO</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">UNIDAD DE MEDIDA</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">CANTIDAD</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">CANTIDAD EN CAJA</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ACCIONES</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {listaProductos.length === 0 ? (
                          <>

                          </>
                        ) : (
                          listaProductos.map((producto, index) => (
                            <tr key={producto.id} className="hover:bg-slate-200 transition-colors">
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{index + 1}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{producto.producto}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{producto.codigo}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{producto.unidadMedida}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{producto.cantidad}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{producto.cantidadCaja || "-"}</td>
                              <td className="px-3 py-2 whitespace-nowrap">
                                <button
                                  onClick={() => eliminarProducto(producto.id)}
                                  className="flex items-center space-x-1 px-2.5 py-1 bg-red-600 border-2 border-red-700 hover:bg-red-700 hover:border-red-800 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  <span>Eliminar</span>
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Botón Registrar */}
                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button
                    onClick={registrarImportacion}
                    className="flex items-center space-x-1.5 px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md text-sm"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Registrar Importación</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

