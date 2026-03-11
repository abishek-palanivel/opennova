-- Chat messaging system for bookings

-- Create chat_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    sender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_booking ON chat_messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(p_booking_id BIGINT, p_user_id BIGINT)
RETURNS void AS $$
BEGIN
    UPDATE chat_messages
    SET is_read = true
    WHERE booking_id = p_booking_id 
    AND sender_id != p_user_id 
    AND is_read = false;
END;
$$ LANGUAGE plpgsql;

-- Function to get unread message count
CREATE OR REPLACE FUNCTION get_unread_count(p_booking_id BIGINT, p_user_id BIGINT)
RETURNS INTEGER AS $$
DECLARE
    unread_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO unread_count
    FROM chat_messages
    WHERE booking_id = p_booking_id 
    AND sender_id != p_user_id 
    AND is_read = false;
    
    RETURN unread_count;
END;
$$ LANGUAGE plpgsql;

SELECT 'Chat system created successfully!' AS status;
