'use client';

import React, { useState, useEffect } from 'react';
import CalculadoraNeto from './CalculadoraNeto';
import boletasService from '../services/boletasService';

const BoletaFormCompleto = ({ initialData, onSave, onEmit, colaboradoresService, isEditing = false, periodos = [] }) => {
  const [activeTab, setActiveTab] = useState(1);
  const [searchColaborador, setSearchColaborador] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [formData, setFormData] = useState(initialData || {
    id_periodo: '',
    id_persona: '',
    situacion: '',
    regimen_pensionario: '',
    cuspp: '',
    dias_laborados: 30,
    dias_no_laborados: 0,
    dias_subsidiados: 0,
    condicion: '',
    jornada_horas: 0,
    jornada_minutos: 0,
    sobretiempo_horas: 0,
    sobretiempo_minutos: 0,
    tardanza_horas: 0,
    tardanza_minutos: 0,
    vac_fecha_salida: '',
    vac_fecha_retorno: '',
    otros_empleadores: false,
    remuneracion_basica: 0,
    combustible: 0,
    bono_ingreso: 0,
    otros_ingresos: 0,
    desc_tardanza: 0,
    desc_permisos: 0,
    desc_faltas: 0,
    desc_bono: 0,
    desc_otros: 0,
    comision_afp_pct: 0,
    renta_quinta_ret: 0,
    prima_seguros_afp: 0,
    spp_aportacion_obl: 0,
    essalud: 0,
    poliza_seguros_688: 0,
    seguro_vida_ley: 0,
    observaciones: '',
    estado_boleta: 'BORRADOR',
    suspensiones: [],
    asistencia_detalle: []
  });

  const [colaborador, setColaborador] = useState(initialData?.colaborador || null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      // Asegurar que suspensiones y asistencia_detalle siempre sean arrays
      const dataToSet = {
        ...initialData,
        suspensiones: Array.isArray(initialData.suspensiones) ? initialData.suspensiones : [],
        asistencia_detalle: Array.isArray(initialData.asistencia_detalle) ? initialData.asistencia_detalle : [],
        // Asegurar valores por defecto para campos de texto
        situacion: initialData.situacion || '',
        regimen_pensionario: initialData.regimen_pensionario || '',
        cuspp: initialData.cuspp || '',
        condicion: initialData.condicion || '',
        observaciones: initialData.observaciones || '',
        vac_fecha_salida: initialData.vac_fecha_salida || '',
        vac_fecha_retorno: initialData.vac_fecha_retorno || '',
        // Asegurar valores por defecto para números
        dias_laborados: initialData.dias_laborados ?? 30,
        dias_no_laborados: initialData.dias_no_laborados ?? 0,
        dias_subsidiados: initialData.dias_subsidiados ?? 0,
        jornada_horas: initialData.jornada_horas ?? 0,
        jornada_minutos: initialData.jornada_minutos ?? 0,
        sobretiempo_horas: initialData.sobretiempo_horas ?? 0,
        sobretiempo_minutos: initialData.sobretiempo_minutos ?? 0,
        tardanza_horas: initialData.tardanza_horas ?? 0,
        tardanza_minutos: initialData.tardanza_minutos ?? 0,
        remuneracion_basica: initialData.remuneracion_basica ?? 0,
        combustible: initialData.combustible ?? 0,
        bono_ingreso: initialData.bono_ingreso ?? 0,
        otros_ingresos: initialData.otros_ingresos ?? 0,
        desc_tardanza: initialData.desc_tardanza ?? 0,
        desc_permisos: initialData.desc_permisos ?? 0,
        desc_faltas: initialData.desc_faltas ?? 0,
        desc_bono: initialData.desc_bono ?? 0,
        desc_otros: initialData.desc_otros ?? 0,
        comision_afp_pct: initialData.comision_afp_pct ?? 0,
        renta_quinta_ret: initialData.renta_quinta_ret ?? 0,
        prima_seguros_afp: initialData.prima_seguros_afp ?? 0,
        spp_aportacion_obl: initialData.spp_aportacion_obl ?? 0,
        essalud: initialData.essalud ?? 0,
        poliza_seguros_688: initialData.poliza_seguros_688 ?? 0,
        seguro_vida_ley: initialData.seguro_vida_ley ?? 0,
        otros_empleadores: initialData.otros_empleadores ?? false
      };
      
      setFormData(prev => ({ ...prev, ...dataToSet }));
      
      if (initialData.colaborador) {
         setColaborador(initialData.colaborador);
         setFormData(prev => ({ ...prev, id_persona: initialData.colaborador.ID_PERSONA || initialData.colaborador.id_persona }));
      }
      
      // Si hay datos_pdf, procesarlos y sobrescribir con los valores del PDF
      if (initialData.datos_pdf) {
        const datosPDF = initialData.datos_pdf;
        setFormData(prev => ({
          ...prev,
          ...dataToSet,
          // Mapear campos del PDF a los campos del formulario (solo si existen en el PDF)
          situacion: datosPDF.situacion !== undefined && datosPDF.situacion !== null ? datosPDF.situacion : prev.situacion,
          regimen_pensionario: datosPDF.regimen_pensionario !== undefined && datosPDF.regimen_pensionario !== null ? datosPDF.regimen_pensionario : prev.regimen_pensionario,
          cuspp: datosPDF.cuspp !== undefined && datosPDF.cuspp !== null ? datosPDF.cuspp : prev.cuspp,
          dias_laborados: datosPDF.dias_laborados !== undefined && datosPDF.dias_laborados !== null ? datosPDF.dias_laborados : prev.dias_laborados,
          dias_no_laborados: datosPDF.dias_no_laborados !== undefined && datosPDF.dias_no_laborados !== null ? datosPDF.dias_no_laborados : prev.dias_no_laborados,
          dias_subsidiados: datosPDF.dias_subsidiados !== undefined && datosPDF.dias_subsidiados !== null ? datosPDF.dias_subsidiados : prev.dias_subsidiados,
          condicion: datosPDF.condicion !== undefined && datosPDF.condicion !== null ? datosPDF.condicion : prev.condicion,
          jornada_horas: datosPDF.jornada_horas !== undefined && datosPDF.jornada_horas !== null ? datosPDF.jornada_horas : prev.jornada_horas,
          jornada_minutos: datosPDF.jornada_minutos !== undefined && datosPDF.jornada_minutos !== null ? datosPDF.jornada_minutos : prev.jornada_minutos,
          sobretiempo_horas: datosPDF.sobretiempo_horas !== undefined && datosPDF.sobretiempo_horas !== null ? datosPDF.sobretiempo_horas : prev.sobretiempo_horas,
          sobretiempo_minutos: datosPDF.sobretiempo_minutos !== undefined && datosPDF.sobretiempo_minutos !== null ? datosPDF.sobretiempo_minutos : prev.sobretiempo_minutos,
          tardanza_horas: datosPDF.tardanza_horas !== undefined && datosPDF.tardanza_horas !== null ? datosPDF.tardanza_horas : prev.tardanza_horas,
          tardanza_minutos: datosPDF.tardanza_minutos !== undefined && datosPDF.tardanza_minutos !== null ? datosPDF.tardanza_minutos : prev.tardanza_minutos,
          otros_empleadores: datosPDF.otros_empleadores !== undefined && datosPDF.otros_empleadores !== null ? datosPDF.otros_empleadores : prev.otros_empleadores,
          remuneracion_basica: datosPDF.remuneracion_basica !== undefined && datosPDF.remuneracion_basica !== null ? datosPDF.remuneracion_basica : prev.remuneracion_basica,
          combustible: datosPDF.combustible !== undefined && datosPDF.combustible !== null ? datosPDF.combustible : prev.combustible,
          bono_ingreso: datosPDF.bono !== undefined && datosPDF.bono !== null ? datosPDF.bono : prev.bono_ingreso,
          otros_ingresos: datosPDF.otros !== undefined && datosPDF.otros !== null ? datosPDF.otros : prev.otros_ingresos,
          comision_afp_pct: datosPDF.comision_afp_pct !== undefined && datosPDF.comision_afp_pct !== null ? datosPDF.comision_afp_pct : prev.comision_afp_pct,
          renta_quinta_ret: datosPDF.renta_quinta_ret !== undefined && datosPDF.renta_quinta_ret !== null ? datosPDF.renta_quinta_ret : prev.renta_quinta_ret,
          prima_seguros_afp: datosPDF.prima_seguros_afp !== undefined && datosPDF.prima_seguros_afp !== null ? datosPDF.prima_seguros_afp : prev.prima_seguros_afp,
          spp_aportacion_obl: datosPDF.spp_aportacion_obl !== undefined && datosPDF.spp_aportacion_obl !== null ? datosPDF.spp_aportacion_obl : prev.spp_aportacion_obl,
          essalud: datosPDF.essalud !== undefined && datosPDF.essalud !== null ? datosPDF.essalud : prev.essalud,
          poliza_seguros_688: datosPDF.poliza_seguros_688 !== undefined && datosPDF.poliza_seguros_688 !== null ? datosPDF.poliza_seguros_688 : prev.poliza_seguros_688,
          seguro_vida_ley: datosPDF.seguro_vida_ley !== undefined && datosPDF.seguro_vida_ley !== null ? datosPDF.seguro_vida_ley : prev.seguro_vida_ley,
          // Procesar suspensiones si existen
          suspensiones: datosPDF.tipo_suspension && datosPDF.motivo_suspension ? 
            [{ tipo: datosPDF.tipo_suspension, motivo: datosPDF.motivo_suspension, numero_dias: datosPDF.dias_suspension || 0 }] : 
            (Array.isArray(prev.suspensiones) ? prev.suspensiones : [])
        }));
      }
    }
  }, [initialData]);

  const buscarColaborador = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      setSearching(true);
      let results = [];
      // Si es numérico, buscar por DNI
      if (/^\d+$/.test(query)) {
        results = await boletasService.buscarColaboradorPorDocumento(query);
      } else {
        // Buscar por nombre
        results = await boletasService.buscarColaboradorPorNombre(query);
      }
      setSearchResults(Array.isArray(results) ? results : []);
    } catch (error) {
      console.error('Error buscando colaborador:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const seleccionarColaborador = (colab) => {
    setColaborador(colab);
    setFormData(prev => ({ ...prev, id_persona: colab.ID_PERSONA || colab.id_persona }));
    setSearchColaborador('');
    setSearchResults([]);
  };

  const tabs = [
    { id: 1, label: 'DATOS DEL TRABAJADOR' },
    { id: 2, label: 'ASISTENCIA' },
    { id: 3, label: 'MOTIVOS DE SUSPENSIÓN' },
    { id: 4, label: 'INGRESOS Y DESCUENTOS' },
    { id: 5, label: 'DETALLE ASISTENCIA' },
    { id: 6, label: 'OBSERVACIONES' }
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) || 0 : (value || ''))
    }));
  };

  const addSuspension = () => {
    setFormData(prev => ({
      ...prev,
      suspensiones: [...prev.suspensiones, { tipo: '', motivo: '', numero_dias: 0 }]
    }));
  };

  const removeSuspension = (index) => {
    setFormData(prev => ({
      ...prev,
      suspensiones: prev.suspensiones.filter((_, i) => i !== index)
    }));
  };

  const handleSuspensionChange = (index, field, value) => {
    setFormData(prev => {
      const newSuspensiones = [...prev.suspensiones];
      newSuspensiones[index][field] = field === 'numero_dias' ? parseInt(value) || 0 : value;
      return { ...prev, suspensiones: newSuspensiones };
    });
  };

  const addAsistenciaDetalle = () => {
    setFormData(prev => ({
      ...prev,
      asistencia_detalle: [...prev.asistencia_detalle, { fecha: '', tipo: 'TARDANZA', horas: 0, minutos: 0, descripcion: '' }]
    }));
  };

  const removeAsistenciaDetalle = (index) => {
    setFormData(prev => ({
      ...prev,
      asistencia_detalle: prev.asistencia_detalle.filter((_, i) => i !== index)
    }));
  };

  const handleAsistenciaDetalleChange = (index, field, value) => {
    setFormData(prev => {
      const newDetalle = [...prev.asistencia_detalle];
      newDetalle[index][field] = (field === 'horas' || field === 'minutos') ? parseInt(value) || 0 : value;
      return { ...prev, asistencia_detalle: newDetalle };
    });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.id_periodo) newErrors.id_periodo = 'El período es obligatorio';
    if (!formData.id_persona && !isEditing) newErrors.id_persona = 'El colaborador es obligatorio';
    if (formData.remuneracion_basica <= 0) newErrors.remuneracion_basica = 'Debe ser mayor a 0';
    if (formData.dias_laborados < 0 || formData.dias_laborados > 31) newErrors.dias_laborados = 'Debe estar entre 0 y 31';
    
    if (formData.vac_fecha_salida && formData.vac_fecha_retorno) {
      if (new Date(formData.vac_fecha_retorno) < new Date(formData.vac_fecha_salida)) {
         newErrors.vac_fecha_retorno = 'Retorno >= salida';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (estado) => {
    if (!validate()) {
       alert('Revise los errores en el formulario');
       return;
    }
    onSave({ ...formData, estado_boleta: estado });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 1:
        return (
          <div className="space-y-6 font-poppins">
            {/* Búsqueda de Colaborador */}
            {!isEditing && (
              <div className="bg-white p-6 rounded-2xl border-2 border-blue-200 shadow-lg">
                <label className="text-sm font-bold text-blue-700 uppercase tracking-wider block mb-3">
                  Buscar Colaborador
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchColaborador}
                    onChange={(e) => {
                      setSearchColaborador(e.target.value);
                      buscarColaborador(e.target.value);
                    }}
                    placeholder="Buscar por DNI o nombre..."
                    className="w-full px-4 py-3 rounded-xl border-2 border-blue-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none text-sm font-semibold"
                  />
                  {searching && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
                    </div>
                  )}
                  {searchResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-2 bg-white border-2 border-blue-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                      {searchResults.map((colab, idx) => (
                        <button
                          key={idx}
                          onClick={() => seleccionarColaborador(colab)}
                          className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-bold text-sm text-gray-900">
                            {colab.NOMBRE} {colab.APELLIDO}
                          </div>
                          <div className="text-xs text-gray-500">
                            DNI: {colab.NUMERO_DOCUMENTO} | {colab.AREA} - {colab.CARGO}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Información de Sistema Zeus (Sólo Lectura)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5 ml-1">Nombre Completo</label>
                    <input readOnly value={colaborador ? `${colaborador.NOMBRE} ${colaborador.APELLIDO}` : ''} className="w-full bg-gray-100/50 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 pointer-events-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5 ml-1">DNI / Documento</label>
                    <input readOnly value={colaborador?.NUMERO_DOCUMENTO || ''} className="w-full bg-gray-100/50 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 pointer-events-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5 ml-1">Área / Cargo</label>
                    <input readOnly value={colaborador ? `${colaborador.AREA} - ${colaborador.CARGO}` : ''} className="w-full bg-gray-100/50 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 pointer-events-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5 ml-1">Fecha Ingreso</label>
                    <input readOnly value={colaborador?.FECHA_INGRESO || ''} className="w-full bg-gray-100/50 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 pointer-events-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5 ml-1">N° Hijos</label>
                    <input readOnly value={colaborador?.CANT_HIJOS || '0'} className="w-full bg-gray-100/50 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 pointer-events-none" />
                  </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-xl shadow-blue-50/50">
              <div className="flex items-center space-x-2 mb-6">
                 <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                 <h3 className="text-sm font-bold text-blue-900 uppercase tracking-widest">Información Contractual y PDF</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block ml-1 flex items-center">
                     Situación
                     {initialData?.datos_pdf?.situacion && <span className="ml-2 px-1.5 py-0.5 bg-blue-50 text-[9px] text-blue-600 rounded">PDF</span>}
                   </label>
                   <input 
                     name="situacion" value={formData.situacion || ''} onChange={handleInputChange} 
                     className={`w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 focus:ring-4 focus:ring-blue-50 outline-none transition-all ${initialData?.datos_pdf?.situacion ? 'border-blue-300' : 'border-gray-100'}`} 
                   />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block ml-1 flex items-center">
                     Régimen Pensionario
                     {initialData?.datos_pdf?.regimen_pensionario && <span className="ml-2 px-1.5 py-0.5 bg-blue-50 text-[9px] text-blue-600 rounded">PDF</span>}
                   </label>
                   <input 
                     name="regimen_pensionario" value={formData.regimen_pensionario || ''} onChange={handleInputChange} 
                     className={`w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 focus:ring-4 focus:ring-blue-50 outline-none transition-all ${initialData?.datos_pdf?.regimen_pensionario ? 'border-blue-300' : 'border-gray-100'}`} 
                   />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block ml-1 flex items-center">
                     CUSPP
                     {initialData?.datos_pdf?.cuspp && <span className="ml-2 px-1.5 py-0.5 bg-blue-50 text-[9px] text-blue-600 rounded">PDF</span>}
                   </label>
                   <input 
                     name="cuspp" value={formData.cuspp || ''} onChange={handleInputChange} 
                     className={`w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 focus:ring-4 focus:ring-blue-50 outline-none transition-all ${initialData?.datos_pdf?.cuspp ? 'border-blue-300' : 'border-gray-100'}`} 
                   />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block ml-1 flex items-center">Condición</label>
                   <input name="condicion" value={formData.condicion || ''} onChange={handleInputChange} className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 focus:ring-4 focus:ring-blue-50 outline-none transition-all" />
                </div>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 font-poppins bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-50">
            <div className="space-y-6">
              <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest border-b pb-2">Jornada General</h4>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Días Laborados</label>
                     <input type="number" name="dias_laborados" value={formData.dias_laborados} onChange={handleInputChange} className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-blue-500 outline-none" />
                     {errors.dias_laborados && <span className="text-[9px] text-red-500 font-bold">{errors.dias_laborados}</span>}
                   </div>
                   <div>
                     <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Días No Laborados</label>
                     <input type="number" name="dias_no_laborados" value={formData.dias_no_laborados} onChange={handleInputChange} className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-blue-500 outline-none" />
                   </div>
                </div>
                <div>
                   <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Días Subsidiados</label>
                   <input type="number" name="dias_subsidiados" value={formData.dias_subsidiados} onChange={handleInputChange} className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-blue-500 outline-none" />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest border-b pb-2">Horas Extras y Tardanzas</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                   <div>
                     <label className="text-[10px] font-bold text-blue-500 uppercase block mb-1">H. Ordinaria</label>
                     <div className="flex items-center space-x-2">
                        <input type="number" name="jornada_horas" value={formData.jornada_horas} onChange={handleInputChange} placeholder="H" className="w-1/2 border-2 border-blue-50 rounded-xl px-3 py-2 text-sm font-bold focus:border-blue-500 outline-none" />
                        <input type="number" name="jornada_minutos" value={formData.jornada_minutos} onChange={handleInputChange} placeholder="M" className="w-1/2 border-2 border-blue-50 rounded-xl px-3 py-2 text-sm font-bold focus:border-blue-500 outline-none" />
                     </div>
                   </div>
                   <div>
                     <label className="text-[10px] font-bold text-orange-500 uppercase block mb-1">Sobretiempo</label>
                     <div className="flex items-center space-x-2">
                        <input type="number" name="sobretiempo_horas" value={formData.sobretiempo_horas} onChange={handleInputChange} placeholder="H" className="w-1/2 border-2 border-orange-50 rounded-xl px-3 py-2 text-sm font-bold focus:border-orange-500 outline-none" />
                        <input type="number" name="sobretiempo_minutos" value={formData.sobretiempo_minutos} onChange={handleInputChange} placeholder="M" className="w-1/2 border-2 border-orange-50 rounded-xl px-3 py-2 text-sm font-bold focus:border-orange-500 outline-none" />
                     </div>
                   </div>
                </div>
                <div className="space-y-4">
                   <div>
                     <label className="text-[10px] font-bold text-red-500 uppercase block mb-1">Tardanzas</label>
                     <div className="flex items-center space-x-2">
                        <input type="number" name="tardanza_horas" value={formData.tardanza_horas} onChange={handleInputChange} placeholder="H" className="w-1/2 border-2 border-red-50 rounded-xl px-3 py-2 text-sm font-bold focus:border-red-500 outline-none" />
                        <input type="number" name="tardanza_minutos" value={formData.tardanza_minutos} onChange={handleInputChange} placeholder="M" className="w-1/2 border-2 border-red-50 rounded-xl px-3 py-2 text-sm font-bold focus:border-red-500 outline-none" />
                     </div>
                   </div>
                   <div className="flex flex-col justify-end h-full mb-1">
                      <label className="flex items-center space-x-3 cursor-pointer bg-slate-50 p-3 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-colors">
                        <input type="checkbox" name="otros_empleadores" checked={formData.otros_empleadores} onChange={handleInputChange} className="w-5 h-5 rounded-lg border-2 border-blue-400 text-blue-600 focus:ring-blue-500" />
                        <span className="text-[10px] font-bold text-slate-700 uppercase leading-none mt-1">Otros Empleadores (5ta)</span>
                      </label>
                   </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
               <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest border-b pb-2">Control de Vacaciones</h4>
               <div className="grid grid-cols-1 gap-5">
                  <div className="bg-gradient-to-br from-blue-50 to-white p-5 rounded-2xl border border-blue-100 space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-blue-600 uppercase block mb-1 ml-1">Fecha Salida</label>
                      <input type="date" name="vac_fecha_salida" value={formData.vac_fecha_salida || ''} onChange={handleInputChange} className="w-full border-2 border-white rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm focus:border-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-blue-600 uppercase block mb-1 ml-1">Fecha Retorno</label>
                      <input type="date" name="vac_fecha_retorno" value={formData.vac_fecha_retorno || ''} onChange={handleInputChange} className="w-full border-2 border-white rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm focus:border-blue-500 outline-none" />
                      {errors.vac_fecha_retorno && <span className="text-[9px] text-red-500 font-bold">{errors.vac_fecha_retorno}</span>}
                    </div>
                  </div>
               </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-xl font-poppins">
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600">
                     <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Suspensiones de Labores</h3>
               </div>
               <button onClick={addSuspension} className="px-6 py-2.5 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-bold text-sm shadow-lg hover:scale-105 transition-all">
                 + Agregar Suspensión
               </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest rounded-tl-2xl">Tipo</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Motivo</th>
                    <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">N° Días</th>
                    <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest rounded-tr-2xl">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(formData.suspensiones || []).map((sus, idx) => (
                    <tr key={idx} className="hover:bg-red-50/10 transition-colors">
                      <td className="px-6 py-4">
                        <input value={sus.tipo || ''} onChange={(e) => handleSuspensionChange(idx, 'tipo', e.target.value)} placeholder="Ej: Enfermedad" className="w-full bg-white border-2 border-gray-100 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-red-500" />
                      </td>
                      <td className="px-6 py-4">
                        <input value={sus.motivo || ''} onChange={(e) => handleSuspensionChange(idx, 'motivo', e.target.value)} placeholder="Descripción del motivo" className="w-full bg-white border-2 border-gray-100 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-red-500" />
                      </td>
                      <td className="px-6 py-4 w-32">
                        <input type="number" value={sus.numero_dias || 0} onChange={(e) => handleSuspensionChange(idx, 'numero_dias', e.target.value)} className="w-full text-center bg-white border-2 border-gray-100 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-red-500" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => removeSuspension(idx)} className="p-2 text-red-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!formData.suspensiones || formData.suspensiones.length === 0) && (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-sm text-gray-400 font-bold italic bg-gray-50/50 rounded-b-2xl uppercase tracking-widest opacity-50">No hay suspensiones registradas</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 font-poppins">
            <div className="space-y-8">
              <div className="bg-white p-8 rounded-3xl border border-green-100 shadow-xl shadow-green-50 overflow-hidden relative">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-green-500 opacity-[0.03] rounded-full -mr-10 -mt-10"></div>
                 <div className="flex items-center space-x-3 mb-8">
                    <div className="p-2 bg-green-100 rounded-xl text-green-600 shadow-sm border border-green-200">
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <h3 className="text-xl font-bold text-green-900 tracking-tight">INGRESOS DEL TRABAJADOR</h3>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-green-600 uppercase tracking-wider block ml-1">Remuneración Básica</label>
                      <input type="number" name="remuneracion_basica" value={formData.remuneracion_basica} onChange={handleInputChange} className="w-full border-2 border-green-50 bg-white rounded-2xl px-5 py-4 text-lg font-black text-green-900 focus:border-green-500 outline-none shadow-sm transition-all" />
                      {errors.remuneracion_basica && <span className="text-[9px] text-red-500 font-bold">{errors.remuneracion_basica}</span>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-green-600 uppercase tracking-wider block ml-1">Combustible</label>
                      <input type="number" name="combustible" value={formData.combustible} onChange={handleInputChange} className="w-full border-2 border-green-50 bg-white rounded-2xl px-5 py-4 text-lg font-black text-green-900 focus:border-green-500 outline-none shadow-sm transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-green-600 uppercase tracking-wider block ml-1">Bono por Ingreso</label>
                      <input type="number" name="bono_ingreso" value={formData.bono_ingreso} onChange={handleInputChange} className="w-full border-2 border-green-50 bg-white rounded-2xl px-5 py-4 text-lg font-black text-green-900 focus:border-green-500 outline-none shadow-sm transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-green-600 uppercase tracking-wider block ml-1">Otros Ingresos</label>
                      <input type="number" name="otros_ingresos" value={formData.otros_ingresos} onChange={handleInputChange} className="w-full border-2 border-green-50 bg-white rounded-2xl px-5 py-4 text-lg font-black text-green-900 focus:border-green-500 outline-none shadow-sm transition-all" />
                    </div>
                 </div>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-red-100 shadow-xl shadow-red-50 overflow-hidden relative">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-red-500 opacity-[0.03] rounded-full -mr-10 -mt-10"></div>
                 <div className="flex items-center space-x-3 mb-8">
                    <div className="p-2 bg-red-100 rounded-xl text-red-600 shadow-sm border border-red-200">
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <h3 className="text-xl font-bold text-red-900 tracking-tight">DESCUENTOS AL TRABAJADOR</h3>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-red-600 uppercase tracking-wider block ml-1">Desc. Tardanza</label>
                      <input type="number" name="desc_tardanza" value={formData.desc_tardanza} onChange={handleInputChange} className="w-full border-2 border-red-50 bg-white rounded-2xl px-4 py-3 text-base font-black text-red-900 focus:border-red-500 outline-none shadow-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-red-600 uppercase tracking-wider block ml-1">Desc. Permisos</label>
                      <input type="number" name="desc_permisos" value={formData.desc_permisos} onChange={handleInputChange} className="w-full border-2 border-red-50 bg-white rounded-2xl px-4 py-3 text-base font-black text-red-900 focus:border-red-500 outline-none shadow-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-red-600 uppercase tracking-wider block ml-1">Desc. Faltas</label>
                      <input type="number" name="desc_faltas" value={formData.desc_faltas} onChange={handleInputChange} className="w-full border-2 border-red-50 bg-white rounded-2xl px-4 py-3 text-base font-black text-red-900 focus:border-red-500 outline-none shadow-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-red-600 uppercase tracking-wider block ml-1">Bono Desc.</label>
                      <input type="number" name="desc_bono" value={formData.desc_bono} onChange={handleInputChange} className="w-full border-2 border-red-50 bg-white rounded-2xl px-4 py-3 text-base font-black text-red-900 focus:border-red-500 outline-none shadow-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-red-600 uppercase tracking-wider block ml-1">Otros Desc.</label>
                      <input type="number" name="desc_otros" value={formData.desc_otros} onChange={handleInputChange} className="w-full border-2 border-red-50 bg-white rounded-2xl px-4 py-3 text-base font-black text-red-900 focus:border-red-500 outline-none shadow-sm" />
                    </div>
                 </div>
              </div>
            </div>

            <div className="space-y-8">
               <div className="bg-white p-8 rounded-3xl border border-blue-100 shadow-xl shadow-blue-50 relative overflow-hidden">
                  <div className="flex items-center space-x-3 mb-8">
                     <div className="p-2 bg-blue-100 rounded-xl text-blue-600 shadow-sm border border-blue-200">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                     </div>
                     <h3 className="text-xl font-bold text-blue-900 tracking-tight uppercase">Aportes del Empleador (Empresa)</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-blue-500 uppercase tracking-wider block ml-1">ESSALUD</label>
                        <input type="number" name="essalud" value={formData.essalud} onChange={handleInputChange} className="w-full border-2 border-blue-50 bg-blue-50/20 rounded-2xl px-5 py-3 text-base font-black text-blue-900 focus:border-blue-500 outline-none" />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-blue-500 uppercase tracking-wider block ml-1">Póliza Seguros 688</label>
                        <input type="number" name="poliza_seguros_688" value={formData.poliza_seguros_688} onChange={handleInputChange} className="w-full border-2 border-blue-50 bg-blue-50/20 rounded-2xl px-5 py-3 text-base font-black text-blue-900 focus:border-blue-500 outline-none" />
                     </div>
                     <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[10px] font-bold text-blue-500 uppercase tracking-wider block ml-1">Seguro de Vida Ley</label>
                        <input type="number" name="seguro_vida_ley" value={formData.seguro_vida_ley} onChange={handleInputChange} className="w-full border-2 border-blue-50 bg-blue-50/20 rounded-2xl px-5 py-3 text-base font-black text-blue-900 focus:border-blue-500 outline-none" />
                     </div>
                  </div>
               </div>

               <div className="bg-gradient-to-br from-indigo-50 to-white p-8 rounded-3xl border border-indigo-100 shadow-xl shadow-indigo-50 relative overflow-hidden">
                  <div className="flex items-center space-x-3 mb-8">
                     <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600 shadow-sm border border-indigo-200">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                     </div>
                     <h3 className="text-xl font-bold text-indigo-900 tracking-tight uppercase">Retenciones del Trabajador (AFP/ONP)</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block ml-1">Comisión AFP %</label>
                        <input type="number" name="comision_afp_pct" value={formData.comision_afp_pct} onChange={handleInputChange} className="w-full border-2 border-indigo-50 bg-white rounded-2xl px-5 py-3 text-base font-black text-indigo-900 focus:border-indigo-500 outline-none" />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block ml-1">Renta 5ta Categoría</label>
                        <input type="number" name="renta_quinta_ret" value={formData.renta_quinta_ret} onChange={handleInputChange} className="w-full border-2 border-indigo-50 bg-white rounded-2xl px-5 py-3 text-base font-black text-indigo-900 focus:border-indigo-500 outline-none" />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block ml-1">Prima Seguro AFP</label>
                        <input type="number" name="prima_seguros_afp" value={formData.prima_seguros_afp} onChange={handleInputChange} className="w-full border-2 border-indigo-50 bg-white rounded-2xl px-5 py-3 text-base font-black text-indigo-900 focus:border-indigo-500 outline-none" />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block ml-1">Aportación Oblig. SPP</label>
                        <input type="number" name="spp_aportacion_obl" value={formData.spp_aportacion_obl} onChange={handleInputChange} className="w-full border-2 border-indigo-50 bg-white rounded-2xl px-5 py-3 text-base font-black text-indigo-900 focus:border-indigo-500 outline-none" />
                     </div>
                  </div>
               </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-xl font-poppins">
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                     <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Detalle de Asistencia Diaria</h3>
               </div>
               <button onClick={addAsistenciaDetalle} className="px-6 py-2.5 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-xl font-bold text-sm shadow-lg hover:scale-105 transition-all">
                 + Registrar Nuevo Día
               </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest rounded-tl-2xl">Fecha</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipo de Incidencia</th>
                    <th className="px-4 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Tiempo (H:M)</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Comentario / Justificación</th>
                    <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest rounded-tr-2xl">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(formData.asistencia_detalle || []).map((det, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/10 transition-colors">
                      <td className="px-4 py-4 w-48">
                        <input type="date" value={det.fecha || ''} onChange={(e) => handleAsistenciaDetalleChange(idx, 'fecha', e.target.value)} className="w-full bg-white border-2 border-gray-100 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-blue-500" />
                      </td>
                      <td className="px-4 py-4 w-56">
                        <select value={det.tipo || 'TARDANZA'} onChange={(e) => handleAsistenciaDetalleChange(idx, 'tipo', e.target.value)} className="w-full bg-white border-2 border-gray-100 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-blue-500 cursor-pointer">
                          <option value="TARDANZA">TARDANZA</option>
                          <option value="FALTA">FALTA</option>
                          <option value="PERMISO">PERMISO</option>
                        </select>
                      </td>
                      <td className="px-4 py-4 w-48">
                        <div className="flex items-center space-x-2">
                           <input type="number" value={det.horas || 0} onChange={(e) => handleAsistenciaDetalleChange(idx, 'horas', e.target.value)} placeholder="H" className="w-1/2 text-center bg-white border-2 border-gray-100 rounded-xl px-2 py-2 text-sm font-bold outline-none focus:border-blue-500" />
                           <span className="font-bold text-gray-300">:</span>
                           <input type="number" value={det.minutos || 0} onChange={(e) => handleAsistenciaDetalleChange(idx, 'minutos', e.target.value)} placeholder="M" className="w-1/2 text-center bg-white border-2 border-gray-100 rounded-xl px-2 py-2 text-sm font-bold outline-none focus:border-blue-500" />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <input value={det.descripcion || ''} onChange={(e) => handleAsistenciaDetalleChange(idx, 'descripcion', e.target.value)} placeholder="Breve descripción..." className="w-full bg-white border-2 border-gray-100 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-blue-500" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => removeAsistenciaDetalle(idx)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!formData.asistencia_detalle || formData.asistencia_detalle.length === 0) && (
                    <tr>
                       <td colSpan="5" className="px-6 py-12 text-center text-sm text-gray-400 font-bold italic bg-gray-50/50 rounded-b-2xl uppercase tracking-widest opacity-50">No hay detalles de asistencia</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="bg-white rounded-3xl border border-gray-100 p-10 shadow-xl font-poppins">
             <div className="flex items-center space-x-3 mb-8">
               <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
               </div>
               <h3 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Observaciones Finales</h3>
             </div>
             <textarea 
               name="observaciones" value={formData.observaciones || ''} onChange={handleInputChange} 
               rows="8" placeholder="Escriba aquí algún comentario relevante, advertencia o aclaración sobre esta boleta de pago..."
               className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl px-8 py-6 text-base font-bold text-gray-700 focus:bg-white focus:border-blue-500 focus:ring-8 focus:ring-blue-50 outline-none transition-all shadow-inner"
             ></textarea>
             <div className="mt-6 flex items-start space-x-4 p-6 bg-amber-50 rounded-2xl border border-amber-100">
                <div className="w-6 h-6 text-amber-500 mt-0.5">
                   <svg fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
                </div>
                <p className="text-xs text-amber-700 font-bold uppercase tracking-tight leading-relaxed">
                   Estas observaciones se imprimirán al pie de la boleta de pago del trabajador. Sea claro y conciso en la información que desee comunicar.
                </p>
             </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-full mx-auto pb-10 mt-4 relative items-start" style={{ fontFamily: 'var(--font-poppins)' }}>
      <div className="flex-1 w-full lg:w-2/3">
        {/* Tab Header */}
        <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-3xl border border-gray-200/60 shadow-lg flex flex-wrap gap-1 mb-8 sticky top-4 z-40">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-br from-blue-700 to-blue-800 text-white shadow-xl shadow-blue-200 scale-105'
                  : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div>
           {renderTabContent()}
        </div>

        {/* Action Buttons */}
        <div className="mt-12 flex flex-wrap gap-4 items-center p-8 bg-white/70 backdrop-blur-lg rounded-3xl border-2 border-white shadow-2xl relative overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-r from-blue-50/20 to-transparent pointer-events-none"></div>
           <div className="flex-1 min-w-[200px]">
              <h4 className="text-sm font-black text-blue-900 uppercase tracking-widest leading-none mb-1">Confirmar Acciones</h4>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Guardar los cambios realizados en este período</p>
           </div>
           
           <div className="flex gap-4">
              <button 
                onClick={() => handleSubmit('BORRADOR')}
                className="px-8 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-sm active:scale-95"
              >
                Guardar Borrador
              </button>
              <button 
                onClick={() => handleSubmit('REVISADO')}
                className="px-8 py-3.5 bg-gradient-to-br from-orange-500 to-orange-600 hover:scale-105 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-orange-200 active:scale-95"
              >
                Marcar Revisado
              </button>
              <button 
                onClick={() => {
                   handleSubmit('REVISADO');
                   if (formData.id_boleta) onEmit(formData.id_boleta);
                }}
                className="px-8 py-3.5 bg-gradient-to-br from-green-600 to-green-700 hover:scale-110 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-green-200 active:scale-95 border-b-4 border-green-800"
              >
                Generar PDF Final
              </button>
           </div>
        </div>
      </div>

      <div className="w-full lg:w-1/3 lg:sticky lg:top-4">
         <div className="relative mb-6">
            <select
              name="id_periodo"
              value={formData.id_periodo}
              onChange={handleInputChange}
              className="w-full bg-white border-b-4 border-blue-700 shadow-2xl rounded-3xl px-8 py-6 text-xl font-black text-blue-900 focus:ring-0 outline-none appearance-none cursor-pointer"
            >
              <option value="">Seleccionar Período</option>
              {periodos.map(p => (
                <option key={p.ID_PERIODO} value={p.ID_PERIODO}>{p.DESCRIPCION}</option>
              ))}
            </select>
            <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-blue-900">
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
            </div>
         </div>

         <div className="mb-6">
            <CalculadoraNeto 
              ingresos={{ 
                remuneracion_basica: formData.remuneracion_basica, 
                combustible: formData.combustible, 
                bono_ingreso: formData.bono_ingreso, 
                otros_ingresos: formData.otros_ingresos 
              }} 
              descuentos={{ 
                desc_tardanza: formData.desc_tardanza, 
                desc_permisos: formData.desc_permisos, 
                desc_faltas: formData.desc_faltas, 
                desc_bono: formData.desc_bono, 
                desc_otros: formData.desc_otros 
              }} 
              aportesTrabajador={{ 
                comision_afp_pct: formData.comision_afp_pct, 
                renta_quinta_ret: formData.renta_quinta_ret, 
                prima_seguros_afp: formData.prima_seguros_afp, 
                spp_aportacion_obl: formData.spp_aportacion_obl 
              }} 
            />
         </div>

         {initialData?.errores_extraccion && initialData.errores_extraccion.length > 0 && (
           <div className="bg-red-50 rounded-3xl border-4 border-red-100 p-8 shadow-2xl shadow-red-100">
              <div className="flex items-center space-x-3 mb-4">
                 <div className="w-10 h-10 bg-red-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                 </div>
                 <h4 className="text-lg font-black text-red-900 uppercase tracking-tighter">Errores de Extracción</h4>
              </div>
              <p className="text-[11px] text-red-700 font-bold uppercase mb-4 leading-relaxed">Los siguientes campos no pudieron ser detectados en el PDF y requieren llenado manual:</p>
              <ul className="space-y-2 max-h-60 overflow-y-auto">
                {initialData.errores_extraccion.map((err, i) => {
                  // Formatear el mensaje de error si viene como "No se encontró: campo"
                  const errorMsg = typeof err === 'string' ? err.replace('No se encontró: ', '') : err;
                  return (
                    <li key={i} className="flex items-center space-x-2 text-[10px] font-black text-red-500 uppercase tracking-widest bg-white/50 px-3 py-2 rounded-xl border border-red-100">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0"></div>
                      <span>{errorMsg}</span>
                    </li>
                  );
                })}
              </ul>
           </div>
         )}
      </div>
    </div>
  );
};

export default BoletaFormCompleto;
