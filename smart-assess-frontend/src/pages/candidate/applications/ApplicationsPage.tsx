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

// Import des nouveaux composants
import ApplicationsHeader from '@/components/applications/ApplicationsHeader';
import ApplicationsFilters from '@/components/applications/ApplicationsFilters';
import ApplicationCard from '@/components/applications/ApplicationCard';
import LoadingState from '@/components/applications/LoadingState';
import ErrorState from '@/components/applications/ErrorState';
import EmptyState from '@/components/applications/EmptyState';
import NoResultsState from '@/components/applications/NoResultsState';

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
    return <NoResultsState searchTerm={searchTerm} />;
  }

  return (
    <div className="container mx-auto p-6">
      <ApplicationsHeader />

      {/* Loading State */}
      {isLoading && <LoadingState />}

      {/* Error State */}
      {error && <ErrorState error={error} onRetry={refetch} />}

      {/* Content */}
      {!isLoading && !error && (
        <>
          {/* Search Bar */}
          <ApplicationsFilters 
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />

          {/* Applications Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApplications.map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </div>

          {filteredApplications.length === 0 && <EmptyState searchTerm={searchTerm} />}
        </>
      )}
    </div>
  );
}
