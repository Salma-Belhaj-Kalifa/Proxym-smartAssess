export interface Test {
  id: number;
  title?: string;
  description?: string;
  duration?: number; // en minutes
  timeLimitMinutes?: number;
  questions?: Question[];
  question?: Question[];
  createdBy?: number;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
  status?: string;
  token?: string;
  candidateId?: number;
  positionId?: number;
  candidate?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  position?: {
    id: number;
    title: string;
    company?: string;
  };
  score?: number;
  finalScore?: number;
  maxScore?: number;
  correctAnswers?: number;
  totalQuestions?: number;
  session?: {
    startedAt?: string;
    submittedAt?: string;
    timeSpentMinutes?: number;
    timeSpentSeconds?: number;
    hasRealTime?: boolean;
  };
}

export interface Question {
  id: number;
  questionText: string;
  questionType: string;
  options: string[];
  correctAnswer: string;
  skillTag: string;
  maxScore: number;
  orderIndex: number;
}

export interface TestSubmission {
  testId: number;
  answers: {
    [questionId: string]: string | string[];
  };
  timeSpentMinutes?: number;
}

export interface TestResults {
  id: number;
  token: string;
  candidate?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  position?: {
    id: number;
    title: string;
    company: string;
  };
  status: string;
  submittedAt?: string;
  timeLimitMinutes?: number;
  finalScore?: number;
  maxScore?: number;
  correctAnswers?: number;
  totalQuestions?: number;
  session?: {
    startedAt?: string;
    submittedAt?: string;
    timeSpentMinutes?: number;
    timeSpentSeconds?: number;
  };
  skillScores?: {
    [skillName: string]: {
      correct: number;
      total: number;
    };
  };
}