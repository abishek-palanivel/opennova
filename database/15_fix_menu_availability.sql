-- Fix Menu Availability Issues - Permanent Solution
-- This script ensures all menu items are properly available for booking

-- Step 1: Update all menu items to be available and active
UPDATE menus 
SET 
    is_available = true,
    is_active = true,
    availability_time = COALESCE(availability_time, '9:00 AM - 11:00 PM'),
    preparation_time = COALESCE(preparation_time, 15),
    category = COALESCE(category, 'Services'),
    updated_at = NOW()
WHERE 
    is_available IS NULL 
    OR is_active IS NULL 
    OR is_available = false
    OR is_active = false
    OR availability_time IS NULL;

-- Step 2: Verify the changes
SELECT 
    id,
    item_name,
    price,
    is_available,
    is_active,
    availability_time,
    establishment_id,
    category
FROM menus 
ORDER BY establishment_id, id;

-- Step 3: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_menus_availability 
ON menus(establishment_id, is_available, is_active);

-- Step 4: Add constraints to prevent future issues
ALTER TABLE menus 
ALTER COLUMN is_available SET DEFAULT true,
ALTER COLUMN is_active SET DEFAULT true,
ALTER COLUMN availability_time SET DEFAULT '9:00 AM - 11:00 PM',
ALTER COLUMN preparation_time SET DEFAULT 15;

-- Step 5: Show final status
SELECT 
    establishment_id,
    COUNT(*) as total_menus,
    COUNT(CASE WHEN is_available = true AND is_active = true THEN 1 END) as available_menus,
    COUNT(CASE WHEN is_available = false OR is_active = false THEN 1 END) as unavailable_menus
FROM menus 
GROUP BY establishment_id
ORDER BY establishment_id;