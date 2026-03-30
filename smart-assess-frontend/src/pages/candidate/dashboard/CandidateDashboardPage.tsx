import { Link } from 'react-router-dom';
import { User, Briefcase, FileText, Clock, TrendingUp, Calendar, CheckCircle, AlertCircle, Loader2, Building, MapPin, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCurrentUserSafe } from '@/features/auth/authQueries';
import { useCandidaturesByCandidate } from '@/features/candidatures/candidaturesQueries';
import { usePositions } from '@/features/positions/positionsQueries';
import { candidaturesService } from '@/features/candidatures/candidaturesService';
import { useState, useEffect, useMemo } from 'react';

export default function CandidateDashboardPage() {
  const { data: user } = useCurrentUserSafe();
  const { data: candidatures = [], isLoading: isLoadingCandidatures, error: candidaturesError } = useCandidaturesByCandidate(user?.id || 0);
  const { data: positions = [], isLoading: isLoadingPositions } = usePositions();
  const [detailedCandidatures, setDetailedCandidatures] = useState<any[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  
  // Récupérer les détails complets de chaque candidature
  useEffect(() => {
    if (candidatures.length > 0) {
      setIsLoadingDetails(true);
      Promise.all(
        candidatures.map(async (c) => {
          try {
            const details = await candidaturesService.getById(c.id);
            return details;
          } catch (error) {
            console.warn(`Erreur lors de la récupération des détails de la candidature ${c.id}:`, error);
            return c; // Retourner la candidature originale en cas d'erreur
          }
        })
      ).then((detailed) => {
        setDetailedCandidatures(detailed);
        setIsLoadingDetails(false);
      });
    }
  }, [candidatures]);
  
  const isLoading = isLoadingCandidatures || isLoadingPositions || isLoadingDetails;
  const error = candidaturesError;

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'En cours';
      case 'ACCEPTED': return 'Acceptée';
      case 'REJECTED': return 'Rejetée';
      default: return status;
    }
  };

  // Calculer les statistiques à partir des données
  // Regrouper les candidatures par candidat (une candidature = plusieurs postes)
  const candidaturesByCandidate = useMemo(() => {
    const grouped: Record<number, any> = {};
    
    detailedCandidatures.forEach(c => {
      const candidateId = c.candidateId;
      
      if (!grouped[candidateId]) {
        // Initialiser la candidature du candidat
        grouped[candidateId] = {
          id: c.id,
          candidateId: c.candidateId,
          candidateFirstName: c.candidateFirstName,
          candidateLastName: c.candidateLastName,
          candidateEmail: c.candidateEmail,
          status: c.status,
          appliedAt: c.appliedAt,
          updatedAt: c.updatedAt,
          // Collecter tous les postes de cette candidature
          allPositions: [],
          // Conserver la candidature originale
          candidature: c
        };
      }
      
      // Ajouter les postes de cette candidature
      if (c.positions && Array.isArray(c.positions) && c.positions.length > 0) {
        // ✅ Utiliser les postes de la nouvelle structure backend
        c.positions.forEach((pos: any) => {
          if (pos.title && !grouped[candidateId].allPositions.find((p: any) => p.title === pos.title)) {
            grouped[candidateId].allPositions.push({
              id: pos.id,
              title: pos.title,
              company: pos.company || c.positionCompany || 'Entreprise',
              appliedAt: c.appliedAt
            });
          }
        });
      } else if (c.internshipPositions && Array.isArray(c.internshipPositions) && c.internshipPositions.length > 0) {
        // Compatibilité avec l'ancienne structure frontend
        c.internshipPositions.forEach((pos: any) => {
          if (pos.title && !grouped[candidateId].allPositions.find((p: any) => p.title === pos.title)) {
            grouped[candidateId].allPositions.push({
              id: pos.id,
              title: pos.title,
              company: pos.company || c.positionCompany || 'Entreprise',
              appliedAt: c.appliedAt
            });
          }
        });
      } else if (c.positionTitle) {
        // Utiliser le poste de l'ancienne structure (compatibilité)
        const positionId = c.internshipPositionId || 0;
        if (!grouped[candidateId].allPositions.find((p: any) => p.id === positionId)) {
          grouped[candidateId].allPositions.push({
            id: positionId,
            title: c.positionTitle,
            company: c.positionCompany || 'Entreprise',
            appliedAt: c.appliedAt
          });
        }
      }
    });
    
    return Object.values(grouped);
  }, [detailedCandidatures]);

  const stats = {
    totalApplications: candidaturesByCandidate.length,
    pendingApplications: candidaturesByCandidate.filter(c => c.status === 'PENDING').length,
    acceptedApplications: candidaturesByCandidate.filter(c => c.status === 'ACCEPTED').length,
    rejectedApplications: candidaturesByCandidate.filter(c => c.status === 'REJECTED').length,
    totalPositions: positions.length,
    recentApplications: candidaturesByCandidate
      .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())
      .slice(0, 5)
      .map(c => ({
        id: c.id,
        candidateId: c.candidateId,
        candidateFirstName: c.candidateFirstName,
        candidateLastName: c.candidateLastName,
        candidateEmail: c.candidateEmail,
        positions: c.allPositions,
        status: getStatusText(c.status),
        appliedDate: c.appliedAt,
        lastUpdate: c.appliedAt,
        // Conserver les informations détaillées pour l'affichage
        candidature: c.candidature
      }))
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Date invalide';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Acceptée': return 'bg-green-100 text-green-800 border-green-200';
      case 'En cours': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Rejetée': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Acceptée': return <CheckCircle className="w-4 h-4" />;
      case 'En cours': return <Clock className="w-4 h-4" />;
      case 'Rejetée': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getTimeSinceApplied = (appliedDate: string) => {
    const now = new Date();
    const applied = new Date(appliedDate);
    const diffTime = Math.abs(now.getTime() - applied.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaine${Math.floor(diffDays / 7) > 1 ? 's' : ''}`;
    return `Il y a ${Math.floor(diffDays / 30)} mois`;
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-600">
            Bienvenue, {user?.firstName || 'Candidat'} ! Voici votre résumé.
          </p>
        </div>
        <div className="flex gap-4">
          <Link to="/candidat/postes">
            <Button className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Voir les offres
            </Button>
          </Link>
     
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Chargement des données...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span>Erreur lors du chargement des données</span>
          </div>
        </div>
      )}

      {/* Dashboard Content */}
      {!isLoading && !error && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total candidatures</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalApplications}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalApplications > 0 ? 'Candidatures soumises' : 'Aucune candidature'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">En cours</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.pendingApplications}</div>
                <p className="text-xs text-muted-foreground">
                  En attente de réponse
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Acceptées</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.acceptedApplications}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.acceptedApplications > 0 ? 'Félicitations !' : 'En attente'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejetées</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.rejectedApplications}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.rejectedApplications > 0 ? 'Continuez vos efforts' : 'Pas de rejet'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Applications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Candidatures récentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recentApplications.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentApplications.map((application) => (
                    <Card key={application.id} className="border-0 shadow-sm hover:shadow-lg transition-all duration-200 bg-gradient-to-r from-white to-gray-50">
                      <CardContent className="p-0">
                        <div className="flex">
                          {/* Bande latérale de statut */}
                          <div className={`w-1 ${getStatusColor(application.status).split(' ')[0]}`}></div>
                          
                          {/* Contenu principal */}
                          <div className="flex-1 p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                {/* En-tête avec icône et titre */}
                                <div className="flex items-center gap-4 mb-4">
                                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                    application.status === 'Acceptée' ? 'bg-green-100' :
                                    application.status === 'En cours' ? 'bg-yellow-100' :
                                    application.status === 'Rejetée' ? 'bg-red-100' : 'bg-gray-100'
                                  }`}>
                                    <Briefcase className={`w-6 h-6 ${
                                      application.status === 'Acceptée' ? 'text-green-600' :
                                      application.status === 'En cours' ? 'text-yellow-600' :
                                      application.status === 'Rejetée' ? 'text-red-600' : 'text-gray-600'
                                    }`} />
                                  </div>
                                  <div className="flex-1">
                                    {/* Afficher tous les postes de la candidature */}
                                    {application.positions && application.positions.length > 0 ? (
                                      <div className="space-y-2">
                                        {application.positions.map((position: any, index: number) => (
                                          <div key={position.id || index} className="flex items-center justify-between">
                                            <div>
                                              <h4 className="font-bold text-gray-900 text-lg">{position.title}</h4>
                                              {position.company && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                  <Building className="w-4 h-4" />
                                                  <span>{position.company}</span>
                                                </div>
                                              )}
                                            </div>
                                            {index === 0 && (
                                              <Badge className={`${getStatusColor(application.status)} flex items-center gap-2 px-3 py-1.5 text-sm font-medium`}>
                                                {getStatusIcon(application.status)}
                                                {application.status}
                                              </Badge>
                                            )}
                                          </div>
                                        ))}
                                        {/* Afficher le nombre de postes si > 1 */}
                                        {application.positions.length > 1 && (
                                          <div className="mt-2 text-xs text-gray-500 font-medium">
                                            {application.positions.length} postes dans cette candidature
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div>
                                        <h4 className="font-bold text-gray-900 text-lg mb-1">Poste non spécifié</h4>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                          <Building className="w-4 h-4" />
                                          <span>Entreprise</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Informations temporelles */}
                                <div className="flex items-center gap-6 text-sm">
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <Calendar className="w-4 h-4" />
                                    <span>{formatDate(application.appliedDate)}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <Clock className="w-4 h-4" />
                                    <span>{getTimeSinceApplied(application.appliedDate)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune candidature</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Vous n'avez pas encore postulé à des offres. Commencez à explorer les opportunités disponibles !
                  </p>
                  <Link to="/candidat/postes">
                    <Button className="flex items-center gap-2 mx-auto">
                      <Briefcase className="w-4 h-4" />
                      Explorer les offres
                    </Button>
                  </Link>
                </div>
              )}
              
              {stats.recentApplications.length > 0 && (
                <div className="mt-6 pt-4 border-t">
                  <Link to="/candidat/candidatures">
                    <Button variant="outline" className="flex items-center gap-2 mx-auto w-full max-w-xs">
                      <FileText className="w-4 h-4" />
                      Voir toutes les candidatures
                      <span className="ml-auto bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                        {stats.totalApplications}
                      </span>
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
