/**
 * Módulo de API para Inventario
 * 
 * Contiene todas las funciones relacionadas con la gestión de inventarios.
 */

import { API_URLS, API_METHODS, API_SELECTORS } from '../config.js';
import { AppState } from '../state.js';
import { $, toast, fmt12, convertirFechaToMySQL } from '../utils.js';
import { obtenerIdRegistradoPor } from './colaboradores.js';

/**
 * Formatear fecha desde formato API a formato legible
 * @param {string} fechaAPI - Fecha en formato "2025-10-22 10:08:05"
 * @returns {string} Fecha en formato "10/22/2025 10:08 AM"
 */
export function formatearFechaDesdeAPI(fechaAPI) {
  try {
    const fecha = new Date(fechaAPI);
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const dia = fecha.getDate().toString().padStart(2, '0');
    const anio = fecha.getFullYear();
    let hora = fecha.getHours();
    const minuto = fecha.getMinutes().toString().padStart(2, '0');
    const ampm = hora >= 12 ? 'PM' : 'AM';
    
    hora = hora % 12;
    if (hora === 0) hora = 12;
    
    return `${mes}/${dia}/${anio} ${hora}:${minuto} ${ampm}`;
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return fechaAPI; // Retornar fecha original si hay error
  }
}

/**
 * Obtener el ID del inventario por su nombre
 */
export async function obtenerIdInventario(nombreInventario) {
  try {
    console.log('Buscando ID para inventario:', nombreInventario);
    
    const api = API_URLS.INVENTARIO;
    const method = API_METHODS.LISTAR_INVENTARIOS;
    const response = await fetch(`${api}?method=${method}`);
    
    if (response.status !== 200) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    const inventarios = await response.json();
    console.log('Inventarios disponibles:', inventarios);
    
    // Buscar el inventario por nombre
    const inventario = inventarios.find(inv => inv.NOMBRE === nombreInventario);
    
    if (inventario) {
      console.log('Inventario encontrado:', inventario);
      return inventario.ID;
    } else {
      console.warn('Inventario no encontrado, usando nombre como fallback');
      return nombreInventario; // Fallback al nombre si no se encuentra
    }
  } catch (error) {
    console.error('Error obteniendo ID del inventario:', error);
    console.warn('Usando nombre como fallback');
    return nombreInventario; // Fallback al nombre en caso de error
  }
}

/**
 * Cargar lista de inventarios disponibles desde la API
 */
export async function cargarInventariosDisponibles() {
  try {
    const response = await fetch(`${API_URLS.INVENTARIO}?method=${API_METHODS.LISTAR_INVENTARIOS}`);
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    const inventarios = await response.json();
    console.log('Inventarios cargados:', inventarios);
    return inventarios;
  } catch (error) {
    console.error('Error cargando inventarios:', error);
    toast('Error al cargar inventarios disponibles', 'error');
    return [];
  }
}

/**
 * Cargar conteos desde la API para un inventario y almacén específicos
 */
export async function cargarConteosDesdeAPI(idInventario, almacen) {
  try {
    console.log('Cargando conteos desde API para inventario:', idInventario, 'almacén:', almacen);
    
    const api = API_URLS.INVENTARIO;
    const method = API_METHODS.EXTRAER_INVENTARIOS_CONTEOS;
    const id = `${idInventario}-${almacen.toUpperCase()}`;
    
    console.log('URL completa:', `${api}?method=${method}&id=${id}`);
    
    const response = await fetch(`${api}?method=${method}&id=${id}`);
    
    console.log('Respuesta de la API:', response.status, response.statusText);
    
    if (response.status !== 200) {
      const errorText = await response.text();
      console.error('Error de la API:', errorText);
      throw new Error(`Error HTTP: ${response.status} - ${errorText}`);
    }
    
    const conteos = await response.json();
    console.log('Conteos cargados desde API:', conteos);
    
    // Limpiar sesiones existentes para este almacén
    AppState.sesiones[almacen] = [];
    
    // Convertir datos de la API al formato interno
    conteos.forEach((conteo, index) => {
      const sesion = {
        id: `api_${conteo.ID}`,
        numero: conteo.INVENTARIO,
        registrado: conteo.NOMBRE,
        inicio: formatearFechaDesdeAPI(conteo.FECHA_INICIO),
        fin: formatearFechaDesdeAPI(conteo.FECHA_FINAL),
        tipo: 'API',
        filas: [],
        pdfUrl: conteo.LINK_ARCHIVO_PDF,
        apiId: conteo.ID
      };
      
      AppState.sesiones[almacen].push(sesion);
    });
    
    console.log(`Cargados ${conteos.length} conteos para ${almacen}`);

    if (typeof window.renderListado === 'function') {
      window.renderListado(almacen);
    }
    
    return conteos;
  } catch (error) {
    console.error('Error cargando conteos desde API:', error);
    toast('Error al cargar conteos desde la API', 'error');
    return [];
  }
}

/**
 * Cargar conteos de Callao desde la API
 */
export async function cargarConteosCallao() {
  try {
    console.log('Cargando conteos de Callao desde API...');
    
    // Mostrar indicador de carga
    const tbody = $('#list-callao')?.querySelector('tbody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center"><i class="bi bi-arrow-clockwise spin"></i> Cargando datos desde la API...</td></tr>';
    }
    
    const api = API_URLS.INVENTARIO;
    const method = API_METHODS.EXTRAER_INVENTARIOS_CONTEOS;
    const id = "CALLAO";
    
    const response = await fetch(`${api}?method=${method}&id=${id}`);
    
    if (response.status !== 200) {
      const errorText = await response.text();
      throw new Error(`Error HTTP: ${response.status} - ${errorText}`);
    }
    
    const conteos = await response.json();
    
    // Limpiar sesiones existentes para Callao
    AppState.sesiones.callao = [];
    
    // Convertir datos de la API al formato interno
    conteos.forEach((conteo) => {
      const sesion = {
        id: `api_${conteo.ID}`,
        numero: conteo.INVENTARIO,
        registrado: conteo.NOMBRE,
        inicio: formatearFechaDesdeAPI(conteo.FECHA_INICIO),
        fin: formatearFechaDesdeAPI(conteo.FECHA_FINAL),
        tipo: 'API',
        filas: [],
        pdfUrl: conteo.LINK_ARCHIVO_PDF,
        apiId: conteo.ID
      };
      
      AppState.sesiones.callao.push(sesion);
    });
    
    console.log(`Cargados ${conteos.length} conteos para Callao`);
    
    if (typeof window.renderListado === 'function') {
      window.renderListado('callao');
    }
    
    // Mostrar mensaje de éxito
    if (conteos.length > 0) {
      toast(`Cargados ${conteos.length} conteos de Callao`, 'success');
    } else {
      toast('No se encontraron conteos para Callao', 'info');
    }
    
    return conteos;
  } catch (error) {
    console.error('Error cargando conteos de Callao desde API:', error);
    toast('Error al cargar conteos de Callao desde la API', 'error');
    
    // Mostrar mensaje de error en la tabla
    const tbody = $('#list-callao')?.querySelector('tbody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger"><i class="bi bi-exclamation-triangle"></i> Error al cargar datos</td></tr>';
    }
    
    return [];
  }
}

/**
 * Cargar conteos de Malvinas desde la API
 */
export async function cargarConteosMalvinas() {
  try {
    console.log('Cargando conteos de Malvinas desde API...');
    
    // Mostrar indicador de carga
    const tbody = $('#list-malvinas')?.querySelector('tbody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center"><i class="bi bi-arrow-clockwise spin"></i> Cargando datos desde la API...</td></tr>';
    }
    
    const api = API_URLS.INVENTARIO;
    const method = API_METHODS.EXTRAER_INVENTARIOS_CONTEOS;
    const id = "MALVINAS";
    
    const response = await fetch(`${api}?method=${method}&id=${id}`);
    
    if (response.status !== 200) {
      const errorText = await response.text();
      throw new Error(`Error HTTP: ${response.status} - ${errorText}`);
    }
    
    const conteos = await response.json();
    
    // Limpiar sesiones existentes para Malvinas
    AppState.sesiones.malvinas = [];
    
    // Convertir datos de la API al formato interno
    conteos.forEach((conteo) => {
      const sesion = {
        id: `api_${conteo.ID}`,
        numero: conteo.INVENTARIO,
        registrado: conteo.NOMBRE,
        inicio: formatearFechaDesdeAPI(conteo.FECHA_INICIO),
        fin: formatearFechaDesdeAPI(conteo.FECHA_FINAL),
        tipo: 'API',
        filas: [],
        pdfUrl: conteo.LINK_ARCHIVO_PDF,
        apiId: conteo.ID,
        tienda: conteo.PUNTO_OPERACION || ''
      };
      
      AppState.sesiones.malvinas.push(sesion);
    });
    
    console.log(`Cargados ${conteos.length} conteos para Malvinas`);
    
    if (typeof window.renderListado === 'function') {
      window.renderListado('malvinas');
    }
    
    // Mostrar mensaje de éxito
    if (conteos.length > 0) {
      toast(`Cargados ${conteos.length} conteos de Malvinas`, 'success');
    } else {
      toast('No se encontraron conteos para Malvinas', 'info');
    }
    
    return conteos;
  } catch (error) {
    console.error('Error cargando conteos de Malvinas desde API:', error);
    toast('Error al cargar conteos de Malvinas desde la API', 'error');
    
    // Mostrar mensaje de error en la tabla
    const tbody = $('#list-malvinas')?.querySelector('tbody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger"><i class="bi bi-exclamation-triangle"></i> Error al cargar datos</td></tr>';
    }
    
    return [];
  }
}

/**
 * Obtener ID del punto de operación
 */
export function obtenerIdPuntoOperacion(almacen, tienda = null) {
  if (almacen === 'callao') return '2';
  
  // Para Malvinas, obtener el ID de la tienda
  if (almacen === 'malvinas' && tienda) {
    const selectTienda = $('#inv-tienda');
    if (selectTienda) {
      const selectedOption = selectTienda.selectedOptions[0];
      const tiendaId = selectedOption?.dataset?.id;
      if (tiendaId) {
        console.log('ID de tienda obtenido:', tiendaId);
        return tiendaId;
      }
    }
    
    // Fallback al mapeo manual si no se encuentra el ID
    const mapeoTiendas = {
      'TIENDA 3006': '3',
      'TIENDA 3006 B': '4',
      'TIENDA 3131': '5',
      'TIENDA 3133': '6',
      'TIENDA 412-A': '7'
    };
    return mapeoTiendas[tienda] || '3';
  }
  
  return '3'; // Fallback por defecto
}

/**
 * Cargar datos físicos desde API
 */
export async function cargarDatosFisicosDesdeAPI(almacen) {
  console.log('Cargando datos físicos desde API para:', almacen);
  
  if (!AppState.sesionActual?.numero) {
    throw new Error('No hay inventario activo');
  }
  
  const method = "listar_conteo_punto_operacion";
  const idInventario = `${AppState.sesionActual.numero}-${almacen}`;
  const url = `${API_URLS.INVENTARIO}?method=${method}&id=${encodeURIComponent(idInventario)}`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.warn('API no devolvió un array:', data);
      return [];
    }
    
    // Convertir datos de API al formato esperado
    const datosFisicos = data.map((item, index) => ({
      item: index + 1,
      producto: item.PRODUCTO || '',
      codigo: item.CODIGO || '',
      cantidad_fisica: Number(item.TOTAL) || 0,
      unidad_medida: item.UNIDAD_MEDIDA || 'UNI'
    })).filter(item => item.codigo);
    
    console.log(`Datos físicos cargados para ${almacen}:`, datosFisicos.length, 'productos');
    
    return datosFisicos;
    
  } catch (error) {
    console.error('Error cargando datos físicos:', error);
    
    if (error.name === 'AbortError') {
      throw new Error('Timeout: La API tardó más de 30 segundos en responder');
    } else if (error.message.includes('Failed to fetch')) {
      throw new Error('Error de conexión: No se pudo conectar con la API');
    } else {
      throw new Error(`Error cargando datos físicos: ${error.message}`);
    }
  }
}

/**
 * Cargar datos de comparación desde API
 */
export async function cargarDatosComparacionDesdeAPI(almacen) {
  console.log('Cargando datos de comparación desde API para:', almacen);
  
  if (!AppState.sesionActual?.numero) {
    throw new Error('No hay inventario activo');
  }
  
  const method = "listar_conteo_punto_operacion";
  const idInventario = `${AppState.sesionActual.numero}-${almacen}`;
  const url = `${API_URLS.INVENTARIO}?method=${method}&id=${encodeURIComponent(idInventario)}`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.warn('API no devolvió un array:', data);
      AppState.sistema[almacen] = [];
      return;
    }
    
    // Convertir datos de API al formato esperado
    const datosSistema = data.map((item, index) => ({
      item: index + 1,
      producto: item.PRODUCTO || '',
      codigo: item.CODIGO || '',
      cantidad_sistema: Number(item.TOTAL) || 0,
      unidad_medida: item.UNIDAD_MEDIDA || 'UNI'
    }));
    
    // Filtrar solo productos con código
    const datosFiltrados = datosSistema.filter(item => item.codigo);
    
    AppState.sistema[almacen] = datosFiltrados;
    
    console.log(`Datos del sistema cargados para ${almacen}:`, datosFiltrados.length, 'productos');
    
    // Actualizar UI del botón
    try {
      const targetBtn = almacen === 'callao' ? 
        $('#btn-alm-callao') : 
        $('#btn-alm-malvinas');
      
      if (targetBtn) {
        const ex = targetBtn.querySelector('.sys-count');
        if (ex) {
          ex.textContent = ` (${datosFiltrados.length})`;
        } else {
          const s = document.createElement('span');
          s.className = 'sys-count';
          s.textContent = ` (${datosFiltrados.length})`;
          targetBtn.appendChild(s);
        }
        targetBtn.classList.add('active-alm');
        setTimeout(() => targetBtn.classList.remove('active-alm'), 1200);
      }
    } catch (uiError) {
      console.warn('Error actualizando UI:', uiError);
    }
    
  } catch (error) {
    console.error('Error cargando datos de comparación:', error);
    
    if (error.name === 'AbortError') {
      throw new Error('Timeout: La API tardó más de 30 segundos en responder');
    } else if (error.message.includes('Failed to fetch')) {
      throw new Error('Error de conexión: No se pudo conectar con la API');
    } else {
      throw new Error(`Error cargando datos: ${error.message}`);
    }
  }
}

/**
 * Registrar inventario completo (generar PDF, subir archivo y guardar en BD)
 */
export async function registrarInventario(almacen) {
  // Obtener última sesión del almacén
  const sesiones = AppState.sesiones[almacen] || [];
  const sesion = sesiones[sesiones.length - 1];
  
  if (!sesion) {
    alert('No hay sesión.');
    return;
  }
  
  // Obtener los productos filtrados
  const excl = new Set(AppState.filtro.excluirCodigos.map(s => s.trim()).filter(Boolean));
  let fuente = [...AppState.productos];
  if (AppState.filtro.ocultarCero) fuente = fuente.filter(p => p.cantidad_sistema > 0);
  fuente = fuente.filter(p => !excl.has(p.codigo));
  
  if (fuente.length === 0) {
    alert('No hay productos para registrar.');
    return;
  }
  
  // Crear un mapa de cantidades ingresadas
  const mapCant = new Map((sesion.filas || []).map(f => [f.codigo, f.cantidad]));
  
  // Construir filas finales con todos los productos
  const filas = [];
  let faltantes = 0;
  
  fuente.forEach(p => {
    const cantidad = mapCant.has(p.codigo) ? mapCant.get(p.codigo) : 0;
    if (cantidad === 0 || cantidad === '') faltantes++;
    
    filas.push({
      item: p.item,
      producto: p.producto,
      codigo: p.codigo,
      unidad_medida: p.unidad_medida,
      cantidad: Number(cantidad || 0),
      id_producto: p.id
    });
  });
  
  if (faltantes > 0) {
    if (!confirm(`Hay ${faltantes} productos sin cantidad registrada. ¿Deseas continuar?`)) return;
  }
  
  // Actualizar sesión local
  sesion.filas = filas;
  sesion.fin = fmt12();
  
  // Mostrar toast de procesamiento
  toast('Generando PDF y registrando inventario...', 'info');
  
  try {
    // 1. Generar PDF y obtener blob
    const { generarPDFConteoBlob } = await import('../components/pdf.js');
    const pdfBlob = await generarPDFConteoBlob(almacen, sesion);
    
    // 2. Subir PDF a la API de archivos
    const folderBucket = "inventario_conteo";
    const formData = new FormData();
    const nombreArchivo = `inventario_${almacen}_${sesion.numero.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;
    formData.append('file', pdfBlob, nombreArchivo);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const responseArchivo = await fetch(`${API_URLS.ARCHIVOS}?folder_bucket=${folderBucket}`, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (responseArchivo.status !== 200) {
      const errorText = await responseArchivo.text();
      throw new Error(`Error al subir el PDF: ${responseArchivo.status} - ${errorText}`);
    }
    
    const dataArchivo = await responseArchivo.json();
    const urlArchivo = dataArchivo.url;
    sesion.pdfUrl = urlArchivo;
    
    // 3. Preparar datos para la API de inventario
    const fechaInicio = convertirFechaToMySQL(sesion.inicio);
    const fechaFinal = convertirFechaToMySQL(sesion.fin);
    const idRegistradoPor = sesion.registradoId || await obtenerIdRegistradoPor(sesion.registrado);
    const idPuntoOperacion = obtenerIdPuntoOperacion(almacen, sesion.tienda);
    
    // Obtener el ID del inventario
    let idInventario;
    if (AppState.sesionActual?.inventarioId) {
      idInventario = AppState.sesionActual.inventarioId;
    } else {
      idInventario = await obtenerIdInventario(sesion.numero);
    }
    
    // Preparar array de productos
    const productosParaAPI = filas.map(f => ({
      id_productos: String(f.id_producto),
      cantidad: String(f.cantidad || 0),
      unidad_medida: f.unidad_medida
    }));
    
    const dataInventario = {
      id_inventario: idInventario,
      id_punto_operacion: idPuntoOperacion,
      fecha_inicio: fechaInicio,
      fecha_final: fechaFinal,
      registrado_por: idRegistradoPor,
      url_archivo: urlArchivo,
      productos: productosParaAPI
    };
    
    // 4. Enviar datos a la API de inventario
    const method = "insertar_conteo";
    const urlInventario = `${API_URLS.INVENTARIO}?method=${method}`;
    
    const controller2 = new AbortController();
    const timeoutId2 = setTimeout(() => controller2.abort(), 30000);
    
    const responseInventario = await fetch(urlInventario, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataInventario),
      signal: controller2.signal
    });
    
    clearTimeout(timeoutId2);
    
    if (responseInventario.status !== 200) {
      const errorText = await responseInventario.text();
      throw new Error(`Error al registrar el inventario: ${responseInventario.status} - ${errorText}`);
    }
    
    const resultInventario = await responseInventario.json();
    toast('Inventario registrado correctamente en la base de datos', 'success');
    
    // 5. Actualizar interfaz (estas funciones se moverán a las vistas correspondientes)
    if (typeof window.renderListado === 'function') {
      window.renderListado(almacen);
    }
    if (almacen === 'malvinas' && typeof window.setTiendaStatus === 'function') {
      window.setTiendaStatus(sesion.tienda, 'listo');
    }
    if (typeof window.renderConsolidado === 'function') {
      window.renderConsolidado();
    }
    if (typeof window.renderRegistro === 'function') {
      window.renderRegistro();
    }
    
  } catch (error) {
    console.error('Error al registrar inventario:', error);
    
    let mensajeError = 'Error desconocido';
    if (error.name === 'AbortError') {
      mensajeError = 'Timeout: La operación tardó demasiado tiempo. Verifique su conexión a internet.';
    } else if (error.message.includes('Failed to fetch')) {
      mensajeError = 'Error de conexión: No se pudo conectar con el servidor. Verifique su conexión a internet.';
    } else if (error.message.includes('CORS')) {
      mensajeError = 'Error CORS: Problema de permisos del navegador.';
    } else {
      mensajeError = error.message || 'Error desconocido';
    }
    
    toast('Error al registrar el inventario: ' + mensajeError, 'error');
    alert('Ocurrió un error al registrar el inventario:\n\n' + mensajeError + '\n\nPor favor, intente nuevamente.');
  }
}

/**
 * Obtener reportes de inventarios generales
 */
export async function obtenerReportesInventarios() {
  try {
    const api = API_URLS.INVENTARIO;
    const method = API_METHODS.COLABORADORES_INVENTARIO;
    const selector = API_SELECTORS.INVENTARIOS_GENERAL_REPORTE;
    
    const url = `${api}?method=${method}&selector=${selector}`;
    console.log('Obteniendo reportes desde:', url);
    
    const response = await fetch(url);
    
    if (response.status !== 200) {
      const errorText = await response.text();
      console.error('Error de la API:', errorText);
      throw new Error(`Error HTTP: ${response.status} - ${errorText}`);
    }
    
    const datos = await response.json();
    console.log('Reportes obtenidos (raw):', datos);
    
    // Normalizar datos
    const reportes = Array.isArray(datos) ? datos : [datos];
    console.log('Reportes normalizados:', reportes);
    console.log('Cantidad de reportes:', reportes.length);
    
    // Guardar en el estado
    AppState.reportes = reportes;
    console.log('AppState.reportes actualizado:', AppState.reportes);
    
    return reportes;
  } catch (error) {
    console.error('Error obteniendo reportes:', error);
    toast('Error al cargar reportes desde la API', 'error');
    AppState.reportes = [];
    return [];
  }
}

/**
 * Obtener datos de seguimiento de inventarios
 */
export async function obtenerSeguimientoInventarios() {
  try {
    const api = API_URLS.INVENTARIO;
    const method = API_METHODS.COLABORADORES_INVENTARIO;
    const selector = API_SELECTORS.INVENTARIOS_GENERAL_SEGUIMIENTO;
    
    const url = `${api}?method=${method}&selector=${selector}`;
    console.log('Obteniendo seguimiento desde:', url);
    
    const response = await fetch(url);
    
    if (response.status !== 200) {
      const errorText = await response.text();
      console.error('Error de la API:', errorText);
      throw new Error(`Error HTTP: ${response.status} - ${errorText}`);
    }
    
    const datos = await response.json();
    console.log('Seguimiento obtenido (raw):', datos);
    
    // Normalizar datos
    const seguimiento = Array.isArray(datos) ? datos : [datos];
    console.log('Seguimiento normalizado:', seguimiento);
    console.log('Cantidad de registros:', seguimiento.length);
    
    // Guardar en el estado
    AppState.seguimiento = seguimiento;
    console.log('AppState.seguimiento actualizado:', AppState.seguimiento);
    
    return seguimiento;
  } catch (error) {
    console.error('Error obteniendo seguimiento:', error);
    toast('Error al cargar seguimiento desde la API', 'error');
    AppState.seguimiento = [];
    return [];
  }
}

/**
 * Parsear el campo INFORME que contiene JSON con enlaces PDF
 */
export function parsearInforme(informeStr) {
  if (!informeStr) return [];
  
  try {
    // Si es un string, intentar parsearlo
    const informe = typeof informeStr === 'string' ? JSON.parse(informeStr) : informeStr;
    
    // Si es un array, retornarlo directamente
    if (Array.isArray(informe)) {
      return informe;
    }
    
    // Si es un objeto con una propiedad que contiene el array
    if (typeof informe === 'object' && informe.pdf) {
      return [informe];
    }
    
    // Si es un objeto, convertirlo a array
    return [informe];
  } catch (error) {
    console.warn('Error parseando informe:', error, 'Valor:', informeStr);
    // Si falla el parseo, intentar extraer URLs directamente
    const urlRegex = /https?:\/\/[^\s"']+/g;
    const urls = informeStr.match(urlRegex);
    if (urls) {
      return urls.map(url => ({ pdf: url }));
    }
    return [];
  }
}

