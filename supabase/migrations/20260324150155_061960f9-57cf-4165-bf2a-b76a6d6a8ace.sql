
CREATE TABLE public.agent_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  target_premium numeric NOT NULL DEFAULT 0,
  target_conversions integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage agent targets"
  ON public.agent_targets FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Agents can view their own targets"
  ON public.agent_targets FOR SELECT
  TO authenticated
  USING (agent_id = auth.uid());
