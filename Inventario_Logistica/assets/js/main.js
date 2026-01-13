/**
 * Punto de entrada principal de la aplicación
 * 
 * Este archivo inicializa todos los módulos y configura la aplicación.
 */

// Importar módulos principales
import { AppState } from './state.js';
import { $, qa, q, toast } from './utils.js';
import { API_URLS } from './config.js';

// Importar módulos de API
import { cargarProductosDesdeAPI, actualizarBadgeProductos } from './api/productos.js';
import { probarConectividadAPIs } from './api/colaboradores.js';
import { cargarConteosCallao, cargarConteosMalvinas, registrarInventario } from './api/inventario.js';

// Importar módulos de navegación
import { showView } from './navigation.js';

// Importar módulos de componentes
import { renderSesionBanner } from './components/modals.js';
import { renderAcciones } from './components/tables.js';

// Importar módulos de vistas (para inicialización)
import { renderListado as renderListadoCallao } from './views/callao.js';
import { renderConsolidado } from './views/consolidado.js';
import { renderRegistro } from './views/registro.js';
import { renderListadoProformas } from './views/proformas.js';
import { renderGerencia } from './views/gerencia.js';
import './views/comparar.js';
import './views/seguimiento.js';

/**
 * Inicializar la aplicación cuando el DOM esté listo
 */
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Inicializando aplicación de Inventario...');
  
  try {
    // 1. Configurar event listeners globales
    configurarEventListeners();
    
    // 2. Cargar productos desde la API
    await cargarProductosDesdeAPI();
    
    // 3. Probar conectividad de APIs
    await probarConectividadAPIs();
    
    // 4. Renderizar banner de sesión si existe
    renderSesionBanner();
    
    // 5. Inicializar navegación
    inicializarNavegacion();
    
    // 6. Configurar handlers de archivos
    configurarHandlersArchivos();
    
    // 7. Mostrar vista inicial (Callao)
    showView('callao');
    
    console.log('✅ Aplicación inicializada correctamente');
    
  } catch (error) {
    console.error('❌ Error al inicializar la aplicación:', error);
    toast('Error al inicializar la aplicación: ' + error.message, 'error');
  }
});

function applySidebarState(collapsed) {
  const sidebar = q('.sidebar');
  const icon = $('#sidebarToggle')?.querySelector('i');
  if (collapsed) {
    document.body.classList.add('sidebar-collapsed');
  } else {
    document.body.classList.remove('sidebar-collapsed');
  }
  if (sidebar) {
    sidebar.classList.toggle('is-collapsed', collapsed);
  }
  if (icon) {
    icon.className = collapsed ? 'bi bi-list' : 'bi bi-chevron-double-left';
  }
}

function toggleSidebar(forceState) {
  let collapsed;
  if (typeof forceState === 'boolean') {
    collapsed = forceState;
  } else {
    collapsed = !document.body.classList.contains('sidebar-collapsed');
  }
  applySidebarState(collapsed);
}

/**
 * Configurar event listeners globales
 */
function configurarEventListeners() {
  // Event listeners para navegación del sidebar
  qa('.sidebar .nav-item').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const view = link.getAttribute('data-view');
      if (view) {
        showView(view);
      }
    });
  });

  applySidebarState(document.body.classList.contains('sidebar-collapsed'));
  
  // Event listener para cerrar modales con ESC
  document.addEventListener('keydown', async (e) => {
    if (e.key === 'Escape') {
      const modalesAbiertos = document.querySelectorAll('.modal.show');
      if (modalesAbiertos.length > 0) {
        const { closeModal } = await import('./components/modals.js');
        modalesAbiertos.forEach(modal => {
          closeModal(`#${modal.id}`);
        });
      }
    }
  });
  
  // Event listener para cerrar modales al hacer clic fuera
  document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('modal')) {
      const { closeModal } = await import('./components/modals.js');
      closeModal(`#${e.target.id}`);
    }
  });
}

/**
 * Inicializar navegación
 */
function inicializarNavegacion() {
  // La función showView ya maneja la navegación
  // Aquí se pueden agregar inicializaciones adicionales si es necesario
  console.log('Navegación inicializada');
}

/**
 * Configurar handlers para carga de archivos
 */
function configurarHandlersArchivos() {
  // Handler para carga de productos
  const inputProductos = $('#input-productos');
  if (inputProductos) {
    inputProductos.addEventListener('change', async (e) => {
      try {
        const { leerArchivoGenerico } = await import('./utils.js');
        const { cargarProductos } = await import('./api/productos.js');
        const file = e.target.files[0];
        if (file) {
          const datos = await leerArchivoGenerico(file);
          cargarProductos(datos);
          toast('Productos cargados correctamente', 'success');
        }
      } catch (error) {
        console.error('Error cargando productos:', error);
        toast('Error al cargar productos: ' + error.message, 'error');
      }
    });
  }
  
  // Handler para carga de sistema (Callao)
  const inputSistemaCallao = $('#input-excel-sistema');
  if (inputSistemaCallao) {
    inputSistemaCallao.addEventListener('change', async (e) => {
      try {
        // Esta función se maneja desde la vista de comparar
        // Se mantiene aquí por compatibilidad
        console.log('Carga de sistema desde main.js');
      } catch (error) {
        console.error('Error cargando sistema:', error);
        toast('Error al cargar sistema: ' + error.message, 'error');
      }
    });
  }
}

/**
 * Exportar funciones globales necesarias para compatibilidad
 * (temporal hasta que se refactorice completamente)
 */
window.AppState = AppState;
window.showView = showView;
window.renderSesionBanner = renderSesionBanner;
window.renderAcciones = renderAcciones;
window.renderConsolidado = renderConsolidado;
window.renderRegistro = renderRegistro;
window.renderListadoProformas = renderListadoProformas;
window.renderGerencia = renderGerencia;
window.registrarInventario = registrarInventario;
window.toggleSidebar = toggleSidebar;

// Exportar funciones de vistas para uso global
window.renderListado = (almacen) => {
  if (almacen === 'callao') {
    renderListadoCallao(almacen);
  } else if (almacen === 'malvinas') {
    // Malvinas usa la misma función de callao
    renderListadoCallao(almacen);
  }
};
window.cargarConteosCallao = cargarConteosCallao;
window.cargarConteosMalvinas = cargarConteosMalvinas;

// Manejo global de errores
window.addEventListener('error', (e) => {
  try {
    console.error('[APP ERROR]', e.error || e.message || e);
    toast('Error: ' + (e.error?.message || e.message || 'Error desconocido'), 'error');
  } catch (err) {
    console.error('Error en handler de errores:', err);
  }
});

// Manejo de errores no capturados en promesas
window.addEventListener('unhandledrejection', (e) => {
  try {
    console.error('[UNHANDLED PROMISE REJECTION]', e.reason);
    toast('Error no manejado: ' + (e.reason?.message || e.reason || 'Error desconocido'), 'error');
  } catch (err) {
    console.error('Error en handler de promesas rechazadas:', err);
  }
});

