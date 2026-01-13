/**
 * Configuración y constantes de la aplicación
 */

// URLs de las APIs
export const API_URLS = {
  PRODUCTOS: "https://productoscrud-2946605267.us-central1.run.app",
  INVENTARIO: "https://inventario-2946605267.us-central1.run.app",
  ARCHIVOS: "https://gestorarchivos-2946605267.us-central1.run.app"
};

// Métodos de API
export const API_METHODS = {
  LISTADO_INVENTARIO: "LISTADO_INVENTARIO",
  COLABORADORES_INVENTARIO: "colaboradores_imventario",
  LISTAR_INVENTARIOS: "listar_inventarios",
  EXTRAER_INVENTARIOS_CONTEOS: "extraer_inventarios_conteos"
};

// Selectores de API
export const API_SELECTORS = {
  INVENTARIOS_GENERAL_REPORTE: "INVENTARIOS_GENERAL_REPORTE",
  INVENTARIOS_GENERAL_SEGUIMIENTO: "INVENTARIOS_GENERAL_SEGUIMIENTO"
};

// Configuración de la aplicación
export const CONFIG = {
  JEFE_PWD: '0427',
  LOCAL_CONTEO_ACTIVO: false, // Mantener en false para desactivar el guardado local (solo API)
  PAGINACION: {
    POR_PAGINA: 50
  }
};

// Tiendas de Malvinas
export const TIENDAS = [
  'TIENDA 3006',
  'TIENDA 3006 B',
  'TIENDA 3131',
  'TIENDA 3133',
  'TIENDA 412-A'
];

