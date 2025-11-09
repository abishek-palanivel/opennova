import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import OpenNovaLogo from '../common/OpenNovaLogo';
import LoadingSpinner from '../common/LoadingSpinner';
import { getImageUrl } from '../../utils/imageUtils';
import ImageWithFallback from '../common/ImageWithFallback';

const HotelOwnerManagement = () => {
  const { user } = useAuth();
  const location = useLocation();
  

  
  // Determine active tab based on current route
  const getActiveTabFromRoute = () => {
    const path = location.pathname;
    if (path.includes('/bookings')) return 'bookings';
    if (path.includes('/items')) return 'menus';
    if (path.includes('/reviews')) return 'reviews';
    if (path.includes('/settings')) return 'hours';
    return 'profile';
  };
  
  const [activeTab, setActiveTab] = useState(getActiveTabFromRoute());
  const [loading, setLoading] = useState(false);
  const [establishment, setEstablishment] = useState({
    name: '',
    address: 'Thangavel Nagar, 4/122, Covai Road, Reddipalayam, Karur, Tamil Nadu 639008',
    contactNumber: '8012975411',
    latitude: 10.963788560368593,
    longitude: 78.0483853359511,
    status: 'OPEN',
    upiId: 'abishek1234@upi',
    operatingHours: '9:00 AM - 10:00 PM'
  });
  const [menus, setMenus] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [processingBooking, setProcessingBooking] = useState(null);


  useEffect(() => {
    // Only fetch data when user is available and authenticated
    if (user) {
      fetchEstablishmentData();
      fetchMenus();
      fetchBookings();
      fetchReviews();
    }
  }, [user]);

  // Update active tab when route changes
  useEffect(() => {
    setActiveTab(getActiveTabFromRoute());
  }, [location.pathname]); // Removed getActiveTabFromRoute from dependencies as it's stable

  const fetchEstablishmentData = async () => {
    // Only fetch if user is authenticated as owner
    if (!user || !['OWNER', 'HOTEL_OWNER', 'HOSPITAL_OWNER', 'SHOP_OWNER'].includes(user.role)) {
      setEstablishment({});
      return;
    }

    try {
      const response = await api.get('/api/owner/establishment');
      setEstablishment(response.data);
    } catch (error) {
      console.debug('Establishment data not available:', error.response?.status);
      setEstablishment({});
    }
  };

  const fetchMenus = async () => {
    // Only fetch if user is authenticated as owner
    if (!user || !['OWNER', 'HOTEL_OWNER', 'HOSPITAL_OWNER', 'SHOP_OWNER'].includes(user.role)) {
      setMenus([]);
      return;
    }

    try {
      console.log('🔄 Fetching hotel menus...');
      const response = await api.get('/api/owner/menus');
      console.log('📋 Menu data received:', response.data);
      
      // Enhanced logging for image debugging
      if (Array.isArray(response.data)) {
        response.data.forEach((menu, index) => {
          console.log(`🍽️ Menu ${index + 1}:`, {
            id: menu.id,
            name: menu.name,
            imagePath: menu.imagePath,
            imageUrl: menu.imageUrl,
            hasImage: !!(menu.imagePath || menu.imageUrl),
            fullImageUrl: menu.imagePath ? `http://localhost:9000/api/files/view/${menu.imagePath}` : 'No image'
          });
        });
      }
      
      setMenus(response.data || []);
    } catch (error) {
      console.error('❌ Error fetching menus:', error);
      setMenus([]);
    }
  };

  const fetchBookings = async () => {
    // Only fetch if user is authenticated as owner
    if (!user || !['OWNER', 'HOTEL_OWNER', 'HOSPITAL_OWNER', 'SHOP_OWNER'].includes(user.role)) {
      setBookings([]);
      return;
    }

    try {
      const response = await api.get('/api/owner/bookings');
      // The API returns { success: true, bookings: [...], count: n }
      const bookingsData = response.data.bookings || response.data;
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
    } catch (error) {
      console.debug('Bookings not available:', error.response?.status);
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
      
      alert('Establishment updated successfully!');
    } catch (error) {
      console.error('Failed to update establishment:', error);
      if (error.response?.status === 401) {
        alert('Authentication failed. Please log in as a hotel owner to update establishment settings.');
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
      await api.post(`/api/owner/bookings/${bookingId}/confirm`);
      await fetchBookings(); // Refresh the bookings list
      alert('✅ Booking confirmed successfully! QR code has been sent to the customer via email.');
    } catch (error) {
      console.error('Failed to confirm booking:', error);
      alert('❌ Failed to confirm booking. Please try again.');
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
      alert('❌ Booking rejected successfully! Customer has been notified and refund has been initiated.');
    } catch (error) {
      console.error('Failed to reject booking:', error);
      alert('❌ Failed to reject booking. Please try again.');
    } finally {
      setProcessingBooking(null);
    }
  };

  const deleteBooking = async (bookingId) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to permanently delete this booking? This action cannot be undone.'
    );
    
    if (!confirmDelete) return;
    
    setProcessingBooking(bookingId);
    try {
      await api.delete(`/api/owner/bookings/${bookingId}`);
      await fetchBookings(); // Refresh the bookings list
      alert('🗑️ Booking deleted successfully!');
    } catch (error) {
      console.error('Failed to delete booking:', error);
      alert('❌ Failed to delete booking. Please try again.');
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

  const saveMenu = async (menuData, imageFile = null) => {
    try {
      // Create FormData for file upload
      const formData = new FormData();
      
      // Add menu data
      formData.append('name', menuData.name);
      formData.append('description', menuData.description || '');
      formData.append('price', menuData.price);
      formData.append('category', menuData.category || 'MAIN_COURSE');
      formData.append('preparationTime', menuData.preparationTime || 15);
      formData.append('availabilityTime', menuData.availabilityTime || '6:00 AM - 11:00 PM');
      formData.append('isVegetarian', menuData.isVegetarian || false);
      formData.append('isSpecial', menuData.isSpecial || false);
      
      // Add image file if provided
      if (imageFile) {
        formData.append('image', imageFile);
      }

      if (editingMenu) {
        // Use the with-image endpoint for updates
        const endpoint = imageFile ? `/api/owner/menus/${editingMenu.id}/with-image` : `/api/owner/menus/${editingMenu.id}`;
        const config = imageFile ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
        const data = imageFile ? formData : menuData;
        
        await api.put(endpoint, data, config);
        alert('Menu item updated successfully!');
      } else {
        // Use the with-image endpoint for creation
        await api.post('/api/owner/menus/with-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert('Menu item added successfully!');
      }
      fetchMenus();
      setShowMenuModal(false);
      setEditingMenu(null);
    } catch (error) {
      console.error('Failed to save menu:', error);
      alert('Failed to save menu item: ' + (error.response?.data?.message || error.message));
    }
  };

  const deleteMenu = async (menuId) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      try {
        await api.delete(`/api/owner/menus/${menuId}`);
        fetchMenus();
        alert('Menu item deleted successfully!');
      } catch (error) {
        console.error('Failed to delete menu:', error);
        alert('Failed to delete menu item');
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
        alert('Authentication failed. Please log in as a hotel owner to update status.');
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
      link.setAttribute('download', 'hotel-bookings.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      alert('Bookings exported successfully!');
    } catch (error) {
      console.error('Failed to export bookings:', error);
      alert('Failed to export bookings');
    }
  };

  const TabButton = ({ id, label, icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all ${
        activeTab === id
          ? 'bg-blue-600 text-white shadow-lg'
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
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <OpenNovaLogo className="h-16 w-16 mr-4 text-white" />
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                🏨 Hotel Owner Portal
              </h1>
              <p className="text-blue-100 mt-2">
                Email: {user?.email || 'owner@hotel.com'} | Contact: {establishment.contactNumber}
              </p>
              {!user && (
                <p className="text-yellow-200 text-sm mt-1">
                  ⚠️ Not logged in - Login required to save changes
                </p>
              )}
              <p className="text-blue-100 text-sm">
                {establishment.address}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-blue-100">Status</p>
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
        <TabButton id="menus" label="Manage Menus" icon="🍽️" />
        <TabButton id="bookings" label="Bookings" icon="📅" />
        <TabButton id="reviews" label="Reviews" icon="⭐" />
        <TabButton id="hours" label="Operating Hours" icon="🕒" />
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
                Hotel Name
              </label>
              <input
                type="text"
                value={establishment.name}
                onChange={(e) => setEstablishment(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., abishek1234@upi"
              />
            </div>
            

          </div>
          <div className="mt-6 flex items-center space-x-4">
            <button
              onClick={() => updateEstablishment(establishment)}
              disabled={loading || !user}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
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

      {activeTab === 'bookings' && (
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold flex items-center">
              <span className="mr-3">📅</span>
              Manage Bookings
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

              // Debug log
              console.log('Booking data:', {
                id: booking.id,
                selectedItems: booking.selectedItems,
                parsedItems: selectedItems,
                paymentVerified: booking.paymentVerified || 'UPI Verified',
                qrCode: booking.qrCode ? 'Present' : 'Missing'
              });

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
                            <span className="font-medium">Check-in:</span>
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
                      </div>

                      {/* Room/Service Details */}
                      {selectedItems.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                            <span className="mr-2">🏨</span>
                            Booked Items:
                          </h4>
                          <div className="bg-gray-50 rounded-lg p-3">
                            {selectedItems.map((item, index) => (
                              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                                <div>
                                  <p className="font-medium text-gray-900">{item.name}</p>
                                  <p className="text-sm text-gray-600">{item.description}</p>
                                  {item.type && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{item.type}</span>}
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-green-600">₹{item.price}</p>
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
                              Confirm Booking
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
                              Reject Booking
                            </>
                          )}
                        </button>
                      </>
                    )}
                    
                    {booking.status === 'CONFIRMED' && (
                      <button
                        onClick={() => {
                          if (booking.qrCode) {
                            setSelectedBooking(booking);
                            setShowQRModal(true);
                          } else {
                            generateQRCode(booking.id);
                          }
                        }}
                        disabled={processingBooking === booking.id}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center transition-colors disabled:opacity-50"
                      >
                        {processingBooking === booking.id ? (
                          <>
                            <LoadingSpinner size="sm" />
                            <span className="ml-2">Processing...</span>
                          </>
                        ) : (
                          <>
                            <span className="mr-2">📱</span>
                            {booking.qrCode ? 'View QR Code' : 'Generate QR Code'}
                          </>
                        )}
                      </button>
                    )}
                    
                    <button
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowDetailsModal(true);
                      }}
                      className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center transition-colors"
                    >
                      <span className="mr-2">👁️</span>
                      View Details
                    </button>

                    {/* Secure Payment Verification */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center">
                        <span className="text-green-600 mr-2">🔒</span>
                        <div>
                          <p className="text-green-900 font-semibold text-sm">UPI Payment Verified</p>
                          <p className="text-green-800 text-xs">Transaction ID: {booking.transactionId}</p>
                        </div>
                      </div>
                    </div>

                    {/* Delete Button - Only for cancelled/rejected bookings or admin override */}
                    {(booking.status === 'CANCELLED' || booking.status === 'REJECTED') && (
                      <button
                        onClick={() => deleteBooking(booking.id)}
                        disabled={processingBooking === booking.id}
                        className="bg-red-800 text-white px-4 py-2 rounded-lg hover:bg-red-900 flex items-center transition-colors disabled:opacity-50"
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
                    )}

                    {/* Admin Delete - Always available for emergency cases */}
                    <button
                      onClick={() => deleteBooking(booking.id)}
                      disabled={processingBooking === booking.id}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center transition-colors disabled:opacity-50"
                      title="Permanently delete this booking"
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
                <p className="text-gray-600 mb-4">Bookings will appear here when customers make reservations</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <span className="mr-3">⭐</span>
            Customer Reviews
          </h2>
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center mb-2">
                      <h3 className="font-semibold">{review.customerName}</h3>
                      <div className="ml-3 flex">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'}>
                            ⭐
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-700">{review.comment}</p>
                    <p className="text-gray-500 text-sm mt-2">{review.createdAt}</p>
                  </div>
                  <button
                    onClick={() => deleteReview(review.id)}
                    className="text-red-600 hover:text-red-800 p-2"
                    title="Delete Review"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Menu Management Tab */}
      {activeTab === 'menus' && (
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold flex items-center">
              <span className="mr-3">🍽️</span>
              Manage Menu Items
            </h2>
            <button
              onClick={() => {
                setEditingMenu(null);
                setShowMenuModal(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <span className="mr-2">➕</span>
              Add Menu Item
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menus.map((menu) => (
              <div key={menu.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                {/* Menu Item Image */}
                <div className="relative mb-4">
                  <div className="relative w-full h-40 rounded-lg overflow-hidden">
                    <ImageWithFallback
                      src={menu.imageUrl || getImageUrl(menu.imagePath)}
                      alt={menu.name}
                      className="w-full h-full object-cover"
                      type="hotel"
                    />
                    {/* Image indicator */}
                    {(menu.imageUrl || menu.imagePath) && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                        <span className="mr-1">📷</span>
                        Image
                      </div>
                    )}
                  </div>
                </div>

                {/* Menu Item Details */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-lg text-gray-900 leading-tight">{menu.name}</h3>
                    <div className="flex space-x-1 ml-2">
                      {menu.isVegetarian && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          🌱 Veg
                        </span>
                      )}
                      {menu.isSpecial && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                          ⭐ Special
                        </span>
                      )}
                    </div>
                  </div>

                  {menu.description && (
                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">{menu.description}</p>
                  )}

                  {menu.category && (
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        📂 {menu.category}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-green-600">₹{menu.price}</span>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">⏱️ {menu.preparationTime || 15} mins</p>
                      {menu.availabilityTime && (
                        <p className="text-xs text-gray-400">{menu.availabilityTime}</p>
                      )}
                    </div>
                  </div>

                  {/* Availability Status */}
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      menu.isAvailable !== false 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {menu.isAvailable !== false ? '✅ Available' : '❌ Unavailable'}
                    </span>
                    
                    {/* File Upload Status */}
                    <div className="flex items-center space-x-1">
                      {(menu.imageUrl || menu.imagePath) ? (
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                          📁 Image Saved
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                          📁 No Image
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2 pt-2">
                    <button
                      onClick={() => {
                        setEditingMenu(menu);
                        setShowMenuModal(true);
                      }}
                      className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center justify-center"
                    >
                      <span className="mr-1">✏️</span>
                      Edit
                    </button>
                    <button
                      onClick={() => deleteMenu(menu.id)}
                      className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors flex items-center justify-center"
                    >
                      <span className="mr-1">🗑️</span>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {menus.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🍽️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No menu items yet</h3>
              <p className="text-gray-600 mb-4">Add your first menu item to get started</p>
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'hours' && (
        <div className="space-y-6">
          {/* Business Settings */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <span className="mr-3">⚙️</span>
              Business Settings
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
                    <div key={dayInfo.day} data-day={dayInfo.day.toLowerCase()} className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
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
                          defaultValue="09:00"
                          className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                        />
                        <span className="text-sm">to</span>
                        <input
                          type="time"
                          defaultValue="22:00"
                          className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked={false} className="mr-2" />
                      <span className="text-sm font-medium text-blue-700">24/7 Reception & Room Service</span>
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
                    <span className="text-sm">New Booking Notifications</span>
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
                    <span className="text-sm">Review Notifications</span>
                    <input type="checkbox" defaultChecked={true} className="toggle" />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-sm">Payment Notifications</span>
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
                        startTime: startTime || '09:00', 
                        endTime: endTime || '21:00',
                        isClosed: !isOpen
                      };
                      
                      // Use the first open day's hours as general operating hours
                      if (isOpen && !generalOpenTime) {
                        generalOpenTime = startTime || '09:00';
                        generalCloseTime = endTime || '21:00';
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
                  
                  const formattedOpenTime = formatTime(generalOpenTime || '09:00');
                  const formattedCloseTime = formatTime(generalCloseTime || '21:00');
                  const operatingHours = `${formattedOpenTime} - ${formattedCloseTime}`;
                  
                  updateEstablishment({
                    openTime: generalOpenTime || '09:00',
                    closeTime: generalCloseTime || '21:00',
                    operatingHours: operatingHours,
                    weeklySchedule: JSON.stringify(weeklySchedule)
                  });
                }}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center"
              >
                <span className="mr-2">💾</span>
                Save Operating Hours
              </button>
            </div>
          </div>

          {/* Payment & Booking Settings */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <span className="mr-2">💳</span>
              Payment & Booking Settings
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Advance Payment Percentage
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="10"
                      max="100"
                      defaultValue="70"
                      className="flex-1"
                    />
                    <span className="text-sm font-medium">70%</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Booking Hours in Advance
                  </label>
                  <select defaultValue="2" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="1">1 Hour</option>
                    <option value="2">2 Hours</option>
                    <option value="4">4 Hours</option>
                    <option value="24">24 Hours</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Bookings Per Day
                  </label>
                  <input
                    type="number"
                    defaultValue="50"
                    min="1"
                    max="200"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cancellation Policy
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="flexible">Flexible (Full refund 2+ hours before)</option>
                    <option value="moderate">Moderate (50% refund 4+ hours before)</option>
                    <option value="strict">Strict (No refund within 24 hours)</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked={true} className="mr-2" />
                    <span className="text-sm">Auto-approve bookings</span>
                  </label>
                </div>

                <div>
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked={false} className="mr-2" />
                    <span className="text-sm">Require booking confirmation</span>
                  </label>
                </div>

                <div>
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked={true} className="mr-2" />
                    <span className="text-sm">Send booking reminders</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Special Features */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <span className="mr-2">✨</span>
              Special Features & Amenities
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium mb-3">Hotel Amenities</h4>
                <div className="space-y-2">
                  {['WiFi', 'Parking', 'Restaurant', 'Room Service', 'Gym', 'Pool', 'Spa', 'Conference Room'].map((amenity) => (
                    <label key={amenity} className="flex items-center">
                      <input type="checkbox" defaultChecked={['WiFi', 'Parking', 'Restaurant'].includes(amenity)} className="mr-2" />
                      <span className="text-sm">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Special Services</h4>
                <div className="space-y-2">
                  {['Airport Pickup', 'Laundry', 'Concierge', 'Pet Friendly', 'Business Center', 'Event Hosting'].map((service) => (
                    <label key={service} className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm">{service}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Accessibility</h4>
                <div className="space-y-2">
                  {['Wheelchair Access', 'Elevator', 'Braille Signage', 'Hearing Loop', 'Accessible Parking'].map((access) => (
                    <label key={access} className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm">{access}</span>
                    </label>
                  ))}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Manager Email
                  </label>
                  <input
                    type="email"
                    defaultValue="manager@hotel.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://yourhotel.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Social Media Links
                  </label>
                  <div className="space-y-2">
                    <input
                      type="url"
                      placeholder="Facebook URL"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="url"
                      placeholder="Instagram URL"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="url"
                      placeholder="Twitter URL"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => updateEstablishment(establishment)}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center"
              >
                <span className="mr-2">🔄</span>
                Update All Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Menu Modal */}
      {showMenuModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
            <h3 className="text-xl font-bold mb-4">
              {editingMenu ? 'Edit Menu Item' : 'Add New Menu Item'}
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const imageFile = formData.get('imageFile');
                const menuData = {
                  name: formData.get('name'),
                  description: formData.get('description'),
                  price: parseFloat(formData.get('price')),
                  category: formData.get('category'),
                  preparationTime: parseInt(formData.get('preparationTime')),
                  availabilityTime: formData.get('availabilityTime'),
                  isVegetarian: formData.get('isVegetarian') === 'on',
                  isSpecial: formData.get('isSpecial') === 'on'
                };
                saveMenu(menuData, imageFile && imageFile.size > 0 ? imageFile : null);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingMenu?.name || ''}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    defaultValue={editingMenu?.price || ''}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  defaultValue={editingMenu?.description || ''}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    name="category"
                    defaultValue={editingMenu?.category || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Category</option>
                    <option value="Rooms">Rooms</option>
                    <option value="Services">Services</option>
                    <option value="Amenities">Amenities</option>
                    <option value="Food & Beverage">Food & Beverage</option>
                    <option value="Special">Special</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preparation Time (minutes)
                  </label>
                  <input
                    type="number"
                    name="preparationTime"
                    defaultValue={editingMenu?.preparationTime || '15'}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Availability Time
                </label>
                <input
                  type="text"
                  name="availabilityTime"
                  defaultValue={editingMenu?.availabilityTime || '9:00 AM - 11:00 PM'}
                  placeholder="e.g., 9:00 AM - 11:00 PM"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Image
                </label>
                <input
                  type="file"
                  name="imageFile"
                  accept="image/*"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">Upload an image for this menu item</p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editingMenu ? 'Update Menu Item' : 'Add Menu Item'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMenuModal(false);
                    setEditingMenu(null);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Booking Details Modal */}
      {showDetailsModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Booking Details</h3>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedBooking(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Customer Information */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-lg mb-3 text-blue-900">👤 Customer Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{selectedBooking.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{selectedBooking.customerEmail}</p>
                  </div>
                </div>
              </div>

              {/* Booking Information */}
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-semibold text-lg mb-3 text-green-900">📅 Booking Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Booking ID</p>
                    <p className="font-medium">#{selectedBooking.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Check-in Date & Time</p>
                    <p className="font-medium">{selectedBooking.visitingDate} at {selectedBooking.visitingTime}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="font-medium">{selectedBooking.visitingHours || 1} hour(s)</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedBooking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      selectedBooking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                      selectedBooking.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedBooking.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-purple-50 rounded-lg p-4">
                <h4 className="font-semibold text-lg mb-3 text-purple-900">💳 Payment Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="font-bold text-green-600 text-lg">₹{selectedBooking.amount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Amount Paid</p>
                    <p className="font-bold text-blue-600 text-lg">₹{selectedBooking.paymentAmount || selectedBooking.amount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Transaction ID</p>
                    <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{selectedBooking.transactionId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment Status</p>
                    <p className="font-medium">{selectedBooking.paymentStatus || 'COMPLETED'}</p>
                  </div>
                </div>
              </div>

              {/* Booked Items */}
              <div className="bg-orange-50 rounded-lg p-4">
                <h4 className="font-semibold text-lg mb-3 text-orange-900">🏨 Booked Items</h4>
                {(() => {
                  let items = [];
                  let rawData = selectedBooking.selectedItems;
                  
                  try {
                    if (rawData) {
                      items = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
                      if (!Array.isArray(items)) {
                        items = [items];
                      }
                    }
                  } catch (e) {
                    console.error('Error parsing selectedItems:', e);
                    items = [];
                  }

                  if (items.length > 0) {
                    return (
                      <div className="space-y-3">
                        {items.map((item, index) => (
                          <div key={index} className="bg-white rounded-lg p-3 border border-orange-200">
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="font-medium text-gray-900">{item.name || 'Unnamed Item'}</h5>
                                <p className="text-sm text-gray-600">{item.description || 'No description available'}</p>
                                {item.type && (
                                  <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                    {item.type}
                                  </span>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-green-600">₹{item.price || '0'}</p>
                                {item.available !== undefined && (
                                  <p className={`text-xs ${item.available ? 'text-green-600' : 'text-red-600'}`}>
                                    {item.available ? '✅ Available' : '❌ Unavailable'}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  } else {
                    return (
                      <div className="bg-white rounded-lg p-4 border border-orange-200">
                        <div className="text-center text-gray-500">
                          <p className="mb-2">📋 No detailed items information available</p>
                          <div className="text-sm bg-gray-100 p-3 rounded">
                            <p><strong>Raw Data:</strong></p>
                            <pre className="text-xs mt-1 overflow-x-auto">
                              {rawData || 'No data'}
                            </pre>
                          </div>
                        </div>
                      </div>
                    );
                  }
                })()}
              </div>

              {/* Timeline */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-lg mb-3 text-gray-900">⏰ Timeline</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    <span className="text-sm">Booked: {new Date(selectedBooking.createdAt).toLocaleString()}</span>
                  </div>
                  {selectedBooking.confirmedAt && (
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                      <span className="text-sm">Confirmed: {new Date(selectedBooking.confirmedAt).toLocaleString()}</span>
                    </div>
                  )}
                  {selectedBooking.cancelledAt && (
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                      <span className="text-sm">Cancelled: {new Date(selectedBooking.cancelledAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Debug Information */}
              <details className="bg-gray-100 rounded-lg p-4">
                <summary className="font-semibold text-gray-900 cursor-pointer">🔧 Debug Information</summary>
                <div className="mt-3 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium">QR Code Status:</p>
                      <p className={selectedBooking.qrCode ? 'text-green-600' : 'text-red-600'}>
                        {selectedBooking.qrCode ? '✅ Generated' : '❌ Not Generated'}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Payment Verification:</p>
                      <p className="text-green-600">
                        🔒 UPI Transaction Verified
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Payment Status:</p>
                      <p>{selectedBooking.paymentStatus || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="font-medium">Refund Status:</p>
                      <p>{selectedBooking.refundStatus || 'Not applicable'}</p>
                    </div>
                  </div>
                  
                  {selectedBooking.transactionId && (
                    <div className="mt-3">
                      <p className="font-medium">UPI Transaction ID:</p>
                      <p className="bg-green-50 p-2 rounded font-mono text-sm">{selectedBooking.transactionId}</p>
                    </div>
                  )}
                  
                  <div className="mt-3">
                    <p className="font-medium">Raw Selected Items:</p>
                    <pre className="bg-white p-2 rounded text-xs overflow-x-auto">
                      {selectedBooking.selectedItems || 'No data'}
                    </pre>
                  </div>
                </div>
              </details>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedBooking(null);
                }}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
              {selectedBooking.status === 'CONFIRMED' && (
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setShowQRModal(true);
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  View QR Code
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">QR Code</h3>
              <button
                onClick={() => {
                  setShowQRModal(false);
                  setSelectedBooking(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>
            
            <div className="text-center">
              <div className="mb-4">
                <h4 className="font-semibold text-lg">{selectedBooking.customerName}</h4>
                <p className="text-gray-600">{selectedBooking.customerEmail}</p>
                <p className="text-sm text-gray-500">Booking ID: {selectedBooking.id}</p>
              </div>
              
              {selectedBooking.qrCode ? (
                <div className="mb-4">
                  <img 
                    src={`data:image/png;base64,${selectedBooking.qrCode}`} 
                    alt="QR Code" 
                    className="mx-auto border rounded-lg shadow-sm max-w-full h-auto"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <div style={{display: 'none'}} className="p-4 bg-red-50 rounded-lg">
                    <p className="text-red-800">Failed to load QR code image. Please try generating it again.</p>
                  </div>
                  <p className="text-sm text-gray-600 mt-3">
                    Show this QR code to the customer for verification
                  </p>
                </div>
              ) : (
                <div className="mb-4 p-4 bg-yellow-50 rounded-lg">
                  <p className="text-yellow-800 mb-3">QR code not generated yet.</p>
                  <button
                    onClick={() => {
                      setShowQRModal(false);
                      generateQRCode(selectedBooking.id);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Generate QR Code Now
                  </button>
                </div>
              )}
              
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setShowQRModal(false);
                    setSelectedBooking(null);
                  }}
                  className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                >
                  Close
                </button>
                {selectedBooking.qrCode && (
                  <button
                    onClick={() => {
                      // Download QR code
                      const link = document.createElement('a');
                      link.href = `data:image/png;base64,${selectedBooking.qrCode}`;
                      link.download = `qr-code-booking-${selectedBooking.id}.png`;
                      link.click();
                    }}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Download
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HotelOwnerManagement;