/**
 * Módulo de Vista Proformas
 * 
 * Contiene toda la lógica relacionada con la gestión de proformas.
 * 
 * Nota: Algunas funciones dependen de componentes que se crearán en la Fase 4.
 */

import { AppState } from '../state.js';
import { $, fmt12 } from '../utils.js';

/**
 * Agregar línea a proforma
 */
export function addLineaProforma() {
  const tb = $('tbl-proforma')?.querySelector('tbody');
  if (!tb) return;
  
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>
      <input type="text" class="form-control form-control-sm pf-code-inp" 
             list="pf-productos" placeholder="Producto o código" 
             onchange="updatePFProductSuggestions(this)">
    </td>
    <td>
      <select class="form-select form-select-sm pf-um">
        <option value="UNI">UNI</option>
        <option value="DOC">DOC</option>
      </select>
    </td>
    <td>
      <input type="number" class="form-control form-control-sm pf-cant" 
             min="0" value="0" placeholder="Cantidad">
    </td>
    <td>
      <button class="btn btn-sm btn-outline-danger" onclick="this.closest('tr').remove()">
        <i class="bi bi-trash"></i>
      </button>
    </td>`;
  tb.appendChild(tr);
}

/**
 * Actualizar sugerencias de productos en proforma
 */
export function updatePFProductSuggestions(inp) {
  const v = (inp.value || '').toLowerCase();
  const dl = $('pf-productos');
  if (!dl) return;
  
  if (!v) {
    dl.innerHTML = '';
    return;
  }
  
  const MAX = 30;
  const items = (AppState.productos || []).filter(p =>
    (p.producto || '').toLowerCase().includes(v) ||
    String(p.codigo || '').toLowerCase().includes(v)
  ).slice(0, MAX);
  
  dl.innerHTML = items.map(p =>
    `<option value="${p.producto || ''}">${p.codigo}</option>`
  ).join('');
}

/**
 * Abrir modal de proforma
 */
export function openProformaModal() {
  const panel = $('panel-proforma');
  if (panel) panel.classList.remove('invis');
  addLineaProforma();
}

/**
 * Registrar proforma
 * Nota: Esta función depende de componentes PDF que se crearán en la Fase 4
 */
export async function registrarProforma() {
  let asesor = $('pf-asesor').value;
  if (asesor === 'Otro') asesor = $('pf-asesor-otro').value.trim();
  
  let registrado = $('pf-registrado').value;
  if (registrado === 'Otro') registrado = $('pf-registrado-otro').value.trim();
  
  const almacen = $('pf-almacen').value;
  let num = $('pf-num').value.trim();
  
  if (!num) num = `PF-${new Date().getFullYear()}-${(Math.floor(Math.random() * 9000) + 1000)}`;
  
  if (!asesor || !registrado) {
    alert('Completa Asesor y Registrado.');
    return;
  }
  
  const lineas = [];
  document.querySelectorAll('#tbl-proforma tbody tr').forEach(r => {
    const inp = r.querySelector('.pf-code-inp');
    const code = inp?.dataset?.code || inp?.value || '';
    const prod = (AppState.productos || []).find(p =>
      String(p.codigo) === String(code)
    ) || (AppState.productos || []).find(p =>
      (p.producto || '').toLowerCase() === String(inp?.value || '').toLowerCase()
    );
    const nombre = prod?.producto || String(inp?.value || '');
    const um = r.querySelector('.pf-um').value;
    const cant = Number(r.querySelector('.pf-cant').value || 0);
    
    if ((nombre || code) && cant > 0) {
      lineas.push({ codigo: code, producto: nombre, um, cant });
    }
  });
  
  if (lineas.length === 0) {
    alert('Agrega al menos una línea.');
    return;
  }
  
  // Generar PDF (se completará en Fase 4)
  let pdfUrl = null;
  if (typeof window.generarPDFProforma === 'function') {
    pdfUrl = await window.generarPDFProforma({
      fecha: fmt12(),
      asesor,
      registrado,
      num,
      almacen,
      lineas
    });
  }
  
  const reg = {
    id: (AppState.proformas?.length || 0) + 1,
    fecha: fmt12(),
    asesor,
    registrado,
    num,
    almacen,
    lineas,
    pdfUrl,
    estado: 'Ingreso',
    invNumero: null // Se completará cuando se migre la función
  };
  
  AppState.proformas.push(reg);
  
  // Ajustar sistema (se completará cuando se migre la función)
  if (typeof window._ajustarSistemaPorLineas === 'function') {
    try {
      window._ajustarSistemaPorLineas(almacen, lineas, -1);
    } catch (err) {
      console.warn('[ZS] No se pudo descontar del sistema por proforma:', err);
    }
  }
  
  renderListadoProformas();
  
  // Limpiar formulario
  try {
    $('pf-asesor').value = 'Hervin';
    $('pf-asesor-otro').value = '';
    $('pf-asesor-otro').classList.add('d-none');
    $('pf-almacen').value = 'callao';
    $('pf-registrado').value = 'Joseph';
    $('pf-registrado-otro').value = '';
    $('pf-registrado-otro').classList.add('d-none');
    $('pf-num').value = '';
    const tb = $('tbl-proforma')?.querySelector('tbody');
    if (tb) {
      tb.innerHTML = '';
      addLineaProforma();
    }
  } catch (e) {}
  
  if (typeof window.renderConsolidado === 'function') {
    window.renderConsolidado();
  }
  
  if (typeof window.toast === 'function') {
    window.toast('Proforma registrada y descuento aplicado al SISTEMA.', 'success');
  }
}

/**
 * Renderizar listado de proformas
 */
export function renderListadoProformas() {
  const tb = $('tbl-list-proformas')?.querySelector('tbody');
  if (!tb) return;
  
  tb.innerHTML = '';
  const filtro = $('filtro-proformas')?.value?.toLowerCase() || '';
  
  (AppState.proformas || []).forEach(p => {
    const key = `${p.num} ${p.asesor} ${p.registrado} ${p.fecha} ${p.almacen}`.toLowerCase();
    if (filtro && !key.includes(filtro)) return;
    
    const pdf = p.pdfUrl ?
      `<button class="btn btn-outline-dark btn-sm" onclick="openProformaPDF(${p.id})">
        <i class="bi bi-file-earmark-pdf"></i> PDF
      </button>` : '-';
    
    const estadoTxt = (p.estado === 'Ingreso') ? 'PROFORMA INGRESADA' : 'TIENE COMPROBANTE';
    const btn = `
      <div class="btn-group btn-group-sm">
        <button class="btn ${p.estado === 'Ingreso' ? 'btn-danger' : 'btn-success'}" 
                onclick="toggleEstadoProforma(${p.id})">
          ${estadoTxt}
        </button>
      </div>`;
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.id}</td>
      <td>${p.fecha}</td>
      <td>${p.asesor}</td>
      <td>${String(p.registrado || '').toUpperCase()}</td>
      <td>${(p.almacen || '').toUpperCase()}</td>
      <td>${p.num}</td>
      <td>${pdf}</td>
      <td>${btn}</td>`;
    tb.appendChild(tr);
  });
}

/**
 * Cambiar estado de proforma
 */
export function toggleEstadoProforma(id) {
  const p = (AppState.proformas || []).find(x => x.id === id);
  if (!p) return;
  
  p.estado = (p.estado === 'Ingreso') ? 'Emitido' : 'Ingreso';
  
  // Ajustar sistema (se completará cuando se migre la función)
  if (typeof window._ajustarSistemaPorLineas === 'function') {
    try {
      const sign = (p.estado === 'Emitido') ? +1 : -1;
      window._ajustarSistemaPorLineas(p.almacen, p.lineas || [], sign);
    } catch (err) {
      console.warn('[ZS] No se pudo ajustar sistema al cambiar estado de proforma:', err);
    }
  }
  
  renderListadoProformas();
  
  if (typeof window.renderConsolidado === 'function') {
    window.renderConsolidado();
  }
  
  if (typeof window.toast === 'function') {
    window.toast('Estado de proforma actualizado y sistema ajustado.', 'success');
  }
}

/**
 * Abrir PDF de proforma
 */
export function openProformaPDF(id) {
  const p = (AppState.proformas || []).find(x => x.id === id);
  if (!p || !p.pdfUrl) {
    alert('PDF no disponible');
    return;
  }
  
  try {
    const w = window.open(p.pdfUrl, '_blank', 'noopener');
    if (!w) {
      const a = document.createElement('a');
      a.href = p.pdfUrl;
      a.target = '_blank';
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  } catch (e) {
    alert('No se pudo abrir el PDF');
  }
}

/**
 * Exportar proformas a PDF
 * Nota: Esta función depende de componentes PDF que se crearán en la Fase 4
 */
export function pdfProformas() {
  if (typeof window.pdfProformas === 'function') {
    window.pdfProformas();
  } else {
    console.warn('pdfProformas no está disponible aún. Se completará en Fase 4.');
  }
}

// Exportar funciones para uso global (temporal hasta que se cree main.js)
window.addLineaProforma = addLineaProforma;
window.updatePFProductSuggestions = updatePFProductSuggestions;
window.openProformaModal = openProformaModal;
window.registrarProforma = registrarProforma;
window.renderListadoProformas = renderListadoProformas;
window.toggleEstadoProforma = toggleEstadoProforma;
window.openProformaPDF = openProformaPDF;
window.pdfProformas = pdfProformas;

