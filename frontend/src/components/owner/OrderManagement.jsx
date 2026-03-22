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
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/api/owner/orders');
      console.log('📦 Orders response received:', response.data);
      const ordersData = response.data.orders || [];
      console.log('📦 Processing', ordersData.length, 'orders');
      
      // Debug first order to see data structure
      if (ordersData.length > 0) {
        console.log('📦 Sample order data:', ordersData[0]);
      }
      
      setOrders(ordersData);
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

  const cancelBooking = async (bookingId, reason) => {
    if (!reason || reason.trim().length < 10) {
      alert('Please provide a detailed reason for cancellation (minimum 10 characters)');
      return;
    }

    if (!window.confirm('Are you sure you want to cancel this booking? The customer will be notified and receive a full refund.')) {
      return;
    }

    try {
      const response = await api.put(`/api/owner/orders/${bookingId}/cancel`, {
        reason: reason.trim()
      });

      if (response.data.success) {
        alert('Booking cancelled successfully! Customer has been notified and will receive full refund.');
        fetchOrders(); // Refresh the orders list
        fetchStats(); // Refresh statistics
      } else {
        alert('Failed to cancel booking: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel booking: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleCancelBooking = (order) => {
    const reason = prompt(
      `Cancel booking for ${order.customerName}?\n\n` +
      `Booking Details:\n` +
      `- Date: ${order.visitingDate} at ${order.visitingTime}\n` +
      `- Amount: ₹${(order.amount || 0).toFixed(2)}\n\n` +
      `Please provide a detailed reason for cancellation:`
    );
    
    if (reason !== null) { // User didn't click Cancel
      cancelBooking(order.id, reason);
    }
  };

  const deleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to permanently delete this order? This action cannot be undone.')) {
      return;
    }

    try {
      console.log('🗑️ Attempting to delete order:', orderId);
      const response = await api.delete(`/api/owner/bookings/${orderId}`);
      console.log('🗑️ Delete response:', response.data);
      
      if (response.data.success) {
        alert('Order deleted successfully.');
        fetchOrders(); // Refresh the orders list
        fetchStats(); // Refresh statistics
      } else {
        console.error('❌ Delete failed:', response.data.message);
        alert('Failed to delete order: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Error deleting order:', error);
      console.error('❌ Error response:', error.response?.data);
      
      let errorMessage = 'Unknown error occurred';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert('Failed to delete order: ' + errorMessage);
    }
  };

  const canCancelBooking = (order) => {
    // Can cancel if booking is PENDING or CONFIRMED, but not CANCELLED or COMPLETED
    return order.status === 'PENDING' || order.status === 'CONFIRMED';
  };

  const canMarkVisitCompleted = (order) => {
    // Can mark as completed if booking is CONFIRMED
    return order.status === 'CONFIRMED';
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setSelectedOrder(null);
    setShowDetailsModal(false);
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
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items Ordered</th>
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
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs">
                        <div className="font-medium text-gray-800 mb-1">
                          {order.establishmentType === 'HOTEL' && '🏨 Hotel Items:'}
                          {order.establishmentType === 'HOSPITAL' && '🏥 Medical Services:'}
                          {order.establishmentType === 'SHOP' && '🛍️ Shop Items:'}
                          {!order.establishmentType && '📦 Items:'}
                        </div>
                        <div className="text-gray-600 text-xs leading-relaxed">
                          {order.itemsDisplay || order.selectedItems || 'No items specified'}
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
                      <div className="flex gap-2 flex-wrap">
                        {canMarkVisitCompleted(order) && (
                          <button
                            onClick={() => markVisitCompleted(order.id)}
                            className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors text-xs"
                          >
                            ✓ Mark Visited
                          </button>
                        )}
                        
                        {canCancelBooking(order) && (
                          <button
                            onClick={() => handleCancelBooking(order)}
                            className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-colors text-xs"
                          >
                            ✕ Cancel
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleViewDetails(order)}
                          className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors text-xs"
                        >
                          👁 View Details
                        </button>
                        
                        <button
                          onClick={() => deleteOrder(order.id)}
                          className="bg-gray-600 text-white px-3 py-1 rounded-lg hover:bg-gray-700 transition-colors text-xs"
                        >
                          🗑️ Delete
                        </button>
                        
                        {order.status === 'COMPLETED' && (
                          <span className="text-green-600 font-medium text-xs">✓ Completed</span>
                        )}
                        
                        {order.status === 'CANCELLED' && (
                          <span className="text-red-600 font-medium text-xs">✕ Cancelled</span>
                        )}
                        
                        {!canMarkVisitCompleted(order) && !canCancelBooking(order) && order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                          <span className="text-gray-400 text-xs">No actions available</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Booking Details</h2>
                <button
                  onClick={closeDetailsModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Customer Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="mr-2">👤</span>Customer Information
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{selectedOrder.customerName || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{selectedOrder.customerEmail || 'No email'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium">{selectedOrder.customerPhone || 'Not provided'}</span>
                  </div>
                </div>
              </div>

              {/* Visit Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="mr-2">📅</span>Visit Information
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">
                      {selectedOrder.visitingDate ? new Date(selectedOrder.visitingDate).toLocaleDateString() : 'No date'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time:</span>
                    <span className="font-medium">{selectedOrder.visitingTime || 'No time'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">2 hours</span>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="mr-2">💰</span>Payment Information
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-medium text-lg">₹{(selectedOrder.amount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paid Amount (70%):</span>
                    <span className="font-medium text-green-600">₹{(selectedOrder.paymentAmount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Remaining (30%):</span>
                    <span className="font-medium text-orange-600">
                      ₹{((selectedOrder.amount || 0) - (selectedOrder.paymentAmount || 0)).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction ID:</span>
                    <span className="font-mono text-sm bg-white px-2 py-1 rounded">
                      {selectedOrder.transactionId || 'No transaction ID'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Status:</span>
                    <span className={`px-2 py-1 rounded text-sm font-medium ${
                      selectedOrder.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedOrder.paymentStatus || 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Booking Status */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="mr-2">📋</span>Booking Status
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Status:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedOrder)}`}>
                      {getStatusText(selectedOrder)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Booking ID:</span>
                    <span className="font-mono text-sm">#{selectedOrder.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium">
                      {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : 'Unknown'}
                    </span>
                  </div>
                  {selectedOrder.confirmedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Confirmed:</span>
                      <span className="font-medium">
                        {new Date(selectedOrder.confirmedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Items Ordered */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="mr-2">🛍️</span>Items Ordered
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-gray-700 leading-relaxed">
                    {selectedOrder.itemsDisplay || selectedOrder.selectedItems || 'No items specified'}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                {canMarkVisitCompleted(selectedOrder) && (
                  <button
                    onClick={() => {
                      markVisitCompleted(selectedOrder.id);
                      closeDetailsModal();
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    ✓ Mark Visited
                  </button>
                )}
                
                {canCancelBooking(selectedOrder) && (
                  <button
                    onClick={() => {
                      handleCancelBooking(selectedOrder);
                      closeDetailsModal();
                    }}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    ✕ Cancel Booking
                  </button>
                )}
                
                <button
                  onClick={() => {
                    deleteOrder(selectedOrder.id);
                    closeDetailsModal();
                  }}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  🗑️ Delete
                </button>
                
                <button
                  onClick={closeDetailsModal}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;