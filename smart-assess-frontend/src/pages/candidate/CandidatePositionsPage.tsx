import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Briefcase, MapPin, Building, Clock, Users, Check, Plus, ChevronRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePositions } from '@/features/positions/positionsQueries';
import type { Position } from '@/features/positions/types';

const CandidatePositionsPage: React.FC = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [filteredPositions, setFilteredPositions] = useState<Position[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPositions, setSelectedPositions] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Utiliser le hook usePositions pour récupérer les positions
  const { data: positionsData = [], isLoading: isLoadingPositions, error: errorPositions } = usePositions();

  useEffect(() => {
    setPositions(positionsData);
    setIsLoading(isLoadingPositions);
    setError(errorPositions?.message || null);
  }, [positionsData, isLoadingPositions, errorPositions]);

  useEffect(() => {
    // Charger les positions sélectionnées depuis localStorage
    const saved = localStorage.getItem('selectedPositions');
    if (saved) {
      setSelectedPositions(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    // Sauvegarder les positions sélectionnées dans localStorage
    localStorage.setItem('selectedPositions', JSON.stringify(selectedPositions));
  }, [selectedPositions]);

  useEffect(() => {
    const filtered = positions.filter(position => {
      return (
        position.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        position.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        position.requiredSkills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });
    setFilteredPositions(filtered);
  }, [searchTerm, positions]);

  const togglePositionSelection = (positionId: number) => {
    if (selectedPositions.includes(positionId)) {
      setSelectedPositions(selectedPositions.filter(id => id !== positionId));
    } else if (selectedPositions.length < 3) {
      setSelectedPositions([...selectedPositions, positionId]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Chargement des positions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Découvrez nos opportunités
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Explorez les positions disponibles et postulez à celles qui correspondent à votre profil
          </p>
        </div>

        {/* Barre de recherche */}
        <div className="flex gap-4 items-center max-w-2xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Rechercher par titre, compétence ou mot-clé..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 text-lg"
            />
          </div>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline" 
            className="h-12 px-4"
            disabled={isLoading}
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Positions sélectionnées */}
        {selectedPositions.length > 0 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Positions sélectionnées ({selectedPositions.length}/3)
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedPositions.map(id => {
                      const position = positions.find(p => p.id === id);
                      return position ? (
                        <Badge key={id} variant="secondary" className="bg-blue-100 text-blue-800">
                          {position.title}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
                <Link to="/candidat/soumettre-candidature">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Continuer vers la candidature
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Liste des positions */}
        <div className="grid gap-6">
          {filteredPositions.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Aucune position trouvée
                </h3>
                <p className="text-gray-600">
                  {searchTerm 
                    ? 'Essayez de modifier votre recherche.'
                    : 'Revenez plus tard pour découvrir de nouvelles opportunités.'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredPositions.map((position) => (
              <Card key={position.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {position.title}
                        </h3>
                        <Badge variant={position.isActive === true ? 'default' : 'secondary'}>
                          {position.isActive === true ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {position.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {position.requiredSkills.slice(0, 5).map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {position.requiredSkills.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{position.requiredSkills.length - 5}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                  
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>Publié le {new Date(position.createdAt).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <Button
                        variant={selectedPositions.includes(position.id) ? "default" : "outline"}
                        onClick={() => togglePositionSelection(position.id)}
                        disabled={!selectedPositions.includes(position.id) && selectedPositions.length >= 3}
                        className={`whitespace-nowrap transition-all duration-200 px-4 py-2 ${
                          selectedPositions.includes(position.id)
                            ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-lg hover:shadow-xl"
                            : "border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {selectedPositions.includes(position.id) ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <div className="w-4 h-4 border-2 border-gray-400 rounded"></div>
                          )}
                          <span>
                            {selectedPositions.includes(position.id) ? 'Sélectionné' : 'Sélectionner'}
                          </span>
                        </div>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Message d'aide */}
        <Card className="bg-gray-50">
            <CardContent className="p-6 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Prêt à postuler ?
              </h3>
              <p className="text-gray-600 mb-4">
                Sélectionnez jusqu'à 3 positions qui vous intéressent, puis soumettez votre candidature en un seul clic.
              </p>
            </CardContent>
          </Card>
      </div>
    </div>
  );
};

export default CandidatePositionsPage;
