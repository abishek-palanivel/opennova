import api from './api';

/**
 * Chat Authentication Utilities
 * Handles authentication state for chat components
 */

/**
 * Check if user is authenticated for chat features
 * @param {Object} user - User object from AuthContext
 * @returns {boolean} - True if user can access authenticated chat features
 */
export const isChatAuthenticated = (user) => {
  const token = localStorage.getItem('token');
  return !!(user && token);
};

/**
 * Verify authentication status with the server
 * @returns {Promise<boolean>} - True if authenticated
 */
export const verifyChatAuth = async () => {
  try {
    const response = await api.get('/api/chat/auth-status');
    return response.data?.authenticated || false;
  } catch (error) {
    return false;
  }
};

/**
 * Check if user has admin/owner privileges for chat management
 * @param {Object} user - User object from AuthContext
 * @returns {boolean} - True if user can manage chats
 */
export const canManageChats = (user) => {
  // First check if user exists and has a valid role
  if (!user || !user.role) {
    return false;
  }
  
  // Check if user has required role
  const allowedRoles = ['ADMIN', 'OWNER', 'HOTEL_OWNER', 'HOSPITAL_OWNER', 'SHOP_OWNER'];
  if (!allowedRoles.includes(user.role)) {
    return false;
  }
  
  // Finally check if user is properly authenticated
  return isChatAuthenticated(user);
};

/**
 * Clear authentication state when token is invalid
 */
export const clearChatAuth = () => {
  localStorage.removeItem('token');
};

/**
 * Get guest user name for chat
 * @param {Object} user - User object (may be null)
 * @returns {string} - Guest name to use
 */
export const getGuestName = (user) => {
  return user?.name || 'Guest User';
};

/**
 * Check if an error is an authentication error
 * @param {Object} error - Axios error object
 * @returns {boolean} - True if it's a 401 authentication error
 */
export const isAuthError = (error) => {
  return error?.response?.status === 401;
};

/**
 * Handle authentication errors in chat components
 * @param {Object} error - Axios error object
 * @returns {boolean} - True if error was handled
 */
export const handleChatAuthError = (error) => {
  if (isAuthError(error)) {
    clearChatAuth();
    return true;
  }
  return false;
};

/**
 * Check if user should be allowed to make chat API calls
 * @param {Object} user - User object from AuthContext
 * @returns {boolean} - True if user can make chat API calls
 */
export const shouldAllowChatApiCall = (user) => {
  if (!user || !user.role || !localStorage.getItem('token')) {
    return false;
  }
  
  // Check if token is expired
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        const now = Date.now() / 1000;
        if (payload.exp < now) {
          console.log('Token is expired, clearing it');
          localStorage.removeItem('token');
          return false;
        }
      }
    } catch (error) {
      console.log('Invalid token format, clearing it');
      localStorage.removeItem('token');
      return false;
    }
  }
  
  return isChatAuthenticated(user);
};

/**
 * Safe API call wrapper for chat endpoints
 * @param {Function} apiCall - The API call function
 * @param {Object} user - User object from AuthContext
 * @returns {Promise} - API response or null if not authenticated
 */
export const safeChatApiCall = async (apiCall, user) => {
  // Don't make the call if user isn't properly authenticated
  if (!shouldAllowChatApiCall(user)) {
    return null;
  }
  
  try {
    const result = await apiCall();
    return result;
  } catch (error) {
    // Handle auth errors silently for chat endpoints
    if (handleChatAuthError(error)) {
      return null;
    }
    
    // Don't re-throw the error if it's a chat auth error
    if (error?.response?.status === 401 && error?.config?.url?.includes('/api/chat/')) {
      return null;
    }
    
    // For other errors, return null to prevent breaking the UI
    return null;
  }
};