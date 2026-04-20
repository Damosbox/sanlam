-- Create table for OCR scan results (Compliance audit trail)
CREATE TABLE public.ocr_scan_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Entity link
  entity_type TEXT NOT NULL CHECK (entity_type IN ('lead', 'client')),
  entity_id UUID NOT NULL,
  entity_name TEXT,
  
  -- Document
  document_type TEXT NOT NULL CHECK (document_type IN ('CNI', 'PASSEPORT', 'PERMIS', 'CARTE_CONSULAIRE', 'CARTE_GRISE', 'AUTRE')),
  document_image_url TEXT,
  
  -- OCR results
  extracted_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence_score NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  
  -- Authenticity (mocked AI analysis)
  authenticity_status TEXT NOT NULL DEFAULT 'unverified' CHECK (authenticity_status IN ('authentic', 'suspicious', 'fake', 'unverified')),
  authenticity_score NUMERIC(5,2) DEFAULT 0,
  authenticity_details JSONB DEFAULT '{}'::jsonb,
  
  -- Agent who scanned
  agent_id UUID,
  agent_name TEXT,
  
  -- Compliance review
  review_status TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'validated', 'rejected')),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT
);

CREATE INDEX idx_ocr_scan_results_entity ON public.ocr_scan_results(entity_type, entity_id);
CREATE INDEX idx_ocr_scan_results_review_status ON public.ocr_scan_results(review_status);
CREATE INDEX idx_ocr_scan_results_authenticity ON public.ocr_scan_results(authenticity_status);
CREATE INDEX idx_ocr_scan_results_created_at ON public.ocr_scan_results(created_at DESC);
CREATE INDEX idx_ocr_scan_results_agent ON public.ocr_scan_results(agent_id);

-- Enable RLS
ALTER TABLE public.ocr_scan_results ENABLE ROW LEVEL SECURITY;

-- Admins / Compliance / BackOffice Conformite can view all
CREATE POLICY "Admins can view all OCR scans"
ON public.ocr_scan_results
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Compliance can view all OCR scans"
ON public.ocr_scan_results
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'compliance'::app_role));

CREATE POLICY "BackOffice Conformite can view all OCR scans"
ON public.ocr_scan_results
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'backoffice_conformite'::app_role));

-- Agents can view their own scans
CREATE POLICY "Agents can view their own OCR scans"
ON public.ocr_scan_results
FOR SELECT
TO authenticated
USING (agent_id = auth.uid());

-- Update (review action) by Admins / Compliance / BackOffice Conformite
CREATE POLICY "Admins can update OCR scans"
ON public.ocr_scan_results
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Compliance can update OCR scans"
ON public.ocr_scan_results
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'compliance'::app_role));

CREATE POLICY "BackOffice Conformite can update OCR scans"
ON public.ocr_scan_results
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'backoffice_conformite'::app_role));

-- Insert by authenticated agents (their own scans)
CREATE POLICY "Authenticated users can insert their OCR scans"
ON public.ocr_scan_results
FOR INSERT
TO authenticated
WITH CHECK (agent_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_ocr_scan_results_updated_at
BEFORE UPDATE ON public.ocr_scan_results
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();