import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Users, Search, TrendingUp, Award, AlertCircle, Loader2, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import apiClient from "@/lib/api";

// Types pour le matching
interface PositionRequirements {
  id: number;
  title: string;
  company: string;
  description: string;
}

interface CandidateRanking {
  rank: number;
  candidate_id: string;
  candidate_name: string;
  fit_analysis?: string;
  technical_match: number;
  experience_match: number;
  domain_match: number;
  potential_score: number;
  strengths: string[];
  gaps: string[];
  risks: string[];
  recommendation: string;
  interview_priority: string;
  reasoning: string;
}

interface MatchingResult {
  position_analysis: {
    title: string;
    required_skills: string[];
    experience_level: string;
    domain: string;
    key_requirements: string[];
  };
  candidate_rankings: CandidateRanking[];
  matching_insights: {
    total_candidates: number;
    strong_matches: number;
    moderate_matches: number;
    weak_matches: number;
    key_trends: string[];
    recommendations: string[];
  };
}

const CandidateMatchingPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [positions, setPositions] = useState<PositionRequirements[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<PositionRequirements | null>(null);
  const [matchingResult, setMatchingResult] = useState<MatchingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPositions, setLoadingPositions] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const positionId = id ? parseInt(id) : null;

  useEffect(() => {
    fetchPositions();
  }, []);

  useEffect(() => {
    if (positionId && positions.length > 0) {
      const position = positions.find(p => p.id === positionId);
      if (position) {
        setSelectedPosition(position);
        performMatching(position);
      }
    }
  }, [positionId, positions]);

  const fetchPositions = async () => {
    try {
      setLoadingPositions(true);
      const response = await apiClient.get('/v1/evaluation/positions-with-candidates');
      
      if (response.data) {
        setPositions(response.data);
      }
    } catch (err: any) {
      console.error('Error fetching positions:', err);
      toast({
        title: "Erreur",
        description: "Impossible de charger les postes",
        variant: "destructive"
      });
    } finally {
      setLoadingPositions(false);
    }
  };

  const performMatching = async (position: PositionRequirements) => {
    if (!position) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.post(`/v1/evaluation/match-candidates/${position.id}`, {
        topN: 10
      });
      
      if (response.data) {
        setMatchingResult(response.data);
      } else {
        setError("Aucun résultat de matching disponible");
      }
    } catch (err: any) {
      console.error('Error performing matching:', err);
      setError(err.response?.data?.error || "Erreur lors du matching des candidats");
      toast({
        title: "Erreur",
        description: err.response?.data?.error || "Impossible d'effectuer le matching",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePositionChange = (positionId: string) => {
    const position = positions.find(p => p.id === parseInt(positionId));
    if (position) {
      setSelectedPosition(position);
      navigate(`/manager/matching/${position.id}`, { replace: true });
      performMatching(position);
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation.toLowerCase()) {
      case 'strongly recommend':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'recommend':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'consider':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'not recommended':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRecommendationLabel = (recommendation: string) => {
    switch (recommendation.toLowerCase()) {
      case 'strongly recommend':
        return 'Fortement recommandé';
      case 'recommend':
        return 'Recommandé';
      case 'consider':
        return 'À considérer';
      case 'not recommended':
        return 'Non recommandé';
      default:
        return recommendation;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'Priorité haute';
      case 'medium':
        return 'Priorité moyenne';
      case 'low':
        return 'Priorité basse';
      default:
        return priority;
    }
  };

  if (loadingPositions) {
    return (
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Chargement des postes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/manager/positions')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux postes
            </Button>
            <h1 className="text-3xl font-bold text-foreground">Matching Candidat-Poste</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Analyse IA des meilleurs candidats pour chaque poste
          </p>
        </div>
      </div>

      {/* Position Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Sélection du poste
          </CardTitle>
          <CardDescription>
            Choisissez un poste pour voir les candidats les plus adaptés
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedPosition?.id?.toString()} onValueChange={handlePositionChange}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez un poste..." />
            </SelectTrigger>
            <SelectContent>
              {positions.map((position) => (
                <SelectItem key={position.id} value={position.id.toString()}>
                  {position.title} - {position.company}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Analyse des candidats en cours...</p>
          </div>
        </div>
      )}

      {error && (
        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {matchingResult && !loading && (
        <>
          {/* Position Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Analyse du poste: {matchingResult.position_analysis.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Domaine</p>
                  <p className="font-medium">{matchingResult.position_analysis.domain}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Niveau d'expérience</p>
                  <p className="font-medium">{matchingResult.position_analysis.experience_level}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Compétences requises</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {matchingResult.position_analysis.required_skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total candidats</p>
                  <p className="font-medium">{matchingResult.matching_insights.total_candidates}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Matching Insights */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {matchingResult.matching_insights.strong_matches}
                  </div>
                  <p className="text-sm text-muted-foreground">Forte correspondance</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {matchingResult.matching_insights.moderate_matches}
                  </div>
                  <p className="text-sm text-muted-foreground">Correspondance moyenne</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {matchingResult.matching_insights.weak_matches}
                  </div>
                  <p className="text-sm text-muted-foreground">Faible correspondance</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {Math.round(
                      (matchingResult.matching_insights.strong_matches / matchingResult.matching_insights.total_candidates) * 100
                    )}%
                  </div>
                  <p className="text-sm text-muted-foreground">Taux de succès</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Candidates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Meilleurs candidats
              </CardTitle>
              <CardDescription>
                Classés par score de compatibilité avec le poste
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {matchingResult.candidate_rankings.map((candidate) => (
                  <div key={candidate.candidate_id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                          {candidate.rank}
                        </div>
                        <div>
                          <h3 className="font-semibold">{candidate.candidate_name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getRecommendationColor(candidate.recommendation)}>
                              {getRecommendationLabel(candidate.recommendation)}
                            </Badge>
                            <Badge className={getPriorityColor(candidate.interview_priority)}>
                              {getPriorityLabel(candidate.interview_priority)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{candidate.fit_analysis || 'N/A'}</div>
                        <p className="text-sm text-muted-foreground">Score de compatibilité</p>
                      </div>
                    </div>

                    {/* Score Breakdown */}
                    <div className="grid md:grid-cols-4 gap-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Compétences techniques</span>
                          <span>{Math.round(candidate.technical_match)}%</span>
                        </div>
                        <Progress value={candidate.technical_match} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Expérience</span>
                          <span>{Math.round(candidate.experience_match)}%</span>
                        </div>
                        <Progress value={candidate.experience_match} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Domaine</span>
                          <span>{Math.round(candidate.domain_match)}%</span>
                        </div>
                        <Progress value={candidate.domain_match} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Potentiel</span>
                          <span>{Math.round(candidate.potential_score)}%</span>
                        </div>
                        <Progress value={candidate.potential_score} className="h-2" />
                      </div>
                    </div>

                    {/* Strengths and Gaps */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-green-700 mb-2">Points forts</h4>
                        <div className="flex flex-wrap gap-1">
                          {candidate.strengths.slice(0, 3).map((strength, index) => (
                            <Badge key={index} variant="secondary" className="text-xs bg-green-100 text-green-800">
                              {strength}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-yellow-700 mb-2">Axes d'amélioration</h4>
                        <div className="flex flex-wrap gap-1">
                          {candidate.gaps.slice(0, 2).map((gap, index) => (
                            <Badge key={index} variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                              {gap}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Reasoning */}
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="text-sm text-muted-foreground">
                        <strong>Analyse IA:</strong> {candidate.reasoning}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Key Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Tendances et recommandations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Tendances clés</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {matchingResult.matching_insights.key_trends.map((trend, index) => (
                      <li key={index}>- {trend}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Recommandations</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {matchingResult.matching_insights.recommendations.map((rec, index) => (
                      <li key={index}>- {rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default CandidateMatchingPage;
