"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";
import { useAuth } from "../../../components/context/AuthContext";

// Componente de Dropdown personalizado
const CustomSelect = ({ name, value, onChange, options, placeholder, required, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const selectRef = useRef(null);
  const buttonRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value);

  const handleSelect = (optionValue) => {
    onChange({ target: { name, value: optionValue } });
    setIsOpen(false);
  };

  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      // Calcular si hay espacio suficiente abajo
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = 240; // max-h-60 = 240px aproximadamente
      
      // Si hay más espacio arriba que abajo, abrir hacia arriba
      setOpenUpward(spaceAbove > spaceBelow && spaceBelow < dropdownHeight);
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={selectRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={`w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm bg-white text-gray-900 flex items-center justify-between shadow-sm hover:shadow-md ${
          isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''
        }`}
        style={{ borderRadius: '0.5rem' }}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? (openUpward ? '' : 'transform rotate-180') : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div 
          className={`absolute z-50 w-full bg-white shadow-xl overflow-hidden ${
            openUpward ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
          style={{ 
            borderRadius: '0.5rem',
            border: 'none',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div className="max-h-60 overflow-y-auto custom-scrollbar p-1.5">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full text-left px-4 py-3 transition-all duration-150 ${
                  value === option.value
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-gray-900 hover:bg-gray-50'
                }`}
                style={{ 
                  borderRadius: '0.375rem',
                  margin: '0.125rem 0',
                  border: 'none'
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input hidden para el formulario */}
      <input type="hidden" name={name} value={value || ''} required={required} />
    </div>
  );
};

export default function EditarPerfilPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState({
    primerNombre: "",
    segundoNombre: "",
    primerApellido: "",
    segundoApellido: "",
    fechaNacimiento: "",
    fechaIngreso: "",
    fechaPlanilla: "",
    usuario: "",
    contraseña: "",
    correo: "",
    areaPrincipal: "",
    rol: "",
  });

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

  // Cargar datos del usuario (simulado)
  useEffect(() => {
    if (user) {
      // Determinar si user.email es realmente un email (contiene @) o es un username
      const userEmail = user.email || "";
      const isEmail = userEmail.includes("@");
      
      // Si user.email no contiene @, entonces es un username
      // Si contiene @, entonces es un email real
      let username = user.username || user.name || user.usuario || "";
      let email = user.correo || "";
      
      if (!isEmail && userEmail) {
        // Si no es un email, es un username
        username = userEmail;
        email = ""; // No hay email real
      } else if (isEmail) {
        // Si es un email real, usarlo para el campo correo
        email = userEmail;
        // El username debe venir de otra propiedad
        username = user.username || user.name || user.usuario || "";
      }
      
      setFormData({
        primerNombre: user.primerNombre || "",
        segundoNombre: user.segundoNombre || "",
        primerApellido: user.primerApellido || "",
        segundoApellido: user.segundoApellido || "",
        fechaNacimiento: user.fechaNacimiento || "",
        fechaIngreso: user.fechaIngreso || "2024-01-15",
        fechaPlanilla: user.fechaPlanilla || "2024-01-15",
        usuario: username,
        contraseña: "••••••••", // Mostrar como no modificable
        correo: email,
        areaPrincipal: user.areaPrincipal || "",
        rol: user.rol || "",
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Aquí iría la lógica para guardar los datos
      console.log("Datos a guardar:", formData);
      
      // Simulación de guardado
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      alert("Perfil actualizado correctamente");
      router.push("/perfil");
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      alert("Error al actualizar el perfil");
    } finally {
      setIsLoading(false);
    }
  };

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
              className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] text-white rounded-lg font-semibold hover:shadow-md hover:scale-105 transition-all duration-200 ripple-effect relative overflow-hidden text-sm group"
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
                  <div className="w-12 h-12 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] rounded-xl flex items-center justify-center text-white shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Editar Perfil</h1>
                    <p className="text-sm text-gray-600 font-medium mt-0.5">Actualiza tu información personal</p>
                  </div>
                </div>
              </div>

              {/* Formulario */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Primer Nombre */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Primer Nombre <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="primerNombre"
                      value={formData.primerNombre}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
                      required
                    />
                  </div>

                  {/* Segundo Nombre */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Segundo Nombre
                    </label>
                    <input
                      type="text"
                      name="segundoNombre"
                      value={formData.segundoNombre}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
                    />
                  </div>

                  {/* Primer Apellido */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Primer Apellido <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="primerApellido"
                      value={formData.primerApellido}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
                      required
                    />
                  </div>

                  {/* Segundo Apellido */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Segundo Apellido
                    </label>
                    <input
                      type="text"
                      name="segundoApellido"
                      value={formData.segundoApellido}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
                    />
                  </div>

                  {/* Fecha de Nacimiento */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Fecha de Nacimiento <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="fechaNacimiento"
                      value={formData.fechaNacimiento}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
                      required
                    />
                  </div>

                  {/* Fecha de Ingreso (no modificable) */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Fecha de Ingreso
                    </label>
                    <input
                      type="date"
                      name="fechaIngreso"
                      value={formData.fechaIngreso}
                      disabled
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed text-sm"
                    />
                  </div>

                  {/* Fecha de Planilla y Correo en la misma fila */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Fecha de Planilla
                    </label>
                    <input
                      type="date"
                      name="fechaPlanilla"
                      value={formData.fechaPlanilla}
                      disabled
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed text-sm"
                    />
                  </div>

                  {/* Correo (no modificable) */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Correo
                    </label>
                    <input
                      type="email"
                      name="correo"
                      value={formData.correo}
                      disabled
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed text-sm"
                    />
                  </div>

                  {/* Usuario y Contraseña en la misma fila */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Usuario
                    </label>
                    <input
                      type="text"
                      name="usuario"
                      value={formData.usuario}
                      disabled
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed text-sm"
                    />
                  </div>

                  {/* Contraseña (no modificable) */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Contraseña
                    </label>
                    <input
                      type="password"
                      name="contraseña"
                      value={formData.contraseña}
                      disabled
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed text-sm"
                    />
                  </div>

                  {/* Área Principal */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Área Principal <span className="text-red-500">*</span>
                    </label>
                    <CustomSelect
                      name="areaPrincipal"
                      value={formData.areaPrincipal}
                      onChange={handleInputChange}
                      placeholder="Seleccionar área"
                      required
                      options={[
                        { value: "Gerencia", label: "Gerencia" },
                        { value: "Administración", label: "Administración" },
                        { value: "Importación", label: "Importación" },
                        { value: "Logística", label: "Logística" },
                        { value: "Facturación", label: "Facturación" },
                        { value: "Marketing", label: "Marketing" },
                        { value: "Sistemas", label: "Sistemas" },
                        { value: "Recursos Humanos", label: "Recursos Humanos" },
                        { value: "Ventas", label: "Ventas" },
                      ]}
                    />
                  </div>

                  {/* Rol */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Rol <span className="text-red-500">*</span>
                    </label>
                    <CustomSelect
                      name="rol"
                      value={formData.rol}
                      onChange={handleInputChange}
                      placeholder="Seleccionar rol"
                      required
                      options={[
                        { value: "Administrador", label: "Administrador" },
                        { value: "Usuario", label: "Usuario" },
                        { value: "Supervisor", label: "Supervisor" },
                        { value: "Gerente", label: "Gerente" },
                      ]}
                    />
                  </div>
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
                    className="px-6 py-2.5 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] text-white rounded-lg font-semibold shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {isLoading ? "Guardando..." : "Guardar Cambios"}
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

