import { Candidate } from '../candidates/types';

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