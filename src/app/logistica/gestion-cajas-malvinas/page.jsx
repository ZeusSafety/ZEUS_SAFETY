"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/context/AuthContext";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";
import Modal from "../../../components/ui/Modal";

export default function GestionCajasMalvinasPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Estados principales
  const [productos, setProductos] = useState([]);
  const [productosReservados, setProductosReservados] = useState([]);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [productosReservadosFiltrados, setProductosReservadosFiltrados] = useState([]);
  const [productosEditados, setProductosEditados] = useState([]);
  const [reservaSeleccionada, setReservaSeleccionada] = useState(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const productosPorPagina = 15;

  // Estados de filtros
  const [buscadorProductos, setBuscadorProductos] = useState("");
  const [sugerenciasProductos, setSugerenciasProductos] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [conStock, setConStock] = useState(false);
  const [sinStock, setSinStock] = useState(false);
  const [categoria, setCategoria] = useState("");

  // Estados de productos reservados
  const [buscadorReservados, setBuscadorReservados] = useState("");
  const [categoriaReserva, setCategoriaReserva] = useState("");
  const [responsableReserva, setResponsableReserva] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  // Estados de edición
  const [estadoFilas, setEstadoFilas] = useState({});
  const [editandoId, setEditandoId] = useState(null);

  // Estados de modales
  const [mostrarModalGestionarReserva, setMostrarModalGestionarReserva] = useState(false);
  const [mostrarModalActualizacion, setMostrarModalActualizacion] = useState(false);
  const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState(false);
  const [mensajeConfirmacion, setMensajeConfirmacion] = useState("");

  // Estados de carga
  const [cargandoStock, setCargandoStock] = useState(false);
  const [cargandoReservados, setCargandoReservados] = useState(false);
  const [exportandoExcel, setExportandoExcel] = useState(false);

  // Estados de error
  const [errorProductos, setErrorProductos] = useState(null);
  const [errorReservados, setErrorReservados] = useState(null);

  // Referencias
  const buscadorRef = useRef(null);
  const sugerenciasRef = useRef(null);

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

  // Cargar datos al montar
  useEffect(() => {
    if (user) {
      cargarDatos();
    }
  }, [user]);

  // Función para obtener token
  const getAuthToken = () => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      // Validar que el token no esté vacío
      return token && token.trim() !== "" ? token : null;
    }
    return null;
  };

  // Cargar datos desde la API
  const cargarDatos = async () => {
    setCargandoStock(true);
    setCargandoReservados(true);
    setErrorProductos(null);
    setErrorReservados(null);

    try {
      // Cargar productos
      const token = getAuthToken();
      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const responseProductos = await fetch('/api/descuento-cajas/productos', {
        method: 'GET',
        headers: headers
      });

      if (!responseProductos.ok) {
        const errorData = await responseProductos.json().catch(() => ({}));
        throw new Error(errorData.message || `Error al cargar productos: ${responseProductos.status} ${responseProductos.statusText}`);
      }

      const dataProductos = await responseProductos.json();
      const productosArray = Array.isArray(dataProductos) ? dataProductos : (dataProductos.data || []);

      const productosNormalizados = productosArray.map(p => {
        const idCrudo = p.ID || p.id || p.ID_PRODUCTO || p.id_producto || '';
        const id = idCrudo !== null && idCrudo !== undefined ? String(idCrudo) : '';
        return {
          id: id,
          codigo: p['Código de Producto'] || p.codigo || p.CODIGO || '',
          producto: p.Producto || p.producto || p.NOMBRE || '',
          limite: p.Limite || p.limite || p.LIMITE || 0,
          categoria: p.CATEGORIA || p.categoria || '',
          cantidadCajas: p.Cantidad || p.cantidadCajas || p.CANTIDAD || 0,
          unidadMedida: p.Unidad_Medida || p.unidadMedida || p.UNIDAD_MEDIDA || 'CAJAS'
        };
      });

      setProductos(productosNormalizados);
      aplicarFiltros(productosNormalizados);
      setCargandoStock(false);
    } catch (error) {
      console.error('Error cargando productos:', error);
      setErrorProductos(error.message);
      setCargandoStock(false);
    }

    try {
      // Cargar productos reservados
      const token = getAuthToken();
      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const responseReservados = await fetch('/api/descuento-cajas/reservadas', {
        method: 'GET',
        headers: headers
      });

      if (!responseReservados.ok) {
        const errorData = await responseReservados.json().catch(() => ({}));
        throw new Error(errorData.message || `Error al cargar productos reservados: ${responseReservados.status} ${responseReservados.statusText}`);
      }

      const dataReservados = await responseReservados.json();
      const reservadosArray = Array.isArray(dataReservados) ? dataReservados : (dataReservados.data || []);

      const reservadosNormalizados = reservadosArray.map(r => ({
        id: r.ID || r.id || r.ID_RESERVADOS || '',
        producto: r.PRODUCTO || r.producto || '',
        categoria: r.CATEGORIA || r.categoria || '',
        fechaHora: r['Fecha y hora de reserva'] || r.FECHA_HORA || r.fechaHora || '',
        responsable: r.RESPONSABLE || r.responsable || '',
        area: r.AREA || r.area || '',
        cantidadReservada: r.CANTIDAD_RESERVADA || r.cantidadReservada || 0,
        unidadMedida: r.UNIDAD_MEDIDA || r.unidadMedida || 'CAJAS'
      }));

      setProductosReservados(reservadosNormalizados);
      setProductosReservadosFiltrados(reservadosNormalizados);
      popularFiltrosReservados(reservadosNormalizados);
      setCargandoReservados(false);
    } catch (error) {
      console.error('Error cargando productos reservados:', error);
      setErrorReservados(error.message);
      setCargandoReservados(false);
    }
  };

  // Aplicar filtros
  const aplicarFiltros = (productosArray = productos) => {
    const filtrados = productosArray.filter(p => {
      const matchBuscador = !buscadorProductos ||
        (p.producto && p.producto.toLowerCase().includes(buscadorProductos.toLowerCase())) ||
        (p.codigo && p.codigo.toString().toLowerCase().includes(buscadorProductos.toLowerCase()));
      
      const matchStock = !conStock || (p.cantidadCajas && p.cantidadCajas > 0);
      const matchSinStock = !sinStock || !p.cantidadCajas || p.cantidadCajas <= 0;
      const matchCategoria = !categoria || p.categoria === categoria;

      return matchBuscador && matchStock && matchSinStock && matchCategoria;
    });

    setProductosFiltrados(filtrados);
    setPaginaActual(1);
  };

  useEffect(() => {
    aplicarFiltros();
  }, [buscadorProductos, conStock, sinStock, categoria]);

  // Buscar productos con sugerencias
  const buscarProductoConSugerencias = (valor) => {
    setBuscadorProductos(valor);
    
    if (valor.length < 2) {
      setSugerenciasProductos([]);
      setMostrarSugerencias(false);
      return;
    }

    const coincidencias = productos.filter(p =>
      (p.producto && p.producto.toLowerCase().includes(valor.toLowerCase())) ||
      (p.codigo && p.codigo.toString().toLowerCase().includes(valor.toLowerCase()))
    ).slice(0, 10);

    setSugerenciasProductos(coincidencias);
    setMostrarSugerencias(coincidencias.length > 0);
  };

  // Seleccionar producto de sugerencias
  const seleccionarProducto = (producto) => {
    setBuscadorProductos(producto.producto || '');
    setSugerenciasProductos([]);
    setMostrarSugerencias(false);
  };

  // Cerrar sugerencias al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sugerenciasRef.current && !sugerenciasRef.current.contains(event.target) &&
        buscadorRef.current && !buscadorRef.current.contains(event.target)) {
        setMostrarSugerencias(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Editar fila
  const editarFila = (id) => {
    const producto = productos.find(p => String(p.id) === String(id));
    if (!producto) return;

    setEstadoFilas(prev => ({
      ...prev,
      [id]: {
        editando: true,
        limite: producto.limite ?? 0,
        cantidadCajas: producto.cantidadCajas ?? 0,
        unidadMedida: producto.unidadMedida || 'CAJAS',
        valoresOriginales: {
          limite: producto.limite ?? 0,
          cantidadCajas: producto.cantidadCajas ?? 0,
          unidadMedida: producto.unidadMedida || 'CAJAS'
        }
      }
    }));
    setEditandoId(id);
  };

  // Confirmar edición
  const confirmarEdicion = (id) => {
    const estado = estadoFilas[id];
    if (!estado) return;

    // Manejar valores vacíos o nulos
    const limite = estado.limite === '' || estado.limite === null || estado.limite === undefined ? 0 : parseFloat(estado.limite);
    const cantidad = estado.cantidadCajas === '' || estado.cantidadCajas === null || estado.cantidadCajas === undefined ? 0 : parseFloat(estado.cantidadCajas);

    if (isNaN(limite) || isNaN(cantidad) || limite < 0 || cantidad < 0) {
      alert('Por favor, ingrese valores válidos');
      return;
    }

    const producto = productos.find(p => String(p.id) === String(id));
    if (!producto) return;

    // Actualizar producto
    const productoActualizado = {
      ...producto,
      limite,
      cantidadCajas: cantidad,
      unidadMedida: estado.unidadMedida
    };

    setProductos(prev => prev.map(p => String(p.id) === String(id) ? productoActualizado : p));

    // Agregar a productos editados
    const registro = {
      id: String(id),
      producto: producto.producto,
      categoria: producto.categoria,
      limite,
      cantidadCajas: cantidad,
      unidadMedida: estado.unidadMedida,
      cantidadAnterior: estado.valoresOriginales.cantidadCajas
    };

    setProductosEditados(prev => {
      const index = prev.findIndex(p => String(p.id) === String(id));
      if (index >= 0) {
        const nuevo = [...prev];
        nuevo[index] = registro;
        return nuevo;
      }
      return [...prev, registro];
    });

    // Mantener en modo edición para que siga visible entre páginas
    // Solo se sale del modo edición cuando se cancela o se guarda todo
    setEstadoFilas(prev => ({
      ...prev,
      [id]: { 
        ...prev[id], 
        editando: true, // Mantener visible
        limite,
        cantidadCajas: cantidad,
        unidadMedida: estado.unidadMedida,
        valoresOriginales: {
          limite,
          cantidadCajas: cantidad,
          unidadMedida: estado.unidadMedida
        },
        confirmado: true // Marcar como confirmado para diferenciarlo
      }
    }));
    // No cambiar editandoId para mantener la selección visible
    aplicarFiltros();
  };

  // Cancelar edición
  const cancelarEdicion = (id) => {
    setEstadoFilas(prev => {
      const nuevo = { ...prev };
      delete nuevo[id];
      return nuevo;
    });
    setEditandoId(null);
  };

  // Confirmar todo pendiente
  const confirmarTodoPendiente = () => {
    const idsPendientes = Object.keys(estadoFilas).filter(id => estadoFilas[id].editando);
    idsPendientes.forEach(id => confirmarEdicion(id));
  };

  // Guardar cambios de stock
  const guardarCambiosStock = () => {
    if (productosEditados.length === 0) {
      alert('No hay cambios para guardar');
      return;
    }
    setMostrarModalActualizacion(true);
  };

  // Enviar actualización de stock
  const enviarActualizacionStock = async () => {
    const responsable = document.getElementById('responsableModalActualizacion')?.value;
    if (!responsable) {
      alert('Debe seleccionar un responsable');
      return;
    }

    if (!confirm(`¿Está seguro de guardar los cambios de ${productosEditados.length} producto(s)?`)) {
      return;
    }

    const motivo = document.getElementById('motivoModalActualizacion')?.value || '';

    const actualizaciones = productosEditados.map(p => ({
      id_producto: p.id,
      limite_descuento_cajas: p.limite,
      cantidad_cajas: p.cantidadCajas,
      unidad_medida_cajas: p.unidadMedida
    }));

    const payload = {
      responsable: responsable,
      motivo: motivo,
      actualizaciones: actualizaciones
    };

    try {
      const token = getAuthToken();
      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch('/api/descuento-cajas/logistica', {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Error en la solicitud');
      }

      const data = await response.json();
      setMostrarModalActualizacion(false);
      setMensajeConfirmacion(data.message || 'Cambios guardados correctamente');
      setMostrarModalConfirmacion(true);
      
      // Limpiar datos
      setProductosEditados([]);
      setEstadoFilas({});
      setEditandoId(null);
      
      // Recargar datos
      cargarDatos();
    } catch (error) {
      console.error('Error guardando cambios:', error);
      alert('Error al guardar cambios: ' + error.message);
    }
  };

  // Aplicar filtros de productos reservados
  const aplicarFiltrosReservados = () => {
    const filtrados = productosReservados.filter(r => {
      const matchBuscador = !buscadorReservados ||
        (r.producto && r.producto.toLowerCase().includes(buscadorReservados.toLowerCase())) ||
        (r.responsable && r.responsable.toLowerCase().includes(buscadorReservados.toLowerCase()));
      
      const matchCategoria = !categoriaReserva || r.categoria === categoriaReserva;
      const matchResponsable = !responsableReserva || r.responsable === responsableReserva;
      
      let matchFecha = true;
      if (fechaInicio || fechaFin) {
        const fechaReserva = new Date(r.fechaHora);
        if (fechaInicio) {
          const inicio = new Date(fechaInicio);
          inicio.setHours(0, 0, 0, 0);
          if (fechaReserva < inicio) matchFecha = false;
        }
        if (fechaFin) {
          const fin = new Date(fechaFin);
          fin.setHours(23, 59, 59, 999);
          if (fechaReserva > fin) matchFecha = false;
        }
      }

      return matchBuscador && matchCategoria && matchResponsable && matchFecha;
    });

    setProductosReservadosFiltrados(filtrados);
  };

  useEffect(() => {
    aplicarFiltrosReservados();
  }, [buscadorReservados, categoriaReserva, responsableReserva, fechaInicio, fechaFin]);

  // Popular filtros de reservados
  const popularFiltrosReservados = (reservadosArray = productosReservados) => {
    // Esta función se puede usar para poblar selects si es necesario
  };

  // Abrir modal gestionar reserva
  const abrirModalGestionarReserva = (reserva) => {
    setReservaSeleccionada(reserva);
    setMostrarModalGestionarReserva(true);
  };

  // Guardar gestión de reserva
  const guardarGestionReserva = async () => {
    if (!reservaSeleccionada) return;

    const accion = document.getElementById('reservaAccion')?.value;
    const cantidad = document.getElementById('reservaCantidad')?.value;
    const unidadMedida = document.getElementById('reservaUnidadMedida')?.value;
    const motivo = document.getElementById('reservaMotivo')?.value;
    const responsable = document.getElementById('reservaResponsableAccion')?.value;

    if (!accion || !cantidad || !responsable) {
      alert('Debe completar los campos obligatorios');
      return;
    }

    if (parseFloat(cantidad) <= 0) {
      alert('La cantidad debe ser mayor a 0');
      return;
    }

    let cantidadEnCajas = parseFloat(cantidad);
    if (unidadMedida === 'UNIDADES') {
      cantidadEnCajas = cantidadEnCajas / 24;
    }

    const cantidadReservada = reservaSeleccionada.cantidadReservada || 0;
    if (cantidadEnCajas > cantidadReservada) {
      alert('La cantidad excede el stock reservado');
      return;
    }

    if (!confirm('¿Está seguro de realizar esta operación?')) {
      return;
    }

    const idReservados = reservaSeleccionada.id || '';
    const esRegreso = accion === 'REGRESAR';

    const datos = {
      id_reservados: idReservados,
      responsable: responsable,
      cantidad_gestionada: parseFloat(cantidad),
      es_regreso: esRegreso,
      motivo: motivo,
      unidad_medida: unidadMedida
    };

    try {
      const token = getAuthToken();
      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch('/api/descuento-cajas/reservas-gestionar', {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(datos)
      });

      if (!response.ok) {
        throw new Error('Error en la solicitud');
      }

      const data = await response.json();
      if (data.success) {
        alert(data.message || 'Gestión de reserva realizada correctamente');
        setMostrarModalGestionarReserva(false);
        setReservaSeleccionada(null);
        cargarDatos();
      } else {
        alert('Error: ' + (data.error || 'Error al gestionar reserva'));
      }
    } catch (error) {
      console.error('Error guardando gestión de reserva:', error);
      alert('Error: ' + error.message);
    }
  };

  // Exportar a Excel
  const exportarExcel = async () => {
    setExportandoExcel(true);
    try {
      const { default: XLSX } = await import('xlsx');

      const token = getAuthToken();
      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch('/api/descuento-cajas/productos', {
        method: 'GET',
        headers: headers
      });
      if (!response.ok) {
        throw new Error('Error al cargar los datos del servidor');
      }

      const data = await response.json();
      const productosArray = Array.isArray(data) ? data : (data.data || []);

      if (productosArray.length === 0) {
        throw new Error('No hay productos para exportar');
      }

      const datosExcel = [];
      datosExcel.push([
        'ID_PRODUCTO',
        'CODIGO_PRODUCTO',
        'PRODUCTO',
        'LIMITE_DESCUENTO_CAJAS',
        'CATEGORIA',
        'CANTIDAD_CAJAS',
        'UNIDAD_MEDIDA_CAJAS'
      ]);

      productosArray.forEach(p => {
        datosExcel.push([
          p.ID_PRODUCTO || p.ID || p.idProducto || p.id_producto || '',
          p.CODIGO_PRODUCTO || p['Código de Producto'] || p.codigo || '',
          p.PRODUCTO || p.Producto || p.producto || '',
          p.LIMITE_DESCUENTO_CAJAS || p.Limite || p.limite || 0,
          p.CATEGORIA || p.categoria || '',
          p.CANTIDAD_CAJAS || p.Cantidad || p.cantidadCajas || 0,
          p.UNIDAD_MEDIDA_CAJAS || p.Unidad_Medida || p.unidadMedida || 'CAJAS'
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(datosExcel);
      const colWidths = [
        { wch: 12 },
        { wch: 18 },
        { wch: 50 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 20 }
      ];
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Inventario');

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const fecha = new Date();
      const fechaFormato = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
      a.download = `Inventario_Stock_${fechaFormato}.xlsx`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert('✅ Inventario exportado a Excel exitosamente.\n\n⚠️ IMPORTANTE: Solo puede modificar la columna CANTIDAD_CAJAS para la importación.');
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('❌ Error al exportar datos: ' + error.message);
    } finally {
      setExportandoExcel(false);
    }
  };

  // Generar imagen de stock
  const generarImagenStock = () => {
    router.push('/logistica/generar-imagen-stock');
  };

  // Generar PDF de productos reservados
  const generarPDFReservados = async () => {
    try {
      if (typeof window === 'undefined') return;
      
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      
      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('PRODUCTOS RESERVADOS', 14, 20);
      
      // Fecha de generación
      const fecha = new Date();
      const fechaFormato = fecha.toLocaleString('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generado el: ${fechaFormato}`, 14, 28);
      
      // Datos de la tabla
      const datosTabla = productosReservadosFiltrados.map(r => [
        r.producto || '',
        r.categoria || '',
        formatearFecha(r.fechaHora),
        r.responsable || '',
        r.cantidadReservada || 0,
        r.unidadMedida || 'CAJAS'
      ]);
      
      // Crear tabla
      autoTable(doc, {
        head: [['Producto', 'Categoría', 'Fecha y Hora', 'Responsable', 'Cantidad Reservada', 'Unidad']],
        body: datosTabla,
        startY: 35,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [0, 39, 76], // Azul oscuro
          textColor: 255,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
      });
      
      // Guardar PDF
      const fechaArchivo = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
      doc.save(`Productos_Reservados_${fechaArchivo}.pdf`);
      
      alert('✅ PDF generado exitosamente');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('❌ Error al generar PDF: ' + error.message);
    }
  };

  // Formatear fecha
  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '';
    if (typeof fechaStr === 'string' && fechaStr.includes('-')) {
      const partes = fechaStr.split(' ');
      const fecha = partes[0];
      const hora = partes[1] || '00:00:00';
      const [año, mes, dia] = fecha.split('-');
      const [horas, minutos, segundos] = hora.split(':');
      const fechaObj = new Date(año, parseInt(mes) - 1, dia, horas || 0, minutos || 0, segundos || 0);
      return fechaObj.toLocaleString('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    }
    if (fechaStr instanceof Date) {
      return fechaStr.toLocaleString('es-PE');
    }
    return fechaStr;
  };

  // Obtener fecha y hora actual
  const obtenerFechaHora = () => {
    const ahora = new Date();
    return ahora.toLocaleString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Paginación
  const totalPaginas = Math.ceil(productosFiltrados.length / productosPorPagina);
  const inicio = (paginaActual - 1) * productosPorPagina;
  const fin = inicio + productosPorPagina;
  const productosPagina = productosFiltrados.slice(inicio, fin);

  // Obtener categorías únicas
  const categorias = [...new Set(productos.map(p => p.categoria).filter(c => c))].sort();
  const categoriasReservados = [...new Set(productosReservados.map(r => r.categoria).filter(c => c))].sort();
  const responsablesReservados = [...new Set(productosReservados.map(r => r.responsable).filter(r => r))].sort();

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
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${
          sidebarOpen ? "lg:ml-60 ml-0" : "ml-0"
        }`}
      >
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto custom-scrollbar" style={{ background: '#F7FAFF' }}>
          <div className="max-w-[95%] mx-auto px-4 py-4">
            {/* Botón Volver */}
            <button
              onClick={() => router.push("/logistica")}
              className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-lg font-medium hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm ripple-effect relative overflow-hidden text-sm group"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver a Logística</span>
            </button>

            {/* Contenedor principal con fondo */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-xl flex items-center justify-center text-white shadow-sm">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'var(--font-poppins)' }}>
                    Gestión de stock - Logistica
                  </h1>
                  <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: 'var(--font-poppins)' }}>
                    Gestión y control de stock de productos
                  </p>
                </div>
              </div>
            </div>

            {/* Controles y Filtros */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200/60 p-4 mb-6">
              {/* Primera fila: Buscador, Checkboxes */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                {/* Columna 1: Buscador (más ancho) */}
                <div className="relative md:col-span-2" ref={buscadorRef}>
                  <input
                    type="text"
                    value={buscadorProductos}
                    onChange={(e) => buscarProductoConSugerencias(e.target.value)}
                    placeholder="Buscar productos por código, nombre, categoría..."
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 placeholder:text-gray-400 bg-white hover:border-blue-300 transition-all duration-200 font-medium"
                    style={{ fontFamily: 'var(--font-poppins)' }}
                  />
                  {mostrarSugerencias && sugerenciasProductos.length > 0 && (
                    <div
                      ref={sugerenciasRef}
                      className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                    >
                      {sugerenciasProductos.map((prod, index) => (
                        <button
                          key={prod.id || index}
                          type="button"
                          onClick={() => seleccionarProducto(prod)}
                          className="w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                        >
                          <div className="text-sm font-medium text-gray-900">{prod.producto}</div>
                          <div className="text-xs text-gray-500">
                            Código: {prod.codigo} | Categoría: {prod.categoria}
                          </div>
                          <div className="text-xs text-blue-600 font-semibold mt-1">
                            {prod.cantidadCajas || 0} cajas
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Columna 2: Checkbox CON STOCK */}
                <div className="flex items-center">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={conStock}
                      onChange={(e) => setConStock(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-semibold text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>CON STOCK</span>
                  </label>
                </div>

                {/* Columna 3: Checkbox SIN STOCK */}
                <div className="flex items-center">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sinStock}
                      onChange={(e) => setSinStock(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-semibold text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>SIN STOCK</span>
                  </label>
                </div>
              </div>

              {/* Segunda fila: Categoría, Botones */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* Columna 1: Categoría (más ancho) */}
                <div className="md:col-span-2">
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                    style={{ fontFamily: 'var(--font-poppins)' }}
                  >
                    <option value="">Todas las categorías</option>
                    {categorias.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Columna 2: Botón Generar IMG Stock */}
                <div>
                  <button
                    onClick={generarImagenStock}
                    className="w-full px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md text-sm flex items-center justify-center gap-2 whitespace-nowrap"
                    style={{ fontFamily: 'var(--font-poppins)' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Generar IMG Stock</span>
                  </button>
                </div>

                {/* Columna 3: Botón Exportar Excel */}
                <div>
                  <button
                    onClick={exportarExcel}
                    disabled={exportandoExcel}
                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md text-sm disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
                    style={{ fontFamily: 'var(--font-poppins)' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>{exportandoExcel ? 'Exportando...' : 'EXPORTAR A EXCEL'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Tabla de Inventario */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden mb-6">

              {cargandoStock ? (
                <div className="text-center py-8 text-gray-600 p-4">Cargando stock...</div>
              ) : errorProductos ? (
                <div className="text-center py-8 text-red-600 p-4 bg-red-50 rounded-lg border border-red-200">
                  <svg className="w-12 h-12 mx-auto mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="font-semibold">Error al cargar productos</p>
                  <p className="text-sm mt-2">{errorProductos}</p>
                  <button
                    onClick={() => cargarDatos()}
                    className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all duration-200"
                  >
                    Reintentar
                  </button>
                </div>
              ) : (
                <>
              {/* Botón Confirmar Todo - Solo aparece cuando hay múltiples filas editando */}
              {(() => {
                const filasEditando = Object.keys(estadoFilas).filter(id => estadoFilas[id].editando && !estadoFilas[id].confirmado);
                const hayMultiplesEditando = filasEditando.length > 1;
                
                if (!hayMultiplesEditando) return null;
                
                return (
                  <div className="px-4 py-3 bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200 flex items-center justify-between">
                    <span className="text-sm font-semibold text-orange-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                      {filasEditando.length} producto(s) en edición
                    </span>
                    <button
                      onClick={() => {
                        filasEditando.forEach(id => confirmarEdicion(id));
                      }}
                      className="px-4 py-2 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-bold transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] flex items-center gap-2 text-sm"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      ✓ Confirmar Todo
                    </button>
                  </div>
                );
              })()}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-700 to-blue-800 border-b-2 border-blue-900">
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Código</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Producto</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Límite</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Categoría</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Cantidad (Cajas)</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Unidad</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>Acciones</th>
                    </tr>
                  </thead>
                      <tbody className="divide-y divide-gray-100">
                        {productosPagina.map((p) => {
                          // Asegurar que el ID se compara como string para mantener consistencia entre páginas
                          const productoId = String(p.id);
                          const estado = estadoFilas[productoId];
                          // Un producto está editando si tiene estado y está marcado como editando
                          // Esto permite que persista entre páginas
                          const editando = estado && estado.editando === true;
                          
                          return (
                            <tr
                              key={productoId}
                              onClick={() => {
                                if (editando) {
                                  cancelarEdicion(productoId);
                                } else {
                                  editarFila(productoId);
                                }
                              }}
                              className={`hover:bg-blue-50 transition-all duration-200 cursor-pointer border-b border-gray-100 ${editando ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-l-4 border-yellow-500 shadow-sm' : ''}`}
                            >
                              <td className="px-4 py-3 whitespace-nowrap text-[10px] font-medium text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>{p.codigo}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{p.producto}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>
                                {editando ? (
                                  <input
                                    type="number"
                                    value={estado.limite !== undefined && estado.limite !== null ? estado.limite : ''}
                                    onChange={(e) => {
                                      const valor = e.target.value;
                                      setEstadoFilas(prev => ({
                                        ...prev,
                                        [productoId]: { 
                                          ...prev[productoId], 
                                          limite: valor === '' ? '' : (isNaN(parseFloat(valor)) ? '' : parseFloat(valor))
                                        }
                                      }));
                                    }}
                                    onBlur={(e) => {
                                      if (e.target.value === '') {
                                        setEstadoFilas(prev => ({
                                          ...prev,
                                          [productoId]: { ...prev[productoId], limite: 0 }
                                        }));
                                      }
                                    }}
                                    className="w-full px-2 py-1 border-2 border-yellow-500 rounded text-[10px] text-gray-900 font-semibold"
                                    onClick={(e) => e.stopPropagation()}
                                    placeholder="0"
                                  />
                                ) : (
                                  <span className="text-gray-900 font-medium flex items-center gap-1">
                                    {p.limite ?? 0}
                                    <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{p.categoria}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-[10px] font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                                {editando ? (
                                  <input
                                    type="number"
                                    value={estado.cantidadCajas !== undefined && estado.cantidadCajas !== null ? estado.cantidadCajas : ''}
                                    onChange={(e) => {
                                      const valor = e.target.value;
                                      setEstadoFilas(prev => ({
                                        ...prev,
                                        [productoId]: { 
                                          ...prev[productoId], 
                                          cantidadCajas: valor === '' ? '' : (isNaN(parseFloat(valor)) ? '' : parseFloat(valor))
                                        }
                                      }));
                                    }}
                                    onBlur={(e) => {
                                      if (e.target.value === '') {
                                        setEstadoFilas(prev => ({
                                          ...prev,
                                          [productoId]: { ...prev[productoId], cantidadCajas: 0 }
                                        }));
                                      }
                                    }}
                                    className="w-full px-2 py-1 border-2 border-yellow-500 rounded text-[10px] text-gray-900 font-semibold"
                                    onClick={(e) => e.stopPropagation()}
                                    placeholder="0"
                                  />
                                ) : (
                                  <span className="text-gray-900">{p.cantidadCajas ?? 0}</span>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>
                                {editando ? (
                                  <select
                                    value={estado.unidadMedida || 'CAJAS'}
                                    onChange={(e) => setEstadoFilas(prev => ({
                                      ...prev,
                                      [productoId]: { ...prev[productoId], unidadMedida: e.target.value }
                                    }))}
                                    className="w-full px-2 py-1 border-2 border-yellow-500 rounded text-[10px] text-gray-900 font-semibold"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <option value="CAJAS">CAJAS</option>
                                    <option value="UNIDADES">UNIDADES</option>
                                  </select>
                                ) : (
                                  p.unidadMedida || 'CAJAS'
                                )}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                                {editando ? (
                                  <div className="flex items-center justify-center space-x-2">
                                    <button
                                      onClick={() => confirmarEdicion(productoId)}
                                      className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                      title="Confirmar"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => cancelarEdicion(productoId)}
                                      className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                      title="Cancelar"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => editarFila(productoId)}
                                    className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                    title="Editar"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Paginación */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 flex items-center justify-between border-t border-gray-200">
                    <button
                      onClick={() => setPaginaActual(1)}
                      disabled={paginaActual === 1}
                      className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                    >
                      «
                    </button>
                    <button
                      onClick={() => setPaginaActual(prev => Math.max(1, prev - 1))}
                      disabled={paginaActual === 1}
                      className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                    >
                      &lt;
                    </button>
                    <span className="text-xs text-gray-700 font-semibold" style={{ fontFamily: 'var(--font-poppins)' }}>
                      Página {paginaActual} de {totalPaginas || 1}
                    </span>
                    <button
                      onClick={() => setPaginaActual(prev => Math.min(totalPaginas, prev + 1))}
                      disabled={paginaActual >= totalPaginas}
                      className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                    >
                      &gt;
                    </button>
                    <button
                      onClick={() => setPaginaActual(totalPaginas)}
                      disabled={paginaActual >= totalPaginas}
                      className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                    >
                      »
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Sección Productos Reservados */}
            {/* Header separado */}
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-xl flex items-center justify-center text-white shadow-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'var(--font-poppins)' }}>
                  Productos reservados
                </h2>
                <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: 'var(--font-poppins)' }}>
                  Productos actualmente reservados para ventas
                </p>
              </div>
            </div>

            {/* Controles de filtros en cuadro */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200/60 p-4 mb-4">
              {/* Buscador */}
              <div className="mb-4">
                <input
                  type="text"
                  value={buscadorReservados}
                  onChange={(e) => setBuscadorReservados(e.target.value)}
                  placeholder="Buscar Producto/Responsable..."
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                  style={{ fontFamily: 'var(--font-poppins)' }}
                />
              </div>

              {/* Dropdowns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <select
                  value={categoriaReserva}
                  onChange={(e) => setCategoriaReserva(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                  style={{ fontFamily: 'var(--font-poppins)' }}
                >
                  <option value="">Todas las Categorías</option>
                  {categoriasReservados.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <select
                  value={responsableReserva}
                  onChange={(e) => setResponsableReserva(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                  style={{ fontFamily: 'var(--font-poppins)' }}
                >
                  <option value="">Todos los Responsables</option>
                  {responsablesReservados.map(resp => (
                    <option key={resp} value={resp}>{resp}</option>
                  ))}
                </select>
              </div>

              {/* Fechas con labels */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold text-gray-700 whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>De:</label>
                  <div className="relative flex-1">
                    <input
                      type="date"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                      className="w-full px-3 py-2 pr-10 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                    />
                    <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold text-gray-700 whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>a:</label>
                  <div className="relative flex-1">
                    <input
                      type="date"
                      value={fechaFin}
                      onChange={(e) => setFechaFin(e.target.value)}
                      className="w-full px-3 py-2 pr-10 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                    />
                    <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => aplicarFiltrosReservados()}
                  className="w-full px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md text-sm flex items-center justify-center gap-2"
                  style={{ fontFamily: 'var(--font-poppins)' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>Aplicar Filtros</span>
                </button>
                <button
                  onClick={generarPDFReservados}
                  className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md text-sm flex items-center justify-center gap-2"
                  style={{ fontFamily: 'var(--font-poppins)' }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 2C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V7.41421C19 7.149 18.8946 6.89464 18.7071 6.70711L13.2929 1.29289C13.1054 1.10536 12.851 1 12.5858 1H6Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
                    <path d="M13 1V6H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <text x="12" y="15" fontSize="6" fill="currentColor" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="0.3">PDF</text>
                  </svg>
                  <span>Generar PDF</span>
                </button>
              </div>
            </div>

            {/* Contenedor de tabla */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">

              {cargandoReservados ? (
                <div className="text-center py-8 text-gray-600 p-4">Cargando productos reservados...</div>
              ) : errorReservados ? (
                <div className="text-center py-8 text-red-600 p-4 bg-red-50 rounded-lg border border-red-200">
                  <svg className="w-12 h-12 mx-auto mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="font-semibold">Error al cargar productos reservados</p>
                  <p className="text-sm mt-2">{errorReservados}</p>
                  <button
                    onClick={() => cargarDatos()}
                    className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all duration-200"
                  >
                    Reintentar
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-blue-700 border-b-2 border-blue-800">
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Producto</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Categoría</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Fecha y Hora</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Responsable</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Cantidad Reservada</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Unidad</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {productosReservadosFiltrados.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-4 py-3 text-center text-[10px] text-gray-600" style={{ fontFamily: 'var(--font-poppins)' }}>
                            No se encontraron productos reservados que coincidan con los filtros.
                          </td>
                        </tr>
                      ) : (
                        productosReservadosFiltrados.map((r) => (
                          <tr key={r.id} className="hover:bg-blue-50 transition-colors border-b border-gray-100">
                            <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{r.producto}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{r.categoria}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{formatearFecha(r.fechaHora)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{r.responsable}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-[10px] font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>{r.cantidadReservada || 0}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{r.unidadMedida || 'CAJAS'}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-center">
                              <button
                                onClick={() => abrirModalGestionarReserva(r)}
                                className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                title="Gestionar"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal Gestionar Reserva */}
      <Modal
        isOpen={mostrarModalGestionarReserva}
        onClose={() => {
          setMostrarModalGestionarReserva(false);
          setReservaSeleccionada(null);
        }}
        title="🔒 Gestionar Producto Reservado"
        size="medium"
      >
        {reservaSeleccionada && (
          <div className="space-y-5">
            <div className="bg-gradient-to-br from-blue-50 to-gray-50 p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <strong className="block text-sm font-bold text-gray-900 mb-1.5" style={{ fontFamily: 'var(--font-poppins)' }}>Producto:</strong>
                  <p className="text-sm text-gray-800 font-medium" style={{ fontFamily: 'var(--font-poppins)' }}>{reservaSeleccionada.producto}</p>
                </div>
                <div>
                  <strong className="block text-sm font-bold text-gray-900 mb-1.5" style={{ fontFamily: 'var(--font-poppins)' }}>Categoría:</strong>
                  <p className="text-sm text-gray-800 font-medium" style={{ fontFamily: 'var(--font-poppins)' }}>{reservaSeleccionada.categoria}</p>
                </div>
                <div>
                  <strong className="block text-sm font-bold text-gray-900 mb-1.5" style={{ fontFamily: 'var(--font-poppins)' }}>Stock Reservado:</strong>
                  <p className="text-sm text-gray-800 font-medium" style={{ fontFamily: 'var(--font-poppins)' }}>{reservaSeleccionada.cantidadReservada} {reservaSeleccionada.unidadMedida}</p>
                </div>
                <div>
                  <strong className="block text-sm font-bold text-gray-900 mb-1.5" style={{ fontFamily: 'var(--font-poppins)' }}>Responsable:</strong>
                  <p className="text-sm text-gray-800 font-medium" style={{ fontFamily: 'var(--font-poppins)' }}>{reservaSeleccionada.responsable}</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>Acción *</label>
              <select id="reservaAccion" className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white font-medium" style={{ fontFamily: 'var(--font-poppins)' }}>
                <option value="">Seleccione una acción</option>
                <option value="RETIRAR">Retirar (vender/usar)</option>
                <option value="REGRESAR">Regresar al stock general</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>Cantidad *</label>
                <input
                  type="number"
                  id="reservaCantidad"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white font-medium"
                  style={{ fontFamily: 'var(--font-poppins)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>Unidad de Medida</label>
                <select id="reservaUnidadMedida" className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white font-medium" style={{ fontFamily: 'var(--font-poppins)' }}>
                  <option value="CAJAS">CAJAS</option>
                  <option value="UNIDADES">UNIDADES</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>Motivo (Opcional)</label>
              <textarea
                id="reservaMotivo"
                placeholder="Ingrese el motivo de la operación"
                rows={3}
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white font-medium resize-none"
                style={{ fontFamily: 'var(--font-poppins)' }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>Responsable *</label>
                <select id="reservaResponsableAccion" className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white font-medium" style={{ fontFamily: 'var(--font-poppins)' }}>
                  <option value="">Seleccione</option>
                  <option value="EDGAR">EDGAR</option>
                  <option value="EVELYN">EVELYN</option>
                  <option value="KIMBERLY">KIMBERLY</option>
                  <option value="JOSEPH">JOSEPH</option>
                  <option value="ALVARO">ALVARO</option>
                  <option value="MANUEL">MANUEL</option>
                  <option value="JHONSON">JHONSON</option>
                  <option value="VICTOR">VICTOR</option>
                  <option value="LIZETH">LIZETH</option>
                  <option value="JOSÉ">JOSÉ</option>
                  <option value="HERVIN">HERVIN</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>Fecha y Hora</label>
                <input
                  type="text"
                  id="reservaFechaHora"
                  value={obtenerFechaHora()}
                  readOnly
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg bg-gray-100 text-sm text-gray-700 font-medium"
                  style={{ fontFamily: 'var(--font-poppins)' }}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={guardarGestionReserva}
                className="flex-1 px-5 py-2.5 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-lg font-bold transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
                style={{ fontFamily: 'var(--font-poppins)' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Guardar
              </button>
              <button
                onClick={() => {
                  setMostrarModalGestionarReserva(false);
                  setReservaSeleccionada(null);
                }}
                className="flex-1 px-5 py-2.5 bg-gradient-to-br from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-lg font-bold transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98]"
                style={{ fontFamily: 'var(--font-poppins)' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Actualización */}
      <Modal
        isOpen={mostrarModalActualizacion}
        onClose={() => setMostrarModalActualizacion(false)}
        title="📋 Información de Actualización"
        size="medium"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Responsable *</label>
            <select id="responsableModalActualizacion" className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none">
              <option value="">Seleccione</option>
              <option value="EDGAR">EDGAR</option>
              <option value="EVELYN">EVELYN</option>
              <option value="KIMBERLY">KIMBERLY</option>
              <option value="JOSEPH">JOSEPH</option>
              <option value="ALVARO">ALVARO</option>
              <option value="MANUEL">MANUEL</option>
              <option value="JHONSON">JHONSON</option>
              <option value="VICTOR">VICTOR</option>
              <option value="LIZETH">LIZETH</option>
              <option value="JOSÉ">JOSÉ</option>
              <option value="HERVIN">HERVIN</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Fecha y Hora</label>
            <input
              type="text"
              id="fechaHoraModalActualizacion"
              value={obtenerFechaHora()}
              readOnly
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-gray-100 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Motivo (Opcional)</label>
            <textarea
              id="motivoModalActualizacion"
              placeholder="Ingrese el motivo de la actualización..."
              rows={3}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              onClick={enviarActualizacionStock}
              className="flex-1 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold transition-all duration-200"
            >
              💾 Guardar Cambios
            </button>
            <button
              onClick={() => setMostrarModalActualizacion(false)}
              className="flex-1 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all duration-200"
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Confirmación */}
      <Modal
        isOpen={mostrarModalConfirmacion}
        onClose={() => setMostrarModalConfirmacion(false)}
        title="✅ Operación Exitosa"
        size="small"
      >
        <div className="space-y-4">
          <div className="bg-green-100 text-green-800 p-4 rounded-lg text-center font-semibold">
            {mensajeConfirmacion}
          </div>
          <button
            onClick={() => setMostrarModalConfirmacion(false)}
            className="w-full px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold transition-all duration-200"
          >
            Aceptar
          </button>
        </div>
      </Modal>
    </div>
  );
}

