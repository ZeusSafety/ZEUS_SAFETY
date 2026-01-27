"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/context/AuthContext";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";
import Modal from "../../../components/ui/Modal";

export default function PosiblesClientesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [posibles, setPosibles] = useState([]);
  const [cargandoDatos, setCargandoDatos] = useState(false);

  // Modal para completar datos de cliente (solo cuando se cambia a CLIENTE y es cliente NUEVO)
  const [isClienteModalOpen, setIsClienteModalOpen] = useState(false);
  const [clienteModalData, setClienteModalData] = useState({ idCoti: null, nuevoEstadoPosible: "" });
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

  const getAuthToken = () => {
    if (typeof window !== "undefined") return localStorage.getItem("token") || "";
    return "";
  };

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  // Detectar si es desktop y abrir sidebar automáticamente
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(true);
      else setSidebarOpen(false);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const cargar = async () => {
      const token = getAuthToken();
      if (!token) return;

      setCargandoDatos(true);
      try {
        const response = await fetch(
          "https://cotizaciones2026-2946605267.us-central1.run.app/posibles_clientes",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          console.error("Error al cargar posibles clientes:", response.status, response.statusText);
          setPosibles([]);
          return;
        }

        const data = await response.json();
        const lista = Array.isArray(data?.data) ? data.data : [];
        setPosibles(lista);
        setCurrentPage(1);
      } catch (e) {
        console.error("Error al cargar posibles clientes:", e);
        setPosibles([]);
      } finally {
        setCargandoDatos(false);
      }
    };

    if (user) cargar();
  }, [user]);

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
    const urlCompleta = rutaPdf.startsWith("http") ? rutaPdf : `${baseUrl}${rutaPdf}`;
    window.open(urlCompleta, "_blank");
  };

  const posiblesFiltrados = useMemo(() => {
    let lista = [...posibles];

    if (searchNombre.trim() !== "") {
      const termino = searchNombre.toLowerCase();
      lista = lista.filter((item) => (item.NOMBRE_CLIENTE || "").toLowerCase().includes(termino));
    }

    if (fechaInicio) {
      const inicio = new Date(fechaInicio);
      lista = lista.filter((item) => {
        if (!item.FECHA) return false;
        const f = new Date(item.FECHA);
        return f >= inicio;
      });
    }

    if (fechaFin) {
      const fin = new Date(fechaFin);
      fin.setHours(23, 59, 59, 999);
      lista = lista.filter((item) => {
        if (!item.FECHA) return false;
        const f = new Date(item.FECHA);
        return f <= fin;
      });
    }

    if (filterEstado !== "") {
      const estado = filterEstado.toUpperCase();
      lista = lista.filter((item) => (item.ESTADO || "PENDIENTE").toUpperCase() === estado);
    }

    return lista;
  }, [posibles, searchNombre, fechaInicio, fechaFin, filterEstado]);

  const totalPages = Math.ceil(posiblesFiltrados.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const actuales = posiblesFiltrados.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getBadge = (estado) => {
    const e = (estado || "PENDIENTE").toUpperCase();
    if (e === "CLIENTE") return "bg-green-600 border-green-700 text-white";
    if (e === "CLIENTE PERDIDO") return "bg-red-600 border-red-700 text-white";
    return "bg-yellow-500 border-yellow-600 text-white";
  };

  const renderEstadoSelector = (item) => {
    const estadoActual = (item?.ESTADO || "PENDIENTE").toUpperCase();

    return (
      <div className="relative inline-block">
        <select
          value={estadoActual}
          onChange={(e) => handleCambiarEstadoPosible(item, e.target.value)}
          className={`
            inline-flex items-center px-3 py-1 rounded-full
            text-[10px] font-bold border-2 transition-all duration-200
            hover:shadow-md active:scale-95 text-center bg-white
            ${getBadge(estadoActual)}
          `}
          style={{ textAlignLast: "center", paddingRight: "0.5rem" }}
        >
          <option value="PENDIENTE" className="bg-white text-gray-900">PENDIENTE</option>
          <option value="CLIENTE" className="bg-white text-gray-900">CLIENTE</option>
          <option value="CLIENTE PERDIDO" className="bg-white text-gray-900">CLIENTE PERDIDO</option>
        </select>
      </div>
    );
  };

  const mapearEstadoPosibleAHistorial = (estadoPosible) => {
    const e = (estadoPosible || "PENDIENTE").toUpperCase();
    if (e === "CLIENTE") return "ACEPTADO";
    if (e === "CLIENTE PERDIDO") return "RECHAZADO";
    return "PENDIENTE";
  };

  const handleCambiarEstadoPosible = async (item, nuevoEstadoPosible) => {
    const token = getAuthToken();
    if (!token) return;

    const idCoti = item?.ID_COTI_REF;
    if (!idCoti) {
      alert("No se encontró ID de cotización de referencia.");
      return;
    }

    const estadoHistorial = mapearEstadoPosibleAHistorial(nuevoEstadoPosible);

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
            estado: estadoHistorial,
          }),
        }
      );

      const data = await response.json();

      // Cliente nuevo + ACEPTADO => pedir datos extra
      if (data?.success && data?.action === "SHOW_MODAL") {
        setClienteModalData({ idCoti, nuevoEstadoPosible });
        setTipoCliente("");
        setCanalOrigen("");
        setIsClienteModalOpen(true);
        return;
      }

      if (data?.success) {
        setPosibles((prev) =>
          prev.map((p) =>
            p.ID_POSIBLE === item.ID_POSIBLE ? { ...p, ESTADO: nuevoEstadoPosible } : p
          )
        );
        alert(`Estado actualizado a ${nuevoEstadoPosible}`);
      } else {
        alert("Error al actualizar: " + (data?.error || "Error desconocido"));
      }
    } catch (e) {
      console.error("Error al actualizar estado desde posibles clientes:", e);
      alert("Error de conexión al actualizar el estado");
    }
  };

  const handleConfirmarClienteNuevo = async () => {
    const token = getAuthToken();
    if (!token) return;

    if (!clienteModalData?.idCoti || !clienteModalData?.nuevoEstadoPosible) {
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
            estado: mapearEstadoPosibleAHistorial(clienteModalData.nuevoEstadoPosible), // ACEPTADO
            tipo_cliente: tipoCliente,
            canal_origen: canalOrigen,
          }),
        }
      );

      const data = await response.json();

      if (data?.success) {
        setPosibles((prev) =>
          prev.map((p) =>
            p.ID_COTI_REF === clienteModalData.idCoti
              ? { ...p, ESTADO: clienteModalData.nuevoEstadoPosible }
              : p
          )
        );
        setIsClienteModalOpen(false);
        setClienteModalData({ idCoti: null, nuevoEstadoPosible: "" });
        setTipoCliente("");
        setCanalOrigen("");
        alert(`Estado actualizado a ${clienteModalData.nuevoEstadoPosible}`);
      } else {
        alert("Error al actualizar: " + (data?.error || "Error desconocido"));
      }
    } catch (e) {
      console.error("Error al confirmar cliente nuevo (posibles clientes):", e);
      alert("Error de conexión al actualizar el estado");
    }
  };

  const handleCerrarClienteModal = () => {
    setIsClienteModalOpen(false);
    setClienteModalData({ idCoti: null, nuevoEstadoPosible: "" });
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

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#F7FAFF" }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${sidebarOpen ? "lg:ml-60 ml-0" : "ml-0"
          }`}
      >
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto" style={{ background: "#F7FAFF" }}>
          <div className="max-w-[95%] mx-auto px-4 py-4 sm:py-6">
            <button
              onClick={() => router.push("/marketing")}
              className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-lg font-medium hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm ripple-effect relative overflow-hidden text-sm group"
              style={{ fontFamily: "var(--font-poppins)" }}
            >
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver a Marketing</span>
            </button>

            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
              <div className="mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-gray-200">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#002D5A] to-[#002D5A] rounded-xl flex items-center justify-center text-white shadow-sm">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Posibles Clientes</h1>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                      Prospectos generados automáticamente por cotizaciones (CRM).
                    </p>
                  </div>
                </div>
              </div>

              {/* Filtros */}
              <div className="mb-4 sm:mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">Nombre del Cliente</label>
                    <input
                      type="text"
                      placeholder="Buscar por nombre/razón social..."
                      value={searchNombre}
                      onChange={(e) => setSearchNombre(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black-500 focus:border-blue-500 text-xs sm:text-sm text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">Fecha Inicio</label>
                    <input
                      type="date"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black-500 focus:border-blue-500 text-xs sm:text-sm text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">Fecha Fin</label>
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
                        <option value="CLIENTE">CLIENTE</option>
                        <option value="CLIENTE PERDIDO">CLIENTE PERDIDO</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchNombre("");
                          setFechaInicio("");
                          setFechaFin("");
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

              {/* Tabla */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-[#002D5A] to-[#003B75]">
                      <tr>
                        {[
                          "FECHA",
                          "CÓDIGO",
                          "CLIENTE",
                          "CEL",
                          "RUC",
                          "DNI",
                          "REGIÓN",
                          "DISTRITO",
                          "PRODUCTO",
                          "CAMPAÑA",
                          "OBS.",
                          "MONTO",
                          "PDF",
                          "ESTADO",
                        ].map((h) => (
                          <th
                            key={h}
                            className="px-3 py-3 text-left text-[10px] font-bold text-white uppercase tracking-wider whitespace-nowrap"
                            style={{ fontFamily: "var(--font-poppins)" }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {cargandoDatos ? (
                        <tr>
                          <td colSpan={14} className="px-4 py-8 text-center text-sm text-gray-600">
                            Cargando posibles clientes...
                          </td>
                        </tr>
                      ) : actuales.length === 0 ? (
                        <tr>
                          <td colSpan={14} className="px-4 py-8 text-center text-sm text-gray-600">
                            No se encontraron registros.
                          </td>
                        </tr>
                      ) : (
                        actuales.map((item) => (
                          <tr key={item.ID_POSIBLE} className="hover:bg-blue-50/40 transition-colors">
                            <td className="px-3 py-3 text-xs text-gray-700 whitespace-nowrap">{formatearFecha(item.FECHA)}</td>
                            <td className="px-3 py-3 text-xs font-semibold text-gray-900 whitespace-nowrap">{item.COD_COTIZACION_REF || ""}</td>
                            <td className="px-3 py-3 text-xs text-gray-900">{item.NOMBRE_CLIENTE || ""}</td>
                            <td className="px-3 py-3 text-xs text-gray-700 whitespace-nowrap">{item.CEL || ""}</td>
                            <td className="px-3 py-3 text-xs text-gray-700 whitespace-nowrap">{item.RUC || ""}</td>
                            <td className="px-3 py-3 text-xs text-gray-700 whitespace-nowrap">{item.DNI || ""}</td>
                            <td className="px-3 py-3 text-xs text-gray-700 whitespace-nowrap">{item.REGION || ""}</td>
                            <td className="px-3 py-3 text-xs text-gray-700 whitespace-nowrap">{item.DISTRITO || ""}</td>
                            <td className="px-3 py-3 text-xs text-gray-700">{item.PRODUCTO_INTERESADO || ""}</td>
                            <td className="px-3 py-3 text-xs text-gray-700 whitespace-nowrap">{item.CAMPANIA || ""}</td>
                            <td className="px-3 py-3 text-xs text-gray-700">{item.OBSERVACIONES || ""}</td>
                            <td className="px-3 py-3 text-xs text-gray-700 whitespace-nowrap">
                              {typeof item.MONTO_TOTAL === "number" ? item.MONTO_TOTAL.toFixed(2) : ""}
                            </td>
                            <td className="px-3 py-3 text-xs whitespace-nowrap">
                              {item.RUTA_PDF ? (
                                <button
                                  type="button"
                                  onClick={() => handleAbrirPDF(item.RUTA_PDF)}
                                  className="px-2 py-1 rounded-md text-white text-[11px] font-semibold bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 transition-all"
                                >
                                  Abrir
                                </button>
                              ) : (
                                <span className="text-gray-400 text-[11px]">—</span>
                              )}
                            </td>
                            <td className="px-3 py-3 text-xs whitespace-nowrap">
                              {renderEstadoSelector(item)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Paginación */}
              <div className="mt-4 flex items-center justify-between">
                <div className="text-xs text-gray-600">
                  Página <span className="font-semibold">{currentPage}</span> de{" "}
                  <span className="font-semibold">{totalPages}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-xs font-semibold text-gray-700 disabled:opacity-50"
                  >
                    {"<<"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-xs font-semibold text-gray-700 disabled:opacity-50"
                  >
                    {"<"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-xs font-semibold text-gray-700 disabled:opacity-50"
                  >
                    {">"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-xs font-semibold text-gray-700 disabled:opacity-50"
                  >
                    {">>"}
                  </button>
                </div>
              </div>

              {/* Modal: completar datos de cliente nuevo */}
              <Modal
                isOpen={isClienteModalOpen}
                onClose={handleCerrarClienteModal}
                title="Cliente nuevo detectado"
                primaryButtonText="Guardar y Convertir"
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
      </div>
    </div>
  );
}


