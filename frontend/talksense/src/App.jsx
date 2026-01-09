import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getRedirectPath } from "./lib/utils";
import { AuthLayout } from "./components/layout/AuthLayout";
import { AppLayout } from "./components/layout/AppLayout";

// Public Pages
import LandingPage from "./pages/LandingPage";

// Auth Pages
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import TestHarness from "./pages/TestHarness";

import PasswordResetRequestPage from "./pages/auth/PasswordResetRequestPage";
import PasswordResetConfirmPage from "./pages/auth/PasswordResetConfirmPage";

// App Pages
import ChatDashboard from "./pages/app/ChatDashboard";
import AnalyticsDashboard from "./pages/admin/AnalyticsDashboard";
import ProfilePage from "./pages/app/ProfilePage";
import HistoryPage from "./pages/app/HistoryPage";
import PublicChatView from "./pages/app/PublicChatView";

// Protected Route Wrapper
import { useAuth } from "./context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="flex h-screen items-center justify-center text-[var(--color-primary)]">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" />;
  return children;
};

// Public Route Wrapper (redirects if already logged in)
const PublicRoute = ({ children }) => {
    const { isAuthenticated, user, isLoading } = useAuth();
    if (isLoading) return <div className="flex h-screen items-center justify-center text-[var(--color-primary)]">Loading...</div>;
    if (isAuthenticated) return <Navigate to={getRedirectPath(user)} />;
    return children;
};

import NotFound from "./pages/NotFound";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      
      {/* Test Harness - Public for easy QA access as requested */}
      <Route path="/test-harness" element={<TestHarness />} />

      {/* Public Shared Chat - No auth required */}
      <Route path="/shared/:chatId" element={<PublicChatView />} />

      {/* Auth Routes */}
      <Route element={<PublicRoute><AuthLayout /></PublicRoute>}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/auth/password-reset-request" element={<PasswordResetRequestPage />} />
        <Route path="/password-reset" element={<PasswordResetConfirmPage />} />
      </Route>

      {/* App Routes */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Navigate to="/chat" replace />} />
        <Route path="/chat/:sessionId?" element={<ChatDashboard />} />
        <Route path="/admin/analytics" element={<AnalyticsDashboard />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
