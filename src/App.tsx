import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import B2C from "./pages/B2C";
import Admin from "./pages/Admin";
import ClaimNew from "./pages/ClaimNew";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import SavingsSimulator from "./pages/SavingsSimulator";
import EducationSimulator from "./pages/EducationSimulator";
import BrokerLanding from "./pages/BrokerLanding";
import RoleProtectedRoute from "./components/RoleProtectedRoute";

// Broker pages
import { BrokerLayout } from "./layouts/BrokerLayout";
import DashboardPage from "./pages/broker/DashboardPage";
import PortfolioPage from "./pages/broker/PortfolioPage";
import GuidedSalesPage from "./pages/broker/GuidedSalesPage";
import ClaimsPage from "./pages/broker/ClaimsPage";
import PoliciesPage from "./pages/broker/PoliciesPage";
import AnalysisPage from "./pages/broker/AnalysisPage";
import MessagesPage from "./pages/broker/MessagesPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/courtiers" element={<BrokerLanding />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/simulateur-epargne" element={<SavingsSimulator />} />
          <Route path="/simulateur-education" element={<EducationSimulator />} />
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

          <Route path="/admin" element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <Admin />
            </RoleProtectedRoute>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
