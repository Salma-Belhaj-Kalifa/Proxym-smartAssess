import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Users, FileText, Plus, AlertCircle, Eye, Clock, TrendingUp, CheckCircle, MoreHorizontal, Award, ChevronLeft, ChevronRight, Building, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { positionService, candidateService, candidatureService, testService } from '@/services/apiService';
import { useAuth } from '@/hooks/useApiHooks';

const DashboardPage = () => {
  const { user } = useAuth();
  const [positions, setPositions] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [candidatures, setCandidatures] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [recentTests, setRecentTests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // États de pagination pour Tests récents
  const [testsCurrentPage, setTestsCurrentPage] = useState(1);
  const testsPerPage = 10;
  
  // États de pagination pour Activités récentes
  const [activitiesCurrentPage, setActivitiesCurrentPage] = useState(1);
  const activitiesPerPage = 10;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Charger les données de base qui fonctionnent
      const [positionsData, candidatesData] = await Promise.all([
        positionService.getAll(),
        candidateService.getAll()
      ]);
      setPositions(positionsData);
      setCandidates(candidatesData);
      
      // Créer une map des candidats pour un accès rapide
      const candidateMap = new Map(candidatesData.map(c => [c.id, c]));
      const positionMap = new Map(positionsData.map(p => [p.id, p]));
      
      // Charger les candidatures individuellement pour chaque candidat
      const allCandidatures = [];
      for (const candidate of candidatesData) {
        try {
          const candidateCandidatures = await candidatureService.getByCandidate(candidate.id);
          
          // Joindre les données du candidat et du poste avec chaque candidature
          const enrichedCandidatures = candidateCandidatures.map(candidature => ({
            ...candidature,
            candidate: candidateMap.get(candidature.candidateId) || {
              id: candidature.candidateId,
              firstName: 'Candidat',
              lastName: `#${candidature.candidateId}`,
              email: 'email@inconnu'
            },
            position: positionMap.get(candidature.internshipPositionId) || {
              id: candidature.internshipPositionId,
              title: `Poste #${candidature.internshipPositionId}`
            }
          }));
          
          allCandidatures.push(...enrichedCandidatures);
        } catch (error) {
          // Ignorer les erreurs pour les candidats sans candidatures
        }
      }
      setCandidatures(allCandidatures);
      
      // Charger les tests avec les données des candidats
      const probableTestIds = [38]; // Uniquement les tests qui existent vraiment
      
      const validTests = [];
      
      for (const testId of probableTestIds) {
        try {
          const testDetails = await testService.getTestForReview(testId);
          
          // Débogage pour voir la structure exacte des données
          console.log(`Test ${testId} details:`, {
            candidateId: testDetails.candidateId,
            internshipPositionId: testDetails.internshipPositionId,
            allKeys: Object.keys(testDetails),
            testDetails
          });
          
          // Gérer les IDs undefined avec fallback sur l'ID du test
          const actualCandidateId = testDetails.candidateId || testDetails.candidate?.id || testId;
          const actualPositionId = testDetails.internshipPositionId || 
                                testDetails.position?.id || 
                                testDetails.positionId ||
                                testId;
          
          // Joindre les données du candidat avec le test
          const enrichedTest = {
            id: testId,
            ...testDetails,
            candidate: candidateMap.get(actualCandidateId) || {
              id: actualCandidateId,
              firstName: 'Candidat',
              lastName: `#${actualCandidateId}`,
              email: 'email@inconnu'
            },
            // Ajouter les données du poste si disponible
            internshipPosition: positionMap.get(actualPositionId) || {
              id: actualPositionId,
              title: `Poste #${actualPositionId}`
            }
          };
          
          console.log(`Test ${testId} enriched:`, enrichedTest);
          
          validTests.push(enrichedTest);
        } catch (error) {
          if (error.response?.status !== 500) {
            console.log(`Test ${testId} non disponible:`, error.message);
          }
        }
      }
      
      setTests(validTests);
      setRecentTests(validTests);
      
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalPositions = positions.length;
  const activePositions = positions.filter(p => p.isActive || p.status === 'ACTIVE').length;
  const inactivePositions = totalPositions - activePositions;
  const totalCandidatures = candidatures.length;
  const pendingCandidatures = candidatures.filter(c => c.status === 'PENDING').length;
  const completedTests = tests.filter(t => t.status === 'SUBMITTED').length;
  const inProgressTests = tests.filter(t => t.status === 'IN_PROGRESS').length;

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
      sub: `${inProgressTests} en cours`, 
      icon: FileText, 
      color: "text-success" 
    },
    { 
      label: "Tests en cours", 
      value: inProgressTests, 
      sub: `${completedTests} complétés`, 
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

  // Activités réelles depuis les APIs
  const activities = [
    // Tests récents
    ...(recentTests.slice(-3).map(test => {
      let score = 'N/A';
      if (test.finalScore) score = test.finalScore;
      else if (test.score) score = test.score;
      else if (test.evaluationResult?.finalScore) score = test.evaluationResult.finalScore;
      
      const scoreText = score !== 'N/A' ? ` • Score: ${score}%` : '';
      const candidateName = test.candidate?.firstName && test.candidate?.lastName 
        ? `${test.candidate.firstName} ${test.candidate.lastName}` 
        : `Candidat #${test.candidateId || 'Inconnu'}`;
      
      return {
        text: <>Test <strong>{candidateName}</strong> soumis{scoreText}</>,
        time: `Il y a ${Math.floor((Date.now() - new Date(test.createdAt).getTime()) / (1000 * 60 * 60))}h`,
        type: 'test'
      };
    }) || []),
    // Nouveaux candidats
    ...(candidates.slice(-3).map(candidate => {
      const candidateName = candidate.firstName && candidate.lastName 
        ? `${candidate.firstName} ${candidate.lastName}` 
        : `Candidat #${candidate.id || 'Inconnu'}`;
      const email = candidate.email ? ` (${candidate.email})` : '';
      
      return {
        text: <>Nouveau candidat <strong>{candidateName}</strong>{email} inscrit</>,
        time: `Il y a ${Math.floor((Date.now() - new Date(candidate.createdAt).getTime()) / (1000 * 60 * 60))}h`,
        type: 'candidate'
      };
    }) || []),
    // Candidatures en attente
    ...(candidatures.slice(-3).filter(c => c.status === 'PENDING').map(candidature => {
      const candidatureDate = candidature.createdAt || candidature.appliedAt;
      const timeAgo = candidatureDate ? 
        `Il y a ${Math.floor((Date.now() - new Date(candidatureDate).getTime()) / (1000 * 60 * 60))}h` :
        'Date inconnue';
      
      const candidateName = candidature.candidate?.firstName && candidature.candidate?.lastName 
        ? `${candidature.candidate.firstName} ${candidature.candidate.lastName}` 
        : `Candidat #${candidature.candidateId || 'Inconnu'}`;
      
      const positionName = candidature.position?.title 
        ? ` pour ${candidature.position.title}` 
        : candidature.internshipPositionId 
          ? ` pour Poste #${candidature.internshipPositionId}` 
          : '';
      
      return {
        text: <>Candidature de <strong>{candidateName}</strong>{positionName} en attente de review</>,
        time: timeAgo,
        type: 'candidature'
      };
    }) || []),
    // Nouveaux postes
    ...(positions.slice(-1).map(position => {
      const positionTitle = position.title || `Poste #${position.id || 'Inconnu'}`;
      const createdBy = position.createdByEmail || `Manager #${position.createdBy || 'Inconnu'}`;
      
      return {
        text: <>Nouveau poste <strong>{positionTitle}</strong> publié par {createdBy}</>,
        time: `Hier, ${new Date(position.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
        type: 'position'
      };
    }) || [])
  ].sort((a, b) => {
    const timeA = parseInt(a.time.match(/\d+/)?.[0] || '0');
    const timeB = parseInt(b.time.match(/\d+/)?.[0] || '0');
    return timeA - timeB;
  }).slice(0, 6);

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
                                       (test.internshipPosition?.id && !isNaN(test.internshipPosition.id))
                                         ? `Poste #${test.internshipPosition.id}`
                                         : (test.internshipPositionId && !isNaN(test.internshipPositionId))
                                           ? `Poste #${test.internshipPositionId}`
                                           : (test.positionId && !isNaN(test.positionId))
                                             ? `Poste #${test.positionId}`
                                             : 'Poste non spécifié';
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {candidateName}
                            </span>
                            <Badge variant={test.status === 'SUBMITTED' ? 'default' : 'secondary'}>
                              {test.status === 'SUBMITTED' ? 'Soumis' : 'En cours'}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-2">
                            {positionTitle}{scoreText}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(test.createdAt).toLocaleDateString('fr-FR')}
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
