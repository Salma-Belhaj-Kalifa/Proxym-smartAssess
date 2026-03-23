import apiClient from '@/lib/api';
import { CVAnalysisResult } from './types';

export const cvAnalysisService = {
  analyzeCV: async (file: File): Promise<CVAnalysisResult> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post('/cv/analyse', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getAnalysis: async (candidateId: number): Promise<CVAnalysisResult> => {
    const response = await apiClient.get(`/cv/analysis/${candidateId}`);
    return response.data;
  },

  uploadCV: async (candidateId: number, file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post(`/candidates/${candidateId}/cv`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  downloadCV: async (id: number): Promise<Blob> => {
    const response = await apiClient.get(`/cv/${id}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
