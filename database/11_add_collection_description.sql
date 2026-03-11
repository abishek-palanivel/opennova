-- Add description field to collections table

ALTER TABLE collections ADD COLUMN IF NOT EXISTS description TEXT;

-- Update existing collections with default description
UPDATE collections 
SET description = 'Payment collection for ' || (
    SELECT name FROM establishments WHERE collection_id = collections.id LIMIT 1
)
WHERE description IS NULL;

SELECT 'Collection description column added successfully!' AS status;
