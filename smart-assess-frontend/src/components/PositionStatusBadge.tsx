import { Badge } from '@/components/ui/badge';

interface PositionStatusBadgeProps {
  position: any;
}

export const PositionStatusBadge: React.FC<PositionStatusBadgeProps> = ({ position }) => {
  
  // Utiliser directement les données passées en props, pas un appel API séparé
  const isActive = position.isActive === true;
  
  console.log(`PositionStatusBadge - Position ${position.id}: isActive = ${isActive} (raw: ${position.isActive})`);
  
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
