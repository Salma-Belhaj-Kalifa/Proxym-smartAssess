import { Outlet, Link, useLocation, Navigate } from "react-router-dom";
import { LayoutDashboard, Briefcase, Users, FileText, Settings, LogOut, ChevronLeft, Menu, User, Upload, Search } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useCurrentUserSafe } from '@/features/auth/authQueries';
import { useLogout } from '@/features/auth/authMutations';

const navItems = [
  { label: "Tableau de bord", icon: LayoutDashboard, path: "/candidat/dashboard" },
  { label: "Offres de stage", icon: Briefcase, path: "/candidat/postes" },
  { label: "Mes candidatures", icon: FileText, path: "/candidat/candidatures" },
  { label: "Mon profil", icon: User, path: "/candidat/profil" },

];

const CandidateLayout = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { data: user, isLoading } = useCurrentUserSafe();
  const logoutMutation = useLogout();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Protéger les routes candidat - vérifier si l'utilisateur est authentifié et a le bon rôle
  if (isLoading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/candidat/connexion" replace />;
  }

  if (user.role !== 'CANDIDATE') {
    return <Navigate to="/unauthorized" replace />;
  }

  const handleLogout = async () => {
  setIsLoggingOut(true);

  try {
    await logoutMutation.mutateAsync();
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    setIsLoggingOut(false);
  }
};

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar - FIXED POSITION */}
      <aside className={cn(
        "flex flex-col border-r transition-all duration-300 fixed left-0 top-0 h-screen z-40",
        "bg-sidebar text-sidebar-foreground border-sidebar-border",
        collapsed ? "w-16" : "w-64"
      )}>
        <div className="flex items-center gap-2 p-4 border-b border-sidebar-border">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <img src="/logo.png" alt="PROXYM SmartAssess" className="w-5 h-5" />
          </div>
          {!collapsed && (
            <span className="text-sm font-semibold truncate">
              <span className="font-bold text-white">PROXYM</span>{" "}
              <span className="text-white/60">SmartAssess</span>
            </span>
          )}
        </div>

        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-primary/20 text-sidebar-primary font-medium"
                    : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-2 border-t border-sidebar-border space-y-1">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent w-full transition-colors"
          >
            {collapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            {!collapsed && <span>Réduire</span>}
          </button>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/60 hover:text-red-400 hover:bg-red-500/10 w-full transition-colors disabled:opacity-50"
          >
            {isLoggingOut ? (
              <>
                <div className="w-5 h-5 shrink-0 animate-spin rounded-full border-2 border-red-400 border-t-transparent"></div>
                {!collapsed && <span>Déconnexion...</span>}
              </>
            ) : (
              <>
                <LogOut className="w-5 h-5 shrink-0" />
                {!collapsed && <span>Déconnexion</span>}
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main content - WITH MARGIN TO AVOID SIDEBAR OVERLAP */}
      <main className={cn(
        "flex-1 overflow-auto bg-background transition-all duration-300",
        collapsed ? "ml-16" : "ml-64"
      )}>
        <Outlet />
      </main>
    </div>
  );
};

export default CandidateLayout;
