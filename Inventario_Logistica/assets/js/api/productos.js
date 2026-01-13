/**
 * Módulo de API para Productos
 * 
 * Contiene todas las funciones relacionadas con la gestión de productos.
 */

import { API_URLS, API_METHODS } from '../config.js';
import { AppState } from '../state.js';
import { $, toast, normalizarClave } from '../utils.js';

/**
 * Cargar productos desde la API
 */
export async function cargarProductosDesdeAPI() {
  const apiStatus = document.getElementById('apiStatus');
  
  try {
    console.log('Cargando productos desde API...');
    apiStatus.className = 'api-status loading';
    apiStatus.innerHTML = '<i class="bi bi-arrow-repeat"></i> Conectando a API...';
    
    const api = API_URLS.PRODUCTOS;
    const metodo = API_METHODS.LISTADO_INVENTARIO;
    const response = await fetch(`${api}?metodo=${metodo}`);
    
    console.log('Status de respuesta:', response.status);
    
    if (response.status === 200) {
      const data = await response.json();
      console.log('Datos cargados desde API:', data);
      
      // Normalizar datos de la API con el nuevo formato
      // Formato esperado: {"ID": 1, "NOMBRE": "...", "CODIGO": "...", "UNIDAD_MEDIDA": "UNI"}
      AppState.productos = (data || []).map((item, i) => ({
        id: item.ID || (i + 1),
        item: i + 1,
        producto: item.NOMBRE || '',
        codigo: item.CODIGO || '',
        unidad_medida: item.UNIDAD_MEDIDA || 'UND',
        cantidad_sistema: 0 // Inicializar en 0, se actualizará con el sistema
      })).filter(p => p.codigo);
      
      apiStatus.className = 'api-status success';
      apiStatus.innerHTML = '<i class="bi bi-check-circle"></i> API Conectada';
      
      actualizarBadgeProductos();
      toast(`Productos cargados desde API: ${AppState.productos.length}`, 'success');
    } else {
      console.error('Error en la respuesta de la API:', response.status);
      apiStatus.className = 'api-status error';
      apiStatus.innerHTML = '<i class="bi bi-exclamation-triangle"></i> Error API';
      toast('Error al cargar productos desde la API', 'error');
    }
  } catch (error) {
    console.error('Error cargando productos desde API:', error);
    apiStatus.className = 'api-status error';
    apiStatus.innerHTML = '<i class="bi bi-exclamation-triangle"></i> Error de Red';
    toast('Error de conexión al cargar productos', 'error');
  }
}

/**
 * Cargar productos desde archivo local (CSV, XLSX, JSON)
 */
export function cargarProductos(datos) {
  AppState.productos = (datos || []).map((r, i) => {
    const m = {};
    Object.keys(r).forEach(k => m[normalizarClave(k)] = r[k]);
    
    return {
      item: Number(m.item || i + 1),
      producto: (m.producto || m.nombre || m.nombre_producto || m.descripcion || ''),
      codigo: (m.codigo || m.cod || m.sku || '').toString(),
      unidad_medida: (m.unidad_medida || m.um || 'UND'),
      cantidad_sistema: Number(m.cantidad_sistema || m.sistema || m.stock || 0)
    };
  }).filter(p => p.codigo);
  
  actualizarBadgeProductos();
}

/**
 * Actualizar badge de productos en la interfaz
 */
export function actualizarBadgeProductos() {
  const el = $('badgeProductos');
  if (!el) return;
  
  const n = Array.isArray(AppState.productos) ? AppState.productos.length : 0;
  el.textContent = 'Productos: ' + n;
  el.className = 'badge ' + (n > 0 ? 'bg-success' : 'bg-secondary') + ' align-self-center me-2';
}

