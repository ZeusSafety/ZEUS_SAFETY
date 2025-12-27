"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";
import { useAuth } from "../../../components/context/AuthContext";

// Componente de Dropdown personalizado
const CustomSelect = ({ name, value, onChange, options, placeholder, required, label, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const selectRef = useRef(null);
  const buttonRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value);

  const handleSelect = (optionValue) => {
    if (disabled) return;
    onChange({ target: { name, value: optionValue } });
    setIsOpen(false);
  };

  const handleToggle = () => {
    if (disabled) return;
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
        disabled={disabled}
        className={`w-full px-4 py-2.5 border rounded-lg transition-all duration-200 text-sm flex items-center justify-between ${
          disabled 
            ? 'border-gray-300 bg-gray-100 text-gray-600 cursor-not-allowed' 
            : `border-gray-200 bg-[#F7FAFF] text-gray-900 shadow-sm hover:shadow-md focus:ring-2 focus:ring-blue-700 focus:border-blue-700 focus:bg-white ${
          isOpen ? 'ring-2 ring-blue-700 border-blue-700 bg-white' : ''
              }`
        }`}
        style={{ fontFamily: 'var(--font-poppins)', borderRadius: '0.5rem' }}
      >
        <span className={value ? (disabled ? 'text-gray-600' : 'text-gray-900') : 'text-gray-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`w-5 h-5 transition-transform duration-200 ${
            disabled 
              ? 'text-gray-400' 
              : `text-gray-400 ${isOpen ? (openUpward ? '' : 'transform rotate-180') : ''}`
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && !disabled && (
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
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-900 hover:bg-gray-50'
                }`}
                style={{ 
                  fontFamily: 'var(--font-poppins)',
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
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState(null);

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
    imgUrl: "",
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

  // Función para obtener datos del perfil de usuario desde la API
  const fetchPerfilUsuario = useCallback(async () => {
    try {
      setLoadingData(true);
      setError(null);
      
      // Verificar que estamos en el cliente
      if (typeof window === "undefined") {
        throw new Error("Este código debe ejecutarse en el cliente");
      }
      
      // Obtener el token del localStorage
      const token = localStorage.getItem("token");
      
      if (!token || token.trim() === "") {
        throw new Error("No se encontró el token de autenticación. Por favor, inicia sesión nuevamente.");
      }
      
      // Obtener el usuario del contexto o del localStorage
      const storedUser = localStorage.getItem("user");
      const currentUser = user || (storedUser ? JSON.parse(storedUser) : null);
      
      // Obtener el nombre de usuario para la API
      // El objeto de usuario del login tiene: id, email, name, modules, isAdmin, rol
      // No tiene 'username' ni 'usuario', así que usamos name, id o email
      const username = currentUser?.name || currentUser?.id || currentUser?.email || "";
      
      if (!username) {
        throw new Error("No se pudo identificar el usuario. Por favor, inicia sesión nuevamente.");
      }
      
      console.log("Fetching perfil usuario with token:", token.substring(0, 20) + "...");
      console.log("Usuario actual:", currentUser);
      console.log("Username para API:", username);
      
      // Construir la URL con el parámetro user
      const apiUrl = `https://colaboradores2026-2946605267.us-central1.run.app?method=perfil_usuario_2026&user=${encodeURIComponent(username)}`;
      
      console.log("API URL:", apiUrl);
      
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
      
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        // Si el token está caducado (401), redirigir al login
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.push("/login");
          return;
        }
        
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText || "No se pudieron obtener los datos"}`);
      }
      
      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const textData = await response.text();
        try {
          data = JSON.parse(textData);
        } catch (parseError) {
          throw new Error("La respuesta no es un JSON válido");
        }
      }
      
      console.log("=== DATOS RECIBIDOS DE LA API ===");
      console.log("Tipo de datos:", typeof data);
      console.log("Es array?", Array.isArray(data));
      console.log("Datos completos:", JSON.stringify(data, null, 2));
      console.log("Claves del objeto:", data ? Object.keys(data) : "No hay datos");
      
      // La API devuelve directamente el perfil del usuario (no una lista)
      // Puede venir como objeto directo o dentro de una propiedad
      let perfilUsuario = null;
      
      if (data && typeof data === 'object') {
        // Si es un objeto, puede estar directamente o dentro de una propiedad
        if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
          perfilUsuario = data.data;
          console.log("✅ Perfil encontrado en data.data");
        } else if (data.perfil && typeof data.perfil === 'object') {
          perfilUsuario = data.perfil;
          console.log("✅ Perfil encontrado en data.perfil");
        } else if (data.perfil_usuario && typeof data.perfil_usuario === 'object') {
          perfilUsuario = data.perfil_usuario;
          console.log("✅ Perfil encontrado en data.perfil_usuario");
        } else if (data.usuario && typeof data.usuario === 'object') {
          perfilUsuario = data.usuario;
          console.log("✅ Perfil encontrado en data.usuario");
        } else if (data.user && typeof data.user === 'object') {
          perfilUsuario = data.user;
          console.log("✅ Perfil encontrado en data.user");
        } else if (Array.isArray(data) && data.length > 0) {
          // Si es un array, tomar el primer elemento
          perfilUsuario = data[0];
          console.log("✅ Perfil encontrado en array[0]");
        } else if (!Array.isArray(data)) {
          // Si no tiene propiedades anidadas y no es un array, usar el objeto directamente
          perfilUsuario = data;
          console.log("✅ Usando objeto directamente como perfil");
        }
      }
      
      console.log("=== PERFIL USUARIO EXTRAÍDO ===");
      console.log("Perfil usuario:", JSON.stringify(perfilUsuario, null, 2));
      console.log("Claves del perfil:", perfilUsuario ? Object.keys(perfilUsuario) : "No hay perfil");
      
      // Mostrar TODOS los valores del perfil para debug
      if (perfilUsuario) {
        console.log("=== TODOS LOS VALORES DEL PERFIL ===");
        Object.keys(perfilUsuario).forEach(key => {
          console.log(`${key}:`, perfilUsuario[key], `(tipo: ${typeof perfilUsuario[key]})`);
        });
        
        // Buscar específicamente campos relacionados con imagen/foto
        const imageKeys = Object.keys(perfilUsuario).filter(key => {
          const keyUpper = key.toUpperCase();
          return keyUpper.includes("IMG") || keyUpper.includes("FOTO") || 
                 keyUpper.includes("PHOTO") || keyUpper.includes("AVATAR") || 
                 keyUpper.includes("IMAGE") || keyUpper.includes("URL");
        });
        
        if (imageKeys.length > 0) {
          console.log("=== CAMPOS RELACIONADOS CON IMAGEN/FOTO ===");
          imageKeys.forEach(key => {
            console.log(`${key}:`, perfilUsuario[key]);
          });
        } else {
          console.log("⚠️ No se encontraron campos relacionados con imagen/foto");
        }
      }
      
      // Formatear fechas si vienen en formato diferente
      const formatDate = (dateString) => {
        if (!dateString || dateString === "null" || dateString === "undefined") return "";
        // Si ya está en formato YYYY-MM-DD, devolverlo tal cual
        if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return dateString;
        }
        // Si viene en formato DD/MM/YYYY, convertirlo
        if (dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
          const [day, month, year] = dateString.split('/');
          return `${year}-${month}-${day}`;
        }
        // Si viene en otro formato, intentar parsearlo
        try {
          const date = new Date(dateString);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
          }
        } catch (e) {
          console.error("Error al formatear fecha:", e);
        }
        return "";
      };
      
        // Función helper para obtener valores con múltiples variaciones de nombres (incluyendo mayúsculas)
        const getValue = (obj, ...keys) => {
          if (!obj) return "";
          
          // Primero buscar con las claves exactas proporcionadas
          for (const key of keys) {
            // Buscar en minúsculas
            const value = obj[key];
            if (value !== undefined && value !== null && value !== "" && value !== "null" && value !== "undefined") {
              return String(value);
            }
            // Buscar en mayúsculas
            const upperKey = key.toUpperCase();
            const upperValue = obj[upperKey];
            if (upperValue !== undefined && upperValue !== null && upperValue !== "" && upperValue !== "null" && upperValue !== "undefined") {
              return String(upperValue);
            }
            // Buscar case-insensitive en todas las claves del objeto
            const objKeys = Object.keys(obj);
            for (const objKey of objKeys) {
              if (objKey.toUpperCase() === upperKey && obj[objKey] !== undefined && obj[objKey] !== null && obj[objKey] !== "" && obj[objKey] !== "null" && obj[objKey] !== "undefined") {
                return String(obj[objKey]);
              }
            }
          }
          return "";
        };
        
        if (perfilUsuario) {
          // Determinar si el correo es realmente un email (contiene @) o es un username
          const userEmail = getValue(perfilUsuario, "correo", "email", "correo_electronico", "CORREO");
          const isEmail = userEmail.includes("@");
          
          const currentUsername = currentUser?.name || currentUser?.id || currentUser?.email || username;
          let usernameFinal = getValue(perfilUsuario, "usuario", "username", "name", "user", "user_name", "USUARIO") || currentUsername || username || "";
          let emailFinal = userEmail;
          
          if (!isEmail && userEmail) {
            usernameFinal = userEmail;
            emailFinal = "";
          } else if (isEmail) {
            emailFinal = userEmail;
            if (!usernameFinal) {
              usernameFinal = currentUsername || username || "";
            }
          }
          
          // Función para mapear el área de la API a las opciones del dropdown
          const mapArea = (areaValue) => {
            if (!areaValue) return "";
            const areaUpper = String(areaValue).toUpperCase().trim();
            const areaMap = {
              "ADMINISTRACION": "Administración",
              "ADMINISTRACIÓN": "Administración",
              "GERENCIA": "Gerencia",
              "IMPORTACION": "Importación",
              "IMPORTACIÓN": "Importación",
              "LOGISTICA": "Logística",
              "LOGÍSTICA": "Logística",
              "FACTURACION": "Facturación",
              "FACTURACIÓN": "Facturación",
              "MARKETING": "Marketing",
              "SISTEMAS": "Sistemas",
              "RECURSOS HUMANOS": "Recursos Humanos",
              "VENTAS": "Ventas",
            };
            return areaMap[areaUpper] || areaValue;
          };
          
          // Función para mapear el rol de la API a las opciones del dropdown
          const mapRol = (rolValue) => {
            if (!rolValue) return "";
            const rolUpper = String(rolValue).toUpperCase().trim();
            const rolMap = {
              "GERENCIA": "Gerente",
              "GERENTE": "Gerente",
              "ADMINISTRADOR": "Administrador",
              "ADMIN": "Administrador",
              "USUARIO": "Usuario",
              "USER": "Usuario",
              "SUPERVISOR": "Supervisor",
            };
            return rolMap[rolUpper] || rolValue;
          };
          
          // Obtener valores de área y rol de la API - buscar en múltiples variaciones
          const areaFromAPI = perfilUsuario["A.NOMBRE"] || perfilUsuario["a.nombre"] || getValue(perfilUsuario, "areaPrincipal", "area_principal", "area", "department", "departamento", "AREA", "AREA_PRINCIPAL");
          
          // Buscar rol en múltiples variaciones posibles
          let rolFromAPI = perfilUsuario["R.NOMBRE"] || perfilUsuario["r.nombre"] || 
                          getValue(perfilUsuario, "rol", "role", "cargo", "position", "rol_usuario", "ROL", "ROL_USUARIO", "CARGO");
          
          // Si no se encontró, buscar manualmente en todas las keys
          if (!rolFromAPI || rolFromAPI === "" || rolFromAPI === "null" || rolFromAPI === "undefined") {
            const allKeys = Object.keys(perfilUsuario);
            for (const key of allKeys) {
              const keyUpper = key.toUpperCase();
              if ((keyUpper.includes("ROL") || keyUpper.includes("ROLE") || keyUpper.includes("CARGO")) && 
                  !keyUpper.includes("AREA") && !keyUpper.includes("DEPARTAMENTO")) {
                const value = perfilUsuario[key];
                if (value && value !== "" && value !== "null" && value !== "undefined" && typeof value === "string") {
                  rolFromAPI = value;
                  console.log(`✅ Rol encontrado en campo: ${key} = ${rolFromAPI}`);
                  break;
                }
              }
            }
          }
          
          console.log("=== MAPEO DE ÁREA Y ROL ===");
          console.log("areaFromAPI (raw):", areaFromAPI);
          console.log("rolFromAPI (raw):", rolFromAPI);
          console.log("areaFromAPI (mapeado):", mapArea(areaFromAPI));
          console.log("rolFromAPI (mapeado):", mapRol(rolFromAPI));
          console.log("Todos los campos del perfil:", Object.keys(perfilUsuario));
          
          // Mapear los campos según los nombres que vienen de la API en MAYÚSCULAS
          // Nota: La API devuelve campos con puntos como "A.NOMBRE" y "R.NOMBRE"
          const formDataToSet = {
            primerNombre: getValue(perfilUsuario, "NOMBRE", "primerNombre", "primer_nombre", "nombre1", "first_name", "nombre"),
            segundoNombre: getValue(perfilUsuario, "SEGUNDO_NOMBRE", "segundoNombre", "segundo_nombre", "nombre2", "second_name"),
            primerApellido: getValue(perfilUsuario, "APELLIDO", "primerApellido", "primer_apellido", "apellido1", "last_name", "apellido"),
            // El segundo apellido puede venir en diferentes formatos o puede no existir en la API
            segundoApellido: getValue(perfilUsuario, "SEGUNDO_APELLIDO", "SEGUNDO APELLIDO", "segundoApellido", "segundo_apellido", "apellido2", "second_last_name", "apellido_materno", "APELLIDO_MATERNO", "apellidoMaterno"),
            // FECHA_NACIMIENTO - buscar en múltiples variaciones, incluyendo si viene con valor inválido como "MAITA"
            fechaNacimiento: (() => {
              const fechaRaw = getValue(perfilUsuario, "FECHA_NACIMIENTO", "fechaNacimiento", "fecha_nacimiento", "nacimiento", "birth_date", "fecha_nac", "FECHA_NAC", "fechaNac");
              // Si el valor es "MAITA" o similar (no es una fecha), retornar vacío
              if (fechaRaw && fechaRaw.toUpperCase() !== "MAITA" && !isNaN(new Date(fechaRaw).getTime())) {
                return formatDate(fechaRaw);
              }
              return "";
            })(),
            fechaIngreso: formatDate(getValue(perfilUsuario, "FECHA_INGRESO", "fechaIngreso", "fecha_ingreso", "ingreso", "entry_date", "fecha_ing")),
            fechaPlanilla: formatDate(getValue(perfilUsuario, "FECHA_PLANILLA", "fechaPlanilla", "fecha_planilla", "planilla", "payroll_date", "fecha_plan")),
            usuario: usernameFinal || username || currentUsername || "",
            contraseña: "••••••••", // Mostrar como no modificable
            correo: emailFinal,
            // Mapear área y rol a los valores correctos del dropdown
            areaPrincipal: mapArea(areaFromAPI),
            rol: mapRol(rolFromAPI),
            // Obtener URL de imagen - buscar en múltiples variaciones posibles
            imgUrl: (() => {
              // Buscar en todas las variaciones posibles del campo de imagen
              const imgFields = [
                "IMG_URL", "img_url", "IMGURL", "imgUrl",
                "IMAGEN", "imagen", "IMAGEN_URL", "imagen_url",
                "FOTO", "foto", "FOTO_URL", "foto_url", "FOTOURL", "fotoUrl",
                "PHOTO", "photo", "PHOTO_URL", "photo_url",
                "AVATAR", "avatar", "AVATAR_URL", "avatar_url",
                "PERFIL_IMG", "perfil_img", "PERFIL_IMAGEN", "perfil_imagen",
                "FOTO_PERFIL", "foto_perfil", "FOTO_PERFIL_URL", "foto_perfil_url",
                "IMAGE", "image", "IMAGE_URL", "image_url",
                "URL_IMAGEN", "url_imagen", "URL_FOTO", "url_foto"
              ];
              
              // Buscar con getValue primero
              let imgUrl = getValue(perfilUsuario, ...imgFields);
              
              // Si no se encontró, buscar manualmente en todas las keys
              if (!imgUrl || imgUrl === "" || imgUrl === "null" || imgUrl === "undefined") {
                const allKeys = Object.keys(perfilUsuario);
                for (const key of allKeys) {
                  const keyUpper = key.toUpperCase();
                  if ((keyUpper.includes("IMG") || keyUpper.includes("FOTO") || keyUpper.includes("PHOTO") || 
                       keyUpper.includes("AVATAR") || keyUpper.includes("IMAGE")) && 
                      (keyUpper.includes("URL") || keyUpper.includes("ENLACE") || keyUpper.includes("LINK"))) {
                    const value = perfilUsuario[key];
                    if (value && value !== "" && value !== "null" && value !== "undefined" && typeof value === "string") {
                      imgUrl = value;
                      console.log(`✅ Foto encontrada en campo: ${key} = ${imgUrl}`);
                      break;
                    }
                  }
                }
              }
              
              // Log para debugging
              if (imgUrl && imgUrl !== "" && imgUrl !== "null" && imgUrl !== "undefined") {
                console.log(`📸 Foto de perfil encontrada: ${imgUrl}`);
              } else {
                console.log("⚠️ No se encontró foto de perfil en la API");
                console.log("Campos disponibles:", Object.keys(perfilUsuario));
              }
              
              return imgUrl || "";
            })(),
          };
        
        console.log("=== DATOS DEL FORMULARIO A ESTABLECER ===");
        console.log(JSON.stringify(formDataToSet, null, 2));
        console.log("Valores individuales:");
        console.log("- primerNombre:", formDataToSet.primerNombre);
        console.log("- primerApellido:", formDataToSet.primerApellido);
        console.log("- correo:", formDataToSet.correo);
        console.log("- areaPrincipal:", formDataToSet.areaPrincipal);
        console.log("- rol:", formDataToSet.rol);
        
        // Establecer los datos del formulario de forma forzada
        // Usar una función de actualización para asegurar que se apliquen todos los valores
        setFormData(prev => {
          const newData = { ...formDataToSet };
          console.log("🔄 Actualizando formData:");
          console.log("  - Datos anteriores:", JSON.stringify(prev, null, 2));
          console.log("  - Datos nuevos:", JSON.stringify(newData, null, 2));
          return newData;
        });
        console.log("✅ setFormData ejecutado correctamente");
        
        // Forzar re-render después de un pequeño delay para asegurar que se actualice
        setTimeout(() => {
          setFormData(current => {
            console.log("🔄 Verificación post-setFormData:", JSON.stringify(current, null, 2));
            return current;
          });
        }, 100);
      } else {
        // Si no se encuentra el colaborador en la API, usar los datos del contexto como fallback
        console.log("No se encontró colaborador en la API, usando datos del contexto");
        const userEmail = currentUser?.email || "";
        const isEmail = userEmail.includes("@");
        
        let username = currentUser?.name || currentUser?.id || currentUser?.email || "";
        let email = currentUser?.correo || "";
      
        if (!isEmail && userEmail) {
        username = userEmail;
          email = "";
      } else if (isEmail) {
        email = userEmail;
          username = currentUser?.name || currentUser?.id || currentUser?.email || "";
        }
        
        const fallbackData = {
          primerNombre: currentUser?.primerNombre || "",
          segundoNombre: currentUser?.segundoNombre || "",
          primerApellido: currentUser?.primerApellido || "",
          segundoApellido: currentUser?.segundoApellido || "",
          fechaNacimiento: currentUser?.fechaNacimiento || "",
          fechaIngreso: currentUser?.fechaIngreso || "",
          fechaPlanilla: currentUser?.fechaPlanilla || "",
          usuario: username,
          contraseña: "••••••••",
          correo: email,
          areaPrincipal: currentUser?.areaPrincipal || "",
          rol: currentUser?.rol || "",
          imgUrl: currentUser?.imgUrl || currentUser?.IMG_URL || "",
        };
        
        console.log("Datos de fallback del contexto:", fallbackData);
        setFormData(fallbackData);
      }
    } catch (err) {
      console.error("Error al obtener datos del colaborador:", err);
      setError(err.message || "Error al cargar los datos del perfil");
      
      // Si hay error pero tenemos datos del contexto o localStorage, usarlos como fallback
      const storedUser = localStorage.getItem("user");
      const currentUser = user || (storedUser ? JSON.parse(storedUser) : null);
      
      if (currentUser) {
        const userEmail = currentUser.email || "";
        const isEmail = userEmail.includes("@");
        
        let username = currentUser.name || currentUser.id || currentUser.email || "";
        let email = currentUser.correo || "";
        
        if (!isEmail && userEmail) {
          username = userEmail;
          email = "";
        } else if (isEmail) {
          email = userEmail;
          username = currentUser.name || currentUser.id || currentUser.email || "";
        }
        
        const fallbackData = {
          primerNombre: currentUser.primerNombre || "",
          segundoNombre: currentUser.segundoNombre || "",
          primerApellido: currentUser.primerApellido || "",
          segundoApellido: currentUser.segundoApellido || "",
          fechaNacimiento: currentUser.fechaNacimiento || "",
          fechaIngreso: currentUser.fechaIngreso || "",
          fechaPlanilla: currentUser.fechaPlanilla || "",
        usuario: username,
          contraseña: "••••••••",
        correo: email,
          areaPrincipal: currentUser.areaPrincipal || "",
          rol: currentUser.rol || "",
          imgUrl: currentUser.imgUrl || currentUser.IMG_URL || "",
        };
        
        console.log("Usando datos de fallback debido a error:", fallbackData);
        setFormData(fallbackData);
      }
    } finally {
      setLoadingData(false);
    }
  }, [user, router]);

  // Cargar datos del usuario desde la API
  useEffect(() => {
    // Intentar cargar datos siempre, incluso si no hay user en el contexto
    // porque puede estar en localStorage
    const storedUser = localStorage.getItem("user");
    const userToUse = user || (storedUser ? JSON.parse(storedUser) : null);
    
    console.log("=== useEffect ejecutado ===");
    console.log("user del contexto:", user);
    console.log("storedUser:", storedUser);
    console.log("userToUse:", userToUse);
    
    if (userToUse) {
      console.log("✅ Ejecutando fetchPerfilUsuario con usuario:", userToUse);
      fetchPerfilUsuario();
    } else {
      console.log("❌ No hay usuario disponible para cargar datos");
      setError("No se encontró información del usuario. Por favor, inicia sesión nuevamente.");
    }
  }, [user, fetchPerfilUsuario]);

  // Debug: Ver cuando cambia formData
  useEffect(() => {
    console.log("=== formData actualizado ===");
    console.log("formData:", JSON.stringify(formData, null, 2));
  }, [formData]);

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
      // Preparar datos para enviar
      console.log("Datos a guardar:", formData);
      
      // Aquí iría la lógica para guardar los datos en la API
      // Por ahora simulamos el guardado
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
              className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-lg font-medium hover:shadow-md hover:scale-105 transition-all duration-200 ripple-effect relative overflow-hidden text-sm group"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver</span>
            </button>

            {/* Layout vertical: Card Perfil (arriba) y Formulario (abajo) */}
            <div className="space-y-6">
              {/* Card PERFIL - Arriba - Diseño Premium */}
              <div className="relative bg-white rounded-2xl shadow-xl border border-gray-200/60 overflow-hidden" style={{ 
                boxShadow: '0px 4px 12px rgba(0,0,0,0.06)',
                borderRadius: '14px'
              }}>
                {/* Decorative gradient overlay sutil */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-blue-100/30 to-transparent rounded-full blur-2xl -mr-24 -mt-24"></div>
                
                <div className="relative p-5">
                  {/* Header con título elegante */}
                  <div className="mb-5 pb-4 border-b border-gray-200/60">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-xl flex items-center justify-center text-white shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900 tracking-tight" style={{ fontFamily: 'var(--font-poppins)' }}>
                        Perfil
                      </h2>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-6">
                    {/* Foto de Perfil - Más grande */}
                    <div className="flex-shrink-0 relative">
                      {/* Outer glow effect sutil */}
                      <div className="absolute -inset-1 bg-gradient-to-br from-blue-700/20 to-blue-800/10 rounded-xl opacity-50 blur-sm"></div>
                      
                      {/* Photo container */}
                      <div className="relative w-52 h-52 rounded-xl border-3 border-white bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden shadow-lg" style={{ 
                        borderRadius: '12px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                      }}>
                        {formData.imgUrl && formData.imgUrl !== "" && formData.imgUrl !== "null" && formData.imgUrl !== "undefined" ? (
                          <img
                            key={formData.imgUrl}
                            src={formData.imgUrl}
                            alt="Foto de perfil"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error("Error al cargar imagen:", formData.imgUrl);
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                              const placeholder = e.target.nextElementSibling;
                              if (placeholder) placeholder.style.display = 'flex';
                            }}
                            onLoad={() => {
                              console.log("✅ Imagen cargada correctamente:", formData.imgUrl);
                            }}
                          />
                        ) : null}
                        <div 
                          className={`w-full h-full flex items-center justify-center absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 ${formData.imgUrl && formData.imgUrl !== "" && formData.imgUrl !== "null" && formData.imgUrl !== "undefined" ? 'hidden' : 'flex'}`}
                        >
                          <svg className="w-28 h-28 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Información del Perfil - Diseño elegante */}
                    <div className="flex-1 pt-0.5">
                      {/* Nombre Completo - Tipografía premium */}
                      <div className="mb-4">
                        <h3 className="text-xl font-semibold text-gray-900 leading-tight tracking-tight mb-1.5" style={{ 
                          letterSpacing: '-0.01em',
                          lineHeight: '1.2',
                          fontFamily: 'var(--font-poppins)'
                        }}>
                          {[formData.primerNombre, formData.segundoNombre, formData.primerApellido, formData.segundoApellido].filter(Boolean).join(" ").toUpperCase() || "Sin nombre"}
                        </h3>
                        <div className="w-14 h-0.5 bg-gradient-to-r from-blue-700 to-blue-800 rounded-full"></div>
                      </div>

                      {/* Información con iconos y badges */}
                      <div className="space-y-3">
                        {/* Usuario */}
                        <div className="flex items-center group">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center mr-3 shadow-sm">
                            <svg className="w-4.5 h-4.5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5" style={{ fontFamily: 'var(--font-poppins)' }}>Usuario</div>
                            <div className="text-sm font-semibold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>{formData.usuario || "-"}</div>
                          </div>
                        </div>

                        {/* Área */}
                        <div className="flex items-center group">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center mr-3 shadow-sm">
                            <svg className="w-4.5 h-4.5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5" style={{ fontFamily: 'var(--font-poppins)' }}>Área</div>
                            <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200/50">
                              <span className="text-xs font-semibold text-blue-700" style={{ fontFamily: 'var(--font-poppins)' }}>{formData.areaPrincipal || "-"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Rol */}
                        <div className="flex items-center group">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center mr-3 shadow-sm">
                            <svg className="w-4.5 h-4.5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5" style={{ fontFamily: 'var(--font-poppins)' }}>Rol</div>
                            <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200/50">
                              <span className="text-xs font-semibold text-blue-700" style={{ fontFamily: 'var(--font-poppins)' }}>{formData.rol || "-"}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Formulario - Abajo */}
              <div>
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6" style={{ boxShadow: '0px 4px 12px rgba(0,0,0,0.06)', borderRadius: '14px' }}>
                  {/* Header */}
                  <div className="mb-6">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-xl flex items-center justify-center text-white shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <h1 className="text-xl font-semibold text-gray-900 tracking-tight" style={{ fontFamily: 'var(--font-poppins)' }}>Editar Perfil</h1>
                        <p className="text-sm text-gray-600 font-normal mt-0.5" style={{ fontFamily: 'var(--font-poppins)' }}>Actualiza tu información personal</p>
                      </div>
                    </div>
                  </div>

                  {/* Mensaje de error */}
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600" style={{ fontFamily: 'var(--font-poppins)' }}>{error}</p>
                    </div>
                  )}

                  {/* Loading state */}
                  {loadingData && (
                    <div className="mb-4 flex items-center justify-center p-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
                      <span className="ml-3 text-sm text-gray-600" style={{ fontFamily: 'var(--font-poppins)' }}>Cargando datos del perfil...</span>
                    </div>
                  )}

                  {/* Formulario */}
                  <form onSubmit={handleSubmit} className="space-y-4">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Primer Nombre */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5" style={{ fontFamily: 'var(--font-poppins)' }}>
                      Primer Nombre
                    </label>
                    <input
                      type="text"
                      name="primerNombre"
                      value={formData.primerNombre}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-700 focus:border-blue-700 transition-all duration-200 text-sm text-gray-900 bg-[#F7FAFF] focus:bg-white"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                      required
                    />
                  </div>

                  {/* Segundo Nombre */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5" style={{ fontFamily: 'var(--font-poppins)' }}>
                      Segundo Nombre
                    </label>
                    <input
                      type="text"
                      name="segundoNombre"
                      value={formData.segundoNombre}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-700 focus:border-blue-700 transition-all duration-200 text-sm text-gray-900 bg-[#F7FAFF] focus:bg-white"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                    />
                  </div>

                  {/* Primer Apellido */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5" style={{ fontFamily: 'var(--font-poppins)' }}>
                      Primer Apellido
                    </label>
                    <input
                      type="text"
                      name="primerApellido"
                      value={formData.primerApellido}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-700 focus:border-blue-700 transition-all duration-200 text-sm text-gray-900 bg-[#F7FAFF] focus:bg-white"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                      required
                    />
                  </div>

                  {/* Segundo Apellido */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5" style={{ fontFamily: 'var(--font-poppins)' }}>
                      Segundo Apellido
                    </label>
                    <input
                      type="text"
                      name="segundoApellido"
                      value={formData.segundoApellido}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-700 focus:border-blue-700 transition-all duration-200 text-sm text-gray-900 bg-[#F7FAFF] focus:bg-white"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                    />
                  </div>

                  {/* Fecha de Nacimiento (no modificable) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5" style={{ fontFamily: 'var(--font-poppins)' }}>
                      Fecha de Nacimiento
                    </label>
                    <input
                      type="date"
                      name="fechaNacimiento"
                      value={formData.fechaNacimiento}
                      disabled
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed text-sm"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                    />
                  </div>

                  {/* Fecha de Ingreso (no modificable) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5" style={{ fontFamily: 'var(--font-poppins)' }}>
                      Fecha de Ingreso
                    </label>
                    <input
                      type="date"
                      name="fechaIngreso"
                      value={formData.fechaIngreso}
                      disabled
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed text-sm"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                    />
                  </div>

                  {/* Fecha de Planilla y Correo en la misma fila */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5" style={{ fontFamily: 'var(--font-poppins)' }}>
                      Fecha de Planilla
                    </label>
                    <input
                      type="date"
                      name="fechaPlanilla"
                      value={formData.fechaPlanilla}
                      disabled
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed text-sm"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                    />
                  </div>

                  {/* Correo (no modificable) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5" style={{ fontFamily: 'var(--font-poppins)' }}>
                      Correo
                    </label>
                    <input
                      type="email"
                      name="correo"
                      value={formData.correo}
                      disabled
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed text-sm"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                    />
                  </div>

                  {/* Usuario y Contraseña en la misma fila */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5" style={{ fontFamily: 'var(--font-poppins)' }}>
                      Usuario
                    </label>
                    <input
                      type="text"
                      name="usuario"
                      value={formData.usuario}
                      disabled
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed text-sm"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                    />
                  </div>

                  {/* Contraseña (no modificable) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5" style={{ fontFamily: 'var(--font-poppins)' }}>
                      Contraseña
                    </label>
                    <input
                      type="password"
                      name="contraseña"
                      value={formData.contraseña}
                      disabled
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed text-sm"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                    />
                  </div>

                  {/* Área Principal */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5" style={{ fontFamily: 'var(--font-poppins)' }}>
                      Área Principal
                    </label>
                    <CustomSelect
                      name="areaPrincipal"
                      value={formData.areaPrincipal}
                      onChange={handleInputChange}
                      placeholder="Seleccionar área"
                      required
                      disabled={true}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1.5" style={{ fontFamily: 'var(--font-poppins)' }}>
                      Rol
                    </label>
                    <CustomSelect
                      name="rol"
                      value={formData.rol}
                      onChange={handleInputChange}
                      placeholder="Seleccionar rol"
                      required
                      disabled={true}
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
                    className="px-6 py-2.5 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors duration-200 text-sm"
                    style={{ fontFamily: 'var(--font-poppins)' }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2.5 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-lg font-medium shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    style={{ fontFamily: 'var(--font-poppins)' }}
                  >
                    {isLoading ? "Guardando..." : "Guardar Cambios"}
                  </button>
                </div>
              </form>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

