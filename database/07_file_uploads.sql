-- File upload and storage management

-- Add QR code support for bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS qr_code_url VARCHAR(500);

-- Add payment ID tracking
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255);

-- Ensure establishments can have multiple images
-- (image_urls is already TEXT[] in schema)

-- Add UPI QR code support for collections
ALTER TABLE collections ADD COLUMN IF NOT EXISTS upi_id VARCHAR(255);

SELECT 'File upload columns added successfully!' AS status;
