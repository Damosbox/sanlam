-- Créer une table pour gérer la relation broker-client
CREATE TABLE public.broker_clients (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  broker_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  assigned_by uuid REFERENCES public.profiles(id),
  notes text,
  UNIQUE(broker_id, client_id)
);

-- Enable RLS
ALTER TABLE public.broker_clients ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour broker_clients
CREATE POLICY "Admins can view all broker-client relationships"
ON public.broker_clients
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert broker-client relationships"
ON public.broker_clients
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update broker-client relationships"
ON public.broker_clients
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete broker-client relationships"
ON public.broker_clients
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Brokers can view their assigned clients"
ON public.broker_clients
FOR SELECT
USING (has_role(auth.uid(), 'broker') AND broker_id = auth.uid());

CREATE POLICY "Clients can view their assigned broker"
ON public.broker_clients
FOR SELECT
USING (has_role(auth.uid(), 'customer') AND client_id = auth.uid());

-- Créer un index pour améliorer les performances
CREATE INDEX idx_broker_clients_broker_id ON public.broker_clients(broker_id);
CREATE INDEX idx_broker_clients_client_id ON public.broker_clients(client_id);