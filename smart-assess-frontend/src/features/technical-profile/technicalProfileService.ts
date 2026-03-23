import apiClient from '@/lib/api';

export const technicalProfileService = {
  getByCandidateId: async (candidateId: number): Promise<any> => {
    const response = await apiClient.get(`/technical_profiles/candidate/${candidateId}`);
    return response.data;
  },

  create: async (profileData: any): Promise<any> => {
    const response = await apiClient.post('/technical_profiles', profileData);
    return response.data;
  },

  update: async (id: number, profileData: any): Promise<any> => {
    const response = await apiClient.put(`/technical_profiles/${id}`, profileData);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/technical_profiles/${id}`);
  },
};
