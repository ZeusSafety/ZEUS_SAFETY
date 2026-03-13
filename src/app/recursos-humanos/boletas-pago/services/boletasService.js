const API_BASE_URL = 'https://api-boletas-pago-zeus-2946605267.us-central1.run.app';

const getAuthHeader = () => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const handleResponse = async (response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMsg = data.error || data.message || `Error del servidor (${response.status})`;
    throw new Error(errorMsg);
  }
  return data;
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

  // Búsqueda de colaboradores
  buscarColaboradorPorDocumento: async (documento) => {
    const response = await fetch(`${API_BASE_URL}/boletas/colaboradores?documento=${documento}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
    });
    return handleResponse(response);
  },

  buscarColaboradorPorNombre: async (nombre) => {
    const response = await fetch(`${API_BASE_URL}/boletas/colaboradores?nombre=${nombre}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
    });
    return handleResponse(response);
  }
};

export default boletasService;
