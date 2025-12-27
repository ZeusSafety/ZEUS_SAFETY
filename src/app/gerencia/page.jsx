"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/context/AuthContext";
import { Header } from "../../components/layout/Header";
import { Sidebar } from "../../components/layout/Sidebar";
import { isCardAllowed as checkCardAllowed } from "../../utils/subVistasMapping";

export default function GerenciaPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    "gestion-usuarios": false,
    "gestion-productos": false,
    "franja-precios": false,
    "gestion-solicitudes": false,
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

  const toggleSection = useCallback((sectionId) => {
    setExpandedSections((prev) => {
      const newState = { ...prev };
      // Solo cambiar el estado de la sección específica
      newState[sectionId] = !prev[sectionId];
      return newState;
    });
  }, []);

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

  // Función para verificar si un card está permitido según las sub_vistas
  const isCardAllowed = (cardId) => {
    return checkCardAllowed(cardId, user);
  };

  const sections = [
    {
      id: "gestion-usuarios",
      title: "Gestión de Usuarios",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      cards: [
        {
          id: "accesibilidad-credenciales",
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          ),
          title: "Accesibilidad y Credenciales",
          description: "Gestionar permisos y credenciales de usuarios",
          buttonText: "Ver Colaboradores",
          buttonIcon: (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          ),
        },
        {
          id: "registro-actividad-general",
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          ),
          title: "Registro de Actividad (Logs generales)",
          description: "Ver logs de sesión de todos los usuarios",
          buttonText: "Ver Logs Generales",
          buttonIcon: (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          ),
        },
      ],
    },
    {
      id: "gestion-productos",
      title: "Gestión de Productos",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      cards: [
        {
          id: "productos",
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
          title: "Productos",
          description: "Gestionar Productos",
          buttonText: "Ver Productos",
          buttonIcon: (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
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
        {
          id: "gestion-precios",
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          ),
          title: "Gestión de precios",
          description: "Administrar y configurar precios de productos",
          buttonText: "Gestionar",
          buttonIcon: (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          ),
        },
      ],
    },
    {
      id: "gestion-solicitudes",
      title: "Gestión de Solicitudes/Incidencias",
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          ),
          title: "Listado de Solicitudes/Incidencias",
          description: "Ver y gestionar Solicitudes/Incidencias",
          buttonText: "Ver Solicitudes/Incidencias",
          buttonIcon: (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
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
          sidebarOpen ? "lg:ml-60 ml-0" : "ml-0"
        }`}
      >
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto custom-scrollbar" style={{ background: '#F7FAFF' }}>
          <div className="max-w-[95%] mx-auto px-4 py-4">
            {/* Botón Volver */}
            <button
              onClick={() => router.push("/menu")}
              className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-lg font-medium hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm ripple-effect relative overflow-hidden text-sm group"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver al Menú</span>
            </button>
            
            {/* Card contenedor blanco */}
            <div className="bg-[#FFFFFF] rounded-[16px] border border-[#E6EAF2] p-6" style={{ boxShadow: '0px 4px 12px rgba(0,0,0,0.06)' }}>

            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-xl flex items-center justify-center text-white shadow-sm">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-medium text-gray-900 tracking-tight" style={{ fontFamily: 'var(--font-poppins)' }}>GERENCIA</h1>
                  <p className="text-sm text-gray-600 font-normal mt-0.5" style={{ fontFamily: 'var(--font-poppins)' }}>Gestión de Usuarios y Reportes</p>
                </div>
              </div>
            </div>

            {/* Secciones */}
            <div className="space-y-3">
              {sections
                .map((section) => {
                  // Filtrar cards permitidos en esta sección
                  const allowedCards = section.cards.filter(card => isCardAllowed(card.id));
                  
                  // Si no hay cards permitidos, no mostrar la sección
                  if (allowedCards.length === 0) return null;

                  return {
                    ...section,
                    cards: allowedCards,
                  };
                })
                .filter(section => section !== null)
                .map((section) => {
                const sectionId = section.id;
                const handleClick = (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleSection(sectionId);
                };
                return (
                  <div key={sectionId} className="bg-[#FFFFFF] rounded-[16px] border border-[#E6EAF2] overflow-hidden" style={{ boxShadow: '0px 4px 12px rgba(0,0,0,0.06)' }}>
                    {/* Header de Sección */}
                    <button
                      onClick={handleClick}
                      type="button"
                      className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white hover:shadow-md hover:scale-[1.01] transition-all duration-200 shadow-sm"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                    >
                      <div className="flex items-center space-x-2">
                        <div className="text-white">{section.icon}</div>
                        <h2 className="text-base font-semibold text-white" style={{ fontFamily: 'var(--font-poppins)' }}>{section.title}</h2>
                      </div>
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 ${expandedSections[sectionId] ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Cards de la Sección */}
                    {expandedSections[sectionId] && (
                      <div className="p-3 bg-gradient-to-br from-slate-50 to-slate-100">
                        <div className={`grid gap-2.5 ${section.cards.length === 1 ? "grid-cols-1" : section.cards.length <= 3 ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}`}>
                          {section.cards.map((card) => (
                            <div
                              key={card.id}
                              className="group bg-white rounded-xl p-3 border border-gray-200/80 hover:border-blue-500/60 hover:shadow-lg transition-all duration-300 ease-out relative overflow-hidden"
                              style={{ 
                                boxShadow: '0px 2px 8px rgba(0,0,0,0.04)',
                                transform: 'translateY(0)'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0px 8px 20px rgba(29, 78, 216, 0.12)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0px 2px 8px rgba(0,0,0,0.04)';
                              }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-blue-50/0 group-hover:from-blue-50/30 group-hover:to-transparent transition-all duration-300 pointer-events-none rounded-xl" />
                              
                              <div className="relative z-10">
                                <div className="flex items-start justify-between mb-2">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 group-hover:from-blue-800 group-hover:to-blue-900 rounded-lg flex items-center justify-center text-white shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:scale-110">
                                  {card.icon}
                                </div>
                              </div>
                              <h3 className="text-sm font-semibold text-slate-900 mb-1.5 leading-tight group-hover:text-blue-700 transition-colors duration-200" style={{ fontFamily: 'var(--font-poppins)' }}>{card.title}</h3>
                              <p className="text-[11px] text-slate-600 mb-2.5 leading-relaxed line-clamp-2" style={{ fontFamily: 'var(--font-poppins)' }}>{card.description}</p>
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log("Button clicked, card.id:", card.id);
                                  if (card.id === "productos") {
                                    router.push("/gerencia/productos");
                                  } else if (card.id === "accesibilidad-credenciales") {
                                    router.push("/gerencia/colaboradores");
                                  } else if (card.id === "registro-actividad-general") {
                                    router.push("/gerencia/registro-actividad-general");
                                  } else if (card.id === "listado-precios") {
                                    router.push("/gerencia/listado-precios");
                                  } else if (card.id === "gestion-precios") {
                                    router.push("/gerencia/gestion-precios");
                                  } else if (card.id === "listado-solicitudes") {
                                    router.push("/gerencia/solicitudes-incidencias");
                                  } else {
                                    router.push("/gerencia");
                                  }
                                }}
                                className="w-full flex items-center justify-center space-x-1.5 px-2.5 py-1.5 bg-gradient-to-r from-blue-700 to-blue-800 group-hover:from-blue-800 group-hover:to-blue-900 text-white rounded-lg font-medium transition-all duration-300 shadow-sm hover:shadow-md text-xs active:scale-[0.97] relative overflow-hidden cursor-pointer"
                                style={{ fontFamily: 'var(--font-poppins)' }}
                                >
                                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/0 to-white/0 group-hover:from-white/0 group-hover:via-white/20 group-hover:to-white/0 group-hover:animate-shimmer" />
                                  <span className="relative z-10 flex items-center space-x-1.5">
                                    {card.buttonIcon}
                                    <span>{card.buttonText}</span>
                                  </span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

