import apiClient from '@/lib/api';
import { TechnicalProfile } from './types';

export const technicalProfileService = {
  getAll: async (): Promise<TechnicalProfile[]> => {
    const response = await apiClient.get('/technical-profiles');
    return response.data;
  },

  getById: async (id: number): Promise<TechnicalProfile> => {
    const response = await apiClient.get(`/technical-profiles/${id}`);
    return response.data;
  },

  getByCandidateId: async (candidateId: number): Promise<TechnicalProfile> => {
    const response = await apiClient.get(`/technical-profiles/candidate/${candidateId}`);
    return response.data;
  },

  create: async (profileData: Partial<TechnicalProfile>): Promise<TechnicalProfile> => {
    const response = await apiClient.post('/technical-profiles', profileData);
    return response.data;
  },

  update: async (id: number, profileData: Partial<TechnicalProfile>): Promise<TechnicalProfile> => {
    const response = await apiClient.put(`/technical-profiles/${id}`, profileData);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/technical-profiles/${id}`);
  },
};