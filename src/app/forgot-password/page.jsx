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

      {/* Sección derecha - Formulario */}
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
                  <div className="relative w-40 h-40">
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
                    Recuperar Contraseña
                  </h2>
                  <div className="w-16 h-1 bg-blue-800/60 mx-auto rounded-full"></div>
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
                          className="w-5 h-5 text-gray-400"
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
                          w-full px-4 py-3 pl-12 border-2 rounded-xl bg-gray-50/50
                          focus:outline-none focus:ring-2 focus:ring-blue-700/30 focus:border-blue-700
                          text-gray-900 placeholder-gray-400 font-medium
                          ${errors.email ? "border-red-400 bg-red-50/50 focus:ring-red-500/30 focus:border-red-500" : "border-gray-300 hover:border-gray-400"}
                        `}
                        required
                        autoComplete="email"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-2 text-sm text-red-600 font-medium">{errors.email}</p>
                    )}
                  </div>

                  <div className="pt-1">
                    <button
                      type="submit"
                      className="w-full bg-blue-700/20 backdrop-blur-sm border-2 border-blue-600/40 hover:bg-blue-700/30 hover:border-blue-700/60 text-blue-800 font-semibold py-3 px-6 rounded-xl flex items-center justify-center space-x-2 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] ripple-effect relative overflow-hidden"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Enviando...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span>Enviar Instrucciones</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-5">
                  {/* Mensaje de éxito */}
                  <div className="bg-gradient-to-br from-blue-50 to-slate-50 border-2 border-blue-200 rounded-xl p-6 text-center">
                    <div className="flex justify-center mb-4">
                      <div className="w-16 h-16 bg-blue-700/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-blue-600/30">
                        <svg className="w-8 h-8 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      ¡Correo Enviado!
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed mb-1">
                      Hemos enviado las instrucciones para recuperar tu contraseña a:
                    </p>
                    <p className="text-blue-800 font-semibold text-sm mb-4">
                      {formData.email}
                    </p>
                    <p className="text-gray-500 text-xs">
                      Por favor revisa tu bandeja de entrada y sigue las instrucciones.
                    </p>
                  </div>

                  <div className="pt-2">
                    <Link
                      href="/login"
                      className="w-full bg-blue-700/20 backdrop-blur-sm border-2 border-blue-600/40 hover:bg-blue-700/30 hover:border-blue-700/60 text-blue-800 font-semibold py-3 px-6 rounded-xl flex items-center justify-center space-x-2 shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      <span>Volver al Inicio de Sesión</span>
                    </Link>
                  </div>
                </div>
              )}

              {/* Footer del formulario */}
              <div className="mt-6 pt-4 border-t border-gray-200/80 text-center">
                <Link
                  href="/login"
                  className="text-sm text-gray-600 hover:text-blue-700 transition-colors font-medium inline-flex items-center space-x-1 group"
                >
                  <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span>Volver al inicio de sesión</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

