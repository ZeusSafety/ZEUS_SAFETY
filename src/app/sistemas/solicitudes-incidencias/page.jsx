"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/context/AuthContext";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";

export default function SolicitudesIncidenciasPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [solicitudes] = useState([]);
  const [loadingData] = useState(false);
  const [columnas] = useState([]);
  
  // Filtros
  const [areaRecepcion, setAreaRecepcion] = useState("todas");
  const [colaborador, setColaborador] = useState("");
  const [estado, setEstado] = useState("todos");
  const [mostrarIncidencias, setMostrarIncidencias] = useState(false);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);

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


  // Filtrar solicitudes dinámicamente
  const solicitudesFiltradas = useMemo(() => {
    let filtered = [...solicitudes];

    // Filtrar por área de recepción (buscar en cualquier campo que contenga "area" o "recepcion")
    if (areaRecepcion !== "todas") {
      filtered = filtered.filter(s => {
        const valores = Object.values(s).map(v => String(v).toLowerCase());
        return valores.some(v => v.includes(areaRecepcion.toLowerCase()));
      });
    }

    // Filtrar por colaborador (buscar en cualquier campo de texto)
    if (colaborador.trim()) {
      const term = colaborador.toLowerCase();
      filtered = filtered.filter(s => {
        const valores = Object.values(s).map(v => String(v).toLowerCase());
        return valores.some(v => v.includes(term));
      });
    }

    // Filtrar por estado (buscar en campos que contengan "estado" o "status")
    if (estado !== "todos") {
      filtered = filtered.filter(s => {
        const estadoKey = Object.keys(s).find(k => 
          k.toLowerCase().includes('estado') || k.toLowerCase().includes('status')
        );
        if (estadoKey) {
          return String(s[estadoKey]).toLowerCase() === estado.toLowerCase();
        }
        return false;
      });
    }

    // Filtrar incidencias (buscar en campos que contengan "incidencia")
    if (!mostrarIncidencias) {
      filtered = filtered.filter(s => {
        const incidenciaKey = Object.keys(s).find(k => 
          k.toLowerCase().includes('incidencia')
        );
        if (incidenciaKey) {
          const valor = s[incidenciaKey];
          return !valor || valor === false || valor === 0 || String(valor).toLowerCase() === 'no' || String(valor).toLowerCase() === 'false';
        }
        return true;
      });
    }

    return filtered;
  }, [solicitudes, areaRecepcion, colaborador, estado, mostrarIncidencias]);

  // Calcular paginación
  const totalPages = Math.ceil(solicitudesFiltradas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const solicitudesPaginadas = solicitudesFiltradas.slice(startIndex, endIndex);

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [areaRecepcion, colaborador, estado, mostrarIncidencias]);

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

  const getEstadoBadge = (estado) => {
    if (!estado) return "bg-gray-500 border-gray-600 text-white";
    const estadoStr = String(estado).toLowerCase();
    const estados = {
      "pendiente": "bg-yellow-500 border-yellow-600 text-white",
      "en revisión": "bg-orange-500 border-orange-600 text-white",
      "en revision": "bg-orange-500 border-orange-600 text-white",
      "completado": "bg-green-600 border-green-700 text-white",
      "cancelado": "bg-red-600 border-red-700 text-white",
    };
    return estados[estadoStr] || "bg-gray-500 border-gray-600 text-white";
  };

  // Función para formatear el valor de una celda
  const formatCellValue = (value, key) => {
    if (value === null || value === undefined || value === "") {
      return "-";
    }
    
    // Si es un booleano
    if (typeof value === "boolean") {
      return value ? "SI" : "NO";
    }
    
    // Si es un número
    if (typeof value === "number") {
      return String(value);
    }
    
    // Si es un objeto o array, convertirlo a string JSON
    if (typeof value === "object") {
      return JSON.stringify(value);
    }
    
    return String(value);
  };

  // Función para determinar si un campo es un archivo/URL
  const isFileField = (key) => {
    const keyLower = key.toLowerCase();
    return keyLower.includes('archivo') || 
           keyLower.includes('file') || 
           keyLower.includes('url') || 
           keyLower.includes('enlace') ||
           keyLower.includes('link') ||
           keyLower.includes('informe') ||
           keyLower.includes('respuesta');
  };

  // Función para determinar si un campo es un estado
  const isEstadoField = (key) => {
    const keyLower = key.toLowerCase();
    return keyLower.includes('estado') || keyLower.includes('status');
  };

  // Función para determinar si un campo es booleano
  const isBooleanField = (key, value) => {
    const keyLower = key.toLowerCase();
    return typeof value === "boolean" || 
           keyLower.includes('con_') || 
           keyLower.includes('tiene_') ||
           (typeof value === "string" && (value.toLowerCase() === "si" || value.toLowerCase() === "no"));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <div className="flex h-screen overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className={`flex-1 transition-all duration-300 overflow-y-auto h-full ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
          <div className="p-4 lg:p-8">
            {/* Header con botones */}
            <div className="mb-6 flex items-center gap-3 flex-wrap">
              <button
                onClick={() => router.push("/sistemas")}
                className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Volver
              </button>
              
              <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Procedimientos
              </button>
              
              <button className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md text-sm ml-auto">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Exportar a PDF
              </button>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Área de Recepción
                  </label>
                  <select
                    value={areaRecepcion}
                    onChange={(e) => setAreaRecepcion(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 transition-all duration-200 hover:border-blue-300 bg-white"
                  >
                    <option value="todas">Todas las áreas</option>
                    <option value="SISTEMAS">SISTEMAS</option>
                    <option value="ADMINISTRACION">ADMINISTRACIÓN</option>
                    <option value="GERENCIA">GERENCIA</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Colaborador
                  </label>
                  <input
                    type="text"
                    placeholder="Escribe un nombre..."
                    value={colaborador}
                    onChange={(e) => setColaborador(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 transition-all duration-200 hover:border-blue-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Estado
                  </label>
                  <select
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 transition-all duration-200 hover:border-blue-300 bg-white"
                  >
                    <option value="todos">Todos los estados</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="En Revisión">En Revisión</option>
                    <option value="Completado">Completado</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mostrarIncidencias}
                      onChange={(e) => setMostrarIncidencias(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-semibold text-gray-700">Mostrar Incidencias</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden mb-6">
              {loadingData ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
                  <span className="ml-3 text-gray-600">Cargando datos...</span>
                </div>
              ) : solicitudes.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-2">No hay solicitudes disponibles.</p>
                  <p className="text-xs text-gray-400">Verifica los filtros o contacta al administrador.</p>
                </div>
              ) : solicitudesPaginadas.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-2">No hay solicitudes que coincidan con los filtros seleccionados.</p>
                  <p className="text-xs text-gray-400">Total de solicitudes: {solicitudes.length}</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-blue-700 border-b-2 border-blue-800">
                          {columnas.map((columna) => (
                            <th 
                              key={columna.key} 
                              className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap"
                            >
                              {columna.label}
                            </th>
                          ))}
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                            ACCIONES
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {solicitudesPaginadas.map((solicitud, index) => (
                          <tr key={solicitud.id || solicitud.ID || index} className="hover:bg-slate-200 transition-colors">
                            {columnas.map((columna) => {
                              const value = solicitud[columna.originalKey];
                              const formattedValue = formatCellValue(value, columna.originalKey);
                              
                              return (
                                <td key={columna.key} className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                                  {isFileField(columna.originalKey) ? (
                                    <div className="flex items-center gap-2">
                                      <button className="text-blue-600 hover:text-blue-800">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                      </button>
                                      {value && value !== "-" && value !== "" && value !== null ? (
                                        <button 
                                          onClick={() => window.open(value, '_blank')}
                                          className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-[10px] font-semibold transition-colors"
                                        >
                                          Ver archivo
                                        </button>
                                      ) : (
                                        <button className="px-2 py-1 bg-gray-400 hover:bg-gray-500 text-white rounded text-[10px] font-semibold transition-colors">
                                          Sin archivo
                                        </button>
                                      )}
                                    </div>
                                  ) : isEstadoField(columna.originalKey) ? (
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border-2 ${getEstadoBadge(value)}`}>
                                      {formattedValue}
                                    </span>
                                  ) : isBooleanField(columna.originalKey, value) ? (
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border-2 ${
                                      (value === true || String(value).toLowerCase() === "si" || value === 1) 
                                        ? "bg-green-600 border-green-700 text-white" 
                                        : "bg-red-600 border-red-700 text-white"
                                    }`}>
                                      {(value === true || String(value).toLowerCase() === "si" || value === 1) ? "SI" : "NO"}
                                    </span>
                                  ) : (
                                    <span className={columna.originalKey.toLowerCase().includes('numero') || columna.originalKey.toLowerCase().includes('n°') ? "font-bold" : ""}>
                                      {formattedValue}
                                    </span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="px-3 py-2 whitespace-nowrap">
                              <button className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                <span>Editar</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Paginación */}
                  <div className="bg-slate-200 px-3 py-2 flex items-center justify-between border-t-2 border-slate-300">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1 || totalPages === 0}
                      className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      «
                    </button>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1 || totalPages === 0}
                      className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      &lt;
                    </button>
                    <span className="text-[10px] text-gray-700 font-medium">
                      Página {totalPages > 0 ? currentPage : 0} de {totalPages || 1}
                    </span>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      &gt;
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      »
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

