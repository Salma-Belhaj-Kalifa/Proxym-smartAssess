import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Search, Filter, Eye, CheckCircle, XCircle, Clock, AlertCircle, MoreVertical, Calendar, User, FileText, Briefcase, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useCandidaturesByPosition, usePositions } from '@/features';

interface Application {
  id: number;
  candidate: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  position: {
    id: number;
    title: string;
    company: string;
  };
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'TEST_GENERATED' | 'TEST_COMPLETED';
  appliedAt: string;
  cvUrl?: string;
  aiScore?: number;
  aiAnalysis?: string;
}

export default function PositionApplicationsPage() {
  const params = useParams<{ id: string }>();
  const { id: positionId } = params;
 
  const id = parseInt(positionId || '0');
  
  const { data: positions = [] } = usePositions();
  const position = positions.find(p => p.id === id);
  const { data: candidatures = [], isLoading, error, refetch } = useCandidaturesByPosition(id);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Mapper les données de candidatures pour l'affichage
  console.log('Mapping candidatures:', candidatures);
  
  const applications = candidatures.map(c => {
    console.log('Processing candidature:', c);
    
    // Le backend envoie 'internship_position_id' au lieu de 'positionId'
    const possibleIds = [
      c.internshipPositionId,
      (c as any).position_id,
      (c as any).PositionId,
      (c as any).jobPositionId,
      (c as any).jobId,
      (c as any).internship_position_id  // ← AJOUT DU NOM CORRECT DU BACKEND
    ].filter(id => id !== undefined && id !== null);
    
    let foundPosition = null;
    
    // Essayer chaque ID possible avec les positions disponibles
    for (const posId of possibleIds) {
      const parsedId = typeof posId === 'string' ? parseInt(posId) : posId;
      foundPosition = positions.find(p => p.id === parsedId);
      if (foundPosition) {
        break;
      }
    }
    
    // Si la position est directement dans la candidature (backend envoie les données)
    if (!foundPosition && c.positionTitle && c.positionCompany) {
      foundPosition = {
        id: (c as any).internship_position_id,
        title: c.positionTitle,
        company: c.positionCompany
      };
    }
    
    // Fallback vers la position de la page si aucune autre trouvée
    if (!foundPosition && position) {
      foundPosition = position;
    }
    
    return {
      id: c.id,
      candidateId: c.candidateId,
      candidate: {
        id: c.candidateId,
        firstName: c.candidateFirstName,
        lastName: c.candidateLastName,
        email: c.candidateEmail,
        phone: c.candidatePhone  // ✅ Plus de fallback, champ obligatoire
      },
      position: {
        id: foundPosition?.id || c.internshipPositionId || id,
        title: foundPosition?.title || c.positionTitle || position?.title || 'Poste non spécifié',
        company: foundPosition?.company || c.positionCompany || position?.company || 'Entreprise'
      },
      status: c.status || 'PENDING',
      appliedAt: c.appliedAt || new Date().toISOString(),
      // cvUrl n'existe pas dans le type Candidature, mais on peut le récupérer depuis candidateCVs
      cvUrl: c.candidateCVs && c.candidateCVs.length > 0 ? c.candidateCVs[0].fileName : undefined,
      aiScore: c.aiScore,
      aiAnalysis: c.aiAnalysis
    };
  });
  
  console.log('Mapped applications:', applications);

  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      app.candidate.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.candidate.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.candidate.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="w-3 h-3" /> En attente</Badge>;
      case 'ACCEPTED':
        return <Badge className="bg-green-100 text-green-800 border-green-300 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Accepté</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="w-3 h-3" /> Refusé</Badge>;
      case 'TEST_GENERATED':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300 flex items-center gap-1"><FileText className="w-3 h-3" /> Test généré</Badge>;
      case 'TEST_COMPLETED':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-300 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Test complété</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleGenerateTest = async (applicationId: number) => {
    try {
      window.location.href = `/manager/candidats/${applicationId}/generer-test`;
    } catch (error) {
      console.error('Error generating test:', error);
    }
  };

  if (!positionId || id === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">ID de poste invalide</h2>
          <p className="text-gray-600 mb-4">L'ID du poste n'est pas valide ou n'a pas été trouvé.</p>
          <p className="text-sm text-gray-500 mb-4">URL actuelle: {window.location.pathname}</p>
          <Link to="/manager/postes">
            <Button>Retour aux postes</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Chargement...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Erreur lors du chargement</h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <Button onClick={() => refetch()}>Réessayer</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Link to="/manager/postes">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux postes
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Candidatures</h1>
            <p className="text-muted-foreground">
              Poste: {position?.title || 'Chargement...'}
            </p>
          </div>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          Actualiser
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-xl font-bold">{applications.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">En attente</p>
                <p className="text-xl font-bold">{applications.filter(a => a.status === 'PENDING').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Acceptés</p>
                <p className="text-xl font-bold">{applications.filter(a => a.status === 'ACCEPTED').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Refusés</p>
                <p className="text-xl font-bold">{applications.filter(a => a.status === 'REJECTED').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par candidat, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
              >
                <option value="all">Tous les statuts</option>
                <option value="PENDING">En attente</option>
                <option value="ACCEPTED">Acceptés</option>
                <option value="REJECTED">Refusés</option>
                <option value="TEST_GENERATED">Test généré</option>
                <option value="TEST_COMPLETED">Test complété</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des candidatures */}
      <div className="space-y-4">
        {filteredApplications.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune candidature trouvée</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Essayez de modifier vos filtres pour voir plus de résultats.'
                  : 'Aucun candidat n\'a postulé à ce poste pour le moment.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredApplications.map((application) => (
            <Card key={application.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {application.candidate.firstName} {application.candidate.lastName}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <span className="font-medium">{application.candidate.email}</span>
                          {application.candidate.phone && (
                            <>
                              <span>•</span>
                              <span>{application.candidate.phone}</span>
                            </>
                          )}
                        </div>
                        {getStatusBadge(application.status)}
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-blue-600" />
                          <div>
                            <p className="text-xs text-gray-500">Poste</p>
                            <p className="text-sm font-medium text-gray-900">{application.position.title}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-green-600" />
                          <div>
                            <p className="text-xs text-gray-500">Date de candidature</p>
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(application.appliedAt).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                        {application.aiScore && (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-purple-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-purple-600">AI</span>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Score IA</p>
                              <p className={`text-sm font-bold ${
                                application.aiScore >= 8 ? 'text-green-600' :
                                application.aiScore >= 6 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {application.aiScore}/10
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/manager/candidats/${application.candidate.id}`}>
                            <Eye className="w-4 h-4 mr-2" />
                            Voir le profil
                          </Link>
                        </DropdownMenuItem>
                        {application.status === 'ACCEPTED' && (
                          <DropdownMenuItem onClick={() => handleGenerateTest(application.id)}>
                            <FileText className="w-4 h-4 mr-2" />
                            Générer un test
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
