import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  ArrowLeft,
  Send,
  Timer
} from 'lucide-react';
import apiService from '@/services/apiService';

interface Question {
  id: number;
  questionText: string;
  questionType: string;
  options: string[];
  correctAnswer: string;
  skillTag: string;
  maxScore: number;
  orderIndex: number;
  candidateAnswer?: string;
  isCorrect?: boolean;
  scoreObtained?: number;
}

interface TestResult {
  id: number;
  token: string;
  candidateName: string;
  positionTitle: string;
  status: string;
  createdAt: string;
  submittedAt: string;
  timeLimitMinutes: number;
  questions: Question[];
  candidate?: any;
  scores?: {
    totalScore: number;
    maxScore: number;
    finalScore: number;
    correctAnswers: number;
    totalQuestions: number;
  };
  session?: {
    startedAt: string;
    submittedAt: string;
    timeSpentMinutes: number;
  };
}

const TestResultsPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastError, setLastError] = useState<Error | null>(null);

  const calculateRealScore = (testData: any) => {
    console.log('=== CALCUL DU SCORE RÉEL ===');
    console.log('Test data structure:', Object.keys(testData));
    console.log('Test data:', testData);
    
    const questions = testData.questions || [];
    console.log('Questions received:', questions);
    
    if (questions.length === 0) {
      return {
        score: 0,
        testScore: 0,
        cvMatchingScore: 75,
        skillScores: {},
        totalQuestions: 0,
        correctAnswers: 0,
        questionDetails: [],
        hasRealAnswers: false
      };
    }

    let correctCount = 0;
    const skillScores: { [key: string]: { correct: number; total: number } } = {};
    const questionDetails: any[] = [];

    questions.forEach((question: any) => {
      console.log('Question:', question);
      
      const userAnswer = question.candidateAnswer;
      const isCorrect = question.isCorrect;
      const scoreObtained = question.scoreObtained;
      const skillTag = question.skillTag;
      
      console.log('User answer:', userAnswer);
      console.log('Is correct:', isCorrect);
      
      if (isCorrect) {
        correctCount++;
      }
      
      if (skillTag) {
        if (!skillScores[skillTag]) {
          skillScores[skillTag] = { correct: 0, total: 0 };
        }
        skillScores[skillTag].total++;
        if (isCorrect) {
          skillScores[skillTag].correct++;
        }
      }
      
      questionDetails.push({
        questionId: question.id,
        questionText: question.questionText,
        userAnswer: userAnswer || 'Non répondue',
        correctAnswer: question.correctAnswer,
        isCorrect: isCorrect || false,
        scoreObtained: scoreObtained || 0,
        maxScore: question.maxScore || 1
      });
    });

    const totalScore = questionDetails.reduce((sum, q) => sum + (q.scoreObtained || 0), 0);
    const maxScore = questionDetails.reduce((sum, q) => sum + (q.maxScore || 1), 0);
    const finalScore = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

    console.log('Calculated scores:', {
      totalScore,
      maxScore,
      finalScore,
      correctCount,
      totalQuestions: questions.length,
      skillScores
    });

    return {
      score: finalScore,
      testScore: totalScore,
      cvMatchingScore: 75,
      skillScores,
      totalQuestions: questions.length,
      correctAnswers: correctCount,
      questionDetails,
      hasRealAnswers: true
    };
  };

  const calculateResponseTime = (testData: any) => {
    console.log('=== CALCUL DU TEMPS DE RÉPONSE ===');
    
    if (testData.session && testData.session.startedAt && testData.session.submittedAt) {
      const startedAt = new Date(testData.session.startedAt);
      const submittedAt = new Date(testData.session.submittedAt);
      const timeDiffMs = submittedAt.getTime() - startedAt.getTime();
      const timeSpentMinutes = Math.round(timeDiffMs / (1000 * 60));
      
      console.log('Session time from backend:', {
        startedAt,
        submittedAt,
        timeSpentMinutes
      });
      
      return {
        timeSpentMinutes,
        timeStartedAt: startedAt,
        timeEndedAt: submittedAt,
        hasRealTime: true
      };
    }
    
    console.log('No session data available, using fallback');
    return {
      timeSpentMinutes: testData.timeLimitMinutes || 30,
      timeStartedAt: new Date(testData.createdAt),
      timeEndedAt: new Date(new Date(testData.createdAt).getTime() + (testData.timeLimitMinutes || 30) * 60 * 1000),
      hasRealTime: false
    };
  };

  const loadTestResult = async (testId: string) => {
    try {
      setIsLoading(true);
      setLastError(null);
      console.log('Loading test result for ID:', testId);
      
      const testData = await apiService.testService.getTestForReview(Number(testId));
      console.log('Test data received:', testData);
      
      const calculatedScore = calculateRealScore(testData);
      const timeData = calculateResponseTime(testData);
      
      const result: TestResult = {
        id: testData.id,
        token: testData.token,
        candidateName: `${testData.candidate?.firstName || ''} ${testData.candidate?.lastName || ''}`.trim(),
        positionTitle: testData.internshipPosition?.title || 'Poste non spécifié',
        status: testData.status,
        createdAt: testData.createdAt,
        submittedAt: testData.submittedAt || testData.createdAt,
        timeLimitMinutes: testData.timeLimitMinutes || testData.duration || 30,
        questions: testData.questions || [],
        scores: testData.scores,
        session: testData.session,
        candidate: testData.candidate,
        ...calculatedScore
      };
      
      setTestResult(result);
      console.log('Test result loaded successfully:', result);
      
    } catch (error: any) {
      console.error('Error loading test result:', error);
      setLastError(error);
      toast.error('Erreur lors du chargement des résultats du test');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (testId && !isNaN(Number(testId))) {
      loadTestResult(testId);
    } else {
      console.error('Invalid test ID:', testId);
      setLastError(new Error('ID de test invalide'));
      setIsLoading(false);
    }
  }, [testId]);

  const getSkillPercentage = (skill: string) => {
    const skillData = testResult?.skillScores?.[skill];
    if (!skillData || skillData.total === 0) return 0;
    return Math.round((skillData.correct / skillData.total) * 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des résultats...</p>
        </div>
      </div>
    );
  }

  if (lastError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-2xl mx-auto m-4">
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur de chargement</h2>
              <p className="text-gray-600">{lastError.message}</p>
              <Button onClick={() => navigate('/manager/dashboard')} className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour au dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!testResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Test non trouvé</h2>
          <p className="text-gray-600">Le test demandé n'existe pas.</p>
          <Button onClick={() => navigate('/manager/dashboard')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => navigate('/manager/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux candidats
          </Button>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Page de Résultats du Test</h1>
                {testResult.hasRealAnswers && (
                  <Badge variant="secondary" className="ml-2">
                    Données réelles
                  </Badge>
                )}
              </div>
              <div className="text-right">
                <Badge variant={testResult.status === 'SUBMITTED' ? 'default' : 'secondary'}>
                  {testResult.status}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Timer className="h-5 w-5 mr-2" />
                Informations du Test
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Candidat</p>
                  <p className="text-lg font-semibold">{testResult.candidateName}</p>
                  <p className="text-sm text-gray-600">{testResult.candidate?.email || 'Email non disponible'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Poste</p>
                  <p className="text-lg font-semibold">{testResult.positionTitle}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">
                      {Math.round(testResult.scores?.finalScore || 0)}%
                    </p>
                    <p className="text-sm text-gray-500">Score global</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {testResult.scores?.correctAnswers || 0}/{testResult.scores?.totalQuestions || 0}
                    </p>
                    <p className="text-sm text-gray-500">réponses correctes</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-600">
                      {testResult.session?.timeSpentMinutes || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-500">Temps de réponse</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <p><strong>Début :</strong> {new Date(testResult.session?.startedAt || testResult.createdAt).toLocaleString()}</p>
                    <p><strong>Fin :</strong> {new Date(testResult.session?.submittedAt || testResult.submittedAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p><strong>Durée limite :</strong> {testResult.timeLimitMinutes} minutes</p>
                    <p className="text-xs mt-1">
                      {testResult.session?.hasRealTime ? (
                        <span className="text-green-600">⏱️ Temps réel</span>
                      ) : (
                        <span className="text-orange-600">⏱️ Temps estimé</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scores par compétence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(testResult.skillScores || {}).map(([skill, data]) => (
                  <div key={skill} className="flex items-center justify-between">
                    <span className="font-medium">{skill}</span>
                    <div className="flex items-center">
                      <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${getSkillPercentage(skill)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{getSkillPercentage(skill)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Détail des réponses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResult.questions.map((question, index) => (
                <div key={question.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900">
                      Question {index + 1}: {question.questionText}
                    </h3>
                    <Badge variant={question.isCorrect ? 'default' : 'destructive'}>
                      {question.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-700">Réponse:</p>
                      <p className={`font-medium ${question.candidateAnswer ? 'text-blue-600' : 'text-gray-500'}`}>
                        {question.candidateAnswer || 'Non répondue'}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Correct:</p>
                      <p className="font-medium text-green-600">{question.correctAnswer}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestResultsPage;
