import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Mail, Lock, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const CandidateLoginPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulation de connexion - à remplacer par l'appel API réel
      console.log('Tentative de connexion candidat:', formData);
      
      // Simuler une connexion réussie
      setTimeout(() => {
        localStorage.setItem('userType', 'candidate');
        localStorage.setItem('isAuthenticated', 'true');
        toast.success('Connexion réussie !');
        navigate('/candidat/dashboard');
        setIsLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error('Erreur de connexion:', error);
      toast.error('Échec de la connexion. Vérifiez vos identifiants.');
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-primary rounded-xl flex items-center justify-center text-white text-2xl font-bold mb-4">
            SA
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Espace Candidat
          </h1>
          <p className="text-gray-600">
            Accédez à votre espace pour gérer vos candidatures
          </p>
        </div>

        {/* Formulaire de connexion */}
        <Card className="shadow-lg">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="votre.email@exemple.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Se souvenir de moi */}
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <Label htmlFor="rememberMe" className="ml-2 text-sm text-gray-600">
                  Se souvenir de moi
                </Label>
              </div>

              {/* Bouton de connexion */}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Connexion en cours...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Se connecter
                  </div>
                )}
              </Button>
            </form>

            {/* Liens utiles */}
            <div className="mt-6 space-y-4">
              <div className="text-center">
                <Link
                  to="/candidat/soumettre-candidature"
                  className="text-primary hover:text-primary/80 text-sm font-medium"
                >
                  Pas encore de compte ? Postulez maintenant
                </Link>
              </div>
              
              <div className="text-center">
                <Link
                  to="/"
                  className="text-gray-600 hover:text-gray-800 text-sm"
                >
                  Retour à l'accueil
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informations additionnelles */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Briefcase className="w-4 h-4" />
            <span>Plateforme de recrutement intelligente</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Besoin d'aide ? Contactez notre support
          </p>
        </div>
      </div>
    </div>
  );
};

export default CandidateLoginPage;
