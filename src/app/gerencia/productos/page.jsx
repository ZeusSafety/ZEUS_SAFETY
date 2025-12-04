"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/context/AuthContext";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";
import Modal from "../../../components/ui/Modal";

export default function ProductosPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 20;
  const [isVerModalOpen, setIsVerModalOpen] = useState(false);
  const [isEditarModalOpen, setIsEditarModalOpen] = useState(false);
  const [isDesactivarModalOpen, setIsDesactivarModalOpen] = useState(false);
  const [isActivarModalOpen, setIsActivarModalOpen] = useState(false);
  const [isAgregarModalOpen, setIsAgregarModalOpen] = useState(false);
  const [isGestionarPDFModalOpen, setIsGestionarPDFModalOpen] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [productos, setProductos] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState(null);
  const [editForm, setEditForm] = useState({
    codigo: "",
    nombre: "",
    categoria: "",
    tipoProducto: "",
    colorTipo: "",
    tamano: "",
    paresPorCaja: "",
  });
  const [newProductForm, setNewProductForm] = useState({
    codigo: "",
    nombre: "",
    categoria: "",
    tipoProducto: "",
    colorTipo: "",
    tamano: "",
    paresPorCaja: "",
    precio: "",
    stock: "",
    fichaTecnica: "",
  });

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

  // Función para obtener productos de la API
  const fetchProductos = useCallback(async () => {
    try {
      setLoadingData(true);
      setError(null);
      
      // Verificar que estamos en el cliente
      if (typeof window === "undefined") {
        throw new Error("Este código debe ejecutarse en el cliente");
      }
      
      // Obtener el token del localStorage (opcional, puede que la API no lo requiera)
      const token = localStorage.getItem("token");
      
      console.log("Fetching productos...");
      
      // Usar el endpoint proxy de Next.js para evitar problemas de CORS
      const apiUrl = "/api/productos";
      
      // Preparar headers - incluir Authorization solo si hay token
      const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
      };
      
      if (token && token.trim() !== "") {
        headers["Authorization"] = `Bearer ${token}`;
        console.log("Using token:", token.substring(0, 20) + "...");
      } else {
        console.log("No token found, making request without authentication");
      }
      
      console.log("API URL (proxy):", apiUrl);
      
      let response;
      try {
        response = await fetch(apiUrl, {
          method: "GET",
          headers: headers,
        });
      } catch (fetchError) {
        console.error("Error en fetch:", fetchError);
        console.error("Error details:", {
          name: fetchError.name,
          message: fetchError.message,
          stack: fetchError.stack
        });
        // Si es un error de CORS o red
        if (fetchError.message.includes('fetch') || fetchError.message.includes('Failed to fetch') || fetchError.name === 'TypeError' || fetchError.name === 'NetworkError') {
          throw new Error("Error de conexión. No se pudo conectar con la API. Verifica que la API esté disponible o que no haya problemas de CORS.");
        }
        throw fetchError;
      }
      
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        // Si el token está caducado (401), redirigir al login
        if (response.status === 401 || response.status === 403) {
          if (token) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            router.push("/login");
            return;
          }
        }
        
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText || "No se pudieron obtener los datos"}`);
      }
      
      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const textData = await response.text();
        try {
          data = JSON.parse(textData);
        } catch (parseError) {
          throw new Error("La respuesta no es un JSON válido");
        }
      }
      
      console.log("Datos recibidos de la API:", data);
      
      // La API puede devolver un array o un objeto con una propiedad que contiene el array
      let productosArray = [];
      if (Array.isArray(data)) {
        productosArray = data;
      } else if (data.data && Array.isArray(data.data)) {
        productosArray = data.data;
      } else if (data.productos && Array.isArray(data.productos)) {
        productosArray = data.productos;
      } else if (data.results && Array.isArray(data.results)) {
        productosArray = data.results;
      } else {
        // Si no es un array, intentar usar el objeto directamente
        productosArray = [data];
      }
      
      // Mapear los datos de la API al formato esperado
      const productosMapeados = productosArray.map((item) => ({
        id: item.id || item.ID || item.id_producto || item.idProducto || 0,
        codigo: item.codigo || item.CODIGO || item.código || item.code || "",
        nombre: item.nombre || item.NOMBRE || item.name || "",
        categoria: item.categoria || item.CATEGORIA || item.categoría || item.category || "",
        tipoProducto: item.tipoProducto || item.tipo_producto || item.TIPO_PRODUCTO || item.tipo || item.productType || "",
        colorTipo: item.colorTipo || item.color_tipo || item.COLOR_TIPO || item.color || item.colorType || "",
        tamano: item.tamano || item.tamaño || item.TAMAÑO || item.size || item.tamano || "",
        paresPorCaja: item.paresPorCaja || item.pares_por_caja || item.PARES_POR_CAJA || item.pairsPerBox || item.paresPorCaja || 0,
        fichaTecnica: item.fichaTecnica || item.ficha_tecnica || item.FICHA_TECNICA || item.FICHA_TECNICA_ENLACE || item.ficha || item.technicalSheet || item.pdf || item.fichaTecnicaEnlace || null,
        precio: item.precio || item.PRECIO || item.price || 0,
        stock: item.stock || item.STOCK || item.inventory || 0,
        activo: item.activo !== undefined ? item.activo : (item.ACTIVO !== undefined ? item.ACTIVO : (item.active !== undefined ? item.active : true)),
      }));
      
      console.log("Productos mapeados:", productosMapeados);
      setProductos(productosMapeados);
    } catch (err) {
      console.error("Error al obtener productos:", err);
      console.error("Error completo:", {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
      
      // Mensajes de error más específicos
      let errorMessage = "Error al cargar los productos";
      if (err.message.includes("Failed to fetch") || err.message.includes("fetch")) {
        errorMessage = "Error de conexión. No se pudo conectar con la API. Verifica tu conexión a internet o que la API esté disponible.";
      } else if (err.message.includes("CORS")) {
        errorMessage = "Error de CORS. La API no permite solicitudes desde este origen.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoadingData(false);
    }
  }, [router]);

  // Cargar productos cuando el componente se monte
  useEffect(() => {
    if (user && !loading) {
      fetchProductos();
    }
  }, [user, loading, fetchProductos]);

  // Función para agregar un nuevo producto
  const agregarProducto = useCallback(async (productoData) => {
    try {
      setLoadingData(true);
      setError(null);
      
      const token = localStorage.getItem("token");
      
      const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
      };
      
      if (token && token.trim() !== "") {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      // Mapear los datos del formulario al formato de la API
      // La API requiere todos estos campos según el error
      const apiData = {
        codigo: productoData.codigo || "",
        nombre: productoData.nombre || "",
        categoria: productoData.categoria || "",
        tipo_producto: productoData.tipoProducto || "",
        color_tipo: productoData.colorTipo || "",
        tamaño: productoData.tamano || "",
        pares_por_caja: productoData.paresPorCaja ? parseInt(productoData.paresPorCaja) : 0,
        precio: productoData.precio ? parseFloat(productoData.precio) : 0,
        stock: productoData.stock ? parseInt(productoData.stock) : 0,
        ficha_tecnica: productoData.fichaTecnica || "",
      };
      
      console.log("=== AGREGANDO PRODUCTO ===");
      console.log("Datos del formulario:", productoData);
      console.log("Datos mapeados para API:", apiData);
      
      const response = await fetch("/api/productos", {
        method: "POST",
        headers: headers,
        body: JSON.stringify(apiData),
      });
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          const errorText = await response.text();
          errorData = { error: errorText || `Error ${response.status} al agregar producto` };
        }
        
        console.error("=== ERROR AL AGREGAR PRODUCTO ===");
        console.error("Status:", response.status);
        console.error("Error data:", errorData);
        console.error("================================");
        
        throw new Error(errorData.error || errorData.details || `Error ${response.status} al agregar producto`);
      }
      
      const data = await response.json();
      console.log("Producto agregado exitosamente:", data);
      
      // Recargar la lista de productos
      await fetchProductos();
      
      return { success: true, data };
    } catch (err) {
      console.error("Error al agregar producto:", err);
      throw err;
    } finally {
      setLoadingData(false);
    }
  }, [fetchProductos]);

  // Función para desactivar un producto
  const desactivarProducto = useCallback(async (productoId) => {
    try {
      setLoadingData(true);
      setError(null);
      
      const token = localStorage.getItem("token");
      
      const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
      };
      
      if (token && token.trim() !== "") {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      // Buscar el producto actual para mantener sus datos
      const productoActual = productos.find(p => p.id === productoId);
      
      if (!productoActual) {
        throw new Error("No se encontró el producto a desactivar");
      }
      
      // Mapear los datos del producto al formato de la API, marcando como inactivo
      const apiData = {
        id: productoId,
        codigo: productoActual.codigo || "",
        nombre: productoActual.nombre || "",
        categoria: productoActual.categoria || "",
        tipo_producto: productoActual.tipoProducto || "",
        color_tipo: productoActual.colorTipo || "",
        tamaño: productoActual.tamano || "",
        pares_por_caja: productoActual.paresPorCaja || 0,
        precio: productoActual.precio || 0,
        stock: productoActual.stock || 0,
        ficha_tecnica: productoActual.fichaTecnica || "",
        activo: false, // Marcar como inactivo
      };
      
      console.log("Desactivando producto:", apiData);
      
      const response = await fetch("/api/productos", {
        method: "PUT",
        headers: headers,
        body: JSON.stringify(apiData),
      });
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          const errorText = await response.text();
          errorData = { error: errorText || `Error ${response.status} al desactivar producto` };
        }
        
        console.error("Error al desactivar producto:", errorData);
        throw new Error(errorData.error || errorData.details || `Error ${response.status} al desactivar producto`);
      }
      
      const data = await response.json();
      console.log("Producto desactivado exitosamente:", data);
      
      // Recargar la lista de productos
      await fetchProductos();
      
      return { success: true, data };
    } catch (err) {
      console.error("Error al desactivar producto:", err);
      throw err;
    } finally {
      setLoadingData(false);
    }
  }, [productos, fetchProductos]);

  // Función para actualizar un producto existente
  const actualizarProducto = useCallback(async (productoId, productoData) => {
    try {
      setLoadingData(true);
      setError(null);
      
      const token = localStorage.getItem("token");
      
      const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
      };
      
      if (token && token.trim() !== "") {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      // Mapear los datos del formulario al formato de la API
      const apiData = {
        ID: productoId,
        CODIGO: productoData.codigo,
        NOMBRE: productoData.nombre,
        CATEGORIA: productoData.categoria,
        TIPO_PRODUCTO: productoData.tipoProducto || null,
        COLOR_TIPO: productoData.colorTipo || null,
        TAMAÑO: productoData.tamano || null,
        PARES_POR_CAJA: productoData.paresPorCaja ? parseInt(productoData.paresPorCaja) : null,
      };
      
      console.log("Actualizando producto:", apiData);
      
      const response = await fetch("/api/productos", {
        method: "PUT",
        headers: headers,
        body: JSON.stringify(apiData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status} al actualizar producto`);
      }
      
      const data = await response.json();
      console.log("Producto actualizado exitosamente:", data);
      
      // Recargar la lista de productos
      await fetchProductos();
      
      return { success: true, data };
    } catch (err) {
      console.error("Error al actualizar producto:", err);
      throw err;
    } finally {
      setLoadingData(false);
    }
  }, [fetchProductos]);

  // Filtrar productos por búsqueda
  const filteredProductos = productos.filter(p => 
    (p.codigo && p.codigo.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.nombre && p.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.categoria && p.categoria.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.tipoProducto && p.tipoProducto.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.colorTipo && p.colorTipo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const activos = filteredProductos.filter(p => p.activo !== false);

  const totalPages = Math.ceil(activos.length / itemsPerPage);

  const paginatedActivos = activos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${
          sidebarOpen ? "lg:ml-60 ml-0" : "ml-0"
        }`}
      >
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto custom-scrollbar" style={{ background: '#F7FAFF' }}>
          <div className="max-w-[95%] mx-auto px-4 py-4">
            {/* Botón Volver */}
            <button
              onClick={() => router.push("/gerencia")}
              className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] text-white rounded-lg font-semibold hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm ripple-effect relative overflow-hidden text-sm group"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver a Gerencia</span>
            </button>

            {/* Sección: Listado de Productos */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6 mb-6">
              <div>
                {/* Header de Sección */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] rounded-xl flex items-center justify-center text-white shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Listado de Productos</h2>
                      <p className="text-sm text-gray-600 mt-1">Gestiona los productos activos del sistema</p>
                    </div>
                  </div>
                  <div className={`flex items-center space-x-2 rounded-lg px-3 py-1.5 ${
                    loadingData 
                      ? 'bg-yellow-50 border border-yellow-200' 
                      : error 
                        ? 'bg-red-50 border border-red-200' 
                        : 'bg-green-50 border border-green-200'
                  }`}>
                    {loadingData ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                        <span className="text-sm font-semibold text-yellow-700">Cargando...</span>
                      </>
                    ) : error ? (
                      <>
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-semibold text-red-700">Error de conexión</span>
                      </>
                    ) : (
                      <>
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-semibold text-green-700">API Conectada</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Barra de búsqueda y botón agregar */}
                <div className="mb-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                  {/* Buscador */}
                  <div className="flex-1 w-full sm:max-w-md">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Buscar productos por código, nombre, categoría..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                      <svg
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Botón Agregar */}
                  <button
                    onClick={() => {
                      setNewProductForm({
                        codigo: "",
                        nombre: "",
                        categoria: "",
                        tipoProducto: "",
                        colorTipo: "",
                        tamano: "",
                        paresPorCaja: "",
                        precio: "",
                        stock: "",
                        fichaTecnica: "",
                      });
                      setIsAgregarModalOpen(true);
                    }}
                    className="flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] text-white rounded-lg font-semibold hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm active:scale-[0.98] text-sm whitespace-nowrap"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Agregar Producto</span>
                  </button>
                </div>

                {/* Mensaje de error */}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Loading state */}
                {loadingData && (
                  <div className="mb-4 flex items-center justify-center p-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-sm text-gray-600">Cargando productos...</span>
                  </div>
                )}

                {/* Tabla */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-blue-700 border-b-2 border-blue-800">
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ID</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">CÓDIGO</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">NOMBRE</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">CATEGORÍA</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">TIPO DE PRODUCTO</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">COLOR/TIPO</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">TAMAÑO</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">PARES POR CAJA</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">FICHA TÉCNICA</th>
                          <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ACCIONES</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {!loadingData && paginatedActivos.length === 0 ? (
                          <tr>
                            <td colSpan="10" className="px-3 py-8 text-center text-sm text-gray-500">
                              No hay productos activos disponibles
                            </td>
                          </tr>
                        ) : (
                          paginatedActivos.map((producto) => (
                          <tr key={producto.id} className="hover:bg-slate-200 transition-colors">
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{producto.id}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{producto.codigo}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{producto.nombre}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{producto.categoria}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{producto.tipoProducto || "-"}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{producto.colorTipo || "-"}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{producto.tamano || "-"}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{producto.paresPorCaja || "-"}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                                {producto.fichaTecnica ? (
                                  <div className="flex items-center justify-center">
                                    <button
                                      onClick={() => window.open(producto.fichaTecnica, '_blank')}
                                      className="flex items-center space-x-1.5 text-blue-700 hover:text-blue-800 rounded-lg transition-all duration-200 active:scale-[0.98]"
                                      title="Ver ficha técnica en PDF"
                                    >
                                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M6 2C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V7.41421C19 7.149 18.8946 6.89464 18.7071 6.70711L13.2929 1.29289C13.1054 1.10536 12.851 1 12.5858 1H6Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
                                        <path d="M13 1V6H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        <text x="12" y="15" fontSize="6" fill="currentColor" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="0.3">PDF</text>
                                      </svg>
                                      <span className="font-semibold text-[10px]">Ver Ficha</span>
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center">
                                    <span className="text-gray-400 text-[10px]">-</span>
                                  </div>
                                )}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center space-x-2">
                                  <button
                                    onClick={() => {
                                      setSelectedProducto(producto);
                                      setEditForm({
                                        codigo: producto.codigo || "",
                                        nombre: producto.nombre || "",
                                        categoria: producto.categoria || "",
                                        tipoProducto: producto.tipoProducto || "",
                                        colorTipo: producto.colorTipo || "",
                                        tamano: producto.tamano || "",
                                        paresPorCaja: producto.paresPorCaja || "",
                                      });
                                      setIsEditarModalOpen(true);
                                    }}
                                  className="flex items-center space-x-1 px-2.5 py-1 bg-blue-600 border-2 border-blue-700 hover:bg-blue-700 hover:border-blue-800 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  <span>Editar</span>
                                </button>
                                {producto.fichaTecnica && (
                                  <button
                                      onClick={() => {
                                        setSelectedProducto(producto);
                                        setSelectedFile(null);
                                        setIsGestionarPDFModalOpen(true);
                                      }}
                                    className="inline-flex items-center space-x-1 px-2.5 py-1 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                                      title="Gestionar PDF del producto"
                                  >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ pointerEvents: 'none' }}>
                                      <path d="M6 2C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V7.41421C19 7.149 18.8946 6.89464 18.7071 6.70711L13.2929 1.29289C13.1054 1.10536 12.851 1 12.5858 1H6Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
                                      <path d="M13 1V6H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                      <text x="12" y="15" fontSize="6" fill="currentColor" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="0.3">PDF</text>
                                    </svg>
                                    <span style={{ pointerEvents: 'none' }}>PDF</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setSelectedProducto(producto);
                                    setIsDesactivarModalOpen(true);
                                  }}
                                  className="flex items-center space-x-1 px-2.5 py-1 bg-red-600 border-2 border-red-700 hover:bg-red-700 hover:border-red-800 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  <span>Eliminar</span>
                                </button>
                              </div>
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
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      &lt;
                    </button>
                    <span className="text-[10px] text-gray-700 font-medium">
                      Página {currentPage} de {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
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
          </div>
        </main>
      </div>

      {/* Modal Ver Producto */}
      <Modal
        isOpen={isVerModalOpen}
        onClose={() => {
          setIsVerModalOpen(false);
          setSelectedProducto(null);
        }}
        title={`Detalles del Producto - ${selectedProducto?.codigo || ""}`}
        size="md"
      >
        {selectedProducto && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Código</label>
                <p className="text-sm text-gray-900">{selectedProducto.codigo}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre</label>
                <p className="text-sm text-gray-900">{selectedProducto.nombre}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Categoría</label>
                <p className="text-sm text-gray-900">{selectedProducto.categoria}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Precio</label>
                <p className="text-sm text-gray-900">${selectedProducto.precio.toFixed(2)}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Stock</label>
                <p className="text-sm text-gray-900">{selectedProducto.stock}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Estado</label>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border-2 ${
                  selectedProducto.activo ? "bg-green-600 border-green-700 text-white" : "bg-red-600 border-red-700 text-white"
                }`}>
                  {selectedProducto.activo ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-end pt-4 border-t border-gray-200">
              <button
                onClick={() => setIsVerModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] hover:shadow-md hover:scale-105 rounded-lg transition-all duration-200 shadow-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Editar Producto */}
      <Modal
        isOpen={isEditarModalOpen}
        onClose={() => {
          setIsEditarModalOpen(false);
          setSelectedProducto(null);
        }}
        title={`Editar Producto - ${selectedProducto?.codigo || ""}`}
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Columna Izquierda */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Código <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.codigo}
                  onChange={(e) => setEditForm({ ...editForm, codigo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Categoría <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.categoria}
                  onChange={(e) => setEditForm({ ...editForm, categoria: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Color/Tipo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.colorTipo}
                  onChange={(e) => setEditForm({ ...editForm, colorTipo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Pares por Caja <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={editForm.paresPorCaja}
                  onChange={(e) => setEditForm({ ...editForm, paresPorCaja: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
                />
              </div>
            </div>

            {/* Columna Derecha */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.nombre}
                  onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Tipo de Producto <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.tipoProducto}
                  onChange={(e) => setEditForm({ ...editForm, tipoProducto: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Tamaño
                </label>
                <input
                  type="text"
                  value={editForm.tamano}
                  onChange={(e) => setEditForm({ ...editForm, tamano: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setIsEditarModalOpen(false);
                setSelectedProducto(null);
              }}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={async () => {
                try {
                  if (!selectedProducto || !selectedProducto.id) {
                    alert("Error: No se pudo identificar el producto a editar");
                    return;
                  }
                  
                  // Validar campos requeridos
                  if (!editForm.codigo || !editForm.nombre || !editForm.categoria) {
                    alert("Por favor, complete todos los campos requeridos");
                    return;
                  }
                  
                  await actualizarProducto(selectedProducto.id, editForm);
                  alert("Producto actualizado exitosamente");
                  setIsEditarModalOpen(false);
                  setSelectedProducto(null);
                } catch (err) {
                  alert(`Error al actualizar producto: ${err.message}`);
                }
              }}
              disabled={loadingData}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] hover:shadow-md hover:scale-105 rounded-lg transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              <span>{loadingData ? "Guardando..." : "Guardar Cambios"}</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Desactivar Producto */}
      <Modal
        isOpen={isDesactivarModalOpen}
        onClose={() => {
          setIsDesactivarModalOpen(false);
          setSelectedProducto(null);
        }}
        title="Confirmar Desactivación"
        size="sm"
      >
        {selectedProducto && (
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              ¿Está seguro de que desea desactivar el producto <strong>{selectedProducto.nombre}</strong> (Código: {selectedProducto.codigo})?
            </p>
            <p className="text-xs text-orange-600">El producto quedará inactivo y no estará disponible para ventas.</p>
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setIsDesactivarModalOpen(false);
                  setSelectedProducto(null);
                }}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  try {
                    if (!selectedProducto || !selectedProducto.id) {
                      alert("Error: No se pudo identificar el producto a desactivar");
                      return;
                    }
                    
                    await desactivarProducto(selectedProducto.id);
                    alert("Producto desactivado exitosamente");
                    setIsDesactivarModalOpen(false);
                    setSelectedProducto(null);
                  } catch (err) {
                    alert(`Error al desactivar producto: ${err.message}`);
                  }
                }}
                disabled={loadingData}
                className="px-4 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingData ? "Desactivando..." : "Desactivar"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Activar Producto */}
      <Modal
        isOpen={isActivarModalOpen}
        onClose={() => {
          setIsActivarModalOpen(false);
          setSelectedProducto(null);
        }}
        title="Confirmar Activación"
        size="sm"
      >
        {selectedProducto && (
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              ¿Está seguro de que desea activar el producto <strong>{selectedProducto.nombre}</strong> (Código: {selectedProducto.codigo})?
            </p>
            <p className="text-xs text-green-600">El producto quedará activo y disponible para ventas.</p>
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setIsActivarModalOpen(false);
                  setSelectedProducto(null);
                }}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  console.log("Activar producto:", selectedProducto.id);
                  alert("Funcionalidad de activación pendiente de implementar");
                  setIsActivarModalOpen(false);
                  setSelectedProducto(null);
                }}
                className="px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                Activar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Agregar Producto */}
      <Modal
        isOpen={isAgregarModalOpen}
        onClose={() => {
          setIsAgregarModalOpen(false);
          setNewProductForm({
            codigo: "",
            nombre: "",
            categoria: "",
            tipoProducto: "",
            colorTipo: "",
            tamano: "",
            paresPorCaja: "",
            precio: "",
            stock: "",
            fichaTecnica: "",
          });
        }}
        title="Agregar Nuevo Producto"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Código <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newProductForm.codigo}
              onChange={(e) => setNewProductForm({ ...newProductForm, codigo: e.target.value })}
              placeholder="Ej: PROD001"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newProductForm.nombre}
              onChange={(e) => setNewProductForm({ ...newProductForm, nombre: e.target.value })}
              placeholder="Nombre del producto"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Categoría <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newProductForm.categoria}
              onChange={(e) => setNewProductForm({ ...newProductForm, categoria: e.target.value })}
              placeholder="Categoría del producto"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Tipo de Producto <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newProductForm.tipoProducto}
              onChange={(e) => setNewProductForm({ ...newProductForm, tipoProducto: e.target.value })}
              placeholder="Tipo de producto"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Color/Tipo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newProductForm.colorTipo}
              onChange={(e) => setNewProductForm({ ...newProductForm, colorTipo: e.target.value })}
              placeholder="Color o tipo"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Tamaño <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newProductForm.tamano}
                onChange={(e) => setNewProductForm({ ...newProductForm, tamano: e.target.value })}
                placeholder="Tamaño"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Pares por Caja <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={newProductForm.paresPorCaja}
                onChange={(e) => setNewProductForm({ ...newProductForm, paresPorCaja: e.target.value })}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Ficha Técnica (URL) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newProductForm.fichaTecnica}
              onChange={(e) => setNewProductForm({ ...newProductForm, fichaTecnica: e.target.value })}
              placeholder="URL de la ficha técnica (puede estar vacío)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Precio <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newProductForm.precio}
                onChange={(e) => setNewProductForm({ ...newProductForm, precio: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Stock <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={newProductForm.stock}
                onChange={(e) => setNewProductForm({ ...newProductForm, stock: e.target.value })}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
              />
            </div>
          </div>
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setIsAgregarModalOpen(false);
                setNewProductForm({
                  codigo: "",
                  nombre: "",
                  categoria: "",
                  tipoProducto: "",
                  colorTipo: "",
                  tamano: "",
                  paresPorCaja: "",
                  precio: "",
                  stock: "",
                  fichaTecnica: "",
                });
              }}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={async () => {
                try {
                  // Validar campos requeridos según la API
                  if (!newProductForm.codigo || !newProductForm.nombre || !newProductForm.categoria || 
                      !newProductForm.tipoProducto || !newProductForm.colorTipo || !newProductForm.tamano || 
                      !newProductForm.paresPorCaja || !newProductForm.fichaTecnica) {
                    alert("Por favor, complete todos los campos requeridos");
                    return;
                  }
                  
                  await agregarProducto(newProductForm);
                  alert("Producto agregado exitosamente");
                  setIsAgregarModalOpen(false);
                  setNewProductForm({
                    codigo: "",
                    nombre: "",
                    categoria: "",
                    tipoProducto: "",
                    colorTipo: "",
                    tamano: "",
                    paresPorCaja: "",
                    precio: "",
                    stock: "",
                    fichaTecnica: "",
                  });
                } catch (err) {
                  alert(`Error al agregar producto: ${err.message}`);
                }
              }}
              disabled={loadingData}
              className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] hover:shadow-md hover:scale-105 rounded-lg transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingData ? "Agregando..." : "Agregar Producto"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Gestionar PDF */}
      <Modal
        isOpen={isGestionarPDFModalOpen}
        onClose={() => {
          setIsGestionarPDFModalOpen(false);
          setSelectedProducto(null);
          setSelectedFile(null);
        }}
        title={`Gestionar PDF del Producto - ${selectedProducto?.codigo || ""}`}
        size="md"
      >
        {selectedProducto && (
          <div className="space-y-6">
            {/* PDF Actual */}
            {selectedProducto.fichaTecnica && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <h3 className="text-sm font-bold text-gray-900 mb-3">PDF Actual:</h3>
                <a
                  href={selectedProducto.fichaTecnica}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 hover:underline font-semibold"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>Ver PDF Actual</span>
                </a>
              </div>
            )}

            {/* Subir Nuevo PDF */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-3">Subir Nuevo PDF:</h3>
              <label
                htmlFor="pdf-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-blue-400 transition-all duration-200"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Hacer clic para seleccionar archivo PDF</span>
                  </p>
                  <p className="text-xs text-gray-500">PDF (MAX. 10MB)</p>
                </div>
                <input
                  id="pdf-upload"
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 10 * 1024 * 1024) {
                        alert("El archivo es demasiado grande. El tamaño máximo es 10MB.");
                        e.target.value = "";
                        return;
                      }
                      if (file.type !== "application/pdf") {
                        alert("Por favor, selecciona un archivo PDF.");
                        e.target.value = "";
                        return;
                      }
                      setSelectedFile(file);
                    }
                  }}
                />
                {selectedFile && (
                  <div className="mt-2 text-sm text-green-600 font-semibold">
                    ✓ Archivo seleccionado: {selectedFile.name}
                  </div>
                )}
              </label>
            </div>

            {/* Botones de acción */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setIsGestionarPDFModalOpen(false);
                  setSelectedProducto(null);
                  setSelectedFile(null);
                }}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!selectedFile) {
                    alert("Por favor, selecciona un archivo PDF para subir.");
                    return;
                  }
                  console.log("Guardar PDF para producto:", selectedProducto.id, selectedFile);
                  alert("Funcionalidad de guardado de PDF pendiente de implementar");
                  setIsGestionarPDFModalOpen(false);
                  setSelectedProducto(null);
                  setSelectedFile(null);
                }}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] hover:shadow-md hover:scale-105 rounded-lg transition-all duration-200 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                <span>Guardar PDF</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

