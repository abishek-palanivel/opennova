import axios from 'axios';
import API_BASE_URL from '../config/api';

// Store original console methods for potential restoration
const originalConsole = {
  error: console.error,
  warn: console.warn
};

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL
});

// Request interceptor to add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      // Check if token is expired before making request
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          const now = Date.now() / 1000;
          if (payload.exp < now) {
            console.log('Token expired, removing from storage');
            localStorage.removeItem('token');
            // Don't add expired token to request
            return config;
          }
        }
      } catch (error) {
        console.error('Error parsing token in request interceptor:', error);
        localStorage.removeItem('token');
        return config;
      }

      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration and network errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle network errors (including chunked encoding issues)
    if (!error.response) {
      if (error.code === 'ERR_INCOMPLETE_CHUNKED_ENCODING' ||
        error.code === 'ERR_INVALID_CHUNKED_ENCODING' ||
        error.code === 'ERR_CONNECTION_REFUSED') {
        // Return a more user-friendly error for network issues
        return Promise.reject({
          ...error,
          message: 'Server connection error. Please try again.',
          isNetworkError: true
        });
      }
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      const hasToken = localStorage.getItem('token');
      const errorMessage = error.response?.data?.message || '';
      const requestUrl = error.config?.url || '';
      
      // Don't redirect if it's already an error endpoint or auth endpoint
      if (requestUrl.includes('/error') || requestUrl.includes('/api/auth/')) {
        return Promise.reject(error);
      }
      
      // Check if it's a permission issue vs token expiration
      const isPermissionIssue = errorMessage.includes('Access denied') ||
                               errorMessage.includes('privileges required') ||
                               errorMessage.includes('Unauthorized access');

      // Check if it's authentication required (token expired/invalid)
      const isAuthRequired = errorMessage.includes('Full authentication is required') ||
                             errorMessage.includes('JWT') ||
                             errorMessage.includes('token') ||
                             errorMessage.includes('Authentication required');

      // Check if we're already on login page
      const isOnLoginPage = window.location.pathname === '/login' || 
                           window.location.pathname === '/register' ||
                           window.location.pathname === '/';

      // Redirect to login if:
      // 1. We have a token but it's invalid/expired (auth required error)
      // 2. OR we have a token but got generic 401 (likely expired)
      // 3. AND we're not already on login page
      // 4. AND it's not a permission issue (user has valid token but lacks permissions)
      if (hasToken && !isOnLoginPage && (isAuthRequired || (!isPermissionIssue && !errorMessage))) {
        console.log('🔄 Authentication failed, redirecting to login...', errorMessage);
        localStorage.removeItem('token');

        // Use a small delay to prevent multiple redirects
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      } else if (!hasToken && !isOnLoginPage && isAuthRequired) {
        // No token but auth required - redirect to login
        console.log('🔄 No token found, redirecting to login...');
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
