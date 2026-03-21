import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalBookings: 0,
    todayBookings: 0,
    totalRevenue: 0,
    averageRating: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOwnerStats();
  }, []);

  const handleExportBookings = async () => {
    try {
      const response = await fetch('/api/owner/export/bookings', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `my-bookings-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to export bookings');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export bookings');
    }
  };

  const fetchOwnerStats = async () => {
    try {
      // Fetch real stats from the API
      const response = await fetch('/api/owner/dashboard-stats', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats({
          totalBookings: data.totalBookings || 0,
          todayBookings: data.todayBookings || 0,
          totalRevenue: data.totalRevenue || 0,
          averageRating: data.averageRating || 0,
          paidOrders: data.paidOrders || 0,
          pendingVisits: data.pendingVisits || 0
        });
        console.log('📊 Dashboard stats loaded:', data);
      } else {
        console.error('Failed to fetch dashboard stats:', response.status);
        // Keep default values on error
      }

      // Fetch recent bookings
      try {
        const bookingsResponse = await fetch('/api/owner/orders', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (bookingsResponse.ok) {
          const bookingsData = await bookingsResponse.json();
          if (bookingsData.orders && Array.isArray(bookingsData.orders)) {
            // Take only the first 5 recent bookings for dashboard
            const recentBookingsData = bookingsData.orders.slice(0, 5).map(booking => ({
              id: booking.id,
              customerName: booking.customerName || 'Unknown Customer',
              date: booking.visitingDate || booking.createdAt,
              status: booking.status,
              amount: booking.amount || 0
            }));
            setRecentBookings(recentBookingsData);
          }
        }
      } catch (bookingsError) {
        console.error('Failed to fetch recent bookings:', bookingsError);
      }

    } catch (error) {
      console.error('Failed to fetch owner stats:', error);
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
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome, {user?.name}! 🏢</h1>
        <p className="text-green-100">Manage your establishment and track your business performance.</p>
        <p className="text-sm text-green-200 mt-1">Role: {user?.role?.replace('_', ' ')}</p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={handleExportBookings}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center"
        >
          <span className="mr-2">📊</span>
          Export My Bookings
        </button>
        <button
          onClick={() => window.location.href = '/owner/bookings'}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <span className="mr-2">📋</span>
          Manage Bookings
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalBookings}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <span className="text-2xl">�</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Paid Orders</p>
              <p className="text-3xl font-bold text-gray-900">{stats.paidOrders || 0}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <span className="text-2xl">�</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Visits</p>
              <p className="text-3xl font-bold text-gray-900">{stats.pendingVisits || 0}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <span className="text-2xl">⏳</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900">₹{stats.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <span className="text-2xl">💎</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Bookings</h2>
        {recentBookings.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📅</div>
            <p className="text-gray-600">No recent bookings found.</p>
            <p className="text-sm text-gray-500 mt-2">Bookings will appear here when customers make reservations.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentBookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">{booking.customerName}</h3>
                  <p className="text-sm text-gray-600">Date: {booking.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">₹{booking.amount}</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                    booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {booking.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Manage Bookings</h3>
          <p className="text-gray-600 mb-4">View and manage all your bookings</p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            View Bookings
          </button>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg text-center">
          <div className="text-4xl mb-4">⚙️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Settings</h3>
          <p className="text-gray-600 mb-4">Update your establishment details</p>
          <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
            Manage Settings
          </button>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg text-center">
          <div className="text-4xl mb-4">📈</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics</h3>
          <p className="text-gray-600 mb-4">View detailed business analytics</p>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
            View Analytics
          </button>
        </div>
      </div>

      {/* Business Status */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Business Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <span className="text-2xl mr-3">✅</span>
              <div>
                <h3 className="font-medium text-green-800">Establishment Active</h3>
                <p className="text-sm text-green-600">Your establishment is accepting bookings</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🔔</span>
              <div>
                <h3 className="font-medium text-blue-800">Notifications Enabled</h3>
                <p className="text-sm text-blue-600">You'll receive booking notifications</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;