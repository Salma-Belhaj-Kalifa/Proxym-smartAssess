import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Eye, CheckCircle, XCircle, Clock, AlertCircle, MoreVertical, Calendar, User, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useCandidatures, usePositions } from '@/hooks/useApiHooks';

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
  testGenerated?: boolean;
  testCompleted?: boolean;
}

export default function ApplicationsPage() {
  const { data: candidatures = [], isLoading, error, refetch } = useCandidatures();
  const { data: positions = [] } = usePositions();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [positionFilter, setPositionFilter] = useState<number | 'all'>('all');

  // Mapper les données de candidatures pour l'affichage
  const applications = candidatures.map(c => ({
    id: c.id,
    candidate: {
      id: c.candidateId || c.id,
      firstName: c.candidateFirstName || c.firstName || 'Prénom',
      lastName: c.candidateLastName || c.lastName || 'Nom',
      email: c.candidateEmail || c.email || 'email@example.com',
      phone: c.candidatePhone || c.phone || '+216 00 000 000'
    },
    position: {
      id: c.positionId || 1,
      title: c.positionTitle || 'Poste non spécifié',
      company: c.positionCompany || 'Entreprise'
    },
    status: c.status || 'PENDING',
    appliedAt: c.appliedAt || new Date().toISOString(),
    cvUrl: c.cvUrl,
    aiScore: c.aiScore,
    aiAnalysis: c.aiAnalysis
  }));

  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      app.candidate.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.candidate.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.position.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesPosition = positionFilter === 'all' || app.position.id === positionFilter;
    
    return matchesSearch && matchesStatus && matchesPosition;
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
      // Naviguer vers la page de génération de test
      window.location.href = `/manager/candidats/${applicationId}/generer-test`;
    } catch (error) {
      toast.error('Erreur lors de la génération du test');
    }
  };

  const handleViewDetails = (applicationId: number) => {
    window.location.href = `/manager/candidats/${applicationId}`;
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Candidatures</h1>
          <p className="text-muted-foreground">
            {filteredApplications.length} candidature{filteredApplications.length > 1 ? 's' : ''} trouvée{filteredApplications.length > 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          Actualiser
        </Button>
      </div>

      {/* Filtres */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Rechercher par candidat, email ou poste..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
              >
                <option value="all">Tous les statuts</option>
                <option value="PENDING">En attente</option>
                <option value="ACCEPTED">Acceptés</option>
                <option value="REJECTED">Refusés</option>
                <option value="TEST_GENERATED">Test généré</option>
                <option value="TEST_COMPLETED">Test complété</option>
              </select>
              <select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
              >
                <option value="all">Tous les postes</option>
                {positions.map(pos => (
                  <option key={pos.id} value={pos.id}>{pos.title}</option>
                ))}
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
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Aucune candidature trouvée</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' || positionFilter !== 'all' 
                  ? 'Essayez de modifier vos filtres de recherche.' 
                  : 'Aucune candidature n\'a été soumise pour le moment.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredApplications.map((application) => (
            <Card key={application.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Informations du candidat */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                        {application.candidate.firstName[0]}{application.candidate.lastName[0]}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {application.candidate.firstName} {application.candidate.lastName}
                        </h3>
                        <p className="text-sm text-muted-foreground">{application.candidate.email}</p>
                        {application.candidate.phone && (
                          <p className="text-sm text-muted-foreground">{application.candidate.phone}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge variant="outline">{application.position.title}</Badge>
                      <Badge variant="secondary">{application.position.company}</Badge>
                      {application.aiScore && (
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                          Score IA: {application.aiScore}/10
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(application.appliedAt).toLocaleDateString('fr-FR')}
                      </div>
                      {application.cvUrl && (
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          CV disponible
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Statut et actions */}
                  <div className="flex flex-col items-end gap-3">
                    {getStatusBadge(application.status)}
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(application.id)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Voir les détails
                        </DropdownMenuItem>
                        {application.status === 'PENDING' && (
                          <DropdownMenuItem onClick={() => handleGenerateTest(application.id)}>
                            <FileText className="w-4 h-4 mr-2" />
                            Générer un test
                          </DropdownMenuItem>
                        )}
                        {application.status === 'ACCEPTED' && !application.testGenerated && (
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
