"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/context/AuthContext";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";

export default function GestionarRegularizacionPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [apiConectada, setApiConectada] = useState(true);
  const [busquedaComprobante, setBusquedaComprobante] = useState("");
  const [mesesSeleccionados, setMesesSeleccionados] = useState([]);
  const [ano, setAno] = useState("2025");

  // Datos de prueba
  const [regularizaciones, setRegularizaciones] = useState([
    {
      id: 1,
      titulo: "29 DE NOVIEMBRE / MAÑANA",
      fecha: "29/11/2025",
      efectivoIndicado: "2308.5",
      cantidad: 30,
    },
    {
      id: 2,
      titulo: "25 DE NOVIEMBRE / TARDE",
      fecha: "25/11/2025",
      efectivoIndicado: "5125",
      cantidad: 23,
    },
    {
      id: 3,
      titulo: "24 DE NOVIEMBRE / MAÑANA",
      fecha: "24/11/2025",
      efectivoIndicado: "1665",
      cantidad: 13,
    },
    {
      id: 4,
      titulo: "23 DE NOVIEMBRE / TARDE",
      fecha: "23/11/2025",
      efectivoIndicado: "3525",
      cantidad: 5,
    },
    {
      id: 5,
      titulo: "22 DE NOVIEMBRE / MAÑANA",
      fecha: "22/11/2025",
      efectivoIndicado: "9687.5",
      cantidad: 42,
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

  const handleBuscarComprobante = () => {
    // Lógica de búsqueda
    console.log("Buscando comprobante:", busquedaComprobante);
  };

  const handleExportarExcel = (id) => {
    // Lógica para exportar a Excel
    console.log("Exportando a Excel:", id);
  };

  const toggleMes = (mes) => {
    setMesesSeleccionados((prev) =>
      prev.includes(mes)
        ? prev.filter((m) => m !== mes)
        : [...prev, mes]
    );
  };

  const handleExportarExcelPorMes = () => {
    // Lógica para exportar por mes
    console.log("Exportando por mes:", mesesSeleccionados, ano);
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
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Listado de Regularizaciones</h1>
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

              {/* Card 1: Listado de Regularizaciones */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200/60 p-6 mb-6">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-blue-700 border-b-2 border-blue-800">
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">TÍTULO</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">FECHA</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">EFECTIVO INDICADO</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">CANTIDAD</th>
                          <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ACCIÓN</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {regularizaciones.map((regularizacion) => (
                          <tr key={regularizacion.id} className="hover:bg-slate-200 transition-colors">
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{regularizacion.titulo}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{regularizacion.fecha}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                              {parseFloat(regularizacion.efectivoIndicado) > 0 ? (
                                <span className="px-2 py-1 bg-yellow-100 text-gray-900 rounded font-semibold text-[10px]">
                                  {regularizacion.efectivoIndicado}
                                </span>
                              ) : (
                                <span>{regularizacion.efectivoIndicado}</span>
                              )}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{regularizacion.cantidad}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-center">
                              <button
                                onClick={() => handleExportarExcel(regularizacion.id)}
                                className="px-2.5 py-1 bg-green-600 border-2 border-green-700 hover:bg-green-700 hover:border-green-800 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] flex items-center space-x-1 mx-auto"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span>Excel</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Card 2: Búsqueda por Comprobante */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200/60 p-6 mb-6">
                <div className="p-3 bg-gradient-to-r from-[#1E63F7] to-[#1E63F7] text-white rounded-lg mb-4">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <h2 className="text-lg font-bold">Búsqueda por Comprobante</h2>
                  </div>
                </div>

                <div className="mb-4 flex gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={busquedaComprobante}
                      onChange={(e) => setBusquedaComprobante(e.target.value)}
                      placeholder="Ingrese el número de comprobante..."
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E63F7] focus:border-[#1E63F7] transition-all text-sm"
                    />
                  </div>
                  <button
                    onClick={handleBuscarComprobante}
                    className="px-6 py-2.5 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] text-white rounded-lg font-semibold hover:shadow-md transition-all duration-200 shadow-sm flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span>Buscar</span>
                  </button>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-blue-700 border-b-2 border-blue-800">
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">TÍTULO</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">COMPROBANTES</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">FECHA REGULARIZACIÓN</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">MONTO</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ASESOR</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">MEDIO DE PAGO</th>
                          <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ACCIONES</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        <tr>
                          <td colSpan={7} className="px-4 py-12 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                              <p className="text-gray-500 font-medium text-[10px]">Ingrese un comprobante para buscar</p>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Card 3: Regularizaciones por Mes */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200/60 p-6">
                <div className="p-3 bg-gradient-to-r from-[#1E63F7] to-[#1E63F7] text-white rounded-lg mb-4">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h2 className="text-lg font-bold">Regularizaciones por Mes</h2>
                  </div>
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
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Año:
                      </label>
                      <select
                        value={ano}
                        onChange={(e) => setAno(e.target.value)}
                        className="px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E63F7] focus:border-[#1E63F7] transition-all text-sm"
                      >
                        <option value="2023">2023</option>
                        <option value="2024">2024</option>
                        <option value="2025">2025</option>
                      </select>
                    </div>
                    <button
                      onClick={handleExportarExcelPorMes}
                      className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Excel</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

