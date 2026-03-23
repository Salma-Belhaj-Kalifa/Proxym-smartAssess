import apiClient from '@/lib/api';
import { Position } from './types';

export const positionsService = {
  getAll: async (): Promise<Position[]> => {
    const res = await apiClient.get('/positions');
    return res.data;
  },
  getById: async (id: number): Promise<Position> => {
    const res = await apiClient.get(`/positions/${id}`);
    return res.data;
  },
  create: async (data: Partial<Position>) => {
    const res = await apiClient.post('/positions', data);
    return res.data;
  },
  update: async (id: number, data: Partial<Position>) => {
    const res = await apiClient.put(`/positions/${id}`, data);
    return res.data;
  },
  delete: async (id: number) => {
    await apiClient.delete(`/positions/${id}`);
  },
};