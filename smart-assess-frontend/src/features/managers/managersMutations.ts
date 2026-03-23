import { useMutation, useQueryClient } from '@tanstack/react-query';
import { managersService } from './managersService';
import { managersKeys } from './managersKeys';
import { toast } from 'sonner';
import { Manager } from './types';

export const useUpdateManager = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Manager> }) => {
      return await managersService.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: managersKeys.all });
      toast.success('Manager mis à jour avec succès');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la mise à jour du manager');
    }
  });
};

export const useDeleteManager = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: managersService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: managersKeys.all });
      toast.success('Manager supprimé avec succès');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la suppression du manager');
    }
  });
};
