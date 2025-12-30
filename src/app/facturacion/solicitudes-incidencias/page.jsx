"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../../../components/context/AuthContext";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";
import Modal from "../../../components/ui/Modal";

// Usar el proxy de Next.js para evitar problemas de CORS
const API_URL = "/api/solicitudes-incidencias";

export default function SolicitudesIncidenciasPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [solicitudes, setSolicitudes] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [errorAPI, setErrorAPI] = useState(null);

  // Filtros - Iniciar con FACTURACION seleccionado por defecto
  const [areaRecepcion, setAreaRecepcion] = useState("FACTURACION");

  // Filtros adicionales
  const [colaborador, setColaborador] = useState("");
  const [estado, setEstado] = useState("");
  const [mostrarIncidencias, setMostrarIncidencias] = useState(false);
  const [areaEmision, setAreaEmision] = useState("");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Modales
  const [modalRequerimientosOpen, setModalRequerimientosOpen] = useState(false);
  const [modalRespuestasOpen, setModalRespuestasOpen] = useState(false);
  const [modalReprogramacionesOpen, setModalReprogramacionesOpen] = useState(false);
  const [modalHistorialReqExtraOpen, setModalHistorialReqExtraOpen] = useState(false);
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [modalProcedimientosOpen, setModalProcedimientosOpen] = useState(false);
  const [textoModal, setTextoModal] = useState("");
  const [tituloModal, setTituloModal] = useState("");
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);

  // Estados para el formulario de edición
  const [formFechaRespuesta, setFormFechaRespuesta] = useState("");
  const [formRespondidoPor, setFormRespondidoPor] = useState("");
  const [formNombrePersona, setFormNombrePersona] = useState("");
  const [formRespuesta, setFormRespuesta] = useState("");
  const [formArchivoInforme, setFormArchivoInforme] = useState(null);
  const [formArchivoNombre, setFormArchivoNombre] = useState("");
  const [formEstado, setFormEstado] = useState("");
  const [formReprogramacion, setFormReprogramacion] = useState(false);
  
  // Estados para reprogramaciones
  const [reprogramaciones, setReprogramaciones] = useState([]);
  const [reprogramacionesCargadas, setReprogramacionesCargadas] = useState([]);
  const [idRespuesta, setIdRespuesta] = useState(null);
  const [checkboxReprogramacionHabilitado, setCheckboxReprogramacionHabilitado] = useState(false);
  
  // Estados para barras de progreso
  const [progresoRespuesta, setProgresoRespuesta] = useState(0);
  const [guardandoRespuesta, setGuardandoRespuesta] = useState(false);
  const [progresoReprogramacion, setProgresoReprogramacion] = useState({});
  const [guardandoReprogramacion, setGuardandoReprogramacion] = useState({});

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

  // Cargar solicitudes desde la API
  useEffect(() => {
    if (user) {
      cargarSolicitudes();
    }
  }, [user]);

  const cargarSolicitudes = async () => {
    try {
      setLoadingData(true);
      setErrorAPI(null);
      const token = localStorage.getItem("token");

      // Usar el proxy de Next.js que maneja CORS y autenticación
      // El parámetro listado se pasa como query param
      const response = await fetch(`${API_URL}?listado=facturacion`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log('Datos recibidos de la API:', data);

      if (Array.isArray(data)) {
        setSolicitudes(data);
        setErrorAPI(null);
      } else {
        setSolicitudes([]);
        setErrorAPI(null);
      }
    } catch (error) {
      console.error("Error al obtener datos:", error);
      setSolicitudes([]);
      setErrorAPI("Error al cargar datos");
    } finally {
      setLoadingData(false);
    }
  };

  // Filtrar solicitudes dinámicamente
  const solicitudesFiltradas = useMemo(() => {
    let filtered = [...solicitudes];

    // Filtrar por área de recepción
    if (areaRecepcion) {
      filtered = filtered.filter(s => {
        const area = s.AREA_RECEPCION || s.area_recepcion || "";
        return area === areaRecepcion;
      });
    }

    // Filtrar por área de Emision (solo si hay un valor seleccionado)
    if (areaEmision && areaEmision.trim() !== "") {
      filtered = filtered.filter(s => {
        // Buscar el área en múltiples campos posibles
        const area = s.AREA_EMISION || s.area_emision || s.AREA || s.area || "";
        return area && area.trim() !== "" && area.toUpperCase() === areaEmision.toUpperCase();
      });
    }

    // Filtrar por colaborador
    if (colaborador.trim()) {
      const term = colaborador.toLowerCase();
      filtered = filtered.filter(s => {
        const registradoPor = (s.REGISTRADO_POR || s.registrado_por || "").toLowerCase();
        return registradoPor.includes(term);
      });
    }

    // Filtrar por estado
    if (estado) {
      filtered = filtered.filter(s => {
        const estadoSolicitud = s.ESTADO || s.estado || "";
        return estadoSolicitud === estado;
      });
    }

    // Filtrar incidencias
    if (!mostrarIncidencias) {
      filtered = filtered.filter(s => {
        const incidencia = s.RES_INCIDENCIA || s.res_incidencia || "";
        return !incidencia || incidencia.trim() === "" || incidencia === "-";
      });
    } else {
      // Si mostrarIncidencias está activo, mostrar solo las que tienen incidencia
      filtered = filtered.filter(s => {
        const incidencia = s.RES_INCIDENCIA || s.res_incidencia || "";
        return incidencia && incidencia.trim() !== "" && incidencia !== "-";
      });
    }

    // Ordenar por FECHA_CONSULTA de manera descendente (más recientes primero)
    filtered.sort((a, b) => {
      const fechaA = a.FECHA_CONSULTA || a.fecha_consulta || a.FECHA || a.fecha || "";
      const fechaB = b.FECHA_CONSULTA || b.fecha_consulta || b.FECHA || b.fecha || "";
      
      if (!fechaA && !fechaB) return 0;
      if (!fechaA) return 1; // Sin fecha al final
      if (!fechaB) return -1; // Sin fecha al final
      
      const dateA = new Date(fechaA);
      const dateB = new Date(fechaB);
      
      // Orden descendente: más recientes primero
      return dateB.getTime() - dateA.getTime();
    });

    return filtered;
  }, [solicitudes, areaRecepcion, areaEmision, colaborador, estado, mostrarIncidencias]);

  // Calcular paginación
  const totalPages = Math.ceil(solicitudesFiltradas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const solicitudesPaginadas = solicitudesFiltradas.slice(startIndex, endIndex);

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [areaRecepcion, colaborador, estado, mostrarIncidencias]);

  // Funciones para modales
  const mostrarTextoEnModal = (texto, titulo) => {
    setTextoModal(texto || "No especificado.");
    setTituloModal(titulo);
    if (titulo === "Requerimientos") {
      setModalRequerimientosOpen(true);
    } else if (titulo === "Respuesta") {
      setModalRespuestasOpen(true);
    }
  };

  const verReprogramaciones = (solicitud) => {
    setSolicitudSeleccionada(solicitud);
    setModalReprogramacionesOpen(true);
  };

  const verHistorialReqExtra = (solicitud) => {
    setSolicitudSeleccionada(solicitud);
    setModalHistorialReqExtraOpen(true);
  };

  const abrirModalEditar = async (solicitud) => {
    setSolicitudSeleccionada(solicitud);

    // Verificar si tiene respuesta registrada
    const tieneRespuesta = solicitud.ID_RESPUESTA || solicitud.RESPUESTA || solicitud.RESPUESTA_R;
    
    // Formatear fecha para el input datetime-local
    let fechaFormateada = "";
    
    if (tieneRespuesta && solicitud.FECHA_RESPUESTA) {
      // Si ya hay respuesta registrada, usar la fecha de esa respuesta
      try {
        const fecha = new Date(solicitud.FECHA_RESPUESTA);
        if (!isNaN(fecha.getTime())) {
          const year = fecha.getFullYear();
          const month = String(fecha.getMonth() + 1).padStart(2, '0');
          const day = String(fecha.getDate()).padStart(2, '0');
          const hours = String(fecha.getHours()).padStart(2, '0');
          const minutes = String(fecha.getMinutes()).padStart(2, '0');
          const seconds = String(fecha.getSeconds()).padStart(2, '0');
          fechaFormateada = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
        }
      } catch (e) {
        console.error("Error al formatear fecha:", e);
      }
    }
    
    // Si no hay respuesta registrada, usar la fecha y hora actual
    if (!fechaFormateada) {
      const ahora = new Date();
      const year = ahora.getFullYear();
      const month = String(ahora.getMonth() + 1).padStart(2, '0');
      const day = String(ahora.getDate()).padStart(2, '0');
      const hours = String(ahora.getHours()).padStart(2, '0');
      const minutes = String(ahora.getMinutes()).padStart(2, '0');
      const seconds = String(ahora.getSeconds()).padStart(2, '0');
      fechaFormateada = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    }

    setFormFechaRespuesta(fechaFormateada);
    setFormRespondidoPor(solicitud.RESPONDIDO_POR || "");
    setFormNombrePersona(solicitud.RESPONDIDO_POR || "");
    setFormRespuesta(solicitud.RESPUESTA_R || solicitud.RESPUESTA || "");
    setFormArchivoInforme(null);
    setFormArchivoNombre(solicitud.INFORME_RESPUESTA ? "Archivo existente" : "");
    setFormEstado(solicitud.ESTADO || "Pendiente");
    
    // Guardar ID_RESPUESTA si existe
    if (tieneRespuesta && solicitud.ID_RESPUESTA) {
      setIdRespuesta(solicitud.ID_RESPUESTA);
    }
    
    // Verificar si tiene reprogramaciones - verificar múltiples formas
    let tieneRepro = false;
    let reprogramacionesData = [];
    
    // Verificar si viene como array
    if (solicitud.REPROGRAMACIONES) {
      if (Array.isArray(solicitud.REPROGRAMACIONES) && solicitud.REPROGRAMACIONES.length > 0) {
        tieneRepro = true;
        reprogramacionesData = solicitud.REPROGRAMACIONES;
      } else if (typeof solicitud.REPROGRAMACIONES === 'string' && solicitud.REPROGRAMACIONES.trim() !== '') {
        try {
          const parsed = JSON.parse(solicitud.REPROGRAMACIONES);
          if (Array.isArray(parsed) && parsed.length > 0) {
            tieneRepro = true;
            reprogramacionesData = parsed;
          }
        } catch (e) {
          // No es JSON válido
        }
      }
    }
    
    // Verificar campos individuales de reprogramación
    if (!tieneRepro) {
      const tieneRepro1 = solicitud.FECHA_REPROGRAMACION || solicitud.RESPUESTA_REPROGRAMACION || solicitud.INFORME_REPROGRAMACION;
      const tieneRepro2 = solicitud.FECHA_REPROGRAMACION_2 || solicitud.RESPUESTA_2 || solicitud.INFORME_2;
      const tieneRepro3 = solicitud.FECHA_REPROGRAMACION_3 || solicitud.RESPUESTA_3 || solicitud.INFORME_3;
      
      if (tieneRepro1 || tieneRepro2 || tieneRepro3) {
        tieneRepro = true;
        // Construir array de reprogramaciones desde campos individuales
        if (tieneRepro1) {
          reprogramacionesData.push({
            ID_REPROGRAMACION: solicitud.ID_REPROGRAMACION || solicitud.ID_REPROGRAMACION_1,
            FECHA_REPROGRAMACION: solicitud.FECHA_REPROGRAMACION,
            RESPUESTA: solicitud.RESPUESTA_REPROGRAMACION || solicitud.RESPUESTA_REPROG,
            INFORME: solicitud.INFORME_REPROGRAMACION || solicitud.INFORME_REPROG,
            FH_RESPUESTA: solicitud.FH_RESPUESTA || solicitud.FH_RESPUESTA_1,
            FH_INFORME: solicitud.FH_INFORME || solicitud.FH_INFORME_1
          });
        }
        if (tieneRepro2) {
          reprogramacionesData.push({
            ID_REPROGRAMACION: solicitud.ID_REPROGRAMACION_2,
            FECHA_REPROGRAMACION: solicitud.FECHA_REPROGRAMACION_2,
            RESPUESTA: solicitud.RESPUESTA_2 || solicitud.RESPUESTA_REPROG_2,
            INFORME: solicitud.INFORME_2 || solicitud.INFORME_REPROG_2,
            FH_RESPUESTA: solicitud.FH_RESPUESTA_2,
            FH_INFORME: solicitud.FH_INFORME_2
          });
        }
        if (tieneRepro3) {
          reprogramacionesData.push({
            ID_REPROGRAMACION: solicitud.ID_REPROGRAMACION_3,
            FECHA_REPROGRAMACION: solicitud.FECHA_REPROGRAMACION_3,
            RESPUESTA: solicitud.RESPUESTA_3 || solicitud.RESPUESTA_REPROG_3,
            INFORME: solicitud.INFORME_3 || solicitud.INFORME_REPROG_3,
            FH_RESPUESTA: solicitud.FH_RESPUESTA_3,
            FH_INFORME: solicitud.FH_INFORME_3
          });
        }
      }
    }
    
    // El checkbox debe estar habilitado si hay respuesta registrada
    // No importa si hay reprogramaciones o no, solo necesita tener respuesta
    // El checkbox se marca solo si hay reprogramaciones registradas
    setCheckboxReprogramacionHabilitado(!!tieneRespuesta);
    setFormReprogramacion(tieneRepro);
    
    // Cargar reprogramaciones si existen
    if (tieneRepro && reprogramacionesData.length > 0) {
      // Cargar directamente las reprogramaciones encontradas
      setReprogramacionesCargadas(reprogramacionesData);
      
      // Inicializar las reprogramaciones para edición
      const reprogForm = reprogramacionesData.map(r => {
        let fechaFormateada = "";
        if (r.FECHA_REPROGRAMACION) {
          try {
            const fecha = new Date(r.FECHA_REPROGRAMACION);
            if (!isNaN(fecha.getTime())) {
              const year = fecha.getFullYear();
              const month = String(fecha.getMonth() + 1).padStart(2, '0');
              const day = String(fecha.getDate()).padStart(2, '0');
              const hours = String(fecha.getHours()).padStart(2, '0');
              const minutes = String(fecha.getMinutes()).padStart(2, '0');
              fechaFormateada = `${year}-${month}-${day}T${hours}:${minutes}`;
            }
          } catch (e) {
            console.error("Error al formatear fecha:", e);
          }
        }
        
        return {
          id: r.ID_REPROGRAMACION || null,
          fecha: fechaFormateada,
          motivo: r.RESPUESTA || r.RESPUESTA_REPROG || "",
          informe: null,
          informeNombre: r.INFORME || r.INFORME_REPROG ? "Archivo existente" : "",
          fhRespuesta: r.FH_RESPUESTA || null,
          fhInforme: r.FH_INFORME || null
        };
      });
      setReprogramaciones(reprogForm);
    } else {
      setReprogramaciones([]);
      setReprogramacionesCargadas([]);
    }
    
    setModalEditarOpen(true);
  };
  
  // Función para cargar reprogramaciones
  const cargarReprogramaciones = async (idRespuesta) => {
    try {
      if (!solicitudSeleccionada) return;
      
      let reprog = [];
      if (solicitudSeleccionada.REPROGRAMACIONES) {
        if (Array.isArray(solicitudSeleccionada.REPROGRAMACIONES)) {
          reprog = solicitudSeleccionada.REPROGRAMACIONES;
        } else if (typeof solicitudSeleccionada.REPROGRAMACIONES === 'string') {
          try {
            reprog = JSON.parse(solicitudSeleccionada.REPROGRAMACIONES);
          } catch (e) {
            reprog = [];
          }
        }
      }
      
      setReprogramacionesCargadas(reprog);
      
      // Inicializar las reprogramaciones para edición
      if (reprog.length > 0) {
        const reprogForm = reprog.map(r => {
          let fechaFormateada = "";
          if (r.FECHA_REPROGRAMACION) {
            try {
              const fecha = new Date(r.FECHA_REPROGRAMACION);
              if (!isNaN(fecha.getTime())) {
                const year = fecha.getFullYear();
                const month = String(fecha.getMonth() + 1).padStart(2, '0');
                const day = String(fecha.getDate()).padStart(2, '0');
                const hours = String(fecha.getHours()).padStart(2, '0');
                const minutes = String(fecha.getMinutes()).padStart(2, '0');
                fechaFormateada = `${year}-${month}-${day}T${hours}:${minutes}`;
              }
            } catch (e) {
              console.error("Error al formatear fecha:", e);
            }
          }
          
          return {
            id: r.ID_REPROGRAMACION || null,
            fecha: fechaFormateada,
            motivo: r.RESPUESTA || r.RESPUESTA_REPROG || "",
            informe: null,
            informeNombre: r.INFORME || r.INFORME_REPROG ? "Archivo existente" : "",
            fhRespuesta: r.FH_RESPUESTA || null,
            fhInforme: r.FH_INFORME || null
          };
        });
        setReprogramaciones(reprogForm);
      } else {
        setReprogramaciones([]);
      }
    } catch (error) {
      console.error("Error al cargar reprogramaciones:", error);
      setReprogramaciones([]);
      setReprogramacionesCargadas([]);
    }
  };

  const handleGuardarEdicion = async () => {
    if (!solicitudSeleccionada) return;

    try {
      setGuardandoRespuesta(true);
      setProgresoRespuesta(0);
      
      const token = localStorage.getItem("token");

      // Preparar datos para enviar según el formato requerido
      const formData = new FormData();
      formData.append('ID_SOLICITUD', solicitudSeleccionada.ID_SOLICITUD || solicitudSeleccionada.id || solicitudSeleccionada.ID);
      formData.append('RESPONDIDO_POR', formRespondidoPor === "OTROS" ? formNombrePersona : formRespondidoPor);
      formData.append('RESPUESTA', formRespuesta);
      formData.append('ESTADO', formEstado);

      if (formArchivoInforme) {
        formData.append('informe', formArchivoInforme);
      } else {
        formData.append('informe', '');
      }

      // Simular progreso de carga
      const progressInterval = setInterval(() => {
        setProgresoRespuesta(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      // Llamada al endpoint PUT usando el proxy de Next.js
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: formData
      });

      clearInterval(progressInterval);
      setProgresoRespuesta(100);

      if (response.ok) {
        const data = await response.json();
        // Si se guardó correctamente y hay ID_RESPUESTA, guardarlo para las reprogramaciones
        if (data.ID_RESPUESTA) {
          setIdRespuesta(data.ID_RESPUESTA);
        } else if (solicitudSeleccionada.ID_RESPUESTA) {
          setIdRespuesta(solicitudSeleccionada.ID_RESPUESTA);
        }
        
        // Recargar solicitudes
        await cargarSolicitudes();
        
        // Habilitar el checkbox ya que ahora hay una respuesta registrada
        setCheckboxReprogramacionHabilitado(true);
        
        // Si hay reprogramaciones activas, no cerrar el modal aún
        if (!formReprogramacion) {
          setTimeout(() => {
            setProgresoRespuesta(0);
            setGuardandoRespuesta(false);
            alert("Respuesta añadida correctamente. Ahora puedes agregar reprogramaciones si lo necesitas.");
          }, 500);
        } else {
          setTimeout(() => {
            setProgresoRespuesta(0);
            setGuardandoRespuesta(false);
            alert("Respuesta guardada. Ahora puedes agregar reprogramaciones.");
          }, 500);
        }
      } else {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        setProgresoRespuesta(0);
        setGuardandoRespuesta(false);
        alert("Error al actualizar la respuesta");
      }
    } catch (error) {
      console.error("Error al guardar:", error);
      setProgresoRespuesta(0);
      setGuardandoRespuesta(false);
      alert("Error al guardar los cambios");
    }
  };
  
  // Función para agregar una nueva sección de reprogramación
  const agregarReprogramacion = () => {
    if (reprogramaciones.length < 3) {
      setReprogramaciones([...reprogramaciones, {
        id: null,
        fecha: "",
        motivo: "",
        informe: null,
        informeNombre: "",
        fhRespuesta: null,
        fhInforme: null
      }]);
    }
  };
  
  // Función para eliminar una sección de reprogramación
  const eliminarReprogramacion = (index) => {
    const nuevas = reprogramaciones.filter((_, i) => i !== index);
    setReprogramaciones(nuevas);
  };
  
  // Función para guardar una reprogramación
  const guardarReprogramacion = async (index) => {
    // Verificar si hay respuesta registrada (puede ser de la solicitud o recién guardada)
    const respuestaId = idRespuesta || solicitudSeleccionada?.ID_RESPUESTA;
    if (!respuestaId) {
      alert("Primero debe guardar la respuesta antes de agregar reprogramaciones");
      return;
    }
    
    const reprog = reprogramaciones[index];
    if (!reprog.fecha) {
      alert("Debe ingresar una fecha y hora de reprogramación");
      return;
    }
    
    try {
      setGuardandoReprogramacion(prev => ({ ...prev, [index]: true }));
      setProgresoReprogramacion(prev => ({ ...prev, [index]: 0 }));
      
      const token = localStorage.getItem("token");
      const formData = new FormData();
      
      // Simular progreso de carga
      const progressInterval = setInterval(() => {
        setProgresoReprogramacion(prev => {
          const current = prev[index] || 0;
          if (current >= 90) {
            clearInterval(progressInterval);
            return { ...prev, [index]: 90 };
          }
          return { ...prev, [index]: current + 10 };
        });
      }, 100);
      
      if (reprog.id) {
        // Editar reprogramación existente
        formData.append('ID_REPROGRAMACION', reprog.id);
        formData.append('RESPUESTA', reprog.motivo || '');
        
        if (reprog.informe) {
          formData.append('informe', reprog.informe);
        } else {
          formData.append('informe', '');
        }
        
        const response = await fetch(`${API_URL}?accion=reprogramar`, {
          method: 'PUT',
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: formData
        });
        
        clearInterval(progressInterval);
        setProgresoReprogramacion(prev => ({ ...prev, [index]: 100 }));
        
        if (response.ok) {
          setTimeout(async () => {
            alert("Reprogramación actualizada correctamente");
            await cargarSolicitudes();
            // Recargar reprogramaciones para obtener las fechas de actualización
            if (solicitudSeleccionada) {
              await cargarReprogramaciones();
            }
            // Asegurar que el checkbox esté habilitado después de guardar
            setCheckboxReprogramacionHabilitado(true);
            setProgresoReprogramacion(prev => ({ ...prev, [index]: 0 }));
            setGuardandoReprogramacion(prev => ({ ...prev, [index]: false }));
          }, 500);
        } else {
          setProgresoReprogramacion(prev => ({ ...prev, [index]: 0 }));
          setGuardandoReprogramacion(prev => ({ ...prev, [index]: false }));
          alert("Error al actualizar la reprogramación");
        }
      } else {
        // Crear nueva reprogramación
        formData.append('ID_RESPUESTA', respuestaId);
        
        // Formatear fecha: convertir de datetime-local a formato requerido
        const fechaObj = new Date(reprog.fecha);
        const fechaFormateada = fechaObj.toISOString().slice(0, 19).replace('T', ' ');
        formData.append('FECHA_REPROGRAMACION', fechaFormateada);
        formData.append('RESPUESTA', reprog.motivo || '');
        
        if (reprog.informe) {
          formData.append('informe', reprog.informe);
        } else {
          formData.append('informe', '');
        }
        
        const response = await fetch(`${API_URL}?accion=reprogramar`, {
          method: 'POST',
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: formData
        });
        
        clearInterval(progressInterval);
        setProgresoReprogramacion(prev => ({ ...prev, [index]: 100 }));
        
        if (response.ok) {
          const data = await response.json();
          // Actualizar el ID de la reprogramación guardada
          const nuevas = [...reprogramaciones];
          if (data.ID_REPROGRAMACION) {
            nuevas[index].id = data.ID_REPROGRAMACION;
          }
          setReprogramaciones(nuevas);
          
          setTimeout(async () => {
            alert("Reprogramación guardada correctamente");
            await cargarSolicitudes();
            // Recargar reprogramaciones para obtener las fechas de actualización
            if (solicitudSeleccionada) {
              await cargarReprogramaciones();
            }
            // Asegurar que el checkbox esté habilitado después de guardar
            setCheckboxReprogramacionHabilitado(true);
            setProgresoReprogramacion(prev => ({ ...prev, [index]: 0 }));
            setGuardandoReprogramacion(prev => ({ ...prev, [index]: false }));
          }, 500);
        } else {
          const errorText = await response.text();
          console.error("Error response:", errorText);
          setProgresoReprogramacion(prev => ({ ...prev, [index]: 0 }));
          setGuardandoReprogramacion(prev => ({ ...prev, [index]: false }));
          alert("Error al guardar la reprogramación");
        }
      }
    } catch (error) {
      console.error("Error al guardar reprogramación:", error);
      setProgresoReprogramacion(prev => ({ ...prev, [index]: 0 }));
      setGuardandoReprogramacion(prev => ({ ...prev, [index]: false }));
      alert("Error al guardar la reprogramación");
    }
  };
  
  // Función para actualizar un campo de reprogramación
  const actualizarReprogramacion = (index, campo, valor) => {
    const nuevas = [...reprogramaciones];
    if (campo === 'informe') {
      nuevas[index].informe = valor;
      nuevas[index].informeNombre = valor ? valor.name : "";
    } else {
      nuevas[index][campo] = valor;
    }
    setReprogramaciones(nuevas);
  };

  // Función para formatear fecha
  const formatFecha = (value) => {
    if (!value) return '-';
    try {
      if (value instanceof Date && !isNaN(value)) {
        return value.toLocaleString('es-PE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      const str = String(value);
      const noMicros = str.includes('.') ? str.split('.')[0] : str;
      const isoish = noMicros.replace(' ', 'T');
      const d = new Date(isoish);
      if (!isNaN(d)) {
        return d.toLocaleString('es-PE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      return str;
    } catch (e) {
      return String(value);
    }
  };

  // Función para exportar PDF
  const handleExportarPDF = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF("landscape");

      // Título
      doc.setFontSize(14);
      doc.text("Reporte de Solicitudes e Incidencias - FACTURACION - Zeus Safety", 14, 15);

      // Preparar datos para exportar
      const dataExport = solicitudesFiltradas.map(solicitud => [
        formatFecha(solicitud.FECHA_CONSULTA) || "-",
        solicitud.NUMERO_SOLICITUD || "-",
        solicitud.REGISTRADO_POR || "-",
        solicitud.AREA || "-",
        solicitud.RES_INCIDENCIA || "-",
        solicitud.AREA_RECEPCION || "-",
        formatFecha(solicitud.FECHA_RESPUESTA) || "-",
        solicitud.RESPONDIDO_POR || "-",
        solicitud.ESTADO || "-",
        solicitud.REPROGRAMACIONES && Array.isArray(solicitud.REPROGRAMACIONES) && solicitud.REPROGRAMACIONES.length > 0 ? "SI" : "NO"
      ]);

      // Columnas
      const headers = [
        "Fecha Consulta",
        "N° Solicitud",
        "Registrado Por",
        "Área de Envio",
        "Con Incidencia",
        "Área de Recepción",
        "Fecha Respuesta",
        "Respondido Por",
        "Estado",
        "Reprogramación"
      ];

      // Insertar tabla
      autoTable(doc, {
        head: [headers],
        body: dataExport,
        startY: 25,
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [23, 162, 184] }
      });

      // Guardar PDF
      doc.save("Reporte_Solicitudes_FACTURACION.pdf");
    } catch (error) {
      console.error("Error al exportar PDF:", error);
      alert("Error al exportar PDF. Asegúrate de tener conexión a internet.");
    }
  };

  // Función para escapar HTML
  const escapeHtml = (text) => {
    if (text === null || text === undefined) return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, function (m) { return map[m]; });
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

      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${sidebarOpen ? "lg:ml-60 ml-0" : "ml-0"}`}>
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto custom-scrollbar" style={{ background: '#F7FAFF' }}>
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

            {/* Contenedor principal con fondo blanco */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6 mb-6">
              {/* Título con icono y API Conectada */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] rounded-xl flex items-center justify-center text-white shadow-sm">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>Listado de Solicitudes/Incidencias</h1>
                    <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: 'var(--font-poppins)' }}>
                      Ver y gestionar Solicitudes/Incidencias
                    </p>
                  </div>
                </div>
                <div className={`flex items-center space-x-2 rounded-lg px-3 py-1.5 ${loadingData
                  ? 'bg-yellow-50 border border-yellow-200'
                  : errorAPI
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-green-50 border border-green-200'
                  }`}>
                  {loadingData ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                      <span className="text-sm font-semibold text-yellow-700" style={{ fontFamily: 'var(--font-poppins)' }}>Cargando...</span>
                    </>
                  ) : errorAPI ? (
                    <>
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-semibold text-red-700" style={{ fontFamily: 'var(--font-poppins)' }}>Error</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-semibold text-green-700" style={{ fontFamily: 'var(--font-poppins)' }}>API Conectada</span>
                    </>
                  )}
                </div>
              </div>

              {/* Botones de acción */}
              <div className="mb-6 flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => setModalProcedimientosOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-lg font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105 active:scale-[0.98] text-xs"
                  style={{ fontFamily: 'var(--font-poppins)' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Procedimientos
                </button>

                <button
                  onClick={handleExportarPDF}
                  className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105 active:scale-[0.98] text-xs ml-auto"
                  style={{ fontFamily: 'var(--font-poppins)' }}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 2C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V7.41421C19 7.149 18.8946 6.89464 18.7071 6.70711L13.2929 1.29289C13.1054 1.10536 12.851 1 12.5858 1H6Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
                    <path d="M13 1V6H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <text x="12" y="15" fontSize="6" fill="currentColor" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="0.3">PDF</text>
                  </svg>
                  Exportar a PDF
                </button>
              </div>

              {/* Filtros */}
              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div hidden>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Área de Recepción
                    </label>
                    <select
                      value={areaRecepcion}
                      onChange={(e) => setAreaRecepcion(e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 transition-all duration-200 hover:border-blue-300 bg-white"
                    >
                      <option value="">Todas las áreas</option>
                      <option value="LOGISTICA">LOGISTICA</option>
                      <option value="MARKETING">MARKETING</option>
                      <option value="VENTAS">VENTAS</option>
                      <option value="FACTURACION">FACTURACIÓN</option>
                      <option value="IMPORTACION">IMPORTACIÓN</option>
                      <option value="ADMINISTRACION">ADMINISTRACION</option>
                      <option value="SISTEMAS">SISTEMAS</option>
                      <option value="RECURSOS HUMANOS">RECURSOS HUMANOS</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Área de Emisión
                    </label>
                    <select
                      value={areaEmision}
                      onChange={(e) => setAreaEmision(e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 font-medium transition-all duration-200 hover:border-blue-300 bg-white cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%231E63F7%22 stroke-width=%222.5%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpath d=%22M6 9l6 6 6-6%22/%3E%3C/svg%3E')] bg-no-repeat bg-right pr-10 shadow-sm"
                      style={{
                        backgroundPosition: 'right 0.75rem center',
                        backgroundSize: '1.25rem 1.25rem',
                        paddingRight: '2.5rem'
                      }}
                    >
                      <option value="" className="py-2 px-3 text-gray-900 font-medium bg-white hover:bg-blue-50">Todas las áreas</option>
                      <option value="LOGISTICA" className="py-2 px-3 text-gray-900 font-medium bg-white hover:bg-blue-50">LOGISTICA</option>
                      <option value="MARKETING" className="py-2 px-3 text-gray-900 font-medium bg-white hover:bg-blue-50">MARKETING</option>
                      <option value="VENTAS" className="py-2 px-3 text-gray-900 font-medium bg-white hover:bg-blue-50">VENTAS</option>
                      <option value="FACTURACION" className="py-2 px-3 text-gray-900 font-medium bg-white hover:bg-blue-50">FACTURACIÓN</option>
                      <option value="IMPORTACION" className="py-2 px-3 text-gray-900 font-medium bg-white hover:bg-blue-50">IMPORTACIÓN</option>
                      <option value="ADMINISTRACION" className="py-2 px-3 text-gray-900 font-medium bg-white hover:bg-blue-50">ADMINISTRACION</option>
                      <option value="SISTEMAS" className="py-2 px-3 text-gray-900 font-medium bg-white hover:bg-blue-50">SISTEMAS</option>
                      <option value="RECURSOS HUMANOS" className="py-2 px-3 text-gray-900 font-medium bg-white hover:bg-blue-50">RECURSOS HUMANOS</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Colaborador
                    </label>
                    <input
                      type="text"
                      placeholder="Escribe un nombre..."
                      value={colaborador}
                      onChange={(e) => setColaborador(e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-200 hover:border-blue-300 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Estado
                    </label>
                    <select
                      value={estado}
                      onChange={(e) => setEstado(e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 transition-all duration-200 hover:border-blue-300 bg-white"
                    >
                      <option value="">Todos los estados</option>
                      <option value="Pendiente">Pendiente</option>
                      <option value="En Proceso">En Proceso</option>
                      <option value="En Revisión">En Revisión</option>
                      <option value="Requiere Info">Requiere Info</option>
                      <option value="Rechazada">Rechazada</option>
                      <option value="Completado">Completado</option>
                    </select>
                  </div>

                  <div className="flex items-center mt-6">
                    <label className="flex items-center space-x-3 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={mostrarIncidencias}
                          onChange={(e) => setMostrarIncidencias(e.target.checked)}
                          className="w-5 h-5 text-[#1E63F7] border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-[#1E63F7]/30 focus:ring-offset-2 focus:border-[#1E63F7] transition-all duration-200 cursor-pointer appearance-none checked:bg-[#1E63F7] checked:border-[#1E63F7] hover:border-[#1E63F7]"
                        />
                        {mostrarIncidencias && (
                          <svg
                            className="absolute top-0.5 left-0.5 w-4 h-4 text-white pointer-events-none"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-gray-800 group-hover:text-[#1E63F7] transition-colors duration-200">
                        Mostrar Incidencias
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Tabla */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                {loadingData ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
                    <span className="ml-3 text-gray-600">Cargando datos...</span>
                  </div>
                ) : solicitudesFiltradas.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 mb-2">No hay solicitudes disponibles.</p>
                    <p className="text-xs text-gray-400">Verifica los filtros o contacta al administrador.</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto justify-center text-center">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gradient-to-r from-blue-700 to-blue-800 border-b-2 border-blue-900">
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Fecha Consulta</th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>N° Solicitud</th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Registrado Por</th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Área de Envio</th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Con Incidencia</th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap text-center" style={{ fontFamily: 'var(--font-poppins)' }}>Informe</th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Área de Recepción</th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Fecha Respuesta</th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Respondido Por</th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Respuesta</th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Estado</th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Con Reprogramación / Más Respuestas</th>
                            <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {solicitudesPaginadas.map((solicitud, index) => {
                            const tieneReprogramaciones = solicitud.REPROGRAMACIONES &&
                              (Array.isArray(solicitud.REPROGRAMACIONES) ? solicitud.REPROGRAMACIONES.length > 0 :
                                (typeof solicitud.REPROGRAMACIONES === 'string' ? JSON.parse(solicitud.REPROGRAMACIONES || '[]').length > 0 : false));

                            const tieneReqExtra = solicitud.REQUERIMIENTO_2 || solicitud.REQUERIMIENTO_3 || solicitud.INFORME_2 || solicitud.INFORME_3;

                            return (
                              <tr key={solicitud.ID_SOLICITUD || solicitud.id || index} className="hover:bg-blue-50 transition-colors border-b border-gray-100">
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{formatFecha(solicitud.FECHA_CONSULTA)}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] font-medium text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>{solicitud.NUMERO_SOLICITUD || '-'}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{solicitud.REGISTRADO_POR || '-'}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{solicitud.AREA || '-'}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{solicitud.RES_INCIDENCIA || '-'}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => mostrarTextoEnModal(solicitud.REQUERIMIENTOS || 'No especificado.', 'Requerimientos')}
                                      className="inline-flex items-center justify-center px-3 py-1.5 bg-gradient-to-br from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                                      title="Ver Requerimientos"
                                      style={{ fontFamily: 'var(--font-poppins)' }}
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" style={{ pointerEvents: 'none' }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                    </button>
                                    {solicitud.INFORME_SOLICITUD ? (
                                      <a
                                        href={solicitud.INFORME_SOLICITUD}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center space-x-1 px-2.5 py-1 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} style={{ pointerEvents: 'none' }}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 2C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V7.41421C19 7.149 18.8946 6.89464 18.7071 6.70711L13.2929 1.29289C13.1054 1.10536 12.851 1 12.5858 1H6Z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 1V6H18" />
                                          <text x="12" y="15" fontSize="6" fill="currentColor" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="0.3">PDF</text>
                                        </svg>
                                        <span style={{ pointerEvents: 'none' }}>PDF</span>
                                      </a>
                                    ) : (
                                      <button className="inline-flex items-center space-x-1 px-2.5 py-1 bg-gray-400 text-white rounded-lg text-[10px] font-semibold cursor-not-allowed opacity-50">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} style={{ pointerEvents: 'none' }}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 2C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V7.41421C19 7.149 18.8946 6.89464 18.7071 6.70711L13.2929 1.29289C13.1054 1.10536 12.851 1 12.5858 1H6Z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 1V6H18" />
                                          <text x="12" y="15" fontSize="6" fill="currentColor" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="0.3">PDF</text>
                                        </svg>
                                        <span style={{ pointerEvents: 'none' }}>Sin archivo</span>
                                      </button>
                                    )}
                                    {tieneReqExtra && (
                                      <button
                                        onClick={() => verHistorialReqExtra(solicitud)}
                                        className="inline-flex items-center justify-center px-3 py-1.5 bg-gradient-to-br from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                                        title="Ver respuestas adicionales"
                                        style={{ fontFamily: 'var(--font-poppins)' }}
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" style={{ pointerEvents: 'none' }}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                                        </svg>
                                      </button>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{solicitud.AREA_RECEPCION || '-'}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{formatFecha(solicitud.FECHA_RESPUESTA)}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{solicitud.RESPONDIDO_POR || '-'}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => mostrarTextoEnModal(solicitud.RESPUESTA_R || solicitud.RESPUESTA || 'No especificado.', 'Respuesta')}
                                      className="inline-flex items-center justify-center px-3 py-1.5 bg-gradient-to-br from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                                      title="Ver Respuesta"
                                      style={{ fontFamily: 'var(--font-poppins)' }}
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" style={{ pointerEvents: 'none' }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                    </button>
                                    {solicitud.INFORME_RESPUESTA ? (
                                      <a
                                        href={solicitud.INFORME_RESPUESTA}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center space-x-1 px-2.5 py-1 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} style={{ pointerEvents: 'none' }}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 2C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V7.41421C19 7.149 18.8946 6.89464 18.7071 6.70711L13.2929 1.29289C13.1054 1.10536 12.851 1 12.5858 1H6Z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 1V6H18" />
                                          <text x="12" y="15" fontSize="6" fill="currentColor" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="0.3">PDF</text>
                                        </svg>
                                        <span style={{ pointerEvents: 'none' }}>PDF</span>
                                      </a>
                                    ) : (
                                      <button className="inline-flex items-center space-x-1 px-2.5 py-1 bg-gray-400 text-white rounded-lg text-[10px] font-semibold cursor-not-allowed opacity-50">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} style={{ pointerEvents: 'none' }}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 2C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V7.41421C19 7.149 18.8946 6.89464 18.7071 6.70711L13.2929 1.29289C13.1054 1.10536 12.851 1 12.5858 1H6Z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 1V6H18" />
                                          <text x="12" y="15" fontSize="6" fill="currentColor" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="0.3">PDF</text>
                                        </svg>
                                        <span style={{ pointerEvents: 'none' }}>Sin archivo</span>
                                      </button>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700">
                                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold text-white shadow-sm transition-all duration-200 ${solicitud.ESTADO === 'Pendiente' || solicitud.ESTADO === 'PENDIENTE'
                                    ? 'bg-gradient-to-br from-yellow-500 to-yellow-600'
                                    : solicitud.ESTADO === 'En Revisión' || solicitud.ESTADO === 'en revision' || solicitud.ESTADO === 'EN REVISIÓN' || solicitud.ESTADO === 'EN REVISION'
                                      ? 'bg-gradient-to-br from-orange-500 to-orange-600'
                                      : solicitud.ESTADO === 'En Proceso' || solicitud.ESTADO === 'EN PROCESO'
                                        ? 'bg-gradient-to-br from-blue-600 to-blue-700'
                                        : solicitud.ESTADO === 'Completado' || solicitud.ESTADO === 'COMPLETADO'
                                          ? 'bg-gradient-to-br from-green-600 to-green-700'
                                          : solicitud.ESTADO === 'Requiere Info' || solicitud.ESTADO === 'REQUIERE INFO'
                                            ? 'bg-gradient-to-br from-cyan-500 to-cyan-600'
                                            : solicitud.ESTADO === 'Rechazada' || solicitud.ESTADO === 'RECHAZADA'
                                              ? 'bg-gradient-to-br from-red-600 to-red-700'
                                              : 'bg-gradient-to-br from-gray-500 to-gray-600'
                                    }`} style={{ fontFamily: 'var(--font-poppins)' }}>
                                    {solicitud.ESTADO || 'Pendiente'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700">
                                  {tieneReprogramaciones ? (
                                    <div className="flex items-center gap-2 justify-center text-center">
                                      <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold text-white shadow-sm transition-all duration-200 bg-gradient-to-br from-green-600 to-green-700" style={{ fontFamily: 'var(--font-poppins)' }}>
                                        SI
                                      </span>
                                      <button
                                        onClick={() => verReprogramaciones(solicitud)}
                                        className="inline-flex items-center justify-center px-3 py-1.5 bg-gradient-to-br from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                                        title="Ver reprogramaciones"
                                        style={{ fontFamily: 'var(--font-poppins)' }}
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" style={{ pointerEvents: 'none' }}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                                        </svg>
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold text-white shadow-sm transition-all duration-200 bg-gradient-to-br from-red-600 to-red-700" style={{ fontFamily: 'var(--font-poppins)' }}>
                                      NO
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-center">
                                  <button
                                    onClick={() => abrirModalEditar(solicitud)}
                                    className="inline-flex items-center justify-center px-3 py-1.5 bg-gradient-to-br from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                                    style={{ fontFamily: 'var(--font-poppins)' }}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" style={{ pointerEvents: 'none' }}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Paginación */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 flex items-center justify-between border-t border-gray-200">
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1 || totalPages === 0}
                        className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                        style={{ fontFamily: 'var(--font-poppins)' }}
                      >
                        «
                      </button>
                      <button
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1 || totalPages === 0}
                        className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                        style={{ fontFamily: 'var(--font-poppins)' }}
                      >
                        &lt;
                      </button>
                      <span className="text-xs text-gray-700 font-semibold" style={{ fontFamily: 'var(--font-poppins)' }}>
                        Página {totalPages > 0 ? currentPage : 0} de {totalPages || 1}
                      </span>
                      <button
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                        style={{ fontFamily: 'var(--font-poppins)' }}
                      >
                        &gt;
                      </button>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                        style={{ fontFamily: 'var(--font-poppins)' }}
                      >
                        »
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal para ver Requerimientos/Respuestas */}
      <Modal
        isOpen={modalRequerimientosOpen || modalRespuestasOpen}
        onClose={() => {
          setModalRequerimientosOpen(false);
          setModalRespuestasOpen(false);
        }}
        title={tituloModal}
        size="md"
      >
        <div className="p-6">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-gray-900 whitespace-pre-wrap leading-relaxed text-sm font-normal">{textoModal}</p>
          </div>
        </div>
      </Modal>

      {/* Modal para ver Reprogramaciones */}
      <Modal
        isOpen={modalReprogramacionesOpen}
        onClose={() => {
          setModalReprogramacionesOpen(false);
          setSolicitudSeleccionada(null);
        }}
        title="Reprogramaciones / Más Respuestas"
        size="lg"
      >
        <div className="p-4 space-y-4">
          {solicitudSeleccionada && (() => {
            let reprogramaciones = [];

            if (solicitudSeleccionada.REPROGRAMACIONES) {
              if (Array.isArray(solicitudSeleccionada.REPROGRAMACIONES)) {
                reprogramaciones = solicitudSeleccionada.REPROGRAMACIONES;
              } else if (typeof solicitudSeleccionada.REPROGRAMACIONES === 'string') {
                try {
                  reprogramaciones = JSON.parse(solicitudSeleccionada.REPROGRAMACIONES);
                } catch (e) {
                  reprogramaciones = [];
                }
              }
            }

            // Si no hay array, intentar con campos planos
            if (reprogramaciones.length === 0) {
              const reprog1 = solicitudSeleccionada.FECHA_REPROGRAMACION || solicitudSeleccionada.RESPUESTA_REPROGRAMACION || solicitudSeleccionada.INFORME_REPROGRAMACION;
              const reprog2 = solicitudSeleccionada.FECHA_REPROGRAMACION_2 || solicitudSeleccionada.RESPUESTA_2 || solicitudSeleccionada.INFORME_2;
              const reprog3 = solicitudSeleccionada.FECHA_REPROGRAMACION_3 || solicitudSeleccionada.RESPUESTA_3 || solicitudSeleccionada.INFORME_3;

              if (reprog1) reprogramaciones.push({
                titulo: '1ra Reprogramación',
                FECHA_REPROGRAMACION: solicitudSeleccionada.FECHA_REPROGRAMACION,
                RESPUESTA: solicitudSeleccionada.RESPUESTA_REPROGRAMACION || solicitudSeleccionada.RESPUESTA_REPROG,
                INFORME: solicitudSeleccionada.INFORME_REPROGRAMACION || solicitudSeleccionada.INFORME_REPROG,
                FH_RESPUESTA: solicitudSeleccionada.FH_RESPUESTA || solicitudSeleccionada.FH_RESPUESTA_1,
                FH_INFORME: solicitudSeleccionada.FH_INFORME || solicitudSeleccionada.FH_INFORME_1
              });
              if (reprog2) reprogramaciones.push({
                titulo: '2da Reprogramación',
                FECHA_REPROGRAMACION: solicitudSeleccionada.FECHA_REPROGRAMACION_2,
                RESPUESTA: solicitudSeleccionada.RESPUESTA_2 || solicitudSeleccionada.RESPUESTA_REPROG_2,
                INFORME: solicitudSeleccionada.INFORME_2 || solicitudSeleccionada.INFORME_REPROG_2,
                FH_RESPUESTA: solicitudSeleccionada.FH_RESPUESTA_2,
                FH_INFORME: solicitudSeleccionada.FH_INFORME_2
              });
              if (reprog3) reprogramaciones.push({
                titulo: '3ra Reprogramación',
                FECHA_REPROGRAMACION: solicitudSeleccionada.FECHA_REPROGRAMACION_3,
                RESPUESTA: solicitudSeleccionada.RESPUESTA_3 || solicitudSeleccionada.RESPUESTA_REPROG_3,
                INFORME: solicitudSeleccionada.INFORME_3 || solicitudSeleccionada.INFORME_REPROG_3,
                FH_RESPUESTA: solicitudSeleccionada.FH_RESPUESTA_3,
                FH_INFORME: solicitudSeleccionada.FH_INFORME_3
              });
            }

            if (reprogramaciones.length === 0) {
              return (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-3">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-medium">No hay reprogramaciones registradas.</p>
                </div>
              );
            }

            return reprogramaciones.map((reprog, idx) => (
              <div key={idx} className="border-2 border-blue-200 rounded-xl p-5 bg-gradient-to-br from-white to-blue-50/30 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-blue-200">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{idx + 1}</span>
                  </div>
                  <h6 className="font-bold text-blue-800 text-base">
                    {reprog.titulo || `Reprogramación ${idx + 1}`}
                  </h6>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 mt-0.5 flex-shrink-0">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Fecha</p>
                      <p className="text-sm font-medium text-gray-900">{formatFecha(reprog.FECHA_REPROGRAMACION || reprog.fecha)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 mt-0.5 flex-shrink-0">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Motivo</p>
                      <p className="text-sm text-gray-900 leading-relaxed bg-white rounded-lg p-3 border border-gray-200">
                        {reprog.RESPUESTA || reprog.RESPUESTA_REPROG || reprog.respuesta || 'No registrada'}
                      </p>
                      {reprog.FH_RESPUESTA && (
                        <p className="text-xs text-gray-500 mt-1 italic">
                          Actualizado el: {formatFecha(reprog.FH_RESPUESTA)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 mt-0.5 flex-shrink-0">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Informe</p>
                      {reprog.INFORME || reprog.INFORME_REPROG || reprog.informe ? (
                        <>
                          <a
                            href={reprog.INFORME || reprog.INFORME_REPROG || reprog.informe}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm hover:shadow-md"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Ver archivo
                          </a>
                          {reprog.FH_INFORME && (
                            <p className="text-xs text-gray-500 mt-1 italic">
                              Actualizado el: {formatFecha(reprog.FH_INFORME)}
                            </p>
                          )}
                        </>
                      ) : (
                        <span className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          No disponible
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ));
          })()}
        </div>
      </Modal>

      {/* Modal para ver Historial de Requerimientos Extra */}
      <Modal
        isOpen={modalHistorialReqExtraOpen}
        onClose={() => {
          setModalHistorialReqExtraOpen(false);
          setSolicitudSeleccionada(null);
        }}
        title="Detalle de Respuestas adicionales"
        size="lg"
      >
        <div className="p-4 space-y-4">
          {solicitudSeleccionada && (
            <>
              {(solicitudSeleccionada.REQUERIMIENTO_2 || solicitudSeleccionada.INFORME_2) && (
                <div className="mb-6 border-2 border-blue-200 rounded-xl p-5 bg-gradient-to-br from-white to-blue-50/30 shadow-sm">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-blue-200">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">2</span>
                    </div>
                    <h6 className="font-bold text-blue-800 text-base">Respuesta 2</h6>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Contenido</p>
                      <textarea
                        className="w-full p-3 border-2 border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-blue-500"
                        rows="4"
                        readOnly
                        value={solicitudSeleccionada.REQUERIMIENTO_2 || 'No registrado'}
                      />
                    </div>
                    {solicitudSeleccionada.FECHA_REQUERIMIENTO_2 && (
                      <div className="flex items-center gap-2 text-xs">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-gray-700 font-medium">Registrado: {formatFecha(solicitudSeleccionada.FECHA_REQUERIMIENTO_2)}</span>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Archivo</p>
                      {solicitudSeleccionada.INFORME_2 ? (
                        <a
                          href={solicitudSeleccionada.INFORME_2}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm hover:shadow-md"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Ver archivo
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          No registrado
                        </span>
                      )}
                    </div>
                    {solicitudSeleccionada.FECHA_INFORME_2 && (
                      <div className="flex items-center gap-2 text-xs">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-gray-700 font-medium">Última actualización: {formatFecha(solicitudSeleccionada.FECHA_INFORME_2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(solicitudSeleccionada.REQUERIMIENTO_3 || solicitudSeleccionada.INFORME_3) && (
                <div className="mb-6 border-2 border-blue-200 rounded-xl p-5 bg-gradient-to-br from-white to-blue-50/30 shadow-sm">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-blue-200">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">3</span>
                    </div>
                    <h6 className="font-bold text-blue-800 text-base">Respuesta 3</h6>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Contenido</p>
                      <textarea
                        className="w-full p-3 border-2 border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-blue-500"
                        rows="4"
                        readOnly
                        value={solicitudSeleccionada.REQUERIMIENTO_3 || 'No registrado'}
                      />
                    </div>
                    {solicitudSeleccionada.FECHA_REQUERIMIENTO_3 && (
                      <div className="flex items-center gap-2 text-xs">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-gray-700 font-medium">Registrado: {formatFecha(solicitudSeleccionada.FECHA_REQUERIMIENTO_3)}</span>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Archivo</p>
                      {solicitudSeleccionada.INFORME_3 ? (
                        <a
                          href={solicitudSeleccionada.INFORME_3}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm hover:shadow-md"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Ver archivo
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          No registrado
                        </span>
                      )}
                    </div>
                    {solicitudSeleccionada.FECHA_INFORME_3 && (
                      <div className="flex items-center gap-2 text-xs">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-gray-700 font-medium">Última actualización: {formatFecha(solicitudSeleccionada.FECHA_INFORME_3)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!solicitudSeleccionada.REQUERIMIENTO_2 && !solicitudSeleccionada.REQUERIMIENTO_3 &&
                !solicitudSeleccionada.INFORME_2 && !solicitudSeleccionada.INFORME_3 && (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-3">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-600 font-medium">No hay respuestas adicionales registradas.</p>
                  </div>
                )}
            </>
          )}
        </div>
      </Modal>

      {/* Modal de Procedimientos */}
      <Modal
        isOpen={modalProcedimientosOpen}
        onClose={() => setModalProcedimientosOpen(false)}
        title="📖 Procedimiento de Uso"
        size="lg"
      >
        <div className="p-6 space-y-6">
          <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-600">
            <p className="text-gray-900 font-medium leading-relaxed">Este sistema permite gestionar y dar seguimiento a las solicitudes de manera rápida y organizada. A continuación, se detalla su funcionamiento:</p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>
              <h6 className="font-bold text-gray-900 text-base">🔎 Filtros</h6>
            </div>
            <ul className="text-sm text-gray-800 space-y-2 ml-10 list-disc">
              <li>Filtra las solicitudes por <strong className="text-gray-900">Área</strong>, <strong className="text-gray-900">Colaborador</strong>, <strong className="text-gray-900">Estado</strong> y <strong className="text-gray-900">Incidencia</strong>.</li>
              <li>El filtro de <strong className="text-gray-900">Colaborador</strong> funciona en tiempo real mientras escribes.</li>
              <li>Se permite hacer <strong className="text-gray-900">Filtros Combinados</strong> funciona en tiempo real.</li>
            </ul>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h6 className="font-bold text-gray-900 text-base">✍️ Responder Solicitudes</h6>
            </div>
            <ul className="text-sm text-gray-800 space-y-2 ml-10 list-disc">
              <li>En la columna <strong className="text-gray-900">Acciones</strong> podrás abrir el formulario de respuesta.</li>
              <li>Completa los campos de <em className="text-gray-900">Respondido por</em>, <em className="text-gray-900">Respuesta</em> e <em className="text-gray-900">Informe (opcional)</em>.</li>
              <li>Puedes adjuntar un archivo PDF y luego visualizarlo con el botón <strong className="text-gray-900">Ver archivo</strong>.</li>
            </ul>
            <div className="mt-3 bg-red-50 border-l-4 border-red-600 p-3 rounded">
              <p className="text-sm text-red-800 font-semibold">🚨 IMPORTANTE: SOLO TIENEN MÁXIMO 48 HORAS PARA RESPONDER O ATENDER UNA SOLICITUD/INCIDENCIA</p>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h6 className="font-bold text-gray-900 text-base">🔄 Reprogramaciones</h6>
            </div>
            <ul className="text-sm text-gray-800 space-y-2 ml-10 list-disc">
              <li>Si es necesario reprogramar, activa el <strong className="text-gray-900">checkbox de Reprogramación</strong>.</li>
              <li>Se permite máximo <strong className="text-gray-900">1 reprogramación</strong>.</li>
              <li>Si se trata de un caso complicado, se permite un máximo de <strong className="text-gray-900">3 reprogramaciones</strong>.</li>
              <li>Para agregar una nueva reprogramación, usa el <strong className="text-gray-900">botón verde ➕</strong> en la primera o segunda reprogramación.</li>
              <li>En los campos de reprogramación se puede escribir el <em className="text-gray-900">motivo</em> y opcionalmente un <em className="text-gray-900">link a documentos</em>.</li>
            </ul>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h6 className="font-bold text-gray-900 text-base">📑 Visualización</h6>
            </div>
            <ul className="text-sm text-gray-800 space-y-2 ml-10 list-disc">
              <li>Si una solicitud tiene reprogramaciones, en la columna <strong className="text-gray-900">Con reprogramación / Más Respuestas</strong> se mostrará <strong className="text-gray-900">SI</strong>.</li>
              <li>Al lado aparecerá un botón para abrir el detalle de todas las reprogramaciones registradas.</li>
            </ul>
          </div>
        </div>
      </Modal>

      {/* Modal de Editar Respuesta */}
      <Modal
        isOpen={modalEditarOpen}
        onClose={() => {
          setModalEditarOpen(false);
          setSolicitudSeleccionada(null);
          setFormArchivoInforme(null);
          setFormArchivoNombre("");
          setReprogramaciones([]);
          setReprogramacionesCargadas([]);
          setIdRespuesta(null);
          setProgresoRespuesta(0);
          setGuardandoRespuesta(false);
          setProgresoReprogramacion({});
          setGuardandoReprogramacion({});
          setCheckboxReprogramacionHabilitado(false);
        }}
        title="Actualizar Respuesta"
        size="lg"
      >
        <div className="p-6 space-y-6">
          {/* Datos de la respuesta */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-bold text-gray-900">Datos de la respuesta</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Fecha y Hora Respuesta
                </label>
                <input
                  type="datetime-local"
                  value={formFechaRespuesta}
                  readOnly
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg outline-none text-sm text-gray-900 bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Respondido Por
                </label>
                <select
                  value={formRespondidoPor}
                  onChange={(e) => {
                    setFormRespondidoPor(e.target.value);
                    if (e.target.value !== "OTROS") {
                      setFormNombrePersona(e.target.value);
                    }
                  }}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-gray-900 bg-white"
                >
                  <option value="">Seleccionar...</option>
                  <option value="ELIAS">ELIAS</option>
                  <option value="EDGAR">EDGAR</option>
                  <option value="DHILSEN">DHILSEN</option>
                  <option value="OTROS">OTROS</option>
                </select>
              </div>
            </div>

            {formRespondidoPor === "OTROS" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre de la persona
                </label>
                <input
                  type="text"
                  value={formNombrePersona}
                  onChange={(e) => setFormNombrePersona(e.target.value)}
                  placeholder="Escribe el nombre..."
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-gray-900 bg-white"
                />
              </div>
            )}
          </div>

          {/* Respuesta */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Respuesta
            </label>
            <textarea
              value={formRespuesta}
              onChange={(e) => setFormRespuesta(e.target.value)}
              rows={4}
              placeholder="Escribe la respuesta..."
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-gray-900 bg-white resize-y"
            />
          </div>

          {/* Informe */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Informe (Archivos PDF, rar, zip)
            </label>
            <div className="flex items-center gap-3">
              <label className="flex-shrink-0">
                <input
                  type="file"
                  accept=".pdf,.rar,.zip"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setFormArchivoInforme(file);
                      setFormArchivoNombre(file.name);
                    }
                  }}
                  className="hidden"
                />
                <span className="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold cursor-pointer transition-colors shadow-sm hover:shadow-md">
                  Seleccionar archivo
                </span>
              </label>
              <span className="text-sm text-gray-600 flex-1">
                {formArchivoNombre || "Ningún archivo seleccionado"}
              </span>
            </div>
          </div>

          {/* Estado */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Estado
            </label>
            <select
              value={formEstado}
              onChange={(e) => setFormEstado(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-gray-900 bg-white"
            >
              <option value="Pendiente">Pendiente</option>
              <option value="En Revisión">En Revisión</option>
              <option value="En Proceso">En Proceso</option>
              <option value="Completado">Completado</option>
              <option value="Requiere Info">Requiere Info</option>
              <option value="Rechazada">Rechazada</option>
            </select>
          </div>

          {/* Reprogramación */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="reprogramacion"
              checked={formReprogramacion === true}
              disabled={!checkboxReprogramacionHabilitado}
              onChange={(e) => {
                // Solo permitir cambios si el checkbox está habilitado
                if (!checkboxReprogramacionHabilitado) return;
                
                const checked = Boolean(e.target.checked);
                setFormReprogramacion(checked);
                if (!checked) {
                  setReprogramaciones([]);
                } else if (reprogramaciones.length === 0) {
                  // Si se activa y no hay reprogramaciones, agregar la primera
                  setReprogramaciones([{
                    id: null,
                    fecha: "",
                    motivo: "",
                    informe: null,
                    informeNombre: "",
                    fhRespuesta: null,
                    fhInforme: null
                  }]);
                }
              }}
              className={`w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 ${
                !checkboxReprogramacionHabilitado ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
            />
            <label 
              htmlFor="reprogramacion" 
              className={`text-sm font-semibold ${
                checkboxReprogramacionHabilitado 
                  ? 'text-gray-700 cursor-pointer' 
                  : 'text-gray-400 cursor-not-allowed'
              }`}
            >
              Reprogramación / Más Respuestas
              {!checkboxReprogramacionHabilitado && (
                <span className="text-xs text-gray-500 ml-2">(Primero debe registrar una respuesta)</span>
              )}
            </label>
          </div>
          
          {/* Barra de progreso para respuesta */}
          {guardandoRespuesta && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700 font-medium">Guardando respuesta...</span>
                <span className="text-blue-600 font-semibold">{progresoRespuesta}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progresoRespuesta}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Secciones de Reprogramación */}
          {formReprogramacion && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              {reprogramaciones.map((reprog, index) => (
                <div key={index} className="border-2 border-blue-200 rounded-xl p-5 bg-gradient-to-br from-white to-blue-50/30 shadow-sm">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-blue-200">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">{index + 1}</span>
                      </div>
                      <h6 className="font-bold text-blue-800 text-base">
                        {index === 0 ? 'Primera Reprogramación' : index === 1 ? 'Segunda Reprogramación' : 'Tercera Reprogramación'}
                      </h6>
                    </div>
                    <div className="flex items-center gap-2">
                      {index > 0 && (
                        <button
                          onClick={() => eliminarReprogramacion(index)}
                          className="inline-flex items-center justify-center w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors shadow-sm hover:shadow-md"
                          title="Eliminar sección"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </button>
                      )}
                      {index < 2 && reprogramaciones.length < 3 && (
                        <button
                          onClick={agregarReprogramacion}
                          className="inline-flex items-center justify-center w-8 h-8 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors shadow-sm hover:shadow-md"
                          title="Agregar otra reprogramación"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Fecha y Hora de Reprogramación */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Fecha y Hora de Reprogramación
                      </label>
                      <input
                        type="datetime-local"
                        value={reprog.fecha}
                        onChange={(e) => actualizarReprogramacion(index, 'fecha', e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-gray-900 bg-white"
                      />
                    </div>

                    {/* Motivo de Reprogramación */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Motivo de Reprogramación
                      </label>
                      <textarea
                        value={reprog.motivo}
                        onChange={(e) => actualizarReprogramacion(index, 'motivo', e.target.value)}
                        rows={3}
                        placeholder="Escribe el motivo de la reprogramación..."
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-gray-900 bg-white resize-y"
                      />
                      {reprog.fhRespuesta && (
                        <p className="text-xs text-gray-500 mt-1">
                          Última actualización del motivo: {formatFecha(reprog.fhRespuesta)}
                        </p>
                      )}
                    </div>

                    {/* Informe Reprogramación */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Informe Reprogramación
                      </label>
                      <div className="flex items-center gap-3">
                        <label className="flex-shrink-0">
                          <input
                            type="file"
                            accept=".pdf,.rar,.zip"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                actualizarReprogramacion(index, 'informe', file);
                              }
                            }}
                            className="hidden"
                          />
                          <span className="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold cursor-pointer transition-colors shadow-sm hover:shadow-md">
                            Seleccionar archivo
                          </span>
                        </label>
                        <span className="text-sm text-gray-600 flex-1">
                          {reprog.informeNombre || "Ningún archivo seleccionado"}
                        </span>
                      </div>
                      {reprog.fhInforme && (
                        <p className="text-xs text-gray-500 mt-1">
                          Última actualización del informe: {formatFecha(reprog.fhInforme)}
                        </p>
                      )}
                    </div>

                    {/* Barra de progreso para reprogramación */}
                    {guardandoReprogramacion[index] && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-700 font-medium">Guardando reprogramación...</span>
                          <span className="text-green-600 font-semibold">{progresoReprogramacion[index] || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-green-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${progresoReprogramacion[index] || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    {/* Botón Guardar Reprogramación */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => guardarReprogramacion(index)}
                        disabled={guardandoReprogramacion[index]}
                        className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {guardandoReprogramacion[index] ? 'Guardando...' : 'Guardar Reprogramación'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Botones */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setModalEditarOpen(false);
                setSolicitudSeleccionada(null);
                setFormArchivoInforme(null);
                setFormArchivoNombre("");
                setReprogramaciones([]);
                setReprogramacionesCargadas([]);
                setIdRespuesta(null);
                setProgresoRespuesta(0);
                setGuardandoRespuesta(false);
                setProgresoReprogramacion({});
                setGuardandoReprogramacion({});
                setCheckboxReprogramacionHabilitado(false);
              }}
              className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardarEdicion}
              disabled={guardandoRespuesta}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {guardandoRespuesta ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );



  
}
