-- Add weekly_schedule column to establishments table
-- This script adds support for detailed weekly schedules with per-day operating hours and status

-- Add the weekly_schedule column
ALTER TABLE establishments 
ADD COLUMN weekly_schedule TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN establishments.weekly_schedule IS 'JSON string containing weekly schedule with per-day operating hours and status';

-- Update existing establishments with sample weekly schedules based on their current operating hours
-- PostgreSQL JSON format
UPDATE establishments 
SET weekly_schedule = '{"monday":{"openTime":"09:00","closeTime":"21:00","status":"OPEN","isClosed":false},"tuesday":{"openTime":"09:00","closeTime":"21:00","status":"OPEN","isClosed":false},"wednesday":{"openTime":"09:00","closeTime":"21:00","status":"OPEN","isClosed":false},"thursday":{"openTime":"09:00","closeTime":"21:00","status":"OPEN","isClosed":false},"friday":{"openTime":"09:00","closeTime":"21:00","status":"OPEN","isClosed":false},"saturday":{"openTime":"09:00","closeTime":"21:00","status":"OPEN","isClosed":false},"sunday":{"openTime":"09:00","closeTime":"21:00","status":"OPEN","isClosed":false}}'
WHERE weekly_schedule IS NULL;

-- Verify the update
SELECT id, name, type, operating_hours, weekly_schedule 
FROM establishments 
LIMIT 5;