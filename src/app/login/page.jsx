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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E63F7]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-2 sm:p-4" style={{ background: '#F7FAFF' }}>
      {/* Formulario de Login - Centrado */}
      <div className="w-full flex items-center justify-center animate-fadeIn">
        <div className="w-full max-w-md mx-auto">
          {/* Card del formulario */}
          <div className="relative bg-[#FFFFFF] border border-[#E6EAF2] overflow-hidden" style={{ 
            boxShadow: '0px 4px 12px rgba(0,0,0,0.06)',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            borderBottomLeftRadius: '32px',
            borderBottomRightRadius: '32px'
          }}>
            {/* Degradado sutil en la parte superior */}
            <div 
              className="absolute top-0 left-0 right-0 pointer-events-none"
              style={{ 
                height: '15%',
                background: 'linear-gradient(to bottom, #F7FAFF, #FFFFFF)',
                opacity: 0.6,
                borderTopLeftRadius: '24px',
                borderTopRightRadius: '24px'
              }}
            />
            <div className="p-5 sm:p-6 relative z-10">
              {/* Logo y branding */}
              <div className="text-center mb-4 sm:mb-5">
                <div className="flex justify-center mb-3 sm:mb-4">
                  <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-44 md:h-44 transform transition-transform duration-300 hover:scale-105">
                    <Image
                      src="/images/logo_zeus_safety.png"
                      alt="Zeus Safety Logo"
                      fill
                      className="object-contain drop-shadow-lg"
                      priority
                    />
                  </div>
                </div>
                
                <div className="space-y-1.5 sm:space-y-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                    Iniciar Sesión
                  </h2>
                  <div className="w-12 sm:w-16 h-0.5 sm:h-1 bg-gradient-to-r from-[#1E63F7] to-[#1E63F7] mx-auto rounded-full"></div>
                  <p className="text-gray-600 text-xs sm:text-sm font-medium pt-0.5 sm:pt-1">
                    Accede al sistema con tus credenciales
                  </p>
                </div>
              </div>

              {/* Formulario */}
              <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
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
                  premium={true}
                  icon={
                    <svg
                      className="w-4.5 h-4.5"
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
                    premium={true}
                    icon={
                      <svg
                        className="w-4.5 h-4.5"
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
                    className="absolute right-4 top-[70%] -translate-y-1/2 text-[#8A94A6] hover:text-gray-700 focus:outline-none transition-colors"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? (
                      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>

                {errors.submit && (
                  <div className="bg-gradient-to-r from-red-50 to-red-100/80 border-2 border-red-300 text-red-700 px-4 py-3.5 rounded-xl text-sm font-medium shadow-sm animate-shake">
                    {errors.submit}
                  </div>
                )}

                <div className="pt-1 sm:pt-2 flex justify-center">
                  <button
                  type="submit"
                  disabled={isLoading}
                  className="w-3/4 sm:w-2/3 sm:max-w-xs bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] text-white font-semibold py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl flex items-center justify-center space-x-2 shadow-sm hover:shadow-md hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#1E63F7] focus:ring-offset-2 transition-all duration-200 active:scale-[0.98] relative overflow-hidden text-xs sm:text-sm group"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 group-hover:animate-shimmer"></span>
                  <span className="relative z-10 flex items-center space-x-2">
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Ingresando...</span>
                      </>
                    ) : (
                      <>
                        <span className="whitespace-nowrap">Ingresar al Sistema</span>
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </>
                    )}
                  </span>
                  </button>
                </div>
              </form>

              {/* Footer del formulario */}
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4">
                <div className="text-center">
                  <Link
                    href="/forgot-password"
                    className="text-sm text-gray-600 hover:text-[#1E63F7] transition-all duration-200 font-medium inline-flex items-center space-x-1.5 group"
                  >
                    <span className="group-hover:underline">¿Olvidaste tu contraseña?</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
