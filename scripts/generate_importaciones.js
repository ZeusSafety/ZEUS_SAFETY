// Script para generar archivos de importaciones desde template
const fs = require('fs');
const path = require('path');

// Configuración de módulos
const modules = [
    {
        name: 'marketing',
        returnPath: 'marketing.html',
        outputPath: 'public/marketing/importaciones.html',
        subMenus: `
                    <a href="public/marketing/listado_solicitudes.html" class="menu-item">
                        <i class="fas fa-list-alt"></i>
                        <span>Listado Solicitudes</span>
                    </a>
                    <a href="public/marketing/importaciones.html" class="menu-item active">
                        <i class="fas fa-ship"></i>
                        <span>Listado Importaciones</span>
                    </a>`
    },
    {
        name: 'ventas',
        returnPath: 'ventas.html',
        outputPath: 'public/ventas/importaciones.html',
        subMenus: `
                    <a href="public/facturacion/listado_incidencias_proforma.html" class="menu-item">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>Incidencias Proformas</span>
                    </a>
                    <a href="public/facturacion/listado_import_facturacion.html" class="menu-item">
                        <i class="fas fa-ship"></i>
                        <span>Listado Importaciones</span>
                    </a>
                    <a href="public/ventas/importaciones.html" class="menu-item active">
                        <i class="fas fa-ship"></i>
                        <span>Importaciones Ventas</span>
                    </a>`
    }
];

// Función para reemplazar placeholders en el template
function replacePlaceholders(template, module) {
    return template
        .replace(/\{\{returnPath\}\}/g, module.returnPath)
        .replace(/\{\{moduleName\}\}/g, module.name)
        .replace(/\{\{subMenus\}\}/g, module.subMenus || '');
}

// Función para generar archivos
function generateFiles() {
    try {
        // Leer el template
        const templatePath = path.join(__dirname, '..', 'public', 'templates', 'importaciones_template.html');
        const template = fs.readFileSync(templatePath, 'utf8');
        
        console.log('Template leído correctamente');
        
        // Generar archivos para cada módulo
        modules.forEach(module => {
            const content = replacePlaceholders(template, module);
            const outputPath = path.join(__dirname, '..', module.outputPath);
            
            // Crear directorio si no existe
            const dir = path.dirname(outputPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            // Escribir archivo
            fs.writeFileSync(outputPath, content, 'utf8');
            console.log(`Archivo generado: ${module.outputPath}`);
        });
        
        console.log('✅ Todos los archivos generados correctamente');
        
    } catch (error) {
        console.error('❌ Error al generar archivos:', error.message);
        process.exit(1);
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    generateFiles();
}

module.exports = { generateFiles, modules };
