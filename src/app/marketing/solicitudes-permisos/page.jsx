"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";
import ListadoPermisosArea from "../../../components/permisos/ListadoPermisosArea";

export default function SolicitudesPermisosPage() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const router = useRouter();

    // Detectar si es desktop y abrir sidebar automáticamente
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setSidebarOpen(true);
            } else {
                setSidebarOpen(false);
            }
        };

        // Establecer estado inicial
        handleResize();

        // Escuchar cambios de tamaño
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="flex h-screen overflow-hidden bg-gray-100">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${sidebarOpen ? "lg:ml-60 ml-0" : "ml-0"}`}>
                <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
                <main className="flex-1 overflow-y-auto custom-scrollbar" style={{ background: '#F7FAFF' }}>
                    <div className="max-w-[95%] mx-auto px-4 py-4">
                        <button
                            onClick={() => router.push("/marketing")}
                            className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-lg font-medium hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm ripple-effect relative overflow-hidden text-sm group"
                            style={{ fontFamily: 'var(--font-poppins)' }}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                            <span>Volver a Marketing</span>
                        </button>
                        <ListadoPermisosArea moduloArea="MARKETING" tituloModulo="Marketing" />
                    </div>
                </main>
            </div>
        </div>
    );
}
