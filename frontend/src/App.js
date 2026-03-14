import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Layout from "@/components/Layout";
import HomePage from "@/pages/HomePage";
import ServicesPage from "@/pages/ServicesPage";
import TrialSimulationPage from "@/pages/TrialSimulationPage";
import CaseManagementPage from "@/pages/CaseManagementPage";
import DocumentCenterPage from "@/pages/DocumentCenterPage";
import ComplianceAlertsPage from "@/pages/ComplianceAlertsPage";
import AuthPage from "@/pages/AuthPage";
import "@/App.css";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-[#D4AF37] text-lg">Loading...</div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="services" element={<ServicesPage />} />
            <Route path="auth" element={<AuthPage />} />
            <Route
              path="simulation"
              element={
                <ProtectedRoute>
                  <TrialSimulationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="cases"
              element={
                <ProtectedRoute>
                  <CaseManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="documents"
              element={
                <ProtectedRoute>
                  <DocumentCenterPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="alerts"
              element={
                <ProtectedRoute>
                  <ComplianceAlertsPage />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
