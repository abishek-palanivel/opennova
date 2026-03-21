import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import SecurePayment from './SecurePayment';
import ScreenshotPaymentVerification from './ScreenshotPaymentVerification';
// Time utilities available if needed

const BookingFlow = ({ establishment, onClose }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    visitingDate: '',
    visitingTime: '',
    selectedItems: [],
    totalAmount: 0,
    paymentAmount: 0,
    paymentMethod: null, // Only 'screenshot' method available
    paymentVerified: false,
    verifiedPayment: null,
    verificationData: null,
    paymentPending: false
  });
  const [loading, setLoading] = useState(false);

  const steps = [
    { id: 1, title: 'Select Date & Time', icon: '📅' },
    { id: 2, title: 'Choose Items/Services', icon: '🛍️' },
    { id: 3, title: 'Payment', icon: '💳' },
    { id: 4, title: 'Confirmation', icon: '✅' }
  ];

  useEffect(() => {
    // Calculate payment amount (70% of total)
    setBookingData(prev => ({
      ...prev,
      paymentAmount: Math.round(prev.totalAmount * 0.7)
    }));
  }, [bookingData.totalAmount]);

  const handleItemSelection = (item, isSelected) => {
    setBookingData(prev => {
      const updatedItems = isSelected
        ? [...prev.selectedItems, item]
        : prev.selectedItems.filter(i => i.id !== item.id);
      
      const totalAmount = updatedItems.reduce((sum, item) => sum + getItemPrice(item), 0);
      
      return {
        ...prev,
        selectedItems: updatedItems,
        totalAmount
      };
    });
  };

  const handlePaymentVerified = (verifiedPayment) => {
    console.log('🎉 PAYMENT VERIFIED - User can now proceed to next step!');
    
    setBookingData(prev => ({
      ...prev,
      paymentVerified: true,
      verifiedPayment: verifiedPayment
    }));
    
    // Show confirmation that payment is verified and user can proceed
    alert('🎉 PAYMENT VERIFIED!\n\nYour payment has been confirmed with the bank.\nYou can now proceed to complete your booking!');
    
    // Auto-proceed to next step after payment verification
    setTimeout(() => {
      setCurrentStep(4);
    }, 2000);
  };

  const handlePaymentCancel = () => {
    setBookingData(prev => ({
      ...prev,
      paymentVerified: false,
      verifiedPayment: null
    }));
  };

  const submitBooking = async () => {
    setLoading(true);
    try {
      console.log('📝 Submitting booking with payment data:', {
        verifiedPayment: bookingData.verifiedPayment,
        verificationData: bookingData.verificationData,
        paymentMethod: bookingData.paymentMethod
      });
      
      const formData = new FormData();
      formData.append('establishmentId', establishment.id);
      formData.append('visitingDate', bookingData.visitingDate);
      formData.append('visitingTime', bookingData.visitingTime);
      formData.append('selectedItems', JSON.stringify(bookingData.selectedItems));
      formData.append('totalAmount', bookingData.totalAmount);
      formData.append('paymentAmount', bookingData.paymentAmount);
      
      // Handle screenshot payment method
      if (bookingData.paymentMethod === 'screenshot' && bookingData.verificationData) {
        // Screenshot verification - pending owner approval
        formData.append('transactionId', bookingData.verificationData.transactionId);
        formData.append('transactionRef', bookingData.verificationData.transactionRef);
        formData.append('paymentVerified', 'false'); // Will be verified by owner
        formData.append('verificationId', bookingData.verificationData.verificationId);
        console.log('📸 Screenshot verification data added to booking (pending approval)');
        
      } else {
        console.error('❌ No payment verification data available');
        alert('❌ PAYMENT VERIFICATION REQUIRED\n\nYou must complete payment verification before creating a booking.\nPlease go back to the payment step and complete the payment process.');
        return;
      }

      console.log('📤 Sending booking request...');
      const response = await api.post('/api/user/bookings', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('✅ Booking created successfully:', response.data);
      setCurrentStep(4);
      
      // Show success message for screenshot verification
      if (bookingData.paymentMethod === 'screenshot') {
        alert('🎉 Booking submitted successfully!\n\nYour booking is pending payment verification by the establishment owner.\nYou will receive confirmation once your payment is approved.');
      } else {
        alert('🎉 Booking created successfully! Check your email for confirmation details.');
      }
      
      // Auto-redirect after 5 seconds to give user time to read
      setTimeout(() => {
        onClose();
        navigate('/user/bookings');
      }, 5000);
      
    } catch (error) {
      console.error('❌ Booking failed:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Booking failed. Please try again.';
      alert('❌ Booking Failed: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Function to check if visiting time matches doctor availability
  const isTimeWithinAvailability = (visitingTime, availabilityTime) => {
    if (!availabilityTime || !visitingTime) return false;
    
    // Parse availability time (e.g., "9:00 AM - 5:00 PM")
    const timeRange = availabilityTime.split(' - ');
    if (timeRange.length !== 2) return true; // If format is unclear, allow booking
    
    const [startTime, endTime] = timeRange;
    
    // Convert times to 24-hour format for comparison
    const convertTo24Hour = (time12h) => {
      const [time, modifier] = time12h.split(' ');
      let [hours, minutes] = time.split(':');
      
      // Convert to number for calculations
      hours = parseInt(hours, 10);
      
      // Handle 12 AM (midnight) and 12 PM (noon)
      if (hours === 12) {
        hours = modifier === 'AM' ? 0 : 12;
      } else if (modifier === 'PM') {
        hours += 12;
      }
      
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    };
    
    try {
      const startTime24 = convertTo24Hour(startTime);
      const endTime24 = convertTo24Hour(endTime);
      
      return visitingTime >= startTime24 && visitingTime <= endTime24;
    } catch (error) {
      console.error('Error parsing time:', error);
      return true; // Allow booking if parsing fails
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return bookingData.visitingDate && bookingData.visitingTime;
      case 2:
        return bookingData.selectedItems.length > 0;
      case 3:
        // PAYMENT GATE: User MUST complete screenshot verification before proceeding
        const screenshotSubmitted = bookingData.verificationData && bookingData.paymentPending;
        
        console.log('🚪 PAYMENT GATE CHECK:', {
          step: currentStep,
          paymentMethod: bookingData.paymentMethod,
          screenshotSubmitted: screenshotSubmitted,
          canProceed: screenshotSubmitted
        });
        
        return screenshotSubmitted;
      default:
        return true;
    }
  };
  
  const getStepBlockedReason = () => {
    switch (currentStep) {
      case 1:
        if (!bookingData.visitingDate) return 'Please select a visiting date';
        if (!bookingData.visitingTime) return 'Please select a visiting time';
        return null;
      case 2:
        if (bookingData.selectedItems.length === 0) return 'Please select at least one item/service';
        return null;
      case 3:
        if (!bookingData.paymentVerified || !bookingData.verifiedPayment) {
          return 'You must complete payment verification before proceeding to booking confirmation';
        }
        return null;
      default:
        return null;
    }
  };

  // Availability validation removed for simplicity

  const getAvailableItems = () => {
    if (establishment.type === 'HOTEL') return establishment.menuItems || [];
    if (establishment.type === 'HOSPITAL') return establishment.doctors || [];
    if (establishment.type === 'SHOP') return establishment.collections || [];
    return [];
  };

  const getItemPrice = (item) => {
    if (establishment.type === 'HOSPITAL') return item.consultationFee || item.price;
    return item.price;
  };

  const getItemName = (item) => {
    if (establishment.type === 'HOSPITAL') return `Dr. ${item.name}`;
    if (establishment.type === 'SHOP') return item.itemName || item.name;
    return item.name;
  };

  const getItemDescription = (item) => {
    if (establishment.type === 'HOSPITAL') return item.specialization;
    if (establishment.type === 'SHOP') return `${item.brand} - ${item.fabric}`;
    return item.description;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Book {establishment.name}</h2>
              <p className="text-blue-100">Complete your booking in {4 - currentStep + 1} steps</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 text-2xl"
            >
              ✕
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mt-6">
            {steps.map((step) => (
              <div key={step.id} className="flex items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 ${
                  currentStep >= step.id 
                    ? 'bg-white text-blue-600 shadow-lg' 
                    : 'bg-blue-500 text-white'
                }`}>
                  {currentStep > step.id ? '✓' : step.icon}
                </div>
                <div className="ml-3 hidden md:block">
                  <p className={`text-sm font-semibold ${currentStep >= step.id ? 'text-white' : 'text-blue-200'}`}>
                    {step.title}
                  </p>
                </div>
                {step.id < steps.length && (
                  <div className={`w-8 h-1 mx-4 rounded-full ${
                    currentStep > step.id ? 'bg-white' : 'bg-blue-500'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[60vh]">
          {/* Step 1: Date & Time Selection */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Select Date & Time</h3>
                <p className="text-slate-600">Choose your preferred visiting date and time</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-lg font-semibold text-slate-700 mb-3">
                    📅 Visiting Date
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={bookingData.visitingDate}
                    onChange={(e) => setBookingData(prev => ({ ...prev, visitingDate: e.target.value }))}
                    className="w-full px-4 py-4 border-2 border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 text-lg"
                  />
                </div>

                <div>
                  <label className="block text-lg font-semibold text-slate-700 mb-3">
                    🕒 Visiting Time
                  </label>
                  <input
                    type="time"
                    value={bookingData.visitingTime}
                    onChange={(e) => setBookingData(prev => ({ ...prev, visitingTime: e.target.value }))}
                    className="w-full px-4 py-4 border-2 border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 text-lg"
                  />
                </div>
              </div>

              <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                  <span className="mr-2">ℹ️</span>
                  Booking Information
                </h4>
                <ul className="text-blue-800 space-y-2">
                  <li>• Visiting duration: 2 hours from selected time</li>
                  <li>• Advance booking required (minimum 2 hours ahead)</li>
                  <li>• You can cancel up to 2 hours before for full refund</li>
                  {establishment.type === 'HOSPITAL' && (
                    <li>• ⚠️ Selected time must match doctor availability</li>
                  )}
                </ul>
              </div>

              {establishment.type === 'HOSPITAL' && bookingData.visitingTime && (
                <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-200">
                  <p className="text-yellow-800 text-sm">
                    <span className="font-semibold">Note:</span> Your selected time ({bookingData.visitingTime}) will be validated against doctor availability in the next step.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Item/Service Selection */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                  Choose {establishment.type === 'HOTEL' ? 'Menu Items' : 
                           establishment.type === 'HOSPITAL' ? 'Doctor' : 'Items'}
                </h3>
                <p className="text-slate-600">Select what you'd like to book</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getAvailableItems().map((item) => (
                  <div
                    key={item.id}
                    className={`border-2 rounded-2xl p-6 cursor-pointer transition-all duration-300 ${
                      bookingData.selectedItems.find(i => i.id === item.id)
                        ? 'border-blue-500 bg-blue-50'
                        : establishment.type === 'HOSPITAL' && bookingData.visitingTime && !isTimeWithinAvailability(bookingData.visitingTime, item.availabilityTime)
                        ? 'border-red-200 bg-red-50 opacity-60 cursor-not-allowed'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => {
                      // For hospitals, check availability before allowing selection
                      if (establishment.type === 'HOSPITAL' && bookingData.visitingTime && !isTimeWithinAvailability(bookingData.visitingTime, item.availabilityTime)) {
                        alert(`Dr. ${item.name} is not available at ${bookingData.visitingTime}. Available: ${item.availabilityTime}`);
                        return;
                      }
                      handleItemSelection(item, !bookingData.selectedItems.find(i => i.id === item.id));
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 mb-2">
                          {getItemName(item)}
                        </h4>
                        <p className="text-slate-600 text-sm mb-3">
                          {getItemDescription(item)}
                        </p>
                        {establishment.type === 'HOSPITAL' && item.availabilityTime && (
                          <p className="text-xs text-slate-500 mb-2">
                            🕒 Available: {item.availabilityTime}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-blue-600">
                            ₹{getItemPrice(item)}
                          </span>
                          <div className="flex flex-col items-end">
                            <span className={`px-2 py-1 text-xs rounded-full mb-1 ${
                              item.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {item.available ? 'Available' : 'Unavailable'}
                            </span>
                            {establishment.type === 'HOSPITAL' && bookingData.visitingTime && (
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                isTimeWithinAvailability(bookingData.visitingTime, item.availabilityTime)
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {isTimeWithinAvailability(bookingData.visitingTime, item.availabilityTime)
                                  ? 'Time Match' : 'Time Conflict'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 ml-4 flex items-center justify-center ${
                        bookingData.selectedItems.find(i => i.id === item.id)
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-slate-300'
                      }`}>
                        {bookingData.selectedItems.find(i => i.id === item.id) && (
                          <span className="text-white text-sm">✓</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {bookingData.selectedItems.length > 0 && (
                <div className="bg-slate-50 rounded-2xl p-6">
                  <h4 className="font-semibold text-slate-900 mb-4">Selected Items</h4>
                  <div className="space-y-2">
                    {bookingData.selectedItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center">
                        <span className="text-slate-700">
                          {getItemName(item)}
                        </span>
                        <span className="font-semibold">
                          ₹{getItemPrice(item)}
                        </span>
                      </div>
                    ))}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between items-center font-bold text-lg">
                        <span>Total Amount:</span>
                        <span>₹{bookingData.totalAmount}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Basic validation can be added here if needed */}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Secure Payment */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Secure Payment</h3>
                <p className="text-slate-600">Choose your preferred payment verification method</p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200 mb-6">
                <h4 className="font-semibold text-blue-900 mb-4">Payment Summary</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Amount:</span>
                    <span>₹{bookingData.totalAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Advance Payment (70%):</span>
                    <span className="font-bold">₹{bookingData.paymentAmount}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Remaining (Pay at venue):</span>
                    <span>₹{bookingData.totalAmount - bookingData.paymentAmount}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              {!bookingData.paymentMethod && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-center mb-4">Choose Payment Method:</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Screenshot Verification Method */}
                    <div 
                      onClick={() => setBookingData(prev => ({ ...prev, paymentMethod: 'screenshot' }))}
                      className="border-2 border-blue-200 rounded-lg p-6 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all"
                    >
                      <div className="text-center">
                        <div className="text-4xl mb-3">📸</div>
                        <h5 className="font-semibold text-gray-800 mb-2">Screenshot Verification</h5>
                        <p className="text-sm text-gray-600 mb-3">
                          Pay via UPI and upload screenshot for owner verification
                        </p>
                        <div className="text-xs text-green-600 font-medium">
                          ✅ Most Secure • Owner Verified
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Screenshot Payment Component */}
              {bookingData.paymentMethod === 'screenshot' && (
                <ScreenshotPaymentVerification
                  establishment={establishment}
                  amount={bookingData.paymentAmount}
                  onVerificationSubmitted={(verificationData) => {
                    setBookingData(prev => ({
                      ...prev,
                      paymentVerified: false, // Will be verified by owner
                      verificationData: verificationData,
                      paymentPending: true
                    }));
                    alert('📸 Payment verification submitted!\n\nYour payment screenshot has been sent to the establishment owner for review.\nYou will be notified once it\'s approved.');
                  }}
                  onCancel={() => setBookingData(prev => ({ ...prev, paymentMethod: null }))}
                />
              )}
            </div>
          )}

          {/* Step 4: Confirmation */}
          {currentStep === 4 && (
            <div className="text-center space-y-6 animate-scale-in">
              <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <span className="text-4xl text-white">✅</span>
              </div>
              
              <div>
                <h3 className="text-3xl font-bold text-slate-900 mb-4">Booking Confirmed!</h3>
                <p className="text-xl text-slate-600 mb-6">
                  Your booking has been successfully created
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-6 text-left max-w-md mx-auto">
                <h4 className="font-semibold text-slate-900 mb-4">Booking Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Establishment:</span>
                    <span className="font-semibold">{establishment.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{new Date(bookingData.visitingDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time:</span>
                    <span>{bookingData.visitingTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount Paid:</span>
                    <span className="font-semibold">₹{bookingData.paymentAmount}</span>
                  </div>
                  {bookingData.verifiedPayment && (
                    <div className="flex justify-between">
                      <span>Payment Status:</span>
                      <span className="font-semibold text-green-600">✅ Verified</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                  <p className="text-blue-800 font-semibold mb-2">📧 Check your email!</p>
                  <p className="text-blue-700 text-sm">
                    We've sent your booking confirmation and QR code to your registered email address.
                  </p>
                </div>

                <p className="text-slate-600 text-sm">
                  Redirecting to My Bookings in 3 seconds...
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {currentStep < 4 && (
          <div className="bg-slate-50 px-8 py-6">
            {/* Payment Gate Indicator */}
            {!canProceedToNext() && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center">
                  <span className="text-red-600 text-lg mr-3">🚫</span>
                  <div>
                    <p className="text-red-900 font-semibold">Cannot Proceed</p>
                    <p className="text-red-800 text-sm">{getStepBlockedReason()}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Payment Success Indicator */}
            {currentStep === 3 && bookingData.paymentVerified && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center">
                  <span className="text-green-600 text-lg mr-3">✅</span>
                  <div>
                    <p className="text-green-900 font-semibold">Payment Verified!</p>
                    <p className="text-green-800 text-sm">You paid exactly ₹{bookingData.paymentAmount}. You can now complete your booking.</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className="px-6 py-3 border border-slate-300 text-slate-600 rounded-xl font-semibold hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                ← Previous
              </button>

              <div className="text-sm text-slate-500">
                Step {currentStep} of {steps.length}
                {currentStep === 3 && !bookingData.paymentVerified && (
                  <div className="text-red-600 font-semibold mt-1">
                    🔒 Payment Required
                  </div>
                )}
              </div>

              {currentStep === 3 ? (
                <button
                  onClick={submitBooking}
                  disabled={!canProceedToNext() || loading}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  {loading ? 'Processing...' : 
                   !canProceedToNext() ? '🔒 Payment Required' : 
                   'Confirm Booking ✅'}
                </button>
              ) : (
                <button
                  onClick={nextStep}
                  disabled={!canProceedToNext()}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  {!canProceedToNext() ? '🔒 Complete Required Fields' : 'Next →'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingFlow;