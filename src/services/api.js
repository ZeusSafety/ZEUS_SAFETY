// Configuración para APIs externas
// Cuando tengas las APIs reales, configura NEXT_PUBLIC_API_URL en .env.local
// Ejemplo: NEXT_PUBLIC_API_URL=https://api.tudominio.com
// Por ahora usa "/api" (rutas de Next.js con mocks temporales)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const token = localStorage.getItem("token");
    
    const config = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({
          error: "Error en la petición",
        }));
        throw new Error(error.error || `Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: "GET" });
  }

  post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: "DELETE" });
  }
}

export const apiClient = new ApiClient();
export default apiClient;

