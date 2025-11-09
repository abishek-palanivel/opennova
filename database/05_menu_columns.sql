-- Add missing columns to menus table
-- This script adds columns that are referenced in the Menu model but might be missing from the database

DO $
BEGIN
    -- Add category column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'menus' AND column_name = 'category'
    ) THEN
        ALTER TABLE menus ADD COLUMN category VARCHAR(255);
        RAISE NOTICE 'Added category column to menus table';
    END IF;
    
    -- Add preparation_time column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'menus' AND column_name = 'preparation_time'
    ) THEN
        ALTER TABLE menus ADD COLUMN preparation_time INTEGER DEFAULT 15;
        RAISE NOTICE 'Added preparation_time column to menus table';
    END IF;
    
    -- Add is_vegetarian column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'menus' AND column_name = 'is_vegetarian'
    ) THEN
        ALTER TABLE menus ADD COLUMN is_vegetarian BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added is_vegetarian column to menus table';
    END IF;
    
    -- Add is_available column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'menus' AND column_name = 'is_available'
    ) THEN
        ALTER TABLE menus ADD COLUMN is_available BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added is_available column to menus table';
    END IF;
    
END $;

COMMIT;