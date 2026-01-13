import { NextResponse } from "next/server";

// Función auxiliar para hacer peticiones a la API externa de inventario
async function fetchFromAPI(method, request, bodyToSend = null) {
  try {
    console.log(`=== API INVENTARIO PROXY - ${method} ===`);

    // Obtener el token de los headers de la petición
    const authHeader = request.headers.get("authorization");
    const token = authHeader ? authHeader.replace("Bearer ", "") : null;

    console.log("Token recibido:", token ? token.substring(0, 20) + "..." : "No hay token");

    // Obtener query parameters de la URL
    const { searchParams } = new URL(request.url);
    const methodParam = searchParams.get("method");
    const idParam = searchParams.get("id");
    const selectorParam = searchParams.get("selector");

    // Construir URL base
    let apiUrl = "https://api-inventario-logistica-2946605267.us-central1.run.app";

    // Construir query string
    const queryParams = new URLSearchParams();
    if (methodParam) {
      queryParams.append("method", methodParam);
    }
    if (idParam) {
      queryParams.append("id", idParam);
    }
    if (selectorParam) {
      queryParams.append("selector", selectorParam);
    }

    if (queryParams.toString()) {
      apiUrl += "?" + queryParams.toString();
    }

    console.log("Llamando a API:", apiUrl);
    console.log("Método:", method);
    if (bodyToSend) {
      console.log("Body:", typeof bodyToSend === "string" ? bodyToSend.substring(0, 200) : JSON.stringify(bodyToSend).substring(0, 200));
    }

    // Preparar headers para la petición a la API externa
    const headers = {
      "Content-Type": "application/json",
      "Accept": "application/json",
    };

    // Incluir token si está disponible
    if (token && token.trim() !== "") {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Configurar opciones de fetch
    const fetchOptions = {
      method: method,
      headers: headers,
    };

    // Agregar body solo para POST y PUT
    if ((method === "POST" || method === "PUT") && bodyToSend) {
      // Asegurarse de que el body sea un string JSON válido
      if (typeof bodyToSend === "string") {
        try {
          // Validar que sea JSON válido
          JSON.parse(bodyToSend);
          fetchOptions.body = bodyToSend;
        } catch (e) {
          console.error("Body no es JSON válido:", bodyToSend.substring(0, 200));
          throw new Error("El cuerpo de la petición no es un JSON válido");
        }
      } else {
        fetchOptions.body = JSON.stringify(bodyToSend);
        console.log("Body stringificado:", fetchOptions.body.substring(0, 200));
      }
    }

    let response;
    try {
      response = await fetch(apiUrl, fetchOptions);

      console.log("Response status:", response.status);
      console.log("Response headers:", Object.fromEntries(response.headers.entries()));
    } catch (fetchError) {
      console.error("Error en fetch:", fetchError);
      console.error("Error details:", {
        name: fetchError.name,
        message: fetchError.message,
        stack: fetchError.stack,
      });

      return NextResponse.json(
        {
          error: "Error al conectar con la API de inventario",
          details: fetchError.message
        },
        { status: 503 }
      );
    }

    if (!response.ok) {
      let errorText = "";
      let errorJson = null;

      try {
        errorText = await response.text();
        try {
          errorJson = JSON.parse(errorText);
        } catch (e) {
          // Si no es JSON, usar el texto como error
        }
      } catch (e) {
        errorText = "No se pudo leer el error de la API";
      }

      console.error("=== ERROR DE LA API ===");
      console.error("Status:", response.status);
      console.error("Error text:", errorText);
      console.error("Error JSON:", errorJson);
      console.error("======================");

      const errorMessage = errorJson?.error || errorJson?.message || errorText || `Error ${response.status} en la operación`;

      return NextResponse.json(
        {
          error: errorMessage,
          details: errorText || "No se pudo completar la operación",
          status: response.status
        },
        { status: response.status }
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
      } catch (parseError) {
        console.error("Error al parsear respuesta:", parseError);
        return NextResponse.json(
          { error: "La respuesta no es un JSON válido" },
          { status: 500 }
        );
      }
    }

    console.log("Datos recibidos de la API:", Array.isArray(data) ? `${data.length} registros` : "Objeto único");

    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error(`=== ERROR EN API INVENTARIO PROXY - ${method} ===`);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("=====================");

    return NextResponse.json(
      {
        error: error.message || "Error al procesar la solicitud",
        details: error.stack
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  return fetchFromAPI("GET", request);
}

export async function POST(request) {
  try {
    // Para POST, puede venir como JSON o FormData (para archivos)
    const contentType = request.headers.get("content-type");
    
    if (contentType && contentType.includes("multipart/form-data")) {
      // Si es FormData, pasarlo directamente a la API externa
      const formData = await request.formData();
      
      // Obtener el token
      const authHeader = request.headers.get("authorization");
      const token = authHeader ? authHeader.replace("Bearer ", "") : null;
      
      // Obtener query parameters
      const { searchParams } = new URL(request.url);
      const methodParam = searchParams.get("method");
      
      // Construir URL
      let apiUrl = "https://api-inventario-logistica-2946605267.us-central1.run.app";
      if (methodParam) {
        apiUrl += `?method=${methodParam}`;
      }
      
      // Headers para FormData (sin Content-Type, el navegador lo establece)
      const headers = {};
      if (token && token.trim() !== "") {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: headers,
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        return NextResponse.json(
          { error: errorText || `Error ${response.status}` },
          { status: response.status }
        );
      }
      
      const data = await response.json();
      return NextResponse.json(data, { status: 200 });
    } else {
      // Si es JSON, parsearlo
      try {
        const body = await request.json();
        console.log("Body parseado:", JSON.stringify(body));
        return fetchFromAPI("POST", request, body);
      } catch (parseError) {
        console.error("Error al parsear JSON:", parseError);
        // Intentar leer como texto para debugging
        const textBody = await request.text();
        console.error("Body recibido (texto):", textBody.substring(0, 500));
        throw parseError;
      }
    }
  } catch (error) {
    console.error("=== ERROR AL PARSEAR BODY EN POST ===");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Content-Type recibido:", request.headers.get("content-type"));
    console.error("================================");
    
    // Si el error es porque el body está vacío o no es JSON válido
    if (error.message.includes("JSON") || error.message.includes("Unexpected")) {
      return NextResponse.json(
        { 
          error: "El cuerpo de la petición no es un JSON válido",
          details: error.message
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: "Error al procesar el cuerpo de la petición",
        details: error.message
      },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    return fetchFromAPI("PUT", request, body);
  } catch (error) {
    console.error("Error al parsear body en PUT:", error);
    return NextResponse.json(
      { error: "Error al procesar el cuerpo de la petición" },
      { status: 400 }
    );
  }
}

export async function OPTIONS(request) {
  // Manejar preflight CORS
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
