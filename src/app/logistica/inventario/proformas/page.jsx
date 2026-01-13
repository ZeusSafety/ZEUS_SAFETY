"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../components/context/AuthContext";
import { useInventario } from "../../../../context/InventarioContext";
import { Header } from "../../../../components/layout/Header";
import { Sidebar } from "../../../../components/layout/Sidebar";
import { BannerSesion } from "../../../../components/inventario/BannerSesion";
import * as inventarioApi from "../../../../services/inventarioApi";
import { fmt12, toast } from "../../../../utils/inventarioUtils";
import { generarPDFProforma } from "../../../../utils/pdfUtils";

export default function InventarioProformasPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { sesionActual, productos, proformas, setProformas } = useInventario();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [lineas, setLineas] = useState([]);
  const [formData, setFormData] = useState({
    asesor: "Hervin",
    almacen: "callao",
    registrado: "Joseph",
    numero: "",
  });
  const [filtroTexto, setFiltroTexto] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const agregarLinea = () => {
    setLineas([...lineas, { codigo: "", producto: "", um: "UNI", cantidad: 0 }]);
  };

  const eliminarLinea = (index) => {
    setLineas(lineas.filter((_, i) => i !== index));
  };

  const actualizarLinea = (index, campo, valor) => {
    const nuevasLineas = [...lineas];
    nuevasLineas[index] = { ...nuevasLineas[index], [campo]: valor };
    
    // Si se actualiza el código, buscar el producto
    if (campo === "codigo" || campo === "producto") {
      const producto = productos.find(
        (p) =>
          String(p.codigo) === String(valor) ||
          (p.producto || "").toLowerCase().includes(String(valor).toLowerCase())
      );
      if (producto) {
        nuevasLineas[index].codigo = producto.codigo;
        nuevasLineas[index].producto = producto.producto;
      }
    }
    
    setLineas(nuevasLineas);
  };

  const registrarProforma = async () => {
    if (!formData.asesor || !formData.registrado) {
      alert("Completa Asesor y Registrado.");
      return;
    }

    if (lineas.length === 0) {
      alert("Agrega al menos una línea.");
      return;
    }

    const lineasValidas = lineas.filter((l) => (l.codigo || l.producto) && l.cantidad > 0);
    if (lineasValidas.length === 0) {
      alert("Agrega al menos una línea válida.");
      return;
    }

    try {
      // Generar PDF
      const pdfUrl = await generarPDFProforma({
        fecha: fmt12(),
        asesor: formData.asesor,
        registrado: formData.registrado,
        num: formData.numero || `PF-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`,
        almacen: formData.almacen,
        lineas: lineasValidas,
      });

      const nuevaProforma = {
        id: (proformas.length || 0) + 1,
        fecha: fmt12(),
        asesor: formData.asesor,
        registrado: formData.registrado,
        num: formData.numero || `PF-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`,
        almacen: formData.almacen,
        lineas: lineasValidas,
        pdfUrl,
        estado: "Ingreso",
      };

      setProformas([...proformas, nuevaProforma]);

      // Ajustar sistema (descontar)
      // Esta funcionalidad se implementaría aquí si fuera necesario ajustar el sistema

      toast("Proforma registrada correctamente", "success");
      setMostrarModal(false);
      setLineas([]);
      setFormData({
        asesor: "Hervin",
        almacen: "callao",
        registrado: "Joseph",
        numero: "",
      });
    } catch (error) {
      console.error("Error registrando proforma:", error);
      alert("Error al registrar proforma: " + error.message);
    }
  };

  const toggleEstado = (id) => {
    const proforma = proformas.find((p) => p.id === id);
    if (!proforma) return;

    proforma.estado = proforma.estado === "Ingreso" ? "Emitido" : "Ingreso";
    setProformas([...proformas]);
    toast("Estado de proforma actualizado", "success");
  };

  const proformasFiltradas = proformas.filter((p) => {
    if (!filtroTexto) return true;
    const txt = filtroTexto.toLowerCase();
    return (
      p.num.toLowerCase().includes(txt) ||
      p.asesor.toLowerCase().includes(txt) ||
      p.registrado.toLowerCase().includes(txt) ||
      p.almacen.toLowerCase().includes(txt)
    );
  });

  if (authLoading) {
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
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${
          sidebarOpen ? "lg:ml-60 ml-0" : "ml-0"
        }`}
      >
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto custom-scrollbar" style={{ background: "#F7FAFF" }}>
          <div className="max-w-[95%] mx-auto px-4 py-4">
            <button
              onClick={() => router.push("/logistica")}
              className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-blue-700 to-blue-800 text-white rounded-lg font-semibold hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver a Logística</span>
            </button>

            <BannerSesion sesionActual={sesionActual} />

            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6 mb-4">
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-xl flex items-center justify-center text-white shadow-sm">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-2xl font-medium text-gray-900 tracking-tight">Simulación de Proformas</h1>
                      <p className="text-sm text-gray-600 font-medium mt-0.5">Gestión de proformas de inventario</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setMostrarModal(true)}
                    className="px-4 py-2 bg-gradient-to-br from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-semibold text-sm"
                  >
                    Nueva Proforma
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Buscar proformas..."
                  value={filtroTexto}
                  onChange={(e) => setFiltroTexto(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-700 to-blue-800">
                      <th className="px-4 py-3 text-[10px] font-bold text-white">ID</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-white">Fecha</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-white">Asesor</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-white">Registrado</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-white">Almacén</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-white">Número</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-white">PDF</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-white">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proformasFiltradas.map((pf) => (
                      <tr key={pf.id} className="border-b border-gray-100 hover:bg-blue-50">
                        <td className="px-4 py-2 text-[10px] text-gray-700">{pf.id}</td>
                        <td className="px-4 py-2 text-[10px] text-gray-700">{pf.fecha}</td>
                        <td className="px-4 py-2 text-[10px] text-gray-700">{pf.asesor}</td>
                        <td className="px-4 py-2 text-[10px] text-gray-700">{pf.registrado}</td>
                        <td className="px-4 py-2 text-[10px] text-gray-700">{pf.almacen.toUpperCase()}</td>
                        <td className="px-4 py-2 text-[10px] text-gray-700">{pf.num}</td>
                        <td className="px-4 py-2 text-center">
                          {pf.pdfUrl ? (
                            <a
                              href={pf.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-2 py-1 bg-cyan-500 text-white rounded text-[10px] hover:bg-cyan-600"
                            >
                              Ver PDF
                            </a>
                          ) : (
                            <span className="text-gray-400 text-[10px]">-</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button
                            onClick={() => toggleEstado(pf.id)}
                            className={`px-3 py-1 rounded text-[10px] font-semibold ${
                              pf.estado === "Ingreso"
                                ? "bg-red-500 text-white hover:bg-red-600"
                                : "bg-green-500 text-white hover:bg-green-600"
                            }`}
                          >
                            {pf.estado === "Ingreso" ? "PROFORMA INGRESADA" : "TIENE COMPROBANTE"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {proformasFiltradas.length === 0 && (
                <div className="text-center py-8 text-gray-500">No hay proformas registradas</div>
              )}
            </div>
          </div>
        </main>
      </div>

      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Nueva Proforma</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Asesor</label>
                  <input
                    type="text"
                    value={formData.asesor}
                    onChange={(e) => setFormData({ ...formData, asesor: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Almacén</label>
                  <select
                    value={formData.almacen}
                    onChange={(e) => setFormData({ ...formData, almacen: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="callao">Callao</option>
                    <option value="malvinas">Malvinas</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registrado por</label>
                  <input
                    type="text"
                    value={formData.registrado}
                    onChange={(e) => setFormData({ ...formData, registrado: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número (opcional)</label>
                  <input
                    type="text"
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Se generará automáticamente si se deja vacío"
                  />
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">Líneas de Producto</h3>
                  <button
                    onClick={agregarLinea}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    + Agregar Línea
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-2 py-2 text-left">Producto/Código</th>
                        <th className="px-2 py-2 text-left">UM</th>
                        <th className="px-2 py-2 text-left">Cantidad</th>
                        <th className="px-2 py-2 text-left">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineas.map((linea, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={linea.codigo || linea.producto || ""}
                              onChange={(e) => actualizarLinea(idx, "codigo", e.target.value)}
                              placeholder="Código o producto"
                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <select
                              value={linea.um}
                              onChange={(e) => actualizarLinea(idx, "um", e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                            >
                              <option value="UNI">UNI</option>
                              <option value="DOC">DOC</option>
                            </select>
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min="0"
                              value={linea.cantidad}
                              onChange={(e) => actualizarLinea(idx, "cantidad", Number(e.target.value) || 0)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <button
                              onClick={() => eliminarLinea(idx)}
                              className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setMostrarModal(false);
                    setLineas([]);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={registrarProforma}
                  className="flex-1 px-4 py-2 bg-gradient-to-br from-blue-700 to-blue-800 text-white rounded-lg hover:from-blue-800 hover:to-blue-900"
                >
                  Registrar Proforma
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
