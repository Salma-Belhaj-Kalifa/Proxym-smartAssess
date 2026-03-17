import { useState, useCallback } from 'react';

interface CVAnalysisResult {
  basic_information?: {
    full_name: string;
    email: string;
    phone: string;
  };
  technical_information?: {
    domain: string;
    technologies: Array<{
      name: string;
      skill_level: string;
    }>;
  };
  certifications?: Array<{
    certification_name: string;
    issuing_organization?: string;
    issue_date?: string;
  }>;
  soft_skills?: {
    communication_skills: string[];
    leadership_skills: string[];
    problem_solving: string[];
    teamwork: string[];
    time_management: string[];
    adaptability: string[];
  };
  projects_list?: Array<{
    name: string;
    tech_stack: string[];
    role: string;
  }>;
}

export const useCVAnalysis = () => {
  const [analysis, setAnalysis] = useState<CVAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const analyzeCV = useCallback(async (file: File) => {
    if (!file) return;
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      setAnalysis(null); 
    } catch (error) {
      console.error('CV Analysis failed:', error);
      setAnalysisError(error instanceof Error ? error.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const generateQuestions = useCallback(async (profile: CVAnalysisResult, numberOfQuestions: number = 5) => {
    console.log('Question generation will be handled by backend');
    return [];
  }, []);

  const clearAnalysis = useCallback(() => {
    setAnalysis(null);
    setAnalysisError(null);
    setIsAnalyzing(false);
  }, []);

  return {
    analysis,
    isAnalyzing,
    analysisError,
    analyzeCV,
    generateQuestions,
    clearAnalysis
  };
};
