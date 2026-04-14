import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Position } from '@/features/positions/types';

interface SelectionSummaryProps {
  selectedPositions: number[];
  positions: Position[];
}

export default function SelectionSummary({ selectedPositions, positions }: SelectionSummaryProps) {
  if (selectedPositions.length === 0) return null;

  return (
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
  );
}
