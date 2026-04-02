import apiClient from '@/lib/api';

export interface TestQuestion {
  id?: number;
  questionText: string;
  questionType: string;
  options: string[];
  correctAnswer: string; // Backend: texte ("A)", "B)", etc.)
  skillTag: string;
  maxScore: number;
  orderIndex: number;
}

// Interface pour le frontend avec index
export interface Question {
  id?: number;
  questionText: string;
  questionType: string;
  options: string[];
  correctAnswer: number; // Frontend: index (0, 1, 2, 3...)
  skillTag: string;
  maxScore: number;
  orderIndex: number;
}

export const testQuestionsService = {
  // 🎯 Récupérer toutes les questions d'un test (utiliser l'ancien endpoint)
  getQuestionsByTestId: async (testId: number): Promise<TestQuestion[]> => {
    const response = await apiClient.get(`/tests/${testId}/questions`);
    return response.data.questions || [];
  },

  // 🎯 Récupérer une question spécifique
  getQuestionById: async (testId: number, questionId: number): Promise<TestQuestion> => {
    const response = await apiClient.get(`/tests/${testId}/questions-management/${questionId}`);
    return response.data.question;
  },

  // 🎯 Créer une nouvelle question
  createQuestion: async (testId: number, question: Partial<TestQuestion>): Promise<TestQuestion> => {
    const response = await apiClient.post(`/tests/${testId}/questions-management`, question);
    return response.data.question;
  },

  // 🎯 Mettre à jour plusieurs questions (utiliser l'ancien endpoint)
  updateQuestions: async (testId: number, questions: TestQuestion[]): Promise<TestQuestion[]> => {
    const response = await apiClient.put(`/tests/${testId}/questions`, {
      questions: questions
    });
    return response.data.questions || [];
  },

  // 🎯 Mettre à jour une question spécifique
  updateQuestion: async (testId: number, questionId: number, question: Partial<TestQuestion>): Promise<TestQuestion> => {
    const response = await apiClient.put(`/tests/${testId}/questions-management/${questionId}`, question);
    return response.data.question;
  },

  // 🎯 Supprimer une question
  deleteQuestion: async (testId: number, questionId: number): Promise<void> => {
    await apiClient.delete(`/tests/${testId}/questions-management/${questionId}`);
  },

  // 🎯 Réorganiser les questions
  reorderQuestions: async (testId: number, questions: TestQuestion[]): Promise<TestQuestion[]> => {
    const response = await apiClient.post(`/tests/${testId}/questions-management/reorder`, {
      questions: questions
    });
    return response.data.questions || [];
  }
};
