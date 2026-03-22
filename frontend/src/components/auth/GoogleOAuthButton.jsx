import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const GoogleOAuthButton = ({ onSuccess, onError, buttonText = "Continue with Google" }) => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      
      // Get Google OAuth authorization URL
      const response = await api.get('/api/auth/google');
      
      if (response.data.success) {
        // Open Google OAuth in a popup window
        const popup = window.open(
          response.data.authorizationUrl,
          'google-oauth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        if (!popup) {
          throw new Error('Popup blocked. Please allow popups for this site.');
        }

        // Listen for the popup to close or receive a message
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            setLoading(false);
            // Check if authentication was successful by checking localStorage
            const token = localStorage.getItem('tempGoogleToken');
            if (token) {
              localStorage.removeItem('tempGoogleToken');
              handleAuthSuccess(token);
            } else {
              // Popup closed without success - might be user cancellation
              console.log('Google OAuth popup closed without token');
            }
          }
        }, 1000);

        // Listen for messages from the popup
        const messageListener = (event) => {
          if (event.origin !== window.location.origin) return;
          
          if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
            clearInterval(checkClosed);
            popup.close();
            window.removeEventListener('message', messageListener);
            handleAuthSuccess(event.data.token, event.data.user);
          } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
            clearInterval(checkClosed);
            popup.close();
            window.removeEventListener('message', messageListener);
            setLoading(false);
            if (onError) {
              onError(event.data.error);
            } else {
              alert('Google authentication failed: ' + event.data.error);
            }
          } else if (event.data.type === 'GOOGLE_AUTH_SIGNUP_REQUIRED') {
            clearInterval(checkClosed);
            popup.close();
            window.removeEventListener('message', messageListener);
            setLoading(false);
            // Redirect to signup confirmation page
            window.location.href = `/auth/google/signup?email=${encodeURIComponent(event.data.email)}&name=${encodeURIComponent(event.data.name)}&picture=${encodeURIComponent(event.data.picture || '')}&googleId=${encodeURIComponent(event.data.googleId)}`;
          }
        };

        window.addEventListener('message', messageListener);

        // Cleanup on component unmount or timeout
        setTimeout(() => {
          if (!popup.closed) {
            clearInterval(checkClosed);
            popup.close();
            window.removeEventListener('message', messageListener);
            setLoading(false);
          }
        }, 300000); // 5 minute timeout

      } else {
        throw new Error('Failed to get Google OAuth URL');
      }
      
    } catch (error) {
      console.error('❌ Google OAuth error:', error);
      setLoading(false);
      if (onError) {
        onError(error.response?.data?.message || error.message);
      } else {
        alert('Google authentication failed: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleAuthSuccess = async (token, userData = null) => {
    try {
      setLoading(false);
      
      // Use the login function with Google token and wait for completion
      const result = await login(null, null, token);
      
      if (result.success) {
        if (onSuccess) {
          onSuccess(result.user);
        }
        
        // Use window.location.href for now but add a small delay to ensure state is set
        setTimeout(() => {
          window.location.href = result.redirectPath || '/user/dashboard';
        }, 100);
      } else {
        // Check if user needs to signup
        if (result.needsSignup && result.googleUserInfo) {
          // Redirect to Google signup confirmation
          window.location.href = `/auth/google/signup?email=${encodeURIComponent(result.googleUserInfo.email)}`;
          return;
        }
        
        if (onError) {
          onError(result.message || 'Google authentication failed');
        }
      }
      
    } catch (error) {
      console.error('❌ Auth success handling error:', error);
      setLoading(false);
      if (onError) {
        onError('Failed to complete authentication');
      }
    }
  };

  return (
    <button
      onClick={handleGoogleLogin}
      disabled={loading}
      className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
          Connecting...
        </div>
      ) : (
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {buttonText}
        </div>
      )}
    </button>
  );
};

export default GoogleOAuthButton;