
-- Enable RLS on client_additional_data (if not already)
ALTER TABLE public.client_additional_data ENABLE ROW LEVEL SECURITY;

-- Admins can manage all client additional data
CREATE POLICY "Admins can manage all client additional data"
ON public.client_additional_data
FOR ALL
TO public
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Brokers can view additional data for their clients
CREATE POLICY "Brokers can view client additional data"
ON public.client_additional_data
FOR SELECT
TO public
USING (EXISTS (
  SELECT 1 FROM broker_clients
  WHERE broker_clients.client_id = client_additional_data.client_id
  AND broker_clients.broker_id = auth.uid()
));

-- Brokers can insert additional data for their clients
CREATE POLICY "Brokers can insert client additional data"
ON public.client_additional_data
FOR INSERT
TO public
WITH CHECK (EXISTS (
  SELECT 1 FROM broker_clients
  WHERE broker_clients.client_id = client_additional_data.client_id
  AND broker_clients.broker_id = auth.uid()
));

-- Brokers can update additional data for their clients
CREATE POLICY "Brokers can update client additional data"
ON public.client_additional_data
FOR UPDATE
TO public
USING (EXISTS (
  SELECT 1 FROM broker_clients
  WHERE broker_clients.client_id = client_additional_data.client_id
  AND broker_clients.broker_id = auth.uid()
));

-- Customers can view their own additional data
CREATE POLICY "Customers can view own additional data"
ON public.client_additional_data
FOR SELECT
TO public
USING (auth.uid() = client_id);
