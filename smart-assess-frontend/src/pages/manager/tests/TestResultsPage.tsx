import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, User, Send, Timer, CheckCircle, AlertCircle, Download, Eye, Check, X, Target, Users, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getStatusLabel, getStatusVariant } from '@/utils/statusMappings';
import { toast } from 'sonner';
import apiClient from '@/lib/api';
import { useTest } from '@/features/tests/testsQueries';
import { useGetPublicTest, useGetTestResults } from '@/features/tests/testsQueries';
import { useSubmitTest } from '@/features/tests/testsMutations';
import { useCandidatures } from '@/features/candidatures/candidaturesQueries';
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

  // 🎯 Importer les candidatures
  const { data: candidatures = [] } = useCandidatures();

  // 🎯 États pour le modal de rejet
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // 🎯 État pour afficher/masquer les détails des réponses
  const [showDetails, setShowDetails] = useState(false);

  // 🎯 État pour stocker les données du résultat chargé
  const [loadedResult, setLoadedResult] = useState<any>(null);

  // Vérifier si testId est un token (UUID) ou un ID numérique
  const isToken = testId && testId.includes('-');
  console.log('Test ID from URL:', testId);
  console.log('Is token:', isToken);

  // LOGIQUE DÉFINITIVE: utiliser directement les données du test result
  const candidatePositions = useMemo(() => {
    console.log('=== FINAL LOGIC - TEST RESULT DIRECT ===');
    console.log('loadedResult:', loadedResult);
    
    if (!loadedResult) {
      console.log('❌ No loadedResult');
      return [];
    }
    
    // PRIORITÉ 1: utiliser internshipPositions (nouveau champ tableau du backend)
    if (loadedResult.internshipPositions && Array.isArray(loadedResult.internshipPositions) && loadedResult.internshipPositions.length > 0) {
      console.log('✅ Utilisation de internshipPositions du test result');
      console.log('internshipPositions:', loadedResult.internshipPositions);
      
      const result = loadedResult.internshipPositions.map((pos: any) => ({
        title: pos.title,
        company: pos.company || 'Entreprise',
        appliedAt: loadedResult.createdAt || new Date().toISOString(),
        candidatureId: loadedResult.candidatureId || null
      }));
      
      console.log('✅ RESULTAT FINAL RETOURNÉ:', result);
      return result;
    }
    
    // PRIORITÉ 2: utiliser internshipPosition (ancien champ unique pour rétrocompatibilité)
    if (loadedResult.internshipPosition && loadedResult.internshipPosition.title) {
      console.log('✅ Utilisation directe de internshipPosition du test result');
      console.log('internshipPosition.title:', loadedResult.internshipPosition.title);
      console.log('internshipPosition.company:', loadedResult.internshipPosition.company);
      
      const result = [{
        title: loadedResult.internshipPosition.title,
        company: loadedResult.internshipPosition.company || 'Entreprise',
        appliedAt: loadedResult.createdAt || new Date().toISOString(),
        candidatureId: loadedResult.candidatureId || null
      }];
      
      console.log('✅ RESULTAT FINAL RETOURNÉ:', result);
      return result;
    }
    
    // PRIORITÉ 3: utiliser positionTitle du test result (fallback)
    if (loadedResult.positionTitle) {
      console.log('✅ Utilisation directe de positionTitle du test result');
      console.log('positionTitle:', loadedResult.positionTitle);
      console.log('positionCompany:', loadedResult.positionCompany);
      
      const result = [{
        title: loadedResult.positionTitle,
        company: loadedResult.positionCompany || 'Entreprise',
        appliedAt: loadedResult.createdAt || new Date().toISOString(),
        candidatureId: loadedResult.candidatureId || null
      }];
      
      console.log('✅ RESULTAT FINAL RETOURNÉ:', result);
      return result;
    }
    
    // PRIORITÉ 4: fallback ultime
    console.log('⚠️ Aucune donnée de poste trouvée dans le test result, fallback par défaut');
    const result = [{
      title: 'Poste non spécifié',
      company: 'Entreprise',
      appliedAt: loadedResult.createdAt || new Date().toISOString(),
      candidatureId: loadedResult.candidatureId || null
    }];
    
    console.log('✅ RESULTAT FINAL RETOURNÉ:', result);
    return result;
    
  }, [loadedResult, loadedResult?.internshipPositions]);

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
          setLoadedResult(result); // Stocker le résultat pour le useMemo
          
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
          
          // Stocker tous les postes depuis le test result
          const positions = (() => {
            if (result.internshipPositions?.length > 0) return result.internshipPositions;
            if (result.internshipPosition?.title) return [result.internshipPosition];
            return [{ title: 'Poste non spécifié', company: 'Entreprise' }];
          })();

          console.log('=== TOUS LES POSTES DU TEST RESULT ===');
          console.log('All positions:', positions);
          console.log('Number of positions:', positions.length);

          const testResult: TestResult = {
            id: result.id || parseInt(testId),
            token: result.token || '',
            candidateName: result.candidateName || result.candidate?.firstName + ' ' + result.candidate?.lastName || 'Candidat inconnu',
            positionTitle: positions.map((p: any) => `${p.title} - ${p.company}`).join(' | '),
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
        <div className="mb-6">
          <button
            onClick={() => navigate('/manager/tests-resultats')}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Retour
          </button>
          
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="px-4 pt-4 pb-0">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                    <Timer className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-gray-900">Page de Résultats du Test</h1>
                    <p className="text-xs text-gray-400">Analyse détaillée des performances du candidat</p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Badge 
                    className={`px-3 py-1.5 text-xs font-semibold rounded-full ${
                      testResult.status === 'COMPLETED'
                        ? 'bg-green-50 text-green-800 border-green-200'
                        : testResult.status === 'SUBMITTED'
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : 'bg-gray-100 text-gray-800 border-gray-200'
                    }`}
                  >
                    {getStatusLabel(testResult.status)}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="h-px bg-gray-100 mx-4" />

            {/* Body */}
            <div className="px-4 py-4">
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <div className="flex items-center gap-1.5">
                  <User className="w-3 h-3" />
                  {testResult.candidateName}
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />
                  {new Date(testResult.createdAt).toLocaleDateString('fr-FR')}
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  {testResult.session?.timeSpentMinutes !== undefined ? 
                    `${testResult.session.timeSpentMinutes}m ${testResult.session.timeSpentSeconds || 0}s` : 
                    'N/A'
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-3 bg-white border border-gray-100 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 mb-4">
                <Timer className="w-4 h-4 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-900">Informations du Test</h3>
              </div>
            </div>

            <div className="h-px bg-gray-100 mx-4" />

            {/* Body */}
            <div className="px-4 py-4 space-y-4">
              {/* Candidat */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-800 text-xs font-medium flex-shrink-0">
                  {testResult.candidateName?.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{testResult.candidateName}</p>
                  <p className="text-xs text-gray-400">{testResult.candidate?.email || 'Email non disponible'}</p>
                </div>
              </div>

              {/* Postes */}
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium text-gray-500">Poste{testResult.positionTitle?.includes(' | ') ? 's' : ''}</p>
                {testResult.positionTitle?.split(' | ').map((position, index) => {
                  const [title, company] = position.split(' - ');
                  return (
                    <div key={index} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                      <Briefcase className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">{title}</p>
                        <p className="text-xs text-gray-400">{company}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Stats principales */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className={`text-xl font-medium ${
                    (testResult.scores?.finalScore ?? 0) >= 80 ? 'text-green-700'
                    : (testResult.scores?.finalScore ?? 0) >= 60 ? 'text-amber-700'
                    : 'text-red-700'
                  }`}>
                    {Math.round(testResult.scores?.finalScore || 0)}%
                  </p>
                  <p className="text-xs text-gray-400">Score global</p>
                  <div className="mt-1 h-1 bg-gray-100 rounded-full w-full">
                    <div
                      className={`h-1 rounded-full ${
                        (testResult.scores?.finalScore ?? 0) >= 80 ? 'bg-green-500'
                        : (testResult.scores?.finalScore ?? 0) >= 60 ? 'bg-amber-500'
                        : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.round(testResult.scores?.finalScore ?? 0)}%` }}
                    />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xl font-medium text-green-700">
                    {testResult.scores?.correctAnswers || 0}/{testResult.scores?.totalQuestions || 0}
                  </p>
                  <p className="text-xs text-gray-400">réponses correctes</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-medium text-orange-700">
                    {testResult.session?.timeSpentMinutes !== undefined ? 
                      `${testResult.session.timeSpentMinutes}m ${testResult.session.timeSpentSeconds || 0}s` : 
                      'N/A'
                    }
                  </p>
                  <p className="text-xs text-gray-400">Temps de réponse</p>
                </div>
              </div>

              {/* Dates */}
              <div className="border-t border-gray-100 pt-3">
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      Début : {new Date(testResult.session?.startedAt || testResult.createdAt).toLocaleDateString('fr-FR')}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      Fin : {new Date(testResult.session?.submittedAt || testResult.submittedAt).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      Durée limite : {testResult.timeLimitMinutes} min
                    </div>
                  </div>
                </div>
              </div>

              {/* Décision de candidature */}
              {candidatureId && candidatureStatus !== 'ACCEPTED' && candidatureStatus !== 'REJECTED' && (
                <div className="border-t border-gray-100 pt-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-4 h-4 text-gray-400" />
                    <h4 className="text-sm font-semibold text-gray-900">Décision de candidature</h4>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">
                    Basée sur les résultats du test ({Math.round(testResult.scores?.finalScore || 0)}%)
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleAcceptCandidature}
                      disabled={isUpdatingStatus}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs px-3 py-2.5 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {isUpdatingStatus ? 'Traitement...' : 'Accepter'}
                    </button>
                    <button
                      onClick={handleRejectClick}
                      disabled={isUpdatingStatus}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs px-3 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X className="w-3.5 h-3.5" />
                      {isUpdatingStatus ? 'Traitement...' : 'Rejeter'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Message pour candidature déjà traitée */}
          {candidatureId && (candidatureStatus === 'ACCEPTED' || candidatureStatus === 'REJECTED') && (
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              {/* Header */}
              <div className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 mb-3">
                  {candidatureStatus === 'ACCEPTED' ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <X className="w-4 h-4 text-red-600" />
                  )}
                  <h3 className="text-sm font-semibold text-gray-900">
                    {candidatureStatus === 'ACCEPTED' ? 'Candidature Acceptée' : 'Candidature Refusée'}
                  </h3>
                </div>
              </div>

              <div className="h-px bg-gray-100 mx-4" />

              {/* Body */}
              <div className="px-4 py-4">
                <p className="text-xs text-gray-400">
                  {candidatureStatus === 'ACCEPTED' 
                    ? 'Cette candidature a été acceptée. Le candidat a été notifié de la décision.'
                    : 'Cette candidature a été refusée. Le candidat a été notifié de la décision.'
                  }
                </p>
              </div>
            </div>
          )}

          <div className="lg:col-span-3 bg-white border border-gray-100 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-4 h-4 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-900">Scores par compétence</h3>
              </div>
            </div>

            <div className="h-px bg-gray-100 mx-4" />

            {/* Body */}
            <div className="px-4 py-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                {Object.entries(testResult.skillScores || {}).map(([skill, data]) => {
                  const percentage = getSkillPercentage(skill);
                  const getColorClass = (percentage: number) => {
                    if (percentage >= 80) return 'bg-green-500';
                    if (percentage >= 60) return 'bg-blue-500';
                    if (percentage >= 40) return 'bg-amber-500';
                    if (percentage >= 20) return 'bg-orange-500';
                    return 'bg-red-500';
                  };
                  
                  return (
                    <div key={skill} className="bg-gray-50 rounded-lg p-3 border border-gray-100 hover:border-gray-200 transition-colors">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-1">
                          <span 
                            className="text-xs font-medium text-gray-900 truncate flex-1" 
                            title={skill}
                          >
                            {skill}
                          </span>
                          <span 
                            className={`text-xs font-bold px-1.5 py-0.5 rounded-full text-white flex-shrink-0 ${
                              percentage >= 80 ? 'bg-green-500'
                              : percentage >= 60 ? 'bg-blue-500'
                              : percentage >= 40 ? 'bg-amber-500'
                              : percentage >= 20 ? 'bg-orange-500'
                              : 'bg-red-500'
                            }`}
                          >
                            {percentage}%
                          </span>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div 
                            className={`h-1 rounded-full transition-all duration-300 ${
                              percentage >= 80 ? 'bg-green-500'
                              : percentage >= 60 ? 'bg-blue-500'
                              : percentage >= 40 ? 'bg-amber-500'
                              : percentage >= 20 ? 'bg-orange-500'
                              : 'bg-red-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {Object.keys(testResult.skillScores || {}).length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <AlertCircle className="h-8 w-8 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">Aucune compétence évaluée</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mb-6"></div>

        <div className="lg:col-span-3 bg-white border border-gray-100 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="px-4 pt-4 pb-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-900">Détail des réponses</h3>
              </div>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                {showDetails ? 'Masquer les détails' : 'Voir les détails'}
              </button>
            </div>
             <div className="mb-4"></div>
          </div>

          <div className="h-px bg-gray-100 mx-4" />

          {/* Body */}
          {showDetails && (
            <div className="px-4 py-4">
              <div className="space-y-3">
                {testResult.questions.map((question, index) => (
                  <div key={question.id} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-900 mb-1">
                          Question {index + 1}
                        </h4>
                        <p className="text-xs text-gray-600">{question.questionText}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full flex-shrink-0 flex items-center gap-1 ${
                        question.isCorrect 
                          ? 'bg-green-50 text-green-800 border-green-200' 
                          : 'bg-red-50 text-red-800 border-red-200'
                      }`}>
                        {question.isCorrect ? (
                          <>
                            <Check className="w-3 h-3" />
                            Correct
                          </>
                        ) : (
                          <>
                            <X className="w-3 h-3" />
                            Incorrect
                          </>
                        )}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center gap-1.5 mb-1">
                          <User className="w-3 h-3 text-blue-400" />
                          <p className="text-xs font-medium text-gray-700">Réponse du candidat</p>
                        </div>
                        <p className={`text-xs font-medium ${
                          question.candidateAnswer ? 'text-blue-600' : 'text-gray-400'
                        }`}>
                          {question.candidateAnswer || 'Non répondue'}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Check className="w-3 h-3 text-green-400" />
                          <p className="text-xs font-medium text-gray-700">Réponse correcte</p>
                        </div>
                        <p className="text-xs font-medium text-green-600">{question.correctAnswer}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
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
