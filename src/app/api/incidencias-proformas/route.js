import { NextResponse } from "next/server";

// Función auxiliar para hacer peticiones a la API externa de incidencias proformas
async function fetchFromAPI(method, request, bodyToSend = null) {
  try {
    // Obtener el token de los headers de la petición
    const authHeader = request.headers.get("authorization");

    // Construir la URL base
    const apiUrl = "https://api-incidencias-proformas-zeus-2946605267.us-central1.run.app";

    // Preparar headers para la petición a la API externa
    const headers = {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
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

    const response = await fetch(apiUrl, fetchOptions);

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
    console.error("Error en API incidencias-proformas:", error.message);

    return NextResponse.json(
      {
        error: error.message || "Error al procesar la solicitud",
        details: error.stack
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // Obtener el body de la petición
    const body = await request.json();

    // Llamar a la función auxiliar para hacer la petición a la API externa
    return await fetchFromAPI("POST", request, body);
  } catch (error) {
    console.error("Error en POST incidencias-proformas:", error.message);

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
  try {
    // Llamar a la función auxiliar para hacer la petición a la API externa
    return await fetchFromAPI("GET", request);
  } catch (error) {
    console.error("Error en GET incidencias-proformas:", error.message);

    return NextResponse.json(
      {
        error: error.message || "Error al procesar la solicitud",
        details: error.stack
      },
      { status: 500 }
    );
  }
}

