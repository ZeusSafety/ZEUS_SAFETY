"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../components/context/AuthContext";
import { useInventario } from "../../../../context/InventarioContext";
import { Header } from "../../../../components/layout/Header";
import { Sidebar } from "../../../../components/layout/Sidebar";
import { BannerSesion } from "../../../../components/inventario/BannerSesion";
import { ModalAsignarInventario } from "../../../../components/inventario/ModalAsignarInventario";
import { ModalUnirseInventario } from "../../../../components/inventario/ModalUnirseInventario";
import { CargarProductos } from "../../../../components/inventario/CargarProductos";
import * as inventarioApi from "../../../../services/inventarioApi";
import { fmt12, leerArchivoGenerico, normalizarClave, toNumberSafe, toast } from "../../../../utils/inventarioUtils";
import { generarPDFConteoBlob } from "../../../../utils/pdfUtils";

const JEFE_PWD = "0427";
const TIENDAS = ["TIENDA 3006", "TIENDA 3006 B", "TIENDA 3131", "TIENDA 3133", "TIENDA 412-A"];

export default function InventarioMalvinasPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { sesionActual, setSesionActual, productos, setProductos, sesiones, setSesiones, paginacion, setPaginacion } = useInventario();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conteos, setConteos] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [mostrarModalAsignar, setMostrarModalAsignar] = useState(false);
  const [mostrarModalUnirse, setMostrarModalUnirse] = useState(false);
  const [mostrarModalInventario, setMostrarModalInventario] = useState(false);
  const [tiendaSeleccionada, setTiendaSeleccionada] = useState("");
  const [tiendas, setTiendas] = useState([]);
  const [sesionActualLocal, setSesionActualLocal] = useState(null);
  const [filtroTexto, setFiltroTexto] = useState("");
  const [mostrarTablaInventario, setMostrarTablaInventario] = useState(false);
  const [colaboradores, setColaboradores] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

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
      cargarConteos();
      cargarColaboradores();
      cargarTiendas();
      cargarProductosDesdeAPI();
      const stored = localStorage.getItem("inventario_state");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.sesionActual) {
            setSesionActualLocal(parsed.sesionActual);
          }
        } catch (e) {}
      }
      // Intentar obtener inventario activo desde la API
      cargarInventarioActivo();
    }
  }, [user]);

  const cargarInventarioActivo = async () => {
    try {
      const response = await inventarioApi.obtenerInventarioActivo();
      if (response.success && response.inventario) {
        const nuevaSesion = {
          numero: response.inventario.numero_inventario,
          creadoPor: response.inventario.area + " • " + response.inventario.autorizado_por,
          inicio: response.inventario.fecha_creacion || fmt12(),
          activo: response.inventario.estado === "abierto",
          inventarioId: response.inventario.id,
        };
        setSesionActual(nuevaSesion);
        setSesionActualLocal(nuevaSesion);
      }
    } catch (error) {
      console.error("Error cargando inventario activo:", error);
    }
  };

  const cargarProductosDesdeAPI = async (conteoId = null) => {
    try {
      if (conteoId) {
        const response = await inventarioApi.obtenerDetalleConteo(conteoId);
        if (response.success && response.productos) {
          const productosMapeados = response.productos.map((p, i) => ({
            item: p.item_producto || (i + 1),
            producto: p.producto || "",
            codigo: String(p.codigo || ""),
            unidad_medida: p.unidad_medida || "UNIDAD",
            cantidad_sistema: Number(p.cantidad || 0),
            detalle_id: p.id,
          }));
          setProductos(productosMapeados);
          return true;
        }
      } else {
        // Cargar desde catálogo
        const catResponse = await inventarioApi.listarProductosInventario();
        if (catResponse.success && catResponse.productos) {
          const productosMapeados = catResponse.productos.map((p, i) => ({
            item: p.item || (i + 1),
            producto: p.producto || "",
            codigo: String(p.codigo || ""),
            unidad_medida: p.unidad_medida || "UNIDAD",
            cantidad_sistema: 0,
            detalle_id: null,
          }));
          setProductos(productosMapeados);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Error al cargar productos:", error);
      toast("Error al cargar productos desde la API", "error");
      return false;
    }
  };

  const cargarTiendas = async () => {
    try {
      const data = await inventarioApi.colaboradoresInventario("TIENDAS_MALVINAS");
      if (data && data.length > 0) {
        setTiendas(data);
      } else {
        setTiendas(TIENDAS.map((nombre, idx) => ({ ID: `local_${idx}`, NOMBRE: nombre })));
      }
    } catch (error) {
      console.error("Error cargando tiendas:", error);
      setTiendas(TIENDAS.map((nombre, idx) => ({ ID: `local_${idx}`, NOMBRE: nombre })));
    }
  };

  const cargarColaboradores = async () => {
    try {
      const data = await inventarioApi.colaboradoresInventario("CONTEO");
      setColaboradores(data || []);
    } catch (error) {
      console.error("Error cargando colaboradores:", error);
    }
  };

  const cargarConteos = async () => {
    try {
      setLoadingData(true);

      // Usar la misma lógica que el HTML original:
      // extraer_inventarios_conteos con id = "MALVINAS"
      const data = await inventarioApi.extraerInventariosConteos("MALVINAS");
      
      console.log("📊 Respuesta de extraerInventariosConteos MALVINAS:", data);
      console.log("📊 Tipo de data:", typeof data, "Es array?", Array.isArray(data));

      // La API puede devolver directamente un array o un objeto con una propiedad
      let datosArray = [];
      if (Array.isArray(data)) {
        datosArray = data;
      } else if (data && Array.isArray(data.data)) {
        datosArray = data.data;
      } else if (data && Array.isArray(data.conteos)) {
        datosArray = data.conteos;
      } else if (data && typeof data === 'object') {
        // Si es un objeto, intentar convertir sus valores a array
        datosArray = Object.values(data).filter(Array.isArray).flat();
      }

      console.log("📊 Datos procesados:", datosArray.length, "conteos");

      if (datosArray.length > 0) {
        const conteosMapeados = datosArray.map((c) => ({
          id: c.ID || c.id || c.conteo_id,
          numero_inventario: c.INVENTARIO || c.numero_inventario || c.inventario_numero,
          registrado_por: c.NOMBRE || c.registrado_por || c.nombre || c.usuario,
          nombre_tienda: c.PUNTO_OPERACION || c.nombre_tienda || c.tienda || c.punto_operacion,
          fecha_hora_inicio: c.FECHA_INICIO || c.fecha_hora_inicio || c.fecha_inicio,
          fecha_hora_final: c.FECHA_FINAL || c.fecha_hora_final || c.fecha_final,
          archivo_pdf: c.LINK_ARCHIVO_PDF || c.archivo_pdf || c.link_archivo_pdf,
          tipo: c.TIPO || c.tipo || "conteo",
        }));

        // Ordenar por fecha de inicio descendente (más recientes primero)
        conteosMapeados.sort((a, b) => {
          const fechaA = new Date(a.fecha_hora_inicio || 0);
          const fechaB = new Date(b.fecha_hora_inicio || 0);
          return fechaB - fechaA;
        });

        console.log("✅ Conteos mapeados y ordenados:", conteosMapeados.length);
        setConteos(conteosMapeados);
      } else {
        console.warn("⚠️ No se encontraron conteos en la respuesta");
        setConteos([]);
      }
    } catch (error) {
      console.error("❌ Error cargando conteos:", error);
      toast(error.message || "Error al cargar conteos", "error");
      setConteos([]);
    } finally {
      setLoadingData(false);
    }
  };

  const handleAsignarInventario = async (data) => {
    try {
      const response = await inventarioApi.asignarInventario({
        numero_inventario: data.numero,
        contrasena: data.contrasena,
        area: data.area,
        autorizado_por: data.autorizado_por,
      });
      if (response.success) {
        const nuevaSesion = {
          numero: data.numero,
          creadoPor: `${data.area} • ${data.autorizado_por}`,
          inicio: fmt12(),
          activo: true,
          inventarioId: response.inventario_id,
        };
        setSesionActual(nuevaSesion);
        setSesionActualLocal(nuevaSesion);
        toast("Número de inventario asignado correctamente", "success");
      } else {
        toast(response.message || "Error al asignar inventario", "error");
      }
    } catch (error) {
      console.error("Error asignando inventario:", error);
      toast(error.message || "Error al asignar inventario", "error");
    }
  };

  const handleUnirseInventario = async (data) => {
    try {
      const nombreColaborador = prompt("Ingrese su nombre:");
      if (!nombreColaborador || !nombreColaborador.trim()) {
        alert("Debe ingresar su nombre");
        return;
      }
      const response = await inventarioApi.unirColaborador({
        numero_inventario: data.numero,
        nombre_colaborador: nombreColaborador.trim(),
        rol: "contador",
      });
      if (response.success) {
        const nuevaSesion = {
          numero: data.numero,
          activo: true,
          inicio: fmt12(),
          inventarioId: response.inventario_id || null,
        };
        setSesionActual(nuevaSesion);
        setSesionActualLocal(nuevaSesion);
        toast("Unido al inventario " + data.numero, "success");
      } else {
        toast(response.message || "Error al unirse al inventario", "error");
      }
    } catch (error) {
      console.error("Error uniéndose al inventario:", error);
      toast(error.message || "Error al unirse al inventario", "error");
    }
  };

  const handleCerrarInventario = async () => {
    const pwd = prompt("Contraseña para cerrar inventario");
    if (pwd !== JEFE_PWD) {
      alert("Contraseña incorrecta");
      return;
    }
    if (!confirm("¿Cerrar el inventario actual? No se podrán iniciar nuevos conteos con este número.")) return;
    try {
      const response = await inventarioApi.cerrarInventario({
        numero_inventario: sesionActualLocal?.numero,
      });
      if (response.success) {
        setSesionActual({ ...sesionActual, activo: false });
        setSesionActualLocal({ ...sesionActualLocal, activo: false });
        toast("Inventario cerrado", "success");
      } else {
        toast(response.message || "Error al cerrar inventario", "error");
      }
    } catch (error) {
      console.error("Error cerrando inventario:", error);
      toast(error.message || "Error al cerrar inventario", "error");
    }
  };

  const abrirModalInventario = () => {
    if (productos.length === 0) {
      alert("Primero sube el archivo de productos.");
      return;
    }

    if (!sesionActualLocal?.numero) {
      alert("No hay N° de inventario activo. Asigna o únete a uno.");
      return;
    }

    setTiendaSeleccionada("");
    setMostrarModalInventario(true);
  };

  const guardarModalInventario = async () => {
    if (!tiendaSeleccionada) {
      alert("Seleccione una tienda.");
      return;
    }

    const numero = sesionActualLocal?.numero;
    const registradoSelect = document.getElementById("inv-registrado");
    let registrado = registradoSelect?.value || "";

    if (registrado === "Otro") {
      registrado = document.getElementById("inv-otro")?.value.trim() || "";
    }

    if (!registrado) {
      alert("Seleccione o ingrese quien registra");
      return;
    }

    if (!sesionActualLocal?.inventarioId) {
      alert("No hay ID de inventario. Debe asignar o unirse a un inventario primero.");
      return;
    }

    try {
      const almacenId = 2; // Malvinas = 2 según el backend
      // Obtener ID de tienda (mapeo simple basado en el nombre)
      const mapeoTiendas = {
        "TIENDA 3006": 1,
        "TIENDA 3006 B": 2,
        "TIENDA 3006B": 2,
        "TIENDA 3131": 3,
        "TIENDA 3133": 4,
        "TIENDA 412-A": 5,
        "TIENDA 412A": 5,
      };
      const tiendaId = mapeoTiendas[tiendaSeleccionada.toUpperCase()] || null;

      const response = await inventarioApi.iniciarConteo({
        numero_inventario: numero,
        almacen_id: almacenId,
        tienda_id: tiendaId,
        registrado_por: registrado,
        tipo_conteo: "por_cajas", // Por defecto, se puede cambiar después
        origen_datos: "sistema",
      });

      if (response.success) {
        const conteoId = response.conteo_id;
        const inicio = fmt12();

        const nuevaSesion = {
          id: `local_${Date.now()}`,
          numero,
          registrado,
          inicio,
          tienda: tiendaSeleccionada,
          filas: [],
          fin: null,
          conteo_id: conteoId,
        };

        setSesiones({
          ...sesiones,
          malvinas: [...sesiones.malvinas, nuevaSesion],
        });

        setMostrarModalInventario(false);
        // Cargar productos desde la API para este conteo y mostrar tabla
        await mostrarTablaInventarioDesdeAPI(conteoId);
        toast("Sesión de inventario iniciada", "success");
      } else {
        toast(response.message || "Error al iniciar conteo", "error");
      }
    } catch (error) {
      console.error("Error iniciando conteo:", error);
      toast(error.message || "Error al iniciar conteo", "error");
    }
  };

  const mostrarTablaInventarioDesdeAPI = async (conteoId) => {
    try {
      const response = await inventarioApi.obtenerDetalleConteo(conteoId);
      if (response.success && response.productos) {
        // Actualizar productos con los datos del conteo
        const productosMapeados = response.productos.map((p, i) => ({
          item: p.item_producto || (i + 1),
          producto: p.producto || "",
          codigo: String(p.codigo || ""),
          unidad_medida: p.unidad_medida || "UNIDAD",
          cantidad_sistema: Number(p.cantidad || 0),
          detalle_id: p.id,
        }));
        setProductos(productosMapeados);
        setMostrarTablaInventario(true);
      }
    } catch (error) {
      console.error("Error cargando tabla de inventario:", error);
      toast("Error al cargar tabla de inventario", "error");
    }
  };

  const actualizarCantidad = async (codigo, cantidad, unidadMedida, detalleId) => {
    if (!sesionActualLocal) return;

    const ultimaSesion = sesiones.malvinas[sesiones.malvinas.length - 1];
    if (!ultimaSesion || ultimaSesion.fin || !ultimaSesion.conteo_id) return;

    const producto = productos.find((p) => p.codigo === codigo);
    if (!producto) return;

    // Actualizar en la API usando actualizar_masivo
    try {
      const usuario = ultimaSesion.registrado || prompt("Ingrese su nombre para registrar el cambio:");
      if (!usuario || !usuario.trim()) {
        return;
      }

      const data = {
        conteo_id: ultimaSesion.conteo_id,
        usuario: usuario.trim(),
        productos: [{
          detalle_id: detalleId || producto.detalle_id,
          nueva_cantidad: cantidad,
          nueva_unidad_medida: unidadMedida,
        }],
      };

      const response = await inventarioApi.actualizarMasivo(data);
      if (response.success) {
        // Actualizar localmente
        if (!ultimaSesion.filas) ultimaSesion.filas = [];
        let fila = ultimaSesion.filas.find((f) => f.codigo === codigo);
        if (fila) {
          fila.cantidad = cantidad;
          fila.unidad_medida = unidadMedida;
        } else {
          ultimaSesion.filas.push({
            item: producto.item,
            producto: producto.producto,
            codigo: producto.codigo,
            unidad_medida: unidadMedida,
            cantidad: cantidad,
          });
        }
        setSesiones({ ...sesiones });
      } else {
        toast(response.message || "Error al actualizar cantidad", "error");
      }
    } catch (error) {
      console.error("Error actualizando cantidad:", error);
      toast(error.message || "Error al actualizar cantidad", "error");
    }
  };

  const registrarInventario = async () => {
    const ultimaSesion = sesiones.malvinas[sesiones.malvinas.length - 1];
    if (!ultimaSesion || ultimaSesion.fin || !ultimaSesion.conteo_id) {
      alert("No hay sesión activa para registrar");
      return;
    }

    const usuario = ultimaSesion.registrado || prompt("Ingrese su nombre:");
    if (!usuario || !usuario.trim()) {
      alert("Debe ingresar el nombre del usuario");
      return;
    }

    try {
      setLoadingData(true);

      // Obtener los productos actuales del conteo desde la API
      const detalleResponse = await inventarioApi.obtenerDetalleConteo(ultimaSesion.conteo_id);
      if (!detalleResponse.success || !detalleResponse.productos) {
        alert("Error al obtener datos del conteo");
        return;
      }

      // Generar nombre de archivo PDF
      const archivoPdf = `conteo_malvinas_${ultimaSesion.conteo_id}.pdf`;

      // Finalizar conteo
      const finalizarResponse = await inventarioApi.finalizarConteo({
        conteo_id: ultimaSesion.conteo_id,
        archivo_pdf: archivoPdf,
      });

      if (finalizarResponse.success) {
        // Generar PDF con los datos del conteo
        const pdfBlob = await generarPDFConteoBlob("malvinas", {
          numero: ultimaSesion.numero,
          registrado: ultimaSesion.registrado,
          inicio: ultimaSesion.inicio,
          fin: fmt12(),
          tienda: ultimaSesion.tienda,
          filas: detalleResponse.productos.map((p) => ({
            item: p.item_producto || 0,
            producto: p.producto || "",
            codigo: p.codigo || "",
            cantidad: Number(p.cantidad || 0),
            unidad_medida: p.unidad_medida || "UNIDAD",
          })),
        });

        // Subir PDF si es necesario
        let pdfUrl = archivoPdf;
        try {
          const pdfFile = new File([pdfBlob], archivoPdf, { type: "application/pdf" });
          pdfUrl = await inventarioApi.subirArchivo(pdfFile);
        } catch (err) {
          console.warn("Error subiendo PDF:", err);
        }

        // Actualizar sesión local
        ultimaSesion.fin = fmt12();
        ultimaSesion.pdfUrl = pdfUrl;
        setSesiones({ ...sesiones });

        setMostrarTablaInventario(false);
        toast("Inventario registrado correctamente", "success");
        cargarConteos();
      } else {
        alert("Error al finalizar conteo: " + (finalizarResponse.message || "Error desconocido"));
      }
    } catch (error) {
      console.error("Error registrando inventario:", error);
      alert("Error al registrar: " + error.message);
    } finally {
      setLoadingData(false);
    }
  };

  const handleCargaEmergencia = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ultimaSesion = sesiones.malvinas[sesiones.malvinas.length - 1];
    if (!ultimaSesion || ultimaSesion.fin || !ultimaSesion.conteo_id) {
      alert("Primero crea una sesión de inventario e inicia el conteo.");
      e.target.value = "";
      return;
    }

    const usuario = ultimaSesion.registrado || prompt("Ingrese su nombre:");
    if (!usuario || !usuario.trim()) {
      alert("Debe ingresar el nombre del usuario");
      e.target.value = "";
      return;
    }

    try {
      // Crear FormData para enviar el archivo
      const formData = new FormData();
      formData.append("conteo_id", ultimaSesion.conteo_id);
      formData.append("usuario", usuario.trim());
      formData.append("excel_file", file);

      toast("Cargando archivo Excel...", "info");

      // Llamar a la API
      const response = await inventarioApi.cargarExcelEmergencia(formData);

      if (response.success) {
        toast(
          `Archivo de emergencia procesado: ${response.registros_procesados} registros procesados, ${response.registros_actualizados} actualizados.`,
          "success"
        );
        // Recargar la tabla de inventario
        await mostrarTablaInventarioDesdeAPI(ultimaSesion.conteo_id);
      } else {
        alert("Error al procesar archivo: " + (response.message || "Error desconocido"));
      }
      e.target.value = "";
    } catch (error) {
      console.error("Error en carga de emergencia:", error);
      alert("Error emergencia: " + error.message);
      e.target.value = "";
    }
  };

  const dispararEmergencia = () => {
    const pass = prompt("Contraseña de emergencia");
    if (pass !== JEFE_PWD) {
      alert("Contraseña incorrecta");
      return;
    }
    fileInputRef.current?.click();
  };

  const ultimaSesion = sesiones.malvinas[sesiones.malvinas.length - 1];
  const sesionActiva = ultimaSesion && !ultimaSesion.fin ? ultimaSesion : null;

  let productosFiltrados = productos;
  if (filtroTexto) {
    const txt = filtroTexto.toLowerCase();
    productosFiltrados = productos.filter(
      (p) =>
        (p.producto || "").toLowerCase().includes(txt) ||
        (p.codigo || "").toLowerCase().includes(txt)
    );
  }

  const paginaActual = paginacion.malvinas.pagina;
  const porPagina = paginacion.malvinas.porPagina;
  const totalPaginas = Math.ceil(productosFiltrados.length / porPagina);
  const inicio = (paginaActual - 1) * porPagina;
  const fin = inicio + porPagina;
  const productosPagina = productosFiltrados.slice(inicio, fin);

  const mapaCantidades = new Map();
  if (sesionActiva?.filas) {
    sesionActiva.filas.forEach((f) => {
      mapaCantidades.set(f.codigo, f);
    });
  }

  if (authLoading) {
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
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${
          sidebarOpen ? "lg:ml-60 ml-0" : "ml-0"
        }`}
      >
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto custom-scrollbar" style={{ background: "#F7FAFF" }}>
          <div className="max-w-[95%] mx-auto px-4 py-4">
            <button
              onClick={() => router.push("/logistica")}
              className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-blue-700 to-blue-800 text-white rounded-lg font-semibold hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver a Logística</span>
            </button>

            <BannerSesion sesionActual={sesionActualLocal} onCerrar={handleCerrarInventario} />

            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6 mb-4">
              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-xl flex items-center justify-center text-white shadow-sm">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-2xl font-medium text-gray-900 tracking-tight">Almacén Malvinas</h1>
                    <p className="text-sm text-gray-600 font-medium mt-0.5">Gestión de Inventario</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mb-4 flex-wrap">
                <CargarProductos onProductosCargados={(productos) => setProductos(productos)} />
                <button
                  onClick={() => setMostrarModalAsignar(true)}
                  className="px-4 py-2 bg-gradient-to-br from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-semibold text-sm"
                >
                  Asignar N° Inventario
                </button>
                <button
                  onClick={() => setMostrarModalUnirse(true)}
                  className="px-4 py-2 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-semibold text-sm"
                >
                  Unirse a Inventario
                </button>
                <button
                  onClick={abrirModalInventario}
                  disabled={!sesionActualLocal?.activo}
                  className="px-4 py-2 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all font-semibold text-sm disabled:opacity-50"
                >
                  Nuevo Conteo
                </button>
                {sesionActiva && (
                  <>
                    <button
                      onClick={dispararEmergencia}
                      className="px-4 py-2 bg-gradient-to-br from-yellow-600 to-yellow-700 text-white rounded-lg hover:from-yellow-700 hover:to-yellow-800 transition-all font-semibold text-sm"
                    >
                      Subir (Emergencia)
                    </button>
                    <button
                      onClick={registrarInventario}
                      disabled={loadingData}
                      className="px-4 py-2 bg-gradient-to-br from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all font-semibold text-sm disabled:opacity-50"
                    >
                      {loadingData ? "Registrando..." : "Registrar Inventario"}
                    </button>
                  </>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.json"
                onChange={handleCargaEmergencia}
                className="hidden"
              />

              {(mostrarTablaInventario || (sesionActiva && sesionActiva.conteo_id)) && (
                <div className="mt-4">
                  <div className="mb-3 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Buscar por producto o código"
                      value={filtroTexto}
                      onChange={(e) => {
                        setFiltroTexto(e.target.value);
                        setPaginacion({ ...paginacion, malvinas: { ...paginacion.malvinas, pagina: 1 } });
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => {
                        setFiltroTexto("");
                        setPaginacion({ ...paginacion, malvinas: { ...paginacion.malvinas, pagina: 1 } });
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Limpiar
                    </button>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full" style={{ borderCollapse: "separate", borderSpacing: "0 6px" }}>
                        <thead>
                          <tr>
                            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-700 bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-blue-200 sticky top-0 z-10" style={{ fontFamily: "var(--font-poppins)" }}>
                              Item
                            </th>
                            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-700 bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-blue-200 sticky top-0 z-10" style={{ fontFamily: "var(--font-poppins)" }}>
                              Producto
                            </th>
                            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-700 bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-blue-200 sticky top-0 z-10" style={{ fontFamily: "var(--font-poppins)" }}>
                              Código
                            </th>
                            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-700 bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-blue-200 sticky top-0 z-10" style={{ fontFamily: "var(--font-poppins)" }}>
                              Cantidad
                            </th>
                            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-700 bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-blue-200 sticky top-0 z-10" style={{ fontFamily: "var(--font-poppins)" }}>
                              Unidad de Medida
                            </th>
                            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-700 bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-blue-200 sticky top-0 z-10" style={{ fontFamily: "var(--font-poppins)" }}>
                              Estado
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {productosPagina.map((p, pIdx) => {
                            const fila = mapaCantidades.get(p.codigo);
                            const cantidad = fila?.cantidad || "";
                            const um = fila?.unidad_medida || p.unidad_medida || "UNIDAD";
                            const estado = cantidad === "" || cantidad === 0 ? "PENDIENTE" : "REGISTRADO";
                            const esPar = pIdx % 2 === 0;

                            return (
                              <tr 
                                key={p.codigo} 
                                className={`bg-gradient-to-r ${esPar ? "from-white to-blue-50/20" : "from-blue-50/30 to-white"} hover:from-blue-50 hover:to-blue-100 transition-all duration-200 rounded-lg shadow-sm hover:shadow-md`}
                                style={{ borderRadius: "8px" }}
                              >
                                <td className="px-4 py-3 text-sm text-gray-700 font-medium" style={{ fontFamily: "var(--font-poppins)", borderTopLeftRadius: "8px", borderBottomLeftRadius: "8px" }}>
                                  {p.item}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate" style={{ fontFamily: "var(--font-poppins)" }} title={p.producto}>
                                  {p.producto}
                                </td>
                                <td className="px-4 py-3 text-sm font-semibold text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
                                  {p.codigo}
                                </td>
                                <td className="px-4 py-3">
                                  <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={cantidad}
                                    onChange={(e) => {
                                      const nuevaCantidad = Number(e.target.value) || 0;
                                      actualizarCantidad(p.codigo, nuevaCantidad, um, p.detalle_id);
                                    }}
                                    className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-center text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    style={{ fontFamily: "var(--font-poppins)" }}
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <select
                                    value={um}
                                    onChange={(e) => {
                                      actualizarCantidad(p.codigo, Number(cantidad) || 0, e.target.value, p.detalle_id);
                                    }}
                                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                                    style={{ fontFamily: "var(--font-poppins)" }}
                                  >
                                    <option value="UNIDAD">UNIDAD</option>
                                    <option value="DOCENAS">DOCENAS</option>
                                    <option value="DECENAS">DECENAS</option>
                                  </select>
                                </td>
                                <td className="px-4 py-3" style={{ borderTopRightRadius: "8px", borderBottomRightRadius: "8px" }}>
                                  <span
                                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${
                                      estado === "PENDIENTE"
                                        ? "bg-red-100 text-red-800 border border-red-200"
                                        : "bg-green-100 text-green-800 border border-green-200"
                                    }`}
                                    style={{ fontFamily: "var(--font-poppins)" }}
                                  >
                                    {estado === "PENDIENTE" && (
                                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                    {estado === "REGISTRADO" && (
                                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                    {estado}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {totalPaginas > 1 && (
                      <div className="flex items-center justify-between p-4 border-t border-gray-200">
                        <div className="text-sm text-gray-600">
                          Mostrando {inicio + 1}-{Math.min(fin, productosFiltrados.length)} de {productosFiltrados.length} productos
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              setPaginacion({
                                ...paginacion,
                                malvinas: { ...paginacion.malvinas, pagina: Math.max(1, paginaActual - 1) },
                              })
                            }
                            disabled={paginaActual === 1}
                            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                          >
                            Anterior
                          </button>
                          <span className="px-3 py-1 text-sm">
                            Página {paginaActual} de {totalPaginas}
                          </span>
                          <button
                            onClick={() =>
                              setPaginacion({
                                ...paginacion,
                                malvinas: { ...paginacion.malvinas, pagina: Math.min(totalPaginas, paginaActual + 1) },
                              })
                            }
                            disabled={paginaActual === totalPaginas}
                            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                          >
                            Siguiente
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: "var(--font-poppins)" }}>
                  Listado de Conteos
                </h2>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <input
                    type="text"
                    placeholder="Buscar..."
                    className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    style={{ fontFamily: "var(--font-poppins)" }}
                    onChange={(e) => {
                      const filtro = e.target.value.toLowerCase();
                      // Filtrar conteos localmente si es necesario
                    }}
                  />
                  <button
                    onClick={cargarConteos}
                    disabled={loadingData}
                    className="px-4 py-2 bg-gradient-to-br from-blue-700 to-blue-800 text-white rounded-lg hover:from-blue-800 hover:to-blue-900 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 font-semibold text-sm"
                    style={{ fontFamily: "var(--font-poppins)" }}
                  >
                    {loadingData ? "Cargando..." : "Actualizar"}
                  </button>
                </div>
              </div>

              {loadingData ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mx-auto"></div>
                </div>
              ) : !Array.isArray(conteos) || conteos.length === 0 ? (
                <div className="text-center py-8 text-gray-500" style={{ fontFamily: "var(--font-poppins)" }}>
                  No hay conteos registrados
                </div>
              ) : (
                <div className="overflow-x-auto p-4">
                  <table className="w-full" style={{ borderCollapse: "separate", borderSpacing: "0" }}>
                    <thead>
                      <tr className="bg-gradient-to-r from-blue-700 to-blue-800">
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-white border-b-2 border-blue-900 whitespace-nowrap text-left" style={{ fontFamily: "var(--font-poppins)" }}>
                          ID
                        </th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-white border-b-2 border-blue-900 whitespace-nowrap text-left" style={{ fontFamily: "var(--font-poppins)" }}>
                          FECHA Y HORA (INICIO)
                        </th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-white border-b-2 border-blue-900 whitespace-nowrap text-left" style={{ fontFamily: "var(--font-poppins)" }}>
                          N° INVENTARIO
                        </th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-white border-b-2 border-blue-900 whitespace-nowrap text-left" style={{ fontFamily: "var(--font-poppins)" }}>
                          TIENDA
                        </th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-white border-b-2 border-blue-900 whitespace-nowrap text-left" style={{ fontFamily: "var(--font-poppins)" }}>
                          REGISTRADO POR
                        </th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-white border-b-2 border-blue-900 whitespace-nowrap text-center" style={{ fontFamily: "var(--font-poppins)" }}>
                          ARCHIVO
                        </th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-white border-b-2 border-blue-900 whitespace-nowrap text-left" style={{ fontFamily: "var(--font-poppins)" }}>
                          HORA FINAL
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(conteos) && conteos.length > 0 ? (
                        conteos.map((conteo, idx) => {
                          if (!conteo) return null;
                          let fechaInicio = "-";
                          let fechaFinal = "-";
                          try {
                            if (conteo.fecha_hora_inicio) {
                              const fecha = new Date(conteo.fecha_hora_inicio);
                              if (!isNaN(fecha.getTime())) {
                                fechaInicio = fmt12(fecha);
                              }
                            }
                            if (conteo.fecha_hora_final) {
                              const fecha = new Date(conteo.fecha_hora_final);
                              if (!isNaN(fecha.getTime())) {
                                fechaFinal = fmt12(fecha);
                              }
                            }
                          } catch (err) {
                            console.warn("Error parseando fecha:", err);
                          }
                          return (
                            <tr 
                              key={conteo.id || conteo.ID || idx} 
                              className="border-b border-gray-200 hover:bg-blue-50/50 transition-colors duration-150"
                            >
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 font-medium" style={{ fontFamily: "var(--font-poppins)" }}>
                                {idx + 1}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700" style={{ fontFamily: "var(--font-poppins)" }}>
                                {fechaInicio}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
                                {conteo.numero_inventario || conteo.INVENTARIO || "-"}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700" style={{ fontFamily: "var(--font-poppins)" }}>
                                {conteo.nombre_tienda || conteo.PUNTO_OPERACION || "-"}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700" style={{ fontFamily: "var(--font-poppins)" }}>
                                {conteo.registrado_por || conteo.NOMBRE || "-"}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-700" style={{ fontFamily: "var(--font-poppins)" }}>
                                {(conteo.archivo_pdf || conteo.LINK_ARCHIVO_PDF) ? (
                                  <button
                                    onClick={async () => {
                                      try {
                                        const conteoId = conteo.id || conteo.ID;
                                        if (!conteoId) {
                                          toast("ID de conteo no disponible", "error");
                                          return;
                                        }
                                        const detalleResponse = await inventarioApi.obtenerDetalleConteo(conteoId);
                                        if (detalleResponse.success && detalleResponse.conteo) {
                                          const pdfBlob = await generarPDFConteoBlob("malvinas", {
                                            numero: detalleResponse.conteo.numero_inventario || conteo.numero_inventario || conteo.INVENTARIO,
                                            registrado: detalleResponse.conteo.registrado_por || conteo.registrado_por || conteo.NOMBRE,
                                            inicio: fechaInicio,
                                            fin: fechaFinal,
                                            tienda: conteo.nombre_tienda || conteo.PUNTO_OPERACION,
                                            filas: (detalleResponse.productos || []).map((p) => ({
                                              item: p.item_producto || 0,
                                              producto: p.producto || "",
                                              codigo: p.codigo || "",
                                              cantidad: Number(p.cantidad || 0),
                                              unidad_medida: p.unidad_medida || "UNIDAD",
                                            })),
                                          });
                                          const url = URL.createObjectURL(pdfBlob);
                                          const a = document.createElement("a");
                                          a.href = url;
                                          a.download = `conteo_malvinas_${conteoId}.pdf`;
                                          a.click();
                                          URL.revokeObjectURL(url);
                                          toast("PDF generado correctamente", "success");
                                        } else {
                                          toast("Error al obtener datos del conteo", "error");
                                        }
                                      } catch (err) {
                                        console.error("Error generando PDF:", err);
                                        toast("Error al generar PDF: " + (err.message || "Error desconocido"), "error");
                                      }
                                    }}
                                    className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                                    style={{ fontFamily: "var(--font-poppins)" }}
                                  >
                                    Ver PDF
                                  </button>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700" style={{ fontFamily: "var(--font-poppins)" }}>
                                {fechaFinal}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-gray-500" style={{ fontFamily: "var(--font-poppins)" }}>
                            No hay conteos registrados
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <ModalAsignarInventario
        isOpen={mostrarModalAsignar}
        onClose={() => setMostrarModalAsignar(false)}
        onSuccess={handleAsignarInventario}
      />

      <ModalUnirseInventario
        isOpen={mostrarModalUnirse}
        onClose={() => setMostrarModalUnirse(false)}
        onSuccess={handleUnirseInventario}
      />

      {mostrarModalInventario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Nuevo Conteo - Malvinas</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tienda</label>
                  <select
                    value={tiendaSeleccionada}
                    onChange={(e) => setTiendaSeleccionada(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccione una tienda...</option>
                    {tiendas.map((tienda) => (
                      <option key={tienda.ID} value={tienda.NOMBRE}>
                        {tienda.NOMBRE}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registrado por</label>
                  <select
                    id="inv-registrado"
                    onChange={(e) => {
                      const container = document.getElementById("inv-otro-container");
                      if (container) {
                        container.classList.toggle("hidden", e.target.value !== "Otro");
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccione...</option>
                    {Array.isArray(colaboradores) && colaboradores.length > 0 ? (
                      colaboradores.map((col) => (
                        <option key={col.ID || col.id} value={col.NOMBRE || col.nombre}>
                          {col.NOMBRE || col.nombre}
                        </option>
                      ))
                    ) : null}
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div id="inv-otro-container" className="hidden">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    id="inv-otro"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setMostrarModalInventario(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={guardarModalInventario}
                    className="flex-1 px-4 py-2 bg-gradient-to-br from-blue-700 to-blue-800 text-white rounded-lg hover:from-blue-800 hover:to-blue-900"
                  >
                    Iniciar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
