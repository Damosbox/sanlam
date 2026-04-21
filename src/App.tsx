import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Commercial from "./pages/Commercial";
import B2C from "./pages/B2C";
import ClaimNew from "./pages/ClaimNew";
import ClientAuth from "./pages/auth/ClientAuth";
import PartnerAuth from "./pages/auth/PartnerAuth";
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
import ClaimNewPage from "./pages/broker/ClaimNewPage";
import PoliciesPage from "./pages/broker/PoliciesPage";
import RenewalStatsPage from "./pages/broker/RenewalStatsPage";
import RenewalsPage from "./pages/broker/RenewalsPage";
import AnalysisPage from "./pages/broker/AnalysisPage";
import NewsPage from "./pages/broker/NewsPage";
import ReportsPage from "./pages/broker/ReportsPage";
import CampaignsPage from "./pages/broker/CampaignsPage";
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
import AdminProductsPage from "./pages/admin/ProductsPage";
import AdminProductEditPage from "./pages/admin/ProductEditPage";
import AdminAIMonitoringPage from "./pages/admin/AIMonitoringPage";
import AdminCompetitivePage from "./pages/admin/CompetitivePage";
import AdminTestDataPage from "./pages/admin/TestDataPage";
import AdminBrokerNewsPage from "./pages/admin/BrokerNewsPage";
import AdminCalcRulesPage from "./pages/admin/CalcRulesPage";
import AdminCalcVariablesPage from "./pages/admin/CalcVariablesPage";
import AdminAgentsPortfolioPage from "./pages/admin/AgentsPortfolioPage";
import AdminAgentDetailPage from "./pages/admin/AgentDetailPage";
import AdminConversionsPage from "./pages/admin/ConversionsPage";
import AdminComplianceDashboardPage from "./pages/admin/ComplianceDashboardPage";
import AdminAgentPerformancePage from "./pages/admin/AgentPerformancePage";
import AdminLossRatioPage from "./pages/admin/LossRatioPage";
import AdminCalcDocsPage from "./pages/admin/CalcDocsPage";
import AdminDocumentTemplatesPage from "./pages/admin/DocumentTemplatesPage";
import PaymentAmlDemoPage from "./pages/admin/dev/PaymentAmlDemoPage";
import DsarPage from "./pages/admin/DsarPage";
import CommissionsPage from "./pages/broker/CommissionsPage";
import OCRValidationPage from "./pages/admin/OCRValidationPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Commercial />} />
          <Route path="/commercial" element={<Navigate to="/" replace />} />
          <Route path="/courtiers" element={<Navigate to="/" replace />} />
          <Route path="/auth" element={<Navigate to="/auth/partner" replace />} />
          <Route path="/auth/client" element={<ClientAuth />} />
          <Route path="/auth/partner" element={<PartnerAuth />} />
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
            <Route path="claims/new" element={<ClaimNewPage />} />
            <Route path="policies" element={<PoliciesPage />} />
            <Route path="renewals" element={<RenewalsPage />} />
            <Route path="stats" element={<RenewalStatsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="analysis" element={<AnalysisPage />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="news" element={<NewsPage />} />
            <Route path="campaigns" element={<CampaignsPage />} />
            <Route path="commissions" element={<CommissionsPage />} />
          </Route>

          {/* Admin Routes with Sidebar Layout */}
          <Route path="/admin" element={
            <RoleProtectedRoute allowedRoles={["admin", "backoffice_crc", "backoffice_conformite"]}>
              <AdminLayout />
            </RoleProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="claims" element={<AdminClaimsPage />} />
            <Route path="subscriptions" element={<AdminSubscriptionsPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="users/clients" element={<Navigate to="/admin/users?tab=clients" replace />} />
            <Route path="users/partners" element={<Navigate to="/admin/users?tab=partners" replace />} />
            <Route path="users/admins" element={<Navigate to="/admin/users?tab=admins" replace />} />
            <Route path="permissions" element={<AdminPermissionsPage />} />
            <Route path="audit" element={<AdminAuditPage />} />
            <Route path="loyalty" element={<AdminLoyaltyPage />} />
            <Route path="surveys" element={<AdminSurveysPage />} />
            <Route path="forms" element={<AdminFormsPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="products/:id" element={<AdminProductEditPage />} />
            <Route path="calc-rules" element={<AdminCalcRulesPage />} />
            <Route path="calc-variables" element={<AdminCalcVariablesPage />} />
            <Route path="ai" element={<AdminAIMonitoringPage />} />
            <Route path="competitive" element={<AdminCompetitivePage />} />
            <Route path="data" element={<AdminTestDataPage />} />
            <Route path="broker-news" element={<AdminBrokerNewsPage />} />
            <Route path="agents-portfolio" element={<AdminAgentsPortfolioPage />} />
            <Route path="agents/:agentId" element={<AdminAgentDetailPage />} />
            <Route path="conversions" element={<AdminConversionsPage />} />
            <Route path="agent-performance" element={<AdminAgentPerformancePage />} />
            <Route path="loss-ratio" element={<AdminLossRatioPage />} />
            <Route path="compliance" element={<AdminComplianceDashboardPage />} />
            <Route path="calc-docs" element={<AdminCalcDocsPage />} />
            <Route path="document-templates" element={<AdminDocumentTemplatesPage />} />
            <Route path="dsar" element={<DsarPage />} />
            <Route path="ocr-validation" element={<OCRValidationPage />} />
            <Route path="dev/payment-aml" element={<PaymentAmlDemoPage />} />
          </Route>

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
