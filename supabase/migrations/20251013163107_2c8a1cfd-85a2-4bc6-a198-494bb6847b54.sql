-- Create enum for form categories
CREATE TYPE form_category AS ENUM ('vie', 'non-vie');

-- Create enum for deployment channels
CREATE TYPE deployment_channel AS ENUM ('B2C', 'B2B');

-- Create form_templates table
CREATE TABLE public.form_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category form_category NOT NULL,
  product_type TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  target_channels JSONB NOT NULL DEFAULT '["B2C"]'::jsonb,
  steps JSONB NOT NULL DEFAULT '{}'::jsonb,
  premium_calculation JSONB,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create form_deployments table
CREATE TABLE public.form_deployments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_template_id UUID NOT NULL REFERENCES public.form_templates(id) ON DELETE CASCADE,
  channel deployment_channel NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  deployed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deployed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(form_template_id, channel)
);

-- Enable RLS
ALTER TABLE public.form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_deployments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for form_templates
CREATE POLICY "Admins can manage all form templates"
ON public.form_templates
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view active form templates"
ON public.form_templates
FOR SELECT
USING (is_active = true);

-- RLS Policies for form_deployments
CREATE POLICY "Admins can manage all form deployments"
ON public.form_deployments
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view active deployments"
ON public.form_deployments
FOR SELECT
USING (is_active = true);

-- Create trigger for updated_at
CREATE TRIGGER update_form_templates_updated_at
BEFORE UPDATE ON public.form_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();