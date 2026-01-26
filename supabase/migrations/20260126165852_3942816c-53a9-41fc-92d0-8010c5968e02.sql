-- Ajouter les nouvelles valeurs à l'enum partner_type
ALTER TYPE public.partner_type ADD VALUE IF NOT EXISTS 'agent_general';
ALTER TYPE public.partner_type ADD VALUE IF NOT EXISTS 'agent_sanlam';
ALTER TYPE public.partner_type ADD VALUE IF NOT EXISTS 'banquier';