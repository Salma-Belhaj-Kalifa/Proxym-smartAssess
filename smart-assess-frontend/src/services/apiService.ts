import apiClient, { removeAuthToken, removeAuthUserData } from '@/lib/api';
import API_ENDPOINTS from '@/config/apiEndpoints';

// Types pour les réponses du backend
export interface AuthResponse {
  token: string;
  type: string;
  id: number;
  user: User;
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  bio?: string;
  linkedin?: string;
  github?: string;
  technicalProfile?: any;
  cvAnalysis?: any;
  cvFileName?: string;
  cvAnalyzedAt?: string;
  cvSize?: number;
  cvType?: string;
  skills?: string[];
  experience?: any[];
  education?: any[];
  certifications?: any[];
  projects?: any[];
  softSkills?: any;
}

export interface Position {
  id: number;
  title: string;
  description: string;
  company: string;
  requiredSkills: string[];
  acceptedDomains: string[];
  isActive: boolean;
  createdBy: number;
  createdByEmail?: string;
  createdAt: string;
  updatedAt: string;
  candidatures?: Candidate[];
}

export interface Candidate {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  cvUrl?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Test {
  id: number;
  title: string;
  description: string;
  type: string;
  duration: number;
  questions: Question[];
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: number;
  text: string;
  type: string;
  options?: string[];
  correctAnswer?: string;
  points: number;
  testId: number;
}

export interface CVAnalysis {
  id: number;
  candidateId: number;
  cvUrl: string;
  analysis: any;
  score: number;
  recommendations: string[];
  createdAt: string;
}

export const authService = {
  login: async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
    return response.data;
  },
  
  register: async (userData: any): Promise<AuthResponse> => {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, userData);
    return response.data;
  },
  
  logout: async (): Promise<void> => {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.error('Erreur lors du logout API:', error);
    } finally {
      // Utiliser les nouvelles fonctions unifiées
      removeAuthToken();
      removeAuthUserData();
    }
  },
  
  handleAuthError: (error: any): boolean => {
    if (error?.response?.status === 401 || 
        error?.message?.includes('User not found') ||
        error?.response?.data?.error?.includes('User not found')) {
      console.warn('Utilisateur non trouvé, nettoyage du localStorage');
      // Utiliser les nouvelles fonctions unifiées
      removeAuthToken();
      removeAuthUserData();
      return true;
    }
    return false;
  },
  
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get(API_ENDPOINTS.AUTH.ME);
    return response.data;
  },

  updateUserProfile: async (id: number, userData: Partial<User>): Promise<User> => {
    const response = await apiClient.put(API_ENDPOINTS.USERS.PROFILE(id), userData);
    return response.data;
  }
};

export const positionService = {
  getAll: async (): Promise<Position[]> => {
    const response = await apiClient.get(API_ENDPOINTS.POSITIONS.GET_ALL);
    return response.data;
  },
  
  getById: async (id: number): Promise<Position> => {
    const response = await apiClient.get(`/positions/${id}`);
    return response.data;
  },
  
  update: async (id: number, data: Partial<Position>): Promise<Position> => {
    const response = await apiClient.put(`/positions/${id}`, data);
    return response.data;
  },
  
  
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.POSITIONS.DELETE(id));
  },
  
  getPublic: async (): Promise<Position[]> => {
    const response = await apiClient.get(API_ENDPOINTS.POSITIONS.GET_PUBLIC);
    return response.data;
  },
  
  create: async (positionData: Omit<Position, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>): Promise<Position> => {
    
    try {
      const response = await apiClient.post(API_ENDPOINTS.POSITIONS.CREATE, positionData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export const candidateService = {
  getAll: async (): Promise<Candidate[]> => {
    const response = await apiClient.get(API_ENDPOINTS.CANDIDATES.GET_ALL);
    return response.data;
  },
  
  getById: async (id: number): Promise<Candidate> => {
    const response = await apiClient.get(API_ENDPOINTS.CANDIDATES.GET_BY_ID(id));
    return response.data;
  },
  
  create: async (candidateData: any): Promise<Candidate> => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.CANDIDATES.CREATE, candidateData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  update: async (id: number, candidateData: Partial<Candidate>): Promise<Candidate> => {
    const response = await apiClient.put(API_ENDPOINTS.CANDIDATES.UPDATE(id), candidateData);
    return response.data;
  },
  
  uploadCV: async (candidateId: number, file: File): Promise<{cvUrl: string; id?: number; fileName?: string}> => {
    const formData = new FormData();
    
    formData.append('file', file, file.name);

    try {
      const response = await apiClient.post(
        '/candidates/cv', 
        formData
      );
      
      const cvData = response.data.cv;
      return {
        cvUrl: `/api/candidates/download/${cvData.id}`,
        id: cvData.id,
        fileName: cvData.fileName
      };
    } catch (error) {
      console.error('Error during complete CV workflow:', error);
      throw error;
    }
  },
  
  createCandidature: async (candidatureData: {
  candidateId: number;
  internshipPositionId: number;
  status: string;
}): Promise<any> => {

  try {
    console.log('Creating candidature with data:', candidatureData);
    const response = await apiClient.post('/candidatures', candidatureData);
    console.log('Candidature created successfully:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error creating candidature:', error);
    console.error('Error response data:', error.response?.data);
    console.error('Error response status:', error.response?.status);
    console.error('Error response headers:', error.response?.headers);
    
    // Gérer les erreurs spécifiques
    if (error.response?.status === 500) {
      const errorData = error.response?.data;
      let errorMessage = 'Erreur serveur lors de la création de la candidature';
      
      if (errorData?.message) {
        errorMessage = `Erreur serveur: ${errorData.message}`;
      } else if (errorData?.error) {
        errorMessage = `Erreur serveur: ${errorData.error}`;
      } else if (errorData?.details) {
        errorMessage = `Erreur serveur: ${errorData.details}`;
      }
      
      throw new Error(errorMessage);
    }
    
    throw error;
  }
},
  
  getCandidatures: async (): Promise<any[]> => {
    const response = await apiClient.get('/candidatures');
    return response.data;
  },
  
  getCandidaturesByCandidate: async (candidateId: number): Promise<any[]> => {
    const response = await apiClient.get(`/candidatures/candidate/${candidateId}`);
    return response.data;
  },
  
  updateCandidatureStatus: async (id: number, status: string): Promise<any> => {
    const response = await apiClient.put(`/candidatures/${id}/status`, { status });
    return response.data;
  },
  
  getProfile: async (userId: number): Promise<User> => {
    const response = await apiClient.get(API_ENDPOINTS.USERS.PROFILE(userId));
    return response.data;
  },
  
  updateProfile: async (userId: number, profileData: Partial<User>): Promise<User> => {
    try {
      const response = await apiClient.put(API_ENDPOINTS.USERS.PROFILE(userId), profileData);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
  
  deleteAccount: async (userId: number): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.USERS.DELETE(userId));
  },
  
  deleteMyProfile: async (): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.CANDIDATES.DELETE_ME);
  },
};

export const candidatureService = {
  getById: async (id: number): Promise<any> => {
    const response = await apiClient.get(`/candidatures/${id}`);
    return response.data;
  },
  
  update: async (id: number, data: any): Promise<any> => {
    const response = await apiClient.put(`/candidatures/${id}`, data);
    return response.data;
  },
  
  updateStatus: async (id: number, status: string): Promise<any> => {
    const response = await apiClient.put(`/candidatures/${id}/status`, { status });
    return response.data;
  },
  
  getByCandidate: async (candidateId: number): Promise<any[]> => {
    const response = await apiClient.get(`/candidatures/candidate/${candidateId}`);
    return response.data;
  },
  
  getByPosition: async (positionId: number): Promise<any[]> => {
    const response = await apiClient.get(`/candidatures/position/${positionId}`);
    return response.data;
  },
};

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

export const testService = {
  getAll: async (): Promise<Test[]> => {
    const response = await apiClient.get(API_ENDPOINTS.TESTS.GET_ALL);
    return response.data;
  },
  
  getById: async (id: number): Promise<Test> => {
    const response = await apiClient.get(API_ENDPOINTS.TESTS.GET_BY_ID(id));
    return response.data;
  },
  
  create: async (testData: any): Promise<Test> => {
    const response = await apiClient.post(API_ENDPOINTS.TESTS.CREATE, testData);
    return response.data;
  },
  
  generateTest: async (testData: any): Promise<any> => {
    const response = await apiClient.post(API_ENDPOINTS.TESTS.GENERATE, testData);
    return response.data;
  },
  
  checkExistingTest: async (candidatureId: number): Promise<any> => {
    const response = await apiClient.get(`/tests/check-existing/${candidatureId}`);
    return response.data;
  },
  
  getPublicTest: async (token: string): Promise<any> => {
    const response = await apiClient.get(`/tests/public/${token}`);
    return response.data;
  },
  
  startTest: async (token: string): Promise<any> => {
    const response = await apiClient.post(`/tests/public/${token}/start`);
    return response.data;
  },
  
  submitTest: async (testId: number, submissionData: any): Promise<any> => {
    console.log('=== SOUMISSION DU TEST ===');
    console.log('Test ID:', testId);
    console.log('Submission data:', submissionData);
    
    const response = await apiClient.post(API_ENDPOINTS.TESTS.SUBMIT(testId), submissionData);
    console.log('Response from submission:', response.data);
    
    return response.data;
  },
  
  getTestForReview: async (testId: number): Promise<any> => {
    const response = await apiClient.get(`/tests/${testId}/review`);
    return response.data;
  },
  
  sendTestEmail: async (testId: number, emailData?: { recipientEmail?: string; customMessage?: string }): Promise<any> => {
    const response = await apiClient.post(API_ENDPOINTS.TESTS.SEND_EMAIL(testId), emailData || {});
    return response.data;
  }
};

export default {
  authService,
  positionService,
  candidateService,
  testService,
  candidatureService,
  technicalProfileService,
  managerService: {
    getProfile: async (userId: number): Promise<User> => {
      const response = await apiClient.get(API_ENDPOINTS.MANAGERS.GET_BY_ID(userId));
      return response.data;
    },
    
    updateProfile: async (userId: number, profileData: Partial<User>): Promise<User> => {
      const response = await apiClient.put(API_ENDPOINTS.MANAGERS.UPDATE(userId), profileData);
      return response.data;
    },
    
    deleteMyProfile: async (): Promise<void> => {
      await apiClient.delete(API_ENDPOINTS.MANAGERS.DELETE_ME);
    },
    
    deleteManager: async (id: number): Promise<void> => {
      await apiClient.delete(API_ENDPOINTS.MANAGERS.DELETE(id));
    }
  },
  userService: {
    getProfile: async (userId: number): Promise<User> => {
      const response = await apiClient.get(API_ENDPOINTS.USERS.PROFILE(userId));
      return response.data;
    },
    
    updateProfile: async (userId: number, profileData: Partial<User>): Promise<User> => {
      const response = await apiClient.put(API_ENDPOINTS.USERS.PROFILE(userId), profileData);
      return response.data;
    },
    
    deleteAccount: async (userId: number): Promise<void> => {
      await apiClient.delete(API_ENDPOINTS.USERS.DELETE(userId));
    }
  }
};
