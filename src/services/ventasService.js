import apiClient from "./api";

class VentasService {
  async getAll() {
    try {
      const response = await apiClient.get("/ventas");
      return {
        success: true,
        data: response.data || [],
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Error al obtener ventas",
      };
    }
  }

  async getById(id) {
    try {
      const response = await apiClient.get(`/ventas/${id}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Error al obtener la venta",
      };
    }
  }

  async create(ventaData) {
    try {
      const response = await apiClient.post("/ventas", ventaData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Error al crear la venta",
      };
    }
  }

  async update(id, ventaData) {
    try {
      const response = await apiClient.put(`/ventas/${id}`, ventaData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Error al actualizar la venta",
      };
    }
  }

  async delete(id) {
    try {
      await apiClient.delete(`/ventas/${id}`);
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Error al eliminar la venta",
      };
    }
  }
}

export const ventasService = new VentasService();
export default ventasService;

