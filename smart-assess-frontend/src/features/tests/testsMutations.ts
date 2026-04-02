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
      const errorMessage = error?.response?.data?.message || error?.response?.data?.error || 'Erreur lors de la création du test';
      toast.error(errorMessage);
      console.error(error);
    },
  });
};

export const useCheckExistingTest = () => {
  return useMutation({
    mutationFn: testService.checkExistingTest,
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.response?.data?.error || 'Erreur lors de la vérification du test';
      toast.error(errorMessage);
      console.error(error);
    },
  });
};

export const useCheckExistingTestByCandidate = () => {
  return useMutation({
    mutationFn: testService.checkExistingTestByCandidate,
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.response?.data?.error || 'Erreur lors de la vérification du test';
      toast.error(errorMessage);
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
      const errorMessage = error?.response?.data?.message || error?.response?.data?.error || 'Erreur lors de la génération du test';
      toast.error(errorMessage);
      console.error(error);
    },
  });
};

export const useUpdateTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await testService.update(id, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: testKeys.all });
      queryClient.invalidateQueries({ queryKey: testKeys.details(variables.id) });
      toast.success('Test mis à jour avec succès !');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.response?.data?.error || 'Erreur lors de la mise à jour du test';
      toast.error(errorMessage);
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
      const errorMessage = error?.response?.data?.message || error?.response?.data?.error || 'Erreur lors de la suppression du test';
      toast.error(errorMessage);
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
      const errorMessage = error?.response?.data?.message || error?.response?.data?.error || 'Erreur lors de l\'envoi de l\'email';
      toast.error(errorMessage);
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
      const errorMessage = error?.response?.data?.message || error?.response?.data?.error || 'Erreur lors de la soumission du test';
      toast.error(errorMessage);
      console.error(error);
    },
  });
};

export const useStartTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (testId: number) => testService.startTest(testId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: testKeys.all });
      queryClient.invalidateQueries({ queryKey: testKeys.details(variables) });
      toast.success('Test démarré avec succès !');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.response?.data?.error || 'Erreur lors du démarrage du test';
      toast.error(errorMessage);
      console.error(error);
    },
  });
};

export const useStartTestByToken = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => testService.startTestByToken(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testKeys.all });
      toast.success('Test démarré avec succès !');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.response?.data?.error || 'Erreur lors du démarrage du test';
      toast.error(errorMessage);
      console.error(error);
    },
  });
};