"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/context/AuthContext";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";
import Modal from "../../../components/ui/Modal";

// Componente de Select personalizado con dropdown compacto
const CompactSelect = ({ value, onChange, options, placeholder, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const selectRef = useRef(null);
  const buttonRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value);

  const handleSelect = (optionValue) => {
    if (disabled) return;
    onChange({ target: { value: optionValue } });
    setIsOpen(false);
  };

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = 180;
      setOpenUpward(spaceAbove > spaceBelow && spaceBelow < dropdownHeight);
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={selectRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white disabled:bg-gray-100 disabled:cursor-not-allowed text-left flex items-center justify-between transition-all duration-200 hover:border-blue-300 placeholder:text-gray-400 ${isOpen
          ? 'border-blue-500 shadow-md'
          : ''
          } ${disabled ? 'border-gray-200' : ''}`}
        style={{ fontFamily: 'var(--font-poppins)' }}
      >
        <span className={`${selectedOption ? "text-gray-900 font-semibold" : "text-gray-400"} whitespace-nowrap overflow-hidden text-ellipsis uppercase`} style={{ fontFamily: 'var(--font-poppins)' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ml-2 ${isOpen ? 'transform rotate-180' : ''
            }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div
          className={`absolute z-50 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-xl overflow-hidden ${openUpward ? 'bottom-full mb-1' : 'top-full'
            }`}
          style={{ maxHeight: '200px', overflowY: 'auto' }}
        >
          {options.map((option, index) => (
            <button
              key={option.value || index}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`w-full px-3 py-2.5 text-sm text-left transition-colors border-b border-gray-100 last:border-b-0 ${value === option.value
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-gray-900 hover:bg-blue-50'
                } ${index === 0 && !option.value ? 'text-gray-500 italic' : ''}`}
            >
              <span className={value === option.value ? 'uppercase' : ''}>
                {option.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default function IncidenciasPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Estados del formulario
  const [encargadoComprobante, setEncargadoComprobante] = useState("");
  const [fechaEmision, setFechaEmision] = useState("");
  const [responsableIncidencia, setResponsableIncidencia] = useState("");
  const [responsableIncidenciaOtros, setResponsableIncidenciaOtros] = useState("");
  const [area, setArea] = useState("");
  const [numeroProforma, setNumeroProforma] = useState("");
  const [numeroComprobante, setNumeroComprobante] = useState("");
  const [itemsError, setItemsError] = useState([{ detalle: "", debeSer: "" }]);
  const [tipoIncidencia, setTipoIncidencia] = useState("");
  const [observacionDetallada, setObservacionDetallada] = useState("");
  const [registradoPor, setRegistradoPor] = useState("");
  const [registradoPorOtros, setRegistradoPorOtros] = useState("");

  // Estados de la tabla
  const [incidencias, setIncidencias] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Estados de filtros
  const [filtroVerificacion, setFiltroVerificacion] = useState("TODOS");
  const [filtroFechaDesde, setFiltroFechaDesde] = useState("");
  const [filtroFechaHasta, setFiltroFechaHasta] = useState("");

  // Estados de modales
  const [modalItemsError, setModalItemsError] = useState(false);
  const [modalItemsErrorData, setModalItemsErrorData] = useState([]);
  const [modalObsAdicionales, setModalObsAdicionales] = useState(false);
  const [modalObsAdicionalesData, setModalObsAdicionalesData] = useState("");
  const [modalArchivoSolucion, setModalArchivoSolucion] = useState(false);
  const [modalArchivoSolucionData, setModalArchivoSolucionData] = useState(null);
  const [comentarioSolucion, setComentarioSolucion] = useState("");
  const [archivoSolucion, setArchivoSolucion] = useState(null);

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

  // Función para obtener fecha actual en formato yyyy-mm-dd
  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Agregar item de error
  const handleAgregarItem = () => {
    setItemsError([...itemsError, { detalle: "", debeSer: "" }]);
  };

  // Eliminar item de error
  const handleEliminarItem = (index) => {
    if (itemsError.length > 1) {
      setItemsError(itemsError.filter((_, i) => i !== index));
    }
  };

  // Actualizar item de error
  const handleUpdateItem = (index, field, value) => {
    const nuevosItems = [...itemsError];
    nuevosItems[index][field] = value;
    setItemsError(nuevosItems);
  };

  // Guardar incidencia
  const handleGuardarIncidencia = async () => {
    // Validaciones básicas
    if (!encargadoComprobante || !fechaEmision || !responsableIncidencia || !area || !tipoIncidencia || !registradoPor) {
      alert("Por favor complete todos los campos obligatorios");
      return;
    }

    if (responsableIncidencia === "OTROS" && !responsableIncidenciaOtros.trim()) {
      alert("Por favor ingrese el nombre del responsable de la incidencia");
      return;
    }

    if (registradoPor === "OTROS" && !registradoPorOtros.trim()) {
      alert("Por favor ingrese el nombre de quien registra");
      return;
    }

    if (tipoIncidencia === "OTROS" && !observacionDetallada.trim()) {
      alert("Por favor ingrese la observación detallada");
      return;
    }

    // Validar que al menos un item de error tenga datos
    const itemsConDatos = itemsError.filter(item => item.detalle.trim() || item.debeSer.trim());
    if (itemsConDatos.length === 0) {
      alert("Por favor ingrese al menos un item de error");
      return;
    }

    try {
      const token = localStorage.getItem("token") || "";
      if (!token) {
        alert("Error de autenticación. Inicie sesión.");
        return;
      }

      const data = {
        encargado_comprobante: encargadoComprobante,
        fecha_emision: fechaEmision,
        responsable_incidencia: responsableIncidencia === "OTROS" ? responsableIncidenciaOtros : responsableIncidencia,
        area: area,
        numero_proforma: numeroProforma,
        numero_comprobante: numeroComprobante,
        items_error: itemsConDatos,
        tipo_incidencia: tipoIncidencia,
        observacion_detallada: tipoIncidencia === "OTROS" ? observacionDetallada : "",
        registrado_por: registradoPor === "OTROS" ? registradoPorOtros : registradoPor,
      };

      // Aquí iría la llamada a la API
      // const response = await fetch("/api/incidencias", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //     "Authorization": `Bearer ${token}`
      //   },
      //   body: JSON.stringify(data)
      // });

      // Por ahora simulamos el guardado
      alert("Incidencia guardada exitosamente");

      // Limpiar formulario
      setEncargadoComprobante("");
      setFechaEmision("");
      setResponsableIncidencia("");
      setResponsableIncidenciaOtros("");
      setArea("");
      setNumeroProforma("");
      setNumeroComprobante("");
      setItemsError([{ detalle: "", debeSer: "" }]);
      setTipoIncidencia("");
      setObservacionDetallada("");
      setRegistradoPor("");
      setRegistradoPorOtros("");

      // Recargar lista
      // cargarIncidencias();
    } catch (error) {
      console.error("Error al guardar incidencia:", error);
      alert("Error al guardar la incidencia");
    }
  };

  // Cargar incidencias (simulado)
  useEffect(() => {
    // Aquí iría la llamada a la API
    // const cargarIncidencias = async () => {
    //   try {
    //     const token = localStorage.getItem("token") || "";
    //     const response = await fetch("/api/incidencias", {
    //       headers: {
    //         "Authorization": `Bearer ${token}`
    //       }
    //     });
    //     const data = await response.json();
    //     setIncidencias(data);
    //   } catch (error) {
    //     console.error("Error al cargar incidencias:", error);
    //   }
    // };
    // cargarIncidencias();

    // Datos de ejemplo
    setIncidencias([
      {
        id: 1,
        fecha_registro: "2024-01-15",
        registrado_por: "JOSEPH",
        mes: "ENERO",
        encargado_comprobante: "HERVIN",
        fecha_emision: "2024-01-10",
        numero_proforma: "PROF-001",
        numero_comprobante: "COMP-001",
        items_error: [{ detalle: "Error en color", debeSer: "Debe ser azul" }],
        responsable: "KIMBERLY",
        area: "Ventas",
        tipo_incidencia: "ERROR DE COLOR",
        fecha_notificacion: "2024-01-16",
        solucion: "Corregido",
        obs_adicionales: "Observación adicional",
        revisado_por: "MANUEL",
        estado_verificacion: "COMPLETADO",
        fecha_envio_archivo: "2024-01-17",
        archivo_solucion: "archivo.pdf",
        comentario_solucion: "Comentario de solución",
        fecha_concluyente: "2024-01-18"
      }
    ]);
  }, []);

  // Filtrar incidencias
  const incidenciasFiltradas = incidencias.filter(incidencia => {
    // Filtro por verificación
    if (filtroVerificacion !== "TODOS" && incidencia.estado_verificacion !== filtroVerificacion) {
      return false;
    }

    // Filtro por fecha
    if (filtroFechaDesde && incidencia.fecha_registro < filtroFechaDesde) {
      return false;
    }
    if (filtroFechaHasta && incidencia.fecha_registro > filtroFechaHasta) {
      return false;
    }

    return true;
  });

  // Paginación
  const totalPages = Math.ceil(incidenciasFiltradas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const incidenciasPaginadas = incidenciasFiltradas.slice(startIndex, endIndex);

  // Aplicar filtros
  const handleAplicarFiltros = () => {
    setCurrentPage(1);
  };

  // Limpiar filtros
  const handleLimpiarFiltros = () => {
    setFiltroVerificacion("TODOS");
    setFiltroFechaDesde("");
    setFiltroFechaHasta("");
    setCurrentPage(1);
  };

  // Abrir modal de items de error
  const handleVerItemsError = (items) => {
    setModalItemsErrorData(items);
    setModalItemsError(true);
  };

  // Generar PDF de items de error
  const handleGenerarPDFItems = (items) => {
    import("jspdf").then(({ jsPDF }) => {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("Items de Error", 14, 20);

      let y = 30;
      items.forEach((item, index) => {
        doc.setFontSize(12);
        doc.text(`Item ${index + 1}:`, 14, y);
        y += 7;
        doc.setFontSize(10);
        doc.text(`Detalle: ${item.detalle || "-"}`, 20, y);
        y += 7;
        doc.text(`Debe Ser: ${item.debeSer || "-"}`, 20, y);
        y += 10;
      });

      doc.save("Items_Error.pdf");
    });
  };

  // Abrir modal de observaciones adicionales
  const handleVerObsAdicionales = (obs) => {
    setModalObsAdicionalesData(obs);
    setModalObsAdicionales(true);
  };

  // Abrir modal de archivo solución
  const handleEditarArchivoSolucion = (incidencia) => {
    setModalArchivoSolucionData(incidencia);
    setComentarioSolucion(incidencia.comentario_solucion || "");
    setArchivoSolucion(null);
    setModalArchivoSolucion(true);
  };

  // Guardar archivo solución
  const handleGuardarArchivoSolucion = async () => {
    if (!modalArchivoSolucionData) return;

    try {
      const token = localStorage.getItem("token") || "";
      const formData = new FormData();
      formData.append("id_incidencia", modalArchivoSolucionData.id);
      formData.append("comentario_solucion", comentarioSolucion);
      if (archivoSolucion) {
        formData.append("archivo", archivoSolucion);
      }

      // Aquí iría la llamada a la API
      // const response = await fetch("/api/incidencias/archivo-solucion", {
      //   method: "POST",
      //   headers: {
      //     "Authorization": `Bearer ${token}`
      //   },
      //   body: formData
      // });

      alert("Archivo de solución guardado exitosamente");
      setModalArchivoSolucion(false);
      // Recargar incidencias
    } catch (error) {
      console.error("Error al guardar archivo:", error);
      alert("Error al guardar el archivo de solución");
    }
  };

  // Quitar archivo
  const handleQuitarArchivo = () => {
    setArchivoSolucion(null);
  };

  // Abrir archivo
  const handleAbrirArchivo = (incidencia) => {
    if (incidencia.archivo_solucion) {
      // Aquí iría la lógica para abrir el archivo
      window.open(`/api/incidencias/archivo/${incidencia.id}`, "_blank");
    }
  };

  // Ver comentario solución
  const handleVerComentarioSolucion = (comentario) => {
    setModalObsAdicionalesData(comentario);
    setModalObsAdicionales(true);
  };

  // Exportar CSV
  const handleExportarCSV = () => {
    const headers = [
      "ID", "Fecha Registro", "Registrado Por", "Mes", "Encargado Comprobante",
      "Fecha Emisión", "N° Proforma/Acta", "N° Comprobante", "Responsable",
      "Área", "Tipo Incidencia", "Fecha Notificación", "Solución",
      "Revisado Por", "Estado Verificación", "Fecha Envio Archivo", "Fecha Concluyente"
    ];

    const rows = incidenciasFiltradas.map(inc => [
      inc.id || "",
      inc.fecha_registro || "",
      inc.registrado_por || "",
      inc.mes || "",
      inc.encargado_comprobante || "",
      inc.fecha_emision || "",
      inc.numero_proforma || "",
      inc.numero_comprobante || "",
      inc.responsable || "",
      inc.area || "",
      inc.tipo_incidencia || "",
      inc.fecha_notificacion || "",
      inc.solucion || "",
      inc.revisado_por || "",
      inc.estado_verificacion || "",
      inc.fecha_envio_archivo || "",
      inc.fecha_concluyente || ""
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "Incidencias_Logistica.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generar reporte PDF
  const handleGenerarReporte = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF("landscape");
      doc.setFontSize(14);
      doc.text("Reporte de Incidencias - LOGÍSTICA - Zeus Safety", 14, 15);

      const dataExport = incidenciasFiltradas.map(inc => [
        inc.id || "-",
        inc.fecha_registro || "-",
        inc.registrado_por || "-",
        inc.mes || "-",
        inc.encargado_comprobante || "-",
        inc.fecha_emision || "-",
        inc.numero_proforma || "-",
        inc.numero_comprobante || "-",
        inc.responsable || "-",
        inc.area || "-",
        inc.tipo_incidencia || "-",
        inc.fecha_notificacion || "-",
        inc.solucion || "-",
        inc.revisado_por || "-",
        inc.estado_verificacion || "-",
        inc.fecha_envio_archivo || "-",
        inc.fecha_concluyente || "-"
      ]);

      const headers = [
        "ID", "Fecha Registro", "Registrado Por", "Mes", "Encargado Comprobante",
        "Fecha Emisión", "N° Proforma/Acta", "N° Comprobante", "Responsable",
        "Área", "Tipo Incidencia", "Fecha Notificación", "Solución",
        "Revisado Por", "Estado Verificación", "Fecha Envio Archivo", "Fecha Concluyente"
      ];

      autoTable(doc, {
        head: [headers],
        body: dataExport,
        startY: 25,
        theme: "grid",
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [30, 99, 247] }
      });

      doc.save("Reporte_Incidencias_LOGISTICA.pdf");
    } catch (error) {
      console.error("Error al exportar PDF:", error);
      alert("Error al exportar PDF. Asegúrate de tener conexión a internet.");
    }
  };

  // Formatear fecha
  const formatFecha = (fecha) => {
    if (!fecha) return "-";
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return fecha;
    }
  };

  // Obtener color de estado
  const getEstadoColor = (estado) => {
    switch (estado) {
      case "COMPLETADO":
        return "bg-gradient-to-br from-green-600 to-green-700 text-white";
      case "NOTIFICADO":
        return "bg-gradient-to-br from-blue-600 to-blue-700 text-white";
      case "MODIFICADO":
        return "bg-gradient-to-br from-gray-600 to-gray-700 text-white";
      default:
        return "bg-gradient-to-br from-gray-500 to-gray-600 text-white";
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

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F7FAFF' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${sidebarOpen ? "lg:ml-60 ml-0" : "ml-0"
          }`}
      >
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto" style={{ background: '#F7FAFF' }}>
          <div className="p-3 lg:p-4" style={{ paddingBottom: '100px' }}>
            {/* Botón Volver */}
            <div className="mb-4 flex items-start justify-start max-w-[96rem] mx-auto">
              <button
                onClick={() => router.push("/logistica")}
                className="flex items-center space-x-1.5 px-4 py-2.5 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-lg font-semibold hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm text-sm group"
                style={{ fontFamily: 'var(--font-poppins)' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                <span>Volver a Logística</span>
              </button>
            </div>

            {/* Contenedor General */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-2 lg:p-2.5 max-w-[85rem] mx-auto">
              {/* Título con icono y subtítulo */}
              <div className="mb-6 flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] rounded-xl flex items-center justify-center text-white shadow-sm">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>Registrar una nueva incidencia</h1>
                  <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: 'var(--font-poppins)' }}>
                    Gestiona y registra nuevas incidencias de logística
                  </p>
                </div>
              </div>

              {/* Formulario */}
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>Encargado Comprobante</label>
                    <CompactSelect
                      value={encargadoComprobante}
                      onChange={(e) => setEncargadoComprobante(e.target.value)}
                      placeholder="Seleccione encargado"
                      options={[
                        { value: "", label: "Seleccione encargado" },
                        { value: "HERVIN", label: "HERVIN" },
                        { value: "KIMBERLY", label: "KIMBERLY" },
                        { value: "JOSE", label: "JOSE" },
                        { value: "ALVARO", label: "ALVARO" },
                        { value: "EVELYN", label: "EVELYN" },
                        { value: "LIZETH", label: "LIZETH" },
                        { value: "JOSEPH", label: "JOSEPH" },
                        { value: "MANUEL", label: "MANUEL" }
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>Fecha de Emisión</label>
                    <input
                      type="date"
                      value={fechaEmision}
                      onChange={(e) => setFechaEmision(e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white hover:border-blue-300 transition-all duration-200 placeholder:text-gray-400"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>Responsable Incidencia</label>
                    <CompactSelect
                      value={responsableIncidencia}
                      onChange={(e) => setResponsableIncidencia(e.target.value)}
                      placeholder="Seleccione responsable"
                      options={[
                        { value: "", label: "Seleccione responsable" },
                        { value: "HERVIN", label: "HERVIN" },
                        { value: "KIMBERLY", label: "KIMBERLY" },
                        { value: "JOSE", label: "JOSE" },
                        { value: "ALVARO", label: "ALVARO" },
                        { value: "EVELYN", label: "EVELYN" },
                        { value: "LIZETH", label: "LIZETH" },
                        { value: "JOSEPH", label: "JOSEPH" },
                        { value: "MANUEL", label: "MANUEL" },
                        { value: "VICTOR", label: "VICTOR" },
                        { value: "ONLINE", label: "ONLINE" },
                        { value: "OTROS", label: "OTROS" }
                      ]}
                    />
                    {responsableIncidencia === "OTROS" && (
                      <input
                        type="text"
                        value={responsableIncidenciaOtros}
                        onChange={(e) => setResponsableIncidenciaOtros(e.target.value)}
                        placeholder="Ingrese nombre del responsable"
                        className="w-full mt-2 px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>Área</label>
                    <CompactSelect
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      placeholder="Seleccione área"
                      options={[
                        { value: "", label: "Seleccione área" },
                        { value: "Ventas", label: "Ventas" },
                        { value: "Facturación", label: "Facturación" },
                        { value: "Logistica", label: "Logistica" }
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>N° de Proforma o acta</label>
                    <input
                      type="text"
                      value={numeroProforma}
                      onChange={(e) => setNumeroProforma(e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white hover:border-blue-300 transition-all duration-200 placeholder:text-gray-400"
                      placeholder="Ingrese número de proforma o acta"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>N° de comprobante</label>
                    <input
                      type="text"
                      value={numeroComprobante}
                      onChange={(e) => setNumeroComprobante(e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white hover:border-blue-300 transition-all duration-200 placeholder:text-gray-400"
                      placeholder="Ingrese número de comprobante"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                    />
                  </div>
                </div>

                {/* Items de Error */}
                <div className="border-t border-gray-300 pt-4">
                  <h3 className="text-sm font-bold text-gray-900 mb-3" style={{ fontFamily: 'var(--font-poppins)' }}>Item de error (Detalle / debe ser)</h3>
                  {itemsError.map((item, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>Detalle</label>
                        <input
                          type="text"
                          value={item.detalle}
                          onChange={(e) => handleUpdateItem(index, "detalle", e.target.value)}
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white hover:border-blue-300 transition-all duration-200 placeholder:text-gray-400"
                          placeholder="Detalle del error"
                          style={{ fontFamily: 'var(--font-poppins)' }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>Debe Ser</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={item.debeSer}
                            onChange={(e) => handleUpdateItem(index, "debeSer", e.target.value)}
                            className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white hover:border-blue-300 transition-all duration-200 placeholder:text-gray-400"
                            placeholder="Cómo debería ser"
                            style={{ fontFamily: 'var(--font-poppins)' }}
                          />
                          {itemsError.length > 1 && (
                            <button
                              onClick={() => handleEliminarItem(index)}
                              className="px-4 py-2.5 bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                              style={{ fontFamily: 'var(--font-poppins)' }}
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={handleAgregarItem}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md text-sm"
                    style={{ fontFamily: 'var(--font-poppins)' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Agregar Item
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>Tipo incidencia</label>
                    <CompactSelect
                      value={tipoIncidencia}
                      onChange={(e) => setTipoIncidencia(e.target.value)}
                      placeholder="Seleccione tipo"
                      options={[
                        { value: "", label: "Seleccione tipo" },
                        { value: "ERROR DE COLOR", label: "ERROR DE COLOR" },
                        { value: "ERROR DE TALLA", label: "ERROR DE TALLA" },
                        { value: "ERROR DE CANTIDAD", label: "ERROR DE CANTIDAD" },
                        { value: "ERROR DE PRECIO", label: "ERROR DE PRECIO" },
                        { value: "ERROR DE PRODUCTO", label: "ERROR DE PRODUCTO" },
                        { value: "ERROR DE ALMACEN", label: "ERROR DE ALMACEN" },
                        { value: "OTROS", label: "OTROS" }
                      ]}
                    />
                    {tipoIncidencia === "OTROS" && (
                      <div className="mt-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>Observación detallada</label>
                        <textarea
                          value={observacionDetallada}
                          onChange={(e) => setObservacionDetallada(e.target.value)}
                          rows={3}
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white hover:border-blue-300 transition-all duration-200 placeholder:text-gray-400"
                          placeholder="Ingrese observación detallada"
                          style={{ fontFamily: 'var(--font-poppins)' }}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>Registrado Por</label>
                    <CompactSelect
                      value={registradoPor}
                      onChange={(e) => setRegistradoPor(e.target.value)}
                      placeholder="Seleccione registrador"
                      options={[
                        { value: "", label: "Seleccione registrador" },
                        { value: "JOSEPH", label: "JOSEPH" },
                        { value: "MANUEL", label: "MANUEL" },
                        { value: "OTROS", label: "OTROS" }
                      ]}
                    />
                    {registradoPor === "OTROS" && (
                      <input
                        type="text"
                        value={registradoPorOtros}
                        onChange={(e) => setRegistradoPorOtros(e.target.value)}
                        placeholder="Ingrese nombre"
                        className="w-full mt-2 px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                      />
                    )}
                  </div>
                </div>

                {/* Botón Guardar */}
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleGuardarIncidencia}
                    className="px-6 py-2.5 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-semibold text-sm transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
                    style={{ fontFamily: 'var(--font-poppins)' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Guardar Incidencia
                  </button>
                </div>
              </div>

              {/* Separador */}
              <div className="border-t-2 border-gray-300 my-6"></div>

              {/* Listado de Incidencias */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-poppins)' }}>Listado de Incidencias</h2>

                {/* Filtros */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>Filtro por verificación</label>
                      <CompactSelect
                        value={filtroVerificacion}
                        onChange={(e) => setFiltroVerificacion(e.target.value)}
                        placeholder="Seleccione estado"
                        options={[
                          { value: "TODOS", label: "TODOS" },
                          { value: "NOTIFICADO", label: "NOTIFICADO" },
                          { value: "COMPLETADO", label: "COMPLETADO" },
                          { value: "MODIFICADO", label: "MODIFICADO" }
                        ]}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>Fecha desde</label>
                      <input
                        type="date"
                        value={filtroFechaDesde}
                        onChange={(e) => setFiltroFechaDesde(e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white hover:border-blue-300 transition-all duration-200 placeholder:text-gray-400"
                        style={{ fontFamily: 'var(--font-poppins)' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>Fecha hasta</label>
                      <input
                        type="date"
                        value={filtroFechaHasta}
                        onChange={(e) => setFiltroFechaHasta(e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white hover:border-blue-300 transition-all duration-200 placeholder:text-gray-400"
                        style={{ fontFamily: 'var(--font-poppins)' }}
                      />
                    </div>
                    <div className="flex items-end gap-2">

                    </div>
                  </div>
                </div>

                {/* Botones de exportación */}
                <div className="flex gap-2 mb-4">

                  <button
                    onClick={handleAplicarFiltros}
                    className="px-4 py-2.5 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md text-sm"
                    style={{ fontFamily: 'var(--font-poppins)' }}
                  >
                    Aplicar filtros
                  </button>
                  <button
                    onClick={handleLimpiarFiltros}
                    className="px-4 py-2.5 bg-gradient-to-br from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md text-sm"
                    style={{ fontFamily: 'var(--font-poppins)' }}
                  >
                    Limpiar
                  </button>

                  <button
                    onClick={handleExportarCSV}
                    className="px-4 py-2.5 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md text-sm flex items-center gap-2"
                    style={{ fontFamily: 'var(--font-poppins)' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Exportar CSV
                  </button>
                  <button
                    onClick={handleGenerarReporte}
                    className="px-4 py-2.5 bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md text-sm flex items-center gap-2"
                    style={{ fontFamily: 'var(--font-poppins)' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Generar reporte
                  </button>
                </div>

                {/* Tabla */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gradient-to-r from-blue-700 to-blue-800 border-b-2 border-blue-800">
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>ID</th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Fecha Registro</th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Registrado Por</th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Mes</th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Encargado Comprobante</th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Fecha Emisión</th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>N° Proforma/Acta</th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>N° Comprobante</th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Item de error</th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Responsable</th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Área</th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Tipo Incidencia</th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Fecha Notificación</th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Solución</th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Obs. adicionales</th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Revisado Por</th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Estado Verificación</th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Fecha Envio Archivo</th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Archivo Solución</th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Fecha Concluyente</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {incidenciasPaginadas.length === 0 ? (
                          <tr>
                            <td colSpan={19} className="px-3 py-4 text-center text-sm text-gray-500">
                              No hay incidencias registradas
                            </td>
                          </tr>
                        ) : (
                          incidenciasPaginadas.map((incidencia) => (
                            <tr key={incidencia.id} className="hover:bg-blue-50 transition-colors">
                              <td className="px-4 py-3 whitespace-nowrap text-[10px] font-medium text-gray-900 text-center" style={{ fontFamily: 'var(--font-poppins)' }}>{incidencia.id}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700 text-center" style={{ fontFamily: 'var(--font-poppins)' }}>{formatFecha(incidencia.fecha_registro)}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700 text-center" style={{ fontFamily: 'var(--font-poppins)' }}>{incidencia.registrado_por}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700 text-center" style={{ fontFamily: 'var(--font-poppins)' }}>{incidencia.mes}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700 text-center" style={{ fontFamily: 'var(--font-poppins)' }}>{incidencia.encargado_comprobante}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700 text-center" style={{ fontFamily: 'var(--font-poppins)' }}>{formatFecha(incidencia.fecha_emision)}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700 text-center" style={{ fontFamily: 'var(--font-poppins)' }}>{incidencia.numero_proforma}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700 text-center" style={{ fontFamily: 'var(--font-poppins)' }}>{incidencia.numero_comprobante}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => handleVerItemsError(incidencia.items_error)}
                                    className="inline-flex items-center justify-center px-3 py-1.5 bg-gradient-to-br from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                                    title="Ver items de error"
                                    style={{ fontFamily: 'var(--font-poppins)' }}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" style={{ pointerEvents: 'none' }}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                  </button>
                                  {incidencia.items_error && incidencia.items_error.length > 0 && (
                                    <button
                                      onClick={() => handleGenerarPDFItems(incidencia.items_error)}
                                      className="inline-flex items-center justify-center px-3 py-1.5 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                                      title="Generar PDF"
                                      style={{ fontFamily: 'var(--font-poppins)' }}
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" style={{ pointerEvents: 'none' }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700 text-center" style={{ fontFamily: 'var(--font-poppins)' }}>{incidencia.responsable}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700 text-center" style={{ fontFamily: 'var(--font-poppins)' }}>{incidencia.area}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700 text-center" style={{ fontFamily: 'var(--font-poppins)' }}>{incidencia.tipo_incidencia}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700 text-center" style={{ fontFamily: 'var(--font-poppins)' }}>{formatFecha(incidencia.fecha_notificacion)}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700 text-center" style={{ fontFamily: 'var(--font-poppins)' }}>{incidencia.solucion || "-"}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700 text-center">
                                {incidencia.obs_adicionales ? (
                                  <button
                                    onClick={() => handleVerObsAdicionales(incidencia.obs_adicionales)}
                                    className="inline-flex items-center justify-center px-3 py-1.5 bg-gradient-to-br from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                                    title="Ver observaciones adicionales"
                                    style={{ fontFamily: 'var(--font-poppins)' }}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" style={{ pointerEvents: 'none' }}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                  </button>
                                ) : (
                                  <span style={{ fontFamily: 'var(--font-poppins)' }}>-</span>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700 text-center" style={{ fontFamily: 'var(--font-poppins)' }}>{incidencia.revisado_por || "-"}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700 text-center">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold text-white shadow-sm transition-all duration-200 ${getEstadoColor(incidencia.estado_verificacion)}`} style={{ fontFamily: 'var(--font-poppins)' }}>
                                  {incidencia.estado_verificacion || "-"}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700 text-center" style={{ fontFamily: 'var(--font-poppins)' }}>{formatFecha(incidencia.fecha_envio_archivo)}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => handleEditarArchivoSolucion(incidencia)}
                                    className="inline-flex items-center justify-center px-3 py-1.5 bg-gradient-to-br from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                                    title="Editar archivo solución"
                                    style={{ fontFamily: 'var(--font-poppins)' }}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" style={{ pointerEvents: 'none' }}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                    </svg>
                                  </button>
                                  {incidencia.archivo_solucion && (
                                    <>
                                      <button
                                        onClick={() => handleAbrirArchivo(incidencia)}
                                        className="inline-flex items-center justify-center px-3 py-1.5 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                                        title="Abrir archivo PDF"
                                        style={{ fontFamily: 'var(--font-poppins)' }}
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" style={{ pointerEvents: 'none' }}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                        </svg>
                                      </button>
                                      {incidencia.comentario_solucion && (
                                        <button
                                          onClick={() => handleVerComentarioSolucion(incidencia.comentario_solucion)}
                                          className="inline-flex items-center justify-center px-3 py-1.5 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                                          title="Ver comentario"
                                          style={{ fontFamily: 'var(--font-poppins)' }}
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" style={{ pointerEvents: 'none' }}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                          </svg>
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700 text-center" style={{ fontFamily: 'var(--font-poppins)' }}>{formatFecha(incidencia.fecha_concluyente)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Paginación */}
                  {totalPages > 1 && (
                    <div className="bg-slate-200 px-3 py-2 flex items-center justify-between border-t-2 border-slate-300">
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        «
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        &lt;
                      </button>
                      <span className="text-[10px] text-gray-700 font-medium">
                        Página {currentPage} de {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        &gt;
                      </button>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        »
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal Items de Error */}
      <Modal
        isOpen={modalItemsError}
        onClose={() => setModalItemsError(false)}
        title="Items de Error"
        size="lg"
      >
        <div className="space-y-4">
          {modalItemsErrorData.map((item, index) => (
            <div key={index} className="border-b border-gray-200 pb-3">
              <h4 className="font-semibold text-gray-900 mb-2">Item {index + 1}</h4>
              <p className="text-sm text-gray-700 mb-1"><strong>Detalle:</strong> {item.detalle || "-"}</p>
              <p className="text-sm text-gray-700"><strong>Debe Ser:</strong> {item.debeSer || "-"}</p>
            </div>
          ))}
        </div>
      </Modal>

      {/* Modal Observaciones Adicionales */}
      <Modal
        isOpen={modalObsAdicionales}
        onClose={() => setModalObsAdicionales(false)}
        title="Observaciones Adicionales"
        size="md"
      >
        <div className="text-sm text-gray-700 whitespace-pre-wrap">
          {modalObsAdicionalesData || "No hay observaciones adicionales"}
        </div>
      </Modal>

      {/* Modal Archivo Solución */}
      <Modal
        isOpen={modalArchivoSolucion}
        onClose={() => setModalArchivoSolucion(false)}
        title="Archivo Solución"
        size="lg"
        hideFooter={true}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Comentario de Solución</label>
            <textarea
              value={comentarioSolucion}
              onChange={(e) => setComentarioSolucion(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
              placeholder="Ingrese comentario de solución"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Subir Archivo</label>
            <input
              type="file"
              onChange={(e) => setArchivoSolucion(e.target.files[0])}
              accept=".pdf,.doc,.docx"
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
            />
            {archivoSolucion && (
              <p className="mt-2 text-sm text-gray-600">Archivo seleccionado: {archivoSolucion.name}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleGuardarArchivoSolucion}
              className="flex-1 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md text-sm"
            >
              Guardar Archivo
            </button>
            <button
              onClick={() => handleAbrirArchivo(modalArchivoSolucionData)}
              disabled={!modalArchivoSolucionData?.archivo_solucion}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md text-sm"
            >
              Abrir Archivo
            </button>
            <button
              onClick={handleQuitarArchivo}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md text-sm"
            >
              Quitar Archivo
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

