-- Add tracking columns to policy_documents for document sending history
ALTER TABLE public.policy_documents
ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sent_via TEXT[],
ADD COLUMN IF NOT EXISTS sent_to_email TEXT,
ADD COLUMN IF NOT EXISTS sent_to_phone TEXT;