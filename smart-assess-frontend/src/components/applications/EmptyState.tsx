import { FileText } from 'lucide-react';

interface EmptyStateProps {
  searchTerm?: string;
}

export default function EmptyState({ searchTerm }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="mb-6">
        <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
      </div>
      <h3 className="text-xl font-semibold text-gray-600 mb-2">
        {searchTerm ? 'Aucune candidature trouvée' : 'Aucune candidature'}
      </h3>
      <p className="text-gray-500">
        {searchTerm 
          ? 'Essayez d\'autres termes de recherche' 
          : 'Commencez par déposer votre CV ou postuler aux offres disponibles'
        }
      </p>
    </div>
  );
}
