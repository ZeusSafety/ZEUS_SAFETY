'use client';

import React from 'react';
import Modal from '../../../../components/ui/Modal';

const BoletaDetalle = ({ isOpen, onClose, boleta }) => {
  if (!boleta) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detalle de Boleta - ${boleta.TRABAJADOR || 'N/A'}`}
      size="5xl"
      hideFooter={true}
    >
      <div className="p-4 space-y-6" style={{ fontFamily: 'var(--font-poppins)' }}>
        {/* Header Info */}
        <div className="bg-gradient-to-br from-blue-700 to-blue-800 p-6 rounded-xl text-white shadow-lg">
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-blue-200 uppercase tracking-wider block">Trabajador</span>
                  <h3 className="text-xl font-bold tracking-tight">{boleta.TRABAJADOR}</h3>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <div>
                  <span className="text-[8px] font-bold text-blue-300 uppercase tracking-wider block mb-0.5">Documento</span>
                  <span className="text-xs font-bold bg-white/10 px-2 py-0.5 rounded border border-white/20">{boleta.NUMERO_DOCUMENTO}</span>
                </div>
                <div>
                  <span className="text-[8px] font-bold text-blue-300 uppercase tracking-wider block mb-0.5">Área</span>
                  <span className="text-xs font-bold bg-white/10 px-2 py-0.5 rounded border border-white/20">{boleta.AREA}</span>
                </div>
                <div>
                  <span className="text-[8px] font-bold text-blue-300 uppercase tracking-wider block mb-0.5">Cargo</span>
                  <span className="text-xs font-bold bg-white/10 px-2 py-0.5 rounded border border-white/20">{boleta.CARGO}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-center md:items-end justify-center">
              <div className="bg-white p-4 rounded-xl shadow-lg text-center min-w-[180px]">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Neto a Pagar</span>
                <span className="text-2xl font-bold text-blue-900">{formatCurrency(boleta.NETO_PAGAR)}</span>
                <div className="mt-2 px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[8px] font-bold uppercase tracking-wider border border-blue-100">
                  Período: {boleta.PERIODO}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Ingresos */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-2 bg-green-50 border-b border-green-100 flex items-center space-x-2">
              <div className="w-1 h-4 bg-green-500 rounded-full"></div>
              <h4 className="text-[10px] font-bold text-green-800 uppercase tracking-wider">Ingresos</h4>
            </div>
            <div className="divide-y divide-gray-50">
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs text-gray-600">Remuneración Básica</span>
                <span className="text-xs font-bold text-gray-900">{formatCurrency(boleta.REMUNERACION_BASICA)}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5 bg-green-50/50">
                <span className="text-xs font-bold text-green-700">Total Ingresos</span>
                <span className="text-sm font-bold text-green-700">{formatCurrency(boleta.TOTAL_INGRESOS)}</span>
              </div>
            </div>
          </div>

          {/* Descuentos */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-2 bg-red-50 border-b border-red-100 flex items-center space-x-2">
              <div className="w-1 h-4 bg-red-500 rounded-full"></div>
              <h4 className="text-[10px] font-bold text-red-800 uppercase tracking-wider">Descuentos y Retenciones</h4>
            </div>
            <div className="divide-y divide-gray-50">
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs text-gray-600">Total Descuentos</span>
                <span className="text-xs font-bold text-red-600">-{formatCurrency(boleta.TOTAL_DESCUENTOS)}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs text-gray-600">Aportes Trabajador</span>
                <span className="text-xs font-bold text-orange-600">-{formatCurrency(boleta.TOTAL_APORTES_TRAB)}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5 bg-red-50/50">
                <span className="text-xs font-bold text-red-700">Total Deducciones</span>
                <span className="text-sm font-bold text-red-700">{formatCurrency(parseFloat(boleta.TOTAL_DESCUENTOS || 0) + parseFloat(boleta.TOTAL_APORTES_TRAB || 0))}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Summary */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center space-x-6">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-blue-900">{boleta.DIAS_LABORADOS || 0}</span>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Días Lab.</span>
            </div>
            <div className="w-px h-8 bg-gray-200"></div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-gray-400">{boleta.DIAS_NO_LABORADOS || 0}</span>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Inasist.</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider ${
              boleta.ESTADO_BOLETA === 'EMITIDO' ? 'bg-green-100 text-green-700' : 
              boleta.ESTADO_BOLETA === 'REVISADO' ? 'bg-amber-100 text-amber-700' : 
              'bg-gray-100 text-gray-500'
            }`}>
              {boleta.ESTADO_BOLETA}
            </div>
          </div>
        </div>

        {/* PDF Link */}
        {boleta.URL_PDF_EMPRESA && (
          <div className="flex justify-center">
            <a 
              href={boleta.URL_PDF_EMPRESA} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-2 bg-gradient-to-br from-blue-700 to-blue-800 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Descargar Boleta PDF</span>
            </a>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default BoletaDetalle;
