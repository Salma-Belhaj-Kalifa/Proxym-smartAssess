import { useMutation } from '@tanstack/react-query';
import { technicalProfileService } from './technicalProfileService';
import { useQueryClient } from '@/hooks/useQueryClient';
import { technicalProfileKeys } from './technicalProfileKeys';
import { toast } from 'sonner';
import { TechnicalProfile } from './types';

export const useCreateTechnicalProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: technicalProfileService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: technicalProfileKeys.all });
      toast.success('Profil technique créé avec succès !');
    },
    onError: (error: any) => {
      console.error('Erreur lors de la création du profil technique:', error);
      toast.error('Erreur lors de la création du profil technique');
    },
  });
};

export const useUpdateTechnicalProfile = (id: number) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<TechnicalProfile>) => {
      return await technicalProfileService.update(id, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: technicalProfileKeys.all });
      queryClient.invalidateQueries({ queryKey: technicalProfileKeys.details(id) });
      queryClient.invalidateQueries({ queryKey: technicalProfileKeys.byCandidate(id) });
      toast.success('Profil technique mis à jour avec succès !');
    },
    onError: (error: any) => {
      console.error('Erreur lors de la mise à jour du profil technique:', error);
      toast.error('Erreur lors de la mise à jour du profil technique');
    },
  });
};

export const useDeleteTechnicalProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: technicalProfileService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: technicalProfileKeys.all });
      toast.success('Profil technique supprimé avec succès !');
    },
    onError: (error: any) => {
      console.error('Erreur lors de la suppression du profil technique:', error);
      toast.error('Erreur lors de la suppression du profil technique');
    },
  });
};