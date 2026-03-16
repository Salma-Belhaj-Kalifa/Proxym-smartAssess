import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { API_ENDPOINTS } from '@/config/apiEndpoints';
import { toast } from 'sonner';
import { authService } from '@/services/apiService';

// ================= TYPES =================

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
  department?: string;
}

export interface Position {
  id: number;
  title: string;
  description: string;
  requiredSkills: string[];
  acceptedDomains: string[];
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface Candidate {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  cvUrl?: string;
  status: string;
  createdAt: string;
}

// ================= AUTHENTICATION =================

export const useAuth = () => {
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      queryClient.invalidateQueries();
    },
    onError: (error) => {
      console.error('Login error:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  });

  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: (data) => {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      queryClient.invalidateQueries();
    },
    onError: (error) => {
      console.error('Register error:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  });

  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      queryClient.invalidateQueries();
      window.location.href = '/';
    },
    onError: (error) => console.error('Logout error:', error),
  });

  return {
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoading: loginMutation.isPending || registerMutation.isPending,
    error: loginMutation.error || registerMutation.error,
    user: (() => {
      try {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
      } catch {
        return null;
      }
    })(),
  };
};

// ================= POSITIONS =================

export const usePositions = () => {
  return useQuery({
    queryKey: ['positions'],
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.POSITIONS.GET_ALL);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useCreatePosition = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (positionData: Omit<Position, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>) => {
      const response = await apiClient.post(API_ENDPOINTS.POSITIONS.CREATE, positionData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      toast.success('Position créée avec succès');
    },
    onError: (error: any) => {
      console.error('Error creating position:', error);
      toast.error('Erreur lors de la création de la position');
    }
  });
};

export const useUpdatePosition = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      console.log('=== UPDATE POSITION ===');
      console.log('ID:', id);
      console.log('PositionData:', data);
      console.log('Endpoint:', API_ENDPOINTS.POSITIONS.UPDATE(id));
      
      const response = await apiClient.put(API_ENDPOINTS.POSITIONS.UPDATE(id), data);
      console.log('Update Response:', response);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      queryClient.refetchQueries({ queryKey: ['positions'] });
      toast.success('Position mise à jour avec succès');
    },
    onError: (error: any) => {
      console.error('Error updating position:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      toast.error('Erreur lors de la mise à jour de la position');
    }
  });
};

export const useDeletePosition = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/positions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
    },
  });
};

export const useTogglePositionStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      console.log('=== TOGGLE POSITION STATUS ===');
      console.log('ID:', id);
      console.log('New isActive:', isActive);
      console.log('Endpoint:', API_ENDPOINTS.POSITIONS.TOGGLE_STATUS(id));
      
      const response = await apiClient.patch(API_ENDPOINTS.POSITIONS.TOGGLE_STATUS(id), { isActive });
      console.log('Toggle Response:', response);
      return response.data;
    },
    onSuccess: (updatedPosition) => {
      console.log('=== TOGGLE SUCCESS ===');
      console.log('Updated position from API:', updatedPosition);
      
      // Mettre à jour le cache immédiatement avec les nouvelles données
      queryClient.setQueryData(['positions'], (oldData: any) => {
        if (!oldData) return oldData;
        
        console.log('=== UPDATING CACHE ===');
        console.log('Old data:', oldData);
        
        const updatedData = oldData.map((position: any) => 
          position.id === updatedPosition.id 
            ? { ...position, isActive: updatedPosition.isActive }
            : position
        );
        
        console.log('New data:', updatedData);
        return updatedData;
      });
      
      // Forcer le rafraîchissement complet et immédiat
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      queryClient.refetchQueries({ queryKey: ['positions'] });
      
      // Forcer un re-render du composant
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['positions'] });
        queryClient.refetchQueries({ queryKey: ['positions'] });
      }, 50);
      
      toast.success('Statut de la position modifié avec succès');
    },
    onError: (error: any) => {
      console.error('Error toggling position status:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      toast.error('Erreur lors de la modification du statut');
    }
  });
};

// ================= CANDIDATES =================

export const useCandidates = () => {
  return useQuery({
    queryKey: ['candidates'],
    queryFn: async () => {
      const response = await apiClient.get('/candidates');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useCandidateProfile = (userId: number) => {
  return useQuery({
    queryKey: ['candidate-profile', userId],
    queryFn: async () => {
      const response = await apiClient.get(`/users/${userId}/profile`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!userId,
  });
};

export const useProfile = (userId: number) => {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const response = await apiClient.get(`/users/${userId}/profile`);
      return response.data;
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, ...profileData }: { userId: number } & Partial<User>) => {
      const response = await apiClient.put(`/users/${userId}/profile`, profileData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

// ================= TESTS =================

export const useTests = () => {
  return useQuery({
    queryKey: ['tests'],
    queryFn: async () => {
      const response = await apiClient.get('/tests');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useCreateTest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (testData: any) => {
      const response = await apiClient.post('/tests', testData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tests'] });
    },
  });
};

export const useGenerateTest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (testData: any) => {
      const response = await apiClient.post('/tests/generate', testData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tests'] });
    },
  });
};

// ================= CANDIDATURES =================

export const useCandidatures = () => {
  return useQuery({
    queryKey: ['candidatures'],
    queryFn: async () => {
      const response = await apiClient.get('/candidatures');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useCandidaturesByPosition = (positionId: number) => {
  return useQuery({
    queryKey: ['candidatures', 'position', positionId],
    queryFn: async () => {
      console.log('=== useCandidaturesByPosition ===');
      console.log('PositionId:', positionId);
      console.log('API_ENDPOINTS:', API_ENDPOINTS);
      console.log('Endpoint URL:', API_ENDPOINTS.CANDIDATURES.BY_POSITION(positionId));
      
      const response = await apiClient.get(API_ENDPOINTS.CANDIDATURES.BY_POSITION(positionId));
      console.log('API Response:', response);
      console.log('API Response data:', response.data);
      return response.data;
    },
    enabled: !!positionId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useCandidaturesByCandidate = (candidateId: number) => {
  console.log('=== useCandidaturesByCandidate ===');
  console.log('CandidateId:', candidateId);
  console.log('API_ENDPOINTS:', API_ENDPOINTS);
  console.log('Endpoint URL:', API_ENDPOINTS.CANDIDATURES.BY_CANDIDATE(candidateId));
  
  return useQuery({
    queryKey: ['candidatures', 'candidate', candidateId],
    queryFn: async () => {
      console.log('Making API call to:', API_ENDPOINTS.CANDIDATURES.BY_CANDIDATE(candidateId));
      const response = await apiClient.get(API_ENDPOINTS.CANDIDATURES.BY_CANDIDATE(candidateId));
      console.log('API Response:', response);
      console.log('API Response data:', response.data);
      return response.data;
    },
    enabled: !!candidateId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useCreateCandidature = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (candidatureData: any) => {
      const response = await apiClient.post('/candidatures', candidatureData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidatures'] });
      console.log('Candidature créée avec succès!');
    },
    onError: (error: any) => {
      console.error('Erreur lors de la création de la candidature');
      console.error('Create candidature error:', error);
    },
  });
};

// ================= CV UPLOAD =================

export const useCVUpload = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ candidateId, file }: { candidateId: number; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiClient.post(`/ai-analysis/analyze-cv/${candidateId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidate-profile'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

// ================= TECHNICAL PROFILES =================

export const useTechnicalProfiles = (candidateId?: number) => {
  return useQuery({
    queryKey: ['technical-profiles', candidateId],
    queryFn: async () => {
      const url = candidateId 
        ? `/technical-profiles/candidate/${candidateId}`
        : '/technical-profiles';
      const response = await apiClient.get(url);
      return response.data;
    },
    enabled: !!candidateId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useCreateTechnicalProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (profileData: any) => {
      const response = await apiClient.post('/technical-profiles', profileData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technical-profiles'] });
    },
  });
};
