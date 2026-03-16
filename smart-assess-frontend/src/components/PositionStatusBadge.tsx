import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { API_ENDPOINTS } from '@/config/apiEndpoints';
import { Badge } from '@/components/ui/badge';
import { render, fireEvent, waitFor } from '@testing-library/react';

interface PositionStatusBadgeProps {
  position: any;
}

export const PositionStatusBadge: React.FC<PositionStatusBadgeProps> = ({ position }) => {
  console.log('=== POSITION BADGE COMPONENT RENDER ===');
  console.log('Position ID:', position.id);
  
  const { data: positionData, isLoading, error } = useQuery({
    queryKey: ['position-status', position.id],
    queryFn: async () => {
      console.log('=== FETCHING POSITION STATUS ===');
      console.log('Position ID:', position.id);
      console.log('Endpoint:', API_ENDPOINTS.POSITIONS.BY_ID(position.id));
      
      try {
        const response = await apiClient.get(API_ENDPOINTS.POSITIONS.BY_ID(position.id));
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
    enabled: !!position.id,
    staleTime: 30 * 1000, // 30 secondes
  });
  
  console.log('=== POSITION BADGE STATE ===');
  console.log('IsLoading:', isLoading);
  console.log('Error:', error);
  console.log('Position data:', positionData);
  
  console.log('=== FINAL BADGE LOGIC ===');
  console.log('Position data object:', positionData);
  console.log('Position data keys:', Object.keys(positionData || {}));
  console.log('Position data.active:', positionData?.active);
  console.log('Position data["active"]:', positionData?.['active']);
  
  const realIsActive = positionData?.active;
  
  console.log('Real isActive from API:', realIsActive);
  
  // Utiliser le statut réel depuis l'API
  const isActive = realIsActive !== false;
  const status = position.status;
  
  console.log('Computed isActive:', isActive);
  console.log('Computed status:', status);
  
  if (status === 'ACTIVE' || status === 'OPEN') {
    return (
      <Badge className="bg-green-100 text-green-800 border-green-300">
        Actif
      </Badge>
    );
  } else if (status === 'INACTIVE' || status === 'CLOSED') {
    return (
      <Badge variant="secondary">
        Inactif
      </Badge>
    );
  }
  
  return isActive ? (
    <Badge className="bg-green-100 text-green-800 border-green-300">
      Actif
    </Badge>
  ) : (
    <Badge variant="secondary">
      Inactif
    </Badge>
  );
};
