"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/context/AuthContext";
import { Header } from "../../components/layout/Header";
import { Sidebar } from "../../components/layout/Sidebar";
import Modal from "../../components/ui/Modal";

export default function CalendarioCumpleanosPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cumpleanos, setCumpleanos] = useState([]);
  const [loadingCumpleanos, setLoadingCumpleanos] = useState(false);
  const [errorCumpleanos, setErrorCumpleanos] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const vistaTipo = "año"; // Siempre mostrar "Por Año"
  const [isModalCumpleanosOpen, setIsModalCumpleanosOpen] = useState(false);
  const [selectedCumpleanos, setSelectedCumpleanos] = useState(null);
  const [expandedCalendario, setExpandedCalendario] = useState(true);

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

    // Establecer estado inicial
    handleResize();

    // Escuchar cambios de tamaño
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Función para obtener cumpleaños de la API
  const fetchCumpleanos = useCallback(async () => {
    try {
      setLoadingCumpleanos(true);
      setErrorCumpleanos(null);
      
      const token = localStorage.getItem("token");
      
      const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
      };
      
      if (token && token.trim() !== "") {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const response = await fetch("/api/cumpleanos", {
        method: "GET",
        headers: headers,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status} al obtener cumpleaños`);
      }
      
      const data = await response.json();
      
      console.log("=== DATOS RECIBIDOS DE API CUMPLEAÑOS ===");
      console.log("Tipo de datos:", typeof data);
      console.log("Es array?", Array.isArray(data));
      console.log("Datos completos:", JSON.stringify(data, null, 2));
      
      // La API puede devolver un array o un objeto con una propiedad
      let cumpleanosArray = [];
      if (Array.isArray(data)) {
        cumpleanosArray = data;
        console.log("✅ Datos encontrados como array directo");
      } else if (data.data && Array.isArray(data.data)) {
        cumpleanosArray = data.data;
        console.log("✅ Datos encontrados en data.data");
      } else if (data.cumpleanos && Array.isArray(data.cumpleanos)) {
        cumpleanosArray = data.cumpleanos;
        console.log("✅ Datos encontrados en data.cumpleanos");
      } else {
        cumpleanosArray = [];
        console.log("⚠️ No se encontró array de cumpleaños");
      }
      
      console.log("Cantidad de registros:", cumpleanosArray.length);
      
      // Helper function para obtener valores con múltiples variaciones
      const getValue = (obj, ...keys) => {
        if (!obj) return "";
        for (const key of keys) {
          // Buscar en minúsculas
          const value = obj[key];
          if (value !== undefined && value !== null && value !== "" && value !== "null" && value !== "undefined") {
            return String(value);
          }
          // Buscar en mayúsculas
          const upperKey = key.toUpperCase();
          const upperValue = obj[upperKey];
          if (upperValue !== undefined && upperValue !== null && upperValue !== "" && upperValue !== "null" && upperValue !== "undefined") {
            return String(upperValue);
          }
          // Buscar case-insensitive en todas las claves del objeto
          const objKeys = Object.keys(obj);
          for (const objKey of objKeys) {
            if (objKey.toUpperCase() === upperKey && obj[objKey] !== undefined && obj[objKey] !== null && obj[objKey] !== "" && obj[objKey] !== "null" && obj[objKey] !== "undefined") {
              return String(obj[objKey]);
            }
          }
        }
        return "";
      };
      
      // Mapear los datos al formato esperado
      const cumpleanosMapeados = cumpleanosArray.map((item, index) => {
        // Extraer fecha de cumpleaños - puede venir en diferentes formatos
        const fechaRaw = getValue(item, "FECHA_NACIMIENTO", "fecha_nacimiento", "FECHA_NAC", "fechaNacimiento", "fecha", "FECHA_NACIMIENTO");
        
        // Parsear la fecha
        let fechaNacimiento = null;
        if (fechaRaw) {
          // Intentar diferentes formatos
          if (fechaRaw.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // YYYY-MM-DD
            fechaNacimiento = new Date(fechaRaw);
          } else if (fechaRaw.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
            // DD/MM/YYYY
            const [day, month, year] = fechaRaw.split('/');
            fechaNacimiento = new Date(`${year}-${month}-${day}`);
          } else {
            fechaNacimiento = new Date(fechaRaw);
          }
        }
        
        // Obtener ID único - usar índice si no hay ID válido
        const itemId = item.ID || item.id || item.id_colaborador || item.ID_COLABORADOR || `temp-${index}`;
        
        // Obtener área con múltiples variaciones
        const areaValue = getValue(item, "AREA", "area", "A.NOMBRE", "a.nombre", "AREA_PRINCIPAL", "areaPrincipal", "DEPARTAMENTO", "departamento", "DEPARTAMENTO_PRINCIPAL");
        
        const mappedItem = {
          id: itemId,
          uniqueId: `${itemId}-${index}`, // ID único para evitar keys duplicadas
          nombre: getValue(item, "NOMBRE", "nombre", "NOMBRE_COMPLETO", "nombre_completo", "NOMBRE1", "primerNombre"),
          apellido: getValue(item, "APELLIDO", "apellido", "APELLIDO1", "primerApellido", "APELLIDO_PATERNO"),
          fechaNacimiento: fechaNacimiento,
          fechaRaw: fechaRaw,
          area: areaValue,
        };
        
        return mappedItem;
      }).filter(item => item.fechaNacimiento && !isNaN(item.fechaNacimiento.getTime()));
      
      console.log("=== RESUMEN DE MAPEO ===");
      console.log("Total de elementos mapeados:", cumpleanosMapeados.length);
      
      setCumpleanos(cumpleanosMapeados);
    } catch (err) {
      console.error("Error al obtener cumpleaños:", err);
      setErrorCumpleanos(err.message || "Error al cargar los cumpleaños");
    } finally {
      setLoadingCumpleanos(false);
    }
  }, []);

  // Cargar cumpleaños al montar el componente
  useEffect(() => {
    if (user && !loading) {
      fetchCumpleanos();
    }
  }, [user, loading, fetchCumpleanos]);

  // Función para obtener cumpleaños de un día específico
  const getCumpleanosDelDia = (day, month) => {
    return cumpleanos.filter(c => {
      if (!c.fechaNacimiento) return false;
      const fechaNac = c.fechaNacimiento;
      return fechaNac.getDate() === day && fechaNac.getMonth() === month;
    });
  };

  // Función para obtener cumpleaños por mes (sin filtrar por año de nacimiento, ya que los cumpleaños se repiten cada año)
  const getCumpleanosPorMes = (mes) => {
    return cumpleanos.filter(c => {
      if (!c.fechaNacimiento) return false;
      return c.fechaNacimiento.getMonth() === mes;
    }).sort((a, b) => a.fechaNacimiento.getDate() - b.fechaNacimiento.getDate());
  };

  // Función para calcular la edad (usa el año seleccionado en la vista, no el año actual del sistema)
  const calcularEdad = (fechaNacimiento, añoReferencia = null) => {
    if (!fechaNacimiento) return null;
    
    // Usar el año de referencia si se proporciona, de lo contrario usar el año actual del sistema
    const añoParaCalcular = añoReferencia !== null ? añoReferencia : new Date().getFullYear();
    const añoActual = new Date().getFullYear();
    const hoy = new Date();
    const mesActual = hoy.getMonth();
    const diaActual = hoy.getDate();
    
    const añoNacimiento = fechaNacimiento.getFullYear();
    const mesNacimiento = fechaNacimiento.getMonth();
    const diaNacimiento = fechaNacimiento.getDate();
    
    let edad = añoParaCalcular - añoNacimiento;
    
    // Ajustar la edad según el año de referencia
    if (añoParaCalcular === añoActual) {
      // Si el año de referencia es el año actual, verificar si ya cumplió años este año
      if (mesActual < mesNacimiento || (mesActual === mesNacimiento && diaActual < diaNacimiento)) {
        edad--;
      }
    } else if (añoParaCalcular > añoActual) {
      // Si el año de referencia es futuro, asumimos que ya cumplió años en ese año
      // (no restamos, la edad ya está calculada correctamente)
    } else {
      // Si el año de referencia es pasado, ya cumplió años en ese año
      // (no restamos, la edad ya está calculada correctamente)
    }
    
    return edad;
  };

  // Función para abrir modal de cumpleaños
  const abrirModalCumpleanos = (cumple) => {
    setSelectedCumpleanos(cumple);
    setIsModalCumpleanosOpen(true);
  };

  // Función para generar el calendario del mes
  const generarCalendario = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const semanas = [];
    let semana = [];
    
    // Días vacíos al inicio
    for (let i = 0; i < startingDayOfWeek; i++) {
      semana.push(null);
    }
    
    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      semana.push(day);
      if (semana.length === 7) {
        semanas.push(semana);
        semana = [];
      }
    }
    
    // Días vacíos al final
    if (semana.length > 0) {
      while (semana.length < 7) {
        semana.push(null);
      }
      semanas.push(semana);
    }
    
    return semanas;
  };

  const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const diasSemana = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  const cambiarMes = (direccion) => {
    if (direccion === "anterior") {
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
  };

  const getIcon = (iconName) => {
    const icons = {
      birthday: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        </svg>
      ),
    };
    return icons[iconName] || icons.birthday;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#F7FAFF' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
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

        <main className="flex-1 overflow-y-auto custom-scrollbar" style={{ background: 'linear-gradient(to bottom, #f7f9fc, #ffffff)' }}>
          <div className="max-w-[95%] mx-auto px-4 py-4">
            {/* Botón Volver */}
            <button
              onClick={() => router.push("/menu")}
              className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-[#155EEF] to-[#1D4ED8] text-white rounded-lg font-semibold hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm ripple-effect relative overflow-hidden text-sm group"
            >
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver al Menú</span>
            </button>

            {/* Card contenedor blanco */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">
              {/* Header con API Conectada */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] rounded-xl flex items-center justify-center text-white shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
                    {getIcon("birthday")}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">BOLETÍN INFORMATIVO</h1>
                    <p className="text-sm text-gray-600 font-medium mt-0.5">Información y eventos de la empresa</p>
                  </div>
                </div>
                <div className={`flex items-center space-x-1.5 rounded-lg px-2.5 py-1 ${
                  loadingCumpleanos 
                    ? 'bg-yellow-50 border border-yellow-200' 
                    : errorCumpleanos 
                      ? 'bg-red-50 border border-red-200' 
                      : 'bg-green-50 border border-green-200'
                }`}>
                  {loadingCumpleanos ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                      <span className="text-xs font-semibold text-yellow-700">Cargando...</span>
                    </>
                  ) : errorCumpleanos ? (
                    <>
                      <svg className="w-3.5 h-3.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs font-semibold text-red-700">Error</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs font-semibold text-green-700">API Conectada</span>
                    </>
                  )}
                </div>
              </div>

              {/* Sección Calendario de Cumpleaños - Acordeón */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setExpandedCalendario(!expandedCalendario)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] text-white hover:shadow-md hover:scale-[1.01] transition-all duration-200 shadow-sm"
                >
                  <div className="flex items-center space-x-2">
                    <div className="text-white">{getIcon("birthday")}</div>
                    <h2 className="text-base font-bold text-white">Calendario de Cumpleaños</h2>
                  </div>
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${expandedCalendario ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {expandedCalendario && (
                  <div className="p-4 bg-white">
                    {errorCumpleanos && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{errorCumpleanos}</p>
                      </div>
                    )}

                {vistaTipo === "mes" ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() => cambiarMes("anterior")}
                        className="px-3 py-2 bg-blue-700/20 border border-blue-700/40 hover:bg-blue-700/30 text-blue-800 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <h3 className="text-lg font-bold text-gray-900">
                        {meses[currentMonth]} {currentYear}
                      </h3>
                      <button
                        onClick={() => cambiarMes("siguiente")}
                        className="px-3 py-2 bg-blue-700/20 border border-blue-700/40 hover:bg-blue-700/30 text-blue-800 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg border border-gray-200/60 overflow-hidden">
                      <div className="grid grid-cols-7 bg-blue-700/20 border-b border-blue-700/40">
                        {diasSemana.map((dia) => (
                          <div key={dia} className="px-2 py-2 text-center text-[10px] font-bold uppercase text-blue-800">
                            {dia}
                          </div>
                        ))}
                      </div>

                      <div className="divide-y divide-gray-100">
                        {generarCalendario().map((semana, semanaIndex) => (
                          <div key={semanaIndex} className="grid grid-cols-7 divide-x divide-gray-100">
                            {semana.map((day, dayIndex) => {
                              if (day === null) {
                                return (
                                  <div key={dayIndex} className="min-h-[80px] bg-gray-50"></div>
                                );
                              }
                              
                              const cumpleanosDelDia = getCumpleanosDelDia(day, currentMonth);
                              const hoy = new Date();
                              const esHoy = day === hoy.getDate() && 
                                           currentMonth === hoy.getMonth() && 
                                           currentYear === hoy.getFullYear();
                              
                              return (
                                <div
                                  key={dayIndex}
                                  className={`min-h-[80px] p-1.5 ${
                                    esHoy ? "bg-blue-100 border-2 border-blue-500" : "bg-white hover:bg-gray-50"
                                  } transition-colors`}
                                >
                                  <div className={`text-xs font-semibold mb-1 ${
                                    esHoy ? "text-blue-700" : "text-gray-700"
                                  }`}>
                                    {day}
                                  </div>
                                  <div className="space-y-1">
                                    {cumpleanosDelDia.slice(0, 2).map((cumple, idx) => (
                                      <div
                                        key={cumple.uniqueId || `${cumple.id}-${day}-${idx}`}
                                        onClick={() => abrirModalCumpleanos(cumple)}
                                        className="text-[9px] px-1.5 py-0.5 bg-blue-100 border border-blue-300 rounded text-blue-800 font-medium truncate cursor-pointer hover:bg-blue-200 transition-colors"
                                        title={`${cumple.nombre} ${cumple.apellido} - Click para ver detalles`}
                                      >
                                        🎂 {cumple.nombre}
                                      </div>
                                    ))}
                                    {cumpleanosDelDia.length > 2 && (
                                      <div className="text-[9px] px-1.5 py-0.5 bg-blue-200 border border-blue-400 rounded text-blue-900 font-medium">
                                        +{cumpleanosDelDia.length - 2} más
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 bg-white rounded-xl shadow-lg border border-gray-200/60 p-4">
                      <h3 className="text-base font-bold text-gray-900 mb-3">Cumpleaños de {meses[currentMonth]}</h3>
                      {loadingCumpleanos ? (
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {cumpleanos
                            .filter(c => c.fechaNacimiento && c.fechaNacimiento.getMonth() === currentMonth)
                            .sort((a, b) => a.fechaNacimiento.getDate() - b.fechaNacimiento.getDate())
                            .map((cumple, idx) => (
                              <div
                                key={cumple.uniqueId || `${cumple.id}-list-${idx}`}
                                onClick={() => abrirModalCumpleanos(cumple)}
                                className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                              >
                                <div className="flex items-center space-x-2">
                                  <span className="text-lg">🎂</span>
                                  <div>
                                    <p className="text-sm font-semibold text-gray-900">
                                      {cumple.nombre} {cumple.apellido}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                      {cumple.area || "Sin área asignada"}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-bold text-blue-700">
                                    {cumple.fechaNacimiento.getDate()} de {meses[cumple.fechaNacimiento.getMonth()]}
                                  </p>
                                </div>
                              </div>
                            ))}
                          {cumpleanos.filter(c => c.fechaNacimiento && c.fechaNacimiento.getMonth() === currentMonth).length === 0 && (
                            <p className="text-sm text-gray-500 text-center py-4">
                              No hay cumpleaños registrados para este mes
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() => setCurrentYear(currentYear - 1)}
                        className="px-3 py-2 bg-blue-700/20 border border-blue-700/40 hover:bg-blue-700/30 text-blue-800 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <h3 className="text-lg font-bold text-gray-900">
                        Cumpleaños del Año {currentYear}
                      </h3>
                      <button
                        onClick={() => setCurrentYear(currentYear + 1)}
                        className="px-3 py-2 bg-blue-700/20 border border-blue-700/40 hover:bg-blue-700/30 text-blue-800 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {meses.map((mes, mesIndex) => {
                        const cumpleanosDelMes = getCumpleanosPorMes(mesIndex);
                        return (
                          <div
                            key={mesIndex}
                            className="bg-white rounded-xl shadow-lg border border-gray-200/60 p-4 hover:shadow-xl transition-all duration-200"
                          >
                            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
                              <h4 className="text-base font-bold text-gray-900">{mes}</h4>
                              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                {cumpleanosDelMes.length} {cumpleanosDelMes.length === 1 ? 'cumpleaños' : 'cumpleaños'}
                              </span>
                            </div>
                            {loadingCumpleanos ? (
                              <div className="text-center py-4">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mx-auto"></div>
                              </div>
                            ) : cumpleanosDelMes.length > 0 ? (
                              <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                                {cumpleanosDelMes.map((cumple, idx) => (
                                  <div
                                    key={cumple.uniqueId || `${cumple.id}-${mesIndex}-${idx}`}
                                    onClick={() => abrirModalCumpleanos(cumple)}
                                    className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                                  >
                                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                                      <span className="text-sm">🎂</span>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-gray-900 truncate">
                                          {cumple.nombre} {cumple.apellido}
                                        </p>
                                        <p className="text-[10px] text-gray-600 truncate">
                                          {cumple.area || "Sin área asignada"}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-right ml-2 flex-shrink-0">
                                      <p className="text-xs font-bold text-blue-700">
                                        {cumple.fechaNacimiento.getDate()}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-500 text-center py-4">
                                No hay cumpleaños este mes
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal de Detalles de Cumpleaños */}
      <Modal
        isOpen={isModalCumpleanosOpen}
        onClose={() => {
          setIsModalCumpleanosOpen(false);
          setSelectedCumpleanos(null);
        }}
        title="Detalles del Cumpleaños"
        size="md"
      >
        {selectedCumpleanos && (
          <div className="space-y-4">
            <div className="flex items-center justify-center mb-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-4xl shadow-lg">
                🎂
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre Completo</label>
                <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                  {selectedCumpleanos.nombre} {selectedCumpleanos.apellido}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Área/Departamento</label>
                <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                  {selectedCumpleanos.area || "Sin área asignada"}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha de Nacimiento</label>
                <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                  {selectedCumpleanos.fechaNacimiento ? (
                    `${selectedCumpleanos.fechaNacimiento.getDate()} de ${meses[selectedCumpleanos.fechaNacimiento.getMonth()]} de ${selectedCumpleanos.fechaNacimiento.getFullYear()}`
                  ) : (
                    "No disponible"
                  )}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Edad que Cumple en {currentYear}</label>
                <p className="text-sm font-bold text-blue-700 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                  {calcularEdad(selectedCumpleanos.fechaNacimiento, currentYear) !== null ? (
                    `${calcularEdad(selectedCumpleanos.fechaNacimiento, currentYear)} años`
                  ) : (
                    "No disponible"
                  )}
                </p>
              </div>
            </div>

            {selectedCumpleanos.fechaRaw && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha Original</label>
                <p className="text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                  {selectedCumpleanos.fechaRaw}
                </p>
              </div>
            )}

            <div className="flex items-center justify-end pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setIsModalCumpleanosOpen(false);
                  setSelectedCumpleanos(null);
                }}
                className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-br from-[#155EEF] to-[#1D4ED8] hover:shadow-md hover:scale-105 rounded-lg transition-all duration-200 shadow-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

