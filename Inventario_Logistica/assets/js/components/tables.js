/**
 * Módulo de Componentes - Tablas
 * 
 * Contiene funciones de renderizado y gestión de tablas.
 */

import { AppState } from '../state.js';
import { $ } from '../utils.js';
import { openModal } from './modals.js';

/**
 * Renderizar tabla de acciones
 */
export function renderAcciones() {
  const tb = $('tbl-acciones')?.querySelector('tbody');
  if (!tb) return;
  
  tb.innerHTML = '';
  const filtro = $('filtro-acciones')?.value?.toLowerCase() || '';
  
  const norm = (s) => {
    s = String(s || '').toLowerCase();
    return s.charAt(0).toUpperCase() + s.slice(1);
  };
  
  (AppState.acciones || []).forEach(a => {
    const key = `${a.fecha} ${a.registrado} ${a.motivo} ${a.errorDe || ''} ${a.obs || ''} ${a.producto || ''} ${a.almacen || ''}`.toLowerCase();
    if (filtro && !key.includes(filtro)) return;
    
    const idRef = (a.item ? `Item ${a.item}` : '') + (a.producto ? (a.item ? ' · ' : '') + a.producto : '');
    const cant = (a.cantidad !== undefined && a.cantidad !== null && String(a.cantidad) !== '') ? a.cantidad : '-';
    const tipoError = a.tipoError || 'N/A';
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${idRef || a.id}</td>
      <td>${a.fecha}</td>
      <td class="text-center">${norm(a.registrado)}</td>
      <td>${norm(a.almacen)}</td>
      <td>${norm(a.motivo)}</td>
      <td>${cant}</td>
      <td>${norm(a.errorDe) || '-'}</td>
      <td class="text-center">
        <span class="badge ${tipoError === 'CANTIDAD' ? 'bg-warning' : 'bg-info'}">${tipoError}</span>
      </td>
      <td class="text-center">
        <i class="bi bi-eye cursor-pointer" onclick="verObs('${a.id}')"></i>
      </td>`;
    tb.appendChild(tr);
  });
}

/**
 * Ver observaciones de una acción
 */
export function verObs(id) {
  const a = (AppState.acciones || []).find(x => String(x.id) === String(id));
  const el = document.getElementById('obs-contenido');
  if (el) el.textContent = a?.obs || '(Sin observaciones)';
  openModal('#modalObs');
}

// Exportar funciones para uso global (temporal hasta que se cree main.js)
window.renderAcciones = renderAcciones;
window.verObs = verObs;


