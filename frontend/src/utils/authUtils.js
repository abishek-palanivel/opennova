import api from './api';

export const refreshAuthToken = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found to refresh');
      return false;
    }

    // Test if current token is still valid
    const response = await api.get('/api/auth/profile');
    console.log('Token is still valid:', response.data);
    return true;
  } catch (error) {
    console.error('Token validation failed:', error);
    
    if (error.response?.status === 401) {
      console.log('Token expired or invalid, removing from storage');
      localStorage.removeItem('token');
      return false;
    }
    
    // For other errors, assume token is still valid
    return true;
  }
};

export const validateAuthState = async () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return {
      isValid: false,
      reason: 'No token found'
    };
  }

  try {
    const response = await api.get('/api/auth/profile');
    return {
      isValid: true,
      user: response.data
    };
  } catch (error) {
    // If token is invalid, remove it
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
    }
    
    return {
      isValid: false,
      reason: error.response?.data?.message || error.message,
      status: error.response?.status
    };
  }
};

export const ensureAuthenticated = async () => {
  const authState = await validateAuthState();
  
  if (!authState.isValid) {
    console.log('Authentication validation failed:', authState.reason);
    
    // Only redirect if we're on a protected route
    const currentPath = window.location.pathname;
    const isProtectedRoute = currentPath.includes('/admin') || 
                           currentPath.includes('/owner') || 
                           currentPath.includes('/user');
    
    if (isProtectedRoute && currentPath !== '/login') {
      console.log('Redirecting to login due to authentication failure');
      window.location.href = '/login';
      return false;
    }
  }
  
  return authState.isValid;
};

export const isTokenValid = async () => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  
  try {
    await api.get('/api/auth/profile');
    return true;
  } catch (error) {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
    }
    return false;
  }
};

