-- Add assigned_broker_id column to claims table
ALTER TABLE public.claims
ADD COLUMN assigned_broker_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX idx_claims_assigned_broker ON public.claims(assigned_broker_id);

-- Create RLS policies for Brokers to view only their assigned claims
CREATE POLICY "Brokers can view their assigned claims"
ON public.claims
FOR SELECT
USING (
  has_role(auth.uid(), 'broker'::app_role) 
  AND assigned_broker_id = auth.uid()
);

-- Create RLS policy for Brokers to update their assigned claims
CREATE POLICY "Brokers can update their assigned claims"
ON public.claims
FOR UPDATE
USING (
  has_role(auth.uid(), 'broker'::app_role) 
  AND assigned_broker_id = auth.uid()
);

-- Comment to explain the column
COMMENT ON COLUMN public.claims.assigned_broker_id IS 'ID of the broker assigned to handle this claim';