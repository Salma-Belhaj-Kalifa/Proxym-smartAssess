import { useMutation } from '@tanstack/react-query';
import { managersService } from './managersService';
import { useQueryClient } from '@/hooks/useQueryClient';
import { managersKeys } from './managersKeys';
import { toast } from 'sonner';
import { Manager } from './types';

export const useCreateManager = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: managersService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: managersKeys.all });
      toast.success('Manager créé avec succès !');
    },
    onError: (error: any) => {
      console.error('Erreur lors de la création du manager:', error);
      toast.error('Erreur lors de la création du manager');
    },
  });
};

export const useUpdateManager = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Manager> }) => {
      return await managersService.update(id, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: managersKeys.all });
      queryClient.invalidateQueries({ queryKey: managersKeys.details(variables.id) });
      toast.success('Manager mis à jour avec succès !');
    },
    onError: (error: any) => {
      console.error('Erreur lors de la mise à jour du manager:', error);
      toast.error('Erreur lors de la mise à jour du manager');
    },
  });
};

export const useDeleteManager = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: managersService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: managersKeys.all });
      toast.success('Manager supprimé avec succès !');
    },
    onError: (error: any) => {
      console.error('Erreur lors de la suppression du manager:', error);
      toast.error('Erreur lors de la suppression du manager');
    },
  });
};

export const useUpdateManagerProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, profileData }: { userId: number; profileData: Partial<Manager> }) => {
      return await managersService.updateProfile(userId, profileData);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: managersKeys.profile(variables.userId) });
      toast.success('Profil manager mis à jour avec succès !');
    },
    onError: (error: any) => {
      console.error('Erreur lors de la mise à jour du profil manager:', error);
      toast.error('Erreur lors de la mise à jour du profil manager');
    },
  });
};

export const useDeleteManagerProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: managersService.deleteMyProfile,
    onSuccess: () => {
      queryClient.clear();
      toast.success('Profil supprimé avec succès !');
    },
    onError: (error: any) => {
      console.error('Erreur lors de la suppression du profil:', error);
      toast.error('Erreur lors de la suppression du profil');
    },
  });
};