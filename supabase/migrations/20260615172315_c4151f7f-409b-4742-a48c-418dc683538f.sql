
-- 1) Colonne de configuration sur products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS pricing_adjustments JSONB NOT NULL DEFAULT jsonb_build_object(
  'reduction_souscription', jsonb_build_object(
    'enabled', false,
    'roles', '[]'::jsonb,
    'max_percentage', 0,
    'type', 'percentage'
  ),
  'bonus_malus_renouvellement', jsonb_build_object(
    'enabled', false,
    'roles', '[]'::jsonb,
    'max_bonus', 0,
    'max_malus', 0,
    'cumul_with_commercial', false
  ),
  'approval', jsonb_build_object(
    'required', false,
    'threshold_fcfa', 75000000,
    'validator_roles', '["admin"]'::jsonb
  )
);

-- 2) Table des demandes d'approbation
CREATE TABLE IF NOT EXISTS public.pricing_adjustment_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL CHECK (source IN ('subscription','renewal')),
  subscription_id UUID NULL,
  product_id UUID NULL REFERENCES public.products(id) ON DELETE SET NULL,
  requested_by UUID NOT NULL,
  client_name TEXT NOT NULL,
  product_name TEXT NOT NULL,
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('reduction','bonus','malus')),
  adjustment_value NUMERIC NOT NULL,
  adjustment_unit TEXT NOT NULL DEFAULT 'percentage' CHECK (adjustment_unit IN ('percentage','fixed')),
  impact_fcfa NUMERIC NOT NULL DEFAULT 0,
  vehicle_value_fcfa NUMERIC NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  approver_id UUID NULL,
  decision_reason TEXT NULL,
  decided_at TIMESTAMPTZ NULL,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pricing_adjustment_approvals TO authenticated;
GRANT ALL ON public.pricing_adjustment_approvals TO service_role;

ALTER TABLE public.pricing_adjustment_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/back-office can view all approvals"
ON public.pricing_adjustment_approvals
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'backoffice_conformite')
  OR public.has_role(auth.uid(), 'backoffice_crc')
);

CREATE POLICY "Requesters can view their own approvals"
ON public.pricing_adjustment_approvals
FOR SELECT TO authenticated
USING (requested_by = auth.uid());

CREATE POLICY "Users can create approval requests for themselves"
ON public.pricing_adjustment_approvals
FOR INSERT TO authenticated
WITH CHECK (requested_by = auth.uid());

CREATE POLICY "Admin/back-office can decide on approvals"
ON public.pricing_adjustment_approvals
FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'backoffice_conformite')
);

CREATE TRIGGER trg_pricing_adjustment_approvals_updated_at
BEFORE UPDATE ON public.pricing_adjustment_approvals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_paa_status ON public.pricing_adjustment_approvals (status);
CREATE INDEX IF NOT EXISTS idx_paa_source ON public.pricing_adjustment_approvals (source);
CREATE INDEX IF NOT EXISTS idx_paa_requested_by ON public.pricing_adjustment_approvals (requested_by);

-- 3) Historique des ajustements appliqués
CREATE TABLE IF NOT EXISTS public.pricing_adjustments_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL CHECK (source IN ('subscription','renewal')),
  subscription_id UUID NULL,
  product_id UUID NULL REFERENCES public.products(id) ON DELETE SET NULL,
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('reduction','bonus','malus')),
  adjustment_value NUMERIC NOT NULL,
  adjustment_unit TEXT NOT NULL DEFAULT 'percentage' CHECK (adjustment_unit IN ('percentage','fixed')),
  impact_fcfa NUMERIC NOT NULL DEFAULT 0,
  applied_by UUID NOT NULL,
  approval_id UUID NULL REFERENCES public.pricing_adjustment_approvals(id) ON DELETE SET NULL,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.pricing_adjustments_history TO authenticated;
GRANT ALL ON public.pricing_adjustments_history TO service_role;

ALTER TABLE public.pricing_adjustments_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/back-office can view all history"
ON public.pricing_adjustments_history
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'backoffice_conformite')
  OR public.has_role(auth.uid(), 'backoffice_crc')
);

CREATE POLICY "Users can view their own applied adjustments"
ON public.pricing_adjustments_history
FOR SELECT TO authenticated
USING (applied_by = auth.uid());

CREATE POLICY "Users can record their own applied adjustments"
ON public.pricing_adjustments_history
FOR INSERT TO authenticated
WITH CHECK (applied_by = auth.uid());

CREATE INDEX IF NOT EXISTS idx_pah_subscription ON public.pricing_adjustments_history (subscription_id);
CREATE INDEX IF NOT EXISTS idx_pah_applied_by ON public.pricing_adjustments_history (applied_by);
