-- Fix refund_status constraint to match Java enum values
-- This fixes the booking cancellation issue

-- Drop the existing constraint
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_refund_status_check;

-- Add the correct constraint with all enum values
ALTER TABLE bookings ADD CONSTRAINT bookings_refund_status_check 
    CHECK (refund_status IN ('NOT_APPLICABLE', 'PENDING', 'APPROVED', 'REJECTED', 'NOT_ELIGIBLE', 'PROCESSED', 'FAILED'));

-- Update any existing data that might have old values
UPDATE bookings SET refund_status = 'NOT_APPLICABLE' WHERE refund_status IS NULL;

-- Add comment for clarity
COMMENT ON COLUMN bookings.refund_status IS 'Refund status: NOT_APPLICABLE, PENDING, APPROVED, REJECTED, NOT_ELIGIBLE, PROCESSED, FAILED';