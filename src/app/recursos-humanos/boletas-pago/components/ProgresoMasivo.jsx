'use client';

import React, { useState } from 'react';

const ProgresoMasivo = ({ total, actual, completado, onReviewAll }) => {
  const [minimizado, setMinimizado] = useState(false);
  const porcentaje = total > 0 ? Math.round((actual / total) * 100) : 0;

  if (total === 0) return null;

  // Si está minimizado, mostrar solo un botón pequeño
  if (minimizado) {
    return (
      <div className="fixed top-20 right-6 z-50" style={{ fontFamily: 'var(--font-poppins)' }}>
        <button
          onClick={() => setMinimizado(false)}
          className="bg-white rounded-xl border border-gray-200 shadow-lg p-3 hover:shadow-xl transition-all hover:border-blue-500"
          title="Mostrar progreso"
        >
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center text-white shadow-sm">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            {completado ? (
              <div className="bg-green-100 p-1 rounded-lg text-green-600">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-700 border-t-transparent"></div>
            )}
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-20 right-6 z-50" style={{ fontFamily: 'var(--font-poppins)' }}>
      <div className="bg-white rounded-xl border border-gray-200 shadow-lg w-[320px] relative">
        {/* Botón X para minimizar */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMinimizado(true);
          }}
          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-10"
          title="Minimizar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <button
          onClick={completado ? onReviewAll : undefined}
          className={`w-full p-4 text-left transition-all hover:shadow-xl ${completado ? 'cursor-pointer hover:border-blue-500' : ''}`}
        >
          <div className="flex items-center justify-between mb-3 pr-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center text-white shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-gray-900">Procesando PDFs</h3>
            </div>
            {!completado ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-700 border-t-transparent"></div>
            ) : (
              <div className="bg-green-100 p-1.5 rounded-lg text-green-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
        
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">Avance</span>
          <span className="text-[10px] font-semibold text-gray-500">{actual} de {total}</span>
        </div>

        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-3">
          <div 
            className={`h-full bg-gradient-to-r from-blue-700 to-blue-800 rounded-full transition-all duration-500 ease-out ${porcentaje < 100 ? 'animate-pulse' : ''}`}
            style={{ width: `${porcentaje}%` }}
          ></div>
        </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-600 font-medium">
              {completado 
                ? '¡Listo! Haga clic para revisar los datos extraídos.' 
                : 'Extrayendo información...'}
            </p>
            {completado && (
              <div className="flex items-center space-x-1 text-blue-700">
                <span className="text-xs font-bold">Revisar</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            )}
          </div>
        </button>
      </div>
    </div>
  );
};

export default ProgresoMasivo;
