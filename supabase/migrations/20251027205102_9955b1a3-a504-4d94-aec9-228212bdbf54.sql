-- Create table for competitive analyses
CREATE TABLE public.competitive_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID NOT NULL,
  competitor_name TEXT,
  document_type TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  extracted_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  positioning_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  strengths JSONB DEFAULT '[]'::jsonb,
  weaknesses JSONB DEFAULT '[]'::jsonb,
  commercial_arguments JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  comparison_table JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'processing',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.competitive_analyses ENABLE ROW LEVEL SECURITY;

-- Admins can view all analyses
CREATE POLICY "Admins can view all competitive analyses"
ON public.competitive_analyses
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert analyses
CREATE POLICY "Admins can insert competitive analyses"
ON public.competitive_analyses
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update analyses
CREATE POLICY "Admins can update competitive analyses"
ON public.competitive_analyses
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete analyses
CREATE POLICY "Admins can delete competitive analyses"
ON public.competitive_analyses
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Brokers can view all analyses
CREATE POLICY "Brokers can view competitive analyses"
ON public.competitive_analyses
FOR SELECT
USING (has_role(auth.uid(), 'broker'::app_role));

-- Brokers can create analyses
CREATE POLICY "Brokers can insert competitive analyses"
ON public.competitive_analyses
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'broker'::app_role) AND auth.uid() = created_by);

-- Brokers can update their own analyses
CREATE POLICY "Brokers can update their competitive analyses"
ON public.competitive_analyses
FOR UPDATE
USING (has_role(auth.uid(), 'broker'::app_role) AND auth.uid() = created_by);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_competitive_analyses_updated_at
BEFORE UPDATE ON public.competitive_analyses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();