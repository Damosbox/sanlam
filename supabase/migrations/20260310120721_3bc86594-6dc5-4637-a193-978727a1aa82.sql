
-- Update get_user_role function to include compliance
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
      WHEN 'compliance' THEN 2
      WHEN 'broker' THEN 3
      WHEN 'customer' THEN 4
    END
  LIMIT 1
$$;

-- Grant compliance role access to KYC tables
CREATE POLICY "Compliance can view all client KYC data"
ON public.client_kyc_compliance
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'compliance'::app_role));

CREATE POLICY "Compliance can update all client KYC data"
ON public.client_kyc_compliance
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'compliance'::app_role));

CREATE POLICY "Compliance can view all lead KYC data"
ON public.lead_kyc_compliance
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'compliance'::app_role));

CREATE POLICY "Compliance can update all lead KYC data"
ON public.lead_kyc_compliance
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'compliance'::app_role));
