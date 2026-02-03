"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../components/context/AuthContext";
import { Header } from "../../../../components/layout/Header";
import { Sidebar } from "../../../../components/layout/Sidebar";

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
  const itemsPerPage = 10; // 10 elementos por página
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

  // Mapeo de valores internos a valores de API (el API route ya hace la conversión a Malvinas_online, etc.)
  const getApiId = (tablaId) => {
    // El API route convierte estos valores a los nombres correctos del backend
    return tablaId;
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

      // 🔍 LOG: Datos recibidos de la API
      console.log("🔍 [FRONTEND] ===== DATOS RECIBIDOS DE LA API =====");
      console.log("🔍 [FRONTEND] Tipo de data:", typeof data);
      console.log("🔍 [FRONTEND] Es array?", Array.isArray(data));
      console.log("🔍 [FRONTEND] Data completa:", data);

      // La API devuelve un array directamente con todos los campos incluidos
      // La nueva API (franja_precios) ya incluye: CODIGO, NOMBRE, CANTIDAD_CAJA, 
      // FICHA_TECNICA_ENLACE, TEXTO_COPIAR, y campos dinámicos de precio (CAJA 1, DOCENA 1, etc.)
      const preciosArray = Array.isArray(data) ? data :
        (data?.data && Array.isArray(data.data) ? data.data : []);

      console.log("🔍 [FRONTEND] PreciosArray procesado - Total:", preciosArray.length);

      if (preciosArray.length > 0) {
        console.log("🔍 [FRONTEND] Primer registro completo:", preciosArray[0]);
        console.log("🔍 [FRONTEND] Claves del primer registro:", Object.keys(preciosArray[0]));

        // Mostrar solo campos de precio
        const primerRegistro = preciosArray[0];
        const camposPrecio = Object.keys(primerRegistro).filter(key => {
          const keyUpper = key.toUpperCase();
          return !['ID', 'CODIGO', 'NOMBRE', 'PRODUCTO', 'CANTIDAD_CAJA', 'CANTIDAD_EN_CAJA',
            'FICHA_TECNICA_ENLACE', 'TEXTO_COPIAR', 'MEDIDA', 'PRECIO'].includes(keyUpper) &&
            (keyUpper.includes('CAJA') || keyUpper.includes('DOCENA') ||
              keyUpper.includes('PAR') || keyUpper.includes('UNIDAD'));
        });

        console.log("🔍 [FRONTEND] Campos de precio encontrados:", camposPrecio);
        console.log("🔍 [FRONTEND] Valores de precios en primer registro:");
        camposPrecio.forEach(campo => {
          console.log(`  - ${campo}: ${primerRegistro[campo]} (tipo: ${typeof primerRegistro[campo]})`);
        });
      } else {
        console.warn("⚠️ [FRONTEND] No hay registros en preciosArray");
      }

      console.log("🔍 [FRONTEND] ===== FIN DATOS API =====");

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
        // JICAMARCA y ONLINE siempre están deshabilitados (próximamente)
        setTablasDisponibles(prev =>
          prev.map(tabla => {
            // JICAMARCA y ONLINE siempre están deshabilitados
            if (tabla.value === "JICAMARCA" || tabla.value === "ONLINE") {
              return {
                ...tabla,
                disponible: false
              };
            }
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

  // Obtener columnas de precio dinámicamente basadas en los datos reales de la API
  const getPriceColumns = useMemo(() => {
    // Obtener precios de la tabla activa
    const precios = preciosData[activeTab] || [];
    console.log("🔍 [FRONTEND-LISTADO] ===== DETECTANDO COLUMNAS DE PRECIO =====");
    console.log("🔍 [FRONTEND-LISTADO] Total de precios:", precios.length);

    if (precios.length === 0) {
      console.warn("⚠️ [FRONTEND-LISTADO] No hay precios, retornando array vacío");
      return [];
    }

    // Campos que NO son columnas de precio según la estructura real de la BD
    const excludedFields = [
      'index', 'ID', 'id', 'Codigo', 'codigo', 'CODIGO', 'Producto', 'producto', 'PRODUCTO',
      'CANTIDAD_UNIDAD_MEDIDA_VENTA', 'cantidad_unidad_medida_venta',
      'UNIDAD_MEDIDA_VENTA', 'unidad_medida_venta',
      'UNIDAD_MEDIDA_CAJA', 'unidad_medida_caja',
      'CANTIDAD_CAJA', 'cantidad_caja', 'CANTIDAD_EN_CAJA', 'cantidad_en_caja',
      'ficha_tecnica', 'FICHA_TECNICA', 'FICHA_TECNICA_ENLACE', 'ficha_tecnica_enlace',
      'texto_copiar', 'TEXTO_COPIAR', 'textoCopiar'
    ];

    // Obtener todas las keys del primer registro
    const firstRecord = precios[0];
    const allKeys = Object.keys(firstRecord);

    console.log("🔍 [FRONTEND-LISTADO] Primer registro:", firstRecord);
    console.log("🔍 [FRONTEND-LISTADO] Todas las claves disponibles:", allKeys);

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

        // Incluir campos de precio: Caja_1, Caja_5, Caja_10, Caja_20, Docena
        const value = firstRecord[key];
        const isNumeric = typeof value === 'number' ||
          (!isNaN(parseFloat(value)) && value !== null && value !== '');

        // Incluir campos que contengan Caja, Docena y sean numéricos
        if (keyUpper.includes('CAJA') || keyUpper.includes('DOCENA')) {
          return isNumeric;
        }

        return false;
      })
      .sort((a, b) => {
        // Ordenar: primero DOCENA, luego CAJA
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

        // Si mismo tipo, ordenar por número
        const numA = parseInt(a.match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.match(/\d+/)?.[0] || '0');
        return numA - numB;
      });

    console.log("🔍 [FRONTEND-LISTADO] Columnas de precio detectadas:", priceColumns);
    console.log("🔍 [FRONTEND-LISTADO] Valores de precios en primer registro:");
    priceColumns.forEach(col => {
      console.log(`  - ${col}: ${firstRecord[col]} (tipo: ${typeof firstRecord[col]})`);
    });
    console.log("🔍 [FRONTEND-LISTADO] ===== FIN DETECCIÓN COLUMNAS =====");

    return priceColumns;
  }, [preciosData, activeTab]);

  // Obtener precios de la tabla activa
  const precios = preciosData[activeTab] || [];

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

      const codigo = getField(["Codigo", "codigo", "CODIGO"]);
      const producto = getField(["Producto", "producto", "PRODUCTO"]);

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
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${sidebarOpen ? "lg:ml-60 ml-0" : "ml-0"}`}>
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 lg:p-8">
            {/* Botón Volver */}
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

            {/* Contenedor principal con fondo blanco */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6 mb-6">
              {/* Título con icono */}
              <div className="mb-6 flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#002D5A] to-[#002D5A] rounded-xl flex items-center justify-center text-white shadow-sm">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>Listado de Precios</h1>
                  <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: 'var(--font-poppins)' }}>
                    Consulta y gestiona los precios de productos por clasificación.
                  </p>
                </div>
              </div>

              {/* Tabs/Pestañas */}
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
                            setSearchTerm(""); // Limpiar búsqueda al cambiar de tab
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
                          ${!isDisabled && !isActive ? "hover:border-blue-300" : ""}
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
                  {/* Buscador y Botones */}
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
                              const fichaTecnica = getField(["ficha_tecnica", "FICHA_TECNICA", "FICHA_TECNICA_ENLACE"]) || "";
                              const textoCopiar = getField(["texto_copiar", "TEXTO_COPIAR"]) || "";
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
                                      const fichaTecnica = getField(["ficha_tecnica", "FICHA_TECNICA", "FICHA_TECNICA_ENLACE"]) || "-";
                                      const textoCopiar = getField(["texto_copiar", "TEXTO_COPIAR"]) || "-";
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
                                if (value === null || value === undefined || value === "" || value === "NaN") return { text: "", isZero: false };
                                if (typeof value === "number" && isNaN(value)) return { text: "", isZero: false };
                                const num = parseFloat(value);
                                if (isNaN(num)) return { text: "", isZero: false };
                                if (num === 0) return { text: "", isZero: true };
                                return { text: `S/.${num.toFixed(2)}`, isZero: false };
                              };

                              // Mapeo de campos según la estructura del nuevo backend
                              // El SP devuelve: Producto, Codigo, ficha_tecnica, Caja_1, Caja_5, Caja_10, Caja_20, Docena, texto_copiar
                              const codigo = getField(["Codigo", "codigo", "CODIGO"]);
                              const producto = getField(["Producto", "producto", "PRODUCTO"]);
                              const fichaTecnica = getField(["ficha_tecnica", "FICHA_TECNICA", "FICHA_TECNICA_ENLACE"]);
                              const textoCopiar = getField(["texto_copiar", "TEXTO_COPIAR", "textoCopiar"]);

                              return (
                                <tr key={globalIndex} className="hover:bg-blue-50 transition-colors border-b border-gray-100">
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
                                    const precioValue = formatPrice(precio[columna]);
                                    return (
                                      <td
                                        key={columna}
                                        className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700"
                                        style={{ fontFamily: 'var(--font-poppins)' }}
                                      >
                                        <span className="text-gray-700">{precioValue.text}</span>
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

                      {/* Controles de Paginación */}
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 flex items-center justify-between border-t border-gray-200">
                        <button
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1 || totalPages === 0}
                          className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                          aria-label="Primera página"
                          style={{ fontFamily: 'var(--font-poppins)' }}
                        >
                          «
                        </button>
                        <button
                          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                          disabled={currentPage === 1 || totalPages === 0}
                          className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                          aria-label="Página anterior"
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
                          aria-label="Página siguiente"
                          style={{ fontFamily: 'var(--font-poppins)' }}
                        >
                          &gt;
                        </button>
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages || totalPages === 0}
                          className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                          aria-label="Última página"
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
    </div>
  );
}
