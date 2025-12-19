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

  // Todos los módulos disponibles
  const allModules = [
    { id: "gerencia", name: "Gerencia", icon: "shield", hasSubmenu: true },
    { id: "administracion", name: "Administración", icon: "user-gear", hasSubmenu: true },
    { id: "importacion", name: "Importación", icon: "ship", hasSubmenu: true },
    { id: "logistica", name: "Logística", icon: "truck", hasSubmenu: true },
    { id: "facturacion", name: "Facturación", icon: "chart", hasSubmenu: true },
    { id: "marketing", name: "Marketing", icon: "megaphone", hasSubmenu: true },
    { id: "sistemas", name: "Sistemas", icon: "gears", hasSubmenu: true },
    { id: "recursos-humanos", name: "Recursos Humanos", icon: "users", hasSubmenu: true },
    { id: "ventas", name: "Ventas", icon: "document", hasSubmenu: true },
    { id: "permisos", name: "Permisos/Solicitudes e Incidencias", icon: "list", hasSubmenu: true },
    { id: "seguimiento-monitoreo", name: "Seguimiento y Monitoreo", icon: "location", hasSubmenu: false },
  ];

  // Filtrar módulos según los permisos del usuario
  const userModules = user?.modules || [];
  const isAdmin = user?.isAdmin || false;
  
  // Si es admin o no tiene módulos definidos, mostrar todos
  // Temporalmente ocultar "Seguimiento y Monitoreo" (en proceso)
  const modules = (isAdmin || userModules.length === 0 
    ? allModules 
    : allModules.filter((module) => userModules.includes(module.id))).filter((module) => module.id !== "seguimiento-monitoreo");

  // Submenús de Gerencia
  const gerenciaSubmenu = [
    {
      id: "dashboard",
      name: "Dashboard",
      icon: "home",
      hasSubmenu: false,
    },
    {
      id: "gestion-usuarios",
      name: "Gestión de Usuarios",
      icon: "users",
      hasSubmenu: true,
      subItems: [
        { id: "accesibilidad-credenciales", name: "Accesibilidad y Credenciales", icon: "key" },
      ],
    },
    {
      id: "gestion-productos",
      name: "Gestión de Productos",
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
        { id: "gestion-precios", name: "Gestión de precios", icon: "plus-circle" },
      ],
    },
    {
      id: "reportes-anomalias",
      name: "Reportes y Anomalías",
      icon: "document-list",
      hasSubmenu: true,
      subItems: [
        { id: "reporte-ventas", name: "Reporte de Ventas", icon: "chart-line" },
        { id: "anomalias-sistema", name: "Anomalías del Sistema", icon: "warning" },
        { id: "reporte-importaciones", name: "Reporte de Importaciones", icon: "document" },
        { id: "reporte-usuarios", name: "Reporte de Usuarios", icon: "users" },
        { id: "reporte-tiempos", name: "Reporte de Tiempos", icon: "clock" },
        { id: "reporte-base-datos", name: "Reporte de Base de Datos", icon: "database" },
      ],
    },
    {
      id: "listado-solicitudes-gerencia",
      name: "Gestión de Solicitudes",
      icon: "document-list",
      hasSubmenu: true,
      subItems: [
        { id: "listado-solicitudes", name: "Listado de Solicitudes", icon: "list" },
      ],
    },
  ];

  // Submenús de Administración
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
      name: "Configuración",
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

  // Submenús de Importación
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

  // Submenús de Logística
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
      name: "Gestión Inventario",
      icon: "plus-circle",
      hasSubmenu: true,
      subItems: [
        { id: "inventario-item", name: "Inventario", icon: "document" },
      ],
    },
  ];

  // Submenús de Ventas
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
        { id: "metricas-ventas", name: "Métricas de ventas", icon: "chart-line" },
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

  // Submenús de Marketing
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
        { id: "gestion-clientes-marketing", name: "Gestión de Clientes", icon: "users" },
        { id: "listado-ventas-marketing", name: "Listado de Ventas", icon: "document-list" },
        { id: "recencia-clientes", name: "Recencia de Clientes", icon: "clock" },
        { id: "cotizaciones-marketing", name: "Cotizaciones", icon: "document" },
      ],
    },
    {
      id: "gestion-descuento-marketing",
      name: "Gestión de Descuento",
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

  // Submenús de Sistemas
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
        { id: "gestion-pagos", name: "Gestión de Pagos", icon: "money" },
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

  // Submenús de Recursos Humanos
  const recursosHumanosSubmenu = [
    {
      id: "dashboard-rh",
      name: "Dashboard",
      icon: "home",
      hasSubmenu: false,
    },
    {
      id: "gestion-colaboradores",
      name: "Gestión de Colaboradores",
      icon: "users",
      hasSubmenu: true,
      subItems: [
        { id: "control-asistencia", name: "Control de Asistencia", icon: "clock" },
        { id: "gestion-permisos", name: "Gestión de Permisos", icon: "check" },
        { id: "gestion-vacaciones", name: "Gestión de Vacaciones", icon: "calendar" },
        { id: "control-documentos", name: "Control de Documentos Laborales", icon: "document" },
        { id: "gestion-remuneraciones", name: "Gestión de Remuneraciones", icon: "money" },
        { id: "auto-servicio", name: "Auto-Servicio del Colaborador (ESS)", icon: "user" },
      ],
    },
  ];

  // Submenús de Facturación
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
      name: "Regularización",
      icon: "document-list",
      hasSubmenu: true,
      subItems: [
        { id: "crear-regularizacion-fact", name: "Registrar Regularización", icon: "plus-circle" },
        { id: "gestionar-regularizacion-fact", name: "Gestionar Regularización", icon: "document-list" },
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
      name: "Configuración",
      icon: "gears",
      hasSubmenu: true,
      subItems: [
        { id: "configuracion-general-fact", name: "Gestión Configuración", icon: "gears" },
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
  ];

  // Submenús de Permisos/Solicitudes e Incidencias
  const permisosSubmenu = [
    {
      id: "registro-permisos",
      name: "Registro de Permisos",
      icon: "home",
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
    // Solo expandir/colapsar el módulo, NO redirigir
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const toggleSubmenu = (submenuId) => {
    setExpandedSubmenus((prev) => {
      const isExpanding = !prev[submenuId];
      // Si se está expandiendo, marcar el item; si se está colapsando, desmarcarlo
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
    // Solo marcar items que NO tienen submenú (son páginas finales)
    // Los items con submenú se manejan con toggleSubmenu
    console.log("Navigate to:", itemId);
    
    // Si es Dashboard, redirigir a la página del módulo correspondiente
    if (itemId === "dashboard" || itemId === "dashboard-admin" || itemId === "dashboard-import" || itemId === "dashboard-importacion" || 
        itemId === "dashboard-logistica" || itemId === "dashboard-ventas" || itemId === "dashboard-marketing" ||
        itemId === "dashboard-sistemas" || itemId === "dashboard-rh" || itemId === "dashboard-recursos-humanos" || itemId === "dashboard-facturacion" ||
        itemId === "dashboard-permisos") {
      
      // Mapeo de itemId a rutas
      const dashboardRoutes = {
        "dashboard": "/gerencia",
        "dashboard-admin": "/administracion",
        "dashboard-import": "/importacion",
        "dashboard-importacion": "/importacion",
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
    
    // Navegación para otros items
    if (itemId === "accesibilidad-credenciales") {
      router.push("/gerencia/colaboradores");
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
    
    // Navegación para Franja de precios en Marketing, Facturación y Ventas
    if (itemId === "listado-precios-marketing" || itemId === "listado-precios-facturacion" || itemId === "listado-precios-ventas") {
      router.push("/gerencia/listado-precios");
      setSelectedItem(itemId);
      return;
    }
    
    // Navegación para Seguimiento y Monitoreo
    if (itemId === "seguimiento-monitoreo") {
      router.push("/seguimiento-monitoreo");
      setSelectedItem(itemId);
      return;
    }
    
    // Navegación para secciones de Recursos Humanos
    const recursosHumanosSections = [
      "gestion-colaboradores",
      "control-asistencia",
      "gestion-permisos",
      "gestion-vacaciones",
      "control-documentos",
      "gestion-remuneraciones",
      "auto-servicio",
    ];
    
    if (recursosHumanosSections.includes(itemId)) {
      router.push(`/recursos-humanos?section=${itemId}`);
      setSelectedItem(itemId);
      return;
    }
    
    // Navegación para Incidencias en Administración
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

    // Navegación para Importación
    if (itemId === "listado-import") {
      router.push("/importacion/listado");
      setSelectedItem(itemId);
      return;
    }
    
    // Navegación para Logística
    if (itemId === "importaciones-log") {
      router.push("/logistica/importaciones");
      setSelectedItem(itemId);
      return;
    }
    
    // Navegación para Facturación
    if (itemId === "listado-importaciones-fact") {
      router.push("/facturacion/listado-importaciones");
      setSelectedItem(itemId);
      return;
    }
    
    // Navegación para Ventas y Regularización en Facturación
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
    
    // Navegación para Ventas
    if (itemId === "listado-importaciones") {
      router.push("/ventas/listado-importaciones");
      setSelectedItem(itemId);
      return;
    }
    
    // Navegación para Marketing
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
    
    // Navegación para Permisos/Solicitudes e Incidencias
    if (itemId === "registro-solicitudes-incidencias") {
      router.push("/permisos?section=registro-solicitudes-incidencias");
      setSelectedItem(itemId);
      return;
    }
    
    if (itemId === "registro-permisos" || itemId === "mis-solicitudes-incidencias") {
      router.push("/permisos");
      setSelectedItem(itemId);
      return;
    }

    
    // Aquí iría la navegación real para otros items
    setSelectedItem(itemId);
  };

  return (
    <>
      {/* Overlay para móvil */}
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
          aria-label="Ir al menú"
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
            <h3 className="text-xs font-black text-gray-700 uppercase tracking-widest">
              MÓDULOS
            </h3>
          </div>
          <div className={`flex-1 ${Object.values(expandedModules).some(expanded => expanded === true) ? 'overflow-y-auto custom-scrollbar' : 'overflow-y-auto custom-scrollbar lg:overflow-hidden'} py-2`}>
          <ul className="space-y-1 px-2">
            {modules.map((module) => (
              <li key={module.id}>
                <button
                  onClick={() => toggleModule(module.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-all duration-200 group hover:shadow-md active:scale-[0.98] ${
                    (module.id === "gerencia" || module.id === "administracion" || module.id === "importacion" || module.id === "logistica" || module.id === "ventas" || module.id === "marketing" || module.id === "sistemas" || module.id === "recursos-humanos" || module.id === "facturacion" || module.id === "permisos") && expandedModules[module.id]
                      ? "bg-[#E8EFFF] text-[#0B327B] border-l-4 border-[#1E63F7] shadow-sm"
                      : "text-gray-700 hover:bg-[#E8EFFF] hover:text-[#0B327B] border-l-4 border-transparent"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className={`transition-colors flex-shrink-0 ${
                      (module.id === "gerencia" || module.id === "administracion" || module.id === "importacion" || module.id === "logistica" || module.id === "ventas" || module.id === "marketing" || module.id === "sistemas" || module.id === "recursos-humanos" || module.id === "facturacion" || module.id === "permisos") && expandedModules[module.id]
                        ? "text-[#1E63F7]"
                        : "text-gray-600 group-hover:text-[#1E63F7]"
                    }`}>
                      {getIcon(module.icon)}
                    </span>
                    <span className={`text-xs text-left leading-tight ${
                      (module.id === "gerencia" || module.id === "administracion" || module.id === "importacion" || module.id === "logistica" || module.id === "ventas" || module.id === "marketing" || module.id === "sistemas" || module.id === "recursos-humanos" || module.id === "facturacion" || module.id === "permisos") && expandedModules[module.id]
                        ? "text-[#0B327B] font-bold"
                        : "text-gray-800 group-hover:text-[#0B327B] font-semibold"
                    }`}>
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
                      className={`w-4 h-4 text-gray-400 transition-all duration-200 ${
                        expandedModules[module.id] ? "rotate-180 text-white" : "group-hover:text-white"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>

                {/* Submenú de Gerencia */}
                {module.id === "gerencia" && expandedModules[module.id] && (
                  <div className="mt-1 ml-2 space-y-0.5 bg-gray-100 rounded-lg py-1.5 border border-gray-100">
                    {/* Items del submenú */}
                    <div className="space-y-0.5">
                      {gerenciaSubmenu.map((item) => (
                        <div key={item.id}>
                          {!item.hasSubmenu ? (
                            <button
                              onClick={() => handleSubmenuClick(item.id, module.id)}
                              className="w-full flex items-center space-x-2 pl-2 pr-3 py-2 rounded-md text-gray-700 hover:bg-[#E8EFFF] hover:text-[#0B327B] transition-all duration-200 text-xs font-medium border-l-4 border-transparent hover:border-[#1E63F7]"
                            >
                              <span className="text-gray-500 group-hover:text-white flex-shrink-0">{getIcon(item.icon)}</span>
                              <span className="text-left">{item.name}</span>
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => toggleSubmenu(item.id)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-all duration-200 border-l-4 ${
                                  expandedSubmenus[item.id]
                                    ? "bg-[#E8EFFF] text-gray-900 border-[#1E63F7] font-bold"
                                    : "text-gray-700 hover:bg-gray-200 hover:text-gray-900 border-transparent hover:border-[#1E63F7] font-semibold"
                                }`}
                              >
                                <div className="flex items-center space-x-2">
                                  <span className={expandedSubmenus[item.id] ? "text-[#1E63F7]" : "text-gray-500"}>{getIcon(item.icon)}</span>
                                  <span className={`text-xs font-semibold whitespace-nowrap ${expandedSubmenus[item.id] ? "text-gray-900" : "text-gray-800"}`}>{item.name}</span>
                                </div>
                                <svg
                                  className={`w-3.5 h-3.5 text-gray-400 transition-all duration-200 ${
                                    expandedSubmenus[item.id] ? "rotate-180 text-gray-600" : ""
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
                                  {item.subItems.map((subItem) => (
                                    <button
                                      key={subItem.id}
                                      onClick={() => handleSubmenuClick(subItem.id)}
                                      className={`w-full flex items-center space-x-2 pl-2 pr-3 py-1.5 rounded-md transition-all duration-200 text-xs border-l-4 ${
                                        selectedItem === subItem.id
                                          ? "bg-gray-300 text-gray-900 border-[#1E63F7] font-bold"
                                          : "text-gray-600 hover:bg-gray-200 hover:text-gray-900 border-transparent hover:border-[#1E63F7] font-medium"
                                      }`}
                                    >
                                      <span className={`flex-shrink-0 ${selectedItem === subItem.id ? "text-gray-900" : "text-gray-400"}`}>{getIcon(subItem.icon)}</span>
                                      <span className="text-left whitespace-nowrap">{subItem.name}</span>
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

                {/* Submenú de Administración */}
                {module.id === "administracion" && expandedModules[module.id] && (
                  <div className="mt-1 ml-2 space-y-0.5 bg-gray-100 rounded-lg py-1.5 border border-gray-100">
                    {/* Items del submenú */}
                    <div className="space-y-0.5">
                      {administracionSubmenu.map((item) => (
                        <div key={item.id}>
                          {!item.hasSubmenu ? (
                            <button
                              onClick={() => handleSubmenuClick(item.id, module.id)}
                              className="w-full flex items-center space-x-2 pl-2 pr-3 py-2 rounded-md text-gray-700 hover:bg-[#E8EFFF] hover:text-[#0B327B] transition-all duration-200 text-xs font-medium border-l-4 border-transparent hover:border-[#1E63F7]"
                            >
                              <span className="text-gray-500 group-hover:text-white flex-shrink-0">{getIcon(item.icon)}</span>
                              <span className="text-left">{item.name}</span>
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => toggleSubmenu(item.id)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-all duration-200 border-l-4 ${
                                  expandedSubmenus[item.id]
                                    ? "bg-[#E8EFFF] text-gray-900 border-[#1E63F7] font-bold"
                                    : "text-gray-700 hover:bg-gray-200 hover:text-gray-900 border-transparent hover:border-[#1E63F7] font-semibold"
                                }`}
                              >
                                <div className="flex items-center space-x-2">
                                  <span className={expandedSubmenus[item.id] ? "text-[#1E63F7]" : "text-gray-500"}>{getIcon(item.icon)}</span>
                                  <span className={`text-xs font-semibold whitespace-nowrap ${expandedSubmenus[item.id] ? "text-gray-900" : "text-gray-800"}`}>{item.name}</span>
                                </div>
                                <svg
                                  className={`w-3.5 h-3.5 text-gray-400 transition-all duration-200 ${
                                    expandedSubmenus[item.id] ? "rotate-180 text-gray-600" : ""
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
                                  {item.subItems.map((subItem) => (
                                    <button
                                      key={subItem.id}
                                      onClick={() => handleSubmenuClick(subItem.id)}
                                      className={`w-full flex items-center space-x-2 pl-2 pr-3 py-1.5 rounded-md transition-all duration-200 text-xs border-l-4 ${
                                        selectedItem === subItem.id
                                          ? "bg-gray-300 text-gray-900 border-[#1E63F7] font-bold"
                                          : "text-gray-600 hover:bg-gray-200 hover:text-gray-900 border-transparent hover:border-[#1E63F7] font-medium"
                                      }`}
                                    >
                                      <span className={`flex-shrink-0 ${selectedItem === subItem.id ? "text-gray-900" : "text-gray-400"}`}>{getIcon(subItem.icon)}</span>
                                      <span className="text-left whitespace-nowrap">{subItem.name}</span>
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

                {/* Submenú de Importación */}
                {module.id === "importacion" && expandedModules[module.id] && (
                  <div className="mt-1 ml-2 space-y-0.5 bg-gray-100 rounded-lg py-1.5 border border-gray-100">
                    <div className="space-y-0.5">
                      {importacionSubmenu.map((item) => (
                        <div key={item.id}>
                          {!item.hasSubmenu ? (
                            <button
                              onClick={() => handleSubmenuClick(item.id, module.id)}
                              className="w-full flex items-center space-x-2 pl-2 pr-3 py-2 rounded-md text-gray-700 hover:bg-[#E8EFFF] hover:text-[#0B327B] transition-all duration-200 text-xs font-medium border-l-4 border-transparent hover:border-[#1E63F7]"
                            >
                              <span className="text-gray-500 group-hover:text-white flex-shrink-0">{getIcon(item.icon)}</span>
                              <span className="text-left">{item.name}</span>
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => toggleSubmenu(item.id)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-all duration-200 border-l-4 ${
                                  expandedSubmenus[item.id]
                                    ? "bg-[#E8EFFF] text-gray-900 border-[#1E63F7] font-bold"
                                    : "text-gray-700 hover:bg-gray-200 hover:text-gray-900 border-transparent hover:border-[#1E63F7] font-semibold"
                                }`}
                              >
                                <div className="flex items-center space-x-2">
                                  <span className={expandedSubmenus[item.id] ? "text-[#1E63F7]" : "text-gray-500"}>{getIcon(item.icon)}</span>
                                  <span className={`text-xs font-semibold whitespace-nowrap ${expandedSubmenus[item.id] ? "text-gray-900" : "text-gray-800"}`}>{item.name}</span>
                                </div>
                                <svg
                                  className={`w-3.5 h-3.5 text-gray-400 transition-all duration-200 ${
                                    expandedSubmenus[item.id] ? "rotate-180 text-gray-600" : ""
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
                                  {item.subItems.map((subItem) => (
                                    <button
                                      key={subItem.id}
                                      onClick={() => handleSubmenuClick(subItem.id)}
                                      className={`w-full flex items-center space-x-2 pl-2 pr-3 py-1.5 rounded-md transition-all duration-200 text-xs border-l-4 ${
                                        selectedItem === subItem.id
                                          ? "bg-gray-300 text-gray-900 border-[#1E63F7] font-bold"
                                          : "text-gray-600 hover:bg-gray-200 hover:text-gray-900 border-transparent hover:border-[#1E63F7] font-medium"
                                      }`}
                                    >
                                      <span className={`flex-shrink-0 ${selectedItem === subItem.id ? "text-gray-900" : "text-gray-400"}`}>{getIcon(subItem.icon)}</span>
                                      <span className="text-left whitespace-nowrap">{subItem.name}</span>
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

                {/* Submenú de Logística */}
                {module.id === "logistica" && expandedModules[module.id] && (
                  <div className="mt-1 ml-2 space-y-0.5 bg-gray-100 rounded-lg py-1.5 border border-gray-100">
                    <div className="space-y-0.5">
                      {logisticaSubmenu.map((item) => (
                        <div key={item.id}>
                          {!item.hasSubmenu ? (
                            <button
                              onClick={() => handleSubmenuClick(item.id, module.id)}
                              className="w-full flex items-center space-x-2 pl-2 pr-3 py-2 rounded-md text-gray-700 hover:bg-[#E8EFFF] hover:text-[#0B327B] transition-all duration-200 text-xs font-medium border-l-4 border-transparent hover:border-[#1E63F7]"
                            >
                              <span className="text-gray-500 group-hover:text-white flex-shrink-0">{getIcon(item.icon)}</span>
                              <span className="text-left">{item.name}</span>
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => toggleSubmenu(item.id)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-all duration-200 border-l-4 ${
                                  expandedSubmenus[item.id]
                                    ? "bg-[#E8EFFF] text-gray-900 border-[#1E63F7] font-bold"
                                    : "text-gray-700 hover:bg-gray-200 hover:text-gray-900 border-transparent hover:border-[#1E63F7] font-semibold"
                                }`}
                              >
                                <div className="flex items-center space-x-2">
                                  <span className={expandedSubmenus[item.id] ? "text-[#1E63F7]" : "text-gray-500"}>{getIcon(item.icon)}</span>
                                  <span className={`text-xs font-semibold whitespace-nowrap ${expandedSubmenus[item.id] ? "text-gray-900" : "text-gray-800"}`}>{item.name}</span>
                                </div>
                                <svg
                                  className={`w-3.5 h-3.5 text-gray-400 transition-all duration-200 ${
                                    expandedSubmenus[item.id] ? "rotate-180 text-gray-600" : ""
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
                                  {item.subItems.map((subItem) => (
                                    <button
                                      key={subItem.id}
                                      onClick={() => handleSubmenuClick(subItem.id)}
                                      className={`w-full flex items-center space-x-2 pl-2 pr-3 py-1.5 rounded-md transition-all duration-200 text-xs border-l-4 ${
                                        selectedItem === subItem.id
                                          ? "bg-gray-300 text-gray-900 border-[#1E63F7] font-bold"
                                          : "text-gray-600 hover:bg-gray-200 hover:text-gray-900 border-transparent hover:border-[#1E63F7] font-medium"
                                      }`}
                                    >
                                      <span className={`flex-shrink-0 ${selectedItem === subItem.id ? "text-gray-900" : "text-gray-400"}`}>{getIcon(subItem.icon)}</span>
                                      <span className="text-left whitespace-nowrap">{subItem.name}</span>
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

                {/* Submenú de Ventas */}
                {module.id === "ventas" && expandedModules[module.id] && (
                  <div className="mt-1 ml-2 space-y-0.5 bg-gray-100 rounded-lg py-1.5 border border-gray-100">
                    <div className="space-y-0.5">
                      {ventasSubmenu.map((item) => (
                        <div key={item.id}>
                          {!item.hasSubmenu ? (
                            <button
                              onClick={() => handleSubmenuClick(item.id, module.id)}
                              className="w-full flex items-center space-x-2 pl-2 pr-3 py-2 rounded-md text-gray-700 hover:bg-[#E8EFFF] hover:text-[#0B327B] transition-all duration-200 text-xs font-medium border-l-4 border-transparent hover:border-[#1E63F7]"
                            >
                              <span className="text-gray-500 group-hover:text-white flex-shrink-0">{getIcon(item.icon)}</span>
                              <span className="text-left">{item.name}</span>
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => toggleSubmenu(item.id)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-all duration-200 border-l-4 ${
                                  expandedSubmenus[item.id]
                                    ? "bg-[#E8EFFF] text-gray-900 border-[#1E63F7] font-bold"
                                    : "text-gray-700 hover:bg-gray-200 hover:text-gray-900 border-transparent hover:border-[#1E63F7] font-semibold"
                                }`}
                              >
                                <div className="flex items-center space-x-2">
                                  <span className={expandedSubmenus[item.id] ? "text-[#1E63F7]" : "text-gray-500"}>{getIcon(item.icon)}</span>
                                  <span className={`text-xs font-semibold whitespace-nowrap ${expandedSubmenus[item.id] ? "text-gray-900" : "text-gray-800"}`}>{item.name}</span>
                                </div>
                                <svg
                                  className={`w-3.5 h-3.5 text-gray-400 transition-all duration-200 ${
                                    expandedSubmenus[item.id] ? "rotate-180 text-gray-600" : ""
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
                                  {item.subItems.map((subItem) => (
                                    <button
                                      key={subItem.id}
                                      onClick={() => handleSubmenuClick(subItem.id)}
                                      className={`w-full flex items-center space-x-2 pl-2 pr-3 py-1.5 rounded-md transition-all duration-200 text-xs border-l-4 ${
                                        selectedItem === subItem.id
                                          ? "bg-gray-300 text-gray-900 border-[#1E63F7] font-bold"
                                          : "text-gray-600 hover:bg-gray-200 hover:text-gray-900 border-transparent hover:border-[#1E63F7] font-medium"
                                      }`}
                                    >
                                      <span className={`flex-shrink-0 ${selectedItem === subItem.id ? "text-gray-900" : "text-gray-400"}`}>{getIcon(subItem.icon)}</span>
                                      <span className="text-left whitespace-nowrap">{subItem.name}</span>
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

                {/* Submenú de Marketing */}
                {module.id === "marketing" && expandedModules[module.id] && (
                  <div className="mt-1 ml-2 space-y-0.5 bg-gray-100 rounded-lg py-1.5 border border-gray-100">
                    <div className="space-y-0.5">
                      {marketingSubmenu.map((item) => (
                        <div key={item.id}>
                          {!item.hasSubmenu ? (
                            <button
                              onClick={() => handleSubmenuClick(item.id, module.id)}
                              className="w-full flex items-center space-x-2 pl-2 pr-3 py-2 rounded-md text-gray-700 hover:bg-[#E8EFFF] hover:text-[#0B327B] transition-all duration-200 text-xs font-medium border-l-4 border-transparent hover:border-[#1E63F7]"
                            >
                              <span className="text-gray-500 group-hover:text-white flex-shrink-0">{getIcon(item.icon)}</span>
                              <span className="text-left">{item.name}</span>
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => toggleSubmenu(item.id)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-all duration-200 border-l-4 ${
                                  expandedSubmenus[item.id]
                                    ? "bg-[#E8EFFF] text-gray-900 border-[#1E63F7] font-bold"
                                    : "text-gray-700 hover:bg-gray-200 hover:text-gray-900 border-transparent hover:border-[#1E63F7] font-semibold"
                                }`}
                              >
                                <div className="flex items-center space-x-2">
                                  <span className={expandedSubmenus[item.id] ? "text-[#1E63F7]" : "text-gray-500"}>{getIcon(item.icon)}</span>
                                  <span className={`text-xs font-semibold whitespace-nowrap ${expandedSubmenus[item.id] ? "text-gray-900" : "text-gray-800"}`}>{item.name}</span>
                                </div>
                                <svg
                                  className={`w-3.5 h-3.5 text-gray-400 transition-all duration-200 ${
                                    expandedSubmenus[item.id] ? "rotate-180 text-gray-600" : ""
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
                                  {item.subItems.map((subItem) => (
                                    <button
                                      key={subItem.id}
                                      onClick={() => handleSubmenuClick(subItem.id)}
                                      className={`w-full flex items-center space-x-2 pl-2 pr-3 py-1.5 rounded-md transition-all duration-200 text-xs border-l-4 ${
                                        selectedItem === subItem.id
                                          ? "bg-gray-300 text-gray-900 border-[#1E63F7] font-bold"
                                          : "text-gray-600 hover:bg-gray-200 hover:text-gray-900 border-transparent hover:border-[#1E63F7] font-medium"
                                      }`}
                                    >
                                      <span className={`flex-shrink-0 ${selectedItem === subItem.id ? "text-gray-900" : "text-gray-400"}`}>{getIcon(subItem.icon)}</span>
                                      <span className="text-left whitespace-nowrap">{subItem.name}</span>
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

                {/* Submenú de Sistemas */}
                {module.id === "sistemas" && expandedModules[module.id] && (
                  <div className="mt-1 ml-2 space-y-0.5 bg-gray-100 rounded-lg py-1.5 border border-gray-100">
                    <div className="space-y-0.5">
                      {sistemasSubmenu.map((item) => (
                        <div key={item.id}>
                          {!item.hasSubmenu ? (
                            <button
                              onClick={() => handleSubmenuClick(item.id, module.id)}
                              className="w-full flex items-center space-x-2 pl-2 pr-3 py-2 rounded-md text-gray-700 hover:bg-[#E8EFFF] hover:text-[#0B327B] transition-all duration-200 text-xs font-medium border-l-4 border-transparent hover:border-[#1E63F7]"
                            >
                              <span className="text-gray-500 group-hover:text-white flex-shrink-0">{getIcon(item.icon)}</span>
                              <span className="text-left">{item.name}</span>
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => toggleSubmenu(item.id)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-all duration-200 border-l-4 ${
                                  expandedSubmenus[item.id]
                                    ? "bg-[#E8EFFF] text-gray-900 border-[#1E63F7] font-bold"
                                    : "text-gray-700 hover:bg-gray-200 hover:text-gray-900 border-transparent hover:border-[#1E63F7] font-semibold"
                                }`}
                              >
                                <div className="flex items-center space-x-2">
                                  <span className={expandedSubmenus[item.id] ? "text-[#1E63F7]" : "text-gray-500"}>{getIcon(item.icon)}</span>
                                  <span className={`text-xs font-semibold whitespace-nowrap ${expandedSubmenus[item.id] ? "text-gray-900" : "text-gray-800"}`}>{item.name}</span>
                                </div>
                                <svg
                                  className={`w-3.5 h-3.5 text-gray-400 transition-all duration-200 ${
                                    expandedSubmenus[item.id] ? "rotate-180 text-gray-600" : ""
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
                                  {item.subItems.map((subItem) => (
                                    <button
                                      key={subItem.id}
                                      onClick={() => handleSubmenuClick(subItem.id)}
                                      className={`w-full flex items-center space-x-2 pl-2 pr-3 py-1.5 rounded-md transition-all duration-200 text-xs border-l-4 ${
                                        selectedItem === subItem.id
                                          ? "bg-gray-300 text-gray-900 border-[#1E63F7] font-bold"
                                          : "text-gray-600 hover:bg-gray-200 hover:text-gray-900 border-transparent hover:border-[#1E63F7] font-medium"
                                      }`}
                                    >
                                      <span className={`flex-shrink-0 ${selectedItem === subItem.id ? "text-gray-900" : "text-gray-400"}`}>{getIcon(subItem.icon)}</span>
                                      <span className="text-left whitespace-nowrap">{subItem.name}</span>
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

                {/* Submenú de Recursos Humanos */}
                {module.id === "recursos-humanos" && expandedModules[module.id] && (
                  <div className="mt-1 ml-2 space-y-0.5 bg-gray-100 rounded-lg py-1.5 border border-gray-100">
                    <div className="space-y-0.5">
                      {recursosHumanosSubmenu.map((item) => (
                        <div key={item.id}>
                          {!item.hasSubmenu ? (
                            <button
                              onClick={() => handleSubmenuClick(item.id, module.id)}
                              className="w-full flex items-center space-x-2 pl-2 pr-3 py-2 rounded-md text-gray-700 hover:bg-[#E8EFFF] hover:text-[#0B327B] transition-all duration-200 text-xs font-medium border-l-4 border-transparent hover:border-[#1E63F7]"
                            >
                              <span className="text-gray-500 group-hover:text-white flex-shrink-0">{getIcon(item.icon)}</span>
                              <span className="text-left">{item.name}</span>
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => toggleSubmenu(item.id)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-all duration-200 border-l-4 ${
                                  expandedSubmenus[item.id]
                                    ? "bg-[#E8EFFF] text-gray-900 border-[#1E63F7] font-bold"
                                    : "text-gray-700 hover:bg-gray-200 hover:text-gray-900 border-transparent hover:border-[#1E63F7] font-semibold"
                                }`}
                              >
                                <div className="flex items-center space-x-2">
                                  <span className={expandedSubmenus[item.id] ? "text-[#1E63F7]" : "text-gray-500"}>{getIcon(item.icon)}</span>
                                  <span className={`text-xs font-semibold whitespace-nowrap ${expandedSubmenus[item.id] ? "text-gray-900" : "text-gray-800"}`}>{item.name}</span>
                                </div>
                                <svg
                                  className={`w-3.5 h-3.5 text-gray-400 transition-all duration-200 ${
                                    expandedSubmenus[item.id] ? "rotate-180 text-gray-600" : ""
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
                                  {item.subItems.map((subItem) => (
                                    <button
                                      key={subItem.id}
                                      onClick={() => handleSubmenuClick(subItem.id)}
                                      className={`w-full flex items-center space-x-2 pl-2 pr-3 py-1.5 rounded-md transition-all duration-200 text-xs border-l-4 ${
                                        selectedItem === subItem.id
                                          ? "bg-gray-300 text-gray-900 border-[#1E63F7] font-bold"
                                          : "text-gray-600 hover:bg-gray-200 hover:text-gray-900 border-transparent hover:border-[#1E63F7] font-medium"
                                      }`}
                                    >
                                      <span className={`flex-shrink-0 ${selectedItem === subItem.id ? "text-gray-900" : "text-gray-400"}`}>{getIcon(subItem.icon)}</span>
                                      <span className="text-left whitespace-nowrap">{subItem.name}</span>
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

                {/* Submenú de Facturación */}
                {module.id === "facturacion" && expandedModules[module.id] && (
                  <div className="mt-1 ml-2 space-y-0.5 bg-gray-100 rounded-lg py-1.5 border border-gray-100">
                    <div className="space-y-0.5">
                      {facturacionSubmenu.map((item) => (
                        <div key={item.id}>
                          {!item.hasSubmenu ? (
                            <button
                              onClick={() => handleSubmenuClick(item.id, module.id)}
                              className="w-full flex items-center space-x-2 pl-2 pr-3 py-2 rounded-md text-gray-700 hover:bg-[#E8EFFF] hover:text-[#0B327B] transition-all duration-200 text-xs font-medium border-l-4 border-transparent hover:border-[#1E63F7]"
                            >
                              <span className="text-gray-500 group-hover:text-white flex-shrink-0">{getIcon(item.icon)}</span>
                              <span className="text-left">{item.name}</span>
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => toggleSubmenu(item.id)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-all duration-200 border-l-4 ${
                                  expandedSubmenus[item.id]
                                    ? "bg-[#E8EFFF] text-gray-900 border-[#1E63F7] font-bold"
                                    : "text-gray-700 hover:bg-gray-200 hover:text-gray-900 border-transparent hover:border-[#1E63F7] font-semibold"
                                }`}
                              >
                                <div className="flex items-center space-x-2">
                                  <span className={expandedSubmenus[item.id] ? "text-[#1E63F7]" : "text-gray-500"}>{getIcon(item.icon)}</span>
                                  <span className={`text-xs font-semibold whitespace-nowrap ${expandedSubmenus[item.id] ? "text-gray-900" : "text-gray-800"}`}>{item.name}</span>
                                </div>
                                <svg
                                  className={`w-3.5 h-3.5 text-gray-400 transition-all duration-200 ${
                                    expandedSubmenus[item.id] ? "rotate-180 text-gray-600" : ""
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
                                  {item.subItems.map((subItem) => (
                                    <button
                                      key={subItem.id}
                                      onClick={() => handleSubmenuClick(subItem.id)}
                                      className={`w-full flex items-center space-x-2 pl-2 pr-3 py-1.5 rounded-md transition-all duration-200 text-xs border-l-4 ${
                                        selectedItem === subItem.id
                                          ? "bg-gray-300 text-gray-900 border-[#1E63F7] font-bold"
                                          : "text-gray-600 hover:bg-gray-200 hover:text-gray-900 border-transparent hover:border-[#1E63F7] font-medium"
                                      }`}
                                    >
                                      <span className={`flex-shrink-0 ${selectedItem === subItem.id ? "text-gray-900" : "text-gray-400"}`}>{getIcon(subItem.icon)}</span>
                                      <span className="text-left whitespace-nowrap">{subItem.name}</span>
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

                {/* Submenú de Permisos/Solicitudes e Incidencias */}
                {module.id === "permisos" && expandedModules[module.id] && (
                  <div className="mt-1 ml-2 space-y-0.5 bg-gray-100 rounded-lg py-1.5 border border-gray-100">
                    <div className="space-y-0.5">
                      {permisosSubmenu.map((item) => (
                        <div key={item.id}>
                          {!item.hasSubmenu ? (
                            <button
                              onClick={() => handleSubmenuClick(item.id, module.id)}
                              className="w-full flex items-center space-x-2 pl-2 pr-3 py-2 rounded-md text-gray-700 hover:bg-[#E8EFFF] hover:text-[#0B327B] transition-all duration-200 text-xs font-medium border-l-4 border-transparent hover:border-[#1E63F7]"
                            >
                              <span className="text-gray-500 group-hover:text-white flex-shrink-0">{getIcon(item.icon)}</span>
                              <span className="text-left">{item.name}</span>
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => toggleSubmenu(item.id)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-all duration-200 border-l-4 ${
                                  expandedSubmenus[item.id]
                                    ? "bg-[#E8EFFF] text-gray-900 border-[#1E63F7] font-bold"
                                    : "text-gray-700 hover:bg-gray-200 hover:text-gray-900 border-transparent hover:border-[#1E63F7] font-semibold"
                                }`}
                              >
                                <div className="flex items-center space-x-2">
                                  <span className={expandedSubmenus[item.id] ? "text-[#1E63F7]" : "text-gray-500"}>{getIcon(item.icon)}</span>
                                  <span className={`text-xs font-semibold whitespace-nowrap ${expandedSubmenus[item.id] ? "text-gray-900" : "text-gray-800"}`}>{item.name}</span>
                                </div>
                                <svg
                                  className={`w-3.5 h-3.5 text-gray-400 transition-all duration-200 ${
                                    expandedSubmenus[item.id] ? "rotate-180 text-gray-600" : ""
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
                                  {item.subItems.map((subItem) => (
                                    <button
                                      key={subItem.id}
                                      onClick={() => handleSubmenuClick(subItem.id)}
                                      className={`w-full flex items-center space-x-2 pl-2 pr-3 py-1.5 rounded-md transition-all duration-200 text-xs border-l-4 ${
                                        selectedItem === subItem.id
                                          ? "bg-gray-300 text-gray-900 border-[#1E63F7] font-bold"
                                          : "text-gray-600 hover:bg-gray-200 hover:text-gray-900 border-transparent hover:border-[#1E63F7] font-medium"
                                      }`}
                                    >
                                      <span className={`flex-shrink-0 ${selectedItem === subItem.id ? "text-gray-900" : "text-gray-400"}`}>{getIcon(subItem.icon)}</span>
                                      <span className="text-left whitespace-nowrap">{subItem.name}</span>
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
            className="w-full flex items-center space-x-2 px-2.5 py-3.5 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] rounded-xl flex items-center justify-center text-white shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-bold text-gray-900 truncate">
                {user?.name || user?.email || "Usuario"}
              </p>
              <p className="text-[10px] text-gray-600 font-semibold">Administrador</p>
            </div>
          </button>
          <button
            onClick={handleLogout}
            className="w-full bg-[#1E63F7] hover:bg-[#1E63F7] text-white font-semibold py-3 px-3 rounded-lg flex items-center justify-center space-x-1.5 shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] text-xs"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}
