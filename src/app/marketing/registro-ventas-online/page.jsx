"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/context/AuthContext";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";

export default function RegistroVentasOnlinePage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Estados de Cabecera
    const [cabecera, setCabecera] = useState({
        asesor: "",
        id_cliente: "",
        cliente: "",
        tipo_comprobante: "",
        comprobante: "",
        region: "",
        distrito: "",
        forma_pago: "",
        salida: ""
    });

    // Estados de Detalle
    const [detalle, setDetalle] = useState({
        linea: "ZEUS SAFETY",
        canal: "FACEBOOK ADS",
        clasificacion: "ONLINE",
        producto: "",
        codigo: "",
        cantidad: 1,
        unidad: "UNIDADES",
        precio: "",
        delivery: 0,
        total: 0
    });

    const [itemsAgregados, setItemsAgregados] = useState([]);

    // Estados para buscadores
    const [clientes, setClientes] = useState([]);
    const [busquedaCliente, setBusquedaCliente] = useState("");
    const [mostrarSugerenciasCliente, setMostrarSugerenciasCliente] = useState(false);

    const [productos, setProductos] = useState([]);
    const [busquedaProducto, setBusquedaProducto] = useState("");
    const [mostrarSugerenciasProducto, setMostrarSugerenciasProducto] = useState(false);

    const [regiones, setRegiones] = useState([]);
    const [distritos, setDistritos] = useState([]);
    const [selectedRegionId, setSelectedRegionId] = useState("");

    const [loadingClientes, setLoadingClientes] = useState(false);
    const [loadingProductos, setLoadingProductos] = useState(false);
    const [loadingRegiones, setLoadingRegiones] = useState(false);
    const [loadingDistritos, setLoadingDistritos] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notification, setNotification] = useState({ show: false, message: "", type: "" });

    const clienteRef = useRef(null);
    const productoRef = useRef(null);

    const apiBase = "https://api-registro-clientes-online-2946605267.us-central1.run.app/";
    const apiProductos = "https://api-productos-zeus-2946605267.us-central1.run.app/productos/5?method=BUSQUEDA_PRODUCTO";

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        } else if (user) {
            fetchInitialData();
            setCabecera(prev => ({ ...prev, asesor: user.nombre || "DHILSEN" }));
        }
    }, [user, loading, router]);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) setSidebarOpen(true);
            else setSidebarOpen(false);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (clienteRef.current && !clienteRef.current.contains(event.target)) setMostrarSugerenciasCliente(false);
            if (productoRef.current && !productoRef.current.contains(event.target)) setMostrarSugerenciasProducto(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchInitialData = async () => {
        fetchClientes();
        fetchProductos();
        fetchRegiones();
    };

    const fetchClientes = async () => {
        setLoadingClientes(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(apiBase, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setClientes(data);
            }
        } catch (error) { console.error(error); } finally { setLoadingClientes(false); }
    };

    const fetchProductos = async () => {
        setLoadingProductos(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(apiProductos, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setProductos(Array.isArray(data) ? data : (data.data || []));
            }
        } catch (error) { console.error(error); } finally { setLoadingProductos(false); }
    };

    const fetchRegiones = async () => {
        setLoadingRegiones(true);
        try {
            const response = await fetch("/api/regiones");
            const data = await response.json();
            setRegiones(data.data || data);
        } catch (error) { console.error(error); } finally { setLoadingRegiones(false); }
    };

    const fetchDistritos = async (regionId) => {
        setLoadingDistritos(true);
        try {
            const response = await fetch(`/api/distritos?id_region=${regionId}`);
            const data = await response.json();
            setDistritos(data.data || data);
        } catch (error) { console.error(error); } finally { setLoadingDistritos(false); }
    };

    const handleTipoComprobanteChange = (e) => {
        const tipo = e.target.value;
        let p = "";
        if (tipo === "PROFORMA") p = "P";
        else if (tipo === "FACTURA") p = "F";
        else if (tipo === "BOLETA") p = "B";
        setCabecera({ ...cabecera, tipo_comprobante: tipo, comprobante: p });
    };

    const handleRegionChange = (e) => {
        const id = e.target.value;
        setSelectedRegionId(id);
        const reg = regiones.find(r => (r.ID_REGION || r.id_region || r.ID || r.id)?.toString() === id);
        const name = reg ? (reg.REGION || reg.nombre || "") : "";
        setCabecera({ ...cabecera, region: name, distrito: "" });
        fetchDistritos(id);
    };

    const handleClienteSelect = (cli) => {
        setCabecera({ ...cabecera, id_cliente: cli.ID_CLIENTE, cliente: cli.CLIENTE });
        setBusquedaCliente(cli.CLIENTE);
        setMostrarSugerenciasCliente(false);
    };

    const handleProductoSelect = (prod) => {
        setDetalle({ ...detalle, producto: prod.NOMBRE || prod.nombre, codigo: prod.CODIGO || prod.codigo });
        setBusquedaProducto(prod.NOMBRE || prod.nombre);
        setMostrarSugerenciasProducto(false);
    };

    useEffect(() => {
        const cant = parseFloat(detalle.cantidad) || 0;
        const prec = parseFloat(detalle.precio) || 0;
        const deliv = parseFloat(detalle.delivery) || 0;
        setDetalle(prev => ({ ...prev, total: (cant * prec) + deliv }));
    }, [detalle.cantidad, detalle.precio, detalle.delivery]);

    const agregarItem = () => {
        if (!detalle.producto || !detalle.precio || !detalle.cantidad) {
            alert("Campos incompletos."); return;
        }
        setItemsAgregados([...itemsAgregados, { ...detalle, id: Date.now() }]);
        setDetalle({ ...detalle, producto: "", codigo: "", cantidad: 1, precio: "", delivery: 0, total: 0 });
        setBusquedaProducto("");
    };

    const eliminarItem = (id) => setItemsAgregados(itemsAgregados.filter(i => i.id !== id));

    const handleFinalSubmit = async () => {
        if (!cabecera.cliente || itemsAgregados.length === 0) {
            alert("Información incompleta."); return;
        }
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem("token");
            const payload = { cabecera, detalles: itemsAgregados };
            const response = await fetch(apiBase, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (response.ok) {
                setNotification({ show: true, message: "Venta registrada.", type: "success" });
                setItemsAgregados([]);
                setCabecera({ ...cabecera, id_cliente: "", cliente: "", tipo_comprobante: "", comprobante: "", region: "", distrito: "", forma_pago: "", salida: "" });
                setBusquedaCliente("");
                setSelectedRegionId("");
            } else {
                setNotification({ show: true, message: result.error || "Error.", type: "error" });
            }
        } catch (e) {
            setNotification({ show: true, message: "Error de red.", type: "error" });
        } finally { setIsSubmitting(false); }
    };

    const totalGeneral = itemsAgregados.reduce((a, b) => a + b.total, 0);

    return (
        <div className="flex h-screen overflow-hidden bg-[#F7FAFF]">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${sidebarOpen ? "lg:ml-60 ml-0" : "ml-0"}`}>
                <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

                <main className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    <div className="max-w-[100%] mx-auto space-y-4">

                        {/* Botón Volver */}
                        <button
                            onClick={() => router.push("/marketing")}
                            className="flex items-center space-x-1.5 px-4 py-2 bg-[#002855] text-white rounded-lg font-bold hover:bg-[#001D3D] transition-all duration-200 shadow-md text-sm group"
                            style={{ fontFamily: 'var(--font-poppins)' }}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                            <span>Volver a Marketing</span>
                        </button>

                        {/* Contenedor Principal Blanco */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 space-y-10">

                            {/* Cabecera Título Principal */}
                            <div className="flex flex-col items-center space-y-2">
                                <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>Registro de Ventas Online</h1>
                                <div className="w-24 h-1 bg-yellow-400 rounded-full"></div>
                            </div>

                            {notification.show && (
                                <div className={`p-4 rounded-xl flex items-center space-x-3 ${notification.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                                    <span className="text-sm font-bold">{notification.message}</span>
                                </div>
                            )}

                            {/* SECCIÓN CABECERA */}
                            <div className="space-y-6">
                                <div className="flex items-center space-x-3 pb-2 border-b-2 border-yellow-400/30">
                                    <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center text-white">
                                        <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-lg font-bold text-[#002855]" style={{ fontFamily: 'var(--font-poppins)' }}>Ventas (Cabecera del Pedido)</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* FECHA */}
                                    <div className="space-y-2">
                                        <label className="flex items-center text-[10px] font-black text-[#002D5A] uppercase tracking-widest">FECHA</label>
                                        <input type="text" readOnly value={new Date().toLocaleDateString()} className="w-full px-5 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-semibold text-gray-500" />
                                    </div>
                                    {/* ASESOR */}
                                    <div className="space-y-2">
                                        <label className="flex items-center text-[10px] font-black text-[#002D5A] uppercase tracking-widest">ASESOR</label>
                                        <div className="relative">
                                            <select
                                                value={cabecera.asesor}
                                                onChange={(e) => setCabecera({ ...cabecera, asesor: e.target.value })}
                                                className="w-full px-5 py-3 bg-white border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-semibold text-gray-900 shadow-sm appearance-none"
                                            >
                                                <option value="DHILSEN">DHILSEN</option>
                                                <option value="ALVARO">ALVARO</option>
                                            </select>
                                            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                        </div>
                                    </div>
                                    {/* CLIENTE */}
                                    <div className="space-y-2 relative" ref={clienteRef}>
                                        <label className="flex items-center text-[10px] font-black text-[#002D5A] uppercase tracking-widest">CLIENTE</label>
                                        <input
                                            type="text"
                                            placeholder="Buscar cliente..."
                                            value={busquedaCliente}
                                            onChange={(e) => { setBusquedaCliente(e.target.value); setMostrarSugerenciasCliente(true); }}
                                            className="w-full px-5 py-3 bg-white border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-semibold text-gray-900 shadow-sm"
                                        />
                                        {mostrarSugerenciasCliente && busquedaCliente.length > 0 && (
                                            <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-2xl shadow-xl max-h-48 overflow-y-auto">
                                                {clientes.filter(c => c.CLIENTE.toLowerCase().includes(busquedaCliente.toLowerCase())).map(cli => (
                                                    <div key={cli.ID_CLIENTE} onClick={() => handleClienteSelect(cli)} className="px-5 py-3 hover:bg-blue-50 cursor-pointer text-sm font-semibold text-gray-700 border-b border-gray-50 last:border-0">
                                                        {cli.CLIENTE}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* COMPROBANTE SELECT + INPUT */}
                                    <div className="space-y-2">
                                        <label className="flex items-center text-[10px] font-black text-[#002D5A] uppercase tracking-widest">COMPROBANTE</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="relative">
                                                <select
                                                    value={cabecera.tipo_comprobante}
                                                    onChange={handleTipoComprobanteChange}
                                                    className="w-full px-3 py-3 bg-white border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none text-xs font-bold text-gray-900 shadow-sm appearance-none"
                                                >
                                                    <option value="">TIPO</option>
                                                    <option value="PROFORMA">PROFORMA</option>
                                                    <option value="FACTURA">FACTURA</option>
                                                    <option value="BOLETA">BOLETA</option>
                                                </select>
                                                <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-400">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                                </div>
                                            </div>
                                            <input type="text" value={cabecera.comprobante} onChange={(e) => setCabecera({ ...cabecera, comprobante: e.target.value })} className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-bold text-gray-900 shadow-sm" />
                                        </div>
                                    </div>

                                    {/* SALIDA DE PEDIDO */}
                                    <div className="space-y-2">
                                        <label className="flex items-center text-[10px] font-black text-[#002D5A] uppercase tracking-widest">SALIDA DE PEDIDO</label>
                                        <div className="relative">
                                            <select value={cabecera.salida} onChange={(e) => setCabecera({ ...cabecera, salida: e.target.value })} className="w-full px-5 py-3 bg-white border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-semibold text-gray-900 shadow-sm appearance-none">
                                                <option value="">Seleccione...</option>
                                                <option value="CALLAO">CALLAO</option>
                                                <option value="CHORRILLOS">CHORRILLOS</option>
                                            </select>
                                            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                        </div>
                                    </div>

                                    {/* REGIÓN */}
                                    <div className="space-y-2">
                                        <label className="flex items-center text-[10px] font-black text-[#002D5A] uppercase tracking-widest">REGIÓN</label>
                                        <div className="relative">
                                            <select value={selectedRegionId} onChange={handleRegionChange} className="w-full px-5 py-3 bg-white border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-semibold text-gray-900 shadow-sm appearance-none">
                                                <option value="">Seleccione...</option>
                                                {regiones.map(r => <option key={r.ID_REGION || r.id} value={r.ID_REGION || r.id}>{r.REGION || r.nombre}</option>)}
                                            </select>
                                            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                        </div>
                                    </div>

                                    {/* DISTRITO */}
                                    <div className="space-y-2">
                                        <label className="flex items-center text-[10px] font-black text-[#002D5A] uppercase tracking-widest">DISTRITO</label>
                                        <div className="relative">
                                            <select value={cabecera.distrito} onChange={(e) => setCabecera({ ...cabecera, distrito: e.target.value })} className="w-full px-5 py-3 bg-white border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-semibold text-gray-900 shadow-sm appearance-none disabled:bg-gray-50">
                                                <option value="">Seleccione...</option>
                                                {distritos.map(d => <option key={d.ID_DISTRITO || d.id} value={d.DISTRITO || d.nombre}>{d.DISTRITO || d.nombre}</option>)}
                                            </select>
                                            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                        </div>
                                    </div>

                                    {/* FORMA DE PAGO */}
                                    <div className="space-y-2">
                                        <label className="flex items-center text-[10px] font-black text-[#002D5A] uppercase tracking-widest">FORMA DE PAGO</label>
                                        <div className="relative">
                                            <select value={cabecera.forma_pago} onChange={(e) => setCabecera({ ...cabecera, forma_pago: e.target.value })} className="w-full px-5 py-3 bg-white border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-semibold text-gray-900 shadow-sm appearance-none">
                                                <option value="">Seleccione...</option>
                                                <option value="TRANSFERENCIA BCP">TRANSFERENCIA BCP</option>
                                                <option value="YAPE">YAPE</option>
                                                <option value="EFECTIVO">EFECTIVO</option>
                                            </select>
                                            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* SECCIÓN DETALLE DE PRODUCTOS */}
                            <div className="space-y-6 pt-4">
                                <div className="flex items-center space-x-3 pb-2 border-b-2 border-yellow-400/30">
                                    <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center text-white">
                                        <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                    </div>
                                    <h2 className="text-lg font-bold text-[#002855]" style={{ fontFamily: 'var(--font-poppins)' }}>Detalle de Productos</h2>
                                </div>

                                <div className="bg-slate-50 border-2 border-gray-100 p-8 rounded-3xl space-y-8 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400"></div>
                                    <h3 className="text-[11px] font-black text-[#002D5A] flex items-center tracking-widest uppercase">
                                        <span className="w-4 h-4 bg-yellow-400 text-gray-900 rounded-full flex items-center justify-center mr-2 text-[10px]">+</span>
                                        AGREGAR NUEVO PRODUCTO
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-[#002D5A] uppercase tracking-widest">Līnea de Pedido</label>
                                            <select value={detalle.linea} onChange={(e) => setDetalle({ ...detalle, linea: e.target.value })} className="w-full px-5 py-3 bg-white border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-semibold">
                                                <option value="ZEUS SAFETY">ZEUS SAFETY</option>
                                                <option value="OTROS">OTROS</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-[#002D5A] uppercase tracking-widest">Canal de Venta</label>
                                            <select value={detalle.canal} onChange={(e) => setDetalle({ ...detalle, canal: e.target.value })} className="w-full px-5 py-3 bg-white border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-semibold">
                                                <option value="FACEBOOK ADS">FACEBOOK ADS</option>
                                                <option value="INSTRAGRAM">INSTAGRAM</option>
                                                <option value="TIKTOK">TIKTOK</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-[#002D5A] uppercase tracking-widest">Clasificación</label>
                                            <select value={detalle.clasificacion} onChange={(e) => setDetalle({ ...detalle, clasificacion: e.target.value })} className="w-full px-5 py-3 bg-white border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-semibold">
                                                <option value="ONLINE">ONLINE</option>
                                                <option value="PROVINCIA">PROVINCIA</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2 relative" ref={productoRef}>
                                            <label className="text-[10px] font-black text-[#002D5A] uppercase tracking-widest">Producto</label>
                                            <input
                                                type="text"
                                                placeholder="Nombre del producto..."
                                                value={busquedaProducto}
                                                onChange={(e) => { setBusquedaProducto(e.target.value); setMostrarSugerenciasProducto(true); }}
                                                className="w-full px-5 py-3 bg-white border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-semibold"
                                            />
                                            {mostrarSugerenciasProducto && busquedaProducto.length > 0 && (
                                                <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-2xl shadow-xl max-h-48 overflow-y-auto">
                                                    {productos.filter(p => (p.NOMBRE || p.nombre || "").toLowerCase().includes(busquedaProducto.toLowerCase())).map((prod, idx) => (
                                                        <div key={idx} onClick={() => handleProductoSelect(prod)} className="px-5 py-3 hover:bg-blue-50 cursor-pointer text-sm font-bold text-gray-700 border-b border-gray-50 last:border-0">
                                                            {prod.NOMBRE || prod.nombre}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-[#002D5A] uppercase tracking-widest">Código</label>
                                            <input type="text" readOnly value={detalle.codigo} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl text-xs font-bold text-gray-400" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-[#002D5A] uppercase tracking-widest">Cantidad</label>
                                            <input type="number" value={detalle.cantidad} onChange={(e) => setDetalle({ ...detalle, cantidad: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-bold" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-[#002D5A] uppercase tracking-widest">Medida</label>
                                            <select value={detalle.unidad} onChange={(e) => setDetalle({ ...detalle, unidad: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none text-xs font-bold">
                                                <option value="UNIDADES">UNIDADES</option>
                                                <option value="PARES">PARES</option>
                                                <option value="METROS">METROS</option>
                                                <option value="DOCENAS">DOCENAS</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-[#002D5A] uppercase tracking-widest">Precio Venta</label>
                                            <input type="number" value={detalle.precio} onChange={(e) => setDetalle({ ...detalle, precio: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-bold" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-[#002D5A] uppercase tracking-widest">Delivery</label>
                                            <input type="number" value={detalle.delivery} onChange={(e) => setDetalle({ ...detalle, delivery: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-bold" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-[#002D5A] uppercase tracking-widest">Total</label>
                                            <input type="text" readOnly value={detalle.total.toFixed(2)} className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-2xl text-sm font-black text-gray-700" />
                                        </div>
                                    </div>

                                    <button onClick={agregarItem} className="w-full py-4 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-black rounded-2xl transition-all shadow-lg text-xs uppercase tracking-widest flex items-center justify-center space-x-2">
                                        <span>+ AGREGAR A LA LISTA</span>
                                    </button>
                                </div>
                            </div>

                            {/* TABLA DE ITEMS AGREGADOS */}
                            <div className="overflow-hidden rounded-3xl border-2 border-slate-50 shadow-sm">
                                <table className="w-full text-left">
                                    <thead className="bg-[#002855] text-white uppercase text-[10px] font-black tracking-widest">
                                        <tr>
                                            <th className="px-6 py-4">N° Comprobante</th>
                                            <th className="px-6 py-4">Producto</th>
                                            <th className="px-6 py-4 text-center">Cantidad</th>
                                            <th className="px-6 py-4">Medida</th>
                                            <th className="px-6 py-4">Precio Venta</th>
                                            <th className="px-6 py-4">Total</th>
                                            <th className="px-6 py-4 text-center">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {itemsAgregados.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50 transition-colors bg-white">
                                                <td className="px-6 py-4 text-sm font-bold text-gray-600">{cabecera.comprobante}</td>
                                                <td className="px-6 py-4 text-sm font-black text-gray-800">{item.producto}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-gray-600 text-center">{item.cantidad}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-gray-600">{item.unidad}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-gray-600">S/ {parseFloat(item.precio).toFixed(2)}</td>
                                                <td className="px-6 py-4 text-sm font-black text-blue-700">S/ {item.total.toFixed(2)}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <button onClick={() => eliminarItem(item.id)} className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all mx-auto">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {itemsAgregados.length === 0 && (
                                            <tr>
                                                <td colSpan="7" className="px-6 py-12 text-center text-gray-400 font-bold italic text-sm">No hay ítems registrados</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* FOOTER DE TOTALES Y BOTONES FINAL */}
                            <div className="pt-6 border-t-2 border-gray-50 flex flex-col md:flex-row items-center justify-between gap-8">
                                <div className="flex flex-wrap gap-4">
                                    <button
                                        onClick={handleFinalSubmit}
                                        disabled={isSubmitting}
                                        className="px-12 py-4 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-black rounded-2xl transition-all shadow-xl shadow-yellow-400/20 flex items-center space-x-3 disabled:opacity-50 active:scale-95"
                                    >
                                        {isSubmitting ? <div className="w-5 h-5 border-4 border-gray-900/20 border-t-gray-900 rounded-full animate-spin"></div> : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                        )}
                                        <span className="text-sm uppercase tracking-widest">Registrar Venta</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setCabecera({ asesor: "DHILSEN", id_cliente: "", cliente: "", tipo_comprobante: "", comprobante: "", region: "", distrito: "", forma_pago: "", salida: "" });
                                            setItemsAgregados([]);
                                            setBusquedaCliente("");
                                            setSelectedRegionId("");
                                        }}
                                        className="px-10 py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-black rounded-2xl transition-all flex items-center space-x-2 text-sm uppercase tracking-widest"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                        <span>Limpiar Formulario</span>
                                    </button>
                                </div>

                                <div className="bg-slate-50 px-10 py-5 rounded-3xl border-2 border-gray-100 flex items-center space-x-10 shadow-sm">
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Total a Pagar</p>
                                        <p className="text-3xl font-black text-[#002855]">S/ {totalGeneral.toFixed(2)}</p>
                                    </div>
                                    <div className="w-px h-12 bg-gray-200"></div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Delivery Incl.</p>
                                        <p className="text-xl font-bold text-gray-400">S/ {itemsAgregados.reduce((a, b) => a + parseFloat(b.delivery || 0), 0).toFixed(2)}</p>
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
