"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "../../components/context/AuthContext";
import { InputWithIcon } from "../../components/ui/InputWithIcon";
import { FeatureList } from "../../components/login/FeatureList";
import { validateEmail } from "../../utils/helpers";

export default function LoginPage() {
  const router = useRouter();
  const { user, login, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
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

    if (!formData.email.trim()) {
      newErrors.email = "El usuario es requerido";
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
    const result = await login(formData.email, formData.password);

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
      {/* Sección izquierda - Panel de características */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Imagen de fondo */}
        <div className="absolute inset-0">
          <Image
            src="/images/fondo_zeus_izquierdo.jpg"
            alt="Fondo Zeus"
            fill
            className="object-cover"
            priority
            quality={90}
          />
        </div>
        
        {/* Overlay oscuro para legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-blue-900/75 to-indigo-900/80"></div>
        
        {/* Overlay adicional para mejor contraste */}
        <div className="absolute inset-0 bg-black/30"></div>

        <div className="relative z-10 w-full p-12 pl-20 pt-48 flex flex-col justify-between">
          {/* Lista de características */}
          <div>
            <div className="space-y-6">
              <FeatureList />
            </div>
          </div>

          {/* Footer del panel izquierdo */}
          <div className="pt-8 border-t border-white/20">
            <p className="text-white/90 text-sm leading-relaxed font-normal">
              Plataforma profesional para la gestión eficiente de importaciones y logística.
            </p>
          </div>
        </div>
      </div>

      {/* Sección derecha - Formulario de Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-white overflow-hidden">
        <div className="w-full max-w-md">
          {/* Card del formulario */}
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            {/* Gradiente superior sutil y profesional */}
            <div className="h-2 bg-gradient-to-r from-blue-600 via-blue-700 to-slate-800"></div>
            
            <div className="p-8">
              {/* Logo y branding */}
              <div className="text-center mb-8">
                <div className="flex justify-center mb-6">
                  <div className="relative w-40 h-40">
                    <Image
                      src="/images/logotipo_zeus_safety.png"
                      alt="Zeus Safety Logo"
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                    Iniciar Sesión
                  </h2>
                  <div className="w-16 h-1 bg-gradient-to-r from-blue-600 to-slate-800 mx-auto rounded-full"></div>
                  <p className="text-gray-500 text-sm font-medium pt-1">
                    Accede al sistema con tus credenciales
                  </p>
                </div>
              </div>

              {/* Formulario */}
              <form className="space-y-6" onSubmit={handleSubmit}>
                <InputWithIcon
                  label="Usuario"
                  type="text"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Usuario"
                  error={errors.email}
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

                <div className="relative">
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
                    className="absolute right-4 top-9 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
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
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {errors.submit}
                  </div>
                )}

                <div className="pt-2">
                  <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-500/20 backdrop-blur-sm border-2 border-blue-400/40 hover:bg-blue-500/30 hover:border-blue-500/60 text-blue-600 font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform hover:scale-[1.01] active:scale-[0.99]"
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
              <div className="mt-6 pt-5 border-t border-gray-200 text-center">
                <a
                  href="#"
                  className="text-sm text-gray-600 hover:text-blue-700 transition-colors font-medium inline-flex items-center space-x-1 group"
                >
                  <span>¿Olvidaste tu contraseña?</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-8">
            © {new Date().getFullYear()} Zeus Safety. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
