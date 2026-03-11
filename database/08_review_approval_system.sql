-- Review approval and moderation system

-- Ensure review status column exists with proper constraints
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reviews' AND column_name = 'status'
    ) THEN
        ALTER TABLE reviews ADD COLUMN status VARCHAR(50) DEFAULT 'PENDING' 
            CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'));
    END IF;
END $$;

-- Add admin review tracking columns
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reviewed_by BIGINT REFERENCES users(id);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;

-- Create index for filtering by status
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);

-- Function to update establishment rating when review is approved
CREATE OR REPLACE FUNCTION update_establishment_rating()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'APPROVED' AND (OLD.status IS NULL OR OLD.status != 'APPROVED') THEN
        UPDATE establishments
        SET 
            rating = (
                SELECT COALESCE(AVG(rating), 0)
                FROM reviews
                WHERE establishment_id = NEW.establishment_id AND status = 'APPROVED'
            ),
            total_reviews = (
                SELECT COUNT(*)
                FROM reviews
                WHERE establishment_id = NEW.establishment_id AND status = 'APPROVED'
            )
        WHERE id = NEW.establishment_id;
    ELSIF OLD.status = 'APPROVED' AND NEW.status != 'APPROVED' THEN
        UPDATE establishments
        SET 
            rating = (
                SELECT COALESCE(AVG(rating), 0)
                FROM reviews
                WHERE establishment_id = NEW.establishment_id AND status = 'APPROVED'
            ),
            total_reviews = (
                SELECT COUNT(*)
                FROM reviews
                WHERE establishment_id = NEW.establishment_id AND status = 'APPROVED'
            )
        WHERE id = NEW.establishment_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic rating updates
DROP TRIGGER IF EXISTS update_rating_on_review_approval ON reviews;
CREATE TRIGGER update_rating_on_review_approval
    AFTER INSERT OR UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_establishment_rating();

SELECT 'Review approval system created successfully!' AS status;
