
-- Add screening_blocked column to both KYC tables
ALTER TABLE public.client_kyc_compliance ADD COLUMN IF NOT EXISTS screening_blocked boolean DEFAULT false;
ALTER TABLE public.lead_kyc_compliance ADD COLUMN IF NOT EXISTS screening_blocked boolean DEFAULT false;

-- Add compliance role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'compliance';

-- Add KYC permissions
INSERT INTO public.permissions (name, description, category) VALUES
  ('kyc.view_results', 'Voir les résultats détaillés du screening LCB-FT', 'Compliance'),
  ('kyc.trigger_screening', 'Déclencher un screening LCB-FT manuellement', 'Compliance');
