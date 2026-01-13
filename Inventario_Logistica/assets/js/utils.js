/**
 * Utilidades y funciones helper
 */

/**
 * Selector de elementos (querySelector)
 */
export const q = (sel, ctx = document) => ctx.querySelector(sel);

/**
 * Selector de múltiples elementos (querySelectorAll)
 */
export const qa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/**
 * Obtener elemento por ID
 */
export const $ = (id) => document.getElementById(id);

/**
 * Formatear fecha en formato 12 horas
 */
export const fmt12 = (d = new Date()) => {
  const pad = n => n.toString().padStart(2, '0');
  let h = d.getHours(), m = pad(d.getMinutes()), ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12; if (h === 0) h = 12;
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()} ${pad(h)}:${m} ${ampm}`;
};

/**
 * Generar ID único
 */
export const uid = () => Math.random().toString(36).slice(2, 10);

/**
 * Convertir valor a número de forma segura
 */
export const toNumberSafe = (v) => {
  if (v === null || v === undefined || v === '') return 0;
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};

/**
 * Función debounce
 */
export const debounce = (fn, wait) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(null, args), wait);
  };
};

/**
 * Normalizar clave (para normalización de datos)
 */
export const normalizarClave = (k) => {
  return String(k || '').toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[áàä]/g, 'a')
    .replace(/[éèë]/g, 'e')
    .replace(/[íìï]/g, 'i')
    .replace(/[óòö]/g, 'o')
    .replace(/[úùü]/g, 'u');
};

/**
 * Parsear CSV
 */
export const parseCSV = (txt) => {
  const clean = txt.replace(/^\uFEFF/, '').trim();
  if (!clean) return [];
  const lines = clean.split(/\r?\n/);
  const header = lines[0].split(',');
  const out = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]) continue;
    const cols = lines[i].split(',');
    const obj = {};
    header.forEach((h, idx) => {
      obj[h.trim()] = cols[idx]?.trim() || '';
    });
    out.push(obj);
  }
  return out;
};

/**
 * Parsear XLSX
 */
export const parseXLSX = (arrayBuffer) => {
  if (!window.XLSX) throw new Error('No se pudo cargar el lector de Excel.');
  const wb = XLSX.read(arrayBuffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws);
};

/**
 * Leer archivo genérico (CSV, XLSX, JSON)
 */
export const leerArchivoGenerico = async (file) => {
  const ext = file.name.split('.').pop().toLowerCase();
  if (ext === 'json') {
    const txt = await file.text();
    return JSON.parse(txt);
  } else if (ext === 'csv') {
    const txt = await file.text();
    return parseCSV(txt);
  } else if (ext === 'xlsx' || ext === 'xls') {
    const buf = await file.arrayBuffer();
    return parseXLSX(buf);
  }
  throw new Error('Formato de archivo no soportado');
};

/**
 * Convertir fecha a formato MySQL
 */
export const convertirFechaToMySQL = (fechaStr) => {
  // Formato esperado: MM/DD/YYYY HH:MM AM/PM
  const partes = fechaStr.split(' ');
  if (partes.length < 3) return null;
  const fechaPartes = partes[0].split('/');
  const horaPartes = partes[1].split(':');
  const ampm = partes[2];
  if (fechaPartes.length !== 3 || horaPartes.length !== 2) return null;
  const mes = parseInt(fechaPartes[0], 10);
  const dia = parseInt(fechaPartes[1], 10);
  const anio = parseInt(fechaPartes[2], 10);
  let hora = parseInt(horaPartes[0], 10);
  const minuto = parseInt(horaPartes[1], 10);
  if (ampm === 'PM' && hora !== 12) hora += 12;
  if (ampm === 'AM' && hora === 12) hora = 0;
  return `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')} ${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}:00`;
};

/**
 * Mostrar notificación toast
 */
export const toast = (msg, type = 'info') => {
  // Toast flotante no intrusivo, no empuja el layout
  const wrap = document.createElement('div');
  wrap.className = 'toast-fixed';
  wrap.style.position = 'fixed';
  wrap.style.top = '16px';
  wrap.style.right = '20px';
  wrap.style.zIndex = '200000';
  wrap.style.pointerEvents = 'none';
  wrap.innerHTML = `<div style="pointer-events:auto; border-radius:12px; padding:.65rem 1rem; box-shadow:0 10px 24px rgba(0,0,0,.12); background:${type === 'success' ? '#16a34a' : type === 'error' ? '#dc3545' : '#0ea5e9'}; color:white; font-weight:600;">${msg}</div>`;
  document.body.appendChild(wrap);
  setTimeout(() => wrap.remove(), 2200);
};

