import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const user = searchParams.get("user");

    if (!user) {
      return NextResponse.json(
        { error: "El parámetro 'user' es requerido" },
        { status: 400 }
      );
    }

    // Obtener el token del header Authorization
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Token de autenticación no proporcionado" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Llamar a la API externa
    const apiUrl = `https://api-login-accesos-2946605267.us-central1.run.app?metodo=get_permissions&user=${encodeURIComponent(user)}`;

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
    console.error("Error en get-permissions API route:", error);
    return NextResponse.json(
      { error: error.message || "Error al obtener permisos" },
      { status: 500 }
    );
  }
}

