// Configuración centralizada para URLs de Apps Script
const APP_CONFIG = {
    // URL base de tu Apps Script - CAMBIA SOLO ESTA URL CUANDO DESPLIEGUES

    APPS_SCRIPT_BASE_URL: 'https://script.google.com/macros/s/AKfycbx3epK9g1KX0WzHpTHsgSY2S_kIyFVdazWay8BdUsxjkaVtGCND-QlAAt1wVlg2uAll/exec',

    
    // Páginas específicas - NO CAMBIAR ESTOS VALORES
    PAGES: {
        IMPORTACIONES: 'importacion',
        LISTADO_IMPORT: 'listado_import',
        LISTADO_IMPORT_UPDATE: 'listado_import_update',
        INCIDENCIA_LOGISTICA_FORMULARIO: 'incidencia_logistica_formulario',
        LISTADO_INCIDENCIAS: 'incidencia_listado_logistica',
        FICHA_IMPORTACION: 'ficha_importacion',
        REG_INCIDENCIAS_lOGIS: "reg_indicencias_logis"
    }
};

// Función para generar URLs completas
function getAppsScriptUrl(page) {
    return `${APP_CONFIG.APPS_SCRIPT_BASE_URL}?page=${page}`;
}

// Función para actualizar todos los enlaces automáticamente
function updateAllLinks() {
    const links = document.querySelectorAll('[data-apps-script-page]');
    links.forEach(link => {
        const page = link.getAttribute('data-apps-script-page');
        if (page) {
            link.href = getAppsScriptUrl(page);
            console.log(`Enlace actualizado: ${page} -> ${link.href}`);
        }
    });
}

// Función para validar que la URL base esté configurada
function validateConfig() {
    if (!APP_CONFIG.APPS_SCRIPT_BASE_URL || APP_CONFIG.APPS_SCRIPT_BASE_URL.includes('AKfycby8lMUREIn0p0ijuGCM5AyTdnUoYzjhssYBq0dbd_saHakNYWMZCEgjvvw6HC_0VyOh')) {
        console.warn('⚠️ IMPORTANTE: Actualiza la URL de Apps Script en js/config.js');
        console.warn('📝 Instrucciones:');
        console.warn('1. Despliega tu Apps Script');
        console.warn('2. Copia la nueva URL');
        console.warn('3. Reemplaza APPS_SCRIPT_BASE_URL en config.js');
    }
}

// Ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    validateConfig();
    updateAllLinks();
    
    // Mostrar información de configuración en consola
    console.log('🔧 Configuración de Apps Script cargada');
    console.log(`📡 URL Base: ${APP_CONFIG.APPS_SCRIPT_BASE_URL}`);
    console.log(`📄 Páginas disponibles: ${Object.values(APP_CONFIG.PAGES).join(', ')}`);
}); 