import { NextResponse } from "next/server";

const BACKEND_URL = "https://importaciones2026-2946605267.us-central1.run.app";

/**
 * GET /api/importaciones2026/upload-url?numero_despacho=XXX&filename=YYY
 * Proxy al backend Python que genera una URL firmada de GCS para subida directa.
 * Respuesta esperada: { upload_url: string, final_url: string }
 */
export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization");
    const { searchParams } = new URL(request.url);
    const numeroDespacho = searchParams.get("numero_despacho");
    const filename = searchParams.get("filename");

    if (!numeroDespacho || !filename) {
      return NextResponse.json(
        { error: "Faltan parámetros: numero_despacho y filename son requeridos" },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({
      numero_despacho: numeroDespacho,
      filename,
    });
    const apiUrl = `${BACKEND_URL}/upload-url?${params.toString()}`;

    const headers = {
      Accept: "application/json",
    };
    if (authHeader && authHeader.trim() !== "") {
      headers.Authorization = authHeader;
    }

    const response = await fetch(apiUrl, { method: "GET", headers });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      let errorJson = null;
      try {
        errorJson = JSON.parse(errorText);
      } catch (_) {}
      const errorMessage =
        errorJson?.error || errorJson?.message || errorText || `Error ${response.status}`;
      return NextResponse.json(
        { error: errorMessage, status: response.status },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.upload_url || !data.final_url) {
      return NextResponse.json(
        { error: "El backend no devolvió upload_url o final_url" },
        { status: 502 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error en upload-url proxy:", error);
    return NextResponse.json(
      { error: "Error al obtener URL de subida", details: error.message },
      { status: 500 }
    );
  }
}
