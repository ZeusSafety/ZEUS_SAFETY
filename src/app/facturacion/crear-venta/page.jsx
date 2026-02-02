"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/context/AuthContext";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";

// Componente de Select personalizado
const CustomSelect = ({ name, value, onChange, options, placeholder, required, label, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const selectRef = useRef(null);
  const buttonRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value);

  const handleSelect = (optionValue) => {
    if (disabled) return;
    onChange({ target: { name, value: optionValue } });
    setIsOpen(false);
  };

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = 240;
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
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`w-full px-4 py-2.5 border-2 rounded-lg transition-all duration-200 text-sm flex items-center justify-between ${disabled
          ? 'border-gray-300 bg-gray-100 text-gray-600 cursor-not-allowed'
          : `border-gray-300 bg-white text-gray-900 hover:border-gray-400 focus:ring-2 focus:ring-[#002D5A] focus:border-[#002D5A] ${isOpen ? 'ring-2 ring-[#002D5A] border-[#002D5A]' : ''
          }`
          }`}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`w-5 h-5 transition-transform duration-200 ${disabled
            ? 'text-gray-400'
            : `text-gray-400 ${isOpen ? (openUpward ? '' : 'transform rotate-180') : ''}`
            }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && !disabled && (
        <div
          className={`absolute z-50 w-full bg-white shadow-xl overflow-hidden ${openUpward ? 'bottom-full mb-2' : 'top-full mt-2'
            }`}
          style={{
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div className="max-h-60 overflow-y-auto custom-scrollbar p-1.5">
            {options.map((option, index) => (
              <button
                key={`${option.value}-${index}-${option.id || ''}`}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full text-left px-4 py-3 transition-all duration-150 ${value === option.value
                  ? 'bg-[#002D5A]/10 text-[#002D5A] font-semibold'
                  : 'text-gray-900 hover:bg-gray-50'
                  }`}
                style={{ borderRadius: '0.375rem' }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <input type="hidden" name={name} value={value || ''} required={required} />
    </div>
  );
};

// Helper para redondeo SUNAT (Midpoint Rounding)
const roundSUNAT = (num, decimals = 2) => {
  const factor = Math.pow(10, decimals);
  return Math.round((num + Number.EPSILON) * factor) / factor;
};

// Formateador de moneda
const formatMoney = (amount) => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2
  }).format(amount).replace('PEN', 'S/');
};

// Componente de sugerencias para búsqueda
const SuggestionsList = ({ suggestions, onSelect, show, position = "bottom" }) => {
  if (!show || !suggestions || suggestions.length === 0) return null;

  return (
    <div
      className={`absolute z-50 w-full bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto ${position === "top" ? "bottom-full mb-2" : "top-full mt-2"
        }`}
    >
      {suggestions.map((item, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onSelect(item)}
          className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
        >
          <div className="font-semibold text-gray-900">{item.label}</div>
          {item.subtitle && (
            <div className="text-xs text-gray-500 mt-1">{item.subtitle}</div>
          )}
        </button>
      ))}
    </div>
  );
};

export default function CrearVentaPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [apiConectada, setApiConectada] = useState(false);

  // Estado del formulario - Cabecera del Pedido
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    asesor: "",
    clasificacion: "",
    cliente: "",
    clienteId: null,
    comprobante: "FACTURA",
    comprobanteNumero: "",
    salidaPedido: "",
    region: "",
    regionId: null,
    distrito: "",
    distritoId: null,
    lugar: "",
    lugarId: null,
    observaciones: "",
  });

  // Estado para productos
  const [productos, setProductos] = useState([]);
  const [nuevoProducto, setNuevoProducto] = useState({
    producto: "",
    codigo: "",
    cantidad: 1,
    precioVenta: "", // Valor Unitario (sin IGV)
    subtotalBase: "", // Subtotal de la línea (Base Gravada, sin IGV)
  });

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
  const todosLosProductos = useRef([]);

  // Estados para opciones de combos
  const [opcionesAsesor, setOpcionesAsesor] = useState([]);
  const [opcionesClasificacion, setOpcionesClasificacion] = useState([]);
  const [opcionesSalidaPedido, setOpcionesSalidaPedido] = useState([]);
  const [opcionesRegion, setOpcionesRegion] = useState([]);
  const [opcionesDistrito, setOpcionesDistrito] = useState([]);
  const [opcionesLugar, setOpcionesLugar] = useState([]);

  // Estados para búsqueda de clientes
  const [sugerenciasClientes, setSugerenciasClientes] = useState([]);
  const [mostrarSugerenciasClientes, setMostrarSugerenciasClientes] = useState(false);
  const clienteSearchTimeout = useRef(null);
  const clienteInputRef = useRef(null);

  // Estados para búsqueda de productos
  const [sugerenciasProductos, setSugerenciasProductos] = useState([]);
  const [mostrarSugerenciasProductos, setMostrarSugerenciasProductos] = useState(false);
  const [productosData, setProductosData] = useState({});
  const productoSearchTimeout = useRef(null);
  const productoInputRef = useRef(null);

  // Referencias para inputs
  const clienteSuggestionsRef = useRef(null);
  const productoSuggestionsRef = useRef(null);

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

  // Cargar datos iniciales
  useEffect(() => {
    if (user) {
      cargarConfiguracion();
      cargarProductosDesdeAPI();
      cargarRegiones();
    }
  }, [user]);

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
        if (productoSuggestionsRef.current && !productoSuggestionsRef.current.contains(event.target)) {
          setMostrarSugerenciasProductos(false);
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

  // Cargar configuración desde API
  const cargarConfiguracion = async () => {
    try {
      setApiConectada(false);
      const api = "https://productoscrud-2946605267.us-central1.run.app";
      const metodo = "configuracion_general";
      const response = await fetch(`${api}?metodo=${metodo}`);

      if (response.status === 200) {
        const data = await response.json();

        // Filtrar por categoría
        const asesores = data.filter(item => item.CATEGORIA === 'ASESOR');
        const clasificaciones = data.filter(item => item.CATEGORIA === 'CLASIFICACION');
        const salidasPedido = data.filter(item => item.CATEGORIA === 'SALIDA_PEDIDO');

        setOpcionesAsesor(asesores.map(item => ({ value: item.NOMBRE, label: item.NOMBRE })));
        setOpcionesClasificacion(clasificaciones.map(item => ({ value: item.NOMBRE, label: item.NOMBRE })));
        setOpcionesSalidaPedido(salidasPedido.map(item => ({ value: item.NOMBRE, label: item.NOMBRE })));

        setApiConectada(true);
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
      setApiConectada(false);
    }
  };

  // Cargar regiones desde API
  const cargarRegiones = async () => {
    try {
      const response = await fetch('https://configmarketing-2946605267.us-central1.run.app/regiones');
      if (response.ok) {
        const apiResponse = await response.json();
        const regiones = Array.isArray(apiResponse.data) ? apiResponse.data : [];

        // Usar un Map para eliminar duplicados basados en el valor
        const regionesUnicas = new Map();
        regiones.forEach(item => {
          if (item.REGION && !regionesUnicas.has(item.REGION)) {
            regionesUnicas.set(item.REGION, {
              value: item.REGION,
              label: item.REGION,
              id: item.ID
            });
          }
        });

        setOpcionesRegion(Array.from(regionesUnicas.values()));

        // Seleccionar Lima por defecto si existe
        const limaOption = Array.from(regionesUnicas.values()).find(r => r.value.toLowerCase() === 'lima');
        if (limaOption) {
          setFormData(prev => ({
            ...prev,
            region: limaOption.value,
            regionId: limaOption.id
          }));
          cargarDistritos(limaOption.id);
        }
      }
    } catch (error) {
      console.error('Error cargando regiones:', error);
    }
  };

  // Cargar distritos según región
  const cargarDistritos = async (regionId) => {
    try {
      if (!regionId) {
        setOpcionesDistrito([]);
        setFormData(prev => ({ ...prev, distrito: "", distritoId: null }));
        return;
      }

      const idRegionFormateado = "RE_" + String(regionId).padStart(2, '0');
      const response = await fetch(`https://configmarketing-2946605267.us-central1.run.app/distritos?id_region=${idRegionFormateado}`);

      if (response.ok) {
        const apiResponse = await response.json();
        const distritos = Array.isArray(apiResponse.data) ? apiResponse.data : [];

        // Usar un Map para eliminar duplicados basados en el valor
        const distritosUnicos = new Map();
        distritos.forEach(item => {
          if (item.DISTRITO && !distritosUnicos.has(item.DISTRITO)) {
            distritosUnicos.set(item.DISTRITO, {
              value: item.DISTRITO,
              label: item.DISTRITO,
              id: item.ID
            });
          }
        });

        setOpcionesDistrito(Array.from(distritosUnicos.values()));
      }
    } catch (error) {
      console.error('Error cargando distritos:', error);
    }
  };

  // Cargar lugares desde API
  const cargarLugares = async () => {
    try {
      const api = "https://crudventas-2946605267.us-central1.run.app";
      const area = "configuracion_ventas";
      const tipo = "LUGAR";
      const response = await fetch(`${api}?area=${area}&tipo=${tipo}`);

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          // Usar un Map para eliminar duplicados basados en el valor
          const lugaresUnicos = new Map();
          data.forEach(item => {
            if (item.LUGAR && !lugaresUnicos.has(item.LUGAR)) {
              lugaresUnicos.set(item.LUGAR, {
                value: item.LUGAR,
                label: item.LUGAR,
                id: item.ID
              });
            }
          });
          setOpcionesLugar(Array.from(lugaresUnicos.values()));
        }
      }
    } catch (error) {
      console.error('Error cargando lugares:', error);
    }
  };

  // Cargar productos desde API
  const cargarProductosDesdeAPI = async () => {
    try {
      const api = "https://productoscrud-2946605267.us-central1.run.app";
      const response = await fetch(api);

      if (response.ok) {
        const data = await response.json();
        const productosMap = {};

        // Guardar también la lista completa de productos para el buscador de edición
        todosLosProductos.current = data.filter(p => p.NOMBRE && p.CODIGO);

        data.forEach(producto => {
          if (producto.NOMBRE && producto.CODIGO) {
            productosMap[producto.NOMBRE] = producto.CODIGO;
          }
        });

        setProductosData(productosMap);
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
    }
  };

  // Búsqueda de clientes
  const buscarClientes = (texto) => {
    if (clienteSearchTimeout.current) {
      clearTimeout(clienteSearchTimeout.current);
    }

    if (!texto || texto.trim().length === 0) {
      setSugerenciasClientes([]);
      setMostrarSugerenciasClientes(false);
      return;
    }

    clienteSearchTimeout.current = setTimeout(async () => {
      try {
        const api = "https://productoscrud-2946605267.us-central1.run.app";
        const metodo = "cliente_busqueda";
        const cliente = texto.trim();
        const response = await fetch(`${api}?metodo=${metodo}&cliente=${encodeURIComponent(cliente)}`);

        if (response.ok) {
          const data = await response.json();
          const sugerencias = (Array.isArray(data) ? data : []).slice(0, 10).map(item => ({
            label: item.CLIENTE,
            subtitle: `ID: ${item.ID_CLIENTE}`,
            id: item.ID_CLIENTE,
            nombre: item.CLIENTE
          }));

          setSugerenciasClientes(sugerencias);
          setMostrarSugerenciasClientes(sugerencias.length > 0);
        }
      } catch (error) {
        console.error('Error buscando clientes:', error);
      }
    }, 300);
  };

  // Búsqueda de productos
  const buscarProductos = (texto) => {
    if (productoSearchTimeout.current) {
      clearTimeout(productoSearchTimeout.current);
    }

    if (!texto || texto.trim().length === 0) {
      setSugerenciasProductos([]);
      setMostrarSugerenciasProductos(false);
      return;
    }

    productoSearchTimeout.current = setTimeout(() => {
      const textoLower = texto.toLowerCase();
      const sugerencias = Object.keys(productosData)
        .filter(producto => producto.toLowerCase().includes(textoLower))
        .slice(0, 10)
        .map(producto => ({
          label: producto,
          subtitle: `Código: ${productosData[producto]}`,
          nombre: producto,
          codigo: productosData[producto]
        }));

      setSugerenciasProductos(sugerencias);
      setMostrarSugerenciasProductos(sugerencias.length > 0);
    }, 300);
  };

  // Seleccionar cliente
  const seleccionarCliente = (cliente) => {
    setFormData(prev => ({
      ...prev,
      cliente: cliente.nombre,
      clienteId: cliente.id
    }));
    setMostrarSugerenciasClientes(false);
  };

  // Seleccionar producto
  const seleccionarProducto = (producto) => {
    setNuevoProducto(prev => ({
      ...prev,
      producto: producto.nombre,
      codigo: producto.codigo
    }));
    setMostrarSugerenciasProductos(false);
    // Enfocar en cantidad
    setTimeout(() => {
      const cantidadInput = document.querySelector('input[name="cantidad"]');
      if (cantidadInput) cantidadInput.focus();
    }, 100);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "cliente") {
      setFormData(prev => ({ ...prev, cliente: value, clienteId: null }));
      buscarClientes(value);
      setMostrarSugerenciasClientes(true);
    } else if (name === "region") {
      const regionOption = opcionesRegion.find(r => r.value === value);
      setFormData(prev => ({
        ...prev,
        region: value,
        regionId: regionOption?.id || null,
        distrito: "",
        distritoId: null,
        lugar: "",
        lugarId: null
      }));
      // Limpiar distritos y lugares cuando cambia la región
      setOpcionesDistrito([]);
      setOpcionesLugar([]);
      if (regionOption) {
        cargarDistritos(regionOption.id);
      }
    } else if (name === "distrito") {
      const distritoOption = opcionesDistrito.find(d => d.value === value);
      setFormData(prev => ({
        ...prev,
        distrito: value,
        distritoId: distritoOption?.id || null,
        lugar: "",
        lugarId: null
      }));
      // Limpiar lugares cuando cambia el distrito
      setOpcionesLugar([]);
      // Cargar lugares cuando se selecciona un distrito
      if (distritoOption) {
        cargarLugares();
      }
    } else if (name === "lugar") {
      const lugarOption = opcionesLugar.find(l => l.value === value);
      setFormData(prev => ({
        ...prev,
        lugar: value,
        lugarId: lugarOption?.id || null
      }));
    } else if (name === "comprobante") {
      setFormData(prev => ({
        ...prev,
        comprobante: value,
        comprobanteNumero: value === "FACTURA" ? "F " : value === "BOLETA" ? "B " : "P "
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleProductoChange = (e) => {
    const { name, value } = e.target;
    const val = value === "" ? "" : value;

    setNuevoProducto(prev => {
      let updated = { ...prev, [name]: val };

      if (name === "producto") {
        updated.codigo = "";
        buscarProductos(val);
        setMostrarSugerenciasProductos(true);
      }

      const qty = parseFloat(updated.cantidad) || 0;

      if (name === "cantidad" || name === "precioVenta") {
        // Calcular Subtotal Base (sin IGV) desde el Unitario (sin IGV)
        const unitPrice = parseFloat(updated.precioVenta) || 0;
        if (qty > 0 && unitPrice >= 0) {
          const subtotalItem = qty * unitPrice;
          updated.subtotalBase = subtotalItem.toFixed(2);
        } else {
          updated.subtotalBase = "";
        }
      } else if (name === "subtotalBase") {
        // Calcular Unitario (sin IGV) desde el Subtotal Base (bidireccional)
        const subtotalItem = parseFloat(val) || 0;
        if (qty > 0 && subtotalItem >= 0) {
          const unitPrice = subtotalItem / qty;
          // Guardamos con alta precisión para SUNAT
          updated.precioVenta = unitPrice.toFixed(6);
        } else {
          updated.precioVenta = "";
        }
      }

      return updated;
    });
  };

  const calcularTotalesFinales = () => {
    let gravada = 0;
    let totalIgv = 0;
    let importeTotal = 0;

    productos.forEach(p => {
      const qty = parseFloat(p.cantidad) || 0;
      const unitVal = parseFloat(p.precioVenta) || 0;

      const baseRaw = qty * unitVal;
      const baseLine = roundSUNAT(baseRaw);
      const igvLine = roundSUNAT(baseLine * 0.18);
      const totalLine = roundSUNAT(baseLine + igvLine);

      gravada += baseLine;
      totalIgv += igvLine;
      importeTotal += totalLine;
    });

    return {
      gravada: gravada.toFixed(2),
      igv: totalIgv.toFixed(2),
      total: importeTotal.toFixed(2)
    };
  };

  const agregarProducto = () => {
    if (!nuevoProducto.producto || !nuevoProducto.codigo || !nuevoProducto.precioVenta) {
      return;
    }

    const qty = parseFloat(nuevoProducto.cantidad) || 0;
    const unitPrice = parseFloat(nuevoProducto.precioVenta) || 0;

    // Validar que el cálculo sea consistente antes de agregar
    const base = roundSUNAT(qty * unitPrice);
    const igv = roundSUNAT(base * 0.18);
    const total = roundSUNAT(base + igv);

    const producto = {
      id: Date.now(),
      ...nuevoProducto,
      precioVenta: unitPrice, // Se guarda el unitario con su precisión (4-6 dec)
      cantidad: qty,
      subtotal: base,
      igv: igv,
      total: total
    };

    setProductos([...productos, producto]);
    setNuevoProducto({
      producto: "",
      codigo: "",
      cantidad: 1,
      precioVenta: "",
      subtotalBase: ""
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
    if (!editingProducto.producto || !editingProducto.precioVenta || !editingProducto.cantidad) {
      alert("Campos incompletos.");
      return;
    }

    // Actualizar el producto en la lista
    setProductos(productos.map(item =>
      item.id === editingProductoId
        ? {
          ...editingProducto,
          codigo: editingProducto.codigo || item.codigo || "",
          precioVenta: parseFloat(editingProducto.precioVenta),
          cantidad: parseFloat(editingProducto.cantidad)
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

  const eliminarProducto = () => {
    if (productoToDelete) {
      setProductos(productos.filter((p) => p.id !== productoToDelete));
      setShowDeleteModal(false);
      setProductoToDelete(null);
    }
  };

  const limpiarFormulario = () => {
    setFormData({
      fecha: new Date().toISOString().split('T')[0],
      asesor: "",
      clasificacion: "",
      cliente: "",
      clienteId: null,
      comprobante: "FACTURA",
      comprobanteNumero: "F ",
      salidaPedido: "",
      region: "",
      regionId: null,
      distrito: "",
      distritoId: null,
      lugar: "",
      lugarId: null,
      observaciones: "",
    });
    setProductos([]);
    setNuevoProducto({
      producto: "",
      codigo: "",
      cantidad: 1,
      precioVenta: "",
      subtotalBase: ""
    });
    setSugerenciasClientes([]);
    setSugerenciasProductos([]);
  };

  const guardarVenta = async () => {
    try {
      if (!user) {
        alert("No estás autenticado. Por favor, inicia sesión nuevamente.");
        router.push("/login");
        return;
      }

      if (!formData.clienteId) {
        alert("Por favor seleccione un cliente de la lista de sugerencias.");
        return;
      }

      if (productos.length === 0) {
        alert("Debe agregar al menos un producto antes de guardar la venta.");
        return;
      }

      const detalle = productos.map(producto => {
        const qty = parseFloat(producto.cantidad) || 0;
        const unitVal = parseFloat(producto.precioVenta) || 0;
        const subtotalBase = roundSUNAT(qty * unitVal);
        const igv = roundSUNAT(subtotalBase * 0.18);
        const total = roundSUNAT(subtotalBase + igv);

        return {
          N_COMPROBANTE: formData.comprobanteNumero.trim(),
          CODIGO: producto.codigo,
          PRODUCTO: producto.producto,
          CANTIDAD: producto.cantidad.toString(),
          PRECIO_VENTA: unitVal.toFixed(6), // Valor Unitario sin IGV (6 decimales)
          TOTAL_CON_IGV: total.toFixed(2),  // Total con IGV (2 decimales)
          BASE_GRAVADA: subtotalBase.toFixed(2), // Subtotal (2 decimales)
          IGV: igv.toFixed(2)
        };
      });

      const datosVenta = {
        id_cliente: formData.clienteId ? formData.clienteId.toString() : "",
        cliente: formData.cliente, // Enviar nombre cliente por si acaso
        fecha: formData.fecha,
        clasificacion: formData.clasificacion,
        asesor: formData.asesor,
        n_comprobante: formData.comprobanteNumero.trim(),
        comprobante: formData.comprobante, // Tipo de comprobante
        id_region: formData.regionId ? formData.regionId.toString() : "",
        id_distrito: formData.distritoId ? formData.distritoId.toString() : "",
        id_lugar: formData.lugarId ? formData.lugarId.toString() : "",
        salida_de_pedido: formData.salidaPedido,
        observacion: formData.observaciones || "",
        // Agregamos totales de cabecera
        total_gravada: calcularTotalesFinales().gravada,
        total_igv: calcularTotalesFinales().igv,
        importe_total: calcularTotalesFinales().total,
        usuario_registro: user.email || "sistema",
        detalle: detalle.map(d => ({
          ...d,
          TOTAL: d.TOTAL_CON_IGV // Compatibilidad
        }))
      };

      const api = "https://crudventas-2946605267.us-central1.run.app";
      const metodo = "insertar_venta";

      const response = await fetch(`${api}?metodo=${metodo}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosVenta)
      });

      if (response.ok || response.status === 200 || response.status === 201) {
        alert('¡Venta guardada exitosamente!');
        limpiarFormulario();
        // Incrementar número de comprobante
        const currentNumber = parseInt(formData.comprobanteNumero.replace(/[^0-9]/g, '')) || 0;
        setFormData(prev => ({
          ...prev,
          comprobanteNumero: prev.comprobante === "FACTURA" ? `F ${currentNumber + 1}` :
            prev.comprobante === "BOLETA" ? `B ${currentNumber + 1}` :
              `P ${currentNumber + 1}`
        }));
      } else {
        const errorData = await response.text();
        console.error('Error:', errorData);
        alert('Error al guardar la venta. Por favor intente nuevamente.');
      }
    } catch (error) {
      console.error('Error al guardar la venta:', error);
      alert('Error de conexión. Por favor intente nuevamente.');
    }
  };

  // Cargar lugares cuando se selecciona un distrito
  useEffect(() => {
    if (formData.distrito && formData.distritoId) {
      cargarLugares();
    }
  }, [formData.distrito, formData.distritoId]);

  // Manejar clicks fuera de las sugerencias
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (clienteSuggestionsRef.current && !clienteSuggestionsRef.current.contains(event.target) &&
        clienteInputRef.current && !clienteInputRef.current.contains(event.target)) {
        setMostrarSugerenciasClientes(false);
      }
      if (productoSuggestionsRef.current && !productoSuggestionsRef.current.contains(event.target) &&
        productoInputRef.current && !productoInputRef.current.contains(event.target)) {
        setMostrarSugerenciasProductos(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const opcionesComprobante = [
    { value: "FACTURA", label: "FACTURA" },
    { value: "BOLETA", label: "BOLETA" },
    { value: "PROFORMA", label: "PROFORMA" },
  ];

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
              onClick={() => router.push("/facturacion")}
              className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-lg font-medium hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm ripple-effect relative overflow-hidden text-sm group"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver a Facturación</span>
            </button>

            {/* Card contenedor principal */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#002D5A] to-[#002D5A] rounded-xl flex items-center justify-center text-white shadow-sm">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Registrar Venta</h1>
                      <p className="text-sm text-gray-600 font-medium mt-0.5">Crear nueva venta en el sistema</p>
                    </div>
                  </div>
                  {apiConectada && (
                    <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-green-50 border border-green-300 rounded-lg">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-xs sm:text-sm font-semibold text-green-700">API Conectada</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 1: Cabecera del Pedido */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200/60 p-6 mb-6">
                <div className="flex items-center mb-4 p-3 bg-gradient-to-r from-[#002D5A] to-[#002D5A] rounded-lg">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <h2 className="text-lg font-bold text-white">Cabecera del Pedido</h2>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Fecha */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Fecha
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        name="fecha"
                        value={formData.fecha}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002D5A] focus:border-[#002D5A] transition-all text-sm text-gray-900"
                      />
                    </div>
                  </div>

                  {/* Asesor */}
                  <div>
                    <CustomSelect
                      name="asesor"
                      value={formData.asesor}
                      onChange={handleInputChange}
                      options={opcionesAsesor}
                      placeholder="Seleccione un asesor"
                      label="Asesor"
                      required
                    />
                  </div>

                  {/* Clasificación */}
                  <div>
                    <CustomSelect
                      name="clasificacion"
                      value={formData.clasificacion}
                      onChange={handleInputChange}
                      options={opcionesClasificacion}
                      placeholder="Seleccione una clasificación"
                      label="Clasificación"
                    />
                  </div>

                  {/* Cliente */}
                  <div className="relative">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Cliente
                    </label>
                    <input
                      ref={clienteInputRef}
                      type="text"
                      name="cliente"
                      value={formData.cliente}
                      onChange={handleInputChange}
                      onFocus={() => {
                        if (formData.cliente) buscarClientes(formData.cliente);
                      }}
                      placeholder="Ingrese el nombre del cliente"
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002D5A] focus:border-[#002D5A] transition-all text-sm text-gray-900 placeholder:text-gray-400"
                      required
                    />
                    <div ref={clienteSuggestionsRef} className="relative">
                      <SuggestionsList
                        suggestions={sugerenciasClientes}
                        onSelect={seleccionarCliente}
                        show={mostrarSugerenciasClientes}
                      />
                    </div>
                  </div>

                  {/* Comprobante */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Comprobante
                    </label>
                    <div className="flex space-x-2">
                      <div className="flex-1">
                        <CustomSelect
                          name="comprobante"
                          value={formData.comprobante}
                          onChange={handleInputChange}
                          options={opcionesComprobante}
                          placeholder="Seleccione"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          name="comprobanteNumero"
                          value={formData.comprobanteNumero}
                          onChange={handleInputChange}
                          placeholder="Número"
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002D5A] focus:border-[#002D5A] transition-all text-sm text-gray-900"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Salida de Pedido */}
                  <div>
                    <CustomSelect
                      name="salidaPedido"
                      value={formData.salidaPedido}
                      onChange={handleInputChange}
                      options={opcionesSalidaPedido}
                      placeholder="Seleccione una salida"
                      label="Salida de Pedido"
                    />
                  </div>

                  {/* Región */}
                  <div>
                    <CustomSelect
                      name="region"
                      value={formData.region}
                      onChange={handleInputChange}
                      options={opcionesRegion}
                      placeholder="Seleccione una región"
                      label="Región"
                    />
                  </div>

                  {/* Distrito */}
                  <div>
                    <CustomSelect
                      name="distrito"
                      value={formData.distrito}
                      onChange={handleInputChange}
                      options={opcionesDistrito}
                      placeholder={formData.region ? "Seleccione un distrito" : "Primero seleccione una región"}
                      label="Distrito"
                      disabled={!formData.region || opcionesDistrito.length === 0}
                    />
                  </div>

                  {/* Lugar */}
                  <div>
                    <CustomSelect
                      name="lugar"
                      value={formData.lugar}
                      onChange={handleInputChange}
                      options={opcionesLugar}
                      placeholder={formData.distrito ? "Seleccione un lugar" : "Primero seleccione un distrito"}
                      label="Lugar"
                      disabled={!formData.distrito || opcionesLugar.length === 0}
                    />
                  </div>

                  {/* Observaciones */}
                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Observaciones
                    </label>
                    <textarea
                      name="observaciones"
                      value={formData.observaciones}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002D5A] focus:border-[#002D5A] transition-all text-sm resize-none text-gray-900 placeholder:text-gray-400"
                      placeholder="Ingrese observaciones..."
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Detalle de Productos Vendidos */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200/60 p-6 mb-6">
                <div className="flex items-center space-x-2 mb-4 p-3 bg-gradient-to-r from-[#002D5A] to-[#002D5A] rounded-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <h2 className="text-lg font-bold text-white">Detalle de Productos Vendidos</h2>
                </div>

                {/* Agregar Nuevo Producto */}
                <div className="bg-[#E9F1FF] rounded-lg p-4 mb-4 border-2 border-[#002D5A]/20">
                  <div className="flex items-center space-x-2 mb-4">
                    <svg className="w-5 h-5 text-[#002D5A]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    <h3 className="text-base font-bold text-gray-900">Agregar Nuevo Producto</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Fila 1 - Primera columna */}
                    <div className="relative">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Producto
                      </label>
                      <input
                        ref={productoInputRef}
                        type="text"
                        name="producto"
                        value={nuevoProducto.producto}
                        onChange={handleProductoChange}
                        onFocus={() => {
                          if (nuevoProducto.producto) buscarProductos(nuevoProducto.producto);
                        }}
                        placeholder="Nombre del producto"
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002D5A] focus:border-[#002D5A] transition-all text-sm text-gray-900"
                      />
                      <div ref={productoSuggestionsRef} className="relative">
                        <SuggestionsList
                          suggestions={sugerenciasProductos}
                          onSelect={seleccionarProducto}
                          show={mostrarSugerenciasProductos}
                        />
                      </div>
                    </div>

                    {/* Fila 1 - Segunda columna */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Código
                      </label>
                      <input
                        type="text"
                        name="codigo"
                        value={nuevoProducto.codigo}
                        readOnly
                        placeholder="Código del producto"
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg bg-gray-100 text-sm text-gray-900 cursor-not-allowed"
                      />
                    </div>

                    {/* Fila 1 - Tercera columna */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Cantidad
                      </label>
                      <input
                        type="number"
                        name="cantidad"
                        value={nuevoProducto.cantidad}
                        onChange={handleProductoChange}
                        min="1"
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002D5A] focus:border-[#002D5A] transition-all text-sm text-gray-900"
                      />
                    </div>

                    {/* Fila 2 - Primera columna */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Precio de Venta (Valor Unitario)
                      </label>
                      <input
                        type="number"
                        name="precioVenta"
                        value={nuevoProducto.precioVenta}
                        onChange={handleProductoChange}
                        step="0.000001"
                        min="0"
                        placeholder="Ej. 42.37"
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002D5A] focus:border-[#002D5A] transition-all text-sm text-gray-900"
                      />
                      <p className="text-[10px] text-gray-500 mt-1">Precio sin IGV</p>
                    </div>

                    {/* Fila 2 - Segunda columna */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Subtotal (Base Gravada)
                      </label>
                      <input
                        type="number"
                        name="subtotalBase"
                        value={nuevoProducto.subtotalBase}
                        onChange={handleProductoChange}
                        step="0.01"
                        min="0"
                        placeholder="Ej. 966.10"
                        className="w-full px-4 py-2.5 border-2 border-orange-200 bg-orange-50/30 rounded-lg focus:ring-2 focus:ring-[#002D5A] focus:border-[#002D5A] transition-all text-sm font-bold text-gray-900"
                      />
                      <p className="text-[10px] text-orange-600 mt-1">Este monto suma a la Gravada</p>
                    </div>

                    {/* Fila 2 - Tercera columna */}
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={agregarProducto}
                        className="w-full px-3 py-2.5 bg-[#002D5A] text-white rounded-lg font-bold hover:bg-[#003d7a] transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center space-x-1.5 text-sm"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Agregar Producto</span>
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
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ID DETALLE</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">N° COMPROBANTE</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">CÓDIGO</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">PRODUCTO</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">CANTIDAD</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">PRECIO VENTA</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">IGV (18%)</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">TOTAL</th>
                          <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ACCIONES</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {productos.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="px-4 py-12 text-center">
                              <div className="flex flex-col items-center justify-center">
                                <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                <p className="text-gray-500 font-medium text-[10px]">No hay productos agregados</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          productos.map((producto, index) => {
                            const isEditing = editingProductoId === producto.id;
                            const displayProd = isEditing ? editingProducto : producto;

                            // Cálculos de línea
                            const qty = parseFloat(displayProd.cantidad) || 0;
                            const unit = parseFloat(displayProd.precioVenta) || 0;
                            const subtotal = roundSUNAT(qty * unit);
                            const igv = roundSUNAT(subtotal * 0.18);
                            const total = roundSUNAT(subtotal + igv);

                            return (
                              <tr key={producto.id} className={`hover:bg-slate-200 transition-colors ${isEditing ? 'bg-blue-50' : ''}`}>
                                {/* ID DETALLE */}
                                <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">DET_{2635 + index + 1}</td>

                                {/* N° COMPROBANTE */}
                                <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{formData.comprobanteNumero}</td>

                                {/* CÓDIGO - Solo lectura, se actualiza automáticamente */}
                                <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{displayProd.codigo || ''}</td>

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

                                          // Buscar productos
                                          const textoLower = nuevoValor.toLowerCase();
                                          const sugerencias = todosLosProductos.current
                                            .filter(p => (p.NOMBRE || "").toLowerCase().includes(textoLower))
                                            .slice(0, 10);

                                          if (sugerencias.length > 0 && nuevoValor.length > 0) {
                                            setMostrarSugerenciasProductoEdicion(true);
                                          } else {
                                            setMostrarSugerenciasProductoEdicion(false);
                                          }
                                        }}
                                        onFocus={() => {
                                          if (busquedaProductoEdicion.length > 0) {
                                            setMostrarSugerenciasProductoEdicion(true);
                                          }
                                        }}
                                        className="w-full px-2 py-1 border-2 border-blue-300 rounded-lg text-[10px] font-medium text-gray-900 focus:border-blue-500 outline-none"
                                      />
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-gray-700">{producto.producto}</span>
                                  )}
                                </td>

                                {/* CANTIDAD */}
                                <td className="px-3 py-2 whitespace-nowrap text-right">
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      value={displayProd.cantidad || ''}
                                      onChange={(e) => setEditingProducto({ ...editingProducto, cantidad: e.target.value })}
                                      className="w-16 px-2 py-1 border-2 border-blue-300 rounded-lg text-[10px] font-medium text-gray-900 focus:border-blue-500 outline-none"
                                    />
                                  ) : (
                                    <span className="text-[10px] text-gray-700">{producto.cantidad}</span>
                                  )}
                                </td>

                                {/* PRECIO VENTA */}
                                <td className="px-3 py-2 whitespace-nowrap text-right">
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      step="0.000001"
                                      value={displayProd.precioVenta || ''}
                                      onChange={(e) => setEditingProducto({ ...editingProducto, precioVenta: e.target.value })}
                                      className="w-24 px-2 py-1 border-2 border-blue-300 rounded-lg text-[10px] font-medium text-gray-900 focus:border-blue-500 outline-none"
                                    />
                                  ) : (
                                    <span className="text-[10px] text-gray-700" title={producto.precioVenta}>S/ {parseFloat(producto.precioVenta).toFixed(2)}</span>
                                  )}
                                </td>

                                {/* IGV (18%) - Calculado automáticamente */}
                                <td className="px-3 py-2 whitespace-nowrap text-right text-[10px] text-gray-700">S/ {igv.toFixed(2)}</td>

                                {/* TOTAL - Calculado automáticamente */}
                                <td className="px-3 py-2 whitespace-nowrap text-right text-[10px] font-bold text-gray-900 bg-gray-50/50">S/ {total.toFixed(2)}</td>

                                {/* ACCIONES */}
                                <td className="px-3 py-2 whitespace-nowrap text-center">
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

                {/* Resumen de Totales SUNAT */}
                <div className="mt-8 flex flex-col md:flex-row justify-end items-end md:items-stretch gap-4">
                  <div className="md:w-64 bg-slate-50 border-2 border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="p-3 border-b border-slate-200 bg-slate-100 flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-600 uppercase">Resumen SUNAT</span>
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500 font-medium tracking-wide">GRAVADA S/</span>
                        <span className="text-sm font-bold text-slate-900">{calcularTotalesFinales().gravada}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500 font-medium tracking-wide">IGV (18%) S/</span>
                        <span className="text-sm font-bold text-slate-900">{calcularTotalesFinales().igv}</span>
                      </div>
                      <div className="h-0.5 bg-slate-200 my-2"></div>
                      <div className="flex justify-between items-center p-2 bg-blue-700 rounded-lg">
                        <span className="text-xs text-white font-bold tracking-wider">TOTAL S/</span>
                        <span className="text-base font-black text-white">{calcularTotalesFinales().total}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={limpiarFormulario}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-all duration-200 shadow-sm hover:shadow-md flex items-center space-x-2 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Limpiar Formulario</span>
                </button>
                <button
                  type="button"
                  onClick={guardarVenta}
                  className="px-4 py-2 bg-gradient-to-br from-[#002D5A] to-[#002D5A] text-white rounded-lg font-semibold hover:shadow-md transition-all duration-200 shadow-sm flex items-center space-x-2 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  <span>Guardar Venta</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

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
          {todosLosProductos.current.filter(p => {
            const nombre = (p.NOMBRE || "").toLowerCase();
            const codigo = (p.CODIGO || "").toLowerCase();
            const busqueda = busquedaProductoEdicion.toLowerCase();
            return nombre.includes(busqueda) || codigo.includes(busqueda);
          }).slice(0, 10).map((prod, idx) => (
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
