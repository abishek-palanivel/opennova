-- Column fixes and adjustments

-- Add missing columns to establishments if they don't exist
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS image_urls TEXT[];
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS amenities TEXT[];
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS is_open_24_7 BOOLEAN DEFAULT false;

-- Add missing columns to bookings if they don't exist
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refund_status VARCHAR(50) CHECK (refund_status IN ('NOT_APPLICABLE', 'PENDING', 'PROCESSED', 'FAILED'));
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10, 2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refund_processed_at TIMESTAMP;

-- Add missing columns to reviews if they don't exist
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reviewed_by BIGINT REFERENCES users(id);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;

SELECT 'Column fixes applied successfully!' AS status;
