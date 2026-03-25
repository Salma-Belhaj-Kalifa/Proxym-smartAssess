import { useMutation } from '@tanstack/react-query';
import { testService } from './testsService';
import { useQueryClient } from '@/hooks/useQueryClient';
import { testKeys } from './testsKeys';
import { toast } from 'sonner';

export const useCreateTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: testService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testKeys.all });
      toast.success('Test créé avec succès !');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la création du test');
      console.error(error);
    },
  });
};

export const useUpdateTest = (id: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => testService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testKeys.all });
      queryClient.invalidateQueries({ queryKey: testKeys.details(id) });
      toast.success('Test mis à jour avec succès !');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la mise à jour du test');
      console.error(error);
    },
  });
};

export const useDeleteTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: testService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testKeys.all });
      toast.success('Test supprimé avec succès !');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la suppression du test');
      console.error(error);
    },
  });
};

export const useSendTestEmail = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, emailData }: { id: number; emailData: any }) => {
      return await testService.sendEmail(id, emailData);
    },
    onSuccess: () => {
      toast.success('Email envoyé avec succès !');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de l\'envoi de l\'email');
      console.error(error);
    },
  });
};

export const useGenerateTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: testService.generateTest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testKeys.all });
      toast.success('Test généré avec succès !');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la génération du test');
      console.error(error);
    },
  });
};

export const useSubmitTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ testId, answers }: { testId: number; answers: any }) => {
      return await testService.submitTest(testId, answers);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: testKeys.all });
      queryClient.invalidateQueries({ queryKey: testKeys.results(variables.testId.toString()) });
      toast.success('Test soumis avec succès !');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la soumission du test');
      console.error(error);
    },
  });
};

export const useStartTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => testService.startTest(token),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: testKeys.public(variables || '') });
      toast.success('Test démarré avec succès !');
    },
    onError: (error: any) => {
      toast.error('Erreur lors du démarrage du test');
      console.error(error);
    },
  });
};