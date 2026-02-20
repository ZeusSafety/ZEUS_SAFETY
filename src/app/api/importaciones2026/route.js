import { NextResponse } from "next/server";

async function fetchFromAPI(method, request, body = null, isFormData = false) {
  try {
    const authHeader = request.headers.get("authorization");
    let apiUrl = "https://importaciones2026-2946605267.us-central1.run.app";

    // Obtener parámetros de query de la URL de la petición
    const { searchParams } = new URL(request.url);
    const area = searchParams.get("area");
    
    // Si hay parámetros de query, agregarlos a la URL de la API externa
    if (area) {
      apiUrl += `?area=${encodeURIComponent(area)}`;
    }

    const headers = {
      "Accept": "application/json",
    };

    // Solo agregar Content-Type si NO es FormData
    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }

    if (authHeader && authHeader.trim() !== "") {
      headers["Authorization"] = authHeader;
    }

    const fetchOptions = {
      method: method,
      headers: headers,
    };

    if ((method === "POST" || method === "PUT") && body) {
      if (isFormData) {
        // Si es FormData, pasarlo directamente y eliminar Content-Type
        fetchOptions.body = body;
        // Eliminar Content-Type para que Node.js lo configure automáticamente con el boundary
        delete fetchOptions.headers['Content-Type'];
      } else {
        // Si es JSON, stringificarlo
        fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
        console.log('📤 Enviando body JSON a API externa:', fetchOptions.body);
      }
    }

    console.log('📤 URL:', apiUrl);
    console.log('📤 Método:', method);
    console.log('📤 Headers:', fetchOptions.headers);
    console.log('📤 Es FormData:', isFormData);

    const response = await fetch(apiUrl, fetchOptions);

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json(
          { error: "token expirado", message: "El token de autenticación ha expirado o es inválido." },
          { status: 401 }
        );
      }
      const errorText = await response.text().catch(() => "");
      let errorJson = null;
      try {
        errorJson = JSON.parse(errorText);
      } catch (e) {}
      const errorMessage = errorJson?.error || errorJson?.message || errorText || `Error ${response.status} en la operación`;
      return NextResponse.json(
        { error: errorMessage, details: errorText, status: response.status },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error en API proxy importaciones2026:", error);
    return NextResponse.json(
      { error: "Error al conectar con el servidor", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  return fetchFromAPI("GET", request);
}

export async function PUT(request) {
  try {
    const contentType = request.headers.get("content-type");
    
    // Verificar si es multipart/form-data (FormData con archivos)
    if (contentType && contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      return fetchFromAPI("PUT", request, formData, true);
    } else {
      // Si es JSON
      const body = await request.json();
      return fetchFromAPI("PUT", request, body, false);
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Error al procesar el cuerpo de la petición", details: error.message },
      { status: 400 }
    );
  }
}

