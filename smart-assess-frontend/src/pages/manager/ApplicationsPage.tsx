import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Eye, CheckCircle, XCircle, Clock, AlertCircle, MoreVertical, Calendar, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useCandidatures, usePositions } from '@/features';
import { getStatusLabel, getStatusBadgeClass, getStatusVariant } from '@/utils/statusMappings';
import { useQueryClient } from '@tanstack/react-query';

interface Candidate {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

interface Position {
  id: number;
  title: string;
  company: string;
}

interface Application {
  id: number;
  candidate: Candidate;
  position: Position;
  status: string;
  appliedAt: string;
  cvUrl?: string;
  aiScore?: number;
  aiAnalysis?: any;
  testGenerated?: boolean;
  testCompleted?: boolean;
}

export default function ApplicationsPage() {
  const { data: candidatures = [], isLoading, refetch } = useCandidatures();
  const { data: positions = [] } = usePositions();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [positionFilter, setPositionFilter] = useState<number | 'all'>('all');

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['candidatures'] });
    await refetch();
    toast.success('Données actualisées');
  };

  // Mapper les données pour l'affichage
  const applications: Application[] = candidatures.map((c: any) => {
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
        id: (c as any).internship_position_id,
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
      candidate: {
        id: c.candidate?.id || c.id || c.candidateId,
        firstName: c.candidateFirstName || c.candidate?.firstName || c.firstName || '',
        lastName: c.candidateLastName || c.candidate?.lastName || c.lastName || '',
        email: c.candidateEmail || c.candidate?.email || c.email || '',
        phone: c.candidatePhone || c.candidate?.phone || c.phone || '',
      },
      position: {
        id: position?.id || c.position?.id || c.positionId || 0,
        title: position?.title || (c as any).title || c.position?.title || 'Poste non spécifié',
        company: position?.company || (c as any).company || c.position?.company || 'Entreprise',
      },
      status: c.status || 'PENDING',
      appliedAt: c.createdAt || new Date().toISOString(),
      cvUrl: c.cvUrl,
      aiScore: c.aiScore,
      aiAnalysis: c.aiAnalysis,
      testGenerated: c.testGenerated,
      testCompleted: c.testCompleted,
    };
  });

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
    const label = getStatusLabel(status);
    const badgeClass = getStatusBadgeClass(status);
    const variant = getStatusVariant(status);

    let icon = null;
    switch (status) {
      case 'PENDING':
        icon = <Clock className="w-3 h-3" />;
        break;
      case 'ACCEPTED':
        icon = <CheckCircle className="w-3 h-3" />;
        break;
      case 'REJECTED':
        icon = <XCircle className="w-3 h-3" />;
        break;
      case 'TEST_SENT':
        icon = <FileText className="w-3 h-3" />;
        break;
      case 'IN_PROGRESS':
        icon = <AlertCircle className="w-3 h-3" />;
        break;
      case 'COMPLETED':
        icon = <CheckCircle className="w-3 h-3" />;
        break;
    }

    return (
      <Badge variant={variant} className={`flex items-center gap-1 ${badgeClass}`}>
        {icon}
        {label}
      </Badge>
    );
  };

  const handleGenerateTest = (applicationId: number) => {
    window.location.href = `/manager/candidats/${applicationId}/generer-test`;
  };

  const handleViewDetails = (applicationId: number) => {
    console.log('ApplicationsPage - Clic sur "Voir les détails" pour ID:', applicationId);
    console.log('ApplicationsPage - URL de redirection:', `/manager/candidats/${applicationId}/generer-test`);
    
    navigate(`/manager/candidats/${applicationId}/generer-test`);
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
          <h1 className="text-3xl font-bold text-foreground">Candidats</h1>
          <p className="text-muted-foreground">
            {filteredApplications.length} candidat{filteredApplications.length > 1 ? 's' : ''} trouvé{filteredApplications.length > 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          Actualiser
        </Button>
      </div>

      {/* Filtres */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Rechercher par candidat, email ou poste..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
              >
                <option value="all">Tous les statuts</option>
                <option value="PENDING">En attente</option>
                <option value="TEST_SENT">Test envoyé</option>
                <option value="IN_PROGRESS">Test en cours</option>
                <option value="COMPLETED">Test terminé</option>
                <option value="ACCEPTED">Acceptés</option>
                <option value="REJECTED">Refusés</option>
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
          filteredApplications.map(application => (
            <Card key={application.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                      {application.candidate.firstName?.[0] || ''}{application.candidate.lastName?.[0] || ''}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {application.candidate.firstName || ''} {application.candidate.lastName || ''}
                      </h3>
                      <p className="text-sm text-muted-foreground">{application.candidate.email || 'Email non disponible'}</p>
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
                      {(application.status === 'PENDING' || (application.status === 'ACCEPTED' && !application.testGenerated)) && (
                        <DropdownMenuItem onClick={() => handleGenerateTest(application.id)}>
                          <FileText className="w-4 h-4 mr-2" />
                          Générer un test
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}