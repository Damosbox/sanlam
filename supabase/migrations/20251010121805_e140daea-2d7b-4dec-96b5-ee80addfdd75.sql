-- Add assigned_broker_id column to subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN assigned_broker_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX idx_subscriptions_assigned_broker ON public.subscriptions(assigned_broker_id);

-- Add RLS policy for brokers to view their assigned subscriptions
CREATE POLICY "Brokers can view their assigned subscriptions"
ON public.subscriptions
FOR SELECT
USING (has_role(auth.uid(), 'broker') AND assigned_broker_id = auth.uid());

-- Add RLS policy for brokers to update their assigned subscriptions
CREATE POLICY "Brokers can update their assigned subscriptions"
ON public.subscriptions
FOR UPDATE
USING (has_role(auth.uid(), 'broker') AND assigned_broker_id = auth.uid());