import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import LoadingSpinner from '../common/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeBookings: 0,
    completedBookings: 0,
    totalReviews: 0,
    pendingBookings: 0,
    cancelledBookings: 0,
    totalSpent: 0,
    averageRatingGiven: 0,
    totalEstablishmentRequests: 0,
    pendingEstablishmentRequests: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserStats();
    fetchRecentActivity();
  }, []);

  const fetchRecentActivity = async () => {
    try {
      console.log('🔄 Fetching recent activity from backend...');
      const response = await api.get('/api/user/recent-activity');
      console.log('✅ Recent activity received:', response.data);
      setRecentActivity(response.data);
    } catch (error) {
      console.error('❌ Failed to fetch recent activity:', error);
      setRecentActivity([]);
    }
  };

  const fetchUserStats = async () => {
    try {
      console.log('📊 Fetching user stats from backend...');
      
      // Fetch comprehensive user statistics
      const statsResponse = await api.get('/api/user/stats');
      console.log('✅ Stats received:', statsResponse.data);
      setStats(statsResponse.data);
      
      // Fetch recent bookings
      const bookingsResponse = await api.get('/api/user/recent-bookings');
      console.log('✅ Recent bookings received:', bookingsResponse.data);
      setRecentBookings(bookingsResponse.data);
      
    } catch (error) {
      console.error('❌ Failed to fetch user data:', error);
      
      // Fallback to default values on error
      setStats({
        totalBookings: 0,
        activeBookings: 0,
        completedBookings: 0,
        totalReviews: 0,
        pendingBookings: 0,
        cancelledBookings: 0,
        totalSpent: 0,
        averageRatingGiven: 0,
        totalEstablishmentRequests: 0,
        pendingEstablishmentRequests: 0
      });
      setRecentBookings([]);
    } finally {
      setLoading(false);
    }
  };



  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}! 👋</h1>
        <p className="text-blue-100">Here's what's happening with your bookings and activities.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalBookings || 0}</p>
              <p className="text-xs text-gray-500 mt-1">All time bookings</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <span className="text-2xl">📅</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Bookings</p>
              <p className="text-3xl font-bold text-green-600">{stats.activeBookings || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Pending & confirmed</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-3xl font-bold text-purple-600">{stats.completedBookings || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Successfully visited</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <span className="text-2xl">🎉</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Reviews Given</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.totalReviews || 0}</p>
              <p className="text-xs text-gray-500 mt-1">
                Avg: {stats.averageRatingGiven ? stats.averageRatingGiven.toFixed(1) : '0.0'} ⭐
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <span className="text-2xl">⭐</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Spent</p>
              <p className="text-3xl font-bold text-indigo-600">₹{(stats.totalSpent || 0).toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Lifetime spending</p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-full">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-3xl font-bold text-pink-600">{stats.totalBookings || 0}</p>
              <p className="text-xs text-gray-500 mt-1">All time bookings</p>
            </div>
            <div className="p-3 bg-pink-100 rounded-full">
              <span className="text-2xl">❤️</span>
            </div>
          </div>
        </div>



        <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Requests</p>
              <p className="text-3xl font-bold text-orange-600">{stats.pendingEstablishmentRequests || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Establishment requests</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <span className="text-2xl">📝</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Member Since</p>
              <p className="text-lg font-bold text-gray-900">
                {stats.memberSince ? new Date(stats.memberSince).getFullYear() : new Date().getFullYear()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.memberSince ? new Date(stats.memberSince).toLocaleDateString() : 'Today'}
              </p>
            </div>
            <div className="p-3 bg-gray-100 rounded-full">
              <span className="text-2xl">🎂</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity & Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">📅</span>
            Recent Bookings
          </h2>
          {recentBookings.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📅</div>
              <p className="text-gray-600">No recent bookings found.</p>
              <p className="text-sm text-gray-500 mt-2">Start exploring establishments to make your first booking!</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {recentBookings.slice(0, 5).map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center">
                    <div className="mr-3 text-2xl">
                      {booking.establishmentType === 'HOTEL' ? '🏨' :
                       booking.establishmentType === 'HOSPITAL' ? '🏥' : '🛍️'}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{booking.establishmentName}</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(booking.visitingDate).toLocaleDateString()} at {booking.visitingTime}
                      </p>
                      <p className="text-xs text-gray-500">₹{(booking.amount || 0).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                      booking.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                      booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {booking.status}
                    </span>
                    {booking.hasQrCode && (
                      <p className="text-xs text-green-600 mt-1">QR Available</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">🔄</span>
            Recent Activity
          </h2>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🔄</div>
              <p className="text-gray-600">No recent activity.</p>
              <p className="text-sm text-gray-500 mt-2">Your activities will appear here as you use the platform.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="mr-3 text-xl flex-shrink-0">
                    {activity.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm">{activity.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">{activity.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(activity.timestamp).toLocaleDateString()} at {new Date(activity.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  {activity.status && (
                    <span className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${
                      activity.status === 'CONFIRMED' || activity.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                      activity.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      activity.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {activity.status}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Browse Establishments</h3>
          <p className="text-gray-600 mb-4">Discover hotels, hospitals, and shops near you</p>
          <Link 
            to="/user/browse"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Browsing
          </Link>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg text-center">
          <div className="text-4xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Request New Establishment</h3>
          <p className="text-gray-600 mb-4">Can't find what you're looking for? Request it!</p>
          <Link 
            to="/user/request"
            className="inline-block bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Make Request
          </Link>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg text-center">
          <div className="text-4xl mb-4">⭐</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Write Reviews</h3>
          <p className="text-gray-600 mb-4">Share your experiences with others</p>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
            View Reviews
          </button>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;