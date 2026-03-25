import apiClient from '@/lib/api';
import API_ENDPOINTS from '@/config/apiEndpoints';
import { Candidate } from './types';

export const candidateService = {
  getAll: async (): Promise<Candidate[]> => {
    const response = await apiClient.get(API_ENDPOINTS.CANDIDATES.GET_ALL);
    return response.data;
  },

  getById: async (id: number): Promise<Candidate> => {
    const response = await apiClient.get(API_ENDPOINTS.CANDIDATES.GET_BY_ID(id));
    return response.data;
  },

  create: async (data: Partial<Candidate>): Promise<Candidate> => {
    const response = await apiClient.post(API_ENDPOINTS.CANDIDATES.CREATE, data);
    return response.data;
  },

  update: async (id: number, data: Partial<Candidate>): Promise<Candidate> => {
    const response = await apiClient.put(API_ENDPOINTS.CANDIDATES.UPDATE(id), data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.CANDIDATES.DELETE(id));
  },

  deleteMyProfile: async (): Promise<void> => {
    await apiClient.delete('/candidates/my-profile');
  },
};