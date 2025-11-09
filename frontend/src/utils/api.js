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
      // Check if it's a chat endpoint (handle more gracefully)
      const isChatEndpoint = error.config?.url?.includes('/api/chat/');

      // Check if we have a token
      const hasToken = localStorage.getItem('token');

      // For chat endpoints, handle silently and don't redirect
      if (isChatEndpoint) {
        // For chat endpoints, clear token if it's invalid but don't redirect
        if (hasToken) {
          localStorage.removeItem('token');
        }
        // Return a silent error
        const silentError = new Error('Chat authentication failed');
        silentError.response = error.response;
        silentError.config = error.config;
        silentError.isChatAuthError = true;
        return Promise.reject(silentError);
      }

      // Check if it's a permission issue vs token expiration
      const isPermissionIssue = error.response?.data?.message?.includes('Access denied') ||
        error.response?.data?.message?.includes('privileges required');

      // Check if it's a missing endpoint (which should not cause redirect)
      const isMissingEndpoint = !error.response?.data?.message;

      // Only redirect if:
      // 1. It's not a permission issue
      // 2. It's not a missing endpoint
      // 3. We actually have a token (if no token, it's expected 401)
      if (!isPermissionIssue && !isMissingEndpoint && hasToken) {
        localStorage.removeItem('token');

        // Redirect to login page if not already there
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;