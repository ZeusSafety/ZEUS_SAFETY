"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/context/AuthContext";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";
import Modal from "../../../components/ui/Modal";

export default function ColaboradoresPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageInactivos, setCurrentPageInactivos] = useState(1);
  const itemsPerPage = 5;
  const [isPermisosModalOpen, setIsPermisosModalOpen] = useState(false);
  const [isDesactivarModalOpen, setIsDesactivarModalOpen] = useState(false);
  const [isAgregarModalOpen, setIsAgregarModalOpen] = useState(false);
  const [isVerDetallesModalOpen, setIsVerDetallesModalOpen] = useState(false);
  const [isEliminarSubVistaModalOpen, setIsEliminarSubVistaModalOpen] = useState(false);
  const [subVistaAEliminar, setSubVistaAEliminar] = useState(null);
  const [selectedColaborador, setSelectedColaborador] = useState(null);
  const [selectedColaboradorCompleto, setSelectedColaboradorCompleto] = useState(null);
  const [datosEditables, setDatosEditables] = useState([]);

  // Inicializar datosEditables cuando se abre el modal
  useEffect(() => {
    if (isVerDetallesModalOpen && selectedColaboradorCompleto) {
      const getValue = (obj, keys) => {
        for (const key of keys) {
          if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
            return obj[key];
          }
        }
        return null;
      };
      
      const datosField = getValue(selectedColaboradorCompleto, ["DATOS", "datos", "Datos"]);
      let datosArray = null;
      
      if (typeof datosField === "string") {
        try {
          datosArray = JSON.parse(datosField);
        } catch (e) {
          console.error("Error al parsear DATOS:", e);
        }
      } else if (Array.isArray(datosField)) {
        datosArray = datosField;
      }
      
      if (datosArray && Array.isArray(datosArray)) {
        setDatosEditables(datosArray);
      } else {
        setDatosEditables([]);
      }
    } else {
      setDatosEditables([]);
    }
  }, [isVerDetallesModalOpen, selectedColaboradorCompleto]);
  const [newColaboradorForm, setNewColaboradorForm] = useState({
    id_colaborador: null,
    nombre: "",
    apellido: "",
    area: "",
    usuario: "",
    contraseña: "",
  });
  
  // Estados para datos de la API
  const [colaboradores, setColaboradores] = useState([]);
  const [colaboradoresCompletos, setColaboradoresCompletos] = useState([]); // Datos originales de la API
  const [loadingColaboradores, setLoadingColaboradores] = useState(true);
  const [errorColaboradores, setErrorColaboradores] = useState(null);

  // Estados para el modal de permisos (diseño tipo tablero)
  const [modulosPermisos, setModulosPermisos] = useState([]);
  const [subVistasPermitidas, setSubVistasPermitidas] = useState([]);
  const [subVistasDisponibles, setSubVistasDisponibles] = useState([]);
  const [loadingPermisos, setLoadingPermisos] = useState(false);

  const [filtroAreaSubVista, setFiltroAreaSubVista] = useState("TODAS");
  const [busquedaSubVista, setBusquedaSubVista] = useState("");
  const [notification, setNotification] = useState({ show: false, message: "", type: "success" }); // success, error

  const togglePermisoModulo = (id) => {
    setModulosPermisos((prev) =>
      prev.map((mod) =>
        mod.id === id ? { ...mod, permitido: !mod.permitido } : mod
      )
    );
  };

  // Función para insertar una subvista
  const insertarSubVista = async (userId, subVistaId) => {
    try {
      const url = new URL('https://api-login-accesos-2946605267.us-central1.run.app');
      url.searchParams.append('metodo', 'insertar_subvista');
      url.searchParams.append('user', userId);

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          id_sub_vista: subVistaId
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || `Error ${response.status}: ${response.statusText}` };
        }
        throw new Error(errorData.error || errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error al insertar subvista:", error);
      throw error;
    }
  };

  // Función para eliminar una subvista
  const eliminarSubVista = async (userId, subVistaId) => {
    try {
      const url = new URL('https://api-login-accesos-2946605267.us-central1.run.app');
      url.searchParams.append('metodo', 'eliminar_subvista');
      url.searchParams.append('user', userId);

      const response = await fetch(url.toString(), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          id_sub_vista: subVistaId
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || `Error ${response.status}: ${response.statusText}` };
        }
        throw new Error(errorData.error || errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error al eliminar subvista:", error);
      throw error;
    }
  };

  const handleAgregarSubVista = async (id) => {
    if (!selectedColaborador || !selectedColaborador.usuario) {
      console.error("❌ Error: No se pudo identificar el usuario del colaborador", selectedColaborador);
      setNotification({
        show: true,
        message: "Error: No se pudo identificar el usuario del colaborador",
        type: "error"
      });
      setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 3000);
      return;
    }

    const nombreUsuario = selectedColaborador.usuario;
    const vista = subVistasDisponibles.find((v) => v.id === id);
    if (!vista) {
      console.error("❌ Error: No se encontró la vista con id", id);
      return;
    }

    console.log("➕ Agregando subvista:", {
      nombreUsuario,
      subVistaId: id,
      vistaNombre: vista.nombre
    });

    try {
      await insertarSubVista(nombreUsuario, id);
      
      // Actualizar estados localmente
      setSubVistasDisponibles((prevDisponibles) => prevDisponibles.filter((v) => v.id !== id));
      setSubVistasPermitidas((prevPermitidas) => [...prevPermitidas, vista]);
      
      // Mostrar notificación de éxito
      setNotification({
        show: true,
        message: "Subvista agregada exitosamente",
        type: "success"
      });
      setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 3000);
    } catch (error) {
      console.error("Error al agregar subvista:", error);
      setNotification({
        show: true,
        message: `Error al agregar subvista: ${error.message}`,
        type: "error"
      });
      setTimeout(() => setNotification({ show: false, message: "", type: "error" }), 4000);
    }
  };

  const handleEliminarSubVistaClick = (id) => {
    const vista = subVistasPermitidas.find((v) => v.id === id);
    if (vista) {
      setSubVistaAEliminar(vista);
      setIsEliminarSubVistaModalOpen(true);
    }
  };

  const handleConfirmarEliminarSubVista = async () => {
    if (!subVistaAEliminar || !selectedColaborador || !selectedColaborador.usuario) {
      setNotification({
        show: true,
        message: "Error: No se pudo identificar el usuario del colaborador",
        type: "error"
      });
      setTimeout(() => setNotification({ show: false, message: "", type: "error" }), 3000);
      setIsEliminarSubVistaModalOpen(false);
      setSubVistaAEliminar(null);
      return;
    }

    const nombreUsuario = selectedColaborador.usuario;
    const id = subVistaAEliminar.id;

    console.log("➖ Eliminando subvista:", {
      nombreUsuario,
      subVistaId: id,
      vistaNombre: subVistaAEliminar.nombre
    });

    try {
      await eliminarSubVista(nombreUsuario, id);
      
      // Actualizar estados localmente
      setSubVistasPermitidas((prevPermitidas) => prevPermitidas.filter((v) => v.id !== id));
      setSubVistasDisponibles((prevDisponibles) => [...prevDisponibles, subVistaAEliminar]);
      
      // Mostrar notificación de éxito
      setNotification({
        show: true,
        message: "Subvista eliminada exitosamente",
        type: "success"
      });
      setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 3000);
      
      // Cerrar modal y limpiar estado
      setIsEliminarSubVistaModalOpen(false);
      setSubVistaAEliminar(null);
    } catch (error) {
      console.error("Error al eliminar subvista:", error);
      setNotification({
        show: true,
        message: `Error al eliminar subvista: ${error.message}`,
        type: "error"
      });
      setTimeout(() => setNotification({ show: false, message: "", type: "error" }), 4000);
      setIsEliminarSubVistaModalOpen(false);
      setSubVistaAEliminar(null);
    }
  };

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

  // Obtener datos de perfil (usuario / contraseña / avatar) desde la API de perfil
  const fetchPerfilColaborador = useCallback(
    async (colaboradorBasico, colaboradorCompleto) => {
      try {
        setLoadingPerfilColaborador(true);
        setErrorPerfilColaborador(null);
        setPerfilColaborador(null);

        if (typeof window === "undefined") {
          throw new Error("La carga de perfil solo se ejecuta en el cliente");
        }

        const token = localStorage.getItem("token");
        if (!token || token.trim() === "") {
          throw new Error("No se encontró el token de autenticación");
        }

        const baseObj = colaboradorCompleto || colaboradorBasico || {};

        const getValue = (obj, keys) => {
          if (!obj) return "";
          for (const key of keys) {
            if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
              return obj[key];
            }
            const upperKey = key.toUpperCase();
            if (
              obj[upperKey] !== undefined &&
              obj[upperKey] !== null &&
              obj[upperKey] !== ""
            ) {
              return obj[upperKey];
            }
          }
          return "";
        };

        const correoBase = getValue(baseObj, [
          "correo",
          "CORREO",
          "email",
          "EMAIL",
          "correo_electronico",
          "CORREO_ELECTRONICO",
        ]);
        const usuarioBase = getValue(baseObj, [
          "usuario",
          "USUARIO",
          "username",
          "USERNAME",
          "login",
          "LOGIN",
        ]);

        let userParam = "";
        if (correoBase && String(correoBase).includes("@")) {
          userParam = String(correoBase).trim();
        } else if (usuarioBase) {
          userParam = String(usuarioBase).trim();
        } else if (baseObj.id || baseObj.ID) {
          userParam = String(baseObj.id || baseObj.ID);
        } else if (baseObj.nombre || baseObj.NOMBRE) {
          userParam = String(baseObj.nombre || baseObj.NOMBRE);
        }

        console.log("🔍 [PERFIL COLABORADOR] Obteniendo perfil para:", {
          colaboradorBasico,
          colaboradorCompleto,
          correoBase,
          usuarioBase,
          userParam,
        });

        if (!userParam) {
          throw new Error(
            "No se pudo determinar un identificador de usuario para consultar el perfil"
          );
        }

        const apiUrl = `https://colaboradores2026-2946605267.us-central1.run.app?method=perfil_usuario_2026&user=${encodeURIComponent(
          userParam
        )}`;

        console.log("🌐 [PERFIL COLABORADOR] URL:", apiUrl);

        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("🌐 [PERFIL COLABORADOR] Status:", response.status);

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error("Token inválido o expirado al consultar el perfil");
          }
          const errorText = await response.text().catch(() => "");
          throw new Error(
            `Error ${response.status} al obtener perfil: ${
              errorText || "Respuesta no válida"
            }`
          );
        }

        let data;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          data = await response.json();
        } else {
          const textData = await response.text();
          try {
            data = JSON.parse(textData);
          } catch {
            throw new Error("La respuesta de perfil no es un JSON válido");
          }
        }

        console.log(
          "📦 [PERFIL COLABORADOR] Datos crudos:",
          JSON.stringify(data, null, 2)
        );

        let perfilUsuario = null;
        if (data && typeof data === "object") {
          if (data.data && typeof data.data === "object" && !Array.isArray(data.data)) {
            perfilUsuario = data.data;
          } else if (data.perfil && typeof data.perfil === "object") {
            perfilUsuario = data.perfil;
          } else if (
            data.perfil_usuario &&
            typeof data.perfil_usuario === "object"
          ) {
            perfilUsuario = data.perfil_usuario;
          } else if (data.usuario && typeof data.usuario === "object") {
            perfilUsuario = data.usuario;
          } else if (data.user && typeof data.user === "object") {
            perfilUsuario = data.user;
          } else if (Array.isArray(data) && data.length > 0) {
            perfilUsuario = data[0];
          } else if (!Array.isArray(data)) {
            perfilUsuario = data;
          }
        }

        console.log(
          "✅ [PERFIL COLABORADOR] Perfil extraído:",
          JSON.stringify(perfilUsuario, null, 2)
        );

        if (!perfilUsuario) {
          throw new Error("La API de perfil no devolvió información del usuario");
        }

        const getValPerfil = (keys) => getValue(perfilUsuario, keys);

        const usuarioPerfil =
          getValPerfil([
            "usuario",
            "USUARIO",
            "username",
            "USERNAME",
            "login",
            "LOGIN",
          ]) ||
          getValPerfil(["correo", "CORREO", "email", "EMAIL"]) ||
          userParam;

        const correoPerfil = getValPerfil([
          "correo",
          "CORREO",
          "email",
          "EMAIL",
          "correo_electronico",
          "CORREO_ELECTRONICO",
        ]);

        const passwordPerfil = getValPerfil([
          "password",
          "PASSWORD",
          "contrasena",
          "CONTRASENA",
          "clave",
          "CLAVE",
        ]);

        const imgUrlPerfil = getValPerfil([
          "IMG_URL",
          "img_url",
          "IMGURL",
          "imgUrl",
          "IMAGEN",
          "imagen",
          "IMAGEN_URL",
          "imagen_url",
          "FOTO",
          "foto",
          "FOTO_URL",
          "foto_url",
          "AVATAR",
          "avatar",
          "AVATAR_URL",
          "avatar_url",
        ]);

        const perfilNormalizado = {
          usuario: usuarioPerfil || "",
          correo: correoPerfil || "",
          password: passwordPerfil || "",
          imgUrl: imgUrlPerfil || "",
        };

        console.log(
          "🎯 [PERFIL COLABORADOR] Perfil normalizado:",
          perfilNormalizado
        );

        setPerfilColaborador(perfilNormalizado);
      } catch (error) {
        console.error("[PERFIL COLABORADOR] Error:", error);
        setErrorPerfilColaborador(
          error.message || "Error al obtener el perfil del colaborador"
        );
      } finally {
        setLoadingPerfilColaborador(false);
      }
    },
    []
  );

  // Función para obtener colaboradores de la API
  const fetchColaboradores = useCallback(async () => {
    try {
      setLoadingColaboradores(true);
      setErrorColaboradores(null);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No se encontró el token de autenticación");
      }

      const response = await fetch("https://colaboradores2026-2946605267.us-central1.run.app?method=colaboradores_gerencia_listado", {
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
      console.log("Primer colaborador de ejemplo:", data && Array.isArray(data) && data.length > 0 ? data[0] : "No hay datos");
      
      // Buscar colaboradores recién agregados (Jhan Pier Sambos y Pilsen Pier)
      if (Array.isArray(data)) {
        const colaboradoresRecientes = data.filter(c => {
          const nombre = (c.NOMBRE || c.nombre || c.Nombre || c.name || c.NAME || "").toUpperCase();
          const apellido = (c.APELLIDO || c.apellido || c.Apellido || c.apellidos || c.APELLIDOS || c.lastname || c.LASTNAME || "").toUpperCase();
          return (nombre.includes("JHAN") && apellido.includes("SAMBOS")) ||
                 (nombre.includes("PILSEN") && apellido.includes("PIER"));
        });
        
        if (colaboradoresRecientes.length > 0) {
          colaboradoresRecientes.forEach((colab, idx) => {
            console.log(`🔍 Colaborador recién agregado ${idx + 1}:`, {
              nombre: colab.NOMBRE || colab.nombre || colab.Nombre || colab.name || colab.NAME,
              apellido: colab.APELLIDO || colab.apellido || colab.Apellido || colab.apellidos || colab.APELLIDOS || colab.lastname || colab.LASTNAME,
              objetoCompleto: colab,
              camposUsuario: Object.keys(colab).filter(k => 
                k.toLowerCase().includes('usuario') || 
                k.toLowerCase().includes('user') || 
                k.toLowerCase().includes('login')
              ).reduce((acc, key) => {
                acc[key] = {
                  valor: colab[key],
                  tipo: typeof colab[key],
                  esNull: colab[key] === null,
                  esUndefined: colab[key] === undefined,
                  esVacio: colab[key] === "",
                  esStringVacio: typeof colab[key] === "string" && colab[key].trim() === ""
                };
                return acc;
              }, {}),
              todosLosCampos: Object.keys(colab)
            });
          });
        } else {
          console.log("⚠️ No se encontró Jhan Pier Sambos o Pilsen Pier en la respuesta de la API");
        }
      }

      // Guardar los datos originales completos
      setColaboradoresCompletos(Array.isArray(data) ? data : []);

      // Mapear los datos de la API al formato esperado
      // La API puede devolver diferentes estructuras, así que intentamos varias opciones
      const colaboradoresMapeados = Array.isArray(data) ? data.map((colab, index) => {
        // Intentar obtener los campos con diferentes nombres posibles
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
            // Intentar parsear diferentes formatos de fecha
            const fecha = new Date(fechaNac);
            if (!isNaN(fecha.getTime())) {
              const dia = String(fecha.getDate()).padStart(2, "0");
              const mes = String(fecha.getMonth() + 1).padStart(2, "0");
              const año = fecha.getFullYear();
              fechaFormateada = `${dia}/${mes}/${año}`;
            } else {
              // Si ya está en formato DD/MM/YYYY, usarlo directamente
              fechaFormateada = fechaNac;
            }
          } catch (e) {
            fechaFormateada = fechaNac;
          }
        }

        // Obtener área - puede estar en un objeto anidado o como AREA_PRINCIPAL (ID)
        let areaValue = getValue(colab, ["area", "AREA", "Area", "departamento", "DEPARTAMENTO", "department", "DEPARTMENT", "AREA_PRINCIPAL", "area_principal"]);
        if (!areaValue && colab.A && colab.A.NOMBRE) {
          areaValue = colab.A.NOMBRE;
        }
        if (!areaValue && colab.a && colab.a.nombre) {
          areaValue = colab.a.nombre;
        }
        // Buscar en objetos anidados con diferentes estructuras
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
        // Si areaValue es un número (ID de área), mantenerlo como está por ahora
        // El backend debería devolver el nombre del área, pero si solo viene el ID, lo mostramos

        // Determinar si está activo
        const estadoValue = getValue(colab, ["activo", "ACTIVO", "Activo", "estado", "ESTADO", "status", "STATUS"]);
        const isActivo = estadoValue !== false && 
                        estadoValue !== "inactivo" && 
                        estadoValue !== "INACTIVO" && 
                        estadoValue !== 0 &&
                        estadoValue !== "0";

        // Obtener usuario - puede venir como null, undefined, o no existir
        // IMPORTANTE: Si el colaborador no tiene credenciales, el campo puede venir como null, undefined, o string vacío
        const usuarioRaw = getValue(colab, ["USUARIO", "usuario", "Usuario", "username", "USERNAME", "login", "LOGIN"]);
        
        // Verificar explícitamente si el valor es null, undefined, o string vacío
        let usuarioFinal = "";
        if (usuarioRaw !== null && usuarioRaw !== undefined && usuarioRaw !== "") {
          const usuarioStr = String(usuarioRaw).trim();
          if (usuarioStr !== "" && usuarioStr !== "null" && usuarioStr !== "undefined") {
            usuarioFinal = usuarioStr;
          }
        }
        
        // Log para depuración de TODOS los colaboradores para encontrar los sin usuario
        console.log(`🔍 Colaborador ${index} (${getValue(colab, ["NOMBRE", "nombre", "Nombre", "name", "NAME"])} ${getValue(colab, ["APELLIDO", "apellido", "Apellido", "apellidos", "APELLIDOS", "lastname", "LASTNAME"])}):`, {
          nombre: getValue(colab, ["NOMBRE", "nombre", "Nombre", "name", "NAME"]),
          apellido: getValue(colab, ["APELLIDO", "apellido", "Apellido", "apellidos", "APELLIDOS", "lastname", "LASTNAME"]),
          usuarioRaw: usuarioRaw,
          usuarioRawType: typeof usuarioRaw,
          usuarioRawValue: JSON.stringify(usuarioRaw),
          usuarioFinal: usuarioFinal,
          usuarioFinalType: typeof usuarioFinal,
          usuarioFinalLength: usuarioFinal.length,
          tieneUsuario: usuarioFinal !== "",
          // Mostrar todos los campos relacionados con usuario del objeto original
          camposUsuario: Object.keys(colab).filter(k => 
            k.toLowerCase().includes('usuario') || 
            k.toLowerCase().includes('user') || 
            k.toLowerCase().includes('login')
          ).reduce((acc, key) => {
            acc[key] = colab[key];
            return acc;
          }, {}),
          objetoCompleto: colab
        });

        return {
          id: getValue(colab, ["ID_PERSONA", "id", "ID", "Id"]) || Math.random().toString(36).substr(2, 9), // Generar ID temporal si no existe
          nombre: getValue(colab, ["NOMBRE", "nombre", "Nombre", "name", "NAME"]) || "",
          apellido: getValue(colab, ["APELLIDO", "apellido", "Apellido", "apellidos", "APELLIDOS", "lastname", "LASTNAME"]) || "",
          area: getValue(colab, ["AREA", "area", "Area", "departamento", "DEPARTAMENTO", "department", "DEPARTMENT"]) || "Sin área asignada",
          usuario: usuarioFinal,
          fechaCumpleanos: fechaFormateada,
          activo: getValue(colab, ["ESTADO", "estado", "Estado", "status", "STATUS"]) === "1" || getValue(colab, ["ESTADO", "estado", "Estado", "status", "STATUS"]) === 1,
        };
      }) : [];
      console.log("Colaboradores mapeados:", colaboradoresMapeados);
      
      // Log detallado de cada colaborador y su campo usuario
      console.log("🔍 Análisis detallado de colaboradores:");
      colaboradoresMapeados.forEach((c, idx) => {
        console.log(`  ${idx + 1}. ${c.nombre} ${c.apellido}:`, {
          usuario: c.usuario,
          usuarioType: typeof c.usuario,
          usuarioIsEmpty: c.usuario === "",
          usuarioIsNull: c.usuario === null,
          usuarioIsUndefined: c.usuario === undefined,
          usuarioTrimmed: c.usuario ? String(c.usuario).trim() : "N/A",
          usuarioTrimmedLength: c.usuario ? String(c.usuario).trim().length : 0,
          tieneUsuario: c.usuario && String(c.usuario).trim() !== ""
        });
      });
      
      const sinUsuario = colaboradoresMapeados.filter(c => {
        const tieneUsuario = c.usuario && String(c.usuario).trim() !== "";
        return !tieneUsuario;
      });
      console.log("Colaboradores sin usuario:", sinUsuario);
      console.log("Total colaboradores:", colaboradoresMapeados.length);
      console.log("Colaboradores con usuario:", colaboradoresMapeados.length - sinUsuario.length);
      setColaboradores(colaboradoresMapeados);
    } catch (error) {
      console.error("Error al obtener colaboradores:", error);
      setErrorColaboradores(error.message || "Error al obtener colaboradores");
    } finally {
      setLoadingColaboradores(false);
    }
  }, []);

  // Función para obtener todas las subvistas disponibles desde la API
  const fetchSubVistasDisponibles = useCallback(async () => {
    try {
      const response = await fetch(
        `https://api-login-accesos-2946605267.us-central1.run.app?metodo=listado_subvistas`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Subvistas disponibles recibidas de la API:", data);

      // Mapear las subvistas al formato esperado
      const subVistasMapeadas = Array.isArray(data) ? data.map((vista) => ({
        id: vista.ID || vista.id,
        nombre: vista.SUB_VISTA || vista.sub_vista || vista.nombre,
        area: vista.AREA || vista.area || "",
      })) : [];

      return subVistasMapeadas;
    } catch (error) {
      console.error("Error al obtener subvistas disponibles:", error);
      return [];
    }
  }, []);

  // Función para obtener permisos de la API
  const fetchPermisos = useCallback(async (usuario) => {
    try {
      setLoadingPermisos(true);
      const response = await fetch(`https://api-login-accesos-2946605267.us-central1.run.app?metodo=get_permissions&user=${encodeURIComponent(usuario)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Permisos recibidos de la API:", data);

      // Mapear módulos
      const modulos = Array.isArray(data.modulos) ? data.modulos.map((mod) => ({
        id: mod.NOMBRE || mod.nombre || mod.Nombre,
        nombre: mod.NOMBRE || mod.nombre || mod.Nombre,
        permitido: true, // Si está en la lista, está permitido
      })) : [];

      setModulosPermisos(modulos);

      // Mapear sub_vistas permitidas
      const subVistasPermitidasIds = Array.isArray(data.sub_vistas) 
        ? data.sub_vistas.map((vista) => vista.ID_SUB_VISTAS || vista.id || vista.ID)
        : [];
      
      const subVistas = Array.isArray(data.sub_vistas) ? data.sub_vistas.map((vista) => ({
        id: vista.ID_SUB_VISTAS || vista.id || vista.ID,
        nombre: vista.NOMBRE || vista.nombre || vista.Nombre,
        url: "",
        area: "", // Se puede inferir del nombre si es necesario
      })) : [];

      setSubVistasPermitidas(subVistas);

      // Obtener todas las subvistas disponibles desde la API
      const todasLasSubVistas = await fetchSubVistasDisponibles();
      
      // Calcular sub_vistas disponibles: todas las posibles menos las permitidas
      const disponibles = todasLasSubVistas.filter(
        (vista) => !subVistasPermitidasIds.includes(vista.id)
      );
      setSubVistasDisponibles(disponibles);
    } catch (error) {
      console.error("Error al obtener permisos:", error);
      // En caso de error, mantener valores por defecto vacíos
      setModulosPermisos([]);
      setSubVistasPermitidas([]);
      // Intentar cargar subvistas disponibles incluso si hay error en permisos
      try {
        const todasLasSubVistas = await fetchSubVistasDisponibles();
        setSubVistasDisponibles(todasLasSubVistas);
      } catch (subVistasError) {
        console.error("Error al obtener subvistas disponibles:", subVistasError);
        setSubVistasDisponibles([]);
      }
    } finally {
      setLoadingPermisos(false);
    }
  }, [fetchSubVistasDisponibles]);

  // Cargar colaboradores al montar el componente
  useEffect(() => {
    if (!loading && user) {
      fetchColaboradores();
    }
  }, [loading, user, fetchColaboradores]);

  // Recargar colaboradores cuando se abre el modal de agregar
  useEffect(() => {
    if (isAgregarModalOpen) {
      fetchColaboradores();
    }
  }, [isAgregarModalOpen, fetchColaboradores]);

  const activos = colaboradores.filter(c => c.activo !== false);
  const inactivos = colaboradores.filter(c => c.activo === false);

  const totalPages = Math.ceil(activos.length / itemsPerPage);
  const totalPagesInactivos = Math.ceil(inactivos.length / itemsPerPage);

  const paginatedActivos = activos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const paginatedInactivos = inactivos.slice((currentPageInactivos - 1) * itemsPerPage, currentPageInactivos * itemsPerPage);

  // Desactivar colaborador con API
  const handleDesactivarColaborador = async () => {
    if (!selectedColaborador) return;
    
    try {
      // Buscar el colaborador completo para obtener el correo
      const getValue = (obj, keys) => {
        for (const key of keys) {
          if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
            return obj[key];
          }
        }
        return null;
      };

      const colaboradorCompleto = colaboradoresCompletos.find(c => {
        const idOriginal = getValue(c, ["ID_PERSONA", "id", "ID", "Id"]);
        return idOriginal && String(idOriginal) === String(selectedColaborador.id);
      });

      console.log("🔍 [DESACTIVAR] Buscando colaborador completo:", {
        idBuscado: selectedColaborador.id,
        colaboradorCompletoEncontrado: colaboradorCompleto ? "Sí" : "No",
        totalColaboradoresCompletos: colaboradoresCompletos.length,
        primerColaboradorEjemplo: colaboradoresCompletos[0] ? {
          ID_PERSONA: colaboradoresCompletos[0].ID_PERSONA,
          id: colaboradoresCompletos[0].id,
          ID: colaboradoresCompletos[0].ID,
          CORREO: colaboradoresCompletos[0].CORREO,
          correo: colaboradoresCompletos[0].correo
        } : "No hay colaboradores"
      });

      if (!colaboradorCompleto) {
        console.error("❌ [DESACTIVAR] No se encontró el colaborador completo");
        setNotification({
          show: true,
          message: "Error: No se encontró la información completa del colaborador",
          type: "error"
        });
        setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 3000);
        setIsDesactivarModalOpen(false);
        setSelectedColaborador(null);
        return;
      }

      // Obtener correo del colaborador - verificar directamente en el objeto
      let correo = colaboradorCompleto.CORREO !== undefined ? colaboradorCompleto.CORREO : 
                   colaboradorCompleto.correo !== undefined ? colaboradorCompleto.correo : 
                   colaboradorCompleto.CORREO_ELECTRONICO !== undefined ? colaboradorCompleto.CORREO_ELECTRONICO :
                   colaboradorCompleto.correo_electronico !== undefined ? colaboradorCompleto.correo_electronico :
                   colaboradorCompleto.email !== undefined ? colaboradorCompleto.email :
                   colaboradorCompleto.EMAIL !== undefined ? colaboradorCompleto.EMAIL : null;
      
      // Si el correo no está en los datos completos, intentar obtenerlo de la API de perfil
      if (correo === null || correo === undefined || correo === "") {
        try {
          const token = localStorage.getItem("token");
          const username = selectedColaborador.usuario || colaboradorCompleto?.USUARIO || colaboradorCompleto?.usuario;
          
          if (username) {
            const perfilUrl = `https://colaboradores2026-2946605267.us-central1.run.app?method=perfil_usuario_2026&user=${encodeURIComponent(username)}`;
            const perfilResponse = await fetch(perfilUrl, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
              },
            });
            
            if (perfilResponse.ok) {
              const perfilData = await perfilResponse.json();
              const perfilCorreo = perfilData?.CORREO || perfilData?.correo || perfilData?.CORREO_ELECTRONICO || perfilData?.correo_electronico || perfilData?.email || perfilData?.EMAIL;
              if (perfilCorreo && perfilCorreo !== "" && perfilCorreo !== "null" && perfilCorreo !== "undefined") {
                correo = perfilCorreo;
              }
            }
          }
        } catch (perfilError) {
          console.warn("⚠️ [DESACTIVAR] No se pudo obtener correo del perfil:", perfilError);
        }
      }
      
      // Si el correo es string vacío, convertir a null para que coincida con NULL en la base de datos
      if (correo === "" || correo === "null" || correo === "undefined") {
        correo = null;
      }

      console.log("📧 [DESACTIVAR] Correo obtenido:", {
        correo: correo,
        correoType: typeof correo,
        correoIsNull: correo === null,
        correoIsEmpty: correo === "",
        objetoCompleto: colaboradorCompleto
      });

      const token = localStorage.getItem("token");
      const url = `https://colaboradores2026-2946605267.us-central1.run.app?metodo=desactivar_activar_usuario&id=${selectedColaborador.id}`;

      console.log("🔍 [DESACTIVAR] Enviando petición:", {
        id: selectedColaborador.id,
        estado: "0",
        correo: correo || "(vacío/null)",
        correoType: typeof correo,
        url: url
      });

      // Si correo es null, enviarlo como null explícitamente en JSON
      const requestBody = {
        estado: "0", // 0 para desactivar
      };
      
      // Solo incluir correo si no es null, o incluir null explícitamente
      // El backend espera correo en el body, así que lo incluimos siempre
      requestBody.correo = correo; // null se serializará correctamente en JSON

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();
      console.log("📥 [DESACTIVAR] Respuesta de la API:", {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { error: responseText || `Error ${response.status}: ${response.statusText}` };
        }
        throw new Error(errorData.error || errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      // Verificar la respuesta para asegurar que se actualizó
      let responseData;
      try {
        responseData = JSON.parse(responseText);
        console.log("✅ [DESACTIVAR] Datos parseados:", responseData);
      } catch {
        console.warn("⚠️ [DESACTIVAR] No se pudo parsear la respuesta como JSON");
      }

      // Actualizar estado local después de éxito en la API
      setColaboradores((prev) =>
        prev.map((c) =>
          c.id === selectedColaborador.id ? { ...c, activo: false } : c
        )
      );

      // Recargar colaboradores para asegurar sincronización con el backend
      await fetchColaboradores();

      setNotification({
        show: true,
        message: "Colaborador desactivado exitosamente",
        type: "success"
      });
      setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 3000);

      setIsDesactivarModalOpen(false);
      setSelectedColaborador(null);
    } catch (error) {
      console.error("Error al desactivar colaborador:", error);
      setNotification({
        show: true,
        message: `Error al desactivar colaborador: ${error.message}`,
        type: "error"
      });
      setTimeout(() => setNotification({ show: false, message: "", type: "error" }), 4000);
    }
  };

  // Activar colaborador con API
  const handleActivarColaborador = async (colaborador) => {
    if (!colaborador) return;

    try {
      // Buscar el colaborador completo para obtener el correo
      const colaboradorCompleto = colaboradoresCompletos.find(c => {
        const getValue = (obj, keys) => {
          for (const key of keys) {
            if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
              return obj[key];
            }
          }
          return "";
        };
        const idOriginal = getValue(c, ["ID_PERSONA", "id", "ID", "Id"]);
        return idOriginal && idOriginal === colaborador.id;
      });

      if (!colaboradorCompleto) {
        setNotification({
          show: true,
          message: "Error: No se encontró la información completa del colaborador",
          type: "error"
        });
        setTimeout(() => setNotification({ show: false, message: "", type: "error" }), 3000);
        return;
      }

      // Obtener correo del colaborador - verificar directamente en el objeto
      let correo = colaboradorCompleto.CORREO !== undefined ? colaboradorCompleto.CORREO : 
                   colaboradorCompleto.correo !== undefined ? colaboradorCompleto.correo : 
                   colaboradorCompleto.CORREO_ELECTRONICO !== undefined ? colaboradorCompleto.CORREO_ELECTRONICO :
                   colaboradorCompleto.correo_electronico !== undefined ? colaboradorCompleto.correo_electronico :
                   colaboradorCompleto.email !== undefined ? colaboradorCompleto.email :
                   colaboradorCompleto.EMAIL !== undefined ? colaboradorCompleto.EMAIL : null;
      
      // Si el correo no está en los datos completos, intentar obtenerlo de la API de perfil
      if (correo === null || correo === undefined || correo === "") {
        try {
          const token = localStorage.getItem("token");
          const username = colaborador.usuario || colaboradorCompleto?.USUARIO || colaboradorCompleto?.usuario;
          
          if (username) {
            const perfilUrl = `https://colaboradores2026-2946605267.us-central1.run.app?method=perfil_usuario_2026&user=${encodeURIComponent(username)}`;
            const perfilResponse = await fetch(perfilUrl, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
              },
            });
            
            if (perfilResponse.ok) {
              const perfilData = await perfilResponse.json();
              const perfilCorreo = perfilData?.CORREO || perfilData?.correo || perfilData?.CORREO_ELECTRONICO || perfilData?.correo_electronico || perfilData?.email || perfilData?.EMAIL;
              if (perfilCorreo && perfilCorreo !== "" && perfilCorreo !== "null" && perfilCorreo !== "undefined") {
                correo = perfilCorreo;
              }
            }
          }
        } catch (perfilError) {
          console.warn("⚠️ [ACTIVAR] No se pudo obtener correo del perfil:", perfilError);
        }
      }
      
      // Si el correo es string vacío, convertir a null para que coincida con NULL en la base de datos
      if (correo === "" || correo === "null" || correo === "undefined") {
        correo = null;
      }

      const token = localStorage.getItem("token");
      const url = `https://colaboradores2026-2946605267.us-central1.run.app?metodo=desactivar_activar_usuario&id=${colaborador.id}`;

      // Si correo es null, enviarlo como null explícitamente en JSON
      const requestBody = {
        estado: "1", // 1 para activar
      };
      
      // Solo incluir correo si no es null, o incluir null explícitamente
      // El backend espera correo en el body, así que lo incluimos siempre
      requestBody.correo = correo; // null se serializará correctamente en JSON

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || `Error ${response.status}: ${response.statusText}` };
        }
        throw new Error(errorData.error || errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      // Actualizar estado local después de éxito en la API
      setColaboradores((prev) =>
        prev.map((c) =>
          c.id === colaborador.id ? { ...c, activo: true } : c
        )
      );

      // Recargar colaboradores para asegurar sincronización
      await fetchColaboradores();

      setNotification({
        show: true,
        message: "Colaborador activado exitosamente",
        type: "success"
      });
      setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 3000);
    } catch (error) {
      console.error("Error al activar colaborador:", error);
      setNotification({
        show: true,
        message: `Error al activar colaborador: ${error.message}`,
        type: "error"
      });
      setTimeout(() => setNotification({ show: false, message: "", type: "error" }), 4000);
    }
  };

  // Derivados para el modal de permisos (usuario / contraseña / avatar)
  const colaboradorInfo = selectedColaboradorCompleto || selectedColaborador || null;

  const getValorColab = (obj, keys) => {
    if (!obj) return "";

    // Buscar en el nivel actual
    for (const key of keys) {
      if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
        return obj[key];
      }
    }

    // Buscar de forma recursiva en objetos anidados
    for (const prop in obj) {
      if (
        Object.prototype.hasOwnProperty.call(obj, prop) &&
        obj[prop] &&
        typeof obj[prop] === "object" &&
        !Array.isArray(obj[prop])
      ) {
        const nested = getValorColab(obj[prop], keys);
        if (nested !== "") {
          return nested;
        }
      }
    }

    return "";
  };

  // Valor fijo de ejemplo solicitado por el usuario
  const usuarioValue = "Hervin Zeus";

  const maskedPassword = "********";

  const avatarUrl = getValorColab(colaboradorInfo, [
    "foto",
    "FOTO",
    "imagen",
    "IMAGEN",
    "avatar",
    "AVATAR",
    "foto_url",
    "FOTO_URL",
  ]);

  const inicialesAvatar =
    `${(selectedColaborador?.nombre || "").charAt(0)}${(
      selectedColaborador?.apellido || ""
    ).charAt(0)}`.trim() || "US";

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

  return (
    <>
      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-50">
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
              onClick={() => router.push("/gerencia")}
              className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] text-white rounded-lg font-semibold hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm ripple-effect relative overflow-hidden text-sm group"
            >
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver a Gerencia</span>
            </button>

            {/* Contenedor principal con fondo */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6 mb-6">
              {/* Sección: Listado de Colaboradores */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6 mb-6">
              <div>
                {/* Header de Sección */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] rounded-xl flex items-center justify-center text-white shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Listado de Colaboradores</h2>
                      <p className="text-sm text-gray-600 mt-1">Gestiona los colaboradores activos del sistema</p>
                    </div>
                  </div>
                  <div className={`flex items-center space-x-2 rounded-lg px-3 py-1.5 ${
                    loadingColaboradores 
                      ? "bg-yellow-50 border border-yellow-200" 
                      : errorColaboradores 
                        ? "bg-red-50 border border-red-200" 
                        : "bg-green-50 border border-green-200"
                  }`}>
                    {loadingColaboradores ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                        <span className="text-sm font-semibold text-yellow-700">Cargando...</span>
                      </>
                    ) : errorColaboradores ? (
                      <>
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span className="text-sm font-semibold text-red-700">Error: {errorColaboradores}</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-semibold text-green-700">API Conectada</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Mensaje de error */}
                {errorColaboradores && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">
                      <strong>Error:</strong> {errorColaboradores}
                    </p>
                    <button
                      onClick={fetchColaboradores}
                      className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                    >
                      Intentar de nuevo
                    </button>
                  </div>
                )}

                {/* Botón Agregar */}
                <button
                  onClick={() => {
                    // Recargar colaboradores antes de abrir el modal para tener la lista actualizada
                    fetchColaboradores();
                    setNewColaboradorForm({
                      id_colaborador: null,
                      nombre: "",
                      apellido: "",
                      area: "",
                      usuario: "",
                      contraseña: "",
                    });
                    setIsAgregarModalOpen(true);
                  }}
                  className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] text-white rounded-lg font-semibold hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm active:scale-[0.98] text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Agregar Colaborador</span>
                </button>

                {/* Tabla */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-blue-700 border-b-2 border-blue-800">
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">NOMBRE</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">APELLIDO</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ÁREA</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">USUARIO</th>
                          <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ACCIÓN</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {loadingColaboradores ? (
                          <tr>
                            <td colSpan={5} className="px-3 py-8 text-center">
                              <div className="flex items-center justify-center space-x-2">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700"></div>
                                <span className="text-sm text-gray-600">Cargando colaboradores...</span>
                              </div>
                            </td>
                          </tr>
                        ) : paginatedActivos.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-3 py-8 text-center text-sm text-gray-500">
                              No hay colaboradores activos
                            </td>
                          </tr>
                        ) : (
                          paginatedActivos.map((colaborador, index) => {
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
                                <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{colaborador.usuario || "Sin usuario"}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-center">
                                  <div className="flex items-center justify-center space-x-2">
                                    <button
                                      onClick={async () => {
                                        setSelectedColaborador(colaborador);
                                        setSelectedColaboradorCompleto(colaboradorCompleto);
                                        setIsPermisosModalOpen(true);
                                        // Obtener permisos cuando se abre el modal
                                        const usuario = colaborador.usuario || colaboradorCompleto?.USUARIO || colaboradorCompleto?.usuario;
                                        if (usuario) {
                                          await fetchPermisos(usuario);
                                        }
                                      }}
                                      className="inline-flex items-center space-x-1 px-2.5 py-1 bg-gradient-to-br from-cyan-500 to-cyan-600 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                                      title="Gestionar permisos del colaborador"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" style={{ pointerEvents: 'none' }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                      <span style={{ pointerEvents: 'none' }}>Permisos</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSelectedColaborador(colaborador);
                                        setIsDesactivarModalOpen(true);
                                      }}
                                      className="inline-flex items-center space-x-1 px-2.5 py-1 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                                      title="Desactivar colaborador"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" style={{ pointerEvents: 'none' }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                      <span style={{ pointerEvents: 'none' }}>Desactivar</span>
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

                  {/* Paginación */}
                  <div className="bg-slate-200 px-3 py-2 flex items-center justify-between border-t-2 border-slate-300">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      «
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      &lt;
                    </button>
                    <span className="text-[10px] text-gray-700 font-medium">
                      Página {currentPage} de {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      &gt;
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      »
                    </button>
                  </div>
                </div>
              </div>
            </div>

              {/* Sección: Colaboradores Inactivos */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">
              <div>
                {/* Header de Sección */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] rounded-xl flex items-center justify-center text-white shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Colaboradores Inactivos</h2>
                      <p className="text-sm text-gray-600 mt-1">Sin acceso al sistema</p>
                    </div>
                  </div>
                  <div className={`flex items-center space-x-2 rounded-lg px-3 py-1.5 ${
                    loadingColaboradores 
                      ? "bg-yellow-50 border border-yellow-200" 
                      : errorColaboradores 
                        ? "bg-red-50 border border-red-200" 
                        : "bg-green-50 border border-green-200"
                  }`}>
                    {loadingColaboradores ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                        <span className="text-sm font-semibold text-yellow-700">Cargando...</span>
                      </>
                    ) : errorColaboradores ? (
                      <>
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span className="text-sm font-semibold text-red-700">Error: {errorColaboradores}</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-semibold text-green-700">API Conectada</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Tabla */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-blue-700 border-b-2 border-blue-800">
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">NOMBRE</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">APELLIDO</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ÁREA</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">USUARIO</th>
                          <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ACCIÓN</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {loadingColaboradores ? (
                          <tr>
                            <td colSpan={5} className="px-3 py-8 text-center">
                              <div className="flex items-center justify-center space-x-2">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700"></div>
                                <span className="text-sm text-gray-600">Cargando colaboradores...</span>
                              </div>
                            </td>
                          </tr>
                        ) : paginatedInactivos.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-3 py-8 text-center text-sm text-gray-500">
                              No hay colaboradores inactivos
                            </td>
                          </tr>
                        ) : (
                          paginatedInactivos.map((colaborador, index) => {
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
                                <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{colaborador.usuario || "Sin usuario"}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-center">
                                  <div className="flex items-center justify-center space-x-2">
                                    <button
                                      onClick={async () => {
                                        setSelectedColaborador(colaborador);
                                        setSelectedColaboradorCompleto(colaboradorCompleto);
                                        setIsPermisosModalOpen(true);
                                        // Obtener permisos cuando se abre el modal
                                        const usuario = colaborador.usuario || colaboradorCompleto?.USUARIO || colaboradorCompleto?.usuario;
                                        if (usuario) {
                                          await fetchPermisos(usuario);
                                        }
                                      }}
                                      className="inline-flex items-center space-x-1 px-2.5 py-1 bg-gradient-to-br from-cyan-500 to-cyan-600 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                                      title="Gestionar permisos del colaborador"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" style={{ pointerEvents: 'none' }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                      <span style={{ pointerEvents: 'none' }}>Permisos</span>
                                    </button>
                                    <button
                                      onClick={() => handleActivarColaborador(colaborador)}
                                      className="inline-flex items-center space-x-1 px-2.5 py-1 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                                      title="Activar colaborador"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" style={{ pointerEvents: 'none' }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                      </svg>
                                      <span style={{ pointerEvents: 'none' }}>Activar</span>
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

                  {/* Paginación */}
                  <div className="bg-slate-200 px-3 py-2 flex items-center justify-between border-t-2 border-slate-300">
                    <button
                      onClick={() => setCurrentPageInactivos(1)}
                      disabled={currentPageInactivos === 1}
                      className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      «
                    </button>
                    <button
                      onClick={() => setCurrentPageInactivos(prev => Math.max(1, prev - 1))}
                      disabled={currentPageInactivos === 1}
                      className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      &lt;
                    </button>
                    <span className="text-[10px] text-gray-700 font-medium">
                      Página {currentPageInactivos} de {totalPagesInactivos}
                    </span>
                    <button
                      onClick={() => setCurrentPageInactivos(prev => Math.min(totalPagesInactivos, prev + 1))}
                      disabled={currentPageInactivos === totalPagesInactivos}
                      className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      &gt;
                    </button>
                    <button
                      onClick={() => setCurrentPageInactivos(totalPagesInactivos)}
                      disabled={currentPageInactivos === totalPagesInactivos}
                      className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      »
                    </button>
                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>
          </main>
        </div>
      </div>
      {/* Modal de Permisos - Tablero completo */}
      <Modal
        isOpen={isPermisosModalOpen}
        onClose={() => {
          setIsPermisosModalOpen(false);
          setSelectedColaborador(null);
        }}
        title="Accesibilidad y Credenciales"
        size="xl"
      >
        {selectedColaborador && (
          <div className="space-y-5">
            {/* Información de Usuario */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200/60 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] text-white flex items-center justify-center text-xs font-bold uppercase overflow-hidden">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Avatar usuario"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{inicialesAvatar}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Información de Usuario</h3>
                    <p className="text-xs text-gray-500">
                      Usuario: {selectedColaborador.nombre} {selectedColaborador.apellido}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Permisos por Módulo */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200/60 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-[#1E63F7]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6a4 4 0 118 0v2a2 2 0 012 2v4a2 2 0 01-2 2h-1m-4 4H6a2 2 0 01-2-2v-5a2 2 0 012-2h2" />
                  </svg>
                  <h3 className="text-sm font-bold text-gray-900">Permisos por Módulo</h3>
                </div>
              </div>
              <div className="overflow-x-auto">
                {loadingPermisos ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Cargando permisos...</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="bg-blue-700 border-b-2 border-blue-800">
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">MÓDULO</th>
                        <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">PERMISO</th>
                        <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ESTADO</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {modulosPermisos.length > 0 ? modulosPermisos.map((mod) => (
                      <tr key={mod.id} className="hover:bg-slate-200 transition-colors">
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-gray-900">
                          {mod.nombre}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-center">
                          <button
                            onClick={() => togglePermisoModulo(mod.id)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
                              mod.permitido ? "bg-emerald-500" : "bg-gray-300"
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                                mod.permitido ? "translate-x-4" : "translate-x-1"
                              }`}
                            />
                          </button>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-center">
                          {mod.permitido ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-emerald-500 border-2 border-emerald-600 text-white">
                              Concedido
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-red-500 border-2 border-red-600 text-white">
                              Denegado
                            </span>
                          )}
                        </td>
                      </tr>
                    )) : (
                        <tr>
                          <td colSpan={3} className="px-3 py-4 text-center text-sm text-gray-500">
                            No hay módulos disponibles
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Permisos por Sub Vistas */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200/60 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-[#1E63F7]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  <h3 className="text-sm font-bold text-gray-900">Permisos por Sub Vistas</h3>
                </div>
                <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200">
                  <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-[10px] font-semibold text-emerald-700">Sub Vistas Permitidas</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                {loadingPermisos ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Cargando sub vistas...</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="bg-blue-700 border-b-2 border-blue-800">
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">NOMBRE</th>
                        <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ACCIÓN</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {subVistasPermitidas.length > 0 ? subVistasPermitidas.map((vista) => (
                        <tr key={vista.id} className="hover:bg-slate-200 transition-colors">
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                            {vista.nombre}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-center">
                            <button
                              onClick={() => handleEliminarSubVistaClick(vista.id)}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                              title="Eliminar sub vista"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" style={{ pointerEvents: 'none' }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              <span style={{ pointerEvents: 'none' }}>Eliminar</span>
                            </button>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={2} className="px-3 py-4 text-center text-sm text-gray-500">
                            No hay sub vistas disponibles
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Agregar Nueva Sub Vista */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-[#1E63F7]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <h3 className="text-sm font-bold text-gray-900">Agregar Nueva Sub Vista</h3>
                </div>
              </div>
              <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Filtrar por Área
                  </label>
                  <select
                    value={filtroAreaSubVista}
                    onChange={(e) => setFiltroAreaSubVista(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E63F7] focus:border-[#1E63F7] text-xs text-gray-900"
                  >
                    <option value="TODAS">Todas las Áreas</option>
                    <option value="MARKETING">MARKETING</option>
                    <option value="IMPORTACION">IMPORTACION</option>
                    <option value="LOGISTICA">LOGISTICA</option>
                    <option value="GERENCIA">GERENCIA</option>
                    <option value="RECURSOS HUMANOS">RECURSOS HUMANOS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Buscar Sub Vista
                  </label>
                  <input
                    type="text"
                    value={busquedaSubVista}
                    onChange={(e) => setBusquedaSubVista(e.target.value)}
                    placeholder="Buscar por nombre..."
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E63F7] focus:border-[#1E63F7] text-xs text-gray-900 placeholder:text-gray-600"
                  />
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-blue-700 border-b-2 border-blue-800">
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">NOMBRE</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ÁREA</th>
                        <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ACCIÓN</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(() => {
                        const vistasFiltradas = subVistasDisponibles
                          .filter((vista) =>
                            filtroAreaSubVista === "TODAS" ? true : vista.area === filtroAreaSubVista
                          )
                          .filter((vista) =>
                            busquedaSubVista
                              ? vista.nombre.toLowerCase().includes(busquedaSubVista.toLowerCase())
                              : true
                          );
                        
                        return vistasFiltradas.length > 0 ? (
                          vistasFiltradas.map((vista) => (
                            <tr key={vista.id} className="hover:bg-slate-200 transition-colors">
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                                {vista.nombre}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                                {vista.area}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-center">
                                <button
                                  onClick={() => handleAgregarSubVista(vista.id)}
                                  className="inline-flex items-center space-x-1 px-2.5 py-1 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                                  title="Agregar sub vista"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" style={{ pointerEvents: 'none' }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                  </svg>
                                  <span style={{ pointerEvents: 'none' }}>Agregar</span>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3} className="px-3 py-4 text-center text-sm text-gray-500">
                              No hay sub vistas disponibles para agregar
                            </td>
                          </tr>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
      {/* Modal de Confirmación para Eliminar SubVista */}
      <Modal
        isOpen={isEliminarSubVistaModalOpen}
        onClose={() => {
          setIsEliminarSubVistaModalOpen(false);
          setSubVistaAEliminar(null);
        }}
        title="Eliminar Sub Vista"
        size="md"
        primaryButtonText="Sí, Eliminar"
        onPrimaryButtonClick={handleConfirmarEliminarSubVista}
        secondaryButtonText="Cancelar"
        onSecondaryButtonClick={() => {
          setIsEliminarSubVistaModalOpen(false);
          setSubVistaAEliminar(null);
        }}
      >
        {subVistaAEliminar && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              ¿Estás seguro de que deseas eliminar la sub vista <strong>{subVistaAEliminar.nombre}</strong>?
            </p>
            <p className="text-xs text-gray-500">
              Esta acción eliminará el permiso de esta sub vista para el usuario.
            </p>
          </div>
        )}
      </Modal>
      <Modal
        isOpen={isDesactivarModalOpen}
        onClose={() => {
          setIsDesactivarModalOpen(false);
          setSelectedColaborador(null);
        }}
        title="Desactivar Colaborador"
        size="md"
        primaryButtonText="Sí"
        onPrimaryButtonClick={handleDesactivarColaborador}
        secondaryButtonText="No"
        onSecondaryButtonClick={() => {
          setIsDesactivarModalOpen(false);
          setSelectedColaborador(null);
        }}
      >
        {selectedColaborador && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              ¿Estás seguro de que deseas desactivar a <strong>{selectedColaborador.nombre} {selectedColaborador.apellido}</strong>?
            </p>
            <p className="text-xs text-gray-500">
              El colaborador perderá acceso al sistema pero sus datos se mantendrán.
            </p>
          </div>
        )}
      </Modal>

      {/* Modal Agregar Colaborador */}
      <Modal
        isOpen={isAgregarModalOpen}
        onClose={() => {
          setIsAgregarModalOpen(false);
          setNewColaboradorForm({
            id_colaborador: null,
            nombre: "",
            apellido: "",
            area: "",
            usuario: "",
            contraseña: "",
          });
        }}
        title="Agregar Nuevo Colaborador"
        size="lg"
      >
        <div className="grid grid-cols-2 gap-6">
          {/* Primera columna: Formulario */}
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center">
                <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Nombre
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
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center">
                <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Apellido
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
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center">
                <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Área
              </label>
              <input
                type="text"
                value={newColaboradorForm.area}
                onChange={(e) => setNewColaboradorForm({ ...newColaboradorForm, area: e.target.value })}
                placeholder="Ej: Administracion, Ventas, Logistica"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 placeholder:text-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center">
                <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Usuario
              </label>
              <input
                type="text"
                value={newColaboradorForm.usuario}
                onChange={(e) => setNewColaboradorForm({ ...newColaboradorForm, usuario: e.target.value })}
                placeholder="Usuario"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 placeholder:text-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center">
                <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Contraseña
              </label>
              <input
                type="password"
                value={newColaboradorForm.contraseña}
                onChange={(e) => setNewColaboradorForm({ ...newColaboradorForm, contraseña: e.target.value })}
                placeholder="Contraseña"
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 placeholder:text-gray-600"
              />
            </div>
          </div>

          {/* Segunda columna: Lista de colaboradores sin usuario/contraseña */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Colaboradores sin Usuario/Contraseña
              </label>
              <div className="border border-gray-300 rounded-lg max-h-[400px] overflow-y-auto custom-scrollbar">
                {(() => {
                  const colaboradoresSinUsuario = colaboradores.filter(colab => {
                    const tieneUsuario = colab.usuario && String(colab.usuario).trim() !== "";
                    return !tieneUsuario;
                  });
                  
                  return colaboradoresSinUsuario.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">
                      No hay colaboradores sin usuario/contraseña
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {colaboradoresSinUsuario
                      .map((colab, index) => (
                        <button
                          key={colab.id || index}
                          onClick={() => {
                            setNewColaboradorForm({
                              id_colaborador: colab.id || null,
                              nombre: colab.nombre || "",
                              apellido: colab.apellido || "",
                              area: colab.area || "",
                              usuario: "",
                              contraseña: "",
                            });
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-200 last:border-b-0"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {colab.nombre} {colab.apellido}
                              </p>
                              <p className="text-xs text-gray-600 mt-0.5">{colab.area || "Sin área asignada"}</p>
                            </div>
                            <svg
                              className="w-5 h-5 text-blue-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </div>
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-end space-x-3 pt-4 mt-6 border-t border-gray-200">
          <button
            onClick={() => {
              setIsAgregarModalOpen(false);
              setNewColaboradorForm({
                id_colaborador: null,
                nombre: "",
                apellido: "",
                area: "",
                usuario: "",
                contraseña: "",
              });
            }}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={async () => {
              // Validar campos requeridos
              if (!newColaboradorForm.id_colaborador || !newColaboradorForm.usuario || !newColaboradorForm.contraseña) {
                alert("Por favor, seleccione un colaborador y complete usuario y contraseña");
                return;
              }

              try {
                const token = localStorage.getItem("token");
                if (!token) {
                  throw new Error("No se encontró el token de autenticación");
                }

                const response = await fetch(
                  `https://colaboradores2026-2946605267.us-central1.run.app?metodo=agregar_credenciales`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "Accept": "application/json",
                      "Authorization": `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                      id_colaborador: newColaboradorForm.id_colaborador,
                      usuario: newColaboradorForm.usuario,
                      contrasena: newColaboradorForm.contraseña,
                    }),
                  }
                );

                if (!response.ok) {
                  const errorData = await response.json().catch(() => ({ error: "Error desconocido" }));
                  throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                console.log("Credenciales agregadas exitosamente:", data);
                
                // Mostrar notificación de éxito
                setNotification({
                  show: true,
                  message: "Credenciales agregadas exitosamente",
                  type: "success"
                });
                
                // Cerrar modal y resetear formulario
                setIsAgregarModalOpen(false);
                setNewColaboradorForm({
                  id_colaborador: null,
                  nombre: "",
                  apellido: "",
                  area: "",
                  usuario: "",
                  contraseña: "",
                });

                // Recargar la lista de colaboradores
                fetchColaboradores();
                
                // Ocultar notificación después de 3 segundos
                setTimeout(() => {
                  setNotification({ show: false, message: "", type: "success" });
                }, 3000);
              } catch (error) {
                console.error("Error al agregar credenciales:", error);
                // Mostrar notificación de error
                setNotification({
                  show: true,
                  message: `Error al agregar credenciales: ${error.message}`,
                  type: "error"
                });
                // Ocultar notificación después de 4 segundos
                setTimeout(() => {
                  setNotification({ show: false, message: "", type: "error" });
                }, 4000);
              }
            }}
            className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] hover:shadow-md hover:scale-105 rounded-lg transition-all duration-200 shadow-sm"
          >
            Agregar Colaborador
          </button>
        </div>
      </Modal>

      {/* Modal Ver Detalles */}
      <Modal
        isOpen={isVerDetallesModalOpen}
        onClose={() => {
          setIsVerDetallesModalOpen(false);
          setSelectedColaboradorCompleto(null);
        }}
        title={`Detalles del Colaborador - ${selectedColaboradorCompleto ? (selectedColaboradorCompleto.nombre || selectedColaboradorCompleto.NOMBRE || selectedColaboradorCompleto.name || selectedColaboradorCompleto.NAME || "") : ""}`}
        size="lg"
      >
        {selectedColaboradorCompleto && (
          <div className="space-y-4">
            {/* Función helper para obtener valores */}
            {(() => {
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
                  const date = new Date(dateValue);
                  if (!isNaN(date.getTime())) {
                    const dia = String(date.getDate()).padStart(2, "0");
                    const mes = String(date.getMonth() + 1).padStart(2, "0");
                    const año = date.getFullYear();
                    return `${dia}/${mes}/${año}`;
                  }
                  return dateValue;
                } catch (e) {
                  return dateValue;
                }
              };

              // Obtener todos los campos del objeto
              const campos = Object.keys(selectedColaboradorCompleto);
              
              // Campos principales a mostrar primero
              const camposPrincipales = [
                { keys: ["id", "ID", "Id"], label: "ID" },
                { keys: ["nombre", "NOMBRE", "Nombre", "name", "NAME"], label: "Nombre" },
                { keys: ["apellido", "APELLIDO", "Apellido", "apellidos", "APELLIDOS", "lastname", "LASTNAME"], label: "Apellido" },
                { keys: ["correo", "CORREO", "Correo", "email", "EMAIL", "Email", "correo_electronico", "CORREO_ELECTRONICO"], label: "Correo Electrónico" },
                { keys: ["fecha_nacimiento", "fechaNacimiento", "fecha_cumpleanos", "fechaCumpleanos", "FECHA_NACIMIENTO", "FECHA_CUMPLEANOS"], label: "Fecha de Nacimiento", isDate: true },
                { keys: ["area", "AREA", "Area", "departamento", "DEPARTAMENTO", "department", "DEPARTMENT"], label: "Área" },
                { keys: ["activo", "ACTIVO", "Activo", "estado", "ESTADO", "status", "STATUS"], label: "Estado" },
              ];

              // Resto de campos (excluyendo DATOS que ya se muestra arriba)
              const camposRestantes = campos.filter(campo => {
                const campoLower = campo.toLowerCase();
                // Excluir DATOS ya que se muestra en su sección especial arriba
                if (campoLower === "datos") {
                  return false;
                }
                const esPrincipal = camposPrincipales.some(cp => 
                  cp.keys.some(key => key.toLowerCase() === campo.toLowerCase())
                );
                return !esPrincipal && typeof selectedColaboradorCompleto[campo] !== "object";
              });

              return (
                <>
                  {/* Campos principales */}
                  <div className="grid grid-cols-2 gap-4">
                    {camposPrincipales.map((campo, index) => {
                      const value = getValue(selectedColaboradorCompleto, campo.keys);
                      const displayValue = campo.isDate ? formatDate(value) : formatValue(value);
                      
                      return (
                        <div key={index}>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            {campo.label}
                          </label>
                          <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                            {displayValue}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Separador */}
                  {camposRestantes.length > 0 && (
                    <>
                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <h3 className="text-sm font-bold text-gray-800 mb-3">Información Adicional</h3>
                      </div>

                      {/* Campos restantes */}
                      <div className="grid grid-cols-2 gap-4">
                        {camposRestantes.map((campo, index) => {
                          const value = selectedColaboradorCompleto[campo];
                          const displayValue = formatValue(value);
                          
                          return (
                            <div key={index}>
                              <label className="block text-sm font-semibold text-gray-700 mb-1">
                                {campo.charAt(0).toUpperCase() + campo.slice(1).replace(/_/g, " ")}
                              </label>
                              <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                                {displayValue}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {/* Campo DATOS especial - Array de teléfonos, correos, etc. */}
                  {(() => {
                    const datosField = getValue(selectedColaboradorCompleto, ["DATOS", "datos", "Datos"]);
                    
                    // Usar datosEditables (ya inicializados en useEffect)
                    const datosParaMostrar = datosEditables;
                    
                    if (datosParaMostrar && Array.isArray(datosParaMostrar) && datosParaMostrar.length > 0) {
                      // Agrupar por MEDIO
                      const agrupados = {};
                      datosParaMostrar.forEach((item, idx) => {
                        if (item && typeof item === "object") {
                          const medio = getValue(item, ["MEDIO", "medio", "Medio"]) || "OTRO";
                          const tipo = getValue(item, ["TIPO", "tipo", "Tipo"]) || "";
                          const nombre = getValue(item, ["NOMBRE", "nombre", "Nombre"]) || "";
                          const contenido = getValue(item, ["CONTENIDO", "contenido", "Contenido"]) || "";
                          
                          if (!agrupados[medio]) {
                            agrupados[medio] = [];
                          }
                          agrupados[medio].push({
                            tipo,
                            nombre,
                            contenido,
                            index: idx,
                            originalItem: item
                          });
                        }
                      });

                      return (
                        <div className="border-t border-gray-200 pt-4 mt-4">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-gray-800">DATOS</h3>
                          </div>
                          {Object.keys(agrupados).map((medio, medioIndex) => (
                            <div key={medioIndex} className="mb-5">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-bold text-blue-800 uppercase border-b border-blue-200 pb-2">
                                  {medio}
                                </h4>
                                <button
                                  onClick={() => {
                                    const nuevoItem = {
                                      TIPO: "",
                                      MEDIO: medio,
                                      NOMBRE: "",
                                      CONTENIDO: ""
                                    };
                                    setDatosEditables([...datosParaMostrar, nuevoItem]);
                                  }}
                                  className="inline-flex items-center space-x-1 px-2.5 py-1 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                                  title="Agregar nuevo dato"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" style={{ pointerEvents: 'none' }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                  </svg>
                                  <span style={{ pointerEvents: 'none' }}>Agregar</span>
                                </button>
                              </div>
                              <div className="space-y-3">
                                {agrupados[medio].map((item, itemIndex) => (
                                  <div key={itemIndex} className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg p-4 shadow-sm relative">
                                    <button
                                      onClick={() => {
                                        const nuevosDatos = datosParaMostrar.filter((_, idx) => idx !== item.index);
                                        setDatosEditables(nuevosDatos);
                                      }}
                                      className="absolute top-2 right-2 inline-flex items-center space-x-1 px-2.5 py-1 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg text-[10px] font-semibold hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer select-none"
                                      title="Eliminar"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" style={{ pointerEvents: 'none' }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                      <span style={{ pointerEvents: 'none' }}>Eliminar</span>
                                    </button>
                                    <div className="space-y-2 pr-8">
                                      {item.tipo && (
                                        <div className="flex items-start">
                                          <span className="text-xs font-bold text-gray-700 min-w-[80px]">Tipo:</span>
                                          <span className="text-xs font-semibold text-gray-900 bg-white px-2 py-1 rounded border border-gray-200">
                                            {item.tipo}
                                          </span>
                                        </div>
                                      )}
                                      {item.nombre && (
                                        <div className="flex items-start">
                                          <span className="text-xs font-bold text-gray-700 min-w-[80px]">Nombre:</span>
                                          <span className="text-xs text-gray-900 bg-white px-2 py-1 rounded border border-gray-200">
                                            {item.nombre}
                                          </span>
                                        </div>
                                      )}
                                      {item.contenido && (
                                        <div className="flex items-start">
                                          <span className="text-xs font-bold text-gray-700 min-w-[80px]">Contenido:</span>
                                          <span className="text-xs font-semibold text-blue-900 bg-white px-2 py-1 rounded border border-blue-300 break-all">
                                            {item.contenido}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Otros objetos anidados (excluyendo DATOS) */}
                  {campos.filter(campo => {
                    const campoLower = campo.toLowerCase();
                    const valor = selectedColaboradorCompleto[campo];
                    // Excluir DATOS (ya se muestra arriba) tanto si es array como objeto
                    if (campoLower === "datos") {
                      return false;
                    }
                    return typeof valor === "object" && 
                           valor !== null &&
                           !Array.isArray(valor);
                  }).map((campo, index) => {
                    const objeto = selectedColaboradorCompleto[campo];
                    const subCampos = Object.keys(objeto);
                    
                    return (
                      <div key={`nested-${index}`} className="border-t border-gray-200 pt-4 mt-4">
                        <h3 className="text-sm font-bold text-gray-800 mb-3">
                          {campo.charAt(0).toUpperCase() + campo.slice(1).replace(/_/g, " ")}
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          {subCampos.map((subCampo, subIndex) => {
                            const value = objeto[subCampo];
                            const displayValue = formatValue(value);
                            
                            return (
                              <div key={subIndex}>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                  {subCampo.charAt(0).toUpperCase() + subCampo.slice(1).replace(/_/g, " ")}
                                </label>
                                <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                                  {displayValue}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </>
              );
            })()}
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
    </>
  );
}


