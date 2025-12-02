"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/context/AuthContext";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";
import Modal from "../../../components/ui/Modal";

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
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [editForm, setEditForm] = useState({
    nombre: "",
    tipo: "",
    origen: "",
  });

  // Datos ficticios de clientes
  const [clientes] = useState([
    { id: "70000019", nombre: "PEÑAFIEL YUPANQUI WILTON", tipo: "PERSONA", origen: "META ADS" },
    { id: "967", nombre: "STAGRO PERU SAC", tipo: "EMPRESA", origen: "WHATSAPP" },
    { id: "873", nombre: "INVERSIONES DEL SUR S.A.C.", tipo: "EMPRESA", origen: "META ADS" },
    { id: "70000020", nombre: "GARCIA LOPEZ MARIA", tipo: "PERSONA", origen: "WHATSAPP" },
    { id: "70000021", nombre: "TECNOLOGIA AVANZADA E.I.R.L.", tipo: "EMPRESA", origen: "META ADS" },
    { id: "70000022", nombre: "RODRIGUEZ FERNANDEZ CARLOS", tipo: "PERSONA", origen: "WHATSAPP" },
    { id: "70000023", nombre: "COMERCIALIZADORA NORTE S.A.C.", tipo: "EMPRESA", origen: "META ADS" },
    { id: "70000024", nombre: "MARTINEZ SOTO ANA", tipo: "PERSONA", origen: "WHATSAPP" },
    { id: "70000025", nombre: "DISTRIBUIDORA CENTRAL E.I.R.L.", tipo: "EMPRESA", origen: "META ADS" },
    { id: "70000026", nombre: "SILVA RAMIREZ LUIS", tipo: "PERSONA", origen: "WHATSAPP" },
    { id: "70000027", nombre: "IMPORTADORA PACIFICO S.A.C.", tipo: "EMPRESA", origen: "META ADS" },
    { id: "70000028", nombre: "TORRES VARGAS PATRICIA", tipo: "PERSONA", origen: "WHATSAPP" },
    { id: "70000029", nombre: "LOGISTICA INTEGRAL E.I.R.L.", tipo: "EMPRESA", origen: "META ADS" },
    { id: "70000030", nombre: "HERRERA MENDOZA ROBERTO", tipo: "PERSONA", origen: "WHATSAPP" },
    { id: "70000031", nombre: "CONSTRUCCIONES MODERNAS S.A.C.", tipo: "EMPRESA", origen: "META ADS" },
    { id: "70000032", nombre: "FLORES CASTRO DIANA", tipo: "PERSONA", origen: "WHATSAPP" },
    { id: "70000033", nombre: "AGRICOLA DEL VALLE E.I.R.L.", tipo: "EMPRESA", origen: "META ADS" },
    { id: "70000034", nombre: "MORALES GUTIERREZ FERNANDO", tipo: "PERSONA", origen: "WHATSAPP" },
    { id: "70000035", nombre: "TEXTILES ANDINOS S.A.C.", tipo: "EMPRESA", origen: "META ADS" },
    { id: "70000036", nombre: "VARGAS RUIZ SOFIA", tipo: "PERSONA", origen: "WHATSAPP" },
    { id: "70000037", nombre: "ALIMENTOS PREMIUM E.I.R.L.", tipo: "EMPRESA", origen: "META ADS" },
    { id: "70000038", nombre: "CRUZ DIAZ MIGUEL", tipo: "PERSONA", origen: "WHATSAPP" },
    { id: "70000039", nombre: "FERRETERIA NACIONAL S.A.C.", tipo: "EMPRESA", origen: "META ADS" },
    { id: "70000040", nombre: "RAMOS VELASQUEZ LAURA", tipo: "PERSONA", origen: "WHATSAPP" },
    { id: "70000041", nombre: "ELECTRONICA DIGITAL E.I.R.L.", tipo: "EMPRESA", origen: "META ADS" },
    { id: "70000042", nombre: "JIMENEZ ORTEGA PABLO", tipo: "PERSONA", origen: "WHATSAPP" },
    { id: "70000043", nombre: "FARMACIA SALUD S.A.C.", tipo: "EMPRESA", origen: "META ADS" },
    { id: "70000044", nombre: "CASTRO NAVARRO ELENA", tipo: "PERSONA", origen: "WHATSAPP" },
    { id: "70000045", nombre: "TRANSPORTES RAPIDOS E.I.R.L.", tipo: "EMPRESA", origen: "META ADS" },
    { id: "70000046", nombre: "MENDOZA SANDOVAL RICARDO", tipo: "PERSONA", origen: "WHATSAPP" },
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

  const handleHistorial = (id) => {
    const cliente = clientes.find(c => c.id === id);
    setSelectedCliente(cliente);
    setIsHistorialModalOpen(true);
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

            {/* Dashboard Container */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
              {/* Header de la página */}
              <div className="mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-gray-200">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] rounded-xl flex items-center justify-center text-white shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                      Listado de Clientes por Asesor
                    </h1>
                  </div>
                  
                  {apiConnected && (
                    <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-green-50 border border-green-300 rounded-lg">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-xs sm:text-sm font-semibold text-green-700">API Conectada</span>
                    </div>
                  )}
                </div>
              </div>
              {/* Dashboard - Ventas por Mes */}
              <div className="mb-6 sm:mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">Ventas por Mes</h2>
                  </div>
                  <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-green-50 border border-green-300 rounded-lg">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-xs sm:text-sm font-semibold text-green-700">Cargado</span>
                  </div>
                </div>
                
                {/* Gráfico de líneas */}
                <div className="relative h-64 sm:h-80">
                  <svg className="w-full h-full" viewBox="0 0 800 300" preserveAspectRatio="xMidYMid meet">
                    {/* Grid lines */}
                    <defs>
                      <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.05" />
                      </linearGradient>
                    </defs>
                    
                    {/* Grid horizontal lines */}
                    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                      <line
                        key={`grid-h-${i}`}
                        x1="60"
                        y1={50 + i * 40}
                        x2="740"
                        y2={50 + i * 40}
                        stroke="#E5E7EB"
                        strokeWidth="1"
                      />
                    ))}
                    
                    {/* Y-axis labels */}
                    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                      <text
                        key={`y-label-${i}`}
                        x="50"
                        y={55 + i * 40}
                        textAnchor="end"
                        className="text-xs fill-gray-600"
                        fontSize="12"
                      >
                        S/ {30000 - i * 5000}
                      </text>
                    ))}
                    
                    {/* X-axis labels */}
                    {["Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre"].map((month, i) => (
                      <text
                        key={`x-label-${i}`}
                        x={80 + i * 70}
                        y="280"
                        textAnchor="middle"
                        className="text-xs fill-gray-600"
                        fontSize="11"
                      >
                        {month.substring(0, 3)}
                      </text>
                    ))}
                    
                    {/* Data points and line */}
                    <path
                      d="M 80,250 L 150,220 L 220,240 L 290,230 L 360,200 L 430,60 L 500,200 L 570,200 L 640,180 L 710,200"
                      fill="none"
                      stroke="#3B82F6"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    
                    {/* Area fill */}
                    <path
                      d="M 80,250 L 150,220 L 220,240 L 290,230 L 360,200 L 430,60 L 500,200 L 570,200 L 640,180 L 710,200 L 710,250 L 80,250 Z"
                      fill="url(#areaGradient)"
                    />
                    
                    {/* Data points */}
                    {[
                      { x: 80, y: 250 },
                      { x: 150, y: 220 },
                      { x: 220, y: 240 },
                      { x: 290, y: 230 },
                      { x: 360, y: 200 },
                      { x: 430, y: 60 },
                      { x: 500, y: 200 },
                      { x: 570, y: 200 },
                      { x: 640, y: 180 },
                      { x: 710, y: 200 },
                    ].map((point, i) => (
                      <circle
                        key={`point-${i}`}
                        cx={point.x}
                        cy={point.y}
                        r="5"
                        fill="#3B82F6"
                        stroke="white"
                        strokeWidth="2"
                      />
                    ))}
                  </svg>
                  
                  {/* Legend */}
                  <div className="absolute top-2 right-4 flex items-center space-x-2">
                    <div className="w-4 h-0.5 bg-blue-600"></div>
                    <span className="text-xs text-gray-600 font-medium">Ventas (S/)</span>
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
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Métricas y Comisiones</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {/* Card: Ventas Totales */}
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-md border border-gray-200 p-3 sm:p-4 relative">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1.5">Ventas Totales</p>
                        <p className="text-xl sm:text-2xl font-bold text-blue-900 mb-1">S/ 100,986.90</p>
                        <p className="text-[10px] sm:text-xs text-gray-500">Año actual</p>
                      </div>
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] rounded-xl flex items-center justify-center text-white shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
                        <span className="text-xl sm:text-2xl font-bold">$</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Card: Meta Mensual */}
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-md border border-gray-200 p-3 sm:p-4 relative">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1.5">Meta Mensual</p>
                        <p className="text-xl sm:text-2xl font-bold text-blue-900 mb-1">S/ 10,000</p>
                        <p className="text-[10px] sm:text-xs text-gray-500 mb-1.5">Progreso: 83.3%</p>
                        {/* Progress bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-[#1E63F7] via-[#1E63F7] to-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: '83.3%' }}
                          ></div>
                        </div>
                      </div>
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] rounded-xl flex items-center justify-center text-white shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
                        <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contenedor de Tabla de Clientes */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
              {/* Barra de búsqueda */}
              <div className="mb-4 sm:mb-6">
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
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                  />
                </div>
              </div>

              {/* Tabla de clientes */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-blue-700 border-b-2 border-blue-800">
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                          ID CLIENTE
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                          CLIENTE
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                          TIPO CLIENTE
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                          ORIGEN
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                          ACCIONES
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {currentClientes.length > 0 ? (
                        currentClientes.map((cliente, index) => (
                          <tr key={cliente.id} className="hover:bg-slate-100 transition-colors">
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">
                              {cliente.id}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                              {cliente.nombre}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                              {cliente.tipo}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                              {cliente.origen}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <div className="flex items-center space-x-1 flex-wrap gap-1">
                                <button
                                  onClick={() => handleVer(cliente.id)}
                                  className="flex items-center space-x-1 px-2.5 py-1 bg-cyan-500 border-2 border-cyan-600 hover:bg-cyan-600 hover:border-cyan-700 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  <span>Ver</span>
                                </button>
                                <button
                                  onClick={() => handleEditar(cliente.id)}
                                  className="flex items-center space-x-1 px-2.5 py-1 bg-green-600 border-2 border-green-700 hover:bg-green-700 hover:border-green-800 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  <span>Editar</span>
                                </button>
                                <button
                                  onClick={() => handleEliminar(cliente.id)}
                                  className="flex items-center space-x-1 px-2.5 py-1 bg-red-600 border-2 border-red-700 hover:bg-red-700 hover:border-red-800 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  <span>Eliminar</span>
                                </button>
                                <button
                                  onClick={() => handleHistorial(cliente.id)}
                                  className="flex items-center space-x-1 px-2.5 py-1 bg-purple-600 border-2 border-purple-700 hover:bg-purple-700 hover:border-purple-800 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span>Historial</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="px-3 py-8 text-center text-[10px] text-gray-500">
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

      {/* Modal Ver Cliente */}
      <Modal
        isOpen={isVerModalOpen}
        onClose={() => {
          setIsVerModalOpen(false);
          setSelectedCliente(null);
        }}
        title={`Detalles del Cliente - ${selectedCliente?.id || ""}`}
        size="md"
      >
        {selectedCliente && (
          <div className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">ID</label>
                <p className="text-sm text-gray-900">{selectedCliente.id}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre</label>
                <p className="text-sm text-gray-900">{selectedCliente.nombre}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo</label>
                <p className="text-sm text-gray-900">{selectedCliente.tipo}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Origen</label>
                <p className="text-sm text-gray-900">{selectedCliente.origen}</p>
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
              className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] hover:shadow-md hover:scale-105 rounded-lg transition-all duration-200 shadow-sm"
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

      {/* Modal Historial Cliente */}
      <Modal
        isOpen={isHistorialModalOpen}
        onClose={() => {
          setIsHistorialModalOpen(false);
          setSelectedCliente(null);
        }}
        title={`Historial - ${selectedCliente?.nombre || ""}`}
        size="lg"
      >
        {selectedCliente && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <p>Historial de transacciones y actividades del cliente.</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-500 text-center py-4">
                No hay historial disponible para este cliente.
              </p>
            </div>
            <div className="flex items-center justify-end pt-4 border-t border-gray-200">
              <button
                onClick={() => setIsHistorialModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] hover:shadow-md hover:scale-105 rounded-lg transition-all duration-200 shadow-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

