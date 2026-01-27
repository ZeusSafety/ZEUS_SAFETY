"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export function Sidebar({ isOpen, onClose }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [expandedModules, setExpandedModules] = useState({});
  const [expandedSubmenus, setExpandedSubmenus] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);

  // Todos los mÃ³dulos disponibles
  const allModules = [
    { id: "gerencia", name: "Gerencia", icon: "shield", hasSubmenu: true },
    { id: "administracion", name: "Administracion", icon: "user-gear", hasSubmenu: true },
    { id: "importacion", name: "Importacion", icon: "ship", hasSubmenu: true },
    { id: "logistica", name: "Logistica", icon: "truck", hasSubmenu: true },
    { id: "facturacion", name: "Facturacion", icon: "chart", hasSubmenu: true },
    { id: "marketing", name: "Marketing", icon: "megaphone", hasSubmenu: true },
    { id: "sistemas", name: "Sistemas", icon: "gears", hasSubmenu: true },
    { id: "recursos-humanos", name: "Recursos Humanos", icon: "users", hasSubmenu: true },
    { id: "ventas", name: "Ventas", icon: "document", hasSubmenu: true },
    { id: "permisos", name: "Permisos/Solicitudes e Incidencias", icon: "list", hasSubmenu: true },
    { id: "boletin-informativo", name: "Boletin Informativo", icon: "birthday", hasSubmenu: true },
    { id: "seguimiento-monitoreo", name: "Seguimiento y Monitoreo", icon: "location", hasSubmenu: false },
  ];

  // Filtrar mÃ³dulos segÃºn los permisos del usuario
  const userModules = user?.modules || [];
  const userSubVistas = user?.subVistas || [];
  const isAdmin = user?.isAdmin || false;

  // Si es admin, mostrar todos los mÃ³dulos
  // Si no es admin pero tiene mÃ³dulos, filtrar
  // Si no es admin y no tiene mÃ³dulos, no mostrar ninguno (array vacÃ­o)
  // Temporalmente ocultar "Seguimiento y Monitoreo" (en proceso)
  let modules = (isAdmin
    ? allModules
    : userModules.length > 0
      ? allModules.filter((module) => userModules.includes(module.id))
      : []).filter((module) => module.id !== "seguimiento-monitoreo");

  // Asegurar que "boletin-informativo" siempre estÃ© disponible para todos los usuarios
  if (!modules.some(m => m.id === "boletin-informativo")) {
    const boletinModule = allModules.find(m => m.id === "boletin-informativo");
    if (boletinModule) {
      modules = [...modules, boletinModule];
    }
  }

  // Asegurar que "permisos" siempre estÃ© disponible para todos los usuarios
  if (!modules.some(m => m.id === "permisos")) {
    const permisosModule = allModules.find(m => m.id === "permisos");
    if (permisosModule) {
      modules = [...modules, permisosModule];
    }
  }

  // Mapeo COMPLETO de nombres de sub_vistas (de la API) a IDs de items del sidebar
  // Este mapeo conecta los nombres que vienen de la API con los IDs usados en el sidebar
  const subVistaToItemIdMap = {
    // FACTURACIÃ“N (segÃºn la tabla de sub_vistas)
    "REGISTRAR VENTAS": "crear-venta-fact",
    "GESTIONAR VENTAS": "gestionar-venta-fact",
    "REGISTRAR REGULARIZACION": "crear-regularizacion-fact",
    "GESTION_REGULARIZACION": "gestionar-regularizacion-fact",
    "INCIDENCIAS_PROFORMAS": "incidencia-proformas",
    "LISTADO DE IMPORTACIONES": "listado-importaciones-fact",
    "CONFIGURACION_VENTAS": "configuracion-general-fact",
    "SOLICITUDES ADMIN-FACTURACION": "listado-solicitudes-facturacion",
    "FRANJA_DE_PRECIOS": "listado-precios-facturacion",

    // ImportaciÃ³n
    "IMPORTACIONES_REGISTRO": "registro",
    "LISTADO_IMPORTACIONES_IMPORT": "listado-import",
    "SOLICITUDES_LISTADO": "listado-solicitudes",
    "LISTADO_INCIDENCIAS_IMPORTACION": "incidencias-importaciones",
    "LISTADO_IMPORTACIONES_LOGISTICA": "importaciones-log",

    // AdministraciÃ³n
    "LISTADO_REGISTRO_INCIDENCIA_PROFORMAS": "proformas",

    // Marketing
    "GESTION DE CLIENTES - MARKETING": "gestion-clientes-marketing",
    "LISTADO DE VENTAS - MARKETING": "listado-ventas-marketing",
    "RECENCIA DE CLIENTES": "recencia-clientes",
    "SOLICITUDES ADMIN-MARKETING": "listado-solicitudes-incidencias-marketing",
    "STOCK MALVINAS POR MAYOR CAJAS": "stock-precios-mayor",

    // Gerencia
    "GESTION DE USUARIOS": "accesibilidad-credenciales",
    "GESTION DE PRODUCTOS": "productos",
    "SOLICITUDES ADMIN-GERENCIA": "listado-solicitudes",
    "GESTION DESCUENTO DE CAJAS MALVINAS": "gestion-precios",
    "HISTORIAL GESTION DESCUENTO DE CAJAS MALVINAS": "listado-precios",

    // Logística
    "LISTADO DE MOVILIDAD": "listado-movilidad-log",
    "LISTADO_MOVILIDAD": "listado-movilidad-log",
  };

  // Mapeo de items principales (con submenÃºs) a sus subItems
  // Esto permite ocultar items principales si el usuario no tiene ninguna sub_vista dentro
  const itemToSubItemsMap = {
    "ventas-facturacion": ["crear-venta-fact", "gestionar-venta-fact"],
    "regularizacion-facturacion": ["crear-regularizacion-fact", "gestionar-regularizacion-fact"],
    "listados-facturacion": ["incidencia-proformas", "listado-importaciones-fact"],
    "configuracion-facturacion": ["configuracion-general-fact"],
    "franja-precios-facturacion": ["listado-precios-facturacion"],
    "solicitudes-facturacion": ["listado-solicitudes-facturacion"],
  };

  // FunciÃ³n para verificar si un item del sidebar estÃ¡ permitido segÃºn las sub_vistas
  const isItemAllowed = (itemId) => {
    // Si es admin, permitir todo
    if (isAdmin) return true;

    // Items del boletÃ­n informativo siempre estÃ¡n permitidos para todos
    if (itemId === "dashboard-boletin" || itemId === "calendario-cumpleanos") {
      return true;
    }

    // Items de permisos siempre estÃ¡n permitidos para todos
    if (itemId === "registro-permisos" || itemId === "mis-permisos" ||
      itemId === "registro-solicitudes-incidencias" || itemId === "mis-solicitudes-incidencias") {
      return true;
    }

    // Si no hay sub_vistas asignadas, no permitir nada (array vacÃ­o = sin acceso)
    if (userSubVistas.length === 0) return false;

    // Obtener nombres de sub_vistas del usuario (normalizados)
    const subVistaNames = userSubVistas.map(sv => (sv.nombre || "").toUpperCase().trim()).filter(n => n);

    // Si es un item principal con submenÃº, verificar si tiene al menos un subItem permitido
    if (itemToSubItemsMap[itemId]) {
      const subItems = itemToSubItemsMap[itemId];
      return subItems.some(subItemId => {
        // Buscar si alguna sub_vista mapea a este subItemId
        return Object.entries(subVistaToItemIdMap).some(([subVistaName, mappedId]) => {
          if (mappedId === subItemId) {
            return subVistaNames.includes(subVistaName.toUpperCase().trim());
          }
          return false;
        });
      });
    }

    // Para items individuales (sin submenÃº), verificar directamente
    const hasAccess = Object.entries(subVistaToItemIdMap).some(([subVistaName, mappedId]) => {
      if (mappedId === itemId) {
        return subVistaNames.includes(subVistaName.toUpperCase().trim());
      }
      return false;
    });

    // Si el item estÃ¡ en el mapeo, solo permitir si tiene acceso
    if (Object.values(subVistaToItemIdMap).includes(itemId)) {
      return hasAccess;
    }

    // Para dashboards, verificar si el usuario tiene acceso al mÃ³dulo correspondiente
    const dashboardModuleMap = {
      "dashboard": "gerencia",
      "dashboard-admin": "administracion",
      "dashboard-import": "importacion",
      "dashboard-importacion": "importacion",
      "dashboard-log": "logistica",
      "dashboard-logistica": "logistica",
      "dashboard-ventas": "ventas",
      "dashboard-marketing": "marketing",
      "dashboard-sistemas": "sistemas",
      "dashboard-rh": "recursos-humanos",
      "dashboard-recursos-humanos": "recursos-humanos",
      "dashboard-facturacion": "facturacion",
      "dashboard-permisos": "permisos",
    };

    if (dashboardModuleMap[itemId]) {
      // Si es un dashboard, permitir solo si el usuario tiene acceso al mÃ³dulo
      return userModules.includes(dashboardModuleMap[itemId]);
    }

    // Para otros items que NO estÃ¡n en el mapeo, NO permitir por defecto
    // Solo se permiten si estÃ¡n explÃ­citamente mapeados o son dashboards
    return false;
  };

  // FunciÃ³n helper para verificar si un item con submenÃº tiene al menos un subItem permitido
  const hasAllowedSubItems = (item) => {
    if (!item.hasSubmenu || !item.subItems) return false;
    return item.subItems.some(subItem => isItemAllowed(subItem.id));
  };

  // SubmenÃºs de Gerencia
  const gerenciaSubmenu = [
    {
      id: "dashboard",
      name: "Dashboard",
      icon: "home",
      hasSubmenu: false,
    },
    {
      id: "gestion-usuarios",
      name: "GestiÃ³n de Usuarios",
      icon: "users",
      hasSubmenu: true,
      subItems: [
        { id: "accesibilidad-credenciales", name: "Accesibilidad y Credenciales", icon: "key" },
        { id: "registro-actividad-general", name: "Registro de Actividad (Logs generales)", icon: "shield" },
      ],
    },
    {
      id: "gestion-productos",
      name: "GestiÃ³n de Productos",
      icon: "box",
      hasSubmenu: true,
      subItems: [
        { id: "productos", name: "Productos", icon: "key" },
      ],
    },
    {
      id: "franja-precios",
      name: "Franja de precios",
      icon: "dollar",
      hasSubmenu: true,
      subItems: [
        { id: "listado-precios", name: "Listado de precios", icon: "list" },
        { id: "gestion-precios", name: "GestiÃ³n de precios", icon: "plus-circle" },
      ],
    },
    {
      id: "listado-solicitudes-gerencia",
      name: "GestiÃ³n de Solicitudes",
      icon: "document-list",
      hasSubmenu: true,
      subItems: [
        { id: "listado-solicitudes", name: "Listado de Solicitudes", icon: "list" },
      ],
    },
  ];

  // SubmenÃºs de AdministraciÃ³n
  const administracionSubmenu = [
    {
      id: "dashboard-admin",
      name: "Dashboard",
      icon: "home",
      hasSubmenu: false,
    },
    {
      id: "incidencias",
      name: "Incidencias",
      icon: "warning",
      hasSubmenu: true,
      subItems: [
        { id: "importaciones", name: "Importaciones", icon: "ship" },
        { id: "proformas-actas", name: "Proformas / Actas", icon: "document" },
      ],
    },
    {
      id: "configuracion",
      name: "ConfiguraciÃ³n",
      icon: "gears",
      hasSubmenu: true,
      subItems: [
        { id: "gestionar-productos", name: "Gestionar Productos", icon: "plus-circle" },
      ],
    },
    {
      id: "solicitudes-admin",
      name: "Solicitudes",
      icon: "document-list",
      hasSubmenu: true,
      subItems: [
        { id: "listado-solicitudes-admin", name: "Listado de Solicitudes", icon: "list" },
      ],
    },
  ];

  // SubmenÃºs de ImportaciÃ³n
  const importacionSubmenu = [
    {
      id: "dashboard-import",
      name: "Dashboard",
      icon: "home",
      hasSubmenu: false,
    },
    {
      id: "importaciones",
      name: "Importaciones",
      icon: "ship",
      hasSubmenu: true,
      subItems: [
        { id: "registro", name: "Registro", icon: "plus-circle" },
        { id: "listado-import", name: "Listado de Importaciones", icon: "list" },
      ],
    },
    {
      id: "solicitudes",
      name: "Solicitudes",
      icon: "document-list",
      hasSubmenu: true,
      subItems: [
        { id: "listado-solicitudes", name: "Listado", icon: "list" },
      ],
    },
  ];

  // SubmenÃºs de LogÃ­stica
  const logisticaSubmenu = [
    {
      id: "dashboard-log",
      name: "Dashboard",
      icon: "home",
      hasSubmenu: false,
    },
    {
      id: "registro-incidencias",
      name: "Registro de Incidencias",
      icon: "plus-circle",
      hasSubmenu: true,
      subItems: [
        { id: "proformas", name: "Proformas", icon: "document" },

      ],
    },
    {
      id: "ver-listados",
      name: "Ver Listados",
      icon: "document-list",
      hasSubmenu: true,
      subItems: [
        { id: "incidencias-importaciones", name: "Incidencias Importaciones", icon: "warning" },
        { id: "importaciones-log", name: "Listado de Importaciones", icon: "ship" },
      ],
    },
    {
      id: "movilidad-logistica",
      name: "Movilidad",
      icon: "truck",
      hasSubmenu: true,
      subItems: [
        { id: "listado-movilidad-log", name: "Listado de Movilidad", icon: "list" },
      ],
    },
    {
      id: "solicitudes-logistica",
      name: "Solicitudes",
      icon: "document-list",
      hasSubmenu: true,
      subItems: [
        { id: "listado-solicitudes-logistica", name: "Listado de solicitudes", icon: "list" },
      ],
    },
    {
      id: "inventario",
      name: "GestiÃ³n Inventario",
      icon: "plus-circle",
      hasSubmenu: true,
      subItems: [
        { id: "inventario-item", name: "Inventario", icon: "document" },
      ],
    },
  ];

  // SubmenÃºs de Ventas
  const ventasSubmenu = [
    {
      id: "dashboard-ventas",
      name: "Dashboard",
      icon: "home",
      hasSubmenu: false,
    },
    {
      id: "listados-ventas",
      name: "Listados",
      icon: "list",
      hasSubmenu: true,
      subItems: [
        { id: "listado-importaciones", name: "Listado de Importaciones", icon: "ship" },
        { id: "metricas-ventas", name: "MÃ©tricas de ventas", icon: "chart-line" },
      ],
    },
    {
      id: "solicitudes-incidencias-ventas",
      name: "Solicitudes/Incidencias",
      icon: "document-list",
      hasSubmenu: true,
      subItems: [
        { id: "listado-solicitudes-incidencias-ventas", name: "Listado de Solicitudes/Incidencias", icon: "list" },
      ],
    },
    {
      id: "franja-precios-ventas",
      name: "Franja de precios",
      icon: "dollar",
      hasSubmenu: true,
      subItems: [
        { id: "listado-precios-ventas", name: "Listado de precios", icon: "list" },
      ],
    },
  ];

  // SubmenÃºs de Marketing
  const marketingSubmenu = [
    {
      id: "dashboard-marketing",
      name: "Dashboard",
      icon: "home",
      hasSubmenu: false,
    },
    {
      id: "listados-marketing",
      name: "Listados",
      icon: "list",
      hasSubmenu: true,
      subItems: [
        { id: "importaciones-marketing", name: "Listado de Importaciones", icon: "ship" },
      ],
    },
    {
      id: "ventas-marketing",
      name: "Ventas Marketing",
      icon: "document-list",
      hasSubmenu: true,
      subItems: [
        { id: "gestion-clientes-marketing", name: "GestiÃ³n de Clientes", icon: "users" },
        { id: "listado-ventas-marketing", name: "Listado de Ventas", icon: "document-list" },
        { id: "recencia-clientes", name: "Recencia de Clientes", icon: "clock" },
        { id: "cotizaciones-marketing", name: "Cotizaciones", icon: "document" },
      ],
    },
    {
      id: "reportes-marketing",
      name: "Reportes Marketing",
      icon: "chart-line",
      hasSubmenu: true,
      subItems: [
        { id: "reporte-general-1-marketing", name: "Reporte General 1", icon: "chart-line" },
        { id: "reporte-general-2-marketing", name: "Reporte General 2", icon: "chart-line" },
      ],
    },
    {
      id: "gestion-descuento-marketing",
      name: "GestiÃ³n de Descuento",
      icon: "box",
      hasSubmenu: true,
      subItems: [
        { id: "stock-precios-mayor", name: "Stock y Precios por Mayor", icon: "box" },
      ],
    },
    {
      id: "solicitudes-incidencias-marketing",
      name: "Solicitudes/Incidencias",
      icon: "document-list",
      hasSubmenu: true,
      subItems: [
        { id: "listado-solicitudes-incidencias-marketing", name: "Listado de Solicitudes/Incidencias", icon: "list" },
      ],
    },
    {
      id: "franja-precios-marketing",
      name: "Franja de precios",
      icon: "dollar",
      hasSubmenu: true,
      subItems: [
        { id: "listado-precios-marketing", name: "Listado de precios", icon: "list" },
      ],
    },
  ];

  // SubmenÃºs de Sistemas
  const sistemasSubmenu = [
    {
      id: "dashboard-sistemas",
      name: "Dashboard",
      icon: "home",
      hasSubmenu: false,
    },
    {
      id: "pagos",
      name: "Pagos",
      icon: "credit-card",
      hasSubmenu: true,
      subItems: [
        { id: "gestion-pagos", name: "GestiÃ³n de Pagos", icon: "money" },
      ],
    },
    {
      id: "solicitudes-sistemas",
      name: "Solicitudes",
      icon: "document-list",
      hasSubmenu: true,
      subItems: [
        { id: "listado-solicitudes-sistemas", name: "Listado de Solicitudes", icon: "list" },
      ],
    },
  ];

  // SubmenÃºs de Recursos Humanos
  const recursosHumanosSubmenu = [
    {
      id: "dashboard-rh",
      name: "Dashboard",
      icon: "home",
      hasSubmenu: false,
    },
    {
      id: "gestion-colaboradores",
      name: "GestiÃ³n de Colaboradores",
      icon: "users",
      hasSubmenu: false,
    },
    {
      id: "solicitudes-incidencias",
      name: "Solicitudes/Incidencias",
      icon: "check",
      hasSubmenu: false,
    },
  ];

  // SubmenÃºs de FacturaciÃ³n
  const facturacionSubmenu = [
    {
      id: "dashboard-facturacion",
      name: "Dashboard",
      icon: "home",
      hasSubmenu: false,
    },
    {
      id: "ventas-facturacion",
      name: "Ventas",
      icon: "list",
      hasSubmenu: true,
      subItems: [
        { id: "crear-venta-fact", name: "Registrar Venta", icon: "plus-circle" },
        { id: "gestionar-venta-fact", name: "Gestionar Venta", icon: "document-list" },
      ],
    },
    {
      id: "regularizacion-facturacion",
      name: "RegularizaciÃ³n",
      icon: "document-list",
      hasSubmenu: true,
      subItems: [
        { id: "crear-regularizacion-fact", name: "Registrar RegularizaciÃ³n", icon: "plus-circle" },
        { id: "gestionar-regularizacion-fact", name: "Gestionar RegularizaciÃ³n", icon: "document-list" },
      ],
    },
    {
      id: "listados-facturacion",
      name: "Listados",
      icon: "list",
      hasSubmenu: true,
      subItems: [
        { id: "incidencia-proformas", name: "Incidencia de Proformas", icon: "warning" },
        { id: "listado-importaciones-fact", name: "Listado de Importaciones", icon: "ship" },
      ],
    },
    {
      id: "configuracion-facturacion",
      name: "ConfiguraciÃ³n",
      icon: "gears",
      hasSubmenu: true,
      subItems: [
        { id: "configuracion-general-fact", name: "GestiÃ³n ConfiguraciÃ³n", icon: "gears" },
      ],
    },
    {
      id: "franja-precios-facturacion",
      name: "Franja de precios",
      icon: "dollar",
      hasSubmenu: true,
      subItems: [
        { id: "listado-precios-facturacion", name: "Listado de precios", icon: "list" },
      ],
    },
    {
      id: "solicitudes-facturacion",
      name: "Solicitudes/Incidencias",
      icon: "document-list",
      hasSubmenu: true,
      subItems: [
        { id: "listado-solicitudes-facturacion", name: "Listado de Solicitudes/Incidencias", icon: "list" },
      ],
    },
  ];

  // SubmenÃºs de BoletÃ­n Informativo
  const boletinInformativoSubmenu = [
    {
      id: "dashboard-boletin",
      name: "Dashboard",
      icon: "home",
      hasSubmenu: false,
    },
    {
      id: "calendario-cumpleanos",
      name: "Calendario de Cumpleanos",
      icon: "birthday",
      hasSubmenu: false,
    },
  ];

  // SubmenÃºs de Permisos/Solicitudes e Incidencias
  const permisosSubmenu = [
    {
      id: "registro-permisos",
      name: "Registro de Permisos",
      icon: "home",
      hasSubmenu: false,
    },
    {
      id: "mis-permisos",
      name: "Mis Permisos",
      icon: "list",
      hasSubmenu: false,
    },
    {
      id: "registro-solicitudes-incidencias",
      name: "Registro de Solicitudes e Incidencias",
      icon: "plus-circle",
      hasSubmenu: false,
    },
    {
      id: "mis-solicitudes-incidencias",
      name: "Mis Solicitudes e Incidencias",
      icon: "list",
      hasSubmenu: false,
    },
  ];

  const toggleModule = (moduleId) => {
    // Solo expandir/colapsar el mÃ³dulo, NO redirigir
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const toggleSubmenu = (submenuId) => {
    setExpandedSubmenus((prev) => {
      const isExpanding = !prev[submenuId];
      // Si se estÃ¡ expandiendo, marcar el item; si se estÃ¡ colapsando, desmarcarlo
      if (isExpanding) {
        setSelectedItem(submenuId);
      } else {
        setSelectedItem(null);
      }
      return {
        ...prev,
        [submenuId]: isExpanding,
      };
    });
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const getIcon = (iconName) => {
    const icons = {
      shield: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      "user-gear": (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      ship: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      truck: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
        </svg>
      ),
      document: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      megaphone: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      ),
      gears: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      users: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      chart: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      location: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      list: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      home: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      box: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      key: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      ),
      "document-list": (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      "chart-line": (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      warning: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      clock: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      database: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      ),
      "plus-circle": (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={2} />
        </svg>
      ),
      "credit-card": (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      money: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      check: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      calendar: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      birthday: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        </svg>
      ),
      book: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      ),
      user: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      dollar: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    };

    return icons[iconName] || icons.shield;
  };

  const handleSubmenuClick = (itemId, moduleId = null) => {
    // Solo marcar items que NO tienen submenÃº (son pÃ¡ginas finales)
    // Los items con submenÃº se manejan con toggleSubmenu
    console.log("Navigate to:", itemId);

    // Si es Dashboard, redirigir a la pÃ¡gina del mÃ³dulo correspondiente
    if (itemId === "dashboard" || itemId === "dashboard-admin" || itemId === "dashboard-import" || itemId === "dashboard-importacion" ||
      itemId === "dashboard-log" || itemId === "dashboard-logistica" || itemId === "dashboard-ventas" || itemId === "dashboard-marketing" ||
      itemId === "dashboard-sistemas" || itemId === "dashboard-rh" || itemId === "dashboard-recursos-humanos" || itemId === "dashboard-facturacion" ||
      itemId === "dashboard-permisos") {

      // Mapeo de itemId a rutas
      const dashboardRoutes = {
        "dashboard": "/gerencia",
        "dashboard-admin": "/administracion",
        "dashboard-import": "/importacion",
        "dashboard-importacion": "/importacion",
        "dashboard-log": "/logistica",
        "dashboard-logistica": "/logistica",
        "dashboard-ventas": "/ventas",
        "dashboard-marketing": "/marketing",
        "dashboard-sistemas": "/sistemas",
        "dashboard-rh": "/recursos-humanos",
        "dashboard-recursos-humanos": "/recursos-humanos",
        "dashboard-facturacion": "/facturacion",
        "dashboard-permisos": "/permisos",
      };

      const route = dashboardRoutes[itemId];
      if (route) {
        router.push(route);
        return;
      }
    }

    // NavegaciÃ³n para otros items
    if (itemId === "accesibilidad-credenciales") {
      router.push("/gerencia/colaboradores");
      setSelectedItem(itemId);
      return;
    }

    if (itemId === "registro-actividad-general") {
      router.push("/gerencia/registro-actividad-general");
      setSelectedItem(itemId);
      return;
    }

    if (itemId === "productos") {
      router.push("/gerencia/productos");
      setSelectedItem(itemId);
      return;
    }

    if (itemId === "listado-precios") {
      router.push("/gerencia/listado-precios");
      setSelectedItem(itemId);
      return;
    }

    if (itemId === "gestion-precios") {
      router.push("/gerencia/gestion-precios");
      setSelectedItem(itemId);
      return;
    }

    // NavegaciÃ³n para Franja de precios en Marketing, FacturaciÃ³n y Ventas
    if (itemId === "listado-precios-marketing" || itemId === "listado-precios-facturacion" || itemId === "listado-precios-ventas") {
      router.push("/gerencia/listado-precios");
      setSelectedItem(itemId);
      return;
    }

    // NavegaciÃ³n para Seguimiento y Monitoreo
    if (itemId === "seguimiento-monitoreo") {
      router.push("/seguimiento-monitoreo");
      setSelectedItem(itemId);
      return;
    }

    // NavegaciÃ³n para BoletÃ­n Informativo
    if (itemId === "dashboard-boletin" || itemId === "calendario-cumpleanos") {
      router.push("/calendario-cumpleanos");
      setSelectedItem(itemId);
      return;
    }

    // NavegaciÃ³n para secciones de Recursos Humanos
    if (itemId === "gestion-colaboradores") {
      router.push("/recursos-humanos/gestion-colaboradores");
      setSelectedItem(itemId);
      return;
    }

    if (itemId === "solicitudes-incidencias") {
      router.push("/recursos-humanos/solicitudes-incidencias");
      setSelectedItem(itemId);
      return;
    }

    // NavegaciÃ³n para Incidencias en AdministraciÃ³n
    if (itemId === "importaciones") {
      router.push("/administracion/incidencias/importaciones");
      setSelectedItem(itemId);
      return;
    }

    if (itemId === "proformas-actas") {
      router.push("/administracion/incidencias/proformas-actas");
      setSelectedItem(itemId);
      return;
    }

    // NavegaciÃ³n para ImportaciÃ³n
    if (itemId === "listado-import") {
      router.push("/importacion/listado");
      setSelectedItem(itemId);
      return;
    }

    // NavegaciÃ³n para LogÃ­stica
    if (itemId === "importaciones-log") {
      router.push("/logistica/importaciones");
      setSelectedItem(itemId);
      return;
    }

    if (itemId === "proformas") {
      router.push("/logistica/incidencias");
      setSelectedItem(itemId);
      return;
    }

    if (itemId === "incidencias-importaciones") {
      router.push("/logistica/incidencias-importaciones");
      setSelectedItem(itemId);
      return;
    }

    if (itemId === "listado-solicitudes-logistica") {
      router.push("/logistica/solicitudes-incidencias");
      setSelectedItem(itemId);
      return;
    }

    if (itemId === "inventario-item") {
      router.push("/logistica/inventario");
      setSelectedItem(itemId);
      return;
    }

    // NavegaciÃ³n para FacturaciÃ³n
    if (itemId === "listado-importaciones-fact") {
      router.push("/facturacion/listado-importaciones");
      setSelectedItem(itemId);
      return;
    }

    // NavegaciÃ³n para Ventas y RegularizaciÃ³n en FacturaciÃ³n
    if (itemId === "crear-venta-fact") {
      router.push("/facturacion/crear-venta");
      setSelectedItem(itemId);
      return;
    }

    if (itemId === "gestionar-venta-fact") {
      router.push("/facturacion/gestionar-venta");
      setSelectedItem(itemId);
      return;
    }

    if (itemId === "crear-regularizacion-fact") {
      router.push("/facturacion/crear-regularizacion");
      setSelectedItem(itemId);
      return;
    }

    if (itemId === "gestionar-regularizacion-fact") {
      router.push("/facturacion/gestionar-regularizacion");
      setSelectedItem(itemId);
      return;
    }

    if (itemId === "configuracion-general-fact") {
      router.push("/facturacion/configuracion");
      setSelectedItem(itemId);
      return;
    }

    // NavegaciÃ³n para Ventas
    if (itemId === "listado-importaciones") {
      router.push("/ventas/listado-importaciones");
      setSelectedItem(itemId);
      return;
    }

    if (itemId === "metricas-ventas") {
      router.push("/ventas/metricas");
      setSelectedItem(itemId);
      return;
    }

    if (itemId === "listado-solicitudes-incidencias-ventas") {
      router.push("/ventas/solicitudes-incidencias");
      setSelectedItem(itemId);
      return;
    }

    // NavegaciÃ³n para Marketing
    if (itemId === "importaciones-marketing") {
      router.push("/marketing/listado-importaciones");
      setSelectedItem(itemId);
      return;
    }

    if (itemId === "gestion-clientes-marketing") {
      router.push("/marketing/gestion-clientes");
      setSelectedItem(itemId);
      return;
    }

    if (itemId === "listado-ventas-marketing") {
      router.push("/marketing/listado-ventas");
      setSelectedItem(itemId);
      return;
    }

    if (itemId === "cotizaciones-marketing") {
      router.push("/marketing/cotizaciones");
      setSelectedItem(itemId);
      return;
    }

    if (itemId === "recencia-clientes") {
      router.push("/marketing/recencia-clientes");
      setSelectedItem(itemId);
      return;
    }

    if (itemId === "stock-precios-mayor") {
      router.push("/marketing/stock-precios-mayor");
      setSelectedItem(itemId);
      return;
    }

    if (itemId === "listado-solicitudes-incidencias-marketing") {
      router.push("/marketing/solicitudes-incidencias");
      setSelectedItem(itemId);
      return;
    }

    if (itemId === "reporte-general-1-marketing") {
      router.push("/marketing/reporte-general-1");
      setSelectedItem(itemId);
      return;
    }

    if (itemId === "reporte-general-2-marketing") {
      router.push("/marketing/reporte-general-2");
      setSelectedItem(itemId);
      return;
    }

    // NavegaciÃ³n para Sistemas
    if (itemId === "gestion-pagos") {
      router.push("/sistemas/gestion-pagos");
      setSelectedItem(itemId);
      return;
    }

    if (itemId === "listado-solicitudes-sistemas") {
      router.push("/sistemas/solicitudes-incidencias");
      setSelectedItem(itemId);
      return;
    }

    // NavegaciÃ³n para FacturaciÃ³n
    if (itemId === "incidencia-proformas") {
      router.push("/facturacion/incidencia-proformas");
      setSelectedItem(itemId);
      return;
    }

    if (itemId === "listado-solicitudes-facturacion") {
      router.push("/facturacion/solicitudes-incidencias");
      setSelectedItem(itemId);
      return;
    }

    // NavegaciÃ³n para AdministraciÃ³n
    if (itemId === "gestionar-productos") {
      router.push("/administracion/configuracion/gestionar-productos");
      setSelectedItem(itemId);
      return;
    }

    if (itemId === "listado-solicitudes-admin") {
      router.push("/administracion/solicitudes-incidencias");
      setSelectedItem(itemId);
      return;
    }

    // NavegaciÃ³n para ImportaciÃ³n
    if (itemId === "registro") {
      router.push("/importacion/registro");
      setSelectedItem(itemId);
      return;
    }

    // Manejar "listado-solicitudes" segÃºn el mÃ³dulo (Gerencia o ImportaciÃ³n)
    if (itemId === "listado-solicitudes") {
      if (moduleId === "gerencia") {
        router.push("/gerencia/solicitudes-incidencias");
      } else if (moduleId === "importacion") {
        router.push("/importacion/solicitudes-incidencias");
      } else {
        // Por defecto, si no hay moduleId, intentar determinar por contexto
        // Si viene de un submenu de gerencia, ir a gerencia
        router.push("/gerencia/solicitudes-incidencias");
      }
      setSelectedItem(itemId);
      return;
    }

    // NavegaciÃ³n para Permisos/Solicitudes e Incidencias
    if (itemId === "registro-solicitudes-incidencias") {
      router.push("/permisos?section=registro-solicitudes-incidencias");
      setSelectedItem(itemId);
      return;
    }

    if (itemId === "mis-solicitudes-incidencias") {
      router.push("/permisos?section=mis-solicitudes-incidencias  ");
      setSelectedItem(itemId);
      return;
    }

    if (itemId === "registro-permisos") {
      router.push("/permisos?section=registro-permisos");
      setSelectedItem(itemId);
      return;
    }

    if (itemId === "mis-permisos") {
      router.push("/permisos?section=mis-permisos");
      setSelectedItem(itemId);
      return;
    }

    // AquÃ­ irÃ­a la navegaciÃ³n real para otros items
    setSelectedItem(itemId);
  };

  return (
    <>
      {/* Overlay para mÃ³vil */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          w-60 bg-white
          flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{ boxShadow: '2px 0 8px 0 rgba(0, 0, 0, 0.08), 1px 0 2px 0 rgba(0, 0, 0, 0.04)' }}
      >
        {/* Logo - Clickable to menu */}
        <button
          onClick={() => router.push("/menu")}
          className="pt-2 pb-2 px-4 border-b border-gray-200 flex justify-center w-full bg-white hover:bg-white active:bg-white transition-colors duration-200"
          aria-label="Ir al menÃº"
        >
          <div className="relative w-32 h-32">
            <Image
              src="/images/logo_zeus_safety.png"
              alt="Zeus Safety Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </button>

        {/* Navigation */}
        <nav className={`flex-1 flex flex-col overflow-hidden`}>
          <div className="px-4 pt-3 pb-1 flex-shrink-0 bg-white">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest" style={{ fontFamily: 'var(--font-poppins)' }}>
              MODULOS
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
            <ul className="space-y-1 px-2">
              {modules.map((module) => (
                <li key={module.id}>
                  <button
                    onClick={() => {
                      if (!module.hasSubmenu) {
                        // Para mÃ³dulos sin submenÃº, navegar directamente
                        if (module.id === "seguimiento-monitoreo") {
                          router.push("/seguimiento-monitoreo");
                          setSelectedItem(module.id);
                        }
                      } else {
                        toggleModule(module.id);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-all duration-200 group hover:shadow-md active:scale-[0.98] ${(module.id === "gerencia" || module.id === "administracion" || module.id === "importacion" || module.id === "logistica" || module.id === "ventas" || module.id === "marketing" || module.id === "sistemas" || module.id === "recursos-humanos" || module.id === "facturacion" || module.id === "permisos" || module.id === "boletin-informativo") && expandedModules[module.id]
                      ? "bg-[#E9F1FF] text-[#001F3D] border-l-4 border-[#002D5A] shadow-sm"
                      : module.id === "seguimiento-monitoreo" && selectedItem === module.id
                        ? "bg-[#E9F1FF] text-[#001F3D] border-l-4 border-[#002D5A] shadow-sm"
                        : "text-gray-700 hover:bg-[#E9F1FF] hover:text-[#001F3D] border-l-4 border-transparent"
                      }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className={`transition-colors flex-shrink-0 ${(module.id === "gerencia" || module.id === "administracion" || module.id === "importacion" || module.id === "logistica" || module.id === "ventas" || module.id === "marketing" || module.id === "sistemas" || module.id === "recursos-humanos" || module.id === "facturacion" || module.id === "permisos" || module.id === "boletin-informativo") && expandedModules[module.id]
                        ? "text-[#002D5A]"
                        : module.id === "seguimiento-monitoreo" && selectedItem === module.id
                          ? "text-[#002D5A]"
                          : "text-gray-600 group-hover:text-[#002D5A]"
                        }`}>
                        {getIcon(module.icon)}
                      </span>
                      <span className={`text-xs text-left leading-tight ${(module.id === "gerencia" || module.id === "administracion" || module.id === "importacion" || module.id === "logistica" || module.id === "ventas" || module.id === "marketing" || module.id === "sistemas" || module.id === "recursos-humanos" || module.id === "facturacion" || module.id === "permisos" || module.id === "boletin-informativo") && expandedModules[module.id]
                        ? "text-[#001F3D] font-medium"
                        : module.id === "seguimiento-monitoreo" && selectedItem === module.id
                          ? "text-[#001F3D] font-medium"
                          : "text-gray-800 group-hover:text-[#001F3D] font-medium"
                        }`} style={{ fontFamily: 'var(--font-poppins)' }}>
                        {module.name === "Permisos/Solicitudes e Incidencias" ? (
                          <>
                            Permisos/Solicitudes e<br />
                            Incidencias
                          </>
                        ) : (
                          module.name
                        )}
                      </span>
                    </div>
                    {module.hasSubmenu && (
                      <svg
                        className={`w-4 h-4 text-gray-400 transition-all duration-200 ${expandedModules[module.id] ? "rotate-180 text-white" : "group-hover:text-white"
                          }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </button>

                  {/* SubmenÃº de Gerencia */}
                  {module.id === "gerencia" && expandedModules[module.id] && (
                    <div className="mt-1 ml-2 space-y-0.5 bg-gray-100 rounded-lg py-1.5 border border-gray-100">
                      {/* Items del submenÃº */}
                      <div className="space-y-0.5">
                        {gerenciaSubmenu.filter(item => {
                          // Si no tiene submenÃº, verificar directamente
                          if (!item.hasSubmenu) return isItemAllowed(item.id);
                          // Si tiene submenÃº, verificar si tiene al menos un subItem permitido
                          return hasAllowedSubItems(item);
                        }).map((item) => (
                          <div key={item.id}>
                            {!item.hasSubmenu ? (
                              <button
                                onClick={() => handleSubmenuClick(item.id, module.id)}
                                className="w-full flex items-center space-x-2 pl-2 pr-3 py-2 rounded-md text-gray-700 hover:bg-[#E9F1FF] hover:text-[#001F3D] transition-all duration-200 text-xs font-medium border-l-4 border-transparent hover:border-[#002D5A]"
                              >
                                <span className="text-gray-500 group-hover:text-white flex-shrink-0">{getIcon(item.icon)}</span>
                                <span className="text-left">{item.name}</span>
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => toggleSubmenu(item.id)}
                                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-all duration-200 border-l-4 ${expandedSubmenus[item.id]
                                    ? "bg-[#E9F1FF] text-gray-900 border-[#002D5A] font-medium"
                                    : "text-gray-700 hover:bg-gray-200 hover:text-gray-900 border-transparent hover:border-[#002D5A] font-medium"
                                    }`}
                                  style={{ fontFamily: 'var(--font-poppins)' }}
                                >
                                  <div className="flex items-center space-x-2">
                                    <span className={expandedSubmenus[item.id] ? "text-[#002D5A]" : "text-gray-500"}>{getIcon(item.icon)}</span>
                                    <span className={`text-xs font-medium whitespace-nowrap ${expandedSubmenus[item.id] ? "text-gray-900" : "text-gray-800"}`} style={{ fontFamily: 'var(--font-poppins)' }}>{item.name}</span>
                                  </div>
                                  <svg
                                    className={`w-3.5 h-3.5 text-gray-400 transition-all duration-200 ${expandedSubmenus[item.id] ? "rotate-180 text-gray-600" : ""
                                      }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                </button>
                                {expandedSubmenus[item.id] && item.subItems && (
                                  <div className="ml-3 mt-0.5 space-y-0.5">
                                    {item.subItems.filter(subItem => isItemAllowed(subItem.id)).map((subItem) => (
                                      <button
                                        key={subItem.id}
                                        onClick={() => handleSubmenuClick(subItem.id, module.id)}
                                        className={`w-full flex items-center space-x-2 pl-2 pr-3 py-1.5 rounded-md transition-all duration-200 text-xs border-l-4 ${selectedItem === subItem.id
                                          ? "bg-gray-300 text-gray-900 border-[#002D5A] font-medium"
                                          : "text-gray-600 hover:bg-gray-200 hover:text-gray-900 border-transparent hover:border-[#002D5A] font-normal"
                                          }`}
                                        style={{ fontFamily: 'var(--font-poppins)' }}
                                      >
                                        <span className={`flex-shrink-0 ${selectedItem === subItem.id ? "text-gray-900" : "text-gray-400"}`}>{getIcon(subItem.icon)}</span>
                                        <span className="text-left whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>{subItem.name}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SubmenÃº de AdministraciÃ³n */}
                  {module.id === "administracion" && expandedModules[module.id] && (
                    <div className="mt-1 ml-2 space-y-0.5 bg-gray-100 rounded-lg py-1.5 border border-gray-100">
                      {/* Items del submenÃº */}
                      <div className="space-y-0.5">
                        {administracionSubmenu.filter(item => {
                          // Si no tiene submenÃº, verificar directamente
                          if (!item.hasSubmenu) return isItemAllowed(item.id);
                          // Si tiene submenÃº, verificar si tiene al menos un subItem permitido
                          return hasAllowedSubItems(item);
                        }).map((item) => (
                          <div key={item.id}>
                            {!item.hasSubmenu ? (
                              <button
                                onClick={() => handleSubmenuClick(item.id, module.id)}
                                className="w-full flex items-center space-x-2 pl-2 pr-3 py-2 rounded-md text-gray-700 hover:bg-[#E9F1FF] hover:text-[#001F3D] transition-all duration-200 text-xs font-medium border-l-4 border-transparent hover:border-[#002D5A]"
                              >
                                <span className="text-gray-500 group-hover:text-white flex-shrink-0">{getIcon(item.icon)}</span>
                                <span className="text-left">{item.name}</span>
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => toggleSubmenu(item.id)}
                                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-all duration-200 border-l-4 ${expandedSubmenus[item.id]
                                    ? "bg-[#E9F1FF] text-gray-900 border-[#002D5A] font-medium"
                                    : "text-gray-700 hover:bg-gray-200 hover:text-gray-900 border-transparent hover:border-[#002D5A] font-medium"
                                    }`}
                                  style={{ fontFamily: 'var(--font-poppins)' }}
                                >
                                  <div className="flex items-center space-x-2">
                                    <span className={expandedSubmenus[item.id] ? "text-[#002D5A]" : "text-gray-500"}>{getIcon(item.icon)}</span>
                                    <span className={`text-xs font-medium whitespace-nowrap ${expandedSubmenus[item.id] ? "text-gray-900" : "text-gray-800"}`} style={{ fontFamily: 'var(--font-poppins)' }}>{item.name}</span>
                                  </div>
                                  <svg
                                    className={`w-3.5 h-3.5 text-gray-400 transition-all duration-200 ${expandedSubmenus[item.id] ? "rotate-180 text-gray-600" : ""
                                      }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                </button>
                                {expandedSubmenus[item.id] && item.subItems && (
                                  <div className="ml-3 mt-0.5 space-y-0.5">
                                    {item.subItems.filter(subItem => isItemAllowed(subItem.id)).map((subItem) => (
                                      <button
                                        key={subItem.id}
                                        onClick={() => handleSubmenuClick(subItem.id, module.id)}
                                        className={`w-full flex items-center space-x-2 pl-2 pr-3 py-1.5 rounded-md transition-all duration-200 text-xs border-l-4 ${selectedItem === subItem.id
                                          ? "bg-gray-300 text-gray-900 border-[#002D5A] font-medium"
                                          : "text-gray-600 hover:bg-gray-200 hover:text-gray-900 border-transparent hover:border-[#002D5A] font-normal"
                                          }`}
                                        style={{ fontFamily: 'var(--font-poppins)' }}
                                      >
                                        <span className={`flex-shrink-0 ${selectedItem === subItem.id ? "text-gray-900" : "text-gray-400"}`}>{getIcon(subItem.icon)}</span>
                                        <span className="text-left whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>{subItem.name}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SubmenÃº de ImportaciÃ³n */}
                  {module.id === "importacion" && expandedModules[module.id] && (
                    <div className="mt-1 ml-2 space-y-0.5 bg-gray-100 rounded-lg py-1.5 border border-gray-100">
                      <div className="space-y-0.5">
                        {importacionSubmenu.filter(item => {
                          if (!item.hasSubmenu) return isItemAllowed(item.id);
                          return hasAllowedSubItems(item);
                        }).map((item) => (
                          <div key={item.id}>
                            {!item.hasSubmenu ? (
                              <button
                                onClick={() => handleSubmenuClick(item.id, module.id)}
                                className="w-full flex items-center space-x-2 pl-2 pr-3 py-2 rounded-md text-gray-700 hover:bg-[#E9F1FF] hover:text-[#001F3D] transition-all duration-200 text-xs font-medium border-l-4 border-transparent hover:border-[#002D5A]"
                              >
                                <span className="text-gray-500 group-hover:text-white flex-shrink-0">{getIcon(item.icon)}</span>
                                <span className="text-left">{item.name}</span>
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => toggleSubmenu(item.id)}
                                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-all duration-200 border-l-4 ${expandedSubmenus[item.id]
                                    ? "bg-[#E9F1FF] text-gray-900 border-[#002D5A] font-medium"
                                    : "text-gray-700 hover:bg-gray-200 hover:text-gray-900 border-transparent hover:border-[#002D5A] font-medium"
                                    }`}
                                  style={{ fontFamily: 'var(--font-poppins)' }}
                                >
                                  <div className="flex items-center space-x-2">
                                    <span className={expandedSubmenus[item.id] ? "text-[#002D5A]" : "text-gray-500"}>{getIcon(item.icon)}</span>
                                    <span className={`text-xs font-medium whitespace-nowrap ${expandedSubmenus[item.id] ? "text-gray-900" : "text-gray-800"}`} style={{ fontFamily: 'var(--font-poppins)' }}>{item.name}</span>
                                  </div>
                                  <svg
                                    className={`w-3.5 h-3.5 text-gray-400 transition-all duration-200 ${expandedSubmenus[item.id] ? "rotate-180 text-gray-600" : ""
                                      }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                </button>
                                {expandedSubmenus[item.id] && item.subItems && (
                                  <div className="ml-3 mt-0.5 space-y-0.5">
                                    {item.subItems.filter(subItem => isItemAllowed(subItem.id)).map((subItem) => (
                                      <button
                                        key={subItem.id}
                                        onClick={() => handleSubmenuClick(subItem.id, module.id)}
                                        className={`w-full flex items-center space-x-2 pl-2 pr-3 py-1.5 rounded-md transition-all duration-200 text-xs border-l-4 ${selectedItem === subItem.id
                                          ? "bg-gray-300 text-gray-900 border-[#002D5A] font-medium"
                                          : "text-gray-600 hover:bg-gray-200 hover:text-gray-900 border-transparent hover:border-[#002D5A] font-normal"
                                          }`}
                                        style={{ fontFamily: 'var(--font-poppins)' }}
                                      >
                                        <span className={`flex-shrink-0 ${selectedItem === subItem.id ? "text-gray-900" : "text-gray-400"}`}>{getIcon(subItem.icon)}</span>
                                        <span className="text-left whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>{subItem.name}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SubmenÃº de LogÃ­stica */}
                  {module.id === "logistica" && expandedModules[module.id] && (
                    <div className="mt-1 ml-2 space-y-0.5 bg-gray-100 rounded-lg py-1.5 border border-gray-100">
                      <div className="space-y-0.5">
                        {logisticaSubmenu.filter(item => {
                          if (!item.hasSubmenu) return isItemAllowed(item.id);
                          return hasAllowedSubItems(item);
                        }).map((item) => (
                          <div key={item.id}>
                            {!item.hasSubmenu ? (
                              <button
                                onClick={() => handleSubmenuClick(item.id, module.id)}
                                className="w-full flex items-center space-x-2 pl-2 pr-3 py-2 rounded-md text-gray-700 hover:bg-[#E9F1FF] hover:text-[#001F3D] transition-all duration-200 text-xs font-medium border-l-4 border-transparent hover:border-[#002D5A]"
                              >
                                <span className="text-gray-500 group-hover:text-white flex-shrink-0">{getIcon(item.icon)}</span>
                                <span className="text-left">{item.name}</span>
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => toggleSubmenu(item.id)}
                                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-all duration-200 border-l-4 ${expandedSubmenus[item.id]
                                    ? "bg-[#E9F1FF] text-gray-900 border-[#002D5A] font-medium"
                                    : "text-gray-700 hover:bg-gray-200 hover:text-gray-900 border-transparent hover:border-[#002D5A] font-medium"
                                    }`}
                                  style={{ fontFamily: 'var(--font-poppins)' }}
                                >
                                  <div className="flex items-center space-x-2">
                                    <span className={expandedSubmenus[item.id] ? "text-[#002D5A]" : "text-gray-500"}>{getIcon(item.icon)}</span>
                                    <span className={`text-xs font-medium whitespace-nowrap ${expandedSubmenus[item.id] ? "text-gray-900" : "text-gray-800"}`} style={{ fontFamily: 'var(--font-poppins)' }}>{item.name}</span>
                                  </div>
                                  <svg
                                    className={`w-3.5 h-3.5 text-gray-400 transition-all duration-200 ${expandedSubmenus[item.id] ? "rotate-180 text-gray-600" : ""
                                      }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                </button>
                                {expandedSubmenus[item.id] && item.subItems && (
                                  <div className="ml-3 mt-0.5 space-y-0.5">
                                    {item.subItems.filter(subItem => isItemAllowed(subItem.id)).map((subItem) => (
                                      <button
                                        key={subItem.id}
                                        onClick={() => handleSubmenuClick(subItem.id, module.id)}
                                        className={`w-full flex items-center space-x-2 pl-2 pr-3 py-1.5 rounded-md transition-all duration-200 text-xs border-l-4 ${selectedItem === subItem.id
                                          ? "bg-gray-300 text-gray-900 border-[#002D5A] font-medium"
                                          : "text-gray-600 hover:bg-gray-200 hover:text-gray-900 border-transparent hover:border-[#002D5A] font-normal"
                                          }`}
                                        style={{ fontFamily: 'var(--font-poppins)' }}
                                      >
                                        <span className={`flex-shrink-0 ${selectedItem === subItem.id ? "text-gray-900" : "text-gray-400"}`}>{getIcon(subItem.icon)}</span>
                                        <span className="text-left whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>{subItem.name}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SubmenÃº de Ventas */}
                  {module.id === "ventas" && expandedModules[module.id] && (
                    <div className="mt-1 ml-2 space-y-0.5 bg-gray-100 rounded-lg py-1.5 border border-gray-100">
                      <div className="space-y-0.5">
                        {ventasSubmenu.filter(item => {
                          if (!item.hasSubmenu) return isItemAllowed(item.id);
                          return hasAllowedSubItems(item);
                        }).map((item) => (
                          <div key={item.id}>
                            {!item.hasSubmenu ? (
                              <button
                                onClick={() => handleSubmenuClick(item.id, module.id)}
                                className="w-full flex items-center space-x-2 pl-2 pr-3 py-2 rounded-md text-gray-700 hover:bg-[#E9F1FF] hover:text-[#001F3D] transition-all duration-200 text-xs font-medium border-l-4 border-transparent hover:border-[#002D5A]"
                              >
                                <span className="text-gray-500 group-hover:text-white flex-shrink-0">{getIcon(item.icon)}</span>
                                <span className="text-left">{item.name}</span>
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => toggleSubmenu(item.id)}
                                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-all duration-200 border-l-4 ${expandedSubmenus[item.id]
                                    ? "bg-[#E9F1FF] text-gray-900 border-[#002D5A] font-medium"
                                    : "text-gray-700 hover:bg-gray-200 hover:text-gray-900 border-transparent hover:border-[#002D5A] font-medium"
                                    }`}
                                  style={{ fontFamily: 'var(--font-poppins)' }}
                                >
                                  <div className="flex items-center space-x-2">
                                    <span className={expandedSubmenus[item.id] ? "text-[#002D5A]" : "text-gray-500"}>{getIcon(item.icon)}</span>
                                    <span className={`text-xs font-medium whitespace-nowrap ${expandedSubmenus[item.id] ? "text-gray-900" : "text-gray-800"}`} style={{ fontFamily: 'var(--font-poppins)' }}>{item.name}</span>
                                  </div>
                                  <svg
                                    className={`w-3.5 h-3.5 text-gray-400 transition-all duration-200 ${expandedSubmenus[item.id] ? "rotate-180 text-gray-600" : ""
                                      }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                </button>
                                {expandedSubmenus[item.id] && item.subItems && (
                                  <div className="ml-3 mt-0.5 space-y-0.5">
                                    {item.subItems.filter(subItem => isItemAllowed(subItem.id)).map((subItem) => (
                                      <button
                                        key={subItem.id}
                                        onClick={() => handleSubmenuClick(subItem.id, module.id)}
                                        className={`w-full flex items-center space-x-2 pl-2 pr-3 py-1.5 rounded-md transition-all duration-200 text-xs border-l-4 ${selectedItem === subItem.id
                                          ? "bg-gray-300 text-gray-900 border-[#002D5A] font-medium"
                                          : "text-gray-600 hover:bg-gray-200 hover:text-gray-900 border-transparent hover:border-[#002D5A] font-normal"
                                          }`}
                                        style={{ fontFamily: 'var(--font-poppins)' }}
                                      >
                                        <span className={`flex-shrink-0 ${selectedItem === subItem.id ? "text-gray-900" : "text-gray-400"}`}>{getIcon(subItem.icon)}</span>
                                        <span className="text-left whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>{subItem.name}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SubmenÃº de Marketing */}
                  {module.id === "marketing" && expandedModules[module.id] && (
                    <div className="mt-1 ml-2 space-y-0.5 bg-gray-100 rounded-lg py-1.5 border border-gray-100">
                      <div className="space-y-0.5">
                        {marketingSubmenu.filter(item => {
                          if (!item.hasSubmenu) return isItemAllowed(item.id);
                          return hasAllowedSubItems(item);
                        }).map((item) => (
                          <div key={item.id}>
                            {!item.hasSubmenu ? (
                              <button
                                onClick={() => handleSubmenuClick(item.id, module.id)}
                                className="w-full flex items-center space-x-2 pl-2 pr-3 py-2 rounded-md text-gray-700 hover:bg-[#E9F1FF] hover:text-[#001F3D] transition-all duration-200 text-xs font-medium border-l-4 border-transparent hover:border-[#002D5A]"
                              >
                                <span className="text-gray-500 group-hover:text-white flex-shrink-0">{getIcon(item.icon)}</span>
                                <span className="text-left">{item.name}</span>
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => toggleSubmenu(item.id)}
                                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-all duration-200 border-l-4 ${expandedSubmenus[item.id]
                                    ? "bg-[#E9F1FF] text-gray-900 border-[#002D5A] font-medium"
                                    : "text-gray-700 hover:bg-gray-200 hover:text-gray-900 border-transparent hover:border-[#002D5A] font-medium"
                                    }`}
                                  style={{ fontFamily: 'var(--font-poppins)' }}
                                >
                                  <div className="flex items-center space-x-2">
                                    <span className={expandedSubmenus[item.id] ? "text-[#002D5A]" : "text-gray-500"}>{getIcon(item.icon)}</span>
                                    <span className={`text-xs font-medium whitespace-nowrap ${expandedSubmenus[item.id] ? "text-gray-900" : "text-gray-800"}`} style={{ fontFamily: 'var(--font-poppins)' }}>{item.name}</span>
                                  </div>
                                  <svg
                                    className={`w-3.5 h-3.5 text-gray-400 transition-all duration-200 ${expandedSubmenus[item.id] ? "rotate-180 text-gray-600" : ""
                                      }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                </button>
                                {expandedSubmenus[item.id] && item.subItems && (
                                  <div className="ml-3 mt-0.5 space-y-0.5">
                                    {item.subItems.filter(subItem => isItemAllowed(subItem.id)).map((subItem) => (
                                      <button
                                        key={subItem.id}
                                        onClick={() => handleSubmenuClick(subItem.id, module.id)}
                                        className={`w-full flex items-center space-x-2 pl-2 pr-3 py-1.5 rounded-md transition-all duration-200 text-xs border-l-4 ${selectedItem === subItem.id
                                          ? "bg-gray-300 text-gray-900 border-[#002D5A] font-medium"
                                          : "text-gray-600 hover:bg-gray-200 hover:text-gray-900 border-transparent hover:border-[#002D5A] font-normal"
                                          }`}
                                        style={{ fontFamily: 'var(--font-poppins)' }}
                                      >
                                        <span className={`flex-shrink-0 ${selectedItem === subItem.id ? "text-gray-900" : "text-gray-400"}`}>{getIcon(subItem.icon)}</span>
                                        <span className="text-left whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>{subItem.name}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SubmenÃº de Sistemas */}
                  {module.id === "sistemas" && expandedModules[module.id] && (
                    <div className="mt-1 ml-2 space-y-0.5 bg-gray-100 rounded-lg py-1.5 border border-gray-100">
                      <div className="space-y-0.5">
                        {sistemasSubmenu.filter(item => {
                          if (!item.hasSubmenu) return isItemAllowed(item.id);
                          return hasAllowedSubItems(item);
                        }).map((item) => (
                          <div key={item.id}>
                            {!item.hasSubmenu ? (
                              <button
                                onClick={() => handleSubmenuClick(item.id, module.id)}
                                className="w-full flex items-center space-x-2 pl-2 pr-3 py-2 rounded-md text-gray-700 hover:bg-[#E9F1FF] hover:text-[#001F3D] transition-all duration-200 text-xs font-medium border-l-4 border-transparent hover:border-[#002D5A]"
                              >
                                <span className="text-gray-500 group-hover:text-white flex-shrink-0">{getIcon(item.icon)}</span>
                                <span className="text-left">{item.name}</span>
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => toggleSubmenu(item.id)}
                                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-all duration-200 border-l-4 ${expandedSubmenus[item.id]
                                    ? "bg-[#E9F1FF] text-gray-900 border-[#002D5A] font-medium"
                                    : "text-gray-700 hover:bg-gray-200 hover:text-gray-900 border-transparent hover:border-[#002D5A] font-medium"
                                    }`}
                                  style={{ fontFamily: 'var(--font-poppins)' }}
                                >
                                  <div className="flex items-center space-x-2">
                                    <span className={expandedSubmenus[item.id] ? "text-[#002D5A]" : "text-gray-500"}>{getIcon(item.icon)}</span>
                                    <span className={`text-xs font-medium whitespace-nowrap ${expandedSubmenus[item.id] ? "text-gray-900" : "text-gray-800"}`} style={{ fontFamily: 'var(--font-poppins)' }}>{item.name}</span>
                                  </div>
                                  <svg
                                    className={`w-3.5 h-3.5 text-gray-400 transition-all duration-200 ${expandedSubmenus[item.id] ? "rotate-180 text-gray-600" : ""
                                      }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                </button>
                                {expandedSubmenus[item.id] && item.subItems && (
                                  <div className="ml-3 mt-0.5 space-y-0.5">
                                    {item.subItems.filter(subItem => isItemAllowed(subItem.id)).map((subItem) => (
                                      <button
                                        key={subItem.id}
                                        onClick={() => handleSubmenuClick(subItem.id, module.id)}
                                        className={`w-full flex items-center space-x-2 pl-2 pr-3 py-1.5 rounded-md transition-all duration-200 text-xs border-l-4 ${selectedItem === subItem.id
                                          ? "bg-gray-300 text-gray-900 border-[#002D5A] font-medium"
                                          : "text-gray-600 hover:bg-gray-200 hover:text-gray-900 border-transparent hover:border-[#002D5A] font-normal"
                                          }`}
                                        style={{ fontFamily: 'var(--font-poppins)' }}
                                      >
                                        <span className={`flex-shrink-0 ${selectedItem === subItem.id ? "text-gray-900" : "text-gray-400"}`}>{getIcon(subItem.icon)}</span>
                                        <span className="text-left whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>{subItem.name}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SubmenÃº de Recursos Humanos */}
                  {module.id === "recursos-humanos" && expandedModules[module.id] && (
                    <div className="mt-1 ml-2 space-y-0.5 bg-gray-100 rounded-lg py-1.5 border border-gray-100">
                      <div className="space-y-0.5">
                        {recursosHumanosSubmenu.filter(item => {
                          if (!item.hasSubmenu) return isItemAllowed(item.id);
                          return hasAllowedSubItems(item);
                        }).map((item) => (
                          <div key={item.id}>
                            {!item.hasSubmenu ? (
                              <button
                                onClick={() => handleSubmenuClick(item.id, module.id)}
                                className="w-full flex items-center space-x-2 pl-2 pr-3 py-2 rounded-md text-gray-700 hover:bg-[#E9F1FF] hover:text-[#001F3D] transition-all duration-200 text-xs font-medium border-l-4 border-transparent hover:border-[#002D5A]"
                              >
                                <span className="text-gray-500 group-hover:text-white flex-shrink-0">{getIcon(item.icon)}</span>
                                <span className="text-left">{item.name}</span>
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => toggleSubmenu(item.id)}
                                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-all duration-200 border-l-4 ${expandedSubmenus[item.id]
                                    ? "bg-[#E9F1FF] text-gray-900 border-[#002D5A] font-medium"
                                    : "text-gray-700 hover:bg-gray-200 hover:text-gray-900 border-transparent hover:border-[#002D5A] font-medium"
                                    }`}
                                  style={{ fontFamily: 'var(--font-poppins)' }}
                                >
                                  <div className="flex items-center space-x-2">
                                    <span className={expandedSubmenus[item.id] ? "text-[#002D5A]" : "text-gray-500"}>{getIcon(item.icon)}</span>
                                    <span className={`text-xs font-medium whitespace-nowrap ${expandedSubmenus[item.id] ? "text-gray-900" : "text-gray-800"}`} style={{ fontFamily: 'var(--font-poppins)' }}>{item.name}</span>
                                  </div>
                                  <svg
                                    className={`w-3.5 h-3.5 text-gray-400 transition-all duration-200 ${expandedSubmenus[item.id] ? "rotate-180 text-gray-600" : ""
                                      }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                </button>
                                {expandedSubmenus[item.id] && item.subItems && (
                                  <div className="ml-3 mt-0.5 space-y-0.5">
                                    {item.subItems.filter(subItem => isItemAllowed(subItem.id)).map((subItem) => (
                                      <button
                                        key={subItem.id}
                                        onClick={() => handleSubmenuClick(subItem.id, module.id)}
                                        className={`w-full flex items-center space-x-2 pl-2 pr-3 py-1.5 rounded-md transition-all duration-200 text-xs border-l-4 ${selectedItem === subItem.id
                                          ? "bg-gray-300 text-gray-900 border-[#002D5A] font-medium"
                                          : "text-gray-600 hover:bg-gray-200 hover:text-gray-900 border-transparent hover:border-[#002D5A] font-normal"
                                          }`}
                                        style={{ fontFamily: 'var(--font-poppins)' }}
                                      >
                                        <span className={`flex-shrink-0 ${selectedItem === subItem.id ? "text-gray-900" : "text-gray-400"}`}>{getIcon(subItem.icon)}</span>
                                        <span className="text-left whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>{subItem.name}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SubmenÃº de FacturaciÃ³n */}
                  {module.id === "facturacion" && expandedModules[module.id] && (
                    <div className="mt-1 ml-2 space-y-0.5 bg-gray-100 rounded-lg py-1.5 border border-gray-100">
                      <div className="space-y-0.5">
                        {facturacionSubmenu.filter(item => {
                          if (!item.hasSubmenu) return isItemAllowed(item.id);
                          return hasAllowedSubItems(item);
                        }).map((item) => (
                          <div key={item.id}>
                            {!item.hasSubmenu ? (
                              <button
                                onClick={() => handleSubmenuClick(item.id, module.id)}
                                className="w-full flex items-center space-x-2 pl-2 pr-3 py-2 rounded-md text-gray-700 hover:bg-[#E9F1FF] hover:text-[#001F3D] transition-all duration-200 text-xs font-medium border-l-4 border-transparent hover:border-[#002D5A]"
                              >
                                <span className="text-gray-500 group-hover:text-white flex-shrink-0">{getIcon(item.icon)}</span>
                                <span className="text-left">{item.name}</span>
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => toggleSubmenu(item.id)}
                                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-all duration-200 border-l-4 ${expandedSubmenus[item.id]
                                    ? "bg-[#E9F1FF] text-gray-900 border-[#002D5A] font-medium"
                                    : "text-gray-700 hover:bg-gray-200 hover:text-gray-900 border-transparent hover:border-[#002D5A] font-medium"
                                    }`}
                                  style={{ fontFamily: 'var(--font-poppins)' }}
                                >
                                  <div className="flex items-center space-x-2">
                                    <span className={expandedSubmenus[item.id] ? "text-[#002D5A]" : "text-gray-500"}>{getIcon(item.icon)}</span>
                                    <span className={`text-xs font-medium whitespace-nowrap ${expandedSubmenus[item.id] ? "text-gray-900" : "text-gray-800"}`} style={{ fontFamily: 'var(--font-poppins)' }}>{item.name}</span>
                                  </div>
                                  <svg
                                    className={`w-3.5 h-3.5 text-gray-400 transition-all duration-200 ${expandedSubmenus[item.id] ? "rotate-180 text-gray-600" : ""
                                      }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                </button>
                                {expandedSubmenus[item.id] && item.subItems && (
                                  <div className="ml-3 mt-0.5 space-y-0.5">
                                    {item.subItems.filter(subItem => isItemAllowed(subItem.id)).map((subItem) => (
                                      <button
                                        key={subItem.id}
                                        onClick={() => handleSubmenuClick(subItem.id, module.id)}
                                        className={`w-full flex items-center space-x-2 pl-2 pr-3 py-1.5 rounded-md transition-all duration-200 text-xs border-l-4 ${selectedItem === subItem.id
                                          ? "bg-gray-300 text-gray-900 border-[#002D5A] font-medium"
                                          : "text-gray-600 hover:bg-gray-200 hover:text-gray-900 border-transparent hover:border-[#002D5A] font-normal"
                                          }`}
                                        style={{ fontFamily: 'var(--font-poppins)' }}
                                      >
                                        <span className={`flex-shrink-0 ${selectedItem === subItem.id ? "text-gray-900" : "text-gray-400"}`}>{getIcon(subItem.icon)}</span>
                                        <span className="text-left whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>{subItem.name}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SubmenÃº de BoletÃ­n Informativo */}
                  {module.id === "boletin-informativo" && expandedModules[module.id] && (
                    <div className="mt-1 ml-2 space-y-0.5 bg-gray-100 rounded-lg py-1.5 border border-gray-100">
                      <div className="space-y-0.5">
                        {boletinInformativoSubmenu.map((item) => (
                          <div key={item.id}>
                            {!item.hasSubmenu ? (
                              isItemAllowed(item.id) && (
                                <button
                                  onClick={() => handleSubmenuClick(item.id, module.id)}
                                  className="w-full flex items-center space-x-2 pl-2 pr-3 py-2 rounded-md text-gray-700 hover:bg-[#E9F1FF] hover:text-[#001F3D] transition-all duration-200 text-xs font-medium border-l-4 border-transparent hover:border-[#002D5A]"
                                >
                                  <span className="text-gray-500 group-hover:text-white flex-shrink-0">{getIcon(item.icon)}</span>
                                  <span className="text-left">{item.name}</span>
                                </button>
                              )
                            ) : (
                              <>
                                <button
                                  onClick={() => toggleSubmenu(item.id)}
                                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-all duration-200 border-l-4 ${expandedSubmenus[item.id]
                                    ? "bg-[#E9F1FF] text-gray-900 border-[#002D5A] font-medium"
                                    : "text-gray-700 hover:bg-gray-200 hover:text-gray-900 border-transparent hover:border-[#002D5A] font-medium"
                                    }`}
                                  style={{ fontFamily: 'var(--font-poppins)' }}
                                >
                                  <div className="flex items-center space-x-2">
                                    <span className={expandedSubmenus[item.id] ? "text-[#002D5A]" : "text-gray-500"}>{getIcon(item.icon)}</span>
                                    <span className={`text-xs font-medium whitespace-nowrap ${expandedSubmenus[item.id] ? "text-gray-900" : "text-gray-800"}`} style={{ fontFamily: 'var(--font-poppins)' }}>{item.name}</span>
                                  </div>
                                  <svg
                                    className={`w-3.5 h-3.5 text-gray-400 transition-all duration-200 ${expandedSubmenus[item.id] ? "rotate-180 text-gray-600" : ""
                                      }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                </button>
                                {expandedSubmenus[item.id] && item.subItems && (
                                  <div className="ml-3 mt-0.5 space-y-0.5">
                                    {item.subItems.filter(subItem => isItemAllowed(subItem.id)).map((subItem) => (
                                      <button
                                        key={subItem.id}
                                        onClick={() => handleSubmenuClick(subItem.id, module.id)}
                                        className={`w-full flex items-center space-x-2 pl-2 pr-3 py-1.5 rounded-md transition-all duration-200 text-xs border-l-4 ${selectedItem === subItem.id
                                          ? "bg-gray-300 text-gray-900 border-[#002D5A] font-medium"
                                          : "text-gray-600 hover:bg-gray-200 hover:text-gray-900 border-transparent hover:border-[#002D5A] font-normal"
                                          }`}
                                        style={{ fontFamily: 'var(--font-poppins)' }}
                                      >
                                        <span className={`flex-shrink-0 ${selectedItem === subItem.id ? "text-gray-900" : "text-gray-400"}`}>{getIcon(subItem.icon)}</span>
                                        <span className="text-left whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>{subItem.name}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SubmenÃº de Permisos/Solicitudes e Incidencias */}
                  {module.id === "permisos" && expandedModules[module.id] && (
                    <div className="mt-1 ml-2 space-y-0.5 bg-gray-100 rounded-lg py-1.5 border border-gray-100">
                      <div className="space-y-0.5">
                        {permisosSubmenu.filter(item => {
                          if (!item.hasSubmenu) return isItemAllowed(item.id);
                          return hasAllowedSubItems(item);
                        }).map((item) => (
                          <div key={item.id}>
                            {!item.hasSubmenu ? (
                              <button
                                onClick={() => handleSubmenuClick(item.id, module.id)}
                                className="w-full flex items-center space-x-2 pl-2 pr-3 py-2 rounded-md text-gray-700 hover:bg-[#E9F1FF] hover:text-[#001F3D] transition-all duration-200 text-xs font-medium border-l-4 border-transparent hover:border-[#002D5A]"
                              >
                                <span className="text-gray-500 group-hover:text-white flex-shrink-0">{getIcon(item.icon)}</span>
                                <span className="text-left">{item.name}</span>
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => toggleSubmenu(item.id)}
                                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-all duration-200 border-l-4 ${expandedSubmenus[item.id]
                                    ? "bg-[#E9F1FF] text-gray-900 border-[#002D5A] font-medium"
                                    : "text-gray-700 hover:bg-gray-200 hover:text-gray-900 border-transparent hover:border-[#002D5A] font-medium"
                                    }`}
                                  style={{ fontFamily: 'var(--font-poppins)' }}
                                >
                                  <div className="flex items-center space-x-2">
                                    <span className={expandedSubmenus[item.id] ? "text-[#002D5A]" : "text-gray-500"}>{getIcon(item.icon)}</span>
                                    <span className={`text-xs font-medium whitespace-nowrap ${expandedSubmenus[item.id] ? "text-gray-900" : "text-gray-800"}`} style={{ fontFamily: 'var(--font-poppins)' }}>{item.name}</span>
                                  </div>
                                  <svg
                                    className={`w-3.5 h-3.5 text-gray-400 transition-all duration-200 ${expandedSubmenus[item.id] ? "rotate-180 text-gray-600" : ""
                                      }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                </button>
                                {expandedSubmenus[item.id] && item.subItems && (
                                  <div className="ml-3 mt-0.5 space-y-0.5">
                                    {item.subItems.filter(subItem => isItemAllowed(subItem.id)).map((subItem) => (
                                      <button
                                        key={subItem.id}
                                        onClick={() => handleSubmenuClick(subItem.id, module.id)}
                                        className={`w-full flex items-center space-x-2 pl-2 pr-3 py-1.5 rounded-md transition-all duration-200 text-xs border-l-4 ${selectedItem === subItem.id
                                          ? "bg-gray-300 text-gray-900 border-[#002D5A] font-medium"
                                          : "text-gray-600 hover:bg-gray-200 hover:text-gray-900 border-transparent hover:border-[#002D5A] font-normal"
                                          }`}
                                        style={{ fontFamily: 'var(--font-poppins)' }}
                                      >
                                        <span className={`flex-shrink-0 ${selectedItem === subItem.id ? "text-gray-900" : "text-gray-400"}`}>{getIcon(subItem.icon)}</span>
                                        <span className="text-left whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>{subItem.name}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* User info and logout */}
        <div className="p-2.5 border-t border-gray-200/80 bg-white space-y-1.5">
          <button
            onClick={() => router.push("/perfil")}
            className="group w-full flex items-center space-x-2 px-2.5 py-3.5 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99]"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-[#002D5A] to-[#003B75] rounded-xl flex items-center justify-center text-white shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-gray-900 truncate" style={{ fontFamily: 'var(--font-poppins)' }}>
                {user?.name || user?.email || "Usuario"}
              </p>
              <p className="text-xs text-gray-600 font-normal" style={{ fontFamily: 'var(--font-poppins)' }}>Administrador</p>
            </div>
          </button>
          <button
            onClick={handleLogout}
            className="w-full bg-gradient-to-br from-[#002D5A] to-[#003B75] hover:from-[#001F3D] hover:to-[#002D5A] text-white font-medium py-3 px-3 rounded-lg flex items-center justify-center space-x-1.5 shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] text-xs"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Cerrar Sesion</span>
          </button>
        </div>
      </aside>
    </>
  );
}
