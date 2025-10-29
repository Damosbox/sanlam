-- Add new columns to competitive_analyses table for enhanced analysis
ALTER TABLE competitive_analyses 
ADD COLUMN IF NOT EXISTS source_urls text[],
ADD COLUMN IF NOT EXISTS analysis_timestamp timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS parameters jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS client_context text,
ADD COLUMN IF NOT EXISTS company_strengths text;