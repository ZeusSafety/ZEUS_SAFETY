import { NextResponse } from "next/server";

const BASE_URL = "https://api-franja-precios-2946605267.us-central1.run.app";

// Mapeo EXACTO según el nuevo esquema SQL proporcionado
const getMercadoName = (id) => {
  if (!id) return "Malvinas_online";

  const upperId = String(id).toUpperCase().trim();

  const mapping = {
    "MALVINAS": "Malvinas_online",
    "MALVINAS_ONLINE": "Malvinas_online",
    "PROVINCIA": "Provincia_online",
    "PROVINCIA_ONLINE": "Provincia_online",
    "FERRETERIA": "Ferreteria_online",
    "FERRETERÍA": "Ferreteria_online",
    "FERRETERIA_ONLINE": "Ferreteria_online",
    "CLIENTES_FINALES": "Clientes_finales_online",
    "CLIENTES FINALES": "Clientes_finales_online",
    "CLIENTES_FINALES_ONLINE": "Clientes_finales_online",
    "JICAMARCA": "Jicamarca",
    "ONLINE": "Online"
  };

  return mapping[upperId] || "Malvinas_online";
};

async function fetchFromAPI(method, request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || "MALVINAS";
    const mercado = getMercadoName(id);
    const apiMethod = searchParams.get("method");

    const authHeader = request.headers.get("authorization");

    let apiUrl = `${BASE_URL}`;

    if (method === "GET") {
      apiUrl += `?mercado=${encodeURIComponent(mercado)}`;
    } else {
      let methodQuery = "";
      if (apiMethod) {
        if (apiMethod === "CREAR_FRANJA_PRECIO" || apiMethod === "crear_producto_base") methodQuery = "crear_producto_base";
        else if (apiMethod === "ACTUALIZAR_FRANJA_PRECIO" || apiMethod === "actualizar_precios_mercado") methodQuery = "actualizar_precios_mercado";
        else if (apiMethod === "ELIMINAR_FRANJA_PRECIO" || apiMethod === "eliminar_producto") methodQuery = "eliminar_producto";
        else methodQuery = apiMethod.toLowerCase();
      } else {
        if (method === "POST") methodQuery = "crear_producto_base";
        if (method === "PUT" || method === "PATCH") methodQuery = "actualizar_precios_mercado";
        if (method === "DELETE") methodQuery = "eliminar_producto";
      }
      apiUrl += `?method=${methodQuery}`;
    }

    console.log(`[API PROXY] ${method} a: ${apiUrl} (mercado: ${mercado})`);

    const headers = {
      "Accept": "application/json",
      "Content-Type": "application/json",
    };

    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    const fetchOptions = {
      method: method,
      headers: headers,
    };

    if (method !== "GET") {
      let body = {};
      try {
        body = await request.json();
      } catch (e) {
        body = {};
      }
      const processedBody = { ...body };
      processedBody.mercado = mercado;
      fetchOptions.body = JSON.stringify(processedBody);
    }

    const response = await fetch(apiUrl, fetchOptions);
    const responseText = await response.text();

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = { error: "No JSON", details: responseText };
    }

    return NextResponse.json(responseData, { status: response.status });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request) { return fetchFromAPI("GET", request); }
export async function POST(request) { return fetchFromAPI("POST", request); }
export async function PUT(request) { return fetchFromAPI("PUT", request); }
export async function DELETE(request) { return fetchFromAPI("DELETE", request); }
