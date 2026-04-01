export interface Candidature {
  id: number;
  candidateId: number;
  candidateFirstName: string;
  candidateLastName: string;
  candidateEmail: string;
  candidatePhone: string;  // ✅ Rendu obligatoire
  
  // Propriétés pour compatibilité (premier poste)
  internshipPositionId?: number;
  positionTitle?: string;
  positionCompany?: string;
  positionDescription?: string;
  
  // Nouvelles propriétés pour plusieurs postes
  // ✅ DTO pour les postes (backend)
  positions?: Array<{
    id: number;
    title: string;
    company: string;
    description?: string;
    acceptedDomains?: string[];
    requiredSkills?: string[];
    isActive: boolean;
  }>;
  internshipPositions?: Array<{
    id: number;
    title: string;
    company: string;
    description?: string;
  }>; // ✅ Compatibilité ascendante
  positionIds?: number[];  // Pour la création/modification
  
  status: string;
  rejectionReason?: string;
  appliedAt: string;
  updatedAt?: string;
  
  // Données IA analysées
  candidateCVs?: Array<{
    id: number;
    candidateId: number;
    fileName: string;
    fileSizeBytes: number;
    parsingStatus: string;
    uploadDate: string;
    fileData?: any;
  }>;
  
  technicalProfiles?: Array<{
    id: number;
    cvId: number;
    createdAt: string;
    parsedData?: any;
  }>;
  
  // Propriétés supplémentaires pour l'analyse IA
  aiScore?: number;
  aiAnalysis?: any;
  parsedData?: any;
  domain?: string;
  technologies?: any;
  experienceYears?: number;
  skillLevel?: string;
  careerLevel?: string;
  certifications?: any;
  projects?: any;
  education?: any;
  workExperience?: any;
  experience?: any;
  technicalProfile?: any;
}