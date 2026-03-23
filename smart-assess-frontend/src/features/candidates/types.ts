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
