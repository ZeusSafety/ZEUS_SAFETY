"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/context/AuthContext";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";
import Modal from "../../../components/ui/Modal";
// html2canvas se importará dinámicamente

export default function GenerarImagenStockPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [modalMensaje, setModalMensaje] = useState({ open: false, tipo: "success", mensaje: "" });

  // Distribución de categorías en 3 columnas
  const columnasDistribucion = {
    columna1: [
      'TOMACORRIENTE',
      'CONOS',
      'RESPIRADORES - FILTROS',
      'LENTES',
      'ULTRAFLEX',
      'PUFLEX',
      'CALZADO - TOKIO'
    ],
    columna2: [
      'IMPERMEABLE',
      'NITRON',
      'NITRIFLEX',
      'LASTIFLEX',
      'TRIMAX',
      'DUMAX',
      'FORTFLEX',
      'STIFLEX',
      'ECONOFLEX',
      'DURAFLEX',
      'SOLDADOR',
      'CALIBRE',
      'PONCHO',
      'PESADO'
    ],
    columna3: [
      'CUERO',
      'CUT',
      'PVC',
      'CASCO',
      'OTROS PRODUCTOS',
      'CALZADO - DIALECTRICO',
      'CALZADO - BUFFALO'
    ]
  };

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

  useEffect(() => {
    if (user) {
      cargarDatos();
    }
  }, [user]);

  // Ocultar el chatbot en esta página
  useEffect(() => {
    const hideChatbot = () => {
      // Ocultar botón del chatbot
      const chatbotButton = document.querySelector('[aria-label="Abrir chatbot"]');
      if (chatbotButton) {
        chatbotButton.style.display = 'none';
      }
      
      // Ocultar ventana del chatbot si está abierta
      const chatbotWindow = document.querySelector('.fixed.bottom-24.right-6');
      if (chatbotWindow && chatbotWindow.style.display !== 'none') {
        chatbotWindow.style.display = 'none';
      }
    };

    // Ocultar inmediatamente
    hideChatbot();

    // Usar MutationObserver para detectar cuando se agrega el chatbot al DOM
    const observer = new MutationObserver(hideChatbot);
    observer.observe(document.body, { childList: true, subtree: true });

    // También verificar periódicamente (por si acaso)
    const interval = setInterval(hideChatbot, 100);

    return () => {
      observer.disconnect();
      clearInterval(interval);
      // Restaurar al salir de la página
      const chatbotButton = document.querySelector('[aria-label="Abrir chatbot"]');
      if (chatbotButton) {
        chatbotButton.style.display = '';
      }
    };
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch('/api/descuento-cajas/productos-pdf', {
        method: 'GET',
        headers: headers
      });
      const data = await response.json();

      let productosArray = [];
      if (Array.isArray(data)) {
        productosArray = data;
      } else if (data.productos && Array.isArray(data.productos)) {
        productosArray = data.productos;
      } else if (data.data && Array.isArray(data.data)) {
        productosArray = data.data;
      } else {
        throw new Error('Formato de datos no válido');
      }

      setProductos(productosArray);
      setCargando(false);
    } catch (error) {
      console.error('Error:', error);
      setCargando(false);
    }
  };

  const clasificarProducto = (producto) => {
    const nombre = (producto.PRODUCTO || producto.producto || '').toUpperCase();
    const categoria = producto.CATEGORIA_GUANTES ? producto.CATEGORIA_GUANTES.toUpperCase() : '';

    // Guantes por subcategoría
    if (producto.CATEGORIA === 'Guantes' && categoria) {
      return categoria;
    }

    // Zapatos por subcategoría
    if (producto.CATEGORIA === 'Calzado' && categoria) {
      return categoria;
    }

    // Clasificación por nombre del producto
    if (nombre.includes('TOMACORRIENTE') || nombre.includes('CONMUTADOR') || nombre.includes('INTERRUPTOR')) {
      return 'TOMACORRIENTE';
    }
    if (nombre.includes('CONO')) return 'CONOS';
    if (nombre.includes('RESPIRADOR') || nombre.includes('REPUESTO')) return 'RESPIRADORES - FILTROS';
    if (nombre.includes('LENTES')) return 'LENTES';
    if (nombre.includes('ULTRAFLEX')) return 'ULTRAFLEX';
    if (nombre.includes('PUFLEX')) return 'PUFLEX';
    if (nombre.includes('CASCO')) return 'CASCO';
    if (nombre.includes('ZAPATO')) return 'ZAPATO';
    if (nombre.includes('PONCHO') || nombre.includes('CAPOTIN')) return 'PONCHO';
    return 'OTROS PRODUCTOS';
  };

  const renderizarColumna = (categorias, grupos) => {
    let html = '<div class="column">';
    categorias.forEach(categoria => {
      if (grupos[categoria] && grupos[categoria].length > 0) {
        html += `<div class="category-section">`;
        html += `<div class="category-header">${categoria}</div>`;
        html += `<table>`;
        grupos[categoria].forEach(producto => {
          const stockClass = producto.CANTIDAD_CAJAS > 0 ? 'con-stock' : 'sin-stock';
          const stockText = producto.CANTIDAD_CAJAS > 0
            ? `${producto.CANTIDAD_CAJAS} ${producto.UNIDAD_MEDIDA_CAJAS || 'CAJAS'}`
            : 'SIN STOCK';
          html += `
            <tr style="border: 2px solid #002c59;">
              <td class="product-name">${producto.PRODUCTO || producto.producto || ''}</td>
              <td class="stock-cell ${stockClass}">${stockText}</td>
            </tr>
          `;
        });
        html += `</table>`;
        html += `</div>`;
      }
    });
    html += '</div>';
    return html;
  };

  const gruposPorCategoria = () => {
    const grupos = {};
    productos.forEach(producto => {
      const categoria = clasificarProducto(producto);
      if (!grupos[categoria]) {
        grupos[categoria] = [];
      }
      grupos[categoria].push(producto);
    });
    return grupos;
  };

  const captureAndDownloadImage = async () => {
    setGenerando(true);
    try {
      const element = document.querySelector('.container-imagen');
      if (!element) {
        throw new Error('No se encontró el elemento a capturar. Por favor, recargue la página.');
      }

      // Guardar estilos originales
      const originalPaddingRight = element.style.paddingRight;
      const originalWidth = element.style.width;
      const originalMaxWidth = element.style.maxWidth;
      
      // Encontrar el elemento de la tabla para obtener su ancho real
      // Buscar el div con border que contiene la tabla
      const tablaContainer = element.querySelector('div[style*="borderColor"]') || 
                            element.querySelector('.grid') ||
                            Array.from(element.querySelectorAll('div')).find(div => 
                              div.style.borderColor && div.style.borderColor.includes('#002c59')
                            );
      
      let contenidoWidth = element.scrollWidth;
      if (tablaContainer) {
        // Usar el ancho del contenido real más un pequeño margen
        const tablaWidth = tablaContainer.scrollWidth || tablaContainer.offsetWidth || tablaContainer.clientWidth;
        contenidoWidth = tablaWidth + 20; // Agregar margen para evitar cortes
      } else {
        // Si no encontramos la tabla, usar el ancho del header como referencia
        const header = element.querySelector('h1');
        if (header) {
          const headerWidth = header.scrollWidth || header.offsetWidth;
          contenidoWidth = Math.max(headerWidth + 40, contenidoWidth);
        }
      }
      
      // Ajustar el ancho del contenedor al ancho real del contenido
      element.style.width = `${contenidoWidth}px`;
      element.style.maxWidth = `${contenidoWidth}px`;
      element.style.overflow = 'hidden';

      // Ocultar botones temporalmente
      const botones = document.querySelectorAll('button');
      const botonesOcultos = [];
      botones.forEach(btn => {
        if (btn.textContent?.includes('VOLVER') || btn.textContent?.includes('GENERAR')) {
          if (btn.style.display !== 'none') {
            botonesOcultos.push(btn);
            btn.style.display = 'none';
          }
        }
      });

      // Esperar un momento para que los cambios se apliquen
      await new Promise(resolve => setTimeout(resolve, 150));

      // Importar html2canvas dinámicamente
      let html2canvas;
      try {
        html2canvas = (await import('html2canvas')).default;
      } catch (importError) {
        throw new Error('No se pudo cargar la librería de captura de imagen. Por favor, verifique su conexión a internet.');
      }

      // Interceptar y suprimir errores de parsing de colores CSS
      const originalConsoleError = console.error;
      const originalConsoleWarn = console.warn;
      const suppressedErrors = [];
      
      console.error = (...args) => {
        const message = args.join(' ');
        if (message.includes('lab') || message.includes('lch') || message.includes('oklab') || message.includes('color function') || message.includes('parse')) {
          suppressedErrors.push(message);
          return; // Suprimir estos errores
        }
        originalConsoleError.apply(console, args);
      };
      
      console.warn = (...args) => {
        const message = args.join(' ');
        if (message.includes('lab') || message.includes('lch') || message.includes('oklab') || message.includes('color function')) {
          return; // Suprimir estos warnings
        }
        originalConsoleWarn.apply(console, args);
      };

      try {
        // Calcular el tamaño del elemento (usar el ancho ajustado)
        const elementWidth = Math.min(element.scrollWidth, contenidoWidth);
        const elementHeight = element.scrollHeight;
        
        // Calcular escala óptima considerando límites del navegador
        // Los navegadores tienen límites de tamaño de canvas (típicamente 16,384px)
        const maxCanvasSize = 16384;
        const baseScale = 6; // Escala base alta pero manejable
        const calculatedScale = Math.min(
          baseScale,
          Math.floor(maxCanvasSize / Math.max(elementWidth, elementHeight))
        );
        const finalScale = Math.max(calculatedScale, 4); // Mínimo 4x para buena calidad
        
        // Capturar la imagen con alta resolución y máxima calidad
        const canvas = await html2canvas(element, {
          scale: finalScale, // Escala optimizada para máxima calidad sin exceder límites
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          width: elementWidth,
          height: elementHeight,
          windowWidth: elementWidth,
          windowHeight: elementHeight,
          allowTaint: false,
          foreignObjectRendering: false,
          removeContainer: true,
          imageTimeout: 20000, // Más tiempo para cargar imágenes
          pixelRatio: Math.max(window.devicePixelRatio || 1, 2), // Mínimo 2x pixel ratio
          letterRendering: true, // Mejor renderizado de texto
          onclone: (clonedDoc) => {
            // Mejorar la calidad de renderizado en el clon
            const allElements = clonedDoc.querySelectorAll('*');
            allElements.forEach((el) => {
              try {
                const style = window.getComputedStyle(el);
                const bgImage = style.backgroundImage;
                
                // Mejorar el renderizado de texto en todos los elementos de texto
                if (el.tagName === 'TD' || el.tagName === 'TH' || el.tagName === 'P' || 
                    el.tagName === 'SPAN' || el.tagName === 'DIV' || el.tagName === 'H1' || 
                    el.tagName === 'H2' || el.tagName === 'H3' || el.tagName === 'H4') {
                  el.style.webkitFontSmoothing = 'antialiased';
                  el.style.mozOsxFontSmoothing = 'grayscale';
                  el.style.textRendering = 'optimizeLegibility';
                  el.style.imageRendering = 'crisp-edges';
                }
                
                // Mejorar renderizado de bordes y líneas
                if (el.tagName === 'TABLE' || el.tagName === 'TR' || el.tagName === 'TD' || el.tagName === 'TH') {
                  el.style.imageRendering = 'crisp-edges';
                }
                
                // Si tiene un gradiente, intentar reemplazarlo
                if (bgImage && bgImage !== 'none' && bgImage.includes('gradient')) {
                  // Obtener el color de fondo computado (el navegador ya lo convirtió a RGB)
                  const bgColor = style.backgroundColor;
                  if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
                    el.style.backgroundImage = 'none';
                    el.style.backgroundColor = bgColor;
                  }
                }
              } catch (e) {
                // Ignorar errores
              }
            });
          },
          ignoreElements: (element) => {
            // No ignorar ningún elemento, solo suprimir los errores
            return false;
          }
        });

        // Validar que el canvas se haya creado correctamente
        if (!canvas || canvas.width === 0 || canvas.height === 0) {
          throw new Error('El canvas no se generó correctamente. Por favor, intente nuevamente.');
        }

        // Restaurar console.error y console.warn
        console.error = originalConsoleError;
        console.warn = originalConsoleWarn;

        // Mostrar botones nuevamente
        botonesOcultos.forEach(btn => {
          btn.style.display = 'flex';
        });

        // Convertir canvas a imagen PNG con máxima calidad
        // PNG preserva la calidad sin pérdida de compresión
        let imgData;
        try {
          imgData = canvas.toDataURL('image/png');
        } catch (dataUrlError) {
          console.error('Error al convertir canvas a data URL:', dataUrlError);
          throw new Error('Error al procesar la imagen. El archivo puede ser demasiado grande. Intente con una tabla más pequeña.');
        }
        
        if (!imgData || imgData === 'data:,') {
          throw new Error('No se pudo generar la imagen. Por favor, intente nuevamente.');
        }

        // Crear enlace de descarga
        const a = document.createElement('a');
        a.href = imgData;
        a.download = 'zeus-safety-stock-tabla.png';
        document.body.appendChild(a);
        a.click();
        
        // Limpiar después de un momento
        setTimeout(() => {
          document.body.removeChild(a);
        }, 100);

        // Restaurar los estilos originales
        element.style.paddingRight = originalPaddingRight;
        element.style.width = originalWidth;
        element.style.maxWidth = originalMaxWidth;
        element.style.overflow = '';

        setModalMensaje({
          open: true,
          tipo: 'success',
          mensaje: 'Imagen de la tabla descargada correctamente.'
        });
      } catch (error) {
        // Restaurar console.error y console.warn en caso de error
        console.error = originalConsoleError;
        console.warn = originalConsoleWarn;
        
        // Restaurar los estilos originales en caso de error
        const element = document.querySelector('.container-imagen');
        if (element) {
          element.style.paddingRight = '';
          element.style.width = '';
          element.style.maxWidth = '';
          element.style.overflow = '';
        }
        
        // Si el error es solo de parsing de colores, intentar continuar de todas formas
        if (error.message && (error.message.includes('lab') || error.message.includes('lch') || error.message.includes('oklab') || error.message.includes('color function'))) {
          // El error es solo de parsing, pero el canvas puede haberse generado de todas formas
          // Intentar obtener el canvas de nuevo o usar un enfoque alternativo
          throw new Error('Error al procesar algunos colores, pero la imagen puede haberse generado parcialmente. Por favor, intente nuevamente.');
        }
        
        throw error;
      }
    } catch (error) {
      console.error('Error al capturar y descargar la imagen:', error);
      
      // Restaurar el padding original en caso de error
      const element = document.querySelector('.container-imagen');
      if (element) {
        element.style.paddingRight = '';
      }
      
      // Mostrar botones nuevamente en caso de error
      const botones = document.querySelectorAll('button');
      botones.forEach(btn => {
        if (btn.textContent?.includes('VOLVER') || btn.textContent?.includes('GENERAR')) {
          btn.style.display = 'flex';
        }
      });

      const mensajeError = error.message || 'Error al descargar la imagen. Por favor, intente nuevamente.';
      setModalMensaje({
        open: true,
        tipo: 'error',
        mensaje: mensajeError
      });
    } finally {
      setGenerando(false);
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

  const grupos = gruposPorCategoria();

  return (
    <>
      {/* Estilo global para ocultar el chatbot */}
      <style dangerouslySetInnerHTML={{
        __html: `
          [aria-label="Abrir chatbot"] {
            display: none !important;
          }
          .fixed.bottom-24.right-6.w-80 {
            display: none !important;
          }
        `
      }} />
    <div className="fixed inset-0 overflow-auto" style={{ backgroundColor: '#f0f0f0', padding: '10px' }}>

      {/* Botones flotantes - Siempre visibles */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3">
        <button
          onClick={() => router.push('/logistica/gestion-cajas-malvinas')}
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-gradient-to-br from-green-600 to-green-700 border-2 border-green-800 hover:border-green-900 hover:from-green-700 hover:to-green-800 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
          style={{ fontFamily: 'var(--font-poppins)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>VOLVER</span>
        </button>
        <button
          onClick={captureAndDownloadImage}
          disabled={generando || cargando}
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-gradient-to-br from-yellow-500 to-yellow-600 border-2 border-yellow-700 hover:border-yellow-800 hover:from-yellow-600 hover:to-yellow-700 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ fontFamily: 'var(--font-poppins)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{generando ? 'Generando...' : 'GENERAR IMAGEN'}</span>
        </button>
      </div>

      {/* Contenido principal - Sin Header ni Sidebar */}
      <div className="container-imagen w-full bg-white min-h-screen" style={{ padding: '0px', maxWidth: '100%', margin: '0 auto' }}>
        {/* Header exacto del sistema antiguo */}
        <div className="text-white py-3 px-3 text-center mb-1" style={{ backgroundColor: '#00254b', fontFamily: 'Arial, sans-serif' }}>
          <h1 className="text-[26px] font-bold mb-0.5" style={{ fontFamily: 'Arial, sans-serif' }}>
            ZEUS SAFETY STOCK MALVINAS ( CAJAS )
          </h1>
        </div>

        {cargando ? (
          <div className="text-center py-12 text-gray-600 text-lg font-normal" style={{ fontFamily: 'Arial, sans-serif' }}>
            Cargando datos...
          </div>
        ) : (
          <div className="border-[10px] p-0" style={{ borderColor: '#002c59' }}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-0" style={{ backgroundColor: '#ffffff' }}>
              {/* Columna 1 */}
              <div className="border-r-[10px] last:border-r-0 p-0" style={{ borderColor: '#002c59' }}>
                {columnasDistribucion.columna1.map(categoria => {
                  if (!grupos[categoria] || grupos[categoria].length === 0) return null;
                  return (
                    <div key={categoria} className="border-b-[6px] last:border-b-0 p-0" style={{ borderColor: '#002c59' }}>
                      <div className="p-1.5 text-[20px] font-bold text-center border-b-[6px]" style={{ 
                        fontFamily: 'Arial, sans-serif', 
                        backgroundColor: '#d4daedd4', 
                        borderColor: '#002c59',
                        color: '#000000'
                      }}>
                        {categoria}
                      </div>
                      <table className="w-full border-collapse">
                        <tbody>
                          {grupos[categoria].map((producto, idx) => {
                            const cantidad = producto.CANTIDAD_CAJAS || producto.Cantidad || producto.cantidadCajas || 0;
                            const limite = producto.LIMITE_DESCUENTO_CAJAS || producto.limite_descuento_cajas || 0;
                            
                            // Determinar color según la lógica (el límite se usa internamente pero no se muestra)
                            let colorTexto = '#008000'; // Verde por defecto
                            let stockText = '';
                            
                            if (cantidad === 0) {
                              colorTexto = '#000000'; // Negro para Sin Stock
                              stockText = 'Sin Stock';
                            } else if (cantidad === limite) {
                              colorTexto = '#ff0000'; // Rojo si cantidad igual al límite
                              stockText = `Stock: ${cantidad}`;
                            } else if (cantidad > limite) {
                              colorTexto = '#008000'; // Verde si cantidad mayor al límite
                              stockText = `Stock: ${cantidad}`;
                            } else {
                              // Si cantidad < límite, también rojo (stock bajo)
                              colorTexto = '#ff0000';
                              stockText = `Stock: ${cantidad}`;
                            }
                            
                            return (
                              <tr key={idx} style={{ 
                                borderTop: '2px solid #002c59',
                                borderLeft: '2px solid #002c59',
                                borderRight: '2px solid #002c59',
                                borderBottom: idx < grupos[categoria].length - 1 ? '1px solid #999' : '2px solid #002c59'
                              }}>
                                <td className="w-[65%] text-left px-1.5 py-1 text-base leading-[1.3] font-normal" style={{ fontFamily: 'Arial, sans-serif', color: '#000000' }}>
                                  {producto.PRODUCTO || producto.producto || ''}
                                </td>
                                <td className="w-[35%] text-center px-1.5 py-1 text-base font-bold" style={{ 
                                  fontFamily: 'Arial, sans-serif',
                                  color: colorTexto
                                }}>
                                  {stockText}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>

              {/* Columna 2 */}
              <div className="border-r-[10px] last:border-r-0 p-0" style={{ borderColor: '#002c59' }}>
                {columnasDistribucion.columna2.map(categoria => {
                  if (!grupos[categoria] || grupos[categoria].length === 0) return null;
                  return (
                    <div key={categoria} className="border-b-[6px] last:border-b-0 p-0" style={{ borderColor: '#002c59' }}>
                      <div className="p-1.5 text-[20px] font-bold text-center border-b-[6px]" style={{ 
                        fontFamily: 'Arial, sans-serif', 
                        backgroundColor: '#d4daedd4', 
                        borderColor: '#002c59',
                        color: '#000000'
                      }}>
                        {categoria}
                      </div>
                      <table className="w-full border-collapse">
                        <tbody>
                          {grupos[categoria].map((producto, idx) => {
                            const cantidad = producto.CANTIDAD_CAJAS || producto.Cantidad || producto.cantidadCajas || 0;
                            const limite = producto.LIMITE_DESCUENTO_CAJAS || producto.limite_descuento_cajas || 0;
                            
                            // Determinar color según la lógica (el límite se usa internamente pero no se muestra)
                            let colorTexto = '#008000'; // Verde por defecto
                            let stockText = '';
                            
                            if (cantidad === 0) {
                              colorTexto = '#000000'; // Negro para Sin Stock
                              stockText = 'Sin Stock';
                            } else if (cantidad === limite) {
                              colorTexto = '#ff0000'; // Rojo si cantidad igual al límite
                              stockText = `Stock: ${cantidad}`;
                            } else if (cantidad > limite) {
                              colorTexto = '#008000'; // Verde si cantidad mayor al límite
                              stockText = `Stock: ${cantidad}`;
                            } else {
                              // Si cantidad < límite, también rojo (stock bajo)
                              colorTexto = '#ff0000';
                              stockText = `Stock: ${cantidad}`;
                            }
                            
                            return (
                              <tr key={idx} style={{ 
                                borderTop: '2px solid #002c59',
                                borderLeft: '2px solid #002c59',
                                borderRight: '2px solid #002c59',
                                borderBottom: idx < grupos[categoria].length - 1 ? '1px solid #999' : '2px solid #002c59'
                              }}>
                                <td className="w-[65%] text-left px-1.5 py-1 text-base leading-[1.3] font-normal" style={{ fontFamily: 'Arial, sans-serif', color: '#000000' }}>
                                  {producto.PRODUCTO || producto.producto || ''}
                                </td>
                                <td className="w-[35%] text-center px-1.5 py-1 text-base font-bold" style={{ 
                                  fontFamily: 'Arial, sans-serif',
                                  color: colorTexto
                                }}>
                                  {stockText}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>

              {/* Columna 3 */}
              <div className="border-r-[10px] last:border-r-0 p-0" style={{ borderColor: '#002c59' }}>
                {columnasDistribucion.columna3.map(categoria => {
                  if (!grupos[categoria] || grupos[categoria].length === 0) return null;
                  return (
                    <div key={categoria} className="border-b-[6px] last:border-b-0 p-0" style={{ borderColor: '#002c59' }}>
                      <div className="p-1.5 text-[20px] font-bold text-center border-b-[6px]" style={{ 
                        fontFamily: 'Arial, sans-serif', 
                        backgroundColor: '#d4daedd4', 
                        borderColor: '#002c59',
                        color: '#000000'
                      }}>
                        {categoria}
                      </div>
                      <table className="w-full border-collapse">
                        <tbody>
                          {grupos[categoria].map((producto, idx) => {
                            const cantidad = producto.CANTIDAD_CAJAS || producto.Cantidad || producto.cantidadCajas || 0;
                            const limite = producto.LIMITE_DESCUENTO_CAJAS || producto.limite_descuento_cajas || 0;
                            
                            // Determinar color según la lógica (el límite se usa internamente pero no se muestra)
                            let colorTexto = '#008000'; // Verde por defecto
                            let stockText = '';
                            
                            if (cantidad === 0) {
                              colorTexto = '#000000'; // Negro para Sin Stock
                              stockText = 'Sin Stock';
                            } else if (cantidad === limite) {
                              colorTexto = '#ff0000'; // Rojo si cantidad igual al límite
                              stockText = `Stock: ${cantidad}`;
                            } else if (cantidad > limite) {
                              colorTexto = '#008000'; // Verde si cantidad mayor al límite
                              stockText = `Stock: ${cantidad}`;
                            } else {
                              // Si cantidad < límite, también rojo (stock bajo)
                              colorTexto = '#ff0000';
                              stockText = `Stock: ${cantidad}`;
                            }
                            
                            return (
                              <tr key={idx} style={{ 
                                borderTop: '2px solid #002c59',
                                borderLeft: '2px solid #002c59',
                                borderRight: '2px solid #002c59',
                                borderBottom: idx < grupos[categoria].length - 1 ? '1px solid #999' : '2px solid #002c59'
                              }}>
                                <td className="w-[65%] text-left px-1.5 py-1 text-base leading-[1.3] font-normal" style={{ fontFamily: 'Arial, sans-serif', color: '#000000' }}>
                                  {producto.PRODUCTO || producto.producto || ''}
                                </td>
                                <td className="w-[35%] text-center px-1.5 py-1 text-base font-bold" style={{ 
                                  fontFamily: 'Arial, sans-serif',
                                  color: colorTexto
                                }}>
                                  {stockText}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Mensaje */}
      <Modal
        isOpen={modalMensaje.open}
        onClose={() => setModalMensaje({ open: false, tipo: "success", mensaje: "" })}
        title={modalMensaje.tipo === "success" ? "Éxito" : "Error"}
        size="sm"
        primaryButtonText="Aceptar"
        onPrimaryButtonClick={() => setModalMensaje({ open: false, tipo: "success", mensaje: "" })}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-center mb-2">
            {modalMensaje.tipo === "success" ? (
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
          </div>
          <p className={`text-center text-sm ${
            modalMensaje.tipo === "success" ? "text-green-700" : "text-red-700"
          }`} style={{ fontFamily: 'var(--font-poppins)' }}>
            {modalMensaje.mensaje}
          </p>
        </div>
      </Modal>
    </div>
    </>
  );
}

