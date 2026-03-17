import apiClient from '@/lib/api';
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
  phone?: string;
  department?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  bio?: string;
  linkedin?: string;
  github?: string;
  // Champs pour le profil technique et CV
  technicalProfile?: any;
  cvAnalysis?: any;
  cvFileName?: string;
  cvAnalyzedAt?: string;
  cvSize?: number;
  cvType?: string;
  // Informations extraites du CV
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
  createdBy: number; // ID du manager
  createdByEmail?: string; // Email du manager (optionnel)
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

// Service d'authentification
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
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Erreur lors du logout API:', error);
      throw error;
    }
  },
  
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get(API_ENDPOINTS.AUTH.ME);
    console.log('Réponse getCurrentUser API:', response.data);
    return response.data;
  },

  updateUserProfile: async (id: number, userData: Partial<User>): Promise<User> => {
    console.log('Mise à jour profil utilisateur:', userData);
    const response = await apiClient.put(API_ENDPOINTS.USERS.PROFILE(id), userData);
    return response.data;
  }
};

// Service des positions
export const positionService = {
  getAll: async (): Promise<Position[]> => {
    const response = await apiClient.get(API_ENDPOINTS.POSITIONS.GET_ALL);
    return response.data;
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
  },
  
  update: async (id: number, positionData: Partial<Position>): Promise<Position> => {
    
    try {
      const response = await apiClient.put(API_ENDPOINTS.POSITIONS.UPDATE(id), positionData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  updatePatch: async (id: number, positionData: Partial<Position>): Promise<Position> => {
    try {
      const response = await apiClient.patch(`/positions/${id}`, positionData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.POSITIONS.DELETE(id));
  }
};

// Service des candidats
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
  
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

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
    const response = await apiClient.post('/candidatures', candidatureData);

    return response.data;
  } catch (error: any) {
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
};

// Service des candidatures
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

// Service des profils techniques
export const technicalProfileService = {
  getByCandidateId: async (candidateId: number): Promise<any> => {
    const response = await apiClient.get(`/technical_profiles/candidate/${candidateId}`);
    return response.data;
  },
  
  getByCvId: async (cvId: number): Promise<any> => {
    const response = await apiClient.get(`/technical_profiles/cv/${cvId}`);
    return response.data;
  },
  
  create: async (profileData: any): Promise<any> => {
    const response = await apiClient.post('/technical_profiles', profileData);
    return response.data;
  },
  
  update: async (id: number, data: any): Promise<any> => {
    const response = await apiClient.put(`/technical_profiles/${id}`, data);
    return response.data;
  },
};

// Service des tests
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
  
  startTest: async (token: string): Promise<any> => {
    const response = await apiClient.post(`/tests/public/${token}/start`);
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
