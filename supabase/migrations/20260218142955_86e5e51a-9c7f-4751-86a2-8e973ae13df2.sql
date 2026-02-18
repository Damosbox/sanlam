
-- =============================================
-- Table: calculation_rules (entité autonome actuariat)
-- =============================================
CREATE TABLE public.calculation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('vie', 'non-vie')),
  usage_category text NOT NULL,
  usage_category_label text,
  parameters jsonb NOT NULL DEFAULT '[]'::jsonb,
  formulas jsonb NOT NULL DEFAULT '[]'::jsonb,
  rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  taxes jsonb NOT NULL DEFAULT '[]'::jsonb,
  fees jsonb NOT NULL DEFAULT '[]'::jsonb,
  tables_ref jsonb NOT NULL DEFAULT '[]'::jsonb,
  base_formula text DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger updated_at
CREATE TRIGGER update_calculation_rules_updated_at
  BEFORE UPDATE ON public.calculation_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.calculation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all calculation rules"
  ON public.calculation_rules FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Brokers can view active calculation rules"
  ON public.calculation_rules FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'broker'::app_role) AND is_active = true);

-- =============================================
-- Table: product_calc_rules (liaison N:N)
-- =============================================
CREATE TABLE public.product_calc_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  calc_rule_id uuid NOT NULL REFERENCES public.calculation_rules(id) ON DELETE CASCADE,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, calc_rule_id)
);

ALTER TABLE public.product_calc_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all product calc rules"
  ON public.product_calc_rules FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Brokers can view product calc rules"
  ON public.product_calc_rules FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'broker'::app_role));

-- =============================================
-- Nouvelles colonnes sur products
-- =============================================
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS channels jsonb DEFAULT '{"b2b": true, "b2c": false}'::jsonb,
  ADD COLUMN IF NOT EXISTS periodicity text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS discounts_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS medical_questionnaire_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS beneficiaries_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS claims_config jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS discounts jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS questionnaires jsonb DEFAULT '[]'::jsonb;
