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
import { getReporte2Full } from "../../../services/marketingReportApi";
import PeruSVGMap from "./PeruSVGMap";

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
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== "") {
      const v = clampNumber(obj[k]);
      if (Number.isFinite(v)) return v;
    }
  }
  return 0;
}

/** Como R1: si ninguna clave coincide, toma el mayor número del objeto (evita 0). */
function pickNumeric(obj, keys = []) {
  const v = pickNumber(obj, keys);
  if (v !== 0) return v;
  if (!obj || typeof obj !== "object") return 0;
  let best = 0;
  for (const val of Object.values(obj)) {
    if (val != null && typeof val === "object") continue;
    const n = clampNumber(val);
    if (n > best) best = n;
  }
  return best;
}

const ALMACEN_KEYS = [
  "cantidad", "CANTIDAD", "total", "TOTAL", "monto", "MONTO",
  "valor", "VALOR", "count", "COUNT", "num", "NUM", "pedidos", "PEDIDOS",
  "salida", "SALIDA", "almacen_cant", "ALMACEN_CANT",
];
const COMPROBANTE_VAL_KEYS = [
  "monto", "MONTO", "total", "TOTAL", "valor", "VALOR", "importe", "IMPORTE",
  "cantidad", "CANTIDAD", "count", "COUNT", "num", "NUM",
];

/** Formato de moneda unificado (como R1): S/ 130.034. Si >= 1e6, /100. */
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

function Skeleton({ className }) {
  return <div className={`animate-pulse rounded-xl bg-gray-200 ${className}`} />;
}

function TableSkeleton({ rows = 5 }) {
  return (
    <div className="px-4 pb-4 space-y-2">
      <Skeleton className="h-8 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

function DonutSkeleton() {
  return (
    <div className="flex items-center gap-6">
      <div className="flex-shrink-0">
        <div className="w-[220px] h-[220px] rounded-full animate-pulse bg-gray-200 border-8 border-gray-100" />
      </div>
      <div className="flex-1 space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}

function BarChartSkeleton({ height = "h-80" }) {
  return (
    <div className={`${height} flex items-end justify-around gap-2 px-4 pb-4`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="w-full" style={{ height: `${60 + Math.random() * 40}%` }} />
      ))}
    </div>
  );
}

const UNIQUE_PALETTE = ["#2563EB", "#F59E0B", "#10B981", "#A855F7", "#EF4444", "#06B6D4", "#84CC16", "#F97316", "#0EA5E9", "#22C55E"];
function hashColor(key) {
  const s = String(key ?? "");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return UNIQUE_PALETTE[h % UNIQUE_PALETTE.length];
}

function hexToRgba(hex, a = 1) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export default function ReporteGeneral2MarketingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Multi-filtros (circular BI), como R1
  const [filters, setFilters] = useState({
    cliente: null,
    region: null,
    pago: null,
    comprobante: null,
    almacen: null,
    distrito: null,
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
      distrito: filters.distrito || "",
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

  // Reset de paginación al cambiar filtros
  useEffect(() => {
    setClientesPage(1);
    setProductosPage(1);
  }, [filters.inicio, filters.fin, filters.cliente, filters.region, filters.pago, filters.comprobante, filters.almacen, filters.distrito]);

  // ====== adaptadores de data ======
  const rankingRaw = Array.isArray(dashboardData?.ranking) ? dashboardData.ranking : [];
  const _productos = dashboardData?.productos;
  const productosRaw = Array.isArray(_productos)
    ? _productos
    : _productos != null && typeof _productos === "object" && !Array.isArray(_productos)
      ? Object.entries(_productos).map(([k, v]) => {
          const o = typeof v === "object" && v !== null ? v : { cantidad: v, total: v, CANTIDAD: v, TOTAL: v };
          return { producto: k, PRODUCTO: k, ...o };
        })
      : [];
  const pagosRaw = Array.isArray(dashboardData?.pagos) ? dashboardData.pagos : [];
  const _comp = dashboardData?.comprobantes;
  const comprobantesRaw = _comp != null && (Array.isArray(_comp) || (typeof _comp === "object" && !Array.isArray(_comp))) ? _comp : [];
  const _alm = dashboardData?.almacenes;
  const almacenesRaw = _alm != null && (Array.isArray(_alm) || (typeof _alm === "object" && !Array.isArray(_alm))) ? _alm : [];
  const regionesRaw = Array.isArray(dashboardData?.geografia?.regiones) ? dashboardData.geografia.regiones : [];
  const distritosRaw = Array.isArray(dashboardData?.geografia?.distritos) ? dashboardData.geografia.distritos : [];

  /** Normaliza string para comparación (region/distrito). */
  const norm = (s) => (s ?? "").toString().trim().toUpperCase().replace(/\s+/g, " ");
  /** Al filtrar por region/distrito: solo filas que coincidan; excluir las que no tengan el campo. */
  const matchRegion = (r) => {
    if (!filters.region) return true;
    const rowReg = (r?.region ?? r?.REGION ?? "").toString().trim();
    if (!rowReg) return false;
    return norm(rowReg) === norm(filters.region);
  };
  const matchDistrito = (r) => {
    if (!filters.distrito) return true;
    const rowDist = (
      r?.distrito ?? r?.DISTRITO ?? r?.distrito_nombre ?? r?.DISTRITO_NOMBRE ?? r?.nombre_distrito ?? ""
    ).toString().trim();
    if (!rowDist) return false;
    return norm(rowDist) === norm(filters.distrito);
  };
  const matchCliente = (r) =>
    !filters.cliente || norm(r?.cliente ?? r?.CLIENTE ?? r?.nombre ?? r?.NOMBRE ?? "") === norm(filters.cliente);
  const matchPago = (r) => {
    if (!filters.pago) return true;
    const name = (r?.pago ?? r?.PAGO ?? r?.metodo ?? r?.METODO ?? r?.forma_pago ?? r?.FORMA_DE_PAGO ?? r?.canal ?? "").toString().trim();
    if (!name) return true;
    return norm(name) === norm(filters.pago);
  };
  const matchComprobante = (r) => {
    if (!filters.comprobante) return true;
    const raw = (r?.comprobante ?? r?.COMPROBANTE ?? r?.tipo ?? r?.TIPO ?? r?.tipo_comprobante ?? r?.TIPO_COMPROBANTE ?? "").toString().trim();
    if (!raw) return true;
    const s = norm(raw);
    const f = norm(filters.comprobante);
    if (s.includes("FACTURA") || s === "F") return f.includes("FACTURA") || f === "F";
    if (s.includes("BOLETA") || s === "B") return f.includes("BOLETA") || f === "B";
    if (s.includes("PROFORMA") || s === "P") return f.includes("PROFORMA") || f === "P";
    return s === f;
  };
  const matchAlmacen = (r) => {
    if (!filters.almacen) return true;
    const name = (r?.almacen ?? r?.ALMACEN ?? r?.salida ?? r?.SALIDA_DE_PEDIDO ?? r?.nombre ?? "").toString().trim();
    if (!name) return true;
    const n = norm(name);
    const a = norm(filters.almacen);
    return n.includes(a) || a.includes(n);
  };

  const rankingFiltered = rankingRaw.filter(
    (r) => matchRegion(r) && matchDistrito(r) && matchCliente(r) && matchPago(r) && matchComprobante(r) && matchAlmacen(r)
  );

  /** Productos: usar siempre API (refetch con filtros); sin filtrar en cliente para no vaciar por falta de region/distrito en filas. */
  const productosParaTabla = productosRaw;
  const clientes = rankingFiltered.map((r) => ({
    name: r?.cliente ?? r?.CLIENTE ?? r?.nombre ?? r?.NOMBRE ?? "—",
    compras: pickNumeric(r, [
      "cantidad", "CANTIDAD", "compras", "COMPRAS", "cantidad_compras", "CANTIDAD_COMPRAS",
      "total_compras", "TOTAL_COMPRAS", "num_compras", "NUM_COMPRAS", "total", "TOTAL",
      "monto_total", "MONTO_TOTAL", "count", "COUNT",
    ]),
  }));

  const totalClientesPaginas = Math.max(1, Math.ceil((clientes.length || 0) / clientesPorPagina));
  const clientesPaginados = clientes.slice((clientesPage - 1) * clientesPorPagina, clientesPage * clientesPorPagina);

  const PRODUCTO_NAME_KEYS = [
    "producto", "PRODUCTO", "descripcion", "DESCRIPCION", "nombre", "NOMBRE",
    "codigo_producto", "CODIGO_PRODUCTO", "nombre_producto", "NOMBRE_PRODUCTO",
  ];
  const pickProductoName = (obj) => {
    for (const k of PRODUCTO_NAME_KEYS) {
      const v = obj?.[k];
      if (v != null && String(v).trim() !== "") return String(v).trim();
    }
    return "—";
  };
  const productosCliente = productosParaTabla.map((r) => ({
    producto: pickProductoName(r),
    cantUnidad: pickNumeric(r, [
      "cantidad_unidad", "CANTIDAD_UNIDAD", "cant_unidad", "CANT_UNIDAD", "unidades", "UNIDADES",
      "cantidad", "CANTIDAD", "total_unidades", "TOTAL_UNIDADES", "cantidad_unidades", "CANTIDAD_UNIDADES",
    ]),
    totalUnidad: pickNumeric(r, [
      "total_unidad", "TOTAL_UNIDAD", "monto_unidad", "MONTO_UNIDAD", "total", "TOTAL", "monto", "MONTO",
      "precio_venta", "PRECIO_VENTA", "importe_unidad", "IMPORTE_UNIDAD",
    ]),
    cantDocena: pickNumeric(r, [
      "cantidad_docena", "CANTIDAD_DOCENA", "cant_docena", "CANT_DOCENA", "docenas", "DOCENAS",
      "total_docenas", "TOTAL_DOCENAS", "num_docenas", "docena", "DOCENA", "cantidad_docenas", "CANTIDAD_DOCENAS",
    ]),
    totalDocena: pickNumeric(r, ["total_docena", "TOTAL_DOCENA", "monto_docena", "MONTO_DOCENA", "total", "TOTAL", "monto", "MONTO"]),
    cantPares: pickNumeric(r, ["cantidad_pares", "CANTIDAD_PARES", "cant_pares", "CANT_PARES", "pares", "PARES"]),
    totalPares: pickNumeric(r, ["total_pares", "TOTAL_PARES", "monto_pares", "MONTO_PARES", "total", "TOTAL"]),
  }));
  const totalProductosPaginas = Math.max(1, Math.ceil((productosCliente.length || 0) / productosPorPagina));
  const productosClientePaginados = productosCliente.slice((productosPage - 1) * productosPorPagina, productosPage * productosPorPagina);

  // Pagos: usar siempre API (refetch con filtros); agregar por canal. Sin filtrar en cliente.
  const pagosByCanal = new Map();
  pagosRaw.forEach((r) => {
    const name = (r?.pago ?? r?.PAGO ?? r?.metodo ?? r?.METODO ?? r?.forma_pago ?? r?.FORMA_DE_PAGO ?? r?.canal ?? "—").toString().trim() || "—";
    const val = pickNumeric(r, ["monto", "MONTO", "total", "TOTAL", "valor", "VALOR", "importe", "IMPORTE", "cantidad", "CANTIDAD"]);
    pagosByCanal.set(name, (pagosByCanal.get(name) ?? 0) + val);
  });
  const pagos = [...pagosByCanal.entries()].map(([name, value]) => ({ name, value }));
  /** Solo canales con valor > 0; si hay filtro pago, solo el seleccionado (donut “todo relleno”). */
  let pagosVisibles = pagos.filter((p) => p.value > 0);
  if (filters.pago) {
    const normP = (s) => (s ?? "").toString().trim().toUpperCase();
    const sel = pagosVisibles.find((p) => normP(p.name) === normP(filters.pago));
    pagosVisibles = sel ? [sel] : [];
  }

  const regiones = regionesRaw.map((r) => ({
    name: r?.region ?? r?.REGION ?? "—",
    value: pickNumeric(r, ["cantidad", "CANTIDAD", "total", "TOTAL"]),
  }));

  const TOP_10_DISTRITOS_ORDER = [
    "CERCADO DE LIMA", "HUANCAYO", "TRUJILLO", "CHUPACA", "ABANCAY",
    "HUAMANGA", "CHINCHA", "INDEPENDENCIA", "OXAPAMPA", "JAEN",
  ];
  const distritosByKey = new Map();
  distritosRaw.forEach((r) => {
    const n = (r?.distrito ?? r?.DISTRITO ?? "").toString().toUpperCase().trim();
    if (!n) return;
    const v = pickNumeric(r, ["cantidad", "CANTIDAD", "total", "TOTAL"]);
    distritosByKey.set(n, v);
  });

  const distritos = filters.region
    ? (() => {
        const byName = new Map();
        distritosRaw.forEach((r) => {
          const name = (r?.distrito ?? r?.DISTRITO ?? "—").toString().trim() || "—";
          if (name === "—") return;
          const v = pickNumeric(r, ["cantidad", "CANTIDAD", "total", "TOTAL"]);
          byName.set(name, (byName.get(name) || 0) + v);
        });
        return [...byName.entries()]
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 20);
      })()
    : TOP_10_DISTRITOS_ORDER.map((d) => {
        let value = distritosByKey.get(d) ?? 0;
        if (value === 0) {
          for (const [k, v] of distritosByKey) {
            if (k.includes(d) || d.includes(k)) { value = v; break; }
          }
        }
        return { name: d, value };
      });

  /** Normaliza nombre de comprobante a Factura / Boleta / Proforma para mostrar siempre. */
  const comprobanteLabel = (raw) => {
    const s = String(raw ?? "").toUpperCase().trim();
    if (s.includes("FACTURA") || s === "F") return "Factura";
    if (s.includes("BOLETA") || s === "B") return "Boleta";
    if (s.includes("PROFORMA") || s === "P") return "Proforma";
    return raw && String(raw).trim() ? String(raw).trim() : "—";
  };

  // Comprobantes: usar siempre API (refetch con filtros). Sin filtrar en cliente.
  const comprobantesItems = Array.isArray(comprobantesRaw)
    ? comprobantesRaw
    : typeof comprobantesRaw === "object" && comprobantesRaw !== null
      ? Object.entries(comprobantesRaw).map(([k, v]) => ({ comprobante: k, total: v, monto: v, TOTAL: v, MONTO: v }))
      : [];
  const comprobantesBase = [
    { name: "Factura", nameRaw: "FACTURA", value: 0 },
    { name: "Boleta", nameRaw: "BOLETA", value: 0 },
    { name: "Proforma", nameRaw: "PROFORMA", value: 0 },
  ];
  comprobantesItems.forEach((r) => {
    const raw = (r?.comprobante ?? r?.COMPROBANTE ?? r?.tipo ?? r?.TIPO ?? r?.tipo_comprobante ?? r?.TIPO_COMPROBANTE ?? "").toString().trim();
    const label = comprobanteLabel(raw);
    const val = pickNumeric(r, COMPROBANTE_VAL_KEYS);
    const i = comprobantesBase.findIndex((c) => c.name === label);
    if (i >= 0) comprobantesBase[i].value = val;
    else if (label !== "—" && val > 0)
      comprobantesBase.push({ name: label, nameRaw: raw, value: val });
  });
  const comprobantes = comprobantesBase
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value)
    .map((c) => ({ ...c, valueDisplay: c.value }));

  const almacenesArr = Array.isArray(almacenesRaw)
    ? almacenesRaw.map((r) => ({
        name: (r?.almacen ?? r?.ALMACEN ?? r?.salida ?? r?.SALIDA_DE_PEDIDO ?? r?.nombre ?? "").toString().trim() || "—",
        value: pickNumeric(r, ALMACEN_KEYS),
      }))
    : typeof almacenesRaw === "object" && almacenesRaw !== null
      ? Object.entries(almacenesRaw).map(([k, v]) => ({
          name: String(k).trim() || "—",
          value: pickNumeric({ total: v, cantidad: v, TOTAL: v, CANTIDAD: v }, ALMACEN_KEYS),
        }))
      : [];
  const valMalvinas = almacenesArr.find((a) => String(a.name).toUpperCase().includes("MALVIN"))?.value ?? 0;
  const valCallao = almacenesArr.find((a) => String(a.name).toUpperCase().includes("CALLAO"))?.value ?? 0;
  const totalAlmacen = valMalvinas + valCallao;
  const pctMalvinas = totalAlmacen > 0 ? Math.round((valMalvinas / totalAlmacen) * 1000) / 10 : 0;
  const pctCallao = totalAlmacen > 0 ? Math.round((valCallao / totalAlmacen) * 1000) / 10 : 0;

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
                    {loading ? "Cargando..." : error ? "Error" : "API Conectada"}
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
                  ["distrito", filters.distrito],
                ]
                  .filter(([, v]) => v)
                  .map(([k, v]) => {
                    const label = k === "comprobante" ? comprobanteLabel(v) : v;
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setFilters((prev) => ({ ...prev, [k]: null }))}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold"
                        style={{ fontFamily: "var(--font-poppins)" }}
                        title="Eliminar filtro"
                      >
                        <span className="w-2 h-2 rounded-full" style={{ background: hashColor(`${k}:${v}`) }} />
                        <span className="truncate max-w-[240px]">{k === "comprobante" ? "COMPROBANTE" : k.toUpperCase()}: {label}</span>
                        <span className="text-gray-400">✕</span>
                      </button>
                    );
                  })}
                {!filters.cliente && !filters.region && !filters.pago && !filters.comprobante && !filters.almacen && !filters.distrito && (
                  <span className="text-xs text-gray-500">Sin filtros (mostrando total)</span>
                )}
              </div>

              {/* Filtros */}
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
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

                  {/* Botón Limpiar Fechas */}
                  {(filters.inicio || filters.fin) && (
                    <button
                      type="button"
                      onClick={() => setFilters((prev) => ({ ...prev, inicio: "", fin: "" }))}
                      className="px-4 py-2.5 rounded-xl border-2 border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold transition-all"
                      style={{ fontFamily: "var(--font-poppins)" }}
                    >
                      Limpiar fechas
                    </button>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs text-gray-500" style={{ fontFamily: "var(--font-poppins)" }}>
                  <div className={`w-2 h-2 rounded-full ${filters.inicio || filters.fin ? "bg-blue-500" : "bg-gray-300"}`} />
                  {filters.inicio || filters.fin ? "Filtrando por rango seleccionado" : "Mostrando todo el histórico"}
                </div>
              </div>

              {/* Acciones y estado */}
              <div className="mt-4 flex items-center justify-between">
                {!!(filters.cliente || filters.region || filters.pago || filters.comprobante || filters.almacen || filters.distrito) && (
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
                        distrito: null,
                      }))
                    }
                    className="px-4 py-2 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-xs font-bold transition-all shadow-sm"
                    style={{ fontFamily: "var(--font-poppins)" }}
                  >
                    RESETEAR FILTROS
                  </button>
                )}

              {error && <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
</div>
            {/* Fila 1: SOLO 2 tablas */}
              <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* COMPRAS POR CLIENTE - Solo título dentro de la card */}
                <div>
                  <h2 className="mb-3 text-lg font-bold text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
                    COMPRAS POR CLIENTE
                  </h2>
                  <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">

                  {loading ? (
                    <TableSkeleton rows={5} />
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
                </div>

                {/* PRODUCTOS COMPRADOS - Solo título */}
                <div>
                  <h2 className="mb-3 text-lg font-bold text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
                    PRODUCTOS COMPRADOS
                  </h2>
                  <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">

                  {loading ? (
                    <TableSkeleton rows={5} />
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
                                <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700 text-right">{formatCurrency(Math.round(p.totalUnidad || 0))}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700 text-right font-semibold">{formatInt(p.cantDocena)}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700 text-right">{formatCurrency(Math.round(p.totalDocena || 0))}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700 text-right font-semibold">{formatInt(p.cantPares)}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700 text-right">{formatCurrency(Math.round(p.totalPares || 0))}</td>
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
              </div>

              {/* Fila 2: CANALES DE PAGO + ALMACÉN (2 columnas) */}
              <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* CANALES DE PAGO - Solo título */}
                <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden p-6">
                  <h2 className="mb-4 text-lg font-bold text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
                    CANALES DE PAGO
                  </h2>
                  {loading ? (
                    <div className="h-64">
                      <Skeleton className="h-64 w-full" />
                    </div>
                  ) : pagosVisibles.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-sm text-gray-600">Sin datos.</div>
                  ) : (
                    <div className="flex items-center gap-6">
                      {/* Círculo izquierda: solo canales con valor; si hay filtro, solo el seleccionado */}
                      <div className="flex-shrink-0 [&_*]:outline-none" tabIndex={-1}>
                        <ResponsiveContainer width={220} height={220}>
                          <PieChart>
                            <Tooltip
                              contentStyle={{ background: "white", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 8, padding: "8px 12px" }}
                              formatter={(v) => [formatCurrency(v), "MONTO"]}
                            />
                            <Pie
                              activeShape={{ stroke: "none" }}
                              data={pagosVisibles.map((p) => {
                                const total = pagosVisibles.reduce((sum, x) => sum + x.value, 0);
                                const percent = total > 0 ? Number(((p.value / total) * 100).toFixed(1)) : 0;
                                return { ...p, percent };
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
                              cursor="pointer"
                              onClick={(_, idx) => {
                                const it = pagosVisibles?.[idx];
                                if (!it?.name) return;
                                setFilters((prev) => ({ ...prev, pago: prev.pago === it.name ? null : it.name }));
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
                                    fontSize={9}
                                    fontWeight="bold"
                                  >
                                    {`${percent}%`}
                                  </text>
                                );
                              }}
                              labelLine={false}
                            >
                              {pagosVisibles.map((p) => {
                                const color = hashColor(`pago:${p.name}`);
                                return <Cell key={p.name} fill={color} stroke="none" style={{ cursor: "pointer" }} />;
                              })}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Leyenda derecha */}
                      <div className="flex-1 space-y-2">
                        {pagosVisibles.map((p) => {
                          const total = pagosVisibles.reduce((sum, x) => sum + x.value, 0);
                          const percent = total > 0 ? ((p.value / total) * 100).toFixed(1) : 0;
                          const isSelected = filters.pago === p.name;
                          return (
                            <div
                              key={p.name}
                              role="button"
                              tabIndex={0}
                              onClick={() => setFilters((prev) => ({ ...prev, pago: prev.pago === p.name ? null : p.name }))}
                              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setFilters((prev) => ({ ...prev, pago: prev.pago === p.name ? null : p.name })); } }}
                              className={`flex items-center justify-between p-2 rounded-lg border-2 transition-all cursor-pointer focus:outline-none focus:ring-0 focus:ring-offset-0 ${
                                isSelected ? "border-[#E5A017] bg-amber-50" : "border-gray-100 bg-gray-50 hover:bg-gray-100"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: hashColor(`pago:${p.name}`) }} />
                                <span className="text-xs font-semibold text-gray-700">{p.name}</span>
                              </div>
                              <div className="text-right">
                                <div className="text-xs font-bold text-gray-900">{formatCurrency(p.value)}</div>
                                <div className="text-[10px] text-gray-500">{percent}%</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* ALMACÉN SALIDA PEDIDOS - Donut como Líneas de Producto / CANALES */}
                <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden p-6">
                  <h2 className="mb-4 text-lg font-bold text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
                    ALMACÉN SALIDA PEDIDOS
                  </h2>
                  {loading ? (
                    <DonutSkeleton />
                  ) : (
                    <div className="flex items-center gap-6">
                      <div className="flex-shrink-0 [&_*]:outline-none" tabIndex={-1}>
                        <ResponsiveContainer width={220} height={220}>
                          <PieChart>
                            <Tooltip
                              contentStyle={{ background: "white", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 8, padding: "8px 12px" }}
                              formatter={(v, n, p) => [formatInt(p?.payload?.value ?? v), "VENTAS"]}
                            />
                            <Pie
                              activeShape={{ stroke: "none" }}
                              data={[
                                {
                                  name: "MALVINAS",
                                  value: valMalvinas,
                                  valueDisplay: totalAlmacen === 0 && valMalvinas === 0 ? 1 : valMalvinas,
                                  percent: totalAlmacen > 0 ? Number(((valMalvinas / totalAlmacen) * 100).toFixed(1)) : 0,
                                },
                                {
                                  name: "CALLAO",
                                  value: valCallao,
                                  valueDisplay: totalAlmacen === 0 && valCallao === 0 ? 1 : valCallao,
                                  percent: totalAlmacen > 0 ? Number(((valCallao / totalAlmacen) * 100).toFixed(1)) : 0,
                                },
                              ]}
                              dataKey="valueDisplay"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={3}
                              stroke="white"
                              strokeWidth={2}
                              cursor="pointer"
                              onClick={(_, idx) => {
                                const key = idx === 0 ? "MALVINAS" : "CALLAO";
                                setFilters((prev) => ({ ...prev, almacen: prev.almacen === key ? null : key }));
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
                                    fontSize={10}
                                    fontWeight="bold"
                                  >
                                    {`${percent}%`}
                                  </text>
                                );
                              }}
                              labelLine={false}
                            >
                              <Cell
                                fill={hexToRgba("#E5A017", filters.almacen ? (filters.almacen === "MALVINAS" ? 1 : 0.35) : 1)}
                                stroke="none"
                                style={{ cursor: "pointer" }}
                              />
                              <Cell
                                fill={hexToRgba("#3B82F6", filters.almacen ? (filters.almacen === "CALLAO" ? 1 : 0.35) : 1)}
                                stroke="none"
                                style={{ cursor: "pointer" }}
                              />
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex-1 space-y-2">
                        {[
                          { name: "MALVINAS", value: valMalvinas, pct: pctMalvinas, color: "#E5A017" },
                          { name: "CALLAO", value: valCallao, pct: pctCallao, color: "#3B82F6" },
                        ].map((a) => {
                          const isSelected = filters.almacen === a.name;
                          return (
                            <div
                              key={a.name}
                              role="button"
                              tabIndex={0}
                              onClick={() => setFilters((prev) => ({ ...prev, almacen: prev.almacen === a.name ? null : a.name }))}
                              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setFilters((prev) => ({ ...prev, almacen: prev.almacen === a.name ? null : a.name })); } }}
                              className={`flex items-center justify-between p-2 rounded-lg border-2 transition-all cursor-pointer focus:outline-none focus:ring-0 focus:ring-offset-0 ${
                                isSelected ? "border-[#E5A017] bg-amber-50" : "border-gray-100 bg-gray-50 hover:bg-gray-100"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: a.color }} />
                                <span className="text-xs font-semibold text-gray-700">{a.name}</span>
                              </div>
                              <div className="text-right">
                                <div className="text-xs font-bold text-gray-900">
                                  {totalAlmacen === 0 && a.value === 0 ? "—" : formatInt(a.value)}
                                </div>
                                <div className="text-[10px] text-gray-500">
                                  {totalAlmacen === 0 && a.value === 0 ? "" : `${a.pct}%`}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Fila 3: COMPROBANTES + REGIONES (2 columnas) */}
              <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* COMPROBANTES EMITIDOS - Solo título */}
                <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden p-6">
                  <h2 className="mb-4 text-lg font-bold text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
                    COMPROBANTES EMITIDOS
                  </h2>
                  <div className="h-80">
                    {loading ? (
                      <BarChartSkeleton height="h-80" />
                    ) : comprobantes.length === 0 ? (
                      <div className="h-80 flex items-center justify-center text-sm text-gray-600">Sin datos.</div>
                    ) : (
                      <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={comprobantes} layout="vertical" margin={{ left: 10, right: 28, top: 10, bottom: 10 }}>
                            <XAxis type="number" domain={[0, "auto"]} tick={{ fill: "rgba(17,24,39,0.65)", fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis type="category" dataKey="name" width={140} tick={{ fill: "rgba(17,24,39,0.9)", fontSize: 13, fontWeight: 600 }} axisLine={false} tickLine={false} />
                            <Tooltip
                              cursor={false}
                              contentStyle={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", color: "#111827", borderRadius: 8 }}
                              formatter={(v, name, props) => [formatCurrency(props?.payload?.value ?? v), "MONTO"]}
                            />
                            <Bar
                              dataKey="valueDisplay"
                              radius={[10, 10, 10, 10]}
                              activeBar={{ stroke: "none" }}
                              cursor="pointer"
                              onClick={(data) => {
                                const raw = data?.nameRaw ?? data?.name;
                                if (!raw) return;
                                setFilters((prev) => ({ ...prev, comprobante: prev.comprobante === raw ? null : raw }));
                              }}
                            >
                              {comprobantes.map((c, idx) => {
                                const colors = ["#3B82F6", "#F59E0B", "#8B5CF6", "#10B981", "#EF4444", "#06B6D4"];
                                const color = colors[idx % colors.length];
                                return <Cell key={`comp-${idx}-${String(c?.name ?? "")}`} fill={color} stroke="none" style={{ cursor: "pointer" }} />;
                              })}
                              <LabelList dataKey="value" position="right" formatter={(v, name, props) => formatCurrency(props?.payload?.value ?? v)} style={{ fontSize: 10, fontWeight: 600, fill: "#1f2937" }} />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                  {/* Cuadritos: solo los que tienen valor > 0 */}
                  {comprobantes.length > 0 && (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {comprobantes.map((c, idx) => {
                        const colors = ["#3B82F6", "#F59E0B", "#8B5CF6"];
                        const color = colors[idx % 3];
                        const isSelected = filters.comprobante === (c.nameRaw ?? c.name);
                        return (
                          <button
                            key={c.name}
                            type="button"
                            onClick={() => setFilters((prev) => ({ ...prev, comprobante: prev.comprobante === (c.nameRaw ?? c.name) ? null : (c.nameRaw ?? c.name) }))}
                            className={`flex items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition-all ${isSelected ? "border-[#E5A017] bg-amber-50" : "border-gray-100 bg-gray-50 hover:bg-gray-100"}`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                              <span className="text-xs font-bold text-gray-700">{c.name}</span>
                            </div>
                            <span className="text-sm font-bold text-gray-900">{formatCurrency(c.value)}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {!loading && comprobantes.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                      <span className="text-xs font-semibold text-gray-500 uppercase" style={{ fontFamily: "var(--font-poppins)" }}>Total emitido</span>
                      <span className="text-sm font-bold text-[#002D5A]">{formatCurrency(comprobantes.reduce((s, c) => s + (c.value || 0), 0))}</span>
                    </div>
                  )}
                </div>

                {/* REGIONES - Solo título */}
                <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden p-6">
                  <h2 className="mb-4 text-lg font-bold text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
                    REGIONES
                  </h2>
                  <PeruSVGMap
                    regiones={regiones}
                    loading={loading}
                    selectedRegion={filters.region}
                    onSelectRegion={(name) => setFilters((prev) => ({ ...prev, region: name }))}
                  />
                </div>
              </div>

              {/* Fila 4: CANTIDAD DE VENTAS POR REGIÓN Y DISTRITO */}
              <div className="mt-8">
                <div className="mb-3 flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#002D5A] to-[#002D5A] rounded-xl flex items-center justify-center text-white shadow-sm flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2V7m3 10v-4m3 6H6a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
                      CANTIDAD DE VENTAS POR REGIÓN Y DISTRITO
                    </h2>
                    <p className="text-sm text-gray-600 mt-0.5" style={{ fontFamily: "var(--font-poppins)" }}>
                      {filters.region ? `Distritos en ${filters.region} (click en barra para filtrar)` : "Top 10 distritos · Selecciona una región en el mapa para ver sus distritos"}
                    </p>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden p-6">
                  <div className="h-72">
                    {loading ? (
                      <BarChartSkeleton height="h-72" />
                    ) : distritos.length === 0 ? (
                      <div className="h-72 flex items-center justify-center text-sm text-gray-600">Sin datos.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={distritos} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                          <XAxis dataKey="name" tick={{ fill: "rgba(17,24,39,0.65)", fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={60} />
                          <YAxis tick={{ fill: "rgba(17,24,39,0.55)", fontSize: 11 }} />
                          <Tooltip cursor={false} contentStyle={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", color: "#111827", borderRadius: 8 }} formatter={(v) => formatInt(v)} />
                          <Bar
                            dataKey="value"
                            radius={[10, 10, 0, 0]}
                            activeBar={{ stroke: "none" }}
                            cursor="pointer"
                            onClick={(data) => {
                              const name = data?.name;
                              if (!name) return;
                              setFilters((prev) => ({ ...prev, distrito: prev.distrito === name ? null : name }));
                            }}
                          >
                            {distritos.map((d, idx) => {
                              const colors = [
                                "#3B82F6", "#2563EB", "#1D4ED8", "#1E40AF", "#1E3A8A",
                                "#10B981", "#059669", "#047857", "#065F46", "#064E3B"
                              ];
                              const color = colors[idx % colors.length];
                              const isSelected = filters.distrito === d.name;
                              const opacity = filters.distrito ? (isSelected ? 1 : 0.35) : 1;
                              return <Cell key={`dist-${idx}-${String(d?.name ?? "")}`} fill={hexToRgba(color, opacity)} stroke="none" style={{ cursor: "pointer" }} />;
                            })}
                            <LabelList dataKey="value" position="top" formatter={(v) => formatInt(v)} style={{ fontSize: 11, fontWeight: "bold", fill: "#1f2937" }} />
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

