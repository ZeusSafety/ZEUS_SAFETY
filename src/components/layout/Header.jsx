"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { NotificationsPanel } from "./NotificationsPanel";

export function Header({ onMenuToggle }) {
  const router = useRouter();
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationCount = 15; // Contador de notificaciones no leídas
  
  // Verificar si el usuario puede ver el botón de configuración
  // Solo rol 1 (administrador) puede ver el botón de configuración
  // Rol 2 (usuario normal) NO puede ver el botón
  const canSeeConfig = user?.rol === 1 || user?.isAdmin === true;

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      setCurrentTime(`${hours}:${minutes}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <header className="h-20 bg-white border-b border-gray-200/80 flex items-center justify-between px-8 shadow-sm" style={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
        {/* Left section */}
        <div className="flex items-center space-x-6">
          <button
            onClick={onMenuToggle}
            className="p-2.5 rounded-xl hover:bg-gray-50 transition-all duration-200 group"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6 text-gray-700 group-hover:text-gray-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center space-x-3">
            <div className="h-8 w-1 bg-blue-800/60 rounded-full"></div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Sistema de Integración
            </h1>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <button 
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className={`relative p-3 rounded-xl transition-all duration-200 group ${
              notificationsOpen 
                ? "bg-gradient-to-br from-blue-50 to-slate-50 text-blue-600 shadow-md" 
                : "hover:bg-gray-50 text-gray-600 hover:text-gray-900"
            }`}
            aria-label="Notificaciones"
          >
            <svg className="w-5 h-5 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] bg-gradient-to-br from-red-500 via-red-600 to-red-700 text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5 shadow-lg ring-2 ring-white">
                {notificationCount > 99 ? "99+" : notificationCount}
              </span>
            )}
          </button>

          {/* Settings - Solo mostrar si el rol es 1 (administrador) */}
          {canSeeConfig && (
            <button 
              onClick={() => router.push("/configuracion")}
              className="p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 group text-gray-600 hover:text-blue-800" 
              aria-label="Configuración"
            >
              <svg className="w-5 h-5 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          )}

          {/* Time */}
          <div className="px-5 py-2.5 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200/60 shadow-sm">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-bold text-gray-800 tabular-nums">{currentTime}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Notifications Panel */}
      <NotificationsPanel
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notificationCount={notificationCount}
      />
    </>
  );
}
