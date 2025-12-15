"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/context/AuthContext";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";

export default function GestionPreciosPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("MALVINAS");
  const [preciosData, setPreciosData] = useState({});
  const [loadingAll, setLoadingAll] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("create"); // "create" o "update"
  const [selectedPrecio, setSelectedPrecio] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [precioToDelete, setPrecioToDelete] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: "", type: "success" });
  const [tablasDisponibles, setTablasDisponibles] = useState([
    { value: "MALVINAS", label: "Malvinas", disponible: true },
    { value: "PROVINCIA", label: "Provincia", disponible: true },
    { value: "JICAMARCA", label: "Jicamarca", disponible: false },
    { value: "ONLINE", label: "Online", disponible: false },
    { value: "FERRETERIA", label: "Ferretería", disponible: true },
    { value: "CLIENTES_FINALES", label: "Clientes Finales", disponible: true },
  ]);

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

  const getApiId = (tablaId) => {
    const mapping = {
      "MALVINAS": "MALVINAS",
      "PROVINCIA": "PROVINCIA",
      "JICAMARCA": "JICAMARCA",
      "ONLINE": "ONLINE",
      "FERRETERIA": "Ferretería",
      "CLIENTES_FINALES": "Clientes finales"
    };
    return mapping[tablaId] || tablaId;
  };

  // Función para obtener fichas técnicas de productos por código
  const fetchFichasTecnicas = useCallback(async (codigos) => {
    try {
      if (!codigos || codigos.length === 0) return {};
      
      let token = localStorage.getItem("token") || 
                  (user?.token || user?.accessToken || user?.access_token) || 
                  sessionStorage.getItem("token");
      
      if (!token) return {};
      
      // Obtener todos los productos de la API
      const apiUrl = `/api/productos`;
      const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`,
      };
      
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: headers,
      });
      
      if (!response.ok) {
        console.warn("No se pudieron obtener las fichas técnicas de productos");
        return {};
      }
      
      const data = await response.json();
      const productosArray = Array.isArray(data) ? data : 
                            (data?.data && Array.isArray(data.data) ? data.data : []);
      
      // Crear un mapa de código -> ficha técnica
      const fichasMap = {};
      productosArray.forEach(producto => {
        const codigo = producto.CODIGO || producto.codigo || producto.CÓDIGO;
        const ficha = producto.FICHA_TECNICA_ENLACE || producto.ficha_tecnica_enlace || 
                     producto.FICHA_TECNICA || producto.ficha_tecnica ||
                     producto.fichaTecnica || producto.fichaTecnicaEnlace;
        
        if (codigo && ficha) {
          fichasMap[codigo] = ficha;
        }
      });
      
      console.log(`✅ Fichas técnicas obtenidas: ${Object.keys(fichasMap).length} productos con ficha`);
      return fichasMap;
    } catch (err) {
      console.warn("Error al obtener fichas técnicas:", err.message);
      return {};
    }
  }, [user]);

  const fetchPrecios = useCallback(async (tablaId) => {
    try {
      let token = localStorage.getItem("token") || 
                  (user?.token || user?.accessToken || user?.access_token) || 
                  sessionStorage.getItem("token");
      
      if (!token) {
        router.push("/login");
        throw new Error("Token no encontrado. Por favor, inicie sesión.");
      }
      
      const apiId = getApiId(tablaId);
      const apiUrl = `/api/franja-precios?id=${encodeURIComponent(apiId)}`;
      
      const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`,
      };
      
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: headers,
      });
      
      if (!response.ok) {
        // Para errores 401, solo lanzar error sin redirigir inmediatamente
        // La redirección se manejará solo si TODAS las peticiones fallan
        if (response.status === 401) {
          throw new Error("token expirado");
        }
        
        // Para errores 500, retornar array vacío (tabla sin datos o error del servidor)
        if (response.status === 500) {
          return [];
        }
        
        const errorData = await response.json().catch(() => ({ error: `Error ${response.status}` }));
        const errorMessage = errorData.error || errorData.message || errorData.details || `Error ${response.status}`;
        
        // Solo redirigir si es explícitamente un error de token expirado
        if (errorData.error === "token expirado" || errorMessage.toLowerCase().includes("token expirado")) {
          throw new Error("token expirado");
        }
        
        // Para otros errores, retornar array vacío
        return [];
      }
      
      const data = await response.json();
      const preciosArray = Array.isArray(data) ? data : 
                          (data?.data && Array.isArray(data.data) ? data.data : []);
      
      // Obtener fichas técnicas de productos (aunque no las mostremos, las obtenemos para mantener consistencia con la API)
      const codigos = preciosArray.map(p => p.CODIGO || p.codigo).filter(Boolean);
      const fichasMap = await fetchFichasTecnicas(codigos);
      
      // Combinar fichas técnicas con los datos de precios (aunque no las mostremos)
      const preciosConFichas = preciosArray.map(precio => {
        const codigo = precio.CODIGO || precio.codigo;
        const ficha = fichasMap[codigo] || precio.FICHA_TECNICA_ENLACE || precio.ficha_tecnica_enlace ||
                     precio.FICHA_TECNICA || precio.ficha_tecnica;
        
        return {
          ...precio,
          FICHA_TECNICA_ENLACE: ficha,
          ficha_tecnica_enlace: ficha,
          FICHA_TECNICA: ficha,
          ficha_tecnica: ficha
        };
      });
      
      return preciosConFichas;
    } catch (err) {
      const errorMessage = err.message || "";
      const isExpectedError = errorMessage.includes("'PRECIO'") || 
                             errorMessage.includes("PRECIO") ||
                             errorMessage.includes("No hay datos") ||
                             errorMessage.includes("no existe");
      
      if (!isExpectedError) {
        console.error(`Error al obtener precios para ${tablaId}:`, err.message);
      }
      
      return [];
    }
  }, [user, router, fetchFichasTecnicas]);

  useEffect(() => {
    let isMounted = true;
    let timeoutId;
    
    const loadAllData = async () => {
      if (!user || loading) return;
      
      setLoadingAll(true);
      setError(null);
      
      // Timeout de seguridad: si tarda más de 30 segundos, detener la carga
      timeoutId = setTimeout(() => {
        if (isMounted) {
          setLoadingAll(false);
          setError("La carga está tardando demasiado. Por favor, recarga la página.");
        }
      }, 30000);
      
      let hasTokenError = false;
      
      try {
        // Usar las tablas iniciales, no las del estado que pueden cambiar
        const tablasIniciales = [
          { value: "MALVINAS", label: "Malvinas", disponible: true },
          { value: "PROVINCIA", label: "Provincia", disponible: true },
          { value: "JICAMARCA", label: "Jicamarca", disponible: false },
          { value: "ONLINE", label: "Online", disponible: false },
          { value: "FERRETERIA", label: "Ferretería", disponible: true },
          { value: "CLIENTES_FINALES", label: "Clientes Finales", disponible: true },
        ];
        
        // Solo cargar las tablas que están marcadas como disponibles inicialmente
        const tablasACargar = tablasIniciales.filter(t => t.disponible);
        
        const promises = tablasACargar.map(async (tabla) => {
          try {
            const data = await fetchPrecios(tabla.value);
            return { tabla: tabla.value, data, error: null };
          } catch (err) {
            // Si es error de token, marcar para redirigir después
            if (err.message && err.message.includes("token expirado")) {
              hasTokenError = true;
            }
            return { tabla: tabla.value, data: [], error: err.message };
          }
        });
        
        const results = await Promise.allSettled(promises);
        
        if (!isMounted) {
          clearTimeout(timeoutId);
          return;
        }
        
        clearTimeout(timeoutId);
        
        const newPreciosData = {};
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            const { tabla, data } = result.value;
            newPreciosData[tabla] = data;
          } else {
            // Si falló la promesa, usar el valor de la tabla correspondiente
            const tabla = tablasACargar[index].value;
            newPreciosData[tabla] = [];
          }
        });
        
        // Si hay error de token en todas las peticiones, redirigir al login
        const allTokenErrors = results.every(r => 
          r.status === 'fulfilled' && r.value.error && r.value.error.includes("token expirado")
        );
        
        if (hasTokenError && allTokenErrors) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }
        
        setPreciosData(newPreciosData);
        
        // Actualizar disponibilidad de tablas
        setTablasDisponibles(prev => 
          prev.map(tabla => {
            const tieneDatos = newPreciosData[tabla.value] && newPreciosData[tabla.value].length > 0;
            return { ...tabla, disponible: tieneDatos };
          })
        );
        
        // Si la tabla activa no tiene datos, cambiar a la primera disponible
        const activeTabData = newPreciosData[activeTab];
        if (!activeTabData || activeTabData.length === 0) {
          const primeraDisponible = tablasIniciales.find(
            tabla => newPreciosData[tabla.value] && newPreciosData[tabla.value].length > 0
          );
          if (primeraDisponible && isMounted) {
            setActiveTab(primeraDisponible.value);
          }
        }
      } catch (err) {
        if (!isMounted) {
          clearTimeout(timeoutId);
          return;
        }
        clearTimeout(timeoutId);
        console.error("Error al cargar datos:", err);
        // Solo mostrar error si no es un error de token (que ya se maneja arriba)
        if (!err.message || !err.message.includes("token expirado")) {
          setError("Error al cargar algunos datos. Algunas tablas pueden no estar disponibles.");
        }
        setLoadingAll(false);
      } finally {
        if (isMounted) {
          clearTimeout(timeoutId);
          setLoadingAll(false);
        }
      }
    };

    if (!loading && user) {
      loadAllData();
    }
    
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [user, loading]); // Solo user y loading como dependencias

  const precios = preciosData[activeTab] || [];

  const getPriceColumns = useMemo(() => {
    if (precios.length === 0) return [];
    
    const excludedFields = [
      'index', 'ID', 'id', 'CODIGO', 'codigo', 'NOMBRE', 'nombre', 'PRODUCTO', 'producto',
      'CANTIDAD_CAJA', 'cantidad_caja', 'CANTIDAD_EN_CAJA', 'cantidad_en_caja',
      'FICHA_TECNICA_ENLACE', 'ficha_tecnica_enlace', 'FICHA_TECNICA', 'ficha_tecnica',
      'TEXTO_COPIAR', 'texto_copiar', 'textoCopiar'
    ];
    
    const firstRecord = precios[0];
    const allKeys = Object.keys(firstRecord);
    
    const priceColumns = allKeys
      .filter(key => {
        const keyUpper = key.toUpperCase();
        return !excludedFields.some(excluded => keyUpper.includes(excluded.toUpperCase())) &&
               (typeof firstRecord[key] === 'number' || 
                (!isNaN(parseFloat(firstRecord[key])) && firstRecord[key] !== null && firstRecord[key] !== ''));
      })
      .sort((a, b) => {
        const aUpper = a.toUpperCase();
        const bUpper = b.toUpperCase();
        
        const getOrder = (str) => {
          if (str.includes('CAJA')) return 1;
          if (str.includes('DOCENA')) return 2;
          if (str.includes('PAR')) return 3;
          if (str.includes('UNIDAD')) return 4;
          return 5;
        };
        
        const orderA = getOrder(aUpper);
        const orderB = getOrder(bUpper);
        
        if (orderA !== orderB) return orderA - orderB;
        
        const numA = parseInt(a.match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.match(/\d+/)?.[0] || '0');
        return numA - numB;
      });
    
    return priceColumns;
  }, [precios]);

  const preciosFiltrados = useMemo(() => {
    if (!searchTerm.trim()) {
      return precios;
    }

    const term = searchTerm.toLowerCase().trim();
    return precios.filter((precio) => {
      const getField = (variations) => {
        for (const variation of variations) {
          if (precio[variation] !== undefined && precio[variation] !== null && precio[variation] !== "") {
            return String(precio[variation]).toLowerCase();
          }
        }
        return "";
      };

      const codigo = getField(["CODIGO", "codigo"]);
      // El backend devuelve el nombre en PRODUCTO (priorizar este campo)
      const producto = getField(["PRODUCTO", "producto", "NOMBRE", "nombre"]);

      return codigo.includes(term) || producto.includes(term);
    });
  }, [precios, searchTerm]);

  const totalPages = Math.ceil(preciosFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const preciosPaginados = preciosFiltrados.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab]);

  const handleAgregar = () => {
    setModalType("create");
    setSelectedPrecio(null);
    // Inicializar formulario con valores por defecto
    const defaultFormData = {
      CODIGO: "",
      NOMBRE: "",
      UNIDAD_MEDIDA_VENTA: "UNIDAD",
      CANTIDAD_UNIDAD_MEDIDA_VENTA: 1,
      PRECIO_UNIDAD_MEDIDA_VENTA: 0,
      UNIDAD_MEDIDA_CAJA: "UNIDAD",
      CANTIDAD_CAJA: 0,
      CLASIFICACION: activeTab,
      TEXTO_COPIAR: ""
    };
    setFormData(defaultFormData);
    setShowModal(true);
  };

  const handleActualizar = (precio) => {
    setModalType("update");
    setSelectedPrecio(precio);
    
    // Mapear los datos del precio al formulario
    const getField = (variations) => {
      for (const variation of variations) {
        if (precio[variation] !== undefined && precio[variation] !== null && precio[variation] !== "") {
          return precio[variation];
        }
      }
      return "";
    };

    // Buscar ID en todas las variaciones posibles
    let idValue = getField(["ID", "id", "Id", "_id", "ID_FRANJA", "id_franja"]);
    
    // Si no se encuentra, buscar manualmente en todas las keys
    if (!idValue || idValue === "") {
      const allKeys = Object.keys(precio);
      for (const key of allKeys) {
        const keyUpper = key.toUpperCase();
        if ((keyUpper.includes("ID") || keyUpper === "ID") && 
            !keyUpper.includes("CODIGO") && 
            !keyUpper.includes("CLASIFICACION")) {
          const value = precio[key];
          if (value !== null && value !== undefined && value !== "") {
            idValue = value;
            console.log(`✅ ID encontrado en campo: ${key} = ${idValue}`);
            break;
          }
        }
      }
    }

    console.log("=== DATOS DEL PRECIO PARA ACTUALIZAR ===");
    console.log("Precio completo:", precio);
    console.log("ID encontrado:", idValue);
    console.log("Todos los campos:", Object.keys(precio));

    // Obtener el nombre - el backend devuelve el nombre en PRODUCTO
    // Priorizar PRODUCTO ya que es el campo que devuelve el backend
    const nombreValue = getField(["PRODUCTO", "producto", "NOMBRE", "nombre"]);
    
    const formDataToSet = {
      ID: idValue,
      id: idValue, // También enviar como 'id' por si la API lo requiere
      CODIGO: getField(["CODIGO", "codigo"]),
      NOMBRE: nombreValue || "", // Si no hay nombre, usar string vacío
      UNIDAD_MEDIDA_VENTA: getField(["UNIDAD_MEDIDA_VENTA", "unidad_medida_venta"]) || "UNIDAD",
      CANTIDAD_UNIDAD_MEDIDA_VENTA: parseFloat(getField(["CANTIDAD_UNIDAD_MEDIDA_VENTA", "cantidad_unidad_medida_venta"])) || 1,
      PRECIO_UNIDAD_MEDIDA_VENTA: parseFloat(getField(["PRECIO_UNIDAD_MEDIDA_VENTA", "precio_unidad_medida_venta"])) || 0,
      UNIDAD_MEDIDA_CAJA: getField(["UNIDAD_MEDIDA_CAJA", "unidad_medida_caja"]) || "UNIDAD",
      CANTIDAD_CAJA: parseFloat(getField(["CANTIDAD_CAJA", "cantidad_caja", "CANTIDAD_EN_CAJA", "cantidad_en_caja"])) || 0,
      CLASIFICACION: activeTab,
      TEXTO_COPIAR: getField(["TEXTO_COPIAR", "texto_copiar", "textoCopiar"]) || ""
    };
    
    console.log("FormData a enviar:", formDataToSet);
    
    setFormData(formDataToSet);
    setShowModal(true);
  };

  const handleEliminar = async (precio) => {
    setPrecioToDelete(precio);
    setShowDeleteModal(true);
  };

  const confirmarEliminar = async () => {
    if (!precioToDelete) return;

    try {
      setSaving(true);
      const precio = precioToDelete;
      let token = localStorage.getItem("token") || 
                  (user?.token || user?.accessToken || user?.access_token) || 
                  sessionStorage.getItem("token");
      
      if (!token) {
        router.push("/login");
        return;
      }

      const getField = (variations) => {
        for (const variation of variations) {
          if (precio[variation] !== undefined && precio[variation] !== null && precio[variation] !== "") {
            return precio[variation];
          }
        }
        return null;
      };

      const id = getField(["ID", "id", "Id", "_id", "ID_FRANJA", "id_franja"]);
      
      if (!id) {
        alert("Error: No se pudo obtener el ID del producto para eliminar.");
        setSaving(false);
        return;
      }

      const clasificacion = activeTab;

      console.log("--- Datos para eliminar ---");
      console.log("ID a eliminar:", id);
      console.log("Clasificación:", clasificacion);

      // Llamar a API para eliminar
      const apiUrl = `/api/franja-precios`;
      const response = await fetch(apiUrl, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          ID: id,
          id: id,
          CLASIFICACION: clasificacion,
          clasificacion: clasificacion
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Error ${response.status}` }));
        throw new Error(errorData.error || "Error al eliminar el producto");
      }

      // Recargar los datos
      const newPreciosData = { ...preciosData };
      newPreciosData[activeTab] = newPreciosData[activeTab].filter(p => {
        const pId = p.ID || p.id;
        return pId !== id;
      });
      setPreciosData(newPreciosData);
      
      // Mostrar notificación de éxito
      setNotification({ show: true, message: "Producto eliminado correctamente", type: "success" });
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "success" });
      }, 2000);
      
      setShowDeleteModal(false);
      setPrecioToDelete(null);
    } catch (error) {
      console.error("Error al eliminar:", error);
      alert(`Error al eliminar el producto: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      let token = localStorage.getItem("token") || 
                  (user?.token || user?.accessToken || user?.access_token) || 
                  sessionStorage.getItem("token");
      
      if (!token) {
        router.push("/login");
        return;
      }

      // Validar que los campos requeridos estén presentes
      // Para crear, NOMBRE es requerido; para actualizar, no es necesario porque está deshabilitado
      if (!formData.CODIGO) {
        alert("Por favor complete todos los campos requeridos");
        setSaving(false);
        return;
      }
      
      if (modalType === "create" && !formData.NOMBRE) {
        alert("Por favor complete todos los campos requeridos");
        setSaving(false);
        return;
      }

      // Para actualizar, asegurarse de que el ID esté presente
      if (modalType === "update" && !formData.ID && !formData.id) {
        alert("Error: No se pudo obtener el ID del producto. Por favor, intente nuevamente.");
        setSaving(false);
        return;
      }

      const apiUrl = `/api/franja-precios`;
      const method = modalType === "create" ? "POST" : "PUT";
      
      // Preparar el body con todos los datos necesarios
      const textoCopiarValue = formData.TEXTO_COPIAR || formData.texto_copiar || formData.textoCopiar || "";
      
      // Para actualizar, el nombre viene de PRODUCTO (campo que devuelve el backend)
      // El backend protege el CODIGO y el nombre, así que solo necesitamos enviarlo si es creación
      const nombreValue = modalType === "create" 
        ? (formData.NOMBRE || formData.nombre || "")
        : (formData.NOMBRE || formData.nombre || selectedPrecio?.PRODUCTO || selectedPrecio?.producto || selectedPrecio?.NOMBRE || selectedPrecio?.nombre || "");
      
      const requestBody = {
        CODIGO: formData.CODIGO || formData.codigo,
        // El backend protege el nombre en actualización, pero lo enviamos por si acaso
        NOMBRE: nombreValue,
        UNIDAD_MEDIDA_VENTA: formData.UNIDAD_MEDIDA_VENTA || formData.unidad_medida_venta || "UNIDAD",
        CANTIDAD_UNIDAD_MEDIDA_VENTA: formData.CANTIDAD_UNIDAD_MEDIDA_VENTA || formData.cantidad_unidad_medida_venta || 1,
        PRECIO_UNIDAD_MEDIDA_VENTA: formData.PRECIO_UNIDAD_MEDIDA_VENTA || formData.precio_unidad_medida_venta || formData.precio || 0,
        UNIDAD_MEDIDA_CAJA: formData.UNIDAD_MEDIDA_CAJA || formData.unidad_medida_caja || "UNIDAD",
        CANTIDAD_CAJA: formData.CANTIDAD_CAJA || formData.cantidad_caja || 0,
        CLASIFICACION: formData.CLASIFICACION || activeTab,
        // Enviar en ambos formatos para mayor compatibilidad
        TEXTO_COPIAR: textoCopiarValue,
        texto_copiar: textoCopiarValue,
        texto: textoCopiarValue,
        // Asegurar que el ID esté presente en ambos formatos para actualizar
        ...(modalType === "update" && {
          ID: formData.ID || formData.id,
          id: formData.ID || formData.id
        })
      };

      // Validar campos críticos
      if (!requestBody.CODIGO || requestBody.CODIGO === "") {
        alert("Error: El campo Código es requerido");
        setSaving(false);
        return;
      }

      // Solo validar NOMBRE si es creación; en actualización puede estar vacío si el producto no existe en la tabla productos
      if (modalType === "create" && (!requestBody.NOMBRE || requestBody.NOMBRE === "")) {
        alert("Error: El campo Nombre es requerido");
        setSaving(false);
        return;
      }

      console.log("=== ENVIANDO REQUEST ===");
      console.log("Method:", method);
      console.log("FormData original:", formData);
      console.log("Body a enviar:", requestBody);
      
      const response = await fetch(apiUrl, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Error ${response.status}` }));
        throw new Error(errorData.error || `Error al ${modalType === "create" ? "crear" : "actualizar"} el producto`);
      }

      // Recargar los datos de la tabla activa
      const newData = await fetchPrecios(activeTab);
      
      // Si es creación y el backend no devolvió el NOMBRE, agregarlo temporalmente desde el formData
      if (modalType === "create" && requestBody.NOMBRE) {
        const codigoCreado = requestBody.CODIGO;
        // Buscar el producto recién creado y agregar el NOMBRE si no lo tiene
        const dataConNombre = newData.map(item => {
          const itemCodigo = item.CODIGO || item.codigo;
          if (itemCodigo === codigoCreado && (!item.NOMBRE && !item.nombre && !item.PRODUCTO && !item.producto)) {
            return {
              ...item,
              NOMBRE: requestBody.NOMBRE,
              nombre: requestBody.NOMBRE,
              PRODUCTO: requestBody.NOMBRE,
              producto: requestBody.NOMBRE
            };
          }
          return item;
        });
        
        const newPreciosData = { ...preciosData };
        newPreciosData[activeTab] = dataConNombre;
        setPreciosData(newPreciosData);
      } else {
        const newPreciosData = { ...preciosData };
        newPreciosData[activeTab] = newData;
        setPreciosData(newPreciosData);
      }
      
      setShowModal(false);
      
      // Mostrar notificación de éxito
      setNotification({ 
        show: true, 
        message: `Producto ${modalType === "create" ? "creado" : "actualizado"} correctamente`, 
        type: "success" 
      });
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "success" });
      }, 2000);
    } catch (error) {
      console.error(`Error al ${modalType === "create" ? "crear" : "actualizar"}:`, error);
      alert(`Error al ${modalType === "create" ? "crear" : "actualizar"} el producto: ${error.message}`);
    } finally {
      setSaving(false);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <div className="flex h-screen overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className={`flex-1 transition-all duration-300 overflow-y-auto h-full ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
          <div className="p-4 lg:p-8">
            <div className="mb-6 flex items-center gap-3 flex-wrap">
              <button
                onClick={() => router.push("/gerencia")}
                className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Volver
              </button>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Gestión de Precios</h1>
            </div>

            <div className="mb-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 p-2">
                <div className="flex flex-wrap gap-2">
                  {tablasDisponibles.map((tabla) => {
                    const isActive = activeTab === tabla.value;
                    const isDisabled = !tabla.disponible;
                    const hasData = preciosData[tabla.value]?.length > 0;
                    
                    return (
                      <button
                        key={tabla.value}
                        onClick={() => {
                          if (!isDisabled) {
                            setActiveTab(tabla.value);
                            setSearchTerm("");
                          }
                        }}
                        disabled={isDisabled}
                        className={`
                          px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200
                          ${isActive 
                            ? "bg-blue-700 text-white shadow-md" 
                            : isDisabled
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-sm"
                          }
                          ${!isDisabled && !isActive ? "hover:border-blue-300" : ""}
                        `}
                      >
                        <div className="flex items-center gap-2">
                          <span>{tabla.label}</span>
                          {hasData && !isActive && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              {preciosData[tabla.value].length}
                            </span>
                          )}
                          {isDisabled && (
                            <span className="text-xs">(Próximamente)</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6 mb-6">
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {loadingAll ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
                  <span className="ml-3 text-gray-600 mt-4">Cargando todas las clasificaciones...</span>
                </div>
              ) : precios.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No hay datos disponibles para esta clasificación.</p>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="Buscar por código o nombre de producto..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full px-4 py-2.5 pl-10 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 transition-all duration-200 hover:border-blue-300 bg-white"
                        />
                        <svg
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                        {searchTerm && (
                          <button
                            onClick={() => setSearchTerm("")}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                      <button
                        onClick={handleAgregar}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md text-sm whitespace-nowrap"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Agregar Producto
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      {searchTerm && (
                        <p className="text-xs text-gray-500">
                          Mostrando {preciosFiltrados.length} de {precios.length} productos
                        </p>
                      )}
                      <div className="flex items-center gap-2 ml-auto">
                        <label className="text-xs font-semibold text-gray-700">Elementos por página:</label>
                        <div className="relative">
                          <select
                            value={itemsPerPage}
                            onChange={(e) => {
                              setItemsPerPage(Number(e.target.value));
                              setCurrentPage(1);
                            }}
                            className="px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm font-semibold text-gray-900 bg-white hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md appearance-none pr-10 min-w-[100px] bg-gradient-to-br from-white to-gray-50"
                          >
                            <option value={25} className="bg-white text-gray-900 py-2 font-medium">25</option>
                            <option value={50} className="bg-white text-gray-900 py-2 font-medium">50</option>
                            <option value={100} className="bg-white text-gray-900 py-2 font-medium">100</option>
                            <option value={200} className="bg-white text-gray-900 py-2 font-medium">200</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {preciosFiltrados.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No se encontraron productos que coincidan con "{searchTerm}"</p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden mb-6">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-blue-700 border-b-2 border-blue-800">
                              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                                CÓDIGO
                              </th>
                              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                                PRODUCTO
                              </th>
                              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                                CANTIDAD EN CAJA
                              </th>
                              {getPriceColumns.map((columna) => (
                                <th 
                                  key={columna}
                                  className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap"
                                >
                                  {columna.replace(/_/g, ' ')}
                                </th>
                              ))}
                              <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                                ACCIONES
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {preciosPaginados.map((precio, index) => {
                              const globalIndex = startIndex + index;
                              const getField = (variations) => {
                                for (const variation of variations) {
                                  if (precio[variation] !== undefined && precio[variation] !== null && precio[variation] !== "") {
                                    return precio[variation];
                                  }
                                }
                                return null;
                              };

                              const formatPrice = (value) => {
                                if (value === null || value === undefined || value === "" || value === "NaN") return { text: "-", isZero: false };
                                if (typeof value === "number" && isNaN(value)) return { text: "-", isZero: false };
                                const num = parseFloat(value);
                                if (isNaN(num)) return { text: "-", isZero: false };
                                return { text: `S/.${num.toFixed(2)}`, isZero: num === 0 };
                              };

                              const codigo = getField(["CODIGO", "codigo"]);
                              // El backend devuelve el nombre en PRODUCTO (priorizar este campo)
      const producto = getField(["PRODUCTO", "producto", "NOMBRE", "nombre"]);
                              const cantidadCaja = getField(["CANTIDAD_CAJA", "cantidad_caja", "CANTIDAD_EN_CAJA", "cantidad_en_caja"]);
                              const fichaTecnica = getField(["FICHA_TECNICA_ENLACE", "ficha_tecnica_enlace", "FICHA_TECNICA", "ficha_tecnica"]);

                              return (
                                <tr key={globalIndex} className="hover:bg-slate-200 transition-colors">
                                  <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">
                                    {codigo || "-"}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                                    {producto || "-"}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                                    {cantidadCaja || "-"}
                                  </td>
                                  {getPriceColumns.map((columna) => {
                                    const precioValue = formatPrice(precio[columna]);
                                    return (
                                      <td 
                                        key={columna}
                                        className={`px-3 py-2 whitespace-nowrap text-[10px] ${precioValue.isZero ? "text-red-600 font-semibold" : "text-gray-700"}`}
                                      >
                                        {precioValue.text}
                                      </td>
                                    );
                                  })}
                                  <td className="px-3 py-2 whitespace-nowrap text-[10px] text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <button
                                        onClick={() => {
                                          console.log("=== CLICK EN ACTUALIZAR ===");
                                          console.log("Precio completo:", precio);
                                          console.log("ID disponible:", precio.ID || precio.id || precio.Id || precio._id);
                                          handleActualizar(precio);
                                        }}
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                                        title="Actualizar"
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Actualizar
                                      </button>
                                      <button
                                        onClick={() => handleEliminar(precio)}
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                                        title="Eliminar"
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Eliminar
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="bg-slate-200 px-3 py-2 flex items-center justify-end border-t-2 border-slate-300">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1 || totalPages === 0}
                            className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            «
                          </button>
                          <button
                            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                            disabled={currentPage === 1 || totalPages === 0}
                            className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            &lt;
                          </button>
                          <span className="text-[10px] text-gray-700 font-medium">
                            Página {totalPages > 0 ? currentPage : 0} de {totalPages || 1}
                          </span>
                          <button
                            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            &gt;
                          </button>
                          <button
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            »
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modal para Crear/Actualizar */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl border border-gray-200/60 max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header con gradiente */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/60 bg-gradient-to-r from-blue-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] rounded-xl flex items-center justify-center text-white shadow-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    {modalType === "create" ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    )}
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-900">
                  {modalType === "create" ? "Agregar Producto" : "Actualizar Producto"}
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Contenido del formulario */}
            <div className="flex-1 overflow-y-auto px-6 py-4">

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Código <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.CODIGO || ""}
                    onChange={(e) => setFormData({ ...formData, CODIGO: e.target.value })}
                    readOnly={modalType === "update"}
                    className={`w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1E63F7] focus:border-[#1E63F7] focus:outline-none text-sm transition-all duration-200 ${
                      modalType === "update" ? "bg-gray-50 text-gray-600 cursor-not-allowed" : "bg-white text-gray-900 hover:border-gray-300"
                    }`}
                    required
                  />
                  {/* Input hidden para asegurar que el CODIGO se envíe incluso si está readonly */}
                  {modalType === "update" && (
                    <input type="hidden" name="CODIGO" value={formData.CODIGO || ""} />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nombre del Producto {modalType === "create" && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    value={formData.NOMBRE || ""}
                    onChange={(e) => setFormData({ ...formData, NOMBRE: e.target.value })}
                    disabled={modalType === "update"}
                    readOnly={modalType === "update"}
                    className={`w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1E63F7] focus:border-[#1E63F7] focus:outline-none text-sm transition-all duration-200 ${
                      modalType === "update" ? "bg-gray-50 text-gray-600 cursor-not-allowed" : "bg-white text-gray-900 hover:border-gray-300"
                    }`}
                    required={modalType === "create"}
                    placeholder={modalType === "update" ? "El nombre no se puede editar" : ""}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Unidad de Medida Venta <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.UNIDAD_MEDIDA_VENTA || "UNIDAD"}
                      onChange={(e) => setFormData({ ...formData, UNIDAD_MEDIDA_VENTA: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1E63F7] focus:border-[#1E63F7] focus:outline-none text-sm bg-white text-gray-900 transition-all duration-200 hover:border-gray-300"
                      required
                    >
                      <option value="UNIDAD">UNIDAD</option>
                      <option value="DOCENA">DOCENA</option>
                      <option value="CAJA">CAJA</option>
                      <option value="PAR">PAR</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Cantidad Unidad Medida Venta <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.CANTIDAD_UNIDAD_MEDIDA_VENTA ?? ""}
                      onChange={(e) => {
                        const value = e.target.value === "" ? "" : parseFloat(e.target.value);
                        setFormData({ ...formData, CANTIDAD_UNIDAD_MEDIDA_VENTA: value });
                      }}
                      onBlur={(e) => {
                        if (e.target.value === "" || isNaN(parseFloat(e.target.value))) {
                          setFormData({ ...formData, CANTIDAD_UNIDAD_MEDIDA_VENTA: 1 });
                        }
                      }}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1E63F7] focus:border-[#1E63F7] focus:outline-none text-sm bg-white text-gray-900 transition-all duration-200 hover:border-gray-300"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Precio Unidad Medida Venta <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.PRECIO_UNIDAD_MEDIDA_VENTA ?? ""}
                    onChange={(e) => {
                      const value = e.target.value === "" ? "" : parseFloat(e.target.value);
                      setFormData({ ...formData, PRECIO_UNIDAD_MEDIDA_VENTA: value });
                    }}
                    onBlur={(e) => {
                      if (e.target.value === "" || isNaN(parseFloat(e.target.value))) {
                        setFormData({ ...formData, PRECIO_UNIDAD_MEDIDA_VENTA: 0 });
                      }
                    }}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1E63F7] focus:border-[#1E63F7] focus:outline-none text-sm bg-white text-gray-900 transition-all duration-200 hover:border-gray-300"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Unidad de Medida Caja <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.UNIDAD_MEDIDA_CAJA || "UNIDAD"}
                      onChange={(e) => setFormData({ ...formData, UNIDAD_MEDIDA_CAJA: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1E63F7] focus:border-[#1E63F7] focus:outline-none text-sm bg-white text-gray-900 transition-all duration-200 hover:border-gray-300"
                      required
                    >
                      <option value="UNIDAD">UNIDAD</option>
                      <option value="DOCENA">DOCENA</option>
                      <option value="CAJA">CAJA</option>
                      <option value="PAR">PAR</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Cantidad en Caja
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.CANTIDAD_CAJA ?? ""}
                      onChange={(e) => {
                        const value = e.target.value === "" ? "" : parseFloat(e.target.value);
                        setFormData({ ...formData, CANTIDAD_CAJA: value });
                      }}
                      onBlur={(e) => {
                        if (e.target.value === "" || isNaN(parseFloat(e.target.value))) {
                          setFormData({ ...formData, CANTIDAD_CAJA: 0 });
                        }
                      }}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1E63F7] focus:border-[#1E63F7] focus:outline-none text-sm bg-white text-gray-900 transition-all duration-200 hover:border-gray-300"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer con botones */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200/60 bg-gray-50/50">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 text-sm shadow-sm"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] hover:from-[#1a56e6] hover:to-[#1a56e6] text-white rounded-lg font-semibold transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Guardando...
                  </>
                ) : (
                  <>
                    {modalType === "create" ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Agregar
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Actualizar
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación para Eliminar */}
      {showDeleteModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => !saving && setShowDeleteModal(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-xl border border-gray-200/60 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/60 bg-gradient-to-r from-red-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center text-white shadow-sm">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-900">
                  Confirmar Eliminación
                </h2>
              </div>
              {!saving && (
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Contenido */}
            <div className="px-6 py-5">
              <p className="text-gray-700 mb-1">
                ¿Está seguro de que desea eliminar este producto?
              </p>
              {precioToDelete && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Código:</span> {precioToDelete.CODIGO || precioToDelete.codigo || "N/A"}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Producto:</span> {precioToDelete.NOMBRE || precioToDelete.nombre || "N/A"}
                  </p>
                </div>
              )}
              <p className="text-sm text-red-600 mt-3 font-medium">
                Esta acción no se puede deshacer.
              </p>
            </div>

            {/* Footer con botones */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200/60">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={saving}
                className="px-5 py-2.5 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminar}
                disabled={saving}
                className="px-6 py-2.5 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-semibold transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Eliminando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Eliminar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notificación en esquina superior izquierda */}
      {notification.show && (
        <div className="fixed top-4 left-4 z-[60] animate-slide-in-left">
          <div className={`rounded-3xl shadow-xl border max-w-md w-full overflow-hidden ${
            notification.type === "success" 
              ? "bg-white border-green-200" 
              : "bg-white border-red-200"
          }`}>
            <div className={`flex items-center gap-3 px-5 py-4 ${
              notification.type === "success"
                ? "bg-gradient-to-r from-green-50 to-white"
                : "bg-gradient-to-r from-red-50 to-white"
            }`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                notification.type === "success"
                  ? "bg-gradient-to-br from-green-500 to-green-600 text-white"
                  : "bg-gradient-to-br from-red-500 to-red-600 text-white"
              }`}>
                {notification.type === "success" ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <p className="flex-1 text-sm font-semibold text-gray-900">
                {notification.message}
              </p>
              <button
                onClick={() => setNotification({ show: false, message: "", type: notification.type })}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

