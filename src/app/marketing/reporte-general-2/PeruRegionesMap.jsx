"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

// --- CONFIGURACIÓN Y UTILIDADES ---
const GEOJSON_URL = "https://raw.githubusercontent.com/juaneladio/peru-geojson/master/peru_departamental_simple.geojson";
const PERU_CENTER = [-9.19, -75.02];

const norm = (s) => (!s ? "" : s.toUpperCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").trim());
const lerp = (a, b, t) => Math.round(a + (b - a) * t);

function getValueByRegion(regiones, name) {
  const n = norm(name);
  const r = regiones.find((x) => norm(x.name) === n);
  return r ? Number(r.value) || 0 : 0;
}

// --- COMPONENTE INTERNO (Lógica Leaflet) ---
// Este componente solo se carga en el cliente
const MapInner = ({ regiones, selectedRegion, onSelectRegion, geoJson }) => {
  const { MapContainer, TileLayer, GeoJSON, useMap } = require("react-leaflet");
  const L = require("leaflet");

  // Ajustar el mapa al GeoJSON
  function FitBounds({ geo }) {
    const map = useMap();
    useEffect(() => {
      if (!geo?.features?.length) return;
      const layer = L.geoJSON(geo);
      const bounds = layer.getBounds();
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20], maxZoom: 6 });
    }, [map, geo]);
    return null;
  }

  const values = useMemo(() => {
    return (geoJson?.features || []).map((f) => {
      const name = f?.properties?.NOMBDEP ?? f?.properties?.NAME ?? "";
      return getValueByRegion(regiones, name);
    });
  }, [geoJson, regiones]);

  const maxVal = Math.max(1, ...values);
  const minVal = Math.min(0, ...values);
  const span = maxVal - minVal || 1;

  const style = (feature) => {
    const name = feature?.properties?.NOMBDEP ?? feature?.properties?.NAME ?? "";
    const val = getValueByRegion(regiones, name);
    const isSelected = selectedRegion && norm(selectedRegion) === norm(name);
    
    let fillColor = "#f3f4f6"; // Gris suave por defecto
    if (val > 0) {
      const t = (val - minVal) / span;
      // Gradiente de azul moderno
      fillColor = `rgb(${lerp(219, 37, t)}, ${lerp(234, 99, t)}, ${lerp(254, 235, t)})`;
    }
    if (isSelected) fillColor = "#E5A017"; // Ámbar para selección

    return {
      weight: isSelected ? 2 : 0.8,
      color: isSelected ? "#002D5A" : "#cbd5e1",
      fillColor,
      fillOpacity: 0.9,
    };
  };

  const onEachFeature = (feature, layer) => {
    const name = feature?.properties?.NOMBDEP ?? feature?.properties?.NAME ?? "";
    const val = getValueByRegion(regiones, name);

    layer.bindTooltip(`
      <div class="px-2 py-1">
        <div class="text-[10px] uppercase font-bold text-gray-400">${name}</div>
        <div class="text-sm font-bold text-gray-800">${val.toLocaleString("es-PE")}</div>
      </div>
    `, { sticky: true, className: "custom-tooltip" });

    layer.on({
      click: () => onSelectRegion?.(norm(selectedRegion) === norm(name) ? null : name),
      mouseover: (e) => e.target.setStyle({ fillOpacity: 1, weight: 1.5 }),
      mouseout: (e) => e.target.setStyle({ fillOpacity: 0.9, weight: 0.8 })
    });
  };

  return (
    <MapContainer
      center={PERU_CENTER}
      zoom={5}
      className="h-full w-full outline-none"
      attributionControl={false}
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
      {geoJson && <GeoJSON data={geoJson} style={style} onEachFeature={onEachFeature} />}
      <FitBounds geo={geoJson} />
    </MapContainer>
  );
};

// --- COMPONENTE PRINCIPAL CON SSR: FALSE ---
export default function PeruRegionesMap(props) {
  const [geoJson, setGeoJson] = useState(null);

  useEffect(() => {
    fetch(GEOJSON_URL)
      .then((r) => r.json())
      .then(setGeoJson)
      .catch(() => console.error("Error cargando GeoJSON"));
  }, []);

  if (props.loading || !geoJson) {
    return (
      <div className="w-full h-[400px] rounded-2xl bg-gray-50 animate-pulse flex flex-col items-center justify-center border border-gray-100">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <span className="text-sm font-medium text-gray-400">Preparando mapa regional...</span>
      </div>
    );
  }

  return (
    <div className="w-full h-[400px] rounded-2xl overflow-hidden border border-gray-200 shadow-sm relative bg-white">
      <MapInner {...props} geoJson={geoJson} />
      
      {/* Mini Leyenda Flotante */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-lg border border-gray-100 text-[10px] shadow-sm z-[1000]">
        <div className="font-bold text-gray-500 mb-1 uppercase tracking-tighter">Intensidad</div>
        <div className="h-2 w-24 bg-gradient-to-r from-blue-50 to-blue-700 rounded-full"></div>
      </div>
    </div>
  );
}