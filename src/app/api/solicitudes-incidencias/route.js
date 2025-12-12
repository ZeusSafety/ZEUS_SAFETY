import { NextResponse } from "next/server";

const API_ENDPOINT = "https://api-incidencias-solicitudes-2946605267.us-central1.run.app";

// Función auxiliar para hacer peticiones a la API externa
async function fetchFromAPI(method, request, body = null) {
  try {
    console.log(`=== API SOLICITUDES INCIDENCIAS PROXY - ${method} ===`);
    
    // Obtener el token de los headers de la petición
    const authHeader = request.headers.get("authorization");
    
    console.log("Token recibido:", authHeader ? authHeader.substring(0, 30) + "..." : "No hay token");
    console.log("Llamando a API:", API_ENDPOINT);
    console.log("Método:", method);
    
    // Preparar headers para la petición a la API externa
    const headers = {
      "Accept": "application/json",
    };
    
    // Incluir token si está disponible
    if (authHeader && authHeader.trim() !== "") {
      // Reenviar exactamente lo que llegó en Authorization
      headers["Authorization"] = authHeader;
    }
    
    // Para FormData, no establecer Content-Type (el navegador lo hace automáticamente)
    // Para JSON, establecer Content-Type
    if (body instanceof FormData) {
      // No establecer Content-Type para FormData
    } else {
      headers["Content-Type"] = "application/json";
    }
    
    // Configurar opciones de fetch
    const fetchOptions = {
      method: method,
      headers: headers,
    };
    
    // Agregar body solo para POST y PUT
    if ((method === "POST" || method === "PUT") && body) {
      if (body instanceof FormData) {
        fetchOptions.body = body;
      } else {
        fetchOptions.body = JSON.stringify(body);
      }
    }
    
    let response;
    try {
      response = await fetch(API_ENDPOINT, fetchOptions);
      
      console.log("Response status:", response.status);
      console.log("Response headers:", Object.fromEntries(response.headers.entries()));
    } catch (fetchError) {
      console.error("Error en fetch:", fetchError);
      return NextResponse.json(
        {
          error: "Error al conectar con la API de solicitudes e incidencias",
          details: fetchError.message
        },
        { status: 503 }
      );
    }
    
    // Leer la respuesta
    let responseData;
    const contentType = response.headers.get("content-type");
    
    if (contentType && contentType.includes("application/json")) {
      try {
        responseData = await response.json();
      } catch (parseError) {
        console.error("Error al parsear JSON:", parseError);
        const textResponse = await response.text();
        console.error("Response text:", textResponse);
        return NextResponse.json(
          {
            error: "Error al procesar la respuesta del servidor",
            details: textResponse
          },
          { status: 500 }
        );
      }
    } else {
      responseData = await response.text();
    }
    
    // Retornar la respuesta con los mismos headers CORS
    return NextResponse.json(responseData, {
      status: response.status,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
      },
    });
    
  } catch (error) {
    console.error("Error general en fetchFromAPI:", error);
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error.message
      },
      { status: 500 }
    );
  }
}

// Manejar GET
export async function GET(request) {
  return fetchFromAPI("GET", request);
}

// Manejar POST
export async function POST(request) {
  try {
    // Determinar si el body es FormData o JSON
    const contentType = request.headers.get("content-type") || "";
    
    let body = null;
    
    if (contentType.includes("multipart/form-data")) {
      // Es FormData
      body = await request.formData();
    } else if (contentType.includes("application/json")) {
      // Es JSON
      body = await request.json().catch(() => null);
    }
    
    return fetchFromAPI("POST", request, body);
  } catch (error) {
    console.error("Error en POST:", error);
    return NextResponse.json(
      {
        error: "Error al procesar la petición",
        details: error.message
      },
      { status: 400 }
    );
  }
}

// Manejar PUT
export async function PUT(request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    
    let body = null;
    
    if (contentType.includes("multipart/form-data")) {
      body = await request.formData();
    } else if (contentType.includes("application/json")) {
      body = await request.json().catch(() => null);
    }
    
    return fetchFromAPI("PUT", request, body);
  } catch (error) {
    console.error("Error en PUT:", error);
    return NextResponse.json(
      {
        error: "Error al procesar la petición",
        details: error.message
      },
      { status: 400 }
    );
  }
}

// Manejar OPTIONS (preflight)
export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
    },
  });
}

