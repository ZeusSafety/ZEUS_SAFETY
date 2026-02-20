"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/context/AuthContext";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";
import Modal from "../../../components/ui/Modal";

export default function ListadoImportacionesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFinal, setFechaFinal] = useState("");
  const [numeroDespacho, setNumeroDespacho] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [selectedImportacion, setSelectedImportacion] = useState(null);
  const [importaciones, setImportaciones] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const [updateForm, setUpdateForm] = useState({
    fechaRegistro: "",
    numeroDespacho: "",
    redactadoPor: "",
    fechaLlegadaProductos: "",
    fechaAlmacen: "",
    productos: "",
    tipoCarga: "",
    estado: "",
    canal: "",
  });
  const [soloPendientes, setSoloPendientes] = useState(false);
  
  // Estados para barras de progreso
  const [mostrarProgreso, setMostrarProgreso] = useState(false);
  const [progresoPDF, setProgresoPDF] = useState(0);
  const [progresoActualizacion, setProgresoActualizacion] = useState(0);
  const [mensajeProgreso, setMensajeProgreso] = useState("");

  // Cargar importaciones desde la API
  useEffect(() => {
    if (user && !loading) {
      cargarImportaciones();
    }
  }, [user, loading]);

  const cargarImportaciones = async () => {
    try {
      setLoadingData(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch("/api/importaciones2026", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      const data = await response.json();

      // Mapear los datos de la API al formato esperado
      const mappedData = Array.isArray(data) ? data.map((item) => {
        // Normalizar estado: convertir "PRODUCCION" a "PRODUCCIÓN" si es necesario
        let estado = item.ESTADO_IMPORTACION || "";
        if (estado === "PRODUCCION") {
          estado = "PRODUCCIÓN";
        }

        // Asegurarse de que el ID sea un número y esté presente
        const id = typeof item.ID_IMPORTACIONES === 'number'
          ? item.ID_IMPORTACIONES
          : (item.ID_IMPORTACIONES ? parseInt(item.ID_IMPORTACIONES) : null);

        return {
          id: id, // ID de la fila seleccionada - se usará para el PUT
          fechaRegistro: item.FECHA_REGISTRO ? item.FECHA_REGISTRO.split(' ')[0] : "",
          numeroDespacho: item.NUMERO_DESPACHO || "",
          redactadoPor: item.RESPONSABLE || "",
          productos: item.PRODUCTOS || "",
          archivoPdf: item.ARCHIVO_PDF_URL || "",
          fechaLlegada: item.FECHA_LLEGADA_PRODUCTOS || "",
          tipoCarga: item.TIPO_CARGA || "",
          fechaAlmacen: item.FECHA_ALMACEN || "",
          estado: estado,
          canal: item.CANAL || "",
          fechaRecepcion: item.FECHA_RECEPCION || "",
          incidencias: item.INCIDENCIAS === "SI",
          // Datos originales completos de la API para referencia
          _original: item,
        };
      }) : [];

      setImportaciones(mappedData);
    } catch (err) {
      console.error('Error al cargar importaciones:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar las importaciones');
      setImportaciones([]);
    } finally {
      setLoadingData(false);
    }
  };


  // Filtrado automático
  const [filteredImportaciones, setFilteredImportaciones] = useState([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Detectar si es desktop y abrir sidebar automáticamente
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    // Establecer estado inicial
    handleResize();

    // Escuchar cambios de tamaño
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filtrado automático
  useEffect(() => {
    let filtered = [...importaciones];

    // Filtrar por número de despacho (búsqueda parcial, case insensitive)
    if (numeroDespacho.trim() !== "") {
      filtered = filtered.filter((item) =>
        (item.numeroDespacho || "").toUpperCase().includes(numeroDespacho.toUpperCase())
      );
    }

    // Filtrar por rango de fechas
    if (fechaInicio.trim() !== "") {
      // Convertir fecha de formato dd/mm/aaaa a Date para comparación
      const partsInicio = fechaInicio.split("/");
      if (partsInicio.length === 3) {
        const fechaInicioDate = new Date(parseInt(partsInicio[2]), parseInt(partsInicio[1]) - 1, parseInt(partsInicio[0]));
        filtered = filtered.filter((item) => {
          if (!item.fechaRegistro) return false;
          const itemDate = new Date(item.fechaRegistro);
          return itemDate >= fechaInicioDate;
        });
      }
    }

    if (fechaFinal.trim() !== "") {
      const partsFinal = fechaFinal.split("/");
      if (partsFinal.length === 3) {
        const fechaFinalDate = new Date(parseInt(partsFinal[2]), parseInt(partsFinal[1]) - 1, parseInt(partsFinal[0]));
        filtered = filtered.filter((item) => {
          if (!item.fechaRegistro) return false;
          const itemDate = new Date(item.fechaRegistro);
          return itemDate <= fechaFinalDate;
        });
      }
    }

    // Lógica de filtrado por recepción:
    // Por defecto (soloPendientes: false) -> Mostrar solo los recibidos (con fechaRecepcion)
    // Cuando está activo (soloPendientes: true) -> Mostrar solo los pendientes (sin fechaRecepcion)
    if (soloPendientes) {
      filtered = filtered.filter((item) =>
        !item.fechaRecepcion || item.fechaRecepcion.trim() === "" || item.fechaRecepcion === "null" || item.fechaRecepcion === "-"
      );
    }

    setFilteredImportaciones(filtered);
    setCurrentPage(1); // Resetear a la primera página cuando se filtra
  }, [importaciones, fechaInicio, fechaFinal, numeroDespacho, soloPendientes]);

  // Función para normalizar fechas para input type="date" (formato YYYY-MM-DD sin zona horaria)
  const normalizarFechaParaInput = (fechaString) => {
    if (!fechaString || fechaString === 'null' || fechaString === 'undefined' || fechaString === '') {
      return '';
    }
    try {
      // Si ya está en formato YYYY-MM-DD, devolverla tal cual
      if (/^\d{4}-\d{2}-\d{2}$/.test(fechaString)) {
        return fechaString;
      }

      let year, month, day;

      if (fechaString.includes('T') || fechaString.includes(' ')) {
        // Si tiene hora, tomar solo la parte de la fecha
        const partes = fechaString.split('T')[0].split(' ')[0];
        [year, month, day] = partes.split('-');
      } else if (fechaString.includes('-')) {
        // Fecha ISO: 2026-01-15
        [year, month, day] = fechaString.split('-');
      } else if (fechaString.includes('/')) {
        // Fecha en formato dd/mm/aaaa
        const partes = fechaString.split('/');
        if (partes.length === 3) {
          day = partes[0];
          month = partes[1];
          year = partes[2];
        } else {
          return '';
        }
      } else {
        return '';
      }

      // Asegurar formato con ceros a la izquierda
      const yearStr = String(year).padStart(4, '0');
      const monthStr = String(month).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');

      return `${yearStr}-${monthStr}-${dayStr}`;
    } catch {
      return '';
    }
  };

  const formatearFecha = (fechaString) => {
    if (!fechaString || fechaString === 'null' || fechaString === 'undefined' || fechaString === '') {
      return '-';
    }
    try {
      // Si la fecha ya está en formato dd/mm/aaaa, devolverla tal cual
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(fechaString)) {
        return fechaString;
      }

      // Para fechas en formato ISO (2026-01-15) o con hora, parsearlo sin zona horaria
      let fecha;
      if (fechaString.includes('T') || fechaString.includes(' ')) {
        // Si tiene hora, tomar solo la parte de la fecha
        const partes = fechaString.split('T')[0].split(' ')[0];
        const [year, month, day] = partes.split('-');
        fecha = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else if (fechaString.includes('-')) {
        // Fecha ISO sin hora: 2026-01-15
        const [year, month, day] = fechaString.split('-');
        fecha = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        // Intenta parsear como fecha normal
        fecha = new Date(fechaString);
      }

      if (isNaN(fecha.getTime())) {
        return fechaString;
      }

      return fecha.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return fechaString;
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

  // Función para obtener detalles de productos desde la API
  const obtenerDetallesProductos = async (numeroDespacho) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token no disponible");
      }

      console.log('🔍 Obteniendo detalles para despacho:', numeroDespacho);

      const response = await fetch(`/api/importaciones-vr01?despacho=${encodeURIComponent(numeroDespacho)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error al obtener detalles:', response.status, errorText);
        throw new Error(`Error al obtener detalles: ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 Datos recibidos de la API:', data);
      
      // Procesar detalles según diferentes estructuras posibles
      let detalles = [];
      
      // Estructura 1: data.detalles (array)
      if (data.detalles && Array.isArray(data.detalles) && data.detalles.length > 0) {
        detalles = data.detalles;
        console.log('✅ Detalles encontrados en data.detalles:', detalles.length);
      }
      // Estructura 2: data.DETALLES (array, mayúsculas)
      else if (data.DETALLES && Array.isArray(data.DETALLES) && data.DETALLES.length > 0) {
        detalles = data.DETALLES;
        console.log('✅ Detalles encontrados en data.DETALLES:', detalles.length);
      }
      // Estructura 3: Array directo
      else if (Array.isArray(data) && data.length > 0) {
        // Si es un array, podría ser que el primer elemento tenga detalles
        if (data[0] && data[0].detalles && Array.isArray(data[0].detalles)) {
          detalles = data[0].detalles;
          console.log('✅ Detalles encontrados en data[0].detalles:', detalles.length);
        } else {
          // O podría ser que cada elemento sea un detalle
          detalles = data;
          console.log('✅ Detalles encontrados como array directo:', detalles.length);
        }
      }
      // Estructura 4: Objeto con propiedades que podrían ser detalles
      else if (data && typeof data === 'object' && !Array.isArray(data)) {
        // Buscar cualquier propiedad que sea un array
        for (const key in data) {
          if (Array.isArray(data[key]) && data[key].length > 0) {
            detalles = data[key];
            console.log(`✅ Detalles encontrados en data.${key}:`, detalles.length);
            break;
          }
        }
      }

      if (detalles.length === 0) {
        console.warn('⚠️ No se encontraron detalles en ninguna estructura conocida');
        console.log('📋 Estructura completa de data:', JSON.stringify(data, null, 2));
        return [];
      }

      const productosMapeados = detalles.map((detalle, index) => ({
        id: Date.now() + index,
        producto: detalle.PRODUCTO || detalle.producto || detalle.NOMBRE || detalle.nombre || "",
        codigo: detalle.CODIGO || detalle.codigo || detalle.CODIGO_PRODUCTO || "",
        unidadMedida: detalle.UNIDAD_MEDIDA || detalle.unidadMedida || detalle.UNIDAD || detalle.unidad || "",
        cantidad: String(detalle.CANTIDAD || detalle.cantidad || detalle.CANTIDAD_INICIAL || "0"),
        cantidadCaja: String(detalle.CANTIDAD_CAJA || detalle.cantidadCaja || detalle.CANTIDAD_EN_CAJA || detalle.cantidadEnCaja || ""),
      }));

      console.log('✅ Productos mapeados:', productosMapeados.length);
      return productosMapeados;
    } catch (error) {
      console.error("❌ Error al obtener detalles de productos:", error);
      return [];
    }
  };

  // Función para generar el HTML de la plantilla con los datos
  const generarHTMLPlantilla = (listaProductos, formData, logoBase64 = null) => {
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

  // Función para generar el PDF desde el HTML con progreso
  const generarPDF = async (listaProductos, formData, onProgress) => {
    try {
      setMensajeProgreso("Preparando datos del PDF...");
      onProgress?.(5);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Convertir el logo a base64 antes de generar el HTML
      setMensajeProgreso("Cargando logo...");
      onProgress?.(10);
      const logoUrl = "/images/zeus.logooo.png";
      let logoBase64 = null;
      try {
        logoBase64 = await convertirImagenABase64(logoUrl);
      } catch (error) {
        console.warn("No se pudo cargar el logo, se usará un placeholder:", error);
      }

      setMensajeProgreso("Generando plantilla HTML...");
      onProgress?.(20);
      await new Promise(resolve => setTimeout(resolve, 100));
      const html = generarHTMLPlantilla(listaProductos, formData, logoBase64);

      // Crear un elemento temporal para renderizar el HTML
      setMensajeProgreso("Renderizando contenido...");
      onProgress?.(30);
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '850px';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.innerHTML = html;
      document.body.appendChild(tempDiv);

      // Esperar a que las imágenes se carguen (con timeout para evitar esperas infinitas)
      setMensajeProgreso("Cargando imágenes...");
      onProgress?.(40);
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
      setMensajeProgreso("Finalizando renderizado...");
      onProgress?.(50);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Importar html2canvas y jsPDF dinámicamente
      setMensajeProgreso("Cargando librerías de PDF...");
      onProgress?.(60);
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      // Convertir el HTML a canvas
      setMensajeProgreso("Convirtiendo a imagen...");
      onProgress?.(70);
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
      setMensajeProgreso("Creando archivo PDF...");
      onProgress?.(85);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const pxToMm = 25.4 / 96;
      const imgWidthMm = (canvas.width * pxToMm) / 2;
      const imgHeightMm = (canvas.height * pxToMm) / 2;
      const ratio = Math.min((pdfWidth - 20) / imgWidthMm, (pdfHeight - 20) / imgHeightMm);

      pdf.addImage(canvas.toDataURL('image/png', 1.0), 'PNG', (pdfWidth - (imgWidthMm * ratio)) / 2, 10, imgWidthMm * ratio, imgHeightMm * ratio);

      // Generar blob y URL
      setMensajeProgreso("Finalizando PDF...");
      onProgress?.(95);
      const blob = pdf.output('blob');

      // Limpiar el elemento temporal
      document.body.removeChild(tempDiv);

      setMensajeProgreso("PDF generado exitosamente");
      onProgress?.(100);
      await new Promise(resolve => setTimeout(resolve, 200));

      return blob;
    } catch (error) {
      console.error("Error al generar el PDF:", error);
      throw error;
    }
  };

  const handleGuardarCambios = async () => {
    try {
      if (!selectedImportacion) {
        setError('No se ha seleccionado una importación');
        return;
      }

      // Obtener el ID de la importación seleccionada (de la fila de la tabla)
      // Intentar obtener el ID de múltiples fuentes posibles
      const importacionId = selectedImportacion.id
        || selectedImportacion.ID_IMPORTACIONES
        || selectedImportacion._original?.ID_IMPORTACIONES
        || selectedImportacion._original?.id;

      console.log('🔍 ID obtenido de selectedImportacion:', importacionId);
      console.log('🔍 selectedImportacion completa:', JSON.stringify(selectedImportacion, null, 2));

      if (!importacionId && importacionId !== 0) {
        setError('No se pudo obtener el ID de la importación. Por favor, intente nuevamente.');
        console.error('❌ selectedImportacion sin ID:', selectedImportacion);
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      // Preparar el payload según la estructura esperada por la API
      // Convertir "PRODUCCIÓN" de vuelta a "PRODUCCION" para la API
      let estadoParaAPI = updateForm.estado;
      if (estadoParaAPI === "PRODUCCIÓN") {
        estadoParaAPI = "PRODUCCION";
      }

      // Asegurarse de que el ID sea un número
      const idNumerico = typeof importacionId === 'number' ? importacionId : parseInt(importacionId);

      if (isNaN(idNumerico)) {
        setError('El ID de la importación no es válido.');
        console.error('ID inválido:', importacionId);
        return;
      }

      // Preparar el payload según la estructura esperada por la API
      // El backend espera:
      // - id en la raíz del body (data["id"])
      // - parámetro area=importacion en la URL
      // - solo los campos que el backend espera para area=importacion
      // - productos SIEMPRE debe estar presente (requerido por el backend)
      const productos = updateForm.productos || selectedImportacion.productos || "";
      
      // Para fechas: si están vacías, enviar null en lugar de string vacío
      // Esto permite que el backend maneje campos opcionales correctamente
      const fechaLlegada = updateForm.fechaLlegadaProductos || selectedImportacion.fechaLlegada;
      const fechaAlmacen = updateForm.fechaAlmacen || selectedImportacion.fechaAlmacen;
      const tipoCarga = updateForm.tipoCarga || selectedImportacion.tipoCarga;
      const canal = updateForm.canal || selectedImportacion.canal;

      // Normalizar fechas para comparación (formato YYYY-MM-DD)
      const normalizarFechaParaComparacion = (fecha) => {
        if (!fecha) return null;
        if (fecha.includes('T')) return fecha.split('T')[0];
        if (fecha.includes(' ')) return fecha.split(' ')[0];
        return fecha;
      };

      const fechaLlegadaOriginal = normalizarFechaParaComparacion(selectedImportacion.fechaLlegada);
      const fechaLlegadaNueva = normalizarFechaParaComparacion(fechaLlegada);

      // Detectar si cambió solo el campo FECHA_LLEGADA_PRODUCTOS
      const cambioFechaLLegada = fechaLlegadaOriginal !== fechaLlegadaNueva && fechaLlegadaNueva !== null;

      // Inicializar barras de progreso
      setMostrarProgreso(true);
      setProgresoPDF(0);
      setProgresoActualizacion(0);
      setMensajeProgreso("Iniciando actualización...");

      let pdfBlob = null;
      
      // Si cambió la fecha de llegada de productos, generar nuevo PDF
      if (cambioFechaLLegada) {
        try {
          console.log('📄 Detectado cambio en FECHA_LLEGADA_PRODUCTOS. Generando nuevo PDF...');
          setMensajeProgreso("Obteniendo detalles de productos...");
          setProgresoPDF(5);
          
          // Obtener detalles de productos desde la API
          const numeroDespacho = selectedImportacion.numeroDespacho || updateForm.numeroDespacho;
          const detallesProductos = await obtenerDetallesProductos(numeroDespacho);
          
          if (detallesProductos.length === 0) {
            console.warn('⚠️ No se encontraron detalles de productos. Se generará PDF sin productos.');
          }

          // Preparar datos del formulario para el PDF
          const formDataPDF = {
            fechaRegistro: selectedImportacion.fechaRegistro || updateForm.fechaRegistro,
            numeroDespacho: numeroDespacho,
            responsable: selectedImportacion.redactadoPor || updateForm.redactadoPor || "Admin",
            fechaLlegada: fechaLlegadaNueva,
            tipoCarga: tipoCarga || selectedImportacion.tipoCarga || "",
          };

          // Generar PDF con callback de progreso
          pdfBlob = await generarPDF(detallesProductos, formDataPDF, (progreso) => {
            setProgresoPDF(progreso);
          });
          console.log('✅ PDF generado exitosamente');
        } catch (pdfError) {
          console.error('❌ Error al generar PDF:', pdfError);
          setError('Error al generar el PDF. Por favor, intente nuevamente.');
          setMostrarProgreso(false);
          setProgresoPDF(0);
          setProgresoActualizacion(0);
          setMensajeProgreso("");
          return;
        }
      }
      // Si no hay cambio de fecha, no establecer progresoPDF (se mantiene en 0 y no se muestra la barra)

      // Preparar la petición según si hay PDF o no
      setMensajeProgreso("Preparando datos para actualizar...");
      setProgresoActualizacion(10);
      await new Promise(resolve => setTimeout(resolve, 200));

      if (pdfBlob) {
        // Si hay PDF, usar FormData para enviar el archivo
        setMensajeProgreso("Preparando archivo PDF...");
        setProgresoActualizacion(20);
        await new Promise(resolve => setTimeout(resolve, 200));

        const formDataToSend = new FormData();
        
        // Agregar el archivo PDF
        const nombreArchivo = `Ficha_Importacion_${selectedImportacion.numeroDespacho || updateForm.numeroDespacho}_${Date.now()}.pdf`;
        const archivoPDF = new File([pdfBlob], nombreArchivo, { type: 'application/pdf' });
        formDataToSend.append('archivo_pdf', archivoPDF);

        // Agregar los demás campos como texto
        formDataToSend.append('id', idNumerico.toString());
        formDataToSend.append('productos', productos);
        formDataToSend.append('fecha_llegada_productos', fechaLlegadaNueva || '');
        formDataToSend.append('fecha_almacen', fechaAlmacen || '');
        formDataToSend.append('tipo_carga', tipoCarga || '');
        formDataToSend.append('estado_importacion', estadoParaAPI || '');
        formDataToSend.append('canal', canal || '');
        formDataToSend.append('responsable', selectedImportacion.redactadoPor || updateForm.redactadoPor || 'Admin');

        console.log('📤 Enviando FormData con PDF');
        setMensajeProgreso("Enviando datos al servidor...");
        setProgresoActualizacion(40);

        const response = await fetch("/api/importaciones2026?area=importacion", {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${token}`,
            // NO incluir 'Content-Type': el navegador lo establecerá automáticamente con el boundary para FormData
          },
          body: formDataToSend,
        });

        setMensajeProgreso("Procesando respuesta del servidor...");
        setProgresoActualizacion(70);
        await new Promise(resolve => setTimeout(resolve, 300));

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("token");
            router.push("/login");
            setMostrarProgreso(false);
            return;
          }
          const errorData = await response.json();
          console.error('❌ Error de respuesta:', errorData);
          setMostrarProgreso(false);
          throw new Error(errorData.error || errorData.ERROR || `Error ${response.status}`);
        }

        setMensajeProgreso("Guardando cambios en la base de datos...");
        setProgresoActualizacion(90);
        await new Promise(resolve => setTimeout(resolve, 300));
      } else {
        // Si no hay PDF, usar JSON como antes
        setMensajeProgreso("Preparando datos para actualizar...");
        setProgresoActualizacion(30);
        await new Promise(resolve => setTimeout(resolve, 200));

        const payload = {
          id: idNumerico, // ID en la raíz del body (requerido por el backend)
          productos: productos, // SIEMPRE requerido por el backend
          fecha_llegada_productos: fechaLlegada || null,
          fecha_almacen: fechaAlmacen || null,
          tipo_carga: tipoCarga || null,
          estado_importacion: estadoParaAPI || "",
          canal: canal || null,
        };

        console.log('📤 Enviando payload JSON:', JSON.stringify(payload, null, 2));
        setMensajeProgreso("Enviando datos al servidor...");
        setProgresoActualizacion(50);

        const response = await fetch("/api/importaciones2026?area=importacion", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        setMensajeProgreso("Procesando respuesta del servidor...");
        setProgresoActualizacion(70);
        await new Promise(resolve => setTimeout(resolve, 300));

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("token");
            router.push("/login");
            setMostrarProgreso(false);
            return;
          }
          const errorData = await response.json();
          console.error('❌ Error de respuesta:', errorData);
          setMostrarProgreso(false);
          throw new Error(errorData.error || errorData.ERROR || `Error ${response.status}`);
        }

        setMensajeProgreso("Guardando cambios en la base de datos...");
        setProgresoActualizacion(90);
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Finalizar progreso
      setMensajeProgreso("Actualización completada");
      setProgresoActualizacion(100);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Ocultar barra de progreso
      setMostrarProgreso(false);
      setProgresoPDF(0);
      setProgresoActualizacion(0);
      setMensajeProgreso("");

      // Cerrar modal de actualización
      setIsUpdateModalOpen(false);
      setSelectedImportacion(null);
      setError(null);

      // Mostrar modal de éxito
      setIsSuccessModalOpen(true);

      // Recargar datos
      await cargarImportaciones();
    } catch (err) {
      console.error('Error al guardar cambios:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar los cambios');
      setMostrarProgreso(false);
      setProgresoPDF(0);
      setProgresoActualizacion(0);
      setMensajeProgreso("");
    }
  };

  const totalPages = Math.ceil(filteredImportaciones.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentImportaciones = filteredImportaciones.slice(startIndex, endIndex);

  const getEstadoBadge = (estado) => {
    const estadoUpper = String(estado || '').toUpperCase();
    const estados = {
      PENDIENTE: "bg-gradient-to-br from-gray-500 to-gray-600",
      PRODUCCION: "bg-gradient-to-br from-red-600 to-red-700",
      "PRODUCCIÓN": "bg-gradient-to-br from-red-600 to-red-700",
      TRANSITO: "bg-gradient-to-br from-yellow-500 to-yellow-600",
      ETA: "bg-gradient-to-br from-green-600 to-green-700",
      RECIBIDO: "bg-gradient-to-br from-blue-600 to-blue-700",
    };
    return estados[estadoUpper] || estados[estado] || "bg-gradient-to-br from-gray-500 to-gray-600";
  };

  const getCanalBadge = (canal) => {
    if (!canal) return "";
    const canales = {
      ROJO: "bg-gradient-to-br from-red-600 to-red-700",
      AMARILLO: "bg-gradient-to-br from-yellow-500 to-yellow-600",
      VERDE: "bg-gradient-to-br from-green-600 to-green-700",
    };
    return canales[canal] || "bg-gradient-to-br from-gray-500 to-gray-600";
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F7FAFF' }}>
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
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'var(--font-poppins)' }}>Listado de Importaciones</h1>
                    <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: 'var(--font-poppins)' }}>
                      Consulta y gestión de todas las importaciones registradas
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

              {/* Filtros */}
              <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <label className="block text-xs font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>Fecha Inicio</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="dd/mm/aaaa"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                      className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-300 placeholder:text-gray-400 text-gray-900"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                    />
                    <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="relative">
                  <label className="block text-xs font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>Fecha Final</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="dd/mm/aaaa"
                      value={fechaFinal}
                      onChange={(e) => setFechaFinal(e.target.value)}
                      className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-300 placeholder:text-gray-400 text-gray-900"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                    />
                    <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="relative">
                  <label className="block text-xs font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>N° de Despacho</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar..."
                      value={numeroDespacho}
                      onChange={(e) => setNumeroDespacho(e.target.value)}
                      className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#002D5A] focus:border-[#002D5A] transition-all duration-200 hover:border-[#002D5A] placeholder:text-gray-400 text-gray-900"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                    />
                    <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                <div className="flex flex-col justify-end">
                  <button
                    onClick={() => setSoloPendientes(!soloPendientes)}
                    className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 shadow-sm hover:shadow-md active:scale-95 ${soloPendientes
                      ? "bg-gradient-to-br from-[#002D5A] to-[#003B75] text-white border-2 border-[#001F3D]"
                      : "bg-white text-gray-700 border-2 border-gray-300 hover:border-[#002D5A] hover:text-[#002D5A]"
                      }`}
                    style={{ fontFamily: 'var(--font-poppins)', height: '42px' }}
                  >
                    <svg className={`w-5 h-5 ${soloPendientes ? "text-white" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Pendientes de Recepción</span>
                    {soloPendientes && (
                      <span className="flex h-2 w-2 rounded-full bg-white animate-pulse ml-1"></span>
                    )}
                  </button>
                </div>
              </div>

              {/* Tabla */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#002D5A] border-b-2 border-[#001F3D]">
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">FECHA REGISTRO</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">N° DESPACHO</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">REDACTADO POR</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">PRODUCTOS</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ARCHIVO_PDF</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">FECHA LLEGADA</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">TIPO DE CARGA</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">FECHA DE ALMACÉN</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ESTADO</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">CANAL</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">FECHA<br />RECEPCIÓN</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">INCIDENCIAS</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {loadingData ? (
                        <tr>
                          <td colSpan={12} className="px-3 py-8 text-center">
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#002D5A]"></div>
                            </div>
                          </td>
                        </tr>
                      ) : filteredImportaciones.length === 0 ? (
                        <tr>
                          <td colSpan={12} className="px-3 py-8 text-center text-gray-500">
                            Sin registros
                          </td>
                        </tr>
                      ) : (
                        currentImportaciones.map((importacion) => (
                          <tr key={importacion.id} className="hover:bg-slate-200 transition-colors">
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{formatearFecha(importacion.fechaRegistro)}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] font-bold text-gray-700">{importacion.numeroDespacho}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{importacion.redactadoPor || "-"}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{importacion.productos || "-"}</td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              {importacion.archivoPdf && importacion.archivoPdf.trim() !== "" ? (
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const url = importacion.archivoPdf;

                                    if (!url || url.trim() === "") {
                                      alert("No hay enlace PDF disponible");
                                      return;
                                    }

                                    // Solo abrir en nueva pestaña, nunca cambiar la pestaña actual
                                    window.open(url, "_blank", "noopener,noreferrer");
                                  }}
                                  className="inline-flex items-center space-x-1 px-2.5 py-1 bg-[#E63946] text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                                  title="Abrir archivo PDF"
                                >
                                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ pointerEvents: 'none' }}>
                                    <path d="M6 2C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V7.41421C19 7.149 18.8946 6.89464 18.7071 6.70711L13.2929 1.29289C13.1054 1.10536 12.851 1 12.5858 1H6Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
                                    <path d="M13 1V6H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    <text x="12" y="15" fontSize="6" fill="currentColor" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="0.3">PDF</text>
                                  </svg>
                                  <span style={{ pointerEvents: 'none' }}>PDF</span>
                                </button>
                              ) : (
                                <button
                                  className="inline-flex items-center space-x-1 px-2.5 py-1 bg-gradient-to-br from-gray-400 to-gray-500 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                                  disabled
                                  title="Sin archivo PDF"
                                >
                                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ pointerEvents: 'none' }}>
                                    <path d="M6 2C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V7.41421C19 7.149 18.8946 6.89464 18.7071 6.70711L13.2929 1.29289C13.1054 1.10536 12.851 1 12.5858 1H6Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
                                    <path d="M13 1V6H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    <text x="12" y="15" fontSize="6" fill="currentColor" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="0.3">PDF</text>
                                  </svg>
                                  <span style={{ pointerEvents: 'none' }}>PDF</span>
                                </button>
                              )}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{formatearFecha(importacion.fechaLlegada)}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] font-bold text-gray-700">{importacion.tipoCarga || "-"}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{formatearFecha(importacion.fechaAlmacen)}</td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              {importacion.estado && (
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold text-white shadow-sm transition-all duration-200 ${getEstadoBadge(importacion.estado)}`} style={{ fontFamily: 'var(--font-poppins)' }}>
                                  {importacion.estado}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              {importacion.canal && (
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold text-white shadow-sm transition-all duration-200 ${getCanalBadge(importacion.canal)}`} style={{ fontFamily: 'var(--font-poppins)' }}>
                                  {importacion.canal}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{formatearFecha(importacion.fechaRecepcion)}</td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold text-white shadow-sm transition-all duration-200 ${importacion.incidencias
                                ? "bg-gradient-to-br from-red-600 to-red-700"
                                : "bg-gradient-to-br from-green-600 to-green-700"
                                }`} style={{ fontFamily: 'var(--font-poppins)' }}>
                                {importacion.incidencias ? "SI" : "NO"}
                              </span>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <button
                                onClick={() => {
                                  console.log('🔍 Seleccionando importación:', importacion);
                                  console.log('🔍 ID de la importación:', importacion.id);
                                  console.log('🔍 ID original:', importacion._original?.ID_IMPORTACIONES);

                                  // Guardar la importación completa para asegurar que el ID esté disponible
                                  setSelectedImportacion({
                                    ...importacion,
                                    // Asegurar que el ID esté presente
                                    id: importacion.id || importacion._original?.ID_IMPORTACIONES,
                                  });

                                  setUpdateForm({
                                    fechaRegistro: importacion.fechaRegistro || "",
                                    numeroDespacho: importacion.numeroDespacho || "",
                                    redactadoPor: importacion.redactadoPor || "",
                                    fechaLlegadaProductos: normalizarFechaParaInput(importacion.fechaLlegada) || "",
                                    fechaAlmacen: normalizarFechaParaInput(importacion.fechaAlmacen) || "",
                                    productos: importacion.productos || "",
                                    tipoCarga: importacion.tipoCarga || "",
                                    estado: importacion.estado === "PRODUCCIÓN" ? "PRODUCCION" : importacion.estado || "",
                                    canal: importacion.canal || "",
                                  });
                                  setIsUpdateModalOpen(true);
                                }}
                                className="inline-flex items-center justify-center px-3 py-1.5 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                                title="Actualizar importación"
                                style={{ fontFamily: 'var(--font-poppins)' }}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} style={{ pointerEvents: 'none' }}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {/* Paginación */}
                <div className="bg-slate-200 px-3 py-2 flex items-center justify-between border-t-2 border-slate-300">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    «
                  </button>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    &lt;
                  </button>
                  <span className="text-[10px] text-gray-700 font-medium">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    &gt;
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    »
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal de Actualizar */}
      <Modal
        isOpen={isUpdateModalOpen}
        onClose={() => {
          if (mostrarProgreso) return; // No permitir cerrar durante el progreso
          setIsUpdateModalOpen(false);
          setSelectedImportacion(null);
          setUpdateForm({
            fechaRegistro: "",
            numeroDespacho: "",
            redactadoPor: "",
            fechaLlegadaProductos: "",
            fechaAlmacen: "",
            productos: "",
            tipoCarga: "",
            estado: "",
            canal: "",
          });
          setMostrarProgreso(false);
          setProgresoPDF(0);
          setProgresoActualizacion(0);
          setMensajeProgreso("");
          setError(null);
        }}
        title={`Actualizar Importación - ${selectedImportacion?.numeroDespacho || ""}`}
        size="lg"
        hideFooter
      >
        <div className="space-y-4">
          {/* Mensaje de error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Fecha Registro - No editable */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5" style={{ fontFamily: 'var(--font-poppins)' }}>
              Fecha Registro
            </label>
            <input
              type="text"
              value={formatearFecha(updateForm.fechaRegistro)}
              disabled
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm text-gray-500 bg-gray-100 cursor-not-allowed"
              style={{ fontFamily: 'var(--font-poppins)' }}
            />
          </div>

          {/* N° de Despacho - No editable */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5" style={{ fontFamily: 'var(--font-poppins)' }}>
              N° de Despacho
            </label>
            <input
              type="text"
              value={updateForm.numeroDespacho}
              disabled
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm text-gray-500 bg-gray-100 cursor-not-allowed"
              style={{ fontFamily: 'var(--font-poppins)' }}
            />
          </div>

          {/* Redactado Por - No editable */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5" style={{ fontFamily: 'var(--font-poppins)' }}>
              Redactado Por
            </label>
            <input
              type="text"
              value={updateForm.redactadoPor}
              disabled
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm text-gray-500 bg-gray-100 cursor-not-allowed"
              style={{ fontFamily: 'var(--font-poppins)' }}
            />
          </div>

          {/* Fecha Llegada de Productos - Editable */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5" style={{ fontFamily: 'var(--font-poppins)' }}>
              Fecha Llegada de Productos
            </label>
            <input
              type="date"
              value={updateForm.fechaLlegadaProductos}
              onChange={(e) => setUpdateForm({ ...updateForm, fechaLlegadaProductos: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white transition-all duration-200 hover:border-blue-300"
              style={{ fontFamily: 'var(--font-poppins)' }}
            />
          </div>

          {/* Fecha Almacén - Editable */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5" style={{ fontFamily: 'var(--font-poppins)' }}>
              Fecha Almacén
            </label>
            <input
              type="date"
              value={updateForm.fechaAlmacen}
              onChange={(e) => setUpdateForm({ ...updateForm, fechaAlmacen: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white transition-all duration-200 hover:border-blue-300"
              style={{ fontFamily: 'var(--font-poppins)' }}
            />
          </div>

          {/* Productos - Editable */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5" style={{ fontFamily: 'var(--font-poppins)' }}>
              Productos
            </label>
            <input
              type="text"
              value={updateForm.productos}
              onChange={(e) => setUpdateForm({ ...updateForm, productos: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white transition-all duration-200 hover:border-blue-300"
              style={{ fontFamily: 'var(--font-poppins)' }}
            />
          </div>

          {/* Tipo de Carga - Combo box editable */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5" style={{ fontFamily: 'var(--font-poppins)' }}>
              Tipo de Carga
            </label>
            <select
              value={updateForm.tipoCarga}
              onChange={(e) => setUpdateForm({ ...updateForm, tipoCarga: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white transition-all duration-200 hover:border-blue-300"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              <option value="">Seleccionar tipo de carga</option>
              <option value="1 CONTENEDOR 40 HQ">1 CONTENEDOR 40 HQ</option>
              <option value="1 CONTENEDOR 40 NOR">1 CONTENEDOR 40 NOR</option>
              <option value="1 CONTENEDOR 20 ST">1 CONTENEDOR 20 ST</option>
              <option value="CONSOLIDADO">CONSOLIDADO</option>
            </select>
          </div>

          {/* Estado - Combo box editable */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5" style={{ fontFamily: 'var(--font-poppins)' }}>
              Estado
            </label>
            <select
              value={updateForm.estado}
              onChange={(e) => setUpdateForm({ ...updateForm, estado: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white transition-all duration-200 hover:border-blue-300"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              <option value="">Seleccionar estado</option>
              <option value="PENDIENTE">PENDIENTE</option>
              <option value="PRODUCCION">PRODUCCIÓN</option>
              <option value="TRANSITO">TRANSITO</option>
              <option value="ETA">ETA</option>
            </select>
          </div>

          {/* Canal - Combo box editable */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5" style={{ fontFamily: 'var(--font-poppins)' }}>
              Canal
            </label>
            <select
              value={updateForm.canal}
              onChange={(e) => setUpdateForm({ ...updateForm, canal: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white transition-all duration-200 hover:border-blue-300"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              <option value="">Seleccione un Canal</option>
              <option value="ROJO">ROJO</option>
              <option value="VERDE">VERDE</option>
              <option value="AMARILLO">AMARILLO</option>
            </select>
          </div>

          {/* Barras de Progreso */}
          {mostrarProgreso && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              {/* Mensaje de progreso */}
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                  {mensajeProgreso}
                </p>
              </div>

              {/* Barra de progreso del PDF (solo si se está generando) */}
              {progresoPDF > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600" style={{ fontFamily: 'var(--font-poppins)' }}>
                      {progresoPDF < 100 ? "Generando PDF..." : "PDF generado"}
                    </span>
                    <span className="text-xs font-bold text-[#002D5A]" style={{ fontFamily: 'var(--font-poppins)' }}>
                      {progresoPDF}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-300 ease-out ${
                        progresoPDF === 100 
                          ? "bg-gradient-to-r from-green-500 to-green-600" 
                          : "bg-gradient-to-r from-blue-500 to-blue-600"
                      }`}
                      style={{ width: `${progresoPDF}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Barra de progreso de actualización */}
              {progresoActualizacion > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600" style={{ fontFamily: 'var(--font-poppins)' }}>
                      {progresoActualizacion < 100 ? "Actualizando importación..." : "Actualización completada"}
                    </span>
                    <span className="text-xs font-bold text-[#002D5A]" style={{ fontFamily: 'var(--font-poppins)' }}>
                      {progresoActualizacion}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-300 ease-out ${
                        progresoActualizacion === 100 
                          ? "bg-gradient-to-r from-green-500 to-green-600" 
                          : "bg-gradient-to-r from-blue-500 to-blue-600"
                      }`}
                      style={{ width: `${progresoActualizacion}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Botones */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                if (mostrarProgreso) return; // Deshabilitar cancelar durante el progreso
                setIsUpdateModalOpen(false);
                setSelectedImportacion(null);
                setUpdateForm({
                  fechaRegistro: "",
                  numeroDespacho: "",
                  redactadoPor: "",
                  fechaLlegadaProductos: "",
                  fechaAlmacen: "",
                  productos: "",
                  tipoCarga: "",
                  estado: "",
                  canal: "",
                });
                setError(null);
                setMostrarProgreso(false);
                setProgresoPDF(0);
                setProgresoActualizacion(0);
                setMensajeProgreso("");
              }}
              disabled={mostrarProgreso}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                mostrarProgreso
                  ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                  : "text-gray-900 bg-gray-100 hover:bg-gray-200"
              }`}
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardarCambios}
              disabled={mostrarProgreso}
              className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all duration-200 shadow-sm ${
                mostrarProgreso
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-br from-[#002D5A] to-[#002D5A] hover:from-blue-800 hover:to-blue-900 hover:shadow-md hover:scale-105 active:scale-[0.98]"
              }`}
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              {mostrarProgreso ? "Procesando..." : "Guardar Cambios"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de Éxito */}
      <Modal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title="Éxito"
        size="md"
        primaryButtonText="Aceptar"
        onPrimaryButtonClick={() => setIsSuccessModalOpen(false)}
        hideFooter={false}
      >
        <div className="text-center py-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
            Importación Gestionada Exitosamente
          </p>
          <p className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-poppins)' }}>
            Los cambios se han guardado correctamente.
          </p>
        </div>
      </Modal>
    </div>
  );
}

