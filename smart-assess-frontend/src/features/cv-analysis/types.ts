export interface CVAnalysisResult {
  id: number;
  candidateId: number;
  analysis: any;
  score: number;
  recommendations: string[];
  createdAt: string;
  updatedAt: string;
}
