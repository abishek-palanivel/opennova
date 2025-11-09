-- OpenNova Database Setup for Neon
-- Run this in Neon SQL Editor: https://console.neon.tech

-- Create all tables
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS establishments (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    owner_id BIGINT REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    establishment_id BIGINT REFERENCES establishments(id),
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    notes TEXT,
    qr_code VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reviews (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    establishment_id BIGINT REFERENCES establishments(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    status VARCHAR(50) DEFAULT 'APPROVED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS menus (
    id BIGSERIAL PRIMARY KEY,
    establishment_id BIGINT REFERENCES establishments(id),
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2),
    category VARCHAR(100),
    image_url VARCHAR(500),
    available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert admin user
INSERT INTO users (email, password, name, role) VALUES 
('abishekopennova@gmail.com', '$2a$10$example.hash.here', 'Admin User', 'ADMIN')
ON CONFLICT (email) DO NOTHING;

-- Insert sample establishments
INSERT INTO establishments (name, type, description, address, phone, email, owner_id, status) VALUES 
('Grand Hotel', 'HOTEL', 'Luxury hotel in city center', '123 Main St, City', '+1234567890', 'hotel@example.com', 1, 'APPROVED'),
('City Hospital', 'HOSPITAL', 'Multi-specialty hospital', '456 Health Ave, City', '+1234567891', 'hospital@example.com', 1, 'APPROVED'),
('Tech Shop', 'SHOP', 'Electronics and gadgets', '789 Tech Blvd, City', '+1234567892', 'shop@example.com', 1, 'APPROVED')
ON CONFLICT DO NOTHING;