"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/context/AuthContext";
import { Header } from "../../components/layout/Header";
import { Sidebar } from "../../components/layout/Sidebar";
import { ModuleCard } from "../../components/dashboard/ModuleCard";
import { WelcomeBanner } from "../../components/ui/WelcomeBanner";

export default function MenuPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);

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

  // Verificar si se debe mostrar el banner de bienvenida
  useEffect(() => {
    if (user && typeof window !== "undefined") {
      const shouldShow = sessionStorage.getItem("showWelcomeBanner") === "true";
      if (shouldShow) {
        setShowWelcomeBanner(true);
        // Limpiar la bandera después de mostrarlo
        sessionStorage.removeItem("showWelcomeBanner");
      }
    }
  }, [user]);

  if (loading) {
    return (
        <div className="flex min-h-screen items-center justify-center" style={{ background: '#F7FAFF' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Todos los módulos disponibles
  const allModules = [
    {
      id: "gerencia",
      name: "Gerencia",
      icon: "shield",
      description: "Gestión general y reportes ejecutivos",
      status: "Disponible",
    },
    {
      id: "administracion",
      name: "Administración",
      icon: "user-gear",
      description: "Control de usuarios, permisos y finanzas",
      status: "Disponible",
    },
    {
      id: "importacion",
      name: "Importación",
      icon: "ship",
      description: "Seguimiento de despachos y órdenes",
      status: "Disponible",
    },
    {
      id: "logistica",
      name: "Logística",
      icon: "truck",
      description: "Inventarios, almacenes y distribución",
      status: "Disponible",
    },
    {
      id: "facturacion",
      name: "Facturación",
      icon: "chart",
      description: "Registro de ventas, Regularización, etc",
      status: "Disponible",
    },
    {
      id: "marketing",
      name: "Marketing",
      icon: "megaphone",
      description: "Publicidad, redes sociales y campañas",
      status: "Disponible",
    },
    {
      id: "sistemas",
      name: "Sistemas",
      icon: "gears",
      description: "Gestión de sistemas y tecnología",
      status: "Disponible",
    },
    {
      id: "recursos-humanos",
      name: "Recursos Humanos",
      icon: "users",
      description: "Gestión de personal y nómina",
      status: "Disponible",
    },
    {
      id: "ventas",
      name: "Ventas",
      icon: "document",
      description: "Gestión de ventas y clientes",
      status: "Disponible",
    },
    {
      id: "permisos",
      name: "Permisos/Solicitudes e Incidencias",
      icon: "list",
      description: "Gestión de permisos y solicitudes",
      status: "Disponible",
    },
  ];

  // Filtrar módulos según los permisos del usuario
  const userModules = user?.modules || [];
  const isAdmin = user?.isAdmin || false;
  
  // Si es admin, mostrar todos los módulos
  // Si no es admin pero tiene módulos, filtrar
  // Si no es admin y no tiene módulos, no mostrar ninguno
  // Temporalmente ocultar "Seguimiento y Monitoreo" (en proceso)
  // Ocultar "Permisos" del menú (pero seguirá visible en el sidebar)
  let availableModules = (isAdmin 
    ? allModules 
    : userModules.length > 0
    ? allModules.filter((module) => userModules.includes(module.id))
    : []).filter((module) => module.id !== "seguimiento-monitoreo" && module.id !== "permisos");
  
  // Asegurar que "boletin-informativo" siempre esté disponible para todos los usuarios
  if (!availableModules.some(m => m.id === "boletin-informativo")) {
    const boletinModule = allModules.find(m => m.id === "boletin-informativo");
    if (boletinModule) {
      availableModules = [...availableModules, boletinModule];
    }
  }
  
  // Log para depuración - mostrar contenido completo
  console.log("=== MENU PAGE ===");
  console.log("User object:", JSON.stringify(user, null, 2));
  console.log("User modules (array):", userModules);
  console.log("User modules (stringified):", JSON.stringify(userModules, null, 2));
  console.log("Is Admin:", isAdmin);
  console.log("Available modules count:", availableModules.length);
  console.log("Available modules IDs:", availableModules.map(m => m.id));
  console.log("All modules IDs:", allModules.map(m => m.id));
  console.log("=================");

  // Generar mensaje de bienvenida según los módulos
  const getWelcomeMessage = () => {
    const userName = user?.name || user?.email || "Usuario";
    
    if (isAdmin || userModules.length === 0 || userModules.length >= 5) {
      return `¡Bienvenido, ${userName}!`;
    }
    
    if (userModules.length === 1) {
      // Obtener el nombre del módulo desde availableModules
      const module = availableModules.find(m => userModules.includes(m.id)) || availableModules[0];
      const moduleName = module?.name || "el sistema";
      return `¡Bienvenido, ${userName}, al área de ${moduleName}!`;
    }
    
    // Si tiene múltiples módulos, listar los principales
    const moduleNames = availableModules.slice(0, 3).map(m => m.name).join(", ");
    return `¡Bienvenido, ${userName}! Acceso a: ${moduleNames}`;
  };

  const getCurrentDate = () => {
    const now = new Date();
    const days = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
    const months = [
      "enero", "febrero", "marzo", "abril", "mayo", "junio",
      "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
    ];
    return `${days[now.getDay()]}, ${now.getDate()} de ${months[now.getMonth()]} de ${now.getFullYear()}`;
  };

  const handleModuleClick = (moduleId) => {
    router.push(`/${moduleId}`);
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
        
        <main className="flex-1 overflow-y-auto">
          {/* Banner de Bienvenida al Iniciar Sesión */}
          {showWelcomeBanner && user && (
            <WelcomeBanner
              userName={user?.name || user?.email || "Usuario"}
              onClose={() => setShowWelcomeBanner(false)}
            />
          )}

          {/* Welcome Banner */}
          <div className="max-w-[95%] mx-auto px-2 sm:px-4 pt-3 sm:pt-4">
            <div className="relative text-white px-3 sm:px-6 py-4 sm:py-6 rounded-xl sm:rounded-2xl shadow-xl overflow-hidden bg-gradient-to-r from-[#1E63F7] via-[#1E63F7] to-[#1E63F7] backdrop-blur-md" style={{ boxShadow: '0 20px 60px -12px rgba(21, 94, 239, 0.25)' }}>
              <div className="relative z-10">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h1 className="text-lg sm:text-2xl font-medium mb-1.5 sm:mb-2 tracking-tight text-white" style={{ fontFamily: 'var(--font-poppins)' }}>
                      {getWelcomeMessage()}
                    </h1>
                    <p className="text-blue-50 text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed font-normal" style={{ fontFamily: 'var(--font-poppins)' }}>
                      {isAdmin || userModules.length >= 5
                        ? "Gestiona todos los módulos del sistema ZEUS SAFETY desde este panel centralizado."
                        : `Accede a tus módulos asignados del sistema ZEUS SAFETY.`}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <div className="flex items-center space-x-1 sm:space-x-1.5 bg-white/20 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg border border-white/30 shadow-md hover:bg-white/30 transition-all duration-200">
                        <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="text-[10px] sm:text-xs font-medium text-white" style={{ fontFamily: 'var(--font-poppins)' }}>Panel de Control</span>
                      </div>
                      <div className="flex items-center space-x-1 sm:space-x-1.5 bg-white/20 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg border border-white/30 shadow-md hover:bg-white/30 transition-all duration-200">
                        <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-[10px] sm:text-xs font-medium text-white" style={{ fontFamily: 'var(--font-poppins)' }}>{getCurrentDate()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modules Grid */}
          <div className="max-w-[95%] mx-auto px-4 pt-6 pb-4">
            <div className="mb-4">
              <h2 className="text-xl font-medium text-gray-900 mb-2 tracking-tight" style={{ fontFamily: 'var(--font-poppins)' }}>MÓDULOS DISPONIBLES</h2>
              <div className="w-16 h-1 bg-gradient-to-r from-[#1E63F7] via-[#1E63F7] to-[#1E63F7] rounded-full"></div>
            </div>
            {availableModules.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableModules.map((module, index) => (
                  <ModuleCard
                    key={module.id}
                    module={module}
                    onClick={() => handleModuleClick(module.id)}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 text-base">No tienes módulos asignados.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
