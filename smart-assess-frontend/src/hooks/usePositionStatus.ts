import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { API_ENDPOINTS } from '@/config/apiEndpoints';
import { queryOptions } from '@/lib/queryClient';

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
    ...queryOptions.fresh, 
    enabled: !!positionId,
  });
};
