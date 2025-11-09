import { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import API_BASE_URL from '../../config/api';

const QRScanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [manualQRData, setManualQRData] = useState('');
  const fileInputRef = useRef(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setScanning(true);
      setError('');
      
      // For now, we'll use manual input since QR scanning from image requires additional libraries
      alert('Please use the manual QR data input below for now. QR image scanning will be added in a future update.');
      setScanning(false);
    } catch (error) {
      console.error('QR scan error:', error);
      setError('Failed to scan QR code from image');
      setScanning(false);
    }
  };

  const parseQRData = (qrData) => {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(qrData);
      
      // If it's already in the expected format, return it
      if (parsed.type === 'OPENNOVA_BOOKING') {
        return {
          bookingId: parsed.bookingId,
          customerName: parsed.customerName,
          customerEmail: parsed.customerEmail,
          establishmentName: parsed.establishmentName,
          visitingDate: parsed.visitingDate,
          visitingTime: parsed.visitingTime,
          totalAmount: parsed.totalAmount,
          paidAmount: parsed.paidAmount,
          selectedItems: parsed.selectedItems,
          transactionId: parsed.transactionId,
          status: parsed.status,
          establishmentId: parsed.establishmentId
        };
      }
      
      return parsed;
    } catch (e) {
      // If not JSON, return as is
      return qrData;
    }
  };

  const handleManualScan = async () => {
    if (!manualQRData.trim()) {
      setError('Please enter QR code data');
      return;
    }

    try {
      setScanning(true);
      setError('');
      
      // Parse QR data first
      const parsedData = parseQRData(manualQRData.trim());
      
      // If it's already parsed and valid, show it directly
      if (parsedData && parsedData.bookingId && parsedData.type === 'OPENNOVA_BOOKING') {
        // Calculate remaining amount
        const remaining = (parsedData.totalAmount || 0) - (parsedData.paidAmount || 0);
        
        setScanResult({
          success: true,
          bookingId: parsedData.bookingId,
          customerName: parsedData.customerName,
          customerEmail: parsedData.customerEmail,
          establishmentName: parsedData.establishmentName,
          visitingDate: parsedData.visitingDate,
          visitingTime: parsedData.visitingTime,
          totalAmount: parsedData.totalAmount,
          paidAmount: parsedData.paidAmount,
          remainingAmount: remaining,
          selectedItems: parsedData.selectedItems,
          transactionId: parsedData.transactionId,
          status: parsedData.status,
          booking: {
            id: parsedData.bookingId,
            customerName: parsedData.customerName,
            customerEmail: parsedData.customerEmail,
            visitingDate: parsedData.visitingDate,
            visitingTime: parsedData.visitingTime,
            totalAmount: parsedData.totalAmount,
            paidAmount: parsedData.paidAmount,
            remainingAmount: remaining,
            selectedItems: parsedData.selectedItems,
            transactionId: parsedData.transactionId,
            status: parsedData.status
          }
        });
        return;
      }
      
      // Otherwise, validate with backend
      const response = await fetch(`${API_BASE_URL}/api/owner/scan-qr`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ qrData: manualQRData.trim() })
      });

      const data = await response.json();

      if (response.ok) {
        setScanResult(data);
      } else {
        setError(data.message || 'Failed to validate QR code');
      }
    } catch (error) {
      console.error('QR validation error:', error);
      setError('Failed to validate QR code. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  const handleConfirmVisit = async () => {
    if (!scanResult || !scanResult.booking) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/owner/confirm-visit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          bookingId: scanResult.booking.id,
          remainingPayment: scanResult.remainingAmount || 0
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Visit confirmed successfully!');
        setScanResult(null);
        setManualQRData('');
      } else {
        setError(data.message || 'Failed to confirm visit');
      }
    } catch (error) {
      console.error('Visit confirmation error:', error);
      setError('Failed to confirm visit. Please try again.');
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setError('');
    setManualQRData('');
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">QR Code Scanner</h2>
        <p className="text-gray-600">Scan customer QR codes to verify bookings</p>
      </div>

      {!scanResult ? (
        <div className="space-y-6">
          {/* Manual QR Data Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter QR Code Data
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={manualQRData}
                onChange={(e) => setManualQRData(e.target.value)}
                placeholder="Paste QR code data here..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleManualScan}
                disabled={scanning || !manualQRData.trim()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {scanning ? 'Validating...' : 'Validate'}
              </button>
            </div>
          </div>

          {/* File Upload Option */}
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">Or upload QR code image</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={scanning}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Upload QR Image
            </button>
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
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header with QR Success */}
          <div className="text-center bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6">
            <div className="flex justify-center items-center mb-4">
              <div className="bg-green-100 rounded-full p-3 mr-4">
                <span className="text-green-600 text-3xl">✅</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-green-900">QR Code Verified</h3>
                <p className="text-green-700">Valid booking found</p>
              </div>
            </div>
          </div>

          {/* Main Booking Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            
            {/* Customer Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{scanResult.customerName || scanResult.booking?.customerName}</h2>
                  <p className="text-blue-100">{scanResult.customerEmail || scanResult.booking?.customerEmail}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-100">Booking ID</p>
                  <p className="text-xl font-bold">#{scanResult.booking?.id || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Visit Information */}
            <div className="p-6 bg-gray-50">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">📅</span> Visit Schedule
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg border">
                  <p className="text-sm text-gray-600 mb-1">Visit Date</p>
                  <p className="text-xl font-bold text-gray-900">{scanResult.visitingDate || scanResult.booking?.visitingDate}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <p className="text-sm text-gray-600 mb-1">Visit Time</p>
                  <p className="text-xl font-bold text-gray-900">{scanResult.visitingTime || scanResult.booking?.visitingTime}</p>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">💳</span> Payment Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-600 mb-1">Total Amount</p>
                  <p className="text-2xl font-bold text-blue-900">₹{scanResult.booking?.totalAmount || scanResult.totalAmount || '0'}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-sm text-green-600 mb-1">Paid Amount</p>
                  <p className="text-2xl font-bold text-green-900">₹{scanResult.booking?.paidAmount || scanResult.paidAmount || '0'}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <p className="text-sm text-orange-600 mb-1">Remaining</p>
                  <p className="text-2xl font-bold text-orange-900">₹{scanResult.remainingAmount || (scanResult.booking?.remainingAmount) || '0'}</p>
                </div>
              </div>
            </div>

            {/* Transaction Details */}
            <div className="p-6 bg-gray-50">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">🧾</span> Transaction Info
              </h4>
              <div className="bg-white p-4 rounded-lg border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Transaction ID</p>
                    <p className="font-mono text-sm bg-gray-100 p-2 rounded mt-1">{scanResult.booking?.transactionId || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span className="inline-block mt-1 px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                      {scanResult.booking?.status || 'CONFIRMED'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Amount Verification for Owner */}
            <div className="p-6 bg-yellow-50">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">🔍</span> Payment Verification
              </h4>
              <div className="bg-white p-4 rounded-lg border border-yellow-200">
                <div className="mb-4">
                  <h5 className="font-semibold text-gray-900 mb-2">Verify Payment Amount</h5>
                  <p className="text-sm text-gray-600 mb-3">
                    Check your UPI app/bank statement to confirm you received the correct amount
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-blue-50 p-3 rounded border">
                    <p className="text-sm text-blue-600">Expected Amount</p>
                    <p className="text-xl font-bold text-blue-900">₹{scanResult.booking?.paidAmount || scanResult.paidAmount || '0'}</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded border">
                    <p className="text-sm text-purple-600">Transaction ID</p>
                    <p className="font-mono text-sm text-purple-900 break-all">{scanResult.booking?.transactionId || 'N/A'}</p>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded p-3">
                  <h6 className="font-semibold text-amber-900 mb-2">⚠️ Important: Verify Before Confirming</h6>
                  <ol className="text-amber-800 text-sm space-y-1">
                    <li>1. Open your UPI app (PhonePe, GPay, etc.)</li>
                    <li>2. Check transaction history for ID: <strong>{scanResult.booking?.transactionId || 'N/A'}</strong></li>
                    <li>3. Confirm you received exactly <strong>₹{scanResult.booking?.paidAmount || scanResult.paidAmount || '0'}</strong></li>
                    <li>4. Only confirm visit if amount matches</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Selected Items */}
            {(scanResult.booking?.selectedItems || scanResult.selectedItems) && (
              <div className="p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">🛍️</span> Ordered Items
                </h4>
                <div className="bg-white border rounded-lg">
                  {(() => {
                    try {
                      const items = JSON.parse(scanResult.booking?.selectedItems || scanResult.selectedItems || '[]');
                      return items.length > 0 ? (
                        <div className="divide-y divide-gray-200">
                          {items.map((item, index) => (
                            <div key={index} className="p-4 flex items-center justify-between">
                              <div className="flex-1">
                                <h5 className="font-semibold text-gray-900">{item.itemName || item.name}</h5>
                                <div className="text-sm text-gray-600 mt-1">
                                  {item.sizes && <span className="mr-3">Size: {item.sizes}</span>}
                                  {item.color && <span className="mr-3">Color: {item.color}</span>}
                                  {item.fabric && <span className="mr-3">Fabric: {item.fabric}</span>}
                                  {item.brand && <span className="mr-3">Brand: {item.brand}</span>}
                                </div>
                                {item.stock && (
                                  <div className="text-xs text-blue-600 mt-1">Stock: {item.stock} available</div>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-lg text-gray-900">₹{item.price}</p>
                                {item.quantity && <p className="text-sm text-gray-600">Qty: {item.quantity}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          <p>No items found</p>
                        </div>
                      );
                    } catch (e) {
                      return (
                        <div className="p-4">
                          <p className="text-gray-700 text-sm">{scanResult.booking?.selectedItems || scanResult.selectedItems}</p>
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleConfirmVisit}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-4 px-6 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 font-semibold text-lg shadow-lg flex items-center justify-center"
              >
                <span className="mr-2">✅</span>
                Confirm Visit & Complete Booking
              </button>
              <button
                onClick={resetScanner}
                className="bg-gray-600 text-white px-8 py-4 rounded-xl hover:bg-gray-700 transition-colors font-semibold flex items-center justify-center"
              >
                <span className="mr-2">🔄</span>
                Scan Another QR
              </button>
            </div>

            {/* Payment Collection Reminder */}
            {(scanResult.remainingAmount > 0 || (scanResult.booking?.remainingAmount && scanResult.booking.remainingAmount > 0)) && (
              <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-orange-600 text-xl mr-3">💰</span>
                  <div>
                    <p className="font-semibold text-orange-900">Payment Collection Required</p>
                    <p className="text-orange-800 text-sm">
                      Please collect ₹{scanResult.remainingAmount || scanResult.booking?.remainingAmount} from the customer before confirming the visit.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Success Message for Full Payment */}
            {(!scanResult.remainingAmount || scanResult.remainingAmount === 0) && 
             (!scanResult.booking?.remainingAmount || scanResult.booking.remainingAmount === 0) && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-green-600 text-xl mr-3">✅</span>
                  <div>
                    <p className="font-semibold text-green-900">Payment Complete</p>
                    <p className="text-green-800 text-sm">
                      Full payment received. You can proceed to confirm the visit.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
            <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
              <span className="mr-2">📋</span> Instructions
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-start">
                  <span className="text-blue-600 mr-2">1.</span>
                  <p className="text-blue-800">Verify customer identity matches the booking details</p>
                </div>
                <div className="flex items-start">
                  <span className="text-blue-600 mr-2">2.</span>
                  <p className="text-blue-800">Check visit date and time are correct</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start">
                  <span className="text-blue-600 mr-2">3.</span>
                  <p className="text-blue-800">Collect any remaining payment if applicable</p>
                </div>
                <div className="flex items-start">
                  <span className="text-blue-600 mr-2">4.</span>
                  <p className="text-blue-800">Click "Confirm Visit" to complete the process</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRScanner;