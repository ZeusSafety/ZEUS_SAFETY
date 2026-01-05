import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    // Obtener el token de los headers de la petición
    const authHeader = request.headers.get("authorization");

    // Construir la URL de la API externa
    const apiUrl = "https://api-descuento-reservas-caja-logistica-2946605267.us-central1.run.app/productos/pdf";

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
    const response = await fetch(apiUrl, {
      method: "GET",
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

    // Parsear la respuesta como JSON
    const data = await response.json();

    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error("Error en API descuento-cajas/productos-pdf:", error.message);
    console.error("Stack trace:", error.stack);

    return NextResponse.json(
      {
        error: error.message || "Error al procesar la solicitud",
        details: error.stack
      },
      { status: 500 }
    );
  }
}


