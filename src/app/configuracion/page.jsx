"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "../../components/layout/Header";
import { Sidebar } from "../../components/layout/Sidebar";
import { useAuth } from "../../components/context/AuthContext";

export default function ConfiguracionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const sections = [
    {
      id: "administracion",
      title: "Administración del Sistema",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      options: [
        { id: "gestion-usuarios", title: "Gestión de Usuarios", route: "/configuracion/gestion-usuarios" },
        { id: "gestion-roles", title: "Gestión de Roles y Permisos", route: "/configuracion/gestion-roles" },
        { id: "modulos-activos", title: "Módulos y Funcionalidades Activas", route: "/configuracion/modulos-activos" },
      ],
    },
    {
      id: "seguridad",
      title: "Seguridad",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      options: [
        { id: "politicas-password", title: "Políticas de Contraseña", route: "/configuracion/politicas-password" },
        { id: "2fa-sistema", title: "Autenticación en Dos Pasos (2FA)", route: "/configuracion/2fa-sistema" },
        { id: "permisos-especiales", title: "Permisos Especiales / Accesos Críticos", route: "/configuracion/permisos-especiales" },
      ],
    },
    {
      id: "auditoria",
      title: "Auditoría",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      options: [
        { id: "auditoria-sistema", title: "Auditoría del Sistema", route: "/configuracion/auditoria-sistema" },
        { id: "logs-seguridad", title: "Logs de Seguridad", route: "/configuracion/logs-seguridad" },
        { id: "historial-cambios", title: "Historial de Cambios y Eventos", route: "/configuracion/historial-cambios" },
      ],
    },
    {
      id: "integraciones",
      title: "Integraciones",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      options: [
        { id: "correo-smtp", title: "Correo SMTP", route: "/configuracion/correo-smtp" },
        { id: "whatsapp", title: "Integración con WhatsApp", route: "/configuracion/whatsapp" },
        { id: "apis", title: "Configuración de APIs", route: "/configuracion/apis" },
        { id: "webhooks", title: "Webhooks", route: "/configuracion/webhooks" },
      ],
    },
    {
      id: "respaldo",
      title: "Respaldo y Recuperación",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      ),
      options: [
        { id: "backups", title: "Copias de Seguridad (Backups)", route: "/configuracion/backups" },
        { id: "restauracion", title: "Restauración / Recuperación de Datos", route: "/configuracion/restauracion" },
      ],
    },
    {
      id: "monitorizacion",
      title: "Monitorización",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      options: [
        { id: "estado-servidor", title: "Estado del Servidor", route: "/configuracion/estado-servidor" },
        { id: "recursos", title: "Uso de Recursos (CPU, RAM, BD)", route: "/configuracion/recursos" },
        { id: "servicios-activos", title: "Servicios Activos", route: "/configuracion/servicios-activos" },
      ],
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
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
                    <p className="text-gray-600 mt-1">Administración del sistema y ajustes</p>
                  </div>
                </div>
              </div>

              {/* Secciones */}
              <div className="space-y-6">
                {sections.map((section) => (
                  <div key={section.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    {/* Header de Sección */}
                    <div className="px-6 py-4 bg-blue-700/20 backdrop-blur-md border-b border-blue-300/30">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-700/15 backdrop-blur-sm rounded-xl flex items-center justify-center text-blue-800 border-2 border-blue-600/30 shadow-sm">
                          {section.icon}
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
                      </div>
                    </div>

                    {/* Opciones de la sección */}
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {section.options.map((option) => (
                          <button
                            key={option.id}
                            onClick={() => router.push(option.route)}
                            className="bg-white rounded-xl border border-gray-200/60 p-4 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden hover:border-blue-500/60 hover:bg-blue-100/30 shadow-sm text-left group"
                          >
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-800 transition-colors">
                                {option.title}
                              </h3>
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
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

