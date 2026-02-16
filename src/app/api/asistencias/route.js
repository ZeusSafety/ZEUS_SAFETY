import { NextResponse } from "next/server";

// URL base de la API externa de asistencias
const API_BASE_URL = "https://api-reporte-asistencias-2946605267.us-central1.run.app";

/**
 * Función auxiliar para hacer peticiones a la API externa de asistencias
 */
async function fetchFromAPI(method, request) {
  try {
    console.log(`=== API ASISTENCIAS PROXY - ${method} ===`);

    // Obtener el token de los headers de la petición
    const authHeader = request.headers.get("authorization");
    const token = authHeader ? authHeader.replace("Bearer ", "") : null;

    console.log("Token recibido:", token ? token.substring(0, 20) + "..." : "No hay token");

    // Obtener query parameters de la URL
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get("endpoint");

    // Construir URL base
    let apiUrl = API_BASE_URL;
    if (endpoint) {
      apiUrl += `/${endpoint}`;
    }

    console.log("Llamando a API:", apiUrl);
    console.log("Método:", method);

    // Preparar headers para la petición a la API externa
    const headers = {
      "Accept": "application/json",
    };

    // Incluir token si está disponible
    if (token && token.trim() !== "") {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Para POST, manejar FormData
    if (method === "POST" || method === "PUT") {
      // Obtener el Content-Type del request original
      const contentType = request.headers.get("content-type");
      
      // Si es FormData, leerlo y reconstruirlo
      if (contentType && contentType.includes("multipart/form-data")) {
        const formData = await request.formData();
        
        console.log("FormData recibido:", {
          file: formData.get("file") ? "Presente" : "No presente",
          registrado_por: formData.get("registrado_por"),
          area: formData.get("area"),
          asistencias: formData.get("asistencias") ? "Presente" : "No presente",
        });

        // Crear un nuevo FormData para enviar a la API externa
        const formDataToSend = new FormData();
        
        // Copiar todos los campos del FormData original
        for (const [key, value] of formData.entries()) {
          if (value instanceof File || value instanceof Blob) {
            formDataToSend.append(key, value, value.name || "file");
          } else {
            formDataToSend.append(key, value);
          }
        }

        // No establecer Content-Type en headers, fetch lo hará automáticamente con el boundary correcto
        delete headers["Content-Type"];

        // Realizar la petición con FormData
        const fetchOptions = {
          method: method,
          headers: headers,
          body: formDataToSend,
        };

        const response = await fetch(apiUrl, fetchOptions);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error de la API:", response.status, errorText);
          return NextResponse.json(
            { error: `Error al procesar la solicitud: ${response.status}` },
            { status: response.status }
          );
        }

        const data = await response.json();
        return NextResponse.json(data);
      } else {
        // Si no es FormData, manejar como JSON normal
        const body = await request.json();
        headers["Content-Type"] = "application/json";
        
        const fetchOptions = {
          method: method,
          headers: headers,
          body: JSON.stringify(body),
        };

        const response = await fetch(apiUrl, fetchOptions);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error de la API:", response.status, errorText);
          return NextResponse.json(
            { error: `Error al procesar la solicitud: ${response.status}` },
            { status: response.status }
          );
        }

        const data = await response.json();
        return NextResponse.json(data);
      }
    } else {
      // Para GET, usar JSON normal
      const fetchOptions = {
        method: method,
        headers: headers,
      };

      const response = await fetch(apiUrl, fetchOptions);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error de la API:", response.status, errorText);
        return NextResponse.json(
          { error: `Error al procesar la solicitud: ${response.status}` },
          { status: response.status }
        );
      }

      const data = await response.json();
      return NextResponse.json(data);
    }
  } catch (error) {
    console.error("Error en fetchFromAPI:", error);
    return NextResponse.json(
      { error: error.message || "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  return fetchFromAPI("GET", request);
}

export async function POST(request) {
  return fetchFromAPI("POST", request);
}

export async function PUT(request) {
  return fetchFromAPI("PUT", request);
}

export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
