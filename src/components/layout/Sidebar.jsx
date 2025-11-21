"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export function Sidebar({ isOpen, onClose }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [expandedModules, setExpandedModules] = useState({});

  const modules = [
    { id: "gerencia", name: "Gerencia", icon: "shield", hasSubmenu: true },
    { id: "administracion", name: "Administración", icon: "user-gear", hasSubmenu: true },
    { id: "importacion", name: "Importación", icon: "ship", hasSubmenu: true },
    { id: "logistica", name: "Logística", icon: "truck", hasSubmenu: true },
    { id: "ventas", name: "Ventas", icon: "document", hasSubmenu: true },
    { id: "marketing", name: "Marketing", icon: "megaphone", hasSubmenu: true },
    { id: "sistemas", name: "Sistemas", icon: "gears", hasSubmenu: true },
    { id: "recursos-humanos", name: "Recursos Humanos", icon: "users", hasSubmenu: true },
    { id: "facturacion", name: "Facturación", icon: "chart", hasSubmenu: true },
    { id: "permisos", name: "Permisos/Solicitudes e Incidencias", icon: "list", hasSubmenu: true },
  ];

  const toggleModule = (moduleId) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
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
      list: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    };

    return icons[iconName] || icons.shield;
  };

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          w-72 bg-white border-r border-gray-200
          flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          shadow-2xl
        `}
      >
        {/* Logo */}
        <div className="pt-4 pb-4 px-6 border-b border-gray-200 flex justify-center">
          <div className="relative w-40 h-40">
            <Image
              src="/images/logotipo_zeus_safety.png"
              alt="Zeus Safety Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          <div className="px-6 mb-5">
            <h3 className="text-xs font-black text-gray-700 uppercase tracking-widest">
              MÓDULOS
            </h3>
          </div>
          <ul className="space-y-1.5 px-3">
            {modules.map((module) => (
              <li key={module.id}>
                <button
                  onClick={() => toggleModule(module.id)}
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:via-indigo-50 hover:to-slate-50 transition-all duration-200 group hover:shadow-md border border-transparent hover:border-blue-200/60 active:scale-[0.98]"
                >
                  <div className="flex items-center space-x-3.5">
                    <span className="text-gray-600 group-hover:text-blue-600 transition-colors flex-shrink-0">
                      {getIcon(module.icon)}
                    </span>
                    <span className="text-sm font-semibold text-gray-800 group-hover:text-gray-900 text-left leading-tight">
                      {module.name === "Permisos/Solicitudes e Incidencias" ? (
                        <>
                          Permisos/Solicitudes e<br />
                          Incidencias
                        </>
                      ) : (
                        module.name
                      )}
                    </span>
                  </div>
                  {module.hasSubmenu && (
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-all duration-200 ${
                        expandedModules[module.id] ? "rotate-180 text-blue-600" : "group-hover:text-blue-500"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* User info and logout */}
        <div className="p-4 border-t border-gray-200/80 bg-gradient-to-br from-gray-50/50 via-white to-white space-y-3">
          <div className="flex items-center space-x-3 px-4 py-3.5 bg-white rounded-xl border border-gray-200/60 shadow-md hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-blue-500/20 backdrop-blur-sm border-2 border-blue-400/40 rounded-xl flex items-center justify-center shadow-sm">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">
                {user?.name || user?.email || "Usuario"}
              </p>
              <p className="text-xs text-gray-600 font-semibold">Administrador</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2.5 px-4 py-3.5 bg-red-500/20 backdrop-blur-sm border-2 border-red-400/40 hover:bg-red-500/30 hover:border-red-500/60 text-red-600 rounded-xl font-bold transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98] text-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}
