import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sparkles, Check, X, AlertCircle, ArrowLeft, Edit, Briefcase, Settings, CheckCircle, Download, GraduationCap, Award, FolderGit2, Code2, Cpu, Star, Clock, User, ChevronRight } from "lucide-react";
import { normalizeAiCorrectAnswer } from '@/features/tests/testAnswerUtils';
import { useTechnicalProfileByCandidate } from '@/features/technical-profile/technicalProfileQueries';
import { useCheckExistingTest, useGenerateTest } from '@/features/tests/testsMutations';
import { useUpdateCandidatureStatus } from '@/features/candidatures/candidaturesMutations';
import { useCurrentUserSafe } from '@/features/auth/authQueries';
import { useCandidatures } from '@/features/candidatures/candidaturesQueries';
import { toast } from "sonner";
import { getStatusLabel, getStatusColor } from "@/utils/statusMappings";
import { checkDomainEligibility, type EligibilityResult } from '@/features/candidatures/domainEligibility';

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

const getSkillName = (skill: any): string => {
  if (!skill) return '';
  if (typeof skill === 'string') return skill;
  if (typeof skill === 'object') return String(skill.name || skill.skill_level || '');
  return String(skill);
};

const GenerateTestPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: user } = useCurrentUserSafe();
  const { data: candidatures = [], isLoading: candidaturesLoading, error: candidaturesError } = useCandidatures();
  const checkExistingTestMutation = useCheckExistingTest();
  const generateTestMutation = useGenerateTest();
  const updateCandidatureStatusMutation = useUpdateCandidatureStatus();
  
  const [candidateData, setCandidateData] = useState<any>(null);
  
  // Modal states
  const [showAllCertifications, setShowAllCertifications] = useState(false);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [showAllEducation, setShowAllEducation] = useState(false);
  const [showAllSkills, setShowAllSkills] = useState(false);
  
  const candidateId = useMemo(() => {
    return candidateData?.id || (id && !isNaN(Number(id)) ? Number(id) : null);
  }, [candidateData?.id, id]);
  
  const separateCandidateId = useMemo(() => {
    
    const urlCandidateId = id && !isNaN(Number(id)) ? Number(id) : null;
    console.log('urlCandidateId calculé:', urlCandidateId);
    
    if (urlCandidateId) {
      console.log('→ Retour urlCandidateId:', urlCandidateId);
      return urlCandidateId;
    }
    
    const foundCandidature = candidatures.find(c => c.candidateId === Number(id));
    console.log('foundCandidature:', foundCandidature);
    if (foundCandidature?.candidateId) {
      console.log('→ Retour foundCandidature.candidateId:', foundCandidature.candidateId);
      return foundCandidature.candidateId;
    }
    
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

  const loadCandidateData = async () => {
    if (!id) return;
      
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
        console.log('GenerateTestPage - Recherche candidature ID:', id, 'dans:', candidatures);
        console.log('GenerateTestPage - Détails des candidatures:');
        candidatures.forEach((c, index) => {
          console.log(`  [${index}] ID: ${c.id}, Nom: ${c.candidateFirstName} ${c.candidateLastName}`);
        });
        candidature = candidatures.find(c => c.id.toString() === id.toString());
        console.log('GenerateTestPage - Candidature trouvée:', candidature);
      }
        
      console.log('GenerateTestPage - Candidature trouvée avec ID direct:', candidature ? 'OUI' : 'NON');
          
      if (!candidature) {
        candidature = candidatures.find(c => c.candidateId === Number(id));
        console.log('GenerateTestPage - Candidature trouvée avec candidateId:', candidature ? 'OUI' : 'NON');
      }
          
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
        phone: candidature.candidatePhone,  // ✅ Plus de fallback, champ obligatoire
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
      
      setCandidateData(candidateDataToSet);
      setIsLoading(false);
        
    } catch (error) {
      console.error('Error loading candidate data:', error);
      toast.error('Erreur lors du chargement des données du candidat');
      setIsLoading(false);
    }
  };

  useEffect(() => {

    if (candidatures.length > 0 && !candidateData) {
      console.log('=== APPEL DE loadCandidateData ===');
      loadCandidateData();
    }
    else if (!candidaturesLoading && candidatures.length === 0 && id && !candidateData) {
      console.log('=== CONTOURNEMENT: PAS DE CANDIDATURES MAIS ID URL DISPONIBLE ===');
      console.log('ID URL:', id);
      
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

  useEffect(() => {
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

  const candidature = candidatures.find(c => c.id === Number(id));
  const [cvId, setCvId] = useState<number | null>(null);
  
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

  useEffect(() => {
    if (technicalProfileData) {
      console.log('=== TECHNICAL PROFILE REÇU DU HOOK ===');
      console.log('Technical Profile Data:', technicalProfileData);
      console.log('ParsedData:', technicalProfileData?.parsedData);
      console.log('Type:', typeof technicalProfileData);
      console.log('=== FIN TECHNICAL PROFILE ===');
    } else if (technicalProfileLoading === false && candidateData) {
      console.log('=== PAS DE DONNÉES IA TROUVÉES ===');
      console.log('Aucune donnée d\'analyse IA n\'a été trouvée pour ce candidat.');
      console.log('Veuillez contacter l\'administrateur système pour vérifier l\'analyse IA.');
      console.log('=== FIN ERREUR IA ===');
      toast.error('Aucune donnée d\'analyse IA trouvée. Veuillez contacter l\'administrateur.');
    }
  }, [technicalProfileData, technicalProfileLoading, candidateData, candidatures, id]);

  const finalIsLoading = !candidateData || technicalProfileLoading;
  const technicalProfile = technicalProfileData;

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

  useEffect(() => {
    const testCheckId = candidateData?.id || (id && !isNaN(Number(id)) ? Number(id) : null);
    if (testCheckId) {
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
    
    // On ne prend QUE la candidature dont l'id correspond à l'URL
    const allCandidateCandidatures = candidatures.filter(c => {
      return c.id === Number(id);
    });
    console.log('allCandidateCandidatures:', allCandidateCandidatures);
    console.log('allCandidateCandidatures.length:', allCandidateCandidatures.length);
    
    const allPositions: any[] = [];
    
    allCandidateCandidatures.forEach(candidature => {
      console.log(`=== ANALYSE CANDIDATURE ${candidature.id} ===`);
      console.log('Candidature complète:', JSON.stringify(candidature, null, 2));
      
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

  const [eligibilityResult, setEligibilityResult] = useState<{
    eligible: boolean;
    reason: string;
    matchedDomain?: string;
  } | null>(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);

  useEffect(() => {
    const runEligibilityCheck = async () => {
      const candidateDomain = technicalProfile?.parsedData
        ?.["Technical Information"]?.["domain"];

      if (!candidateDomain || candidateDomain === 'Unknown') return;

      const allAcceptedDomains = candidatePositions
        .flatMap(pos => pos.acceptedDomains || [])
        .filter(Boolean);

      if (allAcceptedDomains.length === 0) return;

      setEligibilityLoading(true);
      try {
        const result = await checkDomainEligibility(
          candidateDomain,
          allAcceptedDomains
        );
        setEligibilityResult(result);
      } catch (err) {
        console.error('Eligibility check failed:', err);
      } finally {
        setEligibilityLoading(false);
      }
    };

    if (technicalProfile && candidatePositions.length > 0) {
      runEligibilityCheck();
    }
  }, [technicalProfile, candidatePositions]);

  const getEligibilityChecks = () => {
    const checks = [];
    const data = technicalProfile?.parsedData;
    
    // Ajouter les checks de base
    candidatePositions.forEach((position, index) => {
      checks.push({ 
        label: ` Poste ${index + 1} : ${position.title}`, 
        ok: true 
      });
    });
    
    if (data) {
      const candidateDomain = data?.["Technical Information"]?.["domain"];
      if (candidateDomain) {
        if (eligibilityLoading) {
          checks.push({ 
            label: ` Domaine : ${candidateDomain} — analyse en cours...`, 
            ok: true 
          });
        } else if (eligibilityResult) {
          checks.push({ 
            label: ` Domaine : ${candidateDomain} — ${eligibilityResult.reason}`, 
            ok: eligibilityResult.eligible 
          });
        } else {
          checks.push({ 
            label: ` Domaine : ${candidateDomain} — non compatible avec les domaines requis`, 
            ok: false 
          });
        }
      } else {
        checks.push({ 
          label: '⚠️ Domaine technique non détecté dans le CV', 
          ok: false 
        });
      }
      
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
    
    const isEligible = eligibilityResult?.eligible && data;
    checks.push({ 
      label: isEligible ? ' Candidature éligible pour génération de test' : ' Candidature non éligible — domaine incompatible ou données manquantes', 
      ok: isEligible 
    });
    
    return checks;
  };

  const isCandidateEligible = () => {
    return eligibilityResult?.eligible && technicalProfile?.parsedData;
  };

  const extractSkillsFromProfile = () => {
    console.log('extractSkillsFromProfile called, technicalProfile:', technicalProfile);
    
    if (!technicalProfile?.parsedData) {
      console.log('No parsedData in technicalProfile for skills');
      return [];
    }
    
    const data = technicalProfile.parsedData;
    const skills = [];
    let hasRealSkills = false;
    
    if (data["Technical Information"]?.["technologies"]) {
      const techData = data["Technical Information"]["technologies"];
      console.log('TechData trouvé:', techData);
      console.log('Type de TechData:', typeof techData);
      console.log('TechData est Array:', Array.isArray(techData));
      
      // techData est un tableau d'objets: [{category: "...", technologies: [...]}]
      if (Array.isArray(techData)) {
        techData.forEach((categoryData, index) => {
          console.log(`Catégorie ${index}:`, categoryData);
          
          if (categoryData.technologies && Array.isArray(categoryData.technologies)) {
            categoryData.technologies.forEach((tech, techIndex) => {
              console.log(`  Tech ${techIndex}:`, tech, typeof tech);
              
              if (typeof tech === 'string' && tech.trim()) {
                skills.push({ name: tech.trim(), level: "Intermédiaire" });
                hasRealSkills = true;
                console.log(`    -> Ajouté: ${tech.trim()}`);
              } else if (tech && typeof tech === 'object' && tech.name && tech.name.trim()) {
                skills.push({ name: tech.name.trim(), level: tech.skill_level || tech.level || "Intermédiaire" });
                hasRealSkills = true;
                console.log(`    -> Ajouté (objet): ${tech.name.trim()}`);
              }
            });
          }
        });
      } else {
        console.log('Aucune donnée "Technical Information" ou "technologies" trouvée');
      }
    }
    
    console.log('Compétences finales extraites:', skills);
    console.log('hasRealSkills:', hasRealSkills);
    
    return hasRealSkills ? skills : [];
  };

  const extractAnalysisFromProfile = () => {
    
    if (!technicalProfile?.parsedData) {
      console.log('No parsedData in technicalProfile');
      return null;
    }
    
    const data = technicalProfile.parsedData;
  
    const extractKeySkills = () => {
      const skills = [];
      
      // 1. Extraire les compétences depuis Technical Information: technologies
      if (data["Technical Information"]?.["technologies"] && Array.isArray(data["Technical Information"]["technologies"])) {
        console.log('Technologies trouvées dans Technical Information:', data["Technical Information"]["technologies"]);
        const techData = data["Technical Information"]["technologies"];
        
        // Gérer le format: [{technology: "React", skill_level: "Intermediate"}, ...]
        if (Array.isArray(techData)) {
          techData.forEach((skillObj: any) => {
            if (skillObj && skillObj.technology && typeof skillObj.technology === 'string' && skillObj.technology.trim()) {
              skills.push(skillObj.technology.trim());
            }
          });
        }
      }
      
      // 3. Compléter avec les technologies des projets si nécessaire
      if (skills.length < 10 && data["Projects"] && Array.isArray(data["Projects"])) {
        console.log('Complément avec les projets');
        data["Projects"].forEach((project: any) => {
          if (project.tech_stack && Array.isArray(project.tech_stack)) {
            project.tech_stack.forEach((tech: string) => {
              if (tech && tech.trim() && !skills.includes(tech.trim())) {
                skills.push(tech.trim());
              }
            });
          }
          // Fallback pour l'ancien format
          else if (project.technologies && Array.isArray(project.technologies)) {
            project.technologies.forEach((tech: string) => {
              if (tech && tech.trim() && !skills.includes(tech.trim())) {
                skills.push(tech.trim());
              }
            });
          }
        });
      }
     
      return [...new Set(skills)];
    };
    
    const extractEducation = () => {
      if (data["Education"] && Array.isArray(data["Education"])) {
        console.log('=== STRUCTURE ÉDUCATION BRUTE ===');
        console.log('data["Education"]:', JSON.stringify(data["Education"], null, 2));
        
        const extracted = data["Education"].map((edu: any) => {
          
          let extractedYear = edu.year || edu.graduationYear || edu.end_date;
          if (extractedYear) {
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
       
        return extracted;
      }
      return [];
    };
    
    const extractCertifications = () => {
      console.log('=== NOUVELLE STRUCTURE - CERTIFICATIONS ===');
      console.log('data["Certifications"]:', data["Certifications"]);
      
      if (data["Certifications"] && Array.isArray(data["Certifications"])) {
        const extracted = data["Certifications"].map((cert: any) => {
          console.log('Certification individuelle:', cert);
          
          // Nouvelle structure du prompt: certification_name, issuing_organization, issue_date
          return {
            name: cert.certification_name || cert.name || cert.title || 'Non spécifié',
            issuer: cert.issuing_organization || cert.issuer || cert.organization || 'Non spécifié',
            year: cert.issue_date || cert.year || 'Non spécifié'
          };
        });
        
        console.log('Certifications extraites:', extracted);
        return extracted;
      }
      return [];
    };
    
    const extractProjects = () => {
      console.log('=== NOUVELLE STRUCTURE - PROJECTS ===');
      console.log('data["Projects"]:', data["Projects"]);
      
      if (data["Projects"] && Array.isArray(data["Projects"])) {
        const extracted = data["Projects"].map((project: any) => {
          console.log('Projet individuel:', project);
          
          // Nouvelle structure du prompt: name, tech_stack, role, impact
          return {
            name: project.name || 'Non spécifié',
            description: project.description || project.impact || 'Non spécifié', // impact comme description
            technologies: project.tech_stack || project.technologies || [], // tech_stack prioritaire
            duration: project.duration || project.period || 'Non spécifié',
            role: project.role || 'Non spécifié', // Nouveau champ role
            impact: project.impact || 'Non spécifié' // Nouveau champ impact
          };
        });
        
        console.log('Projets extraits:', extracted);
        return extracted;
      }
      return [];
    };
    
    const extractDomainAndLevel = () => {
      const techInfo = data["Technical Information"] || {};
      const summary = data["Summary"] || {};
      
      console.log('=== NOUVELLE STRUCTURE - DOMAIN & LEVEL ===');
      console.log('techInfo:', techInfo);
      console.log('summary:', summary);
      
      // Nouvelle structure du prompt: domain dans Technical Information, career_level et years_of_experience dans Summary
      const result = {
        domain: techInfo.domain || 'Non spécifié',
        level: summary.career_level || techInfo.level || 'Non spécifié',
        experience: summary.years_of_experience || summary.experience_years || techInfo.experience || 'Non spécifié',
        score: summary.overall_score || techInfo.score || 0
      };
      
      console.log('Domain & Level extraits:', result);
      return result;
    };
    
    const profileData = {
      personalInfo: {
        fullName: data["Basic Information"]?.["full_name"] || "",
        email: data["Basic Information"]?.["email"] || "",
        phone: data["Basic Information"]?.["phone"] || ""
      },
      expertise: extractDomainAndLevel(),
      stats: {
        skillsCount: extractKeySkills().length,
        projectsCount: data["Projects"]?.length || 0,
        certificationsCount: data["Certifications"]?.length || 0,
        educationCount: data["Education"]?.length || 0
      },
      keySkills: extractKeySkills(),
      specializations: data["Summary"]?.["specializations"] || [],
      strengths: data["Summary"]?.["strengths"] || [],
      education: extractEducation(),
      certifications: extractCertifications(),
      projects: extractProjects(),
      summary: data["Summary"]?.["summary"] || `Candidat avec score IA de ${data["Summary"]?.["overall_score"] || 0}/10. Expérience de ${data["Summary"]?.["years_of_experience"] || "non spécifiée"} ans. Niveau ${data["Summary"]?.["career_level"] || "non spécifié"} en développement.`
    };
    
    console.log('Profile data for UI:', profileData);
    return profileData;
  };

  const extractLevelFromProfile = (data: any) => {
    return data["Summary"]?.["career_level"] || "Non spécifié";
  };

  const extractExperienceFromProfile = (data: any) => {
    return data["Summary"]?.["years_of_experience"] || "Non spécifié";
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
        setTimeout(() => { URL.revokeObjectURL(blobUrl); }, 10000);
      } else {
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `CV_${candidateData?.firstName}_${candidateData?.lastName}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.info('Le popup a été bloqué. Le CV a été téléchargé à la place.');
        setTimeout(() => { URL.revokeObjectURL(blobUrl); }, 1000);
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

    if (!testConfig.deadline) {
      toast.error('La date limite de passage est obligatoire');
      return;
    }

    if (new Date(testConfig.deadline) < new Date(new Date().toDateString())) {
      toast.error('La date limite ne peut pas être antérieure à aujourd\'hui');
      return;
    }

    const skills = extractSkillsFromProfile();

    try {
      toast.loading('Génération du test personnalisé en cours... Cela peut prendre jusqu\'à 60 secondes.', {
        duration: 0,
        id: 'generate-test'
      });
      
      const testResponse = await generateTestMutation.mutateAsync({
        candidatureId: candidateData.id,
        level: testConfig.level,
        questionCount: testConfig.questionCount,
        duration: testConfig.duration,
        deadline: testConfig.deadline,
        note: testConfig.note,
        focusAreas: skills.map(skill => typeof skill === 'string' ? skill : skill.name || ''),
      });

      if (testResponse.questions && testResponse.questions.length > 0) {
        const formattedQuestions = testResponse.questions.map((q: any, index: number) => {
          const options = q.options || [];
          const correctAnswerIndex = normalizeAiCorrectAnswer(q.correct_answer, options);

          console.log(`Q${index + 1}:`, {
            raw: q.correct_answer,
            resolvedIndex: correctAnswerIndex,
            resolvedText: options[correctAnswerIndex]
          });

          return {
            id: index + 1,
            questionText: q.question,
            questionType: "MCQ",
            options,
            correctAnswer: correctAnswerIndex,
            skillTag: q.technology || "",
            maxScore: 1.0,
            orderIndex: index
          };
        });
        
        localStorage.setItem(`test_questions_${testResponse.testId}`, JSON.stringify(formattedQuestions));
        console.log('Normal generate - Stored questions in localStorage:', formattedQuestions);
      }
      
      setExistingTest(null);
      
      toast.dismiss('generate-test');
      toast.success('Test personnalisé généré avec succès ! Redirection vers la révision...');
      
      console.log('Normal generate - Navigating to:', `/manager/test-review/${testResponse.testId}`);
      
      try {
        navigate(`/manager/test-review/${testResponse.testId}`);
        console.log('Normal generate - Navigation successful');
      } catch (navError) {
        console.error('Normal generate - Navigation error:', navError);
        toast.error('Erreur lors de la redirection vers la page de révision');
      }
      
    } catch (error: any) {
      toast.dismiss('generate-test');
      
      console.error('Error generating test:', error);
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
      
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        toast.error('La génération du test a pris trop de temps. Veuillez réessayer avec moins de questions ou contacter l\'administrateur.');
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

  // Déplacer tous les hooks avant les returns conditionnels
  const skills = extractSkillsFromProfile();
  const analysis: any = extractAnalysisFromProfile();
  const eligibility = useMemo(
    () => getEligibilityChecks(),
    [eligibilityResult, eligibilityLoading, technicalProfile, candidatePositions]
  );

  const shouldHideConfig = !isCheckingExistingTest && 
    existingTest?.existingTestId && 
    existingTest?.existingTestStatus !== 'DRAFT';

  const getMostRecentEducation = (eduList: any[]) => {
    if (!eduList || eduList.length === 0) return null;
    
    return eduList.reduce((most: any, edu: any) => {
      console.log('Comparing:', most, 'vs', edu);
      
      if (!most) return edu;
      
      // Extraire l'année de l'éducation actuelle
      let currentYear = null;
      let currentEndDate = null;
      if (edu.year) currentYear = edu.year;
      else if (edu.graduationYear) currentYear = edu.graduationYear;
      else if (edu.end_date) currentEndDate = edu.end_date;
      else if (edu.endDate) currentEndDate = edu.endDate;
      
      // Extraire l'année de la plus récente
      let mostYear = null;
      let mostEndDate = null;
      if (most.year) mostYear = most.year;
      else if (most.graduationYear) mostYear = most.graduationYear;
      else if (most.end_date) mostEndDate = most.end_date;
      else if (most.endDate) mostEndDate = most.endDate;
      
      const extractYear = (dateStr: any) => {
        if (!dateStr) return null;
        if (typeof dateStr === 'number') return dateStr;
        if (typeof dateStr === 'string') {
          const yearMatch = dateStr.match(/\b(19|20)\d{2}\b/);
          return yearMatch ? parseInt(yearMatch[0]) : null;
        }
        return null;
      };
      
      // Extraire les années
      const currentYearNum = extractYear(currentYear) || extractYear(currentEndDate);
      const mostYearNum = extractYear(mostYear) || extractYear(mostEndDate);
      
      console.log('Years extracted:', currentYearNum, 'vs', mostYearNum);
      
      if (currentYearNum === null && mostYearNum !== null) {
        console.log('Current has no year, keeping most');
        return most;
      }
      
      if (currentYearNum !== null && mostYearNum === null) {
        console.log('Current has year, most has none, taking current');
        return edu;
      }
      
      if (currentYearNum !== null && mostYearNum !== null) {
        if (currentYearNum > mostYearNum) {
          console.log('Newer education found:', edu);
          return edu;
        }
      }
      
      if (currentYearNum === null && mostYearNum === null) {
        const currentPriority = edu.degree?.toLowerCase().includes('engineering') || 
                           edu.degree?.toLowerCase().includes('master') ||
                           edu.degree?.toLowerCase().includes('software') ? 1 : 0;
        const mostPriority = most.degree?.toLowerCase().includes('engineering') || 
                         most.degree?.toLowerCase().includes('master') ||
                         most.degree?.toLowerCase().includes('software') ? 1 : 0;
        
        console.log('No years, comparing by priority:', currentPriority, 'vs', mostPriority);
        if (currentPriority > mostPriority) {
          return edu;
        }
      }
      
      return most;
    }, null);
  };

  const getLevelColor = (level: string) => {
    const l = (level || '').toLowerCase();
    if (l.includes('senior') || l.includes('expert') || l.includes('advanced')) return 'bg-purple-100 text-purple-700 border-purple-200';
    if (l.includes('intermediate') || l.includes('intermédiaire') || l.includes('mid')) return 'bg-blue-100 text-blue-700 border-blue-200';
    return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  };

  const getScoreBar = (score: number) => {
    const pct = Math.min(100, Math.max(0, (score / 10) * 100));
    const color = pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-400';
    return { pct, color };
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
        <div className="space-y-4">
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                  {candidateData.firstName?.[0]}{candidateData.lastName?.[0]}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm leading-tight">
                    {candidateData.firstName} {candidateData.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">{candidateData.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {technicalProfileData && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
                    <Cpu className="w-3 h-3" /> IA
                  </span>
                )}
                {cvUrl && (
                  <Button variant="outline" size="sm" onClick={downloadCV} className="h-7 px-2 text-xs gap-1">
                    <Download className="h-3 w-3" />
                    CV
                  </Button>
                )}
              </div>
            </div>

            {/* Quick info grid */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="text-center p-2 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="text-xs font-semibold text-slate-700">
                  {candidateData.appliedAt ? new Date(candidateData.appliedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '—'}
                </p>
              </div>
              <div className="text-center p-2 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-xs text-muted-foreground">Statut</p>
                <p className="text-xs font-semibold text-slate-700">
                  {candidateData.status === 'PENDING' ? 'En attente' : getStatusLabel(candidateData.status)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                <Briefcase className="w-3 h-3" /> Postes postulés
              </p>
              <div className="flex flex-wrap gap-1.5">
                {candidatePositions.map((position, index) => (
                  <span key={index} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                    {position.title}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {analysis ? (
            <div className="glass-card overflow-hidden">
              <div className="px-5 pt-4 pb-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                    <Cpu className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Analyse IA</p>
                    <p className="text-xs text-muted-foreground">Profil technique extrait du CV</p>
                  </div>
                </div>
                {analysis.expertise?.score > 0 && (
                  <div className="text-right">
                    <p className="text-xl font-bold text-foreground leading-none">
                      {analysis.expertise.score}<span className="text-xs text-muted-foreground font-normal">/10</span>
                    </p>
                    <div className="mt-1 w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getScoreBar(analysis.expertise.score).color}`}
                        style={{ width: `${getScoreBar(analysis.expertise.score).pct}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-5 space-y-5 max-h-[520px] overflow-y-auto">

                {analysis.summary && (
                  <p className="text-xs text-muted-foreground leading-relaxed border-l-2 border-indigo-200 pl-3 italic">
                    {analysis.summary}
                  </p>
                )}

                {(analysis.expertise?.domain || analysis.expertise?.level || analysis.expertise?.experience) && (
                  <div className="flex flex-wrap gap-2">
                    {analysis.expertise?.domain && analysis.expertise.domain !== 'Non spécifié' && (
                      <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
                        <Code2 className="w-3 h-3" />
                        {analysis.expertise.domain}
                      </span>
                    )}
                    {analysis.expertise?.level && analysis.expertise.level !== 'Non spécifié' && (
                      <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium ${getLevelColor(analysis.expertise.level)}`}>
                        <Star className="w-3 h-3" />
                        {analysis.expertise.level}
                      </span>
                    )}
                    {analysis.expertise?.experience && analysis.expertise.experience !== 'Non spécifié' && (
                      <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                        <Clock className="w-3 h-3" />
                        {analysis.expertise.experience} an{Number(analysis.expertise.experience) > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                )}

                {/* Stats mini row */}
                {analysis.stats && (
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { label: 'Spécialisations', value: analysis.specializations?.length || 0, icon: Star },
                      { label: 'Projets', value: analysis.stats.projectsCount, icon: FolderGit2 },
                      { label: 'Certifs', value: analysis.stats.certificationsCount, icon: Award },
                      { label: 'Diplômes', value: analysis.stats.educationCount, icon: GraduationCap },
                    ].map(({ label, value, icon: Icon }) => (
                      <div key={label} className="flex flex-col items-center p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                        <Icon className="w-3 h-3 text-muted-foreground mb-0.5" />
                        <p className="text-sm font-bold text-foreground leading-none">{value || 0}</p>
                        <p className="text-[9px] text-muted-foreground mt-0.5 text-center leading-tight">{label}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Key skills */}
                {analysis.keySkills && analysis.keySkills.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                      <Code2 className="w-3 h-3" /> Compétences clés
                      <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                        {analysis.keySkills.length}
                      </span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.keySkills.slice(0, 20).map((skill: any, i: number) => (
                        <span
                          key={i}
                          className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200 hover:bg-slate-200 transition-colors"
                        >
                          {getSkillName(skill)}
                        </span>
                      ))}
                      {analysis.keySkills.length > 20 && (
                        <Dialog open={showAllSkills} onOpenChange={setShowAllSkills}>
                          <DialogTrigger asChild>
                            <button 
                              className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200 hover:bg-slate-200 transition-colors flex items-center gap-1"
                              onClick={() => setShowAllSkills(true)}
                            >
                              +{analysis.keySkills.length - 20}
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Code2 className="w-5 h-5 text-slate-600" />
                                Toutes les compétences clés ({analysis.keySkills.length})
                              </DialogTitle>
                            </DialogHeader>
                            <div className="mt-4">
                              <div className="flex flex-wrap gap-2">
                                {analysis.keySkills.map((skill: any, i: number) => (
                                  <span
                                    key={i}
                                    className="text-sm px-3 py-1.5 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200"
                                  >
                                    {getSkillName(skill)}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                )}

                {/* Specializations */}
                {analysis.specializations && analysis.specializations.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                      <Star className="w-3 h-3" /> Spécialisations
                      <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold">
                        {analysis.specializations.length}
                      </span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.specializations.map((spec: string, i: number) => (
                        <span
                          key={i}
                          className="text-xs px-2.5 py-1 rounded-md bg-purple-100 text-purple-700 font-medium border border-purple-200"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strengths */}
                {analysis.strengths && analysis.strengths.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Forces
                      <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">
                        {analysis.strengths.length}
                      </span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.strengths.map((strength: string, i: number) => (
                        <span
                          key={i}
                          className="text-xs px-2.5 py-1 rounded-md bg-green-100 text-green-700 font-medium border border-green-200"
                        >
                          {strength}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {analysis.education && analysis.education.length > 0 && (() => {
                 
                  const mostRecent = getMostRecentEducation(analysis.education);
                  console.log('mostRecent education:', mostRecent);
                  
                  if (!mostRecent) {
                    console.log('No most recent education found');
                    return null;
                  }
                  
                  // Vérifier si les données essentielles sont valides
                  if (!mostRecent.degree || !mostRecent.institution) {
                    console.log('Education missing essential data:', mostRecent);
                    return null;
                  }
                  
                  // Accepter si les données ne sont pas "Non spécifié" OU si elles contiennent des mots-clés valides
                  const hasValidDegree = mostRecent.degree !== 'Non spécifié' || 
                                     mostRecent.degree?.toLowerCase().includes('engineering') ||
                                     mostRecent.degree?.toLowerCase().includes('software') ||
                                     mostRecent.degree?.toLowerCase().includes('master') ||
                                     mostRecent.degree?.toLowerCase().includes('bachelor') ||
                                     mostRecent.degree?.toLowerCase().includes('license');
                                     
                  const hasValidInstitution = mostRecent.institution !== 'Non spécifié' ||
                                         mostRecent.institution?.toLowerCase().includes('institute') ||
                                         mostRecent.institution?.toLowerCase().includes('university') ||
                                         mostRecent.institution?.toLowerCase().includes('school');
                  
                  if (!hasValidDegree || !hasValidInstitution) {
                    console.log('Education has invalid data:', mostRecent);
                    return null;
                  }
                
                  return (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                        <GraduationCap className="w-3 h-3" /> Formation
                      </p>
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <GraduationCap className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-blue-900 leading-tight">{mostRecent.degree}</p>
                          <p className="text-xs text-blue-700 mt-0.5">{mostRecent.institution}</p>
                          {mostRecent.field && mostRecent.field !== 'Non spécifié' && (
                            <p className="text-[11px] text-blue-500 mt-0.5">{mostRecent.field}</p>
                          )}
                        </div>
                        {mostRecent.year && mostRecent.year !== 'Non spécifié' && (
                          <span className="ml-auto text-xs font-semibold text-blue-600 flex-shrink-0">{typeof mostRecent.year === 'string' ? mostRecent.year : 'Non spécifié'}</span>
                        )}
                      </div>
                      {analysis.education.length > 1 && (
                        <Dialog open={showAllEducation} onOpenChange={setShowAllEducation}>
                          <DialogTrigger asChild>
                            <button 
                              className="text-[11px] text-muted-foreground mt-1 pl-1 hover:text-foreground transition-colors flex items-center gap-1"
                              onClick={() => setShowAllEducation(true)}
                            >
                              + {analysis.education.length - 1} autre{analysis.education.length > 2 ? 's' : ''} diplôme{analysis.education.length > 2 ? 's' : ''}
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <GraduationCap className="w-5 h-5 text-blue-600" />
                                Toutes les formations ({analysis.education.length})
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-3 mt-4">
                              {analysis.education
                                .filter((edu: any) => edu.degree !== 'Non spécifié' && edu.institution !== 'Non spécifié')
                                .sort((a: any, b: any) => {
                                  // Trier par année décroissante
                                  const yearA = parseInt(a.year) || 0;
                                  const yearB = parseInt(b.year) || 0;
                                  return yearB - yearA;
                                })
                                .map((edu: any, index: number) => (
                                  <div key={index} className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                      <GraduationCap className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-semibold text-blue-900 leading-tight">{edu.degree}</p>
                                      <p className="text-sm text-blue-700 mt-0.5">{edu.institution}</p>
                                      {edu.field && edu.field !== 'Non spécifié' && (
                                        <p className="text-xs text-blue-500 mt-0.5">{edu.field}</p>
                                      )}
                                    </div>
                                    {edu.year && edu.year !== 'Non spécifié' && (
                                      <span className="text-sm font-semibold text-blue-600 flex-shrink-0">{typeof edu.year === 'string' ? edu.year : 'Non spécifié'}</span>
                                    )}
                                  </div>
                                ))}
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  );
                })()}

                {/* Certifications */}
                {analysis.certifications && analysis.certifications.filter((c: any) => c.name && c.name !== 'Non spécifié').length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                      <Award className="w-3 h-3" /> Certifications
                      <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                        {analysis.certifications.filter((c: any) => c.name && c.name !== 'Non spécifié').length}
                      </span>
                    </p>
                    <div className="space-y-1.5">
                      {analysis.certifications
                        .filter((cert: any) => cert.name && cert.name !== 'Non spécifié')
                        .slice(0, 3)
                        .map((cert: any, index: number) => (
                          <div key={index} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                            <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0">
                              <Award className="w-3 h-3 text-slate-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-slate-900 truncate">{cert.name}</p>
                              {cert.issuer && cert.issuer !== 'Non spécifié' && (
                                <p className="text-[11px] text-slate-600">{cert.issuer}</p>
                              )}
                            </div>
                            {cert.year && cert.year !== 'Non spécifié' && (
                              <span className="text-[11px] font-semibold text-slate-700 flex-shrink-0">{typeof cert.year === 'string' ? cert.year : 'Non spécifié'}</span>
                            )}
                          </div>
                        ))}
                      {analysis.certifications.filter((c: any) => c.name && c.name !== 'Non spécifié').length > 3 && (
                        <Dialog open={showAllCertifications} onOpenChange={setShowAllCertifications}>
                          <DialogTrigger asChild>
                            <button 
                              className="text-[11px] text-muted-foreground pl-1 hover:text-foreground transition-colors flex items-center gap-1"
                              onClick={() => setShowAllCertifications(true)}
                            >
                              + {analysis.certifications.filter((c: any) => c.name && c.name !== 'Non spécifié').length - 3} autre{analysis.certifications.filter((c: any) => c.name && c.name !== 'Non spécifié').length - 3 > 1 ? 's' : ''}
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Award className="w-5 h-5 text-slate-600" />
                                Toutes les certifications ({analysis.certifications.filter((c: any) => c.name && c.name !== 'Non spécifié').length})
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-3 mt-4">
                              {analysis.certifications
                                .filter((cert: any) => cert.name && cert.name !== 'Non spécifié')
                                .map((cert: any, index: number) => (
                                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                                      <Award className="w-4 h-4 text-slate-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-semibold text-slate-900">{cert.name}</p>
                                      {cert.issuer && cert.issuer !== 'Non spécifié' && (
                                        <p className="text-sm text-slate-700">{cert.issuer}</p>
                                      )}
                                    </div>
                                    {cert.year && cert.year !== 'Non spécifié' && (
                                      <span className="text-sm font-semibold text-slate-700 flex-shrink-0">{typeof cert.year === 'string' ? cert.year : 'Non spécifié'}</span>
                                    )}
                                  </div>
                                ))}
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                )}

                {/* Projects */}
                {analysis.projects && analysis.projects.filter((p: any) => p.name && p.name !== 'Non spécifié').length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                      <FolderGit2 className="w-3 h-3" /> Projets notables
                      <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                        {analysis.projects.filter((p: any) => p.name && p.name !== 'Non spécifié').length}
                      </span>
                    </p>
                    <div className="space-y-2">
                      {analysis.projects
                        .filter((project: any) => project.name && project.name !== 'Non spécifié')
                        .slice(0, 3)
                        .map((project: any, index: number) => (
                          <div key={index} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                            <div className="flex items-start gap-2">
                              <div className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <FolderGit2 className="w-3 h-3 text-slate-600" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-slate-900">{project.name}</p>
                                {project.description && project.description !== 'Non spécifié' && (
                                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed line-clamp-2">
                                    {project.description}
                                  </p>
                                )}
                                {project.technologies && Array.isArray(project.technologies) && project.technologies.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    {project.technologies.slice(0, 4).map((tech: any, ti: number) => (
                                      <span key={ti} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                                        {getSkillName(tech)}
                                      </span>
                                    ))}
                                    {project.technologies.length > 4 && (
                                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                        +{project.technologies.length - 4}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      {analysis.projects.filter((p: any) => p.name && p.name !== 'Non spécifié').length > 3 && (
                        <Dialog open={showAllProjects} onOpenChange={setShowAllProjects}>
                          <DialogTrigger asChild>
                            <button 
                              className="text-[11px] text-muted-foreground pl-1 hover:text-foreground transition-colors flex items-center gap-1"
                              onClick={() => setShowAllProjects(true)}
                            >
                              + {analysis.projects.filter((p: any) => p.name && p.name !== 'Non spécifié').length - 3} autre{analysis.projects.filter((p: any) => p.name && p.name !== 'Non spécifié').length - 3 > 1 ? 's' : ''} projet{analysis.projects.filter((p: any) => p.name && p.name !== 'Non spécifié').length - 3 > 1 ? 's' : ''}
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <FolderGit2 className="w-5 h-5 text-slate-600" />
                                Tous les projets ({analysis.projects.filter((p: any) => p.name && p.name !== 'Non spécifié').length})
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                              {analysis.projects
                                .filter((project: any) => project.name && project.name !== 'Non spécifié')
                                .map((project: any, index: number) => (
                                  <div key={index} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                    <div className="flex items-start gap-3">
                                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-1">
                                        <FolderGit2 className="w-4 h-4 text-slate-600" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-slate-900 mb-2">{project.name}</p>
                                        {project.description && project.description !== 'Non spécifié' && (
                                          <p className="text-sm text-slate-600 mb-3 leading-relaxed">
                                            {project.description}
                                          </p>
                                        )}
                                        {project.technologies && Array.isArray(project.technologies) && project.technologies.length > 0 && (
                                          <div className="flex flex-wrap gap-2">
                                            {project.technologies.map((tech: any, ti: number) => (
                                              <span key={ti} className="text-xs px-2 py-1 rounded-md bg-slate-100 text-slate-700 font-medium">
                                                {getSkillName(tech)}
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </div>
          ) : technicalProfileData ? (
            <div className="glass-card p-6 text-center">
              <Cpu className="w-8 h-8 text-muted-foreground mx-auto mb-2 animate-pulse" />
              <p className="text-sm text-muted-foreground">Analyse IA en cours...</p>
            </div>
          ) : (
            <div className="glass-card p-6 text-center">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-sm text-red-600 font-medium">CV non analysé</p>
              <p className="text-xs text-muted-foreground mt-1">L'analyse IA n'est pas disponible pour ce candidat.</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Vérification d'éligibilité
            </h3>
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

          {!shouldHideConfig && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-500" />
                Configuration du test
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Niveau du test</Label>
                    <Select value={testConfig.level} onValueChange={(value) => setTestConfig(prev => ({ ...prev, level: value }))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="junior">Junior</SelectItem>
                        <SelectItem value="intermediate">Intermédiaire</SelectItem>
                        <SelectItem value="senior">Senior</SelectItem>
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
                    <p className="text-xs text-muted-foreground mt-1">5-50 questions</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Durée (minutes)</Label>
                    <Input
                      type="number"
                      min="15"
                      max="180"
                      value={testConfig.duration}
                      onChange={(e) => setTestConfig(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">15-180 minutes</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Date limite *</Label>
                    <Input
                      type="date"
                      value={testConfig.deadline}
                      onChange={(e) => setTestConfig(prev => ({ ...prev, deadline: e.target.value }))}
                      className="mt-1"
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                    {testConfig.deadline && new Date(testConfig.deadline) < new Date(new Date().toDateString()) && (
                      <p className="text-xs text-red-500 mt-1">La date limite ne peut pas être antérieure à aujourd'hui</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Note au candidat (optionnelle)</Label>
                  <Textarea
                    value={testConfig.note}
                    onChange={(e) => setTestConfig(prev => ({ ...prev, note: e.target.value }))}
                    placeholder="Message personnalisé..."
                    className="mt-1"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Decision panel */}
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
                    ? "Un test a déjà été généré pour ce candidat. Vous pouvez consulter les résultats."
                    : "Générez un test technique personnalisé pour évaluer les compétences du candidat."
                  }
                </p>
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
                  
                </>
              ) : (
                <>
                  <Button 
                    className="flex items-center gap-2" 
                    onClick={handleGenerateTest}
                    disabled={updateCandidatureStatusMutation.isPending || !testConfig.deadline || (!!testConfig.deadline && new Date(testConfig.deadline) < new Date(new Date().toDateString()))}
                  >
                    <Sparkles className="w-4 h-4" />
                    {updateCandidatureStatusMutation.isPending ? 'Génération en cours...' : 'Générer le test'}
                  </Button>
                  
                  {candidateData.status !== 'ACCEPTED' && (
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
                    : `Le test sera généré automatiquement par notre service IA. Un lien d'accès unique sera envoyé à ${candidateData?.email}.`}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerateTestPage;
