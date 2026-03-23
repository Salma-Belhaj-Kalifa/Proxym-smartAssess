import { useMutation, useQueryClient as useTanStackQueryClient } from '@tanstack/react-query';
import { candidatesService } from './candidatesService';
import { candidatesKeys } from './candidatesKeys';
import { toast } from 'sonner';
import { Candidate } from './types';
import { useQueryClient } from '@/hooks/useQueryClient';

export const useCreateCandidate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: candidatesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: candidatesKeys.all });
      toast.success('Candidat créé avec succès');
    },
    onError: (error: any) => {
      console.error('Error creating candidate:', error);
      toast.error('Erreur lors de la création du candidat');
    }
  });
};

export const useUpdateCandidate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Candidate> }) => {
      return await candidatesService.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: candidatesKeys.all });
      toast.success('Candidat mis à jour avec succès');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la mise à jour du candidat');
    }
  });
};

export const useDeleteCandidate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: candidatesService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: candidatesKeys.all });
      toast.success('Candidat supprimé avec succès');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la suppression du candidat');
    }
  });
};

export const useUpdateCandidateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, profileData }: { id: number; profileData: any }) => {
      return await candidatesService.updateProfile(id, profileData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: candidatesKeys.all });
      toast.success('Profil mis à jour avec succès');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la mise à jour du profil');
    }
  });
};

export const useUploadCV = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, file }: { id: number; file: File }) => {
      return await candidatesService.uploadCV(id, file);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: candidatesKeys.all });
      toast.success('CV téléchargé avec succès');
    },
    onError: (error: any) => {
      toast.error('Erreur lors du téléchargement du CV');
    }
  });
};
