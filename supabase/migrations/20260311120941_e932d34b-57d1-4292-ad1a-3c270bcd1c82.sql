ALTER TABLE public.client_additional_data 
  ADD COLUMN IF NOT EXISTS socio_professional_category text,
  ADD COLUMN IF NOT EXISTS loyalty_program_interest boolean DEFAULT false;