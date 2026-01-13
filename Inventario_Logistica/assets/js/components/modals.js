/**
 * Módulo de Componentes - Modales
 * 
 * Gestiona todos los modales de la aplicación.
 */

import { $, q, qa, fmt12, toast } from '../utils.js';
import { AppState } from '../state.js';
import { CONFIG, API_URLS } from '../config.js';
import { cargarColaboradoresInventario, cargarColaboradoresConteo } from '../api/colaboradores.js';
import { obtenerIdInventario, cargarInventariosDisponibles, cargarConteosDesdeAPI } from '../api/inventario.js';
import { cargarTiendasMalvinas } from '../views/malvinas.js';

// Contexto global para inventario (temporal hasta que se refactorice completamente)
let inventarioCtx = { almacen: null, tipo: null };

/**
 * Abrir modal genérico
 */
export function openModal(sel) {
  const m = q(sel);
  if (!m) return;
  
  try {
    // Evitar reabrir si ya está visible
    if (m.classList.contains('show')) return;
    
    // Cerrar minimenús que puedan quedar abiertos
    try {
      if (typeof window.cerrarTodosMiniMenus === 'function') {
        window.cerrarTodosMiniMenus();
      }
    } catch (e) {}
    
    m.style.display = 'block';
    // Forzar reflow antes de agregar 'show' para transición correcta
    void m.offsetWidth;
    m.classList.add('show');
    
    const bd = $('modal-backdrop');
    if (bd) {
      bd.style.display = 'block';
      // Forzar reflow antes de agregar 'show'
      void bd.offsetWidth;
      bd.classList.add('show');
    }
  } catch (e) {
    console.warn('Error abriendo modal:', e);
  }
}

/**
 * Cerrar modal genérico
 */
export function closeModal(sel) {
  const m = q(sel);
  if (!m) return;
  
  try {
    if (!m.classList.contains('show')) {
      // ya cerrado
      limpiarTodosLosBackdrops();
      m.style.display = 'none';
      return;
    }
    
    m.classList.remove('show');
    setTimeout(() => {
      m.style.display = 'none';
    }, 150);
    
    // Limpiar todos los backdrops
    limpiarTodosLosBackdrops();
    
    // Limpiar overlay de emergencia si existe
    if (typeof window.cerrarOverlayEmergenciaSistema === 'function') {
      window.cerrarOverlayEmergenciaSistema();
    }
    
    // Restaurar body
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  } catch (e) {
    console.warn('Error cerrando modal:', e);
  }
}

/**
 * Limpiar todos los backdrops
 */
export function limpiarTodosLosBackdrops() {
  // Eliminar todos los backdrops creados dinámicamente
  const backdrops = document.querySelectorAll('.modal-backdrop');
  backdrops.forEach(bd => {
    bd.classList.remove('show');
    setTimeout(() => {
      bd.style.display = 'none';
      // Si no es el backdrop estático, eliminarlo completamente
      if (bd.id !== 'modal-backdrop') {
        bd.remove();
      }
    }, 150);
  });
  
  // También limpiar el backdrop estático
  const bdEstatico = document.getElementById('modal-backdrop');
  if (bdEstatico) {
    bdEstatico.classList.remove('show');
    setTimeout(() => {
      bdEstatico.style.display = 'none';
    }, 150);
  }
}

/**
 * Abrir modal de asignar número de inventario
 */
export function openSesionNumeroModal() {
  $('sn-pwd').value = '';
  $('sn-num').value = AppState.sesionActual?.numero || '';
  $('sn-area').value = 'Administración';
  $('sn-otro')?.classList.add('d-none');
  
  // Cargar colaboradores desde la API
  cargarColaboradoresInventario();
  openModal('#modalSesionNumero');
}

/**
 * Guardar número de sesión/inventario
 */
export async function guardarSesionNumero() {
  const pwd = $('sn-pwd')?.value || '';
  if (pwd !== CONFIG.JEFE_PWD) {
    alert('Contraseña incorrecta');
    return;
  }
  
  const num = ($('sn-num')?.value || '').trim();
  if (!num) {
    alert('Ingrese el N° de inventario');
    return;
  }
  
  const area = $('sn-area')?.value;
  let personaId = $('sn-persona')?.value;
  let personaNombre = $('sn-persona')?.selectedOptions[0]?.textContent || '';
  
  if (personaId === 'Otro') {
    personaNombre = ($('sn-otro')?.value || '').trim();
    if (!personaNombre) {
      alert('Especifique el nombre');
      return;
    }
    personaId = null; // No hay ID para "Otro"
  }
  
  // Enviar datos a la API
  try {
    const data = {
      nombre: num,
      area: area.toUpperCase(),
      autorizado_por: personaId || personaNombre
    };
    
    console.log('Enviando datos a API:', data);
    const response = await fetch(`${API_URLS.INVENTARIO}?method=insertar_numero_inventario`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    const resultado = await response.json();
    console.log('Respuesta de la API:', resultado);
    
    // Obtener el ID del inventario creado
    const inventarioId = resultado.id || await obtenerIdInventario(num);
    
    // Actualizar estado local
    AppState.sesionActual.numero = num;
    AppState.sesionActual.creadoPor = `${area} • ${personaNombre}`;
    AppState.sesionActual.inicio = fmt12();
    AppState.sesionActual.activo = true;
    AppState.sesionActual.inventarioId = inventarioId;
    
    closeModal('#modalSesionNumero');
    
    // Renderizar banner de sesión
    if (typeof window.renderSesionBanner === 'function') {
      window.renderSesionBanner();
    }
    
    openModal('#modalAviso');
    toast('Número de inventario asignado correctamente.', 'success');
  } catch (error) {
    console.error('Error al guardar número de inventario:', error);
    toast('Error al guardar en el servidor: ' + error.message, 'error');
  }
}

/**
 * Renderizar banner de sesión
 */
export function renderSesionBanner() {
  try {
    const s = AppState.sesionActual || {};
    const cont2 = document.getElementById('sesion-banner-global');
    if (!cont2) return;
    
    if (!s.numero) {
      cont2.innerHTML = '';
      return;
    }
    
    // Estado visual del candado:
    // - Verde (abierto) cuando el inventario está asignado/activo
    // - Rojo (cerrado) cuando el inventario está cerrado (no se puede registrar)
    const btn = s.activo
      ? '<button class="btn btn-sm btn-success ms-2" onclick="cerrarSesionNumero()" title="Inventario abierto (clic para cerrar)"><i class="bi bi-unlock-fill"></i></button>'
      : '<button class="btn btn-sm btn-danger ms-2" disabled title="Inventario cerrado"><i class="bi bi-lock-fill"></i></button>';
    
    cont2.innerHTML = `
      <div class="sesion-banner-top">
        Inventario: <strong>${s.numero}</strong> · Creado por: ${s.creadoPor || '-'} · Inicio: ${s.inicio || '-'}
        ${btn}
      </div>`;
  } catch (e) {
    console.warn('Error renderizando banner de sesión:', e);
  }
}

/**
 * Abrir modal de unirse a inventario
 */
export function openUnirseModal() {
  // Cargar lista de inventarios disponibles desde la API
  cargarInventariosDisponibles().then(inventarios => {
    const select = $('join-num');
    if (select) {
      select.innerHTML = '<option value="">Seleccione un inventario...</option>';
      inventarios.forEach(inv => {
        const option = document.createElement('option');
        option.value = inv.NOMBRE;
        option.textContent = inv.NOMBRE;
        option.dataset.id = inv.ID; // Guardar el ID
        select.appendChild(option);
      });
    }
  });
  
  openModal('#modalUnirse');
}

/**
 * Guardar unirse a inventario
 */
export async function guardarUnirse() {
  const select = $('join-num');
  const num = (select?.value || '').trim();
  
  if (!num) {
    alert('Selecciona un N° de inventario');
    return;
  }
  
  // Obtener el ID del inventario seleccionado (si está disponible)
  const selectedOption = select.selectedOptions[0];
  const inventarioId = selectedOption?.dataset?.id || null;
  
  console.log('Datos del inventario seleccionado:');
  console.log('- Nombre:', num);
  console.log('- ID:', inventarioId);
  
  AppState.sesionActual.numero = num;
  AppState.sesionActual.inventarioId = inventarioId; // Guardar el ID también
  AppState.sesionActual.activo = true;
  AppState.sesionActual.inicio = AppState.sesionActual.inicio || fmt12();
  
  // Cargar conteos desde la API para ambos almacenes
  if (inventarioId) {
    console.log('Cargando conteos para inventario ID:', inventarioId);
    
    try {
      // Cargar conteos para Callao
      await cargarConteosDesdeAPI(inventarioId, 'callao');
      
      // Cargar conteos para Malvinas
      await cargarConteosDesdeAPI(inventarioId, 'malvinas');
      
      toast(`Conteos cargados para inventario ${num}`, 'success');
    } catch (error) {
      console.error('Error cargando conteos:', error);
      toast('Error al cargar conteos, pero puedes continuar', 'warning');
    }
  } else {
    console.warn('No se encontró ID del inventario, no se pueden cargar conteos');
    toast('No se pudieron cargar los conteos (ID no disponible)', 'warning');
  }
  
  closeModal('#modalUnirse');
  renderSesionBanner();
  openModal('#modalAviso');
  toast('Unido al inventario ' + num, 'success');
}

/**
 * Cerrar sesión de inventario
 */
export function cerrarSesionNumero() {
  const pwd = prompt('Contraseña para cerrar inventario');
  if (pwd !== CONFIG.JEFE_PWD) {
    alert('Contraseña incorrecta');
    return;
  }
  
  if (!confirm('¿Cerrar el inventario actual? No se podrán iniciar nuevos conteos con este número.')) return;
  
  AppState.sesionActual.activo = false;
  renderSesionBanner();
  toast('Inventario cerrado.', 'success');
}

/**
 * Abrir modal de inventario
 */
export async function openInventarioModal(almacen, tipo) {
  if (AppState.productos.length === 0) {
    alert('Primero sube el archivo de productos.');
    return;
  }
  
  if (!(AppState.sesionActual?.numero)) {
    alert('No hay N° de inventario activo. Asigna o únete a uno.');
    return;
  }
  
  if (almacen === 'callao') {
    const yaCerrado = (AppState.sesiones.callao || []).some(s =>
      s && s.tipo === tipo && !!s.fin
    );
    if (yaCerrado) {
      toast(`El conteo por ${tipo} ya fue registrado.`, 'info');
      return;
    }
  }
  
  inventarioCtx.almacen = almacen;
  inventarioCtx.tipo = tipo;

  const campoAlmacen = $('inv-almacen')?.closest('.col-md-6');
  const campoTipo = $('inv-tipo')?.closest('.col-md-6');
  const ocultarCamposBasicos = tipo === 'cajas';

  if (ocultarCamposBasicos) {
    campoAlmacen?.classList.add('d-none');
    campoTipo?.classList.add('d-none');
  } else {
    campoAlmacen?.classList.remove('d-none');
    campoTipo?.classList.remove('d-none');
  }
  
  $('inv-inicio').value = fmt12();
  $('inv-numero').value = AppState.sesionActual?.numero || `INV-${new Date().getFullYear()}-${(Math.floor(Math.random() * 900) + 100)}`;
  
  if (AppState.sesionActual?.activo && AppState.sesionActual?.numero) {
    $('inv-numero').setAttribute('disabled', 'disabled');
  } else {
    $('inv-numero').removeAttribute('disabled');
  }
  
  // Cargar colaboradores desde la API antes de abrir el modal
  await cargarColaboradoresConteo();
  
  // Si es Malvinas, cargar las tiendas desde la API
  if (almacen === 'malvinas') {
    await cargarTiendasMalvinas();
    $('bloque-tiendas')?.classList.remove('d-none');
  } else {
    $('bloque-tiendas')?.classList.add('d-none');
  }
  
  $('inv-otro')?.classList.add('d-none');
  $('inv-almacen').value = almacen;
  $('inv-tipo').value = tipo;
  
  openModal('#modalInventario');
}

/**
 * Validar modal de inventario
 */
export function validarModalInventario() {
  let ok = true;
  const n = $('inv-numero');
  const rr = $('inv-registrado');
  const ro = $('inv-otro');
  
  [n].forEach(el => {
    if (!el.value.trim()) {
      el.classList.add('is-invalid');
      ok = false;
    } else {
      el.classList.remove('is-invalid');
    }
  });
  
  if (rr.value === 'Otro') {
    if (!ro.value.trim()) {
      ro.classList.add('is-invalid');
      ok = false;
    } else {
      ro.classList.remove('is-invalid');
    }
  }
  
  if (inventarioCtx.almacen === 'malvinas') {
    const sel = $('inv-tienda');
    const tienda = sel?.value || '';
    if (!tienda) {
      alert('Seleccione una tienda.');
      ok = false;
    } else {
      const yaRegistrada = (AppState.sesiones.malvinas || []).some(s =>
        s && s.fin && s.tienda === tienda
      );
      if (yaRegistrada) {
        alert('La tienda seleccionada ya fue registrada.');
        ok = false;
      }
    }
  }
  
  return ok;
}

/**
 * Guardar modal de inventario
 */
export function guardarModalInventario() {
  if (!validarModalInventario()) return;
  
  const almacen = inventarioCtx.almacen;
  const tipo = inventarioCtx.tipo;
  const numero = $('inv-numero').value.trim();
  let registrado = $('inv-registrado').value;
  
  if (registrado === 'Otro') {
    registrado = $('inv-otro').value.trim();
  }
  
  const inicio = $('inv-inicio').value;
  let tienda = null;
  
  if (almacen === 'malvinas') {
    tienda = $('inv-tienda')?.value || null;
  }
  
  // Crear nueva sesión
  const sesion = {
    id: `local_${Date.now()}`,
    numero,
    registrado,
    inicio,
    tipo,
    tienda,
    filas: [],
    fin: null
  };
  
  AppState.sesiones[almacen].push(sesion);
  
  // Actualizar UI
  if (almacen === 'callao') {
    $('callao-numero').textContent = numero;
    $('callao-registrado').textContent = registrado;
    $('callao-inicio').textContent = inicio;
  } else if (almacen === 'malvinas') {
    $('malvinas-numero').textContent = numero;
    $('malvinas-registrado').textContent = registrado;
    $('malvinas-inicio').textContent = inicio;
    $('malvinas-tienda').textContent = tienda || '';
  }
  
  closeModal('#modalInventario');
  
  // Mostrar tabla de inventario
  if (typeof window.mostrarTablaInventario === 'function') {
    window.mostrarTablaInventario(almacen);
  }
  
  $(`panel-${almacen}`)?.classList.remove('invis');
}

/**
 * Abrir modal de procedimiento
 */
export function openProcedimientoModal() {
  // El contenido del procedimiento se mantiene en el HTML
  openModal('#modalProcedimiento');
}

/**
 * Guardar procedimiento (cerrar modal)
 */
export function guardarProcedimiento() {
  toast('Procedimiento cerrado.', 'info');
  closeModal('#modalProcedimiento');
}

// Exportar funciones para uso global (temporal hasta que se cree main.js)
window.openModal = openModal;
window.closeModal = closeModal;
window.limpiarTodosLosBackdrops = limpiarTodosLosBackdrops;
window.openSesionNumeroModal = openSesionNumeroModal;
window.guardarSesionNumero = guardarSesionNumero;
window.renderSesionBanner = renderSesionBanner;
window.openUnirseModal = openUnirseModal;
window.guardarUnirse = guardarUnirse;
window.cerrarSesionNumero = cerrarSesionNumero;
window.openInventarioModal = openInventarioModal;
window.validarModalInventario = validarModalInventario;
window.guardarModalInventario = guardarModalInventario;
window.openProcedimientoModal = openProcedimientoModal;
window.guardarProcedimiento = guardarProcedimiento;

