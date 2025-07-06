import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';

const ProtectedRoute = () => {
  const { user } = useAuth();

  if (!user) {
    // Redirect unauthenticated users to login page
    return <Navigate to="/login" replace />;
  }

  // Render child routes if authenticated
  return <Outlet />;
};

export default ProtectedRoute;
