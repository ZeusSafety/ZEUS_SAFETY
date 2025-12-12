import { NextResponse } from "next/server";

// Función auxiliar para hacer peticiones a la API externa de franja de precios
async function fetchFromAPI(method, request, tablaId) {
  try {
    // Obtener el token de los headers de la petición
    const authHeader = request.headers.get("authorization");
    const token = authHeader ? authHeader.replace("Bearer ", "") : null;
    
    // Construir la URL con los parámetros correctos
    const apiUrl = `https://api-productos-zeus-2946605267.us-central1.run.app?method=franja_precios&id=${encodeURIComponent(tablaId)}`;
    
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
    console.error("Error en API franja precios:", error.message);
    
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
  const tablaId = searchParams.get("id") || "MALVINAS";
  
  return fetchFromAPI("GET", request, tablaId);
}

