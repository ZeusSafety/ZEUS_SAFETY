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
      const stored = localStorage.getItem("inventario_state");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.sesionActual) {
            setSesionActualLocal(parsed.sesionActual);
          }
        } catch (e) {}
      }
    }
  }, [user]);

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
      const data = await inventarioApi.extraerInventariosConteos("MALVINAS");
      setConteos(data || []);
    } catch (error) {
      console.error("Error cargando conteos:", error);
      toast(error.message || "Error al cargar conteos", "error");
    } finally {
      setLoadingData(false);
    }
  };

  const handleAsignarInventario = (data) => {
    const nuevaSesion = {
      ...data,
      inicio: fmt12(),
      inventarioId: null,
    };
    setSesionActual(nuevaSesion);
    setSesionActualLocal(nuevaSesion);
    toast("Número de inventario asignado correctamente", "success");
  };

  const handleUnirseInventario = (data) => {
    setSesionActual(data);
    setSesionActualLocal(data);
    toast("Unido al inventario " + data.numero, "success");
  };

  const handleCerrarInventario = () => {
    setSesionActual({ ...sesionActual, activo: false });
    setSesionActualLocal({ ...sesionActualLocal, activo: false });
    toast("Inventario cerrado", "success");
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

    // Verificar si la tienda ya tiene sesión finalizada
    const yaRegistrada = sesiones.malvinas.some((s) => s.fin && s.tienda === tiendaSeleccionada);
    if (yaRegistrada) {
      alert("La tienda seleccionada ya fue registrada.");
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

    const inicio = fmt12();

    const nuevaSesion = {
      id: `local_${Date.now()}`,
      numero,
      registrado,
      inicio,
      tienda: tiendaSeleccionada,
      filas: [],
      fin: null,
    };

    setSesiones({
      ...sesiones,
      malvinas: [...sesiones.malvinas, nuevaSesion],
    });

    setMostrarModalInventario(false);
    setMostrarTablaInventario(true);
    toast("Sesión de inventario iniciada", "success");
  };

  const actualizarCantidad = (codigo, cantidad, unidadMedida) => {
    if (!sesionActualLocal) return;

    const ultimaSesion = sesiones.malvinas[sesiones.malvinas.length - 1];
    if (!ultimaSesion || ultimaSesion.fin) return;

    const producto = productos.find((p) => p.codigo === codigo);
    if (!producto) return;

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
  };

  const registrarInventario = async () => {
    const ultimaSesion = sesiones.malvinas[sesiones.malvinas.length - 1];
    if (!ultimaSesion || ultimaSesion.fin) {
      alert("No hay sesión activa para registrar");
      return;
    }

    if (!sesionActualLocal?.inventarioId) {
      alert("No hay ID de inventario. Debe asignar o unirse a un inventario primero.");
      return;
    }

    try {
      setLoadingData(true);

      const pdfBlob = await generarPDFConteoBlob("malvinas", {
        ...ultimaSesion,
        fin: fmt12(),
      });

      const pdfFile = new File([pdfBlob], `conteo_${ultimaSesion.numero}_${Date.now()}.pdf`, {
        type: "application/pdf",
      });
      const pdfUrl = await inventarioApi.subirArchivo(pdfFile);

      // Obtener ID de punto de operación (Malvinas = 1)
      const idPuntoOperacion = "1";

      const colaborador = colaboradores.find((c) => c.NOMBRE === ultimaSesion.registrado);
      const registradoPorId = colaborador?.ID || ultimaSesion.registrado;

      const productosData = ultimaSesion.filas.map((f) => {
        const producto = productos.find((p) => p.codigo === f.codigo);
        return {
          id_productos: producto?.id || producto?.item || 0,
          cantidad: f.cantidad,
          unidad_medida: f.unidad_medida,
        };
      });

      const fechaInicio = fmt12();
      const fechaFinal = fmt12();

      await inventarioApi.insertarConteo({
        id_inventario: sesionActualLocal.inventarioId,
        id_punto_operacion: idPuntoOperacion,
        fecha_inicio: fechaInicio,
        fecha_final: fechaFinal,
        registrado_por: registradoPorId,
        url_archivo: pdfUrl,
        productos: productosData,
      });

      ultimaSesion.fin = fechaFinal;
      ultimaSesion.pdfUrl = pdfUrl;
      setSesiones({ ...sesiones });

      setMostrarTablaInventario(false);
      toast("Inventario registrado correctamente", "success");
      cargarConteos();
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
    if (!ultimaSesion || ultimaSesion.fin) {
      alert("Primero crea una sesión de inventario.");
      return;
    }

    try {
      const datos = await leerArchivoGenerico(file);
      const mapaCantidades = {};

      datos.forEach((registro) => {
        const map = {};
        Object.keys(registro || {}).forEach((k) => {
          map[normalizarClave(k)] = registro[k];
        });
        const codigo = String(
          map.codigo ?? map.cod ?? map.sku ?? map.codigo_producto ?? map.codigo_interno ?? map.codigo_zeus ?? ""
        ).trim();
        const cantidad = toNumberSafe(
          map.cantidad ?? map.cant ?? map.cantidad_fisica ?? map.stock ?? map.existencia ?? map.cantidadtotal ?? map.cantidad_total ?? 0
        );
        if (codigo) {
          mapaCantidades[codigo] = cantidad;
        }
      });

      if (!ultimaSesion.filas || ultimaSesion.filas.length === 0) {
        ultimaSesion.filas = productos.map((p) => ({
          item: p.item,
          producto: p.producto,
          codigo: p.codigo,
          unidad_medida: p.unidad_medida,
          cantidad: toNumberSafe(mapaCantidades[p.codigo] || 0),
        }));
      } else {
        ultimaSesion.filas.forEach((fila) => {
          if (mapaCantidades[fila.codigo] != null) {
            fila.cantidad = toNumberSafe(mapaCantidades[fila.codigo]) || 0;
          }
        });
      }

      setSesiones({ ...sesiones });
      toast("Archivo de emergencia procesado", "success");
      e.target.value = "";
    } catch (error) {
      alert("Error emergencia: " + error.message);
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

              {mostrarTablaInventario && sesionActiva && (
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

                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gradient-to-r from-blue-700 to-blue-800">
                            <th className="px-4 py-2 text-[10px] font-bold text-white">Item</th>
                            <th className="px-4 py-2 text-[10px] font-bold text-white">Producto</th>
                            <th className="px-4 py-2 text-[10px] font-bold text-white">Código</th>
                            <th className="px-4 py-2 text-[10px] font-bold text-white">Cantidad</th>
                            <th className="px-4 py-2 text-[10px] font-bold text-white">UM</th>
                            <th className="px-4 py-2 text-[10px] font-bold text-white">Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {productosPagina.map((p) => {
                            const fila = mapaCantidades.get(p.codigo);
                            const cantidad = fila?.cantidad || "";
                            const um = fila?.unidad_medida || p.unidad_medida || "UNI";
                            const estado = cantidad === "" ? "PENDIENTE" : "REGISTRADO";

                            return (
                              <tr key={p.codigo} className="border-b border-gray-100 hover:bg-blue-50">
                                <td className="px-4 py-2 text-[10px] text-gray-700">{p.item}</td>
                                <td className="px-4 py-2 text-[10px] text-gray-700">{p.producto}</td>
                                <td className="px-4 py-2 text-[10px] text-gray-700">{p.codigo}</td>
                                <td className="px-4 py-2">
                                  <input
                                    type="number"
                                    min="0"
                                    value={cantidad}
                                    onChange={(e) => {
                                      const nuevaCantidad = Number(e.target.value) || 0;
                                      actualizarCantidad(p.codigo, nuevaCantidad, um);
                                    }}
                                    className="w-24 px-2 py-1 border border-gray-300 rounded text-center text-[10px]"
                                  />
                                </td>
                                <td className="px-4 py-2">
                                  <select
                                    value={um}
                                    onChange={(e) => {
                                      actualizarCantidad(p.codigo, Number(cantidad) || 0, e.target.value);
                                    }}
                                    className="w-20 px-2 py-1 border border-gray-300 rounded text-[10px]"
                                  >
                                    <option value="UNI">UNI</option>
                                    <option value="DOC">DOC</option>
                                  </select>
                                </td>
                                <td className="px-4 py-2">
                                  <span
                                    className={`px-2 py-1 rounded text-[10px] font-semibold ${
                                      estado === "PENDIENTE"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-green-100 text-green-800"
                                    }`}
                                  >
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
              <div className="flex items-center justify-between p-4">
                <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
                  Listado de Conteos
                </h2>
                <button
                  onClick={cargarConteos}
                  disabled={loadingData}
                  className="px-4 py-2 bg-gradient-to-br from-blue-700 to-blue-800 text-white rounded-lg hover:from-blue-800 hover:to-blue-900 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 font-semibold text-sm"
                  style={{ fontFamily: "var(--font-poppins)" }}
                >
                  {loadingData ? "Cargando..." : "Actualizar"}
                </button>
              </div>

              {loadingData ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mx-auto"></div>
                </div>
              ) : conteos.length === 0 ? (
                <div className="text-center py-8 text-gray-500" style={{ fontFamily: "var(--font-poppins)" }}>
                  No hay conteos registrados
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-blue-700 to-blue-800 border-b-2 border-blue-900">
                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: "var(--font-poppins)" }}>
                          ID
                        </th>
                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: "var(--font-poppins)" }}>
                          Fecha Inicio
                        </th>
                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: "var(--font-poppins)" }}>
                          N° Inventario
                        </th>
                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: "var(--font-poppins)" }}>
                          Tienda
                        </th>
                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: "var(--font-poppins)" }}>
                          Registrado por
                        </th>
                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap text-center" style={{ fontFamily: "var(--font-poppins)" }}>
                          Archivo
                        </th>
                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: "var(--font-poppins)" }}>
                          Fecha Final
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {conteos.map((conteo) => (
                        <tr key={conteo.ID} className="hover:bg-blue-50 transition-colors border-b border-gray-100">
                          <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: "var(--font-poppins)" }}>
                            {conteo.ID}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: "var(--font-poppins)" }}>
                            {conteo.FECHA_INICIO || "-"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-[10px] font-medium text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
                            {conteo.INVENTARIO}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: "var(--font-poppins)" }}>
                            {conteo.PUNTO_OPERACION || "-"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: "var(--font-poppins)" }}>
                            {conteo.NOMBRE}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700 text-center">
                            {conteo.LINK_ARCHIVO_PDF ? (
                              <a
                                href={conteo.LINK_ARCHIVO_PDF}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center px-3 py-1.5 bg-gradient-to-br from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                                style={{ fontFamily: "var(--font-poppins)" }}
                              >
                                Ver PDF
                              </a>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-gray-400 text-white rounded-lg text-[10px] font-semibold cursor-not-allowed opacity-50">
                                <span>Sin archivo</span>
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: "var(--font-poppins)" }}>
                            {conteo.FECHA_FINAL || "-"}
                          </td>
                        </tr>
                      ))}
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
                    {colaboradores.map((col) => (
                      <option key={col.ID} value={col.NOMBRE}>
                        {col.NOMBRE}
                      </option>
                    ))}
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
