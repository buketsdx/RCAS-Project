import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, ROLES } from '@/context/AuthContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function ProtectedRoute({ allowedRoles }) {
  const { user, loading, hasRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/Login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    // User is logged in but doesn't have permission
    return <Navigate to="/Dashboard" replace />;
  }

  return <Outlet />;
}
