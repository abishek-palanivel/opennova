-- Fix establishment requests with missing required fields
-- This script updates any establishment requests that have NULL or empty required fields

-- Update NULL city values with a default
UPDATE establishment_requests 
SET city = 'Unknown City' 
WHERE city IS NULL OR city = '';

-- Update NULL state values with a default  
UPDATE establishment_requests 
SET state = 'Unknown State' 
WHERE state IS NULL OR state = '';

-- Update NULL pincode values with a default
UPDATE establishment_requests 
SET pincode = '000000' 
WHERE pincode IS NULL OR pincode = '';

-- Show the updated records
SELECT id, name, email, city, state, pincode, status 
FROM establishment_requests 
WHERE status = 'PENDING'
ORDER BY id;