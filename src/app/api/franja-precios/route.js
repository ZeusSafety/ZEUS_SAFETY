import { NextResponse } from "next/server";

// Función auxiliar para hacer peticiones a la API externa de franja de precios
async function fetchFromAPI(method, request, tablaId) {
  try {
    console.log(`=== API FRANJA PRECIOS PROXY - ${method} ===`);
    
    // Obtener el token de los headers de la petición
    const authHeader = request.headers.get("authorization");
    const token = authHeader ? authHeader.replace("Bearer ", "") : null;
    
    console.log("Token recibido:", token ? token.substring(0, 20) + "..." : "No hay token");
    console.log("Tabla ID:", tablaId);
    
    // Construir la URL con los parámetros correctos
    const apiUrl = `https://api-productos-zeus-2946605267.us-central1.run.app?method=franja_precios&id=${encodeURIComponent(tablaId)}`;
    
    console.log("=== LLAMANDO A API FRANJA PRECIOS ===");
    console.log("URL completa:", apiUrl);
    console.log("Tabla ID:", tablaId);
    console.log("Método:", method);
    
    // Preparar headers para la petición a la API externa
    // Intentar múltiples configuraciones para que la API devuelva JSON
    const headers = {
      "Accept": "application/json", // Solo JSON, más específico
      "Content-Type": "application/json",
    };
    
    // Intentar con User-Agent de navegador para que la API piense que viene del cliente
    headers["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    
    // Incluir token si está disponible (Postman lo envía en Authorization)
    if (token && token.trim() !== "") {
      headers["Authorization"] = `Bearer ${token}`;
      console.log("Token incluido en headers");
    } else {
      console.log("⚠️ No hay token disponible - la API puede requerir autenticación");
      console.log("⚠️ Esto puede ser la razón por la que devuelve HTML en lugar de JSON");
    }
    
    // Intentar agregar headers adicionales que Postman puede enviar
    // Pero solo si no causan problemas
    try {
      // No incluir Accept-Encoding porque puede causar problemas con fetch en Node.js
      // No incluir Origin/Referer porque pueden causar problemas de CORS
    } catch (e) {
      // Ignorar errores al agregar headers opcionales
    }
    
    // Configurar opciones de fetch
    const fetchOptions = {
      method: method,
      headers: headers,
    };
    
    let response;
    try {
      console.log("Realizando fetch a:", apiUrl);
      console.log("Headers enviados:", JSON.stringify(headers, null, 2));
      console.log("Fetch options:", JSON.stringify(fetchOptions, null, 2));
      
      response = await fetch(apiUrl, fetchOptions);
      
      console.log("Response status:", response.status);
      console.log("Response statusText:", response.statusText);
      console.log("Response URL final:", response.url);
      console.log("Response headers:", Object.fromEntries(response.headers.entries()));
    } catch (fetchError) {
      console.error("Error en fetch:", fetchError);
      console.error("Error details:", {
        name: fetchError.name,
        message: fetchError.message,
        stack: fetchError.stack,
      });
      
      return NextResponse.json(
        { 
          error: "Error al conectar con la API de franja de precios",
          details: fetchError.message 
        },
        { status: 503 }
      );
    }
    
    if (!response.ok) {
      let errorText = "";
      let errorJson = null;
      
      try {
        errorText = await response.text();
        // Intentar parsear como JSON
        try {
          errorJson = JSON.parse(errorText);
        } catch (e) {
          // Si no es JSON, usar el texto directamente
        }
      } catch (e) {
        errorText = "No se pudo leer el error de la API";
      }
      
      console.error("=== ERROR DE LA API ===");
      console.error("Status:", response.status);
      console.error("Error text (primeros 500 chars):", errorText.substring(0, 500));
      console.error("Error JSON:", errorJson);
      console.error("======================");
      
      // Manejar específicamente el error 401 (Unauthorized)
      if (response.status === 401) {
        // Intentar extraer mensaje del HTML si es necesario
        let errorMessage = "Token expirado o inválido";
        if (errorJson?.error || errorJson?.message) {
          errorMessage = errorJson.error || errorJson.message;
        } else if (errorText && !errorText.trim().startsWith('<')) {
          // Si no es HTML, usar el texto directamente
          errorMessage = errorText;
        }
        
        return NextResponse.json(
          { 
            error: "token expirado",
            message: errorMessage,
            details: "El token de autenticación ha expirado o es inválido. Por favor, inicie sesión nuevamente.",
            status: 401
          },
          { status: 401 }
        );
      }
      
      const errorMessage = errorJson?.error || errorJson?.message || errorText || `Error ${response.status} en la operación`;
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: errorText || "No se pudo completar la operación",
          status: response.status
        },
        { status: response.status }
      );
    }
    
    let data;
    const contentType = response.headers.get("content-type") || "";
    
    console.log("Content-Type recibido:", contentType);
    
    // Intentar leer la respuesta como texto primero para ver qué contiene
    const textData = await response.text();
    console.log("=== RESPUESTA DE LA API ===");
    console.log("Longitud de la respuesta:", textData.length);
    console.log("Primeros 1000 caracteres:", textData.substring(0, 1000));
    console.log("¿Es HTML?:", textData.trim().startsWith('<'));
    console.log("Content-Type:", contentType);
    
    // Si la respuesta es HTML, intentar extraer JSON del HTML
    if (textData.trim().startsWith('<') || contentType.includes('text/html')) {
      console.error("⚠️ La API devolvió HTML en lugar de JSON");
      console.error("HTML recibido (primeros 2000 caracteres):", textData.substring(0, 2000));
      
      // Intentar múltiples estrategias para extraer JSON del HTML
      let jsonExtracted = false;
      
      // Estrategia 1: Buscar JSON en etiquetas <script>
      const scriptMatches = textData.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
      if (scriptMatches) {
        for (const script of scriptMatches) {
          const jsonInScript = script.match(/{[\s\S]*"CODIGO"[\s\S]*}/);
          if (jsonInScript) {
            try {
              data = JSON.parse(jsonInScript[0]);
              console.log("✓ JSON extraído de etiqueta <script>");
              jsonExtracted = true;
              break;
            } catch (e) {
              console.log("✗ No se pudo parsear JSON de <script>");
            }
          }
        }
      }
      
      // Estrategia 2: Buscar JSON directamente en el HTML (puede estar en el body)
      if (!jsonExtracted) {
        // Buscar un array JSON completo que contenga objetos con "CODIGO"
        const arrayPatterns = [
          /\[[\s\S]*?\{[\s\S]*?"CODIGO"[\s\S]*?\}[\s\S]*?\]/,
          /\[[\s\S]*?\{[\s\S]*?"index"[\s\S]*?"CODIGO"[\s\S]*?\}[\s\S]*?\]/,
          /\[[\s\S]*?\{[\s\S]*?"CODIGO"[\s\S]*?"NOMBRE"[\s\S]*?\}[\s\S]*?\]/,
        ];
        
        for (const pattern of arrayPatterns) {
          const directJsonMatch = textData.match(pattern);
          if (directJsonMatch) {
            try {
              // Limpiar el JSON encontrado (remover posibles caracteres HTML alrededor)
              let jsonStr = directJsonMatch[0].trim();
              // Remover cualquier HTML tag que pueda estar alrededor
              jsonStr = jsonStr.replace(/^[^\[]*/, '').replace(/[^\]]*$/, '');
              data = JSON.parse(jsonStr);
              console.log("✓ JSON extraído directamente del HTML");
              jsonExtracted = true;
              break;
            } catch (e) {
              console.log("✗ No se pudo parsear JSON directo del HTML:", e.message);
            }
          }
        }
      }
      
      // Estrategia 3: Buscar cualquier objeto JSON que contenga "CODIGO" o "NOMBRE"
      if (!jsonExtracted) {
        // Buscar un array completo de objetos JSON
        const arrayMatch = textData.match(/\[[\s\S]*?\{[\s\S]*?"CODIGO"[\s\S]*?\}[\s\S]*?\]/);
        if (arrayMatch) {
          try {
            let jsonStr = arrayMatch[0].trim();
            // Intentar limpiar el JSON
            jsonStr = jsonStr.replace(/^[^\[]*/, '').replace(/[^\]]*$/, '');
            data = JSON.parse(jsonStr);
            console.log("✓ JSON extraído como array del HTML");
            jsonExtracted = true;
          } catch (e) {
            console.log("✗ No se pudo parsear array JSON del HTML:", e.message);
            // Intentar extraer solo el contenido entre corchetes
            try {
              const bracketMatch = jsonStr.match(/\[([\s\S]*)\]/);
              if (bracketMatch) {
                data = JSON.parse('[' + bracketMatch[1] + ']');
                console.log("✓ JSON extraído después de limpiar corchetes");
                jsonExtracted = true;
              }
            } catch (e2) {
              console.log("✗ No se pudo extraer después de limpiar corchetes");
            }
          }
        }
      }
      
      // Estrategia 3.5: Buscar JSON que pueda estar en un textarea o input hidden
      if (!jsonExtracted) {
        const textareaMatch = textData.match(/<textarea[^>]*>([\s\S]*?)<\/textarea>/i) || 
                             textData.match(/<input[^>]*value=["']([\s\S]*?)["'][^>]*>/i);
        if (textareaMatch) {
          try {
            const jsonStr = textareaMatch[1] || textareaMatch[0];
            data = JSON.parse(jsonStr);
            console.log("✓ JSON extraído de textarea/input");
            jsonExtracted = true;
          } catch (e) {
            console.log("✗ No se pudo parsear JSON de textarea/input");
          }
        }
      }
      
      // Estrategia 4: Buscar entre etiquetas <pre> o <code>
      if (!jsonExtracted) {
        const preMatch = textData.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i) || textData.match(/<code[^>]*>([\s\S]*?)<\/code>/i);
        if (preMatch) {
          try {
            let jsonStr = preMatch[1].trim();
            // Limpiar posibles entidades HTML
            jsonStr = jsonStr.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
            data = JSON.parse(jsonStr);
            console.log("✓ JSON extraído de etiqueta <pre> o <code>");
            jsonExtracted = true;
          } catch (e) {
            console.log("✗ No se pudo parsear JSON de <pre>/<code>:", e.message);
          }
        }
      }
      
      // Estrategia 5: Buscar JSON que pueda estar en el body sin etiquetas
      if (!jsonExtracted) {
        // Buscar cualquier secuencia que parezca un array JSON
        // Buscar desde el primer [ hasta el último ]
        const firstBracket = textData.indexOf('[');
        const lastBracket = textData.lastIndexOf(']');
        if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
          try {
            const potentialJson = textData.substring(firstBracket, lastBracket + 1);
            // Verificar que contiene "CODIGO" para asegurarnos que es el JSON correcto
            if (potentialJson.includes('"CODIGO"') || potentialJson.includes("'CODIGO'")) {
              data = JSON.parse(potentialJson);
              console.log("✓ JSON extraído del body sin etiquetas");
              jsonExtracted = true;
            }
          } catch (e) {
            console.log("✗ No se pudo parsear JSON del body:", e.message);
          }
        }
      }
      
      // Estrategia 6: Buscar JSON en comentarios HTML
      if (!jsonExtracted) {
        const commentMatches = textData.match(/<!--([\s\S]*?)-->/g);
        if (commentMatches) {
          for (const comment of commentMatches) {
            const jsonInComment = comment.match(/\[[\s\S]*?\{[\s\S]*?"CODIGO"[\s\S]*?\}[\s\S]*?\]/);
            if (jsonInComment) {
              try {
                data = JSON.parse(jsonInComment[0]);
                console.log("✓ JSON extraído de comentario HTML");
                jsonExtracted = true;
                break;
              } catch (e) {
                console.log("✗ No se pudo parsear JSON de comentario");
              }
            }
          }
        }
      }
      
      // Si no se pudo extraer JSON, devolver error con más información
      if (!jsonExtracted) {
        let errorDetails = "La API devolvió una página HTML en lugar de JSON.";
        const titleMatch = textData.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch) {
          errorDetails += ` Título: ${titleMatch[1]}`;
        }
        
        // Buscar mensajes de error comunes en el HTML
        const errorMatch = textData.match(/<body[^>]*>([\s\S]{0,1000})/i);
        if (errorMatch) {
          const bodyText = errorMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
          errorDetails += ` Contenido: ${bodyText.substring(0, 300)}`;
        }
        
        console.error("✗ No se pudo extraer JSON del HTML después de intentar múltiples estrategias");
        
        return NextResponse.json(
          { 
            error: "La API devolvió HTML en lugar de JSON. No se pudo extraer JSON del HTML.",
            details: errorDetails,
            preview: textData.substring(0, 1000),
            url: apiUrl,
            suggestion: "Verifique que el token de autenticación sea válido y que se estén enviando todos los headers necesarios. La API puede requerir headers específicos que Postman envía automáticamente."
          },
          { status: 500 }
        );
      } else {
        console.log("✓ JSON extraído exitosamente del HTML usando estrategias alternativas");
      }
    }
    
    // Intentar parsear como JSON
    // Si ya se extrajo data del HTML, no intentar parsear de nuevo
    if (!data) {
      try {
        // Limpiar el texto antes de parsear (por si hay espacios o caracteres extra)
        const cleanedText = textData.trim();
        
        // Si el texto empieza con BOM (Byte Order Mark), removerlo
        const textWithoutBOM = cleanedText.charCodeAt(0) === 0xFEFF ? cleanedText.slice(1) : cleanedText;
        
        data = JSON.parse(textWithoutBOM);
        console.log("✓ Datos parseados exitosamente como JSON");
        console.log("Tipo de datos:", typeof data);
        console.log("¿Es array?:", Array.isArray(data));
        if (Array.isArray(data)) {
          console.log("Cantidad de registros:", data.length);
          if (data.length > 0) {
            console.log("Primer registro (primeros campos):", {
              CODIGO: data[0].CODIGO,
              NOMBRE: data[0].NOMBRE,
              CANTIDAD_CAJA: data[0].CANTIDAD_CAJA,
              "CAJA 1": data[0]["CAJA 1"],
              "CAJA 5": data[0]["CAJA 5"]
            });
          }
        }
      } catch (parseError) {
        console.error("✗ Error al parsear como JSON:", parseError);
        console.error("Mensaje de error:", parseError.message);
        console.error("Texto que causó el error (primeros 500 caracteres):", textData.substring(0, 500));
        
        // Si es texto plano pero no JSON, intentar ver si hay algún patrón
        if (textData.trim().length > 0) {
          // Intentar extraer información útil del error
          let errorMessage = "La respuesta no es un JSON válido";
          if (textData.includes("<!DOCTYPE") || textData.includes("<html")) {
            errorMessage = "La API devolvió HTML en lugar de JSON. Esto puede deberse a que la API requiere autenticación o headers específicos.";
          }
          
          return NextResponse.json(
            { 
              error: errorMessage,
              details: `Tipo de contenido: ${contentType}, Longitud: ${textData.length} caracteres. Error: ${parseError.message}`,
              preview: textData.substring(0, 500),
              url: apiUrl,
              suggestion: "Verifique que la API esté configurada correctamente y que se estén enviando los headers necesarios (incluyendo Authorization si es requerido)."
            },
            { status: 500 }
          );
        }
        
        return NextResponse.json(
          { 
            error: "La respuesta está vacía o no es un JSON válido",
            details: parseError.message,
            url: apiUrl
          },
          { status: 500 }
        );
      }
    }
    
    console.log("Datos recibidos de la API:", Array.isArray(data) ? `${data.length} registros` : "Objeto único");
    console.log("Tipo de datos:", typeof data);
    
    return NextResponse.json(data, { status: 200 });
    
  } catch (error) {
    console.error(`=== ERROR EN API FRANJA PRECIOS PROXY - ${method} ===`);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("=====================");
    
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

