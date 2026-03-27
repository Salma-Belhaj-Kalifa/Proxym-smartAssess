import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, ArrowLeft, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLogin, useRegister, useLogout } from '@/features/auth/authMutations';
import { useCurrentUserSafe } from '@/features/auth/authQueries';

export default function CandidateLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("CANDIDATE");
  const [activeTab, setActiveTab] = useState("login");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();
  const { data: user } = useCurrentUserSafe();
  const isLoading = loginMutation.isPending || registerMutation.isPending || logoutMutation.isPending;

  // Vérification si déjà connecté
  useEffect(() => {
    const checkAuth = async () => {
      if (user) {
        if (user.role === 'CANDIDATE') {
          navigate('/candidat/dashboard');
        } else {
          await logoutMutation.mutateAsync();
          alert("Accès non autorisé. Vous avez été déconnecté.");
          navigate('/');
        }
      }
    };
    
    checkAuth();
  }, [user, navigate, logoutMutation]);

  // LOGIN
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null); // Réinitialiser le message d'erreur

    try {
      const result = await loginMutation.mutateAsync({ email, password });
      
      console.log('Login result:', result); // Debug pour voir la structure de la réponse

      // Validation flexible pour différents formats de réponse
      let user = null;
      if (result && typeof result === 'object' && 'user' in result && result.user) {
        user = result.user;
      } else if (result && typeof result === 'object' && 'id' in result && 'email' in result) {
        // Si le résultat contient directement les données utilisateur
        user = result;
      } else if (result && typeof result === 'object' && 'token' in result) {
        // Si seulement le token est retourné, utiliser les données du formulaire
        user = {
          id: (result as any).id,
          email: email,
          firstName: (result as any).firstName || 'Utilisateur',
          lastName: (result as any).lastName || '',
          role: (result as any).role || 'CANDIDATE'
        };
      }

      if (!user || !user.role) {
        console.error('Login validation failed:', { result, user, hasUser: !!user, hasRole: !!user?.role });
        setErrorMessage("Utilisateur introuvable ou rôle incorrect.");
        return;
      }

      if (user.role === 'CANDIDATE') {
        navigate('/candidat/dashboard');
      } else {
        await logoutMutation.mutateAsync();
        setErrorMessage("Accès refusé : ce portail est réservé aux candidats.");
        navigate('/');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Gérer les erreurs selon le nouveau format du backend
      if (err?.response?.status === 401) {
        setErrorMessage("Email ou mot de passe incorrect. Veuillez vérifier vos identifiants.");
      } else if (err?.response?.status === 403) {
        setErrorMessage("Accès non autorisé pour ce rôle.");
      } else if (err?.response?.status === 404) {
        setErrorMessage("Utilisateur introuvable avec cet email.");
      } else if (err?.response?.data?.error) {
        setErrorMessage(err.response.data.error);
      } else {
        setErrorMessage("Erreur serveur. Veuillez réessayer plus tard.");
      }
    }
  };

  // SIGNUP
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null); // Réinitialiser le message d'erreur

    if (password !== confirmPassword) {
      setErrorMessage("Les mots de passe ne correspondent pas");
      return;
    }

    try {
      const userData = { email, password, firstName, lastName, phone, role };
      const result = await registerMutation.mutateAsync(userData);
      

      // Validation flexible pour différents formats de réponse
      let user = null;
      if (result && typeof result === 'object' && 'user' in result && result.user) {
        user = result.user;
      } else if (result && typeof result === 'object' && 'id' in result && 'email' in result) {
        // Si le résultat contient directement les données utilisateur
        user = result;
      } else if (result && typeof result === 'object' && 'token' in result) {
        // Si seulement le token est retourné, utiliser les données du formulaire
        user = {
          id: (result as any).id,
          email: email,
          firstName: firstName,
          lastName: lastName,
          role: role
        };
      }

      if (!user || !user.role) {
        console.error('Validation failed:', { result, user, hasUser: !!user, hasRole: !!user?.role });
        setErrorMessage("Erreur lors de l'inscription - réponse invalide du serveur");
        return;
      }

      if (user.role === 'CANDIDATE') {
        navigate('/candidat/dashboard');
      } else {
        await logoutMutation.mutateAsync();
        setErrorMessage("Accès refusé : ce portail est réservé aux candidats.");
        navigate('/');
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      
      // Gérer les erreurs selon le nouveau format du backend
      if (err?.response?.status === 400) {
        setErrorMessage(err?.response?.data?.error || "Données invalides ou email déjà utilisé.");
      } else if (err?.response?.status === 401) {
        setErrorMessage("Erreur d'authentification lors de l'inscription.");
      } else if (err?.response?.data?.error) {
        setErrorMessage(err.response.data.error);
      } else {
        setErrorMessage("Erreur serveur lors de l'inscription.");
      }
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Panel - Dark */}
      <div className="dark-section hidden lg:flex flex-col justify-center px-12 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <User className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">
              <span className="font-bold text-white">PROXYM</span>{" "}
              <span className="text-white/60">SmartAssess</span>
            </span>
          </div>
          <p className="text-sm text-primary font-medium mb-2">Portail Candidat</p>
          <h1 className="text-4xl font-bold text-white mb-2">Connexion</h1>
          <h2 className="text-4xl font-bold text-gradient italic mb-6">Votre espace carrière</h2>
          <p className="text-white/60 max-w-md mb-8">
            Postulez aux offres de stage, déposez votre CV et passez des tests techniques personnalisés par l'IA.
          </p>
        </div>
      </div>

      {/* Right Panel - Light */}
      <div className="flex flex-col items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Connexion</TabsTrigger>
                <TabsTrigger value="signup">Inscription</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-6">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-foreground mb-4">Connexion Candidat</h3>
                  <p className="text-muted-foreground text-sm mb-6">Accédez à votre espace carrière</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        className="pl-10"
                        type="email"
                        placeholder="votre.email@exemple.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Mot de passe</Label>
                      <button className="text-xs text-primary hover:underline">Mot de passe oublié ?</button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        className="pl-10"
                        type="password"
                        placeholder="•••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button className="w-full" type="submit" disabled={isLoading}>
                    {isLoading ? "Connexion..." : "Accéder à mon espace"}
                  </Button>

                  {errorMessage && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-red-600 text-sm">{errorMessage}</p>
                    </div>
                  )}
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-6">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-foreground mb-4">Inscription Candidat</h3>
                  <p className="text-muted-foreground text-sm mb-6">Créez votre compte candidat</p>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Prénom</Label>
                      <Input
                        placeholder="Jean"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nom</Label>
                      <Input
                        placeholder="Dupont"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        className="pl-10"
                        type="email"
                        placeholder="votre.email@exemple.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Téléphone</Label>
                    <Input
                      placeholder="+216 XX XXX XXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Mot de passe</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        className="pl-10"
                        type="password"
                        placeholder="•••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Confirmer le mot de passe</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        className="pl-10"
                        type="password"
                        placeholder="•••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button className="w-full" type="submit" disabled={isLoading}>
                    {isLoading ? "Inscription..." : "Créer mon compte"}
                  </Button>
                </form>

                {errorMessage && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-600 text-sm">{errorMessage}</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center">
              <Link
                to="/"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour au choix du portail
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
