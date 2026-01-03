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
  const [hoveredPoint, setHoveredPoint] = useState(null);

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
              className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-lg font-medium hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm ripple-effect relative overflow-hidden text-sm group"
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
                  <div className="w-12 h-12 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] rounded-xl flex items-center justify-center text-white shadow-sm">
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
                
                {/* Gráfico de líneas mejorado */}
                <div className="relative bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 sm:p-6 border border-gray-200">
                  <div className="relative h-72 sm:h-96">
                    <svg className="w-full h-full" viewBox="0 0 800 350" preserveAspectRatio="xMidYMid meet">
                      <defs>
                        {/* Gradiente mejorado para el área */}
                        <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#1E63F7" stopOpacity="0.25" />
                          <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.15" />
                          <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.05" />
                        </linearGradient>
                        
                        {/* Gradiente para la línea */}
                        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#1E63F6" />
                          <stop offset="50%" stopColor="#3B82F6" />
                          <stop offset="100%" stopColor="#60A5FA" />
                        </linearGradient>
                        
                        {/* Sombra para la línea */}
                        <filter id="lineShadow" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
                          <feOffset dx="0" dy="2" result="offsetblur"/>
                          <feComponentTransfer>
                            <feFuncA type="linear" slope="0.3"/>
                          </feComponentTransfer>
                          <feMerge>
                            <feMergeNode/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                        
                        {/* Sombra para los puntos */}
                        <filter id="pointShadow" x="-50%" y="-50%" width="200%" height="200%">
                          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
                          <feOffset dx="0" dy="2" result="offsetblur"/>
                          <feComponentTransfer>
                            <feFuncA type="linear" slope="0.4"/>
                          </feComponentTransfer>
                          <feMerge>
                            <feMergeNode/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                      </defs>
                      
                      {/* Grid horizontal lines mejoradas */}
                      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                        <g key={`grid-h-${i}`}>
                          <line
                            x1="70"
                            y1={60 + i * 45}
                            x2="750"
                            y2={60 + i * 45}
                            stroke={i === 0 ? "#D1D5DB" : "#E5E7EB"}
                            strokeWidth={i === 0 ? "1.5" : "1"}
                            strokeDasharray={i === 0 ? "0" : "4,4"}
                          />
                        </g>
                      ))}
                      
                      {/* Línea vertical del eje Y */}
                      <line
                        x1="70"
                        y1="60"
                        x2="70"
                        y2="330"
                        stroke="#D1D5DB"
                        strokeWidth="2"
                      />
                      
                      {/* Línea horizontal del eje X */}
                      <line
                        x1="70"
                        y1="330"
                        x2="750"
                        y2="330"
                        stroke="#D1D5DB"
                        strokeWidth="2"
                      />
                      
                      {/* Y-axis labels mejorados */}
                      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                        <g key={`y-label-${i}`}>
                          <text
                            x="65"
                            y={65 + i * 45}
                            textAnchor="end"
                            className="fill-gray-700 font-semibold"
                            fontSize="11"
                            fontFamily="system-ui, -apple-system, sans-serif"
                          >
                            S/ {(30000 - i * 5000).toLocaleString('es-PE')}
                          </text>
                        </g>
                      ))}
                      
                      {/* X-axis labels mejorados */}
                      {["Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre"].map((month, i) => (
                        <g key={`x-label-${i}`}>
                          <text
                            x={90 + i * 68}
                            y="345"
                            textAnchor="middle"
                            className="fill-gray-700 font-medium"
                            fontSize="11"
                            fontFamily="system-ui, -apple-system, sans-serif"
                          >
                            {month.substring(0, 3)}
                          </text>
                        </g>
                      ))}
                      
                      {/* Área bajo la curva con animación */}
                      <path
                        d="M 90,270 L 158,240 L 226,255 L 294,245 L 362,215 L 430,75 L 498,215 L 566,215 L 634,195 L 702,215 L 702,330 L 90,330 Z"
                        fill="url(#areaGradient)"
                        className="transition-opacity duration-500"
                      />
                      
                      {/* Línea principal con gradiente y sombra */}
                      <path
                        d="M 90,270 L 158,240 L 226,255 L 294,245 L 362,215 L 430,75 L 498,215 L 566,215 L 634,195 L 702,215"
                        fill="none"
                        stroke="url(#lineGradient)"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#lineShadow)"
                        className="transition-all duration-500"
                      />
                      
                      {/* Puntos de datos mejorados con hover */}
                      {[
                        { x: 90, y: 270, value: 5000, month: "Febrero" },
                        { x: 158, y: 240, value: 10000, month: "Marzo" },
                        { x: 226, y: 255, value: 6000, month: "Abril" },
                        { x: 294, y: 245, value: 8000, month: "Mayo" },
                        { x: 362, y: 215, value: 12000, month: "Junio" },
                        { x: 430, y: 75, value: 28000, month: "Julio" },
                        { x: 498, y: 215, value: 11000, month: "Agosto" },
                        { x: 566, y: 215, value: 11000, month: "Septiembre" },
                        { x: 634, y: 195, value: 14000, month: "Octubre" },
                        { x: 702, y: 215, value: 11000, month: "Noviembre" },
                      ].map((point, i) => (
                        <g 
                          key={`point-${i}`} 
                          className="group cursor-pointer"
                          onMouseEnter={() => setHoveredPoint(i)}
                          onMouseLeave={() => setHoveredPoint(null)}
                        >
                          {/* Área de interacción más grande */}
                          <circle
                            cx={point.x}
                            cy={point.y}
                            r="15"
                            fill="transparent"
                            className="cursor-pointer"
                          />
                          {/* Círculo exterior animado */}
                          <circle
                            cx={point.x}
                            cy={point.y}
                            r={hoveredPoint === i ? "12" : "8"}
                            fill="#1E63F7"
                            fillOpacity={hoveredPoint === i ? "0.3" : "0.2"}
                            className="transition-all duration-300"
                          />
                          {/* Punto principal */}
                          <circle
                            cx={point.x}
                            cy={point.y}
                            r={hoveredPoint === i ? "8" : "6"}
                            fill="white"
                            stroke="#1E63F7"
                            strokeWidth={hoveredPoint === i ? "4" : "3"}
                            filter="url(#pointShadow)"
                            className="transition-all duration-300"
                          />
                          {/* Punto interior */}
                          <circle
                            cx={point.x}
                            cy={point.y}
                            r={hoveredPoint === i ? "4" : "3"}
                            fill="#1E63F7"
                            className="transition-all duration-300"
                          />
                          
                          {/* Tooltip */}
                          {hoveredPoint === i && (
                            <g>
                              {/* Fondo del tooltip */}
                              <rect
                                x={point.x - 55}
                                y={point.y - 50}
                                width="110"
                                height="40"
                                rx="8"
                                fill="rgba(30, 41, 59, 0.95)"
                                className="backdrop-blur-sm"
                              />
                              {/* Borde del tooltip */}
                              <rect
                                x={point.x - 55}
                                y={point.y - 50}
                                width="110"
                                height="40"
                                rx="8"
                                fill="none"
                                stroke="#1E63F7"
                                strokeWidth="1.5"
                              />
                              {/* Texto del mes */}
                              <text
                                x={point.x}
                                y={point.y - 32}
                                textAnchor="middle"
                                className="fill-white font-semibold"
                                fontSize="11"
                                fontFamily="system-ui, -apple-system, sans-serif"
                              >
                                {point.month}
                              </text>
                              {/* Texto del valor */}
                              <text
                                x={point.x}
                                y={point.y - 15}
                                textAnchor="middle"
                                className="fill-blue-300 font-bold"
                                fontSize="12"
                                fontFamily="system-ui, -apple-system, sans-serif"
                              >
                                S/ {point.value.toLocaleString('es-PE')}
                              </text>
                              {/* Flecha del tooltip */}
                              <polygon
                                points={`${point.x - 8},${point.y - 10} ${point.x + 8},${point.y - 10} ${point.x},${point.y}`}
                                fill="rgba(30, 41, 59, 0.95)"
                              />
                            </g>
                          )}
                        </g>
                      ))}
                    </svg>
                    
                    {/* Leyenda mejorada */}
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md border border-gray-200">
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-1 bg-gradient-to-r from-[#1E63F7] to-[#60A5FA] rounded-full"></div>
                        <span className="text-xs text-gray-700 font-semibold">Ventas (S/)</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Información adicional debajo del gráfico */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-3 h-3 rounded-full bg-[#1E63F7] shadow-sm"></div>
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
                        <p className="text-xl font-bold text-[#1E63F7] mb-0.5" style={{ fontFamily: 'var(--font-poppins)' }}>
                          S/ 100,986.90
                        </p>
                        <p className="text-xs text-gray-500" style={{ fontFamily: 'var(--font-poppins)' }}>
                          Año actual
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] rounded-xl flex items-center justify-center text-white shadow-sm">
                        <span className="text-lg font-bold">$</span>
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
                        <p className="text-xl font-bold text-[#1E63F7] mb-0.5" style={{ fontFamily: 'var(--font-poppins)' }}>
                          S/ 10,000
                        </p>
                        <p className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>
                          Progreso: 83.3%
                        </p>
                        {/* Progress bar */}
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-gradient-to-r from-[#1E63F7] via-[#1E63F7] to-green-500 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: '83.3%' }}
                          ></div>
                        </div>
                      </div>
                      <div className="w-10 h-10 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] rounded-xl flex items-center justify-center text-white shadow-sm">
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
                      <tr className="bg-blue-700 border-b-2 border-blue-800">
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
                      {currentClientes.length > 0 ? (
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
                                  className="inline-flex items-center justify-center w-8 h-8 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                  title="Ver cliente"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleEditar(cliente.id)}
                                  className="inline-flex items-center justify-center w-8 h-8 bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                  title="Editar cliente"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleEliminar(cliente.id)}
                                  className="inline-flex items-center justify-center w-8 h-8 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                  title="Eliminar cliente"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleHistorial(cliente.id)}
                                  className="inline-flex items-center justify-center w-8 h-8 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
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

