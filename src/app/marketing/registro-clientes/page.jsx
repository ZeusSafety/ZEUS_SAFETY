"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/context/AuthContext";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";

export default function RegistroClientesPage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Estados para el formulario
    const [formData, setFormData] = useState({
        cliente: "",
        telefono: "",
        ruc: "",
        dni: "",
        region: "", // Guardaremos el NOMBRE de la región aquí
        distrito: "", // Guardaremos el NOMBRE del distrito aquí
        tipo_cliente: "",
        canal_origen: ""
    });

    // Estado para el ID de la región seleccionada (para la API de distritos)
    const [selectedRegionId, setSelectedRegionId] = useState("");

    // Estados para selectores
    const [regiones, setRegiones] = useState([]);
    const [distritos, setDistritos] = useState([]);
    const [loadingRegiones, setLoadingRegiones] = useState(false);
    const [loadingDistritos, setLoadingDistritos] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notification, setNotification] = useState({ show: false, message: "", type: "" });

    // Rutas internas validadas en el sistema
    const apiRegiones = "/api/regiones";
    const apiDistritos = "/api/distritos";
    const apiRegistro = "https://api-registro-clientes-online-2946605267.us-central1.run.app/";

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        } else if (user) {
            fetchRegiones();
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

    const fetchRegiones = async () => {
        setLoadingRegiones(true);
        try {
            const response = await fetch(apiRegiones);
            if (response.ok) {
                const data = await response.json();
                // Según CotizacionesPage, la data viene en data.data o directamente
                const lista = data.data || data;
                setRegiones(Array.isArray(lista) ? lista : []);
            }
        } catch (error) {
            console.error("Error al cargar regiones:", error);
        } finally {
            setLoadingRegiones(false);
        }
    };

    const fetchDistritos = async (idRegion) => {
        if (!idRegion) {
            setDistritos([]);
            return;
        }
        setLoadingDistritos(true);
        try {
            // Usamos el mismo parámetro que CotizacionesPage: id_region
            const response = await fetch(`${apiDistritos}?id_region=${encodeURIComponent(idRegion)}`);
            if (response.ok) {
                const data = await response.json();
                const lista = data.data || data;
                setDistritos(Array.isArray(lista) ? lista : []);
            }
        } catch (error) {
            console.error("Error al cargar distritos:", error);
        } finally {
            setLoadingDistritos(false);
        }
    };

    const handleRegionChange = (e) => {
        const id = e.target.value;
        setSelectedRegionId(id);

        // Buscar el objeto región para obtener su NOMBRE
        const regionObj = regiones.find(r => (r.ID_REGION || r.id_region || r.ID || r.id)?.toString() === id);
        const nombreRegion = regionObj ? (regionObj.REGION || regionObj.nombre || "") : "";

        // Actualizamos formData con el NOMBRE de la región y reseteamos distrito
        setFormData({ ...formData, region: nombreRegion, distrito: "" });

        // Cargamos distritos usando el ID
        fetchDistritos(id);
    };

    const handleDistritoChange = (e) => {
        const nombreDistrito = e.target.value;
        setFormData({ ...formData, distrito: nombreDistrito });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setNotification({ show: false, message: "", type: "" });

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(apiRegistro, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": token ? (token.startsWith("Bearer") ? token : `Bearer ${token}`) : ""
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok) {
                setNotification({
                    show: true,
                    message: `Cliente registrado correctamente con ID: ${result.id}`,
                    type: "success"
                });
                // Reset form
                setFormData({
                    cliente: "",
                    telefono: "",
                    ruc: "",
                    dni: "",
                    region: "",
                    distrito: "",
                    tipo_cliente: "",
                    canal_origen: ""
                });
                setSelectedRegionId("");
                setDistritos([]);
            } else {
                setNotification({
                    show: true,
                    message: result.error || "Error al registrar cliente",
                    type: "error"
                });
            }
        } catch (error) {
            setNotification({
                show: true,
                message: "Error de conexión con el servidor.",
                type: "error"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-[#F7FAFF]">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${sidebarOpen ? "lg:ml-60 ml-0" : "ml-0"}`}>
                <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

                <main className="flex-1 overflow-y-auto custom-scrollbar" style={{ background: '#F7FAFF' }}>
                    <div className="max-w-[100%] mx-auto px-6 py-4">

                        {/* Botón Volver */}
                        <button
                            onClick={() => router.push("/marketing")}
                            className="mb-4 flex items-center space-x-1.5 px-4 py-2 bg-[#002855] text-white rounded-lg font-bold hover:bg-[#001D3D] transition-all duration-200 shadow-md text-sm group"
                            style={{ fontFamily: 'var(--font-poppins)' }}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                            <span>Volver a Marketing</span>
                        </button>

                        {/* Contenedor Principal Blanco */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">

                            {/* Cabecera */}
                            <div className="mb-10 flex items-center space-x-4">
                                <div className="w-14 h-14 bg-[#002855] rounded-xl flex items-center justify-center text-white shadow-lg">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 leading-tight" style={{ fontFamily: 'var(--font-poppins)' }}>Registro de Clientes</h1>
                                    <p className="text-gray-500 text-sm font-medium" style={{ fontFamily: 'var(--font-poppins)' }}>Complete el formulario para dar de alta un nuevo cliente.</p>
                                </div>
                            </div>

                            {/* Formulario */}
                            <div className="space-y-8">
                                {notification.show && (
                                    <div className={`p-4 rounded-xl flex items-center space-x-3 animate-in fade-in duration-300 ${notification.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
                                        }`}>
                                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            {notification.type === "success" ? (
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            ) : (
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            )}
                                        </svg>
                                        <span className="text-sm font-bold">{notification.message}</span>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                                        {/* CLIENTE */}
                                        <div className="space-y-2">
                                            <label className="flex items-center text-[11px] font-black text-[#002D5A] uppercase tracking-[0.1em]" style={{ fontFamily: 'var(--font-poppins)' }}>
                                                <span className="w-1 h-3 bg-[#002D5A] mr-2 rounded-full"></span>
                                                CLIENTE / RAZÓN SOCIAL
                                            </label>
                                            <input
                                                required
                                                type="text"
                                                name="cliente"
                                                value={formData.cliente}
                                                onChange={handleChange}
                                                placeholder="Nombre completo o Empresa"
                                                className="w-full px-5 py-3.5 bg-white border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-semibold text-gray-900 shadow-sm"
                                                style={{ fontFamily: 'var(--font-poppins)' }}
                                            />
                                        </div>

                                        {/* TELÉFONO */}
                                        <div className="space-y-2">
                                            <label className="flex items-center text-[11px] font-black text-[#002D5A] uppercase tracking-[0.1em]" style={{ fontFamily: 'var(--font-poppins)' }}>
                                                <span className="w-1 h-3 bg-[#002D5A] mr-2 rounded-full"></span>
                                                TELÉFONO
                                            </label>
                                            <input
                                                required
                                                type="number"
                                                name="telefono"
                                                value={formData.telefono}
                                                onChange={handleChange}
                                                placeholder="Ej. 999 888 777"
                                                className="w-full px-5 py-3.5 bg-white border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-semibold text-gray-900 shadow-sm"
                                                style={{ fontFamily: 'var(--font-poppins)' }}
                                            />
                                        </div>

                                        {/* RUC */}
                                        <div className="space-y-2">
                                            <label className="flex items-center text-[11px] font-black text-[#002D5A] uppercase tracking-[0.1em]" style={{ fontFamily: 'var(--font-poppins)' }}>
                                                <span className="w-1 h-3 bg-[#002D5A] mr-2 rounded-full"></span>
                                                RUC (OPCIONAL)
                                            </label>
                                            <input
                                                type="text"
                                                name="ruc"
                                                value={formData.ruc}
                                                onChange={handleChange}
                                                placeholder="Ej. 20123456789"
                                                className="w-full px-5 py-3.5 bg-white border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-semibold text-gray-900 shadow-sm"
                                                style={{ fontFamily: 'var(--font-poppins)' }}
                                            />
                                        </div>

                                        {/* DNI */}
                                        <div className="space-y-2">
                                            <label className="flex items-center text-[11px] font-black text-[#002D5A] uppercase tracking-[0.1em]" style={{ fontFamily: 'var(--font-poppins)' }}>
                                                <span className="w-1 h-3 bg-[#002D5A] mr-2 rounded-full"></span>
                                                DNI (OPCIONAL)
                                            </label>
                                            <input
                                                type="text"
                                                name="dni"
                                                value={formData.dni}
                                                onChange={handleChange}
                                                placeholder="Ej. 44556677"
                                                className="w-full px-5 py-3.5 bg-white border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-semibold text-gray-900 shadow-sm"
                                                style={{ fontFamily: 'var(--font-poppins)' }}
                                            />
                                        </div>

                                        {/* REGIÓN - Fix keys to match ID_REGION */}
                                        <div className="space-y-2">
                                            <label className="flex items-center text-[11px] font-black text-[#002D5A] uppercase tracking-[0.1em]" style={{ fontFamily: 'var(--font-poppins)' }}>
                                                <span className="w-1 h-3 bg-[#002D5A] mr-2 rounded-full"></span>
                                                REGIÓN
                                            </label>
                                            <div className="relative">
                                                <select
                                                    required
                                                    value={selectedRegionId}
                                                    onChange={handleRegionChange}
                                                    className="w-full px-5 py-3.5 bg-white border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-semibold text-gray-900 appearance-none cursor-pointer shadow-sm"
                                                    style={{ fontFamily: 'var(--font-poppins)', appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none' }}
                                                >
                                                    <option value="">{loadingRegiones ? "Cargando..." : "Seleccione una región"}</option>
                                                    {regiones.map((reg) => (
                                                        <option key={reg.ID_REGION || reg.id_region || reg.ID || reg.id} value={reg.ID_REGION || reg.id_region || reg.ID || reg.id}>
                                                            {(reg.REGION || reg.nombre || reg).toUpperCase()}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                                </div>
                                            </div>
                                        </div>

                                        {/* DISTRITO - Fix keys to match ID_DISTRITO and DISTRITO */}
                                        <div className="space-y-2">
                                            <label className="flex items-center text-[11px] font-black text-[#002D5A] uppercase tracking-[0.1em]" style={{ fontFamily: 'var(--font-poppins)' }}>
                                                <span className="w-1 h-3 bg-[#002D5A] mr-2 rounded-full"></span>
                                                DISTRITO
                                            </label>
                                            <div className="relative">
                                                <select
                                                    required
                                                    disabled={!selectedRegionId || loadingDistritos}
                                                    value={formData.distrito}
                                                    onChange={handleDistritoChange}
                                                    className="w-full px-5 py-3.5 bg-white border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-semibold text-gray-900 appearance-none cursor-pointer shadow-sm disabled:bg-gray-50"
                                                    style={{ fontFamily: 'var(--font-poppins)', appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none' }}
                                                >
                                                    <option value="">{loadingDistritos ? "Consultando..." : "Seleccione un distrito"}</option>
                                                    {distritos.map((dist) => (
                                                        <option key={dist.ID_DISTRITO || dist.id_distrito || dist.ID || dist.id} value={dist.DISTRITO || dist.nombre || dist}>
                                                            {(dist.DISTRITO || dist.nombre || dist).toUpperCase()}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                                </div>
                                            </div>
                                        </div>

                                        {/* TIPO CLIENTE */}
                                        <div className="space-y-2">
                                            <label className="flex items-center text-[11px] font-black text-[#002D5A] uppercase tracking-[0.1em]" style={{ fontFamily: 'var(--font-poppins)' }}>
                                                <span className="w-1 h-3 bg-[#002D5A] mr-2 rounded-full"></span>
                                                TIPO DE CLIENTE
                                            </label>
                                            <div className="relative">
                                                <select
                                                    required
                                                    name="tipo_cliente"
                                                    value={formData.tipo_cliente}
                                                    onChange={handleChange}
                                                    className="w-full px-5 py-3.5 bg-white border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-semibold text-gray-900 appearance-none cursor-pointer shadow-sm"
                                                    style={{ fontFamily: 'var(--font-poppins)', appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none' }}
                                                >
                                                    <option value="">Seleccione tipo</option>
                                                    <option value="Persona">PERSONA</option>
                                                    <option value="Empresa">EMPRESA</option>
                                                    <option value="Mayorista">MAYORISTA</option>
                                                </select>
                                                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                                </div>
                                            </div>
                                        </div>

                                        {/* CANAL ORIGEN */}
                                        <div className="space-y-2">
                                            <label className="flex items-center text-[11px] font-black text-[#002D5A] uppercase tracking-[0.1em]" style={{ fontFamily: 'var(--font-poppins)' }}>
                                                <span className="w-1 h-3 bg-[#002D5A] mr-2 rounded-full"></span>
                                                CANAL DE ORIGEN
                                            </label>
                                            <div className="relative">
                                                <select
                                                    required
                                                    name="canal_origen"
                                                    value={formData.canal_origen}
                                                    onChange={handleChange}
                                                    className="w-full px-5 py-3.5 bg-white border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-semibold text-gray-900 appearance-none cursor-pointer shadow-sm"
                                                    style={{ fontFamily: 'var(--font-poppins)', appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none' }}
                                                >
                                                    <option value="">Seleccione canal</option>
                                                    <option value="WhatsApp">WHATSAPP</option>
                                                    <option value="Facebook">FACEBOOK</option>
                                                    <option value="Meta Ads">META ADS</option>
                                                </select>
                                                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Submit Section */}
                                    <div className="pt-10 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
                                        <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest max-w-sm">
                                            * Todos los campos con excepción de RUC y DNI son de carácter obligatorio.
                                        </p>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full md:w-auto px-12 py-4 bg-[#002855] hover:bg-[#001D3D] text-white rounded-xl font-black text-sm uppercase tracking-widest transition-all duration-300 shadow-xl shadow-blue-900/10 flex items-center justify-center space-x-3 active:scale-95 disabled:opacity-70 group"
                                            style={{ fontFamily: 'var(--font-poppins)' }}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                                                    <span>Procesando...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    <span>Guardar Registro</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
