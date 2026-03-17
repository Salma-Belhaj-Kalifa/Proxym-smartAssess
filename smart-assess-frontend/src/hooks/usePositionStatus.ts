import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { API_ENDPOINTS } from '@/config/apiEndpoints';

export const usePositionStatus = (positionId: number) => {
  return useQuery({
    queryKey: ['position-status', positionId],
    queryFn: async () => {
      try {
        const response = await apiClient.get(API_ENDPOINTS.POSITIONS.BY_ID(positionId));
        return response.data;
      } catch (error) {
        throw error;
      }
    },
    enabled: !!positionId,
    staleTime: 30 * 1000, // 30 secondes
  });
};
