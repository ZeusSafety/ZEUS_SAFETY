/**
 * Gestión del estado de la aplicación
 */

// Estado global de la aplicación
export const AppState = {
  productos: [],
  filtro: { ocultarCero: false, excluirCodigos: [] },
  sesiones: { callao: [], malvinas: [] },
  sistema: { callao: [], malvinas: [] },
  comparacion: { almacen: null, filas: [] },
  acciones: [],
  proformas: [],
  verificacion: {},
  sesionActual: { numero: null, creadoPor: null, inicio: null, activo: false },
  paginacion: { callao: { pagina: 1, porPagina: 50 }, malvinas: { pagina: 1, porPagina: 50 }, reportes: { pagina: 1, porPagina: 7 } },
  reportes: [],
  seguimiento: []
};

// Variables globales de comparación
export let cmpFiltroTxt = '';
export let cmpEstado = 'ALL';
export let inventarioCtx = { almacen: null, tipo: null };
export let _charts = {};

/**
 * Guardar estado en localStorage
 */
export const saveLS = () => {
  try {
    localStorage.setItem('inventario_state', JSON.stringify(AppState));
  } catch (e) {
    console.warn('No se pudo guardar en localStorage:', e);
  }
};

/**
 * Cargar estado desde localStorage
 */
export const loadLS = () => {
  try {
    const stored = localStorage.getItem('inventario_state');
    if (stored) {
      const parsed = JSON.parse(stored);
      Object.assign(AppState, parsed);
    }
  } catch (e) {
    console.warn('No se pudo cargar desde localStorage:', e);
  }
};

/**
 * Actualizar estado de comparación
 */
export const setCmpFiltroTxt = (txt) => {
  cmpFiltroTxt = txt;
};

export const setCmpEstado = (estado) => {
  cmpEstado = estado;
};

export const getCmpFiltroTxt = () => cmpFiltroTxt;
export const getCmpEstado = () => cmpEstado;

