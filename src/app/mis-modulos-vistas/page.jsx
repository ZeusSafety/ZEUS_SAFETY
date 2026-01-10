"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "../../components/layout/Header";
import { Sidebar } from "../../components/layout/Sidebar";
import { useAuth } from "../../components/context/AuthContext";

export default function MisModulosVistasPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modulos, setModulos] = useState([]);
  const [subVistas, setSubVistas] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedModule, setSelectedModule] = useState(null); // Nuevo estado para el filtro

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

  // Cargar módulos y vistas
  useEffect(() => {
    if (user) {
      cargarModulosVistas();
    }
  }, [user]);

  const cargarModulosVistas = async () => {
    try {
      setLoadingData(true);
      const username = user?.name || user?.email || user?.id || "hervinzeus";

      const response = await fetch(
        `https://api-login-accesos-2946605267.us-central1.run.app?metodo=get_permissions&user=${encodeURIComponent(username)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Mapear módulos
      const modulosData = Array.isArray(data.modulos) ? data.modulos.map((mod) => ({
        id: mod.NOMBRE || mod.nombre || mod.Nombre,
        nombre: mod.NOMBRE || mod.nombre || mod.Nombre,
      })) : [];

      setModulos(modulosData);

      // Función auxiliar para adivinar el área basada en el nombre
      const detectarModulo = (nombreVista) => {
        const nombre = nombreVista?.toUpperCase() || "";

        // Mapeo directo de palabras clave a módulos
        if (nombre.includes("IMPORT") || nombre.includes("ADUANA")) return "IMPORTACION";
        if (nombre.includes("LOGISTICA") || nombre.includes("ALMACEN")) return "LOGISTICA";
        if (nombre.includes("MARKETING") || nombre.includes("CLIENTE")) return "MARKETING";
        if (nombre.includes("GERENCIA")) return "GERENCIA";
        if (nombre.includes("SISTEMAS") || nombre.includes("USUARIO") || nombre.includes("CONFIG")) return "SISTEMAS";
        if (nombre.includes("FACTURACION") || nombre.includes("COBRANZA")) return "FACTURACION";
        if (nombre.includes("ADMIN")) return "ADMINISTRACION";
        if (nombre.includes("RRHH") || nombre.includes("PERSONAL") || nombre.includes("HUMANOS")) return "RECURSOS HUMANOS";
        if (nombre.includes("VENTA") || nombre.includes("PROFORMA") || nombre.includes("COTIZACION") || nombre.includes("CAJA")) return "VENTAS";

        return "OTROS";
      };

      // Mapear sub_vistas asignando módulo si no tienen area
      const subVistasData = Array.isArray(data.sub_vistas) ? data.sub_vistas.map((vista) => {
        const nombreVista = vista.NOMBRE || vista.nombre || vista.Nombre;
        const areaOriginal = vista.AREA || vista.area;
        const areaDetectada = areaOriginal || detectarModulo(nombreVista);

        return {
          id: vista.ID_SUB_VISTAS || vista.id || vista.ID,
          nombre: nombreVista,
          area: areaDetectada,
        };
      }) : [];

      setSubVistas(subVistasData);

      // No seleccionar ningún módulo por defecto para que el usuario elija
      // if (modulosData.length > 0) {
      //   setSelectedModule(modulosData[0]);
      // }
    } catch (error) {
      console.error("Error al obtener módulos y vistas:", error);
      setModulos([]);
      setSubVistas([]);
    } finally {
      setLoadingData(false);
    }
  };

  const getModuloIcon = (nombreModulo) => {
    const iconos = {
      "GERENCIA": "shield",
      "ADMINISTRACION": "user-gear",
      "IMPORTACION": "ship",
      "LOGISTICA": "truck",
      "FACTURACION": "chart",
      "MARKETING": "megaphone",
      "SISTEMAS": "gears",
      "RECURSOS HUMANOS": "users",
      "VENTAS": "document",
    };
    return iconos[nombreModulo?.toUpperCase()] || "shield";
  };

  const getIcon = (iconName) => {
    const icons = {
      shield: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      "user-gear": (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      ship: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      truck: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
        </svg>
      ),
      document: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      megaphone: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      ),
      gears: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      users: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      chart: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    };

    return icons[iconName] || icons.shield;
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
    <div className="flex h-screen overflow-hidden" style={{ background: '#F7FAFF' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${sidebarOpen ? "lg:ml-60 ml-0" : "ml-0"
          }`}
      >
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto custom-scrollbar" style={{ background: '#F7FAFF' }}>
          <div className="max-w-[95%] mx-auto px-4 py-4">
            {/* Botón Volver */}
            <button
              onClick={() => router.push("/perfil")}
              className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-lg font-medium hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm text-sm group"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver</span>
            </button>

            {/* Contenedor principal */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-xl flex items-center justify-center text-white shadow-sm">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'var(--font-poppins)' }}>Mis Módulos y Vistas</h1>
                    <p className="text-sm text-gray-600 font-medium mt-0.5" style={{ fontFamily: 'var(--font-poppins)' }}>Módulos y vistas asignados a tu cuenta</p>
                  </div>
                </div>
              </div>

              {loadingData ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Módulos */}
                  {/* Módulos */}
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-poppins)' }}>Módulos Habilitados</h2>
                    {modulos.length === 0 ? (
                      <p className="text-gray-500 text-sm" style={{ fontFamily: 'var(--font-poppins)' }}>No tienes módulos asignados</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {modulos.map((modulo) => (
                          <div
                            key={modulo.id}
                            onClick={() => setSelectedModule(modulo)}
                            className={`bg-white rounded-lg border p-4 cursor-pointer transition-all duration-200 ${selectedModule?.id === modulo.id
                              ? "border-blue-500 ring-2 ring-blue-100 shadow-md transform scale-[1.02]"
                              : "border-gray-200 hover:shadow-md hover:border-blue-300"
                              }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0 transition-colors duration-200 ${selectedModule?.id === modulo.id
                                ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white"
                                : "bg-blue-100 text-blue-600"
                                }`}>
                                {getIcon(getModuloIcon(modulo.nombre))}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className={`text-sm font-medium truncate ${selectedModule?.id === modulo.id ? "text-blue-900" : "text-gray-900"
                                  }`} style={{ fontFamily: 'var(--font-poppins)' }}>{modulo.nombre}</h3>
                                <p className="text-xs text-gray-500 font-normal" style={{ fontFamily: 'var(--font-poppins)' }}>
                                  {selectedModule?.id === modulo.id ? "Seleccionado" : "Haz clic para ver vistas"}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Sub Vistas */}
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-poppins)' }}>Vistas Disponibles</h2>
                    {!selectedModule ? (
                      <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-100">
                        <p className="text-gray-500 text-sm" style={{ fontFamily: 'var(--font-poppins)' }}>
                          Selecciona un módulo arriba para ver sus vistas disponibles.
                        </p>
                      </div>
                    ) : subVistas.filter(v =>
                      (v.modulo_id && selectedModule?.id && String(v.modulo_id) === String(selectedModule.id)) ||
                      (v.area && selectedModule?.nombre && v.area === selectedModule.nombre)
                    ).length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-100">
                        <p className="text-gray-500 text-sm" style={{ fontFamily: 'var(--font-poppins)' }}>
                          No hay vistas disponibles para el módulo <span className="font-semibold text-blue-700">{selectedModule?.nombre}</span>
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {subVistas
                          .filter(vista =>
                            (vista.modulo_id && selectedModule?.id && String(vista.modulo_id) === String(selectedModule.id)) ||
                            (vista.area && selectedModule?.nombre && vista.area === selectedModule.nombre)
                          )
                          .map((vista) => (
                            <div
                              key={vista.id}
                              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-200 hover:border-green-300"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center text-white shadow-sm flex-shrink-0">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-sm font-medium text-gray-900 truncate" style={{ fontFamily: 'var(--font-poppins)' }}>{vista.nombre}</h3>
                                  {vista.area && (
                                    <p className="text-xs text-gray-500 font-normal truncate" style={{ fontFamily: 'var(--font-poppins)' }}>{vista.area}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
