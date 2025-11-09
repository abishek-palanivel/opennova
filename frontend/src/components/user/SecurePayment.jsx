import { useState, useEffect } from 'react';
import api from '../../utils/api';

// Detect if user is on mobile or desktop
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

const SecurePayment = ({ establishment, amount, onPaymentVerified, onCancel }) => {
  const [paymentRequest, setPaymentRequest] = useState(null);
  const [upiTransactionId, setUpiTransactionId] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [showQRCode, setShowQRCode] = useState(false);
  const [deviceType] = useState(isMobile() ? 'mobile' : 'desktop');

  // Debug establishment data
  useEffect(() => {
    console.log('🏥 SecurePayment - Establishment data received:', establishment);
    console.log('💳 UPI QR Code Path:', establishment?.upiQrCodePath);
    console.log('🆔 UPI ID:', establishment?.upiId);
  }, [establishment]);

  useEffect(() => {
    generatePaymentRequest();
  }, []);

  useEffect(() => {
    if (paymentRequest && paymentRequest.expiryTime) {
      const timer = setInterval(() => {
        const now = new Date();
        const expiry = new Date(paymentRequest.expiryTime);
        const diff = Math.max(0, Math.floor((expiry - now) / 1000));
        setTimeLeft(diff);
        
        if (diff === 0) {
          setError('Payment request expired. Please generate a new one.');
          clearInterval(timer);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [paymentRequest]);

  const generatePaymentRequest = async () => {
    try {
      const response = await api.post('/api/payment/generate-request', {
        establishmentId: establishment.id,
        amount: amount
      });

      if (response.data.success) {
        setPaymentRequest(response.data);
        setError('');
      } else {
        setError(response.data.message || 'Failed to generate payment request');
      }
    } catch (error) {
      console.error('Payment request generation failed:', error);
      setError('Failed to generate payment request. Please try again.');
    }
  };

  const verifyPayment = async () => {
    if (!upiTransactionId.trim()) {
      setError('Please enter your UPI transaction ID');
      return;
    }

    if (!paidAmount.trim()) {
      setError('Please enter the amount you paid');
      return;
    }

    const paidAmountNum = parseFloat(paidAmount);
    if (isNaN(paidAmountNum) || paidAmountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    // STRICT AMOUNT CHECK - Must be exact
    if (paidAmountNum !== amount) {
      setError(`❌ WRONG AMOUNT: You entered ₹${paidAmountNum} but required amount is ₹${amount}. You must pay EXACTLY ₹${amount} to proceed.`);
      return;
    }

    // CLIENT-SIDE VALIDATION: Basic transaction ID format check
    const txnId = upiTransactionId.trim().toUpperCase();
    
    // Check minimum requirements
    if (txnId.length < 12 || txnId.length > 20) {
      setError('❌ Invalid transaction ID length. UPI transaction IDs are typically 12-20 characters.');
      return;
    }

    // Must contain both letters and numbers
    if (!txnId.match(/[A-Z]/) || !txnId.match(/[0-9]/)) {
      setError('❌ Invalid transaction ID format. Real UPI transaction IDs contain both letters and numbers.');
      return;
    }

    // Reject obvious fake patterns
    const fakePatterns = [
      /^123456789012$/,     // Sequential numbers
      /^111111111111$/,     // All same digits
      /^000000000000$/,     // All zeros
      /^ABCDEFGHIJKL$/,     // Sequential letters
      /^TEST.*$/,           // Test patterns
      /^FAKE.*$/,           // Fake patterns
      /^DUMMY.*$/,          // Dummy patterns
      /^SAMPLE.*$/,         // Sample patterns
      /^(\d)\1{11,}$/,      // All same digits repeated
      /^\d{12}$/,           // Pure 12-digit numbers
    ];

    for (const pattern of fakePatterns) {
      if (pattern.test(txnId)) {
        setError('❌ Invalid transaction ID format. Please enter a real UPI transaction ID from your payment app.');
        return;
      }
    }

    setVerifying(true);
    setError('');

    try {
      console.log('🔍 Verifying payment with strict amount validation:', {
        transactionRef: paymentRequest.transactionRef,
        upiTransactionId: txnId,
        paidAmount: paidAmountNum,
        expectedAmount: amount
      });

      const response = await api.post('/api/payment/verify-strict', {
        transactionRef: paymentRequest.transactionRef,
        upiTransactionId: txnId,
        paidAmount: paidAmountNum
      });

      if (response.data.verified) {
        console.log('🎉 PAYMENT CONFIRMED - User can proceed to next step!');
        
        // Show success message
        alert('🎉 PAYMENT CONFIRMED!\n\nYou paid exactly ₹' + amount + '.\nYou can now proceed to complete your booking!');
        
        onPaymentVerified({
          transactionRef: paymentRequest.transactionRef,
          upiTransactionId: txnId,
          amount: response.data.amount,
          verifiedAt: response.data.verifiedAt
        });
      } else {
        console.log('❌ Payment verification failed - Cannot proceed:', response.data.message);
        setError(response.data.message || 'Payment verification failed. You cannot proceed without valid payment.');
      }
    } catch (error) {
      console.error('❌ Payment verification failed:', error);
      const errorMessage = error.response?.data?.message || 'Payment verification failed. Please try again.';
      setError(errorMessage);
    } finally {
      setVerifying(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const openUPIApp = () => {
    if (deviceType === 'mobile' && paymentRequest?.upiUrl) {
      window.location.href = paymentRequest.upiUrl;
    } else {
      // For desktop users, show QR code
      setShowQRCode(true);
    }
  };

  const generateQRCode = (upiUrl) => {
    console.log('🔍 Generating QR Code...');
    console.log('🏥 Establishment:', establishment?.name);
    console.log('📁 Establishment UPI QR Code Path:', establishment?.upiQrCodePath);
    console.log('📁 Payment Request UPI QR Code Path:', paymentRequest?.establishmentUpiQrCodePath);
    console.log('🔗 UPI URL:', upiUrl);
    
    // PRIORITY 1: Check payment request for QR code path (most up-to-date)
    const qrCodePath = paymentRequest?.establishmentUpiQrCodePath || establishment?.upiQrCodePath;
    
    if (qrCodePath && qrCodePath.trim() !== '') {
      // Fix the URL construction - remove duplicate /uploads/ if already present
      let qrCodeUrl;
      if (qrCodePath.startsWith('http')) {
        // Already a full URL
        qrCodeUrl = qrCodePath;
      } else if (qrCodePath.startsWith('uploads/')) {
        // Path already includes uploads/
        qrCodeUrl = `${api.defaults.baseURL}/${qrCodePath}`;
      } else {
        // Path doesn't include uploads/
        qrCodeUrl = `${api.defaults.baseURL}/uploads/${qrCodePath}`;
      }
      console.log("✅ Using establishment's uploaded UPI QR code:", qrCodeUrl);
      return qrCodeUrl;
    }
    
    // PRIORITY 2: Fallback to Google Charts API for generated QR code
    if (!upiUrl) {
      console.error("❌ No UPI URL provided for QR code generation");
      return '';
    }
    
    const qrSize = 200;
    const qrUrl = `https://chart.googleapis.com/chart?chs=${qrSize}x${qrSize}&cht=qr&chl=${encodeURIComponent(upiUrl)}`;
    console.log("⚠️ Using generated QR code (no establishment QR found):", qrUrl);
    return qrUrl;
  };

  const copyUPIDetails = () => {
    const upiDetails = `UPI ID: ${paymentRequest.upiId}\nAmount: ₹${amount}\nReference: ${paymentRequest.transactionRef}`;
    navigator.clipboard.writeText(upiDetails).then(() => {
      alert('UPI details copied to clipboard!');
    });
  };

  if (!paymentRequest) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Generating secure payment request...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Secure Payment</h2>
            <p className="text-blue-100">Pay using UPI</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-100">Amount</p>
            <p className="text-3xl font-bold">₹{amount}</p>
          </div>
        </div>
      </div>

      {/* Timer */}
      {timeLeft > 0 && (
        <div className="bg-orange-50 border-b border-orange-200 p-4">
          <div className="flex items-center justify-center">
            <span className="text-orange-600 mr-2">⏰</span>
            <p className="text-orange-800 font-semibold">
              Time remaining: {formatTime(timeLeft)}
            </p>
          </div>
        </div>
      )}

      <div className="p-6 space-y-6">
        {/* Payment Details */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Payment Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Pay To:</span>
              <span className="font-semibold">{paymentRequest.upiId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Establishment:</span>
              <span className="font-semibold">{paymentRequest.establishmentName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Reference:</span>
              <span className="font-mono text-xs bg-gray-200 px-2 py-1 rounded">
                {paymentRequest.transactionRef}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Options - Different for Mobile vs Desktop */}
        {deviceType === 'mobile' ? (
          /* Mobile Payment */
          <div className="text-center">
            <button
              onClick={openUPIApp}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-4 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 font-semibold text-lg shadow-lg flex items-center justify-center mx-auto"
            >
              <span className="mr-2">📱</span>
              Pay with UPI App
            </button>
            <p className="text-gray-600 text-sm mt-2">
              This will open your UPI app with pre-filled payment details
            </p>
          </div>
        ) : (
          /* Desktop Payment Options */
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                <span className="mr-2">💻</span>
                Desktop Payment Options
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={openUPIApp}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 font-semibold flex items-center justify-center"
                >
                  <span className="mr-2">📱</span>
                  Show QR Code
                </button>
                <button
                  onClick={copyUPIDetails}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold flex items-center justify-center"
                >
                  <span className="mr-2">📋</span>
                  Copy UPI Details
                </button>
              </div>
            </div>

            {/* QR Code Display */}
            {showQRCode && paymentRequest?.upiUrl && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                <h4 className="font-semibold text-gray-900 mb-4">
                  {(paymentRequest?.establishmentUpiQrCodePath || establishment?.upiQrCodePath) ? 
                    `${establishment.name}'s Official UPI QR Code` : 
                    'Generated QR Code for Payment'
                  }
                </h4>
                <div className="flex justify-center mb-4">
                  <img 
                    src={generateQRCode(paymentRequest.upiUrl)} 
                    alt="UPI Payment QR Code"
                    className="border border-gray-300 rounded-lg max-w-[250px] max-h-[250px]"
                    onError={(e) => {
                      console.error("QR Code image failed to load:", e.target.src);
                      // Fallback to generated QR if establishment QR fails
                      if (establishment?.upiQrCodePath) {
                        const fallbackUrl = `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(paymentRequest.upiUrl)}`;
                        e.target.src = fallbackUrl;
                        console.log("🔄 Switched to fallback QR code:", fallbackUrl);
                      }
                    }}
                  />
                </div>
                {(paymentRequest?.establishmentUpiQrCodePath || establishment?.upiQrCodePath) ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                    <p className="text-green-800 text-sm font-medium">
                      ✅ Official QR Code from {establishment.name}
                    </p>
                    <p className="text-green-700 text-xs mt-1">
                      This is the establishment's verified UPI QR code uploaded by the owner
                    </p>
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-blue-800 text-sm font-medium">
                      🔄 Generated QR Code
                    </p>
                    <p className="text-blue-700 text-xs mt-1">
                      This QR code was generated for UPI ID: {paymentRequest?.upiId}
                    </p>
                  </div>
                )}
                <div className="text-sm text-gray-600 space-y-1">
                  <p>1. Open any UPI app on your phone</p>
                  <p>2. Scan this QR code</p>
                  <p>3. Verify amount is exactly ₹{amount}</p>
                  <p>4. Complete the payment</p>
                  <p>5. Enter the 12-digit transaction ID below</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Manual Payment Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-3">
            {deviceType === 'mobile' ? 'Mobile Payment Steps' : 'Desktop Payment Steps'}
          </h4>
          {deviceType === 'mobile' ? (
            <ol className="text-blue-800 text-sm space-y-1">
              <li>1. Open any UPI app (PhonePe, GPay, Paytm, etc.)</li>
              <li>2. Send ₹{amount} to UPI ID: <strong>{paymentRequest.upiId}</strong></li>
              <li>3. Copy the UPI transaction ID from your app</li>
              <li>4. Enter it below to verify your payment</li>
            </ol>
          ) : (
            <ol className="text-blue-800 text-sm space-y-2">
              <li><strong>Option 1 - QR Code:</strong>
                <ul className="ml-4 mt-1 space-y-1">
                  <li>• Click "Show QR Code" above</li>
                  <li>• Scan with your phone's UPI app</li>
                  <li>• Complete payment on phone</li>
                </ul>
              </li>
              <li><strong>Option 2 - Manual Transfer:</strong>
                <ul className="ml-4 mt-1 space-y-1">
                  <li>• Open UPI app on your phone</li>
                  <li>• Send ₹{amount} to: <strong>{paymentRequest.upiId}</strong></li>
                  <li>• Use reference: <code className="bg-blue-100 px-1 rounded text-xs">{paymentRequest.transactionRef}</code></li>
                </ul>
              </li>
              <li><strong>After Payment:</strong>
                <ul className="ml-4 mt-1 space-y-1">
                  <li>• Copy the 12-digit UPI transaction ID</li>
                  <li>• Enter it in the field below</li>
                  <li>• Click "Verify Payment"</li>
                </ul>
              </li>
            </ol>
          )}
        </div>

        {/* Amount Paid Input - STRICT VALIDATION */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount You Paid <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-3 text-gray-500">₹</span>
            <input
              type="number"
              step="0.01"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              placeholder={amount.toString()}
              className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mt-2 space-y-1">
            <p className="text-green-600 text-xs font-semibold">
              ✅ Required amount: ₹{amount} (EXACT)
            </p>
            <p className="text-red-600 text-xs">
              ❌ You MUST pay exactly ₹{amount} - no more, no less
            </p>
            <p className="text-blue-600 text-xs">
              💡 Enter the exact amount shown in your UPI payment confirmation
            </p>
          </div>
        </div>

        {/* Transaction ID Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            UPI Transaction ID <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={upiTransactionId}
            onChange={(e) => setUpiTransactionId(e.target.value.toUpperCase())}
            placeholder="Enter UPI transaction ID (e.g., 4A2B3C4D5E6F)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            maxLength="20"
            minLength="12"
          />
          <div className="mt-2 space-y-1">
            <p className="text-gray-600 text-xs">
              ✅ Enter the REAL UPI transaction ID from your payment app
            </p>
            <p className="text-red-600 text-xs">
              ❌ Fake or random numbers will be rejected
            </p>
            <p className="text-blue-600 text-xs">
              💡 Transaction ID must contain both letters and numbers (12-20 characters)
            </p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <span className="text-red-600 mr-2">⚠️</span>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={verifyPayment}
            disabled={verifying || !upiTransactionId.trim() || !paidAmount.trim() || timeLeft === 0}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            {verifying ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Verifying...
              </span>
            ) : (
              'Verify Payment'
            )}
          </button>
          <button
            onClick={onCancel}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>

        {/* Device-specific Help */}
        {deviceType === 'desktop' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <span className="text-yellow-600 text-lg mr-3">💡</span>
              <div>
                <h4 className="font-semibold text-yellow-900 mb-1">Laptop/Desktop Payment</h4>
                <p className="text-yellow-800 text-sm mb-2">
                  Since you're on a laptop/desktop, you'll need to use your phone for UPI payment:
                </p>
                <ul className="text-yellow-800 text-xs space-y-1">
                  <li>• Use QR code for easiest payment</li>
                  <li>• Or manually enter UPI ID on your phone</li>
                  <li>• Transaction ID will be shown in your phone's UPI app</li>
                  <li>• Enter that transaction ID here to complete booking</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ULTRA-STRICT Amount Warning */}
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
          <div className="flex items-start">
            <span className="text-red-600 text-2xl mr-4">🚨</span>
            <div>
              <h4 className="font-bold text-red-900 mb-3 text-lg">CRITICAL: EXACT AMOUNT REQUIRED</h4>
              <div className="bg-red-100 border border-red-300 rounded-lg p-4 mb-4">
                <p className="text-red-900 text-lg font-bold text-center">
                  YOU MUST PAY EXACTLY ₹{amount}
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center text-red-800">
                  <span className="mr-2">❌</span>
                  <span className="font-semibold">If you pay ₹{amount - 1} or less → BOOKING REJECTED</span>
                </div>
                <div className="flex items-center text-red-800">
                  <span className="mr-2">❌</span>
                  <span className="font-semibold">If you pay ₹{amount + 1} or more → BOOKING REJECTED</span>
                </div>
                <div className="flex items-center text-green-800">
                  <span className="mr-2">✅</span>
                  <span className="font-semibold">Only ₹{amount} (EXACT) → BOOKING APPROVED</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                <p className="text-yellow-900 text-sm font-semibold">
                  ⚠️ VERIFICATION PROCESS:
                </p>
                <ul className="text-yellow-800 text-xs mt-2 space-y-1">
                  <li>1. You enter the amount you paid</li>
                  <li>2. System checks if it matches ₹{amount} exactly</li>
                  <li>3. You provide real UPI transaction ID</li>
                  <li>4. System verifies transaction authenticity</li>
                  <li>5. Only then booking is confirmed</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <span className="text-green-600 text-lg mr-3">🔒</span>
            <div>
              <h4 className="font-semibold text-green-900 mb-1">Secure Payment</h4>
              <p className="text-green-800 text-sm">
                Your payment is verified using real UPI transaction IDs. 
                Fake screenshots cannot be used. Only genuine UPI payments are accepted.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurePayment;