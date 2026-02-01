"use client";

import { useEffect, useState, useMemo } from "react";

const norm = (s) => (!s ? "" : s.toUpperCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").trim());

const GEOJSON_URL = "https://raw.githubusercontent.com/juaneladio/peru-geojson/master/peru_departamental_simple.geojson";

function getValueByRegion(regiones, name) {
  const n = norm(name);
  const r = regiones.find((x) => norm(x.name) === n);
  return r ? Number(r.value) || 0 : 0;
}

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

// Transforma coordenadas geográficas a coordenadas SVG (proyección simple)
function project(lng, lat, bounds) {
  const x = ((lng - bounds.minX) / (bounds.maxX - bounds.minX)) * 1000;
  const y = ((bounds.maxY - lat) / (bounds.maxY - bounds.minY)) * 1000;
  return { x, y };
}

// Convierte GeoJSON a paths SVG
function geoJsonToSVGPath(geoJson, bounds) {
  if (!geoJson?.features) return [];
  return geoJson.features.map((feature) => {
    const name = feature?.properties?.NOMBDEP ?? feature?.properties?.NAME ?? "";
    const geometry = feature?.geometry;
    if (!geometry || (geometry.type !== "Polygon" && geometry.type !== "MultiPolygon")) return null;

    let pathStrings = [];
    const processRing = (ring) => {
      if (!ring || ring.length < 2) return "";
      const points = ring
        .map(([lng, lat]) => {
          const { x, y } = project(lng, lat, bounds);
          return `${x},${y}`;
        })
        .join(" ");
      return `M ${points} Z`;
    };

    if (geometry.type === "Polygon") {
      pathStrings = geometry.coordinates.map(processRing).filter(Boolean);
    } else if (geometry.type === "MultiPolygon") {
      pathStrings = geometry.coordinates.flatMap((polygon) => polygon.map(processRing)).filter(Boolean);
    }

    return pathStrings.length > 0 ? { name, paths: pathStrings.join(" ") } : null;
  }).filter(Boolean);
}

const MAP_HEIGHT = 580;

export default function PeruSVGMap({ regiones = [], loading, selectedRegion, onSelectRegion }) {
  const [geoJson, setGeoJson] = useState(null);
  const [svgPaths, setSvgPaths] = useState([]);
  const [bounds, setBounds] = useState({ minX: 0, minY: 0, maxX: 1000, maxY: 1000 });
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    fetch(GEOJSON_URL)
      .then((r) => r.json())
      .then((data) => {
        setGeoJson(data);

        // Calcular bounds primero
        let minX = Infinity,
          minY = Infinity,
          maxX = -Infinity,
          maxY = -Infinity;
        if (data?.features?.length) {
          const extractAllCoords = (coords, type) => {
            const all = [];
            if (type === "Polygon") {
              coords.forEach((ring) => {
                if (Array.isArray(ring) && ring[0] && Array.isArray(ring[0])) {
                  ring.forEach(([lng, lat]) => {
                    if (typeof lng === "number" && typeof lat === "number") all.push([lng, lat]);
                  });
                }
              });
            } else if (type === "MultiPolygon") {
              coords.forEach((polygon) => {
                if (Array.isArray(polygon)) {
                  polygon.forEach((ring) => {
                    if (Array.isArray(ring) && ring[0] && Array.isArray(ring[0])) {
                      ring.forEach(([lng, lat]) => {
                        if (typeof lng === "number" && typeof lat === "number") all.push([lng, lat]);
                      });
                    }
                  });
                }
              });
            }
            return all;
          };
          data.features.forEach((f) => {
            const geom = f.geometry;
            if (geom?.coordinates && (geom.type === "Polygon" || geom.type === "MultiPolygon")) {
              const coords = extractAllCoords(geom.coordinates, geom.type);
              coords.forEach(([lng, lat]) => {
                minX = Math.min(minX, lng);
                minY = Math.min(minY, lat);
                maxX = Math.max(maxX, lng);
                maxY = Math.max(maxY, lat);
              });
            }
          });
        }
        const calculatedBounds = { minX, minY, maxX, maxY };
        setBounds(calculatedBounds);

        // Convertir a paths SVG
        const paths = geoJsonToSVGPath(data, calculatedBounds);
        setSvgPaths(paths);
      })
      .catch(() => console.error("Error cargando GeoJSON"));
  }, []);

  const values = useMemo(() => {
    return svgPaths.map((p) => getValueByRegion(regiones, p.name));
  }, [svgPaths, regiones]);

  const maxVal = Math.max(1, ...values);
  const minVal = Math.min(0, ...values);
  const span = maxVal - minVal || 1;

  const getRegionColor = (regionName, val) => {
    const isSelected = selectedRegion && norm(selectedRegion) === norm(regionName);
    if (isSelected) return "#E5A017";
    if (val === 0) return "#f3f4f6";
    const t = span > 0 ? (val - minVal) / span : 0;
    const r = lerp(219, 37, t);
    const g = lerp(234, 99, t);
    const b = lerp(254, 235, t);
    return `rgb(${r}, ${g}, ${b})`;
  };

  if (loading || !geoJson || svgPaths.length === 0) {
    return (
      <div className="w-full rounded-2xl bg-gray-50 animate-pulse flex flex-col items-center justify-center border border-gray-100" style={{ height: MAP_HEIGHT }}>
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <span className="text-sm font-medium text-gray-400">Preparando mapa regional...</span>
      </div>
    );
  }

  const viewBox = `0 0 1000 1000`;

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white relative" style={{ height: MAP_HEIGHT }}>
      <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="xMidYMid meet" style={{ cursor: "pointer" }}>
        {svgPaths.map((region, idx) => {
          const val = getValueByRegion(regiones, region.name);
          const isSelected = selectedRegion && norm(selectedRegion) === norm(region.name);
          const fillColor = getRegionColor(region.name, val);

          return (
            <g
              key={`${region.name}-${idx}`}
              onMouseEnter={() => setHovered({ name: region.name, value: val })}
              onMouseLeave={() => setHovered(null)}
            >
              <path
                d={region.paths}
                fill={fillColor}
                stroke={isSelected ? "#002D5A" : "#cbd5e1"}
                strokeWidth={isSelected ? 2.5 : 0.8}
                opacity={0.9}
                className="transition-all duration-200 hover:opacity-100 hover:stroke-[#002D5A]"
                onClick={() => onSelectRegion?.(region.name)}
                style={{ cursor: "pointer" }}
              />
            </g>
          );
        })}
      </svg>
      {hovered && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 px-5 py-3 rounded-xl shadow-xl border-2 border-[#002D5A]/20 bg-white/95 backdrop-blur-sm"
          style={{ fontFamily: "var(--font-poppins)" }}
        >
          <div className="text-sm font-bold text-[#002D5A]">{hovered.name}</div>
          <div className="text-xs text-gray-600 mt-0.5">
            {hovered.value > 0 ? `Cantidad: ${hovered.value}` : "Sin datos"}
          </div>
        </div>
      )}
    </div>
  );
}
