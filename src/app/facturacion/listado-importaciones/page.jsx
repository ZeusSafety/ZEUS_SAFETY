"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/context/AuthContext";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";
import Modal from "../../../components/ui/Modal";

export default function ListadoImportacionesFacturacionPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFinal, setFechaFinal] = useState("");
  const [numeroDespacho, setNumeroDespacho] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [facturaciones, setFacturaciones] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const [isVerModalOpen, setIsVerModalOpen] = useState(false);
  const [isEditarModalOpen, setIsEditarModalOpen] = useState(false);
  const [selectedFacturacion, setSelectedFacturacion] = useState(null);
  const [editForm, setEditForm] = useState({
    observaciones: "",
    estadoVerificacion: "",
    estadoDespacho: "",
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

  // Función para obtener datos de la API
  const fetchFacturaciones = useCallback(async () => {
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
      
      console.log("Fetching facturaciones with token:", token.substring(0, 20) + "...");
      console.log("API URL:", "https://importaciones2026-2946605267.us-central1.run.app?facturacion=facturacion");
      
      const apiUrl = "https://importaciones2026-2946605267.us-central1.run.app?facturacion=facturacion";
      
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
      
      // Mapear los datos de la API al formato esperado para facturación
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
            
            // Log para debuggear el campo PDF
            if (index === 0) {
              console.log("=== DEBUG PDF FIELD ===");
              console.log("Sample item keys:", Object.keys(item));
              console.log("Sample item (complete):", item);
              console.log("PDF field found (raw):", item.archivo_pdf || item.archivoPdf || item.ARCHIVO_PDF || item.pdf_url || item.pdfUrl || item.PDF_URL || item.solucion_pdf || item.solucionPdf || item.SOLUCION_PDF);
              console.log("PDF field found (normalized):", pdfField);
              console.log("All PDF-related fields:", {
                archivo_pdf: item.archivo_pdf,
                archivoPdf: item.archivoPdf,
                ARCHIVO_PDF: item.ARCHIVO_PDF,
                pdf_url: item.pdf_url,
                pdfUrl: item.pdfUrl,
                PDF_URL: item.PDF_URL,
                solucion_pdf: item.solucion_pdf,
                solucionPdf: item.solucionPdf,
                SOLUCION_PDF: item.SOLUCION_PDF,
                pdf: item.pdf,
                PDF: item.PDF,
                url: item.url,
                URL: item.URL,
                link: item.link,
                LINK: item.LINK
              });
              // Buscar cualquier campo que contenga "pdf" o "url" en su nombre
              const pdfRelatedKeys = Object.keys(item).filter(key => 
                key.toLowerCase().includes('pdf') || 
                key.toLowerCase().includes('url') || 
                key.toLowerCase().includes('link') ||
                key.toLowerCase().includes('archivo') ||
                key.toLowerCase().includes('solucion')
              );
              console.log("Keys containing 'pdf', 'url', 'link', 'archivo', or 'solucion':", pdfRelatedKeys);
              pdfRelatedKeys.forEach(key => {
                console.log(`  ${key}:`, item[key]);
              });
              console.log("=== END DEBUG ===");
            }
            
            return {
              id: item.id || item.ID || index + 1,
              fechaRegistro: item.fecha_registro || item.fechaRegistro || item.FECHA_REGISTRO || "",
              numeroDespacho: item.numero_despacho || item.numeroDespacho || item.NUMERO_DESPACHO || "",
              fechaIncidencias: item.fecha_incidencias || item.fechaIncidencias || item.FECHA_INCIDENCIAS || item.incidencia_registro || item.incidenciaRegistro || item.INCIDENCIA_REGISTRO || "",
              incidencias: item.incidencias === true || item.incidencias === "SI" || item.INCIDENCIAS === "SI" || false,
              estadoVerificacion: item.estado_verificacion || item.estadoVerificacion || item.ESTADO_VERIFICACION || "",
              estadoDespacho: item.estado_despacho || item.estadoDespacho || item.ESTADO_DESPACHO || "",
              fechaRegistroCompleto: item.fecha_registro_completo || item.fechaRegistroCompleto || item.FECHA_REGISTRO_COMPLETO || item.fecha_registro_completa || item.fechaRegistroCompleta || item.FECHA_REGISTRO_COMPLETA || "",
              observaciones: item.observaciones || item.OBSERVACIONES || "",
              archivoPdf: pdfField,
            };
          })
        : [];
      
      console.log("Mapped data (first item):", mappedData[0]);
      setFacturaciones(mappedData);
    } catch (err) {
      console.error("Error al obtener facturaciones:", err);
      setError(err instanceof Error ? err.message : "Error al cargar los datos");
    } finally {
      setLoadingData(false);
    }
  }, [router]);

  useEffect(() => {
    if (user && !loading) {
      console.log("User authenticated, fetching facturaciones...");
      try {
        fetchFacturaciones();
      } catch (err) {
        console.error("Error calling fetchFacturaciones:", err);
        setError("Error al iniciar la carga de datos");
        setLoadingData(false);
      }
    }
  }, [user, loading, fetchFacturaciones]);

  if (loading) {
    return (
        <div className="flex min-h-screen items-center justify-center" style={{ background: '#F7FAFF' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E63F7]"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Filtrado automático del lado del cliente
  const [filteredFacturaciones, setFilteredFacturaciones] = useState([]);

  useEffect(() => {
    let filtered = [...facturaciones];

    // Filtrar por número de despacho (búsqueda parcial, case insensitive)
    if (numeroDespacho.trim() !== "") {
      filtered = filtered.filter((item) => {
        const despacho = item.numeroDespacho || item.numero_despacho || item.NUMERO_DESPACHO || "";
        return despacho.toString().toUpperCase().includes(numeroDespacho.toUpperCase());
      });
    }

    // Filtrar por rango de fechas
    if (fechaInicio.trim() !== "") {
      const partsInicio = fechaInicio.split("/");
      if (partsInicio.length === 3) {
        const fechaInicioDate = new Date(parseInt(partsInicio[2]), parseInt(partsInicio[1]) - 1, parseInt(partsInicio[0]));
        filtered = filtered.filter((item) => {
          const fechaReg = item.fechaRegistro || item.fecha_registro || item.FECHA_REGISTRO || "";
          if (!fechaReg) return false;
          const itemDate = new Date(fechaReg);
          return itemDate >= fechaInicioDate;
        });
      }
    }

    if (fechaFinal.trim() !== "") {
      const partsFinal = fechaFinal.split("/");
      if (partsFinal.length === 3) {
        const fechaFinalDate = new Date(parseInt(partsFinal[2]), parseInt(partsFinal[1]) - 1, parseInt(partsFinal[0]));
        filtered = filtered.filter((item) => {
          const fechaReg = item.fechaRegistro || item.fecha_registro || item.FECHA_REGISTRO || "";
          if (!fechaReg) return false;
          const itemDate = new Date(fechaReg);
          return itemDate <= fechaFinalDate;
        });
      }
    }

    setFilteredFacturaciones(filtered);
    setCurrentPage(1); // Resetear a la primera página cuando se filtra
  }, [facturaciones, fechaInicio, fechaFinal, numeroDespacho]);

  const handleProcedimiento = () => {
    console.log("Procedimiento");
  };

  const totalPages = Math.ceil(filteredFacturaciones.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentFacturaciones = filteredFacturaciones.slice(startIndex, endIndex);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F7FAFF' }}>
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
              onClick={() => router.push("/facturacion")}
              className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-lg font-medium hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm ripple-effect relative overflow-hidden text-sm group"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver a Facturación</span>
            </button>

            {/* Card contenedor blanco */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">
              {/* Header */}
              <div className="mb-4 flex items-center justify-start">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] rounded-lg flex items-center justify-center text-white shadow-sm">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h1 className="text-xl font-bold text-gray-900">Listado de Importaciones</h1>
                </div>
              </div>

              {/* Filtros */}
              <div className="mb-4 grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="relative">
                  <label className="block text-xs font-bold text-gray-800 mb-2">Fecha Inicio</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="dd/mm/aaaa"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                      className="w-full px-0 py-2 text-sm border-0 border-b-2 border-gray-300 bg-transparent focus:outline-none focus:ring-0 focus:border-[#1E63F7] transition-colors placeholder:text-gray-400 rounded-none"
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
                      className="w-full px-0 py-2 text-sm border-0 border-b-2 border-gray-300 bg-transparent focus:outline-none focus:ring-0 focus:border-[#1E63F7] transition-colors placeholder:text-gray-400 rounded-none"
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
                <div className="flex items-end gap-2.5">
                  <button
                    onClick={handleProcedimiento}
                    className="px-4 py-2.5 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] text-white rounded-lg font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center space-x-1.5 text-sm whitespace-nowrap"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Procedimiento</span>
                  </button>
                </div>
              </div>

              {/* Tabla */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#1E63F7] border-b-2 border-blue-800">
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ID</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">FECHA REGISTRO</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">N° DESPACHO</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">SOLUCIÓN PDF</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">FECHA DE INCIDENCIAS</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">INCIDENCIAS</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ESTADO DE VERIFICACIÓN</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ESTADO DE DESPACHO</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">FECHA DE REGISTRO</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">OBSERVACIONES</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {loadingData ? (
                        <tr>
                          <td colSpan={11} className="px-3 py-8 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1E63F7]"></div>
                              <span className="text-sm text-gray-600">Cargando datos...</span>
                            </div>
                          </td>
                        </tr>
                      ) : error ? (
                        <tr>
                          <td colSpan={11} className="px-3 py-8 text-center">
                            <div className="flex flex-col items-center justify-center space-y-2">
                              <span className="text-sm text-red-600 font-semibold">Error al cargar los datos</span>
                              <span className="text-xs text-gray-500">{error}</span>
                              <button
                                onClick={fetchFacturaciones}
                                className="mt-2 px-4 py-2 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] text-white rounded-lg text-xs font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md"
                              >
                                Reintentar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : currentFacturaciones.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="px-3 py-8 text-center">
                            <span className="text-sm text-gray-500">No se encontraron facturaciones</span>
                          </td>
                        </tr>
                      ) : (
                        currentFacturaciones.map((facturacion) => (
                        <tr key={facturacion.id} className="hover:bg-slate-200 transition-colors" onClick={(e) => {
                          // Prevenir que el clic en la fila interfiera
                          const target = e.target;
                          if (target.closest('.pdf-button-container')) {
                            return;
                          }
                        }}>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{facturacion.id}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{facturacion.fechaRegistro}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] font-bold text-gray-700">{facturacion.numeroDespacho}</td>
                          <td className="px-3 py-2 whitespace-nowrap relative" style={{ pointerEvents: 'auto' }}>
                            {facturacion.archivoPdf && facturacion.archivoPdf.trim() !== "" ? (
                              <div 
                                className="pdf-button-container inline-flex items-center space-x-1 px-2.5 py-1 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  e.nativeEvent.stopImmediatePropagation();
                                  const url = facturacion.archivoPdf;
                                  console.log("PDF clicked, URL:", url);
                                  
                                  if (!url || url.trim() === "") {
                                    alert("No hay enlace PDF disponible");
                                    return;
                                  }
                                  
                                  // Solo abrir en nueva pestaña, nunca cambiar la pestaña actual
                                  window.open(url, "_blank", "noopener,noreferrer");
                                }}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  e.nativeEvent.stopImmediatePropagation();
                                }}
                                onMouseUp={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  e.nativeEvent.stopImmediatePropagation();
                                }}
                                onTouchStart={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  e.nativeEvent.stopImmediatePropagation();
                                  const url = facturacion.archivoPdf;
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
                                    const url = facturacion.archivoPdf;
                                    if (url && url.trim() !== "") {
                                      window.open(url, "_blank", "noopener,noreferrer");
                                    }
                                  }
                                }}
                              >
                                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ pointerEvents: 'none' }}>
                                  <path d="M6 2C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V7.41421C19 7.149 18.8946 6.89464 18.7071 6.70711L13.2929 1.29289C13.1054 1.10536 12.851 1 12.5858 1H6Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
                                  <path d="M13 1V6H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                  <text x="12" y="15" fontSize="6" fill="currentColor" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="0.3">PDF</text>
                                </svg>
                                <span style={{ pointerEvents: 'none' }}>PDF</span>
                              </div>
                            ) : (
                              <button
                                className="inline-flex items-center space-x-1 px-2.5 py-1 bg-gradient-to-br from-gray-400 to-gray-500 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                                disabled
                                title="Sin archivo PDF"
                              >
                                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ pointerEvents: 'none' }}>
                                  <path d="M6 2C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V7.41421C19 7.149 18.8946 6.89464 18.7071 6.70711L13.2929 1.29289C13.1054 1.10536 12.851 1 12.5858 1H6Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
                                  <path d="M13 1V6H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                  <text x="12" y="15" fontSize="6" fill="currentColor" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="0.3">PDF</text>
                                </svg>
                                <span style={{ pointerEvents: 'none' }}>PDF</span>
                              </button>
                            )}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{facturacion.fechaIncidencias || "-"}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border-2 ${
                              facturacion.incidencias 
                                ? "bg-red-600 border-red-700 text-white" 
                                : "bg-green-600 border-green-700 text-white"
                            }`}>
                              {facturacion.incidencias ? "SI" : "NO"}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{facturacion.estadoVerificacion || "-"}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {facturacion.estadoDespacho && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border-2 bg-green-600 border-green-700 text-white">
                                {facturacion.estadoDespacho}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{facturacion.fechaRegistroCompleto || "-"}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <button
                              onClick={() => {
                                setSelectedFacturacion(facturacion);
                                setIsVerModalOpen(true);
                              }}
                              className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] text-white rounded-full text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <button
                              onClick={() => {
                                setSelectedFacturacion(facturacion);
                                setEditForm({
                                  observaciones: facturacion.observaciones || "",
                                  estadoVerificacion: facturacion.estadoVerificacion || "",
                                  estadoDespacho: facturacion.estadoDespacho || "",
                                });
                                setIsEditarModalOpen(true);
                              }}
                              className="flex items-center space-x-1 px-3 py-1.5 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                              <span>Editar</span>
                            </button>
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
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    &lt;
                  </button>
                  <span className="text-[10px] text-gray-700 font-medium">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
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
        </main>
      </div>

      {/* Modal Ver Facturación */}
      <Modal
        isOpen={isVerModalOpen}
        onClose={() => {
          setIsVerModalOpen(false);
          setSelectedFacturacion(null);
        }}
        title={`Detalles de Facturación - ${selectedFacturacion?.numeroDespacho || ""}`}
        size="lg"
      >
        {selectedFacturacion && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">N° Despacho</label>
                <p className="text-sm text-gray-900">{selectedFacturacion.numeroDespacho}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha de Registro</label>
                <p className="text-sm text-gray-900">{selectedFacturacion.fechaRegistroCompleto || "-"}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Estado de Verificación</label>
                <p className="text-sm text-gray-900">{selectedFacturacion.estadoVerificacion || "-"}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Estado de Despacho</label>
                <p className="text-sm text-gray-900">{selectedFacturacion.estadoDespacho || "-"}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Incidencia</label>
                <p className="text-sm text-gray-900">{selectedFacturacion.incidencias || "NO"}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha de Incidencias</label>
                <p className="text-sm text-gray-900">{selectedFacturacion.fechaIncidencias || "-"}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Observaciones</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">
                {selectedFacturacion.observaciones || "Sin observaciones"}
              </p>
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

      {/* Modal Editar Facturación */}
      <Modal
        isOpen={isEditarModalOpen}
        onClose={() => {
          setIsEditarModalOpen(false);
          setSelectedFacturacion(null);
        }}
        title={`Editar Facturación - ${selectedFacturacion?.numeroDespacho || ""}`}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Estado de Verificación</label>
            <select
              value={editForm.estadoVerificacion}
              onChange={(e) => setEditForm({ ...editForm, estadoVerificacion: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="">Seleccionar estado</option>
              <option value="PENDIENTE">PENDIENTE</option>
              <option value="VERIFICADO">VERIFICADO</option>
              <option value="RECHAZADO">RECHAZADO</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Estado de Despacho</label>
            <select
              value={editForm.estadoDespacho}
              onChange={(e) => setEditForm({ ...editForm, estadoDespacho: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="">Seleccionar estado</option>
              <option value="PENDIENTE">PENDIENTE</option>
              <option value="EN PROCESO">EN PROCESO</option>
              <option value="DESPACHADO">DESPACHADO</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Observaciones</label>
            <textarea
              value={editForm.observaciones}
              onChange={(e) => setEditForm({ ...editForm, observaciones: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
              placeholder="Ingrese observaciones..."
            />
          </div>
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setIsEditarModalOpen(false);
                setSelectedFacturacion(null);
              }}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                console.log("Guardar cambios:", editForm);
                alert("Funcionalidad de guardado pendiente de implementar");
                setIsEditarModalOpen(false);
              }}
              className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] hover:shadow-md hover:scale-105 rounded-lg transition-all duration-200 shadow-sm"
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

