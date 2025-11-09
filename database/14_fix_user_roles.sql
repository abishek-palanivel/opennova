-- Fix UserRole enum values in database
-- This script updates any ROLE_* prefixed values to match the enum

-- Update user roles to match enum values
UPDATE users SET role = 'USER' WHERE role = 'ROLE_USER';
UPDATE users SET role = 'ADMIN' WHERE role = 'ROLE_ADMIN';
UPDATE users SET role = 'OWNER' WHERE role = 'ROLE_OWNER';
UPDATE users SET role = 'HOTEL_OWNER' WHERE role = 'ROLE_HOTEL_OWNER';
UPDATE users SET role = 'HOSPITAL_OWNER' WHERE role = 'ROLE_HOSPITAL_OWNER';
UPDATE users SET role = 'SHOP_OWNER' WHERE role = 'ROLE_SHOP_OWNER';

-- Ensure all users have valid roles
UPDATE users SET role = 'USER' WHERE role NOT IN ('USER', 'ADMIN', 'OWNER', 'HOTEL_OWNER', 'HOSPITAL_OWNER', 'SHOP_OWNER');

-- Add constraint to ensure only valid roles
ALTER TABLE users ADD CONSTRAINT check_user_role 
CHECK (role IN ('USER', 'ADMIN', 'OWNER', 'HOTEL_OWNER', 'HOSPITAL_OWNER', 'SHOP_OWNER'));