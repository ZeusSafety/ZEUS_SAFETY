import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const usuarioId = searchParams.get("id");

    if (!usuarioId) {
      return NextResponse.json(
        { error: "El parámetro 'id' es requerido" },
        { status: 400 }
      );
    }

    // Obtener el token de autenticación del header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Token no proporcionado" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Llamar a la API externa de permisos laborales
    const apiUrl = `https://api-permisoslaborales-2026-2946605267.us-central1.run.app?metodo=listado_colaborador&id=${encodeURIComponent(usuarioId)}`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: errorText || `Error ${response.status}` };
      }

      return NextResponse.json(
        errorData,
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error en permisos-laborales API route:", error);
    return NextResponse.json(
      { error: error.message || "Error al obtener permisos laborales" },
      { status: 500 }
    );
  }
}

