import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated, getUserRole } from '../services/auth';

// Protected route component that redirects to login if not authenticated
// and enforces role-based access
const ProtectedRoute = ({ element, allowedRoles }) => {
  const isAuth = isAuthenticated();
  const userRole = getUserRole();
  
  // Check if user is authenticated
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }
  
  // Check if user has required role (if roles are specified)
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Redirect to appropriate dashboard based on role
    if (userRole === 'admin') {
      return <Navigate to="/admin-dashboard" replace />;
    } else if (userRole === 'faculty') {
      return <Navigate to="/faculty-dashboard" replace />;
    } else if (userRole === 'student') {
      return <Navigate to="/student-dashboard" replace />;
    } else {
      // If role is unknown, redirect to login
      return <Navigate to="/login" replace />;
    }
  }
  
  // If authenticated and has appropriate role, render the component
  return element;
};

export default ProtectedRoute;
