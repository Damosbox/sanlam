-- Add PPE screening tracking columns to client_kyc_compliance
ALTER TABLE public.client_kyc_compliance
ADD COLUMN IF NOT EXISTS ppe_screening_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS ppe_screening_date timestamptz,
ADD COLUMN IF NOT EXISTS ppe_screening_source text,
ADD COLUMN IF NOT EXISTS ppe_screening_reference text;

-- Add same columns to lead_kyc_compliance for consistency
ALTER TABLE public.lead_kyc_compliance
ADD COLUMN IF NOT EXISTS ppe_screening_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS ppe_screening_date timestamptz,
ADD COLUMN IF NOT EXISTS ppe_screening_source text,
ADD COLUMN IF NOT EXISTS ppe_screening_reference text;

-- Add comment for documentation
COMMENT ON COLUMN public.client_kyc_compliance.ppe_screening_status IS 'Status of PPE screening: pending, in_progress, completed, error';
COMMENT ON COLUMN public.client_kyc_compliance.ppe_screening_source IS 'Source of PPE screening (e.g., WorldCheck, ComplyAdvantage)';
COMMENT ON COLUMN public.client_kyc_compliance.ppe_screening_reference IS 'External reference ID from screening provider';