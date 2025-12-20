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
    nombre: "",
    apellido: "",
    area: "",
    correo: "",
    fechaCumpleanos: "",
  });
  
  // Estados para datos de la API
  const [colaboradores, setColaboradores] = useState([]);
  const [colaboradoresCompletos, setColaboradoresCompletos] = useState([]); // Datos originales de la API
  const [loadingColaboradores, setLoadingColaboradores] = useState(true);
  const [errorColaboradores, setErrorColaboradores] = useState(null);

  // Estados para el modal de permisos (diseño tipo tablero)
  const [modulosPermisos, setModulosPermisos] = useState([
    { id: "MARKETING", nombre: "MARKETING", permitido: true },
    { id: "IMPORTACION", nombre: "IMPORTACION", permitido: true },
    { id: "SISTEMAS", nombre: "SISTEMAS", permitido: true },
    { id: "FACTURACION", nombre: "FACTURACION", permitido: true },
    { id: "LOGISTICA", nombre: "LOGISTICA", permitido: true },
    { id: "GERENCIA", nombre: "GERENCIA", permitido: true },
    { id: "ADMINISTRACION", nombre: "ADMINISTRACION", permitido: true },
    { id: "VENTAS", nombre: "VENTAS", permitido: true },
    { id: "RRHH", nombre: "RECURSOS HUMANOS", permitido: true },
    { id: "PERMISOS", nombre: "PERMISOS / SOLICITUDES E INCIDENCIAS", permitido: true },
    { id: "SEGUIMIENTO_MONITOREO", nombre: "SEGUIMIENTO Y MONITOREO", permitido: false },
  ]);

  const [subVistasPermitidas, setSubVistasPermitidas] = useState([
    { id: "IMPORTACIONES_REGISTRO", nombre: "IMPORTACIONES_REGISTRO", url: "/importacion/registro", area: "IMPORTACION" },
    { id: "LISTADO_IMPORTACIONES_IMPORT", nombre: "LISTADO_IMPORTACIONES_IMPORT", url: "/importacion/listado", area: "IMPORTACION" },
    { id: "INCIDENCIAS_PROFORMAS", nombre: "INCIDENCIAS_PROFORMAS", url: "/facturacion/incidencias/proformas", area: "FACTURACION" },
    { id: "LISTADO_IMPORTACIONES_LOGISTICA", nombre: "LISTADO_IMPORTACIONES_LOGISTICA", url: "/logistica/importaciones", area: "LOGISTICA" },
  ]);

  const [subVistasDisponibles, setSubVistasDisponibles] = useState([
    { id: "GESTION_CLIENTES_MARKETING", nombre: "GESTION DE CLIENTES - MARKETING", url: "/marketing/gestion-clientes", area: "MARKETING" },
    { id: "LISTADO_VENTAS_MARKETING", nombre: "LISTADO DE VENTAS - MARKETING", url: "/marketing/listado-ventas", area: "MARKETING" },
    { id: "GESTION_USUARIOS", nombre: "GESTION DE USUARIOS", url: "/gerencia/gestion-usuarios", area: "GERENCIA" },
    { id: "GESTION_PRODUCTOS", nombre: "GESTION DE PRODUCTOS", url: "/gerencia/gestion-productos", area: "GERENCIA" },
    { id: "RRHH_MEDIOS_COMUNICACION", nombre: "MEDIOS DE COMUNICACION - RRHH", url: "/recursos-humanos", area: "RECURSOS HUMANOS" },
  ]);

  const [filtroAreaSubVista, setFiltroAreaSubVista] = useState("TODAS");
  const [busquedaSubVista, setBusquedaSubVista] = useState("");

  const togglePermisoModulo = (id) => {
    setModulosPermisos((prev) =>
      prev.map((mod) =>
        mod.id === id ? { ...mod, permitido: !mod.permitido } : mod
      )
    );
  };

  const handleAgregarSubVista = (id) => {
    setSubVistasDisponibles((prevDisponibles) => {
      const vista = prevDisponibles.find((v) => v.id === id);
      if (!vista) return prevDisponibles;
      setSubVistasPermitidas((prevPermitidas) => [...prevPermitidas, vista]);
      return prevDisponibles.filter((v) => v.id !== id);
    });
  };

  const handleEliminarSubVista = (id) => {
    setSubVistasPermitidas((prevPermitidas) => {
      const vista = prevPermitidas.find((v) => v.id === id);
      if (!vista) return prevPermitidas;
      setSubVistasDisponibles((prevDisponibles) => [...prevDisponibles, vista]);
      return prevPermitidas.filter((v) => v.id !== id);
    });
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
      // La API puede devolver diferentes estructuras, así que intentamos varias opciones
      const colaboradoresMapeados = Array.isArray(data) ? data.map((colab) => {
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

        // Obtener área - puede estar en un objeto anidado
        let areaValue = getValue(colab, ["area", "AREA", "Area", "departamento", "DEPARTAMENTO", "department", "DEPARTMENT"]);
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

        // Determinar si está activo
        const estadoValue = getValue(colab, ["activo", "ACTIVO", "Activo", "estado", "ESTADO", "status", "STATUS"]);
        const isActivo = estadoValue !== false && 
                        estadoValue !== "inactivo" && 
                        estadoValue !== "INACTIVO" && 
                        estadoValue !== 0 &&
                        estadoValue !== "0";

        return {
          id: getValue(colab, ["id", "ID", "Id"]) || Math.random().toString(36).substr(2, 9), // Generar ID temporal si no existe
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

  // Cargar colaboradores al montar el componente
  useEffect(() => {
    if (!loading && user) {
      fetchColaboradores();
    }
  }, [loading, user, fetchColaboradores]);

  const activos = colaboradores.filter(c => c.activo !== false);
  const inactivos = colaboradores.filter(c => c.activo === false);

  const totalPages = Math.ceil(activos.length / itemsPerPage);
  const totalPagesInactivos = Math.ceil(inactivos.length / itemsPerPage);

  const paginatedActivos = activos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const paginatedInactivos = inactivos.slice((currentPageInactivos - 1) * itemsPerPage, currentPageInactivos * itemsPerPage);

  // Desactivar / activar colaboradores solo a nivel de frontend (sin API)
  const handleDesactivarColaborador = () => {
    if (!selectedColaborador) return;
    const idSeleccionado = selectedColaborador.id;
    setColaboradores((prev) =>
      prev.map((c) =>
        c.id === idSeleccionado ? { ...c, activo: false } : c
      )
    );
    setIsDesactivarModalOpen(false);
    setSelectedColaborador(null);
  };

  const handleActivarColaborador = (colaborador) => {
    if (!colaborador) return;
    const idSeleccionado = colaborador.id;
    setColaboradores((prev) =>
      prev.map((c) =>
        c.id === idSeleccionado ? { ...c, activo: true } : c
      )
    );
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
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver a Gerencia</span>
            </button>

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
                    setNewColaboradorForm({
                      nombre: "",
                      apellido: "",
                      area: "",
                      correo: "",
                      fechaCumpleanos: "",
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
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">CORREO</th>
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
                                <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{colaborador.correo}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-center">
                                  <div className="flex items-center justify-center space-x-2">
                                    <button
                                      onClick={() => {
                                        setSelectedColaborador(colaborador);
                                        setSelectedColaboradorCompleto(colaboradorCompleto);
                                        setIsPermisosModalOpen(true);
                                      }}
                                      className="flex items-center space-x-1 px-2.5 py-1 bg-cyan-500 border-2 border-cyan-600 hover:bg-cyan-600 hover:border-cyan-700 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                      <span>Permisos</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSelectedColaborador(colaborador);
                                        setIsDesactivarModalOpen(true);
                                      }}
                                      className="flex items-center space-x-1 px-2.5 py-1 bg-orange-600 border-2 border-orange-700 hover:bg-orange-700 hover:border-orange-800 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                      <span>Desactivar</span>
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
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">CORREO</th>
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
                                <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">{colaborador.correo}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-center">
                                  <div className="flex items-center justify-center space-x-2">
                                    <button
                                      onClick={() => {
                                        setSelectedColaborador(colaborador);
                                        setSelectedColaboradorCompleto(colaboradorCompleto);
                                        setIsPermisosModalOpen(true);
                                      }}
                                      className="flex items-center space-x-1 px-2.5 py-1 bg-cyan-500 border-2 border-cyan-600 hover:bg-cyan-600 hover:border-cyan-700 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                      <span>Permisos</span>
                                    </button>
                                    <button
                                      onClick={() => handleActivarColaborador(colaborador)}
                                      className="flex items-center space-x-1 px-2.5 py-1 bg-green-600 border-2 border-green-700 hover:bg-green-700 hover:border-green-800 text-white rounded-lg text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                      </svg>
                                      <span>Activar</span>
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
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="block text-xs font-semibold text-gray-600 mb-1">Usuario</span>
                    <div className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900">
                      {usuarioValue}
                    </div>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-gray-600 mb-1">Contraseña</span>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm tracking-[0.25em] text-gray-900">
                        {maskedPassword}
                      </div>
                      <button className="px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-[#1E63F7] to-[#1E63F7] rounded-lg hover:shadow-md hover:scale-[1.02] transition-all duration-200 shadow-sm">
                        Editar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Permisos por Módulo */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200/60 bg-slate-50 flex itemsCenter justify-between">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-[#1E63F7]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6a4 4 0 118 0v2a2 2 0 012 2v4a2 2 0 01-2 2h-1m-4 4H6a2 2 0 01-2-2v-5a2 2 0 012-2h2" />
                  </svg>
                  <h3 className="text-sm font-bold text-gray-900">Permisos por Módulo</h3>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-blue-700 border-b-2 border-blue-800">
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">MÓDULO</th>
                      <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">PERMISO</th>
                      <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ESTADO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {modulosPermisos.map((mod) => (
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
                    ))}
                  </tbody>
                </table>
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
                <table className="w-full">
                  <thead>
                    <tr className="bg-blue-700 border-b-2 border-blue-800">
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">NOMBRE</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">URL</th>
                      <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">ACCIÓN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {subVistasPermitidas.map((vista) => (
                      <tr key={vista.id} className="hover:bg-slate-200 transition-colors">
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-700">
                          {vista.nombre}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px]">
                          {vista.url ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              PDF
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-center">
                          <button
                            onClick={() => handleEliminarSubVista(vista.id)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-red-600 border-2 border-red-700 hover:bg-red-700 hover:border-red-800 text-white rounded-md text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span>Eliminar</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                      {subVistasDisponibles
                        .filter((vista) =>
                          filtroAreaSubVista === "TODAS" ? true : vista.area === filtroAreaSubVista
                        )
                        .filter((vista) =>
                          busquedaSubVista
                            ? vista.nombre.toLowerCase().includes(busquedaSubVista.toLowerCase())
                            : true
                        )
                        .map((vista) => (
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
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-600 border-2 border-emerald-700 hover:bg-emerald-700 hover:border-emerald-800 text-white rounded-md text-[10px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95]"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                                <span>Agregar</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
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
            nombre: "",
            apellido: "",
            area: "",
            correo: "",
            fechaCumpleanos: "",
          });
        }}
        title="Agregar Nuevo Colaborador"
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Área <span className="text-red-500">*</span>
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
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Correo <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={newColaboradorForm.correo}
              onChange={(e) => setNewColaboradorForm({ ...newColaboradorForm, correo: e.target.value })}
              placeholder="correo@ejemplo.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 placeholder:text-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Fecha de Cumpleaños <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newColaboradorForm.fechaCumpleanos}
              onChange={(e) => setNewColaboradorForm({ ...newColaboradorForm, fechaCumpleanos: e.target.value })}
              placeholder="DD/MM/YYYY"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 placeholder:text-gray-600"
            />
          </div>
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setIsAgregarModalOpen(false);
                setNewColaboradorForm({
                  nombre: "",
                  apellido: "",
                  area: "",
                  correo: "",
                  fechaCumpleanos: "",
                });
              }}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                // Validar campos requeridos
                if (!newColaboradorForm.nombre || !newColaboradorForm.apellido || !newColaboradorForm.area || !newColaboradorForm.correo || !newColaboradorForm.fechaCumpleanos) {
                  alert("Por favor, complete todos los campos requeridos");
                  return;
                }
                console.log("Agregar colaborador:", newColaboradorForm);
                alert("Funcionalidad de agregado pendiente de implementar");
                setIsAgregarModalOpen(false);
                setNewColaboradorForm({
                  nombre: "",
                  apellido: "",
                  area: "",
                  correo: "",
                  fechaCumpleanos: "",
                });
              }}
              className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-br from-[#1E63F7] to-[#1E63F7] hover:shadow-md hover:scale-105 rounded-lg transition-all duration-200 shadow-sm"
            >
              Agregar Colaborador
            </button>
          </div>
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
                                  className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                  </svg>
                                  <span>Agregar</span>
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
                                      className="absolute top-2 right-2 flex items-center space-x-1 px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                                      title="Eliminar"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                      <span>Eliminar</span>
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
    </>
  );
}


