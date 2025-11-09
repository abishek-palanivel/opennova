import { useState } from 'react';

const QRCodeModal = ({ booking, isOpen, onClose }) => {
  const [emailSent, setEmailSent] = useState(false);

  if (!isOpen || !booking) return null;

  const handleResendEmail = async () => {
    try {
      const response = await fetch(`/api/user/bookings/${booking.id}/resend-qr`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setEmailSent(true);
        setTimeout(() => setEmailSent(false), 3000);
      } else {
        const errorData = await response.json();
        console.error('Failed to resend email:', errorData.message);
        alert('Failed to resend email: ' + errorData.message);
      }
    } catch (error) {
      console.error('Failed to resend email:', error);
      alert('Failed to resend email. Please try again.');
    }
  };

  const handleDownloadQR = () => {
    // Create a download link for the QR code
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${booking.qrCode}`;
    link.download = `booking-${booking.id}-qr.png`;
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Booking QR Code</h2>
              <p className="text-blue-100">Show this at the establishment</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 text-2xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 text-center">
          {/* QR Code Display */}
          <div className="bg-white border-4 border-slate-200 rounded-2xl p-6 mb-6 shadow-lg">
            {booking.qrCode ? (
              <img
                src={`data:image/png;base64,${booking.qrCode}`}
                alt="Booking QR Code"
                className="w-48 h-48 mx-auto"
              />
            ) : (
              <div className="w-48 h-48 mx-auto bg-slate-100 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <span className="text-4xl text-slate-400 mb-2 block">📱</span>
                  <p className="text-slate-500 text-sm">QR Code Loading...</p>
                </div>
              </div>
            )}
          </div>

          {/* Booking Details */}
          <div className="bg-slate-50 rounded-2xl p-4 mb-6 text-left">
            <h3 className="font-bold text-slate-900 mb-3">Booking Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Establishment:</span>
                <span className="font-semibold">{booking.establishmentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Date:</span>
                <span className="font-semibold">
                  {new Date(booking.bookingDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Time:</span>
                <span className="font-semibold">{booking.bookingTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Booking ID:</span>
                <span className="font-mono text-xs">#{booking.id}</span>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
            <h4 className="font-bold text-blue-900 mb-2 flex items-center">
              <span className="mr-2">💡</span>
              How to Use
            </h4>
            <ul className="text-blue-800 text-sm space-y-1 text-left">
              <li>• Show this QR code at the establishment</li>
              <li>• Staff will scan to verify your booking</li>
              <li>• Pay remaining 30% amount at venue</li>
              <li>• Enjoy your 2-hour visit!</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleDownloadQR}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-2xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              📱 Download QR Code
            </button>
            
            <button
              onClick={handleResendEmail}
              disabled={emailSent}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-2xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50"
            >
              {emailSent ? '✅ Email Sent!' : '📧 Resend to Email'}
            </button>
            
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-slate-500 to-slate-600 text-white py-3 rounded-2xl font-semibold hover:from-slate-600 hover:to-slate-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;