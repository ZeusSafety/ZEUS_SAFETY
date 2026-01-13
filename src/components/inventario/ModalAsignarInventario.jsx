"use client";

import { useState, useEffect } from "react";
import * as inventarioApi from "../../services/inventarioApi";
import { fmt12 } from "../../utils/inventarioUtils";

const JEFE_PWD = "0427";

export function ModalAsignarInventario({ isOpen, onClose, onSuccess }) {
  const [password, setPassword] = useState("");
  const [numero, setNumero] = useState("");
  const [area, setArea] = useState("Administración");
  const [persona, setPersona] = useState("");
  const [personaOtro, setPersonaOtro] = useState("");
  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      cargarColaboradores();
      setPassword("");
      setNumero("");
      setArea("Administración");
      setPersona("");
      setPersonaOtro("");
    }
  }, [isOpen]);

  const cargarColaboradores = async () => {
    try {
      const data = await inventarioApi.colaboradoresInventario("INVENTARIO");
      setColaboradores(data || []);
    } catch (error) {
      console.error("Error cargando colaboradores:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== JEFE_PWD) {
      alert("Contraseña incorrecta");
      return;
    }

    if (!numero.trim()) {
      alert("Ingrese el N° de inventario");
      return;
    }

    const personaNombre = persona === "Otro" ? personaOtro.trim() : colaboradores.find(c => c.ID === persona)?.NOMBRE || "";
    
    if (!personaNombre) {
      alert("Seleccione o ingrese una persona autorizada");
      return;
    }

    try {
      setLoading(true);
      await inventarioApi.insertarNumeroInventario({
        nombre: numero.trim(),
        area: area.toUpperCase(),
        autorizado_por: persona === "Otro" ? personaNombre : persona,
      });

      // Obtener el ID del inventario creado
      const inventarioId = await inventarioApi.obtenerIdInventario(numero.trim());

      if (onSuccess) {
        onSuccess({
          numero: numero.trim(),
          creadoPor: `${area} • ${personaNombre}`,
          inicio: fmt12(),
          activo: true,
          inventarioId: inventarioId,
        });
      }

      onClose();
    } catch (error) {
      alert("Error al guardar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Asignar N° de Inventario</h2>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña de Jefe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">N° de Inventario</label>
              <input
                type="text"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                placeholder="INV-2026-PRUEBA"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Área</label>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              >
                <option value="Administración">Administración</option>
                <option value="Logística">Logística</option>
                <option value="Ventas">Ventas</option>
                <option value="Marketing">Marketing</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Autorizado por</label>
              <select
                value={persona}
                onChange={(e) => {
                  setPersona(e.target.value);
                  const otroContainer = document.getElementById("inv-otro-container");
                  if (otroContainer) {
                    otroContainer.classList.toggle("hidden", e.target.value !== "Otro");
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                required
              >
                <option value="">Seleccione...</option>
                {colaboradores.map((col) => (
                  <option key={col.ID} value={col.ID}>
                    {col.NOMBRE}
                  </option>
                ))}
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div id="inv-otro-container" className={persona === "Otro" ? "" : "hidden"}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input
                type="text"
                value={personaOtro}
                onChange={(e) => setPersonaOtro(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                placeholder="Dhilsen"
                required={persona === "Otro"}
              />
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
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gradient-to-br from-blue-700 to-blue-800 text-white rounded-lg hover:from-blue-800 hover:to-blue-900 disabled:opacity-50"
              >
                {loading ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
