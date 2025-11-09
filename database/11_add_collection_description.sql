-- Add description column to collections table
-- This migration adds a description field to store detailed information about collection items

-- Add description column if it doesn't exist
ALTER TABLE collections 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Update existing records to have empty description if null
UPDATE collections 
SET description = '' 
WHERE description IS NULL;

-- Add comment to the column
COMMENT ON COLUMN collections.description IS 'Detailed description of the collection item';

-- Verify the change
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'collections' 
AND column_name = 'description';