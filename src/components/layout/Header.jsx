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
  const [tokenTimeRemaining, setTokenTimeRemaining] = useState(null);
  const [showExpirationWarning, setShowExpirationWarning] = useState(false);
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

  useEffect(() => {
    const checkTokenExpiration = () => {
      const tokenCreatedAt = localStorage.getItem("tokenCreatedAt");
      if (!tokenCreatedAt) {
        setTokenTimeRemaining(null);
        setShowExpirationWarning(false);
        return;
      }

      const createdAt = parseInt(tokenCreatedAt);
      const now = Date.now();
      const tokenDuration = 3 * 60 * 60 * 1000; // 3 horas
      const expirationTime = createdAt + tokenDuration;
      const timeUntilExpiration = expirationTime - now;
      const fiveMinutes = 5 * 60 * 1000; // 5 minutos

      if (timeUntilExpiration <= 0) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("tokenCreatedAt");
        router.push("/login");
        return;
      }

      const totalSeconds = Math.floor(timeUntilExpiration / 1000);
      setTokenTimeRemaining(totalSeconds);
      setShowExpirationWarning(timeUntilExpiration <= fiveMinutes);
    };

    checkTokenExpiration();
    const interval = setInterval(checkTokenExpiration, 1000);

    return () => clearInterval(interval);
  }, [router]);


  return (
    <>
      <header className="bg-white border-b border-gray-200/80 flex items-center justify-between py-3" style={{ boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.08), 0 1px 2px 0 rgba(0, 0, 0, 0.04)' }}>
        <div className="w-full max-w-[1400px] xl:max-w-[1680px] 2xl:max-w-[1920px] mx-auto pl-1 sm:pl-1.5 md:pl-2 lg:pl-2.5 xl:pl-3 2xl:pl-3.5 pr-2 sm:pr-3 md:pr-4 lg:pr-5 xl:pr-6 2xl:pr-7 flex items-center justify-between">
          {/* Left section */}
          <div className="flex items-center space-x-0.5 sm:space-x-1">
            <button
              onClick={onMenuToggle}
              className="p-2 rounded-lg hover:bg-slate-200 transition-all duration-200 group"
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5 text-gray-700 group-hover:text-gray-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-sm sm:text-sm md:text-base font-medium text-gray-900 tracking-tight whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
              Sistema de Integración
            </h1>
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-2">
            {/* Notifications */}
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className={`relative p-2 rounded-lg transition-all duration-200 group ${notificationsOpen
                ? "bg-[#E9F1FF] text-[var(--azul-oscuro)] shadow-md"
                : "hover:bg-slate-200"
                }`}
              aria-label="Notificaciones"
            >
              <svg className="w-4 h-4 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} style={{ color: notificationsOpen ? 'var(--azul-oscuro)' : '#555' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {notificationCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-gradient-to-br from-red-500 via-red-600 to-red-700 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg ring-2 ring-white">
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              )}
            </button>

            {/* Settings - Solo mostrar si el rol es 1 (administrador) */}
            {canSeeConfig && (
              <button
                onClick={() => router.push("/configuracion")}
                className="p-2 rounded-lg hover:bg-slate-200 transition-all duration-200 group text-gray-700 hover:text-[#001F3D]"
                aria-label="Configuración"
              >
                <svg className="w-4 h-4 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            )}

            {/* Time */}
            <div className="px-3 py-1.5 bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200/60 shadow-sm">
              <div className="flex items-center space-x-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} style={{ color: '#555' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-bold text-gray-800 tabular-nums">{currentTime}</span>
              </div>
            </div>

            {/* Token Expiration Counter */}
            {tokenTimeRemaining !== null && tokenTimeRemaining > 0 && (
              <div className={`px-3 py-1.5 rounded-lg border shadow-sm ${showExpirationWarning
                ? "bg-gradient-to-br from-yellow-500 to-yellow-600 border-2 border-yellow-700"
                : "bg-gradient-to-br from-[#E9F1FF] to-[#D9E8FF] border border-[#002D5A]/30"
                }`}>
                <div className="flex items-center space-x-1.5">
                  <svg className={`w-3.5 h-3.5 ${showExpirationWarning ? "text-yellow-900" : "text-[#002D5A]"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className={`text-xs font-bold tabular-nums ${showExpirationWarning ? "text-yellow-900" : "text-[#002D5A]"}`}>
                    {Math.floor(tokenTimeRemaining / 3600)}:{(Math.floor((tokenTimeRemaining % 3600) / 60)).toString().padStart(2, '0')}:{(tokenTimeRemaining % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>
            )}
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
