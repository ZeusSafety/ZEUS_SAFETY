'use client';

import React, { useState, useEffect, useRef } from 'react';
import CalculadoraNeto from './CalculadoraNeto';
import boletasService from '../services/boletasService';

const BoletaFormCompleto = ({ initialData, onSave, onEmit, onBack, colaboradoresService, isEditing = false, periodos = [] }) => {
  const [activeTab, setActiveTab] = useState(1);
  const [searchColaborador, setSearchColaborador] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
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
    otros_empleadores: '',
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
        otros_empleadores: initialData.otros_empleadores ?? ''
      };
      
      setFormData(prev => ({ ...prev, ...dataToSet }));
      
      if (initialData.colaborador) {
         setColaborador(initialData.colaborador);
         setFormData(prev => ({ ...prev, id_persona: initialData.colaborador.ID_PERSONA || initialData.colaborador.id_persona }));
      }
      
      // Si hay datos_pdf, procesarlos y sobrescribir con los valores del PDF
      // Los datos del PDF tienen PRIORIDAD ABSOLUTA, incluso si son 0 o string vacío
      if (initialData.datos_pdf) {
        const datosPDF = initialData.datos_pdf;
        
        // Para jornada_minutos, usar el valor del PDF si existe, sino dejar 0
        // NO convertir horas a minutos automáticamente
        let jornadaMinutos = datosPDF.jornada_minutos !== undefined ? datosPDF.jornada_minutos : undefined;
        
        // Procesar otros_empleadores: puede venir como texto "No tiene", "Tiene", o como número 0/1
        let otrosEmpleadoresValue = '';
        if (datosPDF.otros_empleadores !== undefined && datosPDF.otros_empleadores !== null) {
          if (typeof datosPDF.otros_empleadores === 'string') {
            otrosEmpleadoresValue = datosPDF.otros_empleadores;
          } else if (datosPDF.otros_empleadores === 1 || datosPDF.otros_empleadores === '1' || datosPDF.otros_empleadores === true) {
            otrosEmpleadoresValue = 'Sí';
          } else {
            otrosEmpleadoresValue = 'No';
          }
        }
        
        setFormData(prev => ({
          ...prev,
          // Campos de texto - usar valor del PDF si existe (incluso si es string vacío)
          tipo_documento: datosPDF.tipo_documento !== undefined ? (datosPDF.tipo_documento || '') : prev.tipo_documento,
          situacion: datosPDF.situacion !== undefined ? (datosPDF.situacion || '') : prev.situacion,
          regimen_pensionario: datosPDF.regimen_pensionario !== undefined ? (datosPDF.regimen_pensionario || '') : prev.regimen_pensionario,
          cuspp: datosPDF.cuspp !== undefined ? (datosPDF.cuspp || '') : prev.cuspp,
          condicion: datosPDF.condicion !== undefined ? (datosPDF.condicion || '') : prev.condicion,
          fecha_ingreso: datosPDF.fecha_ingreso !== undefined ? (datosPDF.fecha_ingreso || '') : prev.fecha_ingreso,
          otros_empleadores: otrosEmpleadoresValue,
          // Campos numéricos - usar valor del PDF si existe (incluso si es 0)
          dias_laborados: datosPDF.dias_laborados !== undefined ? parseInt(datosPDF.dias_laborados) || 0 : prev.dias_laborados,
          dias_no_laborados: datosPDF.dias_no_laborados !== undefined ? parseInt(datosPDF.dias_no_laborados) || 0 : prev.dias_no_laborados,
          dias_subsidiados: datosPDF.dias_subsidiados !== undefined ? parseInt(datosPDF.dias_subsidiados) || 0 : prev.dias_subsidiados,
          jornada_horas: datosPDF.jornada_horas !== undefined ? parseInt(datosPDF.jornada_horas) || 0 : prev.jornada_horas,
          jornada_minutos: jornadaMinutos !== undefined ? parseInt(jornadaMinutos) || 0 : prev.jornada_minutos,
          sobretiempo_horas: datosPDF.sobretiempo_horas !== undefined ? parseInt(datosPDF.sobretiempo_horas) || 0 : prev.sobretiempo_horas,
          sobretiempo_minutos: datosPDF.sobretiempo_minutos !== undefined ? parseInt(datosPDF.sobretiempo_minutos) || 0 : prev.sobretiempo_minutos,
          tardanza_horas: datosPDF.tardanza_horas !== undefined ? parseInt(datosPDF.tardanza_horas) || 0 : prev.tardanza_horas,
          tardanza_minutos: datosPDF.tardanza_minutos !== undefined ? parseInt(datosPDF.tardanza_minutos) || 0 : prev.tardanza_minutos,
          remuneracion_basica: datosPDF.remuneracion_basica !== undefined ? parseFloat(datosPDF.remuneracion_basica) || 0 : prev.remuneracion_basica,
          combustible: datosPDF.combustible !== undefined ? parseFloat(datosPDF.combustible) || 0 : prev.combustible,
          bono_ingreso: datosPDF.bono !== undefined ? parseFloat(datosPDF.bono) || 0 : prev.bono_ingreso,
          otros_ingresos: datosPDF.otros !== undefined ? parseFloat(datosPDF.otros) || 0 : prev.otros_ingresos,
          comision_afp_pct: datosPDF.comision_afp_pct !== undefined ? parseFloat(datosPDF.comision_afp_pct) || 0 : prev.comision_afp_pct,
          renta_quinta_ret: datosPDF.renta_quinta_ret !== undefined ? parseFloat(datosPDF.renta_quinta_ret) || 0 : prev.renta_quinta_ret,
          prima_seguros_afp: datosPDF.prima_seguros_afp !== undefined ? parseFloat(datosPDF.prima_seguros_afp) || 0 : prev.prima_seguros_afp,
          spp_aportacion_obl: datosPDF.spp_aportacion_obl !== undefined ? parseFloat(datosPDF.spp_aportacion_obl) || 0 : prev.spp_aportacion_obl,
          essalud: datosPDF.essalud !== undefined ? parseFloat(datosPDF.essalud) || 0 : prev.essalud,
          poliza_seguros_688: datosPDF.poliza_seguros_688 !== undefined ? parseFloat(datosPDF.poliza_seguros_688) || 0 : prev.poliza_seguros_688,
          seguro_vida_ley: datosPDF.seguro_vida_ley !== undefined ? parseFloat(datosPDF.seguro_vida_ley) || 0 : prev.seguro_vida_ley,
          // Procesar suspensiones si existen
          suspensiones: datosPDF.tipo_suspension && datosPDF.motivo_suspension ? 
            [{ tipo: datosPDF.tipo_suspension, motivo: datosPDF.motivo_suspension, numero_dias: datosPDF.dias_suspension || 0 }] : 
            (Array.isArray(prev.suspensiones) ? prev.suspensiones : [])
        }));
        
        // Si el PDF tiene número de documento, intentar buscar el colaborador automáticamente
        if (datosPDF.numero_documento && !colaborador) {
          boletasService.buscarColaboradorPorDocumento(datosPDF.numero_documento)
            .then(colab => {
              if (colab) {
                setColaborador(colab);
                setFormData(prev => ({ ...prev, id_persona: colab.ID_PERSONA || colab.id_persona }));
              }
            })
            .catch(err => {
              console.log('No se encontró colaborador con ese documento:', err);
            });
        }
      }
    }
  }, [initialData]);

  const searchTimeoutRef = useRef(null);
  const searchContainerRef = useRef(null);

  // Cleanup del timeout al desmontar
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Cerrar dropdown cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const buscarColaborador = async (query) => {
    try {
      setSearching(true);
      // NO limpiar resultados aquí - mantener los anteriores mientras busca
      
      const trimmedQuery = query ? query.trim() : '';
      
      console.log('🔍 Iniciando búsqueda con query:', trimmedQuery || '(vacío - mostrar todos)');
      
      // Si está vacío o tiene al menos 1 carácter, buscar
      // Si está vacío, la API devuelve los primeros 100 colaboradores
      const results = await boletasService.buscarColaboradores(trimmedQuery);
      
      console.log('✅ Resultados recibidos:', results);
      console.log('✅ Tipo de resultado:', typeof results);
      console.log('✅ Es array?', Array.isArray(results));
      console.log('✅ Cantidad de resultados:', Array.isArray(results) ? results.length : 0);
      
      if (Array.isArray(results) && results.length > 0) {
        console.log('✅ Primer resultado de ejemplo:', results[0]);
        console.log('✅ FECHA_INGRESO en primer resultado:', results[0].FECHA_INGRESO || results[0].fecha_ingreso || results[0].FECHAINGRESO || results[0].fechaIngreso);
        console.log('✅ Todas las claves del primer resultado:', Object.keys(results[0]));
        setSearchResults(results);
      } else if (Array.isArray(results)) {
        console.log('⚠️ Array vacío recibido');
        setSearchResults([]);
      } else if (results && typeof results === 'object') {
        // Si viene envuelto en un objeto
        const data = results.data || results.colaboradores || results.results || [];
        console.log('✅ Datos extraídos del objeto:', data);
        setSearchResults(Array.isArray(data) ? data : []);
      } else {
        console.log('⚠️ No se recibieron resultados válidos');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('❌ Error buscando colaborador:', error);
      console.error('Stack:', error.stack);
      setSearchResults([]);
    } finally {
      setSearching(false);
      console.log('🏁 Búsqueda finalizada. Resultados:', searchResults.length);
    }
  };

  const handleSearchFocus = () => {
    setShowDropdown(true);
    // Cuando el usuario hace focus en el input, cargar la lista inicial si no hay resultados
    if (searchResults.length === 0 && !searching && !searchColaborador) {
      buscarColaborador('');
    }
  };

  const handleSearchChange = (value) => {
    setSearchColaborador(value);
    
    // Limpiar timeout anterior
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Si el valor está vacío, limpiar resultados inmediatamente
    if (!value || value.trim() === '') {
      setSearchResults([]);
      // Cargar todos los colaboradores cuando está vacío
      buscarColaborador('');
      return;
    }
    
    // Debounce: esperar 300ms antes de buscar
    // NO limpiar los resultados aquí, mantener los anteriores mientras busca
    searchTimeoutRef.current = setTimeout(() => {
      buscarColaborador(value);
    }, 300);
  };

  const seleccionarColaborador = (colab) => {
    console.log('Colaborador seleccionado:', colab);
    console.log('FECHA_INGRESO:', colab.FECHA_INGRESO || colab.fecha_ingreso || colab.FECHAINGRESO || colab.fechaIngreso);
    console.log('Todas las claves del colaborador:', Object.keys(colab));
    setColaborador(colab);
    setFormData(prev => ({ 
      ...prev, 
      id_persona: colab.ID_PERSONA || colab.id_persona || colab.ID_PERSONA || colab.id_persona 
    }));
    setSearchColaborador('');
    setSearchResults([]);
    setShowDropdown(false);
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
            {/* Búsqueda de Colaborador - Siempre mostrar si no está en modo edición */}
            {!isEditing && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="bg-gradient-to-r from-blue-50 to-white px-6 py-4 border-b border-gray-200">
                  <label className="text-sm font-bold text-gray-900 uppercase tracking-wide block">
                    Buscar Colaborador
                  </label>
                </div>
                <div className="p-6 relative" ref={searchContainerRef}>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchColaborador}
                      onChange={(e) => {
                        handleSearchChange(e.target.value);
                      }}
                      onFocus={handleSearchFocus}
                      placeholder="Buscar por DNI o nombre..."
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-xs font-medium text-gray-900 bg-white"
                    />
                    {searching && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                      </div>
                    )}
                  </div>
                  {/* Dropdown fuera del contenedor con overflow - solo mostrar cuando showDropdown es true */}
                  {showDropdown && searchResults.length > 0 && (
                    <div className="absolute z-[9999] left-6 right-6 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                      {searchResults.map((colab, idx) => {
                        const nombreCompleto = `${colab.NOMBRE || colab.nombre || ''} ${colab.SEGUNDO_NOMBRE || colab.segundo_nombre || ''} ${colab.APELLIDO || colab.apellido || ''} ${colab.SEGUNDO_APELLIDO || colab.segundo_apellido || ''}`.trim();
                        const documento = colab.NUMERO_DOCUMENTO || colab.numero_documento || '';
                        const area = colab.AREA || colab.area || '';
                        const cargo = colab.CARGO || colab.cargo || '';
                        return (
                          <button
                            key={colab.ID_PERSONA || colab.id_persona || idx}
                            onClick={() => seleccionarColaborador(colab)}
                            className="w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-semibold text-xs text-gray-900">
                              {nombreCompleto || 'Sin nombre'}
                            </div>
                            <div className="text-[10px] text-gray-500">
                              DNI: {documento} {area && cargo ? `| ${area} - ${cargo}` : area || cargo ? `| ${area || cargo}` : ''}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {showDropdown && !searching && searchResults.length === 0 && searchColaborador && (
                    <div className="absolute z-[9999] left-6 right-6 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl p-3">
                      <div className="text-xs text-gray-500 text-center">
                        No se encontraron colaboradores
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Información del Trabajador - Mostrar datos del PDF o del colaborador */}
            {(initialData?.datos_pdf?.nombre || initialData?.datos_pdf?.numero_documento || colaborador) && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-200">
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                    Información del Trabajador
                    {initialData?.datos_pdf?.nombre && <span className="ml-2 px-2 py-0.5 bg-blue-50 text-[9px] text-blue-600 rounded font-medium">Del PDF</span>}
                    {colaborador && !initialData?.datos_pdf?.nombre && <span className="ml-2 px-2 py-0.5 bg-gray-100 text-[9px] text-gray-600 rounded font-medium">Del Sistema</span>}
                  </h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Primera fila */}
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-semibold text-gray-600 uppercase block mb-1.5">
                        Nombre Completo
                        {initialData?.datos_pdf?.nombre && <span className="ml-1 px-1 py-0.5 bg-blue-50 text-[8px] text-blue-600 rounded">PDF</span>}
                      </label>
                      <input 
                        name="nombre_completo"
                        value={
                          (initialData?.datos_pdf?.nombre && 
                           initialData.datos_pdf.nombre.trim() && 
                           !initialData.datos_pdf.nombre.includes('Situación') && 
                           !initialData.datos_pdf.nombre.includes('situacion') &&
                           initialData.datos_pdf.nombre.trim().length > 3) 
                            ? initialData.datos_pdf.nombre.trim()
                            : (colaborador ? `${colaborador.NOMBRE || colaborador.nombre || ''} ${colaborador.SEGUNDO_NOMBRE || colaborador.segundo_nombre || ''} ${colaborador.APELLIDO || colaborador.apellido || ''} ${colaborador.SEGUNDO_APELLIDO || colaborador.segundo_apellido || ''}`.trim() : '')
                        } 
                        onChange={(e) => {
                          // Si viene del PDF, permitir editar
                          if (initialData?.datos_pdf?.nombre) {
                            setFormData(prev => ({ ...prev, nombre_completo: e.target.value }));
                          }
                        }}
                        className={`w-full border rounded-lg px-3 py-2 text-xs font-medium text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all ${
                          (initialData?.datos_pdf?.nombre && initialData.datos_pdf.nombre.trim() && !initialData.datos_pdf.nombre.includes('Situación'))
                            ? 'border-blue-300 bg-white' 
                            : 'bg-gray-50 border-gray-200'
                        }`}
                        readOnly={!(initialData?.datos_pdf?.nombre && initialData.datos_pdf.nombre.trim() && !initialData.datos_pdf.nombre.includes('Situación'))}
                      />
                    </div>
                    <div className="md:col-span-1">
                      <label className="text-[10px] font-semibold text-gray-600 uppercase block mb-1.5">
                        DNI / Documento
                        {initialData?.datos_pdf?.numero_documento && <span className="ml-1 px-1 py-0.5 bg-blue-50 text-[8px] text-blue-600 rounded">PDF</span>}
                      </label>
                      <input 
                        name="numero_documento"
                        value={
                          initialData?.datos_pdf?.numero_documento || 
                          colaborador?.NUMERO_DOCUMENTO || 
                          colaborador?.numero_documento || 
                          ''
                        } 
                        onChange={(e) => {
                          if (initialData?.datos_pdf?.numero_documento) {
                            setFormData(prev => ({ ...prev, numero_documento: e.target.value }));
                          }
                        }}
                        className={`w-full border rounded-lg px-3 py-2 text-xs font-medium text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all ${
                          initialData?.datos_pdf?.numero_documento 
                            ? 'border-blue-300 bg-white' 
                            : 'bg-gray-50 border-gray-200'
                        }`}
                        readOnly={!initialData?.datos_pdf?.numero_documento}
                      />
                    </div>
                    {/* Segunda fila */}
                    <div className="md:col-span-1">
                      <label className="text-[10px] font-semibold text-gray-600 uppercase block mb-1.5">Área / Cargo</label>
                      <input 
                        value={colaborador ? `${colaborador.AREA || colaborador.area || ''}${(colaborador.AREA || colaborador.area) && (colaborador.CARGO || colaborador.cargo) ? ' - ' : ''}${colaborador.CARGO || colaborador.cargo || ''}` : ''} 
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-medium text-gray-700 pointer-events-none" 
                        readOnly
                      />
                    </div>
                    <div className="md:col-span-1">
                      <label className="text-[10px] font-semibold text-gray-600 uppercase block mb-1.5">
                        Fecha Ingreso
                        {initialData?.datos_pdf?.fecha_ingreso && <span className="ml-1 px-1 py-0.5 bg-blue-50 text-[8px] text-blue-600 rounded">PDF</span>}
                      </label>
                      <input 
                        name="fecha_ingreso"
                        value={
                          initialData?.datos_pdf?.fecha_ingreso || 
                          (colaborador ? (
                            colaborador.FECHA_INGRESO || 
                            colaborador.fecha_ingreso || 
                            colaborador.FECHAINGRESO || 
                            colaborador.fechaIngreso ||
                            colaborador['FECHA_INGRESO'] ||
                            colaborador['fecha_ingreso'] ||
                            ''
                          ) : '')
                        } 
                        onChange={(e) => {
                          if (initialData?.datos_pdf?.fecha_ingreso) {
                            setFormData(prev => ({ ...prev, fecha_ingreso: e.target.value }));
                          }
                        }}
                        className={`w-full border rounded-lg px-3 py-2 text-xs font-medium text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all ${
                          initialData?.datos_pdf?.fecha_ingreso 
                            ? 'border-blue-300 bg-white' 
                            : 'bg-gray-50 border-gray-200'
                        }`}
                        readOnly={!initialData?.datos_pdf?.fecha_ingreso}
                      />
                    </div>
                    <div className="md:col-span-1">
                      <label className="text-[10px] font-semibold text-gray-600 uppercase block mb-1.5">N° Hijos</label>
                      <input 
                        value={colaborador?.CANT_HIJOS ?? colaborador?.HIJOS_BOOLEAN ?? colaborador?.cant_hijos ?? colaborador?.hijos_boolean ?? '0'} 
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-medium text-gray-700 pointer-events-none" 
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Información Contractual y PDF */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-white px-6 py-4 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Información Contractual y PDF</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-semibold text-gray-600 uppercase block mb-1.5 flex items-center">
                      Situación
                      {initialData?.datos_pdf?.situacion && <span className="ml-2 px-1.5 py-0.5 bg-blue-50 text-[9px] text-blue-600 rounded font-medium">PDF</span>}
                    </label>
                    <input 
                      name="situacion" value={formData.situacion || ''} onChange={handleInputChange} 
                      className={`w-full border rounded-lg px-3 py-2 text-xs font-medium text-gray-900 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all ${initialData?.datos_pdf?.situacion ? 'border-blue-300' : 'border-gray-300'}`} 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-600 uppercase block mb-1.5 flex items-center">
                      Régimen Pensionario
                      {initialData?.datos_pdf?.regimen_pensionario && <span className="ml-2 px-1.5 py-0.5 bg-blue-50 text-[9px] text-blue-600 rounded font-medium">PDF</span>}
                    </label>
                    <input 
                      name="regimen_pensionario" value={formData.regimen_pensionario || ''} onChange={handleInputChange} 
                      className={`w-full border rounded-lg px-3 py-2 text-xs font-medium text-gray-900 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all ${initialData?.datos_pdf?.regimen_pensionario ? 'border-blue-300' : 'border-gray-300'}`} 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-600 uppercase block mb-1.5 flex items-center">
                      CUSPP
                      {initialData?.datos_pdf?.cuspp && <span className="ml-2 px-1.5 py-0.5 bg-blue-50 text-[9px] text-blue-600 rounded font-medium">PDF</span>}
                    </label>
                    <input 
                      name="cuspp" value={formData.cuspp || ''} onChange={handleInputChange} 
                      className={`w-full border rounded-lg px-3 py-2 text-xs font-medium text-gray-900 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all ${initialData?.datos_pdf?.cuspp ? 'border-blue-300' : 'border-gray-300'}`} 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-600 uppercase block mb-1.5">Condición</label>
                    <input name="condicion" value={formData.condicion || ''} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-medium text-gray-900 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm font-poppins">
            <div className="bg-gradient-to-r from-blue-50 to-white px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-900 uppercase tracking-tight">Asistencia y Control de Tiempo</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Jornada General */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide border-b border-gray-200 pb-2">Jornada General</h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-semibold text-gray-600 uppercase block mb-1.5">Días Laborados</label>
                        <input type="number" name="dias_laborados" value={formData.dias_laborados} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-medium text-gray-900 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
                        {errors.dias_laborados && <span className="text-[9px] text-red-500 font-medium mt-1 block">{errors.dias_laborados}</span>}
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-gray-600 uppercase block mb-1.5">Días No Laborados</label>
                        <input type="number" name="dias_no_laborados" value={formData.dias_no_laborados} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-medium text-gray-900 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-gray-600 uppercase block mb-1.5">Días Subsidiados</label>
                      <input type="number" name="dias_subsidiados" value={formData.dias_subsidiados} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-medium text-gray-900 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
                    </div>
                  </div>
                </div>

                {/* Horas Extras y Tardanzas */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide border-b border-gray-200 pb-2">Horas Extras y Tardanzas</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-semibold text-blue-600 uppercase block mb-1.5">H. Ordinaria</label>
                        <div className="flex items-center space-x-1.5">
                          <input type="number" name="jornada_horas" value={formData.jornada_horas} onChange={handleInputChange} placeholder="H" className="w-1/2 border border-blue-200 rounded-lg px-2 py-2 text-xs font-medium text-gray-900 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
                          <input type="number" name="jornada_minutos" value={formData.jornada_minutos} onChange={handleInputChange} placeholder="M" className="w-1/2 border border-blue-200 rounded-lg px-2 py-2 text-xs font-medium text-gray-900 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-orange-600 uppercase block mb-1.5">Sobretiempo</label>
                        <div className="flex items-center space-x-1.5">
                          <input type="number" name="sobretiempo_horas" value={formData.sobretiempo_horas} onChange={handleInputChange} placeholder="H" className="w-1/2 border border-orange-200 rounded-lg px-2 py-2 text-xs font-medium text-gray-900 bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none" />
                          <input type="number" name="sobretiempo_minutos" value={formData.sobretiempo_minutos} onChange={handleInputChange} placeholder="M" className="w-1/2 border border-orange-200 rounded-lg px-2 py-2 text-xs font-medium text-gray-900 bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-red-600 uppercase block mb-1.5">Tardanzas</label>
                      <div className="flex items-center space-x-1.5">
                        <input type="number" name="tardanza_horas" value={formData.tardanza_horas} onChange={handleInputChange} placeholder="H" className="w-1/2 border border-red-200 rounded-lg px-2 py-2 text-xs font-medium text-gray-900 bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none" />
                        <input type="number" name="tardanza_minutos" value={formData.tardanza_minutos} onChange={handleInputChange} placeholder="M" className="w-1/2 border border-red-200 rounded-lg px-2 py-2 text-xs font-medium text-gray-900 bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Otros Empleadores (5ta) - Fila completa */}
                  <div>
                    <label className="text-[10px] font-semibold text-gray-600 uppercase block mb-1.5">
                      Otros Empleadores (5ta)
                      {initialData?.datos_pdf?.otros_empleadores && <span className="ml-1 px-1 py-0.5 bg-blue-50 text-[8px] text-blue-600 rounded">PDF</span>}
                    </label>
                    <input 
                      type="text" 
                      name="otros_empleadores" 
                      value={formData.otros_empleadores || ''} 
                      onChange={handleInputChange} 
                      placeholder="Ej: No tiene, Sí, Tiene..."
                      className={`w-full border rounded-lg px-3 py-2 text-xs font-medium text-gray-900 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all ${
                        initialData?.datos_pdf?.otros_empleadores 
                          ? 'border-blue-300' 
                          : 'border-gray-300'
                      }`} 
                    />
                  </div>
                </div>

                {/* Control de Vacaciones */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide border-b border-gray-200 pb-2">Control de Vacaciones</h4>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 space-y-3">
                    <div>
                      <label className="text-[10px] font-semibold text-blue-700 uppercase block mb-1.5">Fecha Salida</label>
                      <input type="date" name="vac_fecha_salida" value={formData.vac_fecha_salida || ''} onChange={handleInputChange} className="w-full border border-blue-200 rounded-lg px-3 py-2 text-xs font-medium text-gray-900 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-blue-700 uppercase block mb-1.5">Fecha Retorno</label>
                      <input type="date" name="vac_fecha_retorno" value={formData.vac_fecha_retorno || ''} onChange={handleInputChange} className="w-full border border-blue-200 rounded-lg px-3 py-2 text-xs font-medium text-gray-900 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
                      {errors.vac_fecha_retorno && <span className="text-[9px] text-red-500 font-medium mt-1 block">{errors.vac_fecha_retorno}</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm font-poppins overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-white px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Suspensiones de Labores</h3>
                </div>
                <button onClick={addSuspension} className="px-4 py-2 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold text-[10px] uppercase tracking-wide shadow-sm hover:shadow-md transition-all">
                  + Agregar Suspensión
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-blue-700 border-b-2 border-blue-800">
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Tipo</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Motivo</th>
                        <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">N° Días</th>
                        <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(formData.suspensiones || []).map((sus, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3 py-2">
                            <input value={sus.tipo || ''} onChange={(e) => handleSuspensionChange(idx, 'tipo', e.target.value)} placeholder="Ej: Enfermedad" className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-[10px] font-medium text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                          </td>
                          <td className="px-3 py-2">
                            <input value={sus.motivo || ''} onChange={(e) => handleSuspensionChange(idx, 'motivo', e.target.value)} placeholder="Descripción del motivo" className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-[10px] font-medium text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                          </td>
                          <td className="px-3 py-2 w-32">
                            <input type="number" value={sus.numero_dias || 0} onChange={(e) => handleSuspensionChange(idx, 'numero_dias', e.target.value)} className="w-full text-center bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-[10px] font-medium text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button onClick={() => removeSuspension(idx)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Eliminar">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                      {(!formData.suspensiones || formData.suspensiones.length === 0) && (
                        <tr>
                          <td colSpan="4" className="px-3 py-8 text-center text-[10px] text-gray-400 font-medium">No hay suspensiones registradas</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 font-poppins">
            {/* Columna Izquierda */}
            <div className="space-y-6">
              {/* Ingresos del Trabajador */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 to-white px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-base font-bold text-gray-900 uppercase tracking-tight">Ingresos del Trabajador</h3>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-semibold text-gray-600 uppercase block mb-1.5">Remuneración Básica</label>
                      <input type="number" name="remuneracion_basica" value={formData.remuneracion_basica} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-medium text-gray-900 bg-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none text-right" />
                      {errors.remuneracion_basica && <span className="text-[9px] text-red-500 font-medium mt-1 block">{errors.remuneracion_basica}</span>}
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-gray-600 uppercase block mb-1.5">Combustible</label>
                      <input type="number" name="combustible" value={formData.combustible} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-medium text-gray-900 bg-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none text-right" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-gray-600 uppercase block mb-1.5">Bono por Ingreso</label>
                      <input type="number" name="bono_ingreso" value={formData.bono_ingreso} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-medium text-gray-900 bg-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none text-right" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-gray-600 uppercase block mb-1.5">Otros Ingresos</label>
                      <input type="number" name="otros_ingresos" value={formData.otros_ingresos} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-medium text-gray-900 bg-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none text-right" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Descuentos al Trabajador */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-red-50 to-white px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-base font-bold text-gray-900 uppercase tracking-tight">Descuentos al Trabajador</h3>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-semibold text-gray-600 uppercase block mb-1.5">Desc. Tardanza</label>
                      <input type="number" name="desc_tardanza" value={formData.desc_tardanza} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-medium text-gray-900 bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-right" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-gray-600 uppercase block mb-1.5">Desc. Permisos</label>
                      <input type="number" name="desc_permisos" value={formData.desc_permisos} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-medium text-gray-900 bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-right" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-gray-600 uppercase block mb-1.5">Desc. Faltas</label>
                      <input type="number" name="desc_faltas" value={formData.desc_faltas} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-medium text-gray-900 bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-right" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-gray-600 uppercase block mb-1.5">Bono Desc.</label>
                      <input type="number" name="desc_bono" value={formData.desc_bono} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-medium text-gray-900 bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-right" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-gray-600 uppercase block mb-1.5">Otros Desc.</label>
                      <input type="number" name="desc_otros" value={formData.desc_otros} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-medium text-gray-900 bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-right" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna Derecha */}
            <div className="space-y-6">
              {/* Aportes del Empleador */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-white px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h3 className="text-base font-bold text-gray-900 uppercase tracking-tight">Aportes del Empleador (Empresa)</h3>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-semibold text-gray-600 uppercase block mb-1.5">ESSALUD</label>
                      <input type="number" name="essalud" value={formData.essalud} onChange={handleInputChange} className="w-full border border-blue-200 rounded-lg px-3 py-2 text-xs font-medium text-gray-900 bg-blue-50/30 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-right" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-gray-600 uppercase block mb-1.5">Póliza Seguros 688</label>
                      <input type="number" name="poliza_seguros_688" value={formData.poliza_seguros_688} onChange={handleInputChange} className="w-full border border-blue-200 rounded-lg px-3 py-2 text-xs font-medium text-gray-900 bg-blue-50/30 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-right" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-semibold text-gray-600 uppercase block mb-1.5">Seguro de Vida Ley</label>
                      <input type="number" name="seguro_vida_ley" value={formData.seguro_vida_ley} onChange={handleInputChange} className="w-full border border-blue-200 rounded-lg px-3 py-2 text-xs font-medium text-gray-900 bg-blue-50/30 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-right" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Retenciones del Trabajador */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-50 to-white px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="text-base font-bold text-gray-900 uppercase tracking-tight">Retenciones del Trabajador (AFP/ONP)</h3>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-semibold text-gray-600 uppercase block mb-1.5">Comisión AFP %</label>
                      <input type="number" name="comision_afp_pct" value={formData.comision_afp_pct} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-medium text-gray-900 bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-right" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-gray-600 uppercase block mb-1.5">Renta 5ta Categoría</label>
                      <input type="number" name="renta_quinta_ret" value={formData.renta_quinta_ret} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-medium text-gray-900 bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-right" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-gray-600 uppercase block mb-1.5">Prima Seguro AFP</label>
                      <input type="number" name="prima_seguros_afp" value={formData.prima_seguros_afp} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-medium text-gray-900 bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-right" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-gray-600 uppercase block mb-1.5">Aportación Oblig. SPP</label>
                      <input type="number" name="spp_aportacion_obl" value={formData.spp_aportacion_obl} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-medium text-gray-900 bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-right" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm font-poppins overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-white px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Detalle de Asistencia Diaria</h3>
                </div>
                <button onClick={addAsistenciaDetalle} className="px-4 py-2 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold text-[10px] uppercase tracking-wide shadow-sm hover:shadow-md transition-all">
                  + Registrar Nuevo Día
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-blue-700 border-b-2 border-blue-800">
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Fecha</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Tipo de Incidencia</th>
                        <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Tiempo (H:M)</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Comentario / Justificación</th>
                        <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(formData.asistencia_detalle || []).map((det, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3 py-2 w-48">
                            <input type="date" value={det.fecha || ''} onChange={(e) => handleAsistenciaDetalleChange(idx, 'fecha', e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-[10px] font-medium text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                          </td>
                          <td className="px-3 py-2 w-56">
                            <select value={det.tipo || 'TARDANZA'} onChange={(e) => handleAsistenciaDetalleChange(idx, 'tipo', e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-[10px] font-medium text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer">
                              <option value="TARDANZA">TARDANZA</option>
                              <option value="FALTA">FALTA</option>
                              <option value="PERMISO">PERMISO</option>
                            </select>
                          </td>
                          <td className="px-3 py-2 w-48">
                            <div className="flex items-center space-x-2">
                              <input type="number" value={det.horas || 0} onChange={(e) => handleAsistenciaDetalleChange(idx, 'horas', e.target.value)} placeholder="H" className="w-1/2 text-center bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-[10px] font-medium text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                              <span className="font-medium text-gray-400 text-[10px]">:</span>
                              <input type="number" value={det.minutos || 0} onChange={(e) => handleAsistenciaDetalleChange(idx, 'minutos', e.target.value)} placeholder="M" className="w-1/2 text-center bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-[10px] font-medium text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <input value={det.descripcion || ''} onChange={(e) => handleAsistenciaDetalleChange(idx, 'descripcion', e.target.value)} placeholder="Breve descripción..." className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-[10px] font-medium text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button onClick={() => removeAsistenciaDetalle(idx)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Eliminar">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                      {(!formData.asistencia_detalle || formData.asistencia_detalle.length === 0) && (
                        <tr>
                          <td colSpan="5" className="px-3 py-8 text-center text-[10px] text-gray-400 font-medium">No hay detalles de asistencia</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm font-poppins overflow-hidden">
            <div className="bg-gradient-to-r from-amber-50 to-white px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-900 uppercase tracking-tight">Observaciones Finales</h3>
              </div>
            </div>
            <div className="p-6">
              <textarea 
                name="observaciones" value={formData.observaciones || ''} onChange={handleInputChange} 
                rows="8" placeholder="Escriba aquí algún comentario relevante, advertencia o aclaración sobre esta boleta de pago..."
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-xs font-medium text-gray-900 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-y"
              ></textarea>
              <div className="mt-4 flex items-start space-x-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0">
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-[10px] text-amber-700 font-semibold uppercase tracking-wide leading-relaxed">
                  Estas observaciones se imprimirán al pie de la boleta de pago del trabajador. Sea claro y conciso en la información que desee comunicar.
                </p>
              </div>
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
        {/* Botón Volver - Arriba de los tabs */}
        {onBack && (
          <div className="mb-3">
            <button 
              onClick={onBack}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold text-[10px] uppercase tracking-wide transition-all shadow-sm hover:shadow-md border border-blue-800"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Volver a Lista de Boletas</span>
            </button>
          </div>
        )}

        {/* Tab Header - Estático */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-md p-3 flex flex-wrap gap-2 mb-6 sticky top-4 z-50">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gradient-to-br from-blue-700 to-blue-800 text-white shadow-md scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 bg-white border border-gray-200 hover:border-gray-300'
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
        <div className="mt-8 flex flex-wrap gap-3 items-center p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
           <div className="flex-1 min-w-[200px]">
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide leading-none mb-1">Confirmar Acciones</h4>
              <p className="text-[10px] text-gray-500 font-medium">Guardar los cambios realizados en este período</p>
           </div>
           
           <div className="flex gap-3">
              <button 
                onClick={() => handleSubmit('BORRADOR')}
                className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold text-xs uppercase tracking-wide transition-all shadow-sm active:scale-95"
              >
                Guardar Borrador
              </button>
              <button 
                onClick={() => handleSubmit('REVISADO')}
                className="px-6 py-2.5 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-semibold text-xs uppercase tracking-wide transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Marcar Revisado</span>
              </button>
              <button 
                onClick={() => {
                   handleSubmit('REVISADO');
                   if (formData.id_boleta) onEmit(formData.id_boleta);
                }}
                className="px-6 py-2.5 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-semibold text-xs uppercase tracking-wide transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Generar PDF Final</span>
              </button>
           </div>
        </div>
      </div>

      <div className="w-full lg:w-1/3 lg:sticky lg:top-4">
         <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6 relative">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">Seleccionar Período</label>
            <select
              name="id_periodo"
              value={formData.id_periodo}
              onChange={handleInputChange}
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 pr-10 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none cursor-pointer"
            >
              <option value="">Seleccionar Período</option>
              {periodos.map(p => (
                <option key={p.ID_PERIODO} value={p.ID_PERIODO}>{p.DESCRIPCION}</option>
              ))}
            </select>
            <div className="absolute right-6 top-[42px] pointer-events-none text-gray-400">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
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
