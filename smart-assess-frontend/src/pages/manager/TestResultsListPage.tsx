import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useTests, useGetTestResults } from '@/features/tests/testsQueries';
import { useCandidatures, usePositions } from '@/features';
import { AlertCircle, Eye, User, Briefcase, Clock, Calendar } from 'lucide-react';
import apiClient from '@/lib/api';

interface TestResult {
  id: number;
  candidate: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  internshipPosition: {
    id: number;
    title: string;
    company: string;
  };
  status: 'SUBMITTED' | 'IN_PROGRESS' | 'PENDING' | 'EXPIRED';
  createdAt: string;
  submittedAt?: string;
  timeLimitMinutes: number;
  finalScore?: number;
  testScore?: number;
  timeSpentMinutes?: number;
  timeSpentSeconds?: number;
  timeSpentFormatted?: string;
  session?: {
    startedAt?: string;
    submittedAt?: string;
  };
}

const TestResultsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [failedTestIds] = useState<Set<number>>(new Set());
  const [refreshKey, setRefreshKey] = useState(0); // Forcer le rechargement
  
  // Utiliser React Query pour récupérer les données
  const { data: testsData = [], isLoading: testsLoading, error: testsError, refetch: refetchTests } = useTests();
  const { data: candidatures = [] } = useCandidatures();
  const { data: positions = [] } = usePositions();

  // Extraire les tests de l'objet si nécessaire (comme dans le dashboard)
  const tests = Array.isArray(testsData) ? testsData : 
               (testsData && typeof testsData === 'object' && 'tests' in testsData) ? 
               (testsData as any).tests : [];

  // Récupérer les résultats pour chaque test complété
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renderKey, setRenderKey] = useState(0); // Forcer le re-render

  useEffect(() => {
    console.log('=== TESTS DATA CHANGED ===');
    console.log('Raw testsData:', testsData);
    console.log('Extracted tests:', tests);
    console.log('Tests with SUBMITTED status:', tests.filter(t => t.status === 'SUBMITTED'));
    console.log('Tests with COMPLETED status:', tests.filter(t => t.status === 'COMPLETED'));
    
    if (tests.length > 0) {
      loadTestsWithResults();
    }
  }, [tests, refreshKey]);

  const loadTestsWithResults = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const results: TestResult[] = [];
      
      // Filtrer les tests complétés
      const completedTests = tests.filter(test => 
        test.status === 'COMPLETED' || test.status === 'SUBMITTED'
      );
      
      console.log('=== CHARGEMENT DES RÉSULTATS DE TESTS ===');
      console.log('Tests complétés trouvés:', completedTests.length);
      
      for (const test of completedTests) {
        try {
          console.log('Chargement des résultats pour le test ID:', test.id);
          
          // Appeler l'endpoint /review pour obtenir les vraies données
          const response = await apiClient.get(`/tests/${test.id}/review`);
          console.log('Réponse API reçue pour le test', test.id, ':', response.status, response.data);
          const reviewData = response.data;
          
          console.log('Données reçues pour le test', test.id, ':', reviewData);
          
          // Vérifier spécifiquement les scores
          console.log('Scores disponibles:', {
            finalScore: reviewData.scores?.finalScore,
            totalScore: reviewData.scores?.totalScore,
            maxScore: reviewData.scores?.maxScore,
            scoresObj: reviewData.scores
          });
          
          // Si finalScore est undefined, logger mais ne pas calculer manuellement (le backend le fait maintenant)
          if (!reviewData.scores?.finalScore) {
            console.log('⚠️ Scores manquants pour le test', test.id, '- le backend devrait calculer automatiquement');
            console.log('Contenu complet de reviewData.scores:', JSON.stringify(reviewData.scores, null, 2));
          }
          
          // Extraire les données de l'endpoint /review
          const testResult: TestResult = {
            id: reviewData.id || test.id,
            candidate: {
              id: reviewData.candidate?.id || test.candidate?.id || 0,
              firstName: reviewData.candidate?.firstName || test.candidate?.firstName || 'Candidat',
              lastName: reviewData.candidate?.lastName || test.candidate?.lastName || 'Inconnu',
              email: reviewData.candidate?.email || test.candidate?.email || 'email@example.com'
            },
            internshipPosition: {
              id: reviewData.internshipPosition?.id || test.internshipPosition?.id || 0,
              title: reviewData.internshipPosition?.title || test.internshipPosition?.title || 'Poste non spécifié',
              company: reviewData.internshipPosition?.company || test.internshipPosition?.company || 'Entreprise'
            },
            status: (reviewData.status as 'SUBMITTED' | 'IN_PROGRESS' | 'PENDING' | 'EXPIRED') || 'SUBMITTED',
            createdAt: reviewData.createdAt || test.createdAt || new Date().toISOString(),
            submittedAt: reviewData.session?.submittedAt,
            timeLimitMinutes: reviewData.timeLimitMinutes || test.timeLimitMinutes || 60,
            finalScore: reviewData.scores?.finalScore,
            testScore: reviewData.scores?.totalScore,
            timeSpentMinutes: reviewData.session?.timeSpentMinutes,
            timeSpentSeconds: reviewData.session?.timeSpentSeconds,
            timeSpentFormatted: reviewData.session?.timeSpentMinutes ? 
              `${reviewData.session.timeSpentMinutes} min` : 'N/A',
            session: reviewData.session
          };
          
          console.log('TestResult créé pour le test', test.id, ':', {
            finalScore: testResult.finalScore,
            submittedAt: testResult.submittedAt,
            candidate: testResult.candidate?.firstName + ' ' + testResult.candidate?.lastName
          });
          
          results.push(testResult);
          
        } catch (error: any) {
          console.error(`❌ ERREUR API pour le test ${test.id}:`, error);
          console.error('Status:', error.response?.status);
          console.error('Message:', error.message);
          console.error('Données:', error.response?.data);
          console.log('Tentative avec les données de base pour le test', test.id);
          
          // En cas d'erreur, essayer d'abord avec les données de base mais de manière améliorée
          try {
            // Réessayer avec l'endpoint /review une deuxième fois (parfois c'est un timeout)
            const retryResponse = await apiClient.get(`/tests/${test.id}/review`);
            const retryData = retryResponse.data;
            
            console.log('Retry réussi pour le test', test.id, ':', retryData);
            
            const retryResult: TestResult = {
              id: retryData.id || test.id,
              candidate: {
                id: retryData.candidate?.id || test.candidate?.id || 0,
                firstName: retryData.candidate?.firstName || test.candidate?.firstName || 'Candidat',
                lastName: retryData.candidate?.lastName || test.candidate?.lastName || 'Inconnu',
                email: retryData.candidate?.email || test.candidate?.email || 'email@example.com'
              },
              internshipPosition: {
                id: retryData.internshipPosition?.id || test.internshipPosition?.id || 0,
                title: retryData.internshipPosition?.title || test.internshipPosition?.title || 'Poste non spécifié',
                company: retryData.internshipPosition?.company || test.internshipPosition?.company || 'Entreprise'
              },
              status: (retryData.status as 'SUBMITTED' | 'IN_PROGRESS' | 'PENDING' | 'EXPIRED') || 'SUBMITTED',
              createdAt: retryData.createdAt || test.createdAt || new Date().toISOString(),
              submittedAt: retryData.session?.submittedAt,
              timeLimitMinutes: retryData.timeLimitMinutes || test.timeLimitMinutes || 60,
              finalScore: retryData.scores?.finalScore,
              testScore: retryData.scores?.totalScore,
              timeSpentMinutes: retryData.session?.timeSpentMinutes,
              timeSpentSeconds: retryData.session?.timeSpentSeconds,
              timeSpentFormatted: retryData.session?.timeSpentMinutes ? 
                `${retryData.session.timeSpentMinutes} min` : 'N/A',
              session: retryData.session
            };
            
            console.log('Retry TestResult créé pour le test', test.id, ':', {
              finalScore: retryResult.finalScore,
              submittedAt: retryResult.submittedAt
            });
            
            results.push(retryResult);
            
          } catch (retryError: any) {
            console.error(`Retry échoué pour le test ${test.id}:`, retryError);
            
            // Vraiment utiliser les données de base en dernier recours
            const fallbackResult: TestResult = {
              id: test.id,
              candidate: {
                id: test.candidate?.id || 0,
                firstName: test.candidate?.firstName || 'Candidat',
                lastName: test.candidate?.lastName || 'Inconnu',
                email: test.candidate?.email || 'email@example.com'
              },
              internshipPosition: {
                id: test.internshipPosition?.id || 0,
                title: test.internshipPosition?.title || 'Poste non spécifié',
                company: test.internshipPosition?.company || 'Entreprise'
              },
              status: (test.status as 'SUBMITTED' | 'IN_PROGRESS' | 'PENDING' | 'EXPIRED') || 'SUBMITTED',
              createdAt: test.createdAt || new Date().toISOString(),
              submittedAt: test.session?.submittedAt,
              timeLimitMinutes: test.timeLimitMinutes || 60,
              finalScore: test.score, // Dernier recours - peut être undefined
              testScore: test.score,
              timeSpentMinutes: test.session?.timeSpentMinutes,
              timeSpentSeconds: test.session?.timeSpentSeconds,
              timeSpentFormatted: test.session?.timeSpentMinutes ? 
                `${test.session.timeSpentMinutes} min` : 'N/A',
              session: test.session
            };
            
            console.log('Fallback TestResult créé pour le test', test.id, ':', {
              finalScore: fallbackResult.finalScore,
              submittedAt: fallbackResult.submittedAt
            });
            
            results.push(fallbackResult);
            failedTestIds.add(test.id);
          }
        }
      }
      
      setTestResults(results);
      console.log('=== RÉSULTATS FINAUX CHARGÉS ===');
      console.log('Nombre de résultats:', results.length);
      
      // Forcer le re-render des cartes
      setRenderKey(prev => prev + 1);
      
    } catch (error: any) {
      console.error('Erreur lors de la récupération des résultats de tests:', error);
      setError('Erreur lors du chargement des résultats');
      setTestResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Soumis</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">En cours</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">En attente</Badge>;
      case 'EXPIRED':
        return <Badge className="bg-red-100 text-red-800 border-red-300">Expiré</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-300">Inconnu</Badge>;
    }
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 80) return 'text-green-600 font-semibold';
    if (score >= 60) return 'text-yellow-600 font-semibold';
    return 'text-red-600 font-semibold';
  };

  if (testsLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des résultats...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-2xl mx-auto m-4">
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur de chargement</h2>
              <p className="text-gray-600">{error || 'Erreur lors du chargement des tests'}</p>
              <Button onClick={() => navigate('/manager/dashboard')} className="mt-4">
                Retour au dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vérifier s'il y a des tests complétés
  const hasCompletedTests = testResults.length > 0;
  
  console.log('=== VÉRIFICATION ÉTAT FINAL ===');
  console.log('Tests bruts:', tests.length);
  console.log('Tests complétés:', tests.filter(t => t.status === 'COMPLETED' || t.status === 'SUBMITTED').length);
  console.log('TestResults:', testResults.length);
  console.log('HasCompletedTests:', hasCompletedTests);
  console.log('IsLoading:', isLoading);
  console.log('Error:', error);

  if (!hasCompletedTests && !isLoading) {
    console.log('⚠️ Aucun test complété trouvé - redirection vers dashboard');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Aucun résultat trouvé</h2>
          <p className="text-gray-600">Aucun test complété trouvé.</p>
          <Button onClick={() => navigate('/manager/dashboard')} className="mt-4">
            Retour au dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Résultats des Tests</h1>
          <div className="flex gap-2">
            <Button 
              onClick={() => {
                console.log('Manual refresh triggered');
                refetchTests();
                setRefreshKey(prev => prev + 1);
              }} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Actualiser
            </Button>
            <Button onClick={() => navigate('/manager/dashboard')} className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Retour au Dashboard
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" key={renderKey}>
          {testResults
            .map((test) => {
              // Mapping intelligent des positions - les données sont directement dans test.internshipPosition
              const position = test.internshipPosition || {
                title: 'Poste non spécifié',
                company: 'Entreprise'
              };
              
              return (
              <Card key={`${test.id}-${test.finalScore || 'na'}-${renderKey}`} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{position.title || 'Poste non spécifié'}</span>
                    <Badge className={
                      test.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      test.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }>
                      {test.status === 'COMPLETED' ? 'Terminé' :
                       test.status === 'SUBMITTED' ? 'Soumis' : 'Inconnu'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{test.candidate?.firstName || 'Candidat'} {test.candidate?.lastName || 'Inconnu'}</p>
                        <p className="text-sm text-gray-600">{test.candidate?.email || 'email@example.com'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <Briefcase className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{position.title || 'Poste non spécifié'}</p>
                        <p className="text-sm text-gray-600">{position.company || 'Entreprise'}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">
                          Créé: {new Date(test.createdAt || '').toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          Soumis: {test.submittedAt ? new Date(test.submittedAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Score:</span>
                      <div className="text-2xl font-bold text-blue-600">
                        {test.finalScore !== null && test.finalScore !== undefined 
                          ? `${Math.round(test.finalScore)}%` 
                          : '0%'}
                      </div>
                    </div>
                    <Button
                      onClick={() => navigate(`/manager/test-results/${test.id}`)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Voir les détails
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default TestResultsListPage;
