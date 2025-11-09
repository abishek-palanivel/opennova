-- Add login attempt tracking and account lockout functionality
-- This migration adds fields to track failed login attempts and implement 24-hour lockout

ALTER TABLE users 
ADD COLUMN failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN account_locked_until TIMESTAMP;

-- Create index for performance on lockout queries
CREATE INDEX idx_users_account_locked_until ON users(account_locked_until);

-- Update existing users to have 0 failed attempts
UPDATE users SET failed_login_attempts = 0 WHERE failed_login_attempts IS NULL;