-- Create client_documents table for storing uploaded documents
CREATE TABLE public.client_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  broker_id UUID NOT NULL,
  document_type TEXT NOT NULL,
  document_name TEXT NOT NULL,
  file_url TEXT,
  file_size INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  expiry_date DATE,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create client_additional_data table (similar to lead_additional_data)
CREATE TABLE public.client_additional_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL UNIQUE,
  birth_date DATE,
  gender TEXT,
  marital_status TEXT,
  children_count INTEGER DEFAULT 0,
  profession TEXT,
  employer TEXT,
  monthly_income_range TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'Sénégal',
  property_owner BOOLEAN DEFAULT false,
  property_type TEXT,
  vehicle_count INTEGER DEFAULT 0,
  has_drivers_license BOOLEAN DEFAULT false,
  drivers_license_date DATE,
  current_insurer TEXT,
  existing_insurances TEXT[],
  preferred_contact_method TEXT DEFAULT 'phone',
  preferred_contact_time TEXT,
  referral_source TEXT,
  custom_fields JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create client_kyc_compliance table (similar to lead_kyc_compliance)
CREATE TABLE public.client_kyc_compliance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL UNIQUE,
  identity_verified BOOLEAN DEFAULT false,
  identity_document_type TEXT,
  identity_document_number TEXT,
  identity_expiry_date DATE,
  is_ppe BOOLEAN DEFAULT false,
  ppe_position TEXT,
  ppe_country TEXT,
  ppe_relationship TEXT,
  aml_verified BOOLEAN DEFAULT false,
  aml_verified_at TIMESTAMP WITH TIME ZONE,
  aml_risk_level TEXT,
  aml_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_additional_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_kyc_compliance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_documents
CREATE POLICY "Brokers can view documents for their clients"
ON public.client_documents FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM broker_clients
    WHERE broker_clients.client_id = client_documents.client_id
    AND broker_clients.broker_id = auth.uid()
  )
);

CREATE POLICY "Brokers can insert documents for their clients"
ON public.client_documents FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM broker_clients
    WHERE broker_clients.client_id = client_documents.client_id
    AND broker_clients.broker_id = auth.uid()
  )
);

CREATE POLICY "Brokers can update documents for their clients"
ON public.client_documents FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM broker_clients
    WHERE broker_clients.client_id = client_documents.client_id
    AND broker_clients.broker_id = auth.uid()
  )
);

CREATE POLICY "Brokers can delete documents for their clients"
ON public.client_documents FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM broker_clients
    WHERE broker_clients.client_id = client_documents.client_id
    AND broker_clients.broker_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all documents"
ON public.client_documents FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for client_additional_data
CREATE POLICY "Brokers can view additional data for their clients"
ON public.client_additional_data FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM broker_clients
    WHERE broker_clients.client_id = client_additional_data.client_id
    AND broker_clients.broker_id = auth.uid()
  )
);

CREATE POLICY "Brokers can insert additional data for their clients"
ON public.client_additional_data FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM broker_clients
    WHERE broker_clients.client_id = client_additional_data.client_id
    AND broker_clients.broker_id = auth.uid()
  )
);

CREATE POLICY "Brokers can update additional data for their clients"
ON public.client_additional_data FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM broker_clients
    WHERE broker_clients.client_id = client_additional_data.client_id
    AND broker_clients.broker_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all additional data"
ON public.client_additional_data FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for client_kyc_compliance
CREATE POLICY "Brokers can view KYC for their clients"
ON public.client_kyc_compliance FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM broker_clients
    WHERE broker_clients.client_id = client_kyc_compliance.client_id
    AND broker_clients.broker_id = auth.uid()
  )
);

CREATE POLICY "Brokers can insert KYC for their clients"
ON public.client_kyc_compliance FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM broker_clients
    WHERE broker_clients.client_id = client_kyc_compliance.client_id
    AND broker_clients.broker_id = auth.uid()
  )
);

CREATE POLICY "Brokers can update KYC for their clients"
ON public.client_kyc_compliance FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM broker_clients
    WHERE broker_clients.client_id = client_kyc_compliance.client_id
    AND broker_clients.broker_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all KYC data"
ON public.client_kyc_compliance FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for client documents
INSERT INTO storage.buckets (id, name, public) VALUES ('client-documents', 'client-documents', false);

-- Storage policies
CREATE POLICY "Brokers can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'client-documents' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Brokers can view documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'client-documents' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Brokers can delete documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'client-documents' 
  AND auth.role() = 'authenticated'
);

-- Add triggers for updated_at
CREATE TRIGGER update_client_documents_updated_at
BEFORE UPDATE ON public.client_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_additional_data_updated_at
BEFORE UPDATE ON public.client_additional_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_kyc_compliance_updated_at
BEFORE UPDATE ON public.client_kyc_compliance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();