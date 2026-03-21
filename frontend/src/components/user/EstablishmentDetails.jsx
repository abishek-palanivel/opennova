import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import BookingFlow from './BookingFlow';
import GoogleMap from '../common/GoogleMap';
import ReviewModal from './ReviewModal';
import EstablishmentStatus, { BookingAvailability } from '../common/EstablishmentStatus';
import { useRealTimeStatus } from '../../hooks/useRealTimeStatus';
import { formatOperatingHours, getTodayOperatingHours, getWeeklyScheduleDisplay } from '../../utils/timeUtils';
import { getImageUrl } from '../../utils/imageUtils';
import ImageWithFallback from '../common/ImageWithFallback';

const EstablishmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [establishment, setEstablishment] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Real-time status for this establishment
  const { status: realTimeStatus } = useRealTimeStatus(id ? parseInt(id) : null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [showFullSchedule, setShowFullSchedule] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedCollection, setSelectedCollection] = useState(null);

  const fetchEstablishmentDetails = async () => {
    try {
      // Add cache-busting parameter to ensure fresh data
      const timestamp = new Date().getTime();
      const response = await api.get(`/api/public/establishments/${id}?_t=${timestamp}`);
      console.log('🔄 EstablishmentDetails - Fresh data received:', {
        id: response.data.id,
        name: response.data.name,
        operatingHours: response.data.operatingHours,
        weeklySchedule: response.data.weeklySchedule,
        timestamp: new Date().toISOString()
      });
      setEstablishment(response.data);
    } catch (error) {
      console.error('Failed to fetch establishment details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEstablishmentReviews = async () => {
    try {
      const response = await api.get(`/api/user/establishments/${id}/reviews`);
      setReviews(response.data);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchEstablishmentDetails();
    fetchEstablishmentReviews();
  }, [id, user, navigate]);

  const handleReviewSubmitted = (newReview) => {
    setReviews(prev => [newReview, ...prev]);
    setShowReviewModal(false);
  };



  const getEstablishmentIcon = (type) => {
    switch (type) {
      case 'HOTEL': return '🏨';
      case 'HOSPITAL': return '🏥';
      case 'SHOP': return '🛍️';
      default: return '🏢';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN': return 'bg-green-100 text-green-800 border-green-200';
      case 'CLOSED': return 'bg-red-100 text-red-800 border-red-200';
      case 'BUSY': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-slate-600">Loading establishment details...</p>
      </div>
    );
  }

  if (!establishment) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">❌</div>
        <h3 className="text-2xl font-bold text-slate-900 mb-4">Establishment not found</h3>
        <button
          onClick={() => navigate('/user/browse')}
          className="btn-primary"
        >
          Back to Browse
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="relative">
        <button
          onClick={() => navigate('/user/browse')}
          className="absolute left-0 top-0 flex items-center text-blue-600 hover:text-blue-700 font-medium"
        >
          ← Back to Browse
        </button>
        
        <div className="text-center pt-12">
          <button
            onClick={() => {
              setLoading(true);
              fetchEstablishmentDetails();
            }}
            className="mb-4 text-sm text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1 rounded-full"
          >
            🔄 Refresh Data
          </button>
          <div className="flex items-center justify-center mb-6">
            {establishment.profileImagePath ? (
              <div className="w-20 h-20 rounded-3xl overflow-hidden shadow-xl">
                <ImageWithFallback
                  src={getImageUrl(establishment.profileImagePath)}
                  alt={establishment.name}
                  className="w-full h-full object-cover"
                  type={establishment.type}
                />
              </div>
            ) : (
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center text-5xl shadow-xl">
                {getEstablishmentIcon(establishment.type)}
              </div>
            )}
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            {establishment.name}
          </h1>
          <p className="text-xl text-slate-600 font-medium mb-4">{establishment.type}</p>
          <EstablishmentStatus 
            establishmentId={establishment.id}
            showIcon={true}
            showText={true}
            className="inline-flex"
          />
        </div>
      </div>

      {/* Hero Image Section */}
      {establishment.profileImagePath && (
        <div className="relative h-64 md:h-80 rounded-3xl overflow-hidden shadow-2xl">
          <ImageWithFallback
            src={getImageUrl(establishment.profileImagePath)}
            alt={establishment.name}
            className="w-full h-full object-cover"
            type={establishment.type}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
          <div className="absolute bottom-6 left-6 text-white">
            <h3 className="text-2xl font-bold mb-2">Welcome to {establishment.name}</h3>
            <p className="text-lg opacity-90">{establishment.type} • {establishment.address}</p>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Basic Information */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/60 p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
              <span className="mr-3">ℹ️</span>
              Basic Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-slate-700 mb-2">📍 Address</h3>
                <p className="text-slate-600">{establishment.address}</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-700 mb-2">📞 Contact</h3>
                <p className="text-slate-600">{establishment.contactNumber}</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-700 mb-2">📧 Email</h3>
                <p className="text-slate-600">{establishment.email}</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-700 mb-3">🕒 Operating Hours</h3>
                
                {/* Operating Hours Card */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-200">
                  <div 
                    className="cursor-pointer hover:bg-blue-100 rounded-xl p-3 transition-colors"
                    onClick={() => setShowFullSchedule(!showFullSchedule)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">
                          Today: {getTodayOperatingHours(establishment)}
                        </p>
                        <button
                          onClick={() => {
                            setLoading(true);
                            fetchEstablishmentDetails();
                          }}
                          className="text-xs text-blue-600 hover:text-blue-700 mt-1"
                        >
                          🔄 Refresh Hours
                        </button>
                        <p className="text-sm text-slate-600 mt-1">
                          Click to view full schedule
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <EstablishmentStatus 
                          establishmentId={establishment.id}
                          showIcon={true}
                          showText={true}
                          size="sm"
                        />
                        <span className={`transform transition-transform ${showFullSchedule ? 'rotate-180' : ''}`}>
                          ▼
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Full Weekly Schedule */}
                  {showFullSchedule && (
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <h4 className="font-semibold text-slate-900 mb-3">Weekly Schedule</h4>
                      <div className="space-y-2">
                        {(() => {
                          const weeklySchedule = getWeeklyScheduleDisplay(establishment);
                          if (weeklySchedule) {
                            return weeklySchedule.map((dayInfo) => (
                              <div key={dayInfo.day} className="flex justify-between items-center py-3 px-4 bg-white rounded-lg border border-slate-200">
                                <span className="font-medium text-slate-700">{dayInfo.day}</span>
                                <div className="flex items-center space-x-3">
                                  <span className={`font-medium ${dayInfo.isOpen ? 'text-green-600' : 'text-red-500'}`}>
                                    {dayInfo.hours}
                                  </span>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    dayInfo.status === 'OPEN' ? 'bg-green-100 text-green-700' :
                                    dayInfo.status === 'CLOSED' ? 'bg-red-100 text-red-700' :
                                    dayInfo.status === 'BUSY' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {dayInfo.status === 'OPEN' ? 'Open' :
                                     dayInfo.status === 'CLOSED' ? 'Closed' :
                                     dayInfo.status === 'BUSY' ? 'Busy' : 'Unknown'}
                                  </span>
                                </div>
                              </div>
                            ));
                          } else {
                            return (
                              <div className="text-center py-4">
                                <p className="text-slate-600">
                                  General Hours: {formatOperatingHours(establishment)}
                                </p>
                                <p className="text-sm text-slate-500 mt-1">
                                  Contact establishment for detailed schedule
                                </p>
                              </div>
                            );
                          }
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Google Maps Integration */}
            <div className="mt-8">
              <h3 className="font-semibold text-slate-700 mb-4 flex items-center">
                <span className="mr-2">🗺️</span>
                Location on Map
              </h3>
              <GoogleMap address={establishment.address} />
            </div>
          </div>

          {/* No default services/items section - only show saved items near reviews */}
        </div>

        {/* Right Column - Booking */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl shadow-xl border border-blue-200 p-8 sticky top-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
              <span className="mr-3">📅</span>
              Book Now
            </h2>

            {(realTimeStatus || establishment.status) === 'OPEN' ? (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <h3 className="font-semibold text-slate-900 mb-4">Booking Rules</h3>
                  <ul className="text-sm text-slate-600 space-y-2">
                    <li className="flex items-center">
                      <span className="mr-2">⏰</span>
                      Visiting duration: 2 hours
                    </li>
                    <li className="flex items-center">
                      <span className="mr-2">💰</span>
                      Advance payment: 70% of total
                    </li>
                    <li className="flex items-center">
                      <span className="mr-2">🔄</span>
                      Cancel 2+ hours before: Full refund
                    </li>
                    <li className="flex items-center">
                      <span className="mr-2">❌</span>
                      Cancel within 2 hours: No refund
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => setShowBookingForm(true)}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg animate-pulse-glow"
                >
                  🎯 Start Booking Process
                </button>

                <div className="text-center text-sm text-slate-500">
                  <p>💳 UPI Payment Supported</p>
                  <p>📧 QR Code sent via email</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">
                  {establishment.status === 'CLOSED' ? '🔒' : '⏳'}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Currently {realTimeStatus || establishment.status}
                </h3>
                <p className="text-slate-600 mb-4">
                  {(realTimeStatus || establishment.status) === 'CLOSED' 
                    ? 'This establishment is closed for bookings'
                    : 'This establishment is currently busy'
                  }
                </p>
                <button
                  onClick={() => navigate('/user/browse')}
                  className="btn-outline"
                >
                  Browse Other Establishments
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Saved Services/Items Section - Only show if owner has added custom items */}
      {establishment.type === 'HOTEL' && establishment.menuItems && establishment.menuItems.length > 0 && (
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/60 p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
            <span className="mr-3">🍽️</span>
            Our Menu
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {establishment.menuItems.map((item) => (
              <div 
                key={item.id} 
                className="border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group relative overflow-hidden"
                onClick={() => setSelectedMenuItem(item)}
              >
                {/* Menu Item Image */}
                {item.imagePath && (
                  <div className="mb-4 rounded-xl overflow-hidden">
                    <ImageWithFallback
                      src={getImageUrl(item.imagePath)}
                      alt={item.name}
                      className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                      type="menu"
                    />
                  </div>
                )}
                
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-slate-900 flex-1">{item.name}</h3>
                  {item.isVegetarian && (
                    <span className="ml-2 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">🌱</span>
                    </span>
                  )}
                </div>
                
                <p className="text-slate-600 text-sm mb-3">{item.description}</p>
                
                {item.category && (
                  <span className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full mb-2">
                    {item.category}
                  </span>
                )}
                
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold text-blue-600">₹{item.price}</span>
                  <div className="flex items-center space-x-2">
                    {item.preparationTime && (
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                        {item.preparationTime} mins
                      </span>
                    )}
                    <span className={`px-2 py-1 text-xs rounded-full ${item.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {item.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                </div>
                
                {item.availabilityTime && (
                  <p className="text-xs text-slate-500">Available: {item.availabilityTime}</p>
                )}
                
                {/* Click indicator */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                    Click to view
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {establishment.type === 'HOSPITAL' && establishment.doctors && establishment.doctors.length > 0 && (
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/60 p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
            <span className="mr-3">👨‍⚕️</span>
            Our Doctors
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {establishment.doctors.map((doctor) => (
              <div 
                key={doctor.id} 
                className="border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group relative overflow-hidden"
                onClick={() => setSelectedDoctor(doctor)}
              >
                {/* Doctor Image */}
                {doctor.imagePath && (
                  <div className="mb-4 rounded-xl overflow-hidden">
                    <ImageWithFallback
                      src={getImageUrl(doctor.imagePath)}
                      alt={`Dr. ${doctor.name}`}
                      className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                      type="hospital"
                    />
                  </div>
                )}
                
                <h3 className="font-semibold text-slate-900 mb-2">Dr. {doctor.name}</h3>
                <p className="text-slate-600 text-sm mb-3">{doctor.specialization}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-blue-600">₹{doctor.price}</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${doctor.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {doctor.isAvailable ? 'Available' : 'Busy'}
                  </span>
                </div>
                {doctor.availabilityTime && (
                  <p className="text-xs text-slate-500 mt-2">Available: {doctor.availabilityTime}</p>
                )}
                
                {/* Click indicator */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                    Click to view
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {establishment.type === 'SHOP' && establishment.collections && establishment.collections.length > 0 && (
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/60 p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
            <span className="mr-3">👕</span>
            Our Collections
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {establishment.collections.map((item) => (
              <div 
                key={item.id} 
                className="border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group relative overflow-hidden"
                onClick={() => setSelectedCollection(item)}
              >
                {/* Collection Item Image */}
                {item.imagePath && (
                  <div className="mb-4 rounded-xl overflow-hidden">
                    <ImageWithFallback
                      src={getImageUrl(item.imagePath)}
                      alt={item.itemName}
                      className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                      type="shop"
                    />
                  </div>
                )}
                
                <h3 className="font-semibold text-slate-900 mb-2">{item.itemName}</h3>
                <p className="text-slate-600 text-sm mb-3">{item.brand} - {item.fabric}</p>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold text-blue-600">₹{item.price}</span>
                  <span className="text-sm text-slate-600">Stock: {item.stock}</span>
                </div>
                <div className="flex space-x-2">
                  {item.sizes && item.sizes.split(',').map((size) => (
                    <span key={size} className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded">
                      {size.trim()}
                    </span>
                  ))}
                </div>
                
                {/* Click indicator */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                    Click to view
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl shadow-xl border border-blue-200 p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center justify-center">
            <span className="mr-3">🚀</span>
            Quick Actions
          </h2>
          <p className="text-slate-600 mb-6">Ready to book or share your experience?</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {(realTimeStatus || establishment.status) === 'OPEN' ? (
              <button
                onClick={() => setShowBookingForm(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center"
              >
                <span className="mr-2">🎯</span>
                Book Now
              </button>
            ) : (
              <button
                disabled
                className="bg-gray-400 text-white px-8 py-4 rounded-2xl font-bold text-lg cursor-not-allowed flex items-center justify-center opacity-60"
              >
                <span className="mr-2">🔒</span>
                Currently {realTimeStatus || establishment.status}
              </button>
            )}
            
            <button
              onClick={() => setShowReviewModal(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center"
            >
              <span className="mr-2">✍️</span>
              Write Review
            </button>

            {/* Simple Menu Test */}
            {establishment.menuItems && establishment.menuItems.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-bold text-blue-900 mb-2">🍽️ Menu Available ({establishment.menuItems.length} items)</h4>
                {establishment.menuItems.map((item, index) => (
                  <div key={index} className="bg-white p-3 rounded-lg mb-2 border">
                    <h5 className="font-semibold">{item.name}</h5>
                    <p className="text-sm text-gray-600">{item.description}</p>
                    <p className="text-green-600 font-bold">₹{item.price}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {(realTimeStatus || establishment.status) !== 'OPEN' && (
            <p className="text-sm text-slate-500 mt-4">
              This establishment is currently {(realTimeStatus || establishment.status).toLowerCase()}. Please check back later for booking.
            </p>
          )}

          {/* Menu/Services Section - Near Write Review */}
          {(establishment.menuItems?.length > 0 || establishment.doctors?.length > 0 || establishment.collections?.length > 0) && (
            <div className="mt-8 bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-900 flex items-center">
                  <span className="mr-2">
                    {establishment.type === 'HOTEL' ? '🍽️' : 
                     establishment.type === 'HOSPITAL' ? '👨‍⚕️' : 
                     establishment.type === 'SHOP' ? '🛍️' : '📋'}
                  </span>
                  {establishment.type === 'HOTEL' ? 'Available Menu' : 
                   establishment.type === 'HOSPITAL' ? 'Our Doctors' : 
                   establishment.type === 'SHOP' ? 'Our Products' : 'Services'}
                </h3>
                <span className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                  {establishment.type === 'HOTEL' ? establishment.menuItems?.length || 0 : 
                   establishment.type === 'HOSPITAL' ? establishment.doctors?.length || 0 : 
                   establishment.collections?.length || 0} items
                </span>
              </div>

              {/* Hotel Menu Items - Compact View */}
              {establishment.type === 'HOTEL' && establishment.menuItems?.length > 0 && (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {establishment.menuItems.map((item) => (
                    <div key={item.id} className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors">
                      {item.imagePath && (
                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                          <ImageWithFallback
                            src={getImageUrl(item.imagePath)}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            type="menu"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-900 truncate">{item.name}</h4>
                        <p className="text-sm text-slate-600 truncate">{item.description}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-lg font-bold text-green-600">₹{item.price}</span>
                          <div className="flex items-center space-x-1">
                            {item.isVegetarian && <span className="text-green-600 text-sm" title="Vegetarian">🌱</span>}
                            {item.isSpecial && <span className="text-yellow-500 text-sm" title="Special">⭐</span>}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {item.isAvailable ? 'Available' : 'Unavailable'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Hospital Doctors - Compact View */}
              {establishment.type === 'HOSPITAL' && establishment.doctors?.length > 0 && (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {establishment.doctors.map((doctor) => (
                    <div key={doctor.id} className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 transition-colors">
                      {doctor.imagePath && (
                        <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                          <ImageWithFallback
                            src={getImageUrl(doctor.imagePath)}
                            alt={doctor.name}
                            className="w-full h-full object-cover"
                            type="hospital"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-900 truncate">{doctor.name}</h4>
                        <p className="text-sm text-slate-600 truncate">{doctor.specialization}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-lg font-bold text-green-600">₹{doctor.price}</span>
                          {doctor.availableTime && (
                            <span className="text-xs text-slate-500">🕒 {doctor.availableTime}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Shop Collections - Compact View */}
              {establishment.type === 'SHOP' && establishment.collections?.length > 0 && (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {establishment.collections.map((item) => (
                    <div key={item.id} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors">
                      {item.imagePath && (
                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                          <ImageWithFallback
                            src={getImageUrl(item.imagePath)}
                            alt={item.itemName}
                            className="w-full h-full object-cover"
                            type="shop"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-900 truncate">{item.itemName}</h4>
                        <div className="text-sm text-slate-600 space-y-1">
                          {item.brand && <p className="truncate">🏷️ {item.brand}</p>}
                          {item.colors && <p className="truncate">🎨 {item.colors}</p>}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-lg font-bold text-green-600">₹{item.price}</span>
                          {item.stock && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {item.stock > 0 ? `${item.stock} left` : 'Out of stock'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* View All Button */}
              <div className="mt-4 text-center">
                <button
                  onClick={() => {
                    // Scroll to the detailed menu section
                    const menuSection = document.getElementById('detailed-menu-section');
                    if (menuSection) {
                      menuSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center justify-center"
                >
                  <span className="mr-1">👁️</span>
                  View All Details
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Menu/Services Section - Detailed View */}
      {(establishment.menuItems?.length > 0 || establishment.doctors?.length > 0 || establishment.collections?.length > 0) && (
        <div id="detailed-menu-section" className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/60 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center">
              <span className="mr-3">
                {establishment.type === 'HOTEL' ? '🍽️' : 
                 establishment.type === 'HOSPITAL' ? '👨‍⚕️' : 
                 establishment.type === 'SHOP' ? '🛍️' : '📋'}
              </span>
              {establishment.type === 'HOTEL' ? 'Complete Menu' : 
               establishment.type === 'HOSPITAL' ? 'All Doctors' : 
               establishment.type === 'SHOP' ? 'Full Collection' : 'All Services'}
            </h2>
            <button
              onClick={() => {
                // Scroll back to booking section
                const bookingSection = document.querySelector('.lg\\:col-span-1');
                if (bookingSection) {
                  bookingSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center"
            >
              <span className="mr-1">⬆️</span>
              Back to Booking
            </button>
          </div>

          {/* Hotel Menu Items */}
          {establishment.type === 'HOTEL' && establishment.menuItems?.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {establishment.menuItems.map((item) => (
                <div key={item.id} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200 hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                  {item.imagePath && (
                    <div className="w-full h-40 rounded-xl overflow-hidden mb-4">
                      <ImageWithFallback
                        src={getImageUrl(item.imagePath)}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        type="menu"
                      />
                    </div>
                  )}
                  <h3 className="font-bold text-lg text-slate-900 mb-2">{item.name}</h3>
                  <p className="text-slate-600 text-sm mb-3">{item.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-green-600">₹{item.price}</span>
                    <div className="flex items-center space-x-2">
                      {item.isVegetarian && <span className="text-green-600" title="Vegetarian">🌱</span>}
                      {item.isSpecial && <span className="text-yellow-500" title="Special Item">⭐</span>}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {item.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                  </div>
                  {item.preparationTime && (
                    <p className="text-xs text-slate-500 mt-2">⏱️ {item.preparationTime} mins</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Hospital Doctors */}
          {establishment.type === 'HOSPITAL' && establishment.doctors?.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {establishment.doctors.map((doctor) => (
                <div key={doctor.id} className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-6 border border-red-200 hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                  {doctor.imagePath && (
                    <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4">
                      <ImageWithFallback
                        src={getImageUrl(doctor.imagePath)}
                        alt={doctor.name}
                        className="w-full h-full object-cover"
                        type="hospital"
                      />
                    </div>
                  )}
                  <h3 className="font-bold text-lg text-slate-900 mb-2 text-center">{doctor.name}</h3>
                  <p className="text-slate-600 text-sm mb-3 text-center">{doctor.specialization}</p>
                  <div className="text-center">
                    <span className="text-2xl font-bold text-green-600">₹{doctor.price}</span>
                    <p className="text-xs text-slate-500 mt-1">Consultation Fee</p>
                  </div>
                  {doctor.availableTime && (
                    <p className="text-xs text-slate-500 mt-2 text-center">🕒 {doctor.availableTime}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Shop Collections */}
          {establishment.type === 'SHOP' && establishment.collections?.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {establishment.collections.map((item) => (
                <div key={item.id} className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200 hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                  {item.imagePath && (
                    <div className="w-full h-40 rounded-xl overflow-hidden mb-4">
                      <ImageWithFallback
                        src={getImageUrl(item.imagePath)}
                        alt={item.itemName}
                        className="w-full h-full object-cover"
                        type="shop"
                      />
                    </div>
                  )}
                  <h3 className="font-bold text-lg text-slate-900 mb-2">{item.itemName}</h3>
                  <div className="space-y-2 mb-3">
                    {item.brand && <p className="text-slate-600 text-sm">🏷️ {item.brand}</p>}
                    {item.fabric && <p className="text-slate-600 text-sm">🧵 {item.fabric}</p>}
                    {item.colors && <p className="text-slate-600 text-sm">🎨 {item.colors}</p>}
                    {item.sizes && <p className="text-slate-600 text-sm">📏 {item.sizes}</p>}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-green-600">₹{item.price}</span>
                    {item.stock && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {item.stock > 0 ? `${item.stock} in stock` : 'Out of stock'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reviews Section */}
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/60 p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center">
            <span className="mr-3">⭐</span>
            Customer Reviews
          </h2>
          <div className="flex items-center space-x-4">
            {reviews && reviews.length > 0 && (
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`text-lg ${i < Math.round(reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) ? 'text-yellow-400' : 'text-slate-300'}`}>
                      ⭐
                    </span>
                  ))}
                </div>
                <span className="text-lg font-semibold text-slate-900">
                  {(reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)}
                </span>
                <span className="text-sm text-slate-500">
                  ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
                </span>
              </div>
            )}
            {(!reviews || reviews.length === 0) && (
              <div className="text-sm text-slate-500">
                No reviews yet
              </div>
            )}
            {(realTimeStatus || establishment.status) === 'OPEN' ? (
              <button
                onClick={() => setShowBookingForm(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center"
              >
                <span className="mr-2">🎯</span>
                Book Now
              </button>
            ) : (
              <button
                disabled
                className="bg-gray-400 text-white px-6 py-2 rounded-xl font-semibold cursor-not-allowed opacity-60 flex items-center"
              >
                <span className="mr-2">🔒</span>
                {realTimeStatus || establishment.status}
              </button>
            )}
          </div>
        </div>
        
        {reviews && reviews.length > 0 ? (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="border-l-4 border-blue-500 pl-6 py-4 bg-gray-50 rounded-r-xl">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-slate-900">{review.customerName}</h4>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={`text-lg ${i < review.rating ? 'text-yellow-400' : 'text-slate-300'}`}>
                        ⭐
                      </span>
                    ))}
                    <span className="ml-2 text-sm font-medium text-slate-600">
                      {review.rating}/5
                    </span>
                  </div>
                </div>
                <p className="text-slate-600 leading-relaxed">{review.comment}</p>
                <p className="text-sm text-slate-400 mt-2">
                  {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No reviews yet</h3>
            <p className="text-slate-600 mb-4">Be the first to review this establishment!</p>
            <button
              onClick={() => setShowReviewModal(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              ✍️ Write First Review
            </button>
          </div>
        )}
      </div>

      {/* Enhanced Booking Flow Modal */}
      {showBookingForm && (
        <BookingFlow
          establishment={establishment}
          onClose={() => setShowBookingForm(false)}
        />
      )}

      {/* Review Modal */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        establishment={establishment}
        onReviewSubmitted={handleReviewSubmitted}
      />

      {/* Menu Item Detail Modal */}
      {selectedMenuItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">{selectedMenuItem.name}</h3>
                <button
                  onClick={() => setSelectedMenuItem(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Large Image */}
              {selectedMenuItem.imagePath && (
                <div className="mb-6 rounded-xl overflow-hidden">
                  <ImageWithFallback
                    src={getImageUrl(selectedMenuItem.imagePath)}
                    alt={selectedMenuItem.name}
                    className="w-full h-64 object-cover"
                    type="menu"
                  />
                </div>
              )}

              {/* Item Details */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">{selectedMenuItem.name}</h4>
                    {selectedMenuItem.description && (
                      <p className="text-gray-600 mb-4">{selectedMenuItem.description}</p>
                    )}
                  </div>
                  {selectedMenuItem.isVegetarian && (
                    <div className="ml-4 flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full">
                      <span className="mr-1">🌱</span>
                      <span className="text-sm font-medium">Vegetarian</span>
                    </div>
                  )}
                </div>

                {/* Price and Category */}
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                  <div>
                    <span className="text-3xl font-bold text-blue-600">₹{selectedMenuItem.price}</span>
                    {selectedMenuItem.category && (
                      <div className="mt-1">
                        <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full">
                          {selectedMenuItem.category}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className={`px-3 py-2 rounded-full text-sm font-medium ${
                      selectedMenuItem.isAvailable 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedMenuItem.isAvailable ? '✅ Available' : '❌ Unavailable'}
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedMenuItem.preparationTime && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <div className="flex items-center">
                        <span className="text-orange-600 mr-2">⏱️</span>
                        <div>
                          <p className="text-sm font-medium text-orange-800">Preparation Time</p>
                          <p className="text-orange-600">{selectedMenuItem.preparationTime} minutes</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedMenuItem.availabilityTime && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center">
                        <span className="text-blue-600 mr-2">🕒</span>
                        <div>
                          <p className="text-sm font-medium text-blue-800">Available Hours</p>
                          <p className="text-blue-600">{selectedMenuItem.availabilityTime}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Special Item Badge */}
                {selectedMenuItem.isSpecial && (
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg p-4 text-center">
                    <span className="text-lg font-bold">⭐ Special Item ⭐</span>
                    <p className="text-sm mt-1">This is one of our signature dishes!</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setSelectedMenuItem(null);
                      setShowBookingForm(true);
                    }}
                    disabled={!selectedMenuItem.isAvailable}
                    className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
                      selectedMenuItem.isAvailable
                        ? 'bg-blue-600 text-white hover:bg-blue-700 transform hover:scale-105'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {selectedMenuItem.isAvailable ? '📅 Book Now' : '❌ Not Available'}
                  </button>
                  <button
                    onClick={() => setSelectedMenuItem(null)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Doctor Detail Modal */}
      {selectedDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">Dr. {selectedDoctor.name}</h3>
                <button
                  onClick={() => setSelectedDoctor(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Doctor Image */}
              {selectedDoctor.imagePath && (
                <div className="mb-6 rounded-xl overflow-hidden">
                  <ImageWithFallback
                    src={getImageUrl(selectedDoctor.imagePath)}
                    alt={`Dr. ${selectedDoctor.name}`}
                    className="w-full h-64 object-cover"
                    type="hospital"
                  />
                </div>
              )}

              {/* Doctor Details */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">Dr. {selectedDoctor.name}</h4>
                  <p className="text-lg text-blue-600 font-medium">{selectedDoctor.specialization}</p>
                </div>

                {/* Price and Availability */}
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                  <div>
                    <span className="text-3xl font-bold text-blue-600">₹{selectedDoctor.price}</span>
                    <p className="text-sm text-gray-600 mt-1">Consultation Fee</p>
                  </div>
                  <div className="text-right">
                    <div className={`px-3 py-2 rounded-full text-sm font-medium ${
                      selectedDoctor.isAvailable 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedDoctor.isAvailable ? '✅ Available' : '❌ Busy'}
                    </div>
                  </div>
                </div>

                {/* Availability Time */}
                {selectedDoctor.availabilityTime && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <span className="text-blue-600 mr-2">🕒</span>
                      <div>
                        <p className="text-sm font-medium text-blue-800">Available Hours</p>
                        <p className="text-blue-600">{selectedDoctor.availabilityTime}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setSelectedDoctor(null);
                      setShowBookingForm(true);
                    }}
                    disabled={!selectedDoctor.isAvailable}
                    className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
                      selectedDoctor.isAvailable
                        ? 'bg-blue-600 text-white hover:bg-blue-700 transform hover:scale-105'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {selectedDoctor.isAvailable ? '📅 Book Appointment' : '❌ Not Available'}
                  </button>
                  <button
                    onClick={() => setSelectedDoctor(null)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collection Item Detail Modal */}
      {selectedCollection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">{selectedCollection.itemName}</h3>
                <button
                  onClick={() => setSelectedCollection(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Collection Image */}
              {selectedCollection.imagePath && (
                <div className="mb-6 rounded-xl overflow-hidden">
                  <ImageWithFallback
                    src={getImageUrl(selectedCollection.imagePath)}
                    alt={selectedCollection.itemName}
                    className="w-full h-64 object-cover"
                    type="shop"
                  />
                </div>
              )}

              {/* Collection Details */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">{selectedCollection.itemName}</h4>
                  <p className="text-lg text-gray-600">{selectedCollection.brand} - {selectedCollection.fabric}</p>
                </div>

                {/* Price and Stock */}
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                  <div>
                    <span className="text-3xl font-bold text-blue-600">₹{selectedCollection.price}</span>
                  </div>
                  <div className="text-right">
                    <div className={`px-3 py-2 rounded-full text-sm font-medium ${
                      selectedCollection.stock > 0 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedCollection.stock > 0 ? `✅ In Stock (${selectedCollection.stock})` : '❌ Out of Stock'}
                    </div>
                  </div>
                </div>

                {/* Available Sizes */}
                {selectedCollection.sizes && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-purple-800 mb-2">Available Sizes</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedCollection.sizes.split(',').map((size) => (
                        <span key={size} className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                          {size.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Colors */}
                {selectedCollection.colors && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-indigo-800 mb-2">Available Colors</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedCollection.colors.split(',').map((color) => (
                        <span key={color} className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full">
                          {color.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Special Offer Badge */}
                {selectedCollection.isSpecialOffer && (
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg p-4 text-center">
                    <span className="text-lg font-bold">🎉 Special Offer 🎉</span>
                    <p className="text-sm mt-1">Limited time offer on this item!</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setSelectedCollection(null);
                      setShowBookingForm(true);
                    }}
                    disabled={selectedCollection.stock <= 0}
                    className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
                      selectedCollection.stock > 0
                        ? 'bg-blue-600 text-white hover:bg-blue-700 transform hover:scale-105'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {selectedCollection.stock > 0 ? '🛒 Order Now' : '❌ Out of Stock'}
                  </button>
                  <button
                    onClick={() => setSelectedCollection(null)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EstablishmentDetails;