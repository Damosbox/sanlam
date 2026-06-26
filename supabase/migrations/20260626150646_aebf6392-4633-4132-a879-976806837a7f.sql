-- Diversify demo client scoring tiers for visual demo (Bronze / Argent / Or)
UPDATE public.client_scores
SET vf_score_global = 15,
    vf_niveau = 'bronze',
    calculated_at = now()
WHERE client_id IN (SELECT id FROM public.profiles WHERE email = 'marie.dupont@test.com');

UPDATE public.client_scores
SET vf_score_global = 50,
    vf_niveau = 'argent',
    calculated_at = now()
WHERE client_id IN (SELECT id FROM public.profiles WHERE email = 'jean.kouassi@test.com');

UPDATE public.client_scores
SET vf_score_global = 72,
    vf_niveau = 'or',
    calculated_at = now()
WHERE client_id IN (SELECT id FROM public.profiles WHERE email = 'fatou.diallo@test.com');