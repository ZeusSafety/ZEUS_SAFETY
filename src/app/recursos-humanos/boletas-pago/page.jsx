'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '../../../components/layout/Header';
import { Sidebar } from '../../../components/layout/Sidebar';
import PeriodoSelector from './components/PeriodoSelector';
import BoletaUploader from './components/BoletaUploader';
import BoletaTabla from './components/BoletaTabla';
import BoletaFormCompleto from './components/BoletaFormCompleto';
import BoletaDetalle from './components/BoletaDetalle';
import ProgresoMasivo from './components/ProgresoMasivo';
import usePeriodos from './hooks/usePeriodos';
import useBoletas from './hooks/useBoletas';
import useExtractorPDF from './hooks/useExtractorPDF';

export default function GestionBoletasPagoPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [view, setView] = useState('dashboard');
  const [selectedPeriodoId, setSelectedPeriodoId] = useState(null);
  const [selectedBoletaId, setSelectedBoletaId] = useState(null);
  const [isDetalleOpen, setIsDetalleOpen] = useState(false);
  const [currentEditData, setCurrentEditData] = useState(null);
  const [extractedQueue, setExtractedQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(0);

  const { periodos, loading: loadingPeriodos, createPeriodo } = usePeriodos();
  const { boletas, loading: loadingBoletas, fetchBoletas, getBoleta, createBoleta, updateBoleta, emitirBoleta } = useBoletas();
  const { loading: extracting, progreso, extraerMasivo } = useExtractorPDF();

  useEffect(() => {
    if (periodos.length > 0 && !selectedPeriodoId) {
       setSelectedPeriodoId(periodos[0].ID_PERIODO);
    }
  }, [periodos, selectedPeriodoId]);

  useEffect(() => {
    if (selectedPeriodoId) {
       fetchBoletas({ id_periodo: selectedPeriodoId });
    }
  }, [selectedPeriodoId, fetchBoletas]);

  const handleProcesarArchivos = async (files) => {
    try {
      const response = await extraerMasivo(files);
      if (response && response.resultados) {
        setExtractedQueue(response.resultados);
        setQueueIndex(0);
      }
      return response;
    } catch (error) {
      console.error('Error processing files:', error);
    }
  };

  const handleReviewAll = () => {
    if (extractedQueue.length > 0) {
      const data = extractedQueue[queueIndex];
      // Asegurar que los arrays estén inicializados
      const processedData = {
        ...data,
        suspensiones: Array.isArray(data.suspensiones) ? data.suspensiones : [],
        asistencia_detalle: Array.isArray(data.asistencia_detalle) ? data.asistencia_detalle : [],
        // Si hay datos_pdf, asegurar que se procesen correctamente
        datos_pdf: data.datos_pdf || {},
        errores_extraccion: Array.isArray(data.errores_extraccion) ? data.errores_extraccion : []
      };
      setCurrentEditData(processedData);
      setView('editing');
    }
  };

  const handleSaveBoleta = async (data) => {
    try {
      if (data.id_boleta) {
        await updateBoleta(data.id_boleta, data);
      } else {
        await createBoleta({ ...data, id_periodo: selectedPeriodoId });
      }
      
      if (extractedQueue.length > 0 && queueIndex < extractedQueue.length - 1) {
         setQueueIndex(prev => prev + 1);
         setCurrentEditData(extractedQueue[queueIndex + 1]);
      } else {
         setView('dashboard');
         setExtractedQueue([]);
         fetchBoletas({ id_periodo: selectedPeriodoId });
      }
    } catch (error) {
      console.error('Error saving boleta:', error);
      alert('Error al guardar: ' + error.message);
    }
  };

  const handleEmitirPDF = async (id) => {
    try {
      const response = await emitirBoleta(id);
      if (response && response.url_pdf) {
        window.open(response.url_pdf, '_blank');
      }
    } catch (error) {
      console.error('Error emitting PDF:', error);
      alert('Error al emitir PDF: ' + error.message);
    }
  };

  const handleExportExcel = async () => {
    if (boletas.length === 0) return;
    try {
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet(boletas.map(b => ({
        'Período': b.PERIODO || (b.MES + '/' + b.ANIO),
        'Trabajador': b.TRABAJADOR,
        'DNI': b.NUMERO_DOCUMENTO,
        'Área': b.AREA,
        'Cargo': b.CARGO,
        'Rem. Básica': b.REMUNERACION_BASICA,
        'Total Ingresos': b.TOTAL_INGRESOS,
        'Total Descuentos': b.TOTAL_DESCUENTOS,
        'Neto a Pagar': b.NETO_PAGAR,
        'Estado': b.ESTADO_BOLETA
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Boletas");
      XLSX.writeFile(wb, `Boletas_Pago_${selectedPeriodoId}.xlsx`);
    } catch (err) {
      console.error('Error exporting:', err);
    }
  };

  const handleVerDetalle = async (id) => {
    const data = await getBoleta(id);
    if (data) {
      setSelectedBoletaId(id);
      setIsDetalleOpen(true);
    }
  };

  const handleEditBoleta = async (id) => {
    const data = await getBoleta(id);
    if (data) {
      // Asegurar que los arrays estén inicializados
      const processedData = {
        ...data,
        suspensiones: Array.isArray(data.suspensiones) ? data.suspensiones : [],
        asistencia_detalle: Array.isArray(data.asistencia_detalle) ? data.asistencia_detalle : [],
        errores_extraccion: Array.isArray(data.errores_extraccion) ? data.errores_extraccion : []
      };
      setCurrentEditData(processedData);
      setView('editing');
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-50" style={{ fontFamily: 'var(--font-poppins)' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${sidebarOpen ? "lg:ml-60 ml-0" : "ml-0"}`}>
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto custom-scrollbar" style={{ background: 'linear-gradient(to bottom, #f7f9fc, #ffffff)' }}>
          <div className="max-w-[95%] mx-auto px-4 py-4">
            
            {/* Botón Volver */}
            <button
              onClick={() => router.push("/recursos-humanos")}
              className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-lg font-medium hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm text-sm"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver a Recursos Humanos</span>
            </button>

            {/* Card contenedor */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">

              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-xl flex items-center justify-center text-white shadow-sm">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-2xl font-medium text-gray-900 tracking-tight" style={{ fontFamily: 'var(--font-poppins)' }}>GESTIÓN DE BOLETAS DE PAGO</h1>
                      <p className="text-sm text-gray-600 font-medium mt-0.5">Emisión masiva y control de planillas Zeus Safety</p>
                    </div>
                  </div>

                  {view === 'editing' && (
                    <button 
                      onClick={() => setView('dashboard')}
                      className="flex items-center space-x-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold text-xs transition-all border border-gray-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      <span>Volver al Dashboard</span>
                    </button>
                  )}
                </div>
              </div>

              {view === 'dashboard' ? (
                <div className="space-y-4">
                  <PeriodoSelector 
                    periodos={periodos} 
                    selectedPeriodoId={selectedPeriodoId} 
                    onSelectPeriodo={setSelectedPeriodoId}
                    onCreatePeriodo={createPeriodo}
                  />

                  <BoletaUploader onProcesar={handleProcesarArchivos} />

                  <BoletaTabla 
                     boletas={boletas} 
                     loading={loadingBoletas}
                     onVer={handleVerDetalle} 
                     onEditar={handleEditBoleta}
                     onGenerarPDF={handleEmitirPDF}
                     onExportExcel={handleExportExcel}
                  />
                </div>
              ) : (
                <BoletaFormCompleto 
                   initialData={currentEditData} 
                   onSave={handleSaveBoleta}
                   onEmit={handleEmitirPDF}
                   isEditing={!!currentEditData?.id_boleta}
                   periodos={periodos}
                />
              )}
            </div>
          </div>
        </main>
      </div>

      <BoletaDetalle 
        isOpen={isDetalleOpen} 
        onClose={() => setIsDetalleOpen(false)} 
        boleta={boletas.find(b => b.ID_BOLETA === selectedBoletaId)} 
      />

      {extractedQueue.length > 0 && (
         <ProgresoMasivo 
           total={progreso.total} 
           actual={progreso.actual} 
           completado={progreso.completado}
           onReviewAll={handleReviewAll}
         />
      )}
    </div>
  );
}
