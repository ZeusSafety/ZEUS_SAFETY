import { NextResponse } from "next/server";

async function fetchFromAPI(method, request, params = {}) {
  const authHeader = request.headers.get("authorization");
  let apiUrl = "https://importacionesvr01crud-2946605267.us-central1.run.app";

  // Agregar parámetros de query si existen
  const queryParams = new URLSearchParams();
  if (params.despacho) {
    queryParams.append("despacho", params.despacho);
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

  const response = await fetch(apiUrl, {
    method: method,
    headers: headers,
  });

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

  const data = await response.json();
  return NextResponse.json(data, { status: 200 });
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const despacho = searchParams.get("despacho");

    return fetchFromAPI("GET", request, { despacho });
  } catch (error) {
    return NextResponse.json(
      {
        error: error.message || "Error al obtener importación",
        details: error.stack,
      },
      { status: 500 }
    );
  }
}

