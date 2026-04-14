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

// Import des nouveaux composants
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatsCards from '@/components/dashboard/StatsCards';
import RecentApplications from '@/components/dashboard/RecentApplications';

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
      <DashboardHeader userName={user?.firstName} />

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
          <StatsCards stats={stats} />

          {/* Recent Applications */}
          <RecentApplications 
            applications={stats.recentApplications}
            totalApplications={stats.totalApplications}
            getStatusColor={getStatusColor}
            getStatusIcon={getStatusIcon}
            formatDate={formatDate}
            getTimeSinceApplied={getTimeSinceApplied}
          />
        </>
      )}
    </div>
  );
}
