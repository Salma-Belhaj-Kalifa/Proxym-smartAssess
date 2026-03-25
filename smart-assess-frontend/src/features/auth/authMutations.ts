import { useMutation } from '@tanstack/react-query';
import { authService } from './authService';
import { useQueryClient } from '@/hooks/useQueryClient';
import {
  setAuthToken,
  setAuthUserData,
  removeAuthToken,
  removeAuthUserData,
} from '@/lib/api';

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      setAuthToken(data.token);
      setAuthUserData(data);
      queryClient.invalidateQueries();
    },
    onError: () => {
      removeAuthToken();
      removeAuthUserData();
      queryClient.clear();
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.register,
    onSuccess: (data) => {
      setAuthToken(data.token);
      setAuthUserData(data);
      queryClient.invalidateQueries();
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      queryClient.clear();
      window.location.href = '/';
    },
  });
};