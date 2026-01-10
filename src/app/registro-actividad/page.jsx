"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/context/AuthContext";
import { Header } from "../../components/layout/Header";
import { Sidebar } from "../../components/layout/Sidebar";

// Usar el proxy de Next.js para evitar problemas de CORS
const API_URL = "/api/logs-sesion";

export default function RegistroActividadPage() {
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
  const itemsPerPageTable = 20;

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

      // Obtener el id_colaborador del usuario
      // Usar el email o name del usuario (que es lo que se usa para identificar al colaborador)
      // El error "Data too long for column 'P_ID_GENERAL'" probablemente viene del backend,
      // no del parámetro id_colaborador que enviamos. La API route.js ya trunca a 50 caracteres.
      let idColaborador = user?.email || user?.name || user?.id || "hervinzeus";

      // Convertir a string y asegurar que no esté vacío
      idColaborador = String(idColaborador).trim();

      if (!idColaborador || idColaborador === "") {
        console.error("No se pudo obtener id_colaborador del usuario");
        setErrorAPI("Error: No se pudo identificar al usuario");
        setLoadingData(false);
        return;
      }

      console.log("Buscando logs para id_colaborador:", idColaborador);

      // Obtener el token de autenticación
      const token = localStorage.getItem("token");

      // Construir la URL con los parámetros
      const queryParams = new URLSearchParams();
      queryParams.append("id_colaborador", idColaborador);

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
        let errorMessage = `Error HTTP: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          // Si no se puede parsear el JSON, usar el texto de la respuesta
          try {
            const errorText = await response.text();
            errorMessage = errorText || errorMessage;
          } catch (textError) {
            // Si tampoco se puede leer el texto, usar el mensaje por defecto
            console.error("Error al leer respuesta:", textError);
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Logs recibidos de la API:', data);

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
              <span className="text-[10px] font-bold text-gray-900">{dia} {nombreMes} {año}</span>
              <span className="text-[9px] text-gray-500 font-medium">({nombreDia})</span>
            </div>
            <div className="flex items-center space-x-1">
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-[9px] text-gray-600 font-medium">{horas}:{minutos}:{segundos}</span>
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
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${sidebarOpen ? "lg:ml-60 ml-0" : "ml-0"
          }`}
      >
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto custom-scrollbar" style={{ background: '#F7FAFF' }}>
          <div className="max-w-[95%] mx-auto px-4 py-4">
            {/* Botón Volver */}
            <button
              onClick={() => router.push("/perfil")}
              className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-lg font-medium hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm text-sm group"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver al Perfil</span>
            </button>

            {/* Contenedor principal con fondo blanco */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6 mb-6">
              {/* Título con icono y API Conectada */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-xl flex items-center justify-center text-white shadow-sm">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Registro de Actividad</h1>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                      Logs personales de sesión y actividad
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
                    <span className="text-sm font-semibold text-green-700">API Conectada</span>
                  </div>
                )}
              </div>

              {/* Selector de vista */}
              <div className="mb-4 flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setViewMode("calendar");
                    setCurrentPageTable(1);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === "calendar"
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Calendario</span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setViewMode("table");
                    setCurrentPageTable(1);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === "table"
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Tabla</span>
                  </div>
                </button>
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
                        className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <div className="text-center">
                        <h2 className="text-lg font-bold text-white">{nombresMeses[currentMonth]} {currentYear}</h2>
                        <p className="text-[10px] text-blue-100 mt-0.5">{Object.keys(logsPorDia).length} días con actividad</p>
                      </div>
                      <button
                        onClick={() => cambiarMes('siguiente')}
                        className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>

                    {/* Días de la semana */}
                    <div className="grid grid-cols-7 bg-blue-50 border-b-2 border-blue-200">
                      {nombresDias.map((dia) => (
                        <div key={dia} className="p-2.5 text-center text-[10px] font-bold text-blue-700">
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
                                className={`h-12 rounded-lg p-1.5 flex flex-col items-center justify-center transition-all relative ${estaSeleccionado
                                    ? "bg-blue-600 text-white shadow-md scale-105 ring-2 ring-blue-300"
                                    : tieneActividad
                                      ? "bg-blue-50 hover:bg-blue-100 border border-blue-200 text-gray-900"
                                      : "bg-gray-50 hover:bg-gray-100 text-gray-600"
                                  } ${esHoy && !estaSeleccionado ? "ring-1 ring-blue-400" : ""}`}
                              >
                                <span className={`text-xs font-bold ${estaSeleccionado ? "text-white" : "text-gray-900"}`}>
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
                        <h3 className="text-lg font-bold text-gray-900">
                          Actividad del {selectedDate} de {nombresMeses[currentMonth]} {currentYear}
                        </h3>
                        <p className="text-xs text-gray-600 mt-1">
                          {logsDelDia.length} {logsDelDia.length === 1 ? "inicio de sesión" : "inicios de sesión"}
                        </p>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-blue-700 border-b-2 border-blue-800">
                              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">NOMBRE</th>
                              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">APELLIDO</th>
                              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">FECHA/HORA</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {logsDelDia.length === 0 ? (
                              <tr>
                                <td colSpan={3} className="px-3 py-4 text-center text-xs text-gray-500">
                                  No hay actividad registrada para este día
                                </td>
                              </tr>
                            ) : (
                              logsDelDia.map((log, index) => (
                                <tr key={log.ID || log.id || index} className="hover:bg-slate-200 transition-colors">
                                  <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">
                                    {log.NOMBRE || log.nombre || "N/A"}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                                    {log.APELLIDO || log.apellido || "N/A"}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap">
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
                          <tr className="bg-blue-700 border-b-2 border-blue-800">
                            <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">NOMBRE</th>
                            <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">APELLIDO</th>
                            <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">FECHA/HORA</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {logs.slice((currentPageTable - 1) * itemsPerPageTable, currentPageTable * itemsPerPageTable).map((log, index) => (
                            <tr key={log.ID || log.id || index} className="hover:bg-slate-200 transition-colors">
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">
                                {log.NOMBRE || log.nombre || "N/A"}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                                {log.APELLIDO || log.apellido || "N/A"}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap">
                                {formatearFecha(log.FECHA_HORA || log.fecha_hora || log.FECHA || log.fecha || log.timestamp || log.TIMESTAMP)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Paginación */}
                    {Math.ceil(logs.length / itemsPerPageTable) > 1 && (
                      <div className="bg-slate-200 px-3 py-2 flex items-center justify-between border-t-2 border-slate-300">
                        <button
                          onClick={() => setCurrentPageTable(1)}
                          disabled={currentPageTable === 1}
                          className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          «
                        </button>
                        <button
                          onClick={() => setCurrentPageTable(currentPageTable - 1)}
                          disabled={currentPageTable === 1}
                          className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          &lt;
                        </button>
                        <span className="text-[10px] text-gray-700 font-medium">
                          Página {currentPageTable} de {Math.ceil(logs.length / itemsPerPageTable)}
                        </span>
                        <button
                          onClick={() => setCurrentPageTable(currentPageTable + 1)}
                          disabled={currentPageTable === Math.ceil(logs.length / itemsPerPageTable)}
                          className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          &gt;
                        </button>
                        <button
                          onClick={() => setCurrentPageTable(Math.ceil(logs.length / itemsPerPageTable))}
                          disabled={currentPageTable === Math.ceil(logs.length / itemsPerPageTable)}
                          className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
