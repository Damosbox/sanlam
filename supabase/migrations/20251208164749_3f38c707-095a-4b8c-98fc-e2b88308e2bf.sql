-- Create lead_kyc_compliance table for KYC compliance data
CREATE TABLE public.lead_kyc_compliance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  -- PPE (Personne Politiquement Exposée)
  is_ppe BOOLEAN DEFAULT false,
  ppe_position TEXT,
  ppe_country TEXT,
  ppe_relationship TEXT, -- Si proche d'une PPE
  -- AML (Anti-Money Laundering)
  aml_verified BOOLEAN DEFAULT false,
  aml_verified_at TIMESTAMP WITH TIME ZONE,
  aml_risk_level TEXT CHECK (aml_risk_level IN ('low', 'medium', 'high')),
  aml_notes TEXT,
  -- Identity Documents
  identity_document_type TEXT CHECK (identity_document_type IN ('cni', 'passport', 'permit', 'other')),
  identity_document_number TEXT,
  identity_expiry_date DATE,
  identity_verified BOOLEAN DEFAULT false,
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(lead_id)
);

-- Enable RLS
ALTER TABLE public.lead_kyc_compliance ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Brokers can view KYC for their leads"
ON public.lead_kyc_compliance
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM leads
    WHERE leads.id = lead_kyc_compliance.lead_id
    AND leads.assigned_broker_id = auth.uid()
  )
);

CREATE POLICY "Brokers can insert KYC for their leads"
ON public.lead_kyc_compliance
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM leads
    WHERE leads.id = lead_kyc_compliance.lead_id
    AND leads.assigned_broker_id = auth.uid()
  )
);

CREATE POLICY "Brokers can update KYC for their leads"
ON public.lead_kyc_compliance
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM leads
    WHERE leads.id = lead_kyc_compliance.lead_id
    AND leads.assigned_broker_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all KYC data"
ON public.lead_kyc_compliance
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_lead_kyc_compliance_updated_at
BEFORE UPDATE ON public.lead_kyc_compliance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();