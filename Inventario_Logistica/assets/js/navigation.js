/**
 * Módulo de Navegación
 * 
 * Gestiona la navegación entre vistas del dashboard.
 */

import { qa, $ } from './utils.js';
import { cargarConteosCallao, cargarConteosMalvinas } from './api/inventario.js';
import { cargarTiendasMalvinas } from './views/malvinas.js';
import { renderConsolidado } from './views/consolidado.js';
import { cargarTodoSeguimiento } from './views/seguimiento.js';
// Nota: renderRegistro y renderListadoProformas se importarán cuando se creen esos módulos

/**
 * Mostrar una vista específica
 */
export function showView(v) {
  // Actualizar navegación activa
  qa('.sidebar .nav-item').forEach(link => {
    link.classList.toggle('active', link.getAttribute('data-view') === v);
  });
  
  // Mostrar/ocultar vistas
  ['callao', 'malvinas', 'comparar', 'consolidado', 'registro', 'proformas', 'logistica', 'facturacion', 'gerencia'].forEach(id => {
    const el = $(`view-${id}`);
    if (el) el.classList.toggle('invis', id !== v);
  });
  
  // Acciones específicas por vista
  if (v === 'callao') {
    // Cargar conteos de Callao desde la API automáticamente
    cargarConteosCallao();
  }
  
  if (v === 'malvinas') {
    // Cargar tiendas y conteos de Malvinas desde la API automáticamente
    cargarTiendasMalvinas();
    cargarConteosMalvinas();
  }
  
  if (v === 'consolidado') {
    renderConsolidado();
  }
  
  if (v === 'registro') {
    // renderRegistro(); // Se importará cuando se cree el módulo
    if (typeof window.renderRegistro === 'function') {
      window.renderRegistro();
    }
  }
  
  if (v === 'proformas') {
    // renderListadoProformas(); // Se importará cuando se cree el módulo
    if (typeof window.renderListadoProformas === 'function') {
      window.renderListadoProformas();
    }
  }
  
  if (v === 'logistica') {
    // Cargar seguimiento y reportes cuando se muestra la vista de seguimiento
    // Esperar un momento para asegurar que la vista esté visible
    setTimeout(() => {
      cargarTodoSeguimiento();
    }, 200);
  }
  
  if (v === 'gerencia') {
    // renderGerencia(); // Se importará cuando se cree el módulo
    if (typeof window.renderGerencia === 'function') {
      window.renderGerencia();
    }
  }
}

/**
 * Abrir Comparar desde el modal de Registro
 */
export function openCompararDesdeRegistro(almacen) {
  try {
    // Cerrar modal si existe
    if (typeof window.closeModal === 'function') {
      window.closeModal('#modalRegDetalle');
    }
  } catch (e) {}
  
  setTimeout(() => {
    if (typeof window.abrirComparacion === 'function') {
      window.abrirComparacion(almacen);
    }
    showView('comparar');
  }, 50);
}

// Exportar funciones para uso global (temporal hasta que se cree main.js)
window.showView = showView;
window.openCompararDesdeRegistro = openCompararDesdeRegistro;

