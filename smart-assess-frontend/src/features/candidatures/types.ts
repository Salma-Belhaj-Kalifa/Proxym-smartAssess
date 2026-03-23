export interface Candidature {
  id: number;
  candidateId: number;
  candidate?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  positionId: number;
  position?: {
    id: number;
    title: string;
    company: string;
  };
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  appliedAt: string;
  createdAt: string;
  updatedAt: string;
  cvUrl?: string;
  coverLetter?: string;
  motivation?: string;
}
