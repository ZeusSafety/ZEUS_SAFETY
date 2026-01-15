"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/context/AuthContext";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";
import { listarRegistrosCombustible } from "../../../services/movilidadApi";

export default function ListadoMovilidadPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [registros, setRegistros] = useState([]);
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalDescripcion, setModalDescripcion] = useState({ open: false, descripcion: "" });
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 10;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

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

  useEffect(() => {
    if (user) {
      cargarRegistros();
    }
  }, [user]);

  const cargarRegistros = async () => {
    try {
      setLoading(true);
      const data = await listarRegistrosCombustible();
      setRegistros(data || []);
    } catch (error) {
      console.error("Error cargando registros:", error);
      alert("Error al cargar registros: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const registrosFiltrados = vehiculoSeleccionado
    ? registros.filter((r) => r.vehiculo === vehiculoSeleccionado)
    : [];

  // Paginación
  const totalPaginas = Math.ceil(registrosFiltrados.length / registrosPorPagina);
  const indiceInicio = (paginaActual - 1) * registrosPorPagina;
  const indiceFin = indiceInicio + registrosPorPagina;
  const registrosPaginados = registrosFiltrados.slice(indiceInicio, indiceFin);

  useEffect(() => {
    setPaginaActual(1);
  }, [vehiculoSeleccionado]);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("es-PE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const vehiculos = [
    { 
      nombre: "Apolo",
      color: "text-blue-600"
    },
    { 
      nombre: "Ares",
      color: "text-red-600"
    },
    { 
      nombre: "Poseidon",
      color: "text-purple-600"
    },
  ];

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
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
              onClick={() => router.push("/gerencia")}
              className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-blue-700 to-blue-800 text-white rounded-lg font-semibold hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver a Gerencia</span>
            </button>

            {/* Card contenedor blanco */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                  Listado de Movilidad
                </h1>
                <p className="text-sm text-gray-600 mt-1">Seleccione un vehículo para ver sus registros</p>
              </div>

              {/* Cards de Vehículos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {vehiculos.map((vehiculo) => (
                  <button
                    key={vehiculo.nombre}
                    onClick={() => setVehiculoSeleccionado(vehiculo.nombre)}
                    className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                      vehiculoSeleccionado === vehiculo.nombre
                        ? "border-blue-700 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg scale-105"
                        : "border-gray-200 bg-white hover:border-blue-400 hover:shadow-md hover:bg-gray-50"
                    }`}
                  >
                    <div className={`flex justify-center mb-4 ${vehiculoSeleccionado === vehiculo.nombre ? vehiculo.color : "text-gray-400"}`}>
                      <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                      </svg>
                    </div>
                    <h3 className={`text-lg font-bold text-center mb-2 ${vehiculoSeleccionado === vehiculo.nombre ? "text-gray-900" : "text-gray-700"}`}>
                      {vehiculo.nombre}
                    </h3>
                    <p className={`text-sm text-center ${vehiculoSeleccionado === vehiculo.nombre ? "text-blue-700 font-medium" : "text-gray-600"}`}>
                      {registros.filter((r) => r.vehiculo === vehiculo.nombre).length} registros
                    </p>
                  </button>
                ))}
              </div>

              {/* Tabla de Registros */}
              {vehiculoSeleccionado && (
                <div className="mt-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-poppins)' }}>
                    Registros de {vehiculoSeleccionado}
                  </h2>
                  {registrosFiltrados.length === 0 ? (
                    <p className="text-gray-600 text-center py-8">No hay registros para este vehículo</p>
                  ) : (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gradient-to-r from-blue-700 to-blue-800 border-b-2 border-blue-900">
                              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                                Fecha
                              </th>
                              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                                Conductor
                              </th>
                              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                                KM (Inicial/Final)
                              </th>
                              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                                Miembros
                              </th>
                              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                                Limpio
                              </th>
                              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                                Buen Estado
                              </th>
                              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                                Combustible
                              </th>
                              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                                Cochera
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {registrosPaginados.map((registro, idx) => (
                              <tr key={idx} className="hover:bg-blue-50 transition-colors border-b border-gray-100">
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>
                                  {formatDate(registro.fecha || registro.fecha_registro)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] font-medium text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                                  {registro.conductor || "-"}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>
                                  {registro.km_inicial || "-"} / {registro.km_final || "-"}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>
                                  {registro.miembros_vehiculo || "-"}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-center">
                                  {registro.esta_limpio === 1 || registro.esta_limpio === "Si" ? (
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-800">
                                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-800">
                                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                      </svg>
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-center">
                                  {registro.en_buen_estado === 1 || registro.en_buen_estado === "Si" ? (
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-800">
                                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => registro.descripcion_estado && setModalDescripcion({ open: true, descripcion: registro.descripcion_estado })}
                                      className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-800 hover:bg-red-200 transition-colors cursor-pointer"
                                      title={registro.descripcion_estado || "No hay descripción"}
                                    >
                                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                      </svg>
                                    </button>
                                  )}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700">
                                  {registro.tipo_combustible ? (
                                    <div>
                                      <div><strong>Tipo:</strong> {registro.tipo_combustible}</div>
                                      <div><strong>Total:</strong> S/ {registro.gasto_combustible || registro.precio_total || "-"}</div>
                                      {registro.foto_combustible && (
                                        <a
                                          href={registro.foto_combustible}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="mt-1 inline-flex items-center px-2 py-1 bg-blue-600 text-white rounded text-[9px] hover:bg-blue-700"
                                        >
                                          Ver Foto
                                        </a>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700">
                                  {registro.gasto_cochera || registro.monto_pagado ? (
                                    <div>
                                      <div><strong>Monto:</strong> S/ {registro.gasto_cochera || registro.monto_pagado}</div>
                                      {registro.foto_cochera && (
                                        <a
                                          href={registro.foto_cochera}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="mt-1 inline-flex items-center px-2 py-1 bg-blue-600 text-white rounded text-[9px] hover:bg-blue-700"
                                        >
                                          Ver Foto
                                        </a>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {/* Paginación */}
                      {totalPaginas > 1 && (
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 flex items-center justify-between border-t border-gray-200">
                          <button
                            onClick={() => setPaginaActual(1)}
                            disabled={paginaActual === 1}
                            className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                            style={{ fontFamily: 'var(--font-poppins)' }}
                          >
                            «
                          </button>
                          <button
                            onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                            disabled={paginaActual === 1}
                            className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                            style={{ fontFamily: 'var(--font-poppins)' }}
                          >
                            &lt;
                          </button>
                          <span className="text-xs text-gray-700 font-semibold" style={{ fontFamily: 'var(--font-poppins)' }}>
                            Página {paginaActual} de {totalPaginas}
                          </span>
                          <button
                            onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                            disabled={paginaActual === totalPaginas}
                            className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                            style={{ fontFamily: 'var(--font-poppins)' }}
                          >
                            &gt;
                          </button>
                          <button
                            onClick={() => setPaginaActual(totalPaginas)}
                            disabled={paginaActual === totalPaginas}
                            className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                            style={{ fontFamily: 'var(--font-poppins)' }}
                          >
                            »
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modal de Descripción */}
      {modalDescripcion.open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setModalDescripcion({ open: false, descripcion: "" })}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                Descripción del Estado
              </h3>
              <button
                onClick={() => setModalDescripcion({ open: false, descripcion: "" })}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mb-4">
              <p className="text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>
                {modalDescripcion.descripcion}
              </p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setModalDescripcion({ open: false, descripcion: "" })}
                className="px-4 py-2 bg-gradient-to-br from-blue-700 to-blue-800 text-white rounded-lg hover:from-blue-800 hover:to-blue-900 transition-colors"
                style={{ fontFamily: 'var(--font-poppins)' }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
