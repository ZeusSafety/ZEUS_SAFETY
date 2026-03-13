import { useState, useCallback } from 'react';
import boletasService from '../services/boletasService';

const useBoletas = () => {
  const [boletas, setBoletas] = useState([]);
  const [currentBoleta, setCurrentBoleta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBoletas = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const data = await boletasService.getBoletas(filters);
      setBoletas(data);
    } catch (err) {
      setError(err.message || 'Error al obtener las boletas');
      console.error('Error in useBoletas fetch:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getBoleta = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const data = await boletasService.getBoletaById(id);
      setCurrentBoleta(data);
      return data;
    } catch (err) {
      setError(err.message || 'Error al obtener el detalle de la boleta');
      console.error('Error in useBoletas getById:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createBoleta = async (boletaData) => {
    try {
      setLoading(true);
      setError(null);
      const newBoleta = await boletasService.createBoleta(boletaData);
      setBoletas((prev) => [newBoleta, ...prev]);
      return newBoleta;
    } catch (err) {
      setError(err.message || 'Error al guardar la boleta');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateBoleta = async (id, boletaData) => {
    try {
      setLoading(true);
      setError(null);
      const updatedBoleta = await boletasService.updateBoleta(id, boletaData);
      setBoletas((prev) => prev.map((b) => (b.id_boleta === id ? updatedBoleta : b)));
      return updatedBoleta;
    } catch (err) {
      setError(err.message || 'Error al actualizar la boleta');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const emitirBoleta = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await boletasService.generarPDF(id);
      // Actualizar la boleta localmente
      if (response && response.url_pdf) {
        setBoletas((prev) => 
          prev.map((b) => (b.id_boleta === id ? { ...b, estado_boleta: 'EMITIDO', url_pdf_empresa: response.url_pdf } : b))
        );
      }
      return response;
    } catch (err) {
      setError(err.message || 'Error al emitir el PDF de la boleta');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { 
    boletas, 
    currentBoleta, 
    loading, 
    error, 
    fetchBoletas, 
    getBoleta, 
    createBoleta, 
    updateBoleta, 
    emitirBoleta 
  };
};

export default useBoletas;
