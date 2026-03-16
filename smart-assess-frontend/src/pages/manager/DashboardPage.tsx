import { Briefcase, Users, CheckCircle, TrendingUp, Plus, Eye, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useAuth } from '@/hooks/useApiHooks';
import { positionService, candidateService } from '@/services/apiService';
import { useState, useEffect } from 'react';

const DashboardPage = () => {
  const { user } = useAuth();
  const [positions, setPositions] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [positionsData, candidatesData] = await Promise.all([
        positionService.getAll(),
        candidateService.getAll()
      ]);
      setPositions(positionsData);
      setCandidates(candidatesData);
      // Pour les tests, nous utiliserons des données fictives pour l'instant
      setTests([]);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculer les statistiques réelles depuis les APIs
  const stats = [
    { 
      label: "Postes actifs", 
      value: positions?.filter(p => p.status === 'active')?.length || 0, 
      sub: `${positions?.filter(p => p.status === 'inactive')?.length || 0} postes inactifs`, 
      icon: Briefcase, 
      color: "text-primary" 
    },
    { 
      label: "Total candidats", 
      value: candidates?.length || 0, 
      sub: `+${candidates?.filter(c => {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return new Date(c.createdAt) > oneWeekAgo;
      })?.length || 0} cette semaine`, 
      icon: Users, 
      color: "text-info" 
    },
    { 
      label: "Tests complétés", 
      value: tests?.length || 0, 
      sub: `+${candidates?.filter(c => c.status === 'completed')?.length || 0} aujourd'hui`, 
      icon: CheckCircle, 
      color: "text-success" 
    },
    { 
      label: "Score moyen", 
      value: "75%", 
      sub: `${candidates?.filter(c => c.status === 'in_progress')?.length || 0} session en cours`, 
      icon: TrendingUp, 
      color: "text-warning" 
    },
  ];

  // Activités réelles depuis les APIs
  const activities = [
    ...(candidates?.slice(-2).map(candidate => ({
      text: <>Nouveau candidat <strong>{candidate.firstName} {candidate.lastName}</strong> inscrit</>,
      time: `Il y a ${Math.floor((Date.now() - new Date(candidate.createdAt).getTime()) / (1000 * 60 * 60))}h`
    })) || []),
    ...(positions?.slice(-1).map(position => ({
      text: <>Nouveau poste <strong>{position.title}</strong> publié</>,
      time: `Hier, ${new Date(position.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
    })) || [])
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 4);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Chargement du tableau de bord...</div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Tableau de bord</h1>
              <p className="text-muted-foreground text-sm mt-1">
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <Button asChild>
              <Link to="/manager/postes">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau poste
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="glass-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* Recent Activities */}
          <div className="glass-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Activités récentes</h2>
              <Button variant="ghost" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                Voir tout
              </Button>
            </div>
            <div className="space-y-3">
              {activities.length === 0 ? (
                <p className="text-muted-foreground text-sm">Aucune activité récente</p>
              ) : (
                activities.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="text-sm">{activity.text}</div>
                    <div className="text-xs text-muted-foreground">{activity.time}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
