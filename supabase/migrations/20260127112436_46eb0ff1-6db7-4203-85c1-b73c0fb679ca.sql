-- Add new columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS product_type text,
ADD COLUMN IF NOT EXISTS is_renewable boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_claims boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS image_url text,
ADD COLUMN IF NOT EXISTS calculation_rules jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS beneficiaries_config jsonb,
ADD COLUMN IF NOT EXISTS payment_methods jsonb DEFAULT '{"cb": true, "wave": true, "orange_money": true, "mtn_momo": true, "bank_transfer": true, "agency": true}',
ADD COLUMN IF NOT EXISTS optional_products uuid[],
ADD COLUMN IF NOT EXISTS alternative_products uuid[],
ADD COLUMN IF NOT EXISTS document_templates jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS faqs jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS subscription_form_id uuid REFERENCES form_templates(id);

-- Product categories table (configurable in settings)
CREATE TABLE IF NOT EXISTS product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  label text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Product types table (sub-categories)
CREATE TABLE IF NOT EXISTS product_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES product_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  label text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(category_id, name)
);

-- Document templates table
CREATE TABLE IF NOT EXISTS document_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  content text,
  dynamic_fields jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_categories
CREATE POLICY "Admins can manage product categories"
ON product_categories FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view product categories"
ON product_categories FOR SELECT
USING (true);

-- RLS Policies for product_types
CREATE POLICY "Admins can manage product types"
ON product_types FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view product types"
ON product_types FOR SELECT
USING (true);

-- RLS Policies for document_templates
CREATE POLICY "Admins can manage document templates"
ON document_templates FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view active document templates"
ON document_templates FOR SELECT
USING (is_active = true);

-- Insert default categories
INSERT INTO product_categories (name, label, display_order) VALUES
('vie', 'Vie', 1),
('non_vie', 'Non-Vie', 2)
ON CONFLICT (name) DO NOTHING;

-- Insert default product types
INSERT INTO product_types (category_id, name, label, display_order)
SELECT c.id, t.name, t.label, t.display_order
FROM product_categories c
CROSS JOIN (VALUES 
  ('vie', 'vie', 'Assurance Vie', 1),
  ('vie', 'obseques', 'Obsèques', 2),
  ('vie', 'epargne', 'Épargne', 3),
  ('vie', 'retraite', 'Retraite', 4),
  ('non_vie', 'auto', 'Automobile', 1),
  ('non_vie', 'habitation', 'Habitation', 2),
  ('non_vie', 'sante', 'Santé', 3),
  ('non_vie', 'voyage', 'Voyage', 4)
) AS t(cat_name, name, label, display_order)
WHERE c.name = t.cat_name
ON CONFLICT (category_id, name) DO NOTHING;