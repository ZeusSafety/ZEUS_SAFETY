"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";
import { registrarCombustibleCompleto } from "../../../services/movilidadApi";

export default function RegistroMovilidadPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Detectar si es desktop y abrir sidebar automáticamente
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    // Establecer estado inicial
    handleResize();

    // Escuchar cambios de tamaño
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Bloque 1: Datos Fijos
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [vehiculo, setVehiculo] = useState("");
  const [conductor, setConductor] = useState("");
  const [kmInicial, setKmInicial] = useState("");
  const [kmFinal, setKmFinal] = useState("");
  const [miembros, setMiembros] = useState("");

  // Bloque 2: Estado
  const [estaLimpio, setEstaLimpio] = useState("");
  const [enBuenEstado, setEnBuenEstado] = useState("");
  const [descripcionEstado, setDescripcionEstado] = useState("");

  // Bloque 3: Combustible
  const [llenoCombustible, setLlenoCombustible] = useState("");
  const [tipoCombustible, setTipoCombustible] = useState("");
  const [precioTotal, setPrecioTotal] = useState("");
  const [precioUnitario, setPrecioUnitario] = useState("");
  const [fileCombustible, setFileCombustible] = useState(null);

  // Bloque 4: Cochera
  const [pagoCochera, setPagoCochera] = useState("");
  const [montoCochera, setMontoCochera] = useState("");
  const [fileCochera, setFileCochera] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!vehiculo || !conductor || !kmInicial || !kmFinal || !miembros) {
      alert("Por favor complete todos los campos del Bloque 1");
      return;
    }

    if (!estaLimpio || !enBuenEstado) {
      alert("Por favor complete todos los campos del Bloque 2");
      return;
    }

    if (enBuenEstado === "No" && !descripcionEstado.trim()) {
      alert("Por favor ingrese la descripción del estado del vehículo");
      return;
    }

    if (llenoCombustible === "Si") {
      if (!tipoCombustible || !precioTotal || !precioUnitario || !fileCombustible) {
        alert("Por favor complete todos los campos de combustible");
        return;
      }
    }

    if (pagoCochera === "Si") {
      if (!montoCochera || !fileCochera) {
        alert("Por favor complete todos los campos de cochera");
        return;
      }
    }

    try {
      setLoading(true);

      // Crear FormData
      const formData = new FormData();
      
      // Bloque 1
      formData.append("fecha", fecha);
      formData.append("vehiculo", vehiculo);
      formData.append("conductor", conductor);
      formData.append("km_inicial", kmInicial);
      formData.append("km_final", kmFinal);
      formData.append("miembros_vehiculo", miembros);

      // Bloque 2
      formData.append("esta_limpio", estaLimpio);
      formData.append("en_buen_estado", enBuenEstado);
      if (descripcionEstado) {
        formData.append("descripcion_estado", descripcionEstado);
      }

      // Bloque 3
      formData.append("lleno_combustible", llenoCombustible);
      if (llenoCombustible === "Si") {
        formData.append("tipo_combustible", tipoCombustible);
        formData.append("precio_total", precioTotal);
        formData.append("precio_unitario", precioUnitario);
        if (fileCombustible) {
          formData.append("file_combustible", fileCombustible);
        }
      }

      // Bloque 4
      formData.append("pago_cochera", pagoCochera);
      if (pagoCochera === "Si") {
        formData.append("monto_cochera", montoCochera);
        if (fileCochera) {
          formData.append("file_cochera", fileCochera);
        }
      }

      // Enviar a la API
      await registrarCombustibleCompleto(formData);
      
      alert("Registro guardado exitosamente");
      router.push("/logistica");
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Error al guardar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

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
              onClick={() => router.push("/logistica")}
              className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-blue-700 to-blue-800 text-white rounded-lg font-semibold hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver a Logística</span>
            </button>

            {/* Card contenedor blanco */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-8">
              {/* Header mejorado */}
              <div className="mb-8 pb-6 border-b border-gray-200">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-xl flex items-center justify-center text-white shadow-md">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                      Registro de Movilidad
                    </h1>
                    <p className="text-xs text-gray-600 mt-1 font-medium">Complete todos los campos requeridos para registrar la movilidad del vehículo</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Bloque 1: Datos Fijos */}
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border-2 border-gray-200 shadow-sm">
                  <div className="flex items-center space-x-3 mb-5">
                    <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">1</span>
                    </div>
                    <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                      Datos Fijos
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                        Fecha <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={fecha}
                        onChange={(e) => setFecha(e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 bg-white font-medium"
                        style={{ fontFamily: 'var(--font-poppins)' }}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                        Vehículo <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={vehiculo}
                        onChange={(e) => setVehiculo(e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 bg-white font-medium"
                        style={{ fontFamily: 'var(--font-poppins)' }}
                        required
                      >
                        <option value="">Seleccione un vehículo...</option>
                        <option value="Apolo">Apolo</option>
                        <option value="Ares">Ares</option>
                        <option value="Poseidon">Poseidon</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                        Conductor <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={conductor}
                        onChange={(e) => setConductor(e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 bg-white font-medium"
                        style={{ fontFamily: 'var(--font-poppins)' }}
                        placeholder="Nombre del conductor"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                        Kilometraje Inicial <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={kmInicial}
                        onChange={(e) => setKmInicial(e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 bg-white font-medium"
                        style={{ fontFamily: 'var(--font-poppins)' }}
                        placeholder="00000"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                        Kilometraje Final <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={kmFinal}
                        onChange={(e) => setKmFinal(e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 bg-white font-medium"
                        style={{ fontFamily: 'var(--font-poppins)' }}
                        placeholder="00000"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                        Miembros en el vehículo <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={miembros}
                        onChange={(e) => setMiembros(e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 bg-white font-medium"
                        style={{ fontFamily: 'var(--font-poppins)' }}
                        placeholder="Ej: Juan, María, Pedro"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Bloque 2: Estado */}
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border-2 border-gray-200 shadow-sm">
                  <div className="flex items-center space-x-3 mb-5">
                    <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">2</span>
                    </div>
                    <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                      Estado del Vehículo
                    </h2>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                        ¿Has encontrado el vehículo limpio? <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={estaLimpio}
                        onChange={(e) => setEstaLimpio(e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 bg-white font-medium"
                        style={{ fontFamily: 'var(--font-poppins)' }}
                        required
                      >
                        <option value="">Seleccione una opción...</option>
                        <option value="Si">Sí</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                        ¿Vehículo en buen estado? <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={enBuenEstado}
                        onChange={(e) => setEnBuenEstado(e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 bg-white font-medium"
                        style={{ fontFamily: 'var(--font-poppins)' }}
                        required
                      >
                        <option value="">Seleccione una opción...</option>
                        <option value="Si">Sí</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                    {enBuenEstado === "No" && (
                      <div className="transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-top-2">
                        <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                          Descripción detallada del problema <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={descripcionEstado}
                          onChange={(e) => setDescripcionEstado(e.target.value)}
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 bg-white font-medium resize-none"
                          style={{ fontFamily: 'var(--font-poppins)' }}
                          rows={4}
                          placeholder="Describa el estado del vehículo..."
                          required={enBuenEstado === "No"}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Bloque 3: Combustible */}
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border-2 border-gray-200 shadow-sm">
                  <div className="flex items-center space-x-3 mb-5">
                    <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">3</span>
                    </div>
                    <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                      Combustible
                    </h2>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                        ¿Has llenado combustible? <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={llenoCombustible}
                        onChange={(e) => setLlenoCombustible(e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 bg-white font-medium"
                        style={{ fontFamily: 'var(--font-poppins)' }}
                        required
                      >
                        <option value="">Seleccione una opción...</option>
                        <option value="Si">Sí</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                    {llenoCombustible === "Si" && (
                      <div className="space-y-5 transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-top-2">
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                            Tipo de Combustible <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={tipoCombustible}
                            onChange={(e) => setTipoCombustible(e.target.value)}
                            className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 bg-white font-medium"
                            style={{ fontFamily: 'var(--font-poppins)' }}
                            required={llenoCombustible === "Si"}
                          >
                            <option value="">Seleccione el tipo...</option>
                            <option value="Gasolina 90">Gasolina 90</option>
                            <option value="Gasolina 95">Gasolina 95</option>
                            <option value="Diesel">Diesel</option>
                            <option value="GLP">GLP</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                              Precio Total (S/) <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={precioTotal}
                              onChange={(e) => setPrecioTotal(e.target.value)}
                              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 bg-white font-medium"
                              style={{ fontFamily: 'var(--font-poppins)' }}
                              placeholder="0.00"
                              required={llenoCombustible === "Si"}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                              Precio Unitario (S/) <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={precioUnitario}
                              onChange={(e) => setPrecioUnitario(e.target.value)}
                              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 bg-white font-medium"
                              style={{ fontFamily: 'var(--font-poppins)' }}
                              placeholder="0.00"
                              required={llenoCombustible === "Si"}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                            Imagen de Comprobante de Pago <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => setFileCombustible(e.target.files[0])}
                              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 bg-white font-medium file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                              style={{ fontFamily: 'var(--font-poppins)' }}
                              required={llenoCombustible === "Si"}
                            />
                          </div>
                          {fileCombustible && (
                            <p className="mt-2 text-sm text-green-600 font-medium" style={{ fontFamily: 'var(--font-poppins)' }}>
                              ✓ Archivo seleccionado: {fileCombustible.name}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bloque 4: Cochera */}
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border-2 border-gray-200 shadow-sm">
                  <div className="flex items-center space-x-3 mb-5">
                    <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">4</span>
                    </div>
                    <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                      Cochera
                    </h2>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                        ¿Pagaste cochera? <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={pagoCochera}
                        onChange={(e) => setPagoCochera(e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 bg-white font-medium"
                        style={{ fontFamily: 'var(--font-poppins)' }}
                        required
                      >
                        <option value="">Seleccione una opción...</option>
                        <option value="Si">Sí</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                    {pagoCochera === "Si" && (
                      <div className="space-y-5 transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-top-2">
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                            Monto de Cochera (S/) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={montoCochera}
                            onChange={(e) => setMontoCochera(e.target.value)}
                            className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 bg-white font-medium"
                            style={{ fontFamily: 'var(--font-poppins)' }}
                            placeholder="0.00"
                            required={pagoCochera === "Si"}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                            Imagen de Comprobante de Pago <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => setFileCochera(e.target.files[0])}
                              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 bg-white font-medium file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                              style={{ fontFamily: 'var(--font-poppins)' }}
                              required={pagoCochera === "Si"}
                            />
                          </div>
                          {fileCochera && (
                            <p className="mt-2 text-sm text-green-600 font-medium" style={{ fontFamily: 'var(--font-poppins)' }}>
                              ✓ Archivo seleccionado: {fileCochera.name}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Botones mejorados */}
                <div className="flex gap-4 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => router.push("/logistica")}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                    style={{ fontFamily: 'var(--font-poppins)' }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-gradient-to-br from-blue-700 to-blue-800 text-white rounded-xl hover:from-blue-800 hover:to-blue-900 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                    style={{ fontFamily: 'var(--font-poppins)' }}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Guardando...
                      </span>
                    ) : (
                      "Guardar Registro"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
