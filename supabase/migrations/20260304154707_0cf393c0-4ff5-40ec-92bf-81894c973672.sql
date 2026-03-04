CREATE POLICY "Brokers can insert subscriptions"
ON public.subscriptions
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'broker'::app_role) AND assigned_broker_id = auth.uid()
);