import apiClient from '@/lib/api';
import { CVAnalysisResult } from './types';

export const cvAnalysisService = {
  getAll: async (): Promise<CVAnalysisResult[]> => {
    const response = await apiClient.get('/ai-analysis');
    return response.data;
  },

  getById: async (id: number): Promise<CVAnalysisResult> => {
    const response = await apiClient.get(`/ai-analysis/${id}`);
    return response.data;
  },

  getByCandidate: async (candidateId: number): Promise<CVAnalysisResult[]> => {
    const response = await apiClient.get(`/ai-analysis/candidate/${candidateId}`);
    return response.data;
  },

  analyzeCV: async (candidateId: number, file: File): Promise<CVAnalysisResult> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post(`/ai-analysis/analyze-cv/${candidateId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};