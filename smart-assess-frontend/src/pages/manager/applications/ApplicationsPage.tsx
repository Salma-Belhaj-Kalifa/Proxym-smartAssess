import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Eye, Calendar, Building2, Briefcase, CheckCircle, XCircle, Clock, AlertCircle, MoreVertical, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useCandidatures, usePositions } from '@/features';
import { Candidature } from '@/features/candidatures/types';
import { getStatusLabel, getStatusBadgeClass, getStatusVariant } from '@/utils/statusMappings';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

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
  candidateId: number;
  candidate: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  position: {
    id: number;
    title: string;
    company: string;
  };
  status: string;
  appliedAt: string;
  cvUrl?: string;
  aiScore?: number;
  aiAnalysis?: any;
  testGenerated?: boolean;
  testCompleted?: boolean;
  allPositions?: Array<{
    id: number;
    title: string;
    company: string;
    status: string;
    appliedAt: string;
  }>;
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

  // Regrouper les candidatures par candidat (une candidature = plusieurs postes)
  const applications = useMemo(() => {
    const groupedByCandidate: Record<number, Application> = {};
    
    candidatures.forEach(candidature => {
      const candidateId = candidature.candidateId;
      
      // Initialiser l'objet candidat si nécessaire
      if (!groupedByCandidate[candidateId]) {
        groupedByCandidate[candidateId] = {
          id: candidature.id,
          candidateId: candidature.candidateId,
          candidate: {
            id: candidature.candidateId,
            firstName: candidature.candidateFirstName || '',
            lastName: candidature.candidateLastName || '',
            email: candidature.candidateEmail || '',
            phone: candidature.candidatePhone || '',
          },
          position: {
            id: candidature.internshipPositionId || 0,
            title: candidature.positionTitle || 'Poste non spécifié',
            company: candidature.positionCompany || 'Entreprise',
          },
          status: candidature.status || 'PENDING',
          appliedAt: candidature.appliedAt,
          cvUrl: '', // cvUrl n'existe pas dans le type
          aiScore: candidature.aiScore,
          aiAnalysis: candidature.aiAnalysis,
          testGenerated: false, // À implémenter plus tard
          testCompleted: false, // À implémenter plus tard
          allPositions: [] // Initialiser vide
        };
      }
      
      // Ajouter cette candidature comme un poste individuel
      const currentPosition = {
        id: candidature.internshipPositionId || 0,
        title: candidature.positionTitle?.trim() || 'Poste non spécifié',
        company: candidature.positionCompany || 'Entreprise',
        status: candidature.status || 'PENDING',
        appliedAt: candidature.appliedAt
      };
      
      // Ajouter à allPositions (sans dédoublonnage pour voir les données réelles)
      groupedByCandidate[candidateId].allPositions.push(currentPosition);
    });
    
    return Object.values(groupedByCandidate);
  }, [candidatures]);

  const filteredApplications = applications.filter(app => {
    const matchesSearch =
      app.candidate.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.candidate.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.position.title.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesPosition = positionFilter === 'all' || (app.position.id && app.position.id === positionFilter);

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
                      {application.candidate?.firstName?.[0] || ''}{application.candidate?.lastName?.[0] || ''}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {application.candidate?.firstName || ''} {application.candidate?.lastName || ''}
                      </h3>
                      <p className="text-sm text-muted-foreground">{application.candidate?.email || 'Email non disponible'}</p>
                      {application.candidate?.phone && (
                        <p className="text-sm text-muted-foreground">{application.candidate.phone}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {/* Afficher tous les postes du candidat avec la même couleur */}
                    {application.allPositions?.map((position, index) => (
                      <Badge key={position.id} variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 transition-colors">
                        {position.title}
                      </Badge>
                    ))}
                  </div>
                  
                  {/* Afficher l'entreprise en dessous des postes */}
                  {application.allPositions && application.allPositions.length > 0 && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                      <Building2 className="w-4 h-4" />
                      <span>{application.position?.company}</span>
                    </div>
                  )}
                  
                  {application.aiScore && (
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                      Score IA: {application.aiScore}/10
                    </Badge>
                  )}

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