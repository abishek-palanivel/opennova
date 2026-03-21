-- Add password column to establishment_requests table
-- This allows users to specify their desired password when requesting establishment creation

ALTER TABLE establishment_requests 
ADD COLUMN password VARCHAR(255);

-- Add comment for documentation
COMMENT ON COLUMN establishment_requests.password IS 'Password specified by user for their establishment owner account';