import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Users, FileText, Plus, AlertCircle, Eye, Clock, TrendingUp, CheckCircle, MoreHorizontal, Award, ChevronLeft, ChevronRight, Building, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePositions } from '@/features/positions/positionsQueries';
import { useCandidates } from '@/features/candidates/candidatesQueries';
import { useCandidatures } from '@/features/candidatures/candidaturesQueries';
import { useTests } from '@/features/tests/testsQueries';
import { useCurrentUserSafe } from '@/features/auth/authQueries';
import { getStatusLabel, getStatusColor } from '@/utils/statusMappings';

/** Tri tests : soumission si dispo, sinon création */
const getTestRecencyMs = (test: {
  submittedAt?: string;
  createdAt?: string;
}): number => {
  const raw = test.submittedAt || test.createdAt;
  if (!raw) return 0;
  const ms = new Date(raw).getTime();
  return Number.isNaN(ms) ? 0 : ms;
};

const formatRelativeActivityTime = (timestampMs: number): string => {
  if (!timestampMs || Number.isNaN(timestampMs)) return '';
  const diff = Date.now() - timestampMs;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days} j`;
  return new Date(timestampMs).toLocaleString('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
};

const DashboardPage = () => {
  const { data: user } = useCurrentUserSafe();
  const { data: positionsData = [], isLoading: positionsLoading } = usePositions();
  const { data: candidatesData = [], isLoading: candidatesLoading } = useCandidates();
  const { data: candidaturesData = [], isLoading: candidaturesLoading } = useCandidatures();
  const { data: testsData = [], isLoading: testsLoading } = useTests();
  
  // Utiliser useMemo pour éviter les boucles infinies
  const positions = useMemo(() => positionsData || [], [positionsData]);
  const candidates = useMemo(() => candidatesData || [], [candidatesData]);
  const candidatures = useMemo(() => candidaturesData || [], [candidaturesData]);
  
  // Tests enrichis (API), puis filtrés sur les candidats encore présents
  const enrichedTestsData = useMemo(() => {
    if (!testsData || testsData.length === 0) {
      return [];
    }

    try {
      const allTests = Array.isArray(testsData)
        ? testsData
        : testsData && typeof testsData === 'object' && 'tests' in testsData
          ? (testsData as { tests: unknown[] }).tests
          : [];

      const validTests = allTests.filter((test: { id?: number }) => test.id);
      const enrichedTests: Record<string, unknown>[] = [];

      for (const test of validTests) {
        try {
          const t = test as Record<string, unknown>;
          const candidate = (t.candidate as Record<string, unknown>) || {
            id: t.candidateId,
            firstName: 'Candidat',
            lastName: 'Inconnu',
            email: 'email@example.com',
          };

          const position = (t.internshipPosition as Record<string, unknown>) || {
            id: t.internshipPositionId || 0,
            title: 'Poste inconnu',
            company: 'SmartAssess',
          };

          enrichedTests.push({
            ...t,
            candidate,
            position,
          });
        } catch (error) {
          console.warn(`Test ${(test as { id?: number }).id} ignoré dans le dashboard:`, error);
        }
      }

      return enrichedTests;
    } catch (error) {
      console.error('Erreur lors du traitement des tests:', error);
      return [];
    }
  }, [testsData]);

  const validCandidateIdSet = useMemo(
    () => new Set(candidates.map((c) => c.id).filter((id) => id != null)),
    [candidates]
  );

  /** Exclut les tests orphelins (candidat supprimé) ; tri du plus récent au plus ancien */
  const testsForDashboard = useMemo(() => {
    const list = enrichedTestsData.filter((test) => {
      const cid =
        (test.candidate as { id?: number } | undefined)?.id ??
        (test as { candidateId?: number }).candidateId;
      if (cid == null || Number.isNaN(Number(cid))) return false;
      if (candidatesLoading) return true;
      return validCandidateIdSet.has(Number(cid));
    });
    return [...list].sort((a, b) => getTestRecencyMs(b as never) - getTestRecencyMs(a as never));
  }, [enrichedTestsData, validCandidateIdSet, candidatesLoading]);
  
  const [isLoading, setIsLoading] = useState(true);
  
  // États de pagination pour Tests récents
  const [testsCurrentPage, setTestsCurrentPage] = useState(1);
  const testsPerPage = 10;
  
  // États de pagination pour Activités récentes
  const [activitiesCurrentPage, setActivitiesCurrentPage] = useState(1);
  const activitiesPerPage = 10;

  useEffect(() => {
    const loading = positionsLoading || candidatesLoading || candidaturesLoading || testsLoading;
    setIsLoading(loading);
  }, [positionsLoading, candidatesLoading, candidaturesLoading, testsLoading]);

  const tests = testsForDashboard;
  const recentTests = testsForDashboard;

  const totalPositions = positions.length;
  const activePositions = positions.filter(p => p.isActive === true || (p as any).status === 'ACTIVE').length;
  const inactivePositions = totalPositions - activePositions;
  const totalCandidatures = candidatures.length;
  const pendingCandidatures = candidatures.filter(c => c.status === 'PENDING').length;

  const completedTests = tests.filter(
    (t) => t.status === 'SUBMITTED' || t.status === 'EVALUATED'
  ).length;
  const inProgressTests = tests.filter((t) =>
    ['DRAFT', 'READY', 'IN_PROGRESS', 'ASSIGNED'].includes(String(t.status))
  ).length;
  const totalTests = tests.length;

  const stats = [
    { 
      label: "Postes actifs", 
      value: activePositions, 
      sub: `${inactivePositions} inactifs`, 
      icon: Briefcase, 
      color: "text-primary" 
    },
    { 
      label: "Total candidatures", 
      value: totalCandidatures, 
      sub: `${pendingCandidatures} en attente`, 
      icon: Users, 
      color: "text-info" 
    },
    { 
      label: "Tests complétés", 
      value: completedTests, 
      sub: `sur ${totalTests} total`, 
      icon: FileText, 
      color: "text-success" 
    },
    { 
      label: "Tests en cours", 
      value: inProgressTests, 
      sub: `${Math.max(0, totalTests - completedTests)} non terminé${totalTests - completedTests !== 1 ? 's' : ''}`, 
      icon: TrendingUp, 
      color: "text-warning" 
    },
  ];

  // Helper function pour les couleurs des stats
  const getStatColor = (color: string) => {
    const colors: Record<string, string> = {
      'text-primary': 'bg-gradient-to-br from-blue-500 to-blue-600',
      'text-info': 'bg-gradient-to-br from-cyan-500 to-cyan-600',
      'text-success': 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      'text-warning': 'bg-gradient-to-br from-amber-500 to-amber-600'
    };
    return colors[color] || 'bg-gradient-to-br from-slate-500 to-slate-600';
  };

  // Activités fusionnées, triées par date réelle (plus récent en premier)
  const activities = useMemo(() => {
    type Act = { at: number; text: React.ReactNode; time: string; type: string };
    const items: Act[] = [];

    recentTests.forEach((test) => {
      if (test.status !== 'SUBMITTED' && test.status !== 'EVALUATED') return;
      const raw = (test as { submittedAt?: string }).submittedAt || test.createdAt;
      if (!raw) return;
      const at = new Date(raw).getTime();
      if (Number.isNaN(at)) return;

      let score: string | number = 'N/A';
      if (test.finalScore != null) score = test.finalScore as number;
      else if ((test as { score?: number }).score != null) score = (test as { score?: number }).score!;
      else if ((test as { evaluationResult?: { finalScore?: number } }).evaluationResult?.finalScore != null) {
        score = (test as { evaluationResult: { finalScore: number } }).evaluationResult.finalScore;
      }
      const scoreText = score !== 'N/A' ? ` • Score : ${score}%` : '';
      const candidateName =
        test.candidate?.firstName && test.candidate?.lastName
          ? `${test.candidate.firstName} ${test.candidate.lastName}`
          : `Candidat #${test.candidate?.id ?? '?'}`;

      items.push({
        at,
        type: 'test',
        time: formatRelativeActivityTime(at),
        text: (
          <>
            Test <strong>{candidateName}</strong> soumis{scoreText}
          </>
        ),
      });
    });

    candidates.forEach((candidate) => {
      const raw = (candidate as { createdAt?: string }).createdAt;
      if (!raw) return;
      const at = new Date(raw).getTime();
      if (Number.isNaN(at)) return;
      const candidateName =
        candidate.firstName && candidate.lastName
          ? `${candidate.firstName} ${candidate.lastName}`
          : `Candidat #${candidate.id}`;
      const email = candidate.email ? ` (${candidate.email})` : '';
      items.push({
        at,
        type: 'candidate',
        time: formatRelativeActivityTime(at),
        text: (
          <>
            Nouveau candidat <strong>{candidateName}</strong>{email} inscrit
          </>
        ),
      });
    });

    candidatures
      .filter((c) => c.status === 'PENDING')
      .forEach((candidature) => {
        const raw =
          (candidature as { createdAt?: string; appliedAt?: string }).createdAt ||
          (candidature as { appliedAt?: string }).appliedAt;
        if (!raw) return;
        const at = new Date(raw).getTime();
        if (Number.isNaN(at)) return;
        const candidateName =
          candidature.candidateFirstName && candidature.candidateLastName
            ? `${candidature.candidateFirstName} ${candidature.candidateLastName}`
            : `Candidat #${candidature.candidateId ?? '?'}`;
        const positionName = candidature.positionTitle
          ? ` pour ${candidature.positionTitle}`
          : candidature.internshipPositionId
            ? ` pour poste #${candidature.internshipPositionId}`
            : '';
        items.push({
          at,
          type: 'candidature',
          time: formatRelativeActivityTime(at),
          text: (
            <>
              Candidature de <strong>{candidateName}</strong>
              {positionName} en attente de review
            </>
          ),
        });
      });

    positions.forEach((position) => {
      const raw = (position as { createdAt?: string }).createdAt;
      if (!raw) return;
      const at = new Date(raw).getTime();
      if (Number.isNaN(at)) return;
      const positionTitle = position.title || `Poste #${position.id}`;
      const createdBy =
        (position as { createdByEmail?: string }).createdByEmail ||
        `Manager #${(position as { createdBy?: number }).createdBy ?? '?'}`;
      items.push({
        at,
        type: 'position',
        time: formatRelativeActivityTime(at),
        text: (
          <>
            Nouveau poste <strong>{positionTitle}</strong> publié par {createdBy}
          </>
        ),
      });
    });

    return items.sort((a, b) => b.at - a.at);
  }, [recentTests, candidates, candidatures, positions]);

  // Variables de pagination calculées
  const testsTotalPages = Math.ceil(recentTests.length / testsPerPage);
  const testsStartIndex = (testsCurrentPage - 1) * testsPerPage;
  const testsEndIndex = testsStartIndex + testsPerPage;
  const paginatedRecentTests = recentTests.slice(testsStartIndex, testsEndIndex);
  
  const activitiesTotalPages = Math.ceil(activities.length / activitiesPerPage);
  const activitiesStartIndex = (activitiesCurrentPage - 1) * activitiesPerPage;
  const activitiesEndIndex = activitiesStartIndex + activitiesPerPage;
  const paginatedActivities = activities.slice(activitiesStartIndex, activitiesEndIndex);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <div className="text-lg text-muted-foreground">Chargement du tableau de bord...</div>
            </div>
          </div>
        ) : (
          <>
            {/* Header amélioré */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 p-8">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
                      <Briefcase className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                        Tableau de bord
                      </h1>
                      <p className="text-muted-foreground text-sm">
                        {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Données en temps réel</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="bg-white/50 backdrop-blur-sm border-slate-200 hover:bg-slate-50" asChild>
                    <Link to="/manager/candidats">
                      <Users className="w-4 h-4 mr-2" />
                      Candidats
                    </Link>
                  </Button>
                  <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25" asChild>
                    <Link to="/manager/postes">
                      <Plus className="w-4 h-4 mr-2" />
                      Nouveau poste
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* Alertes importantes */}
            {pendingCandidatures > 0 && (
              <div className="glass-card p-4 border-l-4 border-yellow-500 bg-yellow-50">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <div>
                    <h3 className="font-semibold text-yellow-800">Candidatures en attente</h3>
                    <p className="text-sm text-yellow-700">
                      Vous avez {pendingCandidatures} candidature{pendingCandidatures > 1 ? 's' : ''} en attente de review
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild className="ml-auto">
                    <Link to="/manager/candidats">Voir</Link>
                  </Button>
                </div>
              </div>
            )}

            {/* Alerte si les données des tests ne sont pas disponibles */}
            {tests.length === 0 && (
              <div className="glass-card p-4 border-l-4 border-blue-500 bg-blue-50">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-blue-800">Aucun test trouvé</h3>
                    <p className="text-sm text-blue-700">
                      Aucun test n'est disponible dans la base de données. Les autres fonctionnalités restent opérationnelles.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <div key={stat.label} className="group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm group-hover:shadow-lg transition-all duration-300"></div>
                  <div className="relative p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${getStatColor(stat.color)}`}>
                        <stat.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <TrendingUp className="w-4 h-4 text-slate-600" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                        {stat.value}
                      </div>
                      <div className="text-sm font-medium text-slate-600">
                        {stat.label}
                      </div>
                      <div className="text-xs text-slate-500">
                        {stat.sub}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tests récents */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Tests récents
                </h2>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/manager/tests-resultats">
                    <Eye className="w-4 h-4 mr-2" />
                    Voir tout
                  </Link>
                </Button>
              </div>
              <div className="space-y-4">
                {paginatedRecentTests.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4">Aucun test récent</p>
                ) : (
                  paginatedRecentTests.map((test, index) => {
                    let score = 'N/A';
                    if (test.finalScore) score = test.finalScore;
                    else if (test.score) score = test.score;
                    else if (test.evaluationResult?.finalScore) score = test.evaluationResult.finalScore;
                    
                    const scoreText = score !== 'N/A' ? ` • Score: ${score}%` : '';
                    
                    // Gérer les données manquantes du candidat avec fallback robuste
                    const candidateName = test.candidate?.firstName && test.candidate?.lastName 
                      ? `${test.candidate.firstName} ${test.candidate.lastName}`
                      : test.candidate?.firstName 
                        ? test.candidate.firstName
                        : test.candidate?.id && !isNaN(test.candidate.id)
                          ? `Candidat #${test.candidate.id}`
                          : test.candidateId && !isNaN(test.candidateId)
                            ? `Candidat #${test.candidateId}`
                            : test.id && !isNaN(test.id)
                              ? `Candidat #${test.id}`
                              : 'Candidat inconnu';
                    
                    // Gérer les données manquantes du poste avec fallback robuste
                    const positionTitle = test.internshipPosition?.title || 
                                       test.position?.title || 
                                       test.positionTitle ||
                                       'Poste non spécifié';
                    
                    return (
                      <div key={`test-${test.id}-${positionTitle}`} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {candidateName}
                            </span>
                            <Badge variant={test.status === 'SUBMITTED' ? 'default' : 'secondary'}>
                              {getStatusLabel(test.status)}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-2">
                            <span className="font-medium">{positionTitle}</span>{scoreText}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {(test as { submittedAt?: string }).submittedAt || test.createdAt
                            ? new Date(
                                (test as { submittedAt?: string }).submittedAt || test.createdAt || ''
                              ).toLocaleDateString('fr-FR')
                            : '—'}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              
              {/* Pagination pour Tests récents */}
              {testsTotalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Page {testsCurrentPage} sur {testsTotalPages} ({recentTests.length} tests)
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTestsCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={testsCurrentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm font-medium px-3">
                      {testsCurrentPage}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTestsCurrentPage(prev => Math.min(prev + 1, testsTotalPages))}
                      disabled={testsCurrentPage === testsTotalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Activités récentes */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Activités récentes
                </h2>
              </div>
              <div className="space-y-4">
                {paginatedActivities.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4">Aucune activité récente</p>
                ) : (
                  paginatedActivities.map((activity, index) => {
                    const getActivityIcon = () => {
                      switch (activity.type) {
                        case 'test':
                          return <FileText className="w-4 h-4 text-blue-500" />;
                        case 'candidate':
                          return <User className="w-4 h-4 text-green-500" />;
                        case 'candidature':
                          return <Briefcase className="w-4 h-4 text-orange-500" />;
                        case 'position':
                          return <Building className="w-4 h-4 text-purple-500" />;
                        default:
                          return <Clock className="w-4 h-4 text-gray-500" />;
                      }
                    };

                    const getActivityBgColor = () => {
                      switch (activity.type) {
                        case 'test':
                          return 'bg-blue-50 border-blue-200';
                        case 'candidate':
                          return 'bg-green-50 border-green-200';
                        case 'candidature':
                          return 'bg-orange-50 border-orange-200';
                        case 'position':
                          return 'bg-purple-50 border-purple-200';
                        default:
                          return 'bg-gray-50 border-gray-200';
                      }
                    };

                    return (
                      <div key={index} className={`flex items-center justify-between p-4 rounded-lg border ${getActivityBgColor()}`}>
                        <div className="flex items-center gap-3 flex-1">
                          {getActivityIcon()}
                          <div className="text-sm">{activity.text}</div>
                        </div>
                        <div className="text-xs text-muted-foreground ml-3 whitespace-nowrap">{activity.time}</div>
                      </div>
                    );
                  })
                )}
              </div>
              
              {/* Pagination pour Activités récentes */}
              {activitiesTotalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Page {activitiesCurrentPage} sur {activitiesTotalPages} ({activities.length} activités)
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActivitiesCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={activitiesCurrentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm font-medium px-3">
                      {activitiesCurrentPage}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActivitiesCurrentPage(prev => Math.min(prev + 1, activitiesTotalPages))}
                      disabled={activitiesCurrentPage === activitiesTotalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
