import apiClient from "./api";

class AuthService {
  async login(email, password) {
    try {
      const response = await apiClient.post("/login", { email, password });
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Error al iniciar sesión",
      };
    }
  }

  async logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return { success: true };
  }

  async getCurrentUser() {
    try {
      const user = localStorage.getItem("user");
      return user ? JSON.parse(user) : null;
    } catch (error) {
      return null;
    }
  }

  isAuthenticated() {
    const token = localStorage.getItem("token");
    return !!token;
  }
}

export const authService = new AuthService();
export default authService;

