import { NextResponse } from "next/server";

async function fetchFromAPI(method, request, body, params = {}) {
  const authHeader = request.headers.get("authorization");
  let apiUrl = "https://generacionespdfappscript-2946605267.us-central1.run.app";

  // Agregar parámetros de query si existen
  const queryParams = new URLSearchParams();
  if (params.metodo) {
    queryParams.append("metodo", params.metodo);
  }
  if (queryParams.toString()) {
    apiUrl += "?" + queryParams.toString();
  }

  const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json, text/plain, */*",
  };

  if (authHeader && authHeader.trim() !== "") {
    headers["Authorization"] = authHeader;
  }

  const response = await fetch(apiUrl, {
    method: method,
    headers: headers,
    body: JSON.stringify(body),
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

  const data = await response.text();
  return NextResponse.json({ result: data }, { status: 200 });
}

export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const metodo = searchParams.get("metodo") || "ficha_importacion";
    const body = await request.json();

    return fetchFromAPI("POST", request, body, { metodo });
  } catch (error) {
    return NextResponse.json(
      {
        error: error.message || "Error al generar PDF",
        details: error.stack,
      },
      { status: 500 }
    );
  }
}

