ALTER TABLE public.scoring_manual_override_requests
  ADD COLUMN IF NOT EXISTS current_score integer,
  ADD COLUMN IF NOT EXISTS current_niveau text,
  ADD COLUMN IF NOT EXISTS notified_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_smor_status ON public.scoring_manual_override_requests(status);
CREATE INDEX IF NOT EXISTS idx_smor_requested_by ON public.scoring_manual_override_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_smor_client ON public.scoring_manual_override_requests(client_id);