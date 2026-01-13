/**
 * Módulo de Vista Consolidado
 * 
 * Contiene toda la lógica relacionada con el consolidado de inventarios.
 */

import { AppState } from '../state.js';
import { $ } from '../utils.js';
import { API_URLS } from '../config.js';

/**
 * Cargar stock del sistema desde API para consolidado
 */
export async function cargarStockSistemaConsolidado(almacen) {
  if (!AppState.sesionActual?.inventarioId) {
    console.warn('No hay inventario activo para cargar stock del sistema');
    return new Map();
  }
  
  const method = "stock_sistema_excel";
  const idTipoAlmacen = almacen === 'callao' ? '2' : '1';
  const id = `${AppState.sesionActual.inventarioId}-${idTipoAlmacen}`;
  
  try {
    const response = await fetch(`${API_URLS.INVENTARIO}?method=${method}&id=${encodeURIComponent(id)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.status !== 200) {
      console.warn(`Error al cargar stock del sistema para ${almacen}:`, response.status);
      return new Map();
    }
    
    const data = await response.json();
    if (!Array.isArray(data)) {
      console.warn('API no devolvió un array para stock del sistema');
      return new Map();
    }
    
    const map = new Map();
    data.forEach((item, index) => {
      const codigo = item.CODIGO || '';
      if (codigo) {
        map.set(codigo, {
          item: index + 1,
          producto: item.PRODUCTO || '',
          sis: Number(item.CANTIDAD) || 0
        });
      }
    });
    
    return map;
  } catch (error) {
    console.error(`Error cargando stock del sistema para ${almacen}:`, error);
    return new Map();
  }
}

/**
 * Cargar stock físico desde API para consolidado
 */
export async function cargarStockFisicoConsolidado(almacen) {
  if (!AppState.sesionActual?.inventarioId) {
    console.warn('No hay inventario activo para cargar stock físico');
    return new Map();
  }
  
  const method = "listar_conteo_punto_operacion";
  const id = `${AppState.sesionActual.inventarioId}-${almacen}`;
  
  try {
    const response = await fetch(`${API_URLS.INVENTARIO}?method=${method}&id=${encodeURIComponent(id)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.status !== 200) {
      console.warn(`Error al cargar stock físico para ${almacen}:`, response.status);
      return new Map();
    }
    
    const data = await response.json();
    if (!Array.isArray(data)) {
      console.warn('API no devolvió un array para stock físico');
      return new Map();
    }
    
    const map = new Map();
    data.forEach((item) => {
      const codigo = item.CODIGO || '';
      if (codigo) {
        const prev = map.get(codigo) || { item: 0, producto: '', unidad_medida: '', fis: 0 };
        prev.fis = Number(prev.fis || 0) + (Number(item.TOTAL) || 0);
        if (!prev.producto && item.PRODUCTO) prev.producto = item.PRODUCTO;
        if (!prev.item && item.ITEM) prev.item = item.ITEM;
        if (!prev.unidad_medida && item.UNIDAD_MEDIDA) prev.unidad_medida = item.UNIDAD_MEDIDA;
        map.set(codigo, prev);
      }
    });
    
    return map;
  } catch (error) {
    console.error(`Error cargando stock físico para ${almacen}:`, error);
    return new Map();
  }
}

/**
 * Renderizar consolidado
 */
export async function renderConsolidado() {
  // Mostrar indicador de carga
  const tbCallao = $('#cons-callao')?.querySelector('tbody');
  const tbMalvinas = $('#cons-malvinas')?.querySelector('tbody');
  const tbGeneral = $('#cons-general')?.querySelector('tbody');
  
  if (tbCallao) tbCallao.innerHTML = '<tr><td colspan="5" class="text-center">Cargando...</td></tr>';
  if (tbMalvinas) tbMalvinas.innerHTML = '<tr><td colspan="4" class="text-center">Cargando...</td></tr>';
  if (tbGeneral) tbGeneral.innerHTML = '<tr><td colspan="4" class="text-center">Cargando...</td></tr>';
  
  try {
    // Cargar datos desde APIs en paralelo
    const [mapSCallao, mapSMalvinas, mapFCallao, mapFMalvinas] = await Promise.all([
      cargarStockSistemaConsolidado('callao'),
      cargarStockSistemaConsolidado('malvinas'),
      cargarStockFisicoConsolidado('callao'),
      cargarStockFisicoConsolidado('malvinas')
    ]);
    
    const allCodes = new Set([
      ...mapSCallao.keys(),
      ...mapSMalvinas.keys(),
      ...mapFCallao.keys(),
      ...mapFMalvinas.keys()
    ]);
    
    const cmpOrder = (AppState.comparacion && Array.isArray(AppState.comparacion.filas)) ?
      AppState.comparacion.filas.map(f => f.codigo) : [];
    const cmpSet = new Set(cmpOrder);
    const remaining = Array.from(allCodes).filter(c => !cmpSet.has(c))
      .sort((a, b) => a.toString().localeCompare(b.toString()));
    const listaCodigos = [...cmpOrder.filter(c => allCodes.has(c)), ...remaining];
    
    // Pintar con los mapas obtenidos de las APIs
    pintarConsConMapas('callao', 'cons-callao', mapSCallao, mapFCallao, true, listaCodigos);
    pintarConsConMapas('malvinas', 'cons-malvinas', mapSMalvinas, mapFMalvinas, false, listaCodigos);
    
    // Pintar tabla general con datos desde APIs
    if (tbGeneral) {
      tbGeneral.innerHTML = '';
      let totalSistemaGeneral = 0;
      let totalFisicoGeneral = 0;
      
      listaCodigos.forEach(c => {
        const s = (mapSCallao.get(c)?.sis || 0) + (mapSMalvinas.get(c)?.sis || 0);
        const f = (mapFCallao.get(c)?.fis || 0) + (mapFMalvinas.get(c)?.fis || 0);
        totalSistemaGeneral += s;
        totalFisicoGeneral += f;
        const dif = f - s;
        const res = dif === 0 ? 'CONFORME' : (dif > 0 ? 'SOBRANTE' : 'FALTANTE');
        const cls = dif === 0 ? 'text-bg-success' : (dif > 0 ? 'text-bg-warning' : 'text-bg-danger');
        const tr = document.createElement('tr');
        const difTxt = dif > 0 ? `+${dif}` : `${dif}`;
        tr.innerHTML = `
          <td>${s}</td>
          <td>${f}</td>
          <td class="cons-col-dif"><span class="badge ${cls}">${difTxt}</span></td>
          <td><span class="badge ${cls}">${res}</span></td>`;
        tbGeneral.appendChild(tr);
      });
      
      // Agregar fila de totales generales al final
      const difGeneral = totalFisicoGeneral - totalSistemaGeneral;
      const resGeneral = difGeneral === 0 ? 'CONFORME' : (difGeneral > 0 ? 'SOBRANTE' : 'FALTANTE');
      const clsGeneral = difGeneral === 0 ? 'text-bg-success' : (difGeneral > 0 ? 'text-bg-warning' : 'text-bg-danger');
      const difTxtGeneral = difGeneral > 0 ? `+${difGeneral}` : `${difGeneral}`;
      const trTotal = document.createElement('tr');
      trTotal.className = 'table-active fw-bold';
      trTotal.innerHTML = `
        <td><strong>${totalSistemaGeneral}</strong></td>
        <td><strong>${totalFisicoGeneral}</strong></td>
        <td class="cons-col-dif"><span class="badge ${clsGeneral}">${difTxtGeneral}</span></td>
        <td><span class="badge ${clsGeneral}">${resGeneral}</span></td>`;
      tbGeneral.appendChild(trTotal);
    }
    
    setTimeout(() => {
      padConsolidadoRows('cons-callao', 'cons-malvinas', 'cons-general');
    }, 0);
  } catch (error) {
    console.error('Error renderizando consolidado:', error);
    if (tbCallao) tbCallao.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error al cargar datos</td></tr>';
    if (tbMalvinas) tbMalvinas.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Error al cargar datos</td></tr>';
    if (tbGeneral) tbGeneral.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Error al cargar datos</td></tr>';
  }
}

/**
 * Pintar consolidado con mapas
 */
function pintarConsConMapas(almacen, tblId, mapS, mapF, mostrarItem, listaCodigos) {
  const tb = $(tblId)?.querySelector('tbody');
  if (!tb) return;
  
  tb.innerHTML = '';
  const codigos = Array.isArray(listaCodigos) && listaCodigos.length > 0 ?
    listaCodigos : Array.from(new Set([...mapS.keys(), ...mapF.keys()])).sort();
  
  codigos.forEach((c, idx) => {
    const s = mapS.get(c) || { item: '', producto: '', sis: 0 };
    const f = mapF.get(c) || { fis: 0 };
    const dif = (f.fis || 0) - (s.sis || 0);
    const nombre = (s.producto || f.producto || '');
    const isCallaoTbl = (tblId === 'cons-callao' || tblId === 'shot-cons-callao' ||
      tblId === 'shot2-cons-callao' || tblId === 'md-cons-callao');
    const leftCols = isCallaoTbl ?
      `<td class="text-end">${idx + 1}</td><td class="cons-col-producto" title="${nombre}">${nombre}</td>` :
      `<td class="cons-col-producto" title="${nombre}">${nombre}</td>`;
    const tr = document.createElement('tr');
    const cls = dif === 0 ? 'text-bg-success' : (dif > 0 ? 'text-bg-warning' : 'text-bg-danger');
    const difTxt = dif > 0 ? `+${dif}` : `${dif}`;
    tr.innerHTML = `${leftCols}<td>${s.sis || 0}</td><td>${f.fis || 0}</td><td class="cons-col-dif"><span class="badge ${cls}">${difTxt}</span></td>`;
    tb.appendChild(tr);
  });
}

/**
 * Ajustar altura de filas en consolidado
 */
function padConsolidadoRows(idA, idB, idC) {
  try {
    const len = (id) => document.querySelectorAll(`#${id} tbody tr`).length;
    const a = len(idA), b = len(idB), c = len(idC);
    const max = Math.max(a, b, c);
    
    const padTable = (id) => {
      const tb = document.querySelector(`#${id} tbody`);
      if (!tb) return;
      const th = document.querySelectorAll(`#${id} thead tr th`).length;
      const firstRowCols = tb.querySelector('tr')?.children?.length || th || 1;
      const cols = Math.max(firstRowCols, th || 0, 1);
      const cur = tb.children.length;
      
      for (let i = cur; i < max; i++) {
        const tr = document.createElement('tr');
        let tds = '';
        for (let j = 0; j < cols; j++) {
          tds += '<td>&nbsp;</td>';
        }
        tr.innerHTML = tds;
        tb.appendChild(tr);
      }
    };
    
    padTable(idA);
    padTable(idB);
    padTable(idC);
    
    setTimeout(() => syncConsolidadoRowHeights(idA, idB, idC), 0);
  } catch (e) {
    console.warn('Error en padConsolidadoRows:', e);
  }
}

/**
 * Sincronizar alturas de filas en consolidado
 */
function syncConsolidadoRowHeights(idA, idB, idC) {
  try {
    const ra = Array.from(document.querySelectorAll(`#${idA} tbody tr`));
    const rb = Array.from(document.querySelectorAll(`#${idB} tbody tr`));
    const rc = Array.from(document.querySelectorAll(`#${idC} tbody tr`));
    const n = Math.max(ra.length, rb.length, rc.length);
    
    for (let i = 0; i < n; i++) {
      const ha = ra[i]?.getBoundingClientRect().height || 0;
      const hb = rb[i]?.getBoundingClientRect().height || 0;
      const hc = rc[i]?.getBoundingClientRect().height || 0;
      const h = Math.max(ha, hb, hc);
      
      if (ra[i]) ra[i].style.height = h + 'px';
      if (rb[i]) rb[i].style.height = h + 'px';
      if (rc[i]) rc[i].style.height = h + 'px';
    }
  } catch (e) {
    console.warn('Error en syncConsolidadoRowHeights:', e);
  }
}

// Exportar funciones para uso global (temporal hasta que se cree main.js)
window.renderConsolidado = renderConsolidado;
window.syncConsolidadoRowHeights = syncConsolidadoRowHeights;

