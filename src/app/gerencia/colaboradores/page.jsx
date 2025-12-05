"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/context/AuthContext";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";
import Modal from "../../../components/ui/Modal";

export default function ColaboradoresPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageInactivos, setCurrentPageInactivos] = useState(1);
  const itemsPerPage = 5;
  const [isPermisosModalOpen, setIsPermisosModalOpen] = useState(false);
  const [isDesactivarModalOpen, setIsDesactivarModalOpen] = useState(false);
  const [isAgregarModalOpen, setIsAgregarModalOpen] = useState(false);
  const [isVerDetallesModalOpen, setIsVerDetallesModalOpen] = useState(false);
  const [selectedColaborador, setSelectedColaborador] = useState(null);
  const [selectedColaboradorCompleto, setSelectedColaboradorCompleto] = useState(null);
  const [datosEditables, setDatosEditables] = useState([]);

  // Inicializar datosEditables cuando se abre el modal
  useEffect(() => {
    if (isVerDetallesModalOpen && selectedColaboradorCompleto) {
      const getValue = (obj, keys) => {
        for (const key of keys) {
          if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
            return obj[key];
          }
        }
        return null;
      };
      
      const datosField = getValue(selectedColaboradorCompleto, ["DATOS", "datos", "Datos"]);
      let datosArray = null;
      
      if (typeof datosField === "string") {
        try {
          datosArray = JSON.parse(datosField);
        } catch (e) {
          console.error("Error al parsear DATOS:", e);
        }
      } else if (Array.isArray(datosField)) {
        datosArray = datosField;
      }
      
      if (datosArray && Array.isArray(datosArray)) {
        setDatosEditables(datosArray);
      } else {
        setDatosEditables([]);
      }
    } else {
      setDatosEditables([]);
    }
  }, [isVerDetallesModalOpen, selectedColaboradorCompleto]);
  const [newColaboradorForm, setNewColaboradorForm] = useState({
    nombre: "",
    apellido: "",
    area: "",
    correo: "",
    fechaCumpleanos: "",
  });
  
  // Estados para datos de la API
  const [colaboradores, setColaboradores] = useState([]);
  const [colaboradoresCompletos, setColaboradoresCompletos] = useState([]); // Datos originales de la API
  const [loadingColaboradores, setLoadingColaboradores] = useState(true);
  const [errorColaboradores, setErrorColaboradores] = useState(null);

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

    // Establecer estado inicial
    handleResize();

    // Escuchar cambios de tamaño
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Función para obtener colaboradores de la API
  const fetchColaboradores = useCallback(async () => {
    try {
      setLoadingColaboradores(true);
      setErrorColaboradores(null);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No se encontró el token de autenticación");
      }

      const response = await fetch("/api/colaboradores", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Error desconocido" }));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Datos recibidos de la API:", data);

      // Guardar los datos originales completos
      setColaboradoresCompletos(Array.isArray(data) ? data : []);

      // Mapear los datos de la API al formato esperado
      // La API puede devolver diferentes estructuras, así que intentamos varias opciones
      const colaboradoresMapeados = Array.isArray(data) ? data.map((colab) => {
        // Intentar obtener los campos con diferentes nombres posibles
        const getValue = (obj, keys) => {
          for (const key of keys) {
            if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
              return obj[key];
            }
          }
          return "";
        };

        // Formatear fecha de cumpleaños
        const fechaNac = getValue(colab, ["fecha_nacimiento", "fechaNacimiento", "fecha_cumpleanos", "fechaCumpleanos", "FECHA_NACIMIENTO", "FECHA_CUMPLEANOS"]);
        let fechaFormateada = "";
        if (fechaNac) {
          try {
            // Intentar parsear diferentes formatos de fecha
            const fecha = new Date(fechaNac);
            if (!isNaN(fecha.getTime())) {
              const dia = String(fecha.getDate()).padStart(2, "0");
              const mes = String(fecha.getMonth() + 1).padStart(2, "0");
              const año = fecha.getFullYear();
              fechaFormateada = `${dia}/${mes}/${año}`;
            } else {
              // Si ya está en formato DD/MM/YYYY, usarlo directamente
              fechaFormateada = fechaNac;
            }
          } catch (e) {
            fechaFormateada = fechaNac;
          }
        }

        // Obtener área - puede estar en un objeto anidado
        let areaValue = getValue(colab, ["area", "AREA", "Area", "departamento", "DEPARTAMENTO", "department", "DEPARTMENT"]);
        if (!areaValue && colab.A && colab.A.NOMBRE) {
          areaValue = colab.A.NOMBRE;
        }
        if (!areaValue && colab.a && colab.a.nombre) {
          areaValue = colab.a.nombre;
        }
        // Buscar en objetos anidados con diferentes estructuras
        if (!areaValue) {
          for (const key in colab) {
            if (typeof colab[key] === "object" && colab[key] !== null) {
              const nestedArea = getValue(colab[key], ["NOMBRE", "nombre", "NOMBRE_AREA", "nombre_area", "AREA", "area"]);
              if (nestedArea) {
                areaValue = nestedArea;
                break;
              }
            }
          }
        }

        // Determinar si está activo
        const estadoValue = getValue(colab, ["activo", "ACTIVO", "Activo", "estado", "ESTADO", "status", "STATUS"]);
        const isActivo = estadoValue !== false && 
                        estadoValue !== "inactivo" && 
                        estadoValue !== "INACTIVO" && 
                        estadoValue !== 0 &&
                        estadoValue !== "0";

        return {
          id: getValue(colab, ["id", "ID", "Id"]) || Math.random().toString(36).substr(2, 9), // Generar ID temporal si no existe
          nombre: getValue(colab, ["nombre", "NOMBRE", "Nombre", "name", "NAME"]) || "",
          apellido: getValue(colab, ["apellido", "APELLIDO", "Apellido", "apellidos", "APELLIDOS", "lastname", "LASTNAME"]) || "",
          area: areaValue || "Sin área asignada",
          correo: getValue(colab, ["correo", "CORREO", "Correo", "email", "EMAIL", "Email", "correo_electronico", "CORREO_ELECTRONICO"]) || "",
          fechaCumpleanos: fechaFormateada,
          activo: isActivo,
        };
      }) : [];

      console.log("Colaboradores mapeados:", colaboradoresMapeados);
      setColaboradores(colaboradoresMapeados);
    } catch (error) {
      console.error("Error al obtener colaboradores:", error);
      setErrorColaboradores(error.message || "Error al obtener colaboradores");
    } finally {
      setLoadingColaboradores(false);
    }
  }, []);

  // Cargar colaboradores al montar el componente
  useEffect(() => {
    if (!loading && user) {
      fetchColaboradores();
    }
  }, [loading, user, fetchColaboradores]);

  const activos = colaboradores.filter(c => c.activo !== false);
  const inactivos = colaboradores.filter(c => c.activo === false);

  const totalPages = Math.ceil(activos.length / itemsPerPage);
  const totalPagesInactivos = Math.ceil(inactivos.length / itemsPerPage);

  const paginatedActivos = activos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const paginatedInactivos = inactivos.slice((currentPageInactivos - 1) * itemsPerPage, currentPageInactivos * itemsPerPage);

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
    <>
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
              className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] text-white rounded-lg font-semibold hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm ripple-effect relative overflow-hidden text-sm group"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver a Gerencia</span>
            </button>

            {/* Sección: Listado de Colaboradores */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6 mb-6">
              <div>
                {/* Header de Sección */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] rounded-xl flex items-center justify-center text-white shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Listado de Colaboradores</h2>
                      <p className="text-sm text-gray-600 mt-1">Gestiona los colaboradores activos del sistema</p>
                    </div>
                  </div>
                  <div className={`flex items-center space-x-2 rounded-lg px-3 py-1.5 ${
                    loadingColaboradores 
                      ? "bg-yellow-50 border border-yellow-200" 
                      : errorColaboradores 
                        ? "bg-red-50 border border-red-200" 
                        : "bg-green-50 border border-green-200"
                  }`}>
                    {loadingColaboradores ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                        <span className="text-sm font-semibold text-yellow-700">Cargando...</span>
                      </>
                    ) : errorColaboradores ? (
                      <>
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span className="text-sm font-semibold text-red-700">Error: {errorColaboradores}</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-semibold text-green-700">API Conectada</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Mensaje de error */}
                {errorColaboradores && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">
                      <strong>Error:</strong> {errorColaboradores}
                    </p>
                    <button
                      onClick={fetchColaboradores}
                      className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                    >
                      Intentar de nuevo
                    </button>
                  </div>
                )}

                {/* Botón Agregar */}
                <button
                  onClick={() => {
                    setNewColaboradorForm({
                      nombre: "",
                      apellido: "",
                      area: "",
                      correo: "",
                      fechaCumpleanos: "",
                    });
                    setIsAgregarModalOpen(true);
                  }}
                  className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] text-white rounded-lg font-semibold hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm active:scale-[0.98] text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Agregar Colaborador</span>
                </button>

                {/* Tabla */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-blue-700 border-b-2 border-blue-800">
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">NOMBRE</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">APELLIDO</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ÁREA</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">CORREO</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">FECHA CUMPLEAÑOS</th>
                          <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ACCIÓN</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {loadingColaboradores ? (
                          <tr>
                            <td colSpan={5} className="px-3 py-8 text-center">
                              <div className="flex items-center justify-center space-x-2">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700"></div>
                                <span className="text-sm text-gray-600">Cargando colaboradores...</span>
                              </div>
                            </td>
                          </tr>
                        ) : paginatedActivos.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-3 py-8 text-center text-sm text-gray-500">
                              No hay colaboradores activos
                            </td>
                          </tr>
                        ) : (
                          paginatedActivos.map((colaborador, index) => {
                            // Encontrar el colaborador completo original
                            const colaboradorCompleto = colaboradoresCompletos.find(c => {
                              const getValue = (obj, keys) => {
                                for (const key of keys) {
                                  if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
                                    return obj[key];
                                  }
                                }
                                return "";
                              };
                              const idOriginal = getValue(c, ["id", "ID", "Id"]);
                              const nombreOriginal = getValue(c, ["nombre", "NOMBRE", "Nombre", "name", "NAME"]);
                              return (idOriginal && idOriginal === colaborador.id) || 
                                     (nombreOriginal && nombreOriginal === colaborador.nombre);
                            }) || colaboradoresCompletos[index] || null;

                            return (
                              <tr key={colaborador.id || `colab-${index}`} className="hover:bg-slate-200 transition-colors">
                                <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{colaborador.nombre}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{colaborador.apellido}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{colaborador.area}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{colaborador.correo}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-center">
                                  <div className="flex items-center justify-center space-x-2">
                                    <button
                                      onClick={() => {
                                        setSelectedColaboradorCompleto(colaboradorCompleto);
                                        setIsVerDetallesModalOpen(true);
                                      }}
                                      className="flex items-center space-x-1 px-2.5 py-1 bg-blue-600 border-2 border-blue-700 hover:bg-blue-700 hover:border-blue-800 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                      <span>Ver Detalles</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSelectedColaborador(colaborador);
                                        setIsPermisosModalOpen(true);
                                      }}
                                      className="flex items-center space-x-1 px-2.5 py-1 bg-cyan-500 border-2 border-cyan-600 hover:bg-cyan-600 hover:border-cyan-700 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                      <span>Permisos</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSelectedColaborador(colaborador);
                                        setIsDesactivarModalOpen(true);
                                      }}
                                      className="flex items-center space-x-1 px-2.5 py-1 bg-orange-600 border-2 border-orange-700 hover:bg-orange-700 hover:border-orange-800 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                      <span>Desactivar</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Paginación */}
                  <div className="bg-slate-200 px-3 py-2 flex items-center justify-between border-t-2 border-slate-300">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      «
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      &lt;
                    </button>
                    <span className="text-[10px] text-gray-700 font-medium">
                      Página {currentPage} de {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
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

            {/* Sección: Colaboradores Inactivos */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">
              <div>
                {/* Header de Sección */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] rounded-xl flex items-center justify-center text-white shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Colaboradores Inactivos</h2>
                      <p className="text-sm text-gray-600 mt-1">Sin acceso al sistema</p>
                    </div>
                  </div>
                  <div className={`flex items-center space-x-2 rounded-lg px-3 py-1.5 ${
                    loadingColaboradores 
                      ? "bg-yellow-50 border border-yellow-200" 
                      : errorColaboradores 
                        ? "bg-red-50 border border-red-200" 
                        : "bg-green-50 border border-green-200"
                  }`}>
                    {loadingColaboradores ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                        <span className="text-sm font-semibold text-yellow-700">Cargando...</span>
                      </>
                    ) : errorColaboradores ? (
                      <>
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span className="text-sm font-semibold text-red-700">Error: {errorColaboradores}</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-semibold text-green-700">API Conectada</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Tabla */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-blue-700 border-b-2 border-blue-800">
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">NOMBRE</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">APELLIDO</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ÁREA</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">CORREO</th>
                          <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ACCIÓN</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {loadingColaboradores ? (
                          <tr>
                            <td colSpan={5} className="px-3 py-8 text-center">
                              <div className="flex items-center justify-center space-x-2">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700"></div>
                                <span className="text-sm text-gray-600">Cargando colaboradores...</span>
                              </div>
                            </td>
                          </tr>
                        ) : paginatedInactivos.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-3 py-8 text-center text-sm text-gray-500">
                              No hay colaboradores inactivos
                            </td>
                          </tr>
                        ) : (
                          paginatedInactivos.map((colaborador, index) => {
                            // Encontrar el colaborador completo original
                            const colaboradorCompleto = colaboradoresCompletos.find(c => {
                              const getValue = (obj, keys) => {
                                for (const key of keys) {
                                  if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
                                    return obj[key];
                                  }
                                }
                                return "";
                              };
                              const idOriginal = getValue(c, ["id", "ID", "Id"]);
                              const nombreOriginal = getValue(c, ["nombre", "NOMBRE", "Nombre", "name", "NAME"]);
                              return (idOriginal && idOriginal === colaborador.id) || 
                                     (nombreOriginal && nombreOriginal === colaborador.nombre);
                            }) || colaboradoresCompletos[colaboradores.length + index] || null;

                            return (
                              <tr key={colaborador.id || `colab-inactivo-${index}`} className="hover:bg-slate-200 transition-colors">
                                <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{colaborador.nombre}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{colaborador.apellido}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{colaborador.area}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{colaborador.correo}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-center">
                                  <div className="flex items-center justify-center space-x-2">
                                    <button
                                      onClick={() => {
                                        setSelectedColaboradorCompleto(colaboradorCompleto);
                                        setIsVerDetallesModalOpen(true);
                                      }}
                                      className="flex items-center space-x-1 px-2.5 py-1 bg-blue-600 border-2 border-blue-700 hover:bg-blue-700 hover:border-blue-800 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                      <span>Ver Detalles</span>
                                    </button>
                                    <button className="flex items-center space-x-1 px-2.5 py-1 bg-cyan-500 border-2 border-cyan-600 hover:bg-cyan-600 hover:border-cyan-700 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                      <span>Permisos</span>
                                    </button>
                                    <button className="flex items-center space-x-1 px-2.5 py-1 bg-green-600 border-2 border-green-700 hover:bg-green-700 hover:border-green-800 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                      </svg>
                                      <span>Activar</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Paginación */}
                  <div className="bg-slate-200 px-3 py-2 flex items-center justify-between border-t-2 border-slate-300">
                    <button
                      onClick={() => setCurrentPageInactivos(1)}
                      disabled={currentPageInactivos === 1}
                      className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      «
                    </button>
                    <button
                      onClick={() => setCurrentPageInactivos(prev => Math.max(1, prev - 1))}
                      disabled={currentPageInactivos === 1}
                      className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      &lt;
                    </button>
                    <span className="text-[10px] text-gray-700 font-medium">
                      Página {currentPageInactivos} de {totalPagesInactivos}
                    </span>
                    <button
                      onClick={() => setCurrentPageInactivos(prev => Math.min(totalPagesInactivos, prev + 1))}
                      disabled={currentPageInactivos === totalPagesInactivos}
                      className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      &gt;
                    </button>
                    <button
                      onClick={() => setCurrentPageInactivos(totalPagesInactivos)}
                      disabled={currentPageInactivos === totalPagesInactivos}
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
      </div>
      <Modal
        isOpen={isPermisosModalOpen}
        onClose={() => {
          setIsPermisosModalOpen(false);
          setSelectedColaborador(null);
        }}
        title="Gestionar Permisos"
        size="lg"
        primaryButtonText="Guardar"
        onPrimaryButtonClick={() => {
          // Aquí iría la lógica para guardar los permisos
          setIsPermisosModalOpen(false);
          setSelectedColaborador(null);
        }}
        secondaryButtonText="Cancelar"
        onSecondaryButtonClick={() => {
          setIsPermisosModalOpen(false);
          setSelectedColaborador(null);
        }}
      >
        {selectedColaborador && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Gestionando permisos para: <strong>{selectedColaborador.nombre} {selectedColaborador.apellido}</strong>
              </p>
              <p className="text-xs text-gray-500">
                Aquí se mostrarían los permisos y opciones de configuración.
              </p>
            </div>
          </div>
        )}
      </Modal>
      <Modal
        isOpen={isDesactivarModalOpen}
        onClose={() => {
          setIsDesactivarModalOpen(false);
          setSelectedColaborador(null);
        }}
        title="Desactivar Colaborador"
        size="md"
        primaryButtonText="Desactivar"
        onPrimaryButtonClick={() => {
          // Aquí iría la lógica para desactivar el colaborador
          setIsDesactivarModalOpen(false);
          setSelectedColaborador(null);
        }}
        secondaryButtonText="Cancelar"
        onSecondaryButtonClick={() => {
          setIsDesactivarModalOpen(false);
          setSelectedColaborador(null);
        }}
      >
        {selectedColaborador && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              ¿Estás seguro de que deseas desactivar a <strong>{selectedColaborador.nombre} {selectedColaborador.apellido}</strong>?
            </p>
            <p className="text-xs text-gray-500">
              El colaborador perderá acceso al sistema pero sus datos se mantendrán.
            </p>
          </div>
        )}
      </Modal>

      {/* Modal Agregar Colaborador */}
      <Modal
        isOpen={isAgregarModalOpen}
        onClose={() => {
          setIsAgregarModalOpen(false);
          setNewColaboradorForm({
            nombre: "",
            apellido: "",
            area: "",
            correo: "",
            fechaCumpleanos: "",
          });
        }}
        title="Agregar Nuevo Colaborador"
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newColaboradorForm.nombre}
                onChange={(e) => setNewColaboradorForm({ ...newColaboradorForm, nombre: e.target.value })}
                placeholder="Nombre"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Apellido <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newColaboradorForm.apellido}
                onChange={(e) => setNewColaboradorForm({ ...newColaboradorForm, apellido: e.target.value })}
                placeholder="Apellido"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Área <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newColaboradorForm.area}
              onChange={(e) => setNewColaboradorForm({ ...newColaboradorForm, area: e.target.value })}
              placeholder="Ej: Administracion, Ventas, Logistica"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Correo <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={newColaboradorForm.correo}
              onChange={(e) => setNewColaboradorForm({ ...newColaboradorForm, correo: e.target.value })}
              placeholder="correo@ejemplo.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Fecha de Cumpleaños <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newColaboradorForm.fechaCumpleanos}
              onChange={(e) => setNewColaboradorForm({ ...newColaboradorForm, fechaCumpleanos: e.target.value })}
              placeholder="DD/MM/YYYY"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setIsAgregarModalOpen(false);
                setNewColaboradorForm({
                  nombre: "",
                  apellido: "",
                  area: "",
                  correo: "",
                  fechaCumpleanos: "",
                });
              }}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                // Validar campos requeridos
                if (!newColaboradorForm.nombre || !newColaboradorForm.apellido || !newColaboradorForm.area || !newColaboradorForm.correo || !newColaboradorForm.fechaCumpleanos) {
                  alert("Por favor, complete todos los campos requeridos");
                  return;
                }
                console.log("Agregar colaborador:", newColaboradorForm);
                alert("Funcionalidad de agregado pendiente de implementar");
                setIsAgregarModalOpen(false);
                setNewColaboradorForm({
                  nombre: "",
                  apellido: "",
                  area: "",
                  correo: "",
                  fechaCumpleanos: "",
                });
              }}
              className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] hover:shadow-md hover:scale-105 rounded-lg transition-all duration-200 shadow-sm"
            >
              Agregar Colaborador
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Ver Detalles */}
      <Modal
        isOpen={isVerDetallesModalOpen}
        onClose={() => {
          setIsVerDetallesModalOpen(false);
          setSelectedColaboradorCompleto(null);
        }}
        title={`Detalles del Colaborador - ${selectedColaboradorCompleto ? (selectedColaboradorCompleto.nombre || selectedColaboradorCompleto.NOMBRE || selectedColaboradorCompleto.name || selectedColaboradorCompleto.NAME || "") : ""}`}
        size="lg"
      >
        {selectedColaboradorCompleto && (
          <div className="space-y-4">
            {/* Función helper para obtener valores */}
            {(() => {
              const getValue = (obj, keys) => {
                for (const key of keys) {
                  if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
                    return obj[key];
                  }
                }
                return null;
              };

              const formatValue = (value) => {
                if (value === null || value === undefined || value === "") {
                  return "No disponible";
                }
                if (typeof value === "object") {
                  return JSON.stringify(value, null, 2);
                }
                return String(value);
              };

              const formatDate = (dateValue) => {
                if (!dateValue) return "No disponible";
                try {
                  const date = new Date(dateValue);
                  if (!isNaN(date.getTime())) {
                    const dia = String(date.getDate()).padStart(2, "0");
                    const mes = String(date.getMonth() + 1).padStart(2, "0");
                    const año = date.getFullYear();
                    return `${dia}/${mes}/${año}`;
                  }
                  return dateValue;
                } catch (e) {
                  return dateValue;
                }
              };

              // Obtener todos los campos del objeto
              const campos = Object.keys(selectedColaboradorCompleto);
              
              // Campos principales a mostrar primero
              const camposPrincipales = [
                { keys: ["id", "ID", "Id"], label: "ID" },
                { keys: ["nombre", "NOMBRE", "Nombre", "name", "NAME"], label: "Nombre" },
                { keys: ["apellido", "APELLIDO", "Apellido", "apellidos", "APELLIDOS", "lastname", "LASTNAME"], label: "Apellido" },
                { keys: ["correo", "CORREO", "Correo", "email", "EMAIL", "Email", "correo_electronico", "CORREO_ELECTRONICO"], label: "Correo Electrónico" },
                { keys: ["fecha_nacimiento", "fechaNacimiento", "fecha_cumpleanos", "fechaCumpleanos", "FECHA_NACIMIENTO", "FECHA_CUMPLEANOS"], label: "Fecha de Nacimiento", isDate: true },
                { keys: ["area", "AREA", "Area", "departamento", "DEPARTAMENTO", "department", "DEPARTMENT"], label: "Área" },
                { keys: ["activo", "ACTIVO", "Activo", "estado", "ESTADO", "status", "STATUS"], label: "Estado" },
              ];

              // Resto de campos (excluyendo DATOS que ya se muestra arriba)
              const camposRestantes = campos.filter(campo => {
                const campoLower = campo.toLowerCase();
                // Excluir DATOS ya que se muestra en su sección especial arriba
                if (campoLower === "datos") {
                  return false;
                }
                const esPrincipal = camposPrincipales.some(cp => 
                  cp.keys.some(key => key.toLowerCase() === campo.toLowerCase())
                );
                return !esPrincipal && typeof selectedColaboradorCompleto[campo] !== "object";
              });

              return (
                <>
                  {/* Campos principales */}
                  <div className="grid grid-cols-2 gap-4">
                    {camposPrincipales.map((campo, index) => {
                      const value = getValue(selectedColaboradorCompleto, campo.keys);
                      const displayValue = campo.isDate ? formatDate(value) : formatValue(value);
                      
                      return (
                        <div key={index}>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            {campo.label}
                          </label>
                          <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                            {displayValue}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Separador */}
                  {camposRestantes.length > 0 && (
                    <>
                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <h3 className="text-sm font-bold text-gray-800 mb-3">Información Adicional</h3>
                      </div>

                      {/* Campos restantes */}
                      <div className="grid grid-cols-2 gap-4">
                        {camposRestantes.map((campo, index) => {
                          const value = selectedColaboradorCompleto[campo];
                          const displayValue = formatValue(value);
                          
                          return (
                            <div key={index}>
                              <label className="block text-sm font-semibold text-gray-700 mb-1">
                                {campo.charAt(0).toUpperCase() + campo.slice(1).replace(/_/g, " ")}
                              </label>
                              <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                                {displayValue}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {/* Campo DATOS especial - Array de teléfonos, correos, etc. */}
                  {(() => {
                    const datosField = getValue(selectedColaboradorCompleto, ["DATOS", "datos", "Datos"]);
                    
                    // Usar datosEditables (ya inicializados en useEffect)
                    const datosParaMostrar = datosEditables;
                    
                    if (datosParaMostrar && Array.isArray(datosParaMostrar) && datosParaMostrar.length > 0) {
                      // Agrupar por MEDIO
                      const agrupados = {};
                      datosParaMostrar.forEach((item, idx) => {
                        if (item && typeof item === "object") {
                          const medio = getValue(item, ["MEDIO", "medio", "Medio"]) || "OTRO";
                          const tipo = getValue(item, ["TIPO", "tipo", "Tipo"]) || "";
                          const nombre = getValue(item, ["NOMBRE", "nombre", "Nombre"]) || "";
                          const contenido = getValue(item, ["CONTENIDO", "contenido", "Contenido"]) || "";
                          
                          if (!agrupados[medio]) {
                            agrupados[medio] = [];
                          }
                          agrupados[medio].push({
                            tipo,
                            nombre,
                            contenido,
                            index: idx,
                            originalItem: item
                          });
                        }
                      });

                      return (
                        <div className="border-t border-gray-200 pt-4 mt-4">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-gray-800">DATOS</h3>
                          </div>
                          {Object.keys(agrupados).map((medio, medioIndex) => (
                            <div key={medioIndex} className="mb-5">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-bold text-blue-800 uppercase border-b border-blue-200 pb-2">
                                  {medio}
                                </h4>
                                <button
                                  onClick={() => {
                                    const nuevoItem = {
                                      TIPO: "",
                                      MEDIO: medio,
                                      NOMBRE: "",
                                      CONTENIDO: ""
                                    };
                                    setDatosEditables([...datosParaMostrar, nuevoItem]);
                                  }}
                                  className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                  </svg>
                                  <span>Agregar</span>
                                </button>
                              </div>
                              <div className="space-y-3">
                                {agrupados[medio].map((item, itemIndex) => (
                                  <div key={itemIndex} className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg p-4 shadow-sm relative">
                                    <button
                                      onClick={() => {
                                        const nuevosDatos = datosParaMostrar.filter((_, idx) => idx !== item.index);
                                        setDatosEditables(nuevosDatos);
                                      }}
                                      className="absolute top-2 right-2 flex items-center space-x-1 px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                                      title="Eliminar"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                      <span>Eliminar</span>
                                    </button>
                                    <div className="space-y-2 pr-8">
                                      {item.tipo && (
                                        <div className="flex items-start">
                                          <span className="text-xs font-bold text-gray-700 min-w-[80px]">Tipo:</span>
                                          <span className="text-xs font-semibold text-gray-900 bg-white px-2 py-1 rounded border border-gray-200">
                                            {item.tipo}
                                          </span>
                                        </div>
                                      )}
                                      {item.nombre && (
                                        <div className="flex items-start">
                                          <span className="text-xs font-bold text-gray-700 min-w-[80px]">Nombre:</span>
                                          <span className="text-xs text-gray-900 bg-white px-2 py-1 rounded border border-gray-200">
                                            {item.nombre}
                                          </span>
                                        </div>
                                      )}
                                      {item.contenido && (
                                        <div className="flex items-start">
                                          <span className="text-xs font-bold text-gray-700 min-w-[80px]">Contenido:</span>
                                          <span className="text-xs font-semibold text-blue-900 bg-white px-2 py-1 rounded border border-blue-300 break-all">
                                            {item.contenido}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Otros objetos anidados (excluyendo DATOS) */}
                  {campos.filter(campo => {
                    const campoLower = campo.toLowerCase();
                    const valor = selectedColaboradorCompleto[campo];
                    // Excluir DATOS (ya se muestra arriba) tanto si es array como objeto
                    if (campoLower === "datos") {
                      return false;
                    }
                    return typeof valor === "object" && 
                           valor !== null &&
                           !Array.isArray(valor);
                  }).map((campo, index) => {
                    const objeto = selectedColaboradorCompleto[campo];
                    const subCampos = Object.keys(objeto);
                    
                    return (
                      <div key={`nested-${index}`} className="border-t border-gray-200 pt-4 mt-4">
                        <h3 className="text-sm font-bold text-gray-800 mb-3">
                          {campo.charAt(0).toUpperCase() + campo.slice(1).replace(/_/g, " ")}
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          {subCampos.map((subCampo, subIndex) => {
                            const value = objeto[subCampo];
                            const displayValue = formatValue(value);
                            
                            return (
                              <div key={subIndex}>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                  {subCampo.charAt(0).toUpperCase() + subCampo.slice(1).replace(/_/g, " ")}
                                </label>
                                <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                                  {displayValue}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </>
              );
            })()}
          </div>
        )}
      </Modal>
    </>
  );
}


