"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Modal from "../ui/Modal";

// Nueva API de permisos por área (Proxy)
const API_PERMISOS_URL = "/api/permisos-area";

const AREAS_MAP = {
    1: "MARKETING",
    2: "IMPORTACION",
    3: "SISTEMAS",
    4: "FACTURACION",
    5: "LOGISTICA",
    6: "GERENCIA",
    7: "ADMINISTRACION",
    8: "VENTAS",
    9: "RECURSOS HUMANOS"
};

const COLABORADORES_MAP = {
    1: "HERVIN",
    2: "KIMBERLY",
    3: "EVELYN",
    4: "ERIK",
    5: "ANAI",
    6: "JOSEPH",
    7: "JHONSON",
    8: "WALTER",
    9: "FRANKLIN",
    10: "JAVIER",
    11: "FRANCHESCA",
    12: "FRETH",
    13: "MIGUEL",
    14: "RENZO",
    15: "ALVARO",
    16: "VICTOR",
    17: "MANUEL",
    18: "FERNANDO",
    19: "ELIAS",
    20: "JAIR",
    21: "SEBASTIÁN",
    22: "SANDRA",
    23: "JOAQUIN",
    24: "EDGAR",
    34: "ALFONSO",
    35: "JOSELYN",
    36: "ZEUS",
    37: "DAYANA",
    38: "YEIMI",
    39: "JOSE",
    40: "LIZETH",
    67: "PEDRO",
    68: "LARITZA",
    69: "DHILSEN"
};

const getLabelFromMap = (map, id) => {
    if (id === undefined || id === null || id === "") return null;
    const strId = String(id).trim();
    return map[strId] || map[Number(strId)];
};

export default function ListadoPermisosArea({ moduloArea, tituloModulo }) {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [permisos, setPermisos] = useState([]);
    const [loadingData, setLoadingData] = useState(true);

    // Filtros
    const [areaRecepcion, setAreaRecepcion] = useState(moduloArea || "");
    const [areaEmision, setAreaEmision] = useState("");
    const [colaborador, setColaborador] = useState("");
    const [estado, setEstado] = useState("");

    // Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Modales
    const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
    const [modalArchivosOpen, setModalArchivosOpen] = useState(false);
    const [modalProcedimientosOpen, setModalProcedimientosOpen] = useState(false); // Para el botón de procedimientos
    const [textoModal, setTextoModal] = useState("");
    const [tituloModal, setTituloModal] = useState("");
    const [archivosSeleccionados, setArchivosSeleccionados] = useState([]);

    // Actualización de estado
    const [modalActualizarEstadoOpen, setModalActualizarEstadoOpen] = useState(false);
    const [updateData, setUpdateData] = useState({
        id_permiso: null,
        estado_solicitud: 'PENDIENTE',
        horas_cumplidas: 0,
        horas_faltantess: 0,
        estado_completado: 'PENDIENTE'
    });
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const handleOpenUpdateModal = (permiso) => {
        setUpdateData({
            id_permiso: permiso.ID || permiso.id,
            estado_solicitud: permiso.ESTADO_SOLICITUD || permiso.estado_solicitud || 'PENDIENTE',
            horas_cumplidas: permiso.HORAS_CUMPLIDAS || permiso.horas_cumplidas || 0,
            horas_faltantess: permiso.HORAS_FALTANTESS || permiso.horas_faltantess || 0,
            estado_completado: permiso.ESTADO_COMPLETADO || permiso.estado_completado || 'PENDIENTE',
        });
        setModalActualizarEstadoOpen(true);
    };

    const handleUpdateStatus = async () => {
        setUpdatingStatus(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/permisos-laborales', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token?.startsWith('Bearer') ? token : `Bearer ${token}`
                },
                body: JSON.stringify(updateData),
            });

            if (!response.ok) {
                throw new Error('Error al actualizar estado');
            }

            await cargarPermisos();
            setModalActualizarEstadoOpen(false);
            setUpdateData({});
            alert('Estado del permiso actualizado correctamente');
        } catch (error) {
            console.error('Error:', error);
            alert('Error al actualizar estado: ' + error.message);
        } finally {
            setUpdatingStatus(false);
        }
    };

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    // Cargar permisos
    useEffect(() => {
        if (user) {
            cargarPermisos();
        }
    }, [user]);

    const cargarPermisos = async () => {
        try {
            setLoadingData(true);
            const token = localStorage.getItem('token');

            // Usar el nuevo proxy que acepta 'listado'
            const areaParaListado = moduloArea || "TODAS";
            const url = `${API_PERMISOS_URL}?listado=${encodeURIComponent(areaParaListado)}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token?.startsWith('Bearer') ? token : `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) {
                    setPermisos(data);
                } else if (data && typeof data === 'object') {
                    const arrayData = data.data || data.permisos || data.result || [];
                    setPermisos(Array.isArray(arrayData) ? arrayData : []);
                }
            } else {
                console.error("Error respuesta API:", response.status);
                setPermisos([]);
            }
        } catch (error) {
            console.error("Error al obtener permisos:", error);
            setPermisos([]);
        } finally {
            setLoadingData(false);
        }
    };

    // Filtrar permisos dinámicamente
    const permisosFiltrados = useMemo(() => {
        let filtered = [...permisos];

        // Filtrar por área de recepción
        if (areaRecepcion) {
            filtered = filtered.filter(p => {
                const area = p.NOMBRE_AREA_RECEPCION || p.AREA_RECEPCION || "";
                return area.toUpperCase() === areaRecepcion.toUpperCase();
            });
        }

        // Filtrar por área de emisión
        if (areaEmision) {
            filtered = filtered.filter(p => {
                const area = p.NOMBRE_AREA || p.AREA_ENVIO || "";
                return area.toUpperCase() === areaEmision.toUpperCase();
            });
        }

        // Filtrar por colaborador
        if (colaborador.trim()) {
            const term = colaborador.toLowerCase();
            filtered = filtered.filter(p => {
                const regPor = (p.REGISTRADO_POR || p.registrado_por || p.NOMBRE || "").toLowerCase();
                return regPor.includes(term);
            });
        }

        // Filtrar por estado
        if (estado) {
            filtered = filtered.filter(p => {
                const est = p.ESTADO_SOLICITUD || p.estado_solicitud || "";
                return est.toUpperCase() === estado.toUpperCase();
            });
        }

        return filtered;
    }, [permisos, areaRecepcion, areaEmision, colaborador, estado]);

    // Paginación
    const totalPages = Math.ceil(permisosFiltrados.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const permisosPaginados = permisosFiltrados.slice(startIndex, startIndex + itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [areaRecepcion, areaEmision, colaborador, estado]);

    // Utils
    const formatFecha = (value) => {
        if (!value) return '-';
        try {
            const d = new Date(value.includes(' ') ? value.replace(' ', 'T') : value);
            if (!isNaN(d)) {
                return d.toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            }
            return value;
        } catch (e) { return value; }
    };

    const getEstadoBadge = (estado) => {
        const st = String(estado || "").toLowerCase();
        const map = {
            "pendiente": "bg-gradient-to-br from-yellow-500 to-yellow-600",
            "aprobado": "bg-gradient-to-br from-green-600 to-green-700",
            "rechazado": "bg-gradient-to-br from-red-600 to-red-700",
        };
        return map[st] || "bg-gradient-to-br from-gray-500 to-gray-600";
    };

    const parseArchivos = (str) => {
        if (!str) return [];
        try { return JSON.parse(str); } catch (e) { return []; }
    };

    const handleExportarPDF = async () => {
        try {
            const { jsPDF } = await import("jspdf");
            const autoTable = (await import("jspdf-autotable")).default;

            const doc = new jsPDF("landscape");

            doc.setFontSize(14);
            doc.text(`Reporte de Permisos - ${tituloModulo || 'General'}`, 14, 15);

            const dataExport = permisosFiltrados.map(p => [
                formatFecha(p.FECHA_REGISTRO),
                p.ID || p.id,
                p.REGISTRADO_POR || p.NOMBRE || '-',
                p.AREA_ENVIO || '-',
                p.TIPO_PERMISO || '-',
                p.AREA_RECEPCION || '-',
                p.ESTADO_SOLICITUD || 'PENDIENTE'
            ]);

            autoTable(doc, {
                head: [["Fecha", "N°", "Registrado Por", "Área Envío", "Tipo", "Área Recep.", "Estado"]],
                body: dataExport,
                startY: 25,
            });

            doc.save("Reporte_Permisos.pdf");
        } catch (error) {
            console.error(error);
            alert("Error al exportar PDF");
        }
    };

    return (
        <div className="max-w-[98%] mx-auto px-4 py-4">
            {/* Header Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#002D5A] to-[#002D5A] rounded-xl flex items-center justify-center text-white shadow-sm">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                                Gestión de Permisos - {tituloModulo}
                            </h1>
                            <p className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-poppins)' }}>
                                Visualización y control de permisos laborales del área
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button onClick={() => setModalProcedimientosOpen(true)} className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-lg text-xs font-semibold shadow-sm hover:scale-105 transition-all">
                            Procedimientos
                        </button>
                        <button onClick={handleExportarPDF} className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg text-xs font-semibold shadow-sm hover:scale-105 transition-all">
                            Exportar a PDF
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1 uppercase" style={{ fontFamily: 'var(--font-poppins)' }}>Área de Recepción</label>
                        <div className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white text-black font-extrabold outline-none uppercase shadow-md focus:ring-2 focus:ring-blue-500">
                            {areaRecepcion || "Cargando..."}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1 uppercase" style={{ fontFamily: 'var(--font-poppins)' }}>Área de Emisión</label>
                        <select value={areaEmision} onChange={e => setAreaEmision(e.target.value)} className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white text-black font-extrabold outline-none shadow-md focus:ring-2 focus:ring-blue-500" style={{ fontFamily: 'var(--font-poppins)' }}>
                            <option value="">TODAS LAS ÁREAS</option>
                            <option value="SISTEMAS">SISTEMAS</option>
                            <option value="LOGISTICA">LOGISTICA</option>
                            <option value="MARKETING">MARKETING</option>
                            <option value="VENTAS">VENTAS</option>
                            <option value="GERENCIA">GERENCIA</option>
                            <option value="ADMINISTRACION">ADMINISTRACION</option>
                            <option value="RECURSOS HUMANOS">RECURSOS HUMANOS</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1 uppercase" style={{ fontFamily: 'var(--font-poppins)' }}>Colaborador</label>
                        <input type="text" value={colaborador} onChange={e => setColaborador(e.target.value)} placeholder="Buscar por nombre..." className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white text-black font-extrabold placeholder:text-gray-400 outline-none shadow-md focus:ring-2 focus:ring-blue-500" style={{ fontFamily: 'var(--font-poppins)' }} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1 uppercase" style={{ fontFamily: 'var(--font-poppins)' }}>Estado</label>
                        <select value={estado} onChange={e => setEstado(e.target.value)} className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white text-black font-extrabold outline-none shadow-md focus:ring-2 focus:ring-blue-500" style={{ fontFamily: 'var(--font-poppins)' }}>
                            <option value="">TODOS LOS ESTADOS</option>
                            <option value="PENDIENTE">PENDIENTE</option>
                            <option value="APROBADO">APROBADO</option>
                            <option value="RECHAZADO">RECHAZADO</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-center whitespace-nowrap">
                            <thead>
                                <tr className="bg-gradient-to-r from-blue-700 to-blue-800 border-b-2 border-blue-900 text-white">
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>FECHA REGISTRO</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>AREA RECEPCIÓN</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>COLABORADOR</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>FECHA INICIO</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>FECHA FIN</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>TIPO PERMISO</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>MOTIVO</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>ESTADO SOLICITUD</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>HORAS SOLICITADAS</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>HORAS CUMPLIDAS</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>HORAS FALTANTES</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap" style={{ fontFamily: 'var(--font-poppins)' }}>ESTADO COMPLETADO</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loadingData ? (
                                    <tr><td colSpan="12" className="py-10 text-gray-500 text-xs">Cargando datos...</td></tr>
                                ) : permisosPaginados.length === 0 ? (
                                    <tr><td colSpan="12" className="py-10 text-gray-500 text-xs">No se encontraron resultados.</td></tr>
                                ) : (
                                    permisosPaginados.map((p, i) => (
                                        <tr key={p.ID || i} className="hover:bg-blue-50 transition-colors border-b border-gray-100">
                                            <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{formatFecha(p.FECHA_REGISTRO)}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>
                                                {getLabelFromMap(AREAS_MAP, p.ID_AREA_RECEPCION || p.id_area_recep || p.id_area_recepcion || p.ID_AREA || p.id_area || p.id_area_peticion || p.ID_AREA_PETICION) || p.NOMBRE_AREA_RECEPCION || p.AREA_RECEPCION || '-'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-[10px] font-medium text-blue-800" style={{ fontFamily: 'var(--font-poppins)' }}>
                                                {getLabelFromMap(COLABORADORES_MAP, p.ID_COLABORADOR || p.id_colaborador || p.ID_PERSONA || p.id_persona || p.id_usuario || p.USUARIO_ID) || p.NOMBRE_COLABORADOR || p.nombre_colaborador || p.REGISTRADO_POR || p.registrado_por || p.NOMBRE || p.nombre || '-'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{formatFecha(p.FECHA_INICIO)}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{formatFecha(p.FECHA_FIN)}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{p.TIPO_PERMISO}</td>
                                            <td className="px-4 py-3 text-[10px] text-gray-700 text-center">
                                                {(p.MOTIVO || p.motivo) ? (
                                                    <button
                                                        onClick={() => { setTituloModal("Detalle del Motivo"); setTextoModal(p.MOTIVO || p.motivo); setModalDetalleOpen(true); }}
                                                        className="inline-flex items-center justify-center p-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors shadow-sm"
                                                        title="Ver motivo"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </button>
                                                ) : '-'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-[10px]">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-semibold text-white shadow-sm ${getEstadoBadge(p.ESTADO_SOLICITUD)}`}>
                                                    {p.ESTADO_SOLICITUD || "PENDIENTE"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{p.HORAS_SOLICITADAS || '-'}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{p.HORAS_CUMPLIDAS || '-'}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700" style={{ fontFamily: 'var(--font-poppins)' }}>{p.HORAS_FALTANTES || p.HORAS_FALTANTESS || '-'}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-[10px] text-gray-700 text-center">
                                                <button
                                                    onClick={() => handleOpenUpdateModal(p)}
                                                    className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md ${(p.ESTADO_COMPLETADO || p.estado_completado) === 'COMPLETADO'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : 'bg-gray-100 text-gray-700'
                                                        }`}
                                                    style={{ fontFamily: 'var(--font-poppins)' }}
                                                    title="Clic para actualizar"
                                                >
                                                    <span className="mr-2 uppercase">{p.ESTADO_COMPLETADO || p.estado_completado || 'PENDIENTE'}</span>
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 flex items-center justify-between border-t border-gray-200">
                        <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm">«</button>
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm">&lt;</button>

                        <span className="text-xs text-gray-700 font-semibold" style={{ fontFamily: 'var(--font-poppins)' }}>Página {currentPage} de {totalPages || 1}</span>

                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm">&gt;</button>
                        <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0} className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm">»</button>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <Modal isOpen={modalDetalleOpen} onClose={() => setModalDetalleOpen(false)} title={tituloModal} size="md">
                <div className="p-4 text-gray-800 whitespace-pre-wrap text-sm">{textoModal}</div>
            </Modal>
            <Modal isOpen={modalArchivosOpen} onClose={() => setModalArchivosOpen(false)} title="Archivos Adjuntos" size="md">
                <div className="p-4 space-y-2">
                    {archivosSeleccionados.map((archivo, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                            <span className="text-xs text-gray-700 truncate max-w-[200px]">{archivo.nombre || `Archivo ${idx + 1}`}</span>
                            <a href={archivo.url || archivo} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">Ver/Descargar</a>
                        </div>
                    ))}
                    {archivosSeleccionados.length === 0 && <p className="text-sm text-gray-500">No hay archivos.</p>}
                </div>
            </Modal>
            <Modal isOpen={modalProcedimientosOpen} onClose={() => setModalProcedimientosOpen(false)} title="Procedimientos" size="md">
                <div className="p-4 text-sm text-gray-700">
                    <p>Aquí se mostrarían los procedimientos del área.</p>
                </div>
            </Modal>

            {/* Modal para actualizar el estado del permiso */}
            <Modal
                isOpen={modalActualizarEstadoOpen}
                onClose={() => setModalActualizarEstadoOpen(false)}
                title="Actualizar Estado de Permiso"
                size="md"
            >
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                        {/* Estado Solicitud */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase" style={{ fontFamily: 'var(--font-poppins)' }}>
                                Estado Solicitud
                            </label>
                            <select
                                value={updateData.estado_solicitud}
                                onChange={(e) => setUpdateData({ ...updateData, estado_solicitud: e.target.value })}
                                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-semibold text-gray-700"
                                style={{ fontFamily: 'var(--font-poppins)' }}
                            >
                                <option value="PENDIENTE">PENDIENTE</option>
                                <option value="APROBADO">APROBADO</option>
                                <option value="RECHAZADO">RECHAZADO</option>
                            </select>
                        </div>

                        {/* Horas Cumplidas */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase" style={{ fontFamily: 'var(--font-poppins)' }}>
                                Horas Cumplidas
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                value={updateData.horas_cumplidas}
                                onChange={(e) => setUpdateData({ ...updateData, horas_cumplidas: parseFloat(e.target.value) || 0 })}
                                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-semibold text-gray-700"
                                style={{ fontFamily: 'var(--font-poppins)' }}
                            />
                        </div>

                        {/* Horas Faltantes */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase" style={{ fontFamily: 'var(--font-poppins)' }}>
                                Horas Faltantes
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                value={updateData.horas_faltantess}
                                onChange={(e) => setUpdateData({ ...updateData, horas_faltantess: parseFloat(e.target.value) || 0 })}
                                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-semibold text-gray-700"
                                style={{ fontFamily: 'var(--font-poppins)' }}
                            />
                        </div>

                        {/* Estado Completado */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase" style={{ fontFamily: 'var(--font-poppins)' }}>
                                Estado Completado
                            </label>
                            <select
                                value={updateData.estado_completado}
                                onChange={(e) => setUpdateData({ ...updateData, estado_completado: e.target.value })}
                                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-semibold text-gray-700"
                                style={{ fontFamily: 'var(--font-poppins)' }}
                            >
                                <option value="PENDIENTE">PENDIENTE</option>
                                <option value="INCOMPLETO">INCOMPLETO</option>
                                <option value="COMPLETADO">COMPLETADO</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            onClick={() => setModalActualizarEstadoOpen(false)}
                            className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all uppercase text-xs"
                            style={{ fontFamily: 'var(--font-poppins)' }}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleUpdateStatus}
                            disabled={updatingStatus}
                            className="px-6 py-2.5 bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-blue-200 uppercase text-xs disabled:opacity-50"
                            style={{ fontFamily: 'var(--font-poppins)' }}
                        >
                            {updatingStatus ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div >
    );
}
