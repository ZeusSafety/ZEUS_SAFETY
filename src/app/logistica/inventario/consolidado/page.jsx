"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../components/context/AuthContext";
import { useInventario } from "../../../../context/InventarioContext";
import { Header } from "../../../../components/layout/Header";
import { Sidebar } from "../../../../components/layout/Sidebar";
import { BannerSesion } from "../../../../components/inventario/BannerSesion";
import * as inventarioApi from "../../../../services/inventarioApi";
import { toast } from "../../../../utils/inventarioUtils";

export default function InventarioConsolidadoPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { sesionActual } = useInventario();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [datosCallao, setDatosCallao] = useState({ sistema: new Map(), fisico: new Map() });
  const [datosMalvinas, setDatosMalvinas] = useState({ sistema: new Map(), fisico: new Map() });
  const [loadingData, setLoadingData] = useState(false);
  const [codigosOrdenados, setCodigosOrdenados] = useState([]);

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
    if (user && sesionActual?.inventarioId) {
      cargarConsolidado();
    }
  }, [user, sesionActual?.inventarioId]);

  const cargarConsolidado = async () => {
    if (!sesionActual?.inventarioId) {
      toast("No hay inventario activo", "error");
      return;
    }

    try {
      setLoadingData(true);

      // Cargar datos en paralelo
      const [stockSCallao, stockSMalvinas, stockFCallao, stockFMalvinas] = await Promise.all([
        cargarStockSistema("callao"),
        cargarStockSistema("malvinas"),
        cargarStockFisico("callao"),
        cargarStockFisico("malvinas"),
      ]);

      setDatosCallao({ sistema: stockSCallao, fisico: stockFCallao });
      setDatosMalvinas({ sistema: stockSMalvinas, fisico: stockFMalvinas });

      // Obtener todos los códigos y ordenarlos
      const allCodes = new Set([
        ...stockSCallao.keys(),
        ...stockSMalvinas.keys(),
        ...stockFCallao.keys(),
        ...stockFMalvinas.keys(),
      ]);
      setCodigosOrdenados(Array.from(allCodes).sort());

      toast("Consolidado cargado correctamente", "success");
    } catch (error) {
      console.error("Error cargando consolidado:", error);
      toast("Error al cargar consolidado: " + error.message, "error");
    } finally {
      setLoadingData(false);
    }
  };

  const cargarStockSistema = async (almacen) => {
    const idTipoAlmacen = almacen === "callao" ? "2" : "1";
    const id = `${sesionActual.inventarioId}-${idTipoAlmacen}`;
    const data = await inventarioApi.stockSistemaExcel(id);
    const map = new Map();
    if (Array.isArray(data)) {
      data.forEach((item) => {
        const codigo = item.CODIGO || "";
        if (codigo) {
          map.set(codigo, {
            producto: item.PRODUCTO || "",
            cantidad: Number(item.CANTIDAD) || 0,
          });
        }
      });
    }
    return map;
  };

  const cargarStockFisico = async (almacen) => {
    const id = `${sesionActual.inventarioId}-${almacen}`;
    const data = await inventarioApi.listarConteoPuntoOperacion(id);
    const map = new Map();
    if (Array.isArray(data)) {
      data.forEach((item) => {
        const codigo = item.CODIGO || "";
        if (codigo) {
          const prev = map.get(codigo) || { producto: "", cantidad: 0 };
          prev.cantidad = (prev.cantidad || 0) + (Number(item.TOTAL) || 0);
          if (!prev.producto && item.PRODUCTO) prev.producto = item.PRODUCTO;
          map.set(codigo, prev);
        }
      });
    }
    return map;
  };

  const calcularDiferencia = (fisico, sistema) => {
    return (fisico || 0) - (sistema || 0);
  };

  const obtenerEstado = (diferencia) => {
    if (diferencia === 0) return { texto: "CONFORME", clase: "bg-green-100 text-green-800" };
    if (diferencia > 0) return { texto: "SOBRANTE", clase: "bg-yellow-100 text-yellow-800" };
    return { texto: "FALTANTE", clase: "bg-red-100 text-red-800" };
  };

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

            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-xl flex items-center justify-center text-white shadow-sm">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-2xl font-medium text-gray-900 tracking-tight">Consolidado de Inventarios</h1>
                      <p className="text-sm text-gray-600 font-medium mt-0.5">Vista consolidada de todos los inventarios</p>
                    </div>
                  </div>
                  <button
                    onClick={cargarConsolidado}
                    disabled={loadingData || !sesionActual?.inventarioId}
                    className="px-4 py-2 bg-gradient-to-br from-blue-700 to-blue-800 text-white rounded-lg hover:from-blue-800 hover:to-blue-900 transition-all font-semibold text-sm disabled:opacity-50"
                  >
                    {loadingData ? "Cargando..." : "Actualizar"}
                  </button>
                </div>
              </div>

              {loadingData ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mx-auto"></div>
                </div>
              ) : codigosOrdenados.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {sesionActual?.inventarioId
                    ? "No hay datos disponibles. Asegúrese de haber registrado inventarios físicos y cargado datos del sistema."
                    : "No hay inventario activo. Asigne o únase a un inventario primero."}
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Callao */}
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-700 to-blue-800 p-3">
                      <h3 className="text-white font-bold text-sm">CALLAO</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-[10px]">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="px-2 py-2 text-left font-bold">Producto</th>
                            <th className="px-2 py-2 text-center font-bold">Sis</th>
                            <th className="px-2 py-2 text-center font-bold">Fis</th>
                            <th className="px-2 py-2 text-center font-bold">Dif</th>
                            <th className="px-2 py-2 text-center font-bold">Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {codigosOrdenados.map((codigo) => {
                            const sis = datosCallao.sistema.get(codigo);
                            const fis = datosCallao.fisico.get(codigo);
                            const sisCant = sis?.cantidad || 0;
                            const fisCant = fis?.cantidad || 0;
                            const dif = calcularDiferencia(fisCant, sisCant);
                            const estado = obtenerEstado(dif);
                            const producto = sis?.producto || fis?.producto || "";

                            return (
                              <tr key={codigo} className="border-b border-gray-100 hover:bg-blue-50">
                                <td className="px-2 py-2 text-gray-700" title={producto}>
                                  {producto.substring(0, 30)}...
                                </td>
                                <td className="px-2 py-2 text-gray-700 text-center">{sisCant}</td>
                                <td className="px-2 py-2 text-gray-700 text-center">{fisCant}</td>
                                <td className="px-2 py-2 text-center">
                                  <span className={`px-2 py-1 rounded text-[9px] font-semibold ${estado.clase}`}>
                                    {dif > 0 ? `+${dif}` : dif}
                                  </span>
                                </td>
                                <td className="px-2 py-2 text-center">
                                  <span className={`px-2 py-1 rounded text-[9px] font-semibold ${estado.clase}`}>
                                    {estado.texto}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Malvinas */}
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-700 to-purple-800 p-3">
                      <h3 className="text-white font-bold text-sm">MALVINAS</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-[10px]">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="px-2 py-2 text-left font-bold">Producto</th>
                            <th className="px-2 py-2 text-center font-bold">Sis</th>
                            <th className="px-2 py-2 text-center font-bold">Fis</th>
                            <th className="px-2 py-2 text-center font-bold">Dif</th>
                            <th className="px-2 py-2 text-center font-bold">Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {codigosOrdenados.map((codigo) => {
                            const sis = datosMalvinas.sistema.get(codigo);
                            const fis = datosMalvinas.fisico.get(codigo);
                            const sisCant = sis?.cantidad || 0;
                            const fisCant = fis?.cantidad || 0;
                            const dif = calcularDiferencia(fisCant, sisCant);
                            const estado = obtenerEstado(dif);
                            const producto = sis?.producto || fis?.producto || "";

                            return (
                              <tr key={codigo} className="border-b border-gray-100 hover:bg-purple-50">
                                <td className="px-2 py-2 text-gray-700" title={producto}>
                                  {producto.substring(0, 30)}...
                                </td>
                                <td className="px-2 py-2 text-gray-700 text-center">{sisCant}</td>
                                <td className="px-2 py-2 text-gray-700 text-center">{fisCant}</td>
                                <td className="px-2 py-2 text-center">
                                  <span className={`px-2 py-1 rounded text-[9px] font-semibold ${estado.clase}`}>
                                    {dif > 0 ? `+${dif}` : dif}
                                  </span>
                                </td>
                                <td className="px-2 py-2 text-center">
                                  <span className={`px-2 py-1 rounded text-[9px] font-semibold ${estado.clase}`}>
                                    {estado.texto}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* General */}
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-green-700 to-green-800 p-3">
                      <h3 className="text-white font-bold text-sm">GENERAL</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-[10px]">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="px-2 py-2 text-center font-bold">Sis</th>
                            <th className="px-2 py-2 text-center font-bold">Fis</th>
                            <th className="px-2 py-2 text-center font-bold">Dif</th>
                            <th className="px-2 py-2 text-center font-bold">Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {codigosOrdenados.map((codigo) => {
                            const sisC = datosCallao.sistema.get(codigo);
                            const fisC = datosCallao.fisico.get(codigo);
                            const sisM = datosMalvinas.sistema.get(codigo);
                            const fisM = datosMalvinas.fisico.get(codigo);
                            const sisTotal = (sisC?.cantidad || 0) + (sisM?.cantidad || 0);
                            const fisTotal = (fisC?.cantidad || 0) + (fisM?.cantidad || 0);
                            const dif = calcularDiferencia(fisTotal, sisTotal);
                            const estado = obtenerEstado(dif);

                            return (
                              <tr key={codigo} className="border-b border-gray-100 hover:bg-green-50">
                                <td className="px-2 py-2 text-gray-700 text-center">{sisTotal}</td>
                                <td className="px-2 py-2 text-gray-700 text-center">{fisTotal}</td>
                                <td className="px-2 py-2 text-center">
                                  <span className={`px-2 py-1 rounded text-[9px] font-semibold ${estado.clase}`}>
                                    {dif > 0 ? `+${dif}` : dif}
                                  </span>
                                </td>
                                <td className="px-2 py-2 text-center">
                                  <span className={`px-2 py-1 rounded text-[9px] font-semibold ${estado.clase}`}>
                                    {estado.texto}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
