export interface TechnicalProfile {
  id: number;
  userId: number;
  skills: string[];
  experience: Experience[];
  education: Education[];
  certifications: Certification[];
  projects: Project[];
  softSkills: SoftSkills;
  createdAt: string;
  updatedAt: string;
}

export interface Experience {
  id: number;
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  description: string;
  technologies: string[];
}

export interface Education {
  id: number;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

export interface Certification {
  id: number;
  name: string;
  issuingOrganization?: string;
  issueDate?: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  technologies: string[];
  startDate: string;
  endDate?: string;
  url?: string;
  githubUrl?: string;
  role: string;
}

export interface SoftSkills {
  communicationSkills: string[];
  leadershipSkills: string[];
  problemSolving: string[];
  teamwork: string[];
  timeManagement: string[];
  adaptability: string[];
}
