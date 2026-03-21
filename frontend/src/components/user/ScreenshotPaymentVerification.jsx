import { useState, useEffect } from 'react';
import api from '../../utils/api';

const ScreenshotPaymentVerification = ({ 
  establishment, 
  amount, 
  onVerificationSubmitted, 
  onCancel 
}) => {
  const [transactionId, setTransactionId] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);

  useEffect(() => {
    generatePaymentRequest();
  }, []);

  const generatePaymentRequest = async () => {
    try {
      setLoading(true);
      const response = await api.post('/api/payment/generate-request', {
        establishmentId: establishment.id,
        amount: amount
      });

      setPaymentRequest(response.data);
      console.log('💳 Payment request generated:', response.data);
    } catch (error) {
      console.error('❌ Failed to generate payment request:', error);
      alert('Failed to generate payment request: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleScreenshotChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      setScreenshot(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setScreenshotPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const submitVerification = async () => {
    if (!transactionId.trim()) {
      alert('Please enter the UPI transaction ID');
      return;
    }

    if (!screenshot) {
      alert('Please upload a screenshot of your payment');
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('transactionRef', paymentRequest.transactionRef);
      formData.append('transactionId', transactionId.trim());
      formData.append('amount', amount.toString());
      formData.append('establishmentId', establishment.id.toString());
      formData.append('screenshot', screenshot);

      const response = await api.post('/api/payment/verify-with-screenshot', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('📸 Screenshot verification submitted:', response.data);
      
      setVerificationStatus({
        success: true,
        message: response.data.message,
        verificationId: response.data.verificationId
      });

      // Notify parent component
      onVerificationSubmitted({
        transactionRef: paymentRequest.transactionRef,
        transactionId: transactionId,
        verificationId: response.data.verificationId,
        status: 'PENDING_VERIFICATION'
      });

    } catch (error) {
      console.error('❌ Screenshot verification failed:', error);
      const errorMessage = error.response?.data?.message || error.message;
      setVerificationStatus({
        success: false,
        message: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const checkVerificationStatus = async () => {
    if (!paymentRequest?.transactionRef) return;

    try {
      const response = await api.get(`/api/payment/verification-status/${paymentRequest.transactionRef}`);
      console.log('📋 Verification status:', response.data);
      
      if (response.data.found) {
        setVerificationStatus({
          success: response.data.status === 'APPROVED',
          message: response.data.status === 'APPROVED' 
            ? 'Payment verified and approved by owner!' 
            : response.data.status === 'REJECTED'
            ? `Payment rejected: ${response.data.ownerNotes || 'No reason provided'}`
            : 'Payment verification pending owner approval',
          status: response.data.status,
          ownerNotes: response.data.ownerNotes
        });
      }
    } catch (error) {
      console.error('❌ Failed to check verification status:', error);
    }
  };

  if (loading && !paymentRequest) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Generating payment request...</p>
        </div>
      </div>
    );
  }

  if (!paymentRequest) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 mb-4">Failed to generate payment request</p>
        <button 
          onClick={generatePaymentRequest}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          🔒 Secure Payment Verification
        </h3>
        <p className="text-gray-600">
          Pay ₹{amount} to {establishment.name} and upload screenshot for verification
        </p>
      </div>

      {/* Payment Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h4 className="font-semibold text-blue-800 mb-2">📱 Payment Instructions:</h4>
        <ol className="list-decimal list-inside text-blue-700 space-y-1">
          <li>Open your UPI app (PhonePe, GPay, Paytm, etc.)</li>
          <li>Pay exactly ₹{amount} to: <strong>{establishment.upiId || 'UPI ID not available'}</strong></li>
          <li>Take a screenshot of the payment confirmation</li>
          <li>Enter the transaction ID and upload the screenshot below</li>
        </ol>
      </div>

      {/* UPI QR Code */}
      {establishment.upiQrCodePath && (
        <div className="text-center mb-6">
          <p className="text-sm text-gray-600 mb-2">Scan QR Code to Pay:</p>
          <img 
            src={`/api/images/${establishment.upiQrCodePath}`}
            alt="UPI QR Code"
            className="mx-auto max-w-48 max-h-48 border rounded"
          />
        </div>
      )}

      {/* Transaction ID Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          UPI Transaction ID *
        </label>
        <input
          type="text"
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
          placeholder="Enter UPI transaction ID (e.g., T2403200000001)"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        <p className="text-xs text-gray-500 mt-1">
          Find this in your UPI app after payment completion
        </p>
      </div>

      {/* Screenshot Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Screenshot *
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleScreenshotChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        <p className="text-xs text-gray-500 mt-1">
          Upload screenshot showing payment confirmation (max 5MB)
        </p>
      </div>

      {/* Screenshot Preview */}
      {screenshotPreview && (
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-2">Screenshot Preview:</p>
          <img 
            src={screenshotPreview}
            alt="Payment Screenshot Preview"
            className="max-w-full max-h-64 border rounded mx-auto"
          />
        </div>
      )}

      {/* Verification Status */}
      {verificationStatus && (
        <div className={`mb-6 p-4 rounded-lg ${
          verificationStatus.success 
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <p className="font-medium">
            {verificationStatus.success ? '✅' : '❌'} {verificationStatus.message}
          </p>
          {verificationStatus.ownerNotes && (
            <p className="text-sm mt-2">
              <strong>Owner Notes:</strong> {verificationStatus.ownerNotes}
            </p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={submitVerification}
          disabled={loading || !transactionId.trim() || !screenshot}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Submitting...
            </span>
          ) : (
            '📸 Submit for Verification'
          )}
        </button>

        {verificationStatus && (
          <button
            onClick={checkVerificationStatus}
            className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
          >
            🔄 Check Status
          </button>
        )}

        <button
          onClick={onCancel}
          className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
        >
          Cancel
        </button>
      </div>

      {/* Security Notice */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="font-semibold text-yellow-800 mb-2">🛡️ Security Notice:</h4>
        <ul className="text-yellow-700 text-sm space-y-1">
          <li>• Your screenshot will be reviewed by the establishment owner</li>
          <li>• Only pay to the official UPI ID shown above</li>
          <li>• Keep your payment receipt until booking is confirmed</li>
          <li>• Contact support if you face any issues</li>
        </ul>
      </div>
    </div>
  );
};

export default ScreenshotPaymentVerification;