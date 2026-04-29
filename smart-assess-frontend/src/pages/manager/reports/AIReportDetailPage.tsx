import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, 
  Download, 
  Trash2, 
  User, 
  Building, 
  Calendar, 
  Brain,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  TrendingUp,
  Users,
  Target,
  Award,
  Star,
  Mail,
  MapPin,
  Briefcase,
  GraduationCap,
  Clock,
  Code, 
  BarChart3
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import apiClient from '@/lib/api';
import { generatePDFHTML } from '@/utils/ReportTemplate';
import jsPDF from 'jspdf';

interface EvaluationReport {
  id: number;
  candidateFirstName: string;
  candidateLastName: string;
  candidateEmail: string;
  positionTitle: string;
  positionCompany: string;
  fullReport: any;
  generatedAt: string;
  candidatureId: number;
}

interface ReportData {
  candidate_summary?: {
    name?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    experience_level?: string;
    key_skills?: string[];
    years_of_experience?: number;
    education?: string;
    languages?: string[];
    certifications?: string[];
    position_applied?: string;
    primary_domain?: string;
    key_technologies?: string[];
    key_skills_from_profile?: string[];
    career_level_from_profile?: string;
    applied_positions?: Array<{
      title: string;
      company: string;
      match?: number;
    }>;
  };
  technical_assessment?: {
    overall_score?: number;
    skill_breakdown?: Array<{
      skill: string;
      score: number;
      mastery_level: string;
      assessment: string;
    }>;
    technical_skills?: {
      [key: string]: {
        score?: number;
        level?: string;
        comments?: string;
      };
    };
    test_results?: {
      [key: string]: {
        score?: number;
        total_questions?: number;
        correct_answers?: number;
      };
    };
    strengths?: string[];
    improvement_areas?: string[];
  };
  position_analysis?: {
    position_title?: string;
    company?: string;
    position_requirements?: any;
    match?: number;
    max_possible_score?: number;
    percentage?: number;
    applied_position_match?: number;
    position_fit?: string;
    applied_positions?: Array<{
      id: number;
      title: string;
      company: string;
      description?: string;
      required_skills?: string[];
      match?: number;
    }>;
    recommended_positions?: Array<{
      position: string;
      fit_analysis?: string;
      reasoning?: string;
      strengths?: string[];
      skill_gaps?: string[];
    }>;
  };
  hiring_recommendation?: {
    recommendation?: string;
    score?: number;
    confidence?: string;
    composite_score?: number;
    composite_score_breakdown?: {
      technical_test_score: number;
      position_fit_score: number;
      technical_weight: number;
      position_weight: number;
      calculation_formula: string;
      final_composite_score: number;
    };
    reason?: string;
    reasons?: string[];
    recommendation_reasoning?: string;
    key_factors?: string[];
    strengths?: string[];
    weaknesses?: string[];
    potential_risks?: string[];
    next_steps?: string[];
    comment?: string;
  };
  team_fit_analysis?: {
    collaboration_level?: string;
    collaboration_potential?: string;
    problem_solving_approach?: string;
    readiness_for_team_environment?: string;
    team_fit?: string;
    leadership_potential?: string;
    adaptability_level?: string;
    communication_level?: string;
    work_style?: string;
    teamwork_preference?: string;
    motivation_level?: string;
    improvement_areas?: string[];
    comment?: string;
  };
  recommended_positions?: Array<{
    title: string;
    company?: string;
    match?: number;
    reasoning?: string;
  }>;
}

const AIReportDetailPage: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      if (!reportId) return;
      
      try {
        setLoading(true);
        const response = await apiClient.get(`/evaluation-reports/${reportId}`);
        
        console.log("=== DEBUG FRONTEND RÉPONSE BACKEND ===");
        console.log("Response data:", response.data);
        console.log("Response.data.fullReport:", response.data?.fullReport);
        console.log("Type de fullReport:", typeof response.data?.fullReport);
        console.log("fullReport est null?", response.data?.fullReport === null);
        console.log("fullReport est undefined?", response.data?.fullReport === undefined);
        console.log("=== FIN DEBUG RÉPONSE BACKEND ===");
        
        if (response.data) {
          setReport(response.data);
          
          let parsedData: ReportData = {};
          if (response.data.fullReport) {
            if (typeof response.data.fullReport === 'string') {
              parsedData = JSON.parse(response.data.fullReport);
            } else if (typeof response.data.fullReport === 'object' && response.data.fullReport !== null) {
              parsedData = response.data.fullReport;
            }
          }
          setReportData(parsedData);
        }
      } catch (error) {
        console.error('Error fetching report:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger le rapport",
          variant: "destructive"
        });
        navigate('/manager/reports');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [reportId, navigate]);

  const downloadReport = async () => {
    if (!report) return;
    
    try {
      let reportData;
      if (typeof report.fullReport === 'string') {
        reportData = JSON.parse(report.fullReport);
      } else if (typeof report.fullReport === 'object' && report.fullReport !== null) {
        reportData = report.fullReport;
      } else {
        throw new Error('Invalid report data format');
      }
      
      // Créer le contenu HTML formaté pour le PDF
      const htmlContent = generatePDFHTML(reportData, report);
      
      // Créer un nouveau document PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Ajouter le contenu au PDF avec une meilleure mise en page
      const candidateInfo = reportData.candidate_summary || {};
      const positionAnalysis = reportData.position_analysis || {};
      const technicalAssessment = reportData.technical_assessment || {};
      const hiringRecommendation = reportData.hiring_recommendation || {};
      
      let currentY = 20;
      
      // En-tête
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Rapport d\'Évaluation de Candidature', 105, currentY, { align: 'center' });
      currentY += 15;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 105, currentY, { align: 'center' });
      currentY += 10;
      
      // Ligne de séparation
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.5);
      pdf.line(20, currentY, 190, currentY);
      currentY += 10;
      
      // Informations du candidat
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Informations du Candidat', 20, currentY);
      currentY += 10;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Nom: ${candidateInfo.name || 'N/A'}`, 20, currentY);
      currentY += 7;
      pdf.text(`Email: ${candidateInfo.email || 'N/A'}`, 20, currentY);
      currentY += 7;
      pdf.text(`Domaine: ${candidateInfo.primary_domain || 'N/A'}`, 20, currentY);
      currentY += 7;
      pdf.text(`Expérience: ${candidateInfo.experience_level || 'N/A'}`, 20, currentY);
      currentY += 7;
      pdf.text(`Poste: ${candidateInfo.position_applied || 'N/A'}`, 20, currentY);
      currentY += 12;
      
      // Analyse du poste
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Analyse du Poste', 20, currentY);
      currentY += 10;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Fit avec le poste: ${positionAnalysis.applied_position_match || 0}%`, 20, currentY);
      currentY += 7;
      pdf.text(`Position: ${positionAnalysis.applied_position || 'N/A'}`, 20, currentY);
      currentY += 12;
      
      // Vérifier si on doit ajouter une nouvelle page
      if (currentY > 250) {
        pdf.addPage();
        currentY = 20;
      }
      
      // Évaluation technique
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Évaluation Technique', 20, currentY);
      currentY += 10;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Score global: ${technicalAssessment.overall_score || 0}%`, 20, currentY);
      currentY += 10;
      
      // Compétences techniques (avec gestion de l'espace)
      if (technicalAssessment.skill_breakdown && technicalAssessment.skill_breakdown.length > 0) {
        pdf.text('Compétences évaluées:', 20, currentY);
        currentY += 8;
        
        technicalAssessment.skill_breakdown.forEach((skill: any) => {
          const skillText = `${skill.skill}: ${skill.score}% - ${skill.mastery_level}`;
          
          // Vérifier si le texte dépasse la ligne
          const textWidth = pdf.getTextWidth(skillText);
          if (textWidth > 170) {
            // Diviser le texte en plusieurs lignes
            const words = skillText.split(' ');
            let lineText = '';
            let yPos = currentY;
            
            for (const word of words) {
              const testLine = lineText + (lineText ? ' ' : '') + word;
              if (pdf.getTextWidth(testLine) > 170) {
                pdf.text(testLine, 25, yPos);
                lineText = '';
                yPos += 6;
              } else {
                lineText = testLine;
              }
            }
            if (lineText) {
              pdf.text(lineText, 25, yPos);
            }
            currentY = yPos + 10;
          } else {
            pdf.text(skillText, 25, currentY);
            currentY += 8;
          }
        });
        currentY += 8;
      }
      
      // Vérifier si on doit ajouter une nouvelle page
      if (currentY > 250) {
        pdf.addPage();
        currentY = 20;
      }
      
      // Recommandation d'embauche
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Recommandation d\'Embauche', 20, currentY);
      currentY += 10;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Recommandation: ${hiringRecommendation.recommendation || 'N/A'}`, 20, currentY);
      currentY += 7;
      
      // Gérer les longs textes pour la raison - approche améliorée
      const reasonText = hiringRecommendation.reason || 'N/A';
      const maxLineWidth = 170; // Largeur maximale en mm
      const lineHeight = 6; // Hauteur de ligne en mm
      
      // Fonction pour diviser le texte en lignes
      const splitTextIntoLines = (text: string, maxWidth: number): string[] => {
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';
        
        for (const word of words) {
          const testLine = currentLine + (currentLine ? ' ' : '') + word;
          const lineWidth = pdf.getTextWidth(testLine);
          
          if (lineWidth > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        
        if (currentLine) {
          lines.push(currentLine);
        }
        
        return lines;
      };
      
      // Diviser le texte en lignes
      const reasonLines = splitTextIntoLines(reasonText, maxLineWidth);
      
      // Afficher chaque ligne avec gestion des pages
      for (const line of reasonLines) {
        // Vérifier si on doit ajouter une nouvelle page avant cette ligne
        if (currentY > 250) {
          pdf.addPage();
          currentY = 20;
        }
        
        pdf.text(line, 20, currentY);
        currentY += lineHeight;
      }
      
      currentY += 5; // Espacement après le texte
      
      pdf.text(`Score composite: ${hiringRecommendation.composite_score || 0}%`, 20, currentY);
      currentY += 10;
      
      // Vérifier si on doit ajouter une nouvelle page
      if (currentY > 250) {
        pdf.addPage();
        currentY = 20;
      }
      
      // Points forts
      if (hiringRecommendation.strengths && hiringRecommendation.strengths.length > 0) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Points Forts:', 20, currentY);
        currentY += 8;
        
        pdf.setFont('helvetica', 'normal');
        hiringRecommendation.strengths.forEach((strength: string) => {
          pdf.text(`• ${strength}`, 25, currentY);
          currentY += 6;
        });
        currentY += 5;
      }
      
      // Vérifier si on doit ajouter une nouvelle page
      if (currentY > 250) {
        pdf.addPage();
        currentY = 20;
      }
      
      // Points à améliorer
      if (hiringRecommendation.weaknesses && hiringRecommendation.weaknesses.length > 0) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Points à Améliorer:', 20, currentY);
        currentY += 8;
        
        pdf.setFont('helvetica', 'normal');
        hiringRecommendation.weaknesses.forEach((weakness: string) => {
          pdf.text(`• ${weakness}`, 25, currentY);
          currentY += 6;
        });
        currentY += 5;
      }
      
      // Pied de page
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      pdf.text('Ce rapport a été généré automatiquement par le système d\'évaluation SmartAssess.', 105, currentY, { align: 'center' });
      
      // Télécharger le PDF
      const candidateName = candidateInfo.name || `${report.candidateFirstName || 'Unknown'} ${report.candidateLastName || 'Candidate'}`;
      const fileName = candidateName.replace(/\s+/g, '-').toLowerCase();
      pdf.save(`rapport-evaluation-${fileName}-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: "Succès",
        description: "PDF téléchargé avec succès",
      });
    } catch (error) {
      console.error('Error downloading report:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le PDF",
        variant: "destructive"
      });
    }
  };

  
  const deleteReport = async () => {
    if (!report) return;
    
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce rapport ?')) {
      try {
        await apiClient.delete(`/evaluation-reports/${report.id}`);
        toast({
          title: "Succès",
          description: "Rapport supprimé avec succès",
        });
        navigate('/manager/reports');
      } catch (error) {
        console.error('Error deleting report:', error);
        toast({
          title: "Erreur",
          description: "Impossible de supprimer le rapport",
          variant: "destructive"
        });
      }
    }
  };

  const getRecommendationColor = (recommendation?: string) => {
    if (!recommendation) return 'text-gray-400';
    if (recommendation === 'Hire') return 'text-emerald-600';
    if (recommendation === 'Consider') return 'text-amber-600';
    return 'text-red-600';
  };

  const getRecommendationBg = (recommendation?: string) => {
    if (!recommendation) return 'bg-gray-100';
    if (recommendation === 'Hire') return 'bg-emerald-50 border-emerald-200';
    if (recommendation === 'Consider') return 'bg-amber-50 border-amber-200';
    return 'bg-red-50 border-red-200';
  };

  const getRecommendationBadgeVariant = (recommendation?: string) => {
    if (!recommendation) return 'outline';
    if (recommendation === 'Hire') return 'default';
    if (recommendation === 'Consider') return 'secondary';
    return 'destructive';
  };

  const getRecommendationText = (recommendation: string) => {
    switch (recommendation?.toLowerCase()) {
      case 'strongly recommend':
        return 'Fortement recommandé';
      case 'recommend':
        return 'Recommandé';
      case 'consider':
        return 'À considérer';
      case 'do not hire':
        return 'Ne pas embaucher';
      default:
        return recommendation || 'Non évalué';
    }
  };

  const formatPercentage = (value: number | string | null | undefined, decimals: number = 1) => {
    if (value === null || value === undefined || value === 'N/A') return 'N/A';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return 'N/A';
    return `${num.toFixed(decimals)}%`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-emerald-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-red-500';
  };

  const getFitAnalysisColor = (fitAnalysis?: string) => {
    if (!fitAnalysis) return 'text-slate-500';
    if (fitAnalysis.toLowerCase().includes('good')) return 'text-emerald-600';
    if (fitAnalysis.toLowerCase().includes('moyen')) return 'text-amber-600';
    if (fitAnalysis.toLowerCase().includes('pas compatible')) return 'text-red-500';
    return 'text-slate-600';
  };

  const getLevelVariant = (level: string) => {
    if (level === 'Fort' || level === 'Élevé') return 'default';
    if (level === 'Moyen') return 'secondary';
    return 'outline';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 75) return 'bg-emerald-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-red-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-500 text-sm">Chargement du rapport...</p>
        </div>
      </div>
    );
  }

  if (!report || !reportData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Rapport non trouvé</h3>
          <p className="text-slate-500 mb-4 text-sm">Le rapport demandé n'existe pas ou a été supprimé.</p>
          <Button asChild>
            <Link to="/manager/reports">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux rapports
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  console.log("=== DEBUG FRONTEND DONNÉES RAPPORT ===");
  console.log("Report object:", report);
  console.log("ReportData (fullReport):", reportData);
  console.log("Candidate summary:", reportData?.candidate_summary);
  console.log("Technical assessment:", reportData?.technical_assessment);
  console.log("Position analysis:", reportData?.position_analysis);
  
  const candidateInfo = {
    firstName: report.candidateFirstName || reportData.candidate_summary?.first_name || reportData.candidate_summary?.name?.split(' ')[0] || 'Non spécifié',
    lastName: report.candidateLastName || reportData.candidate_summary?.last_name || reportData.candidate_summary?.name?.split(' ').slice(1).join(' ') || 'Non spécifié',
    email: report.candidateEmail || reportData.candidate_summary?.email || '',
    positionTitle: report.positionTitle || reportData.candidate_summary?.position_applied || reportData.position_analysis?.position_title || 'Non spécifié',
    positionCompany: report.positionCompany || reportData.position_analysis?.company || reportData.position_analysis?.applied_positions?.[0]?.company || 'Non spécifiée',
    primaryDomain: reportData.candidate_summary?.primary_domain || 'Non spécifié',
    experienceLevel: reportData.candidate_summary?.experience_level || 'Non spécifié'
  };
  
  console.log("CandidateInfo calculé:", candidateInfo);
  console.log("=== FIN DEBUG FRONTEND ===");

  const technicalScore = reportData.technical_assessment?.overall_score ?? 0;
  const positionMatch = reportData.position_analysis?.percentage ?? reportData.position_analysis?.match ?? reportData.position_analysis?.applied_position_match ?? 0;

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ─── HEADER ─────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild className="text-slate-600 hover:text-slate-900">
              <Link to="/manager/tests-resultats">
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Retour
              </Link>
            </Button>
            <div className="h-5 w-px bg-slate-200" />
            <div>
              <h1 className="text-base font-semibold text-slate-900 leading-tight">
                Rapport d'Évaluation IA
              </h1>
              <p className="text-xs text-slate-500">
                {candidateInfo.firstName} {candidateInfo.lastName} · {candidateInfo.positionTitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={downloadReport} className="text-slate-600 text-xs">
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Télécharger
            </Button>
            <Button variant="outline" size="sm" onClick={deleteReport} className="text-red-500 border-red-200 hover:bg-red-50 text-xs">
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Supprimer
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 py-6 space-y-6">

        {/* ─── SCORES SECTION: Simple & Clean */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          {/* Header - Simple et direct */}
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Évaluation Complète</h3>
            <div className="text-3xl font-bold text-blue-600">
              {formatPercentage(
                reportData.hiring_recommendation?.composite_score_breakdown?.final_composite_score || 
                reportData.hiring_recommendation?.composite_score || 'N/A'
              )}
            </div>
            <div className="text-sm text-slate-500">Score Global</div>
          </div>

          {/* 3 colonnes équilibrées */}
          <div className="grid grid-cols-3 gap-6">
            
            {/* Score Technique */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Brain className="w-8 h-8 text-blue-500" />
              </div>
              <div className={`text-2xl font-bold mb-1 ${getScoreColor(technicalScore)}`}>
                {formatPercentage(technicalScore)}
              </div>
              <div className="text-sm font-medium text-slate-700">Score Technique</div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                <div
                  className={`h-1.5 rounded-full ${getScoreBarColor(technicalScore)}`}
                  style={{ width: `${Math.min(technicalScore, 100)}%` }}
                />
              </div>
            </div>

            {/* Recommandation */}
            <div className={`text-center ${getRecommendationBg(reportData.hiring_recommendation?.recommendation)} rounded-lg p-3`}>
              <div className="flex items-center justify-center mb-2">
                <Award className="w-8 h-8 text-slate-600" />
              </div>
              <Badge
                variant={getRecommendationBadgeVariant(reportData.hiring_recommendation?.recommendation)}
                className="text-sm px-3 py-1 mb-2"
              >
                {getRecommendationText(reportData.hiring_recommendation?.recommendation)}
              </Badge>
              <div className="text-sm font-medium text-slate-700">Recommandation</div>
              {reportData.hiring_recommendation?.composite_score && (
                <div className="text-xs text-slate-600 mt-1">
                  Score: {formatPercentage(reportData.hiring_recommendation.composite_score)}
                </div>
              )}
            </div>

            {/* Détail du Score */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <BarChart3 className="w-8 h-8 text-purple-500" />
              </div>
              <div className="text-sm font-medium text-slate-700 mb-2">Détail du Score</div>
              
              {reportData.hiring_recommendation?.composite_score_breakdown && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-blue-600">Test Tech</span>
                    <span className="font-semibold text-blue-700">
                      {formatPercentage(reportData.hiring_recommendation.composite_score_breakdown.technical_test_score)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-purple-600">Fit Poste</span>
                    <span className="font-semibold text-purple-700">
                      {formatPercentage(reportData.hiring_recommendation.composite_score_breakdown.position_fit_score)}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-2">
                    {reportData.hiring_recommendation?.composite_score_breakdown?.calculation_formula || 
                     '60% Test + 40% Fit'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── ROW 2: HIRING RECOMMENDATION (full width) ───────── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-5 flex items-center gap-2">
            <Award className="w-4 h-4 text-blue-600" />
            Recommandation d'Embauche
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: reason + reasoning */}
            <div className="lg:col-span-2 space-y-4">
              <div>
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Décision</div>
                <Badge
                  variant={getRecommendationBadgeVariant(reportData.hiring_recommendation?.recommendation)}
                  className="text-xs px-2 py-1"
                >
                  {getRecommendationText(reportData.hiring_recommendation?.recommendation)}
                </Badge>
              </div>
              {reportData.hiring_recommendation?.reason && (
                <div>
                  <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Raison Principale</div>
                  <p className="text-sm text-slate-700 leading-relaxed">{reportData.hiring_recommendation.reason}</p>
                </div>
              )}
              {reportData.hiring_recommendation?.recommendation_reasoning && (
                <div>
                  <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Analyse Détaillée</div>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{reportData.hiring_recommendation.recommendation_reasoning}</p>
                </div>
              )}
              {reportData.hiring_recommendation?.key_factors && Array.isArray(reportData.hiring_recommendation.key_factors) && reportData.hiring_recommendation.key_factors.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Facteurs Clés</div>
                  <div className="flex flex-wrap gap-2">
                    {reportData.hiring_recommendation.key_factors.map((factor, i) => (
                      <Badge key={i} variant="secondary" className="text-xs px-3 py-1">{factor}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: composite score + strengths / weaknesses / risks / steps */}
            <div className="space-y-4">
            
              
              {reportData.hiring_recommendation?.strengths && reportData.hiring_recommendation.strengths.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Points Forts</div>
                  <ul className="space-y-1.5">
                    {reportData.hiring_recommendation.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-slate-700">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {reportData.hiring_recommendation?.weaknesses && reportData.hiring_recommendation.weaknesses.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Points Faibles</div>
                  <ul className="space-y-1.5">
                    {reportData.hiring_recommendation.weaknesses.map((w, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <XCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-slate-700">{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {reportData.hiring_recommendation?.potential_risks && reportData.hiring_recommendation.potential_risks.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Risques Potentiels</div>
                  <ul className="space-y-1.5">
                    {reportData.hiring_recommendation.potential_risks.map((r, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-slate-700">{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {reportData.hiring_recommendation?.next_steps && reportData.hiring_recommendation.next_steps.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Prochaines Étapes</div>
                  <ul className="space-y-1.5">
                    {reportData.hiring_recommendation.next_steps.map((s, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <div className="w-3.5 h-3.5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-[8px] font-bold text-blue-600">{i + 1}</span>
                        </div>
                        <span className="text-xs text-slate-700">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── ROW 3: TECHNICAL ASSESSMENT + TEAM FIT ──────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Technical Assessment */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Brain className="w-4 h-4 text-blue-600" />
              Évaluation Technique
            </h2>

            {/* Skill Breakdown */}
            {reportData.technical_assessment?.skill_breakdown && reportData.technical_assessment.skill_breakdown.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Détail des Compétences</div>
                <div className="space-y-3">
                  {reportData.technical_assessment.skill_breakdown.map((skill, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <span className="text-xs font-medium text-slate-700">{skill.skill}</span>
                          <Badge
                            variant={skill.score >= 50 ? 'default' : 'secondary'}
                            className="ml-2 text-[10px] px-1.5 py-0"
                          >
                            {skill.mastery_level}
                          </Badge>
                        </div>
                        <span className={`text-sm font-bold ${getScoreColor(skill.score)}`}>{skill.score}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${getScoreBarColor(skill.score)}`}
                          style={{ width: `${Math.min(skill.score, 100)}%` }}
                        />
                      </div>
                      {skill.assessment && (
                        <div className="text-[10px] text-slate-400 mt-0.5">{skill.assessment}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Technical Skills fallback */}
            {reportData.technical_assessment?.technical_skills && (
              <div className="mb-4">
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Compétences Techniques</div>
                <div className="space-y-2">
                  {Object.entries(reportData.technical_assessment.technical_skills).map(([skill, data]) => (
                    <div key={skill}>
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <span className="text-xs font-medium text-slate-700">{skill}</span>
                          {data.level && (
                            <span className="ml-2 text-[10px] text-slate-400">Niveau: {data.level}</span>
                          )}
                        </div>
                        <span className={`text-sm font-bold ${getScoreColor(data.score || 0)}`}>{data.score || 0}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${getScoreBarColor(data.score || 0)}`}
                          style={{ width: `${Math.min(data.score || 0, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Team Fit Analysis */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Analyse d'Intégration Équipe
            </h2>

            {/* Qualitative levels */}
            <div className="flex flex-wrap gap-3 mb-5">
              {reportData.team_fit_analysis?.collaboration_level && (
                <div className="text-center">
                  <div className="text-[10px] text-slate-400 mb-1">Collaboration</div>
                  <Badge variant={getLevelVariant(reportData.team_fit_analysis.collaboration_level)} className="text-[10px]">
                    {reportData.team_fit_analysis.collaboration_level}
                  </Badge>
                </div>
              )}
              {reportData.team_fit_analysis?.adaptability_level && (
                <div className="text-center">
                  <div className="text-[10px] text-slate-400 mb-1">Adaptabilité</div>
                  <Badge variant={getLevelVariant(reportData.team_fit_analysis.adaptability_level)} className="text-[10px]">
                    {reportData.team_fit_analysis.adaptability_level}
                  </Badge>
                </div>
              )}
              {reportData.team_fit_analysis?.communication_level && (
                <div className="text-center">
                  <div className="text-[10px] text-slate-400 mb-1">Communication</div>
                  <Badge variant={getLevelVariant(reportData.team_fit_analysis.communication_level)} className="text-[10px]">
                    {reportData.team_fit_analysis.communication_level}
                  </Badge>
                </div>
              )}
            </div>

            {/* Badges row */}
            <div className="flex flex-wrap gap-3 mb-5">
              {reportData.team_fit_analysis?.leadership_potential && (
                <div className="text-center">
                  <div className="text-[10px] text-slate-400 mb-1">Leadership</div>
                  <Badge variant={getLevelVariant(reportData.team_fit_analysis.leadership_potential)} className="text-[10px]">
                    {reportData.team_fit_analysis.leadership_potential}
                  </Badge>
                </div>
              )}
              {reportData.team_fit_analysis?.motivation_level && (
                <div className="text-center">
                  <div className="text-[10px] text-slate-400 mb-1">Motivation</div>
                  <Badge variant={getLevelVariant(reportData.team_fit_analysis.motivation_level)} className="text-[10px]">
                    {reportData.team_fit_analysis.motivation_level}
                  </Badge>
                </div>
              )}
            </div>

            {/* Text details */}
            <div className="grid grid-cols-2 gap-3">
              {reportData.team_fit_analysis?.problem_solving_approach && (
                <div>
                  <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Résolution de Problèmes</div>
                  <p className="text-xs text-slate-700">{reportData.team_fit_analysis.problem_solving_approach}</p>
                </div>
              )}
              {reportData.team_fit_analysis?.readiness_for_team_environment && (
                <div>
                  <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Prêt pour l'Équipe</div>
                  <p className="text-xs text-slate-700">{reportData.team_fit_analysis.readiness_for_team_environment}</p>
                </div>
              )}
              {reportData.team_fit_analysis?.team_fit && (
                <div>
                  <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Adéquation Équipe</div>
                  <p className="text-xs text-slate-700">{reportData.team_fit_analysis.team_fit}</p>
                </div>
              )}
              {reportData.team_fit_analysis?.work_style && (
                <div>
                  <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Style de Travail</div>
                  <p className="text-xs text-slate-700">{reportData.team_fit_analysis.work_style}</p>
                </div>
              )}
              {reportData.team_fit_analysis?.teamwork_preference && (
                <div>
                  <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Préférence d'Équipe</div>
                  <p className="text-xs text-slate-700">{reportData.team_fit_analysis.teamwork_preference}</p>
                </div>
              )}
            </div>

            {reportData.team_fit_analysis?.improvement_areas && reportData.team_fit_analysis.improvement_areas.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-2">Axes d'Amélioration</div>
                <ul className="space-y-1">
                  {reportData.team_fit_analysis.improvement_areas.map((area, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <AlertCircle className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-slate-600">{area}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* ─── ROW 4: POSITION ANALYSIS (full width) ──────────── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-5 flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-600" />
            Analyse du Poste
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            

            {/* Applied positions */}
            {reportData.position_analysis?.applied_positions && reportData.position_analysis.applied_positions.length > 0 && (
              <div className="lg:col-span-3">
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Briefcase className="w-3 h-3" />
                  Postes Postulés
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reportData.position_analysis.applied_positions.map((position, i) => (
                    <div key={i} className="bg-gradient-to-br from-white to-slate-50 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-4">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-slate-900 mb-1">{position.title}</h3>
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Building className="w-3 h-3" />
                            {position.company}
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                          <Briefcase className="w-4 h-4 text-blue-600" />
                        </div>
                      </div>

                      {/* Description */}
                      {position.description && (
                        <div className="mb-3">
                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{position.description}</p>
                        </div>
                      )}

                      {/* Required Skills */}
                      {position.required_skills && position.required_skills.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1 text-xs font-medium text-slate-400 uppercase tracking-wider">
                            <Code className="w-3 h-3" />
                            Compétences requises
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {position.required_skills.map((skill, si) => (
                              <span key={si} className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-md font-medium">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Match Score si disponible */}
                      {position.match && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500">Match</span>
                            <div className="flex items-center gap-2">
                             
                              <span className={`text-xs font-semibold ${getScoreColor(position.match)}`}>
                                match score: {position.match}%
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>


          {/* Recommended positions from position_analysis */}
          {reportData.position_analysis?.recommended_positions && reportData.position_analysis.recommended_positions.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Star className="w-3 h-3" />
                Recommendations
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reportData.position_analysis.recommended_positions.map((pos, i) => (
                  <div key={i} className="bg-gradient-to-br from-white to-slate-50 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-4">
                    {/* Fit Analysis - moved to top */}
                    {pos.fit_analysis && (
                      <div className="flex items-center gap-2 mb-3">
                        
                        <span className={`text-xs font-semibold ${getFitAnalysisColor(pos.fit_analysis)}`}>
                          {pos.fit_analysis}
                        </span>
                      </div>
                    )}

                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-slate-900 mb-1">{pos.position}</h3>
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                        <Star className="w-4 h-4 text-amber-600" />
                      </div>
                    </div>

                    {/* Reasoning */}
                    {pos.reasoning && (
                      <div className="mb-3">
                        <div className="flex items-center gap-1 text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                          <AlertCircle className="w-3 h-3" />
                          Analyse
                        </div>
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                          <p className="text-xs text-blue-800 leading-relaxed">{pos.reasoning}</p>
                        </div>
                      </div>
                    )}

                    {/* Strengths */}
                    {pos.strengths && pos.strengths.length > 0 && (
                      <div className="mb-3">
                        <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 uppercase tracking-wider mb-2">
                          <CheckCircle className="w-3 h-3" />
                          Points forts
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {pos.strengths.map((s, si) => (
                            <span key={si} className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md font-medium">
                              <CheckCircle className="w-2.5 h-2.5" />
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Skill gaps */}
                    {pos.skill_gaps && pos.skill_gaps.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1 text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                          <AlertCircle className="w-3 h-3" />
                          Compétences à développer
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {pos.skill_gaps.map((g, gi) => (
                            <span key={gi} className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-md">
                              <XCircle className="w-2.5 h-2.5" />
                              {g}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ─── ROW 5: TOP-LEVEL RECOMMENDED POSITIONS ─────────── */}
        {reportData.recommended_positions && Array.isArray(reportData.recommended_positions) && reportData.recommended_positions.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-blue-600" />
              Postes Recommandés (Global)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {reportData.recommended_positions.map((pos, i) => (
                <div key={i} className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                  <div className="text-sm font-semibold text-slate-800">{pos.title}</div>
                  {pos.company && <div className="text-xs text-slate-500">{pos.company}</div>}
                  {pos.match && (
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-slate-500 font-medium">match score:</div>
                      <div className={`text-base font-bold ${getScoreColor(pos.match)}`}>{pos.match}%</div>
                      <div className="flex-1 bg-slate-200 rounded-full h-1">
                        <div className={`h-1 rounded-full ${getScoreBarColor(pos.match)}`} style={{ width: `${Math.min(pos.match, 100)}%` }} />
                      </div>
                    </div>
                  )}
                  {pos.reasoning && <p className="text-xs text-slate-600">{pos.reasoning}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AIReportDetailPage;