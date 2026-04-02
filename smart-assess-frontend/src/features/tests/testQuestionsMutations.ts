import { useMutation, useQueryClient } from '@tanstack/react-query';
import { testQuestionsService, TestQuestion } from './testQuestionsService';
import { testQuestionKeys } from './testQuestionsQueries';
import { toast } from 'sonner';

// 🎯 Créer une nouvelle question
export const useCreateQuestion = (testId: number) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (question: Partial<TestQuestion>) => 
      testQuestionsService.createQuestion(testId, question),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: testQuestionKeys.byTest(testId) });
      toast.success('Question créée avec succès');
      return data;
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || error.message || 'Erreur inconnue';
      toast.error(`Erreur lors de la création: ${errorMessage}`);
    },
  });
};

// 🎯 Mettre à jour plusieurs questions
export const useUpdateQuestions = (testId: number) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (questions: TestQuestion[]) => 
      testQuestionsService.updateQuestions(testId, questions),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: testQuestionKeys.byTest(testId) });
      toast.success('Questions mises à jour avec succès');
      return data;
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || error.message || 'Erreur inconnue';
      toast.error(`Erreur lors de la mise à jour: ${errorMessage}`);
    },
  });
};

// 🎯 Mettre à jour une question spécifique
export const useUpdateQuestion = (testId: number) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ questionId, question }: { questionId: number; question: Partial<TestQuestion> }) => 
      testQuestionsService.updateQuestion(testId, questionId, question),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: testQuestionKeys.byTest(testId) });
      toast.success('Question mise à jour avec succès');
      return data;
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || error.message || 'Erreur inconnue';
      toast.error(`Erreur lors de la mise à jour: ${errorMessage}`);
    },
  });
};

// 🎯 Supprimer une question
export const useDeleteQuestion = (testId: number) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (questionId: number) => 
      testQuestionsService.deleteQuestion(testId, questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testQuestionKeys.byTest(testId) });
      toast.success('Question supprimée avec succès');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || error.message || 'Erreur inconnue';
      toast.error(`Erreur lors de la suppression: ${errorMessage}`);
    },
  });
};

// 🎯 Réorganiser les questions
export const useReorderQuestions = (testId: number) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (questions: TestQuestion[]) => 
      testQuestionsService.reorderQuestions(testId, questions),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: testQuestionKeys.byTest(testId) });
      toast.success('Questions réorganisées avec succès');
      return data;
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || error.message || 'Erreur inconnue';
      toast.error(`Erreur lors de la réorganisation: ${errorMessage}`);
    },
  });
};
