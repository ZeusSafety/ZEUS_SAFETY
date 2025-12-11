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

export default function CrearVentaPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [apiConectada, setApiConectada] = useState(true);

  // Estado del formulario - Cabecera del Pedido
  const [formData, setFormData] = useState({
    fecha: new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    asesor: "",
    clasificacion: "",
    cliente: "",
    comprobante: "FACTUF",
    comprobanteNumero: "F",
    salidaPedido: "",
    formaPago: "",
    region: "LIMA",
    distrito: "",
    lugar: "",
    observaciones: "",
  });

  // Estado para productos
  const [productos, setProductos] = useState([]);
  const [nuevoProducto, setNuevoProducto] = useState({
    producto: "",
    codigo: "",
    cantidad: 1,
    precioVenta: "",
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

  const handleProductoChange = (e) => {
    const { name, value } = e.target;
    setNuevoProducto((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const calcularTotal = () => {
    const cantidad = parseFloat(nuevoProducto.cantidad) || 0;
    const precio = parseFloat(nuevoProducto.precioVenta) || 0;
    return (cantidad * precio).toFixed(2);
  };

  const calcularTotalGeneral = () => {
    return productos.reduce((total, producto) => {
      const cantidad = parseFloat(producto.cantidad) || 0;
      const precio = parseFloat(producto.precioVenta) || 0;
      return total + (cantidad * precio);
    }, 0).toFixed(2);
  };

  const agregarProducto = () => {
    if (!nuevoProducto.producto || !nuevoProducto.codigo || !nuevoProducto.precioVenta) {
      return;
    }

    const producto = {
      id: Date.now(),
      ...nuevoProducto,
      precioVenta: parseFloat(nuevoProducto.precioVenta),
      cantidad: parseFloat(nuevoProducto.cantidad),
      total: calcularTotal(),
    };

    setProductos([...productos, producto]);
    setNuevoProducto({
      producto: "",
      codigo: "",
      cantidad: 1,
      precioVenta: "",
    });
  };

  const eliminarProducto = (id) => {
    setProductos(productos.filter((p) => p.id !== id));
  };

  const limpiarFormulario = () => {
    setFormData({
      fecha: new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      asesor: "",
      clasificacion: "",
      cliente: "",
      comprobante: "FACTUF",
      comprobanteNumero: "F",
      salidaPedido: "",
      formaPago: "",
      region: "LIMA",
      distrito: "",
      lugar: "",
      observaciones: "",
    });
    setProductos([]);
    setNuevoProducto({
      producto: "",
      codigo: "",
      cantidad: 1,
      precioVenta: "",
    });
  };

  const guardarVenta = () => {
    // Aquí iría la lógica para guardar la venta
    console.log("Guardar venta:", { formData, productos });
    // TODO: Implementar llamada a API
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

  // Opciones para los selects (ejemplo - deberían venir de la API)
  const opcionesAsesor = [
    { value: "1", label: "Asesor 1" },
    { value: "2", label: "Asesor 2" },
  ];

  const opcionesClasificacion = [
    { value: "1", label: "Clasificación 1" },
    { value: "2", label: "Clasificación 2" },
  ];

  const opcionesComprobante = [
    { value: "FACTUF", label: "FACTUF" },
    { value: "BOLETA", label: "BOLETA" },
  ];

  const opcionesSalidaPedido = [
    { value: "1", label: "Salida 1" },
    { value: "2", label: "Salida 2" },
  ];

  const opcionesFormaPago = [
    { value: "1", label: "Efectivo" },
    { value: "2", label: "Tarjeta" },
    { value: "3", label: "Transferencia" },
  ];

  const opcionesDistrito = [
    { value: "1", label: "Distrito 1" },
    { value: "2", label: "Distrito 2" },
  ];

  const opcionesLugar = [
    { value: "1", label: "Lugar 1" },
    { value: "2", label: "Lugar 2" },
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
              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] rounded-xl flex items-center justify-center text-white shadow-sm">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Registrar Venta</h1>
                    <p className="text-sm text-gray-600 font-medium mt-0.5">Crear nueva venta en el sistema</p>
                  </div>
                </div>
              </div>

              {/* Card 1: Cabecera del Pedido */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200/60 p-6 mb-6">
                {/* Sección: Cabecera del Pedido */}
                <div>
                <div className="flex items-center justify-between mb-4 p-3 bg-gradient-to-r from-[#1E63F7] to-[#1E63F7] rounded-lg">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <h2 className="text-lg font-bold text-white">Cabecera del Pedido</h2>
                  </div>
                  {apiConectada && (
                    <div className="flex items-center space-x-2 text-white">
                      <svg className="w-5 h-5 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm font-medium">API Conectada</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E63F7] focus:border-[#1E63F7] transition-all text-sm"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Asesor */}
                  <div>
                    <CustomSelect
                      name="asesor"
                      value={formData.asesor}
                      onChange={handleInputChange}
                      options={opcionesAsesor}
                      placeholder="Seleccione un asesor"
                      label="Asesor"
                    />
                  </div>

                  {/* Clasificación */}
                  <div>
                    <CustomSelect
                      name="clasificacion"
                      value={formData.clasificacion}
                      onChange={handleInputChange}
                      options={opcionesClasificacion}
                      placeholder="Seleccione una clasificación"
                      label="Clasificación"
                    />
                  </div>

                  {/* Cliente */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Cliente
                    </label>
                    <input
                      type="text"
                      name="cliente"
                      value={formData.cliente}
                      onChange={handleInputChange}
                      placeholder="Ingrese el nombre del cliente"
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E63F7] focus:border-[#1E63F7] transition-all text-sm"
                    />
                  </div>

                  {/* Comprobante */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Comprobante
                    </label>
                    <div className="flex space-x-2">
                      <div className="flex-1">
                        <CustomSelect
                          name="comprobante"
                          value={formData.comprobante}
                          onChange={handleInputChange}
                          options={opcionesComprobante}
                          placeholder="Seleccione"
                        />
                      </div>
                      <div className="w-20">
                        <input
                          type="text"
                          name="comprobanteNumero"
                          value={formData.comprobanteNumero}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E63F7] focus:border-[#1E63F7] transition-all text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Salida de Pedido */}
                  <div>
                    <CustomSelect
                      name="salidaPedido"
                      value={formData.salidaPedido}
                      onChange={handleInputChange}
                      options={opcionesSalidaPedido}
                      placeholder="Seleccione una salida"
                      label="Salida de Pedido"
                    />
                  </div>

                  {/* Forma de Pago */}
                  <div>
                    <CustomSelect
                      name="formaPago"
                      value={formData.formaPago}
                      onChange={handleInputChange}
                      options={opcionesFormaPago}
                      placeholder="Seleccione forma de pago"
                      label="Forma de Pago"
                    />
                  </div>

                  {/* Región */}
                  <div>
                    <CustomSelect
                      name="region"
                      value={formData.region}
                      onChange={handleInputChange}
                      options={[{ value: "LIMA", label: "LIMA" }]}
                      placeholder="Seleccione"
                      label="Región"
                    />
                  </div>

                  {/* Distrito */}
                  <div>
                    <CustomSelect
                      name="distrito"
                      value={formData.distrito}
                      onChange={handleInputChange}
                      options={opcionesDistrito}
                      placeholder="Seleccione un distrito"
                      label="Distrito"
                    />
                  </div>

                  {/* Lugar */}
                  <div>
                    <CustomSelect
                      name="lugar"
                      value={formData.lugar}
                      onChange={handleInputChange}
                      options={opcionesLugar}
                      placeholder="Seleccione un lugar"
                      label="Lugar"
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
              </div>

              {/* Card 2: Detalle de Productos Vendidos */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200/60 p-6 mb-6">
                {/* Sección: Detalle de Productos Vendidos */}
                <div>
                  <div className="flex items-center space-x-2 mb-4 p-3 bg-gradient-to-r from-[#1E63F7] to-[#1E63F7] rounded-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <h2 className="text-lg font-bold text-white">Detalle de Productos Vendidos</h2>
                  </div>

                {/* Agregar Nuevo Producto */}
                <div className="bg-[#E8EFFF] rounded-lg p-4 mb-4 border-2 border-[#1E63F7]/20">
                  <div className="flex items-center space-x-2 mb-4">
                    <svg className="w-5 h-5 text-[#1E63F7]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    <h3 className="text-base font-bold text-gray-900">Agregar Nuevo Producto</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Producto
                      </label>
                      <input
                        type="text"
                        name="producto"
                        value={nuevoProducto.producto}
                        onChange={handleProductoChange}
                        placeholder="Nombre del producto"
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E63F7] focus:border-[#1E63F7] transition-all text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Código
                      </label>
                      <input
                        type="text"
                        name="codigo"
                        value={nuevoProducto.codigo}
                        onChange={handleProductoChange}
                        placeholder="Código del producto"
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E63F7] focus:border-[#1E63F7] transition-all text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Cantidad
                      </label>
                      <input
                        type="number"
                        name="cantidad"
                        value={nuevoProducto.cantidad}
                        onChange={handleProductoChange}
                        min="1"
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E63F7] focus:border-[#1E63F7] transition-all text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Precio de Venta
                      </label>
                      <input
                        type="number"
                        name="precioVenta"
                        value={nuevoProducto.precioVenta}
                        onChange={handleProductoChange}
                        step="0.01"
                        min="0"
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E63F7] focus:border-[#1E63F7] transition-all text-sm"
                      />
                    </div>

                    <div className="flex items-end space-x-2">
                      <div className="flex-1">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Total
                        </label>
                        <div className="px-4 py-2.5 border-2 border-gray-300 rounded-lg bg-gray-50 text-sm font-semibold text-gray-900">
                          S/ {calcularTotal()}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={agregarProducto}
                        className="px-4 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center space-x-1.5"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Agregar</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tabla de Productos */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-blue-700 border-b-2 border-blue-800">
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ID DETALLE</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">N° COMPROBANTE</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">CÓDIGO</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">PRODUCTO</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">CANTIDAD</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">PRECIO VENTA</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">IGV (18%)</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">TOTAL</th>
                          <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ACCIONES</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {productos.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="px-4 py-12 text-center">
                              <div className="flex flex-col items-center justify-center">
                                <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                <p className="text-gray-500 font-medium text-[10px]">No hay productos agregados</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          productos.map((producto, index) => {
                            const igv = (producto.cantidad * producto.precioVenta * 0.18).toFixed(2);
                            const total = (producto.cantidad * producto.precioVenta * 1.18).toFixed(2);
                            return (
                              <tr key={producto.id} className="hover:bg-slate-200 transition-colors">
                                <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{index + 1}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{formData.comprobanteNumero}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{producto.codigo}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{producto.producto}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{producto.cantidad}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">S/ {producto.precioVenta.toFixed(2)}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">S/ {igv}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">S/ {total}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-center">
                                  <button
                                    onClick={() => eliminarProducto(producto.id)}
                                    className="flex items-center space-x-1 px-2.5 py-1 bg-red-600 border-2 border-red-700 hover:bg-red-700 hover:border-red-800 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    <span>Eliminar</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Total General */}
                <div className="mt-4 flex justify-end">
                  <div className="text-lg font-bold text-gray-900">
                    Total General: S/ {calcularTotalGeneral()}
                  </div>
                </div>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={limpiarFormulario}
                  className="px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-all duration-200 shadow-sm hover:shadow-md flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Limpiar Formulario</span>
                </button>
                <button
                  type="button"
                  onClick={guardarVenta}
                  className="px-6 py-3 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] text-white rounded-lg font-semibold hover:shadow-md transition-all duration-200 shadow-sm flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  <span>Guardar Venta</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

