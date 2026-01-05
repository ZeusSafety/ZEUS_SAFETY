"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/context/AuthContext";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";

const API_URL = '/api/descuento-cajas';
const registrosPorPagina = 15;

export default function HistorialCajasMalvinasPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Estados para Historial de Movimientos
  const [historialCompleto, setHistorialCompleto] = useState([]);
  const [historialFiltrado, setHistorialFiltrado] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [paginaActualHistorial, setPaginaActualHistorial] = useState(1);
  const [tipoFiltroActivo, setTipoFiltroActivo] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [responsable, setResponsable] = useState('');
  const [buscadorProducto, setBuscadorProducto] = useState('');
  const [sugerenciasProductos, setSugerenciasProductos] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [responsables, setResponsables] = useState([]);
  const [filasExpandidas, setFilasExpandidas] = useState(new Set());

  // Estados para Actualizaciones de Stock - Logística
  const [historialLogistica, setHistorialLogistica] = useState([]);
  const [historialLogisticaFiltrado, setHistorialLogisticaFiltrado] = useState([]);
  const [cargandoLogistica, setCargandoLogistica] = useState(false);
  const [paginaActualLogistica, setPaginaActualLogistica] = useState(1);
  const [fechaInicioLogistica, setFechaInicioLogistica] = useState('');
  const [fechaFinLogistica, setFechaFinLogistica] = useState('');
  const [responsableLogistica, setResponsableLogistica] = useState('');
  const [buscadorProductoLogistica, setBuscadorProductoLogistica] = useState('');
  const [sugerenciasProductosLogistica, setSugerenciasProductosLogistica] = useState([]);
  const [mostrarSugerenciasLogistica, setMostrarSugerenciasLogistica] = useState(false);
  const responsablesLogistica = ['JOSEPH', 'MANUEL', 'HERVIN'];

  const buscadorRef = useRef(null);
  const sugerenciasRef = useRef(null);
  const buscadorLogisticaRef = useRef(null);
  const sugerenciasLogisticaRef = useRef(null);

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

  // Ocultar chatbot
  useEffect(() => {
    const hideChatbot = () => {
      const chatbotButton = document.querySelector('[aria-label="Abrir chatbot"]');
      if (chatbotButton) {
        chatbotButton.style.display = 'none';
      }
      const chatbotWindow = document.querySelector('.fixed.bottom-24.right-6');
      if (chatbotWindow) {
        chatbotWindow.style.display = 'none';
      }
    };
    hideChatbot();
    const observer = new MutationObserver(hideChatbot);
    observer.observe(document.body, { childList: true, subtree: true });
    const interval = setInterval(hideChatbot, 100);
    return () => {
      observer.disconnect();
      clearInterval(interval);
      const chatbotButton = document.querySelector('[aria-label="Abrir chatbot"]');
      if (chatbotButton) {
        chatbotButton.style.display = '';
      }
    };
  }, []);

  useEffect(() => {
    if (user) {
      cargarDatos();
    }
  }, [user]);

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (buscadorRef.current && !buscadorRef.current.contains(event.target) && 
          sugerenciasRef.current && !sugerenciasRef.current.contains(event.target)) {
        setMostrarSugerencias(false);
      }
      if (buscadorLogisticaRef.current && !buscadorLogisticaRef.current.contains(event.target) && 
          sugerenciasLogisticaRef.current && !sugerenciasLogisticaRef.current.contains(event.target)) {
        setMostrarSugerenciasLogistica(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cargar datos iniciales
  const cargarDatos = async () => {
    await Promise.all([
      cargarHistorial(),
      cargarLogistica()
    ]);
  };

  // Cargar historial de movimientos
  const cargarHistorial = async () => {
    setCargandoHistorial(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(`${API_URL}/historial-anidado`, {
        method: 'GET',
        headers: headers
      });
      if (!response.ok) throw new Error(`Error ${response.status}`);
      const data = await response.json();
      const historial = data.data || [];
      setHistorialCompleto(historial);
      
      // Extraer responsables únicos
      const responsablesUnicos = [...new Set(historial.map(h => h.responsable).filter(Boolean))];
      setResponsables(responsablesUnicos);
      
      aplicarFiltrosHistorial(historial);
    } catch (error) {
      console.error('Error cargando historial:', error);
      alert('Error al cargar el historial: ' + error.message);
    } finally {
      setCargandoHistorial(false);
    }
  };

  // Aplicar filtros al historial
  const aplicarFiltrosHistorial = (historialArray = historialCompleto) => {
    let filtrado = [...historialArray];

    if (fechaInicio) {
      const inicio = new Date(fechaInicio);
      filtrado = filtrado.filter(h => new Date(h.fecha_hora) >= inicio);
    }

    if (fechaFin) {
      const fin = new Date(fechaFin);
      fin.setHours(23, 59, 59, 999);
      filtrado = filtrado.filter(h => new Date(h.fecha_hora) <= fin);
    }

    if (responsable) {
      filtrado = filtrado.filter(h => h.responsable === responsable);
    }

    if (buscadorProducto) {
      const productoLower = buscadorProducto.toLowerCase();
      filtrado = filtrado.filter(h => 
        h.producto?.toLowerCase().includes(productoLower)
      );
    }

    if (tipoFiltroActivo) {
      filtrado = filtrado.filter(h => h.tipo === tipoFiltroActivo);
    }

    setHistorialFiltrado(filtrado);
    setPaginaActualHistorial(1);
  };

  // Cargar logística
  const cargarLogistica = async () => {
    setCargandoLogistica(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(`${API_URL}/historial-anidado`, {
        method: 'GET',
        headers: headers
      });
      if (!response.ok) throw new Error(`Error ${response.status}`);
      const data = await response.json();
      const logistica = Array.isArray(data) ? data : (data.data || []);
      setHistorialLogistica(logistica);
      aplicarFiltrosLogistica(logistica);
    } catch (error) {
      console.error('Error cargando logística:', error);
      alert('Error al cargar datos de logística: ' + error.message);
    } finally {
      setCargandoLogistica(false);
    }
  };

  // Aplicar filtros a logística
  const aplicarFiltrosLogistica = (logisticaArray = historialLogistica) => {
    let filtrado = [...logisticaArray];

    if (fechaInicioLogistica) {
      const inicio = new Date(fechaInicioLogistica);
      filtrado = filtrado.filter(h => new Date(h.fecha_hora_logistica) >= inicio);
    }

    if (fechaFinLogistica) {
      const fin = new Date(fechaFinLogistica);
      fin.setHours(23, 59, 59, 999);
      filtrado = filtrado.filter(h => new Date(h.fecha_hora_logistica) <= fin);
    }

    if (responsableLogistica) {
      filtrado = filtrado.filter(h => h.responsable === responsableLogistica);
    }

    if (buscadorProductoLogistica) {
      const productoLower = buscadorProductoLogistica.toLowerCase();
      filtrado = filtrado.filter(h => 
        h.producto?.toLowerCase().includes(productoLower)
      );
    }

    setHistorialLogisticaFiltrado(filtrado);
    setPaginaActualLogistica(1);
  };

  // Actualizar filtros cuando cambian
  useEffect(() => {
    if (historialCompleto.length > 0) {
      aplicarFiltrosHistorial();
    }
  }, [fechaInicio, fechaFin, responsable, buscadorProducto, tipoFiltroActivo]);

  useEffect(() => {
    if (historialLogistica.length > 0) {
      aplicarFiltrosLogistica();
    }
  }, [fechaInicioLogistica, fechaFinLogistica, responsableLogistica, buscadorProductoLogistica]);

  // Autocompletado de productos (historial)
  const buscarProductoConSugerencias = (valor) => {
    setBuscadorProducto(valor);
    if (valor.length < 2) {
      setMostrarSugerencias(false);
      return;
    }
    const productosUnicos = [...new Set(historialCompleto.map(h => ({
      producto: h.producto,
      categoria: h.categoria
    })))];
    const coincidencias = productosUnicos
      .filter(p => p.producto?.toLowerCase().includes(valor.toLowerCase()))
      .slice(0, 10);
    setSugerenciasProductos(coincidencias);
    setMostrarSugerencias(coincidencias.length > 0);
  };

  // Autocompletado de productos (logística)
  const buscarProductoLogisticaConSugerencias = (valor) => {
    setBuscadorProductoLogistica(valor);
    if (valor.length < 2) {
      setMostrarSugerenciasLogistica(false);
      return;
    }
    const productosUnicos = [...new Set(historialLogistica.map(h => ({
      producto: h.producto,
      categoria: h.categoria
    })))];
    const coincidencias = productosUnicos
      .filter(p => p.producto?.toLowerCase().includes(valor.toLowerCase()))
      .slice(0, 10);
    setSugerenciasProductosLogistica(coincidencias);
    setMostrarSugerenciasLogistica(coincidencias.length > 0);
  };

  // Calcular estadísticas
  const estadisticas = {
    total: historialFiltrado.length,
    salidas: historialFiltrado.filter(h => h.cantidad_salida > 0).length,
    reservas: historialFiltrado.filter(h => h.cantidad_reservada > 0).length,
    ingresos: historialFiltrado.filter(h => h.tipo === 'INGRESO').length
  };

  // Filtrar por tipo
  const filtrarPorTipo = (tipo) => {
    if (tipoFiltroActivo === tipo) {
      setTipoFiltroActivo('');
    } else {
      setTipoFiltroActivo(tipo);
    }
  };

  // Toggle fila expandida
  const toggleFilaExpandida = (id) => {
    const nuevas = new Set(filasExpandidas);
    if (nuevas.has(id)) {
      nuevas.delete(id);
    } else {
      nuevas.add(id);
    }
    setFilasExpandidas(nuevas);
  };

  // Formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    try {
      const date = new Date(fecha);
      return date.toLocaleString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return fecha;
    }
  };

  // Paginación historial
  const totalPaginasHistorial = Math.ceil(historialFiltrado.length / registrosPorPagina);
  const inicioHistorial = (paginaActualHistorial - 1) * registrosPorPagina;
  const finHistorial = inicioHistorial + registrosPorPagina;
  const registrosPaginaHistorial = historialFiltrado.slice(inicioHistorial, finHistorial);

  // Paginación logística
  const totalPaginasLogistica = Math.ceil(historialLogisticaFiltrado.length / registrosPorPagina);
  const inicioLogistica = (paginaActualLogistica - 1) * registrosPorPagina;
  const finLogistica = inicioLogistica + registrosPorPagina;
  const registrosPaginaLogistica = historialLogisticaFiltrado.slice(inicioLogistica, finLogistica);

  // Exportar Excel (Historial)
  const exportarExcelHistorial = async () => {
    if (historialFiltrado.length === 0) {
      alert('No hay datos para exportar');
      return;
    }
    try {
      const XLSX = (await import('xlsx')).default;
      const datosExcel = historialFiltrado.map(h => ({
        'ID': h.id,
        'Responsable': h.responsable,
        'Fecha y Hora': formatearFecha(h.fecha_hora),
        'Producto': h.producto,
        'Categoría': h.categoria,
        'Stock Inicial': h.stock_inicial,
        'Salida': h.cantidad_salida || 0,
        'Reserva': h.cantidad_reservada || 0,
        'Motivo': h.motivo || '',
        'Tipo': h.tipo
      }));
      const ws = XLSX.utils.json_to_sheet(datosExcel);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Historial");
      const fecha = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `Historial_Ventas_${fecha}.xlsx`);
    } catch (error) {
      console.error('Error exportando Excel:', error);
      alert('Error al exportar Excel');
    }
  };

  // Exportar PDF (Historial)
  const exportarPDFHistorial = async () => {
    if (historialFiltrado.length === 0) {
      alert('No hay datos para exportar');
      return;
    }
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      const doc = new jsPDF('l', 'mm', 'a4');
      doc.setFontSize(16);
      doc.setTextColor(30, 58, 95);
      doc.text('Historial de Gestión - Ventas por Cajas', 14, 15);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generado el: ${new Date().toLocaleString('es-PE')}`, 14, 22);
      const datosTabla = historialFiltrado.map(h => [
        h.id,
        h.responsable,
        formatearFecha(h.fecha_hora).split(',')[0],
        h.producto?.substring(0, 30) || '',
        h.categoria,
        h.stock_inicial,
        h.cantidad_salida || '-',
        h.cantidad_reservada || '-',
        h.tipo
      ]);
      autoTable(doc, {
        head: [['ID', 'Responsable', 'Fecha', 'Producto', 'Categoría', 'Stock', 'Salida', 'Reserva', 'Tipo']],
        body: datosTabla,
        startY: 28,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [30, 58, 95], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 14, right: 14 }
      });
      const fecha = new Date().toISOString().split('T')[0];
      doc.save(`Historial_Ventas_${fecha}.pdf`);
    } catch (error) {
      console.error('Error exportando PDF:', error);
      alert('Error al exportar PDF');
    }
  };

  // Exportar Excel (Logística)
  const exportarExcelLogistica = async () => {
    if (historialLogisticaFiltrado.length === 0) {
      alert('No hay datos para exportar');
      return;
    }
    try {
      const XLSX = (await import('xlsx')).default;
      const datosExcel = historialLogisticaFiltrado.map(h => {
        const diferencia = h.cantidad_despues_actualizar - h.cantidad_antes_actualizar;
        return {
          'ID': h.id_historial_logistica,
          'Responsable': h.responsable,
          'Fecha y Hora': formatearFecha(h.fecha_hora_logistica),
          'Producto': h.producto,
          'Categoría': h.categoria,
          'Cantidad Antes': h.cantidad_antes_actualizar,
          'Cantidad Después': h.cantidad_despues_actualizar,
          'Diferencia': diferencia,
          'Motivo': h.motivo || ''
        };
      });
      const ws = XLSX.utils.json_to_sheet(datosExcel);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Logistica");
      const fecha = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `Logistica_Stock_${fecha}.xlsx`);
    } catch (error) {
      console.error('Error exportando Excel:', error);
      alert('Error al exportar Excel');
    }
  };

  // Exportar PDF (Logística)
  const exportarPDFLogistica = async () => {
    if (historialLogisticaFiltrado.length === 0) {
      alert('No hay datos para exportar');
      return;
    }
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      const doc = new jsPDF('l', 'mm', 'a4');
      doc.setFontSize(16);
      doc.setTextColor(30, 58, 95);
      doc.text('Actualización Logística del Stock', 14, 15);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generado el: ${new Date().toLocaleString('es-PE')}`, 14, 22);
      const datosTabla = historialLogisticaFiltrado.map(h => {
        const diferencia = h.cantidad_despues_actualizar - h.cantidad_antes_actualizar;
        return [
          h.id_historial_logistica,
          h.responsable,
          formatearFecha(h.fecha_hora_logistica).split(',')[0],
          h.producto?.substring(0, 30) || '',
          h.categoria,
          h.cantidad_antes_actualizar,
          h.cantidad_despues_actualizar,
          `${diferencia >= 0 ? '+' : ''}${diferencia}`,
          h.motivo || '-'
        ];
      });
      autoTable(doc, {
        head: [['ID', 'Responsable', 'Fecha', 'Producto', 'Categoría', 'Antes', 'Después', 'Diferencia', 'Motivo']],
        body: datosTabla,
        startY: 28,
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [30, 58, 95], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 14, right: 14 }
      });
      const fecha = new Date().toISOString().split('T')[0];
      doc.save(`Logistica_Stock_${fecha}.pdf`);
    } catch (error) {
      console.error('Error exportando PDF:', error);
      alert('Error al exportar PDF');
    }
  };

  // Limpiar filtros
  const limpiarFiltrosHistorial = () => {
    setFechaInicio('');
    setFechaFin('');
    setResponsable('');
    setBuscadorProducto('');
    setTipoFiltroActivo('');
  };

  const limpiarFiltrosLogistica = () => {
    setFechaInicioLogistica('');
    setFechaFinLogistica('');
    setResponsableLogistica('');
    setBuscadorProductoLogistica('');
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
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          [aria-label="Abrir chatbot"] {
            display: none !important;
          }
          .fixed.bottom-24.right-6.w-80 {
            display: none !important;
          }
        `
      }} />
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
                className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-lg font-medium hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm ripple-effect relative overflow-hidden text-sm group"
                style={{ fontFamily: 'var(--font-poppins)' }}
              >
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                <span>Volver a Logística</span>
              </button>

              {/* CONTENEDOR PRINCIPAL CON AMBAS SECCIONES */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6 mb-6">
                {/* Header dentro del cuadro */}
                <div className="mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-xl flex items-center justify-center text-white shadow-sm">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h1 className="text-lg font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'var(--font-poppins)' }}>
                        HISTORIAL DE GESTION - VENTAS POR CAJAS MALVINAS
                      </h1>
                      <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: 'var(--font-poppins)' }}>
                        Gestiona el historial de movimientos y actualizaciones de stock
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 rounded-lg px-3 py-1.5 bg-green-50 border border-green-200">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-semibold text-green-700" style={{ fontFamily: 'var(--font-poppins)' }}>API Conectada</span>
                    </div>
                  </div>
                </div>

                {/* SECCIÓN 1: HISTORIAL DE MOVIMIENTOS */}
                <div className="mb-8">
                {/* Filtros */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200/60 p-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                        Fecha Inicio
                      </label>
                      <input
                        type="date"
                        value={fechaInicio}
                        onChange={(e) => setFechaInicio(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                        style={{ fontFamily: 'var(--font-poppins)' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                        Fecha Fin
                      </label>
                      <input
                        type="date"
                        value={fechaFin}
                        onChange={(e) => setFechaFin(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                        style={{ fontFamily: 'var(--font-poppins)' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                        Responsable
                      </label>
                      <select
                        value={responsable}
                        onChange={(e) => setResponsable(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                        style={{ fontFamily: 'var(--font-poppins)' }}
                      >
                        <option value="">Todos los responsables</option>
                        {responsables.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                    <div className="relative" ref={buscadorRef}>
                      <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                        Buscar Producto
                      </label>
                      <input
                        type="text"
                        value={buscadorProducto}
                        onChange={(e) => buscarProductoConSugerencias(e.target.value)}
                        placeholder="Escribe para buscar..."
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
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
                                setBuscadorProducto(prod.producto);
                                setMostrarSugerencias(false);
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                            >
                              <div className="text-sm font-medium text-gray-900">{prod.producto}</div>
                              <div className="text-xs text-gray-500">Categoría: {prod.categoria}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={exportarExcelHistorial}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Exportar Excel</span>
                    </button>
                    <button
                      onClick={exportarPDFHistorial}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <span>Generar PDF</span>
                    </button>
                    <button
                      onClick={limpiarFiltrosHistorial}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-br from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Limpiar Filtros</span>
                    </button>
                  </div>
                </div>

                {/* Estadísticas */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200/60 p-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div
                      onClick={() => filtrarPorTipo('')}
                      className={`bg-white rounded-xl shadow-lg border-l-4 p-4 cursor-pointer transition-all duration-200 hover:shadow-xl ${
                        tipoFiltroActivo === '' ? 'border-blue-700 bg-blue-50' : 'border-blue-700'
                      }`}
                    >
                      <div className="text-sm font-semibold text-gray-600 mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>
                        Total de Registros
                      </div>
                      <div className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                        {estadisticas.total}
                      </div>
                    </div>
                    <div
                      onClick={() => filtrarPorTipo('SALIDA')}
                      className={`bg-white rounded-xl shadow-lg border-l-4 p-4 cursor-pointer transition-all duration-200 hover:shadow-xl ${
                        tipoFiltroActivo === 'SALIDA' ? 'border-red-600 bg-red-50' : 'border-red-600'
                      }`}
                    >
                      <div className="text-sm font-semibold text-gray-600 mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>
                        Salidas
                      </div>
                      <div className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                        {estadisticas.salidas}
                      </div>
                    </div>
                    <div
                      onClick={() => filtrarPorTipo('RESERVA')}
                      className={`bg-white rounded-xl shadow-lg border-l-4 p-4 cursor-pointer transition-all duration-200 hover:shadow-xl ${
                        tipoFiltroActivo === 'RESERVA' ? 'border-yellow-500 bg-yellow-50' : 'border-yellow-500'
                      }`}
                    >
                      <div className="text-sm font-semibold text-gray-600 mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>
                        Reservas
                      </div>
                      <div className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                        {estadisticas.reservas}
                      </div>
                    </div>
                    <div
                      onClick={() => filtrarPorTipo('INGRESO')}
                      className={`bg-white rounded-xl shadow-lg border-l-4 p-4 cursor-pointer transition-all duration-200 hover:shadow-xl ${
                        tipoFiltroActivo === 'INGRESO' ? 'border-green-600 bg-green-50' : 'border-green-600'
                      }`}
                    >
                      <div className="text-sm font-semibold text-gray-600 mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>
                        Ingresos
                      </div>
                      <div className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                        {estadisticas.ingresos}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabla Historial */}
                <div className="mb-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-xl flex items-center justify-center text-white shadow-sm">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                        Historial de movimientos
                      </h2>
                      <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: 'var(--font-poppins)' }}>
                        Registro completo de salidas, reservas e ingresos de productos
                      </p>
                    </div>
                  </div>
                  {cargandoHistorial ? (
                    <div className="text-center py-12 text-gray-600">Cargando historial...</div>
                  ) : (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gradient-to-r from-blue-700 to-blue-800 border-b-2 border-blue-900">
                              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>ID</th>
                              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Responsable</th>
                              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Fecha y Hora</th>
                              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Producto</th>
                              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Categoría</th>
                              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Stock Inicial</th>
                              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Salida</th>
                              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Reserva</th>
                              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Motivo</th>
                              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Tipo</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {registrosPaginaHistorial.length === 0 ? (
                              <tr>
                                <td colSpan={10} className="px-4 py-8 text-center text-gray-600">
                                  No hay registros disponibles
                                </td>
                              </tr>
                            ) : (
                              registrosPaginaHistorial.map((h) => {
                                const esExpandible = h.tipo === 'RESERVA' && h.movimientos && h.movimientos.length > 0;
                                const expandida = filasExpandidas.has(h.id);
                                const badgeClass = h.tipo === 'SALIDA' ? 'bg-red-600' : 
                                                  h.tipo === 'RESERVA' ? 'bg-yellow-500' : 
                                                  h.tipo === 'INGRESO' ? 'bg-green-600' : 'bg-blue-600';
                                
                                return (
                                  <React.Fragment key={h.id}>
                                    <tr
                                      onClick={() => esExpandible && toggleFilaExpandida(h.id)}
                                      className={`hover:bg-blue-50 transition-all duration-200 border-b border-gray-100 ${esExpandible ? 'cursor-pointer' : ''}`}
                                    >
                                      <td className="px-4 py-3 whitespace-nowrap text-[10px] font-medium text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                                        {esExpandible && (
                                          <span className={`inline-block mr-2 transition-transform ${expandida ? 'rotate-90' : ''}`}>
                                            ▶
                                          </span>
                                        )}
                                        {h.id}
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap text-[10px] font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                                        {h.responsable}
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>
                                        {formatearFecha(h.fecha_hora)}
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>
                                        {h.producto}
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>
                                        {h.categoria}
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>
                                        {h.stock_inicial}
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>
                                        {h.cantidad_salida || '-'}
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>
                                        {h.cantidad_reservada || '-'}
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>
                                        {h.motivo || '-'}
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold text-white ${badgeClass}`}>
                                          {h.tipo}
                                        </span>
                                      </td>
                                    </tr>
                                    {expandida && h.movimientos && h.movimientos.length > 0 && (
                                      <tr key={`${h.id}-detalle`} className="bg-gray-50">
                                        <td colSpan={10} className="px-4 py-4">
                                          <div className="text-sm font-bold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-poppins)' }}>
                                            Detalles de la Reserva: {h.producto} (Cantidad Reservada: {h.cantidad_reservada})
                                          </div>
                                          <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                                            <div className="overflow-x-auto">
                                              <table className="w-full">
                                                  <thead>
                                                    <tr className="bg-gradient-to-r from-yellow-400 to-yellow-500 border-b-2 border-yellow-600">
                                                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-900 whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Fecha y Hora</th>
                                                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-900 whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Responsable</th>
                                                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-900 whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Salida</th>
                                                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-900 whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Regreso</th>
                                                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-900 whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Motivo</th>
                                                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-900 whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Tipo</th>
                                                    </tr>
                                                  </thead>
                                                  <tbody className="divide-y divide-gray-100">
                                                    {h.movimientos.map((m, idx) => {
                                                      const tipoMov = m.tipo || (m.regreso > 0 ? 'REGRESO' : 'SALIDA');
                                                      const movKey = m.id || m.fecha_hora || `mov-${h.id}-${idx}`;
                                                      return (
                                                        <tr key={movKey} className="hover:bg-blue-50 transition-colors border-b border-gray-100">
                                                          <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{formatearFecha(m.fecha_hora)}</td>
                                                          <td className="px-4 py-3 whitespace-nowrap text-[10px] font-medium text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>{m.responsable}</td>
                                                          <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{m.salida || '-'}</td>
                                                          <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{m.regreso || '-'}</td>
                                                          <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{m.motivo || '-'}</td>
                                                          <td className="px-4 py-3 whitespace-nowrap">
                                                            <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-[10px] font-semibold text-white ${
                                                              tipoMov === 'REGRESO' 
                                                                ? 'bg-gradient-to-br from-blue-600 to-blue-700' 
                                                                : 'bg-gradient-to-br from-red-600 to-red-700'
                                                            }`} style={{ fontFamily: 'var(--font-poppins)' }}>
                                                              {tipoMov}
                                                            </span>
                                                          </td>
                                                        </tr>
                                                      );
                                                    })}
                                                  </tbody>
                                                </table>
                                              </div>
                                            </div>
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                      {/* Paginación */}
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 flex items-center justify-between border-t border-gray-200">
                        <button
                          onClick={() => setPaginaActualHistorial(1)}
                          disabled={paginaActualHistorial === 1}
                          className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                          style={{ fontFamily: 'var(--font-poppins)' }}
                        >
                          «
                        </button>
                        <button
                          onClick={() => setPaginaActualHistorial(prev => Math.max(1, prev - 1))}
                          disabled={paginaActualHistorial === 1}
                          className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                          style={{ fontFamily: 'var(--font-poppins)' }}
                        >
                          &lt;
                        </button>
                        <span className="text-xs text-gray-700 font-semibold" style={{ fontFamily: 'var(--font-poppins)' }}>
                          Página {paginaActualHistorial} de {totalPaginasHistorial || 1} ({historialFiltrado.length} registros)
                        </span>
                        <button
                          onClick={() => setPaginaActualHistorial(prev => Math.min(totalPaginasHistorial, prev + 1))}
                          disabled={paginaActualHistorial >= totalPaginasHistorial}
                          className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                          style={{ fontFamily: 'var(--font-poppins)' }}
                        >
                          &gt;
                        </button>
                        <button
                          onClick={() => setPaginaActualHistorial(totalPaginasHistorial)}
                          disabled={paginaActualHistorial >= totalPaginasHistorial}
                          className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                          style={{ fontFamily: 'var(--font-poppins)' }}
                        >
                          »
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                </div>

                {/* SECCIÓN 2: ACTUALIZACIONES DE STOCK - LOGÍSTICA */}
                <div className="mt-8">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-xl flex items-center justify-center text-white shadow-sm">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                        Actualizaciones de stock - Logistica
                      </h2>
                      <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: 'var(--font-poppins)' }}>
                        Registro de cambios en el inventario de productos
                      </p>
                    </div>
                  </div>

                {/* Filtros Logística */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200/60 p-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                        Fecha Inicio
                      </label>
                      <input
                        type="date"
                        value={fechaInicioLogistica}
                        onChange={(e) => setFechaInicioLogistica(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                        style={{ fontFamily: 'var(--font-poppins)' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                        Fecha Fin
                      </label>
                      <input
                        type="date"
                        value={fechaFinLogistica}
                        onChange={(e) => setFechaFinLogistica(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                        style={{ fontFamily: 'var(--font-poppins)' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                        Responsable
                      </label>
                      <select
                        value={responsableLogistica}
                        onChange={(e) => setResponsableLogistica(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                        style={{ fontFamily: 'var(--font-poppins)' }}
                      >
                        <option value="">Todos los responsables</option>
                        {responsablesLogistica.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                    <div className="relative" ref={buscadorLogisticaRef}>
                      <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                        Buscar Producto
                      </label>
                      <input
                        type="text"
                        value={buscadorProductoLogistica}
                        onChange={(e) => buscarProductoLogisticaConSugerencias(e.target.value)}
                        placeholder="Escribe el producto o código"
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                        style={{ fontFamily: 'var(--font-poppins)' }}
                      />
                      {mostrarSugerenciasLogistica && sugerenciasProductosLogistica.length > 0 && (
                        <div
                          ref={sugerenciasLogisticaRef}
                          className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                        >
                          {sugerenciasProductosLogistica.map((prod, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => {
                                setBuscadorProductoLogistica(prod.producto);
                                setMostrarSugerenciasLogistica(false);
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                            >
                              <div className="text-sm font-medium text-gray-900">{prod.producto}</div>
                              <div className="text-xs text-gray-500">Categoría: {prod.categoria}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={exportarExcelLogistica}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Exportar a Excel</span>
                    </button>
                    <button
                      onClick={exportarPDFLogistica}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <span>Exportar a PDF</span>
                    </button>
                    <button
                      onClick={limpiarFiltrosLogistica}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-br from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Limpiar Filtros</span>
                    </button>
                  </div>
                </div>

                {/* Tabla Logística */}
                {cargandoLogistica ? (
                  <div className="text-center py-12 text-gray-600">Cargando datos de logística...</div>
                ) : (
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gradient-to-r from-blue-700 to-blue-800 border-b-2 border-blue-900">
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>ID</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Responsable</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Fecha y Hora</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Producto</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Categoría</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Cantidad Inicial</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Cantidad Actual</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Motivo</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {registrosPaginaLogistica.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="px-4 py-8 text-center text-gray-600">
                                No hay registros de actualización logística
                              </td>
                            </tr>
                          ) : (
                            registrosPaginaLogistica.map((h, index) => {
                              const diferencia = h.cantidad_despues_actualizar - h.cantidad_antes_actualizar;
                              const colorDif = diferencia >= 0 ? 'text-green-700' : 'text-red-700';
                              const uniqueKey = h.id_historial_logistica || 
                                `logistica-${h.fecha_hora_logistica}-${h.producto}-${h.responsable}-${index}`;
                              return (
                                <tr key={uniqueKey} className="hover:bg-blue-50 transition-all duration-200 border-b border-gray-100">
                                  <td className="px-4 py-3 whitespace-nowrap text-[10px] font-medium text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                                    {h.id_historial_logistica}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-[10px] font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                                    {h.responsable}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>
                                    {formatearFecha(h.fecha_hora_logistica)}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>
                                    {h.producto}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>
                                    {h.categoria}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>
                                    {h.cantidad_antes_actualizar}
                                  </td>
                                  <td className={`px-4 py-3 whitespace-nowrap text-[10px] font-bold ${colorDif}`} style={{ fontFamily: 'var(--font-poppins)' }}>
                                    {h.cantidad_despues_actualizar} ({diferencia >= 0 ? '+' : ''}{diferencia})
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>
                                    {h.motivo || '-'}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                    {/* Paginación */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 flex items-center justify-between border-t border-gray-200">
                        <button
                          onClick={() => setPaginaActualLogistica(1)}
                          disabled={paginaActualLogistica === 1}
                          className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                          style={{ fontFamily: 'var(--font-poppins)' }}
                        >
                          «
                        </button>
                        <button
                          onClick={() => setPaginaActualLogistica(prev => Math.max(1, prev - 1))}
                          disabled={paginaActualLogistica === 1}
                          className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                          style={{ fontFamily: 'var(--font-poppins)' }}
                        >
                          &lt;
                        </button>
                        <span className="text-xs text-gray-700 font-semibold" style={{ fontFamily: 'var(--font-poppins)' }}>
                          Página {paginaActualLogistica} de {totalPaginasLogistica || 1} ({historialLogisticaFiltrado.length} registros)
                        </span>
                        <button
                          onClick={() => setPaginaActualLogistica(prev => Math.min(totalPaginasLogistica, prev + 1))}
                          disabled={paginaActualLogistica >= totalPaginasLogistica}
                          className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                          style={{ fontFamily: 'var(--font-poppins)' }}
                        >
                          &gt;
                        </button>
                        <button
                          onClick={() => setPaginaActualLogistica(totalPaginasLogistica)}
                          disabled={paginaActualLogistica >= totalPaginasLogistica}
                          className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                          style={{ fontFamily: 'var(--font-poppins)' }}
                        >
                          »
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
