import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import DynamicPage from "./pages/DynamicPage";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

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
            {/* Dynamic resource page: code is dot-segments joined by "/". */}
            <Route
              path="/:code/*"
              element={
                <ProtectedRoute>
                  <DynamicCodeRoute />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

/**
 * Translates the URL path back to a `resourceCode` (dot-separated) and
 * delegates rendering to <DynamicPage>. We do this here so a single route
 * declaration can match arbitrarily nested menu paths.
 */
function DynamicCodeRoute() {
  const segments = window.location.pathname.replace(/^\/+|\/+$/g, "").split("/");
  const code = segments.join(".");
  // Re-use DynamicPage's logic by injecting the code via URL params shim.
  return <DynamicPage key={code} {...({ } as never)} />;
}

export default App;
