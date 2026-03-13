'use client';

import React, { useState, useCallback } from 'react';

const BoletaUploader = ({ onProcesar }) => {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      (file) => file.type === 'application/pdf'
    );
    if (droppedFiles.length === 0) return;

    const newFiles = droppedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending',
      result: null
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files).filter(
      (file) => file.type === 'application/pdf'
    );
    const newFiles = selectedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending'
    }));
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleProcesar = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setFiles(prev => prev.map(f => ({ ...f, status: 'processing' })));
    
    try {
      const results = await onProcesar(files.map(f => f.file));
      if (results && Array.isArray(results.resultados)) {
        setFiles(prev => prev.map((f, i) => ({
          ...f,
          status: results.resultados[i]?.error ? 'error' : 'done',
          result: results.resultados[i]
        })));
      } else {
        setFiles(prev => prev.map(f => ({ ...f, status: 'done', result: results })));
      }
    } catch (error) {
      setFiles(prev => prev.map(f => ({ ...f, status: 'error' })));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4" style={{ fontFamily: 'var(--font-poppins)' }}>
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center text-white shadow-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-900">Cargar Boletas de Pago</h2>
          <p className="text-[10px] text-gray-500 font-medium">Suba los PDFs enviados por contabilidad para extraer los datos</p>
        </div>
      </div>

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all duration-200 ${
          isDragging 
            ? 'border-blue-500 bg-blue-50 scale-[1.01]' 
            : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50 hover:border-blue-200'
        }`}
      >
        <input
          type="file"
          multiple
          accept="application/pdf"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="bg-white p-4 rounded-xl shadow-sm mb-3 text-blue-600 border border-gray-100">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        
        <p className="text-sm font-bold text-gray-700">Arrastre sus boletas aquí</p>
        <p className="text-[10px] text-gray-400 font-medium mt-1">O haga clic para navegar entre sus archivos (solo PDF)</p>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Archivos seleccionados ({files.length})</span>
            <button 
              onClick={() => setFiles([])}
              className="text-[10px] font-bold text-red-500 hover:text-red-600 transition-colors bg-red-50 px-2 py-0.5 rounded"
            >
              Limpiar todo
            </button>
          </div>
          
          <div className="max-h-[250px] overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
            {files.map((fileObj) => (
              <div key={fileObj.id} className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-100 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="bg-red-50 p-1.5 rounded text-red-500 border border-red-100">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.363 2c4.155 0 2.637 6 5.637 6s6-1.518 6 2.637v11.363c0 1.104-.896 2-2 2h-16c-1.104 0-2-.896-2-2v-16c0-1.104.896-2 2-2h6.363z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-800 block leading-tight">{fileObj.file.name}</span>
                    <span className="text-[9px] text-gray-400 font-medium">{(fileObj.file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {fileObj.status === 'pending' && <span className="px-2 py-0.5 bg-gray-200 text-gray-500 text-[9px] font-bold rounded">Pendiente</span>}
                  {fileObj.status === 'processing' && (
                    <div className="flex items-center space-x-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded">
                      <div className="animate-spin rounded-full h-2.5 w-2.5 border-2 border-blue-600 border-t-transparent"></div>
                      <span className="text-[9px] font-bold">Procesando</span>
                    </div>
                  )}
                  {fileObj.status === 'done' && <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[9px] font-bold rounded border border-green-100">✓ Listo</span>}
                  {fileObj.status === 'error' && <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[9px] font-bold rounded border border-red-100">Error</span>}
                  
                  <button onClick={() => removeFile(fileObj.id)} className="p-1 text-gray-300 hover:text-red-500 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-end">
            <button
              onClick={handleProcesar}
              disabled={files.length === 0 || processing}
              className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-lg font-semibold text-xs shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>{processing ? 'Procesando...' : 'Iniciar Extracción de Datos'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoletaUploader;
