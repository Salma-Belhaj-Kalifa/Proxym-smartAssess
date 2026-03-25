import apiClient from '@/lib/api';
import API_ENDPOINTS from '@/config/apiEndpoints';
import { Candidature } from './types';

export const candidaturesService = {
  getAll: async (): Promise<Candidature[]> => {
    const response = await apiClient.get(API_ENDPOINTS.CANDIDATURES.GET_ALL);
    return response.data;
  },

  getById: async (id: number): Promise<Candidature> => {
    const response = await apiClient.get(API_ENDPOINTS.CANDIDATURES.GET_BY_ID(id));
    return response.data;
  },

  create: async (candidatureData: {
    candidateId: number;
    positionId: number;
    status: string;
  }): Promise<Candidature> => {
    // Le backend attend 'internshipPositionId' et définit le status automatiquement à PENDING
    const requestData = {
      candidateId: candidatureData.candidateId,
      internshipPositionId: candidatureData.positionId // ← Nom correct du backend
      // status non envoyé car le backend le définit automatiquement à PENDING
    };
    const response = await apiClient.post(API_ENDPOINTS.CANDIDATURES.CREATE, requestData);
    return response.data;
  },

  update: async (id: number, data: Partial<Candidature>): Promise<Candidature> => {
    const response = await apiClient.put(API_ENDPOINTS.CANDIDATURES.UPDATE(id), data);
    return response.data;
  },

  updateStatus: async (id: number, status: string): Promise<Candidature> => {
    const response = await apiClient.put(API_ENDPOINTS.CANDIDATURES.UPDATE_STATUS(id), { status });
    return response.data;
  },

  getByCandidate: async (candidateId: number): Promise<Candidature[]> => {
    const response = await apiClient.get(API_ENDPOINTS.CANDIDATURES.BY_CANDIDATE(candidateId));
    return response.data;
  },

  getByPosition: async (positionId: number): Promise<Candidature[]> => {
    const response = await apiClient.get(API_ENDPOINTS.CANDIDATURES.BY_POSITION(positionId));
    return response.data;
  },
};