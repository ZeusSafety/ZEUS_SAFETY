"use client";

import { useRef } from "react";
import { leerArchivoGenerico, normalizarClave, toNumberSafe, toast } from "../../utils/inventarioUtils";

export function CargarProductos({ onProductosCargados }) {
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const datos = await leerArchivoGenerico(file);
      
      const productos = (datos || []).map((r, i) => {
        const m = {};
        Object.keys(r || {}).forEach((k) => {
          m[normalizarClave(k)] = r[k];
        });
        
        return {
          item: Number(m.item || i + 1),
          producto: m.producto || m.nombre || m.nombre_producto || m.descripcion || "",
          codigo: (m.codigo || m.cod || m.sku || "").toString().trim(),
          unidad_medida: m.unidad_medida || m.um || "UNI",
          cantidad_sistema: Number(m.cantidad_sistema || m.sistema || m.stock || 0),
        };
      }).filter((p) => p.codigo);

      if (onProductosCargados) {
        onProductosCargados(productos);
      }

      toast(`Productos cargados correctamente: ${productos.length} productos`, "success");
      e.target.value = "";
    } catch (error) {
      console.error("Error cargando productos:", error);
      alert("Error al cargar productos: " + error.message);
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv,.json"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="px-4 py-2 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all font-semibold text-sm"
      >
        Cargar Productos
      </button>
    </>
  );
}
