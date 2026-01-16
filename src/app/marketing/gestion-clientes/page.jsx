"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/context/AuthContext";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";
import Modal from "../../../components/ui/Modal";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function GestionClientesMarketingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [apiConnected, setApiConnected] = useState(true);
  const [isVerModalOpen, setIsVerModalOpen] = useState(false);
  const [isEditarModalOpen, setIsEditarModalOpen] = useState(false);
  const [isEliminarModalOpen, setIsEliminarModalOpen] = useState(false);
  const [isHistorialModalOpen, setIsHistorialModalOpen] = useState(false);
  const [isProductosModalOpen, setIsProductosModalOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [selectedVenta, setSelectedVenta] = useState(null);
  const [editForm, setEditForm] = useState({
    nombre: "",
    tipo: "",
    origen: "",
  });
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const [clientes, setClientes] = useState([]);
  const [isClientesLoading, setIsClientesLoading] = useState(true);
  const [chartData, setChartData] = useState(null);
  const [ventasTotales, setVentasTotales] = useState(0);
  const [isChartLoading, setIsChartLoading] = useState(true);
  const [historialVentas, setHistorialVentas] = useState([]);
  const [isHistorialLoading, setIsHistorialLoading] = useState(false);
  const [productosVenta, setProductosVenta] = useState([]);
  const [isProductosLoading, setIsProductosLoading] = useState(false);
  const metaMensual = 10000;

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (user) {
      loadClientes();
      loadChartData();
    }
  }, [user, loading, router]);

  const loadClientes = async () => {
    try {
      setIsClientesLoading(true);
      const res = await fetch(`https://clientes-2946605267.us-central1.run.app?method=clientes_por_asesor&id=ZEUS`);
      if (res.ok) {
        const data = await res.json();
        const formattedData = (Array.isArray(data) ? data : [data]).map(item => ({
          id: item.ID_CLIENTE || "",
          nombre: item.CLIENTE || "",
          tipo: item.TIPO_CLIENTE || "",
          origen: item.ORIGEN || "",
          documentos: item.DOCUMENTOS || "[]",
          direcciones: item.DIRECCIONES || "[]",
          telefonos: item.TELEFONOS || "[]"
        }));
        setClientes(formattedData);
        setApiConnected(true);
      }
    } catch (error) {
      console.error("Error loading clientes:", error);
      setApiConnected(false);
    } finally {
      setIsClientesLoading(false);
    }
  };

  const loadChartData = async () => {
    try {
      setIsChartLoading(true);
      const res = await fetch(`https://asesoresventas-2946605267.us-central1.run.app?method=total_por_mes&variable=ZEUS`);
      if (res.ok) {
        const data = await res.json();
        // Ordenar meses
        data.sort((a, b) => a['MONTH(V.FECHA)'] - b['MONTH(V.FECHA)']);

        const nombresMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const labels = data.map(item => nombresMeses[item['MONTH(V.FECHA)'] - 1]);
        const valores = data.map(item => item.TOTAL || 0);

        setChartData({
          labels,
          datasets: [{
            label: 'Ventas (S/)',
            data: valores,
            borderColor: '#002D5A',
            backgroundColor: 'rgba(0, 45, 90, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: '#002D5A',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHoverRadius: 6
          }]
        });

        const total = data.reduce((sum, item) => sum + (item.TOTAL || 0), 0);
        setVentasTotales(total);
      }
    } catch (error) {
      console.error("Error loading chart data:", error);
    } finally {
      setIsChartLoading(false);
    }
  };

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

  // Filtrar clientes según el término de búsqueda
  const filteredClientes = clientes.filter((cliente) =>
    cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calcular paginación
  const totalPages = Math.ceil(filteredClientes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentClientes = filteredClientes.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFirstPage = () => {
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLastPage = () => {
    const total = Math.ceil(filteredClientes.length / itemsPerPage);
    setCurrentPage(total);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleVer = (id) => {
    const cliente = clientes.find(c => c.id === id);
    setSelectedCliente(cliente);
    setIsVerModalOpen(true);
  };

  const handleEditar = (id) => {
    const cliente = clientes.find(c => c.id === id);
    setSelectedCliente(cliente);
    setEditForm({
      nombre: cliente?.nombre || "",
      tipo: cliente?.tipo || "",
      origen: cliente?.origen || "",
    });
    setIsEditarModalOpen(true);
  };

  const handleEliminar = (id) => {
    const cliente = clientes.find(c => c.id === id);
    setSelectedCliente(cliente);
    setIsEliminarModalOpen(true);
  };

  const handleHistorial = async (id) => {
    const cliente = clientes.find(c => c.id === id);
    setSelectedCliente(cliente);
    setIsHistorialModalOpen(true);
    setIsHistorialLoading(true);
    try {
      const res = await fetch(`https://crudventas-2946605267.us-central1.run.app?area=busqueda_cliente_comprobante&id=${id}&metodo=CLIENTE`);
      if (res.ok) {
        const data = await res.json();
        setHistorialVentas(Array.isArray(data) ? data : [data]);
      } else {
        setHistorialVentas([]);
      }
    } catch (error) {
      console.error("Error loading history:", error);
      setHistorialVentas([]);
    } finally {
      setIsHistorialLoading(false);
    }
  };

  const handleVerDetalleVenta = async (venta) => {
    setSelectedVenta(venta);
    setIsProductosModalOpen(true);
    setIsProductosLoading(true);
    try {
      const res = await fetch(`https://crudventas-2946605267.us-central1.run.app?area=detalle_productos&id=${venta.ID_VENTA}`);
      if (res.ok) {
        const data = await res.json();
        setProductosVenta(Array.isArray(data) ? data : [data]);
      } else {
        setProductosVenta([]);
      }
    } catch (error) {
      console.error("Error loading products:", error);
      setProductosVenta([]);
    } finally {
      setIsProductosLoading(false);
    }
  };

  // Función para obtener el color del badge según el origen
  const getOrigenBadge = (origen) => {
    if (!origen) return "bg-gray-100 text-gray-700";
    const origenes = {
      "WHATSAPP": "bg-green-100 text-green-800 border border-green-300",
      "META ADS": "bg-blue-100 text-blue-800 border border-blue-300",
    };
    return origenes[origen.toUpperCase()] || "bg-gray-100 text-gray-700 border border-gray-300";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#002D5A]"></div>
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
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${sidebarOpen ? "lg:ml-60 ml-0" : "ml-0"
          }`}
      >
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto" style={{ background: '#F7FAFF' }}>
          <div className="max-w-[95%] mx-auto px-4 py-4 sm:py-6">
            {/* Botón Volver */}
            <button
              onClick={() => router.push("/marketing")}
              className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-[#002D5A] to-[#003B75] hover:from-[#001F3D] hover:to-[#002D5A] text-white rounded-lg font-medium hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm ripple-effect relative overflow-hidden text-sm group"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver a Marketing</span>
            </button>

            {/* Dashboard Container */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6 mb-6">
              {/* Header de la página */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#002D5A] to-[#002D5A] rounded-xl flex items-center justify-center text-white shadow-sm">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'var(--font-poppins)' }}>
                      Listado de Clientes por Asesor
                    </h1>
                    <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: 'var(--font-poppins)' }}>
                      Consulta y gestión de todos los clientes registrados por asesor
                    </p>
                  </div>
                </div>

                {apiConnected && (
                  <div className="flex items-center space-x-2 rounded-lg px-3 py-1.5 bg-green-50 border border-green-200">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-semibold text-green-700" style={{ fontFamily: 'var(--font-poppins)' }}>API Conectada</span>
                  </div>
                )}
              </div>
              {/* Dashboard - Ventas por Mes */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>Ventas por Mes</h2>
                  </div>
                  <div className="flex items-center space-x-2 rounded-lg px-3 py-1.5 bg-green-50 border border-green-200">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-semibold text-green-700" style={{ fontFamily: 'var(--font-poppins)' }}>Cargado</span>
                  </div>
                </div>

                {/* Gráfico de líneas con Chart.js */}
                <div className="relative bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 sm:p-6 border border-gray-200">
                  <div className="relative h-72 sm:h-96">
                    {isChartLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#002D5A]"></div>
                      </div>
                    ) : chartData ? (
                      <Line
                        data={chartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              display: true,
                              position: 'top',
                              labels: { font: { family: 'var(--font-poppins)', size: 12, weight: 'bold' } }
                            },
                            tooltip: {
                              mode: 'index',
                              intersect: false,
                              backgroundColor: 'rgba(0, 45, 90, 0.9)',
                              titleFont: { family: 'var(--font-poppins)', size: 14 },
                              bodyFont: { family: 'var(--font-poppins)', size: 13 },
                              padding: 12,
                              displayColors: false,
                              callbacks: {
                                label: (context) => ` Ventas: S/ ${context.parsed.y.toLocaleString('es-PE')}`
                              }
                            }
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              grid: { borderDash: [4, 4], color: '#e5e7eb' },
                              ticks: { font: { family: 'var(--font-poppins)', size: 11 }, callback: (value) => 'S/ ' + value.toLocaleString('es-PE') }
                            },
                            x: {
                              grid: { display: false },
                              ticks: { font: { family: 'var(--font-poppins)', size: 11 } }
                            }
                          }
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                        No hay datos disponibles para el gráfico
                      </div>
                    )}
                  </div>

                  {/* Información adicional debajo del gráfico */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-3 h-3 rounded-full bg-[#002D5A] shadow-sm"></div>
                        <span className="text-gray-600" style={{ fontFamily: 'var(--font-poppins)' }}>
                          Promedio mensual: <strong className="text-gray-900 font-bold">S/ 11,000</strong>
                        </span>
                      </div>
                      <div className="flex items-center space-x-2.5">
                        <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></div>
                        <span className="text-gray-600" style={{ fontFamily: 'var(--font-poppins)' }}>
                          Mejor mes: <strong className="text-gray-900 font-bold">Julio (S/ 28,000)</strong>
                        </span>
                      </div>
                      <div className="flex items-center space-x-2.5">
                        <div className="w-3 h-3 rounded-full bg-orange-500 shadow-sm"></div>
                        <span className="text-gray-600" style={{ fontFamily: 'var(--font-poppins)' }}>
                          Tendencia: <strong className="text-gray-900 font-bold">Estable</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dashboard - Métricas y Comisiones */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>Métricas y Comisiones</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Card: Ventas Totales */}
                  <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md border border-gray-200 p-3 relative">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1 font-medium" style={{ fontFamily: 'var(--font-poppins)' }}>
                          Ventas Totales
                        </p>
                        <p className="text-xl font-bold text-[#002D5A] mb-0.5" style={{ fontFamily: 'var(--font-poppins)' }}>
                          S/ {ventasTotales.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-gray-500" style={{ fontFamily: 'var(--font-poppins)' }}>
                          Año actual
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-gradient-to-br from-[#002D5A] to-[#002D5A] rounded-xl flex items-center justify-center text-white shadow-sm">
                        <span className="text-lg font-bold">S/</span>
                      </div>
                    </div>
                  </div>

                  {/* Card: Meta Mensual */}
                  <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md border border-gray-200 p-3 relative">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1 font-medium" style={{ fontFamily: 'var(--font-poppins)' }}>
                          Meta Mensual
                        </p>
                        <p className="text-xl font-bold text-[#002D5A] mb-0.5" style={{ fontFamily: 'var(--font-poppins)' }}>
                          S/ {metaMensual.toLocaleString('es-PE')}
                        </p>
                        <p className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>
                          Progreso: {chartData && chartData.datasets[0].data.length > 0 ? (
                            ((chartData.datasets[0].data[chartData.datasets[0].data.length - 1] / metaMensual) * 100).toFixed(1)
                          ) : '0'}%
                        </p>
                        {/* Progress bar */}
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-gradient-to-r from-[#002D5A] via-[#002D5A] to-green-500 h-1.5 rounded-full transition-all duration-300"
                            style={{
                              width: `${chartData && chartData.datasets[0].data.length > 0 ? Math.min(100, (chartData.datasets[0].data[chartData.datasets[0].data.length - 1] / metaMensual) * 100) : 0}%`
                            }}
                          ></div>
                        </div>
                      </div>
                      <div className="w-10 h-10 bg-gradient-to-br from-[#002D5A] to-[#002D5A] rounded-xl flex items-center justify-center text-white shadow-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contenedor de Tabla de Clientes */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">
              {/* Barra de búsqueda */}
              <div className="mb-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar por nombre del cliente..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border-2 border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-300 placeholder:text-gray-400 text-gray-900"
                    style={{ fontFamily: 'var(--font-poppins)' }}
                  />
                </div>
              </div>

              {/* Tabla de clientes */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#002D5A] border-b-2 border-[#001F3D]">
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                          ID CLIENTE
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                          CLIENTE
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                          TIPO CLIENTE
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                          ORIGEN
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                          ACCIONES
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {isClientesLoading ? (
                        <tr>
                          <td colSpan="5" className="px-3 py-10 text-center">
                            <div className="flex flex-col items-center justify-center space-y-2">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#002D5A]"></div>
                              <p className="text-[10px] text-gray-500 font-medium">Cargando clientes de la API...</p>
                            </div>
                          </td>
                        </tr>
                      ) : currentClientes.length > 0 ? (
                        currentClientes.map((cliente, index) => (
                          <tr key={cliente.id} className="hover:bg-slate-200 transition-colors">
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                              {cliente.id}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>
                              {cliente.nombre}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-blue-100 text-blue-800" style={{ fontFamily: 'var(--font-poppins)' }}>
                                {cliente.tipo}
                              </span>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-semibold ${getOrigenBadge(cliente.origen)}`} style={{ fontFamily: 'var(--font-poppins)' }}>
                                {cliente.origen}
                              </span>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => handleVer(cliente.id)}
                                  className="inline-flex items-center justify-center w-8 h-8 bg-[#002D5A] hover:bg-[#001F3D] text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                  title="Ver cliente"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleEditar(cliente.id)}
                                  className="inline-flex items-center justify-center w-8 h-8 bg-[#003B75] hover:bg-[#002D5A] text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                  title="Editar cliente"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleHistorial(cliente.id)}
                                  className="inline-flex items-center justify-center w-8 h-8 bg-[#004C99] hover:bg-[#003B75] text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                  title="Historial del cliente"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="px-3 py-8 text-center text-[10px] text-gray-500" style={{ fontFamily: 'var(--font-poppins)' }}>
                            No se encontraron clientes
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
                      style={{ fontFamily: 'var(--font-poppins)' }}
                      aria-label="Primera página"
                    >
                      «
                    </button>

                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                      aria-label="Página anterior"
                    >
                      &lt;
                    </button>

                    <span className="text-[10px] text-gray-700 font-medium" style={{ fontFamily: 'var(--font-poppins)' }}>
                      Página {currentPage} de {totalPages}
                    </span>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                      aria-label="Página siguiente"
                    >
                      &gt;
                    </button>

                    <button
                      onClick={handleLastPage}
                      disabled={currentPage === totalPages}
                      className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      style={{ fontFamily: 'var(--font-poppins)' }}
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

      {/* Modal Ver Cliente */}
      <Modal
        isOpen={isVerModalOpen}
        onClose={() => {
          setIsVerModalOpen(false);
          setSelectedCliente(null);
        }}
        title={`Detalles del Cliente - ${selectedCliente?.nombre || ""}`}
        size="lg"
      >
        {selectedCliente && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-gray-200">
                <h4 className="text-xs font-bold text-[#002D5A] uppercase tracking-wider mb-3 flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  <span>Información General</span>
                </h4>
                <div className="space-y-2">
                  <p className="text-xs"><span className="font-semibold text-gray-600">ID:</span> <span className="text-gray-900">{selectedCliente.id}</span></p>
                  <p className="text-xs"><span className="font-semibold text-gray-600">Nombre:</span> <span className="text-gray-900">{selectedCliente.nombre}</span></p>
                  <p className="text-xs"><span className="font-semibold text-gray-600">Tipo:</span> <span className="text-gray-900">{selectedCliente.tipo}</span></p>
                  <p className="text-xs"><span className="font-semibold text-gray-600">Origen:</span> <span className="text-gray-900">{selectedCliente.origen}</span></p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-gray-200">
                <h4 className="text-xs font-bold text-[#002D5A] uppercase tracking-wider mb-3 flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  <span>Teléfonos</span>
                </h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {JSON.parse(selectedCliente.telefonos).length > 0 ? (
                    JSON.parse(selectedCliente.telefonos).map((tel, i) => (
                      <p key={i} className="text-xs text-gray-900 bg-white p-1.5 rounded border border-gray-100">{tel.TELEFONO}</p>
                    ))
                  ) : <p className="text-xs text-gray-500 italic">No hay registros</p>}
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-gray-200">
                <h4 className="text-xs font-bold text-[#002D5A] uppercase tracking-wider mb-3 flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  <span>Documentos</span>
                </h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {JSON.parse(selectedCliente.documentos).length > 0 ? (
                    JSON.parse(selectedCliente.documentos).map((doc, i) => (
                      <div key={i} className="text-[10px] bg-white p-2 rounded border border-gray-100">
                        <p className="font-bold text-[#002D5A]">{doc.DOCUMENTO}</p>
                        <p className="text-gray-600">{doc.NUMERO}</p>
                      </div>
                    ))
                  ) : <p className="text-xs text-gray-500 italic">No hay registros</p>}
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-gray-200">
                <h4 className="text-xs font-bold text-[#002D5A] uppercase tracking-wider mb-3 flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.914c-.488.488-1.276.488-1.757 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <span>Direcciones</span>
                </h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {JSON.parse(selectedCliente.direcciones).length > 0 ? (
                    JSON.parse(selectedCliente.direcciones).map((dir, i) => (
                      <p key={i} className="text-[10px] text-gray-900 bg-white p-2 rounded border border-gray-100">{dir.DIRECCION}</p>
                    ))
                  ) : <p className="text-xs text-gray-500 italic">No hay registros</p>}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end pt-4 border-t border-gray-200">
              <button
                onClick={() => setIsVerModalOpen(false)}
                className="px-6 py-2 text-sm font-bold text-white bg-gradient-to-r from-[#002D5A] to-[#003B75] hover:shadow-lg hover:scale-105 rounded-xl transition-all duration-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Editar Cliente */}
      <Modal
        isOpen={isEditarModalOpen}
        onClose={() => {
          setIsEditarModalOpen(false);
          setSelectedCliente(null);
        }}
        title={`Editar Cliente - ${selectedCliente?.id || ""}`}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre</label>
            <input
              type="text"
              value={editForm.nombre}
              onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tipo</label>
            <select
              value={editForm.tipo}
              onChange={(e) => setEditForm({ ...editForm, tipo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="">Seleccionar tipo</option>
              <option value="PERSONA">PERSONA</option>
              <option value="EMPRESA">EMPRESA</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Origen</label>
            <input
              type="text"
              value={editForm.origen}
              onChange={(e) => setEditForm({ ...editForm, origen: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setIsEditarModalOpen(false);
                setSelectedCliente(null);
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
              className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-br from-[#002D5A] to-[#002D5A] hover:shadow-md hover:scale-105 rounded-lg transition-all duration-200 shadow-sm"
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Eliminar Cliente */}
      <Modal
        isOpen={isEliminarModalOpen}
        onClose={() => {
          setIsEliminarModalOpen(false);
          setSelectedCliente(null);
        }}
        title="Confirmar Eliminación"
        size="sm"
      >
        {selectedCliente && (
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              ¿Está seguro de que desea eliminar al cliente <strong>{selectedCliente.nombre}</strong> (ID: {selectedCliente.id})?
            </p>
            <p className="text-xs text-red-600">Esta acción no se puede deshacer.</p>
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setIsEliminarModalOpen(false);
                  setSelectedCliente(null);
                }}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  console.log("Eliminar cliente:", selectedCliente.id);
                  alert("Funcionalidad de eliminación pendiente de implementar");
                  setIsEliminarModalOpen(false);
                  setSelectedCliente(null);
                }}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isHistorialModalOpen}
        onClose={() => {
          setIsHistorialModalOpen(false);
          setSelectedCliente(null);
        }}
        title={`Historial de Ventas - ${selectedCliente?.nombre || ""}`}
        size="full"
      >
        <div className="space-y-4">
          {isHistorialLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#002D5A]"></div>
              <p className="mt-4 text-sm text-gray-600 font-medium">Cargando historial de ventas...</p>
            </div>
          ) : historialVentas.length > 0 ? (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200/60 overflow-hidden">
              <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#002D5A] border-b-2 border-[#E5A017] sticky top-0 z-10">
                      <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ID VENTA</th>
                      <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wider text-white whitespace-nowrap">CLIENTE</th>
                      <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wider text-white whitespace-nowrap">FECHA</th>
                      <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wider text-white whitespace-nowrap">CLASIFICACIÓN</th>
                      <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ASESOR</th>
                      <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wider text-white whitespace-nowrap">N° COMPROBANTE</th>
                      <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wider text-white whitespace-nowrap">REGIÓN</th>
                      <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wider text-white whitespace-nowrap">DISTRITO</th>
                      <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wider text-white whitespace-nowrap">LUGAR</th>
                      <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wider text-white whitespace-nowrap">SALIDA PEDIDO</th>
                      <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wider text-white whitespace-nowrap">OBSERVACIONES</th>
                      <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wider text-white whitespace-nowrap">CANCELADO</th>
                      <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ESTADO</th>
                      <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {historialVentas.map((venta) => (
                      <tr key={venta.ID_VENTA} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-2 whitespace-nowrap text-[9px] font-bold text-[#002D5A]">{venta.ID_VENTA}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[9px] text-gray-700">{venta.CLIENTE}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[9px] text-gray-700">{venta.FECHA}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[9px] text-gray-700">{venta.CLASIFICACION}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[9px] text-gray-700">{venta.ASESOR}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[9px] text-gray-700">{venta.N_COMPROBANTE}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[9px] text-gray-700">{venta.REGION}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[9px] text-gray-700">{venta.DISTRITO}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[9px] text-gray-700">{venta.LUGAR}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[9px] text-gray-700">{venta.SALIDA_DE_PEDIDO}</td>
                        <td className="px-3 py-2 text-[9px] text-gray-700 max-w-[150px] truncate" title={venta.OBSERVACIONES}>{venta.OBSERVACIONES}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${venta.CANCELADO === 'SI' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {venta.CANCELADO}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="px-2 py-0.5 bg-blue-100 text-[#002D5A] rounded text-[8px] font-bold uppercase">
                            {venta.ESTADO}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <button
                            onClick={() => handleVerDetalleVenta(venta)}
                            className="inline-flex items-center space-x-1.5 px-3 py-1 bg-gradient-to-r from-[#002D5A] to-[#003B75] text-white rounded-lg text-[10px] font-bold hover:shadow-md transition-all active:scale-95"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            <span>Ver Detalles</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <svg className="w-12 h-12 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              <p className="text-sm font-medium">No hay historial de ventas disponible</p>
            </div>
          )}
          <div className="flex items-center justify-end pt-4 border-t border-gray-200">
            <button
              onClick={() => setIsHistorialModalOpen(false)}
              className="px-6 py-2 text-sm font-bold text-white bg-gradient-to-r from-[#002D5A] to-[#003B75] rounded-xl hover:shadow-lg transition-all"
            >
              Cerrar
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isProductosModalOpen}
        onClose={() => {
          setIsProductosModalOpen(false);
          setSelectedVenta(null);
        }}
        title={`Detalle de Productos - ${selectedVenta?.ID_VENTA || ""}`}
        size="lg"
      >
        <div className="space-y-4">
          {isProductosLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#002D5A]"></div>
              <p className="mt-4 text-sm text-gray-500">Cargando ítems...</p>
            </div>
          ) : productosVenta.length > 0 ? (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200/60 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#002D5A] border-b-2 border-[#E5A017]">
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">CÓDIGO</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">PRODUCTO</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">CANT.</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">PRECIO</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {productosVenta.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700 font-medium">{item.CODIGO}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{item.PRODUCTO}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{item.CANTIDAD}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">S/ {parseFloat(item.PRECIO_VENTA || 0).toFixed(2)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] font-bold text-[#002D5A]">S/ {parseFloat(item.TOTAL || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t-2 border-gray-200">
                    <tr>
                      <td colSpan="4" className="px-3 py-2 text-right text-[10px] font-bold text-gray-700 uppercase">Total General:</td>
                      <td className="px-3 py-2 text-[10px] font-bold text-[#002D5A]">
                        S/ {productosVenta.reduce((sum, p) => sum + (parseFloat(p.TOTAL) || 0), 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <p className="text-sm font-medium">No hay productos registrados para esta venta</p>
            </div>
          )}
          <div className="flex items-center justify-end pt-4 border-t border-gray-200">
            <button
              onClick={() => setIsProductosModalOpen(false)}
              className="px-6 py-2 text-sm font-bold text-white bg-gradient-to-r from-[#002D5A] to-[#003B75] rounded-xl hover:shadow-lg transition-all"
            >
              Cerrar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

