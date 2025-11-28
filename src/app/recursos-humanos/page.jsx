"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../components/context/AuthContext";
import { Header } from "../../components/layout/Header";
import { Sidebar } from "../../components/layout/Sidebar";

export default function RecursosHumanosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("gestion-colaboradores");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Detectar si es desktop y abrir sidebar automáticamente
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    // Establecer estado inicial
    handleResize();

    // Escuchar cambios de tamaño
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Leer el parámetro de consulta "section" de la URL
    const section = searchParams.get("section");
    if (section) {
      // Validar que la sección existe en las secciones disponibles
      const validSections = [
        "gestion-colaboradores",
        "control-asistencia",
        "gestion-permisos",
        "gestion-vacaciones",
        "control-documentos",
        "gestion-remuneraciones",
        "auto-servicio",
      ];
      if (validSections.includes(section)) {
        setActiveSection(section);
      }
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Datos de ejemplo para Gestión de Colaboradores
  const colaboradores = [
    { id: 1, nombre: "HERVIN", apellido: "CORONEL", area: "Administracion", correo: "permisos.zeus@gmail.com", fechaCumpleanos: "03/07/1991", activo: true },
    { id: 2, nombre: "MARIA", apellido: "GONZALEZ", area: "Ventas", correo: "maria.gonzalez@zeus.com", fechaCumpleanos: "15/03/1988", activo: true },
    { id: 3, nombre: "JUAN", apellido: "PEREZ", area: "Logistica", correo: "juan.perez@zeus.com", fechaCumpleanos: "22/11/1990", activo: true },
    { id: 4, nombre: "ANA", apellido: "LOPEZ", area: "Marketing", correo: "ana.lopez@zeus.com", fechaCumpleanos: "08/05/1992", activo: true },
    { id: 5, nombre: "CARLOS", apellido: "RODRIGUEZ", area: "Sistemas", correo: "carlos.rodriguez@zeus.com", fechaCumpleanos: "12/09/1987", activo: true },
  ];

  const colaboradoresInactivos = [
    { id: 6, nombre: "JOSELYN", apellido: "", area: "LOGISTICA", correo: "zeussafety2024@gmail.com", fechaCumpleanos: "23/11/1995", activo: false },
  ];

  const activos = colaboradores.filter(c => c.activo);
  const inactivos = colaboradoresInactivos.filter(c => !c.activo);

  // Datos ficticios para Control de Asistencia
  const registrosAsistencia = [
    { id: 1, nombre: "HERVIN CORONEL", fecha: "24/11/2025", entrada: "08:15", salida: "17:30", estado: "Normal" },
    { id: 2, nombre: "MARIA GONZALEZ", fecha: "24/11/2025", entrada: "08:00", salida: "17:00", estado: "Normal" },
    { id: 3, nombre: "JUAN PEREZ", fecha: "24/11/2025", entrada: "08:25", salida: "17:45", estado: "Tardanza" },
    { id: 4, nombre: "ANA LOPEZ", fecha: "24/11/2025", entrada: "-", salida: "-", estado: "Falta" },
    { id: 5, nombre: "CARLOS RODRIGUEZ", fecha: "24/11/2025", entrada: "08:10", salida: "17:20", estado: "Normal" },
  ];

  const incidenciasAsistencia = [
    { id: 1, nombre: "JUAN PEREZ", tipo: "Tardanza", fecha: "24/11/2025", justificacion: "Tráfico", estado: "Pendiente" },
    { id: 2, nombre: "ANA LOPEZ", tipo: "Falta", fecha: "24/11/2025", justificacion: "Enfermedad", estado: "Aprobada" },
    { id: 3, nombre: "MARIA GONZALEZ", tipo: "Tardanza", fecha: "23/11/2025", justificacion: "Emergencia familiar", estado: "Rechazada" },
  ];

  // Datos ficticios para Gestión de Permisos
  const solicitudesPermisos = [
    { id: 1, nombre: "HERVIN CORONEL", tipo: "Médico", fecha: "25/11/2025", dias: 1, motivo: "Consulta médica", estado: "Pendiente", jefe: "GERENTE GENERAL" },
    { id: 2, nombre: "MARIA GONZALEZ", tipo: "Personal", fecha: "26/11/2025", dias: 0.5, motivo: "Trámite personal", estado: "Aprobada", jefe: "JEFE DE VENTAS" },
    { id: 3, nombre: "JUAN PEREZ", tipo: "Otras actividades", fecha: "27/11/2025", dias: 2, motivo: "Capacitación", estado: "Pendiente", jefe: "JEFE DE LOGÍSTICA" },
    { id: 4, nombre: "ANA LOPEZ", tipo: "Médico", fecha: "28/11/2025", dias: 3, motivo: "Cirugía menor", estado: "Aprobada", jefe: "JEFE DE MARKETING" },
  ];

  // Datos ficticios para Gestión de Vacaciones
  const solicitudesVacaciones = [
    { id: 1, nombre: "HERVIN CORONEL", diasAcumulados: 15, diasSolicitados: 5, fechaInicio: "01/12/2025", fechaFin: "05/12/2025", estado: "Aprobada" },
    { id: 2, nombre: "MARIA GONZALEZ", diasAcumulados: 20, diasSolicitados: 10, fechaInicio: "10/12/2025", fechaFin: "19/12/2025", estado: "Pendiente" },
    { id: 3, nombre: "JUAN PEREZ", diasAcumulados: 12, diasSolicitados: 7, fechaInicio: "15/12/2025", fechaFin: "21/12/2025", estado: "Pendiente" },
    { id: 4, nombre: "CARLOS RODRIGUEZ", diasAcumulados: 18, diasSolicitados: 3, fechaInicio: "28/11/2025", fechaFin: "30/11/2025", estado: "Aprobada" },
  ];

  // Datos ficticios para Control de Documentos Laborales
  const documentosLaborales = [
    { id: 1, nombre: "HERVIN CORONEL", tipo: "Contrato", fechaVencimiento: "15/12/2025", diasRestantes: 21, estado: "Por vencer", alerta: true },
    { id: 2, nombre: "MARIA GONZALEZ", tipo: "SCTR", fechaVencimiento: "30/11/2025", diasRestantes: 6, estado: "Por vencer", alerta: true },
    { id: 3, nombre: "JUAN PEREZ", tipo: "Vida Ley", fechaVencimiento: "20/12/2025", diasRestantes: 26, estado: "Vigente", alerta: false },
    { id: 4, nombre: "ANA LOPEZ", tipo: "Contrato", fechaVencimiento: "05/01/2026", diasRestantes: 42, estado: "Vigente", alerta: false },
    { id: 5, nombre: "CARLOS RODRIGUEZ", tipo: "SCTR", fechaVencimiento: "25/11/2025", diasRestantes: 1, estado: "Por vencer", alerta: true },
  ];

  // Datos ficticios para Gestión de Remuneraciones
  const remuneraciones = [
    { id: 1, nombre: "HERVIN CORONEL", sueldoBase: 5000, bonos: 500, ctsProyectado: 416.67, gratificaciones: 5000, total: 10916.67, mes: "Noviembre 2025" },
    { id: 2, nombre: "MARIA GONZALEZ", sueldoBase: 4500, bonos: 300, ctsProyectado: 375, gratificaciones: 4500, total: 9675, mes: "Noviembre 2025" },
    { id: 3, nombre: "JUAN PEREZ", sueldoBase: 4200, bonos: 400, ctsProyectado: 350, gratificaciones: 4200, total: 9150, mes: "Noviembre 2025" },
    { id: 4, nombre: "ANA LOPEZ", sueldoBase: 4800, bonos: 600, ctsProyectado: 400, gratificaciones: 4800, total: 10600, mes: "Noviembre 2025" },
    { id: 5, nombre: "CARLOS RODRIGUEZ", sueldoBase: 5500, bonos: 700, ctsProyectado: 458.33, gratificaciones: 5500, total: 12158.33, mes: "Noviembre 2025" },
  ];

  const sections = [
    { id: "gestion-colaboradores", name: "Gestión de Colaboradores", icon: "users" },
    { id: "control-asistencia", name: "Control de Asistencia", icon: "clock" },
    { id: "gestion-permisos", name: "Gestión de Permisos", icon: "check" },
    { id: "gestion-vacaciones", name: "Gestión de Vacaciones", icon: "calendar" },
    { id: "control-documentos", name: "Control de Documentos Laborales", icon: "document" },
    { id: "gestion-remuneraciones", name: "Gestión de Remuneraciones", icon: "money" },
    { id: "auto-servicio", name: "Auto-Servicio del Colaborador (ESS)", icon: "user" },
  ];

  const getIcon = (iconName) => {
    const icons = {
      users: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      clock: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      check: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      calendar: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      document: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      money: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      user: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    };
    return icons[iconName] || icons.users;
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case "gestion-colaboradores":
        return (
          <>
            {/* Listado de Colaboradores */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center text-white border-2 border-blue-800 shadow-sm">
                    {getIcon("users")}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Listado de Colaboradores</h2>
                    <p className="text-xs text-gray-600 mt-0.5">Gestiona los colaboradores activos del sistema</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1.5 bg-green-50 border border-green-200 rounded-lg px-2.5 py-1">
                  <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs font-semibold text-green-700">API Conectada</span>
                </div>
              </div>

              <button className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-blue-700/20 backdrop-blur-md border border-blue-700/40 hover:bg-blue-700/30 hover:border-blue-600/60 text-blue-800 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span>+ Agregar Colaborador</span>
              </button>

              <div className="bg-white rounded-xl shadow-lg border border-gray-200/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-blue-700/20 backdrop-blur-md border-b border-blue-700/40">
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">NOMBRE</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">APELLIDO</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">ÁREA</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">CORREO</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">FECHA CUMPLEAÑOS</th>
                        <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-blue-800">ACCIÓN</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {activos.map((colaborador) => (
                        <tr key={colaborador.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{colaborador.nombre}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{colaborador.apellido}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{colaborador.area}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{colaborador.correo}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{colaborador.fechaCumpleanos}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                              <button className="flex items-center space-x-1 px-2.5 py-1 bg-blue-700/20 backdrop-blur-sm border border-blue-700/40 hover:bg-blue-700/30 hover:border-blue-600/60 text-blue-800 rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span>Permisos</span>
                              </button>
                              <button className="flex items-center space-x-1 px-2.5 py-1 bg-orange-500/20 backdrop-blur-sm border border-orange-500/40 hover:bg-orange-500/30 hover:border-orange-600/60 text-orange-700 rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                <span>Desactivar</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="bg-gray-50 px-3 py-2 flex items-center justify-between border-t border-gray-200">
                  <button className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    &lt; Anterior
                  </button>
                  <span className="text-[10px] text-gray-700 font-medium">
                    Página 1 de 3 (15 registros)
                  </span>
                  <button className="px-2.5 py-1 text-[10px] font-medium bg-blue-700/20 backdrop-blur-sm border border-blue-700/40 hover:bg-blue-700/30 hover:border-blue-600/60 text-blue-800 rounded-lg transition-all duration-200 shadow-sm">
                    Siguiente &gt;
                  </button>
                </div>
              </div>
            </div>

            {/* Colaboradores Inactivos */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center text-white border-2 border-blue-800 shadow-sm">
                    {getIcon("users")}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Colaboradores Inactivos</h2>
                    <p className="text-xs text-gray-600 mt-0.5">Sin acceso al sistema</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1.5 bg-green-50 border border-green-200 rounded-lg px-2.5 py-1">
                  <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs font-semibold text-green-700">API Conectada</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-blue-700/20 backdrop-blur-md border-b border-blue-700/40">
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">NOMBRE</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">APELLIDO</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">ÁREA</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">CORREO</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">FECHA CUMPLEAÑOS</th>
                        <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-blue-800">ACCIÓN</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {inactivos.map((colaborador) => (
                        <tr key={colaborador.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{colaborador.nombre}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{colaborador.apellido}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{colaborador.area}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{colaborador.correo}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{colaborador.fechaCumpleanos}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                              <button className="flex items-center space-x-1 px-2.5 py-1 bg-blue-700/20 backdrop-blur-sm border border-blue-700/40 hover:bg-blue-700/30 hover:border-blue-600/60 text-blue-800 rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span>Permisos</span>
                              </button>
                              <button className="flex items-center space-x-1 px-2.5 py-1 bg-green-600/20 backdrop-blur-sm border border-green-600/40 hover:bg-green-600/30 hover:border-green-700/60 text-green-700 rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Activar</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="bg-gray-50 px-3 py-2 flex items-center justify-between border-t border-gray-200">
                  <button className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    &lt; Anterior
                  </button>
                  <span className="text-[10px] text-gray-700 font-medium">
                    Página 1 de 1 (1 registros)
                  </span>
                  <button className="px-2.5 py-1 text-[10px] font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    Siguiente &gt;
                  </button>
                </div>
              </div>
            </div>
          </>
        );
      case "control-asistencia":
        return (
          <>
            {/* Registro de Asistencia */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center text-white border-2 border-blue-800 shadow-sm">
                    {getIcon("clock")}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Registro Diario de Entrada y Salida</h2>
                    <p className="text-xs text-gray-600 mt-0.5">Control de asistencia del día</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1.5 bg-green-50 border border-green-200 rounded-lg px-2.5 py-1">
                  <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs font-semibold text-green-700">API Conectada</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-blue-700/20 backdrop-blur-md border-b border-blue-700/40">
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">NOMBRE</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">FECHA</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">ENTRADA</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">SALIDA</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">ESTADO</th>
                        <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-blue-800">ACCIÓN</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {registrosAsistencia.map((registro) => (
                        <tr key={registro.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{registro.nombre}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{registro.fecha}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{registro.entrada}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{registro.salida}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              registro.estado === "Normal" ? "bg-green-100 text-green-800" :
                              registro.estado === "Tardanza" ? "bg-yellow-100 text-yellow-800" :
                              "bg-red-100 text-red-800"
                            }`}>
                              {registro.estado}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <button className="flex items-center space-x-1 px-2.5 py-1 bg-blue-700/20 backdrop-blur-sm border border-blue-700/40 hover:bg-blue-700/30 hover:border-blue-600/60 text-blue-800 rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] mx-auto">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              <span>Ver Detalle</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Formularios de Incidencias */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center text-white border-2 border-blue-800 shadow-sm">
                    {getIcon("clock")}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Formularios de Incidencias</h2>
                    <p className="text-xs text-gray-600 mt-0.5">Faltas, tardanzas y justificaciones</p>
                  </div>
                </div>
                <button className="flex items-center space-x-1.5 px-3 py-2 bg-blue-700/20 backdrop-blur-md border border-blue-700/40 hover:bg-blue-700/30 hover:border-blue-600/60 text-blue-800 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>+ Registrar Incidencia</span>
                </button>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-blue-700/20 backdrop-blur-md border-b border-blue-700/40">
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">NOMBRE</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">TIPO</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">FECHA</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">JUSTIFICACIÓN</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">ESTADO</th>
                        <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-blue-800">ACCIÓN</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {incidenciasAsistencia.map((incidencia) => (
                        <tr key={incidencia.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{incidencia.nombre}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{incidencia.tipo}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{incidencia.fecha}</td>
                          <td className="px-3 py-2 text-[10px] text-gray-700">{incidencia.justificacion}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              incidencia.estado === "Aprobada" ? "bg-green-100 text-green-800" :
                              incidencia.estado === "Pendiente" ? "bg-yellow-100 text-yellow-800" :
                              "bg-red-100 text-red-800"
                            }`}>
                              {incidencia.estado}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-center">
                            <button className="flex items-center space-x-1 px-2.5 py-1 bg-blue-700/20 backdrop-blur-sm border border-blue-700/40 hover:bg-blue-700/30 hover:border-blue-600/60 text-blue-800 rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] mx-auto">
                              <span>Revisar</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        );

      case "gestion-permisos":
        return (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center text-white border-2 border-blue-800 shadow-sm">
                    {getIcon("check")}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Solicitudes de Permisos</h2>
                  <p className="text-xs text-gray-600 mt-0.5">Gestión de permisos médicos, personales y otras actividades</p>
                </div>
              </div>
              <div className="flex items-center space-x-1.5">
                <button className="flex items-center space-x-1.5 px-3 py-2 bg-blue-700/20 backdrop-blur-md border border-blue-700/40 hover:bg-blue-700/30 hover:border-blue-600/60 text-blue-800 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>+ Nueva Solicitud</span>
                </button>
                <div className="flex items-center space-x-1.5 bg-green-50 border border-green-200 rounded-lg px-2.5 py-1">
                  <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs font-semibold text-green-700">API Conectada</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-blue-700/20 backdrop-blur-md border-b border-blue-700/40">
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">NOMBRE</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">TIPO</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">FECHA</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">DÍAS</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">MOTIVO</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">JEFE</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">ESTADO</th>
                      <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-blue-800">ACCIÓN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {solicitudesPermisos.map((solicitud) => (
                      <tr key={solicitud.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{solicitud.nombre}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{solicitud.tipo}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{solicitud.fecha}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{solicitud.dias}</td>
                        <td className="px-3 py-2 text-[10px] text-gray-700">{solicitud.motivo}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{solicitud.jefe}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            solicitud.estado === "Aprobada" ? "bg-green-100 text-green-800" :
                            "bg-yellow-100 text-yellow-800"
                          }`}>
                            {solicitud.estado}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button className="flex items-center space-x-1 px-2.5 py-1 bg-green-600/20 backdrop-blur-sm border border-green-600/40 hover:bg-green-600/30 hover:border-green-700/60 text-green-700 rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                              <span>Aprobar</span>
                            </button>
                            <button className="flex items-center space-x-1 px-2.5 py-1 bg-red-600/20 backdrop-blur-sm border border-red-600/40 hover:bg-red-600/30 hover:border-red-700/60 text-red-700 rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              <span>Rechazar</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case "gestion-vacaciones":
        return (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center text-white border-2 border-blue-800 shadow-sm">
                  {getIcon("calendar")}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Solicitudes de Vacaciones</h2>
                  <p className="text-xs text-gray-600 mt-0.5">Calendario de vacaciones y solicitudes pendientes</p>
                </div>
              </div>
              <div className="flex items-center space-x-1.5">
                <button className="flex items-center space-x-1.5 px-3 py-2 bg-blue-700/20 backdrop-blur-md border border-blue-700/40 hover:bg-blue-700/30 hover:border-blue-600/60 text-blue-800 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>+ Nueva Solicitud</span>
                </button>
                <div className="flex items-center space-x-1.5 bg-green-50 border border-green-200 rounded-lg px-2.5 py-1">
                  <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs font-semibold text-green-700">API Conectada</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-blue-700/20 backdrop-blur-md border-b border-blue-700/40">
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">NOMBRE</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">DÍAS ACUMULADOS</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">DÍAS SOLICITADOS</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">FECHA INICIO</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">FECHA FIN</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">ESTADO</th>
                      <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-blue-800">ACCIÓN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {solicitudesVacaciones.map((solicitud) => (
                      <tr key={solicitud.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{solicitud.nombre}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{solicitud.diasAcumulados} días</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{solicitud.diasSolicitados} días</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{solicitud.fechaInicio}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{solicitud.fechaFin}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            solicitud.estado === "Aprobada" ? "bg-green-100 text-green-800" :
                            "bg-yellow-100 text-yellow-800"
                          }`}>
                            {solicitud.estado}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button className="flex items-center space-x-1 px-2.5 py-1 bg-green-600/20 backdrop-blur-sm border border-green-600/40 hover:bg-green-600/30 hover:border-green-700/60 text-green-700 rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                              <span>Aprobar</span>
                            </button>
                            <button className="flex items-center space-x-1 px-2.5 py-1 bg-blue-700/20 backdrop-blur-sm border border-blue-700/40 hover:bg-blue-700/30 hover:border-blue-600/60 text-blue-800 rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              <span>Ver</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case "control-documentos":
        return (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center text-white border-2 border-blue-800 shadow-sm">
                  {getIcon("document")}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Control de Documentos Laborales</h2>
                  <p className="text-xs text-gray-600 mt-0.5">Alertas de vencimiento y repositorio de documentos</p>
                </div>
              </div>
              <div className="flex items-center space-x-1.5 bg-green-50 border border-green-200 rounded-lg px-2.5 py-1">
                <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-semibold text-green-700">API Conectada</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-blue-700/20 backdrop-blur-md border-b border-blue-700/40">
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">NOMBRE</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">TIPO DOCUMENTO</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">FECHA VENCIMIENTO</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">DÍAS RESTANTES</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">ESTADO</th>
                      <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-blue-800">ACCIÓN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {documentosLaborales.map((documento) => (
                      <tr key={documento.id} className={`hover:bg-gray-50 transition-colors ${documento.alerta ? "bg-red-50/30" : ""}`}>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{documento.nombre}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{documento.tipo}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{documento.fechaVencimiento}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{documento.diasRestantes} días</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            documento.estado === "Vigente" ? "bg-green-100 text-green-800" :
                            "bg-red-100 text-red-800"
                          }`}>
                            {documento.estado}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button className="flex items-center space-x-1 px-2.5 py-1 bg-blue-700/20 backdrop-blur-sm border border-blue-700/40 hover:bg-blue-700/30 hover:border-blue-600/60 text-blue-800 rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              <span>Ver</span>
                            </button>
                            <button className="flex items-center space-x-1 px-2.5 py-1 bg-green-600/20 backdrop-blur-sm border border-green-600/40 hover:bg-green-600/30 hover:border-green-700/60 text-green-700 rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              <span>Descargar</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case "gestion-remuneraciones":
        return (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center text-white border-2 border-blue-800 shadow-sm">
                  {getIcon("money")}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Gestión de Remuneraciones</h2>
                  <p className="text-xs text-gray-600 mt-0.5">Registro de sueldos, bonos, CTS y gratificaciones</p>
                </div>
              </div>
              <div className="flex items-center space-x-1.5">
                <button className="flex items-center space-x-1.5 px-3 py-2 bg-green-600/20 backdrop-blur-md border border-green-600/40 hover:bg-green-600/30 hover:border-green-700/60 text-green-700 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Exportar a Excel</span>
                </button>
                <div className="flex items-center space-x-1.5 bg-green-50 border border-green-200 rounded-lg px-2.5 py-1">
                  <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs font-semibold text-green-700">API Conectada</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-blue-700/20 backdrop-blur-md border-b border-blue-700/40">
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">NOMBRE</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">MES</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">SUELDO BASE</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">BONOS</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">CTS PROYECTADO</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">GRATIFICACIONES</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-800">TOTAL</th>
                      <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-blue-800">ACCIÓN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {remuneraciones.map((remuneracion) => (
                      <tr key={remuneracion.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{remuneracion.nombre}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{remuneracion.mes}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">S/ {remuneracion.sueldoBase.toLocaleString()}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">S/ {remuneracion.bonos.toLocaleString()}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">S/ {remuneracion.ctsProyectado.toLocaleString()}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">S/ {remuneracion.gratificaciones.toLocaleString()}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] font-bold text-blue-800">S/ {remuneracion.total.toLocaleString()}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-center">
                          <button className="flex items-center space-x-1 px-2.5 py-1 bg-blue-700/20 backdrop-blur-sm border border-blue-700/40 hover:bg-blue-700/30 hover:border-blue-600/60 text-blue-800 rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] mx-auto">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            <span>Ver Detalle</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case "auto-servicio":
        return (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center text-white border-2 border-blue-800 shadow-sm">
                  {getIcon("user")}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Portal del Colaborador</h2>
                  <p className="text-xs text-gray-600 mt-0.5">Auto-servicio para colaboradores</p>
                </div>
              </div>
              <div className="flex items-center space-x-1.5 bg-green-50 border border-green-200 rounded-lg px-2.5 py-1">
                <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-semibold text-green-700">API Conectada</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-4 border border-blue-200/60 shadow-md hover:shadow-lg transition-all">
                <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center text-white border-2 border-blue-800 shadow-sm mb-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1.5">Ver Datos Personales</h3>
                <p className="text-xs text-gray-600 mb-3">Consulta y actualiza tu información personal</p>
                <button className="w-full px-3 py-2 bg-blue-700/20 backdrop-blur-sm border border-blue-700/40 hover:bg-blue-700/30 hover:border-blue-600/60 text-blue-800 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md text-sm">
                  Acceder
                </button>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-4 border border-blue-200/60 shadow-md hover:shadow-lg transition-all">
                <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center text-white border-2 border-blue-800 shadow-sm mb-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1.5">Descargar Boletas</h3>
                <p className="text-xs text-gray-600 mb-3">Descarga tus boletas de pago históricas</p>
                <button className="w-full px-3 py-2 bg-blue-700/20 backdrop-blur-sm border border-blue-700/40 hover:bg-blue-700/30 hover:border-blue-600/60 text-blue-800 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md text-sm">
                  Acceder
                </button>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-4 border border-blue-200/60 shadow-md hover:shadow-lg transition-all">
                <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center text-white border-2 border-blue-800 shadow-sm mb-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1.5">Ver Vacaciones Acumuladas</h3>
                <p className="text-xs text-gray-600 mb-3">Consulta tus días de vacaciones disponibles</p>
                <button className="w-full px-3 py-2 bg-blue-700/20 backdrop-blur-sm border border-blue-700/40 hover:bg-blue-700/30 hover:border-blue-600/60 text-blue-800 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md text-sm">
                  Acceder
                </button>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-4 border border-blue-200/60 shadow-md hover:shadow-lg transition-all">
                <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center text-white border-2 border-blue-800 shadow-sm mb-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1.5">Solicitar Permisos</h3>
                <p className="text-xs text-gray-600 mb-3">Envía solicitudes de permisos médicos o personales</p>
                <button className="w-full px-3 py-2 bg-blue-700/20 backdrop-blur-sm border border-blue-700/40 hover:bg-blue-700/30 hover:border-blue-600/60 text-blue-800 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md text-sm">
                  Acceder
                </button>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-4 border border-blue-200/60 shadow-md hover:shadow-lg transition-all">
                <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center text-white border-2 border-blue-800 shadow-sm mb-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1.5">Solicitar Vacaciones</h3>
                <p className="text-xs text-gray-600 mb-3">Solicita tus días de vacaciones</p>
                <button className="w-full px-3 py-2 bg-blue-700/20 backdrop-blur-sm border border-blue-700/40 hover:bg-blue-700/30 hover:border-blue-600/60 text-blue-800 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md text-sm">
                  Acceder
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-blue-700/20 backdrop-blur-md border-2 border-blue-600/40 rounded-xl flex items-center justify-center text-blue-800 shadow-sm mx-auto mb-3">
                {getIcon(sections.find(s => s.id === activeSection)?.icon || "users")}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {sections.find(s => s.id === activeSection)?.name}
              </h3>
              <p className="text-gray-600">Esta sección estará disponible próximamente</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${
          sidebarOpen ? "lg:ml-60 ml-0" : "ml-0"
        }`}
      >
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto custom-scrollbar bg-gray-100">
          <div className="max-w-[95%] mx-auto px-4 py-4">
            {/* Botón Volver */}
            <button
              onClick={() => router.push("/menu")}
              className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-blue-700/20 backdrop-blur-md border border-blue-700/40 text-blue-800 rounded-lg font-semibold hover:bg-blue-700/30 hover:border-blue-600/60 transition-all duration-200 shadow-md hover:shadow-lg ripple-effect relative overflow-hidden text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver al Menú</span>
            </button>

            {/* Header Principal */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6 mb-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-blue-700/20 backdrop-blur-md border-2 border-blue-600/40 rounded-xl flex items-center justify-center text-blue-800 shadow-sm">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight">RECURSOS HUMANOS</h1>
                  <p className="text-sm text-gray-600 font-medium mt-0.5">Gestión de personal y nómina</p>
                </div>
              </div>

              {/* Navegación de Secciones */}
              <div className="flex flex-wrap gap-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg font-semibold transition-all duration-200 text-sm ${
                      activeSection === section.id
                        ? "bg-blue-700/30 backdrop-blur-sm border-2 border-blue-600/60 text-blue-900 shadow-md"
                        : "bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <span className="text-blue-800">{getIcon(section.icon)}</span>
                    <span>{section.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Contenido de la Sección Activa */}
            {renderSectionContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
