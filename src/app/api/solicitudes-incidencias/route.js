import { NextResponse } from "next/server";

// Función auxiliar para hacer peticiones a la API externa de solicitudes/incidencias
async function fetchFromAPI(method, request, bodyToSend = null, params = {}) {
  try {
    // Obtener el token de los headers de la petición
    const authHeader = request.headers.get("authorization");

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
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    };

    // Incluir token si está disponible
    if (authHeader && authHeader.trim() !== "") {
      headers["Authorization"] = authHeader;
    }

    if (!(bodyToSend instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    // Realizar la petición
    const fetchOptions = {
      method: method,
      headers: headers,
      body: bodyToSend
    };

    if (bodyToSend instanceof FormData) {
      delete fetchOptions.headers['Content-Type'];
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

  // Si viene el parámetro "listado" (como en el código antiguo), usarlo directamente
  const listadoParam = searchParams.get("listado");
  
  if (listadoParam) {
    // Construir URL directamente con listado (formato del código antiguo)
    const apiUrl = `https://api-incidencias-solicitudes-2946605267.us-central1.run.app?listado=${listadoParam}`;
    
    // Preparar headers
    const headers = {
      "Accept": "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    };

    // Incluir token si está disponible
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.trim() !== "") {
      headers["Authorization"] = authHeader;
    }

    try {
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: headers,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        return NextResponse.json(
          {
            error: `Error ${response.status}`,
            details: errorText || "No se pudo completar la operación",
            status: response.status
          },
          { status: response.status }
        );
      }

      const data = await response.json();
      return NextResponse.json(data, { status: 200 });
    } catch (error) {
      console.error("Error en API solicitudes-incidencias (listado):", error.message);
      return NextResponse.json(
        {
          error: error.message || "Error al procesar la solicitud",
          details: error.stack
        },
        { status: 500 }
      );
    }
  }

  // Si no viene "listado", usar el formato anterior con method y area
  const areaParam = searchParams.get("area") || "TODAS";

  const params = {
    method: searchParams.get("method") || "listado_solicitudes",
    id: searchParams.get("id"),
    area: areaParam,
    estado: searchParams.get("estado"),
    colaborador: searchParams.get("colaborador"),
  };

  // Construir URL con los parámetros
  const queryParams = new URLSearchParams();
  if (params.method) queryParams.append("method", params.method);
  if (params.id) queryParams.append("id", params.id);
  if (params.area) queryParams.append("area", params.area);
  if (params.estado) queryParams.append("estado", params.estado);
  if (params.colaborador) queryParams.append("colaborador", params.colaborador);
  
  const apiUrl = `https://api-incidencias-solicitudes-2946605267.us-central1.run.app${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  
  const authHeader = request.headers.get("authorization");
  const headers = {
    "Accept": "application/json",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  };
  
  if (authHeader && authHeader.trim() !== "") {
    headers["Authorization"] = authHeader;
  }
  
  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: headers,
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return NextResponse.json(
        {
          error: `Error ${response.status}`,
          details: errorText || "No se pudo completar la operación",
          status: response.status
        },
        { status: response.status }
      );
    }
    
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

export async function POST(request) {
  try {

    const body = await request.formData();
    return fetchFromAPI("POST", request, body, {});

  } catch (error) {
    console.error("Error en POST/route.js:", error.message);
    return NextResponse.json(
      { error: "Error al procesar el cuerpo de la petición (POST)" },
      { status: 400 }
    );
  }
}

