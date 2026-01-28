
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { AppLayout } from "@/components/AppLayout";
import { canAccessRoute, getDefaultRouteForRole } from "@/lib/permissions";

// Pages
import Login from "./pages/Login";
import SuperAdminSignup from "./pages/SuperAdminSignup";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import AccessControl from "./pages/access-control";
import AccessLogs from "./pages/AccessLogs";
import Enrollment from "./pages/Enrollment";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected route component with role-based access
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Check if user has permission to access this route
  if (!canAccessRoute(user?.role ?? null, location.pathname)) {
    // Redirect to default allowed route for their role
    return <Navigate to={getDefaultRouteForRole(user?.role ?? null)} replace />;
  }
  
  return <AppLayout>{children}</AppLayout>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <DataProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/ms-admin" element={<SuperAdminSignup />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
              <Route path="/access-control" element={<ProtectedRoute><AccessControl /></ProtectedRoute>} />
              <Route path="/access-logs" element={<ProtectedRoute><AccessLogs /></ProtectedRoute>} />
              <Route path="/enrollment" element={<ProtectedRoute><Enrollment /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </DataProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
