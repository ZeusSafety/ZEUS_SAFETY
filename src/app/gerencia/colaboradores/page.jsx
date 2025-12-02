"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/context/AuthContext";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";
import Modal from "../../../components/ui/Modal";

export default function ColaboradoresPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageInactivos, setCurrentPageInactivos] = useState(1);
  const itemsPerPage = 5;
  const [isPermisosModalOpen, setIsPermisosModalOpen] = useState(false);
  const [isDesactivarModalOpen, setIsDesactivarModalOpen] = useState(false);
  const [isAgregarModalOpen, setIsAgregarModalOpen] = useState(false);
  const [selectedColaborador, setSelectedColaborador] = useState(null);
  const [newColaboradorForm, setNewColaboradorForm] = useState({
    nombre: "",
    apellido: "",
    area: "",
    correo: "",
    fechaCumpleanos: "",
  });

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

  // Datos de ejemplo
  const colaboradores = [
    { id: 1, nombre: "HERVIN", apellido: "CORONEL", area: "Administracion", correo: "permisos.zeus@gmail.com", fechaCumpleanos: "03/07/1991", activo: true },
    { id: 2, nombre: "MARIA", apellido: "GONZALEZ", area: "Ventas", correo: "maria.gonzalez@zeus.com", fechaCumpleanos: "15/03/1988", activo: true },
    { id: 3, nombre: "JUAN", apellido: "PEREZ", area: "Logistica", correo: "juan.perez@zeus.com", fechaCumpleanos: "22/11/1990", activo: true },
    { id: 4, nombre: "ANA", apellido: "LOPEZ", area: "Marketing", correo: "ana.lopez@zeus.com", fechaCumpleanos: "08/05/1992", activo: true },
    { id: 5, nombre: "CARLOS", apellido: "RODRIGUEZ", area: "Sistemas", correo: "carlos.rodriguez@zeus.com", fechaCumpleanos: "12/09/1987", activo: true },
    { id: 6, nombre: "LAURA", apellido: "MARTINEZ", area: "Administracion", correo: "laura.martinez@zeus.com", fechaCumpleanos: "25/12/1993", activo: true },
    { id: 7, nombre: "PEDRO", apellido: "SANCHEZ", area: "Ventas", correo: "pedro.sanchez@zeus.com", fechaCumpleanos: "30/01/1989", activo: true },
    { id: 8, nombre: "SOFIA", apellido: "TORRES", area: "Logistica", correo: "sofia.torres@zeus.com", fechaCumpleanos: "14/07/1991", activo: true },
    { id: 9, nombre: "DIEGO", apellido: "RAMIREZ", area: "Marketing", correo: "diego.ramirez@zeus.com", fechaCumpleanos: "06/03/1994", activo: true },
    { id: 10, nombre: "ELENA", apellido: "FERNANDEZ", area: "Sistemas", correo: "elena.fernandez@zeus.com", fechaCumpleanos: "19/08/1990", activo: true },
    { id: 11, nombre: "ROBERTO", apellido: "GUTIERREZ", area: "Administracion", correo: "roberto.gutierrez@zeus.com", fechaCumpleanos: "02/10/1986", activo: true },
    { id: 12, nombre: "CARMEN", apellido: "JIMENEZ", area: "Ventas", correo: "carmen.jimenez@zeus.com", fechaCumpleanos: "11/04/1992", activo: true },
    { id: 13, nombre: "FERNANDO", apellido: "MORALES", area: "Logistica", correo: "fernando.morales@zeus.com", fechaCumpleanos: "27/06/1988", activo: true },
    { id: 14, nombre: "ISABEL", apellido: "ORTEGA", area: "Marketing", correo: "isabel.ortega@zeus.com", fechaCumpleanos: "09/02/1995", activo: true },
    { id: 15, nombre: "MIGUEL", apellido: "CASTRO", area: "Sistemas", correo: "miguel.castro@zeus.com", fechaCumpleanos: "16/11/1987", activo: true },
  ];

  const colaboradoresInactivos = [
    { id: 16, nombre: "JOSELYN", apellido: "", area: "LOGISTICA", correo: "zeussafety2024@gmail.com", fechaCumpleanos: "23/11/1995", activo: false },
  ];

  const activos = colaboradores.filter(c => c.activo);
  const inactivos = colaboradoresInactivos.filter(c => !c.activo);

  const totalPages = Math.ceil(activos.length / itemsPerPage);
  const totalPagesInactivos = Math.ceil(inactivos.length / itemsPerPage);

  const paginatedActivos = activos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const paginatedInactivos = inactivos.slice((currentPageInactivos - 1) * itemsPerPage, currentPageInactivos * itemsPerPage);

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

  return (
    <>
      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div
          className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${
            sidebarOpen ? "lg:ml-60 ml-0" : "ml-0"
          }`}
        >
          <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

          <main className="flex-1 overflow-y-auto custom-scrollbar" style={{ background: '#F7FAFF' }}>
            <div className="max-w-[95%] mx-auto px-4 py-4">
            {/* Botón Volver */}
            <button
              onClick={() => router.push("/gerencia")}
              className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] text-white rounded-lg font-semibold hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm ripple-effect relative overflow-hidden text-sm group"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver a Gerencia</span>
            </button>

            {/* Sección: Listado de Colaboradores */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6 mb-6">
              <div>
                {/* Header de Sección */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] rounded-xl flex items-center justify-center text-white shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Listado de Colaboradores</h2>
                      <p className="text-sm text-gray-600 mt-1">Gestiona los colaboradores activos del sistema</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-semibold text-green-700">API Conectada</span>
                  </div>
                </div>

                {/* Botón Agregar */}
                <button
                  onClick={() => {
                    setNewColaboradorForm({
                      nombre: "",
                      apellido: "",
                      area: "",
                      correo: "",
                      fechaCumpleanos: "",
                    });
                    setIsAgregarModalOpen(true);
                  }}
                  className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] text-white rounded-lg font-semibold hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm active:scale-[0.98] text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Agregar Colaborador</span>
                </button>

                {/* Tabla */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-blue-700 border-b-2 border-blue-800">
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">NOMBRE</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">APELLIDO</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ÁREA</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">CORREO</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">FECHA CUMPLEAÑOS</th>
                          <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ACCIÓN</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {paginatedActivos.map((colaborador) => (
                          <tr key={colaborador.id} className="hover:bg-slate-200 transition-colors">
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{colaborador.nombre}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{colaborador.apellido}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{colaborador.area}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{colaborador.correo}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{colaborador.fechaCumpleanos}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center space-x-2">
                                <button
                                  onClick={() => {
                                    setSelectedColaborador(colaborador);
                                    setIsPermisosModalOpen(true);
                                  }}
                                  className="flex items-center space-x-1 px-2.5 py-1 bg-cyan-500 border-2 border-cyan-600 hover:bg-cyan-600 hover:border-cyan-700 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                  <span>Permisos</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedColaborador(colaborador);
                                    setIsDesactivarModalOpen(true);
                                  }}
                                  className="flex items-center space-x-1 px-2.5 py-1 bg-orange-600 border-2 border-orange-700 hover:bg-orange-700 hover:border-orange-800 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                >
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

                  {/* Paginación */}
                  <div className="bg-slate-200 px-3 py-2 flex items-center justify-between border-t-2 border-slate-300">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      «
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      &lt;
                    </button>
                    <span className="text-[10px] text-gray-700 font-medium">
                      Página {currentPage} de {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      &gt;
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      »
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección: Colaboradores Inactivos */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">
              <div>
                {/* Header de Sección */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] rounded-xl flex items-center justify-center text-white shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Colaboradores Inactivos</h2>
                      <p className="text-sm text-gray-600 mt-1">Sin acceso al sistema</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-semibold text-green-700">API Conectada</span>
                  </div>
                </div>

                {/* Tabla */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-blue-700 border-b-2 border-blue-800">
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">NOMBRE</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">APELLIDO</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ÁREA</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">CORREO</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">FECHA CUMPLEAÑOS</th>
                          <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ACCIÓN</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {paginatedInactivos.map((colaborador) => (
                          <tr key={colaborador.id} className="hover:bg-slate-200 transition-colors">
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{colaborador.nombre}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{colaborador.apellido}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{colaborador.area}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{colaborador.correo}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{colaborador.fechaCumpleanos}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center space-x-2">
                                <button className="flex items-center space-x-1 px-2.5 py-1 bg-cyan-500 border-2 border-cyan-600 hover:bg-cyan-600 hover:border-cyan-700 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                  <span>Permisos</span>
                                </button>
                                <button className="flex items-center space-x-1 px-2.5 py-1 bg-green-600 border-2 border-green-700 hover:bg-green-700 hover:border-green-800 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]">
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

                  {/* Paginación */}
                  <div className="bg-slate-200 px-3 py-2 flex items-center justify-between border-t-2 border-slate-300">
                    <button
                      onClick={() => setCurrentPageInactivos(1)}
                      disabled={currentPageInactivos === 1}
                      className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      «
                    </button>
                    <button
                      onClick={() => setCurrentPageInactivos(prev => Math.max(1, prev - 1))}
                      disabled={currentPageInactivos === 1}
                      className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      &lt;
                    </button>
                    <span className="text-[10px] text-gray-700 font-medium">
                      Página {currentPageInactivos} de {totalPagesInactivos}
                    </span>
                    <button
                      onClick={() => setCurrentPageInactivos(prev => Math.min(totalPagesInactivos, prev + 1))}
                      disabled={currentPageInactivos === totalPagesInactivos}
                      className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      &gt;
                    </button>
                    <button
                      onClick={() => setCurrentPageInactivos(totalPagesInactivos)}
                      disabled={currentPageInactivos === totalPagesInactivos}
                      className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      »
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </main>
        </div>
      </div>
      <Modal
        isOpen={isPermisosModalOpen}
        onClose={() => {
          setIsPermisosModalOpen(false);
          setSelectedColaborador(null);
        }}
        title="Gestionar Permisos"
        size="lg"
        primaryButtonText="Guardar"
        onPrimaryButtonClick={() => {
          // Aquí iría la lógica para guardar los permisos
          setIsPermisosModalOpen(false);
          setSelectedColaborador(null);
        }}
        secondaryButtonText="Cancelar"
        onSecondaryButtonClick={() => {
          setIsPermisosModalOpen(false);
          setSelectedColaborador(null);
        }}
      >
        {selectedColaborador && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Gestionando permisos para: <strong>{selectedColaborador.nombre} {selectedColaborador.apellido}</strong>
              </p>
              <p className="text-xs text-gray-500">
                Aquí se mostrarían los permisos y opciones de configuración.
              </p>
            </div>
          </div>
        )}
      </Modal>
      <Modal
        isOpen={isDesactivarModalOpen}
        onClose={() => {
          setIsDesactivarModalOpen(false);
          setSelectedColaborador(null);
        }}
        title="Desactivar Colaborador"
        size="md"
        primaryButtonText="Desactivar"
        onPrimaryButtonClick={() => {
          // Aquí iría la lógica para desactivar el colaborador
          setIsDesactivarModalOpen(false);
          setSelectedColaborador(null);
        }}
        secondaryButtonText="Cancelar"
        onSecondaryButtonClick={() => {
          setIsDesactivarModalOpen(false);
          setSelectedColaborador(null);
        }}
      >
        {selectedColaborador && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              ¿Estás seguro de que deseas desactivar a <strong>{selectedColaborador.nombre} {selectedColaborador.apellido}</strong>?
            </p>
            <p className="text-xs text-gray-500">
              El colaborador perderá acceso al sistema pero sus datos se mantendrán.
            </p>
          </div>
        )}
      </Modal>

      {/* Modal Agregar Colaborador */}
      <Modal
        isOpen={isAgregarModalOpen}
        onClose={() => {
          setIsAgregarModalOpen(false);
          setNewColaboradorForm({
            nombre: "",
            apellido: "",
            area: "",
            correo: "",
            fechaCumpleanos: "",
          });
        }}
        title="Agregar Nuevo Colaborador"
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newColaboradorForm.nombre}
                onChange={(e) => setNewColaboradorForm({ ...newColaboradorForm, nombre: e.target.value })}
                placeholder="Nombre"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Apellido <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newColaboradorForm.apellido}
                onChange={(e) => setNewColaboradorForm({ ...newColaboradorForm, apellido: e.target.value })}
                placeholder="Apellido"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Área <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newColaboradorForm.area}
              onChange={(e) => setNewColaboradorForm({ ...newColaboradorForm, area: e.target.value })}
              placeholder="Ej: Administracion, Ventas, Logistica"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Correo <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={newColaboradorForm.correo}
              onChange={(e) => setNewColaboradorForm({ ...newColaboradorForm, correo: e.target.value })}
              placeholder="correo@ejemplo.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Fecha de Cumpleaños <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newColaboradorForm.fechaCumpleanos}
              onChange={(e) => setNewColaboradorForm({ ...newColaboradorForm, fechaCumpleanos: e.target.value })}
              placeholder="DD/MM/YYYY"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setIsAgregarModalOpen(false);
                setNewColaboradorForm({
                  nombre: "",
                  apellido: "",
                  area: "",
                  correo: "",
                  fechaCumpleanos: "",
                });
              }}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                // Validar campos requeridos
                if (!newColaboradorForm.nombre || !newColaboradorForm.apellido || !newColaboradorForm.area || !newColaboradorForm.correo || !newColaboradorForm.fechaCumpleanos) {
                  alert("Por favor, complete todos los campos requeridos");
                  return;
                }
                console.log("Agregar colaborador:", newColaboradorForm);
                alert("Funcionalidad de agregado pendiente de implementar");
                setIsAgregarModalOpen(false);
                setNewColaboradorForm({
                  nombre: "",
                  apellido: "",
                  area: "",
                  correo: "",
                  fechaCumpleanos: "",
                });
              }}
              className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] hover:shadow-md hover:scale-105 rounded-lg transition-all duration-200 shadow-sm"
            >
              Agregar Colaborador
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

