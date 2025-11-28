import { NextResponse } from "next/server";

// Mapeo de módulos de la API a IDs internos (incluye variaciones en mayúsculas)
const MODULE_MAPPING = {
  "administrador": "administrador", // Acceso a todos los módulos
  "admin": "administrador",
  "gerencia": "gerencia",
  "administracion": "administracion",
  "administración": "administracion",
  "importacion": "importacion",
  "importación": "importacion",
  "logistica": "logistica",
  "logística": "logistica",
  "ventas": "ventas",
  "marketing": "marketing",
  "sistemas": "sistemas",
  "recursos-humanos": "recursos-humanos",
  "recursos humanos": "recursos-humanos",
  "facturacion": "facturacion",
  "facturación": "facturacion",
  "permisos": "permisos",
};

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validación básica
    if (!email || !password) {
      return NextResponse.json(
        { error: "Usuario y contraseña son requeridos" },
        { status: 400 }
      );
    }

    // Llamar a la API externa
    const apiUrl = new URL("https://api-login-accesos-2946605267.us-central1.run.app");
    apiUrl.searchParams.append("metodo", "login");
    apiUrl.searchParams.append("user", email);
    apiUrl.searchParams.append("password", password);

    console.log("Calling external API:", apiUrl.toString());

    let response;
    try {
      response = await fetch(apiUrl.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
      });
      
      console.log("API Response status:", response.status);
      console.log("API Response headers:", Object.fromEntries(response.headers.entries()));
    } catch (fetchError) {
      console.error("Error en fetch:", fetchError);
      console.error("Error details:", {
        name: fetchError.name,
        message: fetchError.message,
        stack: fetchError.stack,
      });
      
      // Si es un error de red o timeout
      if (fetchError.name === 'AbortError' || fetchError.name === 'TimeoutError' || fetchError.message.includes('timeout')) {
        return NextResponse.json(
          { error: "Tiempo de espera agotado. Por favor intenta de nuevo." },
          { status: 408 }
        );
      }
      
      // Si es un error de red
      if (fetchError.message.includes('fetch') || fetchError.message.includes('network') || fetchError.message.includes('Failed to fetch')) {
        return NextResponse.json(
          { error: "Error al conectar con el servidor. Verifica tu conexión a internet." },
          { status: 503 }
        );
      }
      
      // Otro tipo de error
      return NextResponse.json(
        { error: `Error al conectar con el servidor: ${fetchError.message}` },
        { status: 503 }
      );
    }

    // Verificar el status de la respuesta
    if (!response.ok) {
      // Intentar leer el error de la respuesta
      let errorMessage = "Error al autenticar con el servidor";
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) {
        // Si no se puede leer como JSON, leer como texto
        try {
          const errorText = await response.text();
          if (errorText) {
            errorMessage = errorText;
          }
        } catch (e2) {
          // Si falla todo, usar el mensaje por defecto
        }
      }
      
      console.error("API response error:", response.status, errorMessage);
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status >= 400 && response.status < 500 ? response.status : 500 }
      );
    }

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      // Si la respuesta no es JSON, intentar leer como texto
      const textData = await response.text();
      console.error("Error parsing JSON:", parseError, "Response text:", textData);
      return NextResponse.json(
        { error: "Respuesta inválida del servidor" },
        { status: 500 }
      );
    }

    // Log para depuración - ver qué devuelve la API
    console.log("=== API EXTERNA RESPONSE ===");
    console.log("Full API response:", JSON.stringify(data, null, 2));
    console.log("============================");

    // Verificar si la respuesta indica éxito
    // La estructura puede variar, ajustar según la respuesta real de la API
    // Si hay un error en la respuesta, retornarlo
    if (data.error && data.error !== "" && data.error !== null && data.error !== undefined) {
      console.log("API returned error:", data.error);
      return NextResponse.json(
        { error: data.error },
        { status: 401 }
      );
    }
    
    // Si no hay datos o la respuesta está vacía
    if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
      console.log("API returned empty or invalid data");
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    // Procesar módulos de la respuesta
    let userModules = [];
    let isAdmin = false;

    // Verificar si es administrador por rol o nombre
    // Convertir a string antes de toLowerCase porque rol puede ser un número
    const rol = String(data.rol || data.role || data.tipo || data.tipo_usuario || data.perfil || "").toLowerCase();
    const nombreUsuario = String(data.nombre || data.name || data.usuario || data.username || email || "").toLowerCase();
    const cargo = String(data.cargo || data.position || "").toLowerCase();
    
    // También verificar si rol es 1 (que parece ser admin según la API)
    const rolNumero = data.rol || data.role;
    if (rolNumero === 1 || rolNumero === "1") {
      isAdmin = true;
      console.log("Detected as admin by rol number:", rolNumero);
    }
    
    // Verificar múltiples formas de identificar administrador
    if (
      rol === "administrador" || 
      rol === "admin" || 
      rol.includes("admin") ||
      nombreUsuario.includes("admin") ||
      cargo === "administrador" ||
      cargo.includes("admin") ||
      data.administrador === true ||
      data.isAdmin === true ||
      data.is_admin === true
    ) {
      isAdmin = true;
      console.log("Detected as admin by:", { rol, nombreUsuario, cargo });
    }

    // Si la API devuelve módulos en diferentes formatos
    if (data.modulos) {
      userModules = Array.isArray(data.modulos) ? data.modulos : [data.modulos];
    } else if (data.modules) {
      userModules = Array.isArray(data.modules) ? data.modules : [data.modules];
    } else if (data.permisos) {
      userModules = Array.isArray(data.permisos) ? data.permisos : [data.permisos];
    } else if (data.accesos) {
      userModules = Array.isArray(data.accesos) ? data.accesos : [data.accesos];
    } else if (data.menu) {
      // Si viene como menú, extraer los módulos
      userModules = Array.isArray(data.menu) ? data.menu : [data.menu];
    } else if (data.data && Array.isArray(data.data)) {
      // Si viene dentro de data
      userModules = data.data;
    } else if (data.resultado && Array.isArray(data.resultado)) {
      // Si viene como resultado
      userModules = data.resultado;
    } else if (data.usuario && data.usuario.modulos) {
      // Si los módulos están dentro del objeto usuario
      userModules = Array.isArray(data.usuario.modulos) ? data.usuario.modulos : [data.usuario.modulos];
    } else if (data.user && data.user.modules) {
      // Si los módulos están dentro del objeto user
      userModules = Array.isArray(data.user.modules) ? data.user.modules : [data.user.modules];
    }
    
    // Log del usuario que está intentando iniciar sesión
    console.log("Login attempt for user:", email);
    
    console.log("User modules from API (raw):", JSON.stringify(userModules, null, 2));
    console.log("User modules type check:", userModules.map(m => ({ type: typeof m, value: m, keys: typeof m === 'object' && m !== null ? Object.keys(m) : null })));
    console.log("Is Admin:", isAdmin);
    
    // Procesar módulos: si son objetos, extraer el ID o nombre
    const processedModules = userModules
      .filter(mod => mod !== null && mod !== undefined) // Filtrar valores nulos
      .map((mod, index) => {
        try {
          // Si es un objeto, extraer el valor relevante
          if (typeof mod === 'object' && mod !== null) {
            console.log(`Processing module ${index}:`, JSON.stringify(mod, null, 2));
            // Intentar diferentes propiedades comunes - priorizar NOMBRE en mayúsculas
            const extracted = mod.NOMBRE || mod.nombre || mod.Nombre || 
                   mod.id || mod.ID || mod.id_modulo || mod.idModulo || 
                   mod.name || mod.Name ||
                   mod.modulo || mod.Modulo || mod.module || mod.Module ||
                   mod.codigo || mod.Codigo || mod.code || mod.Code ||
                   mod.descripcion || mod.Descripcion || mod.description ||
                   (Object.keys(mod).length > 0 ? Object.values(mod)[0] : null) || // Primer valor del objeto si existe
                   String(mod);
            console.log(`Extracted value for module ${index}:`, extracted);
            return extracted;
          }
          // Si ya es un string, devolverlo
          return String(mod);
        } catch (modError) {
          console.error(`Error processing module ${index}:`, modError);
          return null;
        }
      })
      .filter(mod => mod !== null && mod !== undefined && mod !== ""); // Filtrar valores inválidos
    
    console.log("Processed modules:", processedModules);
    userModules = processedModules;

    // Normalizar nombres de módulos (convertir a minúsculas y mapear)
    // Los módulos ya fueron procesados, así que ahora son strings
    const normalizedModules = userModules
      .map((mod) => {
        // mod ya debería ser un string en este punto
        const modLower = String(mod).toLowerCase().trim();
        
        // Filtrar valores inválidos
        if (!modLower || modLower === "[object object]" || modLower === "null" || modLower === "undefined") {
          return null;
        }
        
        // Buscar coincidencia exacta primero (ya está en minúsculas)
        if (MODULE_MAPPING[modLower]) {
          return MODULE_MAPPING[modLower];
        }
        
        // Buscar coincidencia parcial (case-insensitive)
        for (const [key, value] of Object.entries(MODULE_MAPPING)) {
          const keyLower = key.toLowerCase();
          if (modLower === keyLower || modLower.includes(keyLower) || keyLower.includes(modLower)) {
            return value;
          }
        }
        
        // Mapeo especial para nombres comunes que pueden venir de la API
        const specialMapping = {
          "marketing": "marketing",
          "logistica": "logistica",
          "logística": "logistica",
          "importacion": "importacion",
          "importación": "importacion",
          "gerencia": "gerencia",
          "administracion": "administracion",
          "administración": "administracion",
          "ventas": "ventas",
          "sistemas": "sistemas",
          "facturacion": "facturacion",
          "facturación": "facturacion",
          "recursos humanos": "recursos-humanos",
          "recursos-humanos": "recursos-humanos",
        };
        
        if (specialMapping[modLower]) {
          return specialMapping[modLower];
        }
        
        // Si no encuentra coincidencia, devolver el módulo original normalizado
        return modLower;
      })
      .filter((mod) => mod && mod !== "administrador" && mod !== "[object object]"); // Excluir "administrador" y objetos mal formateados
    
    console.log("Normalized modules:", normalizedModules);

    // Verificar si es administrador en los módulos
    if (!isAdmin && userModules.length > 0) {
      isAdmin = userModules.some(
        (mod) => {
          const modLower = String(mod).toLowerCase().trim();
          return modLower === "administrador" || modLower === "admin" || modLower.includes("administrador");
        }
      );
    }

    // Verificar usuarios específicos que deberían ser admin
    const adminUsers = ["hervinzeus", "hervin", "admin", "administrador"];
    if (!isAdmin && adminUsers.some(adminUser => email.toLowerCase().includes(adminUser))) {
      isAdmin = true;
      console.log("Detected as admin by username:", email);
    }

    // Si no hay módulos pero el usuario existe y la autenticación fue exitosa
    // Podría ser admin o necesitar todos los módulos
    if (!isAdmin && userModules.length === 0 && data && !data.error) {
      // Verificar si hay algún indicador de que debería tener acceso
      const hasAccess = data.acceso !== false && data.activo !== false && data.estado !== "inactivo";
      if (hasAccess) {
        // Si no tiene módulos pero tiene acceso, asumir admin
        isAdmin = true;
        console.log("No modules found but user has access - assuming admin");
      }
    }

    // Si es administrador, tiene acceso a todos los módulos
    const allModules = [
      "gerencia",
      "administracion",
      "importacion",
      "logistica",
      "ventas",
      "marketing",
      "sistemas",
      "recursos-humanos",
      "facturacion",
      "permisos",
    ];

    const finalModules = isAdmin ? allModules : normalizedModules;
    
    console.log("Final modules:", finalModules);
    console.log("Final modules count:", finalModules.length);
    console.log("Final isAdmin:", isAdmin);

    // Construir objeto de usuario
    const user = {
      id: data.id || data.userId || data.id_usuario || email,
      email: email,
      name: data.nombre || data.name || data.usuario || data.username || email,
      modules: finalModules,
      isAdmin: isAdmin,
      rol: data.rol || data.role || (isAdmin ? 1 : 2), // Guardar el rol del usuario
    };

    console.log("=== FINAL USER OBJECT ===");
    console.log("User:", JSON.stringify(user, null, 2));
    console.log("User modules array:", user.modules);
    console.log("User modules length:", user.modules.length);
    console.log("=========================");

    return NextResponse.json({
      success: true,
      token: data.token || data.access_token || `token-${Date.now()}`,
      user: user,
    });
  } catch (error) {
    console.error("=== ERROR EN LOGIN ===");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Full error:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    console.error("=====================");
    
    // Retornar un mensaje de error más específico
    const errorMessage = error.message || "Error al conectar con el servidor";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

