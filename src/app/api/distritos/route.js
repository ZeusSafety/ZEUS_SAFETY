import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const idRegion = searchParams.get("id_region");

    if (!idRegion) {
      return NextResponse.json(
        { error: "id_region es requerido" },
        { status: 400 }
      );
    }

    const apiUrl = `https://configmarketing-2946605267.us-central1.run.app/distritos?id_region=${encodeURIComponent(idRegion)}`;
    
    console.log("Consultando distritos desde:", apiUrl);
    console.log("ID Región:", idRegion);
    
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    console.log("Status de la respuesta de distritos:", response.status);
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
    console.log("Datos de distritos recibidos:", data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error al consultar distritos:", error);
    return NextResponse.json(
      { error: error.message || "Error al consultar distritos" },
      { status: 500 }
    );
  }
}

