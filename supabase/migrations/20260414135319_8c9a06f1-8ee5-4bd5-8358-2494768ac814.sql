
-- Add missing columns to document_templates
ALTER TABLE public.document_templates 
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS product_id uuid,
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'autre';

-- Create index on category for filtering
CREATE INDEX IF NOT EXISTS idx_document_templates_category ON public.document_templates(category);
CREATE INDEX IF NOT EXISTS idx_document_templates_product_id ON public.document_templates(product_id);
