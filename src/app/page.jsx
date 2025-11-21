"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/context/AuthContext";

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (!loading && user) {
      router.push("/menu");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <main className="flex flex-col items-center gap-6">
        <h1 className="text-3xl font-semibold">Zeus Web</h1>
        <p className="text-lg text-zinc-600">Sistema de gestión</p>
        <p className="text-sm text-gray-500">Bienvenido, {user.name || user.email}</p>
      </main>
    </div>
  );
}

