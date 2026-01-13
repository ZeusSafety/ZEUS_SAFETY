/**
 * Módulo de API para Colaboradores
 * 
 * Contiene todas las funciones relacionadas con la gestión de colaboradores.
 */

import { API_URLS, API_METHODS } from '../config.js';
import { AppState } from '../state.js';
import { $, toast } from '../utils.js';

/**
 * Cargar colaboradores desde la API
 * @param {string} selector - Selector para filtrar colaboradores (VISTA_INVENTARIO, VISTA_CONTEO_INVENTARIO, etc.)
 * @param {string} targetSelectId - ID del elemento select donde se cargarán los colaboradores
 */
export async function cargarColaboradoresInventario(selector = 'VISTA_INVENTARIO', targetSelectId = 'sn-persona') {
  try {
    const api = API_URLS.INVENTARIO;
    const method = API_METHODS.COLABORADORES_INVENTARIO;
    const response = await fetch(`${api}?method=${method}&selector=${selector}`);
    
    if (response.status !== 200) throw new Error(`Error HTTP: ${response.status}`);
    
    const colaboradores = await response.json();
    console.log(`Colaboradores cargados (${selector}):`, colaboradores);
    
    const selectPersona = $(targetSelectId);
    if (selectPersona) {
      selectPersona.innerHTML = '<option value="">Seleccione...</option>';
      (colaboradores || []).forEach(col => {
        const option = document.createElement('option');
        option.value = col.ID_PERSONA;
        option.textContent = col.NOMBRE;
        selectPersona.appendChild(option);
      });
      // Agregar opción "Otro" al final
      const optionOtro = document.createElement('option');
      optionOtro.value = 'Otro';
      optionOtro.textContent = 'Otro';
      selectPersona.appendChild(optionOtro);
    }
  } catch (error) {
    console.error('Error al cargar colaboradores:', error);
    toast('Error al cargar colaboradores. Usando valores por defecto.', 'error');
    // Valores por defecto en caso de error
    const selectPersona = $(targetSelectId);
    if (selectPersona) {
      selectPersona.innerHTML = '<option value="1">Hervin</option><option value="2">Kimberly</option><option value="3">Joseph</option><option value="Otro">Otro</option>';
    }
  }
}

/**
 * Función específica para cargar colaboradores del conteo de inventario
 */
export async function cargarColaboradoresConteo() {
  await cargarColaboradoresInventario('VISTA_CONTEO_INVENTARIO', 'inv-registrado');
}

/**
 * Obtener ID del colaborador por nombre
 */
export async function obtenerIdRegistradoPor(nombre) {
  try {
    // Si ya tenemos los colaboradores cargados, buscar en AppState
    if (AppState.colaboradoresAuditoria && AppState.colaboradoresAuditoria.length > 0) {
      const colaborador = AppState.colaboradoresAuditoria.find(col => col.NOMBRE === nombre);
      if (colaborador) {
        console.log(`ID encontrado para ${nombre}:`, colaborador.ID_PERSONA);
        return colaborador.ID_PERSONA.toString();
      }
    }
    
    // Si no está en cache, cargar desde API
    console.log(`Buscando ID para colaborador: ${nombre}`);
    const response = await fetch(`${API_URLS.INVENTARIO}?method=${API_METHODS.COLABORADORES_INVENTARIO}&selector=COLABORADORES_COMBO_AUDITORIA`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    const colaboradores = await response.json();
    
    // Guardar en cache para futuras consultas
    AppState.colaboradoresAuditoria = colaboradores;
    
    const colaborador = colaboradores.find(col => col.NOMBRE === nombre);
    if (colaborador) {
      console.log(`ID encontrado para ${nombre}:`, colaborador.ID_PERSONA);
      return colaborador.ID_PERSONA.toString();
    }
    
    console.warn(`No se encontró ID para colaborador: ${nombre}, usando ID por defecto: 1`);
    return '1'; // Fallback
  } catch (error) {
    console.error('Error obteniendo ID del colaborador:', error);
    return '1'; // Fallback
  }
}

/**
 * Probar la conectividad de las APIs
 */
export async function probarConectividadAPIs() {
  console.log('Probando conectividad de APIs...');
  
  // Probar API de archivos
  try {
    const apiArchivos = API_URLS.ARCHIVOS;
    console.log('Probando API de archivos:', apiArchivos);
    const responseArchivos = await fetch(apiArchivos, { method: 'GET' });
    console.log('API de archivos - Status:', responseArchivos.status);
  } catch (error) {
    console.error('Error conectando a API de archivos:', error);
  }
  
  // Probar API de inventario
  try {
    const apiInventario = API_URLS.INVENTARIO;
    console.log('Probando API de inventario:', apiInventario);
    const responseInventario = await fetch(apiInventario, { method: 'GET' });
    console.log('API de inventario - Status:', responseInventario.status);
  } catch (error) {
    console.error('Error conectando a API de inventario:', error);
  }
}

