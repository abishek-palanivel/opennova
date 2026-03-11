-- ============================================
-- OpenNova Complete Database Initialization
-- Run this ONCE to set up all users and establishments
-- ============================================

-- Clear existing data (CAUTION: This deletes all data!)
-- DELETE FROM establishments;
-- DELETE FROM users;

-- ============================================
-- INSERT PREDEFINED USERS
-- Password for all: Abi@1234
-- BCrypt hash: Use online generator at https://bcrypt-generator.com/
-- ============================================

-- Note: You must generate the actual BCrypt hash for "Abi@1234" and replace the placeholder below
-- For now, register these users through the website, then run the UPDATE statements

-- After registering through website, run these updates:

-- 1. Admin User
UPDATE users SET role = 'ADMIN' 
WHERE email = 'abishekopennova@gmail.com';

-- 2. Hotel Owner
UPDATE users SET role = 'OWNER', establishment_type = 'HOTEL' 
WHERE email = 'abishekpalanivel212@gmail.com';

-- 3. Shop Owner  
UPDATE users SET role = 'OWNER', establishment_type = 'SHOP'
WHERE email = 'mithunpopennova@gmail.com';

-- 4. Hospital Owner
UPDATE users SET role = 'OWNER', establishment_type = 'HOSPITAL'
WHERE email = 'abishekpopennova@gmail.com';

-- ============================================
-- INSERT ESTABLISHMENTS
-- ============================================

-- Hotel Establishment
INSERT INTO establishments (
    name, type, address, email, password, contact_number, 
    status, owner_id, is_active, created_at, updated_at
)
VALUES (
    'Grand Hotel Karur',
    'HOTEL',
    'Thangam Nagar, 4/127, Covai Road, PO, Reddipalayam, Karur, Tamil Nadu 639008',
    'grandhotel@karur.com',
    '$2a$10$dummyPasswordHash',
    '8012975411',
    'OPEN',
    (SELECT id FROM users WHERE email = 'abishekpalanivel212@gmail.com' LIMIT 1),
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

-- Hospital Establishment
INSERT INTO establishments (
    name, type, address, email, password, contact_number,
    status, owner_id, is_active, created_at, updated_at
)
VALUES (
    'City Hospital Namakkal',
    'HOSPITAL',
    '6/58B, Trichy Rd, Andavar Nagar, Namakkal, Tamil Nadu 637001',
    'cityhospital@namakkal.com',
    '$2a$10$dummyPasswordHash',
    '8012975411',
    'OPEN',
    (SELECT id FROM users WHERE email = 'abishekpopennova@gmail.com' AND role = 'OWNER' LIMIT 1),
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

-- Shop Establishment
INSERT INTO establishments (
    name, type, address, email, password, contact_number,
    status, owner_id, is_active, created_at, updated_at
)
VALUES (
    'Fashion Plaza',
    'SHOP',
    'CP City center B/98A-14F Salem, Road, R.P.Pudur, Namakkal, Tamil Nadu 637001',
    'fashionplaza@namakkal.com',
    '$2a$10$dummyPasswordHash',
    '8012975411',
    'OPEN',
    (SELECT id FROM users WHERE email = 'mithunpopennova@gmail.com' LIMIT 1),
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

-- ============================================
-- VERIFY SETUP
-- ============================================

-- Check users
SELECT id, name, email, role, establishment_type, is_active 
FROM users 
ORDER BY role, email;

-- Check establishments with owners
SELECT 
    e.id,
    e.name,
    e.type,
    e.status,
    u.name as owner_name,
    u.email as owner_email
FROM establishments e
LEFT JOIN users u ON e.owner_id = u.id
ORDER BY e.type;

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- 
-- CREDENTIALS:
-- Admin: abishekopennova@gmail.com / Abi@1234
-- Hotel Owner: abishekpalanivel212@gmail.com / Abi@1234
-- Shop Owner: mithunpopennova@gmail.com / Abi@1234
-- Hospital Owner: abishekpopennova@gmail.com / Abi@1234
-- ============================================
