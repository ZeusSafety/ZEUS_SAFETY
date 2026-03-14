const API_BASE_URL = 'https://api-boletas-pago-zeus-2946605267.us-central1.run.app';

const getAuthHeader = () => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const handleResponse = async (response) => {
  // Para la búsqueda de colaboradores, manejamos la respuesta manualmente
  // porque puede venir como texto JSON directo
  const text = await response.text();
  if (!response.ok) {
    let errorMsg = `Error del servidor (${response.status})`;
    try {
      const errorData = JSON.parse(text);
      errorMsg = errorData.error || errorData.message || errorMsg;
    } catch (e) {
      errorMsg = text || errorMsg;
    }
    throw new Error(errorMsg);
  }
  
  // Intentar parsear como JSON
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('Error parseando respuesta como JSON:', e);
    console.error('Texto recibido:', text);
    return [];
  }
};

// Función auxiliar para buscar desde la API de colaboradores (definida antes del objeto)
const buscarColaboradoresDesdeAPI = async (query = '', getAuthHeader) => {
  try {
    const trimmedQuery = query.trim();
    const response = await fetch('/api/colaboradores', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      return [];
    }
    
    // Si hay query, filtrar los resultados
    if (trimmedQuery) {
      const filtered = data.filter(colab => {
        const nombre = (colab.NOMBRE || colab.nombre || '').toLowerCase();
        const apellido = (colab.APELLIDO || colab.apellido || '').toLowerCase();
        const documento = String(colab.NUMERO_DOCUMENTO || colab.numero_documento || '');
        const queryLower = trimmedQuery.toLowerCase();
        
        // Si es numérico, buscar solo por documento
        if (/^\d+$/.test(trimmedQuery)) {
          return documento.includes(trimmedQuery);
        }
        
        return nombre.includes(queryLower) || apellido.includes(queryLower);
      });
      return filtered.slice(0, 100);
    }
    
    return data.slice(0, 100);
  } catch (error) {
    console.error('❌ Error en buscarColaboradoresDesdeAPI:', error);
    return [];
  }
};

const boletasService = {
  // Periodos
  getPeriodos: async () => {
    const response = await fetch(`${API_BASE_URL}/periodos`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
    });
    return handleResponse(response);
  },

  createPeriodo: async (periodoData) => {
    const response = await fetch(`${API_BASE_URL}/periodos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(periodoData)
    });
    return handleResponse(response);
  },

  // Extracción de PDF
  extraerPDF: async (file) => {
    const formData = new FormData();
    formData.append('pdf', file);
    const response = await fetch(`${API_BASE_URL}/boletas/extraer-pdf`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
      body: formData
    });
    return handleResponse(response);
  },

  extraerPDFMasivo: async (files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('pdfs', file));
    const response = await fetch(`${API_BASE_URL}/boletas/extraer-pdf-masivo`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
      body: formData
    });
    return handleResponse(response);
  },

  // Boletas
  getBoletas: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_BASE_URL}/boletas?${params}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
    });
    return handleResponse(response);
  },

  getBoletaById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/boletas/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
    });
    return handleResponse(response);
  },

  createBoleta: async (boletaData) => {
    const response = await fetch(`${API_BASE_URL}/boletas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(boletaData)
    });
    return handleResponse(response);
  },

  updateBoleta: async (id, boletaData) => {
    const response = await fetch(`${API_BASE_URL}/boletas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(boletaData)
    });
    return handleResponse(response);
  },

  generarPDF: async (id) => {
    const response = await fetch(`${API_BASE_URL}/boletas/${id}/generar-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({})
    });
    return handleResponse(response);
  },

  // Búsqueda de colaboradores - Usa la misma API que el módulo de gestión de colaboradores
  buscarColaboradores: async (query = '') => {
    try {
      const trimmedQuery = query.trim();
      
      // Usar la API de colaboradores que funciona en el módulo de gestión
      // Primero intentar con la API de boletas, si falla usar la de colaboradores
      let url;
      let useBoletasAPI = true;
      
      if (trimmedQuery) {
        // Si es numérico, buscar por documento
        if (/^\d+$/.test(trimmedQuery)) {
          url = `${API_BASE_URL}/boletas/colaboradores?documento=${encodeURIComponent(trimmedQuery)}`;
        } else {
          // Buscar por nombre
          url = `${API_BASE_URL}/boletas/colaboradores?nombre=${encodeURIComponent(trimmedQuery)}`;
        }
      } else {
        // Si no hay query, obtener todos los colaboradores desde la API de colaboradores
        url = '/api/colaboradores';
        useBoletasAPI = false;
      }
      
      console.log('🔍 Buscando colaboradores en:', url);
      console.log('🔍 Usando API de boletas:', useBoletasAPI);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
      });
      
      console.log('📡 Respuesta status:', response.status);
      console.log('📡 Respuesta ok:', response.ok);
      
      if (!response.ok) {
        // Si falla la API de boletas y hay query, intentar con la API de colaboradores
        if (useBoletasAPI && trimmedQuery) {
          console.log('⚠️ API de boletas falló, intentando con API de colaboradores...');
          return await buscarColaboradoresDesdeAPI(query);
        }
        const errorText = await response.text();
        console.error('❌ Error en respuesta:', errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ Datos recibidos:', data);
      console.log('✅ Es array?', Array.isArray(data));
      console.log('✅ Cantidad:', Array.isArray(data) ? data.length : 'N/A');
      
      if (Array.isArray(data)) {
        // Filtrar por query si es necesario (para la API de colaboradores)
        if (!useBoletasAPI && trimmedQuery) {
          const filtered = data.filter(colab => {
            const nombre = (colab.NOMBRE || colab.nombre || '').toLowerCase();
            const apellido = (colab.APELLIDO || colab.apellido || '').toLowerCase();
            const documento = String(colab.NUMERO_DOCUMENTO || colab.numero_documento || '');
            const queryLower = trimmedQuery.toLowerCase();
            
            return nombre.includes(queryLower) || 
                   apellido.includes(queryLower) || 
                   documento.includes(trimmedQuery);
          });
          console.log('✅ Resultados filtrados:', filtered.length);
          return filtered.slice(0, 100); // Limitar a 100 resultados
        }
        return data.slice(0, 100); // Limitar a 100 resultados
      } else if (data && typeof data === 'object') {
        // Si viene envuelto en un objeto
        const wrapped = data.data || data.colaboradores || data.results || [];
        return Array.isArray(wrapped) ? wrapped.slice(0, 100) : [];
      }
      
      return [];
    } catch (error) {
      console.error('❌ Error en buscarColaboradores:', error);
      // Si falla, intentar con la API de colaboradores
      if (query.trim()) {
        console.log('⚠️ Intentando búsqueda alternativa...');
        return await buscarColaboradoresDesdeAPI(query, getAuthHeader);
      }
      return [];
    }
  },

  buscarColaboradorPorDocumento: async (documento) => {
    try {
      // Intentar primero con la API de boletas
      const response = await fetch(`${API_BASE_URL}/boletas/colaboradores?documento=${encodeURIComponent(documento)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
      });
      
      if (response.ok) {
        const data = await handleResponse(response);
        return Array.isArray(data) ? data : (data?.data || data?.colaboradores || []);
      }
      
      // Si falla, usar la API de colaboradores y filtrar
      return await buscarColaboradoresDesdeAPI(documento, getAuthHeader);
    } catch (error) {
      console.error('Error en buscarColaboradorPorDocumento:', error);
      // Fallback a API de colaboradores
      return await buscarColaboradoresDesdeAPI(documento, getAuthHeader);
    }
  },

  buscarColaboradorPorNombre: async (nombre) => {
    try {
      // Intentar primero con la API de boletas
      const response = await fetch(`${API_BASE_URL}/boletas/colaboradores?nombre=${encodeURIComponent(nombre)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
      });
      
      if (response.ok) {
        const data = await handleResponse(response);
        return Array.isArray(data) ? data : (data?.data || data?.colaboradores || []);
      }
      
      // Si falla, usar la API de colaboradores y filtrar
      return await buscarColaboradoresDesdeAPI(nombre, getAuthHeader);
    } catch (error) {
      console.error('Error en buscarColaboradorPorNombre:', error);
      // Fallback a API de colaboradores
      return await buscarColaboradoresDesdeAPI(nombre, getAuthHeader);
    }
  }
};

export default boletasService;
