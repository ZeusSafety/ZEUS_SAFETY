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
  const [expandedSections, setExpandedSections] = useState({
    "gestion-colaboradores": false,
    "control-asistencia": false,
    "gestion-permisos": false,
    "gestion-vacaciones": false,
    "control-documentos": false,
    "gestion-remuneraciones": false,
    "auto-servicio": false,
    "solicitudes-incidencias": false,
  });
  
  // Estados para colaboradores
  const [colaboradores, setColaboradores] = useState([]);
  const [colaboradoresCompletos, setColaboradoresCompletos] = useState([]);
  const [loadingColaboradores, setLoadingColaboradores] = useState(true);
  const [errorColaboradores, setErrorColaboradores] = useState(null);
  const [isVerDetallesModalOpen, setIsVerDetallesModalOpen] = useState(false);
  const [selectedColaboradorCompleto, setSelectedColaboradorCompleto] = useState(null);
  const [datosEditables, setDatosEditables] = useState([]);
  const [savingDatos, setSavingDatos] = useState(false);
  const [errorSavingDatos, setErrorSavingDatos] = useState(null);
  const [loadingMedios, setLoadingMedios] = useState(false);
  const [mediosComunicacion, setMediosComunicacion] = useState([]); // Array con IDs de la BD

  // Función para obtener el ID del colaborador
  const getColaboradorId = (colaborador) => {
    const getValue = (obj, keys) => {
      for (const key of keys) {
        if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
          return obj[key];
        }
      }
      return null;
    };
    return getValue(colaborador, ["id", "ID", "Id", "_id", "ID_PERSONA", "id_persona", "ID_COLABORADOR", "id_colaborador"]);
  };

  // Función para cargar medios de comunicación desde la API
  const fetchMediosComunicacion = useCallback(async (colaboradorId) => {
    try {
      setLoadingMedios(true);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No se encontró el token de autenticación");
      }

      const response = await fetch(`/api/medios-comunicacion?id_colaborador=${colaboradorId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Error desconocido" }));
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      const data = await response.json();
      const mediosArray = Array.isArray(data) ? data : [];
      
      // Guardar medios con IDs de la BD
      setMediosComunicacion(mediosArray);
      
      // Mapear a formato para datosEditables
      const datosMapeados = mediosArray.map(medio => ({
        ID: medio.ID || medio.id,
        id: medio.ID || medio.id,
        NOMBRE: medio.NOMBRE || medio.nombre || "",
        nombre: medio.NOMBRE || medio.nombre || "",
        MEDIO: medio.MEDIO || medio.medio || "CORREO",
        medio: medio.MEDIO || medio.medio || "CORREO",
        TIPO: medio.TIPO || medio.tipo || "",
        tipo: medio.TIPO || medio.tipo || "",
        CONTENIDO: medio.CONTENIDO || medio.contenido || "",
        contenido: medio.CONTENIDO || medio.contenido || "",
      }));
      
      setDatosEditables(datosMapeados);
    } catch (error) {
      console.error("Error al cargar medios de comunicación:", error);
      setMediosComunicacion([]);
      setDatosEditables([]);
    } finally {
      setLoadingMedios(false);
    }
  }, []);

  // Cargar medios de comunicación cuando se abre el modal
  useEffect(() => {
    if (isVerDetallesModalOpen && selectedColaboradorCompleto) {
      const colaboradorId = getColaboradorId(selectedColaboradorCompleto);
      if (colaboradorId) {
        fetchMediosComunicacion(colaboradorId);
      } else {
        setDatosEditables([]);
        setMediosComunicacion([]);
      }
    } else {
      setDatosEditables([]);
      setMediosComunicacion([]);
    }
  }, [isVerDetallesModalOpen, selectedColaboradorCompleto, fetchMediosComunicacion]);

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
      ];
      if (validSections.includes(section)) {
        setExpandedSections((prev) => ({
          ...prev,
          [section]: true,
        }));
      }
    }
  }, [searchParams]);

  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
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
    if (!loading && user && expandedSections["gestion-colaboradores"]) {
      fetchColaboradores();
    }
  }, [loading, user, expandedSections, fetchColaboradores]);

  // Función para agregar un medio de comunicación
  const handleAgregarMedio = async (nuevoMedio) => {
    if (!selectedColaboradorCompleto) return;

    try {
      setSavingDatos(true);
      setErrorSavingDatos(null);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No se encontró el token de autenticación");
      }

      const colaboradorId = getColaboradorId(selectedColaboradorCompleto);
      if (!colaboradorId) {
        throw new Error("No se pudo obtener el ID del colaborador");
      }

      // Validar campos requeridos
      if (!nuevoMedio.nombre || !nuevoMedio.medio || !nuevoMedio.tipo || !nuevoMedio.contenido) {
        throw new Error("Todos los campos son requeridos");
      }

      const response = await fetch("/api/medios-comunicacion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          id_colaborador: colaboradorId,
          nombre: nuevoMedio.nombre || nuevoMedio.NOMBRE,
          medio: nuevoMedio.medio || nuevoMedio.MEDIO,
          tipo: nuevoMedio.tipo || nuevoMedio.TIPO,
          contenido: nuevoMedio.contenido || nuevoMedio.CONTENIDO
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Error desconocido" }));
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      const result = await response.json();
      
      // Recargar medios de comunicación
      await fetchMediosComunicacion(colaboradorId);
      
      return result;
    } catch (error) {
      console.error("Error al agregar medio:", error);
      setErrorSavingDatos(error.message || "Error al agregar el medio de comunicación");
      throw error;
    } finally {
      setSavingDatos(false);
    }
  };

  // Función para actualizar un medio de comunicación
  const handleActualizarMedio = async (medioId, datosActualizados) => {
    if (!selectedColaboradorCompleto) return;

    try {
      setSavingDatos(true);
      setErrorSavingDatos(null);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No se encontró el token de autenticación");
      }

      const colaboradorId = getColaboradorId(selectedColaboradorCompleto);
      if (!colaboradorId) {
        throw new Error("No se pudo obtener el ID del colaborador");
      }

      // Validar campos requeridos
      if (!datosActualizados.nombre || !datosActualizados.medio || !datosActualizados.tipo || !datosActualizados.contenido) {
        throw new Error("Todos los campos son requeridos");
      }

      const response = await fetch(`/api/medios-comunicacion?action=update&id=${medioId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre: datosActualizados.nombre || datosActualizados.NOMBRE,
          medio: datosActualizados.medio || datosActualizados.MEDIO,
          tipo: datosActualizados.tipo || datosActualizados.TIPO,
          contenido: datosActualizados.contenido || datosActualizados.CONTENIDO
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Error desconocido" }));
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      // Recargar medios de comunicación
      await fetchMediosComunicacion(colaboradorId);
    } catch (error) {
      console.error("Error al actualizar medio:", error);
      setErrorSavingDatos(error.message || "Error al actualizar el medio de comunicación");
      throw error;
    } finally {
      setSavingDatos(false);
    }
  };

  // Función para eliminar un medio de comunicación
  const handleEliminarMedio = async (medioId) => {
    if (!selectedColaboradorCompleto) return;

    try {
      setSavingDatos(true);
      setErrorSavingDatos(null);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No se encontró el token de autenticación");
      }

      const colaboradorId = getColaboradorId(selectedColaboradorCompleto);
      if (!colaboradorId) {
        throw new Error("No se pudo obtener el ID del colaborador");
      }

      const response = await fetch(`/api/medios-comunicacion?action=delete&id=${medioId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Error desconocido" }));
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      // Recargar medios de comunicación
      await fetchMediosComunicacion(colaboradorId);
    } catch (error) {
      console.error("Error al eliminar medio:", error);
      setErrorSavingDatos(error.message || "Error al eliminar el medio de comunicación");
      throw error;
    } finally {
      setSavingDatos(false);
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
    { id: "solicitudes-incidencias", name: "Solicitudes/Incidencias", icon: "solicitudes" },
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
      solicitudes: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    };
    return icons[iconName] || icons.users;
  };

  const renderGestionColaboradoresContent = () => {
    // Esta función renderiza solo el contenido de gestión de colaboradores
    return (
      <>
        {/* Listado de Colaboradores */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
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

              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-blue-700 border-b-2 border-blue-800">
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">NOMBRE</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">APELLIDO</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ÁREA</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">CORREO</th>
                        <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ACCIÓN</th>
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
                            <tr key={colaborador.id || `colab-${index}`} className="hover:bg-slate-200 transition-colors">
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{colaborador.nombre}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{colaborador.apellido}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{colaborador.area}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{colaborador.correo || ""}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center space-x-2">
                                  <button
                                    onClick={() => {
                                      setSelectedColaboradorCompleto(colaboradorCompleto);
                                      setIsVerDetallesModalOpen(true);
                                    }}
                                    className="inline-flex items-center space-x-1 px-2.5 py-1 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                                    title="Ver detalles del colaborador"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" style={{ pointerEvents: 'none' }}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    <span style={{ pointerEvents: 'none' }}>Ver Detalles</span>
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
                <div className="bg-slate-200 px-3 py-2 flex items-center justify-between border-t-2 border-slate-300">
                  <button disabled className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" aria-label="Primera página">
                    «
                  </button>
                  <button disabled className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" aria-label="Página anterior">
                    &lt;
                  </button>
                  <span className="text-[10px] text-gray-700 font-medium">
                    Página 1 de 3
                  </span>
                  <button className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" aria-label="Página siguiente">
                    &gt;
                  </button>
                  <button className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" aria-label="Última página">
                    »
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
                      <tr className="bg-blue-700 border-b-2 border-blue-800">
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">NOMBRE</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">APELLIDO</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ÁREA</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">CORREO</th>
                        <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ACCIÓN</th>
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
                            <tr key={colaborador.id || `colab-inactivo-${index}`} className="hover:bg-slate-200 transition-colors">
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{colaborador.nombre}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{colaborador.apellido}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{colaborador.area}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{colaborador.correo || ""}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center space-x-2">
                                  <button
                                    onClick={() => {
                                      setSelectedColaboradorCompleto(colaboradorCompleto);
                                      setIsVerDetallesModalOpen(true);
                                    }}
                                    className="inline-flex items-center space-x-1 px-2.5 py-1 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                                    title="Ver detalles del colaborador"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" style={{ pointerEvents: 'none' }}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    <span style={{ pointerEvents: 'none' }}>Ver Detalles</span>
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
                <div className="bg-slate-200 px-3 py-2 flex items-center justify-between border-t-2 border-slate-300">
                  <button disabled className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" aria-label="Primera página">
                    «
                  </button>
                  <button disabled className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" aria-label="Página anterior">
                    &lt;
                  </button>
                  <span className="text-[10px] text-gray-700 font-medium">
                    Página 1 de 1
                  </span>
                  <button disabled className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" aria-label="Página siguiente">
                    &gt;
                  </button>
                  <button disabled className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" aria-label="Última página">
                    »
                  </button>
                </div>
              </div>
            </div>
          </>
        );
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
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver al Menú</span>
            </button>

            {/* Card contenedor blanco */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">

            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] rounded-xl flex items-center justify-center text-white shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight">RECURSOS HUMANOS</h1>
                  <p className="text-sm text-gray-600 font-medium mt-0.5">Gestión de personal y nómina</p>
                </div>
              </div>
            </div>

            {/* Secciones */}
            <div className="space-y-3">
              {sections.map((section) => (
                <div key={section.id} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                  {/* Header de Sección */}
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] text-white hover:shadow-md hover:scale-[1.01] transition-all duration-200 shadow-sm"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="text-white">{getIcon(section.icon)}</div>
                      <h2 className="text-base font-bold text-white">{section.name}</h2>
                    </div>
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${expandedSections[section.id] ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Contenido de la Sección */}
                  {expandedSections[section.id] && (
                    <div className="p-4 bg-white">
                      {section.id === "gestion-colaboradores" ? (
                        <div className="space-y-4">
                          {renderGestionColaboradoresContent()}
                        </div>
                      ) : section.id === "solicitudes-incidencias" ? (
                        <div className="p-3 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl">
                          <div className="grid gap-2.5 grid-cols-1">
                            <div
                              className="group bg-white rounded-xl p-3 border border-gray-200/80 hover:border-blue-500/60 hover:shadow-lg transition-all duration-300 ease-out relative overflow-hidden"
                              style={{ 
                                boxShadow: '0px 2px 8px rgba(0,0,0,0.04)',
                                transform: 'translateY(0)'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0px 8px 20px rgba(30, 99, 247, 0.12)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0px 2px 8px rgba(0,0,0,0.04)';
                              }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-blue-50/0 group-hover:from-blue-50/30 group-hover:to-transparent transition-all duration-300 pointer-events-none rounded-xl" />
                              
                              <div className="relative z-10">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 group-hover:from-blue-700 group-hover:to-blue-800 rounded-lg flex items-center justify-center text-white shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:scale-110">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                  </div>
                                </div>
                                <h3 className="text-sm font-bold text-slate-900 mb-1.5 leading-tight group-hover:text-blue-700 transition-colors duration-200">Listado de Solicitudes/Incidencias</h3>
                                <p className="text-[11px] text-slate-600 mb-2.5 leading-relaxed line-clamp-2">Ver y gestionar Solicitudes/Incidencias</p>
                                <button 
                                  onClick={() => router.push("/recursos-humanos/solicitudes-incidencias")}
                                  className="w-full flex items-center justify-center space-x-1.5 px-2.5 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 group-hover:from-blue-700 group-hover:to-blue-800 text-white rounded-lg font-medium transition-all duration-300 shadow-sm hover:shadow-md text-xs active:scale-[0.97] relative overflow-hidden"
                                >
                                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/0 to-white/0 group-hover:from-white/0 group-hover:via-white/20 group-hover:to-white/0 group-hover:animate-shimmer" />
                                  <span className="relative z-10 flex items-center space-x-1.5">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    <span>Ver Solicitudes/Incidencias</span>
                                  </span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="w-12 h-12 bg-gradient-to-br from-[#155EEF] to-[#1D4ED8] rounded-xl flex items-center justify-center text-white shadow-sm mx-auto mb-3">
                            {getIcon(section.icon)}
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{section.name}</h3>
                          <p className="text-gray-600">Esta sección estará disponible próximamente</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            </div>
          </div>
        </main>
      </div>

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

              // Organizar campos en secciones
              const getFieldValue = (fieldKeys) => {
                for (const key of fieldKeys) {
                  const value = getValue(selectedColaboradorCompleto, [key, key.toUpperCase(), key.toLowerCase()]);
                  if (value !== null && value !== undefined && value !== "") {
                    return value;
                  }
                }
                return null;
              };

              const formatFieldValue = (value) => {
                if (value === null || value === undefined || value === "") {
                  return "No disponible";
                }
                return String(value);
              };

              // Información Personal
              const infoPersonal = {
                nombre: formatFieldValue(getFieldValue(["nombre", "NOMBRE", "name", "NAME"])),
                segundoNombre: formatFieldValue(getFieldValue(["segundo_nombre", "SEGUNDO_NOMBRE", "segundoNombre", "2do_nombre", "2DO_NOMBRE"])),
                apellido: formatFieldValue(getFieldValue(["apellido", "APELLIDO", "lastname", "LASTNAME"])),
                segundoApellido: formatFieldValue(getFieldValue(["segundo_apellido", "SEGUNDO_APELLIDO", "segundoApellido", "2do_apellido", "2DO_APELLIDO"])),
                fechaNacimiento: formatDateValue(getFieldValue(["fecha_nacimiento", "FECHA_NACIMIENTO", "fechaNacimiento", "fecha_nac", "FECHA_NAC"])),
                tipoDocumento: formatFieldValue(getFieldValue(["tipo_documento", "TIPO_DOCUMENTO", "tipoDocumento", "tipo_doc", "TIPO_DOC"])),
                numeroDocumento: formatFieldValue(getFieldValue(["numero_documento", "NUMERO_DOCUMENTO", "numeroDocumento", "n_doc", "N_DOC", "documento", "DOCUMENTO"])),
                estadoCivil: formatFieldValue(getFieldValue(["estado_civil", "ESTADO_CIVIL", "estadoCivil"])),
                estado: formatFieldValue(getFieldValue(["estado", "ESTADO", "status", "STATUS"])),
              };

              // Información Familiar
              const infoFamiliar = {
                tieneHijos: formatFieldValue(getFieldValue(["hijos_boolean", "HIJOS_BOOLEAN", "tieneHijos", "TIENE_HIJOS"])),
                cantHijos: formatFieldValue(getFieldValue(["cant_hijos", "CANT_HIJOS", "cantidadHijos", "CANTIDAD_HIJOS"])),
              };

              // Ubicación
              const ubicacion = {
                direccion: formatFieldValue(getFieldValue(["direccion", "DIRECCION", "address", "ADDRESS"])),
                googleMaps: formatFieldValue(getFieldValue(["google_maps", "GOOGLE_MAPS", "googleMaps"])),
              };

              // Información Laboral
              const infoLaboral = {
                ocupacion: formatFieldValue(getFieldValue(["ocupacion", "OCUPACION", "occupation", "OCCUPATION"])),
                cargo: formatFieldValue(getFieldValue(["cargo", "CARGO", "position", "POSITION"])),
                area: formatFieldValue(getFieldValue(["area", "AREA", "departamento", "DEPARTAMENTO"])),
                rol: formatFieldValue(getFieldValue(["rol", "ROL", "role", "ROLE"])),
              };

              // Seguros
              const seguros = {
                seguroVidaLey: formatFieldValue(getFieldValue(["seguro_vida_ley", "SEGURO_VIDA_LEY", "seguroVidaLey"])),
                fechaVencimiento: formatDateValue(getFieldValue(["seguro_fecha_vencimiento", "SEGURO_FECHA_VENCIMIENTO", "fecha_vencimiento", "FECHA_VENCIMIENTO"])),
                fechaInicio: formatDateValue(getFieldValue(["seguro_fecha_inicio", "SEGURO_FECHA_INICIO", "fecha_inicio", "FECHA_INICIO"])),
              };

              const SeccionField = ({ label, value }) => {
                const isAvailable = value !== "No disponible" && value !== "-";
                return (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      {label}
                    </label>
                    <p className={`text-sm px-3 py-2 rounded-lg border ${
                      isAvailable 
                        ? "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 text-gray-900 font-medium" 
                        : "bg-gray-50 border-gray-200 text-gray-500"
                    }`}>
                      {value}
                    </p>
                  </div>
                );
              };

              const Seccion = ({ title, children }) => (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-[#1E63F7] to-[#1D4ED8] px-4 py-3">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wide">{title}</h3>
                  </div>
                  <div className="p-4">
                    {children}
                  </div>
                </div>
              );

              return (
                <div className="space-y-5">
                  {/* Información Personal */}
                  <Seccion title="Información Personal">
                    <div className="grid grid-cols-2 gap-4">
                      <SeccionField label="Nombre" value={infoPersonal.nombre} />
                      <SeccionField label="2do Nombre" value={infoPersonal.segundoNombre} />
                      <SeccionField label="Apellido" value={infoPersonal.apellido} />
                      <SeccionField label="2do Apellido" value={infoPersonal.segundoApellido} />
                      <SeccionField label="Fecha Nac" value={infoPersonal.fechaNacimiento} />
                      <SeccionField label="Tipo Doc" value={infoPersonal.tipoDocumento} />
                      <SeccionField label="N° Doc" value={infoPersonal.numeroDocumento} />
                      <SeccionField label="Estado civil" value={infoPersonal.estadoCivil} />
                      <SeccionField label="Estado" value={infoPersonal.estado} />
                    </div>
                  </Seccion>

                  {/* Información Familiar */}
                  <Seccion title="Información Familiar">
                    <div className="grid grid-cols-2 gap-4">
                      <SeccionField label="¿Tiene hijos?" value={infoFamiliar.tieneHijos} />
                      <SeccionField label="Cant hijos" value={infoFamiliar.cantHijos} />
                    </div>
                  </Seccion>

                  {/* Ubicación */}
                  <Seccion title="Ubicación">
                    <div className="grid grid-cols-2 gap-4">
                      <SeccionField label="Dirección" value={ubicacion.direccion} />
                      <SeccionField label="Google Maps" value={ubicacion.googleMaps} />
                    </div>
                  </Seccion>

                  {/* Información Laboral */}
                  <Seccion title="Información Laboral">
                    <div className="grid grid-cols-2 gap-4">
                      <SeccionField label="Ocupación" value={infoLaboral.ocupacion} />
                      <SeccionField label="Cargo" value={infoLaboral.cargo} />
                      <SeccionField label="Área" value={infoLaboral.area} />
                      <SeccionField label="Rol" value={infoLaboral.rol} />
                    </div>
                  </Seccion>

                  {/* Seguros */}
                  <Seccion title="Seguros">
                    <div className="grid grid-cols-2 gap-4">
                      <SeccionField label="Seguro Vida Ley" value={seguros.seguroVidaLey} />
                      <SeccionField label="Fecha vencimiento" value={seguros.fechaVencimiento} />
                      <SeccionField label="Fecha inicio" value={seguros.fechaInicio} />
                    </div>
                  </Seccion>

                  {/* Campo DATOS especial - Array de teléfonos, correos, etc. */}
                  {(() => {
                    const datosField = getValue(selectedColaboradorCompleto, ["DATOS", "datos", "Datos"]);
                    
                    // Usar datosEditables (ya inicializados en useEffect)
                    const datosParaMostrar = datosEditables || [];
                    
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
                          medio,
                          index: idx,
                          originalItem: item,
                          ID: getValue(item, ["ID", "id", "Id"]),
                          id: getValue(item, ["ID", "id", "Id"])
                        });
                      }
                    });

                    // Si no hay datos, mostrar al menos la opción de agregar para CORREO
                    if (Object.keys(agrupados).length === 0) {
                      agrupados["CORREO"] = [];
                    }
                    
                    if (Object.keys(agrupados).length > 0) {

                      return (
                        <div className="border-t border-gray-200 pt-4 mt-4">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-gray-800">DATOS</h3>
                            {loadingMedios && (
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Cargando...</span>
                              </div>
                            )}
                          </div>
                          {errorSavingDatos && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <p className="text-sm text-red-600">{errorSavingDatos}</p>
                            </div>
                          )}
                          {Object.keys(agrupados).map((medio, medioIndex) => (
                            <div key={medioIndex} className="mb-5">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-bold text-blue-800 uppercase border-b border-blue-200 pb-2">
                                  {medio}
                                </h4>
                                <button
                                  onClick={() => {
                                    // Solo agregar un formulario vacío a la UI (no guardar todavía)
                                    const nuevoItem = {
                                      TIPO: "",
                                      tipo: "",
                                      MEDIO: medio,
                                      medio: medio,
                                      NOMBRE: "",
                                      nombre: "",
                                      CONTENIDO: "",
                                      contenido: ""
                                    };
                                    const nuevosDatos = [...datosParaMostrar, nuevoItem];
                                    setDatosEditables(nuevosDatos);
                                    setErrorSavingDatos(null);
                                  }}
                                  disabled={savingDatos || loadingMedios}
                                  className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-xs font-semibold transition-all duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed"
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
                                    <div className="absolute top-2 right-2 flex items-center space-x-2 z-10">
                                      {/* Botón Guardar/Actualizar */}
                                      {(() => {
                                        const medioId = item.ID || item.id || item.originalItem?.ID || item.originalItem?.id || datosParaMostrar[item.index]?.ID || datosParaMostrar[item.index]?.id;
                                        const itemActual = datosParaMostrar[item.index] || {};
                                        const tieneTodosLosCampos = (itemActual.tipo || itemActual.TIPO) && (itemActual.medio || itemActual.MEDIO) && (itemActual.nombre || itemActual.NOMBRE) && (itemActual.contenido || itemActual.CONTENIDO);
                                        
                                        if (medioId) {
                                          // Si tiene ID, mostrar botón "Actualizar"
                                          return (
                                            <button
                                              onClick={async () => {
                                                if (!tieneTodosLosCampos) {
                                                  setErrorSavingDatos("Todos los campos son requeridos");
                                                  return;
                                                }
                                                try {
                                                  await handleActualizarMedio(medioId, itemActual);
                                                  setErrorSavingDatos(null);
                                                } catch (error) {
                                                  // Error ya se muestra en errorSavingDatos
                                                }
                                              }}
                                              disabled={savingDatos || loadingMedios || !tieneTodosLosCampos}
                                              className="flex items-center space-x-1 px-2 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm disabled:cursor-not-allowed"
                                              title="Actualizar"
                                            >
                                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                              </svg>
                                              <span>Actualizar</span>
                                            </button>
                                          );
                                        } else {
                                          // Si no tiene ID, mostrar botón "Guardar"
                                          return (
                                            <button
                                              onClick={async () => {
                                                if (!tieneTodosLosCampos) {
                                                  setErrorSavingDatos("Todos los campos son requeridos");
                                                  return;
                                                }
                                                try {
                                                  await handleAgregarMedio(itemActual);
                                                  setErrorSavingDatos(null);
                                                } catch (error) {
                                                  // Error ya se muestra en errorSavingDatos
                                                }
                                              }}
                                              disabled={savingDatos || loadingMedios || !tieneTodosLosCampos}
                                              className="flex items-center space-x-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm disabled:cursor-not-allowed"
                                              title="Guardar"
                                            >
                                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                              </svg>
                                              <span>Guardar</span>
                                            </button>
                                          );
                                        }
                                      })()}
                                      
                                      {/* Botón Eliminar */}
                                      <button
                                        onClick={async () => {
                                          const medioId = item.originalItem?.ID || item.originalItem?.id || datosParaMostrar[item.index]?.ID || datosParaMostrar[item.index]?.id;
                                          if (medioId) {
                                            // Si tiene ID, eliminar de la BD
                                            try {
                                              await handleEliminarMedio(medioId);
                                              setErrorSavingDatos(null);
                                            } catch (error) {
                                              // Error ya se muestra en errorSavingDatos
                                            }
                                          } else {
                                            // Si no tiene ID, solo eliminar de la UI (medio nuevo no guardado)
                                            const nuevosDatos = datosParaMostrar.filter((_, idx) => idx !== item.index);
                                            setDatosEditables(nuevosDatos);
                                          }
                                        }}
                                        disabled={savingDatos || loadingMedios}
                                        className="flex items-center space-x-1 px-2 py-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm disabled:cursor-not-allowed"
                                        title="Eliminar"
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        <span>Eliminar</span>
                                      </button>
                                    </div>
                                    <div className="space-y-3 pr-32">
                                      <div className="flex items-start">
                                        <label className="text-xs font-bold text-gray-700 min-w-[80px] pt-1.5">Tipo:</label>
                                        <div className="flex-1 flex items-center space-x-4">
                                          <label className="flex items-center space-x-1.5 cursor-pointer">
                                            <input
                                              type="checkbox"
                                              checked={item.tipo === "CORPORATIVO" || item.tipo === "corporativo" || item.TIPO === "CORPORATIVO"}
                                              onChange={(e) => {
                                                const nuevosDatos = [...datosParaMostrar];
                                                const itemActual = nuevosDatos[item.index] || {};
                                                // Si se selecciona CORPORATIVO, deseleccionar PERSONAL
                                                const nuevoTipo = e.target.checked ? "CORPORATIVO" : "";
                                                nuevosDatos[item.index] = {
                                                  ...itemActual,
                                                  TIPO: nuevoTipo,
                                                  tipo: nuevoTipo,
                                                  MEDIO: itemActual.MEDIO || itemActual.medio || item.medio || "TELEFONO",
                                                  medio: itemActual.medio || itemActual.MEDIO || item.medio || "TELEFONO"
                                                };
                                                setDatosEditables(nuevosDatos);
                                                setErrorSavingDatos(null); // Limpiar error al cambiar
                                              }}
                                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                            />
                                            <span className="text-xs text-gray-700">CORPORATIVO</span>
                                          </label>
                                          <label className="flex items-center space-x-1.5 cursor-pointer">
                                            <input
                                              type="checkbox"
                                              checked={item.tipo === "PERSONAL" || item.tipo === "personal" || item.TIPO === "PERSONAL"}
                                              onChange={(e) => {
                                                const nuevosDatos = [...datosParaMostrar];
                                                const itemActual = nuevosDatos[item.index] || {};
                                                // Si se selecciona PERSONAL, deseleccionar CORPORATIVO
                                                const nuevoTipo = e.target.checked ? "PERSONAL" : "";
                                                nuevosDatos[item.index] = {
                                                  ...itemActual,
                                                  TIPO: nuevoTipo,
                                                  tipo: nuevoTipo,
                                                  MEDIO: itemActual.MEDIO || itemActual.medio || item.medio || "TELEFONO",
                                                  medio: itemActual.medio || itemActual.MEDIO || item.medio || "TELEFONO"
                                                };
                                                setDatosEditables(nuevosDatos);
                                                setErrorSavingDatos(null); // Limpiar error al cambiar
                                              }}
                                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                            />
                                            <span className="text-xs text-gray-700">PERSONAL</span>
                                          </label>
                                        </div>
                                      </div>
                                      
                                      {/* Medio */}
                                      <div className="flex items-start">
                                        <label className="text-xs font-bold text-gray-700 min-w-[80px] pt-1.5">Medio:</label>
                                        <div className="flex-1 flex items-center space-x-3">
                                          <label className="flex items-center space-x-1.5 cursor-pointer">
                                            <input
                                              type="radio"
                                              name={`medio-${item.index}`}
                                              checked={(item.medio === "TELEFONO" || item.MEDIO === "TELEFONO")}
                                              onChange={(e) => {
                                                const nuevosDatos = [...datosParaMostrar];
                                                const itemActual = nuevosDatos[item.index] || {};
                                                nuevosDatos[item.index] = {
                                                  ...itemActual,
                                                  MEDIO: "TELEFONO",
                                                  medio: "TELEFONO"
                                                };
                                                setDatosEditables(nuevosDatos);
                                                setErrorSavingDatos(null);
                                              }}
                                              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500"
                                            />
                                            <span className="text-xs text-gray-700">TELEFONO</span>
                                          </label>
                                          <label className="flex items-center space-x-1.5 cursor-pointer">
                                            <input
                                              type="radio"
                                              name={`medio-${item.index}`}
                                              checked={(item.medio === "CORREO" || item.MEDIO === "CORREO")}
                                              onChange={(e) => {
                                                const nuevosDatos = [...datosParaMostrar];
                                                const itemActual = nuevosDatos[item.index] || {};
                                                nuevosDatos[item.index] = {
                                                  ...itemActual,
                                                  MEDIO: "CORREO",
                                                  medio: "CORREO"
                                                };
                                                setDatosEditables(nuevosDatos);
                                                setErrorSavingDatos(null);
                                              }}
                                              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500"
                                            />
                                            <span className="text-xs text-gray-700">CORREO</span>
                                          </label>
                                          <label className="flex items-center space-x-1.5 cursor-pointer">
                                            <input
                                              type="radio"
                                              name={`medio-${item.index}`}
                                              checked={(item.medio === "TELEFONO_EMERGENCIA" || item.MEDIO === "TELEFONO_EMERGENCIA")}
                                              onChange={(e) => {
                                                const nuevosDatos = [...datosParaMostrar];
                                                const itemActual = nuevosDatos[item.index] || {};
                                                nuevosDatos[item.index] = {
                                                  ...itemActual,
                                                  MEDIO: "TELEFONO_EMERGENCIA",
                                                  medio: "TELEFONO_EMERGENCIA"
                                                };
                                                setDatosEditables(nuevosDatos);
                                                setErrorSavingDatos(null);
                                              }}
                                              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500"
                                            />
                                            <span className="text-xs text-gray-700">TELEFONO EMERGENCIA</span>
                                          </label>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-start">
                                        <label className="text-xs font-bold text-gray-700 min-w-[80px] pt-1.5">Nombre:</label>
                                        <input
                                          type="text"
                                          value={item.nombre || ""}
                                          onChange={(e) => {
                                            const nuevosDatos = [...datosParaMostrar];
                                            const itemActual = nuevosDatos[item.index] || {};
                                            nuevosDatos[item.index] = {
                                              ...itemActual,
                                              NOMBRE: e.target.value,
                                              nombre: e.target.value,
                                              MEDIO: itemActual.MEDIO || itemActual.medio || item.medio || "OTRO",
                                              medio: itemActual.medio || itemActual.MEDIO || item.medio || "OTRO"
                                            };
                                            setDatosEditables(nuevosDatos);
                                            setErrorSavingDatos(null); // Limpiar error al cambiar
                                          }}
                                          placeholder="Ej: CORREO PERSONAL 1"
                                          className="flex-1 text-xs text-gray-900 bg-white px-3 py-1.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                      </div>
                                      <div className="flex items-start">
                                        <label className="text-xs font-bold text-gray-700 min-w-[80px] pt-1.5">Contenido:</label>
                                        <input
                                          type="text"
                                          value={item.contenido || ""}
                                          onChange={(e) => {
                                            const nuevosDatos = [...datosParaMostrar];
                                            const itemActual = nuevosDatos[item.index] || {};
                                            nuevosDatos[item.index] = {
                                              ...itemActual,
                                              CONTENIDO: e.target.value,
                                              contenido: e.target.value,
                                              MEDIO: itemActual.MEDIO || itemActual.medio || item.medio || "TELEFONO",
                                              medio: itemActual.medio || itemActual.MEDIO || item.medio || "TELEFONO"
                                            };
                                            setDatosEditables(nuevosDatos);
                                            setErrorSavingDatos(null); // Limpiar error al cambiar
                                          }}
                                          placeholder={
                                            (item.medio === "CORREO" || item.MEDIO === "CORREO") 
                                              ? "Ej: correo@ejemplo.com" 
                                              : (item.medio === "TELEFONO_EMERGENCIA" || item.MEDIO === "TELEFONO_EMERGENCIA")
                                              ? "Ej: 987654321"
                                              : "Ej: 956224010"
                                          }
                                          className="flex-1 text-xs font-semibold text-blue-900 bg-white px-3 py-1.5 rounded border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent break-all"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    // Si no hay datos, mostrar la sección vacía con opción de agregar
                    return (
                        <div className="border-t border-gray-200 pt-4 mt-4">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-gray-800">DATOS</h3>
                            {loadingMedios && (
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Cargando...</span>
                              </div>
                            )}
                          </div>
                          {errorSavingDatos && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <p className="text-sm text-red-600">{errorSavingDatos}</p>
                            </div>
                          )}
                        <div className="mb-5">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-bold text-blue-800 uppercase border-b border-blue-200 pb-2">
                              CORREO
                            </h4>
                            <button
                              onClick={() => {
                                // Solo agregar un formulario vacío a la UI (no guardar todavía)
                                const nuevoItem = {
                                  TIPO: "",
                                  tipo: "",
                                  MEDIO: "TELEFONO",
                                  medio: "TELEFONO",
                                  NOMBRE: "",
                                  nombre: "",
                                  CONTENIDO: "",
                                  contenido: ""
                                };
                                setDatosEditables([nuevoItem]);
                                setErrorSavingDatos(null);
                              }}
                              disabled={savingDatos || loadingMedios}
                              className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-xs font-semibold transition-all duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                              </svg>
                              <span>Agregar</span>
                            </button>
                          </div>
                          
                          {/* Mostrar formulario si hay datos editables (aunque estén vacíos) */}
                          {datosEditables.length > 0 ? (
                            <div className="space-y-3">
                              {datosEditables.map((item, idx) => {
                                const medioId = item?.ID || item?.id;
                                const tieneTodosLosCampos = item?.tipo && item?.medio && item?.nombre && item?.contenido;
                                
                                return (
                                  <div key={idx} className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg p-4 shadow-sm relative">
                                    <div className="absolute top-2 right-2 flex items-center space-x-2 z-10">
                                      {/* Botón Guardar (solo para nuevos) */}
                                      {!medioId && (
                                        <button
                                          onClick={async () => {
                                            if (!tieneTodosLosCampos) {
                                              setErrorSavingDatos("Todos los campos son requeridos");
                                              return;
                                            }
                                            try {
                                              await handleAgregarMedio(item);
                                              setErrorSavingDatos(null);
                                            } catch (error) {
                                              // Error ya se muestra en errorSavingDatos
                                            }
                                          }}
                                          disabled={savingDatos || loadingMedios || !tieneTodosLosCampos}
                                          className="flex items-center space-x-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm disabled:cursor-not-allowed"
                                          title="Guardar"
                                        >
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                          </svg>
                                          <span>Guardar</span>
                                        </button>
                                      )}
                                      
                                      {/* Botón Eliminar */}
                                      <button
                                        onClick={() => {
                                          if (medioId) {
                                            handleEliminarMedio(medioId).catch(() => {});
                                          } else {
                                            const nuevosDatos = datosEditables.filter((_, i) => i !== idx);
                                            setDatosEditables(nuevosDatos);
                                          }
                                        }}
                                        disabled={savingDatos || loadingMedios}
                                        className="flex items-center space-x-1 px-2 py-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm disabled:cursor-not-allowed"
                                        title="Eliminar"
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        <span>Eliminar</span>
                                      </button>
                                    </div>
                                    
                                    <div className="space-y-3 pr-32">
                                      {/* Tipo */}
                                      <div className="flex items-start">
                                        <label className="text-xs font-bold text-gray-700 min-w-[80px] pt-1.5">Tipo:</label>
                                        <div className="flex-1 flex items-center space-x-4">
                                          <label className="flex items-center space-x-1.5 cursor-pointer">
                                            <input
                                              type="checkbox"
                                              checked={item.tipo === "CORPORATIVO" || item.TIPO === "CORPORATIVO"}
                                              onChange={(e) => {
                                                const nuevosDatos = [...datosEditables];
                                                nuevosDatos[idx] = {
                                                  ...item,
                                                  TIPO: e.target.checked ? "CORPORATIVO" : "",
                                                  tipo: e.target.checked ? "CORPORATIVO" : "",
                                                  MEDIO: item.MEDIO || item.medio || "CORREO",
                                                  medio: item.medio || item.MEDIO || "CORREO"
                                                };
                                                setDatosEditables(nuevosDatos);
                                                setErrorSavingDatos(null);
                                              }}
                                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                            />
                                            <span className="text-xs text-gray-700">CORPORATIVO</span>
                                          </label>
                                          <label className="flex items-center space-x-1.5 cursor-pointer">
                                            <input
                                              type="checkbox"
                                              checked={item.tipo === "PERSONAL" || item.TIPO === "PERSONAL"}
                                              onChange={(e) => {
                                                const nuevosDatos = [...datosEditables];
                                                nuevosDatos[idx] = {
                                                  ...item,
                                                  TIPO: e.target.checked ? "PERSONAL" : "",
                                                  tipo: e.target.checked ? "PERSONAL" : "",
                                                  MEDIO: item.MEDIO || item.medio || "CORREO",
                                                  medio: item.medio || item.MEDIO || "CORREO"
                                                };
                                                setDatosEditables(nuevosDatos);
                                                setErrorSavingDatos(null);
                                              }}
                                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                            />
                                            <span className="text-xs text-gray-700">PERSONAL</span>
                                          </label>
                                        </div>
                                      </div>
                                      
                                      {/* Medio */}
                                      <div className="flex items-start">
                                        <label className="text-xs font-bold text-gray-700 min-w-[80px] pt-1.5">Medio:</label>
                                        <div className="flex-1 flex items-center space-x-3">
                                          <label className="flex items-center space-x-1.5 cursor-pointer">
                                            <input
                                              type="radio"
                                              name={`medio-${idx}`}
                                              checked={(item.medio === "TELEFONO" || item.MEDIO === "TELEFONO")}
                                              onChange={(e) => {
                                                const nuevosDatos = [...datosEditables];
                                                nuevosDatos[idx] = {
                                                  ...item,
                                                  MEDIO: "TELEFONO",
                                                  medio: "TELEFONO"
                                                };
                                                setDatosEditables(nuevosDatos);
                                                setErrorSavingDatos(null);
                                              }}
                                              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500"
                                            />
                                            <span className="text-xs text-gray-700">TELEFONO</span>
                                          </label>
                                          <label className="flex items-center space-x-1.5 cursor-pointer">
                                            <input
                                              type="radio"
                                              name={`medio-${idx}`}
                                              checked={(item.medio === "CORREO" || item.MEDIO === "CORREO")}
                                              onChange={(e) => {
                                                const nuevosDatos = [...datosEditables];
                                                nuevosDatos[idx] = {
                                                  ...item,
                                                  MEDIO: "CORREO",
                                                  medio: "CORREO"
                                                };
                                                setDatosEditables(nuevosDatos);
                                                setErrorSavingDatos(null);
                                              }}
                                              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500"
                                            />
                                            <span className="text-xs text-gray-700">CORREO</span>
                                          </label>
                                          <label className="flex items-center space-x-1.5 cursor-pointer">
                                            <input
                                              type="radio"
                                              name={`medio-${idx}`}
                                              checked={(item.medio === "TELEFONO_EMERGENCIA" || item.MEDIO === "TELEFONO_EMERGENCIA")}
                                              onChange={(e) => {
                                                const nuevosDatos = [...datosEditables];
                                                nuevosDatos[idx] = {
                                                  ...item,
                                                  MEDIO: "TELEFONO_EMERGENCIA",
                                                  medio: "TELEFONO_EMERGENCIA"
                                                };
                                                setDatosEditables(nuevosDatos);
                                                setErrorSavingDatos(null);
                                              }}
                                              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500"
                                            />
                                            <span className="text-xs text-gray-700">TELEFONO EMERGENCIA</span>
                                          </label>
                                        </div>
                                      </div>
                                      
                                      {/* Nombre */}
                                      <div className="flex items-start">
                                        <label className="text-xs font-bold text-gray-700 min-w-[80px] pt-1.5">Nombre:</label>
                                        <input
                                          type="text"
                                          value={item.nombre || item.NOMBRE || ""}
                                          onChange={(e) => {
                                            const nuevosDatos = [...datosEditables];
                                            nuevosDatos[idx] = {
                                              ...item,
                                              NOMBRE: e.target.value,
                                              nombre: e.target.value
                                            };
                                            setDatosEditables(nuevosDatos);
                                            setErrorSavingDatos(null);
                                          }}
                                          placeholder="Ej: CORREO PERSONAL 1"
                                          className="flex-1 text-xs text-gray-900 bg-white px-3 py-1.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                      </div>
                                      
                                      {/* Contenido */}
                                      <div className="flex items-start">
                                        <label className="text-xs font-bold text-gray-700 min-w-[80px] pt-1.5">Contenido:</label>
                                        <input
                                          type="text"
                                          value={item.contenido || item.CONTENIDO || ""}
                                          onChange={(e) => {
                                            const nuevosDatos = [...datosEditables];
                                            nuevosDatos[idx] = {
                                              ...item,
                                              CONTENIDO: e.target.value,
                                              contenido: e.target.value
                                            };
                                            setDatosEditables(nuevosDatos);
                                            setErrorSavingDatos(null);
                                          }}
                                          placeholder={
                                            (item.medio === "CORREO" || item.MEDIO === "CORREO") 
                                              ? "Ej: correo@ejemplo.com" 
                                              : (item.medio === "TELEFONO_EMERGENCIA" || item.MEDIO === "TELEFONO_EMERGENCIA")
                                              ? "Ej: 987654321"
                                              : "Ej: 956224010"
                                          }
                                          className="flex-1 text-xs font-semibold text-blue-900 bg-white px-3 py-1.5 rounded border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent break-all"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 italic">No hay datos de medios de comunicación registrados. Haz clic en "Agregar" para comenzar.</p>
                          )}
                        </div>
                      </div>
                    );
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
                </div>
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

