"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/context/AuthContext";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";

// Componente de Select personalizado
const CustomSelect = ({ name, value, onChange, options, placeholder, required, label, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const selectRef = useRef(null);
  const buttonRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value);

  const handleSelect = (optionValue) => {
    if (disabled) return;
    onChange({ target: { name, value: optionValue } });
    setIsOpen(false);
  };

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = 240;
      setOpenUpward(spaceAbove > spaceBelow && spaceBelow < dropdownHeight);
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={selectRef}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`w-full px-4 py-2.5 border-2 rounded-lg transition-all duration-200 text-sm flex items-center justify-between ${
          disabled 
            ? 'border-gray-300 bg-gray-100 text-gray-600 cursor-not-allowed' 
            : `border-gray-300 bg-white text-gray-900 hover:border-gray-400 focus:ring-2 focus:ring-[#1E63F7] focus:border-[#1E63F7] ${
              isOpen ? 'ring-2 ring-[#1E63F7] border-[#1E63F7]' : ''
            }`
        }`}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`w-5 h-5 transition-transform duration-200 ${
            disabled 
              ? 'text-gray-400' 
              : `text-gray-400 ${isOpen ? (openUpward ? '' : 'transform rotate-180') : ''}`
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && !disabled && (
        <div 
          className={`absolute z-50 w-full bg-white shadow-xl overflow-hidden ${
            openUpward ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
          style={{ 
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div className="max-h-60 overflow-y-auto custom-scrollbar p-1.5">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full text-left px-4 py-3 transition-all duration-150 ${
                  value === option.value
                    ? 'bg-[#1E63F7]/10 text-[#1E63F7] font-semibold'
                    : 'text-gray-900 hover:bg-gray-50'
                }`}
                style={{ borderRadius: '0.375rem' }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <input type="hidden" name={name} value={value || ''} required={required} />
    </div>
  );
};

export default function CrearRegularizacionPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Estado del formulario - Datos Principales
  const [formData, setFormData] = useState({
    nombreRegularizacion: "",
    fecha: new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    efectivo: "",
    confirmado: "SI",
    regularizado: "",
    observaciones: "",
  });

  // Estado para comprobantes
  const [comprobantes, setComprobantes] = useState([]);
  const [nuevoComprobante, setNuevoComprobante] = useState({
    comprobante: "",
    monto: "",
    medioPago: "",
    asesor: "",
    fechaRegularizacion: "",
    observacion: "",
    estado: "VALIDO",
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleComprobanteChange = (e) => {
    const { name, value } = e.target;
    setNuevoComprobante((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const calcularTotalEfectivo = () => {
    return comprobantes.reduce((total, comp) => {
      return total + (parseFloat(comp.monto) || 0);
    }, 0).toFixed(2);
  };

  const agregarComprobante = () => {
    if (!nuevoComprobante.comprobante || !nuevoComprobante.monto) {
      return;
    }

    const comprobante = {
      id: Date.now(),
      ...nuevoComprobante,
      monto: parseFloat(nuevoComprobante.monto),
    };

    setComprobantes([...comprobantes, comprobante]);
    setNuevoComprobante({
      comprobante: "",
      monto: "",
      medioPago: "",
      asesor: "",
      fechaRegularizacion: "",
      observacion: "",
      estado: "VALIDO",
    });
  };

  const eliminarComprobante = (id) => {
    setComprobantes(comprobantes.filter((c) => c.id !== id));
  };

  const limpiarFormulario = () => {
    setFormData({
      nombreRegularizacion: "",
      fecha: new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      efectivo: "",
      confirmado: "SI",
      regularizado: "",
      observaciones: "",
    });
    setComprobantes([]);
    setNuevoComprobante({
      comprobante: "",
      monto: "",
      medioPago: "",
      asesor: "",
      fechaRegularizacion: "",
      observacion: "",
      estado: "VALIDO",
    });
  };

  const guardarRegularizacion = () => {
    // Aquí iría la lógica para guardar la regularización
    console.log("Guardar regularización:", { formData, comprobantes });
    // TODO: Implementar llamada a API
  };

  const recargarConfiguracion = () => {
    // Lógica para recargar configuración
    console.log("Recargar configuración");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Opciones para los selects
  const opcionesConfirmado = [
    { value: "SI", label: "SI" },
    { value: "NO", label: "NO" },
  ];

  const opcionesMedioPago = [
    { value: "1", label: "Efectivo" },
    { value: "2", label: "Tarjeta" },
    { value: "3", label: "Transferencia" },
  ];

  const opcionesAsesor = [
    { value: "1", label: "Asesor 1" },
    { value: "2", label: "Asesor 2" },
  ];

  const opcionesEstado = [
    { value: "VALIDO", label: "VALIDO" },
    { value: "INVALIDO", label: "INVALIDO" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${
          sidebarOpen ? "lg:ml-60 ml-0" : "ml-0"
        }`}
      >
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto custom-scrollbar" style={{ background: '#F7FAFF' }}>
          <div className="max-w-[95%] mx-auto px-4 py-4">
            {/* Botón Volver */}
            <button
              onClick={() => router.push("/facturacion")}
              className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] text-white rounded-lg font-semibold hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm ripple-effect relative overflow-hidden text-sm group"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver</span>
            </button>

            {/* Card contenedor principal */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">
              {/* Header */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] rounded-xl flex items-center justify-center text-white shadow-sm">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Nueva Regularización</h1>
                  </div>
                </div>
                <button
                  onClick={recargarConfiguracion}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-200 flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Recargar Configuración</span>
                </button>
              </div>

              {/* Card 1: Datos Principales */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200/60 p-6 mb-6">
                <div className="p-3 bg-gradient-to-r from-[#1E63F7] to-[#1E63F7] text-white rounded-lg mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-bold">Datos Principales</h2>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Nombre Regularización */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nombre Regularización
                    </label>
                    <input
                      type="text"
                      name="nombreRegularizacion"
                      value={formData.nombreRegularizacion}
                      onChange={handleInputChange}
                      placeholder="Ingrese nombre"
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E63F7] focus:border-[#1E63F7] transition-all text-sm"
                    />
                  </div>

                  {/* Fecha */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Fecha
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="fecha"
                        value={formData.fecha}
                        onChange={handleInputChange}
                        placeholder="dd/mm/aaaa"
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E63F7] focus:border-[#1E63F7] transition-all text-sm"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Efectivo */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Efectivo
                    </label>
                    <input
                      type="number"
                      name="efectivo"
                      value={formData.efectivo}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E63F7] focus:border-[#1E63F7] transition-all text-sm"
                    />
                  </div>

                  {/* Confirmado */}
                  <div>
                    <CustomSelect
                      name="confirmado"
                      value={formData.confirmado}
                      onChange={handleInputChange}
                      options={opcionesConfirmado}
                      placeholder="Seleccione"
                      label="Confirmado"
                    />
                  </div>

                  {/* Regularizado (%) */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Regularizado (%)
                    </label>
                    <input
                      type="number"
                      name="regularizado"
                      value={formData.regularizado}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      max="100"
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E63F7] focus:border-[#1E63F7] transition-all text-sm"
                    />
                  </div>

                  {/* Observaciones */}
                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Observaciones
                    </label>
                    <textarea
                      name="observaciones"
                      value={formData.observaciones}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E63F7] focus:border-[#1E63F7] transition-all text-sm resize-none"
                      placeholder="Ingrese observaciones..."
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Detalle de Comprobantes */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200/60 p-6 mb-6">
                <div className="p-3 bg-gradient-to-r from-[#1E63F7] to-[#1E63F7] text-white rounded-lg mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-bold">Detalle de Comprobantes</h2>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Comprobante */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Comprobante
                    </label>
                    <input
                      type="text"
                      name="comprobante"
                      value={nuevoComprobante.comprobante}
                      onChange={handleComprobanteChange}
                      placeholder="Ingrese comprobante"
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E63F7] focus:border-[#1E63F7] transition-all text-sm"
                    />
                  </div>

                  {/* Monto */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Monto
                    </label>
                    <input
                      type="number"
                      name="monto"
                      value={nuevoComprobante.monto}
                      onChange={handleComprobanteChange}
                      step="0.01"
                      min="0"
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E63F7] focus:border-[#1E63F7] transition-all text-sm"
                    />
                  </div>

                  {/* Medio de Pago */}
                  <div>
                    <CustomSelect
                      name="medioPago"
                      value={nuevoComprobante.medioPago}
                      onChange={handleComprobanteChange}
                      options={opcionesMedioPago}
                      placeholder="Seleccione un medio de pago"
                      label="Medio de Pago"
                    />
                  </div>

                  {/* Asesor */}
                  <div>
                    <CustomSelect
                      name="asesor"
                      value={nuevoComprobante.asesor}
                      onChange={handleComprobanteChange}
                      options={opcionesAsesor}
                      placeholder="Seleccione un asesor"
                      label="Asesor"
                    />
                  </div>

                  {/* Fecha de Regularización */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Fecha de Regularización
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="fechaRegularizacion"
                        value={nuevoComprobante.fechaRegularizacion}
                        onChange={handleComprobanteChange}
                        placeholder="dd/mm/aaaa"
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E63F7] focus:border-[#1E63F7] transition-all text-sm"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Observación */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Observación
                    </label>
                    <input
                      type="text"
                      name="observacion"
                      value={nuevoComprobante.observacion}
                      onChange={handleComprobanteChange}
                      placeholder="Ingrese observación"
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E63F7] focus:border-[#1E63F7] transition-all text-sm"
                    />
                  </div>

                  {/* Estado */}
                  <div>
                    <CustomSelect
                      name="estado"
                      value={nuevoComprobante.estado}
                      onChange={handleComprobanteChange}
                      options={opcionesEstado}
                      placeholder="Seleccione"
                      label="Estado"
                    />
                  </div>

                  {/* Botón Añadir Comprobante */}
                  <div className="md:col-span-2 lg:col-span-3 flex justify-end">
                    <button
                      type="button"
                      onClick={agregarComprobante}
                      className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Añadir Comprobante</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Total Efectivo */}
              <div className="mb-6 flex items-center justify-between p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                <span className="text-lg font-bold text-gray-900">Total Efectivo:</span>
                <span className="text-lg font-bold text-[#1E63F7]">${calcularTotalEfectivo()}</span>
              </div>

              {/* Botones de Acción */}
              <div className="mb-6 flex justify-center space-x-4">
                <button
                  type="button"
                  onClick={limpiarFormulario}
                  className="px-6 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-all duration-200 shadow-sm hover:shadow-md flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Limpiar Formulario</span>
                </button>
                <button
                  type="button"
                  onClick={guardarRegularizacion}
                  className="px-6 py-3 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] text-white rounded-lg font-semibold hover:shadow-md transition-all duration-200 shadow-sm flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  <span>Guardar Regularización</span>
                </button>
              </div>

              {/* Card 3: Comprobantes Agregados */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200/60 p-6">
                <div className="p-3 bg-gradient-to-r from-[#1E63F7] to-[#1E63F7] text-white rounded-lg mb-4">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    <h2 className="text-lg font-bold">Comprobantes Agregados</h2>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-blue-700 border-b-2 border-blue-800">
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">COMPROBANTE</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">MONTO</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">MEDIO DE PAGO</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ASESOR</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">FECHA REGULARIZACIÓN</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">OBSERVACIÓN</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ESTADO</th>
                          <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ACCIONES</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {comprobantes.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="px-4 py-12 text-center">
                              <div className="flex flex-col items-center justify-center">
                                <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <p className="text-gray-500 font-medium text-[10px]">No hay comprobantes agregados</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          comprobantes.map((comprobante) => (
                            <tr key={comprobante.id} className="hover:bg-slate-200 transition-colors">
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{comprobante.comprobante}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">${comprobante.monto.toFixed(2)}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                                {opcionesMedioPago.find(op => op.value === comprobante.medioPago)?.label || comprobante.medioPago}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                                {opcionesAsesor.find(op => op.value === comprobante.asesor)?.label || comprobante.asesor}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{comprobante.fechaRegularizacion}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{comprobante.observacion}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px]">
                                <span className={`px-2 py-1 rounded text-[10px] font-semibold ${
                                  comprobante.estado === "VALIDO" 
                                    ? "bg-green-100 text-green-800" 
                                    : "bg-red-100 text-red-800"
                                }`}>
                                  {comprobante.estado}
                                </span>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-center">
                                <button
                                  onClick={() => eliminarComprobante(comprobante.id)}
                                  className="flex items-center space-x-1 px-2.5 py-1 bg-red-600 border-2 border-red-700 hover:bg-red-700 hover:border-red-800 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  <span>Eliminar</span>
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

