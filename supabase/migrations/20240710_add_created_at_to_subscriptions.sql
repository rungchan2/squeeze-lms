-- Add created_at column to subscriptions table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'subscriptions'
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE subscriptions
        ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END
$$; 