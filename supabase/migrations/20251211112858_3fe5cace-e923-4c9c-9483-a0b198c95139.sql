-- =====================================================
-- LEADS TABLE: Modifier les politiques admin
-- =====================================================

-- Supprimer les anciennes politiques admin trop permissives
DROP POLICY IF EXISTS "Admins can view all leads" ON leads;
DROP POLICY IF EXISTS "Admins can manage all leads" ON leads;

-- Nouvelle politique : les admins ne voient QUE leurs leads assignés
CREATE POLICY "Admins can view their assigned leads"
  ON leads
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) 
    AND assigned_broker_id = auth.uid()
  );

-- Les admins peuvent mettre à jour leurs leads assignés
CREATE POLICY "Admins can update their assigned leads"
  ON leads
  FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) 
    AND assigned_broker_id = auth.uid()
  );

-- Les admins peuvent insérer des leads (en s'auto-assignant)
CREATE POLICY "Admins can insert their own leads"
  ON leads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) 
    AND assigned_broker_id = auth.uid()
  );

-- Les admins peuvent supprimer leurs leads assignés
CREATE POLICY "Admins can delete their assigned leads"
  ON leads
  FOR DELETE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) 
    AND assigned_broker_id = auth.uid()
  );

-- =====================================================
-- BROKER_CLIENTS TABLE: Modifier les politiques admin
-- =====================================================

-- Supprimer les anciennes politiques admin trop permissives
DROP POLICY IF EXISTS "Admins can view all broker-client relationships" ON broker_clients;
DROP POLICY IF EXISTS "Admins can insert broker-client relationships" ON broker_clients;
DROP POLICY IF EXISTS "Admins can update broker-client relationships" ON broker_clients;
DROP POLICY IF EXISTS "Admins can delete broker-client relationships" ON broker_clients;

-- Nouvelle politique : les admins ne voient QUE leurs relations broker-client
CREATE POLICY "Admins can view their broker-client relationships"
  ON broker_clients
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) 
    AND broker_id = auth.uid()
  );

-- Les admins peuvent insérer leurs propres relations
CREATE POLICY "Admins can insert their broker-client relationships"
  ON broker_clients
  FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) 
    AND broker_id = auth.uid()
  );

-- Les admins peuvent mettre à jour leurs relations
CREATE POLICY "Admins can update their broker-client relationships"
  ON broker_clients
  FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) 
    AND broker_id = auth.uid()
  );

-- Les admins peuvent supprimer leurs relations
CREATE POLICY "Admins can delete their broker-client relationships"
  ON broker_clients
  FOR DELETE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) 
    AND broker_id = auth.uid()
  );