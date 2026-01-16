"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/context/AuthContext";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";
import * as XLSX from "xlsx";

// Usar el proxy de Next.js para evitar problemas de CORS
const API_URL = "/api/logs-sesion-general";

export default function RegistroActividadGeneralPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [errorAPI, setErrorAPI] = useState(null);

  // Calendario
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState("table"); // "calendar" o "table"
  
  // Paginación para la vista de tabla
  const [currentPageTable, setCurrentPageTable] = useState(1);
  const itemsPerPageTable = 10;

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Detectar si es desktop y abrir sidebar automáticamente
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

  // Cargar logs desde la API
  useEffect(() => {
    if (user) {
      cargarLogs();
    }
  }, [user]);

  const cargarLogs = async () => {
    try {
      setLoadingData(true);
      setErrorAPI(null);
      
      // Obtener el token de autenticación
      const token = localStorage.getItem("token");
      
      // Construir la URL con los parámetros opcionales
      const queryParams = new URLSearchParams();
      queryParams.append("limit", "250");
      queryParams.append("offset", "0");
      
      const response = await fetch(
        `${API_URL}?${queryParams.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || `Error HTTP: ${response.status}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Logs generales recibidos de la API:', data);
      
      // La API puede devolver un array directamente o un objeto con una propiedad
      let logsData = [];
      if (Array.isArray(data)) {
        logsData = data;
      } else if (data.logs || data.data) {
        logsData = data.logs || data.data || [];
      } else if (data.success && data.data) {
        logsData = Array.isArray(data.data) ? data.data : [];
      }

      setLogs(logsData);
      setErrorAPI(null);
    } catch (error) {
      console.error("Error al obtener logs:", error);
      setLogs([]);
      setErrorAPI(error.message || "Error al cargar los logs de actividad");
    } finally {
      setLoadingData(false);
    }
  };

  // Procesar logs para agrupar por día
  const logsPorDia = useMemo(() => {
    const agrupados = {};
    logs.forEach((log) => {
      const fechaStr = log.FECHA_HORA || log.fecha_hora || log.FECHA || log.fecha || log.timestamp || log.TIMESTAMP;
      if (!fechaStr) return;
      
      try {
        let date;
        if (typeof fechaStr === 'string' && fechaStr.includes(' ')) {
          const [datePart] = fechaStr.split(' ');
          const [year, month, day] = datePart.split('-');
          date = new Date(year, month - 1, day);
        } else {
          date = new Date(fechaStr);
        }
        
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        if (!agrupados[key]) {
          agrupados[key] = [];
        }
        agrupados[key].push(log);
      } catch (e) {
        console.error("Error procesando fecha:", e);
      }
    });
    return agrupados;
  }, [logs]);

  // Obtener días con actividad para el mes actual
  const diasConActividad = useMemo(() => {
    const dias = new Set();
    Object.keys(logsPorDia).forEach((key) => {
      const [year, month, day] = key.split('-');
      if (parseInt(year) === currentYear && parseInt(month) - 1 === currentMonth) {
        dias.add(parseInt(day));
      }
    });
    return dias;
  }, [logsPorDia, currentYear, currentMonth]);

  // Generar calendario del mes
  const generarCalendario = () => {
    const primerDia = new Date(currentYear, currentMonth, 1);
    const ultimoDia = new Date(currentYear, currentMonth + 1, 0);
    const diasEnMes = ultimoDia.getDate();
    const diaInicioSemana = primerDia.getDay(); // 0 = Domingo, 1 = Lunes, etc.

    const semanas = [];
    let semana = [];
    
    // Agregar días vacíos al inicio
    for (let i = 0; i < diaInicioSemana; i++) {
      semana.push(null);
    }

    // Agregar días del mes
    for (let dia = 1; dia <= diasEnMes; dia++) {
      semana.push(dia);
      if (semana.length === 7) {
        semanas.push(semana);
        semana = [];
      }
    }

    // Completar última semana con días vacíos
    if (semana.length > 0) {
      while (semana.length < 7) {
        semana.push(null);
      }
      semanas.push(semana);
    }

    return semanas;
  };

  const semanasCalendario = generarCalendario();

  // Navegar meses
  const cambiarMes = (direccion) => {
    if (direccion === 'anterior') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
    setSelectedDate(null);
  };

  // Obtener logs del día seleccionado
  const logsDelDia = useMemo(() => {
    if (!selectedDate) return [];
    const key = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
    return logsPorDia[key] || [];
  }, [selectedDate, currentYear, currentMonth, logsPorDia]);

  // Nombres de meses y días
  const nombresMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const nombresDias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  // Función para descargar logs en Excel
  const descargarExcel = () => {
    if (logs.length === 0) {
      alert("No hay logs para descargar");
      return;
    }

    try {
      // Preparar los datos para Excel
      const datosExcel = logs.map((log) => {
        const fechaStr = log.FECHA_HORA || log.fecha_hora || log.FECHA || log.fecha || log.timestamp || log.TIMESTAMP || "";
        
        // Formatear fecha para Excel
        let fechaFormateada = "";
        let horaFormateada = "";
        
        if (fechaStr) {
          try {
            let date;
            if (typeof fechaStr === 'string' && fechaStr.includes(' ')) {
              const [datePart, timePart] = fechaStr.split(' ');
              const [year, month, day] = datePart.split('-');
              const [hours, minutes, seconds] = timePart.split(':');
              date = new Date(year, month - 1, day, hours, minutes, seconds);
            } else {
              date = new Date(fechaStr);
            }
            
            // Formato de fecha: DD/MM/YYYY
            const dia = String(date.getDate()).padStart(2, "0");
            const mes = String(date.getMonth() + 1).padStart(2, "0");
            const año = date.getFullYear();
            fechaFormateada = `${dia}/${mes}/${año}`;
            
            // Formato de hora: HH:MM:SS
            const horas = String(date.getHours()).padStart(2, "0");
            const minutos = String(date.getMinutes()).padStart(2, "0");
            const segundos = String(date.getSeconds()).padStart(2, "0");
            horaFormateada = `${horas}:${minutos}:${segundos}`;
          } catch (e) {
            fechaFormateada = fechaStr;
            horaFormateada = "";
          }
        }

        return {
          "Nombre": log.NOMBRE || log.nombre || "N/A",
          "Apellido": log.APELLIDO || log.apellido || "N/A",
          "Fecha": fechaFormateada,
          "Hora": horaFormateada,
          "Fecha/Hora Completa": fechaStr || "N/A"
        };
      });

      // Crear un nuevo libro de trabajo
      const wb = XLSX.utils.book_new();
      
      // Crear una hoja de trabajo desde los datos
      const ws = XLSX.utils.json_to_sheet(datosExcel);
      
      // Ajustar el ancho de las columnas
      const columnWidths = [
        { wch: 15 }, // Nombre
        { wch: 15 }, // Apellido
        { wch: 12 }, // Fecha
        { wch: 10 }, // Hora
        { wch: 20 }  // Fecha/Hora Completa
      ];
      ws['!cols'] = columnWidths;
      
      // Agregar la hoja al libro
      XLSX.utils.book_append_sheet(wb, ws, "Logs de Actividad");
      
      // Generar el nombre del archivo con la fecha actual
      const fechaActual = new Date();
      const dia = String(fechaActual.getDate()).padStart(2, "0");
      const mes = String(fechaActual.getMonth() + 1).padStart(2, "0");
      const año = fechaActual.getFullYear();
      const nombreArchivo = `Logs_Actividad_General_${dia}-${mes}-${año}.xlsx`;
      
      // Descargar el archivo
      XLSX.writeFile(wb, nombreArchivo);
    } catch (error) {
      console.error("Error al generar Excel:", error);
      alert("Error al generar el archivo Excel. Por favor, intente nuevamente.");
    }
  };

  // Formatear fecha con diseño tipo calendario
  const formatearFecha = (fecha) => {
    if (!fecha) return <span className="text-gray-400">N/A</span>;
    try {
      // Manejar formato "2025-12-23 14:31:47" del backend
      let date;
      if (typeof fecha === 'string' && fecha.includes(' ')) {
        // Formato: "YYYY-MM-DD HH:mm:ss"
        const [datePart, timePart] = fecha.split(' ');
        const [year, month, day] = datePart.split('-');
        const [hours, minutes, seconds] = timePart.split(':');
        date = new Date(year, month - 1, day, hours, minutes, seconds);
      } else {
        date = new Date(fecha);
      }
      
      const dia = String(date.getDate()).padStart(2, "0");
      const mes = String(date.getMonth() + 1).padStart(2, "0");
      const año = date.getFullYear();
      const horas = String(date.getHours()).padStart(2, "0");
      const minutos = String(date.getMinutes()).padStart(2, "0");
      const segundos = String(date.getSeconds()).padStart(2, "0");
      
      // Nombres de meses en español
      const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
      const nombreMes = meses[date.getMonth()];
      
      // Nombres de días de la semana
      const diasSemana = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
      const nombreDia = diasSemana[date.getDay()];
      
      return (
        <div className="flex items-center space-x-2">
          <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 shadow-sm">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>{dia} {nombreMes} {año}</span>
              <span className="text-[9px] text-gray-500 font-medium" style={{ fontFamily: 'var(--font-poppins)' }}>({nombreDia})</span>
            </div>
            <div className="flex items-center space-x-1">
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-[9px] text-gray-600 font-medium" style={{ fontFamily: 'var(--font-poppins)' }}>{horas}:{minutos}:{segundos}</span>
            </div>
          </div>
        </div>
      );
    } catch (e) {
      console.error("Error al formatear fecha:", e, fecha);
      return <span className="text-gray-400">{fecha}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
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
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${
          sidebarOpen ? "lg:ml-60 ml-0" : "ml-0"
        }`}
      >
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto custom-scrollbar" style={{ background: '#F7FAFF' }}>
          <div className="max-w-[95%] mx-auto px-4 py-4">
            {/* Botón Volver */}
            <button
              onClick={() => router.push("/gerencia")}
              className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-lg font-medium hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm ripple-effect relative overflow-hidden text-sm group"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver a Gerencia</span>
            </button>

            {/* Contenedor principal con fondo blanco */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6 mb-6">
              {/* Título con icono y API Conectada */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#002D5A] to-[#002D5A] rounded-xl flex items-center justify-center text-white shadow-sm">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>Registro de Actividad</h1>
                    <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: 'var(--font-poppins)' }}>
                      Logs generales de sesión y actividad
                    </p>
                  </div>
                </div>
                {loadingData ? (
                  <div className="flex items-center space-x-2 rounded-lg px-3 py-1.5 bg-yellow-50 border border-yellow-200">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                    <span className="text-sm font-semibold text-yellow-700">Cargando...</span>
                  </div>
                ) : errorAPI ? (
                  <div className="flex items-center space-x-2 rounded-lg px-3 py-1.5 bg-red-50 border border-red-200">
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-sm font-semibold text-red-700">Error</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 rounded-lg px-3 py-1.5 bg-green-50 border border-green-200">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-semibold text-green-700" style={{ fontFamily: 'var(--font-poppins)' }}>API Conectada</span>
                  </div>
                )}
              </div>

              {/* Selector de vista y botón de descarga */}
              <div className="mb-4 flex items-center justify-between">
                <button
                  onClick={descargarExcel}
                  disabled={loadingData || logs.length === 0}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-semibold hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 active:scale-[0.98] text-xs"
                  style={{ fontFamily: 'var(--font-poppins)' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3" />
                  </svg>
                  <span>Descargar Excel</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setViewMode("calendar");
                      setCurrentPageTable(1);
                    }}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                      viewMode === "calendar"
                        ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md hover:shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm"
                    }`}
                    style={{ fontFamily: 'var(--font-poppins)' }}
                  >
                    <div className="flex items-center space-x-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Calendario</span>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setViewMode("table");
                      setCurrentPageTable(1);
                    }}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                      viewMode === "table"
                        ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md hover:shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm"
                    }`}
                    style={{ fontFamily: 'var(--font-poppins)' }}
                  >
                    <div className="flex items-center space-x-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Tabla</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Contenido según modo de vista */}
              {loadingData ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
                </div>
              ) : errorAPI ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <p className="text-red-800 font-semibold">{errorAPI}</p>
                  <button
                    onClick={cargarLogs}
                    className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    Reintentar
                  </button>
                </div>
              ) : logs.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-600 font-semibold">No hay registros de actividad disponibles</p>
                </div>
              ) : viewMode === "calendar" ? (
                <>
                  {/* Calendario */}
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden mb-6">
                    {/* Header del calendario */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4 flex items-center justify-between">
                      <button
                        onClick={() => cambiarMes('anterior')}
                        className="p-2.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all duration-200 hover:scale-110 active:scale-95"
                        style={{ fontFamily: 'var(--font-poppins)' }}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <div className="text-center">
                        <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-poppins)' }}>{nombresMeses[currentMonth]} {currentYear}</h2>
                        <p className="text-[10px] text-blue-100 mt-0.5" style={{ fontFamily: 'var(--font-poppins)' }}>{diasConActividad.size} días con actividad</p>
                      </div>
                      <button
                        onClick={() => cambiarMes('siguiente')}
                        className="p-2.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all duration-200 hover:scale-110 active:scale-95"
                        style={{ fontFamily: 'var(--font-poppins)' }}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>

                    {/* Días de la semana */}
                    <div className="grid grid-cols-7 bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-blue-200">
                      {nombresDias.map((dia) => (
                        <div key={dia} className="p-2.5 text-center text-[10px] font-bold text-blue-700" style={{ fontFamily: 'var(--font-poppins)' }}>
                          {dia}
                        </div>
                      ))}
                    </div>

                    {/* Días del mes */}
                    <div className="p-4">
                      {semanasCalendario.map((semana, semanaIndex) => (
                        <div key={semanaIndex} className="grid grid-cols-7 gap-2 mb-2">
                          {semana.map((dia, diaIndex) => {
                            if (dia === null) {
                              return <div key={diaIndex} className="h-12"></div>;
                            }

                            const tieneActividad = diasConActividad.has(dia);
                            const estaSeleccionado = selectedDate === dia;
                            const esHoy = dia === new Date().getDate() && 
                                         currentMonth === new Date().getMonth() && 
                                         currentYear === new Date().getFullYear();

                            return (
                              <button
                                key={diaIndex}
                                onClick={() => setSelectedDate(dia)}
                                className={`h-14 rounded-xl p-1.5 flex flex-col items-center justify-center transition-all duration-200 relative ${
                                  estaSeleccionado
                                    ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg scale-105 ring-2 ring-blue-300 hover:shadow-xl"
                                    : tieneActividad
                                    ? "bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border border-blue-200 text-gray-900 hover:shadow-md hover:scale-105"
                                    : "bg-gray-50 hover:bg-gray-100 text-gray-600 hover:shadow-sm"
                                } ${esHoy && !estaSeleccionado ? "ring-2 ring-blue-400 ring-opacity-50" : ""}`}
                              >
                                <span className={`text-xs font-bold ${estaSeleccionado ? "text-white" : "text-gray-900"}`} style={{ fontFamily: 'var(--font-poppins)' }}>
                                  {dia}
                                </span>
                                {tieneActividad && (
                                  <div className={`mt-0.5 flex items-center space-x-0.5 ${estaSeleccionado ? "text-blue-100" : "text-blue-600"}`}>
                                    <div className="w-1 h-1 rounded-full bg-current"></div>
                                    <span className="text-[7px] font-semibold leading-none">
                                      {logsPorDia[`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`]?.length || 0}
                                    </span>
                                  </div>
                                )}
                                {esHoy && !estaSeleccionado && (
                                  <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Logs del día seleccionado */}
                  {selectedDate && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-3 border-b border-blue-200">
                        <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                          Actividad del {selectedDate} de {nombresMeses[currentMonth]} {currentYear}
                        </h3>
                        <p className="text-xs text-gray-600 mt-1" style={{ fontFamily: 'var(--font-poppins)' }}>
                          {logsDelDia.length} {logsDelDia.length === 1 ? "inicio de sesión" : "inicios de sesión"}
                        </p>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gradient-to-r from-blue-700 to-blue-800 border-b-2 border-blue-900">
                              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>NOMBRE</th>
                              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>APELLIDO</th>
                              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>FECHA/HORA</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {logsDelDia.length === 0 ? (
                              <tr>
                                <td colSpan={3} className="px-4 py-4 text-center text-xs text-gray-500" style={{ fontFamily: 'var(--font-poppins)' }}>
                                  No hay actividad registrada para este día
                                </td>
                              </tr>
                            ) : (
                              logsDelDia.map((log, index) => (
                                <tr key={log.ID || log.id || index} className="hover:bg-blue-50 transition-colors border-b border-gray-100">
                                  <td className="px-4 py-3 whitespace-nowrap text-[10px] font-medium text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                                    {log.NOMBRE || log.nombre || "N/A"}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>
                                    {log.APELLIDO || log.apellido || "N/A"}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    {formatearFecha(log.FECHA_HORA || log.fecha_hora || log.FECHA || log.fecha || log.timestamp || log.TIMESTAMP)}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Vista de tabla */}
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gradient-to-r from-blue-700 to-blue-800 border-b-2 border-blue-900">
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>NOMBRE</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>APELLIDO</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>FECHA/HORA</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {logs.slice((currentPageTable - 1) * itemsPerPageTable, currentPageTable * itemsPerPageTable).map((log, index) => (
                            <tr key={log.ID || log.id || index} className="hover:bg-blue-50 transition-colors border-b border-gray-100">
                              <td className="px-4 py-3 whitespace-nowrap text-[10px] font-medium text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                                {log.NOMBRE || log.nombre || "N/A"}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>
                                {log.APELLIDO || log.apellido || "N/A"}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                {formatearFecha(log.FECHA_HORA || log.fecha_hora || log.FECHA || log.fecha || log.timestamp || log.TIMESTAMP)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Paginación */}
                    {Math.ceil(logs.length / itemsPerPageTable) > 1 && (
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 flex items-center justify-between border-t border-gray-200">
                        <button
                          onClick={() => setCurrentPageTable(1)}
                          disabled={currentPageTable === 1}
                          className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                          style={{ fontFamily: 'var(--font-poppins)' }}
                        >
                          «
                        </button>
                        <button
                          onClick={() => setCurrentPageTable(currentPageTable - 1)}
                          disabled={currentPageTable === 1}
                          className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                          style={{ fontFamily: 'var(--font-poppins)' }}
                        >
                          &lt;
                        </button>
                        <span className="text-xs text-gray-700 font-semibold" style={{ fontFamily: 'var(--font-poppins)' }}>
                          Página {currentPageTable} de {Math.ceil(logs.length / itemsPerPageTable)}
                        </span>
                        <button
                          onClick={() => setCurrentPageTable(currentPageTable + 1)}
                          disabled={currentPageTable === Math.ceil(logs.length / itemsPerPageTable)}
                          className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                          style={{ fontFamily: 'var(--font-poppins)' }}
                        >
                          &gt;
                        </button>
                        <button
                          onClick={() => setCurrentPageTable(Math.ceil(logs.length / itemsPerPageTable))}
                          disabled={currentPageTable === Math.ceil(logs.length / itemsPerPageTable)}
                          className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                          style={{ fontFamily: 'var(--font-poppins)' }}
                        >
                          »
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

