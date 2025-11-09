import { useState, useEffect } from 'react';
import api from '../../utils/api';
import QRCodeModal from './QRCodeModal';
import { formatTimeTo12Hour, formatDateForDisplay } from '../../utils/timeUtils';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await api.get('/api/user/bookings');
      setBookings(response.data);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    const booking = bookings.find(b => b.id === bookingId);
    const policy = getCancellationPolicy(booking);
    
    const isMoreThan2Hours = canCancelBooking(booking);
    const confirmMessage = isMoreThan2Hours 
      ? `Are you sure you want to cancel this booking?\n\n✅ You will receive a FULL REFUND within 24 hours.\n\n📧 Both you and the establishment owner will be notified via email.`
      : `Are you sure you want to cancel this booking?\n\n❌ NO REFUND will be provided as you're cancelling within 2 hours of the booking time.\n\n📧 Both you and the establishment owner will be notified via email.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.put(`/api/user/bookings/${bookingId}/cancel`);
      
      if (response.data.success) {
        // Show success message
        alert(isMoreThan2Hours 
          ? '✅ Booking cancelled successfully! You will receive a full refund within 24 hours. Confirmation emails have been sent.'
          : '✅ Booking cancelled successfully! No refund will be processed due to the 2-hour policy. Confirmation emails have been sent.'
        );
        fetchBookings(); // Refresh the list
      } else {
        throw new Error(response.data.message || 'Failed to cancel booking');
      }
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      alert(`❌ Failed to cancel booking: ${error.response?.data?.message || error.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'CONFIRMED': 'bg-green-100 text-green-800 border-green-200',
      'PENDING': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'CANCELLED': 'bg-red-100 text-red-800 border-red-200',
      'COMPLETED': 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getTypeIcon = (type) => {
    const icons = {
      'HOTEL': '🏨',
      'HOSPITAL': '🏥',
      'SHOP': '🛍️'
    };
    return icons[type] || '🏢';
  };

  const canCancelBooking = (booking) => {
    if (booking.status !== 'CONFIRMED' && booking.status !== 'PENDING') {
      return false;
    }
    
    try {
      // Parse booking date and time
      const bookingDateTime = new Date(`${booking.visitingDate}T${booking.visitingTime}`);
      const now = new Date();
      const timeDiff = bookingDateTime.getTime() - now.getTime();
      const hoursDiff = timeDiff / (1000 * 3600);
      
      return true; // Always allow cancellation, but refund policy varies
    } catch (error) {
      console.error('Error parsing booking time:', error);
      return false;
    }
  };

  const getTimeUntilBooking = (booking) => {
    try {
      const bookingDateTime = new Date(`${booking.visitingDate}T${booking.visitingTime}`);
      const now = new Date();
      const timeDiff = bookingDateTime.getTime() - now.getTime();
      const hoursDiff = timeDiff / (1000 * 3600);
      
      if (hoursDiff < 0) return 'Past booking';
      if (hoursDiff < 1) return `${Math.round(hoursDiff * 60)} minutes`;
      return `${Math.round(hoursDiff)} hours`;
    } catch (error) {
      return 'Unknown';
    }
  };

  const getCancellationPolicy = (booking) => {
    const timeUntil = getTimeUntilBooking(booking);
    const isMoreThan2Hours = canCancelBooking(booking);
    
    if (booking.status === 'CANCELLED') {
      return {
        canCancel: false,
        message: `Cancelled - Refund: ${booking.refundStatus || 'Processing'}`,
        color: 'text-red-600'
      };
    }
    
    if (isMoreThan2Hours) {
      return {
        canCancel: true,
        message: `Can cancel (${timeUntil} left) - Full refund`,
        color: 'text-green-600'
      };
    } else {
      return {
        canCancel: true, // Always allow cancellation
        message: `Can cancel (${timeUntil} left) - No refund`,
        color: 'text-orange-600'
      };
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'ALL') return true;
    return booking.status === filter;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Loading Your Bookings</h3>
          <p className="text-slate-600">Fetching your booking history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-fade-in-up">
        {/* Enhanced Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            My Bookings 📅
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 font-medium max-w-2xl mx-auto">
            Track, manage, and review all your establishment bookings in one place
          </p>
          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 text-slate-500 text-sm sm:text-base">
            <span className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
              {bookings.length} Total Bookings
            </span>
            <span className="hidden sm:inline">•</span>
            <span>{bookings.filter(b => b.status === 'CONFIRMED').length} Active</span>
          </div>
        </div>

        {/* Enhanced Filter Tabs */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl border border-white/60 p-4 sm:p-6 lg:p-8">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-4 sm:mb-6 text-center">Filter by Status</h3>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {[
              { key: 'ALL', label: '🌟 All', color: 'from-slate-500 to-slate-600' },
              { key: 'PENDING', label: '⏳ Pending', color: 'from-yellow-500 to-orange-500' },
              { key: 'CONFIRMED', label: '✅ Confirmed', color: 'from-green-500 to-emerald-600' },
              { key: 'COMPLETED', label: '🎉 Completed', color: 'from-blue-500 to-indigo-600' },
              { key: 'CANCELLED', label: '❌ Cancelled', color: 'from-red-500 to-red-600' }
            ].map((status) => (
              <button
                key={status.key}
                onClick={() => setFilter(status.key)}
                className={`px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 text-xs sm:text-sm lg:text-base ${
                  filter === status.key
                    ? `bg-gradient-to-r ${status.color} text-white shadow-lg scale-105`
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 hover:border-slate-300'
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings List */}
        <div className="space-y-4 sm:space-y-6">
          {filteredBookings.length === 0 ? (
            <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl sm:rounded-3xl p-8 sm:p-12 lg:p-16 text-center shadow-xl border border-white/60">
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8">
                <span className="text-4xl sm:text-6xl">📅</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 sm:mb-4">No bookings found</h3>
              <p className="text-lg sm:text-xl text-slate-600 mb-6 sm:mb-8 max-w-md mx-auto">
                {filter === 'ALL' 
                  ? "Ready to make your first booking? Explore amazing establishments near you!" 
                  : `No ${filter.toLowerCase()} bookings found. Try a different filter.`}
              </p>
              <div className="space-y-3 sm:space-y-4">
                <a href="/user/browse" className="btn-primary inline-flex items-center text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4">
                  🔍 Browse Establishments
                </a>
                {filter !== 'ALL' && (
                  <button
                    onClick={() => setFilter('ALL')}
                    className="block mx-auto text-blue-600 hover:text-blue-700 font-medium text-sm sm:text-base"
                  >
                    View All Bookings
                  </button>
                )}
              </div>
            </div>
          ) : (
            filteredBookings.map((booking, index) => (
              <div 
                key={booking.id} 
                className="group bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl hover:shadow-2xl border border-white/60 p-4 sm:p-6 lg:p-8 transition-all duration-500 transform hover:-translate-y-2 hover:scale-[1.02]"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Booking Header */}
                <div className="flex flex-col sm:flex-row items-start space-y-3 sm:space-y-0 sm:space-x-4 lg:space-x-6 mb-4 sm:mb-6">
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl lg:text-4xl shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0 ${
                    booking.establishmentType === 'HOTEL' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                    booking.establishmentType === 'HOSPITAL' ? 'bg-gradient-to-br from-red-500 to-red-600' :
                    'bg-gradient-to-br from-green-500 to-green-600'
                  }`}>
                    {getTypeIcon(booking.establishmentType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-1 sm:mb-2">
                      {booking.establishmentName}
                    </h3>
                    <p className="text-slate-600 mb-2 sm:mb-4 flex items-center text-sm sm:text-base">
                      <span className="mr-2">📍</span>
                      <span className="truncate">{booking.establishmentAddress}</span>
                    </p>
                  </div>
                </div>

                {/* Booking Details Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                <div className="bg-slate-50 rounded-2xl p-4">
                  <h4 className="font-bold text-slate-700 mb-2 flex items-center">
                    <span className="mr-2">📅</span>
                    Booking Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Date & Time:</span>
                      <span className="font-semibold text-slate-900">
                        {formatDateForDisplay(booking.visitingDate)} at {formatTimeTo12Hour(booking.visitingTime)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Duration:</span>
                      <span className="font-semibold text-slate-900">2 hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Time Until:</span>
                      <span className="font-semibold text-slate-900">{getTimeUntilBooking(booking)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Booking ID:</span>
                      <span className="font-mono text-xs text-slate-700">#{booking.id}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4">
                  <h4 className="font-bold text-slate-700 mb-2 flex items-center">
                    <span className="mr-2">💰</span>
                    Payment Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Total Amount:</span>
                      <span className="font-semibold text-slate-900">₹{booking.amount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Paid (70%):</span>
                      <span className="font-semibold text-green-600">₹{booking.paymentAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Remaining:</span>
                      <span className="font-semibold text-orange-600">₹{booking.amount - booking.paymentAmount}</span>
                    </div>
                    {booking.transactionId && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Transaction ID:</span>
                        <span className="font-mono text-xs text-slate-700">{booking.transactionId}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Booked Items/Services */}
              {booking.selectedItems && (
                <div className="bg-blue-50 rounded-2xl p-4 mb-4">
                  <h4 className="font-bold text-blue-900 mb-2 flex items-center">
                    <span className="mr-2">🛍️</span>
                    Booked Items/Services
                  </h4>
                  <div className="text-blue-800 text-sm leading-relaxed">
                    {(() => {
                      try {
                        const items = typeof booking.selectedItems === 'string' 
                          ? JSON.parse(booking.selectedItems) 
                          : booking.selectedItems || [];
                        return items.map((item, index) => (
                          <div key={index} className="flex justify-between items-center py-1">
                            <span>{item.name || item.itemName || `Dr. ${item.doctorName}` || 'Unknown Item'}</span>
                            <span className="font-semibold">₹{item.price || item.consultationFee || 0}</span>
                          </div>
                        ));
                      } catch (e) {
                        return <span>{booking.selectedItems}</span>;
                      }
                    })()}
                  </div>
                </div>
              )}

              {/* Cancellation Policy */}
              {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
                <div className="bg-yellow-50 rounded-2xl p-4 mb-4 border border-yellow-200">
                  <h4 className="font-bold text-yellow-900 mb-2 flex items-center">
                    <span className="mr-2">⚠️</span>
                    Cancellation Policy
                  </h4>
                  <div className="text-yellow-800 text-sm space-y-1">
                    <p className={`font-medium ${getCancellationPolicy(booking).color}`}>
                      {getCancellationPolicy(booking).message}
                    </p>
                    <div className="text-xs text-yellow-700 mt-2 space-y-1">
                      <p>• Cancel before 2 hours → Full refund within 24 hours</p>
                      <p>• Cancel within 2 hours → No refund</p>
                      <p>• Visiting duration: 2 hours</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Status and Actions Section */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mt-6 pt-6 border-t border-slate-200 space-y-4 md:space-y-0">
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex px-4 py-2 text-sm font-bold rounded-full border-2 ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                  {booking.status === 'CONFIRMED' && (
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                      ✅ Ready to Visit
                    </span>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-3">
                  {booking.qrCode && booking.status === 'CONFIRMED' && (
                    <button 
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowQRModal(true);
                      }}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-2xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      📱 Show QR Code
                    </button>
                  )}
                  
                  {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      disabled={!canCancelBooking(booking)}
                      className={`px-4 py-2 rounded-2xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg ${
                        canCancelBooking(booking)
                          ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      title={canCancelBooking(booking) ? 'Cancel with full refund' : 'Cannot cancel - within 2 hours or no refund policy'}
                    >
                      {canCancelBooking(booking) ? '❌ Cancel (Full Refund)' : '❌ Cancel (No Refund)'}
                    </button>
                  )}

                  <button className="bg-gradient-to-r from-slate-500 to-slate-600 text-white px-4 py-2 rounded-2xl text-sm font-semibold hover:from-slate-600 hover:to-slate-700 transition-all duration-300 transform hover:scale-105 shadow-lg">
                    📄 View Details
                  </button>
                </div>
              </div>

              {/* Refund Status */}
              {booking.status === 'CANCELLED' && booking.refundStatus && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl">
                  <p className="text-sm text-yellow-800">
                    <span className="font-medium">Refund Status:</span> {booking.refundStatus}
                    {booking.refundStatus === 'PROCESSED' && ' - Amount will be credited within 24 hours'}
                  </p>
                </div>
              )}
            </div>
            ))
          )}
        </div>

        {/* QR Code Modal */}
        <QRCodeModal
          booking={selectedBooking}
          isOpen={showQRModal}
          onClose={() => {
            setShowQRModal(false);
            setSelectedBooking(null);
          }}
        />
      </div>
    </div>
  );
};

export default MyBookings;