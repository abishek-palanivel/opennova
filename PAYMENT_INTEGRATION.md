# Payment Integration Guide - UPI Payment System

## Overview

OpenNova uses a **UPI-based payment system** with QR code integration for secure payment processing. Establishments can upload their own UPI QR codes, and the system verifies payments through UPI transaction IDs.

## How It Works

### Payment Flow

1. **User initiates booking** → Selects establishment and booking details
2. **System calculates advance** → 70% of total amount required upfront
3. **QR Code displayed** → Establishment's UPI QR code shown to user
4. **User pays via UPI** → Uses any UPI app (Google Pay, PhonePe, Paytm, etc.)
5. **User enters Transaction ID** → Submits UPI transaction ID for verification
6. **System verifies payment** → Validates transaction ID and amount
7. **Booking confirmed** → Email sent with booking confirmation

## Setup Instructions

### For Establishment Owners

1. **Login to Owner Portal**
2. Navigate to **Settings** → **Establishment Settings**
3. Add your **UPI ID** (e.g., `yourname@paytm`)
4. Upload your **UPI QR Code** image
5. Save settings

### UPI QR Code Requirements

- **Format**: JPG, PNG (recommended)
- **Size**: Maximum 10MB
- **Quality**: Clear and scannable
- **Content**: Must contain your UPI ID

### How to Generate UPI QR Code

1. Open any UPI app (Google Pay, PhonePe, Paytm)
2. Go to **Profile** → **QR Code** or **My QR**
3. Take a screenshot of your QR code
4. Upload to OpenNova Owner Portal

## Payment Configuration

### Backend Configuration

No additional configuration needed. The system uses:
- UPI transaction ID verification
- Amount validation (70% advance payment)
- Secure payment tracking

### Frontend Configuration

Located in `frontend/src/config/constants.js`:

```javascript
payment: {
  upiId: 'merchant@paytm', // Default fallback
  advancePercentage: 70,
  refundProcessingTime: '24 hours'
}
```

## Implementation Details

### Backend Payment Controller

**Location**: `backend/src/main/java/com/opennova/controller/PaymentController.java`

**Key Endpoints**:

1. **Generate Payment Request**
   ```
   POST /api/payment/generate-request
   ```
   - Creates payment request with transaction reference
   - Returns establishment UPI details and QR code
   - Generates UPI payment URL

2. **Verify Payment**
   ```
   POST /api/payment/verify
   ```
   - Validates UPI transaction ID
   - Verifies payment amount matches expected amount
   - Updates booking status

3. **Verify Payment (Strict)**
   ```
   POST /api/payment/verify-strict
   ```
   - Ultra-strict verification with exact amount matching
   - Prevents fraud attempts

4. **Check Payment Status**
   ```
   GET /api/payment/status/{transactionRef}
   ```
   - Returns current payment status

### Payment Verification Service

**Location**: `backend/src/main/java/com/opennova/service/PaymentVerificationService.java`

**Features**:
- Transaction reference generation
- UPI transaction ID validation
- Amount verification
- Fraud detection
- Payment status tracking

## Security Features

✅ **Transaction ID Verification**: Each payment requires valid UPI transaction ID
✅ **Amount Validation**: System verifies exact payment amount (70% advance)
✅ **Fraud Detection**: Detects underpayment, overpayment, and fake transactions
✅ **Secure Storage**: Payment details stored securely in database
✅ **Owner Verification**: Owners can verify received payments
✅ **Expiry Time**: Payment requests expire after set duration

## Testing the Payment System

### Test Scenarios

1. **Successful Payment**
   - User pays exact advance amount (70%)
   - Enters valid UPI transaction ID
   - Booking confirmed immediately

2. **Underpayment Detection**
   - User pays less than required amount
   - System rejects verification
   - Booking remains pending

3. **Invalid Transaction ID**
   - User enters fake/incorrect transaction ID
   - System rejects verification
   - User prompted to enter correct ID

4. **Overpayment Handling**
   - User pays more than required
   - System flags for refund processing
   - Owner notified

### Test Endpoint

```
POST /api/payment/test-fraud-detection
```

Test scenarios:
- `honest_payment` - Correct amount paid
- `underpayment_fraud` - Less amount paid
- `overpayment` - More amount paid
- `fake_transaction` - Invalid transaction ID

## User Experience

### For Customers

1. Select establishment and booking details
2. View total amount and advance payment (70%)
3. Scan establishment's UPI QR code
4. Pay using any UPI app
5. Enter UPI transaction ID in booking form
6. Receive instant confirmation email

### For Owners

1. Upload UPI QR code in settings
2. Receive booking requests with payment details
3. Verify payment received in UPI app
4. Approve/reject booking
5. Collect remaining 30% on visit

## Payment Calculation

```javascript
Total Amount: ₹1000
Advance Payment (70%): ₹700
Remaining Amount (30%): ₹300 (paid on visit)
```

## Troubleshooting

### Payment verification fails
- **Check**: UPI transaction ID is correct (12 digits)
- **Check**: Amount paid matches advance amount
- **Check**: Transaction completed successfully in UPI app

### QR code not displaying
- **Check**: Owner has uploaded UPI QR code
- **Check**: Image file is valid format (JPG/PNG)
- **Check**: File size under 10MB

### Transaction ID not accepted
- **Check**: Transaction ID format is correct
- **Check**: Payment was actually completed
- **Check**: Using transaction ID from correct payment

## Database Schema

### Payment Tracking

Payments are tracked in the `booking` table:
- `transaction_id` - UPI transaction ID
- `payment_amount` - Amount paid (70% advance)
- `payment_status` - PAID/PENDING/FAILED
- `amount` - Total booking amount

### Establishment UPI Details

Stored in `establishment` table:
- `upi_id` - Establishment's UPI ID
- `upi_qr_code_path` - Path to uploaded QR code image

## API Reference

### Generate Payment Request

```json
POST /api/payment/generate-request
{
  "establishmentId": 1,
  "amount": 700.00,
  "bookingId": 123
}

Response:
{
  "success": true,
  "transactionRef": "TXN1234567890",
  "upiId": "merchant@paytm",
  "amount": 700.00,
  "establishmentName": "Hotel ABC",
  "establishmentUpiQrCodePath": "/uploads/qr/hotel-abc.png",
  "upiUrl": "upi://pay?pa=merchant@paytm&am=700.00&tn=Booking..."
}
```

### Verify Payment

```json
POST /api/payment/verify
{
  "transactionRef": "TXN1234567890",
  "upiTransactionId": "123456789012"
}

Response:
{
  "verified": true,
  "message": "Payment verified successfully",
  "verifiedAt": "2024-03-11T10:30:00",
  "amount": 700.00
}
```

## Important Notes

⚠️ **UPI Transaction IDs**: Must be 12 digits from actual UPI payment
⚠️ **Amount Verification**: System strictly validates payment amounts
⚠️ **QR Code Upload**: Owners must upload their own UPI QR codes
⚠️ **Advance Payment**: 70% paid online, 30% on visit
⚠️ **No Third-Party Gateway**: Direct UPI payments, no Razorpay/PayU

## Support

For payment-related issues:
- Check establishment UPI ID is correct
- Verify QR code is uploaded and scannable
- Ensure UPI transaction completed successfully
- Contact establishment owner for payment confirmation

## Future Enhancements

- Automatic UPI transaction verification via bank APIs
- Real-time payment status updates
- Refund automation
- Payment analytics dashboard
- Multiple payment methods support
