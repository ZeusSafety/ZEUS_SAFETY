"use client";
/* eslint react/no-unescaped-entities: "off" */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../components/context/AuthContext";
import { Header } from "../../../../components/layout/Header";
import { Sidebar } from "../../../../components/layout/Sidebar";
import Modal from "../../../../components/ui/Modal";

export default function IncidenciasImportacionesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redirigir a login si no hay usuario
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Mantener la barra lateral abierta en desktop (>= 1024px) y colapsable en mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    // Estado inicial
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Estados para filtros
  const [filtros, setFiltros] = useState({
    fechaDesde: "2025-11-16",
    fechaHasta: "2025-12-16",
    numeroDespacho: "",
  });

  // Estados para modales
  const [modalDetalles, setModalDetalles] = useState(false);
  const [modalObservaciones, setModalObservaciones] = useState(false);
  const [modalProcedimientos, setModalProcedimientos] = useState(false);
  const [incidenciaSeleccionada, setIncidenciaSeleccionada] = useState(null);

  // Datos de prueba
  const [incidencias] = useState([
    {
      id: 9,
      fechaRegistro: "2025-11-27T14:22:00",
      numeroDespacho: "ZEUS47",
      pdfInicial: "https://example.com/pdf1.pdf",
      pdfIncidencia: null,
      fechaRecepcion: "2025-11-26T19:00:00",
      fechaCorreccion: "2025-11-26T19:00:00",
      tieneIncidencias: true,
      estado: "REVISADO",
      solucionPdf: "https://example.com/solucion1.pdf",
      respondidoPor: "KIMBERLY",
      estadoDespacho: "NO CONCLUIDO",
      fechaRegistroFacturacion: null,
      observacionesFacturacion: null,
      productosAfectados: [
        {
          item: 1,
          unidadMedida: "CAJAS",
          producto: "Guantes Econoflex Rojo 8",
          cantidadInicial: 466,
          cantidadRecibida: 468,
          motivo: "sobrante",
        },
        {
          item: 2,
          unidadMedida: "CAJAS",
          producto: "Guantes Econoflex Rojo 9",
          cantidadInicial: 416,
          cantidadRecibida: 414,
          motivo: "falta",
        },
      ],
      observaciones: "DE ACUERDO A LA IMPORTACION ZEUS47 SE ENCONTRO LO SIGUIENTE:\n1. SE INDICA QUE LOS ITEMS 1, 2, 5 y 7 TIENEN COMO INCIDENCIA FALTANTES Y SOBRANTES.\nPOR FAVOR SE SOLICITA LA REVISION",
    },
    {
      id: 8,
      fechaRegistro: "2025-10-29T21:22:00",
      numeroDespacho: "ZEUS42/ZEUS43/ZEUS49",
      pdfInicial: "https://example.com/pdf2.pdf",
      pdfIncidencia: null,
      fechaRecepcion: "2025-10-28T19:00:00",
      fechaCorreccion: "2025-10-29T19:00:00",
      tieneIncidencias: true,
      estado: "COMPLETADO",
      solucionPdf: "https://example.com/solucion2.pdf",
      respondidoPor: "KIMBERLY",
      estadoDespacho: "CONCLUIDO",
      fechaRegistroFacturacion: "2025-10-30T11:26:00",
      observacionesFacturacion: "ACTA N° 648",
      productosAfectados: [
        {
          item: 1,
          unidadMedida: "CAJAS",
          producto: "Guantes Econoflex Rojo 8",
          cantidadInicial: 466,
          cantidadRecibida: 468,
          motivo: "sobrante",
        },
      ],
      observaciones: "Observaciones de prueba para incidencia 8",
    },
    {
      id: 7,
      fechaRegistro: "2025-10-27T18:48:00",
      numeroDespacho: "ZEUS45",
      pdfInicial: "https://example.com/pdf3.pdf",
      pdfIncidencia: null,
      fechaRecepcion: "2025-10-26T19:00:00",
      fechaCorreccion: "2025-10-27T19:00:00",
      tieneIncidencias: true,
      estado: "COMPLETADO",
      solucionPdf: "https://example.com/solucion3.pdf",
      respondidoPor: "KIMBERLY",
      estadoDespacho: "CONCLUIDO",
      fechaRegistroFacturacion: "2025-10-28T10:53:00",
      observacionesFacturacion: "ACTA N° 647",
      productosAfectados: [],
      observaciones: "Observaciones de prueba para incidencia 7",
    },
    {
      id: 6,
      fechaRegistro: "2025-10-06T11:19:00",
      numeroDespacho: "ZEUS44",
      pdfInicial: "https://example.com/pdf4.pdf",
      pdfIncidencia: null,
      fechaRecepcion: "2025-09-17T19:00:00",
      fechaCorreccion: "2025-10-22T19:00:00",
      tieneIncidencias: true,
      estado: "COMPLETADO",
      solucionPdf: "https://example.com/solucion4.pdf",
      respondidoPor: "KIMBERLY",
      estadoDespacho: "CONCLUIDO",
      fechaRegistroFacturacion: "2025-10-25T15:03:00",
      observacionesFacturacion: "ACTA N° 646",
      productosAfectados: [],
      observaciones: "Observaciones de prueba para incidencia 6",
    },
    {
      id: 5,
      fechaRegistro: "2025-10-06T11:00:00",
      numeroDespacho: "ZEUS39",
      pdfInicial: "https://example.com/pdf5.pdf",
      pdfIncidencia: null,
      fechaRecepcion: "2025-10-27T19:00:00",
      fechaCorreccion: "2025-10-22T19:00:00",
      tieneIncidencias: true,
      estado: "COMPLETADO",
      solucionPdf: "https://example.com/solucion5.pdf",
      respondidoPor: "KIMBERLY",
      estadoDespacho: "CONCLUIDO",
      fechaRegistroFacturacion: "2025-10-25T15:02:00",
      observacionesFacturacion: "ACTA N° 645",
      productosAfectados: [],
      observaciones: "Observaciones de prueba para incidencia 5",
    },
    {
      id: 4,
      fechaRegistro: "2025-10-06T09:27:00",
      numeroDespacho: "ZEUS37/ZEUS38",
      pdfInicial: "https://example.com/pdf6.pdf",
      pdfIncidencia: null,
      fechaRecepcion: "2025-10-26T19:00:00",
      fechaCorreccion: "2025-10-22T19:00:00",
      tieneIncidencias: true,
      estado: "COMPLETADO",
      solucionPdf: "https://example.com/solucion6.pdf",
      respondidoPor: "KIMBERLY",
      estadoDespacho: "CONCLUIDO",
      fechaRegistroFacturacion: "2025-10-25T15:02:00",
      observacionesFacturacion: "ACTA N° 644",
      productosAfectados: [],
      observaciones: "Observaciones de prueba para incidencia 4",
    },
  ]);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const totalPages = Math.ceil(incidencias.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const incidenciasPaginadas = incidencias.slice(startIndex, endIndex);

  // Formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return "N/A";
    try {
      const date = new Date(fecha);
      const dia = String(date.getDate()).padStart(2, "0");
      const mes = String(date.getMonth() + 1).padStart(2, "0");
      const año = date.getFullYear();
      const horas = String(date.getHours()).padStart(2, "0");
      const minutos = String(date.getMinutes()).padStart(2, "0");
      return `${dia}/${mes}/${año}, ${horas}:${minutos}`;
    } catch (e) {
      return fecha;
    }
  };

  // Formatear fecha con AM/PM
  const formatearFechaAMPM = (fecha) => {
    if (!fecha) return "N/A";
    try {
      const date = new Date(fecha);
      const dia = String(date.getDate()).padStart(2, "0");
      const mes = String(date.getMonth() + 1).padStart(2, "0");
      const año = date.getFullYear();
      let horas = date.getHours();
      const minutos = String(date.getMinutes()).padStart(2, "0");
      const ampm = horas >= 12 ? "p. m." : "a. m.";
      horas = horas % 12;
      horas = horas ? horas : 12;
      return `${dia}/${mes}/${año}, ${String(horas).padStart(2, "0")}:${minutos} ${ampm}`;
    } catch (e) {
      return fecha;
    }
  };

  // Manejar ver detalles
  const handleVerDetalles = (incidencia) => {
    setIncidenciaSeleccionada(incidencia);
    setModalDetalles(true);
  };

  // Manejar ver observaciones
  const handleVerObservaciones = (incidencia) => {
    setIncidenciaSeleccionada(incidencia);
    setModalObservaciones(true);
  };

  // Manejar búsqueda
  const handleBuscar = () => {
    // Aquí iría la lógica de búsqueda
    console.log("Buscando con filtros:", filtros);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
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
              onClick={() => router.push("/administracion")}
              className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-lg font-medium hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm ripple-effect relative overflow-hidden text-sm group"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver a Administración</span>
            </button>

            {/* Contenedor principal con fondo blanco */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6 mb-6">
              {/* Filtros de Búsqueda */}
              <div className="mb-6">
                <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                  Filtros de Búsqueda
                </h3>
                <div className="flex items-end gap-4">
                  <div className="w-[160px]">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Fecha Desde:</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={filtros.fechaDesde}
                        onChange={(e) => setFiltros({ ...filtros, fechaDesde: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                      />
                    </div>
                  </div>
                  <div className="w-[160px]">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Fecha Hasta:</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={filtros.fechaHasta}
                        onChange={(e) => setFiltros({ ...filtros, fechaHasta: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Número de Despacho:</label>
                    <input
                      type="text"
                      value={filtros.numeroDespacho}
                      onChange={(e) => setFiltros({ ...filtros, numeroDespacho: e.target.value })}
                      placeholder="Buscar por número de despacho"
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                    />
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={handleBuscar}
                      className="flex items-center space-x-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span>Buscar</span>
                    </button>
                    <button
                      onClick={() => setModalProcedimientos(true)}
                      className="flex items-center space-x-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Procedimientos</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Incidencias Registradas */}
              <div>
                {/* Header y selector de elementos por página */}
                <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Incidencias Registradas
                </h3>
                <div className="flex items-center gap-2 ml-auto">
                  <label className="text-xs font-semibold text-gray-700">Elementos por página:</label>
                  <div className="relative">
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm font-semibold text-gray-900 bg-white hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md appearance-none pr-10 min-w-[100px] bg-gradient-to-br from-white to-gray-50"
                    >
                      <option value={25} className="bg-white text-gray-900 py-2 font-medium">25</option>
                      <option value={50} className="bg-white text-gray-900 py-2 font-medium">50</option>
                      <option value={100} className="bg-white text-gray-900 py-2 font-medium">100</option>
                      <option value={200} className="bg-white text-gray-900 py-2 font-medium">200</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabla y paginación */}
              <div className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                  <thead>
                    <tr className="bg-blue-700 border-b-2 border-blue-800">
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ID Incidencia</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Fecha de Registro</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Número de Despacho</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">PDF Inicial</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">PDF Incidencia</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Ver Detalles</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Fecha de Recepción</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Fecha de Corrección</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Incidencias?</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ESTADO</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Solución PDF</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">RESPONDIDO POR</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ESTADO DESPACHO</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">FECHA REGISTRO FACTURACIÓN</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">OBSERVACIONES FACTURACIÓN</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Actualizar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {incidenciasPaginadas.map((incidencia) => (
                      <tr key={incidencia.id} className="hover:bg-slate-200 transition-colors">
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{incidencia.id}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{formatearFecha(incidencia.fechaRegistro)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] font-bold text-gray-700">{incidencia.numeroDespacho}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] relative" style={{ pointerEvents: 'auto' }}>
                          {incidencia.pdfInicial ? (
                            <div
                              className="pdf-button-container inline-flex items-center space-x-1 px-2.5 py-1 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const url = incidencia.pdfInicial;
                                if (!url || url.trim() === "") {
                                  alert("No hay enlace PDF disponible");
                                  return;
                                }
                                window.open(url, "_blank", "noopener,noreferrer");
                              }}
                              role="button"
                              tabIndex={0}
                            >
                              <svg
                                className="w-4 h-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M6 2C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V7.41421C19 7.149 18.8946 6.89464 18.7071 6.70711L13.2929 1.29289C13.1054 1.10536 12.851 1 12.5858 1H6Z"
                                  stroke="currentColor"
                                  strokeWidth={1.5}
                                  fill="none"
                                />
                                <path
                                  d="M13 1V6H18"
                                  stroke="currentColor"
                                  strokeWidth={1.5}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <text
                                  x="12"
                                  y="15"
                                  fontSize={6}
                                  fill="currentColor"
                                  fontWeight="bold"
                                  textAnchor="middle"
                                  fontFamily="Arial, sans-serif"
                                  letterSpacing="0.3"
                                >
                                  PDF
                                </text>
                              </svg>
                            </div>
                          ) : (
                            <span className="text-gray-400">No disponible</span>
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] relative" style={{ pointerEvents: 'auto' }}>
                          {incidencia.pdfIncidencia ? (
                            <div
                              className="pdf-button-container inline-flex items-center space-x-1 px-2.5 py-1 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const url = incidencia.pdfIncidencia;
                                if (!url || url.trim() === "") {
                                  alert("No hay enlace PDF disponible");
                                  return;
                                }
                                window.open(url, "_blank", "noopener,noreferrer");
                              }}
                              role="button"
                              tabIndex={0}
                            >
                              <svg
                                className="w-4 h-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M6 2C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V7.41421C19 7.149 18.8946 6.89464 18.7071 6.70711L13.2929 1.29289C13.1054 1.10536 12.851 1 12.5858 1H6Z"
                                  stroke="currentColor"
                                  strokeWidth={1.5}
                                  fill="none"
                                />
                                <path
                                  d="M13 1V6H18"
                                  stroke="currentColor"
                                  strokeWidth={1.5}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <text
                                  x="12"
                                  y="15"
                                  fontSize={6}
                                  fill="currentColor"
                                  fontWeight="bold"
                                  textAnchor="middle"
                                  fontFamily="Arial, sans-serif"
                                  letterSpacing="0.3"
                                >
                                  PDF
                                </text>
                              </svg>
                            </div>
                          ) : (
                            <span className="text-gray-400">No disponible</span>
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <button
                            onClick={() => handleVerDetalles(incidencia)}
                            className="flex items-center justify-center w-8 h-8 bg-green-600 hover:bg-green-700 text-white rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{formatearFecha(incidencia.fechaRecepcion)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{formatearFecha(incidencia.fechaCorreccion)}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-600 border-2 border-green-700 text-white">
                            {incidencia.tieneIncidencias ? "SI" : "NO"}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border-2 text-white ${
                            incidencia.estado === "COMPLETADO" 
                              ? "bg-green-600 border-green-700" 
                              : incidencia.estado === "REVISADO"
                              ? "bg-orange-500 border-orange-600"
                              : "bg-gray-500 border-gray-600"
                          }`}>
                            {incidencia.estado}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] relative" style={{ pointerEvents: 'auto' }}>
                          {incidencia.solucionPdf ? (
                            <div
                              className="pdf-button-container inline-flex items-center space-x-1 px-2.5 py-1 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const url = incidencia.solucionPdf;
                                if (!url || url.trim() === "") {
                                  alert("No hay enlace PDF disponible");
                                  return;
                                }
                                window.open(url, "_blank", "noopener,noreferrer");
                              }}
                              role="button"
                              tabIndex={0}
                            >
                              <svg
                                className="w-4 h-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M6 2C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V7.41421C19 7.149 18.8946 6.89464 18.7071 6.70711L13.2929 1.29289C13.1054 1.10536 12.851 1 12.5858 1H6Z"
                                  stroke="currentColor"
                                  strokeWidth={1.5}
                                  fill="none"
                                />
                                <path
                                  d="M13 1V6H18"
                                  stroke="currentColor"
                                  strokeWidth={1.5}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <text
                                  x="12"
                                  y="15"
                                  fontSize={6}
                                  fill="currentColor"
                                  fontWeight="bold"
                                  textAnchor="middle"
                                  fontFamily="Arial, sans-serif"
                                  letterSpacing="0.3"
                                >
                                  PDF
                                </text>
                              </svg>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{incidencia.respondidoPor}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border-2 text-white ${
                            incidencia.estadoDespacho === "CONCLUIDO" 
                              ? "bg-green-600 border-green-700" 
                              : "bg-red-600 border-red-700"
                          }`}>
                            {incidencia.estadoDespacho}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                          {incidencia.fechaRegistroFacturacion ? formatearFechaAMPM(incidencia.fechaRegistroFacturacion) : "N/A"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {incidencia.observacionesFacturacion ? (
                            <button
                              onClick={() => handleVerObservaciones(incidencia)}
                              className="flex items-center justify-center w-8 h-8 bg-orange-600 hover:bg-orange-700 text-white rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          ) : (
                            <span className="text-gray-400 text-[10px]">N/A</span>
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <button className="flex items-center justify-center w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all duration-200 shadow-sm hover:shadow-md">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Paginación */}
              <div className="bg-slate-200 px-3 py-2 flex items-center justify-end border-t-2 border-slate-300">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    «
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    &lt;
                  </button>
                  <span className="text-[10px] text-gray-700 font-medium">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
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
          </div>
          {/* Cierre del contenedor principal de la página (max-w-[95%]) */}
        </div>
      </main>
      </div>

      {/* Modal Ver Detalles */}
      <Modal
        isOpen={modalDetalles}
        onClose={() => {
          setModalDetalles(false);
          setIncidenciaSeleccionada(null);
        }}
        title="Detalles de la Incidencia"
        size="xl"
      >
        {incidenciaSeleccionada && (
          <div className="space-y-6">
            {/* Productos Afectados */}
            <div className="bg-white rounded-xl border-2 border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  Productos Afectados
                </h4>
                <button className="flex items-center space-x-1.5 px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span>Generar PDF</span>
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-blue-700 border-b-2 border-blue-800">
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ITEM</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Unidad de Medida</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Producto</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Cantidad Inicial</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Cantidad Recibida</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Motivo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {incidenciaSeleccionada.productosAfectados && incidenciaSeleccionada.productosAfectados.length > 0 ? (
                      incidenciaSeleccionada.productosAfectados.map((producto, index) => (
                        <tr key={index} className="hover:bg-slate-200 transition-colors">
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{producto.item}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{producto.unidadMedida}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{producto.producto}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{producto.cantidadInicial}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{producto.cantidadRecibida}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{producto.motivo}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-3 py-2 text-center text-[10px] text-gray-500">
                          No hay productos afectados registrados
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Observaciones */}
            <div className="bg-white rounded-xl border-2 border-gray-200 p-4 shadow-sm">
              <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Observaciones
              </h4>
              <textarea
                value={incidenciaSeleccionada.observaciones || ""}
                readOnly
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm text-gray-900 bg-white resize-none"
                rows={6}
                style={{ overflowY: "auto" }}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Observaciones de Facturación */}
      <Modal
        isOpen={modalObservaciones}
        onClose={() => {
          setModalObservaciones(false);
          setIncidenciaSeleccionada(null);
        }}
        title="Observaciones de Facturación"
        size="md"
      >
        {incidenciaSeleccionada && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border-2 border-gray-200 p-4 shadow-sm">
              <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Observaciones
              </h4>
              <textarea
                value={incidenciaSeleccionada.observacionesFacturacion || ""}
                readOnly
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm text-gray-900 bg-white resize-none"
                rows={4}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Procedimientos */}
      <Modal
        isOpen={modalProcedimientos}
        onClose={() => setModalProcedimientos(false)}
        title="Procedimientos - Listado de Incidencias Logísticas"
        size="xl"
      >
        <div className="space-y-6">
          {/* Instrucciones Generales */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-4 shadow-sm">
            <h4 className="text-base font-bold text-gray-900 mb-4">Instrucciones Generales</h4>
            <p className="text-sm text-gray-700 mb-4">
              Bienvenido al sistema de gestión de incidencias logísticas. Esta página le permite revisar y gestionar todas las incidencias registradas en el sistema.
            </p>
            <div className="space-y-3">
              <h5 className="text-sm font-semibold text-gray-900">Funcionalidades Principales:</h5>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
                <li><strong>Filtros de Búsqueda:</strong> Permite filtrar incidencias por fecha y número de despacho</li>
                <li><strong>Vista de Detalles:</strong> Acceso completo a la información de cada incidencia</li>
                <li><strong>Actualización de Datos:</strong> Posibilidad de actualizar información de incidencias</li>
                <li><strong>Visualización de PDFs:</strong> Acceso directo a documentos relacionados</li>
              </ul>
            </div>
          </div>

          {/* Uso de Filtros */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-4 shadow-sm">
            <h4 className="text-base font-bold text-gray-900 mb-4">Uso de Filtros</h4>
            <p className="text-sm text-gray-700 mb-4">Pasos para filtrar incidencias:</p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li><strong>Seleccionar rango de fechas:</strong> Use los campos "Fecha Desde" y "Fecha Hasta" para definir el período de búsqueda</li>
              <li><strong>Buscar por despacho:</strong> Ingrese el número de despacho específico en el campo correspondiente</li>
              <li><strong>Aplicar filtros:</strong> Haga clic en el botón "Buscar" para aplicar los filtros seleccionados</li>
              <li><strong>Limpiar filtros:</strong> Para ver todos los registros, deje los campos vacíos y haga clic en "Buscar"</li>
            </ol>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-800">
                <strong>Consejo:</strong> Los filtros se pueden usar de forma individual o combinada para obtener resultados más específicos.
              </p>
            </div>
          </div>

          {/* Visualización de Detalles */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-4 shadow-sm">
            <h4 className="text-base font-bold text-gray-900 mb-4">Visualización de Detalles</h4>
            <p className="text-sm text-gray-700 mb-4">Para ver los detalles de una incidencia:</p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li><strong>Localizar la incidencia:</strong> Encuentre la incidencia deseada en la tabla</li>
              <li><strong>Acceder a detalles:</strong> Haga clic en el botón <span className="inline-flex items-center justify-center w-6 h-6 bg-green-600 text-white rounded-full text-xs">👁</span> en la columna "Ver Detalles"</li>
              <li><strong>Revisar información:</strong> En el modal se mostrará:
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li>Lista de productos afectados con cantidades y motivos</li>
                  <li>Observaciones detalladas de la incidencia</li>
                  <li>Información completa del registro</li>
                </ul>
              </li>
              <li><strong>Cerrar modal:</strong> Haga clic en la "X" o fuera del modal para cerrarlo</li>
            </ol>
          </div>

          {/* Gestión de Documentos PDF */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-4 shadow-sm">
            <h4 className="text-base font-bold text-gray-900 mb-4">Gestión de Documentos PDF</h4>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2">Acceso a documentos:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                  <li><strong>PDF Inicial:</strong> Documento original del despacho</li>
                  <li><strong>PDF Incidencia:</strong> Documento con la incidencia registrada</li>
                  <li><strong>Visualización:</strong> Los enlaces se abren en una nueva pestaña del navegador</li>
                </ul>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-xs text-yellow-800">
                  <strong>Nota:</strong> Si un PDF no está disponible, se mostrará "No disponible" en lugar del enlace.
                </p>
              </div>
            </div>
          </div>

          {/* Actualización de Incidencias */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-4 shadow-sm">
            <h4 className="text-base font-bold text-gray-900 mb-4">Actualización de Incidencias</h4>
            <p className="text-sm text-gray-700 mb-4">Para actualizar una incidencia:</p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li><strong>Identificar la incidencia:</strong> Localice la incidencia que desea actualizar</li>
              <li><strong>Iniciar actualización:</strong> Haga clic en el botón <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-xs">🔄</span> en la columna "Actualizar"</li>
              <li><strong>Seguir instrucciones:</strong> El sistema le guiará a través del proceso de actualización</li>
            </ol>
            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-xs text-green-800">
                <strong>Importante:</strong> Las actualizaciones se reflejan inmediatamente en el sistema.
              </p>
            </div>
          </div>

          {/* Solución de Problemas */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-4 shadow-sm">
            <h4 className="text-base font-bold text-gray-900 mb-4">Solución de Problemas</h4>
            <p className="text-sm text-gray-700 mb-4">Problemas comunes y soluciones:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
              <li><strong>No se cargan las incidencias:</strong> Verifique su conexión a internet y recargue la página</li>
              <li><strong>Filtros no funcionan:</strong> Asegúrese de que las fechas estén en el formato correcto (YYYY-MM-DD)</li>
              <li><strong>PDFs no se abren:</strong> Verifique que el navegador permita abrir ventanas emergentes</li>
              <li><strong>Modal no se cierra:</strong> Haga clic fuera del modal o en la "X" para cerrarlo</li>
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  );
}

