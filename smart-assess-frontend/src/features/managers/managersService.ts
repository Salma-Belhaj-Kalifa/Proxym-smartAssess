import apiClient from '@/lib/api';
import API_ENDPOINTS from '@/config/apiEndpoints';
import { Manager } from './types';

export const managersService = {
  getAll: async (): Promise<Manager[]> => {
    const response = await apiClient.get(API_ENDPOINTS.MANAGERS.GET_ALL);
    return response.data;
  },

  getById: async (id: number): Promise<Manager> => {
    const response = await apiClient.get(API_ENDPOINTS.MANAGERS.GET_BY_ID(id));
    return response.data;
  },

  create: async (data: Partial<Manager>): Promise<Manager> => {
    const response = await apiClient.post(API_ENDPOINTS.MANAGERS.CREATE, data);
    return response.data;
  },

  update: async (id: number, data: Partial<Manager>): Promise<Manager> => {
    const response = await apiClient.put(API_ENDPOINTS.MANAGERS.UPDATE(id), data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.MANAGERS.DELETE(id));
  },

  getProfile: async (userId: number): Promise<Manager> => {
    const response = await apiClient.get(API_ENDPOINTS.MANAGERS.GET_BY_ID(userId));
    return response.data;
  },

  updateProfile: async (userId: number, profileData: Partial<Manager>): Promise<Manager> => {
    const response = await apiClient.put(API_ENDPOINTS.MANAGERS.UPDATE(userId), profileData);
    return response.data;
  },

  deleteMyProfile: async (): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.MANAGERS.DELETE_ME);
  },
};