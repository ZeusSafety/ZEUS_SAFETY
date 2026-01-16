"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";
import { registrarCombustibleCompleto } from "../../../services/movilidadApi";
import Modal from "../../../components/ui/Modal";

export default function RegistroMovilidadPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalMensaje, setModalMensaje] = useState({
    open: false,
    tipo: "success", // success, error, warning, info
    titulo: "",
    mensaje: "",
  });

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
  const [esOtroConductor, setEsOtroConductor] = useState(false); // <--- NUEVO ESTADO
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

  // Estados para miembros
  const [miembrosSeleccionados, setMiembrosSeleccionados] = useState([]);
  const [miembroManual, setMiembroManual] = useState("");
  const [mostrarInputManual, setMostrarInputManual] = useState(false);

  // Sincronizar con el string de 'miembros' que ya usas para el backend
  useEffect(() => {
    const lista = [...miembrosSeleccionados];
    if (mostrarInputManual && miembroManual.trim() !== "") {
      lista.push(miembroManual);
    }
    setMiembros(lista.join(", ")); // Esto actualiza el 'miembros' que envías al backend
  }, [miembrosSeleccionados, miembroManual, mostrarInputManual]);

  const handleCheckboxChange = (nombre) => {
    if (nombre === "Otros") {
      setMostrarInputManual(!mostrarInputManual);
    } else {
      setMiembrosSeleccionados(prev =>
        prev.includes(nombre)
          ? prev.filter(item => item !== nombre)
          : [...prev, nombre]
      );
    }
  };

  const handleConductorChange = (e) => {
    const valor = e.target.value;
    if (valor === "Otros") {
      setEsOtroConductor(true);
      setConductor(""); // Limpia para que el usuario escriba el nombre manual
    } else {
      setEsOtroConductor(false);
      setConductor(valor);
    }
  };

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
        // Mapear valores del tipo de combustible al formato exacto que espera la base de datos
        // Verificado: La BD acepta "Gas GNV" (con espacio) tal como se muestra en los registros existentes
        let tipoCombustibleNormalizado = tipoCombustible.trim();

        // Mapeo específico: usar exactamente los valores que funcionan en la BD
        const mapeoTipos = {
          "Petroleo": "Petroleo",
          "Gasolina": "Gasolina",
          "GNV": "Gas GNV",        // Formato exacto que acepta la BD (con espacio)
          "GLP": "Gas GLP"         // Formato consistente para GLP
        };

        tipoCombustibleNormalizado = mapeoTipos[tipoCombustible] || tipoCombustible.trim();

        // Debug: ver qué valor se está enviando
        console.log("Tipo de combustible seleccionado:", tipoCombustible);
        console.log("Tipo de combustible mapeado:", tipoCombustibleNormalizado);
        console.log("Longitud del valor:", tipoCombustibleNormalizado.length);

        // Verificar el FormData antes de enviarlo
        formData.append("tipo_combustible", tipoCombustibleNormalizado);

        // Debug adicional: verificar que el valor se agregó correctamente al FormData
        console.log("Valor en FormData (verificación):", formData.get("tipo_combustible"));
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

      // Mostrar modal de éxito
      setModalMensaje({
        open: true,
        tipo: "success",
        titulo: "¡Registro guardado exitosamente!",
        mensaje: "El registro de movilidad ha sido guardado correctamente en el sistema.",
      });

      // Redirigir después de 2 segundos
      setTimeout(() => {
        router.push("/logistica");
      }, 2000);
    } catch (error) {
      console.error("Error al guardar:", error);
      setModalMensaje({
        open: true,
        tipo: "error",
        titulo: "Error al guardar",
        mensaje: error.message || "Ocurrió un error al intentar guardar el registro. Por favor, intente nuevamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${sidebarOpen ? "lg:ml-60 ml-0" : "ml-0"
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
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-4 md:p-8">
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

                  {/* GRID PRINCIPAL */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">

                    {/* 1. FECHA */}
                    <div className="w-full">
                      <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                        Fecha <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={fecha}
                        onChange={(e) => setFecha(e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-black bg-white font-medium"
                        style={{ fontFamily: 'var(--font-poppins)' }}
                        required
                      />
                    </div>

                    {/* 2. VEHÍCULO */}
                    <div className="w-full">
                      <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                        Vehículo <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={vehiculo}
                        onChange={(e) => setVehiculo(e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-black bg-white font-medium"
                        style={{ fontFamily: 'var(--font-poppins)' }}
                        required
                      >
                        <option value="">Seleccione un vehículo...</option>
                        <option value="Apolo">Apolo</option>
                        <option value="Ares">Ares</option>
                        <option value="Poseidon">Poseidon</option>
                      </select>
                    </div>

                    {/* 3. CONDUCTOR */}
                    <div className="w-full">
                      <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                        Conductor <span className="text-red-500">*</span>
                      </label>
                      <div className="space-y-3">
                        <select
                          onChange={handleConductorChange}
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-black bg-white font-medium"
                          style={{ fontFamily: 'var(--font-poppins)' }}
                          required
                        >
                          <option value="">Seleccione un conductor...</option>
                          <option value="Joseph">Joseph</option>
                          <option value="Manuel">Manuel</option>
                          <option value="Hervin">Hervin</option>
                          <option value="Otros">Otros</option>
                        </select>
                        {esOtroConductor && (
                          <input
                            type="text"
                            value={conductor}
                            onChange={(e) => setConductor(e.target.value)}
                            className="w-full px-4 py-2.5 border-2 border-blue-300 rounded-lg text-black outline-none animate-in fade-in slide-in-from-top-1"
                            placeholder="Nombre del conductor"
                            required
                          />
                        )}
                      </div>
                    </div>

                    {/* 4. MIEMBROS - COMPORTAMIENTO IGUAL AL CONDUCTOR */}
                    <div className="w-full">
                      <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                        Miembros en el vehículo <span className="text-red-500">*</span>
                      </label>
                      <div className="space-y-3">
                        {/* Caja de Checkboxes (Altura fija para no hacer acordeón) */}
                        <div className="w-full p-2 bg-white border-2 border-gray-300 rounded-lg min-h-[50px] flex items-center shadow-sm">
                          <div className="flex flex-wrap gap-2">
                            {["Manuel", "Jhonson", "Jhosep", "Victor", "Otros"].map((nombre) => (
                              <label
                                key={nombre}
                                className={`flex items-center px-3 py-1 rounded-md border transition-all cursor-pointer select-none text-sm font-medium ${(nombre === "Otros" ? mostrarInputManual : miembrosSeleccionados.includes(nombre))
                                  ? "bg-blue-600 border-blue-600 text-white"
                                  : "bg-gray-50 border-gray-200 text-gray-700 hover:border-blue-400"
                                  }`}
                              >
                                <input
                                  type="checkbox"
                                  className="hidden"
                                  checked={nombre === "Otros" ? mostrarInputManual : miembrosSeleccionados.includes(nombre)}
                                  onChange={() => handleCheckboxChange(nombre)}
                                />
                                {nombre}
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Input Manual fuera de la caja (Igual que el Conductor) */}
                        {mostrarInputManual && (
                          <input
                            type="text"
                            value={miembroManual}
                            onChange={(e) => setMiembroManual(e.target.value)}
                            className="w-full px-4 py-2.5 border-2 border-blue-300 rounded-lg text-black font-medium outline-none animate-in fade-in slide-in-from-top-1"
                            placeholder="Escriba los nombres de los miembros adicionales..."
                            autoFocus
                            required
                          />
                        )}
                      </div>
                      <input type="hidden" value={miembros} required />
                    </div>

                    {/* 5. KILOMETRAJE INICIAL */}
                    <div className="w-full">
                      <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                        Kilometraje Inicial <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={kmInicial}
                        onChange={(e) => setKmInicial(e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-black bg-white font-medium"
                        style={{ fontFamily: 'var(--font-poppins)' }}
                        placeholder="00000"
                        required
                      />
                    </div>

                    {/* 6. KILOMETRAJE FINAL */}
                    <div className="w-full">
                      <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                        Kilometraje Final <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={kmFinal}
                        onChange={(e) => setKmFinal(e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-black bg-white font-medium"
                        style={{ fontFamily: 'var(--font-poppins)' }}
                        placeholder="00000"
                        required
                      />
                    </div>

                  </div>
                </div>

                {/* Bloque 2: Estado */}
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border-2 border-gray-200 shadow-sm">

                  {/* Título del Bloque */}
                  <div className="flex items-center space-x-3 mb-5">
                    <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">2</span>
                    </div>
                    <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                      Estado del Vehículo
                    </h2>
                  </div>

                  {/* CONTENEDOR GRID: 2 columnas en PC, 1 en móvil */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">

                    {/* COLUMNA 1: LIMPIEZA */}
                    <div className="w-full">
                      <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                        ¿Has encontrado el vehículo limpio? <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={estaLimpio}
                        onChange={(e) => setEstaLimpio(e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-black bg-white font-medium"
                        style={{ fontFamily: 'var(--font-poppins)' }}
                        required
                      >
                        <option value="">Seleccione una opción...</option>
                        <option value="Si">Sí</option>
                        <option value="No">No</option>
                      </select>
                    </div>

                    {/* COLUMNA 2: ESTADO */}
                    <div className="w-full">
                      <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                        ¿Vehículo en buen estado? <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={enBuenEstado}
                        onChange={(e) => setEnBuenEstado(e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-black bg-white font-medium"
                        style={{ fontFamily: 'var(--font-poppins)' }}
                        required
                      >
                        <option value="">Seleccione una opción...</option>
                        <option value="Si">Sí</option>
                        <option value="No">No</option>
                      </select>
                    </div>

                    {/* DESCRIPCIÓN (Aparece abajo si es "No") */}
                    {enBuenEstado === "No" && (
                      <div className="col-span-1 md:col-span-2 transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-top-2">
                        <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                          Descripción detallada del problema <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={descripcionEstado}
                          onChange={(e) => setDescripcionEstado(e.target.value)}
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-black bg-white font-medium resize-none"
                          style={{ fontFamily: 'var(--font-poppins)' }}
                          rows={3}
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
                            <option value="Petroleo">Petróleo</option>
                            <option value="Gasolina">Gasolina</option>
                            <option value="GNV">GNV</option>
                            <option value="GLP">Gas GLP</option>
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
                          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-blue-400 transition-colors bg-white cursor-pointer relative group">
                            <input
                              id="file-combustible-input"
                              type="file"
                              accept="image/*"
                              capture="environment"
                              onChange={(e) => setFileCombustible(e.target.files[0])}
                              className="sr-only"
                              required={llenoCombustible === "Si"}
                            />
                            <label htmlFor="file-combustible-input" className="cursor-pointer text-center w-full">
                              <div className="space-y-1 text-center">
                                <svg
                                  className="mx-auto h-12 w-12 text-gray-400 group-hover:text-blue-500 transition-colors"
                                  stroke="currentColor"
                                  fill="none"
                                  viewBox="0 0 48 48"
                                  aria-hidden="true"
                                >
                                  <path
                                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                    strokeWidth={2}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <div className="flex flex-col items-center text-sm text-gray-600">
                                  <span className="relative cursor-pointer bg-blue-50 px-4 py-2 rounded-lg font-bold text-blue-700 hover:bg-blue-100 transition-all border border-blue-200">
                                    {fileCombustible ? "Cambiar archivo / foto" : "Seleccionar o Tomar Foto"}
                                  </span>
                                  <p className="mt-2 text-xs text-gray-500">Click para abrir la cámara o galería</p>
                                </div>
                              </div>
                            </label>
                          </div>
                          {fileCombustible && (
                            <div className="mt-3 p-3 bg-green-50 rounded-lg flex items-center justify-between border border-green-200 animate-in fade-in slide-in-from-top-1">
                              <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <div className="overflow-hidden">
                                  <p className="text-xs font-bold text-green-800 truncate max-w-[200px]">{fileCombustible.name}</p>
                                  <p className="text-[10px] text-green-600">Archivo listo para cargar</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setFileCombustible(null)}
                                className="p-1.5 rounded-full hover:bg-red-50 text-red-500 transition-all"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </div>
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
                          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-blue-400 transition-colors bg-white cursor-pointer relative group">
                            <input
                              id="file-cochera-input"
                              type="file"
                              accept="image/*"
                              capture="environment"
                              onChange={(e) => setFileCochera(e.target.files[0])}
                              className="sr-only"
                              required={pagoCochera === "Si"}
                            />
                            <label htmlFor="file-cochera-input" className="cursor-pointer text-center w-full">
                              <div className="space-y-1 text-center">
                                <svg
                                  className="mx-auto h-12 w-12 text-gray-400 group-hover:text-blue-500 transition-colors"
                                  stroke="currentColor"
                                  fill="none"
                                  viewBox="0 0 48 48"
                                  aria-hidden="true"
                                >
                                  <path
                                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                    strokeWidth={2}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <div className="flex flex-col items-center text-sm text-gray-600">
                                  <span className="relative cursor-pointer bg-blue-50 px-4 py-2 rounded-lg font-bold text-blue-700 hover:bg-blue-100 transition-all border border-blue-200">
                                    {fileCochera ? "Cambiar archivo / foto" : "Seleccionar o Tomar Foto"}
                                  </span>
                                  <p className="mt-2 text-xs text-gray-500">Click para abrir la cámara o galería</p>
                                </div>
                              </div>
                            </label>
                          </div>
                          {fileCochera && (
                            <div className="mt-3 p-3 bg-green-50 rounded-lg flex items-center justify-between border border-green-200 animate-in fade-in slide-in-from-top-1">
                              <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <div className="overflow-hidden">
                                  <p className="text-xs font-bold text-green-800 truncate max-w-[200px]">{fileCochera.name}</p>
                                  <p className="text-[10px] text-green-600">Archivo listo para cargar</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setFileCochera(null)}
                                className="p-1.5 rounded-full hover:bg-red-50 text-red-500 transition-all"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Botones mejorados */}
                <div className="flex flex-col md:flex-row gap-3 md:gap-4 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => router.push("/logistica")}
                    className="w-full md:flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                    style={{ fontFamily: 'var(--font-poppins)' }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full md:flex-1 px-6 py-3 bg-gradient-to-br from-blue-700 to-blue-800 text-white rounded-xl hover:from-blue-800 hover:to-blue-900 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
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

      {/* Modal de Confirmación/Error Personalizado */}
      <Modal
        isOpen={modalMensaje.open}
        onClose={() => setModalMensaje({ ...modalMensaje, open: false })}
        title=""
        size="sm"
        hideFooter={true}
      >
        <div className="p-6">
          {/* Header con gradiente según tipo */}
          <div className={`rounded-t-xl -mx-6 -mt-6 mb-6 px-6 py-4 ${modalMensaje.tipo === "success"
            ? "bg-gradient-to-r from-green-500 to-green-600"
            : modalMensaje.tipo === "error"
              ? "bg-gradient-to-r from-red-500 to-red-600"
              : modalMensaje.tipo === "warning"
                ? "bg-gradient-to-r from-orange-500 to-orange-600"
                : "bg-gradient-to-r from-blue-500 to-blue-600"
            }`}>
            <div className="flex items-center space-x-3">
              {modalMensaje.tipo === "success" && (
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              {modalMensaje.tipo === "error" && (
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
              {modalMensaje.tipo === "warning" && (
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              )}
              {modalMensaje.tipo === "info" && (
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              )}
              <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-poppins)' }}>
                {modalMensaje.titulo}
              </h3>
            </div>
          </div>

          {/* Mensaje */}
          <p className={`text-base mb-6 ${modalMensaje.tipo === "success"
            ? "text-green-800"
            : modalMensaje.tipo === "error"
              ? "text-red-800"
              : modalMensaje.tipo === "warning"
                ? "text-orange-800"
                : "text-blue-800"
            }`} style={{ fontFamily: 'var(--font-poppins)' }}>
            {modalMensaje.mensaje}
          </p>

          {/* Botón de acción */}
          <div className="flex justify-end pt-2">
            <button
              onClick={() => setModalMensaje({ ...modalMensaje, open: false })}
              className={`px-6 py-2.5 text-sm font-semibold text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 ${modalMensaje.tipo === "success"
                ? "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                : modalMensaje.tipo === "error"
                  ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                  : modalMensaje.tipo === "warning"
                    ? "bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800"
                    : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                }`}
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              Aceptar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
