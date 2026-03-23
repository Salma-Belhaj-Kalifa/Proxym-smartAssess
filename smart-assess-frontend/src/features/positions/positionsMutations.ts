import { useMutation, useQueryClient } from '@tanstack/react-query';
import { positionsService } from './positionsService';
import { positionsKeys } from './positionsKeys';
import { toast } from 'sonner';
import { Position } from './types';

export const useCreatePosition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: positionsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: positionsKeys.all });
      toast.success('Position créée');
    },
    onError: (error: any) => {
      console.error('Error creating position:', error);
      toast.error('Erreur lors de la création de la position');
    }
  });
};

export const useUpdatePosition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Position> }) => {
      return await positionsService.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: positionsKeys.all });
      toast.success('Position mise à jour');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la mise à jour de la position');
    }
  });
};

export const useDeletePosition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: positionsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: positionsKeys.all });
      toast.success('Position supprimée');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la suppression de la position');
    }
  });
};

export const useTogglePositionStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await positionsService.update(id, { isActive });
      return response;
    },
    onSuccess: (updatedPosition) => {
      queryClient.setQueryData([positionsKeys.all], (oldData: any) => {
        if (!oldData) return oldData;
        
        const updatedData = oldData.map((position: any) => 
          position.id === updatedPosition.id 
            ? { ...position, isActive: updatedPosition.isActive }
            : position
        );
        return updatedData;
      });
      
      queryClient.invalidateQueries({ queryKey: positionsKeys.all });
      toast.success('Statut de la position modifié avec succès');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la modification du statut');
    }
  });
};