"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/context/AuthContext";
import { Header } from "../../components/layout/Header";
import { Sidebar } from "../../components/layout/Sidebar";
import { ModuleCard } from "../../components/dashboard/ModuleCard";

export default function MenuPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const modules = [
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
      status: "Próximamente",
    },
    {
      id: "ventas",
      name: "Ventas",
      icon: "document",
      description: "Gestión de ventas y clientes",
      status: "Disponible",
    },
  ];

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
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div 
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${
          sidebarOpen ? "ml-72" : "ml-0"
        }`}
      >
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 overflow-y-auto">
          {/* Welcome Banner */}
          <div className="max-w-[95%] mx-auto px-6 pt-6">
            <div className="relative text-white px-10 py-10 rounded-3xl shadow-2xl overflow-hidden" style={{ boxShadow: '0 20px 60px -12px rgba(234, 179, 8, 0.25)' }}>
              {/* Background image */}
              <div className="absolute inset-0">
                <img
                  src="/images/fondo_izquierda_new.png"
                  alt="Fondo Zeus"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Overlay amarillo para coherencia con login */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-900/70 via-yellow-900/65 to-amber-800/70"></div>
              {/* Background pattern sutil */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-300 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-300 rounded-full blur-3xl"></div>
              </div>
              
              <div className="relative z-10">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h1 className="text-4xl font-bold mb-3 tracking-tight text-white">
                      ¡Bienvenido, {user?.name || user?.email || "Usuario"}!
                    </h1>
                    <p className="text-yellow-50 text-base mb-6 leading-relaxed font-medium whitespace-nowrap">
                      Gestiona todos los módulos del sistema ZEUS SAFETY desde este panel centralizado.
                    </p>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <div className="flex items-center space-x-2 bg-white/25 backdrop-blur-md px-4 py-2 rounded-lg border border-yellow-300/30 shadow-md">
                        <svg className="w-4 h-4 text-yellow-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs font-semibold text-white">Panel de Control</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-white/25 backdrop-blur-md px-4 py-2 rounded-lg border border-yellow-300/30 shadow-md">
                        <svg className="w-4 h-4 text-yellow-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs font-semibold text-white">{getCurrentDate()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modules Grid */}
          <div className="max-w-[95%] mx-auto px-6 pt-10 pb-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">MÓDULOS DISPONIBLES</h2>
              <div className="w-20 h-1.5 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modules.map((module) => (
                <ModuleCard
                  key={module.id}
                  module={module}
                  onClick={() => handleModuleClick(module.id)}
                />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
