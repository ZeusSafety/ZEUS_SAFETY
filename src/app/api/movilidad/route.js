import { NextResponse } from "next/server";

// URL base de la API externa
const API_BASE_URL = "https://api-gestion-trasporte-zeus-combustible-cochera-2946605267.us-central1.run.app";

/**
 * Función auxiliar para hacer peticiones a la API externa de movilidad
 */
async function fetchFromAPI(method, request, bodyToSend = null) {
  try {
    console.log(`=== API MOVILIDAD PROXY - ${method} ===`);

    // Obtener el token de los headers de la petición
    const authHeader = request.headers.get("authorization");
    const token = authHeader ? authHeader.replace("Bearer ", "") : null;

    console.log("Token recibido:", token ? token.substring(0, 20) + "..." : "No hay token");

    // Obtener query parameters de la URL
    const { searchParams } = new URL(request.url);
    const methodParam = searchParams.get("method");

    // Construir URL base
    let apiUrl = API_BASE_URL;
    if (methodParam) {
      apiUrl += `?method=${methodParam}`;
    }

    console.log("Llamando a API:", apiUrl);
    console.log("Método:", method);

    // Preparar headers para la petición a la API externa
    const headers = {
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

    // Agregar body solo para POST
    if (method === "POST" && bodyToSend) {
      fetchOptions.body = bodyToSend;
    }

    let response;
    try {
      response = await fetch(apiUrl, fetchOptions);

      console.log("Response status:", response.status);
    } catch (fetchError) {
      console.error("Error en fetch:", fetchError);
      return NextResponse.json(
        {
          error: "Error al conectar con la API de movilidad",
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
    console.error(`=== ERROR EN API MOVILIDAD PROXY - ${method} ===`);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

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
    // Para POST, puede venir como FormData (para archivos)
    const contentType = request.headers.get("content-type");
    
    if (contentType && contentType.includes("multipart/form-data")) {
      // Si es FormData, pasarlo directamente a la API externa
      const formData = await request.formData();
      
      // Debug: verificar el valor de tipo_combustible antes de enviarlo al backend
      const tipoCombustibleValue = formData.get("tipo_combustible");
      if (tipoCombustibleValue) {
        console.log("=== DEBUG MOVILIDAD API ===");
        console.log("tipo_combustible recibido:", tipoCombustibleValue);
        console.log("Tipo de dato:", typeof tipoCombustibleValue);
        console.log("Longitud:", tipoCombustibleValue.length);
        console.log("Representación string:", String(tipoCombustibleValue));
      }
      
      // Obtener el token
      const authHeader = request.headers.get("authorization");
      const token = authHeader ? authHeader.replace("Bearer ", "") : null;
      
      // Obtener query parameters
      const { searchParams } = new URL(request.url);
      const methodParam = searchParams.get("method");
      
      // Construir URL
      let apiUrl = API_BASE_URL;
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
        let errorJson;
        try {
          errorJson = JSON.parse(errorText);
        } catch {
          errorJson = { error: errorText || `Error ${response.status}` };
        }
        return NextResponse.json(
          { error: errorJson.error || errorText || `Error ${response.status}` },
          { status: response.status }
        );
      }
      
      const data = await response.json();
      return NextResponse.json(data, { status: 200 });
    } else {
      // Si es JSON, parsearlo
      const body = await request.json();
      return fetchFromAPI("POST", request, JSON.stringify(body));
    }
  } catch (error) {
    console.error("Error al procesar POST:", error);
    return NextResponse.json(
      { 
        error: "Error al procesar el cuerpo de la petición",
        details: error.message
      },
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
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
