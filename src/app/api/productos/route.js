import { NextResponse } from "next/server";

// Función auxiliar para hacer peticiones a la API externa
async function fetchFromAPI(method, request, body = null) {
  try {
    console.log(`=== API PRODUCTOS PROXY - ${method} ===`);
    
    // Obtener el token de los headers de la petición
    const authHeader = request.headers.get("authorization");
    const token = authHeader ? authHeader.replace("Bearer ", "") : null;
    
    console.log("Token recibido:", token ? token.substring(0, 20) + "..." : "No hay token");
    
    // Obtener query parameters de la URL
    const { searchParams } = new URL(request.url);
    const methodParam = searchParams.get("method");
    
    // Si hay un parámetro "method", usar el backend de productos CRUD
    let apiUrl;
    if (methodParam) {
      // Para actualizar imagen o ficha técnica, usar api-productos-zeus (URL correcta)
      apiUrl = `https://api-productos-zeus-2946605267.us-central1.run.app?method=${methodParam}`;
      console.log("Usando backend api-productos-zeus con method:", methodParam);
    } else {
      // Para otras operaciones, usar el backend normal
      apiUrl = "https://api-productos-zeus-2946605267.us-central1.run.app/productos";
    }
    
    console.log("Llamando a API:", apiUrl);
    console.log("Método:", method);
    if (body) {
      console.log("Body:", JSON.stringify(body, null, 2));
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
    if ((method === "POST" || method === "PUT") && body) {
      fetchOptions.body = JSON.stringify(body);
      console.log("📤 Body enviado al backend externo:", JSON.stringify(body, null, 2));
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
          error: "Error al conectar con la API de productos",
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
        // Intentar parsear como JSON
        try {
          errorJson = JSON.parse(errorText);
        } catch (e) {
          // Si no es JSON, usar el texto directamente
        }
      } catch (e) {
        errorText = "No se pudo leer el error de la API";
      }
      
      console.error("=== ERROR DE LA API ===");
      console.error("Status:", response.status);
      console.error("Error text:", errorText);
      console.error("Error JSON:", errorJson);
      console.error("Body enviado:", body ? JSON.stringify(body, null, 2) : "N/A");
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
    
    // Log de la respuesta del backend para debugging
    console.log("📥 Respuesta del backend externo:", JSON.stringify(data, null, 2));
    console.log("📥 Status del backend:", response.status);
    
    console.log("Datos recibidos de la API:", Array.isArray(data) ? `${data.length} productos` : "Objeto único");
    
    return NextResponse.json(data, { status: 200 });
    
  } catch (error) {
    console.error(`=== ERROR EN API PRODUCTOS PROXY - ${method} ===`);
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
    const body = await request.json();
    return fetchFromAPI("POST", request, body);
  } catch (error) {
    console.error("Error al parsear body en POST:", error);
    return NextResponse.json(
      { error: "Error al procesar el cuerpo de la petición" },
      { status: 400 }
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


