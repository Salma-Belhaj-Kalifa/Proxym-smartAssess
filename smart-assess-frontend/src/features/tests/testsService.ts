import apiClient from '@/lib/api';
import API_ENDPOINTS from '@/config/apiEndpoints';
import { Test, TestReviewData } from './types';

export const testService = {
  getAll: async (): Promise<Test[]> => {
    const response = await apiClient.get(API_ENDPOINTS.TESTS.GET_ALL);
    return response.data;
  },

  getById: async (id: number): Promise<Test> => {
    const response = await apiClient.get(API_ENDPOINTS.TESTS.GET_BY_ID(id));
    return response.data;
  },

  create: async (data: Partial<Test>): Promise<Test> => {
    const response = await apiClient.post(API_ENDPOINTS.TESTS.CREATE, data);
    return response.data;
  },

  update: async (id: number, data: Partial<Test>): Promise<Test> => {
    const response = await apiClient.put(API_ENDPOINTS.TESTS.UPDATE(id), data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.TESTS.DELETE(id));
  },

  sendEmail: async (id: number, emailData: any): Promise<any> => {
    const response = await apiClient.post(API_ENDPOINTS.TESTS.SEND_EMAIL(id), emailData);
    return response.data;
  },

  checkExistingTest: async (candidateId: number): Promise<{ status: string; exists: boolean; testId?: number; message: string }> => {
    const response = await apiClient.get(`/tests/check-existing/${candidateId}`);
    return response.data;
  },

  generateTest: async (data: {
    candidatureId: number;
    level: string;
    questionCount: number;
    duration?: number;
    deadline?: string;
    note?: string;
    focusAreas?: string[]; // Compétences du candidat pour générer des questions ciblées
    customInstructions?: string; // Instructions supplémentaires pour l'IA
  }): Promise<any> => {
    const response = await apiClient.post('/tests/generate', data);
    return response.data;
  },

  getTestForReview: async (id: number): Promise<TestReviewData> => {
    const response = await apiClient.get(`/tests/${id}/review`);
    return response.data;
  },

  submitTest: async (testId: number, answers: any): Promise<any> => {
    const response = await apiClient.post(API_ENDPOINTS.TESTS.SUBMIT(testId), answers);
    return response.data;
  },

  startTest: async (testId: number): Promise<any> => {
    const response = await apiClient.post(`/tests/${testId}/start`);
    return response.data;
  },

  getTestResults: async (testId: number): Promise<any> => {
    const response = await apiClient.get(`/tests/${testId}/results`);
    return response.data;
  },

  getPublicTest: async (token: string): Promise<any> => {
    const response = await apiClient.get(`/tests/public/${token}`);
    return response.data;
  },

  getTestResultsByToken: async (token: string): Promise<any> => {
    const response = await apiClient.get(`/tests/results/${token}`);
    return response.data;
  }
};