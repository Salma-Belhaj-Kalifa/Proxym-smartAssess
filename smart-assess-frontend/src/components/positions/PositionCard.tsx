import { Clock, Check, Briefcase, MapPin, Building } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Position } from '@/features/positions/types';

interface PositionCardProps {
  position: Position;
  isSelected: boolean;
  onSelect: (positionId: number) => void;
  isDisabled: boolean;
}

export default function PositionCard({ position, isSelected, onSelect, isDisabled }: PositionCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
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
        </div>
        <div className="ml-4">
          <Button
            variant={isSelected ? "default" : "outline"}
            onClick={() => onSelect(position.id)}
            disabled={!isSelected && isDisabled}
            className={`whitespace-nowrap transition-all duration-200 px-4 py-2 ${
              isSelected
                ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-lg hover:shadow-xl"
                : "border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
            }`}
          >
            <div className="flex items-center gap-2">
              {isSelected ? (
                <Check className="w-4 h-4" />
              ) : (
                <div className="w-4 h-4 border-2 border-gray-400 rounded"></div>
              )}
              <span>
                {isSelected ? 'Sélectionné' : 'Sélectionner'}
              </span>
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
