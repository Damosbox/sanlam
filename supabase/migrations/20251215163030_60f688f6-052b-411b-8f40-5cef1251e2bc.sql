-- Table données complémentaires pour prospects/leads
CREATE TABLE public.lead_additional_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  
  -- Informations personnelles
  birth_date DATE,
  gender TEXT, -- 'homme', 'femme', 'autre'
  marital_status TEXT, -- 'célibataire', 'marié', 'divorcé', 'veuf', 'concubinage'
  children_count INTEGER DEFAULT 0,
  
  -- Informations professionnelles
  socio_professional_category TEXT, -- 'cadre', 'employé', 'ouvrier', 'artisan', 'profession_liberale', 'fonctionnaire', 'retraite', 'etudiant', 'sans_emploi', 'entrepreneur'
  profession TEXT,
  employer TEXT,
  monthly_income_range TEXT, -- 'moins_100k', '100k_300k', '300k_500k', '500k_1m', '1m_3m', 'plus_3m' FCFA
  
  -- Localisation
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'Sénégal',
  
  -- Patrimoine et véhicules
  has_drivers_license BOOLEAN DEFAULT false,
  drivers_license_date DATE,
  vehicle_count INTEGER DEFAULT 0,
  property_owner BOOLEAN DEFAULT false,
  property_type TEXT, -- 'appartement', 'maison', 'terrain'
  
  -- Assurances existantes
  existing_insurances TEXT[], -- ['auto', 'habitation', 'sante', 'vie']
  current_insurer TEXT,
  
  -- Préférences de contact
  preferred_contact_method TEXT DEFAULT 'phone', -- 'phone', 'whatsapp', 'email', 'sms'
  preferred_contact_time TEXT, -- 'matin', 'midi', 'soir', 'weekend'
  
  -- Acquisition et fidélisation
  referral_source TEXT, -- 'bouche_a_oreille', 'publicite', 'reseaux_sociaux', 'site_web', 'partenaire', 'autre'
  loyalty_program_interest BOOLEAN DEFAULT false,
  
  -- Champs personnalisés (extensible)
  custom_fields JSONB DEFAULT '{}',
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(lead_id)
);

-- Enable RLS
ALTER TABLE public.lead_additional_data ENABLE ROW LEVEL SECURITY;

-- Brokers can view additional data for their leads
CREATE POLICY "Brokers can view additional data for their leads"
ON public.lead_additional_data
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM leads
    WHERE leads.id = lead_additional_data.lead_id
    AND leads.assigned_broker_id = auth.uid()
  )
);

-- Brokers can insert additional data for their leads
CREATE POLICY "Brokers can insert additional data for their leads"
ON public.lead_additional_data
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM leads
    WHERE leads.id = lead_additional_data.lead_id
    AND leads.assigned_broker_id = auth.uid()
  )
);

-- Brokers can update additional data for their leads
CREATE POLICY "Brokers can update additional data for their leads"
ON public.lead_additional_data
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM leads
    WHERE leads.id = lead_additional_data.lead_id
    AND leads.assigned_broker_id = auth.uid()
  )
);

-- Admins can manage all additional data
CREATE POLICY "Admins can manage all additional data"
ON public.lead_additional_data
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_lead_additional_data_updated_at
BEFORE UPDATE ON public.lead_additional_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();