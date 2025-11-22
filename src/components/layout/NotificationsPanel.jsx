"use client";

import { useState, useEffect, useRef } from "react";

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
    status: "Disponible",
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
  },
  {
    id: 5,
    category: "LOGÍSTICA",
    title: "Envío Programado",
    description: "El envío #ENV-2024-045 ha sido programado para mañana",
    user: "CARLOS RODRÍGUEZ",
    notificationId: "528",
    time: "Hace 3 horas",
    unread: false,
    type: "warning",
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
  },
];

const categoryColors = {
  "IMPORTACIÓN": "bg-gradient-to-r from-yellow-500 to-amber-500",
  "INCIDENCIA DE PROFORMAS": "bg-gradient-to-r from-yellow-600 to-amber-600",
  "VENTAS": "bg-gradient-to-r from-yellow-500 to-amber-500",
  "LOGÍSTICA": "bg-gradient-to-r from-yellow-500 to-amber-500",
  "ADMINISTRACIÓN": "bg-gradient-to-r from-yellow-500 to-amber-500",
  "SISTEMAS": "bg-gradient-to-r from-yellow-500 to-amber-500",
  "RECURSOS HUMANOS": "bg-gradient-to-r from-yellow-500 to-amber-500",
};

export function NotificationsPanel({ isOpen, onClose, notificationCount }) {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [isRefreshing, setIsRefreshing] = useState(false);
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
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, unread: false } : notif
      )
    );
  };

  const handleOpenDetails = (id) => {
    console.log("Abrir detalles de notificación:", id);
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay sutil - solo para cerrar al hacer click fuera */}
      <div
        className="fixed inset-0 bg-black/10 z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Panel principal - posicionado debajo del botón de notificaciones */}
      <div
        ref={panelRef}
        className="fixed top-20 right-[140px] w-[440px] max-h-[calc(100vh-6rem)] bg-white rounded-3xl shadow-2xl z-50 border border-gray-200 overflow-hidden flex flex-col"
        style={{
          boxShadow: "0 20px 60px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)",
        }}
      >
        {/* Header mejorado con gradiente amarillo */}
        <div className="relative bg-gradient-to-br from-yellow-500 via-amber-500 to-yellow-600 px-6 py-5 flex items-center justify-between overflow-hidden">
          {/* Patrón de fondo sutil */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-300 rounded-full blur-2xl"></div>
          </div>
          
          <div className="relative flex items-center space-x-4 flex-1">
            {/* Icono de campana mejorado */}
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md border border-white/30 shadow-lg">
              <svg
                className="w-6 h-6 text-white"
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
              <h2 className="text-white font-bold text-xl tracking-tight mb-0.5">
                Notificaciones
              </h2>
              {unreadCount > 0 && (
                <p className="text-white/90 text-sm font-medium">
                  {unreadCount} sin leer
                </p>
              )}
            </div>
          </div>
          
          {/* Botón de refresh mejorado */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="relative p-2.5 rounded-xl hover:bg-white/20 transition-all duration-200 active:scale-95 disabled:opacity-50 backdrop-blur-sm border border-white/20"
            aria-label="Actualizar"
          >
            <svg
              className={`w-5 h-5 text-white transition-transform duration-500 ${
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

        {/* Lista de notificaciones mejorada */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="p-5 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl mb-5 shadow-inner">
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
                Te notificaremos cuando haya novedades
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100/80">
              {notifications.map((notification, index) => (
                <div
                  key={notification.id}
                  className={`relative group transition-all duration-300 ${
                    notification.unread 
                      ? "bg-gradient-to-r from-yellow-50/80 via-amber-50/40 to-transparent hover:from-yellow-50 hover:via-amber-50/60" 
                      : "hover:bg-gray-50/80"
                  }`}
                  style={{
                    animationDelay: `${index * 30}ms`,
                  }}
                >
                  {/* Indicador de no leída mejorado */}
                  {notification.unread && (
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-yellow-500 via-amber-500 to-yellow-600 shadow-lg" />
                  )}

                  <div className="px-6 py-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Tag de categoría mejorado */}
                        <div className="flex items-center gap-2.5 mb-3">
                          <span
                            className={`px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-md ${
                              categoryColors[notification.category] ||
                              "bg-gradient-to-r from-gray-500 to-gray-600"
                            }`}
                          >
                            {notification.category}
                          </span>
                          {notification.unread && (
                            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50" />
                          )}
                        </div>

                        {/* Título mejorado */}
                        <h3 className="font-bold text-gray-900 text-[15px] mb-2 leading-snug line-clamp-1">
                          {notification.title}
                        </h3>

                        {/* Descripción mejorada */}
                        <p className="text-gray-600 text-sm mb-3 leading-relaxed line-clamp-2">
                          {notification.description}
                        </p>

                        {/* Meta información mejorada */}
                        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                          <span className="font-semibold text-gray-700">{notification.user}</span>
                          <span className="text-gray-300">•</span>
                          <span className="font-mono">ID: {notification.notificationId}</span>
                          <span className="text-gray-300">•</span>
                          <span>{notification.time}</span>
                        </div>

                        {/* Badge de estado mejorado */}
                        {notification.status && (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200/60 rounded-lg shadow-sm">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full shadow-sm shadow-emerald-500/50" />
                            <span className="text-emerald-700 text-xs font-semibold">
                              {notification.status}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Botones de acción mejorados */}
                      <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 pt-1">
                        <button
                          onClick={() => handleOpenDetails(notification.id)}
                          className="p-2.5 rounded-xl bg-yellow-50 hover:bg-yellow-100 text-yellow-600 transition-all duration-200 active:scale-95 shadow-sm border border-yellow-100"
                          aria-label="Ver detalles"
                          title="Ver detalles"
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
                            className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all duration-200 active:scale-95 shadow-sm border border-gray-200"
                            aria-label="Marcar como leído"
                            title="Marcar como leído"
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
              ))}
            </div>
          )}
        </div>

        {/* Footer mejorado */}
        {notifications.length > 0 && (
          <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-t border-gray-100/80">
            <button className="w-full text-center text-sm font-semibold text-yellow-600 hover:text-yellow-700 transition-colors duration-200 py-2 rounded-lg hover:bg-yellow-50/50">
              Ver todas las notificaciones
            </button>
          </div>
        )}
      </div>
    </>
  );
}
