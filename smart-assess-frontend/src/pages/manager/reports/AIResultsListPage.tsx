import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Download, Filter, Search, Calendar, User, Building, TrendingUp, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Mock data pour les résultats IA
const mockAIResults = [
  {
    id: 1,
    candidate: {
      name: "Wala Oueslati",
      email: "wala.oueslati@gmail.com",
      initials: "WO"
    },
    position: "Développeur Backend Java",
    company: "Proxym IT",
    globalScore: 76,
    evaluationDate: "2026-03-18T14:32:00Z",
    status: "completed",
    keySkills: ["Spring Boot", "Java", "SQL", "REST API"],
    strengths: ["Architecture Spring Boot", "Composants Java avancés"],
    aiAnalysis: "Bonne maîtrise de Spring Boot avec architecture REST solide"
  },
  {
    id: 2,
    candidate: {
      name: "Salma Belhaj",
      email: "bhksalma0@gmail.com",
      initials: "SB"
    },
    position: "Développeur Frontend React",
    company: "Proxym IT",
    globalScore: 82,
    evaluationDate: "2026-03-17T16:45:00Z",
    status: "completed",
    keySkills: ["React", "TypeScript", "Node.js", "CSS"],
    strengths: ["Composants React avancés", "TypeScript strict"],
    aiAnalysis: "Excellente maîtrise de React et patterns modernes"
  },
  {
    id: 3,
    candidate: {
      name: "Mohamed Ali",
      email: "mohamed.ali@email.com",
      initials: "MA"
    },
    position: "DevOps Engineer",
    company: "Proxym IT",
    globalScore: 68,
    evaluationDate: "2026-03-16T11:20:00Z",
    status: "completed",
    keySkills: ["Docker", "Kubernetes", "CI/CD", "AWS"],
    strengths: ["Configuration Docker", "Scripts CI/CD"],
    aiAnalysis: "Bases solides en conteneurisation et déploiement"
  },
  {
    id: 4,
    candidate: {
      name: "Sarra Kallel",
      email: "sarra.kallel@email.com",
      initials: "SK"
    },
    position: "Data Scientist",
    company: "Proxym IT",
    globalScore: 91,
    evaluationDate: "2026-03-15T09:15:00Z",
    status: "completed",
    keySkills: ["Python", "Machine Learning", "TensorFlow", "Pandas"],
    strengths: ["Modèles ML avancés", "Analyse statistique"],
    aiAnalysis: "Expertise confirmée en machine learning et data analysis"
  },
  {
    id: 5,
    candidate: {
      name: "Youssef Ben",
      email: "youssef.ben@email.com",
      initials: "YB"
    },
    position: "Mobile Developer",
    company: "Proxym IT",
    globalScore: 74,
    evaluationDate: "2026-03-14T13:30:00Z",
    status: "in_progress",
    keySkills: ["React Native", "Flutter", "iOS", "Android"],
    strengths: ["React Native", "State Management"],
    aiAnalysis: "Bonnes compétences en développement multiplateforme"
  }
];

const AIResultsListPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  // Filtrer les résultats
  const filteredResults = mockAIResults.filter(result => {
    const matchesSearch = result.candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         result.candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         result.position.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || result.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Trier les résultats
  const sortedResults = [...filteredResults].sort((a, b) => {
    switch (sortBy) {
      case 'score':
        return b.globalScore - a.globalScore;
      case 'name':
        return a.candidate.name.localeCompare(b.candidate.name);
      case 'date':
      default:
        return new Date(b.evaluationDate).getTime() - new Date(a.evaluationDate).getTime();
    }
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Résultats IA
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Évaluations intelligentes des candidats
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exporter tout
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres et recherche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Rechercher par nom, email ou poste..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="completed">Complétés</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="score">Score</SelectItem>
                  <SelectItem value="name">Nom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedResults.map((result) => (
          <Card key={result.id} className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary/50">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                    {result.candidate.initials}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {result.candidate.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">{result.candidate.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getScoreColor(result.globalScore)}`}>
                    {result.globalScore}
                  </div>
                  <div className="text-xs text-muted-foreground">/ 100</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Position et Company */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{result.position}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{result.company}</span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <Badge variant={result.status === 'completed' ? 'default' : 'secondary'}>
                  {result.status === 'completed' ? 'Complété' : 'En cours'}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {formatDate(result.evaluationDate)}
                </div>
              </div>

              {/* Key Skills */}
              <div>
                <div className="text-xs text-muted-foreground mb-2">Compétences clés</div>
                <div className="flex flex-wrap gap-1">
                  {result.keySkills.slice(0, 3).map((skill, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {result.keySkills.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{result.keySkills.length - 3}
                    </Badge>
                  )}
                </div>
              </div>

              {/* AI Analysis Preview */}
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium text-primary">Analyse IA</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {result.aiAnalysis}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button asChild size="sm" className="flex-1">
                  <Link to={`/manager/resultats/${result.id}`}>
                    <Eye className="w-4 h-4 mr-2" />
                    Voir détail
                  </Link>
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {sortedResults.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Aucun résultat trouvé
            </h3>
            <p className="text-muted-foreground text-sm">
              {searchTerm || filterStatus !== 'all' 
                ? 'Essayez de modifier vos filtres de recherche'
                : 'Aucune évaluation IA disponible pour le moment'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Statistiques
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {mockAIResults.length}
              </div>
              <div className="text-xs text-muted-foreground">Total évaluations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {mockAIResults.filter(r => r.status === 'completed').length}
              </div>
              <div className="text-xs text-muted-foreground">Complétées</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {mockAIResults.filter(r => r.status === 'in_progress').length}
              </div>
              <div className="text-xs text-muted-foreground">En cours</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(mockAIResults.reduce((acc, r) => acc + r.globalScore, 0) / mockAIResults.length)}
              </div>
              <div className="text-xs text-muted-foreground">Score moyen</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIResultsListPage;
