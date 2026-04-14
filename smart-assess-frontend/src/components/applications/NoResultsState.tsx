import { Search } from 'lucide-react';

interface NoResultsStateProps {
  searchTerm: string;
}

export default function NoResultsState({ searchTerm }: NoResultsStateProps) {
  return (
    <div className="text-center py-12">
      <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune candidature trouvée</h3>
      <p className="text-gray-600">
        Aucune candidature ne correspond à votre recherche "{searchTerm}".
      </p>
    </div>
  );
}
