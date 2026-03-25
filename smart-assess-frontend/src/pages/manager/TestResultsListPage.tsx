import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useTests } from '@/features/tests/testsQueries';
import { AlertCircle, Eye, User, Briefcase, Clock, Calendar } from 'lucide-react';

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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des résultats...</p>
        </div>
      </div>
    );
  }

  if (testsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-2xl mx-auto m-4">
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur de chargement</h2>
              <p className="text-gray-600">{testsError.message || 'Erreur lors du chargement des tests'}</p>
              <Button onClick={() => navigate('/manager/dashboard')} className="mt-4">
                Retour au dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!testResults.length) {
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
          <Button onClick={() => navigate('/manager/dashboard')} className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Retour au Dashboard
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testResults.map((result) => (
            <Card key={result.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate">{result.internshipPosition.title}</span>
                  <Badge className={
                    result.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    result.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }>
                    {result.status === 'COMPLETED' ? 'Terminé' :
                     result.status === 'SUBMITTED' ? 'Soumis' : 'Inconnu'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium">{result.candidate.firstName} {result.candidate.lastName}</p>
                      <p className="text-sm text-gray-600">{result.candidate.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <Briefcase className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium">{result.internshipPosition.title}</p>
                      <p className="text-sm text-gray-600">{result.internshipPosition.company}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">
                        Créé: {new Date(result.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        Soumis: {new Date(result.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">
                        Temps: {result.timeSpentFormatted || 'Non spécifié'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Limite: {result.timeLimitMinutes} minutes
                      </p>
                    </div>
                  </div>

                  {result.finalScore !== undefined && (
                    <div className="pt-4 border-t">
                      <p className="text-lg font-semibold">Score: {result.finalScore}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4">
                    <Button
                      onClick={() => navigate(`/manager/tests/${result.id}/review`)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Voir les détails
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestResultsListPage;
