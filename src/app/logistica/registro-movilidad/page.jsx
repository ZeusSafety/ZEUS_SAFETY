"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";
import { registrarCombustibleCompleto } from "../../../services/movilidadApi";

export default function RegistroMovilidadPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);

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
              className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-blue-700 to-blue-800 text-white rounded-lg font-semibold hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm ripple-effect relative overflow-hidden text-sm group"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver</span>
            </button>

            {/* Card contenedor blanco */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                  Registro de Movilidad
                </h1>
                <p className="text-sm text-gray-600 mt-1">Complete todos los campos requeridos</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Bloque 1: Datos Fijos */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <h2 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-poppins)' }}>
                    Bloque 1: Datos Fijos
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
                      <input
                        type="date"
                        value={fecha}
                        onChange={(e) => setFecha(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vehículo *</label>
                      <select
                        value={vehiculo}
                        onChange={(e) => setVehiculo(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                        required
                      >
                        <option value="">Seleccione...</option>
                        <option value="Apolo">Apolo</option>
                        <option value="Ares">Ares</option>
                        <option value="Poseidon">Poseidon</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Conductor *</label>
                      <input
                        type="text"
                        value={conductor}
                        onChange={(e) => setConductor(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kilometraje Inicial *</label>
                      <input
                        type="number"
                        value={kmInicial}
                        onChange={(e) => setKmInicial(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kilometraje Final *</label>
                      <input
                        type="number"
                        value={kmFinal}
                        onChange={(e) => setKmFinal(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Miembros en el vehículo *</label>
                      <input
                        type="text"
                        value={miembros}
                        onChange={(e) => setMiembros(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        placeholder="Ej: Juan, María, Pedro"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Bloque 2: Estado */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <h2 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-poppins)' }}>
                    Bloque 2: Estado
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">¿Has encontrado el vehículo limpio? *</label>
                      <select
                        value={estaLimpio}
                        onChange={(e) => setEstaLimpio(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                        required
                      >
                        <option value="">Seleccione...</option>
                        <option value="Si">Sí</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">¿Vehículo en buen estado? *</label>
                      <select
                        value={enBuenEstado}
                        onChange={(e) => setEnBuenEstado(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                        required
                      >
                        <option value="">Seleccione...</option>
                        <option value="Si">Sí</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                    {enBuenEstado === "No" && (
                      <div className="transition-all duration-300 ease-in-out">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción detallada *</label>
                        <textarea
                          value={descripcionEstado}
                          onChange={(e) => setDescripcionEstado(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                          rows={3}
                          required={enBuenEstado === "No"}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Bloque 3: Combustible */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <h2 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-poppins)' }}>
                    Bloque 3: Combustible
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">¿Has llenado combustible? *</label>
                      <select
                        value={llenoCombustible}
                        onChange={(e) => setLlenoCombustible(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                        required
                      >
                        <option value="">Seleccione...</option>
                        <option value="Si">Sí</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                    {llenoCombustible === "Si" && (
                      <div className="space-y-4 transition-all duration-300 ease-in-out">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Combustible *</label>
                          <select
                            value={tipoCombustible}
                            onChange={(e) => setTipoCombustible(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                            required={llenoCombustible === "Si"}
                          >
                            <option value="">Seleccione...</option>
                            <option value="Gasolina 90">Gasolina 90</option>
                            <option value="Gasolina 95">Gasolina 95</option>
                            <option value="Diesel">Diesel</option>
                            <option value="GLP">GLP</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Precio Total *</label>
                            <input
                              type="number"
                              step="0.01"
                              value={precioTotal}
                              onChange={(e) => setPrecioTotal(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                              required={llenoCombustible === "Si"}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Precio Unitario *</label>
                            <input
                              type="number"
                              step="0.01"
                              value={precioUnitario}
                              onChange={(e) => setPrecioUnitario(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                              required={llenoCombustible === "Si"}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Imagen de Pago *</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setFileCombustible(e.target.files[0])}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                            required={llenoCombustible === "Si"}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bloque 4: Cochera */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <h2 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-poppins)' }}>
                    Bloque 4: Cochera
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">¿Pagaste cochera? *</label>
                      <select
                        value={pagoCochera}
                        onChange={(e) => setPagoCochera(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                        required
                      >
                        <option value="">Seleccione...</option>
                        <option value="Si">Sí</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                    {pagoCochera === "Si" && (
                      <div className="space-y-4 transition-all duration-300 ease-in-out">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Monto de Cochera *</label>
                          <input
                            type="number"
                            step="0.01"
                            value={montoCochera}
                            onChange={(e) => setMontoCochera(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                            required={pagoCochera === "Si"}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Imagen de Pago Cochera *</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setFileCochera(e.target.files[0])}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                            required={pagoCochera === "Si"}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Botones */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => router.push("/logistica")}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-gradient-to-br from-blue-700 to-blue-800 text-white rounded-lg hover:from-blue-800 hover:to-blue-900 disabled:opacity-50"
                  >
                    {loading ? "Guardando..." : "Guardar Registro"}
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
