import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import SymptomCheckerPage from './pages/SymptomCheckerPage';
import EmailConfirmationHandler from './components/auth/EmailConfirmationHandler';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes for login/signup */}
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/confirm-email" element={<EmailConfirmationHandler />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/symptoms" element={<SymptomCheckerPage />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
