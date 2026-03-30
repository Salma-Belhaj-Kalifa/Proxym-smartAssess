import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Check, X, AlertCircle, ArrowLeft, User, FileText, Calendar, Mail, Phone, Edit } from "lucide-react";
import { useCandidatures } from '@/features/candidatures/candidaturesQueries';
import { useTechnicalProfileByCandidate } from '@/features/technical-profile/technicalProfileQueries';
import { useCheckExistingTest, useGenerateTest } from '@/features/tests/testsMutations';
import { useUpdateCandidatureStatus } from '@/features/candidatures/candidaturesMutations';
import { useCurrentUserSafe } from '@/features/auth/authQueries';
import { toast } from "sonner";
import { getStatusLabel, getStatusColor } from "@/utils/statusMappings";

interface CandidateData {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position: {
    id: number;
    title: string;
    company: string;
    acceptedDomains?: string[];
  };
  status: string;
  appliedAt: string;
  cvUrl?: string;
}

interface TechnicalProfileData {
  id: number;
  cvId?: number;
  candidateId?: number;
  parsedData: any;
  createdAt: string;
}

const GenerateTestPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: user } = useCurrentUserSafe();
  const { data: candidatures = [], isLoading: candidaturesLoading, error: candidaturesError } = useCandidatures();
  const checkExistingTestMutation = useCheckExistingTest();
  const generateTestMutation = useGenerateTest();
  const updateCandidatureStatusMutation = useUpdateCandidatureStatus();
  
  const [candidateData, setCandidateData] = useState<any>(null);
  
  // Calculer candidateId au niveau du composant (ID de la candidature)
  const candidateId = useMemo(() => {
    return candidateData?.id || (id && !isNaN(Number(id)) ? Number(id) : null);
  }, [candidateData?.id, id]);
  
  // ✅ CORRECT - Utiliser l'ID de l'URL comme candidateId et chercher par candidateId
  const separateCandidateId = useMemo(() => {
    console.log('=== SEPARATE CANDIDATE ID CALCUL ===');
    console.log('ID de l URL (id):', id);
    console.log('Type de id:', typeof id);
    console.log('Number(id):', Number(id));
    console.log('isNaN(Number(id)):', isNaN(Number(id)));
    
    // L'ID dans l'URL est le candidateId (136), pas la candidatureId (115)
    const urlCandidateId = id && !isNaN(Number(id)) ? Number(id) : null;
    console.log('urlCandidateId calculé:', urlCandidateId);
    
    if (urlCandidateId) {
      console.log('→ Retour urlCandidateId:', urlCandidateId);
      return urlCandidateId;
    }
    
    // Fallback : chercher dans les candidatures par candidateId
    const foundCandidature = candidatures.find(c => c.candidateId === Number(id));
    console.log('foundCandidature:', foundCandidature);
    if (foundCandidature?.candidateId) {
      console.log('→ Retour foundCandidature.candidateId:', foundCandidature.candidateId);
      return foundCandidature.candidateId;
    }
    
    // Dernier fallback : chercher dans candidateData
    console.log('→ Dernier fallback - candidateData?.candidateId:', candidateData?.candidateId);
    return candidateData?.candidateId || null;
  }, [candidateData?.candidateId, candidatures, id]);
  
  const [existingTest, setExistingTest] = useState<any>(null);
  const [isCheckingExistingTest, setIsCheckingExistingTest] = useState(false);
  const [testConfig, setTestConfig] = useState({
    level: "junior",
    questionCount: 10,
    duration: 30,
    deadline: "",
    note: ""
  });
  const [isLoading, setIsLoading] = useState(true);

  // Charger les données du candidat
  const loadCandidateData = async () => {
    if (!id) return;
      
    console.log('=== DÉBUT CHARGEMENT CANDIDAT ===');
    console.log('ID utilisé:', id);
    
    try {
      console.log('GenerateTestPage - ID reçu:', id);
      console.log('GenerateTestPage - Candidatures disponibles:', candidatures.map(c => ({ id: c.id, firstName: c.candidateFirstName, lastName: c.candidateLastName })));
        
      const storedCandidature = sessionStorage.getItem('selectedCandidature');
      let candidature;
        
      if (storedCandidature) {
        candidature = JSON.parse(storedCandidature);          
        sessionStorage.removeItem('selectedCandidature');
        console.log('GenerateTestPage - Candidature depuis sessionStorage:', candidature);
        console.log('GenerateTestPage - Données complètes reçues:', {
          candidateFirstName: candidature.candidateFirstName,
          candidateLastName: candidature.candidateLastName,
          candidateEmail: candidature.candidateEmail,
          positionTitle: candidature.positionTitle,
          positionCompany: candidature.positionCompany,
          aiScore: candidature.aiScore,
          hasParsedData: !!candidature.parsedData
        });
      } else {
        // Chercher la candidature avec l'ID
        console.log('GenerateTestPage - Recherche candidature ID:', id, 'dans:', candidatures);
        console.log('GenerateTestPage - Détails des candidatures:');
        candidatures.forEach((c, index) => {
          console.log(`  [${index}] ID: ${c.id}, Nom: ${c.candidateFirstName} ${c.candidateLastName}`);
        });
        candidature = candidatures.find(c => c.id.toString() === id.toString());
        console.log('GenerateTestPage - Candidature trouvée:', candidature);
      }
        
      console.log('GenerateTestPage - Candidature trouvée avec ID direct:', candidature ? 'OUI' : 'NON');
          
      // Si pas trouvé avec l'ID direct, essayer avec candidateId
      if (!candidature) {
        candidature = candidatures.find(c => c.candidateId === Number(id));
        console.log('GenerateTestPage - Candidature trouvée avec candidateId:', candidature ? 'OUI' : 'NON');
      }
          
      // Si toujours pas trouvé, essayer avec d'autres IDs possibles
      if (!candidature) {
        candidature = candidatures.find(c => 
          c.id === Number(id) || 
          c.candidateId === Number(id)
        );
        console.log('GenerateTestPage - Candidature trouvée avec recherche multiple:', candidature ? 'OUI' : 'NON');
      }
        
      if (!candidature) {
        console.error('No candidature data found');
        setIsLoading(false);
        return;
      }
        
      console.log('=== CANDIDATURE TROUVÉE ===');
      console.log('ID:', candidature.id);
      console.log('PositionTitle:', candidature.positionTitle);
      console.log('PositionCompany:', candidature.positionCompany);
      console.log('InternshipPositionId:', candidature.internshipPositionId);
      console.log('Candidature complète:', candidature);
      console.log('=== FIN CANDIDATURE ===');

      const candidateDataToSet = {
        id: candidature.id || Number(id),
        firstName: candidature.candidateFirstName || '',
        lastName: candidature.candidateLastName || '',
        email: candidature.candidateEmail || '',
        phone: candidature.candidatePhone || '',
        position: {
          id: candidature.internshipPositionId || 0,
          title: candidature.positionTitle || 'Poste non spécifié',
          company: candidature.positionCompany || 'Entreprise'
        },
        status: candidature.status || 'PENDING',
        appliedAt: candidature.appliedAt,
        cvUrl: candidature.cvUrl,
        aiScore: candidature.aiScore,
        aiAnalysis: candidature.aiAnalysis,
        // Ajouter les données IA complètes si disponibles
        parsedData: candidature.parsedData,
        domain: candidature.domain,
        technologies: candidature.technologies,
        experienceYears: candidature.experienceYears,
        skillLevel: candidature.skillLevel,
        careerLevel: candidature.careerLevel,
        certifications: candidature.certifications,
        projects: candidature.projects,
        education: candidature.education,
        workExperience: candidature.workExperience,
        experience: candidature.experience,
        technicalProfile: candidature.technicalProfile,
        candidateCVs: candidature.candidateCVs,
        technicalProfiles: candidature.technicalProfiles
      };
      
      console.log('=== CANDIDATE DATA TO SET ===');
      console.log('Position title:', candidateDataToSet.position.title);
      console.log('Position company:', candidateDataToSet.position.company);
      console.log('=== FIN CANDIDATE DATA TO SET ===');
   
      setCandidateData(candidateDataToSet);
      setIsLoading(false);
        
    } catch (error) {
      console.error('Error loading candidate data:', error);
      toast.error('Erreur lors du chargement des données du candidat');
      setIsLoading(false);
    }
  };

  // Charger les données du candidat quand les candidatures sont disponibles
  useEffect(() => {
    console.log('=== DEBUG CANDIDATURES ===');
    console.log('candidaturesLoading:', candidaturesLoading);
    console.log('candidaturesError:', candidaturesError);
    console.log('candidatures:', candidatures);
    console.log('candidatures.length:', candidatures.length);
    console.log('=== FIN DEBUG CANDIDATURES ===');
    
    // Si les candidatures sont chargées et qu'on a des données
    if (candidatures.length > 0 && !candidateData) {
      console.log('=== APPEL DE loadCandidateData ===');
      loadCandidateData();
    }
    // Solution de contournement: si pas de candidatures mais qu'on a un ID URL
    else if (!candidaturesLoading && candidatures.length === 0 && id && !candidateData) {
      console.log('=== CONTOURNEMENT: PAS DE CANDIDATURES MAIS ID URL DISPONIBLE ===');
      console.log('ID URL:', id);
      
      // Créer un candidateData minimal avec juste l'ID
      const minimalCandidateData = {
        id: Number(id),
        firstName: 'Candidat',
        lastName: `#${id}`,
        email: '',
        phone: '',
        position: {
          id: 0,
          title: 'Poste non spécifié',
          company: 'Entreprise'
        },
        status: 'PENDING'
      };
      
      console.log('Création candidateData minimal:', minimalCandidateData);
      setCandidateData(minimalCandidateData);
    }
  }, [candidatures, candidateData, id, candidaturesLoading, candidaturesError]);

  // Vérifier si un test existe dès qu'on a un ID (utiliser candidatureId au lieu de candidateId)
  useEffect(() => {
    console.log('=== USE EFFECT VÉRIFICATION TEST S\'EXÉCUTE ===');
    console.log('candidateData:', candidateData);
    console.log('candidateData?.id:', candidateData?.id);
    console.log('URL id:', id);
    console.log('candidateId calculé:', candidateId);
    console.log('=== FIN USE EFFECT VÉRIFICATION TEST ===');
    
    // Utiliser l'ID de la candidature (84) au lieu du candidateId (100) pour la vérification du test
    const testCheckId = candidateData?.id || (id && !isNaN(Number(id)) ? Number(id) : null);
    console.log('=== TEST CHECK ID ===');
    console.log('testCheckId:', testCheckId);
    console.log('candidateData?.id:', candidateData?.id);
    console.log('Number(id):', Number(id));
    console.log('=== FIN TEST CHECK ID ===');
    
    if (testCheckId) {
      console.log('=== CANDIDATE ID DISPO, VÉRIFICATION TEST ===');
      console.log('Test Check ID utilisé:', testCheckId);
      
      const timer = setTimeout(() => {
        console.log('APPEL DE checkExistingTest...');
        checkExistingTest(testCheckId);
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      console.log('=== PAS DE CANDIDATE ID DISPONIBLE ===');
      console.log('candidateData?.id:', candidateData?.id);
      console.log('id:', id);
      console.log('isNaN(Number(id)):', id ? isNaN(Number(id)) : 'id is null');
    }
  }, [candidateData?.id, id, candidateId]);

  // Utiliser le hook pour récupérer le technical profile du candidat
  const candidature = candidatures.find(c => c.id === Number(id));
  const [cvId, setCvId] = useState<number | null>(null);
  
  // Mettre à jour cvId quand les candidatures sont chargées
  useEffect(() => {
    if (candidatures.length > 0 && !cvId) {
      const newCvId = (candidature as any)?.candidateId || Number(id);
      setCvId(newCvId);
      console.log('=== MISE À JOUR CV ID ===');
      console.log('Nouveau CvId:', newCvId);
      console.log('Candidature trouvée:', candidature ? 'OUI' : 'NON');
      console.log('Candidature ID:', candidature?.id);
      console.log('Candidature CandidateId:', candidature?.candidateId);
      console.log('URL ID:', id);
      console.log('=== FIN MISE À JOUR ===');
    }
  }, [candidatures, id, cvId]);
  
  const { data: technicalProfileData, isLoading: technicalProfileLoading, error: technicalProfileError } = useTechnicalProfileByCandidate(cvId);

  // Logger l'état actuel pour le debugging
  useEffect(() => {
    console.log('=== NOUVELLE ARCHITECTURE ===');
    console.log('CvId pour technical profile:', cvId);
    console.log('CandidateId (candidature):', candidature?.candidateId);
    console.log('CandidateData ID:', candidateData?.id);
    console.log('ID from URL:', id);
    console.log('Candidatures chargées:', candidatures.length);
    console.log('=== FIN NOUVELLE ARCHITECTURE ===');
  }, [cvId, candidateData?.id, id, candidatures.length]);

  // Logger l'erreur technique du backend
  useEffect(() => {
    if (technicalProfileError) {
      console.log('=== ERREUR TECHNICAL PROFILE ===');
      console.log('Erreur:', technicalProfileError);
      console.log('Message:', (technicalProfileError as any)?.message);
      console.log('Status:', (technicalProfileError as any)?.response?.status);
      console.log('Data:', (technicalProfileError as any)?.response?.data);
      console.log('=== FIN ERREUR ===');
    }
  }, [technicalProfileError]);

  // Récupérer les données d'analyse CV du candidat
// Désactivé - utilise directement les données de la candidature pour éviter l'erreur 500
// const { data: cvAnalysisData, isLoading: cvAnalysisLoading } = useCVAnalysesByCandidate(
//   candidateData?.id ? (candidateData.id as any).cvId || candidateData.id : null
// );

  // Effet pour surveiller les changements du technical profile
  useEffect(() => {
    if (technicalProfileData) {
      console.log('=== ************************TECHNICAL PROFILE REÇU DU HOOK ===');
      console.log('Technical Profile Data:', technicalProfileData);
      console.log('ParsedData:', technicalProfileData?.parsedData);      console.log('Type:', typeof technicalProfileData);
      console.log('=== FIN TECHNICAL PROFILE ===');
    } else if (technicalProfileLoading === false && candidateData) {
      // N'afficher l'alerte que si le chargement est terminé ET qu'on a les données du candidat
      console.log('=== PAS DE DONNÉES IA TROUVÉES ===');
      console.log('Aucune donnée d\'analyse IA n\'a été trouvée pour ce candidat.');
      console.log('Veuillez contacter l\'administrateur système pour vérifier l\'analyse IA.');
      console.log('=== FIN ERREUR IA ===');
      
      // Afficher un message d'erreur clair à l'utilisateur
      toast.error('Aucune donnée d\'analyse IA trouvée. Veuillez contacter l\'administrateur.');
    }
  }, [technicalProfileData, technicalProfileLoading, candidateData, candidatures, id]);


  const finalIsLoading = !candidateData || technicalProfileLoading;
  const technicalProfile = technicalProfileData;

  // Logs pour déboguer le chargement
  console.log('=== DÉBOGAGE CHARGEMENT ===');
  console.log('candidateData:', candidateData);
  console.log('technicalProfileLoading:', technicalProfileLoading);
  console.log('finalIsLoading:', finalIsLoading);
  console.log('=== FIN DÉBOGAGE CHARGEMENT ===');

  useEffect(() => {
    console.log('CandidateData updated:', candidateData);
  }, [candidateData]);

  const checkExistingTest = async (testId: number) => {
    if (!testId) {
      console.log('No test check ID available');
      return;
    }
    
    console.log('=== CHECKING EXISTING TEST ===');
    console.log('Test Check ID utilisé:', testId);
    
    try {
      const response = await checkExistingTestMutation.mutateAsync(testId);
      
      if (response) {
        if (response.testId) {
          setExistingTest({
            existingTestId: response.testId,
            existingTestToken: (response as any).testToken || '',
            existingTestStatus: response.status,
            existingTestCreatedAt: (response as any).createdAt || new Date().toISOString()
          });
          console.log('Existing test set:', {
            existingTestId: response.testId,
            existingTestStatus: response.status
          });
          toast.info("Un test existe déjà pour ce candidat");
        } else {
          console.log('No existing test found');
          setExistingTest(null);
        }
      } else {
        console.log('No response data');
        setExistingTest(null);
      }
    } catch (error: any) {
      console.error('Error checking existing test:', error);
      setExistingTest(null);
      console.error('Error occurred while checking existing test, assuming no test exists');
      if (error.response?.status === 401) {
        toast.error('Session expirée, veuillez vous reconnecter');
      } else if (error.response?.status === 403) {
        toast.error('Vous n\'avez pas les permissions pour vérifier les tests');
      } else {
        toast.error('Erreur serveur lors de la vérification du test');
      }
    } finally {
      setIsCheckingExistingTest(false);
    }
  };

  const getCvUrl = () => {
    if (candidateData?.cvUrl) {
      return candidateData.cvUrl;
    }
    if (technicalProfileData?.cvId) {
      return `/api/candidates/download/${technicalProfileData.cvId}`;
    }
    
    if (candidateData?.id) {
      return `/api/candidates/download/candidature/${candidateData.id}`;
    }
    
    return null;
  };

  // Vérifier si un test existe dès qu'on a un ID (utiliser candidatureId au lieu de candidateId)
  useEffect(() => {

    // Utiliser l'ID de la candidature (84) au lieu du candidateId (100) pour la vérification du test
    const testCheckId = candidateData?.id || (id && !isNaN(Number(id)) ? Number(id) : null);
    if (testCheckId) {
      console.log('=== CANDIDATE ID DISPO, VÉRIFICATION TEST ===');
      console.log('Test Check ID utilisé:', testCheckId);
      
      const timer = setTimeout(() => {
        console.log('APPEL DE checkExistingTest...');
        checkExistingTest(testCheckId);
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      console.log('=== PAS DE CANDIDATE ID DISPONIBLE ===');
      console.log('candidateData?.id:', candidateData?.id);
      console.log('id:', id);
      console.log('isNaN(Number(id)):', id ? isNaN(Number(id)) : 'id is null');
    }
  }, [candidateData?.id, id, candidateId]);

  const candidatePositions = useMemo(() => {
    console.log('=== CANDIDATE POSITIONS CALCUL ===');
    console.log('separateCandidateId:', separateCandidateId);
    console.log('candidatures:', candidatures);
    
    if (!separateCandidateId) {
      console.log('→ separateCandidateId est null, retour []');
      return [];
    }
    
    // Récupérer toutes les candidatures du candidat OU de la candidature actuelle
    const allCandidateCandidatures = candidatures.filter(c => {
      // Chercher par candidateId OU par l'ID de la candidature actuelle
      return c.candidateId === separateCandidateId || c.id === Number(id);
    });
    console.log('allCandidateCandidatures:', allCandidateCandidatures);
    console.log('allCandidateCandidatures.length:', allCandidateCandidatures.length);
    
    // ✅ Extraire TOUS les postes de la nouvelle structure positions
    const allPositions: any[] = [];
    
    allCandidateCandidatures.forEach(candidature => {
      console.log(`=== ANALYSE CANDIDATURE ${candidature.id} ===`);
      console.log('Candidature complète:', JSON.stringify(candidature, null, 2));
      
      // Priorité 1: Utiliser le nouveau champ positions du backend
      if (candidature.positions && Array.isArray(candidature.positions) && candidature.positions.length > 0) {
        console.log('→ Utilisation de candidature.positions');
        candidature.positions.forEach((position: any) => {
          console.log('Position trouvée:', JSON.stringify(position, null, 2));
          const positionAcceptedDomains = (position as any).acceptedDomains || (position as any).domains || (position as any).requiredDomains || [];
          console.log('Domaines acceptés de cette position:', positionAcceptedDomains);
          
          allPositions.push({
            title: position.title,
            company: position.company,
            appliedAt: candidature.appliedAt,
            candidatureId: candidature.id,
            acceptedDomains: positionAcceptedDomains
          });
        });
      }
      // Priorité 2: Compatibilité avec internshipPositions
      else if (candidature.internshipPositions && Array.isArray(candidature.internshipPositions) && candidature.internshipPositions.length > 0) {
        console.log('→ Utilisation de candidature.internshipPositions');
        candidature.internshipPositions.forEach((position: any) => {
          console.log('InternshipPosition trouvée:', JSON.stringify(position, null, 2));
          const positionAcceptedDomains = (position as any).acceptedDomains || (position as any).domains || (position as any).requiredDomains || [];
          console.log('Domaines acceptés de cette internshipPosition:', positionAcceptedDomains);
          
          allPositions.push({
            title: position.title,
            company: position.company,
            appliedAt: candidature.appliedAt,
            candidatureId: candidature.id,
            acceptedDomains: positionAcceptedDomains
          });
        });
      }
      // Priorité 3: Ancienne structure pour compatibilité
      else if (candidature.positionTitle && candidature.positionTitle.trim() !== '') {
        console.log('→ Utilisation de la structure ancienne');
        console.log('Candidature (ancienne structure):', JSON.stringify(candidature, null, 2));
        const candidatureAcceptedDomains = (candidature as any).acceptedDomains || (candidature as any).domains || (candidature as any).requiredDomains || [];
        console.log('Domaines acceptés de la candidature:', candidatureAcceptedDomains);
        
        allPositions.push({
          title: candidature.positionTitle.trim(),
          company: candidature.positionCompany,
          appliedAt: candidature.appliedAt,
          candidatureId: candidature.id,
          acceptedDomains: candidatureAcceptedDomains
        });
      } else {
        console.log('→ Aucune structure de position trouvée pour cette candidature');
      }
    });
    
    return allPositions;
  }, [candidatures, separateCandidateId]);

  // Fonction pour définir des domaines par défaut selon le titre du poste
  const getDefaultDomainsForPosition = (positionTitle: string): string[] => {
    if (!positionTitle) return ['informatique'];
    
    const title = positionTitle.toLowerCase();
    
    // Mapping des titres de poste vers domaines acceptés
    if (title.includes('développeur') || title.includes('developer') || title.includes('developpeur')) {
      if (title.includes('frontend') || title.includes('front')) {
        return ['informatique', 'web development', 'ui/ux', 'software engineering'];
      } else if (title.includes('backend') || title.includes('back')) {
        return ['informatique', 'software engineering', 'database', 'devops'];
      } else if (title.includes('fullstack') || title.includes('full stack')) {
        return ['informatique', 'software engineering', 'web development', 'database'];
      } else if (title.includes('mobile') || title.includes('android') || title.includes('ios')) {
        return ['informatique', 'mobile development', 'software engineering'];
      } else {
        return ['informatique', 'software engineering', 'web development'];
      }
    }
    
    if (title.includes('data') || title.includes('analyste') || title.includes('analytics')) {
      return ['data science', 'informatique', 'database'];
    }
    
    if (title.includes('design') || title.includes('ui') || title.includes('ux')) {
      return ['ui/ux', 'web development', 'informatique'];
    }
    
    if (title.includes('devops') || title.includes('infrastructure') || title.includes('cloud')) {
      return ['devops', 'informatique', 'networking'];
    }
    
    if (title.includes('cyber') || title.includes('sécurité') || title.includes('security')) {
      return ['cybersecurity', 'informatique', 'networking'];
    }
    
    if (title.includes('réseau') || title.includes('network')) {
      return ['networking', 'informatique'];
    }
    
    if (title.includes('base de données') || title.includes('database') || title.includes('bdd')) {
      return ['database', 'informatique'];
    }
    
    if (title.includes('test') || title.includes('qa') || title.includes('qualité')) {
      return ['software engineering', 'informatique', 'quality assurance'];
    }
    
    // Domaine par défaut pour les autres cas
    return ['informatique'];
  };

  const getEligibilityChecks = () => {
    console.log('=== GET ELIGIBILITY CHECKS APPELÉ ===');
    console.log('separateCandidateId:', separateCandidateId);
    console.log('candidatePositions:', candidatePositions);
    console.log('candidatePositions.length:', candidatePositions?.length);
    
    const checks = [];
    const data = technicalProfile?.parsedData;
    
    console.log('=== DÉBOGAGE DOMAIN EXTRACTION ===');
    console.log('technicalProfile complet:', technicalProfile);
    console.log('parsedData complet:', data);
    console.log('Technical Information:', data?.["Technical Information"]);
    console.log('Domain depuis Technical Information:', data?.["Technical Information"]?.["domain"]);
    console.log('Type de parsedData:', typeof data);
    console.log('Type de Technical Information:', typeof data?.["Technical Information"]);
    console.log('=== FIN DÉBOGAGE DOMAIN ===');
    
    const candidateDomain = data?.["Technical Information"]?.["domain"];
    
    // Fonction helper pour vérifier l'éligibilité par poste
    const checkDomainEligibilityForPosition = (domain: string, acceptedDomainsList: string[]) => {
      if (!domain || domain === 'Unknown' || domain.trim() === '') return false;
      if (acceptedDomainsList.length === 0) return false;
      
      const normalizeDomain = (d: string) => {
        return d.toLowerCase()
          .trim()
          .replace(/[^\w\s]/g, '') 
          .replace(/\s+/g, ' '); 
      };
      
      const normalizedCandidate = normalizeDomain(domain);
      
      // Vérification directe
      return acceptedDomainsList.some(acceptedDomain => {
        const normalizedAccepted = normalizeDomain(acceptedDomain);
        if (normalizedAccepted === normalizedCandidate) return true;
        
        // Équivalences de domaines
        const domainEquivalences: { [key: string]: string[] } = {
          'software engineering': ['software engineering', 'ingénierie logicielle', 'développement logiciel', 'informatique', 'software development', 'programmation', 'coding', 'computer science', 'développement', 'development'],
          'informatique': ['informatique', 'software engineering', 'ingénierie logicielle', 'développement logiciel', 'software development', 'programmation', 'coding', 'computer science', 'développement', 'development'],
          'data science': ['data science', 'science des données', 'analyse de données', 'data analysis', 'big data', 'machine learning', 'ia', 'intelligence artificielle', 'artificial intelligence'],
          'web development': ['web development', 'développement web', 'web', 'site web', 'web design', 'frontend', 'back-end', 'fullstack', 'développeur web'],
          'mobile development': ['mobile development', 'développement mobile', 'mobile', 'android', 'ios', 'application mobile'],
          'cybersecurity': ['cybersecurity', 'cyber sécurité', 'sécurité informatique', 'sécurité', 'security'],
          'devops': ['devops', 'développement opérations', 'operations', 'infrastructure', 'cloud'],
          'ui/ux': ['ui/ux', 'design', 'design interface', 'design expérience utilisateur', 'user interface', 'user experience'],
          'networking': ['networking', 'réseau', 'réseaux', 'network', 'administration réseau'],
          'database': ['database', 'base de données', 'bdd', 'data', 'données'],
          'project management': ['project management', 'gestion de projet', 'management', 'chef de projet']
        };
        
        // Logique d'équivalences
        for (const [canonicalDomain, equivalents] of Object.entries(domainEquivalences)) {
          const normalizedCanonical = normalizeDomain(canonicalDomain);
          
          if (normalizedAccepted === normalizedCanonical) {
            const candidateMatches = equivalents.some(eq => normalizeDomain(eq) === normalizedCandidate);
            if (candidateMatches) return true;
          }
        }
        
        for (const [canonicalDomain, equivalents] of Object.entries(domainEquivalences)) {
          const normalizedCandidateInList = equivalents.some(eq => normalizeDomain(eq) === normalizedCandidate);
          if (normalizedCandidateInList) {
            const acceptedDomainInList = equivalents.some(eq => normalizeDomain(eq) === normalizedAccepted);
            if (acceptedDomainInList) return true;
          }
        }
        
        return false;
      });
    };
    
    // ✅ Correction: vérifier par rapport à TOUS les postes de la candidature
    let isEligibleForAnyPosition = false;
    let allAcceptedDomains = [];
    
    if (candidatePositions && candidatePositions.length > 0) {
      console.log('=== VÉRIFICATION TOUS LES POSTES ===');
      console.log('candidatePositions:', JSON.stringify(candidatePositions, null, 2));
      
      candidatePositions.forEach((position, index) => {
        console.log(`Poste ${index + 1}: ${position.title}`);
        console.log(`  Position complète:`, JSON.stringify(position, null, 2));
        console.log(`  Domaines acceptés bruts: ${position.acceptedDomains}`);
        console.log(`  Type de acceptedDomains: ${typeof position.acceptedDomains}`);
        console.log(`  Est un tableau: ${Array.isArray(position.acceptedDomains)}`);
        
        const positionAcceptedDomains = position.acceptedDomains || [];
        console.log(`  Domaines acceptés finaux: ${positionAcceptedDomains}`);
        allAcceptedDomains = [...allAcceptedDomains, ...positionAcceptedDomains];
        
        // Vérifier si éligible pour CE poste spécifique
        const isEligibleForThisPosition = checkDomainEligibilityForPosition(candidateDomain, positionAcceptedDomains);
        console.log(`  Éligible pour ce poste: ${isEligibleForThisPosition}`);
        
        if (isEligibleForThisPosition) {
          isEligibleForAnyPosition = true;
        }
      });
      
      console.log(`Domaine du candidat éligible pour AU MOINS UN poste: ${isEligibleForAnyPosition}`);
    } else if (candidateData?.position) {
      // Fallback ancienne structure
      const acceptedDomains = candidateData.position.acceptedDomains || [];
      allAcceptedDomains = acceptedDomains;
      isEligibleForAnyPosition = checkDomainEligibilityForPosition(candidateDomain, acceptedDomains);
    }
    
    // Informations des postes du candidat
    candidatePositions.forEach((position, index) => {
      checks.push({ 
        label: ` Poste ${index + 1} : ${position.title}`, 
        ok: true 
      });
    });  
    
    // Analyse du CV
    if (data) {
      // Domaine technique
      if (candidateDomain) {
        if (isEligibleForAnyPosition) {
          checks.push({ 
            label: ` Domaine : ${candidateDomain} — compatible avec les postes`, 
            ok: true 
          });
        } else {
          // Afficher tous les domaines acceptés pour tous les postes
          const uniqueAcceptedDomains = [...new Set(allAcceptedDomains)];
          checks.push({ 
            label: ` Domaine : ${candidateDomain} — non compatible avec les domaines requis (${uniqueAcceptedDomains.join(', ') || 'Non spécifié'})`, 
            ok: false 
          });
        }
      } else {
        checks.push({ 
          label: '⚠️ Domaine technique non détecté dans le CV', 
          ok: false 
        });
      }
      
      // Compétences techniques
      if (data["Technical Information"]?.["technologies"]) {
        const allSkills = [];
        Object.values(data["Technical Information"]["technologies"]).forEach(categorySkills => {
          if (Array.isArray(categorySkills)) {
            categorySkills.forEach(skill => {
              if (typeof skill === 'string' && skill.trim()) {
                allSkills.push(skill);
              } else if (skill && skill.name && skill.name.trim()) {
                allSkills.push(skill.name);
              }
            });
          }
        });
        
        if (allSkills.length > 0) {
          checks.push({ 
            label: ` ${allSkills.length} compétence(s) technique(s) détectée(s) : ${allSkills.slice(0, 3).join(', ')}${allSkills.length > 3 ? '...' : ''}`, 
            ok: true 
          });
        }
      }
      
      // Expérience
      const experience = data["Professional Experience"]?.["experience"];
      if (experience && experience.length > 0) {
        const totalYears = experience.reduce((sum, exp) => {
          const years = parseFloat(exp.duration?.split(' ')[0]) || 0;
          return sum + years;
        }, 0);
        
        checks.push({ 
          label: `📈 ${experience.length} expérience(s) professionnelle(s) détectée(s)`, 
          ok: totalYears >= 1 
        });
      }
      
      // Formation
      const education = data["Education"]?.["education"];
      if (education && education.length > 0) {
        const highestDegree = education.reduce((highest, edu) => {
          const degreeOrder = { 'bac': 1, 'licence': 2, 'master': 3, 'doctorat': 4 };
          const eduLevel = degreeOrder[edu.degree?.toLowerCase()] || 0;
          const highestLevel = degreeOrder[highest.degree?.toLowerCase()] || 0;
          return eduLevel > highestLevel ? edu : highest;
        }, education[0]);
        
        checks.push({ 
          label: ` Formation : ${highestDegree.degree} en ${highestDegree.field || 'spécialité non spécifiée'}`, 
          ok: true 
        });
      }
    } else {
      checks.push({ 
        label: '❌ CV non analysé ou données non disponibles', 
        ok: false 
      });
    }
    
    // Éligibilité finale
    const isEligible = isEligibleForAnyPosition && data && candidateDomain && candidateDomain !== 'Unknown';
    checks.push({ 
      label: isEligible ? ' Candidature éligible pour génération de test' : ' Candidature non éligible — domaine incompatible ou données manquantes', 
      ok: isEligible 
    });
    
    return checks;
  };

  const isCandidateEligible = () => {
    const data = technicalProfile?.parsedData;
    const candidateDomain = data?.["Technical Information"]?.["domain"];
    
    if (!candidateDomain || candidateDomain === 'Unknown' || candidateDomain.trim() === '') return false;
    
    // Utiliser la même logique que getEligibilityChecks mais simplifiée
    let isEligibleForAnyPosition = false;
    
    // Définir les équivalences de domaines une seule fois
    const domainEquivalences: { [key: string]: string[] } = {
      'software engineering': ['software engineering', 'ingénierie logicielle', 'développement logiciel', 'informatique', 'software development', 'programmation', 'coding', 'computer science', 'développement', 'development'],
      'informatique': ['informatique', 'software engineering', 'ingénierie logicielle', 'développement logiciel', 'software development', 'programmation', 'coding', 'computer science', 'développement', 'development'],
      'data science': ['data science', 'science des données', 'analyse de données', 'data analysis', 'big data', 'machine learning', 'ia', 'intelligence artificielle', 'artificial intelligence'],
      'web development': ['web development', 'développement web', 'web', 'site web', 'web design', 'frontend', 'back-end', 'fullstack', 'développeur web'],
      'mobile development': ['mobile development', 'développement mobile', 'mobile', 'android', 'ios', 'application mobile'],
      'cybersecurity': ['cybersecurity', 'cyber sécurité', 'sécurité informatique', 'sécurité', 'security'],
      'devops': ['devops', 'développement opérations', 'operations', 'infrastructure', 'cloud'],
      'ui/ux': ['ui/ux', 'design', 'design interface', 'design expérience utilisateur', 'user interface', 'user experience'],
      'networking': ['networking', 'réseau', 'réseaux', 'network', 'administration réseau'],
      'database': ['database', 'base de données', 'bdd', 'data', 'données'],
      'project management': ['project management', 'gestion de projet', 'management', 'chef de projet']
    };
    
    if (candidatePositions && candidatePositions.length > 0) {
      candidatePositions.forEach((position) => {
        const positionAcceptedDomains = position.acceptedDomains || [];
        
        // Utiliser la même fonction de vérification que getEligibilityChecks
        const checkDomainEligibilityForPosition = (domain: string, acceptedDomainsList: string[]) => {
          if (!domain || domain === 'Unknown' || domain.trim() === '') return false;
          if (acceptedDomainsList.length === 0) return false;
          
          const normalizeDomain = (d: string) => {
            return d.toLowerCase()
              .trim()
              .replace(/[^\w\s]/g, '') 
              .replace(/\s+/g, ' '); 
          };
          
          const normalizedCandidate = normalizeDomain(domain);
          
          // Vérification directe
          return acceptedDomainsList.some(acceptedDomain => {
            const normalizedAccepted = normalizeDomain(acceptedDomain);
            if (normalizedAccepted === normalizedCandidate) return true;
            
            // Logique d'équivalences
            for (const [canonicalDomain, equivalents] of Object.entries(domainEquivalences)) {
              const normalizedCanonical = normalizeDomain(canonicalDomain);
              
              if (normalizedAccepted === normalizedCanonical) {
                const candidateMatches = equivalents.some(eq => normalizeDomain(eq) === normalizedCandidate);
                if (candidateMatches) return true;
              }
            }
            
            for (const [canonicalDomain, equivalents] of Object.entries(domainEquivalences)) {
              const normalizedCandidateInList = equivalents.some(eq => normalizeDomain(eq) === normalizedCandidate);
              if (normalizedCandidateInList) {
                const acceptedDomainInList = equivalents.some(eq => normalizeDomain(eq) === normalizedAccepted);
                if (acceptedDomainInList) return true;
              }
            }
            
            return false;
          });
        };
        
        const isEligibleForThisPosition = checkDomainEligibilityForPosition(candidateDomain, positionAcceptedDomains);
        if (isEligibleForThisPosition) {
          isEligibleForAnyPosition = true;
        }
      });
    } else if (candidateData?.position) {
      // Fallback ancienne structure
      const acceptedDomains = (candidateData.position as any).acceptedDomains || [];
      if (acceptedDomains.length === 0) return false;
      
      const normalizeDomain = (d: string) => {
        return d.toLowerCase()
          .trim()
          .replace(/[^\w\s]/g, '') 
          .replace(/\s+/g, ' '); 
      };
      
      const normalizedCandidate = normalizeDomain(candidateDomain);
      
      isEligibleForAnyPosition = acceptedDomains.some(acceptedDomain => {
        const normalizedAccepted = normalizeDomain(acceptedDomain);
        if (normalizedAccepted === normalizedCandidate) return true;
        
        // Logique d'équivalences
        for (const [canonicalDomain, equivalents] of Object.entries(domainEquivalences)) {
          const normalizedCanonical = normalizeDomain(canonicalDomain);
          
          if (normalizedAccepted === normalizedCanonical) {
            const candidateMatches = equivalents.some(eq => normalizeDomain(eq) === normalizedCandidate);
            if (candidateMatches) return true;
          }
        }
        
        for (const [canonicalDomain, equivalents] of Object.entries(domainEquivalences)) {
          const normalizedCandidateInList = equivalents.some(eq => normalizeDomain(eq) === normalizedCandidate);
          if (normalizedCandidateInList) {
            const acceptedDomainInList = equivalents.some(eq => normalizeDomain(eq) === normalizedAccepted);
            if (acceptedDomainInList) return true;
          }
        }
        
        return false;
      });
    }
    
    return isEligibleForAnyPosition;
  };

  const handleForceGenerateTest = async () => {
    if (!candidateData || !technicalProfileData) {
      toast.error('Veuillez patienter que les données du candidat soient chargées');
      return;
    }

    // Extraire les compétences réelles du candidat
    const skills = extractSkillsFromProfile();
    console.log('=== GÉNÉRATION FORCÉE DE TEST AVEC COMPÉTENCES RÉELLES ===');
    console.log('Compétences extraites:', skills);
    console.log('Nombre de compétences:', skills.length);
    console.log('=== FIN COMPÉTENCES POUR GÉNÉRATION FORCÉE ===');

    try {
      // Utiliser l'approche simple de l'ancien code backend
      // Le backend utilise maintenant: technicalProfile.getParsedData() directement
      // Plus besoin d'envoyer des customInstructions structurées
      
      // Afficher un message d'attente plus informatif
      toast.loading('Génération forcée du test personnalisé en cours... Cela peut prendre jusqu\'à 60 secondes.', {
        duration: 0, // Ne pas auto-dismiss
        id: 'force-generate-test' // ID unique pour pouvoir le mettre à jour
      });
      
      // Appeler l'API avec le format simple (nouvelle structure)
      const testResponse = await generateTestMutation.mutateAsync({
        candidatureId: candidateData.id, // Garder pour compatibilité backend
        level: testConfig.level,
        questionCount: testConfig.questionCount,
        duration: testConfig.duration,
        deadline: testConfig.deadline,
        note: testConfig.note,
        focusAreas: skills.map(skill => skill.name), // Garder pour compatibilité
        // Plus besoin de customInstructions - le backend utilise technicalProfile.getParsedData()
      });
      
      console.log('Force generate - Test response received:', testResponse);
      console.log('Force generate - Test ID from response:', testResponse.testId);
      console.log('Force generate - Questions from response:', testResponse.questions);
      console.log('Force generate - Backend utilisera: technicalProfile.getParsedData() directement');
      
      // Stocker les questions générées dans le localStorage pour la page de révision
      if (testResponse.questions && testResponse.questions.length > 0) {
        const formattedQuestions = testResponse.questions.map((q: any, index: number) => ({
          id: index + 1,
          questionText: q.question,
          questionType: "MCQ",
          options: q.options || [],
          correctAnswer: q.correct_answer,
          skillTag: q.technology || "",
          maxScore: 1.0,
          orderIndex: index
        }));
        
        localStorage.setItem(`test_questions_${testResponse.testId}`, JSON.stringify(formattedQuestions));
        console.log('Force generate - Stored questions in localStorage:', formattedQuestions);
      }
      
      // Réinitialiser l'état du test existant
      setExistingTest(null);
      
      // Fermer le toast de chargement et afficher le succès
      toast.dismiss('force-generate-test');
      toast.success('Test personnalisé généré avec succès ! Redirection vers la révision...');
      
      // Rediriger vers la page de révision du test
      console.log('Force generate - Navigating to:', `/manager/test-review/${testResponse.testId}`);
      
      try {
        navigate(`/manager/test-review/${testResponse.testId}`);
        console.log('Force generate - Navigation successful');
      } catch (navError) {
        console.error('Force generate - Navigation error:', navError);
        toast.error('Erreur lors de la redirection vers la page de révision');
      }
      
    } catch (error: any) {
      // Fermer le toast de chargement
      toast.dismiss('force-generate-test');
      
      console.error('Error generating test:', error);
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
      
      // Gérer spécifiquement les erreurs de timeout
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        toast.error('La génération forcée du test a pris trop de temps. Veuillez réessayer avec moins de questions ou contacter l\'administrateur.');
        return;
      }
      
      if (error.response?.status === 409 && error.response?.data) {
        const errorData = error.response.data;
        
        if (errorData.error === "UN TEST EXISTE DÉJÀ") {
          setExistingTest({
            existingTestId: errorData.existingTestId,
            existingTestToken: errorData.existingTestToken,
            existingTestStatus: errorData.existingTestStatus,
            existingTestCreatedAt: errorData.existingTestCreatedAt
          });
          
          toast.error("Un test existe déjà pour cette candidature. Impossible de forcer la génération.");
          return;
        }
      }
      
      const errorMessage = error.response?.data?.message || error.message || 'Erreur inconnue';
      toast.error(`Erreur lors de la génération du test: ${errorMessage}`);
    }
  };

  const extractSkillsFromProfile = () => {
    console.log('extractSkillsFromProfile called, technicalProfile:', technicalProfile);
    
    if (!technicalProfile?.parsedData) {
      console.log('No parsedData in technicalProfile for skills');
      return [];
    }
    
    const data = technicalProfile.parsedData;
    console.log('=== STRUCTURE DES DONNÉES POUR COMPÉTENCES ===');
    console.log('Technical Information:', data["Technical Information"]);
    console.log('Technologies dans Technical Information:', data["Technical Information"]?.["technologies"]);
    console.log('=== FIN STRUCTURE COMPÉTENCES ===');
    
    const skills = [];
    let hasRealSkills = false;
    
    if (data["Technical Information"]?.["technologies"]) {
      const techData = data["Technical Information"]["technologies"];
      console.log('TechData trouvé:', techData);
      console.log('Type de TechData:', typeof techData);
      console.log('TechData est Array:', Array.isArray(techData));
      
      Object.keys(techData).forEach(category => {
        const categorySkills = techData[category];
        console.log(`Catégorie "${category}":`, categorySkills);
        
        if (Array.isArray(categorySkills)) {
          // Si c'est un tableau (ancien format)
          categorySkills.forEach((skill, index) => {
            console.log(`  Skill ${index}:`, skill, typeof skill);
            
            if (typeof skill === 'string' && skill.trim()) {
              skills.push({ name: skill.trim(), level: "Intermédiaire" });
              hasRealSkills = true;
              console.log(`    → Ajouté: ${skill.trim()}`);
            } else if (skill && typeof skill === 'object' && skill.name && skill.name.trim()) {
              skills.push({ name: skill.name.trim(), level: skill.level || "Intermédiaire" });
              hasRealSkills = true;
              console.log(`    → Ajouté (objet): ${skill.name.trim()}`);
            }
          });
        } else if (typeof categorySkills === 'object' && categorySkills !== null) {
          // Si c'est un objet (nouveau format: {GitLab: 'advanced', MySQL: 'intermediate'})
          Object.entries(categorySkills).forEach(([skillName, skillLevel]) => {
            console.log(`  Skill: ${skillName}, Level: ${skillLevel}`);
            
            if (typeof skillName === 'string' && skillName.trim()) {
              const level = typeof skillLevel === 'string' ? skillLevel : "Intermédiaire";
              skills.push({ name: skillName.trim(), level: level });
              hasRealSkills = true;
              console.log(`    → Ajouté: ${skillName.trim()} (${level})`);
            }
          });
        }
      });
    } else {
      console.log('Aucune donnée "Technical Information" ou "technologies" trouvée');
    }
    
    console.log('Compétences finales extraites:', skills);
    console.log('hasRealSkills:', hasRealSkills);
    
    return hasRealSkills ? skills.slice(0, 6) : [];
  };

  const extractAnalysisFromProfile = () => {
    console.log('extractAnalysisFromProfile called, technicalProfile:', technicalProfile);
    
    if (!technicalProfile?.parsedData) {
      console.log('No parsedData in technicalProfile');
      return null;
    }
    
    const data = technicalProfile.parsedData;
    console.log('=== STRUCTURE COMPLÈTE DES DONNÉES PARSED DATA ===');
    console.log('parsedData keys:', Object.keys(data));
    console.log('parsedData complet:', JSON.stringify(data, null, 2));
    console.log('Basic Information:', data["Basic Information"]);
    console.log('Technical Information:', data["Technical Information"]);
    console.log('Summary:', data["Summary"]);
    console.log('Certifications:', data["Certifications"]);
    console.log('Projects:', data["Projects"]);
    console.log('Education:', data["Education"]);
    console.log('=== FIN STRUCTURE COMPLÈTE ===');
    
    // Extraire les compétences clés
    const extractKeySkills = () => {
      const skills = [];
      
      // Depuis Technical Information
      if (data["Technical Information"]?.["technologies"]) {
        const techData = data["Technical Information"]["technologies"];
        Object.keys(techData).forEach(category => {
          const categorySkills = techData[category];
          if (Array.isArray(categorySkills)) {
            categorySkills.forEach((skill: any) => {
              if (typeof skill === 'string' && skill.trim()) {
                skills.push(skill.trim());
              } else if (skill && typeof skill === 'object' && skill.name) {
                skills.push(skill.name);
              }
            });
          } else if (typeof categorySkills === 'object' && categorySkills !== null) {
            Object.keys(categorySkills).forEach(skillName => {
              skills.push(skillName);
            });
          }
        });
      }
      
      // Depuis les projets
      if (data["Projects"] && Array.isArray(data["Projects"])) {
        data["Projects"].forEach((project: any) => {
          if (project.technologies && Array.isArray(project.technologies)) {
            project.technologies.forEach((tech: string) => {
              if (tech && tech.trim() && !skills.includes(tech.trim())) {
                skills.push(tech.trim());
              }
            });
          }
        });
      }
      
      // Éliminer les doublons et limiter à 10 compétences
      return [...new Set(skills)].slice(0, 10);
    };
    
    // Extraire les informations d'éducation
    const extractEducation = () => {
      if (data["Education"] && Array.isArray(data["Education"])) {
        console.log('=== STRUCTURE ÉDUCATION BRUTE ===');
        console.log('data["Education"]:', JSON.stringify(data["Education"], null, 2));
        
        const extracted = data["Education"].map((edu: any) => {
          console.log('Éducation individuelle:', edu);
          console.log('  edu.year:', edu.year);
          console.log('  edu.graduationYear:', edu.graduationYear);
          console.log('  edu.end_date:', edu.end_date);
          console.log('  edu.start_date:', edu.start_date);
          
          // Extraire l'année depuis end_date ou graduationYear ou year
          let extractedYear = edu.year || edu.graduationYear || edu.end_date;
          if (extractedYear) {
            // Extraire l'année depuis une date comme "July 2021" ou "June 2023"
            const yearMatch = extractedYear.match(/\b(19|20)\d{2}\b/);
            if (yearMatch) {
              extractedYear = yearMatch[0];
            }
          }
          
          const finalYear = extractedYear || 'Non spécifié';
          console.log('  année finale:', finalYear);
          
          return {
            degree: edu.degree || edu.diploma || 'Non spécifié',
            institution: edu.institution || edu.school || 'Non spécifié',
            year: finalYear,
            field: edu.field || edu.major || 'Non spécifié'
          };
        });
        
        console.log('=== STRUCTURE ÉDUCATION EXTRAIT ===');
        console.log('extracted:', extracted);
        
        return extracted;
      }
      return [];
    };
    
    // Extraire les certifications
    const extractCertifications = () => {
      if (data["Certifications"] && Array.isArray(data["Certifications"])) {
        console.log('=== STRUCTURE CERTIFICATIONS BRUTE ===');
        console.log('data["Certifications"]:', JSON.stringify(data["Certifications"], null, 2));
        
        const extracted = data["Certifications"].map((cert: any) => {
          console.log('Certification individuelle:', cert);
          console.log('  cert.certification_name:', cert.certification_name);
          console.log('  cert.name:', cert.name);
          console.log('  cert.issuing_organization:', cert.issuing_organization);
          console.log('  cert.issuer:', cert.issuer);
          console.log('  cert.issue_date:', cert.issue_date);
          console.log('  cert.year:', cert.year);
          
          return {
            name: cert.certification_name || cert.name || cert.title || 'Non spécifié',
            issuer: cert.issuing_organization || cert.issuer || cert.organization || 'Non spécifié',
            year: cert.issue_date || cert.year || 'Non spécifié'
          };
        });
        
        console.log('=== STRUCTURE CERTIFICATIONS EXTRAIT ===');
        console.log('extracted:', extracted);
        
        return extracted;
      }
      return [];
    };
    
    // Extraire les projets
    const extractProjects = () => {
      if (data["Projects"] && Array.isArray(data["Projects"])) {
        return data["Projects"].map((project: any) => ({
          name: project.name || project.title || 'Non spécifié',
          description: project.description || project.summary || 'Non spécifié',
          technologies: project.technologies || project.tech_stack || [],
          duration: project.duration || project.period || 'Non spécifié'
        }));
      }
      return [];
    };
    
    // Extraire le domaine et le niveau
    const extractDomainAndLevel = () => {
      const techInfo = data["Technical Information"] || {};
      const summary = data["Summary"] || {};
      
      return {
        domain: techInfo.domain || 'Non spécifié',
        level: summary.skill_level || techInfo.level || 'Non spécifié',
        experience: summary.experience_years || techInfo.experience || 'Non spécifié',
        score: summary.overall_score || techInfo.score || 0
      };
    };
    
    // Retourner une structure riche pour une meilleure UI
    const profileData = {
      // Informations personnelles
      personalInfo: {
        fullName: data["Basic Information"]?.["full_name"] || "",
        email: data["Basic Information"]?.["email"] || "",
        phone: data["Basic Information"]?.["phone"] || ""
      },
      
      // Expertise et niveau
      expertise: extractDomainAndLevel(),
      
      // Statistiques
      stats: {
        skillsCount: extractKeySkills().length,
        projectsCount: data["Projects"]?.length || 0,
        certificationsCount: data["Certifications"]?.length || 0,
        educationCount: data["Education"]?.length || 0
      },
      
      // Compétences clés
      keySkills: extractKeySkills(),
      
      // Éducation
      education: extractEducation(),
      
      // Certifications
      certifications: extractCertifications(),
      
      // Projets
      projects: extractProjects(),
      
      // Résumé du profil
      summary: data["Summary"]?.["summary"] || `Candidat avec score IA de ${data["Summary"]?.["overall_score"] || 0}/10. Expérience de ${data["Summary"]?.["experience_years"] || "non spécifiée"} ans. Niveau ${data["Summary"]?.["skill_level"] || "non spécifié"} en développement.`
    };
    
    console.log('Profile data for UI:', profileData);
    return profileData;
  };

  const extractLevelFromProfile = (data: any) => {
    return data["Summary"]?.["skill_level"] || "Non spécifié";
  };

  const extractExperienceFromProfile = (data: any) => {
    return data["Summary"]?.["experience_years"] || "Non spécifié";
  };

  const cvUrl = getCvUrl();

  const downloadCV = async () => {
    if (!cvUrl) return;
    
    try {
      const response = await fetch(`http://localhost:8080${cvUrl}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement du CV');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `CV_${candidateData?.firstName}_${candidateData?.lastName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('CV téléchargé avec succès');
    } catch (error) {
      console.error('Error downloading CV:', error);
      toast.error('Erreur lors du téléchargement du CV');
    }
  };

  const openCV = async () => {
    if (!cvUrl) return;
    
    try {
      const response = await fetch(`http://localhost:8080${cvUrl}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'ouverture du CV');
      }
      
      const blob = await response.blob();
      
      const blobUrl = URL.createObjectURL(blob);
      
      const newWindow = window.open(blobUrl, '_blank');
      
      if (newWindow) {
        newWindow.focus();
        toast.success('CV ouvert dans un nouvel onglet');
        
        setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
        }, 10000); // 10 secondes
      } else {
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `CV_${candidateData?.firstName}_${candidateData?.lastName}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.info('Le popup a été bloqué. Le CV a été téléchargé à la place.');
        
        setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
        }, 1000);
      }
      
    } catch (error) {
      console.error('Error opening CV:', error);
      toast.error('Erreur lors de l\'ouverture du CV');
    }
  };

  const handleGenerateTest = async () => {
    if (!candidateData || !technicalProfileData) {
      toast.error('Veuillez patienter que les données du candidat soient chargées');
      return;
    }

    // Extraire les compétences réelles du candidat
    const skills = extractSkillsFromProfile();

    try {
      // Utiliser l'approche simple de l'ancien code backend
      // Le backend utilise maintenant: technicalProfile.getParsedData() directement
      // Plus besoin d'envoyer des customInstructions structurées
      
      // Afficher un message d'attente plus informatif
      toast.loading('Génération du test personnalisé en cours... Cela peut prendre jusqu\'à 60 secondes.', {
        duration: 0, // Ne pas auto-dismiss
        id: 'generate-test' // ID unique pour pouvoir le mettre à jour
      });
      
      // Appeler l'API avec le format simple (nouvelle structure)
      const testResponse = await generateTestMutation.mutateAsync({
        candidatureId: candidateData.id, // Garder pour compatibilité backend
        level: testConfig.level,
        questionCount: testConfig.questionCount,
        duration: testConfig.duration,
        deadline: testConfig.deadline,
        note: testConfig.note,
        focusAreas: skills.map(skill => skill.name), // Garder pour compatibilité
        // Plus besoin de customInstructions - le backend utilise technicalProfile.getParsedData()
      });
      

      // Stocker les questions générées dans le localStorage pour la page de révision
      if (testResponse.questions && testResponse.questions.length > 0) {
        const formattedQuestions = testResponse.questions.map((q: any, index: number) => ({
          id: index + 1,
          questionText: q.question,
          questionType: "MCQ",
          options: q.options || [],
          correctAnswer: q.correct_answer,
          skillTag: q.technology || "",
          maxScore: 1.0,
          orderIndex: index
        }));
        
        localStorage.setItem(`test_questions_${testResponse.testId}`, JSON.stringify(formattedQuestions));
        console.log('Normal generate - Stored questions in localStorage:', formattedQuestions);
      }
      
      // Réinitialiser l'état du test existant
      setExistingTest(null);
      
      // Fermer le toast de chargement et afficher le succès
      toast.dismiss('generate-test');
      toast.success('Test personnalisé généré avec succès ! Redirection vers la révision...');
      
      // Rediriger vers la page de révision du test
      console.log('Normal generate - Navigating to:', `/manager/test-review/${testResponse.testId}`);
      
      try {
        navigate(`/manager/test-review/${testResponse.testId}`);
        console.log('Normal generate - Navigation successful');
      } catch (navError) {
        console.error('Normal generate - Navigation error:', navError);
        toast.error('Erreur lors de la redirection vers la page de révision');
      }
      
    } catch (error: any) {
      // Fermer le toast de chargement
      toast.dismiss('generate-test');
      
      console.error('Error generating test:', error);
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
      
      // Gérer spécifiquement les erreurs de timeout
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        toast.error('La génération du test a pris trop de temps. Veuillez réessayer avec moins de questions ou contacter l\'administrateur.');
        return;
      }
      
      // Si c'est une erreur 409, gérer le cas du test existant
      if (error.response?.status === 409 && error.response?.data) {
        const errorData = error.response.data;
        
        if (errorData.error === "UN TEST EXISTE DÉJÀ") {
          // Mettre à jour l'état pour refléter le test existant
          setExistingTest({
            existingTestId: errorData.existingTestId,
            existingTestToken: errorData.existingTestToken,
            existingTestStatus: errorData.existingTestStatus,
            existingTestCreatedAt: errorData.existingTestCreatedAt
          });
          
          // Si des questions sont retournées dans l'erreur 409, les stocker
          if (errorData.questions && errorData.questions.length > 0) {
            const formattedQuestions = errorData.questions.map((q: any, index: number) => ({
              id: index + 1,
              questionText: q.question,
              questionType: "MCQ",
              options: q.options || [],
              correctAnswer: q.correct_answer,
              skillTag: q.technology || "",
              maxScore: 1.0,
              orderIndex: index
            }));
            
            localStorage.setItem(`test_questions_${errorData.existingTestId}`, JSON.stringify(formattedQuestions));
            console.log('Stored questions from 409 response to localStorage:', formattedQuestions);
          }
          
          toast.info("Un test existe déjà pour cette candidature. Redirection vers le test existant...");
          
          setTimeout(() => {
            navigate(`/manager/test-review/${errorData.existingTestId}`);
          }, 2000);
          return;
        }
      }
      
      const errorMessage = error.response?.data?.message || error.message || 'Erreur inconnue';
      toast.error(`Erreur lors de la génération du test: ${errorMessage}`);
    }
  };

  const handleReject = async () => {
    if (!candidateData) return;
    
    try {
      await updateCandidatureStatusMutation.mutateAsync({
        id: candidateData.id,
        status: 'REJECTED'
      });
      
      toast.success('Candidature refusée');
      navigate('/manager/candidats');
      
    } catch (error) {
      console.error('Error rejecting candidature:', error);
      toast.error('Erreur lors du refus de la candidature');
    }
  };

  if (finalIsLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!candidateData) {
    return (
      <div className="p-6 lg:p-8 max-w-5xl mx-auto text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Candidature non trouvée</h3>
        <Button onClick={() => navigate('/manager/candidats')} className="mt-4">
          Retour aux candidats
        </Button>
      </div>
    );
  }

  const skills = extractSkillsFromProfile();
  const analysis: any = extractAnalysisFromProfile();
  const eligibility = getEligibilityChecks();

  // Fonction pour gérer l'affichage de l'analyse (ancien format ou nouveau)
  const renderAnalysis = () => {
    if (!analysis) return null;
    
    // Si c'est une chaîne (ancien format), utiliser l'ancien rendu
    if (typeof analysis === 'string' && analysis.length > 0) {
      return (
        <div className="text-sm text-muted-foreground whitespace-pre-line">
          {analysis.split('\n').map((line, index) => {
            if (line.startsWith('**') && line.endsWith('**')) {
              return (
                <div key={index} className="font-semibold text-foreground mt-2">
                  {line.replace(/\*\*/g, '')}
                </div>
              );
            }
            if (line.startsWith('- ')) {
              return (
                <div key={index} className="ml-4">
                  • {line.substring(2)}
                </div>
              );
            }
            return (
              <div key={index}>
                {line}
              </div>
            );
          })}
        </div>
      );
    }
    
    // Si c'est un objet (nouveau format), utiliser le nouveau rendu structuré
    if (typeof analysis === 'object' && analysis !== null) {
      return (
        <div className="space-y-4">
          {analysis.personalInfo && (
            <div>
              <h4 className="font-semibold text-foreground">Informations personnelles</h4>
              <p className="text-sm text-muted-foreground">
                {analysis.personalInfo.fullName} • {analysis.personalInfo.email}
              </p>
            </div>
          )}
          
          {analysis.expertise && (
            <div>
              <h4 className="font-semibold text-foreground mb-3">Expertise</h4>
              <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">Domaine:</span>
                  <Badge variant="outline" className="text-xs">
                    {analysis.expertise.domain}
                  </Badge>
                </div>
              </div>
            </div>
          )}
          
          {analysis.education && Array.isArray(analysis.education) && analysis.education.length > 0 && (
            <div>
              <h4 className="font-semibold text-foreground mb-3">Éducation</h4>
              <div className="text-sm text-muted-foreground">
                {(() => {
                  // Trouver l'éducation la plus récente
                  const mostRecentEducation = analysis.education.reduce((mostRecent: any, edu: any) => {
                    // Si c'est la première itération, retourner l'élément actuel
                    if (!mostRecent) {
                      console.log('Première itération - retourne:', edu);
                      return edu;
                    }
                    
                    // Si l'éducation actuelle n'a pas d'année valide
                    if (!mostRecent.year || mostRecent.year === 'Non spécifié') {
                      console.log('mostRecent year invalide - retourne edu:', edu);
                      return edu;
                    }
                    
                    // Si l'éducation en cours n'a pas d'année valide
                    if (!edu.year || edu.year === 'Non spécifié') {
                      console.log('edu year invalide - garde mostRecent:', mostRecent);
                      return mostRecent;
                    }
                    
                    // Comparer les années (convertir en nombre si possible)
                    const mostRecentYear = parseInt(mostRecent.year) || 0;
                    const eduYear = parseInt(edu.year) || 0;
                    
                    console.log('Comparaison années:', {
                      mostRecentYear,
                      eduYear,
                      mostRecentDegree: mostRecent.degree,
                      eduDegree: edu.degree,
                      comparison: eduYear > mostRecentYear
                    });
                    
                    // CORRECTION: L'année la plus élevée est la plus récente
                    return eduYear > mostRecentYear ? edu : mostRecent;
                  }, null);
                  
                  console.log('Éducation la plus récente trouvée:', mostRecentEducation);
                  
                  if (!mostRecentEducation) {
                    return null;
                  }
                  
                  const hasValidInfo = mostRecentEducation.degree && mostRecentEducation.degree !== 'Non spécifié' && 
                                       mostRecentEducation.institution && mostRecentEducation.institution !== 'Non spécifié';
                  
                  if (!hasValidInfo) {
                    return null;
                  }
                  
                  return (
                    <div className="p-3 bg-muted/30 rounded border border-muted/50">
                      <div className="font-medium text-foreground">{mostRecentEducation.degree}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {mostRecentEducation.institution}
                        {mostRecentEducation.year && mostRecentEducation.year !== 'Non spécifié' && ` • ${mostRecentEducation.year}`}
                      </div>
                      {mostRecentEducation.field && mostRecentEducation.field !== 'Non spécifié' && (
                        <div className="text-xs text-muted-foreground">{mostRecentEducation.field}</div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
          {analysis.summary && (
            <div>
              <h4 className="font-semibold text-foreground">Résumé du profil</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {analysis.summary}
              </p>
            </div>
          )}
          {analysis.certifications && Array.isArray(analysis.certifications) && analysis.certifications.length > 0 && (
            <div>
              <h4 className="font-semibold text-foreground mb-3">Certifications</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                {console.log('=== RENDERING CERTIFICATIONS ===')}
                {console.log('analysis.certifications:', analysis.certifications)}
                {console.log('analysis.certifications.length:', analysis.certifications.length)}
                {analysis.certifications.map((cert: any, index: number) => {
                  console.log(`Rendering certification ${index}:`, cert);
                  
                  // Vérifier si la certification a des informations valides
                  const hasValidInfo = cert.name && cert.name !== 'Non spécifié';
                  console.log(`Certification ${index}: hasValidInfo=${hasValidInfo}, name="${cert.name}", issuer="${cert.issuer}"`);
                  
                  if (!hasValidInfo) {
                    console.log(`Masquer certification ${index} car infos invalides`);
                    return null;
                  }
                  
                  console.log(`Afficher certification ${index}`);
                  return (
                    <div key={index} className="p-3 bg-muted/30 rounded border border-muted/50">
                      <div className="font-medium text-foreground">{cert.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {cert.issuer}
                        {cert.year && cert.year !== 'Non spécifié' && ` • ${cert.year}`}
                      </div>
                    </div>
                  );
                }).filter(Boolean)}
              </div>
            </div>
          )}
          
          {analysis.projects && Array.isArray(analysis.projects) && analysis.projects.length > 0 && (
            <div>
              <h4 className="font-semibold text-foreground mb-3">Projets notables</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                {analysis.projects.slice(0, 3).map((project: any, index: number) => {
                  // Vérifier si le projet a des informations valides
                  const hasValidInfo = project.name && project.name !== 'Non spécifié';
                  
                  if (!hasValidInfo) {
                    return null;
                  }
                  
                  return (
                    <div key={index} className="p-3 bg-muted/30 rounded border border-muted/50">
                      <div className="font-medium text-foreground">{project.name}</div>
                      {project.description && project.description !== 'Non spécifié' && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {project.description.length > 120 
                            ? `${project.description.slice(0, 120)}...` 
                            : project.description
                          }
                        </div>
                      )}
                      {project.technologies && Array.isArray(project.technologies) && project.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {project.technologies.slice(0, 5).map((tech: string, techIndex: number) => (
                            <Badge key={techIndex} variant="outline" className="text-xs">
                              {tech}
                            </Badge>
                          ))}
                          {project.technologies.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{project.technologies.length - 5}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }).filter(Boolean)}
                {analysis.projects.length > 3 && (
                  <div className="text-xs text-muted-foreground mt-2 text-center">
                    ... et {analysis.projects.length - 3} autre(s) projet(s)
                  </div>
                )}
              </div>
            </div>
          )}
          
          
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/manager/candidats')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Décision — Génération du test</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Candidature #{candidateData.id} · {candidateData.firstName} {candidateData.lastName} · 
              {candidatePositions.map((pos, index) => 
                `${pos.title}${index < candidatePositions.length - 1 ? ', ' : ''}`
              ).join('')}
            </p>
          </div>
        </div>
        <Badge variant="outline" className={getStatusColor(candidateData.status === 'REJECTED' ? candidateData.status : (existingTest?.existingTestStatus || candidateData.status))}>
          {candidateData.status === 'REJECTED' ? getStatusLabel(candidateData.status) : (existingTest?.existingTestStatus ? getStatusLabel(existingTest.existingTestStatus) : getStatusLabel(candidateData.status))}
        </Badge>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Candidate Profile */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary">Profil candidat</Badge>
              {technicalProfileData && <Badge variant="outline">Analyse IA disponible</Badge>}
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary">
                {candidateData.firstName ? candidateData.firstName[0] : ''}{candidateData.lastName ? candidateData.lastName[0] : ''}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {candidateData.firstName} {candidateData.lastName}
                </h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-3 h-3" />
                  {candidateData.email}
                </div>
                {candidateData.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-3 h-3" />
                    {candidateData.phone}
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  Candidature du {new Date(candidateData.appliedAt).toLocaleDateString('fr-FR')}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="text-center glass-card p-2">
                <div className="text-sm font-bold text-success">
                  {technicalProfileData ? 'ANALYSÉ' : 'NON ANALYSÉ'}
                </div>
                <div className="text-xs text-muted-foreground">Statut IA</div>
              </div>
            </div>

            <div className="glass-card p-4 mb-4">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Analyse IA du CV</h3>
              </div>
              
              {analysis ? (
                renderAnalysis()
              ) : technicalProfileData ? (
                <div className="text-sm text-muted-foreground">
                  Analyse IA du CV en cours de traitement...
                </div>
              ) : (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  <p className="text-xs mb-2">
                    Le CV de ce candidat n'a pas été analysé par l'IA.
                  </p>
                </div>
              )}
            </div>

            {/* Section CV */}
            <div className="glass-card p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">CV du candidat</h3>
              </div>
              
              {cvUrl ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">CV disponible</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadCV}
                        className="text-xs"
                      >
                        Télécharger
                      </Button>
                    </div>
                  </div>
                  
                  {technicalProfileData?.cvId && (
                    <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
                      <div className="flex items-center gap-1 mb-1">
                        <Check className="w-3 h-3 text-blue-600" />
                        <span className="font-medium text-blue-600">CV analysé par l'IA</span>
                      </div>
                      <p>L'analyse a été effectuée sur ce fichier le {new Date(technicalProfileData.createdAt).toLocaleDateString('fr-FR')}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center p-4 bg-muted/20 rounded-lg">
                  <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">CV non disponible</p>
                  <p className="text-xs text-muted-foreground mt-1">Le candidat n'a pas encore uploadé de CV</p>
                  {technicalProfileData ? (
                    <p className="text-xs text-gray-400 mt-2">Profil technique trouvé mais cvId: {technicalProfileData.cvId || 'non défini'}</p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-2">Aucun profil technique trouvé (pas d'analyse IA)</p>
                  )}
                  <div className="mt-3 p-2 bg-yellow-50 rounded text-xs text-yellow-700">
                    <p>Pour que le CV soit disponible, le candidat doit :</p>
                    <ul className="mt-1 text-left">
                      <li>• Uploader un CV lors de sa candidature</li>
                      <li>• Le CV doit être analysé par l'IA</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-foreground mb-3">Vérification d'éligibilité</h3>
            <div className="space-y-2 mb-4">
              {eligibility.map((e, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  {e.ok ? (
                    <Check className="w-4 h-4 text-success mt-0.5 shrink-0" />
                  ) : (
                    <X className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                  )}
                  <span className={e.ok ? "text-muted-foreground" : "text-destructive"}>
                    {e.label}
                  </span>
                </div>
              ))}
            </div>
            <div className={`rounded-lg p-3 text-center ${
              isCandidateEligible() 
                ? "bg-success/10 border border-success/20" 
                : "bg-destructive/10 border border-destructive/20"
            }`}>
              <Badge className={`mb-1 ${
                isCandidateEligible() 
                  ? "bg-success text-success-foreground" 
                  : "bg-destructive text-destructive-foreground"
              }`}>
                {isCandidateEligible() ? "Candidat ÉLIGIBLE" : "Candidat NON ÉLIGIBLE"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Right: Test Config */}
        <div className="space-y-6">
          {/* Configuration du test - Masquer SEULEMENT si un test existe en statut DRAFT */}
          {(() => {
            console.log('=== DÉCISION SECTION CONFIGURATION ===');
            console.log('existingTest:', existingTest);
            console.log('existingTest?.existingTestId:', existingTest?.existingTestId);
            console.log('existingTest?.existingTestStatus:', existingTest?.existingTestStatus);
            console.log('existingTest?.existingTestStatus type:', typeof existingTest?.existingTestStatus);
            console.log('isCheckingExistingTest:', isCheckingExistingTest);
            
            // Masquer la configuration si un test existe et n'est pas en statut DRAFT
            // (c'est-à-dire : READY, IN_PROGRESS, SUBMITTED, EVALUATED, etc.)
            const shouldHideConfig = !isCheckingExistingTest && 
              existingTest?.existingTestId && 
              existingTest?.existingTestStatus !== 'DRAFT';
            
            console.log('shouldHideConfig calculé:', shouldHideConfig);
            console.log('Détail calcul:');
            console.log('  !isCheckingExistingTest:', !isCheckingExistingTest);
            console.log('  existingTest?.existingTestId:', existingTest?.existingTestId);
            console.log('  existingTest?.existingTestStatus !== DRAFT:', existingTest?.existingTestStatus !== 'DRAFT');
            console.log('  existingTest?.existingTestStatus === "READY":', existingTest?.existingTestStatus === 'READY');
            console.log('  shouldHideConfig (&& operation):', shouldHideConfig);
            console.log('=== FIN DÉCISION SECTION CONFIGURATION ===');
            
            // Afficher la configuration si shouldHideConfig est false
            return !shouldHideConfig;
          })() && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Configuration du test à générer</h3>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Postes du candidat</Label>
                  <div className="mt-1 p-3 bg-muted rounded-md">
                    {candidatePositions
                      .map((pos, index) => (
                        <div key={`${pos.candidatureId}-${pos.title}-${index}`} className="mb-1">
                          <span className="font-medium">Poste {index + 1}:</span> {pos.title || 'Poste non spécifié'}
                        </div>
                      ))}
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Niveau du test</Label>
                  <Select value={testConfig.level} onValueChange={(value) => setTestConfig(prev => ({ ...prev, level: value }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Sélectionner le niveau" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="junior">JUNIOR</SelectItem>
                      <SelectItem value="intermediate">INTERMEDIATE</SelectItem>
                      <SelectItem value="senior">SENIOR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Nombre de questions</Label>
                  <Input
                    type="number"
                    min="5"
                    max="50"
                    value={testConfig.questionCount}
                    onChange={(e) => setTestConfig(prev => ({ ...prev, questionCount: parseInt(e.target.value) || 5 }))}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">(entre 5 et 50 questions)</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Durée du test</Label>
                  <Input
                    type="number"
                    min="15"
                    max="180"
                    value={testConfig.duration}
                    onChange={(e) => setTestConfig(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">minutes</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Date limite de passage</Label>
                  <Input
                    type="date"
                    value={testConfig.deadline}
                    onChange={(e) => setTestConfig(prev => ({ ...prev, deadline: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Note au candidat (optionnelle)</Label>
                  <Textarea
                    value={testConfig.note}
                    onChange={(e) => setTestConfig(prev => ({ ...prev, note: e.target.value }))}
                    placeholder="Message personnalisé..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Décision du Manager</h3>
                <p className="text-sm text-muted-foreground">
                  {candidateData.status === 'REJECTED' 
                    ? "Cette candidature a été refusée."
                    : existingTest 
                    ? "Un test a déjà été généré pour ce candidat. Vous pouvez consulter les résultats ou refuser la candidature."
                    : "Générez un test technique personnalisé pour évaluer les compétences du candidat."
                  }
                </p>
              </div>
            </div>
            </div>
            
            {existingTest && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Test déjà généré</span>
                </div>
                <div className="text-sm text-blue-800">
                  <p><strong>Date de génération :</strong> {new Date(existingTest.existingTestCreatedAt).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <p><strong>Statut du test :</strong> <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                    existingTest.existingTestStatus === 'READY' ? 'bg-green-100 text-green-800' :
                    existingTest.existingTestStatus === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                    existingTest.existingTestStatus === 'SUBMITTED' ? 'bg-blue-100 text-blue-800' :
                    existingTest.existingTestStatus === 'EVALUATED' ? 'bg-purple-100 text-purple-800' :
                    existingTest.existingTestStatus === 'DRAFT' ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {getStatusLabel(existingTest.existingTestStatus)}
                  </span></p>
                  {existingTest.existingTestStatus === 'DRAFT' && (
                    <p className="mt-2 text-orange-700 font-medium">
                      📝 Le test est en cours de traitement. Vous pouvez le modifier en cliquant sur "Revoir le test".
                    </p>
                  )}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {candidateData.status === 'REJECTED' ? (
                <div className="col-span-2 text-center py-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    La candidature a été refusée.
                  </p>
                  {existingTest && existingTest.existingTestStatus === 'SUBMITTED' && (
                    <Button 
                      variant="outline"
                      onClick={() => navigate(`/manager/test-results/${existingTest.existingTestId}`)}
                      className="flex items-center gap-2 mx-auto"
                    >
                      <Check className="w-4 h-4" />
                      Voir les résultats du test
                    </Button>
                  )}
                </div>
              ) : existingTest ? (
                <>
                  {existingTest.existingTestStatus === 'DRAFT' && (
                    <Button 
                      variant="default"
                      onClick={() => navigate(`/manager/test-review/${existingTest.existingTestId}`)}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                    >
                      <Edit className="w-4 h-4" />
                      Revoir le test
                    </Button>
                  )}
                  
                  {existingTest.existingTestStatus === 'SUBMITTED' && (
                    <Button 
                      variant="default"
                      onClick={() => navigate(`/manager/test-results/${existingTest.existingTestId}`)}
                      className="flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Voir résultats
                    </Button>
                  )}
                  
                  {existingTest.existingTestStatus === 'SUBMITTED' && (
                    <Button 
                      variant="destructive"
                      onClick={handleReject}
                      disabled={updateCandidatureStatusMutation.isPending}
                      className="bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700 flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      {updateCandidatureStatusMutation.isPending ? 'Refus...' : 'Refuser'}
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button 
                    className="flex items-center gap-2" 
                    onClick={handleGenerateTest}
                    disabled={updateCandidatureStatusMutation.isPending}
                  >
                    <Sparkles className="w-4 h-4" />
                    {updateCandidatureStatusMutation.isPending ? 'Génération en cours...' : 'Générer le test'}
                  </Button>
                  
                  <Button 
                    variant="destructive"
                    onClick={handleReject}
                    disabled={updateCandidatureStatusMutation.isPending}
                    className="bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700 flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    {updateCandidatureStatusMutation.isPending ? 'Refus...' : 'Refuser'}
                  </Button>
                </>
              )}
            </div>
            
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 flex items-start gap-2">
                <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                <span>
                  {existingTest 
                    ? existingTest.existingTestStatus === 'SUBMITTED' 
                      ? "Le test a été soumis par le candidat. Vous pouvez consulter les résultats."
                      : existingTest.existingTestStatus === 'READY'
                      ? "Le test est prêt et a été envoyé au candidat. En attente de sa réponse."
                      : existingTest.existingTestStatus === 'IN_PROGRESS'
                      ? "Le test est en cours par le candidat."
                      : existingTest.existingTestStatus === 'EVALUATED'
                      ? "Le test a été évalué et les résultats sont disponibles."
                      : "Le test est en cours de traitement."
                    : `Le test sera généré automatiquement par notre service IA. Un lien d'accès unique sera envoyé à <strong>${candidateData?.email}</strong>.`}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

export default GenerateTestPage;
