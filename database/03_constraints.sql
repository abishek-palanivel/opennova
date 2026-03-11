-- Add constraints and validations

-- Ensure email format validation (basic check)
ALTER TABLE users ADD CONSTRAINT users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Ensure phone number format (basic check)
ALTER TABLE users ADD CONSTRAINT users_phone_format CHECK (phone_number ~* '^\+?[0-9]{10,15}$' OR phone_number IS NULL);
ALTER TABLE establishments ADD CONSTRAINT establishments_phone_format CHECK (phone_number ~* '^\+?[0-9]{10,15}$');

-- Ensure rating is between 0 and 5
ALTER TABLE establishments ADD CONSTRAINT establishments_rating_range CHECK (rating >= 0 AND rating <= 5);

-- Ensure total_reviews is non-negative
ALTER TABLE establishments ADD CONSTRAINT establishments_reviews_positive CHECK (total_reviews >= 0);

-- Ensure booking amounts are non-negative
ALTER TABLE bookings ADD CONSTRAINT bookings_amount_positive CHECK (total_amount >= 0 OR total_amount IS NULL);
ALTER TABLE bookings ADD CONSTRAINT bookings_refund_positive CHECK (refund_amount >= 0 OR refund_amount IS NULL);

-- Ensure collection amounts are non-negative
ALTER TABLE collections ADD CONSTRAINT collections_total_positive CHECK (total_amount >= 0);
ALTER TABLE collections ADD CONSTRAINT collections_pending_positive CHECK (pending_amount >= 0);
ALTER TABLE collections ADD CONSTRAINT collections_completed_positive CHECK (completed_amount >= 0);

-- Ensure menu prices are positive
ALTER TABLE menus ADD CONSTRAINT menus_price_positive CHECK (price > 0);

-- Ensure doctor consultation fees are non-negative
ALTER TABLE doctors ADD CONSTRAINT doctors_fee_positive CHECK (consultation_fee >= 0 OR consultation_fee IS NULL);
ALTER TABLE doctors ADD CONSTRAINT doctors_experience_positive CHECK (experience_years >= 0 OR experience_years IS NULL);

SELECT 'Constraints applied successfully!' AS status;
