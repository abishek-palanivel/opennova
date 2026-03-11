-- Create sample establishments for testing
-- These will be linked to the appropriate owners

-- Insert Hotel (Grand Hotel Karur)
INSERT INTO establishments (name, type, address, email, password, contact_number, status, owner_id, is_active, created_at, updated_at)
VALUES (
    'Grand Hotel Karur',
    'HOTEL',
    'Thangam Nagar, 4/127, Covai Road, PO, Reddipalayam, Karur, Tamil Nadu 639008',
    'grandhotel@karur.com',
    '$2a$10$dummyPasswordHashForEstablishment123456789012345678901234',
    '8012975411',
    'OPEN',
    (SELECT id FROM users WHERE email = 'abishekpalanivel212@gmail.com' LIMIT 1),
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

-- Insert Hospital (City Hospital Namakkal)
INSERT INTO establishments (name, type, address, email, password, contact_number, status, owner_id, is_active, created_at, updated_at)
VALUES (
    'City Hospital Namakkal',
    'HOSPITAL',
    '6/58B, Trichy Rd, Andavar Nagar, Namakkal, Tamil Nadu 637001',
    'cityhospital@namakkal.com',
    '$2a$10$dummyPasswordHashForEstablishment123456789012345678901234',
    '8012975411',
    'OPEN',
    (SELECT id FROM users WHERE email = 'abishekpopennova@gmail.com' AND role = 'OWNER' LIMIT 1),
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

-- Insert Shop (Fashion Plaza)
INSERT INTO establishments (name, type, address, email, password, contact_number, status, owner_id, is_active, created_at, updated_at)
VALUES (
    'Fashion Plaza',
    'SHOP',
    'CP City center B/98A-14F Salem, Road, R.P.Pudur, Namakkal, Tamil Nadu 637001',
    'fashionplaza@namakkal.com',
    '$2a$10$dummyPasswordHashForEstablishment123456789012345678901234',
    '8012975411',
    'OPEN',
    NULL,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

-- Update user establishment types
UPDATE users SET establishment_type = 'HOTEL' WHERE email = 'abishekpalanivel212@gmail.com';
UPDATE users SET establishment_type = 'HOSPITAL' WHERE email = 'abishekpopennova@gmail.com' AND role = 'OWNER';

-- Verify the setup
SELECT 
    e.id,
    e.name,
    e.type,
    e.owner_id,
    u.name as owner_name,
    u.email as owner_email
FROM establishments e
LEFT JOIN users u ON e.owner_id = u.id
ORDER BY e.type;
