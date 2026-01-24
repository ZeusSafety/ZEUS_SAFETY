// Mapeo exhaustivo de Subvistas (Base de Datos) a Cards de la UI Dashboard
// Este archivo vincula los NOMBRES en la base de datos (ej. LISTADO_DE_IMPORTACIONES)
// con los IDs de las Cards en el frontend para gestionar la visibilidad según permisos.

export const subVistasToCardsMap = {
  // ========== GERENCIA ==========
  "GESTION DE USUARIOS": "accesibilidad-credenciales",
  "GESTION_DE_USUARIOS": "accesibilidad-credenciales",
  "GESTION DE PRODUCTOS": ["productos", "gestionar-productos"],
  "GESTION_DE_PRODUCTOS": ["productos", "gestionar-productos"],
  "SOLICITUDES ADMIN-GERENCIA": "listado-solicitudes",
  "LISTADO DE MOVILIDAD": "listado-movilidad",
  "GERENCIA_LISTADO_PERMISOS": "listado-permisos",
  "GESTION_USUARIOS": "accesibilidad-credenciales",
  "GESTION_PRODUCTOS": ["productos", "gestionar-productos"],
  "REGISTRO_ACTIVIDAD_GENERAL": "registro-activity-general",
  "REGISTRO DE ACTIVIDAD (LOGS GENERALES)": "registro-activity-general",

  // ========== ADMINISTRACION ==========
  "LISTADO DE IMPORTACIONES": ["importaciones", "listado-importaciones"],
  "LISTADO_DE_IMPORTACIONES": ["importaciones", "listado-importaciones"],
  "LISTADO INCIDENCIA DE PROFORMAS": "proformas-actas",
  "LISTADO_INCIDENCIA_DE_PROFORMAS": "proformas-actas",
  "PROFORMAS / ACTAS": "proformas-actas",
  "SOLICITUDES ADMIN-ADMINISTRACION": "listado-solicitudes",
  "LISTADO MOVILIDAD": "listado-movilidad",
  "LISTADO_MOVILIDAD": "listado-movilidad",
  "ADMINISTRACION_LISTADO_PERMISOS": "listado-permisos",

  // ========== IMPORTACION ==========
  "IMPORTACIONES_REGISTRO": "registro",
  "IMPORTACIONES REGISTRO": "registro",
  "REGISTRO DE IMPORTACIONES": "registro",
  "LISTADO_IMPORTACIONES_IMPORT": "listado",
  "LISTADO IMPORTACIONES IMPORT": "listado",
  "LISTADO DE IMPORTACIONES (IMPORT)": "listado",
  "SOLICITUDES_LISTADO": "listado-solicitudes",
  "SOLICITUDES LISTADO": "listado-solicitudes",
  "SOLICITUDES ADMIN-IMPORTACION": "listado-solicitudes",
  "IMPORTACION_LISTADO_PERMISOS": "listado-permisos",

  // ========== LOGISTICA ==========
  "LISTADO_IMPORTACIONES_LOGISTICA": "importaciones",
  "LISTADO IMPORTACIONES LOGISTICA": "importaciones",
  "SOLICITUDES ADMIN-LOGISTICA": "listado-solicitudes",
  "LISTADO_REGISTRO_INCIDENCIA_PROFORMAS": "proformas",
  "LISTADO REGISTRO INCIDENCIA PROFORMAS": "proformas",
  "REGISTRO_INCIDENCIA_IMPORTACION_LOGIS": "incidencias",
  "REGISTRO INCIDENCIA IMPORTACION LOGIS": "incidencias",
  "REGISTRO_INCIDENCIA_IMPORTACION_IOGISTICA": "incidencias", // Typo in DB preserved
  "REGISTRO INCIDENCIA IMPORTACION IOGISTICA": "incidencias",
  "LISTADO_INCIDENCIAS_IMPORTACION": "incidencias-importaciones",
  "LISTADO INCIDENCIAS IMPORTACION": "incidencias-importaciones",
  "GESTION DESCUENTO DE CAJAS MALVINAS": "gestion-cajas-malvinas",
  "GESTION_DESCUENTO_DE_CAJAS_MALVINAS": "gestion-cajas-malvinas",
  "HISTORIAL GESTION DESCUENTO DE CAJAS MALVINAS": "historial-cajas-malvinas",
  "HISTORIAL_GESTION_DESCUENTO_DE_CAJAS_MALVINAS": "historial-cajas-malvinas",
  "INVENTARIO": ["inventario-callao", "inventario-malvinas", "inventario-comparar", "inventario-consolidado", "inventario-registro", "inventario-proformas"],
  "REGISTRO MOVILIDAD": "registro-movilidad",
  "REGISTRO_MOVILIDAD": "registro-movilidad",
  "MOVILIDAD": ["registro-movilidad", "listado-movilidad"],
  "LOGISTICA_LISTADO_PERMISOS": "listado-permisos",

  // ========== FACTURACION ==========
  "REGISTRAR VENTAS": "registrar-venta",
  "REGISTRAR_VENTAS": "registrar-venta",
  "GESTIONAR VENTAS": "gestionar-venta",
  "GESTIONAR_VENTAS": "gestionar-venta",
  "REGISTRAR REGULARIZACION": "registrar-regularizacion",
  "REGISTRAR_REGULARIZACION": "registrar-regularizacion",
  "GESTION_REGULARIZACION": "gestionar-regularizacion",
  "GESTION REGULARIZACION": "gestionar-regularizacion",
  "INCIDENCIAS_PROFORMAS": "incidencia-proformas",
  "INCIDENCIAS PROFORMAS": "incidencia-proformas",
  "INCIDENCIA DE PROFORMAS": "incidencia-proformas",
  "CONFIGURACION_VENTAS": "gestionar-configuracion",
  "CONFIGURACION VENTAS": "gestionar-configuracion",
  "GESTIONAR CONFIGURACION": "gestionar-configuracion",
  "SOLICITUDES ADMIN-FACTURACION": "listado-solicitudes",
  "FRANJA_DE_PRECIOS": "listado-precios",
  "FRANJA DE PRECIOS": "listado-precios",
  "FACTURACION_LISTADO_PERMISOS": "listado-permisos",

  // ========== MARKETING ==========
  "GESTION DE CLIENTES": "gestion-clientes",
  "GESTION_DE_CLIENTES": "gestion-clientes",
  "GESTION DE CLIENTES - MARKETING": "gestion-clientes",
  "GESTION_DE_CLIENTES_MARKETING": "gestion-clientes",
  "LISTADO DE VENTAS": "listado-ventas",
  "LISTADO_DE_VENTAS": "listado-ventas",
  "LISTADO DE VENTAS - MARKETING": "listado-ventas",
  "LISTADO_DE_VENTAS_MARKETING": "listado-ventas",
  "REGISTRO DE CLIENTES": "registro-clientes",
  "REGISTRO_DE_CLIENTES": "registro-clientes",
  "REGISTRO DE CLIENTES - MARKETING": "registro-clientes",
  "REGISTRO_DE_CLIENTES_MARKETING": "registro-clientes",
  "COTIZACIONES": "cotizaciones",
  "COTIZACIONES_MARKETING": "cotizaciones",
  "COTIZACIONES - MARKETING": "cotizaciones",
  "HISTORIAL DE COTIZACIONES": "historial-cotizaciones",
  "HISTORIAL_DE_COTIZACIONES": "historial-cotizaciones",
  "HISTORIAL DE COTIZACIONES - MARKETING": "historial-cotizaciones",
  "HISTORIAL_DE_COTIZACIONES_MARKETING": "historial-cotizaciones",
  "SUBIDA DE ARCHIVOS MARKETING": "subida-archivos",
  "SUBIDA_DE_ARCHIVOS_MARKETING": "subida-archivos",
  "LISTADO DE ARCHIVOS SUBIDOS": "listado-archivos",
  "LISTADO_DE_ARCHIVOS_SUBIDOS": "listado-archivos",
  "RECENCIA DE CLIENTES": "recencia-clientes",
  "RECENCIA_DE_CLIENTES": "recencia-clientes",
  "SOLICITUDES ADMIN-MARKETING": "listado-solicitudes",
  "STOCK MALVINAS POR MAYOR CAJAS": "stock-precios-mayor",
  "STOCK_MALVINAS_POR_MAYOR_CAJAS": "stock-precios-mayor",
  "MARKETING_LISTADO_PERMISOS": "listado-permisos",
  "REGISTRO DE VENTAS ONLINE": "registro-ventas-online",
  "REGISTRO_DE_VENTAS_ONLINE": "registro-ventas-online",

  // ========== MARKETING (REPORTES) ==========
  "REPORTES MARKETING": "reporte-general-1",
  "REPORTES_MARKETING": "reporte-general-1",
  "REPORTE GENERAL 1 - MARKETING": "reporte-general-1",
  "REPORTE_GENERAL_1_MARKETING": "reporte-general-1",
  "REPORTE GENERAL 1": "reporte-general-1",
  "REPORTE_GENERAL_1": "reporte-general-1",

  "REPORTE GENERAL 2 - MARKETING": "reporte-general-2",
  "REPORTE_GENERAL_2_MARKETING": "reporte-general-2",
  "REPORTE GENERAL 2": "reporte-general-2",
  "REPORTE_GENERAL_2": "reporte-general-2",

  // ========== SISTEMAS ==========
  "PAGOS": "gestion-pagos",
  "GESTION DE PAGOS": "gestion-pagos",
  "SOLICITUDES ADMIN-SISTEMAS": "listado-solicitudes",
  "SISTEMAS_LISTADO_PERMISOS": "listado-permisos",

  // ========== RECURSOS HUMANOS ==========
  "SOLICITUDES ADMIN-RRHH": "listado-solicitudes",
  "RRHH_LISTADO_PERMISOS": "listado-permisos",

  // ========== GENERAL / COMODINES ==========
  "LISTADO DE PERMISOS": "listado-permisos",
  "LISTADO_DE_PERMISOS": "listado-permisos",
};

/**
 * Normaliza una cadena para comparaciones robustas.
 * Convierte a MAYÚSCULAS, elimina espacios laterales y reemplaza guiones bajos por espacios.
 */
const normalizeString = (str) => {
  if (!str) return "";
  return str.toString()
    .toUpperCase()
    .trim()
    .replace(/_/g, " "); // Convierte LISTADO_DE_MOVILIDAD a LISTADO DE MOVILIDAD
};

/**
 * Verifica si un card específico está permitido para el usuario actual.
 * Realiza una auditoría de match entre los IDs de Card y los Nombres de Subvistas de la BD.
 */
export const isCardAllowed = (cardId, user) => {
  // 1. Si el usuario es Administrador Maestro, tiene acceso total.
  if (user?.isAdmin) return true;

  // IMPORTANTE: Algunos objetos de usuario pueden tener 'subVistas' o 'sub_vistas' según la fuente
  const userSubVistas = user?.subVistas || user?.sub_vistas || [];

  // 2. Si no tiene subvistas asignadas, no puede ver ninguna card.
  if (userSubVistas.length === 0) return false;

  // 3. Obtener todos los permisos del usuario normalizados (por nombre y por ID)
  // Intentamos capturar tanto el campo 'nombre' como 'subvista' (alias común)
  const userPermissions = userSubVistas.flatMap(sv => [
    normalizeString(sv.nombre || sv.subvista || sv.SUBVISTA),
    (sv.id || sv.id_subvista || "").toString().trim()
  ]).filter(p => p !== "");

  // 4. Buscar en el mapa si alguna subvista otorgada coincide con el cardId solicitado
  const hasAccess = Object.entries(subVistasToCardsMap).some(([dbName, mappedCards]) => {
    const cards = Array.isArray(mappedCards) ? mappedCards : [mappedCards];

    // Si este registro del mapa apunta al cardId que estamos consultando...
    if (cards.includes(cardId)) {
      // ...verificar si el usuario tiene este permiso (normalizado)
      return userPermissions.includes(normalizeString(dbName));
    }
    return false;
  });

  return hasAccess;
};
