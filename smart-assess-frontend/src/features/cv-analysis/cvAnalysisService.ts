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
    
    try {
      const response = await apiClient.post(`/ai-analysis/analyze-cv/${candidateId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        // Augmenter le timeout pour l'analyse IA qui peut prendre du temps
        timeout: 120000, // 2 minutes
      });
      
      console.log('CV Analysis Response:', response);
      console.log('CV Analysis Data:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('=== CV ANALYSIS ERROR ===');
      console.error('Error:', error);
      console.error('Error Response:', error.response);
      console.error('Error Status:', error.response?.status);
      console.error('Error Data:', error.response?.data);
      console.error('Error Headers:', error.response?.headers);
      console.error('=== END CV ANALYSIS ERROR ===');
      
      // Relancer l'erreur pour la gestion dans le composant
      throw error;
    }
  },
};