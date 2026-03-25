export interface Candidature {
  id: number;
  candidateId: number;
  positionId: number;
  status: string;
  appliedAt: string;
  cvUrl?: string;
  aiScore?: number;
  aiAnalysis?: any;
  testGenerated?: boolean;
  testCompleted?: boolean;
  candidate?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  position?: {
    id: number;
    title: string;
    company: string;
  };
}