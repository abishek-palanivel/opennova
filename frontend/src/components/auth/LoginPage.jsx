import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import OpenNovaLogo from '../common/OpenNovaLogo';

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
  const [isAccountLocked, setIsAccountLocked] = useState(false);

  const { login, register, forgotPassword, checkAccountStatus, user } = useAuth();
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
        setMessage(result.message);
        if (result.isLocked) {
          setIsAccountLocked(true);
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
        setMessage(result.message);
        setIsLogin(true);
        setFormData({ name: '', email: '', password: '', confirmPassword: '' });
      } else {
        setMessage(result.message);
      }
    }
    
    setLoading(false);
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
                  : isAccountLocked
                  ? 'bg-orange-50 text-orange-700 border border-orange-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {message}
                {isAccountLocked && (
                  <div className="mt-2 text-xs">
                    <strong>Security Notice:</strong> Your account has been temporarily locked for 24 hours due to multiple failed login attempts. This is to protect your account from unauthorized access.
                  </div>
                )}
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
    </div>
  );
};

export default LoginPage;