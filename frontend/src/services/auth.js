import { v4 as uuidv4 } from 'uuid';

// Constants
const CURRENT_USER_KEY = 'current_user';
const TOKEN_KEY = 'auth_token';

// Get current authenticated user
export const getCurrentUser = () => {
  try {
    const userData = localStorage.getItem(CURRENT_USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Set authenticated user
export const setCurrentUser = (user) => {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
};

// Get auth token
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

// Set auth token
export const setToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

// Handle login response
export const handleLoginSuccess = (userData, token) => {
  // Store user data
  setCurrentUser(userData);
  
  // Store token
  setToken(token);
  
  return userData;
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!getCurrentUser() && !!getToken();
};

// Get user role
export const getUserRole = () => {
  const user = getCurrentUser();
  return user ? user.role : null;
};

// Clear all auth data on logout
export const logout = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
};

// Function to handle role-based navigation
export const navigateToRoleDashboard = (role) => {
  switch (role) {
    case 'admin':
      window.location.href = "/admin-dashboard";
      break;
    case 'faculty':
      window.location.href = "/faculty-dashboard";
      break;
    case 'student':
      window.location.href = "/student-dashboard";
      break;
    default:
      window.location.href = "/";
      break;
  }
};
