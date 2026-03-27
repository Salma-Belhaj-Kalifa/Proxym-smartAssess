import { Link } from 'react-router-dom';
import { User, Briefcase, FileText, Clock, TrendingUp, Calendar, CheckCircle, AlertCircle, Loader2, Building, MapPin, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCurrentUserSafe } from '@/features/auth/authQueries';
import { useCandidaturesByCandidate } from '@/features/candidatures/candidaturesQueries';
import { usePositions } from '@/features/positions/positionsQueries';
import { candidaturesService } from '@/features/candidatures/candidaturesService';
import { useState, useEffect } from 'react';

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
  const stats = {
    totalApplications: detailedCandidatures.length,
    pendingApplications: detailedCandidatures.filter(c => c.status === 'PENDING').length,
    acceptedApplications: detailedCandidatures.filter(c => c.status === 'ACCEPTED').length,
    rejectedApplications: detailedCandidatures.filter(c => c.status === 'REJECTED').length,
    totalPositions: positions.length,
    recentApplications: detailedCandidatures
      .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())
      .slice(0, 5)
      .map(c => {
        // Le backend envoie 'internship_position_id' au lieu de 'positionId'
        const possibleIds = [
          c.positionId,
          (c as any).position_id,
          (c as any).PositionId,
          (c as any).jobPositionId,
          (c as any).jobId,
          (c as any).internship_position_id  // ← AJOUT DU NOM CORRECT DU BACKEND
        ].filter(id => id !== undefined && id !== null);
        
        let positionId = null;
        let position = null;
        
        // Essayer chaque ID possible
        for (const id of possibleIds) {
          const parsedId = typeof id === 'string' ? parseInt(id) : id;
          position = positions.find(p => p.id === parsedId);
          if (position) {
            positionId = parsedId;
            break;
          }
        }
        
        // Si la position est directement dans la candidature (backend envoie les données)
        if (!position && (c as any).title && (c as any).company) {
          position = {
            title: (c as any).title,
            company: (c as any).company
          };
        }
        
        // SOLUTION DE FALLBACK : Si aucune position trouvée, utiliser la plus récente
        if (!position && positions.length > 0) {
          // Trier les positions par date de création (la plus récente d'abord)
          const sortedPositions = [...positions].sort((a, b) => {
            const dateA = new Date(a.createdAt || '1970-01-01').getTime();
            const dateB = new Date(b.createdAt || '1970-01-01').getTime();
            return dateB - dateA;
          });
          
          // Prendre la position la plus récente qui pourrait correspondre
          position = sortedPositions[0];
        }
        
        return {
          id: c.id,
          position: position?.title || (c as any).title || c.position?.title || 'Poste non spécifié',
          company: position?.company || (c as any).company || c.position?.company || 'Entreprise',
          status: getStatusText(c.status),
          appliedDate: c.appliedAt,
          lastUpdate: c.appliedAt
        };
      })
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
                                    <h4 className="font-bold text-gray-900 text-lg mb-1">{application.position}</h4>
                                    {application.company && (
                                      <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Building className="w-4 h-4" />
                                        <span>{application.company}</span>
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

                              {/* Badge de statut */}
                              <div className="ml-4">
                                <Badge className={`${getStatusColor(application.status)} flex items-center gap-2 px-3 py-1.5 text-sm font-medium`}>
                                  {getStatusIcon(application.status)}
                                  {application.status}
                                </Badge>
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
