import { NextResponse } from "next/server";

// Función auxiliar para hacer peticiones a la API externa de franja de precios
async function fetchFromAPI(method, request, tablaId) {
  try {
    // Obtener el token de los headers de la petición
    const authHeader = request.headers.get("authorization");
    const token = authHeader ? authHeader.replace("Bearer ", "") : null;
    
    // Construir la URL con los parámetros correctos
    // Usar franja_precios para obtener los datos con precios dinámicos
    const apiUrl = `https://api-productos-zeus-2946605267.us-central1.run.app?method=franja_precios&id=${encodeURIComponent(tablaId)}`;
    
    // Preparar headers para la petición a la API externa
    const headers = {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    };
    
    // Incluir token si está disponible
    if (token && token.trim() !== "") {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    // Realizar la petición
    const response = await fetch(apiUrl, {
      method: method,
      headers: headers,
    });
    
    // Manejar errores de respuesta
    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json(
          { 
            error: "token expirado",
            message: "El token de autenticación ha expirado o es inválido. Por favor, inicie sesión nuevamente.",
            status: 401
          },
          { status: 401 }
        );
      }
      
      const errorText = await response.text().catch(() => "");
      let errorJson = null;
      try {
        errorJson = JSON.parse(errorText);
      } catch (e) {
        // No es JSON, usar texto directamente
      }
      
      let errorMessage = errorJson?.error || errorJson?.message || errorText || `Error ${response.status} en la operación`;
      
      // Si el error es un número (como 0), convertirlo a un mensaje más descriptivo
      if (typeof errorMessage === 'number') {
        if (errorMessage === 0) {
          errorMessage = "Error desconocido. Verifique que todos los campos estén completos.";
        } else {
          errorMessage = `Error ${errorMessage}`;
        }
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: errorText || "No se pudo completar la operación",
          status: response.status
        },
        { status: response.status }
      );
    }
    
    // Parsear la respuesta como JSON directamente
    const data = await response.json();
    
    return NextResponse.json(data, { status: 200 });
    
  } catch (error) {
    console.error("Error en API franja precios:", error.message);
    
    return NextResponse.json(
      { 
        error: error.message || "Error al procesar la solicitud",
        details: error.stack 
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const tablaId = searchParams.get("id") || "MALVINAS";
  
  return fetchFromAPI("GET", request, tablaId);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const tablaId = body.CLASIFICACION || body.clasificacion || "MALVINAS";
    
    // Obtener el token de los headers
    const authHeader = request.headers.get("authorization");
    const token = authHeader ? authHeader.replace("Bearer ", "") : null;
    
    // Construir la URL con los parámetros correctos
    const apiUrl = `https://api-productos-zeus-2946605267.us-central1.run.app?method=CREAR_FRANJA_PRECIO&id=${encodeURIComponent(tablaId)}`;
    
    const headers = {
      "Accept": "application/json",
      "Content-Type": "application/json",
    };
    
    if (token && token.trim() !== "") {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      let errorJson = null;
      try {
        errorJson = JSON.parse(errorText);
      } catch (e) {}
      
      let errorMessage = errorJson?.error || errorJson?.message || errorText || `Error ${response.status}`;
      
      // Si el error es un número (como 0), convertirlo a un mensaje más descriptivo
      if (typeof errorMessage === 'number') {
        if (errorMessage === 0) {
          errorMessage = "Error desconocido. Verifique que todos los campos estén completos.";
        } else {
          errorMessage = `Error ${errorMessage}`;
        }
      }
      
      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error en POST franja precios:", error.message);
    return NextResponse.json({ error: error.message || "Error al procesar la solicitud" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const tablaId = body.CLASIFICACION || body.clasificacion || "MALVINAS";
    
    // Obtener el token de los headers
    const authHeader = request.headers.get("authorization");
    const token = authHeader ? authHeader.replace("Bearer ", "") : null;
    
    // Construir la URL con los parámetros correctos
    const apiUrl = `https://api-productos-zeus-2946605267.us-central1.run.app?method=ACTUALIZAR_FRANJA_PRECIO&id=${encodeURIComponent(tablaId)}`;
    
    const headers = {
      "Accept": "application/json",
      "Content-Type": "application/json",
    };
    
    if (token && token.trim() !== "") {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    const response = await fetch(apiUrl, {
      method: "PUT",
      headers: headers,
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      let errorJson = null;
      try {
        errorJson = JSON.parse(errorText);
      } catch (e) {}
      
      let errorMessage = errorJson?.error || errorJson?.message || errorText || `Error ${response.status}`;
      
      // Si el error es un número (como 0), convertirlo a un mensaje más descriptivo
      if (typeof errorMessage === 'number') {
        if (errorMessage === 0) {
          errorMessage = "Error desconocido. Verifique que todos los campos estén completos.";
        } else {
          errorMessage = `Error ${errorMessage}`;
        }
      }
      
      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error en PUT franja precios:", error.message);
    return NextResponse.json({ error: error.message || "Error al procesar la solicitud" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    let body = {};
    try {
      body = await request.json();
    } catch (e) {
      // Si no hay body, está bien
    }
    
    const id = body.ID || body.id;
    const tablaId = body.clasificacion || body.CLASIFICACION || "MALVINAS";
    
    // Validar que el ID esté presente
    if (!id) {
      return NextResponse.json({ error: "ID es requerido" }, { status: 400 });
    }
    
    // Obtener el token de los headers
    const authHeader = request.headers.get("authorization");
    const token = authHeader ? authHeader.replace("Bearer ", "") : null;
    
    // Construir la URL con los parámetros correctos
    const apiUrl = `https://api-productos-zeus-2946605267.us-central1.run.app?method=ELIMINAR_FRANJA_PRECIO&id=${encodeURIComponent(tablaId)}`;
    
    const headers = {
      "Accept": "application/json",
      "Content-Type": "application/json",
    };
    
    if (token && token.trim() !== "") {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    // Enviar el ID en el body
    const response = await fetch(apiUrl, {
      method: "DELETE",
      headers: headers,
      body: JSON.stringify({
        ID: id,
        id: id,
        CLASIFICACION: tablaId,
        clasificacion: tablaId
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      let errorJson = null;
      try {
        errorJson = JSON.parse(errorText);
      } catch (e) {}
      
      let errorMessage = errorJson?.error || errorJson?.message || errorText || `Error ${response.status}`;
      
      // Si el error es un número (como 0), convertirlo a un mensaje más descriptivo
      if (typeof errorMessage === 'number') {
        if (errorMessage === 0) {
          errorMessage = "Error desconocido. Verifique que todos los campos estén completos.";
        } else {
          errorMessage = `Error ${errorMessage}`;
        }
      }
      
      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error en DELETE franja precios:", error.message);
    return NextResponse.json({ error: error.message || "Error al procesar la solicitud" }, { status: 500 });
  }
}

