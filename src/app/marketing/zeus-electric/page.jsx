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
  Legend,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getZeusElectricReport } from "../../../services/marketingReportApi";
import PeruSVGMap from "../reporte-general-2/PeruSVGMap";

const BG = "#F7FAFF";
const CARD = "#FFFFFF";
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

function pickNumeric(obj, candidates = []) {
  if (!obj || typeof obj !== "object") return 0;
  for (const key of candidates) {
    if (obj[key] !== undefined && obj[key] !== null) {
      const v = clampNumber(obj[key]);
      if (v !== 0) return v;
    }
  }
  let best = 0;
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "object") continue;
    const num = clampNumber(v);
    if (num > best) best = num;
  }
  return best;
}

function pickNumber(obj, keys = []) {
  if (!obj || typeof obj !== "object") return 0;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== "") {
      const v = clampNumber(obj[k]);
      if (Number.isFinite(v)) return v;
    }
  }
  return 0;
}

const currencyFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  maximumFractionDigits: 0,
});

function formatCurrency(value) {
  let n = Math.round(clampNumber(value));
  if (n >= 1e6) n = Math.round(n / 100);
  const parts = currencyFormatter.formatToParts(n);
  return parts
    .map((p) => (p.type === "group" ? { ...p, value: "." } : p))
    .map((p) => p.value)
    .join("");
}

function formatInt(value) {
  const n = clampNumber(value);
  // Usar formato alemán para forzar puntos como separadores de miles
  return new Intl.NumberFormat("de-DE").format(Math.round(n));
}

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
function formatMonthLabel(s) {
  if (!s || typeof s !== "string") return "—";
  const m = s.match(/^(\d{4})-(\d{1,2})/);
  if (!m) return s;
  const y = m[1];
  const monthIdx = Math.max(0, Math.min(11, parseInt(m[2], 10) - 1));
  return `${MESES[monthIdx]} - ${y}`;
}

function hexToRgba(hex, a) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function Skeleton({ className }) {
  return <div className={`animate-pulse rounded-xl bg-gray-200 ${className}`} />;
}

export default function ZeusElectricPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [filters, setFilters] = useState({
    mes: null,
    producto: null,
    canal: null,
    clasificacion: null,
    linea: null,
    pago: null,
    cliente: null,
    region: null,
    inicio: "2025-01-01",
    fin: today,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [data, setData] = useState({
    kpis: null,
    clientes: [],
    productos_vendidos: [],
    canal_ventas: [],
    ventas_region: [],
    tipos_pago: [],
    ventas_por_mes: [],
  });

  const abortRef = useRef(null);
  const [clientesPage, setClientesPage] = useState(1);
  const [productosPage, setProductosPage] = useState(1);
  const clientesPorPagina = 10;
  const productosPorPagina = 10;

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    const handleResize = () => setSidebarOpen(window.innerWidth >= 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSelectRegion = (name) => {
    const norm = (s) => (!s ? "" : String(s).toUpperCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").trim());
    const match = norm(filters.region) === norm(name);
    setFilters((prev) => ({ ...prev, region: match ? null : name }));
  };

  useEffect(() => {
    if (!user) return;

    abortRef.current?.abort?.();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError("");

    getZeusElectricReport({
      inicio: filters.inicio,
      fin: filters.fin,
      mes: filters.mes,
      producto: filters.producto,
      canal: filters.canal,
      clasificacion: filters.clasificacion,
      linea: filters.linea,
      cliente: filters.cliente,
      pago: filters.pago,
      region: filters.region,
      signal: controller.signal,
    })
      .then((res) => {
        setData({
          kpis: res.kpis || { total_generado: 0, cantidad_ventas: 0 },
          clientes: Array.isArray(res.clientes) ? res.clientes : (Array.isArray(res.ranking) ? res.ranking : []),
          productos_vendidos: Array.isArray(res.productos_vendidos) ? res.productos_vendidos : (Array.isArray(res.productos) ? res.productos : []),
          canal_ventas: Array.isArray(res.canal_ventas) ? res.canal_ventas : (Array.isArray(res.canales) ? res.canales : []),
          ventas_region: Array.isArray(res.ventas_region) ? res.ventas_region : (Array.isArray(res.geografia) ? res.geografia : []),
          tipos_pago: Array.isArray(res.tipos_pago) ? res.tipos_pago : (Array.isArray(res.pagos) ? res.pagos : []),
          ventas_por_mes: Array.isArray(res.ventas_por_mes) ? res.ventas_por_mes : (Array.isArray(res.temporal) ? res.temporal : []),
        });
      })
      .catch((e) => {
        if (e?.name === "AbortError") return;
        setError(e?.message || "No se pudo cargar el reporte.");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [filters, user]);

  const kpis = data.kpis || {};
  const ventaTotal = clampNumber(kpis.total_generado || kpis.TOTAL_GENERADO || 0);
  const volumenVentas = clampNumber(kpis.cantidad_ventas || kpis.CANTIDAD_VENTAS || 0);

  const clientes = (data.clientes || []).map((r) => ({
    name: r?.cliente || r?.CLIENTE || r?.nombre || r?.NOMBRE || "—",
    compras: pickNumeric(r, ["cantidad", "CANTIDAD", "compras", "COMPRAS", "total", "TOTAL", "monto_total", "MONTO_TOTAL"]),
  }));
  const totalClientesPaginas = Math.max(1, Math.ceil((clientes.length || 0) / clientesPorPagina));
  const clientesPaginados = clientes.slice((clientesPage - 1) * clientesPorPagina, clientesPage * clientesPorPagina);

  const productos = (data.productos_vendidos || []).map((p) => {
    const cantidad = pickNumeric(p, ["cantidad", "CANTIDAD", "unidades", "UNIDADES", "total", "TOTAL", "CANT. UNIDAD", "CANT_UNIDAD"]);
    const monto = pickNumeric(p, ["monto", "MONTO", "total", "TOTAL", "importe", "IMPORTE", "TOTAL UNIDAD", "TOTAL_UNIDAD"]);

    return {
      producto: p?.producto || p?.PRODUCTO || p?.descripcion || p?.nombre || "—",
      cantidad,
      monto,
    };
  });
  const totalProductosPaginas = Math.max(1, Math.ceil((productos.length || 0) / productosPorPagina));
  const productosPaginados = productos.slice((productosPage - 1) * productosPorPagina, productosPage * productosPorPagina);

  const canales = (data.canal_ventas || [])
    .map((r) => ({
      name: r?.canal_venta || r?.CANAL_VENTA || r?.canal || r?.CANAL || "—",
      value: clampNumber(r?.total || r?.TOTAL || r?.cantidad || r?.CANTIDAD || 0),
    }))
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value);

  const regiones = (data.ventas_region || [])
    .map((r) => ({
      name: r?.region || r?.REGION || r?.distrito || r?.DISTRITO || r?.ciudad || r?.CIUDAD || r?.nombre || r?.NOMBRE || "—",
      value: clampNumber(r?.total || r?.TOTAL || r?.cantidad || r?.CANTIDAD || 0),
    }))
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value);

  const tiposPago = (data.tipos_pago || [])
    .map((r) => ({
      name: r?.tipo_pago || r?.TIPO_PAGO || r?.pago || r?.PAGO || r?.forma_pago || r?.FORMA_DE_PAGO || "—",
      value: clampNumber(r?.total || r?.TOTAL || r?.cantidad || r?.CANTIDAD || 0),
    }))
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value);

  const mensual = useMemo(() => {
    if (filters.region) {
      // Si hay región, mostramos el desglose por distritos/ciudades
      return regiones.map((r) => ({
        mes: r.name,
        mesLabel: r.name,
        total: r.value,
      }));
    }
    return (data.ventas_por_mes || []).map((r) => {
      const raw = r?.mes || r?.MES || r?.periodo || r?.PERIODO || "";
      return {
        mes: raw || "—",
        mesLabel: formatMonthLabel(raw) || "—",
        total: clampNumber(r?.total || r?.TOTAL || r?.monto || r?.MONTO || 0),
      };
    });
  }, [data.ventas_por_mes, filters.region, regiones]);

  useEffect(() => {
    setClientesPage(1);
    setProductosPage(1);
  }, [filters]);

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

            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6 mb-6" style={{ background: "linear-gradient(to bottom, #ffffff 0%, #f9fafb 100%)" }}>
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#002D5A] to-[#002D5A] rounded-xl flex items-center justify-center text-white shadow-sm">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: "var(--font-poppins)" }}>
                      Zeus Electric
                    </h1>
                    <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: "var(--font-poppins)" }}>
                      Analítica específica de Zeus Electric: Ventas, canales y regiones
                    </p>
                  </div>
                </div>

                <div className={`flex items-center space-x-2 rounded-lg px-3 py-1.5 ${error ? "bg-red-50 border border-red-200" : "bg-green-50 border border-green-200"}`}>
                  <svg className={`w-4 h-4 ${error ? "text-red-600" : "text-green-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className={`text-sm font-semibold ${error ? "text-red-700" : "text-green-700"}`} style={{ fontFamily: "var(--font-poppins)" }}>
                    {loading ? "Cargando..." : error ? "Error" : "API Conectada"}
                  </span>
                </div>
              </div>

              <div className="mb-4 flex flex-wrap items-center gap-2">
                {[
                  ["mes", filters.mes, "Mes", formatMonthLabel(filters.mes) || filters.mes],
                  ["producto", filters.producto, "Producto", filters.producto],
                  ["canal", filters.canal, "Canal", filters.canal],
                  ["clasificacion", filters.clasificacion, "Clasificación", filters.clasificacion],
                  ["linea", filters.linea, "Línea", filters.linea],
                  ["pago", filters.pago, "Pago", filters.pago],
                  ["cliente", filters.cliente, "Cliente", filters.cliente],
                  ["region", filters.region, "Región", filters.region],
                ]
                  .filter(([, v]) => v)
                  .map(([k, v, label, display]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setFilters((prev) => ({ ...prev, [k]: null }))}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold transition-colors"
                      style={{ fontFamily: "var(--font-poppins)" }}
                      title="Eliminar filtro"
                    >
                      <span className="w-2 h-2 rounded-full bg-[#E5A017]" />
                      <span className="truncate max-w-[200px]">
                        {label}: {typeof display === "string" && display.length > 24 ? `${display.substring(0, 24)}...` : (display ?? v)}
                      </span>
                      <span className="text-gray-400 hover:text-gray-600">✕</span>
                    </button>
                  ))}
                {!filters.mes && !filters.producto && !filters.canal && !filters.clasificacion && !filters.linea && !filters.pago && !filters.cliente && !filters.region && (
                  <span className="text-xs text-gray-500" style={{ fontFamily: "var(--font-poppins)" }}>
                    Sin filtros (mostrando total)
                  </span>
                )}
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mb-4">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 block" style={{ fontFamily: "var(--font-poppins)" }}>
                  Rango de fechas
                </label>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-700 whitespace-nowrap" style={{ fontFamily: "var(--font-poppins)" }}>
                      Desde
                    </span>
                    <input
                      type="date"
                      value={filters.inicio}
                      onChange={(e) => setFilters((prev) => ({ ...prev, inicio: e.target.value }))}
                      className="px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-sm font-medium text-gray-700 cursor-pointer hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      style={{ colorScheme: "light", fontFamily: "var(--font-poppins)" }}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-700 whitespace-nowrap" style={{ fontFamily: "var(--font-poppins)" }}>
                      Hasta
                    </span>
                    <input
                      type="date"
                      value={filters.fin}
                      onChange={(e) => setFilters((prev) => ({ ...prev, fin: e.target.value }))}
                      className="px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-sm font-medium text-gray-700 cursor-pointer hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      style={{ colorScheme: "light", fontFamily: "var(--font-poppins)" }}
                    />
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs text-gray-500" style={{ fontFamily: "var(--font-poppins)" }}>
                  <div className={`w-2 h-2 rounded-full ${filters.inicio !== "2025-01-01" || filters.fin !== today ? "bg-blue-500" : "bg-gray-300"}`} />
                  {filters.inicio !== "2025-01-01" || filters.fin !== today ? "Filtrando por rango seleccionado" : "Mostrando todo el histórico"}
                </div>
              </div>

              {error && (
                <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* KPI Row */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md border border-gray-200 p-3 relative">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1 font-medium" style={{ fontFamily: "var(--font-poppins)" }}>
                        Total
                      </p>
                      {loading ? <Skeleton className="h-7 w-36" /> : (
                        <p className="text-xl font-bold text-[#002D5A] mb-0.5 min-w-0 truncate" style={{ fontFamily: "var(--font-poppins)" }} title={formatCurrency(ventaTotal)}>
                          {formatCurrency(ventaTotal)}
                        </p>
                      )}
                      <p className="text-xs text-gray-500" style={{ fontFamily: "var(--font-poppins)" }}>
                        Rango seleccionado
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-br from-[#002D5A] to-[#002D5A] rounded-xl flex items-center justify-center text-white shadow-sm">
                      <span className="text-lg font-bold">S/</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md border border-gray-200 p-3 relative">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1 font-medium" style={{ fontFamily: "var(--font-poppins)" }}>
                        Cantidad de Ventas
                      </p>
                      {loading ? <Skeleton className="h-7 w-20" /> : (
                        <p className="text-xl font-bold text-[#002D5A] mb-0.5" style={{ fontFamily: "var(--font-poppins)" }}>
                          {formatInt(volumenVentas)}
                        </p>
                      )}
                      <p className="text-xs text-gray-500" style={{ fontFamily: "var(--font-poppins)" }}>
                        Cantidad total
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-br from-[#002D5A] to-[#002D5A] rounded-xl flex items-center justify-center text-white shadow-sm">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fila 1: Tabla Clientes + Tabla Productos */}
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tabla Clientes */}
                <div>
                  <div className="mb-3 flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#002D5A] to-[#002D5A] rounded-xl flex items-center justify-center text-white shadow-sm flex-shrink-0">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 tracking-tight" style={{ fontFamily: "var(--font-poppins)" }}>
                        Ranking de Compradores
                      </h2>
                      <p className="text-sm text-gray-600 mt-0.5" style={{ fontFamily: "var(--font-poppins)" }}>
                        Ranking de compradores
                      </p>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
                    {loading ? (
                      <div className="p-4 space-y-3">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ) : clientes.length === 0 ? (
                      <div className="p-6 text-sm text-gray-600">Sin datos.</div>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-[#002D5A] border-b-2 border-[#E5A017]">
                                <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">CLIENTE</th>
                                <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">COMPRAS</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {clientesPaginados.map((c, idx) => {
                                const isSelected = filters.cliente === c.name;
                                return (
                                  <tr
                                    key={`${c.name}-${idx}`}
                                    className={`transition-all cursor-pointer ${isSelected ? "bg-amber-50 border-l-4 border-l-[#E5A017]" : "hover:bg-slate-100"} ${filters.cliente && !isSelected ? "opacity-50" : ""}`}
                                    onClick={() => {
                                      setFilters((prev) => ({
                                        ...prev,
                                        cliente: prev.cliente === c.name ? null : c.name,
                                      }));
                                    }}
                                    title="Click para filtrar"
                                  >
                                    <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{c.name}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700 text-right font-semibold">{formatInt(c.compras)}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        {clientes.length > clientesPorPagina && (
                          <div className="bg-slate-200 px-3 py-2 flex items-center justify-between border-t-2 border-slate-300">
                            <button
                              onClick={() => setClientesPage(1)}
                              disabled={clientesPage === 1}
                              className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              «
                            </button>
                            <button
                              onClick={() => setClientesPage((p) => Math.max(1, p - 1))}
                              disabled={clientesPage === 1}
                              className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              &lt;
                            </button>
                            <span className="text-[10px] text-gray-700 font-medium">Página {clientesPage} de {totalClientesPaginas}</span>
                            <button
                              onClick={() => setClientesPage((p) => Math.min(totalClientesPaginas, p + 1))}
                              disabled={clientesPage === totalClientesPaginas}
                              className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              &gt;
                            </button>
                            <button
                              disabled={clientesPage === totalClientesPaginas}
                              onClick={() => setClientesPage(totalClientesPaginas)}
                              className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              »
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Tabla Productos */}
                <div>
                  <div className="mb-3 flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#002D5A] to-[#002D5A] rounded-xl flex items-center justify-center text-white shadow-sm flex-shrink-0">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 tracking-tight" style={{ fontFamily: "var(--font-poppins)" }}>
                        Productos Vendidos
                      </h2>
                      <p className="text-sm text-gray-600 mt-0.5" style={{ fontFamily: "var(--font-poppins)" }}>
                        Productos vendidos
                      </p>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
                    {loading ? (
                      <div className="p-4 space-y-3">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ) : productos.length === 0 ? (
                      <div className="p-6 text-sm text-gray-600">Sin datos.</div>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-[#002D5A] border-b-2 border-[#E5A017]">
                                <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">PRODUCTO</th>
                                <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">CANTIDAD</th>
                                <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">MONTO</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {productosPaginados.map((p, idx) => (
                                <tr
                                  key={`${p.producto}-${idx}`}
                                  className={`transition-all cursor-pointer ${filters.producto === p.producto ? "bg-amber-50 border-l-4 border-l-[#E5A017]" : "hover:bg-slate-100"} ${filters.producto && filters.producto !== p.producto ? "opacity-50" : ""}`}
                                  onClick={() => {
                                    setFilters((prev) => ({
                                      ...prev,
                                      producto: prev.producto === p.producto ? null : p.producto,
                                    }));
                                  }}
                                >
                                  <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{p.producto}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700 text-right font-semibold">
                                    {p.cantidad > 0 ? formatInt(p.cantidad) : "-"}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700 text-right font-semibold">
                                    {p.monto > 0 ? formatInt(p.monto) : "-"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {productos.length > productosPorPagina && (
                          <div className="bg-slate-200 px-3 py-2 flex items-center justify-between border-t-2 border-slate-300">
                            <button
                              onClick={() => setProductosPage(1)}
                              disabled={productosPage === 1}
                              className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              «
                            </button>
                            <button
                              onClick={() => setProductosPage((p) => Math.max(1, p - 1))}
                              disabled={productosPage === 1}
                              className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              &lt;
                            </button>
                            <span className="text-[10px] text-gray-700 font-medium">Página {productosPage} de {totalProductosPaginas}</span>
                            <button
                              onClick={() => setProductosPage((p) => Math.min(totalProductosPaginas, p + 1))}
                              disabled={productosPage === totalProductosPaginas}
                              className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              &gt;
                            </button>
                            <button
                              disabled={productosPage === totalProductosPaginas}
                              onClick={() => setProductosPage(totalProductosPaginas)}
                              className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              »
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Fila 2: Canal de Ventas + Tipos de Pago (2 columnas) */}
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Canal de Ventas */}
                <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: "var(--font-poppins)" }}>
                    Canal de Ventas
                  </h2>
                  <div className="h-64 [&_*]:outline-none">
                    {loading ? <Skeleton className="h-64 w-full" /> : canales.length === 0 ? (
                      <div className="h-64 flex items-center justify-center text-sm text-gray-500">Sin datos.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={canales}
                          layout="vertical"
                          margin={{ left: 8, right: 80, top: 8, bottom: 8 }}
                          cursor="pointer"
                        >
                          <XAxis type="number" tick={{ fill: "rgba(17,24,39,0.65)", fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis type="category" dataKey="name" width={100} tick={{ fill: "rgba(17,24,39,0.75)", fontSize: 11 }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", color: "#111827", borderRadius: 8 }} formatter={(v) => formatInt(v)} />
                          <Bar
                            dataKey="value"
                            radius={[10, 10, 10, 10]}
                            activeBar={{ stroke: "none" }}
                            onClick={(data) => {
                              const name = data?.name;
                              if (name) {
                                setFilters((prev) => ({
                                  ...prev,
                                  canal: prev.canal === name ? null : name,
                                }));
                              }
                            }}
                          >
                            {canales.map((c, idx) => {
                              const colors = ["#3B82F6", "#F59E0B", "#8B5CF6", "#10B981", "#EF4444"];
                              const color = colors[idx % colors.length];
                              const isSelected = filters.canal === c.name;
                              const opacity = isSelected ? 1 : (filters.canal ? 0.35 : 1);
                              return <Cell key={`canal-${idx}-${c.name}`} fill={hexToRgba(color, opacity)} stroke="none" cursor="pointer" />;
                            })}
                            <LabelList
                              dataKey="value"
                              position="right"
                              formatter={(v) => formatInt(v)}
                              style={{ fontSize: 10, fontWeight: "bold", fill: "#1f2937" }}
                            />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Tipos de Pago (Donut Chart) */}
                <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: "var(--font-poppins)" }}>
                    Tipos de Pago
                  </h2>
                  {loading ? (
                    <div className="h-64">
                      <Skeleton className="h-64 w-full" />
                    </div>
                  ) : tiposPago.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-sm text-gray-500">Sin datos.</div>
                  ) : (
                    <div className="flex items-center gap-6">
                      <div className="flex-shrink-0 [&_*]:outline-none" tabIndex={-1}>
                        <ResponsiveContainer width={220} height={220}>
                          <PieChart cursor="pointer">
                            <Tooltip
                              contentStyle={{ background: "white", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 8, padding: "8px 12px" }}
                              formatter={(v) => [formatCurrency(v), "MONTO"]}
                            />
                            <Pie
                              data={tiposPago.map((t) => {
                                const total = tiposPago.reduce((sum, x) => sum + x.value, 0);
                                const percent = total > 0 ? Number(((t.value / total) * 100).toFixed(1)) : 0;
                                return { ...t, percent };
                              })}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={3}
                              stroke="white"
                              strokeWidth={2}
                              activeShape={{ stroke: "none" }}
                              onClick={(_, idx) => {
                                const it = tiposPago?.[idx];
                                if (it?.name) {
                                  setFilters((prev) => ({
                                    ...prev,
                                    pago: prev.pago === it.name ? null : it.name,
                                  }));
                                }
                              }}
                              label={({ percent, cx, cy, midAngle, innerRadius, outerRadius }) => {
                                if (percent < 3) return null;
                                const RADIAN = Math.PI / 180;
                                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                return (
                                  <text
                                    x={x}
                                    y={y}
                                    fill="#1f2937"
                                    textAnchor={x > cx ? "start" : "end"}
                                    dominantBaseline="central"
                                    fontSize={8}
                                    fontWeight="bold"
                                  >
                                    {`${percent}%`}
                                  </text>
                                );
                              }}
                              labelLine={false}
                            >
                              {tiposPago.map((t, i) => {
                                const colors = ["#FACC15", "#60A5FA", "#A78BFA", "#34D399", "#FB7185"];
                                const color = colors[i % colors.length];
                                const isSelected = filters.pago === t.name;
                                const opacity = isSelected ? 1 : (filters.pago ? 0.35 : 1);
                                return <Cell key={i} fill={hexToRgba(color, opacity)} />;
                              })}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex-1 space-y-2">
                        {tiposPago.map((t, idx) => {
                          const total = tiposPago.reduce((sum, x) => sum + x.value, 0);
                          const percent = total > 0 ? ((t.value / total) * 100).toFixed(1) : 0;
                          const colors = ["#FACC15", "#60A5FA", "#A78BFA", "#34D399", "#FB7185"];
                          return (
                            <div
                              key={t.name}
                              role="button"
                              tabIndex={0}
                              onClick={() => {
                                setFilters((prev) => ({
                                  ...prev,
                                  pago: prev.pago === t.name ? null : t.name,
                                }));
                              }}
                              className={`flex items-center justify-between p-2 rounded-lg border-2 transition-all cursor-pointer focus:outline-none focus:ring-0 focus:ring-offset-0 ${filters.pago === t.name
                                ? "border-[#E5A017] bg-amber-50"
                                : "border-gray-100 bg-gray-50 hover:bg-gray-100"
                                }`}
                              style={{ opacity: filters.pago && filters.pago !== t.name ? 0.5 : 1 }}
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: colors[idx % colors.length] }} />
                                <span className="text-xs font-semibold text-gray-700">{t.name}</span>
                              </div>
                              <div className="text-right">
                                <div className="text-xs font-bold text-gray-900">{formatCurrency(t.value)}</div>
                                <div className="text-[10px] text-gray-500">{percent}%</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Ventas por Región (Mapa de Calor) */}
              <div className="mt-8">
                <div className="mb-3 flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#002D5A] to-[#002D5A] rounded-xl flex items-center justify-center text-white shadow-sm flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 tracking-tight" style={{ fontFamily: "var(--font-poppins)" }}>
                      Ventas por Región
                    </h2>
                    <p className="text-sm text-gray-600 mt-0.5" style={{ fontFamily: "var(--font-poppins)" }}>
                      Mapa de calor de ventas por región
                    </p>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden p-6">
                  <PeruSVGMap
                    regiones={regiones}
                    loading={loading}
                    selectedRegion={filters.region}
                    onSelectRegion={handleSelectRegion}
                  />
                </div>
              </div>

              {/* Ventas por Mes (Barras verticales) */}
              <div className="mt-8">
                <div className="mb-3 flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#002D5A] to-[#002D5A] rounded-xl flex items-center justify-center text-white shadow-sm flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 tracking-tight" style={{ fontFamily: "var(--font-poppins)" }}>
                      {filters.region ? `Ventas por Ciudad en ${filters.region}` : "Ventas por Mes"}
                    </h2>
                    <p className="text-sm text-gray-600 mt-0.5" style={{ fontFamily: "var(--font-poppins)" }}>
                      {filters.region ? "Desglose por distritos/ciudades" : "Evolución mensual en soles"}
                    </p>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden p-6">
                  <div className="h-80">
                    {loading ? (
                      <Skeleton className="h-80 w-full" />
                    ) : mensual.length === 0 ? (
                      <div className="h-80 flex items-center justify-center text-sm text-gray-500">Sin datos.</div>
                    ) : (
                      <div className="[&_*]:outline-none w-full min-h-[320px]" tabIndex={-1}>
                        <ResponsiveContainer width="100%" height={320}>
                          <BarChart
                            data={mensual}
                            margin={{ top: 24, right: 24, left: 40, bottom: 24 }}
                            cursor="pointer"
                          >
                            <XAxis
                              dataKey="mesLabel"
                              tick={{ fill: "rgba(17,24,39,0.75)", fontSize: 10, fontFamily: "var(--font-poppins)" }}
                              axisLine={{ stroke: "#e5e7eb" }}
                              tickLine={false}
                              interval={0}
                            />
                            <YAxis
                              tick={{ fill: "rgba(17,24,39,0.55)", fontSize: 10 }}
                              axisLine={false}
                              tickLine={false}
                              tickFormatter={(v) => formatCurrency(v)}
                            />
                            <Tooltip
                              contentStyle={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", color: "#111827", borderRadius: 8, fontFamily: "var(--font-poppins)" }}
                              formatter={(v) => formatCurrency(v)}
                              labelFormatter={(label) => label}
                            />
                            <Bar
                              dataKey="total"
                              radius={[8, 8, 0, 0]}
                              maxBarSize={48}
                              activeBar={{ stroke: "none" }}
                              onClick={(data) => {
                                const mes = data?.mes;
                                if (mes && mes !== "—") {
                                  setFilters((prev) => ({
                                    ...prev,
                                    mes: prev.mes === mes ? null : mes,
                                  }));
                                }
                              }}
                            >
                              {mensual.map((m, idx) => {
                                const colors = [
                                  "#3B82F6", "#2563EB", "#1D4ED8", "#1E40AF", "#1E3A8A",
                                  "#10B981", "#059669", "#047857", "#065F46", "#064E3B",
                                  "#F59E0B", "#D97706"
                                ];
                                const color = colors[idx % colors.length];
                                const isSelected = filters.mes === m.mes;
                                const opacity = isSelected ? 1 : (filters.mes ? 0.35 : 1);
                                return <Cell key={`mes-${idx}-${m.mes}`} fill={hexToRgba(color, opacity)} stroke="none" cursor="pointer" />;
                              })}
                              <LabelList
                                dataKey="total"
                                position="top"
                                content={(props) => {
                                  const { x = 0, y = 0, value, width = 0 } = props;
                                  const tx = Number(x) + Number(width) / 2;
                                  const ty = Number(y);
                                  return (
                                    <g pointerEvents="none">
                                      <text
                                        x={tx}
                                        y={ty}
                                        textAnchor="middle"
                                        fill="#1f2937"
                                        fontSize={9}
                                        fontWeight="bold"
                                        fontFamily="var(--font-poppins)"
                                      >
                                        {formatCurrency(value)}
                                      </text>
                                    </g>
                                  );
                                }}
                              />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
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
