import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import ReviewModal from './ReviewModal';
import EstablishmentStatus, { BookingAvailability } from '../common/EstablishmentStatus';
import { useMultipleEstablishmentStatuses } from '../../hooks/useRealTimeStatus';
import { getTodayOperatingHours } from '../../utils/timeUtils';
import { getImageUrl } from '../../utils/imageUtils';
import ImageWithFallback from '../common/ImageWithFallback';

const BrowseEstablishments = () => {
  const [establishments, setEstablishments] = useState([]);
  const [filteredEstablishments, setFilteredEstablishments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedEstablishment, setSelectedEstablishment] = useState(null);
  
  const [filters, setFilters] = useState({
    type: searchParams.get('type') || '',
    status: '',
    search: ''
  });

  // Real-time status for all establishments (only if we have establishments)
  const establishmentIds = establishments.map(est => est.id);
  useMultipleEstablishmentStatuses(
    establishments.length > 0 ? establishmentIds : []
  );

  useEffect(() => {
    fetchEstablishments();
    
    // Set up polling for real-time updates every 2 seconds for better responsiveness
    const pollInterval = setInterval(() => {
      fetchEstablishments(true); // Pass true to indicate this is a refresh
    }, 2000);
    
    return () => clearInterval(pollInterval);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [establishments, filters]);

  const fetchEstablishments = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Add cache-busting parameter to ensure fresh data
      const timestamp = new Date().getTime();
      const response = await api.get(`/api/public/establishments?_t=${timestamp}`);
      console.log('🔄 BrowseEstablishments - Fresh data received:', response.data.map(est => ({
        id: est.id,
        name: est.name,
        operatingHours: est.operatingHours,
        weeklySchedule: est.weeklySchedule ? 'Present' : 'Missing',
        timestamp: new Date().toISOString()
      })));
      
      // Check if response.data is an array
      if (Array.isArray(response.data)) {
        // Filter out any establishments that might be owner-only or inactive
        const activeEstablishments = response.data.filter(est => 
          est.id && est.name && est.type && est.address
        );
        
        console.log('Fetched establishments:', activeEstablishments);
        // Log image data for each establishment
        activeEstablishments.forEach((est, index) => {
          console.log(`Establishment ${index}:`, {
            id: est.id,
            name: est.name,
            profileImagePath: est.profileImagePath,
            hasImage: !!est.profileImagePath,
            imageUrl: est.profileImagePath ? getImageUrl(est.profileImagePath) : 'No image'
          });
        });
        setEstablishments(activeEstablishments);
      } else {
        console.error('Expected array but got:', typeof response.data, response.data);
        setEstablishments([]);
      }
    } catch (error) {
      console.error('Failed to fetch establishments:', error);
      console.error('Error details:', error.response?.data);
      setEstablishments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };



  const applyFilters = () => {
    let filtered = establishments;

    if (filters.type) {
      filtered = filtered.filter(est => est.type === filters.type);
    }

    if (filters.status) {
      filtered = filtered.filter(est => est.status === filters.status);
    }

    if (filters.search) {
      filtered = filtered.filter(est => 
        est.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        est.address.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    setFilteredEstablishments(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleEstablishmentClick = (establishment) => {
    if (!user) {
      navigate('/login', { state: { from: `/user/establishment/${establishment.id}` } });
      return;
    }
    navigate(`/user/establishment/${establishment.id}`);
  };

  const handleReviewClick = (establishment, e) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }
    setSelectedEstablishment(establishment);
    setShowReviewModal(true);
  };

  const handleReviewSubmitted = (newReview) => {
    // Optionally update the establishment's review count or rating
    console.log('New review submitted:', newReview);
  };



  const getEstablishmentIcon = (type) => {
    const icons = {
      'HOTEL': '🏨',
      'HOSPITAL': '🏥',
      'SHOP': '🛍️'
    };
    return icons[type] || '🏢';
  };





  const getTypeColor = (type) => {
    const colors = {
      'HOTEL': 'from-blue-500 to-blue-600',
      'HOSPITAL': 'from-red-500 to-red-600',
      'SHOP': 'from-green-500 to-green-600'
    };
    return colors[type] || 'from-gray-500 to-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Loading Establishments</h3>
          <p className="text-slate-600">Discovering amazing places near you...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Enhanced Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Browse Establishments 🔍
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 font-medium max-w-2xl mx-auto">
            Discover amazing places near you with advanced search and filters
          </p>
          <div className="mt-4 flex items-center justify-center space-x-4 text-slate-500 text-sm">
            <span className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
              {establishments.length} Establishments
            </span>
            <span>•</span>
            <span>Real-time Availability</span>
            <span>•</span>
            <button
              onClick={() => fetchEstablishments(true)}
              disabled={refreshing}
              className="flex items-center text-blue-600 hover:text-blue-700 font-medium"
            >
              <span className={`mr-1 ${refreshing ? 'animate-spin' : ''}`}>🔄</span>
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-8">
          {['', 'HOTEL', 'SHOP', 'HOSPITAL'].map((type) => (
            <button
              key={type}
              onClick={() => handleFilterChange('type', type)}
              className={`px-4 sm:px-6 py-2 sm:py-3 rounded-full font-semibold transition-all duration-300 text-sm sm:text-base ${
                filters.type === type
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {type === '' ? '🌟 All' : 
               type === 'HOTEL' ? '🏨 Hotels' :
               type === 'SHOP' ? '🛍️ Shops' : '🏥 Hospitals'}
            </button>
          ))}
        </div>

        {/* Advanced Filters */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl border border-white/60 p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">🔍 Search</label>
              <input
                type="text"
                placeholder="Search establishments..."
                className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 text-sm sm:text-base"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">📊 Status</label>
              <select
                className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 text-sm sm:text-base"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Status</option>
                <option value="OPEN">🟢 Open</option>
                <option value="CLOSED">🔴 Closed</option>
                <option value="BUSY">🟡 Busy</option>
              </select>
            </div>
            
            <div className="sm:col-span-2 lg:col-span-2 flex items-end">
              <button
                onClick={() => setFilters({ type: '', status: '', search: '' })}
                className="w-full bg-gradient-to-r from-slate-500 to-slate-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold hover:from-slate-600 hover:to-slate-700 transition-all duration-300 transform hover:scale-105 text-sm sm:text-base"
              >
                🔄 Clear All Filters
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Establishments Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          {filteredEstablishments.map((establishment, index) => {
            return (
              <div 
                key={establishment.id} 
                className="group bg-white rounded-xl shadow-lg hover:shadow-xl border border-gray-200 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer relative overflow-hidden"
                onClick={() => handleEstablishmentClick(establishment)}
                style={{ animationDelay: `${index * 100}ms` }}
              >
              {/* Real-time Status Badge */}
              <div className="absolute top-3 right-3 z-10">
                <EstablishmentStatus 
                  establishmentId={establishment.id}
                  showIcon={false}
                  showText={true}
                  size="sm"
                  autoRefresh={true}
                />
              </div>



              {/* Header Section */}
              <div className="p-4 pb-3">
                <div className="flex items-center gap-3">
                  {/* Profile Image or Default Icon */}
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden shadow-md flex-shrink-0">
                    {establishment.profileImagePath ? (
                      <>
                        <ImageWithFallback
                          src={getImageUrl(establishment.profileImagePath)}
                          alt={establishment.name}
                          className="w-full h-full object-cover"
                          type={establishment.type}
                        />
                          onError={(e) => {
                            // Fallback to default icon if image fails to load
                            console.error('Failed to load establishment image:', e.target.src);
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className={`w-12 h-12 bg-gradient-to-br ${getTypeColor(establishment.type)} rounded-lg flex items-center justify-center text-xl shadow-md flex-shrink-0`} style={{display: 'none'}}>
                          {getEstablishmentIcon(establishment.type)}
                        </div>
                      </>
                    ) : (
                      <div className={`w-12 h-12 bg-gradient-to-br ${getTypeColor(establishment.type)} rounded-lg flex items-center justify-center text-xl shadow-md flex-shrink-0`}>
                        {getEstablishmentIcon(establishment.type)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pr-16">
                    <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1">
                      {establishment.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        establishment.type === 'HOTEL' ? 'bg-blue-50 text-blue-700' :
                        establishment.type === 'HOSPITAL' ? 'bg-red-50 text-red-700' :
                        'bg-green-50 text-green-700'
                      }`}>
                        {establishment.type}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-600 font-medium text-xs flex items-center gap-1">
                        <span>🕒</span>
                        {getTodayOperatingHours(establishment)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="px-4 pb-3 space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-blue-500 text-sm mt-0.5">📍</span>
                  <p className="text-gray-600 text-sm leading-relaxed flex-1">
                    {establishment.address}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500 text-sm">📞</span>
                  <p className="text-gray-700 font-medium text-sm">{establishment.contactNumber}</p>
                </div>
              </div>

              {/* Features */}
              <div className="px-4 pb-3">
                <div className="flex flex-wrap gap-1.5">
                  <BookingAvailability 
                    establishmentId={establishment.id}
                    className="text-xs"
                  />
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs font-medium">
                    ⚡ Quick Booking
                  </span>
                  <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md text-xs font-medium">
                    💳 UPI Payment
                  </span>
                  <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-md text-xs font-medium">
                    📱 QR Code
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 pt-0 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(establishment.address)}`, '_blank');
                    }}
                    className="bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded-lg font-semibold text-sm transition-colors duration-200 flex items-center justify-center gap-1"
                  >
                    <span>🗺️</span>
                    View Map
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!user) {
                        navigate('/login', { state: { from: `/user/establishment/${establishment.id}` } });
                        return;
                      }
                      navigate(`/user/establishment/${establishment.id}`);
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded-lg font-semibold text-sm transition-colors duration-200 flex items-center justify-center gap-1"
                  >
                    <span>🎯</span>
                    Book Now
                  </button>
                </div>
                
                <button 
                  onClick={(e) => handleReviewClick(establishment, e)}
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-3 rounded-lg font-semibold text-sm transition-colors duration-200 flex items-center justify-center gap-1"
                >
                  <span>⭐</span>
                  {user ? 'Write Review' : 'Login to Review'}
                </button>
              </div>

              {/* Rating & Reviews Preview */}
              {establishment.averageRating && establishment.reviewCount > 0 && (
                <div className="px-4 pb-4 pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={`text-xs ${i < Math.floor(establishment.averageRating) ? 'text-yellow-400' : 'text-gray-300'}`}>
                            ⭐
                          </span>
                        ))}
                      </div>
                      <span className="text-sm font-semibold text-gray-700">
                        {establishment.averageRating.toFixed(1)}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {establishment.reviewCount} review{establishment.reviewCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              )}
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredEstablishments.length === 0 && (
        <div className="text-center py-16">
          <div className="w-32 h-32 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-6xl text-slate-400">🔍</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-4">No establishments found</h3>
          <p className="text-slate-600 mb-8 max-w-md mx-auto">
            Try adjusting your filters or search terms to find what you're looking for.
          </p>
          <button
            onClick={() => setFilters({ type: '', status: '', search: '' })}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-full font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Clear All Filters
          </button>
          </div>
        )}

        {/* Sign-in Prompt for Non-authenticated Users */}
        {!user && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Ready to Book?</h3>
          <p className="text-blue-100 mb-6">Sign in to make bookings and access exclusive features</p>
          <Link
            to="/login"
            className="bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Sign In Now
          </Link>
          </div>
        )}

        {/* Review Modal */}
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          establishment={selectedEstablishment}
          onReviewSubmitted={handleReviewSubmitted}
        />
      </div>
    </div>
  );
};

export default BrowseEstablishments;