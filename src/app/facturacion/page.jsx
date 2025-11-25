"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/context/AuthContext";
import { Header } from "../../components/layout/Header";
import { Sidebar } from "../../components/layout/Sidebar";

export default function FacturacionPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    "listados": false,
    "solicitudes-incidencias": false,
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

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

  const sections = [
    {
      id: "listados",
      title: "Listados",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      cards: [
        {
          id: "incidencia-proformas",
          icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ),
          title: "Incidencia de Proformas",
          description: "Ver y gestionar incidencias de proformas",
          buttonText: "Ver Incidencias",
          buttonIcon: (
            <svg className="w-4 h-4 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          ),
        },
        {
          id: "listado-importaciones",
          icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          ),
          title: "Listado de Importaciones",
          description: "Ver y gestionar listado de importaciones",
          buttonText: "Ver Importaciones",
          buttonIcon: (
            <svg className="w-4 h-4 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
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
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      cards: [
        {
          id: "listado-solicitudes",
          icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          ),
          title: "Listado de Solicitudes/Incidencias",
          description: "Ver y gestionar Solicitudes/Incidencias",
          buttonText: "Ver Solicitudes/Incidencias",
          buttonIcon: (
            <svg className="w-4 h-4 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          ),
        },
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
            {/* Botón Volver */}
            <button
              onClick={() => router.push("/menu")}
              className="mb-6 flex items-center space-x-2 px-4 py-2.5 bg-blue-700/20 backdrop-blur-md border border-blue-700/40 text-blue-800 rounded-xl font-semibold hover:bg-blue-700/30 hover:border-blue-600/60 transition-all duration-200 shadow-md hover:shadow-lg ripple-effect relative overflow-hidden"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver al Menú</span>
            </button>
            
            {/* Card contenedor blanco */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-200/60 p-8">

            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center space-x-4 mb-3">
                <div className="w-16 h-16 bg-blue-700/20 backdrop-blur-md border-2 border-blue-600/40 rounded-2xl flex items-center justify-center text-blue-800 shadow-sm">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 tracking-tight">FACTURACIÓN</h1>
                  <p className="text-lg text-gray-600 font-medium mt-1">Gestión de Ventas y Regularización</p>
                </div>
              </div>
            </div>

            {/* Secciones */}
            <div className="space-y-4">
              {sections.map((section) => (
                <div key={section.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                  {/* Header de Sección */}
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between px-6 py-4 bg-blue-700/20 backdrop-blur-md border border-blue-700/40 text-gray-800 hover:bg-blue-700/30 hover:border-blue-600/60 transition-all duration-200 shadow-md"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-blue-800">{section.icon}</div>
                      <h2 className="text-xl font-bold text-gray-800">{section.title}</h2>
                    </div>
                    <svg
                      className={`w-5 h-5 transition-transform duration-200 ${expandedSections[section.id] ? "rotate-180" : ""}`}
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
                    <div className="p-6 bg-gray-50/50">
                      <div className={`grid gap-4 ${section.cards.length === 1 ? "grid-cols-1" : section.cards.length <= 3 ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}`}>
                        {section.cards.map((card) => (
                          <div
                            key={card.id}
                            className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/60 hover:border-blue-700/60 hover:shadow-xl hover:bg-white/95 transition-all duration-200 shadow-sm"
                            style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.02)' }}
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="w-14 h-14 bg-blue-500/15 backdrop-blur-sm rounded-xl flex items-center justify-center text-blue-800 border-2 border-blue-400/30 shadow-sm">
                                {card.icon}
                              </div>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{card.title}</h3>
                            <p className="text-sm text-gray-600 mb-4 leading-relaxed">{card.description}</p>
                            <button className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-700/20 backdrop-blur-sm border-2 border-blue-600/40 hover:bg-blue-700/30 hover:border-blue-700/60 text-blue-800 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]">
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

