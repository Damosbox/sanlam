import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import B2C from "./pages/B2C";
import B2B from "./pages/B2B";
import Admin from "./pages/Admin";
import ClaimNew from "./pages/ClaimNew";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import SavingsSimulator from "./pages/SavingsSimulator";
import EducationSimulator from "./pages/EducationSimulator";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleProtectedRoute from "./components/RoleProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
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
          <Route path="/b2b" element={
            <RoleProtectedRoute allowedRoles={["broker", "admin"]}>
              <B2B />
            </RoleProtectedRoute>
          } />
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
