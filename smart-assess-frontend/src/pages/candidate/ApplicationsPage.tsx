import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Upload, FileText, Search, Briefcase, User, CheckCircle, Clock, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCandidaturesByCandidate } from '@/features/candidatures/candidaturesQueries';

export default function CandidateApplicationsPage() {
const { data: user, isLoading: userLoading } = useCurrentUser();
  
  const { data: candidatures = [], isLoading, error, refetch } = useCandidaturesByCandidate(user?.id || 0);
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
    
    return {
      id: c.id,
      position: c.positionTitle || 'Poste non spécifié',
      company: c.positionCompany || null,
      status: getStatusText(c.status),
      appliedDate: c.appliedAt,
      lastUpdate: c.updatedAt || c.appliedAt
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
