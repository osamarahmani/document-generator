import { Switch, Route } from "wouter";
import { Login } from "./pages/login";
import Overview from "./pages/overview";
import CertificateGenerator from "./pages/certificate-generator";
import LetterGenerator from "./pages/letter-generator";
import ViewDocuments from "./pages/view-documents";
import NotFound from "./pages/not-found";
import { ProtectedRoute } from "./components/ProtectedRoute";

export const AppRouter = () => {
  return (
    <Switch>
      {/* Root path */}
      <Route path="/" component={Login} />

      {/* Login page */}
      <Route path="/login" component={Login} />

      {/* Protected pages */}
      <Route
        path="/overview"
        component={() => (
          <ProtectedRoute>
            <Overview />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/certificate-generator"
        component={() => (
          <ProtectedRoute>
            <CertificateGenerator />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/letter-generator"
        component={() => (
          <ProtectedRoute>
            <LetterGenerator />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/view-documents"
        component={() => (
          <ProtectedRoute>
            <ViewDocuments />
          </ProtectedRoute>
        )}
      />

      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
};
