"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/context/AuthContext";
import { Header } from "../../components/layout/Header";
import { Sidebar } from "../../components/layout/Sidebar";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

// Importar MapContainer dinámicamente para evitar problemas de SSR
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });

// Componentes de zoom que usan useMap (deben estar dentro de MapContainer)
const ZoomInButton = dynamic(() => import("react-leaflet").then((mod) => {
  const { useMap } = mod;
  return function ZoomInButton() {
    const map = useMap();
    return (
      <button
        onClick={() => map.zoomIn()}
        className="w-10 h-10 bg-white hover:bg-[#1E63F7] text-[#1E63F7] hover:text-white rounded-lg shadow-lg border-2 border-gray-200 hover:border-[#1E63F7] flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 group backdrop-blur-sm"
        aria-label="Acercar"
        style={{ boxShadow: '0 4px 12px rgba(30, 99, 247, 0.15)' }}
      >
        <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    );
  };
}), { ssr: false });

const ZoomOutButton = dynamic(() => import("react-leaflet").then((mod) => {
  const { useMap } = mod;
  return function ZoomOutButton() {
    const map = useMap();
    return (
      <button
        onClick={() => map.zoomOut()}
        className="w-10 h-10 bg-white hover:bg-[#1E63F7] text-[#1E63F7] hover:text-white rounded-lg shadow-lg border-2 border-gray-200 hover:border-[#1E63F7] flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 backdrop-blur-sm"
        aria-label="Alejar"
        style={{ boxShadow: '0 4px 12px rgba(30, 99, 247, 0.15)' }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
        </svg>
      </button>
    );
  };
}), { ssr: false });

// Componente contenedor de controles de zoom
function CustomZoomControl() {
  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2 pointer-events-none">
      <div className="pointer-events-auto">
        <ZoomInButton />
      </div>
      <div className="pointer-events-auto">
        <ZoomOutButton />
      </div>
    </div>
  );
}

export default function SeguimientoMonitoreoPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  // Fix para los iconos de Leaflet en Next.js
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("leaflet").then((L) => {
        delete L.default.Icon.Default.prototype._getIconUrl;
        L.default.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        });
      });
    }
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
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
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
                {typeof window !== "undefined" && (
                  <MapContainer
                    center={center}
                    zoom={13}
                    style={{ height: "100%", width: "100%", zIndex: 1 }}
                    scrollWheelZoom={true}
                    attributionControl={false}
                    zoomControl={false}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={center} />
                    <CustomZoomControl />
                  </MapContainer>
                )}
                {/* Estilos personalizados para ocultar controles de Leaflet */}
                <style jsx global>{`
                  .leaflet-control-zoom {
                    display: none !important;
                  }
                `}</style>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

