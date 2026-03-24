import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, Clock, User, CheckCircle, AlertCircle, Eye, Calendar, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { testService } from '@/services/apiService';

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
}

const TestResultsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [failedTestIds] = useState<Set<number>>(new Set()); // Cache des tests en erreur

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Utiliser la nouvelle fonction pour trouver les tests existants
      const results = await getAllTestsWithResults();
      
      setTests(results);
      
      if (results.length === 0) {
        console.log('Aucun test complété trouvé');
        setError('Aucun test complété trouvé. Les candidats n\'ont pas encore soumis de tests.');
      } else {
        console.log(`${results.length} tests trouvés et chargés`);
      }
      
    } catch (error: any) {
      console.error('Erreur lors du chargement des résultats:', error);
      setError('Impossible de charger les résultats des tests. Veuillez réessayer plus tard.');
    } finally {
      setIsLoading(false);
    }
  };

  const getAllTestsWithResults = async (): Promise<TestResult[]> => {
    const results: TestResult[] = [];

    console.log('Recherche dynamique des tests existants pour éviter les erreurs 500');
    
    try {
      // Essayer de récupérer la liste de tous les tests disponibles
      const response = await testService.getAll();
      console.log('Tests trouvés:', response);
      
      // Extraire le tableau de tests depuis la réponse du backend
      const allTests = (response as any).tests || (response as any).data || response || [];
      console.log('Tests extraits:', allTests);
      
      // Filtrer uniquement les tests qui ont des résultats (status SUBMITTED)
      const completedTests = allTests.filter((test: any) => 
        test.status === 'SUBMITTED' || test.status === 'COMPLETED'
      );
      
      console.log('Tests complétés trouvés:', completedTests.length);
      
      if (completedTests.length === 0) {
        console.log('Aucun test complété trouvé dans la base de données');
        return results; // Retourner tableau vide
      }
      
      for (const test of completedTests) {
        try {
          // Vérifier si le test existe réellement en essayant de le récupérer
          const testDetails = await testService.getTestForReview(test.id);
          console.log('TestDetails récupérés pour test', test.id, ':', testDetails);
          
          if (testDetails) {
            // Calculer le temps exact depuis les dates de session
            let exactTimeSpentMinutes = 0;
            let exactTimeSpentSeconds = 0;
            let timeSpentFormatted = '';
            if (testDetails.session?.startedAt && testDetails.session?.submittedAt) {
              const startedAt = new Date(testDetails.session.startedAt);
              const submittedAt = new Date(testDetails.session.submittedAt);
              const timeDiffMs = submittedAt.getTime() - startedAt.getTime();
              exactTimeSpentMinutes = Math.floor(timeDiffMs / (1000 * 60));
              exactTimeSpentSeconds = Math.floor((timeDiffMs % (1000 * 60)) / 1000);
              timeSpentFormatted = `${exactTimeSpentMinutes} min ${exactTimeSpentSeconds}s`;
              console.log('Temps exact calculé:', exactTimeSpentMinutes, 'minutes', exactTimeSpentSeconds, 'secondes');
            }
            
            const testResult: TestResult = {
              id: test.id,
              candidate: testDetails.candidate || test.candidate || {
                id: 0,
                firstName: testDetails.candidate?.firstName || test.candidate?.firstName || 'Candidat',
                lastName: testDetails.candidate?.lastName || test.candidate?.lastName || 'Inconnu',
                email: testDetails.candidate?.email || test.candidate?.email || 'email@example.com'
              },
              internshipPosition: testDetails.internshipPosition || test.internshipPosition || {
                id: test.internshipPosition?.id || 1,
                title: testDetails.internshipPosition?.title || test.internshipPosition?.title || 'Poste inconnu',
                company: testDetails.internshipPosition?.company || test.internshipPosition?.company || 'SmartAssess'
              },
              status: testDetails.status || test.status || 'SUBMITTED',
              createdAt: testDetails.createdAt || test.createdAt || new Date().toISOString(),
              submittedAt: testDetails.submittedAt,
              timeLimitMinutes: testDetails.timeLimitMinutes || test.timeLimitMinutes || 24,
              finalScore: testDetails.finalScore,
              testScore: testDetails.testScore,
              timeSpentMinutes: exactTimeSpentMinutes || testDetails.session?.timeSpentMinutes || testDetails.timeSpentMinutes || test.timeSpentMinutes || 0,
              timeSpentSeconds: exactTimeSpentSeconds || 0,
              timeSpentFormatted: timeSpentFormatted || `${testDetails.session?.timeSpentMinutes || 0} min`
            };
            results.push(testResult);
          }
        } catch (error: any) {
          console.error(`Erreur lors du chargement du test ${test.id}:`, error);
          failedTestIds.add(test.id);
          
          // Vérifier si c'est une erreur "Test not found" déguisée en 500
          if (error.response?.status === 500) {
            const errorData = error.response?.data;
            if (errorData?.message?.includes('Test not found') || 
                errorData?.error?.includes('Test not found') ||
                error.message?.includes('Test not found')) {
              console.warn(`Le test ${test.id} n'existe pas (Test not found) - ignoré dans la liste`);
            } else {
              console.warn(`Le test ${test.id} n'est pas disponible (erreur 500) - ignoré dans la liste`);
            }
          } else if (error.response?.status === 404) {
            console.warn(`Le test ${test.id} n'existe pas (erreur 404) - ignoré dans la liste`);
          } else {
            console.warn(`Erreur inattendue pour le test ${test.id}:`, error.message);
          }
          // Ne pas ajouter ce test à la liste des résultats
          continue;
        }
      }
      
    } catch (error: any) {
      console.error('Erreur lors de la récupération de la liste des tests:', error);
      console.error('Aucun fallback utilisé - uniquement les vrais tests de la base de données');
      
      setTests([]); // Tableau vide si erreur
    } finally {
      setIsLoading(false);
    }

    console.log(`Résultats finaux: ${results.length} tests valides trouvés`);
    return results;
  };

  const transformTestData = (data: any): TestResult[] => {
    if (!data) return [];
    
    if (Array.isArray(data)) {
      return data.map(item => transformSingleTest(item));
    }
    
    if (data.tests || data.data || data.content) {
      const testArray = data.tests || data.data || data.content;
      return Array.isArray(testArray) ? testArray.map(transformSingleTest) : [];
    }
    
    return [transformSingleTest(data)];
  };

  const transformSingleTest = (item: any): TestResult => {
    return {
      id: item.id || item.testId || 0,
      candidate: item.candidate || item.user || {
        id: 0,
        firstName: item.candidate?.firstName || item.user?.firstName || 'Candidat',
        lastName: item.candidate?.lastName || item.user?.lastName || 'Inconnu',
        email: item.candidate?.email || item.user?.email || 'unknown@example.com'
      },
      internshipPosition: item.internshipPosition || item.position || {
        id: 0,
        title: item.internshipPosition?.title || item.position?.title || 'Poste non spécifié',
        company: item.internshipPosition?.company || item.position?.company || 'Entreprise'
      },
      status: item.status || 'SUBMITTED',
      createdAt: item.createdAt || item.created_at || new Date().toISOString(),
      submittedAt: item.submittedAt || item.submitted_at,
      timeLimitMinutes: item.timeLimitMinutes || item.time_limit_minutes || 24,
      finalScore: item.finalScore || item.final_score,
      testScore: item.testScore || item.test_score,
      timeSpentMinutes: item.timeSpentMinutes || item.time_spent_minutes
    };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return <Badge className="bg-green-100 text-green-800">Soumis</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-blue-100 text-blue-800">En cours</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      case 'EXPIRED':
        return <Badge className="bg-red-100 text-red-800">Expiré</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Inconnu</Badge>;
    }
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Chargement des résultats...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur de chargement</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={loadTests}>Réessayer</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Résultats des tests</h1>
          <p className="text-gray-600 mt-1">
            {tests.length} test{tests.length > 1 ? 's' : ''} trouvé{tests.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/manager/dashboard">
              Retour au dashboard
            </Link>
          </Button>
        </div>
      </div>

      {tests.length === 0 ? (
        <div className="text-center py-12">
          <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun résultat trouvé</h3>
          <p className="text-gray-600">Aucun candidat n'a encore passé de test.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map((test) => (
            <Card 
              key={test.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/manager/test-results/${test.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  {getStatusBadge(test.status)}
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Candidat */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {test.candidate.firstName} {test.candidate.lastName}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">{test.candidate.email}</p>
                    </div>
                  </div>

                  {/* Poste */}
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 truncate">{test.internshipPosition.title}</span>
                  </div>

                  {/* Score */}
                  {test.finalScore !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Score</span>
                      <span className={`font-bold ${getScoreColor(test.finalScore)}`}>
                        {test.finalScore}%
                      </span>
                    </div>
                  )}

                  {/* Temps */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{test.timeSpentFormatted || `${test.timeSpentMinutes || 'N/A'} min`}</span>
                    </div>
                    <span className="text-gray-500">
                      / {test.timeLimitMinutes} min
                    </span>
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {test.submittedAt ? formatDate(test.submittedAt) : formatDate(test.createdAt)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TestResultsListPage;
