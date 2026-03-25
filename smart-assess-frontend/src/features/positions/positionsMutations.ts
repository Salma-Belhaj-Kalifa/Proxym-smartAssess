import { useMutation } from '@tanstack/react-query';
import { positionService } from './positionsService';
import { useQueryClient } from '@/hooks/useQueryClient';
import { positionKeys } from './positionsKeys';
import { toast } from 'sonner';

export const useCreatePosition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: positionService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: positionKeys.all });
      toast.success('Poste créé avec succès !');
    },
    onError: (error: any) => {
      console.error(error);
      const errorMessage = error?.response?.data?.message || error?.response?.data?.error || 'Erreur lors de la création du poste';
      toast.error(errorMessage);
    },
  });
};

export const useUpdatePosition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await positionService.update(id, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: positionKeys.all });
      queryClient.invalidateQueries({ queryKey: positionKeys.details(variables.id) });
      toast.success('Poste mis à jour avec succès !');
    },
    onError: (error: any) => {
      console.error(error);
      const errorMessage = error?.response?.data?.message || error?.response?.data?.error || 'Erreur lors de la mise à jour du poste';
      toast.error(errorMessage);
    },
  });
};

export const useDeletePosition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: positionService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: positionKeys.all });
      toast.success('Poste supprimé avec succès !');
    },
    onError: (error: any) => {
      console.error(error);
      const errorMessage = error?.response?.data?.message || error?.response?.data?.error || 'Erreur lors de la suppression du poste';
      toast.error(errorMessage);
    },
  });
};

export const useTogglePositionStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: positionService.toggleStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: positionKeys.all });
      toast.success('Statut du poste mis à jour avec succès !');
    },
    onError: (error: any) => {
      console.error(error);
      const errorMessage = error?.response?.data?.message || error?.response?.data?.error || 'Erreur lors de la mise à jour du statut du poste';
      toast.error(errorMessage);
    },
  });
};