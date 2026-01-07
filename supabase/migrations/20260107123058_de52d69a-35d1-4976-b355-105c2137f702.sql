-- Create partner_type enum for partner subtypes
CREATE TYPE public.partner_type AS ENUM (
  'agent_mandataire',
  'courtier', 
  'agent_independant'
);

-- Add partner_type column to profiles table
ALTER TABLE public.profiles 
  ADD COLUMN partner_type public.partner_type;