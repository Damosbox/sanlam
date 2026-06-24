
-- 1. Étendre client_scores avec la grille VF_v2
ALTER TABLE public.client_scores
  ADD COLUMN IF NOT EXISTS vf_score_anciennete integer,
  ADD COLUMN IF NOT EXISTS vf_score_prime integer,
  ADD COLUMN IF NOT EXISTS vf_score_multi_equipements integer,
  ADD COLUMN IF NOT EXISTS vf_score_sinistre integer,
  ADD COLUMN IF NOT EXISTS vf_score_action_ponctuelle integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vf_score_global integer,
  ADD COLUMN IF NOT EXISTS vf_niveau text,
  ADD COLUMN IF NOT EXISTS vf_is_partial boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS vf_missing_fields text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS vf_manual_override boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS vf_override_reason text,
  ADD COLUMN IF NOT EXISTS vf_override_approved_by uuid,
  ADD COLUMN IF NOT EXISTS vf_kyc_flag boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS vf_last_recalc_source text;

-- 2. Actions ponctuelles
CREATE TABLE IF NOT EXISTS public.scoring_actions_ponctuelles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  agent_id uuid,
  type text NOT NULL CHECK (type IN ('parrainage','renouvellement','diversification','souscription','enquete')),
  points integer NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_scoring_actions_client ON public.scoring_actions_ponctuelles(client_id, created_at DESC);
GRANT SELECT, INSERT ON public.scoring_actions_ponctuelles TO authenticated;
GRANT ALL ON public.scoring_actions_ponctuelles TO service_role;
ALTER TABLE public.scoring_actions_ponctuelles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Brokers can view actions for their clients" ON public.scoring_actions_ponctuelles
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM broker_clients bc WHERE bc.client_id = scoring_actions_ponctuelles.client_id AND bc.broker_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'backoffice_crc'::app_role)
    OR has_role(auth.uid(), 'backoffice_conformite'::app_role)
  );
CREATE POLICY "Brokers can insert actions for their clients" ON public.scoring_actions_ponctuelles
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM broker_clients bc WHERE bc.client_id = scoring_actions_ponctuelles.client_id AND bc.broker_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'backoffice_crc'::app_role)
  );

-- 3. Historique des recalculs
CREATE TABLE IF NOT EXISTS public.scoring_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  score_before integer,
  score_after integer,
  niveau_before text,
  niveau_after text,
  trigger text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_scoring_history_client ON public.scoring_history(client_id, created_at DESC);
GRANT SELECT, INSERT ON public.scoring_history TO authenticated;
GRANT ALL ON public.scoring_history TO service_role;
ALTER TABLE public.scoring_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Brokers can view history for their clients" ON public.scoring_history
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM broker_clients bc WHERE bc.client_id = scoring_history.client_id AND bc.broker_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'backoffice_crc'::app_role)
    OR has_role(auth.uid(), 'backoffice_conformite'::app_role)
  );
CREATE POLICY "Service can insert history" ON public.scoring_history
  FOR INSERT TO authenticated WITH CHECK (true);

-- 4. Suivi du job mensuel
CREATE TABLE IF NOT EXISTS public.scoring_job_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running','success','error')),
  trigger text NOT NULL DEFAULT 'manual',
  clients_processed integer DEFAULT 0,
  errors_count integer DEFAULT 0,
  error_log jsonb DEFAULT '[]'::jsonb,
  duration_ms integer
);
CREATE INDEX IF NOT EXISTS idx_scoring_job_runs_started ON public.scoring_job_runs(started_at DESC);
GRANT SELECT, INSERT, UPDATE ON public.scoring_job_runs TO authenticated;
GRANT ALL ON public.scoring_job_runs TO service_role;
ALTER TABLE public.scoring_job_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view job runs" ON public.scoring_job_runs
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'backoffice_crc'::app_role)
    OR has_role(auth.uid(), 'backoffice_conformite'::app_role)
  );
CREATE POLICY "Service can manage job runs" ON public.scoring_job_runs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. Demandes de surcharge manuelle (squelette V2)
CREATE TABLE IF NOT EXISTS public.scoring_manual_override_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  requested_by uuid NOT NULL,
  requested_score integer NOT NULL,
  justification text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  approver_id uuid,
  approver_comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz
);
GRANT SELECT, INSERT, UPDATE ON public.scoring_manual_override_requests TO authenticated;
GRANT ALL ON public.scoring_manual_override_requests TO service_role;
ALTER TABLE public.scoring_manual_override_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Backoffice can manage manual overrides" ON public.scoring_manual_override_requests
  FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'backoffice_crc'::app_role)
    OR has_role(auth.uid(), 'backoffice_conformite'::app_role)
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'backoffice_crc'::app_role)
    OR has_role(auth.uid(), 'backoffice_conformite'::app_role)
  );
