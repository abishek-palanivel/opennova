-- ============================================
-- OpenNova Complete Database Initialization
-- Run this ONCE to set up all users and establishments
-- ============================================

-- Clear existing data if needed (CAUTION: Uncomment only if you want to start fresh)
-- DELETE FROM bookings;
-- DELETE FROM reviews;
-- DELETE FROM saved_establishments;
-- DELETE FROM menus;
-- DELETE FROM doctors;
-- DELETE FROM collections;
-- DELETE FROM establishments;
-- DELETE FROM users;

-- ============================================
-- INSERT PREDEFINED USERS
-- Password for all: Abi@1234
-- BCrypt hash generated for "Abi@1234"
-- ============================================

-- 1. Admin User
INSERT INTO users (name, email, password, role, is_active, created_at, updated_at)
VALUES (
    'Admin',
    'abishekopennova@gmail.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'ADMIN',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO UPDATE SET
    role = 'ADMIN',
    password = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    is_active = true;

-- 2. Hotel Owner
INSERT INTO users (name, email, password, role, establishment_type, is_active, created_at, updated_at)
VALUES (
    'Hotel Owner',
    'abishekpalanivel212@gmail.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'OWNER',
    'HOTEL',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO UPDATE SET
    role = 'OWNER',
    establishment_type = 'HOTEL',
    password = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    is_active = true;

-- 3. Shop Owner  
INSERT INTO users (name, email, password, role, establishment_type, is_active, created_at, updated_at)
VALUES (
    'Shop Owner',
    'mithunpopennova@gmail.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'OWNER',
    'SHOP',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO UPDATE SET
    role = 'OWNER',
    establishment_type = 'SHOP',
    password = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    is_active = true;

-- 4. Hospital Owner
INSERT INTO users (name, email, password, role, establishment_type, is_active, created_at, updated_at)
VALUES (
    'Hospital Owner',
    'abishekpopennova@gmail.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'OWNER',
    'HOSPITAL',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO UPDATE SET
    role = 'OWNER',
    establishment_type = 'HOSPITAL',
    password = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    is_active = true;

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
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    '8012975411',
    'OPEN',
    (SELECT id FROM users WHERE email = 'abishekpalanivel212@gmail.com' LIMIT 1),
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO UPDATE SET
    owner_id = (SELECT id FROM users WHERE email = 'abishekpalanivel212@gmail.com' LIMIT 1);

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
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    '8012975411',
    'OPEN',
    (SELECT id FROM users WHERE email = 'abishekpopennova@gmail.com' AND role = 'OWNER' LIMIT 1),
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO UPDATE SET
    owner_id = (SELECT id FROM users WHERE email = 'abishekpopennova@gmail.com' AND role = 'OWNER' LIMIT 1);

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
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    '8012975411',
    'OPEN',
    (SELECT id FROM users WHERE email = 'mithunpopennova@gmail.com' LIMIT 1),
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO UPDATE SET
    owner_id = (SELECT id FROM users WHERE email = 'mithunpopennova@gmail.com' LIMIT 1);

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
