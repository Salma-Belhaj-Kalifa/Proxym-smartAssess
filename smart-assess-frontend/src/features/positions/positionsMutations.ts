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
      toast.error('Erreur lors de la création du poste');
      console.error(error);
    },
  });
};

export const useUpdatePosition = (id: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => positionService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: positionKeys.all });
      queryClient.invalidateQueries({ queryKey: positionKeys.details(id) });
      toast.success('Poste mis à jour avec succès !');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la mise à jour du poste');
      console.error(error);
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
      toast.error('Erreur lors de la suppression du poste');
      console.error(error);
    },
  });
};