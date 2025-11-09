import { useState, useEffect } from 'react';
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
  const [testingEmail, setTestingEmail] = useState(false);

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

  const testEmailFunctionality = async () => {
    setTestingEmail(true);
    try {
      console.log('🧪 Testing email functionality...');
      const response = await api.post('/api/user/test-email');
      console.log('✅ Test email response:', response.data);
      
      if (response.data.success) {
        alert('✅ Test email sent successfully! Check your email inbox.');
      } else {
        alert('❌ Test email failed: ' + response.data.message);
      }
    } catch (error) {
      console.error('❌ Test email error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to send test email';
      alert('❌ Test email failed: ' + errorMessage);
    } finally {
      setTestingEmail(false);
    }
  };

  const testFraudScenario = async (scenario) => {
    try {
      console.log('🚨 Testing fraud scenario:', scenario);
      const response = await api.post('/api/payment/test-fraud-detection', {
        scenario: scenario
      });
      
      const result = response.data;
      
      let message = `🧪 FRAUD DETECTION TEST RESULT:\n\n`;
      message += `Scenario: ${scenario.replace('_', ' ').toUpperCase()}\n`;
      message += `Transaction ID: ${result.transactionId}\n`;
      message += `User Claim: ${result.userClaim}\n`;
      message += `Actual Payment: ${result.actualPayment}\n`;
      message += `Result: ${result.result}\n\n`;
      message += `${result.explanation}`;
      
      alert(message);
      
    } catch (error) {
      console.error('❌ Fraud test error:', error);
      alert('❌ Fraud detection test failed: ' + (error.response?.data?.message || error.message));
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
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Start Browsing
          </button>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg text-center">
          <div className="text-4xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Request New Establishment</h3>
          <p className="text-gray-600 mb-4">Can't find what you're looking for? Request it!</p>
          <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
            Make Request
          </button>
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

      {/* Email Test Section */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">📧 Email System Test</h3>
            <p className="text-yellow-800 text-sm">
              Test if you're receiving booking confirmation emails properly. 
              This will send a test email to <strong>{user?.email}</strong>
            </p>
          </div>
          <button
            onClick={testEmailFunctionality}
            disabled={testingEmail}
            className="bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            {testingEmail ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending...
              </span>
            ) : (
              '🧪 Send Test Email'
            )}
          </button>
        </div>
        <div className="mt-4 text-xs text-yellow-700">
          <p>• If you receive the test email, booking confirmations should work</p>
          <p>• Check your spam folder if you don't see the email</p>
          <p>• Contact support if test email fails</p>
        </div>
      </div>

      {/* Fraud Detection Test Section */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-red-900 mb-2">🚨 Payment Fraud Detection Test</h3>
          <p className="text-red-800 text-sm mb-4">
            Test how the system detects payment fraud scenarios. This demonstrates bank verification.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <button
              onClick={() => testFraudScenario('honest_payment')}
              className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              ✅ Test Honest Payment
              <div className="text-xs mt-1">User pays ₹30, claims ₹30</div>
            </button>
            
            <button
              onClick={() => testFraudScenario('underpayment_fraud')}
              className="w-full bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              ❌ Test Underpayment Fraud
              <div className="text-xs mt-1">User pays ₹20, claims ₹30</div>
            </button>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => testFraudScenario('overpayment')}
              className="w-full bg-orange-600 text-white px-4 py-3 rounded-lg hover:bg-orange-700 transition-colors text-sm"
            >
              ⚠️ Test Overpayment
              <div className="text-xs mt-1">User pays ₹35, claims ₹30</div>
            </button>
            
            <button
              onClick={() => testFraudScenario('fake_transaction')}
              className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors text-sm"
            >
              🚫 Test Fake Transaction
              <div className="text-xs mt-1">User provides fake transaction ID</div>
            </button>
          </div>
        </div>
        
        <div className="mt-4 text-xs text-red-700">
          <p>• These tests show how bank verification catches fraud</p>
          <p>• In production, this connects to real bank APIs</p>
          <p>• System compares user claims vs actual bank records</p>
        </div>
      </div>


    </div>
  );
};

export default Dashboard;