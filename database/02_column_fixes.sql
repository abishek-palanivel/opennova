-- Fix paid_amount column in bookings table
-- This script handles the column name mismatch and ensures proper constraints

-- First, check if paid_amount column exists, if not rename payment_amount to paid_amount
DO $
BEGIN
    -- Check if paid_amount column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'paid_amount'
    ) THEN
        -- Check if payment_amount exists and rename it
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'bookings' AND column_name = 'payment_amount'
        ) THEN
            ALTER TABLE bookings RENAME COLUMN payment_amount TO paid_amount;
            RAISE NOTICE 'Renamed payment_amount to paid_amount';
        ELSE
            -- Add the column if neither exists
            ALTER TABLE bookings ADD COLUMN paid_amount DECIMAL(10, 2);
            RAISE NOTICE 'Added paid_amount column';
        END IF;
    END IF;
    
    -- Update any NULL values to 0 before adding NOT NULL constraint
    UPDATE bookings SET paid_amount = 0.0 WHERE paid_amount IS NULL;
    
    -- Add NOT NULL constraint if it doesn't exist
    BEGIN
        ALTER TABLE bookings ALTER COLUMN paid_amount SET NOT NULL;
        RAISE NOTICE 'Added NOT NULL constraint to paid_amount';
    EXCEPTION
        WHEN others THEN
            RAISE NOTICE 'NOT NULL constraint already exists or could not be added: %', SQLERRM;
    END;
    
END $;

-- Update any existing records where paid_amount is 0 but total_amount exists
UPDATE bookings 
SET paid_amount = total_amount * 0.7 
WHERE paid_amount = 0.0 AND total_amount > 0;

COMMIT;