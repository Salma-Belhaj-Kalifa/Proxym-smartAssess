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

  updateProfile: async (id: number, profileData: Partial<Candidate>): Promise<Candidate> => {
    const { firstName, lastName, phone } = profileData;
    const response = await apiClient.put(API_ENDPOINTS.CANDIDATES.UPDATE_PROFILE(id), {
      firstName,
      lastName,
      phone
    });
    return response.data;
  },

  uploadCV: async (candidateId: number, file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('candidateId', candidateId.toString());
    
    const response = await apiClient.post('/api/candidates/cv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.CANDIDATES.DELETE(id));
  },

  deleteMyProfile: async (): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.CANDIDATES.DELETE_ME);
  },
};