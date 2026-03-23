import apiClient from '@/lib/api';
import { Manager } from './types';

export const managersService = {
  getAll: async (): Promise<Manager[]> => {
    const res = await apiClient.get('/managers');
    return res.data;
  },

  getById: async (id: number): Promise<Manager> => {
    const res = await apiClient.get(`/managers/${id}`);
    return res.data;
  },

  update: async (id: number, data: Partial<Manager>): Promise<Manager> => {
    const res = await apiClient.put(`/managers/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/managers/${id}`);
  },
};
