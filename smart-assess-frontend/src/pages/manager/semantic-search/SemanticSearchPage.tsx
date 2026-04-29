import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Brain, Target, TrendingUp, Clock, Award, Filter, User, Mail, FileText, ArrowRight, Sparkles, MapPin, ChevronRight, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from 'axios';

interface SemanticSearchResult {
  candidate_id: number;
  name: string;
  email: string;
  skills: string[];
  years_of_experience?: number;
  location?: string;
  semantic_score: number;
  keyword_score: number;
  hybrid_score: number;
  matched_concepts: string[];
  relevant_skills: string[];
  search_highlights: string[];
  query_keywords: string[];
}

interface SemanticSearchResponse {
  query: string;
  total_found: number;
  returned_results: number;
  search_results: SemanticSearchResult[];
  processing_time_ms: number;
  search_metadata: any;
}

const SemanticSearchPage = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [searchMode, setSearchMode] = useState("hybrid"); // Mode par défaut hybride
  const [maxResults, setMaxResults] = useState(20);
  const [minScore, setMinScore] = useState(0.3);
  const [selectedCandidate, setSelectedCandidate] = useState<SemanticSearchResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const fastApiClient = axios.create({
    baseURL: 'http://localhost:8000/api/v1',
    timeout: 30000,
  });

  const {
    data: searchResults,
    isLoading: searching,
    refetch: executeSearch,
    error: searchError
  } = useQuery({
    queryKey: ["/search-candidates", query, maxResults, minScore],
    queryFn: async () => {
      if (!query.trim()) return null;
      const payload = {
        query: query.trim(),
        search_mode: searchMode,
        max_results: maxResults,
        min_score: minScore,
        filters: {}
      };
      try {
        const response = await fastApiClient.post("/search-candidates", payload);
        return response.data as SemanticSearchResponse;
      } catch (error) {
        console.error('Semantic search error:', error);
        throw error;
      }
    },
    enabled: false
  });

  const handleSearch = () => {
    if (query.trim()) executeSearch();
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (score >= 0.6) return "text-amber-600 bg-amber-50 border-amber-200";
    if (score >= 0.4) return "text-orange-600 bg-orange-50 border-orange-200";
    return "text-red-500 bg-red-50 border-red-200";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return "Excellent";
    if (score >= 0.6) return "Bon";
    if (score >= 0.4) return "Modéré";
    return "Faible";
  };

  const getScoreTextColor = (score: number) => {
    if (score >= 0.8) return "text-emerald-600";
    if (score >= 0.6) return "text-amber-500";
    if (score >= 0.4) return "text-orange-500";
    return "text-red-500";
  };

  const getScoreBg = (score: number) => {
    if (score >= 0.8) return "bg-emerald-500";
    if (score >= 0.6) return "bg-amber-500";
    if (score >= 0.4) return "bg-orange-500";
    return "bg-red-500";
  };

  const getScoreRing = (score: number) => {
    if (score >= 0.8) return "ring-emerald-200";
    if (score >= 0.6) return "ring-amber-200";
    if (score >= 0.4) return "ring-orange-200";
    return "ring-red-200";
  };

  const handleViewDetails = (candidate: SemanticSearchResult) => {
    setSelectedCandidate(candidate);
    setShowDetails(true);
  };

  const handleGenerateTest = (candidateId: number) => {
    navigate(`/manager/candidats/${candidateId}/generer-test`);
  };

  const exampleQueries = [
    "Développeur Python senior fintech",
    "Data scientist ML expérimenté",
    "Full-stack React & Node.js",
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6 font-sans">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Brain className="h-5 w-5 text-blue-600" />
          Recherche Sémantique
        </h1>
      </div>

      {/* ── Search Card ── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">

        {/* Search bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="Ex : développeur Python senior avec expérience en fintech et React…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={searching || !query.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0"
          >
            {searching ? (
              <>
                <div className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Recherche…
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Rechercher
              </>
            )}
          </button>
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 bg-slate-50">
          <div className="flex items-center gap-2 min-w-[140px]">
            <Label className="text-xs text-slate-400 shrink-0">Mode</Label>
            <Select value={searchMode} onValueChange={setSearchMode}>
              <SelectTrigger className="h-7 text-xs border-slate-200 bg-white flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hybrid">
                  <div className="flex items-center gap-2">
                    <Zap className="h-3 w-3" />
                    Hybride
                  </div>
                </SelectItem>
                <SelectItem value="semantic">
                  <div className="flex items-center gap-2">
                    <Brain className="h-3 w-3" />
                    Sémantique
                  </div>
                </SelectItem>
                <SelectItem value="keyword">
                  <div className="flex items-center gap-2">
                    <Search className="h-3 w-3" />
                    Mots-clés
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 min-w-[140px]">
            <Label className="text-xs text-slate-400 shrink-0">Résultats</Label>
            <Select value={maxResults.toString()} onValueChange={(v) => setMaxResults(parseInt(v))}>
              <SelectTrigger className="h-7 text-xs border-slate-200 bg-white flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">Top 10</SelectItem>
                <SelectItem value="20">Top 20</SelectItem>
                <SelectItem value="50">Top 50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 min-w-[140px]">
            <Label className="text-xs text-slate-400 shrink-0">Score min.</Label>
            <Select value={minScore.toString()} onValueChange={(v) => setMinScore(parseFloat(v))}>
              <SelectTrigger className="h-7 text-xs border-slate-200 bg-white flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.1">≥ 10 %</SelectItem>
                <SelectItem value="0.3">≥ 30 %</SelectItem>
                <SelectItem value="0.5">≥ 50 %</SelectItem>
                <SelectItem value="0.7">≥ 70 %</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ── Error ── */}
      {searchError && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <Search className="h-4 w-4 shrink-0" />
          <span>Erreur lors de la recherche : {(searchError as any).message}</span>
        </div>
      )}

      {/* ── Results ── */}
      {searchResults && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">

          {/* Result header */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              <h2 className="text-sm font-semibold text-slate-800">Résultats</h2>
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                {searchResults.search_results.filter(r => r.hybrid_score >= minScore).length} / {searchResults.total_found}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                {searchMode === "hybrid" && (
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    Hybride
                  </div>
                )}
                {searchMode === "semantic" && (
                  <div className="flex items-center gap-1">
                    <Brain className="h-3 w-3" />
                    Sémantique
                  </div>
                )}
                {searchMode === "keyword" && (
                  <div className="flex items-center gap-1">
                    <Search className="h-3 w-3" />
                    Mots-clés
                  </div>
                )}
              </span>
            </div>
          
          </div>

          {/* Result list */}
          <div className="divide-y divide-slate-50">
            {searchResults.search_results.filter(r => r.hybrid_score >= minScore).length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Target className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-sm text-slate-500">Aucun candidat avec un score ≥ {Math.round(minScore * 100)}%</p>
                <p className="text-xs text-slate-400 mt-1">Essayez de baisser le score minimum</p>
              </div>
            )}
            {searchResults.search_results
  .filter((result) => result.hybrid_score >= minScore)
  .map((result, index) => (
              <div
                key={result.candidate_id}
                className="group flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 transition-colors"
              >
                {/* Rank */}
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                  {index + 1}
                </span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">{result.name}</p>
                  <p className="truncate text-xs text-slate-400">{result.email}</p>
                </div>

                {/* Score bar — right side */}
                <div className="hidden md:flex flex-col items-end gap-1 w-36 shrink-0">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs text-slate-400">Score</span>
                    <span className={`text-xs font-bold ${getScoreTextColor(result.hybrid_score)}`}>
                      {Math.round(result.hybrid_score * 100)} %
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${getScoreBg(result.hybrid_score)} transition-all duration-500`}
                      style={{ width: `${result.hybrid_score * 100}%` }}
                    />
                  </div>
                  <span className={`text-[11px] font-medium ${getScoreTextColor(result.hybrid_score)}`}>
                    {getScoreLabel(result.hybrid_score)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(result)}
                    className="h-8 px-3 text-xs border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    Détails
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleGenerateTest(result.candidate_id)}
                    className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    Voir profil
                    <ChevronRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {!searchResults && !searching && !searchError && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
            <Brain className="h-7 w-7 text-blue-400" />
          </div>
          <p className="text-sm font-medium text-slate-600">Lancez une recherche pour trouver vos candidats</p>
          <p className="text-xs text-slate-400 max-w-xs">Décrivez librement le profil idéal — l'IA comprend le contexte et les compétences connexes.</p>
        </div>
      )}

      {/* ── Detail Modal ── */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl p-0 gap-0">
          
          {selectedCandidate && (
            <>
              {/* ── Simplified Header ── */}
              <div className="px-6 py-4 border-b border-slate-100 bg-white rounded-t-2xl">
                <div className="flex items-start justify-between">

                  {/* Left: Identity */}
                  <div className="space-y-0.5">
                    <h3 className="text-base font-semibold text-slate-900">
                      {selectedCandidate.name}
                    </h3>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Mail className="h-3.5 w-3.5" />
                      {selectedCandidate.email}
                    </div>

                    {selectedCandidate.location && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <MapPin className="h-3 w-3" />
                        {selectedCandidate.location}
                      </div>
                    )}
                  </div>

                  {/* Right: Score */}
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-lg font-bold ${getScoreTextColor(selectedCandidate.hybrid_score)}`}>
                      {Math.round(selectedCandidate.hybrid_score * 100)}%
                    </span>
                    <Badge className={`text-[11px] px-2 py-0.5 ${getScoreColor(selectedCandidate.hybrid_score)}`}>
                      {getScoreLabel(selectedCandidate.hybrid_score)}
                    </Badge>
                  </div>

                </div>
              </div>

              <div className="px-6 py-5 space-y-5">

                {/* Score grid */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Analyse des scores</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Sémantique", score: selectedCandidate.semantic_score, icon: Brain, color: "blue" },
                      { label: "Mots-clés",  score: selectedCandidate.keyword_score,  icon: Search, color: "emerald" },
                      { label: "Hybride",    score: selectedCandidate.hybrid_score,   icon: Target, color: "violet" },
                    ].map(({ label, score, icon: Icon, color }) => (
                      <div key={label} className={`rounded-xl border bg-${color}-50 border-${color}-100 p-3 text-center`}>
                        <div className={`flex items-center justify-center gap-1 mb-1`}>
                          <Icon className={`h-3.5 w-3.5 text-${color}-500`} />
                          <span className={`text-xs font-medium text-${color}-600`}>{label}</span>
                        </div>
                        <div className={`text-2xl font-bold text-${color}-600`}>
                          {Math.round(score * 100)} %
                        </div>
                        <div className={`mt-2 h-1.5 w-full rounded-full bg-${color}-100`}>
                          <div
                            className={`h-full rounded-full bg-${color}-500 transition-all duration-500`}
                            style={{ width: `${score * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              

                {/* Tags sections */}
                {[
                  { title: "Compétences pertinentes", items: selectedCandidate.relevant_skills, className: "border-violet-200 text-violet-700 bg-violet-50" },
                  { title: "Compétences",                  items: selectedCandidate.skills,            className: "border-slate-200 text-slate-600 bg-slate-50" },
                  { title: "Mots-clés de la requête",      items: selectedCandidate.query_keywords,    className: "border-emerald-200 text-emerald-700 bg-emerald-50" },
                ].map(({ title, items, className }) => items.length > 0 && (
                  <div key={title}>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">{title}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {items.map((item, i) => (
                        <Badge key={i} variant="outline" className={`text-xs font-normal ${className}`}>
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}

               
                {/* CTA */}
                <div className="pt-1">
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 h-10 text-sm font-semibold"
                    onClick={() => { handleGenerateTest(selectedCandidate.candidate_id); setShowDetails(false); }}
                  >
                    Voir le profil complet
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>

              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SemanticSearchPage;