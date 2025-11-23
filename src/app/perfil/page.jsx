"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "../../components/layout/Header";
import { Sidebar } from "../../components/layout/Sidebar";
import { useAuth } from "../../components/context/AuthContext";

export default function PerfilPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const getIcon = (iconName) => {
    const icons = {
      perfil: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      contraseña: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      "2fa": (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      dispositivos: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      registro: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      modulos: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
        </svg>
      ),
      permisos: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ),
      solicitudes: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      mensajes: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      historial: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    };
    return icons[iconName] || icons.perfil;
  };

  const menuOptions = [
    {
      id: "perfil",
      iconName: "perfil",
      title: "Mi Perfil (editar datos personales)",
      route: "/perfil",
    },
    {
      id: "contraseña",
      iconName: "contraseña",
      title: "Cambiar contraseña",
      route: "/cambiar-contraseña",
    },
    {
      id: "2fa",
      iconName: "2fa",
      title: "Configurar autenticación 2FA",
      route: "/2fa",
    },
    {
      id: "dispositivos",
      iconName: "dispositivos",
      title: "Ver dispositivos conectados",
      route: "/dispositivos",
    },
    {
      id: "registro",
      iconName: "registro",
      title: "Registro de actividad (logs personales)",
      route: "/registro-actividad",
    },
    {
      id: "modulos",
      iconName: "modulos",
      title: "Mis módulos habilitados",
      route: "/modulos-habilitados",
    },
    {
      id: "permisos",
      iconName: "permisos",
      title: "Permisos asignados",
      route: "/permisos",
    },
    {
      id: "solicitudes",
      iconName: "solicitudes",
      title: "Mis solicitudes pendientes",
      route: "/solicitudes",
    },
    {
      id: "mensajes",
      iconName: "mensajes",
      title: "Centro de mensajes / tickets",
      route: "/mensajes",
    },
    {
      id: "historial",
      iconName: "historial",
      title: "Historial de accesos",
      route: "/historial-accesos",
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div 
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${
          sidebarOpen ? "ml-72" : "ml-0"
        }`}
      >
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-gray-100">
          <div className="max-w-[95%] mx-auto px-6 py-6">
            {/* Botón Volver - OUTSIDE the white card */}
            <button
              onClick={() => router.push("/menu")}
              className="mb-6 flex items-center space-x-2 px-4 py-2.5 bg-blue-700/20 backdrop-blur-md border border-blue-500/40 text-blue-800 rounded-xl font-semibold hover:bg-blue-700/30 hover:border-blue-600/60 transition-all duration-200 shadow-md hover:shadow-lg ripple-effect relative overflow-hidden"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver al Menú</span>
            </button>

            {/* Card contenedor blanco - ENCLOSING the rest of the content */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-200/60 p-8">
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center space-x-4 mb-3">
                  <div className="w-16 h-16 bg-blue-700/20 backdrop-blur-md border-2 border-blue-400/40 rounded-2xl flex items-center justify-center text-blue-800 shadow-sm">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
                    <p className="text-gray-600 mt-1">Gestiona tu cuenta y configuración</p>
                  </div>
                </div>
              </div>

              {/* Opciones del menú */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {menuOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => router.push(option.route)}
                    className="bg-white rounded-2xl border border-gray-200/60 p-6 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden hover:border-blue-500/60 hover:bg-white/95 shadow-sm text-left group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-700/15 backdrop-blur-sm border-2 border-blue-600/30 rounded-xl flex items-center justify-center text-blue-800 shadow-sm group-hover:shadow-md group-hover:scale-105 group-hover:bg-blue-700/25 group-hover:border-blue-700/50 transition-all duration-200">
                        {getIcon(option.iconName)}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-800 transition-colors">
                          {option.title}
                        </h3>
                      </div>
                      <svg
                        className="w-5 h-5 text-gray-400 group-hover:text-blue-800 transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

