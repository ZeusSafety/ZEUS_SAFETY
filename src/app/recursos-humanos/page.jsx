"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../components/context/AuthContext";
import { Header } from "../../components/layout/Header";
import { Sidebar } from "../../components/layout/Sidebar";
import Modal from "../../components/ui/Modal";

function RecursosHumanosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("gestion-colaboradores");
  const [cumpleanos, setCumpleanos] = useState([]);
  const [loadingCumpleanos, setLoadingCumpleanos] = useState(false);
  const [errorCumpleanos, setErrorCumpleanos] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [vistaTipo, setVistaTipo] = useState("año"); // "mes" o "año" - Por defecto mostrar "Por Año"
  const [isModalCumpleanosOpen, setIsModalCumpleanosOpen] = useState(false);
  const [selectedCumpleanos, setSelectedCumpleanos] = useState(null);
  
  // Estados para colaboradores
  const [colaboradores, setColaboradores] = useState([]);
  const [colaboradoresCompletos, setColaboradoresCompletos] = useState([]);
  const [loadingColaboradores, setLoadingColaboradores] = useState(true);
  const [errorColaboradores, setErrorColaboradores] = useState(null);
  const [isVerDetallesModalOpen, setIsVerDetallesModalOpen] = useState(false);
  const [selectedColaboradorCompleto, setSelectedColaboradorCompleto] = useState(null);
  const [datosEditables, setDatosEditables] = useState([]);

  // Inicializar datosEditables cuando se abre el modal
  useEffect(() => {
    if (isVerDetallesModalOpen && selectedColaboradorCompleto) {
      const getValue = (obj, keys) => {
        for (const key of keys) {
          if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
            return obj[key];
          }
        }
        return null;
      };
      
      const datosField = getValue(selectedColaboradorCompleto, ["DATOS", "datos", "Datos"]);
      let datosArray = null;
      
      if (typeof datosField === "string") {
        try {
          datosArray = JSON.parse(datosField);
        } catch (e) {
          console.error("Error al parsear DATOS:", e);
        }
      } else if (Array.isArray(datosField)) {
        datosArray = datosField;
      }
      
      if (datosArray && Array.isArray(datosArray)) {
        setDatosEditables(datosArray);
      } else {
        setDatosEditables([]);
      }
    } else {
      setDatosEditables([]);
    }
  }, [isVerDetallesModalOpen, selectedColaboradorCompleto]);

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

  useEffect(() => {
    // Leer el parámetro de consulta "section" de la URL
    const section = searchParams.get("section");
    if (section) {
      // Validar que la sección existe en las secciones disponibles
      const validSections = [
        "gestion-colaboradores",
        "control-asistencia",
        "gestion-permisos",
        "gestion-vacaciones",
        "control-documentos",
        "gestion-remuneraciones",
        "auto-servicio",
        "calendario-cumpleanos",
      ];
      if (validSections.includes(section)) {
        setActiveSection(section);
      }
    }
  }, [searchParams]);

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
      
      // Mostrar estructura del primer elemento si existe
      if (cumpleanosArray.length > 0) {
        console.log("=== ESTRUCTURA DEL PRIMER ELEMENTO ===");
        console.log("Primer elemento completo:", JSON.stringify(cumpleanosArray[0], null, 2));
        console.log("Claves del primer elemento:", Object.keys(cumpleanosArray[0]));
        console.log("Valores del primer elemento:");
        Object.keys(cumpleanosArray[0]).forEach(key => {
          console.log(`  ${key}:`, cumpleanosArray[0][key], `(tipo: ${typeof cumpleanosArray[0][key]})`);
        });
      }
      
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
        
        // Log para debug del primer elemento
        if (index === 0) {
          console.log("=== MAPEO DEL PRIMER ELEMENTO ===");
          console.log("Item original:", JSON.stringify(item, null, 2));
          console.log("Item mapeado:", JSON.stringify(mappedItem, null, 2));
          console.log("Área encontrada:", areaValue || "NO ENCONTRADA");
          console.log("Todas las claves del item original:", Object.keys(item));
        }
        
        return mappedItem;
      }).filter(item => item.fechaNacimiento && !isNaN(item.fechaNacimiento.getTime()));
      
      console.log("=== RESUMEN DE MAPEO ===");
      console.log("Total de elementos mapeados:", cumpleanosMapeados.length);
      console.log("Elementos con área:", cumpleanosMapeados.filter(c => c.area).length);
      console.log("Elementos sin área:", cumpleanosMapeados.filter(c => !c.area).length);
      
      setCumpleanos(cumpleanosMapeados);
    } catch (err) {
      console.error("Error al obtener cumpleaños:", err);
      setErrorCumpleanos(err.message || "Error al cargar los cumpleaños");
    } finally {
      setLoadingCumpleanos(false);
    }
  }, []);

  // Cargar cumpleaños cuando se active la sección
  useEffect(() => {
    if (activeSection === "calendario-cumpleanos" && user && !loading) {
      fetchCumpleanos();
    }
  }, [activeSection, user, loading, fetchCumpleanos]);

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

  // Función para obtener colaboradores de la API
  const fetchColaboradores = useCallback(async () => {
    try {
      setLoadingColaboradores(true);
      setErrorColaboradores(null);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No se encontró el token de autenticación");
      }

      const response = await fetch("/api/colaboradores", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Error desconocido" }));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Datos recibidos de la API:", data);

      // Guardar los datos originales completos
      setColaboradoresCompletos(Array.isArray(data) ? data : []);

      // Mapear los datos de la API al formato esperado
      const colaboradoresMapeados = Array.isArray(data) ? data.map((colab) => {
        const getValue = (obj, keys) => {
          for (const key of keys) {
            if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
              return obj[key];
            }
          }
          return "";
        };

        // Formatear fecha de cumpleaños
        const fechaNac = getValue(colab, ["fecha_nacimiento", "fechaNacimiento", "fecha_cumpleanos", "fechaCumpleanos", "FECHA_NACIMIENTO", "FECHA_CUMPLEANOS"]);
        let fechaFormateada = "";
        if (fechaNac) {
          try {
            const fecha = new Date(fechaNac);
            if (!isNaN(fecha.getTime())) {
              const dia = String(fecha.getDate()).padStart(2, "0");
              const mes = String(fecha.getMonth() + 1).padStart(2, "0");
              const año = fecha.getFullYear();
              fechaFormateada = `${dia}/${mes}/${año}`;
            } else {
              fechaFormateada = fechaNac;
            }
          } catch (e) {
            fechaFormateada = fechaNac;
          }
        }

        // Obtener área
        let areaValue = getValue(colab, ["area", "AREA", "Area", "departamento", "DEPARTAMENTO", "department", "DEPARTMENT"]);
        if (!areaValue && colab.A && colab.A.NOMBRE) {
          areaValue = colab.A.NOMBRE;
        }
        if (!areaValue && colab.a && colab.a.nombre) {
          areaValue = colab.a.nombre;
        }
        if (!areaValue) {
          for (const key in colab) {
            if (typeof colab[key] === "object" && colab[key] !== null) {
              const nestedArea = getValue(colab[key], ["NOMBRE", "nombre", "NOMBRE_AREA", "nombre_area", "AREA", "area"]);
              if (nestedArea) {
                areaValue = nestedArea;
                break;
              }
            }
          }
        }

        // Determinar si está activo
        const estadoValue = getValue(colab, ["activo", "ACTIVO", "Activo", "estado", "ESTADO", "status", "STATUS"]);
        const isActivo = estadoValue !== false && 
                        estadoValue !== "inactivo" && 
                        estadoValue !== "INACTIVO" && 
                        estadoValue !== 0 &&
                        estadoValue !== "0";

        return {
          id: getValue(colab, ["id", "ID", "Id"]) || Math.random().toString(36).substr(2, 9),
          nombre: getValue(colab, ["nombre", "NOMBRE", "Nombre", "name", "NAME"]) || "",
          apellido: getValue(colab, ["apellido", "APELLIDO", "Apellido", "apellidos", "APELLIDOS", "lastname", "LASTNAME"]) || "",
          area: areaValue || "Sin área asignada",
          correo: getValue(colab, ["correo", "CORREO", "Correo", "email", "EMAIL", "Email", "correo_electronico", "CORREO_ELECTRONICO"]) || "",
          fechaCumpleanos: fechaFormateada,
          activo: isActivo,
        };
      }) : [];

      console.log("Colaboradores mapeados:", colaboradoresMapeados);
      setColaboradores(colaboradoresMapeados);
    } catch (error) {
      console.error("Error al obtener colaboradores:", error);
      setErrorColaboradores(error.message || "Error al obtener colaboradores");
    } finally {
      setLoadingColaboradores(false);
    }
  }, []);

  // Cargar colaboradores al montar el componente
  useEffect(() => {
    if (!loading && user && activeSection === "gestion-colaboradores") {
      fetchColaboradores();
    }
  }, [loading, user, activeSection, fetchColaboradores]);

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

  const activos = colaboradores.filter(c => c.activo !== false);
  const inactivos = colaboradores.filter(c => c.activo === false);

  // Datos ficticios para Control de Asistencia
  const registrosAsistencia = [
    { id: 1, nombre: "HERVIN CORONEL", fecha: "24/11/2025", entrada: "08:15", salida: "17:30", estado: "Normal" },
    { id: 2, nombre: "MARIA GONZALEZ", fecha: "24/11/2025", entrada: "08:00", salida: "17:00", estado: "Normal" },
    { id: 3, nombre: "JUAN PEREZ", fecha: "24/11/2025", entrada: "08:25", salida: "17:45", estado: "Tardanza" },
    { id: 4, nombre: "ANA LOPEZ", fecha: "24/11/2025", entrada: "-", salida: "-", estado: "Falta" },
    { id: 5, nombre: "CARLOS RODRIGUEZ", fecha: "24/11/2025", entrada: "08:10", salida: "17:20", estado: "Normal" },
  ];

  const incidenciasAsistencia = [
    { id: 1, nombre: "JUAN PEREZ", tipo: "Tardanza", fecha: "24/11/2025", justificacion: "Tráfico", estado: "Pendiente" },
    { id: 2, nombre: "ANA LOPEZ", tipo: "Falta", fecha: "24/11/2025", justificacion: "Enfermedad", estado: "Aprobada" },
    { id: 3, nombre: "MARIA GONZALEZ", tipo: "Tardanza", fecha: "23/11/2025", justificacion: "Emergencia familiar", estado: "Rechazada" },
  ];

  // Datos ficticios para Gestión de Permisos
  const solicitudesPermisos = [
    { id: 1, nombre: "HERVIN CORONEL", tipo: "Médico", fecha: "25/11/2025", dias: 1, motivo: "Consulta médica", estado: "Pendiente", jefe: "GERENTE GENERAL" },
    { id: 2, nombre: "MARIA GONZALEZ", tipo: "Personal", fecha: "26/11/2025", dias: 0.5, motivo: "Trámite personal", estado: "Aprobada", jefe: "JEFE DE VENTAS" },
    { id: 3, nombre: "JUAN PEREZ", tipo: "Otras actividades", fecha: "27/11/2025", dias: 2, motivo: "Capacitación", estado: "Pendiente", jefe: "JEFE DE LOGÍSTICA" },
    { id: 4, nombre: "ANA LOPEZ", tipo: "Médico", fecha: "28/11/2025", dias: 3, motivo: "Cirugía menor", estado: "Aprobada", jefe: "JEFE DE MARKETING" },
  ];

  // Datos ficticios para Gestión de Vacaciones
  const solicitudesVacaciones = [
    { id: 1, nombre: "HERVIN CORONEL", diasAcumulados: 15, diasSolicitados: 5, fechaInicio: "01/12/2025", fechaFin: "05/12/2025", estado: "Aprobada" },
    { id: 2, nombre: "MARIA GONZALEZ", diasAcumulados: 20, diasSolicitados: 10, fechaInicio: "10/12/2025", fechaFin: "19/12/2025", estado: "Pendiente" },
    { id: 3, nombre: "JUAN PEREZ", diasAcumulados: 12, diasSolicitados: 7, fechaInicio: "15/12/2025", fechaFin: "21/12/2025", estado: "Pendiente" },
    { id: 4, nombre: "CARLOS RODRIGUEZ", diasAcumulados: 18, diasSolicitados: 3, fechaInicio: "28/11/2025", fechaFin: "30/11/2025", estado: "Aprobada" },
  ];

  // Datos ficticios para Control de Documentos Laborales
  const documentosLaborales = [
    { id: 1, nombre: "HERVIN CORONEL", tipo: "Contrato", fechaVencimiento: "15/12/2025", diasRestantes: 21, estado: "Por vencer", alerta: true },
    { id: 2, nombre: "MARIA GONZALEZ", tipo: "SCTR", fechaVencimiento: "30/11/2025", diasRestantes: 6, estado: "Por vencer", alerta: true },
    { id: 3, nombre: "JUAN PEREZ", tipo: "Vida Ley", fechaVencimiento: "20/12/2025", diasRestantes: 26, estado: "Vigente", alerta: false },
    { id: 4, nombre: "ANA LOPEZ", tipo: "Contrato", fechaVencimiento: "05/01/2026", diasRestantes: 42, estado: "Vigente", alerta: false },
    { id: 5, nombre: "CARLOS RODRIGUEZ", tipo: "SCTR", fechaVencimiento: "25/11/2025", diasRestantes: 1, estado: "Por vencer", alerta: true },
  ];

  // Datos ficticios para Gestión de Remuneraciones
  const remuneraciones = [
    { id: 1, nombre: "HERVIN CORONEL", sueldoBase: 5000, bonos: 500, ctsProyectado: 416.67, gratificaciones: 5000, total: 10916.67, mes: "Noviembre 2025" },
    { id: 2, nombre: "MARIA GONZALEZ", sueldoBase: 4500, bonos: 300, ctsProyectado: 375, gratificaciones: 4500, total: 9675, mes: "Noviembre 2025" },
    { id: 3, nombre: "JUAN PEREZ", sueldoBase: 4200, bonos: 400, ctsProyectado: 350, gratificaciones: 4200, total: 9150, mes: "Noviembre 2025" },
    { id: 4, nombre: "ANA LOPEZ", sueldoBase: 4800, bonos: 600, ctsProyectado: 400, gratificaciones: 4800, total: 10600, mes: "Noviembre 2025" },
    { id: 5, nombre: "CARLOS RODRIGUEZ", sueldoBase: 5500, bonos: 700, ctsProyectado: 458.33, gratificaciones: 5500, total: 12158.33, mes: "Noviembre 2025" },
  ];

  const sections = [
    { id: "gestion-colaboradores", name: "Gestión de Colaboradores", icon: "users" },
    { id: "control-asistencia", name: "Control de Asistencia", icon: "clock" },
    { id: "gestion-permisos", name: "Gestión de Permisos", icon: "check" },
    { id: "gestion-vacaciones", name: "Gestión de Vacaciones", icon: "calendar" },
    { id: "control-documentos", name: "Control de Documentos Laborales", icon: "document" },
    { id: "gestion-remuneraciones", name: "Gestión de Remuneraciones", icon: "money" },
    { id: "auto-servicio", name: "Auto-Servicio del Colaborador (ESS)", icon: "user" },
    { id: "calendario-cumpleanos", name: "Calendario de Cumpleaños", icon: "birthday" },
  ];

  const getIcon = (iconName) => {
    const icons = {
      users: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      clock: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      check: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      calendar: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      document: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      money: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      user: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      birthday: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        </svg>
      ),
    };
    return icons[iconName] || icons.users;
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case "gestion-colaboradores":
        return (
          <>
            {/* Listado de Colaboradores */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#155EEF] to-[#1D4ED8] rounded-lg flex items-center justify-center text-white shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
                    {getIcon("users")}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Listado de Colaboradores</h2>
                    <p className="text-xs text-gray-600 mt-0.5">Gestiona los colaboradores activos del sistema</p>
                  </div>
                </div>
                <div className={`flex items-center space-x-1.5 rounded-lg px-2.5 py-1 ${
                  loadingColaboradores 
                    ? "bg-yellow-50 border border-yellow-200" 
                    : errorColaboradores 
                      ? "bg-red-50 border border-red-200" 
                      : "bg-green-50 border border-green-200"
                }`}>
                  {loadingColaboradores ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-yellow-600"></div>
                      <span className="text-xs font-semibold text-yellow-700">Cargando...</span>
                    </>
                  ) : errorColaboradores ? (
                    <>
                      <svg className="w-3.5 h-3.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
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

              {errorColaboradores && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-700">
                    <strong>Error:</strong> {errorColaboradores}
                  </p>
                  <button
                    onClick={fetchColaboradores}
                    className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                  >
                    Intentar de nuevo
                  </button>
                </div>
              )}

              <button className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-[#155EEF] to-[#1D4ED8] text-white rounded-lg font-semibold hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm active:scale-[0.98] text-sm group">
                <span>+ Agregar Colaborador</span>
              </button>

              <div className="bg-white rounded-xl shadow-lg border border-gray-200/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-blue-700/20 backdrop-blur-md border-b border-blue-700/40">
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">NOMBRE</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">APELLIDO</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">ÁREA</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">CORREO</th>
                        <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-blue-800">ACCIÓN</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {loadingColaboradores ? (
                        <tr>
                          <td colSpan={5} className="px-3 py-8 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700"></div>
                              <span className="text-sm text-gray-600">Cargando colaboradores...</span>
                            </div>
                          </td>
                        </tr>
                      ) : activos.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-3 py-8 text-center text-sm text-gray-500">
                            No hay colaboradores activos
                          </td>
                        </tr>
                      ) : (
                        activos.map((colaborador, index) => {
                          // Encontrar el colaborador completo original
                          const colaboradorCompleto = colaboradoresCompletos.find(c => {
                            const getValue = (obj, keys) => {
                              for (const key of keys) {
                                if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
                                  return obj[key];
                                }
                              }
                              return "";
                            };
                            const idOriginal = getValue(c, ["id", "ID", "Id"]);
                            const nombreOriginal = getValue(c, ["nombre", "NOMBRE", "Nombre", "name", "NAME"]);
                            return (idOriginal && idOriginal === colaborador.id) || 
                                   (nombreOriginal && nombreOriginal === colaborador.nombre);
                          }) || colaboradoresCompletos[index] || null;

                          return (
                            <tr key={colaborador.id || `colab-${index}`} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{colaborador.nombre}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{colaborador.apellido}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{colaborador.area}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{colaborador.correo}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                                  <button
                                    onClick={() => {
                                      setSelectedColaboradorCompleto(colaboradorCompleto);
                                      setIsVerDetallesModalOpen(true);
                                    }}
                                    className="flex items-center space-x-1 px-2.5 py-1 bg-blue-600/20 backdrop-blur-sm border border-blue-600/40 hover:bg-blue-600/30 hover:border-blue-700/60 text-blue-800 rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    <span>Ver Detalles</span>
                                  </button>
                              <button className="flex items-center space-x-1 px-2.5 py-1 bg-blue-700/20 backdrop-blur-sm border border-blue-700/40 hover:bg-blue-700/30 hover:border-blue-600/60 text-blue-800 rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span>Permisos</span>
                              </button>
                              <button className="flex items-center space-x-1 px-2.5 py-1 bg-orange-500/20 backdrop-blur-sm border border-orange-500/40 hover:bg-orange-500/30 hover:border-orange-600/60 text-orange-700 rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                <span>Desactivar</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="bg-gray-50 px-3 py-2 flex items-center justify-between border-t border-gray-200">
                  <button className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    &lt; Anterior
                  </button>
                  <span className="text-[10px] text-gray-700 font-medium">
                    Página 1 de 3 (15 registros)
                  </span>
                  <button className="px-2.5 py-1 text-[10px] font-medium bg-blue-700/20 backdrop-blur-sm border border-blue-700/40 hover:bg-blue-700/30 hover:border-blue-600/60 text-blue-800 rounded-lg transition-all duration-200 shadow-sm">
                    Siguiente &gt;
                  </button>
                </div>
              </div>
            </div>

            {/* Colaboradores Inactivos */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#155EEF] to-[#1D4ED8] rounded-lg flex items-center justify-center text-white shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
                    {getIcon("users")}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Colaboradores Inactivos</h2>
                    <p className="text-xs text-gray-600 mt-0.5">Sin acceso al sistema</p>
                  </div>
                </div>
                <div className={`flex items-center space-x-1.5 rounded-lg px-2.5 py-1 ${
                  loadingColaboradores 
                    ? "bg-yellow-50 border border-yellow-200" 
                    : errorColaboradores 
                      ? "bg-red-50 border border-red-200" 
                      : "bg-green-50 border border-green-200"
                }`}>
                  {loadingColaboradores ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-yellow-600"></div>
                      <span className="text-xs font-semibold text-yellow-700">Cargando...</span>
                    </>
                  ) : errorColaboradores ? (
                    <>
                      <svg className="w-3.5 h-3.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
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

              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-blue-700/20 backdrop-blur-md border-b border-blue-700/40">
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">NOMBRE</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">APELLIDO</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">ÁREA</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">CORREO</th>
                        <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-blue-800">ACCIÓN</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {loadingColaboradores ? (
                        <tr>
                          <td colSpan={5} className="px-3 py-8 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700"></div>
                              <span className="text-sm text-gray-600">Cargando colaboradores...</span>
                            </div>
                          </td>
                        </tr>
                      ) : inactivos.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-3 py-8 text-center text-sm text-gray-500">
                            No hay colaboradores inactivos
                          </td>
                        </tr>
                      ) : (
                        inactivos.map((colaborador, index) => {
                          // Encontrar el colaborador completo original
                          const colaboradorCompleto = colaboradoresCompletos.find(c => {
                            const getValue = (obj, keys) => {
                              for (const key of keys) {
                                if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
                                  return obj[key];
                                }
                              }
                              return "";
                            };
                            const idOriginal = getValue(c, ["id", "ID", "Id"]);
                            const nombreOriginal = getValue(c, ["nombre", "NOMBRE", "Nombre", "name", "NAME"]);
                            return (idOriginal && idOriginal === colaborador.id) || 
                                   (nombreOriginal && nombreOriginal === colaborador.nombre);
                          }) || colaboradoresCompletos[colaboradores.length + index] || null;

                          return (
                            <tr key={colaborador.id || `colab-inactivo-${index}`} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{colaborador.nombre}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{colaborador.apellido}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{colaborador.area}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{colaborador.correo}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                                  <button
                                    onClick={() => {
                                      setSelectedColaboradorCompleto(colaboradorCompleto);
                                      setIsVerDetallesModalOpen(true);
                                    }}
                                    className="flex items-center space-x-1 px-2.5 py-1 bg-blue-600/20 backdrop-blur-sm border border-blue-600/40 hover:bg-blue-600/30 hover:border-blue-700/60 text-blue-800 rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    <span>Ver Detalles</span>
                                  </button>
                              <button className="flex items-center space-x-1 px-2.5 py-1 bg-blue-700/20 backdrop-blur-sm border border-blue-700/40 hover:bg-blue-700/30 hover:border-blue-600/60 text-blue-800 rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span>Permisos</span>
                              </button>
                              <button className="flex items-center space-x-1 px-2.5 py-1 bg-green-600/20 backdrop-blur-sm border border-green-600/40 hover:bg-green-600/30 hover:border-green-700/60 text-green-700 rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Activar</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="bg-gray-50 px-3 py-2 flex items-center justify-between border-t border-gray-200">
                  <button className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    &lt; Anterior
                  </button>
                  <span className="text-[10px] text-gray-700 font-medium">
                    Página 1 de 1 (1 registros)
                  </span>
                  <button className="px-2.5 py-1 text-[10px] font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    Siguiente &gt;
                  </button>
                </div>
              </div>
            </div>
          </>
        );
      case "control-asistencia":
        return (
          <>
            {/* Registro de Asistencia */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#155EEF] to-[#1D4ED8] rounded-lg flex items-center justify-center text-white shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
                    {getIcon("clock")}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Registro Diario de Entrada y Salida</h2>
                    <p className="text-xs text-gray-600 mt-0.5">Control de asistencia del día</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1.5 bg-green-50 border border-green-200 rounded-lg px-2.5 py-1">
                  <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs font-semibold text-green-700">API Conectada</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-blue-700/20 backdrop-blur-md border-b border-blue-700/40">
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">NOMBRE</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">FECHA</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">ENTRADA</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">SALIDA</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">ESTADO</th>
                        <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-blue-800">ACCIÓN</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {registrosAsistencia.map((registro) => (
                        <tr key={registro.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{registro.nombre}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{registro.fecha}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{registro.entrada}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{registro.salida}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              registro.estado === "Normal" ? "bg-green-100 text-green-800" :
                              registro.estado === "Tardanza" ? "bg-yellow-100 text-yellow-800" :
                              "bg-red-100 text-red-800"
                            }`}>
                              {registro.estado}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <button className="flex items-center space-x-1 px-2.5 py-1 bg-blue-700/20 backdrop-blur-sm border border-blue-700/40 hover:bg-blue-700/30 hover:border-blue-600/60 text-blue-800 rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] mx-auto">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              <span>Ver Detalle</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Formularios de Incidencias */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#155EEF] to-[#1D4ED8] rounded-lg flex items-center justify-center text-white shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
                    {getIcon("clock")}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Formularios de Incidencias</h2>
                    <p className="text-xs text-gray-600 mt-0.5">Faltas, tardanzas y justificaciones</p>
                  </div>
                </div>
                <button className="flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-[#155EEF] to-[#1D4ED8] text-white rounded-lg font-semibold hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm active:scale-[0.98] text-sm group">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Registrar Incidencia</span>
                </button>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-blue-700/20 backdrop-blur-md border-b border-blue-700/40">
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">NOMBRE</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">TIPO</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">FECHA</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">JUSTIFICACIÓN</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">ESTADO</th>
                        <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-blue-800">ACCIÓN</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {incidenciasAsistencia.map((incidencia) => (
                        <tr key={incidencia.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{incidencia.nombre}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{incidencia.tipo}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{incidencia.fecha}</td>
                          <td className="px-3 py-2 text-[10px] text-gray-700">{incidencia.justificacion}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              incidencia.estado === "Aprobada" ? "bg-green-100 text-green-800" :
                              incidencia.estado === "Pendiente" ? "bg-yellow-100 text-yellow-800" :
                              "bg-red-100 text-red-800"
                            }`}>
                              {incidencia.estado}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-center">
                            <button className="flex items-center space-x-1 px-2.5 py-1 bg-blue-700/20 backdrop-blur-sm border border-blue-700/40 hover:bg-blue-700/30 hover:border-blue-600/60 text-blue-800 rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] mx-auto">
                              <span>Revisar</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        );

      case "gestion-permisos":
        return (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#155EEF] to-[#1D4ED8] rounded-lg flex items-center justify-center text-white shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
                    {getIcon("check")}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Solicitudes de Permisos</h2>
                  <p className="text-xs text-gray-600 mt-0.5">Gestión de permisos médicos, personales y otras actividades</p>
                </div>
              </div>
              <div className="flex items-center space-x-1.5">
                <button className="flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-[#155EEF] to-[#1D4ED8] text-white rounded-lg font-semibold hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm active:scale-[0.98] text-sm group">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Nueva Solicitud</span>
                </button>
                <div className="flex items-center space-x-1.5 bg-green-50 border border-green-200 rounded-lg px-2.5 py-1">
                  <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs font-semibold text-green-700">API Conectada</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-blue-700/20 backdrop-blur-md border-b border-blue-700/40">
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">NOMBRE</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">TIPO</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">FECHA</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">DÍAS</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">MOTIVO</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">JEFE</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">ESTADO</th>
                      <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-blue-800">ACCIÓN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {solicitudesPermisos.map((solicitud) => (
                      <tr key={solicitud.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{solicitud.nombre}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{solicitud.tipo}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{solicitud.fecha}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{solicitud.dias}</td>
                        <td className="px-3 py-2 text-[10px] text-gray-700">{solicitud.motivo}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{solicitud.jefe}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            solicitud.estado === "Aprobada" ? "bg-green-100 text-green-800" :
                            "bg-yellow-100 text-yellow-800"
                          }`}>
                            {solicitud.estado}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button className="flex items-center space-x-1 px-2.5 py-1 bg-green-600/20 backdrop-blur-sm border border-green-600/40 hover:bg-green-600/30 hover:border-green-700/60 text-green-700 rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                              <span>Aprobar</span>
                            </button>
                            <button className="flex items-center space-x-1 px-2.5 py-1 bg-red-600/20 backdrop-blur-sm border border-red-600/40 hover:bg-red-600/30 hover:border-red-700/60 text-red-700 rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              <span>Rechazar</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case "gestion-vacaciones":
        return (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center text-white border-2 border-blue-800 shadow-sm">
                  {getIcon("calendar")}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Solicitudes de Vacaciones</h2>
                  <p className="text-xs text-gray-600 mt-0.5">Calendario de vacaciones y solicitudes pendientes</p>
                </div>
              </div>
              <div className="flex items-center space-x-1.5">
                <button className="flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-[#155EEF] to-[#1D4ED8] text-white rounded-lg font-semibold hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm active:scale-[0.98] text-sm group">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Nueva Solicitud</span>
                </button>
                <div className="flex items-center space-x-1.5 bg-green-50 border border-green-200 rounded-lg px-2.5 py-1">
                  <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs font-semibold text-green-700">API Conectada</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-blue-700/20 backdrop-blur-md border-b border-blue-700/40">
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">NOMBRE</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">DÍAS ACUMULADOS</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">DÍAS SOLICITADOS</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">FECHA INICIO</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">FECHA FIN</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">ESTADO</th>
                      <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-blue-800">ACCIÓN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {solicitudesVacaciones.map((solicitud) => (
                      <tr key={solicitud.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{solicitud.nombre}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{solicitud.diasAcumulados} días</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{solicitud.diasSolicitados} días</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{solicitud.fechaInicio}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{solicitud.fechaFin}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            solicitud.estado === "Aprobada" ? "bg-green-100 text-green-800" :
                            "bg-yellow-100 text-yellow-800"
                          }`}>
                            {solicitud.estado}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button className="flex items-center space-x-1 px-2.5 py-1 bg-green-600/20 backdrop-blur-sm border border-green-600/40 hover:bg-green-600/30 hover:border-green-700/60 text-green-700 rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                              <span>Aprobar</span>
                            </button>
                            <button className="flex items-center space-x-1 px-2.5 py-1 bg-blue-700/20 backdrop-blur-sm border border-blue-700/40 hover:bg-blue-700/30 hover:border-blue-600/60 text-blue-800 rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              <span>Ver</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case "control-documentos":
        return (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center text-white border-2 border-blue-800 shadow-sm">
                  {getIcon("document")}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Control de Documentos Laborales</h2>
                  <p className="text-xs text-gray-600 mt-0.5">Alertas de vencimiento y repositorio de documentos</p>
                </div>
              </div>
              <div className="flex items-center space-x-1.5 bg-green-50 border border-green-200 rounded-lg px-2.5 py-1">
                <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-semibold text-green-700">API Conectada</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-blue-700/20 backdrop-blur-md border-b border-blue-700/40">
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">NOMBRE</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">TIPO DOCUMENTO</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">FECHA VENCIMIENTO</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">DÍAS RESTANTES</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">ESTADO</th>
                      <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-blue-800">ACCIÓN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {documentosLaborales.map((documento) => (
                      <tr key={documento.id} className={`hover:bg-gray-50 transition-colors ${documento.alerta ? "bg-red-50/30" : ""}`}>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{documento.nombre}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{documento.tipo}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{documento.fechaVencimiento}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{documento.diasRestantes} días</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            documento.estado === "Vigente" ? "bg-green-100 text-green-800" :
                            "bg-red-100 text-red-800"
                          }`}>
                            {documento.estado}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button className="flex items-center space-x-1 px-2.5 py-1 bg-blue-700/20 backdrop-blur-sm border border-blue-700/40 hover:bg-blue-700/30 hover:border-blue-600/60 text-blue-800 rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              <span>Ver</span>
                            </button>
                            <button className="flex items-center space-x-1 px-2.5 py-1 bg-green-600/20 backdrop-blur-sm border border-green-600/40 hover:bg-green-600/30 hover:border-green-700/60 text-green-700 rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              <span>Descargar</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case "gestion-remuneraciones":
        return (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center text-white border-2 border-blue-800 shadow-sm">
                  {getIcon("money")}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Gestión de Remuneraciones</h2>
                  <p className="text-xs text-gray-600 mt-0.5">Registro de sueldos, bonos, CTS y gratificaciones</p>
                </div>
              </div>
              <div className="flex items-center space-x-1.5">
                <button className="flex items-center space-x-1.5 px-3 py-2 bg-green-600/20 backdrop-blur-md border border-green-600/40 hover:bg-green-600/30 hover:border-green-700/60 text-green-700 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Exportar a Excel</span>
                </button>
                <div className="flex items-center space-x-1.5 bg-green-50 border border-green-200 rounded-lg px-2.5 py-1">
                  <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs font-semibold text-green-700">API Conectada</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-blue-700/20 backdrop-blur-md border-b border-blue-700/40">
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">NOMBRE</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">MES</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">SUELDO BASE</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">BONOS</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">CTS PROYECTADO</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">GRATIFICACIONES</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">TOTAL</th>
                      <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-blue-800">ACCIÓN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {remuneraciones.map((remuneracion) => (
                      <tr key={remuneracion.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{remuneracion.nombre}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{remuneracion.mes}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">S/ {remuneracion.sueldoBase.toLocaleString()}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">S/ {remuneracion.bonos.toLocaleString()}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">S/ {remuneracion.ctsProyectado.toLocaleString()}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">S/ {remuneracion.gratificaciones.toLocaleString()}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] font-bold text-blue-800">S/ {remuneracion.total.toLocaleString()}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-center">
                          <button className="flex items-center space-x-1 px-2.5 py-1 bg-blue-700/20 backdrop-blur-sm border border-blue-700/40 hover:bg-blue-700/30 hover:border-blue-600/60 text-blue-800 rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] mx-auto">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            <span>Ver Detalle</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case "auto-servicio":
        return (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center text-white border-2 border-blue-800 shadow-sm">
                  {getIcon("user")}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Portal del Colaborador</h2>
                  <p className="text-xs text-gray-600 mt-0.5">Auto-servicio para colaboradores</p>
                </div>
              </div>
              <div className="flex items-center space-x-1.5 bg-green-50 border border-green-200 rounded-lg px-2.5 py-1">
                <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-semibold text-green-700">API Conectada</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-4 border border-blue-200/60 shadow-md hover:shadow-lg transition-all">
                <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center text-white border-2 border-blue-800 shadow-sm mb-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1.5">Ver Datos Personales</h3>
                <p className="text-xs text-gray-600 mb-3">Consulta y actualiza tu información personal</p>
                <button className="w-full px-3 py-2 bg-blue-700/20 backdrop-blur-sm border border-blue-700/40 hover:bg-blue-700/30 hover:border-blue-600/60 text-blue-800 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md text-sm">
                  Acceder
                </button>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-4 border border-blue-200/60 shadow-md hover:shadow-lg transition-all">
                <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center text-white border-2 border-blue-800 shadow-sm mb-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1.5">Descargar Boletas</h3>
                <p className="text-xs text-gray-600 mb-3">Descarga tus boletas de pago históricas</p>
                <button className="w-full px-3 py-2 bg-blue-700/20 backdrop-blur-sm border border-blue-700/40 hover:bg-blue-700/30 hover:border-blue-600/60 text-blue-800 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md text-sm">
                  Acceder
                </button>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-4 border border-blue-200/60 shadow-md hover:shadow-lg transition-all">
                <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center text-white border-2 border-blue-800 shadow-sm mb-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1.5">Ver Vacaciones Acumuladas</h3>
                <p className="text-xs text-gray-600 mb-3">Consulta tus días de vacaciones disponibles</p>
                <button className="w-full px-3 py-2 bg-blue-700/20 backdrop-blur-sm border border-blue-700/40 hover:bg-blue-700/30 hover:border-blue-600/60 text-blue-800 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md text-sm">
                  Acceder
                </button>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-4 border border-blue-200/60 shadow-md hover:shadow-lg transition-all">
                <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center text-white border-2 border-blue-800 shadow-sm mb-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1.5">Solicitar Permisos</h3>
                <p className="text-xs text-gray-600 mb-3">Envía solicitudes de permisos médicos o personales</p>
                <button className="w-full px-3 py-2 bg-blue-700/20 backdrop-blur-sm border border-blue-700/40 hover:bg-blue-700/30 hover:border-blue-600/60 text-blue-800 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md text-sm">
                  Acceder
                </button>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-4 border border-blue-200/60 shadow-md hover:shadow-lg transition-all">
                <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center text-white border-2 border-blue-800 shadow-sm mb-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1.5">Solicitar Vacaciones</h3>
                <p className="text-xs text-gray-600 mb-3">Solicita tus días de vacaciones</p>
                <button className="w-full px-3 py-2 bg-blue-700/20 backdrop-blur-sm border border-blue-700/40 hover:bg-blue-700/30 hover:border-blue-600/60 text-blue-800 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md text-sm">
                  Acceder
                </button>
              </div>
            </div>
          </div>
        );

      case "calendario-cumpleanos":
        const semanas = generarCalendario();
        const hoy = new Date();
        const esHoy = (day) => {
          return day === hoy.getDate() && 
                 currentMonth === hoy.getMonth() && 
                 currentYear === hoy.getFullYear();
        };
        
        return (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-[#155EEF] to-[#1D4ED8] rounded-lg flex items-center justify-center text-white shadow-sm">
                  {getIcon("birthday")}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Calendario de Cumpleaños</h2>
                  <p className="text-xs text-gray-600 mt-0.5">Cumpleaños de colaboradores</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {/* Combobox para cambiar tipo de vista */}
                <select
                  value={vistaTipo}
                  onChange={(e) => setVistaTipo(e.target.value)}
                  className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
                >
                  <option value="mes">Por Mes</option>
                  <option value="año">Por Año</option>
                </select>
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
            </div>

            {errorCumpleanos && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errorCumpleanos}</p>
              </div>
            )}

            {vistaTipo === "mes" ? (
              <>
                {/* Controles de navegación del calendario */}
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

                {/* Calendario */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200/60 overflow-hidden">
                  {/* Encabezados de días */}
                  <div className="grid grid-cols-7 bg-blue-700/20 border-b border-blue-700/40">
                    {diasSemana.map((dia) => (
                      <div key={dia} className="px-2 py-2 text-center text-[10px] font-bold uppercase text-blue-800">
                        {dia}
                      </div>
                    ))}
                  </div>

                  {/* Días del calendario */}
                  <div className="divide-y divide-gray-100">
                    {semanas.map((semana, semanaIndex) => (
                      <div key={semanaIndex} className="grid grid-cols-7 divide-x divide-gray-100">
                        {semana.map((day, dayIndex) => {
                          if (day === null) {
                            return (
                              <div key={dayIndex} className="min-h-[80px] bg-gray-50"></div>
                            );
                          }
                          
                          const cumpleanosDelDia = getCumpleanosDelDia(day, currentMonth);
                          const esHoyDia = esHoy(day);
                          
                          return (
                            <div
                              key={dayIndex}
                              className={`min-h-[80px] p-1.5 ${
                                esHoyDia ? "bg-blue-100 border-2 border-blue-500" : "bg-white hover:bg-gray-50"
                              } transition-colors`}
                            >
                              <div className={`text-xs font-semibold mb-1 ${
                                esHoyDia ? "text-blue-700" : "text-gray-700"
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

                {/* Lista de cumpleaños del mes */}
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
                {/* Vista por año - Todos los meses */}
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
        );

      default:
        return (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gradient-to-br from-[#155EEF] to-[#1D4ED8] rounded-xl flex items-center justify-center text-white shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200 mx-auto mb-3">
                {getIcon(sections.find(s => s.id === activeSection)?.icon || "users")}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {sections.find(s => s.id === activeSection)?.name}
              </h3>
              <p className="text-gray-600">Esta sección estará disponible próximamente</p>
            </div>
          </div>
        );
    }
  };

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
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver al Menú</span>
            </button>

            {/* Header Principal */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6 mb-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#155EEF] to-[#1D4ED8] rounded-xl flex items-center justify-center text-white shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight">RECURSOS HUMANOS</h1>
                  <p className="text-sm text-gray-600 font-medium mt-0.5">Gestión de personal y nómina</p>
                </div>
              </div>

              {/* Navegación de Secciones */}
              <div className="flex flex-wrap gap-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg font-semibold transition-all duration-200 text-sm ${
                      activeSection === section.id
                        ? "bg-gradient-to-br from-[#155EEF] to-[#1D4ED8] text-white shadow-sm hover:shadow-md hover:scale-105"
                        : "bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <span className={activeSection === section.id ? "text-white" : "text-blue-800"}>{getIcon(section.icon)}</span>
                    <span>{section.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Contenido de la Sección Activa */}
            {renderSectionContent()}
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

      {/* Modal Ver Detalles Colaborador */}
      <Modal
        isOpen={isVerDetallesModalOpen}
        onClose={() => {
          setIsVerDetallesModalOpen(false);
          setSelectedColaboradorCompleto(null);
          setDatosEditables([]);
        }}
        title={`Detalles del Colaborador - ${selectedColaboradorCompleto ? (selectedColaboradorCompleto.nombre || selectedColaboradorCompleto.NOMBRE || selectedColaboradorCompleto.name || selectedColaboradorCompleto.NAME || "") : ""}`}
        size="lg"
      >
        {selectedColaboradorCompleto && (
          <div className="space-y-4">
            {/* Función helper para obtener valores */}
            {(() => {
              const getValue = (obj, keys) => {
                for (const key of keys) {
                  if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
                    return obj[key];
                  }
                }
                return null;
              };

              const formatValue = (value) => {
                if (value === null || value === undefined || value === "") {
                  return "No disponible";
                }
                if (typeof value === "object") {
                  return JSON.stringify(value, null, 2);
                }
                return String(value);
              };

              const formatDate = (dateValue) => {
                if (!dateValue) return "No disponible";
                try {
                  const date = new Date(dateValue);
                  if (!isNaN(date.getTime())) {
                    const dia = String(date.getDate()).padStart(2, "0");
                    const mes = String(date.getMonth() + 1).padStart(2, "0");
                    const año = date.getFullYear();
                    return `${dia}/${mes}/${año}`;
                  }
                  return dateValue;
                } catch (e) {
                  return dateValue;
                }
              };

              // Obtener todos los campos del objeto, excluyendo ID y ID_PERSONA
              const campos = Object.keys(selectedColaboradorCompleto).filter(campo => {
                const campoUpper = campo.toUpperCase();
                return campoUpper !== "ID" && campoUpper !== "ID_PERSONA";
              });
              
              // Función para formatear fechas
              const formatDateValue = (value) => {
                if (!value || value === null || value === undefined || value === "") {
                  return "-";
                }
                // Si ya es una fecha formateada, retornarla
                if (typeof value === "string" && value.includes("/")) {
                  return value;
                }
                // Intentar parsear como fecha
                try {
                  const date = new Date(value);
                  if (!isNaN(date.getTime())) {
                    const dia = String(date.getDate()).padStart(2, "0");
                    const mes = String(date.getMonth() + 1).padStart(2, "0");
                    const año = date.getFullYear();
                    return `${dia}/${mes}/${año}`;
                  }
                } catch (e) {
                  // Si no es fecha, retornar el valor original
                }
                return String(value);
              };

              // Separar campos simples de objetos/arrays
              const camposSimples = campos.filter(campo => {
                const valor = selectedColaboradorCompleto[campo];
                const campoLower = campo.toLowerCase();
                // Excluir DATOS que se maneja por separado
                if (campoLower === "datos") {
                  return false;
                }
                return typeof valor !== "object" || valor === null;
              });

              return (
                <>
                  {/* Todos los campos simples (incluyendo null) */}
                  <div className="grid grid-cols-2 gap-4">
                    {camposSimples.map((campo, index) => {
                      const value = selectedColaboradorCompleto[campo];
                      // Detectar si es una fecha
                      const campoLower = campo.toLowerCase();
                      const isDateField = campoLower.includes("fecha") || campoLower.includes("date");
                      const displayValue = isDateField ? formatDateValue(value) : formatValue(value);
                      
                      return (
                        <div key={index}>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            {campo.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                          </label>
                          <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                            {displayValue}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Campo DATOS especial - Array de teléfonos, correos, etc. */}
                  {(() => {
                    const datosField = getValue(selectedColaboradorCompleto, ["DATOS", "datos", "Datos"]);
                    
                    // Usar datosEditables (ya inicializados en useEffect)
                    const datosParaMostrar = datosEditables;
                    
                    if (datosParaMostrar && Array.isArray(datosParaMostrar) && datosParaMostrar.length > 0) {
                      // Agrupar por MEDIO
                      const agrupados = {};
                      datosParaMostrar.forEach((item, idx) => {
                        if (item && typeof item === "object") {
                          const medio = getValue(item, ["MEDIO", "medio", "Medio"]) || "OTRO";
                          const tipo = getValue(item, ["TIPO", "tipo", "Tipo"]) || "";
                          const nombre = getValue(item, ["NOMBRE", "nombre", "Nombre"]) || "";
                          const contenido = getValue(item, ["CONTENIDO", "contenido", "Contenido"]) || "";
                          
                          if (!agrupados[medio]) {
                            agrupados[medio] = [];
                          }
                          agrupados[medio].push({
                            tipo,
                            nombre,
                            contenido,
                            index: idx,
                            originalItem: item
                          });
                        }
                      });

                      return (
                        <div className="border-t border-gray-200 pt-4 mt-4">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-gray-800">DATOS</h3>
                          </div>
                          {Object.keys(agrupados).map((medio, medioIndex) => (
                            <div key={medioIndex} className="mb-5">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-bold text-blue-800 uppercase border-b border-blue-200 pb-2">
                                  {medio}
                                </h4>
                                <button
                                  onClick={() => {
                                    const nuevoItem = {
                                      TIPO: "",
                                      MEDIO: medio,
                                      NOMBRE: "",
                                      CONTENIDO: ""
                                    };
                                    setDatosEditables([...datosParaMostrar, nuevoItem]);
                                  }}
                                  className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                  </svg>
                                  <span>Agregar</span>
                                </button>
                              </div>
                              <div className="space-y-3">
                                {agrupados[medio].map((item, itemIndex) => (
                                  <div key={itemIndex} className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg p-4 shadow-sm relative">
                                    <button
                                      onClick={() => {
                                        const nuevosDatos = datosParaMostrar.filter((_, idx) => idx !== item.index);
                                        setDatosEditables(nuevosDatos);
                                      }}
                                      className="absolute top-2 right-2 flex items-center space-x-1 px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                                      title="Eliminar"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                      <span>Eliminar</span>
                                    </button>
                                    <div className="space-y-2 pr-8">
                                      {item.tipo && (
                                        <div className="flex items-start">
                                          <span className="text-xs font-bold text-gray-700 min-w-[80px]">Tipo:</span>
                                          <span className="text-xs font-semibold text-gray-900 bg-white px-2 py-1 rounded border border-gray-200">
                                            {item.tipo}
                                          </span>
                                        </div>
                                      )}
                                      {item.nombre && (
                                        <div className="flex items-start">
                                          <span className="text-xs font-bold text-gray-700 min-w-[80px]">Nombre:</span>
                                          <span className="text-xs text-gray-900 bg-white px-2 py-1 rounded border border-gray-200">
                                            {item.nombre}
                                          </span>
                                        </div>
                                      )}
                                      {item.contenido && (
                                        <div className="flex items-start">
                                          <span className="text-xs font-bold text-gray-700 min-w-[80px]">Contenido:</span>
                                          <span className="text-xs font-semibold text-blue-900 bg-white px-2 py-1 rounded border border-blue-300 break-all">
                                            {item.contenido}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Otros objetos anidados (excluyendo DATOS) */}
                  {campos.filter(campo => {
                    const campoLower = campo.toLowerCase();
                    const valor = selectedColaboradorCompleto[campo];
                    // Excluir DATOS (ya se muestra arriba) tanto si es array como objeto
                    if (campoLower === "datos") {
                      return false;
                    }
                    return typeof valor === "object" && 
                           valor !== null &&
                           !Array.isArray(valor);
                  }).map((campo, index) => {
                    const objeto = selectedColaboradorCompleto[campo];
                    const subCampos = Object.keys(objeto);
                    
                    return (
                      <div key={`nested-${index}`} className="border-t border-gray-200 pt-4 mt-4">
                        <h3 className="text-sm font-bold text-gray-800 mb-3">
                          {campo.charAt(0).toUpperCase() + campo.slice(1).replace(/_/g, " ")}
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          {subCampos.map((subCampo, subIndex) => {
                            const value = objeto[subCampo];
                            const displayValue = formatValue(value);
                            
                            return (
                              <div key={subIndex}>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                  {subCampo.charAt(0).toUpperCase() + subCampo.slice(1).replace(/_/g, " ")}
                                </label>
                                <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                                  {displayValue}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </>
              );
            })()}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function RecursosHumanosPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    }>
      <RecursosHumanosContent />
    </Suspense>
  );
}

