"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../components/context/AuthContext";
import { useInventario } from "../../../../context/InventarioContext";
import { Header } from "../../../../components/layout/Header";
import { Sidebar } from "../../../../components/layout/Sidebar";
import { BannerSesion } from "../../../../components/inventario/BannerSesion";
import * as inventarioApi from "../../../../services/inventarioApi";
import { fmt12, leerArchivoGenerico, normalizarClave, toNumberSafe, toast } from "../../../../utils/inventarioUtils";
import { generarPDFComparacion, exportarAExcel } from "../../../../utils/pdfUtils";

export default function InventarioCompararPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { sesionActual, sistema, setSistema, comparacion, setComparacion } = useInventario();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [almacenSeleccionado, setAlmacenSeleccionado] = useState(null);
  const [datosComparacion, setDatosComparacion] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("ALL");
  const [mostrarModalSistema, setMostrarModalSistema] = useState(false);
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

  const cargarSistemaDesdeArchivo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const almacen = almacenSeleccionado || "callao";

    try {
      const arr = await leerArchivoGenerico(file);
      const datosProcesados = arr.map((r, i) => {
        const m = {};
        Object.keys(r || {}).forEach((k) => {
          m[normalizarClave(k)] = r[k];
        });
        const item = toNumberSafe(m.item ?? i + 1) || i + 1;
        const producto = m.producto ?? m.nombre ?? m.nombre_producto ?? "";
        const codigo = (m.codigo ?? m.cod ?? m.code ?? m.sku ?? "").toString().trim();
        const cantidadSistema = toNumberSafe(m.cantidad_sistema ?? m.cantidad_sis ?? m.sistema ?? m.stock ?? 0);
        return { item, producto, codigo, cantidad_sistema: cantidadSistema };
      }).filter((x) => x.codigo);

      setSistema({ ...sistema, [almacen]: datosProcesados });

      // Guardar en API
      if (sesionActual?.inventarioId) {
        try {
          const idTipoAlmacen = almacen === "callao" ? "2" : "1";
          await inventarioApi.conteoSistemaInventarioExcel({
            id_inventario: String(sesionActual.inventarioId),
            id_tipo_almacen: idTipoAlmacen,
            detalle: datosProcesados.map((item) => ({
              producto: item.producto || "",
              cantidad: String(item.cantidad_sistema || 0),
              codigo: item.codigo || "",
            })),
          });
          toast(`Sistema (${almacen}) guardado en la base de datos.`, "success");
        } catch (apiError) {
          console.error("Error enviando datos del sistema:", apiError);
          toast("Archivo cargado localmente, pero no se pudo guardar en la API", "warning");
        }
      }

      toast(`Archivo de sistema (${almacen}) cargado: ${datosProcesados.length} filas.`, "success");
      setMostrarModalSistema(false);
      e.target.value = "";
    } catch (err) {
      alert("Error al leer archivo del sistema: " + err.message);
    }
  };

  const extraerConteosGuardados = async (almacen) => {
    if (!sesionActual?.inventarioId) {
      alert("No hay inventario activo.");
      return;
    }

    try {
      const idTipoAlmacen = almacen === "callao" ? "2" : "1";
      const id = `${sesionActual.inventarioId}-${idTipoAlmacen}`;
      const data = await inventarioApi.stockSistemaExcel(id);

      if (!Array.isArray(data) || data.length === 0) {
        toast("No se encontraron conteos guardados para este inventario.", "info");
        return;
      }

      const datosProcesados = data.map((item, index) => ({
        item: index + 1,
        producto: item.PRODUCTO || "",
        codigo: item.CODIGO || "",
        cantidad_sistema: Number(item.CANTIDAD) || 0,
      })).filter((x) => x.codigo);

      setSistema({ ...sistema, [almacen]: datosProcesados });
      toast(`Conteos cargados: ${datosProcesados.length} productos.`, "success");
      setMostrarModalSistema(false);
    } catch (error) {
      console.error("Error extrayendo conteos guardados:", error);
      alert("Error al extraer conteos guardados: " + error.message);
    }
  };

  const cargarYComparar = async (almacen) => {
    if (!sistema[almacen] || sistema[almacen].length === 0) {
      alert(`No hay datos del sistema cargados para ${almacen}.\n\nDebe adjuntar un archivo Excel primero.`);
      return;
    }

    if (!sesionActual?.inventarioId) {
      alert("No hay inventario activo.");
      return;
    }

    try {
      setLoadingData(true);

      // Cargar datos físicos desde API
      const id = `${sesionActual.inventarioId}-${almacen}`;
      const datosFisicos = await inventarioApi.listarConteoPuntoOperacion(id);

      if (!Array.isArray(datosFisicos) || datosFisicos.length === 0) {
        alert("No hay datos físicos registrados para comparar.");
        return;
      }

      // Crear mapas para comparación
      const mapSis = new Map(sistema[almacen].map((s) => [s.codigo, s]));
      const mapFis = new Map();

      // Agrupar datos físicos por código
      datosFisicos.forEach((item) => {
        const codigo = item.CODIGO || "";
        if (codigo) {
          const prev = mapFis.get(codigo) || { cantidad_fisica: 0, producto: item.PRODUCTO || "", item: item.ITEM || "" };
          prev.cantidad_fisica = (prev.cantidad_fisica || 0) + (Number(item.TOTAL) || 0);
          if (!prev.producto && item.PRODUCTO) prev.producto = item.PRODUCTO;
          if (!prev.item && item.ITEM) prev.item = item.ITEM;
          mapFis.set(codigo, prev);
        }
      });

      const codigos = new Set([...mapSis.keys(), ...mapFis.keys()]);
      const filas = [];

      codigos.forEach((c) => {
        const s = mapSis.get(c);
        const f = mapFis.get(c);
        const prod = f?.producto || s?.producto || "";
        const item = f?.item || s?.item || "";
        const sis = Number(s?.cantidad_sistema || 0);
        const fis = Number(f?.cantidad_fisica || 0);
        const res = fis - sis;
        const estado = res === 0 ? "CONFORME" : res > 0 ? "SOBRANTE" : "FALTANTE";
        filas.push({ item, producto: prod, codigo: c, sis, fis, res, estado });
      });

      setComparacion({ almacen, filas, numero: sesionActual.numero, fecha: fmt12() });
      setDatosComparacion(filas);
      setAlmacenSeleccionado(almacen);
      toast(`Comparación abierta para ${almacen}`, "success");
    } catch (error) {
      console.error("Error en cargarYComparar:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoadingData(false);
    }
  };

  const exportarPDF = async () => {
    if (!comparacion.almacen || datosComparacion.length === 0) {
      alert("No hay datos para exportar");
      return;
    }

    try {
      const blob = await generarPDFComparacion(comparacion, {
        texto: filtroTexto,
        estado: filtroEstado,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Comparacion_${comparacion.almacen}.pdf`;
      a.click();
      toast("PDF exportado correctamente", "success");
    } catch (error) {
      alert("Error al exportar PDF: " + error.message);
    }
  };

  const exportarExcel = async () => {
    if (!comparacion.almacen || datosComparacion.length === 0) {
      alert("No hay datos para exportar");
      return;
    }

    try {
      let filasFiltradas = datosComparacion;

      if (filtroTexto) {
        const txt = filtroTexto.toLowerCase();
        filasFiltradas = filasFiltradas.filter(
          (f) =>
            String(f.codigo || "").toLowerCase().includes(txt) ||
            String(f.producto || "").toLowerCase().includes(txt)
        );
      }

      if (filtroEstado === "OK") {
        filasFiltradas = filasFiltradas.filter((f) => f.res === 0);
      } else if (filtroEstado === "BAD") {
        filasFiltradas = filasFiltradas.filter((f) => f.res !== 0);
      }

      const data = filasFiltradas.map((f) => ({
        Item: f.item,
        Producto: f.producto,
        Código: f.codigo,
        Sistema: f.sis,
        Físico: f.fis,
        Resultado: f.res,
        Estado: f.estado,
      }));

      await exportarAExcel(data, `Comparacion_${comparacion.almacen}.xlsx`);
      toast("Excel exportado correctamente", "success");
    } catch (error) {
      alert("Error al exportar Excel: " + error.message);
    }
  };

  // Filtrar datos
  let datosFiltrados = datosComparacion;
  if (filtroTexto) {
    const txt = filtroTexto.toLowerCase();
    datosFiltrados = datosFiltrados.filter(
      (f) =>
        String(f.codigo || "").toLowerCase().includes(txt) ||
        String(f.producto || "").toLowerCase().includes(txt)
    );
  }
  if (filtroEstado === "OK") {
    datosFiltrados = datosFiltrados.filter((f) => f.res === 0);
  } else if (filtroEstado === "BAD") {
    datosFiltrados = datosFiltrados.filter((f) => f.res !== 0);
  }

  const correctos = datosFiltrados.filter((f) => f.res === 0).length;
  const incorrectos = datosFiltrados.filter((f) => f.res !== 0).length;

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

            <BannerSesion sesionActual={sesionActual} />

            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6 mb-4">
              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-xl flex items-center justify-center text-white shadow-sm">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-2xl font-medium text-gray-900 tracking-tight">Comparación de Inventario</h1>
                    <p className="text-sm text-gray-600 font-medium mt-0.5">Comparar inventarios físicos con sistema</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mb-4 flex-wrap">
                <button
                  onClick={() => {
                    setAlmacenSeleccionado("callao");
                    setMostrarModalSistema(true);
                  }}
                  className="px-4 py-2 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-semibold text-sm"
                >
                  Subir Sistema Callao
                </button>
                <button
                  onClick={() => {
                    setAlmacenSeleccionado("malvinas");
                    setMostrarModalSistema(true);
                  }}
                  className="px-4 py-2 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-semibold text-sm"
                >
                  Subir Sistema Malvinas
                </button>
                <button
                  onClick={() => cargarYComparar("callao")}
                  disabled={loadingData || !sistema.callao?.length}
                  className="px-4 py-2 bg-gradient-to-br from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-semibold text-sm disabled:opacity-50"
                >
                  Comparar Callao
                </button>
                <button
                  onClick={() => cargarYComparar("malvinas")}
                  disabled={loadingData || !sistema.malvinas?.length}
                  className="px-4 py-2 bg-gradient-to-br from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-semibold text-sm disabled:opacity-50"
                >
                  Comparar Malvinas
                </button>
                {datosComparacion.length > 0 && (
                  <>
                    <button
                      onClick={exportarPDF}
                      className="px-4 py-2 bg-gradient-to-br from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all font-semibold text-sm"
                    >
                      Exportar PDF
                    </button>
                    <button
                      onClick={exportarExcel}
                      className="px-4 py-2 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all font-semibold text-sm"
                    >
                      Exportar Excel
                    </button>
                  </>
                )}
              </div>

              {comparacion.almacen && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm text-gray-700">
                    <strong>Almacén:</strong> {comparacion.almacen.toUpperCase()} | <strong>Inventario:</strong> {comparacion.numero} | <strong>Fecha:</strong> {comparacion.fecha}
                  </div>
                  <div className="mt-2 flex gap-4 text-sm">
                    <span className="text-green-700 font-semibold">Correctos: {correctos}</span>
                    <span className="text-red-700 font-semibold">Incorrectos: {incorrectos}</span>
                  </div>
                </div>
              )}

              {datosComparacion.length > 0 && (
                <div className="mb-4 flex gap-2">
                  <input
                    type="text"
                    placeholder="Buscar por código o producto..."
                    value={filtroTexto}
                    onChange={(e) => setFiltroTexto(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => setFiltroEstado("ALL")}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm ${
                      filtroEstado === "ALL"
                        ? "bg-blue-700 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setFiltroEstado("OK")}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm ${
                      filtroEstado === "OK"
                        ? "bg-green-700 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Correctos
                  </button>
                  <button
                    onClick={() => setFiltroEstado("BAD")}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm ${
                      filtroEstado === "BAD"
                        ? "bg-red-700 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Incorrectos
                  </button>
                </div>
              )}

              {loadingData && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mx-auto"></div>
                </div>
              )}

              {datosComparacion.length > 0 && !loadingData && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-blue-700 to-blue-800">
                        <th className="px-4 py-3 text-[10px] font-bold text-white">Item</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-white">Producto</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-white">Código</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-white text-center">Sistema</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-white text-center">Físico</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-white text-center">Resultado</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-white">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {datosFiltrados.map((fila, idx) => {
                        const resTxt = fila.res > 0 ? `+${fila.res}` : fila.res < 0 ? `${fila.res}` : "0";
                        const estCls =
                          fila.estado === "CONFORME"
                            ? "bg-green-100 text-green-800"
                            : fila.estado === "FALTANTE"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800";

                        return (
                          <tr key={idx} className="border-b border-gray-100 hover:bg-blue-50">
                            <td className="px-4 py-2 text-[10px] text-gray-700">{fila.item}</td>
                            <td className="px-4 py-2 text-[10px] text-gray-700">{fila.producto}</td>
                            <td className="px-4 py-2 text-[10px] text-gray-700">{fila.codigo}</td>
                            <td className="px-4 py-2 text-[10px] text-gray-700 text-center">{fila.sis}</td>
                            <td className="px-4 py-2 text-[10px] text-gray-700 text-center">{fila.fis}</td>
                            <td className="px-4 py-2 text-center">
                              <span className={`px-2 py-1 rounded text-[10px] font-semibold ${estCls}`}>{resTxt}</span>
                            </td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-1 rounded text-[10px] font-semibold ${estCls}`}>{fila.estado}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {!almacenSeleccionado && datosComparacion.length === 0 && !loadingData && (
                <div className="text-center py-8 text-gray-500">
                  Seleccione un almacén y cargue los datos para comparar
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {mostrarModalSistema && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Subir Sistema - {almacenSeleccionado?.toUpperCase()}
              </h2>
              <div className="space-y-4">
                <button
                  onClick={() => {
                    const almacen = almacenSeleccionado || "callao";
                    extraerConteosGuardados(almacen);
                  }}
                  className="w-full px-4 py-2 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-semibold"
                >
                  Extraer Conteos Guardados
                </button>
                <div className="text-center text-gray-500">o</div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subir archivo Excel/CSV</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={cargarSistemaDesdeArchivo}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setMostrarModalSistema(false);
                      setAlmacenSeleccionado(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cerrar
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
