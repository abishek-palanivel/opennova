import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const GoogleOAuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const user = searchParams.get('user');
    const role = searchParams.get('role');
    const error = searchParams.get('message');
    
    // Check if this is a signup redirect
    const email = searchParams.get('email');
    const name = searchParams.get('name');
    const picture = searchParams.get('picture');
    const googleId = searchParams.get('googleId');

    console.log('GoogleOAuthSuccess params:', { token, user, role, error, email, name, googleId });

    if (error) {
      console.error('Google OAuth error:', error);
      // Send error message to parent window
      if (window.opener) {
        window.opener.postMessage({
          type: 'GOOGLE_AUTH_ERROR',
          error: error
        }, window.location.origin);
      }
      window.close();
      return;
    }

    // Handle signup redirect case
    if (email && name && googleId && !token) {
      console.log('Signup redirect detected, notifying parent window');
      // This is a signup redirect - notify parent window
      if (window.opener) {
        window.opener.postMessage({
          type: 'GOOGLE_AUTH_SIGNUP_REQUIRED',
          email: email,
          name: name,
          picture: picture || '',
          googleId: googleId
        }, window.location.origin);
        window.close();
      } else {
        // Direct navigation to signup page
        navigate(`/auth/google/signup?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&picture=${encodeURIComponent(picture || '')}&googleId=${encodeURIComponent(googleId)}`);
      }
      return;
    }

    if (token && user && role) {
      console.log('Login success detected, notifying parent window');
      // Store token temporarily for the main window to pick up
      localStorage.setItem('tempGoogleToken', token);
      
      // Send success message to parent window
      if (window.opener) {
        window.opener.postMessage({
          type: 'GOOGLE_AUTH_SUCCESS',
          token: token,
          user: {
            name: user,
            role: role
          }
        }, window.location.origin);
      }
      
      // Close the popup window
      window.close();
    } else {
      console.log('No valid parameters found, redirecting to login');
      // Redirect to login page if no token and not a signup case
      if (window.opener) {
        window.close();
      } else {
        navigate('/login');
      }
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Completing Google Authentication
        </h2>
        <p className="text-gray-600">
          Please wait while we complete your login...
        </p>
      </div>
    </div>
  );
};

export default GoogleOAuthSuccess;