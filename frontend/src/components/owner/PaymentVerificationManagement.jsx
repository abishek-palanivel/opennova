import { useState, useEffect } from 'react';
import api from '../../utils/api';

const PaymentVerificationManagement = () => {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPendingVerifications();
  }, []);

  const fetchPendingVerifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/owner/payment-verifications');
      setVerifications(response.data.verifications || []);
      console.log('📋 Fetched payment verifications:', response.data);
    } catch (error) {
      console.error('❌ Failed to fetch payment verifications:', error);
      alert('Failed to load payment verifications: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const approveVerification = async (verificationId, notes = '') => {
    try {
      setActionLoading(true);
      const response = await api.post(`/api/owner/payment-verifications/${verificationId}/approve`, {
        notes: notes
      });

      console.log('✅ Payment verification approved:', response.data);
      alert('Payment verification approved successfully! QR code generated and confirmation email sent to customer.');
      
      // Remove from local state instead of refreshing
      setVerifications(prev => prev.filter(v => v.id !== verificationId));
      setSelectedVerification(null);
      
    } catch (error) {
      console.error('❌ Failed to approve payment verification:', error);
      alert('Failed to approve payment verification: ' + (error.response?.data?.message || error.message));
    } finally {
      setActionLoading(false);
    }
  };

  const rejectVerification = async (verificationId, reason) => {
    if (!reason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      setActionLoading(true);
      const response = await api.post(`/api/owner/payment-verifications/${verificationId}/reject`, {
        reason: reason
      });

      console.log('❌ Payment verification rejected:', response.data);
      alert('Payment verification rejected successfully! Booking cancelled and refund email sent to customer.');
      
      // Remove from local state instead of refreshing
      setVerifications(prev => prev.filter(v => v.id !== verificationId));
      setSelectedVerification(null);
      
    } catch (error) {
      console.error('❌ Failed to reject payment verification:', error);
      alert('Failed to reject payment verification: ' + (error.response?.data?.message || error.message));
    } finally {
      setActionLoading(false);
    }
  };

  const deleteVerification = async (verificationId) => {
    if (!window.confirm('Are you sure you want to delete this payment verification? This action cannot be undone.')) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await api.delete(`/api/owner/payment-verifications/${verificationId}`);

      console.log('🗑️ Payment verification deleted:', response.data);
      alert('Payment verification deleted successfully!');
      
      // Remove from local state instead of refreshing
      setVerifications(prev => prev.filter(v => v.id !== verificationId));
      setSelectedVerification(null);
      
    } catch (error) {
      console.error('❌ Failed to delete payment verification:', error);
      alert('Failed to delete payment verification: ' + (error.response?.data?.message || error.message));
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatAmount = (amount) => {
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading payment verifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          💳 Payment Verifications
        </h2>
        <p className="text-gray-600">
          Review and approve customer payment screenshots
        </p>
      </div>

      {verifications.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No Pending Verifications
          </h3>
          <p className="text-gray-500">
            All payment verifications have been processed
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {verifications.map((verification) => (
            <div
              key={verification.id}
              className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Payment Verification #{verification.id}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Submitted: {formatDate(verification.createdAt)}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  verification.status === 'PENDING_VERIFICATION'
                    ? 'bg-yellow-100 text-yellow-800'
                    : verification.status === 'APPROVED'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {verification.status.replace('_', ' ')}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Customer Email:</p>
                  <p className="font-medium">{verification.userEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Expected Amount:</p>
                  <p className="font-medium text-green-600">
                    {formatAmount(verification.expectedAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Transaction ID:</p>
                  <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                    {verification.transactionId}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Transaction Ref:</p>
                  <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                    {verification.transactionRef}
                  </p>
                </div>
              </div>

              {verification.screenshotPath && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Payment Screenshot:</p>
                  <div className="relative">
                    <img
                      src={`http://localhost:8080/api/images/payment-screenshots/${verification.screenshotPath.split('/').pop()}`}
                      alt="Payment Screenshot"
                      className="max-w-full max-h-64 border rounded cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(`http://localhost:8080/api/images/payment-screenshots/${verification.screenshotPath.split('/').pop()}`, '_blank')}
                      onError={(e) => {
                        console.error('❌ Failed to load screenshot:', verification.screenshotPath);
                        console.error('❌ Attempted URL:', e.target.src);
                        
                        // Try alternative paths in order with full localhost URLs
                        const filename = verification.screenshotPath.split('/').pop();
                        const altPaths = [
                          `http://localhost:8080/api/uploads/payment-screenshots/${filename}`,
                          `http://localhost:8080/uploads/payment-screenshots/${filename}`,
                          `http://localhost:8080/api/images/payment-screenshots/${filename}`,
                          `http://localhost:8080/uploads/${filename}`,
                          `http://localhost:8080/api/images/fallback-default.png`
                        ];
                        
                        let currentIndex = parseInt(e.target.dataset.errorIndex || '0');
                        if (currentIndex < altPaths.length) {
                          console.log(`🔄 Trying alternative path ${currentIndex + 1}:`, altPaths[currentIndex]);
                          e.target.src = altPaths[currentIndex];
                          e.target.dataset.errorIndex = (currentIndex + 1).toString();
                          if (currentIndex === altPaths.length - 1) {
                            e.target.alt = 'Screenshot not available';
                            console.error('❌ All screenshot paths failed for:', verification.screenshotPath);
                          }
                        }
                      }}
                    />
                    <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      Click to enlarge
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Click image to view full size • File: {verification.screenshotPath.split('/').pop()}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Debug: Full path: {verification.screenshotPath}
                  </p>
                </div>
              )}

              <div className="flex gap-3 flex-wrap">
                {verification.status === 'PENDING_VERIFICATION' && (
                  <>
                    <button
                      onClick={() => setSelectedVerification(verification)}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
                      disabled={actionLoading}
                    >
                      ✅ Approve
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Please provide a reason for rejection:');
                        if (reason) {
                          rejectVerification(verification.id, reason);
                        }
                      }}
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:bg-gray-400"
                      disabled={actionLoading}
                    >
                      ❌ Reject
                    </button>
                  </>
                )}
                
                {/* Delete button available for all statuses */}
                <button
                  onClick={() => deleteVerification(verification.id)}
                  className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:bg-gray-400"
                  disabled={actionLoading}
                >
                  🗑️ Delete
                </button>
              </div>

              {verification.ownerNotes && (
                <div className="mt-4 p-3 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600">Owner Notes:</p>
                  <p className="text-sm">{verification.ownerNotes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Approval Modal */}
      {selectedVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Approve Payment Verification
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">Customer:</p>
              <p className="font-medium">{selectedVerification.userEmail}</p>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">Amount:</p>
              <p className="font-medium text-green-600">
                {formatAmount(selectedVerification.expectedAmount)}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Approval Notes (Optional):
              </label>
              <textarea
                id="approvalNotes"
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Add any notes about this approval..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  const notes = document.getElementById('approvalNotes').value;
                  approveVerification(selectedVerification.id, notes);
                }}
                disabled={actionLoading}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:bg-gray-400"
              >
                {actionLoading ? 'Approving...' : '✅ Confirm Approval'}
              </button>
              <button
                onClick={() => setSelectedVerification(null)}
                className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Refresh Button - auto-refresh on actions */}
    </div>
  );
};

export default PaymentVerificationManagement;