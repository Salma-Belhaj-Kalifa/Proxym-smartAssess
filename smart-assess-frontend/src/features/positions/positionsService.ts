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
  },

  toggleStatus: async (id: number, isActive?: boolean): Promise<Position> => {
    // Si isActive n'est pas fourni, c'est un toggle simple (ancienne méthode)
    if (isActive === undefined) {
      // Récupérer d'abord la position actuelle pour déterminer le nouveau statut
      const currentPosition = await apiClient.get(`/positions/${id}`);
      const newIsActive = !currentPosition.data.isActive;
      
      const response = await apiClient.patch(`/positions/${id}/toggle-status`, { 
        isActive: newIsActive 
      });
      return response.data;
    } else {
      // Nouvelle méthode avec le statut fourni
      const response = await apiClient.patch(`/positions/${id}/toggle-status`, { 
        isActive 
      });
      return response.data;
    }
  }
};