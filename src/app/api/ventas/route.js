import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    // TODO: Reemplazar con lógica real
    // Este es un mock temporal - se eliminará cuando se integren las APIs externas
    return NextResponse.json({
      success: true,
      data: [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener ventas" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    
    // TODO: Reemplazar con lógica real
    // Este es un mock temporal - se eliminará cuando se integren las APIs externas
    return NextResponse.json({
      success: true,
      data: body,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al crear venta" },
      { status: 500 }
    );
  }
}

