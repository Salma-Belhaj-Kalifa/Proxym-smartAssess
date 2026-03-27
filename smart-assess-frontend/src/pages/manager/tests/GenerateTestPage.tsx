import { useState, useEffect } from "react";
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

  // Vérifier si un test existe dès qu'on a un ID (URL ou candidateData)
  useEffect(() => {
    console.log('=== USE EFFECT VÉRIFICATION TEST S\'EXÉCUTE ===');
    console.log('candidateData:', candidateData);
    console.log('candidateData?.id:', candidateData?.id);
    console.log('URL id:', id);
    console.log('=== FIN USE EFFECT VÉRIFICATION TEST ===');
    
    // Utiliser soit candidateData.id soit l'ID de l'URL
    const candidateId = candidateData?.id || (id && !isNaN(Number(id)) ? Number(id) : null);
    
    console.log('Candidate ID calculé:', candidateId);
    
    if (candidateId) {
      console.log('=== CANDIDATE ID DISPO, VÉRIFICATION TEST ===');
      console.log('Candidate ID utilisé:', candidateId);
      
      const timer = setTimeout(() => {
        console.log('APPEL DE checkExistingTest...');
        checkExistingTest();
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      console.log('=== PAS DE CANDIDATE ID DISPONIBLE ===');
      console.log('candidateData?.id:', candidateData?.id);
      console.log('id:', id);
      console.log('isNaN(Number(id)):', id ? isNaN(Number(id)) : 'id is null');
    }
  }, [candidateData?.id, id]);

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

  // Créer un technical profile fallback à partir des données de la candidature
  const createFallbackTechnicalProfile = () => {
    if (!candidateData) return null;
    
    console.log('=== CRÉATION DU FALLBACK TECHNICAL PROFILE ===');
    console.log('CandidateData:', candidateData);
    
    // Chercher la candidature correspondante pour plus de données
    const candidature = candidatures.find(c => c.id === Number(id));
    console.log('Candidature trouvée pour fallback:', candidature);
    
    // Log détaillé de toutes les propriétés de la candidature
    if (candidature) {
      console.log('=== ANALYSE COMPLÈTE DE LA CANDIDATURE ===');
      console.log('ID:', candidature.id);
      console.log('CandidateId:', candidature.candidateId);
      console.log('AI Score:', candidature.aiScore);
      console.log('AI Analysis:', candidature.aiAnalysis);
      console.log('ParsedData:', candidature.parsedData);
      console.log('TechnicalProfile:', (candidature as any).technicalProfile);
      console.log('Domain:', (candidature as any).domain);
      console.log('Technologies:', (candidature as any).technologies);
      console.log('ExperienceYears:', (candidature as any).experienceYears);
      console.log('SkillLevel:', (candidature as any).skillLevel);
      console.log('CareerLevel:', (candidature as any).careerLevel);
      console.log('Certifications:', (candidature as any).certifications);
      console.log('Projects:', (candidature as any).projects);
      console.log('Education:', (candidature as any).education);
      console.log('WorkExperience:', (candidature as any).workExperience);
      console.log('Experience:', (candidature as any).experience);
      console.log('Toutes les clés:', Object.keys(candidature));
      console.log('=== FIN ANALYSE CANDIDATURE ===');
    }
    
    const fallbackProfile = {
      id: candidateData.id,
      cvId: candidature?.candidateId || candidateData.id,
      candidateId: candidature?.candidateId || candidateData.id,
      parsedData: candidature?.aiAnalysis || candidature?.parsedData || (candidature as any)?.technicalProfile?.parsedData || {
        "Basic Information": {
          "full_name": `${candidateData.firstName} ${candidateData.lastName}`,
          "email": candidateData.email,
          "phone": candidateData.phone || ""
        },
        "Technical Information": {
          "domain": (candidature as any)?.domain || "Backend Development",
          "technologies": (candidature as any)?.technologies || {
            "Frontend": ["React", "TypeScript", "Tailwind CSS"],
            "Backend": ["Node.js", "Express", "MongoDB"],
            "Tools": ["Git", "Docker", "VS Code"]
          }
        },
        "Summary": {
          "overall_score": (candidature as any)?.aiScore || 0,
          "experience_years": (candidature as any)?.experienceYears || "2-3",
          "skill_level": (candidature as any)?.skillLevel || "Intermédiaire",
          "career_level": (candidature as any)?.careerLevel || "Intermédiaire",
          "recommendation": (candidature as any)?.aiScore && (candidature as any)?.aiScore >= 7 ? "Recommandé" : "À évaluer",
          "summary": `Candidat avec ${(candidature as any)?.aiScore || 0}/10 de score IA. Expérience de ${(candidature as any)?.experienceYears || "2-3"} ans. Niveau ${(candidature as any)?.skillLevel || "Intermédiaire"} en développement. ${(candidature as any)?.aiScore && (candidature as any)?.aiScore >= 7 ? "Profil recommandé pour le poste." : "Profil à évaluer davantage."}`
        },
        // Ajouter des données réelles si elles existent dans la candidature
        "Certifications": (candidature as any)?.certifications || [],
        "Projects": (candidature as any)?.projects || [],
        "Education": (candidature as any)?.education || [],
        "Work Experience": (candidature as any)?.workExperience || (candidature as any)?.experience || []
      },
      createdAt: (candidature as any)?.createdAt || new Date().toISOString()
    };
    
    console.log('Fallback technical profile créé:', fallbackProfile);
    console.log('=== FIN FALLBACK ===');
    
    return fallbackProfile;
  };

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

  const checkExistingTest = async () => {
    // Utiliser soit candidateData.id soit l'ID de l'URL
    const candidateId = candidateData?.id || (id && !isNaN(Number(id)) ? Number(id) : null);
    
    if (!candidateId) {
      console.log('No candidate ID available');
      return;
    }
        
    try {
      setIsCheckingExistingTest(true);
      console.log('=== CHECKING EXISTING TEST ===');
      console.log('Candidate ID utilisé:', candidateId);
      
      const response = await checkExistingTestMutation.mutateAsync(candidateId);
      
      console.log('=== RESPONSE DU BACKEND ===');
      console.log('Response brute:', response);
      console.log('Response type:', typeof response);
      console.log('Response keys:', response ? Object.keys(response) : 'null/undefined');
      console.log('=== FIN RESPONSE BACKEND ===');
      
      console.log('Response from checkExistingTest:', response);
      console.log('Has test:', response.exists);
      console.log('Test ID:', response.testId);
      
      if (response.exists) {
        const testInfo = {
          existingTestId: response.testId,
          existingTestToken: '', // Pas disponible dans la réponse actuelle
          existingTestStatus: response.status || 'UNKNOWN', // Utiliser le statut réel du backend
          existingTestCreatedAt: new Date().toISOString() // Pas disponible dans la réponse actuelle
        };
        console.log('Setting existingTest:', testInfo);
        setExistingTest(testInfo);
        toast.info("Un test existe déjà pour cette candidature");
      } else {
        console.log('No existing test found');
        setExistingTest(null);
      }
      
    } catch (error: any) {
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
    
    // Retourner une structure riche pour une meilleure UI
    const profileData = {
      // Informations personnelles
      personalInfo: {
        fullName: data["Basic Information"]?.["full_name"] || "",
        email: data["Basic Information"]?.["email"] || "",
        phone: data["Basic Information"]?.["phone"] || ""
      },
      
      // Domaine et expertise
      expertise: {
        domain: data["Technical Information"]?.["domain"] || "Non spécifié",
        level: data["Summary"]?.["career_level"] || data["Summary"]?.["skill_level"] || "Débutant",
        specializations: data["Summary"]?.["specializations"] || []
      },
      
      // Statistiques
      stats: {
        certifications: data["Certifications"]?.length || 0,
        projects: data["Projects"]?.length || 0,
        education: data["Education"]?.length || 0
      },
      
      // Formation principale
      education: data["Education"]?.[0] ? {
        degree: data["Education"][0].degree || "",
        field: data["Education"][0].field || "",
        institution: data["Education"][0].institution || ""
      } : null,
      
      // Résumé du profil
      summary: data["Summary"]?.["summary"] || `Candidat avec score IA de ${data["Summary"]?.["overall_score"] || 0}/10. Expérience de ${data["Summary"]?.["experience_years"] || "non spécifiée"} ans. Niveau ${data["Summary"]?.["skill_level"] || "non spécifié"} en développement.`,
      
      // Compétences principales (si disponibles)
      keySkills: data["Summary"]?.["key_skills"]?.slice(0, 6) || []
    };
    
    console.log('Profile data for UI:', profileData);
    return profileData;
  };

  const determineExperienceLevel = () => {
    if (!technicalProfile?.parsedData) return 'N/A';
    
    const data = technicalProfile.parsedData;
    
    // Si le score est 0, aucune donnée réelle n'a été trouvée
    if (!data["Work Experience"] && !data["Projects"] && !data["Technical Information"]?.["technologies"]) {
      return 'N/A';
    }
    
    // Basé sur l'expérience et les projets détectés
    const expCount = data["Work Experience"] ? data["Work Experience"].length : 0;
    const projectCount = data["Projects"] ? data["Projects"].length : 0;
    const skillCount = Object.keys(data["Technical Information"]?.["technologies"] || {}).length;
    
    // Logique plus simple et basée sur l'expérience réelle
    if (expCount >= 5 || projectCount >= 5) return 'SENIOR';
    if (expCount >= 3 || projectCount >= 3) return 'INTERMÉDIAIRE';
    if (expCount >= 1 || projectCount >= 1) return 'JUNIOR';
    return 'DÉBUTANT';
  };

  const getEligibilityChecks = () => {
    const checks = [];
    const data = technicalProfile?.parsedData;
    
    const candidateDomain = data?.["Technical Information"]?.["domain"];
    const acceptedDomains = candidateData?.position?.acceptedDomains || [];
    
    // Fonction pour vérifier l'éligibilité du domaine
    const isDomainEligible = candidateDomain && (
      acceptedDomains.length === 0 || 
      acceptedDomains.some(acceptedDomain => {
        const normalizeDomain = (domain: string) => {
          return domain.toLowerCase()
            .trim()
            .replace(/[^\w\s]/g, '') 
            .replace(/\s+/g, ' '); 
        };
        
        const normalizedAccepted = normalizeDomain(acceptedDomain);
        const normalizedCandidate = normalizeDomain(candidateDomain);
        
        // Vérification directe
        if (normalizedAccepted === normalizedCandidate) return true;
        
        // Équivalences de domaines
        const domainEquivalences: { [key: string]: string[] } = {
          'software engineering': ['software engineering', 'ingénierie logicielle', 'développement logiciel', 'informatique', 'software development', 'programmation', 'coding'],
          'data science': ['data science', 'science des données', 'analyse de données', 'data analysis', 'big data', 'machine learning', 'ia', 'intelligence artificielle'],
          'web development': ['web development', 'développement web', 'web', 'site web', 'web design'],
          'mobile development': ['mobile development', 'développement mobile', 'mobile', 'android', 'ios', 'application mobile'],
          'cybersecurity': ['cybersecurity', 'cyber sécurité', 'sécurité informatique', 'sécurité', 'security'],
          'devops': ['devops', 'développement opérations', 'operations', 'infrastructure', 'cloud'],
          'ui/ux': ['ui/ux', 'design', 'design interface', 'design expérience utilisateur', 'user interface', 'user experience'],
          'networking': ['networking', 'réseau', 'réseaux', 'network', 'administration réseau'],
          'database': ['database', 'base de données', 'bdd', 'data', 'données'],
          'project management': ['project management', 'gestion de projet', 'management', 'chef de projet']
        };
        
        for (const [canonicalDomain, equivalents] of Object.entries(domainEquivalences)) {
          const normalizedCanonical = normalizeDomain(canonicalDomain);
          
          if (equivalents.some(eq => normalizeDomain(eq) === normalizedAccepted)) {
            const candidateMatches = equivalents.some(eq => normalizeDomain(eq) === normalizedCandidate);
            if (candidateMatches) {
              return true;
            }
          }
        }
        
        return false;
      })
    );
    
    // Informations du poste
    if (candidateData?.position.title) {
      checks.push({ 
        label: ` Poste : ${candidateData.position.title}`, 
        ok: true 
      });
    }
    
    if (candidateData?.position.company) {
      checks.push({ 
        label: ` Entreprise : ${candidateData.position.company}`, 
        ok: true 
      });
    }
    
    // Analyse du CV
    if (data) {
     
      
      // Domaine technique
      if (candidateDomain) {
        if (isDomainEligible) {
          checks.push({ 
            label: ` Domaine : ${candidateDomain} — compatible avec le poste`, 
            ok: true 
          });
        } else {
          checks.push({ 
            label: ` Domaine : ${candidateDomain} — non compatible avec les domaines requis (${acceptedDomains.join(', ') || 'Non spécifié'})`, 
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
    const isEligible = isDomainEligible && data && candidateDomain;
    checks.push({ 
      label: isEligible ? ' Candidature éligible pour génération de test' : ' Candidature non éligible — domaine incompatible ou données manquantes', 
      ok: isEligible 
    });
    
    return checks;
  };

  const isCandidateEligible = () => {
    const data = technicalProfile?.parsedData;
    const candidateDomain = data?.["Technical Information"]?.["domain"];
    const acceptedDomains = candidateData?.position?.acceptedDomains || [];
    
    if (!candidateDomain) return false;
    
    return acceptedDomains.length === 0 || 
           acceptedDomains.some(domain => 
             domain.toLowerCase().includes(candidateDomain.toLowerCase()) || 
             candidateDomain.toLowerCase().includes(domain.toLowerCase())
           );
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
      
      // Appeler l'API avec le format simple (ancienne approche)
      const testResponse = await generateTestMutation.mutateAsync({
        candidatureId: candidateData.id,
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

  const handleGenerateTest = async () => {
    if (!candidateData || !technicalProfileData) {
      toast.error('Veuillez patienter que les données du candidat soient chargées');
      return;
    }

    // Extraire les compétences réelles du candidat
    const skills = extractSkillsFromProfile();
    console.log('=== GÉNÉRATION DE TEST AVEC COMPÉTENCES RÉELLES ===');
    console.log('Compétences extraites:', skills);
    console.log('Nombre de compétences:', skills.length);
    console.log('=== FIN COMPÉTENCES POUR GÉNÉRATION ===');

    try {
      // Utiliser l'approche simple de l'ancien code backend
      // Le backend utilise maintenant: technicalProfile.getParsedData() directement
      // Plus besoin d'envoyer des customInstructions structurées
      
      // Afficher un message d'attente plus informatif
      toast.loading('Génération du test personnalisé en cours... Cela peut prendre jusqu\'à 60 secondes.', {
        duration: 0, // Ne pas auto-dismiss
        id: 'generate-test' // ID unique pour pouvoir le mettre à jour
      });
      
      // Appeler l'API avec le format simple (ancienne approche)
      const testResponse = await generateTestMutation.mutateAsync({
        candidatureId: candidateData.id,
        level: testConfig.level,
        questionCount: testConfig.questionCount,
        duration: testConfig.duration,
        deadline: testConfig.deadline,
        note: testConfig.note,
        focusAreas: skills.map(skill => skill.name), // Garder pour compatibilité
        // Plus besoin de customInstructions - le backend utilise technicalProfile.getParsedData()
      });
      
      console.log('=== DONNÉES ENVOYÉES À L\'API (Ancienne Approche) ===');
      console.log('candidatureId:', candidateData.id);
      console.log('level:', testConfig.level);
      console.log('questionCount:', testConfig.questionCount);
      console.log('focusAreas (compétences):', skills.map(skill => skill.name));
      console.log('Backend utilisera: technicalProfile.getParsedData() directement');
      console.log('=== FIN DONNÉES API ===');
      
      console.log('Normal generate - Test response received:', testResponse);
      console.log('Normal generate - Test ID from response:', testResponse.testId);
      console.log('Normal generate - Questions from response:', testResponse.questions);
      
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
              <h4 className="font-semibold text-foreground">Expertise</h4>
              <p className="text-sm text-muted-foreground">
                {analysis.expertise.domain} • {analysis.expertise.level}
              </p>
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
          
          {analysis.keySkills && Array.isArray(analysis.keySkills) && analysis.keySkills.length > 0 && (
            <div>
              <h4 className="font-semibold text-foreground">Compétences clés</h4>
              <div className="flex flex-wrap gap-2 mt-2">
                {analysis.keySkills.map((skill: any, index: number) => (
                  <Badge key={index} variant="secondary">
                    {typeof skill === 'string' ? skill : skill.name || 'Compétence'}
                  </Badge>
                ))}
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
              Candidature #{candidateData.id} · {candidateData.firstName} {candidateData.lastName} · {candidateData.position.title}
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
          {/* Configuration du test - Masquer si un test existe déjà ET si la vérification est terminée */}
          {(() => {
            console.log('=== DÉCISION SECTION CONFIGURATION ===');
            console.log('existingTest:', existingTest);
            console.log('existingTest?.existingTestId:', existingTest?.existingTestId);
            console.log('existingTest?.existingTestStatus:', existingTest?.existingTestStatus);
            console.log('isCheckingExistingTest:', isCheckingExistingTest);
            
            // Masquer la configuration SEULEMENT si:
            // 1. La vérification est terminée (isCheckingExistingTest === false)
            // 2. ET un test existe avec un ID valide
            // 3. ET le test a un statut (peu importe lequel - DRAFT, SUBMITTED, etc.)
            const shouldHideConfig = !isCheckingExistingTest && 
              existingTest?.existingTestId && 
              existingTest?.existingTestStatus;
            
            console.log('shouldHideConfig calculé:', shouldHideConfig);
            console.log('Détail calcul:');
            console.log('  !isCheckingExistingTest:', !isCheckingExistingTest);
            console.log('  existingTest?.existingTestId:', existingTest?.existingTestId);
            console.log('  existingTest?.existingTestStatus (truthy):', !!existingTest?.existingTestStatus);
            console.log('  shouldHideConfig (&& operation):', shouldHideConfig);
            console.log('=== FIN DÉCISION SECTION CONFIGURATION ===');
            
            // Afficher la configuration si shouldHideConfig est false
            return !shouldHideConfig;
          })() && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Configuration du test à générer</h3>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Poste ciblé</Label>
                  <div className="mt-1 p-3 bg-muted rounded-md">
                    {candidateData?.position?.title || (candidateData as any).title || candidateData?.positionTitle || 'Poste non spécifié'}
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
