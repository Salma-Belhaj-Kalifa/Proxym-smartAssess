import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, BarChart3, Users, Target, TrendingUp, Award, Briefcase, Zap, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api";
import axios from 'axios';

/* ================= TYPES ================= */

interface RankedCandidate {
  candidate_id: number;
  skills: string[];
  years_of_experience?: number;
  composite_score: number;
  candidate_info?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface RankingResponse {
  position_title?: string;
  total_candidates: number;
  ranked_candidates: RankedCandidate[];
}

interface Position {
  id: string;
  title: string;
  requiredSkills: string[];
}


const RankingCandidatesPage = () => {
  const navigate = useNavigate();

  const [selectedPosition, setSelectedPosition] = useState<string>("");
  const [topN, setTopN] = useState<number>(10);
  const [minScore, setMinScore] = useState<number>(0.0);

  const { data: positions = [] } = useQuery({
    queryKey: ["/positions"],
    queryFn: async () => {
      const res = await apiClient.get("/positions");
      return res.data as Position[];
    }
  });

  const fastApiClient = axios.create({
    baseURL: 'http://localhost:8000/api/v1',
    timeout: 30000,
  });

  const {
    data: rankingData,
    refetch: refetchRanking,
    error: rankingError
  } = useQuery({
    queryKey: ["ranking", selectedPosition, topN, minScore],
    queryFn: async () => {
      if (!selectedPosition) return null;

      const position = positions.find(p => p.id === selectedPosition);

      const res = await fastApiClient.post("/rank-candidates", {
        position_id: parseInt(selectedPosition),
        required_skills: position?.requiredSkills || [],
        top_n: topN,
        min_score: minScore,
      });

      return res.data as RankingResponse;
    },
    enabled: selectedPosition !== ""
  });

  const handleRanking = () => refetchRanking();

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "text-emerald-600 bg-emerald-50";
    if (score >= 0.6) return "text-amber-600 bg-amber-50";
    if (score >= 0.4) return "text-orange-600 bg-orange-50";
    return "text-red-600 bg-red-50";
  };

  const getScoreText = (score: number) => {
    if (score >= 0.8) return "Excellent";
    if (score >= 0.6) return "Bon";
    if (score >= 0.4) return "Moyen";
    return "Faible";
  };

  const handleViewDetails = (id: number) => {
    navigate(`/manager/candidats/${id}/generer-test`);
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">

      {/* HEADER */}
      <div className="flex justify-between items-center bg-white border rounded-xl px-6 py-4 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Ranking des Candidats
          </h1>
          <p className="text-xs text-muted-foreground">
            Classement intelligent basé sur les compétences
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-slate-100 px-3 py-1 rounded-lg">
          <Zap className="w-4 h-4 text-blue-500" />
          IA Ranking
        </div>
      </div>

      {/* CONFIG */}
      <Card className="rounded-xl border shadow-sm">
        <CardContent className="p-5 space-y-5">

          <div>
            <Label className="text-xs text-muted-foreground">Poste</Label>
            <Select value={selectedPosition} onValueChange={setSelectedPosition}>
              <SelectTrigger className="h-10 mt-1">
                <SelectValue placeholder="Choisir un poste..." />
              </SelectTrigger>
              <SelectContent>
                {positions.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Résultats</Label>
              <Select value={topN.toString()} onValueChange={(v) => setTopN(parseInt(v))}>
                <SelectTrigger className="h-9 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">Top 5</SelectItem>
                  <SelectItem value="10">Top 10</SelectItem>
                  <SelectItem value="20">Top 20</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Score min</Label>
              <Select value={minScore.toString()} onValueChange={(v) => setMinScore(parseFloat(v))}>
                <SelectTrigger className="h-9 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.0">Tous</SelectItem>
                  <SelectItem value="0.3">30%</SelectItem>
                  <SelectItem value="0.5">50%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleRanking} className="w-full">
            Lancer le ranking
          </Button>

        </CardContent>
      </Card>

      {/* ERROR */}
      {rankingError && (
        <div className="text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">
          Erreur: {(rankingError as any).message}
        </div>
      )}

      {/* RESULTS */}
      {rankingData && (
        <div className="space-y-4">

          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{rankingData.total_candidates} candidats</span>
            <span>{rankingData.position_title}</span>
          </div>

          {rankingData.ranked_candidates.map((c, i) => (
            <Card key={c.candidate_id} className="hover:shadow-md transition rounded-xl">
              <CardContent className="flex justify-between items-center p-5">

                {/* LEFT */}
                <div className="flex items-center gap-4">

                  <div className="w-10 h-10 bg-blue-50 text-blue-600 flex items-center justify-center rounded-full font-bold">
                    {i + 1}
                  </div>

                  <div>
                    <h3 className="font-semibold">
                      {c.candidate_info
                        ? `${c.candidate_info.firstName} ${c.candidate_info.lastName}`
                        : `Candidat #${c.candidate_id}`}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {c.candidate_info?.email}
                    </p>
                  </div>

                </div>

                {/* RIGHT */}
                <div className="flex items-center gap-4">

                  <div className="w-40">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Score</span>
                      <span>{Math.round(c.composite_score * 100)}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${c.composite_score * 100}%` }}
                      />
                    </div>
                    <div className={`text-xs mt-1 ${getScoreColor(c.composite_score)}`}>
                      {getScoreText(c.composite_score)}
                    </div>
                  </div>

                  <Button size="sm" onClick={() => handleViewDetails(c.candidate_id)}>
                    Voir
                    <ChevronRight className="ml-1 w-4 h-4" />
                  </Button>

                </div>

              </CardContent>
            </Card>
          ))}

        </div>
      )}
    </div>
  );
};

export default RankingCandidatesPage;