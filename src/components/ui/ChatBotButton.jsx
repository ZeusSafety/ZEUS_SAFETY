"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export function ChatBotButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, loading } = useAuth();

  // Escuchar evento para cerrar el chatbot
  useEffect(() => {
    const handleCloseChatbot = () => {
      setIsOpen(false);
    };

    window.addEventListener('closeChatbot', handleCloseChatbot);
    return () => {
      window.removeEventListener('closeChatbot', handleCloseChatbot);
    };
  }, []);

  // Solo mostrar el chatbot si el usuario está autenticado
  if (loading || !user) {
    return null;
  }

  return (
    <>
      {/* Botón flotante circular - Esquina inferior derecha - Solo visible en web */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hidden md:flex fixed bottom-6 right-6 w-14 h-14 bg-[#D9E8FF] backdrop-blur-sm rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 items-center justify-center z-[99999] hover:scale-110 active:scale-95 border-2 border-[#1E63F7]/50 relative overflow-hidden group"
        style={{ position: 'fixed', pointerEvents: 'auto' }}
        aria-label="Abrir chatbot"
      >
        {/* Efecto de pulso de fondo */}
        <div className="absolute inset-0 bg-[#1E63F7]/20 rounded-full animate-pulse"></div>
        
        {/* Efecto de brillo al hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        
        {/* Icono de robot */}
        <svg
          className="w-6 h-6 text-[#1E63F7] relative z-10"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <>
              {/* Cabeza del robot */}
              <rect x="6" y="6" width="12" height="12" rx="1" />
              {/* Antena */}
              <line x1="12" y1="3" x2="12" y2="6" />
              <circle cx="12" cy="2" r="1" />
              {/* Ojos */}
              <circle cx="9" cy="10" r="1.5" />
              <circle cx="15" cy="10" r="1.5" />
              {/* Boca */}
              <path d="M9 14h6" strokeLinecap="round" />
            </>
          )}
        </svg>
      </button>

      {/* Ventana del chat - Solo visible en web */}
      {isOpen && (
        <div className="hidden md:flex fixed bottom-24 right-6 w-80 h-96 bg-white rounded-2xl shadow-2xl border-2 border-gray-200 z-[9998] flex-col overflow-hidden">
          {/* Header del chat */}
          <div className="bg-gradient-to-r from-[#1E63F7] via-[#1E63F7] to-[#1E63F7] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-blue-600"
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
              <h3 className="text-white font-semibold text-sm">Chatbot</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="Cerrar chat"
            >
              <svg
                className="w-5 h-5"
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

          {/* Contenido del chat */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              {/* Mensaje Próximamente */}
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[#1E63F7] via-[#1E63F7] to-[#1E63F7] rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-white"
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
                <h4 className="text-lg font-bold text-gray-800 mb-2">
                  Próximamente
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Estamos trabajando en nuestro chatbot.
                </p>
              </div>

              {/* Separador */}
              <div className="border-t border-gray-200 my-4"></div>

              {/* Enlaces a PDFs */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-700 mb-2">Documentos disponibles:</p>
                
                <a
                  href="https://storage.googleapis.com/archivos_sistema/archivos_generales_zeus/POLITICAS%20DE%20LA%20EMPRESA%20.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-red-50 rounded-lg border border-gray-200 hover:border-red-300 transition-all duration-200 group"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                    {/* Icono PDF real */}
                    <svg
                      className="w-7 h-7 text-red-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      {/* Documento base */}
                      <path
                        d="M6 2h8l4 4v14a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z"
                        fill="white"
                        stroke="currentColor"
                      />
                      {/* Esquina doblada */}
                      <path
                        d="M14 2v4h4"
                        fill="none"
                        stroke="currentColor"
                      />
                      {/* Texto PDF */}
                      <text
                        x="8"
                        y="14"
                        fontSize="6"
                        fill="currentColor"
                        fontWeight="bold"
                        fontFamily="Arial, sans-serif"
                      >
                        PDF
                      </text>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 group-hover:text-red-700 transition-colors">
                      Políticas de la Empresa
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      PDF
                    </p>
                  </div>
                  <svg
                    className="w-4 h-4 text-gray-400 group-hover:text-red-600 transition-colors flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>

                <a
                  href="https://storage.googleapis.com/archivos_sistema/archivos_generales_zeus/REGLAMENTO%20INTERNO%20DE%20TRABAJO%20-%20ZEUS%20SAFETY.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200 group"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    {/* Icono PDF real */}
                    <svg
                      className="w-7 h-7 text-blue-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      {/* Documento base */}
                      <path
                        d="M6 2h8l4 4v14a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z"
                        fill="white"
                        stroke="currentColor"
                      />
                      {/* Esquina doblada */}
                      <path
                        d="M14 2v4h4"
                        fill="none"
                        stroke="currentColor"
                      />
                      {/* Texto PDF */}
                      <text
                        x="8"
                        y="14"
                        fontSize="6"
                        fill="currentColor"
                        fontWeight="bold"
                        fontFamily="Arial, sans-serif"
                      >
                        PDF
                      </text>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">
                      Reglamento Interno de Trabajo
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      PDF
                    </p>
                  </div>
                  <svg
                    className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

