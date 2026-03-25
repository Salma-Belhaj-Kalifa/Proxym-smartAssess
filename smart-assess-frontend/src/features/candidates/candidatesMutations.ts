import { useMutation } from '@tanstack/react-query';
import { candidateService } from './candidatesService';
import { useQueryClient } from '@/hooks/useQueryClient';
import { candidateKeys } from './candidatesKeys';
import { toast } from 'sonner';
import { removeAuthToken, removeAuthUserData } from '@/lib/api';

export const useCreateCandidate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: candidateService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.all });
      toast.success('Candidat créé avec succès !');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la création du candidat');
      console.error(error);
    },
  });
};

export const useUpdateCandidate = (id: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => candidateService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.all });
      queryClient.invalidateQueries({ queryKey: candidateKeys.details(id) });
      toast.success('Candidat mis à jour avec succès !');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la mise à jour du candidat');
      console.error(error);
    },
  });
};

export const useDeleteCandidate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: candidateService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.all });
      toast.success('Candidat supprimé avec succès !');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la suppression du candidat');
      console.error(error);
    },
  });
};

export const useDeleteMyProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: candidateService.deleteMyProfile,
    onSuccess: () => {
      queryClient.clear();
      toast.success('Profil supprimé avec succès !');
      // Nettoyage et redirection
      removeAuthToken();
      removeAuthUserData();
      window.location.href = '/';
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la suppression du profil');
      console.error(error);
    },
  });
};