import apiClient from '@/lib/api';
import { HR, HRReport, HRMetrics } from './types';

export const hrService = {
  // HR management
  getAll: async (): Promise<HR[]> => {
    const response = await apiClient.get('/hr');
    return response.data;
  },

  getById: async (id: number): Promise<HR> => {
    const response = await apiClient.get(`/hr/${id}`);
    return response.data;
  },

  create: async (data: Omit<HR, 'id' | 'createdAt' | 'updatedAt'>): Promise<HR> => {
    const response = await apiClient.post('/hr', data);
    return response.data;
  },

  update: async (id: number, data: Partial<HR>): Promise<HR> => {
    const response = await apiClient.put(`/hr/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/hr/${id}`);
  },

  // Reports
  getReports: async (): Promise<HRReport[]> => {
    const response = await apiClient.get('/hr/reports');
    return response.data;
  },

  generateReport: async (type: string, filters?: any): Promise<HRReport> => {
    const response = await apiClient.post('/hr/reports/generate', { type, filters });
    return response.data;
  },

  downloadReport: async (reportId: number): Promise<Blob> => {
    const response = await apiClient.get(`/hr/reports/${reportId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Metrics
  getMetrics: async (): Promise<HRMetrics> => {
    const response = await apiClient.get('/hr/metrics');
    return response.data;
  },

  // Dashboard data
  getDashboardData: async (): Promise<any> => {
    const response = await apiClient.get('/hr/dashboard');
    return response.data;
  },
};
