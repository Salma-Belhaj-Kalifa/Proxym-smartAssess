import { Link } from "react-router-dom";
import { User, Briefcase, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

const HomePage = () => {
  return (
    <div className="dark-section min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center mb-12 animate-fade-in">
        <div className="flex items-center justify-center gap-2 mb-8">
          <img 
            src="/logo.png" 
            alt="PROXYM SmartAssess" 
            className="w-8 h-8 rounded-lg"
          />
          <span className="text-lg font-semibold">
            <span className="font-bold text-white">PROXYM</span>{" "}
            <span className="text-white/60">SmartAssess</span>
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
          Bienvenue sur votre espace
        </h1>
        <h2 className="text-4xl md:text-5xl font-bold text-gradient italic mb-6">
          d'évaluation intelligente
        </h2>
        <p className="text-white/60 text-lg max-w-xl mx-auto">
          Choisissez votre portail. Chaque accès est sécurisé et adapté à votre rôle.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 w-full max-w-3xl animate-fade-in" style={{ animationDelay: "0.2s" }}>
        {/* Candidate Portal */}
        <div className="glass-card-dark p-6 hover:border-primary/50 transition-all duration-300 group">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/30 transition-colors">
            <User className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Espace Candidat</h3>
          <p className="text-white/60 text-sm mb-4">
            Choisissez vos postes de stage, déposez votre CV et passez un test technique personnalisé.
          </p>
          <ul className="space-y-2 mb-6 text-sm text-white/60">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Choix de jusqu'à 3 postes
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Dépôt CV (PDF / DOCX)
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Test technique adaptatif IA
            </li>
          </ul>
          <Button asChild className="w-full">
            <Link to="/candidat/connexion">Accéder au portail Candidat</Link>
          </Button>
        </div>

        {/* Recruiter Portal */}
        <div className="glass-card-dark p-6 hover:border-primary/50 transition-all duration-300 group">
          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 group-hover:bg-white/10 transition-colors">
            <Briefcase className="w-6 h-6 text-white/70" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Espace Recruteur</h3>
          <p className="text-white/60 text-sm mb-4">
            Publiez vos postes, gérez les candidatures et consultez les rapports analytiques IA.
          </p>
          <ul className="space-y-2 mb-6 text-sm text-white/60">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
              Création et gestion des postes
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
              Validation des profils
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
              Rapports et ranking IA
            </li>
          </ul>
          <Button asChild variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
            <Link to="/recruteur/connexion">Accéder au portail Recruteur</Link>
          </Button>
        </div>
      </div>

      <footer className="mt-12 text-sm text-white/40 flex items-center gap-2">
        <Lock className="w-3 h-3" />
        © 2026 Proxym Group · Plateforme sécurisée · HTTPS · JWT
      </footer>
    </div>
  );
};

export default HomePage;
