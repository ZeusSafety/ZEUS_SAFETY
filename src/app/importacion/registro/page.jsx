"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/context/AuthContext";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";
import Modal from "../../../components/ui/Modal";
import { color } from "framer-motion";
import { form } from "framer-motion/client";

// Componente Combobox personalizado
const CustomCombobox = ({ value, onChange, options, placeholder, disabled = false, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const selectRef = useRef(null);
  const buttonRef = useRef(null);

  // Solo considerar seleccionado si el valor no está vacío y existe en las opciones
  const selectedOption = value && value !== "" ? options.find(opt => opt.value === value) : null;

  const handleSelect = (optionValue) => {
    if (disabled) return;
    onChange({ target: { value: optionValue } });
    setIsOpen(false);
  };

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = 200;
      setOpenUpward(spaceAbove > spaceBelow && spaceBelow < dropdownHeight);
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={selectRef}>
      {label && (
        <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
          {label}
        </label>
      )}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`w-full px-3 py-2 rounded-lg focus:outline-none text-sm text-left flex items-center justify-between transition-all border-2 ${isOpen
          ? 'bg-blue-700 text-white border-blue-700'
          : selectedOption
            ? 'bg-blue-700 text-white border-blue-700'
            : 'bg-white border-gray-300 text-gray-500 hover:border-blue-300'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        style={{ fontFamily: 'var(--font-poppins)' }}
      >
        <span className="whitespace-nowrap overflow-hidden text-ellipsis">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`w-4 h-4 transition-transform flex-shrink-0 ml-2 ${isOpen ? 'transform rotate-180' : ''
            } ${isOpen || selectedOption ? 'text-white' : 'text-gray-400'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div
          className={`absolute z-50 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-xl overflow-hidden ${openUpward ? 'bottom-full mb-1' : 'top-full'
            }`}
          style={{ maxHeight: '200px', overflowY: 'auto' }}
        >
          {options.map((option, index) => (
            <button
              key={option.value || index}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`w-full px-3 py-2.5 text-sm text-left transition-colors border-b border-gray-100 last:border-b-0 ${value === option.value
                ? 'bg-blue-700 text-white font-semibold'
                : 'text-gray-900 hover:bg-blue-50'
                } ${index === 0 && !option.value ? 'text-gray-500 italic' : ''}`}
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default function RegistroImportacionesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Estados para el formulario
  const [formData, setFormData] = useState({
    fechaRegistro: new Date().toISOString().split('T')[0],
    numeroDespacho: "",
    responsable: "",
    fechaLlegada: "",
    tipoCarga: "",
    estado: "",
    descripcionGeneral: "",
  });

  // Estados para productos
  const [productoBusqueda, setProductoBusqueda] = useState("");
  const [codigoProducto, setCodigoProducto] = useState("");
  const [sugerenciasProductos, setSugerenciasProductos] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [buscandoProductos, setBuscandoProductos] = useState(false);
  const [todosLosProductos, setTodosLosProductos] = useState([]);
  const [productosCargados, setProductosCargados] = useState(false);
  const sugerenciasRef = useRef(null);
  const productoInputRef = useRef(null);

  // Estados para detalle de producto
  const [detalleProducto, setDetalleProducto] = useState({
    unidadMedida: "",
    cantidad: "",
    cantidadCaja: "",
    imagen: null,
  });

  // Lista de productos agregados
  const [listaProductos, setListaProductos] = useState([]);

  // Estados para edición de productos en la tabla
  const [editingProductoId, setEditingProductoId] = useState(null);
  const [editingProducto, setEditingProducto] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productoToDelete, setProductoToDelete] = useState(null);
  const [busquedaProductoEdicion, setBusquedaProductoEdicion] = useState("");
  const [mostrarSugerenciasProductoEdicion, setMostrarSugerenciasProductoEdicion] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const productoEdicionRef = useRef(null);
  const dropdownRef = useRef(null);

  // Estados para el modal de previsualización del PDF
  const [mostrarModalPreview, setMostrarModalPreview] = useState(false);
  const [previewHTML, setPreviewHTML] = useState("");
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [registroCompletado, setRegistroCompletado] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Manejar posición del dropdown de productos en edición
  useEffect(() => {
    if (mostrarSugerenciasProductoEdicion && productoEdicionRef.current) {
      const updatePosition = () => {
        if (productoEdicionRef.current) {
          const rect = productoEdicionRef.current.getBoundingClientRect();
          setDropdownPosition({
            top: rect.bottom + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width
          });
        }
      };
      
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [mostrarSugerenciasProductoEdicion]);

  // Manejar clics fuera del dropdown de edición
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Para el dropdown principal de productos
      if (productoInputRef.current && !productoInputRef.current.contains(event.target)) {
        if (sugerenciasRef.current && !sugerenciasRef.current.contains(event.target)) {
          setMostrarSugerencias(false);
        }
      }
      
      // Para el dropdown de edición en la tabla
      if (mostrarSugerenciasProductoEdicion) {
        if (productoEdicionRef.current && 
            !productoEdicionRef.current.contains(event.target) && 
            dropdownRef.current && 
            !dropdownRef.current.contains(event.target)) {
          setTimeout(() => {
            setMostrarSugerenciasProductoEdicion(false);
          }, 100);
        }
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [mostrarSugerenciasProductoEdicion]);

  // Detectar si es desktop y abrir sidebar automáticamente
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

  // Función para obtener el token de autenticación
  const getAuthToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  };

  // Función para cargar todos los productos desde la API
  const cargarTodosLosProductos = async () => {
    if (productosCargados) {
      return;
    }

    const token = getAuthToken();
    if (!token) {
      console.error("No se encontró token de autenticación");
      return;
    }

    setBuscandoProductos(true);
    try {
      // Usar el proxy de Next.js para evitar problemas de CORS
      const url = `/api/productos?method=BUSQUEDA_PRODUCTO`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error ${response.status}: ${response.statusText}`, errorText);
        setBuscandoProductos(false);
        return;
      }

      const data = await response.json();
      const productos = Array.isArray(data) ? data : (data.data || []);

      console.log("Productos cargados:", productos.length);
      setTodosLosProductos(productos);
      setProductosCargados(true);
    } catch (error) {
      console.error("Error al cargar productos:", error);
    } finally {
      setBuscandoProductos(false);
    }
  };

  // Función para filtrar productos localmente
  const filtrarProductos = (termino) => {
    if (todosLosProductos.length === 0) {
      setSugerenciasProductos([]);
      setMostrarSugerencias(false);
      return;
    }

    const terminoLower = termino.toLowerCase().trim();
    if (terminoLower.length < 1) {
      setSugerenciasProductos([]);
      setMostrarSugerencias(false);
      return;
    }

    const filtrados = todosLosProductos.filter((prod) => {
      const nombre = (prod.NOMBRE || prod.nombre || "").toLowerCase();
      const codigo = (prod.CODIGO || prod.codigo || "").toLowerCase();
      return nombre.includes(terminoLower) || codigo.includes(terminoLower);
    });

    setSugerenciasProductos(filtrados);
    setMostrarSugerencias(filtrados.length > 0);
  };

  // Función para buscar productos
  const buscarProductos = (termino) => {
    if (!termino || termino.trim().length < 1) {
      setSugerenciasProductos([]);
      setMostrarSugerencias(false);
      return;
    }

    // Si no hay productos cargados, cargarlos primero
    if (!productosCargados && todosLosProductos.length === 0) {
      cargarTodosLosProductos().then(() => {
        // Después de cargar, filtrar con el término
        filtrarProductos(termino);
      });
      return;
    }

    filtrarProductos(termino);
  };

  // Manejar cambio en búsqueda de producto
  const handleProductoBusquedaChange = (e) => {
    const valor = e.target.value;
    setProductoBusqueda(valor);
    buscarProductos(valor);
  };

  // Seleccionar producto
  const seleccionarProducto = (producto) => {
    const nombre = producto.NOMBRE || producto.nombre || "";
    const codigo = producto.CODIGO || producto.codigo || "";
    setProductoBusqueda(nombre);
    setCodigoProducto(codigo);
    setSugerenciasProductos([]);
    setMostrarSugerencias(false);
  };

  // Manejar focus en input de producto
  const handleProductoFocus = () => {
    // Cargar productos si no están cargados
    if (!productosCargados && todosLosProductos.length === 0) {
      cargarTodosLosProductos();
    }

    // Si hay texto y sugerencias previas, mostrarlas
    if (productoBusqueda && sugerenciasProductos.length > 0) {
      setMostrarSugerencias(true);
    }
  };

  // Agregar producto a la lista
  const agregarProductoALista = () => {
    if (!productoBusqueda || !codigoProducto) {
      alert("Por favor, seleccione un producto");
      return;
    }

    if (!detalleProducto.unidadMedida || !detalleProducto.cantidad) {
      alert("Por favor, complete la unidad de medida y cantidad");
      return;
    }

    const nuevoProducto = {
      id: Date.now(),
      producto: productoBusqueda,
      codigo: codigoProducto,
      unidadMedida: detalleProducto.unidadMedida,
      cantidad: detalleProducto.cantidad,
      cantidadCaja: detalleProducto.cantidadCaja || "",
      imagen: detalleProducto.imagen,
    };

    setListaProductos([...listaProductos, nuevoProducto]);

    // Limpiar campos
    setProductoBusqueda("");
    setCodigoProducto("");
    setDetalleProducto({
      unidadMedida: "",
      cantidad: "",
      cantidadCaja: "",
      imagen: null,
    });
  };

  const iniciarEdicionProducto = (prod) => {
    setEditingProductoId(prod.id);
    setEditingProducto({ ...prod });
    setBusquedaProductoEdicion(prod.producto || "");
    setMostrarSugerenciasProductoEdicion(false);
  };

  const cancelarEdicionProducto = () => {
    setEditingProductoId(null);
    setEditingProducto(null);
    setBusquedaProductoEdicion("");
    setMostrarSugerenciasProductoEdicion(false);
  };

  const guardarEdicionProducto = () => {
    if (!editingProducto) return;
    
    // Validar campos requeridos
    if (!editingProducto.producto || !editingProducto.cantidad || !editingProducto.unidadMedida) {
      alert("Campos incompletos.");
      return;
    }

    // Actualizar el producto en la lista
    setListaProductos(listaProductos.map(item => 
      item.id === editingProductoId 
        ? { 
            ...editingProducto,
            codigo: editingProducto.codigo || item.codigo || ""
          }
        : item
    ));

    // Limpiar estados de edición
    setEditingProductoId(null);
    setEditingProducto(null);
    setBusquedaProductoEdicion("");
    setMostrarSugerenciasProductoEdicion(false);
  };

  const handleProductoSelectEdicion = (prod) => {
    const nombreProducto = prod.NOMBRE || prod.nombre;
    const codigoProducto = prod.CODIGO || prod.codigo;
    
    setEditingProducto(prev => {
      if (!prev) return prev;
      return { ...prev, producto: nombreProducto, codigo: codigoProducto };
    });
    setBusquedaProductoEdicion(nombreProducto);
    
    setTimeout(() => {
      setMostrarSugerenciasProductoEdicion(false);
    }, 50);
  };

  const confirmarEliminarProducto = (id) => {
    setProductoToDelete(id);
    setShowDeleteModal(true);
  };

  // Eliminar producto de la lista
  const eliminarProducto = () => {
    if (productoToDelete) {
      setListaProductos(listaProductos.filter(p => p.id !== productoToDelete));
      setShowDeleteModal(false);
      setProductoToDelete(null);
    }
  };

  // Función para convertir imagen a base64
  const convertirImagenABase64 = (url) => {
    return new Promise((resolve) => {
      const img = new Image();
      // Solo usar crossOrigin para URLs externas
      if (url.startsWith('http') && !url.includes(window.location.host)) {
        img.crossOrigin = 'anonymous';
      }

      // Timeout para evitar esperas infinitas
      const timeout = setTimeout(() => {
        resolve(null);
      }, 5000);

      img.onload = () => {
        clearTimeout(timeout);
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const dataURL = canvas.toDataURL('image/png');
          resolve(dataURL);
        } catch (e) {
          console.warn("Error al convertir imagen a base64:", e);
          resolve(null);
        }
      };

      img.onerror = () => {
        clearTimeout(timeout);
        console.warn("Error al cargar imagen:", url);
        resolve(null);
      };

      img.src = url;
    });
  };

  // Función para formatear fecha sin problemas de zona horaria
  const formatearFecha = (fechaString) => {
    if (!fechaString) return "";
    // Si la fecha viene en formato YYYY-MM-DD, extraer directamente sin conversión de zona horaria
    const partes = fechaString.split('-');
    if (partes.length === 3) {
      const [anio, mes, dia] = partes;
      return `${dia}/${mes}/${anio}`;
    }
    // Si viene en otro formato, intentar parsear
    const fecha = new Date(fechaString + 'T12:00:00'); // Usar mediodía para evitar problemas de zona horaria
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const anio = fecha.getFullYear();
    return `${dia}/${mes}/${anio}`;
  };

  // Función para generar el HTML de la plantilla con los datos
  const generarHTMLPlantilla = (logoBase64 = null) => {
    const fechaRegistro = formData.fechaRegistro
      ? formatearFecha(formData.fechaRegistro)
      : formatearFecha(new Date().toISOString().split('T')[0]);

    const fechaLlegada = formData.fechaLlegada
      ? formatearFecha(formData.fechaLlegada)
      : "";

    // Generar filas de la tabla de productos
    let filasProductos = "";
    // Siempre generar 22 filas, pero solo numerar las que tienen productos
    const totalFilas = 22;
    let totalCantidad = 0;
    let contadorProductos = 0; // Contador para numerar solo los productos reales

    for (let i = 0; i < totalFilas; i++) {
      const producto = listaProductos[i];
      if (producto) {
        contadorProductos++; // Incrementar solo cuando hay producto
        const cantidad = parseInt(producto.cantidad) || 0;
        totalCantidad += cantidad;
        // Escapar el nombre del producto para HTML
        const nombreProducto = (producto.producto || "").replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        filasProductos += `
          <tr>
            <td><input type="text" value="${contadorProductos}" readonly></td>
            <td class="producto-cell"><div class="producto-text">${nombreProducto}</div></td>
            <td><input type="text" value="${producto.codigo || ""}" readonly></td>
            <td><input type="text" value="${producto.unidadMedida || ""}" readonly></td>
            <td><input type="text" value="${producto.cantidad || ""}" readonly></td>
            <td><input type="text" value="${producto.cantidadCaja || ""}" readonly></td>
            <td><input type="text" value="" readonly></td>
            <td><input type="text" value="" readonly></td>
          </tr>
        `;
      } else {
        // Fila vacía sin número en la columna N°
        filasProductos += `
          <tr>
            <td><input type="text" value="" readonly></td>
            <td class="producto-cell"><div class="producto-text"></div></td>
            <td><input type="text" value="" readonly></td>
            <td><input type="text" value="" readonly></td>
            <td><input type="text" value="" readonly></td>
            <td><input type="text" value="" readonly></td>
            <td><input type="text" value="" readonly></td>
            <td><input type="text" value="" readonly></td>
          </tr>
        `;
      }
    }

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ficha de Importación - Zeus Safety</title>
    <style>
        :root {
            --zeus-blue-light: #d9e9f9;
            --zeus-blue-header: #9bc2e6;
            --zeus-border: #8497b0;
            --text-color: #333;
        }

        body {
            font-family: Arial, sans-serif;
            background-color: #f0f0f0;
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            color: #000000;
        }

        .document-page {
            background-color: white;
            width: 850px; 
            min-height: 1100px;
            padding: 40px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            box-sizing: border-box;
            position: relative;
        }

        .header-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 5px;
        }

        .company-info {
            font-size: 12px;
            font-weight: bold;
            line-height: 1.4;
            color: #000000;
        }

        .logo-container img {
            width: 175px;
            height: auto;
        }

        .registration-date {
            text-align: center;
            font-size: 11px;
            width: 100%;
            margin-bottom: 10px;
            font-weight: bold;
            color: #000000;
        }

        .main-title {
            background-color: var(--zeus-blue-light);
            border: 1.5px solid var(--zeus-border);
            text-align: center;
            padding: 8px;
            font-weight: bold;
            font-size: 18px;
            margin-bottom: 20px;
            letter-spacing: 1px;
            color: #000000;
        }

        .top-fields {
            display: grid;
            grid-template-columns: 1fr 1fr;
            border: 1.5px solid var(--zeus-border);
            margin-bottom: 20px;
        }

        .field-group {
            display: flex;
            align-items: center;
            padding: 10px;
            border: 0.5px solid var(--zeus-border);
        }

        .field-label {
            font-size: 11px;
            font-weight: bold;
            width: 120px;
            color: #000000;
        }

        .field-input {
            border: none;
            border-bottom: 1px solid var(--zeus-border);
            flex-grow: 1;
            outline: none;
            font-size: 13px;
            padding: 2px 5px;
            color: #000000;
            background-color: transparent;
            height: 35px;
        }

        .import-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }

        .import-table th {
            background-color: var(--zeus-blue-header);
            border: 1px solid var(--zeus-border);
            font-size: 10px;
            padding: 6px 2px;
            text-transform: uppercase;
            color: #000000;
        }

        .import-table td {
            border: 1px solid var(--zeus-border);
            height: 22px;
            padding: 0;
            color: #000000;
        }

        .import-table td.producto-cell {
            height: auto;
            min-height: 22px;
            vertical-align: top;
            padding: 2px 5px;
        }

        .import-table input {
            width: 100%;
            height: 100%;
            border: none;
            outline: none;
            padding: 0 5px;
            box-sizing: border-box;
            font-size: 11px;
            background-color: transparent;
            color: #000000;
        }

        .import-table .producto-text {
            width: 100%;
            min-height: 18px;
            padding: 2px 0;
            font-size: 11px;
            color: #000000;
            word-wrap: break-word;
            overflow-wrap: break-word;
            white-space: normal;
            line-height: 1.3;
            font-family: Arial, sans-serif;
            margin-bottom: 10px;
        }

        .import-table tr:nth-child(even) td {
            background-color: #f9fbff;
        }

        .footer-total {
            margin-top: 15px;
            display: flex;
            justify-content: flex-end;
        }

        .total-box {
            display: flex;
            width: 300px;
            border: 1px solid var(--zeus-border);
        }

        .total-label {
            background-color: var(--zeus-blue-header);
            font-weight: bold;
            font-size: 12px;
            padding: 5px 15px;
            flex-grow: 1;
            text-align: right;
            color: #000000;
        }

        .total-value {
            background-color: var(--zeus-blue-light);
            width: 80px;
            padding: 5px;
            color: #000000;
        }

        .total-value input {
            color: #000000;
        }

        @media print {
            body { background: none; padding: 0; }
            .document-page { box-shadow: none; }
            .no-print { display: none; }
        }
    </style>
    <base href="${window.location.origin}/">
</head>
<body>
<div class="document-page">   
    <div class="registration-date">Fecha Registro: ${fechaRegistro}</div>

    <div class="header-top">
        <div class="company-info">
            BUSINESS OF IMPORT ZEUS S.A.C<br>
            AV. GUILLERMO DANSEY NRO. 401<br>
            LIMA - LIMA - LIMA<br>
            TELEFONO: 944767397
        </div>
        <div class="logo-container">
            <img src="${logoBase64 || (window.location.origin + '/images/zeus.logooo.png?v=' + Date.now())}" alt="Zeus Safety Logo" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
            <div style="width: 200px; height: 60px; background-color: #f0f0f0; display: none; align-items: center; justify-content: center; font-size: 12px; color: #666; border: 1px solid #ddd;">LOGO ZEUS</div>
        </div>
    </div>

    <div class="main-title">FICHA DE IMPORTACIÓN</div>

    <div class="top-fields">
        <div class="field-group">
            <span class="field-label">N° DESPACHO :</span>
            <input type="text" class="field-input" value="${formData.numeroDespacho || ""}" readonly>
        </div>
        <div class="field-group">
            <span class="field-label">GENERADO POR :</span>
            <input type="text" class="field-input" value="${formData.responsable || ""}" readonly>
        </div>
        <div class="field-group">
            <span class="field-label">TIPO DE CARGA :</span>
            <input type="text" class="field-input" value="${formData.tipoCarga || ""}" readonly>
        </div>
        <div class="field-group">
            <span class="field-label">FECHA LLEGADA :</span>
            <input type="text" class="field-input" value="${fechaLlegada}" readonly>
        </div>
    </div>

    <table class="import-table" id="itemsTable">
        <thead>
            <tr>
                <th style="width: 30px;">N°</th>
                <th style="width: 180px;">PRODUCTO</th>
                <th style="width: 80px;">CODIGO</th>
                <th style="width: 70px;">UNI. MEDIDA</th>
                <th style="width: 70px;">CANTIDAD</th>
                <th style="width: 80px;">CANT. EN CAJA</th>
                <th style="width: 80px;">VERIFICACIÓN</th>
                <th>OBSERVACIONES</th>
            </tr>
        </thead>
        <tbody id="tableBody">
            ${filasProductos}
        </tbody>
    </table>

    <div hidden>
        <div class="total-box">
            <div class="total-label">TOTAL :</div>
            <div class="total-value"><input type="text" value="${totalCantidad}" style="width:100%; border:none; background:transparent; outline:none;" readonly></div>
        </div>
    </div>
</div>
</body>
</html>
    `;
    return html;
  };

  // Función para generar el PDF desde el HTML
  const generarPDF = async () => {
    try {
      setGenerandoPDF(true);

      // Convertir el logo a base64 antes de generar el HTML
      const logoUrl = "/images/zeus.logooo.png";
      let logoBase64 = null;
      try {
        logoBase64 = await convertirImagenABase64(logoUrl);
      } catch (error) {
        console.warn("No se pudo cargar el logo, se usará un placeholder:", error);
      }

      const html = generarHTMLPlantilla(logoBase64);

      // Crear un elemento temporal para renderizar el HTML
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '850px';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.innerHTML = html;
      document.body.appendChild(tempDiv);

      // Esperar a que las imágenes se carguen (con timeout para evitar esperas infinitas)
      const images = tempDiv.querySelectorAll('img');
      await Promise.all(Array.from(images).map(img => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise(resolve => {
          const timeout = setTimeout(() => resolve(), 3000); // Timeout de 3 segundos
          img.onload = () => {
            clearTimeout(timeout);
            resolve();
          };
          img.onerror = () => {
            clearTimeout(timeout);
            resolve(); // Continuar aunque falle la imagen
          };
        });
      }));

      // Esperar un poco más para que todo se renderice
      await new Promise(resolve => setTimeout(resolve, 500));

      // Importar html2canvas y jsPDF dinámicamente
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      // Convertir el HTML a canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 850,
        height: tempDiv.scrollHeight,
        logging: false, // Desactivar logs de html2canvas
        onclone: (clonedDoc) => {
          // Asegurar que las imágenes se muestren correctamente en el clon
          const clonedImages = clonedDoc.querySelectorAll('img');
          clonedImages.forEach(img => {
            if (!img.complete || img.naturalWidth === 0) {
              // Si la imagen no se cargó, ocultarla o usar placeholder
              img.style.display = 'none';
            }
          });
        }
      });

      // Crear el PDF
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const pxToMm = 25.4 / 96;
      const imgWidthMm = (canvas.width * pxToMm) / 2;
      const imgHeightMm = (canvas.height * pxToMm) / 2;
      const ratio = Math.min((pdfWidth - 20) / imgWidthMm, (pdfHeight - 20) / imgHeightMm);

      pdf.addImage(canvas.toDataURL('image/png', 1.0), 'PNG', (pdfWidth - (imgWidthMm * ratio)) / 2, 10, imgWidthMm * ratio, imgHeightMm * ratio);

      // Generar blob y URL
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);

      // Limpiar el elemento temporal
      document.body.removeChild(tempDiv);

      setGenerandoPDF(false);
      return { blob, url };
    } catch (error) {
      console.error("Error al generar el PDF:", error);
      setGenerandoPDF(false);
      alert("Error al generar el PDF: " + error.message);
      return null;
    }
  };

  // Mostrar modal de previsualización
  const mostrarPrevisualizacion = () => {
    // 1. Validaciones previas
    if (
      !formData.numeroDespacho ||
      !formData.responsable ||
      !formData.fechaLlegada ||
      !formData.tipoCarga ||
      !formData.estado ||
      !formData.descripcionGeneral
    ) {
      alert("Por favor, complete todos los campos requeridos");
      return;
    }

    if (listaProductos.length === 0) {
      alert("Por favor, agregue al menos un producto en el detalle");
      return;
    }

    // Generar el HTML de la plantilla para previsualización
    // Intentar cargar el logo, pero si falla, continuar sin él
    const cargarPreview = async () => {
      try {
        const logoUrl = "/images/zeus.logooo.png";
        const logoBase64 = await convertirImagenABase64(logoUrl);
        const html = generarHTMLPlantilla(logoBase64);
        setPreviewHTML(html);
        setMostrarModalPreview(true);
      } catch (error) {
        // Si falla, generar sin logo
        const html = generarHTMLPlantilla(null);
        setPreviewHTML(html);
        setMostrarModalPreview(true);
      }
    };

    cargarPreview();
  };

  // Registrar importación después de generar el PDF
  const registrarImportacionConPDF = async () => {
    // Evitar descargas/registros múltiples
    if (generandoPDF || registroCompletado) return;

    try {
      setGenerandoPDF(true);

      // Generar el PDF
      const pdfResult = await generarPDF();

      if (!pdfResult) {
        alert("Error al generar el PDF. Por favor, intente nuevamente.");
        setGenerandoPDF(false);
        return;
      }

      const { blob } = pdfResult;

      // Disparar descarga local del PDF (una sola vez en este flujo)
      try {
        const urlDescarga = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = urlDescarga;
        link.download = `Ficha_Importacion_${formData.numeroDespacho || "sin_numero"}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(urlDescarga);
      } catch (e) {
        console.warn("No se pudo iniciar la descarga automática del PDF:", e);
      }

      const token = getAuthToken();
      if (!token) {
        alert("Sesión expirada. Por favor, inicie sesión nuevamente.");
        setGenerandoPDF(false);
        return;
      }

      // Crear FormData para enviar el archivo PDF
      const formDataToSend = new FormData();

      // Agregar el archivo PDF
      const nombreArchivo = `Ficha_Importacion_${formData.numeroDespacho}_${Date.now()}.pdf`;
      const archivoPDF = new File([blob], nombreArchivo, { type: 'application/pdf' });
      formDataToSend.append('archivo_pdf', archivoPDF);

      // Agregar los demás campos como texto
      formDataToSend.append('numero_despacho', formData.numeroDespacho);
      formDataToSend.append('tipo_carga', formData.tipoCarga);
      formDataToSend.append('responsable', formData.responsable);
      // Enviar fecha sin agregar hora para evitar problemas de zona horaria
      formDataToSend.append('fecha_registro', formData.fechaRegistro);
      formDataToSend.append('fecha_llegada_productos', formData.fechaLlegada);
      formDataToSend.append('estado_importacion', formData.estado);
      formDataToSend.append('productos', formData.descripcionGeneral);

      // Agregar detalles como JSON string
      const detalles = listaProductos.map((prod, index) => ({
        item: index + 1,
        producto: prod.producto,
        codigo: prod.codigo,
        unidad_medida: prod.unidadMedida,
        cantidad: parseInt(prod.cantidad)
      }));
      formDataToSend.append('detalles', JSON.stringify(detalles));

      // Guardar referencia en localStorage (solo metadata, no el archivo)
      try {
        const pdfKey = `pdf_ref_${Date.now()}`;
        localStorage.setItem(pdfKey, JSON.stringify({
          numeroDespacho: formData.numeroDespacho,
          timestamp: Date.now(),
          nombreArchivo: nombreArchivo
        }));
      } catch (e) {
        console.warn("No se pudo guardar la referencia en localStorage:", e);
        // Continuar de todas formas, no es crítico
      }

      try {
        // 3. Petición a la API con FormData
        const apiUrl = `https://importaciones2026-2946605267.us-central1.run.app?param_post=registro_completo_importacion`;

        console.log("Enviando datos a la API:", {
          url: apiUrl,
          method: 'POST',
          contentType: 'multipart/form-data (automático)'
        });

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
            // NO incluir 'Content-Type': el navegador lo establecerá automáticamente con el boundary para FormData
          },
          body: formDataToSend
        });

        const result = await response.json();

        if (response.ok) {
          // El backend devuelve {"message": "Registro exitoso", "url_archivo": "..."}
          if (result.message === "Registro exitoso" || result.status === "success") {
            alert("✅ Registro exitoso: Ficha e Importación guardadas correctamente.\nURL del PDF: " + (result.url_archivo || "N/A"));
            setRegistroCompletado(true);
            setMostrarModalPreview(false);
            router.push("/importacion");
          } else {
            throw new Error(result.error || result.message || "Error desconocido en el servidor");
          }
        } else {
          throw new Error(result.error || result.message || `Error ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        console.error("Error al registrar:", error);
        const errorMessage = error.message || "Error desconocido en el servidor";
        alert("❌ Error al registrar importación: " + errorMessage);
      } finally {
        setGenerandoPDF(false);
      }
    } catch (error) {
      console.error("Error al generar PDF:", error);
      alert("Error al generar el PDF: " + error.message);
      setGenerandoPDF(false);
    }
  };

  // Cerrar sugerencias al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sugerenciasRef.current && !sugerenciasRef.current.contains(event.target) &&
        productoInputRef.current && !productoInputRef.current.contains(event.target)) {
        setMostrarSugerencias(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${sidebarOpen ? "lg:ml-60 ml-0" : "ml-0"
          }`}
      >
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto custom-scrollbar" style={{ background: '#F7FAFF' }}>
          <div className="max-w-[95%] mx-auto px-4 py-4">
            {/* Botón Volver */}
            <button
              onClick={() => router.push("/importacion")}
              className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-lg font-medium hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm ripple-effect relative overflow-hidden text-sm group"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver a Importación</span>
            </button>

            {/* Card contenedor blanco */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">
              {/* Header */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#002D5A] to-[#002D5A] rounded-xl flex items-center justify-center text-white shadow-sm">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'var(--font-poppins)' }}>REGISTRO DE IMPORTACIONES</h1>
                    <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: 'var(--font-poppins)' }}>
                      Gestión y control de importaciones de productos
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center space-x-2 rounded-lg px-3 py-1.5 bg-green-50 border border-green-200">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-semibold text-green-700" style={{ fontFamily: 'var(--font-poppins)' }}>API Conectada</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* Información General */}
                <div className="bg-white rounded-xl border-2 border-gray-200 p-4 shadow-sm">
                  <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">i</span>
                    </div>
                    Información General
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                        Fecha de Registro <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          value={formData.fechaRegistro}
                          onChange={(e) => setFormData({ ...formData, fechaRegistro: e.target.value })}
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white transition-all duration-200 hover:border-blue-300"
                          style={{ fontFamily: 'var(--font-poppins)' }}
                          required
                        />
                        <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                        N° de Despacho <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.numeroDespacho}
                        onChange={(e) => setFormData({ ...formData, numeroDespacho: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white transition-all duration-200 hover:border-blue-300"
                        style={{ fontFamily: 'var(--font-poppins)' }}
                        required
                      />
                    </div>
                    <CustomCombobox
                      label="Responsable:"
                      value={formData.responsable}
                      onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                      placeholder="Seleccione un responsable"
                      options={[
                        { value: "", label: "Seleccione un responsable" },
                        { value: "HERVIN", label: "HERVIN" },
                        { value: "KIMBERLY", label: "KIMBERLY" },
                        { value: "YEIMI", label: "YEIMI" },
                      ]}
                    />
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                        Fecha de Llegada <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          value={formData.fechaLlegada}
                          onChange={(e) => setFormData({ ...formData, fechaLlegada: e.target.value })}
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white transition-all duration-200 hover:border-blue-300"
                          style={{ fontFamily: 'var(--font-poppins)' }}
                          required
                        />
                        <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                    <CustomCombobox
                      label="Tipo de carga:"
                      value={formData.tipoCarga}
                      onChange={(e) => setFormData({ ...formData, tipoCarga: e.target.value })}
                      placeholder="Seleccione el Tipo de Carga"
                      options={[
                        { value: "", label: "Seleccione el Tipo de Carga" },
                        { value: "1 CONTENEDOR 40 HQ", label: "1 CONTENEDOR 40 HQ" },
                        { value: "1 CONTENEDOR 40 NOR", label: "1 CONTENEDOR 40 NOR" },
                        { value: "1 CONTENEDOR 20 ST", label: "1 CONTENEDOR 20 ST" },
                        { value: "CONSOLIDADO", label: "CONSOLIDADO" },
                      ]}
                    />
                    <CustomCombobox
                      label="Estado:"
                      value={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                      placeholder="Seleccione un estado"
                      options={[
                        { value: "", label: "Seleccione un estado" },
                        { value: "PENDIENTE", label: "PENDIENTE" },
                        { value: "PRODUCCIÓN", label: "PRODUCCIÓN" },
                        { value: "TRANSITO", label: "TRANSITO" },
                        { value: "ETA", label: "ETA" },
                      ]}
                    />
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                      Descripción General de Productos <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.descripcionGeneral}
                      onChange={(e) => setFormData({ ...formData, descripcionGeneral: e.target.value })}
                      placeholder="Describa brevemente los productos que contiene esta importación..."
                      rows={3}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white resize-y transition-all duration-200 hover:border-blue-300"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                      required
                    />
                  </div>
                </div>

                {/* Header con API Conectada y Ver procedimiento */}
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#002D5A] to-[#002D5A] rounded-xl flex items-center justify-center text-white shadow-sm">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>Listado de incidencias y actas</h2>
                      <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: 'var(--font-poppins)' }}>
                        Control de incidencias asociadas a proformas y actas administrativas
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center space-x-2 rounded-lg px-3 py-1.5 bg-green-50 border border-green-200">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-semibold text-green-700" style={{ fontFamily: 'var(--font-poppins)' }}>API Conectada</span>
                    </div>
                  </div>
                </div>

                {/* Detalle de Productos */}
                <div className="bg-white rounded-xl border-2 border-gray-200 p-4 shadow-sm">
                  <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    Detalle de Productos
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="relative">
                      <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>Producto:</label>
                      <input
                        ref={productoInputRef}
                        type="text"
                        value={productoBusqueda}
                        onChange={handleProductoBusquedaChange}
                        onFocus={handleProductoFocus}
                        placeholder="Buscar producto..."
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white transition-all duration-200 hover:border-blue-300"
                        style={{ fontFamily: 'var(--font-poppins)' }}
                      />
                      {buscandoProductos && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>
                        </div>
                      )}
                      {mostrarSugerencias && sugerenciasProductos.length > 0 && (
                        <div
                          ref={sugerenciasRef}
                          className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                        >
                          {sugerenciasProductos.map((prod, index) => (
                            <button
                              key={prod.ID || prod.id || index}
                              type="button"
                              onClick={() => seleccionarProducto(prod)}
                              className="w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                              style={{ fontFamily: 'var(--font-poppins)' }}
                            >
                              <div className="text-sm font-medium text-gray-900">
                                {prod.NOMBRE || prod.nombre}
                              </div>
                              <div className="text-xs text-gray-500">
                                Código: {prod.CODIGO || prod.codigo}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>Código:</label>
                      <input
                        type="text"
                        value={codigoProducto}
                        readOnly
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-gray-100 text-sm text-gray-900 cursor-not-allowed"
                        style={{ fontFamily: 'var(--font-poppins)' }}
                      />
                    </div>
                    <CustomCombobox
                      label="Unidad de Medida:"
                      value={detalleProducto.unidadMedida}
                      onChange={(e) => setDetalleProducto({ ...detalleProducto, unidadMedida: e.target.value })}
                      placeholder="Seleccione..."
                      options={[
                        { value: "", label: "Seleccione..." },
                        { value: "UNIDAD", label: "UNIDAD" },
                        { value: "CAJA", label: "CAJA" },
                        { value: "DOCENA", label: "DOCENA" },
                        { value: "PAR", label: "PAR" },
                      ]}
                    />
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>Cantidad:</label>
                      <input
                        type="number"
                        value={detalleProducto.cantidad}
                        onChange={(e) => setDetalleProducto({ ...detalleProducto, cantidad: e.target.value })}
                        min="1"
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white transition-all duration-200 hover:border-blue-300"
                        style={{ fontFamily: 'var(--font-poppins)' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>Cantidad en Caja:</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={detalleProducto.cantidadCaja}
                          onChange={(e) => setDetalleProducto({ ...detalleProducto, cantidadCaja: e.target.value })}
                          min="0"
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white transition-all duration-200 hover:border-blue-300"
                          style={{ fontFamily: 'var(--font-poppins)' }}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2" style={{ color: 'transparent' }}>.</label>
                      <button
                        onClick={agregarProductoALista}
                        className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-br from-[#002D5A] to-[#002D5A] hover:from-blue-800 hover:to-blue-900 text-white rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105 active:scale-[0.98] text-sm"
                        style={{ fontFamily: 'var(--font-poppins)' }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>Agregar a la Lista</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tabla de Productos */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-blue-700 border-b-2 border-blue-800">
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">N°</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">PRODUCTO</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">CÓDIGO</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">UNIDAD DE MEDIDA</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">CANTIDAD</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">CANTIDAD EN CAJA</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ACCIONES</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {listaProductos.length === 0 ? (
                          <>

                          </>
                        ) : (
                          listaProductos.map((producto, index) => {
                            const isEditing = editingProductoId === producto.id;
                            const displayProd = isEditing ? editingProducto : producto;
                            
                            return (
                              <tr key={producto.id} className={`hover:bg-slate-200 transition-colors ${isEditing ? 'bg-blue-50' : ''}`}>
                                {/* N° */}
                                <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{index + 1}</td>
                                
                                {/* PRODUCTO */}
                                <td className="px-3 py-2 whitespace-nowrap">
                                  {isEditing ? (
                                    <div className="relative" ref={productoEdicionRef}>
                                      <input
                                        type="text"
                                        placeholder="Buscar producto..."
                                        value={busquedaProductoEdicion}
                                        onChange={(e) => {
                                          const nuevoValor = e.target.value;
                                          setBusquedaProductoEdicion(nuevoValor);
                                          setEditingProducto(prev => ({ ...prev, producto: nuevoValor }));
                                          
                                          if (!productosCargados && todosLosProductos.length === 0) {
                                            cargarTodosLosProductos().then(() => {
                                              if (nuevoValor.length > 0) {
                                                setMostrarSugerenciasProductoEdicion(true);
                                              }
                                            });
                                          } else {
                                            setMostrarSugerenciasProductoEdicion(nuevoValor.length > 0);
                                          }
                                        }}
                                        onFocus={() => {
                                          if (!productosCargados && todosLosProductos.length === 0) {
                                            cargarTodosLosProductos();
                                          }
                                        }}
                                        className="w-full px-2 py-1 border-2 border-blue-300 rounded-lg text-[10px] font-medium text-gray-900 focus:border-blue-500 outline-none"
                                      />
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-gray-700">{producto.producto}</span>
                                  )}
                                </td>
                                
                                {/* CÓDIGO - Solo lectura, se actualiza automáticamente */}
                                <td className="px-3 py-2 whitespace-nowrap">
                                  <span className="text-[10px] text-gray-700">{displayProd.codigo || ''}</span>
                                </td>
                                
                                {/* UNIDAD DE MEDIDA */}
                                <td className="px-3 py-2 whitespace-nowrap">
                                  {isEditing ? (
                                    <select
                                      value={displayProd.unidadMedida || ''}
                                      onChange={(e) => setEditingProducto({ ...editingProducto, unidadMedida: e.target.value })}
                                      className="w-full px-2 py-1 border-2 border-blue-300 rounded-lg text-[10px] font-medium text-gray-900 focus:border-blue-500 outline-none"
                                    >
                                      <option value="">Seleccione...</option>
                                      <option value="DOCENAS">DOCENAS</option>
                                      <option value="UNIDADES">UNIDADES</option>
                                      <option value="PARES">PARES</option>
                                      <option value="PAQUETES">PAQUETES</option>
                                      <option value="ROLLOS">ROLLOS</option>
                                      <option value="METROS">METROS</option>
                                    </select>
                                  ) : (
                                    <span className="text-[10px] text-gray-700">{producto.unidadMedida}</span>
                                  )}
                                </td>
                                
                                {/* CANTIDAD */}
                                <td className="px-3 py-2 whitespace-nowrap">
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      value={displayProd.cantidad || ''}
                                      onChange={(e) => setEditingProducto({ ...editingProducto, cantidad: e.target.value })}
                                      className="w-full px-2 py-1 border-2 border-blue-300 rounded-lg text-[10px] font-medium text-gray-900 focus:border-blue-500 outline-none"
                                    />
                                  ) : (
                                    <span className="text-[10px] text-gray-700">{producto.cantidad}</span>
                                  )}
                                </td>
                                
                                {/* CANTIDAD EN CAJA */}
                                <td className="px-3 py-2 whitespace-nowrap">
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      value={displayProd.cantidadCaja || ''}
                                      onChange={(e) => setEditingProducto({ ...editingProducto, cantidadCaja: e.target.value })}
                                      className="w-full px-2 py-1 border-2 border-blue-300 rounded-lg text-[10px] font-medium text-gray-900 focus:border-blue-500 outline-none"
                                    />
                                  ) : (
                                    <span className="text-[10px] text-gray-700">{producto.cantidadCaja || "-"}</span>
                                  )}
                                </td>
                                
                                {/* ACCIONES */}
                                <td className="px-3 py-2 whitespace-nowrap">
                                  <div className="flex items-center justify-center gap-2">
                                    {isEditing ? (
                                      <>
                                        <button
                                          onClick={guardarEdicionProducto}
                                          className="w-8 h-8 flex items-center justify-center bg-green-50 text-green-600 hover:bg-green-500 hover:text-white rounded-lg transition-all"
                                          title="Guardar cambios"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                          </svg>
                                        </button>
                                        <button
                                          onClick={cancelarEdicionProducto}
                                          className="w-8 h-8 flex items-center justify-center bg-gray-50 text-gray-600 hover:bg-gray-500 hover:text-white rounded-lg transition-all"
                                          title="Cancelar edición"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                          </svg>
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button
                                          onClick={() => iniciarEdicionProducto(producto)}
                                          className="w-8 h-8 flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white rounded-lg transition-all"
                                          title="Editar"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                          </svg>
                                        </button>
                                        <button
                                          onClick={() => confirmarEliminarProducto(producto.id)}
                                          className="flex items-center space-x-1 px-2.5 py-1 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                          title="Eliminar"
                                        >
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                          </svg>
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Botón Registrar */}
                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button
                    onClick={mostrarPrevisualizacion}
                    className="flex items-center space-x-1.5 px-6 py-2.5 bg-gradient-to-br from-[#002D5A] to-[#002D5A] hover:from-blue-800 hover:to-blue-900 text-white rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105 active:scale-[0.98] text-sm"
                    style={{ fontFamily: 'var(--font-poppins)' }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Registrar Importación</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal de Previsualización del PDF */}
      <Modal
        isOpen={mostrarModalPreview}
        onClose={() => setMostrarModalPreview(false)}
        title="Previsualización de Ficha de Importación"
        size="full"
        primaryButtonText={generandoPDF ? "Generando PDF..." : "Registrar"}
        secondaryButtonText="Cancelar"
        onPrimaryButtonClick={registrarImportacionConPDF}
        onSecondaryButtonClick={() => setMostrarModalPreview(false)}
        primaryButtonDisabled={generandoPDF || registroCompletado}
        primaryButtonLoading={generandoPDF}
        hideFooter={false}
      >
        <div className="w-full h-full flex flex-col">
          <div className="flex-1 overflow-auto bg-gray-100 p-4 flex justify-center">
            {previewHTML && (
              <iframe
                srcDoc={previewHTML}
                className="bg-white shadow-lg border border-gray-300"
                style={{
                  width: '850px',
                  minHeight: '1100px',
                  transform: 'scale(0.75)',
                  transformOrigin: 'top center',
                  border: 'none'
                }}
                title="Previsualización PDF"
              />
            )}
          </div>
          <div className="bg-blue-50 border-t border-blue-200 p-4">
            <p className="text-sm text-gray-700 text-center" style={{ fontFamily: 'var(--font-poppins)' }}>
              <strong>Nota:</strong> Esta es una previsualización del PDF que se generará.
              Al hacer clic en "Registrar", se generará el PDF y se guardará la importación en la base de datos.
            </p>
          </div>
        </div>
      </Modal>

      {/* Dropdown de Productos en Edición - Renderizado fuera de la tabla */}
      {editingProductoId && mostrarSugerenciasProductoEdicion && busquedaProductoEdicion.length > 0 && productoEdicionRef.current && dropdownPosition.width > 0 && (
        <div 
          ref={dropdownRef}
          className="fixed z-[9999] bg-white border-2 border-blue-300 rounded-lg shadow-2xl max-h-48 overflow-y-auto"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            position: 'fixed'
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {todosLosProductos.filter(p => {
            const nombre = (p.NOMBRE || p.nombre || "").toLowerCase();
            const codigo = (p.CODIGO || p.codigo || "").toLowerCase();
            const busqueda = busquedaProductoEdicion.toLowerCase();
            return nombre.includes(busqueda) || codigo.includes(busqueda);
          }).map((prod, idx) => (
            <div 
              key={idx} 
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleProductoSelectEdicion(prod);
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleProductoSelectEdicion(prod);
              }}
              className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm font-bold text-gray-700 border-b border-gray-50 last:border-0 transition-colors"
            >
              {prod.NOMBRE || prod.nombre}
            </div>
          ))}
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/60 bg-gradient-to-r from-red-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center text-white shadow-sm">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                  ¿Estás seguro de eliminar?
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setProductoToDelete(null);
                }}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Contenido */}
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-6" style={{ fontFamily: 'var(--font-poppins)' }}>
                Esta acción no se puede deshacer. El producto será eliminado permanentemente de la lista.
              </p>
              
              {/* Botones */}
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setProductoToDelete(null);
                  }}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all"
                  style={{ fontFamily: 'var(--font-poppins)' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={eliminarProducto}
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all"
                  style={{ fontFamily: 'var(--font-poppins)' }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}