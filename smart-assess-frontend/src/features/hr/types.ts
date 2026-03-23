export interface HR {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'HR' | 'ADMIN';
  department?: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface HRReport {
  id: number;
  title: string;
  type: 'CANDIDATES' | 'POSITIONS' | 'HIRING' | 'PERFORMANCE';
  data: any;
  generatedAt: string;
  generatedBy: number;
}

export interface HRMetrics {
  totalCandidates: number;
  activePositions: number;
  pendingApplications: number;
  hiredCandidates: number;
  averageTimeToHire: number;
  positionsByStatus: Record<string, number>;
  candidatesByStatus: Record<string, number>;
}
