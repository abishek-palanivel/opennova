-- Add UPI QR code support to collections

ALTER TABLE collections ADD COLUMN IF NOT EXISTS upi_qr_code_url VARCHAR(500);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_collections_owner ON collections(owner_id);

SELECT 'UPI QR code column added successfully!' AS status;
