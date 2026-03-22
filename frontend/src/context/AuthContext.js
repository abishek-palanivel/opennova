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

    // Set up token refresh interval
    const refreshInterval = setInterval(() => {
      checkAndRefreshToken();
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(refreshInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isTokenExpired = (token) => {
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        const now = Date.now() / 1000;
        return payload.exp < now;
      }
    } catch (error) {
      console.error('Error parsing token:', error);
      return true;
    }
    return true;
  };

  const isTokenExpiringSoon = (token) => {
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        const now = Date.now() / 1000;
        const timeUntilExpiry = payload.exp - now;
        return timeUntilExpiry < 30 * 60; // Less than 30 minutes
      }
    } catch (error) {
      console.error('Error parsing token:', error);
      return true;
    }
    return true;
  };

  const checkAndRefreshToken = async () => {
    const token = localStorage.getItem('token');
    if (!token || !user) return;

    if (isTokenExpired(token)) {
      console.log('Token expired, logging out...');
      logout();
      return;
    }

    if (isTokenExpiringSoon(token)) {
      console.log('Token expiring soon, refreshing...');
      try {
        const response = await api.post('/api/auth/refresh');
        if (response.data && response.data.token) {
          localStorage.setItem('token', response.data.token);
          setUser(response.data.user);
          console.log('Token refreshed successfully');
        }
      } catch (error) {
        console.error('Failed to refresh token:', error);
        if (error.response?.status === 401) {
          logout();
        }
      }
    }
  };

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }
      
      // Basic token validation - check if it's expired
      if (isTokenExpired(token)) {
        console.log('Token expired during profile fetch');
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
        console.log('Authentication failed, clearing token');
        localStorage.removeItem('token');
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, googleToken = null) => {
    try {
      // Handle Google OAuth login
      if (googleToken) {
        localStorage.setItem('token', googleToken);
        // Fetch user profile with the Google token
        const response = await api.get('/api/auth/profile', {
          headers: { Authorization: `Bearer ${googleToken}` }
        });
        
        // Wait for state update to complete
        await new Promise(resolve => {
          setUser(response.data);
          // Use setTimeout to ensure state update is processed
          setTimeout(resolve, 50);
        });
        
        const redirectPath = getPortalRedirectPath(response.data);
        return { 
          success: true, 
          user: response.data,
          redirectPath 
        };
      }
      
      // Handle regular email/password login
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
      
      // Wait for state update to complete
      await new Promise(resolve => {
        setUser(userData);
        // Use setTimeout to ensure state update is processed
        setTimeout(resolve, 50);
      });
      
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
      
      // Handle suspended/deactivated accounts
      if (error.response?.status === 403 && error.response?.data?.accountStatus === 'SUSPENDED') {
        return { 
          success: false, 
          message: error.response.data.message || 'Your account has been suspended or deactivated.',
          accountStatus: 'SUSPENDED',
          supportEmail: error.response.data.supportEmail || 'support@opennova.com',
          isSuspended: true
        };
      }
      
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed. Please check your credentials and try again.',
        needsSignup: error.response?.data?.needsSignup === 'true',
        googleUserInfo: error.response?.data?.email ? {
          email: error.response.data.email
        } : null
      };
    }
  };

  const getPortalRedirectPath = (user) => {
    switch (user.role) {
      case 'ADMIN':
        return '/admin/dashboard';
      case 'OWNER':
      case 'HOTEL_OWNER':
      case 'HOSPITAL_OWNER':
      case 'SHOP_OWNER':
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