# Payment Integration Guide - Razorpay

## Overview

OpenNova uses Razorpay for secure payment processing. This guide covers setup for both test and production environments.

## Test Mode Setup

### Step 1: Get Your API Keys

1. Sign up at [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Navigate to **Settings** → **API Keys**
3. Switch to **Test Mode** (toggle in top-right)
4. Click **Generate Test Key**
5. Copy both **Key ID** and **Key Secret**

### Step 2: Configure Backend

Create `backend/.env` file:
```env
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_HERE
RAZORPAY_KEY_SECRET=YOUR_SECRET_HERE
```

### Step 3: Configure Frontend

Create `frontend/.env` file:
```env
REACT_APP_RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_HERE
```

⚠️ **Important**: Only add Key ID to frontend, NEVER the Key Secret!

### Step 4: Test Payment Flow

In test mode, use these test card details:

| Card Number | CVV | Expiry | Result |
|-------------|-----|--------|--------|
| 4111 1111 1111 1111 | Any | Future | Success |
| 5555 5555 5555 4444 | Any | Future | Success |
| 4000 0000 0000 0002 | Any | Future | Failure |

**Test UPI IDs:**
- `success@razorpay` - Payment succeeds
- `failure@razorpay` - Payment fails

**Test Netbanking:**
- Select any bank
- Use any credentials (test mode doesn't validate)

## Implementation Details

### Backend Payment Controller

Location: `backend/src/main/java/com/opennova/controller/PaymentController.java`

Key endpoints:
- `POST /api/payments/create-order` - Creates Razorpay order
- `POST /api/payments/verify` - Verifies payment signature
- `POST /api/payments/webhook` - Handles payment webhooks

### Frontend Payment Component

Location: `frontend/src/components/PaymentModal.js`

Features:
- Razorpay checkout integration
- UPI QR code display
- Payment status tracking
- Error handling

## Payment Flow

1. **User initiates booking** → Frontend sends booking request
2. **Backend creates order** → Razorpay order created with amount
3. **Frontend opens checkout** → Razorpay modal displays payment options
4. **User completes payment** → Payment processed by Razorpay
5. **Backend verifies signature** → Ensures payment authenticity
6. **Booking confirmed** → Status updated, email sent

## Security Features

✅ **Signature Verification**: All payments verified using HMAC SHA256
✅ **Server-side Validation**: Amount and order details validated on backend
✅ **Webhook Support**: Real-time payment status updates
✅ **Secure Storage**: API secrets stored in environment variables only

## Production Deployment

### Switch to Live Mode

1. In Razorpay Dashboard, switch to **Live Mode**
2. Complete KYC verification
3. Generate **Live API Keys**
4. Update production environment variables:
   ```env
   RAZORPAY_KEY_ID=rzp_live_YOUR_KEY_HERE
   RAZORPAY_KEY_SECRET=YOUR_SECRET_HERE
   ```

### Enable Webhooks

1. Go to **Settings** → **Webhooks**
2. Add webhook URL: `https://your-domain.com/api/payments/webhook`
3. Select events: `payment.captured`, `payment.failed`
4. Copy webhook secret and add to `.env`:
   ```env
   RAZORPAY_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET
   ```

## Testing Checklist

- [ ] Test successful payment with card
- [ ] Test successful payment with UPI
- [ ] Test failed payment scenario
- [ ] Verify booking status updates correctly
- [ ] Check email notification sent
- [ ] Test payment verification logic
- [ ] Verify QR code generation
- [ ] Test refund flow (if implemented)

## Troubleshooting

### Payment fails immediately
- Check API keys are correct
- Verify you're in Test Mode
- Check browser console for errors

### Signature verification fails
- Ensure Key Secret matches the Key ID
- Check signature generation algorithm
- Verify order ID matches

### Webhook not received
- Check webhook URL is publicly accessible
- Verify webhook secret is configured
- Check Razorpay dashboard logs

## API Reference

### Create Order
```javascript
POST /api/payments/create-order
{
  "amount": 1000,
  "bookingId": 123
}
```

### Verify Payment
```javascript
POST /api/payments/verify
{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature_xxx"
}
```

## Support

- Razorpay Docs: https://razorpay.com/docs/
- Test Mode Guide: https://razorpay.com/docs/payments/payments/test-card-details/
- Integration Support: support@razorpay.com

## Important Notes

⚠️ **Never commit API keys to version control**
⚠️ **Always verify payments on server-side**
⚠️ **Use HTTPS in production**
⚠️ **Keep Key Secret confidential**
⚠️ **Rotate keys if exposed**
