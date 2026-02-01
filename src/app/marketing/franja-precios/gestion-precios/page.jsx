"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../components/context/AuthContext";
import { Header } from "../../../../components/layout/Header";
import { Sidebar } from "../../../../components/layout/Sidebar";

export default function GestionPreciosPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("MALVINAS");
  const [preciosData, setPreciosData] = useState({});
  const [loadingAll, setLoadingAll] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [editingData, setEditingData] = useState({});
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: "", type: "success" });
  const [tablasDisponibles, setTablasDisponibles] = useState([
    { value: "MALVINAS", label: "Malvinas Online", disponible: true },
    { value: "PROVINCIA", label: "Provincia Online", disponible: true },
    { value: "FERRETERIA", label: "Ferretería Online", disponible: true },
    { value: "CLIENTES_FINALES", label: "Clientes Finales Online", disponible: true },
    { value: "JICAMARCA", label: "Jicamarca", disponible: false },
    { value: "ONLINE", label: "Online", disponible: false },
  ]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

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

  const fetchPrecios = useCallback(async (tablaId) => {
    try {
      let token = localStorage.getItem("token") ||
        (user?.token || user?.accessToken || user?.access_token) ||
        sessionStorage.getItem("token");

      if (!token) {
        router.push("/login");
        throw new Error("Token no encontrado. Por favor, inicie sesión.");
      }

      const apiUrl = `/api/franja-precios?id=${encodeURIComponent(tablaId)}`;

      const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`,
      };

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          router.push("/login");
          throw new Error("token expirado");
        }
        return [];
      }

      const data = await response.json();
      return Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      console.error(`Error al obtener precios para ${tablaId}:`, err.message);
      return [];
    }
  }, [user, router]);

  useEffect(() => {
    const loadAllData = async () => {
      if (!user) return;

      setLoadingAll(true);
      setError(null);

      try {
        const promises = tablasDisponibles.map(async (tabla) => {
          const data = await fetchPrecios(tabla.value);
          return { tabla: tabla.value, data };
        });

        const results = await Promise.all(promises);
        const newPreciosData = {};
        results.forEach(({ tabla, data }) => {
          newPreciosData[tabla] = data;
        });

        setPreciosData(newPreciosData);

        setTablasDisponibles(prev =>
          prev.map(tabla => {
            if (tabla.value === "JICAMARCA" || tabla.value === "ONLINE") {
              return { ...tabla, disponible: false };
            }
            const tieneDatos = newPreciosData[tabla.value] && newPreciosData[tabla.value].length > 0;
            return { ...tabla, disponible: tieneDatos };
          })
        );
      } catch (err) {
        console.error("Error al cargar datos:", err);
        setError("Error al cargar los datos. Por favor, intente nuevamente.");
      } finally {
        setLoadingAll(false);
      }
    };

    if (!loading && user) {
      loadAllData();
    }
  }, [user, loading, fetchPrecios]);

  const getPriceColumns = useMemo(() => {
    const precios = preciosData[activeTab] || [];
    if (precios.length === 0) return [];

    const excludedFields = [
      'index', 'ID', 'id', 'Codigo', 'codigo', 'CODIGO', 'Producto', 'producto', 'PRODUCTO',
      'ficha_tecnica', 'FICHA_TECNICA', 'FICHA_TECNICA_ENLACE', 'ficha_tecnica_enlace',
      'texto_copiar', 'TEXTO_COPIAR', 'textoCopiar'
    ];

    const firstRecord = precios[0];
    const allKeys = Object.keys(firstRecord);

    return allKeys
      .filter(key => {
        const keyUpper = key.toUpperCase();
        if (excludedFields.some(excluded => keyUpper.includes(excluded.toUpperCase()))) {
          return false;
        }
        const value = firstRecord[key];
        const isNumeric = typeof value === 'number' ||
          (!isNaN(parseFloat(value)) && value !== null && value !== '');
        if (keyUpper.includes('CAJA') || keyUpper.includes('DOCENA')) {
          return isNumeric;
        }
        return false;
      })
      .sort((a, b) => {
        const aUpper = a.toUpperCase();
        const bUpper = b.toUpperCase();
        const getOrder = (str) => {
          if (str.includes('DOCENA')) return 1;
          if (str.includes('CAJA')) return 2;
          return 3;
        };
        const orderA = getOrder(aUpper);
        const orderB = getOrder(bUpper);
        if (orderA !== orderB) return orderA - orderB;
        const numA = parseInt(a.match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.match(/\d+/)?.[0] || '0');
        return numA - numB;
      });
  }, [preciosData, activeTab]);

  const precios = preciosData[activeTab] || [];

  const preciosFiltrados = useMemo(() => {
    if (!searchTerm.trim()) return precios;
    const term = searchTerm.toLowerCase().trim();
    return precios.filter((precio) => {
      const getField = (variations) => {
        for (const variation of variations) {
          if (precio[variation] !== undefined && precio[variation] !== null && precio[variation] !== "") {
            return String(precio[variation]).toLowerCase();
          }
        }
        return "";
      };
      const codigo = getField(["Codigo", "codigo", "CODIGO"]);
      const producto = getField(["Producto", "producto", "PRODUCTO"]);
      return codigo.includes(term) || producto.includes(term);
    });
  }, [precios, searchTerm]);

  const totalPages = Math.ceil(preciosFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const preciosPaginados = preciosFiltrados.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedRows(new Set());
    setEditingData({});
  }, [searchTerm, activeTab]);

  const handleSelectRow = (codigo) => {
    const precios = preciosData[activeTab] || [];
    const newSelected = new Set(selectedRows);
    if (newSelected.has(codigo)) {
      newSelected.delete(codigo);
      const newEditing = { ...editingData };
      delete newEditing[codigo];
      setEditingData(newEditing);
    } else {
      newSelected.add(codigo);
      const precio = precios.find(p => {
        const getField = (variations) => {
          for (const variation of variations) {
            if (p[variation] !== undefined && p[variation] !== null && p[variation] !== "") {
              return p[variation];
            }
          }
          return null;
        };
        return getField(["Codigo", "codigo", "CODIGO"]) === codigo;
      });
      if (precio) {
        setEditingData(prev => ({
          ...prev,
          [codigo]: { ...precio }
        }));
      }
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedRows.size === preciosPaginados.length && preciosPaginados.length > 0) {
      setSelectedRows(new Set());
      setEditingData({});
    } else {
      const newSelected = new Set();
      const newEditing = {};
      preciosPaginados.forEach(precio => {
        const getField = (variations) => {
          for (const variation of variations) {
            if (precio[variation] !== undefined && precio[variation] !== null && precio[variation] !== "") {
              return precio[variation];
            }
          }
          return null;
        };
        const codigo = getField(["Codigo", "codigo", "CODIGO"]);
        if (codigo) {
          newSelected.add(codigo);
          newEditing[codigo] = { ...precio };
        }
      });
      setSelectedRows(newSelected);
      setEditingData(newEditing);
    }
  };

  const handleEditField = (codigo, field, value) => {
    setEditingData(prev => ({
      ...prev,
      [codigo]: {
        ...prev[codigo],
        [field]: value ? parseFloat(value) : null
      }
    }));
  };

  const handleSaveAll = async () => {
    if (selectedRows.size === 0) return;

    try {
      setSaving(true);
      let token = localStorage.getItem("token") ||
        (user?.token || user?.accessToken || user?.access_token) ||
        sessionStorage.getItem("token");

      if (!token) {
        router.push("/login");
        return;
      }

      const mercado = activeTab === "MALVINAS" ? "Malvinas_online" :
                     activeTab === "PROVINCIA" ? "Provincia_online" :
                     activeTab === "FERRETERIA" ? "Ferreteria_online" :
                     activeTab === "CLIENTES_FINALES" ? "Clientes_finales_online" : activeTab;

      const promises = Array.from(selectedRows).map(async (codigo) => {
        const editRow = editingData[codigo];
        if (!editRow) return;

        const getField = (variations) => {
          for (const variation of variations) {
            if (editRow[variation] !== undefined && editRow[variation] !== null && editRow[variation] !== "") {
              return editRow[variation];
            }
          }
          return null;
        };

        const requestBody = {
          mercado: mercado,
          codigo: codigo,
          docena: getField(["Docena", "docena", "DOCENA"]) || null,
          caja_1: getField(["Caja_1", "caja_1", "CAJA_1", "Caja 1"]) || null,
          caja_5: getField(["Caja_5", "caja_5", "CAJA_5", "Caja 5"]) || null,
          caja_10: getField(["Caja_10", "caja_10", "CAJA_10", "Caja 10"]) || null,
          caja_20: getField(["Caja_20", "caja_20", "CAJA_20", "Caja 20"]) || null,
          texto_copiar: getField(["texto_copiar", "TEXTO_COPIAR", "textoCopiar"]) || ""
        };

        const apiUrl = `/api/franja-precios?method=actualizar_precios_mercado`;

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: `Error ${response.status}` }));
          throw new Error(errorData.error || `Error ${response.status}`);
        }

        return response.json();
      });

      await Promise.all(promises);

      // Recargar datos
      const updatedData = await fetchPrecios(activeTab);
      setPreciosData(prev => ({ ...prev, [activeTab]: updatedData }));

      // Limpiar selección
      setSelectedRows(new Set());
      setEditingData({});

      setNotification({
        show: true,
        message: `${selectedRows.size} producto(s) actualizado(s) exitosamente`,
        type: "success"
      });

      setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 3000);

    } catch (err) {
      setNotification({
        show: true,
        message: err.message || "Error al actualizar los precios",
        type: "error"
      });
      setTimeout(() => setNotification({ show: false, message: "", type: "error" }), 3000);
    } finally {
      setSaving(false);
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
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${sidebarOpen ? "lg:ml-60 ml-0" : "ml-0"}`}>
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 lg:p-8">
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

            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6 mb-6">
              <div className="mb-6 flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#002D5A] to-[#002D5A] rounded-xl flex items-center justify-center text-white shadow-sm">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>Gestión de Precios</h1>
                  <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: 'var(--font-poppins)' }}>
                    Actualiza y gestiona los precios de productos por mercado.
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                  {tablasDisponibles.map((tabla) => {
                    const isActive = activeTab === tabla.value;
                    const isDisabled = !tabla.disponible;
                    const hasData = preciosData[tabla.value]?.length > 0;

                    return (
                      <button
                        key={tabla.value}
                        onClick={() => {
                          if (!isDisabled) {
                            setActiveTab(tabla.value);
                            setSearchTerm("");
                          }
                        }}
                        disabled={isDisabled}
                        className={`
                          px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200
                          ${isActive
                            ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md hover:shadow-lg"
                            : isDisabled
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-sm"
                          }
                        `}
                        style={{ fontFamily: 'var(--font-poppins)' }}
                      >
                        <div className="flex items-center gap-2">
                          <span>{tabla.label}</span>
                          {hasData && !isActive && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold" style={{ fontFamily: 'var(--font-poppins)' }}>
                              {preciosData[tabla.value].length}
                            </span>
                          )}
                          {isDisabled && (
                            <span className="text-xs">(Próximamente)</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Banner de selección y guardar */}
              {selectedRows.size > 0 && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                  <p className="text-sm text-blue-700 font-semibold" style={{ fontFamily: 'var(--font-poppins)' }}>
                    {selectedRows.size} producto(s) seleccionado(s)
                  </p>
                  <button
                    onClick={handleSaveAll}
                    disabled={saving}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                    style={{ fontFamily: 'var(--font-poppins)' }}
                  >
                    {saving ? "Guardando..." : `Guardar ${selectedRows.size} cambio(s)`}
                  </button>
                </div>
              )}

              {/* Notificación */}
              {notification.show && (
                <div className={`mb-4 p-4 rounded-lg ${notification.type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
                  <p className="text-sm font-semibold" style={{ fontFamily: 'var(--font-poppins)' }}>
                    {notification.message}
                  </p>
                </div>
              )}

              {loadingAll ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
                  <span className="ml-3 text-gray-600 mt-4" style={{ fontFamily: 'var(--font-poppins)' }}>Cargando todas las clasificaciones...</span>
                </div>
              ) : precios.length === 0 ? (
                <div className="text-center py-12">
                  {(activeTab === "JICAMARCA" || activeTab === "ONLINE") ? (
                    <div>
                      <p className="text-gray-600 text-lg font-semibold mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>Próximamente</p>
                      <p className="text-gray-500 text-sm" style={{ fontFamily: 'var(--font-poppins)' }}>Esta clasificación estará disponible próximamente.</p>
                    </div>
                  ) : (
                    <p className="text-gray-500" style={{ fontFamily: 'var(--font-poppins)' }}>No hay datos disponibles para esta clasificación.</p>
                  )}
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="Buscar por código o nombre de producto..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full px-4 py-2.5 pl-11 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm text-gray-900 transition-all duration-200 hover:border-blue-300 bg-gradient-to-br from-gray-50 to-white shadow-sm font-medium"
                          style={{ fontFamily: 'var(--font-poppins)' }}
                        />
                        <svg
                          className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      </div>
                      <button
                        onClick={() => {
                          // Exportar a Excel
                          const exportToExcel = () => {
                            const headers = ['CÓDIGO', 'PRODUCTO', ...getPriceColumns.map(col => col.replace(/_/g, ' '))];
                            const rows = preciosFiltrados.map(precio => {
                              const getField = (variations) => {
                                for (const variation of variations) {
                                  if (precio[variation] !== undefined && precio[variation] !== null && precio[variation] !== "") {
                                    return precio[variation];
                                  }
                                }
                                return "";
                              };
                              const codigo = getField(["Codigo", "codigo", "CODIGO"]) || "";
                              const producto = getField(["Producto", "producto", "PRODUCTO"]) || "";
                              const precios = getPriceColumns.map(col => precio[col] || "");
                              return [codigo, producto, ...precios];
                            });
                            
                            let csvContent = headers.join(',') + '\n';
                            rows.forEach(row => {
                              csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
                            });
                            
                            const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
                            const link = document.createElement('a');
                            const url = URL.createObjectURL(blob);
                            link.setAttribute('href', url);
                            link.setAttribute('download', `precios_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
                            link.style.visibility = 'hidden';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          };
                          exportToExcel();
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105 active:scale-[0.98] text-sm whitespace-nowrap"
                        style={{ fontFamily: 'var(--font-poppins)' }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Excel
                      </button>
                      <button
                        onClick={() => {
                          // Exportar a PDF
                          const exportToPDF = () => {
                            const printWindow = window.open('', '_blank');
                            
                            let htmlContent = `
                              <!DOCTYPE html>
                              <html>
                              <head>
                                <title>Listado de Precios - ${activeTab}</title>
                                <style>
                                  body { font-family: Arial, sans-serif; padding: 20px; }
                                  h1 { color: #002D5A; }
                                  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                                  th { background-color: #1e40af; color: white; padding: 10px; text-align: left; }
                                  td { padding: 8px; border: 1px solid #ddd; }
                                  tr:nth-child(even) { background-color: #f9fafb; }
                                </style>
                              </head>
                              <body>
                                <h1>Listado de Precios - ${activeTab}</h1>
                                <p>Fecha: ${new Date().toLocaleDateString('es-ES')}</p>
                                <table>
                                  <thead>
                                    <tr>
                                      <th>CÓDIGO</th>
                                      <th>PRODUCTO</th>
                                      ${getPriceColumns.map(col => `<th>${col.replace(/_/g, ' ')}</th>`).join('')}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    ${preciosFiltrados.map(precio => {
                                      const getField = (variations) => {
                                        for (const variation of variations) {
                                          if (precio[variation] !== undefined && precio[variation] !== null && precio[variation] !== "") {
                                            return precio[variation];
                                          }
                                        }
                                        return "";
                                      };
                                      const codigo = getField(["Codigo", "codigo", "CODIGO"]) || "-";
                                      const producto = getField(["Producto", "producto", "PRODUCTO"]) || "-";
                                      const precios = getPriceColumns.map(col => {
                                        const val = precio[col];
                                        return val && val !== null && val !== "" ? `S/.${parseFloat(val).toFixed(2)}` : "-";
                                      }).join('</td><td>');
                                      return `<tr><td>${codigo}</td><td>${producto}</td><td>${precios}</td></tr>`;
                                    }).join('')}
                                  </tbody>
                                </table>
                              </body>
                              </html>
                            `;
                            
                            printWindow.document.write(htmlContent);
                            printWindow.document.close();
                            setTimeout(() => {
                              printWindow.print();
                            }, 250);
                          };
                          exportToPDF();
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105 active:scale-[0.98] text-sm whitespace-nowrap"
                        style={{ fontFamily: 'var(--font-poppins)' }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        PDF
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      {searchTerm && (
                        <p className="text-xs text-gray-500" style={{ fontFamily: 'var(--font-poppins)' }}>
                          Mostrando {preciosFiltrados.length} de {precios.length} productos
                        </p>
                      )}
                    </div>
                  </div>

                  {preciosFiltrados.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500" style={{ fontFamily: 'var(--font-poppins)' }}>No se encontraron productos que coincidan con "{searchTerm}"</p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden mb-6">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gradient-to-r from-blue-700 to-blue-800 border-b-2 border-blue-900">
                              <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                                <input
                                  type="checkbox"
                                  checked={selectedRows.size === preciosPaginados.length && preciosPaginados.length > 0}
                                  onChange={handleSelectAll}
                                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                />
                              </th>
                              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                                CÓDIGO
                              </th>
                              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>
                                PRODUCTO
                              </th>
                              {getPriceColumns.map((columna) => (
                                <th
                                  key={columna}
                                  className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap"
                                  style={{ fontFamily: 'var(--font-poppins)' }}
                                >
                                  {columna.replace(/_/g, ' ')}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {preciosPaginados.map((precio, index) => {
                              const globalIndex = startIndex + index;
                              const getField = (variations) => {
                                for (const variation of variations) {
                                  if (precio[variation] !== undefined && precio[variation] !== null && precio[variation] !== "") {
                                    return precio[variation];
                                  }
                                }
                                return null;
                              };

                              const codigo = getField(["Codigo", "codigo", "CODIGO"]);
                              const producto = getField(["Producto", "producto", "PRODUCTO"]);

                              const isSelected = selectedRows.has(codigo);
                              const editRow = editingData[codigo] || precio;

                              const formatPrice = (val) => {
                                if (val === null || val === undefined || val === "" || val === "NaN") return { text: "", isZero: false };
                                if (typeof val === "number" && isNaN(val)) return { text: "", isZero: false };
                                const num = parseFloat(val);
                                if (isNaN(num)) return { text: "", isZero: false };
                                if (num === 0) return { text: "", isZero: true };
                                return { text: `S/.${num.toFixed(2)}`, isZero: false };
                              };

                              return (
                                <tr key={globalIndex} className={`hover:bg-blue-50 transition-colors border-b border-gray-100 ${isSelected ? "bg-blue-100" : ""}`}>
                                  <td className="px-4 py-3 whitespace-nowrap text-center">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => handleSelectRow(codigo)}
                                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-[10px] font-medium text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                                    {codigo || "-"}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>
                                    {producto || "-"}
                                  </td>
                                  {getPriceColumns.map((columna) => {
                                    const precioValue = formatPrice(isSelected ? (editRow[columna] || precio[columna]) : precio[columna]);
                                    return (
                                      <td key={columna} className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>
                                        {isSelected ? (
                                          <input
                                            type="number"
                                            step="0.01"
                                            value={precioValue.text ? precioValue.text.replace("S/.", "") : ""}
                                            onChange={(e) => handleEditField(codigo, columna, e.target.value)}
                                            className="w-20 px-2 py-1 border border-blue-300 rounded text-[10px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium"
                                            style={{ fontFamily: 'var(--font-poppins)', color: '#111827' }}
                                            placeholder="0.00"
                                          />
                                        ) : (
                                          <span className="text-gray-700">{precioValue.text}</span>
                                        )}
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 flex items-center justify-between border-t border-gray-200">
                        <button
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1 || totalPages === 0}
                          className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                          style={{ fontFamily: 'var(--font-poppins)' }}
                        >
                          «
                        </button>
                        <button
                          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                          disabled={currentPage === 1 || totalPages === 0}
                          className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                          style={{ fontFamily: 'var(--font-poppins)' }}
                        >
                          &lt;
                        </button>
                        <span className="text-xs text-gray-700 font-semibold" style={{ fontFamily: 'var(--font-poppins)' }}>
                          Página {totalPages > 0 ? currentPage : 0} de {totalPages || 1}
                        </span>
                        <button
                          onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages || totalPages === 0}
                          className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                          style={{ fontFamily: 'var(--font-poppins)' }}
                        >
                          &gt;
                        </button>
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages || totalPages === 0}
                          className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                          style={{ fontFamily: 'var(--font-poppins)' }}
                        >
                          »
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
