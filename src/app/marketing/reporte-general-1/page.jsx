"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/context/AuthContext";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
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
import { getReporte1Full } from "../../../services/marketingReportApi";

const BG = "#F7FAFF";
const CARD = "#FFFFFF";
const ACCENT = "#FACC15";
const ZEUS_BLUE = "#002D5A";
const ZEUS_GOLD = "#E5A017";

function clampNumber(n) {
  if (typeof n === "string") {
    // soporta "125,268.50" o "125.268,50" en respuestas
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

  // fallback: escoger el número más grande en el objeto
  let best = 0;
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "object") continue;
    const num = clampNumber(v);
    if (num > best) best = num;
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log("[ReporteGeneral1] KPI key:", k, "value:", v);
    }
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

/** Formato de moneda unificado: S/ 130.034 (es-PE, miles con punto, sin decimales).
 *  Si el valor >= 1e6 (API inflada ~100x), se divide entre 100 antes de formatear. */
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
  return Math.round(n).toLocaleString("es-PE");
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

function WhatsAppIcon({ className = "w-4 h-4", fill = "#25D366" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={fill} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function Skeleton({ className }) {
  return <div className={`animate-pulse rounded-xl bg-gray-200 ${className}`} />;
}

function CardShell({ title, right, children }) {
  return (
    <div
      className="rounded-2xl border border-gray-200/60 shadow-xl"
      style={{ background: CARD }}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200/60">
        <div className="text-sm font-semibold text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
          {title}
        </div>
        {right}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function ReporteGeneral1MarketingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Estado de filtros global (Omni-filter)
  const [filters, setFilters] = useState({
    mes: null,
    producto: null,
    canal: null,
    clasificacion: null,
    linea: null,
    inicio: "2025-01-01",
    fin: today,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [data, setData] = useState({
    kpis: null,
    ventas_por_mes: [],
    productos_top: [],
    canales_venta: [],
    clasificacion_pedidos: [],
    lineas: [],
  });

  const abortRef = useRef(null);
  const [productosPage, setProductosPage] = useState(1);
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

  // Efecto para cargar datos cuando cambian los filtros
  useEffect(() => {
    if (!user) return;

    abortRef.current?.abort?.();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError("");

    getReporte1Full({
      inicio: filters.inicio,
      fin: filters.fin,
      mes: filters.mes,
      producto: filters.producto,
      canal: filters.canal,
      clasificacion: filters.clasificacion,
      linea: filters.linea,
      signal: controller.signal,
    })
      .then((res) => {
        // Mapear datos según el JSON proporcionado
        setData({
          kpis: res.kpis || { total_generado: 0, cantidad_ventas: 0 },
          ventas_por_mes: Array.isArray(res.ventas_por_mes) ? res.ventas_por_mes : [],
          productos_top: Array.isArray(res.productos_top) ? res.productos_top : [],
          canales_venta: Array.isArray(res.canales_venta) ? res.canales_venta : [],
          clasificacion_pedidos: Array.isArray(res.clasificacion_pedidos) ? res.clasificacion_pedidos : [],
          lineas: Array.isArray(res.lineas) ? res.lineas : [],
        });
      })
      .catch((e) => {
        if (e?.name === "AbortError") return;
        setError(e?.message || "No se pudo cargar el reporte.");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [filters, user]);

  // Mapear KPIs
  const kpis = data.kpis || {};
  const ventaTotal = clampNumber(kpis.total_generado || kpis.TOTAL_GENERADO || 0);
  const volumenVentas = clampNumber(kpis.cantidad_ventas || kpis.CANTIDAD_VENTAS || 0);
  const ticketPromedio = volumenVentas > 0 ? ventaTotal / volumenVentas : 0;

  // Mapear canales de venta (solo con datos: value > 0)
  const canales = (data.canales_venta || [])
    .map((r) => ({
      name: r?.CANAL_VENTA || r?.canal_venta || "—",
      value: clampNumber(r?.total || r?.TOTAL || 0),
    }))
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value);

  // Mapear clasificación de pedidos (solo con datos)
  const clasificaciones = (data.clasificacion_pedidos || [])
    .map((r) => ({
      name: r?.clasificacion_pedido || r?.CLASIFICACION_PEDIDO || r?.clasificacion || r?.CLASIFICACION || r?.tipo || r?.TIPO || r?.nombre || r?.NOMBRE || "—",
      value: clampNumber(r?.total || r?.TOTAL || 0),
    }))
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value);

  // Mapear líneas (solo con datos)
  const lineas = (data.lineas || [])
    .map((r) => ({
      name: r?.LINEA || r?.linea || r?.nombre || r?.NOMBRE || r?.descripcion || r?.DESCRIPCION || "—",
      value: clampNumber(r?.total || r?.TOTAL || 0),
    }))
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value);

  // Mapear productos top (varias posibles claves para unidades/docenas)
  const productosBase = data.productos_top || [];
  const productos = productosBase.map((p) => ({
    producto: p?.producto || p?.PRODUCTO || p?.descripcion || p?.nombre || "—",
    unidades: pickNumber(p, ["unidades", "UNIDADES", "cantidad_unidad", "CANTIDAD_UNIDAD", "cant_unidad", "CANT_UNIDAD", "cantidad", "CANTIDAD", "total_unidades", "TOTAL_UNIDADES"]),
    docenas: pickNumber(p, ["docenas", "DOCENAS", "cantidad_docena", "CANTIDAD_DOCENA", "cant_docena", "CANT_DOCENA", "total_docenas", "TOTAL_DOCENAS", "docena", "DOCENA", "docenas_vendidas", "num_docenas", "total_docena"]),
    monto: pickNumber(p, ["monto", "MONTO", "total", "TOTAL", "total_venta", "TOTAL_VENTA", "importe", "IMPORTE"]),
  }));
  const totalProductosPaginas = Math.max(1, Math.ceil((productos?.length || 0) / productosPorPagina));
  const productosPaginados = productos.slice((productosPage - 1) * productosPorPagina, productosPage * productosPorPagina);

  // Mapear ventas por mes (mesLabel: "Feb - 2025" para eje)
  const mensual = (data.ventas_por_mes || []).map((r) => {
    const raw = r?.mes || r?.MES || r?.periodo || r?.PERIODO || "";
    return {
      mes: raw || "—",
      mesLabel: formatMonthLabel(raw) || "—",
      total: clampNumber(r?.total || r?.TOTAL || r?.monto || r?.MONTO || 0),
    };
  });

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setProductosPage(1);
  }, [filters]);

  const pieColors = ["#FACC15", "#60A5FA", "#A78BFA", "#34D399", "#FB7185", "#F59E0B"];

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-50" style={{ background: BG }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${sidebarOpen ? "lg:ml-60 ml-0" : "ml-0"}`}>
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto custom-scrollbar" style={{ background: "#F7FAFF" }}>
          <div className="max-w-[95%] mx-auto px-4 py-5">
            {/* Botón volver (estilo sistema) */}
            <button
              onClick={() => router.push("/marketing")}
              className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-[#002D5A] to-[#002D5A] text-white rounded-lg font-semibold hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver a Marketing</span>
            </button>

            {/* Contenedor general (como tus otras páginas) */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6 mb-6" style={{ background: "linear-gradient(to bottom, #ffffff 0%, #f9fafb 100%)" }}>
              {/* Header dentro del cuadro */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#002D5A] to-[#002D5A] rounded-xl flex items-center justify-center text-white shadow-sm">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2V7m3 10v-4m3 6H6a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: "var(--font-poppins)" }}>
                      Reporte General 1
                    </h1>
                    <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: "var(--font-poppins)" }}>
                      Analítica avanzada de Marketing
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

              {/* Barra de filtros activos */}
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {[
                  ["mes", filters.mes, "Mes", formatMonthLabel(filters.mes) || filters.mes],
                  ["producto", filters.producto, "Producto", filters.producto],
                  ["canal", filters.canal, "Canal", filters.canal],
                  ["clasificacion", filters.clasificacion, "Clasificación", filters.clasificacion],
                  ["linea", filters.linea, "Línea", filters.linea],
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
                {!filters.mes && !filters.producto && !filters.canal && !filters.clasificacion && !filters.linea && (
                  <span className="text-xs text-gray-500" style={{ fontFamily: "var(--font-poppins)" }}>
                    Sin filtros (mostrando total)
                  </span>
                )}
              </div>

              {/* Filtros de fecha en contenedor separado */}
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mb-4">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 block" style={{ fontFamily: "var(--font-poppins)" }}>
                  Rango de fechas
                </label>

                <div className="flex flex-wrap items-center gap-4">
                  {/* Desde - Separado */}
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

                  {/* Hasta - Separado */}
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

              {/* KPI Row (estilo sistema) */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md border border-gray-200 p-3 relative">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1 font-medium" style={{ fontFamily: "var(--font-poppins)" }}>
                        Venta Total
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
                        Volumen de Ventas
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

                <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md border border-gray-200 p-3 relative">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1 font-medium" style={{ fontFamily: "var(--font-poppins)" }}>
                        Ticket Promedio
                      </p>
                      {loading ? <Skeleton className="h-7 w-28" /> : (
                        <p className="text-xl font-bold text-[#002D5A] mb-0.5 min-w-0 truncate" style={{ fontFamily: "var(--font-poppins)" }} title={formatCurrency(ticketPromedio)}>
                          {formatCurrency(ticketPromedio)}
                        </p>
                      )}
                      <p className="text-xs text-gray-500" style={{ fontFamily: "var(--font-poppins)" }}>
                        Total / Cantidad
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-br from-[#002D5A] to-[#002D5A] rounded-xl flex items-center justify-center text-white shadow-sm">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fila 1: Análisis de Canales + Productos más vendidos (2 columnas) */}
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Análisis de Canales - Mejorado con colores únicos y logos */}
                <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: "var(--font-poppins)" }}>
                    Análisis de Canales
                  </h2>
                  <div className="h-64 [&_*]:outline-none">
                    {loading ? <Skeleton className="h-64 w-full" /> : canales.length === 0 ? (
                      <div className="h-64 flex items-center justify-center text-sm text-gray-500">No hay datos para esta combinación de filtros</div>
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
                              const getCanalColor = (name) => {
                                const n = String(name).toUpperCase();
                                if (n.includes("WHATSAPP")) return "#25D366";
                                if (n.includes("FACEBOOK")) return "#1877F2";
                                if (n.includes("META") || n.includes("ADS")) return "#0081FB";
                                if (n.includes("LLAMADA") || n.includes("CALL")) return "#34C759";
                                if (n.includes("INSTAGRAM")) return "#E4405F";
                                const colors = ["#3B82F6", "#F59E0B", "#8B5CF6", "#10B981", "#EF4444"];
                                return colors[idx % colors.length];
                              };
                              const color = getCanalColor(c.name);
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
                            <LabelList
                              dataKey="value"
                              position="inside"
                              content={({ value, x, y, width, height, payload }) => {
                                if (!payload || width < 60) return null;
                                const total = canales.reduce((sum, x) => sum + x.value, 0);
                                const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                const canalName = String(payload.name).toUpperCase();
                                const isWa = canalName.includes("WHATSAPP");
                                return (
                                  <g pointerEvents="none">
                                    {isWa ? (
                                      <g transform={`translate(${x + width / 2 - 8},${y + height / 2 - 14})`}>
                                        <WhatsAppIcon className="w-4 h-4" fill="white" />
                                      </g>
                                    ) : (
                                      <text x={x + width / 2} y={y + height / 2 - 6} fill="white" fontSize={12} fontWeight="bold" textAnchor="middle" dominantBaseline="middle">
                                        {canalName.includes("FACEBOOK") ? "📘" : canalName.includes("META") || canalName.includes("ADS") ? "📊" : canalName.includes("LLAMADA") || canalName.includes("CALL") ? "📞" : "📱"}
                                      </text>
                                    )}
                                    <text x={x + width / 2} y={y + height / 2 + (isWa ? 4 : 8)} fill="white" fontSize={10} fontWeight="bold" textAnchor="middle" dominantBaseline="middle">
                                      {`${percent}%`}
                                    </text>
                                  </g>
                                );
                              }}
                            />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  {/* Estadísticas resumidas - más compactas */}
                  {!loading && canales.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {/* Total */}
                        <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-2.5 border border-gray-200">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide" style={{ fontFamily: "var(--font-poppins)" }}>
                              Total General
                            </span>
                            <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="text-base font-bold text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
                            {formatInt(canales.reduce((sum, x) => sum + x.value, 0))}
                          </div>
                        </div>

                        {/* Canal líder */}
                        <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-2.5 border border-gray-200">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide" style={{ fontFamily: "var(--font-poppins)" }}>
                              Canal Líder
                            </span>
                            <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {(() => {
                              const total = canales.reduce((sum, x) => sum + x.value, 0);
                              const lider = canales.reduce((max, c) => (c.value > max.value ? c : max), canales[0]);
                              const percent = total > 0 ? ((lider.value / total) * 100).toFixed(1) : 0;
                              const isWa = String(lider.name).toUpperCase().includes("WHATSAPP");
                              return (
                                <>
                                  {isWa ? (
                                    <WhatsAppIcon className="w-4 h-4 flex-shrink-0" />
                                  ) : (
                                    <span className="text-sm">
                                      {String(lider.name).toUpperCase().includes("FACEBOOK") ? "📘" : String(lider.name).toUpperCase().includes("META") || String(lider.name).toUpperCase().includes("ADS") ? "📊" : String(lider.name).toUpperCase().includes("LLAMADA") || String(lider.name).toUpperCase().includes("CALL") ? "📞" : "📱"}
                                    </span>
                                  )}
                                  <div className="min-w-0">
                                    <div className="text-xs font-bold text-gray-900 truncate" style={{ fontFamily: "var(--font-poppins)" }}>
                                      {lider.name}
                                    </div>
                                    <div className="text-[10px] text-gray-500">{percent}% del total</div>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Promedio */}
                        <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-2.5 border border-gray-200">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide" style={{ fontFamily: "var(--font-poppins)" }}>
                              Promedio por Canal
                            </span>
                            <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                          <div className="text-base font-bold text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
                            {formatInt(canales.length > 0 ? canales.reduce((sum, x) => sum + x.value, 0) / canales.length : 0)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tabla productos - Header como Reporte General 1 (icono con fondo + título + subtítulo) */}
                <div>
                  <div className="mb-3 flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#002D5A] to-[#002D5A] rounded-xl flex items-center justify-center text-white shadow-sm flex-shrink-0">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 tracking-tight" style={{ fontFamily: "var(--font-poppins)" }}>
                        Productos más vendidos
                      </h2>
                      <p className="text-sm text-gray-600 mt-0.5" style={{ fontFamily: "var(--font-poppins)" }}>
                        Productos más vendidos
                      </p>
                    </div>
                  </div>

                  {/* Contenedor de tabla */}
                  <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">

                    {loading ? (
                      <div className="p-4 space-y-3">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ) : productos.length === 0 ? (
                      <div className="p-6 text-sm text-gray-600">No hay datos para esta combinación de filtros</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-[#002D5A] border-b-2 border-[#E5A017]">
                              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">PRODUCTO</th>
                              <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">UNIDADES</th>
                              <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">DOCENAS</th>
                              <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">PARES</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {productosPaginados.map((p, idx) => {
                              const producto = p?.producto ?? "—";
                              const rawU = clampNumber(p?.unidades ?? 0);
                              const rawD = clampNumber(p?.docenas ?? 0);
                              const unidades = rawU >= 1000 ? Math.round(rawU / 1000) : Math.round(rawU);
                              const docenas = rawD >= 1000 ? Math.round(rawD / 1000) : Math.round(rawD);
                              // Calculo de pares: (docenas * 12) + unidades
                              const pares = (docenas * 12) + unidades;
                              const isSelected = filters.producto === producto;

                              return (
                                <tr
                                  key={`${producto}-${idx}`}
                                  className={`transition-all cursor-pointer ${isSelected ? "bg-amber-50 border-l-4 border-l-[#E5A017]" : "hover:bg-slate-100"} ${filters.producto && !isSelected ? "opacity-50" : ""}`}
                                  onClick={() => {
                                    setFilters((prev) => ({
                                      ...prev,
                                      producto: prev.producto === producto ? null : producto,
                                    }));
                                  }}
                                  title="Click para filtrar"
                                >
                                  <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{producto}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700 text-right font-semibold">{unidades}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700 text-right font-semibold">{docenas}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700 text-right font-semibold">{formatInt(pares)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Paginación (estilo GENERAL 2) */}
                    {!loading && productos.length > 0 && (
                      <div className="bg-slate-200 px-3 py-2 flex items-center justify-between border-t-2 border-slate-300">
                        <button
                          onClick={() => setProductosPage(1)}
                          disabled={productosPage === 1}
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
                    )}
                  </div>
                </div>
              </div>

              {/* Fila 2: Clasificación de Pedidos + Líneas de Producto (2 columnas) */}
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Clasificación de Pedidos - Círculo izquierda, leyenda derecha */}
                <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: "var(--font-poppins)" }}>
                    Clasificación de Pedidos
                  </h2>
                  {loading ? (
                    <div className="h-64">
                      <Skeleton className="h-64 w-full" />
                    </div>
                  ) : clasificaciones.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-sm text-gray-500">No hay datos para esta combinación de filtros</div>
                  ) : (
                    <div className="flex items-center gap-6">
                      {/* Círculo izquierda */}
                      <div className="flex-shrink-0 [&_*]:outline-none" tabIndex={-1}>
                        <ResponsiveContainer width={220} height={220}>
                          <PieChart cursor="pointer">
                            <Tooltip
                              contentStyle={{ background: "white", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 8, padding: "8px 12px" }}
                              formatter={(v) => [formatCurrency(v), "MONTO"]}
                            />
                            <Pie
                              data={clasificaciones.map((c) => {
                                const total = clasificaciones.reduce((sum, x) => sum + x.value, 0);
                                const percent = total > 0 ? Number(((c.value / total) * 100).toFixed(1)) : 0;
                                return { ...c, percent };
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
                                const it = clasificaciones?.[idx];
                                if (it?.name) {
                                  setFilters((prev) => ({
                                    ...prev,
                                    clasificacion: prev.clasificacion === it.name ? null : it.name,
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
                              {clasificaciones.map((c, i) => {
                                const colors = ["#F59E0B", "#3B82F6", "#8B5CF6", "#10B981", "#FB7185", "#FACC15"];
                                const color = colors[i % colors.length];
                                const isSelected = filters.clasificacion === c.name;
                                const opacity = isSelected ? 1 : (filters.clasificacion ? 0.35 : 1);
                                return <Cell key={i} fill={hexToRgba(color, opacity)} />;
                              })}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Leyenda derecha */}
                      <div className="flex-1 space-y-2">
                        {clasificaciones.map((c, idx) => {
                          const total = clasificaciones.reduce((sum, x) => sum + x.value, 0);
                          const percent = total > 0 ? ((c.value / total) * 100).toFixed(1) : 0;
                          const colors = ["#F59E0B", "#3B82F6", "#8B5CF6", "#10B981", "#FB7185", "#FACC15"];
                          return (
                            <div
                              key={c.name}
                              role="button"
                              tabIndex={0}
                              onClick={() => {
                                setFilters((prev) => ({
                                  ...prev,
                                  clasificacion: prev.clasificacion === c.name ? null : c.name,
                                }));
                              }}
                              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setFilters((prev) => ({ ...prev, clasificacion: prev.clasificacion === c.name ? null : c.name })); } }}
                              className={`flex items-center justify-between p-2 rounded-lg border-2 transition-all cursor-pointer focus:outline-none focus:ring-0 focus:ring-offset-0 ${filters.clasificacion === c.name
                                ? "border-[#E5A017] bg-amber-50"
                                : "border-gray-100 bg-gray-50 hover:bg-gray-100"
                                }`}
                              style={{ opacity: filters.clasificacion && filters.clasificacion !== c.name ? 0.5 : 1 }}
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: colors[idx % colors.length] }} />
                                <span className="text-xs font-semibold text-gray-700">{c.name}</span>
                              </div>
                              <div className="text-right">
                                <div className="text-xs font-bold text-gray-900">{formatCurrency(c.value)}</div>
                                <div className="text-[10px] text-gray-500">{percent}%</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Líneas de Producto - Círculo izquierda, leyenda derecha */}
                <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: "var(--font-poppins)" }}>
                    Líneas de Producto
                  </h2>
                  {loading ? (
                    <div className="h-64">
                      <Skeleton className="h-64 w-full" />
                    </div>
                  ) : lineas.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-sm text-gray-500">No hay datos para esta combinación de filtros</div>
                  ) : (
                    <div className="flex items-center gap-6">
                      {/* Círculo izquierda */}
                      <div className="flex-shrink-0 [&_*]:outline-none" tabIndex={-1}>
                        <ResponsiveContainer width={220} height={220}>
                          <PieChart cursor="pointer">
                            <Tooltip
                              contentStyle={{ background: "white", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 8, padding: "8px 12px" }}
                              formatter={(v) => [formatCurrency(v), "MONTO"]}
                            />
                            <Pie
                              data={lineas.map((l) => {
                                const total = lineas.reduce((sum, x) => sum + x.value, 0);
                                const percent = total > 0 ? Number(((l.value / total) * 100).toFixed(1)) : 0;
                                return { ...l, percent };
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
                                const it = lineas?.[idx];
                                if (it?.name) {
                                  setFilters((prev) => ({
                                    ...prev,
                                    linea: prev.linea === it.name ? null : it.name,
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
                              {lineas.map((l, i) => {
                                const colors = ["#FACC15", "#60A5FA", "#A78BFA", "#34D399", "#FB7185"];
                                const color = colors[i % colors.length];
                                const isSelected = filters.linea === l.name;
                                const opacity = isSelected ? 1 : (filters.linea ? 0.35 : 1);
                                return <Cell key={i} fill={hexToRgba(color, opacity)} />;
                              })}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Leyenda derecha */}
                      <div className="flex-1 space-y-2">
                        {lineas.map((l, idx) => {
                          const total = lineas.reduce((sum, x) => sum + x.value, 0);
                          const percent = total > 0 ? ((l.value / total) * 100).toFixed(1) : 0;
                          const colors = ["#FACC15", "#60A5FA", "#A78BFA", "#34D399", "#FB7185"];
                          return (
                            <div
                              key={l.name}
                              role="button"
                              tabIndex={0}
                              onClick={() => {
                                setFilters((prev) => ({
                                  ...prev,
                                  linea: prev.linea === l.name ? null : l.name,
                                }));
                              }}
                              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setFilters((prev) => ({ ...prev, linea: prev.linea === l.name ? null : l.name })); } }}
                              className={`flex items-center justify-between p-2 rounded-lg border-2 transition-all cursor-pointer focus:outline-none focus:ring-0 focus:ring-offset-0 ${filters.linea === l.name
                                ? "border-[#E5A017] bg-amber-50"
                                : "border-gray-100 bg-gray-50 hover:bg-gray-100"
                                }`}
                              style={{ opacity: filters.linea && filters.linea !== l.name ? 0.5 : 1 }}
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: colors[idx % colors.length] }} />
                                <span className="text-xs font-semibold text-gray-700">{l.name}</span>
                              </div>
                              <div className="text-right">
                                <div className="text-xs font-bold text-gray-900">{formatCurrency(l.value)}</div>
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

              {/* Evolución mensual - Header como Reporte General 1 (icono con fondo + título + subtítulo) */}
              <div className="mt-8">
                <div className="mb-3 flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#002D5A] to-[#002D5A] rounded-xl flex items-center justify-center text-white shadow-sm flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 tracking-tight" style={{ fontFamily: "var(--font-poppins)" }}>
                      Monto de Ventas por Mes
                    </h2>
                    <p className="text-sm text-gray-600 mt-0.5" style={{ fontFamily: "var(--font-poppins)" }}>
                      Evolución mensual en soles
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden p-6">
                  <div className="h-80">
                    {loading ? (
                      <Skeleton className="h-80 w-full" />
                    ) : mensual.length === 0 ? (
                      <div className="h-80 flex items-center justify-center text-sm text-gray-500">No hay datos para esta combinación de filtros</div>
                    ) : (
                      <div className="[&_*]:outline-none w-full min-h-[320px]" tabIndex={-1}>
                        <ResponsiveContainer width="100%" height={320}>
                          <BarChart
                            data={mensual}
                            margin={{ top: 24, right: 24, left: 40, bottom: 24 }}
                            cursor="pointer"
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
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

