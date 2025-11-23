"use client";

import { useState, useEffect, useRef } from "react";

// Componente de Dropdown personalizado
function CustomDropdown({ value, onChange, options }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-sm px-4 py-2.5 pr-3 rounded-xl border-2 border-gray-200/60 bg-white/80 backdrop-blur-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-700/30 focus:border-blue-700 transition-all duration-200 hover:border-gray-300/60 cursor-pointer shadow-sm hover:shadow-md whitespace-nowrap"
      >
        <span className="flex-1 text-left">{selectedOption.label}</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white/90 backdrop-blur-md rounded-xl border-2 border-gray-200/60 shadow-xl z-50 overflow-hidden">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-3 text-sm font-medium transition-all duration-200 ${
                value === option.value
                  ? "bg-blue-100/60 text-blue-900 border-l-4 border-blue-700"
                  : "text-gray-700 hover:bg-gray-50/60"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const mockNotifications = [
  {
    id: 1,
    category: "IMPORTACIÓN",
    title: "Nueva Importación Registrada",
    description: "Se registró una nueva importación: ZEUS50",
    user: "HERVIN",
    notificationId: "538",
    time: "Hace 5 minutos",
    unread: true,
    type: "success",
    priority: "alta",
  },
  {
    id: 2,
    category: "INCIDENCIA DE PROFORMAS",
    title: "Estado de Verificación Actualizado",
    description: "El estado de ACTA 649 se actualizó a: COMPLETADO",
    user: "HERVIN",
    notificationId: "531",
    time: "Hace 12 minutos",
    unread: true,
    type: "info",
    priority: "normal",
  },
  {
    id: 3,
    category: "INCIDENCIA DE PROFORMAS",
    title: "Estado de Culminación Actualizado",
    description: "El estado de ACTA 649 se actualizó a: Si",
    user: "HERVIN",
    notificationId: "530",
    time: "Hace 1 hora",
    unread: true,
    type: "info",
    priority: "normal",
  },
  {
    id: 4,
    category: "VENTAS",
    title: "Nueva Orden de Compra",
    description: "Se generó una nueva orden de compra #OC-2024-001",
    user: "MARÍA GONZÁLEZ",
    notificationId: "529",
    time: "Hace 2 horas",
    unread: true,
    type: "success",
    priority: "alta",
  },
  {
    id: 5,
    category: "LOGÍSTICA",
    title: "Envío Programado",
    description: "El envío #ENV-2024-045 ha sido programado para mañana",
    user: "CARLOS RODRÍGUEZ",
    notificationId: "528",
    time: "Hace 3 horas",
    unread: true,
    type: "warning",
    priority: "baja",
  },
  {
    id: 6,
    category: "ADMINISTRACIÓN",
    title: "Documento Aprobado",
    description: "El documento DOC-2024-123 ha sido aprobado",
    user: "ANA MARTÍNEZ",
    notificationId: "527",
    time: "Hace 5 horas",
    unread: false,
    type: "success",
    priority: "normal",
  },
  {
    id: 7,
    category: "SISTEMAS",
    title: "Mantenimiento Programado",
    description: "Se programó mantenimiento del sistema para el próximo viernes",
    user: "SISTEMA",
    notificationId: "526",
    time: "Ayer",
    unread: true,
    type: "warning",
    priority: "alta",
  },
  {
    id: 8,
    category: "RECURSOS HUMANOS",
    title: "Nueva Solicitud de Permiso",
    description: "Nueva solicitud de permiso pendiente de revisión",
    user: "JUAN PÉREZ",
    notificationId: "525",
    time: "Ayer",
    unread: true,
    type: "info",
    priority: "normal",
  },
];

const categoryColors = {
  "IMPORTACIÓN": "bg-blue-700/20 backdrop-blur-sm border-2 border-blue-600/30",
  "INCIDENCIA DE PROFORMAS": "bg-blue-700/20 backdrop-blur-sm border-2 border-blue-600/30",
  "VENTAS": "bg-blue-700/20 backdrop-blur-sm border-2 border-blue-600/30",
  "LOGÍSTICA": "bg-blue-700/20 backdrop-blur-sm border-2 border-blue-600/30",
  "ADMINISTRACIÓN": "bg-blue-700/20 backdrop-blur-sm border-2 border-blue-600/30",
  "SISTEMAS": "bg-blue-700/20 backdrop-blur-sm border-2 border-blue-600/30",
  "RECURSOS HUMANOS": "bg-blue-700/20 backdrop-blur-sm border-2 border-blue-600/30",
};

// Colores y significados de prioridad
const priorityConfig = {
  alta: {
    color: "bg-red-500",
    text: "Alta",
    badge: "bg-red-500/20 backdrop-blur-sm border-2 border-red-400/40 text-red-700",
    icon: (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
  },
  normal: {
    color: "bg-orange-500",
    text: "Media",
    badge: "bg-orange-500/20 backdrop-blur-sm border-2 border-orange-400/40 text-orange-700",
    icon: (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
  },
  baja: {
    color: "bg-yellow-400",
    text: "Baja",
    badge: "bg-yellow-400/20 backdrop-blur-sm border-2 border-yellow-400/40 text-yellow-700",
    icon: (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
  },
};

export function NotificationsPanel({ isOpen, onClose, notificationCount }) {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mutedCategories, setMutedCategories] = useState([]);
  const [groupBy, setGroupBy] = useState("category"); // "category" | "priority" | "none"
  const [recentlyMarked, setRecentlyMarked] = useState(new Set());
  const panelRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const handleMarkAsRead = (id) => {
    // Marcar como leída primero
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, unread: false } : notif
      )
    );
    
    // Agregar a recientemente marcadas para mostrar indicador verde
    setRecentlyMarked((prev) => new Set([...prev, id]));
    
    // Después de 2 segundos, eliminar de la lista principal
    setTimeout(() => {
      setNotifications((prev) => prev.filter((notif) => notif.id !== id));
      setRecentlyMarked((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }, 2000);
  };

  const handleOpenDetails = (id) => {
    console.log("Abrir detalles de notificación:", id);
  };

  const toggleMuteCategory = (category) => {
    setMutedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  // Filtrar notificaciones según categorías silenciadas
  const filteredNotifications = notifications.filter(
    (notif) => !mutedCategories.includes(notif.category)
  );

  // Agrupar notificaciones
  const groupedNotifications = () => {
    if (groupBy === "none") {
      return { "Todas": filteredNotifications };
    }

    const groups = {};
    filteredNotifications.forEach((notif) => {
      const key =
        groupBy === "category"
          ? notif.category
          : notif.priority || "normal";
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(notif);
    });

    // Ordenar grupos: por prioridad (alta, normal, baja) o alfabéticamente
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (groupBy === "priority") {
        const order = { alta: 0, normal: 1, baja: 2 };
        return (order[a] ?? 3) - (order[b] ?? 3);
      }
      return a.localeCompare(b);
    });

    const sortedGroups = {};
    sortedKeys.forEach((key) => {
      sortedGroups[key] = groups[key];
    });

    return sortedGroups;
  };

  const unreadCount = filteredNotifications.filter((n) => n.unread).length;
  const groups = groupedNotifications();

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay sutil */}
      <div
        className="fixed inset-0 bg-black/10 z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Panel principal */}
      <div
        ref={panelRef}
        className="fixed top-22 right-[200px] w-[440px] max-h-[500px] bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl z-50 border border-gray-200/60 overflow-hidden flex flex-col"
        style={{
          boxShadow: "0 20px 60px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)",
        }}
      >
        {/* Header */}
        <div className="relative bg-blue-700/20 backdrop-blur-md border-b-2 border-blue-600/30 px-6 py-7 flex items-center justify-between overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-300 rounded-full blur-2xl"></div>
          </div>
          
          <div className="relative flex items-center space-x-4 flex-1">
            <div className="p-2.5 bg-blue-700/15 backdrop-blur-sm border-2 border-blue-600/30 rounded-xl shadow-sm">
              <svg
                className="w-5 h-5 text-blue-800"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </div>
            
            <div className="flex-1">
              <h2 className="text-gray-900 font-bold text-lg tracking-tight mb-0.5">
                Notificaciones
              </h2>
              {unreadCount > 0 && (
                <p className="text-gray-700 text-xs font-medium">
                  {unreadCount} sin leer
                </p>
              )}
            </div>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="relative p-2.5 bg-blue-700/15 backdrop-blur-sm border-2 border-blue-600/30 rounded-xl hover:bg-blue-700/25 hover:border-blue-700/50 transition-all duration-200 active:scale-95 disabled:opacity-50 shadow-sm"
            aria-label="Actualizar"
          >
            <svg
              className={`w-4.5 h-4.5 text-blue-800 transition-transform duration-500 ${
                isRefreshing ? "animate-spin" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>

        {/* Filtros y controles mejorados */}
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 via-blue-50/30 to-gray-50 border-b border-gray-200/60 flex items-center justify-between gap-3 flex-nowrap">
          <div className="flex items-center gap-3 flex-nowrap flex-shrink-0">
            <div className="flex items-center gap-2 flex-shrink-0">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">Agrupar:</span>
            </div>
            <div className="flex-shrink-0 min-w-[160px]">
              <CustomDropdown
                value={groupBy}
                onChange={setGroupBy}
                options={[
                  { value: "none", label: "Sin agrupar" },
                  { value: "category", label: "Por categoría" },
                  { value: "priority", label: "Por prioridad" },
                ]}
              />
            </div>
          </div>
          {mutedCategories.length > 0 && (
            <button
              onClick={() => setMutedCategories([])}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-50/60 backdrop-blur-sm border border-red-200/60 rounded-xl flex-shrink-0 whitespace-nowrap hover:bg-red-100/60 hover:border-red-300/60 transition-all duration-200"
              title="Activar todas las categorías"
            >
              <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
              <span className="text-xs font-semibold text-red-700">{mutedCategories.length} silenciadas</span>
              <svg className="w-3 h-3 text-red-500 hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Lista de notificaciones */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white/50 backdrop-blur-sm">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="p-5 bg-gray-100/60 backdrop-blur-sm border-2 border-gray-200/40 rounded-2xl mb-5">
                <svg
                  className="w-10 h-10 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </div>
              <p className="text-gray-600 font-semibold text-base">No hay notificaciones</p>
              <p className="text-gray-400 text-sm mt-2 text-center max-w-xs">
                {mutedCategories.length > 0
                  ? "Algunas categorías están silenciadas"
                  : "Te notificaremos cuando haya novedades"}
              </p>
            </div>
          ) : (
            <div>
              {Object.entries(groups).map(([groupName, groupNotifications], groupIndex) => (
                <div key={groupName}>
                  {/* Encabezado de grupo */}
                  {groupBy !== "none" && (
                    <div className="px-6 py-1.5 bg-gray-50/60 backdrop-blur-sm border-b border-gray-100/60 sticky top-0 z-10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="text-[10px] font-bold text-gray-700 uppercase tracking-wide">
                            {groupName}
                          </h3>
                          <span className="text-[10px] text-gray-500">
                            ({groupNotifications.length})
                          </span>
                        </div>
                        {groupBy === "category" && (
                          <button
                            onClick={() => toggleMuteCategory(groupName)}
                            className="p-1 rounded hover:bg-gray-200/60 transition-colors"
                            title={mutedCategories.includes(groupName) ? "Activar" : "Silenciar"}
                          >
                            <svg
                              className={`w-4 h-4 ${
                                mutedCategories.includes(groupName)
                                  ? "text-red-500"
                                  : "text-gray-400"
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              {mutedCategories.includes(groupName) ? (
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                                />
                              ) : (
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                                />
                              )}
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Notificaciones del grupo */}
                  <div>
                    {groupNotifications.map((notification, index) => {
                      const priority = priorityConfig[notification.priority || "normal"];
                      return (
                        <div
                          key={notification.id}
                          className={`relative group transition-all duration-300 ${
                            notification.unread 
                              ? (() => {
                                  const priority = notification.priority || "normal";
                                  if (priority === "alta") {
                                    return "bg-red-50/60 backdrop-blur-sm hover:bg-red-100/70 border-l-4 border-red-500/70";
                                  } else if (priority === "normal") {
                                    return "bg-orange-50/60 backdrop-blur-sm hover:bg-orange-100/70 border-l-4 border-orange-500/70";
                                  } else {
                                    return "bg-yellow-50/60 backdrop-blur-sm hover:bg-yellow-100/70 border-l-4 border-yellow-500/70";
                                  }
                                })()
                              : "bg-green-50/60 backdrop-blur-sm hover:bg-green-100/70 border-l-4 border-green-500/70"
                          }`}
                        >

                          <div className="px-6 py-5">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                {/* Tags de categoría y prioridad */}
                                <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                                  <span
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold text-blue-800 shadow-sm ${
                                      categoryColors[notification.category] ||
                                      "bg-gray-500/20 backdrop-blur-sm border-2 border-gray-400/30"
                                    }`}
                                  >
                                    {notification.category}
                                  </span>
                                  <span
                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1.5 ${priority.badge}`}
                                  >
                                    {priority.icon}
                                    {priority.text}
                                  </span>
                                  {notification.unread && (
                                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50" />
                                  )}
                                </div>

                                <h3 className="font-bold text-gray-900 text-[15px] mb-2 leading-snug line-clamp-1">
                                  {notification.title}
                                </h3>

                                <p className="text-gray-600 text-sm mb-3 leading-relaxed line-clamp-2">
                                  {notification.description}
                                </p>

                                <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                                  <span className="font-semibold text-gray-700">{notification.user}</span>
                                  <span className="text-gray-300">•</span>
                                  <span className="font-mono">ID: {notification.notificationId}</span>
                                  <span className="text-gray-300">•</span>
                                  <span>{notification.time}</span>
                                </div>
                              </div>

                              <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 pt-1">
                                <button
                                  onClick={() => handleOpenDetails(notification.id)}
                                  className="p-2.5 rounded-xl bg-blue-100/60 backdrop-blur-sm hover:bg-blue-200/60 text-blue-800 transition-all duration-200 active:scale-95 shadow-sm border border-blue-200/60"
                                  aria-label="Ver detalles"
                                >
                                  <svg
                                    className="w-4.5 h-4.5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2.5}
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                    />
                                  </svg>
                                </button>
                                {notification.unread && (
                                  <button
                                    onClick={() => handleMarkAsRead(notification.id)}
                                    className="p-2.5 rounded-xl bg-gray-100/60 backdrop-blur-sm hover:bg-gray-200/60 text-gray-700 transition-all duration-200 active:scale-95 shadow-sm border border-gray-200/60"
                                    aria-label="Marcar como leído"
                                  >
                                    <svg
                                      className="w-4.5 h-4.5"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                      strokeWidth={2.5}
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {filteredNotifications.length > 0 && (
          <div className="px-6 py-4 bg-gray-50/40 backdrop-blur-sm border-t border-gray-100/60">
            <button className="w-full text-center text-sm font-semibold text-blue-800 hover:text-blue-900 transition-colors duration-200 py-2 rounded-lg hover:bg-blue-100/40">
              Ver todas las notificaciones
            </button>
          </div>
        )}
      </div>
    </>
  );
}
