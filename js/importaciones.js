// JavaScript para el módulo de importaciones
let registrosGlobal = [];
let registrosPaginados = [];
let paginaActual = 1;
const registrosPorPagina = 6;

// Funciones de paginación
function calcularPaginacion(registros) {
    const totalPaginas = Math.ceil(registros.length / registrosPorPagina);
    const inicio = (paginaActual - 1) * registrosPorPagina;
    const fin = inicio + registrosPorPagina;
    registrosPaginados = registros.slice(inicio, fin);
    return totalPaginas;
}

function actualizarPaginacion(totalPaginas) {
    const paginationContainer = document.getElementById('paginationContainer');
    const paginationInfo = document.getElementById('paginationInfo');
    const btnPrimera = document.getElementById('btnPrimera');
    const btnAnterior = document.getElementById('btnAnterior');
    const btnSiguiente = document.getElementById('btnSiguiente');
    const btnUltima = document.getElementById('btnUltima');

    if (totalPaginas <= 1) {
        paginationContainer.style.display = 'none';
        return;
    }

    paginationContainer.style.display = 'flex';
    paginationInfo.textContent = `Página ${paginaActual} de ${totalPaginas}`;

    // Habilitar/deshabilitar botones
    btnPrimera.disabled = paginaActual === 1;
    btnAnterior.disabled = paginaActual === 1;
    btnSiguiente.disabled = paginaActual === totalPaginas;
    btnUltima.disabled = paginaActual === totalPaginas;
}

function irAPagina(pagina) {
    if (pagina < 1 || pagina > Math.ceil(registrosGlobal.length / registrosPorPagina)) {
        return;
    }
    paginaActual = pagina;
    const totalPaginas = calcularPaginacion(registrosGlobal);
    actualizarPaginacion(totalPaginas);
    renderizarTabla();
}

// Función para consumir la API
async function obtenerDatosAPI() {
    const api = "https://importacionesvr01crud-2946605267.us-central1.run.app";

    try {
        const response = await fetch(api);

        if (response.status === 200) {
            const datos = await response.text();
            console.log("Datos extraídos correctamente");
            return datos;
        } else {
            console.error("Error al extraer los datos");
            throw new Error(`Error HTTP: ${response.status}`);
        }
    } catch (error) {
        console.error("Error en la petición:", error);
        throw error;
    }
}

// Función para actualizar datos en la API
async function actualizarDatosAPI(datos) {
    const api = "https://importacionesvr01crud-2946605267.us-central1.run.app";
    const area = "importacion";

    try {
        console.log('Enviando petición PUT a:', api);
        console.log('Datos enviados:', JSON.stringify(datos, null, 2));

        const url = `${api}?area=${area}`;
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(datos)
        });

        console.log('Respuesta del servidor:', response.status, response.statusText);

        if (response.status === 200) {
            const resultado = await response.text();
            console.log("Datos actualizados correctamente");
            return resultado;
        } else {
            let errorMessage = `Error HTTP: ${response.status}`;
            try {
                const errorData = await response.text();
                console.error('Respuesta de error del servidor:', errorData);
                errorMessage += ` - ${errorData}`;
            } catch (e) {
                console.error('No se pudo leer el mensaje de error del servidor');
            }
            throw new Error(errorMessage);
        }
    } catch (error) {
        console.error("Error en la petición de actualización:", error);
        throw error;
    }
}

function cargarTablaImportaciones(filtrados = null) {
    const tbody = document.querySelector('#tablaImportaciones tbody');
    tbody.innerHTML = '<tr><td colspan="10" class="text-center">Cargando...</td></tr>';
    
    let ultimoId = localStorage.getItem('ultimoIdImportacion');

    const render = function (registros) {
        if (!Array.isArray(registros) || registros.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" class="text-center">Sin registros</td></tr>';
            actualizarPaginacion(0);
            return;
        }

        // Ordenar para que el registro con el ID más alto (último) esté primero
        if (registros.length > 1) {
            let maxId = Math.max(...registros.map(r => Number(r.ID_IMPORTACIONES) || 0));
            let idxNuevo = registros.findIndex(r => Number(r.ID_IMPORTACIONES) === maxId);
            if (idxNuevo > -1) {
                const nuevo = registros.splice(idxNuevo, 1)[0];
                registros.unshift(nuevo);
            }
        }

        // Calcular paginación
        const totalPaginas = calcularPaginacion(registros);
        actualizarPaginacion(totalPaginas);
        renderizarTabla(ultimoId);
    };

    if (filtrados && Array.isArray(filtrados)) {
        document.getElementById('btnFiltrar').disabled = false;
        render(filtrados);
        return;
    }

    // Deshabilitar el botón de filtro mientras carga
    document.getElementById('btnFiltrar').disabled = true;

    // Consumir la API
    obtenerDatosAPI()
        .then(function (datos) {
            let registros = [];
            try {
                registros = JSON.parse(datos);
            } catch (e) {
                console.log("Los datos no son JSON válido, procesando como texto");
                registros = [];
            }

            if (Array.isArray(registros)) {
                registrosGlobal = registros;
            } else {
                registrosGlobal = [];
            }
            render(registrosGlobal);
            document.getElementById('btnFiltrar').disabled = false;
        })
        .catch(function (err) {
            tbody.innerHTML = '<tr><td colspan="10" class="text-danger">Error al cargar datos: ' + err.message + '</td></tr>';
            document.getElementById('btnFiltrar').disabled = false;
        });
}

// Función para renderizar la tabla con paginación
function renderizarTabla(ultimoId) {
    const tbody = document.querySelector('#tablaImportaciones tbody');
    tbody.innerHTML = '';

    registrosPaginados.forEach(function (row, i) {
        const tr = document.createElement('tr');
        
        // Si es el primer registro y es el más nuevo, resaltar
        if (i === 0 && (String(row.ID_IMPORTACIONES) === String(ultimoId))) {
            tr.classList.add('fila-nueva');
        }

        // Crear las celdas en el orden correcto (sin TIPO_CARGA, CANAL, ACCIONES)
        const celdas = [
            row.FECHA_REGISTRO,
            row.NUMERO_DESPACHO,
            row.RESPONSABLE,
            row.PRODUCTOS,
            row.ARCHIVO_PDF_URL,
            row.FECHA_LLEGADA_PRODUCTOS,
            row.FECHA_ALMACEN,
            row.ESTADO_IMPORTACION,
            row.FECHA_RECEPCION,
            row.INCIDENCIAS
        ];

        celdas.forEach(function (cell, idx) {
            const td = document.createElement('td');

            if (idx === 0) { // Fecha Registro - solo fecha sin hora
                if (cell && cell !== 'null' && cell !== '') {
                    let fecha = String(cell).split(' ')[0];
                    if (fecha.includes('/')) {
                        const partes = fecha.split('/');
                        if (partes.length === 3) {
                            fecha = `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
                        }
                    }
                    td.textContent = fecha;
                } else {
                    td.textContent = '';
                }
            } else if (idx === 3) { // Productos
                td.style.minWidth = '180px';
                td.style.maxWidth = '320px';
                td.style.whiteSpace = 'pre-line';
                td.style.overflowWrap = 'break-word';
                td.style.wordBreak = 'break-word';
                td.style.verticalAlign = 'top';
                td.style.position = 'relative';
                td.style.height = '100%';
                if (cell && String(cell).length > 120) {
                    td.style.overflowY = 'auto';
                    td.style.maxHeight = '80px';
                }
                td.textContent = cell;
            } else if (idx === 4) { // Archivo PDF
                if (cell && typeof cell === 'string' && cell.startsWith('http')) {
                    td.innerHTML = `<button class="btn-action" onclick="window.open('${cell}','_blank')"><i class='fas fa-file-pdf'></i> PDF</button>`;
                } else {
                    td.textContent = cell;
                }
            } else if (idx === 6) { // Fecha de Almacén
                if (cell && cell !== 'null' && cell !== '') {
                    let fecha = cell;
                    if (fecha.includes('/')) {
                        const partes = fecha.split('/');
                        if (partes.length === 3) {
                            fecha = `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
                        }
                    }
                    td.textContent = fecha;
                } else {
                    td.textContent = '';
                }
            } else if (idx === 7) { // Estado
                let estado = String(cell).toUpperCase();
                if (estado === 'TRANSITO') {
                    td.innerHTML = `<span class='status-badge status-transito'>${cell}</span>`;
                } else if (estado === 'PRODUCCION') {
                    td.innerHTML = `<span class='status-badge status-produccion'>${cell}</span>`;
                } else if (estado === 'ETA') {
                    td.innerHTML = `<span class='status-badge status-eta'>${cell}</span>`;
                } else {
                    td.textContent = cell;
                }
            } else if (idx === 8) { // Fecha Recepción
                if (cell && cell !== 'null' && cell !== '') {
                    let fecha = cell;
                    if (cell.includes('/')) {
                        const partes = cell.split('/');
                        if (partes.length === 3) {
                            fecha = `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
                        }
                    }
                    td.textContent = fecha;
                } else {
                    td.textContent = '';
                }
            } else if (idx === 9) { // Incidencias
                let incidencia = String(cell).toUpperCase();
                if (incidencia === 'SI') {
                    td.innerHTML = `<span class='status-badge incidencia-si'>${cell}</span>`;
                } else if (incidencia === 'NO') {
                    td.innerHTML = `<span class='status-badge incidencia-no'>${cell}</span>`;
                } else {
                    td.textContent = cell || '';
                }
            } else {
                td.textContent = cell;
            }
            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });
}


// Event listeners
document.addEventListener('DOMContentLoaded', function () {
    // Event listeners para paginación
    document.getElementById('btnPrimera').onclick = () => irAPagina(1);
    document.getElementById('btnAnterior').onclick = () => irAPagina(paginaActual - 1);
    document.getElementById('btnSiguiente').onclick = () => irAPagina(paginaActual + 1);
    document.getElementById('btnUltima').onclick = () => irAPagina(Math.ceil(registrosGlobal.length / registrosPorPagina));
    

    // Event listener para filtros
    document.getElementById('btnFiltrar').onclick = function () {
        if (!Array.isArray(registrosGlobal) || registrosGlobal.length === 0) {
            return;
        }
        const fechaInicio = document.getElementById('filtroFechaInicio').value;
        const fechaFinal = document.getElementById('filtroFechaFinal').value;
        const despacho = document.getElementById('filtroDespacho').value.trim().toLowerCase();

        let filtrados = registrosGlobal.filter(function (row) {
            let cumpleFecha = true;
            if (fechaInicio) {
                let f = row.FECHA_REGISTRO;
                if (f && f.length >= 10) {
                    let fRow = f.split(' ')[0].split('/').reverse().join('-');
                    cumpleFecha = cumpleFecha && (fRow >= fechaInicio);
                }
            }
            if (fechaFinal) {
                let f = row.FECHA_REGISTRO;
                if (f && f.length >= 10) {
                    let fRow = f.split(' ')[0].split('/').reverse().join('-');
                    cumpleFecha = cumpleFecha && (fRow <= fechaFinal);
                }
            }

            let cumpleDespacho = true;
            if (despacho) {
                cumpleDespacho = String(row.NUMERO_DESPACHO || '').toLowerCase().includes(despacho);
            }

            return cumpleFecha && cumpleDespacho;
        });
        
        paginaActual = 1;
        cargarTablaImportaciones(filtrados);
    };

    // Cargar datos iniciales
    cargarTablaImportaciones();
});

// Escuchar evento de registro exitoso
window.addEventListener('storage', function (e) {
    if (e.key === 'ultimoIdImportacion') {
        cargarTablaImportaciones();
    }
});
