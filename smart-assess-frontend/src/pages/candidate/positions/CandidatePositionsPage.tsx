import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Briefcase, MapPin, Building, Clock, Users, Check, Plus, ChevronRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePositions } from '@/features/positions/positionsQueries';
import type { Position } from '@/features/positions/types';

// Import des nouveaux composants
import PositionsHeader from '@/components/positions/PositionsHeader';
import PositionCard from '@/components/positions/PositionCard';
import SelectionSummary from '@/components/positions/SelectionSummary';

const CandidatePositionsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPositions, setSelectedPositions] = useState<number[]>([]);

  // Utiliser le hook usePositions pour récupérer les positions
  const { data: positionsData = [], isLoading, error } = usePositions();

  // Utiliser useMemo pour le filtrage - évite la boucle infinie
  const filteredPositions = useMemo(() => {
    if (!positionsData || positionsData.length === 0) {
      return [];
    }
    
    return positionsData.filter(position => {
      return (
        position.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        position.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        position.requiredSkills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });
  }, [positionsData, searchTerm]);

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
        <div className="text-lg text-red-500">{error?.message || 'Une erreur est survenue'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <PositionsHeader />

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
        <SelectionSummary 
          selectedPositions={selectedPositions}
          positions={positionsData}
        />

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
              <PositionCard
                key={position.id}
                position={position}
                isSelected={selectedPositions.includes(position.id)}
                onSelect={togglePositionSelection}
                isDisabled={!selectedPositions.includes(position.id) && selectedPositions.length >= 3}
              />
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
