import { NextResponse } from "next/server";

async function fetchFromAPI(method, request) {
  const authHeader = request.headers.get("authorization");
  const apiUrl = "https://productoscrud-2946605267.us-central1.run.app";

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
    return fetchFromAPI("GET", request);
  } catch (error) {
    return NextResponse.json(
      {
        error: error.message || "Error al obtener productos",
        details: error.stack,
      },
      { status: 500 }
    );
  }
}

