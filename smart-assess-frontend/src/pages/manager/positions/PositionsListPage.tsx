import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Users, Briefcase, TrendingUp, Eye, ArrowRight, Loader2, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import apiClient from "@/lib/api";

interface Position {
  id: number;
  title: string;
  company: string;
  candidateCount: number;
  pendingCount: number;
  acceptedCount: number;
  description?: string;
}

const PositionsListPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [positions, setPositions] = useState<Position[]>([]);
  const [filteredPositions, setFilteredPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    fetchPositions();
  }, []);

  useEffect(() => {
    filterPositions();
  }, [positions, searchTerm, filterStatus]);

  const fetchPositions = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  const filterPositions = () => {
    let filtered = [...positions];
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(position => 
        position.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        position.company.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by status
    switch (filterStatus) {
      case "candidates":
        filtered = filtered.filter(p => p.candidateCount > 0);
        break;
      case "pending":
        filtered = filtered.filter(p => p.pendingCount > 0);
        break;
      case "accepted":
        filtered = filtered.filter(p => p.acceptedCount > 0);
        break;
      case "empty":
        filtered = filtered.filter(p => p.candidateCount === 0);
        break;
    }
    
    setFilteredPositions(filtered);
  };

  const getStatusColor = (position: Position) => {
    if (position.candidateCount === 0) return "bg-gray-100 text-gray-800";
    if (position.acceptedCount > 0) return "bg-green-100 text-green-800";
    if (position.pendingCount > 0) return "bg-yellow-100 text-yellow-800";
    return "bg-blue-100 text-blue-800";
  };

  const getStatusLabel = (position: Position) => {
    if (position.candidateCount === 0) return "Aucun candidat";
    if (position.acceptedCount > 0) return `${position.acceptedCount} accepté(s)`;
    if (position.pendingCount > 0) return `${position.pendingCount} en attente`;
    return `${position.candidateCount} candidat(s)`;
  };

  const getMatchButtonLabel = (candidateCount: number) => {
    if (candidateCount === 0) return "Voir les détails";
    if (candidateCount === 1) return "Analyser le candidat";
    return `Analyser ${candidateCount} candidats`;
  };

  if (loading) {
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
          <h1 className="text-3xl font-bold text-foreground">Postes et Matching</h1>
          <p className="text-sm text-muted-foreground">
            Analysez les candidats et trouvez les meilleures correspondances
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">{positions.length}</div>
                <p className="text-sm text-muted-foreground">Total postes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {positions.reduce((sum, p) => sum + p.candidateCount, 0)}
                </div>
                <p className="text-sm text-muted-foreground">Total candidats</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {positions.reduce((sum, p) => sum + p.acceptedCount, 0)}
                </div>
                <p className="text-sm text-muted-foreground">Candidats acceptés</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {positions.reduce((sum, p) => sum + p.pendingCount, 0)}
                </div>
                <p className="text-sm text-muted-foreground">En attente</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un poste ou une entreprise..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les postes</SelectItem>
                <SelectItem value="candidates">Avec candidats</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="accepted">Acceptés</SelectItem>
                <SelectItem value="empty">Sans candidats</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Positions List */}
      <div className="space-y-4">
        {filteredPositions.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Aucun poste trouvé</h3>
                <p className="text-muted-foreground">
                  {searchTerm || filterStatus !== "all" 
                    ? "Essayez de modifier vos filtres" 
                    : "Aucun poste n'est disponible pour le moment"}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredPositions.map((position) => (
            <Card key={position.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{position.title}</h3>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {position.company}
                      </Badge>
                      <Badge className={getStatusColor(position)}>
                        {getStatusLabel(position)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{position.candidateCount} candidat(s)</span>
                      </div>
                      {position.pendingCount > 0 && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span>{position.pendingCount} en attente</span>
                        </div>
                      )}
                      {position.acceptedCount > 0 && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>{position.acceptedCount} accepté(s)</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/manager/positions/${position.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Détails
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => navigate(`/manager/matching/${position.id}`)}
                      disabled={position.candidateCount === 0}
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      {getMatchButtonLabel(position.candidateCount)}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Results Summary */}
      {filteredPositions.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Affichage de {filteredPositions.length} sur {positions.length} poste(s)
        </div>
      )}
    </div>
  );
};

export default PositionsListPage;
