import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ApplicationsFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
}

export default function ApplicationsFilters({ 
  searchTerm, 
  onSearchChange, 
  placeholder = "Rechercher une candidature..." 
}: ApplicationsFiltersProps) {
  return (
    <div className="mb-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
    </div>
  );
}
