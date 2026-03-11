-- Fix user roles and ensure proper role constraints

-- Ensure role column has proper constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('USER', 'OWNER', 'ADMIN'));

-- Update any invalid roles to USER
UPDATE users SET role = 'USER' WHERE role NOT IN ('USER', 'OWNER', 'ADMIN');

-- Ensure is_active column exists and has default value
ALTER TABLE users ALTER COLUMN is_active SET DEFAULT true;
UPDATE users SET is_active = true WHERE is_active IS NULL;

SELECT 'User roles fixed successfully!' AS status;
