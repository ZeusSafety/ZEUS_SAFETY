"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Header } from "../../components/layout/Header";
import { Sidebar } from "../../components/layout/Sidebar";
import { useAuth } from "../../components/context/AuthContext";

export default function MisModulosVistasPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modulos, setModulos] = useState([]);
  const [vistas, setVistas] = useState([]);
  const [rol, setRol] = useState(null);

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

  // Función para obtener módulos y vistas
  const fetchModulosVistas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener el usuario del contexto o localStorage
      const storedUser = localStorage.getItem("user");
      const currentUser = user || (storedUser ? JSON.parse(storedUser) : null);

      if (!currentUser) {
        throw new Error("No se encontró información del usuario. Por favor, inicia sesión nuevamente.");
      }

      // Obtener el nombre de usuario - intentar diferentes campos
      const username = currentUser.name || currentUser.email || currentUser.id || currentUser.usuario || "";
      
      if (!username) {
        throw new Error("No se pudo identificar el usuario.");
      }

      // Obtener el token de autenticación
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No se encontró el token de autenticación. Por favor, inicia sesión nuevamente.");
      }

      // Usar la ruta API de Next.js como proxy para evitar problemas de CORS
      const apiUrl = `/api/get-permissions?user=${encodeURIComponent(username)}`;

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Si falla con get_permissions, intentar usar los datos del usuario almacenados
        if (response.status === 401 || response.status === 403) {
          console.warn("No se pudo obtener datos actualizados de la API, usando datos almacenados del usuario");
          
          // Usar los datos del usuario que ya están almacenados
          if (currentUser.modules && Array.isArray(currentUser.modules)) {
            // Convertir módulos de strings a objetos con estructura esperada
            const modulosFromUser = currentUser.modules.map(mod => ({
              NOMBRE: mod.toUpperCase(),
              nombre: mod
            }));
            setModulos(modulosFromUser);
          } else {
            setModulos([]);
          }
          
          // Las sub_vistas no están en el objeto user del login, así que las dejamos vacías
          setVistas([]);
          
          // Usar el rol del usuario almacenado
          if (currentUser.rol !== undefined) {
            setRol(currentUser.rol);
          } else if (currentUser.isAdmin) {
            setRol(1);
          } else {
            setRol(2);
          }
          
          setLoading(false);
          return;
        }
        
        throw new Error(`Error al obtener los datos: ${response.status}`);
      }

      const data = await response.json();

      // Extraer módulos y vistas de la respuesta
      if (data.modulos && Array.isArray(data.modulos)) {
        setModulos(data.modulos);
      } else {
        setModulos([]);
      }

      if (data.sub_vistas && Array.isArray(data.sub_vistas)) {
        setVistas(data.sub_vistas);
      } else {
        setVistas([]);
      }

      if (data.rol !== undefined) {
        setRol(data.rol);
      }

    } catch (err) {
      console.error("Error al obtener módulos y vistas:", err);
      
      // Si hay error, intentar usar los datos del usuario almacenados como fallback
      try {
        const storedUser = localStorage.getItem("user");
        const currentUser = storedUser ? JSON.parse(storedUser) : null;
        
        if (currentUser) {
          console.log("Usando datos almacenados del usuario como fallback");
          
          if (currentUser.modules && Array.isArray(currentUser.modules)) {
            const modulosFromUser = currentUser.modules.map(mod => ({
              NOMBRE: mod.toUpperCase(),
              nombre: mod
            }));
            setModulos(modulosFromUser);
          } else {
            setModulos([]);
          }
          
          setVistas([]);
          
          if (currentUser.rol !== undefined) {
            setRol(currentUser.rol);
          } else if (currentUser.isAdmin) {
            setRol(1);
          } else {
            setRol(2);
          }
          
          setError(null); // Limpiar el error si pudimos usar datos almacenados
        } else {
          setError(err.message || "Error al cargar los módulos y vistas");
        }
      } catch (fallbackError) {
        setError(err.message || "Error al cargar los módulos y vistas");
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user || localStorage.getItem("user")) {
      fetchModulosVistas();
    }
  }, [fetchModulosVistas, user]);

  // Función para obtener el nombre del rol
  const getRolNombre = (rolNumero) => {
    const roles = {
      1: "Administrador",
      2: "Usuario",
      3: "Colaborador",
    };
    return roles[rolNumero] || `Rol ${rolNumero}`;
  };

  // Función para obtener icono según el módulo
  const getModuloIcon = (moduloNombre) => {
    const iconos = {
      "GERENCIA": (
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      "ADMINISTRACION": (
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      "IMPORTACION": (
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      "LOGISTICA": (
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
        </svg>
      ),
      "FACTURACION": (
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      "MARKETING": (
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      ),
      "SISTEMAS": (
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      "RECURSOS HUMANOS": (
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      "VENTAS": (
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    };

    return iconos[moduloNombre] || (
      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
      </svg>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F7FAFF' }}>
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
              onClick={() => router.push("/perfil")}
              className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] text-white rounded-lg font-semibold hover:shadow-md hover:scale-105 transition-all duration-200 ripple-effect relative overflow-hidden text-sm group"
            >
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver a Mi Perfil</span>
            </button>

            {/* Card contenedor blanco */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6" style={{ boxShadow: '0px 4px 12px rgba(0,0,0,0.06)', borderRadius: '14px' }}>
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] rounded-xl flex items-center justify-center text-white shadow-sm">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Mis Módulos y Vistas</h1>
                    <p className="text-sm text-gray-600 font-medium mt-0.5">
                      {rol !== null && `Rol: ${getRolNombre(rol)}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-12 h-12 border-4 border-[#1E63F7] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-600 font-medium">Cargando módulos y vistas...</p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && !loading && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-800 font-medium">{error}</p>
                  </div>
                </div>
              )}

              {/* Content */}
              {!loading && !error && (
                <div className="space-y-6">
                  {/* Módulos */}
                  <div>
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-1 h-6 bg-gradient-to-b from-[#1E63F7] to-[#1E63F7] rounded-full"></div>
                      <h2 className="text-xl font-bold text-gray-900">Módulos Habilitados</h2>
                      <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">
                        {modulos.length}
                      </span>
                    </div>
                    
                    {modulos.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {modulos.map((modulo, index) => (
                          <div
                            key={index}
                            className="bg-white rounded-lg p-3 border border-gray-200/60 hover:border-blue-300 hover:shadow-md transition-all duration-200 group"
                            style={{ borderRadius: '10px' }}
                          >
                            <div className="flex items-center space-x-2.5">
                              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200 flex-shrink-0">
                                <div className="text-[#1E63F7]">
                                  {getModuloIcon(modulo.NOMBRE)}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-xs font-bold text-gray-900 uppercase truncate group-hover:text-blue-800 transition-colors">
                                  {modulo.NOMBRE}
                                </h3>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-6 text-center border border-gray-200">
                        <p className="text-gray-600 font-medium">No hay módulos habilitados</p>
                      </div>
                    )}
                  </div>

                  {/* Vistas */}
                  <div>
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-1 h-6 bg-gradient-to-b from-[#1E63F7] to-[#1E63F7] rounded-full"></div>
                      <h2 className="text-xl font-bold text-gray-900">Vistas Disponibles</h2>
                      <span className="px-2.5 py-0.5 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                        {vistas.length}
                      </span>
                    </div>
                    
                    {vistas.length > 0 ? (
                      <div className="space-y-2">
                        {vistas.map((vista, index) => (
                          <div
                            key={vista.ID_SUB_VISTAS || index}
                            className="bg-white rounded-lg p-4 border border-gray-200/60 hover:border-blue-300 hover:shadow-md transition-all duration-200 group"
                            style={{ borderRadius: '10px' }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3 flex-1 min-w-0">
                                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center mr-3 shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200 flex-shrink-0">
                                  <svg className="w-4.5 h-4.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-800 transition-colors truncate">
                                    {vista.NOMBRE}
                                  </h3>
                                  {vista.ID_SUB_VISTAS && (
                                    <p className="text-xs text-gray-500 mt-0.5">ID: {vista.ID_SUB_VISTAS}</p>
                                  )}
                                </div>
                              </div>
                              <svg
                                className="w-4 h-4 text-gray-400 group-hover:text-blue-800 transition-colors flex-shrink-0 ml-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-6 text-center border border-gray-200">
                        <p className="text-gray-600 font-medium">No hay vistas disponibles</p>
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

