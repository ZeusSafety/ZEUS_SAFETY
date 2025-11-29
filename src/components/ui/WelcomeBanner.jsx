"use client";

import { useState, useEffect } from "react";

export function WelcomeBanner({ userName, onClose }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-cerrar después de 2 segundos
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        if (onClose) onClose();
      }, 300); // Esperar a que termine la animación
    }, 2000);

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`fixed top-20 sm:top-24 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 max-w-lg w-full px-4 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
      }`}
    >
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300/60 rounded-lg sm:rounded-xl shadow-lg px-3 sm:px-4 py-2.5 sm:py-3.5 flex items-center space-x-2 sm:space-x-3 animate-slide-in-from-top relative overflow-hidden">
        {/* Efecto de pulso sutil */}
        <div className="absolute inset-0 bg-green-400/20 rounded-lg sm:rounded-xl animate-pulse-slow"></div>
        
        {/* Ícono circular con punto verde */}
        <div className="flex-shrink-0 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 shadow-sm relative z-10 animate-pulse-slow"></div>

        {/* Mensaje de bienvenida */}
        <div className="flex-1 min-w-0 relative z-10">
          <p className="text-green-700 font-semibold text-xs sm:text-sm whitespace-nowrap overflow-hidden text-ellipsis">
            ¡Bienvenido, {userName}! Tu sesión ha sido iniciada
          </p>
        </div>

        {/* Botón de cerrar */}
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => {
              if (onClose) onClose();
            }, 300);
          }}
          className="flex-shrink-0 text-green-600/70 hover:text-green-700 transition-colors p-0.5 sm:p-1 relative z-10"
          aria-label="Cerrar"
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

