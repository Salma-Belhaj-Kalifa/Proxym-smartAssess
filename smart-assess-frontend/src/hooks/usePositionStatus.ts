import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { API_ENDPOINTS } from '@/config/apiEndpoints';

export const usePositionStatus = (positionId: number) => {
  return useQuery({
    queryKey: ['position-status', positionId],
    queryFn: async () => {
      console.log('=== FETCHING POSITION STATUS ===');
      console.log('Position ID:', positionId);
      console.log('Endpoint:', API_ENDPOINTS.POSITIONS.BY_ID(positionId));
      
      try {
        const response = await apiClient.get(API_ENDPOINTS.POSITIONS.BY_ID(positionId));
        console.log('API Response status:', response.status);
        console.log('API Response data:', response.data);
        console.log('Response headers:', response.headers);
        return response.data;
      } catch (error) {
        console.error('API Error:', error);
        console.error('Error response:', error.response);
        console.error('Error status:', error.response?.status);
        console.error('Error data:', error.response?.data);
        throw error;
      }
    },
    enabled: !!positionId,
    staleTime: 30 * 1000, // 30 secondes
  });
};
