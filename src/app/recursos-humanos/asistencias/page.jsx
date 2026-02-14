"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/context/AuthContext";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function AsistenciasPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [excelData, setExcelData] = useState([]);
  const [registrosCarga, setRegistrosCarga] = useState([]);
  const [dashboardData, setDashboardData] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({ periodo: "", registradoPor: "", area: "" });
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null); // Nombre del mes en español (ej: "Febrero")
  const [selectedNombre, setSelectedNombre] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: "", type: "success" });
  const [historialCargas, setHistorialCargas] = useState([]);
  const [tablaLimpiada, setTablaLimpiada] = useState(false);

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
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (user) {
      loadDashboardData();
      loadHistorialCargas();
    }
  }, [user]);

  // Cargar automáticamente el último historial al entrar (solo una vez)
  useEffect(() => {
    if (historialCargas.length > 0 && excelData.length === 0 && !loadingData && !tablaLimpiada) {
      const ultimoRegistro = historialCargas[0]; // El primero es el más reciente (ya está ordenado)
      const cargarUltimoRegistro = async () => {
        try {
          const token = localStorage.getItem("token");
          if (!token) return;

          const response = await fetch("/api/asistencias?endpoint=dashboard", {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${token}`,
            },
          });

          if (!response.ok) return;

          const data = await response.json();
          const datosDelRegistro = data.filter((item) => item.id_registro === ultimoRegistro.id_registro);
          
          if (datosDelRegistro.length === 0) return;

          const excelDataFormatted = datosDelRegistro.map((item) => ({
            id: item.id_empleado || "-",
            nombre: item.nombre || "-",
            fecha: item.fecha,
            entrada: item.hora_entrada || null,
            salida: item.hora_salida || null,
          }));

          setExcelData(excelDataFormatted);
        } catch (error) {
          console.error("Error al cargar último registro:", error);
        }
      };
      
      cargarUltimoRegistro();
    }
  }, [historialCargas, excelData.length, loadingData, tablaLimpiada]);

  // Cuando cambian los filtros, en el futuro se podrían resetear estados adicionales
  useEffect(() => {
    // Sin paginación: no es necesario actualizar nada por ahora
  }, [selectedYear, selectedMonth, selectedNombre]);

  const loadDashboardData = async () => {
    try {
      setLoadingData(true);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No se encontró el token");
      }

      const response = await fetch("/api/asistencias?endpoint=dashboard", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }
        throw new Error("Error al cargar datos");
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error("Error:", error);
      showNotification("Error al cargar datos del dashboard", "error");
    } finally {
      setLoadingData(false);
    }
  };

  const loadHistorialCargas = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return;
      }

      // Obtener historial de cargas desde el nuevo endpoint dedicado
      const response = await fetch("/api/asistencias?endpoint=historial-cargas", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Si la API devuelve un historial válido
        if (Array.isArray(data) && data.length > 0) {
          const historialFromAPI = data.sort((a, b) => b.id_registro - a.id_registro);
          
          // Actualizar estado y localStorage con el historial
          setHistorialCargas(historialFromAPI);
          localStorage.setItem("historialCargasAsistencias", JSON.stringify(historialFromAPI));
        } else {
          // Si está vacío, limpiar
          setHistorialCargas([]);
          localStorage.removeItem("historialCargasAsistencias");
        }
      } else {
        // Si hay error en la API, intentar recuperar del localStorage
        const historialLocal = JSON.parse(localStorage.getItem("historialCargasAsistencias") || "[]");
        if (historialLocal.length > 0) {
          console.warn("No se pudo conectar a la API, usando historial local");
          setHistorialCargas(historialLocal);
        } else {
          setHistorialCargas([]);
        }
      }
    } catch (error) {
      console.error("Error al cargar historial:", error);
      // En caso de error, intentar recuperar del localStorage
      const historialLocal = JSON.parse(localStorage.getItem("historialCargasAsistencias") || "[]");
      if (historialLocal.length > 0) {
        console.warn("Error al conectar, usando historial local");
        setHistorialCargas(historialLocal);
      } else {
        setHistorialCargas([]);
      }
    }
  };

  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "success" });
    }, 5000);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Si se sube un nuevo archivo, resetear el flag de tabla limpiada
    setTablaLimpiada(false);

    try {
      const data = await file.arrayBuffer();
      // NO usar cellDates: true para evitar problemas de zona horaria
      // En su lugar, leeremos las fechas como números seriales y las parsearemos manualmente
      const workbook = XLSX.read(data, { type: "array", cellDates: false });

      const sheetName = "Reporte de Excepciones";
      if (!workbook.SheetNames.includes(sheetName)) {
        showNotification("No se encontró la hoja 'Reporte de Excepciones'", "error");
        return;
      }

      const worksheet = workbook.Sheets[sheetName];
      // Leer con raw: true para obtener valores numéricos (números seriales de fechas) y poder parsearlos correctamente
      const jsonDataRaw = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null, raw: true });
      
      // También leer los valores formateados para obtener strings de texto
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null, raw: false });

      const asistencias = [];
      const fechasProcesadas = []; // Para rastrear fechas procesadas y ayudar a inferir fechas faltantes
    
      // Función auxiliar para normalizar fechas de Excel (como en tu ejemplo: normalizarFecha)
      const parseDate = (dateValue) => {
        if (!dateValue && dateValue !== 0) return null;
        
        // Si es un objeto Date: usar componentes LOCALES (Excel no tiene zona horaria, es fecha calendario)
        if (dateValue instanceof Date) {
          const year = dateValue.getFullYear();
          const month = String(dateValue.getMonth() + 1).padStart(2, '0');
          const day = String(dateValue.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
        
        if (typeof dateValue === "string") {
          const trimmed = dateValue.trim();
          if (!trimmed || trimmed === "" || trimmed.toLowerCase() === "null" || trimmed.toLowerCase() === "undefined") {
            return null;
          }
          
          // Si ya está en formato YYYY-MM-DD, devolver tal cual
          const dateMatch = trimmed.match(/(\d{4})-(\d{2})-(\d{2})/);
            if (dateMatch) {
            return trimmed;
          }
          
          const parsed = new Date(trimmed + "T00:00:00");
              if (!isNaN(parsed.getTime())) {
            const year = parsed.getFullYear();
            const month = String(parsed.getMonth() + 1).padStart(2, '0');
            const day = String(parsed.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          }
        }
        
        // Si es un número (código serial de fecha de Excel): sin zona horaria
        if (typeof dateValue === "number") {
          const excelDate = XLSX.SSF.parse_date_code(dateValue);
          if (excelDate && excelDate.y && excelDate.m && excelDate.d) {
            return `${excelDate.y}-${String(excelDate.m).padStart(2, "0")}-${String(excelDate.d).padStart(2, "0")}`;
          }
        }
        
        return null;
      };
      
      // Función para inferir fecha basándose en fechas anteriores/posteriores del mismo empleado
      const inferirFecha = (index, fechaActual, entrada, salida, idEmpleado, nombreEmpleado) => {
        // Si hay fecha actual válida, usarla
        if (fechaActual) return fechaActual;
        
        // Buscar fecha anterior válida del mismo empleado primero
        for (let i = index - 1; i >= 4; i--) {
          const prevRow = jsonData[i];
          if (!prevRow || prevRow.length === 0) continue;
          
          const prevId = prevRow[0]?.toString().trim() || "";
          const prevNombre = prevRow[1]?.toString().trim() || "";
          
          // Si es el mismo empleado, usar su fecha para inferir
          if ((idEmpleado && prevId === idEmpleado) || (nombreEmpleado && prevNombre === nombreEmpleado)) {
            const prevFecha = parseDate(prevRow[3]);
            if (prevFecha) {
              const prevDate = new Date(prevFecha + "T00:00:00");
              let nextDate = new Date(prevDate);
              nextDate.setDate(nextDate.getDate() + 1);
              while (nextDate.getDay() === 0) nextDate.setDate(nextDate.getDate() + 1);
              return `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}-${String(nextDate.getDate()).padStart(2, "0")}`;
            }
          }
        }
        
        for (let i = index - 1; i >= 4; i--) {
          const prevRow = jsonData[i];
          if (!prevRow || prevRow.length === 0) continue;
          const prevFecha = parseDate(prevRow[3]);
          if (prevFecha) {
            const prevDate = new Date(prevFecha + "T00:00:00");
            let nextDate = new Date(prevDate);
            nextDate.setDate(nextDate.getDate() + 1);
            while (nextDate.getDay() === 0) nextDate.setDate(nextDate.getDate() + 1);
            return `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}-${String(nextDate.getDate()).padStart(2, "0")}`;
          }
        }
        
        for (let i = index + 1; i < jsonData.length; i++) {
          const nextRow = jsonData[i];
          if (!nextRow || nextRow.length === 0) continue;
          const nextId = nextRow[0]?.toString().trim() || "";
          const nextNombre = nextRow[1]?.toString().trim() || "";
          if ((idEmpleado && nextId === idEmpleado) || (nombreEmpleado && nextNombre === nombreEmpleado)) {
            const nextFecha = parseDate(nextRow[3]);
            if (nextFecha) {
              const nextDate = new Date(nextFecha + "T00:00:00");
              let prevDate = new Date(nextDate);
              prevDate.setDate(prevDate.getDate() - 1);
              while (prevDate.getDay() === 0) prevDate.setDate(prevDate.getDate() - 1);
              return `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}-${String(prevDate.getDate()).padStart(2, "0")}`;
            }
          }
        }
        
        for (let i = index + 1; i < jsonData.length; i++) {
          const nextRow = jsonData[i];
          if (!nextRow || nextRow.length === 0) continue;
          const nextFecha = parseDate(nextRow[3]);
          if (nextFecha) {
            const nextDate = new Date(nextFecha + "T00:00:00");
            let prevDate = new Date(nextDate);
            prevDate.setDate(prevDate.getDate() - 1);
            while (prevDate.getDay() === 0) prevDate.setDate(prevDate.getDate() - 1);
            return `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}-${String(prevDate.getDate()).padStart(2, "0")}`;
          }
        }
        
        return null;
      };
      
      // Función auxiliar para formatear horarios del Excel (similar a formatearHora del ejemplo)
      const formatearHora = (valor) => {
        if (!valor && valor !== 0) return null;

        // Si es un objeto Date (lo que puede pasar con cellDates: true)
        if (valor instanceof Date) {
          const h = valor.getHours().toString().padStart(2, '0');
          const m = valor.getMinutes().toString().padStart(2, '0');
          return `${h}:${m}:00`;
        }

        // Si es una cadena larga (ej: "Sat Dec 30 1899...")
        if (typeof valor === 'string' && valor.includes('GMT')) {
          const fecha = new Date(valor);
          if (!isNaN(fecha.getTime())) {
            const h = fecha.getHours().toString().padStart(2, '0');
            const m = fecha.getMinutes().toString().padStart(2, '0');
            return `${h}:${m}:00`;
          }
        }

        // Si es un número (puede ser código de fecha Excel o fracción del día)
        if (typeof valor === "number") {
          // Intentar parsear como código de fecha Excel
          const time = XLSX.SSF.parse_date_code(valor);
          if (time && (time.H !== undefined || time.M !== undefined)) {
            return `${String(time.H || 0).padStart(2, "0")}:${String(time.M || 0).padStart(2, "0")}:${String(time.S || 0).padStart(2, "0")}`;
          }
          
          // Si es una fracción del día (0.0 a 0.999...), convertir a horas:minutos:segundos
          if (valor >= 0 && valor < 1) {
            const totalSeconds = Math.floor(valor * 24 * 60 * 60);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
          }
        }
        
        // Si es un string, intentar parsearlo
        if (typeof valor === "string") {
          const trimmed = valor.trim();
          if (!trimmed || trimmed === "" || trimmed.toLowerCase() === "null" || trimmed.toLowerCase() === "undefined") {
            return null;
          }
          
          // Si ya es un string corto tipo "08:44" o "08:44:00", devolverlo
          const timeMatch = trimmed.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
          if (timeMatch) {
            const hours = parseInt(timeMatch[1]);
            const minutes = parseInt(timeMatch[2]);
            const seconds = parseInt(timeMatch[3] || 0);
            return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
          }
          
          return trimmed;
        }
        
        return null;
      };

      // Empezamos en fila 5 (índice 4) como en el HTML de prueba
      // Usar la longitud de jsonDataRaw como referencia principal
      const maxLength = Math.max(jsonData.length || 0, jsonDataRaw.length || 0);
      for (let i = 4; i < maxLength; i++) {
        const row = jsonData[i] || [];
        const rowRaw = jsonDataRaw[i] || [];
        if ((!row || row.length === 0) && (!rowRaw || rowRaw.length === 0)) continue;

        const id = (row[0] || rowRaw[0])?.toString().trim() || "";
        const nombre = (row[1] || rowRaw[1])?.toString().trim() || "";
        // Usar el valor raw para la fecha para poder parsearlo correctamente como número serial de Excel
        // Si no hay valor raw, usar el formateado
        const fecha = rowRaw[3] !== undefined && rowRaw[3] !== null ? rowRaw[3] : (row[3] || null);
        const entrada = rowRaw[4] !== undefined && rowRaw[4] !== null ? rowRaw[4] : (row[4] || null);
        const salida = rowRaw[5] !== undefined && rowRaw[5] !== null ? rowRaw[5] : (row[5] || null);

        // Solo continuar si no hay ID ni nombre (fila completamente vacía)
        if (!id && !nombre) continue;

        // Procesar la fecha de la fila actual - SIEMPRE usar la fecha de la fila
        let fechaFormateada = parseDate(fecha);
        
        // Formatear entrada y salida
        let entradaFormateada = formatearHora(entrada);
        let salidaFormateada = formatearHora(salida);

        // IMPORTANTE: Si hay fecha en el Excel, SIEMPRE crear el registro, incluso si entrada y salida están vacías
        // Esto permite mostrar días feriados o días sin registro como "No Registrado"
        if (fechaFormateada) {
          const registro = {
            id: id || "-",
            nombre: nombre || "-",
            fecha: fechaFormateada,
            entrada: entradaFormateada,
            salida: salidaFormateada,
          };
          
          asistencias.push(registro);
          
          // Guardar para referencia futura
          fechasProcesadas.push({
            id: id || "-",
            nombre: nombre || "-",
            fecha: fechaFormateada,
          });
        } else if (entradaFormateada || salidaFormateada) {
          // Si NO hay fecha pero SÍ hay entrada o salida, intentar inferirla
          // Esto solo debería pasar si el Excel tiene datos inconsistentes
          fechaFormateada = inferirFecha(i, null, entradaFormateada, salidaFormateada, id, nombre);
          
          if (fechaFormateada) {
            const registro = {
              id: id || "-",
              nombre: nombre || "-",
              fecha: fechaFormateada,
              entrada: entradaFormateada,
              salida: salidaFormateada,
            };
            
            asistencias.push(registro);
            
            fechasProcesadas.push({
              id: id || "-",
              nombre: nombre || "-",
              fecha: fechaFormateada,
            });
          }
        }
      }

      if (asistencias.length === 0) {
        showNotification("No se encontraron datos válidos en el archivo", "error");
        return;
      }

      // Ordenar los datos primero por nombre/ID de empleado, luego por fecha
      // Esto mantiene los registros del mismo empleado juntos y ordenados cronológicamente
      asistencias.sort((a, b) => {
        // Primero por ID de empleado (si existe)
        if (a.id && b.id && a.id !== "-" && b.id !== "-") {
          const idCompare = a.id.localeCompare(b.id);
          if (idCompare !== 0) return idCompare;
        }
        
        // Luego por nombre
        if (a.nombre && b.nombre && a.nombre !== "-" && b.nombre !== "-") {
          const nombreCompare = a.nombre.localeCompare(b.nombre);
          if (nombreCompare !== 0) return nombreCompare;
        }
        
        // Finalmente por fecha (cronológicamente). YYYY-MM-DD ordena bien como string
        if (a.fecha && b.fecha) {
          return String(a.fecha).localeCompare(String(b.fecha));
        } else if (a.fecha && !b.fecha) return -1;
        else if (!a.fecha && b.fecha) return 1;
        
        return 0;
      });

      setExcelData(asistencias);
      showNotification("Datos cargados correctamente", "success");
    } catch (error) {
      console.error("Error:", error);
      showNotification("Error al leer el archivo Excel", "error");
    }
  };

  const generatePDF = (asistencias) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Reporte de Asistencias", 14, 15);

    const tableData = asistencias.map((a) => [
      a.id || "-",
      a.nombre || "-",
      a.fecha || "-",
      a.entrada || "-",
      a.salida || "-",
    ]);

    autoTable(doc, {
      head: [["ID", "Nombre", "Fecha", "Entrada", "Salida"]],
      body: tableData,
      startY: 25,
      theme: "grid",
      headStyles: { fillColor: [26, 42, 64] },
    });

    return doc;
  };

  const handleGuardar = async () => {
    if (!modalData.periodo || !modalData.registradoPor || !modalData.area) {
      showNotification("Por favor complete todos los campos", "error");
      return;
    }

    if (excelData.length === 0) {
      showNotification("No hay datos para guardar", "error");
      return;
    }

    try {
      const pdfDoc = generatePDF(excelData);
      const pdfBlob = pdfDoc.output("blob");
      const pdfFile = new File([pdfBlob], `reporte-asistencias-${Date.now()}.pdf`, { type: "application/pdf" });

      const formData = new FormData();
      formData.append("file", pdfFile);
      formData.append("registrado_por", modalData.registradoPor);
      formData.append("area", modalData.area);
      formData.append("periodo", modalData.periodo);
      formData.append("asistencias", JSON.stringify(excelData));

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No se encontró el token");
      }

      const response = await fetch("/api/asistencias?endpoint=guardar-reporte", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al guardar");
      }

      const result = await response.json();
      console.log("Respuesta completa del backend:", JSON.stringify(result, null, 2)); // Debug con JSON.stringify para ver el contenido real
      
      // Verificar que el id_registro venga del backend (buscar en múltiples campos posibles)
      // Buscar en todas las variantes posibles
      const idRegistro = result.id_registro || 
                         result.id || 
                         result.ID_REGISTRO || 
                         result.ID || 
                         result.registro_id ||
                         result.registroId ||
                         (result.data && result.data.id_registro) ||
                         (result.data && result.data.id) ||
                         null;
      
      console.log("ID registro encontrado:", idRegistro); // Debug
      console.log("Todas las claves del objeto result:", Object.keys(result)); // Debug: ver todas las claves disponibles
      
      if (!idRegistro) {
        console.error("Error: El backend no devolvió id_registro. Respuesta completa:", JSON.stringify(result, null, 2));
        // Intentar usar un ID temporal basado en timestamp si no hay id_registro
        console.warn("Usando ID temporal basado en timestamp");
        const idTemporal = Date.now();
        
        // Guardar los datos del excelData asociados a este id_registro temporal
        const datosRegistro = {
          id_registro: idTemporal,
          datos: excelData,
          fecha_guardado: new Date().toISOString(),
        };
        const datosRegistros = JSON.parse(localStorage.getItem("datosRegistrosAsistencias") || "[]");
        datosRegistros.push(datosRegistro);
        localStorage.setItem("datosRegistrosAsistencias", JSON.stringify(datosRegistros));
        
        // Agregar al historial local con ID temporal
        const nuevoRegistro = {
          id_registro: idTemporal,
          registrado_por: modalData.registradoPor,
          area: modalData.area,
          periodo: modalData.periodo,
          pdf_reporte: result.url || null,
        };
        
        const historialActual = [nuevoRegistro, ...historialCargas].sort((a, b) => b.id_registro - a.id_registro);
        setHistorialCargas(historialActual);
        localStorage.setItem("historialCargasAsistencias", JSON.stringify(historialActual));
        
        showNotification("Datos guardados correctamente (ID temporal)", "success");
        setExcelData([]);
        setModalData({ periodo: "", registradoPor: "", area: "" });
        setShowModal(false);
        loadDashboardData();
        return;
      }
      
      // Guardar los datos del excelData asociados a este id_registro para poder recuperarlos después
      const datosRegistro = {
        id_registro: idRegistro,
        datos: excelData,
        fecha_guardado: new Date().toISOString(),
      };
      const datosRegistros = JSON.parse(localStorage.getItem("datosRegistrosAsistencias") || "[]");
      datosRegistros.push(datosRegistro);
      localStorage.setItem("datosRegistrosAsistencias", JSON.stringify(datosRegistros));
      
      // Agregar al historial local
      const nuevoRegistro = {
        id_registro: idRegistro,
        registrado_por: modalData.registradoPor,
        area: modalData.area,
        periodo: modalData.periodo,
        pdf_reporte: result.url || null,
      };
      
      console.log("Nuevo registro guardado:", nuevoRegistro); // Debug
      
      const historialActual = [nuevoRegistro, ...historialCargas].sort((a, b) => b.id_registro - a.id_registro);
      setHistorialCargas(historialActual);
      localStorage.setItem("historialCargasAsistencias", JSON.stringify(historialActual));
      
      console.log("Nuevo registro guardado:", nuevoRegistro); // Debug
      console.log("Historial actualizado:", historialActual); // Debug
      
      showNotification("Datos guardados correctamente", "success");
      setExcelData([]);
      setModalData({ periodo: "", registradoPor: "", area: "" });
      setShowModal(false);
      loadDashboardData();
      // NO llamar loadHistorialCargas aquí porque ya actualizamos el historial arriba
      // loadHistorialCargas(); // Esto sobrescribiría los datos que acabamos de guardar
    } catch (error) {
      console.error("Error:", error);
      showNotification(error.message || "Error al guardar los datos", "error");
    }
  };

  const getDayName = (fecha) => {
  if (!fecha) return null;
    try {
      // Usar "T00:00:00" para interpretar la fecha como medianoche LOCAL y evitar que
      // "2026-01-01" se interprete como UTC (que en Perú sería 31 dic 2025)
      const date = new Date(String(fecha).trim() + "T00:00:00");
      if (isNaN(date.getTime())) return null;
    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    return days[date.getDay()];
    } catch (error) {
      return null;
    }
  };

  const getDayNumber = (fecha) => {
  if (!fecha) return null;
    try {
      // Usar "T00:00:00" para interpretar la fecha como medianoche LOCAL
      const date = new Date(String(fecha).trim() + "T00:00:00");
      if (isNaN(date.getTime())) return null;
    return date.getDate();
    } catch (error) {
      return null;
    }
  };

  const formatTime = (timeString) => {
    if (!timeString || timeString === "--" || timeString === null) return "--";
    const parts = timeString.split(":");
    if (parts.length < 2) return timeString;
    const hours = parseInt(parts[0]);
    const minutes = parts[1] || "00";
    const seconds = parts[2] || "00";
    const ampm = hours >= 12 ? "pm" : "am";
    const displayHours = hours % 12 || 12;
    return `${String(displayHours).padStart(2, "0")}:${minutes}:${seconds} ${ampm}`;
  };

  const getEstadoEntrada = (entrada, salida, fecha) => {
    const HORA_ENTRADA_LIMITE = "09:00:00";
    
    // ❌ No Registrado SOLO cuando el campo Entrada está vacío (o cuando ambos están vacíos)
    if (!entrada || entrada === "--" || entrada === null) {
      return { texto: "No Registrado", color: "text-gray-600", bg: "bg-gray-100", icon: "❌" };
    }    
    // Si hay entrada, calcular el estado basándose en la hora de entrada
    try {
      // Extraer horas y minutos de la entrada
      const partesEntrada = String(entrada).split(":");
      const hEntrada = parseInt(partesEntrada[0] || 0);
      const mEntrada = parseInt(partesEntrada[1] || 0);
      
      // Extraer horas y minutos del límite
      const partesLimite = HORA_ENTRADA_LIMITE.split(":");
      const hLimite = parseInt(partesLimite[0] || 9);
      const mLimite = parseInt(partesLimite[1] || 0);
      
      const entradaTime = hEntrada * 60 + mEntrada;
      const limiteTime = hLimite * 60 + mLimite;
      
      // Si la entrada es después del límite, es "Tarde"
      if (entradaTime > limiteTime) {
      return { texto: "Tarde", color: "text-red-700", bg: "bg-red-100", icon: "✗" };
      } else {
        // Si la entrada es antes o igual al límite, es "Temprano"
        return { texto: "Temprano", color: "text-green-700", bg: "bg-green-100", icon: "✓" };
      }
    } catch (error) {
      console.error("Error calculando estado de entrada:", error);
      return { texto: "No Registrado", color: "text-gray-600", bg: "bg-gray-100", icon: "❌" };
    }
  };

  const calcularMinutosTardanza = (entrada) => {
    if (!entrada || entrada === "--" || entrada === null) return 0;
    
    try {
      const HORA_ENTRADA_LIMITE = "09:00:00";
      // Extraer solo HH:mm de cadenas como "08:44:00" o "8:44"
      const partesEntrada = String(entrada).split(":");
      const partesLimite = HORA_ENTRADA_LIMITE.split(":");
      
      const h1 = parseInt(partesEntrada[0] || 0);
      const m1 = parseInt(partesEntrada[1] || 0);
      
      const h2 = parseInt(partesLimite[0] || 9);
      const m2 = parseInt(partesLimite[1] || 0);
      
      const total1 = h1 * 60 + m1;
      const total2 = h2 * 60 + m2;
      
      return total1 > total2 ? total1 - total2 : 0;
    } catch (e) {
      console.error("Error calculando minutos de tardanza:", e);
      return 0;
    }
  };

  const calcularTiempoExtra = (entrada, salida) => {
  if (!entrada || entrada === "--" || entrada === null) return 0;
    if (!salida || salida === "--" || salida === null) return 0;
    
    const estado = getEstadoEntrada(entrada, salida);
    if (estado.texto === "Tarde" || estado.texto === "No Registrado") return 0;

    try {
      const HORA_ENTRADA_LIMITE = "09:00:00";
      const HORA_SALIDA_LIMITE = "18:00:00";
      
      // Calcular tiempo extra de entrada (minutos antes de las 9:00)
      const partesEntrada = String(entrada).split(":");
      const partesLimiteEntrada = HORA_ENTRADA_LIMITE.split(":");
      
      const hEntrada = parseInt(partesEntrada[0] || 0);
      const mEntrada = parseInt(partesEntrada[1] || 0);
      const hLimiteEntrada = parseInt(partesLimiteEntrada[0] || 9);
      const mLimiteEntrada = parseInt(partesLimiteEntrada[1] || 0);
      
      const entradaTime = hEntrada * 60 + mEntrada;
      const limiteEntradaTime = hLimiteEntrada * 60 + mLimiteEntrada;
      
      // Calcular tiempo extra de salida (minutos después de las 18:00)
      const partesSalida = String(salida).split(":");
      const partesLimiteSalida = HORA_SALIDA_LIMITE.split(":");
      
      const hSalida = parseInt(partesSalida[0] || 0);
      const mSalida = parseInt(partesSalida[1] || 0);
      const hLimiteSalida = parseInt(partesLimiteSalida[0] || 18);
      const mLimiteSalida = parseInt(partesLimiteSalida[1] || 0);
      
      const salidaTime = hSalida * 60 + mSalida;
      const limiteSalidaTime = hLimiteSalida * 60 + mLimiteSalida;
      
      // Tiempo extra de entrada (minutos antes de las 9:00)
      const extraEntrada = entradaTime < limiteEntradaTime ? limiteEntradaTime - entradaTime : 0;
      
      // Tiempo extra de salida (minutos después de las 18:00)
      const extraSalida = salidaTime > limiteSalidaTime ? salidaTime - limiteSalidaTime : 0;
      
      return extraEntrada + extraSalida;
    } catch (e) {
      console.error("Error calculando tiempo extra:", e);
    return 0;
    }
  };

  const handleClearTable = () => {
    setExcelData([]);
    setDashboardData([]);
    setSelectedYear(null);
    setSelectedMonth(null);
    setSelectedNombre(null);
    setTablaLimpiada(true); // Marcar que la tabla fue limpiada manualmente
    showNotification("Tabla limpiada", "success");
  };

  // ================== FILTRO DE HISTORIAL POR MES (USANDO PERIODO, CASE-INSENSITIVE) ==================
  const historialFiltradoPorMes = useMemo(() => {
    if (!selectedMonth) return historialCargas;

    const mesBuscado = String(selectedMonth).toLowerCase(); // ej: "febrero"

    return historialCargas.filter((registro) => {
      const periodo = (registro.periodo || registro.PERIODO || "").toString().toLowerCase();
      // Coincide si el nombre del mes aparece en cualquier parte del periodo, sin importar mayúsculas/minúsculas
      return periodo.includes(mesBuscado);
    });
  }, [historialCargas, selectedMonth]);

  const handleCargarHistorial = async (idRegistro) => {
    try {
      setLoadingData(true);
      const token = localStorage.getItem("token");
      if (!token) {
        showNotification("No se encontró el token", "error");
        return;
      }

      const response = await fetch("/api/asistencias?endpoint=dashboard", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar datos");
      }

      const data = await response.json();
      let datosDelRegistro = data.filter((item) => item.id_registro === idRegistro);
      
      // Si no se encuentran datos en el dashboard, intentar recuperarlos del localStorage
      if (datosDelRegistro.length === 0) {
        console.log("No se encontraron datos en dashboard, buscando en localStorage...");
        const datosRegistros = JSON.parse(localStorage.getItem("datosRegistrosAsistencias") || "[]");
        const registroGuardado = datosRegistros.find((r) => r.id_registro === idRegistro);
        
        if (registroGuardado && registroGuardado.datos) {
          console.log("Datos encontrados en localStorage:", registroGuardado);
          // Convertir los datos guardados al formato esperado
          const excelDataFormatted = registroGuardado.datos.map((item) => ({
            id: item.id || "-",
            nombre: item.nombre || "-",
            fecha: item.fecha,
            entrada: item.entrada || null,
            salida: item.salida || null,
          }));
          
          // Limpiar filtros al cargar un historial
          setSelectedYear(null);
          setSelectedMonth(null);
          setSelectedNombre(null);
          setTablaLimpiada(false);
          
          setExcelData(excelDataFormatted);
          showNotification("Datos del historial cargados desde almacenamiento local", "success");
          setLoadingData(false);
          return;
        } else {
          showNotification("No se encontraron datos para este registro", "error");
          setLoadingData(false);
          return;
        }
      }

      // Convertir datos del dashboard al formato de excelData
      const excelDataFormatted = datosDelRegistro.map((item) => ({
        id: item.id_empleado || "-",
        nombre: item.nombre || "-",
        fecha: item.fecha,
        entrada: item.hora_entrada || null,
        salida: item.hora_salida || null,
      }));

      // Limpiar filtros al cargar un historial
      setSelectedYear(null);
      setSelectedMonth(null);
      setSelectedNombre(null);
      setTablaLimpiada(false); // Resetear flag al cargar un historial

      setExcelData(excelDataFormatted);
      showNotification("Datos del historial cargados correctamente", "success");
    } catch (error) {
      console.error("Error:", error);
      showNotification("Error al cargar datos del historial", "error");
    } finally {
      setLoadingData(false);
    }
  };

  const handleDescargarPDF = async (idRegistro, pdfUrl) => {
    try {
      // Si ya existe el PDF, descargarlo directamente
      if (pdfUrl) {
        window.open(pdfUrl, "_blank");
        return;
      }

      // Si no existe, generar el PDF desde los datos del registro
      const token = localStorage.getItem("token");
      if (!token) {
        showNotification("No se encontró el token", "error");
        return;
      }

      const response = await fetch("/api/asistencias?endpoint=dashboard", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar datos");
      }

      const data = await response.json();
      const datosDelRegistro = data.filter((item) => item.id_registro === idRegistro);
      
      if (datosDelRegistro.length === 0) {
        showNotification("No se encontraron datos para este registro", "error");
        return;
      }

      // Convertir datos al formato de excelData para generar el PDF
      const excelDataFormatted = datosDelRegistro.map((item) => ({
        id: item.id_empleado || "-",
        nombre: item.nombre || "-",
        fecha: item.fecha,
        entrada: item.hora_entrada || null,
        salida: item.hora_salida || null,
      }));

      // Generar y descargar el PDF
      const pdfDoc = generatePDF(excelDataFormatted);
      pdfDoc.save(`Reporte_Asistencia_${idRegistro}.pdf`);
      showNotification("PDF generado y descargado correctamente", "success");
    } catch (error) {
      console.error("Error:", error);
      showNotification("Error al generar el PDF", "error");
    }
  };

  // Solo usar excelData, no combinar con dashboardData para evitar duplicados
  const allData = useMemo(() => {
    if (excelData.length === 0) {
      return [];
    }
    
  const excelDataFormatted = excelData.map((item) => {
      // Extraer año y mes de la fecha de forma segura
      let anio = null;
      let mes = null;
      if (item.fecha) {
        // Si la fecha está en formato YYYY-MM-DD, extraer directamente
        const fechaMatch = String(item.fecha).match(/(\d{4})-(\d{2})-(\d{2})/);
        if (fechaMatch) {
          anio = parseInt(fechaMatch[1]);
          mes = parseInt(fechaMatch[2]);
        } else {
          // Si no está en formato esperado, parsear como medianoche local (T00:00:00)
          const fechaDate = new Date(String(item.fecha).trim() + "T00:00:00");
          if (!isNaN(fechaDate.getTime())) {
            anio = fechaDate.getFullYear();
            mes = fechaDate.getMonth() + 1;
          }
        }
      }
      
      return {
      id_asistencia: null,
      id_empleado: item.id,
      id_registro: null,
      fecha: item.fecha,
      hora_entrada: item.entrada,
      hora_salida: item.salida,
      nombre: item.nombre,
        anio: anio,
        mes: mes,
      };
    });

    return excelDataFormatted;
  }, [excelData]);

  const filteredData = useMemo(() => {
    let filtered = [...allData];

    // Filtrar por año basándose en la fecha
    if (selectedYear) {
      filtered = filtered.filter((d) => {
        if (!d.fecha) return false;
        const year = d.anio ?? (() => {
          const m = String(d.fecha).match(/(\d{4})/);
          return m ? parseInt(m[1]) : null;
        })();
        return year === selectedYear;
      });
    }

    // Filtrar por mes basándose en la fecha
    if (selectedMonth) {
      filtered = filtered.filter((d) => {
        if (!d.fecha) return false;
        const month = d.mes ?? (() => {
          const m = String(d.fecha).match(/-(\d{2})-/);
          return m ? parseInt(m[1]) : null;
        })();
        return month === selectedMonth;
      });
    }

    if (selectedNombre) {
      filtered = filtered.filter((d) => d.nombre === selectedNombre);
    }

    // NO filtrar domingos aquí, se filtrarán en la tabla
    // Los domingos se mostrarán como "No Registrado" si no hay entrada

    return filtered;
  }, [allData, selectedYear, selectedMonth, selectedNombre]);

  const uniqueYears = useMemo(() => {
    const years = new Set();
    allData.forEach((d) => {
      let year = d.anio;
      if (year == null && d.fecha) {
        const m = String(d.fecha).match(/(\d{4})-/);
        year = m ? parseInt(m[1], 10) : null;
      }
      if (year != null) years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [allData]);

  const uniqueMonths = useMemo(() => {
    const months = new Set();
    allData.forEach((d) => {
      let month = d.mes;
      if (month == null && d.fecha) {
        const m = String(d.fecha).match(/-(\d{2})-/);
        month = m ? parseInt(m[1], 10) : null;
      }
      if (month != null) months.add(month);
    });
    return Array.from(months).sort((a, b) => a - b);
  }, [allData]);

  const uniqueNombres = useMemo(() => {
    const nombres = new Set();
    allData.forEach((d) => {
      if (d.nombre) nombres.add(d.nombre);
    });
    return Array.from(nombres).sort();
  }, [allData]);

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  const selectedPersonData = useMemo(() => {
    if (!selectedNombre) return filteredData;
    return filteredData.filter((d) => d.nombre === selectedNombre);
  }, [filteredData, selectedNombre]);

  const asistenciasPuntuales = useMemo(() => {
    return selectedPersonData.filter((d) => {
      if (!d.hora_entrada) return false;
      const estado = getEstadoEntrada(d.hora_entrada, d.hora_salida, d.fecha);
      return estado.texto === "Temprano";
    }).length;
  }, [selectedPersonData]);

  const tardanzas = useMemo(() => {
    return selectedPersonData.filter((d) => {
      if (!d.hora_entrada) return false;
      const estado = getEstadoEntrada(d.hora_entrada, d.hora_salida, d.fecha);
      return estado.texto === "Tarde";
    }).length;
  }, [selectedPersonData]);

  const inasistencias = useMemo(() => {
    return selectedPersonData.filter((d) => !d.hora_entrada).length;
  }, [selectedPersonData]);

  const minutosTardanzaTotal = useMemo(() => {
    return selectedPersonData.reduce((total, d) => {
      return total + calcularMinutosTardanza(d.hora_entrada);
    }, 0);
  }, [selectedPersonData]);

  const minutosDebidos = useMemo(() => {
    return selectedPersonData.reduce((total, d) => {
      if (!d.hora_entrada || d.hora_entrada === "--" || d.hora_entrada === null) return total;
      const estado = getEstadoEntrada(d.hora_entrada, d.hora_salida, d.fecha);
      if (estado.texto === "Temprano") {
        try {
          const HORA_ENTRADA_LIMITE = "09:00:00";
          const partesEntrada = String(d.hora_entrada).split(":");
          const partesLimite = HORA_ENTRADA_LIMITE.split(":");
          
          const hEntrada = parseInt(partesEntrada[0] || 0);
          const mEntrada = parseInt(partesEntrada[1] || 0);
          const hLimite = parseInt(partesLimite[0] || 9);
          const mLimite = parseInt(partesLimite[1] || 0);
          
          const entradaTime = hEntrada * 60 + mEntrada;
          const limiteTime = hLimite * 60 + mLimite;
          
          const minutosAntes = limiteTime - entradaTime;
          return total + (minutosAntes > 0 ? minutosAntes : 0);
        } catch (e) {
          console.error("Error calculando minutos debidos:", e);
          return total;
        }
      }
      return total;
    }, 0);
  }, [selectedPersonData]);

  const tiempoExtraTotal = useMemo(() => {
    return selectedPersonData.reduce((total, d) => {
      return total + calcularTiempoExtra(d.hora_entrada, d.hora_salida);
    }, 0);
  }, [selectedPersonData]);

  const minutosDebidosExtras = minutosDebidos - minutosTardanzaTotal + tiempoExtraTotal;

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

        <main className="flex-1 overflow-y-auto custom-scrollbar" style={{ background: "#F7FAFF" }}>
          <div className="max-w-[95%] mx-auto px-4 py-4">
            <button
              onClick={() => router.push("/recursos-humanos")}
              className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-lg font-medium hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm"
              style={{ fontFamily: "var(--font-poppins)" }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver a Recursos Humanos</span>
            </button>

            {/* Contenedor principal blanco */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm" style={{ boxShadow: '0px 4px 12px rgba(0,0,0,0.06)' }}>
              {/* Header con icono y subtítulo */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-xl flex items-center justify-center text-white shadow-sm">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-2xl font-medium text-gray-900 tracking-tight" style={{ fontFamily: "var(--font-poppins)" }}>
                        Control de Asistencias
                      </h1>
                      <p className="text-sm text-gray-600 font-medium mt-0.5" style={{ fontFamily: "var(--font-poppins)" }}>
                        Gestión y reporte de asistencias del personal
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="cursor-pointer inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md" title="Subir Excel">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <input type="file" accept=".xls,.xlsx" onChange={handleFileUpload} className="hidden" />
                    </label>
                    {excelData.length > 0 && (
                      <button
                        onClick={() => setShowModal(true)}
                        className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                        title="Guardar"
                        style={{ fontFamily: "var(--font-poppins)" }}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={handleClearTable}
                      className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                      title="Limpiar Tabla"
                      style={{ fontFamily: "var(--font-poppins)" }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>
                </div>

                {excelData.length > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800" style={{ fontFamily: "var(--font-poppins)" }}>
                      <strong>{excelData.length}</strong> registros cargados
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-3 space-y-4">
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 shadow-sm">
                  <h2 className="text-xs font-semibold text-gray-900 mb-3" style={{ fontFamily: "var(--font-poppins)" }}>
                    Filtros
                  </h2>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-900 mb-1" style={{ fontFamily: "var(--font-poppins)" }}>Año</label>
                      <select
                        value={selectedYear || ""}
                        onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs text-gray-900 bg-white"
                        style={{ fontFamily: "var(--font-poppins)" }}
                      >
                        <option value="">Todos</option>
                        {uniqueYears.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-900 mb-1" style={{ fontFamily: "var(--font-poppins)" }}>Mes</label>
                      <select
                        value={selectedMonth || ""}
                        onChange={(e) => setSelectedMonth(e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs text-gray-900 bg-white"
                        style={{ fontFamily: "var(--font-poppins)" }}
                      >
                        <option value="">Todos</option>
                        {uniqueMonths.map((month) => (
                          <option key={month} value={month}>
                            {monthNames[month - 1]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-900 mb-1" style={{ fontFamily: "var(--font-poppins)" }}>Nombre</label>
                      <select
                        value={selectedNombre || ""}
                        onChange={(e) => setSelectedNombre(e.target.value || null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs text-gray-900 bg-white"
                        style={{ fontFamily: "var(--font-poppins)" }}
                      >
                        <option value="">Todos</option>
                        {uniqueNombres.map((nombre) => (
                          <option key={nombre} value={nombre}>
                            {nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 shadow-sm">
                  <h3 className="text-xs font-semibold text-gray-900 mb-3" style={{ fontFamily: "var(--font-poppins)" }}>
                    Resumen
                  </h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-green-800">Asistencias Puntuales</span>
                        <span className="text-base font-bold text-green-900">{asistenciasPuntuales}</span>
                      </div>
                    </div>
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-red-800">Tardanzas</span>
                        <span className="text-base font-bold text-red-900">{tardanzas}</span>
                      </div>
                    </div>
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-yellow-800">Inasistencias</span>
                        <span className="text-base font-bold text-yellow-900">{inasistencias}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 shadow-sm">
                  <h3 className="text-xs font-semibold text-gray-900 mb-3" style={{ fontFamily: "var(--font-poppins)" }}>
                    Métricas
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-900">Minutos de Tardanza Total:</span>
                      <span className="font-semibold text-red-700">{minutosTardanzaTotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-900">Minutos Debidos:</span>
                      <span className="font-semibold text-green-700">{minutosDebidos}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-900">Total de Tiempo Extra:</span>
                      <span className="font-semibold text-blue-700">{tiempoExtraTotal}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-gray-900 font-medium">Minutos Debidos o Extras:</span>
                      <span className={`font-bold ${minutosDebidosExtras >= 0 ? "text-green-700" : "text-red-700"}`}>
                        {minutosDebidosExtras >= 0 ? "+" : ""}
                        {minutosDebidosExtras}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              <div className="lg:col-span-9">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                  <div className="overflow-x-auto justify-center text-center max-h-[600px] overflow-y-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gradient-to-r from-blue-700 to-blue-800 border-b-2 border-blue-900">
                          <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: "var(--font-poppins)" }}>
                            Día
                          </th>
                          <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: "var(--font-poppins)" }}>
                            Día de Semana
                          </th>
                          <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: "var(--font-poppins)" }}>
                            Nombre
                          </th>
                          <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: "var(--font-poppins)" }}>
                            Entrada
                          </th>
                          <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: "var(--font-poppins)" }}>
                            Estado de Entrada
                          </th>
                          <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: "var(--font-poppins)" }}>
                            Salida
                          </th>
                          <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: "var(--font-poppins)" }}>
                            Minutos de Tardanza
                          </th>
                          <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: "var(--font-poppins)" }}>
                            Tiempo Extra
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(() => {
                          // Filtrar solo días laborables (lunes a sábado) basándose en la fecha
                          // Si la entrada está vacía, es inasistencia (feriado o no registró)
                          let dataFiltrada = filteredData.filter((d) => {
                            if (!d.fecha) return false;
                            const dayName = getDayName(d.fecha);
                            // Omitir domingos
                            return dayName !== "Domingo";
                          });

                          // Ordenar por fecha ascendente (del 1 al 31)
                          dataFiltrada = dataFiltrada.sort((a, b) => {
                            if (!a.fecha || !b.fecha) return 0;
                            return new Date(a.fecha) - new Date(b.fecha);
                          });

                          if (dataFiltrada.length === 0) {
                            return (
                              <tr>
                                <td colSpan="8" className="px-4 py-8 text-center text-gray-500" style={{ fontFamily: "var(--font-poppins)" }}>
                                  No hay datos disponibles
                                </td>
                              </tr>
                            );
                          }

                        return dataFiltrada.map((d, index) => {
                            // Calcular estado de entrada
                            const estado = getEstadoEntrada(d.hora_entrada, d.hora_salida, d.fecha);
                            const minutosTardanza =
                              d.hora_entrada && d.hora_entrada !== "--" && d.hora_entrada !== null
                                ? calcularMinutosTardanza(d.hora_entrada)
                                : 0;
                            const tiempoExtra =
                              d.hora_entrada &&
                              d.hora_entrada !== "--" &&
                              d.hora_entrada !== null &&
                              d.hora_salida &&
                              d.hora_salida !== "--" &&
                              d.hora_salida !== null
                                ? calcularTiempoExtra(d.hora_entrada, d.hora_salida)
                                : 0;

                            // Usar la fecha directamente del registro (ya procesada correctamente al leer el Excel)
                            const fechaParaMostrar = d.fecha;
                            const dayName = fechaParaMostrar ? getDayName(fechaParaMostrar) : "-";
                            const dayNumber = fechaParaMostrar ? getDayNumber(fechaParaMostrar) : "-";

                            return (
                              <tr key={index} className="hover:bg-blue-50 transition-colors border-b border-gray-100">
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
                                  {dayNumber || "-"}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-900 capitalize" style={{ fontFamily: "var(--font-poppins)" }}>
                                  {dayName || "-"}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] font-medium text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
                                  {d.nombre || "-"}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
                                  {d.hora_entrada ? formatTime(d.hora_entrada) : "--"}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold ${estado.bg} ${estado.color}`} style={{ fontFamily: "var(--font-poppins)" }}>
                                    {estado.icon} {estado.texto}
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
                                  {d.hora_salida ? formatTime(d.hora_salida) : "--"}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
                                  {minutosTardanza > 0 ? minutosTardanza : "-"}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
                                  {tiempoExtra > 0 ? tiempoExtra : "-"}
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>

                </div>
              </div>
            </div>

              {/* Historial de Cargas - Debajo de la tabla y métricas, ancho completo - Siempre visible */}
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 shadow-sm mt-4">
                <h3 className="text-base font-semibold text-gray-900 mb-4" style={{ fontFamily: "var(--font-poppins)" }}>
                  Historial de Cargas
                </h3>
                {historialFiltradoPorMes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {historialFiltradoPorMes.map((registro, index) => {
                      // Buscar en el orden correcto: primero registrado_por (como se guarda), luego variantes
                      const registradoPor = registro.registrado_por || registro.REGISTRADO_POR || registro.registradoPor || null;
                      const area = registro.area || registro.AREA || null;
                    const periodo = registro.periodo || registro.PERIODO || null;
                      
                      return (
                        <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleCargarHistorial(registro.id_registro)}>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate" style={{ fontFamily: "var(--font-poppins)" }}>
                              {periodo || `#${String(registro.id_registro).slice(-6)}`}
                            </p>
                            <p className="text-xs text-gray-600 truncate mt-1" style={{ fontFamily: "var(--font-poppins)" }}>
                              {registradoPor || "Sin especificar"}
                            </p>
                            <p className="text-xs text-gray-500 truncate" style={{ fontFamily: "var(--font-poppins)" }}>
                              {area || "Sin especificar"}
                            </p>
                          </div>
                          <div className="flex items-center space-x-1 ml-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCargarHistorial(registro.id_registro);
                              }}
                              className="p-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
                              title="Cargar en tabla"
                            >
                              <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDescargarPDF(registro.id_registro, registro.pdf_reporte);
                              }}
                              className="p-2 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
                              title="Descargar PDF"
                            >
                              <svg className="w-5 h-5 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm" style={{ fontFamily: "var(--font-poppins)" }}>
                    No hay historial de cargas disponible
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
                Registrar Carga
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-all duration-200 text-gray-500 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1" style={{ fontFamily: "var(--font-poppins)" }}>Periodo</label>
                <input
                  type="text"
                  value={modalData.periodo}
                  onChange={(e) => setModalData({ ...modalData, periodo: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 mb-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                  style={{ fontFamily: "var(--font-poppins)" }}
                  placeholder="Ej: Febrero 2026"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1" style={{ fontFamily: "var(--font-poppins)" }}>Registrado Por</label>
                <input
                  type="text"
                  value={modalData.registradoPor}
                  onChange={(e) => setModalData({ ...modalData, registradoPor: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                  style={{ fontFamily: "var(--font-poppins)" }}
                  placeholder="Nombre de la persona"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1" style={{ fontFamily: "var(--font-poppins)" }}>Área</label>
                <select
                  value={modalData.area}
                  onChange={(e) => setModalData({ ...modalData, area: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  style={{ fontFamily: "var(--font-poppins)" }}
                >
                  <option value="">Seleccione un área</option>
                  <option value="GERENCIA">GERENCIA</option>
                  <option value="SISTEMAS">SISTEMAS</option>
                  <option value="ADMINISTRACION">ADMINISTRACION</option>
                  <option value="RECURSOS HUMANOS">RECURSOS HUMANOS</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-200"
                style={{ fontFamily: "var(--font-poppins)" }}
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                className="px-4 py-2 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                style={{ fontFamily: "var(--font-poppins)" }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {notification.show && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${notification.type === "success" ? "bg-green-500" : "bg-red-500"} text-white`}>
          {notification.message}
        </div>
      )}
    </div>
  );
}
