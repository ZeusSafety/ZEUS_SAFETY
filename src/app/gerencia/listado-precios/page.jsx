"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/context/AuthContext";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";

export default function ListadoPreciosPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("MALVINAS");
  const [preciosData, setPreciosData] = useState({}); // Almacenar datos de todas las tablas
  const [loadingAll, setLoadingAll] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50); // 50 elementos por página
  const [tablasDisponibles, setTablasDisponibles] = useState([
    { value: "MALVINAS", label: "Malvinas", disponible: true },
    { value: "PROVINCIA", label: "Provincia", disponible: true },
    { value: "JICAMARCA", label: "Jicamarca", disponible: false },
    { value: "ONLINE", label: "Online", disponible: false },
    { value: "FERRETERIA", label: "Ferretería", disponible: true },
    { value: "CLIENTES_FINALES", label: "Clientes Finales", disponible: true },
  ]);

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

  // Mapeo de valores internos a valores de API
  const getApiId = (tablaId) => {
    const mapping = {
      "MALVINAS": "MALVINAS",
      "PROVINCIA": "PROVINCIA",
      "JICAMARCA": "JICAMARCA",
      "ONLINE": "ONLINE",
      "FERRETERIA": "Ferretería",
      "CLIENTES_FINALES": "Clientes finales"
    };
    return mapping[tablaId] || tablaId;
  };

  // Función para obtener precios de una tabla específica
  const fetchPrecios = useCallback(async (tablaId) => {
    try {
      // Obtener token
      let token = localStorage.getItem("token") || 
                  (user?.token || user?.accessToken || user?.access_token) || 
                  sessionStorage.getItem("token");
      
      if (!token) {
        router.push("/login");
        throw new Error("Token no encontrado. Por favor, inicie sesión.");
      }
      
      // Convertir el ID interno al formato que espera la API
      const apiId = getApiId(tablaId);
      
      // Usar el endpoint proxy de Next.js
      const apiUrl = `/api/franja-precios?id=${encodeURIComponent(apiId)}`;
      
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
        
        const errorData = await response.json().catch(() => ({ error: `Error ${response.status}` }));
        const errorMessage = errorData.error || errorData.message || errorData.details || `Error ${response.status}`;
        
        if (errorData.error === "token expirado" || errorMessage.toLowerCase().includes("token expirado")) {
          localStorage.removeItem("token");
          router.push("/login");
          throw new Error("token expirado");
        }
        
        throw new Error(errorMessage);
      }
      
      // Parsear respuesta JSON directamente
      const data = await response.json();
      
      // La API devuelve un array directamente con todos los campos incluidos
      // La nueva API (franja_precios) ya incluye: CODIGO, NOMBRE, CANTIDAD_CAJA, 
      // FICHA_TECNICA_ENLACE, TEXTO_COPIAR, y campos dinámicos de precio (CAJA 1, DOCENA 1, etc.)
      const preciosArray = Array.isArray(data) ? data : 
                          (data?.data && Array.isArray(data.data) ? data.data : []);
      
      return preciosArray;
    } catch (err) {
      // Solo mostrar error si no es un error esperado de tabla sin datos
      const errorMessage = err.message || "";
      const isExpectedError = errorMessage.includes("'PRECIO'") || 
                             errorMessage.includes("PRECIO") ||
                             errorMessage.includes("No hay datos") ||
                             errorMessage.includes("no existe");
      
      if (!isExpectedError) {
        console.error(`Error al obtener precios para ${tablaId}:`, err.message);
      }
      
      return [];
    }
  }, [user, router]);

  // Cargar todos los datos al entrar a la página
  useEffect(() => {
    const loadAllData = async () => {
      if (!user) return;
      
      setLoadingAll(true);
      setError(null);
      
      try {
        // Intentar cargar datos de TODAS las tablas para verificar cuáles tienen datos
        // Esto permite habilitar automáticamente las que tengan datos
        const promises = tablasDisponibles.map(async (tabla) => {
          const data = await fetchPrecios(tabla.value);
          return { tabla: tabla.value, data };
        });
        
        const results = await Promise.all(promises);
        
        // Almacenar todos los datos en el estado
        const newPreciosData = {};
        results.forEach(({ tabla, data }) => {
          newPreciosData[tabla] = data;
        });
        
        // Log para verificar qué tablas tienen datos y estructura de los datos
        console.log("=== DATOS CARGADOS POR TABLA ===");
        Object.keys(newPreciosData).forEach(tabla => {
          const cantidad = newPreciosData[tabla]?.length || 0;
          console.log(`${tabla}: ${cantidad} productos`);
          // Mostrar estructura del primer registro para debugging
          if (newPreciosData[tabla] && newPreciosData[tabla].length > 0) {
            console.log(`Estructura del primer registro de ${tabla}:`, Object.keys(newPreciosData[tabla][0]));
            const primerRegistro = newPreciosData[tabla][0];
            // Buscar todos los campos relacionados con ficha técnica
            const fichaKeys = Object.keys(primerRegistro).filter(key => 
              key.toUpperCase().includes('FICHA') || 
              key.toUpperCase().includes('PDF') || 
              key.toUpperCase().includes('ENLACE') ||
              key.toUpperCase().includes('URL')
            );
            console.log(`📋 Ejemplo de registro completo de ${tabla}:`, primerRegistro);
            console.log(`🔑 Todas las keys del registro:`, Object.keys(primerRegistro));
            if (fichaKeys.length > 0) {
              console.log(`✅ Campos relacionados con ficha técnica encontrados:`, fichaKeys);
              fichaKeys.forEach(key => {
                console.log(`   ${key}:`, primerRegistro[key]);
              });
            } else {
              console.log(`⚠️ NO se encontraron campos de ficha técnica en ${tabla}`);
              console.log(`💡 El procedimiento CONFIGURACION_FRANJA_PRECIOS debe incluir P.FICHA_TECNICA_ENLACE en el SELECT`);
            }
          }
        });
        console.log("=================================");
        
        setPreciosData(newPreciosData);
        
        // Habilitar automáticamente todas las tablas que tengan datos
        setTablasDisponibles(prev => 
          prev.map(tabla => {
            const tieneDatos = newPreciosData[tabla.value] && newPreciosData[tabla.value].length > 0;
            return {
              ...tabla,
              disponible: tieneDatos
            };
          })
        );
        
        // Si la tabla activa no tiene datos, cambiar a la primera disponible
        const activeTabData = newPreciosData[activeTab];
        if (!activeTabData || activeTabData.length === 0) {
          const primeraDisponible = tablasDisponibles.find(
            tabla => newPreciosData[tabla.value] && newPreciosData[tabla.value].length > 0
          );
          if (primeraDisponible) {
            setActiveTab(primeraDisponible.value);
          }
        }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, fetchPrecios]);

  // Obtener precios de la tabla activa
  const precios = preciosData[activeTab] || [];

  // Obtener columnas de precio dinámicamente basadas en los datos reales de la API
  const getPriceColumns = useMemo(() => {
    if (precios.length === 0) return [];
    
    // Campos que NO son columnas de precio según la estructura real de la BD
    const excludedFields = [
      'index', 'ID', 'id', 'CODIGO', 'codigo', 'NOMBRE', 'nombre', 'PRODUCTO', 'producto',
      'CANTIDAD_UNIDAD_MEDIDA_VENTA', 'cantidad_unidad_medida_venta',
      'UNIDAD_MEDIDA_VENTA', 'unidad_medida_venta',
      'UNIDAD_MEDIDA_CAJA', 'unidad_medida_caja',
      'CANTIDAD_CAJA', 'cantidad_caja', 'CANTIDAD_EN_CAJA', 'cantidad_en_caja',
      'FICHA_TECNICA_ENLACE', 'ficha_tecnica_enlace', 'FICHA_TECNICA', 'ficha_tecnica',
      'TEXTO_COPIAR', 'texto_copiar', 'textoCopiar'
    ];
    
    // Obtener todas las keys del primer registro
    const firstRecord = precios[0];
    const allKeys = Object.keys(firstRecord);
    
    // Filtrar solo las columnas de precio
    // La nueva API devuelve campos dinámicos como "CAJA 1", "DOCENA 1", "PAR 1", "UNIDAD 1"
    // que son numéricos y no están en la lista de excluidos
    const priceColumns = allKeys
      .filter(key => {
        const keyUpper = key.toUpperCase();
        // Excluir campos de configuración de la BD
        if (excludedFields.some(excluded => keyUpper.includes(excluded.toUpperCase()))) {
          return false;
        }
        
        const value = firstRecord[key];
        // Incluir campos que sean numéricos (precios dinámicos)
        // O campos que contengan PRECIO y sean numéricos
        const isNumeric = typeof value === 'number' || 
                         (!isNaN(parseFloat(value)) && value !== null && value !== '');
        
        // Incluir si es numérico o contiene palabras clave de precio
        if (isNumeric) {
          // Verificar que no sea un ID u otro campo numérico que no sea precio
          if (keyUpper.includes('ID') || keyUpper.includes('CANTIDAD')) {
            return false;
          }
          return true;
        }
        
        // También incluir campos que contengan PRECIO
        if (keyUpper.includes('PRECIO')) {
          return isNumeric;
        }
        
        return false;
      })
      .sort((a, b) => {
        // Ordenar: primero CAJA, luego DOCENA, luego PAR, luego UNIDAD
        const aUpper = a.toUpperCase();
        const bUpper = b.toUpperCase();
        
        const getOrder = (str) => {
          if (str.includes('CAJA')) return 1;
          if (str.includes('DOCENA')) return 2;
          if (str.includes('PAR')) return 3;
          if (str.includes('UNIDAD')) return 4;
          return 5;
        };
        
        const orderA = getOrder(aUpper);
        const orderB = getOrder(bUpper);
        
        if (orderA !== orderB) return orderA - orderB;
        
        // Si mismo tipo, ordenar por número
        const numA = parseInt(a.match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.match(/\d+/)?.[0] || '0');
        return numA - numB;
      });
    
    return priceColumns;
  }, [precios]);

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
      } catch (e) {
        console.error("Error al copiar:", e);
      }
      document.body.removeChild(textArea);
    }
  };

  // Filtrar precios basándose en el término de búsqueda
  const preciosFiltrados = useMemo(() => {
    if (!searchTerm.trim()) {
      return precios;
    }

    const term = searchTerm.toLowerCase().trim();
    return precios.filter((precio) => {
      // Función helper para obtener el valor de un campo
      const getField = (variations) => {
        for (const variation of variations) {
          if (precio[variation] !== undefined && precio[variation] !== null && precio[variation] !== "") {
            return String(precio[variation]).toLowerCase();
          }
        }
        return "";
      };

      const codigo = getField(["CODIGO", "codigo"]);
      const producto = getField(["NOMBRE", "nombre", "PRODUCTO", "producto"]);

      return codigo.includes(term) || producto.includes(term);
    });
  }, [precios, searchTerm]);

  // Calcular paginación
  const totalPages = Math.ceil(preciosFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const preciosPaginados = preciosFiltrados.slice(startIndex, endIndex);

  // Resetear a página 1 cuando cambia el filtro o la tabla
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab]);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <div className="flex h-screen overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className={`flex-1 transition-all duration-300 overflow-y-auto h-full ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
          <div className="p-4 lg:p-8">
            {/* Header con botón Volver y Título */}
            <div className="mb-6 flex items-center gap-3 flex-wrap">
              <button
                onClick={() => router.push("/gerencia")}
                className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Volver
              </button>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Listado de Precios</h1>
            </div>

            {/* Tabs/Pestañas */}
            <div className="mb-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 p-2">
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
                            setSearchTerm(""); // Limpiar búsqueda al cambiar de tab
                          }
                        }}
                        disabled={isDisabled}
                        className={`
                          px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200
                          ${isActive 
                            ? "bg-blue-700 text-white shadow-md" 
                            : isDisabled
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-sm"
                          }
                          ${!isDisabled && !isActive ? "hover:border-blue-300" : ""}
                        `}
                      >
                        <div className="flex items-center gap-2">
                          <span>{tabla.label}</span>
                          {hasData && !isActive && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
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
            </div>

            {/* Contenedor principal */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6 mb-6">
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {loadingAll ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
                  <span className="ml-3 text-gray-600 mt-4">Cargando todas las clasificaciones...</span>
                </div>
              ) : precios.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No hay datos disponibles para esta clasificación.</p>
                </div>
              ) : (
                <>
                  {/* Buscador */}
                  <div className="mb-4">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Buscar por código o nombre de producto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2.5 pl-10 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 transition-all duration-200 hover:border-blue-300 bg-white"
                      />
                      <svg
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm("")}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      {searchTerm && (
                        <p className="text-xs text-gray-500">
                          Mostrando {preciosFiltrados.length} de {precios.length} productos
                        </p>
                      )}
                      <div className="flex items-center gap-2 ml-auto">
                        <label className="text-xs font-semibold text-gray-700">Elementos por página:</label>
                        <div className="relative">
                          <select
                            value={itemsPerPage}
                            onChange={(e) => {
                              setItemsPerPage(Number(e.target.value));
                              setCurrentPage(1);
                            }}
                            className="px-4 py-2 border-2 border-gray-300 rounded-lg text-xs font-semibold text-gray-900 bg-white hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md appearance-none pr-8 min-w-[80px]"
                          >
                            <option value={25} className="bg-white text-gray-900 py-2 font-medium">25</option>
                            <option value={50} className="bg-white text-gray-900 py-2 font-medium">50</option>
                            <option value={100} className="bg-white text-gray-900 py-2 font-medium">100</option>
                            <option value={200} className="bg-white text-gray-900 py-2 font-medium">200</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {preciosFiltrados.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No se encontraron productos que coincidan con "{searchTerm}"</p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden mb-6">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-blue-700 border-b-2 border-blue-800">
                              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                                CÓDIGO
                              </th>
                              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                                PRODUCTO
                              </th>
                              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                                CANTIDAD EN CAJA
                              </th>
                              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                                FICHA TÉCNICA
                              </th>
                              {getPriceColumns.map((columna) => (
                                <th 
                                  key={columna}
                                  className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap"
                                >
                                  {columna.replace(/_/g, ' ')}
                                </th>
                              ))}
                              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                                ACCIONES
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {preciosPaginados.map((precio, index) => {
                              const globalIndex = startIndex + index;
                          // Función helper para obtener el valor de un campo con múltiples variaciones
                          const getField = (variations) => {
                            for (const variation of variations) {
                              if (precio[variation] !== undefined && precio[variation] !== null && precio[variation] !== "") {
                                return precio[variation];
                              }
                            }
                            return null;
                          };

                          // Función helper para formatear precio y verificar si es 0
                          // Manejar NaN, null, undefined, y valores numéricos
                          const formatPrice = (value) => {
                            if (value === null || value === undefined || value === "" || value === "NaN") return { text: "-", isZero: false };
                            if (typeof value === "number" && isNaN(value)) return { text: "-", isZero: false };
                            const num = parseFloat(value);
                            if (isNaN(num)) return { text: "-", isZero: false };
                            return { text: `S/.${num.toFixed(2)}`, isZero: num === 0 };
                          };

                          // Mapeo de campos según la estructura de la nueva API (franja_precios)
                          const codigo = getField(["CODIGO", "codigo"]);
                          const producto = getField(["NOMBRE", "nombre", "PRODUCTO", "producto"]);
                          
                          // CANTIDAD_CAJA viene directamente de la API como "UNIDAD 10", "CAJA 1", etc.
                          const cantidadCaja = getField(["CANTIDAD_CAJA", "cantidad_caja", "CANTIDAD_EN_CAJA", "cantidad_en_caja"]) || "-";
                          
                          // Ficha técnica viene directamente de la API (franja_precios)
                          // Buscar primero con getField, luego buscar manualmente en todas las keys del objeto
                          let fichaTecnica = getField([
                            "FICHA_TECNICA_ENLACE", "ficha_tecnica_enlace", 
                            "FICHA_TECNICA", "ficha_tecnica",
                            "FICHA_TECNICA_URL", "ficha_tecnica_url",
                            "PDF", "pdf", "PDF_URL", "pdf_url",
                            "ENLACE_FICHA", "enlace_ficha",
                            "URL_FICHA", "url_ficha",
                            "P.FICHA_TECNICA_ENLACE", "p.ficha_tecnica_enlace"
                          ]);
                          
                          // Si no se encontró, buscar manualmente en todas las keys del objeto
                          if (!fichaTecnica || fichaTecnica === "" || fichaTecnica === null) {
                            const allKeys = Object.keys(precio);
                            const fichaKey = allKeys.find(key => {
                              const keyUpper = key.toUpperCase();
                              return keyUpper.includes('FICHA') || 
                                     keyUpper.includes('PDF') || 
                                     (keyUpper.includes('ENLACE') && !keyUpper.includes('TEXTO')) ||
                                     (keyUpper.includes('URL') && !keyUpper.includes('IMG'));
                            });
                            if (fichaKey) {
                              fichaTecnica = precio[fichaKey];
                              // Log para debugging
                              if (globalIndex === 0) {
                                console.log(`🔍 Ficha técnica encontrada en campo: ${fichaKey} = ${fichaTecnica}`);
                              }
                            }
                          }
                          const textoCopiar = getField(["TEXTO_COPIAR", "texto_copiar", "TEXTO_COPIAR", "textoCopiar"]);

                          return (
                            <tr key={globalIndex} className="hover:bg-slate-200 transition-colors">
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">
                                {codigo || "-"}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                                {producto || "-"}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                                {cantidadCaja || "-"}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-center">
                                {fichaTecnica && fichaTecnica !== "" && fichaTecnica !== null && fichaTecnica !== undefined ? (
                                  <a
                                    href={fichaTecnica}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                                    title="Abrir ficha técnica en nueva pestaña"
                                  >
                                    <svg
                                      className="w-3.5 h-3.5"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                    PDF
                                  </a>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              {getPriceColumns.map((columna) => {
                                const precioValue = formatPrice(precio[columna]);
                                return (
                                  <td 
                                    key={columna}
                                    className={`px-3 py-2 whitespace-nowrap text-[10px] ${precioValue.isZero ? "text-red-600 font-semibold" : "text-gray-700"}`}
                                  >
                                    {precioValue.text}
                                  </td>
                                );
                              })}
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-center">
                                {textoCopiar ? (
                                  <button
                                    onClick={() => copyToClipboard(textoCopiar, globalIndex)}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md ${
                                      copiedIndex === index
                                        ? "bg-green-600 hover:bg-green-700 text-white"
                                        : "bg-blue-600 hover:bg-blue-700 text-white"
                                    }`}
                                    title="Copiar texto al portapapeles"
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
                      
                      {/* Controles de Paginación */}
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
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

