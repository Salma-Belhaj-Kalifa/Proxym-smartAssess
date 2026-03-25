import { useMutation } from '@tanstack/react-query';
import { candidateService } from './candidatesService';
import { useQueryClient } from '@/hooks/useQueryClient';
import { candidateKeys } from './candidatesKeys';
import { authKeys } from '@/features/auth/authKeys';
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
      const errorMessage = error?.response?.data?.message || error?.response?.data?.error || 'Erreur lors de la création du candidat';
      toast.error(errorMessage);
      console.error(error);
    },
  });
};

export const useUpdateCandidate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await candidateService.update(id, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.all });
      queryClient.invalidateQueries({ queryKey: candidateKeys.details(variables.id) });
      toast.success('Candidat mis à jour avec succès !');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.response?.data?.error || 'Erreur lors de la mise à jour du candidat';
      toast.error(errorMessage);
      console.error(error);
    },
  });
};

export const useUpdateCandidateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await candidateService.updateProfile(id, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.all });
      queryClient.invalidateQueries({ queryKey: candidateKeys.details(variables.id) });
      queryClient.refetchQueries({ queryKey: authKeys.me }); // Force immediate refresh of current user data
      toast.success('Profil candidat mis à jour avec succès !');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.response?.data?.error || 'Erreur lors de la mise à jour du profil candidat';
      toast.error(errorMessage);
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
      const errorMessage = error?.response?.data?.message || error?.response?.data?.error || 'Erreur lors de la suppression du candidat';
      toast.error(errorMessage);
      console.error(error);
    },
  });
};

export const useUploadCV = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ candidateId, file }: { candidateId: number; file: File }) => {
      return await candidateService.uploadCV(candidateId, file);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.all });
      queryClient.invalidateQueries({ queryKey: candidateKeys.details(variables.candidateId) });
      toast.success('CV téléchargé avec succès !');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || error?.response?.data?.message || 'Erreur lors du téléchargement du CV';
      toast.error(errorMessage);
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
      const errorMessage = error?.response?.data?.message || error?.response?.data?.error || 'Erreur lors de la suppression du profil';
      toast.error(errorMessage);
      console.error(error);
    },
  });
};