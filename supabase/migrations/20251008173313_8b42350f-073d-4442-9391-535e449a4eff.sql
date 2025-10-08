-- Add foreign key relationship between claims.user_id and profiles.id
-- This will allow Supabase to perform JOINs between these tables

ALTER TABLE public.claims
ADD CONSTRAINT claims_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;