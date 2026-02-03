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
  const [modalData, setModalData] = useState({ registradoPor: "", area: "" });
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedNombre, setSelectedNombre] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: "", type: "success" });
  const [historialCargas, setHistorialCargas] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

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

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
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

      // Intentar obtener historial desde localStorage primero
      const historialLocal = localStorage.getItem("historialCargasAsistencias");
      if (historialLocal) {
        try {
          const parsed = JSON.parse(historialLocal);
          setHistorialCargas(parsed);
        } catch (e) {
          console.error("Error al parsear historial local:", e);
        }
      }

      // También intentar obtener desde el dashboard
      const response = await fetch("/api/asistencias?endpoint=dashboard", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Agrupar por id_registro para obtener el historial
        const registros = {};
        data.forEach((item) => {
          if (item.id_registro && !registros[item.id_registro]) {
            registros[item.id_registro] = {
              id_registro: item.id_registro,
              registrado_por: item.registrado_por || "N/A",
              area: item.area || "N/A",
              pdf_reporte: item.pdf_reporte || null,
            };
          }
        });
        const historialFromAPI = Object.values(registros).sort((a, b) => b.id_registro - a.id_registro);
        if (historialFromAPI.length > 0) {
          setHistorialCargas(historialFromAPI);
          localStorage.setItem("historialCargasAsistencias", JSON.stringify(historialFromAPI));
        }
      }
    } catch (error) {
      console.error("Error al cargar historial:", error);
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

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });

      const sheetName = "Reporte de Excepciones";
      if (!workbook.SheetNames.includes(sheetName)) {
        showNotification("No se encontró la hoja 'Reporte de Excepciones'", "error");
        return;
      }

      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

      const asistencias = [];
      // Empezamos en fila 5 (índice 4) como en el HTML de prueba
      for (let i = 4; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length === 0) continue;

        const id = row[0]?.toString().trim() || "";
        const nombre = row[1]?.toString().trim() || "";
        const fecha = row[3];
        const entrada = row[4];
        const salida = row[5];

        // Solo continuar si no hay ID ni nombre (fila completamente vacía)
        if (!id && !nombre) continue;

        let fechaFormateada = null;
        if (fecha) {
          if (fecha instanceof Date) {
            fechaFormateada = fecha.toISOString().split("T")[0];
          } else if (typeof fecha === "string") {
            const dateMatch = fecha.match(/(\d{4})-(\d{2})-(\d{2})/);
            if (dateMatch) {
              fechaFormateada = fecha;
            } else {
              const parsed = new Date(fecha);
              if (!isNaN(parsed.getTime())) {
                fechaFormateada = parsed.toISOString().split("T")[0];
              }
            }
          } else if (typeof fecha === "number") {
            const excelDate = XLSX.SSF.parse_date_code(fecha);
            if (excelDate) {
              fechaFormateada = `${excelDate.y}-${String(excelDate.m).padStart(2, "0")}-${String(excelDate.d).padStart(2, "0")}`;
            }
          }
        }

        let entradaFormateada = null;
        if (entrada) {
          if (entrada instanceof Date) {
            const hours = entrada.getHours();
            const minutes = entrada.getMinutes();
            const seconds = entrada.getSeconds();
            entradaFormateada = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
          } else if (typeof entrada === "number") {
            const time = XLSX.SSF.parse_date_code(entrada);
            if (time) {
              entradaFormateada = `${String(time.H).padStart(2, "0")}:${String(time.M).padStart(2, "0")}:${String(time.S || 0).padStart(2, "0")}`;
            }
          } else if (typeof entrada === "string") {
            entradaFormateada = entrada.trim();
          }
        }

        let salidaFormateada = null;
        if (salida) {
          if (salida instanceof Date) {
            const hours = salida.getHours();
            const minutes = salida.getMinutes();
            const seconds = salida.getSeconds();
            salidaFormateada = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
          } else if (typeof salida === "number") {
            const time = XLSX.SSF.parse_date_code(salida);
            if (time) {
              salidaFormateada = `${String(time.H).padStart(2, "0")}:${String(time.M).padStart(2, "0")}:${String(time.S || 0).padStart(2, "0")}`;
            }
          } else if (typeof salida === "string") {
            salidaFormateada = salida.trim();
          }
        }

        // Procesar si hay fecha, incluso si falta ID o nombre
        if (fechaFormateada) {
          asistencias.push({
            id: id || "-",
            nombre: nombre || "-",
            fecha: fechaFormateada,
            entrada: entradaFormateada,
            salida: salidaFormateada,
          });
        }
      }

      if (asistencias.length === 0) {
        showNotification("No se encontraron datos válidos en el archivo", "error");
        return;
      }

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
    if (!modalData.registradoPor || !modalData.area) {
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
      
      // Agregar al historial local
      const nuevoRegistro = {
        id_registro: result.id_registro || Date.now(),
        registrado_por: modalData.registradoPor,
        area: modalData.area,
        pdf_reporte: result.url || null,
      };
      
      const historialActual = [nuevoRegistro, ...historialCargas].sort((a, b) => b.id_registro - a.id_registro);
      setHistorialCargas(historialActual);
      localStorage.setItem("historialCargasAsistencias", JSON.stringify(historialActual));
      
      showNotification("Datos guardados correctamente", "success");
      setExcelData([]);
      setModalData({ registradoPor: "", area: "" });
      setShowModal(false);
      loadDashboardData();
    } catch (error) {
      console.error("Error:", error);
      showNotification(error.message || "Error al guardar los datos", "error");
    }
  };

  const getDayName = (fecha) => {
    const date = new Date(fecha);
    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    return days[date.getDay()];
  };

  const getDayNumber = (fecha) => {
    const date = new Date(fecha);
    return date.getDate();
  };

  const formatTime = (timeString) => {
    if (!timeString) return "-";
    const parts = timeString.split(":");
    if (parts.length < 2) return timeString;
    const hours = parseInt(parts[0]);
    const minutes = parts[1] || "00";
    const seconds = parts[2] || "00";
    const ampm = hours >= 12 ? "pm" : "am";
    const displayHours = hours % 12 || 12;
    return `${String(displayHours).padStart(2, "0")}:${minutes}:${seconds} ${ampm}`;
  };

  const getEstadoEntrada = (entrada, fecha) => {
    if (!entrada) {
      return { texto: "No Registrado", color: "text-gray-600", bg: "bg-gray-100", icon: "❌" };
    }
    const [hours, minutes] = entrada.split(":").map(Number);
    const entradaTime = hours * 60 + minutes;
    const horaLimite = 9 * 60;
    if (entradaTime <= horaLimite) {
      return { texto: "Temprano", color: "text-green-700", bg: "bg-green-100", icon: "✓" };
    } else {
      return { texto: "Tarde", color: "text-red-700", bg: "bg-red-100", icon: "✗" };
    }
  };

  const calcularMinutosTardanza = (entrada) => {
    if (!entrada) return 0;
    const [hours, minutes] = entrada.split(":").map(Number);
    const entradaTime = hours * 60 + minutes;
    const horaLimite = 9 * 60;
    return Math.max(0, entradaTime - horaLimite);
  };

  const calcularTiempoExtra = (entrada, salida) => {
    if (!entrada || !salida) return 0;
    const estado = getEstadoEntrada(entrada);
    if (estado.texto === "Tarde") return 0;

    const [entHours, entMinutes] = entrada.split(":").map(Number);
    const [salHours, salMinutes] = salida.split(":").map(Number);
    const entradaTime = entHours * 60 + entMinutes;
    const salidaTime = salHours * 60 + salMinutes;
    const horaSalidaLimite = 18 * 60;

    if (entradaTime <= 9 * 60 && salidaTime > horaSalidaLimite) {
      return salidaTime - horaSalidaLimite;
    }
    return 0;
  };

  // Combinar datos del dashboard con datos del Excel cargado
  const allData = useMemo(() => {
    const excelDataFormatted = excelData.map((item) => ({
      id_asistencia: null,
      id_empleado: item.id,
      id_registro: null,
      fecha: item.fecha,
      hora_entrada: item.entrada,
      hora_salida: item.salida,
      nombre: item.nombre,
      anio: new Date(item.fecha).getFullYear(),
      mes: new Date(item.fecha).getMonth() + 1,
    }));

    const combined = [...excelDataFormatted, ...dashboardData];
    console.log("allData:", combined.length, "excel:", excelData.length, "dashboard:", dashboardData.length);
    return combined;
  }, [excelData, dashboardData]);

  const filteredData = useMemo(() => {
    let filtered = [...allData];

    // Filtrar por año basándose en la fecha
    if (selectedYear) {
      filtered = filtered.filter((d) => {
        if (!d.fecha) return false;
        const year = d.anio || new Date(d.fecha).getFullYear();
        return year === selectedYear;
      });
    }

    // Filtrar por mes basándose en la fecha
    if (selectedMonth) {
      filtered = filtered.filter((d) => {
        if (!d.fecha) return false;
        const month = d.mes || new Date(d.fecha).getMonth() + 1;
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
      const year = d.anio || new Date(d.fecha).getFullYear();
      years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [allData]);

  const uniqueMonths = useMemo(() => {
    const months = new Set();
    allData.forEach((d) => {
      const month = d.mes || new Date(d.fecha).getMonth() + 1;
      months.add(month);
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
      const estado = getEstadoEntrada(d.hora_entrada, d.fecha);
      return estado.texto === "Temprano";
    }).length;
  }, [selectedPersonData]);

  const tardanzas = useMemo(() => {
    return selectedPersonData.filter((d) => {
      if (!d.hora_entrada) return false;
      const estado = getEstadoEntrada(d.hora_entrada, d.fecha);
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
      if (!d.hora_entrada) return total;
      const estado = getEstadoEntrada(d.hora_entrada, d.fecha);
      if (estado.texto === "Temprano" && d.hora_salida) {
        const [entHours, entMinutes] = d.hora_entrada.split(":").map(Number);
        const entradaTime = entHours * 60 + entMinutes;
        const minutosAntes = 9 * 60 - entradaTime;
        return total + minutosAntes;
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
                  <div className="flex items-center space-x-3">
                    <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Subir Excel
                      <input type="file" accept=".xls,.xlsx" onChange={handleFileUpload} className="hidden" />
                    </label>
                    {excelData.length > 0 && (
                      <button
                        onClick={() => setShowModal(true)}
                        className="inline-flex items-center px-4 py-2 bg-gradient-to-br from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                        style={{ fontFamily: "var(--font-poppins)" }}
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Guardar
                      </button>
                    )}
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

                <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3" style={{ fontFamily: "var(--font-poppins)" }}>
                    Historial de Cargas
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {historialCargas.length === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-4" style={{ fontFamily: "var(--font-poppins)" }}>
                        No hay cargas registradas
                      </p>
                    ) : (
                      historialCargas.map((registro, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-900 truncate" style={{ fontFamily: "var(--font-poppins)" }}>
                              #{registro.id_registro}
                            </p>
                            <p className="text-xs text-gray-600 truncate" style={{ fontFamily: "var(--font-poppins)" }}>
                              {registro.registrado_por}
                            </p>
                            <p className="text-xs text-gray-500 truncate" style={{ fontFamily: "var(--font-poppins)" }}>
                              {registro.area}
                            </p>
                          </div>
                          {registro.pdf_reporte && (
                            <a
                              href={registro.pdf_reporte}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 p-1.5 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
                              title="Descargar PDF"
                            >
                              <svg className="w-4 h-4 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            </a>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-9">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                  <div className="overflow-x-auto justify-center text-center">
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
                          const dataFiltrada = filteredData.filter((d) => {
                            if (!d.fecha) return false;
                            const dayName = getDayName(d.fecha);
                            // Omitir domingos
                            return dayName !== "Domingo";
                          });

                          const totalPages = Math.ceil(dataFiltrada.length / itemsPerPage);
                          const startIndex = (currentPage - 1) * itemsPerPage;
                          const endIndex = startIndex + itemsPerPage;
                          const dataPaginada = dataFiltrada.slice(startIndex, endIndex);

                          if (dataFiltrada.length === 0) {
                            return (
                              <tr>
                                <td colSpan="8" className="px-4 py-8 text-center text-gray-500" style={{ fontFamily: "var(--font-poppins)" }}>
                                  No hay datos disponibles
                                </td>
                              </tr>
                            );
                          }

                          return dataPaginada.map((d, index) => {
                            // Si no hay entrada, es inasistencia (No Registrado)
                            const estado = getEstadoEntrada(d.hora_entrada, d.fecha);
                            const minutosTardanza = d.hora_entrada ? calcularMinutosTardanza(d.hora_entrada) : 0;
                            const tiempoExtra = d.hora_entrada && d.hora_salida ? calcularTiempoExtra(d.hora_entrada, d.hora_salida) : 0;
                            const dayName = getDayName(d.fecha);
                            const dayNumber = getDayNumber(d.fecha);

                            return (
                              <tr key={index} className="hover:bg-blue-50 transition-colors border-b border-gray-100">
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
                                  {dayNumber}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-900 capitalize" style={{ fontFamily: "var(--font-poppins)" }}>
                                  {dayName}
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

                  {/* Paginación */}
                  {(() => {
                    // Filtrar solo días laborables (lunes a sábado) basándose en la fecha
                    const dataFiltrada = filteredData.filter((d) => {
                      if (!d.fecha) return false;
                      const dayName = getDayName(d.fecha);
                      // Omitir domingos
                      return dayName !== "Domingo";
                    });
                    const totalPages = Math.ceil(dataFiltrada.length / itemsPerPage);

                    if (totalPages <= 1) return null;

                    return (
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 flex items-center justify-between border-t border-gray-200">
                        <button
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                          className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                          style={{ fontFamily: "var(--font-poppins)" }}
                        >
                          «
                        </button>
                        <button
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                          style={{ fontFamily: "var(--font-poppins)" }}
                        >
                          &lt;
                        </button>
                        <span className="text-xs text-gray-700 font-semibold" style={{ fontFamily: "var(--font-poppins)" }}>
                          Página {currentPage} de {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                          style={{ fontFamily: "var(--font-poppins)" }}
                        >
                          &gt;
                        </button>
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                          style={{ fontFamily: "var(--font-poppins)" }}
                        >
                          »
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </div>
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
                <label className="block text-sm font-medium text-gray-900 mb-1" style={{ fontFamily: "var(--font-poppins)" }}>Registrado Por</label>
                <input
                  type="text"
                  value={modalData.registradoPor}
                  onChange={(e) => setModalData({ ...modalData, registradoPor: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                  style={{ fontFamily: "var(--font-poppins)" }}
                  placeholder="Nombre de la persona"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1" style={{ fontFamily: "var(--font-poppins)" }}>Área</label>
                <input
                  type="text"
                  value={modalData.area}
                  onChange={(e) => setModalData({ ...modalData, area: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                  style={{ fontFamily: "var(--font-poppins)" }}
                  placeholder="Área de la persona"
                />
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
