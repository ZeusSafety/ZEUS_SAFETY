import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validación básica
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña son requeridos" },
        { status: 400 }
      );
    }

    // TODO: Reemplazar con lógica de autenticación real
    // Este es un mock temporal - se eliminará cuando se integren las APIs externas
    return NextResponse.json({
      success: true,
      token: "mock-token",
      user: {
        id: 1,
        email,
        name: "Usuario",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Error en el servidor" },
      { status: 500 }
    );
  }
}

