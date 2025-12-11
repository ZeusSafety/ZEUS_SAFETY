import { NextResponse } from "next/server";

// Función auxiliar para hacer peticiones a la API externa de solicitudes/incidencias
async function fetchFromAPI(method, request, params = {}) {
  try {
    // Obtener el token de los headers de la petición
    const authHeader = request.headers.get("authorization");
    const token = authHeader ? authHeader.replace("Bearer ", "") : null;
    
    // Construir la URL base
    let apiUrl = "https://api-incidencias-solicitudes-2946605267.us-central1.run.app";
    
    // Agregar parámetros de query si existen
    const queryParams = new URLSearchParams();
    if (params.method) {
      queryParams.append("method", params.method);
    }
    if (params.id) {
      queryParams.append("id", params.id);
    }
    if (params.area) {
      queryParams.append("area", params.area);
    }
    if (params.estado) {
      queryParams.append("estado", params.estado);
    }
    if (params.colaborador) {
      queryParams.append("colaborador", params.colaborador);
    }
    
    if (queryParams.toString()) {
      apiUrl += "?" + queryParams.toString();
    }
    
    // Preparar headers para la petición a la API externa
    const headers = {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    };
    
    // Incluir token si está disponible
    if (token && token.trim() !== "") {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    // Realizar la petición
    const response = await fetch(apiUrl, {
      method: method,
      headers: headers,
    });
    
    // Manejar errores de respuesta
    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json(
          { 
            error: "token expirado",
            message: "El token de autenticación ha expirado o es inválido. Por favor, inicie sesión nuevamente.",
            status: 401
          },
          { status: 401 }
        );
      }
      
      const errorText = await response.text().catch(() => "");
      let errorJson = null;
      try {
        errorJson = JSON.parse(errorText);
      } catch (e) {
        // No es JSON, usar texto directamente
      }
      
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
    
    // Parsear la respuesta como JSON directamente
    const data = await response.json();
    
    return NextResponse.json(data, { status: 200 });
    
  } catch (error) {
    console.error("Error en API solicitudes-incidencias:", error.message);
    
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
  const { searchParams } = new URL(request.url);
  
  // El procedimiento almacenado requiere al menos un parámetro (probablemente el área)
  // Si no se proporciona área, usar "TODAS" o un valor por defecto
  const areaParam = searchParams.get("area") || "TODAS";
  
  const params = {
    method: searchParams.get("method") || "listado_solicitudes",
    id: searchParams.get("id"),
    area: areaParam, // Siempre enviar área, al menos con valor por defecto
    estado: searchParams.get("estado"),
    colaborador: searchParams.get("colaborador"),
  };
  
  return fetchFromAPI("GET", request, params);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const params = {
      method: body.method || "crear_solicitud",
      ...body
    };
    return fetchFromAPI("POST", request, params);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al procesar el cuerpo de la petición" },
      { status: 400 }
    );
  }
}

