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