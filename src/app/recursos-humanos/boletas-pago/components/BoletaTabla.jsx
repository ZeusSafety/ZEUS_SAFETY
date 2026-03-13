'use client';

import React, { useState } from 'react';

const BoletaTabla = ({ boletas = [], loading, onVer, onEditar, onGenerarPDF, onExportExcel }) => {
  const [filters, setFilters] = useState({ nombre: '', estado: '' });

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

  const filteredBoletas = boletas.filter(b => {
    const matchNombre = !filters.nombre || 
      b.TRABAJADOR?.toLowerCase().includes(filters.nombre.toLowerCase()) || 
      b.NUMERO_DOCUMENTO?.toString().includes(filters.nombre);
    const matchEstado = !filters.estado || b.ESTADO_BOLETA === filters.estado;
    return matchNombre && matchEstado;
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ fontFamily: 'var(--font-poppins)' }}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center text-white shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Historial de Boletas</h2>
              <p className="text-[10px] text-gray-500 font-medium">Listado de boletas generadas</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <input 
              placeholder="Buscar por DNI o nombre..." 
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 focus:border-blue-500 outline-none w-[220px] transition-colors"
              value={filters.nombre}
              onChange={(e) => setFilters({ ...filters, nombre: e.target.value })}
            />
            <select 
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 focus:border-blue-500 cursor-pointer outline-none transition-colors"
              value={filters.estado}
              onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
            >
              <option value="">Todos</option>
              <option value="BORRADOR">Borrador</option>
              <option value="REVISADO">Revisado</option>
              <option value="EMITIDO">Emitido</option>
            </select>
            <button 
              onClick={onExportExcel}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all shadow-sm"
              title="Exportar a Excel"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Excel</span>
            </button>
          </div>
        </div>
      </div>

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
              filteredBoletas.map((b) => (
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

      {/* Footer */}
      <div className="bg-slate-200 px-3 py-2 flex items-center justify-between border-t-2 border-slate-300">
        <span className="text-[10px] text-gray-700 font-medium">Mostrando {filteredBoletas.length} de {boletas.length} boletas</span>
      </div>
    </div>
  );
};

export default BoletaTabla;
