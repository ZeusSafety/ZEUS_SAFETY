"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/context/AuthContext";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";
import Modal from "../../../components/ui/Modal";

export default function ListadoVentasMarketingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Datos ficticios de ventas
  const [ventas] = useState([
    { cliente: "VEGA QUISPE LUIS ANTHONY", fecha: "28/11/2025", asesor: "ZEUS", comprobante: "F 10114", estado: "COMPLETADO", cancelado: "NO" },
    { cliente: "ROCIO BONIFACIO DE LA CRUZ", fecha: "25/11/2025", asesor: "ZEUS", comprobante: "B 865", estado: "COMPLETADO", cancelado: "NO" },
    { cliente: "VEGA QUISPE LUIS ANTHONY", fecha: "13/11/2025", asesor: "ZEUS", comprobante: "F 9964", estado: "COMPLETADO", cancelado: "SI" },
    { cliente: "LUGGO GROUP SAC", fecha: "12/11/2025", asesor: "ZEUS", comprobante: "F 9951", estado: "COMPLETADO", cancelado: "SI" },
    { cliente: "CONTRERAS MARIN SARITA", fecha: "04/11/2025", asesor: "ZEUS", comprobante: "B 856", estado: "COMPLETADO", cancelado: "SI" },
    { cliente: "GARCIA LOPEZ MARIA", fecha: "01/11/2025", asesor: "ZEUS", comprobante: "F 9945", estado: "COMPLETADO", cancelado: "NO" },
    { cliente: "RODRIGUEZ FERNANDEZ CARLOS", fecha: "30/10/2025", asesor: "ZEUS", comprobante: "F 9932", estado: "COMPLETADO", cancelado: "SI" },
    { cliente: "MARTINEZ SOTO ANA", fecha: "28/10/2025", asesor: "ZEUS", comprobante: "B 850", estado: "COMPLETADO", cancelado: "SI" },
    { cliente: "SILVA RAMIREZ LUIS", fecha: "25/10/2025", asesor: "ZEUS", comprobante: "F 9920", estado: "COMPLETADO", cancelado: "NO" },
    { cliente: "TORRES VARGAS PATRICIA", fecha: "22/10/2025", asesor: "ZEUS", comprobante: "F 9915", estado: "COMPLETADO", cancelado: "SI" },
    { cliente: "HERRERA MENDOZA ROBERTO", fecha: "20/10/2025", asesor: "ZEUS", comprobante: "B 845", estado: "COMPLETADO", cancelado: "SI" },
    { cliente: "FLORES CASTRO DIANA", fecha: "18/10/2025", asesor: "ZEUS", comprobante: "F 9908", estado: "COMPLETADO", cancelado: "NO" },
    { cliente: "MORALES GUTIERREZ FERNANDO", fecha: "15/10/2025", asesor: "ZEUS", comprobante: "F 9902", estado: "COMPLETADO", cancelado: "SI" },
    { cliente: "VARGAS RUIZ SOFIA", fecha: "12/10/2025", asesor: "ZEUS", comprobante: "B 840", estado: "COMPLETADO", cancelado: "SI" },
    { cliente: "CRUZ DIAZ MIGUEL", fecha: "10/10/2025", asesor: "ZEUS", comprobante: "F 9895", estado: "COMPLETADO", cancelado: "NO" },
    { cliente: "RAMOS VELASQUEZ LAURA", fecha: "08/10/2025", asesor: "ZEUS", comprobante: "F 9890", estado: "COMPLETADO", cancelado: "SI" },
    { cliente: "JIMENEZ ORTEGA PABLO", fecha: "05/10/2025", asesor: "ZEUS", comprobante: "B 835", estado: "COMPLETADO", cancelado: "SI" },
    { cliente: "CASTRO NAVARRO ELENA", fecha: "03/10/2025", asesor: "ZEUS", comprobante: "F 9885", estado: "COMPLETADO", cancelado: "NO" },
    { cliente: "MENDOZA SANDOVAL RICARDO", fecha: "01/10/2025", asesor: "ZEUS", comprobante: "F 9880", estado: "COMPLETADO", cancelado: "SI" },
    { cliente: "PEÑAFIEL YUPANQUI WILTON", fecha: "28/09/2025", asesor: "ZEUS", comprobante: "B 830", estado: "COMPLETADO", cancelado: "SI" },
    { cliente: "STAGRO PERU SAC", fecha: "25/09/2025", asesor: "ZEUS", comprobante: "F 9875", estado: "COMPLETADO", cancelado: "NO" },
    { cliente: "INVERSIONES DEL SUR S.A.C.", fecha: "22/09/2025", asesor: "ZEUS", comprobante: "F 9870", estado: "COMPLETADO", cancelado: "SI" },
    { cliente: "TECNOLOGIA AVANZADA E.I.R.L.", fecha: "20/09/2025", asesor: "ZEUS", comprobante: "B 825", estado: "COMPLETADO", cancelado: "SI" },
    { cliente: "COMERCIALIZADORA NORTE S.A.C.", fecha: "18/09/2025", asesor: "ZEUS", comprobante: "F 9865", estado: "COMPLETADO", cancelado: "NO" },
    { cliente: "DISTRIBUIDORA CENTRAL E.I.R.L.", fecha: "15/09/2025", asesor: "ZEUS", comprobante: "F 9860", estado: "COMPLETADO", cancelado: "SI" },
    { cliente: "IMPORTADORA PACIFICO S.A.C.", fecha: "12/09/2025", asesor: "ZEUS", comprobante: "B 820", estado: "COMPLETADO", cancelado: "SI" },
    { cliente: "LOGISTICA INTEGRAL E.I.R.L.", fecha: "10/09/2025", asesor: "ZEUS", comprobante: "F 9855", estado: "COMPLETADO", cancelado: "NO" },
    { cliente: "CONSTRUCCIONES MODERNAS S.A.C.", fecha: "08/09/2025", asesor: "ZEUS", comprobante: "F 9850", estado: "COMPLETADO", cancelado: "SI" },
    { cliente: "AGRICOLA DEL VALLE E.I.R.L.", fecha: "05/09/2025", asesor: "ZEUS", comprobante: "B 815", estado: "COMPLETADO", cancelado: "SI" },
    { cliente: "TEXTILES ANDINOS S.A.C.", fecha: "03/09/2025", asesor: "ZEUS", comprobante: "F 9845", estado: "COMPLETADO", cancelado: "NO" },
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

  // Filtrar ventas según el término de búsqueda
  const filteredVentas = ventas.filter((venta) =>
    venta.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    venta.comprobante.toLowerCase().includes(searchTerm.toLowerCase()) ||
    venta.asesor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calcular paginación
  const totalPages = Math.ceil(filteredVentas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentVentas = filteredVentas.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFirstPage = () => {
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLastPage = () => {
    const total = Math.ceil(filteredVentas.length / itemsPerPage);
    setCurrentPage(total);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [isVerModalOpen, setIsVerModalOpen] = useState(false);
  const [isPagoModalOpen, setIsPagoModalOpen] = useState(false);
  const [selectedVenta, setSelectedVenta] = useState(null);

  const handleVer = (venta) => {
    setSelectedVenta(venta);
    setIsVerModalOpen(true);
  };

  const handlePago = (venta) => {
    setSelectedVenta(venta);
    setIsPagoModalOpen(true);
  };

  const handleExportarExcel = () => {
    console.log("Exportar a Excel");
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
    <div className="flex h-screen overflow-hidden" style={{ background: '#F7FAFF' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div 
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${
          sidebarOpen ? "lg:ml-60 ml-0" : "ml-0"
        }`}
      >
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 overflow-y-auto" style={{ background: '#F7FAFF' }}>
          <div className="max-w-[95%] mx-auto px-4 py-4 sm:py-6">
            {/* Botón Volver */}
            <button
              onClick={() => router.push("/marketing")}
              className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] text-white rounded-lg font-semibold hover:shadow-md hover:scale-105 transition-all duration-200 ripple-effect relative overflow-hidden text-sm group"
            >
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver</span>
            </button>

            {/* Contenedor Principal */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
              {/* Header de la página */}
              <div className="mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-gray-200">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] rounded-xl flex items-center justify-center text-white shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                    Ventas Registradas
                  </h1>
                </div>
              </div>

              {/* Barra de búsqueda y botones */}
              <div className="mb-4 sm:mb-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Buscar por cliente, comprobante o asesor..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {}}
                      className="px-4 py-2.5 bg-yellow-500 border-2 border-yellow-600 hover:bg-yellow-600 hover:border-yellow-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center space-x-1.5 text-sm whitespace-nowrap"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                      <span>Filtrar</span>
                    </button>
                    <button
                      onClick={handleExportarExcel}
                      className="flex items-center space-x-1.5 px-4 py-2.5 bg-green-600 border-2 border-green-700 hover:bg-green-700 hover:border-green-800 text-white rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg text-sm whitespace-nowrap"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Exportar Excel</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Tabla de ventas */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-blue-700 border-b-2 border-blue-800">
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                          CLIENTE
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                          FECHA
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                          ASESOR
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                          COMPROBANTE
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                          ESTADO
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                          CANCELADO
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                          ACCIONES
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {currentVentas.length > 0 ? (
                        currentVentas.map((venta, index) => (
                          <tr key={index} className="hover:bg-slate-200 transition-colors">
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                              {venta.cliente}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                              {venta.fecha}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                              {venta.asesor}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                              {venta.comprobante}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border-2 bg-green-600 border-green-700 text-white">
                                {venta.estado}
                              </span>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              {venta.cancelado === "SI" ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border-2 bg-red-600 border-red-700 text-white">
                                  {venta.cancelado}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border-2 bg-green-600 border-green-700 text-white">
                                  {venta.cancelado}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => handleVer(venta)}
                                  className="flex items-center justify-center w-7 h-7 bg-cyan-500 border-2 border-cyan-600 hover:bg-cyan-600 hover:border-cyan-700 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                  aria-label="Ver"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handlePago(venta)}
                                  className="flex items-center justify-center w-7 h-7 bg-green-600 border-2 border-green-700 hover:bg-green-700 hover:border-green-800 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                  aria-label="Pago"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="px-3 py-8 text-center text-[10px] text-gray-500">
                            No se encontraron ventas
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Paginación */}
                {totalPages > 0 && (
                  <div className="bg-slate-200 px-3 py-2 flex items-center justify-between border-t-2 border-slate-300">
                    <button
                      onClick={handleFirstPage}
                      disabled={currentPage === 1}
                      className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      aria-label="Primera página"
                    >
                      «
                    </button>
                    
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      aria-label="Página anterior"
                    >
                      &lt;
                    </button>
                    
                    <span className="text-[10px] text-gray-700 font-medium">
                      Página {currentPage} de {totalPages}
                    </span>
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      aria-label="Página siguiente"
                    >
                      &gt;
                    </button>
                    
                    <button
                      onClick={handleLastPage}
                      disabled={currentPage === totalPages}
                      className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      aria-label="Última página"
                    >
                      »
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal Ver Venta */}
      <Modal
        isOpen={isVerModalOpen}
        onClose={() => {
          setIsVerModalOpen(false);
          setSelectedVenta(null);
        }}
        title={`Detalles de Venta - ${selectedVenta?.cliente || ""}`}
        size="lg"
      >
        {selectedVenta && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Cliente</label>
                <p className="text-sm text-gray-900">{selectedVenta.cliente}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha</label>
                <p className="text-sm text-gray-900">{selectedVenta.fecha}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Total</label>
                <p className="text-sm text-gray-900">{selectedVenta.total}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Comprobante</label>
                <p className="text-sm text-gray-900">{selectedVenta.comprobante}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Estado</label>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border-2 bg-green-600 border-green-700 text-white">
                  {selectedVenta.estado}
                </span>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Cancelado</label>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border-2 ${
                  selectedVenta.cancelado === "SI" ? "bg-red-600 border-red-700" : "bg-green-600 border-green-700"
                } text-white`}>
                  {selectedVenta.cancelado}
                </span>
              </div>
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

      {/* Modal Ver Pago */}
      <Modal
        isOpen={isPagoModalOpen}
        onClose={() => {
          setIsPagoModalOpen(false);
          setSelectedVenta(null);
        }}
        title={`Información de Pago - ${selectedVenta?.cliente || ""}`}
        size="md"
      >
        {selectedVenta && (
          <div className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Cliente</label>
                <p className="text-sm text-gray-900">{selectedVenta.cliente}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Total a Pagar</label>
                <p className="text-lg font-bold text-gray-900">{selectedVenta.total}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Estado del Pago</label>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border-2 ${
                  selectedVenta.cancelado === "SI" ? "bg-red-600 border-red-700" : "bg-green-600 border-green-700"
                } text-white`}>
                  {selectedVenta.cancelado === "SI" ? "Pendiente" : "Pagado"}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setIsPagoModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  alert("Funcionalidad de procesar pago pendiente de implementar");
                  setIsPagoModalOpen(false);
                }}
                className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] hover:shadow-md hover:scale-105 rounded-lg transition-all duration-200 shadow-sm"
              >
                Procesar Pago
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

