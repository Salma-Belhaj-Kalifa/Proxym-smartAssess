import apiClient from '@/lib/api';
import { Test, TestResult } from './types';

export const testsService = {
  getAll: async (): Promise<Test[]> => {
    const res = await apiClient.get('/tests');
    return res.data;
  },

  getById: async (id: number): Promise<Test> => {
    const res = await apiClient.get(`/tests/${id}`);
    return res.data;
  },

  create: async (data: Partial<Test>): Promise<Test> => {
    const res = await apiClient.post('/tests', data);
    return res.data;
  },

  update: async (id: number, data: Partial<Test>): Promise<Test> => {
    const res = await apiClient.put(`/tests/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/tests/${id}`);
  },

  getResults: async (testId: number): Promise<TestResult[]> => {
    const res = await apiClient.get(`/tests/${testId}/results`);
    return res.data;
  },

  getForReview: async (testId: number): Promise<Test> => {
    const res = await apiClient.get(`/tests/${testId}/review`);
    return res.data;
  },

  submit: async (testId: number, answers: any): Promise<TestResult> => {
    const res = await apiClient.post(`/tests/${testId}/submit`, { answers });
    return res.data;
  },

  generate: async (data: any): Promise<Test> => {
    const res = await apiClient.post('/tests/generate', data);
    return res.data;
  },

  checkExisting: async (candidateId: number): Promise<any> => {
    const res = await apiClient.get(`/tests/check-existing/${candidateId}`);
    return res.data;
  },
};
