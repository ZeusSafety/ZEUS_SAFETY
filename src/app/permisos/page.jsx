"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "../../components/layout/Header";
import { Sidebar } from "../../components/layout/Sidebar";
import { useAuth } from "../../components/context/AuthContext";
import FormularioRegistroSolicitudes from "../../components/permisos/FormularioRegistroSolicitudes";
import MisSolicitudes from "../../components/permisos/MisSolicitudes";

function PermisosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("menu");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Detectar si se debe mostrar el formulario desde la URL o sidebar
  useEffect(() => {
    const section = searchParams?.get('section');
    if (section === 'registro-solicitudes-incidencias') {
      setActiveTab("registro");
    } else if (section === 'mis-solicitudes-incidencias') {
      setActiveTab("listado");
    }
  }, [searchParams]);

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

  const options = [
    {
      id: "registro-solicitudes-incidencias",
      title: "Registro de Solicitudes e Incidencias",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      onClick: () => setActiveTab("registro"),
    },
    {
      id: "mis-solicitudes-incidencias",
      title: "Mis Solicitudes e Incidencias",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      onClick: () => setActiveTab("listado"),
    },
  ];

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
              onClick={() => {
                if (activeTab !== "menu") {
                  setActiveTab("menu");
                } else {
                  router.push("/menu");
                }
              }}
              className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] text-white rounded-lg font-semibold hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm ripple-effect relative overflow-hidden text-sm group"
            >
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>{activeTab !== "menu" ? "Volver a Opciones" : "Volver al Menú"}</span>
            </button>

            {activeTab === "registro" && (
              <FormularioRegistroSolicitudes onBack={() => setActiveTab("menu")} />
            )}

            {activeTab === "listado" && (
              <MisSolicitudes onBack={() => setActiveTab("menu")} />
            )}

            {activeTab === "menu" && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6" style={{ boxShadow: '0px 4px 12px rgba(0,0,0,0.06)', borderRadius: '14px' }}>
                {/* Header */}
                <div className="mb-6">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] rounded-xl flex items-center justify-center text-white shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 tracking-tight">PERMISOS/SOLICITUDES E INCIDENCIAS</h1>
                      <p className="text-sm text-gray-600 font-medium mt-0.5">Gestión de Permisos y Solicitudes</p>
                    </div>
                  </div>
                </div>

                {/* Cards de la Sección */}
                <div className="grid gap-3 md:grid-cols-2">
                  {options.map((option) => (
                    <button
                      key={option.id}
                      onClick={option.onClick}
                      className="group text-left p-5 bg-white rounded-xl border border-gray-200/80 hover:border-blue-500/60 hover:shadow-lg transition-all duration-300 ease-out relative overflow-hidden"
                      style={{ 
                        boxShadow: '0px 2px 8px rgba(0,0,0,0.04)',
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-blue-50/0 group-hover:from-blue-50/30 group-hover:to-transparent transition-all duration-300 pointer-events-none rounded-xl" />
                      
                      <div className="relative z-10">
                        <div className="flex items-start space-x-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 group-hover:from-blue-800 group-hover:to-blue-900 rounded-lg flex items-center justify-center text-white shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:scale-110 flex-shrink-0">
                            {option.icon}
                          </div>
                          <h3 className="text-lg font-semibold text-slate-900 group-hover:text-blue-700 transition-colors duration-200">{option.title}</h3>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function PermisosPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#F7FAFF' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    }>
      <PermisosContent />
    </Suspense>
  );
}
