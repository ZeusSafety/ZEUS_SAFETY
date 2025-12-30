import { NextResponse } from "next/server";

const API_BASE_URL = "https://api-permisoslaborales-2026-2946605267.us-central1.run.app/crud_permisos";

// POST - Agregar Permiso Laboral
export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const metodo = searchParams.get("metodo");

    // Obtener el token de autenticación
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Token no proporcionado" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Leer el body de la petición
    const body = await request.json();

    let apiUrl = API_BASE_URL;
    
    // Si el método es agregar_respuesta, agregar el parámetro
    if (metodo === "agregar_respuesta") {
      apiUrl += `?metodo=agregar_respuesta`;
    } else if (metodo === "agregar_permiso") {
      apiUrl += `?metodo=agregar_permiso`;
    }

    // Hacer la petición a la API externa
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: errorText || `Error ${response.status}` };
      }

      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error en permisos-laborales-crud POST:", error);
    return NextResponse.json(
      { error: error.message || "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar Permiso Laboral
export async function PUT(request) {
  try {
    // Obtener el token de autenticación
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Token no proporcionado" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Leer el body de la petición
    const body = await request.json();

    // Validar que tenga id_permiso
    if (!body.id_permiso) {
      return NextResponse.json(
        { error: "El campo 'id_permiso' es requerido" },
        { status: 400 }
      );
    }

    // Hacer la petición a la API externa
    const response = await fetch(API_BASE_URL, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: errorText || `Error ${response.status}` };
      }

      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error en permisos-laborales-crud PUT:", error);
    return NextResponse.json(
      { error: error.message || "Error al actualizar el permiso" },
      { status: 500 }
    );
  }
}

