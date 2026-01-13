"use client";

import { createContext, useContext, useState, useEffect } from "react";

const InventarioContext = createContext();

export function InventarioProvider({ children }) {
  // Estado de sesión actual
  const [sesionActual, setSesionActual] = useState({
    numero: null,
    creadoPor: null,
    inicio: null,
    activo: false,
    inventarioId: null,
  });

  // Productos
  const [productos, setProductos] = useState([]);

  // Sesiones de inventario por almacén
  const [sesiones, setSesiones] = useState({
    callao: [],
    malvinas: [],
  });

  // Datos del sistema (Excel cargado)
  const [sistema, setSistema] = useState({
    callao: [],
    malvinas: [],
  });

  // Comparación actual
  const [comparacion, setComparacion] = useState({
    almacen: null,
    filas: [],
  });

  // Proformas
  const [proformas, setProformas] = useState([]);

  // Acciones (trazabilidad)
  const [acciones, setAcciones] = useState([]);

  // Paginación
  const [paginacion, setPaginacion] = useState({
    callao: { pagina: 1, porPagina: 50 },
    malvinas: { pagina: 1, porPagina: 50 },
  });

  // Filtros
  const [filtro, setFiltro] = useState({
    ocultarCero: false,
    excluirCodigos: [],
  });

  // Cargar desde localStorage al iniciar
  useEffect(() => {
    try {
      const stored = localStorage.getItem("inventario_state");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.sesionActual) setSesionActual(parsed.sesionActual);
        if (parsed.productos) setProductos(parsed.productos);
        if (parsed.sesiones) setSesiones(parsed.sesiones);
        if (parsed.sistema) setSistema(parsed.sistema);
        if (parsed.comparacion) setComparacion(parsed.comparacion);
        if (parsed.proformas) setProformas(parsed.proformas);
        if (parsed.acciones) setAcciones(parsed.acciones);
        if (parsed.paginacion) setPaginacion(parsed.paginacion);
        if (parsed.filtro) setFiltro(parsed.filtro);
      }
    } catch (e) {
      console.warn("Error cargando estado desde localStorage:", e);
    }
  }, []);

  // Guardar en localStorage cuando cambie el estado
  useEffect(() => {
    try {
      const state = {
        sesionActual,
        productos,
        sesiones,
        sistema,
        comparacion,
        proformas,
        acciones,
        paginacion,
        filtro,
      };
      localStorage.setItem("inventario_state", JSON.stringify(state));
    } catch (e) {
      console.warn("Error guardando estado en localStorage:", e);
    }
  }, [sesionActual, productos, sesiones, sistema, comparacion, proformas, acciones, paginacion, filtro]);

  const value = {
    sesionActual,
    setSesionActual,
    productos,
    setProductos,
    sesiones,
    setSesiones,
    sistema,
    setSistema,
    comparacion,
    setComparacion,
    proformas,
    setProformas,
    acciones,
    setAcciones,
    paginacion,
    setPaginacion,
    filtro,
    setFiltro,
  };

  return <InventarioContext.Provider value={value}>{children}</InventarioContext.Provider>;
}

export function useInventario() {
  const context = useContext(InventarioContext);
  if (!context) {
    throw new Error("useInventario debe usarse dentro de InventarioProvider");
  }
  return context;
}
