-- Add login attempt tracking and account lockout features

-- Add columns for tracking failed login attempts
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_attempt TIMESTAMP;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email_active ON users(email, is_active);

-- Function to record failed login attempt
CREATE OR REPLACE FUNCTION record_failed_login(user_email VARCHAR)
RETURNS void AS $$
DECLARE
    max_attempts INTEGER := 5;
    lockout_duration INTERVAL := '30 minutes';
BEGIN
    UPDATE users
    SET 
        failed_login_attempts = failed_login_attempts + 1,
        last_login_attempt = CURRENT_TIMESTAMP,
        account_locked_until = CASE 
            WHEN failed_login_attempts + 1 >= max_attempts 
            THEN CURRENT_TIMESTAMP + lockout_duration
            ELSE account_locked_until
        END
    WHERE email = user_email;
END;
$$ LANGUAGE plpgsql;

-- Function to reset failed login attempts on successful login
CREATE OR REPLACE FUNCTION reset_failed_login(user_email VARCHAR)
RETURNS void AS $$
BEGIN
    UPDATE users
    SET 
        failed_login_attempts = 0,
        account_locked_until = NULL,
        last_login_attempt = CURRENT_TIMESTAMP
    WHERE email = user_email;
END;
$$ LANGUAGE plpgsql;

-- Function to check if account is locked
CREATE OR REPLACE FUNCTION is_account_locked(user_email VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    locked_until TIMESTAMP;
BEGIN
    SELECT account_locked_until INTO locked_until
    FROM users
    WHERE email = user_email;
    
    IF locked_until IS NULL THEN
        RETURN false;
    END IF;
    
    IF locked_until > CURRENT_TIMESTAMP THEN
        RETURN true;
    ELSE
        -- Unlock account if lockout period has passed
        UPDATE users
        SET account_locked_until = NULL, failed_login_attempts = 0
        WHERE email = user_email;
        RETURN false;
    END IF;
END;
$$ LANGUAGE plpgsql;

SELECT 'Login attempt tracking added successfully!' AS status;
