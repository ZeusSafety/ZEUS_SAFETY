import { NextResponse } from "next/server";

const API_BASE_URL = "https://colaboradores2026-2946605267.us-central1.run.app";

async function fetchFromAPI(method, request, queryParams = {}, body = null) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader ? authHeader.replace("Bearer ", "") : null;

    // Construir URL con query parameters
    const url = new URL(API_BASE_URL);
    Object.keys(queryParams).forEach(key => {
      if (queryParams[key] !== null && queryParams[key] !== undefined) {
        url.searchParams.append(key, queryParams[key]);
      }
    });

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

    const response = await fetch(url.toString(), fetchOptions);

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

      const errorMessage = errorJson?.error || errorJson?.message || errorText || `Error ${response.status}`;

      return NextResponse.json(
        {
          error: errorMessage,
          details: errorText || "No se pudo completar la operación",
          status: response.status
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error(`Error en API medios-comunicacion:`, error);
    return NextResponse.json(
      {
        error: error.message || "Error al procesar la solicitud",
        details: error.stack
      },
      { status: 500 }
    );
  }
}

// GET: Obtener medios de comunicación de un colaborador
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const idColaborador = searchParams.get("id_colaborador");

  if (!idColaborador) {
    return NextResponse.json(
      { error: "Se requiere el parámetro id_colaborador" },
      { status: 400 }
    );
  }

  return fetchFromAPI("GET", request, {
    method: "obtener_medios_comunicacion",
    id_colaborador: idColaborador
  });
}

// POST: Agregar un nuevo medio de comunicación
export async function POST(request) {
  try {
    const body = await request.json();
    return fetchFromAPI("POST", request, {
      metodo: "insertar_medio_comunicacion"
    }, body);
  } catch (error) {
    console.error("Error al parsear body en POST:", error);
    return NextResponse.json(
      { error: "Error al procesar el cuerpo de la petición" },
      { status: 400 }
    );
  }
}

// PUT: Actualizar o eliminar un medio de comunicación
export async function PUT(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action"); // "update" o "delete"
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Se requiere el parámetro id" },
        { status: 400 }
      );
    }

    if (action === "delete") {
      // Eliminar medio de comunicación
      return fetchFromAPI("PUT", request, {
        metodo: "eliminar_medio_comunicacion",
        id: id
      });
    } else {
      // Actualizar medio de comunicación
      const body = await request.json();
      return fetchFromAPI("PUT", request, {
        metodo: "actualizar_medio_comunicacion",
        id: id
      }, body);
    }
  } catch (error) {
    console.error("Error al parsear body en PUT:", error);
    return NextResponse.json(
      { error: "Error al procesar el cuerpo de la petición" },
      { status: 400 }
    );
  }
}

