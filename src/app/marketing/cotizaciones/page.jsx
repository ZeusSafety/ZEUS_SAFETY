"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "../../../components/context/AuthContext";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";
import Modal from "../../../components/ui/Modal";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Componente de Select personalizado con dropdown compacto
const CompactSelect = ({ value, onChange, options, placeholder, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const selectRef = useRef(null);
  const buttonRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value);

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
      const dropdownHeight = 180; // Altura máxima más compacta
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
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none text-sm bg-white disabled:bg-gray-100 disabled:cursor-not-allowed text-left flex items-center justify-between transition-all ${
          isOpen 
            ? 'border-blue-500 shadow-md' 
            : 'border-gray-300 hover:border-blue-300'
        } ${disabled ? 'border-gray-200' : ''}`}
      >
        <span className={`${selectedOption ? "text-gray-900 font-medium" : "text-gray-500"} whitespace-nowrap overflow-hidden text-ellipsis uppercase`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ml-2 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div
          className={`absolute z-50 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-xl overflow-hidden ${
            openUpward ? 'bottom-full mb-1' : 'top-full'
          }`}
          style={{ maxHeight: '200px', overflowY: 'auto' }}
        >
          {options.map((option, index) => (
            <button
              key={option.value || index}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`w-full px-3 py-2.5 text-sm text-left transition-colors border-b border-gray-100 last:border-b-0 ${
                value === option.value
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-gray-900 hover:bg-blue-50'
              } ${index === 0 && !option.value ? 'text-gray-500 italic' : ''}`}
              style={{ 
                lineHeight: '1.4'
              }}
            >
              <span className={value === option.value ? 'uppercase' : ''}>
                {option.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default function CotizacionesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Información de la empresa
  const empresaInfo = {
    razonSocial: "BUSINNES OF IMPORT ZEUS S.A.C",
    ruc: "20600101596",
    direccion: "AV. GUILLERMO DANSEY NRO. 401 CERCADO DE LIMA INT. 30006",
    telefono: "944767397"
  };

  // Estados del formulario
  const [cliente, setCliente] = useState("");
  const [ruc, setRuc] = useState("");
  const [direccion, setDireccion] = useState("");
  const [dni, setDni] = useState("");
  const [cel, setCel] = useState("");
  const [buscandoRuc, setBuscandoRuc] = useState(false);
  // Inicializar fecha de emisión con la fecha actual en formato yyyy-mm-dd para el input type="date"
  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const [fechaEmision, setFechaEmision] = useState(getCurrentDate());
  const [formaPago, setFormaPago] = useState("");
  const [region, setRegion] = useState("");
  const [distrito, setDistrito] = useState("");
  const [regiones, setRegiones] = useState([]);
  const [distritos, setDistritos] = useState([]);
  const [cargandoRegiones, setCargandoRegiones] = useState(false);
  const [cargandoDistritos, setCargandoDistritos] = useState(false);
  const [moneda, setMoneda] = useState("");
  const [atendidoPor, setAtendidoPor] = useState("");

  // Estados de productos
  const [producto, setProducto] = useState("");
  const [codigo, setCodigo] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [unidadMedida, setUnidadMedida] = useState("");
  const [precioVenta, setPrecioVenta] = useState("");
  const [total, setTotal] = useState(0.00);
  
  // Estado para el modal de confirmación
  const [clasificacion, setClasificacion] = useState("");
  
  // Estados para búsqueda de productos
  const [productoBusqueda, setProductoBusqueda] = useState("");
  const [sugerenciasProductos, setSugerenciasProductos] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [buscandoProductos, setBuscandoProductos] = useState(false);
  const [todosLosProductos, setTodosLosProductos] = useState([]);
  const [productosCargados, setProductosCargados] = useState(false);
  const productoInputRef = useRef(null);
  const sugerenciasRef = useRef(null);
  
  // Estados para modal de precios
  const [modalPreciosAbierto, setModalPreciosAbierto] = useState(false);
  const [preciosDisponibles, setPreciosDisponibles] = useState([]);
  const [cargandoPrecios, setCargandoPrecios] = useState(false);
  // Datos de prueba para la tabla de productos
  const [productosLista, setProductosLista] = useState([
    
  ]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Cargar regiones al montar el componente
  useEffect(() => {
    const cargarRegiones = async () => {
      setCargandoRegiones(true);
      try {
        const response = await fetch("/api/regiones");
        await handleApiResponse(response);
        if (!response.ok) {
          throw new Error("Error al cargar regiones");
        }
        const data = await response.json();
        if (data.success && data.data) {
          setRegiones(data.data);
        }
      } catch (error) {
        console.error("Error al cargar regiones:", error);
        if (error.message.includes("Token expirado")) {
          return; // Ya se redirigió al login
        }
      } finally {
        setCargandoRegiones(false);
      }
    };

    cargarRegiones();
  }, []);

  // Cargar distritos cuando se selecciona una región
  useEffect(() => {
    const cargarDistritos = async () => {
      if (!region) {
        setDistritos([]);
        setDistrito("");
        return;
      }

      setCargandoDistritos(true);
      try {
        const response = await fetch(`/api/distritos?id_region=${encodeURIComponent(region)}`);
        await handleApiResponse(response);
        if (!response.ok) {
          throw new Error("Error al cargar distritos");
        }
        const data = await response.json();
        if (data.success && data.data) {
          setDistritos(data.data);
        } else {
          setDistritos([]);
        }
        // Limpiar distrito seleccionado cuando cambia la región
        setDistrito("");
      } catch (error) {
        console.error("Error al cargar distritos:", error);
        if (error.message.includes("Token expirado")) {
          return; // Ya se redirigió al login
        }
        setDistritos([]);
      } finally {
        setCargandoDistritos(false);
      }
    };

    cargarDistritos();
  }, [region]);

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

  // Calcular total cuando cambian cantidad o precio
  useEffect(() => {
    const cantidadNum = parseFloat(cantidad) || 0;
    const precioNum = parseFloat(precioVenta) || 0;
    setTotal(cantidadNum * precioNum);
  }, [cantidad, precioVenta]);

  // Cerrar sugerencias al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sugerenciasRef.current &&
        !sugerenciasRef.current.contains(event.target) &&
        productoInputRef.current &&
        !productoInputRef.current.contains(event.target)
      ) {
        setMostrarSugerencias(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Función para obtener el token de autenticación desde localStorage
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem("token") || "";
    }
    return "";
  };

  // Función helper para manejar respuestas de API y redirigir al login si el token expiró
  const handleApiResponse = async (response) => {
    // Si el token expiró (401), redirigir al login
    if (response.status === 401) {
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      router.push("/login");
      throw new Error("Token expirado. Por favor, inicie sesión nuevamente.");
    }
    return response;
  };

  // Función para cargar todos los productos desde la API
  const cargarTodosLosProductos = async () => {
    if (productosCargados) {
      return; // Ya están cargados, no volver a cargar
    }

    const token = getAuthToken();
    if (!token) {
      console.error("No se encontró token de autenticación");
      alert("Error: No se encontró token de autenticación. Por favor, inicie sesión nuevamente.");
      return;
    }

    setBuscandoProductos(true);
    try {
      const url = `https://api-productos-zeus-2946605267.us-central1.run.app/productos/5?method=BUSQUEDA_PRODUCTO`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      await handleApiResponse(response);
      
      if (!response.ok) {
        console.error(`Error ${response.status}: ${response.statusText}`);
        alert(`Error al cargar productos: ${response.status} ${response.statusText}`);
        throw new Error(`Error al cargar productos: ${response.status}`);
      }

      const data = await response.json();
      
      // Asegurarse de que data sea un array
      const productos = Array.isArray(data) ? data : (data.data || []);
      
      setTodosLosProductos(productos);
      setProductosCargados(true);
    } catch (error) {
      console.error("Error al cargar productos:", error);
      // El error ya fue manejado arriba con alert
    } finally {
      setBuscandoProductos(false);
    }
  };

  // Función para filtrar productos localmente
  const buscarProductos = (termino) => {
    if (!termino || termino.trim().length < 2) {
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

  // Función para filtrar productos localmente
  const filtrarProductos = (termino) => {
    if (todosLosProductos.length === 0) {
      setSugerenciasProductos([]);
      setMostrarSugerencias(false);
      return;
    }

    const terminoLower = termino.toLowerCase().trim();
    const productosFiltrados = todosLosProductos.filter(prod => {
      const nombre = (prod.NOMBRE || prod.nombre || "").toLowerCase();
      const codigo = (prod.CODIGO || prod.codigo || "").toLowerCase();
      return nombre.includes(terminoLower) || codigo.includes(terminoLower);
    });
    
    setSugerenciasProductos(productosFiltrados);
    setMostrarSugerencias(productosFiltrados.length > 0);
  };

  // Manejar cambio en el campo de búsqueda de producto
  const handleProductoBusquedaChange = (e) => {
    const valor = e.target.value;
    setProductoBusqueda(valor);
    buscarProductos(valor);
  };

  // Manejar cuando el usuario enfoca el campo de producto
  const handleProductoFocus = () => {
    // Cargar productos si no están cargados
    if (!productosCargados && todosLosProductos.length === 0) {
      cargarTodosLosProductos();
    }
    
    // Si hay sugerencias previas, mostrarlas
    if (sugerenciasProductos.length > 0) {
      setMostrarSugerencias(true);
    }
  };

  // Seleccionar producto de las sugerencias
  const seleccionarProducto = (productoItem) => {
    setProductoBusqueda(productoItem.NOMBRE || productoItem.nombre || "");
    setProducto(productoItem.NOMBRE || productoItem.nombre || "");
    setCodigo(productoItem.CODIGO || productoItem.codigo || "");
    setProductoSeleccionado(productoItem);
    setSugerenciasProductos([]);
    setMostrarSugerencias(false);
    
    // Si ya hay clasificación seleccionada, abrir modal de precios
    if (clasificacion) {
      obtenerPrecios(productoItem.CODIGO || productoItem.codigo, clasificacion);
    }
  };

  // Función para obtener precios
  const obtenerPrecios = async (codigoProducto, tipoClasificacion) => {
    if (!codigoProducto || !tipoClasificacion) {
      return;
    }

    const token = getAuthToken();
    if (!token) {
      console.error("No se encontró token de autenticación");
      alert("Error: No se encontró token de autenticación. Por favor, inicie sesión nuevamente.");
      return;
    }

    setCargandoPrecios(true);
    try {
      const url = `https://api-productos-zeus-2946605267.us-central1.run.app/franja-precios/5?method=OBTENER_PRECIO_PRODUCTO&id=${encodeURIComponent(codigoProducto)}/${tipoClasificacion}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      await handleApiResponse(response);
      
      if (!response.ok) {
        console.error(`Error ${response.status}: ${response.statusText}`);
        alert(`Error al obtener precios: ${response.status} ${response.statusText}`);
        throw new Error(`Error al obtener precios: ${response.status}`);
      }

      const data = await response.json();
      const precios = Array.isArray(data) ? data : (data.data || []);
      
      setPreciosDisponibles(precios);
      setModalPreciosAbierto(true);
    } catch (error) {
      console.error("Error al obtener precios:", error);
      alert("Error al obtener los precios del producto");
    } finally {
      setCargandoPrecios(false);
    }
  };

  // Manejar cambio en clasificación
  const handleClasificacionChange = (e) => {
    const nuevaClasificacion = e.target.value;
    setClasificacion(nuevaClasificacion);
    
    // Si ya hay producto seleccionado, obtener precios
    if (nuevaClasificacion && codigo) {
      obtenerPrecios(codigo, nuevaClasificacion);
    }
  };

  // Seleccionar precio del modal
  const seleccionarPrecio = (precioItem) => {
    const precio = precioItem.PRECIO_UNIDAD_MEDIDA_VENTA || precioItem.precio_unidad_medida_venta || precioItem.precio || precioItem.PRECIO || 0;
    const precioNum = parseFloat(precio) || 0;
    console.log("Precio seleccionado:", precioNum, "de item:", precioItem); // Debug
    setPrecioVenta(precioNum.toString());
    setUnidadMedida(precioItem.MEDIDA || precioItem.medida || "UN");
    setModalPreciosAbierto(false);
    
    // Recalcular total inmediatamente
    const cantidadNum = parseFloat(cantidad) || 1;
    setTotal(cantidadNum * precioNum);
  };

  // Función para buscar RUC
  const handleBuscarRuc = async () => {
    if (!ruc || ruc.trim() === "") {
      alert("Por favor ingrese un RUC");
      return;
    }

    const rucTrimmed = ruc.trim();
    const rucLength = rucTrimmed.length;

    // Validar longitud del RUC
    if (rucLength !== 10 && rucLength !== 11) {
      alert("El RUC debe tener 10 o 11 dígitos");
      return;
    }

    setBuscandoRuc(true);
    try {
      const response = await fetch("/api/consulta-ruc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ruc: rucTrimmed }),
      });

      await handleApiResponse(response);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Error desconocido" }));
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      const data = await response.json();
      console.log("Datos recibidos de la API:", data);
      console.log("Todas las claves del objeto:", Object.keys(data));
      
      // Función auxiliar para obtener el nombre/cliente de diferentes formatos
      const obtenerNombre = () => {
        const nombre = data.razonSocial || 
               data.razon_social || 
               data.RazonSocial ||
               data.RAZON_SOCIAL ||
               data.nombre || 
               data.Nombre ||
               data.NOMBRE ||
               data.nombreCompleto ||
               data.nombre_completo ||
               data.cliente ||
               data.Cliente ||
               data.CLIENTE ||
               "";
        console.log("Nombre encontrado:", nombre);
        return nombre;
      };

      // Función auxiliar para obtener la dirección de diferentes formatos
      const obtenerDireccion = () => {
        // Buscar en todas las variaciones posibles
        const direccion = data.direccion || 
               data.direccion_completa || 
               data.Direccion ||
               data.DIRECCION ||
               data.direccionCompleta ||
               data.DireccionCompleta ||
               data.DIRECCION_COMPLETA ||
               data.domicilio ||
               data.Domicilio ||
               data.DOMICILIO ||
               data.direccionFiscal ||
               data.DireccionFiscal ||
               data.DIRECCION_FISCAL ||
               data.direccionLegal ||
               data.DireccionLegal ||
               data.DIRECCION_LEGAL ||
               data.direccionPrincipal ||
               data.DireccionPrincipal ||
               data.DIRECCION_PRINCIPAL ||
               "";
        
        console.log("Dirección encontrada:", direccion);
        
        // Si no se encontró, buscar cualquier campo que contenga "direccion" o "domicilio" en su nombre
        if (!direccion) {
          const keys = Object.keys(data);
          for (const key of keys) {
            const keyLower = key.toLowerCase();
            if ((keyLower.includes('direccion') || keyLower.includes('domicilio') || keyLower.includes('address')) && data[key] && typeof data[key] === 'string' && data[key].trim() !== '') {
              console.log(`Dirección encontrada en campo alternativo "${key}":`, data[key]);
              return data[key];
            }
          }
        }
        
        return direccion;
      };

      // Obtener valores
      const nombreCliente = obtenerNombre();
      const direccionCliente = obtenerDireccion();

      console.log("Valores finales - Cliente:", nombreCliente, "Dirección:", direccionCliente);

      // Llenar campos según el tipo de RUC
      if (rucLength === 11) {
        // RUC 20 - Empresa
        if (nombreCliente) {
          setCliente(nombreCliente);
          console.log("Cliente establecido:", nombreCliente);
        }
        if (direccionCliente) {
          setDireccion(direccionCliente);
          console.log("Dirección establecida:", direccionCliente);
        } else {
          console.warn("No se encontró dirección en la respuesta de la API");
        }
        // NO rellenar DNI para RUC 20
        setDni("");
      } else if (rucLength === 10) {
        // RUC 10 - Persona natural
        // Extraer DNI: borrar los 2 primeros dígitos y el último dígito
        const rucSinPrimeros = rucTrimmed.substring(2); // Quita los 2 primeros
        const dniExtraido = rucSinPrimeros.substring(0, rucSinPrimeros.length - 1); // Quita el último
        setDni(dniExtraido);
        
        if (nombreCliente) {
          setCliente(nombreCliente);
          console.log("Cliente establecido:", nombreCliente);
        }
        if (direccionCliente) {
          setDireccion(direccionCliente);
          console.log("Dirección establecida:", direccionCliente);
        } else {
          console.warn("No se encontró dirección en la respuesta de la API");
        }
      }

      // Mostrar mensaje si no se encontraron datos
      if (!nombreCliente && !direccionCliente) {
        alert("No se encontraron datos para el RUC ingresado");
      } else if (!direccionCliente) {
        console.warn("Se encontró el cliente pero no la dirección");
      }
    } catch (error) {
      console.error("Error al buscar RUC:", error);
      alert(`Error al buscar RUC: ${error.message}`);
    } finally {
      setBuscandoRuc(false);
    }
  };

  // Calcular total general
  const totalGeneral = productosLista.reduce((sum, prod) => sum + (prod.subtotal || 0), 0);

  const handleAgregarProducto = () => {
    if (!producto || !codigo || cantidad <= 0 || !precioVenta) {
      alert("Por favor complete todos los campos del producto");
      return;
    }

    // Asegurarse de que el precio sea un número válido
    const precioNum = parseFloat(precioVenta) || 0;
    if (precioNum <= 0) {
      alert("El precio debe ser mayor a 0");
      return;
    }

    // Calcular subtotal correctamente
    const cantidadNum = parseFloat(cantidad) || 1;
    const subtotalCalculado = cantidadNum * precioNum;

    const nuevoProducto = {
      id: Date.now(),
      cantidad: cantidadNum,
      unidad: unidadMedida || "UN",
      codigo: codigo,
      producto: producto,
      precioUnit: precioNum,
      subtotal: subtotalCalculado
    };

    console.log("Agregando producto:", nuevoProducto); // Debug

    setProductosLista([...productosLista, nuevoProducto]);
    
    // Limpiar campos excepto clasificación
    setProducto("");
    setProductoBusqueda("");
    setCodigo("");
    setCantidad(1);
    setUnidadMedida("");
    setPrecioVenta("");
    setTotal(0.00);
    setProductoSeleccionado(null);
    // NO limpiar clasificación
  };

  const handleEliminarProducto = (id) => {
    setProductosLista(productosLista.filter(prod => prod.id !== id));
  };

  const handleRegistrarCotizacion = async () => {
    if (productosLista.length === 0) {
      alert("Debe agregar al menos un producto");
      return;
    }

    // Obtener el nombre de la región y distrito seleccionados
    const regionSeleccionada = regiones.find(r => r.ID_REGION === region);
    const distritoSeleccionado = distritos.find(d => d.ID_DISTRITO === distrito);
    
    // Primero guardar la cotización en la base de datos para obtener el código
    let numeroCotizacion = '';
    try {
      // Obtener el token de autenticación
      const token = getAuthToken();
      if (!token) {
        alert('Error: No se encontró token de autenticación. Por favor, inicie sesión nuevamente.');
        return;
      }

      const response = await fetch('/api/cotizaciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre_cliente: cliente || '',
          region: regionSeleccionada?.REGION || region || '',
          distrito: distritoSeleccionado?.DISTRITO || distrito || '',
          monto_total: totalGeneral,
          ruta_pdf: '', // Por ahora vacío, se puede actualizar después si se guarda el PDF en el servidor
          atendido_por: atendidoPor || ''
        }),
      });

      await handleApiResponse(response);

      const data = await response.json();
      
      if (!response.ok) {
        alert(`Error al guardar la cotización: ${data.error || 'Error desconocido'}`);
        return;
      }

      // Usar el código de cotización que viene del backend
      numeroCotizacion = data.codigo_cotizacion;
      
      // Actualizar localStorage con el número del backend
      if (numeroCotizacion) {
        const numeroBackend = parseInt(numeroCotizacion.split('-')[1], 10);
        localStorage.setItem('lastCotizacionNumber', numeroBackend.toString());
      }
    } catch (error) {
      console.error('Error al guardar cotización:', error);
      alert('Error al guardar la cotización. Por favor, intente nuevamente.');
      return;
    }

    // Función para generar PDF desde imagen
    const generarPDFDesdeImagen = async (numeroCotizacion) => {
      try {
        // Crear un elemento temporal para renderizar la cotización
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.width = '900px'; // Ancho aumentado para que se vea más ancho
        tempDiv.style.maxWidth = 'none';
        tempDiv.style.padding = '15px 20px';
        tempDiv.style.backgroundColor = 'white';
        tempDiv.style.fontFamily = 'Arial, Helvetica, sans-serif';
        tempDiv.className = 'page-container';
        
        // Generar el HTML de la cotización
        const cotizacionHTML = generarHTMLCotizacion(numeroCotizacion);
        tempDiv.innerHTML = cotizacionHTML;
        document.body.appendChild(tempDiv);

        // Esperar a que las imágenes carguen
        const images = tempDiv.querySelectorAll('img');
        const imagePromises = Array.from(images).map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        });
        
        await Promise.all(imagePromises);
        
        // Esperar un poco más para que se renderice completamente
        await new Promise(resolve => setTimeout(resolve, 500));

        // Generar imagen con html2canvas
        const canvas = await html2canvas(tempDiv, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          letterRendering: true,
          allowTaint: false,
          scrollX: 0,
          scrollY: 0,
          width: tempDiv.scrollWidth,
          height: tempDiv.scrollHeight
        });

        // Convertir canvas a imagen
        const imgData = canvas.toDataURL('image/png', 1.0);
        
        // Crear PDF con jsPDF
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
          compress: true
        });

        // Calcular dimensiones para que quepa en A4
        const pdfWidth = pdf.internal.pageSize.getWidth(); // en mm
        const pdfHeight = pdf.internal.pageSize.getHeight(); // en mm
        const margin = 10; // margen en mm
        
        // Convertir píxeles a mm (asumiendo 96 DPI: 1 pulgada = 25.4mm, 96px = 25.4mm)
        const pxToMm = 25.4 / 96;
        const imgWidthMm = (canvas.width * pxToMm) / 2; // dividir por 2 porque scale es 2
        const imgHeightMm = (canvas.height * pxToMm) / 2;
        
        // Calcular ratio para que quepa en la página
        const availableWidth = pdfWidth - (margin * 2);
        const availableHeight = pdfHeight - (margin * 2);
        const ratio = Math.min(availableWidth / imgWidthMm, availableHeight / imgHeightMm);
        
        const imgWidthFinal = imgWidthMm * ratio;
        const imgHeightFinal = imgHeightMm * ratio;

        // Agregar imagen al PDF centrada
        const xOffset = (pdfWidth - imgWidthFinal) / 2;
        const yOffset = margin;
        pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidthFinal, imgHeightFinal);

        // Descargar PDF
        pdf.save(`Cotizacion_${numeroCotizacion}.pdf`);

        // Limpiar elemento temporal
        document.body.removeChild(tempDiv);
      } catch (error) {
        console.error('Error al generar PDF:', error);
        alert('Error al generar el PDF. Por favor, intente nuevamente.');
      }
    };

    // Función para generar el HTML de la cotización (solo el contenido, sin scripts)
    const generarHTMLCotizacion = (numeroCotizacion) => {
      return `
    <style>
        /* Botón de descarga */
        .download-button-container {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
        }
        .download-button {
            background: linear-gradient(135deg, #1E63F7 0%, #1E63F7 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s ease;
        }
        .download-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
        }
        .download-button:active {
            transform: translateY(0);
        }
        .download-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        /* Configuración General */
        /* Configuración General */
        * {
            color: #000000 !important;
        }
        body {
            font-family: Arial, Helvetica, sans-serif;
            margin: 0;
            padding: 5px;
            background-color: #f0f0f0;
            display: flex;
            justify-content: center;
            min-width: 100%;
            width: 100%;
            max-width: none;
            color: #000000;
        }
        .page-container {
            background-color: white;
            width: 900px; /* Ancho aumentado para que se vea más ancho */
            max-width: none;
            margin: 0 auto;
            padding: 15px 20px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            box-sizing: border-box;
            position: relative;
            color: #000000;
        }
        /* --- Header --- */
        header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
        }
        .logo-section {
            width: 25%;
        }
        .logo-section img {
            max-width: 100%;
            height: auto;
            display: block;
        }
        .company-info {
            width: 50%;
            text-align: center;
            font-size: 11px;
            line-height: 1.4;
            padding-top: 5px;
            color: #000000;
        }
        .company-name {
            font-weight: bold;
            font-size: 15px;
            margin-bottom: 5px;
            display: block;
            color: #000000;
        }
        .ruc-box {
            width: 25%;
            border: 2px solid #5b9bd5;
            text-align: center;
            font-size: 14px;
            font-weight: bold;
        }
        .ruc-header {
            background-color: #5b9bd5; /* Azul claro de la imagen */
            padding: 5px;
            border-bottom: 1px solid #5b9bd5;
        }
        .ruc-title {
            background-color: #5b9bd5;
            padding: 5px;
            border-bottom: 1px solid #5b9bd5;
            font-size: 14px;
        }
        .ruc-number {
            background-color: #5b9bd5; 
            padding: 8px;
        }
        /* --- Cliente Info --- */
        .client-info {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            font-weight: bold;
            margin-bottom: 15px;
            line-height: 1.8;
            color: #000000;
        }
        .client-left {
            width: 60%;
            color: #000000;
        }
        .client-right {
            width: 35%;
            color: #000000;
        }
        /* --- Tablas Generales --- */
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
            margin-bottom: 5px;
        }
        th, td {
            border: 1px solid #000; /* Bordes negros sólidos */
            padding: 4px 5px;
            text-align: center;
            color: #000000;
        }
        /* --- Tabla Metadatos (Fecha, Forma Pago, etc) --- */
        .meta-table th {
            background-color: #5b9bd5;
            font-weight: bold;
            text-transform: uppercase;
            color: #ffffff;
        }
        .meta-table td {
            height: 20px; /* Altura vacía */
            color: #000000;
        }
        /* Espaciador */
        .spacer {
            height: 10px;
        }
        /* --- Tabla Principal de Productos --- */
        .product-table th {
            background-color: #5b9bd5;
            text-transform: uppercase;
            color: #ffffff;
        }
        .product-table tr {
            height: 22px; /* Altura de filas vacías */
        }
        .product-table td {
            color: #000000;
        }
        /* Column widths para imitar la imagen */
        .col-cant { width: 8%; }
        .col-uni { width: 10%; }
        .col-cod { width: 12%; }
        .col-prod { width: 45%; }
        .col-punit { width: 12%; }
        .col-sub { width: 13%; }
        /* --- Total Section --- */
        .total-section {
            display: flex;
            justify-content: flex-end;
            margin-top: 5px;
            margin-bottom: 20px;
        }
        .total-box {
            display: flex;
            border: 1px solid #000;
            width: 210px;
        }
        .total-label {
            padding: 5px 10px;
            font-weight: bold;
            font-size: 12px;
            border-right: 1px solid #000;
            flex-grow: 1;
            color: #000000;
        }
        .total-value {
            width: 95px;
            padding: 5px;
            color: #000000;
        }
        /* --- Tabla de Bancos --- */
        .bank-table th {
            background-color: #5b9bd5;
            text-transform: uppercase;
            font-size: 10px;
            color: #ffffff;
        }
        .bank-table td {
            font-size: 9px;
            border: none; /* La imagen parece tener bordes internos sutiles o solo filas, pero pondré bordes estándar para mantener estructura */
            border-bottom: 1px solid #ccc;
            padding: 3px;
            color: #000000;
        }
        .bank-table {
            border: 1px solid #000;
            margin-bottom: 20px;
        }
        /* --- Footer --- */
        .footer {
            margin-top: 20px;
            width: 100%;
        }
        .footer-stripe-light-suave {
            background-color: #d9e6f2;
            height: 18px;
            width: 100%;
        }
        .footer-stripe-light {
            background-color: #6faee5;
            height: 20px;
            width: 100%;
        }
        .footer-stripe-dark {
            background-color: #1f4e79; /* Azul oscuro */
            color: white;
            text-align: center;
            font-weight: bold;
            padding: 8px;
            font-size: 14px;
            text-transform: uppercase;
        }
        /* Para impresión */
        @media print {
            body { background-color: white; margin: 0; padding: 0; }
            .page-container { box-shadow: none; width: 100%; max-width: 100%; padding: 10px; }
        }
    </style>
</head>
<body>
    <div class="page-container">
        <!-- Header -->
        <header>
            <div class="logo-section">
                <!-- Logo desde la URL proporcionada -->
                <img src="https://cibertecedgar.github.io/img-archivo/logo.png" alt="Zeus Safety Logo">
            </div>
            <div class="company-info">
                <span class="company-name">${empresaInfo.razonSocial}</span>
                ${empresaInfo.direccion}<br>
                LIMA - LIMA - LIMA<br>
                TELEFONO: ${empresaInfo.telefono}
            </div>
            <div class="ruc-box">
                <div class="ruc-header">RUC: ${empresaInfo.ruc}</div>
                <div class="ruc-title">COTIZACIÓN</div>
                <div class="ruc-number">${numeroCotizacion}</div>
            </div>
        </header>
        <!-- Información del Cliente -->
        <div class="client-info">
            <div class="client-left">
                <div>CLIENTE: ${cliente || ''}</div>
                <div>RUC: ${ruc || ''}</div>
                <div>DIRECCIÓN: ${direccion || ''}</div>
            </div>
            <div class="client-right">
                <div>DNI: ${dni || ''}</div>
                <div>CEL: ${cel || ''}</div>
            </div>
        </div>
        <!-- Tabla Metadatos -->
        <table class="meta-table">
            <thead>
                <tr>
                    <th style="width: 15%">FECHA DE EMISIÓN</th>
                    <th style="width: 20%">FORMA DE PAGO</th>
                    <th style="width: 15%">REGIÓN</th>
                    <th style="width: 20%">DISTRITO</th>
                    <th style="width: 10%">MONEDA</th>
                    <th style="width: 20%">ATENDIDO POR</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${fechaEmision ? new Date(fechaEmision).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}</td>
                    <td>${formaPago || ''}</td>
                    <td>${regionSeleccionada?.REGION || ''}</td>
                    <td>${distritoSeleccionado?.DISTRITO || ''}</td>
                    <td>${moneda || ''}</td>
                    <td>${atendidoPor || ''}</td>
                </tr>
            </tbody>
        </table>
        <div class="spacer"></div>
        <!-- Tabla de Productos -->
        <table class="product-table">
            <thead>
                <tr>
                    <th class="col-cant">CANT.</th>
                    <th class="col-uni">UNIDAD</th>
                    <th class="col-cod">CODIGO</th>
                    <th class="col-prod">PRODUCTO</th>
                    <th class="col-punit">P/UNIT</th>
                    <th class="col-sub">SUBTOTAL</th>
                </tr>
            </thead>
            <tbody id="product-rows">
                ${productosLista.map(prod => `
                    <tr>
                        <td>${prod.cantidad}</td>
                        <td>${prod.unidad}</td>
                        <td>${prod.codigo}</td>
                        <td style="text-align: left;">${prod.producto}</td>
                        <td>S/ ${prod.precioUnit.toFixed(2)}</td>
                        <td>S/ ${prod.subtotal.toFixed(2)}</td>
                    </tr>
                `).join('')}
                ${Array(Math.max(0, 22 - productosLista.length)).fill(0).map(() => `
                    <tr>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <!-- Total -->
        <div class="total-section">
            <div class="total-box">
                <div class="total-label">TOTAL S/ :</div>
                <div class="total-value">S/ ${totalGeneral.toFixed(2)}</div>
            </div>
        </div>
        <!-- Tabla de Bancos -->
        <table class="bank-table">
            <thead>
                <tr>
                    <th>CUENTA</th>
                    <th>BANCO</th>
                    <th>NOMBRE DE LA CUENTA</th>
                    <th>NRO. CUENTA</th>
                    <th>CCI</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="border: 1px solid #000" >CORRIENTE</td>
                    <td style="border: 1px solid #000" > BCP Soles</td>
                    <td style="border: 1px solid #000" >BUSINESS OF IMPORT & ZEUS S.A.C</td>
                    <td style="border: 1px solid #000" >191-2233941-0-59</td>
                    <td style="border: 1px solid #000" >00219100223394105953</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000" >CORRIENTE</td>
                    <td style="border: 1px solid #000" >BBVA Soles</td>
                    <td style="border: 1px solid #000" >BUSINESS OF IMPORT & ZEUS S.A.C</td>
                    <td style="border: 1px solid #000" >0011-0364-01000453-46</td>
                    <td style="border: 1px solid #000" >011-364-000100045346-72</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000" >CORRIENTE</td>
                    <td style="border: 1px solid #000" >INTERBANK Soles</td>
                    <td style="border: 1px solid #000" >BUSINESS OF IMPORT & ZEUS S.A.C</td>
                    <td style="border: 1px solid #000" >2003006034134</td>
                    <td style="border: 1px solid #000" ></td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000" >CORRIENTE</td>
                    <td style="border: 1px solid #000" >SCOTIABANK Soles</td>
                    <td style="border: 1px solid #000" >BUSINESS OF IMPORT & ZEUS S.A.C</td>
                    <td style="border: 1px solid #000" >000-4024129</td>
                    <td style="border: 1px solid #000" >00908100000402412911</td>
                </tr>
            </tbody>
        </table>
        <!-- Footer -->
        <footer class="footer">
            <div class="footer-stripe-light-suave"></div>
            <div class="footer-stripe-light"></div>
            <div class="footer-stripe-dark">
                ¡ EN ZEUS SAFETY, TU SEGURIDAD SIEMPRE SERÁ NUESTRA PRIORIDAD !
            </div>
        </footer>
    </div>
      `;
    };

    // Generar y descargar el PDF directamente
    await generarPDFDesdeImagen(numeroCotizacion);
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
    <div className="flex h-screen overflow-hidden" style={{ background: '#F7FAFF' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div 
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${
          sidebarOpen ? "lg:ml-60 ml-0" : "ml-0"
        }`}
      >
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 overflow-y-auto" style={{ background: '#F7FAFF' }}>
          <div className="p-3 lg:p-4" style={{ paddingBottom: '100px' }}>
            {/* Estilos para dropdowns más compactos */}
            <style jsx global>{`
              /* Forzar estilos más compactos en los dropdowns */
              select[name="region"] option,
              select[name="distrito"] option {
                padding: 3px 6px !important;
                font-size: 11px !important;
                line-height: 1.2 !important;
                margin: 0 !important;
              }
              
              /* Reducir el tamaño del dropdown cuando está abierto */
              select[name="region"],
              select[name="distrito"] {
                font-size: 12px !important;
              }
            `}</style>

            {/* Header con Botón Volver alineado */}
            <div className="mb-4 flex items-start justify-start max-w-[75rem] mx-auto">
              <button
                onClick={() => router.push("/marketing")}
                className="flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] text-white rounded-lg font-semibold hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm ripple-effect relative overflow-hidden text-sm group"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                <span>Volver</span>
              </button>
            </div>

            {/* Contenedor General Blanco */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-2 lg:p-2.5 max-w-[75rem] mx-auto">
              {/* Información de la Empresa */}
              <div className="mb-4 pb-4 border-b border-gray-300 mt-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <h2 className="text-sm font-bold text-gray-900 mb-3">RAZÓN SOCIAL: {empresaInfo.razonSocial}</h2>
                    <div className="space-y-1.5 text-sm text-gray-800">
                      <p><span className="font-semibold text-gray-900">RUC:</span> {empresaInfo.ruc}</p>
                      <p><span className="font-semibold text-gray-900">DIRECCIÓN:</span> {empresaInfo.direccion}</p>
                      <p><span className="font-semibold text-gray-900">TELÉFONO:</span> {empresaInfo.telefono}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center lg:justify-end">
                    <div className="relative w-60 h-30">
                      <Image
                        src="/images/logo_zeus_safety.png"
                        alt="Zeus Safety Logo"
                        fill
                        className="object-contain"
                        priority
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Información del Cliente */}
              <div className="mb-4 pb-4 border-b border-gray-300 mt-4">
                <h2 className="text-sm font-bold text-gray-900 mb-4">Cliente:</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Nombre del Cliente</label>
                  <input
                    type="text"
                    value={cliente}
                    onChange={(e) => setCliente(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                    placeholder="Nombre del cliente"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">RUC:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={ruc}
                      onChange={(e) => setRuc(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleBuscarRuc();
                        }
                      }}
                      className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                      placeholder="Ingrese RUC"
                      maxLength={11}
                    />
                    <button 
                      onClick={handleBuscarRuc}
                      disabled={buscandoRuc}
                      className="px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white rounded-lg transition-all duration-200 flex items-center justify-center min-w-[44px]"
                      title="Buscar RUC"
                    >
                      {buscandoRuc ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">DIRECCIÓN:</label>
                  <input
                    type="text"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                    placeholder="Dirección del cliente"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">DNI:</label>
                  <input
                    type="text"
                    value={dni}
                    onChange={(e) => setDni(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                    placeholder="DNI del cliente"
                    maxLength={8}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">CEL:</label>
                  <input
                    type="text"
                    value={cel}
                    onChange={(e) => setCel(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                    placeholder="Celular del cliente"
                  />
                </div>
              </div>
              </div>

              {/* Parámetros de Cotización */}
              <div className="mb-4 pb-4 border-b border-gray-300 mt-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">FECHA DE EMISIÓN</label>
                  <input
                    type="date"
                    value={fechaEmision}
                    onChange={(e) => setFechaEmision(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">FORMA DE PAGO</label>
                  <CompactSelect
                    value={formaPago}
                    onChange={(e) => setFormaPago(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                  >
                    <option value="" className="text-gray-500">Seleccione Pago</option>
                    <option value="AL CONTADO" className="text-gray-900">AL CONTADO</option>
                    <option value="CREDITO" className="text-gray-900">CRÉDITO</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">REGION</label>
                  <CompactSelect
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    disabled={cargandoRegiones}
                    placeholder={cargandoRegiones ? "Cargando regiones..." : "Seleccione una región"}
                    options={[
                      { value: "", label: cargandoRegiones ? "Cargando regiones..." : "Seleccione una región" },
                      ...regiones.map((reg) => ({
                        value: reg.ID_REGION,
                        label: reg.REGION
                      }))
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">DISTRITO</label>
                  <CompactSelect
                    value={distrito}
                    onChange={(e) => setDistrito(e.target.value)}
                    disabled={!region || cargandoDistritos}
                    placeholder={
                      !region 
                        ? "Primero seleccione una región" 
                        : cargandoDistritos 
                        ? "Cargando distritos..." 
                        : "Seleccione un distrito"
                    }
                    options={[
                      { 
                        value: "", 
                        label: !region 
                          ? "Primero seleccione una región" 
                          : cargandoDistritos 
                          ? "Cargando distritos..." 
                          : "Seleccione un distrito"
                      },
                      ...distritos.map((dist) => ({
                        value: dist.ID_DISTRITO,
                        label: dist.DISTRITO
                      }))
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">MONEDA</label>
                  <CompactSelect
                    value={moneda}
                    onChange={(e) => setMoneda(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                  >
                    <option value="" className="text-gray-500">Seleccione moneda</option>
                    <option value="SOLES" className="text-gray-900">SOLES (PEN)</option>
                    <option value="DOLARES" className="text-gray-900">DÓLARES (USD)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">ATENDIDO POR</label>
                  <CompactSelect
                    value={atendidoPor}
                    onChange={(e) => setAtendidoPor(e.target.value)}
                    placeholder="Seleccione un asesor"
                    options={[
                      { value: "", label: "Seleccione un asesor" },
                      { value: "HERVIN-9447673667", label: "HERVIN-9447673667" },
                      { value: "KIMBERLY-987560590", label: "KIMBERLY-987560590" },
                      { value: "ALVARO-935447178", label: "ÁLVARO-935447178" },
                      { value: "KRISTEL-916532849", label: "CRISTEL-916532849" },
                      { value: "ZEUS-908917879", label: "ZEUS-908917879" }
                    ]}
                  />
                </div>
              </div>
              </div>

              {/* Detalle de Productos */}
              <div className="mb-3 pb-3 border-b border-gray-300">
                <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Detalle de Productos
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Producto:</label>
                  <div className="relative">
                    <input
                      ref={productoInputRef}
                      type="text"
                      value={productoBusqueda}
                      onChange={handleProductoBusquedaChange}
                      onFocus={handleProductoFocus}
                      placeholder="Buscar producto..."
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                    />
                    {buscandoProductos && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>
                      </div>
                    )}
                  </div>
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
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Código:</label>
                  <input
                    type="text"
                    value={codigo}
                    readOnly
                    placeholder="Código del producto"
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-gray-100 text-sm text-gray-900 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">CLASIFICACIÓN:</label>
                  <CompactSelect
                    value={clasificacion}
                    onChange={handleClasificacionChange}
                    placeholder="Seleccione clasificación"
                    options={[
                      { value: "", label: "Seleccione clasificación" },
                      { value: "MALVINAS", label: "MALVINAS" },
                      { value: "FERRETERIA", label: "FERRETERIA" },
                      { value: "PROVINCIA", label: "PROVINCIA" },
                      { value: "CLIENTES FINALES", label: "CLIENTES FINALES" }
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Cantidad:</label>
                  <input
                    type="number"
                    value={cantidad}
                    onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
                    min="1"
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Precio de Venta:</label>
                  <input
                    type="number"
                    value={precioVenta}
                    onChange={(e) => setPrecioVenta(e.target.value)}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Total:</label>
                  <input
                    type="text"
                    value={`S/ ${total.toFixed(2)}`}
                    readOnly
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-gray-100 text-sm font-semibold text-gray-900"
                  />
                </div>
              </div>
              <button
                onClick={handleAgregarProducto}
                className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Agregar a la lista
              </button>
            </div>

            {/* Modal de Precios */}
            <Modal
              isOpen={modalPreciosAbierto}
              onClose={() => setModalPreciosAbierto(false)}
              title="Seleccionar Precio"
              size="md"
            >
              {cargandoPrecios ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
                </div>
              ) : preciosDisponibles.length === 0 ? (
                <div className="text-center py-8 text-gray-600">
                  No hay precios disponibles para este producto y clasificación.
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 mb-4">
                    Seleccione el precio para el producto: <strong>{producto}</strong>
                  </p>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {preciosDisponibles.map((precioItem, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => seleccionarPrecio(precioItem)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {precioItem.MEDIDA || precioItem.medida || "Sin medida"}
                            </div>
                            <div className="text-xs text-gray-500">
                              Código: {precioItem.CODIGO || precioItem.codigo || codigo}
                            </div>
                          </div>
                          <div className="text-lg font-bold text-blue-700">
                            S/ {(precioItem.PRECIO_UNIDAD_MEDIDA_VENTA || precioItem.precio_unidad_medida_venta || precioItem.precio || 0).toFixed(2)}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Modal>

              {/* Lista de Productos */}
              <div className="mb-4 pb-4 mt-4">
                <h2 className="text-sm font-bold text-gray-900 mb-3">Productos</h2>
                {productosLista.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                    <p className="text-center text-gray-600 py-4 text-sm">No hay productos agregados</p>
                  </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-blue-700 border-b-2 border-blue-800">
                          <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">CANTIDAD</th>
                          <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">UNIDAD</th>
                          <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">CÓDIGO</th>
                          <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">PRODUCTO</th>
                          <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">PRECIO UNIT.</th>
                          <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">SUBTOTAL</th>
                          <th className="px-3 py-2.5 text-center text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ACCIÓN</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {productosLista.map((prod) => (
                          <tr key={prod.id} className="hover:bg-slate-200 transition-colors">
                            <td className="px-3 py-2.5 whitespace-nowrap text-[11px] font-medium text-gray-900">{prod.cantidad}</td>
                            <td className="px-3 py-2.5 whitespace-nowrap text-[11px] text-gray-700">{prod.unidad}</td>
                            <td className="px-3 py-2.5 whitespace-nowrap text-[11px] font-medium text-gray-900">{prod.codigo}</td>
                            <td className="px-3 py-2.5 whitespace-nowrap text-[11px] text-gray-700">{prod.producto}</td>
                            <td className="px-3 py-2.5 whitespace-nowrap text-[11px] text-gray-700">S/ {(prod.precioUnit || 0).toFixed(2)}</td>
                            <td className="px-3 py-2.5 whitespace-nowrap text-[11px] text-gray-700 font-semibold">S/ {(prod.subtotal || 0).toFixed(2)}</td>
                            <td className="px-3 py-2.5 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center">
                                <button
                                  onClick={() => handleEliminarProducto(prod.id)}
                                  className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-red-600 border-2 border-red-700 hover:bg-red-700 hover:border-red-800 text-white rounded-lg text-[11px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  <span>Eliminar</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-slate-200 px-3 py-2.5 flex items-center justify-between border-t-2 border-slate-300">
                    <div></div>
                    <p className="text-[11px] font-bold text-gray-900">
                      TOTAL: S/ {totalGeneral.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
            </div>

              {/* Botón Registrar */}
              <div className="flex justify-end pt-2 mt-2 mb-4">
                <button
                  onClick={handleRegistrarCotizacion}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-bold text-sm transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  Registrar Cotización
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

    </div>
  );
}

