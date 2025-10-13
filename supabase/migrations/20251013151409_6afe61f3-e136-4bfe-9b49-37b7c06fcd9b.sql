-- Ajouter un champ pour les notes du broker
ALTER TABLE public.claims ADD COLUMN broker_notes text;

-- Ajouter un champ pour la date de révision
ALTER TABLE public.claims ADD COLUMN reviewed_at timestamp with time zone;