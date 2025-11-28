"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/context/AuthContext";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";

export default function ListadoImportacionesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFinal, setFechaFinal] = useState("");
  const [numeroDespacho, setNumeroDespacho] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  // Datos ficticios de importaciones
  const importaciones = [
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
  ];

  const handleFiltrar = () => {
    // Lógica de filtrado aquí
    console.log("Filtrar:", { fechaInicio, fechaFinal, numeroDespacho });
  };

  const totalPages = Math.ceil(importaciones.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentImportaciones = importaciones.slice(startIndex, endIndex);

  const getEstadoBadge = (estado) => {
    const estados = {
      TRANSITO: "bg-yellow-100 text-yellow-800 border-yellow-300",
      ETA: "bg-green-100 text-green-800 border-green-300",
      RECIBIDO: "bg-blue-100 text-blue-800 border-blue-300",
    };
    return estados[estado] || "bg-slate-200 text-gray-800 border-gray-300";
  };

  const getCanalBadge = (canal) => {
    if (!canal) return "";
    const canales = {
      ROJO: "bg-red-100 text-red-800 border-red-300",
      AMARILLO: "bg-yellow-100 text-yellow-800 border-yellow-300",
      VERDE: "bg-green-100 text-green-800 border-green-300",
    };
    return canales[canal] || "bg-slate-200 text-gray-800 border-gray-300";
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
              onClick={() => router.push("/importacion")}
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
                  <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center text-white border-2 border-blue-800 shadow-sm">
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
                    className="px-4 py-2.5 bg-yellow-500 border-2 border-yellow-600 hover:bg-yellow-600 hover:border-yellow-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center space-x-1.5 text-sm whitespace-nowrap"
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
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{importacion.redactadoPor}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{importacion.productos}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <button className="flex items-center space-x-1 px-2.5 py-1 bg-blue-700 border-2 border-blue-800 hover:bg-blue-800 hover:border-blue-900 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]">
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6 2C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V7.41421C19 7.149 18.8946 6.89464 18.7071 6.70711L13.2929 1.29289C13.1054 1.10536 12.851 1 12.5858 1H6Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                                <path d="M13 1V6H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <text x="12" y="15" fontSize="6" fill="currentColor" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="0.3">PDF</text>
                              </svg>
                              <span>PDF</span>
                            </button>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{importacion.fechaLlegada}</td>
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
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold border ${
                              importacion.incidencias 
                                ? "bg-red-600 border-2 border-red-700 text-white" 
                                : "bg-green-600 border-2 border-green-700 text-white"
                            }`}>
                              {importacion.incidencias ? "SI" : "NO"}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <button className="flex items-center space-x-1 px-3 py-1.5 bg-yellow-500 border-2 border-yellow-600 hover:bg-yellow-600 hover:border-yellow-700 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]">
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
    </div>
  );
}

