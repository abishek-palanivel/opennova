-- Add missing columns to users table
-- These columns are expected by the User model but missing from the schema

-- Add reset_token column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);

-- Add establishment_type column if it doesn't exist  
ALTER TABLE users ADD COLUMN IF NOT EXISTS establishment_type VARCHAR(100);

-- Add reset_token_expiry column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP;