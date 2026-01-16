"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/context/AuthContext";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";
import Modal from "../../../components/ui/Modal";

// Componente de Select personalizado
const CustomSelect = ({ name, value, onChange, options, placeholder, required, label, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const selectRef = useRef(null);
  const buttonRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value);

  const handleSelect = (optionValue) => {
    if (disabled) return;
    onChange({ target: { name, value: optionValue } });
    setIsOpen(false);
  };

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = 240;
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
        <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
          {label}
        </label>
      )}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`w-full px-4 py-2.5 border-2 rounded-lg transition-all duration-200 text-sm flex items-center justify-between ${disabled
          ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed'
          : `border-gray-200 bg-white text-gray-900 hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''
          }`
          }`}
      >
        <span className={`${value ? 'text-gray-900' : 'text-gray-500'} whitespace-nowrap overflow-hidden text-ellipsis`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`w-5 h-5 transition-transform duration-200 flex-shrink-0 ml-2 ${disabled
            ? 'text-gray-400'
            : `text-gray-400 ${isOpen ? (openUpward ? '' : 'transform rotate-180') : ''}`
            }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && !disabled && (
        <div
          className={`absolute z-50 w-full bg-white shadow-xl overflow-hidden mt-1 mb-1 ${openUpward ? 'bottom-full' : 'top-full'
            }`}
          style={{
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div className="max-h-48 overflow-y-auto custom-scrollbar p-1">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full text-left px-3 py-1.5 text-sm transition-all duration-150 rounded ${value === option.value
                  ? 'bg-blue-100 text-blue-700 font-semibold'
                  : 'text-gray-900 hover:bg-gray-50'
                  }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <input type="hidden" name={name} value={value || ''} required={required} />
    </div>
  );
};

// Componente de Acordeón para Categorías
const CategoriaAccordion = ({ value, onChange, label, required, categorias = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const accordionRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (accordionRef.current && !accordionRef.current.contains(event.target)) {
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

  const selectedCategoria = categorias.find(cat => cat.value === value);

  return (
    <div className="relative" ref={accordionRef}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-2.5 border-2 rounded-lg transition-all duration-200 text-sm flex items-center justify-between ${`border-gray-200 bg-white text-gray-900 hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''
          }`
          }`}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-500'}>
          {selectedCategoria ? selectedCategoria.label : "Seleccione una categoría"}
        </span>
        <svg
          className={`w-5 h-5 transition-transform duration-200 text-gray-400 ${isOpen ? 'transform rotate-180' : ''
            }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute z-50 w-full bg-white shadow-xl overflow-hidden mt-1 mb-1"
          style={{
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div className="max-h-48 overflow-y-auto custom-scrollbar p-1">
            {categorias.map((categoria) => (
              <button
                key={categoria.value}
                type="button"
                onClick={() => {
                  onChange({ target: { name: 'categoria', value: categoria.value } });
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-sm transition-all duration-150 rounded ${value === categoria.value
                  ? 'bg-blue-100 text-blue-700 font-semibold'
                  : 'text-gray-900 hover:bg-gray-50'
                  }`}
              >
                {categoria.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <input type="hidden" name="categoria" value={value || ''} required={required} />
    </div>
  );
};

export default function ProductosPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 10;
  const [isVerModalOpen, setIsVerModalOpen] = useState(false);
  const [isEditarModalOpen, setIsEditarModalOpen] = useState(false);
  const [isDesactivarModalOpen, setIsDesactivarModalOpen] = useState(false);
  const [isActivarModalOpen, setIsActivarModalOpen] = useState(false);
  const [isAgregarModalOpen, setIsAgregarModalOpen] = useState(false);
  const [isGestionarPDFModalOpen, setIsGestionarPDFModalOpen] = useState(false);
  const [isGestionarImagenModalOpen, setIsGestionarImagenModalOpen] = useState(false);
  const [isDescripcionModalOpen, setIsDescripcionModalOpen] = useState(false);
  const [selectedDescripcion, setSelectedDescripcion] = useState("");
  const [selectedProducto, setSelectedProducto] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [modalMensaje, setModalMensaje] = useState({ open: false, tipo: "success", mensaje: "" });
  const [productos, setProductos] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState(null);
  const [categoriasUnicas, setCategoriasUnicas] = useState([]);
  const [tiposPorCategoria, setTiposPorCategoria] = useState({});
  const [editForm, setEditForm] = useState({
    codigo: "",
    nombre: "",
    descripcion: "",
    categoria: "",
    tipoProducto: "",
    colorTipo: "",
    tamano: "",
    paresPorCaja: "",
  });

  // Función para obtener tipos de producto según categoría (desde BD)
  const getTiposProducto = (categoria) => {
    return tiposPorCategoria[categoria] || [];
  };
  const [newProductForm, setNewProductForm] = useState({
    codigo: "",
    nombre: "",
    descripcion: "",
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

  // Función helper para mapear un producto individual (disponible en todo el componente)
  const mapearProducto = (item) => {
    return {
      id: item.id || item.ID || item.id_producto || item.idProducto || null,
      codigo: item.codigo || item.CODIGO || item.código || item.code || "",
      nombre: item.nombre || item.NOMBRE || item.name || "",
      descripcion: item.descripcion || item.DESCRIPCION || item.description || null,
      categoria: item.categoria || item.CATEGORIA || item.categoría || item.category || "",
      tipoProducto: item.tipoProducto || item.tipo_producto || item.TIPO_PRODUCTO || item.tipo || item.productType || "",
      colorTipo: item.colorTipo || item.color_tipo || item.COLOR_TIPO || item.color || item.colorType || "",
      tamano: item.tamano || item.tamaño || item.TAMAÑO || item.size || item.tamano || "",
      paresPorCaja: item.paresPorCaja || item.pares_por_caja || item.PARES_POR_CAJA || item.pairsPerBox || item.paresPorCaja || 0,
      fichaTecnica: item.fichaTecnica || item.ficha_tecnica || item.FICHA_TECNICA || item.FICHA_TECNICA_ENLACE || item.ficha || item.technicalSheet || item.pdf || item.fichaTecnicaEnlace || null,
      imagen: item.imagen || item.IMAGEN || item.image || item.IMAGE || item.imagen_url || item.imagenUrl || item.IMAGEN_URL || item.IMG_URL || item.img_url || null,
      precio: item.precio || item.PRECIO || item.price || 0,
      stock: item.stock || item.STOCK || item.inventory || 0,
      activo: item.activo !== undefined ? item.activo : (item.ACTIVO !== undefined ? item.ACTIVO : (item.active !== undefined ? item.active : true)),
    };
  };

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
        descripcion: item.descripcion || item.DESCRIPCION || item.description || null,
        categoria: item.categoria || item.CATEGORIA || item.categoría || item.category || "",
        tipoProducto: item.tipoProducto || item.tipo_producto || item.TIPO_PRODUCTO || item.tipo || item.productType || "",
        colorTipo: item.colorTipo || item.color_tipo || item.COLOR_TIPO || item.color || item.colorType || "",
        tamano: item.tamano || item.tamaño || item.TAMAÑO || item.size || item.tamano || "",
        paresPorCaja: item.paresPorCaja || item.pares_por_caja || item.PARES_POR_CAJA || item.pairsPerBox || item.paresPorCaja || 0,
        fichaTecnica: item.fichaTecnica || item.ficha_tecnica || item.FICHA_TECNICA || item.FICHA_TECNICA_ENLACE || item.ficha || item.technicalSheet || item.pdf || item.fichaTecnicaEnlace || null,
        imagen: item.imagen || item.IMAGEN || item.image || item.IMAGE || item.imagen_url || item.imagenUrl || item.IMAGEN_URL || item.IMG_URL || item.img_url || null,
        precio: item.precio || item.PRECIO || item.price || 0,
        stock: item.stock || item.STOCK || item.inventory || 0,
        activo: item.activo !== undefined ? item.activo : (item.ACTIVO !== undefined ? item.ACTIVO : (item.active !== undefined ? item.active : true)),
      }));

      console.log("Productos mapeados:", productosMapeados);
      setProductos(productosMapeados);

      // Extraer categorías únicas de los productos
      const categoriasSet = new Set();
      productosMapeados.forEach(producto => {
        if (producto.categoria && producto.categoria.trim() !== "") {
          categoriasSet.add(producto.categoria);
        }
      });
      const categoriasArray = Array.from(categoriasSet).sort().map(cat => ({
        value: cat,
        label: cat
      }));
      setCategoriasUnicas(categoriasArray);
      console.log("Categorías extraídas de BD:", categoriasArray);

      // Extraer tipos de producto únicos por categoría
      const tiposPorCat = {};
      productosMapeados.forEach(producto => {
        if (producto.categoria && producto.categoria.trim() !== "" &&
          producto.tipoProducto && producto.tipoProducto.trim() !== "") {
          if (!tiposPorCat[producto.categoria]) {
            tiposPorCat[producto.categoria] = new Set();
          }
          tiposPorCat[producto.categoria].add(producto.tipoProducto);
        }
      });

      // Convertir Sets a arrays ordenados
      const tiposPorCategoriaFormateado = {};
      Object.keys(tiposPorCat).forEach(categoria => {
        tiposPorCategoriaFormateado[categoria] = Array.from(tiposPorCat[categoria])
          .sort()
          .map(tipo => ({ value: tipo, label: tipo }));
      });
      setTiposPorCategoria(tiposPorCategoriaFormateado);
      console.log("Tipos por categoría extraídos de BD:", tiposPorCategoriaFormateado);
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
        descripcion: productoData.descripcion || "",
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

      // Mapear los datos del producto al formato de la API, cambiando el estado a 0
      const apiData = {
        id: productoId,
        codigo: productoActual.codigo || "",
        nombre: productoActual.nombre || "",
        descripcion: productoActual.descripcion || "",
        categoria: productoActual.categoria || "",
        tipo_producto: productoActual.tipoProducto || "",
        color_tipo: productoActual.colorTipo || "",
        tamaño: productoActual.tamano || "",
        pares_por_caja: productoActual.paresPorCaja || 0,
        precio: productoActual.precio || 0,
        stock: productoActual.stock || 0,
        ficha_tecnica: productoActual.fichaTecnica || "",
        estado: 0, // Cambiar el estado a 0 en lugar de eliminar
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

      // Mapear los datos del formulario al formato de la API (usar el mismo formato que desactivarProducto)
      const apiData = {
        id: productoId,
        codigo: productoData.codigo || "",
        nombre: productoData.nombre || "",
        descripcion: productoData.descripcion || "",
        categoria: productoData.categoria || "",
        tipo_producto: productoData.tipoProducto || "",
        color_tipo: productoData.colorTipo || "",
        tamaño: productoData.tamano || "",
        pares_por_caja: productoData.paresPorCaja ? parseInt(productoData.paresPorCaja) : 0,
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
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${sidebarOpen ? "lg:ml-60 ml-0" : "ml-0"
          }`}
      >
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto custom-scrollbar" style={{ background: '#F7FAFF' }}>
          <div className="max-w-[95%] mx-auto px-4 py-4">
            {/* Botón Volver */}
            <button
              onClick={() => router.push("/gerencia")}
              className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-lg font-medium hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm ripple-effect relative overflow-hidden text-sm group"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
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
                    <div className="w-12 h-12 bg-gradient-to-br from-[#002D5A] to-[#002D5A] rounded-xl flex items-center justify-center text-white shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>Listado de Productos</h2>
                      <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: 'var(--font-poppins)' }}>Gestiona los productos activos del sistema</p>
                    </div>
                  </div>
                  <div className={`flex items-center space-x-2 rounded-lg px-3 py-1.5 ${loadingData
                    ? 'bg-yellow-50 border border-yellow-200'
                    : error
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-green-50 border border-green-200'
                    }`}>
                    {loadingData ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                        <span className="text-sm font-semibold text-yellow-700" style={{ fontFamily: 'var(--font-poppins)' }}>Cargando...</span>
                      </>
                    ) : error ? (
                      <>
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-semibold text-red-700" style={{ fontFamily: 'var(--font-poppins)' }}>Error de conexión</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-semibold text-green-700" style={{ fontFamily: 'var(--font-poppins)' }}>API Conectada</span>
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
                        className="w-full px-4 py-2.5 pl-11 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 placeholder:text-gray-400 bg-gradient-to-br from-gray-50 to-white hover:border-blue-300 transition-all duration-200 font-medium outline-none shadow-sm"
                        style={{ fontFamily: 'var(--font-poppins)' }}
                      />
                      <svg
                        className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
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
                    className="flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-lg font-semibold hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm active:scale-[0.98] text-xs whitespace-nowrap"
                    style={{ fontFamily: 'var(--font-poppins)' }}
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
                        <tr className="bg-gradient-to-r from-blue-700 to-blue-800 border-b-2 border-blue-900">
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>CÓDIGO</th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>NOMBRE</th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>DESCRIPCIÓN</th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>CATEGORÍA</th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>TIPO DE PRODUCTO</th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>COLOR/TIPO</th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>TAMAÑO</th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>PARES POR CAJA</th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>FICHA TÉCNICA</th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>IMAGEN</th>
                          <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>ACCIONES</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {!loadingData && paginatedActivos.length === 0 ? (
                          <tr>
                            <td colSpan="11" className="px-4 py-8 text-center text-sm text-gray-500" style={{ fontFamily: 'var(--font-poppins)' }}>
                              No hay productos activos disponibles
                            </td>
                          </tr>
                        ) : (
                          paginatedActivos.map((producto) => (
                            <tr key={producto.id} className="hover:bg-blue-50 transition-colors border-b border-gray-100">
                              <td className="px-4 py-3 whitespace-nowrap text-[10px] font-medium text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>{producto.codigo}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{producto.nombre}</td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex items-center justify-center">
                                  <button
                                    onClick={() => {
                                      setSelectedDescripcion(producto.descripcion || "Sin descripción");
                                      setIsDescripcionModalOpen(true);
                                    }}
                                    className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                                    title="Ver descripción completa"
                                    style={{ fontFamily: 'var(--font-poppins)' }}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" style={{ pointerEvents: 'none' }}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{producto.categoria}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{producto.tipoProducto || "-"}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{producto.colorTipo || "-"}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{producto.tamano || "-"}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{producto.paresPorCaja || "-"}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center">
                                  <button
                                    onClick={() => {
                                      setSelectedProducto(producto);
                                      setSelectedFile(null);
                                      setIsGestionarPDFModalOpen(true);
                                    }}
                                    className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none ${producto.fichaTecnica
                                      ? "bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                                      : "bg-gradient-to-br from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white"
                                      }`}
                                    style={{ fontFamily: 'var(--font-poppins)' }}
                                    title={producto.fichaTecnica ? "Gestionar PDF del producto (Tiene ficha técnica)" : "Agregar ficha técnica al producto"}
                                  >
                                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ pointerEvents: 'none' }}>
                                      <path d="M6 2C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V7.41421C19 7.149 18.8946 6.89464 18.7071 6.70711L13.2929 1.29289C13.1054 1.10536 12.851 1 12.5858 1H6Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
                                      <path d="M13 1V6H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                      <text x="12" y="15" fontSize="6" fill="currentColor" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="0.3">PDF</text>
                                    </svg>
                                    <span style={{ pointerEvents: 'none' }}>PDF</span>
                                  </button>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center">
                                  <button
                                    onClick={async () => {
                                      // Recargar el producto antes de abrir el modal para obtener la imagen actualizada
                                      try {
                                        const token = localStorage.getItem("token");
                                        const response = await fetch("/api/productos", {
                                          method: "GET",
                                          headers: {
                                            "Content-Type": "application/json",
                                            "Authorization": `Bearer ${token}`
                                          }
                                        });

                                        if (response.ok) {
                                          const productosActualizados = await response.json();
                                          const productoActualizado = Array.isArray(productosActualizados)
                                            ? productosActualizados.find(p => {
                                              const pId = p.id || p.ID || p.id_producto || p.idProducto;
                                              const pIdNum = typeof pId === 'string' ? parseInt(pId) : pId;
                                              const productoIdNum = typeof producto.id === 'string' ? parseInt(producto.id) : producto.id;
                                              return pIdNum === productoIdNum;
                                            })
                                            : null;

                                          if (productoActualizado) {
                                            // Usar la función de mapeo completa para obtener todos los campos correctamente
                                            const productoMapeado = mapearProducto(productoActualizado);
                                            console.log("🔍 Producto recargado desde API:", productoMapeado);
                                            console.log("🔍 Imagen encontrada:", productoMapeado.imagen);
                                            console.log("🔍 Todos los campos del producto:", Object.keys(productoMapeado));
                                            console.log("🔍 Producto original de API (sin mapear):", productoActualizado);
                                            setSelectedProducto(productoMapeado);
                                          } else {
                                            console.warn("⚠️ No se encontró el producto actualizado en la respuesta");
                                            console.warn("⚠️ Producto buscado (ID):", producto.id);
                                            console.warn("⚠️ Productos disponibles:", productosActualizados?.slice(0, 3));
                                            setSelectedProducto(producto);
                                          }
                                        } else {
                                          console.warn("⚠️ Error al recargar productos, usando datos del estado");
                                          setSelectedProducto(producto);
                                        }
                                      } catch (error) {
                                        console.warn("⚠️ No se pudo recargar el producto, usando datos del estado:", error);
                                        setSelectedProducto(producto);
                                      }
                                      setSelectedImageFile(null);
                                      setImagePreview(null);
                                      setIsGestionarImagenModalOpen(true);
                                    }}
                                    className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none ${producto.imagen
                                      ? "bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                                      : "bg-gradient-to-br from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white"
                                      }`}
                                    style={{ fontFamily: 'var(--font-poppins)' }}
                                    title={producto.imagen ? "Gestionar imagen del producto (Tiene imagen)" : "Agregar imagen al producto"}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" style={{ pointerEvents: 'none' }}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center space-x-2">
                                  <button
                                    onClick={() => {
                                      setSelectedProducto(producto);
                                      setEditForm({
                                        codigo: producto.codigo || "",
                                        nombre: producto.nombre || "",
                                        descripcion: producto.descripcion || "",
                                        categoria: producto.categoria || "",
                                        tipoProducto: producto.tipoProducto || "",
                                        colorTipo: producto.colorTipo || "",
                                        tamano: producto.tamano || "",
                                        paresPorCaja: producto.paresPorCaja || "",
                                      });
                                      setIsEditarModalOpen(true);
                                    }}
                                    className="inline-flex items-center justify-center px-3 py-1.5 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                                    title="Editar producto"
                                    style={{ fontFamily: 'var(--font-poppins)' }}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" style={{ pointerEvents: 'none' }}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedProducto(producto);
                                      setIsDesactivarModalOpen(true);
                                    }}
                                    className="inline-flex items-center justify-center px-3 py-1.5 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                                    title="Eliminar producto"
                                    style={{ fontFamily: 'var(--font-poppins)' }}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" style={{ pointerEvents: 'none' }}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
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
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 flex items-center justify-between border-t border-gray-200">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                    >
                      «
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                    >
                      &lt;
                    </button>
                    <span className="text-xs text-gray-700 font-semibold" style={{ fontFamily: 'var(--font-poppins)' }}>
                      Página {currentPage} de {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                    >
                      &gt;
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                      style={{ fontFamily: 'var(--font-poppins)' }}
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
                <label className="block text-sm font-semibold text-gray-700 mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>Código</label>
                <p className="text-sm text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>{selectedProducto.codigo}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>Nombre</label>
                <p className="text-sm text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>{selectedProducto.nombre}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>Categoría</label>
                <p className="text-sm text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>{selectedProducto.categoria}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>Precio</label>
                <p className="text-sm text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>${selectedProducto.precio ? Number(selectedProducto.precio).toFixed(2) : '0.00'}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>Stock</label>
                <p className="text-sm text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>{selectedProducto.stock}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>Estado</label>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border-2 ${selectedProducto.activo ? "bg-green-600 border-green-700 text-white" : "bg-red-600 border-red-700 text-white"
                  }`} style={{ fontFamily: 'var(--font-poppins)' }}>
                  {selectedProducto.activo ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-end pt-4 border-t border-gray-200">
              <button
                onClick={() => setIsVerModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 hover:shadow-lg hover:scale-105 rounded-lg transition-all duration-200 shadow-md active:scale-[0.98]"
                style={{ fontFamily: 'var(--font-poppins)' }}
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
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Columna Izquierda */}
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                  Código
                </label>
                <input
                  type="text"
                  value={editForm.codigo}
                  onChange={(e) => setEditForm({ ...editForm, codigo: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 transition-all duration-200 hover:border-gray-400 bg-white"
                  style={{ fontFamily: 'var(--font-poppins)' }}
                />
              </div>
              <div>
                <CategoriaAccordion
                  value={editForm.categoria}
                  onChange={(e) => {
                    setEditForm({
                      ...editForm,
                      categoria: e.target.value,
                      tipoProducto: "" // Resetear tipo de producto al cambiar categoría
                    });
                  }}
                  label="Categoría"
                  required
                  categorias={categoriasUnicas}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                  Color/Tipo
                </label>
                <input
                  type="text"
                  value={editForm.colorTipo}
                  onChange={(e) => setEditForm({ ...editForm, colorTipo: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 transition-all duration-200 hover:border-gray-400 bg-white"
                  style={{ fontFamily: 'var(--font-poppins)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                  Pares por Caja
                </label>
                <input
                  type="number"
                  min="0"
                  value={editForm.paresPorCaja}
                  onChange={(e) => setEditForm({ ...editForm, paresPorCaja: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 transition-all duration-200 hover:border-gray-400 bg-white"
                  style={{ fontFamily: 'var(--font-poppins)' }}
                />
              </div>
            </div>

            {/* Columna Derecha */}
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                  Nombre
                </label>
                <input
                  type="text"
                  value={editForm.nombre}
                  onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 transition-all duration-200 hover:border-gray-400 bg-white"
                  style={{ fontFamily: 'var(--font-poppins)' }}
                />
              </div>
              <div>
                <CustomSelect
                  name="tipoProducto"
                  value={editForm.tipoProducto}
                  onChange={(e) => setEditForm({ ...editForm, tipoProducto: e.target.value })}
                  options={getTiposProducto(editForm.categoria)}
                  placeholder={editForm.categoria ? "Seleccione un tipo de producto" : "Primero seleccione una categoría"}
                  label="Tipo de Producto"
                  required
                  disabled={!editForm.categoria}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                  Tamaño
                </label>
                <input
                  type="text"
                  value={editForm.tamano}
                  onChange={(e) => setEditForm({ ...editForm, tamano: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 transition-all duration-200 hover:border-gray-400 bg-white"
                  style={{ fontFamily: 'var(--font-poppins)' }}
                />
              </div>
            </div>
          </div>

          {/* Descripción - Última fila, ocupa todo el ancho */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
              Descripción
            </label>
            <textarea
              value={editForm.descripcion}
              onChange={(e) => setEditForm({ ...editForm, descripcion: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 transition-all duration-200 hover:border-gray-400 bg-white resize-none"
              placeholder="Descripción del producto"
              style={{ fontFamily: 'var(--font-poppins)' }}
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
            <button
              onClick={() => {
                setIsEditarModalOpen(false);
                setSelectedProducto(null);
              }}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              Cancelar
            </button>
            <button
              onClick={async () => {
                try {
                  if (!selectedProducto || !selectedProducto.id) {
                    alert("Error: No se pudo identificar el producto a editar. El ID del producto es requerido.");
                    console.error("selectedProducto:", selectedProducto);
                    return;
                  }

                  // Validar campos requeridos
                  if (!editForm.codigo || !editForm.nombre || !editForm.categoria) {
                    alert("Por favor, complete todos los campos requeridos");
                    return;
                  }

                  console.log("Actualizando producto con ID:", selectedProducto.id);
                  console.log("Datos del formulario:", editForm);

                  await actualizarProducto(selectedProducto.id, editForm);
                  alert("Producto actualizado exitosamente");
                  setIsEditarModalOpen(false);
                  setSelectedProducto(null);
                } catch (err) {
                  console.error("Error completo al actualizar:", err);
                  alert(`Error al actualizar producto: ${err.message}`);
                }
              }}
              disabled={loadingData}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 hover:shadow-lg hover:scale-105 rounded-lg transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 active:scale-[0.98]"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
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
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5" style={{ fontFamily: 'var(--font-poppins)' }}>
              Código
            </label>
            <input
              type="text"
              value={newProductForm.codigo}
              onChange={(e) => setNewProductForm({ ...newProductForm, codigo: e.target.value })}
              placeholder="Ej: PROD001"
              className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white hover:border-gray-400 transition-all duration-200"
              style={{ fontFamily: 'var(--font-poppins)' }}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5" style={{ fontFamily: 'var(--font-poppins)' }}>
              Nombre
            </label>
            <input
              type="text"
              value={newProductForm.nombre}
              onChange={(e) => setNewProductForm({ ...newProductForm, nombre: e.target.value })}
              placeholder="Nombre del producto"
              className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white hover:border-gray-400 transition-all duration-200"
              style={{ fontFamily: 'var(--font-poppins)' }}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5" style={{ fontFamily: 'var(--font-poppins)' }}>
              Descripción
            </label>
            <textarea
              value={newProductForm.descripcion}
              onChange={(e) => setNewProductForm({ ...newProductForm, descripcion: e.target.value })}
              rows={3}
              placeholder="Descripción del producto"
              className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 resize-none bg-white hover:border-gray-400 transition-all duration-200"
              style={{ fontFamily: 'var(--font-poppins)' }}
            />
          </div>
          <div>
            <CategoriaAccordion
              value={newProductForm.categoria}
              onChange={(e) => {
                setNewProductForm({
                  ...newProductForm,
                  categoria: e.target.value,
                  tipoProducto: "" // Resetear tipo de producto al cambiar categoría
                });
              }}
              label="Categoría"
              required
              categorias={categoriasUnicas}
            />
          </div>
          <div>
            <CustomSelect
              name="tipoProducto"
              value={newProductForm.tipoProducto}
              onChange={(e) => setNewProductForm({ ...newProductForm, tipoProducto: e.target.value })}
              options={getTiposProducto(newProductForm.categoria)}
              placeholder={newProductForm.categoria ? "Seleccione un tipo de producto" : "Primero seleccione una categoría"}
              label="Tipo de Producto"
              required
              disabled={!newProductForm.categoria}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5" style={{ fontFamily: 'var(--font-poppins)' }}>
              Color/Tipo
            </label>
            <input
              type="text"
              value={newProductForm.colorTipo}
              onChange={(e) => setNewProductForm({ ...newProductForm, colorTipo: e.target.value })}
              placeholder="Color o tipo"
              className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white hover:border-gray-400 transition-all duration-200"
              style={{ fontFamily: 'var(--font-poppins)' }}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5" style={{ fontFamily: 'var(--font-poppins)' }}>
                Tamaño
              </label>
              <input
                type="text"
                value={newProductForm.tamano}
                onChange={(e) => setNewProductForm({ ...newProductForm, tamano: e.target.value })}
                placeholder="Tamaño"
                className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white hover:border-gray-400 transition-all duration-200"
                style={{ fontFamily: 'var(--font-poppins)' }}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5" style={{ fontFamily: 'var(--font-poppins)' }}>
                Pares por Caja
              </label>
              <input
                type="number"
                min="0"
                value={newProductForm.paresPorCaja}
                onChange={(e) => setNewProductForm({ ...newProductForm, paresPorCaja: e.target.value })}
                placeholder="0"
                className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white hover:border-gray-400 transition-all duration-200"
                style={{ fontFamily: 'var(--font-poppins)' }}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5" style={{ fontFamily: 'var(--font-poppins)' }}>
              Ficha Técnica (URL)
            </label>
            <input
              type="text"
              value={newProductForm.fichaTecnica}
              onChange={(e) => setNewProductForm({ ...newProductForm, fichaTecnica: e.target.value })}
              placeholder="URL de la ficha técnica (puede estar vacío)"
              className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white hover:border-gray-400 transition-all duration-200"
              style={{ fontFamily: 'var(--font-poppins)' }}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5" style={{ fontFamily: 'var(--font-poppins)' }}>
                Precio
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newProductForm.precio}
                onChange={(e) => setNewProductForm({ ...newProductForm, precio: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white hover:border-gray-400 transition-all duration-200"
                style={{ fontFamily: 'var(--font-poppins)' }}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5" style={{ fontFamily: 'var(--font-poppins)' }}>
                Stock
              </label>
              <input
                type="number"
                min="0"
                value={newProductForm.stock}
                onChange={(e) => setNewProductForm({ ...newProductForm, stock: e.target.value })}
                placeholder="0"
                className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white hover:border-gray-400 transition-all duration-200"
                style={{ fontFamily: 'var(--font-poppins)' }}
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
                  descripcion: "",
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
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm"
              style={{ fontFamily: 'var(--font-poppins)' }}
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
              className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 hover:shadow-lg hover:scale-105 rounded-lg transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 active:scale-[0.98]"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              {loadingData ? "Agregando..." : "Agregar Producto"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Gestionar Imagen */}
      <Modal
        isOpen={isGestionarImagenModalOpen}
        onClose={() => {
          setIsGestionarImagenModalOpen(false);
          setSelectedProducto(null);
          setSelectedImageFile(null);
          setImagePreview(null);
        }}
        title={`Gestionar Imagen del Producto - ${selectedProducto?.codigo || ""}`}
        size="lg"
      >
        {selectedProducto && (
          <div className="space-y-8">
            {/* Imagen Actual */}
            {selectedProducto.imagen && (
              <div className="bg-gradient-to-br from-slate-50 to-gray-50 border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
                  <h3 className="text-base font-semibold text-gray-800 tracking-tight">Imagen Actual</h3>
                </div>
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative w-full max-w-lg bg-white rounded-xl p-4 shadow-inner border border-gray-100">
                    <img
                      src={selectedProducto.imagen}
                      alt="Imagen actual"
                      className="w-full h-auto max-h-72 object-contain rounded-lg"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                  <a
                    href={selectedProducto.imagen}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 px-4 py-2 text-xs font-medium text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>Ver Imagen Actual</span>
                  </a>
                </div>
              </div>
            )}

            {/* Subir Nueva Imagen */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-1 h-5 bg-gradient-to-b from-green-500 to-green-600 rounded-full"></div>
                <h3 className="text-base font-semibold text-gray-800 tracking-tight">Subir Nueva Imagen</h3>
              </div>
              {imagePreview ? (
                <div className="space-y-4">
                  <div className="relative w-full max-w-lg mx-auto bg-white rounded-xl p-4 shadow-inner border border-gray-200">
                    <div className="relative h-56 rounded-lg overflow-hidden bg-gray-50">
                      <img
                        src={imagePreview}
                        alt="Vista previa"
                        className="w-full h-full object-contain"
                      />
                      <button
                        onClick={() => {
                          setSelectedImageFile(null);
                          setImagePreview(null);
                          const input = document.getElementById('image-upload');
                          if (input) input.value = '';
                        }}
                        className="absolute top-3 right-3 p-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-red-50 hover:border-red-300 hover:text-red-600 shadow-md"
                        title="Eliminar imagen seleccionada"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-800 mb-1">Archivo seleccionado</p>
                        <p className="text-xs text-gray-600 truncate mb-1">{selectedImageFile?.name}</p>
                        <p className="text-xs text-gray-500">Tamaño: {(selectedImageFile?.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const input = document.getElementById('image-upload');
                      if (input) input.click();
                    }}
                    className="w-full max-w-lg mx-auto px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 shadow-sm"
                  >
                    Cambiar Imagen
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="image-upload"
                  className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gradient-to-br from-gray-50 to-white hover:from-blue-50 hover:to-indigo-50 hover:border-blue-400"
                >
                  <div className="flex flex-col items-center justify-center pt-4 pb-4">
                    <div className="w-14 h-14 mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="mb-1.5 text-sm text-gray-600 font-medium">
                      Hacer clic para seleccionar archivo
                    </p>
                    <p className="text-xs text-gray-400">JPG, PNG, WEBP (MAX. 10MB)</p>
                  </div>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 10 * 1024 * 1024) {
                          alert("El archivo es demasiado grande. El tamaño máximo es 10MB.");
                          e.target.value = "";
                          return;
                        }
                        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                        if (!validTypes.includes(file.type)) {
                          alert("Por favor, selecciona un archivo de imagen válido (JPG, PNG, WEBP).");
                          e.target.value = "";
                          return;
                        }
                        setSelectedImageFile(file);
                        // Crear vista previa
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setImagePreview(reader.result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              )}
            </div>

            {/* Botones de acción */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setIsGestionarImagenModalOpen(false);
                  setSelectedProducto(null);
                  setSelectedImageFile(null);
                  setImagePreview(null);
                }}
                disabled={uploadingImage}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  if (!selectedImageFile) {
                    setModalMensaje({ open: true, tipo: "error", mensaje: "Por favor, selecciona un archivo de imagen para subir." });
                    return;
                  }

                  try {
                    setUploadingImage(true);

                    // Crear FormData para enviar el archivo
                    const formData = new FormData();
                    formData.append('file', selectedImageFile);

                    // Subir archivo a la API
                    const uploadResponse = await fetch(
                      `https://api-subida-archivos-2946605267.us-central1.run.app?bucket_name=archivos_sistema&folder_bucket=productos&method=no_encriptar`,
                      {
                        method: 'POST',
                        body: formData,
                      }
                    );

                    if (!uploadResponse.ok) {
                      throw new Error(`Error al subir la imagen: ${uploadResponse.status}`);
                    }

                    const uploadData = await uploadResponse.json();
                    const imageUrl = uploadData.url;

                    if (!imageUrl) {
                      throw new Error("La API no devolvió la URL de la imagen");
                    }

                    // Actualizar la URL en la base de datos
                    const token = localStorage.getItem("token");
                    if (!token) {
                      throw new Error("No se encontró token de autenticación");
                    }

                    // Validar que el ID existe y convertirlo a número
                    let productoId = selectedProducto.id || selectedProducto.ID;
                    if (!productoId || productoId === 0) {
                      console.error("❌ Producto sin ID válido:", selectedProducto);
                      throw new Error("No se pudo obtener el ID del producto. Producto: " + JSON.stringify(selectedProducto));
                    }

                    // Asegurar que el ID sea un número
                    if (typeof productoId === 'string') {
                      productoId = parseInt(productoId);
                      if (isNaN(productoId)) {
                        throw new Error("El ID del producto no es un número válido: " + selectedProducto.id);
                      }
                    }

                    // Asegurar que sea un número entero positivo
                    productoId = Math.floor(Number(productoId));
                    if (productoId <= 0) {
                      throw new Error("El ID del producto debe ser un número positivo: " + productoId);
                    }

                    console.log("🔄 Actualizando imagen en BD para producto ID:", productoId);
                    console.log("🔄 Tipo de ID:", typeof productoId);
                    console.log("🔄 URL de imagen:", imageUrl);
                    console.log("🔄 Producto completo:", selectedProducto);

                    const requestBody = {
                      id: productoId,
                      ID: productoId,  // También enviar en mayúsculas por si acaso
                      IMG_URL: imageUrl
                    };

                    console.log("🔄 Body a enviar:", JSON.stringify(requestBody, null, 2));

                    try {
                      const updateResponse = await fetch(
                        `/api/productos?method=ACTUALIZAR_IMAGEN_PRODUCTO`,
                        {
                          method: 'PUT',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                          },
                          body: JSON.stringify(requestBody)
                        }
                      );

                      console.log("🔄 Response status:", updateResponse.status);
                      console.log("🔄 Response ok:", updateResponse.ok);

                      // Leer la respuesta completa para debugging
                      const responseText = await updateResponse.text();
                      console.log("🔄 Response text completo:", responseText);

                      if (!updateResponse.ok) {
                        let errorData;
                        try {
                          errorData = JSON.parse(responseText);
                        } catch (e) {
                          errorData = { error: responseText || "Error desconocido" };
                        }
                        console.error("❌ Error en respuesta del backend:", errorData);
                        throw new Error(errorData.error || errorData.details || `Error al actualizar en BD: ${updateResponse.status}`);
                      }

                      let updateData;
                      try {
                        updateData = JSON.parse(responseText);
                      } catch (e) {
                        updateData = { message: responseText };
                      }
                      console.log("✅ Imagen actualizada en BD:", updateData);
                      console.log("✅ Tipo de respuesta:", typeof updateData);
                      console.log("✅ Tiene 'success':", updateData.success);
                      console.log("✅ Tiene 'Exito':", updateData.Exito);
                      console.log("✅ Respuesta completa:", JSON.stringify(updateData, null, 2));

                      // Verificar que la respuesta sea del backend nuevo
                      if (updateData.success === true) {
                        console.log("✅ Backend nuevo confirmado - success: true");
                        // Todo bien, continuar
                      } else if (updateData.Exito) {
                        // Backend antiguo - pero verificaremos después si se guardó
                        console.warn("⚠️ Backend respondió con formato antiguo (Exito), pero verificaremos si se guardó...");
                      } else {
                        // Respuesta inesperada - pero verificaremos después
                        console.warn("⚠️ Respuesta inesperada del backend, pero verificaremos si se guardó...");
                      }
                    } catch (fetchError) {
                      console.error("❌ Error al llamar al backend:", fetchError);
                      // Si falla la actualización en BD, al menos la imagen ya está en storage
                      // Podemos continuar pero avisar al usuario
                      throw new Error(`Error al guardar en base de datos: ${fetchError.message}. La imagen se subió a storage pero no se guardó la URL en la BD.`);
                    }

                    // Recargar la lista de productos para obtener los datos actualizados de la BD
                    await fetchProductos();

                    // Esperar un momento y verificar que la imagen se guardó realmente
                    await new Promise(resolve => setTimeout(resolve, 500));

                    // Obtener el producto actualizado directamente de la API para verificar
                    try {
                      const verifyResponse = await fetch("/api/productos", {
                        method: "GET",
                        headers: {
                          "Content-Type": "application/json",
                          "Authorization": `Bearer ${token}`
                        }
                      });

                      if (verifyResponse.ok) {
                        const productosVerificados = await verifyResponse.json();
                        console.log("🔍 Productos verificados (primeros 3):", productosVerificados?.slice(0, 3));
                        console.log("🔍 Buscando producto con ID:", productoId);

                        // Buscar el producto con diferentes variaciones de ID
                        const productoVerificado = Array.isArray(productosVerificados)
                          ? productosVerificados.find(p => {
                            const pId = p.id || p.ID || p.id_producto || p.idProducto;
                            const pIdNum = typeof pId === 'string' ? parseInt(pId) : pId;
                            const productoIdNum = typeof productoId === 'string' ? parseInt(productoId) : productoId;
                            return pIdNum === productoIdNum;
                          })
                          : null;

                        console.log("🔍 Producto encontrado:", productoVerificado);
                        console.log("🔍 Campos del producto:", productoVerificado ? Object.keys(productoVerificado) : "No encontrado");

                        // Buscar IMG_URL en todas las variaciones posibles
                        const imagenGuardada = productoVerificado ? (
                          productoVerificado.imagen ||
                          productoVerificado.IMAGEN ||
                          productoVerificado.IMG_URL ||
                          productoVerificado.img_url ||
                          productoVerificado.imagen_url ||
                          productoVerificado.imagenUrl ||
                          productoVerificado.IMAGEN_URL ||
                          productoVerificado.image ||
                          productoVerificado.IMAGE
                        ) : null;

                        console.log("🔍 Imagen guardada encontrada:", imagenGuardada);

                        if (!imagenGuardada) {
                          console.error("❌ La imagen NO se guardó en la BD.");
                          console.error("❌ Producto verificado completo:", JSON.stringify(productoVerificado, null, 2));
                          console.error("❌ URL que se intentó guardar:", imageUrl);
                          console.error("❌ Respuesta del backend fue:", JSON.stringify(updateData, null, 2));

                          // Si el backend respondió con "Exito", es código antiguo
                          if (updateData.Exito && !updateData.success) {
                            throw new Error("El backend desplegado NO tiene el código nuevo. Está respondiendo con 'Exito' en lugar de 'success'. Por favor, verifica que el código se desplegó correctamente. La imagen se subió a storage pero NO se guardó la URL en la base de datos.");
                          } else {
                            throw new Error("La imagen se subió a storage pero NO se guardó la URL en la base de datos. Verifica que el backend tenga el código actualizado y que la columna IMG_URL exista en la tabla productos.");
                          }
                        } else {
                          console.log("✅ Imagen confirmada en BD:", imagenGuardada);
                          console.log("✅ ¡Todo funcionó correctamente!");
                        }
                      }
                    } catch (verifyError) {
                      console.warn("⚠️ No se pudo verificar si la imagen se guardó:", verifyError);
                      // No lanzar error aquí, solo advertir
                    }

                    // Verificar que la imagen se guardó realmente
                    const productoActualizado = productos.find(p => p.id === productoId);
                    if (!productoActualizado || !productoActualizado.imagen) {
                      console.warn("⚠️ La imagen no aparece en la lista recargada. Puede que no se haya guardado en la BD.");
                      // No lanzar error aquí, solo advertir en consola
                    }

                    // Cerrar modal y limpiar estados
                    setIsGestionarImagenModalOpen(false);
                    setSelectedProducto(null);
                    setSelectedImageFile(null);
                    setImagePreview(null);

                    setModalMensaje({
                      open: true,
                      tipo: "success",
                      mensaje: "Imagen subida y guardada exitosamente en la base de datos."
                    });
                  } catch (error) {
                    console.error("Error al subir imagen:", error);
                    setModalMensaje({
                      open: true,
                      tipo: "error",
                      mensaje: `Error al subir la imagen: ${error.message}`
                    });
                  } finally {
                    setUploadingImage(false);
                  }
                }}
                disabled={!selectedImageFile || uploadingImage}
                className="flex items-center space-x-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md"
              >
                {uploadingImage ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Subiendo...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    <span>Guardar Imagen</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
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
        size="lg"
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
                onClick={async () => {
                  if (!selectedFile) {
                    setModalMensaje({ open: true, tipo: "error", mensaje: "Por favor, selecciona un archivo PDF para subir." });
                    return;
                  }

                  try {
                    // Crear FormData para enviar el archivo
                    const formData = new FormData();
                    formData.append('file', selectedFile);

                    // Subir archivo a la API
                    const uploadResponse = await fetch(
                      `https://api-subida-archivos-2946605267.us-central1.run.app?bucket_name=archivos_sistema&folder_bucket=productos&method=no_encriptar`,
                      {
                        method: 'POST',
                        body: formData,
                      }
                    );

                    if (!uploadResponse.ok) {
                      throw new Error(`Error al subir el PDF: ${uploadResponse.status}`);
                    }

                    const uploadData = await uploadResponse.json();
                    const pdfUrl = uploadData.url;

                    if (!pdfUrl) {
                      throw new Error("La API no devolvió la URL del PDF");
                    }

                    // Actualizar la URL en la base de datos
                    const token = localStorage.getItem("token");
                    if (!token) {
                      throw new Error("No se encontró token de autenticación");
                    }

                    // Validar que el ID existe y convertirlo a número
                    let productoId = selectedProducto.id || selectedProducto.ID;
                    if (!productoId || productoId === 0) {
                      console.error("❌ Producto sin ID válido:", selectedProducto);
                      throw new Error("No se pudo obtener el ID del producto. Producto: " + JSON.stringify(selectedProducto));
                    }

                    // Asegurar que el ID sea un número
                    if (typeof productoId === 'string') {
                      productoId = parseInt(productoId);
                      if (isNaN(productoId)) {
                        throw new Error("El ID del producto no es un número válido: " + selectedProducto.id);
                      }
                    }

                    // Asegurar que sea un número entero positivo
                    productoId = Math.floor(Number(productoId));
                    if (productoId <= 0) {
                      throw new Error("El ID del producto debe ser un número positivo: " + productoId);
                    }

                    console.log("🔄 Actualizando ficha técnica en BD para producto ID:", productoId);
                    console.log("🔄 Tipo de ID:", typeof productoId);
                    console.log("🔄 URL del PDF:", pdfUrl);
                    console.log("🔄 Producto completo:", selectedProducto);

                    const requestBody = {
                      id: productoId,
                      ID: productoId,  // También enviar en mayúsculas por si acaso
                      url_ficha_tecnica: pdfUrl
                    };

                    console.log("🔄 Body a enviar:", JSON.stringify(requestBody, null, 2));

                    console.log("🔄 Body a enviar:", requestBody);

                    try {
                      const updateResponse = await fetch(
                        `/api/productos?method=ACTUALIZAR_FICHA_TECNICA_PRODUCTO`,
                        {
                          method: 'PUT',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                          },
                          body: JSON.stringify(requestBody)
                        }
                      );

                      console.log("🔄 Response status:", updateResponse.status);
                      console.log("🔄 Response ok:", updateResponse.ok);

                      // Leer la respuesta completa para debugging
                      const responseText = await updateResponse.text();
                      console.log("🔄 Response text completo:", responseText);

                      if (!updateResponse.ok) {
                        let errorData;
                        try {
                          errorData = JSON.parse(responseText);
                        } catch (e) {
                          errorData = { error: responseText || "Error desconocido" };
                        }
                        console.error("❌ Error en respuesta del backend:", errorData);
                        throw new Error(errorData.error || errorData.details || `Error al actualizar en BD: ${updateResponse.status}`);
                      }

                      let updateData;
                      try {
                        updateData = JSON.parse(responseText);
                      } catch (e) {
                        updateData = { message: responseText };
                      }
                      console.log("✅ Ficha técnica actualizada en BD:", updateData);
                    } catch (fetchError) {
                      console.error("❌ Error al llamar al backend:", fetchError);
                      // Si falla la actualización en BD, al menos el PDF ya está en storage
                      // Podemos continuar pero avisar al usuario
                      throw new Error(`Error al guardar en base de datos: ${fetchError.message}. El PDF se subió a storage pero no se guardó la URL en la BD.`);
                    }

                    // Recargar la lista de productos para obtener los datos actualizados de la BD
                    await fetchProductos();

                    // Cerrar modal y limpiar estados
                    setIsGestionarPDFModalOpen(false);
                    setSelectedProducto(null);
                    setSelectedFile(null);

                    setModalMensaje({
                      open: true,
                      tipo: "success",
                      mensaje: "PDF subido y guardado exitosamente en la base de datos."
                    });
                  } catch (error) {
                    console.error("Error al subir PDF:", error);
                    setModalMensaje({
                      open: true,
                      tipo: "error",
                      mensaje: `Error al subir el PDF: ${error.message}`
                    });
                  }
                }}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-br from-[#002D5A] to-[#002D5A] hover:shadow-md hover:scale-105 rounded-lg transition-all duration-200 shadow-sm"
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

      {/* Modal Ver Descripción */}
      <Modal
        isOpen={isDescripcionModalOpen}
        onClose={() => {
          setIsDescripcionModalOpen(false);
          setSelectedDescripcion("");
        }}
        title="Descripción del Producto"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
              {selectedDescripcion || "Sin descripción disponible"}
            </p>
          </div>
          <div className="flex justify-end pt-2">
            <button
              onClick={() => {
                setIsDescripcionModalOpen(false);
                setSelectedDescripcion("");
              }}
              className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-br from-[#002D5A] to-[#002D5A] rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
            >
              Cerrar
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Mensaje */}
      <Modal
        isOpen={modalMensaje.open}
        onClose={() => setModalMensaje({ open: false, tipo: "success", mensaje: "" })}
        title={modalMensaje.tipo === "success" ? "Éxito" : modalMensaje.tipo === "error" ? "Error" : "Información"}
        size="sm"
      >
        <div className="space-y-4">
          <p className={`text-sm ${modalMensaje.tipo === "success" ? "text-green-700" :
            modalMensaje.tipo === "error" ? "text-red-700" :
              "text-blue-700"
            }`}>
            {modalMensaje.mensaje}
          </p>
          <div className="flex justify-end pt-2">
            <button
              onClick={() => setModalMensaje({ open: false, tipo: "success", mensaje: "" })}
              className={`px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ${modalMensaje.tipo === "success" ? "bg-green-600 hover:bg-green-700" :
                modalMensaje.tipo === "error" ? "bg-red-600 hover:bg-red-700" :
                  "bg-blue-600 hover:bg-blue-700"
                }`}
            >
              Aceptar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

