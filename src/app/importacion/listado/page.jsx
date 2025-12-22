"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/context/AuthContext";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";
import Modal from "../../../components/ui/Modal";

export default function ListadoImportacionesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFinal, setFechaFinal] = useState("");
  const [numeroDespacho, setNumeroDespacho] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedImportacion, setSelectedImportacion] = useState(null);
  const [updateForm, setUpdateForm] = useState({
    observaciones: "",
    estado: "",
    fechaAlmacen: "",
    fechaRecepcion: "",
  });

  // Datos ficticios de importaciones (memoizados para evitar recreación en cada render)
  const importaciones = useMemo(() => [
    {
      id: 1,
      fechaRegistro: "2025-11-19",
      numeroDespacho: "ZEUS50",
      redactadoPor: "KIMBERLY",
      productos: "GUANTES PETER",
      fechaLlegada: "2025-12-29",
      tipoCarga: "1 CONTENEDOR 40 HQ",
      fechaAlmacen: "",
      estado: "TRANSITO",
      canal: "",
      fechaRecepcion: "",
      incidencias: false,
    },
    {
      id: 2,
      fechaRegistro: "2025-10-10",
      numeroDespacho: "ZEUS47",
      redactadoPor: "KIMBERLY",
      productos: "GUANTES/PETER",
      fechaLlegada: "2025-11-16",
      tipoCarga: "1 CONTENEDOR 40 HQ",
      fechaAlmacen: "",
      estado: "ETA",
      canal: "ROJO",
      fechaRecepcion: "",
      incidencias: false,
    },
    {
      id: 3,
      fechaRegistro: "2025-09-30",
      numeroDespacho: "ZEUS42/ZEUS43/ZEUS49",
      redactadoPor: "HERVIN",
      productos: "ARNES/NITRON/CALIBRE",
      fechaLlegada: "2025-10-20",
      tipoCarga: "CONSOLIDADO",
      fechaAlmacen: "2025-10-29",
      estado: "ETA",
      canal: "AMARILLO",
      fechaRecepcion: "2025-10-29",
      incidencias: true,
    },
    {
      id: 4,
      fechaRegistro: "2025-09-30",
      numeroDespacho: "ZEUS44",
      redactadoPor: "HERVIN",
      productos: "GUANTES PITER",
      fechaLlegada: "2025-09-10",
      tipoCarga: "1 CONTENEDOR 40 HQ",
      fechaAlmacen: "2025-09-19",
      estado: "ETA",
      canal: "ROJO",
      fechaRecepcion: "2025-09-18",
      incidencias: true,
    },
    {
      id: 5,
      fechaRegistro: "2025-09-30",
      numeroDespacho: "ZEUS45",
      redactadoPor: "KIMBERLY",
      productos: "GUANTES PITER",
      fechaLlegada: "2025-10-15",
      tipoCarga: "1 CONTENEDOR 40 HQ",
      fechaAlmacen: "2025-10-27",
      estado: "ETA",
      canal: "ROJO",
      fechaRecepcion: "2025-10-27",
      incidencias: true,
    },
    {
      id: 6,
      fechaRegistro: "2025-09-30",
      numeroDespacho: "ZEUS46",
      redactadoPor: "KIMBERLY",
      productos: "GUANTES DE SEGURIDAD",
      fechaLlegada: "2025-10-13",
      tipoCarga: "1 CONTENEDOR 40 HQ",
      fechaAlmacen: "2025-10-23",
      estado: "ETA",
      canal: "AMARILLO",
      fechaRecepcion: "2025-10-24",
      incidencias: false,
    },
    {
      id: 7,
      fechaRegistro: "2025-08-15",
      numeroDespacho: "ZEUS41",
      redactadoPor: "HERVIN",
      productos: "CASCO SEGURIDAD",
      fechaLlegada: "2025-09-05",
      tipoCarga: "1 CONTENEDOR 40 HQ",
      fechaAlmacen: "2025-09-10",
      estado: "ETA",
      canal: "VERDE",
      fechaRecepcion: "2025-09-08",
      incidencias: true,
    },
    {
      id: 8,
      fechaRegistro: "2025-07-20",
      numeroDespacho: "ZEUS40",
      redactadoPor: "KIMBERLY",
      productos: "LENTES PROTECCION",
      fechaLlegada: "2025-08-10",
      tipoCarga: "CONSOLIDADO",
      fechaAlmacen: "2025-08-15",
      estado: "ETA",
      canal: "AMARILLO",
      fechaRecepcion: "2025-08-12",
      incidencias: true,
    },
  ], []);

  // Filtrado automático
  const [filteredImportaciones, setFilteredImportaciones] = useState([]);

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

  // Filtrado automático
  useEffect(() => {
    let filtered = [...importaciones];

    // Filtrar por número de despacho (búsqueda parcial, case insensitive)
    if (numeroDespacho.trim() !== "") {
      filtered = filtered.filter((item) =>
        (item.numeroDespacho || "").toUpperCase().includes(numeroDespacho.toUpperCase())
      );
    }

    // Filtrar por rango de fechas
    if (fechaInicio.trim() !== "") {
      // Convertir fecha de formato dd/mm/aaaa a Date para comparación
      const partsInicio = fechaInicio.split("/");
      if (partsInicio.length === 3) {
        const fechaInicioDate = new Date(parseInt(partsInicio[2]), parseInt(partsInicio[1]) - 1, parseInt(partsInicio[0]));
        filtered = filtered.filter((item) => {
          if (!item.fechaRegistro) return false;
          const itemDate = new Date(item.fechaRegistro);
          return itemDate >= fechaInicioDate;
        });
      }
    }

    if (fechaFinal.trim() !== "") {
      const partsFinal = fechaFinal.split("/");
      if (partsFinal.length === 3) {
        const fechaFinalDate = new Date(parseInt(partsFinal[2]), parseInt(partsFinal[1]) - 1, parseInt(partsFinal[0]));
        filtered = filtered.filter((item) => {
          if (!item.fechaRegistro) return false;
          const itemDate = new Date(item.fechaRegistro);
          return itemDate <= fechaFinalDate;
        });
      }
    }

    setFilteredImportaciones(filtered);
    setCurrentPage(1); // Resetear a la primera página cuando se filtra
  }, [importaciones, fechaInicio, fechaFinal, numeroDespacho]);

  const totalPages = Math.ceil(filteredImportaciones.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentImportaciones = filteredImportaciones.slice(startIndex, endIndex);

  const getEstadoBadge = (estado) => {
    const estados = {
      TRANSITO: "bg-yellow-500 border-2 border-yellow-600 text-white",
      ETA: "bg-green-600 border-2 border-green-700 text-white",
      RECIBIDO: "bg-blue-700 border-2 border-blue-800 text-white",
    };
    return estados[estado] || "bg-gray-500 border-2 border-gray-600 text-white";
  };

  const getCanalBadge = (canal) => {
    if (!canal) return "";
    const canales = {
      ROJO: "bg-red-600 border-2 border-red-700 text-white",
      AMARILLO: "bg-yellow-500 border-2 border-yellow-600 text-white",
      VERDE: "bg-green-600 border-2 border-green-700 text-white",
    };
    return canales[canal] || "bg-gray-500 border-2 border-gray-600 text-white";
  };

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
              onClick={() => router.push("/importacion")}
              className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] text-white rounded-lg font-semibold hover:shadow-md hover:scale-105 transition-all duration-200 ripple-effect relative overflow-hidden text-sm group"
            >
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver</span>
            </button>

            {/* Card contenedor blanco */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">
              {/* Header */}
              <div className="mb-4 flex items-center justify-start">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] rounded-xl flex items-center justify-center text-white shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
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
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">TIPO DE CARGA</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">FECHA DE ALMACÉN</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ESTADO</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">CANAL</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">FECHA<br />RECEPCIÓN</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">INCIDENCIAS</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {currentImportaciones.map((importacion) => (
                        <tr key={importacion.id} className="hover:bg-slate-200 transition-colors">
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{importacion.fechaRegistro}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] font-bold text-gray-700">{importacion.numeroDespacho}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{importacion.redactadoPor || "-"}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{importacion.productos || "-"}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {importacion.archivoPdf && importacion.archivoPdf.trim() !== "" ? (
                              <button 
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const url = importacion.archivoPdf;
                                  
                                  if (!url || url.trim() === "") {
                                    alert("No hay enlace PDF disponible");
                                    return;
                                  }
                                  
                                  // Solo abrir en nueva pestaña, nunca cambiar la pestaña actual
                                  window.open(url, "_blank", "noopener,noreferrer");
                                }}
                                className="inline-flex items-center space-x-1 px-2.5 py-1 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                                title="Abrir archivo PDF"
                              >
                                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ pointerEvents: 'none' }}>
                                  <path d="M6 2C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V7.41421C19 7.149 18.8946 6.89464 18.7071 6.70711L13.2929 1.29289C13.1054 1.10536 12.851 1 12.5858 1H6Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
                                  <path d="M13 1V6H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                  <text x="12" y="15" fontSize="6" fill="currentColor" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="0.3">PDF</text>
                                </svg>
                                <span style={{ pointerEvents: 'none' }}>PDF</span>
                              </button>
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
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{importacion.fechaLlegada || "-"}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] font-bold text-gray-700">{importacion.tipoCarga}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{importacion.fechaAlmacen || "-"}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {importacion.estado && (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getEstadoBadge(importacion.estado)}`}>
                                {importacion.estado}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {importacion.canal && (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getCanalBadge(importacion.canal)}`}>
                                {importacion.canal}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{importacion.fechaRecepcion || "-"}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border-2 ${
                              importacion.incidencias 
                                ? "bg-red-600 border-red-700 text-white" 
                                : "bg-green-600 border-green-700 text-white"
                            }`}>
                              {importacion.incidencias ? "SI" : "NO"}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <button
                              onClick={() => {
                                setSelectedImportacion(importacion);
                                setUpdateForm({
                                  observaciones: importacion.observaciones || "",
                                  estado: importacion.estado || "",
                                  fechaAlmacen: importacion.fechaAlmacen || "",
                                  fechaRecepcion: importacion.fechaRecepcion || "",
                                });
                                setIsUpdateModalOpen(true);
                              }}
                              className="flex items-center space-x-1 px-3 py-1.5 bg-yellow-500 border-2 border-yellow-600 hover:bg-yellow-600 hover:border-yellow-700 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                              <span>Actualizar</span>
                            </button>
                          </td>
                        </tr>
                      ))}
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

      {/* Modal de Actualizar */}
      <Modal
        isOpen={isUpdateModalOpen}
        onClose={() => {
          setIsUpdateModalOpen(false);
          setSelectedImportacion(null);
          setUpdateForm({
            observaciones: "",
            estado: "",
            fechaAlmacen: "",
            fechaRecepcion: "",
          });
        }}
        title={`Actualizar Importación - ${selectedImportacion?.numeroDespacho || ""}`}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Estado
            </label>
            <select
              value={updateForm.estado}
              onChange={(e) => setUpdateForm({ ...updateForm, estado: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="">Seleccionar estado</option>
              <option value="TRANSITO">TRANSITO</option>
              <option value="ETA">ETA</option>
              <option value="RECIBIDO">RECIBIDO</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Fecha de Almacén
            </label>
            <input
              type="date"
              value={updateForm.fechaAlmacen}
              onChange={(e) => setUpdateForm({ ...updateForm, fechaAlmacen: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Fecha de Recepción
            </label>
            <input
              type="date"
              value={updateForm.fechaRecepcion}
              onChange={(e) => setUpdateForm({ ...updateForm, fechaRecepcion: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Observaciones
            </label>
            <textarea
              value={updateForm.observaciones}
              onChange={(e) => setUpdateForm({ ...updateForm, observaciones: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
              placeholder="Ingrese observaciones..."
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setIsUpdateModalOpen(false);
                setSelectedImportacion(null);
                setUpdateForm({
                  observaciones: "",
                  estado: "",
                  fechaAlmacen: "",
                  fechaRecepcion: "",
                });
              }}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                // Aquí iría la lógica para guardar los cambios
                console.log("Guardar cambios:", updateForm);
                alert("Funcionalidad de guardado pendiente de implementar");
                setIsUpdateModalOpen(false);
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

