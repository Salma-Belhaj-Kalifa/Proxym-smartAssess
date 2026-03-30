import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Upload, FileText, Search, Briefcase, User, CheckCircle, Clock, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCurrentUserSafe } from '@/features/auth/authQueries';
import { useCandidaturesByCandidate } from '@/features/candidatures/candidaturesQueries';
import { usePositions } from '@/features/positions/positionsQueries';

export default function CandidateApplicationsPage() {
  const { data: user, isLoading: userLoading } = useCurrentUserSafe();
  
  const { data: candidatures = [], isLoading, error, refetch } = useCandidaturesByCandidate(user?.id || 0);
  const { data: positions = [] } = usePositions();
  const [searchTerm, setSearchTerm] = useState('');
  
  if (userLoading) {
    return null;
  }
  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'En cours';
      case 'ACCEPTED': return 'Acceptée';
      case 'REJECTED': return 'Rejetée';
      default: return status;
    }
  };

  
  const applications = useMemo(() => {
    // Regrouper les candidatures par candidat (une candidature = plusieurs postes)
    const groupedByCandidate: Record<number, any> = {};
    
    candidatures.forEach(c => {
      const candidateId = c.candidateId;
      
      if (!groupedByCandidate[candidateId]) {
        // Initialiser la candidature du candidat
        groupedByCandidate[candidateId] = {
          id: c.id,
          candidateId: c.candidateId,
          candidateFirstName: c.candidateFirstName,
          candidateLastName: c.candidateLastName,
          candidateEmail: c.candidateEmail,
          status: c.status,
          appliedAt: c.appliedAt,
          updatedAt: c.updatedAt,
          // Collecter tous les postes de cette candidature
          allPositions: []
        };
      }
      
      // Ajouter les postes de cette candidature
      if (c.positions && Array.isArray(c.positions) && c.positions.length > 0) {
        // ✅ Utiliser les postes de la nouvelle structure backend
        c.positions.forEach((pos: any) => {
          if (pos.title && !groupedByCandidate[candidateId].allPositions.find((p: any) => p.title === pos.title)) {
            groupedByCandidate[candidateId].allPositions.push({
              id: pos.id,
              title: pos.title,
              company: pos.company || c.positionCompany || 'Entreprise',
              createdAt: c.appliedAt
            });
          }
        });
      } else if (c.internshipPositions && Array.isArray(c.internshipPositions) && c.internshipPositions.length > 0) {
        // Compatibilité avec l'ancienne structure frontend
        c.internshipPositions.forEach((pos: any) => {
          if (pos.title && !groupedByCandidate[candidateId].allPositions.find((p: any) => p.title === pos.title)) {
            groupedByCandidate[candidateId].allPositions.push({
              id: pos.id,
              title: pos.title,
              company: pos.company || c.positionCompany || 'Entreprise',
              createdAt: c.appliedAt
            });
          }
        });
      } else if (c.positionTitle && c.internshipPositionId) {
        // Utiliser le poste de l'ancienne structure (compatibilité)
        if (!groupedByCandidate[candidateId].allPositions.find((p: any) => p.id === c.internshipPositionId)) {
          groupedByCandidate[candidateId].allPositions.push({
            id: c.internshipPositionId,
            title: c.positionTitle,
            company: c.positionCompany || 'Entreprise',
            createdAt: c.appliedAt
          });
        }
      }
    });
    
    // Convertir en tableau et ajouter les propriétés manquantes
    return Object.values(groupedByCandidate).map(c => ({
      id: c.id,
      positions: c.allPositions, // Tous les postes de la candidature
      status: getStatusText(c.status),
      appliedDate: c.appliedAt,
      lastUpdate: c.appliedAt
    }));
  }, [candidatures]);

  const filteredApplications = applications.filter(app => 
    app.positions.some(pos => pos.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
    app.positions.some(pos => pos.company && pos.company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (filteredApplications.length === 0 && searchTerm) {
    return (
      <div className="text-center py-12">
        <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune candidature trouvée</h3>
        <p className="text-gray-600">
          Aucune candidature ne correspond à votre recherche "{searchTerm}".
        </p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Acceptée': return 'bg-green-100 text-green-800';
      case 'En cours': return 'bg-yellow-100 text-yellow-800';
      case 'Rejetée': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Acceptée': return <CheckCircle className="w-4 h-4" />;
      case 'En cours': return <Clock className="w-4 h-4" />;
      case 'Rejetée': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Date invalide';
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mes candidatures</h1>
        <div className="flex gap-4">
          <Link to="/candidat/postes">
            <Button variant="outline" className="flex items-center gap-2">
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
            <span>Chargement des candidatures...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span>{error?.message || 'Erreur lors du chargement des candidatures'}</span>
          </div>
          <Button 
            onClick={() => refetch()} 
            variant="outline" 
            size="sm" 
            className="mt-2"
          >
            Réessayer
          </Button>
        </div>
      )}

      {/* Content */}
      {!isLoading && !error && (
        <>
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une candidature..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Applications Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApplications.map((application) => (
              <Card key={application.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">Ma Candidature</CardTitle>
                      <p className="text-sm text-gray-600 mb-2">
                        {application.positions.length} poste{application.positions.length > 1 ? 's' : ''}
                      </p>
                    </div>
                    <Badge className={getStatusColor(application.status)}>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(application.status)}
                        {application.status}
                      </div>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Afficher tous les postes */}
                    <div>
                      <span className="text-sm text-gray-500">Poste{application.positions.length > 1 ? 's' : ''}:</span>
                      <div className="mt-1 space-y-1">
                        {application.positions.map((position, index) => (
                          <div key={position.id} className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{position.title}</span>
                            {position.company && (
                              <span className="text-sm text-gray-600">({position.company})</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Date de candidature:</span>
                      <span className="font-medium">{formatDate(application.appliedDate)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredApplications.length === 0 && (
            <div className="text-center py-12">
              <div className="mb-6">
                <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {searchTerm ? 'Aucune candidature trouvée' : 'Aucune candidature'}
              </h3>
              <p className="text-gray-500">
                {searchTerm 
                  ? 'Essayez d\'autres termes de recherche' 
                  : 'Commencez par déposer votre CV ou postuler aux offres disponibles'
                }
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
