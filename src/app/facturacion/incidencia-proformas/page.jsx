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

export default function IncidenciaProformasPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filtros, setFiltros] = useState({
    verificacion: "Todos",
    desde: "",
    hasta: "",
  });

  // Datos de prueba
  const [incidencias, setIncidencias] = useState([
    {
      id: 51,
      fechaRegistro: "06-12-2025 05:51:21 PM",
      registradoPor: "JOSEPH",
      mes: "DICIEMBRE",
      encargadoComprobante: "ALVARO",
      fechaEmision: "04-12-2025 07:00:00 PM",
      proformaActa: "P 23026",
      comprobante: "NV 2194",
      responsableIncidencia: "KIMBERLY",
      itemsError: "PDF",
      tipoIncidencia: "ERROR DE PRODUCTO",
      fechaNotificacion: "06-12-2025 05:59:54 PM",
      solucion: "ACTA",
      revisadoPor: "KIMBERLY",
      estadoVerificacion: "NOTIFICADO",
    },
    {
      id: 50,
      fechaRegistro: "06-12-2025 05:48:51 PM",
      registradoPor: "JOSEPH",
      mes: "DICIEMBRE",
      encargadoComprobante: "JOSE",
      fechaEmision: "04-12-2025 07:00:00 PM",
      proformaActa: "P 23103",
      comprobante: "F 10203",
      responsableIncidencia: "KIMBERLY",
      itemsError: "PDF",
      tipoIncidencia: "ERROR DE CANTIDAD",
      fechaNotificacion: "06-12-2025 05:58:20 PM",
      solucion: "MODIFICADO",
      revisadoPor: "KIMBERLY",
      estadoVerificacion: "NOTIFICADO",
    },
    {
      id: 45,
      fechaRegistro: "05-12-2025 05:34:42 PM",
      registradoPor: "JOSEPH",
      mes: "OCTUBRE",
      encargadoComprobante: "JOSEPH",
      fechaEmision: "23-10-2025 07:00:00 PM",
      proformaActa: "ACTA 638",
      comprobante: "ACTA 638",
      responsableIncidencia: "SANDRA",
      itemsError: "PDF",
      tipoIncidencia: "ERROR DE CANTIDAD",
      fechaNotificacion: "06-12-2025 03:17:13 PM",
      solucion: "UNA COMPRA",
      revisadoPor: "KIMBERLY",
      estadoVerificacion: "NOTIFICADO",
      fechaEnvioArchivo: "06-12-2025 04:20:11 PM",
    },
    {
      id: 42,
      fechaRegistro: "04-12-2025 02:28:30 PM",
      registradoPor: "JOSEPH",
      mes: "NOVIEMBRE",
      encargadoComprobante: "LIZETH",
      fechaEmision: "23-11-2025 07:00:00 PM",
      proformaActa: "P 22954",
      comprobante: "F 10083",
      responsableIncidencia: "SANDRA",
      itemsError: "PDF",
      tipoIncidencia: "ERROR DE PRODUCTO",
      fechaNotificacion: "06-12-2025 03:05:08 PM",
      solucion: "ACTA",
      revisadoPor: "KIMBERLY",
      estadoVerificacion: "NOTIFICADO",
      fechaEnvioArchivo: "06-12-2025 04:15:52 PM",
    },
  ]);

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

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const aplicarFiltros = () => {
    console.log("Aplicar filtros:", filtros);
    // Lógica para aplicar filtros
  };

  const limpiarFiltros = () => {
    setFiltros({
      verificacion: "Todos",
      desde: "",
      hasta: "",
    });
  };

  const exportarCSV = () => {
    console.log("Exportar CSV");
    // Lógica para exportar CSV
  };

  const generarReporte = () => {
    console.log("Generar reporte");
    // Lógica para generar reporte
  };

  const verProcedimiento = () => {
    console.log("Ver procedimiento");
    // Lógica para ver procedimiento
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

  const opcionesVerificacion = [
    { value: "Todos", label: "Todos" },
    { value: "Notificado", label: "Notificado" },
    { value: "Verificado", label: "Verificado" },
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
              <div className="mb-6 flex items-center justify-between p-4 bg-gradient-to-r from-[#1E63F7] to-[#1E63F7] text-white rounded-lg">
                <h1 className="text-2xl font-bold">Listado de incidencias</h1>
                <button
                  onClick={verProcedimiento}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold transition-all duration-200 flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Ver procedimiento</span>
                </button>
              </div>

              {/* Card: Filtros */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200/60 p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  {/* Filtrar por verificación */}
                  <div>
                    <CustomSelect
                      name="verificacion"
                      value={filtros.verificacion}
                      onChange={handleFiltroChange}
                      options={opcionesVerificacion}
                      placeholder="Seleccione"
                      label="Filtrar por verificación"
                    />
                  </div>

                  {/* Desde */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Desde
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="desde"
                        value={filtros.desde}
                        onChange={handleFiltroChange}
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

                  {/* Hasta */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Hasta
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="hasta"
                        value={filtros.hasta}
                        onChange={handleFiltroChange}
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
                </div>

                {/* Botones de acción */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={aplicarFiltros}
                    className="px-6 py-2.5 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] text-white rounded-lg font-semibold hover:shadow-md transition-all duration-200 shadow-sm"
                  >
                    Aplicar filtros
                  </button>
                  <button
                    onClick={limpiarFiltros}
                    className="px-6 py-2.5 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-all duration-200 shadow-sm"
                  >
                    Limpiar
                  </button>
                  <button
                    onClick={exportarCSV}
                    className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all duration-200 shadow-sm flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Exportar CSV</span>
                  </button>
                  <button
                    onClick={generarReporte}
                    className="px-6 py-2.5 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-all duration-200 shadow-sm flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Generar reporte</span>
                  </button>
                </div>
              </div>

              {/* Card: Tabla de Incidencias */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200/60 p-6">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-blue-700 border-b-2 border-blue-800">
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ID</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Fecha de registro</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Registrado por</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Mes</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Encargado comprobante</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Fecha de emisión</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">N° proforma/acta</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">N° comprobante</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Responsable incidencia</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Ítems de error</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">TIPO DE INCIDENCIA</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Fecha de notificación</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">SOLUCIÓN</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Obs. adicionales</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">REVISADO POR</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Estado de verificación</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Fecha envío de archivo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {incidencias.map((incidencia) => (
                          <tr key={incidencia.id} className="hover:bg-slate-200 transition-colors">
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{incidencia.id}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{incidencia.fechaRegistro}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{incidencia.registradoPor}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{incidencia.mes}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{incidencia.encargadoComprobante}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{incidencia.fechaEmision}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{incidencia.proformaActa}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{incidencia.comprobante}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{incidencia.responsableIncidencia}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                              <div className="flex items-center space-x-1">
                                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <span>{incidencia.itemsError}</span>
                              </div>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{incidencia.tipoIncidencia}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{incidencia.fechaNotificacion}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{incidencia.solucion}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                              <button className="text-blue-700 hover:text-blue-800 rounded-lg transition-all duration-200 active:scale-[0.98]">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{incidencia.revisadoPor}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px]">
                              <button className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-[10px] font-semibold hover:bg-blue-200 transition-colors">
                                {incidencia.estadoVerificacion}
                              </button>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{incidencia.fechaEnvioArchivo || "-"}</td>
                          </tr>
                        ))}
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

