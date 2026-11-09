import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import { useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import Home from "./pages/Home";
import Studio from "./pages/studio/Studio";
import AuthPage from "./pages/AuthPage";

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => { if (!window.location.hash) window.scrollTo({ top: 0 }); }, [location]);
  return null;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <ScrollToTop />
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/login">{() => <AuthPage initialMode="login" />}</Route>
              <Route path="/signup">{() => <AuthPage initialMode="signup" />}</Route>
              <Route path="/app">{() => <ProtectedRoute component={Studio} />}</Route>
              <Route path="/app/:section">{() => <ProtectedRoute component={Studio} />}</Route>
              <Route component={NotFound} />
            </Switch>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
