import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "./lib/queryClient";
import HomePage from "./pages/common/HomePage";
import RecruiterLoginPage from "./pages/manager/auth/RecruiterLoginPage";
import CandidateLoginPage from "./pages/candidate/auth/CandidateLoginPage";
import CandidatePositionsPage from "./pages/candidate/positions/CandidatePositionsPage";
import SubmissionPageSimple from './pages/candidate/candidature/SubmissionPageSimple';
import CandidateTestPage from "./pages/candidate/tests/CandidateTestPage";
import TestSubmittedPage from "./pages/candidate/tests/TestSubmittedPage";
import CandidateLayout from "./components/Layout/CandidateLayout";
import CandidateDashboardPage from "./pages/candidate/dashboard/CandidateDashboardPage";
import CandidateProfilePage from "./pages/candidate/profile/CandidateProfilePage";
import CandidateApplicationsPage from "./pages/candidate/applications/ApplicationsPage";
import ManagerLayout from "./components/Layout/ManagerLayout";
import DashboardPage from "./pages/manager/dashboard/DashboardPage";
import ManagerPositionsPage from "./pages/manager/positions/ManagerPositionsPage";
import ManagerProfilePage from "./pages/manager/profile/ManagerProfilePage";
import ApplicationsPage from "./pages/manager/applications/ApplicationsPage";
import EvaluationReportPage from "./pages/manager/reports/EvaluationReportPage";
import AIResultsListPage from "./pages/manager/reports/AIResultsListPage";
import GenerateTestPage from "./pages/manager/tests/GenerateTestPage";
import TestReviewPage from "./pages/manager/tests/TestReviewPage";
import TestResultsPage from "./pages/manager/tests/TestResultsPage";
import TestResultsListPage from './pages/manager/tests/TestResultsListPage';
import PositionApplicationsPage from "./pages/manager/positions/PositionApplicationsPage";
import PositionDetailPage from "./pages/manager/positions/PositionDetailPage";
import NotFound from "./pages/common/NotFound";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/recruteur/connexion" element={<RecruiterLoginPage />} />
          
          {/* Candidate Routes */}
          <Route path="/candidat/connexion" element={<CandidateLoginPage />} />
          <Route path="/candidat" element={<CandidateLayout />}>
            <Route path="dashboard" element={<CandidateDashboardPage />} />
            <Route path="postes" element={<CandidatePositionsPage />} />
            <Route path="soumettre-candidature" element={<SubmissionPageSimple />} />
            <Route path="profil" element={<CandidateProfilePage />} />
            <Route path="candidatures" element={<CandidateApplicationsPage />} />
            <Route path="settings" element={<div className="p-8 text-foreground">Paramètres candidat</div>} />
          </Route>
          
          {/* Test Routes */}
          <Route path="/candidate/test/:token" element={<CandidateTestPage />} />
          <Route path="/candidate/test-submitted" element={<TestSubmittedPage />} />
          
          {/* Manager Routes */}
          <Route path="/manager" element={<ManagerLayout />}>
            <Route index element={<DashboardPage />} /> {/* Route par défaut */}
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="postes" element={<ManagerPositionsPage />} />
            <Route path="postes/:id" element={<PositionDetailPage />} />
            <Route path="postes/:id/candidatures" element={<PositionApplicationsPage />} />
            <Route path="candidats" element={<ApplicationsPage />} />
            <Route path="resultats" element={<AIResultsListPage />} />
            <Route path="resultats/:id" element={<EvaluationReportPage />} />
            <Route path="tests-resultats" element={<TestResultsListPage />} />
            <Route path="candidats/:id/generer-test" element={<GenerateTestPage />} />
            <Route path="candidats/:id" element={<GenerateTestPage />} />
            <Route path="test-review/:testId" element={<TestReviewPage />} />
            <Route path="test-results/:testId" element={<TestResultsPage />} />
            <Route path="profil" element={<ManagerProfilePage />} />
            <Route path="settings" element={<div className="p-8 text-foreground">Paramètres</div>} />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
