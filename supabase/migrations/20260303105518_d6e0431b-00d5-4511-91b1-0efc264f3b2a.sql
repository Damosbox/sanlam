-- Add draft support to quotations table
ALTER TABLE public.quotations 
ADD COLUMN IF NOT EXISTS draft_state jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_draft boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS current_step integer DEFAULT 0;

-- Add comment for clarity
COMMENT ON COLUMN public.quotations.draft_state IS 'Full GuidedSalesState serialized for draft resumption';
COMMENT ON COLUMN public.quotations.is_draft IS 'True if this is an in-progress draft, false if finalized quotation';
COMMENT ON COLUMN public.quotations.current_step IS 'Last step the user was on when saving the draft';