"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/context/AuthContext";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";

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
  const [itemsPerPage, setItemsPerPage] = useState(50);
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

  const fetchPrecios = useCallback(async (tablaId) => {
    try {
      let token = localStorage.getItem("token") || 
                  (user?.token || user?.accessToken || user?.access_token) || 
                  sessionStorage.getItem("token");
      
      if (!token) {
        router.push("/login");
        throw new Error("Token no encontrado. Por favor, inicie sesión.");
      }
      
      const apiId = getApiId(tablaId);
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
        // Para errores 401, solo lanzar error sin redirigir inmediatamente
        // La redirección se manejará solo si TODAS las peticiones fallan
        if (response.status === 401) {
          throw new Error("token expirado");
        }
        
        // Para errores 500, retornar array vacío (tabla sin datos o error del servidor)
        if (response.status === 500) {
          return [];
        }
        
        const errorData = await response.json().catch(() => ({ error: `Error ${response.status}` }));
        const errorMessage = errorData.error || errorData.message || errorData.details || `Error ${response.status}`;
        
        // Solo redirigir si es explícitamente un error de token expirado
        if (errorData.error === "token expirado" || errorMessage.toLowerCase().includes("token expirado")) {
          throw new Error("token expirado");
        }
        
        // Para otros errores, retornar array vacío
        return [];
      }
      
      const data = await response.json();
      const preciosArray = Array.isArray(data) ? data : 
                          (data?.data && Array.isArray(data.data) ? data.data : []);
      
      return preciosArray;
    } catch (err) {
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

  useEffect(() => {
    let isMounted = true;
    let timeoutId;
    
    const loadAllData = async () => {
      if (!user || loading) return;
      
      setLoadingAll(true);
      setError(null);
      
      // Timeout de seguridad: si tarda más de 30 segundos, detener la carga
      timeoutId = setTimeout(() => {
        if (isMounted) {
          setLoadingAll(false);
          setError("La carga está tardando demasiado. Por favor, recarga la página.");
        }
      }, 30000);
      
      let hasTokenError = false;
      
      try {
        // Usar las tablas iniciales, no las del estado que pueden cambiar
        const tablasIniciales = [
          { value: "MALVINAS", label: "Malvinas", disponible: true },
          { value: "PROVINCIA", label: "Provincia", disponible: true },
          { value: "JICAMARCA", label: "Jicamarca", disponible: false },
          { value: "ONLINE", label: "Online", disponible: false },
          { value: "FERRETERIA", label: "Ferretería", disponible: true },
          { value: "CLIENTES_FINALES", label: "Clientes Finales", disponible: true },
        ];
        
        // Solo cargar las tablas que están marcadas como disponibles inicialmente
        const tablasACargar = tablasIniciales.filter(t => t.disponible);
        
        const promises = tablasACargar.map(async (tabla) => {
          try {
            const data = await fetchPrecios(tabla.value);
            return { tabla: tabla.value, data, error: null };
          } catch (err) {
            // Si es error de token, marcar para redirigir después
            if (err.message && err.message.includes("token expirado")) {
              hasTokenError = true;
            }
            return { tabla: tabla.value, data: [], error: err.message };
          }
        });
        
        const results = await Promise.allSettled(promises);
        
        if (!isMounted) {
          clearTimeout(timeoutId);
          return;
        }
        
        clearTimeout(timeoutId);
        
        const newPreciosData = {};
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            const { tabla, data } = result.value;
            newPreciosData[tabla] = data;
          } else {
            // Si falló la promesa, usar el valor de la tabla correspondiente
            const tabla = tablasACargar[index].value;
            newPreciosData[tabla] = [];
          }
        });
        
        // Si hay error de token en todas las peticiones, redirigir al login
        const allTokenErrors = results.every(r => 
          r.status === 'fulfilled' && r.value.error && r.value.error.includes("token expirado")
        );
        
        if (hasTokenError && allTokenErrors) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }
        
        setPreciosData(newPreciosData);
        
        // Actualizar disponibilidad de tablas
        setTablasDisponibles(prev => 
          prev.map(tabla => {
            const tieneDatos = newPreciosData[tabla.value] && newPreciosData[tabla.value].length > 0;
            return { ...tabla, disponible: tieneDatos };
          })
        );
        
        // Si la tabla activa no tiene datos, cambiar a la primera disponible
        const activeTabData = newPreciosData[activeTab];
        if (!activeTabData || activeTabData.length === 0) {
          const primeraDisponible = tablasIniciales.find(
            tabla => newPreciosData[tabla.value] && newPreciosData[tabla.value].length > 0
          );
          if (primeraDisponible && isMounted) {
            setActiveTab(primeraDisponible.value);
          }
        }
      } catch (err) {
        if (!isMounted) {
          clearTimeout(timeoutId);
          return;
        }
        clearTimeout(timeoutId);
        console.error("Error al cargar datos:", err);
        // Solo mostrar error si no es un error de token (que ya se maneja arriba)
        if (!err.message || !err.message.includes("token expirado")) {
          setError("Error al cargar algunos datos. Algunas tablas pueden no estar disponibles.");
        }
        setLoadingAll(false);
      } finally {
        if (isMounted) {
          clearTimeout(timeoutId);
          setLoadingAll(false);
        }
      }
    };

    if (!loading && user) {
      loadAllData();
    }
    
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [user, loading]); // Solo user y loading como dependencias

  const precios = preciosData[activeTab] || [];

  const getPriceColumns = useMemo(() => {
    if (precios.length === 0) return [];
    
    const excludedFields = [
      'index', 'ID', 'id', 'CODIGO', 'codigo', 'NOMBRE', 'nombre', 'PRODUCTO', 'producto',
      'CANTIDAD_CAJA', 'cantidad_caja', 'CANTIDAD_EN_CAJA', 'cantidad_en_caja',
      'FICHA_TECNICA_ENLACE', 'ficha_tecnica_enlace', 'FICHA_TECNICA', 'ficha_tecnica',
      'TEXTO_COPIAR', 'texto_copiar', 'textoCopiar'
    ];
    
    const firstRecord = precios[0];
    const allKeys = Object.keys(firstRecord);
    
    const priceColumns = allKeys
      .filter(key => {
        const keyUpper = key.toUpperCase();
        return !excludedFields.some(excluded => keyUpper.includes(excluded.toUpperCase())) &&
               (typeof firstRecord[key] === 'number' || 
                (!isNaN(parseFloat(firstRecord[key])) && firstRecord[key] !== null && firstRecord[key] !== ''));
      })
      .sort((a, b) => {
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
        
        const numA = parseInt(a.match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.match(/\d+/)?.[0] || '0');
        return numA - numB;
      });
    
    return priceColumns;
  }, [precios]);

  const preciosFiltrados = useMemo(() => {
    if (!searchTerm.trim()) {
      return precios;
    }

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

      const codigo = getField(["CODIGO", "codigo"]);
      const producto = getField(["NOMBRE", "nombre", "PRODUCTO", "producto"]);

      return codigo.includes(term) || producto.includes(term);
    });
  }, [precios, searchTerm]);

  const totalPages = Math.ceil(preciosFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const preciosPaginados = preciosFiltrados.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab]);

  const handleAgregar = () => {
    // TODO: Implementar modal/formulario para agregar nuevo producto
    alert("Función de agregar producto - Pendiente de implementar");
  };

  const handleActualizar = (precio) => {
    // TODO: Implementar modal/formulario para actualizar producto
    console.log("Actualizar producto:", precio);
    alert("Función de actualizar producto - Pendiente de implementar");
  };

  const handleEliminar = async (precio) => {
    if (!confirm("¿Está seguro de que desea eliminar este producto?")) {
      return;
    }

    // TODO: Implementar llamada a API para eliminar
    console.log("Eliminar producto:", precio);
    alert("Función de eliminar producto - Pendiente de implementar");
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <div className="flex h-screen overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className={`flex-1 transition-all duration-300 overflow-y-auto h-full ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
          <div className="p-4 lg:p-8">
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
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Gestión de Precios</h1>
            </div>

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
                            setSearchTerm("");
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
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                            <option value={200}>200</option>
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
                              <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
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

                              const formatPrice = (value) => {
                                if (value === null || value === undefined || value === "" || value === "NaN") return { text: "-", isZero: false };
                                if (typeof value === "number" && isNaN(value)) return { text: "-", isZero: false };
                                const num = parseFloat(value);
                                if (isNaN(num)) return { text: "-", isZero: false };
                                return { text: `S/.${num.toFixed(2)}`, isZero: num === 0 };
                              };

                              const codigo = getField(["CODIGO", "codigo"]);
                              const producto = getField(["NOMBRE", "nombre", "PRODUCTO", "producto"]);
                              const cantidadCaja = getField(["CANTIDAD_CAJA", "cantidad_caja", "CANTIDAD_EN_CAJA", "cantidad_en_caja"]);
                              const fichaTecnica = getField(["FICHA_TECNICA_ENLACE", "ficha_tecnica_enlace", "FICHA_TECNICA", "ficha_tecnica"]);

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
                                    {fichaTecnica ? (
                                      <a
                                        href={fichaTecnica}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
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
                                    <div className="flex items-center justify-center gap-1.5">
                                      <button
                                        onClick={() => handleActualizar(precio)}
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                                        title="Actualizar"
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Actualizar
                                      </button>
                                      <button
                                        onClick={() => handleEliminar(precio)}
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                                        title="Eliminar"
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Eliminar
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="bg-slate-200 px-3 py-2 flex items-center justify-between border-t-2 border-slate-300">
                        <button
                          onClick={handleAgregar}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Agregar
                        </button>
                        <div className="flex items-center gap-2">
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

