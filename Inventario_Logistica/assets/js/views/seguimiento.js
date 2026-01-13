/**
 * Módulo de Vista Seguimiento
 * 
 * Gestiona la visualización de la tabla de seguimiento y reportes.
 */

import { AppState } from '../state.js';
import { $, toast } from '../utils.js';
import { obtenerReportesInventarios, obtenerSeguimientoInventarios, formatearFechaDesdeAPI, parsearInforme } from '../api/inventario.js';

/**
 * Formatear fecha para mostrar en la tabla
 */
function formatearFecha(fechaStr) {
  if (!fechaStr || fechaStr === '0000-00-00 00:00:00' || fechaStr === null) {
    return '-';
  }
  try {
    return formatearFechaDesdeAPI(fechaStr);
  } catch (error) {
    return fechaStr;
  }
}

/**
 * Renderizar tabla de reportes con paginación
 */
export function renderReportes() {
  console.log('renderReportes() llamado');
  console.log('AppState.reportes:', AppState.reportes);
  
  // Intentar encontrar la vista de múltiples formas
  let vista = document.getElementById('view-logistica');
  if (!vista) {
    vista = document.querySelector('#view-logistica');
  }
  if (!vista) {
    vista = document.querySelector('[id*="logistica"]');
  }
  
  if (!vista) {
    console.error('No se encontró la vista view-logistica');
    console.log('Buscando todas las vistas:', document.querySelectorAll('[id^="view-"]'));
    // Intentar de nuevo después de un delay
    setTimeout(() => renderReportes(), 200);
    return;
  }
  
  console.log('Vista encontrada:', vista);
  console.log('Clase de la vista:', vista.className);
  
  if (vista.classList.contains('invis')) {
    console.warn('La vista está oculta, esperando...');
    setTimeout(() => renderReportes(), 100);
    return;
  }
  
  // Intentar encontrar la tabla de múltiples formas
  let tabla = document.getElementById('tbl-reportes');
  if (!tabla) {
    // Intentar buscar dentro de la vista
    tabla = vista.querySelector('#tbl-reportes');
  }
  if (!tabla) {
    // Intentar buscar por selector
    tabla = document.querySelector('#tbl-reportes');
  }
  if (!tabla) {
    // Intentar buscar cualquier tabla en la vista
    const tablas = vista.querySelectorAll('table');
    console.log('Tablas encontradas en la vista:', tablas);
    if (tablas.length > 0) {
      tabla = tablas[tablas.length - 1]; // Usar la última tabla (debería ser la de reportes)
      console.log('Usando la última tabla encontrada:', tabla);
    }
  }
  
  if (!tabla) {
    console.error('No se encontró la tabla tbl-reportes');
    console.log('Buscando en el DOM...');
    console.log('Vista logistica:', vista);
    console.log('Todas las tablas en la vista:', vista.querySelectorAll('table'));
    console.log('Contenido de la vista:', vista.innerHTML.substring(0, 500));
    return;
  }
  
  console.log('Tabla encontrada:', tabla);
  
  const tbody = tabla.querySelector('tbody');
  if (!tbody) {
    console.error('No se encontró el tbody de la tabla de reportes');
    return;
  }
  
  const reportes = AppState.reportes || [];
  console.log('Total de reportes a renderizar:', reportes.length);
  
  const paginacion = AppState.paginacion.reportes;
  const porPagina = paginacion.porPagina;
  const paginaActual = paginacion.pagina;
  const totalPaginas = Math.ceil(reportes.length / porPagina);
  const inicio = (paginaActual - 1) * porPagina;
  const fin = inicio + porPagina;
  const reportesPagina = reportes.slice(inicio, fin);
  
  console.log(`Página ${paginaActual} de ${totalPaginas}, mostrando ${reportesPagina.length} reportes`);
  
  // Limpiar tabla
  tbody.innerHTML = '';
  
  if (reportes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No hay reportes disponibles</td></tr>';
    renderControlesPaginacion(0, 1);
    return;
  }
  
  // Renderizar filas
  reportesPagina.forEach((reporte, index) => {
    const tr = document.createElement('tr');
    const numeroFila = inicio + index + 1;
    
    console.log(`Renderizando reporte ${index + 1}:`, reporte);
    
    tr.innerHTML = `
      <td>${reporte.ID || numeroFila}</td>
      <td>${reporte.NOMBRE || '-'}</td>
      <td>${formatearFecha(reporte.FECHA_CULMINACION)}</td>
      <td>
        <span class="badge ${getBadgeClassEstado(reporte.ESTADO_INVENTARIO)}">
          ${reporte.ESTADO_INVENTARIO || 'N/A'}
        </span>
      </td>
      <td>${formatearFecha(reporte.FECHA_REGISTRO)}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary" onclick="verDetalleReporte(${reporte.ID})" title="Ver detalle">
          <i class="bi bi-eye"></i>
        </button>
      </td>
    `;
    
    tbody.appendChild(tr);
  });
  
  console.log(`Se renderizaron ${reportesPagina.length} filas en la tabla`);
  
  // Renderizar controles de paginación
  renderControlesPaginacion(reportes.length, totalPaginas, paginaActual);
}

/**
 * Obtener clase CSS para el badge según el estado
 */
function getBadgeClassEstado(estado) {
  if (!estado) return 'bg-secondary';
  
  const estadoUpper = estado.toUpperCase();
  
  // Manejar estados truncados (PE, PEN, PENDIEN, PENDIE, PENDIENTE)
  if (estadoUpper.startsWith('PENDIENTE') || estadoUpper.startsWith('PENDIE') || 
      estadoUpper.startsWith('PENDIEN') || estadoUpper.startsWith('PEN') || 
      estadoUpper === 'PE') {
    return 'bg-warning';
  }
  
  if (estadoUpper.startsWith('COMPLETADO') || estadoUpper.startsWith('FINALIZADO') || 
      estadoUpper.startsWith('COMPLET') || estadoUpper.startsWith('FINALIZ')) {
    return 'bg-success';
  }
  
  if (estadoUpper.startsWith('EN PROCESO') || estadoUpper.startsWith('EN CURSO') ||
      estadoUpper.startsWith('PROCESO') || estadoUpper.startsWith('CURSO')) {
    return 'bg-info';
  }
  
  if (estadoUpper.startsWith('CANCELADO') || estadoUpper.startsWith('CANCEL')) {
    return 'bg-danger';
  }
  
  return 'bg-secondary';
}

/**
 * Renderizar controles de paginación
 */
function renderControlesPaginacion(totalItems, totalPaginas, paginaActual) {
  const cardBody = $('#tbl-reportes')?.closest('.card-body');
  if (!cardBody) return;
  
  // Buscar o crear contenedor de paginación
  let paginacionDiv = cardBody.querySelector('.paginacion-reportes');
  if (!paginacionDiv) {
    paginacionDiv = document.createElement('div');
    paginacionDiv.className = 'paginacion-reportes d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2';
    cardBody.appendChild(paginacionDiv);
  }
  
  const porPagina = AppState.paginacion.reportes.porPagina;
  const desde = totalItems > 0 ? (paginaActual - 1) * porPagina + 1 : 0;
  const hasta = Math.min(paginaActual * porPagina, totalItems);
  
  let botonesHTML = '';
  
  // Información de paginación
  botonesHTML += `<div class="text-muted small">
    Mostrando ${desde}-${hasta} de ${totalItems} reportes
  </div>`;
  
  // Botones de navegación
  botonesHTML += '<div class="d-flex gap-1 align-items-center">';
  
  // Botón anterior
  botonesHTML += `<button class="btn btn-sm btn-outline-primary" 
    onclick="cambiarPaginaReportes(${paginaActual - 1})" 
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
      onclick="cambiarPaginaReportes(1)">1</button>`;
    if (inicioPag > 2) botonesHTML += `<span class="px-2">...</span>`;
  }
  
  for (let i = inicioPag; i <= finPag; i++) {
    const activo = i === paginaActual ? 'btn-primary' : 'btn-outline-secondary';
    botonesHTML += `<button class="btn btn-sm ${activo}" 
      onclick="cambiarPaginaReportes(${i})">${i}</button>`;
  }
  
  if (finPag < totalPaginas) {
    if (finPag < totalPaginas - 1) botonesHTML += `<span class="px-2">...</span>`;
    botonesHTML += `<button class="btn btn-sm btn-outline-secondary" 
      onclick="cambiarPaginaReportes(${totalPaginas})">${totalPaginas}</button>`;
  }
  
  // Botón siguiente
  botonesHTML += `<button class="btn btn-sm btn-outline-primary" 
    onclick="cambiarPaginaReportes(${paginaActual + 1})" 
    ${paginaActual === totalPaginas ? 'disabled' : ''}>
    Siguiente <i class="bi bi-chevron-right"></i>
  </button>`;
  
  botonesHTML += '</div>';
  
  paginacionDiv.innerHTML = botonesHTML;
}

/**
 * Cambiar página de reportes
 */
export function cambiarPaginaReportes(nuevaPagina) {
  const totalPaginas = Math.ceil((AppState.reportes || []).length / AppState.paginacion.reportes.porPagina);
  
  if (nuevaPagina < 1 || nuevaPagina > totalPaginas) {
    return;
  }
  
  AppState.paginacion.reportes.pagina = nuevaPagina;
  renderReportes();
}

/**
 * Cargar ambas tablas (seguimiento y reportes)
 */
export async function cargarTodoSeguimiento() {
  await Promise.all([
    cargarSeguimiento(),
    cargarReportes()
  ]);
}

/**
 * Cargar y renderizar reportes
 */
export async function cargarReportes() {
  try {
    console.log('cargarReportes() llamado');
    
    // Verificar que la vista esté visible - buscar de múltiples formas
    let vista = document.getElementById('view-logistica');
    if (!vista) {
      vista = document.querySelector('#view-logistica');
    }
    if (!vista) {
      console.error('No se encontró la vista view-logistica');
      console.log('Todas las vistas disponibles:', Array.from(document.querySelectorAll('[id^="view-"]')).map(v => v.id));
      // Intentar de nuevo después de un delay
      setTimeout(() => cargarReportes(), 300);
      return;
    }
    
    console.log('Vista encontrada:', vista.id);
    
    if (vista.classList.contains('invis')) {
      console.warn('La vista está oculta, esperando 300ms...');
      setTimeout(() => cargarReportes(), 300);
      return;
    }
    
    let tabla = document.getElementById('tbl-reportes');
    if (!tabla) {
      tabla = vista.querySelector('#tbl-reportes');
    }
    if (!tabla) {
      tabla = document.querySelector('#tbl-reportes');
    }
    
    const tbody = tabla?.querySelector('tbody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center"><i class="bi bi-arrow-clockwise spin"></i> Cargando reportes...</td></tr>';
    } else {
      console.warn('No se encontró tbody, esperando...');
      setTimeout(() => cargarReportes(), 200);
      return;
    }
    
    const reportes = await obtenerReportesInventarios();
    console.log('Reportes obtenidos en cargarReportes:', reportes);
    console.log('AppState.reportes después de obtener:', AppState.reportes);
    
    AppState.paginacion.reportes.pagina = 1; // Resetear a primera página
    
    // Renderizar inmediatamente
    renderReportes();
  } catch (error) {
    console.error('Error cargando reportes:', error);
    const tbody = $('#tbl-reportes')?.querySelector('tbody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error al cargar reportes</td></tr>';
    }
  }
}

/**
 * Ver detalle de un reporte
 */
export function verDetalleReporte(id) {
  console.log('Ver detalle del reporte:', id);
  // TODO: Implementar modal o navegación a detalle
  alert(`Ver detalle del reporte ID: ${id}`);
}

/**
 * Renderizar tabla de seguimiento
 */
export function renderSeguimiento() {
  console.log('renderSeguimiento() llamado');
  console.log('AppState.seguimiento:', AppState.seguimiento);
  
  // Intentar encontrar la vista de múltiples formas
  let vista = document.getElementById('view-logistica');
  if (!vista) {
    vista = document.querySelector('#view-logistica');
  }
  if (!vista) {
    console.error('No se encontró la vista view-logistica');
    setTimeout(() => renderSeguimiento(), 200);
    return;
  }
  
  if (vista.classList.contains('invis')) {
    console.warn('La vista está oculta, esperando...');
    setTimeout(() => renderSeguimiento(), 100);
    return;
  }
  
  const tabla = document.getElementById('tbl-logistica');
  if (!tabla) {
    console.error('No se encontró la tabla tbl-logistica');
    return;
  }
  
  const tbody = tabla.querySelector('tbody');
  if (!tbody) {
    console.error('No se encontró el tbody de la tabla de seguimiento');
    return;
  }
  
  const seguimiento = AppState.seguimiento || [];
  console.log('Total de registros a renderizar:', seguimiento.length);
  
  // Limpiar tabla
  tbody.innerHTML = '';
  
  if (seguimiento.length === 0) {
    tbody.innerHTML = '<tr><td colspan="11" class="text-center text-muted">No hay registros de seguimiento disponibles</td></tr>';
    return;
  }
  
  // Renderizar filas
  seguimiento.forEach((registro, index) => {
    const tr = document.createElement('tr');
    
    // Parsear informe para obtener enlaces PDF
    const informes = parsearInforme(registro.INFORME);
    let informeHTML = '-';
    if (informes.length > 0) {
      informeHTML = `<button class="btn btn-sm btn-outline-primary" onclick="abrirModalInformesPDF(${registro.ID})" title="Ver ${informes.length} informe(s)">
        <i class="bi bi-file-earmark-pdf"></i> Ver Informes (${informes.length})
      </button>`;
    }
    
    tr.innerHTML = `
      <td>${registro.ID || index + 1}</td>
      <td>${formatearFecha(registro.FECHA_REGISTRO)}</td>
      <td>${registro.NOMBRE_INVENTARIO || '-'}</td>
      <td>${registro.AUTORIZADO_POR || '-'}</td>
      <td>${informeHTML}</td>
      <td>
        <span class="badge ${getBadgeClassEstado(registro.ESTADO)}">
          ${registro.ESTADO || 'N/A'}
        </span>
      </td>
      <td>${formatearFecha(registro.FECHA_RESPUESTA || registro.FECHA_DE_RESPUESTA)}</td>
      <td>${registro.RESPUESTA || '-'}</td>
      <td>
        <span class="badge ${getBadgeClassEstado(registro.ESTADO_INVENTARIO)}">
          ${registro.ESTADO_INVENTARIO || 'N/A'}
        </span>
      </td>
      <td>${formatearFecha(registro.FECHA_REGISTRO_ESTADO || registro.FECHA_REGISTRO)}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary" onclick="verDetalleSeguimiento(${registro.ID})" title="Ver detalle">
          <i class="bi bi-eye"></i>
        </button>
      </td>
    `;
    
    tbody.appendChild(tr);
  });
  
  console.log(`Se renderizaron ${seguimiento.length} filas en la tabla de seguimiento`);
}

/**
 * Cargar y renderizar seguimiento
 */
export async function cargarSeguimiento() {
  try {
    console.log('cargarSeguimiento() llamado');
    
    // Verificar que la vista esté visible
    let vista = document.getElementById('view-logistica');
    if (!vista) {
      vista = document.querySelector('#view-logistica');
    }
    if (!vista) {
      console.error('No se encontró la vista view-logistica');
      setTimeout(() => cargarSeguimiento(), 300);
      return;
    }
    
    if (vista.classList.contains('invis')) {
      console.warn('La vista está oculta, esperando 300ms...');
      setTimeout(() => cargarSeguimiento(), 300);
      return;
    }
    
    const tabla = document.getElementById('tbl-logistica');
    const tbody = tabla?.querySelector('tbody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="11" class="text-center"><i class="bi bi-arrow-clockwise spin"></i> Cargando seguimiento...</td></tr>';
    }
    
    const seguimiento = await obtenerSeguimientoInventarios();
    console.log('Seguimiento obtenido en cargarSeguimiento:', seguimiento);
    console.log('AppState.seguimiento después de obtener:', AppState.seguimiento);
    
    // Renderizar inmediatamente
    renderSeguimiento();
  } catch (error) {
    console.error('Error cargando seguimiento:', error);
    const tbody = document.getElementById('tbl-logistica')?.querySelector('tbody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="11" class="text-center text-danger">Error al cargar seguimiento</td></tr>';
    }
  }
}

/**
 * Abrir modal con los PDFs del informe
 */
export function abrirModalInformesPDF(idRegistro) {
  console.log('Abrir modal de informes PDF para registro:', idRegistro);
  
  // Buscar el registro en el estado
  const registro = AppState.seguimiento.find(r => r.ID === idRegistro);
  if (!registro) {
    console.error('No se encontró el registro con ID:', idRegistro);
    toast('No se encontró el registro', 'error');
    return;
  }
  
  // Parsear informe
  const informes = parsearInforme(registro.INFORME);
  
  // Obtener el contenedor del modal
  const container = document.getElementById('informes-pdf-container');
  if (!container) {
    console.error('No se encontró el contenedor de informes PDF');
    return;
  }
  
  // Limpiar contenedor
  container.innerHTML = '';
  
  if (informes.length === 0) {
    container.innerHTML = '<p class="text-muted">No hay informes disponibles para este registro.</p>';
  } else {
    // Crear lista de enlaces PDF
    const listaHTML = informes.map((inf, idx) => {
      const url = typeof inf === 'string' ? inf : (inf.pdf || inf);
      const nombreArchivo = url.split('/').pop() || `Documento ${idx + 1}`;
      return `
        <div class="mb-3 p-3 border rounded">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <h6 class="mb-1"><i class="bi bi-file-earmark-pdf text-danger"></i> ${nombreArchivo}</h6>
              <small class="text-muted">${url}</small>
            </div>
            <a href="${url}" target="_blank" class="btn btn-sm btn-primary">
              <i class="bi bi-download"></i> Abrir PDF
            </a>
          </div>
        </div>
      `;
    }).join('');
    
    container.innerHTML = `
      <p class="mb-3"><strong>Inventario:</strong> ${registro.NOMBRE_INVENTARIO || 'N/A'}</p>
      <p class="mb-3 text-muted">Se encontraron ${informes.length} informe(s) PDF:</p>
      ${listaHTML}
    `;
  }
  
  // Abrir el modal
  if (typeof window.openModal === 'function') {
    window.openModal('#modalInformesPDF');
  } else {
    console.error('La función openModal no está disponible');
  }
}

/**
 * Ver detalle de un registro de seguimiento
 */
export function verDetalleSeguimiento(id) {
  console.log('Ver detalle del seguimiento:', id);
  // TODO: Implementar modal o navegación a detalle
  alert(`Ver detalle del seguimiento ID: ${id}`);
}

// Exportar funciones para uso global
window.cambiarPaginaReportes = cambiarPaginaReportes;
window.verDetalleReporte = verDetalleReporte;
window.renderReportes = renderReportes;
window.cargarReportes = cargarReportes;
window.renderSeguimiento = renderSeguimiento;
window.cargarSeguimiento = cargarSeguimiento;
window.verDetalleSeguimiento = verDetalleSeguimiento;
window.abrirModalInformesPDF = abrirModalInformesPDF;

