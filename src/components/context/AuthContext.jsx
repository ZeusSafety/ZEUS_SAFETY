"use client";

import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay un usuario en localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (user, password) => {
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: user, password }),
      });

      // Verificar si la respuesta es exitosa antes de parsear
      if (!response.ok) {
        let errorMessage = "Error al autenticar con el servidor";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // Si no se puede parsear como JSON, leer como texto
          try {
            const errorText = await response.text();
            if (errorText) {
              errorMessage = errorText;
            }
          } catch (e2) {
            errorMessage = `Error ${response.status}: ${response.statusText}`;
          }
        }
        console.error("Login error:", response.status, errorMessage);
        return { success: false, error: errorMessage };
      }

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error("Error parsing response:", parseError);
        const textResponse = await response.text();
        console.error("Response text:", textResponse);
        return { 
          success: false, 
          error: `Error en la respuesta del servidor: ${response.status} ${response.statusText}` 
        };
      }

      // Log para depuración - mostrar contenido completo
      console.log("=== LOGIN RESPONSE ===");
      console.log("Response status:", response.status);
      console.log("Full response:", JSON.stringify(data, null, 2));
      console.log("User object:", JSON.stringify(data.user, null, 2));
      console.log("User modules (array):", data.user?.modules);
      console.log("User modules (stringified):", JSON.stringify(data.user?.modules, null, 2));
      console.log("User isAdmin:", data.user?.isAdmin);
      console.log("=====================");

      if (data.success) {
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("token", data.token);
        localStorage.setItem("tokenCreatedAt", Date.now().toString());
        // Marcar que se acaba de iniciar sesión para mostrar el banner de bienvenida
        sessionStorage.setItem("showWelcomeBanner", "true");
        return { success: true };
      }

      return { success: false, error: data.error || "Error desconocido" };
    } catch (error) {
      console.error("Login catch error:", error);
      return { 
        success: false, 
        error: error.message || "Error de conexión. Verifica tu conexión a internet." 
      };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("tokenCreatedAt");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de AuthProvider");
  }
  return context;
}

