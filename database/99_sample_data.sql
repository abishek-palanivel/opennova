-- Sample data for OpenNova platform
-- Run this after all migrations to populate the database with test data

-- Note: Password for all users is 'abi@1234'
-- You need to hash it using BCrypt before inserting
-- For now, use the application's registration endpoint or update passwords manually

-- Insert sample regular users
INSERT INTO users (email, password, full_name, phone_number, role, is_active, created_at, updated_at, failed_login_attempts)
VALUES 
    ('john.doe@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'John Doe', '9876543211', 'USER', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0),
    ('jane.smith@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Jane Smith', '9876543212', 'USER', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0),
    ('mike.wilson@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Mike Wilson', '9876543213', 'USER', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0),
    ('sarah.johnson@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sarah Johnson', '9876543214', 'USER', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0),
    ('david.brown@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'David Brown', '9876543215', 'USER', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0),
    ('emily.davis@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Emily Davis', '9876543216', 'USER', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0),
    ('robert.miller@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Robert Miller', '9876543217', 'USER', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0),
    ('lisa.anderson@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Lisa Anderson', '9876543218', 'USER', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0)
ON CONFLICT (email) DO NOTHING;

-- Get owner IDs for establishments
DO $$
DECLARE
    hotel_owner_id BIGINT;
    hospital_owner_id BIGINT;
    shop_owner_id BIGINT;
BEGIN
    -- Get owner IDs (these should already exist from your login credentials)
    SELECT id INTO hotel_owner_id FROM users WHERE email = 'abishekpalanivel212@gmail.com';
    SELECT id INTO hospital_owner_id FROM users WHERE email = 'abishekpopennova@gmail.com';
    SELECT id INTO shop_owner_id FROM users WHERE email = 'mithunpopennova@gmail.com';

    -- Only insert establishments if owners exist
    IF hotel_owner_id IS NOT NULL THEN
        INSERT INTO establishments (name, type, description, address, city, state, pincode, phone_number, email, owner_id, status, rating, total_reviews, opening_time, closing_time, is_open_24_7, latitude, longitude, created_at, updated_at, is_active)
        VALUES 
            ('Grand Hotel Karur', 'HOTEL', 'Luxury hotel with modern amenities and excellent service', '123 Main Street, Karur', 'Karur', 'Tamil Nadu', '639001', '9876543230', 'grandhotel@example.com', hotel_owner_id, 'ACTIVE', 4.5, 25, '09:00:00', '22:00:00', false, 10.9601, 78.0766, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true),
            ('Royal Palace Hotel', 'HOTEL', 'Heritage hotel with traditional architecture', '321 Palace Road, Karur', 'Karur', 'Tamil Nadu', '639002', '9876543233', 'royalpalace@example.com', hotel_owner_id, 'ACTIVE', 4.7, 30, '08:00:00', '23:00:00', false, 10.9577, 78.0732, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true)
        ON CONFLICT DO NOTHING;
    END IF;

    IF hospital_owner_id IS NOT NULL THEN
        INSERT INTO establishments (name, type, description, address, city, state, pincode, phone_number, email, owner_id, status, rating, total_reviews, opening_time, closing_time, is_open_24_7, latitude, longitude, created_at, updated_at, is_active)
        VALUES 
            ('City Hospital Namakkal', 'HOSPITAL', 'Multi-specialty hospital with 24/7 emergency services', '456 Health Avenue, Namakkal', 'Namakkal', 'Tamil Nadu', '637001', '9876543231', 'cityhospital@example.com', hospital_owner_id, 'ACTIVE', 4.8, 50, '00:00:00', '23:59:59', true, 11.2189, 78.1677, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true),
            ('Care Hospital', 'HOSPITAL', 'Specialized in cardiac and orthopedic care', '654 Care Street, Namakkal', 'Namakkal', 'Tamil Nadu', '637002', '9876543234', 'carehospital@example.com', hospital_owner_id, 'ACTIVE', 4.6, 40, '00:00:00', '23:59:59', true, 11.2211, 78.1655, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true)
        ON CONFLICT DO NOTHING;
    END IF;

    IF shop_owner_id IS NOT NULL THEN
        INSERT INTO establishments (name, type, description, address, city, state, pincode, phone_number, email, owner_id, status, rating, total_reviews, opening_time, closing_time, is_open_24_7, latitude, longitude, created_at, updated_at, is_active)
        VALUES 
            ('Modern Shop Salem', 'SHOP', 'Electronics and gadgets store with latest products', '789 Market Road, Salem', 'Salem', 'Tamil Nadu', '636001', '9876543232', 'modernshop@example.com', shop_owner_id, 'ACTIVE', 4.2, 15, '10:00:00', '21:00:00', false, 11.6643, 78.1460, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true),
            ('Fashion Hub', 'SHOP', 'Trendy clothing and accessories', '234 Fashion Street, Salem', 'Salem', 'Tamil Nadu', '636003', '9876543235', 'fashionhub@example.com', shop_owner_id, 'ACTIVE', 4.4, 20, '10:00:00', '20:00:00', false, 11.6688, 78.1422, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Initialize weekly schedules for all establishments
    INSERT INTO weekly_schedules (establishment_id, day_of_week, is_open, opening_time, closing_time, created_at, updated_at)
    SELECT 
        e.id,
        day,
        true,
        e.opening_time,
        e.closing_time,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    FROM establishments e
    CROSS JOIN (
        SELECT unnest(ARRAY['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']) AS day
    ) days
    WHERE NOT EXISTS (
        SELECT 1 FROM weekly_schedules ws 
        WHERE ws.establishment_id = e.id AND ws.day_of_week = day
    );

    -- Insert sample collections for establishments
    INSERT INTO collections (owner_id, total_amount, pending_amount, completed_amount, upi_id, created_at, updated_at, description)
    SELECT 
        e.owner_id,
        0.00,
        0.00,
        0.00,
        'owner' || e.owner_id || '@upi',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        'Payment collection for ' || e.name
    FROM establishments e
    WHERE NOT EXISTS (
        SELECT 1 FROM collections c WHERE c.owner_id = e.owner_id
    );

    -- Update establishments with collection_id
    UPDATE establishments e
    SET collection_id = c.id
    FROM collections c
    WHERE e.owner_id = c.owner_id
    AND e.collection_id IS NULL;

END $$;

-- Display summary
DO $$
DECLARE
    user_count INTEGER;
    establishment_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO establishment_count FROM establishments;
    
    RAISE NOTICE '✅ Sample data inserted successfully!';
    RAISE NOTICE '📊 Total users: %', user_count;
    RAISE NOTICE '🏢 Total establishments: %', establishment_count;
END $$;
