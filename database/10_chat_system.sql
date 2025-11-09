-- Chat system tables
-- Run this after all previous migrations

-- Create message_type enum
DO $$ BEGIN
    CREATE TYPE message_type AS ENUM ('TEXT', 'IMAGE', 'FILE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGSERIAL PRIMARY KEY,
    sender_id BIGINT NOT NULL,
    recipient_id BIGINT,
    message TEXT NOT NULL,
    chat_room_id VARCHAR(255) NOT NULL,
    message_type message_type DEFAULT 'TEXT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_room_id ON chat_messages(chat_room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_recipient_id ON chat_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_is_read ON chat_messages(is_read);

-- Add some sample data for testing
-- This will be populated when users start chatting

COMMENT ON TABLE chat_messages IS 'Stores chat messages between users and support staff';
COMMENT ON COLUMN chat_messages.chat_room_id IS 'Unique identifier for chat room (usually email1_email2)';
COMMENT ON COLUMN chat_messages.message_type IS 'Type of message: TEXT, IMAGE, or FILE';
COMMENT ON COLUMN chat_messages.is_read IS 'Whether the message has been read by the recipient';