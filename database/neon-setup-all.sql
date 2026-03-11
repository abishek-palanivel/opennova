-- OpenNova Complete Database Setup for Neon
-- Run this single file instead of individual files

-- ============================================
-- 02: Column Fixes
-- ============================================
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10, 2);
UPDATE bookings SET paid_amount = 0.0 WHERE paid_amount IS NULL;
UPDATE bookings SET paid_amount = total_amount * 0.7 WHERE paid_amount = 0.0 AND total_amount > 0;

-- ============================================
-- 03: Constraints
-- ============================================
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_payment_status_check;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_refund_status_check;

ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
    CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'));
ALTER TABLE bookings ADD CONSTRAINT bookings_payment_status_check 
    CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED'));
ALTER TABLE bookings ADD CONSTRAINT bookings_refund_status_check 
    CHECK (refund_status IN ('NOT_APPLICABLE', 'PENDING', 'APPROVED', 'REJECTED', 'NOT_ELIGIBLE'));

-- ============================================
-- 04: User Columns
-- ============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS establishment_type VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP;

-- ============================================
-- 05: Menu Columns
-- ============================================
ALTER TABLE menus ADD COLUMN IF NOT EXISTS category VARCHAR(255);
ALTER TABLE menus ADD COLUMN IF NOT EXISTS preparation_time INTEGER DEFAULT 15;
ALTER TABLE menus ADD COLUMN IF NOT EXISTS is_vegetarian BOOLEAN DEFAULT false;
ALTER TABLE menus ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;

-- ============================================
-- 06: Weekly Schedule
-- ============================================
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS monday_hours VARCHAR(255);
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS tuesday_hours VARCHAR(255);
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS wednesday_hours VARCHAR(255);
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS thursday_hours VARCHAR(255);
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS friday_hours VARCHAR(255);
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS saturday_hours VARCHAR(255);
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS sunday_hours VARCHAR(255);
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS monday_status VARCHAR(50) DEFAULT 'OPEN';
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS tuesday_status VARCHAR(50) DEFAULT 'OPEN';
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS wednesday_status VARCHAR(50) DEFAULT 'OPEN';
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS thursday_status VARCHAR(50) DEFAULT 'OPEN';
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS friday_status VARCHAR(50) DEFAULT 'OPEN';
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS saturday_status VARCHAR(50) DEFAULT 'OPEN';
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS sunday_status VARCHAR(50) DEFAULT 'OPEN';

-- ============================================
-- 07: File Uploads
-- ============================================
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS image_path VARCHAR(500);
ALTER TABLE menus ADD COLUMN IF NOT EXISTS image_path VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_path VARCHAR(500);

-- ============================================
-- 08: Review Approval System
-- ============================================
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'PENDING';
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reviewed_by BIGINT REFERENCES users(id);

ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_status_check;
ALTER TABLE reviews ADD CONSTRAINT reviews_status_check 
    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'));

-- ============================================
-- 10: Chat System
-- ============================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGSERIAL PRIMARY KEY,
    chat_room_id VARCHAR(255) NOT NULL,
    sender_id BIGINT NOT NULL REFERENCES users(id),
    recipient_id BIGINT NOT NULL REFERENCES users(id),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_room_id ON chat_messages(chat_room_id);
CREATE INDEX IF NOT EXISTS idx_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_recipient_id ON chat_messages(recipient_id);

-- ============================================
-- 11: Collection Description
-- ============================================
ALTER TABLE collections ADD COLUMN IF NOT EXISTS description TEXT;

-- ============================================
-- 12: UPI QR Code
-- ============================================
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS upi_qr_code TEXT;

-- ============================================
-- 13: UPI QR Code Path
-- ============================================
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS upi_qr_code_path VARCHAR(500);

-- ============================================
-- 14: Fix User Roles
-- ============================================
UPDATE users SET role = 'ADMIN' WHERE role = 'admin';
UPDATE users SET role = 'OWNER' WHERE role = 'owner';
UPDATE users SET role = 'USER' WHERE role = 'user';

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('USER', 'OWNER', 'ADMIN'));

-- ============================================
-- 15: Login Attempt Tracking
-- ============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_attempt TIMESTAMP;

-- ============================================
-- Create Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_establishments_type ON establishments(type);
CREATE INDEX IF NOT EXISTS idx_establishments_status ON establishments(status);
CREATE INDEX IF NOT EXISTS idx_establishments_owner_id ON establishments(owner_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_establishment_id ON bookings(establishment_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_reviews_establishment_id ON reviews(establishment_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);

-- ============================================
-- Setup Complete!
-- ============================================
