"use client";

import { useState, useEffect } from "react";

export function WelcomeBanner({ userName, onClose }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-cerrar después de 3.5 segundos
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        if (onClose) onClose();
      }, 250); // Esperar a que termine la animación de salida
    }, 3500);

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`fixed top-24 right-4 z-50 max-w-sm transition-all duration-300 ease-out ${
        isVisible 
          ? "opacity-100 translate-x-0" 
          : "opacity-0 translate-x-full pointer-events-none"
      }`}
      style={{
        transitionTimingFunction: isVisible ? 'cubic-bezier(0.16, 1, 0.3, 1)' : 'cubic-bezier(0.4, 0, 1, 1)',
        transitionDuration: isVisible ? '300ms' : '250ms'
      }}
    >
      <div className="bg-[#F0FDF4] border-l-4 border-[#22C55E] rounded-xl px-4 py-3 flex items-start space-x-2.5 relative overflow-hidden" style={{ boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.08), 0 2px 8px -2px rgba(0, 0, 0, 0.04)' }}>
        {/* Punto verde animado - pequeño y discreto */}
        <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse mt-2"></div>

        {/* Mensaje de bienvenida */}
        <div className="flex-1 min-w-0">
          <p className="text-[#1F2937] font-semibold text-base leading-tight" style={{ fontFamily: 'var(--font-poppins)' }}>
            ¡Bienvenido, {userName}!
          </p>
          <p className="text-[#1F2937] text-xs mt-1 font-normal leading-relaxed opacity-70" style={{ fontFamily: 'var(--font-poppins)' }}>
            Sesión iniciada correctamente
          </p>
        </div>

        {/* Botón de cerrar discreto */}
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => {
              if (onClose) onClose();
            }, 250);
          }}
          className="flex-shrink-0 text-[#1F2937] hover:text-[#1F2937] opacity-40 hover:opacity-60 transition-opacity p-1 rounded hover:bg-white/50"
          aria-label="Cerrar"
        >
          <svg
            className="w-4 h-4"
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

