
import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from './common/LoadingSpinner';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role Based Access Control
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // If user has no role or wrong role, redirect to dashboard (or unauthorized page if you have one)
    // Preventing infinite redirect if they are already at root/dashboard
    if (location.pathname !== '/' && location.pathname !== '/Dashboard') {
        return <Navigate to="/Dashboard" replace />;
    }
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
