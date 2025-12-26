"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { InputWithIcon } from "../../components/ui/InputWithIcon";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e) => {
    const { value } = e.target;
    setEmail(value);
    if (errors.email) {
      setErrors((prev) => ({
        ...prev,
        email: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = "El correo electrónico es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "El correo electrónico no es válido";
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

    // Simular envío (aquí iría la llamada a la API real)
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-2 sm:p-4" style={{ background: '#F7FAFF' }}>
      <div className="w-full flex items-center justify-center animate-fadeIn">
        <div className="w-full max-w-md mx-auto">
          <div className="relative bg-[#FFFFFF] border border-[#E6EAF2] overflow-hidden" style={{ 
            boxShadow: '0px 4px 12px rgba(0,0,0,0.06)',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            borderBottomLeftRadius: '32px',
            borderBottomRightRadius: '32px'
          }}>
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
              {isSubmitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-medium text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                    Correo enviado
                  </h2>
                  <p className="text-gray-600 text-sm font-medium mb-6" style={{ fontFamily: 'var(--font-poppins)' }}>
                    Hemos enviado las instrucciones para recuperar tu contraseña a tu correo electrónico.
                  </p>
                  <Link
                    href="/login"
                    className="inline-flex items-center text-sm text-blue-700 hover:text-blue-800 font-medium transition-colors"
                    style={{ fontFamily: 'var(--font-poppins)' }}
                  >
                    Volver al inicio de sesión
                  </Link>
                </div>
              ) : (
                <>
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
                      <h2 className="text-xl sm:text-2xl font-medium text-gray-900 tracking-tight" style={{ fontFamily: 'var(--font-poppins)' }}>
                        Recuperar Contraseña
                      </h2>
                      <div className="w-12 sm:w-16 h-0.5 sm:h-1 bg-gradient-to-r from-blue-700 to-blue-800 mx-auto rounded-full"></div>
                      <p className="text-gray-600 text-xs sm:text-sm font-medium pt-0.5 sm:pt-1" style={{ fontFamily: 'var(--font-poppins)' }}>
                        Ingresa tu correo electrónico para recuperar tu contraseña
                      </p>
                    </div>
                  </div>

                  <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
                    <InputWithIcon
                      label="Correo Electrónico"
                      type="email"
                      name="email"
                      value={email}
                      onChange={handleChange}
                      placeholder="correo@ejemplo.com"
                      error={errors.email}
                      required
                      autoComplete="email"
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
                            d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                          />
                        </svg>
                      }
                    />

                    <div className="pt-1 sm:pt-2 flex justify-center">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-3/4 sm:w-2/3 sm:max-w-xs bg-gradient-to-br from-blue-700 to-blue-800 text-white font-medium py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl flex items-center justify-center space-x-2 shadow-sm hover:shadow-md hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2 transition-all duration-200 active:scale-[0.98] relative overflow-hidden text-sm sm:text-base group"
                        style={{ fontFamily: 'var(--font-poppins)' }}
                      >
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
                            <span className="whitespace-nowrap">Enviar Instrucciones</span>
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4">
                    <div className="text-center">
                      <Link
                        href="/login"
                        className="text-sm text-gray-600 hover:text-blue-700 transition-all duration-200 font-medium inline-flex items-center space-x-1.5 group"
                        style={{ fontFamily: 'var(--font-poppins)' }}
                      >
                        <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="group-hover:underline">Volver al inicio de sesión</span>
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

