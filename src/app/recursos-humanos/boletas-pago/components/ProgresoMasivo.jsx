'use client';

import React from 'react';

const ProgresoMasivo = ({ total, actual, completado, onReviewAll }) => {
  const porcentaje = total > 0 ? Math.round((actual / total) * 100) : 0;

  if (total === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50" style={{ fontFamily: 'var(--font-poppins)' }}>
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-5 w-[340px]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center text-white shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-gray-900">Procesando PDFs</h3>
          </div>
          {!completado ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-700 border-t-transparent"></div>
          ) : (
            <div className="bg-green-100 p-1 rounded-lg text-green-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider">Avance</span>
          <span className="text-[9px] font-bold text-gray-400">{actual} de {total}</span>
        </div>

        <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden mb-3">
          <div 
            className={`h-full bg-gradient-to-r from-blue-600 to-blue-800 rounded-full transition-all duration-500 ease-out ${porcentaje < 100 ? 'animate-pulse' : ''}`}
            style={{ width: `${porcentaje}%` }}
          ></div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-[10px] text-gray-500 font-medium max-w-[180px]">
            {completado 
              ? '¡Listo! Revise los datos extraídos.' 
              : 'Extrayendo información...'}
          </p>
          {completado && (
            <button 
              onClick={onReviewAll}
              className="flex items-center space-x-1 px-3 py-1.5 bg-gradient-to-br from-blue-700 to-blue-800 text-white rounded-lg text-[10px] font-bold shadow-sm hover:shadow-md transition-all active:scale-[0.95]"
            >
              <span>Revisar</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgresoMasivo;
