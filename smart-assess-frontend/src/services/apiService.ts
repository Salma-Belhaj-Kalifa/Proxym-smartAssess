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
    console.log('Réponse login API:', response.data);
    return response.data;
  },
  
  register: async (userData: any): Promise<AuthResponse> => {
    console.log('=== DEBUG REGISTER ===');
    console.log('userData being sent:', userData);
    console.log('API endpoint:', API_ENDPOINTS.AUTH.REGISTER);
    
    const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, userData);
    console.log('Réponse register API:', response.data);
    console.log('Response status:', response.status);
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
    console.log('Récupération utilisateur courant...');
    const response = await apiClient.get(API_ENDPOINTS.AUTH.ME);
    console.log('Réponse getCurrentUser API:', response.data);
    return response.data;
  },

  updateUserProfile: async (id: number, userData: Partial<User>): Promise<User> => {
    console.log('Mise à jour profil utilisateur:', userData);
    const response = await apiClient.put(API_ENDPOINTS.USERS.PROFILE(id), userData);
    console.log('Réponse updateProfile API:', response.data);
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
    console.log('=== API SERVICE CREATE ===');
    console.log('PositionData reçu:', positionData);
    console.log('PositionData JSON:', JSON.stringify(positionData, null, 2));
    console.log('URL:', API_ENDPOINTS.POSITIONS.CREATE);
    console.log('Type de positionData:', typeof positionData);
    console.log('Clés de positionData:', Object.keys(positionData));
    
    try {
      const response = await apiClient.post(API_ENDPOINTS.POSITIONS.CREATE, positionData);
      console.log('Réponse de création:', response.data);
      console.log('Status de la réponse:', response.status);
      return response.data;
    } catch (error) {
      console.error('=== ERREUR API SERVICE CREATE ===');
      console.error('Erreur:', error);
      console.error('Response:', error.response);
      console.error('Response Data:', error.response?.data);
      console.error('Response Status:', error.response?.status);
      console.error('Response Headers:', error.response?.headers);
      console.error('Request Config:', error.config);
      console.error('Request Data:', error.config?.data);
      throw error;
    }
  },
  
  update: async (id: number, positionData: Partial<Position>): Promise<Position> => {
    console.log('=== API SERVICE UPDATE ===');
    console.log('ID:', id);
    console.log('PositionData:', positionData);
    console.log('PositionData JSON:', JSON.stringify(positionData, null, 2));
    console.log('URL:', API_ENDPOINTS.POSITIONS.UPDATE(id));
    
    try {
      const response = await apiClient.put(API_ENDPOINTS.POSITIONS.UPDATE(id), positionData);
      console.log('Réponse de mise à jour:', response.data);
      console.log('Status de la réponse:', response.status);
      return response.data;
    } catch (error) {
      console.error('=== ERREUR API SERVICE ===');
      console.error('Erreur:', error);
      console.error('Response:', error.response);
      console.error('Response Data:', error.response?.data);
      console.error('Response Status:', error.response?.status);
      console.error('Response Headers:', error.response?.headers);
      console.error('Request Config:', error.config);
      console.error('Request Data:', error.config?.data);
      throw error;
    }
  },
  
  // Ajouter une méthode PATCH pour le test
  updatePatch: async (id: number, positionData: Partial<Position>): Promise<Position> => {
    console.log('=== API SERVICE PATCH ===');
    console.log('ID:', id);
    console.log('PositionData:', positionData);
    console.log('PositionData JSON:', JSON.stringify(positionData, null, 2));
    console.log('URL:', `/positions/${id}`);
    
    try {
      const response = await apiClient.patch(`/positions/${id}`, positionData);
      console.log('Réponse de PATCH:', response.data);
      console.log('Status de la réponse:', response.status);
      return response.data;
    } catch (error) {
      console.error('=== ERREUR API SERVICE PATCH ===');
      console.error('Erreur:', error);
      console.error('Response:', error.response);
      console.error('Response Data:', error.response?.data);
      console.error('Response Status:', error.response?.status);
      console.error('Request Config:', error.config);
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
    console.log('=== CANDIDATE CREATE DEBUG ===');
    console.log('CandidateData being sent:', candidateData);
    console.log('API endpoint:', API_ENDPOINTS.CANDIDATES.CREATE);
    console.log('CandidateData JSON:', JSON.stringify(candidateData, null, 2));
    
    try {
      const response = await apiClient.post(API_ENDPOINTS.CANDIDATES.CREATE, candidateData);
      console.log('Candidate create response:', response.data);
      console.log('Response status:', response.status);
      return response.data;
    } catch (error) {
      console.error('=== CANDIDATE CREATE ERROR ===');
      console.error('Error:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      throw error;
    }
  },
  
  update: async (id: number, candidateData: Partial<Candidate>): Promise<Candidate> => {
    const response = await apiClient.put(API_ENDPOINTS.CANDIDATES.UPDATE(id), candidateData);
    return response.data;
  },
  
  uploadCV: async (candidateId: number, file: File): Promise<{cvUrl: string; id?: number; fileName?: string}> => {
    const formData = new FormData();
    
    // Debug: Vérifier si le fichier est valide
    console.log('File object received:', file);
    console.log('File constructor:', file.constructor.name);
    console.log('File type:', file.type);
    console.log('File size:', file.size);
    
    // Ajouter le fichier avec le bon nom
    formData.append('file', file, file.name);
    
    // Debug: Vérifier le contenu de FormData
    console.log('FormData entries:');
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

    try {
      console.log('=== UPLOAD CV DEBUG ===');
      console.log('Uploading CV for candidate:', candidateId);
      console.log('File object received:', file);
      console.log('File constructor:', file.constructor.name);
      console.log('File type:', file.type);
      console.log('File size:', file.size);
      console.log('Request URL:', '/candidates/cv');
      
      // Utiliser l'endpoint existant pour l'upload de CV
      const response = await apiClient.post(
        '/candidates/cv', 
        formData
      );
      
      console.log('Upload CV response:', response.data);
      console.log('Upload CV status:', response.status);
      
      console.log('Complete workflow response:', response.data);
      
      // Retourner le format attendu par le frontend
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
  console.log('=== CREATE CANDIDATURE DEBUG ===');
  console.log('Payload envoyé:', candidatureData);

  try {
    const response = await apiClient.post('/candidatures', candidatureData);

    console.log('Réponse candidature:', response.data);
    console.log('Status:', response.status);

    return response.data;
  } catch (error: any) {
    console.error('=== CREATE CANDIDATURE ERROR ===');
    console.error('Erreur:', error);
    console.error('Response:', error.response);
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);

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
    console.log('=== UPDATE PROFILE DEBUG ===');
    console.log('UserId:', userId);
    console.log('ProfileData being sent:', profileData);
    console.log('ProfileData JSON:', JSON.stringify(profileData, null, 2));
    console.log('API endpoint:', API_ENDPOINTS.USERS.PROFILE(userId));
    
    try {
      const response = await apiClient.put(API_ENDPOINTS.USERS.PROFILE(userId), profileData);
      console.log('UpdateProfile response:', response.data);
      console.log('UpdateProfile status:', response.status);
      console.log('UpdateProfile successful!');
      return response.data;
    } catch (error: any) {
      console.error('=== UPDATE PROFILE ERROR ===');
      console.error('Error:', error);
      console.error('Response:', error.response);
      console.error('Status:', error.response?.status);
      console.error('Data:', error.response?.data);
      throw error;
    }
  },
  
  deleteAccount: async (userId: number): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.USERS.DELETE(userId));
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
  }
};

export default {
  authService,
  positionService,
  candidateService,
  testService,
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
