"use client";

import { useEffect, useState, useMemo } from "react";
import "leaflet/dist/leaflet.css";

const GEOJSON_URL =
  "https://raw.githubusercontent.com/juaneladio/peru-geojson/master/peru_departamental_simple.geojson";
const PERU_CENTER = [-9.19, -75.02];
const PERU_ZOOM = 5;

function norm(s) {
  if (!s || typeof s !== "string") return "";
  return s
    .toUpperCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

function getValueByRegion(regiones, name) {
  const n = norm(name);
  const r = regiones.find((x) => norm(x.name) === n);
  return r ? Number(r.value) || 0 : 0;
}

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

export default function PeruRegionesMap({ regiones = [], loading, selectedRegion, onSelectRegion }) {
  const [geoJson, setGeoJson] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [MapRoot, setMapRoot] = useState(null);

  useEffect(() => {
    fetch(GEOJSON_URL)
      .then((r) => r.json())
      .then(setGeoJson)
      .catch(() => setGeoJson({ type: "FeatureCollection", features: [] }));
  }, []);

  useEffect(() => {
    Promise.all([import("react-leaflet"), import("leaflet")]).then(([reactLeaflet, leafletModule]) => {
      const L = leafletModule.default ?? leafletModule;
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      });
      const { MapContainer, TileLayer, GeoJSON, useMap } = reactLeaflet;

      function FitBounds({ geo }) {
        const map = useMap();
        useEffect(() => {
          if (!geo?.features?.length) return;
          const layer = L.geoJSON(geo);
          const bounds = layer.getBounds();
          if (bounds.isValid()) map.fitBounds(bounds, { padding: [12, 12], maxZoom: 6 });
        }, [map, geo]);
        return null;
      }

      function MapRootComponent({ regiones: reg, selectedRegion: sel, onSelectRegion: onSel, geoJson: geo }) {
        const values = useMemo(() => {
          return (geo?.features || []).map((f) => {
            const name = f?.properties?.NOMBDEP ?? f?.properties?.DEPARTAMEN ?? f?.properties?.NAME ?? "";
            return getValueByRegion(reg, name);
          });
        }, [geo, reg]);
        const maxVal = Math.max(1, ...values);
        const minVal = Math.min(0, ...values);
        const span = maxVal - minVal || 1;

        const style = (feature) => {
          const name = feature?.properties?.NOMBDEP ?? feature?.properties?.DEPARTAMEN ?? feature?.properties?.NAME ?? "";
          const val = getValueByRegion(reg, name);
          const isSelected = sel && norm(sel) === norm(name);
          let fillColor = "#e5e7eb";
          if (val > 0) {
            const t = span > 0 ? (val - minVal) / span : 0;
            const r = lerp(147, 29, t);
            const g = lerp(197, 78, t);
            const b = lerp(253, 216, t);
            fillColor = `rgb(${r}, ${g}, ${b})`;
          }
          if (isSelected) fillColor = "#E5A017";
          return {
            weight: isSelected ? 2.5 : 1,
            color: isSelected ? "#002D5A" : "#94a3b8",
            fillColor,
            fillOpacity: 0.85,
          };
        };

        const onEachFeature = (feature, layer) => {
          const name = feature?.properties?.NOMBDEP ?? feature?.properties?.DEPARTAMEN ?? feature?.properties?.NAME ?? "";
          const val = getValueByRegion(reg, name);
          layer.bindTooltip(`${name}: ${val.toLocaleString("es-PE")}`, {
            permanent: false,
            direction: "top",
            className: "font-medium text-xs bg-white border border-gray-200 rounded shadow-sm px-2 py-1",
          });
          layer.on({
            click: () => {
              if (onSel) onSel(norm(sel) === norm(name) ? null : name);
            },
          });
        };

        return (
          <MapContainer
            center={PERU_CENTER}
            zoom={PERU_ZOOM}
            style={{ height: "100%", width: "100%", borderRadius: 12 }}
            scrollWheelZoom={true}
            attributionControl={false}
            zoomControl={true}
          >
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
            {geo && <GeoJSON key="peru-regiones" data={geo} style={style} onEachFeature={onEachFeature} />}
            <FitBounds geo={geo} />
          </MapContainer>
        );
      }

      setMapRoot(() => MapRootComponent);
      setMapReady(true);
    });
  }, []);

  if (loading || !mapReady) {
    return (
      <div className="w-full h-64 rounded-xl bg-gray-100 animate-pulse flex items-center justify-center">
        <span className="text-sm text-gray-500">Cargando mapa…</span>
      </div>
    );
  }

  if (!MapRoot || !geoJson) {
    return (
      <div className="w-full h-64 rounded-xl bg-gray-100 flex items-center justify-center">
        <span className="text-sm text-gray-500">Sin datos de mapa</span>
      </div>
    );
  }

  return (
    <div className="w-full h-64 rounded-xl overflow-hidden border border-gray-200">
      <MapRoot
        regiones={regiones}
        selectedRegion={selectedRegion}
        onSelectRegion={onSelectRegion}
        geoJson={geoJson}
      />
    </div>
  );
}
