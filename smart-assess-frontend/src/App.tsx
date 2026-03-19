import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import HomePage from "./pages/common/HomePage";
import RecruiterLoginPage from "./pages/manager/RecruiterLoginPage";
import CandidateLoginPage from "./pages/candidate/CandidateLoginPage";
import CandidatePositionsPage from "./pages/candidate/CandidatePositionsPage";
import SubmissionPageSimple from './pages/candidate/SubmissionPageSimple';
import TestInterfacePage from "./pages/common/TestInterfacePage";
import CandidateTestPage from "./pages/candidate/CandidateTestPage";
import TestSubmittedPage from "./pages/candidate/TestSubmittedPage";
import CandidateLayout from "./components/CandidateLayout";
import CandidateDashboardPage from "./pages/candidate/CandidateDashboardPage";
import CandidateProfilePage from "./pages/candidate/CandidateProfilePage";
import CandidateApplicationsPage from "./pages/candidate/ApplicationsPage";
import ManagerLayout from "./components/ManagerLayout";
import DashboardPage from "./pages/manager/DashboardPage";
import ManagerPositionsPage from "./pages/manager/ManagerPositionsPage";
import ManagerProfilePage from "./pages/manager/ManagerProfilePage";
import ApplicationsPage from "./pages/manager/ApplicationsPage";
import EvaluationReportPage from "./pages/manager/EvaluationReportPage";
import AIResultsListPage from "./pages/manager/AIResultsListPage";
import GenerateTestPage from "./pages/manager/GenerateTestPage";
import TestReviewPage from "./pages/manager/TestReviewPage";
import TestResultsPage from "./pages/manager/TestResultsPage";
import TestResultsListPage from './pages/manager/TestResultsListPage';
import QuestionValidationPage from "./pages/manager/QuestionValidationPage";
import PositionApplicationsPage from "./pages/manager/PositionApplicationsPage";
import PositionDetailPage from "./pages/manager/PositionDetailPage";
import NotFound from "./pages/common/NotFound";

const queryClient = new QueryClient();

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
          <Route path="/test/:id" element={<TestInterfacePage />} />
          <Route path="/candidate/test/:token" element={<CandidateTestPage />} />
          <Route path="/candidate/test-submitted" element={<TestSubmittedPage />} />
          
          {/* Manager Routes */}
          <Route path="/manager" element={<ManagerLayout />}>
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
            <Route path="tests/:id/questions" element={<QuestionValidationPage />} />
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
