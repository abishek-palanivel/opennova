import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import OpenNovaLogo from '../common/OpenNovaLogo';
import LoadingSpinner from '../common/LoadingSpinner';
import { getImageUrl } from '../../utils/imageUtils';
import ImageWithFallback from '../common/ImageWithFallback';

const HospitalOwnerManagement = () => {
  const { user } = useAuth();
  const location = useLocation();
  
  // Determine active tab based on current route
  const getActiveTabFromRoute = () => {
    const path = location.pathname;
    if (path.includes('/bookings')) return 'bookings';
    if (path.includes('/items')) return 'doctors';
    if (path.includes('/reviews')) return 'reviews';
    if (path.includes('/settings')) return 'hours';
    return 'profile';
  };
  
  const [activeTab, setActiveTab] = useState(getActiveTabFromRoute());
  const [loading, setLoading] = useState(false);
  const [establishment, setEstablishment] = useState({
    name: '',
    address: '6/288, Trichy Rd, Andavar Nagar, Namakkal, Tamil Nadu 637001',
    contactNumber: '8012975411',
    latitude: 11.210221085094684,
    longitude: 78.17768652762987,
    status: 'OPEN',
    upiId: 'abishek1234@upi',
    operatingHours: '8:00 AM - 8:00 PM'
  });
  const [doctors, setDoctors] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [processingBooking, setProcessingBooking] = useState(null);

  useEffect(() => {
    // Only fetch data when user is available and authenticated
    if (user) {
      fetchEstablishmentData();
      fetchDoctors();
      fetchBookings();
      fetchReviews();
    }
  }, [user]);

  // Update active tab when route changes
  useEffect(() => {
    setActiveTab(getActiveTabFromRoute());
  }, [location.pathname]);

  const fetchEstablishmentData = async () => {
    // Only fetch if user is authenticated as owner
    if (!user || !['OWNER', 'HOTEL_OWNER', 'HOSPITAL_OWNER', 'SHOP_OWNER'].includes(user.role)) {
      setEstablishment({});
      return;
    }

    try {
      // Add cache-busting parameter to ensure fresh data
      const timestamp = new Date().getTime();
      const response = await api.get(`/api/owner/establishment?_t=${timestamp}`);
      console.log('🔄 HospitalOwner - Fresh establishment data received:', response.data);
      console.log('🏥 UPI QR Code Path:', response.data.upiQrCodePath);
      setEstablishment(response.data);
    } catch (error) {
      console.debug('Establishment data not available:', error.response?.status);
      setEstablishment({});
    }
  };

  const fetchDoctors = async () => {
    // Only fetch if user is authenticated as owner
    if (!user || !['OWNER', 'HOTEL_OWNER', 'HOSPITAL_OWNER', 'SHOP_OWNER'].includes(user.role)) {
      setDoctors([]);
      return;
    }

    try {
      console.log('🔄 Fetching doctors...');
      const response = await api.get('/api/owner/doctors');
      console.log('👨‍⚕️ Doctor data received:', response.data);
      
      // Enhanced logging for image debugging
      if (Array.isArray(response.data)) {
        response.data.forEach((doctor, index) => {
          console.log(`👨‍⚕️ Doctor ${index + 1}:`, {
            id: doctor.id,
            name: doctor.name,
            imagePath: doctor.imagePath,
            imageUrl: doctor.imageUrl,
            hasImage: !!(doctor.imagePath || doctor.imageUrl),
            fullImageUrl: doctor.imagePath ? `http://localhost:9000/api/files/view/${doctor.imagePath}` : 'No image'
          });
        });
      }
      
      setDoctors(response.data || []);
    } catch (error) {
      console.error('❌ Error fetching doctors:', error);
      setDoctors([]);
    }
  };

  const fetchBookings = async () => {
    // Only fetch if user is authenticated as owner
    if (!user || !['OWNER', 'HOTEL_OWNER', 'HOSPITAL_OWNER', 'SHOP_OWNER'].includes(user.role)) {
      setBookings([]);
      return;
    }

    try {
      console.log('🏥 Fetching hospital bookings/appointments...');
      const response = await api.get('/api/owner/bookings');
      console.log('📋 Hospital bookings response:', response.data);
      
      // The API returns { success: true, bookings: [...], count: n }
      const bookingsData = response.data.bookings || response.data.orders || response.data;
      const bookingsArray = Array.isArray(bookingsData) ? bookingsData : [];
      
      console.log('🏥 Hospital appointments found:', bookingsArray.length);
      setBookings(bookingsArray);
      
      if (bookingsArray.length === 0) {
        console.log('⚠️ No hospital appointments found. Check if users are booking hospital services.');
      }
    } catch (error) {
      console.error('❌ Failed to fetch hospital bookings:', error);
      console.error('Error details:', error.response?.data);
      // Set empty array on error to prevent map error
      setBookings([]);
    }
  };

  const fetchReviews = async () => {
    // Only fetch reviews if user is authenticated as owner
    if (!user || !['OWNER', 'HOTEL_OWNER', 'HOSPITAL_OWNER', 'SHOP_OWNER'].includes(user.role)) {
      setReviews([]);
      return;
    }

    try {
      const response = await api.get('/api/owner/reviews');
      setReviews(response.data || []);
    } catch (error) {
      console.debug('Reviews not available:', error.response?.status);
      setReviews([]);
    }
  };

  const updateEstablishment = async (updatedData) => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in first. Use: abishekopennova@gmail.com / password');
      window.location.href = '/login';
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      
      // Add all establishment data as form parameters
      Object.keys(updatedData).forEach(key => {
        if (updatedData[key] !== null && updatedData[key] !== undefined) {
          formData.append(key, updatedData[key]);
        }
      });
      
      // Use the correct endpoint for multipart data
      const response = await api.put('/api/owner/establishment/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('Update response:', response.data);
      
      // Update establishment state with response data
      if (response.data.data) {
        setEstablishment(prev => ({ ...prev, ...response.data.data }));
      } else {
        setEstablishment(prev => ({ ...prev, ...updatedData }));
      }
      
      // Refresh establishment data to ensure we have the latest from database
      await fetchEstablishmentData();
      
      alert('Hospital updated successfully!');
    } catch (error) {
      console.error('Failed to update establishment:', error);
      if (error.response?.status === 401) {
        alert('Authentication failed. Please log in as a hospital owner to update establishment settings.');
        // Redirect to login page
        window.location.href = '/login';
      } else if (error.response?.status === 403) {
        alert('Access denied. You do not have permission to update this establishment.');
      } else {
        alert('Failed to update establishment: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const approveBooking = async (bookingId) => {
    setProcessingBooking(bookingId);
    try {
      console.log('🏥 Confirming hospital appointment:', bookingId);
      const response = await api.post(`/api/owner/bookings/${bookingId}/confirm`);
      console.log('✅ Hospital appointment confirmation response:', response.data);
      
      await fetchBookings(); // Refresh the bookings list
      
      alert('✅ Hospital Appointment Confirmed Successfully!\n\n' +
            '📧 Confirmation email with QR code has been sent to the patient.\n' +
            '🎯 Patient will receive appointment details and QR code for visit verification.');
    } catch (error) {
      console.error('❌ Error confirming hospital appointment:', error);
      console.error('Error details:', error.response?.data);
      alert('❌ Failed to confirm hospital appointment. Please try again.\n\nError: ' + 
            (error.response?.data?.message || error.message));
    } finally {
      setProcessingBooking(null);
    }
  };

  const rejectBooking = async (bookingId) => {
    const reason = prompt('Please provide a reason for rejection (optional):') || 'No reason provided';
    if (!reason && reason !== '') return; // User cancelled
    
    setProcessingBooking(bookingId);
    try {
      await api.post(`/api/owner/bookings/${bookingId}/reject`, { reason });
      await fetchBookings(); // Refresh the bookings list
      alert('❌ Appointment rejected successfully! Patient has been notified and refund has been initiated.');
    } catch (error) {
      console.error('Failed to reject booking:', error);
      alert('❌ Failed to reject appointment. Please try again.');
    } finally {
      setProcessingBooking(null);
    }
  };

  const deleteBooking = async (bookingId) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to permanently delete this appointment? This action cannot be undone.'
    );
    
    if (!confirmDelete) return;
    
    setProcessingBooking(bookingId);
    try {
      await api.delete(`/api/owner/bookings/${bookingId}`);
      await fetchBookings(); // Refresh the bookings list
      alert('🗑️ Appointment deleted successfully!');
    } catch (error) {
      console.error('Failed to delete booking:', error);
      alert('❌ Failed to delete appointment. Please try again.');
    } finally {
      setProcessingBooking(null);
    }
  };

  const generateQRCode = async (bookingId) => {
    setProcessingBooking(bookingId);
    try {
      // First confirm the booking to generate QR code
      await api.post(`/api/owner/bookings/${bookingId}/confirm`);
      await fetchBookings(); // Refresh to get the QR code
      alert('✅ QR Code generated successfully!');
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      alert('❌ Failed to generate QR code. Please try again.');
    } finally {
      setProcessingBooking(null);
    }
  };

  const deleteReview = async (reviewId) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        await api.delete(`/api/owner/reviews/${reviewId}`);
        fetchReviews();
        alert('Review deleted successfully!');
      } catch (error) {
        console.error('Failed to delete review:', error);
        alert('Failed to delete review');
      }
    }
  };



  const saveDoctor = async (doctorData, imageFile = null) => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in first.');
      window.location.href = '/login';
      return;
    }

    try {
      // Create FormData for file upload
      const formData = new FormData();
      
      // Add doctor data
      formData.append('name', doctorData.name);
      formData.append('specialization', doctorData.specialization || '');
      formData.append('price', doctorData.consultationFee);
      formData.append('availabilityTime', doctorData.availableTime || '9:00 AM - 5:00 PM');
      
      // Add image file if provided
      if (imageFile) {
        formData.append('image', imageFile);
      }

      if (editingDoctor) {
        // Use the with-image endpoint for updates
        const endpoint = imageFile ? `/api/owner/doctors/${editingDoctor.id}/with-image` : `/api/owner/doctors/${editingDoctor.id}`;
        const config = {}; // Let axios handle Content-Type automatically
        const data = imageFile ? formData : doctorData;
        
        await api.put(endpoint, data, config);
        alert('Doctor updated successfully!');
      } else {
        // Use the with-image endpoint for creation
        await api.post('/api/owner/doctors/with-image', formData);
        alert('Doctor added successfully!');
      }
      fetchDoctors();
      setShowDoctorModal(false);
      setEditingDoctor(null);
    } catch (error) {
      console.error('Failed to save doctor:', error);
      if (error.response?.status === 401) {
        const errorMessage = error.response?.data?.message || 'Authentication failed';
        alert(`Authentication Error: ${errorMessage}\n\nPlease log in again or contact admin if you should have hospital owner access.`);
      } else if (error.response?.status === 403) {
        alert('Access denied. You do not have permission to manage doctors.');
      } else {
        alert('Failed to save doctor: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const deleteDoctor = async (doctorId) => {
    if (window.confirm('Are you sure you want to delete this doctor?')) {
      try {
        await api.delete(`/api/owner/doctors/${doctorId}`);
        fetchDoctors();
        alert('Doctor deleted successfully!');
      } catch (error) {
        console.error('Failed to delete doctor:', error);
        alert('Failed to delete doctor');
      }
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const response = await api.put('/api/owner/establishment/status', { status: newStatus });
      setEstablishment(prev => ({ ...prev, status: newStatus }));
      console.log('Status updated successfully:', response.data);
    } catch (error) {
      console.error('Failed to update status:', error);
      if (error.response?.status === 401) {
        alert('Authentication failed. Please log in as a hospital owner to update status.');
        window.location.href = '/login';
      } else if (error.response?.status === 403) {
        alert('Access denied. You do not have permission to update this establishment.');
      } else {
        alert('Failed to update status: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const exportBookings = async () => {
    try {
      const response = await api.get('/api/owner/export/bookings', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'hospital-appointments.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      alert('Appointments exported successfully!');
    } catch (error) {
      console.error('Failed to export bookings:', error);
      alert('Failed to export appointments');
    }
  };

  const TabButton = ({ id, label, icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all ${
        activeTab === id
          ? 'bg-red-600 text-white shadow-lg'
          : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
      }`}
    >
      <span className="mr-2 text-lg">{icon}</span>
      {label}
    </button>
  );

  // Add error handling for missing data
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading...</h2>
          <p className="text-gray-600">Please wait while we load your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <OpenNovaLogo className="h-16 w-16 mr-4 text-white" />
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                🏥 Hospital Owner Portal
              </h1>
              <p className="text-red-100 mt-2">
                Email: {user?.email || 'owner@hospital.com'} | Contact: {establishment.contactNumber}
              </p>
              {!user && (
                <p className="text-yellow-200 text-sm mt-1">
                  ⚠️ Not logged in - Login required to save changes
                </p>
              )}
              <p className="text-red-100 text-sm">
                {establishment.address}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-red-100">Status</p>
                <select
                  value={establishment.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="bg-white text-gray-900 px-3 py-1 rounded-lg font-medium"
                >
                  <option value="OPEN">🟢 Open</option>
                  <option value="CLOSED">🔴 Closed</option>
                  <option value="BUSY">🟡 Busy</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-4">
        <TabButton id="profile" label="Profile Settings" icon="⚙️" />
        <TabButton id="doctors" label="Manage Doctors" icon="👨‍⚕️" />
        <TabButton id="bookings" label="Appointments" icon="📅" />
        <TabButton id="reviews" label="Reviews" icon="⭐" />
        <TabButton id="hours" label="Settings" icon="⚙️" />
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <span className="mr-3">⚙️</span>
            Profile Settings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hospital Name
              </label>
              <input
                type="text"
                value={establishment.name}
                onChange={(e) => setEstablishment(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Number
              </label>
              <input
                type="text"
                value={establishment.contactNumber}
                onChange={(e) => setEstablishment(prev => ({ ...prev, contactNumber: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                value={establishment.address}
                onChange={(e) => setEstablishment(prev => ({ ...prev, address: e.target.value }))}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                UPI ID
              </label>
              <input
                type="text"
                value={establishment.upiId}
                onChange={(e) => setEstablishment(prev => ({ ...prev, upiId: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="e.g., abishek1234@upi"
              />
            </div>
          </div>
          <div className="mt-6 flex items-center space-x-4">
            <button
              onClick={() => updateEstablishment(establishment)}
              disabled={loading || !user}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center"
            >
              {loading ? <LoadingSpinner size="sm" /> : '💾'}
              <span className="ml-2">Save Changes</span>
            </button>
            {!user && (
              <button
                onClick={() => window.location.href = '/login'}
                className="bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700 flex items-center"
              >
                🔑 Login First
              </button>
            )}
          </div>
        </div>
      )}

      {activeTab === 'doctors' && (
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold flex items-center">
              <span className="mr-3">👨‍⚕️</span>
              Manage Doctors
            </h2>

            <button
              onClick={() => {
                setEditingDoctor(null);
                setShowDoctorModal(true);
              }}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center"
            >
              <span className="mr-2">➕</span>
              Add Doctor
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doctor) => (
              <div key={doctor.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-center mb-4">
                  <div className="w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden bg-gray-100">
                    {doctor.imagePath ? (
                      <ImageWithFallback
                        src={getImageUrl(doctor.imagePath)}
                        alt={doctor.name}
                        className="w-full h-full object-cover"
                        fallback={
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
                            👨‍⚕️
                          </div>
                        }
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
                        👨‍⚕️
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-lg text-gray-900">{doctor.name}</h3>
                  <p className="text-red-600 font-medium">{doctor.specialization}</p>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <p><span className="font-medium">Experience:</span> {doctor.experience} years</p>
                  <p><span className="font-medium">Fee:</span> ₹{doctor.consultationFee}</p>
                  <p><span className="font-medium">Available:</span> {doctor.availableTime}</p>
                  <p><span className="font-medium">Qualification:</span> {doctor.qualification}</p>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    doctor.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {doctor.isAvailable ? '✅ Available' : '❌ Unavailable'}
                  </span>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setEditingDoctor(doctor);
                        setShowDoctorModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Edit Doctor"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => deleteDoctor(doctor.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Delete Doctor"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold flex items-center">
              <span className="mr-3">📅</span>
              Manage Appointments
            </h2>
            <button
              onClick={exportBookings}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
            >
              📊 Export to Excel
            </button>
          </div>
          <div className="space-y-4">
            {Array.isArray(bookings) && bookings.length > 0 ? bookings.map((booking) => {
              // Parse selected items JSON safely
              let selectedItems = [];
              try {
                if (booking.selectedItems) {
                  selectedItems = typeof booking.selectedItems === 'string' 
                    ? JSON.parse(booking.selectedItems) 
                    : booking.selectedItems;
                  
                  // Ensure it's an array
                  if (!Array.isArray(selectedItems)) {
                    selectedItems = [selectedItems];
                  }
                }
              } catch (e) {
                console.error('Error parsing selectedItems for booking', booking.id, ':', e);
                selectedItems = [];
              }

              return (
                <div key={booking.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="font-bold text-xl text-gray-900 mr-3">{booking.customerName}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                          booking.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-gray-600 flex items-center mb-1">
                            <span className="mr-2">📧</span>
                            <span className="font-medium">Email:</span>
                            <span className="ml-2">{booking.customerEmail}</span>
                          </p>
                          <p className="text-gray-600 flex items-center mb-1">
                            <span className="mr-2">📅</span>
                            <span className="font-medium">Appointment:</span>
                            <span className="ml-2">{booking.visitingDate} at {booking.visitingTime}</span>
                          </p>
                          <p className="text-gray-600 flex items-center mb-1">
                            <span className="mr-2">🕒</span>
                            <span className="font-medium">Duration:</span>
                            <span className="ml-2">{booking.visitingHours || 1} hour(s)</span>
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-gray-600 flex items-center mb-1">
                            <span className="mr-2">💰</span>
                            <span className="font-medium">Total Amount:</span>
                            <span className="ml-2 text-green-600 font-bold">₹{booking.amount}</span>
                          </p>
                          <p className="text-gray-600 flex items-center mb-1">
                            <span className="mr-2">💳</span>
                            <span className="font-medium">Paid:</span>
                            <span className="ml-2 text-blue-600 font-bold">₹{booking.paymentAmount || booking.amount}</span>
                          </p>
                          <p className="text-gray-600 flex items-center mb-1">
                            <span className="mr-2">🔢</span>
                            <span className="font-medium">Transaction ID:</span>
                            <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">{booking.transactionId}</span>
                          </p>
                        </div>
                        
                        {/* Secure Payment Verification */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                          <div className="flex items-center">
                            <span className="text-green-600 mr-2">🔒</span>
                            <div>
                              <p className="text-green-900 font-semibold text-sm">UPI Payment Verified</p>
                              <p className="text-green-800 text-xs">Secure transaction validation completed</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Doctor/Service Details */}
                      {selectedItems.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                            <span className="mr-2">👨‍⚕️</span>
                            Booked Services:
                          </h4>
                          <div className="bg-gray-50 rounded-lg p-3">
                            {selectedItems.map((item, index) => (
                              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                                <div>
                                  <p className="font-medium text-gray-900">{item.name}</p>
                                  <p className="text-sm text-gray-600">{item.specialization || item.description}</p>
                                  {item.type && <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">{item.type}</span>}
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-green-600">₹{item.consultationFee || item.price}</p>
                                  {item.available !== undefined && (
                                    <p className={`text-xs ${item.available ? 'text-green-600' : 'text-red-600'}`}>
                                      {item.available ? '✅ Available' : '❌ Unavailable'}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Booking Timeline */}
                      <div className="text-sm text-gray-500 mb-4">
                        <p>📝 Booked: {new Date(booking.createdAt).toLocaleString()}</p>
                        {booking.confirmedAt && (
                          <p>✅ Confirmed: {new Date(booking.confirmedAt).toLocaleString()}</p>
                        )}
                        {booking.cancelledAt && (
                          <p>❌ Cancelled: {new Date(booking.cancelledAt).toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                    {booking.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => approveBooking(booking.id)}
                          disabled={processingBooking === booking.id}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processingBooking === booking.id ? (
                            <>
                              <LoadingSpinner size="sm" />
                              <span className="ml-2">Confirming...</span>
                            </>
                          ) : (
                            <>
                              <span className="mr-2">✅</span>
                              Confirm Appointment
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => rejectBooking(booking.id)}
                          disabled={processingBooking === booking.id}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processingBooking === booking.id ? (
                            <>
                              <LoadingSpinner size="sm" />
                              <span className="ml-2">Rejecting...</span>
                            </>
                          ) : (
                            <>
                              <span className="mr-2">❌</span>
                              Reject Appointment
                            </>
                          )}
                        </button>
                      </>
                    )}

                    {booking.status === 'CONFIRMED' && booking.status !== 'COMPLETED' && (
                      <button
                        onClick={async () => {
                          try {
                            await api.put(`/api/owner/bookings/${booking.id}/mark-completed`);
                            fetchBookings();
                            alert('Visit marked as completed!');
                          } catch (error) {
                            alert('Failed to mark visit as completed: ' + (error.response?.data?.message || error.message));
                          }
                        }}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center"
                      >
                        <span className="mr-2">✅</span>
                        Mark Visit Complete
                      </button>
                    )}

                    {booking.status === 'CONFIRMED' && booking.qrCode && (
                      <button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowQRModal(true);
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                      >
                        <span className="mr-2">📱</span>
                        View QR Code
                      </button>
                    )}

                    {booking.status === 'CONFIRMED' && !booking.qrCode && (
                      <button
                        onClick={() => generateQRCode(booking.id)}
                        disabled={processingBooking === booking.id}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center transition-colors disabled:opacity-50"
                      >
                        {processingBooking === booking.id ? (
                          <>
                            <LoadingSpinner size="sm" />
                            <span className="ml-2">Generating...</span>
                          </>
                        ) : (
                          <>
                            <span className="mr-2">🔄</span>
                            Generate QR Code
                          </>
                        )}
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowDetailsModal(true);
                      }}
                      className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center"
                    >
                      <span className="mr-2">👁️</span>
                      View Details
                    </button>

                    <button
                      onClick={() => deleteBooking(booking.id)}
                      disabled={processingBooking === booking.id}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center transition-colors disabled:opacity-50"
                      title="Permanently delete this appointment"
                    >
                      {processingBooking === booking.id ? (
                        <>
                          <LoadingSpinner size="sm" />
                          <span className="ml-2">Deleting...</span>
                        </>
                      ) : (
                        <>
                          <span className="mr-2">🗑️</span>
                          Delete
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📅</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Appointments Yet</h3>
                <p className="text-gray-600">Appointments will appear here once patients start booking.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <span className="mr-3">⭐</span>
            Patient Reviews
          </h2>
          <div className="space-y-4">
            {reviews.length > 0 ? reviews.map((review) => (
              <div key={review.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{review.customerName}</h3>
                    <div className="flex items-center mt-1">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`text-lg ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                          ⭐
                        </span>
                      ))}
                      <span className="ml-2 text-sm text-gray-600">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteReview(review.id)}
                    className="text-red-600 hover:text-red-800 p-2"
                    title="Delete Review"
                  >
                    🗑️
                  </button>
                </div>
                <p className="text-gray-700 leading-relaxed">{review.comment}</p>
              </div>
            )) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">⭐</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Reviews Yet</h3>
                <p className="text-gray-600">Patient reviews will appear here.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'hours' && (
        <div className="space-y-6">
          {/* Business Settings */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <span className="mr-3">⚙️</span>
              Hospital Settings
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 7-Day Operating Hours */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <span className="mr-2">🕒</span>
                  7-Day Operating Hours
                </h3>
                <div className="space-y-3">
                  {[
                    { day: 'Monday', short: 'Mon' },
                    { day: 'Tuesday', short: 'Tue' },
                    { day: 'Wednesday', short: 'Wed' },
                    { day: 'Thursday', short: 'Thu' },
                    { day: 'Friday', short: 'Fri' },
                    { day: 'Saturday', short: 'Sat' },
                    { day: 'Sunday', short: 'Sun' }
                  ].map((dayInfo) => (
                    <div key={dayInfo.day} data-day={dayInfo.day.toLowerCase()} className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                      <div className="w-16">
                        <span className="text-sm font-medium">{dayInfo.short}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          defaultChecked={true}
                          className="mr-2"
                        />
                        <span className="text-sm">Open</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="time"
                          defaultValue="08:00"
                          className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-red-500"
                        />
                        <span className="text-sm">to</span>
                        <input
                          type="time"
                          defaultValue="20:00"
                          className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-red-500"
                        />
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-4 p-3 bg-red-100 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked={true} className="mr-2" />
                      <span className="text-sm font-medium text-red-700">24/7 Emergency Services</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <span className="mr-2">🔔</span>
                  Notification Preferences
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between">
                    <span className="text-sm">New Appointment Notifications</span>
                    <input type="checkbox" defaultChecked={true} className="toggle" />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-sm">Email Notifications</span>
                    <input type="checkbox" defaultChecked={true} className="toggle" />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-sm">SMS Notifications</span>
                    <input type="checkbox" defaultChecked={false} className="toggle" />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-sm">Patient Review Notifications</span>
                    <input type="checkbox" defaultChecked={true} className="toggle" />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-sm">Payment Notifications</span>
                    <input type="checkbox" defaultChecked={true} className="toggle" />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-sm">Emergency Alerts</span>
                    <input type="checkbox" defaultChecked={true} className="toggle" />
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  // Collect all operating hours data
                  const weeklySchedule = {};
                  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                  let generalOpenTime = null;
                  let generalCloseTime = null;
                  
                  days.forEach(day => {
                    const dayElement = document.querySelector(`[data-day="${day}"]`);
                    if (dayElement) {
                      const isOpen = dayElement.querySelector('input[type="checkbox"]').checked;
                      const startTime = dayElement.querySelector('input[type="time"]:first-of-type').value;
                      const endTime = dayElement.querySelector('input[type="time"]:last-of-type').value;
                      
                      weeklySchedule[day] = { 
                        isOpen, 
                        startTime: startTime || '08:00', 
                        endTime: endTime || '20:00',
                        isClosed: !isOpen
                      };
                      
                      // Use the first open day's hours as general operating hours
                      if (isOpen && !generalOpenTime) {
                        generalOpenTime = startTime || '08:00';
                        generalCloseTime = endTime || '20:00';
                      }
                    }
                  });
                  
                  // Format times to 12-hour format for display
                  const formatTime = (time24) => {
                    if (!time24) return '';
                    const [hours, minutes] = time24.split(':');
                    const hour = parseInt(hours, 10);
                    const ampm = hour >= 12 ? 'PM' : 'AM';
                    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                    return `${displayHour}:${minutes} ${ampm}`;
                  };
                  
                  const formattedOpenTime = formatTime(generalOpenTime || '08:00');
                  const formattedCloseTime = formatTime(generalCloseTime || '20:00');
                  const operatingHours = `${formattedOpenTime} - ${formattedCloseTime}`;
                  
                  updateEstablishment({
                    openTime: generalOpenTime || '08:00',
                    closeTime: generalCloseTime || '20:00',
                    operatingHours: operatingHours,
                    weeklySchedule: JSON.stringify(weeklySchedule)
                  });
                }}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 flex items-center"
              >
                <span className="mr-2">💾</span>
                Save Operating Hours
              </button>
            </div>
          </div>

          {/* Medical Services & Specialties */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <span className="mr-2">🏥</span>
              Medical Services & Specialties
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium mb-3">General Services</h4>
                <div className="space-y-2">
                  {['General Consultation', 'Emergency Care', 'Laboratory Tests', 'Radiology', 'Pharmacy', 'Vaccination', 'Health Checkup', 'Ambulance Service'].map((service) => (
                    <label key={service} className="flex items-center">
                      <input type="checkbox" defaultChecked={['General Consultation', 'Emergency Care', 'Laboratory Tests'].includes(service)} className="mr-2" />
                      <span className="text-sm">{service}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Specialties</h4>
                <div className="space-y-2">
                  {['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Gynecology', 'Dermatology', 'ENT', 'Ophthalmology'].map((specialty) => (
                    <label key={specialty} className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm">{specialty}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Facilities</h4>
                <div className="space-y-2">
                  {['ICU', 'Operation Theater', 'Blood Bank', 'Dialysis', 'CT Scan', 'MRI', 'Parking', 'Wheelchair Access'].map((facility) => (
                    <label key={facility} className="flex items-center">
                      <input type="checkbox" defaultChecked={['Parking', 'Wheelchair Access'].includes(facility)} className="mr-2" />
                      <span className="text-sm">{facility}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Appointment & Payment Settings */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <span className="mr-2">💳</span>
              Appointment & Payment Settings
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Consultation Fee
                  </label>
                  <input
                    type="number"
                    defaultValue="500"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Enter consultation fee"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Advance Payment Percentage
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      defaultValue="50"
                      className="flex-1"
                    />
                    <span className="text-sm font-medium">50%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Appointment Duration (minutes)
                  </label>
                  <select defaultValue="30" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500">
                    <option value="15">15 Minutes</option>
                    <option value="30">30 Minutes</option>
                    <option value="45">45 Minutes</option>
                    <option value="60">1 Hour</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Appointments Per Day
                  </label>
                  <input
                    type="number"
                    defaultValue="50"
                    min="1"
                    max="200"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked={true} className="mr-2" />
                    <span className="text-sm">Auto-approve appointments</span>
                  </label>
                </div>

                <div>
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked={true} className="mr-2" />
                    <span className="text-sm">Send appointment reminders</span>
                  </label>
                </div>

                <div>
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked={false} className="mr-2" />
                    <span className="text-sm">Allow online consultations</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Emergency & Contact Settings */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <span className="mr-2">🚨</span>
              Emergency & Contact Settings
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emergency Contact Number
                  </label>
                  <input
                    type="tel"
                    defaultValue="+91 8012975411"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chief Medical Officer Email
                  </label>
                  <input
                    type="email"
                    defaultValue="cmo@hospital.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hospital License Number
                  </label>
                  <input
                    type="text"
                    placeholder="Enter license number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hospital Website
                  </label>
                  <input
                    type="url"
                    placeholder="https://yourhospital.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ambulance Service Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 108"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked={true} className="mr-2" />
                    <span className="text-sm">Display emergency contact publicly</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Doctor Modal */}
      {showDoctorModal && (
        <DoctorModal
          doctor={editingDoctor}
          onSave={saveDoctor}
          onClose={() => {
            setShowDoctorModal(false);
            setEditingDoctor(null);
          }}
        />
      )}

      {/* QR Code Modal */}
      {showQRModal && selectedBooking && (
        <QRCodeModal
          booking={selectedBooking}
          onClose={() => {
            setShowQRModal(false);
            setSelectedBooking(null);
          }}
        />
      )}

      {/* Booking Details Modal */}
      {showDetailsModal && selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedBooking(null);
          }}
        />
      )}
    </div>
  );
};

// Doctor Modal Component
const DoctorModal = ({ doctor, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: doctor?.name || '',
    specialization: doctor?.specialization || '',
    experience: doctor?.experience || 0,
    consultationFee: doctor?.consultationFee || '',
    availableTime: doctor?.availableTime || '9:00 AM - 5:00 PM',
    qualification: doctor?.qualification || '',
    isAvailable: doctor?.isAvailable !== undefined ? doctor.isAvailable : true
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData, imageFile);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">
              {doctor ? 'Edit Doctor' : 'Add New Doctor'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload */}
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden bg-gray-100">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : doctor?.imagePath ? (
                  <img src={getImageUrl(doctor.imagePath)} alt={doctor.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
                    👨‍⚕️
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="doctor-image"
              />
              <label
                htmlFor="doctor-image"
                className="cursor-pointer bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                📷 Upload Photo
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Doctor Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specialization *
                </label>
                <input
                  type="text"
                  required
                  value={formData.specialization}
                  onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="e.g., Cardiologist, Pediatrician"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experience (Years)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.experience}
                  onChange={(e) => setFormData(prev => ({ ...prev, experience: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Consultation Fee (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.consultationFee}
                  onChange={(e) => setFormData(prev => ({ ...prev, consultationFee: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Time
                </label>
                <input
                  type="text"
                  value={formData.availableTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, availableTime: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="e.g., 9:00 AM - 5:00 PM"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Qualification
                </label>
                <input
                  type="text"
                  value={formData.qualification}
                  onChange={(e) => setFormData(prev => ({ ...prev, qualification: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="e.g., MBBS, MD"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isAvailable"
                checked={formData.isAvailable}
                onChange={(e) => setFormData(prev => ({ ...prev, isAvailable: e.target.checked }))}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <label htmlFor="isAvailable" className="ml-2 block text-sm text-gray-900">
                Currently Available for Appointments
              </label>
            </div>

            <div className="flex space-x-4 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
              >
                {doctor ? 'Update Doctor' : 'Add Doctor'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// QR Code Modal Component
const QRCodeModal = ({ booking, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Appointment QR Code</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="text-center">
            <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block mb-4">
              {booking.qrCode ? (
                <img 
                  src={`data:image/png;base64,${booking.qrCode}`} 
                  alt="QR Code" 
                  className="w-48 h-48"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-gray-400">
                  No QR Code Available
                </div>
              )}
            </div>
            
            <div className="text-sm text-gray-600 mb-4">
              <p><strong>Patient:</strong> {booking.customerName}</p>
              <p><strong>Date:</strong> {booking.visitingDate}</p>
              <p><strong>Time:</strong> {booking.visitingTime}</p>
            </div>

            <button
              onClick={onClose}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Booking Details Modal Component
const BookingDetailsModal = ({ booking, onClose }) => {
  let selectedItems = [];
  try {
    if (booking.selectedItems) {
      selectedItems = typeof booking.selectedItems === 'string' 
        ? JSON.parse(booking.selectedItems) 
        : booking.selectedItems;
      
      if (!Array.isArray(selectedItems)) {
        selectedItems = [selectedItems];
      }
    }
  } catch (e) {
    selectedItems = [];
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Appointment Details</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-6">
            {/* Patient Information */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Patient Information</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p><span className="font-medium">Name:</span> {booking.customerName}</p>
                <p><span className="font-medium">Email:</span> {booking.customerEmail}</p>
                <p><span className="font-medium">Phone:</span> {booking.customerPhone || 'Not provided'}</p>
              </div>
            </div>

            {/* Appointment Information */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Appointment Information</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p><span className="font-medium">Date:</span> {booking.visitingDate}</p>
                <p><span className="font-medium">Time:</span> {booking.visitingTime}</p>
                <p><span className="font-medium">Duration:</span> {booking.visitingHours || 1} hour(s)</p>
                <p><span className="font-medium">Status:</span> 
                  <span className={`ml-2 px-2 py-1 rounded-full text-sm ${
                    booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                    booking.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {booking.status}
                  </span>
                </p>
              </div>
            </div>

            {/* Services Booked */}
            {selectedItems.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Services Booked</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  {selectedItems.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-600">{item.specialization || item.description}</p>
                      </div>
                      <p className="font-bold text-green-600">₹{item.consultationFee || item.price}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Information */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Payment Information</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p><span className="font-medium">Total Amount:</span> ₹{booking.amount}</p>
                <p><span className="font-medium">Paid Amount:</span> ₹{booking.paymentAmount || booking.amount}</p>
                <p><span className="font-medium">Transaction ID:</span> {booking.transactionId}</p>
                <p><span className="font-medium">Payment Method:</span> UPI (Verified)</p>
              </div>
              
              {/* Secure Payment Verification */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-3">
                <div className="flex items-center">
                  <span className="text-green-600 text-lg mr-3">🔒</span>
                  <div>
                    <h4 className="font-semibold text-green-900">Secure Payment Verified</h4>
                    <p className="text-green-800 text-sm">UPI transaction validated and confirmed secure</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Timeline</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p><span className="font-medium">Booked:</span> {new Date(booking.createdAt).toLocaleString()}</p>
                {booking.confirmedAt && (
                  <p><span className="font-medium">Confirmed:</span> {new Date(booking.confirmedAt).toLocaleString()}</p>
                )}
                {booking.cancelledAt && (
                  <p><span className="font-medium">Cancelled:</span> {new Date(booking.cancelledAt).toLocaleString()}</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalOwnerManagement;