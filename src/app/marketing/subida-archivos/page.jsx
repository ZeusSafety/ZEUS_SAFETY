"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/context/AuthContext";
import { Header } from "../../../components/layout/Header";
import { Sidebar } from "../../../components/layout/Sidebar";

export default function SubidaArchivosMarketingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    fecha: new Date().toISOString().split('T')[0],
    archivo: null,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Detectar si es desktop y abrir sidebar automáticamente
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      archivo: e.target.files[0]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nombre || !formData.archivo) {
      setMessage("Por favor, complete todos los campos.");
      return;
    }

    setIsUploading(true);
    setMessage("");
    setUploadProgress(0);

    const data = new FormData();
    data.append('nombre', formData.nombre);
    data.append('fecha', formData.fecha);
    data.append('archivo', formData.archivo);

    // Usar XMLHttpRequest para tener control del progreso del envío al backend
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://configmarketing-2946605267.us-central1.run.app/upload', true);

    // Timeout infinito explícito (aunque serverless puede tener sus propios límites)
    xhr.timeout = 0;

    // Escuchar progreso de subida (Frontend -> Backend)
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percentComplete);
      }
    };

    // Manejar respuesta
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        console.log("Subida exitosa:", xhr.responseText);
        setMessage("Archivo subido exitosamente.");
        setFormData({
          nombre: "",
          fecha: new Date().toISOString().split('T')[0],
          archivo: null,
        });
        const fileInput = document.getElementById('archivo');
        if (fileInput) fileInput.value = "";
        setUploadProgress(0);
      } else {
        console.error("Error del servidor:", xhr.status, xhr.statusText, xhr.responseText);
        // Intentar leer error del JSON si existe
        let errorMsg = `Error al subir el archivo. Código: ${xhr.status}`;
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.error) errorMsg = res.error;
        } catch (e) { }
        setMessage(errorMsg);
      }
      setIsUploading(false);
    };

    xhr.onerror = () => {
      console.error('Error de red al intentar subir el archivo.');
      setMessage("Error de conexión con el servidor.");
      setIsUploading(false);
    };

    xhr.ontimeout = () => {
      console.error('La petición expiró.');
      setMessage("La subida tardó demasiado y el servidor no respondió.");
      setIsUploading(false);
    };

    try {
      xhr.send(data);
    } catch (error) {
      console.error('Error al enviar solicitud:', error);
      setMessage("Error inesperado al iniciar la carga.");
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F7FAFF' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${sidebarOpen ? "lg:ml-60 ml-0" : "ml-0"
          }`}
      >
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto" style={{ background: '#F7FAFF' }}>
          <div className="max-w-[95%] mx-auto px-4 py-4 sm:py-6">
            {/* Botón Volver */}
            <button
              onClick={() => router.push("/marketing")}
              className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-lg font-medium hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm ripple-effect relative overflow-hidden text-sm group"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver a Marketing</span>
            </button>

            {/* Dashboard Container */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">
              {/* Header de la página */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#002D5A] to-[#002D5A] rounded-xl flex items-center justify-center text-white shadow-sm">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'var(--font-poppins)' }}>
                      Subida de Archivos Marketing
                    </h1>
                    <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: 'var(--font-poppins)' }}>
                      Gestionar y subir archivos para Marketing
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 rounded-lg px-3 py-1.5 bg-green-50 border border-green-200">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-semibold text-green-700" style={{ fontFamily: 'var(--font-poppins)' }}>API Conectada</span>
                </div>
              </div>

              {/* Formulario de subida */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="nombre" className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                      Nombre
                    </label>
                    <input
                      type="text"
                      id="nombre"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-black"
                      placeholder="Ingrese el nombre"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="fecha" className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                      Fecha
                    </label>
                    <input
                      type="date"
                      id="fecha"
                      name="fecha"
                      value={formData.fecha}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-sm text-black"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                      readOnly
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="archivo" className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                    Archivo
                  </label>
                  <input
                    type="file"
                    id="archivo"
                    name="archivo"
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-black file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    style={{ fontFamily: 'var(--font-poppins)' }}
                    required
                  />
                </div>

                {message && (
                  <div className={`p-4 rounded-lg ${message.includes('exitosamente') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    <p className="text-sm" style={{ fontFamily: 'var(--font-poppins)' }}>{message}</p>
                  </div>
                )}

                {isUploading && (
                  <div className="mb-6 bg-blue-50/50 rounded-lg p-4 border border-blue-100">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-semibold text-blue-700" style={{ fontFamily: 'var(--font-poppins)' }}>
                        Subiendo archivo...
                      </span>
                      <span className="text-sm font-bold text-blue-700" style={{ fontFamily: 'var(--font-poppins)' }}>
                        {uploadProgress}%
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-600 to-blue-400 h-2.5 rounded-full transition-all duration-300 ease-out shadow-sm"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-blue-600 mt-2 text-center" style={{ fontFamily: 'var(--font-poppins)' }}>
                      Por favor no cierre esta ventana mientras se sube el archivo.
                    </p>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="px-6 py-3 bg-gradient-to-r from-blue-700 to-blue-800 text-white rounded-lg font-medium hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontFamily: 'var(--font-poppins)' }}
                  >
                    {isUploading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Subiendo...</span>
                      </div>
                    ) : (
                      "Subir Archivo"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}