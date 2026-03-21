import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import OpenNovaLogo from '../common/OpenNovaLogo';
import LoadingSpinner from '../common/LoadingSpinner';
import { getImageUrl } from '../../utils/imageUtils';
import ImageWithFallback from '../common/ImageWithFallback';
import PaymentVerificationManagement from './PaymentVerificationManagement';

const ShopOwnerManagement = () => {
  const { user } = useAuth();
  const location = useLocation();
  
  // Determine active tab based on current route
  const getActiveTabFromRoute = () => {
    const path = location.pathname;
    if (path.includes('/bookings')) return 'bookings';
    if (path.includes('/items')) return 'collections';
    if (path.includes('/reviews')) return 'reviews';
    if (path.includes('/payments')) return 'payments';
    if (path.includes('/settings')) return 'hours';
    return 'profile';
  };
  
  const [activeTab, setActiveTab] = useState(getActiveTabFromRoute());
  const [loading, setLoading] = useState(false);
  const [establishment, setEstablishment] = useState({
    name: '',
    address: 'Fashion Plaza, 123 Main Street, Salem, Tamil Nadu 636001',
    contactNumber: '8012975411',
    latitude: 11.664325,
    longitude: 78.16535296015707,
    status: 'OPEN',
    upiId: 'abishek1234@upi',
    operatingHours: '10:00 AM - 9:00 PM'
  });
  const [collections, setCollections] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [processingBooking, setProcessingBooking] = useState(null);
  
  // Collection form state
  const [collectionFormData, setCollectionFormData] = useState({
    itemName: '',
    description: '',
    price: '',
    brand: '',
    stock: 0,
    sizes: '',
    colors: '',
    fabric: '',
    isSpecialOffer: false
  });
  const [collectionImageFile, setCollectionImageFile] = useState(null);
  const [collectionImagePreview, setCollectionImagePreview] = useState(null);

  useEffect(() => {
    // Only fetch data when user is available and authenticated
    if (user) {
      fetchEstablishmentData();
      fetchCollections();
      fetchBookings();
      fetchReviews();
    }
  }, [user]);

  // Update active tab when route changes
  useEffect(() => {
    setActiveTab(getActiveTabFromRoute());
  }, [location.pathname]);

  // Collection form handlers
  const handleCollectionInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCollectionFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCollectionImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCollectionImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setCollectionImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetCollectionForm = () => {
    setCollectionFormData({
      itemName: '',
      description: '',
      price: '',
      brand: '',
      stock: 0,
      sizes: '',
      colors: '',
      fabric: '',
      isSpecialOffer: false
    });
    setCollectionImageFile(null);
    setCollectionImagePreview(null);
  };

  const handleSubmitCollection = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('itemName', collectionFormData.itemName);
      formData.append('price', collectionFormData.price);
      formData.append('description', collectionFormData.description || '');
      formData.append('brand', collectionFormData.brand || '');
      formData.append('stock', collectionFormData.stock || 0);
      formData.append('sizes', collectionFormData.sizes || '');
      formData.append('colors', collectionFormData.colors || '');
      formData.append('fabric', collectionFormData.fabric || '');
      formData.append('isSpecialOffer', collectionFormData.isSpecialOffer || false);

      if (collectionImageFile) {
        formData.append('image', collectionImageFile);
      }

      let response;
      if (editingCollection) {
        // Use the with-image endpoint for updates when image is provided
        const endpoint = collectionImageFile ? `/api/owner/collections/${editingCollection.id}/with-image` : `/api/owner/collections/${editingCollection.id}`;
        const config = collectionImageFile ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
        const data = collectionImageFile ? formData : collectionFormData;
        
        response = await api.put(endpoint, data, config);
      } else {
        // Use the with-image endpoint for creation
        response = await api.post('/api/owner/collections/with-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      alert(editingCollection ? 'Collection updated successfully!' : 'Collection added successfully!');
      setShowCollectionModal(false);
      setEditingCollection(null);
      resetCollectionForm();
      fetchCollections(); // Refresh the collections list
    } catch (error) {
      console.error('Error saving collection:', error);
      alert('Failed to save collection: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCollection = async (collectionId) => {
    setLoading(true);
    try {
      await api.delete(`/api/owner/collections/${collectionId}`);
      alert('Collection deleted successfully!');
      fetchCollections(); // Refresh the collections list
    } catch (error) {
      console.error('Error deleting collection:', error);
      alert('Failed to delete collection: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Initialize form when editing
  useEffect(() => {
    if (editingCollection) {
      setCollectionFormData({
        itemName: editingCollection.itemName || '',
        description: editingCollection.description || '',
        price: editingCollection.price || '',
        brand: editingCollection.brand || '',
        stock: editingCollection.stock || 0,
        sizes: editingCollection.sizes || '',
        colors: editingCollection.colors || '',
        fabric: editingCollection.fabric || '',
        isSpecialOffer: editingCollection.isSpecialOffer || false
      });
      if (editingCollection.imagePath) {
        setCollectionImagePreview(getImageUrl(editingCollection.imagePath));
      }
    } else {
      resetCollectionForm();
    }
  }, [editingCollection]);  const
 fetchEstablishmentData = async () => {
    if (!user || !['OWNER', 'HOTEL_OWNER', 'HOSPITAL_OWNER', 'SHOP_OWNER'].includes(user.role)) {
      setEstablishment({
        name: '',
        address: '',
        contactNumber: '',
        phoneNumber: '',
        upiId: '',
        operatingHours: '',
        status: 'OPEN',
        latitude: 0,
        longitude: 0
      });
      return;
    }

    try {
      // Add cache-busting parameter to ensure fresh data
      const timestamp = new Date().getTime();
      const response = await api.get(`/api/owner/establishment?_t=${timestamp}`);
      console.log('🔄 ShopOwner - Fresh establishment data received:', response.data);
      // Ensure all fields have default values to prevent controlled/uncontrolled input warnings
      setEstablishment({
        name: response.data.name || '',
        address: response.data.address || '',
        contactNumber: response.data.phoneNumber || response.data.contactNumber || '',
        phoneNumber: response.data.phoneNumber || response.data.contactNumber || '',
        upiId: response.data.upiId || '',
        operatingHours: response.data.operatingHours || '',
        status: response.data.status || 'OPEN',
        latitude: response.data.latitude || 0,
        longitude: response.data.longitude || 0,
        ...response.data
      });
    } catch (error) {
      console.debug('Establishment data not available:', error.response?.status);
      setEstablishment({
        name: '',
        address: '',
        contactNumber: '',
        phoneNumber: '',
        upiId: '',
        operatingHours: '',
        status: 'OPEN',
        latitude: 0,
        longitude: 0
      });
    }
  };

  const fetchCollections = async () => {
    if (!user || !['OWNER', 'HOTEL_OWNER', 'HOSPITAL_OWNER', 'SHOP_OWNER'].includes(user.role)) {
      setCollections([]);
      return;
    }

    try {
      const response = await api.get('/api/owner/collections');
      setCollections(response.data || []);
    } catch (error) {
      console.error('Error fetching collections:', error);
      setCollections([]);
    }
  };

  const fetchBookings = async () => {
    if (!user || !['OWNER', 'HOTEL_OWNER', 'HOSPITAL_OWNER', 'SHOP_OWNER'].includes(user.role)) {
      setBookings([]);
      return;
    }

    try {
      const response = await api.get('/api/owner/bookings');
      const bookingsData = response.data.bookings || response.data;
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
    } catch (error) {
      console.debug('Bookings not available:', error.response?.status);
      setBookings([]);
    }
  };

  const fetchReviews = async () => {
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
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in first. Use: abishekopennova@gmail.com / password');
      window.location.href = '/login';
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      Object.keys(updatedData).forEach(key => {
        if (updatedData[key] !== null && updatedData[key] !== undefined) {
          formData.append(key, updatedData[key]);
        }
      });
      
      const response = await api.put('/api/owner/establishment/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      if (response.data.data) {
        setEstablishment(prev => ({ ...prev, ...response.data.data }));
      } else {
        setEstablishment(prev => ({ ...prev, ...updatedData }));
      }
      
      // Refresh establishment data to ensure we have the latest from database
      await fetchEstablishmentData();
      
      alert('Shop updated successfully!');
    } catch (error) {
      console.error('Failed to update establishment:', error);
      alert('Failed to update establishment: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await api.put('/api/owner/establishment/status', { status: newStatus });
      setEstablishment(prev => ({ ...prev, status: newStatus }));
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status: ' + (error.response?.data?.message || error.message));
    }
  };

  const TabButton = ({ id, label, icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all ${
        activeTab === id
          ? 'bg-green-600 text-white shadow-lg'
          : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
      }`}
    >
      <span className="mr-2 text-lg">{icon}</span>
      {label}
    </button>
  );

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Shop Management</h1>
          <p className="text-gray-600 mt-2">Manage your shop operations and settings</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-4 mb-8">
          <TabButton id="profile" label="Profile" icon="🏪" />
          <TabButton id="collections" label="Items" icon="📦" />
          <TabButton id="bookings" label="Bookings" icon="📅" />
          <TabButton id="payments" label="Payment Verifications" icon="💳" />
          <TabButton id="reviews" label="Reviews" icon="⭐" />
          <TabButton id="hours" label="Operating Hours" icon="🕒" />
        </div>

        {/* Tab Content */}
        {/* Tab Content */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <span className="mr-3">⚙️</span>
              Shop Profile Settings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shop Name
                </label>
                <input
                  type="text"
                  value={establishment.name}
                  onChange={(e) => setEstablishment(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., shop1234@upi"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={establishment.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="OPEN">🟢 Open</option>
                  <option value="CLOSED">🔴 Closed</option>
                  <option value="BUSY">🟡 Busy</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex items-center space-x-4">
              <button
                onClick={() => updateEstablishment(establishment)}
                disabled={loading || !user}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
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

        {activeTab === 'collections' && (
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center">
                <span className="mr-3">📦</span>
                Manage Collections
              </h2>
              <button
                onClick={() => {
                  setEditingCollection(null);
                  setShowCollectionModal(true);
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
              >
                <span className="mr-2">➕</span>
                Add Collection
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.map((collection) => (
                <div key={collection.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                  <div className="relative mb-4">
                    <div className="relative w-full h-40 rounded-lg overflow-hidden">
                      <ImageWithFallback
                        src={collection.imageUrl || getImageUrl(collection.imagePath)}
                        alt={collection.itemName || collection.name}
                        className="w-full h-full object-cover"
                        type="shop"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <h3 className="font-bold text-lg text-gray-900 leading-tight">{collection.itemName || collection.name}</h3>
                      <div className="flex space-x-1 ml-2">
                        {(collection.isSpecialOffer || collection.isSpecial) && (
                          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                            ⭐ Special
                          </span>
                        )}
                      </div>
                    </div>

                    {collection.description && (
                      <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">{collection.description}</p>
                    )}

                    {collection.brand && (
                      <div className="flex items-center">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          🏷️ {collection.brand}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-green-600">₹{collection.price}</span>
                      <div className="text-right">
                        {collection.stock !== undefined && (
                          <p className="text-xs text-gray-400">Stock: {collection.stock}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        collection.isActive !== false 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {collection.isActive !== false ? '✅ Available' : '❌ Unavailable'}
                      </span>
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <button
                        onClick={() => {
                          setEditingCollection(collection);
                          setShowCollectionModal(true);
                        }}
                        className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center justify-center"
                      >
                        <span className="mr-1">✏️</span>
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this collection?')) {
                            handleDeleteCollection(collection.id);
                          }
                        }}
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

            {collections.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No collections yet</h3>
                <p className="text-gray-600 mb-4">Add your first collection to get started</p>
              </div>
            )}
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
                onClick={async () => {
                  try {
                    const response = await api.get('/api/owner/excel/bookings', { responseType: 'blob' });
                    const url = window.URL.createObjectURL(new Blob([response.data]));
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', 'shop-bookings.xlsx');
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                  } catch (error) {
                    console.error('Export failed:', error);
                    alert('Failed to export bookings');
                  }
                }}
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
                            booking.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
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
                              <span className="font-medium">Visit Date:</span>
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

                        {/* Shop Items Details */}
                        {selectedItems.length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                              <span className="mr-2">🛍️</span>
                              Purchased Items:
                            </h4>
                            <div className="bg-gray-50 rounded-lg p-3">
                              {selectedItems.map((item, index) => (
                                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                                  <div>
                                    <p className="font-medium text-gray-900">{item.name || item.itemName}</p>
                                    <p className="text-sm text-gray-600">{item.description}</p>
                                    {item.brand && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{item.brand}</span>}
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold text-green-600">₹{item.price}</p>
                                    {item.stock !== undefined && (
                                      <p className="text-xs text-gray-500">Stock: {item.stock}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex space-x-3 mt-4">
                          {booking.status === 'PENDING' && (
                            <>
                              <button
                                onClick={async () => {
                                  try {
                                    await api.put(`/api/owner/bookings/${booking.id}/confirm`);
                                    fetchBookings();
                                    alert('Booking confirmed successfully!');
                                  } catch (error) {
                                    alert('Failed to confirm booking: ' + (error.response?.data?.message || error.message));
                                  }
                                }}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
                              >
                                ✅ Confirm
                              </button>
                              <button
                                onClick={async () => {
                                  const reason = prompt('Please provide a reason for rejection:');
                                  if (reason) {
                                    try {
                                      await api.put(`/api/owner/bookings/${booking.id}/reject`, { reason });
                                      fetchBookings();
                                      alert('Booking rejected successfully!');
                                    } catch (error) {
                                      alert('Failed to reject booking: ' + (error.response?.data?.message || error.message));
                                    }
                                  }
                                }}
                                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
                              >
                                ❌ Reject
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
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                            >
                              ✅ Mark Visit Complete
                            </button>
                          )}

                          {booking.qrCode && (
                            <button
                              onClick={() => {
                                setSelectedBooking(booking);
                                setShowQRModal(true);
                              }}
                              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm"
                            >
                              📱 View QR Code
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowDetailsModal(true);
                            }}
                            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 text-sm"
                          >
                            👁️ View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📅</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
                  <p className="text-gray-600 mb-4">Bookings will appear here when customers make purchases</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payment Verifications Tab */}
        {activeTab === 'payments' && (
          <PaymentVerificationManagement />
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
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this review?')) {
                          // Delete review logic here
                        }
                      }}
                      className="text-red-600 hover:text-red-800 p-2"
                      title="Delete Review"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
              {reviews.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">⭐</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Reviews Yet</h3>
                  <p className="text-gray-600">Customer reviews will appear here.</p>
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
                Shop Settings
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
                      <div key={dayInfo.day} data-day={dayInfo.day.toLowerCase()} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                        <div className="w-16">
                          <span className="text-sm font-medium">{dayInfo.short}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            defaultChecked={dayInfo.day !== 'Sunday'}
                            className="mr-2"
                          />
                          <span className="text-sm">Open</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="time"
                            defaultValue="10:00"
                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-green-500"
                          />
                          <span className="text-sm">to</span>
                          <input
                            type="time"
                            defaultValue="21:00"
                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-green-500"
                          />
                        </div>
                      </div>
                    ))}
                    
                    <div className="mt-4 p-3 bg-green-100 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked={false} className="mr-2" />
                        <span className="text-sm font-medium text-green-700">24/7 Online Store</span>
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
                      <span className="text-sm">New Order Notifications</span>
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
                    <label className="flex items-center justify-between">
                      <span className="text-sm">Inventory Alerts</span>
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
                          startTime: startTime || '10:00', 
                          endTime: endTime || '21:00',
                          isClosed: !isOpen
                        };
                        
                        // Use the first open day's hours as general operating hours
                        if (isOpen && !generalOpenTime) {
                          generalOpenTime = startTime || '10:00';
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
                    
                    const formattedOpenTime = formatTime(generalOpenTime || '10:00');
                    const formattedCloseTime = formatTime(generalCloseTime || '21:00');
                    const operatingHours = `${formattedOpenTime} - ${formattedCloseTime}`;
                    
                    updateEstablishment({
                      openTime: generalOpenTime || '10:00',
                      closeTime: generalCloseTime || '21:00',
                      operatingHours: operatingHours,
                      weeklySchedule: JSON.stringify(weeklySchedule)
                    });
                  }}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center"
                >
                  <span className="mr-2">💾</span>
                  Save Operating Hours
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Collection Modal */}
        {showCollectionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingCollection ? 'Edit Collection Item' : 'Add New Collection Item'}
                </h3>
                <button
                  onClick={() => {
                    setShowCollectionModal(false);
                    setEditingCollection(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitCollection} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Item Name *
                    </label>
                    <input
                      type="text"
                      name="itemName"
                      value={collectionFormData.itemName}
                      onChange={handleCollectionInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price *
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={collectionFormData.price}
                      onChange={handleCollectionInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={collectionFormData.description}
                    onChange={handleCollectionInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Brand
                    </label>
                    <input
                      type="text"
                      name="brand"
                      value={collectionFormData.brand}
                      onChange={handleCollectionInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock Quantity
                    </label>
                    <input
                      type="number"
                      name="stock"
                      value={collectionFormData.stock}
                      onChange={handleCollectionInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      min="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sizes
                    </label>
                    <input
                      type="text"
                      name="sizes"
                      value={collectionFormData.sizes}
                      onChange={handleCollectionInputChange}
                      placeholder="S, M, L, XL"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Colors
                    </label>
                    <input
                      type="text"
                      name="colors"
                      value={collectionFormData.colors}
                      onChange={handleCollectionInputChange}
                      placeholder="Red, Blue, Green"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fabric
                    </label>
                    <input
                      type="text"
                      name="fabric"
                      value={collectionFormData.fabric}
                      onChange={handleCollectionInputChange}
                      placeholder="Cotton, Silk, etc."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCollectionImageChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  {collectionImagePreview && (
                    <div className="mt-2">
                      <img
                        src={collectionImagePreview}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-md"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isSpecialOffer"
                      checked={collectionFormData.isSpecialOffer}
                      onChange={handleCollectionInputChange}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Special Offer</span>
                  </label>
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCollectionModal(false);
                      setEditingCollection(null);
                      resetCollectionForm();
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : (editingCollection ? 'Update Collection' : 'Add Collection')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopOwnerManagement;