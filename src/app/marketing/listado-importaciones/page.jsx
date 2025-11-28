"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/context/AuthContext";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";

export default function ListadoImportacionesMarketingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFinal, setFechaFinal] = useState("");
  const [numeroDespacho, setNumeroDespacho] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [importaciones, setImportaciones] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);

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

  // Función para obtener datos de la API
  const fetchImportaciones = useCallback(async () => {
    try {
      setLoadingData(true);
      setError(null);
      
      // Verificar que estamos en el cliente
      if (typeof window === "undefined") {
        throw new Error("Este código debe ejecutarse en el cliente");
      }
      
      // Obtener el token del localStorage
      const token = localStorage.getItem("token");
      
      if (!token || token.trim() === "") {
        throw new Error("No se encontró el token de autenticación. Por favor, inicia sesión nuevamente.");
      }
      
      console.log("Fetching importaciones marketing with token:", token.substring(0, 20) + "...");
      console.log("API URL:", "https://importaciones2026-2946605267.us-central1.run.app");
      
      const apiUrl = "https://importaciones2026-2946605267.us-central1.run.app";
      
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
      
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        // Si el token está caducado (401), redirigir al login
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.push("/login");
          return;
        }
        
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText || "No se pudieron obtener los datos"}`);
      }
      
      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error("La respuesta no es un JSON válido");
        }
      }
      
      console.log("Data received:", data);
      
      // Mapear los datos de la API al formato esperado para marketing
      const mappedData = Array.isArray(data) 
        ? data.map((item, index) => {
            // Buscar el campo PDF en todas las variaciones posibles
            let pdfField = item.archivo_pdf || item.archivoPdf || item.ARCHIVO_PDF || 
                           item.pdf_url || item.pdfUrl || item.PDF_URL || 
                           item.solucion_pdf || item.solucionPdf || item.SOLUCION_PDF ||
                           item.pdf || item.PDF || item.url_pdf || item.urlPdf || item.URL_PDF ||
                           item.link_pdf || item.linkPdf || item.LINK_PDF ||
                           item.documento_pdf || item.documentoPdf || item.DOCUMENTO_PDF ||
                           // Buscar en todos los campos que contengan "pdf" en el nombre
                           (() => {
                             const keys = Object.keys(item);
                             for (const key of keys) {
                               if (key.toLowerCase().includes('pdf') && item[key] && typeof item[key] === 'string' && item[key].trim() !== '') {
                                 return item[key];
                               }
                             }
                             return "";
                           })() || "";
            
            // Normalizar la URL del PDF
            if (pdfField && pdfField.trim() !== "") {
              // Si no empieza con http:// o https://, agregar https://
              if (!pdfField.startsWith("http://") && !pdfField.startsWith("https://")) {
                // Si empieza con //, agregar https:
                if (pdfField.startsWith("//")) {
                  pdfField = "https:" + pdfField;
                } 
                // Si empieza con /, es una ruta relativa - agregar el dominio base de la API
                else if (pdfField.startsWith("/")) {
                  pdfField = "https://importaciones2026-2946605267.us-central1.run.app" + pdfField;
                }
                // Si no tiene protocolo, agregar https://
                else {
                  pdfField = "https://" + pdfField;
                }
              }
            }
            
            return {
              id: item.id || item.ID || index + 1,
              fechaRegistro: item.fecha_registro || item.fechaRegistro || item.FECHA_REGISTRO || "",
              numeroDespacho: item.numero_despacho || item.numeroDespacho || item.NUMERO_DESPACHO || "",
              redactadoPor: item.redactado_por || item.redactadoPor || item.REDACTADO_POR || "",
              productos: item.productos || item.PRODUCTOS || "",
              fechaLlegada: item.fecha_llegada || item.fechaLlegada || item.FECHA_LLEGADA || "",
              fechaAlmacen: item.fecha_almacen || item.fechaAlmacen || item.FECHA_ALMACEN || "",
              estado: item.estado || item.ESTADO || "",
              fechaRecepcion: item.fecha_recepcion || item.fechaRecepcion || item.FECHA_RECEPCION || "",
              incidencias: item.incidencias === true || item.incidencias === "SI" || item.INCIDENCIAS === "SI" || false,
              fechaIncidencias: item.fecha_incidencias || item.fechaIncidencias || item.FECHA_INCIDENCIAS || item.incidencia_registro || item.incidenciaRegistro || item.INCIDENCIA_REGISTRO || "",
              archivoPdf: pdfField,
            };
          })
        : [];
      
      console.log("Mapped data (first item):", mappedData[0]);
      setImportaciones(mappedData);
    } catch (err) {
      console.error("Error al obtener importaciones:", err);
      setError(err instanceof Error ? err.message : "Error al cargar los datos");
    } finally {
      setLoadingData(false);
    }
  }, [router]);

  useEffect(() => {
    if (user && !loading) {
      console.log("User authenticated, fetching importaciones marketing...");
      try {
        fetchImportaciones();
      } catch (err) {
        console.error("Error calling fetchImportaciones:", err);
        setError("Error al iniciar la carga de datos");
        setLoadingData(false);
      }
    }
  }, [user, loading, fetchImportaciones]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleFiltrar = () => {
    // Recargar datos con filtros
    fetchImportaciones();
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(importaciones.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentImportaciones = importaciones.slice(startIndex, endIndex);

  const getEstadoBadge = (estado) => {
    const estados = {
      TRANSITO: "bg-yellow-500 border-2 border-yellow-600 text-white",
      ETA: "bg-green-600 border-2 border-green-700 text-white",
      RECIBIDO: "bg-blue-600 border-2 border-blue-700 text-white",
    };
    return estados[estado] || "bg-gray-600 border-2 border-gray-700 text-white";
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${
          sidebarOpen ? "lg:ml-60 ml-0" : "ml-0"
        }`}
      >
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto custom-scrollbar bg-slate-200">
          <div className="max-w-[95%] mx-auto px-4 py-4">
            {/* Botón Volver */}
            <button
              onClick={() => router.push("/marketing")}
              className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-blue-700 border-2 border-blue-800 text-white rounded-lg font-semibold hover:bg-blue-800 hover:border-blue-900 transition-all duration-200 shadow-md hover:shadow-lg ripple-effect relative overflow-hidden text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver</span>
            </button>

            {/* Card contenedor blanco */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">
              {/* Header */}
              <div className="mb-4 flex items-center justify-start">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center text-white border-2 border-blue-700/50 shadow-sm">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h1 className="text-xl font-bold text-gray-900">Listado de Importaciones</h1>
                </div>
              </div>

              {/* Filtros */}
              <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <label className="block text-xs font-bold text-gray-800 mb-2">Fecha Inicio</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="dd/mm/aaaa"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                      className="w-full px-0 py-2 text-sm border-0 border-b-2 border-gray-300 bg-transparent focus:outline-none focus:ring-0 focus:border-blue-500 transition-colors placeholder:text-gray-400 rounded-none"
                    />
                    <svg className="absolute right-0 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="relative">
                  <label className="block text-xs font-bold text-gray-800 mb-2">Fecha Final</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="dd/mm/aaaa"
                      value={fechaFinal}
                      onChange={(e) => setFechaFinal(e.target.value)}
                      className="w-full px-0 py-2 text-sm border-0 border-b-2 border-gray-300 bg-transparent focus:outline-none focus:ring-0 focus:border-blue-500 transition-colors placeholder:text-gray-400 rounded-none"
                    />
                    <svg className="absolute right-0 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="relative">
                  <label className="block text-xs font-bold text-gray-800 mb-2">N° de Despacho</label>
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={numeroDespacho}
                    onChange={(e) => setNumeroDespacho(e.target.value)}
                    className="w-full px-0 py-2 text-sm border-0 border-b-2 border-gray-300 bg-transparent focus:outline-none focus:ring-0 focus:border-blue-500 transition-colors placeholder:text-gray-400 rounded-none"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleFiltrar}
                    className="px-4 py-2.5 bg-blue-700 border-2 border-blue-800 hover:bg-blue-800 hover:border-blue-900 text-white rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center space-x-1.5 text-sm whitespace-nowrap"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    <span>Filtrar</span>
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
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">FECHA DE ALMACÉN</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ESTADO</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">FECHA RECEPCIÓN</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">INCIDENCIAS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {loadingData ? (
                        <tr>
                          <td colSpan={10} className="px-3 py-8 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700"></div>
                              <span className="text-sm text-gray-600">Cargando datos...</span>
                            </div>
                          </td>
                        </tr>
                      ) : error ? (
                        <tr>
                          <td colSpan={10} className="px-3 py-8 text-center">
                            <div className="flex flex-col items-center justify-center space-y-2">
                              <span className="text-sm text-red-600 font-semibold">Error al cargar los datos</span>
                              <span className="text-xs text-gray-500">{error}</span>
                              <button
                                onClick={fetchImportaciones}
                                className="mt-2 px-4 py-2 bg-blue-700 border-2 border-blue-800 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold transition-all duration-200"
                              >
                                Reintentar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : currentImportaciones.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="px-3 py-8 text-center">
                            <span className="text-sm text-gray-500">No se encontraron importaciones</span>
                          </td>
                        </tr>
                      ) : (
                        currentImportaciones.map((importacion) => (
                        <tr key={importacion.id} className="hover:bg-slate-100 transition-colors" onClick={(e) => {
                          const target = e.target;
                          if (target.closest('.pdf-button-container')) {
                            return;
                          }
                        }}>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{importacion.fechaRegistro}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] font-bold text-gray-700">{importacion.numeroDespacho}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{importacion.redactadoPor}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{importacion.productos}</td>
                          <td className="px-3 py-2 whitespace-nowrap relative" style={{ pointerEvents: 'auto' }}>
                            {importacion.archivoPdf && importacion.archivoPdf.trim() !== "" ? (
                              <div 
                                className="pdf-button-container inline-flex items-center space-x-1 px-2.5 py-1 bg-blue-700 border-2 border-blue-800 hover:bg-blue-800 hover:border-blue-900 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  e.nativeEvent?.stopImmediatePropagation();
                                  const url = importacion.archivoPdf;
                                  console.log("PDF clicked, URL:", url);
                                  
                                  if (!url || url.trim() === "") {
                                    alert("No hay enlace PDF disponible");
                                    return;
                                  }
                                  
                                  try {
                                    const newWindow = window.open(url, "_blank", "noopener,noreferrer");
                                    if (!newWindow || newWindow.closed || typeof newWindow.closed === "undefined") {
                                      window.location.href = url;
                                    }
                                  } catch (err) {
                                    console.error("Error opening PDF:", err);
                                    window.location.href = url;
                                  }
                                }}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  e.nativeEvent?.stopImmediatePropagation();
                                }}
                                onMouseUp={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  e.nativeEvent?.stopImmediatePropagation();
                                }}
                                onTouchStart={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  e.nativeEvent?.stopImmediatePropagation();
                                  const url = importacion.archivoPdf;
                                  if (url && url.trim() !== "") {
                                    window.open(url, "_blank", "noopener,noreferrer");
                                  }
                                }}
                                role="button"
                                tabIndex={0}
                                style={{ 
                                  position: 'relative', 
                                  zIndex: 9999, 
                                  pointerEvents: 'auto',
                                  userSelect: 'none',
                                  WebkitUserSelect: 'none'
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const url = importacion.archivoPdf;
                                    if (url && url.trim() !== "") {
                                      window.open(url, "_blank", "noopener,noreferrer");
                                    }
                                  }
                                }}
                              >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ pointerEvents: 'none' }}>
                                  <path d="M6 2C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V7.41421C19 7.149 18.8946 6.89464 18.7071 6.70711L13.2929 1.29289C13.1054 1.10536 12.851 1 12.5858 1H6Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                                  <path d="M13 1V6H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                  <text x="12" y="15" fontSize="6" fill="currentColor" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="0.3">PDF</text>
                                </svg>
                              </div>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-gray-400 border-2 border-gray-500 text-gray-500 rounded-lg text-[10px] font-semibold cursor-not-allowed opacity-50">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M6 2C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V7.41421C19 7.149 18.8946 6.89464 18.7071 6.70711L13.2929 1.29289C13.1054 1.10536 12.851 1 12.5858 1H6Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                                  <path d="M13 1V6H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                  <text x="12" y="15" fontSize="6" fill="currentColor" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="0.3">PDF</text>
                                </svg>
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{importacion.fechaLlegada}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{importacion.fechaAlmacen || "-"}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {importacion.estado && (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getEstadoBadge(importacion.estado)}`}>
                                {importacion.estado}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{importacion.fechaRecepcion || "-"}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold border ${
                              importacion.incidencias 
                                ? "bg-red-600 border-2 border-red-700 text-white" 
                                : "bg-green-600 border-2 border-green-700 text-white"
                            }`}>
                              {importacion.incidencias ? "SI" : "NO"}
                            </span>
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
                    className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    «
                  </button>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    &lt;
                  </button>
                  <span className="text-[10px] text-gray-700 font-medium">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    &gt;
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    »
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

