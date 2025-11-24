"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "../../components/context/AuthContext";
import { InputWithIcon } from "../../components/ui/InputWithIcon";
import { validateEmail } from "../../utils/helpers";

export default function LoginPage() {
  const router = useRouter();
  const { user, login, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    user: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (!authLoading && user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const handleChange = (e) => {
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

    if (!formData.user.trim()) {
      newErrors.user = "El usuario es requerido";
    }

    if (!formData.password) {
      newErrors.password = "La contraseña es requerida";
    } else if (formData.password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres";
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
    const result = await login(formData.user, formData.password);

    setIsLoading(false);

    if (result.success) {
      router.push("/menu");
    } else {
      setErrors({
        submit: result.error || "Error al iniciar sesión",
      });
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 overflow-hidden">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Sección izquierda - Características */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Imagen de fondo */}
        <div className="absolute inset-0">
          <Image
            src="/images/fondo_zeus_izquierdo.png"
            alt="Fondo Zeus"
            fill
            className="object-cover"
            priority
            quality={90}
          />
        </div>
        
        {/* Overlay azul oscuro transparente */}
        <div className="absolute inset-0 bg-blue-900/50"></div>
        
        {/* Lista de características */}
        <div className="relative z-10 flex flex-col justify-center pl-36 pr-12 py-16">
          <div className="space-y-6">
            {/* Gestión integral de importaciones */}
            <div className="flex items-center space-x-4 group">
              <div className="flex-shrink-0 w-16 h-16 bg-blue-700/20 backdrop-blur-sm border border-blue-700/40 rounded-2xl flex items-center justify-center text-white shadow-sm group-hover:shadow-md group-hover:scale-105 group-hover:bg-blue-700/30 group-hover:border-blue-600/60 transition-all duration-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <p className="text-white font-normal text-base leading-relaxed drop-shadow-lg" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5), 0 0 2px rgba(0,0,0,0.8)' }}>
                Gestión integral de importaciones
              </p>
            </div>

            {/* Seguimiento en tiempo real */}
            <div className="flex items-center space-x-4 group">
              <div className="flex-shrink-0 w-16 h-16 bg-blue-700/20 backdrop-blur-sm border border-blue-700/40 rounded-2xl flex items-center justify-center text-white shadow-sm group-hover:shadow-md group-hover:scale-105 group-hover:bg-blue-700/30 group-hover:border-blue-600/60 transition-all duration-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <p className="text-white font-normal text-base leading-relaxed drop-shadow-lg" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5), 0 0 2px rgba(0,0,0,0.8)' }}>
                Seguimiento en tiempo real
              </p>
            </div>

            {/* Control de accesos y permisos */}
            <div className="flex items-center space-x-4 group">
              <div className="flex-shrink-0 w-16 h-16 bg-blue-700/20 backdrop-blur-sm border border-blue-700/40 rounded-2xl flex items-center justify-center text-white shadow-sm group-hover:shadow-md group-hover:scale-105 group-hover:bg-blue-700/30 group-hover:border-blue-600/60 transition-all duration-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <p className="text-white font-normal text-base leading-relaxed drop-shadow-lg" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5), 0 0 2px rgba(0,0,0,0.8)' }}>
                Control de accesos y permisos
              </p>
            </div>

            {/* Reportes y documentación */}
            <div className="flex items-center space-x-4 group">
              <div className="flex-shrink-0 w-16 h-16 bg-blue-700/20 backdrop-blur-sm border border-blue-700/40 rounded-2xl flex items-center justify-center text-white shadow-sm group-hover:shadow-md group-hover:scale-105 group-hover:bg-blue-700/30 group-hover:border-blue-600/60 transition-all duration-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-white font-normal text-base leading-relaxed drop-shadow-lg" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5), 0 0 2px rgba(0,0,0,0.8)' }}>
                Reportes y documentación
              </p>
            </div>

            {/* Logística y distribución */}
            <div className="flex items-center space-x-4 group">
              <div className="flex-shrink-0 w-16 h-16 bg-blue-700/20 backdrop-blur-sm border border-blue-700/40 rounded-2xl flex items-center justify-center text-white shadow-sm group-hover:shadow-md group-hover:scale-105 group-hover:bg-blue-700/30 group-hover:border-blue-600/60 transition-all duration-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
              </div>
              <p className="text-white font-normal text-base leading-relaxed drop-shadow-lg" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5), 0 0 2px rgba(0,0,0,0.8)' }}>
                Logística y distribución
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sección derecha - Formulario de Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-8 bg-white overflow-hidden">
        <div className="w-full max-w-md">
          {/* Card del formulario */}
          <div className="bg-white rounded-3xl border border-gray-200/60 overflow-hidden shadow-xl" style={{ boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)' }}>
            {/* Barra superior transparente azul */}
            <div className="h-3 bg-blue-700/30 backdrop-blur-sm border-b border-blue-700/50"></div>
            
            <div className="p-6">
              {/* Logo y branding */}
              <div className="text-center mb-6">
                <div className="flex justify-center mb-4">
                  <div className="relative w-48 h-48">
                    <Image
                      src="/images/logo_zeus_safety.png"
                      alt="Zeus Safety Logo"
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                    Iniciar Sesión
                  </h2>
                  <div className="w-16 h-1 bg-blue-800/60 mx-auto rounded-full"></div>
                  <p className="text-gray-600 text-sm font-medium pt-1">
                    Accede al sistema con tus credenciales
                  </p>
                </div>
              </div>

              {/* Formulario */}
              <form className="space-y-5" onSubmit={handleSubmit}>
                <InputWithIcon
                  label="Usuario"
                  type="text"
                  name="user"
                  value={formData.user}
                  onChange={handleChange}
                  placeholder="Usuario"
                  error={errors.user}
                  required
                  autoComplete="username"
                  icon={
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  }
                />

                <div className="relative pt-2">
                  <InputWithIcon
                    label="Contraseña"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Contraseña"
                    error={errors.password}
                    required
                    autoComplete="current-password"
                    icon={
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-[70%] -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>

                {errors.submit && (
                  <div className="bg-red-50/80 border-2 border-red-200 text-red-700 px-4 py-3.5 rounded-xl text-sm font-medium">
                    {errors.submit}
                  </div>
                )}

                <div className="pt-1">
                  <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-700/20 backdrop-blur-sm border-2 border-blue-600/40 hover:bg-blue-700/30 hover:border-blue-700/60 text-blue-800 font-semibold py-3 px-6 rounded-xl flex items-center justify-center space-x-2 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] ripple-effect relative overflow-hidden"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Ingresando...</span>
                    </>
                  ) : (
                    <>
                      <span>Ingresar al Sistema</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                  </button>
                </div>
              </form>

              {/* Footer del formulario */}
              <div className="mt-4 pt-4 border-t border-gray-200/80 text-center">
                <Link
                  href="/forgot-password"
                  className="text-sm text-gray-600 hover:text-blue-800 transition-colors font-medium inline-flex items-center space-x-1 group"
                >
                  <span>¿Olvidaste tu contraseña?</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
