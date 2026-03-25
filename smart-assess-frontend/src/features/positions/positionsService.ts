import apiClient from '@/lib/api';
import API_ENDPOINTS from '@/config/apiEndpoints';
import { Position } from './types';

export const positionService = {
 getAll: async (): Promise<Position[]> => {
    const response = await apiClient.get(API_ENDPOINTS.POSITIONS.GET_ALL);
    return response.data;
  },
  
  getById: async (id: number): Promise<Position> => {
    const response = await apiClient.get(`/positions/${id}`);
    return response.data;
  },
  
  update: async (id: number, data: Partial<Position>): Promise<Position> => {
    const response = await apiClient.put(`/positions/${id}`, data);
    return response.data;
  },
  
  
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.POSITIONS.DELETE(id));
  },
  
  getPublic: async (): Promise<Position[]> => {
    const response = await apiClient.get(API_ENDPOINTS.POSITIONS.GET_PUBLIC);
    return response.data;
  },
  
  create: async (positionData: Omit<Position, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>): Promise<Position> => {
    
    try {
      const response = await apiClient.post(API_ENDPOINTS.POSITIONS.CREATE, positionData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};