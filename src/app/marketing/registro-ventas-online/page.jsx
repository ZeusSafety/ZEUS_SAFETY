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

    const isDistritoDisabled = !cabecera.region;

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
    const [montoDelivery, setMontoDelivery] = useState(0);
    const [editingItemId, setEditingItemId] = useState(null);
    const [editingItem, setEditingItem] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [busquedaProductoEdicion, setBusquedaProductoEdicion] = useState("");
    const [mostrarSugerenciasProductoEdicion, setMostrarSugerenciasProductoEdicion] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const productoEdicionRef = useRef(null);
    const dropdownRef = useRef(null);

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
            setCabecera(prev => ({ ...prev, asesor: user.nombre || "" }));
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
            
            // Para el dropdown de edición, verificar tanto el input como el dropdown
            if (productoEdicionRef.current && 
                !productoEdicionRef.current.contains(event.target) && 
                dropdownRef.current && 
                !dropdownRef.current.contains(event.target)) {
                setMostrarSugerenciasProductoEdicion(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (mostrarSugerenciasProductoEdicion && productoEdicionRef.current) {
            const updatePosition = () => {
                if (productoEdicionRef.current) {
                    const rect = productoEdicionRef.current.getBoundingClientRect();
                    setDropdownPosition({
                        top: rect.bottom + window.scrollY,
                        left: rect.left + window.scrollX,
                        width: rect.width
                    });
                }
            };
            
            updatePosition();
            // Solo actualizar posición cuando se muestra por primera vez o cuando cambia el tamaño de la ventana
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
            
            return () => {
                window.removeEventListener('scroll', updatePosition, true);
                window.removeEventListener('resize', updatePosition);
            };
        }
    }, [mostrarSugerenciasProductoEdicion]);

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
        if (tipo === "PROFORMA") p = "P ";
        else if (tipo === "FACTURA") p = "F ";
        else if (tipo === "BOLETA") p = "B ";
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
        setDetalle(prev => ({ ...prev, total: (cant * prec) }));
    }, [detalle.cantidad, detalle.precio]);

    const agregarItem = () => {
        if (!detalle.producto || !detalle.precio || !detalle.cantidad) {
            alert("Campos incompletos."); return;
        }
        setItemsAgregados([...itemsAgregados, {
            ...detalle,
            id: Date.now(),
            comprobante_item: cabecera.comprobante
        }]);
        setDetalle({ ...detalle, producto: "", codigo: "", cantidad: 1, precio: "", total: 0 });
        setBusquedaProducto("");
    };

    const iniciarEdicion = (item) => {
        setEditingItemId(item.id);
        // Asegurar que el código se mantenga al iniciar edición
        setEditingItem({ ...item, codigo: item.codigo || "" });
        setBusquedaProductoEdicion(item.producto || "");
        setMostrarSugerenciasProductoEdicion(false);
    };

    const handleProductoSelectEdicion = (prod) => {
        const nombreProducto = prod.NOMBRE || prod.nombre;
        const codigoProducto = prod.CODIGO || prod.codigo;
        
        setEditingItem(prev => ({ ...prev, producto: nombreProducto, codigo: codigoProducto }));
        setBusquedaProductoEdicion(nombreProducto);
        setMostrarSugerenciasProductoEdicion(false);
    };

    const cancelarEdicion = () => {
        setEditingItemId(null);
        setEditingItem(null);
        setBusquedaProductoEdicion("");
        setMostrarSugerenciasProductoEdicion(false);
    };

    const guardarEdicion = () => {
        if (!editingItem) return;
        
        // Validar campos requeridos
        if (!editingItem.producto || !editingItem.precio || !editingItem.cantidad) {
            alert("Campos incompletos.");
            return;
        }

        // Recalcular total
        const cantidad = parseFloat(editingItem.cantidad) || 0;
        const precio = parseFloat(editingItem.precio) || 0;
        const nuevoTotal = cantidad * precio;

        // Actualizar el item en la lista, asegurando que el código se mantenga
        setItemsAgregados(itemsAgregados.map(item => 
            item.id === editingItemId 
                ? { 
                    ...editingItem, 
                    total: nuevoTotal,
                    codigo: editingItem.codigo || item.codigo || "" // Mantener código existente si no se actualizó
                }
                : item
        ));

        // Limpiar estados de edición
        setEditingItemId(null);
        setEditingItem(null);
        setBusquedaProductoEdicion("");
        setMostrarSugerenciasProductoEdicion(false);
    };

    const confirmarEliminar = (id) => {
        setItemToDelete(id);
        setShowDeleteModal(true);
    };

    const eliminarItem = () => {
        if (itemToDelete) {
            setItemsAgregados(itemsAgregados.filter(i => i.id !== itemToDelete));
            setShowDeleteModal(false);
            setItemToDelete(null);
        }
    };

    const handleFinalSubmit = async () => {
        if (!cabecera.cliente || itemsAgregados.length === 0) {
            alert("Información incompleta."); return;
        }
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem("token");
            const detallesConDelivery = itemsAgregados.map((item, idx) => ({
                ...item,
                delivery: idx === 0 ? parseFloat(montoDelivery || 0) : 0
            }));

            const payload = { cabecera, detalles: detallesConDelivery };
            const response = await fetch(apiBase, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (response.ok) {
                setNotification({ show: true, message: "Venta registrada.", type: "success" });
                setItemsAgregados([]);
                setMontoDelivery(0);
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
        <div className="flex h-screen overflow-hidden" style={{ background: "#F7FAFF" }}>
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div
                className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${sidebarOpen ? "lg:ml-60 ml-0" : "ml-0"
                    }`}
            >
                <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

                <main className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    {/* Botón Volver */}
                    <button
                        onClick={() => router.push("/marketing")}
                        className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-lg font-medium hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm ripple-effect relative overflow-hidden text-sm group"
                        style={{ fontFamily: "var(--font-poppins)" }}
                    >
                        <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                        <span>Volver a Marketing</span>
                    </button>
                    <div className="max-w-6xl mx-auto space-y-4">

                        {/* Contenedor Principal Blanco */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 space-y-10">

                            {/* Header de la página */}
                            <div className="mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-gray-200">
                                <div className="flex items-center space-x-2 sm:space-x-3">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#002D5A] to-[#002D5A] rounded-xl flex items-center justify-center text-white shadow-sm">
                                        <svg
                                            className="w-5 h-5 sm:w-6 sm:h-6"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            strokeWidth={2.5}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                        </svg>
                                    </div>
                                    <div>
                                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                                            Registro de Ventas Online
                                        </h1>
                                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5" style={{ fontFamily: 'var(--font-poppins)' }}>
                                            Gestiona y procesa tus ventas digitales en el sistema.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {notification.show && (
                                <div className={`p-4 rounded-xl flex items-center space-x-3 ${notification.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                                    <span className="text-sm font-bold">{notification.message}</span>
                                </div>
                            )}



                            {/* ESTE ES EL NUEVO CONTENEDOR QUE AGREGA EL CUADRO GRIS DETRÁS */}
                            <div className="bg-slate-50 border-2 border-gray-100 p-8 rounded-3xl space-y-8 relative overflow-hidden">

                                {/* Subtítulo opcional para mantener simetría con el de abajo */}
                                <h3 className="text-[11px] font-black text-[#002855] flex items-center tracking-widest uppercase mb-4">
                                    <div className="w-5 h-5 bg-[#002855] text-white rounded-full flex items-center justify-center mr-2 text-[10px] font-bold">i</div>
                                    Ventas (Cabecera del Pedido)
                                </h3>

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
                                                <option value="Seleccione un asesor">Seleccione un asesor</option>
                                                <option value="ALVARO">ALVARO</option>
                                                <option value="EVELYN">EVELYN</option>
                                                <option value="HERVIN">HERVIN</option>
                                                <option value="KIMBERLY">KIMBERLY</option>
                                                <option value="ZEUS">ZEUS</option>
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
                                        <label className="flex items-center text-[10px] font-black text-[#002D5A] uppercase tracking-widest">
                                            COMPROBANTE
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {/* Contenedor del Select */}
                                            <div className="relative group">
                                                <select
                                                    value={cabecera.tipo_comprobante}
                                                    onChange={handleTipoComprobanteChange}
                                                    /* 1. appearance-none quita la flecha nativa en la mayoría de casos */
                                                    className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none text-xs font-bold text-gray-900 shadow-sm appearance-none cursor-pointer pr-10"
                                                    /* 2. Estilo inline para asegurar que desaparezca la flecha nativa en todos los navegadores */
                                                    style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                                                >
                                                    <option value="TIPO">TIPO</option>
                                                    <option value="PROFORMA">PROFORMA</option>
                                                    <option value="FACTURA">FACTURA</option>
                                                    <option value="BOLETA">BOLETA</option>
                                                </select>

                                                {/* 3. TU FLECHA PERSONALIZADA (Única) */}
                                                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-[#002855]">
                                                    <svg
                                                        className="w-4 h-4"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                        strokeWidth={3}
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>
                                            </div>

                                            {/* Input de Número de Comprobante */}
                                            <input
                                                type="text"
                                                value={cabecera.comprobante}
                                                onChange={(e) => setCabecera({ ...cabecera, comprobante: e.target.value })}
                                                className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-2xl focus:border-blue-400 outline-none text-sm font-bold text-gray-900 shadow-sm transition-all"
                                                placeholder="Número..."
                                            />
                                        </div>
                                    </div>

                                    {/* SALIDA DE PEDIDO */}
                                    <div className="space-y-2">
                                        <label className="flex items-center text-[10px] font-black text-[#002D5A] uppercase tracking-widest">SALIDA DE PEDIDO</label>
                                        <div className="relative">
                                            <select value={cabecera.salida} onChange={(e) => setCabecera({ ...cabecera, salida: e.target.value })} className="w-full px-5 py-3 bg-white border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-semibold text-gray-900 shadow-sm appearance-none">
                                                <option value="">Seleccione...</option>
                                                <option value="CALLAO">CALLAO</option>
                                                <option value="MALVINAS">MALVINAS</option>
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
                                            <select
                                                value={cabecera.distrito}
                                                onChange={(e) => setCabecera({ ...cabecera, distrito: e.target.value })}
                                                disabled={isDistritoDisabled}
                                                className="w-full px-5 py-3 bg-white border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-semibold text-gray-900 shadow-sm appearance-none disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                                            >
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
                                                <option value="YAPE">YAPE</option>
                                                <option value="PLIN">PLIN</option>
                                                <option value="EFECTIVO">EFECTIVO</option>
                                                <option value="TRANSFERENCIA BCP">TRANSFERENCIA BCP</option>
                                                <option value="TRANSFERENCIA BBVA">TRANSFERENCIA BBVA</option>
                                                <option value="TRANSFERENCIA INTERBANK">TRANSFERENCIA INTERBANK</option>
                                            </select>
                                            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>




                            <div className="bg-slate-50 border-2 border-gray-100 p-8 rounded-3xl space-y-8 relative overflow-hidden">
                                <h3 className="text-[11px] font-black text-[#002855] flex items-center tracking-widest uppercase mb-4">
                                    <div className="w-5 h-5 bg-[#002855] text-white rounded-full flex items-center justify-center mr-2 text-[10px] font-bold">+</div>
                                    Detalle de Productos
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[#002855] uppercase tracking-widest">Línea de Pedido</label>
                                        <select value={detalle.linea} onChange={(e) => setDetalle({ ...detalle, linea: e.target.value })} className="w-full px-5 py-3 bg-white border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-bold text-[#002855]">
                                            <option value="Seleccione una linea">Seleccione una linea</option>
                                            <option value="ZEUS SAFETY">ZEUS SAFETY</option>
                                            <option value="ZEUS ELECTRIC">ZEUS ELECTRIC</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[#002855] uppercase tracking-widest">Canal de Venta</label>
                                        <select value={detalle.canal} onChange={(e) => setDetalle({ ...detalle, canal: e.target.value })} className="w-full px-5 py-3 bg-white border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-bold text-[#002855]">
                                            <option value="Seleccione un Canal de Venta">Seleccione un Canal de Venta</option>
                                            <option value="FACEBOOK">FACEBOOK</option>
                                            <option value="INSTRAGRAM">INSTAGRAM</option>
                                            <option value="LLAMADA">LLAMADA</option>
                                            <option value="META ADS">META ADS</option>
                                            <option value="TIKTOK">TIKTOK</option>
                                            <option value="WHATSAPP">WHATSAPP</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[#002855] uppercase tracking-widest">Clasificación</label>
                                        <select value={detalle.clasificacion} onChange={(e) => setDetalle({ ...detalle, clasificacion: e.target.value })} className="w-full px-5 py-3 bg-white border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-bold text-[#002855]">
                                            <option value="MALVINAS">MALVINAS</option>
                                            <option value="FERRETERIA">FERRETERIA</option>
                                            <option value="PROVINCIA">PROVINCIA</option>
                                            <option value="ONLINE">ONLINE</option>
                                            <option value="CONSTRUCTORA">CONSTRUCTORA</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2 relative" ref={productoRef}>
                                        <label className="text-[10px] font-black text-[#002855] uppercase tracking-widest">Producto</label>
                                        <input
                                            type="text"
                                            placeholder="Nombre del producto..."
                                            value={busquedaProducto}
                                            onChange={(e) => { setBusquedaProducto(e.target.value); setMostrarSugerenciasProducto(true); }}
                                            className="w-full px-5 py-3 bg-white border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-bold text-[#002855]"
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
                                        <label className="text-[10px] font-black text-[#002855] uppercase tracking-widest">Código</label>
                                        <input type="text" readOnly value={detalle.codigo} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl text-xs font-bold text-[#002855] outline-none" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[#002855] uppercase tracking-widest">Cantidad</label>
                                        <input type="number" value={detalle.cantidad} onChange={(e) => setDetalle({ ...detalle, cantidad: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-bold text-[#002855]" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[#002855] uppercase tracking-widest">Medida</label>
                                        <select value={detalle.unidad} onChange={(e) => setDetalle({ ...detalle, unidad: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none text-xs font-bold text-[#002855]">
                                            <option value="Seleccione una medida">Seleccione una medida</option>
                                            <option value="DOCENAS">DOCENAS</option>
                                            <option value="METROS">METROS</option>
                                            <option value="PAQUETES">PAQUETES</option>
                                            <option value="PARES">PARES</option>
                                            <option value="ROLLOS">ROLLOS</option>
                                            <option value="UNIDADES">UNIDADES</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[#002855] uppercase tracking-widest">Precio Venta</label>
                                        <input type="number" value={detalle.precio} onChange={(e) => setDetalle({ ...detalle, precio: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-bold text-[#002855]" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[#002855] uppercase tracking-widest">Delivery</label>
                                        <input
                                            type="number"
                                            value={montoDelivery}
                                            onChange={(e) => setMontoDelivery(e.target.value)}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-bold text-[#002855]"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[#002D5A] uppercase tracking-widest">Total Producto</label>
                                        <input type="text" readOnly value={detalle.total.toFixed(2)} className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-2xl text-sm font-black text-gray-700" />
                                    </div>
                                </div>

                                <button onClick={agregarItem} className="w-full py-4 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-black rounded-2xl transition-all shadow-lg text-xs uppercase tracking-widest flex items-center justify-center space-x-2">
                                    <span>+ AGREGAR A LA LISTA</span>
                                </button>
                            </div>


                            {/* TABLA DE ITEMS AGREGADOS */}
                            <div className="rounded-3xl border-2 border-slate-50 shadow-sm overflow-visible">
                                <div className="overflow-x-auto">
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
                                        {itemsAgregados.map((item) => {
                                            const isEditing = editingItemId === item.id;
                                            const displayItem = isEditing ? editingItem : item;
                                            
                                            return (
                                                <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${isEditing ? 'bg-blue-50' : 'bg-white'}`}>
                                                    {/* N° Comprobante */}
                                                    <td className="px-6 py-4">
                                                        {isEditing ? (
                                                            <input
                                                                type="text"
                                                                value={displayItem.comprobante_item || ''}
                                                                onChange={(e) => setEditingItem({ ...editingItem, comprobante_item: e.target.value })}
                                                                className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-sm font-bold text-gray-900 focus:border-blue-500 outline-none"
                                                            />
                                                        ) : (
                                                            <span className="text-sm font-bold text-gray-600">{item.comprobante_item || cabecera.comprobante}</span>
                                                        )}
                                                    </td>
                                                    
                                                    {/* Producto */}
                                                    <td className="px-6 py-4">
                                                        {isEditing ? (
                                                            <div className="relative" ref={productoEdicionRef}>
                                                                <input
                                                                    type="text"
                                                                    placeholder="Buscar producto..."
                                                                    value={busquedaProductoEdicion}
                                                                    onChange={(e) => {
                                                                        const nuevoValor = e.target.value;
                                                                        setBusquedaProductoEdicion(nuevoValor);
                                                                        // Mantener el código existente cuando se escribe manualmente
                                                                        setEditingItem(prev => ({ ...prev, producto: nuevoValor }));
                                                                        setMostrarSugerenciasProductoEdicion(true);
                                                                    }}
                                                                    className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-sm font-bold text-gray-900 focus:border-blue-500 outline-none"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm font-black text-gray-800">{item.producto}</span>
                                                        )}
                                                    </td>
                                                    
                                                    {/* Cantidad */}
                                                    <td className="px-6 py-4 text-center">
                                                        {isEditing ? (
                                                            <input
                                                                type="number"
                                                                value={displayItem.cantidad || ''}
                                                                onChange={(e) => {
                                                                    const nuevaCantidad = e.target.value;
                                                                    const precio = parseFloat(editingItem.precio) || 0;
                                                                    const nuevoTotal = parseFloat(nuevaCantidad) * precio;
                                                                    setEditingItem({ ...editingItem, cantidad: nuevaCantidad, total: nuevoTotal });
                                                                }}
                                                                className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-sm font-bold text-gray-900 text-center focus:border-blue-500 outline-none"
                                                            />
                                                        ) : (
                                                            <span className="text-sm font-bold text-gray-600">{item.cantidad}</span>
                                                        )}
                                                    </td>
                                                    
                                                    {/* Medida */}
                                                    <td className="px-6 py-4">
                                                        {isEditing ? (
                                                            <select
                                                                value={displayItem.unidad || ''}
                                                                onChange={(e) => setEditingItem({ ...editingItem, unidad: e.target.value })}
                                                                className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-sm font-bold text-gray-900 focus:border-blue-500 outline-none"
                                                            >
                                                                <option value="DOCENAS">DOCENAS</option>
                                                                <option value="METROS">METROS</option>
                                                                <option value="PAQUETES">PAQUETES</option>
                                                                <option value="PARES">PARES</option>
                                                                <option value="ROLLOS">ROLLOS</option>
                                                                <option value="UNIDADES">UNIDADES</option>
                                                            </select>
                                                        ) : (
                                                            <span className="text-sm font-bold text-gray-600">{item.unidad}</span>
                                                        )}
                                                    </td>
                                                    
                                                    {/* Precio Venta */}
                                                    <td className="px-6 py-4">
                                                        {isEditing ? (
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={displayItem.precio || ''}
                                                                onChange={(e) => {
                                                                    const nuevoPrecio = e.target.value;
                                                                    const cantidad = parseFloat(editingItem.cantidad) || 0;
                                                                    const nuevoTotal = cantidad * parseFloat(nuevoPrecio);
                                                                    setEditingItem({ ...editingItem, precio: nuevoPrecio, total: nuevoTotal });
                                                                }}
                                                                className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-sm font-bold text-gray-900 focus:border-blue-500 outline-none"
                                                            />
                                                        ) : (
                                                            <span className="text-sm font-bold text-gray-600">S/ {parseFloat(item.precio).toFixed(2)}</span>
                                                        )}
                                                    </td>
                                                    
                                                    {/* Total */}
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-black text-blue-700">S/ {displayItem.total.toFixed(2)}</span>
                                                    </td>
                                                    
                                                    {/* Acciones */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-center gap-2">
                                                            {isEditing ? (
                                                                <>
                                                                    <button
                                                                        onClick={guardarEdicion}
                                                                        className="w-8 h-8 flex items-center justify-center bg-green-50 text-green-600 hover:bg-green-500 hover:text-white rounded-lg transition-all"
                                                                        title="Guardar cambios"
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                        </svg>
                                                                    </button>
                                                                    <button
                                                                        onClick={cancelarEdicion}
                                                                        className="w-8 h-8 flex items-center justify-center bg-gray-50 text-gray-600 hover:bg-gray-500 hover:text-white rounded-lg transition-all"
                                                                        title="Cancelar edición"
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                        </svg>
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <button
                                                                        onClick={() => iniciarEdicion(item)}
                                                                        className="w-8 h-8 flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white rounded-lg transition-all"
                                                                        title="Editar"
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                        </svg>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => confirmarEliminar(item.id)}
                                                                        className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                                                                        title="Eliminar"
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                        </svg>
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {itemsAgregados.length === 0 && (
                                            <tr>
                                                <td colSpan="7" className="px-6 py-12 text-center text-gray-400 font-bold italic text-sm">No hay ítems registrados</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                                </div>
                            </div>

                            {/* FOOTER DE TOTALES Y BOTONES FINAL */}
                            <div className="pt-6 border-t-2 border-gray-50 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
                                    <button
                                        onClick={handleFinalSubmit}
                                        disabled={isSubmitting}
                                        className="px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-black rounded-xl transition-all shadow-lg shadow-yellow-400/20 flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-95"
                                    >
                                        {isSubmitting ? (
                                            <div className="w-4 h-4 border-3 border-gray-900/20 border-t-gray-900 rounded-full animate-spin"></div>
                                        ) : (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                        <span className="text-xs uppercase tracking-wider">Registrar Venta</span>
                                    </button>

                                    <button
                                        onClick={() => {
                                            setCabecera({ asesor: "", id_cliente: "", cliente: "", tipo_comprobante: "", comprobante: "", region: "", distrito: "", forma_pago: "", salida: "" });
                                            setItemsAgregados([]);
                                            setBusquedaCliente("");
                                            setSelectedRegionId("");
                                        }}
                                        className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-black rounded-xl transition-all flex items-center justify-center space-x-2 text-xs uppercase tracking-wider"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        <span>Limpiar</span>
                                    </button>
                                </div>

                                <div className="bg-slate-50 px-8 py-3 rounded-2xl border-2 border-gray-100 flex items-center space-x-12 shadow-sm">
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.1em] mb-0.5">SUBTOTAL PRODUCTOS</p>
                                        <p className="text-xl font-black text-[#002855]">S/ {totalGeneral.toFixed(2)}</p>
                                    </div>

                                    <div className="w-px h-10 bg-gray-200"></div>

                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.1em] mb-0.5">Monto Delivery</p>
                                        <p className="text-lg font-bold text-gray-400">S/ {parseFloat(montoDelivery || 0).toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </main>
            </div>

            {/* Dropdown de Productos en Edición - Renderizado fuera de la tabla */}
            {editingItemId && mostrarSugerenciasProductoEdicion && busquedaProductoEdicion.length > 0 && productoEdicionRef.current && dropdownPosition.width > 0 && (
                <div 
                    ref={dropdownRef}
                    className="fixed z-[9999] bg-white border-2 border-blue-300 rounded-lg shadow-2xl max-h-48 overflow-y-auto"
                    style={{
                        top: `${dropdownPosition.top}px`,
                        left: `${dropdownPosition.left}px`,
                        width: `${dropdownPosition.width}px`,
                        position: 'fixed'
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    {productos.filter(p => (p.NOMBRE || p.nombre || "").toLowerCase().includes(busquedaProductoEdicion.toLowerCase())).map((prod, idx) => (
                        <div 
                            key={idx} 
                            onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleProductoSelectEdicion(prod);
                            }}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleProductoSelectEdicion(prod);
                            }}
                            className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm font-bold text-gray-700 border-b border-gray-50 last:border-0 transition-colors"
                        >
                            {prod.NOMBRE || prod.nombre}
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de Confirmación de Eliminación */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}>
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/60 bg-gradient-to-r from-red-50 to-white">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center text-white shadow-sm">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                                    ¿Estás seguro de eliminar?
                                </h2>
                            </div>
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setItemToDelete(null);
                                }}
                                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        {/* Contenido */}
                        <div className="p-6">
                            <p className="text-sm text-gray-600 mb-6" style={{ fontFamily: 'var(--font-poppins)' }}>
                                Esta acción no se puede deshacer. El ítem será eliminado permanentemente de la lista.
                            </p>
                            
                            {/* Botones */}
                            <div className="flex gap-4">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setItemToDelete(null);
                                    }}
                                    className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all"
                                    style={{ fontFamily: 'var(--font-poppins)' }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={eliminarItem}
                                    className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all"
                                    style={{ fontFamily: 'var(--font-poppins)' }}
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
