"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/context/AuthContext";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";
import Modal from "../../../components/ui/Modal";

export default function IncidenciasImportacionesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [incidencias, setIncidencias] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);
  
  // Filtros
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [buscarDespacho, setBuscarDespacho] = useState("");
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  
  // Modales
  const [isDetallesModalOpen, setIsDetallesModalOpen] = useState(false);
  const [isActualizarModalOpen, setIsActualizarModalOpen] = useState(false);
  const [isProcedimientosModalOpen, setIsProcedimientosModalOpen] = useState(false);
  const [isEditProductoModalOpen, setIsEditProductoModalOpen] = useState(false);
  
  // Datos de incidencia seleccionada
  const [selectedIncidencia, setSelectedIncidencia] = useState(null);
  const [productosDetalle, setProductosDetalle] = useState([]);
  const [observacionesDetalle, setObservacionesDetalle] = useState("");
  const [currentIncidenciaId, setCurrentIncidenciaId] = useState(null);
  
  // Formulario de actualización
  const [updateForm, setUpdateForm] = useState({
    idIncidencia: "",
    fechaCorreccion: "",
    estadoIncidencia: "",
    respondidoPor: "",
    estadoDespacho: "",
  });
  
  // Productos en el formulario de actualización
  const [productosForm, setProductosForm] = useState([]);
  const [nuevoProducto, setNuevoProducto] = useState({
    item: "",
    producto: "",
    codigo: "",
    unidadMedida: "",
    cantidadEnCaja: "",
    cantidad: "",
  });
  
  // Autocompletado
  const [autocompleteVisible, setAutocompleteVisible] = useState(false);
  const [autocompleteResults, setAutocompleteResults] = useState([]);
  const [autocompleteQuery, setAutocompleteQuery] = useState("");
  const autocompleteRef = useRef(null);
  const productoInputRef = useRef(null);
  
  // Edición de producto
  const [filaEditando, setFilaEditando] = useState(null);
  const [editProducto, setEditProducto] = useState({
    cantidadEnCaja: "",
    cantidad: "",
  });
  
  const [numeroDespachoActual, setNumeroDespachoActual] = useState(null);

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

  // Cargar incidencias
  useEffect(() => {
    if (user) {
      cargarIncencias();
      cargarProductos();
      
      // NO establecer fechas por defecto - dejar vacío para mostrar todos los registros
      // El usuario puede filtrar después si lo desea
    }
  }, [user]);

  // Cerrar autocompletado al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target)) {
        setAutocompleteVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Resetear página cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [fechaDesde, fechaHasta, buscarDespacho]);

  const cargarIncencias = async () => {
    try {
      setLoadingData(true);
      setError(null);
      
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      console.log('🔍 Cargando incidencias logísticas...');
      const response = await fetch("/api/incidencias-logisticas", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      let data;
      const contentType = response.headers.get("content-type");
      
      // Intentar obtener como texto primero para ver qué devuelve realmente
      const textResponse = await response.text();
      console.log('📄 Respuesta como texto (primeros 500 chars):', textResponse.substring(0, 500));
      
      try {
        data = JSON.parse(textResponse);
        console.log('✅ Parseado como JSON exitosamente');
      } catch (e) {
        console.error('❌ No se pudo parsear como JSON:', e);
        console.log('📄 Texto completo:', textResponse);
        // Si no es JSON, puede ser que la API devuelva texto plano con JSON dentro
        // Intentar extraer JSON del texto
        const jsonMatch = textResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          try {
            data = JSON.parse(jsonMatch[0]);
            console.log('✅ JSON extraído del texto');
          } catch (e2) {
            console.error('❌ Error al parsear JSON extraído:', e2);
            data = null;
          }
        } else {
          data = null;
        }
      }
      
      console.log('📦 Data después del parseo:', data);
      console.log('📦 Tipo de data:', typeof data);
      console.log('📦 Es array?', Array.isArray(data));
      
      let registros = [];
      
      if (data === null || data === undefined) {
        console.warn('⚠️ Data es null o undefined');
        registros = [];
      }
      // Si data es un string, intentar parsearlo de nuevo
      else if (typeof data === 'string') {
        try {
          const parsed = JSON.parse(data);
          registros = Array.isArray(parsed) ? parsed : (parsed.data || parsed.incidencias || []);
        } catch (e) {
          console.error('❌ Error parseando string:', e);
          registros = [];
        }
      } 
      // Si data es un array, usarlo directamente
      else if (Array.isArray(data)) {
        registros = data;
      }
      // Si data es un objeto, puede ser que tenga una propiedad con el array
      else if (typeof data === 'object' && data !== null) {
        // Buscar propiedades comunes que puedan contener el array
        registros = data.data || data.incidencias || data.registros || data.result || data.items || [];
        if (!Array.isArray(registros)) {
          // Si no es array, puede ser un solo objeto - convertirlo en array
          if (Object.keys(data).length > 0) {
            registros = [data];
          } else {
            registros = [];
          }
        }
      }

      console.log('✅ Registros procesados:', registros.length);
      if (registros.length > 0) {
        console.log('📋 Primer registro completo:', JSON.stringify(registros[0], null, 2));
        console.log('📋 Claves del primer registro:', Object.keys(registros[0]));
        
        // Mapear los datos al formato esperado por la tabla
        const registrosMapeados = registros.map((item, index) => {
          // Buscar campos en diferentes variaciones (mayúsculas, minúsculas, snake_case, camelCase)
          const id = item.ID_INCIDENCIA || item.id_incidencia || item.ID || item.id || item.Id || (index + 1);
          const fechaRegistro = item.FECHA_REGISTRO || item.fecha_registro || item.Fecha_Registro || item.fechaRegistro || '';
          const numeroDespacho = item.NUMERO_DESPACHO || item.numero_despacho || item.Numero_Despacho || item.numeroDespacho || '';
          
          // PDF Inicial
          let pdfInicial = item.ARCHIVO_PDF_URL || item.archivo_pdf_url || item.ARCHIVO_PDF || item.archivo_pdf || 
                          item.PDF_INICIAL || item.pdf_inicial || item.pdfInicial || '';
          
          // PDF Incidencia
          let pdfIncidencia = item.PDF_INCIDENCIA_URL || item.pdf_incidencia_url || item.PDF_INCIDENCIA || 
                             item.pdf_incidencia || item.pdfIncidencia || '';
          
          // Solución PDF
          let solucionPdf = item.SOLUCION_PDF || item.solucion_pdf || item.Solucion_Pdf || item.solucionPdf || '';
          
          const fechaRecepcion = item.FECHA_RECEPCION || item.fecha_recepcion || item.Fecha_Recepcion || item.fechaRecepcion || '';
          const fechaCorreccion = item.FECHA_CORRECCION || item.fecha_correccion || item.Fecha_Correccion || item.fechaCorreccion || '';
          const incidencias = item.INCIDENCIAS || item.incidencias || item.Incidencias || '';
          const estadoIncidencia = item.ESTADO_INCIDENCIA || item.estado_incidencia || item.Estado_Incidencia || item.estadoIncidencia || item.ESTADO || item.estado || '';
          const respondidoPor = item.RESPONDIDO_POR || item.respondido_por || item.Respondido_Por || item.respondidoPor || '';
          const estadoDespacho = item.ESTADO_DESPACHO || item.estado_despacho || item.Estado_Despacho || item.estadoDespacho || '';
          const observaciones = item.OBSERVACIONES || item.observaciones || item.Observaciones || item.observaciones || '';
          
          return {
            ID_INCIDENCIA: id,
            FECHA_REGISTRO: fechaRegistro,
            NUMERO_DESPACHO: numeroDespacho,
            ARCHIVO_PDF_URL: pdfInicial,
            PDF_INCIDENCIA_URL: pdfIncidencia,
            FECHA_RECEPCION: fechaRecepcion,
            FECHA_CORRECCION: fechaCorreccion,
            INCIDENCIAS: incidencias,
            ESTADO_INCIDENCIA: estadoIncidencia,
            SOLUCION_PDF: solucionPdf,
            RESPONDIDO_POR: respondidoPor,
            ESTADO_DESPACHO: estadoDespacho,
            OBSERVACIONES: observaciones,
            // Mantener el objeto original para referencia
            _original: item
          };
        });
        
        console.log('✅ Registros mapeados:', registrosMapeados.length);
        console.log('📋 Primer registro mapeado:', JSON.stringify(registrosMapeados[0], null, 2));
        
        setIncidencias(registrosMapeados);
      } else {
        console.warn('⚠️ No se encontraron registros después del procesamiento');
        console.log('📦 Data original completa:', JSON.stringify(data, null, 2));
        setIncidencias([]);
      }
    } catch (err) {
      console.error('❌ Error al cargar incidencias:', err);
      setError('Error al cargar las incidencias: ' + err.message);
      setIncidencias([]);
    } finally {
      setLoadingData(false);
    }
  };

  const cargarProductos = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch("/api/productos-crud", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProductos(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error al cargar productos:', error);
    }
  };

  const filtrarIncencias = () => {
    setCurrentPage(1);
  };

  const incidenciasFiltradas = useMemo(() => {
    console.log('🔍 Filtrando incidencias. Total sin filtrar:', incidencias.length);
    console.log('🔍 Filtros activos - Desde:', fechaDesde || 'NINGUNA', 'Hasta:', fechaHasta || 'NINGUNA', 'Despacho:', buscarDespacho || 'NINGUNO');
    
    // Si no hay filtros activos, devolver todas las incidencias
    if (!fechaDesde && !fechaHasta && !buscarDespacho) {
      console.log('✅ Sin filtros activos, mostrando todas las incidencias:', incidencias.length);
      return incidencias;
    }
    
    let filtradas = incidencias.filter(incidencia => {
      let cumple = true;
      
      // Filtrar por fecha desde
      if (fechaDesde) {
        const fechaRegistro = incidencia.FECHA_REGISTRO || '';
        if (fechaRegistro && fechaRegistro.length >= 10) {
          let fRow = fechaRegistro.split(' ')[0].trim();
          // Convertir formato DD/MM/YYYY a YYYY-MM-DD
          if (fRow.includes('/')) {
            const partes = fRow.split('/');
            if (partes.length === 3) {
              // Asumir formato DD/MM/YYYY
              const dia = partes[0].padStart(2, '0');
              const mes = partes[1].padStart(2, '0');
              const año = partes[2];
              fRow = `${año}-${mes}-${dia}`;
            }
          }
          // Comparar fechas
          if (fRow && fRow < fechaDesde) {
            cumple = false;
          }
        } else {
          // Si no hay fecha de registro, incluir el registro (no filtrar)
          // Esto permite que se muestren registros sin fecha
        }
      }
      
      // Filtrar por fecha hasta
      if (fechaHasta && cumple) {
        const fechaRegistro = incidencia.FECHA_REGISTRO || '';
        if (fechaRegistro && fechaRegistro.length >= 10) {
          let fRow = fechaRegistro.split(' ')[0].trim();
          // Convertir formato DD/MM/YYYY a YYYY-MM-DD
          if (fRow.includes('/')) {
            const partes = fRow.split('/');
            if (partes.length === 3) {
              const dia = partes[0].padStart(2, '0');
              const mes = partes[1].padStart(2, '0');
              const año = partes[2];
              fRow = `${año}-${mes}-${dia}`;
            }
          }
          if (fRow && fRow > fechaHasta) {
            cumple = false;
          }
        }
      }
      
      // Filtrar por número de despacho
      if (buscarDespacho && cumple) {
        const despacho = String(incidencia.NUMERO_DESPACHO || '').toLowerCase().trim();
        const busqueda = buscarDespacho.toLowerCase().trim();
        if (despacho && !despacho.includes(busqueda)) {
          cumple = false;
        } else if (!despacho && busqueda) {
          // Si no hay despacho y se está buscando, excluir
          cumple = false;
        }
      }
      
      return cumple;
    });
    
    console.log('✅ Incidencias después del filtro:', filtradas.length);
    if (filtradas.length === 0 && incidencias.length > 0) {
      console.warn('⚠️ Los filtros están ocultando todos los registros. Verificar fechas y despacho.');
      console.log('📋 Primer registro sin filtrar:', JSON.stringify(incidencias[0], null, 2));
    }
    return filtradas;
  }, [incidencias, fechaDesde, fechaHasta, buscarDespacho]);

  // Paginación
  const totalPages = Math.ceil(incidenciasFiltradas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const incidenciasPaginadas = incidenciasFiltradas.slice(startIndex, endIndex);

  const formatearFecha = (fechaString) => {
    if (!fechaString || fechaString === 'null' || fechaString === 'undefined' || fechaString === '') {
      return 'N/A';
    }
    try {
      const fecha = new Date(fechaString);
      if (isNaN(fecha.getTime())) {
        return fechaString;
      }
      return fecha.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return fechaString;
    }
  };

  const getEstadoClass = (estado) => {
    const estadoUpper = String(estado || '').toUpperCase();
    if (estadoUpper === 'PENDIENTE') return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (estadoUpper === 'REVISADO') return 'bg-orange-100 text-orange-800 border-orange-300';
    if (estadoUpper === 'COMPLETADO') return 'bg-green-100 text-green-800 border-green-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getEstadoDespachoClass = (estado) => {
    const estadoUpper = String(estado || '').toUpperCase();
    if (estadoUpper === 'CONCLUIDO') return 'bg-green-100 text-green-800 border-green-300';
    if (estadoUpper === 'NO CONCLUIDO') return 'bg-red-100 text-red-800 border-red-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getIncidenciasClass = (incidencias) => {
    if (incidencias === true || incidencias === "SI" || incidencias === "si" || incidencias === "SI") {
      return 'bg-green-100 text-green-800 border-green-300';
    }
    return 'bg-red-100 text-red-800 border-red-300';
  };

  const verDetalles = async (id) => {
    const incidencia = incidencias.find(inc => String(inc.ID_INCIDENCIA) === String(id));
    if (!incidencia) {
      setError('No se encontró la incidencia');
      return;
    }

    setCurrentIncidenciaId(id);
    setSelectedIncidencia(incidencia);
    setObservacionesDetalle(incidencia.OBSERVACIONES || 'Sin observaciones registradas');
    setIsDetallesModalOpen(true);

    // Cargar productos de la incidencia
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/incidencias-logisticas?id=${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        let productosData = [];
        try {
          productosData = typeof data === 'string' ? JSON.parse(data) : data;
        } catch (e) {
          productosData = Array.isArray(data) ? data : [];
        }
        
        if (productosData && typeof productosData === 'object' && !Array.isArray(productosData)) {
          productosData = [productosData];
        }
        
        setProductosDetalle(Array.isArray(productosData) ? productosData : []);
      }
    } catch (error) {
      console.error('Error al cargar productos:', error);
      setProductosDetalle([]);
    }
  };

  const abrirModalActualizar = (id) => {
    const incidencia = incidencias.find(inc => String(inc.ID_INCIDENCIA) === String(id));
    if (!incidencia) {
      setError('No se encontró la incidencia');
      return;
    }

    setNumeroDespachoActual(incidencia.NUMERO_DESPACHO);
    setUpdateForm({
      idIncidencia: id,
      fechaCorreccion: incidencia.FECHA_CORRECCION ? incidencia.FECHA_CORRECCION.split(' ')[0] : '',
      estadoIncidencia: incidencia.ESTADO_INCIDENCIA || '',
      respondidoPor: incidencia.RESPONDIDO_POR || '',
      estadoDespacho: incidencia.ESTADO_DESPACHO || '',
    });
    setProductosForm([]);
    setIsActualizarModalOpen(true);
  };

  // Autocompletado de productos
  const buscarProductos = (query) => {
    if (!query || query.trim() === '') {
      setAutocompleteVisible(false);
      return;
    }

    const resultados = productos.filter(producto =>
      (producto.NOMBRE && producto.NOMBRE.toLowerCase().includes(query.toLowerCase())) ||
      (producto.CODIGO && producto.CODIGO.toLowerCase().includes(query.toLowerCase()))
    ).slice(0, 10);

    setAutocompleteResults(resultados);
    setAutocompleteVisible(resultados.length > 0);
  };

  const seleccionarProducto = (producto) => {
    setNuevoProducto(prev => ({
      ...prev,
      producto: producto.NOMBRE || '',
      codigo: producto.CODIGO || '',
    }));
    setAutocompleteVisible(false);
    setAutocompleteQuery("");
  };

  const agregarProducto = () => {
    if (!nuevoProducto.producto || !nuevoProducto.codigo) {
      setError('Debe seleccionar un producto');
      return;
    }

    if (!nuevoProducto.item || !nuevoProducto.unidadMedida || !nuevoProducto.cantidadEnCaja || !nuevoProducto.cantidad) {
      setError('Debe completar todos los campos');
      return;
    }

    setProductosForm([...productosForm, { ...nuevoProducto }]);
    setNuevoProducto({
      item: "",
      producto: "",
      codigo: "",
      unidadMedida: "",
      cantidadEnCaja: "",
      cantidad: "",
    });
    setAutocompleteQuery("");
  };

  const eliminarProducto = (index) => {
    setProductosForm(productosForm.filter((_, i) => i !== index));
  };

  const editarFila = (index) => {
    const producto = productosForm[index];
    setFilaEditando(index);
    setEditProducto({
      cantidadEnCaja: producto.cantidadEnCaja,
      cantidad: producto.cantidad,
    });
    setIsEditProductoModalOpen(true);
  };

  const guardarEdicion = () => {
    if (filaEditando !== null && filaEditando !== undefined) {
      const nuevosProductos = [...productosForm];
      nuevosProductos[filaEditando] = {
        ...nuevosProductos[filaEditando],
        cantidadEnCaja: editProducto.cantidadEnCaja,
        cantidad: editProducto.cantidad,
      };
      setProductosForm(nuevosProductos);
      setIsEditProductoModalOpen(false);
      setFilaEditando(null);
    }
  };

  const extraerImportacionInicial = async () => {
    if (!numeroDespachoActual) {
      setError('No hay un número de despacho disponible para extraer');
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/importaciones-vr01?despacho=${encodeURIComponent(numeroDespachoActual)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.detalles && Array.isArray(data.detalles) && data.detalles.length > 0) {
          const productosExtraidos = data.detalles.map((detalle, index) => ({
            item: detalle.ITEM || String(index + 1),
            producto: detalle.PRODUCTO || 'N/A',
            codigo: detalle.CODIGO || 'N/A',
            unidadMedida: detalle.UNIDAD_MEDIDA || 'N/A',
            cantidadEnCaja: "0",
            cantidad: detalle.CANTIDAD || '0',
          }));
          setProductosForm(productosExtraidos);
        } else {
          setError('No se encontraron productos en la importación inicial');
        }
      } else {
        setError('Error al extraer la importación inicial');
      }
    } catch (error) {
      console.error('Error al extraer importación:', error);
      setError('Error al conectar con el servidor para extraer la importación');
    }
  };

  const guardarSoloCampos = async () => {
    try {
      if (!updateForm.fechaCorreccion || !updateForm.estadoIncidencia || !updateForm.respondidoPor || !updateForm.estadoDespacho) {
        setError('Por favor complete todos los campos requeridos');
        return;
      }

      const token = localStorage.getItem("token");
      const data = {
        fecha_correcion: updateForm.fechaCorreccion,
        estado_incidencia: updateForm.estadoIncidencia,
        respondido_por: updateForm.respondidoPor,
        estado_despacho: updateForm.estadoDespacho,
        id: parseInt(updateForm.idIncidencia),
      };

      const response = await fetch("/api/incidencias-logisticas", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setError(null);
        setIsActualizarModalOpen(false);
        cargarIncencias();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al actualizar la incidencia');
      }
    } catch (error) {
      console.error('Error al guardar campos:', error);
      setError('Error al guardar los campos: ' + error.message);
    }
  };

  const guardarSoloProductos = async () => {
    try {
      if (productosForm.length === 0) {
        setError('No hay productos para guardar');
        return;
      }

      if (!updateForm.fechaCorreccion || !updateForm.respondidoPor) {
        setError('Debe completar al menos: Fecha de Corrección y Respondido Por');
        return;
      }

      const token = localStorage.getItem("token");
      const totalCantidad = productosForm.reduce((sum, p) => sum + (parseFloat(p.cantidad) || 0), 0);
      const totalCantidadEnCaja = productosForm.reduce((sum, p) => sum + (parseFloat(p.cantidadEnCaja) || 0), 0);

      const payload = {
        numeroDespacho: numeroDespachoActual || "N/A",
        redactadoPor: updateForm.respondidoPor,
        fecha: updateForm.fechaCorreccion,
        tipoCarga: "Contenedor 40 pies",
        productos: productosForm.map((producto, index) => ({
          numero: parseInt(producto.item) || (index + 1),
          producto: producto.producto || "N/A",
          codigo: producto.codigo || "N/A",
          unidad: producto.unidadMedida || "UND",
          cantidad: parseFloat(producto.cantidad) || 0,
          cantidadEnCaja: parseFloat(producto.cantidadEnCaja) || 0,
        })),
        totalCantidad: totalCantidad,
        totalCantidadEnCaja: totalCantidadEnCaja,
      };

      const response = await fetch("/api/generar-pdf-incidencias?metodo=ficha_importacion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        setError(null);
        setIsActualizarModalOpen(false);
        cargarIncencias();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al guardar los productos');
      }
    } catch (error) {
      console.error('Error al guardar productos:', error);
      setError('Error al guardar los productos: ' + error.message);
    }
  };

  const generarPDF = async () => {
    if (!currentIncidenciaId) {
      setError('No se ha seleccionado una incidencia');
      return;
    }

    try {
      const incidencia = incidencias.find(inc => String(inc.ID_INCIDENCIA) === String(currentIncidenciaId));
      if (!incidencia) {
        setError('No se encontró la incidencia');
        return;
      }

      // Cargar productos para el PDF
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/incidencias-logisticas?id=${currentIncidenciaId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      let productosPDF = [];
      if (response.ok) {
        const data = await response.json();
        try {
          productosPDF = typeof data === 'string' ? JSON.parse(data) : data;
        } catch (e) {
          productosPDF = Array.isArray(data) ? data : [];
        }
        
        if (productosPDF && typeof productosPDF === 'object' && !Array.isArray(productosPDF)) {
          productosPDF = [productosPDF];
        }
        productosPDF = Array.isArray(productosPDF) ? productosPDF : [];
      }

      // Preparar datos para el PDF según el formato del sistema antiguo (FICHA DE INCIDENCIA)
      const payload = {
        numero_despacho: incidencia.NUMERO_DESPACHO || "N/A",
        generado_por: incidencia.RESPONDIDO_POR || "SISTEMA",
        fecha: incidencia.FECHA_CORRECCION ? incidencia.FECHA_CORRECCION.split(' ')[0] : new Date().toISOString().split('T')[0],
        tipo_carga: incidencia.TIPO_CARGA || "",
        detalle: productosPDF.map((producto, index) => {
          const cantidadInicial = parseFloat(producto.CANTIDAD_INICIAL || 0);
          const cantidadRecibida = parseFloat(producto.CANTIDAD_RECIBIDA || 0);
          const diferencia = cantidadInicial - cantidadRecibida;
          
          return {
            numero: producto.ITEM || String(index + 1),
            producto: producto.PRODUCTO || "N/A",
            codigo: producto.CODIGO || "N/A",
            unidad_medida: producto.UNIDAD_MEDIDA || "N/A",
            cantidad_inicial: cantidadInicial,
            cantidad_recibida: cantidadRecibida,
            motivo: producto.MOTIVO || "Sin motivo especificado",
            diferencia: diferencia,
          };
        }),
      };

      const pdfResponse = await fetch("/api/generar-pdf-incidencias", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (pdfResponse.ok) {
        const result = await pdfResponse.json();
        const pdfUrl = result.result;
        
        if (pdfUrl && pdfUrl.startsWith('http')) {
          window.open(pdfUrl, '_blank');
        } else if (pdfUrl && typeof pdfUrl === 'string') {
          // Intentar extraer URL del texto
          const urlMatch = pdfUrl.match(/(https?:\/\/[^\s]+)/);
          if (urlMatch) {
            window.open(urlMatch[1], '_blank');
          } else {
            setError('PDF generado exitosamente. Respuesta: ' + pdfUrl);
          }
        } else {
          setError('PDF generado exitosamente.');
        }
      } else {
        const errorData = await pdfResponse.json();
        setError(errorData.error || 'Error al generar el PDF');
      }
    } catch (error) {
      console.error('Error al generar PDF:', error);
      setError('Error al generar el PDF: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
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

            {/* Contenedor principal */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] rounded-xl flex items-center justify-center text-white shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>Gestionar y revisar incidencias registradas</h2>
                    <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: 'var(--font-poppins)' }}>Revisa y gestiona todas las incidencias registradas en el sistema</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 rounded-lg px-3 py-1.5 bg-green-50 border border-green-200">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span className="text-sm font-semibold text-green-700" style={{ fontFamily: 'var(--font-poppins)' }}>API Conectada</span>
                </div>
              </div>

              {/* Mensaje de error/success */}
              {error && (
                <div className={`mb-4 p-4 rounded-lg border ${error.includes('Error') ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                  <p className="text-sm" style={{ fontFamily: 'var(--font-poppins)' }}>{error}</p>
                </div>
              )}

              {/* Filtros */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                      Fecha Desde:
                    </label>
                    <input
                      type="date"
                      value={fechaDesde}
                      onChange={(e) => setFechaDesde(e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                      Fecha Hasta:
                    </label>
                    <input
                      type="date"
                      value={fechaHasta}
                      onChange={(e) => setFechaHasta(e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                      Número de Despacho:
                    </label>
                    <input
                      type="text"
                      value={buscarDespacho}
                      onChange={(e) => setBuscarDespacho(e.target.value)}
                      placeholder="Buscar por número de despacho"
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <button
                      onClick={filtrarIncencias}
                      className="px-4 py-2.5 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-1.5"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Buscar
                    </button>
                    <button
                      onClick={() => setIsProcedimientosModalOpen(true)}
                      className="px-4 py-2.5 bg-gradient-to-br from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-1.5"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      Procedimientos
                    </button>
                  </div>
                </div>
              </div>

              {/* Tabla de Incidencias */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                <div className="overflow-x-auto">
                  {loadingData ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
                    </div>
                  ) : incidenciasFiltradas.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500" style={{ fontFamily: 'var(--font-poppins)' }}>Sin registros</p>
                    </div>
                  ) : (
                    <>
                      <table className="w-full">
                        <thead>
                          <tr className="bg-blue-700 border-b-2 border-blue-800">
                            <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>ID Incidencia</th>
                            <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Fecha de Registro</th>
                            <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Número de Despacho</th>
                            <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>PDF Inicial</th>
                            <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>PDF Incidencia</th>
                            <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Ver Detalles</th>
                            <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Fecha de Recepción</th>
                            <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Fecha de Corrección</th>
                            <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Incidencias?</th>
                            <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>ESTADO</th>
                            <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Solución PDF</th>
                            <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>RESPONDIDO POR</th>
                            <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>ESTADO DESPACHO</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {incidenciasPaginadas.map((incidencia) => (
                            <tr key={incidencia.ID_INCIDENCIA} className="hover:bg-slate-200 transition-colors">
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{incidencia.ID_INCIDENCIA || 'N/A'}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{formatearFecha(incidencia.FECHA_REGISTRO)}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] font-bold text-gray-700">{incidencia.NUMERO_DESPACHO || 'N/A'}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px]">
                                {incidencia.ARCHIVO_PDF_URL ? (
                                  <div className="flex items-center justify-center">
                                    <a 
                                      href={incidencia.ARCHIVO_PDF_URL} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="inline-flex items-center space-x-1 px-2.5 py-1 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                                      title="Abrir PDF en nueva pestaña"
                                      style={{ fontFamily: 'var(--font-poppins)' }}
                                    >
                                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ pointerEvents: 'none' }}>
                                        <path d="M6 2C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V7.41421C19 7.149 18.8946 6.89464 18.7071 6.70711L13.2929 1.29289C13.1054 1.10536 12.851 1 12.5858 1H6Z" stroke="currentColor" strokeWidth="1.5" fill="none"></path>
                                        <path d="M13 1V6H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                                        <text x="12" y="15" fontSize="6" fill="currentColor" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="0.3">PDF</text>
                                      </svg>
                                      <span style={{ pointerEvents: 'none' }}>PDF</span>
                                    </a>
                                  </div>
                                ) : (
                                  <span className="text-gray-400 italic">No disponible</span>
                                )}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px]">
                                {incidencia.PDF_INCIDENCIA_URL ? (
                                  <a 
                                    href={incidencia.PDF_INCIDENCIA_URL} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    Ver PDF
                                  </a>
                                ) : (
                                  <span className="text-gray-400 italic">No disponible</span>
                                )}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px]">
                                <button
                                  onClick={() => verDetalles(incidencia.ID_INCIDENCIA)}
                                  className="px-2.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] flex items-center justify-center"
                                  style={{ fontFamily: 'var(--font-poppins)' }}
                                  title="Ver Detalles"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </button>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{formatearFecha(incidencia.FECHA_RECEPCION)}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{formatearFecha(incidencia.FECHA_CORRECCION)}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px]">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold border ${getIncidenciasClass(incidencia.INCIDENCIAS)}`}>
                                  {incidencia.INCIDENCIAS || 'N/A'}
                                </span>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px]">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold border ${getEstadoClass(incidencia.ESTADO_INCIDENCIA)}`}>
                                  {incidencia.ESTADO_INCIDENCIA || 'N/A'}
                                </span>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px]">
                                {incidencia.SOLUCION_PDF ? (
                                  <div className="flex items-center justify-center">
                                    <a 
                                      href={incidencia.SOLUCION_PDF} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="inline-flex items-center space-x-1 px-2.5 py-1 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                                      title="Abrir PDF en nueva pestaña"
                                      style={{ fontFamily: 'var(--font-poppins)' }}
                                    >
                                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ pointerEvents: 'none' }}>
                                        <path d="M6 2C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V7.41421C19 7.149 18.8946 6.89464 18.7071 6.70711L13.2929 1.29289C13.1054 1.10536 12.851 1 12.5858 1H6Z" stroke="currentColor" strokeWidth="1.5" fill="none"></path>
                                        <path d="M13 1V6H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                                        <text x="12" y="15" fontSize="6" fill="currentColor" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="0.3">PDF</text>
                                      </svg>
                                      <span style={{ pointerEvents: 'none' }}>PDF</span>
                                    </a>
                                  </div>
                                ) : (
                                  <span className="text-gray-400 italic">No disponible</span>
                                )}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{incidencia.RESPONDIDO_POR || 'N/A'}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px]">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold border ${getEstadoDespachoClass(incidencia.ESTADO_DESPACHO)}`}>
                                  {incidencia.ESTADO_DESPACHO || 'N/A'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {/* Paginación */}
                      {totalPages > 1 && (
                        <div className="bg-slate-200 px-3 py-2 flex items-center justify-between border-t-2 border-slate-300">
                          <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(1)}
                            className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            «
                          </button>
                          <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            &lt;
                          </button>
                          <span className="text-[10px] text-gray-700 font-medium">Página {currentPage} de {totalPages}</span>
                          <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            &gt;
                          </button>
                          <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(totalPages)}
                            className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            »
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal de Detalles */}
      <Modal
        isOpen={isDetallesModalOpen}
        onClose={() => setIsDetallesModalOpen(false)}
        title="Detalles de la Incidencia"
        size="full"
        hideFooter
      >
        <div className="space-y-4 py-2">
          <div className="flex justify-end mb-2">
            <button
              onClick={generarPDF}
              className="px-3 py-1.5 bg-gradient-to-br from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-1.5"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Generar PDF
            </button>
          </div>
          <div className="bg-white rounded-xl shadow-lg border border-gray-200/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-blue-700 border-b-2 border-blue-800">
                    <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>ITEM</th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Unidad de Medida</th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Producto</th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Cantidad Inicial</th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Cantidad Recibida</th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Motivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {productosDetalle.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-4 text-center text-gray-500">
                        No hay productos registrados para esta incidencia
                      </td>
                    </tr>
                  ) : (
                    productosDetalle.map((producto, index) => (
                      <tr key={index} className="hover:bg-slate-200 transition-colors">
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{producto.ITEM || 'N/A'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{producto.UNIDAD_MEDIDA || 'N/A'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{producto.PRODUCTO || 'N/A'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{producto.CANTIDAD_INICIAL || 'N/A'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{producto.CANTIDAD_RECIBIDA || 'N/A'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{producto.MOTIVO || 'N/A'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2" style={{ fontFamily: 'var(--font-poppins)' }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Observaciones
            </h4>
            <textarea
              value={observacionesDetalle}
              readOnly
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-gray-50 min-h-[120px]"
              style={{ fontFamily: 'var(--font-poppins)' }}
            />
          </div>
        </div>
      </Modal>

      {/* Modal de Actualización */}
      <Modal
        isOpen={isActualizarModalOpen}
        onClose={() => {
          setIsActualizarModalOpen(false);
          setProductosForm([]);
          setUpdateForm({
            idIncidencia: "",
            fechaCorreccion: "",
            estadoIncidencia: "",
            respondidoPor: "",
            estadoDespacho: "",
          });
        }}
        title="Actualizar Incidencia"
        size="full"
        hideFooter
      >
        <div className="space-y-6">
          {/* Formulario de campos principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                Fecha de Corrección:
              </label>
              <input
                type="date"
                value={updateForm.fechaCorreccion}
                onChange={(e) => setUpdateForm({ ...updateForm, fechaCorreccion: e.target.value })}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                style={{ fontFamily: 'var(--font-poppins)' }}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                Estado:
              </label>
              <select
                value={updateForm.estadoIncidencia}
                onChange={(e) => setUpdateForm({ ...updateForm, estadoIncidencia: e.target.value })}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                style={{ fontFamily: 'var(--font-poppins)' }}
                required
              >
                <option value="">Seleccionar...</option>
                <option value="PENDIENTE">PENDIENTE</option>
                <option value="REVISADO">REVISADO</option>
                <option value="COMPLETADO">COMPLETADO</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                Respondido Por:
              </label>
              <select
                value={updateForm.respondidoPor}
                onChange={(e) => setUpdateForm({ ...updateForm, respondidoPor: e.target.value })}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                style={{ fontFamily: 'var(--font-poppins)' }}
                required
              >
                <option value="">Seleccionar...</option>
                <option value="KIMBERLY">KIMBERLY</option>
                <option value="HERVIN">HERVIN</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                Estado Despacho:
              </label>
              <select
                value={updateForm.estadoDespacho}
                onChange={(e) => setUpdateForm({ ...updateForm, estadoDespacho: e.target.value })}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                style={{ fontFamily: 'var(--font-poppins)' }}
                required
              >
                <option value="">Seleccionar...</option>
                <option value="CONCLUIDO">CONCLUIDO</option>
                <option value="NO CONCLUIDO">NO CONCLUIDO</option>
              </select>
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
            <button
              onClick={guardarSoloCampos}
              className="w-full px-4 py-3 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Actualizar Incidencia
            </button>
          </div>

          {/* Formulario para agregar productos */}
          <div className="border-t pt-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-poppins)' }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              Agregar Producto con Incidencia
            </h4>
            
            <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                    onChange={(e) => {
                      setAutocompleteQuery(e.target.value);
                      setNuevoProducto({ ...nuevoProducto, producto: e.target.value });
                      buscarProductos(e.target.value);
                    }}
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
                          className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0"
                        >
                          <div className="font-semibold text-gray-900 text-sm">{producto.NOMBRE || ''}</div>
                          <div className="text-xs text-gray-600">Código: {producto.CODIGO || ''}</div>
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
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-gray-100"
                    style={{ fontFamily: 'var(--font-poppins)' }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                    Cantidad en Caja:
                  </label>
                  <input
                    type="number"
                    value={nuevoProducto.cantidadEnCaja}
                    onChange={(e) => setNuevoProducto({ ...nuevoProducto, cantidadEnCaja: e.target.value })}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                    style={{ fontFamily: 'var(--font-poppins)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                    Cantidad:
                  </label>
                  <input
                    type="number"
                    value={nuevoProducto.cantidad}
                    onChange={(e) => setNuevoProducto({ ...nuevoProducto, cantidad: e.target.value })}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                    style={{ fontFamily: 'var(--font-poppins)' }}
                  />
                </div>
              </div>
              <button
                onClick={agregarProducto}
                className="w-full px-4 py-3 bg-gradient-to-br from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                style={{ fontFamily: 'var(--font-poppins)' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Agregar a la Lista
              </button>
            </div>

            {/* Lista de productos agregados */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Productos Agregados
                </h4>
                <button
                  onClick={extraerImportacionInicial}
                  className="px-4 py-2 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
                  style={{ fontFamily: 'var(--font-poppins)' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Extraer Importación Inicial
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-blue-700 text-white">
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase">Item</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase">Producto</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase">Código</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase">Unidad de Medida</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase">Cantidad en Caja</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase">Cantidad</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {productosForm.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-4 text-center text-gray-500">
                          No hay productos agregados
                        </td>
                      </tr>
                    ) : (
                      productosForm.map((producto, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{producto.item}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{producto.producto}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{producto.codigo}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{producto.unidadMedida}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{producto.cantidadEnCaja}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{producto.cantidad}</td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => editarFila(index)}
                                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-all duration-200"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => eliminarProducto(index)}
                                className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-all duration-200"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <button
                onClick={guardarSoloProductos}
                className="px-4 py-2 bg-gradient-to-br from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
                style={{ fontFamily: 'var(--font-poppins)' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Guardar Solo Productos
              </button>
              <button
                onClick={() => setIsActualizarModalOpen(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                style={{ fontFamily: 'var(--font-poppins)' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal de Edición de Producto */}
      <Modal
        isOpen={isEditProductoModalOpen}
        onClose={() => {
          setIsEditProductoModalOpen(false);
          setFilaEditando(null);
        }}
        title="Editar Producto"
        size="md"
        primaryButtonText="Guardar Cambios"
        secondaryButtonText="Cancelar"
        onPrimaryButtonClick={guardarEdicion}
        onSecondaryButtonClick={() => {
          setIsEditProductoModalOpen(false);
          setFilaEditando(null);
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
              Cantidad en Caja:
            </label>
            <input
              type="number"
              value={editProducto.cantidadEnCaja}
              onChange={(e) => setEditProducto({ ...editProducto, cantidadEnCaja: e.target.value })}
              placeholder="0"
              min="0"
              step="0.01"
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
              style={{ fontFamily: 'var(--font-poppins)' }}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
              Cantidad:
            </label>
            <input
              type="number"
              value={editProducto.cantidad}
              onChange={(e) => setEditProducto({ ...editProducto, cantidad: e.target.value })}
              placeholder="0"
              min="0"
              step="0.01"
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
              style={{ fontFamily: 'var(--font-poppins)' }}
            />
          </div>
        </div>
      </Modal>

      {/* Modal de Procedimientos */}
      <Modal
        isOpen={isProcedimientosModalOpen}
        onClose={() => setIsProcedimientosModalOpen(false)}
        title="Procedimientos - Listado de Incidencias Logísticas"
        size="full"
        hideFooter
      >
        <div className="space-y-6">
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2" style={{ fontFamily: 'var(--font-poppins)' }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Instrucciones Generales
            </h4>
            <div className="prose max-w-none">
              <p className="text-gray-700 mb-4" style={{ fontFamily: 'var(--font-poppins)' }}>
                <strong>Bienvenido al sistema de gestión de incidencias logísticas.</strong> Esta página le permite revisar y gestionar todas las incidencias registradas en el sistema.
              </p>
              <h5 className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Funcionalidades Principales:
              </h5>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4" style={{ fontFamily: 'var(--font-poppins)' }}>
                <li><strong>Filtros de Búsqueda:</strong> Permite filtrar incidencias por fecha y número de despacho</li>
                <li><strong>Vista de Detalles:</strong> Acceso completo a la información de cada incidencia</li>
                <li><strong>Actualización de Datos:</strong> Posibilidad de actualizar información de incidencias</li>
                <li><strong>Visualización de PDFs:</strong> Acceso directo a documentos relacionados</li>
              </ul>
            </div>
          </div>
          {/* Más contenido de procedimientos puede agregarse aquí */}
        </div>
      </Modal>
    </div>
  );
}

