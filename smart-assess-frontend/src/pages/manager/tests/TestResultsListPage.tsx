import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useTests, useGetTestResults } from '@/features/tests/testsQueries';
import { useCandidatures, usePositions } from '@/features';
import { AlertCircle, Eye, User, Briefcase, Clock, Calendar, Sparkles, Loader2,Brain } from 'lucide-react';
import apiClient from '@/lib/api';

/** Timestamp pour tri : soumission si dispo, sinon création */
const getResultRecencyTime = (t: {
  submittedAt?: string;
  session?: { submittedAt?: string };
  createdAt?: string;
}): number => {
  const raw = t.submittedAt || t.session?.submittedAt || t.createdAt;
  if (!raw) return 0;
  const ms = new Date(raw).getTime();
  return Number.isNaN(ms) ? 0 : ms;
};

interface TestResult {
  id: number;
  candidate: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  // ✅ Nouvelle structure: plus de internshipPosition direct
  // Les postes sont récupérés via les candidatures du candidat
  status: 'SUBMITTED' | 'IN_PROGRESS' | 'PENDING' | 'EXPIRED' | 'COMPLETED';
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
  const [reports, setReports] = useState<any[]>([]);

  // Charger les rapports IA
  useEffect(() => {
    const loadReports = async () => {
      try {
        const response = await apiClient.get('/evaluation-reports');
        setReports(response.data || []);
      } catch (error) {
        console.error('Error loading reports:', error);
        setReports([]);
      }
    };
    
    loadReports();
  }, []);

  const tests = Array.isArray(testsData)
    ? testsData
    : testsData && typeof testsData === 'object' && 'tests' in testsData
    ? (testsData as any).tests
    : [];

  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renderKey, setRenderKey] = useState(0);
  const [generatingReports, setGeneratingReports] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (tests.length > 0) {
      // Utiliser directement les données de useTests() - ZERO appels API supplémentaires
      const completedTests = tests.filter(
        (test) => test.status === 'COMPLETED' || test.status === 'SUBMITTED'
      );

      // Trier par récence
      const sortedTests = completedTests.sort((a, b) => getResultRecencyTime(b) - getResultRecencyTime(a));
      
      setTestResults(sortedTests);
      setRenderKey((prev) => prev + 1);
    }
  }, [tests, refreshKey]);

  const generateReport = async (candidatureId: number) => {
    try {
      setGeneratingReports(prev => new Set(prev).add(candidatureId));
      
      const response = await apiClient.post(`/v1/evaluation/generate-report/${candidatureId}`);
      
      if (response.data) {
        toast.success('Rapport IA généré avec succès!');
        // Refresh data to show the updated AI score
        refetchTests();
        setRefreshKey((prev) => prev + 1);
      }
    } catch (error: any) {
      console.error('Error generating report:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la génération du rapport');
    } finally {
      setGeneratingReports(prev => {
        const newSet = new Set(prev);
        newSet.delete(candidatureId);
        return newSet;
      });
    }
  };

  const viewReport = (reportId: number) => {
    navigate(`/manager/reports/${reportId}`);
  };

  // Obtenir l'ID de la candidature pour ce test
  const getCandidatureId = (test: TestResult) => {
    if (!test.candidate?.id) return null;
    
    // Chercher les candidatures de ce candidat
    const candidateCandidatures = candidatures.filter(c => c.candidateId === test.candidate.id);
    
    return candidateCandidatures.length > 0 ? candidateCandidatures[0].id : null;
  };

  // Obtenir l'ID du rapport IA pour ce test en utilisant les données existantes
  const getReportId = (test: TestResult, allReports: any[] = []) => {
    if (!test.candidate?.id) return null;
    
    // Chercher les candidatures de ce candidat
    const candidateCandidatures = candidatures.filter(c => c.candidateId === test.candidate.id);
    
    if (candidateCandidatures.length === 0) return null;
    
    // Chercher un rapport qui correspond à une des candidatures du candidat
    const report = allReports.find(report => 
      candidateCandidatures.some(c => c.id === report.candidatureId)
    );
    
    return report ? report.id : null;
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

            
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" key={renderKey}>
          {testResults.map((test) => {
            // ✅ LOGIQUE CORRECTE: récupérer TOUS les postes du candidat comme dans GenerateTestPage
            const candidateCandidatures = candidatures.filter(c => c.candidateId === test.candidate.id);
            const allPositions: any[] = [];
            
            candidateCandidatures.forEach(candidature => {
              // Vérifie positions (nouvelle structure)
              if (candidature.positions && Array.isArray(candidature.positions) && candidature.positions.length > 0) {
                candidature.positions.forEach((position: any) => {
                  allPositions.push({
                    title: position.title,
                    company: position.company,
                    appliedAt: candidature.appliedAt,
                    candidatureId: candidature.id
                  });
                });
              }
              // Vérifie internshipPositions (nouvelle structure)
              else if (candidature.internshipPositions && Array.isArray(candidature.internshipPositions) && candidature.internshipPositions.length > 0) {
                candidature.internshipPositions.forEach((position: any) => {
                  allPositions.push({
                    title: position.title,
                    company: position.company,
                    appliedAt: candidature.appliedAt,
                    candidatureId: candidature.id
                  });
                });
              }
              // Fallback ancienne structure
              else if (candidature.positionTitle && candidature.positionTitle.trim() !== '') {
                allPositions.push({
                  title: candidature.positionTitle.trim(),
                  company: candidature.positionCompany,
                  appliedAt: candidature.appliedAt,
                  candidatureId: candidature.id
                });
              }
            });
            
            // Afficher TOUS les postes du candidat
            const displayPositions = allPositions.length > 0 ? allPositions : [{
              title: 'Poste non spécifié',
              company: 'Entreprise'
            }];

            return (
              <div
                key={`${test.id}-${renderKey}`}
                className="bg-white border border-gray-100 rounded-xl overflow-hidden flex flex-col hover:border-gray-200 transition-colors duration-150"
              >
                {/* Header */}
                <div className="px-4 pt-4 pb-0">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-800 text-xs font-medium flex-shrink-0">
                        {test.candidate?.firstName?.[0]}{test.candidate?.lastName?.[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {test.candidate?.firstName} {test.candidate?.lastName}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{test.candidate?.email}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${
                      test.status === 'COMPLETED'
                        ? 'bg-green-50 text-green-800'
                        : 'bg-blue-50 text-blue-800'
                    }`}>
                      {test.status === 'COMPLETED' ? 'Terminé' : 'Soumis'}
                    </span>
                  </div>
                </div>

                <div className="h-px bg-gray-100 mx-4" />

                {/* Body */}
                <div className="px-4 py-3 flex-1 flex flex-col gap-3">
                  {/* Positions */}
                  <div className="flex flex-col gap-1.5">
                    {displayPositions.map((pos, i) => (
                      <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                        <Briefcase className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">{pos.title}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Dates */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Calendar className="w-3 h-3" />
                      Créé : {new Date(test.createdAt).toLocaleDateString('fr-FR')}
                    </div>
                  </div>

                  {/* Score + Actions */}
                  <div className="flex items-end justify-between pt-2 border-t border-gray-100 mt-auto">
        
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/manager/test-results/${test.id}`)}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Test
                      </button>
                      
                      {/* AI Report Actions */}
                      {(() => {
                        const reportId = getReportId(test, reports);
                        if (reportId) {
                          return (
                            <button
                              onClick={() => viewReport(reportId)}
                              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Voir rapport
                            </button>
                          );
                        }
                        return null;
                      })()}
                      
                      {/* Generate Report Button */}
                      {(() => {
                        const reportId = getReportId(test, reports);
                        if (!reportId) {
                          const candidatureId = getCandidatureId(test);
                          if (candidatureId) {
                            return (
                              <button
                                onClick={() => generateReport(candidatureId)}
                                disabled={generatingReports.has(candidatureId)}
                                className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {generatingReports.has(candidatureId) ? (
                                  <>
                                    <div className="w-3.5 h-3.5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                                    Génération...
                                  </>
                                ) : (
                                  <>
                                    <Brain className="w-3.5 h-3.5" />
                                    Générer rapport
                                  </>
                                )}
                              </button>
                            );
                          }
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TestResultsListPage;