-- Add menu-related columns and improvements

-- Add image support for menu items
ALTER TABLE menus ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);

-- Add availability flag
ALTER TABLE menus ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;

-- Add category for better organization
ALTER TABLE menus ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- Add timestamps if missing
ALTER TABLE menus ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE menus ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS update_menus_updated_at ON menus;
CREATE TRIGGER update_menus_updated_at BEFORE UPDATE ON menus
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

SELECT 'Menu columns added successfully!' AS status;
