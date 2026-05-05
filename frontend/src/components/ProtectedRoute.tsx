import React from 'react';
import { Navigate, Outlet } from 'react-router';
import useAuthStore from '../store/authStore';
import LoadingSpinner from './LoadingSpinner'; // Assuming this component exists

interface ProtectedRouteProps {
  children?: React.ReactNode;
  requiredRole?: 'admin' | 'user' | string;
}

/**
 * A component to protect routes based on authentication status and user roles.
 * If not authenticated, redirects to /sign-in.
 * If authenticated but role doesn't match, redirects to /.
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - Child components to render if authorized.
 * @param {string} [props.requiredRole] - The role required to access this route (e.g., 'admin', 'user').
 * @returns {React.ReactNode} - Rendered content or a redirection.
 */
const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, loading, user } = useAuthStore();

  // Show a loading spinner while authentication status is being checked
  if (loading) {
    return <LoadingSpinner />;
  }

  // If not authenticated, redirect to the sign-in page
  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace />;
  }

  // If a required role is specified, check if the user has that role
  if (requiredRole && (!user || user.role !== requiredRole)) {
    // If the user does not have the required role, redirect to the home page
    // Or you could render an "Unauthorized" component here
    return <Navigate to="/" replace />;
  }

  // If authenticated and role matches (if required), render the child routes/components
  return children ? children : <Outlet />;
};

export default ProtectedRoute;
