"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/context/AuthContext";
import { Header } from "../../components/layout/Header";
import { Sidebar } from "../../components/layout/Sidebar";
import Modal from "../../components/ui/Modal";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

// Importar componentes de react-leaflet dinámicamente para evitar problemas de SSR
const MapComponent = dynamic(
  () => import("./MapComponent"),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    )
  }
);


export default function SeguimientoMonitoreoPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rutaSeleccionada, setRutaSeleccionada] = useState("");
  const [conductorSeleccionado, setConductorSeleccionado] = useState("");
  const [entregasProgramadas, setEntregasProgramadas] = useState([]);
  const [editingEntrega, setEditingEntrega] = useState(null);
  const [editForm, setEditForm] = useState({
    fechaProgramada: "",
    estado: "",
    prioridad: "",
    ruta: "",
    conductor: ""
  });
  const [rutaDropdownOpen, setRutaDropdownOpen] = useState(false);
  const [conductorDropdownOpen, setConductorDropdownOpen] = useState(false);

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

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Inicializar entregas programadas
  useEffect(() => {
    const hoy = new Date();
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);
    const pasadoManana = new Date(hoy);
    pasadoManana.setDate(pasadoManana.getDate() + 2);

    const formatoFecha = (fecha) => {
      return fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    setEntregasProgramadas([
      {
        id: "ent-1",
        codigo: "#ZT-2024-0901",
        producto: "Cascos de Seguridad Industrial",
        cantidad: 150,
        cliente: "Constructora San Martín S.A.C.",
        fechaProgramada: formatoFecha(hoy),
        fechaOriginal: formatoFecha(hoy),
        estado: "No entregado",
        prioridad: "Alta",
        ruta: "ruta-1",
        conductor: ""
      },
      {
        id: "ent-2",
        codigo: "#ZT-2024-0902",
        producto: "Guantes Industriales",
        cantidad: 200,
        cliente: "Minera Los Andes",
        fechaProgramada: formatoFecha(hoy),
        fechaOriginal: formatoFecha(hoy),
        estado: "En espera",
        prioridad: "Media",
        ruta: "ruta-2",
        conductor: ""
      },
      {
        id: "ent-3",
        codigo: "#ZT-2024-0903",
        producto: "Botas de Seguridad",
        cantidad: 80,
        cliente: "Constructora Lima Norte",
        fechaProgramada: formatoFecha(hoy),
        fechaOriginal: formatoFecha(hoy),
        estado: "No entregado",
        prioridad: "Alta",
        ruta: "ruta-3",
        conductor: ""
      },
      {
        id: "ent-4",
        codigo: "#ZT-2024-0904",
        producto: "Chalecos Reflectantes",
        cantidad: 120,
        cliente: "Empresa Transportes Sur",
        fechaProgramada: formatoFecha(manana),
        fechaOriginal: formatoFecha(hoy),
        estado: "Reprogramado",
        prioridad: "Baja",
        ruta: "ruta-4",
        conductor: ""
      },
      {
        id: "ent-5",
        codigo: "#ZT-2024-0905",
        producto: "Lentes de Protección",
        cantidad: 300,
        cliente: "Industrias del Norte",
        fechaProgramada: formatoFecha(hoy),
        fechaOriginal: formatoFecha(hoy),
        estado: "En espera",
        prioridad: "Media",
        ruta: "ruta-5",
        conductor: ""
      }
    ]);
  }, []);

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

  // Coordenadas de San Martín de Porres, Lima, Perú
  const center = [-11.9994, -77.0775];

  // Rutas establecidas
  const rutasEstablecidas = [
    { id: "ruta-1", nombre: "Ruta Norte - San Martín de Porres", distancia: "25 km", tiempo: "45 min" },
    { id: "ruta-2", nombre: "Ruta Centro - Los Olivos", distancia: "18 km", tiempo: "35 min" },
    { id: "ruta-3", nombre: "Ruta Sur - Independencia", distancia: "22 km", tiempo: "40 min" },
    { id: "ruta-4", nombre: "Ruta Este - Comas", distancia: "20 km", tiempo: "38 min" },
    { id: "ruta-5", nombre: "Ruta Oeste - Carabayllo", distancia: "30 km", tiempo: "50 min" }
  ];

  // Conductores disponibles
  const conductores = [
    { id: "cond-1", nombre: "Carlos Mendoza", vehiculo: "ZEUS-2024", placa: "ABC-1234", disponible: true },
    { id: "cond-2", nombre: "María González", vehiculo: "ZEUS-2025", placa: "DEF-5678", disponible: true },
    { id: "cond-3", nombre: "Roberto Silva", vehiculo: "ZEUS-2023", placa: "GHI-9012", disponible: false },
    { id: "cond-4", nombre: "Ana Torres", vehiculo: "ZEUS-2026", placa: "JKL-3456", disponible: true },
    { id: "cond-5", nombre: "Luis Ramírez", vehiculo: "ZEUS-2024", placa: "MNO-7890", disponible: true }
  ];

  // Datos de entregas
  const entregas = [
    {
      position: [-11.9994, -77.0775],
      codigo: "#ZT-2024-0847",
      estado: "Completada",
      ubicacion: "San Martín de Porres, Lima",
      producto: "Cascos Seguridad",
      cantidad: "150",
      hora: "14:35 PM",
      fecha: "15 Ene 2024",
      conductor: "Carlos Mendoza",
      vehiculo: "ZEUS-2024",
      placa: "ABC-1234",
      tieneIncidencias: false,
      tipoIncidencia: "",
      cliente: "Constructora San Martín",
      distancia: "12.5"
    },
    {
      position: [-11.9920, -77.0700],
      codigo: "#ZT-2024-0848",
      estado: "En Tránsito",
      ubicacion: "Los Olivos, Lima",
      producto: "Guantes Industriales",
      cantidad: "200",
      hora: "10:20 AM",
      fecha: "15 Ene 2024",
      conductor: "María González",
      vehiculo: "ZEUS-2025",
      placa: "DEF-5678",
      tieneIncidencias: true,
      tipoIncidencia: "Retraso en ruta",
      cliente: "Minera Los Andes",
      distancia: "8.3"
    },
    {
      position: [-11.9985, -77.0850],
      codigo: "#ZT-2024-0849",
      estado: "Completada",
      ubicacion: "Independencia, Lima",
      producto: "Botas de Seguridad",
      cantidad: "80",
      hora: "16:45 PM",
      fecha: "14 Ene 2024",
      conductor: "Roberto Silva",
      vehiculo: "ZEUS-2023",
      placa: "GHI-9012",
      tieneIncidencias: false,
      tipoIncidencia: "",
      cliente: "Constructora Lima Norte",
      distancia: "15.2"
    },
    {
      position: [-11.9965, -77.0680],
      codigo: "#ZT-2024-0850",
      estado: "Completada",
      ubicacion: "Comas, Lima",
      producto: "Chalecos Reflectantes",
      cantidad: "120",
      hora: "11:15 AM",
      fecha: "15 Ene 2024",
      conductor: "Ana Torres",
      vehiculo: "ZEUS-2026",
      placa: "JKL-3456",
      tieneIncidencias: true,
      tipoIncidencia: "Producto dañado",
      cliente: "Empresa Transportes Sur",
      distancia: "9.8"
    },
    {
      position: [-11.9900, -77.0820],
      codigo: "#ZT-2024-0851",
      estado: "En Tránsito",
      ubicacion: "Carabayllo, Lima",
      producto: "Lentes de Protección",
      cantidad: "300",
      hora: "09:30 AM",
      fecha: "15 Ene 2024",
      conductor: "Luis Ramírez",
      vehiculo: "ZEUS-2024",
      placa: "MNO-7890",
      tieneIncidencias: false,
      tipoIncidencia: "",
      cliente: "Industrias del Norte",
      distancia: "18.5"
    }
  ];

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
              onClick={() => router.push("/menu")}
              className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] text-white rounded-lg font-semibold hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm ripple-effect relative overflow-hidden text-sm group"
            >
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver al Menú</span>
            </button>

            {/* Sección: Seguimiento y Monitoreo */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6 mb-6">
              {/* Header de Sección */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] rounded-xl flex items-center justify-center text-white shadow-sm">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Seguimiento y Monitoreo</h2>
                    <p className="text-sm text-gray-600 mt-1">Monitoreo de ubicaciones en tiempo real</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-1.5">
                  <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-semibold text-orange-700">Próximamente</span>
                </div>
              </div>

              {/* Mensaje Próximamente */}
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-[#1E63F7] via-[#1E63F7] to-[#1E63F7] rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg
                    className="w-7 h-7 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-gray-800 mb-2">
                  Próximamente
                </h4>
                <p className="text-sm text-gray-600 mb-6 max-w-2xl mx-auto">
                  Estamos trabajando en nuestro sistema de seguimiento y monitoreo de transportes en tiempo real.
                </p>
              </div>

              {/* Mapa Grande y Limpio con Leaflet */}
              <div className="w-full h-[600px] sm:h-[650px] md:h-[700px] lg:h-[750px] rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg relative">
                <MapComponent center={center} entregas={entregas} />
              </div>
            </div>

            {/* Sección: Gestión de Rutas y Entregas */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">
              {/* Header de Sección */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] rounded-xl flex items-center justify-center text-white shadow-sm">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Gestión de Rutas y Entregas</h2>
                    <p className="text-sm text-gray-600 mt-1">Programa y gestiona tus entregas diarias</p>
                  </div>
                </div>
              </div>

              {/* Selectores de Ruta y Conductor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {/* Selector de Ruta */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    <svg className="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    Ruta Establecida
                  </label>
                  <div className="flex space-x-2">
                    <select
                      value={rutaSeleccionada}
                      onChange={(e) => setRutaSeleccionada(e.target.value)}
                      className="custom-select flex-1 px-3 py-2 pr-8 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E63F7] focus:border-[#1E63F7] transition-all bg-white text-gray-900 text-sm font-medium shadow-sm hover:border-gray-400 appearance-none cursor-pointer"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%231E63F7'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 0.5rem center',
                        backgroundSize: '1.2em 1.2em'
                      }}
                    >
                      <option value="">Seleccione una ruta</option>
                      {rutasEstablecidas.map((ruta) => (
                        <option key={ruta.id} value={ruta.id}>
                          {ruta.nombre} - {ruta.distancia} ({ruta.tiempo})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        if (rutaSeleccionada) {
                          setEntregasProgramadas(entregasProgramadas.map(e => ({
                            ...e,
                            ruta: rutaSeleccionada
                          })));
                        }
                      }}
                      disabled={!rutaSeleccionada}
                      className="px-3 py-2 bg-[#1E63F7] text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-xs whitespace-nowrap"
                    >
                      Asignar a Todas
                    </button>
                  </div>
                </div>

                {/* Selector de Conductor */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    <svg className="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Conductor Asignado
                  </label>
                  <div className="flex space-x-2">
                    <select
                      value={conductorSeleccionado}
                      onChange={(e) => setConductorSeleccionado(e.target.value)}
                      className="custom-select flex-1 px-3 py-2 pr-8 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E63F7] focus:border-[#1E63F7] transition-all bg-white text-gray-900 text-sm font-medium shadow-sm hover:border-gray-400 appearance-none cursor-pointer"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%231E63F7'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 0.5rem center',
                        backgroundSize: '1.2em 1.2em'
                      }}
                    >
                      <option value="">Seleccione un conductor</option>
                      {conductores
                        .filter(cond => cond.disponible)
                        .map((conductor) => (
                          <option key={conductor.id} value={conductor.id}>
                            {conductor.nombre} - {conductor.vehiculo} ({conductor.placa})
                          </option>
                        ))}
                    </select>
                    <button
                      onClick={() => {
                        if (conductorSeleccionado) {
                          setEntregasProgramadas(entregasProgramadas.map(e => ({
                            ...e,
                            conductor: conductorSeleccionado
                          })));
                        }
                      }}
                      disabled={!conductorSeleccionado}
                      className="px-3 py-2 bg-[#1E63F7] text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-xs whitespace-nowrap"
                    >
                      Asignar a Todas
                    </button>
                  </div>
                </div>
              </div>

              {/* Estilos para las opciones del select */}
              <style jsx global>{`
                .custom-select option {
                  padding: 12px 16px;
                  font-size: 14px;
                  font-weight: 500;
                  background-color: white;
                  color: #1f2937;
                  border-bottom: 1px solid #e5e7eb;
                }
                .custom-select option:hover {
                  background-color: #f3f4f6;
                }
                .custom-select option:checked,
                .custom-select option:focus {
                  background-color: #1E63F7;
                  color: white;
                  font-weight: 600;
                }
                .custom-select option:first-child {
                  color: #9ca3af;
                  font-style: italic;
                }
              `}</style>

              {/* Lista de Entregas Programadas */}
              <div className="mb-4">
                <h3 className="text-base font-bold text-gray-900 mb-3">Entregas Programadas</h3>
                <div className="space-y-2">
                  {entregasProgramadas.map((entrega) => {
                    const getEstadoColor = (estado) => {
                      switch (estado) {
                        case "No entregado":
                          return "bg-red-100 text-red-800 border-red-200";
                        case "En espera":
                          return "bg-yellow-100 text-yellow-800 border-yellow-200";
                        case "Reprogramado":
                          return "bg-blue-100 text-blue-800 border-blue-200";
                        default:
                          return "bg-gray-100 text-gray-800 border-gray-200";
                      }
                    };

                    const getPrioridadColor = (prioridad) => {
                      switch (prioridad) {
                        case "Alta":
                          return "bg-red-500";
                        case "Media":
                          return "bg-yellow-500";
                        case "Baja":
                          return "bg-green-500";
                        default:
                          return "bg-gray-500";
                      }
                    };

                    const rutaInfo = rutasEstablecidas.find(r => r.id === entrega.ruta);
                    const conductorInfo = conductores.find(c => c.id === entrega.conductor);

                    return (
                      <div
                        key={entrega.id}
                        className="bg-white border-2 border-gray-200 rounded-lg p-3 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1.5">
                              <span className="font-bold text-sm text-gray-900">{entrega.codigo}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getEstadoColor(entrega.estado)}`}>
                                {entrega.estado}
                              </span>
                              <div className="flex items-center space-x-1">
                                <div className={`w-1.5 h-1.5 rounded-full ${getPrioridadColor(entrega.prioridad)}`}></div>
                                <span className="text-[10px] font-semibold text-gray-600">{entrega.prioridad} Prioridad</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                              <div>
                                <p className="text-[10px] text-gray-500 mb-0.5">Producto</p>
                                <p className="text-xs font-semibold text-gray-900">{entrega.producto}</p>
                                <p className="text-[10px] text-gray-600">Cantidad: {entrega.cantidad} unidades</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-500 mb-0.5">Cliente</p>
                                <p className="text-xs font-semibold text-gray-900">{entrega.cliente}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                              <div>
                                <p className="text-[10px] text-gray-500 mb-0.5">Fecha Programada</p>
                                <p className="text-xs font-semibold text-gray-900">{entrega.fechaProgramada}</p>
                                {entrega.fechaOriginal !== entrega.fechaProgramada && (
                                  <p className="text-[10px] text-red-600">Original: {entrega.fechaOriginal}</p>
                                )}
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-500 mb-0.5">Ruta</p>
                                <p className="text-xs font-semibold text-gray-900">{rutaInfo?.nombre || "Sin asignar"}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-500 mb-0.5">Conductor</p>
                                <p className="text-xs font-semibold text-gray-900">
                                  {conductorInfo ? `${conductorInfo.nombre} (${conductorInfo.placa})` : "Sin asignar"}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col space-y-2 ml-3">
                            <button
                              onClick={() => setEditingEntrega(entrega.id)}
                              className="px-2.5 py-1.5 bg-[#1E63F7] text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-opacity flex items-center space-x-1 whitespace-nowrap"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              <span>Editar</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal de Edición de Entrega */}
      <Modal
        isOpen={editingEntrega !== null}
        onClose={() => {
          setEditingEntrega(null);
          setEditForm({
            fechaProgramada: "",
            estado: "",
            prioridad: "",
            ruta: "",
            conductor: ""
          });
        }}
        title="Editar Entrega"
        size="lg"
      >
        {editingEntrega && (() => {
          const entrega = entregasProgramadas.find(e => e.id === editingEntrega);
          if (!entrega) return null;

          const hoy = new Date();
          const manana = new Date(hoy);
          manana.setDate(manana.getDate() + 1);
          const pasadoManana = new Date(hoy);
          pasadoManana.setDate(pasadoManana.getDate() + 2);

          const formatoFecha = (fecha) => {
            return fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
          };

          const opcionesFecha = [
            { label: "Hoy", value: formatoFecha(hoy) },
            { label: "Mañana", value: formatoFecha(manana) },
            { label: "Pasado Mañana", value: formatoFecha(pasadoManana) }
          ];

          return (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-1">Código: {entrega.codigo}</p>
                <p className="text-sm text-gray-600">{entrega.producto} - {entrega.cantidad} unidades</p>
                <p className="text-sm text-gray-600">Cliente: {entrega.cliente}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Fecha Programada */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fecha de Entrega
                  </label>
                  <select
                    value={editForm.fechaProgramada || entrega.fechaProgramada}
                    onChange={(e) => setEditForm({ ...editForm, fechaProgramada: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E63F7] focus:border-[#1E63F7] transition-all bg-white"
                  >
                    {opcionesFecha.map((opcion, index) => (
                      <option key={index} value={opcion.value}>
                        {opcion.label} - {opcion.value}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Estado */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Estado
                  </label>
                  <select
                    value={editForm.estado || entrega.estado}
                    onChange={(e) => setEditForm({ ...editForm, estado: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E63F7] focus:border-[#1E63F7] transition-all bg-white"
                  >
                    <option value="No entregado">No entregado</option>
                    <option value="En espera">En espera</option>
                    <option value="Reprogramado">Reprogramado</option>
                    <option value="Completada">Completada</option>
                  </select>
                </div>

                {/* Prioridad */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Prioridad
                  </label>
                  <select
                    value={editForm.prioridad || entrega.prioridad}
                    onChange={(e) => setEditForm({ ...editForm, prioridad: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E63F7] focus:border-[#1E63F7] transition-all bg-white"
                  >
                    <option value="Alta">Alta</option>
                    <option value="Media">Media</option>
                    <option value="Baja">Baja</option>
                  </select>
                </div>

                {/* Ruta */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ruta
                  </label>
                  <select
                    value={editForm.ruta || entrega.ruta}
                    onChange={(e) => setEditForm({ ...editForm, ruta: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E63F7] focus:border-[#1E63F7] transition-all bg-white"
                  >
                    <option value="">Seleccione una ruta</option>
                    {rutasEstablecidas.map((ruta) => (
                      <option key={ruta.id} value={ruta.id}>
                        {ruta.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Conductor */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Conductor
                  </label>
                  <select
                    value={editForm.conductor || entrega.conductor}
                    onChange={(e) => setEditForm({ ...editForm, conductor: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E63F7] focus:border-[#1E63F7] transition-all bg-white"
                  >
                    <option value="">Seleccione un conductor</option>
                    {conductores
                      .filter(cond => cond.disponible)
                      .map((conductor) => (
                        <option key={conductor.id} value={conductor.id}>
                          {conductor.nombre} - {conductor.vehiculo} ({conductor.placa})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setEditingEntrega(null);
                    setEditForm({
                      fechaProgramada: "",
                      estado: "",
                      prioridad: "",
                      ruta: "",
                      conductor: ""
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setEntregasProgramadas(entregasProgramadas.map(e => {
                      if (e.id === editingEntrega) {
                        return {
                          ...e,
                          fechaProgramada: editForm.fechaProgramada || e.fechaProgramada,
                          estado: editForm.estado || e.estado,
                          prioridad: editForm.prioridad || e.prioridad,
                          ruta: editForm.ruta || e.ruta,
                          conductor: editForm.conductor || e.conductor
                        };
                      }
                      return e;
                    }));
                    setEditingEntrega(null);
                    setEditForm({
                      fechaProgramada: "",
                      estado: "",
                      prioridad: "",
                      ruta: "",
                      conductor: ""
                    });
                  }}
                  className="px-4 py-2 bg-[#1E63F7] text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}

