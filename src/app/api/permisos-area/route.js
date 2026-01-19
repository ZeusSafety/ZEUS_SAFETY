import { NextResponse } from "next/server";

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const listadoParam = searchParams.get("listado"); // e.g., "GERENCIA"

    if (!listadoParam) {
        return NextResponse.json(
            { error: "Parámetro 'listado' es requerido" },
            { status: 400 }
        );
    }

    // Construir URL con el endpoint correcto para áreas
    // Intentamos 'metodo=listado_area' basado en la convención de 'listado_colaborador'
    const apiUrl = `https://api-permisoslaborales-2026-2946605267.us-central1.run.app?metodo=listado_area&area=${encodeURIComponent(listadoParam)}`;

    // Preparar headers
    const headers = {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    };

    // Incluir token si está disponible
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.trim() !== "") {
        headers["Authorization"] = authHeader;
    }

    try {
        const response = await fetch(apiUrl, {
            method: "GET",
            headers: headers,
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => "");
            console.error(`Error API Externa (${response.status}): ${errorText}`);

            // Intentar parsear error como JSON
            let errorJson = null;
            try {
                errorJson = JSON.parse(errorText);
            } catch (e) { }

            return NextResponse.json(
                {
                    error: `Error ${response.status}`,
                    message: errorJson?.message || errorJson?.error || "Error al consultar API externa",
                    details: errorText,
                    status: response.status
                },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data, { status: 200 });

    } catch (error) {
        console.error("Error en API permisos-area:", error.message);
        return NextResponse.json(
            {
                error: error.message || "Error al procesar la solicitud",
                details: error.stack
            },
            { status: 500 }
        );
    }
}
