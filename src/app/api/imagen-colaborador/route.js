import { NextResponse } from "next/server";

/**
 * Endpoint proxy para obtener imágenes de colaboradores
 * Maneja tanto URLs directas como tokens encriptados
 * 
 * GET /api/imagen-colaborador?token={token_encriptado}
 * o
 * GET /api/imagen-colaborador?url={url_completa}
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const url = searchParams.get("url");

    // Si es una URL completa, redirigir directamente
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      try {
        const imageResponse = await fetch(url);
        if (imageResponse.ok) {
          const imageBuffer = await imageResponse.arrayBuffer();
          const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
          
          return new NextResponse(imageBuffer, {
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=3600',
            },
          });
        }
      } catch (error) {
        console.error("Error al obtener imagen desde URL:", error);
      }
    }

    // Si es un token encriptado, intentar obtener la imagen desde la API de storage
    if (token) {
      try {
        // Intentar diferentes formatos de la API para obtener la imagen encriptada
        const apiUrls = [
          `https://api-subida-archivos-2946605267.us-central1.run.app?bucket_name=archivos_colaboradores&folder_bucket=ZEUS_1&method=obtener&token=${encodeURIComponent(token)}`,
          `https://api-subida-archivos-2946605267.us-central1.run.app?bucket_name=archivos_colaboradores&folder_bucket=ZEUS_1&method=descargar&archivo=${encodeURIComponent(token)}`,
          `https://api-subida-archivos-2946605267.us-central1.run.app?bucket_name=archivos_colaboradores&folder_bucket=ZEUS_1&method=get&token=${encodeURIComponent(token)}`,
        ];

        for (const apiUrl of apiUrls) {
          try {
            const apiResponse = await fetch(apiUrl, { method: 'GET' });
            
            if (apiResponse.ok) {
              const contentType = apiResponse.headers.get('content-type');
              
              // Si la respuesta es una imagen, devolverla
              if (contentType && contentType.startsWith('image/')) {
                const imageBuffer = await apiResponse.arrayBuffer();
                return new NextResponse(imageBuffer, {
                  headers: {
                    'Content-Type': contentType,
                    'Cache-Control': 'public, max-age=3600',
                  },
                });
              }
              
              // Si la respuesta es JSON con una URL, intentar obtener esa URL
              if (contentType && contentType.includes('application/json')) {
                const data = await apiResponse.json();
                const imageUrl = data.url || data.URL || data.image_url;
                if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
                  const imageResponse = await fetch(imageUrl);
                  if (imageResponse.ok) {
                    const imageBuffer = await imageResponse.arrayBuffer();
                    const imgContentType = imageResponse.headers.get('content-type') || 'image/jpeg';
                    return new NextResponse(imageBuffer, {
                      headers: {
                        'Content-Type': imgContentType,
                        'Cache-Control': 'public, max-age=3600',
                      },
                    });
                  }
                }
              }
            }
          } catch (error) {
            console.error(`Error al intentar obtener imagen desde ${apiUrl}:`, error);
            continue;
          }
        }
      } catch (error) {
        console.error("Error al procesar token encriptado:", error);
      }
    }

    // Si no se pudo obtener la imagen, devolver error 404
    return NextResponse.json(
      { error: "No se pudo obtener la imagen" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Error en endpoint de imagen:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

