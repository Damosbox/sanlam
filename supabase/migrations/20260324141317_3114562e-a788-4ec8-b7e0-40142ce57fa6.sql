
-- Add new roles to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'backoffice_crc';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'backoffice_conformite';
