import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const apiUrl = "https://configmarketing-2946605267.us-central1.run.app/regiones";
    
    console.log("Consultando regiones desde:", apiUrl);
    
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    console.log("Status de la respuesta de regiones:", response.status);
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
    console.log("Datos de regiones recibidos:", data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error al consultar regiones:", error);
    return NextResponse.json(
      { error: error.message || "Error al consultar regiones" },
      { status: 500 }
    );
  }
}

