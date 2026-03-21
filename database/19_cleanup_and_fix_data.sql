-- Clean up test data and fix existing data issues
-- This script removes test data and fixes any data inconsistencies

-- Remove test users that were created for testing
DELETE FROM users WHERE email IN ('suspended@test.com', 'active@test.com');

-- Update any bookings with PROCESSED refund status to a valid status
UPDATE bookings 
SET refund_status = 'NOT_APPLICABLE' 
WHERE refund_status = 'PROCESSED' AND payment_status = 'PAID';

-- Update any bookings with invalid refund status
UPDATE bookings 
SET refund_status = 'NOT_APPLICABLE' 
WHERE refund_status NOT IN ('NOT_APPLICABLE', 'PENDING', 'APPROVED', 'REJECTED', 'NOT_ELIGIBLE', 'PROCESSED', 'FAILED');

-- Ensure all bookings have proper user_email field populated
UPDATE bookings 
SET user_email = u.email 
FROM users u 
WHERE bookings.user_id = u.id 
AND (bookings.user_email IS NULL OR bookings.user_email = '');

-- Clean up any orphaned bookings (bookings without valid users or establishments)
DELETE FROM bookings 
WHERE user_id NOT IN (SELECT id FROM users) 
OR establishment_id NOT IN (SELECT id FROM establishments);

-- Update booking statuses to ensure consistency
UPDATE bookings 
SET payment_status = 'PAID' 
WHERE status = 'CONFIRMED' AND payment_status = 'PENDING';

-- Ensure all confirmed bookings have proper payment amounts
UPDATE bookings 
SET paid_amount = total_amount * 0.7 
WHERE status = 'CONFIRMED' 
AND (paid_amount IS NULL OR paid_amount = 0) 
AND total_amount > 0;

SELECT 'Database cleanup completed successfully!' AS status;