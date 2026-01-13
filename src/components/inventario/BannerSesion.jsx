"use client";

import { useState } from "react";

const JEFE_PWD = "0427";

export function BannerSesion({ sesionActual, onCerrar }) {
  const [mostrandoConfirmacion, setMostrandoConfirmacion] = useState(false);

  const handleCerrar = () => {
    const pwd = prompt("Contraseña para cerrar inventario");
    if (pwd !== JEFE_PWD) {
      alert("Contraseña incorrecta");
      return;
    }

    if (!confirm("¿Cerrar el inventario actual? No se podrán iniciar nuevos conteos con este número.")) {
      return;
    }

    if (onCerrar) {
      onCerrar();
    }
  };

  if (!sesionActual?.numero) return null;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 mb-4 rounded-lg shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-semibold">Inventario:</span>
          <span className="font-bold">{sesionActual.numero}</span>
          {sesionActual.creadoPor && (
            <>
              <span>•</span>
              <span>Creado por: {sesionActual.creadoPor}</span>
            </>
          )}
          {sesionActual.inicio && (
            <>
              <span>•</span>
              <span>Inicio: {sesionActual.inicio}</span>
            </>
          )}
        </div>
        <button
          onClick={handleCerrar}
          className={`px-3 py-1.5 rounded-lg font-semibold text-sm transition-all ${
            sesionActual.activo
              ? "bg-green-500 hover:bg-green-600"
              : "bg-red-500 hover:bg-red-600"
          }`}
          title={sesionActual.activo ? "Inventario abierto (clic para cerrar)" : "Inventario cerrado"}
        >
          {sesionActual.activo ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
