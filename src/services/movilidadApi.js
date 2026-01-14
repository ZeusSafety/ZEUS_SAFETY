/**
 * Servicio de API para Gestión de Movilidad
 * 
 * Maneja todas las llamadas a la API de movilidad con autenticación
 * Usa una ruta proxy de Next.js para evitar problemas de CORS
 */

const API_BASE_URL = "/api/movilidad";

/**
 * Obtener token de sesión desde localStorage
 */
function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

/**
 * Realizar petición a la API de movilidad a través del proxy de Next.js
 */
async function request(endpoint, options = {}) {
  const token = getToken();
  
  if (!token) {
    throw new Error("Token de autenticación no encontrado. Por favor, inicie sesión.");
  }

  const config = {
    ...options,
    headers: {
      "Authorization": `Bearer ${token}`,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (response.status === 401) {
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
 * POST request con FormData (para archivos)
 */
export async function postFormData(method, formData) {
  const token = getToken();
  
  if (!token) {
    throw new Error("Token de autenticación no encontrado.");
  }

  try {
    const response = await fetch(`${API_BASE_URL}?method=${method}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        // No establecer Content-Type para FormData, el navegador lo hace automáticamente
      },
      body: formData,
    });

    if (response.status === 401) {
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
export async function get(method) {
  return request(`?method=${method}`);
}

/**
 * Registrar combustible completo (con FormData)
 */
export async function registrarCombustibleCompleto(formData) {
  return postFormData("registrar_combustible_completo", formData);
}

/**
 * Listar registros de combustible
 */
export async function listarRegistrosCombustible() {
  return get("listar_registros_combustible");
}
