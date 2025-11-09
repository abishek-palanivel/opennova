-- Add approval system for reviews
-- Reviews now require owner approval before being displayed to users

-- Add approval status to reviews table
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'PENDING';
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);

-- Update existing reviews to be approved (for backward compatibility)
UPDATE reviews SET status = 'APPROVED', approved_at = created_at WHERE status IS NULL OR status = 'PENDING';

-- Remove any default/sample reviews that should not be shown
DELETE FROM reviews WHERE comment LIKE '%Default%' OR comment LIKE '%Sample%' OR comment LIKE '%Test%';

-- Ensure only owner-created content is displayed by removing default data
DELETE FROM menus WHERE name LIKE '%Default%' OR name LIKE '%Sample%' OR description LIKE '%Default%';
DELETE FROM doctors WHERE name LIKE '%Default%' OR name LIKE '%Sample%' OR specialization LIKE '%Default%';
DELETE FROM collections WHERE item_name LIKE '%Default%' OR item_name LIKE '%Sample%' OR brand LIKE '%Default%';

-- Update menu table to use image_path instead of image_url
ALTER TABLE menus DROP COLUMN IF EXISTS image_url;
ALTER TABLE menus ADD COLUMN IF NOT EXISTS image_path VARCHAR(500);

-- Update doctors table to use image_path instead of image_url  
ALTER TABLE doctors DROP COLUMN IF EXISTS image_url;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS image_path VARCHAR(500);

-- Update collections table to use image_path instead of image_url
ALTER TABLE collections DROP COLUMN IF EXISTS image_url;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS image_path VARCHAR(500);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_menus_image_path ON menus(image_path);
CREATE INDEX IF NOT EXISTS idx_doctors_image_path ON doctors(image_path);
CREATE INDEX IF NOT EXISTS idx_collections_image_path ON collections(image_path);