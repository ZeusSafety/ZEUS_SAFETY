"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/context/AuthContext";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";
import Modal from "../../../components/ui/Modal";

export default function StockPreciosMayorPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Estados principales
  const [productos, setProductos] = useState([]);
  const [productosReservados, setProductosReservados] = useState([]);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [productosReservadosFiltrados, setProductosReservadosFiltrados] = useState([]);
  const [historialReciente, setHistorialReciente] = useState([]);
  const [historialReservados, setHistorialReservados] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const productosPorPagina = 25;

  // Estados de filtros
  const [buscadorProductos, setBuscadorProductos] = useState("");
  const [sugerenciasProductos, setSugerenciasProductos] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  // Estados de modales
  const [mostrarModalAcciones, setMostrarModalAcciones] = useState(false);
  const [mostrarModalGestionarReserva, setMostrarModalGestionarReserva] = useState(false);
  const [mostrarModalDetalles, setMostrarModalDetalles] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [reservaSeleccionada, setReservaSeleccionada] = useState(null);
  const [historialSeleccionado, setHistorialSeleccionado] = useState(null);
  const [productosParaGuardar, setProductosParaGuardar] = useState([]);

  // Estados de formulario modal acciones
  const [buscarProducto, setBuscarProducto] = useState("");
  const [sugerenciasModal, setSugerenciasModal] = useState([]);
  const [mostrarSugerenciasModal, setMostrarSugerenciasModal] = useState(false);
  const [tipoAccion, setTipoAccion] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [unidadMedida, setUnidadMedida] = useState("CAJAS");
  const [motivo, setMotivo] = useState("");
  const [responsable, setResponsable] = useState("");
  const [fechaHora, setFechaHora] = useState("");

  // Estados de formulario modal gestionar reserva
  const [reservaAccion, setReservaAccion] = useState("");
  const [reservaCantidad, setReservaCantidad] = useState("");
  const [reservaUnidadMedida, setReservaUnidadMedida] = useState("CAJAS");
  const [reservaMotivo, setReservaMotivo] = useState("");
  const [reservaResponsable, setReservaResponsable] = useState("");

  // Estados de notificaciones
  const [notificacionesExpandidas, setNotificacionesExpandidas] = useState(false);
  const [notificacionesReservadosExpandidas, setNotificacionesReservadosExpandidas] = useState(false);

  // Estados de carga
  const [cargandoStock, setCargandoStock] = useState(false);
  const [cargandoReservados, setCargandoReservados] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Referencias
  const buscadorRef = useRef(null);
  const sugerenciasRef = useRef(null);
  const buscadorModalRef = useRef(null);
  const sugerenciasModalRef = useRef(null);

  const responsables = [
    "EDGAR", "EVELYN", "KIMBERLY", "JOSEPH", "ALVARO", 
    "MANUEL", "JHONSON", "VICTOR", "LIZETH", "JOSÉ", "HERVIN"
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

  useEffect(() => {
    if (user) {
      cargarDatos();
      actualizarFechaHora();
      const interval = setInterval(actualizarFechaHora, 1000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const actualizarFechaHora = () => {
    const ahora = new Date();
    const fechaFormateada = ahora.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    setFechaHora(fechaFormateada);
  };

  const cargarDatos = async () => {
    setCargandoStock(true);
    setCargandoReservados(true);

    try {
      // Cargar productos
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const responseProductos = await fetch('/api/descuento-cajas/productos', {
        method: 'GET',
        headers: headers
      });

      if (!responseProductos.ok) throw new Error('Error al cargar productos');

      const dataProductos = await responseProductos.json();
      const productosArray = Array.isArray(dataProductos) ? dataProductos : (dataProductos.data || []);
      
      const productosNormalizados = productosArray.map(p => ({
        id: String(p.ID || p.id || p.ID_PRODUCTO || p.id_producto || ''),
        codigo: p['Código de Producto'] || p.codigo || p.CODIGO || '',
        producto: p.Producto || p.producto || p.NOMBRE || '',
        limite: p.Limite || p.limite || p.LIMITE || 0,
        categoria: p.CATEGORIA || p.categoria || '',
        cantidadCajas: p.Cantidad || p.cantidadCajas || p.CANTIDAD || 0,
        unidadMedida: p.Unidad_Medida || p.unidadMedida || p.UNIDAD_MEDIDA || 'CAJAS'
      }));

      setProductos(productosNormalizados);
      aplicarFiltros(productosNormalizados);
      setCargandoStock(false);
    } catch (error) {
      console.error('Error cargando productos:', error);
      setCargandoStock(false);
    }

    try {
      // Cargar productos reservados
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const responseReservados = await fetch('/api/descuento-cajas/reservadas', {
        method: 'GET',
        headers: headers
      });

      if (!responseReservados.ok) throw new Error('Error al cargar productos reservados');

      const dataReservados = await responseReservados.json();
      const reservadosArray = Array.isArray(dataReservados) ? dataReservados : (dataReservados.data || []);
      
      const reservadosNormalizados = reservadosArray.map(r => ({
        id: r.ID || r.id || r.ID_RESERVADOS || '',
        producto: r.PRODUCTO || r.producto || '',
        categoria: r.CATEGORIA || r.categoria || '',
        fechaHora: r['Fecha y hora de reserva'] || r.FECHA_HORA || r.fechaHora || '',
        responsable: r.RESPONSABLE || r.responsable || '',
        cantidadReservada: r.CANTIDAD_RESERVADA || r.cantidadReservada || 0,
        unidadMedida: r.UNIDAD_MEDIDA || r.unidadMedida || 'CAJAS'
      }));

      setProductosReservados(reservadosNormalizados);
      setProductosReservadosFiltrados(reservadosNormalizados);
      setCargandoReservados(false);
    } catch (error) {
      console.error('Error cargando productos reservados:', error);
      setCargandoReservados(false);
    }

    try {
      // Cargar historial general
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const responseHistorial = await fetch('/api/descuento-cajas/historial-general', {
        method: 'GET',
        headers: headers
      });

      if (responseHistorial.ok) {
        const dataHistorial = await responseHistorial.json();
        const historialArray = Array.isArray(dataHistorial) ? dataHistorial : (dataHistorial.data || []);
        setHistorialReciente(historialArray);
      }
    } catch (error) {
      console.error('Error cargando historial:', error);
    }

    try {
      // Cargar historial de reservas
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const responseHistorialReservas = await fetch('/api/descuento-cajas/historial-reservas', {
        method: 'GET',
        headers: headers
      });

      if (responseHistorialReservas.ok) {
        const dataHistorialReservas = await responseHistorialReservas.json();
        const historialReservasArray = Array.isArray(dataHistorialReservas) ? dataHistorialReservas : (dataHistorialReservas.data || []);
        setHistorialReservados(historialReservasArray);
      }
    } catch (error) {
      console.error('Error cargando historial de reservas:', error);
    }
  };

  const aplicarFiltros = (productosArray = productos) => {
    const filtrados = productosArray.filter(p => {
      const matchBuscador = !buscadorProductos ||
        (p.producto && p.producto.toLowerCase().includes(buscadorProductos.toLowerCase())) ||
        (p.codigo && p.codigo.toString().toLowerCase().includes(buscadorProductos.toLowerCase()));
      return matchBuscador;
    });
    setProductosFiltrados(filtrados);
    setPaginaActual(1);
  };

  useEffect(() => {
    aplicarFiltros();
  }, [buscadorProductos]);

  const buscarProductoConSugerencias = (valor) => {
    setBuscadorProductos(valor);
    
    if (valor.length < 2) {
      setSugerenciasProductos([]);
      setMostrarSugerencias(false);
      return;
    }

    const coincidencias = productos.filter(p =>
      (p.producto && p.producto.toLowerCase().includes(valor.toLowerCase())) ||
      (p.codigo && p.codigo.toString().toLowerCase().includes(valor.toLowerCase()))
    ).slice(0, 10);

    setSugerenciasProductos(coincidencias);
    setMostrarSugerencias(coincidencias.length > 0);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sugerenciasRef.current && !sugerenciasRef.current.contains(event.target) &&
        buscadorRef.current && !buscadorRef.current.contains(event.target)) {
        setMostrarSugerencias(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '';
    if (typeof fechaStr === 'string' && fechaStr.includes('-')) {
      const partes = fechaStr.split(' ');
      const fecha = partes[0];
      const hora = partes[1] || '00:00:00';
      const [año, mes, dia] = fecha.split('-');
      const [horas, minutos, segundos] = hora.split(':');
      const fechaObj = new Date(año, parseInt(mes) - 1, dia, horas || 0, minutos || 0, segundos || 0);
      return fechaObj.toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    }
    return fechaStr;
  };

  // Paginación
  const inicio = (paginaActual - 1) * productosPorPagina;
  const fin = inicio + productosPorPagina;
  const productosPagina = productosFiltrados.slice(inicio, fin);
  const totalPaginas = Math.ceil(productosFiltrados.length / productosPorPagina);

  const cambiarPagina = (direccion) => {
    const nuevaPagina = paginaActual + direccion;
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
    }
  };

  // Modal Acciones
  const abrirModalAcciones = (producto = null) => {
    if (producto) {
      setProductoSeleccionado(producto);
      setBuscarProducto(producto.producto || "");
    } else {
      limpiarFormularioAcciones();
    }
    setMostrarModalAcciones(true);
  };

  const cerrarModalAcciones = () => {
    setMostrarModalAcciones(false);
    limpiarFormularioAcciones();
  };

  const limpiarFormularioAcciones = () => {
    setBuscarProducto("");
    setSugerenciasModal([]);
    setMostrarSugerenciasModal(false);
    setProductoSeleccionado(null);
    setTipoAccion("");
    setCantidad("");
    setUnidadMedida("CAJAS");
    setMotivo("");
    setResponsable("");
    setProductosParaGuardar([]);
  };

  const buscarProductoAuto = (valor) => {
    setBuscarProducto(valor);
    
    if (valor.length < 2) {
      setSugerenciasModal([]);
      setMostrarSugerenciasModal(false);
      return;
    }

    const coincidencias = productos.filter(p => {
      const nombreProducto = (p.producto || '').toString().toLowerCase();
      const codigoProducto = (p.codigo || '').toString().toLowerCase();
      return nombreProducto.includes(valor.toLowerCase()) || codigoProducto.includes(valor.toLowerCase());
    }).slice(0, 10);

    setSugerenciasModal(coincidencias);
    setMostrarSugerenciasModal(coincidencias.length > 0);
  };

  const seleccionarProducto = (producto) => {
    setProductoSeleccionado(producto);
    setBuscarProducto(producto.producto || '');
    setSugerenciasModal([]);
    setMostrarSugerenciasModal(false);
  };

  const listarProducto = () => {
    if (!productoSeleccionado) {
      alert('Debe seleccionar un producto');
      return;
    }

    if (!tipoAccion || !cantidad || !responsable) {
      alert('Debe completar los campos obligatorios');
      return;
    }

    if (parseFloat(cantidad) <= 0) {
      alert('La cantidad debe ser mayor a 0');
      return;
    }

    const nuevoProducto = {
      idProducto: productoSeleccionado.id,
      producto: productoSeleccionado.producto,
      categoria: productoSeleccionado.categoria,
      stockActual: productoSeleccionado.cantidadCajas,
      accion: tipoAccion,
      cantidad: parseFloat(cantidad),
      unidadMedida: unidadMedida,
      motivo: motivo,
      responsable: responsable
    };

    setProductosParaGuardar([...productosParaGuardar, nuevoProducto]);
    
    // Limpiar formulario
    setBuscarProducto("");
    setProductoSeleccionado(null);
    setTipoAccion("");
    setCantidad("");
    setUnidadMedida("CAJAS");
    setMotivo("");
    setResponsable("");
  };

  const eliminarProductoListado = (index) => {
    setProductosParaGuardar(productosParaGuardar.filter((_, i) => i !== index));
  };

  const guardarOperaciones = async () => {
    if (productosParaGuardar.length === 0) {
      alert('No hay productos para guardar');
      return;
    }

    if (!confirm('¿Está seguro de guardar estas operaciones?')) {
      return;
    }

    setGuardando(true);

    const movimientos = productosParaGuardar.map(p => {
      let accionEnviar = (p.accion || '').toString().trim().toUpperCase();
      if (accionEnviar === 'RETIRAR') accionEnviar = 'RETIRO';
      else if (accionEnviar === 'RESERVAR') accionEnviar = 'RESERVA';

      return {
        id_producto: p.idProducto,
        responsable: p.responsable,
        accion: accionEnviar,
        cantidad: p.cantidad,
        motivo: p.motivo,
        unidad_medida_transaccion: p.unidadMedida
      };
    });

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch('/api/descuento-cajas/descuento-stock', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(movimientos)
      });

      if (!response.ok) throw new Error('Error en la solicitud');

      const data = await response.json();
      
      if (data.success) {
        alert(`Operaciones guardadas correctamente. Se procesaron ${data.movimientos?.length || productosParaGuardar.length} movimientos.`);
        cerrarModalAcciones();
        cargarDatos();
      } else {
        alert('Error: ' + (data.error || 'Error al guardar operaciones'));
      }
    } catch (error) {
      console.error('Error guardando operaciones:', error);
      alert('Error: ' + error.message);
    } finally {
      setGuardando(false);
    }
  };

  // Modal Gestionar Reserva
  const abrirModalGestionarReserva = (reserva) => {
    setReservaSeleccionada(reserva);
    setReservaAccion("");
    setReservaCantidad("");
    setReservaUnidadMedida("CAJAS");
    setReservaMotivo("");
    setReservaResponsable("");
    setMostrarModalGestionarReserva(true);
  };

  const cerrarModalGestionarReserva = () => {
    setMostrarModalGestionarReserva(false);
    setReservaSeleccionada(null);
  };

  const guardarGestionReserva = async () => {
    if (!reservaSeleccionada) return;

    if (!reservaAccion || !reservaCantidad || !reservaResponsable) {
      alert('Debe completar los campos obligatorios');
      return;
    }

    if (parseFloat(reservaCantidad) <= 0) {
      alert('La cantidad debe ser mayor a 0');
      return;
    }

    let cantidadEnCajas = parseFloat(reservaCantidad);
    if (reservaUnidadMedida === 'UNIDADES') {
      cantidadEnCajas = cantidadEnCajas / 24;
    }

    const cantidadReservada = reservaSeleccionada.cantidadReservada || 0;
    if (cantidadEnCajas > cantidadReservada) {
      alert('La cantidad excede el stock reservado');
      return;
    }

    if (!confirm('¿Está seguro de realizar esta operación?')) {
      return;
    }

    setGuardando(true);

    const idReservados = reservaSeleccionada.id || '';
    const esRegreso = reservaAccion === 'REGRESAR';

    const datos = {
      id_reservados: idReservados,
      responsable: reservaResponsable,
      cantidad_gestionada: parseFloat(reservaCantidad),
      es_regreso: esRegreso,
      motivo: reservaMotivo,
      unidad_medida: reservaUnidadMedida
    };

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch('/api/descuento-cajas/reservas-gestionar', {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(datos)
      });

      if (!response.ok) throw new Error('Error en la solicitud');

      const data = await response.json();
      
      if (data.success) {
        alert(data.message || 'Gestión de reserva realizada correctamente');
        cerrarModalGestionarReserva();
        cargarDatos();
      } else {
        alert('Error: ' + (data.error || 'Error al gestionar reserva'));
      }
    } catch (error) {
      console.error('Error guardando gestión de reserva:', error);
      alert('Error: ' + error.message);
    } finally {
      setGuardando(false);
    }
  };

  // Ver detalles
  const verDetalles = (historial) => {
    setHistorialSeleccionado(historial);
    setMostrarModalDetalles(true);
  };

  const cerrarModalDetalles = () => {
    setMostrarModalDetalles(false);
    setHistorialSeleccionado(null);
  };

  // Notificaciones
  const ultimaNotificacion = historialReciente[0];
  const ultimaNotificacionReservados = historialReservados[0];

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

      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${sidebarOpen ? "lg:ml-60 ml-0" : "ml-0"}`}>
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto custom-scrollbar" style={{ background: '#F7FAFF' }}>
          <div className="max-w-[95%] mx-auto px-4 py-4">
            {/* Botón Volver */}
            <button
              onClick={() => router.push("/marketing")}
              className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-blue-700 to-blue-800 text-white rounded-lg font-semibold hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm ripple-effect relative overflow-hidden text-sm group"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver a Marketing</span>
            </button>

            {/* CUADRO PRINCIPAL - Todo dentro de un cuadro blanco */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden p-6">
              {/* Header dentro del cuadro */}
              <div className="mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center text-white border-2 border-blue-800 shadow-sm">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'var(--font-poppins)' }}>
                        Sistema de Descuento Venta por Cajas - Malvinas
                      </h1>
                      <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: 'var(--font-poppins)' }}>
                        Gestión y control de stock de productos
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 rounded-lg px-3 py-1.5 bg-green-50 border border-green-200">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-semibold text-green-700" style={{ fontFamily: 'var(--font-poppins)' }}>API Conectada</span>
                  </div>
                </div>
              </div>

              {/* Notificaciones */}
              {ultimaNotificacion && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4 mb-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 flex-1">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <p className="text-sm text-gray-800 flex-1" style={{ fontFamily: 'var(--font-poppins)' }}>
                        <strong>{ultimaNotificacion.RESPONSABLE || ultimaNotificacion.responsable || ''}</strong> realizó una{' '}
                        <strong>{ultimaNotificacion.ACCION_REALIZADA || ultimaNotificacion.accion || ''}</strong> de{' '}
                        <strong>{ultimaNotificacion.PRODUCTO || ultimaNotificacion.producto || ''}</strong> -{' '}
                        {formatearFecha(ultimaNotificacion.FECHA_HORA || ultimaNotificacion.fechaHora || '')}
                      </p>
                    </div>
                    <button
                      onClick={() => setNotificacionesExpandidas(!notificacionesExpandidas)}
                      className="ml-4 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-xs font-semibold transition-all duration-200"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                    >
                      Ver historial
                    </button>
                  </div>
                  {notificacionesExpandidas && historialReciente.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {historialReciente.map((h, idx) => (
                        <div key={idx} className="bg-white rounded-lg p-3 flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-gray-800" style={{ fontFamily: 'var(--font-poppins)' }}>
                              <strong>{h.RESPONSABLE || h.responsable || ''}</strong> - {h.PRODUCTO || h.producto || ''} ({h.CATEGORIA || h.categoria || ''})
                              <br />
                              <small className="text-gray-600">
                                {h.ACCION_REALIZADA || h.accion || ''} - {formatearFecha(h.FECHA_HORA || h.fechaHora || '')}
                              </small>
                            </p>
                          </div>
                          <button
                            onClick={() => verDetalles(h)}
                            className="ml-4 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold transition-all duration-200"
                            style={{ fontFamily: 'var(--font-poppins)' }}
                          >
                            Ver detalles
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Controles */}
              <div className="mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative" ref={buscadorRef}>
                    <input
                      type="text"
                      value={buscadorProductos}
                      onChange={(e) => buscarProductoConSugerencias(e.target.value)}
                      placeholder="Buscar productos..."
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 placeholder:text-gray-400 bg-white hover:border-blue-300 transition-all duration-200 font-medium"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                    />
                    {mostrarSugerencias && sugerenciasProductos.length > 0 && (
                      <div
                        ref={sugerenciasRef}
                        className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                      >
                        {sugerenciasProductos.map((prod, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              setBuscadorProductos(prod.producto);
                              setMostrarSugerencias(false);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                          >
                            <div className="text-sm font-medium text-gray-900">{prod.producto}</div>
                            <div className="text-xs text-gray-500">Código: {prod.codigo} | Stock: {prod.cantidadCajas}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => abrirModalAcciones()}
                    className="px-4 py-2 bg-gradient-to-br from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white rounded-lg text-sm font-semibold hover:shadow-md transition-all duration-200 flex items-center space-x-1.5 shadow-sm"
                    style={{ fontFamily: 'var(--font-poppins)' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>ACCIONES</span>
                  </button>
                </div>
              </div>

              {/* Título PRODUCTOS CON STOCK - Fuera del cuadro */}
              <div className="mb-4 mt-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center text-white border-2 border-blue-800 shadow-sm">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'var(--font-poppins)' }}>
                      Productos con stock
                    </h2>
                    <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: 'var(--font-poppins)' }}>
                      Productos disponibles en inventario
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabla Principal PRODUCTOS CON STOCK */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden mb-6">

              {cargandoStock ? (
                <div className="text-center py-12 text-gray-600">Cargando stock...</div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gradient-to-r from-blue-700 to-blue-800 border-b-2 border-blue-900">
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>CODIGO</th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>PRODUCTO</th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>LÍMITE</th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>CATEGORIA</th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>CANTIDAD CAJAS</th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>UNIDAD MEDIDA</th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>GESTIONES</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {productosPagina.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-gray-600">
                              No se encontraron productos que coincidan con los filtros.
                            </td>
                          </tr>
                        ) : (
                          productosPagina.map((p) => (
                            <tr key={p.id} className="hover:bg-blue-50 transition-colors border-b border-gray-100">
                              <td className="px-4 py-3 whitespace-nowrap text-[10px] font-medium text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>{p.codigo}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{p.producto}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>
                                {p.limite ?? 0}
                                <svg className="w-4 h-4 text-orange-500 inline-block ml-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{p.categoria}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-[10px] font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>{p.cantidadCajas}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{p.unidadMedida}</td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <button
                                  onClick={() => abrirModalAcciones(p)}
                                  className="inline-flex items-center justify-center px-3 py-1.5 bg-gradient-to-br from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                  style={{ fontFamily: 'var(--font-poppins)' }}
                                  title="Gestionar producto"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  {/* Paginación */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 flex items-center justify-between border-t border-gray-200">
                    <button
                      onClick={() => setPaginaActual(1)}
                      disabled={paginaActual === 1}
                      className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                    >
                      «
                    </button>
                    <button
                      onClick={() => cambiarPagina(-1)}
                      disabled={paginaActual === 1}
                      className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                    >
                      &lt;
                    </button>
                    <span className="text-xs text-gray-700 font-semibold" style={{ fontFamily: 'var(--font-poppins)' }}>
                      Página {paginaActual} de {totalPaginas || 1}
                    </span>
                    <button
                      onClick={() => cambiarPagina(1)}
                      disabled={paginaActual >= totalPaginas}
                      className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                    >
                      &gt;
                    </button>
                    <button
                      onClick={() => setPaginaActual(totalPaginas)}
                      disabled={paginaActual >= totalPaginas}
                      className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                    >
                      »
                    </button>
                  </div>
                </>
              )}
              </div>

              {/* Sección Productos Reservados */}
              {productosReservadosFiltrados.length > 0 && (
                <>
                  {/* Título Productos Reservados - Fuera del cuadro */}
                  <div className="mb-4 mt-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center text-white border-2 border-blue-800 shadow-sm">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h2 className="text-lg font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'var(--font-poppins)' }}>
                          Productos reservados
                        </h2>
                        <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: 'var(--font-poppins)' }}>
                          Productos actualmente reservados para ventas
                        </p>
                      </div>
                    </div>
                    
                    {/* Notificación Reservados */}
                    {ultimaNotificacionReservados && (
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-3 mb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 flex-1">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <p className="text-sm text-gray-800 flex-1" style={{ fontFamily: 'var(--font-poppins)' }}>
                              <strong>{ultimaNotificacionReservados.RESPONSABLE || ultimaNotificacionReservados.responsable || ''}</strong> -{' '}
                              {ultimaNotificacionReservados.ACCION_REALIZADA || ultimaNotificacionReservados.accion || ''} de{' '}
                              <strong>{ultimaNotificacionReservados.PRODUCTO || ultimaNotificacionReservados.producto || ''}</strong> -{' '}
                              {formatearFecha(ultimaNotificacionReservados.FECHA_HORA_ACTUALIZACION_HC || ultimaNotificacionReservados.fechaHora || '')}
                            </p>
                          </div>
                          <button
                            onClick={() => setNotificacionesReservadosExpandidas(!notificacionesReservadosExpandidas)}
                            className="ml-4 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-xs font-semibold transition-all duration-200"
                            style={{ fontFamily: 'var(--font-poppins)' }}
                          >
                            Ver historial
                          </button>
                        </div>
                        {notificacionesReservadosExpandidas && historialReservados.length > 0 && (
                          <div className="mt-4 space-y-2">
                            {historialReservados.map((h, idx) => (
                              <div key={idx} className="bg-white rounded-lg p-3">
                                <p className="text-sm text-gray-800" style={{ fontFamily: 'var(--font-poppins)' }}>
                                  <strong>{h.RESPONSABLE || h.responsable || ''}</strong> - {h.PRODUCTO || h.producto || ''} ({h.CATEGORIA || h.categoria || ''})
                                  <br />
                                  <small className="text-gray-600">
                                    {h.ACCION_REALIZADA || h.accion || ''} - {formatearFecha(h.FECHA_HORA_ACTUALIZACION_HC || h.fechaHora || '')}
                                  </small>
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Tabla Productos Reservados */}
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden mb-6">

                  {cargandoReservados ? (
                    <div className="text-center py-8 text-gray-600 p-4">Cargando productos reservados...</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gradient-to-r from-blue-700 to-blue-800 border-b-2 border-blue-900">
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>PRODUCTO</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>CATEGORIA</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>FECHA Y HORA</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>RESPONSABLE</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>CANTIDAD RESERVADA</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>UNIDAD MEDIDA</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>ACCIONES</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {productosReservadosFiltrados.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-4 py-3 text-center text-[10px] text-gray-600" style={{ fontFamily: 'var(--font-poppins)' }}>
                                No se encontraron productos reservados.
                              </td>
                            </tr>
                          ) : (
                            productosReservadosFiltrados.map((r) => (
                              <tr key={r.id} className="hover:bg-blue-50 transition-colors border-b border-gray-100">
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{r.producto}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{r.categoria}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{formatearFecha(r.fechaHora)}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{r.responsable}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>{r.cantidadReservada || 0}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{r.unidadMedida || 'CAJAS'}</td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <button
                                    onClick={() => abrirModalGestionarReserva(r)}
                                    className="inline-flex items-center px-3 py-1.5 bg-gradient-to-br from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                    style={{ fontFamily: 'var(--font-poppins)' }}
                                  >
                                    Gestionar
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                  </div>
                </>
              )}
            </div>
            {/* Fin del cuadro principal */}
          </div>
        </main>
      </div>

      {/* Modal Acciones */}
      <Modal
        isOpen={mostrarModalAcciones}
        onClose={cerrarModalAcciones}
        title="⚡ Gestionar Stock"
        size={productosParaGuardar.length > 0 ? "full" : (mostrarSugerenciasModal && sugerenciasModal.length > 0 ? "xl" : "xl-small")}
        hideFooter={true}
      >
        <div className="space-y-4">
          {/* Buscador de productos */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
              Buscar Producto
            </label>
            <div className="relative" ref={buscadorModalRef}>
              <input
                type="text"
                value={buscarProducto}
                onChange={(e) => buscarProductoAuto(e.target.value)}
                placeholder="Escribe para buscar..."
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                style={{ fontFamily: 'var(--font-poppins)' }}
              />
              {mostrarSugerenciasModal && sugerenciasModal.length > 0 && (
                <div
                  ref={sugerenciasModalRef}
                  className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto"
                >
                  {sugerenciasModal.map((prod, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => seleccionarProducto(prod)}
                      className="w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="text-sm font-medium text-gray-900">{prod.producto}</div>
                      <div className="text-xs text-gray-500">Código: {prod.codigo} | Stock: {prod.cantidadCajas}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Info del producto seleccionado */}
          {productoSeleccionado && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong className="text-sm text-gray-700 block mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>Producto</strong>
                  <span className="text-sm text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>{productoSeleccionado.producto}</span>
                </div>
                <div>
                  <strong className="text-sm text-gray-700 block mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>Categoría</strong>
                  <span className="text-sm text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>{productoSeleccionado.categoria}</span>
                </div>
                <div>
                  <strong className="text-sm text-gray-700 block mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>Stock Actual</strong>
                  <span className="text-sm text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>{productoSeleccionado.cantidadCajas} cajas</span>
                </div>
                <div>
                  <strong className="text-sm text-gray-700 block mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>Unidad</strong>
                  <span className="text-sm text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>{productoSeleccionado.unidadMedida}</span>
                </div>
              </div>
            </div>
          )}

          {/* Formulario de acción */}
          {productoSeleccionado && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                  Acción
                </label>
                <select
                  value={tipoAccion}
                  onChange={(e) => setTipoAccion(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                  style={{ fontFamily: 'var(--font-poppins)' }}
                >
                  <option value="">Seleccione una acción</option>
                  <option value="RETIRAR">Retirar</option>
                  <option value="RESERVAR">Reservar</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                    Cantidad *
                  </label>
                  <input
                    type="number"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="0"
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                    style={{ fontFamily: 'var(--font-poppins)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                    Unidad de Medida
                  </label>
                  <select
                    value={unidadMedida}
                    onChange={(e) => setUnidadMedida(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                    style={{ fontFamily: 'var(--font-poppins)' }}
                  >
                    <option value="CAJAS">CAJAS</option>
                    <option value="UNIDADES">UNIDADES</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                  Motivo (Opcional)
                </label>
                <textarea
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ingrese el motivo de la operación"
                  rows={3}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                  style={{ fontFamily: 'var(--font-poppins)' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                    Responsable *
                  </label>
                  <select
                    value={responsable}
                    onChange={(e) => setResponsable(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                    style={{ fontFamily: 'var(--font-poppins)' }}
                  >
                    <option value="">Seleccione</option>
                    {responsables.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                    Fecha y Hora
                  </label>
                  <input
                    type="text"
                    value={fechaHora}
                    readOnly
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-700"
                    style={{ fontFamily: 'var(--font-poppins)' }}
                  />
                </div>
              </div>

              <button
                onClick={listarProducto}
                className="w-full px-4 py-2.5 bg-gradient-to-br from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white rounded-lg font-semibold hover:shadow-md transition-all duration-200 flex items-center justify-center space-x-2"
                style={{ fontFamily: 'var(--font-poppins)' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <span>Listar</span>
              </button>
            </div>
          )}

          {/* Productos listados */}
          {productosParaGuardar.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-bold text-gray-900 mb-3" style={{ fontFamily: 'var(--font-poppins)' }}>
                Productos para Guardar
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-700 to-blue-800 border-b-2 border-blue-900">
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Producto</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Categoría</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Stock Actual</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Acción</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Cantidad</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {productosParaGuardar.map((p, index) => (
                      <tr key={index} className="hover:bg-blue-50 transition-colors">
                        <td className="px-3 py-2 text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{p.producto}</td>
                        <td className="px-3 py-2 text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{p.categoria}</td>
                        <td className="px-3 py-2 text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{p.stockActual}</td>
                        <td className="px-3 py-2 text-[10px] font-semibold" style={{ 
                          fontFamily: 'var(--font-poppins)',
                          color: p.accion === 'RETIRAR' ? '#e74c3c' : '#f4a942'
                        }}>{p.accion}</td>
                        <td className="px-3 py-2 text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{p.cantidad} {p.unidadMedida}</td>
                        <td className="px-3 py-2 text-[10px]">
                          <button
                            onClick={() => eliminarProductoListado(index)}
                            className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-[10px] font-semibold transition-all duration-200"
                            style={{ fontFamily: 'var(--font-poppins)' }}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                onClick={guardarOperaciones}
                disabled={guardando}
                className="w-full mt-4 px-4 py-2.5 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-lg font-semibold hover:shadow-md transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: 'var(--font-poppins)' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>{guardando ? 'Guardando...' : 'Guardar Todo'}</span>
              </button>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal Gestionar Reserva */}
      <Modal
        isOpen={mostrarModalGestionarReserva}
        onClose={cerrarModalGestionarReserva}
        title="🔒 Gestionar Producto Reservado"
        size="medium"
        hideFooter={true}
      >
        {reservaSeleccionada && (
          <div className="space-y-4">
            {/* Info del producto reservado */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong className="text-sm text-gray-700 block mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>Producto</strong>
                  <span className="text-sm text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>{reservaSeleccionada.producto}</span>
                </div>
                <div>
                  <strong className="text-sm text-gray-700 block mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>Categoría</strong>
                  <span className="text-sm text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>{reservaSeleccionada.categoria}</span>
                </div>
                <div>
                  <strong className="text-sm text-gray-700 block mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>Stock Reservado</strong>
                  <span className="text-sm text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>{reservaSeleccionada.cantidadReservada} cajas</span>
                </div>
                <div>
                  <strong className="text-sm text-gray-700 block mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>Responsable</strong>
                  <span className="text-sm text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>{reservaSeleccionada.responsable}</span>
                </div>
              </div>
            </div>

            {/* Formulario */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                  Acción
                </label>
                <select
                  value={reservaAccion}
                  onChange={(e) => setReservaAccion(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                  style={{ fontFamily: 'var(--font-poppins)' }}
                >
                  <option value="">Seleccione una acción</option>
                  <option value="RETIRAR">Retirar</option>
                  <option value="REGRESAR">Regresar al stock general</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                    Cantidad *
                  </label>
                  <input
                    type="number"
                    value={reservaCantidad}
                    onChange={(e) => setReservaCantidad(e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="0"
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                    style={{ fontFamily: 'var(--font-poppins)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                    Unidad de Medida
                  </label>
                  <select
                    value={reservaUnidadMedida}
                    onChange={(e) => setReservaUnidadMedida(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                    style={{ fontFamily: 'var(--font-poppins)' }}
                  >
                    <option value="CAJAS">CAJAS</option>
                    <option value="UNIDADES">UNIDADES</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                  Motivo (Opcional)
                </label>
                <textarea
                  value={reservaMotivo}
                  onChange={(e) => setReservaMotivo(e.target.value)}
                  placeholder="Ingrese el motivo de la operación"
                  rows={3}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                  style={{ fontFamily: 'var(--font-poppins)' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                    Responsable *
                  </label>
                  <select
                    value={reservaResponsable}
                    onChange={(e) => setReservaResponsable(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                    style={{ fontFamily: 'var(--font-poppins)' }}
                  >
                    <option value="">Seleccione</option>
                    {responsables.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                    Fecha y Hora
                  </label>
                  <input
                    type="text"
                    value={fechaHora}
                    readOnly
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-700"
                    style={{ fontFamily: 'var(--font-poppins)' }}
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={guardarGestionReserva}
                  disabled={guardando}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-lg font-semibold hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontFamily: 'var(--font-poppins)' }}
                >
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  onClick={cerrarModalGestionarReserva}
                  className="flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold hover:shadow-md transition-all duration-200"
                  style={{ fontFamily: 'var(--font-poppins)' }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Detalles */}
      <Modal
        isOpen={mostrarModalDetalles}
        onClose={cerrarModalDetalles}
        title="📋 Detalles de la Operación"
        size="medium"
        hideFooter={true}
      >
        {historialSeleccionado && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-bold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-poppins)' }}>
              Información de la Operación
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong className="text-sm text-gray-700 block mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>Responsable</strong>
                <span className="text-sm text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                  {historialSeleccionado.RESPONSABLE || historialSeleccionado.responsable || ''}
                </span>
              </div>
              <div>
                <strong className="text-sm text-gray-700 block mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>Fecha y Hora</strong>
                <span className="text-sm text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                  {formatearFecha(historialSeleccionado.FECHA_HORA || historialSeleccionado.fechaHora || '')}
                </span>
              </div>
              <div>
                <strong className="text-sm text-gray-700 block mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>Producto</strong>
                <span className="text-sm text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                  {historialSeleccionado.PRODUCTO || historialSeleccionado.producto || ''}
                </span>
              </div>
              <div>
                <strong className="text-sm text-gray-700 block mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>Categoría</strong>
                <span className="text-sm text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                  {historialSeleccionado.CATEGORIA || historialSeleccionado.categoria || ''}
                </span>
              </div>
              <div>
                <strong className="text-sm text-gray-700 block mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>Acción</strong>
                <span className="text-sm text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                  {historialSeleccionado.ACCION_REALIZADA || historialSeleccionado.accion || ''}
                </span>
              </div>
              <div>
                <strong className="text-sm text-gray-700 block mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>Stock Final</strong>
                <span className="text-sm text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                  {historialSeleccionado['CANTIDAD FINAL'] || historialSeleccionado.cantidadCajas || 0} cajas
                </span>
              </div>
              {(historialSeleccionado.MOTIVO || historialSeleccionado.motivo) && (
                <div className="col-span-2">
                  <strong className="text-sm text-gray-700 block mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>Motivo</strong>
                  <span className="text-sm text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                    {historialSeleccionado.MOTIVO || historialSeleccionado.motivo || ''}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

