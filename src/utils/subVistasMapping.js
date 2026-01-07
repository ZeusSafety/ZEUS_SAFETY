// Mapeo completo de todas las sub_vistas (NOMBRE de la API) a IDs de cards en cada módulo
// Basado en las imágenes proporcionadas con todas las sub_vistas por módulo

export const subVistasToCardsMap = {
  // ========== GERENCIA ==========
  "GESTION DE USUARIOS": "accesibilidad-credenciales",
  "GESTION DE PRODUCTOS": "productos",
  "SOLICITUDES ADMIN-GERENCIA": "listado-solicitudes",
  
  // ========== ADMINISTRACION ==========
  "LISTADO DE IMPORTACIONES": "importaciones", // En sección incidencias
  "LISTADO INCIDENCIA DE PROFORMAS": "proformas-actas", // En sección incidencias
  "GESTION_PRODUCTOS": "gestionar-productos", // Puede estar en otra sección o no implementado aún
  "SOLICITUDES ADMIN-ADMINISTRACION": "listado-solicitudes",
  
  // ========== IMPORTACION ==========
  "IMPORTACIONES_REGISTRO": "registro",
  "LISTADO_IMPORTACIONES_IMPORT": "listado",
  "SOLICITUDES_LISTADO": "listado-solicitudes",
  "SOLICITUDES ADMIN-IMPORTACION": "listado-solicitudes", // Mismo card que SOLICITUDES_LISTADO
  
  // ========== LOGISTICA ==========
  "LISTADO_IMPORTACIONES_LOGISTICA": "importaciones",
  "SOLICITUDES ADMIN-LOGISTICA": "listado-solicitudes",
  "LISTADO_REGISTRO_INCIDENCIA_PROFORMAS": "proformas", // Card en sección "Registrar Incidencias"
  "REGISTRO_INCIDENCIA_IMPORTACION_LOGIS": "incidencias", // Card en sección "Registrar Incidencias"
  "REGISTRO_INCIDENCIA_IMPORTACION_IOGISTICA": "incidencias", // Variante del nombre
  // Los siguientes pueden estar en otras secciones o no implementados:
  "LISTADO_INCIDENCIAS_IMPORTACION": "incidencias-importaciones", // Card en sección "Ver Listados"
  "GESTION DESCUENTO DE CAJAS MALVINAS": "gestion-cajas-malvinas", // Card en sección "Descuento por Ventas Cajas Malvinas"
  "HISTORIAL GESTION DESCUENTO DE CAJAS MALVINAS": "historial-cajas-malvinas", // Card en sección "Descuento por Ventas Cajas Malvinas"
  "INVENTARIO": "inventario", // Si existe el card
  
  // ========== FACTURACION ==========
  "REGISTRAR VENTAS": "registrar-venta",
  "GESTIONAR VENTAS": "gestionar-venta",
  "REGISTRAR REGULARIZACION": "registrar-regularizacion",
  "GESTION_REGULARIZACION": "gestionar-regularizacion",
  "INCIDENCIAS_PROFORMAS": "incidencia-proformas",
  "LISTADO DE IMPORTACIONES": "listado-importaciones", // En contexto de FACTURACION
  "CONFIGURACION_VENTAS": "gestionar-configuracion",
  "SOLICITUDES ADMIN-FACTURACION": "listado-solicitudes",
  "FRANJA_DE_PRECIOS": "listado-precios",
  
  // ========== MARKETING ==========
  "LISTADO DE IMPORTACIONES": "listado-importaciones", // En contexto de MARKETING
  "GESTION DE CLIENTES - MARKETING": "gestion-clientes",
  "LISTADO DE VENTAS - MARKETING": "listado-ventas",
  "SUBIDA DE ARCHIVOS MARKETING": "subida-archivos",
  "LISTADO DE ARCHIVOS SUBIDOS": "listado-archivos",
  "RECENCIA DE CLIENTES": "recencia-clientes", // Si existe el card
  "SOLICITUDES ADMIN-MARKETING": "listado-solicitudes",
  "STOCK MALVINAS POR MAYOR CAJAS": "stock-precios-mayor", // Si existe el card
  
  // ========== SISTEMAS ==========
  "PAGOS": "gestion-pagos", // Si existe el card
  "SOLICITUDES ADMIN-SISTEMAS": "listado-solicitudes",
  
  // ========== RECURSOS HUMANOS ==========
  "LISTADO DE IMPORTACIONES": "listado-importaciones", // En contexto de RECURSOS HUMANOS
  "SOLICITUDES ADMIN-RRHH": "listado-solicitudes",
  
  // ========== VENTAS ==========
  // Si hay sub_vistas específicas para VENTAS, agregarlas aquí
};

// Función helper para verificar si un card está permitido según las sub_vistas del usuario
export const isCardAllowed = (cardId, user) => {
  const isAdmin = user?.isAdmin || false;
  const userSubVistas = user?.subVistas || [];

  // Si es admin, permitir todo
  if (isAdmin) return true;

  // Si no hay sub_vistas asignadas, no permitir nada
  if (userSubVistas.length === 0) return false;

  // Obtener nombres de sub_vistas del usuario (normalizados)
  const subVistaNames = userSubVistas.map(sv => (sv.nombre || "").toUpperCase().trim()).filter(n => n);

  // Buscar si alguna sub_vista mapea a este cardId
  const hasAccess = Object.entries(subVistasToCardsMap).some(([subVistaName, mappedCardId]) => {
    if (mappedCardId === cardId) {
      return subVistaNames.includes(subVistaName.toUpperCase().trim());
    }
    return false;
  });

  return hasAccess;
};

