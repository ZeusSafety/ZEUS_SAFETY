/**
 * Módulo de Vista Callao
 * 
 * Contiene toda la lógica relacionada con la vista de Almacén Callao.
 */

import { AppState } from '../state.js';
import { $, qa, toast, normalizarClave, leerArchivoGenerico } from '../utils.js';
import { cargarConteosCallao } from '../api/inventario.js';
import { CONFIG } from '../config.js';
// Nota: renderListado y pdfListado se moverán a components/tables.js en Fase 4
// Nota: registrarInventario se completará cuando se migre de Fase 2

/**
 * Obtener el último inventario de un almacén
 */
function ultimoInventario(almacen) {
  const arr = AppState.sesiones[almacen];
  return arr[arr.length - 1] || null;
}

/**
 * Mostrar tabla de inventario para Callao
 */
export function mostrarTablaInventario(almacen) {
  const sesion = ultimoInventario(almacen);
  if (!sesion) {
    alert('No hay sesión activa.');
    return;
  }
  
  const tbody = $(`tbl-${almacen}`)?.querySelector('tbody');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  const wrap = $(`tabla-${almacen}`);
  
  // Crear barra de búsqueda si no existe
  if (wrap && !document.getElementById(`inv-fwrap-${almacen}`)) {
    const bar = document.createElement('div');
    bar.id = `inv-fwrap-${almacen}`;
    bar.className = 'd-flex align-items-center gap-2 mb-3';
    bar.innerHTML = `
      <div class="position-relative flex-grow-1" style="max-width:520px">
        <input id="inv-filtro-${almacen}" class="form-control form-control-sm ps-5 search-xl" placeholder="Buscar por producto o código">
        <i class="bi bi-search position-absolute" style="left:12px; top:7px; color:#3b82f6; font-size:1.1rem"></i>
      </div>
      <button id="inv-clear-${almacen}" class="btn btn-outline-secondary btn-sm">Limpiar</button>`;
    wrap.querySelector('.card-body').prepend(bar);
    
    const inp = document.getElementById(`inv-filtro-${almacen}`);
    const clr = document.getElementById(`inv-clear-${almacen}`);
    if (inp) inp.addEventListener('input', () => filterTablaInventario(almacen));
    if (clr) clr.addEventListener('click', () => {
      inp.value = '';
      AppState.paginacion[almacen].pagina = 1;
      renderPaginaInventario(almacen);
      inp.focus();
    });
  }
  
  renderPaginaInventario(almacen);
  $(`tabla-${almacen}`)?.classList.remove('invis');
}

/**
 * Renderizar página de inventario con paginación
 */
export function renderPaginaInventario(almacen) {
  const sesion = ultimoInventario(almacen);
  if (!sesion) return;
  
  const tbody = $(`tbl-${almacen}`)?.querySelector('tbody');
  if (!tbody) return;
  
  const excl = new Set(AppState.filtro.excluirCodigos.map(s => s.trim()).filter(Boolean));
  let fuente = [...AppState.productos];
  
  if (AppState.filtro.ocultarCero) fuente = fuente.filter(p => p.cantidad_sistema > 0);
  fuente = fuente.filter(p => !excl.has(p.codigo));
  
  // Aplicar filtro de búsqueda
  const filtroTxt = (document.getElementById(`inv-filtro-${almacen}`)?.value || '').toLowerCase();
  if (filtroTxt) {
    fuente = fuente.filter(p =>
      (p.producto || '').toLowerCase().includes(filtroTxt) ||
      (p.codigo || '').toLowerCase().includes(filtroTxt)
    );
  }
  
  const mapCant = new Map((sesion.filas || []).map(f => [f.codigo, f.cantidad]));
  
  // Paginación
  const porPagina = AppState.paginacion[almacen].porPagina;
  const paginaActual = AppState.paginacion[almacen].pagina;
  const totalPaginas = Math.ceil(fuente.length / porPagina);
  const inicio = (paginaActual - 1) * porPagina;
  const fin = inicio + porPagina;
  const productosPagina = fuente.slice(inicio, fin);
  
  // Renderizar filas
  tbody.innerHTML = '';
  productosPagina.forEach(p => {
    const tr = document.createElement('tr');
    const val = mapCant.has(p.codigo) ? String(mapCant.get(p.codigo)) : '';
    const estadoBadge = val === '' ?
      '<span class="badge text-bg-danger">PENDIENTE</span>' :
      '<span class="badge text-bg-success">REGISTRADO</span>';
    
    tr.innerHTML = `
      <td>${p.item}</td>
      <td>${p.producto}</td>
      <td>${p.codigo}</td>
      <td>
        <input type="number" class="form-control form-control-sm" style="width:100px; text-align:center" 
               min="0" data-codigo="${p.codigo}" data-almacen="${almacen}" 
               value="${val}" oninput="syncObsYGuardar(this, '${almacen}')">
      </td>
      <td>
        <select class="form-select form-select-sm" style="width:80px" 
                data-codigo="${p.codigo}" data-almacen="${almacen}" 
                onchange="actualizarUnidadMedida(this, '${almacen}')">
          <option value="UNI" ${p.unidad_medida === 'UNI' ? 'selected' : ''}>UNI</option>
          <option value="DOC" ${p.unidad_medida === 'DOC' ? 'selected' : ''}>DOC</option>
        </select>
      </td>
      <td class="fw-semibold">${estadoBadge}</td>`;
    tbody.appendChild(tr);
  });
  
  // Crear o actualizar controles de paginación
  renderControlesPaginacion(almacen, paginaActual, totalPaginas, fuente.length);
}

/**
 * Renderizar controles de paginación
 */
function renderControlesPaginacion(almacen, paginaActual, totalPaginas, totalItems) {
  const wrap = $(`tabla-${almacen}`);
  if (!wrap) return;
  
  let paginacionDiv = document.getElementById(`inv-paginacion-${almacen}`);
  if (!paginacionDiv) {
    paginacionDiv = document.createElement('div');
    paginacionDiv.id = `inv-paginacion-${almacen}`;
    paginacionDiv.className = 'd-flex justify-content-between align-items-center mt-3 flex-wrap gap-2';
    wrap.querySelector('.card-body').appendChild(paginacionDiv);
  }
  
  const porPagina = AppState.paginacion[almacen].porPagina;
  const desde = (paginaActual - 1) * porPagina + 1;
  const hasta = Math.min(paginaActual * porPagina, totalItems);
  
  let botonesHTML = '';
  
  // Botón anterior
  botonesHTML += `<button class="btn btn-sm btn-outline-primary" 
    onclick="cambiarPaginaInventario('${almacen}', ${paginaActual - 1})" 
    ${paginaActual === 1 ? 'disabled' : ''}>
    <i class="bi bi-chevron-left"></i> Anterior
  </button>`;
  
  // Números de página
  const maxBotones = 5;
  let inicioPag = Math.max(1, paginaActual - Math.floor(maxBotones / 2));
  let finPag = Math.min(totalPaginas, inicioPag + maxBotones - 1);
  
  if (finPag - inicioPag < maxBotones - 1) {
    inicioPag = Math.max(1, finPag - maxBotones + 1);
  }
  
  if (inicioPag > 1) {
    botonesHTML += `<button class="btn btn-sm btn-outline-secondary" 
      onclick="cambiarPaginaInventario('${almacen}', 1)">1</button>`;
    if (inicioPag > 2) botonesHTML += `<span class="px-2">...</span>`;
  }
  
  for (let i = inicioPag; i <= finPag; i++) {
    const activo = i === paginaActual ? 'btn-primary' : 'btn-outline-secondary';
    botonesHTML += `<button class="btn btn-sm ${activo}" 
      onclick="cambiarPaginaInventario('${almacen}', ${i})">${i}</button>`;
  }
  
  if (finPag < totalPaginas) {
    if (finPag < totalPaginas - 1) botonesHTML += `<span class="px-2">...</span>`;
    botonesHTML += `<button class="btn btn-sm btn-outline-secondary" 
      onclick="cambiarPaginaInventario('${almacen}', ${totalPaginas})">${totalPaginas}</button>`;
  }
  
  // Botón siguiente
  botonesHTML += `<button class="btn btn-sm btn-outline-primary" 
    onclick="cambiarPaginaInventario('${almacen}', ${paginaActual + 1})" 
    ${paginaActual === totalPaginas ? 'disabled' : ''}>
    Siguiente <i class="bi bi-chevron-right"></i>
  </button>`;
  
  paginacionDiv.innerHTML = `
    <div class="text-secondary small">Mostrando ${desde}-${hasta} de ${totalItems} productos</div>
    <div class="d-flex gap-1 align-items-center">${botonesHTML}</div>
  `;
}

/**
 * Cambiar página de inventario
 */
export function cambiarPaginaInventario(almacen, nuevaPagina) {
  AppState.paginacion[almacen].pagina = nuevaPagina;
  renderPaginaInventario(almacen);
  // Scroll suave hacia arriba de la tabla
  const tabla = $(`tabla-${almacen}`);
  if (tabla) tabla.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Filtrar tabla de inventario
 */
export function filterTablaInventario(almacen) {
  // Resetear a la primera página al filtrar
  AppState.paginacion[almacen].pagina = 1;
  renderPaginaInventario(almacen);
}

/**
 * Sincronizar observaciones y guardar cantidad
 */
export function syncObsYGuardar(inp, almacen) {
  // Actualizar badge visual
  const tdObs = inp.closest('tr').children[5];
  const val = inp.value.trim();
  tdObs.innerHTML = val === '' ?
    '<span class="badge text-bg-danger">PENDIENTE</span>' :
    '<span class="badge text-bg-success">REGISTRADO</span>';
  
  // Guardar en sesión
  const codigo = inp.dataset.codigo;
  const cantidad = Number(inp.value || 0);
  const sesion = ultimoInventario(almacen);
  if (!sesion) return;
  
  // Buscar o crear la fila en sesion.filas
  if (!sesion.filas) sesion.filas = [];
  let fila = sesion.filas.find(f => f.codigo === codigo);
  
  if (fila) {
    fila.cantidad = cantidad;
  } else {
    // Buscar producto completo en AppState.productos
    const producto = AppState.productos.find(p => p.codigo === codigo);
    if (producto) {
      sesion.filas.push({
        item: producto.item,
        producto: producto.producto,
        codigo: producto.codigo,
        unidad_medida: producto.unidad_medida,
        cantidad: cantidad
      });
    }
  }
}

/**
 * Actualizar unidad de medida
 */
export function actualizarUnidadMedida(select, almacen) {
  const codigo = select.dataset.codigo;
  const nuevaUnidad = select.value;
  
  // Actualizar en la sesión actual
  const sesion = ultimoInventario(almacen);
  if (sesion) {
    if (!sesion.filas) sesion.filas = [];
    let fila = sesion.filas.find(f => f.codigo === codigo);
    
    if (fila) {
      fila.unidad_medida = nuevaUnidad;
    } else {
      // Crear nueva fila si no existe
      const producto = AppState.productos.find(p => p.codigo === codigo);
      if (producto) {
        sesion.filas.push({
          item: producto.item,
          producto: producto.producto,
          codigo: codigo,
          cantidad: 0,
          unidad_medida: nuevaUnidad
        });
      }
    }
  }
  
  // También actualizar en el producto base para mantener consistencia
  const producto = AppState.productos.find(p => p.codigo === codigo);
  if (producto) {
    producto.unidad_medida = nuevaUnidad;
  }
  
  console.log(`Unidad de medida actualizada para ${codigo}: ${nuevaUnidad}`);
}

/**
 * Renderizar listado de conteos (compartido con malvinas)
 * Nota: Esta función se moverá a components/tables.js en Fase 4
 */
export function renderListado(almacen) {
  const tb = $(`list-${almacen}`)?.querySelector('tbody');
  if (!tb) return;
  
  tb.innerHTML = '';
  const filtro = $(`filtro-list-${almacen}`)?.value?.toLowerCase() || '';
  
  AppState.sesiones[almacen].forEach((s, idx) => {
    if (filtro && !(`${s.numero} ${s.registrado} ${s.inicio} ${s.tienda || ''}`.toLowerCase().includes(filtro))) return;
    
    const tr = document.createElement('tr');
    const pdf = s.pdfUrl ?
      `<a class="link-primary" href="${s.pdfUrl}" target="_blank"><i class="bi bi-file-earmark-pdf"></i> PDF</a>` :
      '-';
    
    if (almacen === 'malvinas') {
      tr.innerHTML = `
        <td>${idx + 1}</td>
        <td>${s.inicio}</td>
        <td>${s.numero}</td>
        <td>${s.tienda || ''}</td>
        <td>${s.registrado}</td>
        <td>${pdf}</td>
        <td>${s.fin || '-'}</td>`;
    } else {
      tr.innerHTML = `
        <td>${idx + 1}</td>
        <td>${s.inicio}</td>
        <td>${s.numero}</td>
        <td>${s.registrado}</td>
        <td>${pdf}</td>
        <td>${s.fin || '-'}</td>`;
    }
    
    tb.appendChild(tr);
  });
}

export async function onEmergFileChange(almacen, input) {
  try {
    const file = input.files?.[0];
    if (!file) return;
    const datos = await leerArchivoGenerico(file);
    aplicarCargaEmergencia(almacen, datos);
    toast('Archivo de emergencia procesado.', 'success');
    input.value = '';
  } catch (err) {
    alert('Error emergencia: ' + err.message);
  }
}

export function dispararEmergencia(almacen) {
  const pass = prompt('Contraseña de emergencia');
  if (pass !== CONFIG.JEFE_PWD) {
    alert('Contraseña incorrecta');
    return;
  }
  const inp = $('emg-' + almacen);
  if (!inp) return;
  const prevClass = inp.className;
  const { position, left, width, height, opacity, zIndex } = inp.style;
  inp.classList.remove('d-none');
  inp.style.position = 'fixed';
  inp.style.left = '-9999px';
  inp.style.width = '1px';
  inp.style.height = '1px';
  inp.style.opacity = '0';
  inp.style.zIndex = '-1';
  inp.click();
  setTimeout(() => {
    inp.className = prevClass;
    inp.style.position = position;
    inp.style.left = left;
    inp.style.width = width;
    inp.style.height = height;
    inp.style.opacity = opacity;
    inp.style.zIndex = zIndex;
  }, 0);
  setTimeout(() => {
    if (!inp.files || inp.files.length === 0) {
      toast('Operación cancelada. No se seleccionó archivo.', 'info');
    }
  }, 800);
}

export function aplicarCargaEmergencia(almacen, datos) {
  const sesion = ultimoInventario(almacen);
  if (!sesion) {
    alert('Primero crea una sesión de inventario.');
    return;
  }
  const normalizeCode = (c) => String(c || '').trim();
  const mapaCantidades = {};
  (datos || []).forEach(registro => {
    const map = {};
    Object.keys(registro || {}).forEach(k => {
      map[normalizarClave(k)] = registro[k];
    });
    const codigo = normalizeCode((map.codigo ?? map.cod ?? map.sku ?? map.codigo_producto ?? map.codigo_interno ?? map.codigo_zeus) || '');
    const cantidad = Number(map.cantidad ?? map.cant ?? map.cantidad_fisica ?? map.stock ?? map.existencia ?? map.cantidadtotal ?? map.cantidad_total ?? 0);
    if (codigo) {
      mapaCantidades[codigo] = cantidad;
    }
  });
  if (!Array.isArray(sesion.filas) || sesion.filas.length === 0) {
    sesion.filas = (AppState.productos || []).map(p => ({
      item: p.item,
      producto: p.producto,
      codigo: normalizeCode(p.codigo),
      unidad_medida: p.unidad_medida,
      cantidad: Number(mapaCantidades[normalizeCode(p.codigo)] || 0)
    }));
  } else {
    sesion.filas.forEach(fila => {
      const codigoFila = normalizeCode(fila.codigo);
      if (mapaCantidades[codigoFila] != null) {
        fila.cantidad = Number(mapaCantidades[codigoFila]) || 0;
      }
    });
  }
  mostrarTablaInventario(almacen);
}

// Exportar funciones para uso global (temporal hasta que se cree main.js)
window.mostrarTablaInventario = mostrarTablaInventario;
window.renderPaginaInventario = renderPaginaInventario;
window.cambiarPaginaInventario = cambiarPaginaInventario;
window.filterTablaInventario = filterTablaInventario;
window.syncObsYGuardar = syncObsYGuardar;
window.actualizarUnidadMedida = actualizarUnidadMedida;
window.renderListado = renderListado;
window.onEmergFileChange = onEmergFileChange;
window.dispararEmergencia = dispararEmergencia;
window.aplicarCargaEmergencia = aplicarCargaEmergencia;

