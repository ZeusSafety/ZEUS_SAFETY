import { NextResponse } from 'next/server';

const API_BASE_URL = 'https://cotizaciones2026-2946605267.us-central1.run.app';

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validar que vengan los campos requeridos
    const { nombre_cliente, region, distrito, monto_total, ruta_pdf, atendido_por } = body;
    
    if (!nombre_cliente || !region || !distrito || !monto_total) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos obligatorios' },
        { status: 400 }
      );
    }

    // Llamar al backend de Google Cloud
    const response = await fetch(`${API_BASE_URL}/cotizacion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nombre_cliente,
        region,
        distrito,
        monto_total: parseFloat(monto_total),
        ruta_pdf: ruta_pdf || '',
        atendido_por: atendido_por || ''
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || 'Error al guardar la cotización' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error en API de cotizaciones:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}


