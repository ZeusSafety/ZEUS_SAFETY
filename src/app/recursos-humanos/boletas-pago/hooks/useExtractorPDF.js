import { useState } from 'react';
import boletasService from '../services/boletasService';

const useExtractorPDF = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progreso, setProgreso] = useState({ total: 0, actual: 0, completado: false });

  const extraerUnico = async (file) => {
    try {
      setLoading(true);
      setError(null);
      const result = await boletasService.extraerPDF(file);
      return result;
    } catch (err) {
      setError(err.message || 'Error al extraer los datos del PDF');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const extraerMasivo = async (files) => {
    try {
      setLoading(true);
      setError(null);
      setProgreso({ total: files.length, actual: 0, completado: false });
      
      const result = await boletasService.extraerPDFMasivo(files);
      setProgreso({ total: files.length, actual: files.length, completado: true });
      return result;
    } catch (err) {
      setError(err.message || 'Error al extraer los datos de múltiples PDFs');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, progreso, extraerUnico, extraerMasivo };
};

export default useExtractorPDF;
