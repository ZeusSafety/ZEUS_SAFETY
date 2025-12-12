"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/context/AuthContext";
import { Header } from "../../components/layout/Header";
import { Sidebar } from "../../components/layout/Sidebar";

export default function VentasPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    "listados": false,
    "solicitudes-incidencias": false,
    "franja-precios": false,
  });

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

  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  if (loading) {
    return (
        <div className="flex min-h-screen items-center justify-center" style={{ background: '#F7FAFF' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const sections = [
    {
      id: "listados",
      title: "Listados",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      cards: [
        {
          id: "listado-importaciones",
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          ),
          title: "Listado de Importaciones",
          description: "Ver y gestionar listado de importaciones",
          buttonText: "Ver Importaciones",
          buttonIcon: (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          ),
        },
        {
          id: "metricas-ventas",
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          ),
          title: "Métricas de ventas",
          description: "Para Asesores de Ventas",
          buttonText: "Ver mis métricas",
          buttonIcon: (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          ),
        },
      ],
    },
    {
      id: "solicitudes-incidencias",
      title: "Solicitudes/Incidencias",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      cards: [
        {
          id: "listado-solicitudes",
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          ),
          title: "Listado de Solicitudes/Incidencias",
          description: "Ver y gestionar Solicitudes/Incidencias",
          buttonText: "Ver Solicitudes/Incidencias",
          buttonIcon: (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          ),
        },
      ],
    },
    {
      id: "franja-precios",
      title: "Franja de precios",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      cards: [
        {
          id: "listado-precios",
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          ),
          title: "Listado de precios",
          description: "Gestionar y consultar precios de productos",
          buttonText: "Ver Listado",
          buttonIcon: (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          ),
        },
      ],
    },
  ];

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
              onClick={() => router.push("/menu")}
              className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] text-white rounded-lg font-semibold hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm ripple-effect relative overflow-hidden text-sm group"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver al Menú</span>
            </button>
            
            {/* Card contenedor blanco */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">

            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] rounded-xl flex items-center justify-center text-white shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight">VENTAS</h1>
                  <p className="text-sm text-gray-600 font-medium mt-0.5">Gestión de Facturación y Listados</p>
                </div>
              </div>
            </div>

            {/* Secciones */}
            <div className="space-y-3">
              {sections.map((section) => (
                <div key={section.id} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                  {/* Header de Sección */}
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] text-white hover:shadow-md hover:scale-[1.01] transition-all duration-200 shadow-sm"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="text-white">{section.icon}</div>
                      <h2 className="text-base font-bold text-white">{section.title}</h2>
                    </div>
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${expandedSections[section.id] ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Cards de la Sección */}
                    {expandedSections[section.id] && (
                      <div className="p-4 bg-slate-200">
                        <div className={`grid gap-3 ${section.cards.length === 1 ? "grid-cols-1" : section.cards.length <= 3 ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}`}>
                          {section.cards.map((card) => (
                            <div
                              key={card.id}
                              className="bg-[#FFFFFF] rounded-[14px] p-4 border border-gray-200/60 hover:border-[#1E63F7]/60 hover:bg-white/95 transition-all duration-200"
                              style={{ boxShadow: '0px 4px 12px rgba(0,0,0,0.06)' }}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] rounded-lg flex items-center justify-center text-white shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
                                  {card.icon}
                                </div>
                              </div>
                              <h3 className="text-base font-bold text-gray-900 mb-1.5">{card.title}</h3>
                              <p className="text-xs text-gray-600 mb-3 leading-relaxed">{card.description}</p>
                              <button 
                                onClick={() => {
                                  if (card.id === "listado-importaciones") {
                                    router.push("/ventas/listado-importaciones");
                                  } else if (card.id === "listado-precios") {
                                    router.push("/gerencia/listado-precios");
                                  }
                                }}
                                className="w-full flex items-center justify-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] text-white rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105 active:scale-[0.98] text-sm group"
                              >
                                {card.buttonIcon}
                                <span>{card.buttonText}</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
