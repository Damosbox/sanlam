
-- Create calculation_variables table for shared variable catalogue
CREATE TABLE public.calculation_variables (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  label text NOT NULL,
  type text NOT NULL CHECK (type IN ('text', 'number', 'select', 'date', 'boolean')),
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  category text NOT NULL CHECK (category IN ('vehicule', 'assure', 'contrat', 'bien', 'sante')),
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.calculation_variables ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins can manage all calculation variables"
ON public.calculation_variables
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can view active variables
CREATE POLICY "Authenticated users can view active variables"
ON public.calculation_variables
FOR SELECT
USING (is_active = true);

-- Trigger for updated_at
CREATE TRIGGER update_calculation_variables_updated_at
BEFORE UPDATE ON public.calculation_variables
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
