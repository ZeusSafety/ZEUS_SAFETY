"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../components/context/AuthContext";
import { Header } from "../../../../components/layout/Header";
import { Sidebar } from "../../../../components/layout/Sidebar";

export default function GestionPreciosPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("MALVINAS");
  const [preciosData, setPreciosData] = useState({});
  const [loadingAll, setLoadingAll] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [editingData, setEditingData] = useState({});
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: "", type: "success" });
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("create");
  const [formData, setFormData] = useState({});
  const [productoBusqueda, setProductoBusqueda] = useState("");
  const [sugerenciasProductos, setSugerenciasProductos] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [todosLosProductos, setTodosLosProductos] = useState([]);
  const [productosCargados, setProductosCargados] = useState(false);
  const [buscandoProductos, setBuscandoProductos] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const productoInputRef = useRef(null);
  const sugerenciasRef = useRef(null);
  const [tablasDisponibles, setTablasDisponibles] = useState([
    { value: "MALVINAS", label: "Malvinas Online", disponible: true },
    { value: "PROVINCIA", label: "Provincia Online", disponible: true },
    { value: "FERRETERIA", label: "Ferretería Online", disponible: true },
    { value: "CLIENTES_FINALES", label: "Clientes Finales Online", disponible: true },
    { value: "JICAMARCA", label: "Jicamarca", disponible: false },
    { value: "ONLINE", label: "Online", disponible: false },
  ]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

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

  const fetchPrecios = useCallback(async (tablaId) => {
    try {
      let token = localStorage.getItem("token") ||
        (user?.token || user?.accessToken || user?.access_token) ||
        sessionStorage.getItem("token");

      if (!token) {
        router.push("/login");
        throw new Error("Token no encontrado. Por favor, inicie sesión.");
      }

      const apiUrl = `/api/franja-precios?id=${encodeURIComponent(tablaId)}`;

      const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`,
      };

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          router.push("/login");
          throw new Error("token expirado");
        }
        return [];
      }

      const data = await response.json();
      return Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      console.error(`Error al obtener precios para ${tablaId}:`, err.message);
      return [];
    }
  }, [user, router]);

  useEffect(() => {
    const loadAllData = async () => {
      if (!user) return;

      setLoadingAll(true);
      setError(null);

      try {
        const promises = tablasDisponibles.map(async (tabla) => {
          const data = await fetchPrecios(tabla.value);
          return { tabla: tabla.value, data };
        });

        const results = await Promise.all(promises);
        const newPreciosData = {};
        results.forEach(({ tabla, data }) => {
          newPreciosData[tabla] = data;
        });

        setPreciosData(newPreciosData);

        setTablasDisponibles(prev =>
          prev.map(tabla => {
            if (tabla.value === "JICAMARCA" || tabla.value === "ONLINE") {
              return { ...tabla, disponible: false };
            }
            const tieneDatos = newPreciosData[tabla.value] && newPreciosData[tabla.value].length > 0;
            return { ...tabla, disponible: tieneDatos };
          })
        );
      } catch (err) {
        console.error("Error al cargar datos:", err);
        setError("Error al cargar los datos. Por favor, intente nuevamente.");
      } finally {
        setLoadingAll(false);
      }
    };

    if (!loading && user) {
      loadAllData();
    }
  }, [user, loading, fetchPrecios]);

  const getPriceColumns = useMemo(() => {
    const precios = preciosData[activeTab] || [];
    if (precios.length === 0) return [];

    const excludedFields = [
      'index', 'ID', 'id', 'Codigo', 'codigo', 'CODIGO', 'Producto', 'producto', 'PRODUCTO',
      'ficha_tecnica', 'FICHA_TECNICA', 'FICHA_TECNICA_ENLACE', 'ficha_tecnica_enlace',
      'texto_copiar', 'TEXTO_COPIAR', 'textoCopiar'
    ];

    const firstRecord = precios[0];
    const allKeys = Object.keys(firstRecord);

    return allKeys
      .filter(key => {
        const keyUpper = key.toUpperCase();
        if (excludedFields.some(excluded => keyUpper.includes(excluded.toUpperCase()))) {
          return false;
        }
        const value = firstRecord[key];
        const isNumeric = typeof value === 'number' ||
          (!isNaN(parseFloat(value)) && value !== null && value !== '');
        if (keyUpper.includes('CAJA') || keyUpper.includes('DOCENA')) {
          return isNumeric;
        }
        return false;
      })
      .sort((a, b) => {
        const aUpper = a.toUpperCase();
        const bUpper = b.toUpperCase();
        const getOrder = (str) => {
          if (str.includes('DOCENA')) return 1;
          if (str.includes('CAJA')) return 2;
          return 3;
        };
        const orderA = getOrder(aUpper);
        const orderB = getOrder(bUpper);
        if (orderA !== orderB) return orderA - orderB;
        const numA = parseInt(a.match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.match(/\d+/)?.[0] || '0');
        return numA - numB;
      });
  }, [preciosData, activeTab]);

  const precios = preciosData[activeTab] || [];

  const preciosFiltrados = useMemo(() => {
    if (!searchTerm.trim()) return precios;
    const term = searchTerm.toLowerCase().trim();
    return precios.filter((precio) => {
      const getField = (variations) => {
        for (const variation of variations) {
          if (precio[variation] !== undefined && precio[variation] !== null && precio[variation] !== "") {
            return String(precio[variation]).toLowerCase();
          }
        }
        return "";
      };
      const codigo = getField(["Codigo", "codigo", "CODIGO"]);
      const producto = getField(["Producto", "producto", "PRODUCTO"]);
      return codigo.includes(term) || producto.includes(term);
    });
  }, [precios, searchTerm]);

  const totalPages = Math.ceil(preciosFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const preciosPaginados = preciosFiltrados.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedRows(new Set());
    setEditingData({});
  }, [searchTerm, activeTab]);

  const handleSelectRow = (codigo) => {
    const precios = preciosData[activeTab] || [];
    const newSelected = new Set(selectedRows);
    if (newSelected.has(codigo)) {
      newSelected.delete(codigo);
      const newEditing = { ...editingData };
      delete newEditing[codigo];
      setEditingData(newEditing);
    } else {
      newSelected.add(codigo);
      const precio = precios.find(p => {
        const getField = (variations) => {
          for (const variation of variations) {
            if (p[variation] !== undefined && p[variation] !== null && p[variation] !== "") {
              return p[variation];
            }
          }
          return null;
        };
        return getField(["Codigo", "codigo", "CODIGO"]) === codigo;
      });
      if (precio) {
        setEditingData(prev => ({
          ...prev,
          [codigo]: { ...precio }
        }));
      }
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedRows.size === preciosPaginados.length && preciosPaginados.length > 0) {
      setSelectedRows(new Set());
      setEditingData({});
    } else {
      const newSelected = new Set();
      const newEditing = {};
      preciosPaginados.forEach(precio => {
        const getField = (variations) => {
          for (const variation of variations) {
            if (precio[variation] !== undefined && precio[variation] !== null && precio[variation] !== "") {
              return precio[variation];
            }
          }
          return null;
        };
        const codigo = getField(["Codigo", "codigo", "CODIGO"]);
        if (codigo) {
          newSelected.add(codigo);
          newEditing[codigo] = { ...precio };
        }
      });
      setSelectedRows(newSelected);
      setEditingData(newEditing);
    }
  };

  const handleEditField = (codigo, field, value) => {
    setEditingData(prev => ({
      ...prev,
      [codigo]: {
        ...prev[codigo],
        [field]: value ? parseFloat(value) : null
      }
    }));
  };

  // Función para obtener el token de autenticación
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem("token") ||
        (user?.token || user?.accessToken || user?.access_token) ||
        sessionStorage.getItem("token") || "";
    }
    return "";
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
        if (response.status === 401) {
          console.error("Error 401: Token de autenticación inválido o expirado");
        } else {
          console.error(`Error ${response.status}: ${response.statusText}`);
        }
        throw new Error(`Error al cargar productos: ${response.status}`);
      }

      const data = await response.json();
      const productos = Array.isArray(data) ? data : (data.data || []);

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
    const productosFiltrados = todosLosProductos.filter(prod => {
      const nombre = (prod.NOMBRE || prod.nombre || "").toLowerCase();
      const codigo = (prod.CODIGO || prod.codigo || "").toLowerCase();
      return nombre.includes(terminoLower) || codigo.includes(terminoLower);
    });

    setSugerenciasProductos(productosFiltrados);
    setMostrarSugerencias(productosFiltrados.length > 0);
  };

  // Función para buscar productos
  const buscarProductos = (termino) => {
    if (!termino || termino.trim().length < 2) {
      setSugerenciasProductos([]);
      setMostrarSugerencias(false);
      return;
    }

    if (!productosCargados && todosLosProductos.length === 0) {
      cargarTodosLosProductos().then(() => {
        filtrarProductos(termino);
      });
      return;
    }

    filtrarProductos(termino);
  };

  // Manejar cuando el usuario enfoca el campo de producto
  const handleProductoFocus = () => {
    if (!productosCargados && todosLosProductos.length === 0) {
      cargarTodosLosProductos();
    }

    if (productoBusqueda && sugerenciasProductos.length > 0) {
      setMostrarSugerencias(true);
    }
  };

  // Seleccionar producto de las sugerencias
  const seleccionarProducto = (productoItem) => {
    const nombre = productoItem.NOMBRE || productoItem.nombre || "";
    const codigo = productoItem.CODIGO || productoItem.codigo || "";

    setProductoBusqueda(nombre);
    setFormData({ ...formData, NOMBRE: nombre, CODIGO: codigo });
    setSugerenciasProductos([]);
    setMostrarSugerencias(false);
  };

  // Cerrar sugerencias al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sugerenciasRef.current &&
        !sugerenciasRef.current.contains(event.target) &&
        productoInputRef.current &&
        !productoInputRef.current.contains(event.target)
      ) {
        setMostrarSugerencias(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleAgregar = () => {
    setModalType("create");
    const defaultFormData = {
      CODIGO: "",
      NOMBRE: "",
      UNIDAD_MEDIDA_VENTA: "UNIDAD",
      CANTIDAD_UNIDAD_MEDIDA_VENTA: 1,
      PRECIO_UNIDAD_MEDIDA_VENTA: 0,
      UNIDAD_MEDIDA_CAJA: "UNIDAD",
      CANTIDAD_CAJA: 0,
      CLASIFICACION: activeTab,
      TEXTO_COPIAR: ""
    };
    setFormData(defaultFormData);
    setProductoBusqueda("");
    setSugerenciasProductos([]);
    setMostrarSugerencias(false);
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      let token = localStorage.getItem("token") ||
        (user?.token || user?.accessToken || user?.access_token) ||
        sessionStorage.getItem("token");

      if (!token) {
        router.push("/login");
        return;
      }

      if (!formData.CODIGO) {
        setErrorMessage("Por favor complete todos los campos requeridos");
        setShowErrorModal(true);
        setSaving(false);
        return;
      }

      if (modalType === "create" && !formData.NOMBRE) {
        setErrorMessage("Por favor complete todos los campos requeridos");
        setShowErrorModal(true);
        setSaving(false);
        return;
      }

      const method = modalType === "create" ? "POST" : "PUT";
      const apiMethod = modalType === "create" ? "CREAR_FRANJA_PRECIO" : "ACTUALIZAR_FRANJA_PRECIO";
      const apiUrl = `/api/franja-precios?method=${apiMethod}&id=${encodeURIComponent(activeTab)}`;

      const nombreValue = modalType === "create"
        ? (formData.NOMBRE || formData.nombre || "")
        : (formData.NOMBRE || formData.nombre || "");

      if (!formData.CODIGO && !formData.codigo) {
        setErrorMessage("Error: El campo Código es requerido");
        setShowErrorModal(true);
        setSaving(false);
        return;
      }

      if (modalType === "create" && !nombreValue) {
        setErrorMessage("Error: El campo Nombre es requerido");
        setShowErrorModal(true);
        setSaving(false);
        return;
      }

      const requestBody = {
        ...formData,
        NOMBRE: nombreValue,
        CLASIFICACION: activeTab,
        TEXTO_COPIAR: formData.TEXTO_COPIAR || formData.texto_copiar || formData.textoCopiar || "",
      };

      const response = await fetch(apiUrl, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        let errorMessage = `Error al ${modalType === "create" ? "crear" : "actualizar"} el producto`;
        try {
          const errorText = await response.text();
          try {
            const errorData = JSON.parse(errorText);
            let extractedError = errorData.error || errorData.message || errorData.details;
            if (typeof extractedError === 'number') {
              if (extractedError === 0) {
                extractedError = "Error desconocido. Verifique que todos los campos estén completos.";
              } else {
                extractedError = `Error ${extractedError}`;
              }
            }
            if (extractedError && typeof extractedError === 'string' && extractedError.trim()) {
              errorMessage = extractedError;
            } else if (!extractedError) {
              errorMessage = `Error ${response.status}: ${response.statusText || 'Error desconocido'}`;
            }
          } catch (jsonError) {
            if (errorText && errorText.trim()) {
              errorMessage = errorText;
            } else {
              errorMessage = `Error ${response.status}: ${response.statusText || 'Error desconocido'}`;
            }
          }
        } catch (parseError) {
          errorMessage = `Error ${response.status}: ${response.statusText || 'Error desconocido'}`;
        }
        throw new Error(errorMessage);
      }

      const newData = await fetchPrecios(activeTab);
      const newPreciosData = { ...preciosData };
      newPreciosData[activeTab] = newData;
      setPreciosData(newPreciosData);

      setShowModal(false);
      setProductoBusqueda("");
      setSugerenciasProductos([]);
      setMostrarSugerencias(false);

      setNotification({
        show: true,
        message: `Producto ${modalType === "create" ? "creado" : "actualizado"} correctamente`,
        type: "success"
      });
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "success" });
      }, 2000);
    } catch (error) {
      console.error(`Error al ${modalType === "create" ? "crear" : "actualizar"}:`, error);
      setErrorMessage(`Error al ${modalType === "create" ? "crear" : "actualizar"} el producto: ${error.message}`);
      setShowErrorModal(true);
    } finally {
      setSaving(false);
    }
  };

  // Función para copiar texto al portapapeles
  const copyToClipboard = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => {
        setCopiedIndex(null);
      }, 2000); // Mostrar feedback por 2 segundos
    } catch (err) {
      console.error("Error al copiar al portapapeles:", err);
      // Fallback para navegadores antiguos
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setCopiedIndex(index);
        setTimeout(() => {
          setCopiedIndex(null);
        }, 2000);
      } catch (fallbackErr) {
        console.error("Error en fallback de copia:", fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleSaveAll = async () => {
    if (selectedRows.size === 0) return;

    try {
      setSaving(true);
      let token = localStorage.getItem("token") ||
        (user?.token || user?.accessToken || user?.access_token) ||
        sessionStorage.getItem("token");

      if (!token) {
        router.push("/login");
        return;
      }

      const mercado = activeTab === "MALVINAS" ? "Malvinas_online" :
                     activeTab === "PROVINCIA" ? "Provincia_online" :
                     activeTab === "FERRETERIA" ? "Ferreteria_online" :
                     activeTab === "CLIENTES_FINALES" ? "Clientes_finales_online" : activeTab;

      const promises = Array.from(selectedRows).map(async (codigo) => {
        const editRow = editingData[codigo];
        if (!editRow) return;

        const getField = (variations) => {
          for (const variation of variations) {
            if (editRow[variation] !== undefined && editRow[variation] !== null && editRow[variation] !== "") {
              return editRow[variation];
            }
          }
          return null;
        };

        const requestBody = {
          mercado: mercado,
          codigo: codigo,
          docena: getField(["Docena", "docena", "DOCENA"]) || null,
          caja_1: getField(["Caja_1", "caja_1", "CAJA_1", "Caja 1"]) || null,
          caja_5: getField(["Caja_5", "caja_5", "CAJA_5", "Caja 5"]) || null,
          caja_10: getField(["Caja_10", "caja_10", "CAJA_10", "Caja 10"]) || null,
          caja_20: getField(["Caja_20", "caja_20", "CAJA_20", "Caja 20"]) || null,
          texto_copiar: getField(["texto_copiar", "TEXTO_COPIAR", "textoCopiar"]) || ""
        };

        const apiUrl = `/api/franja-precios?method=actualizar_precios_mercado`;

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: `Error ${response.status}` }));
          throw new Error(errorData.error || `Error ${response.status}`);
        }

        return response.json();
      });

      await Promise.all(promises);

      // Recargar datos
      const updatedData = await fetchPrecios(activeTab);
      setPreciosData(prev => ({ ...prev, [activeTab]: updatedData }));

      // Limpiar selección
      setSelectedRows(new Set());
      setEditingData({});

      setNotification({
        show: true,
        message: `${selectedRows.size} producto(s) actualizado(s) exitosamente`,
        type: "success"
      });

      setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 3000);

    } catch (err) {
      setNotification({
        show: true,
        message: err.message || "Error al actualizar los precios",
        type: "error"
      });
      setTimeout(() => setNotification({ show: false, message: "", type: "error" }), 3000);
    } finally {
      setSaving(false);
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
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${sidebarOpen ? "lg:ml-60 ml-0" : "ml-0"}`}>
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 lg:p-8">
            <button
              onClick={() => router.push("/marketing")}
              className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-lg font-medium hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm ripple-effect relative overflow-hidden text-sm group"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver a Marketing</span>
            </button>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6 mb-6">
              <div className="mb-6 flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#002D5A] to-[#002D5A] rounded-xl flex items-center justify-center text-white shadow-sm">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>Gestión de Precios</h1>
                  <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: 'var(--font-poppins)' }}>
                    Actualiza y gestiona los precios de productos por mercado.
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                  {tablasDisponibles.map((tabla) => {
                    const isActive = activeTab === tabla.value;
                    const isDisabled = !tabla.disponible;
                    const hasData = preciosData[tabla.value]?.length > 0;

                    return (
                      <button
                        key={tabla.value}
                        onClick={() => {
                          if (!isDisabled) {
                            setActiveTab(tabla.value);
                            setSearchTerm("");
                          }
                        }}
                        disabled={isDisabled}
                        className={`
                          px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200
                          ${isActive
                            ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md hover:shadow-lg"
                            : isDisabled
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-sm"
                          }
                        `}
                        style={{ fontFamily: 'var(--font-poppins)' }}
                      >
                        <div className="flex items-center gap-2">
                          <span>{tabla.label}</span>
                          {hasData && !isActive && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold" style={{ fontFamily: 'var(--font-poppins)' }}>
                              {preciosData[tabla.value].length}
                            </span>
                          )}
                          {isDisabled && (
                            <span className="text-xs">(Próximamente)</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Banner de selección y guardar */}
              {selectedRows.size > 0 && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                  <p className="text-sm text-blue-700 font-semibold" style={{ fontFamily: 'var(--font-poppins)' }}>
                    {selectedRows.size} producto(s) seleccionado(s)
                  </p>
                  <button
                    onClick={handleSaveAll}
                    disabled={saving}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                    style={{ fontFamily: 'var(--font-poppins)' }}
                  >
                    {saving ? "Guardando..." : `Guardar ${selectedRows.size} cambio(s)`}
                  </button>
                </div>
              )}

              {/* Notificación */}
              {notification.show && (
                <div className={`mb-4 p-4 rounded-lg ${notification.type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
                  <p className="text-sm font-semibold" style={{ fontFamily: 'var(--font-poppins)' }}>
                    {notification.message}
                  </p>
                </div>
              )}

              {loadingAll ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
                  <span className="ml-3 text-gray-600 mt-4" style={{ fontFamily: 'var(--font-poppins)' }}>Cargando todas las clasificaciones...</span>
                </div>
              ) : precios.length === 0 ? (
                <div className="text-center py-12">
                  {(activeTab === "JICAMARCA" || activeTab === "ONLINE") ? (
                    <div>
                      <p className="text-gray-600 text-lg font-semibold mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>Próximamente</p>
                      <p className="text-gray-500 text-sm" style={{ fontFamily: 'var(--font-poppins)' }}>Esta clasificación estará disponible próximamente.</p>
                    </div>
                  ) : (
                    <p className="text-gray-500" style={{ fontFamily: 'var(--font-poppins)' }}>No hay datos disponibles para esta clasificación.</p>
                  )}
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="Buscar por código o nombre de producto..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full px-4 py-2.5 pl-11 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 transition-all duration-200 hover:border-blue-300 bg-gradient-to-br from-gray-50 to-white shadow-sm font-medium"
                          style={{ fontFamily: 'var(--font-poppins)' }}
                        />
                        <svg
                          className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      </div>
                      <button
                        onClick={() => {
                          // Exportar a Excel
                          const exportToExcel = () => {
                            const headers = ['CÓDIGO', 'PRODUCTO', 'FICHA TÉCNICA', ...getPriceColumns.map(col => col.replace(/_/g, ' ')), 'TEXTO COPIAR'];
                            const rows = preciosFiltrados.map(precio => {
                              const getField = (variations) => {
                                for (const variation of variations) {
                                  if (precio[variation] !== undefined && precio[variation] !== null && precio[variation] !== "") {
                                    return precio[variation];
                                  }
                                }
                                return "";
                              };
                              const codigo = getField(["Codigo", "codigo", "CODIGO"]) || "";
                              const producto = getField(["Producto", "producto", "PRODUCTO"]) || "";
                              const fichaTecnica = getField(["ficha_tecnica", "FICHA_TECNICA", "FICHA_TECNICA_ENLACE", "ficha_tecnica_enlace"]) || "";
                              const textoCopiar = getField(["texto_copiar", "TEXTO_COPIAR", "textoCopiar"]) || "";
                              const precios = getPriceColumns.map(col => precio[col] || "");
                              return [codigo, producto, fichaTecnica, ...precios, textoCopiar];
                            });
                            
                            let csvContent = headers.join(',') + '\n';
                            rows.forEach(row => {
                              csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
                            });
                            
                            const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
                            const link = document.createElement('a');
                            const url = URL.createObjectURL(blob);
                            link.setAttribute('href', url);
                            link.setAttribute('download', `precios_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
                            link.style.visibility = 'hidden';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          };
                          exportToExcel();
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105 active:scale-[0.98] text-sm whitespace-nowrap"
                        style={{ fontFamily: 'var(--font-poppins)' }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Excel
                      </button>
                      <button
                        onClick={() => {
                          // Exportar a PDF
                          const exportToPDF = () => {
                            const printWindow = window.open('', '_blank');
                            
                            let htmlContent = `
                              <!DOCTYPE html>
                              <html>
                              <head>
                                <title>Listado de Precios - ${activeTab}</title>
                                <style>
                                  body { font-family: Arial, sans-serif; padding: 20px; }
                                  h1 { color: #002D5A; }
                                  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                                  th { background-color: #1e40af; color: white; padding: 10px; text-align: left; }
                                  td { padding: 8px; border: 1px solid #ddd; }
                                  tr:nth-child(even) { background-color: #f9fafb; }
                                </style>
                              </head>
                              <body>
                                <h1>Listado de Precios - ${activeTab}</h1>
                                <p>Fecha: ${new Date().toLocaleDateString('es-ES')}</p>
                                <table>
                                  <thead>
                                    <tr>
                                      <th>CÓDIGO</th>
                                      <th>PRODUCTO</th>
                                      <th>FICHA TÉCNICA</th>
                                      ${getPriceColumns.map(col => `<th>${col.replace(/_/g, ' ')}</th>`).join('')}
                                      <th>TEXTO COPIAR</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    ${preciosFiltrados.map(precio => {
                                      const getField = (variations) => {
                                        for (const variation of variations) {
                                          if (precio[variation] !== undefined && precio[variation] !== null && precio[variation] !== "") {
                                            return precio[variation];
                                          }
                                        }
                                        return "";
                                      };
                                      const codigo = getField(["Codigo", "codigo", "CODIGO"]) || "-";
                                      const producto = getField(["Producto", "producto", "PRODUCTO"]) || "-";
                                      const fichaTecnica = getField(["ficha_tecnica", "FICHA_TECNICA", "FICHA_TECNICA_ENLACE", "ficha_tecnica_enlace"]) || "-";
                                      const textoCopiar = getField(["texto_copiar", "TEXTO_COPIAR", "textoCopiar"]) || "-";
                                      const precios = getPriceColumns.map(col => {
                                        const val = precio[col];
                                        return val && val !== null && val !== "" ? `S/.${parseFloat(val).toFixed(2)}` : "-";
                                      }).join('</td><td>');
                                      return `<tr><td>${codigo}</td><td>${producto}</td><td>${fichaTecnica}</td><td>${precios}</td><td>${textoCopiar}</td></tr>`;
                                    }).join('')}
                                  </tbody>
                                </table>
                              </body>
                              </html>
                            `;
                            
                            printWindow.document.write(htmlContent);
                            printWindow.document.close();
                            setTimeout(() => {
                              printWindow.print();
                            }, 250);
                          };
                          exportToPDF();
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105 active:scale-[0.98] text-sm whitespace-nowrap"
                        style={{ fontFamily: 'var(--font-poppins)' }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        PDF
                      </button>
                      <button
                        onClick={handleAgregar}
                        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105 active:scale-[0.98] text-xs whitespace-nowrap"
                        style={{ fontFamily: 'var(--font-poppins)' }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Agregar Producto
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      {searchTerm && (
                        <p className="text-xs text-gray-500" style={{ fontFamily: 'var(--font-poppins)' }}>
                          Mostrando {preciosFiltrados.length} de {precios.length} productos
                        </p>
                      )}
                    </div>
                  </div>

                  {preciosFiltrados.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500" style={{ fontFamily: 'var(--font-poppins)' }}>No se encontraron productos que coincidan con "{searchTerm}"</p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden mb-6">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gradient-to-r from-blue-700 to-blue-800 border-b-2 border-blue-900">
                              <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                                <input
                                  type="checkbox"
                                  checked={selectedRows.size === preciosPaginados.length && preciosPaginados.length > 0}
                                  onChange={handleSelectAll}
                                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                />
                              </th>
                              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                                CÓDIGO
                              </th>
                              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                                PRODUCTO
                              </th>
                              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                                FICHA TÉCNICA
                              </th>
                              {getPriceColumns.map((columna) => (
                                <th
                                  key={columna}
                                  className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap"
                                  style={{ fontFamily: 'var(--font-poppins)' }}
                                >
                                  {columna.replace(/_/g, ' ')}
                                </th>
                              ))}
                              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                                ACCIONES
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {preciosPaginados.map((precio, index) => {
                              const globalIndex = startIndex + index;
                              const getField = (variations) => {
                                for (const variation of variations) {
                                  if (precio[variation] !== undefined && precio[variation] !== null && precio[variation] !== "") {
                                    return precio[variation];
                                  }
                                }
                                return null;
                              };

                              const codigo = getField(["Codigo", "codigo", "CODIGO"]);
                              const producto = getField(["Producto", "producto", "PRODUCTO"]);
                              const fichaTecnica = getField(["ficha_tecnica", "FICHA_TECNICA", "FICHA_TECNICA_ENLACE", "ficha_tecnica_enlace"]);
                              const textoCopiar = getField(["texto_copiar", "TEXTO_COPIAR", "textoCopiar"]);

                              const isSelected = selectedRows.has(codigo);
                              const editRow = editingData[codigo] || precio;

                              const formatPrice = (val) => {
                                if (val === null || val === undefined || val === "" || val === "NaN") return { text: "", isZero: false };
                                if (typeof val === "number" && isNaN(val)) return { text: "", isZero: false };
                                const num = parseFloat(val);
                                if (isNaN(num)) return { text: "", isZero: false };
                                if (num === 0) return { text: "", isZero: true };
                                return { text: `S/.${num.toFixed(2)}`, isZero: false };
                              };

                              return (
                                <tr key={globalIndex} className={`hover:bg-blue-50 transition-colors border-b border-gray-100 ${isSelected ? "bg-blue-100" : ""}`}>
                                  <td className="px-4 py-3 whitespace-nowrap text-center">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => handleSelectRow(codigo)}
                                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-[10px] font-medium text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                                    {codigo || "-"}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>
                                    {producto || "-"}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-center">
                                    <div className="flex items-center justify-center">
                                      {fichaTecnica && fichaTecnica !== "" && fichaTecnica !== null && fichaTecnica !== undefined ? (
                                        <a
                                          href={fichaTecnica}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center space-x-1 px-2.5 py-1 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                                          title="Abrir ficha técnica en nueva pestaña"
                                          style={{ fontFamily: 'var(--font-poppins)' }}
                                        >
                                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ pointerEvents: 'none' }}>
                                            <path d="M6 2C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V7.41421C19 7.149 18.8946 6.89464 18.7071 6.70711L13.2929 1.29289C13.1054 1.10536 12.851 1 12.5858 1H6Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
                                            <path d="M13 1V6H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            <text x="12" y="15" fontSize="6" fill="currentColor" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="0.3">PDF</text>
                                          </svg>
                                          <span style={{ pointerEvents: 'none' }}>PDF</span>
                                        </a>
                                      ) : (
                                        <button
                                          className="inline-flex items-center space-x-1 px-2.5 py-1 bg-gradient-to-br from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                                          title="Sin ficha técnica"
                                          disabled
                                          style={{ fontFamily: 'var(--font-poppins)' }}
                                        >
                                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ pointerEvents: 'none' }}>
                                            <path d="M6 2C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V7.41421C19 7.149 18.8946 6.89464 18.7071 6.70711L13.2929 1.29289C13.1054 1.10536 12.851 1 12.5858 1H6Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
                                            <path d="M13 1V6H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            <text x="12" y="15" fontSize="6" fill="currentColor" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="0.3">PDF</text>
                                          </svg>
                                          <span style={{ pointerEvents: 'none' }}>PDF</span>
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                  {getPriceColumns.map((columna) => {
                                    const precioValue = formatPrice(isSelected ? (editRow[columna] || precio[columna]) : precio[columna]);
                                    return (
                                      <td key={columna} className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>
                                        {isSelected ? (
                                          <input
                                            type="number"
                                            step="0.01"
                                            value={precioValue.text ? precioValue.text.replace("S/.", "") : ""}
                                            onChange={(e) => handleEditField(codigo, columna, e.target.value)}
                                            className="w-20 px-2 py-1 border border-blue-300 rounded text-[10px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium"
                                            style={{ fontFamily: 'var(--font-poppins)', color: '#111827' }}
                                            placeholder="0.00"
                                          />
                                        ) : (
                                          <span className="text-gray-700">{precioValue.text}</span>
                                        )}
                                      </td>
                                    );
                                  })}
                                  <td className="px-3 py-2 whitespace-nowrap text-[10px] text-center">
                                    {textoCopiar ? (
                                      <button
                                        onClick={() => copyToClipboard(textoCopiar, globalIndex)}
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] ${copiedIndex === globalIndex
                                            ? "bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                                            : "bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                                          }`}
                                        title="Copiar texto al portapapeles"
                                        style={{ fontFamily: 'var(--font-poppins)' }}
                                      >
                                        {copiedIndex === globalIndex ? (
                                          <>
                                            <svg
                                              className="w-3.5 h-3.5"
                                              fill="currentColor"
                                              viewBox="0 0 20 20"
                                            >
                                              <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                              />
                                            </svg>
                                            Copiado
                                          </>
                                        ) : (
                                          <>
                                            <svg
                                              className="w-3.5 h-3.5"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                              />
                                            </svg>
                                            Copiar
                                          </>
                                        )}
                                      </button>
                                    ) : (
                                      <span className="text-gray-400">-</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

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
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modal para Crear/Actualizar */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => {
            setShowModal(false);
            setProductoBusqueda("");
            setSugerenciasProductos([]);
            setMostrarSugerencias(false);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-xl border border-gray-200/60 max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header con gradiente */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/60 bg-gradient-to-r from-blue-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#002D5A] to-[#002D5A] rounded-xl flex items-center justify-center text-white shadow-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                  Agregar Producto
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setProductoBusqueda("");
                  setSugerenciasProductos([]);
                  setMostrarSugerencias(false);
                }}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-all duration-200 text-gray-500 hover:text-gray-700 hover:scale-110 active:scale-95"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Contenido del formulario */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-4">
                {/* Nombre del Producto */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nombre del Producto
                  </label>
                  <div className="relative">
                    <input
                      ref={productoInputRef}
                      type="text"
                      value={productoBusqueda || formData.NOMBRE || ""}
                      onChange={(e) => {
                        const valor = e.target.value;
                        setProductoBusqueda(valor);
                        setFormData({ ...formData, NOMBRE: valor });
                        buscarProductos(valor);
                      }}
                      onFocus={handleProductoFocus}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#002D5A] focus:border-[#002D5A] focus:outline-none text-sm transition-all duration-200 bg-white text-gray-900 hover:border-gray-300"
                      required
                      placeholder="Escribe el nombre del producto..."
                    />
                    {buscandoProductos && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <svg className="animate-spin h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
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
                </div>

                {/* Código */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Código
                  </label>
                  <input
                    type="text"
                    value={formData.CODIGO || ""}
                    readOnly={true}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-600 cursor-not-allowed"
                    required
                  />
                  <input type="hidden" name="CODIGO" value={formData.CODIGO || ""} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Unidad de Medida Venta
                    </label>
                    <div className="relative">
                      <select
                        value={formData.UNIDAD_MEDIDA_VENTA || "UNIDAD"}
                        onChange={(e) => setFormData({ ...formData, UNIDAD_MEDIDA_VENTA: e.target.value })}
                        className="w-full px-4 py-2.5 pr-10 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#002D5A] focus:border-[#002D5A] focus:outline-none text-sm bg-white text-gray-900 transition-all duration-200 hover:border-blue-300 appearance-none cursor-pointer shadow-sm hover:shadow-md"
                        required
                      >
                        <option value="UNIDAD">UNIDAD</option>
                        <option value="DOCENA">DOCENA</option>
                        <option value="CAJA">CAJA</option>
                        <option value="PAR">PAR</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Cantidad Unidad Medida Venta
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.CANTIDAD_UNIDAD_MEDIDA_VENTA ?? ""}
                      onChange={(e) => {
                        const value = e.target.value === "" ? "" : parseFloat(e.target.value);
                        setFormData({ ...formData, CANTIDAD_UNIDAD_MEDIDA_VENTA: value });
                      }}
                      onBlur={(e) => {
                        if (e.target.value === "" || isNaN(parseFloat(e.target.value))) {
                          setFormData({ ...formData, CANTIDAD_UNIDAD_MEDIDA_VENTA: 1 });
                        }
                      }}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#002D5A] focus:border-[#002D5A] focus:outline-none text-sm bg-white text-gray-900 transition-all duration-200 hover:border-gray-300"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Precio Unidad Medida Venta
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.PRECIO_UNIDAD_MEDIDA_VENTA ?? ""}
                    onChange={(e) => {
                      const value = e.target.value === "" ? "" : parseFloat(e.target.value);
                      setFormData({ ...formData, PRECIO_UNIDAD_MEDIDA_VENTA: value });
                    }}
                    onBlur={(e) => {
                      if (e.target.value === "" || isNaN(parseFloat(e.target.value))) {
                        setFormData({ ...formData, PRECIO_UNIDAD_MEDIDA_VENTA: 0 });
                      }
                    }}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#002D5A] focus:border-[#002D5A] focus:outline-none text-sm bg-white text-gray-900 transition-all duration-200 hover:border-gray-300"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Unidad de Medida Caja
                    </label>
                    <div className="relative">
                      <select
                        value={formData.UNIDAD_MEDIDA_CAJA || "UNIDAD"}
                        onChange={(e) => setFormData({ ...formData, UNIDAD_MEDIDA_CAJA: e.target.value })}
                        className="w-full px-4 py-2.5 pr-10 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#002D5A] focus:border-[#002D5A] focus:outline-none text-sm bg-white text-gray-900 transition-all duration-200 hover:border-blue-300 appearance-none cursor-pointer shadow-sm hover:shadow-md"
                        required
                      >
                        <option value="UNIDAD">UNIDAD</option>
                        <option value="DOCENA">DOCENA</option>
                        <option value="CAJA">CAJA</option>
                        <option value="PAR">PAR</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Cantidad en Caja
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.CANTIDAD_CAJA ?? ""}
                      onChange={(e) => {
                        const value = e.target.value === "" ? "" : parseFloat(e.target.value);
                        setFormData({ ...formData, CANTIDAD_CAJA: value });
                      }}
                      onBlur={(e) => {
                        if (e.target.value === "" || isNaN(parseFloat(e.target.value))) {
                          setFormData({ ...formData, CANTIDAD_CAJA: 0 });
                        }
                      }}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#002D5A] focus:border-[#002D5A] focus:outline-none text-sm bg-white text-gray-900 transition-all duration-200 hover:border-gray-300"
                    />
                  </div>
                </div>

                {/* Campos Dinámicos de Precios */}
                {getPriceColumns.length > 0 && (
                  <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-bold text-[#002D5A] mb-4 uppercase tracking-wider">
                      Precios por Rango
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {getPriceColumns.map((columna) => (
                        <div key={columna}>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">
                            {columna.replace(/_/g, ' ')}
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData[columna] ?? ""}
                            onChange={(e) => {
                              const value = e.target.value === "" ? "" : parseFloat(e.target.value);
                              setFormData({ ...formData, [columna]: value });
                            }}
                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm bg-white text-gray-900 transition-all duration-200 shadow-sm"
                            placeholder="0.00"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Texto a copiar */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Texto a copiar
                  </label>
                  <textarea
                    value={formData.TEXTO_COPIAR || formData.texto_copiar || formData.textoCopiar || ""}
                    onChange={(e) => setFormData({ ...formData, TEXTO_COPIAR: e.target.value, texto_copiar: e.target.value, textoCopiar: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#002D5A] focus:border-[#002D5A] focus:outline-none text-sm bg-white text-gray-900 transition-all duration-200 hover:border-gray-300 resize-y"
                    placeholder="Escribe el texto que se copiará para este producto..."
                  />
                </div>
              </div>
            </div>

            {/* Footer con botones */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200/60 bg-gray-50/50">
              <button
                onClick={() => {
                  setShowModal(false);
                  setProductoBusqueda("");
                  setSugerenciasProductos([]);
                  setMostrarSugerencias(false);
                }}
                className="px-5 py-2.5 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 text-sm shadow-sm"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 bg-gradient-to-br from-[#002D5A] to-[#002D5A] hover:from-[#1a56e6] hover:to-[#1a56e6] text-white rounded-lg font-semibold transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Guardando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Agregar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Error */}
      {showErrorModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowErrorModal(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-xl border border-gray-200/60 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/60">
              <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                Error
              </h3>
              <button
                onClick={() => setShowErrorModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>
                {errorMessage}
              </p>
            </div>
            <div className="flex items-center justify-end px-6 py-4 border-t border-gray-200/60">
              <button
                onClick={() => setShowErrorModal(false)}
                className="px-6 py-2.5 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-semibold transition-all duration-200 text-sm shadow-sm hover:shadow-md flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
