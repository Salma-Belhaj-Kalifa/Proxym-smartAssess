import apiClient from '@/lib/api';
import { Candidate } from './types';

export const candidatesService = {
  getAll: async (): Promise<Candidate[]> => {
    const res = await apiClient.get('/candidates');
    return res.data;
  },

  getById: async (id: number): Promise<Candidate> => {
    const res = await apiClient.get(`/candidates/${id}`);
    return res.data;
  },

  create: async (data: Partial<Candidate>): Promise<Candidate> => {
    const res = await apiClient.post('/candidates', data);
    return res.data;
  },

  update: async (id: number, data: Partial<Candidate>): Promise<Candidate> => {
    const res = await apiClient.put(`/candidates/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/candidates/${id}`);
  },

  updateProfile: async (id: number, profileData: any): Promise<Candidate> => {
    const res = await apiClient.put(`/candidates/${id}/profile`, profileData);
    return res.data;
  },

  uploadCV: async (id: number, file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await apiClient.post(`/candidates/${id}/cv`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
};
