import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Award, Briefcase, GraduationCap, Code, Users, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useApiHooks';

interface CVAnalysisData {
  technicalProfile: any;
  cvAnalysis: any;
  cvFileName: string;
  cvAnalyzedAt: string;
  cvSize: number;
  cvType: string;
  skills: string[];
  experience: any[];
  education: any[];
  certifications: any[];
  projects: any[];
  softSkills: any;
  userId: number;
}

const CVAnalysisPage: React.FC = () => {
  const { user } = useAuth();
  const [analysisData, setAnalysisData] = useState<CVAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      const storedData = localStorage.getItem(`cvAnalysis_${user.id}`);
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          setAnalysisData(parsedData);
        } catch (error) {
          console.error('Error parsing stored analysis data:', error);
        }
      }
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">Chargement...</div>
        </div>
      </div>
    );
  }

  if (!analysisData) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link to="/candidat/candidatures" className="flex items-center text-blue-600 hover:text-blue-800">
              <ArrowLeft className="mr-2" size={20} />
              Retour aux candidatures
            </Link>
          </div>
          
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="mx-auto mb-4 text-gray-400" size={64} />
              <h2 className="text-2xl font-bold mb-2">Aucune analyse de CV disponible</h2>
              <p className="text-gray-600 mb-4">
                Vous n'avez pas encore soumis de CV pour analyse.
              </p>
              <Link to="/candidat/soumettre-candidature">
                <Button>Soumettre un CV</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link to="/candidat/candidatures" className="flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="mr-2" size={20} />
            Retour aux candidatures
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Analyse de CV</h1>
          <p className="text-gray-600">
            Résultats de l'analyse IA pour votre CV
          </p>
        </div>

        {/* Informations générales */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2" size={20} />
              Informations du CV
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Nom du fichier</p>
                <p className="text-lg">{analysisData.cvFileName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Date d'analyse</p>
                <p className="text-lg">{new Date(analysisData.cvAnalyzedAt).toLocaleDateString('fr-FR')}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Taille</p>
                <p className="text-lg">{(analysisData.cvSize / 1024).toFixed(1)} KB</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Type</p>
                <p className="text-lg">{analysisData.cvType}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compétences techniques */}
        {analysisData.technicalProfile?.["Technical Information"]?.["technologies"] && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Code className="mr-2" size={20} />
                Compétences techniques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(analysisData.technicalProfile["Technical Information"]["technologies"]).map(([category, skills]: [string, any]) => (
                  <div key={category}>
                    <h4 className="font-semibold mb-2">{category}</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(skills as any).map(([skill, level]: [string, string]) => (
                        <Badge key={skill} variant={level === 'advanced' ? 'default' : level === 'intermediate' ? 'secondary' : 'outline'}>
                          {skill} ({level})
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Projets */}
        {analysisData.projects && analysisData.projects.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Briefcase className="mr-2" size={20} />
                Projets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysisData.projects.map((project: any, index: number) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold">{project.name}</h4>
                    <p className="text-gray-600 mb-2">{project.role}</p>
                    <div className="flex flex-wrap gap-1">
                      {project.tech_stack?.map((tech: string, techIndex: number) => (
                        <Badge key={techIndex} variant="outline" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Certifications */}
        {analysisData.certifications && analysisData.certifications.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="mr-2" size={20} />
                Certifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysisData.certifications.map((cert: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <h4 className="font-medium">{cert.certification_name}</h4>
                      <p className="text-sm text-gray-600">{cert.issuing_organization}</p>
                    </div>
                    <Badge variant="outline">{cert.issue_date}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Soft Skills */}
        {analysisData.softSkills && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2" size={20} />
                Compétences interpersonnelles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(analysisData.softSkills).map(([category, skills]: [string, string[]]) => (
                  <div key={category}>
                    <h4 className="font-medium capitalize mb-2">{category.replace('_', ' ')}</h4>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CVAnalysisPage;
