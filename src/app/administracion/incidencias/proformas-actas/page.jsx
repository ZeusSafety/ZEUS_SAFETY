"use client";
/* eslint react/no-unescaped-entities: "off" */

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../components/context/AuthContext";
import { Header } from "../../../../components/layout/Header";
import { Sidebar } from "../../../../components/layout/Sidebar";
import Modal from "../../../../components/ui/Modal";

export default function IncidenciasProformasActasPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Estados para datos
  const [allRecords, setAllRecords] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [errorAPI, setErrorAPI] = useState(null);

  // Filtros
  const [filtros, setFiltros] = useState({
    verificacion: "TODOS",
    fechaDesde: "",
    fechaHasta: "",
  });

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // 10 filas visibles

  // Redirigir a login si no hay usuario
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Cargar datos del API
  useEffect(() => {
    if (user) {
      cargarRegistros();
    }
  }, [user]);

  // Función para formatear fechas
  const fmtDateDisplay = (dt) => {
    if (!dt) return "";
    const d = new Date(dt);
    if (isNaN(d.getTime())) return dt;
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    let hh = d.getHours();
    const ap = hh >= 12 ? "PM" : "AM";
    hh = hh % 12 || 12;
    const mi = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${dd}-${mm}-${yyyy} ${String(hh).padStart(2, "0")}:${mi}:${ss} ${ap}`;
  };

  const fmtDateOnly = (dt) => {
    if (!dt) return "";
    const d = new Date(dt);
    if (isNaN(d.getTime())) return dt;
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  // Función para obtener nombre del mes
  const getMonthName = (monthNum) => {
    const months = [
      "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    const num = parseInt(monthNum) || 0;
    return months[num] || monthNum;
  };

  // Función para cargar registros del API
  const cargarRegistros = async () => {
    try {
      setLoadingData(true);
      setErrorAPI(null);
      console.log("🔄 Cargando registros desde API...");

      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch("/api/incidencias-proformas-actas?tipo=listado", {
        method: "GET",
        headers: headers,
      });

      console.log("📡 Response status:", response.status);
      console.log("📡 Response ok:", response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Error response:", errorText);
        throw new Error(`Error HTTP: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("📊 Tipo de datos recibidos:", typeof data);
      console.log("📊 Es array?", Array.isArray(data));
      console.log("📊 Datos completos recibidos de API:", JSON.stringify(data, null, 2));

      // Intentar diferentes formatos de respuesta
      let records = [];

      if (Array.isArray(data)) {
        records = data;
      } else if (data && Array.isArray(data.data)) {
        records = data.data;
      } else if (data && Array.isArray(data.records)) {
        records = data.records;
      } else if (data && Array.isArray(data.result)) {
        records = data.result;
      } else if (data && data.result) {
        // Si result es un string JSON, parsearlo
        try {
          const parsed = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
          if (Array.isArray(parsed)) {
            records = parsed;
          } else if (parsed && Array.isArray(parsed.data)) {
            records = parsed.data;
          } else if (parsed && Array.isArray(parsed.records)) {
            records = parsed.records;
          }
        } catch (e) {
          console.error("❌ Error parseando result:", e);
        }
      } else if (data && typeof data === 'object') {
        // Si es un objeto, intentar convertir sus valores a array
        const values = Object.values(data);
        if (values.length > 0 && Array.isArray(values[0])) {
          records = values[0];
        } else if (values.length > 0) {
          records = values;
        }
      }

      console.log("✅ Registros procesados:", records.length);
      console.log("📋 Primer registro (si existe):", records[0]);

      setAllRecords(records);
    } catch (error) {
      console.error("❌ Error cargando registros:", error);
      setErrorAPI(`Error al cargar datos: ${error.message}`);
      setAllRecords([]);
    } finally {
      setLoadingData(false);
    }
  };

  // Función para obtener errores y soluciones
  const cargarErroresSoluciones = async (id) => {
    try {
      console.log("🔍 Obteniendo errores y soluciones para ID:", id);
      const response = await fetch(`/api/incidencias-proformas-actas?tipo=error_solucion&id=${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log("📊 Datos de errores y soluciones recibidos:", data);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("❌ Error obteniendo errores y soluciones:", error);
      return [];
    }
  };

  // Filtrar registros
  const registrosFiltrados = useMemo(() => {
    let filtered = [...allRecords];

    // Filtrar por estado de verificación
    if (filtros.verificacion !== "TODOS") {
      filtered = filtered.filter(rec => {
        const estado = (rec["ESTADO_INCIDENCIA"] || "PENDIENTE").toString().toUpperCase();
        return estado === filtros.verificacion;
      });
    }

    // Filtrar por fechas
    if (filtros.fechaDesde) {
      filtered = filtered.filter(rec => {
        const fISO = rec["DATE(FECHA_EMISION)"] || "";
        const f = typeof fISO === "string" ? fISO.substring(0, 10) : "";
        return f >= filtros.fechaDesde;
      });
    }

    if (filtros.fechaHasta) {
      filtered = filtered.filter(rec => {
        const fISO = rec["DATE(FECHA_EMISION)"] || "";
        const f = typeof fISO === "string" ? fISO.substring(0, 10) : "";
        return f <= filtros.fechaHasta;
      });
    }

    return filtered;
  }, [allRecords, filtros.verificacion, filtros.fechaDesde, filtros.fechaHasta]);

  // Paginación calculada
  const totalPages = Math.ceil(registrosFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const registrosPaginados = registrosFiltrados.slice(startIndex, startIndex + itemsPerPage);

  // Resetear página cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [filtros.verificacion, filtros.fechaDesde, filtros.fechaHasta]);

  const handleAplicarFiltros = () => {
    console.log("Aplicando filtros Proformas/Actas:", filtros);
    setCurrentPage(1);
  };

  const handleLimpiarFiltros = () => {
    setFiltros({
      verificacion: "TODOS",
      fechaDesde: "",
      fechaHasta: "",
    });
    setCurrentPage(1);
  };

  // Función para abrir modal de verificación
  const abrirModalVerificacion = (record) => {
    setSelectedRecord(record);
    setFormVerificacion({
      solucion: record["SOLUCION"] || "",
      observacion: record["OBSERVACION_ADICIONAL_CORRECION"] || "",
      revisadoPor: (record["REVISADO_POR"] || "").toUpperCase(),
      estado: (record["ESTADO_INCIDENCIA"] || "PENDIENTE").toUpperCase(),
    });
    setModalVerificacionAbierto(true);
  };

  // Función para guardar verificación
  const guardarVerificacion = async () => {
    if (!selectedRecord) return;

    try {
      const data = {
        solucion: formVerificacion.solucion || "",
        observacion_adicional: formVerificacion.observacion || "",
        revisado_por: formVerificacion.revisadoPor || "",
        estado: formVerificacion.estado.toUpperCase(),
        id: selectedRecord["ID"],
      };

      const response = await fetch("/api/incidencias-proformas-actas?metodo=verificacion", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      await cargarRegistros();
      setModalVerificacionAbierto(false);
      setSelectedRecord(null);
    } catch (error) {
      console.error("❌ Error guardando verificación:", error);
      alert("Error al guardar. Intente nuevamente.");
    }
  };

  // Función para abrir modal de observaciones
  const abrirModalObs = (record) => {
    setSelectedRecord(record);
    setModalObsAbierto(true);
  };

  // Función para abrir modal de archivo
  const abrirModalArchivo = (record) => {
    setSelectedRecord(record);
    setModalArchivoAbierto(true);
  };

  // Función para abrir PDF directamente
  const abrirPDF = (url) => {
    if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      alert("No hay archivo PDF disponible.");
    }
  };

  // Función para abrir modal de culminado
  const abrirModalCulminado = (record) => {
    setSelectedRecord(record);
    const val = (record["CULMINADO"] || "NO").toUpperCase() === "SI";
    setFormCulminado({
      estado: val ? "SI" : "NO",
    });
    setModalCulminadoAbierto(true);
  };

  // Función para guardar culminado
  const guardarCulminado = async () => {
    if (!selectedRecord) return;

    try {
      const data = {
        culminado: formCulminado.estado === "SI" ? "Si" : "No",
        id: selectedRecord["ID"],
      };

      const response = await fetch("/api/incidencias-proformas-actas?metodo=culminado", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      await cargarRegistros();
      setModalCulminadoAbierto(false);
      setSelectedRecord(null);
    } catch (error) {
      console.error("❌ Error guardando culminado:", error);
      alert("Error al guardar. Intente nuevamente.");
    }
  };

  // Función para abrir modal de detalles de error
  const abrirModalDetallesError = async (record) => {
    setSelectedRecord(record);
    const errores = await cargarErroresSoluciones(record["ID"]);
    setErroresSoluciones(errores);
    setModalDetallesErrorAbierto(true);
  };

  // Función para generar PDF
  const generarPDF = async (record) => {
    try {
      const errores = await cargarErroresSoluciones(record["ID"]);

      // Cargar jsPDF dinámicamente
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      let y = 10;
      doc.setFontSize(12);

      // Información básica del registro
      const lines = [
        `ID: ${record["ID"]}`,
        `Mes: ${getMonthName(record["MONTH(FECHA_EMISION)"])}`,
        `Encargado: ${record["ENCARGADO_COMPROBANTE"] || ""}`,
        `Fecha emisión: ${fmtDateOnly(record["DATE(FECHA_EMISION)"])}`,
        `N° proforma/acta: ${record["NUMERO_PROFORMA"] || ""}`,
        `N° comprobante: ${record["NUMERO_COMPROBANTE"] || ""}`,
        `Responsable: ${record["RESPONSABLE_INCIDENCIA"] || ""}`,
        `Área: ${record["AREA"] || ""}`,
        `Tipo: ${record["TIPO_INCIDENCIA"] || ""}`,
        `Fecha notificación: ${fmtDateDisplay(record["FECHA_NOTIFICACION"])}`,
        `Solución: ${record["SOLUCION"] || ""}`,
        `Obs. adicionales: ${(record["OBSERVACION_ADICIONAL_CORRECION"] || "").toString().replace(/\n/g, " ")}`,
        `Revisado por: ${record["REVISADO_POR"] || ""}`,
        `Estado verificación: ${record["ESTADO_INCIDENCIA"] || ""}`,
        `Fecha envío archivo: ${fmtDateDisplay(record["FECHA_ENVIO_ARCHIVO"] || "")}`,
        `Fecha concluyente: ${fmtDateDisplay(record["FECHA_CONCLUYENTE"] || "")}`,
      ];

      lines.forEach(line => {
        doc.text(line, 10, y);
        y += 7;
        if (y > 280) {
          doc.addPage();
          y = 10;
        }
      });

      // Agregar errores y soluciones
      if (errores && errores.length > 0) {
        y += 5;
        doc.setFontSize(14);
        doc.setFont(undefined, "bold");
        doc.text("DETALLES DE ERRORES Y SOLUCIONES:", 10, y);
        y += 8;
        doc.setFontSize(10);
        doc.setFont(undefined, "normal");

        errores.forEach((item, i) => {
          const errorText = `Error ${i + 1}: ${item["ERROR_"] || ""}`;
          const solucionText = `Solución ${i + 1}: ${item["SOLUCION"] || ""}`;

          if (y > 270) {
            doc.addPage();
            y = 10;
          }

          doc.text(errorText, 15, y);
          y += 6;
          doc.text(solucionText, 15, y);
          y += 8;
        });
      }

      doc.save(`${record["ID"] || "incidencia"}.pdf`);
    } catch (error) {
      console.error("❌ Error generando PDF:", error);
      alert("Error al generar el PDF. Intente nuevamente.");
    }
  };

  // Función para exportar CSV
  const exportarCSV = () => {
    const headers = [
      "ID", "Fecha de registro", "Registrado por", "Mes", "Encargado comprobante",
      "Fecha emisión", "N° proforma/acta", "N° comprobante", "Responsable", "Área",
      "Tipo de incidencia", "Fecha de notificación", "Solución", "Revisado por",
      "Estado de verificación", "Fecha envío de archivo", "Fecha de corrección",
      "Estado de la solución", "Comprobante", "N° de comprobante (Fact.)", "Culminado", "Fecha concluyente"
    ];

    const csvRows = [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(","),
      ...registrosFiltrados.map(rec => [
        rec["ID"] || "",
        fmtDateDisplay(rec["FECHA_REGISTRO"]) || "",
        rec["REGISTRADO_POR"] || "",
        getMonthName(rec["MONTH(FECHA_EMISION)"]) || "",
        rec["ENCARGADO_COMPROBANTE"] || "",
        fmtDateOnly(rec["DATE(FECHA_EMISION)"]) || "",
        rec["NUMERO_PROFORMA"] || "",
        rec["NUMERO_COMPROBANTE"] || "",
        rec["RESPONSABLE_INCIDENCIA"] || "",
        rec["AREA"] || "",
        rec["TIPO_INCIDENCIA"] || "",
        fmtDateDisplay(rec["FECHA_NOTIFICACION"]) || "",
        rec["SOLUCION"] || "",
        rec["REVISADO_POR"] || "",
        rec["ESTADO_INCIDENCIA"] || "",
        fmtDateDisplay(rec["FECHA_ENVIO_ARCHIVO"] || "") || "",
        fmtDateDisplay(rec["FECHA_CORRECION"] || "") || "",
        rec["ESTADO_SOLUCION"] || "",
        rec["COMPROBANTE"] || "",
        rec["NUMERO_COMPROBANTE_SOLUCION"] || "",
        rec["CULMINADO"] || "",
        fmtDateDisplay(rec["FECHA_CONCLUYENTE"] || "") || "",
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
    ];

    const csv = csvRows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "incidencias_administracion.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Función para generar reporte
  const generarReporte = async () => {
    try {
      const { default: html2canvas } = await import("html2canvas");
      const { jsPDF } = await import("jspdf");

      const table = document.getElementById("tablaAdmin");
      if (!table) {
        alert("No se encontró la tabla.");
        return;
      }

      const canvas = await html2canvas(table);
      const img = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape" });
      const props = pdf.getImageProperties(img);
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (props.height * pdfW) / props.width;
      pdf.addImage(img, "PNG", 0, 10, pdfW, pdfH);
      pdf.save("reporte_incidencias_admin.pdf");
    } catch (error) {
      console.error("❌ Error generando reporte:", error);
      alert("Error al generar el reporte. Intente nuevamente.");
    }
  };

  // Mantener la barra lateral abierta en desktop (>= 1024px) y colapsable en mobile
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

  // Modales
  const [modalProcedimientoAbierto, setModalProcedimientoAbierto] = useState(false);
  const [modalVerificacionAbierto, setModalVerificacionAbierto] = useState(false);
  const [modalObsAbierto, setModalObsAbierto] = useState(false);
  const [modalArchivoAbierto, setModalArchivoAbierto] = useState(false);
  const [modalCulminadoAbierto, setModalCulminadoAbierto] = useState(false);
  const [modalDetallesErrorAbierto, setModalDetallesErrorAbierto] = useState(false);

  // Estado para registro seleccionado
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [erroresSoluciones, setErroresSoluciones] = useState([]);

  // Formulario de verificación
  const [formVerificacion, setFormVerificacion] = useState({
    solucion: "",
    observacion: "",
    revisadoPor: "",
    estado: "PENDIENTE",
  });

  // Formulario de culminado
  const [formCulminado, setFormCulminado] = useState({
    estado: "NO",
  });

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

        <main
          className="flex-1 overflow-y-auto custom-scrollbar"
          style={{ background: "#F7FAFF" }}
        >
          <div className="max-w-[95%] mx-auto px-4 py-4">
            {/* Botón Volver */}
            <button
              onClick={() => router.push("/administracion")}
              className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-lg font-medium hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm ripple-effect relative overflow-hidden text-sm group"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              <svg
                className="w-4 h-4 group-hover:scale-110 transition-transform duration-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver a Administración</span>
            </button>

            {/* Contenedor principal */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">
              {/* Título con icono y API Conectada */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#002D5A] to-[#002D5A] rounded-xl flex items-center justify-center text-white shadow-sm">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>Listado de incidencias y actas</h1>
                    <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: 'var(--font-poppins)' }}>
                      Control de incidencias asociadas a proformas y actas administrativas
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {loadingData ? (
                    <div className="flex items-center space-x-2 rounded-lg px-3 py-1.5 bg-yellow-50 border border-yellow-200">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                      <span className="text-sm font-semibold text-yellow-700" style={{ fontFamily: 'var(--font-poppins)' }}>Cargando...</span>
                    </div>
                  ) : errorAPI ? (
                    <div className="flex items-center space-x-2 rounded-lg px-3 py-1.5 bg-red-50 border border-red-200">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="text-sm font-semibold text-red-700" style={{ fontFamily: 'var(--font-poppins)' }}>Error API</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 rounded-lg px-3 py-1.5 bg-green-50 border border-green-200">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-semibold text-green-700" style={{ fontFamily: 'var(--font-poppins)' }}>
                        API Conectada
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => setModalProcedimientoAbierto(true)}
                    className="inline-flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-lg text-xs font-semibold shadow-sm hover:shadow-md hover:scale-105 active:scale-[0.98] transition-all duration-200"
                    style={{ fontFamily: 'var(--font-poppins)' }}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span>Ver procedimiento</span>
                  </button>
                </div>
              </div>

              {/* Filtros (select + fechas + botones) */}
              <div className="mb-4 flex items-end gap-3">
                <div className="w-56">
                  <label className="block text-xs font-semibold text-gray-700 mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>
                    Filtrar por verificación
                  </label>
                  <select
                    value={filtros.verificacion}
                    onChange={(e) =>
                      setFiltros((prev) => ({ ...prev, verificacion: e.target.value }))
                    }
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-300 bg-white"
                    style={{ fontFamily: 'var(--font-poppins)' }}
                  >
                    <option value="TODOS">Todos</option>
                    <option value="PENDIENTE">Pendiente</option>
                    <option value="EN REVISIÓN">En revisión</option>
                    <option value="NOTIFICADO">Notificado</option>
                    <option value="COMPLETADO">Completado</option>
                    <option value="OBSERVADO">Observado</option>
                  </select>
                </div>
                <div className="w-[160px]">
                  <label className="block text-xs font-semibold text-gray-700 mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>
                    Desde
                  </label>
                  <input
                    type="date"
                    value={filtros.fechaDesde}
                    onChange={(e) =>
                      setFiltros((prev) => ({ ...prev, fechaDesde: e.target.value }))
                    }
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-300 bg-white"
                    style={{ fontFamily: 'var(--font-poppins)' }}
                  />
                </div>
                <div className="w-[160px]">
                  <label className="block text-xs font-semibold text-gray-700 mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>
                    Hasta
                  </label>
                  <input
                    type="date"
                    value={filtros.fechaHasta}
                    onChange={(e) =>
                      setFiltros((prev) => ({ ...prev, fechaHasta: e.target.value }))
                    }
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-300 bg-white"
                    style={{ fontFamily: 'var(--font-poppins)' }}
                  />
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={handleAplicarFiltros}
                    className="px-3 py-2 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-lg text-xs font-semibold shadow-sm hover:shadow-md hover:scale-105 active:scale-[0.98] transition-all duration-200"
                    style={{ fontFamily: 'var(--font-poppins)' }}
                  >
                    Aplicar filtros
                  </button>
                  <button
                    onClick={handleLimpiarFiltros}
                    className="px-3 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm"
                    style={{ fontFamily: 'var(--font-poppins)' }}
                  >
                    Limpiar
                  </button>
                  <button
                    onClick={exportarCSV}
                    className="px-3 py-2 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg text-xs font-semibold shadow-sm hover:shadow-md hover:scale-105 active:scale-[0.98] transition-all duration-200"
                    style={{ fontFamily: 'var(--font-poppins)' }}
                  >
                    Exportar CSV
                  </button>
                  <button
                    onClick={generarReporte}
                    className="px-3 py-2 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg text-xs font-semibold shadow-sm hover:shadow-md hover:scale-105 active:scale-[0.98] transition-all duration-200"
                    style={{ fontFamily: 'var(--font-poppins)' }}
                  >
                    Generar reporte
                  </button>
                </div>
              </div>

              {/* Tabla principal (un solo cuadro grande) */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                <div className="overflow-x-auto">
                  {loadingData ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
                    </div>
                  ) : errorAPI ? (
                    <div className="flex items-center justify-center py-12">
                      <p className="text-red-600">{errorAPI}</p>
                    </div>
                  ) : (
                    <table id="tablaAdmin" className="w-full">
                      <thead>
                        <tr className="bg-gradient-to-r from-blue-700 to-blue-800 border-b-2 border-blue-900">
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                            ID
                          </th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                            Fecha de registro
                          </th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                            Registrado por
                          </th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                            Mes
                          </th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                            Encargado comprobante
                          </th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                            Fecha emisión
                          </th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                            N° proforma/acta
                          </th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                            N° comprobante
                          </th>
                          <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                            Ítems de error
                          </th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                            Responsable
                          </th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                            Área
                          </th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                            Tipo de incidencia
                          </th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                            Fecha de notificación
                          </th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                            Solución
                          </th>
                          <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                            Obs. adicionales
                          </th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                            Revisado por
                          </th>
                          <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                            Estado de verificación
                          </th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                            Fecha envío de archivo
                          </th>
                          <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                            Archivo de solución
                          </th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                            Fecha de corrección
                          </th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                            Estado de la solución
                          </th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                            Comprobante
                          </th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                            N° de comprobante (Fact.)
                          </th>
                          <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                            Culminado
                          </th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                            Fecha concluyente
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {registrosPaginados.length === 0 ? (
                          <tr>
                            <td colSpan={25} className="px-4 py-8 text-center text-gray-500" style={{ fontFamily: 'var(--font-poppins)' }}>
                              {loadingData ? "Cargando..." : "No hay registros disponibles"}
                            </td>
                          </tr>
                        ) : (
                          registrosPaginados.map((rec) => {
                            const solucionSinIncidencia = (rec["SOLUCION"] || "").toString().trim().toUpperCase() === "SIN INCIDENCIA";
                            const estado = (rec["ESTADO_INCIDENCIA"] || "PENDIENTE").toString().toUpperCase();
                            const culminado = (rec["CULMINADO"] || "NO").toUpperCase() === "SI";
                            const tieneObs = !!(rec["OBSERVACION_ADICIONAL_CORRECION"] || "").trim();
                            const archivoUrl = (rec["ARCHIVO_SOLUCION_PDF"] || "").trim();
                            const tieneArchivo = !!archivoUrl;
                            const textoArchivo = (rec["TEXTO_SOLUCION_PDF"] || "").trim();

                            // Determinar clase de badge para estado
                            const getEstadoBadgeClass = (est) => {
                              if (est === "PENDIENTE") return "bg-gradient-to-br from-yellow-500 to-yellow-600";
                              if (est === "EN REVISIÓN" || est === "EN REVISION") return "bg-gradient-to-br from-orange-500 to-orange-600";
                              if (est === "NOTIFICADO") return "bg-gradient-to-br from-blue-500 to-blue-600";
                              if (est === "COMPLETADO") return "bg-gradient-to-br from-green-600 to-green-700";
                              if (est === "OBSERVADO") return "bg-gradient-to-br from-red-600 to-red-700";
                              return "bg-gradient-to-br from-gray-500 to-gray-600";
                            };

                            return (
                              <tr
                                key={rec["ID"] || `row-${Math.random()}`}
                                className="hover:bg-blue-50 transition-colors border-b border-gray-100"
                              >
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] font-medium text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                                  {rec["ID"] || ""}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>
                                  {fmtDateDisplay(rec["FECHA_REGISTRO"]) || ""}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>
                                  {rec["REGISTRADO_POR"] || ""}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>
                                  {getMonthName(rec["MONTH(FECHA_EMISION)"]) || ""}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>
                                  {rec["ENCARGADO_COMPROBANTE"] || ""}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>
                                  {fmtDateOnly(rec["DATE(FECHA_EMISION)"]) || ""}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] font-semibold text-gray-800" style={{ fontFamily: 'var(--font-poppins)' }}>
                                  {rec["NUMERO_PROFORMA"] || ""}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] font-semibold text-gray-800" style={{ fontFamily: 'var(--font-poppins)' }}>
                                  {rec["NUMERO_COMPROBANTE"] || ""}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-center text-[10px]">
                                  <div className="inline-flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => abrirModalDetallesError(rec)}
                                      className="flex items-center justify-center px-3 py-1.5 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                      style={{ fontFamily: 'var(--font-poppins)' }}
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => generarPDF(rec)}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                                      style={{ fontFamily: 'var(--font-poppins)' }}
                                    >
                                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M6 2C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V7.41421C19 7.149 18.8946 6.89464 18.7071 6.70711L13.2929 1.29289C13.1054 1.10536 12.851 1 12.5858 1H6Z" stroke="currentColor" strokeWidth="1.5" fill="none"></path>
                                        <path d="M13 1V6H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                                        <text x="12" y="15" fontSize="6" fill="currentColor" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="0.3">PDF</text>
                                      </svg>
                                      <span>PDF</span>
                                    </button>
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>
                                  {rec["RESPONSABLE_INCIDENCIA"] || ""}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>
                                  {rec["AREA"] || ""}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700 text-center" style={{ fontFamily: 'var(--font-poppins)' }}>
                                  {(rec["TIPO_INCIDENCIA"] || "").toString().toUpperCase()}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>
                                  {fmtDateDisplay(rec["FECHA_NOTIFICACION"]) || ""}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700 text-center" style={{ fontFamily: 'var(--font-poppins)' }}>
                                  {(rec["SOLUCION"] || "").toString().toUpperCase()}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-center text-[10px]">
                                  {tieneObs ? (
                                    <button
                                      type="button"
                                      onClick={() => abrirModalObs(rec)}
                                      className="flex items-center justify-center px-3 py-1.5 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                      style={{ fontFamily: 'var(--font-poppins)' }}
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                    </button>
                                  ) : (
                                    <span className="text-gray-400" style={{ fontFamily: 'var(--font-poppins)' }}>—</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700 text-center uppercase" style={{ fontFamily: 'var(--font-poppins)' }}>
                                  {(rec["REVISADO_POR"] || "").toString().toUpperCase()}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-center text-[10px]">
                                  <div className="inline-flex items-center gap-2">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold text-white shadow-sm transition-all duration-200 ${getEstadoBadgeClass(estado)}`} style={{ fontFamily: 'var(--font-poppins)' }}>
                                      {estado}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => abrirModalVerificacion(rec)}
                                      className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md ${estado === "PENDIENTE"
                                        ? "bg-gradient-to-br from-red-600 to-red-700 text-white"
                                        : "bg-gradient-to-br from-green-600 to-green-700 text-white"
                                        }`}
                                      style={{ fontFamily: 'var(--font-poppins)' }}
                                    >
                                      Editar
                                    </button>
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>
                                  {fmtDateDisplay(rec["FECHA_ENVIO_ARCHIVO"] || "") || "—"}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-center text-[10px]">
                                  {tieneArchivo || textoArchivo ? (
                                    <div className="inline-flex items-center gap-1.5">
                                      {tieneArchivo && (
                                        <button
                                          type="button"
                                          onClick={() => abrirPDF(archivoUrl)}
                                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                                          style={{ fontFamily: 'var(--font-poppins)' }}
                                        >
                                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M6 2C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V7.41421C19 7.149 18.8946 6.89464 18.7071 6.70711L13.2929 1.29289C13.1054 1.10536 12.851 1 12.5858 1H6Z" stroke="currentColor" strokeWidth="1.5" fill="none"></path>
                                            <path d="M13 1V6H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                                            <text x="12" y="15" fontSize="6" fill="currentColor" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="0.3">PDF</text>
                                          </svg>
                                          <span>PDF</span>
                                        </button>
                                      )}
                                      {textoArchivo && (
                                        <button
                                          type="button"
                                          onClick={() => abrirModalArchivo(rec)}
                                          className="flex items-center justify-center px-3 py-1.5 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                          style={{ fontFamily: 'var(--font-poppins)' }}
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                          </svg>
                                        </button>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-gray-400" style={{ fontFamily: 'var(--font-poppins)' }}>—</span>
                                  )}
                                </td>
                                <td className={`px-4 py-3 whitespace-nowrap text-[10px] text-gray-700 ${solucionSinIncidencia ? "bg-red-100" : ""}`} style={{ fontFamily: 'var(--font-poppins)' }}>
                                  {fmtDateDisplay(rec["FECHA_CORRECION"] || "") || "—"}
                                </td>
                                <td className={`px-4 py-3 whitespace-nowrap text-[10px] text-gray-700 ${solucionSinIncidencia ? "bg-red-100" : ""}`} style={{ fontFamily: 'var(--font-poppins)' }}>
                                  {rec["ESTADO_SOLUCION"] || ""}
                                </td>
                                <td className={`px-4 py-3 whitespace-nowrap text-[10px] text-gray-700 text-center uppercase ${solucionSinIncidencia ? "bg-red-100" : ""}`} style={{ fontFamily: 'var(--font-poppins)' }}>
                                  {(rec["COMPROBANTE"] || "").toString().toUpperCase()}
                                </td>
                                <td className={`px-4 py-3 whitespace-nowrap text-[10px] text-gray-700 text-center ${solucionSinIncidencia ? "bg-red-100" : ""}`} style={{ fontFamily: 'var(--font-poppins)' }}>
                                  {rec["NUMERO_COMPROBANTE_SOLUCION"] || ""}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-center text-[10px]">
                                  <div className="inline-flex items-center gap-2">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold text-white shadow-sm transition-all duration-200 ${culminado
                                      ? "bg-gradient-to-br from-green-600 to-green-700"
                                      : "bg-gradient-to-br from-red-600 to-red-700"
                                      }`} style={{ fontFamily: 'var(--font-poppins)' }}>
                                      {culminado ? "Sí" : "No"}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => abrirModalCulminado(rec)}
                                      className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md ${culminado
                                        ? "bg-gradient-to-br from-green-600 to-green-700 text-white"
                                        : "bg-gradient-to-br from-red-600 to-red-700 text-white"
                                        }`}
                                      style={{ fontFamily: 'var(--font-poppins)' }}
                                    >
                                      Editar
                                    </button>
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>
                                  {fmtDateDisplay(rec["FECHA_CONCLUYENTE"] || "") || "—"}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  )}
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
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
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
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal de Actualizar Verificación */}
      <Modal
        isOpen={modalVerificacionAbierto}
        onClose={() => {
          setModalVerificacionAbierto(false);
          setSelectedRecord(null);
        }}
        title="Actualizar verificación"
        size="xl"
        primaryButtonText="Guardar"
        secondaryButtonText="Cancelar"
        onPrimaryButtonClick={guardarVerificacion}
        onSecondaryButtonClick={() => {
          setModalVerificacionAbierto(false);
          setSelectedRecord(null);
        }}
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-600" style={{ fontFamily: 'var(--font-poppins)' }}>
            La <strong>Fecha de notificación</strong> se registrará automáticamente al guardar.
          </p>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>
              Solución
            </label>
            <select
              value={formVerificacion.solucion}
              onChange={(e) => setFormVerificacion(prev => ({ ...prev, solucion: e.target.value }))}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-300 bg-white"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              <option value="">Seleccione...</option>
              <option value="ANULADO">ANULADO</option>
              <option value="MODIFICADO">MODIFICADO</option>
              <option value="UNA COMPRA">UNA COMPRA</option>
              <option value="UNA VENTA">UNA VENTA</option>
              <option value="SIN INCIDENCIA">SIN INCIDENCIA</option>
              <option value="ACTA">ACTA</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>
              Obs. adicionales
            </label>
            <textarea
              value={formVerificacion.observacion}
              onChange={(e) => setFormVerificacion(prev => ({ ...prev, observacion: e.target.value }))}
              rows={6}
              placeholder="Escriba observaciones"
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-300 bg-white resize-y"
              style={{ fontFamily: 'var(--font-poppins)', minHeight: '120px' }}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>
              Revisado por
            </label>
            <select
              value={formVerificacion.revisadoPor}
              onChange={(e) => setFormVerificacion(prev => ({ ...prev, revisadoPor: e.target.value }))}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-300 bg-white"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              <option value="">Seleccione...</option>
              <option value="KIMBERLY">KIMBERLY</option>
              <option value="HERVIN">HERVIN</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>
              Estado de verificación
            </label>
            <select
              value={formVerificacion.estado}
              onChange={(e) => setFormVerificacion(prev => ({ ...prev, estado: e.target.value }))}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-300 bg-white"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              <option value="PENDIENTE">PENDIENTE</option>
              <option value="EN REVISIÓN">EN REVISIÓN</option>
              <option value="NOTIFICADO">NOTIFICADO</option>
              <option value="COMPLETADO">COMPLETADO</option>
              <option value="OBSERVADO">OBSERVADO</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Modal de Observaciones Adicionales */}
      <Modal
        isOpen={modalObsAbierto}
        onClose={() => {
          setModalObsAbierto(false);
          setSelectedRecord(null);
        }}
        title="Observaciones adicionales"
        size="md"
        primaryButtonText="Cerrar"
        onPrimaryButtonClick={() => {
          setModalObsAbierto(false);
          setSelectedRecord(null);
        }}
      >
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <pre className="text-sm text-gray-900 whitespace-pre-wrap" style={{ fontFamily: 'var(--font-poppins)' }}>
            {selectedRecord ? (selectedRecord["OBSERVACION_ADICIONAL_CORRECION"] || "(Sin observaciones)") : ""}
          </pre>
        </div>
      </Modal>

      {/* Modal de Archivo de Solución */}
      <Modal
        isOpen={modalArchivoAbierto}
        onClose={() => {
          setModalArchivoAbierto(false);
          setSelectedRecord(null);
        }}
        title="Archivo de solución — texto/enlace"
        size="md"
        primaryButtonText="Cerrar"
        onPrimaryButtonClick={() => {
          setModalArchivoAbierto(false);
          setSelectedRecord(null);
        }}
      >
        <div className="space-y-4">
          {selectedRecord && (
            <>
              {selectedRecord["ARCHIVO_SOLUCION_PDF"] && (
                <div></div>
              )}
              {selectedRecord["TEXTO_SOLUCION_PDF"] && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                    Texto/Comentario:
                  </p>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <pre className="text-sm text-gray-900 whitespace-pre-wrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                      {selectedRecord["TEXTO_SOLUCION_PDF"]}
                    </pre>
                  </div>
                </div>
              )}
              {!selectedRecord["ARCHIVO_SOLUCION_PDF"] && !selectedRecord["TEXTO_SOLUCION_PDF"] && (
                <p className="text-gray-500" style={{ fontFamily: 'var(--font-poppins)' }}>(Sin texto/enlace)</p>
              )}
            </>
          )}
        </div>
      </Modal>

      {/* Modal de Actualizar Culminado */}
      <Modal
        isOpen={modalCulminadoAbierto}
        onClose={() => {
          setModalCulminadoAbierto(false);
          setSelectedRecord(null);
        }}
        title="Actualizar culminado"
        size="md"
        primaryButtonText="Guardar"
        secondaryButtonText="Cancelar"
        onPrimaryButtonClick={guardarCulminado}
        onSecondaryButtonClick={() => {
          setModalCulminadoAbierto(false);
          setSelectedRecord(null);
        }}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
              Estado
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="culmState"
                  value="SI"
                  checked={formCulminado.estado === "SI"}
                  onChange={(e) => setFormCulminado({ estado: e.target.value })}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>Sí</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="culmState"
                  value="NO"
                  checked={formCulminado.estado === "NO"}
                  onChange={(e) => setFormCulminado({ estado: e.target.value })}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>No</span>
              </label>
            </div>
          </div>
          <p className="text-xs text-gray-600" style={{ fontFamily: 'var(--font-poppins)' }}>
            Fecha concluyente: <strong>se registrará automáticamente al guardar (12h AM/PM)</strong>.
          </p>
        </div>
      </Modal>

      {/* Modal de Detalles de Error */}
      <Modal
        isOpen={modalDetallesErrorAbierto}
        onClose={() => {
          setModalDetallesErrorAbierto(false);
          setSelectedRecord(null);
          setErroresSoluciones([]);
        }}
        title="Detalles de Errores y Soluciones"
        size="xl"
        primaryButtonText="Cerrar"
        onPrimaryButtonClick={() => {
          setModalDetallesErrorAbierto(false);
          setSelectedRecord(null);
          setErroresSoluciones([]);
        }}
      >
        <div className="space-y-4">
          {selectedRecord && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>ID:</p>
                <p className="text-sm text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>{selectedRecord["ID"] || ""}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>Mes:</p>
                <p className="text-sm text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>{getMonthName(selectedRecord["MONTH(FECHA_EMISION)"]) || ""}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>Encargado comprobante:</p>
                <p className="text-sm text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>{selectedRecord["ENCARGADO_COMPROBANTE"] || ""}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>Fecha emisión:</p>
                <p className="text-sm text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>{fmtDateOnly(selectedRecord["DATE(FECHA_EMISION)"]) || ""}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>N° proforma/acta:</p>
                <p className="text-sm text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>{selectedRecord["NUMERO_PROFORMA"] || ""}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>N° comprobante:</p>
                <p className="text-sm text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>{selectedRecord["NUMERO_COMPROBANTE"] || ""}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>Responsable:</p>
                <p className="text-sm text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>{selectedRecord["RESPONSABLE_INCIDENCIA"] || ""}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>Área:</p>
                <p className="text-sm text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>{selectedRecord["AREA"] || ""}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>Tipo de incidencia:</p>
                <p className="text-sm text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>{selectedRecord["TIPO_INCIDENCIA"] || ""}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>Fecha notificación:</p>
                <p className="text-sm text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>{fmtDateDisplay(selectedRecord["FECHA_NOTIFICACION"]) || ""}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>Solución:</p>
                <p className="text-sm text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>{selectedRecord["SOLUCION"] || ""}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>Revisado por:</p>
                <p className="text-sm text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>{selectedRecord["REVISADO_POR"] || ""}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>Estado verificación:</p>
                <p className="text-sm text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>{selectedRecord["ESTADO_INCIDENCIA"] || ""}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>Fecha envío archivo:</p>
                <p className="text-sm text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>{fmtDateDisplay(selectedRecord["FECHA_ENVIO_ARCHIVO"] || "") || ""}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>Culminado:</p>
                <p className="text-sm text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>{selectedRecord["CULMINADO"] || "NO"}</p>
              </div>
            </div>
          )}

          {erroresSoluciones && erroresSoluciones.length > 0 ? (
            <div className="mt-4">
              <h4 className="text-sm font-bold text-gray-900 mb-3" style={{ fontFamily: 'var(--font-poppins)' }}>
                DETALLES DE ERRORES Y SOLUCIONES:
              </h4>
              <ul className="space-y-3">
                {erroresSoluciones.map((item, i) => (
                  <li key={i} className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 rounded">
                    <p className="text-sm font-bold text-red-600 mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>
                      Error {i + 1}: {item["ERROR_"] || ""}
                    </p>
                    <p className="text-sm text-blue-700" style={{ fontFamily: 'var(--font-poppins)' }}>
                      Solución {i + 1}: {item["SOLUCION"] || ""}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-gray-500 text-sm" style={{ fontFamily: 'var(--font-poppins)' }}>
              No hay errores y soluciones registrados para esta incidencia.
            </p>
          )}
        </div>
      </Modal>

      {/* Modal de Procedimiento */}
      <Modal
        isOpen={modalProcedimientoAbierto}
        onClose={() => setModalProcedimientoAbierto(false)}
        title="Procedimiento - Incidencias de Proformas y Actas"
        size="xl"
        primaryButtonText="Cerrar"
        onPrimaryButtonClick={() => setModalProcedimientoAbierto(false)}
      >
        <div className="space-y-5">
          {/* Instrucciones generales */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-4 shadow-sm">
            <h4 className="text-sm font-bold text-gray-900 mb-2">Instrucciones generales</h4>
            <p className="text-sm text-gray-700">
              Esta pantalla concentra todas las incidencias asociadas a proformas y actas
              de facturación. Aquí se controla el flujo completo: registro de la
              incidencia, revisión, envío de archivo de solución y cierre final.
            </p>
          </div>

          {/* Uso de filtros */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-4 shadow-sm">
            <h4 className="text-sm font-bold text-gray-900 mb-2">Uso de filtros</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
              <li>
                <strong>Filtrar por verificación:</strong> permite ver solo incidencias
                notificadas, pendientes o corregidas.
              </li>
              <li>
                <strong>Desde / Hasta:</strong> delimita el rango de fechas de
                notificación o registro que desea revisar.
              </li>
              <li>
                <strong>Aplicar filtros:</strong> ejecuta la búsqueda;{" "}
                <strong>Limpiar</strong> restablece la vista completa.
              </li>
            </ol>
          </div>

          {/* Cómo leer la tabla */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-4 shadow-sm">
            <h4 className="text-sm font-bold text-gray-900 mb-2">
              Cómo leer la tabla de incidencias
            </h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li>
                <strong>Bloque izquierdo:</strong> identifica el registro (ID, fecha,
                usuario, mes, encargado, proforma y comprobante).
              </li>
              <li>
                <strong>Ítems de error:</strong> el icono de ojo y el texto "PDF" indican
                que hay detalle y documento asociado al error.
              </li>
              <li>
                <strong>Bloque central:</strong> muestra la solución propuesta, quién
                revisó y el estado de verificación.
              </li>
              <li>
                <strong>Bloque derecho:</strong> concentra archivo de solución, estado de
                la solución, datos del comprobante y si la incidencia está culminada.
              </li>
            </ul>
          </div>

          {/* Flujo recomendado */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-4 shadow-sm">
            <h4 className="text-sm font-bold text-gray-900 mb-2">
              Flujo recomendado de trabajo
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
              <li>Revisar nuevas incidencias en orden de fecha de registro.</li>
              <li>Confirmar el detalle del error en "Ítems de error".</li>
              <li>Registrar la solución (ACTA, MODIFICADO, UNA COMPRA, etc.).</li>
              <li>
                Adjuntar y enviar el archivo de solución, registrando la fecha de envío.
              </li>
              <li>
                Una vez corregido el comprobante, marcar la solución como{" "}
                <strong>culminada</strong> y registrar la fecha concluyente.
              </li>
            </ol>
          </div>

          {/* Notas y buenas prácticas */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-4 shadow-sm">
            <h4 className="text-sm font-bold text-gray-900 mb-2">
              Notas y buenas prácticas
            </h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li>
                Mantenga siempre actualizado el estado de verificación y solución para
                evitar reprocesos.
              </li>
              <li>
                Verifique que los números de proforma, acta y comprobante coincidan con
                los documentos físicos.
              </li>
              <li>
                Use el estado <strong>"NO"</strong> en Culminado solo como tránsito; lo
                ideal es cerrar todas las incidencias con un{" "}
                <strong>"SI" y fecha concluyente</strong>.
              </li>
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  );
}


