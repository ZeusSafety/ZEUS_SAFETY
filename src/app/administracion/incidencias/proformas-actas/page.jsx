"use client";
/* eslint react/no-unescaped-entities: "off" */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../components/context/AuthContext";
import { Header } from "../../../../components/layout/Header";
import { Sidebar } from "../../../../components/layout/Sidebar";
import Modal from "../../../../components/ui/Modal";

export default function IncidenciasProformasActasPage() {
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

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Filtros
  const [filtros, setFiltros] = useState({
    verificacion: "TODOS",
    fechaDesde: "",
    fechaHasta: "",
  });

  const handleAplicarFiltros = () => {
    console.log("Aplicando filtros Proformas/Actas:", filtros);
  };

  const handleLimpiarFiltros = () => {
    setFiltros({
      verificacion: "TODOS",
      fechaDesde: "",
      fechaHasta: "",
    });
  };

  // Modal Procedimiento
  const [modalProcedimientoAbierto, setModalProcedimientoAbierto] = useState(false);

  // Datos de prueba para la tabla (toda la información en un solo cuadro)
  const [incidencias] = useState([
    {
      id: 51,
      fechaRegistro: "06-12-2025 05:51:21 PM",
      registradoPor: "JOSEPH",
      mes: "Diciembre",
      encargadoComprobante: "ALVARO",
      fechaEmision: "04/12/2025",
      numeroProforma: "P 23026",
      numeroComprobante: "NV 2194",
      itemsError: true,
      itemsErrorPdfUrl: "https://example.com/items-error-51.pdf",
      responsable: "KIMBERLY",
      area: "FACTURACION",
      tipoIncidencia: "ERROR DE PRODUCTO",
      fechaNotificacion: "06-12-2025 05:59:54 PM",
      solucion: "ACTA",
      observacionesAdicionales: true,
      revisadoPor: "KIMBERLY",
      estadoVerificacion: "NOTIFICADO",
      fechaEnvioArchivo: "10-12-2025 07:17:12 PM",
      archivoSolucion: true,
      archivoSolucionUrl: "https://example.com/solucion-51.pdf",
      fechaCorreccion: "10-12-2025 07:20:11 PM",
      estadoSolucion: "PENDIENTE",
      comprobante: "ACTA 638",
      numeroComprobanteFact: "NV 2194",
      culminado: "NO",
      fechaConcluyente: "",
    },
    {
      id: 50,
      fechaRegistro: "06-12-2025 05:48:51 PM",
      registradoPor: "JOSEPH",
      mes: "Diciembre",
      encargadoComprobante: "JOSE",
      fechaEmision: "04/12/2025",
      numeroProforma: "P 23103",
      numeroComprobante: "F 10203",
      itemsError: true,
      itemsErrorPdfUrl: "https://example.com/items-error-50.pdf",
      responsable: "KIMBERLY",
      area: "FACTURACION",
      tipoIncidencia: "ERROR DE CANTIDAD",
      fechaNotificacion: "06-12-2025 05:58:20 PM",
      solucion: "MODIFICADO",
      observacionesAdicionales: true,
      revisadoPor: "KIMBERLY",
      estadoVerificacion: "NOTIFICADO",
      fechaEnvioArchivo: "10-12-2025 07:12:21 PM",
      archivoSolucion: true,
      archivoSolucionUrl: "https://example.com/solucion-50.pdf",
      fechaCorreccion: "",
      estadoSolucion: "EN PROCESO",
      comprobante: "F 10203",
      numeroComprobanteFact: "F 10203",
      culminado: "NO",
      fechaConcluyente: "",
    },
    {
      id: 49,
      fechaRegistro: "06-12-2025 05:46:28 PM",
      registradoPor: "JOSEPH",
      mes: "Diciembre",
      encargadoComprobante: "LIZETH",
      fechaEmision: "04/12/2025",
      numeroProforma: "P 22999",
      numeroComprobante: "B 884",
      itemsError: true,
      itemsErrorPdfUrl: "https://example.com/items-error-49.pdf",
      responsable: "KIMBERLY",
      area: "FACTURACION",
      tipoIncidencia: "ERROR DE PRODUCTO",
      fechaNotificacion: "06-12-2025 05:57:57 PM",
      solucion: "MODIFICADO",
      observacionesAdicionales: true,
      revisadoPor: "KIMBERLY",
      estadoVerificacion: "NOTIFICADO",
      fechaEnvioArchivo: "10-12-2025 10:04:11 AM",
      archivoSolucion: true,
      archivoSolucionUrl: "https://example.com/solucion-49.pdf",
      fechaCorreccion: "",
      estadoSolucion: "EN PROCESO",
      comprobante: "B 884",
      numeroComprobanteFact: "B 884",
      culminado: "NO",
      fechaConcluyente: "",
    },
  ]);

  // Paginación simple
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const totalPages = Math.ceil(incidencias.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const incidenciasPaginadas = incidencias.slice(startIndex, startIndex + itemsPerPage);

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

        <main
          className="flex-1 overflow-y-auto custom-scrollbar"
          style={{ background: "#F7FAFF" }}
        >
          <div className="max-w-[95%] mx-auto px-4 py-4">
            {/* Botón Volver */}
            <button
              onClick={() => router.push("/administracion")}
              className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-lg font-medium hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm ripple-effect relative overflow-hidden text-sm group"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              <svg
                className="w-4 h-4 group-hover:scale-110 transition-transform duration-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver a Administración</span>
            </button>

            {/* Contenedor principal */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">
              {/* Header azul tipo "Listado de incidencias" */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-blue-700 flex items-center justify-center text-white shadow-sm">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Listado de incidencias y actas
                    </h2>
                    <p className="text-xs text-gray-600">
                      Control de incidencias asociadas a proformas y actas administrativas
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setModalProcedimientoAbierto(true)}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-sm hover:shadow-md transition-all"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span>Ver procedimiento</span>
                </button>
              </div>

              {/* Filtros (select + fechas + botones) */}
              <div className="mb-4 flex items-end gap-3">
                <div className="w-56">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Filtrar por verificación
                  </label>
                  <select
                    value={filtros.verificacion}
                    onChange={(e) =>
                      setFiltros((prev) => ({ ...prev, verificacion: e.target.value }))
                    }
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="TODOS">Todos</option>
                    <option value="NOTIFICADO">Notificado</option>
                    <option value="PENDIENTE">Pendiente</option>
                    <option value="CORREGIDO">Corregido</option>
                  </select>
                </div>
                <div className="w-[160px]">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Desde
                  </label>
                  <input
                    type="date"
                    value={filtros.fechaDesde}
                    onChange={(e) =>
                      setFiltros((prev) => ({ ...prev, fechaDesde: e.target.value }))
                    }
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                </div>
                <div className="w-[160px]">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Hasta
                  </label>
                  <input
                    type="date"
                    value={filtros.fechaHasta}
                    onChange={(e) =>
                      setFiltros((prev) => ({ ...prev, fechaHasta: e.target.value }))
                    }
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={handleAplicarFiltros}
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-sm hover:shadow-md transition-all"
                  >
                    Aplicar filtros
                  </button>
                  <button
                    onClick={handleLimpiarFiltros}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-all"
                  >
                    Limpiar
                  </button>
                  <button className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-sm hover:shadow-md transition-all">
                    Exportar CSV
                  </button>
                  <button className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-sm hover:shadow-md transition-all">
                    Generar reporte
                  </button>
                </div>
              </div>

              {/* Tabla principal (un solo cuadro grande) */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-blue-700 border-b-2 border-blue-800">
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                          ID
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                          Fecha de registro
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                          Registrado por
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                          Mes
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                          Encargado comprobante
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                          Fecha emisión
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                          N° proforma/acta
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                          N° comprobante
                        </th>
                        <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                          Ítems de error
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                          Responsable
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                          Área
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                          Tipo de incidencia
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                          Fecha de notificación
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                          Solución
                        </th>
                        <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                          Obs. adicionales
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                          Revisado por
                        </th>
                        <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                          Estado de verificación
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                          Fecha envío de archivo
                        </th>
                        <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                          Archivo de solución
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                          Fecha de corrección
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                          Estado de la solución
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                          Comprobante
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                          N° de comprobante (Fact.)
                        </th>
                        <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                          Culminado
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                          Fecha concluyente
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {incidenciasPaginadas.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-200 transition-colors">
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">
                            {row.id}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                            {row.fechaRegistro}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                            {row.registradoPor}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                            {row.mes}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                            {row.encargadoComprobante}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                            {row.fechaEmision}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] font-semibold text-gray-800">
                            {row.numeroProforma}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] font-semibold text-gray-800">
                            {row.numeroComprobante}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-center text-[10px] text-gray-700">
                            {row.itemsError ? (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  className="flex items-center justify-center w-7 h-7 bg-cyan-500 border-2 border-cyan-600 hover:bg-cyan-600 hover:border-cyan-700 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                  aria-label="Ver ítems de error"
                                  onClick={() => {
                                    console.log("Ver ítems de error de la incidencia", row.id);
                                  }}
                                >
                                  <svg
                                    className="w-3.5 h-3.5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                    />
                                  </svg>
                                </button>
                                <a
                                  href={row.itemsErrorPdfUrl || "#"}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                                  title="Abrir PDF de ítems de error en nueva pestaña"
                                >
                                  <svg
                                    className="w-3.5 h-3.5"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  PDF
                                </a>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                            {row.responsable}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                            {row.area}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                            {row.tipoIncidencia}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                            {row.fechaNotificacion}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                            {row.solucion}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-center text-[10px]">
                            {row.observacionesAdicionales ? (
                              <button
                                type="button"
                                className="flex items-center justify-center w-7 h-7 bg-cyan-500 border-2 border-cyan-600 hover:bg-cyan-600 hover:border-cyan-700 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                aria-label="Ver observaciones adicionales"
                                onClick={() => {
                                  console.log("Ver observaciones adicionales de la incidencia", row.id);
                                }}
                              >
                                <svg
                                  className="w-3.5 h-3.5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  strokeWidth={2}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  />
                                </svg>
                              </button>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                            {row.revisadoPor}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-center text-[10px]">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-green-500 border-2 border-green-600 text-white">
                              {row.estadoVerificacion}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                            {row.fechaEnvioArchivo}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-center text-[10px]">
                            {row.archivoSolucion ? (
                              <a
                                href={row.archivoSolucionUrl || "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-[10px] font-semibold transition-all duration-200shadow-sm hover:shadow-md"
                                title="Abrir archivo de solución en nueva pestaña"
                              >
                                <svg
                                  className="w-3.5 h-3.5"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                PDF
                              </a>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                            {row.fechaCorreccion || "—"}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                            {row.estadoSolucion}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                            {row.comprobante}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                            {row.numeroComprobanteFact}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-center text-[10px]">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border-2 ${
                                row.culminado === "SI"
                                  ? "bg-green-600 border-green-700 text-white"
                                  : "bg-red-600 border-red-700 text-white"
                              }`}
                            >
                              {row.culminado}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                            {row.fechaConcluyente || "—"}
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
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
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
        </main>
      </div>

      {/* Modal de Procedimiento */}
      <Modal
        isOpen={modalProcedimientoAbierto}
        onClose={() => setModalProcedimientoAbierto(false)}
        title="Procedimiento - Incidencias de Proformas y Actas"
        size="xl"
        primaryButtonText="Cerrar"
        onPrimaryButtonClick={() => setModalProcedimientoAbierto(false)}
      >
        <div className="space-y-5">
          {/* Instrucciones generales */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-4 shadow-sm">
            <h4 className="text-sm font-bold text-gray-900 mb-2">Instrucciones generales</h4>
            <p className="text-sm text-gray-700">
              Esta pantalla concentra todas las incidencias asociadas a proformas y actas
              de facturación. Aquí se controla el flujo completo: registro de la
              incidencia, revisión, envío de archivo de solución y cierre final.
            </p>
          </div>

          {/* Uso de filtros */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-4 shadow-sm">
            <h4 className="text-sm font-bold text-gray-900 mb-2">Uso de filtros</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
              <li>
                <strong>Filtrar por verificación:</strong> permite ver solo incidencias
                notificadas, pendientes o corregidas.
              </li>
              <li>
                <strong>Desde / Hasta:</strong> delimita el rango de fechas de
                notificación o registro que desea revisar.
              </li>
              <li>
                <strong>Aplicar filtros:</strong> ejecuta la búsqueda;{" "}
                <strong>Limpiar</strong> restablece la vista completa.
              </li>
            </ol>
          </div>

          {/* Cómo leer la tabla */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-4 shadow-sm">
            <h4 className="text-sm font-bold text-gray-900 mb-2">
              Cómo leer la tabla de incidencias
            </h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li>
                <strong>Bloque izquierdo:</strong> identifica el registro (ID, fecha,
                usuario, mes, encargado, proforma y comprobante).
              </li>
              <li>
                <strong>Ítems de error:</strong> el icono de ojo y el texto "PDF" indican
                que hay detalle y documento asociado al error.
              </li>
              <li>
                <strong>Bloque central:</strong> muestra la solución propuesta, quién
                revisó y el estado de verificación.
              </li>
              <li>
                <strong>Bloque derecho:</strong> concentra archivo de solución, estado de
                la solución, datos del comprobante y si la incidencia está culminada.
              </li>
            </ul>
          </div>

          {/* Flujo recomendado */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-4 shadow-sm">
            <h4 className="text-sm font-bold text-gray-900 mb-2">
              Flujo recomendado de trabajo
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
              <li>Revisar nuevas incidencias en orden de fecha de registro.</li>
              <li>Confirmar el detalle del error en "Ítems de error".</li>
              <li>Registrar la solución (ACTA, MODIFICADO, UNA COMPRA, etc.).</li>
              <li>
                Adjuntar y enviar el archivo de solución, registrando la fecha de envío.
              </li>
              <li>
                Una vez corregido el comprobante, marcar la solución como{" "}
                <strong>culminada</strong> y registrar la fecha concluyente.
              </li>
            </ol>
          </div>

          {/* Notas y buenas prácticas */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-4 shadow-sm">
            <h4 className="text-sm font-bold text-gray-900 mb-2">
              Notas y buenas prácticas
            </h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li>
                Mantenga siempre actualizado el estado de verificación y solución para
                evitar reprocesos.
              </li>
              <li>
                Verifique que los números de proforma, acta y comprobante coincidan con
                los documentos físicos.
              </li>
              <li>
                Use el estado <strong>"NO"</strong> en Culminado solo como tránsito; lo
                ideal es cerrar todas las incidencias con un{" "}
                <strong>"SI" y fecha concluyente</strong>.
              </li>
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  );
}


