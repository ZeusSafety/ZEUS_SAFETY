"use client";

import { useEffect, useState } from "react";

// Componente para el contenido del Popup
function PopupContent({ data }) {
  const { 
    codigo, 
    estado, 
    ubicacion, 
    producto, 
    cantidad, 
    hora, 
    fecha, 
    conductor, 
    vehiculo, 
    placa, 
    tieneIncidencias, 
    tipoIncidencia, 
    cliente, 
    distancia 
  } = data;

  const estadoColor = estado === "Completada" ? "bg-green-500" : estado === "En Tránsito" ? "bg-yellow-500" : "bg-red-500";
  const incidenciaColor = tieneIncidencias ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800";
  const incidenciaTexto = tieneIncidencias ? tipoIncidencia : "Sin Incidencias";

  return (
    <div className="p-0 m-0">
      {/* Header del Popup */}
      <div className="bg-gradient-to-r from-[#1E63F7] to-[#1E63F7] text-white p-2 rounded-t-lg">
        <div className="flex items-center justify-between mb-0.5">
          <h3 className="text-sm font-bold">{codigo}</h3>
          <span className={`${estadoColor} text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full`}>
            {estado}
          </span>
        </div>
        <p className="text-[10px] text-blue-100">{ubicacion}</p>
      </div>

      {/* Contenido del Popup */}
      <div className="p-2 bg-white space-y-1.5">
        {/* Información del Producto */}
        <div className="border-l-2 border-blue-500 pl-1.5">
          <div className="flex items-center space-x-1 mb-0.5">
            <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span className="text-[9px] font-semibold text-gray-500 uppercase">Producto</span>
          </div>
          <p className="text-[11px] font-semibold text-gray-900">{producto} ({cantidad} und)</p>
        </div>

        {/* Información de Entrega */}
        <div className="border-l-2 border-green-500 pl-1.5">
          <div className="flex items-center space-x-1 mb-0.5">
            <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[9px] font-semibold text-gray-500 uppercase">Entrega</span>
          </div>
          <p className="text-[11px] font-semibold text-gray-900">{hora} - {fecha}</p>
        </div>

        {/* Información del Conductor */}
        <div className="border-l-2 border-purple-500 pl-1.5">
          <div className="flex items-center space-x-1 mb-0.5">
            <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-[9px] font-semibold text-gray-500 uppercase">Conductor</span>
          </div>
          <p className="text-[11px] font-semibold text-gray-900">{conductor}</p>
          <p className="text-[9px] text-gray-600">{vehiculo} ({placa})</p>
        </div>

        {/* Estado de Incidencias */}
        <div className="border-l-2 border-yellow-500 pl-1.5">
          <div className="flex items-center space-x-1 mb-0.5">
            <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-[9px] font-semibold text-gray-500 uppercase">Incidencias</span>
          </div>
          <span className={`${incidenciaColor} text-[9px] font-semibold px-1.5 py-0.5 rounded-full inline-block`}>
            {incidenciaTexto}
          </span>
        </div>

        {/* Información Adicional */}
        <div className="bg-gray-50 rounded p-1.5 mt-1">
          <div className="flex items-start space-x-1">
            <svg className="w-3 h-3 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-[9px] font-semibold text-gray-700">Cliente: {cliente}</p>
              <p className="text-[9px] text-gray-500">Distancia: {distancia} km</p>
            </div>
          </div>
        </div>

        {/* Botón de Ver Detalles */}
        <button className="w-full mt-1.5 bg-gradient-to-r from-[#1E63F7] to-[#1E63F7] text-white py-1 px-2 rounded text-[10px] font-semibold hover:opacity-90 transition-opacity flex items-center justify-center space-x-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span>Ver Detalles</span>
        </button>
      </div>
    </div>
  );
}

export default function MapComponent({ center, entregas }) {
  const [MapRenderer, setMapRenderer] = useState(null);

  useEffect(() => {
    // Cargar react-leaflet dinámicamente
    Promise.all([
      import("react-leaflet"),
      import("leaflet")
    ]).then(([reactLeaflet, L]) => {
      // Fix para los iconos de Leaflet en Next.js
      delete L.default.Icon.Default.prototype._getIconUrl;
      L.default.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      });

      const { MapContainer, TileLayer, Marker, Popup, useMap } = reactLeaflet;

      // Componentes de zoom que usan useMap (deben estar dentro de MapContainer)
      function ZoomInButton() {
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
      }

      function ZoomOutButton() {
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
      }

      // Componente contenedor de controles de zoom (debe estar dentro de MapContainer)
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

      // Crear componente renderer
      function MapRendererComponent({ center, entregas }) {
        return (
          <>
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
              {entregas.map((entrega, index) => (
                <Marker key={index} position={entrega.position}>
                  <Popup className="custom-popup" maxWidth={240} minWidth={220}>
                    <PopupContent data={entrega} />
                  </Popup>
                </Marker>
              ))}
              <CustomZoomControl />
            </MapContainer>
            {/* Estilos personalizados para ocultar controles de Leaflet y personalizar popup */}
            <style jsx global>{`
              .leaflet-control-zoom {
                display: none !important;
              }
              .custom-popup .leaflet-popup-content-wrapper {
                border-radius: 12px;
                padding: 0;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
              }
              .custom-popup .leaflet-popup-content {
                margin: 0;
                padding: 0;
              }
              .custom-popup .leaflet-popup-tip {
                background: white;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
              }
            `}</style>
          </>
        );
      }

      setMapRenderer(() => MapRendererComponent);
    });
  }, []);

  if (!MapRenderer) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  return <MapRenderer center={center} entregas={entregas} />;
}
