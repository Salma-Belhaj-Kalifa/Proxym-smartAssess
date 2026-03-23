export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
  department?: string;
  bio?: string;
  linkedin?: string;
  github?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
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
