import { useState } from 'react';
import api from '../../utils/api';

const AddEstablishmentRequest = () => {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phoneNumber: '',
    password: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});

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

    if (!formData.name.trim()) {
      newErrors.name = 'Establishment name is required';
    }

    if (!formData.type) {
      newErrors.type = 'Please select establishment type';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = 'Pincode must be 6 digits';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Phone number must be 10 digits';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required for your establishment account';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setMessage('');

    try {
      // Ensure all required fields are properly trimmed and not empty
      const requestData = {
        name: formData.name.trim(),
        type: formData.type.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        password: formData.password.trim(),
        notes: formData.notes.trim()
      };
      
      console.log('Submitting establishment request:', requestData);
      const response = await api.post(`/api/user/establishment-requests`, requestData);
      console.log('Request submitted successfully:', response.data);
      
      setMessage('Request submitted successfully! Admin will review and process your request.');
      setFormData({
        name: '',
        type: '',
        email: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        phoneNumber: '',
        password: '',
        notes: ''
      });
    } catch (error) {
      console.error('Failed to submit request:', error);
      console.error('Error details:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        data: error.response?.data
      });
      
      let errorMessage = 'Failed to submit request. Please try again.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Please log in to submit establishment requests.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.message || 'Please check all required fields and try again.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-fade-in-up">
        {/* Enhanced Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Add Establishment Request ➕
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 font-medium max-w-3xl mx-auto leading-relaxed">
            Help us grow our platform by suggesting new establishments in your area
          </p>
          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 text-slate-500 text-sm sm:text-base">
            <span className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              Quick & Easy Process
            </span>
            <span className="hidden sm:inline">•</span>
            <span>2-3 Business Days Review</span>
          </div>
        </div>

        {/* Enhanced Form */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl border border-white/60 p-6 sm:p-8 lg:p-12 relative overflow-hidden">
          {/* Background Decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
          
            <div className="relative z-10">
              <div className="text-center mb-8 sm:mb-10">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 sm:mb-4">Establishment Details</h2>
                <p className="text-slate-600 text-sm sm:text-base">Please provide accurate information for faster processing</p>
              </div>
            
              <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                {message && (
                  <div className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg border-2 ${
                    message.includes('successfully') 
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border-green-200' 
                      : 'bg-gradient-to-r from-red-50 to-pink-50 text-red-800 border-red-200'
                  }`}>
                    <div className="flex items-center">
                      <span className="text-xl sm:text-2xl mr-2 sm:mr-3">
                        {message.includes('successfully') ? '✅' : '❌'}
                      </span>
                      <span className="font-semibold text-sm sm:text-base">{message}</span>
                    </div>
                  </div>
                )}

                <div className="group">
                  <label className="block text-base sm:text-lg font-bold text-slate-700 mb-2 sm:mb-3 flex items-center">
                    <span className="mr-2">🏢</span>
                    Establishment Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 sm:px-6 py-3 sm:py-4 border-2 border-slate-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm focus:bg-white hover:border-slate-300 placeholder:text-slate-400 text-base sm:text-lg group-hover:border-slate-300"
                    placeholder="Enter establishment name (e.g., Grand Hotel, City Hospital)"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs sm:text-sm mt-2 flex items-center">
                      <span className="mr-1">⚠️</span>
                      {errors.name}
                    </p>
                  )}
                </div>

            <div className="group">
              <label className="block text-lg font-bold text-slate-700 mb-3 flex items-center">
                <span className="mr-2">🏷️</span>
                Establishment Type *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-6 py-4 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm focus:bg-white hover:border-slate-300 text-lg group-hover:border-slate-300"
              >
                <option value="">Select establishment type</option>
                <option value="HOTEL">🏨 Hotel (Accommodation & Dining)</option>
                <option value="HOSPITAL">🏥 Hospital (Healthcare Services)</option>
                <option value="SHOP">🛍️ Shop (Clothing & Fashion)</option>
              </select>
              {errors.type && (
                <p className="text-red-500 text-sm mt-2 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {errors.type}
                </p>
              )}
            </div>

            <div className="group">
              <label className="block text-lg font-bold text-slate-700 mb-3 flex items-center">
                <span className="mr-2">📧</span>
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-6 py-4 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm focus:bg-white hover:border-slate-300 placeholder:text-slate-400 text-lg group-hover:border-slate-300"
                placeholder="Enter contact email (e.g., contact@establishment.com)"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-2 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {errors.email}
                </p>
              )}
            </div>

            <div className="group">
              <label className="block text-lg font-bold text-slate-700 mb-3 flex items-center">
                <span className="mr-2">📍</span>
                Address *
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-6 py-4 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm focus:bg-white hover:border-slate-300 placeholder:text-slate-400 text-lg group-hover:border-slate-300 resize-none"
                placeholder="Street address, building name, etc."
              />
              {errors.address && (
                <p className="text-red-500 text-sm mt-2 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {errors.address}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="group">
                <label className="block text-lg font-bold text-slate-700 mb-3 flex items-center">
                  <span className="mr-2">🏙️</span>
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-6 py-4 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm focus:bg-white hover:border-slate-300 placeholder:text-slate-400 text-lg group-hover:border-slate-300"
                  placeholder="Enter city"
                />
                {errors.city && (
                  <p className="text-red-500 text-sm mt-2 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {errors.city}
                  </p>
                )}
              </div>

              <div className="group">
                <label className="block text-lg font-bold text-slate-700 mb-3 flex items-center">
                  <span className="mr-2">🗺️</span>
                  State *
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full px-6 py-4 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm focus:bg-white hover:border-slate-300 placeholder:text-slate-400 text-lg group-hover:border-slate-300"
                  placeholder="Enter state"
                />
                {errors.state && (
                  <p className="text-red-500 text-sm mt-2 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {errors.state}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="group">
                <label className="block text-lg font-bold text-slate-700 mb-3 flex items-center">
                  <span className="mr-2">📮</span>
                  Pincode *
                </label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  maxLength={6}
                  className="w-full px-6 py-4 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm focus:bg-white hover:border-slate-300 placeholder:text-slate-400 text-lg group-hover:border-slate-300"
                  placeholder="6-digit pincode"
                />
                {errors.pincode && (
                  <p className="text-red-500 text-sm mt-2 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {errors.pincode}
                  </p>
                )}
              </div>

              <div className="group">
                <label className="block text-lg font-bold text-slate-700 mb-3 flex items-center">
                  <span className="mr-2">📞</span>
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  maxLength={10}
                  className="w-full px-6 py-4 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm focus:bg-white hover:border-slate-300 placeholder:text-slate-400 text-lg group-hover:border-slate-300"
                  placeholder="10-digit phone number"
                />
                {errors.phoneNumber && (
                  <p className="text-red-500 text-sm mt-2 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {errors.phoneNumber}
                  </p>
                )}
              </div>
            </div>

            <div className="group">
              <label className="block text-lg font-bold text-slate-700 mb-3 flex items-center">
                <span className="mr-2">🔐</span>
                Owner Account Password *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-6 py-4 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm focus:bg-white hover:border-slate-300 placeholder:text-slate-400 text-lg group-hover:border-slate-300"
                placeholder="Create a password for your establishment account (min 6 characters)"
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-2 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {errors.password}
                </p>
              )}
              <p className="text-slate-500 text-sm mt-2 flex items-center">
                <span className="mr-1">💡</span>
                This password will be used to access your establishment owner portal after approval
              </p>
            </div>

            <div className="group">
              <label className="block text-lg font-bold text-slate-700 mb-3 flex items-center">
                <span className="mr-2">📝</span>
                Additional Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-6 py-4 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm focus:bg-white hover:border-slate-300 placeholder:text-slate-400 text-lg group-hover:border-slate-300 resize-none"
                placeholder="Any additional information about the establishment (services, specialties, etc.)"
              />
            </div>

            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-8 rounded-2xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></span>
                    Submitting...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <span className="mr-2">🚀</span>
                    Submit Request
                  </span>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    name: '',
                    type: '',
                    email: '',
                    address: '',
                    city: '',
                    state: '',
                    pincode: '',
                    phoneNumber: '',
                    password: '',
                    notes: ''
                  });
                  setErrors({});
                  setMessage('');
                }}
                className="flex-1 bg-gradient-to-r from-slate-500 to-slate-600 text-white py-4 px-8 rounded-2xl font-bold text-lg hover:from-slate-600 hover:to-slate-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <span className="flex items-center justify-center">
                  <span className="mr-2">🔄</span>
                  Clear Form
                </span>
              </button>
            </div>
              </form>
            </div>
          </div>

          {/* Enhanced Information Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl sm:rounded-3xl shadow-xl border border-blue-200 p-6 sm:p-8 mt-6 sm:mt-8">
          <h3 className="text-2xl font-bold text-blue-900 mb-6 flex items-center">
            <span className="mr-3">📋</span>
            Request Process & Timeline
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-blue-800 mb-3">📝 Review Process</h4>
              <ul className="text-blue-700 space-y-2">
                <li className="flex items-start">
                  <span className="mr-2 mt-1">•</span>
                  Admin team reviews your request within 24 hours
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-1">•</span>
                  We verify establishment details and contact information
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-1">•</span>
                  Background check and legitimacy verification
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-blue-800 mb-3">⏰ Timeline & Updates</h4>
              <ul className="text-blue-700 space-y-2">
                <li className="flex items-start">
                  <span className="mr-2 mt-1">•</span>
                  Complete process takes 2-3 business days
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-1">•</span>
                  Email notifications at each stage
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-1">•</span>
                  Establishment goes live after approval
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-100 rounded-2xl border border-blue-300">
            <p className="text-blue-800 font-semibold flex items-center">
              <span className="mr-2">💡</span>
              Pro Tip: Provide accurate and complete information to speed up the approval process!
            </p>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddEstablishmentRequest;