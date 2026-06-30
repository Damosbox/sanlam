
-- Update get_user_role function with new roles priority
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
 RETURNS app_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role
      WHEN 'admin' THEN 1
      WHEN 'backoffice_conformite' THEN 2
      WHEN 'backoffice_crc' THEN 3
      WHEN 'compliance' THEN 4
      WHEN 'broker' THEN 5
      WHEN 'customer' THEN 6
    END
  LIMIT 1
$$;

-- RLS policies for backoffice_conformite on KYC tables
CREATE POLICY "BackOffice Conformite can view all client KYC data"
ON public.client_kyc_compliance FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'backoffice_conformite'::app_role));

CREATE POLICY "BackOffice Conformite can update all client KYC data"
ON public.client_kyc_compliance FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'backoffice_conformite'::app_role));

CREATE POLICY "BackOffice Conformite can view all lead KYC data"
ON public.lead_kyc_compliance FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'backoffice_conformite'::app_role));

CREATE POLICY "BackOffice Conformite can update all lead KYC data"
ON public.lead_kyc_compliance FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'backoffice_conformite'::app_role));

-- RLS policies for backoffice_crc
CREATE POLICY "BackOffice CRC can view all leads"
ON public.leads FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'backoffice_crc'::app_role));

CREATE POLICY "BackOffice CRC can view all broker clients"
ON public.broker_clients FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'backoffice_crc'::app_role));

CREATE POLICY "BackOffice CRC can view all claims"
ON public.claims FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'backoffice_crc'::app_role));

-- backoffice_conformite needs to view leads for cross-reference
CREATE POLICY "BackOffice Conformite can view all leads"
ON public.leads FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'backoffice_conformite'::app_role));

-- Both need profiles for name display
CREATE POLICY "BackOffice Conformite can view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'backoffice_conformite'::app_role));

CREATE POLICY "BackOffice CRC can view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'backoffice_crc'::app_role));
