import { useMutation, useQueryClient } from '@tanstack/react-query';
import { candidaturesService } from './candidaturesService';
import { candidaturesKeys } from './candidaturesKeys';
import { toast } from 'sonner';
import type { Candidature } from './types';

export const useCreateCandidature = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: candidaturesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: candidaturesKeys.all });
      toast.success('Candidature créée avec succès');
    },
    onError: (error: any) => {
      console.error('Error creating candidature:', error);
      toast.error('Erreur lors de la création de la candidature');
    }
  });
};

export const useUpdateCandidature = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Candidature> }) => {
      return await candidaturesService.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: candidaturesKeys.all });
      toast.success('Candidature mise à jour avec succès');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la mise à jour de la candidature');
    }
  });
};

export const useDeleteCandidature = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: candidaturesService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: candidaturesKeys.all });
      toast.success('Candidature supprimée avec succès');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la suppression de la candidature');
    }
  });
};

export const useUpdateCandidatureStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return await candidaturesService.updateStatus(id, status);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [candidaturesKeys.all] });
      queryClient.invalidateQueries({ queryKey: [candidaturesKeys.byPosition(variables.id)] });
      queryClient.invalidateQueries({ queryKey: [candidaturesKeys.byCandidate(variables.id)] });
      toast.success('Statut de la candidature mis à jour');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la mise à jour du statut');
    }
  });
};
