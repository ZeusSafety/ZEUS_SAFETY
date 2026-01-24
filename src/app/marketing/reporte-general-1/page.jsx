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
import { getMarketingDashboardData } from "../../../services/marketingReportApi";

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
    // logs útiles si vuelve a salir 0 (no rompe UX)
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log("[ReporteGeneral1] KPI key:", k, "value:", v);
    }
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
  const [inicio, setInicio] = useState("2025-01-01");
  const [fin, setFin] = useState(today);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [data, setData] = useState({
    kpis: null,
    marketing: null,
    productos: null,
    mensual: null,
  });

  const abortRef = useRef(null);
  const [activeFilter, setActiveFilter] = useState(null); // { type, value }
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

  useEffect(() => {
    if (!user) return;

    abortRef.current?.abort?.();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError("");

    getMarketingDashboardData({ inicio, fin, signal: controller.signal })
      .then((res) => setData(res))
      .catch((e) => {
        if (e?.name === "AbortError") return;
        setError(e?.message || "No se pudo cargar el reporte.");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [inicio, fin, user]);

  const kpis = data.kpis || {};
  const ventaTotal = pickNumeric(kpis, [
    "venta_total",
    "total_ventas",
    "total_venta",
    "monto_total",
    "total",
    "TOTAL_GENERADO",
    "TOTAL",
    "total_generado",
    "TOTAL_VENTA",
    "VENTA_TOTAL",
  ]);
  const volumenVentas = pickNumeric(kpis, [
    "volumen_ventas",
    "cantidad_ventas",
    "cantidad",
    "transacciones",
    "ventas",
    "CANTIDAD_VENTAS",
    "CANTIDAD",
    "VOLUMEN",
    "VOLUMEN_VENTAS",
  ]);
  const ticketPromedio = clampNumber(volumenVentas) > 0 ? clampNumber(ventaTotal) / clampNumber(volumenVentas) : 0;

  const marketing = data.marketing || {};
  const canalesRaw = Array.isArray(marketing?.canales) ? marketing.canales : [];
  const clasificacionesRaw = Array.isArray(marketing?.clasificaciones) ? marketing.clasificaciones : [];
  const lineasRaw = Array.isArray(marketing?.lineas) ? marketing.lineas : [];

  // Aplicar filtro interactivo (si el backend no filtra, al menos filtramos en UI cuando exista el campo)
  const applyFilter = (rows, fieldCandidates = []) => {
    if (!activeFilter?.value) return rows;
    const value = String(activeFilter.value).toLowerCase();
    return rows.filter((r) => {
      const keys = fieldCandidates.length ? fieldCandidates : Object.keys(r || {});
      return keys.some((k) => String(r?.[k] ?? "").toLowerCase() === value);
    });
  };

  const canales = applyFilter(canalesRaw, ["canal", "CANAL", "canal_venta", "CANAL_VENTA"])
    .map((r) => ({
      name: r?.canal ?? r?.CANAL ?? r?.canal_venta ?? r?.CANAL_VENTA ?? "—",
      value: clampNumber(r?.total ?? r?.TOTAL ?? r?.monto ?? r?.MONTO ?? r?.cantidad ?? r?.CANTIDAD ?? 0),
    }))
    .sort((a, b) => b.value - a.value);

  const clasificaciones = applyFilter(clasificacionesRaw, ["clasificacion", "CLASIFICACION"])
    .map((r) => ({
      name: r?.clasificacion ?? r?.CLASIFICACION ?? "—",
      value: clampNumber(r?.total ?? r?.TOTAL ?? r?.monto ?? r?.MONTO ?? r?.cantidad ?? r?.CANTIDAD ?? 0),
    }))
    .sort((a, b) => b.value - a.value);

  const lineas = applyFilter(lineasRaw, ["linea", "LINEA"])
    .map((r) => ({
      name: r?.linea ?? r?.LINEA ?? "—",
      value: clampNumber(r?.total ?? r?.TOTAL ?? r?.monto ?? r?.MONTO ?? r?.cantidad ?? r?.CANTIDAD ?? 0),
    }))
    .sort((a, b) => b.value - a.value);

  const productosBase = Array.isArray(data.productos) ? data.productos : Array.isArray(data.productos?.productos) ? data.productos.productos : data.productos || [];
  const productos = Array.isArray(productosBase) ? applyFilter(productosBase) : [];
  const totalProductosPaginas = Math.max(1, Math.ceil((productos?.length || 0) / productosPorPagina));
  const productosPaginados = productos.slice((productosPage - 1) * productosPorPagina, productosPage * productosPorPagina);
  const maxUnidades = Math.max(1, ...productosPaginados.map((p) => clampNumber(p?.unidades ?? p?.UNIDADES ?? p?.cantidad_unidades ?? 0)));
  const maxDocenas = Math.max(1, ...productosPaginados.map((p) => clampNumber(p?.docenas ?? p?.DOCENAS ?? p?.cantidad_docenas ?? 0)));

  useEffect(() => {
    setProductosPage(1);
  }, [inicio, fin, activeFilter?.value]);

  const mensualRawBase = Array.isArray(data.mensual) ? data.mensual : [];
  const mensualRaw = applyFilter(mensualRawBase);
  const mensual = mensualRaw.map((r) => ({
    mes: r?.mes ?? r?.MES ?? r?.periodo ?? r?.PERIODO ?? r?.month ?? "—",
    total: clampNumber(r?.total ?? r?.TOTAL ?? r?.monto ?? r?.MONTO ?? 0),
  }));

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
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6 mb-6">
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
                    {loading ? "Cargando..." : error ? "Error" : "Cargado"}
                  </span>
                </div>
              </div>

              {/* Filtros (dentro del cuadro) */}
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
                        value={inicio}
                        onChange={(e) => setInicio(e.target.value)}
                        className="bg-transparent text-sm outline-none"
                        style={{ colorScheme: "light" }}
                      />
                    </label>
                    <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-900">
                      <span className="text-xs text-gray-500">Fin</span>
                      <input
                        type="date"
                        value={fin}
                        onChange={(e) => setFin(e.target.value)}
                        className="bg-transparent text-sm outline-none"
                        style={{ colorScheme: "light" }}
                      />
                    </label>
                  </div>
                </div>

                <div className="text-xs text-gray-600 flex items-center gap-3">
                  {activeFilter?.value && (
                    <button
                      type="button"
                      onClick={() => setActiveFilter(null)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700"
                      title="Limpiar filtro"
                    >
                      <span className="w-2 h-2 rounded-full" style={{ background: ACCENT }} />
                      <span className="truncate max-w-[220px]">Filtro: {activeFilter.value}</span>
                      <span className="text-gray-400">✕</span>
                    </button>
                  )}
                  <span className="inline-flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: loading ? "#60A5FA" : "#22C55E" }} />
                    {loading ? "Actualizando métricas…" : "Datos actualizados"}
                  </span>
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
                        <p className="text-xl font-bold text-[#002D5A] mb-0.5" style={{ fontFamily: "var(--font-poppins)" }}>
                          {formatMoneyPEN(ventaTotal)}
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
                        <p className="text-xl font-bold text-[#002D5A] mb-0.5" style={{ fontFamily: "var(--font-poppins)" }}>
                          {formatMoneyPEN(ticketPromedio)}
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

              {/* Middle Row: 3 cuadros dentro del contenedor */}
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-3">
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2V7m3 10v-4m3 6H6a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2z" />
                      </svg>
                      <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>Análisis de Canales</h2>
                    </div>
                  </div>
                  <div className="h-64">
                    {loading ? <Skeleton className="h-64 w-full" /> : canales.length === 0 ? (
                      <div className="h-64 flex items-center justify-center text-sm text-gray-500">Sin datos para el filtro</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={canales}
                          layout="vertical"
                          margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
                          onClick={(state) => {
                            const payload = state?.activePayload?.[0]?.payload;
                            const name = payload?.name;
                            if (name) setActiveFilter({ type: "canal", value: name });
                          }}
                        >
                          <XAxis type="number" tick={{ fill: "rgba(17,24,39,0.65)", fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis type="category" dataKey="name" width={90} tick={{ fill: "rgba(17,24,39,0.75)", fontSize: 11 }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", color: "#111827" }} formatter={(v) => formatMoneyPEN(v)} />
                          <Bar dataKey="value" radius={[10, 10, 10, 10]} fill={ACCENT} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1" />
                      </svg>
                      <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>Clasificación de Pedidos</h2>
                    </div>
                  </div>
                  <div className="h-64">
                    {loading ? <Skeleton className="h-64 w-full" /> : clasificaciones.length === 0 ? (
                      <div className="h-64 flex items-center justify-center text-sm text-gray-500">Sin datos para el filtro</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Tooltip contentStyle={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", color: "#111827" }} formatter={(v) => formatMoneyPEN(v)} />
                          <Pie
                            data={clasificaciones}
                            dataKey="value"
                            nameKey="name"
                            innerRadius="60%"
                            outerRadius="85%"
                            paddingAngle={2}
                            stroke="rgba(0,0,0,0.06)"
                            strokeWidth={1}
                            onClick={(_, idx) => {
                              const it = clasificaciones?.[idx];
                              if (it?.name) setActiveFilter({ type: "clasificacion", value: it.name });
                            }}
                          >
                            {clasificaciones.map((_, i) => (
                              <Cell key={i} fill={pieColors[i % pieColors.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2V7m3 10v-4" />
                      </svg>
                      <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>Líneas de Producto</h2>
                    </div>
                  </div>
                  <div className="h-64">
                    {loading ? <Skeleton className="h-64 w-full" /> : lineas.length === 0 ? (
                      <div className="h-64 flex items-center justify-center text-sm text-gray-500">Sin datos para el filtro</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Tooltip contentStyle={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", color: "#111827" }} formatter={(v) => formatMoneyPEN(v)} />
                          <Legend wrapperStyle={{ color: "rgba(17,24,39,0.7)", fontSize: 11 }} />
                          <Pie
                            data={lineas}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={40}
                            outerRadius={86}
                            paddingAngle={2}
                            stroke="rgba(0,0,0,0.06)"
                            strokeWidth={1}
                            onClick={(_, idx) => {
                              const it = lineas?.[idx];
                              if (it?.name) setActiveFilter({ type: "linea", value: it.name });
                            }}
                          >
                            {lineas.map((_, i) => (
                              <Cell key={i} fill={pieColors[i % pieColors.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabla productos (estilo sistema + paginación) */}
              <div className="mt-6 bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                    </svg>
                    <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
                      Productos más vendidos
                    </h2>
                  </div>
                  <div className="text-xs text-gray-600">Página {productosPage} de {totalProductosPaginas}</div>
                </div>

                {loading ? (
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : productos.length === 0 ? (
                  <div className="p-6 text-sm text-gray-600">Sin datos para el filtro.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-[#002D5A] border-b-2 border-[#E5A017]">
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">PRODUCTO</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">UNIDADES</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">DOCENAS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {productosPaginados.map((p, idx) => {
                          const producto = p?.producto ?? p?.PRODUCTO ?? p?.descripcion ?? "—";
                          const unidades = clampNumber(p?.unidades ?? p?.UNIDADES ?? 0);
                          const docenas = clampNumber(p?.docenas ?? p?.DOCENAS ?? 0);
                          const uPct = Math.min(100, (unidades / maxUnidades) * 100);
                          const dPct = Math.min(100, (docenas / maxDocenas) * 100);

                          return (
                            <tr
                              key={`${producto}-${idx}`}
                              className="hover:bg-slate-200 transition-colors cursor-pointer"
                              onClick={() => setActiveFilter({ type: "producto", value: producto })}
                              title="Click para filtrar"
                            >
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{producto}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${uPct}%`, background: `linear-gradient(90deg, ${ZEUS_BLUE}, ${ZEUS_GOLD})` }} />
                                  </div>
                                  <span className="w-16 text-right">{formatInt(unidades)}</span>
                                </div>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${dPct}%`, background: `linear-gradient(90deg, ${ZEUS_GOLD}, rgba(229,160,23,0.35))` }} />
                                  </div>
                                  <span className="w-16 text-right">{formatInt(docenas)}</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Paginación (estilo similar a tus listados) */}
                {!loading && productos.length > 0 && (
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 flex items-center justify-between border-t border-gray-200">
                    <button
                      onClick={() => setProductosPage(1)}
                      disabled={productosPage === 1}
                      className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                    >
                      «
                    </button>
                    <button
                      onClick={() => setProductosPage((p) => Math.max(1, p - 1))}
                      disabled={productosPage === 1}
                      className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                    >
                      &lt;
                    </button>
                    <span className="text-xs text-gray-700 font-semibold" style={{ fontFamily: "var(--font-poppins)" }}>
                      Página {productosPage} de {totalProductosPaginas}
                    </span>
                    <button
                      onClick={() => setProductosPage((p) => Math.min(totalProductosPaginas, p + 1))}
                      disabled={productosPage === totalProductosPaginas}
                      className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                    >
                      &gt;
                    </button>
                    <button
                      onClick={() => setProductosPage(totalProductosPaginas)}
                      disabled={productosPage === totalProductosPaginas}
                      className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                    >
                      »
                    </button>
                  </div>
                )}
              </div>

              {/* Evolución mensual (como tu imagen: barras + montos visibles) */}
              <div className="mt-6">
                <div className="flex items-center space-x-2 mb-4">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10" />
                  </svg>
                  <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
                    Monto de Ventas por Mes
                  </h2>
                </div>

                <div className="relative bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 sm:p-6 border border-gray-200">
                  <div className="relative h-72 sm:h-96">
                    {loading ? (
                      <Skeleton className="h-72 sm:h-96 w-full" />
                    ) : mensual.length === 0 ? (
                      <div className="h-72 sm:h-96 flex items-center justify-center text-sm text-gray-500">Sin datos para el filtro</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={mensual}
                          margin={{ top: 20, right: 20, left: 10, bottom: 10 }}
                          onClick={(state) => {
                            const payload = state?.activePayload?.[0]?.payload;
                            const mes = payload?.mes;
                            if (mes) setActiveFilter({ type: "mes", value: mes });
                          }}
                        >
                          <XAxis dataKey="mes" tick={{ fill: "rgba(17,24,39,0.75)", fontSize: 11 }} />
                          <YAxis tick={{ fill: "rgba(17,24,39,0.55)", fontSize: 11 }} />
                          <Tooltip
                            contentStyle={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", color: "#111827" }}
                            formatter={(v) => formatMoneyPEN(v)}
                          />
                          <Bar dataKey="total" fill={ACCENT} radius={[10, 10, 0, 0]}>
                            <LabelList dataKey="total" position="top" formatter={(v) => `S/. ${clampNumber(v).toLocaleString("es-PE")}`} />
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

