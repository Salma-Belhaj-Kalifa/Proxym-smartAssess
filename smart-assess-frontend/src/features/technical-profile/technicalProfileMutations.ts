import { useMutation, useQueryClient } from '@tanstack/react-query';
import { technicalProfileService } from './technicalProfileService';
import { technicalProfileKeys } from './technicalProfileKeys';
import { toast } from 'sonner';

export const useCreateTechnicalProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: technicalProfileService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: technicalProfileKeys.all });
      toast.success('Profil technique créé');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la création du profil technique');
    }
  });
};

export const useUpdateTechnicalProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await technicalProfileService.update(id, data);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: technicalProfileKeys.all });
      queryClient.invalidateQueries({ queryKey: technicalProfileKeys.details(id) });
      toast.success('Profil technique mis à jour');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la mise à jour du profil technique');
    }
  });
};

export const useDeleteTechnicalProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: technicalProfileService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: technicalProfileKeys.all });
      toast.success('Profil technique supprimé');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la suppression du profil technique');
    }
  });
};
