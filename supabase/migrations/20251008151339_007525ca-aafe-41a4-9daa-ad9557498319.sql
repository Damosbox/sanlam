-- Create enum for claim types
CREATE TYPE public.claim_type AS ENUM ('Auto', 'Habitation', 'Santé');

-- Create enum for claim status
CREATE TYPE public.claim_status AS ENUM ('Draft', 'Submitted', 'Reviewed', 'Approved', 'Rejected', 'Closed');

-- Create enum for damage types
CREATE TYPE public.damage_type AS ENUM ('Choc', 'Bris de vitre', 'Rayure', 'Feu', 'Inondation', 'Vol', 'Autre');

-- Create claims table
CREATE TABLE public.claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  policy_id TEXT NOT NULL,
  claim_type public.claim_type NOT NULL,
  ocr_data JSONB,
  damages JSONB,
  photos TEXT[],
  status public.claim_status NOT NULL DEFAULT 'Draft',
  cost_estimation NUMERIC(12, 2),
  ai_confidence FLOAT,
  description TEXT,
  location TEXT,
  incident_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create damage_zones table
CREATE TABLE public.damage_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
  zone TEXT NOT NULL,
  damage_type public.damage_type NOT NULL,
  image_url TEXT,
  severity INTEGER CHECK (severity BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.damage_zones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for claims
CREATE POLICY "Users can view their own claims"
  ON public.claims
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own claims"
  ON public.claims
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own claims"
  ON public.claims
  FOR UPDATE
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own draft claims"
  ON public.claims
  FOR DELETE
  USING (auth.uid()::text = user_id::text AND status = 'Draft');

-- RLS Policies for damage_zones
CREATE POLICY "Users can view damage zones for their claims"
  ON public.damage_zones
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.claims
      WHERE claims.id = damage_zones.claim_id
      AND claims.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can create damage zones for their claims"
  ON public.damage_zones
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.claims
      WHERE claims.id = damage_zones.claim_id
      AND claims.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can update damage zones for their claims"
  ON public.damage_zones
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.claims
      WHERE claims.id = damage_zones.claim_id
      AND claims.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete damage zones for their claims"
  ON public.damage_zones
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.claims
      WHERE claims.id = damage_zones.claim_id
      AND claims.user_id::text = auth.uid()::text
    )
  );

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_claims_updated_at
  BEFORE UPDATE ON public.claims
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_claims_user_id ON public.claims(user_id);
CREATE INDEX idx_claims_status ON public.claims(status);
CREATE INDEX idx_damage_zones_claim_id ON public.damage_zones(claim_id);