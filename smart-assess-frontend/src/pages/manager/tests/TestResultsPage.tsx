import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, User, Send, Timer, CheckCircle, AlertCircle, Download, Eye, Check, X, Target, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getStatusLabel, getStatusVariant } from '@/utils/statusMappings';
import { toast } from 'sonner';
import apiClient from '@/lib/api';
import { useTest } from '@/features/tests/testsQueries';
import { useGetPublicTest, useGetTestResults } from '@/features/tests/testsQueries';
import { useSubmitTest } from '@/features/tests/testsMutations';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

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
  hasRealAnswers?: boolean;
  skillScores?: {
    [skillName: string]: {
      correct: number;
      total: number;
    };
  };
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
    timeSpentSeconds?: number;
    hasRealTime?: boolean;
  };
}

const TestResultsPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastError, setLastError] = useState<Error | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [candidatureId, setCandidatureId] = useState<number | null>(null);
  const [candidatureStatus, setCandidatureStatus] = useState<string | null>(null);
  
  // 🎯 États pour le modal de rejet
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  
  // 🎯 État pour afficher/masquer les détails des réponses
  const [showDetails, setShowDetails] = useState(false);

  // Vérifier si testId est un token (UUID) ou un ID numérique
  const isToken = testId && testId.includes('-');
  console.log('Test ID from URL:', testId);
  console.log('Is token:', isToken);

  // Charger les données du test
  useEffect(() => {
    const loadTestData = async () => {
      if (!testId) {
        console.error('No test ID provided');
        setLastError(new Error('ID de test manquant'));
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setLastError(null);
        
        console.log('=== CHARGEMENT DES RÉSULTATS DU TEST ===');
        console.log('Test ID:', testId);
        console.log('Is token:', isToken);

        let response;
        if (isToken) {
          console.log('Using public test endpoint with token');
          response = await apiClient.get(`/tests/public/${testId}/results`);
        } else {
          console.log('Using test review endpoint with ID');
          response = await apiClient.get(`/tests/${testId}/review`);
        }

        console.log('Response received:', response.data);
        
        if (response.data) {
          const result = response.data;
          
          // Récupérer l'ID de la candidature si disponible
          if (result.candidatureId) {
            setCandidatureId(result.candidatureId);
            console.log('✅ Candidature ID found:', result.candidatureId);
          } else {
            console.warn('❌ No candidatureId found in response');
            console.log('Response keys:', Object.keys(result));
          }
          
          // Récupérer le statut de la candidature si disponible
          if (result.candidatureStatus) {
            setCandidatureStatus(result.candidatureStatus);
            console.log('✅ Candidature status found:', result.candidatureStatus);
          }
          
          // Calculer les scores si nécessaire
          const scoreData = calculateRealScore(result);
          const sessionData = calculateResponseTime(result);
          
          const testResult: TestResult = {
            id: result.id || parseInt(testId),
            token: result.token || '',
            candidateName: result.candidateName || result.candidate?.firstName + ' ' + result.candidate?.lastName || 'Candidat inconnu',
            positionTitle: result.positionTitle || result.positionCompany ? 
              `${result.positionTitle || 'Poste non spécifié'} - ${result.positionCompany || 'Entreprise'}` : 
              'Poste non spécifié',
            status: result.status || 'UNKNOWN',
            createdAt: result.createdAt || new Date().toISOString(),
            submittedAt: result.submittedAt || result.createdAt || new Date().toISOString(),
            timeLimitMinutes: result.timeLimitMinutes || 30,
            questions: result.questions || [],
            candidate: result.candidate || {},
            hasRealAnswers: scoreData.hasRealAnswers,
            skillScores: scoreData.skillScores,
            scores: {
              totalScore: scoreData.testScore,
              maxScore: scoreData.testScore + (result.questions?.length || 0),
              finalScore: scoreData.score,
              correctAnswers: scoreData.correctAnswers,
              totalQuestions: scoreData.totalQuestions
            },
            session: sessionData
          };

          console.log('Final test result:', testResult);
          setTestResult(testResult);
        } else {
          throw new Error('Aucune donnée reçue');
        }
        
      } catch (error) {
        console.error('Error loading test results:', error);
        setLastError(error as Error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTestData();
  }, [testId, isToken]);

  const calculateRealScore = (testData: any) => {
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
    console.log('Session data from backend:', testData.session);
    
    if (testData.session && testData.session.startedAt && testData.session.submittedAt) {
      const startedAt = new Date(testData.session.startedAt);
      const submittedAt = new Date(testData.session.submittedAt);
      const timeDiffMs = submittedAt.getTime() - startedAt.getTime();
      const timeSpentMinutes = Math.floor(timeDiffMs / (1000 * 60));
      const timeSpentSeconds = Math.floor((timeDiffMs % (1000 * 60)) / 1000);
      
      console.log('Session time calculation:', {
        startedAt: startedAt.toISOString(),
        submittedAt: submittedAt.toISOString(),
        timeDiffMs: timeDiffMs,
        timeSpentMinutes: timeSpentMinutes,
        timeSpentSeconds: timeSpentSeconds
      });
      
      return {
        timeSpentMinutes,
        timeSpentSeconds,
        startedAt: startedAt.toISOString(),
        submittedAt: submittedAt.toISOString(),
        hasRealTime: true
      };
    }
    
    console.log('No session data available, using fallback');
    return {
      timeSpentMinutes: testData.timeLimitMinutes || 30,
      timeSpentSeconds: 0,
      startedAt: testData.createdAt,
      submittedAt: new Date(new Date(testData.createdAt).getTime() + (testData.timeLimitMinutes || 30) * 60 * 1000).toISOString(),
      hasRealTime: false
    };
  };

  const getSkillPercentage = (skill: string) => {
    const skillData = testResult?.skillScores?.[skill];
    if (!skillData || skillData.total === 0) return 0;
    return Math.round((skillData.correct / skillData.total) * 100);
  };

  // Fonction pour accepter la candidature
  const handleAcceptCandidature = async () => {
    if (!candidatureId) {
      toast.error('ID de candidature non trouvé');
      return;
    }

    try {
      setIsUpdatingStatus(true);
      console.log('Accepting candidature:', candidatureId);
      
      const response = await apiClient.put(`/candidatures/${candidatureId}/status`, {
        status: 'ACCEPTED'
      });

      console.log('Candidature accepted:', response.data);
      toast.success('Candidature acceptée avec succès');
      
      // Mettre à jour l'interface si nécessaire
      setTimeout(() => {
        navigate('/manager/candidats');
      }, 1500);
      
    } catch (error: any) {
      console.error('Error accepting candidature:', error);
      toast.error(error?.response?.data?.message || 'Erreur lors de l\'acceptation de la candidature');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Fonction pour ouvrir le modal de rejet
  const handleRejectClick = () => {
    setRejectModalOpen(true);
    setRejectionReason('');
  };

  // Fonction pour confirmer le rejet
  const handleRejectConfirm = async () => {
    if (!candidatureId) {
      toast.error('ID de candidature non trouvé');
      return;
    }

    try {
      setIsUpdatingStatus(true);
      console.log('Rejecting candidature:', candidatureId, 'Reason:', rejectionReason);
      
      const response = await apiClient.put(`/candidatures/${candidatureId}/status`, {
        status: 'REJECTED',
        rejectionReason: rejectionReason.trim() || null
      });

      console.log('Candidature rejected:', response.data);
      toast.success('Candidature rejetée avec succès');
      
      // Fermer le modal
      setRejectModalOpen(false);
      setRejectionReason('');
      
      // Mettre à jour l'interface si nécessaire
      setTimeout(() => {
        navigate('/manager/candidats');
      }, 1500);
      
    } catch (error: any) {
      console.error('Error rejecting candidature:', error);
      toast.error(error?.response?.data?.message || 'Erreur lors du rejet de la candidature');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Fonction pour annuler le rejet
  const handleRejectCancel = () => {
    setRejectModalOpen(false);
    setRejectionReason('');
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
              <p className="text-gray-600">{lastError?.message || 'Erreur inconnue'}</p>
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
            onClick={() => navigate('/manager/tests-resultats')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Page de Résultats du Test</h1>
              </div>
              <div className="text-right">
                <Badge variant={getStatusVariant(testResult.status)}>
                  {getStatusLabel(testResult.status)}
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
                  <p className="text-lg font-semibold">{testResult.positionTitle?.split(' - ')[0] || 'Poste non spécifié'}</p>
                  <p className="text-sm text-gray-600">{testResult.positionTitle?.split(' - ')[1] || 'Entreprise'}</p>
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
                      {testResult.session?.timeSpentMinutes !== undefined ? 
                        `${testResult.session.timeSpentMinutes} min ${testResult.session.timeSpentSeconds || 0}s` : 
                        'N/A'
                      }
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

          {/* Boutons d'action pour la candidature */}
          {candidatureId && candidatureStatus !== 'ACCEPTED' && candidatureStatus !== 'REJECTED' && (
            <Card>
              <CardHeader>
                <CardTitle>Décision de candidature</CardTitle>
                <p className="text-sm text-gray-600">
                  Basée sur les résultats du test ({Math.round(testResult.scores?.finalScore || 0)}%)
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Button 
                    onClick={handleAcceptCandidature}
                    disabled={isUpdatingStatus}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {isUpdatingStatus ? 'Traitement...' : 'Accepter'}
                  </Button>
                  <Button 
                    onClick={handleRejectClick}
                    disabled={isUpdatingStatus}
                    variant="destructive"
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    {isUpdatingStatus ? 'Traitement...' : 'Rejeter'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Message pour candidature déjà traitée */}
          {candidatureId && (candidatureStatus === 'ACCEPTED' || candidatureStatus === 'REJECTED') && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {candidatureStatus === 'ACCEPTED' ? (
                    <>
                      <Check className="h-5 w-5 text-green-600" />
                      Candidature Acceptée
                    </>
                  ) : (
                    <>
                      <X className="h-5 w-5 text-red-600" />
                      Candidature Refusée
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  {candidatureStatus === 'ACCEPTED' 
                    ? 'Cette candidature a été acceptée. Le candidat a été notifié de la décision.'
                    : 'Cette candidature a été refusée. Le candidat a été notifié de la décision.'
                  }
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Scores par compétence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                {Object.entries(testResult.skillScores || {}).map(([skill, data]) => {
                  const percentage = getSkillPercentage(skill);
                  const getColorClass = (percentage: number) => {
                    if (percentage >= 80) return 'bg-green-500';
                    if (percentage >= 60) return 'bg-blue-500';
                    if (percentage >= 40) return 'bg-yellow-500';
                    if (percentage >= 20) return 'bg-orange-500';
                    return 'bg-red-500';
                  };
                  
                  return (
                    <div key={skill} className="p-2 bg-white border rounded hover:shadow-sm transition-shadow">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span 
                            className="text-xs font-medium truncate w-full pr-1" 
                            title={skill}
                            style={{ fontSize: skill.length > 15 ? '10px' : '11px' }}
                          >
                            {skill}
                          </span>
                          <Badge 
                            variant="outline" 
                            className={`${getColorClass(percentage)} text-white border-0 text-xs font-bold px-1.5 py-0.5`}
                          >
                            {percentage}%
                          </Badge>
                        </div>
                        
                        <div className="w-full bg-gray-100 rounded-full h-1">
                          <div 
                            className={`${getColorClass(percentage)} h-1 rounded-full transition-all duration-300`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {Object.keys(testResult.skillScores || {}).length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  <AlertCircle className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Aucune compétence évaluée</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mb-6"></div>

        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Détail des réponses</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              {showDetails ? 'Masquer les détails' : 'Voir les détails'}
            </Button>
          </CardHeader>
          
          {showDetails && (
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
          )}
        </Card>
      </div>
      
      {/* 🎯 MODAL DE REJET */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rejeter la candidature</DialogTitle>
            <DialogDescription>
              Veuillez confirmer le rejet de cette candidature. La raison est optionnelle.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="rejectionReason">Raison du rejet (optionnel)</Label>
              <Textarea
                id="rejectionReason"
                placeholder="Veuillez indiquer la raison du rejet..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleRejectCancel}
              disabled={isUpdatingStatus}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus ? 'Traitement...' : 'Confirmer le rejet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TestResultsPage;
