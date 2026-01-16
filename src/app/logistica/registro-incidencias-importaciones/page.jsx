"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/context/AuthContext";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";
import Modal from "../../../components/ui/Modal";

export default function RegistroIncidenciasImportacionesPage() {
    const router = useRouter();
    const { user, loading, token } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Estados principales
    const [searchBox, setSearchBox] = useState("");
    const [despachoInfo, setDespachoInfo] = useState(null);
    const [idImportaciones, setIdImportaciones] = useState(null);
    const [numeroDespacho, setNumeroDespacho] = useState("");
    const [pdfInicialUrl, setPdfInicialUrl] = useState("");
    const [pdfIncidenciaFile, setPdfIncidenciaFile] = useState(null);
    const [nombreArchivo, setNombreArchivo] = useState("");
    const [observaciones, setObservaciones] = useState("");
    const [alertMessage, setAlertMessage] = useState({ type: "", message: "" });

    // Estados de productos
    const [productosData, setProductosData] = useState([]);
    const [productosTable, setProductosTable] = useState([]);

    // Formulario de nuevo producto
    const [nuevoProducto, setNuevoProducto] = useState({
        item: "",
        producto: "",
        codigo: "",
        cantidadInicial: "",
        unidadMedida: "",
        cantidadRecibida: "",
        motivo: "",
        otrosMotivo: "",
    });

    // Autocompletado de productos
    const [autocompleteQuery, setAutocompleteQuery] = useState("");
    const [autocompleteResults, setAutocompleteResults] = useState([]);
    const [autocompleteVisible, setAutocompleteVisible] = useState(false);
    const autocompleteRef = useRef(null);
    const productoInputRef = useRef(null);
    const timeoutIdRef = useRef(null);

    // Modal de edición
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [filaEditando, setFilaEditando] = useState(null);
    const [editForm, setEditForm] = useState({
        cantidadRecibida: "",
        motivo: "",
        otrosMotivo: "",
    });

    // Estados de carga
    const [buscandoDespacho, setBuscandoDespacho] = useState(false);
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setSidebarOpen(true);
            } else {
                setSidebarOpen(false);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Cargar productos al montar
    useEffect(() => {
        if (user) {
            cargarProductos();
        }
    }, [user]);

    // Cerrar autocompletado al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (autocompleteRef.current && !autocompleteRef.current.contains(event.target)) {
                setAutocompleteVisible(false);
            }
        };

        if (autocompleteVisible) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [autocompleteVisible]);

    // Función para mostrar alertas
    const mostrarAlerta = (mensaje, tipo) => {
        setAlertMessage({ type: tipo, message: mensaje });
        setTimeout(() => {
            setAlertMessage({ type: "", message: "" });
        }, 5000);
    };

    // Cargar productos desde la API
    const cargarProductos = async () => {
        try {
            const apiUrl = 'https://productoscrud-2946605267.us-central1.run.app';
            const response = await fetch(apiUrl);

            if (response.ok) {
                const data = await response.json();
                setProductosData(data);
                console.log('✅ Productos cargados:', data.length);
            } else {
                console.error('❌ Error al cargar productos:', response.status);
                mostrarAlerta('Error al cargar la lista de productos', 'error');
            }
        } catch (error) {
            console.error('❌ Error al conectar con la API de productos:', error);
            mostrarAlerta('Error al conectar con la API de productos', 'error');
        }
    };

    // Buscar productos para autocompletado
    const buscarProductos = useCallback((query) => {
        if (timeoutIdRef.current) {
            clearTimeout(timeoutIdRef.current);
        }

        timeoutIdRef.current = setTimeout(() => {
            if (!query || query.trim().length < 1) {
                setAutocompleteResults([]);
                setAutocompleteVisible(false);
                return;
            }

            const queryLower = query.toLowerCase().trim();
            const resultados = productosData.filter(producto =>
                (producto.NOMBRE && producto.NOMBRE.toLowerCase().includes(queryLower)) ||
                (producto.CODIGO && producto.CODIGO.toLowerCase().includes(queryLower))
            ).slice(0, 10);

            setAutocompleteResults(resultados);
            setAutocompleteVisible(resultados.length > 0);
        }, 300);
    }, [productosData]);

    // Manejar cambio en input de producto
    const handleProductoInputChange = (e) => {
        const value = e.target.value;
        setAutocompleteQuery(value);
        setNuevoProducto({ ...nuevoProducto, producto: value, codigo: "" });
        buscarProductos(value);
    };

    // Seleccionar producto del autocompletado
    const seleccionarProducto = (producto) => {
        setNuevoProducto({
            ...nuevoProducto,
            producto: producto.NOMBRE || '',
            codigo: producto.CODIGO || '',
        });
        setAutocompleteQuery(producto.NOMBRE || '');
        setAutocompleteVisible(false);
    };

    // Toggle campo "otros motivo" en formulario nuevo
    const toggleOtrosMotivoNuevo = () => {
        if (nuevoProducto.motivo === 'otros') {
            // El campo ya está visible
        } else {
            setNuevoProducto({ ...nuevoProducto, otrosMotivo: '' });
        }
    };

    // Agregar producto a la tabla
    const agregarProducto = () => {
        if (!nuevoProducto.producto || !nuevoProducto.codigo) {
            mostrarAlerta('Debe seleccionar un producto', 'error');
            return;
        }

        if (!nuevoProducto.item || !nuevoProducto.cantidadInicial || !nuevoProducto.unidadMedida || !nuevoProducto.cantidadRecibida || !nuevoProducto.motivo) {
            mostrarAlerta('Debe completar todos los campos', 'error');
            return;
        }

        if (nuevoProducto.motivo === 'otros' && !nuevoProducto.otrosMotivo.trim()) {
            mostrarAlerta('Debe especificar el motivo si selecciona "Otros"', 'error');
            return;
        }

        const motivoFinal = nuevoProducto.motivo === 'otros' ? nuevoProducto.otrosMotivo.trim() : nuevoProducto.motivo;

        const nuevoItem = {
            id: Date.now(),
            item: nuevoProducto.item,
            producto: nuevoProducto.producto,
            codigo: nuevoProducto.codigo,
            cantidadInicial: nuevoProducto.cantidadInicial,
            unidadMedida: nuevoProducto.unidadMedida,
            cantidadRecibida: nuevoProducto.cantidadRecibida,
            motivo: motivoFinal,
        };

        setProductosTable([...productosTable, nuevoItem]);

        // Limpiar formulario
        setNuevoProducto({
            item: "",
            producto: "",
            codigo: "",
            cantidadInicial: "",
            unidadMedida: "",
            cantidadRecibida: "",
            motivo: "",
            otrosMotivo: "",
        });
        setAutocompleteQuery("");

        mostrarAlerta('Producto agregado exitosamente', 'success');
    };

    // Eliminar producto de la tabla
    const eliminarFila = (id) => {
        setProductosTable(productosTable.filter(p => p.id !== id));
    };

    // Editar fila
    const editarFila = (id) => {
        const producto = productosTable.find(p => p.id === id);
        if (!producto) return;

        // Detectar si el motivo es "otros"
        const motivosPredefinidos = ['falta', 'sobrante', 'dañado'];
        const esOtros = !motivosPredefinidos.includes(producto.motivo.toLowerCase());

        setFilaEditando(id);
        setEditForm({
            cantidadRecibida: producto.cantidadRecibida,
            motivo: esOtros ? 'otros' : producto.motivo.toLowerCase(),
            otrosMotivo: esOtros ? producto.motivo : '',
        });
        setEditModalOpen(true);
    };

    // Guardar edición
    const guardarEdicion = () => {
        if (!filaEditando) return;

        if (!editForm.cantidadRecibida || !editForm.motivo) {
            mostrarAlerta('Debe completar todos los campos', 'error');
            return;
        }

        if (editForm.motivo === 'otros' && !editForm.otrosMotivo.trim()) {
            mostrarAlerta('Debe especificar el motivo si selecciona "Otros"', 'error');
            return;
        }

        const motivoFinal = editForm.motivo === 'otros' ? editForm.otrosMotivo.trim() : editForm.motivo;

        setProductosTable(productosTable.map(p =>
            p.id === filaEditando
                ? { ...p, cantidadRecibida: editForm.cantidadRecibida, motivo: motivoFinal }
                : p
        ));

        setEditModalOpen(false);
        setFilaEditando(null);
        setEditForm({ cantidadRecibida: "", motivo: "", otrosMotivo: "" });
        mostrarAlerta('Producto actualizado exitosamente', 'success');
    };

    // Función auxiliar para procesar detalles
    const procesarDetalles = (despacho) => {
        if (!despacho) return [];

        // Intentar diferentes estructuras de datos
        let detalles = null;

        // Estructura 1: despacho.detalles (array)
        if (despacho.detalles && Array.isArray(despacho.detalles) && despacho.detalles.length > 0) {
            detalles = despacho.detalles;
            console.log('✅ Detalles encontrados en despacho.detalles:', detalles.length);
        }
        // Estructura 2: despacho.DETALLES (array, mayúsculas)
        else if (despacho.DETALLES && Array.isArray(despacho.DETALLES) && despacho.DETALLES.length > 0) {
            detalles = despacho.DETALLES;
            console.log('✅ Detalles encontrados en despacho.DETALLES:', detalles.length);
        }
        // Estructura 3: datos anidados directamente
        else if (despacho.datos && despacho.datos.detalles && Array.isArray(despacho.datos.detalles)) {
            detalles = despacho.datos.detalles;
            console.log('✅ Detalles encontrados en despacho.datos.detalles:', detalles.length);
        }

        if (detalles && detalles.length > 0) {
            return detalles.map((detalle, index) => ({
                id: Date.now() + index,
                item: detalle.ITEM || detalle.item || detalle.ITEM_PRODUCTO || '',
                producto: detalle.PRODUCTO || detalle.producto || detalle.NOMBRE || '',
                codigo: detalle.CODIGO || detalle.codigo || detalle.CODIGO_PRODUCTO || '',
                cantidadInicial: detalle.CANTIDAD || detalle.cantidad || detalle.CANTIDAD_INICIAL || '',
                unidadMedida: detalle.UNIDAD_MEDIDA || detalle.unidadMedida || detalle.UNIDAD || '',
                cantidadRecibida: '0',
                motivo: '',
            }));
        }

        console.log('⚠️ No se encontraron detalles en el despacho. Estructura recibida:', Object.keys(despacho));
        return [];
    };

    // Buscar despacho
    const extraerInformacion = async () => {
        if (!searchBox.trim()) {
            mostrarAlerta('Por favor, ingrese un número de despacho para buscar', 'error');
            return;
        }

        setBuscandoDespacho(true);

        try {
            const apiUrl = 'https://importacionesvr01crud-2946605267.us-central1.run.app';
            const response = await fetch(`${apiUrl}?despacho=${encodeURIComponent(searchBox.trim())}`);

            if (response.ok) {
                const responseText = await response.text();
                let data;

                try {
                    data = JSON.parse(responseText);
                    console.log('📦 Datos recibidos de la API:', data);
                } catch (parseError) {
                    console.error('Error al parsear JSON:', parseError);
                    console.error('Respuesta recibida:', responseText);
                    mostrarAlerta('Error al procesar la respuesta del servidor', 'error');
                    setBuscandoDespacho(false);
                    return;
                }

                let despacho = null;

                // Procesar si es array
                if (Array.isArray(data) && data.length > 0) {
                    despacho = data[0];
                    console.log('📋 Despacho encontrado (array):', despacho);
                }
                // Procesar si es objeto único
                else if (data && typeof data === 'object' && data.ID_IMPORTACIONES) {
                    despacho = data;
                    console.log('📋 Despacho encontrado (objeto único):', despacho);
                }

                if (despacho) {
                    // Actualizar información básica del despacho
                    setIdImportaciones(despacho.ID_IMPORTACIONES || despacho.id_importaciones);
                    setNumeroDespacho(despacho.NUMERO_DESPACHO || despacho.numero_despacho || '');
                    setPdfInicialUrl(despacho.ARCHIVO_PDF_URL || despacho.archivo_pdf_url || despacho.pdf_url || '');
                    setDespachoInfo({
                        id: despacho.ID_IMPORTACIONES || despacho.id_importaciones,
                        numero: despacho.NUMERO_DESPACHO || despacho.numero_despacho
                    });

                    // Procesar y cargar detalles en la tabla
                    const detallesProductos = procesarDetalles(despacho);
                    if (detallesProductos.length > 0) {
                        setProductosTable(detallesProductos);
                        console.log('✅ Productos cargados en la tabla:', detallesProductos.length);
                        mostrarAlerta(`Datos del despacho cargados exitosamente. ${detallesProductos.length} producto(s) agregado(s) a la tabla.`, 'success');
                    } else {
                        console.log('ℹ️ Despacho cargado pero sin detalles de productos');
                        mostrarAlerta('Datos del despacho cargados exitosamente. Puede agregar productos manualmente.', 'success');
                    }
                } else {
                    console.log('❌ No se encontró estructura válida de despacho:', data);
                    mostrarAlerta('No se encontraron datos para el despacho ingresado', 'error');
                }
            } else {
                const errorText = await response.text();
                console.error('Error HTTP:', response.status, errorText);
                mostrarAlerta('Error al buscar el despacho. Verifique su conexión a internet.', 'error');
            }
        } catch (error) {
            console.error('Error al extraer datos:', error);
            mostrarAlerta('Error al conectar con el servidor. Verifique su conexión a internet.', 'error');
        } finally {
            setBuscandoDespacho(false);
        }
    };

    // Mostrar nombre del archivo seleccionado
    const mostrarNombreArchivo = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPdfIncidenciaFile(file);
            setNombreArchivo(`Archivo seleccionado: ${file.name}`);
        } else {
            setPdfIncidenciaFile(null);
            setNombreArchivo('');
        }
    };

    // Guardar incidencia
    const guardarIncidencia = async (e) => {
        e.preventDefault();

        if (!idImportaciones) {
            mostrarAlerta('Debe buscar un despacho válido antes de guardar la incidencia', 'error');
            return;
        }

        if (productosTable.length === 0) {
            mostrarAlerta('Debe agregar al menos un producto con incidencia', 'error');
            return;
        }

        setGuardando(true);

        try {
            // Preparar detalles
            const detalles = productosTable.map(prod => ({
                producto: prod.producto,
                item: parseInt(prod.item) || 0,
                codigo: prod.codigo,
                unidad_medida: prod.unidadMedida,
                cantidad_inicial: parseFloat(prod.cantidadInicial) || 0,
                cantidad_recibida: parseFloat(prod.cantidadRecibida) || 0,
                motivo: prod.motivo,
            }));

            let pdfUrl = null;

            // Subir PDF si existe
            if (pdfIncidenciaFile) {
                try {
                    const formData = new FormData();
                    formData.append('file', pdfIncidenciaFile);

                    const uploadResponse = await fetch(
                        `https://api-subida-archivos-2946605267.us-central1.run.app?bucket_name=archivos_sistema&folder_bucket=incidencias_logistica&method=no_encriptar`,
                        {
                            method: 'POST',
                            body: formData,
                        }
                    );

                    if (!uploadResponse.ok) {
                        throw new Error(`Error al subir el PDF: ${uploadResponse.status}`);
                    }

                    const uploadData = await uploadResponse.json();
                    pdfUrl = uploadData.url || uploadData.pdf_url;

                    if (!pdfUrl) {
                        throw new Error("La API no devolvió la URL del PDF");
                    }
                } catch (uploadError) {
                    console.error('Error al subir PDF:', uploadError);
                    mostrarAlerta('Error al subir PDF: ' + uploadError.message, 'error');
                    setGuardando(false);
                    return;
                }
            }

            // Enviar datos a la API de incidencias
            const apiUrl = 'https://incidenciaslogisticacrud-2946605267.us-central1.run.app';

            const data = {
                id_importaciones: idImportaciones,
                pdf_url: pdfUrl,
                observaciones: observaciones,
                detalles: detalles,
            };

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                const responseData = await response.json();
                console.log('Datos de respuesta:', responseData);
                mostrarAlerta('Incidencia guardada exitosamente', 'success');
                limpiarFormulario();
            } else {
                const errorText = await response.text();
                console.error('Error HTTP:', response.status, errorText);
                mostrarAlerta(`Error al guardar la incidencia: ${response.status}`, 'error');
            }
        } catch (error) {
            console.error('Error al guardar incidencia:', error);
            mostrarAlerta('Error al guardar la incidencia: ' + error.message, 'error');
        } finally {
            setGuardando(false);
        }
    };

    // Limpiar formulario
    const limpiarFormulario = () => {
        setProductosTable([]);
        setObservaciones('');
        setPdfIncidenciaFile(null);
        setNombreArchivo('');
        setNuevoProducto({
            item: "",
            producto: "",
            codigo: "",
            cantidadInicial: "",
            unidadMedida: "",
            cantidadRecibida: "",
            motivo: "",
            otrosMotivo: "",
        });
        setAutocompleteQuery("");
        setDespachoInfo(null);
        setSearchBox('');
        setIdImportaciones(null);
        setNumeroDespacho('');
        setPdfInicialUrl('');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
            </div>
        );
    }

    if (!user) {
        return null;
    }


    return (
        <div className="flex h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${sidebarOpen ? "lg:ml-60 ml-0" : "ml-0"}`}>
                <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
                <main className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="p-4 lg:p-8">
                        {/* Botón Volver */}
                        <button
                            onClick={() => router.push("/logistica")}
                            className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-lg font-medium hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm ripple-effect relative overflow-hidden text-sm group"
                            style={{ fontFamily: 'var(--font-poppins)' }}
                        >
                            <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"></path>
                            </svg>
                            <span>Volver a Logística</span>
                        </button>

                        {/* Card Principal */}
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6" style={{ boxShadow: '0px 4px 12px rgba(0,0,0,0.06)' }}>
                            {/* Header */}
                            <div className="mb-6 pb-4 border-b border-gray-200">
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-[#002D5A] to-[#002D5A] rounded-xl flex items-center justify-center text-white shadow-sm">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'var(--font-poppins)' }}>
                                            Registrar nueva incidencia en operaciones logísticas
                                        </h1>
                                        <p className="text-sm text-gray-600 font-medium mt-0.5" style={{ fontFamily: 'var(--font-poppins)' }}>
                                            Registro y gestión de incidencias en importaciones
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Mensaje de Alerta */}
                            {alertMessage.message && (
                                <div className={`mb-4 p-4 rounded-lg ${alertMessage.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
                                    alertMessage.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
                                        'bg-blue-50 border border-blue-200 text-blue-800'
                                    }`} style={{ fontFamily: 'var(--font-poppins)' }}>
                                    {alertMessage.message}
                                </div>
                            )}

                            {/* Sección de Búsqueda */}
                            <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center" style={{ fontFamily: 'var(--font-poppins)' }}>
                                    <svg className="w-5 h-5 mr-2 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    Buscar Despacho
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                                            Número de Despacho:
                                        </label>
                                        <input
                                            type="text"
                                            value={searchBox}
                                            onChange={(e) => setSearchBox(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && extraerInformacion()}
                                            placeholder="Ingrese el número de despacho"
                                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                                            style={{ fontFamily: 'var(--font-poppins)' }}
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <button
                                            type="button"
                                            onClick={extraerInformacion}
                                            disabled={buscandoDespacho}
                                            className="w-full px-4 py-2.5 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                            style={{ fontFamily: 'var(--font-poppins)' }}
                                        >
                                            {buscandoDespacho ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Buscando...
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                    </svg>
                                                    Buscar Despacho
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Información del Despacho */}
                                {despachoInfo && (
                                    <div className="mt-4 flex items-center space-x-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                        <span className="text-green-700 font-semibold flex items-center" style={{ fontFamily: 'var(--font-poppins)' }}>
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Despacho cargado
                                        </span>
                                        <span className="text-gray-700 text-sm" style={{ fontFamily: 'var(--font-poppins)' }}>
                                            ID: {despachoInfo.id}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Formulario de Incidencia */}
                            <form onSubmit={guardarIncidencia} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                                            Número de Despacho:
                                        </label>
                                        <input
                                            type="text"
                                            value={numeroDespacho}
                                            readOnly
                                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed text-sm"
                                            style={{ fontFamily: 'var(--font-poppins)' }}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                                            PDF Inicial:
                                        </label>
                                        {pdfInicialUrl ? (
                                            <a
                                                href={pdfInicialUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center px-4 py-2.5 bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-800 transition-colors"
                                                style={{ fontFamily: 'var(--font-poppins)' }}
                                            >
                                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                </svg>
                                                Ver PDF Inicial
                                            </a>
                                        ) : (
                                            <div className="px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-600 text-sm" style={{ fontFamily: 'var(--font-poppins)' }}>
                                                No hay PDF disponible
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                                        Adjuntar PDF de Incidencia:
                                    </label>
                                    <input
                                        type="file"
                                        accept="application/pdf"
                                        onChange={mostrarNombreArchivo}
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                                        style={{ fontFamily: 'var(--font-poppins)' }}
                                    />
                                    {nombreArchivo && (
                                        <p className="mt-2 text-sm text-green-600" style={{ fontFamily: 'var(--font-poppins)' }}>
                                            {nombreArchivo}
                                        </p>
                                    )}
                                </div>

                                {/* Sección de Productos */}
                                <div className="border-t border-gray-200 pt-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center" style={{ fontFamily: 'var(--font-poppins)' }}>
                                        <svg className="w-5 h-5 mr-2 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                        Agregar Producto con Incidencia
                                    </h3>

                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                                                    Item:
                                                </label>
                                                <input
                                                    type="number"
                                                    value={nuevoProducto.item}
                                                    onChange={(e) => setNuevoProducto({ ...nuevoProducto, item: e.target.value })}
                                                    placeholder="Número de item"
                                                    min="1"
                                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                                                    style={{ fontFamily: 'var(--font-poppins)' }}
                                                />
                                            </div>

                                            <div className="relative" ref={autocompleteRef}>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                                                    Producto:
                                                </label>
                                                <input
                                                    ref={productoInputRef}
                                                    type="text"
                                                    value={autocompleteQuery || nuevoProducto.producto}
                                                    onChange={handleProductoInputChange}
                                                    placeholder="Buscar producto..."
                                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                                                    style={{ fontFamily: 'var(--font-poppins)' }}
                                                />
                                                {autocompleteVisible && autocompleteResults.length > 0 && (
                                                    <div className="absolute z-50 w-full mt-1 bg-white border-2 border-red-500 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                                        {autocompleteResults.map((producto, index) => (
                                                            <div
                                                                key={index}
                                                                onClick={() => seleccionarProducto(producto)}
                                                                className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0 transition-colors"
                                                            >
                                                                <div className="font-semibold text-gray-900 text-sm" style={{ fontFamily: 'var(--font-poppins)' }}>
                                                                    {producto.NOMBRE || ''}
                                                                </div>
                                                                <div className="text-xs text-gray-600" style={{ fontFamily: 'var(--font-poppins)' }}>
                                                                    Código: {producto.CODIGO || ''}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                                                    Código:
                                                </label>
                                                <input
                                                    type="text"
                                                    value={nuevoProducto.codigo}
                                                    readOnly
                                                    placeholder="Código automático"
                                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed text-sm"
                                                    style={{ fontFamily: 'var(--font-poppins)' }}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                                                    Cantidad Inicial:
                                                </label>
                                                <input
                                                    type="number"
                                                    value={nuevoProducto.cantidadInicial}
                                                    onChange={(e) => setNuevoProducto({ ...nuevoProducto, cantidadInicial: e.target.value })}
                                                    placeholder="0"
                                                    min="0"
                                                    step="0.01"
                                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                                                    style={{ fontFamily: 'var(--font-poppins)' }}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                                                    Unidad de Medida:
                                                </label>
                                                <select
                                                    value={nuevoProducto.unidadMedida}
                                                    onChange={(e) => setNuevoProducto({ ...nuevoProducto, unidadMedida: e.target.value })}
                                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                                                    style={{ fontFamily: 'var(--font-poppins)' }}
                                                >
                                                    <option value="">Seleccione...</option>
                                                    <option value="unidades">Unidades</option>
                                                    <option value="docenas">Docenas</option>
                                                    <option value="paquetes">Paquetes</option>
                                                    <option value="cajas">Cajas</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                                                    Cantidad Recibida:
                                                </label>
                                                <input
                                                    type="number"
                                                    value={nuevoProducto.cantidadRecibida}
                                                    onChange={(e) => setNuevoProducto({ ...nuevoProducto, cantidadRecibida: e.target.value })}
                                                    placeholder="0"
                                                    min="0"
                                                    step="0.01"
                                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                                                    style={{ fontFamily: 'var(--font-poppins)' }}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                                                    Motivo:
                                                </label>
                                                <select
                                                    value={nuevoProducto.motivo}
                                                    onChange={(e) => {
                                                        setNuevoProducto({ ...nuevoProducto, motivo: e.target.value, otrosMotivo: '' });
                                                        if (e.target.value === 'otros') {
                                                            setTimeout(() => document.getElementById('nuevoOtrosMotivo')?.focus(), 100);
                                                        }
                                                    }}
                                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                                                    style={{ fontFamily: 'var(--font-poppins)' }}
                                                >
                                                    <option value="">Seleccione...</option>
                                                    <option value="falta">Falta</option>
                                                    <option value="sobrante">Sobrante</option>
                                                    <option value="dañado">Dañado</option>
                                                    <option value="otros">Otros</option>
                                                </select>
                                            </div>
                                        </div>

                                        {nuevoProducto.motivo === 'otros' && (
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                                                    Especificar motivo:
                                                </label>
                                                <input
                                                    id="nuevoOtrosMotivo"
                                                    type="text"
                                                    value={nuevoProducto.otrosMotivo}
                                                    onChange={(e) => setNuevoProducto({ ...nuevoProducto, otrosMotivo: e.target.value })}
                                                    placeholder="Escriba el motivo específico..."
                                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                                                    style={{ fontFamily: 'var(--font-poppins)' }}
                                                />
                                            </div>
                                        )}

                                        <button
                                            type="button"
                                            onClick={agregarProducto}
                                            className="w-full md:w-auto px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center"
                                            style={{ fontFamily: 'var(--font-poppins)' }}
                                        >
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                            </svg>
                                            Agregar a la Lista
                                        </button>
                                    </div>

                                    {/* Tabla de Productos Agregados */}
                                    {productosTable.length > 0 && (
                                        <div className="mt-6">
                                            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center" style={{ fontFamily: 'var(--font-poppins)' }}>
                                                <svg className="w-5 h-5 mr-2 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                </svg>
                                                Productos Agregados
                                            </h4>
                                            <div className="overflow-x-auto">
                                                <table className="w-full border-collapse bg-white rounded-lg overflow-hidden">
                                                    <thead>
                                                        <tr className="bg-gradient-to-r from-blue-700 to-blue-800">
                                                            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                                                                Item
                                                            </th>
                                                            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                                                                Producto
                                                            </th>
                                                            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                                                                Código
                                                            </th>
                                                            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                                                                Cantidad Inicial
                                                            </th>
                                                            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                                                                Unidad de Medida
                                                            </th>
                                                            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                                                                Cantidad Recibida
                                                            </th>
                                                            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                                                                Motivo
                                                            </th>
                                                            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                                                                Acciones
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-200">
                                                        {productosTable.map((producto) => (
                                                            <tr key={producto.id} className="hover:bg-gray-50 transition-colors">
                                                                <td className="px-4 py-3 text-sm text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                                                                    {producto.item}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                                                                    {producto.producto}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                                                                    {producto.codigo}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                                                                    {producto.cantidadInicial}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                                                                    {producto.unidadMedida}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                                                                    {producto.cantidadRecibida}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                                                                    {producto.motivo}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm">
                                                                    <div className="flex items-center space-x-2">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => editarFila(producto.id)}
                                                                            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                                                            title="Editar producto"
                                                                        >
                                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                            </svg>
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => eliminarFila(producto.id)}
                                                                            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                                                                            title="Eliminar producto"
                                                                        >
                                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                            </svg>
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Observaciones */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                                        Observaciones:
                                    </label>
                                    <textarea
                                        value={observaciones}
                                        onChange={(e) => setObservaciones(e.target.value)}
                                        rows={4}
                                        placeholder="Detalles adicionales de la incidencia..."
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white resize-none"
                                        style={{ fontFamily: 'var(--font-poppins)' }}
                                    />
                                </div>

                                {/* Botón Guardar */}
                                <div className="flex justify-end pt-4 border-t border-gray-200">
                                    <button
                                        type="submit"
                                        disabled={guardando}
                                        className="px-6 py-2.5 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                        style={{ fontFamily: 'var(--font-poppins)' }}
                                    >
                                        {guardando ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Guardando...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                                Guardar Incidencia
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </main>
            </div>
            

            {/* Modal de Edición */}
            <Modal
                isOpen={editModalOpen}
                onClose={() => {
                    setEditModalOpen(false);
                    setFilaEditando(null);
                    setEditForm({ cantidadRecibida: "", motivo: "", otrosMotivo: "" });
                }}
                title="Editar Producto"
                size="md"
                primaryButtonText="Guardar Cambios"
                secondaryButtonText="Cancelar"
                onPrimaryButtonClick={guardarEdicion}
                onSecondaryButtonClick={() => {
                    setEditModalOpen(false);
                    setFilaEditando(null);
                    setEditForm({ cantidadRecibida: "", motivo: "", otrosMotivo: "" });
                }}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                            Cantidad Recibida:
                        </label>
                        <input
                            type="number"
                            value={editForm.cantidadRecibida}
                            onChange={(e) => setEditForm({ ...editForm, cantidadRecibida: e.target.value })}
                            placeholder="0"
                            min="0"
                            step="0.01"
                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                            style={{ fontFamily: 'var(--font-poppins)' }}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                            Motivo:
                        </label>
                        <select
                            value={editForm.motivo}
                            onChange={(e) => {
                                setEditForm({ ...editForm, motivo: e.target.value, otrosMotivo: '' });
                                if (e.target.value === 'otros') {
                                    setTimeout(() => document.getElementById('editOtrosMotivo')?.focus(), 100);
                                }
                            }}
                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                            style={{ fontFamily: 'var(--font-poppins)' }}
                        >
                            <option value="">Seleccione...</option>
                            <option value="falta">Falta</option>
                            <option value="sobrante">Sobrante</option>
                            <option value="dañado">Dañado</option>
                            <option value="otros">Otros</option>
                        </select>

                    </div>

                    {editForm.motivo === 'otros' && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                                Especificar motivo:
                            </label>
                            <input
                                id="editOtrosMotivo"
                                type="text"
                                value={editForm.otrosMotivo}
                                onChange={(e) => setEditForm({ ...editForm, otrosMotivo: e.target.value })}
                                placeholder="Escriba el motivo específico..."
                                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                                style={{ fontFamily: 'var(--font-poppins)' }}
                            />
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}

