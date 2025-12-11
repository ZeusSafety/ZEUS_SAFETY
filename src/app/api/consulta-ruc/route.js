import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { ruc } = body;

    if (!ruc) {
      return NextResponse.json(
        { error: "RUC es requerido" },
        { status: 400 }
      );
    }

    const apiUrl = "https://web-scrapping-2946605267.us-central1.run.app/consulta-ruc";
    
    console.log("Consultando RUC:", ruc);
    console.log("URL de la API:", apiUrl);
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      body: JSON.stringify({ ruc: ruc.trim() }),
    });

    console.log("Status de la respuesta:", response.status);
    console.log("Status text:", response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response body:", errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: errorText || `Error ${response.status}: ${response.statusText}` };
      }
      
      return NextResponse.json(
        { error: errorData.error || `Error ${response.status}: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Datos recibidos:", data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error al consultar RUC:", error);
    return NextResponse.json(
      { error: error.message || "Error al consultar RUC" },
      { status: 500 }
    );
  }
}

