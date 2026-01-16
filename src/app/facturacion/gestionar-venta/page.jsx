"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/context/AuthContext";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";
import Modal from "../../../components/ui/Modal";

// Constantes de API
const VENTAS_API_URL = "https://crudventas-2946605267.us-central1.run.app";
const CLIENTES_API_URL = "https://productoscrud-2946605267.us-central1.run.app";

// Componente de sugerencias para búsqueda
const SuggestionsList = ({ suggestions, onSelect, show, position = "bottom" }) => {
  if (!show || !suggestions || suggestions.length === 0) return null;

  return (
    <div
      className={`absolute z-50 w-full bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto ${position === "top" ? "bottom-full mb-2" : "top-full mt-2"
        }`}
    >
      {suggestions.map((item, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onSelect(item)}
          className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
        >
          <div className="font-semibold text-gray-900">{item.label}</div>
          {item.subtitle && (
            <div className="text-xs text-gray-500 mt-1">{item.subtitle}</div>
          )}
        </button>
      ))}
    </div>
  );
};

export default function GestionarVentaPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [apiConectada, setApiConectada] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [ventas, setVentas] = useState([]);
  const [ventasFiltradas, setVentasFiltradas] = useState([]);
  const [loadingVentas, setLoadingVentas] = useState(false);
  const [busquedaDetalladaOpen, setBusquedaDetalladaOpen] = useState(false);
  const [busquedaDetallada, setBusquedaDetallada] = useState({
    tipoBusqueda: "comprobante", // "comprobante" o "cliente"
    numeroComprobante: "",
    cliente: "",
    clienteId: "",
  });
  const [resultadosBusquedaDetallada, setResultadosBusquedaDetallada] = useState([]);
  const [sugerenciasClientes, setSugerenciasClientes] = useState([]);
  const [mostrarSugerenciasClientes, setMostrarSugerenciasClientes] = useState(false);
  const clienteSearchTimeout = useRef(null);
  const clienteInputRef = useRef(null);
  const clienteSuggestionsRef = useRef(null);
  const [mesesSeleccionados, setMesesSeleccionados] = useState([]);
  const [ano, setAno] = useState(new Date().getFullYear().toString());
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [detallesVenta, setDetallesVenta] = useState(null);
  const [pagosVenta, setPagosVenta] = useState([]);
  const [datosPago, setDatosPago] = useState(null);
  const [loadingDetalles, setLoadingDetalles] = useState(false);
  const [modalVerOpen, setModalVerOpen] = useState(false);
  const [modalPagoOpen, setModalPagoOpen] = useState(false);
  const [modalEditarPagoOpen, setModalEditarPagoOpen] = useState(false);
  const [formularioEditarPago, setFormularioEditarPago] = useState({
    tipo_comprobante: "",
    forma_pago: "",
    fecha_pago: "",
    regularizado: "NO",
    cancelado: "NO",
    estado: "COMPLETADO",
    anulado: "NO"
  });
  const [modalEliminarOpen, setModalEliminarOpen] = useState(false);
  const [modalMensaje, setModalMensaje] = useState({ open: false, tipo: "success", mensaje: "" });
  const [modalConfirmarEliminar, setModalConfirmarEliminar] = useState({ open: false, venta: null, mensaje: "" });

  const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const formatCurrency = (value) =>
    new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
      minimumFractionDigits: 2,
    }).format(value || 0);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      // Si ya está en formato DD/MM/YYYY, devolverlo tal cual
      if (typeof dateString === "string" && dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        return dateString;
      }

      // Si está en formato YYYY-MM-DD, parsearlo manualmente para evitar problemas de zona horaria
      if (typeof dateString === "string" && dateString.match(/^\d{4}-\d{2}-\d{2}/)) {
        const [year, month, day] = dateString.split("T")[0].split("-");
        return `${day}/${month}/${year}`;
      }

      // Si viene en otro formato, intentar parsearlo
      // Pero usar métodos que no se vean afectados por zona horaria
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        // Usar UTC para evitar problemas de zona horaria
        const day = String(date.getUTCDate()).padStart(2, "0");
        const month = String(date.getUTCMonth() + 1).padStart(2, "0");
        const year = date.getUTCFullYear();
        return `${day}/${month}/${year}`;
      }

      return dateString;
    } catch {
      return dateString;
    }
  };

  // Cargar ventas desde API
  useEffect(() => {
    if (user) {
      cargarVentas();
    }
  }, [user]);

  // Filtrar ventas cuando cambia searchTerm
  useEffect(() => {
    if (!searchTerm.trim()) {
      setVentasFiltradas(ventas);
      setCurrentPage(1);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtradas = ventas.filter(venta =>
      (venta.cliente?.toLowerCase().includes(term)) ||
      (venta.comprobante?.toLowerCase().includes(term)) ||
      (venta.asesor?.toLowerCase().includes(term))
    );
    setVentasFiltradas(filtradas);
    setCurrentPage(1);
  }, [searchTerm, ventas]);

  // Cerrar sugerencias al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (clienteSuggestionsRef.current && !clienteSuggestionsRef.current.contains(event.target) &&
        clienteInputRef.current && !clienteInputRef.current.contains(event.target)) {
        setMostrarSugerenciasClientes(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cargarVentas = async () => {
    try {
      setLoadingVentas(true);
      setApiConectada(false);

      if (typeof window === "undefined") return;

      // Llamar a la API para obtener todas las ventas
      // Nota: El código HTML antiguo no usa Authorization header
      // Basándome en el código HTML antiguo: area=ventas
      const response = await fetch(`${VENTAS_API_URL}?area=ventas`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      const ventasData = Array.isArray(data) ? data : (data.data || data.ventas || data.resultado || []);

      if (!ventasData || ventasData.length === 0) {
        console.warn("La API no devolvió ventas o el array está vacío. Respuesta:", data);
        // No es un error, simplemente no hay ventas
        setVentas([]);
        setVentasFiltradas([]);
        setApiConectada(true);
        return;
      }

      // Formatear las ventas
      const ventasFormateadas = ventasData.map(venta => ({
        id: venta.ID_VENTA || venta.id_venta || venta.ID || venta.id,
        cliente: venta.CLIENTE || venta.cliente || "N/A",
        fecha: formatDate(venta.FECHA || venta.fecha),
        asesor: venta.ASESOR || venta.asesor || "N/A",
        comprobante: venta.N_COMPROBANTE || venta.n_comprobante || venta.COMPROBANTE || venta.comprobante || "N/A",
        estado: venta.ESTADO || venta.estado || "COMPLETADO",
        cancelado: venta.CANCELADO || venta.cancelado || "NO",
        tipoComprobante: venta.TIPO_COMPROBANTE || venta.tipo_comprobante || "N/A",
        clasificacion: venta.CLASIFICACION || venta.clasificacion || "N/A",
        region: venta.REGION || venta.region || "N/A",
        distrito: venta.DISTRITO || venta.distrito || "N/A",
        lugar: venta.LUGAR || venta.lugar || "N/A",
        salidaPedido: venta.SALIDA_DE_PEDIDO || venta.salida_de_pedido || venta.SALIDA_PEDIDO || venta.salida_pedido || venta.SALIDA || venta.salida || "N/A",
        observaciones: venta.OBSERVACIONES || venta.observaciones || "N/A",
        total: venta.TOTAL || venta.total || 0,
        // Datos completos para usar en modales
        datosCompletos: venta,
      }));

      setVentas(ventasFormateadas);
      setVentasFiltradas(ventasFormateadas);
      setApiConectada(true);
    } catch (error) {
      console.error("Error cargando ventas:", error);
      const errorMessage = error.message || "Error desconocido";
      console.error("Detalles del error:", {
        message: errorMessage,
        stack: error.stack,
        apiUrl: VENTAS_API_URL
      });
      setModalMensaje({
        open: true,
        tipo: "error",
        mensaje: `Error al cargar las ventas: ${errorMessage}. Por favor, verifica que el endpoint de la API sea correcto.`
      });
      setApiConectada(false);
    } finally {
      setLoadingVentas(false);
    }
  };

  // Búsqueda de clientes con autocompletado
  // Basándome en el código HTML antiguo: metodo=cliente_busqueda&cliente=${cliente}
  const buscarClientes = async (termino) => {
    if (!termino || termino.trim().length < 2) {
      setSugerenciasClientes([]);
      setMostrarSugerenciasClientes(false);
      return;
    }

    if (clienteSearchTimeout.current) {
      clearTimeout(clienteSearchTimeout.current);
    }

    clienteSearchTimeout.current = setTimeout(async () => {
      try {
        if (typeof window === "undefined") return;

        const response = await fetch(`${CLIENTES_API_URL}?metodo=cliente_busqueda&cliente=${encodeURIComponent(termino)}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          const clientes = Array.isArray(data) ? data : (data.data || data.clientes || []);

          const sugerencias = clientes.slice(0, 10).map(cliente => ({
            value: cliente.ID_CLIENTE || cliente.id_cliente || cliente.ID || cliente.id,
            label: cliente.CLIENTE || cliente.cliente || cliente.NOMBRE || cliente.nombre || "N/A",
            subtitle: `ID: ${cliente.ID_CLIENTE || cliente.id_cliente || cliente.ID || cliente.id}`,
            datosCompletos: cliente,
          }));

          setSugerenciasClientes(sugerencias);
          setMostrarSugerenciasClientes(sugerencias.length > 0);
        }
      } catch (error) {
        console.error("Error buscando clientes:", error);
      }
    }, 300);
  };

  const seleccionarCliente = (cliente) => {
    setBusquedaDetallada(prev => ({
      ...prev,
      cliente: cliente.label,
      clienteId: cliente.value,
    }));
    setMostrarSugerenciasClientes(false);
  };

  // Cargar detalles de venta
  const cargarDetallesVenta = async (ventaId, esModalPago = false) => {
    try {
      setLoadingDetalles(true);

      if (typeof window === "undefined") return;

      // Cargar detalles de la venta
      // Basándome en el código HTML antiguo: area=ventas&id=${idVenta}
      const response = await fetch(`${VENTAS_API_URL}?area=ventas&id=${ventaId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }

      const data = await response.json();
      // Debug: ver qué devuelve la API
      console.log("Datos de la API (ventas):", data);

      // La API puede devolver un array o un objeto
      const ventaData = Array.isArray(data) ? (data[0] || data) : (data.data || data.venta || data);

      // Debug: ver qué datos se extrajeron
      console.log("Datos extraídos de venta:", ventaData);

      // Función helper para obtener valores con múltiples variaciones
      const getValue = (obj, keys, fallbackObj = null) => {
        // Primero buscar en el objeto principal
        for (const key of keys) {
          if (obj && obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
            return obj[key];
          }
        }
        // Si no se encuentra y hay un objeto de fallback, buscar ahí también
        if (fallbackObj) {
          for (const key of keys) {
            if (fallbackObj[key] !== undefined && fallbackObj[key] !== null && fallbackObj[key] !== "") {
              return fallbackObj[key];
            }
          }
        }
        return null;
      };

      // Obtener datos completos de ventaSeleccionada como fallback
      const datosCompletosVenta = ventaSeleccionada?.datosCompletos || ventaSeleccionada || {};

      // Si estamos en el modal de pago, guardar también los datos del pago
      // Según el código HTML antiguo, cuando se llama a area=ventas&id=${idVenta} para el modal de pago,
      // devuelve un array donde el primer elemento contiene los datos del pago
      if (esModalPago) {
        const pagoData = Array.isArray(data) ? data[0] : data;
        setDatosPago({
          ID_PAGO: getValue(pagoData, ["ID_PAGO", "id_pago", "ID_VENTA", "id_venta", "ID", "id"]) || ventaSeleccionada?.id || "N/A",
          N_COMPROBANTE: getValue(pagoData, ["N_COMPROBANTE", "n_comprobante", "COMPROBANTE", "comprobante"]) || ventaSeleccionada?.comprobante || "N/A",
          COMPROBANTE: getValue(pagoData, ["COMPROBANTE", "comprobante", "TIPO_COMPROBANTE", "tipo_comprobante"]) || "N/A",
          TIPO_DE_PAGO: getValue(pagoData, ["TIPO_DE_PAGO", "tipo_de_pago", "FORMA_DE_PAGO", "forma_de_pago", "FORMA_PAGO", "forma_pago"]) || "N/A",
          FECHA_DE_PAGO: getValue(pagoData, ["FECHA_DE_PAGO", "fecha_de_pago", "FECHA_PAGO", "fecha_pago"]) || "",
          REGULARIZADO: getValue(pagoData, ["REGULARIZADO", "regularizado"]) || "NO",
          CANCELADO: getValue(pagoData, ["CANCELADO", "cancelado"]) || "NO",
          ESTADO: getValue(pagoData, ["ESTADO", "estado"]) || "COMPLETADO",
        });
      }

      // Cargar productos de la venta
      // Basándome en el código HTML antiguo: area=detalle_productos&id=${idVenta}
      const productosResponse = await fetch(`${VENTAS_API_URL}?area=detalle_productos&id=${ventaId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      let productos = [];
      if (productosResponse.ok) {
        const productosData = await productosResponse.json();
        console.log("Datos de productos:", productosData);
        productos = Array.isArray(productosData) ? productosData : (productosData.data || productosData.productos || [productosData]);
      }

      // Primero intentar usar los datos de ventaSeleccionada directamente si están disponibles
      // Si la API devuelve datos, usarlos; si no, usar ventaSeleccionada
      const clienteFinal = getValue(ventaData, ["CLIENTE", "cliente", "NOMBRE_CLIENTE", "nombre_cliente", "CLIENTE_NOMBRE", "cliente_nombre"], datosCompletosVenta) || ventaSeleccionada?.cliente;
      const asesorFinal = getValue(ventaData, ["ASESOR", "asesor", "NOMBRE_ASESOR", "nombre_asesor", "ASESOR_NOMBRE", "asesor_nombre"], datosCompletosVenta) || ventaSeleccionada?.asesor;
      const clasificacionFinal = getValue(ventaData, ["CLASIFICACION", "clasificacion", "CLASIFICACIÓN", "clasificación"], datosCompletosVenta) || ventaSeleccionada?.clasificacion;
      const regionFinal = getValue(ventaData, ["REGION", "region", "REGIÓN", "región", "NOMBRE_REGION", "nombre_region"], datosCompletosVenta) || ventaSeleccionada?.region;
      const distritoFinal = getValue(ventaData, ["DISTRITO", "distrito", "NOMBRE_DISTRITO", "nombre_distrito"], datosCompletosVenta) || ventaSeleccionada?.distrito;
      const lugarFinal = getValue(ventaData, ["LUGAR", "lugar", "NOMBRE_LUGAR", "nombre_lugar"], datosCompletosVenta) || ventaSeleccionada?.lugar;
      // Buscar salida de pedido con todas las variaciones posibles
      const salidaPedidoFinal = getValue(ventaData, [
        "SALIDA_DE_PEDIDO", "salida_de_pedido",
        "SALIDA_PEDIDO", "salida_pedido",
        "SALIDA", "salida",
        "SALIDA_PEDIDO_NOMBRE", "salida_pedido_nombre",
        "NOMBRE_SALIDA_PEDIDO", "nombre_salida_pedido"
      ], datosCompletosVenta) || ventaSeleccionada?.salidaPedido || ventaSeleccionada?.datosCompletos?.SALIDA_DE_PEDIDO || ventaSeleccionada?.datosCompletos?.salida_de_pedido || ventaSeleccionada?.datosCompletos?.SALIDA_PEDIDO || ventaSeleccionada?.datosCompletos?.salida_pedido;
      const observacionesFinal = getValue(ventaData, ["OBSERVACIONES", "observaciones", "OBSERVACION", "observacion", "NOTAS", "notas"], datosCompletosVenta) || ventaSeleccionada?.observaciones;

      setDetallesVenta({
        id: getValue(ventaData, ["ID_VENTA", "id_venta", "ID", "id"], datosCompletosVenta) || ventaSeleccionada?.id,
        cliente: clienteFinal || "N/A",
        fecha: getValue(ventaData, ["FECHA", "fecha", "FECHA_VENTA", "fecha_venta"], datosCompletosVenta) || ventaSeleccionada?.fecha || "",
        clasificacion: clasificacionFinal || "N/A",
        asesor: asesorFinal || "N/A",
        comprobante: getValue(ventaData, ["N_COMPROBANTE", "n_comprobante", "COMPROBANTE", "comprobante", "NUMERO_COMPROBANTE", "numero_comprobante"], datosCompletosVenta) || ventaSeleccionada?.comprobante || "N/A",
        region: regionFinal || "N/A",
        distrito: distritoFinal || "N/A",
        lugar: lugarFinal || "N/A",
        salidaPedido: salidaPedidoFinal || "N/A",
        estado: getValue(ventaData, ["ESTADO", "estado", "ESTADO_VENTA", "estado_venta"], datosCompletosVenta) || ventaSeleccionada?.estado || "COMPLETADO",
        cancelado: getValue(ventaData, ["CANCELADO", "cancelado"], datosCompletosVenta) || ventaSeleccionada?.cancelado || "NO",
        observaciones: observacionesFinal || "N/A",
        productos: productos.map(prod => ({
          codigo: getValue(prod, ["CODIGO", "codigo", "CODIGO_PRODUCTO", "codigo_producto"]) || "N/A",
          producto: getValue(prod, ["PRODUCTO", "producto", "NOMBRE_PRODUCTO", "nombre_producto", "DESCRIPCION", "descripcion"]) || "N/A",
          cantidad: getValue(prod, ["CANTIDAD", "cantidad"]) || 0,
          precio: getValue(prod, ["PRECIO_VENTA", "precio_venta", "PRECIO", "precio", "PRECIO_UNITARIO", "precio_unitario"]) || 0,
          total: parseFloat(getValue(prod, ["TOTAL", "total", "SUBTOTAL", "subtotal"]) || 0),
        })),
      });

      // Debug: ver qué valores finales se están usando
      console.log("Valores finales mapeados:", {
        cliente: clienteFinal,
        asesor: asesorFinal,
        clasificacion: clasificacionFinal,
        region: regionFinal,
        distrito: distritoFinal,
        lugar: lugarFinal,
        salidaPedido: salidaPedidoFinal,
        observaciones: observacionesFinal,
      });

      // Cargar pagos de la venta
      // Basándome en el código HTML antiguo: area=comprobantes_pagados&id=${idVenta}
      const pagosResponse = await fetch(`${VENTAS_API_URL}?area=comprobantes_pagados&id=${ventaId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (pagosResponse.ok) {
        const pagosData = await pagosResponse.json();
        const pagos = Array.isArray(pagosData) ? pagosData : (pagosData.data || pagosData.pagos || []);
        console.log("Datos de pagos recibidos de API:", pagos);
        setPagosVenta(pagos);
      }
    } catch (error) {
      console.error("Error cargando detalles:", error);
      setModalMensaje({ open: true, tipo: "error", mensaje: "Error al cargar los detalles de la venta." });
    } finally {
      setLoadingDetalles(false);
    }
  };

  const handleVer = async (venta) => {
    setVentaSeleccionada(venta);
    setModalVerOpen(true);
    await cargarDetallesVenta(venta.id);
  };

  const handlePago = async (venta) => {
    setVentaSeleccionada(venta);
    setModalPagoOpen(true);
    setDatosPago(null); // Limpiar datos anteriores
    await cargarDetallesVenta(venta.id, true); // true indica que es para el modal de pago
  };

  const handleEliminar = (venta) => {
    setVentaSeleccionada(venta);
    setModalConfirmarEliminar({
      open: true,
      venta: venta,
      mensaje: `¿Está seguro que desea eliminar la venta del cliente "${venta.cliente}" con comprobante "${venta.comprobante}"?`
    });
  };

  const confirmarEliminarVenta = async () => {
    if (!modalConfirmarEliminar.venta) return;

    try {
      if (typeof window === "undefined") return;

      // Basándome en el código HTML antiguo: area=ventas&forma=eliminar_venta con PUT
      const response = await fetch(`${VENTAS_API_URL}?area=ventas&forma=eliminar_venta`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          id: modalConfirmarEliminar.venta.id.toString()
        }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }

      setModalMensaje({ open: true, tipo: "success", mensaje: "Venta eliminada exitosamente." });
      setModalConfirmarEliminar({ open: false, venta: null, mensaje: "" });
      setVentaSeleccionada(null);
      await cargarVentas();
    } catch (error) {
      console.error("Error eliminando venta:", error);
      setModalMensaje({ open: true, tipo: "error", mensaje: "Error al eliminar la venta." });
    }
  };

  // Búsqueda detallada
  const handleBusquedaDetallada = async () => {
    try {
      setLoadingVentas(true);

      if (typeof window === "undefined") return;

      // Basándome en el código HTML antiguo: area=busqueda_cliente_comprobante&metodo=${metodo}&id=${id}
      let url;
      if (busquedaDetallada.tipoBusqueda === "comprobante") {
        if (!busquedaDetallada.numeroComprobante) {
          setModalMensaje({ open: true, tipo: "error", mensaje: "Por favor ingrese el número de comprobante." });
          return;
        }
        url = `${VENTAS_API_URL}?area=busqueda_cliente_comprobante&metodo=COMPROBANTE&id=${encodeURIComponent(busquedaDetallada.numeroComprobante)}`;
      } else {
        if (!busquedaDetallada.clienteId) {
          setModalMensaje({ open: true, tipo: "error", mensaje: "Por favor seleccione un cliente de la lista." });
          return;
        }
        url = `${VENTAS_API_URL}?area=busqueda_cliente_comprobante&metodo=CLIENTE&id=${encodeURIComponent(busquedaDetallada.clienteId)}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }

      const data = await response.json();
      const ventasData = Array.isArray(data) ? data : (data.data || data.ventas || []);

      const ventasFormateadas = ventasData.map(venta => ({
        id: venta.ID_VENTA || venta.id_venta || venta.ID || venta.id,
        cliente: venta.CLIENTE || venta.cliente || "N/A",
        fecha: formatDate(venta.FECHA || venta.fecha),
        asesor: venta.ASESOR || venta.asesor || "N/A",
        comprobante: venta.N_COMPROBANTE || venta.n_comprobante || venta.COMPROBANTE || venta.comprobante || "N/A",
        estado: venta.ESTADO || venta.estado || "COMPLETADO",
        cancelado: venta.CANCELADO || venta.cancelado || "NO",
        datosCompletos: venta,
      }));

      setResultadosBusquedaDetallada(ventasFormateadas);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error en búsqueda detallada:", error);
      setModalMensaje({ open: true, tipo: "error", mensaje: "Error al realizar la búsqueda." });
    } finally {
      setLoadingVentas(false);
    }
  };

  // Exportar Excel de todas las ventas
  const handleExportarExcel = async () => {
    try {
      if (typeof window === "undefined") return;

      // Para exportar todas las ventas, simplemente usamos area=ventas y generamos el Excel localmente
      const response = await fetch(`${VENTAS_API_URL}?area=ventas`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }

      const data = await response.json();
      const ventasData = Array.isArray(data) ? data : (data.data || data.ventas || []);

      if (!ventasData.length) {
        setModalMensaje({ open: true, tipo: "error", mensaje: "No hay datos para exportar." });
        return;
      }

      // Generar Excel usando xlsx
      const XLSX = await import("xlsx");
      const worksheet = XLSX.utils.json_to_sheet(ventasData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Ventas");

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `ventas_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setModalMensaje({ open: true, tipo: "success", mensaje: "Excel exportado exitosamente." });
    } catch (error) {
      console.error("Error exportando Excel:", error);
      setModalMensaje({ open: true, tipo: "error", mensaje: "Error al exportar el Excel." });
    }
  };

  // Exportar Excel por mes
  const handleExportarExcelPorMes = async () => {
    if (mesesSeleccionados.length === 0) {
      setModalMensaje({ open: true, tipo: "error", mensaje: "Por favor seleccione al menos un mes." });
      return;
    }

    try {
      if (typeof window === "undefined") return;
      const token = localStorage.getItem("token");
      if (!token || token.trim() === "") {
        setModalMensaje({ open: true, tipo: "error", mensaje: "No se encontró token de autenticación." });
        return;
      }

      const mesesNumeros = mesesSeleccionados.map(mes => meses.indexOf(mes) + 1);
      const minMes = Math.min(...mesesNumeros);
      const maxMes = Math.max(...mesesNumeros);

      // Basándome en el código HTML antiguo: area=reporte&min=${min}&max=${max}&year=${year}
      const response = await fetch(`${VENTAS_API_URL}?area=reporte&min=${minMes}&max=${maxMes}&year=${ano}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }

      const data = await response.json();
      const ventasData = Array.isArray(data) ? data : (data.data || data.ventas || []);

      if (!ventasData.length) {
        setModalMensaje({ open: true, tipo: "error", mensaje: "No hay datos para exportar en los meses seleccionados." });
        return;
      }

      const XLSX = await import("xlsx");
      const worksheet = XLSX.utils.json_to_sheet(ventasData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Ventas");

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `ventas_${ano}_${minMes}-${maxMes}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setModalMensaje({ open: true, tipo: "success", mensaje: "Excel exportado exitosamente." });
    } catch (error) {
      console.error("Error exportando Excel por mes:", error);
      setModalMensaje({ open: true, tipo: "error", mensaje: "Error al exportar el Excel." });
    }
  };

  // Exportar ventas sin completar
  const handleDescargarVentasSinCompletar = async () => {
    try {
      if (typeof window === "undefined") return;

      // Basándome en el código HTML antiguo: area=comprobantes_sin_cancelar
      const response = await fetch(`${VENTAS_API_URL}?area=comprobantes_sin_cancelar`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }

      const data = await response.json();
      const ventasData = Array.isArray(data) ? data : (data.data || data.ventas || []);

      if (!ventasData.length) {
        setModalMensaje({ open: true, tipo: "info", mensaje: "No hay ventas sin completar." });
        return;
      }

      const XLSX = await import("xlsx");
      const worksheet = XLSX.utils.json_to_sheet(ventasData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Ventas Sin Completar");

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `ventas_sin_completar_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setModalMensaje({ open: true, tipo: "success", mensaje: "Excel exportado exitosamente." });
    } catch (error) {
      console.error("Error exportando ventas sin completar:", error);
      setModalMensaje({ open: true, tipo: "error", mensaje: "Error al exportar el Excel." });
    }
  };

  const toggleMes = (mes) => {
    setMesesSeleccionados((prev) =>
      prev.includes(mes)
        ? prev.filter((m) => m !== mes)
        : [...prev, mes]
    );
  };

  // Calcular paginación
  const totalPages = Math.ceil(ventasFiltradas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentVentas = ventasFiltradas.slice(startIndex, endIndex);

  // Calcular totales para modales
  const totalProductos = detallesVenta?.productos?.reduce((acc, item) => acc + (item.total || 0), 0) || 0;
  const totalPagado = pagosVenta?.reduce((acc, pago) => acc + (parseFloat(pago.MONTO || pago.monto || pago.MONTO_PAGADO || pago.monto_pagado || 0)), 0) || 0;
  const saldoPendiente = totalProductos - totalPagado;
  const porcentajePagado = totalProductos > 0 ? ((totalPagado / totalProductos) * 100).toFixed(1) : 0;

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
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Ventas Registradas</h1>
                    </div>
                  </div>
                  {apiConectada && (
                    <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-green-50 border border-green-300 rounded-lg">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-xs sm:text-sm font-semibold text-green-700">API Conectada</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 1: Ventas Registradas */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200/60 p-6 mb-6">
                {/* Barra de Búsqueda */}
                <div className="mb-6">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por cliente, comprobante o asesor..."
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002D5A] focus:border-[#002D5A] transition-all text-sm text-gray-900 placeholder:text-gray-600"
                      />
                    </div>
                    <button
                      onClick={handleExportarExcel}
                      className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Exportar Excel</span>
                    </button>
                  </div>
                </div>

                {/* Tabla de Ventas */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-blue-700 border-b-2 border-blue-800">
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">CLIENTE</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">FECHA</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ASESOR</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">COMPROBANTE</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ESTADO</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">CANCELADO</th>
                          <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ACCIONES</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {loadingVentas ? (
                          <tr>
                            <td colSpan="7" className="px-3 py-8 text-center text-gray-500">
                              <div className="flex items-center justify-center space-x-2">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700"></div>
                                <span>Cargando ventas...</span>
                              </div>
                            </td>
                          </tr>
                        ) : currentVentas.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="px-3 py-8 text-center text-gray-500">
                              No se encontraron ventas
                            </td>
                          </tr>
                        ) : (
                          currentVentas.map((venta) => (
                            <tr key={venta.id} className="hover:bg-slate-200 transition-colors">
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{venta.cliente}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{venta.fecha}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{venta.asesor}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{venta.comprobante}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                                <span className={`px-2 py-1 rounded text-[10px] font-semibold ${(venta.estado || "").toUpperCase() === "CANCELADO"
                                  ? "bg-red-100 text-red-800"
                                  : (venta.estado || "").toUpperCase() === "ANULADO"
                                    ? "bg-orange-100 text-orange-800"
                                    : (venta.estado || "").toUpperCase() === "COMPLETADO"
                                      ? "bg-green-100 text-green-800"
                                      : (venta.estado || "").toUpperCase() === "PENDIENTE"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-gray-100 text-gray-800"
                                  }`}>
                                  {venta.estado}
                                </span>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{venta.cancelado}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center space-x-2">
                                  <button
                                    onClick={() => handleVer(venta)}
                                    className="flex items-center space-x-1 px-2.5 py-1 bg-blue-600 border-2 border-blue-700 hover:bg-blue-700 hover:border-blue-800 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    <span>Ver</span>
                                  </button>
                                  <button
                                    onClick={() => handlePago(venta)}
                                    className="flex items-center space-x-1 px-2.5 py-1 bg-green-600 border-2 border-green-700 hover:bg-green-700 hover:border-green-800 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>Pago</span>
                                  </button>
                                  <button
                                    onClick={() => handleEliminar(venta)}
                                    className="flex items-center space-x-1 px-2.5 py-1 bg-red-600 border-2 border-red-700 hover:bg-red-700 hover:border-red-800 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    <span>Eliminar</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Paginación (diseño estándar dentro del cuadro) */}
                  <div className="bg-slate-200 px-3 py-2 flex items-center justify-between border-t-2 border-slate-300">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      «
                    </button>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      &lt;
                    </button>
                    <span className="text-[10px] text-gray-700 font-medium">
                      Página {currentPage} de {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
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
                </div>
              </div>

              {/* Card 2: Búsqueda Detallada */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200/60 p-6 mb-6">
                <button
                  onClick={() => setBusquedaDetalladaOpen(!busquedaDetalladaOpen)}
                  className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-[#002D5A] to-[#002D5A] text-white rounded-lg hover:shadow-md transition-all"
                >
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <h2 className="text-lg font-bold">Búsqueda Detallada</h2>
                  </div>
                  <svg
                    className={`w-5 h-5 transition-transform duration-200 ${busquedaDetalladaOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {busquedaDetalladaOpen && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                    {busquedaDetallada.tipoBusqueda === "comprobante" ? (
                      <div className="flex flex-row gap-4 mb-4 items-end">
                        <div className="w-48">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Tipo de Búsqueda
                          </label>
                          <select
                            value={busquedaDetallada.tipoBusqueda}
                            onChange={(e) => {
                              setBusquedaDetallada({ ...busquedaDetallada, tipoBusqueda: e.target.value, numeroComprobante: "", cliente: "", clienteId: "" });
                              setResultadosBusquedaDetallada([]);
                            }}
                            className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002D5A] focus:border-[#002D5A] transition-all text-sm text-gray-900"
                          >
                            <option value="comprobante">Comprobante</option>
                            <option value="cliente">Cliente</option>
                          </select>
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Ingrese el número de comprobante
                          </label>
                          <input
                            type="text"
                            value={busquedaDetallada.numeroComprobante}
                            onChange={(e) => setBusquedaDetallada({ ...busquedaDetallada, numeroComprobante: e.target.value })}
                            placeholder="Ingrese el número de comprobante"
                            className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002D5A] focus:border-[#002D5A] transition-all text-sm text-gray-900"
                          />
                        </div>
                        <div className="flex items-end">
                          <button
                            onClick={handleBusquedaDetallada}
                            className="px-4 py-2.5 bg-gradient-to-br from-[#002D5A] to-[#002D5A] text-white rounded-lg font-semibold hover:shadow-md transition-all duration-200 shadow-sm whitespace-nowrap"
                          >
                            Buscar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-row gap-4 mb-4 items-end">
                        <div className="w-48">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Tipo de Búsqueda
                          </label>
                          <select
                            value={busquedaDetallada.tipoBusqueda}
                            onChange={(e) => {
                              setBusquedaDetallada({ ...busquedaDetallada, tipoBusqueda: e.target.value, numeroComprobante: "", cliente: "", clienteId: "" });
                              setResultadosBusquedaDetallada([]);
                            }}
                            className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002D5A] focus:border-[#002D5A] transition-all text-sm text-gray-900"
                          >
                            <option value="comprobante">Comprobante</option>
                            <option value="cliente">Cliente</option>
                          </select>
                        </div>
                        <div className="flex-1 relative" ref={clienteSuggestionsRef}>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Cliente
                          </label>
                          <input
                            ref={clienteInputRef}
                            type="text"
                            value={busquedaDetallada.cliente}
                            onChange={(e) => {
                              setBusquedaDetallada({ ...busquedaDetallada, cliente: e.target.value });
                              buscarClientes(e.target.value);
                            }}
                            onFocus={() => {
                              if (busquedaDetallada.cliente) buscarClientes(busquedaDetallada.cliente);
                            }}
                            placeholder="Escriba el nombre del cliente"
                            className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002D5A] focus:border-[#002D5A] transition-all text-sm text-gray-900"
                          />
                          <SuggestionsList
                            suggestions={sugerenciasClientes}
                            onSelect={seleccionarCliente}
                            show={mostrarSugerenciasClientes}
                          />
                        </div>
                        <div className="flex items-end">
                          <button
                            onClick={handleBusquedaDetallada}
                            className="px-6 py-2.5 bg-gradient-to-br from-[#002D5A] to-[#002D5A] text-white rounded-lg font-semibold hover:shadow-md transition-all duration-200 shadow-sm"
                          >
                            Buscar
                          </button>
                        </div>
                      </div>
                    )}

                    {resultadosBusquedaDetallada.length > 0 && busquedaDetalladaOpen && (
                      <div className="mt-4">
                        <p className="text-sm font-semibold text-gray-700 mb-3">
                          Resultados encontrados: {resultadosBusquedaDetallada.length}
                        </p>
                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-gradient-to-r from-[#002D5A] to-[#002D5A] text-white">
                                <th className="px-3 py-2 text-left font-semibold uppercase">Cliente</th>
                                <th className="px-3 py-2 text-left font-semibold uppercase">Fecha</th>
                                <th className="px-3 py-2 text-left font-semibold uppercase">Asesor</th>
                                <th className="px-3 py-2 text-left font-semibold uppercase">Comprobante</th>
                                <th className="px-3 py-2 text-left font-semibold uppercase">Estado</th>
                                <th className="px-3 py-2 text-left font-semibold uppercase">Cancelado</th>
                                <th className="px-3 py-2 text-center font-semibold uppercase">Acciones</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {resultadosBusquedaDetallada.map((venta) => (
                                <tr key={venta.id} className="bg-white hover:bg-gray-50 transition-colors">
                                  <td className="px-3 py-2 text-gray-800">{venta.cliente}</td>
                                  <td className="px-3 py-2 text-gray-800">{venta.fecha}</td>
                                  <td className="px-3 py-2 text-gray-800">{venta.asesor}</td>
                                  <td className="px-3 py-2 text-gray-800">{venta.comprobante}</td>
                                  <td className="px-3 py-2">
                                    <span className={`inline-flex px-2 py-1 rounded text-[10px] font-semibold ${(venta.estado || "").toUpperCase() === "CANCELADO"
                                      ? "bg-red-100 text-red-800"
                                      : (venta.estado || "").toUpperCase() === "ANULADO"
                                        ? "bg-orange-100 text-orange-800"
                                        : (venta.estado || "").toUpperCase() === "COMPLETADO"
                                          ? "bg-green-100 text-green-800"
                                          : (venta.estado || "").toUpperCase() === "PENDIENTE"
                                            ? "bg-yellow-100 text-yellow-800"
                                            : "bg-gray-100 text-gray-800"
                                      }`}>
                                      {venta.estado}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2">
                                    <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-semibold ${venta.cancelado === "SI"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-green-100 text-green-800"
                                      }`}>
                                      {venta.cancelado}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2">
                                    <div className="flex items-center justify-center gap-2">
                                      <button
                                        onClick={() => handleVer(venta)}
                                        className="px-2.5 py-1 bg-blue-500 border-2 border-blue-600 hover:bg-blue-600 hover:border-blue-700 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] flex items-center space-x-1"
                                        title="Ver"
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={() => handlePago(venta)}
                                        className="px-2.5 py-1 bg-green-500 border-2 border-green-600 hover:bg-green-600 hover:border-green-700 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] flex items-center space-x-1"
                                        title="Pago"
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={() => handleEliminar(venta)}
                                        className="px-2.5 py-1 bg-red-500 border-2 border-red-600 hover:bg-red-600 hover:border-red-700 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] flex items-center space-x-1"
                                        title="Eliminar"
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Card 3: Ventas por Mes */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200/60 p-6 mb-6">
                <div className="p-4 bg-gradient-to-r from-[#002D5A] to-[#002D5A] text-white rounded-lg mb-4">
                  <h2 className="text-lg font-bold">Ventas por Mes</h2>
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
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Año
                      </label>
                      <select
                        value={ano}
                        onChange={(e) => setAno(e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002D5A] focus:border-[#002D5A] transition-all text-sm text-black"
                      >
                        <option value="2023">2023</option>
                        <option value="2024">2024</option>
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                        <option value="2027">2027</option>
                      </select>
                    </div>
                    <button
                      onClick={handleExportarExcelPorMes}
                      className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Descargar Excel</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Card 4: Ventas sin Completar */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200/60 p-6">
                <div className="p-4 bg-gradient-to-r from-[#002D5A] to-[#002D5A] text-white rounded-lg mb-4">
                  <h2 className="text-lg font-bold">Ventas sin Completar</h2>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Descargue un reporte de todas las ventas que aún no han sido completadas
                </p>
                <button
                  onClick={handleDescargarVentasSinCompletar}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Descargar Ventas sin Completar</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
      {/* Modal Ver Venta */}
      <Modal
        isOpen={modalVerOpen && !!ventaSeleccionada}
        onClose={() => {
          setModalVerOpen(false);
          setVentaSeleccionada(null);
        }}
        title="Detalles de la Venta"
        size="full"
      >
        {ventaSeleccionada && (
          <div className="space-y-6">
            {loadingDetalles ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Columna izquierda: Datos de la Venta */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-blue-700 text-white">
                      <div className="flex items-center space-x-2">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4 6h16M4 10h16M4 14h10"
                          />
                        </svg>
                        <span className="text-sm font-semibold">
                          Datos de la Venta
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold">
                        ID VENTA {detallesVenta?.id || ventaSeleccionada.id}
                      </span>
                    </div>

                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                        <div>
                          <p className="font-semibold text-gray-500 text-[10px] uppercase tracking-wide">
                            Cliente
                          </p>
                          <p className="mt-1 text-[11px] font-semibold text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                            {(detallesVenta?.cliente && detallesVenta.cliente !== "N/A") ? detallesVenta.cliente : (ventaSeleccionada?.cliente && ventaSeleccionada.cliente !== "N/A" ? ventaSeleccionada.cliente : "N/A")}
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-500 text-[10px] uppercase tracking-wide">
                            Fecha
                          </p>
                          <p className="mt-1 text-[11px] font-semibold text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                            {detallesVenta?.fecha ? formatDate(detallesVenta.fecha) : (ventaSeleccionada?.fecha || "N/A")}
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-500 text-[10px] uppercase tracking-wide">
                            Asesor
                          </p>
                          <p className="mt-1 text-[11px] font-semibold text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                            {(detallesVenta?.asesor && detallesVenta.asesor !== "N/A") ? detallesVenta.asesor : (ventaSeleccionada?.asesor && ventaSeleccionada.asesor !== "N/A" ? ventaSeleccionada.asesor : "N/A")}
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-500 text-[10px] uppercase tracking-wide">
                            N° Comprobante
                          </p>
                          <p className="mt-1 text-[11px] font-semibold text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                            {(detallesVenta?.comprobante && detallesVenta.comprobante !== "N/A") ? detallesVenta.comprobante : (ventaSeleccionada?.comprobante && ventaSeleccionada.comprobante !== "N/A" ? ventaSeleccionada.comprobante : "N/A")}
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-500 text-[10px] uppercase tracking-wide">
                            Clasificación
                          </p>
                          <p className="mt-1 text-[11px] font-semibold text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                            {(detallesVenta?.clasificacion && detallesVenta.clasificacion !== "N/A") ? detallesVenta.clasificacion : (ventaSeleccionada?.clasificacion && ventaSeleccionada.clasificacion !== "N/A" ? ventaSeleccionada.clasificacion : "N/A")}
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-500 text-[10px] uppercase tracking-wide">
                            Región
                          </p>
                          <p className="mt-1 text-[11px] font-semibold text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                            {(detallesVenta?.region && detallesVenta.region !== "N/A") ? detallesVenta.region : (ventaSeleccionada?.region && ventaSeleccionada.region !== "N/A" ? ventaSeleccionada.region : "N/A")}
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-500 text-[10px] uppercase tracking-wide">
                            Distrito
                          </p>
                          <p className="mt-1 text-[11px] font-semibold text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                            {(detallesVenta?.distrito && detallesVenta.distrito !== "N/A") ? detallesVenta.distrito : (ventaSeleccionada?.distrito && ventaSeleccionada.distrito !== "N/A" ? ventaSeleccionada.distrito : "N/A")}
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-500 text-[10px] uppercase tracking-wide">
                            Lugar
                          </p>
                          <p className="mt-1 text-[11px] font-semibold text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                            {(detallesVenta?.lugar && detallesVenta.lugar !== "N/A") ? detallesVenta.lugar : (ventaSeleccionada?.lugar && ventaSeleccionada.lugar !== "N/A" ? ventaSeleccionada.lugar : "N/A")}
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-500 text-[10px] uppercase tracking-wide">
                            Salida de pedido
                          </p>
                          <p className="mt-1 text-[11px] font-semibold text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                            {(() => {
                              // Intentar obtener de detallesVenta primero
                              if (detallesVenta?.salidaPedido && detallesVenta.salidaPedido !== "N/A") {
                                return detallesVenta.salidaPedido;
                              }
                              // Luego de ventaSeleccionada
                              if (ventaSeleccionada?.salidaPedido && ventaSeleccionada.salidaPedido !== "N/A") {
                                return ventaSeleccionada.salidaPedido;
                              }
                              // Finalmente de datosCompletos
                              const datosCompletos = ventaSeleccionada?.datosCompletos || {};
                              const salida = datosCompletos.SALIDA_DE_PEDIDO || datosCompletos.salida_de_pedido || datosCompletos.SALIDA_PEDIDO || datosCompletos.salida_pedido || datosCompletos.SALIDA || datosCompletos.salida;
                              return salida && salida !== "N/A" ? salida : "N/A";
                            })()}
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-500 text-[10px] uppercase tracking-wide">
                            Estado
                          </p>
                          <div className="mt-1">
                            <span className={`inline-flex px-2 py-1 rounded text-[10px] font-semibold ${((detallesVenta?.estado || ventaSeleccionada.estado || "COMPLETADO") + "").toUpperCase() === "CANCELADO"
                              ? "bg-red-100 text-red-800"
                              : ((detallesVenta?.estado || ventaSeleccionada.estado || "COMPLETADO") + "").toUpperCase() === "ANULADO"
                                ? "bg-orange-100 text-orange-800"
                                : ((detallesVenta?.estado || ventaSeleccionada.estado || "COMPLETADO") + "").toUpperCase() === "COMPLETADO"
                                  ? "bg-green-100 text-green-800"
                                  : ((detallesVenta?.estado || ventaSeleccionada.estado || "COMPLETADO") + "").toUpperCase() === "PENDIENTE"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-gray-100 text-gray-800"
                              }`}>
                              {detallesVenta?.estado || ventaSeleccionada.estado || "COMPLETADO"}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-500 text-[10px] uppercase tracking-wide">
                            Cancelado
                          </p>
                          <div className="mt-1">
                            <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-semibold ${(detallesVenta?.cancelado || ventaSeleccionada.cancelado || "NO").toUpperCase() === "SI"
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                              }`}>
                              {detallesVenta?.cancelado || ventaSeleccionada.cancelado || "NO"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-gray-200">
                        <p className="font-semibold text-gray-500 text-[10px] uppercase tracking-wide mb-1">
                          Observaciones
                        </p>
                        <p className="text-[11px] text-gray-700 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 min-h-[60px]">
                          {(detallesVenta?.observaciones && detallesVenta.observaciones !== "N/A") ? detallesVenta.observaciones : (ventaSeleccionada?.observaciones && ventaSeleccionada.observaciones !== "N/A" ? ventaSeleccionada.observaciones : "N/A")}
                        </p>
                      </div>

                      {/* Botón Editar */}
                      <div className="pt-3 border-t border-gray-200">
                        <button
                          className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98] flex items-center justify-center space-x-1.5"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          <span>Editar</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Columna derecha: Productos Comprados */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-blue-700 text-white">
                      <div className="flex items-center space-x-2">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 3h2l.4 2M7 13h10l3-8H6.4M7 13L5.4 5M7 13l-2 7h14M10 21a1 1 0 11-2 0 1 1 0 012 0zm8 0a1 1 0 11-2 0 1 1 0 012 0z"
                          />
                        </svg>
                        <span className="text-sm font-semibold">
                          Productos Comprados
                        </span>
                      </div>
                    </div>
                    <div className="p-4 space-y-4">
                      {detallesVenta?.productos && detallesVenta.productos.length > 0 ? (
                        <>
                          <div className="overflow-x-auto rounded-xl border border-gray-200">
                            <table className="w-full text-[11px]">
                              <thead>
                                <tr className="bg-slate-100 border-b border-gray-200">
                                  <th className="px-3 py-2 text-left font-semibold text-gray-700">
                                    Código
                                  </th>
                                  <th className="px-3 py-2 text-left font-semibold text-gray-700">
                                    Producto
                                  </th>
                                  <th className="px-3 py-2 text-right font-semibold text-gray-700">
                                    Cantidad
                                  </th>
                                  <th className="px-3 py-2 text-right font-semibold text-gray-700">
                                    Precio
                                  </th>
                                  <th className="px-3 py-2 text-right font-semibold text-gray-700">
                                    Total
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {detallesVenta.productos.map((item, index) => (
                                  <tr key={index} className="bg-white">
                                    <td className="px-3 py-2 whitespace-nowrap text-gray-800">
                                      {item.codigo}
                                    </td>
                                    <td className="px-3 py-2 text-gray-800">
                                      {item.producto}
                                    </td>
                                    <td className="px-3 py-2 text-right text-gray-800">
                                      {item.cantidad}
                                    </td>
                                    <td className="px-3 py-2 text-right text-gray-800">
                                      {formatCurrency(item.precio)}
                                    </td>
                                    <td className="px-3 py-2 text-right font-semibold text-gray-900">
                                      {formatCurrency(item.total)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <div className="flex items-center justify-between bg-slate-100 border border-slate-200 rounded-lg px-4 py-2">
                            <span className="text-[11px] font-semibold text-gray-700 uppercase tracking-wide">
                              Total General:
                            </span>
                            <span className="text-sm font-bold text-gray-900">
                              {formatCurrency(totalProductos)}
                            </span>
                          </div>

                          {/* Botón Editar */}
                          <button
                            className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98] flex items-center justify-center space-x-1.5"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                            <span>Editar</span>
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                          <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                          <p className="text-sm font-medium">No hay productos registrados</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="flex items-center justify-end pt-2 border-t border-gray-100">
              <button
                onClick={() => {
                  setModalVerOpen(false);
                  setVentaSeleccionada(null);
                  setDetallesVenta(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[#002D5A] to-[#002D5A] rounded-lg shadow-sm hover:shadow-md hover:scale-[1.02] transition-all"
              >
                Cerrar Modal
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Pago / Estado de Pago */}
      <Modal
        isOpen={modalPagoOpen && !!ventaSeleccionada}
        onClose={() => {
          setModalPagoOpen(false);
          setVentaSeleccionada(null);
        }}
        title="Estado de Pago"
        size="full"
      >
        {ventaSeleccionada && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Columna izquierda */}
              <div className="space-y-4">
                {/* Información de Pago */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-blue-700 text-white">
                    <div className="flex items-center space-x-2">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-sm font-semibold">
                        Información de Pago
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                      <div>
                        <p className="font-semibold text-gray-500 text-[10px] uppercase tracking-wide">
                          ID Pago
                        </p>
                        <p className="mt-1 text-[11px] font-semibold text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                          {datosPago?.ID_PAGO || ventaSeleccionada?.id || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-500 text-[10px] uppercase tracking-wide">
                          N° Comprobante
                        </p>
                        <p className="mt-1 text-[11px] font-semibold text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                          {datosPago?.N_COMPROBANTE || ventaSeleccionada?.comprobante || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-500 text-[10px] uppercase tracking-wide">
                          Tipo Comprobante
                        </p>
                        <p className="mt-1 text-[11px] font-semibold text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                          {datosPago?.COMPROBANTE || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-500 text-[10px] uppercase tracking-wide">
                          Forma de Pago
                        </p>
                        <p className="mt-1 text-[11px] font-semibold text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                          {datosPago?.TIPO_DE_PAGO || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-500 text-[10px] uppercase tracking-wide">
                          Fecha de Pago
                        </p>
                        <p className="mt-1 text-[11px] font-semibold text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                          {datosPago?.FECHA_DE_PAGO ? formatDate(datosPago.FECHA_DE_PAGO) : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-500 text-[10px] uppercase tracking-wide">
                          Regularizado
                        </p>
                        <div className="mt-1">
                          <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-semibold ${(datosPago?.REGULARIZADO || "NO").toUpperCase() === "SI"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                            }`}>
                            {datosPago?.REGULARIZADO || "NO"}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-500 text-[10px] uppercase tracking-wide">
                          Cancelado
                        </p>
                        <div className="mt-1">
                          <span className={`inline-flex px-2 py-1 rounded text-[10px] font-semibold ${(datosPago?.CANCELADO || "NO").toUpperCase() === "SI"
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                            }`}>
                            {datosPago?.CANCELADO || "NO"}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-500 text-[10px] uppercase tracking-wide">
                          Estado
                        </p>
                        <div className="mt-1">
                          <span className={`inline-flex px-2 py-1 rounded text-[10px] font-semibold ${(datosPago?.ESTADO || "COMPLETADO").toUpperCase() === "CANCELADO"
                            ? "bg-red-100 text-red-800"
                            : (datosPago?.ESTADO || "COMPLETADO").toUpperCase() === "ANULADO"
                              ? "bg-orange-100 text-orange-800"
                              : (datosPago?.ESTADO || "COMPLETADO").toUpperCase() === "COMPLETADO"
                                ? "bg-green-100 text-green-800"
                                : (datosPago?.ESTADO || "").toUpperCase() === "PENDIENTE"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                            }`}>
                            {datosPago?.ESTADO || "COMPLETADO"}
                          </span>
                        </div>
                      </div>
                      {(datosPago?.ANULADO || ventaSeleccionada?.anulado) && (
                        <div>
                          <p className="font-semibold text-gray-500 text-[10px] uppercase tracking-wide">
                            Anulado
                          </p>
                          <div className="mt-1">
                            <span className={`inline-flex px-2 py-1 rounded text-[10px] font-semibold ${(datosPago?.ANULADO || ventaSeleccionada?.anulado || "NO").toUpperCase() === "SI"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-gray-100 text-gray-800"
                              }`}>
                              {datosPago?.ANULADO || ventaSeleccionada?.anulado || "NO"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => {
                          setFormularioEditarPago({
                            tipo_comprobante: datosPago?.COMPROBANTE || "",
                            forma_pago: datosPago?.TIPO_DE_PAGO || "",
                            fecha_pago: datosPago?.FECHA_DE_PAGO || "",
                            regularizado: datosPago?.REGULARIZADO || "NO",
                            cancelado: datosPago?.CANCELADO || "NO",
                            estado: datosPago?.ESTADO || "COMPLETADO",
                            anulado: datosPago?.ANULADO || ventaSeleccionada?.anulado || "NO"
                          });
                          setModalEditarPagoOpen(true);
                        }}
                        className="flex items-center space-x-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Editar</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Montos Pagados */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-blue-700 text-white">
                    <div className="flex items-center space-x-2">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-sm font-semibold">
                        Montos Pagados
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    {pagosVenta && pagosVenta.length > 0 ? (
                      <div className="rounded-lg border border-gray-200 overflow-hidden">
                        <table className="w-full text-[11px]">
                          <thead>
                            <tr className="bg-green-600 text-white">
                              <th className="px-3 py-2.5 text-left font-bold text-[10px] uppercase tracking-wide">Nombre</th>
                              <th className="px-3 py-2.5 text-left font-bold text-[10px] uppercase tracking-wide">Comprobante</th>
                              <th className="px-3 py-2.5 text-right font-bold text-[10px] uppercase tracking-wide">Monto</th>
                              <th className="px-3 py-2.5 text-left font-bold text-[10px] uppercase tracking-wide">Medio de Pago</th>
                              <th className="px-3 py-2.5 text-left font-bold text-[10px] uppercase tracking-wide">Fecha Regularización</th>
                              <th className="px-3 py-2.5 text-center font-bold text-[10px] uppercase tracking-wide">Validación</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {pagosVenta.map((pago, index) => {
                              // Obtener los valores reales de la API con múltiples variantes posibles
                              const nombre = pago.NOMBRE || pago.nombre || pago.NOMBRE_PERSONA || pago.nombre_persona || pago.NOMBRE_COMPLETO || pago.nombre_completo || "N/A";
                              // Usar el comprobante de Información de Pago (el mismo que se muestra arriba)
                              const comprobante = datosPago?.N_COMPROBANTE || ventaSeleccionada?.comprobante || pago.COMPROBANTE || pago.comprobante || pago.N_COMPROBANTE || pago.n_comprobante || pago.NUMERO_COMPROBANTE || pago.numero_comprobante || pago.COMPROBANTE_PAGO || pago.comprobante_pago || "N/A";
                              const medioPago = pago.MEDIO_PAGO || pago.medio_pago || pago.MEDIO_DE_PAGO || pago.medio_de_pago || pago.FORMA_PAGO || pago.forma_pago || pago.FORMA_DE_PAGO || pago.forma_de_pago || pago.TIPO_PAGO || pago.tipo_pago || datosPago?.TIPO_DE_PAGO || "N/A";
                              const monto = pago.MONTO || pago.monto || pago.MONTO_PAGADO || pago.monto_pagado || pago.MONTO_TOTAL || pago.monto_total || 0;
                              const fechaReg = pago.FECHA_REGULARIZACION || pago.fecha_regularizacion || pago.FECHA_REG || pago.fecha_reg || pago.FECHA_PAGO || pago.fecha_pago || pago.FECHA || pago.fecha || "N/A";
                              const validacion = pago.VALIDACION || pago.validacion || pago.ESTADO_VALIDACION || pago.estado_validacion || "VALIDO";

                              return (
                                <tr key={index} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-3 py-2.5 text-gray-900 font-medium">
                                    {nombre}
                                  </td>
                                  <td className="px-3 py-2.5 text-gray-900 font-medium">
                                    {comprobante}
                                  </td>
                                  <td className="px-3 py-2.5 text-right font-bold text-gray-900">
                                    {formatCurrency(monto)}
                                  </td>
                                  <td className="px-3 py-2.5 text-gray-900 font-medium">
                                    {medioPago}
                                  </td>
                                  <td className="px-3 py-2.5 text-gray-900 font-medium">
                                    {fechaReg !== "N/A" ? formatDate(fechaReg) : "N/A"}
                                  </td>
                                  <td className="px-3 py-2.5 text-center">
                                    <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-bold ${validacion.toUpperCase() === "VALIDO"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                      }`}>
                                      {validacion.toUpperCase()}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                            <tr className="bg-blue-50 border-t-2 border-blue-200">
                              <td colSpan="2" className="px-3 py-2.5 text-left font-bold text-gray-900">
                                TOTAL PAGADO:
                              </td>
                              <td className="px-3 py-2.5 text-right font-bold text-gray-900">
                                {formatCurrency(totalPagado)}
                              </td>
                              <td colSpan="3"></td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-6 flex flex-col items-center justify-center text-gray-400 space-y-3">
                        <svg
                          className="w-10 h-10"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 15a4 4 0 014-4h10a4 4 0 010 8H7a4 4 0 01-4-4z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M7 11V9a5 5 0 0110 0v2"
                          />
                        </svg>
                        <p className="text-xs font-medium">
                          No hay pagos registrados aún
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Columna derecha */}
              <div className="space-y-4">
                {/* Productos Comprados */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-blue-700 text-white">
                    <div className="flex items-center space-x-2">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 3h2l.4 2M7 13h10l3-8H6.4M7 13L5.4 5M7 13l-2 7h14M10 21a1 1 0 11-2 0 1 1 0 012 0zm8 0a1 1 0 11-2 0 1 1 0 012 0z"
                        />
                      </svg>
                      <span className="text-sm font-semibold">
                        Productos Comprados
                      </span>
                    </div>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                      <table className="w-full text-[11px]">
                        <thead>
                          <tr className="bg-slate-100 border-b border-gray-200">
                            <th className="px-3 py-2 text-left font-semibold text-gray-700">
                              Código
                            </th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-700">
                              Producto
                            </th>
                            <th className="px-3 py-2 text-right font-semibold text-gray-700">
                              Cantidad
                            </th>
                            <th className="px-3 py-2 text-right font-semibold text-gray-700">
                              Precio
                            </th>
                            <th className="px-3 py-2 text-right font-semibold text-gray-700">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {detallesVenta?.productos && detallesVenta.productos.length > 0 ? (
                            detallesVenta.productos.map((item, index) => (
                              <tr key={index} className="bg-white">
                                <td className="px-3 py-2 whitespace-nowrap text-gray-800">
                                  {item.codigo}
                                </td>
                                <td className="px-3 py-2 text-gray-800">
                                  {item.producto}
                                </td>
                                <td className="px-3 py-2 text-right text-gray-800">
                                  {item.cantidad}
                                </td>
                                <td className="px-3 py-2 text-right text-gray-800">
                                  {formatCurrency(item.precio)}
                                </td>
                                <td className="px-3 py-2 text-right font-semibold text-gray-900">
                                  {formatCurrency(item.total)}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="5" className="px-3 py-8 text-center text-gray-500">
                                <div className="flex flex-col items-center justify-center">
                                  <svg className="w-12 h-12 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                  </svg>
                                  <p className="text-sm font-medium">No hay productos registrados</p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex items-center justify-between bg-slate-100 border border-slate-200 rounded-lg px-4 py-2">
                      <span className="text-[11px] font-semibold text-gray-700 uppercase tracking-wide">
                        Total General:
                      </span>
                      <span className="text-sm font-bold text-gray-900">
                        {formatCurrency(totalProductos)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Análisis de Pago */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="flex items-center px-4 py-3 border-b border-gray-200 bg-white">
                    <svg
                      className="w-5 h-5 text-blue-700 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11 11V7a4 4 0 118 0v4M5 13h4m-2-2v6"
                      />
                    </svg>
                    <span className="text-sm font-semibold text-gray-900">
                      Análisis de Pago
                    </span>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                          Total Productos
                        </p>
                        <p className="mt-1 text-base font-bold text-gray-900">
                          {formatCurrency(totalProductos)}
                        </p>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                          Total Pagado
                        </p>
                        <p className="mt-1 text-base font-bold text-gray-900">
                          {formatCurrency(totalPagado)}
                        </p>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                          Saldo Pendiente
                        </p>
                        <p className="mt-1 text-base font-bold text-red-600">
                          {formatCurrency(saldoPendiente)}
                        </p>
                      </div>
                    </div>
                    <div className={`border rounded-lg px-4 py-3 text-[11px] flex items-center justify-between gap-2 flex-wrap ${saldoPendiente > 0
                      ? "border-amber-300 bg-amber-50 text-amber-800"
                      : "border-green-300 bg-green-50 text-green-800"
                      }`}>
                      <div className="flex items-center space-x-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d={saldoPendiente > 0
                              ? "M12 9v2m0 4h.01M4.93 4.93l14.14 14.14M5 13a7 7 0 1114 0 7 7 0 01-14 0z"
                              : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            }
                          />
                        </svg>
                        <span className="font-semibold">
                          {saldoPendiente > 0
                            ? `COMPROBANTE AÚN POR CANCELAR (${porcentajePagado}% pagado)`
                            : "COMPROBANTE COMPLETAMENTE PAGADO (100% pagado)"
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-gray-100">
              <button
                onClick={() => {
                  setModalPagoOpen(false);
                  setVentaSeleccionada(null);
                  setDetallesVenta(null);
                  setPagosVenta([]);
                  setDatosPago(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[#002D5A] to-[#002D5A] rounded-lg shadow-sm hover:shadow-md hover:scale-[1.02] transition-all"
              >
                Cerrar Modal
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Editar Información de Pago */}
      <Modal
        isOpen={modalEditarPagoOpen}
        onClose={() => {
          setModalEditarPagoOpen(false);
          setFormularioEditarPago({
            tipo_comprobante: "",
            forma_pago: "",
            fecha_pago: "",
            regularizado: "NO",
            cancelado: "NO",
            estado: "COMPLETADO",
            anulado: "NO"
          });
        }}
        title="Editar Información de Pago"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Tipo Comprobante
            </label>
            <input
              type="text"
              value={formularioEditarPago.tipo_comprobante}
              onChange={(e) => setFormularioEditarPago({ ...formularioEditarPago, tipo_comprobante: e.target.value })}
              className="w-full px-3 py-2 text-xs text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
              placeholder="Ej: FACTURA, BOLETA"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Forma de Pago
            </label>
            <select
              value={formularioEditarPago.forma_pago}
              onChange={(e) => setFormularioEditarPago({ ...formularioEditarPago, forma_pago: e.target.value })}
              className="w-full px-3 py-2 text-xs text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Seleccione...</option>
              <option value="EFECTIVO">EFECTIVO</option>
              <option value="TRANSFERENCIA">TRANSFERENCIA</option>
              <option value="TARJETA">TARJETA</option>
              <option value="YAPE">YAPE</option>
              <option value="PLIN">PLIN</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Fecha de Pago
            </label>
            <input
              type="date"
              value={formularioEditarPago.fecha_pago ? (() => {
                try {
                  const date = new Date(formularioEditarPago.fecha_pago);
                  if (!isNaN(date.getTime())) {
                    return date.toISOString().split('T')[0];
                  }
                } catch { }
                return "";
              })() : ""}
              onChange={(e) => setFormularioEditarPago({ ...formularioEditarPago, fecha_pago: e.target.value })}
              className="w-full px-3 py-2 text-xs text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Regularizado
              </label>
              <select
                value={formularioEditarPago.regularizado}
                onChange={(e) => setFormularioEditarPago({ ...formularioEditarPago, regularizado: e.target.value })}
                className="w-full px-3 py-2 text-xs text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="NO">NO</option>
                <option value="SI">SI</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Cancelado
              </label>
              <select
                value={formularioEditarPago.cancelado}
                onChange={(e) => setFormularioEditarPago({ ...formularioEditarPago, cancelado: e.target.value })}
                className="w-full px-3 py-2 text-xs text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="NO">NO</option>
                <option value="SI">SI</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={formularioEditarPago.estado}
                onChange={(e) => setFormularioEditarPago({ ...formularioEditarPago, estado: e.target.value })}
                className="w-full px-3 py-2 text-xs text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="COMPLETADO">COMPLETADO</option>
                <option value="PENDIENTE">PENDIENTE</option>
                <option value="CANCELADO">CANCELADO</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Anulado
              </label>
              <select
                value={formularioEditarPago.anulado}
                onChange={(e) => setFormularioEditarPago({ ...formularioEditarPago, anulado: e.target.value })}
                className="w-full px-3 py-2 text-xs text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="NO">NO</option>
                <option value="SI">SI</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 mt-4">
          <button
            onClick={() => {
              setModalEditarPagoOpen(false);
              setFormularioEditarPago({
                tipo_comprobante: "",
                forma_pago: "",
                fecha_pago: "",
                regularizado: "NO",
                cancelado: "NO",
                estado: "COMPLETADO",
                anulado: "NO"
              });
            }}
            className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={async () => {
              try {
                const token = localStorage.getItem("token");
                const idPago = datosPago?.ID_PAGO || ventaSeleccionada?.id;

                if (!idPago) {
                  setModalMensaje({ open: true, tipo: "error", mensaje: "No se encontró el ID del pago." });
                  return;
                }

                // Formatear fecha si es necesario
                let fechaFormateada = formularioEditarPago.fecha_pago;
                if (fechaFormateada && fechaFormateada.includes('-')) {
                  const [year, month, day] = fechaFormateada.split('-');
                  fechaFormateada = `${day}/${month}/${year}`;
                }

                const requestBody = {
                  id_pago: idPago,
                  tipo_comprobante: formularioEditarPago.tipo_comprobante,
                  forma_pago: formularioEditarPago.forma_pago,
                  fecha_pago: fechaFormateada,
                  regularizado: formularioEditarPago.regularizado,
                  cancelado: formularioEditarPago.cancelado,
                  estado: formularioEditarPago.estado,
                  anulado: formularioEditarPago.anulado
                };

                const response = await fetch(`${VENTAS_API_URL}?area=ventas&forma=actualizar_pago`, {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    ...(token && { Authorization: `Bearer ${token}` })
                  },
                  body: JSON.stringify(requestBody),
                });

                if (!response.ok) {
                  const errorText = await response.text();
                  throw new Error(errorText || `Error ${response.status}`);
                }

                const data = await response.json();

                // Actualizar datosPago con los nuevos valores
                setDatosPago({
                  ...datosPago,
                  COMPROBANTE: formularioEditarPago.tipo_comprobante,
                  TIPO_DE_PAGO: formularioEditarPago.forma_pago,
                  FECHA_DE_PAGO: fechaFormateada,
                  REGULARIZADO: formularioEditarPago.regularizado,
                  CANCELADO: formularioEditarPago.cancelado,
                  ESTADO: formularioEditarPago.estado,
                  ANULADO: formularioEditarPago.anulado
                });

                setModalEditarPagoOpen(false);
                setModalMensaje({ open: true, tipo: "success", mensaje: "Información de pago actualizada correctamente." });

                // Recargar detalles para asegurar que todo esté actualizado
                await cargarDetallesVenta(ventaSeleccionada.id, true);
              } catch (error) {
                console.error("Error al actualizar información de pago:", error);
                setModalMensaje({ open: true, tipo: "error", mensaje: `Error al actualizar: ${error.message}` });
              }
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Guardar Cambios
          </button>
        </div>
      </Modal>

      {/* Modal Eliminar */}
      <Modal
        isOpen={modalEliminarOpen && !!ventaSeleccionada}
        onClose={() => {
          setModalEliminarOpen(false);
          setVentaSeleccionada(null);
        }}
        title="Eliminar Venta"
        size="sm"
      >
        {ventaSeleccionada && (
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              ¿Está seguro que desea eliminar la venta del cliente{" "}
              <span className="font-semibold text-gray-900">
                {ventaSeleccionada.cliente}
              </span>{" "}
              con comprobante{" "}
              <span className="font-semibold text-gray-900">
                {ventaSeleccionada.comprobante}
              </span>
              ?
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => {
                  setModalEliminarOpen(false);
                  setVentaSeleccionada(null);
                }}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminarVenta}
                className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
              >
                Eliminar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Confirmar Eliminar */}
      <Modal
        isOpen={modalConfirmarEliminar.open}
        onClose={() => setModalConfirmarEliminar({ open: false, venta: null, mensaje: "" })}
        title="Confirmar Eliminación"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            {modalConfirmarEliminar.mensaje}
          </p>
          <div className="flex justify-end space-x-2 pt-2">
            <button
              onClick={() => setModalConfirmarEliminar({ open: false, venta: null, mensaje: "" })}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={confirmarEliminarVenta}
              className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
            >
              Eliminar
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Mensaje */}
      <Modal
        isOpen={modalMensaje.open}
        onClose={() => setModalMensaje({ open: false, tipo: "success", mensaje: "" })}
        title={modalMensaje.tipo === "success" ? "Éxito" : modalMensaje.tipo === "error" ? "Error" : "Información"}
        size="sm"
      >
        <div className="space-y-4">
          <p className={`text-sm ${modalMensaje.tipo === "success" ? "text-green-700" :
            modalMensaje.tipo === "error" ? "text-red-700" :
              "text-blue-700"
            }`}>
            {modalMensaje.mensaje}
          </p>
          <div className="flex justify-end pt-2">
            <button
              onClick={() => setModalMensaje({ open: false, tipo: "success", mensaje: "" })}
              className={`px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ${modalMensaje.tipo === "success" ? "bg-green-600 hover:bg-green-700" :
                modalMensaje.tipo === "error" ? "bg-red-600 hover:bg-red-700" :
                  "bg-blue-600 hover:bg-blue-700"
                }`}
            >
              Aceptar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

