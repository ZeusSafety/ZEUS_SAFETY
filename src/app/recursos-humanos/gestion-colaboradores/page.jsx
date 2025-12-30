"use client";

import { useState, useEffect, Suspense, useCallback, useRef, useMemo, memo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/context/AuthContext";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";
import Modal from "../../../components/ui/Modal";

// ============================================
// COMPONENTE EditableField - Estable y memoizado
// Input no controlado con commit en onBlur
// ============================================
const EditableField = memo(({ label, initialValue, fieldKey, sectionKey, isEditing, onCommit, type = "text", options = [], disabled = false }) => {
  const inputRef = useRef(null);
  const onCommitRef = useRef(onCommit);
  const inputKey = useMemo(() => `input-${fieldKey}-${sectionKey}`, [fieldKey, sectionKey]);
  const isPastingRef = useRef(false);
  
  // Mantener onCommit actualizado
  useEffect(() => {
    onCommitRef.current = onCommit;
  }, [onCommit]);
  
  // Formatear fecha para display inicial
  const formatDateForDisplay = useCallback((val) => {
    if (!val || val === "No disponible" || val === "-") return "";
    if (type === "date") {
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) return val;
      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
        // Parsear manualmente para evitar problemas de timezone
        const [año, mes, dia] = val.split("-").map(Number);
        return `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${año}`;
      }
      try {
        // Si viene en formato YYYY-MM-DD, parsear manualmente
        if (/^\d{4}-\d{2}-\d{2}/.test(val)) {
          const match = val.match(/^(\d{4})-(\d{2})-(\d{2})/);
          if (match) {
            const [, año, mes, dia] = match.map(Number);
            return `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${año}`;
          }
        }
        // Para otros formatos, intentar parsear pero extraer componentes manualmente
        const date = new Date(val);
        if (!isNaN(date.getTime())) {
          // Extraer componentes directamente para evitar timezone issues
          const año = date.getFullYear();
          const mes = date.getMonth() + 1;
          const dia = date.getDate();
          return `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${año}`;
        }
      } catch (e) {}
    }
    return val || "";
  }, [type]);
  
  // Formatear fecha completa (acepta múltiples formatos)
  const formatCompleteDate = useCallback((val) => {
    if (!val || val.trim() === "") return "";
    
    const trimmed = val.trim();
    
    // Si ya está en formato DD/MM/YYYY, retornarlo
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      return trimmed;
    }
    
    // Si está en formato YYYY-MM-DD, convertir
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [año, mes, dia] = trimmed.split("-");
      return `${dia}/${mes}/${año}`;
    }
    
    // Extraer solo números
    const numbers = trimmed.replace(/\D/g, "");
    
    // Si tiene 8 dígitos, formatear como DD/MM/YYYY
    if (numbers.length === 8) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4)}`;
    }
    
    // Si tiene más de 8 dígitos, tomar los primeros 8
    if (numbers.length > 8) {
      const limited = numbers.slice(0, 8);
      return `${limited.slice(0, 2)}/${limited.slice(2, 4)}/${limited.slice(4)}`;
    }
    
    // Intentar parsear como fecha si tiene formato reconocible
    try {
      // Si es YYYY-MM-DD, parsear manualmente
      if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
        const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
          const [, año, mes, dia] = match.map(Number);
          return `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${año}`;
        }
      }
      // Para otros formatos con separadores
      if (trimmed.includes("/") || trimmed.includes("-") || trimmed.includes(".")) {
        const date = new Date(trimmed);
        if (!isNaN(date.getTime())) {
          // Extraer componentes directamente para evitar timezone issues
          const año = date.getFullYear();
          const mes = date.getMonth() + 1;
          const dia = date.getDate();
          return `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${año}`;
        }
      }
    } catch (e) {}
    
    return trimmed;
  }, []);
  
  // Formatear fecha mientras se escribe (solo números)
  const formatDateInput = useCallback((val) => {
    const numbers = val.replace(/\D/g, "");
    const limited = numbers.slice(0, 8);
    if (limited.length <= 2) return limited;
    if (limited.length <= 4) return `${limited.slice(0, 2)}/${limited.slice(2)}`;
    return `${limited.slice(0, 2)}/${limited.slice(2, 4)}/${limited.slice(4)}`;
  }, []);
  
  // Valor inicial formateado
  const getInitialValue = useCallback(() => {
    const val = initialValue === "No disponible" || initialValue === "-" ? "" : initialValue;
    return formatDateForDisplay(val);
  }, [initialValue, formatDateForDisplay]);
  
  // Handler onPaste - Para pegar fechas completas
  const handlePaste = useCallback((e) => {
    if (type === "date" && inputRef.current) {
      isPastingRef.current = true;
      e.preventDefault();
      e.stopPropagation();
      const pastedText = (e.clipboardData || window.clipboardData).getData('text');
      const formatted = formatCompleteDate(pastedText);
      inputRef.current.value = formatted;
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(0, formatted.length);
          isPastingRef.current = false;
        }
      }, 50);
    }
  }, [type, formatCompleteDate]);
  
  // Handler onChange - Formatea SOLO si no es un pegado
  const handleChange = useCallback((e) => {
    if (isPastingRef.current) {
      return;
    }
    
    if (type === "date" && inputRef.current) {
      const currentValue = e.target.value;
      
      if (currentValue.length < 10) {
        const formatted = formatDateInput(currentValue);
        if (formatted !== currentValue) {
          const cursorPos = inputRef.current.selectionStart || 0;
          inputRef.current.value = formatted;
          setTimeout(() => {
            if (inputRef.current) {
              const newPos = Math.min(cursorPos + (formatted.length - currentValue.length), formatted.length);
              inputRef.current.setSelectionRange(newPos, newPos);
            }
          }, 0);
        }
      }
    }
  }, [type, formatDateInput]);
  
  // Handler onBlur - COMMIT al padre y formatear fecha completa si es necesario
  const handleBlur = useCallback(() => {
    if (!inputRef.current) return;
    
    let finalValue = inputRef.current.value;
    
    if (type === "date") {
      finalValue = finalValue.trim();
      if (finalValue && finalValue.length > 0) {
        const formatted = formatCompleteDate(finalValue);
        if (formatted !== finalValue && formatted.length === 10) {
          inputRef.current.value = formatted;
          finalValue = formatted;
        }
      }
    } else if (type === "number") {
      if (finalValue === "" || !isNaN(Number(finalValue))) {
        finalValue = finalValue === "" ? "" : Number(finalValue).toString();
      } else {
        inputRef.current.value = getInitialValue();
        return;
      }
    }
    
    // Commit al padre
    onCommitRef.current(fieldKey, finalValue);
  }, [type, fieldKey, getInitialValue, formatCompleteDate]);
  
  const displayValue = initialValue === "No disponible" || initialValue === "-" ? "" : initialValue;
  const formattedDisplayValue = type === "date" ? formatDateForDisplay(displayValue) : displayValue;
  
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
        {label}
      </label>
      {isEditing ? (
        options.length > 0 ? (
          <select
            value={formattedDisplayValue || ""}
            onChange={(e) => {
              const selectedOption = options.find(opt => {
                if (typeof opt === "object" && opt !== null) {
                  return (opt.nombre || opt.NOMBRE) === e.target.value || (opt.id || opt.ID) === e.target.value;
                }
                return opt === e.target.value;
              });
              const valueToSave = selectedOption && typeof selectedOption === "object" 
                ? (selectedOption.nombre || selectedOption.NOMBRE) 
                : e.target.value;
              onCommitRef.current(fieldKey, valueToSave);
            }}
            disabled={disabled}
            className={`text-sm px-3 py-2 rounded-lg border border-blue-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full ${disabled ? "opacity-50 cursor-not-allowed bg-gray-100" : ""}`}
          >
            <option value="">Seleccionar {label}</option>
            {options.map((option, idx) => {
              const optionValue = typeof option === "object" && option !== null 
                ? (option.nombre || option.NOMBRE || option) 
                : option;
              const optionKey = typeof option === "object" && option !== null
                ? (option.id || option.ID || idx)
                : option;
              return (
                <option key={optionKey} value={optionValue}>
                  {optionValue}
                </option>
              );
            })}
          </select>
        ) : (
          <input
            key={inputKey}
            ref={inputRef}
            type={type === "date" ? "text" : type}
            defaultValue={getInitialValue()}
            onBlur={handleBlur}
            onChange={handleChange}
            onPaste={handlePaste}
            disabled={disabled}
            className={`text-sm px-3 py-2 rounded-lg border border-blue-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full ${disabled ? "opacity-50 cursor-not-allowed bg-gray-100" : ""}`}
            placeholder={type === "date" ? "DD/MM/YYYY o pegar fecha completa" : label}
            min={type === "number" ? "0" : undefined}
            maxLength={type === "date" ? 20 : undefined}
          />
        )
      ) : (
        <p className={`text-sm px-3 py-2 rounded-lg border ${
          formattedDisplayValue && formattedDisplayValue !== "" 
            ? "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 text-gray-900 font-medium" 
            : "bg-gray-50 border-gray-200 text-gray-500"
        }`}>
          {formattedDisplayValue || "No disponible"}
        </p>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // NO re-renderizar mientras está editando
  if (nextProps.isEditing && prevProps.isEditing) return true;
  // Re-renderizar solo cuando cambia isEditing o initialValue (y no está editando)
  if (prevProps.isEditing !== nextProps.isEditing) return false;
  if (!nextProps.isEditing && prevProps.initialValue !== nextProps.initialValue) return false;
  return true;
});

EditableField.displayName = 'EditableField';

function GestionColaboradoresContent() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Estados para colaboradores
  const [colaboradores, setColaboradores] = useState([]);
  const [colaboradoresCompletos, setColaboradoresCompletos] = useState([]);
  const [loadingColaboradores, setLoadingColaboradores] = useState(true);
  const [errorColaboradores, setErrorColaboradores] = useState(null);
  const [isVerDetallesModalOpen, setIsVerDetallesModalOpen] = useState(false);
  const [selectedColaboradorCompleto, setSelectedColaboradorCompleto] = useState(null);
  const [datosEditables, setDatosEditables] = useState([]);
  const [savingDatos, setSavingDatos] = useState(false);
  const [errorSavingDatos, setErrorSavingDatos] = useState(null);
  const [loadingMedios, setLoadingMedios] = useState(false);
  const [mediosComunicacion, setMediosComunicacion] = useState([]); // Array con IDs de la BD
  const [notification, setNotification] = useState({ show: false, message: "", type: "success" }); // success, error
  // Estados para tabs y edición
  const [activeTab, setActiveTab] = useState("informacion-personal");
  const [editingSections, setEditingSections] = useState({
    "informacion-personal": false,
    "informacion-familiar": false,
    "ubicacion": false,
    "informacion-laboral": false,
    "seguros": false,
    "datos": false,
    "correo": false,
  });
  // Estados para datos editables de cada sección
  const [editDataPersonal, setEditDataPersonal] = useState({});
  const [editDataFamiliar, setEditDataFamiliar] = useState({});
  const [editDataUbicacion, setEditDataUbicacion] = useState({});
  const [editDataLaboral, setEditDataLaboral] = useState({});
  const [editDataSeguros, setEditDataSeguros] = useState({});
  // Estados para la sección DATOS
  const [datosSecciones, setDatosSecciones] = useState({
    "informacion-personal": [],
    "informacion-familiar": [],
    "ubicacion": [],
    "informacion-laboral": [],
    "seguros": [],
  });
  const [areasDisponibles, setAreasDisponibles] = useState([]);
  const [rolesDisponibles, setRolesDisponibles] = useState([]);
  const [tiposDocumento, setTiposDocumento] = useState(["DNI", "CE", "PASAPORTE", "RUC"]);
  const [estadosCiviles, setEstadosCiviles] = useState(["SOLTERO", "SOLTERA", "CASADO", "CASADA", "DIVORCIADO", "DIVORCIADA", "VIUDO", "VIUDA", "CONVIVIENTE"]);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [savingDatosSeccion, setSavingDatosSeccion] = useState(false);
  const [errorDatosSeccion, setErrorDatosSeccion] = useState(null);
  const [isAgregarColaboradorModalOpen, setIsAgregarColaboradorModalOpen] = useState(false);
  const [newColaboradorForm, setNewColaboradorForm] = useState({
    nombre: "",
    apellido: "",
    areaPrincipal: "",
  });
  const [loadingAgregarColaborador, setLoadingAgregarColaborador] = useState(false);
  const [isAreaSelectOpen, setIsAreaSelectOpen] = useState(false);
  const areaSelectRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [isImagenModalOpen, setIsImagenModalOpen] = useState(false);
  const [selectedColaboradorImagen, setSelectedColaboradorImagen] = useState(null);
  const [imagenPreview, setImagenPreview] = useState(null);
  const [imagenActualGuardada, setImagenActualGuardada] = useState(null); // Imagen guardada en BD
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loadingImagenActual, setLoadingImagenActual] = useState(false);
  // Estados para paginación
  const [currentPageActivos, setCurrentPageActivos] = useState(1);
  const [currentPageInactivos, setCurrentPageInactivos] = useState(1);
  const itemsPerPage = 10;

  // Función para obtener el ID del colaborador
  const getColaboradorId = (colaborador) => {
    const getValue = (obj, keys) => {
      for (const key of keys) {
        if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
          return obj[key];
        }
      }
      return null;
    };
    return getValue(colaborador, ["id", "ID", "Id", "_id", "ID_PERSONA", "id_persona", "ID_COLABORADOR", "id_colaborador"]);
  };

  // Función para convertir fecha DD/MM/YYYY a YYYY-MM-DD
  const formatDateForAPI = (dateString) => {
    if (!dateString || dateString === "" || dateString === "No disponible" || dateString === "-") {
      return null;
    }
    // Si ya está en formato YYYY-MM-DD, retornarlo
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    // Si está en formato DD/MM/YYYY, convertirlo
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      const [dia, mes, año] = dateString.split("/");
      return `${año}-${mes}-${dia}`;
    }
    // Intentar parsear como Date
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        const año = date.getFullYear();
        const mes = String(date.getMonth() + 1).padStart(2, "0");
        const dia = String(date.getDate()).padStart(2, "0");
        return `${año}-${mes}-${dia}`;
      }
    } catch (e) {
      console.error("Error al formatear fecha:", e);
    }
    return null;
  };

  // Función para obtener el ID del área desde el nombre
  const getAreaId = (areaNombre) => {
    if (!areaNombre) return null;
    // Si areasDisponibles es un array de objetos con id y nombre
    const area = areasDisponibles.find(a => {
      if (typeof a === "object" && a !== null) {
        return (a.nombre && a.nombre.toUpperCase() === areaNombre.toUpperCase()) ||
               (a.NOMBRE && a.NOMBRE.toUpperCase() === areaNombre.toUpperCase());
      }
      // Si es un string, comparar directamente
      if (typeof a === "string") {
        return a.toUpperCase() === areaNombre.toUpperCase();
      }
      return false;
    });
    if (area) {
      if (typeof area === "object" && area !== null) {
        return area.id || area.ID;
      }
      // Si es un string, necesitamos buscar el ID desde la API
      // Por ahora retornamos null y el backend debería manejarlo
      return null;
    }
    return null;
  };

  // Función para convertir código corto a texto completo (para mostrar)
  const convertirCodigoAEstadoCivil = (codigo) => {
    if (!codigo || codigo === "") return "";
    const codigoUpper = String(codigo).toUpperCase().trim();
    
    // Si ya es texto completo y está en la lista, retornarlo tal cual
    if (estadosCiviles.includes(codigoUpper)) return codigoUpper;
    
    // Mapeo de códigos a texto completo (usar el primero de la lista para cada código)
    if (codigoUpper === "S") return "SOLTERO"; // Por defecto SOLTERO, el usuario puede cambiarlo a SOLTERA
    if (codigoUpper === "C") return "CASADO";
    if (codigoUpper === "D") return "DIVORCIADO";
    if (codigoUpper === "V") return "VIUDO";
    if (codigoUpper === "CO") return "CONVIVIENTE";
    
    // Si no coincide con ningún código conocido, retornar el valor original
    return codigoUpper;
  };

  // Función para convertir estado civil a código corto (para guardar)
  const convertirEstadoCivilACodigo = (estadoCivil) => {
    if (!estadoCivil || estadoCivil === "" || estadoCivil === "No disponible" || estadoCivil === "-") return "";
    
    const estadoUpper = String(estadoCivil).toUpperCase().trim();
    
    // Si ya es un código corto válido (1-2 caracteres), retornarlo tal cual
    if (estadoUpper.length <= 2 && estadoUpper.length > 0) {
      return estadoUpper;
    }
    
    // Mapeo de estados civiles a códigos cortos (1-2 caracteres máximo)
    if (estadoUpper === "SOLTERO" || estadoUpper === "SOLTERA" || estadoUpper === "S") return "S";
    if (estadoUpper === "CASADO" || estadoUpper === "CASADA" || estadoUpper === "C") return "C";
    if (estadoUpper === "DIVORCIADO" || estadoUpper === "DIVORCIADA" || estadoUpper === "D") return "D";
    if (estadoUpper === "VIUDO" || estadoUpper === "VIUDA" || estadoUpper === "V") return "V";
    if (estadoUpper === "CONVIVIENTE" || estadoUpper === "CO") return "CO";
    
    // Si contiene alguna de las palabras clave, extraer el código
    if (estadoUpper.includes("SOLTER")) return "S";
    if (estadoUpper.includes("CASAD")) return "C";
    if (estadoUpper.includes("DIVORCI")) return "D";
    if (estadoUpper.includes("VIUD")) return "V";
    if (estadoUpper.includes("CONVIV")) return "CO";
    
    // Por defecto, retornar el primer carácter en mayúscula (máximo 1 carácter)
    return estadoUpper.charAt(0) || "";
  };

  // Función para actualizar Información Personal
  const actualizarInformacionPersonal = async (colaboradorId, data) => {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No se encontró el token de autenticación");
    }

    const payload = {};
    if (data.nombre !== undefined && data.nombre !== "") payload.nombre = data.nombre;
    if (data.segundoNombre !== undefined && data.segundoNombre !== "") payload.segundo_nombre = data.segundoNombre;
    if (data.apellido !== undefined && data.apellido !== "") payload.apellido = data.apellido;
    if (data.segundoApellido !== undefined && data.segundoApellido !== "") payload.segundo_apellido = data.segundoApellido;
    if (data.fechaNacimiento !== undefined && data.fechaNacimiento !== "") {
      const fechaFormateada = formatDateForAPI(data.fechaNacimiento);
      if (fechaFormateada) payload.fecha_nacimiento = fechaFormateada;
    }
    if (data.tipoDocumento !== undefined && data.tipoDocumento !== "") payload.tipo_doc = data.tipoDocumento;
    if (data.numeroDocumento !== undefined && data.numeroDocumento !== "") payload.num_doc = data.numeroDocumento;
    // Procesar estado civil - enviar la palabra completa si está disponible
    if (data.estadoCivil !== undefined && data.estadoCivil !== "" && data.estadoCivil !== "No disponible" && data.estadoCivil !== "-") {
      try {
        // Limpiar el valor: eliminar espacios extra y convertir a formato estándar
        let estadoCivilLimpio = String(data.estadoCivil).trim();
        
        // Validar que sea uno de los valores permitidos
        const valoresPermitidos = ['SOLTERO', 'SOLTERA', 'CASADO', 'CASADA', 'DIVORCIADO', 'DIVORCIADA', 'VIUDO', 'VIUDA', 'CONVIVIENTE', 
                                   'S', 'C', 'D', 'V', 'CO']; // También aceptar códigos cortos por compatibilidad
        
        const estadoUpper = estadoCivilLimpio.toUpperCase();
        
        // Si es un valor permitido (palabra completa o código), enviarlo
        if (valoresPermitidos.includes(estadoUpper)) {
          // Si es un código corto, mantenerlo; si es palabra completa, enviarla
          if (estadoUpper.length <= 2) {
            // Es un código corto, mantenerlo
            payload.estado_civil = estadoUpper;
            console.log(`[DEBUG] Estado civil (código corto) agregado: "${payload.estado_civil}"`);
          } else {
            // Es una palabra completa, enviarla
            payload.estado_civil = estadoUpper;
            console.log(`[DEBUG] Estado civil (palabra completa) agregado: "${payload.estado_civil}"`);
          }
        } else {
          // Si no está en la lista, intentar convertir a código corto como fallback
          const codigo = convertirEstadoCivilACodigo(estadoCivilLimpio);
          if (codigo && codigo.trim() !== "") {
            payload.estado_civil = codigo.trim().toUpperCase();
            console.log(`[DEBUG] Estado civil convertido a código: "${estadoCivilLimpio}" -> "${payload.estado_civil}"`);
          } else {
            console.warn(`[WARN] Estado civil no reconocido: "${estadoCivilLimpio}"`);
            // No agregar al payload si no se puede validar
          }
        }
      } catch (error) {
        console.error(`[ERROR] Error al procesar estado civil:`, error);
        // No agregar al payload si hay un error
      }
    }
    
    // Validación final: limpiar espacios y asegurar formato correcto
    if (payload.estado_civil) {
      payload.estado_civil = String(payload.estado_civil).trim().toUpperCase();
      
      // Verificar que no esté vacío después de la limpieza
      if (payload.estado_civil.length === 0) {
        console.warn(`[WARN] estado_civil quedó vacío después de limpieza, eliminando del payload`);
        delete payload.estado_civil;
      }
    }
    
    if (data.estado !== undefined && data.estado !== "") payload.estado = data.estado === "1" || data.estado === 1 ? 1 : 0;

    // Log del payload completo antes de enviar (solo para depuración)
    console.log(`[DEBUG] Payload completo que se enviará:`, JSON.stringify(payload, null, 2));
    if (payload.estado_civil) {
      const estadoCivilBytes = new TextEncoder().encode(payload.estado_civil);
      console.log(`[DEBUG] estado_civil en payload: "${payload.estado_civil}"`);
      console.log(`[DEBUG] - Longitud de caracteres: ${payload.estado_civil.length}`);
      console.log(`[DEBUG] - Longitud en bytes: ${estadoCivilBytes.length}`);
      console.log(`[DEBUG] - Códigos de bytes: [${Array.from(estadoCivilBytes).join(', ')}]`);
      console.log(`[DEBUG] - Tipo: ${typeof payload.estado_civil}`);
      console.log(`[DEBUG] - JSON stringificado: "${JSON.stringify(payload.estado_civil)}"`);
    }

    // Si hay un error relacionado con estado_civil, intentar sin ese campo como fallback
    let response;
    let errorData;
    
    try {
      response = await fetch(
        `https://colaboradores2026-2946605267.us-central1.run.app?metodo=actualizar_informacion_personal&id=${colaboradorId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        errorData = await response.json().catch(() => ({ error: "Error desconocido" }));
        const errorMessage = errorData.error || `Error ${response.status}: ${response.statusText}`;
        
        // Si el error es específicamente sobre estado_civil, intentar sin ese campo
        if (errorMessage.includes("ESTADO_CIVIL") || errorMessage.includes("estado_civil") || errorMessage.includes("Data truncated")) {
          console.warn(`[WARN] Error con estado_civil, intentando guardar sin ese campo...`);
          const payloadSinEstadoCivil = { ...payload };
          delete payloadSinEstadoCivil.estado_civil;
          
          console.log(`[DEBUG] Reintentando con payload sin estado_civil:`, JSON.stringify(payloadSinEstadoCivil, null, 2));
          
          response = await fetch(
            `https://colaboradores2026-2946605267.us-central1.run.app?metodo=actualizar_informacion_personal&id=${colaboradorId}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
              },
              body: JSON.stringify(payloadSinEstadoCivil),
            }
          );
          
          if (!response.ok) {
            errorData = await response.json().catch(() => ({ error: "Error desconocido" }));
            const errorMessage2 = errorData.error || `Error ${response.status}: ${response.statusText}`;
            console.error(`[ERROR] Error al actualizar información personal (sin estado_civil):`, errorMessage2);
            console.error(`[ERROR] Payload enviado:`, JSON.stringify(payloadSinEstadoCivil, null, 2));
            throw new Error(`Error al guardar. El campo estado civil no pudo ser guardado debido a una limitación en el backend. ${errorMessage2}`);
          } else {
            console.warn(`[WARN] Guardado exitoso pero sin estado_civil debido a error en backend`);
            // Mostrar notificación al usuario
            throw new Error(`Los datos se guardaron correctamente, pero el estado civil no pudo ser actualizado debido a una limitación en el backend. Por favor, contacte al administrador para actualizar la base de datos.`);
          }
        } else {
          console.error(`[ERROR] Error al actualizar información personal:`, errorMessage);
          console.error(`[ERROR] Payload enviado:`, JSON.stringify(payload, null, 2));
          throw new Error(errorMessage);
        }
      }
    } catch (error) {
      // Si es un error de red u otro error, lanzarlo directamente
      if (error.message && (error.message.includes("estado civil") || error.message.includes("ESTADO_CIVIL"))) {
        throw error;
      }
      console.error(`[ERROR] Error en la petición:`, error);
      throw error;
    }

    return await response.json();
  };

  // Función para actualizar Información Familiar
  const actualizarInformacionFamiliar = async (colaboradorId, data) => {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No se encontró el token de autenticación");
    }

    const payload = {};
    if (data.tieneHijos !== undefined && data.tieneHijos !== "") {
      const tieneHijosStr = String(data.tieneHijos).trim();
      payload.tiene_hijos = (tieneHijosStr === "1" || tieneHijosStr === "Si" || tieneHijosStr === "SI" || tieneHijosStr === "Sí") ? 1 : 0;
    }
    if (data.cantHijos !== undefined && data.cantHijos !== "") {
      payload.cant_hijos = parseInt(data.cantHijos) || 0;
    }

    const response = await fetch(
      `https://colaboradores2026-2946605267.us-central1.run.app?metodo=actualizar_informacion_familiar&id=${colaboradorId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Error desconocido" }));
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  };

  // Función para actualizar Ubicación
  const actualizarUbicacion = async (colaboradorId, data) => {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No se encontró el token de autenticación");
    }

    const payload = {};
    if (data.direccion !== undefined && data.direccion !== "") payload.direccion = data.direccion;
    if (data.googleMaps !== undefined && data.googleMaps !== "") payload.google_maps = data.googleMaps;

    const response = await fetch(
      `https://colaboradores2026-2946605267.us-central1.run.app?metodo=actualizar_ubicacion&id=${colaboradorId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Error desconocido" }));
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  };

  // Función para actualizar Información Laboral
  const actualizarInformacionLaboral = async (colaboradorId, data) => {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No se encontró el token de autenticación");
    }

    const payload = {};
    if (data.ocupacion !== undefined && data.ocupacion !== "") payload.ocupacion = data.ocupacion;
    if (data.cargo !== undefined && data.cargo !== "") payload.cargo = data.cargo;
    if (data.area !== undefined && data.area !== "") {
      const areaId = getAreaId(data.area);
      if (areaId) {
        payload.area_principal = areaId;
      } else {
        // Si no se encuentra el ID, intentar usar el valor directamente si es numérico
        const numArea = parseInt(data.area);
        if (!isNaN(numArea)) {
          payload.area_principal = numArea;
        }
      }
    }
    // Para el rol, necesitamos el ID numérico. Por ahora, si viene como string, intentamos parsearlo
    if (data.rol !== undefined && data.rol !== "") {
      const numRol = parseInt(data.rol);
      if (!isNaN(numRol)) {
        payload.rol = numRol;
      } else {
        // Si es un string, intentar buscar en rolesDisponibles o usar un mapeo
        // Por ahora, lo dejamos como está y el backend debería manejarlo
        payload.rol = data.rol;
      }
    }

    const response = await fetch(
      `https://colaboradores2026-2946605267.us-central1.run.app?metodo=actualizar_informacion_laboral&id=${colaboradorId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Error desconocido" }));
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  };

  // Función para actualizar Seguros
  const actualizarSeguros = async (colaboradorId, data) => {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No se encontró el token de autenticación");
    }

    const payload = {};
    if (data.seguroVidaLey !== undefined && data.seguroVidaLey !== "") {
      // Convertir "Si"/"SI"/"Sí"/1 a 1, cualquier otra cosa (incluyendo "No") a 0
      const strValue = String(data.seguroVidaLey).trim();
      payload.seguro_vida_ley = (strValue === "1" || strValue === "Si" || strValue === "SI" || strValue === "Sí") ? 1 : 0;
    }
    if (data.fechaVencimiento !== undefined && data.fechaVencimiento !== "") {
      const fechaFormateada = formatDateForAPI(data.fechaVencimiento);
      if (fechaFormateada) payload.fecha_vencimiento = fechaFormateada;
    }
    if (data.fechaInicio !== undefined && data.fechaInicio !== "") {
      const fechaFormateada = formatDateForAPI(data.fechaInicio);
      if (fechaFormateada) payload.fecha_inicio = fechaFormateada;
    }

    const response = await fetch(
      `https://colaboradores2026-2946605267.us-central1.run.app?metodo=actualizar_seguros&id=${colaboradorId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Error desconocido" }));
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  };

  // Función para obtener la imagen actual del colaborador
  const fetchImagenColaborador = useCallback(async (colaboradorId) => {
    try {
      setLoadingImagenActual(true);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No se encontró el token de autenticación");
      }

      const response = await fetch(
        `/api/colaboradores?method=obtener_imagen_colaborador&id_colaborador=${colaboradorId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        // Si no se encuentra (404), no hay imagen, retornar null
        if (response.status === 404) {
          return null;
        }
        const errorData = await response.json().catch(() => ({ error: "Error desconocido" }));
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      const data = await response.json();
      let imageUrl = data?.IMAGE_URL || data?.image_url || null;
      
      console.log("🔍 Datos recibidos del backend:", data);
      console.log("🔍 URL extraída:", imageUrl);
      
      if (!imageUrl) {
        console.log("⚠️ No se encontró imagen para el colaborador");
        return null;
      }
      
      console.log("✅ URL obtenida de BD:", imageUrl);
      
      // Con no_encriptar, la URL ya viene completa y se puede usar directamente
      // Igual que en productos - no necesita procesamiento adicional
      return imageUrl;
    } catch (error) {
      console.error("Error al obtener imagen del colaborador:", error);
      // Si hay error, retornar null en lugar de lanzar excepción
      return null;
    } finally {
      setLoadingImagenActual(false);
    }
  }, []);

  // Función para guardar/actualizar imagen del colaborador
  // El backend maneja automáticamente INSERT o UPDATE según si existe la imagen
  const guardarImagenColaborador = async (colaboradorId, imageUrl) => {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No se encontró el token de autenticación");
    }

    const payload = {
      image_url: imageUrl,
      nombre: "Foto de Perfil",
      tipo: "FOTOCHECK"
    };

    // El backend actualizar_imagen_colaborador maneja automáticamente INSERT o UPDATE
    const response = await fetch(
      `/api/colaboradores?metodo=actualizar_imagen_colaborador&id=${colaboradorId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Error desconocido" }));
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  };

  // Función para cargar medios de comunicación desde la API
  const fetchMediosComunicacion = useCallback(async (colaboradorId) => {
    try {
      setLoadingMedios(true);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No se encontró el token de autenticación");
      }

      const response = await fetch(`/api/medios-comunicacion?id_colaborador=${colaboradorId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Error desconocido" }));
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      const data = await response.json();
      const mediosArray = Array.isArray(data) ? data : [];
      
      // Guardar medios con IDs de la BD
      setMediosComunicacion(mediosArray);
      
      // Mapear a formato para datosEditables
      const datosMapeados = mediosArray.map(medio => ({
        ID: medio.ID || medio.id,
        id: medio.ID || medio.id,
        NOMBRE: medio.NOMBRE || medio.nombre || "",
        nombre: medio.NOMBRE || medio.nombre || "",
        MEDIO: medio.MEDIO || medio.medio || "CORREO",
        medio: medio.MEDIO || medio.medio || "CORREO",
        TIPO: medio.TIPO || medio.tipo || "",
        tipo: medio.TIPO || medio.tipo || "",
        CONTENIDO: medio.CONTENIDO || medio.contenido || "",
        contenido: medio.CONTENIDO || medio.contenido || "",
      }));
      
      setDatosEditables(datosMapeados);
    } catch (error) {
      console.error("Error al cargar medios de comunicación:", error);
      setMediosComunicacion([]);
      setDatosEditables([]);
    } finally {
      setLoadingMedios(false);
    }
  }, []);

  // Cargar medios de comunicación cuando se abre el modal
  useEffect(() => {
    if (isVerDetallesModalOpen && selectedColaboradorCompleto) {
      const colaboradorId = getColaboradorId(selectedColaboradorCompleto);
      if (colaboradorId) {
        fetchMediosComunicacion(colaboradorId);
      } else {
        setDatosEditables([]);
        setMediosComunicacion([]);
      }
    } else {
      setDatosEditables([]);
      setMediosComunicacion([]);
    }
  }, [isVerDetallesModalOpen, selectedColaboradorCompleto, fetchMediosComunicacion]);

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

    // Establecer estado inicial
    handleResize();

    // Escuchar cambios de tamaño
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Función para obtener colaboradores de la API
  const fetchColaboradores = useCallback(async () => {
    try {
      setLoadingColaboradores(true);
      setErrorColaboradores(null);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No se encontró el token de autenticación");
      }

      const response = await fetch("/api/colaboradores", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Error desconocido" }));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Datos recibidos de la API:", data);

      // Guardar los datos originales completos
      setColaboradoresCompletos(Array.isArray(data) ? data : []);

      // Mapear los datos de la API al formato esperado
      const colaboradoresMapeados = Array.isArray(data) ? data.map((colab) => {
        const getValue = (obj, keys) => {
          for (const key of keys) {
            if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
              return obj[key];
            }
          }
          return "";
        };

        // Formatear fecha de cumpleaños
        const fechaNac = getValue(colab, ["fecha_nacimiento", "fechaNacimiento", "fecha_cumpleanos", "fechaCumpleanos", "FECHA_NACIMIENTO", "FECHA_CUMPLEANOS"]);
        let fechaFormateada = "";
        if (fechaNac) {
          try {
            // Si es YYYY-MM-DD, parsear manualmente para evitar timezone issues
            if (/^\d{4}-\d{2}-\d{2}/.test(fechaNac)) {
              const match = String(fechaNac).match(/^(\d{4})-(\d{2})-(\d{2})/);
              if (match) {
                const [, año, mes, dia] = match.map(Number);
                fechaFormateada = `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${año}`;
              } else {
                fechaFormateada = fechaNac;
              }
            } else {
              const fecha = new Date(fechaNac);
              if (!isNaN(fecha.getTime())) {
                // Extraer componentes directamente para evitar timezone issues
                const año = fecha.getFullYear();
                const mes = fecha.getMonth() + 1;
                const dia = fecha.getDate();
                fechaFormateada = `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${año}`;
              } else {
                fechaFormateada = fechaNac;
              }
            }
          } catch (e) {
            fechaFormateada = fechaNac;
          }
        }

        // Obtener área
        let areaValue = getValue(colab, ["area", "AREA", "Area", "departamento", "DEPARTAMENTO", "department", "DEPARTMENT"]);
        if (!areaValue && colab.A && colab.A.NOMBRE) {
          areaValue = colab.A.NOMBRE;
        }
        if (!areaValue && colab.a && colab.a.nombre) {
          areaValue = colab.a.nombre;
        }
        if (!areaValue) {
          for (const key in colab) {
            if (typeof colab[key] === "object" && colab[key] !== null) {
              const nestedArea = getValue(colab[key], ["NOMBRE", "nombre", "NOMBRE_AREA", "nombre_area", "AREA", "area"]);
              if (nestedArea) {
                areaValue = nestedArea;
                break;
              }
            }
          }
        }

        // Determinar si está activo
        const estadoValue = getValue(colab, ["activo", "ACTIVO", "Activo", "estado", "ESTADO", "status", "STATUS"]);
        const isActivo = estadoValue !== false && 
                        estadoValue !== "inactivo" && 
                        estadoValue !== "INACTIVO" && 
                        estadoValue !== 0 &&
                        estadoValue !== "0";

        return {
          id: getValue(colab, ["id", "ID", "Id"]) || Math.random().toString(36).substr(2, 9),
          nombre: getValue(colab, ["nombre", "NOMBRE", "Nombre", "name", "NAME"]) || "",
          apellido: getValue(colab, ["apellido", "APELLIDO", "Apellido", "apellidos", "APELLIDOS", "lastname", "LASTNAME"]) || "",
          area: areaValue || "Sin área asignada",
          correo: getValue(colab, ["correo", "CORREO", "Correo", "email", "EMAIL", "Email", "correo_electronico", "CORREO_ELECTRONICO"]) || "",
          fechaCumpleanos: fechaFormateada,
          activo: isActivo,
        };
      }) : [];

      console.log("Colaboradores mapeados:", colaboradoresMapeados);
      setColaboradores(colaboradoresMapeados);
    } catch (error) {
      console.error("Error al obtener colaboradores:", error);
      setErrorColaboradores(error.message || "Error al obtener colaboradores");
    } finally {
      setLoadingColaboradores(false);
    }
  }, []);

  // Cargar colaboradores automáticamente al montar
  useEffect(() => {
    if (!loading && user) {
      fetchColaboradores();
    }
  }, [loading, user, fetchColaboradores]);

  // Función para obtener áreas disponibles
  const fetchAreas = useCallback(async () => {
    try {
      setLoadingAreas(true);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No se encontró el token de autenticación");
      }

      // Obtener áreas desde el endpoint obtener_areas
      const response = await fetch(
        `https://colaboradores2026-2946605267.us-central1.run.app?method=obtener_areas`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          // Mapear a formato { id, nombre }
          const areasMapeadas = data.map(area => ({
            id: area.ID || area.id,
            ID: area.ID || area.id,
            nombre: area.NOMBRE || area.nombre,
            NOMBRE: area.NOMBRE || area.nombre,
          }));
          setAreasDisponibles(areasMapeadas);
        } else {
          // Si falla, usar áreas por defecto
          setAreasDisponibles([
            { id: 1, nombre: "ADMINISTRACION" },
            { id: 2, nombre: "LOGISTICA" },
            { id: 3, nombre: "SISTEMAS" },
            { id: 4, nombre: "MARKETING" },
            { id: 5, nombre: "VENTAS" },
            { id: 6, nombre: "FACTURACION" },
            { id: 7, nombre: "IMPORTACION" },
            { id: 8, nombre: "RECURSOS HUMANOS" },
            { id: 9, nombre: "GERENCIA" },
          ]);
        }
      } else {
        // Si falla, usar áreas por defecto
        setAreasDisponibles([
          { id: 1, nombre: "ADMINISTRACION" },
          { id: 2, nombre: "LOGISTICA" },
          { id: 3, nombre: "SISTEMAS" },
          { id: 4, nombre: "MARKETING" },
          { id: 5, nombre: "VENTAS" },
          { id: 6, nombre: "FACTURACION" },
          { id: 7, nombre: "IMPORTACION" },
          { id: 8, nombre: "RECURSOS HUMANOS" },
          { id: 9, nombre: "GERENCIA" },
        ]);
      }
    } catch (error) {
      console.error("Error al obtener áreas:", error);
      // Usar áreas por defecto en caso de error
      setAreasDisponibles([
        { id: 1, nombre: "ADMINISTRACION" },
        { id: 2, nombre: "LOGISTICA" },
        { id: 3, nombre: "SISTEMAS" },
        { id: 4, nombre: "MARKETING" },
        { id: 5, nombre: "VENTAS" },
        { id: 6, nombre: "FACTURACION" },
        { id: 7, nombre: "IMPORTACION" },
        { id: 8, nombre: "RECURSOS HUMANOS" },
        { id: 9, nombre: "GERENCIA" },
      ]);
    } finally {
      setLoadingAreas(false);
    }
  }, []);

  // Cargar áreas cuando se abre el modal
  useEffect(() => {
    if (isVerDetallesModalOpen) {
      fetchAreas();
      // Inicializar roles disponibles
      setRolesDisponibles(["ADMINISTRADOR", "USUARIO", "SUPERVISOR", "GERENTE", "ASISTENTE"]);
    }
  }, [isVerDetallesModalOpen, fetchAreas]);

  // Cargar áreas cuando se abre el modal de agregar colaborador
  useEffect(() => {
    if (isAgregarColaboradorModalOpen) {
      fetchAreas();
      setIsAreaSelectOpen(false);
    }
  }, [isAgregarColaboradorModalOpen, fetchAreas]);

  // Calcular posición del dropdown cuando se abre
  useEffect(() => {
    if (isAreaSelectOpen && areaSelectRef.current) {
      const rect = areaSelectRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [isAreaSelectOpen]);

  // Cerrar el dropdown de áreas al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isAreaSelectOpen && !event.target.closest('.area-select-container') && !event.target.closest('.area-dropdown')) {
        setIsAreaSelectOpen(false);
      }
    };

    if (isAreaSelectOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isAreaSelectOpen]);


  // Función para agregar un medio de comunicación
  const handleAgregarMedio = async (nuevoMedio) => {
    if (!selectedColaboradorCompleto) return;

    try {
      setSavingDatos(true);
      setErrorSavingDatos(null);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No se encontró el token de autenticación");
      }

      const colaboradorId = getColaboradorId(selectedColaboradorCompleto);
      if (!colaboradorId) {
        throw new Error("No se pudo obtener el ID del colaborador");
      }

      // Validar campos requeridos
      if (!nuevoMedio.nombre || !nuevoMedio.medio || !nuevoMedio.tipo || !nuevoMedio.contenido) {
        throw new Error("Todos los campos son requeridos");
      }

      const response = await fetch("/api/medios-comunicacion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          id_colaborador: colaboradorId,
          nombre: nuevoMedio.nombre || nuevoMedio.NOMBRE,
          medio: nuevoMedio.medio || nuevoMedio.MEDIO,
          tipo: nuevoMedio.tipo || nuevoMedio.TIPO,
          contenido: nuevoMedio.contenido || nuevoMedio.CONTENIDO
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Error desconocido" }));
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      const result = await response.json();
      
      // Recargar medios de comunicación
      await fetchMediosComunicacion(colaboradorId);
      
      return result;
    } catch (error) {
      console.error("Error al agregar medio:", error);
      setErrorSavingDatos(error.message || "Error al agregar el medio de comunicación");
      throw error;
    } finally {
      setSavingDatos(false);
    }
  };

  // Función para actualizar un medio de comunicación
  const handleActualizarMedio = async (medioId, datosActualizados) => {
    if (!selectedColaboradorCompleto) return;

    try {
      setSavingDatos(true);
      setErrorSavingDatos(null);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No se encontró el token de autenticación");
      }

      const colaboradorId = getColaboradorId(selectedColaboradorCompleto);
      if (!colaboradorId) {
        throw new Error("No se pudo obtener el ID del colaborador");
      }

      // Validar campos requeridos
      if (!datosActualizados.nombre || !datosActualizados.medio || !datosActualizados.tipo || !datosActualizados.contenido) {
        throw new Error("Todos los campos son requeridos");
      }

      const response = await fetch(`/api/medios-comunicacion?action=update&id=${medioId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre: datosActualizados.nombre || datosActualizados.NOMBRE,
          medio: datosActualizados.medio || datosActualizados.MEDIO,
          tipo: datosActualizados.tipo || datosActualizados.TIPO,
          contenido: datosActualizados.contenido || datosActualizados.CONTENIDO
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Error desconocido" }));
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      // Recargar medios de comunicación
      await fetchMediosComunicacion(colaboradorId);
    } catch (error) {
      console.error("Error al actualizar medio:", error);
      setErrorSavingDatos(error.message || "Error al actualizar el medio de comunicación");
      throw error;
    } finally {
      setSavingDatos(false);
    }
  };

  // Función para eliminar un medio de comunicación
  const handleEliminarMedio = async (medioId) => {
    if (!selectedColaboradorCompleto) return;

    try {
      setSavingDatos(true);
      setErrorSavingDatos(null);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No se encontró el token de autenticación");
      }

      const colaboradorId = getColaboradorId(selectedColaboradorCompleto);
      if (!colaboradorId) {
        throw new Error("No se pudo obtener el ID del colaborador");
      }

      const response = await fetch(`/api/medios-comunicacion?action=delete&id=${medioId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Error desconocido" }));
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      // Recargar medios de comunicación
      await fetchMediosComunicacion(colaboradorId);
    } catch (error) {
      console.error("Error al eliminar medio:", error);
      setErrorSavingDatos(error.message || "Error al eliminar el medio de comunicación");
      throw error;
    } finally {
      setSavingDatos(false);
    }
  };

  // Calcular paginación antes de los returns condicionales
  const activos = colaboradores.filter(c => c.activo !== false);
  const inactivos = colaboradores.filter(c => c.activo === false);
  
  // Calcular paginación para activos
  const totalPagesActivos = Math.max(1, Math.ceil(activos.length / itemsPerPage));
  const startIndexActivos = (currentPageActivos - 1) * itemsPerPage;
  const endIndexActivos = startIndexActivos + itemsPerPage;
  const activosPaginados = activos.slice(startIndexActivos, endIndexActivos);
  
  // Calcular paginación para inactivos
  const totalPagesInactivos = Math.max(1, Math.ceil(inactivos.length / itemsPerPage));
  const startIndexInactivos = (currentPageInactivos - 1) * itemsPerPage;
  const endIndexInactivos = startIndexInactivos + itemsPerPage;
  const inactivosPaginados = inactivos.slice(startIndexInactivos, endIndexInactivos);
  
  // Ajustar página actual si excede el total de páginas (hooks deben estar antes de returns condicionales)
  useEffect(() => {
    if (currentPageActivos > totalPagesActivos && totalPagesActivos > 0) {
      setCurrentPageActivos(totalPagesActivos);
    }
  }, [currentPageActivos, totalPagesActivos]);
  
  useEffect(() => {
    if (currentPageInactivos > totalPagesInactivos && totalPagesInactivos > 0) {
      setCurrentPageInactivos(totalPagesInactivos);
    }
  }, [currentPageInactivos, totalPagesInactivos]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }
  
  // Funciones de navegación para activos
  const goToFirstPageActivos = () => setCurrentPageActivos(1);
  const goToPrevPageActivos = () => setCurrentPageActivos(prev => Math.max(1, prev - 1));
  const goToNextPageActivos = () => setCurrentPageActivos(prev => Math.min(totalPagesActivos, prev + 1));
  const goToLastPageActivos = () => setCurrentPageActivos(totalPagesActivos);
  
  // Funciones de navegación para inactivos
  const goToFirstPageInactivos = () => setCurrentPageInactivos(1);
  const goToPrevPageInactivos = () => setCurrentPageInactivos(prev => Math.max(1, prev - 1));
  const goToNextPageInactivos = () => setCurrentPageInactivos(prev => Math.min(totalPagesInactivos, prev + 1));
  const goToLastPageInactivos = () => setCurrentPageInactivos(totalPagesInactivos);

  // Datos ficticios para Control de Asistencia
  const registrosAsistencia = [
    { id: 1, nombre: "HERVIN CORONEL", fecha: "24/11/2025", entrada: "08:15", salida: "17:30", estado: "Normal" },
    { id: 2, nombre: "MARIA GONZALEZ", fecha: "24/11/2025", entrada: "08:00", salida: "17:00", estado: "Normal" },
    { id: 3, nombre: "JUAN PEREZ", fecha: "24/11/2025", entrada: "08:25", salida: "17:45", estado: "Tardanza" },
    { id: 4, nombre: "ANA LOPEZ", fecha: "24/11/2025", entrada: "-", salida: "-", estado: "Falta" },
    { id: 5, nombre: "CARLOS RODRIGUEZ", fecha: "24/11/2025", entrada: "08:10", salida: "17:20", estado: "Normal" },
  ];

  const incidenciasAsistencia = [
    { id: 1, nombre: "JUAN PEREZ", tipo: "Tardanza", fecha: "24/11/2025", justificacion: "Tráfico", estado: "Pendiente" },
    { id: 2, nombre: "ANA LOPEZ", tipo: "Falta", fecha: "24/11/2025", justificacion: "Enfermedad", estado: "Aprobada" },
    { id: 3, nombre: "MARIA GONZALEZ", tipo: "Tardanza", fecha: "23/11/2025", justificacion: "Emergencia familiar", estado: "Rechazada" },
  ];

  // Datos ficticios para Gestión de Permisos
  const solicitudesPermisos = [
    { id: 1, nombre: "HERVIN CORONEL", tipo: "Médico", fecha: "25/11/2025", dias: 1, motivo: "Consulta médica", estado: "Pendiente", jefe: "GERENTE GENERAL" },
    { id: 2, nombre: "MARIA GONZALEZ", tipo: "Personal", fecha: "26/11/2025", dias: 0.5, motivo: "Trámite personal", estado: "Aprobada", jefe: "JEFE DE VENTAS" },
    { id: 3, nombre: "JUAN PEREZ", tipo: "Otras actividades", fecha: "27/11/2025", dias: 2, motivo: "Capacitación", estado: "Pendiente", jefe: "JEFE DE LOGÍSTICA" },
    { id: 4, nombre: "ANA LOPEZ", tipo: "Médico", fecha: "28/11/2025", dias: 3, motivo: "Cirugía menor", estado: "Aprobada", jefe: "JEFE DE MARKETING" },
  ];

  // Datos ficticios para Gestión de Vacaciones
  const solicitudesVacaciones = [
    { id: 1, nombre: "HERVIN CORONEL", diasAcumulados: 15, diasSolicitados: 5, fechaInicio: "01/12/2025", fechaFin: "05/12/2025", estado: "Aprobada" },
    { id: 2, nombre: "MARIA GONZALEZ", diasAcumulados: 20, diasSolicitados: 10, fechaInicio: "10/12/2025", fechaFin: "19/12/2025", estado: "Pendiente" },
    { id: 3, nombre: "JUAN PEREZ", diasAcumulados: 12, diasSolicitados: 7, fechaInicio: "15/12/2025", fechaFin: "21/12/2025", estado: "Pendiente" },
    { id: 4, nombre: "CARLOS RODRIGUEZ", diasAcumulados: 18, diasSolicitados: 3, fechaInicio: "28/11/2025", fechaFin: "30/11/2025", estado: "Aprobada" },
  ];

  // Datos ficticios para Control de Documentos Laborales
  const documentosLaborales = [
    { id: 1, nombre: "HERVIN CORONEL", tipo: "Contrato", fechaVencimiento: "15/12/2025", diasRestantes: 21, estado: "Por vencer", alerta: true },
    { id: 2, nombre: "MARIA GONZALEZ", tipo: "SCTR", fechaVencimiento: "30/11/2025", diasRestantes: 6, estado: "Por vencer", alerta: true },
    { id: 3, nombre: "JUAN PEREZ", tipo: "Vida Ley", fechaVencimiento: "20/12/2025", diasRestantes: 26, estado: "Vigente", alerta: false },
    { id: 4, nombre: "ANA LOPEZ", tipo: "Contrato", fechaVencimiento: "05/01/2026", diasRestantes: 42, estado: "Vigente", alerta: false },
    { id: 5, nombre: "CARLOS RODRIGUEZ", tipo: "SCTR", fechaVencimiento: "25/11/2025", diasRestantes: 1, estado: "Por vencer", alerta: true },
  ];

  // Datos ficticios para Gestión de Remuneraciones
  const remuneraciones = [
    { id: 1, nombre: "HERVIN CORONEL", sueldoBase: 5000, bonos: 500, ctsProyectado: 416.67, gratificaciones: 5000, total: 10916.67, mes: "Noviembre 2025" },
    { id: 2, nombre: "MARIA GONZALEZ", sueldoBase: 4500, bonos: 300, ctsProyectado: 375, gratificaciones: 4500, total: 9675, mes: "Noviembre 2025" },
    { id: 3, nombre: "JUAN PEREZ", sueldoBase: 4200, bonos: 400, ctsProyectado: 350, gratificaciones: 4200, total: 9150, mes: "Noviembre 2025" },
    { id: 4, nombre: "ANA LOPEZ", sueldoBase: 4800, bonos: 600, ctsProyectado: 400, gratificaciones: 4800, total: 10600, mes: "Noviembre 2025" },
    { id: 5, nombre: "CARLOS RODRIGUEZ", sueldoBase: 5500, bonos: 700, ctsProyectado: 458.33, gratificaciones: 5500, total: 12158.33, mes: "Noviembre 2025" },
  ];

  const sections = [
    { id: "gestion-colaboradores", name: "Gestión de Colaboradores", icon: "users" },
    { id: "solicitudes-incidencias", name: "Solicitudes/Incidencias", icon: "solicitudes" },
  ];

  const getIcon = (iconName) => {
    const icons = {
      users: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      clock: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      check: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      calendar: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      document: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      money: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      user: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      birthday: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        </svg>
      ),
      solicitudes: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    };
    return icons[iconName] || icons.users;
  };

  const renderGestionColaboradoresContent = () => {
    // Esta función renderiza solo el contenido de gestión de colaboradores
    return (
      <>
        {/* Listado de Colaboradores */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center text-white shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
                    {getIcon("users")}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Listado de Colaboradores</h2>
                    <p className="text-xs text-gray-600 mt-0.5">Gestiona los colaboradores activos del sistema</p>
                  </div>
                </div>
                <div className={`flex items-center space-x-1.5 rounded-lg px-2.5 py-1 ${
                  loadingColaboradores 
                    ? "bg-yellow-50 border border-yellow-200" 
                    : errorColaboradores 
                      ? "bg-red-50 border border-red-200" 
                      : "bg-green-50 border border-green-200"
                }`}>
                  {loadingColaboradores ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-yellow-600"></div>
                      <span className="text-xs font-semibold text-yellow-700">Cargando...</span>
                    </>
                  ) : errorColaboradores ? (
                    <>
                      <svg className="w-3.5 h-3.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="text-xs font-semibold text-red-700">Error</span>
                    </>
                  ) : (
                    <>
                  <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs font-semibold text-green-700">API Conectada</span>
                    </>
                  )}
                </div>
              </div>

              {errorColaboradores && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-700">
                    <strong>Error:</strong> {errorColaboradores}
                  </p>
                  <button
                    onClick={fetchColaboradores}
                    className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                  >
                    Intentar de nuevo
                  </button>
                </div>
              )}

              <button 
                onClick={() => setIsAgregarColaboradorModalOpen(true)}
                className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-lg font-medium hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm active:scale-[0.98] text-sm group"
                style={{ fontFamily: 'var(--font-poppins)' }}
              >
                <span>+ Agregar Colaborador</span>
              </button>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-blue-700 border-b-2 border-blue-800">
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">NOMBRE</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">APELLIDO</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ÁREA</th>
                        <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ACCIÓN</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {loadingColaboradores ? (
                        <tr>
                          <td colSpan={4} className="px-3 py-8 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700"></div>
                              <span className="text-sm text-gray-600">Cargando colaboradores...</span>
                            </div>
                          </td>
                        </tr>
                      ) : activos.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-3 py-8 text-center text-sm text-gray-500">
                            No hay colaboradores activos
                          </td>
                        </tr>
                      ) : (
                        activosPaginados.map((colaborador, index) => {
                          // Encontrar el colaborador completo original
                          const colaboradorCompleto = colaboradoresCompletos.find(c => {
                            const getValue = (obj, keys) => {
                              for (const key of keys) {
                                if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
                                  return obj[key];
                                }
                              }
                              return "";
                            };
                            const idOriginal = getValue(c, ["id", "ID", "Id"]);
                            const nombreOriginal = getValue(c, ["nombre", "NOMBRE", "Nombre", "name", "NAME"]);
                            return (idOriginal && idOriginal === colaborador.id) || 
                                   (nombreOriginal && nombreOriginal === colaborador.nombre);
                          }) || colaboradoresCompletos[index] || null;

                          return (
                            <tr key={colaborador.id || `colab-${index}`} className="hover:bg-slate-200 transition-colors">
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{colaborador.nombre}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{colaborador.apellido}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{colaborador.area}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center space-x-2">
                                  <button
                                    onClick={() => {
                                      setSelectedColaboradorCompleto(colaboradorCompleto);
                                      setIsVerDetallesModalOpen(true);
                                    }}
                                    className="inline-flex items-center space-x-1 px-2.5 py-1 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                                    title="Ver detalles del colaborador"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" style={{ pointerEvents: 'none' }}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    <span style={{ pointerEvents: 'none' }}>Ver Detalles</span>
                                  </button>
                                  <button
                                    onClick={async () => {
                                      setSelectedColaboradorImagen(colaboradorCompleto);
                                      setIsImagenModalOpen(true);
                                      setImagenPreview(null);
                                      setImagenActualGuardada(null);
                                      setSelectedImageFile(null);
                                      
                                      // Obtener imagen actual del backend
                                      const colaboradorId = getColaboradorId(colaboradorCompleto);
                                      console.log("🔄 Abriendo modal para colaborador ID:", colaboradorId);
                                      if (colaboradorId) {
                                        const imagenUrl = await fetchImagenColaborador(colaboradorId);
                                        console.log("🔄 Imagen obtenida:", imagenUrl);
                                        if (imagenUrl) {
                                          setImagenActualGuardada(imagenUrl);
                                          console.log("✅ Imagen actual guardada establecida:", imagenUrl);
                                          // NO establecer imagenPreview aquí - solo para archivos nuevos
                                        } else {
                                          setImagenActualGuardada(null);
                                          console.log("⚠️ No hay imagen guardada para este colaborador");
                                        }
                                      }
                                    }}
                                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none bg-gradient-to-br from-green-500 to-green-600 text-white"
                                    title="Gestionar imagen del colaborador"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" style={{ pointerEvents: 'none' }}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span style={{ pointerEvents: 'none' }}>Imagen</span>
                                  </button>
                            </div>
                          </td>
                        </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="bg-slate-200 px-3 py-2 flex items-center justify-between border-t-2 border-slate-300">
                  <button 
                    onClick={goToFirstPageActivos}
                    disabled={currentPageActivos === 1} 
                    className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
                    aria-label="Primera página"
                  >
                    «
                  </button>
                  <button 
                    onClick={goToPrevPageActivos}
                    disabled={currentPageActivos === 1} 
                    className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
                    aria-label="Página anterior"
                  >
                    &lt;
                  </button>
                  <span className="text-[10px] text-gray-700 font-medium">
                    Página {currentPageActivos} de {totalPagesActivos}
                  </span>
                  <button 
                    onClick={goToNextPageActivos}
                    disabled={currentPageActivos === totalPagesActivos} 
                    className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
                    aria-label="Página siguiente"
                  >
                    &gt;
                  </button>
                  <button 
                    onClick={goToLastPageActivos}
                    disabled={currentPageActivos === totalPagesActivos} 
                    className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
                    aria-label="Última página"
                  >
                    »
                  </button>
                </div>
              </div>
            </div>

            {/* Colaboradores Inactivos */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center text-white shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
                    {getIcon("users")}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Colaboradores Inactivos</h2>
                    <p className="text-xs text-gray-600 mt-0.5">Sin acceso al sistema</p>
                  </div>
                </div>
                <div className={`flex items-center space-x-1.5 rounded-lg px-2.5 py-1 ${
                  loadingColaboradores 
                    ? "bg-yellow-50 border border-yellow-200" 
                    : errorColaboradores 
                      ? "bg-red-50 border border-red-200" 
                      : "bg-green-50 border border-green-200"
                }`}>
                  {loadingColaboradores ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-yellow-600"></div>
                      <span className="text-xs font-semibold text-yellow-700">Cargando...</span>
                    </>
                  ) : errorColaboradores ? (
                    <>
                      <svg className="w-3.5 h-3.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="text-xs font-semibold text-red-700">Error</span>
                    </>
                  ) : (
                    <>
                  <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs font-semibold text-green-700">API Conectada</span>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-blue-700 border-b-2 border-blue-800">
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">NOMBRE</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">APELLIDO</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ÁREA</th>
                        <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ACCIÓN</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {loadingColaboradores ? (
                        <tr>
                          <td colSpan={4} className="px-3 py-8 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700"></div>
                              <span className="text-sm text-gray-600">Cargando colaboradores...</span>
                            </div>
                          </td>
                        </tr>
                      ) : inactivos.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-3 py-8 text-center text-sm text-gray-500">
                            No hay colaboradores inactivos
                          </td>
                        </tr>
                      ) : (
                        inactivosPaginados.map((colaborador, index) => {
                          // Encontrar el colaborador completo original
                          const colaboradorCompleto = colaboradoresCompletos.find(c => {
                            const getValue = (obj, keys) => {
                              for (const key of keys) {
                                if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
                                  return obj[key];
                                }
                              }
                              return "";
                            };
                            const idOriginal = getValue(c, ["id", "ID", "Id"]);
                            const nombreOriginal = getValue(c, ["nombre", "NOMBRE", "Nombre", "name", "NAME"]);
                            return (idOriginal && idOriginal === colaborador.id) || 
                                   (nombreOriginal && nombreOriginal === colaborador.nombre);
                          }) || colaboradoresCompletos[colaboradores.length + index] || null;

                          return (
                            <tr key={colaborador.id || `colab-inactivo-${index}`} className="hover:bg-slate-200 transition-colors">
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">{colaborador.nombre}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{colaborador.apellido}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{colaborador.area}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center space-x-2">
                                  <button
                                    onClick={() => {
                                      setSelectedColaboradorCompleto(colaboradorCompleto);
                                      setIsVerDetallesModalOpen(true);
                                    }}
                                    className="inline-flex items-center space-x-1 px-2.5 py-1 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                                    title="Ver detalles del colaborador"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" style={{ pointerEvents: 'none' }}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    <span style={{ pointerEvents: 'none' }}>Ver Detalles</span>
                                  </button>
                                  <button
                                    onClick={async () => {
                                      setSelectedColaboradorImagen(colaboradorCompleto);
                                      setIsImagenModalOpen(true);
                                      setImagenPreview(null);
                                      setImagenActualGuardada(null);
                                      setSelectedImageFile(null);
                                      
                                      // Obtener imagen actual del backend
                                      const colaboradorId = getColaboradorId(colaboradorCompleto);
                                      console.log("🔄 Abriendo modal para colaborador ID:", colaboradorId);
                                      if (colaboradorId) {
                                        const imagenUrl = await fetchImagenColaborador(colaboradorId);
                                        console.log("🔄 Imagen obtenida:", imagenUrl);
                                        if (imagenUrl) {
                                          setImagenActualGuardada(imagenUrl);
                                          console.log("✅ Imagen actual guardada establecida:", imagenUrl);
                                          // NO establecer imagenPreview aquí - solo para archivos nuevos
                                        } else {
                                          setImagenActualGuardada(null);
                                          console.log("⚠️ No hay imagen guardada para este colaborador");
                                        }
                                      }
                                    }}
                                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none bg-gradient-to-br from-green-500 to-green-600 text-white"
                                    title="Gestionar imagen del colaborador"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" style={{ pointerEvents: 'none' }}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span style={{ pointerEvents: 'none' }}>Imagen</span>
                                  </button>
                            </div>
                          </td>
                        </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="bg-slate-200 px-3 py-2 flex items-center justify-between border-t-2 border-slate-300">
                  <button 
                    onClick={goToFirstPageInactivos}
                    disabled={currentPageInactivos === 1} 
                    className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
                    aria-label="Primera página"
                  >
                    «
                  </button>
                  <button 
                    onClick={goToPrevPageInactivos}
                    disabled={currentPageInactivos === 1} 
                    className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
                    aria-label="Página anterior"
                  >
                    &lt;
                  </button>
                  <span className="text-[10px] text-gray-700 font-medium">
                    Página {currentPageInactivos} de {totalPagesInactivos}
                  </span>
                  <button 
                    onClick={goToNextPageInactivos}
                    disabled={currentPageInactivos === totalPagesInactivos} 
                    className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
                    aria-label="Página siguiente"
                  >
                    &gt;
                  </button>
                  <button 
                    onClick={goToLastPageInactivos}
                    disabled={currentPageInactivos === totalPagesInactivos} 
                    className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
                    aria-label="Última página"
                  >
                    »
                  </button>
                </div>
              </div>
            </div>
          </>
        );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${
          sidebarOpen ? "lg:ml-60 ml-0" : "ml-0"
        }`}
      >
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto custom-scrollbar" style={{ background: 'linear-gradient(to bottom, #f7f9fc, #ffffff)' }}>
          <div className="max-w-[95%] mx-auto px-4 py-4">
            {/* Botón Volver */}
            <button
              onClick={() => router.push("/recursos-humanos")}
              className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-lg font-medium hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm ripple-effect relative overflow-hidden text-sm group"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver a Recursos Humanos</span>
            </button>

            {/* Card contenedor blanco */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">

            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-xl flex items-center justify-center text-white shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
                  {getIcon("users")}
                </div>
                <div>
                  <h1 className="text-2xl font-medium text-gray-900 tracking-tight" style={{ fontFamily: 'var(--font-poppins)' }}>GESTIÓN DE COLABORADORES</h1>
                  <p className="text-sm text-gray-600 font-normal mt-0.5" style={{ fontFamily: 'var(--font-poppins)' }}>Listado de colaboradores activos e inactivos</p>
                </div>
              </div>
            </div>

            {/* Contenido */}
            <div className="space-y-4">
              {renderGestionColaboradoresContent()}
            </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal Ver Detalles Colaborador */}
      <Modal
        isOpen={isVerDetallesModalOpen}
        onClose={() => {
          setIsVerDetallesModalOpen(false);
          setSelectedColaboradorCompleto(null);
          setDatosEditables([]);
          setDatosSecciones({
            "informacion-personal": [],
            "informacion-familiar": [],
            "ubicacion": [],
            "informacion-laboral": [],
            "seguros": [],
          });
          setActiveTab("informacion-personal");
          setEditingSections({
            "informacion-personal": false,
            "informacion-familiar": false,
            "ubicacion": false,
            "informacion-laboral": false,
            "seguros": false,
            "datos": false,
            "correo": false,
          });
          setErrorDatosSeccion(null);
        }}
        title={`Detalles del Colaborador - ${selectedColaboradorCompleto ? (selectedColaboradorCompleto.nombre || selectedColaboradorCompleto.NOMBRE || selectedColaboradorCompleto.name || selectedColaboradorCompleto.NAME || "") : ""}`}
        size="full"
      >
        {selectedColaboradorCompleto && (
          <div className="space-y-3">
            {/* Tabs Navigation */}
            <div className="flex space-x-1 border-b border-gray-200 overflow-x-auto">
              {[
                { id: "informacion-personal", label: "Información Personal" },
                { id: "informacion-familiar", label: "Información Familiar" },
                { id: "ubicacion", label: "Ubicación" },
                { id: "informacion-laboral", label: "Información Laboral" },
                { id: "seguros", label: "Seguros" },
                { id: "datos", label: "Datos" },
                { id: "correo", label: "Correo" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? "text-[#1E63F7] border-b-2 border-[#1E63F7] bg-blue-50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {/* Contenido del Tab Activo */}
            <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
            {(() => {
              // Función helper para obtener valores
              const getValue = (obj, keys) => {
                for (const key of keys) {
                  if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
                    return obj[key];
                  }
                }
                return null;
              };

              const formatValue = (value) => {
                if (value === null || value === undefined || value === "") {
                  return "No disponible";
                }
                if (typeof value === "object") {
                  return JSON.stringify(value, null, 2);
                }
                return String(value);
              };

              const formatDate = (dateValue) => {
                if (!dateValue) return "No disponible";
                try {
                  // Si es YYYY-MM-DD, parsear manualmente para evitar timezone issues
                  if (/^\d{4}-\d{2}-\d{2}/.test(dateValue)) {
                    const match = String(dateValue).match(/^(\d{4})-(\d{2})-(\d{2})/);
                    if (match) {
                      const [, año, mes, dia] = match.map(Number);
                      return `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${año}`;
                    }
                  }
                  const date = new Date(dateValue);
                  if (!isNaN(date.getTime())) {
                    // Extraer componentes directamente para evitar timezone issues
                    const año = date.getFullYear();
                    const mes = date.getMonth() + 1;
                    const dia = date.getDate();
                    return `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${año}`;
                  }
                  return dateValue;
                } catch (e) {
                  return dateValue;
                }
              };

              // Obtener todos los campos del objeto, excluyendo ID y ID_PERSONA
              const campos = Object.keys(selectedColaboradorCompleto).filter(campo => {
                const campoUpper = campo.toUpperCase();
                return campoUpper !== "ID" && campoUpper !== "ID_PERSONA";
              });
              
              // Función para formatear fechas
              const formatDateValue = (value) => {
                if (!value || value === null || value === undefined || value === "") {
                  return "-";
                }
                // Si ya es una fecha formateada, retornarla
                if (typeof value === "string" && value.includes("/")) {
                  return value;
                }
                // Intentar parsear como fecha
                try {
                  // Si es YYYY-MM-DD, parsear manualmente para evitar timezone issues
                  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
                    const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
                    if (match) {
                      const [, año, mes, dia] = match.map(Number);
                      return `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${año}`;
                    }
                  }
                  const date = new Date(value);
                  if (!isNaN(date.getTime())) {
                    // Extraer componentes directamente para evitar timezone issues
                    const año = date.getFullYear();
                    const mes = date.getMonth() + 1;
                    const dia = date.getDate();
                    return `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${año}`;
                  }
                } catch (e) {
                  // Si no es fecha, retornar el valor original
                }
                return String(value);
              };

              // Organizar campos en secciones
              const getFieldValue = (fieldKeys) => {
                for (const key of fieldKeys) {
                  const value = getValue(selectedColaboradorCompleto, [key, key.toUpperCase(), key.toLowerCase()]);
                  if (value !== null && value !== undefined && value !== "") {
                    return value;
                  }
                }
                return null;
              };

              const formatFieldValue = (value) => {
                if (value === null || value === undefined || value === "") {
                  return "No disponible";
                }
                return String(value);
              };

              const formatTieneHijos = (value) => {
                if (value === null || value === undefined || value === "") {
                  return "No disponible";
                }
                const strValue = String(value).trim();
                if (strValue === "1" || strValue === 1 || strValue === "Si" || strValue === "SI" || strValue === "Sí") {
                  return "Si";
                }
                if (strValue === "0" || strValue === 0 || strValue === "No" || strValue === "NO") {
                  return "No";
                }
                return strValue;
              };

              // Información Personal
              const estadoCivilRaw = getFieldValue(["estado_civil", "ESTADO_CIVIL", "estadoCivil"]);
              let estadoCivilConvertido = "No disponible";
              if (estadoCivilRaw && estadoCivilRaw !== null && estadoCivilRaw !== undefined && estadoCivilRaw !== "") {
                const estadoStr = String(estadoCivilRaw).trim();
                if (estadoStr !== "No disponible" && estadoStr !== "-") {
                  estadoCivilConvertido = convertirCodigoAEstadoCivil(estadoStr);
                  // Si la conversión no está en la lista, usar el valor original si está en la lista
                  if (!estadosCiviles.includes(estadoCivilConvertido)) {
                    const upperOriginal = estadoStr.toUpperCase();
                    if (estadosCiviles.includes(upperOriginal)) {
                      estadoCivilConvertido = upperOriginal;
                    }
                  }
                }
              }
              
              const infoPersonal = {
                nombre: formatFieldValue(getFieldValue(["nombre", "NOMBRE", "name", "NAME"])),
                segundoNombre: formatFieldValue(getFieldValue(["segundo_nombre", "SEGUNDO_NOMBRE", "segundoNombre", "2do_nombre", "2DO_NOMBRE"])),
                apellido: formatFieldValue(getFieldValue(["apellido", "APELLIDO", "lastname", "LASTNAME"])),
                segundoApellido: formatFieldValue(getFieldValue(["segundo_apellido", "SEGUNDO_APELLIDO", "segundoApellido", "2do_apellido", "2DO_APELLIDO"])),
                fechaNacimiento: formatDateValue(getFieldValue(["fecha_nacimiento", "FECHA_NACIMIENTO", "fechaNacimiento", "fecha_nac", "FECHA_NAC"])),
                tipoDocumento: formatFieldValue(getFieldValue(["tipo_documento", "TIPO_DOCUMENTO", "tipoDocumento", "tipo_doc", "TIPO_DOC"])),
                numeroDocumento: formatFieldValue(getFieldValue(["numero_documento", "NUMERO_DOCUMENTO", "numeroDocumento", "n_doc", "N_DOC", "documento", "DOCUMENTO"])),
                estadoCivil: estadoCivilConvertido,
                estado: formatFieldValue(getFieldValue(["estado", "ESTADO", "status", "STATUS"])),
              };

              // Información Familiar
              const infoFamiliar = {
                tieneHijos: formatTieneHijos(getFieldValue(["hijos_boolean", "HIJOS_BOOLEAN", "tieneHijos", "TIENE_HIJOS"])),
                cantHijos: formatFieldValue(getFieldValue(["cant_hijos", "CANT_HIJOS", "cantidadHijos", "CANTIDAD_HIJOS"])),
              };

              // Ubicación
              const ubicacion = {
                direccion: formatFieldValue(getFieldValue(["direccion", "DIRECCION", "address", "ADDRESS"])),
                googleMaps: formatFieldValue(getFieldValue(["google_maps", "GOOGLE_MAPS", "googleMaps"])),
              };

              // Información Laboral
              const infoLaboral = {
                ocupacion: formatFieldValue(getFieldValue(["ocupacion", "OCUPACION", "occupation", "OCCUPATION"])),
                cargo: formatFieldValue(getFieldValue(["cargo", "CARGO", "position", "POSITION"])),
                area: formatFieldValue(getFieldValue(["area", "AREA", "departamento", "DEPARTAMENTO"])),
                rol: formatFieldValue(getFieldValue(["rol", "ROL", "role", "ROLE"])),
              };

              // Seguros
              // Función para convertir 1/0 a Si/No para el campo Seguro Vida Ley
              const formatSeguroVidaLey = (value) => {
                if (value === null || value === undefined || value === "") {
                  return "No disponible";
                }
                const strValue = String(value).trim();
                if (strValue === "1" || strValue === 1 || strValue === "Si" || strValue === "SI" || strValue === "Sí") {
                  return "Si";
                }
                if (strValue === "0" || strValue === 0 || strValue === "No" || strValue === "NO") {
                  return "No";
                }
                return strValue;
              };
              
              const seguros = {
                seguroVidaLey: formatSeguroVidaLey(getFieldValue(["seguro_vida_ley", "SEGURO_VIDA_LEY", "seguroVidaLey"])),
                fechaVencimiento: formatDateValue(getFieldValue(["seguro_fecha_vencimiento", "SEGURO_FECHA_VENCIMIENTO", "fecha_vencimiento", "FECHA_VENCIMIENTO"])),
                fechaInicio: formatDateValue(getFieldValue(["seguro_fecha_inicio", "SEGURO_FECHA_INICIO", "fecha_inicio", "FECHA_INICIO"])),
              };

              const SeccionField = ({ label, value }) => {
                const isAvailable = value !== "No disponible" && value !== "-";
                return (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      {label}
                    </label>
                    <p className={`text-sm px-3 py-2 rounded-lg border ${
                      isAvailable 
                        ? "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 text-gray-900 font-medium" 
                        : "bg-gray-50 border-gray-200 text-gray-500"
                    }`}>
                      {value}
                    </p>
                  </div>
                );
              };

              const Seccion = ({ title, children }) => (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-700 to-blue-800 px-4 py-3">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wide">{title}</h3>
                  </div>
                  <div className="p-4">
                    {children}
                  </div>
                </div>
              );

              // Función para obtener el valor inicial (sin ediciones pendientes)
              const getInitialValue = (fieldKey, originalValue) => {
                // Si es estadoCivil, manejar la conversión
                if (fieldKey === "estadoCivil") {
                  if (!originalValue || originalValue === "No disponible" || originalValue === "-") {
                    return "";
                  }
                  const upperValue = String(originalValue).toUpperCase().trim();
                  // Si ya está en la lista de opciones, retornarlo tal cual
                  if (estadosCiviles.includes(upperValue)) {
                    return upperValue;
                  }
                  // Si no, intentar convertir de código a texto
                  const converted = convertirCodigoAEstadoCivil(upperValue);
                  if (estadosCiviles.includes(converted)) {
                    return converted;
                  }
                  return upperValue;
                }
                // Si es tieneHijos, manejar la conversión Si/No
                if (fieldKey === "tieneHijos") {
                  if (!originalValue || originalValue === "No disponible" || originalValue === "-") {
                    return "";
                  }
                  const strValue = String(originalValue).trim();
                  if (strValue === "1" || strValue === 1 || strValue === "Si" || strValue === "SI" || strValue === "Sí") {
                    return "Si";
                  }
                  if (strValue === "0" || strValue === 0 || strValue === "No" || strValue === "NO") {
                    return "No";
                  }
                  return strValue;
                }
                return originalValue === "No disponible" || originalValue === "-" ? "" : originalValue;
              };
              
              // Función para commit de cambios (se llama en onBlur)
              const handleFieldCommit = (fieldKey, value) => {
                switch (activeTab) {
                  case "informacion-personal":
                    setEditDataPersonal(prev => ({ ...prev, [fieldKey]: value }));
                    break;
                  case "informacion-familiar":
                    setEditDataFamiliar(prev => {
                      const updated = { ...prev, [fieldKey]: value };
                      // Si se cambia tieneHijos a "No", automáticamente establecer cantHijos a 0
                      if (fieldKey === "tieneHijos" && (value === "No" || value === "NO" || value === "0" || value === 0)) {
                        updated.cantHijos = "0";
                      }
                      return updated;
                    });
                    break;
                  case "ubicacion":
                    setEditDataUbicacion(prev => ({ ...prev, [fieldKey]: value }));
                    break;
                  case "informacion-laboral":
                    setEditDataLaboral(prev => ({ ...prev, [fieldKey]: value }));
                    break;
                  case "seguros":
                    setEditDataSeguros(prev => ({ ...prev, [fieldKey]: value }));
                    break;
                }
              };

              // Función para guardar cambios de una sección
              const handleSaveSection = async () => {
                if (!selectedColaboradorCompleto) return;
                
                const colaboradorId = getColaboradorId(selectedColaboradorCompleto);
                if (!colaboradorId) {
                  setNotification({
                    show: true,
                    message: "Error: No se pudo obtener el ID del colaborador",
                    type: "error"
                  });
                  setTimeout(() => setNotification({ show: false, message: "", type: "error" }), 3000);
                  return;
                }

                try {
                  let response;
                  let updatedColaborador = { ...selectedColaboradorCompleto };

                  switch (activeTab) {
                    case "informacion-personal":
                      response = await actualizarInformacionPersonal(colaboradorId, editDataPersonal);
                      // Actualizar selectedColaboradorCompleto con los datos editados
                      if (editDataPersonal.nombre !== undefined) updatedColaborador.NOMBRE = editDataPersonal.nombre;
                      if (editDataPersonal.segundoNombre !== undefined) updatedColaborador.SEGUNDO_NOMBRE = editDataPersonal.segundoNombre;
                      if (editDataPersonal.apellido !== undefined) updatedColaborador.APELLIDO = editDataPersonal.apellido;
                      if (editDataPersonal.segundoApellido !== undefined) updatedColaborador.SEGUNDO_APELLIDO = editDataPersonal.segundoApellido;
                      if (editDataPersonal.fechaNacimiento !== undefined) updatedColaborador.FECHA_NACIMIENTO = editDataPersonal.fechaNacimiento;
                      if (editDataPersonal.tipoDocumento !== undefined) updatedColaborador.TIPO_DOCUMENTO = editDataPersonal.tipoDocumento;
                      if (editDataPersonal.numeroDocumento !== undefined) updatedColaborador.NUMERO_DOCUMENTO = editDataPersonal.numeroDocumento;
                      if (editDataPersonal.estadoCivil !== undefined) {
                        // Guardar el código convertido en lugar del texto completo
                        const codigoConvertido = convertirEstadoCivilACodigo(editDataPersonal.estadoCivil);
                        if (codigoConvertido && codigoConvertido.trim() !== "") {
                          updatedColaborador.ESTADO_CIVIL = codigoConvertido.trim().substring(0, 2).toUpperCase();
                        }
                      }
                      if (editDataPersonal.estado !== undefined) updatedColaborador.ESTADO = editDataPersonal.estado;
                      break;
                    case "informacion-familiar":
                      response = await actualizarInformacionFamiliar(colaboradorId, editDataFamiliar);
                      if (editDataFamiliar.tieneHijos !== undefined) updatedColaborador.HIJOS_BOOLEAN = editDataFamiliar.tieneHijos;
                      if (editDataFamiliar.cantHijos !== undefined) updatedColaborador.CANT_HIJOS = editDataFamiliar.cantHijos;
                      break;
                    case "ubicacion":
                      response = await actualizarUbicacion(colaboradorId, editDataUbicacion);
                      if (editDataUbicacion.direccion !== undefined) updatedColaborador.DIRECCION = editDataUbicacion.direccion;
                      if (editDataUbicacion.googleMaps !== undefined) updatedColaborador.GOOGLE_MAPS = editDataUbicacion.googleMaps;
                      break;
                    case "informacion-laboral":
                      response = await actualizarInformacionLaboral(colaboradorId, editDataLaboral);
                      if (editDataLaboral.ocupacion !== undefined) updatedColaborador.OCUPACION = editDataLaboral.ocupacion;
                      if (editDataLaboral.cargo !== undefined) updatedColaborador.CARGO = editDataLaboral.cargo;
                      if (editDataLaboral.area !== undefined) updatedColaborador.AREA = editDataLaboral.area;
                      if (editDataLaboral.rol !== undefined) updatedColaborador.ROL = editDataLaboral.rol;
                      break;
                    case "seguros":
                      response = await actualizarSeguros(colaboradorId, editDataSeguros);
                      if (editDataSeguros.seguroVidaLey !== undefined) updatedColaborador.SEGURO_VIDA_LEY = editDataSeguros.seguroVidaLey;
                      if (editDataSeguros.fechaVencimiento !== undefined) updatedColaborador.SEGURO_FECHA_VENCIMIENTO = editDataSeguros.fechaVencimiento;
                      if (editDataSeguros.fechaInicio !== undefined) updatedColaborador.SEGURO_FECHA_INICIO = editDataSeguros.fechaInicio;
                      break;
                    default:
                      return;
                  }

                  // Verificar si la actualización fue exitosa
                  if (response && (response.filas_afectadas === 0 || response.filas_afectadas === undefined)) {
                    console.warn("La actualización no afectó ninguna fila");
                  }

                  // Actualizar el estado local
                  setSelectedColaboradorCompleto(updatedColaborador);
                  
                  // Cerrar modo de edición
                  setEditingSections(prev => ({ ...prev, [activeTab]: false }));
                  
                  // Mostrar notificación de éxito
                  setNotification({
                    show: true,
                    message: "Cambios guardados exitosamente",
                    type: "success"
                  });
                  setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 3000);

                  // Recargar los datos del colaborador para asegurar sincronización
                  await fetchColaboradores();
                } catch (error) {
                  console.error("Error al guardar cambios:", error);
                  setNotification({
                    show: true,
                    message: `Error al guardar: ${error.message || "Error desconocido"}`,
                    type: "error"
                  });
                  setTimeout(() => setNotification({ show: false, message: "", type: "error" }), 3000);
                }
              };

              // Renderizar contenido según el tab activo
              const renderTabContent = () => {
                const isEditing = editingSections[activeTab];
                

                switch (activeTab) {
                  case "informacion-personal":
                    return (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-bold text-gray-800 uppercase">Información Personal</h3>
                          <div className="flex items-center space-x-2">
                            {!isEditing ? (
                              <button
                                onClick={() => {
                                  setEditingSections(prev => ({ ...prev, [activeTab]: true }));
                                  // Inicializar datos editables con valores actuales
                                  setEditDataPersonal({
                                    nombre: infoPersonal.nombre !== "No disponible" ? infoPersonal.nombre : "",
                                    segundoNombre: infoPersonal.segundoNombre !== "No disponible" ? infoPersonal.segundoNombre : "",
                                    apellido: infoPersonal.apellido !== "No disponible" ? infoPersonal.apellido : "",
                                    segundoApellido: infoPersonal.segundoApellido !== "No disponible" ? infoPersonal.segundoApellido : "",
                                    fechaNacimiento: infoPersonal.fechaNacimiento !== "No disponible" && infoPersonal.fechaNacimiento !== "-" ? infoPersonal.fechaNacimiento : "",
                                    tipoDocumento: infoPersonal.tipoDocumento !== "No disponible" ? infoPersonal.tipoDocumento : "",
                                    numeroDocumento: infoPersonal.numeroDocumento !== "No disponible" ? infoPersonal.numeroDocumento : "",
                                    estadoCivil: infoPersonal.estadoCivil !== "No disponible" ? infoPersonal.estadoCivil : "",
                                    estado: infoPersonal.estado !== "No disponible" ? infoPersonal.estado : "",
                                  });
                                }}
                                className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition-colors shadow-sm"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                <span>Editar</span>
                              </button>
                            ) : (
                              <button
                                onClick={handleSaveSection}
                                className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold transition-colors shadow-sm"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Guardar</span>
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <EditableField 
                            label="Nombre" 
                            initialValue={getInitialValue("nombre", infoPersonal.nombre)} 
                            fieldKey="nombre"
                            sectionKey={activeTab}
                            isEditing={isEditing}
                            onCommit={handleFieldCommit}
                          />
                          <EditableField 
                            label="2do Nombre" 
                            initialValue={getInitialValue("segundoNombre", infoPersonal.segundoNombre)} 
                            fieldKey="segundoNombre"
                            sectionKey={activeTab}
                            isEditing={isEditing}
                            onCommit={handleFieldCommit}
                          />
                          <EditableField 
                            label="Apellido" 
                            initialValue={getInitialValue("apellido", infoPersonal.apellido)} 
                            fieldKey="apellido"
                            sectionKey={activeTab}
                            isEditing={isEditing}
                            onCommit={handleFieldCommit}
                          />
                          <EditableField 
                            label="2do Apellido" 
                            initialValue={getInitialValue("segundoApellido", infoPersonal.segundoApellido)} 
                            fieldKey="segundoApellido"
                            sectionKey={activeTab}
                            isEditing={isEditing}
                            onCommit={handleFieldCommit}
                          />
                          <EditableField 
                            label="Fecha Nac" 
                            initialValue={getInitialValue("fechaNacimiento", infoPersonal.fechaNacimiento)} 
                            fieldKey="fechaNacimiento"
                            sectionKey={activeTab}
                            isEditing={isEditing}
                            onCommit={handleFieldCommit}
                            type="date"
                          />
                          <EditableField 
                            label="Tipo Doc" 
                            initialValue={getInitialValue("tipoDocumento", infoPersonal.tipoDocumento)} 
                            fieldKey="tipoDocumento"
                            sectionKey={activeTab}
                            isEditing={isEditing}
                            onCommit={handleFieldCommit}
                          />
                          <EditableField 
                            label="N° Doc" 
                            initialValue={getInitialValue("numeroDocumento", infoPersonal.numeroDocumento)} 
                            fieldKey="numeroDocumento"
                            sectionKey={activeTab}
                            isEditing={isEditing}
                            onCommit={handleFieldCommit}
                          />
                          <EditableField 
                            label="Estado civil" 
                            initialValue={getInitialValue("estadoCivil", infoPersonal.estadoCivil)} 
                            fieldKey="estadoCivil"
                            sectionKey={activeTab}
                            isEditing={isEditing}
                            onCommit={handleFieldCommit}
                            options={estadosCiviles}
                          />
                        </div>
                      </div>
                    );

                  case "informacion-familiar":
                    return (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-bold text-gray-800 uppercase">Información Familiar</h3>
                          <div className="flex items-center space-x-2">
                            {!isEditing ? (
                              <button
                                onClick={() => {
                                  setEditingSections(prev => ({ ...prev, [activeTab]: true }));
                                  setEditDataFamiliar({
                                    tieneHijos: infoFamiliar.tieneHijos !== "No disponible" ? infoFamiliar.tieneHijos : "",
                                    cantHijos: infoFamiliar.cantHijos !== "No disponible" ? infoFamiliar.cantHijos : "",
                                  });
                                }}
                                className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition-colors shadow-sm"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                <span>Editar</span>
                              </button>
                            ) : (
                              <button
                                onClick={handleSaveSection}
                                className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold transition-colors shadow-sm"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Guardar</span>
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <EditableField 
                            label="¿Tiene hijos?" 
                            initialValue={getInitialValue("tieneHijos", infoFamiliar.tieneHijos)} 
                            fieldKey="tieneHijos"
                            sectionKey={activeTab}
                            isEditing={isEditing}
                            onCommit={handleFieldCommit}
                            options={["Si", "No"]}
                          />
                          <EditableField 
                            key={`cantHijos-${editDataFamiliar.cantHijos !== undefined ? editDataFamiliar.cantHijos : infoFamiliar.cantHijos}-${editDataFamiliar.tieneHijos !== undefined ? editDataFamiliar.tieneHijos : infoFamiliar.tieneHijos}`}
                            label="Cant hijos" 
                            initialValue={getInitialValue("cantHijos", editDataFamiliar.cantHijos !== undefined ? editDataFamiliar.cantHijos : infoFamiliar.cantHijos)} 
                            fieldKey="cantHijos"
                            sectionKey={activeTab}
                            isEditing={isEditing}
                            onCommit={handleFieldCommit}
                            type="number"
                            disabled={(() => {
                              const tieneHijosValue = editDataFamiliar.tieneHijos !== undefined 
                                ? editDataFamiliar.tieneHijos 
                                : infoFamiliar.tieneHijos;
                              return tieneHijosValue === "No" || tieneHijosValue === "NO" || tieneHijosValue === "0" || tieneHijosValue === 0;
                            })()}
                          />
                        </div>
                      </div>
                    );

                  case "ubicacion":
                    return (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-bold text-gray-800 uppercase">Ubicación</h3>
                          <div className="flex items-center space-x-2">
                            {!isEditing ? (
                              <button
                                onClick={() => {
                                  setEditingSections(prev => ({ ...prev, [activeTab]: true }));
                                  setEditDataUbicacion({
                                    direccion: ubicacion.direccion !== "No disponible" ? ubicacion.direccion : "",
                                    googleMaps: ubicacion.googleMaps !== "No disponible" ? ubicacion.googleMaps : "",
                                  });
                                }}
                                className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition-colors shadow-sm"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                <span>Editar</span>
                              </button>
                            ) : (
                              <button
                                onClick={handleSaveSection}
                                className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold transition-colors shadow-sm"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Guardar</span>
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <EditableField 
                            label="Dirección" 
                            initialValue={getInitialValue("direccion", ubicacion.direccion)} 
                            fieldKey="direccion"
                            sectionKey={activeTab}
                            isEditing={isEditing}
                            onCommit={handleFieldCommit}
                          />
                          <EditableField 
                            label="Google Maps" 
                            initialValue={getInitialValue("googleMaps", ubicacion.googleMaps)} 
                            fieldKey="googleMaps"
                            sectionKey={activeTab}
                            isEditing={isEditing}
                            onCommit={handleFieldCommit}
                          />
                        </div>
                      </div>
                    );

                  case "informacion-laboral":
                    return (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-bold text-gray-800 uppercase">Información Laboral</h3>
                          <div className="flex items-center space-x-2">
                            {!isEditing ? (
                              <button
                                onClick={() => {
                                  setEditingSections(prev => ({ ...prev, [activeTab]: true }));
                                  setEditDataLaboral({
                                    ocupacion: infoLaboral.ocupacion !== "No disponible" ? infoLaboral.ocupacion : "",
                                    cargo: infoLaboral.cargo !== "No disponible" ? infoLaboral.cargo : "",
                                    area: infoLaboral.area !== "No disponible" ? infoLaboral.area : "",
                                    rol: infoLaboral.rol !== "No disponible" ? infoLaboral.rol : "",
                                  });
                                }}
                                className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition-colors shadow-sm"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                <span>Editar</span>
                              </button>
                            ) : (
                              <button
                                onClick={handleSaveSection}
                                className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold transition-colors shadow-sm"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Guardar</span>
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <EditableField 
                            label="Ocupación" 
                            initialValue={getInitialValue("ocupacion", infoLaboral.ocupacion)} 
                            fieldKey="ocupacion"
                            sectionKey={activeTab}
                            isEditing={isEditing}
                            onCommit={handleFieldCommit}
                          />
                          <EditableField 
                            label="Cargo" 
                            initialValue={getInitialValue("cargo", infoLaboral.cargo)} 
                            fieldKey="cargo"
                            sectionKey={activeTab}
                            isEditing={isEditing}
                            onCommit={handleFieldCommit}
                          />
                          <EditableField 
                            label="Área" 
                            initialValue={getInitialValue("area", infoLaboral.area)} 
                            fieldKey="area"
                            sectionKey={activeTab}
                            isEditing={isEditing}
                            onCommit={handleFieldCommit}
                            options={areasDisponibles}
                          />
                          <EditableField 
                            label="Rol" 
                            initialValue={getInitialValue("rol", infoLaboral.rol)} 
                            fieldKey="rol"
                            sectionKey={activeTab}
                            isEditing={isEditing}
                            onCommit={handleFieldCommit}
                            options={rolesDisponibles}
                          />
                        </div>
                      </div>
                    );

                  case "seguros":
                    return (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-bold text-gray-800 uppercase">Seguros</h3>
                          <div className="flex items-center space-x-2">
                            {!isEditing ? (
                              <button
                                onClick={() => {
                                  setEditingSections(prev => ({ ...prev, [activeTab]: true }));
                                  setEditDataSeguros({
                                    seguroVidaLey: seguros.seguroVidaLey !== "No disponible" ? seguros.seguroVidaLey : "",
                                    fechaVencimiento: seguros.fechaVencimiento !== "No disponible" && seguros.fechaVencimiento !== "-" ? seguros.fechaVencimiento : "",
                                    fechaInicio: seguros.fechaInicio !== "No disponible" && seguros.fechaInicio !== "-" ? seguros.fechaInicio : "",
                                  });
                                }}
                                className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition-colors shadow-sm"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                <span>Editar</span>
                              </button>
                            ) : (
                              <button
                                onClick={handleSaveSection}
                                className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold transition-colors shadow-sm"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Guardar</span>
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <EditableField 
                            key={`seguroVidaLey-${editDataSeguros.seguroVidaLey !== undefined ? editDataSeguros.seguroVidaLey : seguros.seguroVidaLey}`}
                            label="Seguro Vida Ley" 
                            initialValue={getInitialValue("seguroVidaLey", editDataSeguros.seguroVidaLey !== undefined ? editDataSeguros.seguroVidaLey : seguros.seguroVidaLey)} 
                            fieldKey="seguroVidaLey"
                            sectionKey={activeTab}
                            isEditing={isEditing}
                            onCommit={handleFieldCommit}
                            options={["Si", "No"]}
                          />
                          {(() => {
                            // Obtener el valor actual de Seguro Vida Ley
                            const seguroVidaLeyValue = editDataSeguros.seguroVidaLey !== undefined 
                              ? editDataSeguros.seguroVidaLey 
                              : seguros.seguroVidaLey;
                            // Mostrar campos de fecha solo si no es "No"
                            const mostrarFechas = seguroVidaLeyValue !== "No" && seguroVidaLeyValue !== "NO" && seguroVidaLeyValue !== "0" && seguroVidaLeyValue !== 0 && seguroVidaLeyValue !== "No disponible";
                            
                            if (!mostrarFechas) return null;
                            
                            return (
                              <>
                                <EditableField 
                                  label="Fecha vencimiento" 
                                  initialValue={getInitialValue("fechaVencimiento", editDataSeguros.fechaVencimiento !== undefined ? editDataSeguros.fechaVencimiento : seguros.fechaVencimiento)} 
                                  fieldKey="fechaVencimiento"
                                  sectionKey={activeTab}
                                  isEditing={isEditing}
                                  onCommit={handleFieldCommit}
                                  type="date"
                                />
                                <EditableField 
                                  label="Fecha inicio" 
                                  initialValue={getInitialValue("fechaInicio", editDataSeguros.fechaInicio !== undefined ? editDataSeguros.fechaInicio : seguros.fechaInicio)} 
                                  fieldKey="fechaInicio"
                                  sectionKey={activeTab}
                                  isEditing={isEditing}
                                  onCommit={handleFieldCommit}
                                  type="date"
                                />
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    );

                  case "datos":
                    // Sección DATOS con todas las subsecciones
                    const seccionesDatos = [
                      {
                        id: "informacion-personal",
                        nombre: "Información Personal",
                        campos: [
                          { key: "nombre", label: "Nombre", type: "text", required: true },
                          { key: "segundoNombre", label: "2do Nombre", type: "text" },
                          { key: "apellido", label: "Apellido", type: "text", required: true },
                          { key: "segundoApellido", label: "2do Apellido", type: "text" },
                          { key: "fechaNacimiento", label: "Fecha Nacimiento", type: "date" },
                          { key: "tipoDocumento", label: "Tipo Documento", type: "select", options: tiposDocumento },
                          { key: "numeroDocumento", label: "N° Documento", type: "text" },
                          { key: "estadoCivil", label: "Estado Civil", type: "text" },
                          { key: "estado", label: "Estado", type: "text" },
                        ]
                      },
                      {
                        id: "informacion-familiar",
                        nombre: "Información Familiar",
                        campos: [
                          { key: "tieneHijos", label: "¿Tiene hijos?", type: "text" },
                          { key: "cantHijos", label: "Cant hijos", type: "number" },
                        ]
                      },
                      {
                        id: "ubicacion",
                        nombre: "Ubicación",
                        campos: [
                          { key: "direccion", label: "Dirección", type: "text" },
                          { key: "googleMaps", label: "Google Maps", type: "text" },
                        ]
                      },
                      {
                        id: "informacion-laboral",
                        nombre: "Información Laboral",
                        campos: [
                          { key: "ocupacion", label: "Ocupación", type: "text" },
                          { key: "cargo", label: "Cargo", type: "text" },
                          { key: "area", label: "Área", type: "select", options: areasDisponibles },
                          { key: "rol", label: "Rol", type: "select", options: rolesDisponibles },
                        ]
                      },
                      {
                        id: "seguros",
                        nombre: "Seguros",
                        campos: [
                          { key: "seguroVidaLey", label: "Seguro Vida Ley", type: "text" },
                          { key: "fechaVencimiento", label: "Fecha Vencimiento", type: "date" },
                          { key: "fechaInicio", label: "Fecha Inicio", type: "date" },
                        ]
                      },
                    ];

                    return (
                      <div>
                        {errorDatosSeccion && (
                          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded text-sm">
                            <p className="text-xs text-red-600">{errorDatosSeccion}</p>
                          </div>
                        )}
                        {seccionesDatos.map((seccion) => {
                          const datosSeccion = datosSecciones[seccion.id] || [];
                          
                          return (
                            <div key={seccion.id} className="mb-4">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-bold text-blue-800 uppercase border-b border-blue-200 pb-2">
                                  {seccion.nombre}
                                </h4>
                                <button
                                  onClick={() => {
                                    const nuevoItem = {};
                                    seccion.campos.forEach(campo => {
                                      nuevoItem[campo.key] = "";
                                    });
                                    nuevoItem.id = `temp-${Date.now()}-${Math.random()}`;
                                    nuevoItem.isNew = true;
                                    setDatosSecciones(prev => ({
                                      ...prev,
                                      [seccion.id]: [...(prev[seccion.id] || []), nuevoItem]
                                    }));
                                    setErrorDatosSeccion(null);
                                  }}
                                  disabled={savingDatosSeccion || loadingAreas}
                                  className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded text-xs font-semibold transition-all duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                  </svg>
                                  <span>Agregar</span>
                                </button>
                              </div>
                              <div className="space-y-3">
                                {datosSeccion.map((item, itemIndex) => {
                                    return (
                                    <div key={itemIndex} className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded p-3 shadow-sm relative">
                                      <div className="absolute top-2 right-2 flex items-center space-x-2 z-10">
                                        {item.id && !item.isNew ? (
                                          // Botón Actualizar para items existentes
                                          <button
                                            onClick={async () => {
                                              // Validar campos requeridos
                                              const camposRequeridos = seccion.campos.filter(c => c.required);
                                              const faltantes = camposRequeridos.filter(c => !item[c.key] || item[c.key] === "");
                                              if (faltantes.length > 0) {
                                                setErrorDatosSeccion(`Faltan campos requeridos: ${faltantes.map(c => c.label).join(", ")}`);
                                                return;
                                              }
                                              try {
                                                setSavingDatosSeccion(true);
                                                setErrorDatosSeccion(null);
                                                // TODO: Llamar a API para actualizar
                                                // await handleActualizarDatoSeccion(seccion.id, item.id, item);
                                                setNotification({
                                                  show: true,
                                                  message: "Datos actualizados exitosamente",
                                                  type: "success"
                                                });
                                                setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 3000);
                                              } catch (error) {
                                                setErrorDatosSeccion(error.message || "Error al actualizar");
                                              } finally {
                                                setSavingDatosSeccion(false);
                                              }
                                            }}
                                            disabled={savingDatosSeccion || loadingAreas}
                                            className="flex items-center space-x-1 px-2 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded text-xs font-semibold transition-colors shadow-sm disabled:cursor-not-allowed"
                                            title="Actualizar"
                                          >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span>Actualizar</span>
                                          </button>
                                        ) : (
                                          // Botón Guardar para items nuevos (no temporales)
                                          <button
                                            onClick={async () => {
                                              // Validar campos requeridos
                                              const camposRequeridos = seccion.campos.filter(c => c.required);
                                              const faltantes = camposRequeridos.filter(c => !item[c.key] || item[c.key] === "");
                                              if (faltantes.length > 0) {
                                                setErrorDatosSeccion(`Faltan campos requeridos: ${faltantes.map(c => c.label).join(", ")}`);
                                                return;
                                              }
                                              try {
                                                setSavingDatosSeccion(true);
                                                setErrorDatosSeccion(null);
                                                // TODO: Llamar a API para guardar
                                                // const nuevoId = await handleAgregarDatoSeccion(seccion.id, item);
                                                // Actualizar el item con el ID real
                                                const nuevosDatos = [...datosSeccion];
                                                nuevosDatos[itemIndex] = { ...item, id: `real-${Date.now()}`, isNew: false };
                                                setDatosSecciones(prev => ({
                                                  ...prev,
                                                  [seccion.id]: nuevosDatos
                                                }));
                                                setNotification({
                                                  show: true,
                                                  message: "Datos guardados exitosamente",
                                                  type: "success"
                                                });
                                                setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 3000);
                                              } catch (error) {
                                                setErrorDatosSeccion(error.message || "Error al guardar");
                                              } finally {
                                                setSavingDatosSeccion(false);
                                              }
                                            }}
                                            disabled={savingDatosSeccion || loadingAreas}
                                            className="flex items-center space-x-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded text-xs font-semibold transition-colors shadow-sm disabled:cursor-not-allowed"
                                            title="Guardar"
                                          >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span>Guardar</span>
                                          </button>
                                        )}
                                        <button
                                          onClick={() => {
                                            if (item.id && !item.isNew) {
                                              // TODO: Llamar a API para eliminar
                                              // handleEliminarDatoSeccion(seccion.id, item.id);
                                            }
                                            const nuevosDatos = datosSeccion.filter((_, idx) => idx !== itemIndex);
                                            setDatosSecciones(prev => ({
                                              ...prev,
                                              [seccion.id]: nuevosDatos
                                            }));
                                            setErrorDatosSeccion(null);
                                          }}
                                          disabled={savingDatosSeccion || loadingAreas}
                                          className="flex items-center space-x-1 px-2 py-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded text-xs font-semibold transition-colors shadow-sm disabled:cursor-not-allowed"
                                          title="Eliminar"
                                        >
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                          </svg>
                                          <span>Eliminar</span>
                                        </button>
                                      </div>
                                      <div className="grid grid-cols-2 gap-3 pr-32">
                                        {seccion.campos.map((campo) => (
                                          <div key={campo.key} className="flex flex-col">
                                            <label className="text-xs font-bold text-gray-700 mb-1">
                                              {campo.label}
                                              {campo.required && <span className="text-red-500 ml-1">*</span>}
                                            </label>
                                            {campo.type === "select" ? (
                                              <select
                                                value={item[campo.key] || ""}
                                                onChange={(e) => {
                                                  const nuevosDatos = [...datosSeccion];
                                                  nuevosDatos[itemIndex] = { ...nuevosDatos[itemIndex], [campo.key]: e.target.value };
                                                  setDatosSecciones(prev => ({
                                                    ...prev,
                                                    [seccion.id]: nuevosDatos
                                                  }));
                                                  setErrorDatosSeccion(null);
                                                }}
                                                className="text-xs text-gray-900 bg-white px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                              >
                                                <option value="">Seleccionar...</option>
                                                {campo.options?.map((opt) => (
                                                  <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                              </select>
                                            ) : (
                                              <input
                                                type={campo.type}
                                                value={item[campo.key] || ""}
                                                onChange={(e) => {
                                                  const nuevosDatos = [...datosSeccion];
                                                  nuevosDatos[itemIndex] = { ...nuevosDatos[itemIndex], [campo.key]: e.target.value };
                                                  setDatosSecciones(prev => ({
                                                    ...prev,
                                                    [seccion.id]: nuevosDatos
                                                  }));
                                                  setErrorDatosSeccion(null);
                                                }}
                                                placeholder={`Ingrese ${campo.label.toLowerCase()}`}
                                                className="text-xs text-gray-900 bg-white px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                              />
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    );
                                  })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );

                  case "correo":
                    // Renderizar la sección CORREO (solo medios de comunicación tipo CORREO)
                    const datosParaMostrar = datosEditables || [];
                    
                    // Filtrar y agrupar medios
                    const agrupados = {};
                    datosParaMostrar.forEach((item, idx) => {
                      if (item && typeof item === "object") {
                        const medio = getValue(item, ["MEDIO", "medio", "Medio"]) || "OTRO";
                        const tieneId = getValue(item, ["ID", "id", "Id"]);
                        const nombre = getValue(item, ["NOMBRE", "nombre", "Nombre"]) || "";
                        const contenido = getValue(item, ["CONTENIDO", "contenido", "Contenido"]) || "";
                        
                        // Mostrar CORREO siempre
                        // También mostrar otros medios si:
                        // - No tienen ID (son nuevos, aunque no tengan contenido aún)
                        // - Tienen contenido (están siendo editados)
                        // - Tienen nombre (están siendo editados)
                        const debeMostrar = medio === "CORREO" || !tieneId || nombre || contenido;
                        
                        if (debeMostrar) {
                          const tipo = getValue(item, ["TIPO", "tipo", "Tipo"]) || "";
                          
                          if (!agrupados[medio]) {
                            agrupados[medio] = [];
                          }
                          // Verificar que no esté ya en el array
                          const yaExiste = agrupados[medio].some(existing => existing.index === idx);
                          if (!yaExiste) {
                            agrupados[medio].push({
                              tipo,
                              nombre,
                              contenido,
                              medio,
                              index: idx,
                              originalItem: item,
                              ID: getValue(item, ["ID", "id", "Id"]),
                              id: getValue(item, ["ID", "id", "Id"])
                            });
                          }
                        }
                      }
                    });

                    // Si no hay datos, mostrar al menos la opción de agregar para CORREO
                    if (Object.keys(agrupados).length === 0) {
                      agrupados["CORREO"] = [];
                    }

                    return (
                      <div>
                        {loadingMedios && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Cargando...</span>
                          </div>
                        )}
                        {errorSavingDatos && (
                          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded text-sm">
                            <p className="text-xs text-red-600">{errorSavingDatos}</p>
                          </div>
                        )}
                        {Object.keys(agrupados).length > 0 ? (
                          Object.keys(agrupados).map((medio, medioIndex) => (
                            <div key={medioIndex} className="mb-4">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-bold text-blue-800 uppercase border-b border-blue-200 pb-2">
                                  {medio}
                                </h4>
                                <button
                                  onClick={() => {
                                    const nuevoItem = {
                                      TIPO: "",
                                      tipo: "",
                                      MEDIO: medio,
                                      medio: medio,
                                      NOMBRE: "",
                                      nombre: "",
                                      CONTENIDO: "",
                                      contenido: ""
                                    };
                                    const nuevosDatos = [...datosParaMostrar, nuevoItem];
                                    setDatosEditables(nuevosDatos);
                                    setErrorSavingDatos(null);
                                  }}
                                  disabled={savingDatos || loadingMedios}
                                  className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded text-xs font-semibold transition-all duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                  </svg>
                                  <span>Agregar</span>
                                </button>
                              </div>
                              <div className="space-y-3">
                                {agrupados[medio].map((item, itemIndex) => (
                                  <div key={itemIndex} className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded p-3 shadow-sm relative">
                                    <div className="absolute top-2 right-2 flex items-center space-x-2 z-10">
                                      {(() => {
                                        const medioId = item.ID || item.id || item.originalItem?.ID || item.originalItem?.id || datosParaMostrar[item.index]?.ID || datosParaMostrar[item.index]?.id;
                                        const itemActual = datosParaMostrar[item.index] || {};
                                        const tieneTodosLosCampos = (itemActual.tipo || itemActual.TIPO) && (itemActual.medio || itemActual.MEDIO) && (itemActual.nombre || itemActual.NOMBRE) && (itemActual.contenido || itemActual.CONTENIDO);
                                        
                                        if (medioId) {
                                          return (
                                            <button
                                              onClick={async () => {
                                                if (!tieneTodosLosCampos) {
                                                  setErrorSavingDatos("Todos los campos son requeridos");
                                                  return;
                                                }
                                                try {
                                                  await handleActualizarMedio(medioId, itemActual);
                                                  setErrorSavingDatos(null);
                                                } catch (error) {
                                                  // Error ya se muestra en errorSavingDatos
                                                }
                                              }}
                                              disabled={savingDatos || loadingMedios || !tieneTodosLosCampos}
                                              className="flex items-center space-x-1 px-2 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded text-xs font-semibold transition-colors shadow-sm disabled:cursor-not-allowed"
                                              title="Actualizar"
                                            >
                                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                              </svg>
                                              <span>Actualizar</span>
                                            </button>
                                          );
                                        } else {
                                          return (
                                            <button
                                              onClick={async () => {
                                                if (!tieneTodosLosCampos) {
                                                  setErrorSavingDatos("Todos los campos son requeridos");
                                                  return;
                                                }
                                                try {
                                                  await handleAgregarMedio(itemActual);
                                                  setErrorSavingDatos(null);
                                                } catch (error) {
                                                  // Error ya se muestra en errorSavingDatos
                                                }
                                              }}
                                              disabled={savingDatos || loadingMedios || !tieneTodosLosCampos}
                                              className="flex items-center space-x-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded text-xs font-semibold transition-colors shadow-sm disabled:cursor-not-allowed"
                                              title="Guardar"
                                            >
                                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                              </svg>
                                              <span>Guardar</span>
                                            </button>
                                          );
                                        }
                                      })()}
                                      
                                      <button
                                        onClick={async () => {
                                          const medioId = item.originalItem?.ID || item.originalItem?.id || datosParaMostrar[item.index]?.ID || datosParaMostrar[item.index]?.id;
                                          if (medioId) {
                                            try {
                                              await handleEliminarMedio(medioId);
                                              setErrorSavingDatos(null);
                                            } catch (error) {
                                              // Error ya se muestra en errorSavingDatos
                                            }
                                          } else {
                                            const nuevosDatos = datosParaMostrar.filter((_, idx) => idx !== item.index);
                                            setDatosEditables(nuevosDatos);
                                          }
                                        }}
                                        disabled={savingDatos || loadingMedios}
                                        className="flex items-center space-x-1 px-2 py-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded text-xs font-semibold transition-colors shadow-sm disabled:cursor-not-allowed"
                                        title="Eliminar"
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        <span>Eliminar</span>
                                      </button>
                                    </div>
                                    <div className="space-y-2 pr-32">
                                      <div className="flex items-start">
                                        <label className="text-xs font-bold text-gray-700 min-w-[70px] pt-1.5">Tipo:</label>
                                        <div className="flex-1 flex items-center space-x-3">
                                          <label className="flex items-center space-x-1.5 cursor-pointer">
                                            <input
                                              type="checkbox"
                                              checked={item.tipo === "CORPORATIVO" || item.tipo === "corporativo" || item.TIPO === "CORPORATIVO"}
                                              onChange={(e) => {
                                                const nuevosDatos = [...datosParaMostrar];
                                                const itemActual = nuevosDatos[item.index] || {};
                                                const nuevoTipo = e.target.checked ? "CORPORATIVO" : "";
                                                nuevosDatos[item.index] = {
                                                  ...itemActual,
                                                  TIPO: nuevoTipo,
                                                  tipo: nuevoTipo,
                                                  MEDIO: itemActual.MEDIO || itemActual.medio || item.medio || "TELEFONO",
                                                  medio: itemActual.medio || itemActual.MEDIO || item.medio || "TELEFONO"
                                                };
                                                setDatosEditables(nuevosDatos);
                                                setErrorSavingDatos(null);
                                              }}
                                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                            />
                                            <span className="text-xs text-gray-700">CORPORATIVO</span>
                                          </label>
                                          <label className="flex items-center space-x-1.5 cursor-pointer">
                                            <input
                                              type="checkbox"
                                              checked={item.tipo === "PERSONAL" || item.tipo === "personal" || item.TIPO === "PERSONAL"}
                                              onChange={(e) => {
                                                const nuevosDatos = [...datosParaMostrar];
                                                const itemActual = nuevosDatos[item.index] || {};
                                                const nuevoTipo = e.target.checked ? "PERSONAL" : "";
                                                nuevosDatos[item.index] = {
                                                  ...itemActual,
                                                  TIPO: nuevoTipo,
                                                  tipo: nuevoTipo,
                                                  MEDIO: itemActual.MEDIO || itemActual.medio || item.medio || "TELEFONO",
                                                  medio: itemActual.medio || itemActual.MEDIO || item.medio || "TELEFONO"
                                                };
                                                setDatosEditables(nuevosDatos);
                                                setErrorSavingDatos(null);
                                              }}
                                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                            />
                                            <span className="text-xs text-gray-700">PERSONAL</span>
                                          </label>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-start">
                                        <label className="text-xs font-bold text-gray-700 min-w-[70px] pt-1.5">Medio:</label>
                                        <div className="flex-1 flex items-center space-x-3">
                                          <label className="flex items-center space-x-1.5 cursor-pointer">
                                            <input
                                              type="radio"
                                              name={`medio-${item.index}`}
                                              checked={(item.medio === "TELEFONO" || item.MEDIO === "TELEFONO")}
                                              onChange={(e) => {
                                                const nuevosDatos = [...datosParaMostrar];
                                                const itemActual = nuevosDatos[item.index] || item.originalItem || {};
                                                nuevosDatos[item.index] = {
                                                  ...itemActual,
                                                  ...item.originalItem,
                                                  MEDIO: "TELEFONO",
                                                  medio: "TELEFONO",
                                                  nombre: itemActual.nombre || itemActual.NOMBRE || item.nombre || item.NOMBRE || "",
                                                  NOMBRE: itemActual.NOMBRE || itemActual.nombre || item.NOMBRE || item.nombre || "",
                                                  contenido: itemActual.contenido || itemActual.CONTENIDO || item.contenido || item.CONTENIDO || "",
                                                  CONTENIDO: itemActual.CONTENIDO || itemActual.contenido || item.CONTENIDO || item.contenido || "",
                                                  tipo: itemActual.tipo || itemActual.TIPO || item.tipo || item.TIPO || "",
                                                  TIPO: itemActual.TIPO || itemActual.tipo || item.TIPO || item.tipo || "",
                                                  ID: itemActual.ID || itemActual.id || item.ID || item.id,
                                                  id: itemActual.id || itemActual.ID || item.id || item.ID
                                                };
                                                setDatosEditables(nuevosDatos);
                                                setErrorSavingDatos(null);
                                              }}
                                              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500"
                                            />
                                            <span className="text-xs text-gray-700">TELEFONO</span>
                                          </label>
                                          <label className="flex items-center space-x-1.5 cursor-pointer">
                                            <input
                                              type="radio"
                                              name={`medio-${item.index}`}
                                              checked={(item.medio === "CORREO" || item.MEDIO === "CORREO")}
                                              onChange={(e) => {
                                                const nuevosDatos = [...datosParaMostrar];
                                                const itemActual = nuevosDatos[item.index] || item.originalItem || {};
                                                nuevosDatos[item.index] = {
                                                  ...itemActual,
                                                  ...item.originalItem,
                                                  MEDIO: "CORREO",
                                                  medio: "CORREO",
                                                  nombre: itemActual.nombre || itemActual.NOMBRE || item.nombre || item.NOMBRE || "",
                                                  NOMBRE: itemActual.NOMBRE || itemActual.nombre || item.NOMBRE || item.nombre || "",
                                                  contenido: itemActual.contenido || itemActual.CONTENIDO || item.contenido || item.CONTENIDO || "",
                                                  CONTENIDO: itemActual.CONTENIDO || itemActual.contenido || item.CONTENIDO || item.contenido || "",
                                                  tipo: itemActual.tipo || itemActual.TIPO || item.tipo || item.TIPO || "",
                                                  TIPO: itemActual.TIPO || itemActual.tipo || item.TIPO || item.tipo || "",
                                                  ID: itemActual.ID || itemActual.id || item.ID || item.id,
                                                  id: itemActual.id || itemActual.ID || item.id || item.ID
                                                };
                                                setDatosEditables(nuevosDatos);
                                                setErrorSavingDatos(null);
                                              }}
                                              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500"
                                            />
                                            <span className="text-xs text-gray-700">CORREO</span>
                                          </label>
                                          <label className="flex items-center space-x-1.5 cursor-pointer">
                                            <input
                                              type="radio"
                                              name={`medio-${item.index}`}
                                              checked={(item.medio === "TELEFONO_EMERGENCIA" || item.MEDIO === "TELEFONO_EMERGENCIA")}
                                              onChange={(e) => {
                                                const nuevosDatos = [...datosParaMostrar];
                                                const itemActual = nuevosDatos[item.index] || item.originalItem || {};
                                                nuevosDatos[item.index] = {
                                                  ...itemActual,
                                                  ...item.originalItem,
                                                  MEDIO: "TELEFONO_EMERGENCIA",
                                                  medio: "TELEFONO_EMERGENCIA",
                                                  nombre: itemActual.nombre || itemActual.NOMBRE || item.nombre || item.NOMBRE || "",
                                                  NOMBRE: itemActual.NOMBRE || itemActual.nombre || item.NOMBRE || item.nombre || "",
                                                  contenido: itemActual.contenido || itemActual.CONTENIDO || item.contenido || item.CONTENIDO || "",
                                                  CONTENIDO: itemActual.CONTENIDO || itemActual.contenido || item.CONTENIDO || item.contenido || "",
                                                  tipo: itemActual.tipo || itemActual.TIPO || item.tipo || item.TIPO || "",
                                                  TIPO: itemActual.TIPO || itemActual.tipo || item.TIPO || item.tipo || "",
                                                  ID: itemActual.ID || itemActual.id || item.ID || item.id,
                                                  id: itemActual.id || itemActual.ID || item.id || item.ID
                                                };
                                                setDatosEditables(nuevosDatos);
                                                setErrorSavingDatos(null);
                                              }}
                                              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500"
                                            />
                                            <span className="text-xs text-gray-700">TELEFONO EMERGENCIA</span>
                                          </label>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-start">
                                        <label className="text-xs font-bold text-gray-700 min-w-[70px] pt-1.5">Nombre:</label>
                                        <input
                                          type="text"
                                          value={item.nombre || ""}
                                          onChange={(e) => {
                                            const nuevosDatos = [...datosParaMostrar];
                                            const itemActual = nuevosDatos[item.index] || {};
                                            nuevosDatos[item.index] = {
                                              ...itemActual,
                                              NOMBRE: e.target.value,
                                              nombre: e.target.value,
                                              MEDIO: itemActual.MEDIO || itemActual.medio || item.medio || "OTRO",
                                              medio: itemActual.medio || itemActual.MEDIO || item.medio || "OTRO"
                                            };
                                            setDatosEditables(nuevosDatos);
                                            setErrorSavingDatos(null);
                                          }}
                                          placeholder="Ej: CORREO PERSONAL 1"
                                          className="flex-1 text-xs text-gray-900 bg-white px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                      </div>
                                      <div className="flex items-start">
                                        <label className="text-xs font-bold text-gray-700 min-w-[70px] pt-1.5">Contenido:</label>
                                        <input
                                          type="text"
                                          value={item.contenido || ""}
                                          onChange={(e) => {
                                            const nuevosDatos = [...datosParaMostrar];
                                            const itemActual = nuevosDatos[item.index] || {};
                                            nuevosDatos[item.index] = {
                                              ...itemActual,
                                              CONTENIDO: e.target.value,
                                              contenido: e.target.value,
                                              MEDIO: itemActual.MEDIO || itemActual.medio || item.medio || "TELEFONO",
                                              medio: itemActual.medio || itemActual.MEDIO || item.medio || "TELEFONO"
                                            };
                                            setDatosEditables(nuevosDatos);
                                            setErrorSavingDatos(null);
                                          }}
                                          placeholder={
                                            (item.medio === "CORREO" || item.MEDIO === "CORREO") 
                                              ? "Ej: correo@ejemplo.com" 
                                              : (item.medio === "TELEFONO_EMERGENCIA" || item.MEDIO === "TELEFONO_EMERGENCIA")
                                              ? "Ej: 987654321"
                                              : "Ej: 956224010"
                                          }
                                          className="flex-1 text-xs font-semibold text-blue-900 bg-white px-3 py-2 rounded border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent break-all"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 italic">No hay datos de medios de comunicación registrados. Haz clic en "Agregar" para comenzar.</p>
                        )}
                      </div>
                    );

                  default:
                    return <div>Tab no encontrado</div>;
                }
              };

              return renderTabContent();
            })()}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Agregar Colaborador */}
      <Modal
        isOpen={isAgregarColaboradorModalOpen}
        onClose={() => {
          setIsAgregarColaboradorModalOpen(false);
          setIsAreaSelectOpen(false);
          setNewColaboradorForm({
            nombre: "",
            apellido: "",
            areaPrincipal: "",
          });
        }}
        title="Agregar Nuevo Colaborador"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newColaboradorForm.nombre}
              onChange={(e) => setNewColaboradorForm({ ...newColaboradorForm, nombre: e.target.value })}
              placeholder="Nombre"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 placeholder:text-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Apellido <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newColaboradorForm.apellido}
              onChange={(e) => setNewColaboradorForm({ ...newColaboradorForm, apellido: e.target.value })}
              placeholder="Apellido"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 placeholder:text-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Área Principal <span className="text-red-500">*</span>
            </label>
            <div className="relative area-select-container" ref={areaSelectRef}>
              <button
                type="button"
                onClick={() => !loadingAreas && setIsAreaSelectOpen(!isAreaSelectOpen)}
                disabled={loadingAreas}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-left flex items-center justify-between transition-all duration-200 hover:border-gray-400 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed disabled:border-gray-300 shadow-sm bg-white ${
                  isAreaSelectOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''
                }`}
              >
                <span className={newColaboradorForm.areaPrincipal ? 'text-gray-900' : 'text-gray-500'}>
                  {newColaboradorForm.areaPrincipal
                    ? areasDisponibles.find(a => (a.id || a.ID) == newColaboradorForm.areaPrincipal)?.nombre || areasDisponibles.find(a => (a.id || a.ID) == newColaboradorForm.areaPrincipal)?.NOMBRE || 'Seleccione un área'
                    : 'Seleccione un área'}
                </span>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                    isAreaSelectOpen ? 'transform rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isAreaSelectOpen && !loadingAreas && (
                <div
                  className="area-dropdown fixed z-[10000] bg-white shadow-xl rounded-lg border border-gray-200 overflow-hidden"
                  style={{
                    top: `${dropdownPosition.top}px`,
                    left: `${dropdownPosition.left}px`,
                    width: `${dropdownPosition.width}px`,
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                  }}
                >
                  <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                    {areasDisponibles.length > 0 ? (
                      areasDisponibles.map((area) => {
                        const areaId = area.id || area.ID;
                        const areaNombre = area.nombre || area.NOMBRE;
                        const isSelected = newColaboradorForm.areaPrincipal == areaId;
                        
                        return (
                          <button
                            key={areaId}
                            type="button"
                            onClick={() => {
                              setNewColaboradorForm({ ...newColaboradorForm, areaPrincipal: String(areaId) });
                              setIsAreaSelectOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm transition-all duration-150 rounded-md ${
                              isSelected
                                ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                                : 'text-gray-900 hover:bg-gray-50'
                            }`}
                          >
                            {areaNombre}
                          </button>
                        );
                      })
                    ) : (
                      <div className="px-3 py-2 text-xs text-gray-500 text-center">
                        No hay áreas disponibles
                      </div>
                    )}
                  </div>
                </div>
              )}

              {loadingAreas && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>
            {loadingAreas && (
              <p className="mt-1.5 text-xs text-gray-500 flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Cargando áreas...
              </p>
            )}
          </div>
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setIsAgregarColaboradorModalOpen(false);
                setNewColaboradorForm({
                  nombre: "",
                  apellido: "",
                  areaPrincipal: "",
                });
              }}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={async () => {
                // Validar campos requeridos
                if (!newColaboradorForm.nombre || !newColaboradorForm.apellido || !newColaboradorForm.areaPrincipal) {
                  alert("Por favor, complete todos los campos requeridos");
                  return;
                }

                try {
                  setLoadingAgregarColaborador(true);
                  const token = localStorage.getItem("token");
                  if (!token) {
                    throw new Error("No se encontró el token de autenticación");
                  }

                  const response = await fetch(
                    `https://colaboradores2026-2946605267.us-central1.run.app?metodo=agregar_colaborador`,
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "Authorization": `Bearer ${token}`,
                      },
                      body: JSON.stringify({
                        nombre: newColaboradorForm.nombre,
                        apellido: newColaboradorForm.apellido,
                        area_principal: parseInt(newColaboradorForm.areaPrincipal),
                      }),
                    }
                  );

                  if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: "Error desconocido" }));
                    throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
                  }

                  const data = await response.json();
                  console.log("Colaborador agregado exitosamente:", data);
                  
                  // Mostrar notificación de éxito
                  setNotification({
                    show: true,
                    message: "Colaborador agregado exitosamente",
                    type: "success"
                  });
                  
                  // Cerrar modal y resetear formulario
                  setIsAgregarColaboradorModalOpen(false);
                  setNewColaboradorForm({
                    nombre: "",
                    apellido: "",
                    areaPrincipal: "",
                  });

                  // Recargar la lista de colaboradores
                  fetchColaboradores();
                  
                  // Ocultar notificación después de 3 segundos
                  setTimeout(() => {
                    setNotification({ show: false, message: "", type: "success" });
                  }, 3000);
                } catch (error) {
                  console.error("Error al agregar colaborador:", error);
                  // Mostrar notificación de error
                  setNotification({
                    show: true,
                    message: `Error al agregar colaborador: ${error.message}`,
                    type: "error"
                  });
                  // Ocultar notificación después de 4 segundos
                  setTimeout(() => {
                    setNotification({ show: false, message: "", type: "error" });
                  }, 4000);
                } finally {
                  setLoadingAgregarColaborador(false);
                }
              }}
              disabled={loadingAgregarColaborador}
              className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-br from-blue-700 to-blue-800 hover:shadow-md hover:scale-105 rounded-lg transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingAgregarColaborador ? "Agregando..." : "Agregar Colaborador"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Ver/Insertar Imagen */}
      <Modal
        isOpen={isImagenModalOpen}
        onClose={() => {
          setIsImagenModalOpen(false);
          setSelectedColaboradorImagen(null);
          setImagenPreview(null);
          setImagenActualGuardada(null);
          setSelectedImageFile(null);
        }}
        title={selectedColaboradorImagen ? `Imagen de ${selectedColaboradorImagen?.nombre || selectedColaboradorImagen?.NOMBRE || ""} ${selectedColaboradorImagen?.apellido || selectedColaboradorImagen?.APELLIDO || ""}` : "Imagen del Colaborador"}
        size="md"
      >
        {selectedColaboradorImagen && (
          <div className="space-y-8">
            {/* Imagen Actual - Solo mostrar si hay imagen guardada en BD (no preview de archivo nuevo) */}
            {imagenActualGuardada && !selectedImageFile && (
              <div className="bg-gradient-to-br from-slate-50 to-gray-50 border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
                  <h3 className="text-base font-semibold text-gray-800 tracking-tight">Imagen Actual</h3>
                </div>
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative w-full max-w-lg bg-white rounded-xl p-4 shadow-inner border border-gray-100">
                    <img 
                      src={imagenActualGuardada} 
                      alt="Imagen actual" 
                      className="w-full h-auto max-h-72 object-contain rounded-lg"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                  <a
                    href={imagenActualGuardada}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 px-4 py-2 text-xs font-medium text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>Ver Imagen Actual</span>
                  </a>
                </div>
              </div>
            )}

            {/* Subir Nueva Imagen */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-1 h-5 bg-gradient-to-b from-green-500 to-green-600 rounded-full"></div>
                <h3 className="text-base font-semibold text-gray-800 tracking-tight">Subir Nueva Imagen</h3>
              </div>
              {selectedImageFile && imagenPreview ? (
                <div className="space-y-4">
                  <div className="relative w-full max-w-lg mx-auto bg-white rounded-xl p-4 shadow-inner border border-gray-200">
                    <div className="relative h-56 rounded-lg overflow-hidden bg-gray-50">
                      <img 
                        src={imagenPreview} 
                        alt="Vista previa" 
                        className="w-full h-full object-contain"
                      />
                      <button
                        onClick={() => {
                          setSelectedImageFile(null);
                          setImagenPreview(null); // Limpiar preview para que se muestre imagenActualGuardada
                          const input = document.getElementById('imagen-input');
                          if (input) input.value = '';
                        }}
                        className="absolute top-3 right-3 p-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-red-50 hover:border-red-300 hover:text-red-600 shadow-md"
                        title="Eliminar imagen seleccionada"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-800 mb-1">Archivo seleccionado</p>
                        <p className="text-xs text-gray-600 truncate mb-1">{selectedImageFile?.name}</p>
                        <p className="text-xs text-gray-500">Tamaño: {(selectedImageFile?.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const input = document.getElementById('imagen-input');
                      if (input) input.click();
                    }}
                    className="w-full max-w-lg mx-auto px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 shadow-sm"
                  >
                    Cambiar Imagen
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="imagen-input"
                  className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gradient-to-br from-gray-50 to-white hover:from-blue-50 hover:to-indigo-50 hover:border-blue-400 transition-all duration-200"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Hacer clic para seleccionar archivo</span>
                    </p>
                    <p className="text-xs text-gray-500">JPG, PNG, GIF (MAX. 10MB)</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // Validar tamaño (máximo 10MB)
                        if (file.size > 10 * 1024 * 1024) {
                          setNotification({
                            show: true,
                            message: "El archivo es demasiado grande. El tamaño máximo es 10MB.",
                            type: "error"
                          });
                          setTimeout(() => setNotification({ show: false, message: "", type: "error" }), 3000);
                          e.target.value = "";
                          return;
                        }
                        
                        setSelectedImageFile(file);
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          // Solo actualizar preview, NO tocar imagenActualGuardada
                          setImagenPreview(reader.result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                    id="imagen-input"
                  />
                </label>
              )}
            </div>

            {/* Botones de acción */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setIsImagenModalOpen(false);
                setSelectedColaboradorImagen(null);
                setImagenPreview(null);
                setImagenActualGuardada(null);
                setSelectedImageFile(null);
              }}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={async () => {
                if (!selectedImageFile) {
                  setNotification({
                    show: true,
                    message: "Por favor, selecciona una imagen para subir.",
                    type: "error"
                  });
                  setTimeout(() => setNotification({ show: false, message: "", type: "error" }), 3000);
                  return;
                }

                const colaboradorId = getColaboradorId(selectedColaboradorImagen);
                if (!colaboradorId) {
                  setNotification({
                    show: true,
                    message: "No se pudo obtener el ID del colaborador.",
                    type: "error"
                  });
                  setTimeout(() => setNotification({ show: false, message: "", type: "error" }), 3000);
                  return;
                }

                try {
                  setUploadingImage(true);
                  
                  // Crear FormData para enviar el archivo
                  const formData = new FormData();
                  formData.append('file', selectedImageFile);

                  // Subir archivo a la API de storage (usando no_encriptar como en productos)
                  const uploadResponse = await fetch(
                    `https://api-subida-archivos-2946605267.us-central1.run.app?bucket_name=archivos_colaboradores&folder_bucket=ZEUS_1&method=no_encriptar`,
                    {
                      method: 'POST',
                      body: formData,
                    }
                  );

                  if (!uploadResponse.ok) {
                    throw new Error(`Error al subir la imagen: ${uploadResponse.status}`);
                  }

                  const uploadData = await uploadResponse.json();
                  const imageUrl = uploadData.url;

                  if (!imageUrl) {
                    throw new Error("La API no devolvió la URL de la imagen");
                  }

                  console.log("URL de imagen recibida:", imageUrl);

                  // Guardar/actualizar en la base de datos
                  await guardarImagenColaborador(colaboradorId, imageUrl);

                  // Recargar la imagen actual desde el backend para mostrarla en el modal
                  const imagenActualizada = await fetchImagenColaborador(colaboradorId);
                  if (imagenActualizada) {
                    setImagenActualGuardada(imagenActualizada);
                    setImagenPreview(imagenActualizada);
                    console.log("Imagen actualizada cargada desde BD:", imagenActualizada);
                  } else {
                    // Si no se encuentra, usar la URL que acabamos de subir
                    setImagenActualGuardada(imageUrl);
                    setImagenPreview(imageUrl);
                  }

                  // Limpiar el archivo seleccionado para que el botón se deshabilite
                  setSelectedImageFile(null);

                  // Recargar la lista de colaboradores para obtener los datos actualizados
                  await fetchColaboradores();

                  setNotification({
                    show: true,
                    message: "Imagen subida y guardada exitosamente.",
                    type: "success"
                  });
                  setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 3000);

                  // NO cerrar el modal automáticamente - dejar que el usuario vea la imagen guardada
                  // El usuario puede cerrarlo manualmente con el botón Cancelar o la X
                } catch (error) {
                  console.error("Error al subir imagen:", error);
                  setNotification({
                    show: true,
                    message: `Error al subir la imagen: ${error.message}`,
                    type: "error"
                  });
                  setTimeout(() => setNotification({ show: false, message: "", type: "error" }), 5000);
                } finally {
                  setUploadingImage(false);
                }
              }}
              disabled={!selectedImageFile || uploadingImage}
              className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-br from-purple-500 to-purple-600 hover:shadow-md hover:scale-105 rounded-lg transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadingImage ? "Subiendo..." : "Guardar Imagen"}
            </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Notificación Toast */}
      {notification.show && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg shadow-xl border-2 ${
            notification.type === "success" 
              ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-300" 
              : "bg-gradient-to-r from-red-50 to-rose-50 border-red-300"
          } min-w-[320px] max-w-md`}>
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
              notification.type === "success" 
                ? "bg-green-500" 
                : "bg-red-500"
            }`}>
              {notification.type === "success" ? (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <p className={`text-sm font-semibold ${
                notification.type === "success" 
                  ? "text-green-800" 
                  : "text-red-800"
              }`}>
                {notification.message}
              </p>
            </div>
            <button
              onClick={() => setNotification({ show: false, message: "", type: notification.type })}
              className={`flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors ${
                notification.type === "success" 
                  ? "hover:text-green-600" 
                  : "hover:text-red-600"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GestionColaboradoresPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    }>
      <GestionColaboradoresContent />
    </Suspense>
  );
}

