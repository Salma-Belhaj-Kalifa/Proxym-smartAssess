export interface CVAnalysisResult {
  id: number;
  candidateId: number;
  cvUrl: string;
  analysis: any;
  score: number;
  recommendations: string[];
  createdAt: string;
  updatedAt: string;
}