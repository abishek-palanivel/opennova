-- Setup predefined users and link establishments to owners
-- Password: Abi@1234 (BCrypt hashed)
-- BCrypt hash for "Abi@1234": $2a$10$N9qo8uLOickgx2ZMRZoMye1J8qQ6Y8rXGKJ9Z8rXGKJ9Z8rXGKJ9e

-- Note: The password hash below is a placeholder. 
-- You need to generate the actual BCrypt hash for "Abi@1234"
-- Run this in your Java application or use an online BCrypt generator

-- Insert Admin User
INSERT INTO users (name, email, password, role, is_active, created_at, updated_at)
VALUES (
    'Admin',
    'abishekopennova@gmail.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMye1J8qQ6Y8rXGKJ9Z8rXGKJ9Z8rXGKJ9e',
    'ADMIN',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO UPDATE SET
    role = 'ADMIN',
    password = '$2a$10$N9qo8uLOickgx2ZMRZoMye1J8qQ6Y8rXGKJ9Z8rXGKJ9Z8rXGKJ9e',
    is_active = true;

-- Insert Hotel Owner
INSERT INTO users (name, email, password, role, establishment_type, is_active, created_at, updated_at)
VALUES (
    'Hotel Owner',
    'abishekpalanivel212@gmail.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMye1J8qQ6Y8rXGKJ9Z8rXGKJ9Z8rXGKJ9e',
    'OWNER',
    'HOTEL',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO UPDATE SET
    role = 'OWNER',
    establishment_type = 'HOTEL',
    password = '$2a$10$N9qo8uLOickgx2ZMRZoMye1J8qQ6Y8rXGKJ9Z8rXGKJ9Z8rXGKJ9e',
    is_active = true;

-- Insert Shop Owner
INSERT INTO users (name, email, password, role, establishment_type, is_active, created_at, updated_at)
VALUES (
    'Shop Owner',
    'mithunpopennova@gmail.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMye1J8qQ6Y8rXGKJ9Z8rXGKJ9Z8rXGKJ9e',
    'OWNER',
    'SHOP',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO UPDATE SET
    role = 'OWNER',
    establishment_type = 'SHOP',
    password = '$2a$10$N9qo8uLOickgx2ZMRZoMye1J8qQ6Y8rXGKJ9Z8rXGKJ9Z8rXGKJ9e',
    is_active = true;

-- Insert Hospital Owner
INSERT INTO users (name, email, password, role, establishment_type, is_active, created_at, updated_at)
VALUES (
    'Hospital Owner',
    'abishekpopennova@gmail.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMye1J8qQ6Y8rXGKJ9Z8rXGKJ9Z8rXGKJ9e',
    'OWNER',
    'HOSPITAL',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO UPDATE SET
    role = 'OWNER',
    establishment_type = 'HOSPITAL',
    password = '$2a$10$N9qo8uLOickgx2ZMRZoMye1J8qQ6Y8rXGKJ9Z8rXGKJ9Z8rXGKJ9e',
    is_active = true;

-- Link Hotel establishments to Hotel Owner
UPDATE establishments 
SET owner_id = (SELECT id FROM users WHERE email = 'abishekpalanivel212@gmail.com' LIMIT 1)
WHERE type = 'HOTEL' AND (owner_id IS NULL OR owner_id NOT IN (SELECT id FROM users));

-- Link Shop establishments to Shop Owner
UPDATE establishments 
SET owner_id = (SELECT id FROM users WHERE email = 'mithunpopennova@gmail.com' LIMIT 1)
WHERE type = 'SHOP' AND (owner_id IS NULL OR owner_id NOT IN (SELECT id FROM users));

-- Link Hospital establishments to Hospital Owner
UPDATE establishments 
SET owner_id = (SELECT id FROM users WHERE email = 'abishekpopennova@gmail.com' LIMIT 1)
WHERE type = 'HOSPITAL' AND (owner_id IS NULL OR owner_id NOT IN (SELECT id FROM users));

-- Verify the setup
SELECT 
    u.id,
    u.name,
    u.email,
    u.role,
    u.establishment_type,
    COUNT(e.id) as establishment_count
FROM users u
LEFT JOIN establishments e ON e.owner_id = u.id
WHERE u.email IN (
    'abishekpalanivel212@gmail.com',
    'mithunpopennova@gmail.com',
    'abishekpopennova@gmail.com',
    'abishekopennova@gmail.com'
)
GROUP BY u.id, u.name, u.email, u.role, u.establishment_type
ORDER BY u.role, u.email;
