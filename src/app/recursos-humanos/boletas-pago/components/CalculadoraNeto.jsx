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

  return (
    <div className="bg-gradient-to-br from-blue-700 to-blue-900 text-white rounded-3xl p-8 shadow-2xl sticky top-6 font-poppins border-x-4 border-white/10 overflow-hidden transform hover:scale-[1.02] transition-transform duration-300">
      <div className="absolute top-0 right-0 p-4 opacity-10">
         <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center space-x-2 mb-6">
           <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
           </div>
           <h3 className="text-sm font-bold uppercase tracking-widest text-blue-200">Resumen en Tiempo Real</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center group cursor-default">
            <span className="text-sm font-bold text-blue-300 group-hover:text-blue-100 transition-colors">Total Ingresos:</span>
            <span className="text-xl font-black">{formatCurrency(totalIngresos)}</span>
          </div>
          <div className="flex justify-between items-center group cursor-default">
            <span className="text-sm font-bold text-red-300 group-hover:text-red-100 transition-colors">Total Descuentos:</span>
            <span className="text-xl font-black text-red-300">-{formatCurrency(totalDescuentos)}</span>
          </div>
          <div className="flex justify-between items-center group cursor-default">
            <span className="text-sm font-bold text-orange-300 group-hover:text-orange-100 transition-colors">Ap. Trabajador:</span>
            <span className="text-xl font-black text-orange-300">-{formatCurrency(totalAportesTrab)}</span>
          </div>
          
          <div className="pt-6 mt-6 border-t border-white/20 flex flex-col items-center">
            <span className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-1.5 opacity-80">Neto a Pagar</span>
            <span className="text-5xl font-black text-white hover:scale-110 transition-transform duration-300 cursor-default select-none shadow-blue-900 drop-shadow-xl">
              {formatCurrency(netoPagar)}
            </span>
          </div>
        </div>
      </div>
      
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-400/10 rounded-full blur-3xl pointer-events-none"></div>
    </div>
  );
};

export default CalculadoraNeto;
