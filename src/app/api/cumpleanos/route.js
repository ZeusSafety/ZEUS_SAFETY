import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    console.log("=== API CUMPLEAÑOS PROXY ===");
    
    // Obtener el token de los headers de la petición
    const authHeader = request.headers.get("authorization");
    const token = authHeader ? authHeader.replace("Bearer ", "") : null;
    
    console.log("Token recibido:", token ? token.substring(0, 20) + "..." : "No hay token");
    
    const apiUrl = "https://colaboradores2026-2946605267.us-central1.run.app?method=calendario_cumpleaños";
    
    console.log("Llamando a API:", apiUrl);
    
    // Preparar headers para la petición a la API externa
    const headers = {
      "Content-Type": "application/json",
      "Accept": "application/json",
    };
    
    // Incluir token si está disponible
    if (token && token.trim() !== "") {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    let response;
    try {
      response = await fetch(apiUrl, {
        method: "GET",
        headers: headers,
      });
      
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
          error: "Error al conectar con la API de cumpleaños",
          details: fetchError.message 
        },
        { status: 503 }
      );
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error de la API:", response.status, errorText);
      
      return NextResponse.json(
        { 
          error: `Error ${response.status} al obtener cumpleaños`,
          details: errorText || "No se pudieron obtener los datos"
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
    console.error("=== ERROR EN API CUMPLEAÑOS PROXY ===");
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



