import { useMutation } from '@tanstack/react-query';
import { candidaturesService } from './candidaturesService';
import { useQueryClient } from '@/hooks/useQueryClient';
import { candidaturesKeys } from './candidaturesKeys';
import { toast } from 'sonner';

export const useCreateCandidature = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: candidaturesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: candidaturesKeys.all });
      toast.success('Candidature créée avec succès !');
    },
    onError: (error: any) => {
      console.error('Erreur lors de la création de la candidature:', error);
      const errorMessage = error?.response?.data?.message || error?.response?.data?.error || 'Erreur lors de la création de la candidature';
      toast.error(errorMessage);
    },
  });
};

export const useUpdateCandidature = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await candidaturesService.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: candidaturesKeys.all });
      toast.success('Candidature mise à jour avec succès !');
    },
    onError: (error: any) => {
      console.error('Erreur lors de la mise à jour de la candidature:', error);
      toast.error('Erreur lors de la mise à jour de la candidature');
    },
  });
};

export const useUpdateCandidatureStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return await candidaturesService.updateStatus(id, status);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: candidaturesKeys.all });
      queryClient.invalidateQueries({ queryKey: candidaturesKeys.byPosition(variables.id) });
      queryClient.invalidateQueries({ queryKey: candidaturesKeys.byCandidate(variables.id) });
      toast.success('Statut de la candidature mis à jour avec succès !');
    },
    onError: (error: any) => {
      console.error('Erreur lors de la mise à jour du statut:', error);
      toast.error('Erreur lors de la mise à jour du statut de la candidature');
    },
  });
};