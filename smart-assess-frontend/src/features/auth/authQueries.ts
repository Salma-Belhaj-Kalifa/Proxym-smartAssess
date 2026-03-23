import { useQuery } from '@tanstack/react-query';
import { authService } from './authService';
import { authKeys } from './authKeys';
import type { User } from './types';

export const useAuthQuery = () => {
  return useQuery({
    queryKey: authKeys.user,
    queryFn: authService.getCurrentUser,
    enabled: !!localStorage.getItem('token'),
  });
};

export const useProfile = (userId: number) => {
  return useQuery({
    queryKey: authKeys.profile(userId),
    queryFn: () => authService.getCurrentUser(),
    enabled: !!userId,
  });
};