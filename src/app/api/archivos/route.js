/**
 * API Route para subir archivos
 * Proxy para la API de gestor de archivos
 */

export async function POST(request) {
  try {
    const token = request.headers.get("Authorization");
    
    if (!token) {
      return new Response(JSON.stringify({ error: "Token de autenticación no encontrado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const formData = await request.formData();
    const folderBucket = request.nextUrl.searchParams.get("folder_bucket") || "inventario_conteo";

    // API de gestor de archivos
    const ARCHIVOS_API = "https://gestorarchivos-2946605267.us-central1.run.app";

    const response = await fetch(`${ARCHIVOS_API}?folder_bucket=${folderBucket}`, {
      method: "POST",
      headers: {
        Authorization: token,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(JSON.stringify({ error: `Error al subir archivo: ${response.status} - ${errorText}` }), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error en API de archivos:", error);
    return new Response(JSON.stringify({ error: error.message || "Error al subir archivo" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
