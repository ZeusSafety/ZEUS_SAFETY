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
        className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none text-sm bg-white disabled:bg-gray-100 disabled:cursor-not-allowed text-left flex items-center justify-between transition-all ${isOpen
          ? 'border-blue-500 shadow-md'
          : 'border-gray-300 hover:border-blue-300'
          } ${disabled ? 'border-gray-200' : ''}`}
      >
        <span className={`${selectedOption ? "text-gray-900 font-medium" : "text-gray-500"} whitespace-nowrap overflow-hidden text-ellipsis uppercase`}>
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

    // Validar que al menos un item de error tenga ambos campos completos
    const itemsConDatos = itemsError.filter(item => item.detalle.trim() && item.debeSer.trim());
    if (itemsConDatos.length === 0) {
      alert("Por favor ingrese al menos un item de error completo (tanto el detalle como la solución)");
      return;
    }

    try {
      const token = localStorage.getItem("token") || "";
      if (!token) {
        alert("Error de autenticación. Inicie sesión.");
        return;
      }

      // Preparar el array de detalle con el formato correcto
      const detalle = itemsConDatos.map(item => ({
        error: item.detalle.trim(),
        solucion: item.debeSer.trim()
      }));

      // Preparar los datos según el formato del endpoint
      const data = {
        fecha_emision: fechaEmision,
        encargado_comprobante: encargadoComprobante,
        responsable_incidencia: responsableIncidencia === "OTROS" ? responsableIncidenciaOtros.trim() : responsableIncidencia,
        area: area.toUpperCase(),
        numero_proforma: numeroProforma.trim(),
        numero_comprobante: numeroComprobante.trim(),
        tipo_incidencia: tipoIncidencia,
        observacion: tipoIncidencia === "OTROS" ? observacionDetallada.trim() : "",
        registrado_por: registradoPor === "OTROS" ? registradoPorOtros.trim() : registradoPor,
        detalle: detalle
      };

      // Llamada al endpoint a través de la ruta API local (proxy)
      const response = await fetch("/api/incidencias-proformas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      // Verificar si la respuesta es exitosa
      if (!response.ok) {
        // Si el token está caducado (401), redirigir al login
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          sessionStorage.removeItem("token");
          router.push("/login");
          throw new Error("Token expirado. Por favor, inicie sesión nuevamente.");
        }

        const errorData = await response.json().catch(() => ({ error: "Error desconocido" }));
        throw new Error(errorData.error || errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Mostrar mensaje de éxito
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

      // Recargar lista de incidencias
      cargarIncidencias();
    } catch (error) {
      console.error("Error al guardar incidencia:", error);
      alert(`Error al guardar la incidencia: ${error.message}`);
    }
  };

  // Función para mapear los nombres de meses
  const getNombreMes = (numeroMes) => {
    const meses = [
      "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
      "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
    ];
    return meses[numeroMes - 1] || numeroMes;
  };

  // Función para mapear campos de la API a campos de la tabla
  const mapearIncidencia = (incidencia) => {
    return {
      id: incidencia.ID,
      fecha_registro: incidencia.FECHA_REGISTRO ? incidencia.FECHA_REGISTRO.split(' ')[0] : null,
      registrado_por: incidencia.REGISTRADO_POR,
      mes: getNombreMes(incidencia.MES_EMISION),
      encargado_comprobante: incidencia.ENCARGADO_COMPROBANTE,
      fecha_emision: incidencia.FECHA_EMISION_CORTO,
      numero_proforma: incidencia.NUMERO_PROFORMA,
      numero_comprobante: incidencia.NUMERO_COMPROBANTE,
      responsable: incidencia.RESPONSABLE_INCIDENCIA,
      area: incidencia.AREA,
      tipo_incidencia: incidencia.TIPO_INCIDENCIA,
      fecha_notificacion: incidencia.FECHA_NOTIFICACION ? incidencia.FECHA_NOTIFICACION.split(' ')[0] : null,
      solucion: incidencia.SOLUCION,
      obs_adicionales: incidencia.OBSERVACION_ADICIONAL_CORRECION,
      revisado_por: incidencia.REVISADO_POR,
      estado_verificacion: incidencia.ESTADO_INCIDENCIA,
      fecha_envio_archivo: incidencia.FECHA_ENVIO_ARCHIVO ? incidencia.FECHA_ENVIO_ARCHIVO.split(' ')[0] : null,
      archivo_solucion: incidencia.ARCHIVO_SOLUCION_PDF,
      comentario_solucion: incidencia.TEXTO_SOLUCION_PDF,
      culminado: incidencia.CULMINADO,
      fecha_concluyente: incidencia.FECHA_CONCLUYENTE ? incidencia.FECHA_CONCLUYENTE.split(' ')[0] : null,
      // Guardar el ID original para cargar items de error
      id_original: incidencia.ID
    };
  };

  // Cargar incidencias
  const cargarIncidencias = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      if (!token) {
        console.error("No se encontró token de autenticación");
        return;
      }

      const response = await fetch("/api/incidencias-proformas?tipo=registro", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          sessionStorage.removeItem("token");
          router.push("/login");
          return;
        }
        const errorData = await response.json().catch(() => ({ error: "Error desconocido" }));
        throw new Error(errorData.error || errorData.message || `Error ${response.status}`);
      }

      const data = await response.json();
      
      // Mapear las incidencias al formato de la tabla
      const incidenciasMapeadas = Array.isArray(data) ? data.map(mapearIncidencia) : [];
      setIncidencias(incidenciasMapeadas);
    } catch (error) {
      console.error("Error al cargar incidencias:", error);
      alert(`Error al cargar incidencias: ${error.message}`);
    }
  };

  // Cargar incidencias al montar el componente
  useEffect(() => {
    if (user && !loading) {
      cargarIncidencias();
    }
  }, [user, loading]);

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

  // Cargar items de error desde el API
  const cargarItemsError = async (idIncidencia) => {
    try {
      const token = localStorage.getItem("token") || "";
      if (!token) {
        alert("Error de autenticación. Inicie sesión.");
        return null;
      }

      const response = await fetch(`/api/incidencias-proformas?tipo=error_solucion&id=${idIncidencia}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          sessionStorage.removeItem("token");
          router.push("/login");
          return null;
        }
        const errorData = await response.json().catch(() => ({ error: "Error desconocido" }));
        throw new Error(errorData.error || errorData.message || `Error ${response.status}`);
      }

      const data = await response.json();
      
      // Mapear los items al formato del modal
      const itemsMapeados = Array.isArray(data) ? data.map(item => ({
        detalle: item.ERROR_ || "",
        debeSer: item.SOLUCION || ""
      })) : [];
      
      return itemsMapeados;
    } catch (error) {
      console.error("Error al cargar items de error:", error);
      alert(`Error al cargar items de error: ${error.message}`);
      return null;
    }
  };

  // Abrir modal de items de error
  const handleVerItemsError = async (idIncidencia) => {
    setModalItemsError(true);
    setModalItemsErrorData([]); // Limpiar datos previos
    
    // Mostrar loading
    const items = await cargarItemsError(idIncidencia);
    if (items) {
      setModalItemsErrorData(items);
    } else {
      setModalItemsError(false);
    }
  };

  // Generar PDF de items de error
  const handleGenerarPDFItems = async (idIncidencia) => {
    // Cargar items desde el API
    const items = await cargarItemsError(idIncidencia);
    
    if (!items || items.length === 0) {
      alert("No hay items de error para generar el PDF");
      return;
    }

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
        
        // Verificar si necesitamos una nueva página
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
      });

      doc.save(`Items_Error_${idIncidencia}.pdf`);
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
      if (!token) {
        alert("Error de autenticación. Inicie sesión.");
        return;
      }

      const idIncidencia = modalArchivoSolucionData.id_original || modalArchivoSolucionData.id;

      // Guardar comentario de solución si existe
      if (comentarioSolucion.trim()) {
        const responseTexto = await fetch(`/api/incidencias-proformas?metodo=solucion_texto`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            id: idIncidencia,
            texto_solucion_pdf: comentarioSolucion.trim()
          })
        });

        if (!responseTexto.ok) {
          if (responseTexto.status === 401 || responseTexto.status === 403) {
            localStorage.removeItem("token");
            sessionStorage.removeItem("token");
            router.push("/login");
            return;
          }
          const errorData = await responseTexto.json().catch(() => ({ error: "Error desconocido" }));
          throw new Error(errorData.error || errorData.message || `Error ${responseTexto.status}`);
        }
      }

      // Subir archivo si existe
      if (archivoSolucion) {
        // Primero subir el archivo a la API de almacenamiento
        const formData = new FormData();
        formData.append('file', archivoSolucion);

        const uploadResponse = await fetch(
          `https://api-subida-archivos-2946605267.us-central1.run.app?bucket_name=archivos_sistema&folder_bucket=incidencias&method=no_encriptar`,
          {
            method: 'POST',
            body: formData,
          }
        );

        if (!uploadResponse.ok) {
          throw new Error(`Error al subir el archivo: ${uploadResponse.status}`);
        }

        const uploadData = await uploadResponse.json();
        const archivoUrl = uploadData.url;

        if (!archivoUrl) {
          throw new Error("La API no devolvió la URL del archivo");
        }

        // Guardar la URL del archivo en la base de datos
        const responseArchivo = await fetch(`/api/incidencias-proformas?metodo=solucion_pdf`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            id: idIncidencia,
            archivo_solucion_pdf: archivoUrl
          })
        });

        if (!responseArchivo.ok) {
          if (responseArchivo.status === 401 || responseArchivo.status === 403) {
            localStorage.removeItem("token");
            sessionStorage.removeItem("token");
            router.push("/login");
            return;
          }
          const errorData = await responseArchivo.json().catch(() => ({ error: "Error desconocido" }));
          throw new Error(errorData.error || errorData.message || `Error ${responseArchivo.status}`);
        }
      }

      alert("Archivo de solución guardado exitosamente");
      setModalArchivoSolucion(false);
      setComentarioSolucion("");
      setArchivoSolucion(null);
      
      // Recargar incidencias
      cargarIncidencias();
    } catch (error) {
      console.error("Error al guardar archivo:", error);
      alert(`Error al guardar el archivo de solución: ${error.message}`);
    }
  };

  // Quitar archivo
  const handleQuitarArchivo = () => {
    setArchivoSolucion(null);
  };

  // Abrir archivo
  const handleAbrirArchivo = (incidencia) => {
    if (incidencia && incidencia.archivo_solucion) {
      // Abrir la URL del archivo en una nueva pestaña
      window.open(incidencia.archivo_solucion, "_blank");
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
      "Revisado Por", "Estado Verificación", "Fecha Envio Archivo", "Culminado","Fecha Concluyente"
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
      inc.culminado || "",
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
        inc.culminado || "-",
        inc.fecha_concluyente || "-"
      ]);

      const headers = [
        "ID", "Fecha Registro", "Registrado Por", "Mes", "Encargado Comprobante",
        "Fecha Emisión", "N° Proforma/Acta", "N° Comprobante", "Responsable",
        "Área", "Tipo Incidencia", "Fecha Notificación", "Solución",
        "Revisado Por", "Estado Verificación", "Fecha Envio Archivo", "Culminado", "Fecha Concluyente"
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
        return "bg-green-200 text-green-800";
      case "NOTIFICADO":
        return "bg-blue-200 text-blue-800";
      case "MODIFICADO":
        return "bg-gray-600 text-white";
      case "PENDIENTE":
        return "bg-yellow-200 text-yellow-800";
      default:
        return "bg-gray-200 text-gray-800";
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
                className="flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] text-white rounded-lg font-semibold hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm ripple-effect relative overflow-hidden text-sm group"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                <span>Volver</span>
              </button>
            </div>

            {/* Contenedor General */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-2 lg:p-2.5 max-w-[96rem] mx-auto">
              {/* Título */}
              <div className="mb-4 pb-4 border-b border-gray-300 mt-4">
                <h1 className="text-xl font-bold text-gray-900">Registrar una nueva incidencia</h1>
              </div>

              {/* Formulario */}
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Encargado Comprobante</label>
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
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Fecha de Emisión</label>
                    <input
                      type="date"
                      value={fechaEmision}
                      onChange={(e) => setFechaEmision(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Responsable Incidencia</label>
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
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Área</label>
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
                    <label className="block text-sm font-semibold text-gray-900 mb-2">N° de Proforma o acta</label>
                    <input
                      type="text"
                      value={numeroProforma}
                      onChange={(e) => setNumeroProforma(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                      placeholder="Ingrese número de proforma o acta"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">N° de comprobante</label>
                    <input
                      type="text"
                      value={numeroComprobante}
                      onChange={(e) => setNumeroComprobante(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                      placeholder="Ingrese número de comprobante"
                    />
                  </div>
                </div>

                {/* Items de Error */}
                <div className="border-t border-gray-300 pt-4">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Item de error (Detalle / debe ser)</h3>
                  {itemsError.map((item, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Detalle</label>
                        <input
                          type="text"
                          value={item.detalle}
                          onChange={(e) => handleUpdateItem(index, "detalle", e.target.value)}
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                          placeholder="Detalle del error"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Debe Ser</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={item.debeSer}
                            onChange={(e) => handleUpdateItem(index, "debeSer", e.target.value)}
                            className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                            placeholder="Cómo debería ser"
                          />
                          {itemsError.length > 1 && (
                            <button
                              onClick={() => handleEliminarItem(index)}
                              className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
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
                    className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Agregar Item
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Tipo incidencia</label>
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
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Observación detallada</label>
                        <textarea
                          value={observacionDetallada}
                          onChange={(e) => setObservacionDetallada(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                          placeholder="Ingrese observación detallada"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Registrado Por</label>
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
                    className="px-6 py-2 bg-green-500 hover:bg-green-300 text-white rounded-lg font-bold text-sm transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
>
                    Guardar Incidencia
                  </button>
                </div>
              </div>

              {/* Separador */}
              <div className="border-t-2 border-gray-300 my-6"></div>

              {/* Listado de Incidencias */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Listado de Incidencias</h2>

                {/* Filtros */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Filtro por verificación</label>
                      <CompactSelect
                        value={filtroVerificacion}
                        onChange={(e) => setFiltroVerificacion(e.target.value)}
                        placeholder="Seleccione estado"
                        options={[
                          { value: "TODOS", label: "TODOS" },
                          { value: "PENDIENTE", label: "PENDIENTE" },
                          { value: "COMPLETADO", label: "COMPLETADO" },
                          { value: "NOTIFICADO", label: "NOTIFICADO" },
                          { value: "MODIFICADO", label: "MODIFICADO" }
                        ]}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Fecha desde</label>
                      <input
                        type="date"
                        value={filtroFechaDesde}
                        onChange={(e) => setFiltroFechaDesde(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Fecha hasta</label>
                      <input
                        type="date"
                        value={filtroFechaHasta}
                        onChange={(e) => setFiltroFechaHasta(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
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
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md text-sm"
                  >
                    Aplicar filtros
                  </button>
                  <button
                    onClick={handleLimpiarFiltros}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md text-sm"
                  >
                    Limpiar
                  </button>

                  <button
                    onClick={handleExportarCSV}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md text-sm flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Exportar CSV
                  </button>
                  <button
                    onClick={handleGenerarReporte}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md text-sm flex items-center gap-2"
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
                        <tr className="bg-blue-700 border-b-2 border-blue-800">
                          <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ID</th>
                          <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Fecha Registro</th>
                          <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Registrado Por</th>
                          <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Mes</th>
                          <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Encargado Comprobante</th>
                          <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Fecha Emisión</th>
                          <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">N° Proforma/Acta</th>
                          <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">N° Comprobante</th>
                          <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Item de error</th>
                          <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Responsable</th>
                          <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Área</th>
                          <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Tipo Incidencia</th>
                          <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Fecha Notificación</th>
                          <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Solución</th>
                          <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Obs. adicionales</th>
                          <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Revisado Por</th>
                          <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Estado Verificación</th>
                          <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Fecha Envio Archivo</th>
                          <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Archivo Solución</th>
                          <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Culminado</th>
                          <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Fecha Concluyente</th>
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
                            <tr key={incidencia.id} className="hover:bg-slate-200 transition-colors">
                              <td className="px-3 py-2.5 whitespace-nowrap text-[11px] font-medium text-gray-900">{incidencia.id}</td>
                              <td className="px-3 py-2.5 whitespace-nowrap text-[11px] text-gray-700">{formatFecha(incidencia.fecha_registro)}</td>
                              <td className="px-3 py-2.5 whitespace-nowrap text-[11px] text-gray-700">{incidencia.registrado_por}</td>
                              <td className="px-3 py-2.5 whitespace-nowrap text-[11px] text-gray-700">{incidencia.mes}</td>
                              <td className="px-3 py-2.5 whitespace-nowrap text-[11px] text-gray-700">{incidencia.encargado_comprobante}</td>
                              <td className="px-3 py-2.5 whitespace-nowrap text-[11px] text-gray-700">{formatFecha(incidencia.fecha_emision)}</td>
                              <td className="px-3 py-2.5 whitespace-nowrap text-[11px] text-gray-700">{incidencia.numero_proforma}</td>
                              <td className="px-3 py-2.5 whitespace-nowrap text-[11px] text-gray-700">{incidencia.numero_comprobante}</td>
                              <td className="px-3 py-2.5 whitespace-nowrap text-[11px] text-gray-700">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleVerItemsError(incidencia.id_original || incidencia.id)}
                                    className="p-1 text-blue-600 hover:text-blue-800"
                                    title="Ver items de error"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleGenerarPDFItems(incidencia.id_original || incidencia.id)}
                                    className="p-1 text-red-600 hover:text-red-800"
                                    title="Generar PDF"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                              <td className="px-3 py-2.5 whitespace-nowrap text-[11px] text-gray-700">{incidencia.responsable}</td>
                              <td className="px-3 py-2.5 whitespace-nowrap text-[11px] text-gray-700">{incidencia.area}</td>
                              <td className="px-3 py-2.5 whitespace-nowrap text-[11px] text-gray-700">{incidencia.tipo_incidencia}</td>
                              <td className="px-3 py-2.5 whitespace-nowrap text-[11px] text-gray-700">{formatFecha(incidencia.fecha_notificacion)}</td>
                              <td className="px-3 py-2.5 whitespace-nowrap text-[11px] text-gray-700">{incidencia.solucion || "-"}</td>
                              <td className="px-3 py-2.5 whitespace-nowrap text-[11px] text-gray-700">
                                {incidencia.obs_adicionales ? (
                                  <button
                                    onClick={() => handleVerObsAdicionales(incidencia.obs_adicionales)}
                                    className="p-1 text-blue-600 hover:text-blue-800"
                                    title="Ver observaciones adicionales"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                  </button>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="px-3 py-2.5 whitespace-nowrap text-[11px] text-gray-700">{incidencia.revisado_por || "-"}</td>
                              <td className="px-3 py-2.5 whitespace-nowrap text-[11px] text-gray-700">
                                <span className={`px-2 py-1 rounded text-[10px] font-semibold ${getEstadoColor(incidencia.estado_verificacion)}`}>
                                  {incidencia.estado_verificacion || "-"}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 whitespace-nowrap text-[11px] text-gray-700">{formatFecha(incidencia.fecha_envio_archivo)}</td>
                              <td className="px-3 py-2.5 whitespace-nowrap text-[11px] text-gray-700">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleEditarArchivoSolucion(incidencia)}
                                    className="p-1 text-blue-600 hover:text-blue-800"
                                    title="Editar archivo solución"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  {incidencia.archivo_solucion && (
                                    <>
                                      <button
                                        onClick={() => handleAbrirArchivo(incidencia)}
                                        className="p-1 text-red-600 hover:text-red-800"
                                        title="Abrir archivo PDF"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                      </button>
                                      {incidencia.comentario_solucion && (
                                        <button
                                          onClick={() => handleVerComentarioSolucion(incidencia.comentario_solucion)}
                                          className="p-1 text-green-600 hover:text-green-800"
                                          title="Ver comentario"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                          </svg>
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-2.5 whitespace-nowrap text-[11px] text-gray-700">{incidencia.culminado}</td>
                              <td className="px-3 py-2.5 whitespace-nowrap text-[11px] text-gray-700">{formatFecha(incidencia.fecha_concluyente)}</td>
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
              Guardar
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

