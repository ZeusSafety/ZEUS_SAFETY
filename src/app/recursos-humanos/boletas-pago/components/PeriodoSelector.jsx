'use client';

import React, { useState } from 'react';
import Modal from '../../../../components/ui/Modal';

const PeriodoSelector = ({ periodos, selectedPeriodoId, onSelectPeriodo, onCreatePeriodo }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [newPeriodo, setNewPeriodo] = useState({
    anio: new Date().getFullYear(),
    mes: new Date().getMonth() + 1,
    descripcion: '',
    fecha_cierre: '',
    estado: 'ABIERTO'
  });

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const handleCreate = async () => {
    try {
      setCreating(true);
      setErrorMsg('');
      const desc = `${meses[newPeriodo.mes - 1]} ${newPeriodo.anio}`;
      await onCreatePeriodo({ ...newPeriodo, descripcion: desc });
      setIsModalOpen(false);
      setNewPeriodo({
        anio: new Date().getFullYear(),
        mes: new Date().getMonth() + 1,
        descripcion: '',
        fecha_cierre: '',
        estado: 'ABIERTO'
      });
    } catch (error) {
      console.error('Error creating period:', error);
      setErrorMsg(error.message || 'Error al crear el período');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4" style={{ fontFamily: 'var(--font-poppins)' }}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center text-white shadow-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Seleccionar Período</h2>
            <p className="text-[10px] text-gray-500 font-medium">Elige el mes de planilla a gestionar</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {periodos.length === 0 ? (
            <span className="text-xs text-gray-400 italic">No hay períodos creados</span>
          ) : (
            periodos.map((p) => (
              <button
                key={p.ID_PERIODO}
                onClick={() => onSelectPeriodo(p.ID_PERIODO)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-200 border ${
                  selectedPeriodoId === p.ID_PERIODO
                    ? 'bg-gradient-to-br from-blue-700 to-blue-800 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600'
                }`}
              >
                {p.DESCRIPCION}
              </button>
            ))
          )}

          <button
            onClick={() => { setIsModalOpen(true); setErrorMsg(''); }}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-br from-blue-700 to-blue-800 text-white rounded-lg text-[10px] font-bold shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200 active:scale-[0.98]"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Nuevo Período</span>
          </button>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Crear Nuevo Período de Pago"
        size="md"
        primaryButtonText={creating ? "Creando..." : "Crear Período"}
        onPrimaryButtonClick={handleCreate}
        secondaryButtonText="Cancelar"
      >
        <div className="space-y-4 p-2" style={{ fontFamily: 'var(--font-poppins)' }}>
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
              <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              <p className="text-xs text-red-700 font-semibold">{errorMsg}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block ml-0.5">Año</label>
              <input
                type="number"
                value={newPeriodo.anio}
                onChange={(e) => setNewPeriodo({ ...newPeriodo, anio: parseInt(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none bg-gray-50/50 text-sm font-semibold text-gray-900"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block ml-0.5">Mes</label>
              <select
                value={newPeriodo.mes}
                onChange={(e) => setNewPeriodo({ ...newPeriodo, mes: parseInt(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none bg-gray-50/50 text-sm font-semibold text-gray-900 cursor-pointer"
              >
                {meses.map((m, idx) => (
                  <option key={m} value={idx + 1}>{m}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block ml-0.5">Fecha de Cierre</label>
            <input
              type="date"
              value={newPeriodo.fecha_cierre}
              onChange={(e) => setNewPeriodo({ ...newPeriodo, fecha_cierre: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none bg-gray-50/50 text-sm font-semibold text-gray-900"
            />
          </div>

          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-start space-x-2">
             <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
             <p className="text-[10px] text-blue-700 font-medium leading-relaxed">
               El período se creará con el estado <strong>ABIERTO</strong>. Podrá subir boletas y modificarlas hasta que decida cerrarlo oficialmente.
             </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PeriodoSelector;
