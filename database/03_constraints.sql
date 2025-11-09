-- Add or update status constraints for bookings table

-- Drop existing constraints if they exist
DO $
BEGIN
    -- Drop existing check constraints
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'bookings_status_check' AND table_name = 'bookings') THEN
        ALTER TABLE bookings DROP CONSTRAINT bookings_status_check;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'bookings_payment_status_check' AND table_name = 'bookings') THEN
        ALTER TABLE bookings DROP CONSTRAINT bookings_payment_status_check;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'bookings_refund_status_check' AND table_name = 'bookings') THEN
        ALTER TABLE bookings DROP CONSTRAINT bookings_refund_status_check;
    END IF;
END $;

-- Add new check constraints with correct enum values
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
    CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'));

ALTER TABLE bookings ADD CONSTRAINT bookings_payment_status_check 
    CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED'));

ALTER TABLE bookings ADD CONSTRAINT bookings_refund_status_check 
    CHECK (refund_status IN ('NOT_APPLICABLE', 'PENDING', 'APPROVED', 'REJECTED', 'NOT_ELIGIBLE'));

COMMIT;