"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "../../components/layout/Header";
import { Sidebar } from "../../components/layout/Sidebar";
import { useAuth } from "../../components/context/AuthContext";

export default function CambiarContraseñaPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState({
    actual: false,
    nueva: false,
    confirmar: false,
  });
  const [formData, setFormData] = useState({
    contraseña_actual: "",
    contraseña_nueva: "",
    contraseña_confirmar: "",
  });
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Detectar si es desktop y abrir sidebar automáticamente
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.contraseña_actual.trim()) {
      newErrors.contraseña_actual = "La contraseña actual es requerida";
    }

    if (!formData.contraseña_nueva.trim()) {
      newErrors.contraseña_nueva = "La nueva contraseña es requerida";
    } else if (formData.contraseña_nueva.length < 6) {
      newErrors.contraseña_nueva = "La contraseña debe tener al menos 6 caracteres";
    }

    if (!formData.contraseña_confirmar.trim()) {
      newErrors.contraseña_confirmar = "Por favor confirma la nueva contraseña";
    } else if (formData.contraseña_nueva !== formData.contraseña_confirmar) {
      newErrors.contraseña_confirmar = "Las contraseñas no coinciden";
    }

    if (formData.contraseña_actual === formData.contraseña_nueva) {
      newErrors.contraseña_nueva = "La nueva contraseña debe ser diferente a la actual";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setNotification({ show: false, message: "", type: "" });

    try {
      // Obtener el usuario del contexto o localStorage
      const storedUser = localStorage.getItem("user");
      const currentUser = user || (storedUser ? JSON.parse(storedUser) : null);

      if (!currentUser) {
        throw new Error("No se encontró información del usuario. Por favor, inicia sesión nuevamente.");
      }

      // Obtener el nombre de usuario
      const username = currentUser.name || currentUser.email || currentUser.id || currentUser.usuario || "";

      if (!username) {
        throw new Error("No se pudo identificar el usuario.");
      }

      // Llamar a la API para cambiar la contraseña
      const apiUrl = `https://api-login-accesos-2946605267.us-central1.run.app?metodo=update_password`;
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          user: username,
          password_actual: formData.contraseña_actual,
          password_nueva: formData.contraseña_nueva,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Mostrar notificación de éxito
      setNotification({
        show: true,
        message: data.message || "Contraseña actualizada exitosamente",
        type: "success",
      });

      // Limpiar el formulario
      setFormData({
        contraseña_actual: "",
        contraseña_nueva: "",
        contraseña_confirmar: "",
      });

      // Ocultar notificación después de 3 segundos
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "" });
      }, 3000);

    } catch (error) {
      console.error("Error al cambiar contraseña:", error);
      setNotification({
        show: true,
        message: error.message || "Error al cambiar la contraseña. Por favor, intenta nuevamente.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F7FAFF' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${
          sidebarOpen ? "lg:ml-60 ml-0" : "ml-0"
        }`}
      >
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto custom-scrollbar" style={{ background: '#F7FAFF' }}>
          <div className="max-w-[95%] mx-auto px-4 py-4">
            {/* Botón Volver */}
            <button
              onClick={() => router.push("/perfil")}
              className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-[#002D5A] to-[#002D5A] text-white rounded-lg font-semibold hover:shadow-md hover:scale-105 transition-all duration-200 text-sm group"
            >
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver</span>
            </button>

            {/* Card contenedor blanco */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6" style={{ boxShadow: '0px 4px 12px rgba(0,0,0,0.06)', borderRadius: '14px' }}>
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#002D5A] to-[#002D5A] rounded-xl flex items-center justify-center text-white shadow-sm">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Cambiar Contraseña</h1>
                    <p className="text-sm text-gray-600 font-medium mt-0.5">Actualiza tu contraseña de acceso</p>
                  </div>
                </div>
              </div>

              {/* Notificación */}
              {notification.show && (
                <div
                  className={`mb-6 p-4 rounded-lg border ${
                    notification.type === "success"
                      ? "bg-green-50 border-green-200 text-green-800"
                      : "bg-red-50 border-red-200 text-red-800"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {notification.type === "success" ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    <p className="font-medium">{notification.message}</p>
                  </div>
                </div>
              )}

              {/* Formulario */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Contraseña Actual */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Contraseña Actual
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword.actual ? "text" : "password"}
                      name="contraseña_actual"
                      value={formData.contraseña_actual}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        errors.contraseña_actual ? "border-red-300 bg-red-50" : "border-gray-300 bg-white"
                      }`}
                      placeholder="Ingresa tu contraseña actual"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("actual")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword.actual ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0L12 12m-5.71-5.71L12 12" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.contraseña_actual && (
                    <p className="mt-1 text-xs text-red-600">{errors.contraseña_actual}</p>
                  )}
                </div>

                {/* Nueva Contraseña */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword.nueva ? "text" : "password"}
                      name="contraseña_nueva"
                      value={formData.contraseña_nueva}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        errors.contraseña_nueva ? "border-red-300 bg-red-50" : "border-gray-300 bg-white"
                      }`}
                      placeholder="Ingresa tu nueva contraseña"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("nueva")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword.nueva ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0L12 12m-5.71-5.71L12 12" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.contraseña_nueva && (
                    <p className="mt-1 text-xs text-red-600">{errors.contraseña_nueva}</p>
                  )}
                </div>

                {/* Confirmar Nueva Contraseña */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Confirmar Nueva Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword.confirmar ? "text" : "password"}
                      name="contraseña_confirmar"
                      value={formData.contraseña_confirmar}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        errors.contraseña_confirmar ? "border-red-300 bg-red-50" : "border-gray-300 bg-white"
                      }`}
                      placeholder="Confirma tu nueva contraseña"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("confirmar")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword.confirmar ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0L12 12m-5.71-5.71L12 12" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.contraseña_confirmar && (
                    <p className="mt-1 text-xs text-red-600">{errors.contraseña_confirmar}</p>
                  )}
                </div>

                {/* Botones de acción */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => router.push("/perfil")}
                    className="px-6 py-2.5 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors duration-200 text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2.5 bg-gradient-to-br from-[#002D5A] to-[#002D5A] text-white rounded-lg font-semibold shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {isLoading ? "Guardando..." : "Cambiar Contraseña"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

