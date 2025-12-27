"use client";

import { useState, useEffect } from "react";

export function WelcomeBanner({ userName, onClose }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-cerrar después de 4 segundos
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        if (onClose) onClose();
      }, 300); // Esperar a que termine la animación
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`fixed top-24 right-4 z-50 transition-all duration-300 max-w-sm ${
        isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"
      }`}
    >
      <div className="bg-green-50 border-l-4 border-green-500 rounded-lg shadow-lg px-4 py-3 flex items-start space-x-3 relative overflow-hidden">
        {/* Punto verde animado */}
        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-green-500 animate-pulse mt-1.5"></div>

        {/* Mensaje de bienvenida */}
        <div className="flex-1 min-w-0">
          <p className="text-gray-800 font-medium text-sm" style={{ fontFamily: 'var(--font-poppins)' }}>
            Sesión iniciada con éxito
          </p>
          <p className="text-gray-800 font-medium text-sm mt-0.5" style={{ fontFamily: 'var(--font-poppins)' }}>
            Bienvenido, {userName}!
          </p>
        </div>

        {/* Botón de cerrar discreto */}
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => {
              if (onClose) onClose();
            }, 300);
          }}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
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

