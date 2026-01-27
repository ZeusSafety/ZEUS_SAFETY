"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/context/AuthContext";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";
import Modal from "../../../components/ui/Modal";

export default function HistorialCotizacionesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Datos de historial
  const [cotizaciones, setCotizaciones] = useState([]);
  const [filteredCotizaciones, setFilteredCotizaciones] = useState([]);
  const [cargandoDatos, setCargandoDatos] = useState(false);

  // Modal para completar datos de cliente (solo cuando se acepta y es cliente NUEVO)
  const [isClienteModalOpen, setIsClienteModalOpen] = useState(false);
  const [clienteModalData, setClienteModalData] = useState({ idCoti: null, nuevoEstado: "" });
  const [tipoCliente, setTipoCliente] = useState("");
  const [canalOrigen, setCanalOrigen] = useState("");

  // Filtros
  const [searchNombre, setSearchNombre] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [filterEstado, setFilterEstado] = useState("");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Obtener token desde localStorage
  const getAuthToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token") || "";
    }
    return "";
  };

  // Redirección si no hay usuario
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
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Cargar historial de cotizaciones
  useEffect(() => {
    const cargarHistorial = async () => {
      const token = getAuthToken();
      if (!token) {
        console.error("No se encontró token de autenticación");
        return;
      }

      setCargandoDatos(true);
      try {
        const response = await fetch(
          "https://cotizaciones2026-2946605267.us-central1.run.app/historial_cotizaciones",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          console.error("Error al cargar historial de cotizaciones:", response.status, response.statusText);
          return;
        }

        const data = await response.json();
        const lista = Array.isArray(data?.data) ? data.data : [];
        setCotizaciones(lista);
        setFilteredCotizaciones(lista);
        setCurrentPage(1);
      } catch (error) {
        console.error("Error al cargar historial de cotizaciones:", error);
      } finally {
        setCargandoDatos(false);
      }
    };

    if (user) {
      cargarHistorial();
    }
  }, [user]);

  // Aplicar filtros cuando cambian filtros o datos
  useEffect(() => {
    let lista = [...cotizaciones];

    // Filtro por nombre de cliente
    if (searchNombre.trim() !== "") {
      const termino = searchNombre.toLowerCase();
      lista = lista.filter((item) =>
        (item.NOMBRE_CLIENTE || "").toLowerCase().includes(termino)
      );
    }

    // Filtro por rango de fechas
    if (fechaInicio) {
      const inicio = new Date(fechaInicio);
      lista = lista.filter((item) => {
        if (!item.FECHA_EMISION) return false;
        const fechaItem = new Date(item.FECHA_EMISION);
        return fechaItem >= inicio;
      });
    }

    if (fechaFin) {
      const fin = new Date(fechaFin);
      // Ajustar fin al final del día
      fin.setHours(23, 59, 59, 999);
      lista = lista.filter((item) => {
        if (!item.FECHA_EMISION) return false;
        const fechaItem = new Date(item.FECHA_EMISION);
        return fechaItem <= fin;
      });
    }

    // Filtro por Estado
    if (filterEstado !== "") {
      lista = lista.filter((item) =>
        (item.ESTADO || "PENDIENTE").toUpperCase() === filterEstado.toUpperCase()
      );
    }

    setFilteredCotizaciones(lista);
    setCurrentPage(1);
  }, [cotizaciones, searchNombre, fechaInicio, fechaFin, filterEstado]);

  // Paginación calculada
  const totalPages = Math.ceil(filteredCotizaciones.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCotizaciones = filteredCotizaciones.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFirstPage = () => {
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLastPage = () => {
    setCurrentPage(totalPages);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLimpiarFiltros = () => {
    setSearchNombre("");
    setFechaInicio("");
    setFechaFin("");
  };

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return "";
    const fecha = new Date(fechaStr);
    if (Number.isNaN(fecha.getTime())) return fechaStr;
    return fecha.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleAbrirPDF = (rutaPdf) => {
    if (!rutaPdf) return;
    const baseUrl = "https://cotizaciones2026-2946605267.us-central1.run.app";
    const urlCompleta = rutaPdf.startsWith("http")
      ? rutaPdf
      : `${baseUrl}${rutaPdf}`;
    window.open(urlCompleta, "_blank");
  };

  const renderEstadoSelector = (item) => {
    const estadoActual = item.ESTADO || "PENDIENTE";

    // Definimos los colores base según el estado
    const getColores = (status) => {
      switch (status.toUpperCase()) {
        case "ACEPTADO":
          return "bg-green-600 border-green-700 text-white";
        case "RECHAZADO":
          return "bg-red-600 border-red-700 text-white";
        default:
          return "bg-yellow-500 border-yellow-600 text-white";
      }
    };

    return (
      <div className="relative inline-block">
        <select
          value={estadoActual}
          onChange={(e) => handleCambiarEstado(item.ID_COTI, e.target.value)}
          className={`
          
          inline-flex items-center px-3 py-1 rounded-full 
          text-[10px] font-bold border-2 transition-all duration-200
          hover:shadow-md active:scale-95 text-center
          ${getColores(estadoActual)}
        `}
          style={{
            textAlignLast: "center", // Centra el texto dentro del select en algunos navegadores
            paddingRight: "0.5rem",   // Espacio para la flechita personalizada si quisieras
          }}
        >
          <option value="PENDIENTE" className="bg-white text-gray-900">PENDIENTE</option>
          <option value="ACEPTADO" className="bg-white text-gray-900">ACEPTADO</option>
          <option value="RECHAZADO" className="bg-white text-gray-900">RECHAZADO</option>
        </select>

        {/* Icono de flechita pequeña para indicar que es desplegable */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 5 5">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    );
  };

  const handleCambiarEstado = async (idCoti, nuevoEstado) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(
        "https://cotizaciones2026-2946605267.us-central1.run.app/actualizar_estado_cotizacion",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id_coti: idCoti,
            estado: nuevoEstado,
          }),
        }
      );

      const data = await response.json();

      // Caso especial: el backend detectó cliente nuevo y solicita datos extra
      if (data?.success && data?.action === "SHOW_MODAL") {
        setClienteModalData({ idCoti, nuevoEstado });
        setTipoCliente("");
        setCanalOrigen("");
        setIsClienteModalOpen(true);
        return;
      }

      if (data.success) {
        // Actualizamos el estado local para que la UI se refresque instantáneamente
        setCotizaciones((prev) =>
          prev.map((item) =>
            item.ID_COTI === idCoti ? { ...item, ESTADO: nuevoEstado } : item
          )
        );
        alert(`Estado actualizado a ${nuevoEstado}`);
      } else {
        alert("Error al actualizar: " + (data.error || "Error desconocido"));
      }
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      alert("Error de conexión al actualizar el estado");
    }
  };

  const handleConfirmarClienteNuevo = async () => {
    const token = getAuthToken();
    if (!token) return;

    if (!clienteModalData?.idCoti || !clienteModalData?.nuevoEstado) {
      alert("No se encontró la cotización a actualizar.");
      return;
    }

    if (!tipoCliente || !canalOrigen) {
      alert("Completa Tipo de Cliente y Canal de Origen.");
      return;
    }

    try {
      const response = await fetch(
        "https://cotizaciones2026-2946605267.us-central1.run.app/actualizar_estado_cotizacion",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id_coti: clienteModalData.idCoti,
            estado: clienteModalData.nuevoEstado,
            tipo_cliente: tipoCliente,
            canal_origen: canalOrigen,
          }),
        }
      );

      const data = await response.json();

      if (data?.success) {
        setCotizaciones((prev) =>
          prev.map((item) =>
            item.ID_COTI === clienteModalData.idCoti
              ? { ...item, ESTADO: clienteModalData.nuevoEstado }
              : item
          )
        );
        setIsClienteModalOpen(false);
        setClienteModalData({ idCoti: null, nuevoEstado: "" });
        setTipoCliente("");
        setCanalOrigen("");
        alert(`Estado actualizado a ${clienteModalData.nuevoEstado}`);
      } else {
        alert("Error al actualizar: " + (data?.error || "Error desconocido"));
      }
    } catch (error) {
      console.error("Error al confirmar cliente nuevo:", error);
      alert("Error de conexión al actualizar el estado");
    }
  };

  const handleCerrarClienteModal = () => {
    setIsClienteModalOpen(false);
    setClienteModalData({ idCoti: null, nuevoEstado: "" });
    setTipoCliente("");
    setCanalOrigen("");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "#F7FAFF" }}
    >
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${sidebarOpen ? "lg:ml-60 ml-0" : "ml-0"
          }`}
      >
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main
          className="flex-1 overflow-y-auto"
          style={{ background: "#F7FAFF" }}
        >
          <div className="max-w-[95%] mx-auto px-4 py-4 sm:py-6">
            {/* Botón Volver */}
            <button
              onClick={() => router.push("/marketing")}
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span>Volver a Marketing</span>
            </button>

            {/* Contenedor Principal */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
              {/* Header de la página */}
              <div className="mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-gray-200">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#002D5A] to-[#002D5A] rounded-xl flex items-center justify-center text-white shadow-sm">
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                      Historial de Cotizaciones
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                      Consulta y filtra las cotizaciones registradas en el
                      sistema.
                    </p>
                  </div>
                </div>
              </div>

              {/* Filtros */}
              <div className="mb-4 sm:mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                      Nombre del Cliente
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg
                          className="w-4 h-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="Buscar por nombre de cliente..."
                        value={searchNombre}
                        onChange={(e) => setSearchNombre(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black-500 focus:border-blue-500 text-xs sm:text-sm text-gray-700"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                      Fecha Inicio
                    </label>
                    <input
                      type="date"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black-500 focus:border-blue-500 text-xs sm:text-sm text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                      Fecha Fin
                    </label>
                    <input
                      type="date"
                      value={fechaFin}
                      onChange={(e) => setFechaFin(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black-500 focus:border-blue-500 text-xs sm:text-sm text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">Filtrar por Estado</label>
                    <div className="flex gap-2">
                      <select
                        value={filterEstado}
                        onChange={(e) => setFilterEstado(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm font-medium text-gray-700 bg-white"
                      >
                        <option value="">TODOS</option>
                        <option value="PENDIENTE">PENDIENTE</option>
                        <option value="ACEPTADO">ACEPTADO</option>
                        <option value="RECHAZADO">RECHAZADO</option>
                      </select>

                      {/* Actualizamos el botón limpiar para que incluya el estado */}
                      <button
                        type="button"
                        onClick={() => {
                          handleLimpiarFiltros();
                          setFilterEstado("");
                        }}
                        className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
                      >
                        Limpiar
                      </button>
                    </div>
                  </div>

                </div>
              </div>
              {/* Tabla de cotizaciones */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-blue-700 border-b-2 border-blue-800 text-center">
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                          FECHA EMISIÓN
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                          CÓD. COTIZACIÓN
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                          CLIENTE
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                          REGIÓN / DISTRITO
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                          ATENDIDO POR
                        </th>
                        <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                          MONTO TOTAL
                        </th>
                        <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                          PDF
                        </th>
                        <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                          ORIGEN
                        </th>
                        <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                          ESTADO
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-center">
                      {cargandoDatos ? (
                        <tr>
                          <td
                            colSpan={9}
                            className="px-3 py-6 text-center text-[10px] sm:text-sm text-gray-500"
                          >
                            <div className="flex items-center justify-center gap-2">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700" />
                              <span>Cargando historial de cotizaciones...</span>
                            </div>
                          </td>
                        </tr>
                      ) : currentCotizaciones.length > 0 ? (
                        currentCotizaciones.map((item) => (
                          <tr
                            key={item.ID_COTI}
                            className="hover:bg-slate-200 transition-colors"
                          >
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                              {formatearFecha(item.FECHA_EMISION)}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">
                              {item.COD_COTIZACION}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                              {item.NOMBRE_CLIENTE}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                              {item.REGION} / {item.DISTRITO}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                              {item.ATENDIDO_POR}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700 text-center">
                              S/{" "}
                              {Number(item.MONTO_TOTAL || 0).toFixed(2)}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-center">
                              {item.RUTA_PDF ? (
                                <button
                                  type="button"
                                  onClick={() => handleAbrirPDF(item.RUTA_PDF)}
                                  className="inline-flex items-center px-3 py-1.5 bg-red-600 border-2 border-red-700 hover:bg-red-700 hover:border-red-800 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                >
                                  <svg
                                    className="w-3.5 h-3.5 mr-1"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M12 11V7m0 4l-2-2m2 2l2-2m-6 8h8a2 2 0 002-2V9.5a1 1 0 00-.293-.707l-4.5-4.5A1 1 0 0012.5 4H8a2 2 0 00-2 2v10a2 2 0 002 2z"
                                    />
                                  </svg>
                                  PDF
                                </button>
                              ) : (
                                <span className="text-[10px] text-gray-400">
                                  Sin PDF
                                </span>
                              )}
                            </td>
                            <td>
                              <span
                                className={`
                                    px-4 py-2 
                                    whitespace-nowrap 
                                    text-sm font-semibold 
                                    text-center 
                                    rounded-md
                                    text-[11px]
                                  ${item.CAMPANIA?.startsWith("CM")
                                    ? "bg-blue-600 text-gray-100" // Campañas publicitarias
                                    : item.CAMPANIA?.startsWith("OR")
                                      ? "bg-green-600 text-white"   // Clientes orgánicos
                                      : "bg-gray-100 text-gray-600" // N/A u otros
                                  }
                                `}
                              >
                                {item.CAMPANIA || "N/A"}
                              </span>
                            </td>

                            <td className="px-3 py-2 whitespace-nowrap text-center">
                              {renderEstadoSelector(item)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={9}
                            className="px-3 py-8 text-center text-[10px] text-gray-500"
                          >
                            No se encontraron cotizaciones con los filtros
                            aplicados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Paginación */}
                {filteredCotizaciones.length > 0 && (
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

              {/* Modal: completar datos de cliente nuevo */}
              <Modal
                isOpen={isClienteModalOpen}
                onClose={handleCerrarClienteModal}
                title="Cliente nuevo detectado"
                primaryButtonText="Guardar y Aceptar"
                secondaryButtonText="Cancelar"
                onPrimaryButtonClick={handleConfirmarClienteNuevo}
                onSecondaryButtonClick={handleCerrarClienteModal}
                size="md"
              >
                <div className="space-y-4">
                  <p className="text-sm text-gray-700">
                    Para registrar este cliente en <b>clientes_ventas</b>, completa los campos faltantes.
                  </p>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                      Tipo de Cliente
                    </label>
                    <select
                      value={tipoCliente}
                      onChange={(e) => setTipoCliente(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-gray-700 bg-white"
                    >
                      <option value="">Seleccione un Tipo de Cliente</option>
                      <option value="PERSONA">PERSONA</option>
                      <option value="EMPRESA">EMPRESA</option>
                      <option value="MAYORISTA">MAYORISTA</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                      Canal de Origen
                    </label>
                    <select
                      value={canalOrigen}
                      onChange={(e) => setCanalOrigen(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-gray-700 bg-white"
                    >
                      <option value="">Seleccione un Canal de Origen</option>
                      <option value="WHATSAPP">WHATSAPP</option>
                      <option value="LLAMADA">LLAMADA</option>
                      <option value="META ADS">META ADS</option>
                      <option value="FACEBOOK">FACEBOOK</option>
                      <option value="TIKTOK">TIKTOK</option>
                      <option value="INSTRAGRAM">INSTRAGRAM</option>
                    </select>
                  </div>
                </div>
              </Modal>
            </div>
          </div>
        </main>
      </div >
    </div >
  );
}


