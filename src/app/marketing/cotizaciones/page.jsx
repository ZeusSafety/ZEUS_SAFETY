"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "../../../components/context/AuthContext";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";

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
        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed text-left flex items-center justify-between"
      >
        <span className={`${selectedOption ? "text-gray-900" : "text-gray-500"} whitespace-nowrap overflow-hidden text-ellipsis`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div
          className={`absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden ${
            openUpward ? 'bottom-full mb-1' : 'top-full'
          }`}
          style={{ maxHeight: '180px', overflowY: 'auto' }}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`w-full px-3 py-1.5 text-xs text-left hover:bg-blue-50 transition-colors ${
                value === option.value
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'text-gray-900'
              }`}
              style={{ lineHeight: '1.3' }}
            >
              {option.label}
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
  const [fechaEmision, setFechaEmision] = useState(new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }));
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
  // Datos de prueba para la tabla de productos
  const [productosLista, setProductosLista] = useState([
    {
      id: 1,
      cantidad: 10,
      unidad: "UN",
      codigo: "ARZ-359",
      producto: "Arnes de Seguridad Amarillo",
      precioUnit: 99.00,
      subtotal: 990.00
    },
    {
      id: 2,
      cantidad: 5,
      unidad: "CAJA",
      codigo: "GZ-AC01-7",
      producto: "Guantes Extremo Cut 5 - 7",
      precioUnit: 75.00,
      subtotal: 375.00
    },
    {
      id: 3,
      cantidad: 20,
      unidad: "UN",
      codigo: "RZ-3200",
      producto: "Respirador Monovia 3200",
      precioUnit: 13.00,
      subtotal: 260.00
    },
    {
      id: 4,
      cantidad: 3,
      unidad: "PAR",
      codigo: "BZ-MS01-36",
      producto: "Zapato Modelo Tokio - Talla 36",
      precioUnit: 55.50,
      subtotal: 166.50
    },
    {
      id: 5,
      cantidad: 15,
      unidad: "UN",
      codigo: "CZ-A02",
      producto: "Cinta Antideslizante 5 cm",
      precioUnit: 22.50,
      subtotal: 337.50
    }
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
        if (!response.ok) {
          throw new Error("Error al cargar regiones");
        }
        const data = await response.json();
        if (data.success && data.data) {
          setRegiones(data.data);
        }
      } catch (error) {
        console.error("Error al cargar regiones:", error);
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

    const nuevoProducto = {
      id: Date.now(),
      cantidad: cantidad,
      unidad: unidadMedida || "UN",
      codigo: codigo,
      producto: producto,
      precioUnit: parseFloat(precioVenta),
      subtotal: total
    };

    setProductosLista([...productosLista, nuevoProducto]);
    
    // Limpiar campos
    setProducto("");
    setCodigo("");
    setCantidad(1);
    setUnidadMedida("");
    setPrecioVenta("");
    setTotal(0.00);
  };

  const handleEliminarProducto = (id) => {
    setProductosLista(productosLista.filter(prod => prod.id !== id));
  };

  const handleRegistrarCotizacion = () => {
    if (productosLista.length === 0) {
      alert("Debe agregar al menos un producto");
      return;
    }

    // Obtener el nombre de la región y distrito seleccionados
    const regionSeleccionada = regiones.find(r => r.ID_REGION === region);
    const distritoSeleccionado = distritos.find(d => d.ID_DISTRITO === distrito);
    
    // Generar número de cotización (por ahora un número aleatorio, después se puede obtener de la API)
    const numeroCotizacion = `C001-${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`;

    // Generar el HTML del PDF
    const pdfHTML = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cotización Zeus Safety</title>
    <style>
        body {
            font-family: Arial, Helvetica, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f0f0f0;
            display: flex;
            justify-content: center;
        }
        .page-container {
            background-color: white;
            width: 100%;
            max-width: 900px;
            padding: 30px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            box-sizing: border-box;
            position: relative;
        }
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
        }
        .company-name {
            font-weight: bold;
            font-size: 15px;
            margin-bottom: 5px;
            display: block;
        }
        .ruc-box {
            width: 25%;
            border: 2px solid #5b9bd5;
            text-align: center;
            font-size: 14px;
            font-weight: bold;
        }
        .ruc-header {
            background-color: #5b9bd5;
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
        .client-info {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            font-weight: bold;
            margin-bottom: 15px;
            line-height: 1.8;
        }
        .client-left {
            width: 60%;
        }
        .client-right {
            width: 35%;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
            margin-bottom: 5px;
        }
        th, td {
            border: 1px solid #000;
            padding: 4px 5px;
            text-align: center;
        }
        .meta-table th {
            background-color: #5b9bd5;
            font-weight: bold;
            text-transform: uppercase;
        }
        .meta-table td {
            height: 20px;
        }
        .spacer {
            height: 10px;
        }
        .product-table th {
            background-color: #5b9bd5;
            text-transform: uppercase;
        }
        .product-table tr {
            height: 22px;
        }
        .col-cant { width: 8%; }
        .col-uni { width: 10%; }
        .col-cod { width: 12%; }
        .col-prod { width: 45%; }
        .col-punit { width: 12%; }
        .col-sub { width: 13%; }
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
        }
        .total-value {
            width: 95px;
            padding: 5px;
        }
        .bank-table th {
            background-color: #5b9bd5;
            text-transform: uppercase;
            font-size: 10px;
        }
        .bank-table td {
            font-size: 9px;
            border: 1px solid #000;
            padding: 3px;
        }
        .bank-table {
            border: 1px solid #000;
            margin-bottom: 20px;
        }
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
            background-color: #1f4e79;
            color: white;
            text-align: center;
            font-weight: bold;
            padding: 8px;
            font-size: 14px;
            text-transform: uppercase;
        }
        @media print {
            body { background-color: white; margin: 0; padding: 0; }
            .page-container { box-shadow: none; width: 100%; max-width: 100%; padding: 10px; }
        }
    </style>
</head>
<body>
    <div class="page-container">
        <header>
            <div class="logo-section">
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
                    <td>${fechaEmision || ''}</td>
                    <td>${formaPago || ''}</td>
                    <td>${regionSeleccionada?.REGION || ''}</td>
                    <td>${distritoSeleccionado?.DISTRITO || ''}</td>
                    <td>${moneda || ''}</td>
                    <td>${atendidoPor || ''}</td>
                </tr>
            </tbody>
        </table>
        <div class="spacer"></div>
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
            <tbody>
                ${productosLista.map(prod => `
                    <tr>
                        <td>${prod.cantidad}</td>
                        <td>${prod.unidad}</td>
                        <td>${prod.codigo}</td>
                        <td>${prod.producto}</td>
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
        <div class="total-section">
            <div class="total-box">
                <div class="total-label">TOTAL S/ :</div>
                <div class="total-value">S/ ${totalGeneral.toFixed(2)}</div>
            </div>
        </div>
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
                    <td style="border: 1px solid #000">CORRIENTE</td>
                    <td style="border: 1px solid #000">BCP Soles</td>
                    <td style="border: 1px solid #000">BUSINESS OF IMPORT & ZEUS S.A.C</td>
                    <td style="border: 1px solid #000">191-2233941-0-59</td>
                    <td style="border: 1px solid #000">00219100223394105953</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000">CORRIENTE</td>
                    <td style="border: 1px solid #000">BBVA Soles</td>
                    <td style="border: 1px solid #000">BUSINESS OF IMPORT & ZEUS S.A.C</td>
                    <td style="border: 1px solid #000">0011-0364-01000453-46</td>
                    <td style="border: 1px solid #000">011-364-000100045346-72</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000">CORRIENTE</td>
                    <td style="border: 1px solid #000">INTERBANK Soles</td>
                    <td style="border: 1px solid #000">BUSINESS OF IMPORT & ZEUS S.A.C</td>
                    <td style="border: 1px solid #000">2003006034134</td>
                    <td style="border: 1px solid #000"></td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000">CORRIENTE</td>
                    <td style="border: 1px solid #000">SCOTIABANK Soles</td>
                    <td style="border: 1px solid #000">BUSINESS OF IMPORT & ZEUS S.A.C</td>
                    <td style="border: 1px solid #000">000-4024129</td>
                    <td style="border: 1px solid #000">00908100000402412911</td>
                </tr>
            </tbody>
        </table>
        <footer class="footer">
            <div class="footer-stripe-light-suave"></div>
            <div class="footer-stripe-light"></div>
            <div class="footer-stripe-dark">
                ¡ EN ZEUS SAFETY, TU SEGURIDAD SIEMPRE SERÁ NUESTRA PRIORIDAD !
            </div>
        </footer>
    </div>
</body>
</html>
    `;

    // Abrir el PDF en una nueva ventana
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(pdfHTML);
      newWindow.document.close();
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
                      <p><span className="font-semibold text-gray-900">Teléfono:</span> {empresaInfo.telefono}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center lg:justify-end">
                    <div className="relative w-32 h-32">
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
                  <select
                    value={formaPago}
                    onChange={(e) => setFormaPago(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                  >
                    <option value="" className="text-gray-500">Seleccionar</option>
                    <option value="contado" className="text-gray-900">Contado</option>
                    <option value="credito" className="text-gray-900">Crédito</option>
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
                  <select
                    value={moneda}
                    onChange={(e) => setMoneda(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                  >
                    <option value="" className="text-gray-500">Seleccione moneda</option>
                    <option value="PEN" className="text-gray-900">Soles (PEN)</option>
                    <option value="USD" className="text-gray-900">Dólares (USD)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">ATENDIDO POR</label>
                  <select
                    value={atendidoPor}
                    onChange={(e) => setAtendidoPor(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                  >
                    <option value="" className="text-gray-500">Seleccione un asesor</option>
                    <option value="asesor1" className="text-gray-900">Asesor 1</option>
                    <option value="asesor2" className="text-gray-900">Asesor 2</option>
                  </select>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Producto:</label>
                  <input
                    type="text"
                    value={producto}
                    onChange={(e) => setProducto(e.target.value)}
                    placeholder="Nombre del producto"
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Código:</label>
                  <input
                    type="text"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    placeholder="Código del producto"
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
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
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Unidad de Medida:</label>
                  <select
                    value={unidadMedida}
                    onChange={(e) => setUnidadMedida(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 bg-white"
                  >
                    <option value="" className="text-gray-500">Seleccione una Unidad de Medida</option>
                    <option value="UN" className="text-gray-900">Unidad (UN)</option>
                    <option value="PAR" className="text-gray-900">Par (PAR)</option>
                    <option value="CAJA" className="text-gray-900">Caja (CAJA)</option>
                    <option value="DOCENA" className="text-gray-900">Docena (DOCENA)</option>
                  </select>
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
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">CANTIDAD</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">UNIDAD</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">CÓDIGO</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">PRODUCTO</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">PRECIO UNIT.</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">SUBTOTAL</th>
                          <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ACCIÓN</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {productosLista.map((prod) => (
                          <tr key={prod.id} className="hover:bg-slate-200 transition-colors">
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{prod.cantidad}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{prod.unidad}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{prod.codigo}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{prod.producto}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">S/ {prod.precioUnit.toFixed(2)}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700 font-semibold">S/ {prod.subtotal.toFixed(2)}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center">
                                <button
                                  onClick={() => handleEliminarProducto(prod.id)}
                                  className="flex items-center space-x-1 px-2.5 py-1 bg-red-600 border-2 border-red-700 hover:bg-red-700 hover:border-red-800 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
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
                  <div className="bg-slate-200 px-3 py-2 flex items-center justify-between border-t-2 border-slate-300">
                    <div></div>
                    <p className="text-[10px] font-medium text-gray-700">
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
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-bold text-sm transition-all duration-200 shadow-lg hover:shadow-xl"
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

