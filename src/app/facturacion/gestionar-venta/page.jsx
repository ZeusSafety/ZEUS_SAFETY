"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/context/AuthContext";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";

export default function GestionarVentaPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [apiConectada, setApiConectada] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(5);
  const [busquedaDetalladaOpen, setBusquedaDetalladaOpen] = useState(false);
  const [busquedaDetallada, setBusquedaDetallada] = useState({
    numeroComprobante: "",
    comprobante: "",
  });
  const [mesesSeleccionados, setMesesSeleccionados] = useState([]);
  const [ano, setAno] = useState("2025");

  // Datos de prueba
  const [ventas, setVentas] = useState([
    {
      id: 1,
      cliente: "ARMANDO RAYMUNDO COICAPUSA",
      fecha: "29/11/2025",
      asesor: "HERVIN",
      comprobante: "B 872",
      estado: "COMPLETADO",
      cancelado: "NO",
    },
    {
      id: 2,
      cliente: "SEGIND PSU EIRL",
      fecha: "28/11/2025",
      asesor: "EVELYN",
      comprobante: "F 10145",
      estado: "COMPLETADO",
      cancelado: "NO",
    },
    {
      id: 3,
      cliente: "VASQUEZ HUAMAN LUIS HERNAN",
      fecha: "28/11/2025",
      asesor: "KIMBERLY",
      comprobante: "P 2174",
      estado: "COMPLETADO",
      cancelado: "NO",
    },
    {
      id: 4,
      cliente: "CLIENTE EJEMPLO 4",
      fecha: "27/11/2025",
      asesor: "IMPORT ZEUS",
      comprobante: "F 10144",
      estado: "COMPLETADO",
      cancelado: "NO",
    },
    {
      id: 5,
      cliente: "CLIENTE EJEMPLO 5",
      fecha: "26/11/2025",
      asesor: "LIZETH",
      comprobante: "B 871",
      estado: "COMPLETADO",
      cancelado: "NO",
    },
  ]);

  const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

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

  const handleSearch = () => {
    // Lógica de búsqueda
    console.log("Buscando:", searchTerm);
  };

  const handleExportarExcel = () => {
    // Lógica para exportar a Excel
    console.log("Exportando a Excel");
  };

  const toggleMes = (mes) => {
    setMesesSeleccionados((prev) =>
      prev.includes(mes)
        ? prev.filter((m) => m !== mes)
        : [...prev, mes]
    );
  };

  const handleBusquedaDetallada = () => {
    // Lógica de búsqueda detallada
    console.log("Búsqueda detallada:", busquedaDetallada);
  };

  const handleDescargarVentasSinCompletar = () => {
    // Lógica para descargar ventas sin completar
    console.log("Descargando ventas sin completar");
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
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-50">
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
              className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] text-white rounded-lg font-semibold hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm ripple-effect relative overflow-hidden text-sm group"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver</span>
            </button>

            {/* Card contenedor principal */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] rounded-xl flex items-center justify-center text-white shadow-sm">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Ventas Registradas</h1>
                    </div>
                  </div>
                  {apiConectada && (
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm font-medium text-green-600">API Conectada</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 1: Ventas Registradas */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200/60 p-6 mb-6">
                {/* Barra de Búsqueda */}
                <div className="mb-6">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por cliente, comprobante o asesor..."
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E63F7] focus:border-[#1E63F7] transition-all text-sm"
                      />
                    </div>
                    <button
                      onClick={handleExportarExcel}
                      className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Exportar Excel</span>
                    </button>
                  </div>
                </div>

                {/* Tabla de Ventas */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-blue-700 border-b-2 border-blue-800">
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">CLIENTE</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">FECHA</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ASESOR</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">COMPROBANTE</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ESTADO</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">CANCELADO</th>
                          <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ACCIONES</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {ventas.map((venta) => (
                          <tr key={venta.id} className="hover:bg-slate-200 transition-colors">
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{venta.cliente}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{venta.fecha}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{venta.asesor}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{venta.comprobante}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-[10px] font-semibold">
                                {venta.estado}
                              </span>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{venta.cancelado}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center space-x-2">
                                <button className="flex items-center space-x-1 px-2.5 py-1 bg-blue-600 border-2 border-blue-700 hover:bg-blue-700 hover:border-blue-800 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  <span>Ver</span>
                                </button>
                                <button className="flex items-center space-x-1 px-2.5 py-1 bg-green-600 border-2 border-green-700 hover:bg-green-700 hover:border-green-800 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span>Pago</span>
                                </button>
                                <button className="flex items-center space-x-1 px-2.5 py-1 bg-red-600 border-2 border-red-700 hover:bg-red-700 hover:border-red-800 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  <span>Eliminar</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Paginación */}
                <div className="bg-slate-200 px-3 py-2 flex items-center justify-between border-t-2 border-slate-300">
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
                </div>
              </div>

              {/* Card 2: Búsqueda Detallada */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200/60 p-6 mb-6">
                <button
                  onClick={() => setBusquedaDetalladaOpen(!busquedaDetalladaOpen)}
                  className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-[#1E63F7] to-[#1E63F7] text-white rounded-lg hover:shadow-md transition-all"
                >
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <h2 className="text-lg font-bold">Búsqueda Detallada</h2>
                  </div>
                  <svg
                    className={`w-5 h-5 transition-transform duration-200 ${busquedaDetalladaOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {busquedaDetalladaOpen && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                      <div className="flex-1">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Ingrese el número de comprobante
                        </label>
                        <input
                          type="text"
                          value={busquedaDetallada.numeroComprobante}
                          onChange={(e) => setBusquedaDetallada({ ...busquedaDetallada, numeroComprobante: e.target.value })}
                          placeholder="Ingrese el número de comp"
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E63F7] focus:border-[#1E63F7] transition-all text-sm"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Comprobante
                        </label>
                        <select
                          value={busquedaDetallada.comprobante}
                          onChange={(e) => setBusquedaDetallada({ ...busquedaDetallada, comprobante: e.target.value })}
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E63F7] focus:border-[#1E63F7] transition-all text-sm"
                        >
                          <option value="">Seleccione</option>
                          <option value="FACTUF">FACTUF</option>
                          <option value="BOLETA">BOLETA</option>
                          <option value="PROFORMA">PROFORMA</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={handleBusquedaDetallada}
                          className="px-6 py-2.5 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] text-white rounded-lg font-semibold hover:shadow-md transition-all duration-200 shadow-sm"
                        >
                          Buscar
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                      <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <p className="text-sm font-medium">Ingrese un criterio de búsqueda</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Card 3: Ventas por Mes */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200/60 p-6 mb-6">
                <div className="p-4 bg-gradient-to-r from-[#1E63F7] to-[#1E63F7] text-white rounded-lg mb-4">
                  <h2 className="text-lg font-bold">Ventas por Mes</h2>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
                    {meses.map((mes) => (
                      <label key={mes} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={mesesSeleccionados.includes(mes)}
                          onChange={() => toggleMes(mes)}
                          className="w-4 h-4 text-[#1E63F7] border-gray-300 rounded focus:ring-[#1E63F7]"
                        />
                        <span className="text-sm font-medium text-gray-700">{mes}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Año
                      </label>
                      <select
                        value={ano}
                        onChange={(e) => setAno(e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E63F7] focus:border-[#1E63F7] transition-all text-sm"
                      >
                        <option value="2023">2023</option>
                        <option value="2024">2024</option>
                        <option value="2025">2025</option>
                      </select>
                    </div>
                    <button
                      onClick={handleExportarExcel}
                      className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Descargar Excel</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Card 4: Ventas sin Completar */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200/60 p-6">
                <div className="p-4 bg-gradient-to-r from-[#1E63F7] to-[#1E63F7] text-white rounded-lg mb-4">
                  <h2 className="text-lg font-bold">Ventas sin Completar</h2>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Descargue un reporte de todas las ventas que aún no han sido completadas
                </p>
                <button
                  onClick={handleDescargarVentasSinCompletar}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Descargar Ventas sin Completar</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

