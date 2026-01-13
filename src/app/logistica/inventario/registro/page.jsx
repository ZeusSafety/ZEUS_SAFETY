"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../components/context/AuthContext";
import { useInventario } from "../../../../context/InventarioContext";
import { Header } from "../../../../components/layout/Header";
import { Sidebar } from "../../../../components/layout/Sidebar";
import * as inventarioApi from "../../../../services/inventarioApi";
import { toast } from "../../../../utils/inventarioUtils";

export default function InventarioRegistroPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { sesiones } = useInventario();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inventarios, setInventarios] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [filtroDesde, setFiltroDesde] = useState("");
  const [filtroHasta, setFiltroHasta] = useState("");
  const [gruposExpandidos, setGruposExpandidos] = useState(new Set());

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
      cargarInventarios();
    }
  }, [user]);

  const cargarInventarios = async () => {
    try {
      setLoadingData(true);
      const data = await inventarioApi.listarInventarios();
      setInventarios(data || []);
    } catch (error) {
      console.error("Error cargando inventarios:", error);
      toast(error.message || "Error al cargar inventarios", "error");
    } finally {
      setLoadingData(false);
    }
  };

  const toggleGrupo = (numero) => {
    const nuevos = new Set(gruposExpandidos);
    if (nuevos.has(numero)) {
      nuevos.delete(numero);
    } else {
      nuevos.add(numero);
    }
    setGruposExpandidos(nuevos);
  };

  // Agrupar sesiones por número de inventario
  const grupos = new Map();
  
  [["callao"], ["malvinas"]].forEach(([almacen]) => {
    (sesiones[almacen] || []).forEach((s) => {
      if (!s.numero) return;
      
      const finDate = s.fin ? new Date(s.fin.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$2/$1/$3")) : null;
      const inicioDate = s.inicio ? new Date(s.inicio.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$2/$1/$3")) : null;
      const comp = finDate || inicioDate;
      
      if (filtroDesde && comp && comp < new Date(filtroDesde + "T00:00:00")) return;
      if (filtroHasta && comp && comp > new Date(filtroHasta + "T23:59:59")) return;
      
      const tipoTienda = almacen === "callao" ? s.tipo : s.tienda || "";
      const g = grupos.get(s.numero) || { numero: s.numero, items: [] };
      g.items.push({ almacen, s, tipoTienda });
      grupos.set(s.numero, g);
    });
  });

  const orden = Array.from(grupos.values()).sort((a, b) => {
    const na = parseInt(String(a.numero).split("-").pop() || "0", 10);
    const nb = parseInt(String(b.numero).split("-").pop() || "0", 10);
    return nb - na; // Más recientes primero
  });

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

            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-xl flex items-center justify-center text-white shadow-sm">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-2xl font-medium text-gray-900 tracking-tight">Registro de Inventarios</h1>
                      <p className="text-sm text-gray-600 font-medium mt-0.5">Historial de todos los inventarios registrados</p>
                    </div>
                  </div>
                  <button
                    onClick={cargarInventarios}
                    disabled={loadingData}
                    className="px-4 py-2 bg-gradient-to-br from-blue-700 to-blue-800 text-white rounded-lg hover:from-blue-800 hover:to-blue-900 transition-all font-semibold text-sm disabled:opacity-50"
                  >
                    {loadingData ? "Cargando..." : "Actualizar"}
                  </button>
                </div>
              </div>

              <div className="mb-4 flex gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                  <input
                    type="date"
                    value={filtroDesde}
                    onChange={(e) => setFiltroDesde(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                  <input
                    type="date"
                    value={filtroHasta}
                    onChange={(e) => setFiltroHasta(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                {loadingData ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mx-auto"></div>
                  </div>
                ) : orden.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No hay inventarios registrados</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gradient-to-r from-blue-700 to-blue-800">
                          <th className="px-4 py-3 text-[10px] font-bold text-white">#</th>
                          <th className="px-4 py-3 text-[10px] font-bold text-white">N° Inventario</th>
                          <th className="px-4 py-3 text-[10px] font-bold text-white">Almacén</th>
                          <th className="px-4 py-3 text-[10px] font-bold text-white">Tipo/Tienda</th>
                          <th className="px-4 py-3 text-[10px] font-bold text-white">Registrado por</th>
                          <th className="px-4 py-3 text-[10px] font-bold text-white">Fecha Inicio</th>
                          <th className="px-4 py-3 text-[10px] font-bold text-white">Fecha Final</th>
                          <th className="px-4 py-3 text-[10px] font-bold text-white">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orden.map((grupo, idx) => {
                          const estaExpandido = gruposExpandidos.has(grupo.numero);
                          return (
                            <React.Fragment key={grupo.numero}>
                              <tr className="bg-blue-50 border-b-2 border-blue-200">
                                <td className="px-4 py-3 text-[10px] font-semibold text-gray-900">{idx + 1}</td>
                                <td colSpan={7} className="px-4 py-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => toggleGrupo(grupo.numero)}
                                        className="text-blue-700 hover:text-blue-900"
                                      >
                                        {estaExpandido ? (
                                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                          </svg>
                                        ) : (
                                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                          </svg>
                                        )}
                                      </button>
                                      <strong className="text-gray-900">{grupo.numero}</strong>
                                      <span className="text-gray-600 text-sm">({grupo.items.length} registro(s))</span>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                              {estaExpandido &&
                                grupo.items.map((item, itemIdx) => (
                                  <tr key={`${grupo.numero}-${itemIdx}`} className="bg-gray-50 border-b border-gray-200">
                                    <td className="px-4 py-2 text-[10px] text-gray-700"></td>
                                    <td className="px-4 py-2 text-[10px] text-gray-700">{item.s.numero}</td>
                                    <td className="px-4 py-2 text-[10px] text-gray-700">{item.almacen.toUpperCase()}</td>
                                    <td className="px-4 py-2 text-[10px] text-gray-700">{item.tipoTienda || "-"}</td>
                                    <td className="px-4 py-2 text-[10px] text-gray-700">{item.s.registrado}</td>
                                    <td className="px-4 py-2 text-[10px] text-gray-700">{item.s.inicio || "-"}</td>
                                    <td className="px-4 py-2 text-[10px] text-gray-700">{item.s.fin || "-"}</td>
                                    <td className="px-4 py-2">
                                      <button
                                        onClick={() => router.push(`/logistica/inventario/comparar`)}
                                        className="px-2 py-1 bg-blue-600 text-white rounded text-[10px] hover:bg-blue-700"
                                      >
                                        Comparar
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
