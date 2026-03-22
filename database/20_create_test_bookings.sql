-- Create test bookings with correct field mapping
-- This will create proper test bookings for the dashboard

-- Delete any existing test bookings first
DELETE FROM bookings WHERE transaction_id LIKE 'TEST_TXN_%';

-- Use existing user and establishment with correct field mapping
INSERT INTO bookings (
    user_id, establishment_id, user_email, 
    booking_date, visiting_date, visiting_time,
    total_amount, paid_amount, status, payment_status, 
    transaction_id, created_at, updated_at, confirmed_at
) VALUES
-- Confirmed booking with payment
(33, 4, 'abishekjothi26@gmail.com',
 NOW() + INTERVAL '4 days', '2026-03-25', '10:00 AM',
 150.00, 105.00, 'CONFIRMED', 'PAID',
 'TEST_TXN_001_' || EXTRACT(EPOCH FROM NOW())::BIGINT,
 NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),

-- Completed booking with payment
(33, 4, 'abishekjothi26@gmail.com',
 NOW() - INTERVAL '1 day', '2026-03-20', '2:00 PM',
 200.00, 140.00, 'COMPLETED', 'PAID',
 'TEST_TXN_002_' || EXTRACT(EPOCH FROM NOW())::BIGINT,
 NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day', NOW() - INTERVAL '5 days'),

-- Pending booking
(33, 4, 'abishekjothi26@gmail.com',
 NOW() + INTERVAL '7 days', '2026-03-28', '6:00 PM',
 120.00, 84.00, 'PENDING', 'PENDING',
 'TEST_TXN_003_' || EXTRACT(EPOCH FROM NOW())::BIGINT,
 NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour', NULL),

-- Another confirmed booking
(34, 4, 'test.customer@example.com',
 NOW() + INTERVAL '5 days', '2026-03-26', '12:00 PM',
 100.00, 70.00, 'CONFIRMED', 'PAID',
 'TEST_TXN_004_' || EXTRACT(EPOCH FROM NOW())::BIGINT,
 NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

-- Verify the test data was created
SELECT 'Test bookings created successfully!' as status;

SELECT 'Summary of all bookings:' as info,
       COUNT(*) as total_bookings,
       COUNT(CASE WHEN status = 'CONFIRMED' THEN 1 END) as confirmed_bookings,
       COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_bookings,
       COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_bookings,
       COUNT(CASE WHEN payment_status = 'PAID' THEN 1 END) as paid_bookings,
       SUM(total_amount) as total_revenue,
       SUM(CASE WHEN payment_status = 'PAID' THEN paid_amount ELSE 0 END) as actual_paid_revenue
FROM bookings;

-- Show bookings by establishment for owner ID 9 (Abishek Grand Hote)
SELECT 'Bookings for establishment owner ID 9:' as info,
       e.name as establishment_name,
       e.owner_id,
       COUNT(b.id) as booking_count,
       SUM(b.total_amount) as total_revenue,
       SUM(CASE WHEN b.payment_status = 'PAID' THEN b.paid_amount ELSE 0 END) as paid_revenue
FROM establishments e
LEFT JOIN bookings b ON e.id = b.establishment_id
WHERE e.owner_id = 9
GROUP BY e.id, e.name, e.owner_id;

-- Show recent bookings
SELECT 'Recent bookings:' as info;
SELECT 
    id, user_email, visiting_date, visiting_time, 
    total_amount, paid_amount, status, payment_status,
    transaction_id, created_at
FROM bookings 
ORDER BY created_at DESC 
LIMIT 10;