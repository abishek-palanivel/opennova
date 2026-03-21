-- Payment Screenshot Verification System
-- This table stores payment verification requests with screenshots

CREATE TABLE IF NOT EXISTS payment_verifications (
    id BIGSERIAL PRIMARY KEY,
    transaction_ref VARCHAR(255) NOT NULL,
    transaction_id VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    establishment_id BIGINT NOT NULL,
    expected_amount DECIMAL(10,2) NOT NULL,
    screenshot_path VARCHAR(500),
    status VARCHAR(50) DEFAULT 'PENDING_VERIFICATION',
    owner_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP,
    verified_by BIGINT,
    
    CONSTRAINT fk_payment_verification_establishment 
        FOREIGN KEY (establishment_id) REFERENCES establishments(id),
    CONSTRAINT fk_payment_verification_verifier 
        FOREIGN KEY (verified_by) REFERENCES users(id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_verifications_status 
    ON payment_verifications(status);
CREATE INDEX IF NOT EXISTS idx_payment_verifications_establishment 
    ON payment_verifications(establishment_id);
CREATE INDEX IF NOT EXISTS idx_payment_verifications_transaction_ref 
    ON payment_verifications(transaction_ref);

-- Add status constraint
ALTER TABLE payment_verifications 
ADD CONSTRAINT chk_payment_verification_status 
CHECK (status IN ('PENDING_VERIFICATION', 'APPROVED', 'REJECTED', 'EXPIRED'));

-- Show table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'payment_verifications' 
ORDER BY ordinal_position;