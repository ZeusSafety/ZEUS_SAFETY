'use client';

import React from 'react';
import Decimal from 'decimal.js';

const CalculadoraNeto = ({ ingresos = {}, descuentos = {}, aportesTrabajador = {} }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const calcularTotal = (obj) => {
    return Object.values(obj).reduce((acc, val) => {
      const num = parseFloat(val) || 0;
      return new Decimal(acc).plus(num).toNumber();
    }, 0);
  };

  const totalIngresos = calcularTotal({
    remuneracion_basica: ingresos.remuneracion_basica,
    combustible: ingresos.combustible,
    bono_ingreso: ingresos.bono_ingreso,
    otros_ingresos: ingresos.otros_ingresos
  });

  const totalDescuentos = calcularTotal({
    desc_tardanza: descuentos.desc_tardanza,
    desc_permisos: descuentos.desc_permisos,
    desc_faltas: descuentos.desc_faltas,
    desc_bono: descuentos.desc_bono,
    desc_otros: descuentos.desc_otros
  });

  const totalAportesTrab = calcularTotal({
    comision_afp_pct: aportesTrabajador.comision_afp_pct,
    renta_quinta_ret: aportesTrabajador.renta_quinta_ret,
    prima_seguros_afp: aportesTrabajador.prima_seguros_afp,
    spp_aportacion_obl: aportesTrabajador.spp_aportacion_obl
  });

  const netoPagar = new Decimal(totalIngresos)
    .minus(totalDescuentos)
    .minus(totalAportesTrab)
    .toNumber();

  // Calcular valores individuales de aportes del trabajador
  const comisionAfp = parseFloat(aportesTrabajador.comision_afp_pct) || 0;
  const rentaQuinta = parseFloat(aportesTrabajador.renta_quinta_ret) || 0;
  const primaSeguros = parseFloat(aportesTrabajador.prima_seguros_afp) || 0;
  const sppAportacion = parseFloat(aportesTrabajador.spp_aportacion_obl) || 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sticky top-4" style={{ fontFamily: 'var(--font-poppins)' }}>
      <div className="flex items-center space-x-2 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center text-white shadow-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Resumen en Tiempo Real</h3>
      </div>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-700">Total Ingresos:</span>
          <span className="text-lg font-bold text-gray-900">{formatCurrency(totalIngresos)}</span>
        </div>
        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-700">Total Descuentos:</span>
          <span className="text-lg font-bold text-red-600">-{formatCurrency(totalDescuentos)}</span>
        </div>
        
        {/* Desglose de Aportes del Trabajador */}
        <div className="pb-3 border-b border-gray-100">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-700">Aportes del Trabajador:</span>
            <span className="text-lg font-bold text-orange-600">-{formatCurrency(totalAportesTrab)}</span>
          </div>
          <div className="pl-4 space-y-1.5 mt-2">
            {comisionAfp > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-medium text-gray-600">Comisión AFP Porcentual:</span>
                <span className="text-xs font-semibold text-orange-600">-{formatCurrency(comisionAfp)}</span>
              </div>
            )}
            {rentaQuinta > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-medium text-gray-600">Renta Quinta Categoría:</span>
                <span className="text-xs font-semibold text-orange-600">-{formatCurrency(rentaQuinta)}</span>
              </div>
            )}
            {primaSeguros > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-medium text-gray-600">Prima de Seguros AFP:</span>
                <span className="text-xs font-semibold text-orange-600">-{formatCurrency(primaSeguros)}</span>
              </div>
            )}
            {sppAportacion > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-medium text-gray-600">SPP - Aportación Obligatoria:</span>
                <span className="text-xs font-semibold text-orange-600">-{formatCurrency(sppAportacion)}</span>
              </div>
            )}
            {totalAportesTrab === 0 && (
              <div className="text-[10px] text-gray-400 italic">Sin aportes registrados</div>
            )}
          </div>
        </div>
        
        <div className="pt-4 mt-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <span className="text-xs font-bold text-blue-700 uppercase tracking-wide block mb-2 text-center">Neto a Pagar</span>
          <span className="text-3xl font-black text-blue-900 block text-center">
            {formatCurrency(netoPagar)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CalculadoraNeto;
