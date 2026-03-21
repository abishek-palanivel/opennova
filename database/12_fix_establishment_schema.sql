-- Fix establishment schema to match model requirements
-- This addresses the critical password column missing issue and other schema mismatches

-- Add missing columns that the Establishment model expects
ALTER TABLE establishments 
ADD COLUMN IF NOT EXISTS password VARCHAR(255),
ADD COLUMN IF NOT EXISTS profile_image_path VARCHAR(500),
ADD COLUMN IF NOT EXISTS upi_qr_code_path VARCHAR(500),
ADD COLUMN IF NOT EXISTS operating_hours VARCHAR(255),
ADD COLUMN IF NOT EXISTS weekly_schedule TEXT,
ADD COLUMN IF NOT EXISTS upi_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing establishments to have default password (will be properly set during owner registration)
UPDATE establishments 
SET password = 'temp_password_' || id::text 
WHERE password IS NULL;

-- Make password NOT NULL after setting defaults
ALTER TABLE establishments 
ALTER COLUMN password SET NOT NULL;

-- Add unique constraint on email to prevent conflicts
ALTER TABLE establishments 
ADD CONSTRAINT establishments_email_unique UNIQUE (email);

-- Add index for better performance on owner queries
CREATE INDEX IF NOT EXISTS idx_establishments_owner_id ON establishments(owner_id);
CREATE INDEX IF NOT EXISTS idx_establishments_status ON establishments(status);
CREATE INDEX IF NOT EXISTS idx_establishments_active ON establishments(is_active);

-- Update timestamps for existing records
UPDATE establishments 
SET updated_at = CURRENT_TIMESTAMP 
WHERE updated_at IS NULL;