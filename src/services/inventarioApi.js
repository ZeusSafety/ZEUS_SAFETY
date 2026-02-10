/**
 * Servicio de API para Inventario
 * 
 * Maneja todas las llamadas a la API de inventario con autenticación
 * Usa una ruta proxy de Next.js para evitar problemas de CORS
 */

const API_BASE_URL = "/api/inventario";

/**
 * Obtener token de sesión desde localStorage
 */
function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

/**
 * Realizar petición a la API de inventario a través del proxy de Next.js
 */
async function request(endpoint, options = {}) {
  const token = getToken();
  
  if (!token) {
    throw new Error("Token de autenticación no encontrado. Por favor, inicie sesión.");
  }

  const config = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (response.status === 401) {
      // Token inválido o expirado
      localStorage.removeItem("token");
      throw new Error("Sesión expirada. Por favor, inicie sesión nuevamente.");
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || `Error ${response.status}` };
      }
      throw new Error(errorData.error || `Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error.message.includes("Failed to fetch")) {
      throw new Error("Error de conexión. Verifique su conexión a internet.");
    }
    throw error;
  }
}

/**
 * GET request
 */
export async function get(method, params = {}) {
  const queryParams = new URLSearchParams({
    method,
    ...params,
  });
  return request(`?${queryParams.toString()}`);
}

/**
 * POST request
 */
export async function post(method, data = {}) {
  const formData = new FormData();
  
  // Si hay un archivo, usar FormData
  if (data.file) {
    Object.keys(data).forEach(key => {
      if (key === 'file') {
        formData.append('file', data.file);
      } else {
        formData.append(key, data[key]);
      }
    });
    
    return request(`?method=${method}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${getToken()}`,
        // No establecer Content-Type para FormData, el navegador lo hace automáticamente
      },
      body: formData,
    });
  }
  
  // Si no hay archivo, usar JSON
  return request(`?method=${method}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Métodos específicos de la API
 */

// Listar inventarios
export async function listarInventarios() {
  return get("listar_inventarios");
}

// Extraer inventarios conteos
export async function extraerInventariosConteos(id) {
  return get("extraer_inventarios_conteos", { id });
}

// Listar conteo punto de operación
export async function listarConteoPuntoOperacion(id) {
  return get("listar_conteo_punto_operacion", { id });
}

// Auditoría conteos
export async function auditoriaConteos(id) {
  return get("auditoria_conteos", { id });
}

// Stock sistema excel
export async function stockSistemaExcel(id) {
  return get("stock_sistema_excel", { id });
}

// Colaboradores inventario
export async function colaboradoresInventario(selector) {
  return get("colaboradores_imventario", { selector });
}

// Insertar número inventario
export async function insertarNumeroInventario(data) {
  return post("insertar_numero_inventario", data);
}

// Obtener ID de inventario por nombre
export async function obtenerIdInventario(nombre) {
  try {
    const resp = await listarInventarios();

    // La API de backend devuelve un objeto con { success, inventarios, ... }
    // pero por compatibilidad también soportamos otros formatos.
    let inventarios = [];
    if (Array.isArray(resp)) {
      inventarios = resp;
    } else if (resp && Array.isArray(resp.inventarios)) {
      inventarios = resp.inventarios;
    } else if (resp && Array.isArray(resp.data)) {
      inventarios = resp.data;
    }

    const inventario = inventarios.find(
      (inv) =>
        inv.numero_inventario === nombre ||
        inv.NOMBRE === nombre
    );

    return inventario?.id || inventario?.ID || null;
  } catch (error) {
    console.error("Error obteniendo ID de inventario:", error);
    return null;
  }
}

// Insertar conteo
export async function insertarConteo(data) {
  return post("insertar_conteo", data);
}

// Auditoría conteo
export async function auditoriaConteo(jsonData) {
  // El backend espera un campo "json" que puede ser un string JSON o un objeto
  const jsonString = typeof jsonData === 'string' ? jsonData : JSON.stringify(jsonData);
  return post("auditoria_conteo", { json: jsonString });
}

// Conteo sistema inventario excel
export async function conteoSistemaInventarioExcel(data) {
  return post("conteo_sistema_inventario_excel", data);
}

// Subir archivo
export async function subirArchivo(file, folderBucket = "inventario_conteo") {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder_bucket", folderBucket);
  
  const token = getToken();
  if (!token) {
    throw new Error("Token de autenticación no encontrado.");
  }

  // La API de archivos puede estar en otro endpoint
  // Según el backend, usa gestorarchivos-2946605267.us-central1.run.app
  // Por ahora, usamos el proxy de Next.js si existe, sino llamamos directamente
  const ARCHIVOS_API = "/api/archivos"; // Intentar usar proxy primero
  
  try {
    const response = await fetch(`${ARCHIVOS_API}?folder_bucket=${folderBucket}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      // Si el proxy no existe, intentar directamente
      const ARCHIVOS_API_DIRECT = "https://gestorarchivos-2946605267.us-central1.run.app";
      const responseDirect = await fetch(`${ARCHIVOS_API_DIRECT}?folder_bucket=${folderBucket}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      });

      if (!responseDirect.ok) {
        const errorText = await responseDirect.text();
        throw new Error(`Error al subir archivo: ${responseDirect.status} - ${errorText}`);
      }

      const data = await responseDirect.json();
      return data.url;
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    // Si falla el proxy, intentar directamente
    const ARCHIVOS_API_DIRECT = "https://gestorarchivos-2946605267.us-central1.run.app";
    const responseDirect = await fetch(`${ARCHIVOS_API_DIRECT}?folder_bucket=${folderBucket}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
      body: formData,
    });

    if (!responseDirect.ok) {
      const errorText = await responseDirect.text();
      throw new Error(`Error al subir archivo: ${responseDirect.status} - ${errorText}`);
    }

    const data = await responseDirect.json();
    return data.url;
  }
}

// ========== NUEVOS MÉTODOS DEL CÓDIGO HTML ==========

// Asignar inventario
export async function asignarInventario(data) {
  return post("asignar_inventario", data);
}

// Unir colaborador a inventario
export async function unirColaborador(data) {
  return post("unir_colaborador", data);
}

// Cerrar inventario
export async function cerrarInventario(data) {
  return post("cerrar_inventario", data);
}

// Obtener inventario activo
export async function obtenerInventarioActivo() {
  return get("obtener_inventario_activo");
}

// Iniciar conteo
export async function iniciarConteo(data) {
  return post("iniciar_conteo", data);
}

// Obtener detalle de conteo
export async function obtenerDetalleConteo(conteoId) {
  return get("obtener_detalle_conteo", { conteo_id: conteoId });
}

// Actualizar masivo (cantidades y unidades de medida)
export async function actualizarMasivo(data) {
  return post("actualizar_masivo", data);
}

// Finalizar conteo
export async function finalizarConteo(data) {
  return post("finalizar_conteo", data);
}

// Cargar Excel de emergencia
export async function cargarExcelEmergencia(formData) {
  const token = getToken();
  if (!token) {
    throw new Error("Token de autenticación no encontrado.");
  }

  return request(`?method=cargar_excel_emergencia`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
    body: formData,
  });
}

// Listar conteos Callao
export async function listarConteosCallao(inventarioId) {
  return get("listar_conteos_callao", { inventario_id: inventarioId });
}

// Listar conteos Malvinas
export async function listarConteosMalvinas(inventarioId) {
  return get("listar_conteos_malvinas", { inventario_id: inventarioId });
}

// Listar productos de inventario
export async function listarProductosInventario() {
  return get("listar_productos_inventario");
}