"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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

    if (!formData.email.trim()) {
      newErrors.email = "El correo electrónico es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Por favor ingresa un correo electrónico válido";
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
    
    // Simular envío de solicitud (aquí iría la llamada a la API)
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(to bottom, #f7f9fc, #ffffff)' }}>
      {/* Formulario de Recuperar Contraseña - Centrado */}
      <div className="w-full flex items-center justify-center animate-fadeIn">
        <div className="w-full max-w-md mx-auto">
          {/* Card del formulario */}
          <div className="bg-white rounded-3xl border border-gray-200/80 overflow-hidden" style={{ borderRadius: '14px', boxShadow: '0px 4px 12px rgba(0,0,0,0.06)' }}>
            {/* Barra superior */}
            <div className="h-2 bg-gradient-to-r from-[#155EEF] to-[#3A8DFF]"></div>
            
            <div className="p-6 sm:p-7">
              {/* Logo y branding */}
              <div className="text-center mb-6">
                <div className="flex justify-center mb-4">
                  <div className="relative w-48 h-48 transform transition-transform duration-300 hover:scale-105">
                    <Image
                      src="/images/logo_zeus_safety.png"
                      alt="Zeus Safety Logo"
                      fill
                      className="object-contain drop-shadow-lg"
                      priority
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                    Recuperar Contraseña
                  </h2>
                  <div className="w-16 h-1 bg-gradient-to-r from-[#155EEF] to-[#3A8DFF] mx-auto rounded-full"></div>
                  <p className="text-gray-600 text-sm font-medium pt-1">
                    Ingresa tu correo electrónico para recibir instrucciones
                  </p>
                </div>
              </div>

              {!isSuccess ? (
                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="w-full">
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                      Correo Electrónico
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg
                          className="w-4.5 h-4.5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                          />
                        </svg>
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="correo@ejemplo.com"
                        className={`
                          w-full px-4 py-3 pl-12 border-2 rounded-xl bg-slate-200
                          focus:outline-none focus:ring-2 focus:ring-blue-700/30 focus:border-blue-700
                          text-gray-900 placeholder-gray-400 font-medium
                          ${errors.email ? "border-red-400 bg-red-50/50 focus:ring-red-500/30 focus:border-red-500" : "border-gray-300 hover:border-gray-400"}
                        `}
                        required
                        autoComplete="email"
                      />
                    </div>
                    {errors.email && (
                      <div className="mt-2 bg-gradient-to-r from-red-50 to-red-100/80 border-2 border-red-300 text-red-700 px-4 py-3.5 rounded-xl text-sm font-medium shadow-sm animate-shake">
                        {errors.email}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex justify-center">
                    <button
                      type="submit"
                      className="w-2/3 max-w-xs bg-gradient-to-br from-[#155EEF] to-[#1D4ED8] text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center space-x-2 shadow-sm hover:shadow-md hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#155EEF] focus:ring-offset-2 transition-all duration-200 active:scale-[0.98] relative overflow-hidden text-sm group"
                      disabled={isLoading}
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 group-hover:animate-shimmer"></span>
                      <span className="relative z-10 flex items-center space-x-2">
                        {isLoading ? (
                          <>
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Enviando...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span>Enviar Instrucciones</span>
                          </>
                        )}
                      </span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  {/* Mensaje de éxito */}
                  <div className="bg-gradient-to-br from-blue-50 to-slate-50 border-2 border-blue-200 rounded-xl p-5 text-center">
                    <div className="flex justify-center mb-3">
                      <div className="w-14 h-14 bg-[#155EEF]/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-[#0B327B]">
                        <svg className="w-7 h-7 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      ¡Correo Enviado!
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed mb-1">
                      Hemos enviado las instrucciones para recuperar tu contraseña a:
                    </p>
                    <p className="text-blue-800 font-semibold text-sm mb-3">
                      {formData.email}
                    </p>
                    <p className="text-gray-500 text-xs">
                      Por favor revisa tu bandeja de entrada y sigue las instrucciones.
                    </p>
                  </div>

                  <div className="pt-2 flex justify-center">
                    <Link
                      href="/login"
                      className="w-2/3 max-w-xs bg-gradient-to-br from-[#155EEF] to-[#1D4ED8] text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center space-x-2 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200 active:scale-[0.98] text-sm group"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 group-hover:animate-shimmer"></span>
                      <span className="relative z-10 flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span>Volver al Inicio de Sesión</span>
                      </span>
                    </Link>
                  </div>
                </div>
              )}

              {/* Footer del formulario */}
              <div className="mt-5 pt-4 border-t border-gray-200/60 text-center">
                <Link
                  href="/login"
                  className="text-sm text-gray-600 hover:text-[#1D4ED8] transition-all duration-200 font-medium inline-flex items-center space-x-1.5 group"
                >
                  <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span className="group-hover:underline">Volver al inicio de sesión</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

