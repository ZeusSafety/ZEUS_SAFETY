'use client';

import React, { useState, useMemo, useEffect } from 'react';

const BoletaTabla = ({ boletas = [], loading, onVer, onEditar, onGenerarPDF, onExportExcel, filters: externalFilters, onFiltersChange }) => {
  const [internalFilters, setInternalFilters] = useState({ nombre: '', estado: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Usar filtros externos si se proporcionan, sino usar internos
  const filters = externalFilters || internalFilters;
  const setFilters = onFiltersChange || setInternalFilters;

  const getStatusBadge = (estado) => {
    const map = {
      'BORRADOR': { bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-200', dot: 'bg-gray-400', label: 'Borrador' },
      'REVISADO': { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', dot: 'bg-amber-500', label: 'Revisado' },
      'EMITIDO':  { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200', dot: 'bg-green-500', label: 'Emitido' },
    };
    const s = map[estado] || map['BORRADOR'];
    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 ${s.bg} ${s.text} rounded text-[9px] font-bold uppercase tracking-wider border ${s.border}`}>
        <div className={`w-1.5 h-1.5 ${s.dot} rounded-full`}></div>
        <span>{s.label}</span>
      </span>
    );
  };

  const filteredBoletas = useMemo(() => {
    return boletas.filter(b => {
      const matchNombre = !filters.nombre || 
        b.TRABAJADOR?.toLowerCase().includes(filters.nombre.toLowerCase()) || 
        b.NUMERO_DOCUMENTO?.toString().includes(filters.nombre);
      const matchEstado = !filters.estado || b.ESTADO_BOLETA === filters.estado;
      return matchNombre && matchEstado;
    });
  }, [boletas, filters]);

  // Calcular paginación
  const totalPages = Math.max(1, Math.ceil(filteredBoletas.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBoletas = filteredBoletas.slice(startIndex, endIndex);

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.nombre, filters.estado]);

  const goToFirstPage = () => setCurrentPage(1);
  const goToPrevPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(totalPages, prev + 1));
  const goToLastPage = () => setCurrentPage(totalPages);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ fontFamily: 'var(--font-poppins)' }}>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-blue-700 border-b-2 border-blue-800">
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Período</th>
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Trabajador</th>
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Área / Cargo</th>
              <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Rem. Básica</th>
              <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Neto Pagar</th>
              <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Estado</th>
              <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700"></div>
                    <span className="text-sm text-gray-600">Cargando boletas...</span>
                  </div>
                </td>
              </tr>
            ) : filteredBoletas.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-300 mb-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-400 font-medium">No hay boletas generadas</span>
                    <span className="text-[10px] text-gray-300 mt-1">Seleccione un período o suba archivos PDF</span>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedBoletas.map((b) => (
                <tr key={b.ID_BOLETA} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-500">{b.PERIODO || b.MES + '/' + b.ANIO}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div>
                      <span className="text-[10px] font-bold text-gray-900 block">{b.TRABAJADOR}</span>
                      <span className="text-[9px] text-gray-400">DNI: {b.NUMERO_DOCUMENTO}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div>
                      <span className="text-[10px] font-medium text-gray-700 block">{b.AREA}</span>
                      <span className="text-[9px] text-gray-400">{b.CARGO}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center whitespace-nowrap text-[10px] font-bold text-gray-900">S/ {parseFloat(b.REMUNERACION_BASICA || 0).toLocaleString()}</td>
                  <td className="px-3 py-2 text-center whitespace-nowrap text-[10px] font-bold text-green-700">S/ {parseFloat(b.NETO_PAGAR || 0).toLocaleString()}</td>
                  <td className="px-3 py-2 text-center whitespace-nowrap">{getStatusBadge(b.ESTADO_BOLETA)}</td>
                  <td className="px-3 py-2 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center space-x-1">
                      <button 
                        onClick={() => onVer(b.ID_BOLETA)}
                        className="inline-flex items-center space-x-1 px-2 py-1 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg text-[9px] font-semibold hover:opacity-90 transition-all shadow-sm active:scale-[0.95]" 
                        title="Ver Detalle"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>Ver</span>
                      </button>
                      <button 
                        onClick={() => onEditar(b.ID_BOLETA)}
                        disabled={b.ESTADO_BOLETA === 'EMITIDO'}
                        className="inline-flex items-center space-x-1 px-2 py-1 bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-lg text-[9px] font-semibold hover:opacity-90 transition-all shadow-sm active:scale-[0.95] disabled:opacity-30 disabled:cursor-not-allowed" 
                        title="Editar"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Editar</span>
                      </button>
                      {b.ESTADO_BOLETA === 'EMITIDO' ? (
                        <a 
                          href={b.URL_PDF_EMPRESA} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 px-2 py-1 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg text-[9px] font-semibold hover:opacity-90 transition-all shadow-sm"
                          title="Ver PDF"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>PDF</span>
                        </a>
                      ) : (
                        <button 
                          onClick={() => onGenerarPDF(b.ID_BOLETA)}
                          className="inline-flex items-center space-x-1 px-2 py-1 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg text-[9px] font-semibold hover:opacity-90 transition-all shadow-sm active:scale-[0.95]"
                          title="Generar PDF"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span>Emitir</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="bg-slate-200 px-3 py-2 flex items-center justify-between border-t-2 border-slate-300">
        <button 
          onClick={goToFirstPage}
          disabled={currentPage === 1} 
          className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
          aria-label="Primera página"
        >
          «
        </button>
        <button 
          onClick={goToPrevPage}
          disabled={currentPage === 1} 
          className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
          aria-label="Página anterior"
        >
          &lt;
        </button>
        <span className="text-[10px] text-gray-700 font-medium">
          Página {currentPage} de {totalPages}
        </span>
        <button 
          onClick={goToNextPage}
          disabled={currentPage === totalPages} 
          className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
          aria-label="Página siguiente"
        >
          &gt;
        </button>
        <button 
          onClick={goToLastPage}
          disabled={currentPage === totalPages} 
          className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
          aria-label="Última página"
        >
          »
        </button>
      </div>
    </div>
  );
};

export default BoletaTabla;
