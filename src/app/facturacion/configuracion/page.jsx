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

export default function ConfiguracionPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPageLugares, setCurrentPageLugares] = useState(1);
  const [totalPagesLugares, setTotalPagesLugares] = useState(14);
  const [totalLugares, setTotalLugares] = useState(70);
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: "",
    tipo: "",
  });

  // Datos de prueba - Asesores
  const [asesores, setAsesores] = useState([
    { id: 9, nombre: "HERVIN", estado: "ACTIVO" },
    { id: 10, nombre: "KIMBERLY", estado: "ACTIVO" },
    { id: 15, nombre: "IMPORT ZEUS", estado: "ACTIVO" },
    { id: 31, nombre: "LIZETH", estado: "ACTIVO" },
    { id: 32, nombre: "EVELYN", estado: "ACTIVO" },
    { id: 33, nombre: "JOSEPH", estado: "ACTIVO" },
    { id: 34, nombre: "SANDRA", estado: "ACTIVO" },
    { id: 35, nombre: "ALVARO", estado: "ACTIVO" },
  ]);

  // Datos de prueba - Formas de Pago
  const [formasPago, setFormasPago] = useState([
    { id: 1, nombre: "CREDITO", estado: "ACTIVO" },
    { id: 2, nombre: "BCP", estado: "ACTIVO" },
    { id: 6, nombre: "YAPE", estado: "ACTIVO" },
    { id: 8, nombre: "BCP K", estado: "ACTIVO" },
    { id: 9, nombre: "EFECTIVO", estado: "ACTIVO" },
    { id: 10, nombre: "TRANSFERENCIA", estado: "ACTIVO" },
    { id: 11, nombre: "TARJETA", estado: "ACTIVO" },
    { id: 12, nombre: "PLIN", estado: "ACTIVO" },
  ]);

  // Datos de prueba - Lugares
  const [lugares, setLugares] = useState([
    { id: 72, lugar: "NARANJAL", tipo: "AVENIDA" },
    { id: 69, lugar: "HUARAL", tipo: "DISTRITO" },
    { id: 66, lugar: "AV TUPAC AMARU", tipo: "DISTRITO" },
    { id: 65, lugar: "LIMA", tipo: "CIUDAD" },
    { id: 64, lugar: "CALLAO", tipo: "DISTRITO" },
  ]);

  const opcionesTipoCliente = [
    { value: "1", label: "Persona Natural" },
    { value: "2", label: "Persona Jurídica" },
  ];

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

  const handleClienteChange = (e) => {
    const { name, value } = e.target;
    setNuevoCliente((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const registrarCliente = () => {
    if (!nuevoCliente.nombre || !nuevoCliente.tipo) {
      return;
    }
    console.log("Registrar cliente:", nuevoCliente);
    setNuevoCliente({ nombre: "", tipo: "" });
  };

  const recargarDatos = () => {
    console.log("Recargar datos");
    // Lógica para recargar datos
  };

  const editarAsesor = (id) => {
    console.log("Editar asesor:", id);
  };

  const eliminarAsesor = (id) => {
    console.log("Eliminar asesor:", id);
  };

  const nuevoAsesor = () => {
    console.log("Nuevo asesor");
  };

  const editarFormaPago = (id) => {
    console.log("Editar forma de pago:", id);
  };

  const eliminarFormaPago = (id) => {
    console.log("Eliminar forma de pago:", id);
  };

  const nuevaFormaPago = () => {
    console.log("Nueva forma de pago");
  };

  const editarLugar = (id) => {
    console.log("Editar lugar:", id);
  };

  const eliminarLugar = (id) => {
    console.log("Eliminar lugar:", id);
  };

  const nuevoLugar = () => {
    console.log("Nuevo lugar");
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
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Gestión de Configuraciones</h1>
                <button
                  onClick={recargarDatos}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-200 flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Recargar Datos</span>
                </button>
              </div>

              {/* Secciones lado a lado */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Card 1: Gestión de Asesores */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200/60 p-6">
                  <div className="flex items-center justify-between mb-4 p-3 bg-gradient-to-r from-[#1E63F7] to-[#1E63F7] text-white rounded-lg">
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <h2 className="text-lg font-bold">Gestión de Asesores</h2>
                    </div>
                    <button
                      onClick={nuevoAsesor}
                      className="px-3 py-1.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all duration-200 text-sm flex items-center space-x-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Nuevo Asesor</span>
                    </button>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-blue-700 border-b-2 border-blue-800">
                            <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ID</th>
                            <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">NOMBRE</th>
                            <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ESTADO</th>
                            <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ACCIONES</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {asesores.map((asesor) => (
                            <tr key={asesor.id} className="hover:bg-slate-200 transition-colors">
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{asesor.id}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{asesor.nombre}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px]">
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-[10px] font-semibold">
                                  {asesor.estado}
                                </span>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center space-x-2">
                                  <button
                                    onClick={() => editarAsesor(asesor.id)}
                                    className="flex items-center space-x-1 px-2.5 py-1 bg-blue-600 border-2 border-blue-700 hover:bg-blue-700 hover:border-blue-800 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    <span>Editar</span>
                                  </button>
                                  <button
                                    onClick={() => eliminarAsesor(asesor.id)}
                                    className="flex items-center space-x-1 px-2.5 py-1 bg-red-600 border-2 border-red-700 hover:bg-red-700 hover:border-red-800 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    <span>Eliminar</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Card 2: Gestión de Formas de Pago */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200/60 p-6">
                  <div className="flex items-center justify-between mb-4 p-3 bg-gradient-to-r from-[#1E63F7] to-[#1E63F7] text-white rounded-lg">
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      <h2 className="text-lg font-bold">Gestión de Formas de Pago</h2>
                    </div>
                    <button
                      onClick={nuevaFormaPago}
                      className="px-3 py-1.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all duration-200 text-sm flex items-center space-x-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Nueva Forma de Pago</span>
                    </button>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-blue-700 border-b-2 border-blue-800">
                            <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ID</th>
                            <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">NOMBRE</th>
                            <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ESTADO</th>
                            <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ACCIONES</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {formasPago.map((forma) => (
                            <tr key={forma.id} className="hover:bg-slate-200 transition-colors">
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{forma.id}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{forma.nombre}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px]">
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-[10px] font-semibold">
                                  {forma.estado}
                                </span>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center space-x-2">
                                  <button
                                    onClick={() => editarFormaPago(forma.id)}
                                    className="flex items-center space-x-1 px-2.5 py-1 bg-blue-600 border-2 border-blue-700 hover:bg-blue-700 hover:border-blue-800 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    <span>Editar</span>
                                  </button>
                                  <button
                                    onClick={() => eliminarFormaPago(forma.id)}
                                    className="flex items-center space-x-1 px-2.5 py-1 bg-red-600 border-2 border-red-700 hover:bg-red-700 hover:border-red-800 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    <span>Eliminar</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Gestión de Lugares */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200/60 p-6 mb-6">
                <div className="flex items-center justify-between mb-4 p-3 bg-gradient-to-r from-[#1E63F7] to-[#1E63F7] text-white rounded-lg">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <h2 className="text-lg font-bold">Gestión de Lugares</h2>
                  </div>
                  <button
                    onClick={nuevoLugar}
                    className="px-3 py-1.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all duration-200 text-sm flex items-center space-x-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Nuevo Lugar</span>
                  </button>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-blue-700 border-b-2 border-blue-800">
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ID</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">LUGAR</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">TIPO</th>
                          <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ACCIONES</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {lugares.map((lugar) => (
                          <tr key={lugar.id} className="hover:bg-slate-200 transition-colors">
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{lugar.id}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{lugar.lugar}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{lugar.tipo}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center space-x-2">
                                <button
                                  onClick={() => editarLugar(lugar.id)}
                                  className="flex items-center space-x-1 px-2.5 py-1 bg-blue-600 border-2 border-blue-700 hover:bg-blue-700 hover:border-blue-800 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  <span>Editar</span>
                                </button>
                                <button
                                  onClick={() => eliminarLugar(lugar.id)}
                                  className="flex items-center space-x-1 px-2.5 py-1 bg-red-600 border-2 border-red-700 hover:bg-red-700 hover:border-red-800 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  <span>Eliminar</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Paginación */}
                  <div className="bg-slate-200 px-3 py-2 flex items-center justify-between border-t-2 border-slate-300">
                    <button
                      onClick={() => setCurrentPageLugares((prev) => Math.max(1, prev - 1))}
                      disabled={currentPageLugares === 1}
                      className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      &lt;
                    </button>
                    <span className="text-[10px] text-gray-700 font-medium">
                      Página {currentPageLugares} de {totalPagesLugares} ({totalLugares} lugares)
                    </span>
                    <button
                      onClick={() => setCurrentPageLugares((prev) => Math.min(totalPagesLugares, prev + 1))}
                      disabled={currentPageLugares === totalPagesLugares}
                      className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      &gt;
                    </button>
                  </div>
                </div>
              </div>

              {/* Card 4: Registro de Nuevos Clientes */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200/60 p-6">
                <div className="flex items-center space-x-2 mb-4 p-3 bg-gradient-to-r from-[#1E63F7] to-[#1E63F7] text-white rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h2 className="text-lg font-bold">Registro de Nuevos Clientes</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nombre del Cliente <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="nombre"
                      value={nuevoCliente.nombre}
                      onChange={handleClienteChange}
                      placeholder="Ingrese el nombre completo del cliente"
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E63F7] focus:border-[#1E63F7] transition-all text-sm"
                    />
                  </div>
                  <div>
                    <CustomSelect
                      name="tipo"
                      value={nuevoCliente.tipo}
                      onChange={handleClienteChange}
                      options={opcionesTipoCliente}
                      placeholder="Seleccione un tipo"
                      label="Tipo de Cliente"
                      required
                    />
                  </div>
                  <div>
                    <button
                      onClick={registrarCliente}
                      className="w-full px-6 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Registrar Cliente</span>
                    </button>
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

