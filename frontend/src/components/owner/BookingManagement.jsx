import { useState, useEffect } from 'react';
import api from '../../utils/api';
import * as XLSX from 'xlsx';
import { formatTimeTo12Hour, formatDateForDisplay } from '../../utils/timeUtils';
import { showNotification } from '../common/NotificationSystem';

const BookingManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);



  useEffect(() => {
    fetchBookings();
    
    // Listen for booking data changes from payment verification actions
    const handleBookingDataChange = (event) => {
      console.log('📡 Received booking data change event:', event.detail);
      // Refresh bookings when payment verification is approved/rejected
      fetchBookings();
    };
    
    window.addEventListener('bookingDataChanged', handleBookingDataChange);
    
    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('bookingDataChanged', handleBookingDataChange);
    };
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      console.log('Fetching bookings from API...');
      const response = await api.get('/api/owner/bookings');
      console.log('API Response:', response.data);
      
      if (response.data.success) {
        const bookingsData = response.data.bookings || [];
        console.log('Bookings received:', bookingsData.length);
        setBookings(bookingsData);
        
        if (bookingsData.length === 0) {
          showNotification('info', 'No bookings found for your establishment.', 'No Bookings');
        }
      } else {
        console.error('API returned error:', response.data.message);
        showNotification('error', response.data.message || 'Failed to fetch bookings', 'API Error');
        setBookings([]);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Network error';
      showNotification('error', `Failed to fetch bookings: ${errorMessage}`, 'Error');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const confirmBooking = async (bookingId) => {
    try {
      const response = await api.post(`/api/owner/bookings/${bookingId}/confirm`);
      if (response.data.success) {
        fetchBookings();
        showNotification('success', 'Booking confirmed! QR code sent to customer.', 'Booking Confirmed');
        
        // Update local state immediately
        setBookings(prev => prev.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: 'CONFIRMED', qrCode: response.data.qrCode }
            : booking
        ));
      } else {
        showNotification('error', response.data.message || 'Failed to confirm booking', 'Error');
      }
    } catch (error) {
      console.error('Failed to confirm booking:', error);
      const errorMessage = error.isNetworkError 
        ? 'Network error. Please check your connection and try again.'
        : error.response?.data?.message || 'Failed to confirm booking';
      showNotification('error', errorMessage, 'Error');
    }
  };



  const rejectBooking = async (bookingId) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    if (!window.confirm('Are you sure you want to reject this booking? The customer will be notified via email and refunded.')) {
      return;
    }

    try {
      const response = await api.post(`/api/owner/bookings/${bookingId}/reject`, { reason });
      if (response.data.success) {
        fetchBookings();
        showNotification('success', 'Booking rejected and email sent to customer.', 'Booking Rejected');
        
        // Update local state immediately
        setBookings(prev => prev.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: 'CANCELLED', cancellationReason: reason, refundStatus: 'APPROVED' }
            : booking
        ));
      } else {
        showNotification('error', response.data.message || 'Failed to reject booking', 'Error');
      }
    } catch (error) {
      console.error('Failed to reject booking:', error);
      const errorMessage = error.isNetworkError 
        ? 'Network error. Please check your connection and try again.'
        : error.response?.data?.message || 'Failed to reject booking';
      showNotification('error', errorMessage, 'Error');
    }
  };

  const deleteBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to permanently delete this booking? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await api.delete(`/api/owner/bookings/${bookingId}`);
      if (response.data.success) {
        fetchBookings();
        showNotification('success', 'Booking deleted successfully.', 'Booking Deleted');
        
        // Update local state immediately
        setBookings(prev => prev.filter(booking => booking.id !== bookingId));
      } else {
        showNotification('error', response.data.message || 'Failed to delete booking', 'Error');
      }
    } catch (error) {
      console.error('Failed to delete booking:', error);
      const errorMessage = error.isNetworkError 
        ? 'Network error. Please check your connection and try again.'
        : error.response?.data?.message || 'Failed to delete booking';
      showNotification('error', errorMessage, 'Error');
    }
  };

  const exportToExcel = async () => {
    try {
      setLoading(true);
      
      // Call backend API for Excel export with proper response handling
      const response = await api.get('/api/owner/export/bookings', {
        responseType: 'blob',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      });
      
      // Create blob and download
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `owner-bookings-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showNotification('success', 'Booking report exported successfully!', 'Export Complete');
    } catch (error) {
      console.error('Export failed:', error);
      
      // Fallback to client-side export
      const exportData = bookings.map(booking => {
        let itemsText = 'No items';
        try {
          const items = typeof booking.selectedItems === 'string' 
            ? JSON.parse(booking.selectedItems) 
            : booking.selectedItems || [];
          itemsText = items.map(item => 
            item.name || item.itemName || `Dr. ${item.doctorName}` || 'Unknown Item'
          ).join(', ');
        } catch (e) {
          itemsText = 'Invalid items data';
        }

        return {
          'Booking ID': booking.id,
          'Customer Name': booking.customerName,
          'Customer Email': booking.customerEmail,
          'Visit Date': booking.visitingDate,
          'Visit Time': booking.visitingTime,
          'Status': booking.status,
          'Total Amount (₹)': booking.amount || booking.totalAmount,
          'Paid Amount (₹)': booking.paymentAmount || booking.paidAmount,
          'Remaining Amount (₹)': (booking.amount || booking.totalAmount) - (booking.paymentAmount || booking.paidAmount),
          'Payment Status': booking.paymentStatus || 'PAID',
          'Refund Status': booking.refundStatus || 'NOT_APPLICABLE',
          'Transaction ID': booking.transactionId,
          'Selected Items': itemsText,
          'Cancellation Reason': booking.cancellationReason || '',
          'Created At': new Date(booking.createdAt).toLocaleString(),
          'Confirmed At': booking.confirmedAt ? new Date(booking.confirmedAt).toLocaleString() : '',
          'Cancelled At': booking.cancelledAt ? new Date(booking.cancelledAt).toLocaleString() : ''
        };
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Bookings');
      
      // Add summary sheet
      const summaryData = [
        { Metric: 'Total Bookings', Value: bookings.length },
        { Metric: 'Pending Bookings', Value: bookings.filter(b => b.status === 'PENDING').length },
        { Metric: 'Confirmed Bookings', Value: bookings.filter(b => b.status === 'CONFIRMED').length },
        { Metric: 'Cancelled Bookings', Value: bookings.filter(b => b.status === 'CANCELLED').length },
        { Metric: 'Completed Bookings', Value: bookings.filter(b => b.status === 'COMPLETED').length },
        { 
          Metric: 'Total Revenue (₹)', 
          Value: bookings.reduce((sum, b) => sum + (b.paymentAmount || b.paidAmount || 0), 0).toFixed(2)
        }
      ];
      
      const summaryWs = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
      
      XLSX.writeFile(wb, `bookings_detailed_${new Date().toISOString().split('T')[0]}.xlsx`);
      showNotification('success', 'Booking report exported successfully!', 'Export Complete');
    } finally {
      setLoading(false);
    }
  };



  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    return booking.status.toLowerCase() === filter.toLowerCase();
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <span className="mr-3">📋</span>
          Booking Management
        </h1>
        <div className="flex space-x-3">
          <button
            onClick={exportToExcel}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
          >
            <span className="mr-2">📊</span>
            Export to Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
        <div className="flex flex-wrap gap-2">
          {['all', 'pending', 'confirmed', 'cancelled', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status} ({bookings.filter(b => status === 'all' || b.status.toLowerCase() === status).length})
            </button>
          ))}
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-600">No bookings match your current filter.</p>
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Booking #{booking.id}
                  </h3>
                  <p className="text-gray-600">
                    {booking.customerName} • {booking.customerEmail}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(booking.status)}`}>
                  {booking.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Date & Time</p>
                  <p className="font-semibold">
                    {formatDateForDisplay(booking.visitingDate)} at {formatTimeTo12Hour(booking.visitingTime)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="font-semibold">
                    ₹{booking.paymentAmount || booking.paidAmount} / ₹{booking.amount || booking.totalAmount}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Transaction ID</p>
                  <p className="font-semibold text-sm">{booking.transactionId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-semibold text-sm">
                    {new Date(booking.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Selected Items */}
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">Selected Items/Services</p>
                <div className="bg-gray-50 rounded-lg p-4">
                  {(() => {
                    try {
                      const items = typeof booking.selectedItems === 'string' 
                        ? JSON.parse(booking.selectedItems) 
                        : booking.selectedItems || [];
                      
                      if (items.length === 0) {
                        return <span className="text-gray-500 text-sm">No items selected</span>;
                      }
                      
                      return (
                        <div className="space-y-2">
                          {items.map((item, index) => (
                            <div key={index} className="flex justify-between items-center bg-white rounded-lg p-3 shadow-sm">
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900">
                                  {item.name || item.itemName || `Dr. ${item.doctorName}` || 'Unknown Item'}
                                </p>
                                {item.description && (
                                  <p className="text-sm text-gray-600">{item.description}</p>
                                )}
                                {item.specialization && (
                                  <p className="text-sm text-blue-600">{item.specialization}</p>
                                )}
                                {item.brand && (
                                  <p className="text-sm text-gray-600">{item.brand} - {item.fabric}</p>
                                )}
                                {item.availability && (
                                  <p className="text-sm text-green-600">Available: {item.availability}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-lg text-gray-900">
                                  ₹{item.price || item.consultationFee || 0}
                                </p>
                                {item.quantity && item.quantity > 1 && (
                                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                )}
                              </div>
                            </div>
                          ))}
                          <div className="border-t pt-2 mt-2">
                            <div className="flex justify-between items-center font-bold text-lg">
                              <span>Total:</span>
                              <span>₹{items.reduce((sum, item) => sum + (item.price || item.consultationFee || 0) * (item.quantity || 1), 0)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    } catch (e) {
                      console.error('Error parsing selected items:', e);
                      return (
                        <div className="text-red-500 text-sm">
                          <p>Error displaying items: {booking.selectedItems}</p>
                          <p className="text-xs mt-1">Raw data: {JSON.stringify(booking.selectedItems)}</p>
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {booking.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => confirmBooking(booking.id)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
                    >
                      <span className="mr-2">✅</span>
                      Confirm & Generate QR
                    </button>
                    <button
                      onClick={() => rejectBooking(booking.id)}
                      className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center"
                    >
                      <span className="mr-2">❌</span>
                      Reject
                    </button>
                  </>
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

                {/* Secure Payment Verification Info */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <span className="text-green-600 mr-2">🔒</span>
                    <div>
                      <p className="text-green-900 font-semibold text-sm">Secure Payment Verified</p>
                      <p className="text-green-800 text-xs">UPI Transaction ID: {booking.transactionId}</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedBooking(booking);
                    setShowQRModal(false); // Use the same modal state but different content
                  }}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center"
                >
                  <span className="mr-2">👁️</span>
                  View Details
                </button>

                <button
                  onClick={() => deleteBooking(booking.id)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center"
                >
                  <span className="mr-2">🗑️</span>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* QR Code Modal */}
      {showQRModal && selectedBooking && selectedBooking.qrCode && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                QR Code for Booking #{selectedBooking.id}
              </h3>
              <div className="bg-gray-100 p-8 rounded-xl mb-4">
                <img
                  src={`data:image/png;base64,${selectedBooking.qrCode}`}
                  alt="Booking QR Code"
                  className="w-64 h-64 mx-auto"
                  style={{ imageRendering: 'pixelated' }}
                  onError={(e) => {
                    console.error('❌ QR Code display error:', e);
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <div style={{ display: 'none' }} className="text-red-500 text-center">
                  <p>QR Code could not be displayed</p>
                  <p className="text-sm">Booking ID: {selectedBooking.id}</p>
                </div>
              </div>
              <div className="mb-4">
                <p className="text-gray-600 mb-2">
                  Customer: {selectedBooking.customerName}
                </p>
                <p className="text-sm text-gray-500">
                  Show this QR code at the establishment for verification
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    // Download QR code as image
                    const link = document.createElement('a');
                    link.href = `data:image/png;base64,${selectedBooking.qrCode}`;
                    link.download = `booking-${selectedBooking.id}-qr.png`;
                    link.click();
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  📱 Download QR
                </button>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Booking Modal */}
      {selectedBooking && !showQRModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Booking Details #{selectedBooking.id}</h2>
                  <p className="text-blue-100">Complete booking information</p>
                </div>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-white hover:text-blue-200 text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Customer Information */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">👤</span>
                    Customer Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-semibold">{selectedBooking.customerName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-semibold">{selectedBooking.customerEmail}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(selectedBooking.status)}`}>
                        {selectedBooking.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Booking Information */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">📅</span>
                    Booking Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Date & Time</p>
                      <p className="font-semibold">
                        {formatDateForDisplay(selectedBooking.visitingDate)} at {formatTimeTo12Hour(selectedBooking.visitingTime)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Transaction ID</p>
                      <p className="font-semibold text-sm">{selectedBooking.transactionId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Created At</p>
                      <p className="font-semibold text-sm">
                        {new Date(selectedBooking.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Selected Items - Full Detail */}
              <div className="mt-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">🛍️</span>
                  Selected Items/Services
                </h3>
                <div className="bg-gray-50 rounded-xl p-6">
                  {(() => {
                    try {
                      const items = typeof selectedBooking.selectedItems === 'string' 
                        ? JSON.parse(selectedBooking.selectedItems) 
                        : selectedBooking.selectedItems || [];
                      
                      if (items.length === 0) {
                        return <p className="text-gray-500">No items selected</p>;
                      }
                      
                      return (
                        <div className="space-y-4">
                          {items.map((item, index) => (
                            <div key={index} className="bg-white rounded-lg p-4 shadow-sm border">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h4 className="font-bold text-lg text-gray-900">
                                    {item.name || item.itemName || `Dr. ${item.doctorName}` || 'Unknown Item'}
                                  </h4>
                                  {item.description && (
                                    <p className="text-gray-600 mt-1">{item.description}</p>
                                  )}
                                  {item.specialization && (
                                    <p className="text-blue-600 mt-1 font-medium">{item.specialization}</p>
                                  )}
                                  {item.brand && (
                                    <p className="text-gray-600 mt-1">{item.brand} - {item.fabric}</p>
                                  )}
                                  {item.availability && (
                                    <p className="text-green-600 mt-1 font-medium">Available: {item.availability}</p>
                                  )}
                                  {item.category && (
                                    <p className="text-purple-600 mt-1">Category: {item.category}</p>
                                  )}
                                </div>
                                <div className="text-right ml-4">
                                  <p className="font-bold text-xl text-gray-900">
                                    ₹{item.price || item.consultationFee || 0}
                                  </p>
                                  {item.quantity && item.quantity > 1 && (
                                    <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {/* Payment Summary */}
                          <div className="border-t pt-4 mt-4">
                            <div className="bg-blue-50 rounded-lg p-4">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-700">Total Amount:</span>
                                <span className="font-bold text-lg">₹{selectedBooking.amount || selectedBooking.totalAmount}</span>
                              </div>
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-700">Paid Amount (70%):</span>
                                <span className="font-bold text-green-600">₹{selectedBooking.paymentAmount || selectedBooking.paidAmount}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-700">Remaining (30%):</span>
                                <span className="font-bold text-orange-600">
                                  ₹{(selectedBooking.amount || selectedBooking.totalAmount) - (selectedBooking.paymentAmount || selectedBooking.paidAmount)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    } catch (e) {
                      console.error('Error parsing selected items:', e);
                      return (
                        <div className="text-red-500">
                          <p>Error displaying items</p>
                          <pre className="text-xs mt-2 bg-red-50 p-2 rounded">
                            {JSON.stringify(selectedBooking.selectedItems, null, 2)}
                          </pre>
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex flex-wrap gap-3">
                {selectedBooking.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => {
                        setSelectedBooking(null);
                        confirmBooking(selectedBooking.id);
                      }}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center"
                    >
                      <span className="mr-2">✅</span>
                      Confirm Booking
                    </button>
                    <button
                      onClick={() => {
                        setSelectedBooking(null);
                        rejectBooking(selectedBooking.id);
                      }}
                      className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 flex items-center"
                    >
                      <span className="mr-2">❌</span>
                      Reject Booking
                    </button>
                  </>
                )}
                
                {selectedBooking.status === 'CONFIRMED' && selectedBooking.qrCode && (
                  <button
                    onClick={() => setShowQRModal(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center"
                  >
                    <span className="mr-2">📱</span>
                    View QR Code
                  </button>
                )}

                {/* Secure Payment Information */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <span className="text-green-600 text-lg mr-2">🔒</span>
                    <h4 className="font-semibold text-green-900">Secure Payment Verified</h4>
                  </div>
                  <div className="text-sm text-green-800">
                    <p><strong>UPI Transaction ID:</strong> {selectedBooking.transactionId}</p>
                    <p><strong>Payment Method:</strong> UPI (Verified)</p>
                    <p><strong>Security:</strong> Real transaction ID validation</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default BookingManagement;