-- Create products table for insurance products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  base_premium NUMERIC NOT NULL,
  description TEXT,
  coverages JSONB NOT NULL,
  terms TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert sample products for testing
INSERT INTO products (name, category, base_premium, description, coverages) VALUES
('Auto Confort', 'Auto', 15000, 'Protection complète pour votre véhicule', 
  '{"responsabilite_civile": {"included": true, "limit": "Illimité", "description": "Couvre les dommages causés aux tiers"}, 
    "vol_incendie": {"included": true, "limit": "Valeur à neuf", "description": "Protection contre le vol et l''incendie"}, 
    "bris_glace": {"included": true, "limit": "50000 FCFA", "description": "Remplacement des vitres"}, 
    "assistance": {"included": true, "limit": "24/7", "description": "Dépannage et remorquage"}}'::jsonb),
('Auto Essentielle', 'Auto', 8500, 'Protection de base obligatoire', 
  '{"responsabilite_civile": {"included": true, "limit": "Illimité", "description": "Couvre les dommages causés aux tiers"}, 
    "vol_incendie": {"included": false, "description": "Protection contre le vol et l''incendie"}, 
    "bris_glace": {"included": false, "description": "Remplacement des vitres"}, 
    "assistance": {"included": false, "description": "Dépannage et remorquage"}}'::jsonb),
('Auto Premium', 'Auto', 22000, 'Couverture tous risques', 
  '{"responsabilite_civile": {"included": true, "limit": "Illimité", "description": "Couvre les dommages causés aux tiers"}, 
    "vol_incendie": {"included": true, "limit": "Valeur à neuf", "description": "Protection contre le vol et l''incendie"}, 
    "bris_glace": {"included": true, "limit": "100000 FCFA", "description": "Remplacement des vitres"}, 
    "assistance": {"included": true, "limit": "24/7 international", "description": "Dépannage et remorquage"}, 
    "conducteur": {"included": true, "limit": "500000 FCFA", "description": "Indemnisation du conducteur"}, 
    "vehicule_remplacement": {"included": true, "limit": "15 jours", "description": "Véhicule de remplacement"}}'::jsonb),
('Santé Famille', 'Santé', 22000, 'Couverture santé pour toute la famille', 
  '{"hospitalisation": {"included": true, "limit": "500000 FCFA/an", "description": "Frais d''hospitalisation"}, 
    "consultation": {"included": true, "limit": "50 consultations/an", "description": "Consultations médicales"}, 
    "pharmacie": {"included": true, "limit": "80% remboursement", "description": "Médicaments prescrits"}, 
    "optique": {"included": true, "limit": "30000 FCFA/an", "description": "Lunettes et lentilles"}}'::jsonb),
('Santé Individuelle', 'Santé', 12000, 'Couverture santé de base', 
  '{"hospitalisation": {"included": true, "limit": "300000 FCFA/an", "description": "Frais d''hospitalisation"}, 
    "consultation": {"included": true, "limit": "30 consultations/an", "description": "Consultations médicales"}, 
    "pharmacie": {"included": true, "limit": "60% remboursement", "description": "Médicaments prescrits"}, 
    "optique": {"included": false, "description": "Lunettes et lentilles"}}'::jsonb),
('Habitation Confort', 'Habitation', 18000, 'Protection complète de votre logement', 
  '{"incendie": {"included": true, "limit": "10000000 FCFA", "description": "Dommages par incendie"}, 
    "vol": {"included": true, "limit": "2000000 FCFA", "description": "Vol avec effraction"}, 
    "degats_eaux": {"included": true, "limit": "1000000 FCFA", "description": "Dégâts des eaux"}, 
    "responsabilite_civile": {"included": true, "limit": "Illimité", "description": "Dommages causés aux tiers"}, 
    "bris_glace": {"included": true, "limit": "200000 FCFA", "description": "Remplacement des vitres"}}'::jsonb),
('Habitation Essentielle', 'Habitation', 9500, 'Protection de base de votre logement', 
  '{"incendie": {"included": true, "limit": "5000000 FCFA", "description": "Dommages par incendie"}, 
    "vol": {"included": false, "description": "Vol avec effraction"}, 
    "degats_eaux": {"included": true, "limit": "500000 FCFA", "description": "Dégâts des eaux"}, 
    "responsabilite_civile": {"included": true, "limit": "Illimité", "description": "Dommages causés aux tiers"}, 
    "bris_glace": {"included": false, "description": "Remplacement des vitres"}}'::jsonb),
('Électronique Premium', 'Électronique', 5500, 'Protection tous risques appareils', 
  '{"vol": {"included": true, "limit": "Valeur à neuf", "description": "Vol de l''appareil"}, 
    "casse": {"included": true, "limit": "Illimité", "description": "Dommages accidentels"}, 
    "oxydation": {"included": true, "limit": "Inclus", "description": "Dommages liquides"}, 
    "panne": {"included": true, "limit": "Hors garantie", "description": "Pannes mécaniques"}}'::jsonb),
('Épargne Avenir', 'Épargne', 25000, 'Plan d''épargne avec rendement garanti', 
  '{"capital_garanti": {"included": true, "limit": "100%", "description": "Capital garanti à l''échéance"}, 
    "rendement": {"included": true, "limit": "4.5% annuel", "description": "Taux de rendement"}, 
    "versements_libres": {"included": true, "limit": "Illimité", "description": "Versements supplémentaires"}, 
    "retrait_partiel": {"included": true, "limit": "Après 2 ans", "description": "Retraits partiels possibles"}}'::jsonb),
('Agricole Récolte', 'Agricole', 12000, 'Protection des cultures et récoltes', 
  '{"intemperies": {"included": true, "limit": "80% valeur récolte", "description": "Dommages climatiques"}, 
    "incendie": {"included": true, "limit": "Valeur totale", "description": "Destruction par incendie"}, 
    "vol_betail": {"included": true, "limit": "Valeur marchande", "description": "Vol d''animaux"}, 
    "maladie_animaux": {"included": true, "limit": "Frais vétérinaires", "description": "Soins vétérinaires"}}'::jsonb);

-- Create trigger for updated_at
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage all products"
  ON products FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));