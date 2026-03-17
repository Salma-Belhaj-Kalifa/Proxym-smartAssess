export const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'PENDING':
      return 'En attente de décision';
    case 'TEST_SENT':
      return 'Test envoyé';
    case 'IN_PROGRESS':
      return 'Test en cours';
    case 'COMPLETED':
      return 'Test terminé';
    case 'ACCEPTED':
      return 'Accepté';
    case 'REJECTED':
      return 'Rejeté';
    case 'INELIGIBLE':
      return 'Non éligible';
    case 'VALIDATED':
      return 'Validé';
    default:
      return status;
  }
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'PENDING':
      return 'text-warning border-warning/50';
    case 'TEST_SENT':
      return 'text-blue-600 border-blue-200';
    case 'IN_PROGRESS':
      return 'text-orange-600 border-orange-200';
    case 'COMPLETED':
      return 'text-emerald-700 border-emerald-300 bg-emerald-50';
    case 'ACCEPTED':
      return 'text-green-700 border-green-300 bg-green-50';
    case 'REJECTED':
      return 'text-red-600 border-red-200';
    case 'INELIGIBLE':
      return 'text-red-600 border-red-200';
    case 'VALIDATED':
      return 'text-blue-600 border-blue-200';
    default:
      return 'text-gray-600 border-gray-200';
  }
};

export const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'PENDING':
      return 'outline';
    case 'TEST_SENT':
      return 'secondary';
    case 'IN_PROGRESS':
      return 'secondary';
    case 'COMPLETED':
      return 'default';
    case 'ACCEPTED':
      return 'default';
    case 'REJECTED':
      return 'destructive';
    case 'INELIGIBLE':
      return 'destructive';
    case 'VALIDATED':
      return 'default';
    default:
      return 'outline';
  }
};

export const getStatusBadgeClass = (status: string): string => {
  const baseClass = getStatusColor(status);
  const variant = getStatusVariant(status);
  
  // Classes supplémentaires pour les statuts importants
  switch (status) {
    case 'COMPLETED':
      return `${baseClass} font-semibold shadow-sm hover:shadow-md transition-shadow`;
    case 'ACCEPTED':
      return `${baseClass} font-semibold shadow-sm hover:shadow-md transition-shadow`;
    default:
      return baseClass;
  }
};
