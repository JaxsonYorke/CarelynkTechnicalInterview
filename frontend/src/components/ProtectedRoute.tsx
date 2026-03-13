/**
 * Protected route component for authentication and authorization
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'caregiver' | 'care_seeker';
}

/**
 * Wrapper component that protects routes from unauthenticated access
 * Can optionally restrict by user role
 * 
 * @param children Component to render if authenticated
 * @param requiredRole Optional role to restrict access (e.g., 'caregiver')
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { user, loading } = useAuth();

  // Show loading state
  if (loading) {
    return <div>Loading...</div>;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/auth/caregiver/login" replace />;
  }

  // Check role if specified
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
