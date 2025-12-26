import { NextResponse } from "next/server";

async function fetchFromAPI(method, request, body = null) {
  try {
    console.log(`=== API COLABORADORES PROXY - ${method} ===`);

    const authHeader = request.headers.get("authorization");
    const token = authHeader ? authHeader.replace("Bearer ", "") : null;

    console.log("Token recibido:", token ? token.substring(0, 20) + "..." : "No hay token");

    // Obtener query parameters de la URL
    const { searchParams } = new URL(request.url);
    const methodParam = searchParams.get("method") || searchParams.get("metodo");

    // Construir URL según el método
    let apiUrl = "https://colaboradores2026-2946605267.us-central1.run.app";
    
    if (method === "GET") {
      if (methodParam) {
        // Si hay un método específico, usarlo
        apiUrl += `?method=${methodParam}`;
        // Agregar otros parámetros si existen
        const idColaborador = searchParams.get("id_colaborador");
        if (idColaborador) {
          apiUrl += `&id_colaborador=${idColaborador}`;
        }
      } else {
        apiUrl += "?method=listado_colaboradores";
      }
    } else if (method === "PUT") {
      if (methodParam) {
        apiUrl += `?metodo=${methodParam}`;
        // Agregar ID si existe
        const id = searchParams.get("id");
        if (id) {
          apiUrl += `&id=${id}`;
        }
      } else {
        apiUrl += "?method=actualizar_colaborador";
      }
    } else if (method === "POST") {
      if (methodParam) {
        apiUrl += `?metodo=${methodParam}`;
      }
    }

    console.log("Llamando a API:", apiUrl);
    console.log("Método:", method);
    if (body) {
      console.log("Body:", JSON.stringify(body, null, 2));
    }

    const headers = {
      "Content-Type": "application/json",
      "Accept": "application/json",
    };

    if (token && token.trim() !== "") {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const fetchOptions = {
      method: method,
      headers: headers,
    };

    if ((method === "POST" || method === "PUT") && body) {
      fetchOptions.body = JSON.stringify(body);
    }

    let response;
    try {
      response = await fetch(apiUrl, fetchOptions);

      console.log("Response status:", response.status);
      console.log("Response headers:", Object.fromEntries(response.headers.entries()));
    } catch (fetchError) {
      console.error("Error en fetch:", fetchError);
      return NextResponse.json(
        {
          error: "Error al conectar con la API de colaboradores",
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
        } catch (e) {}
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

    console.log("Datos recibidos de la API:", Array.isArray(data) ? `${data.length} colaboradores` : "Objeto único");

    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error(`=== ERROR EN API COLABORADORES PROXY - ${method} ===`);
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

