"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/context/AuthContext";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";

export default function ListadoPreciosPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedTabla, setSelectedTabla] = useState("MALVINAS");
  const [precios, setPrecios] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState(null);
  const [tablasDisponibles, setTablasDisponibles] = useState([
    { value: "MALVINAS", label: "Malvinas", disponible: true },
    { value: "PROVINCIA", label: "Provincia", disponible: true },
    { value: "JICAMARCA", label: "Jicamarca", disponible: false },
    { value: "ONLINE", label: "Online", disponible: false },
    { value: "FERRETERIA", label: "Ferretería", disponible: false },
    { value: "CLIENTES_FINALES", label: "Clientes Finales", disponible: false },
    { value: "COPIA_FERRETERIA", label: "Copia de Ferretería", disponible: false },
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

  // Función para obtener precios de la API
  const fetchPrecios = useCallback(async (tablaId) => {
    try {
      setLoadingData(true);
      setError(null);
      
      // Obtener token de múltiples fuentes posibles
      let token = localStorage.getItem("token");
      
      // Si no hay token en localStorage, intentar obtenerlo del usuario autenticado
      if (!token && user) {
        // Algunas implementaciones guardan el token en el objeto user
        token = user.token || user.accessToken || user.access_token;
      }
      
      // Si aún no hay token, verificar si hay un token en sessionStorage
      if (!token) {
        token = sessionStorage.getItem("token");
      }
      
      // Usar el endpoint proxy de Next.js para evitar problemas de CORS
      const apiUrl = `/api/franja-precios?id=${tablaId}`;
      
      const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
      };
      
      if (token && token.trim() !== "") {
        headers["Authorization"] = `Bearer ${token}`;
        console.log("✓ Token encontrado y enviado (primeros 20 caracteres):", token.substring(0, 20) + "...");
        console.log("✓ Longitud del token:", token.length);
      } else {
        console.error("❌ NO SE ENCONTRÓ TOKEN EN NINGUNA FUENTE");
        console.error("localStorage token:", localStorage.getItem("token"));
        console.error("sessionStorage token:", sessionStorage.getItem("token"));
        console.error("user object:", user);
        console.warn("⚠️ La API puede requerir autenticación. Redirigiendo al login...");
        router.push("/login");
        throw new Error("Token no encontrado. Por favor, inicie sesión.");
      }
      
      console.log("Fetching precios from:", apiUrl);
      console.log("Headers enviados:", { ...headers, Authorization: token ? `Bearer ${token.substring(0, 20)}...` : "No token" });
      
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: headers,
      });
      
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        // Manejar específicamente el error 401 (token expirado)
        if (response.status === 401) {
          // Limpiar token expirado
          localStorage.removeItem("token");
          // Redirigir al login
          router.push("/login");
          throw new Error("token expirado");
        }
        
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorData.details || errorMessage;
          
          // Si el error indica token expirado, redirigir al login
          if (errorData.error === "token expirado" || errorMessage.toLowerCase().includes("token expirado") || errorMessage.toLowerCase().includes("unauthorized")) {
            localStorage.removeItem("token");
            router.push("/login");
            throw new Error("token expirado");
          }
        } catch (parseError) {
          // Si no se puede parsear como JSON, intentar leer como texto
          try {
            const errorText = await response.text();
            if (errorText) {
              errorMessage = errorText;
            }
          } catch (textError) {
            console.error("Error al leer respuesta de error:", textError);
          }
        }
        throw new Error(errorMessage);
      }
      
      let data;
      const contentType = response.headers.get("content-type");
      
      if (contentType && contentType.includes("application/json")) {
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error("Error al parsear JSON:", jsonError);
          // Intentar leer como texto y parsear manualmente
          const textData = await response.text();
          try {
            data = JSON.parse(textData);
          } catch (parseError) {
            console.error("Error al parsear respuesta:", parseError);
            throw new Error("La respuesta no es un JSON válido");
          }
        }
      } else {
        const textData = await response.text();
        console.log("Respuesta recibida (primeros 500 caracteres):", textData.substring(0, 500));
        console.log("¿Es HTML?:", textData.trim().startsWith('<'));
        
        // Si es HTML, intentar extraer JSON
        if (textData.trim().startsWith('<')) {
          console.warn("⚠️ La respuesta es HTML, intentando extraer JSON...");
          
          // Intentar múltiples estrategias para extraer JSON del HTML
          let jsonExtracted = false;
          
          // Estrategia 1: Buscar array JSON completo
          const arrayMatch = textData.match(/\[[\s\S]*?\{[\s\S]*?"CODIGO"[\s\S]*?\}[\s\S]*?\]/);
          if (arrayMatch) {
            try {
              data = JSON.parse(arrayMatch[0]);
              console.log("✓ JSON extraído del HTML en el frontend");
              jsonExtracted = true;
            } catch (e) {
              console.log("✗ No se pudo parsear JSON extraído del HTML");
            }
          }
          
          // Estrategia 2: Buscar desde el primer [ hasta el último ]
          if (!jsonExtracted) {
            const firstBracket = textData.indexOf('[');
            const lastBracket = textData.lastIndexOf(']');
            if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
              try {
                const potentialJson = textData.substring(firstBracket, lastBracket + 1);
                if (potentialJson.includes('"CODIGO"')) {
                  data = JSON.parse(potentialJson);
                  console.log("✓ JSON extraído del body HTML");
                  jsonExtracted = true;
                }
              } catch (e) {
                console.log("✗ No se pudo parsear JSON del body");
              }
            }
          }
          
          if (!jsonExtracted) {
            console.error("✗ No se pudo extraer JSON del HTML");
            throw new Error("La API devolvió HTML en lugar de JSON. No se pudo extraer JSON del HTML.");
          }
        } else {
          // No es HTML, intentar parsear como JSON
          try {
            data = JSON.parse(textData);
          } catch (parseError) {
            console.error("Error al parsear respuesta:", parseError);
            console.error("Texto completo (primeros 1000 caracteres):", textData.substring(0, 1000));
            throw new Error("La respuesta no es un JSON válido");
          }
        }
      }
      
      console.log("Datos recibidos de la API:", data);
      console.log("Tipo de datos:", typeof data);
      console.log("Es array:", Array.isArray(data));
      
      // La API puede devolver un array o un objeto
      let preciosArray = [];
      if (Array.isArray(data)) {
        preciosArray = data;
      } else if (data.data && Array.isArray(data.data)) {
        preciosArray = data.data;
      } else if (data.precios && Array.isArray(data.precios)) {
        preciosArray = data.precios;
      } else if (data.results && Array.isArray(data.results)) {
        preciosArray = data.results;
      } else if (data.records && Array.isArray(data.records)) {
        preciosArray = data.records;
      } else if (typeof data === 'object' && data !== null) {
        // Si es un objeto, verificar si tiene propiedades que sean arrays
        const keys = Object.keys(data);
        console.log("Keys del objeto:", keys);
        
        // Buscar el primer array en el objeto
        for (const key of keys) {
          if (Array.isArray(data[key])) {
            preciosArray = data[key];
            break;
          }
        }
        
        // Si no encontramos un array, intentar convertir el objeto en array
        if (preciosArray.length === 0) {
          // Si el objeto tiene estructura de filas (como un objeto con índices numéricos)
          const values = Object.values(data);
          if (values.length > 0 && typeof values[0] === 'object') {
            preciosArray = values;
          }
        }
      }
      
      console.log("Precios procesados:", preciosArray);
      console.log("Cantidad de registros:", preciosArray.length);
      
      setPrecios(preciosArray);
    } catch (err) {
      console.error("Error al obtener precios:", err);
      console.error("Error completo:", {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
      
      // Mostrar un mensaje de error más descriptivo
      let errorMessage = err.message || "Error al cargar los precios";
      
      // Si el error menciona JSON, proporcionar más contexto
      if (errorMessage.includes("JSON") || errorMessage.includes("json")) {
        errorMessage = "La API no devolvió datos en formato JSON válido. Por favor, verifique la conexión o contacte al administrador.";
      }
      
      setError(errorMessage);
      setPrecios([]);
    } finally {
      setLoadingData(false);
    }
  }, []);

  // Cargar precios cuando cambia la tabla seleccionada
  useEffect(() => {
    if (selectedTabla) {
      fetchPrecios(selectedTabla);
    }
  }, [selectedTabla, fetchPrecios]);

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
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
          <div className="p-4 lg:p-8">
            {/* Título y controles */}
            <div className="mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Listado de Precios</h1>
                
                {/* Selector de Tabla */}
                <div className="flex items-center gap-3">
                  <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                    Seleccionar Tabla:
                  </label>
                  <select
                    value={selectedTabla}
                    onChange={(e) => setSelectedTabla(e.target.value)}
                    className="px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 transition-all duration-200 hover:border-blue-300 bg-white min-w-[200px]"
                  >
                    {tablasDisponibles.map((tabla) => (
                      <option 
                        key={tabla.value} 
                        value={tabla.value}
                        disabled={!tabla.disponible}
                        className={!tabla.disponible ? "text-gray-400" : ""}
                      >
                        {tabla.label} {!tabla.disponible ? "(Próximamente)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Contenedor principal */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {loadingData ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
                  <span className="ml-3 text-gray-600">Cargando precios...</span>
                </div>
              ) : precios.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No hay datos disponibles para esta tabla.</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
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
                            1 CAJA
                          </th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                            5 CAJAS
                          </th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                            10 CAJAS
                          </th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                            20 CAJAS
                          </th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                            PAR 1
                          </th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                            PAR 5
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {precios.map((precio, index) => {
                          // Función helper para obtener el valor de un campo con múltiples variaciones
                          const getField = (variations) => {
                            for (const variation of variations) {
                              if (precio[variation] !== undefined && precio[variation] !== null && precio[variation] !== "") {
                                return precio[variation];
                              }
                            }
                            return null;
                          };

                          // Función helper para formatear precio
                          // Manejar NaN, null, undefined, y valores numéricos
                          const formatPrice = (value) => {
                            if (value === null || value === undefined || value === "" || value === "NaN") return "-";
                            if (typeof value === "number" && isNaN(value)) return "-";
                            const num = parseFloat(value);
                            return isNaN(num) ? "-" : `S/.${num.toFixed(2)}`;
                          };

                          // Mapeo de campos según la estructura real de la API
                          // Estructura: CODIGO, NOMBRE, CANTIDAD_CAJA, CAJA 1, CAJA 5, CAJA 10, CAJA 20, PAR 1, PAR 5
                          const codigo = getField(["CODIGO", "codigo"]);
                          const producto = getField(["NOMBRE", "nombre", "PRODUCTO", "producto"]);
                          const cantidadCaja = getField(["CANTIDAD_CAJA", "cantidad_caja", "CANTIDAD_EN_CAJA", "cantidad_en_caja"]);
                          
                          // Campos de cajas - la API usa "CAJA 1", "CAJA 5", "CAJA 10", "CAJA 20" (con espacios)
                          const caja1 = getField(["CAJA 1", "CAJA_1", "caja 1"]);
                          const caja5 = getField(["CAJA 5", "CAJA_5", "caja 5"]);
                          const caja10 = getField(["CAJA 10", "CAJA_10", "caja 10"]);
                          const caja20 = getField(["CAJA 20", "CAJA_20", "caja 20"]);
                          
                          // Campos de pares - para productos que se venden por par
                          const par1 = getField(["PAR 1", "PAR_1", "par 1"]);
                          const par5 = getField(["PAR 5", "PAR_5", "par 5"]);

                          return (
                            <tr key={index} className="hover:bg-slate-200 transition-colors">
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">
                                {codigo || "-"}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                                {producto || "-"}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                                {cantidadCaja || "-"}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                                {formatPrice(caja1)}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                                {formatPrice(caja5)}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                                {formatPrice(caja10)}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                                {formatPrice(caja20)}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                                {formatPrice(par1)}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                                {formatPrice(par5)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

