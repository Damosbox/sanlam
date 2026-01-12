-- Create client_scores table for storing Client Value Score data
CREATE TABLE IF NOT EXISTS public.client_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_type TEXT DEFAULT 'all',
  score_global NUMERIC DEFAULT 0,
  score_prime NUMERIC DEFAULT 0,
  score_sinistre NUMERIC DEFAULT 0,
  score_charge NUMERIC DEFAULT 0,
  score_responsabilite NUMERIC DEFAULT 0,
  score_duree NUMERIC DEFAULT 0,
  score_garantie NUMERIC DEFAULT 0,
  score_couverture NUMERIC DEFAULT 0,
  score_anciennete NUMERIC DEFAULT 0,
  score_objet NUMERIC DEFAULT 0,
  classe INTEGER DEFAULT 1 CHECK (classe >= 1 AND classe <= 5),
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, product_type)
);

-- Add renewal tracking columns to subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS renewal_status TEXT DEFAULT 'pending' CHECK (renewal_status IN ('pending', 'renewed', 'lost')),
ADD COLUMN IF NOT EXISTS contact_status TEXT DEFAULT 'not_contacted' CHECK (contact_status IN ('not_contacted', 'contacted', 'reached', 'phone_issue')),
ADD COLUMN IF NOT EXISTS client_decision TEXT CHECK (client_decision IN ('wants_renewal', 'no_renewal', 'undecided', NULL)),
ADD COLUMN IF NOT EXISTS churn_reason TEXT,
ADD COLUMN IF NOT EXISTS object_identifier TEXT,
ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ;

-- Enable RLS on client_scores
ALTER TABLE public.client_scores ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for client_scores
CREATE POLICY "Brokers can view scores for their clients"
ON public.client_scores
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.broker_clients bc
    WHERE bc.client_id = client_scores.client_id
    AND bc.broker_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
  )
);

CREATE POLICY "Brokers can insert scores for their clients"
ON public.client_scores
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.broker_clients bc
    WHERE bc.client_id = client_scores.client_id
    AND bc.broker_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
  )
);

CREATE POLICY "Brokers can update scores for their clients"
ON public.client_scores
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.broker_clients bc
    WHERE bc.client_id = client_scores.client_id
    AND bc.broker_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
  )
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_client_scores_client_id ON public.client_scores(client_id);
CREATE INDEX IF NOT EXISTS idx_client_scores_product_type ON public.client_scores(product_type);
CREATE INDEX IF NOT EXISTS idx_subscriptions_renewal_status ON public.subscriptions(renewal_status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON public.subscriptions(end_date);

-- Create trigger to update updated_at
CREATE TRIGGER update_client_scores_updated_at
BEFORE UPDATE ON public.client_scores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();