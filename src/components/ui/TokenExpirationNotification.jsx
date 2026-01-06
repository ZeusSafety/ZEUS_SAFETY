"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function TokenExpirationNotification() {
  const [showNotification, setShowNotification] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const checkTokenExpiration = () => {
      const tokenCreatedAt = localStorage.getItem("tokenCreatedAt");
      if (!tokenCreatedAt) {
        setShowNotification(false);
        return;
      }

      const createdAt = parseInt(tokenCreatedAt);
      const now = Date.now();
      const tokenDuration = 3 * 60 * 60 * 1000; // 3 horas en milisegundos
      const expirationTime = createdAt + tokenDuration;
      const timeUntilExpiration = expirationTime - now;
      const fiveMinutes = 5 * 60 * 1000; // 5 minutos en milisegundos

      // Si ya expiró, redirigir al login
      if (timeUntilExpiration <= 0) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("tokenCreatedAt");
        router.push("/login");
        return;
      }

      // Si faltan 5 minutos o menos, mostrar notificación
      if (timeUntilExpiration <= fiveMinutes) {
        setShowNotification(true);
        const totalSeconds = Math.floor(timeUntilExpiration / 1000);
        setTimeRemaining(totalSeconds);
      } else {
        setShowNotification(false);
      }
    };

    // Verificar inmediatamente
    checkTokenExpiration();

    // Verificar cada segundo
    const interval = setInterval(checkTokenExpiration, 1000);

    return () => clearInterval(interval);
  }, [router]);

  if (!showNotification) return null;

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <div className="fixed top-4 right-4 z-[9999] bg-yellow-500 border-2 border-yellow-600 rounded-lg shadow-xl p-4 max-w-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-5 h-5 text-yellow-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="font-bold text-yellow-900 text-sm">Sesión por expirar</h3>
          </div>
          <p className="text-yellow-900 text-sm">
            Tu sesión expirará en {minutes}:{seconds.toString().padStart(2, '0')}. Por favor, guarda tu trabajo.
          </p>
        </div>
        <button
          onClick={() => setShowNotification(false)}
          className="text-yellow-900 hover:text-yellow-950 transition-colors"
          aria-label="Cerrar notificación"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

