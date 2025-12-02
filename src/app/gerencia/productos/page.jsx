"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/context/AuthContext";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";
import Modal from "../../../components/ui/Modal";

export default function ProductosPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageInactivos, setCurrentPageInactivos] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 5;
  const [isVerModalOpen, setIsVerModalOpen] = useState(false);
  const [isEditarModalOpen, setIsEditarModalOpen] = useState(false);
  const [isDesactivarModalOpen, setIsDesactivarModalOpen] = useState(false);
  const [isActivarModalOpen, setIsActivarModalOpen] = useState(false);
  const [isAgregarModalOpen, setIsAgregarModalOpen] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState(null);
  const [editForm, setEditForm] = useState({
    codigo: "",
    nombre: "",
    categoria: "",
    precio: "",
    stock: "",
  });
  const [newProductForm, setNewProductForm] = useState({
    codigo: "",
    nombre: "",
    categoria: "",
    precio: "",
    stock: "",
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

  // Datos de ejemplo con campos adicionales
  const productos = [
    { id: 1, codigo: "ARZ-359", nombre: "Arnes de Seguridad Amarillo", categoria: "Corporal", tipoProducto: "Arnés de Seguridad", colorTipo: "Amarillo", tamano: "", paresPorCaja: 10, fichaTecnica: "https://example.com/ficha1.pdf", precio: 100.00, stock: 50, activo: true },
    { id: 9, codigo: "BZ-Z01N", nombre: "Barbiquejo para Casco Negro", categoria: "Corporal", tipoProducto: "Barbiquejo", colorTipo: "Negro", tamano: "", paresPorCaja: 1000, fichaTecnica: null, precio: 200.00, stock: 30, activo: true },
    { id: 150, codigo: "ZB-B101", nombre: "Barra retráctil", categoria: "Vial", tipoProducto: "Barra Retractil", colorTipo: "", tamano: "", paresPorCaja: 20, fichaTecnica: "https://example.com/ficha2.pdf", precio: 150.00, stock: 25, activo: true },
    { id: 19, codigo: "CZ-SPB10", nombre: "Camilla de seguridad naranja", categoria: "Laboral", tipoProducto: "Camilla de seguridad naranja", colorTipo: "naranja", tamano: "", paresPorCaja: 10, fichaTecnica: null, precio: 300.00, stock: 40, activo: true },
    { id: 177, codigo: "ZP-PS02A", nombre: "Capotin Enjebado Amarillo", categoria: "Corporal", tipoProducto: "Capotin Enjebado", colorTipo: "Amarillo", tamano: "", paresPorCaja: 20, fichaTecnica: null, precio: 250.00, stock: 20, activo: true },
    { id: 176, codigo: "ZP-PS02AM", nombre: "Capotin Enjebado Azul Marino", categoria: "Corporal", tipoProducto: "Capotin Enjebado", colorTipo: "Azul Marino", tamano: "", paresPorCaja: 20, fichaTecnica: null, precio: 180.00, stock: 35, activo: true },
    { id: 7, codigo: "PROD007", nombre: "Producto G", categoria: "Categoría 3", tipoProducto: "Tipo G", colorTipo: "Rojo", tamano: "M", paresPorCaja: 15, fichaTecnica: "https://example.com/ficha3.pdf", precio: 400.00, stock: 15, activo: true },
    { id: 8, codigo: "PROD008", nombre: "Producto H", categoria: "Categoría 2", tipoProducto: "Tipo H", colorTipo: "Verde", tamano: "L", paresPorCaja: 25, fichaTecnica: null, precio: 220.00, stock: 28, activo: true },
    { id: 9, codigo: "PROD009", nombre: "Producto I", categoria: "Categoría 1", tipoProducto: "Tipo I", colorTipo: "Azul", tamano: "S", paresPorCaja: 30, fichaTecnica: "https://example.com/ficha4.pdf", precio: 120.00, stock: 45, activo: true },
    { id: 10, codigo: "PROD010", nombre: "Producto J", categoria: "Categoría 3", tipoProducto: "Tipo J", colorTipo: "Negro", tamano: "XL", paresPorCaja: 12, fichaTecnica: null, precio: 350.00, stock: 22, activo: true },
    { id: 11, codigo: "PROD011", nombre: "Producto K", categoria: "Categoría 2", tipoProducto: "Tipo K", colorTipo: "Blanco", tamano: "M", paresPorCaja: 18, fichaTecnica: "https://example.com/ficha5.pdf", precio: 280.00, stock: 18, activo: true },
    { id: 12, codigo: "PROD012", nombre: "Producto L", categoria: "Categoría 1", tipoProducto: "Tipo L", colorTipo: "Gris", tamano: "L", paresPorCaja: 22, fichaTecnica: null, precio: 160.00, stock: 32, activo: true },
    { id: 13, codigo: "PROD013", nombre: "Producto M", categoria: "Categoría 3", tipoProducto: "Tipo M", colorTipo: "Amarillo", tamano: "S", paresPorCaja: 28, fichaTecnica: "https://example.com/ficha6.pdf", precio: 420.00, stock: 12, activo: true },
    { id: 14, codigo: "PROD014", nombre: "Producto N", categoria: "Categoría 2", tipoProducto: "Tipo N", colorTipo: "Naranja", tamano: "M", paresPorCaja: 16, fichaTecnica: null, precio: 240.00, stock: 26, activo: true },
    { id: 15, codigo: "PROD015", nombre: "Producto O", categoria: "Categoría 1", tipoProducto: "Tipo O", colorTipo: "Morado", tamano: "XL", paresPorCaja: 14, fichaTecnica: "https://example.com/ficha7.pdf", precio: 140.00, stock: 38, activo: true },
  ];

  const productosInactivos = [
    { id: 16, codigo: "PROD016", nombre: "Producto P", categoria: "Categoría 3", tipoProducto: "Tipo P", colorTipo: "Rojo", tamano: "L", paresPorCaja: 20, fichaTecnica: null, precio: 500.00, stock: 0, activo: false },
  ];

  // Filtrar productos por búsqueda
  const filteredProductos = productos.filter(p => 
    p.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.tipoProducto && p.tipoProducto.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.colorTipo && p.colorTipo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const activos = filteredProductos.filter(p => p.activo);
  const inactivos = productosInactivos.filter(p => !p.activo);

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

            {/* Sección: Listado de Productos */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6 mb-6">
              <div>
                {/* Header de Sección */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] rounded-xl flex items-center justify-center text-white shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Listado de Productos</h2>
                      <p className="text-sm text-gray-600 mt-1">Gestiona los productos activos del sistema</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-semibold text-green-700">API Conectada</span>
                  </div>
                </div>

                {/* Barra de búsqueda y botón agregar */}
                <div className="mb-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                  {/* Buscador */}
                  <div className="flex-1 w-full sm:max-w-md">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Buscar productos por código, nombre, categoría..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                      <svg
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Botón Agregar */}
                  <button
                    onClick={() => {
                      setNewProductForm({
                        codigo: "",
                        nombre: "",
                        categoria: "",
                        precio: "",
                        stock: "",
                      });
                      setIsAgregarModalOpen(true);
                    }}
                    className="flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] text-white rounded-lg font-semibold hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm active:scale-[0.98] text-sm whitespace-nowrap"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Agregar Producto</span>
                  </button>
                </div>

                {/* Tabla */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-blue-700 border-b-2 border-blue-800">
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ID</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">CÓDIGO</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">NOMBRE</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">CATEGORÍA</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">TIPO DE PRODUCTO</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">COLOR/TIPO</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">TAMAÑO</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">PARES POR CAJA</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">FICHA TÉCNICA</th>
                          <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ACCIONES</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {paginatedActivos.map((producto) => (
                          <tr key={producto.id} className="hover:bg-slate-200 transition-colors">
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{producto.id}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{producto.codigo}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{producto.nombre}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{producto.categoria}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{producto.tipoProducto || "-"}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{producto.colorTipo || "-"}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{producto.tamano || "-"}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{producto.paresPorCaja || "-"}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                              {producto.fichaTecnica ? (
                                <a
                                  href={producto.fichaTecnica}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                  </svg>
                                  <span>Ver Ficha</span>
                                </a>
                              ) : (
                                <span className="text-gray-400">No disponible</span>
                              )}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center space-x-2">
                                <button
                                  onClick={() => {
                                    setSelectedProducto(producto);
                                    setIsEditarModalOpen(true);
                                  }}
                                  className="flex items-center space-x-1 px-2.5 py-1 bg-blue-600 border-2 border-blue-700 hover:bg-blue-700 hover:border-blue-800 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  <span>Editar</span>
                                </button>
                                {producto.fichaTecnica && (
                                  <button
                                    onClick={() => window.open(producto.fichaTecnica, '_blank')}
                                    className="flex items-center space-x-1 px-2.5 py-1 bg-gray-600 border-2 border-gray-700 hover:bg-gray-700 hover:border-gray-800 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    <span>PDF</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setSelectedProducto(producto);
                                    setIsDesactivarModalOpen(true);
                                  }}
                                  className="flex items-center space-x-1 px-2.5 py-1 bg-red-600 border-2 border-red-700 hover:bg-red-700 hover:border-red-800 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  <span>Eliminar</span>
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

            {/* Sección: Productos Inactivos */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">
              <div>
                {/* Header de Sección */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] rounded-xl flex items-center justify-center text-white shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Productos Inactivos</h2>
                      <p className="text-sm text-gray-600 mt-1">Sin disponibilidad en el sistema</p>
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
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ID</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">CÓDIGO</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">NOMBRE</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">CATEGORÍA</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">TIPO DE PRODUCTO</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">COLOR/TIPO</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">TAMAÑO</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">PARES POR CAJA</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">FICHA TÉCNICA</th>
                          <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ACCIONES</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {paginatedInactivos.map((producto) => (
                          <tr key={producto.id} className="hover:bg-slate-200 transition-colors">
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{producto.id}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{producto.codigo}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{producto.nombre}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{producto.categoria}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{producto.tipoProducto || "-"}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{producto.colorTipo || "-"}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{producto.tamano || "-"}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{producto.paresPorCaja || "-"}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                              {producto.fichaTecnica ? (
                                <a
                                  href={producto.fichaTecnica}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                  </svg>
                                  <span>Ver Ficha</span>
                                </a>
                              ) : (
                                <span className="text-gray-400">No disponible</span>
                              )}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center space-x-2">
                                <button
                                  onClick={() => {
                                    setSelectedProducto(producto);
                                    setIsActivarModalOpen(true);
                                  }}
                                  className="flex items-center space-x-1 px-2.5 py-1 bg-green-600 border-2 border-green-700 hover:bg-green-700 hover:border-green-800 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                >
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

      {/* Modal Ver Producto */}
      <Modal
        isOpen={isVerModalOpen}
        onClose={() => {
          setIsVerModalOpen(false);
          setSelectedProducto(null);
        }}
        title={`Detalles del Producto - ${selectedProducto?.codigo || ""}`}
        size="md"
      >
        {selectedProducto && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Código</label>
                <p className="text-sm text-gray-900">{selectedProducto.codigo}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre</label>
                <p className="text-sm text-gray-900">{selectedProducto.nombre}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Categoría</label>
                <p className="text-sm text-gray-900">{selectedProducto.categoria}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Precio</label>
                <p className="text-sm text-gray-900">${selectedProducto.precio.toFixed(2)}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Stock</label>
                <p className="text-sm text-gray-900">{selectedProducto.stock}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Estado</label>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border-2 ${
                  selectedProducto.activo ? "bg-green-600 border-green-700 text-white" : "bg-red-600 border-red-700 text-white"
                }`}>
                  {selectedProducto.activo ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-end pt-4 border-t border-gray-200">
              <button
                onClick={() => setIsVerModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] hover:shadow-md hover:scale-105 rounded-lg transition-all duration-200 shadow-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Editar Producto */}
      <Modal
        isOpen={isEditarModalOpen}
        onClose={() => {
          setIsEditarModalOpen(false);
          setSelectedProducto(null);
        }}
        title={`Editar Producto - ${selectedProducto?.codigo || ""}`}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Código</label>
            <input
              type="text"
              value={editForm.codigo}
              onChange={(e) => setEditForm({ ...editForm, codigo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre</label>
            <input
              type="text"
              value={editForm.nombre}
              onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Categoría</label>
            <input
              type="text"
              value={editForm.categoria}
              onChange={(e) => setEditForm({ ...editForm, categoria: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Precio</label>
              <input
                type="number"
                step="0.01"
                value={editForm.precio}
                onChange={(e) => setEditForm({ ...editForm, precio: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Stock</label>
              <input
                type="number"
                value={editForm.stock}
                onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setIsEditarModalOpen(false);
                setSelectedProducto(null);
              }}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                console.log("Guardar cambios:", editForm);
                alert("Funcionalidad de guardado pendiente de implementar");
                setIsEditarModalOpen(false);
              }}
              className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] hover:shadow-md hover:scale-105 rounded-lg transition-all duration-200 shadow-sm"
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Desactivar Producto */}
      <Modal
        isOpen={isDesactivarModalOpen}
        onClose={() => {
          setIsDesactivarModalOpen(false);
          setSelectedProducto(null);
        }}
        title="Confirmar Desactivación"
        size="sm"
      >
        {selectedProducto && (
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              ¿Está seguro de que desea desactivar el producto <strong>{selectedProducto.nombre}</strong> (Código: {selectedProducto.codigo})?
            </p>
            <p className="text-xs text-orange-600">El producto quedará inactivo y no estará disponible para ventas.</p>
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setIsDesactivarModalOpen(false);
                  setSelectedProducto(null);
                }}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  console.log("Desactivar producto:", selectedProducto.id);
                  alert("Funcionalidad de desactivación pendiente de implementar");
                  setIsDesactivarModalOpen(false);
                  setSelectedProducto(null);
                }}
                className="px-4 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
              >
                Desactivar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Activar Producto */}
      <Modal
        isOpen={isActivarModalOpen}
        onClose={() => {
          setIsActivarModalOpen(false);
          setSelectedProducto(null);
        }}
        title="Confirmar Activación"
        size="sm"
      >
        {selectedProducto && (
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              ¿Está seguro de que desea activar el producto <strong>{selectedProducto.nombre}</strong> (Código: {selectedProducto.codigo})?
            </p>
            <p className="text-xs text-green-600">El producto quedará activo y disponible para ventas.</p>
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setIsActivarModalOpen(false);
                  setSelectedProducto(null);
                }}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  console.log("Activar producto:", selectedProducto.id);
                  alert("Funcionalidad de activación pendiente de implementar");
                  setIsActivarModalOpen(false);
                  setSelectedProducto(null);
                }}
                className="px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                Activar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Agregar Producto */}
      <Modal
        isOpen={isAgregarModalOpen}
        onClose={() => {
          setIsAgregarModalOpen(false);
          setNewProductForm({
            codigo: "",
            nombre: "",
            categoria: "",
            precio: "",
            stock: "",
          });
        }}
        title="Agregar Nuevo Producto"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Código <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newProductForm.codigo}
              onChange={(e) => setNewProductForm({ ...newProductForm, codigo: e.target.value })}
              placeholder="Ej: PROD001"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newProductForm.nombre}
              onChange={(e) => setNewProductForm({ ...newProductForm, nombre: e.target.value })}
              placeholder="Nombre del producto"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Categoría <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newProductForm.categoria}
              onChange={(e) => setNewProductForm({ ...newProductForm, categoria: e.target.value })}
              placeholder="Categoría del producto"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Precio <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newProductForm.precio}
                onChange={(e) => setNewProductForm({ ...newProductForm, precio: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Stock <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={newProductForm.stock}
                onChange={(e) => setNewProductForm({ ...newProductForm, stock: e.target.value })}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setIsAgregarModalOpen(false);
                setNewProductForm({
                  codigo: "",
                  nombre: "",
                  categoria: "",
                  precio: "",
                  stock: "",
                });
              }}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                // Validar campos requeridos
                if (!newProductForm.codigo || !newProductForm.nombre || !newProductForm.categoria || !newProductForm.precio || !newProductForm.stock) {
                  alert("Por favor, complete todos los campos requeridos");
                  return;
                }
                console.log("Agregar producto:", newProductForm);
                alert("Funcionalidad de agregado pendiente de implementar");
                setIsAgregarModalOpen(false);
                setNewProductForm({
                  codigo: "",
                  nombre: "",
                  categoria: "",
                  precio: "",
                  stock: "",
                });
              }}
              className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] hover:shadow-md hover:scale-105 rounded-lg transition-all duration-200 shadow-sm"
            >
              Agregar Producto
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

