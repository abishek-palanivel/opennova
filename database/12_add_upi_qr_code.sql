-- Add UPI QR Code path column to establishments table
-- This allows establishments to upload their UPI QR code images for easier payments

ALTER TABLE establishments 
ADD COLUMN upi_qr_code_path VARCHAR(500) NULL 
COMMENT 'Path to uploaded UPI QR code image file';

-- Add index for faster queries
CREATE INDEX idx_establishments_upi_qr_code ON establishments(upi_qr_code_path);

-- Update existing establishments to have NULL UPI QR code path (already default)
-- No data migration needed as this is a new optional feature