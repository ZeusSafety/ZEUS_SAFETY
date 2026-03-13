import { useState, useEffect, useCallback } from 'react';
import boletasService from '../services/boletasService';

const usePeriodos = () => {
  const [periodos, setPeriodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPeriodos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await boletasService.getPeriodos();
      setPeriodos(data);
    } catch (err) {
      setError(err.message || 'Error al obtener los períodos');
      console.error('Error in usePeriodos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createPeriodo = async (periodoData) => {
    try {
      setLoading(true);
      const newPeriodo = await boletasService.createPeriodo(periodoData);
      setPeriodos((prev) => [...prev, newPeriodo]);
      return newPeriodo;
    } catch (err) {
      setError(err.message || 'Error al crear el período');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeriodos();
  }, [fetchPeriodos]);

  return { periodos, loading, error, fetchPeriodos, createPeriodo };
};

export default usePeriodos;
