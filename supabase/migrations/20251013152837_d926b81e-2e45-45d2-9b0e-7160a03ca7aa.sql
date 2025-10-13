-- Ajouter une politique RLS pour que les brokers puissent voir les profils des clients dont ils ont les sinistres
CREATE POLICY "Brokers can view profiles of users with assigned claims"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM claims
    WHERE claims.user_id = profiles.id
      AND claims.assigned_broker_id = auth.uid()
      AND has_role(auth.uid(), 'broker'::app_role)
  )
);