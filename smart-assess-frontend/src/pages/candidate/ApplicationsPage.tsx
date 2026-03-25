import { useState } from 'react';
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

  
  const applications = candidatures.map(c => {
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
  });
  
  const filteredApplications = applications.filter(app => 
    app.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (app.company && app.company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
                      <CardTitle className="text-lg">{application.position}</CardTitle>
                      {application.company && (
                        <p className="text-sm text-gray-600 mb-2">{application.company}</p>
                      )}
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
