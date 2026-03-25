export interface Candidate {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  skills: string[];
  domains: string[];
  appliedPositions: number[];
  createdAt: string;
}