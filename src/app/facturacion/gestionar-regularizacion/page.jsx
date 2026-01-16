"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/context/AuthContext";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";
import Modal from "../../../components/ui/Modal";

export default function GestionarRegularizacionPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [apiConectada, setApiConectada] = useState(true);
  const [busquedaComprobante, setBusquedaComprobante] = useState("");
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const [loadingBusqueda, setLoadingBusqueda] = useState(false);
  const [hasBuscado, setHasBuscado] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState(null);
  const [mesesSeleccionados, setMesesSeleccionados] = useState([]);
  const [ano, setAno] = useState("2025");

  // Datos de la API de regularización
  const [regularizaciones, setRegularizaciones] = useState([]);
  const [regularizacionSeleccionada, setRegularizacionSeleccionada] = useState(null);
  const [detallesRegularizacion, setDetallesRegularizacion] = useState(null);
  const [modalDetallesOpen, setModalDetallesOpen] = useState(false);
  const [loadingDetalles, setLoadingDetalles] = useState(false);
  const [cantidadesRegularizaciones, setCantidadesRegularizaciones] = useState({});
  const [modalActualizarOpen, setModalActualizarOpen] = useState(false);
  const [regularizacionAEditar, setRegularizacionAEditar] = useState(null);
  const [formularioActualizar, setFormularioActualizar] = useState({});
  const [modalMensaje, setModalMensaje] = useState({ open: false, tipo: "success", mensaje: "" });
  const [modalConfirmarEliminar, setModalConfirmarEliminar] = useState({ open: false, regularizacion: null, mensaje: "" });
  const [modalActualizarPrincipalOpen, setModalActualizarPrincipalOpen] = useState(false);
  const [formularioActualizarPrincipal, setFormularioActualizarPrincipal] = useState({});
  const [esRegularizacionPrincipal, setEsRegularizacionPrincipal] = useState(false);

  // Datos de asesores y medios de pago
  const asesores = [
    { id: 9, nombre: "HERVIN" },
    { id: 10, nombre: "KIMBERLY" },
    { id: 15, nombre: "IMPORT ZEUS" },
    { id: 31, nombre: "LIZETH" },
    { id: 32, nombre: "EVELYN" },
    { id: 33, nombre: "JOSEPH" },
    { id: 34, nombre: "SANDRA" },
    { id: 35, nombre: "ALVARO" },
    { id: 36, nombre: "JOSE" },
  ];

  const mediosPago = [
    { id: 1, nombre: "CREDITO" },
    { id: 2, nombre: "BCP" },
    { id: 6, nombre: "YAPE" },
    { id: 8, nombre: "BCP K" },
    { id: 9, nombre: "EFECTIVO" },
    { id: 10, nombre: "TRANSFERENCIA" },
    { id: 11, nombre: "TARJETA" },
    { id: 12, nombre: "PLIN" },
  ];

  const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

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

  // Función para obtener el ID de la regularización
  const obtenerIdRegularizacion = (regularizacion) => {
    if (!regularizacion) {
      console.error("Regularización es null o undefined");
      return null;
    }

    // Intentar obtener el ID de múltiples formas
    let id =
      regularizacion.ID_REGULARIZACION ||
      regularizacion.id_regularizacion ||
      regularizacion.ID_REGULARIZACION_ID ||
      regularizacion.REGULARIZACION_ID ||
      regularizacion.id ||
      regularizacion.ID ||
      regularizacion._id ||
      regularizacion.regularizacion_id ||
      regularizacion.ID_DETALLE || // Para items de búsqueda
      regularizacion.id_detalle ||
      null;

    // Si aún no se encontró, buscar en todos los campos que contengan "id" o "ID"
    if (!id) {
      for (const key in regularizacion) {
        const lowerKey = key.toLowerCase();
        if ((lowerKey.includes('id') || lowerKey.includes('_id')) && regularizacion[key]) {
          const value = regularizacion[key];
          // Si el valor parece un ID (string no vacío o número)
          if (value && (typeof value === 'string' || typeof value === 'number')) {
            id = String(value);
            break;
          }
        }
      }
    }

    // Si no se encontró el ID, loggear el objeto completo para debug
    if (!id) {
      console.error("No se pudo obtener el ID de la regularización. Objeto completo:", regularizacion);
      console.error("Claves disponibles:", Object.keys(regularizacion));
      // Mostrar todos los valores para ayudar a identificar el ID
      console.error("Valores del objeto:", Object.entries(regularizacion).map(([k, v]) => `${k}: ${v}`).join(", "));
    }

    return id;
  };

  // Función para cargar las cantidades de todas las regularizaciones
  const cargarCantidadesRegularizaciones = async (regularizaciones, token) => {
    try {
      const cantidadesPromesas = regularizaciones.map(async (regularizacion) => {
        const id = obtenerIdRegularizacion(regularizacion);
        if (!id) return null;

        try {
          const apiUrl = `https://api-regularizazcion-zeus-2946605267.us-central1.run.app?area=regularizacion&id=${encodeURIComponent(id)}`;

          const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            return null;
          }

          const contentType = response.headers.get("content-type");
          let data;
          if (contentType && contentType.includes("application/json")) {
            data = await response.json();
          } else {
            const text = await response.text();
            try {
              data = JSON.parse(text);
            } catch {
              return null;
            }
          }

          const items = Array.isArray(data) ? data : data?.detalles || data?.data || [data];
          const cantidad = items.length;

          return { id, cantidad };
        } catch (error) {
          console.error(`Error cargando cantidad para ${id}:`, error);
          return null;
        }
      });

      const resultados = await Promise.all(cantidadesPromesas);
      const nuevasCantidades = {};

      resultados.forEach((resultado) => {
        if (resultado) {
          nuevasCantidades[resultado.id] = resultado.cantidad;
        }
      });

      setCantidadesRegularizaciones((prev) => ({
        ...prev,
        ...nuevasCantidades,
      }));
    } catch (error) {
      console.error("Error cargando cantidades:", error);
    }
  };

  // Cargar listado de regularizaciones desde la API externa protegida con token
  useEffect(() => {
    const fetchRegularizaciones = async () => {
      try {
        // Solo en cliente
        if (typeof window === "undefined") return;

        const token = localStorage.getItem("token");
        if (!token || token.trim() === "") {
          console.warn("No se encontró token para regularizaciones");
          setApiConectada(false);
          return;
        }

        const apiUrl =
          "https://api-regularizazcion-zeus-2946605267.us-central1.run.app?area=regularizacion";

        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("Regularizacion API status:", response.status);

        if (!response.ok) {
          // Si el token es inválido/redirigimos al login igual que en otros módulos
          if (response.status === 401 || response.status === 403) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            router.push("/login");
            return;
          }

          const errorText = await response.text();
          console.error(
            "Error HTTP al obtener las regularizaciones:",
            response.status,
            errorText || response.statusText
          );
          setRegularizaciones([]);
          setApiConectada(false);
          return;
        }

        const contentType = response.headers.get("content-type");
        let data;
        if (contentType && contentType.includes("application/json")) {
          data = await response.json();
        } else {
          const text = await response.text();
          try {
            data = JSON.parse(text);
          } catch {
            console.error("La respuesta de regularizaciones no es JSON válido");
            setRegularizaciones([]);
            setApiConectada(false);
            return;
          }
        }

        const items = Array.isArray(data)
          ? data
          : data?.regularizaciones || data?.data || [];

        setRegularizaciones(items);
        setApiConectada(true);

        // Cargar cantidades para todas las regularizaciones
        if (items.length > 0) {
          cargarCantidadesRegularizaciones(items, token);
        }
      } catch (error) {
        console.error("Error cargando regularizaciones:", error);
        setRegularizaciones([]);
        setApiConectada(false);
      }
    };

    fetchRegularizaciones();
  }, [router]);

  const handleBuscarComprobante = async () => {
    try {
      if (!busquedaComprobante || busquedaComprobante.trim() === "") {
        setResultadosBusqueda([]);
        setHasBuscado(false);
        setErrorBusqueda(null);
        return;
      }

      if (typeof window === "undefined") return;

      const token = localStorage.getItem("token");
      if (!token || token.trim() === "") {
        console.warn("No se encontró token para búsqueda de regularización");
        return;
      }

      setLoadingBusqueda(true);
      setHasBuscado(true);
      setErrorBusqueda(null);

      const apiUrl = `https://api-regularizazcion-zeus-2946605267.us-central1.run.app?area=busqueda&id=${encodeURIComponent(
        busquedaComprobante.trim()
      )}`;

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Regularizacion BUSQUEDA status:", response.status);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.push("/login");
          return;
        }

        const errorText = await response.text();
        console.error("Error en búsqueda:", response.status, errorText);
        setResultadosBusqueda([]);
        setErrorBusqueda(
          "Error al buscar en la API de regularización. Revisa el backend."
        );
        return;
      }

      const contentType = response.headers.get("content-type");
      let data;
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          console.error("La respuesta de búsqueda no es JSON válido");
          setResultadosBusqueda([]);
          return;
        }
      }

      // Manejar diferentes formatos de respuesta
      let items = [];
      if (Array.isArray(data)) {
        items = data;
      } else if (data?.regularizaciones) {
        items = Array.isArray(data.regularizaciones) ? data.regularizaciones : [data.regularizaciones];
      } else if (data?.data) {
        items = Array.isArray(data.data) ? data.data : [data.data];
      } else if (data && typeof data === 'object') {
        // Si es un objeto único, convertirlo a array
        items = [data];
      }

      console.log("Resultados de búsqueda:", items);
      setResultadosBusqueda(items);
    } catch (error) {
      console.error("Error buscando comprobante:", error);
      setResultadosBusqueda([]);
      setErrorBusqueda(
        "Ocurrió un error al buscar el comprobante. Revisa la consola."
      );
    } finally {
      setLoadingBusqueda(false);
    }
  };

  // Función para cargar detalles de una regularización
  const cargarDetallesRegularizacion = async (regularizacion) => {
    const id = obtenerIdRegularizacion(regularizacion);
    if (!id) {
      console.error("No se pudo obtener el ID de la regularización");
      return;
    }

    try {
      setLoadingDetalles(true);
      setRegularizacionSeleccionada(regularizacion);

      if (typeof window === "undefined") return;

      const token = localStorage.getItem("token");
      if (!token || token.trim() === "") {
        console.warn("No se encontró token para detalles de regularización");
        return;
      }

      const apiUrl = `https://api-regularizazcion-zeus-2946605267.us-central1.run.app?area=regularizacion&id=${encodeURIComponent(id)}`;

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.push("/login");
          return;
        }

        const errorText = await response.text();
        console.error("Error al obtener detalles:", response.status, errorText);
        alert("No se pudieron cargar los detalles de la regularización.");
        return;
      }

      const contentType = response.headers.get("content-type");
      let data;
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          console.error("La respuesta de detalles no es JSON válido");
          alert("La respuesta no es válida.");
          return;
        }
      }

      setDetallesRegularizacion(data);

      // Contar la cantidad de items en los detalles
      const items = Array.isArray(data) ? data : data?.detalles || data?.data || [data];
      const cantidadItems = items.length;

      // Actualizar la cantidad para esta regularización
      setCantidadesRegularizaciones((prev) => ({
        ...prev,
        [id]: cantidadItems,
      }));

      setModalDetallesOpen(true);
    } catch (error) {
      console.error("Error cargando detalles:", error);
      alert("Ocurrió un error al cargar los detalles.");
    } finally {
      setLoadingDetalles(false);
    }
  };

  // Función para exportar a Excel usando el segundo GET API
  const handleExportarExcel = async (regularizacion) => {
    const id = obtenerIdRegularizacion(regularizacion);
    if (!id) {
      console.error("No se pudo obtener el ID de la regularización");
      alert("No se pudo obtener el ID de la regularización para exportar.");
      return;
    }

    try {
      if (typeof window === "undefined") return;

      const token = localStorage.getItem("token");
      if (!token || token.trim() === "") {
        console.warn("No se encontró token para exportar Excel");
        alert("No se encontró token de autenticación.");
        return;
      }

      const apiUrl = `https://api-regularizazcion-zeus-2946605267.us-central1.run.app?area=regularizacion&id=${encodeURIComponent(id)}`;

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.push("/login");
          return;
        }

        const errorText = await response.text();
        console.error("Error al exportar Excel:", response.status, errorText);
        alert("No se pudo generar el archivo Excel.");
        return;
      }

      const contentType = response.headers.get("content-type");
      let data;
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          console.error("La respuesta no es JSON válido");
          alert("La respuesta no es válida.");
          return;
        }
      }

      // Convertir los datos a Excel
      const items = Array.isArray(data) ? data : data?.detalles || data?.data || [data];

      if (!items.length) {
        alert("No hay datos para exportar.");
        return;
      }

      // Generar archivo Excel (.xlsx) usando la librería xlsx (importación dinámica)
      const XLSX = await import("xlsx");
      const worksheet = XLSX.utils.json_to_sheet(items);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Detalles");

      // Generar el archivo Excel
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `regularizacion_${id}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exportando Excel:", error);
      alert("Ocurrió un error al exportar el archivo.");
    }
  };

  // Función para eliminar una regularización (primera tabla - regularización completa)
  const handleEliminarRegularizacion = (regularizacion) => {
    const id = obtenerIdRegularizacion(regularizacion);
    if (!id) {
      setModalMensaje({ open: true, tipo: "error", mensaje: "No se pudo obtener el ID de la regularización para eliminar." });
      return;
    }

    const nombreRegularizacion = regularizacion.NOMBRE ||
      regularizacion.nombre ||
      regularizacion.TITULO ||
      regularizacion.titulo ||
      id;

    setModalConfirmarEliminar({
      open: true,
      regularizacion: regularizacion,
      mensaje: `¿Está seguro que desea eliminar la regularización "${nombreRegularizacion}"?`
    });
  };

  const confirmarEliminarRegularizacion = async () => {
    const regularizacion = modalConfirmarEliminar.regularizacion;
    if (!regularizacion) {
      setModalConfirmarEliminar({ open: false, regularizacion: null, mensaje: "" });
      return;
    }

    const id = obtenerIdRegularizacion(regularizacion);
    if (!id) {
      setModalMensaje({ open: true, tipo: "error", mensaje: "No se pudo obtener el ID de la regularización para eliminar." });
      setModalConfirmarEliminar({ open: false, regularizacion: null, mensaje: "" });
      return;
    }

    try {
      if (typeof window === "undefined") return;

      const token = localStorage.getItem("token");
      if (!token || token.trim() === "") {
        setModalMensaje({ open: true, tipo: "error", mensaje: "No se encontró token de autenticación. Por favor, inicia sesión nuevamente." });
        setModalConfirmarEliminar({ open: false, regularizacion: null, mensaje: "" });
        setTimeout(() => router.push("/login"), 2000);
        return;
      }

      const apiUrl = `https://api-regularizazcion-zeus-2946605267.us-central1.run.app?area=regularizacion&forma=eliminar`;

      // Determinar si es una regularización principal o un detalle
      // Si tiene ID_REGULARIZACION pero no ID_DETALLE, es principal
      const esPrincipal = regularizacion.ID_REGULARIZACION || regularizacion.id_regularizacion;
      const esDetalle = regularizacion.ID_DETALLE || regularizacion.id_detalle || regularizacion.id;

      // Si es una regularización de la tabla principal (no tiene ID_DETALLE), usar id_regularizacion
      const requestBody = (esPrincipal && !esDetalle)
        ? { id_regularizacion: id }
        : { id: id };

      const response = await fetch(apiUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.push("/login");
          return;
        }

        const errorText = await response.text();
        console.error("Error al eliminar:", response.status, errorText);
        setModalConfirmarEliminar({ open: false, regularizacion: null, mensaje: "" });
        setModalMensaje({ open: true, tipo: "error", mensaje: "No se pudo eliminar la regularización." });
        return;
      }

      // Recargar la lista de regularizaciones
      const refreshResponse = await fetch(
        "https://api-regularizazcion-zeus-2946605267.us-central1.run.app?area=regularizacion",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (refreshResponse.ok) {
        const contentType = refreshResponse.headers.get("content-type");
        let data;
        if (contentType && contentType.includes("application/json")) {
          data = await refreshResponse.json();
        } else {
          const text = await refreshResponse.text();
          try {
            data = JSON.parse(text);
          } catch {
            console.error("Error parseando respuesta");
          }
        }

        const items = Array.isArray(data) ? data : data?.regularizaciones || data?.data || [];
        setRegularizaciones(items);

        if (items.length > 0) {
          cargarCantidadesRegularizaciones(items, token);
        }
      }

      setModalConfirmarEliminar({ open: false, regularizacion: null, mensaje: "" });
      setModalMensaje({ open: true, tipo: "success", mensaje: "Regularización eliminada exitosamente." });
    } catch (error) {
      console.error("Error eliminando regularización:", error);
      setModalConfirmarEliminar({ open: false, regularizacion: null, mensaje: "" });
      setModalMensaje({ open: true, tipo: "error", mensaje: "Ocurrió un error al eliminar la regularización." });
    }
  };

  // Función para abrir modal de actualización de regularización principal
  const handleAbrirActualizarPrincipal = (regularizacion) => {
    const id = obtenerIdRegularizacion(regularizacion);
    if (!id) {
      setModalMensaje({ open: true, tipo: "error", mensaje: "No se pudo obtener el ID de la regularización." });
      return;
    }

    // Formatear fecha de YYYY-MM-DD a DD/MM/YYYY si es necesario
    const fechaReg = regularizacion.FECHA || regularizacion.fecha || "";
    let fechaFormateada = "";
    if (fechaReg) {
      if (fechaReg.includes("-")) {
        const [year, month, day] = fechaReg.split("-");
        fechaFormateada = `${day}/${month}/${year}`;
      } else {
        fechaFormateada = fechaReg;
      }
    }

    setRegularizacionAEditar(regularizacion);
    setFormularioActualizarPrincipal({
      nombre: regularizacion.NOMBRE || regularizacion.nombre || "",
      fecha: fechaFormateada,
      observaciones: regularizacion.OBSERVACIONES || regularizacion.observaciones || "",
      efectivo_indicado: regularizacion.EFECTIVO_INDICADO || regularizacion.efectivo_indicado || 0,
      confirmacion: regularizacion.CONFIRMACION || regularizacion.confirmacion || "SI",
      regularizacion_porcentaje: regularizacion.REGULARIZACION_PORCENTAJE || regularizacion.regularizacion_porcentaje || 100,
    });
    setEsRegularizacionPrincipal(true);
    setModalActualizarPrincipalOpen(true);
  };

  // Función para abrir modal de actualización de detalle
  const handleAbrirActualizar = async (regularizacion) => {
    const id = obtenerIdRegularizacion(regularizacion);
    if (!id) {
      alert("No se pudo obtener el ID de la regularización.");
      return;
    }

    try {
      if (typeof window === "undefined") return;

      const token = localStorage.getItem("token");
      if (!token || token.trim() === "") {
        alert("No se encontró token de autenticación.");
        return;
      }

      // Cargar los detalles de la regularización para obtener todos los datos
      const apiUrl = `https://api-regularizazcion-zeus-2946605267.us-central1.run.app?area=regularizacion&id=${encodeURIComponent(id)}`;

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        alert("No se pudieron cargar los datos de la regularización.");
        return;
      }

      const contentType = response.headers.get("content-type");
      let data;
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          alert("Error al procesar los datos.");
          return;
        }
      }

      // Obtener el primer detalle para prellenar el formulario
      const items = Array.isArray(data) ? data : data?.detalles || data?.data || [data];
      const primerDetalle = items.length > 0 ? items[0] : regularizacion;

      // Formatear fecha de YYYY-MM-DD a DD/MM/YYYY si es necesario
      const fechaReg = primerDetalle.FECHA_REGULARIZACION ||
        primerDetalle.fecha_regularizacion ||
        primerDetalle.FECHA ||
        primerDetalle.fecha ||
        "";

      let fechaFormateada = "";
      if (fechaReg) {
        // Si viene en formato YYYY-MM-DD, convertir a DD/MM/YYYY
        if (fechaReg.includes("-")) {
          const [year, month, day] = fechaReg.split("-");
          fechaFormateada = `${day}/${month}/${year}`;
        } else {
          fechaFormateada = fechaReg;
        }
      }

      // Obtener valores del detalle
      const comprobantesValue = primerDetalle.COMPROBANTES ||
        primerDetalle.comprobantes ||
        primerDetalle.COMPROBANTE ||
        primerDetalle.comprobante ||
        "";

      const montoValue = primerDetalle.MONTO ||
        primerDetalle.monto ||
        primerDetalle.EFECTIVO_INDICADO ||
        primerDetalle.efectivo_indicado ||
        "";

      const asesorValue = primerDetalle.ASESOR ||
        primerDetalle.asesor ||
        "";

      const medioPagoValue = primerDetalle.MEDIO_DE_PAGO ||
        primerDetalle.medio_de_pago ||
        primerDetalle.MEDIO_PAGO ||
        primerDetalle.medio_pago ||
        primerDetalle.FORMA_PAGO ||
        primerDetalle.forma_pago ||
        "";

      const observacionesValue = primerDetalle.OBSERVACION ||
        primerDetalle.observacion ||
        primerDetalle.OBSERVACIONES ||
        primerDetalle.observaciones ||
        "";

      console.log("Datos cargados para actualizar:", {
        comprobantes: comprobantesValue,
        fecha: fechaFormateada,
        monto: montoValue,
        asesor: asesorValue,
        medio_pago: medioPagoValue,
        observaciones: observacionesValue
      });

      setRegularizacionAEditar(regularizacion);
      setFormularioActualizar({
        comprobantes: comprobantesValue,
        fecha_regularizacion: fechaFormateada,
        monto: montoValue,
        asesor: asesorValue,
        medio_pago: medioPagoValue,
        observaciones: observacionesValue,
      });
      setModalActualizarOpen(true);
    } catch (error) {
      console.error("Error cargando datos para actualizar:", error);
      alert("Ocurrió un error al cargar los datos.");
    }
  };

  // Función para actualizar una regularización
  // Función auxiliar para validar y convertir fecha
  const convertirFechaActualizar = (fechaInput) => {
    if (!fechaInput || fechaInput.trim() === "") {
      return null;
    }

    if (fechaInput.includes("/")) {
      const partes = fechaInput.split("/").map(p => p.trim());
      if (partes.length === 3) {
        const day = parseInt(partes[0], 10);
        const month = parseInt(partes[1], 10);
        let year = parseInt(partes[2], 10);

        // Validar que sean números válidos
        if (isNaN(day) || isNaN(month) || isNaN(year)) {
          return null;
        }

        // Validar rango del mes (1-12)
        if (month < 1 || month > 12) {
          return null;
        }

        // Validar rango del día (1-31)
        if (day < 1 || day > 31) {
          return null;
        }

        // Asegurar año de 4 dígitos
        if (year < 100) {
          year = 2000 + year;
        }

        // Formatear con padding
        const dayStr = day.toString().padStart(2, '0');
        const monthStr = month.toString().padStart(2, '0');
        const yearStr = year.toString();

        return `${yearStr}-${monthStr}-${dayStr}`;
      }
    }
    return fechaInput; // Si ya está en formato YYYY-MM-DD, retornarlo tal cual
  };

  // Función para actualizar regularización principal
  const handleActualizarRegularizacionPrincipal = async () => {
    // Validar campos requeridos
    if (!formularioActualizarPrincipal.nombre || !formularioActualizarPrincipal.fecha) {
      setModalMensaje({ open: true, tipo: "error", mensaje: "Por favor complete todos los campos requeridos (*)." });
      return;
    }

    const id = obtenerIdRegularizacion(regularizacionAEditar);
    if (!id) {
      setModalMensaje({ open: true, tipo: "error", mensaje: "No se pudo obtener el ID de la regularización para actualizar." });
      return;
    }

    try {
      if (typeof window === "undefined") return;

      const token = localStorage.getItem("token");
      if (!token || token.trim() === "") {
        setModalMensaje({ open: true, tipo: "error", mensaje: "No se encontró token de autenticación. Por favor, inicia sesión nuevamente." });
        setTimeout(() => router.push("/login"), 2000);
        return;
      }

      // Convertir fecha de DD/MM/YYYY a YYYY-MM-DD con validación
      let fechaFormateada = convertirFechaActualizar(formularioActualizarPrincipal.fecha);
      if (!fechaFormateada) {
        setModalMensaje({ open: true, tipo: "error", mensaje: "La fecha ingresada no es válida. Por favor ingrese una fecha en formato DD/MM/YYYY (ejemplo: 18/10/2025). El mes debe estar entre 1-12 y el día entre 1-31." });
        return;
      }

      const apiUrl = `https://api-regularizazcion-zeus-2946605267.us-central1.run.app?area=regularizacion&forma=actualizar`;

      // Preparar el body para actualizar regularización principal
      const requestBody = {
        id_regularizacion: id,
        nombre: formularioActualizarPrincipal.nombre || "",
        fecha: fechaFormateada,
        observaciones: formularioActualizarPrincipal.observaciones || "",
        efectivo_indicado: parseFloat(formularioActualizarPrincipal.efectivo_indicado) || 0,
        confirmacion: formularioActualizarPrincipal.confirmacion || "SI",
        regularizacion_porcentaje: parseInt(formularioActualizarPrincipal.regularizacion_porcentaje) || 100,
      };

      console.log("Datos a actualizar (principal):", requestBody);

      const response = await fetch(apiUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.push("/login");
          return;
        }

        const errorText = await response.text();
        console.error("Error al actualizar:", response.status, errorText);

        let errorMessage = "No se pudo actualizar la regularización.";
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.Error || errorJson.error || errorMessage;
        } catch {
          if (errorText) {
            errorMessage = errorText;
          }
        }

        setModalMensaje({ open: true, tipo: "error", mensaje: errorMessage });
        return;
      }

      // Recargar la lista de regularizaciones
      const refreshResponse = await fetch(
        "https://api-regularizazcion-zeus-2946605267.us-central1.run.app?area=regularizacion",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (refreshResponse.ok) {
        const contentType = refreshResponse.headers.get("content-type");
        let data;
        if (contentType && contentType.includes("application/json")) {
          data = await refreshResponse.json();
        } else {
          const text = await refreshResponse.text();
          try {
            data = JSON.parse(text);
          } catch {
            console.error("Error parseando respuesta");
          }
        }

        const items = Array.isArray(data) ? data : data?.regularizaciones || data?.data || [];
        setRegularizaciones(items);

        if (items.length > 0) {
          cargarCantidadesRegularizaciones(items, token);
        }
      }

      setModalActualizarPrincipalOpen(false);
      setModalMensaje({ open: true, tipo: "success", mensaje: "Regularización actualizada exitosamente." });
    } catch (error) {
      console.error("Error actualizando regularización:", error);
      setModalMensaje({ open: true, tipo: "error", mensaje: "Ocurrió un error al actualizar la regularización." });
    }
  };

  // Función para actualizar detalle de regularización
  const handleActualizarRegularizacion = async () => {
    // Validar campos requeridos
    if (!formularioActualizar.comprobantes || !formularioActualizar.fecha_regularizacion ||
      !formularioActualizar.monto || !formularioActualizar.asesor || !formularioActualizar.medio_pago) {
      setModalMensaje({ open: true, tipo: "error", mensaje: "Por favor complete todos los campos requeridos (*)." });
      return;
    }

    const id = obtenerIdRegularizacion(regularizacionAEditar);
    if (!id) {
      setModalMensaje({ open: true, tipo: "error", mensaje: "No se pudo obtener el ID de la regularización para actualizar." });
      return;
    }

    try {
      if (typeof window === "undefined") return;

      const token = localStorage.getItem("token");
      if (!token || token.trim() === "") {
        setModalMensaje({ open: true, tipo: "error", mensaje: "No se encontró token de autenticación. Por favor, inicia sesión nuevamente." });
        setTimeout(() => router.push("/login"), 2000);
        return;
      }

      // Convertir fecha de DD/MM/YYYY a YYYY-MM-DD con validación
      let fechaFormateada = convertirFechaActualizar(formularioActualizar.fecha_regularizacion);
      if (!fechaFormateada) {
        setModalMensaje({ open: true, tipo: "error", mensaje: "La fecha ingresada no es válida. Por favor ingrese una fecha en formato DD/MM/YYYY (ejemplo: 18/10/2025). El mes debe estar entre 1-12 y el día entre 1-31." });
        return;
      }

      const apiUrl = `https://api-regularizazcion-zeus-2946605267.us-central1.run.app?area=regularizacion&forma=actualizar`;

      // Preparar el body con los datos del formulario (detalle)
      const requestBody = {
        id: id,
        comprobantes: formularioActualizar.comprobantes || "",
        fecha_regularizacion: fechaFormateada,
        monto: formularioActualizar.monto || 0,
        asesor: formularioActualizar.asesor || "",
        medio_de_pago: formularioActualizar.medio_pago || "",
        observacion: formularioActualizar.observaciones || "",
      };

      console.log("Datos a actualizar:", requestBody);
      console.log("Formulario completo:", formularioActualizar);

      const response = await fetch(apiUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.push("/login");
          return;
        }

        const errorText = await response.text();
        console.error("Error al actualizar:", response.status, errorText);

        let errorMessage = "No se pudo actualizar la regularización.";
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.Error || errorJson.error || errorMessage;
        } catch {
          // Si el error contiene información sobre fecha, extraerla
          if (errorText.includes("date") || errorText.includes("fecha") || errorText.includes("Incorrect date")) {
            errorMessage = "Error en el formato de fecha. Por favor verifique que la fecha esté en formato DD/MM/YYYY y que sea válida.";
          } else if (errorText) {
            errorMessage = errorText;
          }
        }

        setModalMensaje({ open: true, tipo: "error", mensaje: errorMessage });
        return;
      }

      // Recargar la lista de regularizaciones
      const refreshResponse = await fetch(
        "https://api-regularizazcion-zeus-2946605267.us-central1.run.app?area=regularizacion",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (refreshResponse.ok) {
        const contentType = refreshResponse.headers.get("content-type");
        let data;
        if (contentType && contentType.includes("application/json")) {
          data = await refreshResponse.json();
        } else {
          const text = await refreshResponse.text();
          try {
            data = JSON.parse(text);
          } catch {
            console.error("Error parseando respuesta");
          }
        }

        const items = Array.isArray(data) ? data : data?.regularizaciones || data?.data || [];
        setRegularizaciones(items);

        if (items.length > 0) {
          cargarCantidadesRegularizaciones(items, token);
        }
      }

      setModalActualizarOpen(false);
      setRegularizacionAEditar(null);
      setFormularioActualizar({});
      setModalMensaje({ open: true, tipo: "success", mensaje: "Regularización actualizada exitosamente." });
    } catch (error) {
      console.error("Error actualizando regularización:", error);
      let mensajeError = "Ocurrió un error al actualizar la regularización.";
      if (error.message) {
        mensajeError = error.message;
      }
      setModalMensaje({ open: true, tipo: "error", mensaje: mensajeError });
    }
  };

  const toggleMes = (mes) => {
    setMesesSeleccionados((prev) =>
      prev.includes(mes)
        ? prev.filter((m) => m !== mes)
        : [...prev, mes]
    );
  };

  const handleExportarExcelPorMes = () => {
    // Exportar reporte por mes usando el área= "reporte"
    (async () => {
      try {
        if (mesesSeleccionados.length === 0) {
          alert("Selecciona al menos un mes para generar el reporte.");
          return;
        }

        if (typeof window === "undefined") return;

        const token = localStorage.getItem("token");
        if (!token || token.trim() === "") {
          console.warn("No se encontró token para reporte por mes");
          return;
        }

        // Convertir nombres de meses a números (1-12)
        const mesesNumeros = mesesSeleccionados
          .map((mes) => meses.indexOf(mes) + 1)
          .filter((n) => n > 0)
          .sort((a, b) => a - b);

        if (mesesNumeros.length === 0) {
          alert("No se pudieron interpretar los meses seleccionados.");
          return;
        }

        // Si solo hay un mes seleccionado, ese mes es tanto mínimo como máximo
        // Si hay múltiples meses, el mínimo es el menor y el máximo es el mayor
        const minMes = mesesNumeros[0];
        const maxMes = mesesNumeros.length === 1
          ? mesesNumeros[0]  // Si solo hay un mes, min y max son el mismo
          : mesesNumeros[mesesNumeros.length - 1];  // Si hay múltiples, max es el mayor

        // Construir URL con los parámetros: area=reporte&min=X&max=Y&year=Z
        const apiUrl = `https://api-regularizazcion-zeus-2946605267.us-central1.run.app?area=reporte&min=${minMes}&max=${maxMes}&year=${ano}`;

        console.log("Generando reporte con parámetros:", { area: "reporte", min: minMes, max: maxMes, year: ano });

        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("Regularizacion REPORTE status:", response.status);

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            router.push("/login");
            return;
          }

          const errorText = await response.text();
          console.error("Error en reporte:", response.status, errorText);
          alert("No se pudo generar el reporte. Revisa la consola.");
          return;
        }

        const contentType = response.headers.get("content-type");
        let data;
        if (contentType && contentType.includes("application/json")) {
          data = await response.json();
        } else {
          const text = await response.text();
          try {
            data = JSON.parse(text);
          } catch {
            console.error("La respuesta de reporte no es JSON válido");
            alert("La respuesta del reporte no es un JSON válido.");
            return;
          }
        }

        const items = Array.isArray(data)
          ? data
          : data?.regularizaciones || data?.data || [];

        if (!items.length) {
          alert("El reporte no devolvió datos para los meses seleccionados.");
          return;
        }

        // Generar archivo Excel (.xlsx) usando la librería xlsx (importación dinámica)
        const XLSX = await import("xlsx");
        const worksheet = XLSX.utils.json_to_sheet(items);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Regularizaciones");

        // Generar el archivo Excel
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const blob = new Blob([excelBuffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `reporte_regularizacion_${ano}_${minMes}-${maxMes}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Error exportando reporte por mes:", error);
        alert("Ocurrió un error al generar el archivo. Revisa la consola.");
      }
    })();
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

      <div
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${sidebarOpen ? "lg:ml-60 ml-0" : "ml-0"
          }`}
      >
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

            {/* Card contenedor principal */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#002D5A] to-[#002D5A] rounded-xl flex items-center justify-center text-white shadow-sm">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Listado de Regularizaciones</h1>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {apiConectada && (
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm font-medium text-green-600">API Conectada</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card 1: Listado de Regularizaciones */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200/60 p-6 mb-6">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-blue-700 border-b-2 border-blue-800">
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">TÍTULO</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">FECHA</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">EFECTIVO INDICADO</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">CANTIDAD</th>
                          <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ACCIÓN</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {regularizaciones.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-4 py-6 text-center text-[10px] text-gray-500 font-medium"
                            >
                              No hay regularizaciones registradas.
                            </td>
                          </tr>
                        ) : (
                          regularizaciones.map((regularizacion, index) => {
                            // Intentar usar un ID estable de la API, con fallback al índice
                            const rowKey =
                              regularizacion.ID_DETALLE ||
                              regularizacion.ID_REGULARIZACION ||
                              regularizacion.id ||
                              `${regularizacion.id_regularizacion || "row"}-${index}`;

                            // Título / nombre de la regularización
                            const titulo =
                              regularizacion.NOMBRE ||
                              regularizacion.nombre ||
                              regularizacion.TITULO ||
                              regularizacion.titulo ||
                              regularizacion.descripcion ||
                              `Regularización ${index + 1}`;

                            // Fecha principal
                            const fecha =
                              regularizacion.FECHA ||
                              regularizacion.fecha ||
                              regularizacion.FECHA_REGULARIZACION ||
                              regularizacion.fecha_regularizacion ||
                              "";

                            // Efectivo indicado o monto principal
                            const efectivoIndicadoRaw =
                              regularizacion.EFECTIVO_INDICADO ||
                              regularizacion.efectivo_indicado ||
                              regularizacion.MONTO ||
                              regularizacion.monto ||
                              "0";

                            const efectivoNum = parseFloat(
                              typeof efectivoIndicadoRaw === "string"
                                ? efectivoIndicadoRaw.replace(",", ".")
                                : efectivoIndicadoRaw || "0"
                            );

                            // Mostrar "0" si no hay valor o si el valor es 0
                            const efectivoMostrar = efectivoIndicadoRaw === "" || efectivoNum === 0 ? "0" : efectivoIndicadoRaw;

                            // Siempre mostrar con fondo amarillo (incluso cuando es 0)
                            const mostrarResaltado = !Number.isNaN(efectivoNum);

                            // Obtener el ID de la regularización para buscar su cantidad
                            const idRegularizacion = obtenerIdRegularizacion(regularizacion);

                            // Obtener la cantidad desde el estado (si ya se cargaron los detalles)
                            // Si no está en el estado, usar el valor de la API o "0"
                            const cantidadDesdeEstado = idRegularizacion
                              ? cantidadesRegularizaciones[idRegularizacion]
                              : null;

                            const cantidadRaw =
                              cantidadDesdeEstado !== null && cantidadDesdeEstado !== undefined
                                ? String(cantidadDesdeEstado)
                                : regularizacion.CANTIDAD ||
                                regularizacion.cantidad ||
                                regularizacion.TOTAL ||
                                regularizacion.total ||
                                regularizacion.cantidad_registros ||
                                "0";

                            // Mostrar "0" si no hay cantidad
                            const cantidad = cantidadRaw === "" ? "0" : cantidadRaw;

                            return (
                              <tr
                                key={rowKey}
                                className="hover:bg-slate-200 transition-colors cursor-pointer"
                                onClick={() => cargarDetallesRegularizacion(regularizacion)}
                              >
                                <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">
                                  {titulo}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                                  {fecha}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                                  {mostrarResaltado ? (
                                    <span className="px-2 py-1 bg-yellow-100 text-gray-900 rounded font-semibold text-[10px]">
                                      {efectivoMostrar}
                                    </span>
                                  ) : (
                                    <span>{efectivoMostrar}</span>
                                  )}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                                  {cantidad}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => handleAbrirActualizarPrincipal(regularizacion)}
                                      className="px-2.5 py-1 bg-yellow-500 border-2 border-yellow-600 hover:bg-yellow-600 hover:border-yellow-700 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] flex items-center space-x-1"
                                    >
                                      <svg
                                        className="w-3 h-3"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        strokeWidth="2"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                        />
                                      </svg>
                                      <span>Actualizar</span>
                                    </button>
                                    <button
                                      onClick={() => handleEliminarRegularizacion(regularizacion)}
                                      className="px-2.5 py-1 bg-red-600 border-2 border-red-700 hover:bg-red-700 hover:border-red-800 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] flex items-center space-x-1"
                                    >
                                      <svg
                                        className="w-3 h-3"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        strokeWidth="2"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                      </svg>
                                      <span>Eliminar</span>
                                    </button>
                                    <button
                                      onClick={() => handleExportarExcel(regularizacion)}
                                      className="px-2.5 py-1 bg-green-600 border-2 border-green-700 hover:bg-green-700 hover:border-green-800 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] flex items-center space-x-1"
                                    >
                                      <svg
                                        className="w-3 h-3"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        strokeWidth="2"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                      </svg>
                                      <span>Excel</span>
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
                </div>
              </div>

              {/* Card 2: Búsqueda por Comprobante */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200/60 p-6 mb-6">
                <div className="p-3 bg-gradient-to-r from-[#002D5A] to-[#002D5A] text-white rounded-lg mb-4">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <h2 className="text-lg font-bold">Búsqueda por Comprobante</h2>
                  </div>
                </div>

                <div className="mb-4 flex gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={busquedaComprobante}
                      onChange={(e) => setBusquedaComprobante(e.target.value)}
                      placeholder="Ingrese el número de comprobante..."
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002D5A] focus:border-[#002D5A] transition-all text-sm text-gray-900 placeholder:text-gray-500"
                    />
                  </div>
                  <button
                    onClick={handleBuscarComprobante}
                    className="px-6 py-2.5 bg-gradient-to-br from-[#002D5A] to-[#002D5A] text-white rounded-lg font-semibold hover:shadow-md transition-all duration-200 shadow-sm flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span>Buscar</span>
                  </button>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-blue-700 border-b-2 border-blue-800">
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">TÍTULO</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">COMPROBANTES</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">FECHA REGULARIZACIÓN</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">MONTO</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ASESOR</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">MEDIO DE PAGO</th>
                          <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ACCIONES</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {loadingBusqueda ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-[10px] text-gray-500">
                              Buscando comprobante...
                            </td>
                          </tr>
                        ) : !hasBuscado ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-12 text-center">
                              <div className="flex flex-col items-center justify-center">
                                <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <p className="text-gray-500 font-medium text-[10px]">
                                  Ingrese un comprobante para buscar
                                </p>
                              </div>
                            </td>
                          </tr>
                        ) : errorBusqueda ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-[10px] text-red-500 font-medium text-[10px]">
                              {errorBusqueda}
                            </td>
                          </tr>
                        ) : resultadosBusqueda.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-[10px] text-gray-500">
                              No se encontraron resultados para ese comprobante.
                            </td>
                          </tr>
                        ) : (
                          resultadosBusqueda.map((item, index) => {
                            const rowKey =
                              item.ID_DETALLE ||
                              item.ID_REGULARIZACION ||
                              item.id ||
                              `detalle-${index}`;

                            const titulo =
                              item.NOMBRE ||
                              item.nombre ||
                              item.TITULO ||
                              item.titulo ||
                              item.DESCRIPCION ||
                              item.descripcion ||
                              item.NOMBRE_REGULARIZACION ||
                              item.nombre_regularizacion ||
                              `Regularización ${index + 1}`;

                            const comprobantes =
                              item.COMPROBANTES ||
                              item.comprobantes ||
                              item.COMPROBANTE ||
                              item.comprobante ||
                              item.NUMERO_COMPROBANTE ||
                              item.numero_comprobante ||
                              "";

                            const fechaReg =
                              item.FECHA_REGULARIZACION ||
                              item.fecha_regularizacion ||
                              item.FECHA_REG ||
                              item.fecha_reg ||
                              item.FECHA ||
                              item.fecha ||
                              item.FECHA_CREACION ||
                              item.fecha_creacion ||
                              "";

                            const monto =
                              item.MONTO ||
                              item.monto ||
                              item.MONTO_TOTAL ||
                              item.monto_total ||
                              item.TOTAL ||
                              item.total ||
                              item.EFECTIVO_INDICADO ||
                              item.efectivo_indicado ||
                              "";

                            const asesor =
                              item.ASESOR ||
                              item.asesor ||
                              item.ASESOR_NOMBRE ||
                              item.asesor_nombre ||
                              item.VENDEDOR ||
                              item.vendedor ||
                              "";

                            const medioPago =
                              item.MEDIO_DE_PAGO ||
                              item.medio_de_pago ||
                              item.MEDIO_PAGO ||
                              item.medio_pago ||
                              item.FORMA_PAGO ||
                              item.forma_pago ||
                              item.METODO_PAGO ||
                              item.metodo_pago ||
                              "";

                            return (
                              <tr key={rowKey} className="hover:bg-slate-200 transition-colors">
                                <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">
                                  {titulo}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                                  {comprobantes}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                                  {fechaReg}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                                  {monto}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                                  {asesor}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                                  {medioPago}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => handleAbrirActualizar(item)}
                                      className="px-2.5 py-1 bg-yellow-500 border-2 border-yellow-600 hover:bg-yellow-600 hover:border-yellow-700 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] flex items-center space-x-1"
                                    >
                                      <svg
                                        className="w-3 h-3"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        strokeWidth="2"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                        />
                                      </svg>
                                      <span>Actualizar</span>
                                    </button>
                                    <button
                                      onClick={() => handleEliminarRegularizacion(item)}
                                      className="px-2.5 py-1 bg-red-600 border-2 border-red-700 hover:bg-red-700 hover:border-red-800 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] flex items-center space-x-1"
                                    >
                                      <svg
                                        className="w-3 h-3"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        strokeWidth="2"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                      </svg>
                                      <span>Eliminar</span>
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
                </div>
              </div>

              {/* Card 3: Regularizaciones por Mes */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200/60 p-6">
                <div className="p-3 bg-gradient-to-r from-[#002D5A] to-[#002D5A] text-white rounded-lg mb-4">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h2 className="text-lg font-bold">Regularizaciones por Mes</h2>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
                    {meses.map((mes) => (
                      <label key={mes} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={mesesSeleccionados.includes(mes)}
                          onChange={() => toggleMes(mes)}
                          className="w-4 h-4 text-[#002D5A] border-gray-300 rounded focus:ring-[#002D5A]"
                        />
                        <span className="text-sm font-medium text-gray-700">{mes}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Año:
                      </label>
                      <div className="relative">
                        <select
                          value={ano}
                          onChange={(e) => setAno(e.target.value)}
                          className="w-full px-4 py-2.5 pr-10 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002D5A] focus:border-[#002D5A] transition-all text-sm text-gray-900 bg-white hover:border-gray-400 cursor-pointer appearance-none font-medium"
                        >
                          <option value="2023" className="text-gray-900 bg-white py-2">2023</option>
                          <option value="2024" className="text-gray-900 bg-white py-2">2024</option>
                          <option value="2025" className="text-gray-900 bg-white py-2">2025</option>
                          <option value="2026" className="text-gray-900 bg-white py-2">2026</option>
                          <option value="2027" className="text-gray-900 bg-white py-2">2027</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleExportarExcelPorMes}
                      className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Excel</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal de Detalles de Regularización */}
      <Modal
        isOpen={modalDetallesOpen}
        onClose={() => {
          setModalDetallesOpen(false);
          setDetallesRegularizacion(null);
          setRegularizacionSeleccionada(null);
        }}
        title="Detalles de Regularización"
        size="full"
        hideFooter={true}
      >
        {loadingDetalles ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
          </div>
        ) : detallesRegularizacion ? (
          <div className="space-y-4">
            {/* Información general */}
            {regularizacionSeleccionada && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Información General</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">Título</p>
                    <p className="text-sm font-medium text-gray-900">
                      {regularizacionSeleccionada.NOMBRE ||
                        regularizacionSeleccionada.nombre ||
                        regularizacionSeleccionada.TITULO ||
                        regularizacionSeleccionada.titulo ||
                        "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">Fecha</p>
                    <p className="text-sm font-medium text-gray-900">
                      {regularizacionSeleccionada.FECHA ||
                        regularizacionSeleccionada.fecha ||
                        "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">Efectivo Indicado</p>
                    <p className="text-sm font-medium text-gray-900">
                      {regularizacionSeleccionada.EFECTIVO_INDICADO ||
                        regularizacionSeleccionada.efectivo_indicado ||
                        regularizacionSeleccionada.MONTO ||
                        regularizacionSeleccionada.monto ||
                        "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">Cantidad</p>
                    <p className="text-sm font-medium text-gray-900">
                      {regularizacionSeleccionada.CANTIDAD ||
                        regularizacionSeleccionada.cantidad ||
                        "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tabla de detalles */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200/60 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-blue-700 border-b-2 border-blue-800">
                      {detallesRegularizacion && Array.isArray(detallesRegularizacion) && detallesRegularizacion.length > 0
                        ? Object.keys(detallesRegularizacion[0]).map((key) => (
                          <th
                            key={key}
                            className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap"
                          >
                            {key}
                          </th>
                        ))
                        : detallesRegularizacion && !Array.isArray(detallesRegularizacion)
                          ? Object.keys(detallesRegularizacion).map((key) => (
                            <th
                              key={key}
                              className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap"
                            >
                              {key}
                            </th>
                          ))
                          : null}
                      <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                        ACCIÓN
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {Array.isArray(detallesRegularizacion) ? (
                      detallesRegularizacion.length > 0 ? (
                        detallesRegularizacion.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-200 transition-colors">
                            {Object.values(item).map((value, valIdx) => (
                              <td
                                key={valIdx}
                                className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700"
                              >
                                {value !== null && value !== undefined ? String(value) : ""}
                              </td>
                            ))}
                            <td className="px-3 py-2 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleAbrirActualizar(item)}
                                  className="px-2.5 py-1 bg-yellow-500 border-2 border-yellow-600 hover:bg-yellow-600 hover:border-yellow-700 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] flex items-center space-x-1"
                                >
                                  <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    strokeWidth="2"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                    />
                                  </svg>
                                  <span>Actualizar</span>
                                </button>
                                <button
                                  onClick={() => handleEliminarRegularizacion(item)}
                                  className="px-2.5 py-1 bg-red-600 border-2 border-red-700 hover:bg-red-700 hover:border-red-800 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] flex items-center space-x-1"
                                >
                                  <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    strokeWidth="2"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                  </svg>
                                  <span>Eliminar</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={(Object.keys(detallesRegularizacion[0] || {}).length || 1) + 1}
                            className="px-4 py-6 text-center text-[10px] text-gray-500"
                          >
                            No hay detalles disponibles.
                          </td>
                        </tr>
                      )
                    ) : (
                      <tr>
                        {Object.values(detallesRegularizacion).map((value, idx) => (
                          <td
                            key={idx}
                            className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700"
                          >
                            {value !== null && value !== undefined ? String(value) : ""}
                          </td>
                        ))}
                        <td className="px-3 py-2 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleAbrirActualizar(detallesRegularizacion)}
                              className="px-2.5 py-1 bg-yellow-500 border-2 border-yellow-600 hover:bg-yellow-600 hover:border-yellow-700 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] flex items-center space-x-1"
                            >
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                strokeWidth="2"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                              <span>Actualizar</span>
                            </button>
                            <button
                              onClick={() => handleEliminarRegularizacion(detallesRegularizacion)}
                              className="px-2.5 py-1 bg-red-600 border-2 border-red-700 hover:bg-red-700 hover:border-red-800 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] flex items-center space-x-1"
                            >
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                strokeWidth="2"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                              <span>Eliminar</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Botón cerrar */}
            <div className="flex justify-end pt-4">
              <button
                onClick={() => {
                  setModalDetallesOpen(false);
                  setDetallesRegularizacion(null);
                  setRegularizacionSeleccionada(null);
                }}
                className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#002D5A] to-[#002D5A] rounded-lg hover:shadow-md hover:scale-[1.02] transition-all duration-200 shadow-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>No se pudieron cargar los detalles.</p>
          </div>
        )}
      </Modal>

      {/* Modal de Actualizar Regularización */}
      <Modal
        isOpen={modalActualizarOpen}
        onClose={() => {
          setModalActualizarOpen(false);
          setRegularizacionAEditar(null);
          setFormularioActualizar({});
        }}
        title="Actualizar Regularización"
        size="lg"
        hideFooter={true}
      >
        {regularizacionAEditar && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Comprobantes <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formularioActualizar.comprobantes || ""}
                  onChange={(e) =>
                    setFormularioActualizar({
                      ...formularioActualizar,
                      comprobantes: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002D5A] focus:border-[#002D5A] transition-all text-sm text-gray-900 placeholder:text-gray-500"
                  placeholder="Ingrese el número de comprobante"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Fecha de Regularización <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formularioActualizar.fecha_regularizacion || ""}
                    onChange={(e) =>
                      setFormularioActualizar({
                        ...formularioActualizar,
                        fecha_regularizacion: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 pr-10 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002D5A] focus:border-[#002D5A] transition-all text-sm text-gray-900 placeholder:text-gray-500"
                    placeholder="dd/mm/aaaa"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Monto <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formularioActualizar.monto || ""}
                  onChange={(e) =>
                    setFormularioActualizar({
                      ...formularioActualizar,
                      monto: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002D5A] focus:border-[#002D5A] transition-all text-sm text-gray-900 placeholder:text-gray-500"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Asesor <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formularioActualizar.asesor || ""}
                    onChange={(e) =>
                      setFormularioActualizar({
                        ...formularioActualizar,
                        asesor: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 pr-10 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002D5A] focus:border-[#002D5A] transition-all text-sm text-gray-900 bg-white hover:border-gray-400 cursor-pointer appearance-none font-medium"
                    required
                  >
                    <option value="">Seleccione un asesor</option>
                    {asesores.map((asesor) => (
                      <option key={asesor.id} value={asesor.nombre} className="text-gray-900 bg-white py-2">
                        {asesor.nombre}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Medio de Pago <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formularioActualizar.medio_pago || ""}
                    onChange={(e) =>
                      setFormularioActualizar({
                        ...formularioActualizar,
                        medio_pago: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 pr-10 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002D5A] focus:border-[#002D5A] transition-all text-sm text-gray-900 bg-white hover:border-gray-400 cursor-pointer appearance-none font-medium"
                    required
                  >
                    <option value="">Seleccione un medio de pago</option>
                    {mediosPago.map((medio) => (
                      <option key={medio.id} value={medio.nombre} className="text-gray-900 bg-white py-2">
                        {medio.nombre}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Observaciones
                </label>
                <textarea
                  value={formularioActualizar.observaciones || ""}
                  onChange={(e) =>
                    setFormularioActualizar({
                      ...formularioActualizar,
                      observaciones: e.target.value,
                    })
                  }
                  rows={4}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002D5A] focus:border-[#002D5A] transition-all text-sm text-gray-900 placeholder:text-gray-500 resize-y"
                  placeholder="Ingrese observaciones (opcional)"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <button
                onClick={() => {
                  setModalActualizarOpen(false);
                  setRegularizacionAEditar(null);
                  setFormularioActualizar({});
                }}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleActualizarRegularizacion}
                className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#002D5A] to-[#002D5A] rounded-lg hover:shadow-md hover:scale-[1.02] transition-all duration-200 shadow-sm flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                <span>Guardar Cambios</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Actualizar Regularización Principal */}
      <Modal
        isOpen={modalActualizarPrincipalOpen}
        onClose={() => {
          setModalActualizarPrincipalOpen(false);
          setRegularizacionAEditar(null);
          setFormularioActualizarPrincipal({});
        }}
        title="Actualizar Regularización Principal"
        size="lg"
        hideFooter={true}
      >
        {regularizacionAEditar && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formularioActualizarPrincipal.nombre || ""}
                  onChange={(e) =>
                    setFormularioActualizarPrincipal({
                      ...formularioActualizarPrincipal,
                      nombre: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002D5A] focus:border-[#002D5A] transition-all text-sm text-gray-900 placeholder:text-gray-500"
                  placeholder="Ingrese el nombre de la regularización"
                  required
                  maxLength={50}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Fecha <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formularioActualizarPrincipal.fecha || ""}
                    onChange={(e) =>
                      setFormularioActualizarPrincipal({
                        ...formularioActualizarPrincipal,
                        fecha: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 pr-10 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002D5A] focus:border-[#002D5A] transition-all text-sm text-gray-900 placeholder:text-gray-500"
                    placeholder="dd/mm/aaaa"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Efectivo Indicado
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formularioActualizarPrincipal.efectivo_indicado || ""}
                  onChange={(e) =>
                    setFormularioActualizarPrincipal({
                      ...formularioActualizarPrincipal,
                      efectivo_indicado: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002D5A] focus:border-[#002D5A] transition-all text-sm text-gray-900 placeholder:text-gray-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirmación
                </label>
                <select
                  value={formularioActualizarPrincipal.confirmacion || "SI"}
                  onChange={(e) =>
                    setFormularioActualizarPrincipal({
                      ...formularioActualizarPrincipal,
                      confirmacion: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 pr-10 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002D5A] focus:border-[#002D5A] transition-all text-sm text-gray-900 bg-white hover:border-gray-400 cursor-pointer appearance-none font-medium"
                >
                  <option value="SI">SI</option>
                  <option value="NO">NO</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Porcentaje de Regularización
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formularioActualizarPrincipal.regularizacion_porcentaje || ""}
                  onChange={(e) =>
                    setFormularioActualizarPrincipal({
                      ...formularioActualizarPrincipal,
                      regularizacion_porcentaje: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002D5A] focus:border-[#002D5A] transition-all text-sm text-gray-900 placeholder:text-gray-500"
                  placeholder="100"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Observaciones
                </label>
                <textarea
                  value={formularioActualizarPrincipal.observaciones || ""}
                  onChange={(e) =>
                    setFormularioActualizarPrincipal({
                      ...formularioActualizarPrincipal,
                      observaciones: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002D5A] focus:border-[#002D5A] transition-all text-sm text-gray-900 placeholder:text-gray-500"
                  placeholder="Ingrese observaciones"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => {
                  setModalActualizarPrincipalOpen(false);
                  setRegularizacionAEditar(null);
                  setFormularioActualizarPrincipal({});
                }}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleActualizarRegularizacionPrincipal}
                className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#002D5A] to-[#002D5A] rounded-lg hover:shadow-md hover:scale-[1.02] transition-all duration-200 shadow-sm flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                <span>Guardar Cambios</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Confirmación de Eliminación */}
      {modalConfirmarEliminar.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
            <div className="p-6 rounded-t-2xl bg-gradient-to-r from-red-500 to-red-600">
              <div className="flex items-center space-x-3">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="text-xl font-bold text-white">Confirmar Eliminación</h3>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-800 text-base mb-6">{modalConfirmarEliminar.mensaje}</p>
              <p className="text-gray-600 text-sm mb-6">Esta acción no se puede deshacer.</p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setModalConfirmarEliminar({ open: false, regularizacion: null, mensaje: "" })}
                  className="px-6 py-2.5 rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarEliminarRegularizacion}
                  className="px-6 py-2.5 rounded-lg font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Mensaje Personalizado */}
      {modalMensaje.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
            <div className={`p-6 rounded-t-2xl ${modalMensaje.tipo === "success"
                ? "bg-gradient-to-r from-green-500 to-green-600"
                : "bg-gradient-to-r from-red-500 to-red-600"
              }`}>
              <div className="flex items-center space-x-3">
                {modalMensaje.tipo === "success" ? (
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <h3 className="text-xl font-bold text-white">
                  {modalMensaje.tipo === "success" ? "Éxito" : "Error"}
                </h3>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-800 text-base mb-6">{modalMensaje.mensaje}</p>
              <div className="flex justify-end">
                <button
                  onClick={() => setModalMensaje({ open: false, tipo: "success", mensaje: "" })}
                  className={`px-6 py-2.5 rounded-lg font-semibold text-white transition-all duration-200 shadow-sm hover:shadow-md ${modalMensaje.tipo === "success"
                      ? "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                      : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                    }`}
                >
                  Aceptar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

