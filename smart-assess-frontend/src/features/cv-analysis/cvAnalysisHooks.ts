import { useCallback } from 'react';
import apiClient from '@/lib/api';
import { API_ENDPOINTS } from '@/config/apiEndpoints';

export const useCVAnalysis = () => {
  const analyzeCV = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await apiClient.post('/ai-analysis/analyze-cv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('CV Analysis error:', error);
      throw error;
    }
  }, []);

  return { analyzeCV };
};
