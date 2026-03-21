-- Add Google OAuth support to users table
-- This migration adds fields to support Google OAuth authentication

-- Add Google OAuth fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS google_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS profile_picture_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) DEFAULT 'LOCAL';

-- Add constraint for auth_provider
ALTER TABLE users 
ADD CONSTRAINT chk_auth_provider 
CHECK (auth_provider IN ('LOCAL', 'GOOGLE'));

-- Create index on google_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- Create index on auth_provider
CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users(auth_provider);

-- Update existing users to have LOCAL auth provider
UPDATE users 
SET auth_provider = 'LOCAL' 
WHERE auth_provider IS NULL;

-- Show updated table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('google_id', 'profile_picture_url', 'auth_provider')
ORDER BY ordinal_position;

-- Show sample data
SELECT id, full_name, email, auth_provider, google_id, 
       CASE 
           WHEN profile_picture_url IS NOT NULL THEN 'Has Picture'
           ELSE 'No Picture'
       END as picture_status
FROM users 
LIMIT 5;