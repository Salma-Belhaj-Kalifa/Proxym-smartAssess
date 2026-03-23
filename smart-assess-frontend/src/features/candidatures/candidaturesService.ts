import apiClient from '@/lib/api';
import { Candidature } from './types';

export const candidaturesService = {
  getAll: async (): Promise<Candidature[]> => {
    const res = await apiClient.get('/candidatures');
    return res.data;
  },

  getById: async (id: number): Promise<Candidature> => {
    const res = await apiClient.get(`/candidatures/${id}`);
    return res.data;
  },

  create: async (data: Partial<Candidature>): Promise<Candidature> => {
    const res = await apiClient.post('/candidatures', data);
    return res.data;
  },

  update: async (id: number, data: Partial<Candidature>): Promise<Candidature> => {
    const res = await apiClient.put(`/candidatures/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/candidatures/${id}`);
  },

  getByPosition: async (positionId: number): Promise<Candidature[]> => {
    const res = await apiClient.get(`/candidatures/position/${positionId}`);
    return res.data;
  },

  getByCandidate: async (candidateId: number): Promise<Candidature[]> => {
    const res = await apiClient.get(`/candidatures/candidate/${candidateId}`);
    return res.data;
  },

  updateStatus: async (id: number, status: string): Promise<Candidature> => {
    const res = await apiClient.put(`/candidatures/${id}/status`, { status });
    return res.data;
  },
};
