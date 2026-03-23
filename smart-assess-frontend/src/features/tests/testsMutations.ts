import { useMutation, useQueryClient } from '@tanstack/react-query';
import { testsService } from './testsService';
import { testsKeys } from './testsKeys';
import { toast } from 'sonner';
import type { Test } from './types';

export const useCreateTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: testsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testsKeys.all });
      toast.success('Test créé avec succès');
    },
    onError: (error: any) => {
      console.error('Error creating test:', error);
      toast.error('Erreur lors de la création du test');
    }
  });
};

export const useUpdateTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Test> }) => {
      return await testsService.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testsKeys.all });
      toast.success('Test mis à jour avec succès');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la mise à jour du test');
    }
  });
};

export const useDeleteTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: testsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testsKeys.all });
      toast.success('Test supprimé avec succès');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la suppression du test');
    }
  });
};

export const useGenerateTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: testsService.generate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testsKeys.all });
      toast.success('Test généré avec succès');
    },
    onError: (error: any) => {
      console.error('Error generating test:', error);
      toast.error('Erreur lors de la génération du test');
    }
  });
};

export const useSubmitTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ testId, answers }: { testId: number; answers: any }) => {
      return await testsService.submit(testId, answers);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testsKeys.all });
      toast.success('Test soumis avec succès');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la soumission du test');
    }
  });
};
