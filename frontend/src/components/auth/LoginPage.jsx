import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import OpenNovaLogo from '../common/OpenNovaLogo';
import GoogleOAuthButton from './GoogleOAuthButton';

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showSuspendedModal, setShowSuspendedModal] = useState(false);
  const [suspendedAccountInfo, setSuspendedAccountInfo] = useState(null);
  // Account locking UI removed for better user experience

  const { login, register, forgotPassword, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      switch (user.role) {
        case 'USER':
          navigate('/user');
          break;
        case 'OWNER':
        case 'HOTEL_OWNER':
        case 'HOSPITAL_OWNER':
        case 'SHOP_OWNER':
          navigate('/owner');
          break;
        case 'ADMIN':
          navigate('/admin');
          break;
        default:
          navigate('/');
      }
    }
  }, [user, navigate]);

  const validatePassword = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!isLogin && !formData.name) {
      newErrors.name = 'Name is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!isLogin && !validatePassword(formData.password)) {
      newErrors.password = 'Password must contain at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character';
    }

    if (!isLogin && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (showForgotPassword) {
      if (!formData.email) {
        setErrors({ email: 'Email is required' });
        return;
      }
      
      setLoading(true);
      const result = await forgotPassword(formData.email);
      setLoading(false);
      
      if (result.success) {
        setMessage(result.message);
        setShowForgotPassword(false);
        setFormData({ ...formData, email: '', password: '' });
      } else {
        setMessage(result.message);
      }
      return;
    }

    if (!validateForm()) return;

    setLoading(true);
    
    if (isLogin) {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        // Navigate to appropriate portal based on user role
        navigate(result.redirectPath || '/user/dashboard');
      } else {
        // Handle suspended/deactivated accounts with special UI
        if (result.isSuspended) {
          // Show suspended account modal
          showSuspendedAccountModal(result);
        } else {
          setMessage(result.message);
          // Check if user needs to signup
          if (result.needsSignup) {
            // Show signup suggestion
            setMessage(result.message + " Click 'Sign Up' below or use Google Sign In.");
          }
        }
      }
    } else {
      const result = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: 'USER'
      });
      
      if (result.success) {
        // Check if the backend returned a token (auto-login)
        if (result.token && result.user) {
          // Auto-login successful - store token and set user
          localStorage.setItem('token', result.token);
          
          // Use the login function to set the user state properly
          const loginResult = await login(null, null, result.token);
          if (loginResult.success) {
            // Navigate to appropriate dashboard
            navigate(loginResult.redirectPath || '/user/dashboard');
            return;
          }
        }
        
        // Fallback to old behavior if no token returned
        setMessage(result.message);
        setIsLogin(true);
        setFormData({ name: '', email: '', password: '', confirmPassword: '' });
      } else {
        setMessage(result.message);
      }
    }
    
    setLoading(false);
  };

  const showSuspendedAccountModal = (result) => {
    setSuspendedAccountInfo({
      message: result.message,
      supportEmail: result.supportEmail || 'support@opennova.com',
      accountStatus: result.accountStatus
    });
    setShowSuspendedModal(true);
  };

  const closeSuspendedModal = () => {
    setShowSuspendedModal(false);
    setSuspendedAccountInfo(null);
    setFormData({ ...formData, password: '' }); // Clear password for security
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3')] bg-cover bg-center opacity-5"></div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full opacity-10 animate-pulse"></div>
      <div className="absolute top-40 right-20 w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full opacity-10 animate-pulse delay-1000"></div>
      <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full opacity-10 animate-pulse delay-2000"></div>
      
      <div className="relative z-10 max-w-lg w-full space-y-8 p-8">
        <div className="glass-effect p-10">
          {/* Logo and Title */}
          <div className="text-center mb-10">
            <div className="flex justify-center mb-6">
              <OpenNovaLogo size={80} />
            </div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-2">OpenNova</h2>
            <p className="text-slate-600 font-semibold text-lg">Premium Booking Platform</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {message && (
              <div className={`p-3 rounded-lg text-sm ${
                message.includes('successful') || message.includes('sent') 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {message}
              </div>
            )}

            {showForgotPassword ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Enter your email"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setMessage('');
                    setErrors({});
                  }}
                  className="w-full btn-outline"
                >
                  Back to Login
                </button>
              </>
            ) : (
              <>
                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="Enter your full name"
                    />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Enter your email"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Enter your password"
                  />
                  {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                </div>

                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="Confirm your password"
                    />
                    {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary disabled:opacity-50"
                >
                  {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
                </button>

                {/* Google OAuth Button */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or</span>
                  </div>
                </div>

                <GoogleOAuthButton
                  buttonText={isLogin ? "Sign in with Google" : "Sign up with Google"}
                  onSuccess={(userData) => {
                    console.log('✅ Google OAuth success:', userData);
                    // Navigation will be handled by the GoogleOAuthButton itself
                  }}
                  onError={(error) => {
                    console.error('❌ Google OAuth error:', error);
                    setMessage('Google authentication failed: ' + error);
                  }}
                />

                {isLogin && (
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="w-full text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Forgot Password?
                  </button>
                )}

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setFormData({ name: '', email: '', password: '', confirmPassword: '' });
                      setErrors({});
                      setMessage('');
                    }}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>

      {/* Suspended Account Modal */}
      {showSuspendedModal && suspendedAccountInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="text-center">
              {/* Warning Icon */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              {/* Title */}
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Account Suspended
              </h3>
              
              {/* Message */}
              <p className="text-gray-600 mb-6 leading-relaxed">
                {suspendedAccountInfo.message}
              </p>
              
              {/* Support Information */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-800 mb-2">Need Help?</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Contact our support team for assistance:
                </p>
                <a 
                  href={`mailto:${suspendedAccountInfo.supportEmail}?subject=Account Suspension - ${formData.email}`}
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {suspendedAccountInfo.supportEmail}
                </a>
              </div>
              
              {/* Close Button */}
              <button
                onClick={closeSuspendedModal}
                className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;