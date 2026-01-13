/**
 * Módulo de Vista Registro
 * 
 * Contiene toda la lógica relacionada con el registro de inventarios.
 * 
 * Nota: Algunas funciones dependen de componentes que se crearán en la Fase 4.
 */

import { AppState } from '../state.js';
import { $ } from '../utils.js';

/**
 * Renderizar vista de registro
 */
export function renderRegistro() {
  const tbl = $('tbl-registro');
  const tb = tbl?.querySelector('tbody');
  if (!tb) return;
  
  tb.innerHTML = '';
  
  try {
    const th = tbl.querySelector('thead');
    if (th) th.classList.add('d-none');
  } catch (e) {}
  
  const desde = $('reg-desde')?.value ? new Date($('reg-desde').value + 'T00:00:00') : null;
  const hasta = $('reg-hasta')?.value ? new Date($('reg-hasta').value + 'T23:59:59') : null;
  const grupos = new Map();
  
  [['callao'], ['malvinas']].forEach(([almacen]) => {
    (AppState.sesiones[almacen] || []).forEach(s => {
      const finDate = s.fin ? new Date(s.fin.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$2/$1/$3')) : null;
      const inicioDate = s.inicio ? new Date(s.inicio.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$2/$1/$3')) : null;
      const comp = finDate || inicioDate;
      
      if (desde && comp && comp < desde) return;
      if (hasta && comp && comp > hasta) return;
      
      const tipoTienda = (almacen === 'callao') ? s.tipo : (s.tienda || '');
      const g = grupos.get(s.numero) || { numero: s.numero, items: [] };
      g.items.push({ almacen, s, tipoTienda });
      grupos.set(s.numero, g);
    });
  });
  
  const orden = Array.from(grupos.values()).sort((a, b) => {
    const na = parseInt(String(a.numero).split('-').pop() || '0', 10);
    const nb = parseInt(String(b.numero).split('-').pop() || '0', 10);
    return na - nb;
  });
  
  let idx = 1;
  orden.forEach(g => {
    const trH = document.createElement('tr');
    trH.className = 'table-active';
    trH.innerHTML = `
      <td>${idx++}</td>
      <td colspan="8">
        <button class="btn btn-sm btn-outline-dark me-2" onclick="openRegistroCarpeta('${g.numero}')">
          <i class="bi bi-folder"></i>
        </button>
        <strong>${g.numero}</strong> 
        <span class="text-secondary ms-2">${g.items.length} registro(s)</span>
      </td>`;
    tb.appendChild(trH);
    
    // Renderizar items del grupo
    g.items.forEach(item => {
      const tr = document.createElement('tr');
      tr.className = `table-light reg-grp reg-grp-${CSS.escape(g.numero)} d-none`;
      tr.innerHTML = `
        <td></td>
        <td>${item.almacen.toUpperCase()}</td>
        <td>${item.s.numero}</td>
        <td>${item.tipoTienda || '-'}</td>
        <td>${item.s.registrado}</td>
        <td>${item.s.inicio}</td>
        <td>${item.s.fin || '-'}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary" onclick="openCompararDesdeRegistro('${item.almacen}')">
            Comparar
          </button>
        </td>
        <td>
          <button class="btn btn-sm btn-outline-info" onclick="openRegistroDetalle('${item.almacen}','${item.s.id}','consolidado')">
            Consolidado
          </button>
        </td>
        <td>
          <button class="btn btn-sm btn-outline-warning" onclick="openRegistroDetalle('${item.almacen}','${item.s.id}','proformas')">
            Proformas
          </button>
        </td>
        <td>
          <button class="btn btn-sm btn-outline-dark" onclick="openRegistroDetalle('${item.almacen}','${item.s.id}','conteo')">
            Ver
          </button>
        </td>`;
      tb.appendChild(tr);
    });
  });
  
  try {
    const th = tbl.querySelector('thead');
    if (th && orden.length > 0) th.classList.remove('d-none');
  } catch (e) {}
}

/**
 * Abrir carpeta de registro
 */
export function openRegistroCarpeta(numero) {
  const rows = document.querySelectorAll(`.reg-grp-${CSS.escape(numero)}`);
  rows.forEach(r => r.classList.toggle('d-none'));
}

/**
 * Abrir detalle de registro
 * Nota: Esta función depende de componentes que se crearán en la Fase 4
 */
export function openRegistroDetalle(almacen, sesionId, tipo) {
  // Esta función se completará cuando se creen los componentes de modales
  if (typeof window.openRegistroDetalle === 'function') {
    window.openRegistroDetalle(almacen, sesionId, tipo);
  } else {
    console.warn('openRegistroDetalle no está disponible aún. Se completará en Fase 4.');
  }
}

/**
 * Exportar registro a PDF
 * Nota: Esta función depende de componentes PDF que se crearán en la Fase 4
 */
export function regExportPDF() {
  // Esta función se completará cuando se cree el módulo de PDF
  if (typeof window.regExportPDF === 'function') {
    window.regExportPDF();
  } else {
    console.warn('regExportPDF no está disponible aún. Se completará en Fase 4.');
  }
}

// Exportar funciones para uso global (temporal hasta que se cree main.js)
window.renderRegistro = renderRegistro;
window.openRegistroCarpeta = openRegistroCarpeta;
window.openRegistroDetalle = openRegistroDetalle;
window.regExportPDF = regExportPDF;

