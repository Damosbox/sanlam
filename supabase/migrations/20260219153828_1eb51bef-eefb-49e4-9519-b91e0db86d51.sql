
-- Create product_forms linking table
CREATE TABLE public.product_forms (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  form_template_id uuid NOT NULL REFERENCES public.form_templates(id) ON DELETE CASCADE,
  calc_rule_id uuid REFERENCES public.calculation_rules(id) ON DELETE SET NULL,
  channel text NOT NULL DEFAULT 'b2b',
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, form_template_id)
);

-- Enable RLS
ALTER TABLE public.product_forms ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admins can manage all product_forms"
  ON public.product_forms
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Brokers can view active ones
CREATE POLICY "Brokers can view active product_forms"
  ON public.product_forms
  FOR SELECT
  USING (has_role(auth.uid(), 'broker'::app_role) AND is_active = true);
