export interface Test {
  id: number;
  title: string;
  description?: string;
  candidateId: number;
  candidate?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
  timeLimitMinutes?: number;
  finalScore?: number;
  testScore?: number;
  timeSpentMinutes?: number;
  questions?: any[];
  evaluationResult?: any;
}

export interface TestResult {
  id: number;
  testId: number;
  candidateId: number;
  candidate: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  score: number;
  status: string;
  submittedAt: string;
  evaluatedAt?: string;
  feedback?: string;
}
