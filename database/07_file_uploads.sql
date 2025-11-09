-- Add profile image column to establishments table
ALTER TABLE establishments ADD COLUMN profile_image_path VARCHAR(500);

-- Update menu table to ensure image_path column exists (if not already present)
-- This is safe to run even if column exists
ALTER TABLE menus ADD COLUMN IF NOT EXISTS image_path VARCHAR(500);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_establishments_profile_image ON establishments(profile_image_path);
CREATE INDEX IF NOT EXISTS idx_menus_image_path ON menus(image_path);

-- Remove any default/seed data that should not be shown to users
-- This ensures only owner-created content is displayed
DELETE FROM reviews WHERE comment LIKE '%Default%' OR comment LIKE '%Sample%';
DELETE FROM menus WHERE name LIKE '%Default%' OR name LIKE '%Sample%';

-- Update any existing establishments to have proper status
UPDATE establishments SET status = 'OPEN' WHERE status IS NULL;