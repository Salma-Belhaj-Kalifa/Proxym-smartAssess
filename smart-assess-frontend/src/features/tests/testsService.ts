import apiClient from '@/lib/api';
import API_ENDPOINTS from '@/config/apiEndpoints';
import { Test } from './types';

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

  generateTest: async (testData: any): Promise<any> => {
    const response = await apiClient.post(API_ENDPOINTS.TESTS.GENERATE, testData);
    return response.data;
  },

  submitTest: async (testId: number, answers: any): Promise<any> => {
    const response = await apiClient.post(API_ENDPOINTS.TESTS.SUBMIT(testId), answers);
    return response.data;
  },

  startTest: async (token: string): Promise<any> => {
    const response = await apiClient.post(API_ENDPOINTS.TESTS.START_TEST(token));
    return response.data;
  },

  getTestResults: async (token: string): Promise<any> => {
    const response = await apiClient.get(`/tests/public/${token}/results`);
    return response.data;
  },

  getPublicTest: async (token: string): Promise<any> => {
    const response = await apiClient.get(`/tests/public/${token}`);
    return response.data;
  },

  getTestForReview: async (id: number): Promise<any> => {
    const response = await apiClient.get(`/tests/${id}/review`);
    return response.data;
  },

  getTestResultsByToken: async (token: string): Promise<any> => {
    const response = await apiClient.get(`/tests/public/${token}/results`);
    return response.data;
  },
};