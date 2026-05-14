import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import { marketingRoutes } from "./features/marketing-center/config";
import AffiliateProfilePage from "./pages/AffiliateProfilePage";
import DashboardScreen from "./pages/DashboardScreen";
import DynamicPage from "./pages/DynamicPage";
import Index from "./pages/Index";
import Login from "./pages/Login";
import KolLogPage from "./pages/log/KolLogPage";
import KycManagementPage from "./pages/manage/KycManagementPage";
import MarketingActivitiesPage from "./pages/marketing-center/MarketingActivitiesPage";
import MarketingActivityDetailPage from "./pages/marketing-center/MarketingActivityDetailPage";
import MarketingActivityFormPage from "./pages/marketing-center/MarketingActivityFormPage";
import MarketingAuditPage from "./pages/marketing-center/MarketingAuditPage";
import MarketingBasicConfigPage from "./pages/marketing-center/MarketingBasicConfigPage";
import MarketingComplianceReviewPage from "./pages/marketing-center/MarketingComplianceReviewPage";
import MarketingLinksPage from "./pages/marketing-center/MarketingLinksPage";
import MarketingMaterialDetailPage from "./pages/marketing-center/MarketingMaterialDetailPage";
import MarketingMaterialFormPage from "./pages/marketing-center/MarketingMaterialFormPage";
import MarketingMaterialsPage from "./pages/marketing-center/MarketingMaterialsPage";
import MarketingReportsPage from "./pages/marketing-center/MarketingReportsPage";
import MarketingWorkbenchPage from "./pages/marketing-center/MarketingWorkbenchPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manage/affiliate-profile/:affiliateId"
              element={
                <ProtectedRoute>
                  <AffiliateProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manage/kyc"
              element={
                <ProtectedRoute>
                  <KycManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/screen"
              element={
                <ProtectedRoute>
                  <DashboardScreen />
                </ProtectedRoute>
              }
            />
            <Route
              path="/log/kol-log"
              element={
                <ProtectedRoute>
                  <KolLogPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/marketing"
              element={<Navigate to={marketingRoutes.workbench} replace />}
            />
            <Route
              path="/marketing-center"
              element={<Navigate to={marketingRoutes.workbench} replace />}
            />
            <Route
              path={marketingRoutes.workbench}
              element={
                <ProtectedRoute>
                  <MarketingWorkbenchPage />
                </ProtectedRoute>
              }
            />
            <Route
              path={marketingRoutes.materials}
              element={
                <ProtectedRoute>
                  <MarketingMaterialsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path={marketingRoutes.materialCreate}
              element={
                <ProtectedRoute>
                  <MarketingMaterialFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/marketing/material/:id"
              element={
                <ProtectedRoute>
                  <MarketingMaterialDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/marketing/material/:id/edit"
              element={
                <ProtectedRoute>
                  <MarketingMaterialFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/marketing/materials"
              element={
                <ProtectedRoute>
                  <MarketingMaterialsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/marketing/materials/create"
              element={
                <ProtectedRoute>
                  <MarketingMaterialFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/marketing-center/materials/:id"
              element={
                <ProtectedRoute>
                  <MarketingMaterialDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/marketing-center/materials/:id/edit"
              element={
                <ProtectedRoute>
                  <MarketingMaterialFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path={marketingRoutes.activities}
              element={
                <ProtectedRoute>
                  <MarketingActivitiesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path={marketingRoutes.activityCreate}
              element={
                <ProtectedRoute>
                  <MarketingActivityFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/marketing/campaign/:id"
              element={
                <ProtectedRoute>
                  <MarketingActivityDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/marketing/campaign/:id/edit"
              element={
                <ProtectedRoute>
                  <MarketingActivityFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/marketing/activities"
              element={
                <ProtectedRoute>
                  <MarketingActivitiesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/marketing/activities/create"
              element={
                <ProtectedRoute>
                  <MarketingActivityFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/marketing/activities/:id"
              element={
                <ProtectedRoute>
                  <MarketingActivityDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/marketing/activities/:id/edit"
              element={
                <ProtectedRoute>
                  <MarketingActivityFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/marketing-center/activities/:id"
              element={
                <ProtectedRoute>
                  <MarketingActivityDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/marketing-center/activities/:id/edit"
              element={
                <ProtectedRoute>
                  <MarketingActivityFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/marketing-center/workbench"
              element={
                <ProtectedRoute>
                  <MarketingWorkbenchPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/marketing-center/materials"
              element={
                <ProtectedRoute>
                  <MarketingMaterialsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/marketing-center/materials/create"
              element={
                <ProtectedRoute>
                  <MarketingMaterialFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/marketing-center/activities"
              element={
                <ProtectedRoute>
                  <MarketingActivitiesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/marketing-center/activities/create"
              element={
                <ProtectedRoute>
                  <MarketingActivityFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/marketing-center/reviews"
              element={
                <ProtectedRoute>
                  <MarketingComplianceReviewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/marketing-center/links"
              element={
                <ProtectedRoute>
                  <MarketingLinksPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/marketing-center/reports"
              element={
                <ProtectedRoute>
                  <MarketingReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/marketing-center/config"
              element={
                <ProtectedRoute>
                  <MarketingBasicConfigPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/marketing-center/audit"
              element={
                <ProtectedRoute>
                  <MarketingAuditPage />
                </ProtectedRoute>
              }
            />
            <Route
              path={marketingRoutes.reviews}
              element={
                <ProtectedRoute>
                  <MarketingComplianceReviewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/marketing/reviews"
              element={
                <ProtectedRoute>
                  <MarketingComplianceReviewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path={marketingRoutes.links}
              element={
                <ProtectedRoute>
                  <MarketingLinksPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/marketing/links"
              element={
                <ProtectedRoute>
                  <MarketingLinksPage />
                </ProtectedRoute>
              }
            />
            <Route
              path={marketingRoutes.reports}
              element={
                <ProtectedRoute>
                  <MarketingReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/marketing/reports"
              element={
                <ProtectedRoute>
                  <MarketingReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path={marketingRoutes.config}
              element={
                <ProtectedRoute>
                  <MarketingBasicConfigPage />
                </ProtectedRoute>
              }
            />
            <Route
              path={marketingRoutes.audit}
              element={
                <ProtectedRoute>
                  <MarketingAuditPage />
                </ProtectedRoute>
              }
            />
            {/* Dynamic resource page: any nested path becomes a dotted code. */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <DynamicPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
