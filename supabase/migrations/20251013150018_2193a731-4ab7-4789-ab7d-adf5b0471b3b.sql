-- Ajouter une policy pour permettre aux brokers de voir les profils de leurs clients assignés
CREATE POLICY "Brokers can view their assigned clients profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.broker_clients
    WHERE broker_clients.client_id = profiles.id
      AND broker_clients.broker_id = auth.uid()
      AND has_role(auth.uid(), 'broker')
  )
);