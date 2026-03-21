import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import OpenNovaLogo from '../common/OpenNovaLogo';

const GoogleSignupConfirmation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const email = searchParams.get('email');
  const name = searchParams.get('name');
  const picture = searchParams.get('picture');
  const googleId = searchParams.get('googleId');

  useEffect(() => {
    // If missing required parameters, redirect to login
    if (!email || !name || !googleId) {
      console.error('Missing required Google OAuth parameters:', { email, name, googleId });
      navigate('/login');
    }
  }, [email, name, googleId, navigate]);

  const handleConfirmSignup = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('🔄 Starting Google signup confirmation for:', email);

      const response = await api.post('/api/auth/google/signup', {
        email,
        name,
        googleId,
        picture: picture || ''
      });

      console.log('✅ Google signup response:', response.data);

      if (response.data.success) {
        // Extract token from nested structure
        const token = response.data.user?.token || response.data.token;
        
        if (!token) {
          console.error('❌ No token received from signup response');
          setError('Authentication failed - no token received');
          return;
        }

        localStorage.setItem('token', token);
        
        console.log('🔄 Logging in user with Google token...');
        
        // Use the login function with Google token
        const result = await login(null, null, token);
        
        if (result.success) {
          console.log('✅ Google signup and login successful, redirecting to dashboard');
          // Force page reload to ensure proper state update
          window.location.href = '/user/dashboard';
        } else {
          console.error('❌ Login failed after signup:', result);
          setError('Failed to complete signup. Please try signing in instead.');
        }
      } else {
        console.error('❌ Signup failed:', response.data);
        setError(response.data.message || 'Signup failed');
      }
    } catch (error) {
      console.error('❌ Google signup error:', error);
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        setError('Account already exists. Please sign in instead.');
      } else {
        setError(error.response?.data?.message || 'Signup failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/login');
  };

  if (!email || !name || !googleId) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="glass-effect p-8">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <OpenNovaLogo size={60} />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-2">
              Complete Your Signup
            </h2>
            <p className="text-slate-600">Confirm your Google account details</p>
          </div>

          {/* User Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-4">
              {picture && (
                <img 
                  src={picture} 
                  alt="Profile" 
                  className="w-12 h-12 rounded-full"
                />
              )}
              <div>
                <p className="font-semibold text-gray-900">{name}</p>
                <p className="text-sm text-gray-600">{email}</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4 border border-red-200">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleConfirmSignup}
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </div>
              ) : (
                'Create Account with Google'
              )}
            </button>

            <button
              onClick={handleCancel}
              disabled={loading}
              className="w-full btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleSignupConfirmation;