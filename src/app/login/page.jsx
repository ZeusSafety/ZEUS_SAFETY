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
    
    // Agregar delay mínimo para mejor UX
    const [result] = await Promise.all([
      login(formData.user, formData.password),
      new Promise(resolve => setTimeout(resolve, 1500)) // Mínimo 1.5 segundos
    ]);

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
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
              {isLoading ? (
                /* Estado de carga */
                <div className="flex flex-col items-center justify-center py-16 sm:py-20">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-[3px] border-blue-100 mb-6"></div>
                    <div className="animate-spin rounded-full h-16 w-16 border-t-[3px] border-blue-700 absolute top-0 left-0 mb-6"></div>
                  </div>
                  <p className="text-blue-700 text-sm sm:text-base font-medium tracking-wide" style={{ fontFamily: 'var(--font-poppins)' }}>Verificando sesión...</p>
                </div>
              ) : (
                <>
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
                      <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight" style={{ fontFamily: 'var(--font-poppins)' }}>
                        Iniciar Sesión
                      </h2>
                      <div className="w-16 sm:w-20 h-[2px] bg-blue-700 mx-auto"></div>
                      <p className="text-gray-600 text-xs sm:text-sm font-medium pt-0.5 sm:pt-1" style={{ fontFamily: 'var(--font-poppins)' }}>
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
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
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
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                        />
                      </svg>
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-[70%] -translate-y-1/2 text-gray-400 opacity-60 hover:opacity-100 hover:text-gray-600 focus:outline-none transition-all duration-200"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 11-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>

                {errors.submit && (
                  <div className="bg-gradient-to-r from-red-50 to-red-100/80 border-2 border-red-300 text-red-700 px-4 py-3.5 rounded-xl text-sm font-normal shadow-sm animate-shake" style={{ fontFamily: 'var(--font-poppins)' }}>
                    {errors.submit}
                  </div>
                )}

                    <div className="pt-2 sm:pt-3 flex justify-center">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-gradient-to-br from-blue-700 to-blue-800 text-white font-medium py-2.5 px-16 rounded-[12px] shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2 transition-all duration-200 active:scale-[0.98] relative overflow-hidden group"
                        style={{ fontFamily: 'var(--font-poppins)' }}
                      >
                        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 -translate-x-full group-hover:translate-x-full"></span>
                        <span className="relative z-10 text-sm">
                          Ingresar al Sistema
                        </span>
                      </button>
                    </div>
                  </form>

                  {/* Footer del formulario */}
                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4">
                    <div className="text-center">
                      <Link
                        href="/forgot-password"
                        className="text-sm text-gray-900 hover:text-gray-700 transition-colors duration-200 font-medium inline-flex items-center space-x-1.5 group"
                        style={{ fontFamily: 'var(--font-poppins)' }}
                      >
                        <span className="group-hover:underline">¿Olvidaste tu contraseña?</span>
                        <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
