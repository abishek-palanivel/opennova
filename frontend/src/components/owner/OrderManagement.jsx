import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import LoadingSpinner from '../common/LoadingSpinner';

const OrderManagement = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/api/owner/orders');
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      
      // Handle authentication errors
      if (error.response?.status === 401) {
        console.error('Owner authentication required');
      } else if (error.response?.status === 404) {
        console.log('No orders endpoint found - using empty orders');
        setOrders([]);
      } else {
        console.error('Failed to fetch orders:', error.response?.data?.message || error.message);
      }
      
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/owner/visit-stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      
      // Handle different error types
      if (error.response?.status === 401) {
        console.error('Owner authentication required for stats');
      } else if (error.response?.status === 404) {
        console.log('No stats endpoint found - using default stats');
        setStats({
          totalBookings: 0,
          confirmedBookings: 0,
          completedVisits: 0,
          pendingVisits: 0,
          totalRevenue: 0,
          visitCompletionRate: 0
        });
      }
    }
  };

  const markVisitCompleted = async (bookingId) => {
    try {
      await api.put(`/api/owner/orders/${bookingId}/visit-completed`);
      fetchOrders();
      fetchStats();
      alert('Visit marked as completed successfully!');
    } catch (error) {
      console.error('Error marking visit as completed:', error);
      alert('Failed to mark visit as completed: ' + (error.response?.data?.message || error.message));
    }
  };

  const getFilteredOrders = () => {
    let filtered = orders;

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(order => {
        switch (filter) {
          case 'paid':
            return order.status === 'CONFIRMED' || order.paymentStatus === 'PAID';
          case 'pending-visit':
            return order.status === 'CONFIRMED' && !order.visited;
          case 'completed':
            return order.status === 'COMPLETED' || order.visited;
          default:
            return true;
        }
      });
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(order =>
        (order.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.customerEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.transactionId || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const getStatusColor = (order) => {
    if (order.status === 'COMPLETED') return 'bg-green-100 text-green-800';
    if (order.status === 'CONFIRMED') return 'bg-yellow-100 text-yellow-800';
    if (order.status === 'PENDING') return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (order) => {
    if (order.status === 'COMPLETED') return 'Visit Completed';
    if (order.status === 'CONFIRMED') return 'Visit Required';
    if (order.status === 'PENDING') return 'Pending';
    return order.status;
  };

  const getEstablishmentIcon = () => {
    switch (user?.role) {
      case 'HOTEL_OWNER': return '🏨';
      case 'HOSPITAL_OWNER': return '🏥';
      case 'SHOP_OWNER': return '🛍️';
      default: return '🏢';
    }
  };

  const getEstablishmentType = () => {
    switch (user?.role) {
      case 'HOTEL_OWNER': return 'Hotel';
      case 'HOSPITAL_OWNER': return 'Hospital';
      case 'SHOP_OWNER': return 'Shop';
      default: return 'Establishment';
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const filteredOrders = getFilteredOrders();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="text-4xl mr-4">{getEstablishmentIcon()}</div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
              <p className="text-gray-600">Manage your {getEstablishmentType().toLowerCase()} bookings and visits</p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Bookings</p>
                <p className="text-3xl font-bold">{stats.totalBookings || 0}</p>
              </div>
              <div className="text-blue-200 text-3xl">📊</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Paid Orders</p>
                <p className="text-3xl font-bold">{stats.confirmedBookings || 0}</p>
              </div>
              <div className="text-green-200 text-3xl">💰</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium">Pending Visits</p>
                <p className="text-3xl font-bold">{stats.pendingVisits || 0}</p>
              </div>
              <div className="text-yellow-200 text-3xl">⏳</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Total Revenue</p>
                <p className="text-3xl font-bold">₹{(stats.totalRevenue || 0).toFixed(0)}</p>
              </div>
              <div className="text-purple-200 text-3xl">💎</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Orders ({orders.length})
            </button>
            <button
              onClick={() => setFilter('paid')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'paid' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Paid ({orders.filter(o => o.status === 'CONFIRMED' || o.paymentStatus === 'PAID').length})
            </button>
            <button
              onClick={() => setFilter('pending-visit')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'pending-visit' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending Visits ({orders.filter(o => o.status === 'CONFIRMED' && !o.visited).length})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'completed' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completed ({orders.filter(o => o.status === 'COMPLETED' || o.visited).length})
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">{getEstablishmentIcon()}</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
            <p className="text-gray-600">
              {filter === 'all' ? 'No orders have been placed yet.' : `No orders match the selected filter.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visit Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">QR Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {(order.customerName || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{order.customerName || 'Unknown'}</div>
                          <div className="text-sm text-gray-500">{order.customerEmail || 'No email'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">{order.visitingDate ? new Date(order.visitingDate).toLocaleDateString() : 'No date'}</div>
                        <div className="text-gray-500">{order.visitingTime || 'No time'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">₹{(order.amount || 0).toFixed(2)}</div>
                        <div className="text-gray-500">Paid: ₹{(order.paymentAmount || 0).toFixed(2)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order)}`}>
                        {getStatusText(order)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {order.qrCode ? (
                        <button
                          onClick={() => {
                            const newWindow = window.open();
                            newWindow.document.write(`
                              <html>
                                <head><title>QR Code - ${order.customerName}</title></head>
                                <body style="display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f3f4f6;">
                                  <div style="text-align: center; background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
                                    <h2 style="margin-bottom: 1rem; color: #374151;">Booking QR Code</h2>
                                    <img src="data:image/png;base64,${order.qrCode}" style="max-width: 300px; border: 1px solid #e5e7eb; border-radius: 0.5rem;" />
                                    <p style="margin-top: 1rem; color: #6b7280; font-size: 0.875rem;">Customer: ${order.customerName || 'Unknown'}</p>
                                    <p style="color: #6b7280; font-size: 0.875rem;">Date: ${order.visitingDate ? new Date(order.visitingDate).toLocaleDateString() : 'No date'}</p>
                                  </div>
                                </body>
                              </html>
                            `);
                          }}
                          className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium hover:bg-blue-200 transition-colors"
                        >
                          View QR
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs">No QR</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {order.status === 'CONFIRMED' ? (
                        <button
                          onClick={() => markVisitCompleted(order.id)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Mark Visited
                        </button>
                      ) : order.status === 'COMPLETED' ? (
                        <span className="text-green-600 font-medium">✓ Completed</span>
                      ) : (
                        <span className="text-gray-400">No action needed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Visit Completion Rate */}
      {stats.visitCompletionRate !== undefined && (
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Visit Completion Rate</h3>
          <div className="flex items-center">
            <div className="flex-1 bg-gray-200 rounded-full h-4 mr-4">
              <div 
                className="bg-gradient-to-r from-green-500 to-green-600 h-4 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(stats.visitCompletionRate, 100)}%` }}
              ></div>
            </div>
            <span className="text-lg font-semibold text-gray-900">
              {(stats.visitCompletionRate || 0).toFixed(1)}%
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {stats.completedVisits} out of {stats.confirmedBookings} paid bookings have been completed
          </p>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;