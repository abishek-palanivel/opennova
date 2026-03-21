-- Add isActive column to establishments table for suspend/activate functionality
-- This column is separate from status and specifically tracks if an establishment is suspended by admin

ALTER TABLE establishments 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing establishments to be active by default
UPDATE establishments 
SET is_active = true 
WHERE is_active IS NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_establishments_is_active ON establishments(is_active);

-- Add comment to explain the column
COMMENT ON COLUMN establishments.is_active IS 'Admin-controlled flag for suspending/activating establishments. Different from status which tracks operational state.';