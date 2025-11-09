import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }
      
      // Basic token validation - check if it's expired
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          const now = Date.now() / 1000;
          if (payload.exp < now) {
            localStorage.removeItem('token');
            setUser(null);
            setLoading(false);
            return;
          }
        }
      } catch (tokenError) {
        localStorage.removeItem('token');
        setUser(null);
        setLoading(false);
        return;
      }
      
      const response = await api.get('/api/auth/profile');
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      
      // Only remove token if it's actually an auth error, not a network error
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', {
        email: email?.trim(),
        password
      });
      
      const { token, user: userData } = response.data;
      
      if (!token) {
        return { 
          success: false, 
          message: 'Authentication failed - no token received' 
        };
      }
      
      if (!userData) {
        return { 
          success: false, 
          message: 'Authentication failed - no user data received' 
        };
      }
      
      localStorage.setItem('token', token);
      setUser(userData);
      
      // Determine portal redirection based on user role and establishment type
      const redirectPath = getPortalRedirectPath(userData);
      
      return { 
        success: true, 
        user: userData,
        redirectPath 
      };
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle account lockout specifically
      if (error.response?.status === 423) { // HTTP 423 Locked
        return { 
          success: false, 
          message: error.response?.data?.message || 'Account is locked due to multiple failed login attempts. Please try again after 24 hours.',
          isLocked: true
        };
      }
      
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed. Please check your credentials and try again.' 
      };
    }
  };

  const getPortalRedirectPath = (user) => {
    switch (user.role) {
      case 'ADMIN':
        return '/admin/dashboard';
      case 'OWNER':
        // Redirect based on establishment type
        if (user.establishmentType) {
          switch (user.establishmentType) {
            case 'HOTEL':
              return '/owner/hotel-dashboard';
            case 'HOSPITAL':
              return '/owner/hospital-dashboard';
            case 'SHOP':
              return '/owner/shop-dashboard';
            default:
              return '/owner/dashboard';
          }
        }
        return '/owner/dashboard';
      case 'USER':
      default:
        return '/user/dashboard';
    }
  };

  const register = async (userData) => {
    try {
      await api.post('/api/auth/register', userData);
      return { success: true, message: 'Registration successful' };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const forgotPassword = async (email) => {
    try {
      await api.post('/api/auth/forgot-password', { email });
      return { success: true, message: 'Password reset link sent to your email' };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to send reset link' 
      };
    }
  };

  const resetPassword = async (token, password) => {
    try {
      await api.post('/api/auth/reset-password', { token, password });
      return { success: true, message: 'Password reset successfully' };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to reset password' 
      };
    }
  };

  const checkAccountStatus = async (email) => {
    try {
      const response = await api.post('/api/auth/check-account-status', { email });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to check account status' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    forgotPassword,
    resetPassword,
    checkAccountStatus,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};