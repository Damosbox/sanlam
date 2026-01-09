import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Commercial from "./pages/Commercial";
import B2C from "./pages/B2C";
import ClaimNew from "./pages/ClaimNew";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import SavingsSimulator from "./pages/SavingsSimulator";
import EducationSimulator from "./pages/EducationSimulator";
import SurveyResponse from "./pages/SurveyResponse";
import RoleProtectedRoute from "./components/RoleProtectedRoute";

// Product landing pages
import AssuranceAuto from "./pages/products/AssuranceAuto";
import AssuranceHabitation from "./pages/products/AssuranceHabitation";
import AssuranceSante from "./pages/products/AssuranceSante";
import AssuranceVie from "./pages/products/AssuranceVie";
import Sinistres from "./pages/products/Sinistres";

// Commercial landing pages
import OutilsPipeline from "./pages/commercial/OutilsPipeline";
import OutilsVenteGuidee from "./pages/commercial/OutilsVenteGuidee";
import OutilsAnalytics from "./pages/commercial/OutilsAnalytics";
import OutilsKYC from "./pages/commercial/OutilsKYC";
import Formation from "./pages/commercial/Formation";
import Support from "./pages/commercial/Support";
import Communaute from "./pages/commercial/Communaute";

// Broker pages
import { BrokerLayout } from "./layouts/BrokerLayout";
import DashboardPage from "./pages/broker/DashboardPage";
import PortfolioPage from "./pages/broker/PortfolioPage";
import GuidedSalesPage from "./pages/broker/GuidedSalesPage";
import ClaimsPage from "./pages/broker/ClaimsPage";
import PoliciesPage from "./pages/broker/PoliciesPage";
import AnalysisPage from "./pages/broker/AnalysisPage";
import MessagesPage from "./pages/broker/MessagesPage";

// Admin pages
import { AdminLayout } from "./layouts/AdminLayout";
import AdminDashboardPage from "./pages/admin/DashboardPage";
import AdminClaimsPage from "./pages/admin/ClaimsPage";
import AdminSubscriptionsPage from "./pages/admin/SubscriptionsPage";
import AdminUsersPage from "./pages/admin/UsersPage";
import AdminPermissionsPage from "./pages/admin/PermissionsPage";
import AdminAuditPage from "./pages/admin/AuditPage";
import AdminLoyaltyPage from "./pages/admin/LoyaltyPage";
import AdminSurveysPage from "./pages/admin/SurveysPage";
import AdminFormsPage from "./pages/admin/FormsPage";
import AdminAIMonitoringPage from "./pages/admin/AIMonitoringPage";
import AdminCompetitivePage from "./pages/admin/CompetitivePage";
import AdminTestDataPage from "./pages/admin/TestDataPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/commercial" element={<Commercial />} />
          <Route path="/courtiers" element={<Navigate to="/commercial" replace />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/simulateur-epargne" element={<SavingsSimulator />} />
          <Route path="/simulateur-education" element={<EducationSimulator />} />
          <Route path="/survey/:token" element={<SurveyResponse />} />
          <Route path="/b2c" element={
            <RoleProtectedRoute allowedRoles={["customer", "admin"]}>
              <B2C />
            </RoleProtectedRoute>
          } />
          <Route path="/b2c/claims/new" element={
            <RoleProtectedRoute allowedRoles={["customer", "admin"]}>
              <ClaimNew />
            </RoleProtectedRoute>
          } />
          
          {/* Product Landing Pages */}
          <Route path="/assurance/auto" element={<AssuranceAuto />} />
          <Route path="/assurance/habitation" element={<AssuranceHabitation />} />
          <Route path="/assurance/sante" element={<AssuranceSante />} />
          <Route path="/assurance/vie" element={<AssuranceVie />} />
          <Route path="/sinistres" element={<Sinistres />} />
          
          {/* Commercial Landing Pages */}
          <Route path="/commercial/outils/pipeline" element={<OutilsPipeline />} />
          <Route path="/commercial/outils/vente-guidee" element={<OutilsVenteGuidee />} />
          <Route path="/commercial/outils/analytics" element={<OutilsAnalytics />} />
          <Route path="/commercial/outils/kyc" element={<OutilsKYC />} />
          <Route path="/commercial/ressources/formation" element={<Formation />} />
          <Route path="/commercial/ressources/support" element={<Support />} />
          <Route path="/commercial/ressources/communaute" element={<Communaute />} />
          
          {/* B2B Routes with Sidebar Layout */}
          <Route path="/b2b" element={
            <RoleProtectedRoute allowedRoles={["broker", "admin"]}>
              <BrokerLayout />
            </RoleProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="portfolio" element={<PortfolioPage />} />
            <Route path="leads" element={<Navigate to="/b2b/portfolio?tab=prospects" replace />} />
            <Route path="clients" element={<Navigate to="/b2b/portfolio?tab=clients" replace />} />
            <Route path="sales" element={<GuidedSalesPage />} />
            <Route path="claims" element={<ClaimsPage />} />
            <Route path="policies" element={<PoliciesPage />} />
            <Route path="analysis" element={<AnalysisPage />} />
            <Route path="messages" element={<MessagesPage />} />
          </Route>

          {/* Admin Routes with Sidebar Layout */}
          <Route path="/admin" element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout />
            </RoleProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="claims" element={<AdminClaimsPage />} />
            <Route path="subscriptions" element={<AdminSubscriptionsPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="permissions" element={<AdminPermissionsPage />} />
            <Route path="audit" element={<AdminAuditPage />} />
            <Route path="loyalty" element={<AdminLoyaltyPage />} />
            <Route path="surveys" element={<AdminSurveysPage />} />
            <Route path="forms" element={<AdminFormsPage />} />
            <Route path="ai" element={<AdminAIMonitoringPage />} />
            <Route path="competitive" element={<AdminCompetitivePage />} />
            <Route path="data" element={<AdminTestDataPage />} />
          </Route>

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
