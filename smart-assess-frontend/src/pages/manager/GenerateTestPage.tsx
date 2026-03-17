import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Check, X, AlertCircle, ArrowLeft, User, FileText, Calendar, Mail, Phone } from "lucide-react";
import { useCandidatures, useTechnicalProfiles, useUpdateCandidature } from "@/hooks/useApiHooks";
import { toast } from "sonner";
import apiService from "@/services/apiService";
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
  const updateCandidatureMutation = useUpdateCandidature();
  
  const [candidateData, setCandidateData] = useState<any>(null);
  const [technicalProfile, setTechnicalProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [existingTest, setExistingTest] = useState<any>(null);
  const [isCheckingExistingTest, setIsCheckingExistingTest] = useState(false);
  const [testConfig, setTestConfig] = useState({
    level: "junior",
    questionCount: 20,
    duration: 60,
    deadline: "",
    note: ""
  });

  // Charger les données du candidat
  useEffect(() => {
    const loadCandidateData = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        
        // Récupérer les détails de la candidature
        const candidatureResponse = await apiService.candidatureService.getById(Number(id));
        console.log('Candidature response:', candidatureResponse);
        console.log('Candidature data:', candidatureResponse.data);
        
        // Les données sont directement dans la réponse, pas dans .data
        const candidature = candidatureResponse;
        
        if (!candidature) {
          console.error('No candidature data found');
          return;
        }
        
        const candidateDataToSet = {
          id: candidature.id || Number(id),
          firstName: candidature.candidateFirstName || candidature.firstName || '',
          lastName: candidature.candidateLastName || candidature.lastName || '',
          email: candidature.candidateEmail || candidature.email || '',
          phone: candidature.candidatePhone || candidature.phone || '',
          position: {
            id: candidature.internshipPositionId || candidature.positionId || 0,
            title: candidature.positionTitle || 'Poste non spécifié',
            company: candidature.positionCompany || 'Entreprise'
          },
          status: candidature.status || 'PENDING',
          appliedAt: candidature.appliedAt || new Date().toISOString(),
          cvUrl: candidature.cvUrl
        };
        
        console.log('Setting candidate data:', candidateDataToSet);
        setCandidateData(candidateDataToSet);

        // Récupérer le profil technique si disponible
        if (candidature.candidateId) {
          try {
            const profileResponse = await apiService.technicalProfileService.getByCandidateId(candidature.candidateId);
            console.log('Technical profile response:', profileResponse);
            
            // Les données sont directement dans la réponse, pas dans .data
            const profileData = profileResponse;
            if (profileData) {
              console.log('Setting technical profile:', profileData);
              setTechnicalProfile(profileData);
              
              // Mettre à jour l'URL du CV si disponible via cvId
              if (profileData.cvId && !candidateData.cvUrl) {
                setCandidateData(prev => ({
                  ...prev!,
                  cvUrl: `/api/candidates/download/${profileData.cvId}`
                }));
              }
            }
          } catch (profileError) {
            console.log('No technical profile found for this candidate - this is normal if no CV has been uploaded/analyzed yet');
            
            // Essayer de récupérer l'URL du CV depuis la candidature directement
            if (candidature.cvUrl) {
              setCandidateData(prev => ({
                ...prev!,
                cvUrl: candidature.cvUrl
              }));
            }
          }
        }
        
      } catch (error) {
        console.error('Error loading candidate data:', error);
        toast.error('Erreur lors du chargement des données du candidat');
      } finally {
        setIsLoading(false);
      }
    };

    loadCandidateData();
  }, [id]);

  // Surveiller les changements de candidateData pour debugging
  useEffect(() => {
    console.log('CandidateData updated:', candidateData);
  }, [candidateData]);

  // Vérifier si un test existe déjà pour cette candidature
  const checkExistingTest = async () => {
    if (!candidateData?.id) {
      console.log('No candidate data ID available');
      return;
    }
    
    console.log('Checking existing test for candidate ID:', candidateData.id);
    
    try {
      setIsCheckingExistingTest(true);
      
      // Utiliser l'endpoint dédié pour vérifier l'existence SANS générer de test
      const response = await apiService.testService.checkExistingTest(candidateData.id);
      console.log('Check existing test response:', response);
      
      if (response.hasTest) {
        // Un test existe déjà
        setExistingTest({
          existingTestId: response.testId,
          existingTestToken: response.token,
          existingTestStatus: response.status,
          existingTestCreatedAt: response.createdAt
        });
        console.log('Existing test detected:', response);
        toast.info("Un test existe déjà pour cette candidature");
      } else {
        // Aucun test n'existe
        setExistingTest(null);
        console.log('No existing test found for candidature:', candidateData.id);
      }
      
    } catch (error: any) {
      console.log('Error checking existing test:', error);
      console.log('Error status:', error.response?.status);
      console.log('Error data:', error.response?.data);
      
      // En cas d'erreur, on suppose qu'aucun test n'existe pour ne pas bloquer l'interface
      setExistingTest(null);
      console.error('Error occurred while checking existing test, assuming no test exists');
    } finally {
      setIsCheckingExistingTest(false);
    }
  };

  useEffect(() => {
    if (candidateData?.id && technicalProfile) {
      // Attendre un peu pour éviter les race conditions
      const timer = setTimeout(() => {
        checkExistingTest();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [candidateData?.id, technicalProfile]);

  // Fonction pour obtenir l'URL du CV
  const getCvUrl = () => {
    // Priorité 1: URL depuis candidateData.cvUrl
    if (candidateData?.cvUrl) {
      return candidateData.cvUrl;
    }
    
    // Priorité 2: URL depuis technicalProfile.cvId
    if (technicalProfile?.cvId) {
      return `/api/candidates/download/${technicalProfile.cvId}`;
    }
    
    // Priorité 3: Essayer avec l'ID de la candidature (si le CV est stocké avec la candidature)
    if (candidateData?.id) {
      return `/api/candidates/download/candidature/${candidateData.id}`;
    }
    
    return null;
  };

  const cvUrl = getCvUrl();

  // Fonction pour télécharger le CV avec authentification
  const downloadCV = async () => {
    if (!cvUrl) return;
    
    try {
      const response = await fetch(`http://localhost:8080${cvUrl}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
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

  // Fonction pour ouvrir le CV dans un nouvel onglet
  const openCV = async () => {
    if (!cvUrl) return;
    
    try {
      const response = await fetch(`http://localhost:8080${cvUrl}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'ouverture du CV');
      }
      
      const blob = await response.blob();
      
      // Créer une URL blob avec le bon type MIME
      const blobUrl = URL.createObjectURL(blob);
      
      // Ouvrir dans un nouvel onglet
      const newWindow = window.open(blobUrl, '_blank');
      
      if (newWindow) {
        // Focus sur la nouvelle fenêtre
        newWindow.focus();
        toast.success('CV ouvert dans un nouvel onglet');
        
        // Nettoyer l'URL après un certain temps
        setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
        }, 10000); // 10 secondes
      } else {
        // Si le popup est bloqué, télécharger directement
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `CV_${candidateData?.firstName}_${candidateData?.lastName}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.info('Le popup a été bloqué. Le CV a été téléchargé à la place.');
        
        // Nettoyer l'URL
        setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
        }, 1000);
      }
      
    } catch (error) {
      console.error('Error opening CV:', error);
      toast.error('Erreur lors de l\'ouverture du CV');
    }
  };

  // Extraire les compétences et autres données du profil technique
  const extractSkillsFromProfile = () => {
    if (!technicalProfile?.parsedData) return [];
    
    const data = technicalProfile.parsedData;
    const skills = [];
    let hasRealSkills = false;
    
    // Extraire les compétences depuis Technical Information.technologies
    if (data["Technical Information"]?.["technologies"]) {
      const techData = data["Technical Information"]["technologies"];
      
      // Parcourir toutes les catégories de technologies
      Object.keys(techData).forEach(category => {
        const categorySkills = techData[category];
        if (Array.isArray(categorySkills)) {
          categorySkills.forEach(skill => {
            if (typeof skill === 'string' && skill.trim()) {
              skills.push({ name: skill.trim(), level: "Intermédiaire" });
              hasRealSkills = true;
            } else if (skill && typeof skill === 'object' && skill.name && skill.name.trim()) {
              skills.push({ name: skill.name.trim(), level: skill.level || "Intermédiaire" });
              hasRealSkills = true;
            }
          });
        }
      });
    }
    
    // Retourner les compétences seulement si des compétences réelles ont été trouvées
    return hasRealSkills ? skills.slice(0, 6) : [];
  };

  const extractAnalysisFromProfile = () => {
    if (!technicalProfile?.parsedData) return "Analyse non disponible";
    
    const data = technicalProfile.parsedData;
    let analysis = [];
    
    // Informations personnelles
    if (data["Basic Information"]?.["full_name"]) {
      analysis.push(`**${data["Basic Information"]["full_name"]}`);
    }
    
    if (data["Basic Information"]?.["email"]) {
      analysis.push(`${data["Basic Information"]["email"]}`);
    }
    
    if (data["Basic Information"]?.["phone"]) {
      analysis.push(`${data["Basic Information"]["phone"]}`);
    }
    
    // Domaine et expérience
    if (data["Technical Information"]?.["domain"]) {
      analysis.push(`**Domaine d'expertise :** ${data["Technical Information"]["domain"]}`);
    }
    
    // Expérience professionnelle
    if (data["Work Experience"] && data["Work Experience"].length > 0) {
      const expCount = data["Work Experience"].length;
      const latestJob = data["Work Experience"][0];
      const expText = expCount === 1 ? "1 expérience professionnelle" : `${expCount} expériences professionnelles`;
      
      if (latestJob?.position && latestJob?.company) {
        analysis.push(`**${expText}** - Dernier poste : ${latestJob.position} chez ${latestJob.company}`);
        if (latestJob.duration) {
          analysis.push(`Durée : ${latestJob.duration}`);
        }
      } else {
        analysis.push(`**${expText}** détectées`);
      }
    }
    
    // Projets
    if (data["Projects"] && data["Projects"].length > 0) {
      const projectCount = data["Projects"].length;
      analysis.push(`**${projectCount} projet(s) réalisé(s)**`);
      
      // Afficher les 2-3 premiers projets les plus récents
      const recentProjects = data["Projects"].slice(0, 2);
      recentProjects.forEach((project, index) => {
        if (project.name) {
          const techStack = project.technologies && project.technologies.length > 0 
            ? ` (${project.technologies.slice(0, 3).join(', ')})` 
            : '';
          analysis.push(`• ${project.name}${techStack}`);
        }
      });
    }
    
    // Compétences techniques principales
    const allSkills = [];
    if (data["Technical Information"]?.["technologies"]) {
      Object.values(data["Technical Information"]["technologies"]).forEach(categorySkills => {
        if (Array.isArray(categorySkills)) {
          categorySkills.forEach(skill => {
            if (typeof skill === 'string') {
              allSkills.push(skill);
            } else if (skill && skill.name) {
              allSkills.push(skill.name);
            }
          });
        }
      });
    }
    
    if (allSkills.length > 0) {
      const topSkills = allSkills.slice(0, 8);
      analysis.push(`**Compétences principales :** ${topSkills.join(', ')}`);
    }
    
    // Certifications
    if (data["Certifications"] && data["Certifications"].length > 0) {
      const certCount = data["Certifications"].length;
      analysis.push(`**${certCount} certification(s) obtenue(s)**`);
      
      // Afficher les certifications les plus pertinentes
      const topCerts = data["Certifications"].slice(0, 2);
      topCerts.forEach(cert => {
        if (cert.name) {
          const issuer = cert.issuer ? ` - ${cert.issuer}` : '';
          const date = cert.date ? ` (${cert.date})` : '';
          analysis.push(`• ${cert.name}${issuer}${date}`);
        }
      });
    }
    
    // Formation
    if (data["Education"] && data["Education"].length > 0) {
      const education = data["Education"][0];
      if (education.degree && education.institution) {
        analysis.push(`**Formation :** ${education.degree} - ${education.institution}`);
      }
    }
    
    // Langues
    if (data["Languages"] && data["Languages"].length > 0) {
      const languages = data["Languages"].slice(0, 3).map(lang => 
        typeof lang === 'string' ? lang : lang.name || lang
      ).join(', ');
      if (languages) {
        analysis.push(`**Langues :** ${languages}`);
      }
    }
    
    return analysis.length > 0 ? analysis.join('\n') : "Analyse IA du CV en cours de traitement...";
  };

  const calculateQualityScore = () => {
    if (!technicalProfile?.parsedData) return 0;
    
    const data = technicalProfile.parsedData;
    let score = 0;
    let hasRealData = false;
    
    // Points pour les compétences (max 3 points)
    const allSkills = [];
    if (data["Technical Information"]?.["technologies"]) {
      Object.values(data["Technical Information"]["technologies"]).forEach(categorySkills => {
        if (Array.isArray(categorySkills)) {
          categorySkills.forEach(skill => {
            if (typeof skill === 'string' && skill.trim()) {
              allSkills.push(skill);
              hasRealData = true;
            } else if (skill && skill.name && skill.name.trim()) {
              allSkills.push(skill.name);
              hasRealData = true;
            }
          });
        }
      });
    }
    
    if (allSkills.length >= 8) score += 3;
    else if (allSkills.length >= 5) score += 2;
    else if (allSkills.length >= 3) score += 1;
    
    // Points pour l'expérience (max 3 points)
    if (data["Work Experience"] && data["Work Experience"].length > 0) {
      const expCount = data["Work Experience"].length;
      hasRealData = true;
      if (expCount >= 3) score += 3;
      else if (expCount >= 2) score += 2;
      else if (expCount >= 1) score += 1;
    }
    
    // Points pour les projets (max 2 points)
    if (data["Projects"] && data["Projects"].length > 0) {
      const projectCount = data["Projects"].length;
      hasRealData = true;
      if (projectCount >= 3) score += 2;
      else if (projectCount >= 1) score += 1;
    }
    
    // Points pour les certifications (max 1 point)
    if (data["Certifications"] && data["Certifications"].length > 0) {
      hasRealData = true;
      score += 1;
    }
    
    // Points pour la formation (max 1 point)
    if (data["Education"] && data["Education"].length > 0) {
      hasRealData = true;
      score += 1;
    }
    
    // Si aucune donnée réelle n'a été trouvée, retourner 0
    return hasRealData ? Math.min(score, 10) : 0;
  };

  const determineExperienceLevel = () => {
    if (!technicalProfile?.parsedData) return 'N/A';
    
    const data = technicalProfile.parsedData;
    const score = calculateQualityScore();
    
    // Si le score est 0, aucune donnée réelle n'a été trouvée
    if (score === 0) return 'N/A';
    
    // Basé sur le score et l'expérience détectée
    const expCount = data["Work Experience"] ? data["Work Experience"].length : 0;
    const projectCount = data["Projects"] ? data["Projects"].length : 0;
    
    if (score >= 8 || expCount >= 5) return 'SENIOR';
    if (score >= 6 || expCount >= 3) return 'CONFIRMÉ';
    if (score >= 4 || expCount >= 1) return 'INTERMÉDIAIRE';
    if (score >= 2 || projectCount >= 2) return 'JUNIOR';
    return 'DÉBUTANT';
  };

  const getEligibilityChecks = () => {
    const checks = [];
    const data = technicalProfile?.parsedData;
    
    // Vérification du domaine d'expertise
    const candidateDomain = data?.["Technical Information"]?.["domain"];
    const acceptedDomains = candidateData?.position?.acceptedDomains || [];
    
    // Fonction pour normaliser et comparer les domaines
    const normalizeDomain = (domain: string) => {
      return domain.toLowerCase()
        .trim()
        .replace(/[^\w\s]/g, '') // Supprimer les caractères spéciaux
        .replace(/\s+/g, ' '); // Normaliser les espaces
    };
    
    // Dictionnaire d'équivalences de domaines (français/anglais)
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
    
    // Vérifier l'éligibilité du domaine avec correspondance intelligente
    const isDomainEligible = candidateDomain && (
      acceptedDomains.length === 0 || 
      acceptedDomains.some(acceptedDomain => {
        const normalizedAccepted = normalizeDomain(acceptedDomain);
        const normalizedCandidate = normalizeDomain(candidateDomain);
        
        // Correspondance directe
        if (normalizedAccepted === normalizedCandidate) return true;
        
        // Correspondance partielle
        if (normalizedAccepted.includes(normalizedCandidate) || normalizedCandidate.includes(normalizedAccepted)) return true;
        
        // Vérifier les équivalences sémantiques
        for (const [canonicalDomain, equivalents] of Object.entries(domainEquivalences)) {
          const normalizedCanonical = normalizeDomain(canonicalDomain);
          
          // Si le domaine accepté correspond à une équivalence
          if (equivalents.some(eq => normalizeDomain(eq) === normalizedAccepted)) {
            // Vérifier si le domaine du candidat correspond aussi à cette équivalence
            return equivalents.some(eq => normalizeDomain(eq) === normalizedCandidate);
          }
        }
        
        return false;
      })
    );
    
    if (candidateData?.position.title) {
      checks.push({ 
        label: `Poste : ${candidateData.position.title}`, 
        ok: true 
      });
    }
    
    if (data) {
      checks.push({ 
        label: 'CV analysé par IA — données extraites avec succès', 
        ok: true 
      });
      
      // Vérification du domaine
      if (candidateDomain) {
        if (isDomainEligible) {
          checks.push({ 
            label: `Domaine : ${candidateDomain} — compatible avec le poste`, 
            ok: true 
          });
        } else {
          checks.push({ 
            label: `Domaine : ${candidateDomain} — non compatible avec les domaines requis (${acceptedDomains.join(', ') || 'Non spécifié'})`, 
            ok: false 
          });
        }
      } else {
        checks.push({ 
          label: 'Domaine non détecté dans le CV', 
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
            label: `${allSkills.length} compétence(s) technique(s) détectée(s)`, 
            ok: true 
          });
        }
      }
    }
    
    // Éligibilité globale
    const isEligible = isDomainEligible && data && candidateDomain;
    checks.push({ 
      label: isEligible ? 'Candidature éligible pour génération de test' : 'Candidature non éligible — domaine incompatible', 
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

  // Forcer la régénération du test (ignorer la détection de test existant)
  const handleForceGenerateTest = async () => {
    if (!candidateData || !technicalProfile) {
      toast.error('Veuillez patienter que les données du candidat soient chargées');
      return;
    }

    try {
      // Mettre à jour le statut de la candidature à TEST_SENT (pas ACCEPTED)
      updateCandidatureMutation.mutate({
        id: candidateData.id,
        status: 'TEST_SENT'
      });

      // Appeler l'API pour générer le test directement
      const testResponse = await apiService.testService.generateTest({
        candidatureId: candidateData.id,
        level: testConfig.level,
        questionCount: testConfig.questionCount,
        duration: testConfig.duration,
        deadline: testConfig.deadline,
        note: testConfig.note || ""
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
        console.log('Stored questions in localStorage:', formattedQuestions);
      }
      
      // Réinitialiser l'état du test existant
      setExistingTest(null);
      
      toast.success('Test généré avec succès ! Redirection vers la révision...');
      
      // Rediriger vers la page de révision du test
      navigate(`/manager/test-review/${testResponse.testId}`);
      
    } catch (error: any) {
      console.error('Error generating test:', error);
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
      
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
          
          toast.error("Un test existe déjà pour cette candidature. Impossible de forcer la génération.");
          return;
        }
      }
      
      const errorMessage = error.response?.data?.message || error.message || 'Erreur inconnue';
      toast.error(`Erreur lors de la génération du test: ${errorMessage}`);
    }
  };

  const handleGenerateTest = async () => {
    if (!candidateData || !technicalProfile) {
      toast.error('Veuillez patienter que les données du candidat soient chargées');
      return;
    }

    try {
      // Mettre à jour le statut de la candidature à TEST_SENT (pas ACCEPTED)
      updateCandidatureMutation.mutate({
        id: candidateData.id,
        status: 'TEST_SENT'
      });

      // Appeler l'API pour générer le test directement
      const testResponse = await apiService.testService.generateTest({
        candidatureId: candidateData.id,
        level: testConfig.level,
        questionCount: testConfig.questionCount,
        duration: testConfig.duration,
        deadline: testConfig.deadline,
        note: testConfig.note || ""
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
        console.log('Stored questions in localStorage:', formattedQuestions);
      }
      
      toast.success('Test généré avec succès ! Redirection vers la révision...');
      
      // Rediriger vers la page de révision du test
      navigate(`/manager/test-review/${testResponse.testId}`);
      
    } catch (error: any) {
      console.error('Error generating test:', error);
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
      
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
      await updateCandidatureMutation.mutateAsync({
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

  if (isLoading) {
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
  const analysis = extractAnalysisFromProfile();
  const eligibility = getEligibilityChecks();

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
        <Badge variant="outline" className={getStatusColor(candidateData.status)}>
          {getStatusLabel(candidateData.status)}
        </Badge>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Candidate Profile */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary">Profil candidat</Badge>
              {technicalProfile && <Badge variant="outline">Analyse IA disponible</Badge>}
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary">
                {candidateData.firstName[0]}{candidateData.lastName[0]}
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
                  {technicalProfile ? 'ANALYSÉ' : 'NON ANALYSÉ'}
                </div>
                <div className="text-xs text-muted-foreground">Statut IA</div>
              </div>
            </div>

            <div className="glass-card p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Analyse IA du CV</h3>
              </div>
              <div className="text-sm text-muted-foreground whitespace-pre-line">
                {analysis.split('\n').map((line, index) => {
                  if (line.startsWith('**') && line.endsWith('**')) {
                    return (
                      <div key={index} className="font-semibold text-foreground mt-2">
                        {line.replace(/\*\*/g, '')}
                      </div>
                    );
                  } else if (line.startsWith('**')) {
                    return (
                      <div key={index} className="font-semibold text-foreground">
                        {line.replace(/\*\*/g, '')}
                      </div>
                    );
                  } else if (line.startsWith('•')) {
                    return (
                      <div key={index} className="ml-4 text-muted-foreground">
                        {line}
                      </div>
                    );
                  } else if (line.trim() === '') {
                    return <div key={index} className="h-2" />;
                  } else {
                    return (
                      <div key={index} className="text-muted-foreground">
                        {line}
                      </div>
                    );
                  }
                })}
              </div>
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
                  
                  {technicalProfile?.cvId && (
                    <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
                      <div className="flex items-center gap-1 mb-1">
                        <Check className="w-3 h-3 text-blue-600" />
                        <span className="font-medium text-blue-600">CV analysé par l'IA</span>
                      </div>
                      <p>L'analyse a été effectuée sur ce fichier le {new Date(technicalProfile.createdAt).toLocaleDateString('fr-FR')}</p>
                      <p className="text-xs text-gray-500 mt-1">CV ID: {technicalProfile.cvId}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center p-4 bg-muted/20 rounded-lg">
                  <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">CV non disponible</p>
                  <p className="text-xs text-muted-foreground mt-1">Le candidat n'a pas encore uploadé de CV</p>
                  {technicalProfile ? (
                    <p className="text-xs text-gray-400 mt-2">Profil technique trouvé mais cvId: {technicalProfile.cvId || 'non défini'}</p>
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

            {skills.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-foreground mb-2">Compétences détectées</h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map((s) => (
                    <Badge key={s.name} variant="secondary" className="text-xs">
                      {s.name} · {s.level}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
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
              <p className="text-xs text-muted-foreground">
                {isCandidateEligible() 
                  ? "Prêt pour la génération de test" 
                  : "Non éligible — domaine incompatible ou non détecté"
                }
              </p>
            </div>
          </div>
        </div>

        {/* Right: Test Config */}
        <div className="space-y-6">
          {/* Configuration du test - Masquer si un test existe déjà */}
          {!existingTest && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Configuration du test à générer</h3>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Poste ciblé</Label>
                  <div className="mt-1 p-3 bg-muted rounded-md">
                    {candidateData?.position?.title || 'Poste non spécifié'}
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
            <h3 className="text-lg font-semibold text-foreground mb-2">Décision du Manager</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Cette action générera le test via l'IA et enverra le lien sécurisé par email au candidat.
            </p>
            <div className="flex gap-3">
              <Button 
                className="flex-1" 
                onClick={handleGenerateTest}
                disabled={updateCandidatureMutation.isPending || existingTest !== null}
              >
                {existingTest ? 
                  `Test déjà généré le ${new Date(existingTest.existingTestCreatedAt || '').toLocaleDateString()}` : 
                  (updateCandidatureMutation.isPending ? 'Génération...' : 'Accepter et générer le test')
                }
              </Button>
              
              {existingTest && (
                <Button 
                  variant="outline"
                  onClick={() => navigate(`/manager/test-review/${existingTest.existingTestId}`)}
                >
                  Voir le test existant
                </Button>
              )}
              
              {existingTest && (
                <Button 
                  variant="destructive"
                  onClick={handleForceGenerateTest}
                  disabled={updateCandidatureMutation.isPending}
                >
                  Forcer nouvelle génération
                </Button>
              )}
              <Button 
                variant="outline" 
                className="border-destructive/50 text-destructive hover:bg-destructive/10"
                onClick={handleReject}
                disabled={updateCandidatureMutation.isPending}
              >
                Refuser
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3 flex items-start gap-1">
              <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
              Le test sera généré automatiquement par le service IA. Un lien d'accès unique sera envoyé à <strong>{candidateData.email}</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerateTestPage;
