"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/context/AuthContext";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import dynamic from "next/dynamic";
import { getReporte2Full } from "../../../services/marketingReportApi";

const PeruRegionesMap = dynamic(
  () => import("./PeruRegionesMap"),
  { ssr: false, loading: () => <div className="h-64 rounded-xl bg-gray-100 animate-pulse flex items-center justify-center"><span className="text-sm text-gray-500">Cargando mapa…</span></div> }
);

const BG = "#F7FAFF";
const ACCENT = "#FACC15";
const ZEUS_BLUE = "#002D5A";
const ZEUS_GOLD = "#E5A017";

function clampNumber(n) {
  if (typeof n === "string") {
    const cleaned = n.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
    const x2 = Number(cleaned);
    if (Number.isFinite(x2)) return x2;
  }
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}

function pickNumber(obj, keys = []) {
  if (!obj || typeof obj !== "object") return 0;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) {
      const v = clampNumber(obj[k]);
      if (v !== 0) return v;
    }
  }
  let best = 0;
  for (const v of Object.values(obj)) {
    const num = clampNumber(v);
    if (num > best) best = num;
  }
  return best;
}

function formatMoneyPEN(value) {
  const n = clampNumber(value);
  return `S/. ${n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatInt(value) {
  const n = clampNumber(value);
  return n.toLocaleString("es-PE");
}

function Skeleton({ className }) {
  return <div className={`animate-pulse rounded-xl bg-gray-200 ${className}`} />;
}

const UNIQUE_PALETTE = ["#2563EB", "#F59E0B", "#10B981", "#A855F7", "#EF4444", "#06B6D4", "#84CC16", "#F97316", "#0EA5E9", "#22C55E"];
function hashColor(key) {
  const s = String(key ?? "");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return UNIQUE_PALETTE[h % UNIQUE_PALETTE.length];
}

export default function ReporteGeneral2MarketingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Multi-filtros (circular BI)
  const [filters, setFilters] = useState({
    cliente: null,
    region: null,
    pago: null,
    comprobante: null,
    almacen: null,
    inicio: "",
    fin: "",
  });

  // Importante: si fechas vienen vacías, el backend usa su histórico por defecto (None)
  // Por eso iniciamos vacío para que al cargar se vea TODO.
  const inicio = filters.inicio;
  const fin = filters.fin;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Prompt maestro: selectedClient inicialmente null
  const selectedCliente = filters.cliente;

  // dashboardData: objeto completo que devuelve la API (Postman)
  const [dashboardData, setDashboardData] = useState(null);

  const abortMainRef = useRef(null);

  // paginación clientes
  const [clientesPage, setClientesPage] = useState(1);
  const clientesPorPagina = 12;

  // paginación productos por cliente
  const [productosPage, setProductosPage] = useState(1);
  const productosPorPagina = 12;

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    const handleResize = () => setSidebarOpen(window.innerWidth >= 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // === Petición Centralizada (depende de TODOS los filtros) ===
  useEffect(() => {
    if (!user) return;

    abortMainRef.current?.abort?.();
    const controller = new AbortController();
    abortMainRef.current = controller;

    setLoading(true);
    setError("");

    getReporte2Full({
      inicio: filters.inicio || "",
      fin: filters.fin || "",
      cliente: filters.cliente || "",
      region: filters.region || "",
      pago: filters.pago || "",
      comprobante: filters.comprobante || "",
      almacen: filters.almacen || "",
      signal: controller.signal,
    })
      .then((res) => setDashboardData(res))
      .catch((e) => {
        if (e?.name === "AbortError") return;
        setError(e?.message || "No se pudo cargar el reporte.");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [filters, user]);

  // Reset de paginación al cambiar rango/cliente (sin borrar selección)
  useEffect(() => {
    setClientesPage(1);
    setProductosPage(1);
    setDashboardData(null);
  }, [filters.inicio, filters.fin, filters.cliente, filters.region, filters.pago, filters.comprobante, filters.almacen]);

  // ====== adaptadores de data ======
  const rankingRaw = Array.isArray(dashboardData?.ranking) ? dashboardData.ranking : [];
  const productosRaw = Array.isArray(dashboardData?.productos) ? dashboardData.productos : [];
  const pagosRaw = Array.isArray(dashboardData?.pagos) ? dashboardData.pagos : [];
  const comprobantesRaw = Array.isArray(dashboardData?.comprobantes) ? dashboardData.comprobantes : [];
  const almacenesRaw = Array.isArray(dashboardData?.almacenes) ? dashboardData.almacenes : [];
  const regionesRaw = Array.isArray(dashboardData?.geografia?.regiones) ? dashboardData.geografia.regiones : [];
  const distritosRaw = Array.isArray(dashboardData?.geografia?.distritos) ? dashboardData.geografia.distritos : [];

  const clientes = rankingRaw.map((r) => ({
    name: r?.cliente ?? r?.CLIENTE ?? r?.nombre ?? r?.NOMBRE ?? "—",
    // Fix: tu SP puede devolver la cantidad con otro nombre -> evitamos que salga 0
    compras: pickNumber(r, ["cantidad", "CANTIDAD", "compras", "COMPRAS", "cantidad_compras", "CANTIDAD_COMPRAS", "total_compras", "TOTAL_COMPRAS"]),
  }));

  const totalClientesPaginas = Math.max(1, Math.ceil((clientes.length || 0) / clientesPorPagina));
  const clientesPaginados = clientes.slice((clientesPage - 1) * clientesPorPagina, clientesPage * clientesPorPagina);

  const productosCliente = productosRaw.map((r) => ({
    producto: r?.producto ?? r?.PRODUCTO ?? r?.descripcion ?? "—",
    cantUnidad: pickNumber(r, ["cantidad_unidad", "CANTIDAD_UNIDAD", "cant_unidad", "CANT_UNIDAD", "unidades", "UNIDADES"]),
    totalUnidad: pickNumber(r, ["total_unidad", "TOTAL_UNIDAD"]),
    cantDocena: pickNumber(r, ["cantidad_docena", "CANTIDAD_DOCENA", "cant_docena", "CANT_DOCENA", "docenas", "DOCENAS"]),
    totalDocena: pickNumber(r, ["total_docena", "TOTAL_DOCENA"]),
    cantPares: pickNumber(r, ["cantidad_pares", "CANTIDAD_PARES", "cant_pares", "CANT_PARES", "pares", "PARES"]),
    totalPares: pickNumber(r, ["total_pares", "TOTAL_PARES"]),
  }));
  const totalProductosPaginas = Math.max(1, Math.ceil((productosCliente.length || 0) / productosPorPagina));
  const productosClientePaginados = productosCliente.slice((productosPage - 1) * productosPorPagina, productosPage * productosPorPagina);

  // Pagos: MONTO (S/.), no cantidad
  const pagos = pagosRaw.map((r) => ({
    name: r?.pago ?? r?.PAGO ?? r?.metodo ?? r?.METODO ?? r?.forma_pago ?? r?.FORMA_DE_PAGO ?? "—",
    value: pickNumber(r, ["monto", "MONTO", "total", "TOTAL"]),
  }));

  const regiones = regionesRaw.map((r) => ({
    name: r?.region ?? r?.REGION ?? "—",
    // regiones: normalmente viene cantidad/total; mantenemos el mismo para el filtro
    value: pickNumber(r, ["cantidad", "CANTIDAD", "total", "TOTAL"]),
  }));

  const distritos = distritosRaw
    .map((r) => ({
      name: r?.distrito ?? r?.DISTRITO ?? "—",
      value: pickNumber(r, ["cantidad", "CANTIDAD", "total", "TOTAL"]),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Comprobantes: MONTO (S/.), no cantidad
  const comprobantes = comprobantesRaw
    .map((r) => ({
      name: r?.comprobante ?? r?.COMPROBANTE ?? r?.tipo ?? r?.TIPO ?? "—",
      value: pickNumber(r, ["monto", "MONTO", "total", "TOTAL"]),
    }))
    .sort((a, b) => b.value - a.value);

  const almacenes = almacenesRaw.map((r) => ({
    name: r?.almacen ?? r?.ALMACEN ?? r?.salida ?? r?.SALIDA_DE_PEDIDO ?? "—",
    value: pickNumber(r, ["cantidad", "CANTIDAD", "total", "TOTAL", "monto", "MONTO"]),
  }));

  const valMalvinas = almacenes.find((a) => String(a.name).toUpperCase().includes("MALVIN"))?.value || 0;
  const valCallao = almacenes.find((a) => String(a.name).toUpperCase().includes("CALLAO"))?.value || 0;

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-50" style={{ background: BG }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${sidebarOpen ? "lg:ml-60 ml-0" : "ml-0"}`}>
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto custom-scrollbar" style={{ background: "#F7FAFF" }}>
          <div className="max-w-[95%] mx-auto px-4 py-5">
            <button
              onClick={() => router.push("/marketing")}
              className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-[#002D5A] to-[#002D5A] text-white rounded-lg font-semibold hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver a Marketing</span>
            </button>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6 mb-6">
              {/* Header */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#002D5A] to-[#002D5A] rounded-xl flex items-center justify-center text-white shadow-sm">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h18" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: "var(--font-poppins)" }}>
                      Reporte General 2
                    </h1>
                    <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: "var(--font-poppins)" }}>
                      Clientes, productos por cliente, pagos, geografía y comprobantes
                    </p>
                  </div>
                </div>

                <div className={`flex items-center space-x-2 rounded-lg px-3 py-1.5 ${error ? "bg-red-50 border border-red-200" : "bg-green-50 border border-green-200"}`}>
                  <svg className={`w-4 h-4 ${error ? "text-red-600" : "text-green-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className={`text-sm font-semibold ${error ? "text-red-700" : "text-green-700"}`} style={{ fontFamily: "var(--font-poppins)" }}>
                    {loading ? "Cargando..." : error ? "Error" : "Cargado"}
                  </span>
                </div>
              </div>

              {/* Barra de filtros activos */}
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {[
                  ["cliente", filters.cliente],
                  ["region", filters.region],
                  ["pago", filters.pago],
                  ["comprobante", filters.comprobante],
                  ["almacen", filters.almacen],
                ]
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setFilters((prev) => ({ ...prev, [k]: null }))}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold"
                      style={{ fontFamily: "var(--font-poppins)" }}
                      title="Eliminar filtro"
                    >
                      <span className="w-2 h-2 rounded-full" style={{ background: hashColor(`${k}:${v}`) }} />
                      <span className="truncate max-w-[240px]">{k.toUpperCase()}: {v}</span>
                      <span className="text-gray-400">✕</span>
                    </button>
                  ))}
                {!filters.cliente && !filters.region && !filters.pago && !filters.comprobante && !filters.almacen && (
                  <span className="text-xs text-gray-500">Sin filtros (mostrando total)</span>
                )}
              </div>

              {/* Filtros */}
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="text-xs font-semibold text-gray-700 mb-1" style={{ fontFamily: "var(--font-poppins)" }}>
                    Rango de fechas
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-900">
                      <span className="text-xs text-gray-500">Inicio</span>
                      <input
                        type="date"
                        value={filters.inicio}
                        onChange={(e) => setFilters((prev) => ({ ...prev, inicio: e.target.value }))}
                        className="bg-transparent text-sm outline-none"
                        style={{ colorScheme: "light" }}
                      />
                    </label>
                    <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-900">
                      <span className="text-xs text-gray-500">Fin</span>
                      <input
                        type="date"
                        value={filters.fin}
                        onChange={(e) => setFilters((prev) => ({ ...prev, fin: e.target.value }))}
                        className="bg-transparent text-sm outline-none"
                        style={{ colorScheme: "light" }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setFilters((prev) => ({ ...prev, inicio: "", fin: "" }));
                      }}
                      className="px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-semibold transition-all duration-200"
                      style={{ fontFamily: "var(--font-poppins)" }}
                      title="Ver todo el histórico"
                    >
                      Limpiar fechas
                    </button>
                  </div>
                  <div className="mt-2 text-[11px] text-gray-500" style={{ fontFamily: "var(--font-poppins)" }}>
                    {filters.inicio || filters.fin ? "Filtrando por rango seleccionado" : "Mostrando todo el histórico (sin filtro de fechas)"}
                  </div>
                </div>
                <div className="text-xs text-gray-600 flex items-center gap-3">
                  {!!(filters.cliente || filters.region || filters.pago || filters.comprobante || filters.almacen) && (
                    <button
                      type="button"
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          cliente: null,
                          region: null,
                          pago: null,
                          comprobante: null,
                          almacen: null,
                        }))
                      }
                      className="px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-semibold transition-all duration-200"
                      style={{ fontFamily: "var(--font-poppins)" }}
                      title="Limpiar filtros (mantiene fechas)"
                    >
                      Limpiar filtros
                    </button>
                  )}

                  <span className="inline-flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: loading ? "#60A5FA" : "#22C55E" }} />
                    {loading ? "Actualizando…" : "Datos actualizados"}
                  </span>
                </div>
              </div>

              {error && <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

              {/* Fila 1: SOLO 2 tablas */}
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* COMPRAS POR CLIENTE */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                  <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                      </svg>
                      <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
                        COMPRAS POR CLIENTE
                      </h2>
                    </div>
                  </div>

                  {loading ? (
                    <div className="px-4 pb-4 space-y-2">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : clientes.length === 0 ? (
                    <div className="px-4 pb-4 text-sm text-gray-600">Sin datos.</div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-[#002D5A] border-b-2 border-[#E5A017]">
                              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">CLIENTE</th>
                              <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">CANTIDAD</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {clientesPaginados.map((c, idx) => (
                              <tr
                                key={`${c.name}-${idx}`}
                                className={`hover:bg-slate-200 transition-colors cursor-pointer ${filters.cliente === c.name ? "bg-yellow-50" : ""}`}
                                onClick={() => {
                                  // si haces click al mismo cliente -> toggle off (histórico total)
                                  setFilters((prev) => ({ ...prev, cliente: prev.cliente === c.name ? null : c.name }));
                                  setProductosPage(1);
                                }}
                                title="Click para ver productos del cliente"
                              >
                                <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{c.name}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700 text-right font-semibold">{formatInt(c.compras)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="bg-slate-200 px-3 py-2 flex items-center justify-between border-t-2 border-slate-300">
                        <button
                          disabled={clientesPage === 1}
                          onClick={() => setClientesPage(1)}
                          className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          aria-label="Primera página"
                        >
                          «
                        </button>
                        <button
                          onClick={() => setClientesPage((p) => Math.max(1, p - 1))}
                          disabled={clientesPage === 1}
                          className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          aria-label="Página anterior"
                        >
                          &lt;
                        </button>
                        <span className="text-[10px] text-gray-700 font-medium">Página {clientesPage} de {totalClientesPaginas}</span>
                        <button
                          onClick={() => setClientesPage((p) => Math.min(totalClientesPaginas, p + 1))}
                          disabled={clientesPage === totalClientesPaginas}
                          className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          aria-label="Página siguiente"
                        >
                          &gt;
                        </button>
                        <button
                          disabled={clientesPage === totalClientesPaginas}
                          onClick={() => setClientesPage(totalClientesPaginas)}
                          className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          aria-label="Última página"
                        >
                          »
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* PRODUCTOS COMPRADOS */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                  <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
                        PRODUCTOS COMPRADOS
                      </h2>
                    </div>
                  </div>

                  {loading ? (
                    <div className="px-4 pb-4 space-y-2">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : productosCliente.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-sm text-gray-600">
                      Sin datos.
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-[#002D5A] border-b-2 border-[#E5A017]">
                              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">PRODUCTO</th>
                              <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">CANT. UNIDAD</th>
                              <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">TOTAL UNIDAD</th>
                              <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">CANT. DOCENA</th>
                              <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">TOTAL DOCENA</th>
                              <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">CANT. PARES</th>
                              <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">TOTAL PARES</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {productosClientePaginados.map((p, idx) => (
                              <tr key={`${p.producto}-${idx}`} className="hover:bg-slate-200 transition-colors">
                                <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{p.producto}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700 text-right font-semibold">{formatInt(p.cantUnidad)}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700 text-right">{formatMoneyPEN(p.totalUnidad)}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700 text-right font-semibold">{formatInt(p.cantDocena)}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700 text-right">{formatMoneyPEN(p.totalDocena)}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700 text-right font-semibold">{formatInt(p.cantPares)}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700 text-right">{formatMoneyPEN(p.totalPares)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="bg-slate-200 px-3 py-2 flex items-center justify-between border-t-2 border-slate-300">
                        <button
                          disabled={productosPage === 1}
                          onClick={() => setProductosPage(1)}
                          className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          aria-label="Primera página"
                        >
                          «
                        </button>
                        <button
                          onClick={() => setProductosPage((p) => Math.max(1, p - 1))}
                          disabled={productosPage === 1}
                          className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          aria-label="Página anterior"
                        >
                          &lt;
                        </button>
                        <span className="text-[10px] text-gray-700 font-medium">Página {productosPage} de {totalProductosPaginas}</span>
                        <button
                          onClick={() => setProductosPage((p) => Math.min(totalProductosPaginas, p + 1))}
                          disabled={productosPage === totalProductosPaginas}
                          className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          aria-label="Página siguiente"
                        >
                          &gt;
                        </button>
                        <button
                          disabled={productosPage === totalProductosPaginas}
                          onClick={() => setProductosPage(totalProductosPaginas)}
                          className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          aria-label="Última página"
                        >
                          »
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Fila 2: Pagos + Almacén + Regiones */}
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-3">
                {/* CANALES DE PAGO */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-bold text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
                      CANALES DE PAGO
                    </h2>
                  </div>

                  <div className="h-64">
                    {loading ? (
                      <Skeleton className="h-64 w-full" />
                    ) : pagos.length === 0 ? (
                      <div className="h-64 flex items-center justify-center text-sm text-gray-600">Sin datos.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Tooltip
                            contentStyle={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", color: "#111827" }}
                            formatter={(v) => [formatMoneyPEN(v), "MONTO"]}
                          />
                          <Legend wrapperStyle={{ color: "rgba(17,24,39,0.7)", fontSize: 11 }} />
                          <Pie
                            data={pagos}
                            dataKey="value"
                            nameKey="name"
                            innerRadius="60%"
                            outerRadius="85%"
                            paddingAngle={2}
                            stroke="rgba(0,0,0,0.06)"
                            strokeWidth={1}
                            onClick={(_, idx) => {
                              const it = pagos?.[idx];
                              if (!it?.name) return;
                              setFilters((prev) => ({ ...prev, pago: prev.pago === it.name ? null : it.name }));
                            }}
                          >
                            {pagos.map((p) => (
                              <Cell key={p.name} fill={hashColor(`pago:${p.name}`)} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* ALMACÉN SALIDA PEDIDOS */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-bold text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
                      ALMACÉN SALIDA PEDIDOS
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFilters((prev) => ({ ...prev, almacen: prev.almacen === "MALVINAS" ? null : "MALVINAS" }))}
                      className={`rounded-xl border-2 p-4 text-center bg-white hover:bg-gray-50 transition font-semibold ${filters.almacen === "MALVINAS" ? "border-[#E5A017] bg-amber-50" : "border-gray-200"}`}
                      title="Click para filtrar por almacén"
                    >
                      <div className="text-xs text-gray-500 font-semibold uppercase">MALVINAS</div>
                      {loading ? (
                        <Skeleton className="h-7 w-full mt-2" />
                      ) : (
                        <div className="text-xl font-bold text-[#002D5A] mt-2">
                          {valMalvinas === 0 ? "—" : formatInt(valMalvinas)}
                        </div>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilters((prev) => ({ ...prev, almacen: prev.almacen === "CALLAO" ? null : "CALLAO" }))}
                      className={`rounded-xl border-2 p-4 text-center bg-white hover:bg-gray-50 transition font-semibold ${filters.almacen === "CALLAO" ? "border-[#E5A017] bg-amber-50" : "border-gray-200"}`}
                      title="Click para filtrar por almacén"
                    >
                      <div className="text-xs text-gray-500 font-semibold uppercase">CALLAO</div>
                      {loading ? (
                        <Skeleton className="h-7 w-full mt-2" />
                      ) : (
                        <div className="text-xl font-bold text-[#002D5A] mt-2">
                          {valCallao === 0 ? "—" : formatInt(valCallao)}
                        </div>
                      )}
                    </button>
                  </div>
                </div>

                {/* REGIONES - Mapa de calor Perú */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-bold text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
                      REGIONES
                    </h2>
                  </div>
                  <div className="h-64">
                    <PeruRegionesMap
                      regiones={regiones}
                      loading={loading}
                      selectedRegion={filters.region}
                      onSelectRegion={(name) => setFilters((prev) => ({ ...prev, region: name }))}
                    />
                  </div>
                </div>
              </div>

              {/* Fila 3: COMPROBANTES EMITIDOS (solo) */}
              <div className="mt-6">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                    </svg>
                    <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
                      COMPROBANTES EMITIDOS
                    </h2>
                  </div>
                  <div className="h-72">
                    {loading ? (
                      <Skeleton className="h-72 w-full" />
                    ) : comprobantes.length === 0 ? (
                      <div className="h-72 flex items-center justify-center text-sm text-gray-600">Sin datos.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={comprobantes} layout="vertical" margin={{ left: 10, right: 20, top: 10, bottom: 10 }}>
                          <XAxis type="number" tick={{ fill: "rgba(17,24,39,0.65)", fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis type="category" dataKey="name" width={110} tick={{ fill: "rgba(17,24,39,0.75)", fontSize: 11 }} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", color: "#111827" }}
                            formatter={(v) => [formatMoneyPEN(v), "MONTO"]}
                          />
                          <Bar
                            dataKey="value"
                            radius={[10, 10, 10, 10]}
                            onClick={(ev) => {
                              const name = ev?.name;
                              if (!name) return;
                              setFilters((prev) => ({ ...prev, comprobante: prev.comprobante === name ? null : name }));
                            }}
                          >
                            {comprobantes.map((c, idx) => (
                              <Cell key={`comp-${idx}-${String(c?.name ?? "")}`} fill={hashColor(`comp:${c.name}`)} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>

              {/* Fila 4: TOP 10 DISTRITOS (solo) */}
              <div className="mt-6">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2V7m3 10v-4m3 6H6a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2z" />
                    </svg>
                    <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
                      TOP 10 DISTRITOS
                    </h2>
                  </div>
                  <div className="h-72">
                    {loading ? (
                      <Skeleton className="h-72 w-full" />
                    ) : distritos.length === 0 ? (
                      <div className="h-72 flex items-center justify-center text-sm text-gray-600">Sin datos.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={distritos} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                          <XAxis dataKey="name" tick={{ fill: "rgba(17,24,39,0.65)", fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={60} />
                          <YAxis tick={{ fill: "rgba(17,24,39,0.55)", fontSize: 11 }} />
                          <Tooltip contentStyle={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", color: "#111827" }} formatter={(v) => formatInt(v)} />
                          <Bar dataKey="value" fill={ZEUS_GOLD} radius={[10, 10, 0, 0]}>
                            <LabelList dataKey="value" position="top" formatter={(v) => formatInt(v)} />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

