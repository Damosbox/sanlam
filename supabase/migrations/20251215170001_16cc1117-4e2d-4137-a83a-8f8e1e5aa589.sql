-- Create client_notes table for storing broker notes on clients
CREATE TABLE public.client_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  broker_id UUID NOT NULL,
  content TEXT NOT NULL,
  note_type TEXT DEFAULT 'note',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Brokers can view notes for their clients"
ON public.client_notes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM broker_clients
    WHERE broker_clients.client_id = client_notes.client_id
    AND broker_clients.broker_id = auth.uid()
  )
);

CREATE POLICY "Brokers can insert notes for their clients"
ON public.client_notes FOR INSERT
WITH CHECK (
  auth.uid() = broker_id AND
  EXISTS (
    SELECT 1 FROM broker_clients
    WHERE broker_clients.client_id = client_notes.client_id
    AND broker_clients.broker_id = auth.uid()
  )
);

CREATE POLICY "Brokers can delete their own notes"
ON public.client_notes FOR DELETE
USING (auth.uid() = broker_id);

CREATE POLICY "Admins can manage all client notes"
ON public.client_notes FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));