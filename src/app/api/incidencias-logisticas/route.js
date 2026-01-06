import { NextResponse } from "next/server";

async function fetchFromAPI(method, request, body = null, params = {}) {
  const authHeader = request.headers.get("authorization");
  let apiUrl = "https://incidenciaslogisticacrud-2946605267.us-central1.run.app";

  // Agregar parámetros de query si existen
  const queryParams = new URLSearchParams();
  if (params.id) {
    queryParams.append("id", params.id);
  }
  if (queryParams.toString()) {
    apiUrl += "?" + queryParams.toString();
  }

  const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
  };

  if (authHeader && authHeader.trim() !== "") {
    headers["Authorization"] = authHeader;
  }

  const fetchOptions = { method: method, headers: headers };
  if ((method === "POST" || method === "PUT") && body) {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(apiUrl, fetchOptions);

  if (!response.ok) {
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

  const data = await response.text();
  // Intentar parsear como JSON, si falla devolver el texto como string
  try {
    const parsed = JSON.parse(data);
    return NextResponse.json(parsed, { status: 200 });
  } catch (e) {
    // Si no es JSON válido, devolver como texto pero en formato JSON
    return NextResponse.json(data, { status: 200 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    return fetchFromAPI("GET", request, null, { id });
  } catch (error) {
    return NextResponse.json(
      {
        error: error.message || "Error al obtener incidencias",
        details: error.stack,
      },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    return fetchFromAPI("PUT", request, body);
  } catch (error) {
    return NextResponse.json(
      {
        error: error.message || "Error al actualizar incidencia",
        details: error.stack,
      },
      { status: 500 }
    );
  }
}

