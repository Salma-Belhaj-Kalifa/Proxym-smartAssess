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
    positionId?: number;
    positionIds?: number[];
    status?: string;
  }): Promise<Candidature> => {
    // Support pour plusieurs postes
    const requestData: any = {
      candidateId: candidatureData.candidateId
    };
    
    if (candidatureData.positionIds && candidatureData.positionIds.length > 0) {
      // Nouvelle structure: plusieurs postes
      requestData.positionIds = candidatureData.positionIds;
    } else if (candidatureData.positionId) {
      // Compatibilité avec l'ancienne structure
      requestData.internshipPositionId = candidatureData.positionId;
    }
    
    // status non envoyé car le backend le définit automatiquement à PENDING
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