import { NextResponse } from "next/server";

// Función auxiliar para hacer peticiones a la API externa de incidencias proformas-actas
async function fetchFromAPI(method, request, bodyToSend = null, params = {}) {
  try {
    // Construir la URL base
    let apiUrl = "https://incidenciaslogisticaproformas-2946605267.us-central1.run.app";

    // Agregar parámetros de query si existen
    const queryParams = new URLSearchParams();
    if (params.tipo) {
      queryParams.append("tipo", params.tipo);
    }
    if (params.id) {
      queryParams.append("id", params.id);
    }
    if (params.metodo) {
      queryParams.append("metodo", params.metodo);
    }

    if (queryParams.toString()) {
      apiUrl += "?" + queryParams.toString();
    }

    console.log("🌐 URL final del API:", apiUrl);
    console.log("📋 Parámetros:", params);

    // Obtener el token de autorización si está disponible
    const authHeader = request.headers.get("authorization");
    
    // Preparar headers para la petición a la API externa
    const headers = {
      "Accept": "application/json",
      "Content-Type": "application/json",
    };
    
    // Incluir token si está disponible
    if (authHeader && authHeader.trim() !== "") {
      headers["Authorization"] = authHeader;
    }

    // Realizar la petición
    const fetchOptions = {
      method: method,
      headers: headers,
    };

    // Agregar body solo si existe y no es null
    if (bodyToSend) {
      fetchOptions.body = typeof bodyToSend === "string" ? bodyToSend : JSON.stringify(bodyToSend);
    }

    console.log("📤 Enviando petición:", method, apiUrl);
    const response = await fetch(apiUrl, fetchOptions);
    console.log("📥 Respuesta recibida - Status:", response.status, "OK:", response.ok);

    // Manejar errores de respuesta
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error en API externa (${response.status}):`, errorText);
      return NextResponse.json(
        { error: `Error ${response.status}: ${errorText}` },
        { status: response.status }
      );
    }

    // Intentar parsear como JSON, si falla devolver texto
    const contentType = response.headers.get("content-type");
    console.log("📄 Content-Type:", contentType);
    
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      console.log("📊 Datos parseados del API externo:", typeof data, Array.isArray(data) ? `Array con ${data.length} elementos` : "Objeto");
      console.log("📊 Primeros datos:", JSON.stringify(data).substring(0, 500));
      
      // Si el API externo devuelve un objeto con "result" que es un string JSON, parsearlo
      if (data && data.result && typeof data.result === 'string') {
        try {
          const parsed = JSON.parse(data.result);
          console.log("📊 Result parseado:", typeof parsed, Array.isArray(parsed) ? `Array con ${parsed.length} elementos` : "Objeto");
          return NextResponse.json(parsed, { status: 200 });
        } catch (e) {
          console.error("❌ Error parseando result string:", e);
          return NextResponse.json(data, { status: 200 });
        }
      }
      
      return NextResponse.json(data, { status: 200 });
    } else {
      const text = await response.text();
      console.log("📄 Respuesta como texto:", text.substring(0, 500));
      // Intentar parsear el texto como JSON
      try {
        const parsed = JSON.parse(text);
        return NextResponse.json(parsed, { status: 200 });
      } catch (e) {
        return NextResponse.json({ result: text }, { status: 200 });
      }
    }
  } catch (error) {
    console.error("Error en fetchFromAPI:", error);
    return NextResponse.json(
      { error: error.message || "Error al conectar con la API" },
      { status: 500 }
    );
  }
}

// GET: Obtener listado o detalles
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get("tipo");
  const id = searchParams.get("id");

  const params = {};
  if (tipo) params.tipo = tipo;
  if (id) params.id = id;

  return fetchFromAPI("GET", request, null, params);
}

// PUT: Actualizar verificación o culminado
export async function PUT(request) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const metodo = searchParams.get("metodo");

    const params = {};
    if (metodo) params.metodo = metodo;

    return fetchFromAPI("PUT", request, body, params);
  } catch (error) {
    console.error("Error en PUT:", error);
    return NextResponse.json(
      { error: error.message || "Error al procesar la petición" },
      { status: 400 }
    );
  }
}

// POST: Crear nuevo registro (si es necesario)
export async function POST(request) {
  try {
    const body = await request.json();
    return fetchFromAPI("POST", request, body, {});
  } catch (error) {
    console.error("Error en POST:", error);
    return NextResponse.json(
      { error: error.message || "Error al procesar la petición" },
      { status: 400 }
    );
  }
}

