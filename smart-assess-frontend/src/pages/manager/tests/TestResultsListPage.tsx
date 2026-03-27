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
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: testsData = [], isLoading: testsLoading, error: testsError, refetch: refetchTests } = useTests();
  const { data: candidatures = [] } = useCandidatures();
  const { data: positions = [] } = usePositions();

  const tests = Array.isArray(testsData)
    ? testsData
    : testsData && typeof testsData === 'object' && 'tests' in testsData
    ? (testsData as any).tests
    : [];

  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renderKey, setRenderKey] = useState(0);

  useEffect(() => {
    if (tests.length > 0) {
      loadTestsWithResults();
    }
  }, [tests, refreshKey]);

  const loadTestsWithResults = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const results: TestResult[] = [];

      const completedTests = tests.filter(
        (test) => test.status === 'COMPLETED' || test.status === 'SUBMITTED'
      );

      for (const test of completedTests) {
        try {
          const response = await apiClient.get(`/tests/${test.id}/review`);
          const reviewData = response.data;

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
            status: reviewData.status || 'SUBMITTED',
            createdAt: reviewData.createdAt || test.createdAt || new Date().toISOString(),
            submittedAt: reviewData.session?.submittedAt,
            timeLimitMinutes: reviewData.timeLimitMinutes || test.timeLimitMinutes || 60,
            finalScore: reviewData.scores?.finalScore,
            testScore: reviewData.scores?.totalScore,
            timeSpentMinutes: reviewData.session?.timeSpentMinutes,
            timeSpentSeconds: reviewData.session?.timeSpentSeconds,
            timeSpentFormatted: reviewData.session?.timeSpentMinutes
              ? `${reviewData.session.timeSpentMinutes} min`
              : 'N/A',
            session: reviewData.session
          };

          results.push(testResult);
        } catch {
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
            status: test.status || 'SUBMITTED',
            createdAt: test.createdAt || new Date().toISOString(),
            submittedAt: test.session?.submittedAt,
            timeLimitMinutes: test.timeLimitMinutes || 60,
            finalScore: test.score,
            testScore: test.score,
            timeSpentMinutes: test.session?.timeSpentMinutes,
            timeSpentSeconds: test.session?.timeSpentSeconds,
            timeSpentFormatted: test.session?.timeSpentMinutes
              ? `${test.session.timeSpentMinutes} min`
              : 'N/A',
            session: test.session
          };

          results.push(fallbackResult);
          failedTestIds.add(test.id);
        }
      }

      setTestResults(results);
      setRenderKey((prev) => prev + 1);
    } catch {
      setError('Erreur lors du chargement des résultats');
      setTestResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (testsLoading || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-4 text-slate-600">Chargement des résultats...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-full max-w-2xl mx-auto border shadow-sm rounded-2xl">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Erreur de chargement</h2>
            <p className="text-slate-600">{error}</p>
            <Button onClick={() => navigate('/manager/dashboard')} className="mt-4">
              Retour au dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasCompletedTests = testResults.length > 0;

  if (!hasCompletedTests && !isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Aucun résultat trouvé</h2>
          <p className="text-slate-600">Aucun test complété trouvé.</p>
          <Button onClick={() => navigate('/manager/dashboard')} className="mt-4">
            Retour au dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900">Résultats des Tests</h1>

          <div className="flex gap-3">
            <Button
              onClick={() => {
                refetchTests();
                setRefreshKey((prev) => prev + 1);
              }}
              variant="outline"
              className="rounded-xl"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Actualiser
            </Button>

            <Button
              onClick={() => navigate('/manager/dashboard')}
              className="rounded-xl"
            >
              <Briefcase className="h-4 w-4 mr-2" />
              Retour Dashboard
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" key={renderKey}>
          {testResults.map((test) => {
            const position = test.internshipPosition || {
              title: 'Poste non spécifié',
              company: 'Entreprise'
            };

            return (
              <Card
                key={`${test.id}-${test.finalScore || 'na'}-${renderKey}`}
                className="border border-slate-200 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 bg-white"
              >
                <CardHeader className="pb-4">
                  <CardTitle className="flex justify-between items-start">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        {position.title || 'Poste non spécifié'}
                      </h2>
                      <p className="text-sm text-slate-500 mt-1">{position.company}</p>
                    </div>

                    <Badge
                      className={
                        test.status === 'COMPLETED'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : test.status === 'SUBMITTED'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-slate-100 text-slate-700'
                      }
                    >
                      {test.status === 'COMPLETED'
                        ? 'Terminé'
                        : test.status === 'SUBMITTED'
                        ? 'Soumis'
                        : 'Inconnu'}
                    </Badge>
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-5">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="font-medium text-slate-900">
                        {test.candidate?.firstName} {test.candidate?.lastName}
                      </p>
                      <p className="text-sm text-slate-500">{test.candidate?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <div className="text-sm text-slate-500">
                      <p>Créé : {new Date(test.createdAt || '').toLocaleDateString()}</p>
                      <p>
                        Soumis :{' '}
                        {test.submittedAt
                          ? new Date(test.submittedAt).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                    <div>
                      <p className="text-sm text-slate-500">Score</p>
                      <p className="text-3xl font-bold text-slate-900">
                        {test.finalScore !== null && test.finalScore !== undefined
                          ? `${Math.round(test.finalScore)}%`
                          : '0%'}
                      </p>
                    </div>

                    <Button
                      onClick={() => navigate(`/manager/test-results/${test.id}`)}
                      className="rounded-xl"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Voir
                    </Button>
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