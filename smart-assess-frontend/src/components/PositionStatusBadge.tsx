import { Badge } from '@/components/ui/badge';

interface PositionStatusBadgeProps {
  position: any;
}

export const PositionStatusBadge: React.FC<PositionStatusBadgeProps> = ({ position }) => {
  
  const isActive = position.isActive === true;  
  return isActive ? (
    <Badge className="bg-green-100 text-green-800 border-green-300">
      Actif
    </Badge>
  ) : (
    <Badge variant="secondary">
      Inactif
    </Badge>
  );
};
