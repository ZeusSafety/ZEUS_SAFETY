"use client";

import { useState, useEffect } from "react";
import * as inventarioApi from "../../services/inventarioApi";

export function ModalUnirseInventario({ isOpen, onClose, onSuccess }) {
  const [inventarios, setInventarios] = useState([]);
  const [selectedInventario, setSelectedInventario] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      cargarInventarios();
      setSelectedInventario("");
    }
  }, [isOpen]);

  const cargarInventarios = async () => {
    try {
      setLoading(true);
      const data = await inventarioApi.listarInventarios();
      setInventarios(data || []);
    } catch (error) {
      console.error("Error cargando inventarios:", error);
      alert("Error al cargar inventarios: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedInventario) {
      alert("Seleccione un inventario");
      return;
    }

    const inventario = inventarios.find((inv) => inv.NOMBRE === selectedInventario);
    
    if (onSuccess) {
      onSuccess({
        numero: selectedInventario,
        inventarioId: inventario?.ID || null,
        creadoPor: inventario ? `${inventario.AREA} • ${inventario.AUTORIZADO_POR}` : null,
        inicio: inventario?.FECHA_REGISTRO || null,
        activo: true,
      });
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Unirse a Inventario</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-all duration-200 text-gray-500 hover:text-gray-700 hover:scale-110 active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Seleccione un inventario</label>
              <select
                value={selectedInventario}
                onChange={(e) => setSelectedInventario(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                required
                disabled={loading}
              >
                <option value="">Seleccione un inventario...</option>
                {inventarios.map((inv) => (
                  <option key={inv.ID} value={inv.NOMBRE}>
                    {inv.NOMBRE} - {inv.AREA} - {inv.FECHA_REGISTRO}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !selectedInventario}
                className="flex-1 px-4 py-2 bg-gradient-to-br from-blue-700 to-blue-800 text-white rounded-lg hover:from-blue-800 hover:to-blue-900 disabled:opacity-50"
              >
                {loading ? "Cargando..." : "Unirse"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
