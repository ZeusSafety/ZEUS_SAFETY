"use client";

const API_URL = "https://api-reporte-ventas-marketing-2946605267.us-central1.run.app/";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

function buildUrl({ tipo, inicio, fin }) {
  const url = new URL(API_URL);
  url.searchParams.set("modo", "dashboard");
  url.searchParams.set("tipo", tipo);
  if (inicio) url.searchParams.set("inicio", inicio);
  if (fin) url.searchParams.set("fin", fin);
  return url.toString();
}

function buildUrlWithParams({ tipo, inicio, fin, extra = {} }) {
  const url = new URL(API_URL);
  url.searchParams.set("modo", "dashboard");
  url.searchParams.set("tipo", tipo);
  if (inicio) url.searchParams.set("inicio", inicio);
  if (fin) url.searchParams.set("fin", fin);
  Object.entries(extra || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      url.searchParams.set(k, String(v));
    }
  });
  return url.toString();
}

async function fetchJson(url, token, signal) {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    signal,
  });

  if (!res.ok) {
    const text = await res.text();
    let message = text || `Error ${res.status}`;
    try {
      const json = JSON.parse(text);
      message = json?.error || json?.message || message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return await res.json();
}

export async function getMarketingDashboardData({ inicio, fin, signal } = {}) {
  const token = getToken();
  if (!token) throw new Error("Token de autenticación no encontrado. Por favor, inicie sesión.");

  const [kpis, marketing, productos, mensual] = await Promise.all([
    fetchJson(buildUrl({ tipo: "kpis", inicio, fin }), token, signal),
    fetchJson(buildUrl({ tipo: "marketing", inicio, fin }), token, signal),
    fetchJson(buildUrl({ tipo: "productos", inicio, fin }), token, signal),
    fetchJson(buildUrl({ tipo: "mensual", inicio, fin }), token, signal),
  ]);

  return { kpis, marketing, productos, mensual };
}

export async function getMarketingReporte2Data({ inicio, fin, signal } = {}) {
  const token = getToken();
  if (!token) throw new Error("Token de autenticación no encontrado. Por favor, inicie sesión.");

  const [clientesCompras, pagos, geografia, comprobantesAlmacen] = await Promise.all([
    fetchJson(buildUrl({ tipo: "clientes_compras", inicio, fin }), token, signal),
    fetchJson(buildUrl({ tipo: "pagos", inicio, fin }), token, signal),
    fetchJson(buildUrl({ tipo: "geografia", inicio, fin }), token, signal),
    fetchJson(buildUrl({ tipo: "comprobantes_almacen", inicio, fin }), token, signal),
  ]);

  return { clientesCompras, pagos, geografia, comprobantesAlmacen };
}

export async function getDetalleProductoCliente({ inicio, fin, cliente, signal } = {}) {
  const token = getToken();
  if (!token) throw new Error("Token de autenticación no encontrado. Por favor, inicie sesión.");
  if (!cliente) throw new Error("Falta cliente para detalle_producto_cliente");

  const url = buildUrlWithParams({
    tipo: "detalle_producto_cliente",
    inicio,
    fin,
    extra: { cliente },
  });

  return await fetchJson(url, token, signal);
}

// === REPORTE GENERAL 2 (FULL, estilo Postman) ===
// GET ?modo=dashboard&tipo=full_reporte_2&cliente=&inicio=&fin=
export async function getReporte2Full({ inicio, fin, cliente, region, pago, comprobante, almacen, signal } = {}) {
  const token = getToken();
  if (!token) throw new Error("Token de autenticación no encontrado. Por favor, inicie sesión.");

  const url = buildUrlWithParams({
    tipo: "full_reporte_2",
    // si inicio/fin están vacíos, NO se envían (backend devuelve histórico total)
    inicio: inicio && String(inicio).trim() !== "" ? inicio : undefined,
    fin: fin && String(fin).trim() !== "" ? fin : undefined,
    extra: {
      cliente: cliente && String(cliente).trim() !== "" ? cliente : undefined,
      region: region && String(region).trim() !== "" ? region : undefined,
      pago: pago && String(pago).trim() !== "" ? pago : undefined,
      comprobante: comprobante && String(comprobante).trim() !== "" ? comprobante : undefined,
      almacen: almacen && String(almacen).trim() !== "" ? almacen : undefined,
    },
  });

  return await fetchJson(url, token, signal);
}

