-- Add UPI QR code path column to establishments table
-- This allows owners to upload their UPI QR codes for easier payments

-- Check if column exists and add it if not
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'establishments' 
        AND column_name = 'upi_qr_code_path'
    ) THEN
        ALTER TABLE establishments 
        ADD COLUMN upi_qr_code_path VARCHAR(500);
        
        RAISE NOTICE 'Added upi_qr_code_path column to establishments table';
    ELSE
        RAISE NOTICE 'upi_qr_code_path column already exists in establishments table';
    END IF;
END $$;

-- Add comment to the column
COMMENT ON COLUMN establishments.upi_qr_code_path IS 'File path to the uploaded UPI QR code image for this establishment';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_establishments_upi_qr_code_path 
ON establishments(upi_qr_code_path) 
WHERE upi_qr_code_path IS NOT NULL;

RAISE NOTICE 'UPI QR code path setup completed successfully';