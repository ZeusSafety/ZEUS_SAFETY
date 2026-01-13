/**
 * Módulo de Vista Malvinas
 * 
 * Contiene toda la lógica relacionada con la vista de Almacén Malvinas.
 * Similar a Callao pero con manejo de tiendas.
 */

import { AppState } from '../state.js';
import { $, toast } from '../utils.js';
import { TIENDAS } from '../config.js';
import { cargarConteosMalvinas } from '../api/inventario.js';
import { mostrarTablaInventario, renderPaginaInventario, renderListado } from './callao.js';

/**
 * Cargar tiendas de Malvinas desde la API
 */
export async function cargarTiendasMalvinas() {
  let tiendas = [];

  try {
    console.log('Cargando tiendas de Malvinas desde API...');
    
    const api = "https://inventario-2946605267.us-central1.run.app";
    const method = "colaboradores_imventario";
    const selector = "TIENDAS_MALVINAS";
    
    const response = await fetch(`${api}?method=${method}&selector=${selector}`);
    
    if (response.status !== 200) {
      const errorText = await response.text();
      throw new Error(`Error HTTP: ${response.status} - ${errorText}`);
    }
    
    tiendas = await response.json();
    console.log('Tiendas de Malvinas cargadas desde API:', tiendas);
  } catch (error) {
    console.error('Error cargando tiendas de Malvinas:', error);
    toast('Error al cargar tiendas de Malvinas', 'error');
  }

  if (!Array.isArray(tiendas)) {
    tiendas = [];
  }

  if (tiendas.length === 0) {
    tiendas = TIENDAS.map((nombre, idx) => ({
      ID: `local_${idx}`,
      NOMBRE: nombre
    }));
  }
  
  // Actualizar el select de tiendas en el modal
  const selectTienda = $('#inv-tienda');
  if (selectTienda) {
    selectTienda.innerHTML = '<option value="">Seleccione una tienda...</option>';
    
    tiendas.forEach(tienda => {
      const option = document.createElement('option');
      option.value = tienda.NOMBRE;
      option.textContent = tienda.NOMBRE;
      option.dataset.id = tienda.ID; // Guardar el ID de la tienda
      selectTienda.appendChild(option);
    });

    if (tiendas.length === 0) {
      selectTienda.innerHTML = '<option value="">No hay tiendas disponibles</option>';
    }
  }

  renderTiendas();
  console.log(`Cargadas ${tiendas.length} tiendas para Malvinas`);
  return tiendas;
}

/**
 * Obtener estado de una tienda
 */
export function getTiendaStatus(tienda) {
  const ses = (AppState.sesiones.malvinas || []).filter(s => s.tienda === tienda);
  if (ses.some(s => s.fin)) return 'listo';
  if (ses.length > 0) return 'en_proceso';
  return 'pendiente';
}

/**
 * Renderizar estado de tiendas
 */
export function renderTiendas() {
  const cont = $('status-tiendas');
  if (!cont) return;
  
  cont.innerHTML = '';
  TIENDAS.forEach(t => {
    const estado = getTiendaStatus(t);
    const dot = estado === 'listo' ? 'status-green' :
      (estado === 'en_proceso' ? 'status-orange' : 'status-red');
    const el = document.createElement('div');
    el.innerHTML = `<span class="status-dot ${dot}"></span>${t}`;
    cont.appendChild(el);
  });
}

/**
 * Actualizar estado de tiendas
 */
export function setTiendaStatus(tienda, estado) {
  renderTiendas();
}

// Re-exportar funciones de callao que también se usan en malvinas
export { mostrarTablaInventario, renderPaginaInventario, renderListado };

// Exportar funciones para uso global (temporal hasta que se cree main.js)
window.cargarTiendasMalvinas = cargarTiendasMalvinas;
window.getTiendaStatus = getTiendaStatus;
window.renderTiendas = renderTiendas;
window.setTiendaStatus = setTiendaStatus;

