interface PositionsHeaderProps {
  title?: string;
  subtitle?: string;
}

export default function PositionsHeader({ 
  title = "Découvrez nos opportunités", 
  subtitle = "Explorez les positions disponibles et postulez à celles qui correspondent à votre profil" 
}: PositionsHeaderProps) {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        {title}
      </h1>
      <p className="text-lg text-gray-600 mb-8">
        {subtitle}
      </p>
    </div>
  );
}
