"use client";

import { useEffect, useRef } from "react";

export function LocationPanel({ isOpen, onClose }) {
  const panelRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Mapa de San Martín de Porres, Lima, Perú
  // Coordenadas: -11.9994, -77.0775
  // Usando parámetros para minimizar controles y información
  const mapUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d31220.456789!2d-77.0775!3d-11.9994!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTHCsDU5JzU3LjgiUyA3N8KwMDQnMzkuMCJX!5e0!3m2!1ses!2spe!4v1234567890123!5m2!1ses!2spe&hl=es&z=13`;

  return (
    <>
      {/* Overlay sutil - igual que notificaciones */}
      <div 
        className="fixed inset-0 bg-black/10 z-[10000] transition-opacity duration-300"
        onClick={onClose}
        style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed top-14 right-2 sm:right-4 md:right-6 lg:right-8 xl:right-10 2xl:right-12 w-[calc(100vw-1rem)] sm:w-[420px] md:w-[480px] lg:w-[520px] xl:w-[560px] 2xl:w-[600px] h-[calc(100vh-5rem)] sm:h-[500px] md:h-[550px] lg:h-[580px] bg-white rounded-2xl shadow-2xl border-2 border-gray-200/60 z-[10001] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1E63F7] via-[#1E63F7] to-[#1E63F7] px-4 sm:px-5 md:px-6 py-3 sm:py-4 flex items-center justify-between border-b-2 border-blue-800">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">Ubicación</h3>
              <p className="text-[10px] sm:text-xs text-white/80">San Martín de Porres, Lima</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-white/20 transition-colors"
            aria-label="Cerrar"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5 md:p-6">
          {/* Mensaje Próximamente */}
          <div className="text-center mb-3 sm:mb-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[#1E63F7] via-[#1E63F7] to-[#1E63F7] rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
              <svg
                className="w-6 h-6 sm:w-7 sm:h-7 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <rect x="6" y="6" width="12" height="12" rx="1" />
                <line x1="12" y1="3" x2="12" y2="6" />
                <circle cx="12" cy="2" r="1" />
                <circle cx="9" cy="10" r="1.5" />
                <circle cx="15" cy="10" r="1.5" />
                <path d="M9 14h6" strokeLinecap="round" />
              </svg>
            </div>
            <h4 className="text-base sm:text-lg font-bold text-gray-800 mb-1">
              Próximamente
            </h4>
            <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
              Estamos trabajando en nuestro chatbot.
            </p>
          </div>

          {/* Mapa */}
          <div className="w-full h-[300px] sm:h-[320px] md:h-[350px] rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg relative">
            <iframe
              src={mapUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Mapa de San Martín de Porres, Lima"
            />
            {/* Overlay para ocultar la tarjeta de información de Google Maps */}
            <div 
              className="absolute top-0 left-0 w-full h-24 pointer-events-none z-10"
              style={{ 
                background: 'linear-gradient(to bottom, rgba(255,255,255,1) 0%, rgba(255,255,255,0.98) 40%, rgba(255,255,255,0.7) 70%, rgba(255,255,255,0) 100%)'
              }}
            />
            {/* Overlay central para ocultar tarjeta en el centro del mapa */}
            <div 
              className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-40 pointer-events-none z-10"
              style={{ 
                background: 'rgba(255,255,255,0.95)',
                borderRadius: '8px',
                boxShadow: '0 0 30px rgba(255,255,255,0.9)'
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}

