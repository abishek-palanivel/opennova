-- Seed users and establishments with correct data
-- This creates the main user accounts and their establishments

-- Clear existing data first
DELETE FROM establishments;
DELETE FROM users;

-- Insert User Portal Account
INSERT INTO users (email, password, full_name, role, is_active, created_at, updated_at, failed_login_attempts) 
VALUES ('abishekjothi26@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye7I6ZdOZky0Dq2lxjYkD9p92FhcYvvTK', 'Abishek Jothi', 'USER', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0);

-- Insert Admin Account  
INSERT INTO users (email, password, full_name, role, is_active, created_at, updated_at, failed_login_attempts)
VALUES ('abishekopennova@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye7I6ZdOZky0Dq2lxjYkD9p92FhcYvvTK', 'Abishek Admin', 'ADMIN', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0);

-- Insert Hotel Owner Account
INSERT INTO users (email, password, full_name, role, is_active, created_at, updated_at, failed_login_attempts)
VALUES ('abishekpalanivel212@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye7I6ZdOZky0Dq2lxjYkD9p92FhcYvvTK', 'Abishek Hotel Owner', 'HOTEL_OWNER', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0);

-- Insert Shop Owner Account
INSERT INTO users (email, password, full_name, role, is_active, created_at, updated_at, failed_login_attempts)
VALUES ('mithunpopennova@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye7I6ZdOZky0Dq2lxjYkD9p92FhcYvvTK', 'Mithun Shop Owner', 'SHOP_OWNER', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0);

-- Insert Hospital Owner Account
INSERT INTO users (email, password, full_name, role, is_active, created_at, updated_at, failed_login_attempts)
VALUES ('abishekpopennova@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye7I6ZdOZky0Dq2lxjYkD9p92FhcYvvTK', 'Abishek Hospital Owner', 'HOSPITAL_OWNER', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0);

-- Create Hotel Establishment for Hotel Owner
INSERT INTO establishments (name, type, address, city, state, pincode, phone_number, email, owner_id, status, is_active, password, created_at, updated_at)
SELECT 'Abishek Grand Hotel', 'HOTEL', '123 Hotel Street, Business District', 'Chennai', 'Tamil Nadu', '600001', '9876543210', 'abishekpalanivel212@gmail.com', u.id, 'OPEN', true, '$2a$10$N9qo8uLOickgx2ZMRZoMye7I6ZdOZky0Dq2lxjYkD9p92FhcYvvTK', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'abishekpalanivel212@gmail.com';

-- Create Shop Establishment for Shop Owner
INSERT INTO establishments (name, type, address, city, state, pincode, phone_number, email, owner_id, status, is_active, password, created_at, updated_at)
SELECT 'Mithun Electronics Shop', 'SHOP', '456 Shop Avenue, Market Area', 'Coimbatore', 'Tamil Nadu', '641001', '9876543211', 'mithunpopennova@gmail.com', u.id, 'OPEN', true, '$2a$10$N9qo8uLOickgx2ZMRZoMye7I6ZdOZky0Dq2lxjYkD9p92FhcYvvTK', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'mithunpopennova@gmail.com';

-- Create Hospital Establishment for Hospital Owner
INSERT INTO establishments (name, type, address, city, state, pincode, phone_number, email, owner_id, status, is_active, password, created_at, updated_at)
SELECT 'Abishek Care Hospital', 'HOSPITAL', '789 Medical Street, Health District', 'Madurai', 'Tamil Nadu', '625001', '9876543212', 'abishekpopennova@gmail.com', u.id, 'OPEN', true, '$2a$10$N9qo8uLOickgx2ZMRZoMye7I6ZdOZky0Dq2lxjYkD9p92FhcYvvTK', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'abishekpopennova@gmail.com';

-- Verify the data
SELECT 'Users and establishments seeded successfully!' AS status;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_establishments FROM establishments;