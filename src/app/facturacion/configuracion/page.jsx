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
        className={`w-full px-4 py-2.5 border-2 rounded-lg transition-all duration-200 text-sm flex items-center justify-between ${disabled
          ? 'border-gray-300 bg-gray-100 text-gray-600 cursor-not-allowed'
          : `border-gray-300 bg-white text-gray-900 hover:border-gray-400 focus:ring-2 focus:ring-[#002D5A] focus:border-[#002D5A] ${isOpen ? 'ring-2 ring-[#002D5A] border-[#002D5A]' : ''
          }`
          }`}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`w-5 h-5 transition-transform duration-200 ${disabled
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
          className={`absolute z-50 w-full bg-white shadow-xl overflow-hidden ${openUpward ? 'bottom-full mb-2' : 'top-full mt-2'
            }`}
          style={{
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-1.5 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full text-left px-4 py-3 transition-all duration-150 ${value === option.value
                  ? 'bg-[#002D5A]/10 text-[#002D5A] font-semibold'
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
  const API_URL = "https://productoscrud-2946605267.us-central1.run.app";

  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: "", type: "info" });

  // Listas de datos
  const [asesores, setAsesores] = useState([]);
  const [formasPago, setFormasPago] = useState([]);
  const [lugares, setLugares] = useState([]);

  // Paginación Lugares
  const [currentPageLugares, setCurrentPageLugares] = useState(1);
  const elementosPorPaginaLugares = 5;

  // Modales
  const [isAsesorModalOpen, setIsAsesorModalOpen] = useState(false);
  const [isPagoModalOpen, setIsPagoModalOpen] = useState(false);
  const [isLugarModalOpen, setIsLugarModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Forms
  const [asesorForm, setAsesorForm] = useState({ nombre: "", estado: "1" });
  const [pagoForm, setPagoForm] = useState({ nombre: "", estado: "1" });
  const [lugarForm, setLugarForm] = useState({ nombre: "", tipo: "" });
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: "", tipo: "" });

  // Edición y Eliminación
  const [editingId, setEditingId] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  const opcionesTipoCliente = [
    { value: "1", label: "EMPRESA" },
    { value: "2", label: "PERSONA" },
  ];

  const opcionesEstado = [
    { value: "1", label: "Activo" },
    { value: "0", label: "Inactivo" },
  ];

  const opcionesTipoLugar = [
    { value: "Centro comercial", label: "Centro comercial" },
    { value: "Provincia", label: "Provincia" },
    { value: "Avenida", label: "Avenida" },
    { value: "Ciudad", label: "Ciudad" },
    { value: "Distrito", label: "Distrito" },
  ];

  const showNotify = (message, type = "info") => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: "", type: "info" }), 3000);
  };

  const cargarConfiguraciones = async () => {
    try {
      const response = await fetch(`${API_URL}?metodo=configuracion`);
      if (!response.ok) throw new Error("Error al cargar configuraciones");
      const data = await response.json();
      setAsesores(data.filter(item => item.CATEGORIA === 'ASESOR'));
      setFormasPago(data.filter(item => item.CATEGORIA === 'FORMA_PAGO'));
    } catch (error) {
      console.error(error);
      showNotify("Error al cargar configuraciones", "error");
    }
  };

  const cargarLugares = async () => {
    try {
      const response = await fetch(`${API_URL}?metodo=lugar_configuracion`);
      if (!response.ok) throw new Error("Error al cargar lugares");
      const data = await response.json();
      setLugares(data);
    } catch (error) {
      console.error(error);
      showNotify("Error al cargar lugares", "error");
    }
  };

  const inicializarDatos = async () => {
    setIsFetching(true);
    await Promise.all([cargarConfiguraciones(), cargarLugares()]);
    setIsFetching(false);
  };

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

  useEffect(() => {
    if (user) {
      inicializarDatos();
    }
  }, [user]);

  const handleClienteChange = (e) => {
    const { name, value } = e.target;
    setNuevoCliente((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const registrarCliente = async () => {
    if (!nuevoCliente.nombre || !nuevoCliente.tipo) {
      showNotify("Todos los campos son obligatorios", "error");
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch(`${API_URL}?metodo=configuracion_cliente`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente: nuevoCliente.nombre,
          tipo_cliente: nuevoCliente.tipo
        })
      });

      if (!response.ok) throw new Error("Error al registrar cliente");

      showNotify("Cliente registrado correctamente", "success");
      setNuevoCliente({ nombre: "", tipo: "" });
    } catch (error) {
      console.error(error);
      showNotify("Error al registrar cliente", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // --- CRUD ASESORES ---
  const handleNuevoAsesor = () => {
    setAsesorForm({ nombre: "", estado: "1" });
    setEditingId(null);
    setIsAsesorModalOpen(true);
  };

  const editarAsesor = (asesor) => {
    setAsesorForm({ nombre: asesor.NOMBRE, estado: asesor.ESTADO });
    setEditingId(asesor.ID);
    setIsAsesorModalOpen(true);
  };

  const guardarAsesor = async (e) => {
    e.preventDefault();
    if (!asesorForm.nombre) return showNotify("El nombre es obligatorio", "error");

    try {
      setIsSaving(true);
      const url = editingId ? `${API_URL}?metodo=configuracion_edit` : `${API_URL}?metodo=configuracion`;
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId
        ? { id: editingId, nombre: asesorForm.nombre, estado: asesorForm.estado }
        : { nombre: asesorForm.nombre, categoria: 'ASESOR' };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) throw new Error("Error al guardar asesor");

      showNotify(editingId ? "Asesor actualizado" : "Asesor creado", "success");
      setIsAsesorModalOpen(false);
      cargarConfiguraciones();
    } catch (error) {
      console.error(error);
      showNotify("Error al guardar asesor", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // --- CRUD FORMAS DE PAGO ---
  const handleNuevaFormaPago = () => {
    setPagoForm({ nombre: "", estado: "1" });
    setEditingId(null);
    setIsPagoModalOpen(true);
  };

  const editarFormaPago = (forma) => {
    setPagoForm({ nombre: forma.NOMBRE, estado: forma.ESTADO });
    setEditingId(forma.ID);
    setIsPagoModalOpen(true);
  };

  const guardarFormaPago = async (e) => {
    e.preventDefault();
    if (!pagoForm.nombre) return showNotify("El nombre es obligatorio", "error");

    try {
      setIsSaving(true);
      const url = editingId ? `${API_URL}?metodo=configuracion_edit` : `${API_URL}?metodo=configuracion`;
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId
        ? { id: editingId, nombre: pagoForm.nombre, estado: pagoForm.estado }
        : { nombre: pagoForm.nombre, categoria: 'FORMA_PAGO' };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) throw new Error("Error al guardar forma de pago");

      showNotify(editingId ? "Forma de pago actualizada" : "Forma de pago creada", "success");
      setIsPagoModalOpen(false);
      cargarConfiguraciones();
    } catch (error) {
      console.error(error);
      showNotify("Error al guardar forma de pago", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // --- CRUD LUGARES ---
  const handleNuevoLugar = () => {
    setLugarForm({ nombre: "", tipo: "" });
    setEditingId(null);
    setIsLugarModalOpen(true);
  };

  const editarLugar = (lugar) => {
    setLugarForm({ nombre: lugar.LUGAR, tipo: lugar.TIPO });
    setEditingId(lugar.ID);
    setIsLugarModalOpen(true);
  };

  const guardarLugar = async (e) => {
    e.preventDefault();
    if (!lugarForm.nombre || !lugarForm.tipo) return showNotify("Todos los campos son obligatorios", "error");

    try {
      setIsSaving(true);
      const url = editingId ? `${API_URL}?metodo=configuracion_lugar_edit` : `${API_URL}?metodo=configuracion_lugar`;
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId
        ? { id: editingId, lugar: lugarForm.nombre, tipo: lugarForm.tipo }
        : { lugar: lugarForm.nombre, tipo: lugarForm.tipo };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) throw new Error("Error al guardar lugar");

      showNotify(editingId ? "Lugar actualizado" : "Lugar creado", "success");
      setIsLugarModalOpen(false);
      cargarLugares();
    } catch (error) {
      console.error(error);
      showNotify("Error al guardar lugar", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // --- ELIMINACION COMUN ---
  const confirmarEliminar = (id, tipo) => {
    setItemToDelete({ id, tipo });
    setIsDeleteModalOpen(true);
  };

  const ejecutarEliminacion = async () => {
    if (!itemToDelete) return;
    const { id, tipo } = itemToDelete;

    try {
      setIsSaving(true);
      console.log(`Eliminando ${tipo} con ID:`, id);

      const response = await fetch(`${API_URL}?metodo=eliminar_configuracion`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: String(id) })
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json().catch(() => ({ success: true }));
      console.log('Resultado eliminación:', result);

      showNotify(`${tipo} eliminado correctamente`, "success");
      setIsDeleteModalOpen(false);

      // Forzar carga de datos
      if (tipo === 'Lugar') {
        await cargarLugares();
      } else {
        await cargarConfiguraciones();
      }
    } catch (error) {
      console.error('Error al eliminar:', error);
      showNotify("No se pudo completar la eliminación", "error");
    } finally {
      setIsSaving(false);
      setItemToDelete(null);
    }
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
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${sidebarOpen ? "lg:ml-60 ml-0" : "ml-0"
          }`}
      >
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto custom-scrollbar relative" style={{ background: '#F7FAFF' }}>
          {/* Notificaciones */}
          {notification.show && (
            <div className={`fixed top-4 right-4 z-[100] flex items-center p-4 mb-4 text-sm rounded-lg shadow-xl border animate-fade-in-down ${notification.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : notification.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-blue-50 text-blue-800 border-blue-200'
              }`}>
              <div className="mr-3">
                {notification.type === 'success' ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                ) : notification.type === 'error' ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path></svg>
                )}
              </div>
              <p className="font-semibold">{notification.message}</p>
            </div>
          )}

          {/* Loading Overlay Global */}
          {(isFetching || isSaving) && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
              <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#002D5A] mb-4"></div>
                <p className="text-[#002D5A] font-bold text-lg animate-pulse">Procesando...</p>
              </div>
            </div>
          )}

          <div className="max-w-[95%] mx-auto px-4 py-4">
            {/* Botón Volver */}
            <button
              onClick={() => router.push("/facturacion")}
              className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-lg font-medium hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm ripple-effect relative overflow-hidden text-sm group"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver a Facturación</span>
            </button>

            {/* Card contenedor principal */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#002D5A] to-[#002D5A] rounded-xl flex items-center justify-center text-white shadow-sm">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Gestión de Configuraciones</h1>
                      <p className="text-sm text-gray-600 font-medium mt-0.5">Gestiona las configuraciones de los clientes</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-green-50 border border-green-300 rounded-lg">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-xs sm:text-sm font-semibold text-green-700">API Conectada</span>
                  </div>
                </div>
              </div>

              {/* Secciones lado a lado */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Card 1: Gestión de Asesores */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200/60 p-6">
                  <div className="flex items-center justify-between mb-4 p-3 bg-gradient-to-r from-[#002D5A] to-[#002D5A] text-white rounded-lg">
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <h2 className="text-lg font-bold">Gestión de Asesores</h2>
                    </div>
                    <button
                      onClick={handleNuevoAsesor}
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
                          {asesores.length > 0 ? (
                            asesores.map((asesor) => (
                              <tr key={asesor.ID} className="hover:bg-slate-200 transition-colors">
                                <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{asesor.ID}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700 font-bold">{asesor.NOMBRE}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-[10px]">
                                  <span className={`px-2 py-1 rounded text-[10px] font-bold ${asesor.ESTADO === '1' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
                                    }`}>
                                    {asesor.ESTADO === '1' ? 'ACTIVO' : 'INACTIVO'}
                                  </span>
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-center">
                                  <div className="flex items-center justify-center space-x-2">
                                    <button
                                      onClick={() => editarAsesor(asesor)}
                                      className="flex items-center space-x-1 px-2.5 py-1 bg-blue-600 border-2 border-blue-700 hover:bg-blue-700 hover:border-blue-800 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                      <span>Editar</span>
                                    </button>
                                    <button
                                      onClick={() => confirmarEliminar(asesor.ID, 'Asesor')}
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
                            ))
                          ) : (
                            <tr>
                              <td colSpan="4" className="px-6 py-10 text-center text-gray-500 italic text-sm">
                                No hay asesores registrados
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Card 2: Gestión de Formas de Pago */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200/60 p-6">
                  <div className="flex items-center justify-between mb-4 p-3 bg-gradient-to-r from-[#002D5A] to-[#002D5A] text-white rounded-lg">
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      <h2 className="text-lg font-bold">Gestión de Formas de Pago</h2>
                    </div>
                    <button
                      onClick={handleNuevaFormaPago}
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
                          {formasPago.length > 0 ? (
                            formasPago.map((forma) => (
                              <tr key={forma.ID} className="hover:bg-slate-200 transition-colors">
                                <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{forma.ID}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700 font-bold">{forma.NOMBRE}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-[10px]">
                                  <span className={`px-2 py-1 rounded text-[10px] font-bold ${forma.ESTADO === '1' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
                                    }`}>
                                    {forma.ESTADO === '1' ? 'ACTIVO' : 'INACTIVO'}
                                  </span>
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-center">
                                  <div className="flex items-center justify-center space-x-2">
                                    <button
                                      onClick={() => editarFormaPago(forma)}
                                      className="flex items-center space-x-1 px-2.5 py-1 bg-blue-600 border-2 border-blue-700 hover:bg-blue-700 hover:border-blue-800 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                      <span>Editar</span>
                                    </button>
                                    <button
                                      onClick={() => confirmarEliminar(forma.ID, 'Forma de Pago')}
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
                            ))
                          ) : (
                            <tr>
                              <td colSpan="4" className="px-6 py-10 text-center text-gray-500 italic text-sm">
                                No hay formas de pago registradas
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Gestión de Lugares */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200/60 p-6 mb-6">
                <div className="flex items-center justify-between mb-4 p-3 bg-gradient-to-r from-[#002D5A] to-[#002D5A] text-white rounded-lg">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <h2 className="text-lg font-bold">Gestión de Lugares</h2>
                  </div>
                  <button
                    onClick={handleNuevoLugar}
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
                        {lugares.length > 0 ? (
                          lugares.slice((currentPageLugares - 1) * elementosPorPaginaLugares, currentPageLugares * elementosPorPaginaLugares).map((lugar) => (
                            <tr key={lugar.ID} className="hover:bg-slate-200 transition-colors">
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{lugar.ID}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700 font-bold">{lugar.LUGAR}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700 font-semibold">{lugar.TIPO}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center space-x-2">
                                  <button
                                    onClick={() => editarLugar(lugar)}
                                    className="flex items-center space-x-1 px-2.5 py-1 bg-blue-600 border-2 border-blue-700 hover:bg-blue-700 hover:border-blue-800 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    <span>Editar</span>
                                  </button>
                                  <button
                                    onClick={() => confirmarEliminar(lugar.ID, 'Lugar')}
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
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="px-6 py-10 text-center text-gray-500 italic text-sm">
                              No hay lugares registrados
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {/* Paginación */}
                  <div className="bg-slate-200 px-3 py-2 flex items-center justify-between border-t-2 border-slate-300">
                    <button
                      onClick={() => setCurrentPageLugares((prev) => Math.max(1, prev - 1))}
                      disabled={currentPageLugares === 1}
                      className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                      &lt; Anterior
                    </button>
                    <span className="text-[10px] text-gray-700 font-bold">
                      Página {currentPageLugares} de {Math.ceil(lugares.length / elementosPorPaginaLugares) || 1} ({lugares.length} lugares)
                    </span>
                    <button
                      onClick={() => setCurrentPageLugares((prev) => Math.min(Math.ceil(lugares.length / elementosPorPaginaLugares) || 1, prev + 1))}
                      disabled={currentPageLugares === (Math.ceil(lugares.length / elementosPorPaginaLugares) || 1)}
                      className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                      Siguiente &gt;
                    </button>
                  </div>
                </div>
              </div>

              {/* Card 4: Registro de Nuevos Clientes */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200/60 p-6">
                <div className="flex items-center space-x-2 mb-4 p-3 bg-gradient-to-r from-[#002D5A] to-[#002D5A] text-white rounded-lg">
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
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002D5A] focus:border-[#002D5A] transition-all text-sm text-black font-medium"
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

      {/* MODAL ASESOR */}
      {isAsesorModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-visible transform transition-all scale-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingId ? 'Editar Asesor' : 'Nuevo Asesor'}
              </h3>
              <button onClick={() => setIsAsesorModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <form onSubmit={guardarAsesor} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre del Asesor <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={asesorForm.nombre}
                  onChange={(e) => setAsesorForm({ ...asesorForm, nombre: e.target.value })}
                  placeholder="Ej: Hervin"
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002D5A] focus:border-[#002D5A] outline-none transition-all text-sm font-medium text-black"
                  required
                />
              </div>
              <CustomSelect
                label="Estado"
                name="estado"
                value={asesorForm.estado}
                onChange={(e) => setAsesorForm({ ...asesorForm, estado: e.target.value })}
                options={opcionesEstado}
                placeholder="Seleccione estado"
              />
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAsesorModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-all text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-4 py-2.5 bg-[#002D5A] text-white rounded-lg font-bold hover:bg-[#003d7a] transition-all text-sm disabled:opacity-50"
                >
                  {isSaving ? 'Guardando...' : editingId ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FORMA DE PAGO */}
      {isPagoModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-visible p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingId ? 'Editar Forma de Pago' : 'Nueva Forma de Pago'}
              </h3>
              <button onClick={() => setIsPagoModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <form onSubmit={guardarFormaPago} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre de Forma de Pago <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={pagoForm.nombre}
                  onChange={(e) => setPagoForm({ ...pagoForm, nombre: e.target.value })}
                  placeholder="Ej: Efectivo"
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002D5A] focus:border-[#002D5A] outline-none transition-all text-sm font-medium text-black"
                  required
                />
              </div>
              <CustomSelect
                label="Estado"
                name="estado"
                value={pagoForm.estado}
                onChange={(e) => setPagoForm({ ...pagoForm, estado: e.target.value })}
                options={opcionesEstado}
                placeholder="Seleccione estado"
              />
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsPagoModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-all text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-4 py-2.5 bg-[#002D5A] text-white rounded-lg font-bold hover:bg-[#003d7a] transition-all text-sm disabled:opacity-50"
                >
                  {isSaving ? 'Guardando...' : editingId ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL LUGAR */}
      {isLugarModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-visible p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingId ? 'Editar Lugar' : 'Nuevo Lugar'}
              </h3>
              <button onClick={() => setIsLugarModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <form onSubmit={guardarLugar} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre del Lugar <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={lugarForm.nombre}
                  onChange={(e) => setLugarForm({ ...lugarForm, nombre: e.target.value })}
                  placeholder="Ej: Naranjal"
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002D5A] focus:border-[#002D5A] outline-none transition-all text-sm font-medium text-black"
                  required
                />
              </div>
              <CustomSelect
                label="Tipo de Lugar"
                name="tipo"
                value={lugarForm.tipo}
                onChange={(e) => setLugarForm({ ...lugarForm, tipo: e.target.value })}
                options={opcionesTipoLugar}
                placeholder="Seleccione tipo"
                required
              />
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsLugarModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-all text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-4 py-2.5 bg-[#002D5A] text-white rounded-lg font-bold hover:bg-[#003d7a] transition-all text-sm disabled:opacity-50"
                >
                  {isSaving ? 'Guardando...' : editingId ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-8 flex flex-col items-center">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">¿Confirmar Eliminación?</h3>
            <p className="text-gray-500 text-center mb-8">Esta acción eliminará el registro de <strong>{itemToDelete?.tipo}</strong> de forma permanente.</p>
            <div className="flex flex-col w-full space-y-3">
              <button
                onClick={ejecutarEliminacion}
                disabled={isSaving}
                className="w-full px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200 disabled:opacity-50"
              >
                {isSaving ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
              >
                No, Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fade-in-down {
          0% { opacity: 0; transform: translateY(-20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        .animate-fade-in-down { animation: fade-in-down 0.4s ease-out forwards; }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
}

