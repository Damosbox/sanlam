-- 1. Create permissions table
CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create role_permissions junction table
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (role, permission_id)
);

-- 3. Create audit_logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for permissions (read-only for authenticated, manage for admin)
CREATE POLICY "Authenticated users can view permissions"
ON public.permissions FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins can manage permissions"
ON public.permissions FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. RLS Policies for role_permissions
CREATE POLICY "Authenticated users can view role_permissions"
ON public.role_permissions FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins can manage role_permissions"
ON public.role_permissions FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 7. RLS Policies for audit_logs (only admins can view)
CREATE POLICY "Admins can view audit_logs"
ON public.audit_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert audit_logs"
ON public.audit_logs FOR INSERT TO authenticated
WITH CHECK (true);

-- 8. Create has_permission function
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _permission TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role = ur.role
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = _user_id AND p.name = _permission
  )
$$;

-- 9. Insert default permissions
INSERT INTO public.permissions (name, description, category) VALUES
-- Users
('users.view', 'Voir les utilisateurs', 'Utilisateurs'),
('users.create', 'Créer des utilisateurs', 'Utilisateurs'),
('users.edit', 'Modifier les utilisateurs', 'Utilisateurs'),
('users.delete', 'Supprimer des utilisateurs', 'Utilisateurs'),
('users.activate', 'Activer des utilisateurs', 'Utilisateurs'),
-- Clients
('clients.view', 'Voir les clients', 'Clients'),
('clients.create', 'Créer des clients', 'Clients'),
('clients.edit', 'Modifier les clients', 'Clients'),
('clients.delete', 'Supprimer des clients', 'Clients'),
-- Leads
('leads.view', 'Voir les leads', 'Leads'),
('leads.create', 'Créer des leads', 'Leads'),
('leads.edit', 'Modifier les leads', 'Leads'),
('leads.delete', 'Supprimer des leads', 'Leads'),
('leads.convert', 'Convertir les leads en clients', 'Leads'),
-- Policies
('policies.view', 'Voir les polices', 'Polices'),
('policies.create', 'Créer des polices', 'Polices'),
('policies.cancel', 'Annuler des polices', 'Polices'),
-- Claims
('claims.view', 'Voir les sinistres', 'Sinistres'),
('claims.create', 'Créer des sinistres', 'Sinistres'),
('claims.process', 'Traiter les sinistres', 'Sinistres'),
('claims.approve', 'Approuver les sinistres', 'Sinistres'),
-- Surveys
('surveys.view', 'Voir les enquêtes', 'Enquêtes'),
('surveys.create', 'Créer des enquêtes', 'Enquêtes'),
('surveys.send', 'Envoyer des enquêtes', 'Enquêtes'),
-- Analytics
('analytics.view', 'Voir les analytics', 'Analytics'),
('analytics.export', 'Exporter les données', 'Analytics'),
-- Settings
('settings.view', 'Voir les paramètres', 'Paramètres'),
('settings.edit', 'Modifier les paramètres', 'Paramètres');

-- 10. Assign permissions to roles
-- Admin gets all permissions
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'admin'::public.app_role, id FROM public.permissions;

-- Broker gets specific permissions
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'broker'::public.app_role, id FROM public.permissions
WHERE name IN (
  'clients.view', 'clients.create', 'clients.edit',
  'leads.view', 'leads.create', 'leads.edit', 'leads.delete', 'leads.convert',
  'policies.view', 'policies.create',
  'claims.view', 'claims.create', 'claims.process',
  'surveys.view', 'surveys.send',
  'analytics.view'
);

-- Customer gets minimal permissions
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'customer'::public.app_role, id FROM public.permissions
WHERE name IN (
  'policies.view',
  'claims.view', 'claims.create'
);

-- 11. Create index for faster permission lookups
CREATE INDEX idx_role_permissions_role ON public.role_permissions(role);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_resource_type ON public.audit_logs(resource_type);