import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { testQuestionsService, TestQuestion } from './testQuestionsService';

export const testQuestionKeys = {
  all: ['testQuestions'] as const,
  byTest: (testId: number) => ['testQuestions', testId] as const,
  byId: (testId: number, questionId: number) => ['testQuestions', testId, questionId] as const,
};

// 🎯 Récupérer toutes les questions d'un test
export const useTestQuestions = (testId: number) => {
  return useQuery({
    queryKey: testQuestionKeys.byTest(testId),
    queryFn: () => testQuestionsService.getQuestionsByTestId(testId),
    enabled: !!testId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// 🎯 Récupérer une question spécifique
export const useTestQuestion = (testId: number, questionId: number) => {
  return useQuery({
    queryKey: testQuestionKeys.byId(testId, questionId),
    queryFn: () => testQuestionsService.getQuestionById(testId, questionId),
    enabled: !!testId && !!questionId,
    staleTime: 5 * 60 * 1000,
  });
};
