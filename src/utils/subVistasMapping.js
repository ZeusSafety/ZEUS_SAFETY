// Mapeo completo de todas las sub_vistas (NOMBRE de la API) a IDs de cards en cada módulo
// Basado en las imágenes proporcionadas con todas las sub_vistas por módulo

export const subVistasToCardsMap = {
  // ========== GERENCIA ==========
  "GESTION DE USUARIOS": "accesibilidad-credenciales",
  "GESTION DE PRODUCTOS": ["productos"],
  "SOLICITUDES ADMIN-GERENCIA": "listado-solicitudes",
  "LISTADO DE MOVILIDAD": "listado-movilidad",

  // ========== ADMINISTRACION ==========
  "LISTADO DE IMPORTACIONES": ["importaciones", "listado-importaciones"],
  "LISTADO INCIDENCIA DE PROFORMAS": "proformas-actas",
  "SOLICITUDES ADMIN-ADMINISTRACION": "listado-solicitudes",
  "LISTADO MOVILIDAD": "listado-movilidad",
  "LISTADO_MOVILIDAD": "listado-movilidad",

  // ========== IMPORTACION ==========
  "IMPORTACIONES_REGISTRO": "registro",
  "LISTADO_IMPORTACIONES_IMPORT": "listado",
  "SOLICITUDES_LISTADO": "listado-solicitudes",
  "SOLICITUDES ADMIN-IMPORTACION": "listado-solicitudes",

  // ========== LOGISTICA ==========
  "LISTADO_IMPORTACIONES_LOGISTICA": "importaciones",
  "SOLICITUDES ADMIN-LOGISTICA": "listado-solicitudes",
  "LISTADO_REGISTRO_INCIDENCIA_PROFORMAS": "proformas",
  "REGISTRO_INCIDENCIA_IMPORTACION_LOGIS": "incidencias",
  "REGISTRO_INCIDENCIA_IMPORTACION_IOGISTICA": "incidencias",
  "LISTADO_INCIDENCIAS_IMPORTACION": "incidencias-importaciones",
  "GESTION DESCUENTO DE CAJAS MALVINAS": "gestion-cajas-malvinas",
  "HISTORIAL GESTION DESCUENTO DE CAJAS MALVINAS": "historial-cajas-malvinas",
  "INVENTARIO": "inventario",
  "REGISTRO MOVILIDAD": "registro-movilidad",
  "REGISTRO_MOVILIDAD": "registro-movilidad",
  "MOVILIDAD": ["registro-movilidad", "listado-movilidad"],

  // ========== FACTURACION ==========
  "REGISTRAR VENTAS": "registrar-venta",
  "GESTIONAR VENTAS": "gestionar-venta",
  "REGISTRAR REGULARIZACION": "registrar-regularizacion",
  "GESTION_REGULARIZACION": "gestionar-regularizacion",
  "INCIDENCIAS_PROFORMAS": "incidencia-proformas",
  "CONFIGURACION_VENTAS": "gestionar-configuracion",
  "SOLICITUDES ADMIN-FACTURACION": "listado-solicitudes",
  "FRANJA_DE_PRECIOS": "listado-precios",

  // ========== MARKETING ==========
  "GESTION DE CLIENTES - MARKETING": "gestion-clientes",
  "LISTADO DE VENTAS - MARKETING": "listado-ventas",
  "SUBIDA DE ARCHIVOS MARKETING": "subida-archivos",
  "LISTADO DE ARCHIVOS SUBIDOS": "listado-archivos",
  "RECENCIA DE CLIENTES": "recencia-clientes",
  "SOLICITUDES ADMIN-MARKETING": "listado-solicitudes",
  "STOCK MALVINAS POR MAYOR CAJAS": "stock-precios-mayor",

  // ========== SISTEMAS ==========
  "PAGOS": "gestion-pagos",
  "SOLICITUDES ADMIN-SISTEMAS": "listado-solicitudes",

  // ========== RECURSOS HUMANOS ==========
  "SOLICITUDES ADMIN-RRHH": "listado-solicitudes",
};

// Función helper para verificar si un card está permitido según las sub_vistas del usuario
export const isCardAllowed = (cardId, user) => {
  const isAdmin = user?.isAdmin || false;
  const userSubVistas = user?.subVistas || [];

  // Si es admin, permitir todo
  if (isAdmin) return true;

  // Si no hay sub_vistas asignadas, no permitir nada
  if (userSubVistas.length === 0) return false;

  // Obtener nombres e IDs de sub_vistas del usuario (normalizados)
  const userPermissions = userSubVistas.flatMap(sv => [
    (sv.nombre || "").toUpperCase().trim(),
    (sv.id || "").toString().toUpperCase().trim()
  ]).filter(n => n);

  // Buscar si alguna sub_vista mapea a este cardId
  const hasAccess = Object.entries(subVistasToCardsMap).some(([subVistaName, mappedCardIds]) => {
    // Convertir mappedCardIds a array si es un string
    const ids = Array.isArray(mappedCardIds) ? mappedCardIds : [mappedCardIds];

    if (ids.includes(cardId)) {
      return userPermissions.includes(subVistaName.toUpperCase().trim());
    }
    return false;
  });

  return hasAccess;
};
