-- Create policy_documents table for storing documents associated with policies
CREATE TABLE public.policy_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_name TEXT NOT NULL,
  file_url TEXT,
  file_size INTEGER,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quotations table for managing quotations with payment status
CREATE TABLE public.quotations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  broker_id UUID NOT NULL,
  product_type TEXT NOT NULL,
  product_name TEXT NOT NULL,
  premium_amount NUMERIC NOT NULL,
  premium_frequency TEXT NOT NULL DEFAULT 'mensuel',
  coverage_details JSONB DEFAULT '{}'::jsonb,
  payment_status TEXT NOT NULL DEFAULT 'pending_payment',
  payment_link TEXT,
  valid_until TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.policy_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;

-- RLS policies for policy_documents
CREATE POLICY "Admins can manage all policy documents"
ON public.policy_documents FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Brokers can view documents for their subscriptions"
ON public.policy_documents FOR SELECT
USING (EXISTS (
  SELECT 1 FROM subscriptions s
  WHERE s.id = policy_documents.subscription_id
  AND s.assigned_broker_id = auth.uid()
));

CREATE POLICY "Brokers can insert documents for their subscriptions"
ON public.policy_documents FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM subscriptions s
  WHERE s.id = policy_documents.subscription_id
  AND s.assigned_broker_id = auth.uid()
));

CREATE POLICY "Users can view their own policy documents"
ON public.policy_documents FOR SELECT
USING (EXISTS (
  SELECT 1 FROM subscriptions s
  WHERE s.id = policy_documents.subscription_id
  AND s.user_id = auth.uid()
));

-- RLS policies for quotations
CREATE POLICY "Admins can manage all quotations"
ON public.quotations FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Brokers can view their quotations"
ON public.quotations FOR SELECT
USING (broker_id = auth.uid());

CREATE POLICY "Brokers can insert their quotations"
ON public.quotations FOR INSERT
WITH CHECK (broker_id = auth.uid());

CREATE POLICY "Brokers can update their quotations"
ON public.quotations FOR UPDATE
USING (broker_id = auth.uid());

CREATE POLICY "Brokers can delete their quotations"
ON public.quotations FOR DELETE
USING (broker_id = auth.uid());

-- Create storage bucket for policy documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('policy-documents', 'policy-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for policy-documents bucket
CREATE POLICY "Policy documents are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'policy-documents');

CREATE POLICY "Brokers can upload policy documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'policy-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Brokers can delete their policy documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'policy-documents' AND auth.role() = 'authenticated');

-- Create indexes for better performance
CREATE INDEX idx_policy_documents_subscription ON public.policy_documents(subscription_id);
CREATE INDEX idx_quotations_broker ON public.quotations(broker_id);
CREATE INDEX idx_quotations_lead ON public.quotations(lead_id);
CREATE INDEX idx_quotations_payment_status ON public.quotations(payment_status);
CREATE INDEX idx_quotations_valid_until ON public.quotations(valid_until);