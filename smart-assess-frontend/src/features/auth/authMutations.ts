import { useQuery, useMutation, useQueryClient as useTanStackQueryClient } from '@tanstack/react-query';
import { authService } from './authService';
import { authKeys } from './authKeys';
import { toast } from 'sonner';
import { User } from './types';
import { setCookie, deleteCookie, getJsonCookie, setJsonCookie, clearAuthCookies } from '@/utils/cookies';
import { useQueryClient } from '@/hooks/useQueryClient';

export const useAuth = () => {
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      setCookie('auth_token', data.token);
      setJsonCookie('user_data', data);
      queryClient.invalidateQueries();
      toast.success('Connexion réussie');
    },
    onError: (error: any) => {
      console.error('Login error:', error);
      
      // Nettoyer tous les cookies en cas d'échec
      clearAuthCookies();
      queryClient.clear();
      
      // Message d'erreur spécifique selon le type d'erreur
      const errorMessage = error?.response?.data?.error || 
                          error?.message || 
                          'Erreur lors de la connexion';
      toast.error(errorMessage);
    }
  });

  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: (data) => {
      setCookie('auth_token', data.token);
      setJsonCookie('user_data', data);
      queryClient.invalidateQueries();
      toast.success('Inscription réussie');
    },
    onError: (error: any) => {
      console.error('Register error:', error);
      
      // Nettoyer tous les cookies en cas d'échec
      clearAuthCookies();
      queryClient.clear();
      
      // Message d'erreur spécifique selon le type d'erreur
      const errorMessage = error?.response?.data?.error || 
                          error?.message || 
                          'Erreur lors de l\'inscription';
      toast.error(errorMessage);
    }
  });

  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      // Nettoyage complet des cookies côté frontend
      clearAuthCookies();
      
      // Nettoyer le cache React Query
      queryClient.clear();
      
      // Afficher un message de succès
      toast.success('Déconnexion réussie');
      
      // Redirection vers la page d'accueil
      window.location.href = '/';
    },
    onError: (error: any) => {
      console.error('Logout error:', error);
      
      // Même en cas d'erreur, nettoyer les cookies locaux
      clearAuthCookies();
      queryClient.clear();
      
      // Afficher un message d'erreur mais quand même rediriger
      toast.error('Erreur lors de la déconnexion, mais vous avez été déconnecté');
      
      // Forcer la redirection même en cas d'erreur
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    },
  });

  return {
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoading: loginMutation.isPending || registerMutation.isPending,
    error: loginMutation.error || registerMutation.error,
    user: getJsonCookie<User>('user_data'),
  };
};

export const useProfile = (userId: number) => {
  return useQuery({
    queryKey: authKeys.profile(userId),
    queryFn: () => authService.getCurrentUser(),
    enabled: !!userId,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, ...profileData }: { userId: number } & Partial<User>) => {
      return await authService.updateProfile(userId, profileData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.user });
      toast.success('Profil mis à jour avec succès');
    },
    onError: (error: any) => {
      console.error('Error updating profile:', error);
      toast.error('Erreur lors de la mise à jour du profil');
    }
  });
};