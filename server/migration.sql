-- Migration script to update events and availability tables
-- Run this after updating the schema.sql

-- Add team columns to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS team_a_id UUID REFERENCES teams(id);
ALTER TABLE events ADD COLUMN IF NOT EXISTS team_b_id UUID REFERENCES teams(id);

-- Add team_id column to availability table
ALTER TABLE availability ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id);

-- Update existing events to have default teams (USC vs UCLA)
UPDATE events 
SET 
  team_a_id = (SELECT id FROM teams WHERE name = 'USC Trojans' LIMIT 1),
  team_b_id = (SELECT id FROM teams WHERE name = 'UCLA Bruins' LIMIT 1)
WHERE team_a_id IS NULL OR team_b_id IS NULL;

-- Update existing availability records to have team_id BEFORE making it NOT NULL
UPDATE availability 
SET team_id = (SELECT id FROM teams WHERE name = 'USC Trojans' LIMIT 1)
WHERE team_id IS NULL;

-- Now make team columns NOT NULL after setting defaults
ALTER TABLE events ALTER COLUMN team_a_id SET NOT NULL;
ALTER TABLE events ALTER COLUMN team_b_id SET NOT NULL;
ALTER TABLE availability ALTER COLUMN team_id SET NOT NULL;

-- Add constraint to ensure different teams (handle if it already exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'different_teams'
    ) THEN
        ALTER TABLE events ADD CONSTRAINT different_teams CHECK (team_a_id != team_b_id);
    END IF;
END $$;
