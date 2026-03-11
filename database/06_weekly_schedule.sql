-- Weekly schedule management system

-- Create weekly_schedules table if it doesn't exist
CREATE TABLE IF NOT EXISTS weekly_schedules (
    id BIGSERIAL PRIMARY KEY,
    establishment_id BIGINT NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
    day_of_week VARCHAR(10) NOT NULL CHECK (day_of_week IN ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY')),
    is_open BOOLEAN DEFAULT true,
    opening_time TIME,
    closing_time TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(establishment_id, day_of_week)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_weekly_schedules_establishment ON weekly_schedules(establishment_id);

-- Create trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS update_weekly_schedules_updated_at ON weekly_schedules;
CREATE TRIGGER update_weekly_schedules_updated_at BEFORE UPDATE ON weekly_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to initialize weekly schedule for an establishment
CREATE OR REPLACE FUNCTION initialize_weekly_schedule(est_id BIGINT, open_time TIME, close_time TIME)
RETURNS void AS $$
DECLARE
    day_name VARCHAR(10);
BEGIN
    FOREACH day_name IN ARRAY ARRAY['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
    LOOP
        INSERT INTO weekly_schedules (establishment_id, day_of_week, is_open, opening_time, closing_time)
        VALUES (est_id, day_name, true, open_time, close_time)
        ON CONFLICT (establishment_id, day_of_week) DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

SELECT 'Weekly schedule system created successfully!' AS status;
