import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAdmin, isClinician, isPatient } = useAuth();

  // While auth state is being determined, show minimal loading
  if (loading && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="text-gray-600 font-medium">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  // Check role-based access using computed properties from AuthContext
  if (allowedRoles) {
    const hasAccess = (
      (allowedRoles.includes('admin') && isAdmin) ||
      (allowedRoles.includes('clinician') && isClinician) ||
      (allowedRoles.includes('patient') && isPatient)
    );

    if (!hasAccess) {
      // Redirect to appropriate dashboard based on user's actual role
      if (isAdmin) {
        return <Navigate to="/admin/dashboard" replace />;
      } else if (isClinician) {
        return <Navigate to="/clinician/dashboard" replace />;
      } else if (isPatient) {
        return <Navigate to="/patient/dashboard" replace />;
      } else {
        return <Navigate to="/" replace />;
      }
    }
  }

  return <>{children}</>;
};