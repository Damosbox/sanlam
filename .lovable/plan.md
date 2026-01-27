

## Plan : Module de Gestion des Produits d'Assurance

### Objectif
Créer un module complet de gestion des produits d'assurance permettant aux administrateurs de configurer, visualiser et commercialiser l'ensemble du catalogue produits.

---

### Architecture proposée

```text
Admin Sidebar (Configuration)
├── Produits (NOUVEAU)     ← Module principal à créer
├── Formulaires            ← Existant (sera lié aux produits)
├── Monitoring IA
└── Concurrence
```

---

### 1. Vue Liste des Produits

**Route** : `/admin/products`

**Colonnes du tableau** :
- Image (miniature)
- Nom du produit
- Catégorie (badge Vie/Non-Vie)
- Type (sous-catégorie)
- Renouvelable (Oui/Non)
- Sinistres (Oui/Non)
- Statut (Actif/Inactif)
- Actions (Éditer, Dupliquer, Supprimer)

**Filtres disponibles** :
- Par catégorie (Vie / Non-Vie)
- Par type
- Par statut

---

### 2. Création/Édition de Produit

**Structure en onglets** :

#### Onglet 1 : Informations Générales
- Nom du produit (texte)
- Catégorie : Vie / Non-Vie (select)
- Type :
  - Vie : Vie, Obsèques, Épargne, Retraite
  - Non-Vie : Auto, Habitation, Santé, Voyage
- Renouvelable : Oui / Non (switch)
- Sinistres : Oui / Non (switch)
- Description (textarea)
- Image du produit (upload, affichée en haut à droite)

#### Onglet 2 : Informations de Souscription
- **Section "Informations du produit"** : Champs pour la cotation/tarification
- **Section "Informations du client"** : Champs pour valider la souscription
- Drag & Drop pour réorganiser les champs
- Possibilité de lier un formulaire existant (`form_templates`)

#### Onglet 3 : Règles de Calcul
- Liste des règles de calcul existantes
- Ajout/sélection de règles
- Éditeur de formules (base premium, coefficients, taxes)

#### Onglet 4 : Bénéficiaires (Vie uniquement)
- Configuration des champs bénéficiaires
- Nombre max de bénéficiaires
- Répartition obligatoire (100%)

#### Onglet 5 : Moyens de Paiement
- CB (switch actif/inactif)
- Mobile Money (Wave, Orange Money, MTN MoMo)
- Virement bancaire
- Paiement en agence

#### Onglet 6 : Documents
- Liste des templates de documents
- Ajout de documents avec champs dynamiques :
  - Variables disponibles : `{{nom}}`, `{{date}}`, `{{signature}}`, `{{montant}}`
- Types : Conditions générales, Attestation, Fiche produit

#### Onglet 7 : Ventes
- **Produits optionnels** : Sélection multi-produits (add-ons)
  - Ex: Assistance dépannage 24/7 pour Auto
- **Produits alternatifs** : Sélection multi-produits (substituts)
  - Ex: Proposer Auto Essentiel si Auto Premium trop cher

#### Onglet 8 : FAQs
- Liste des questions/réponses
- Drag & Drop pour réordonner
- Ajout/édition/suppression de FAQ

---

### 3. Schéma Base de Données

**Modification de la table `products`** :

```sql
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS product_type text,
ADD COLUMN IF NOT EXISTS is_renewable boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_claims boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS image_url text,
ADD COLUMN IF NOT EXISTS calculation_rules jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS beneficiaries_config jsonb,
ADD COLUMN IF NOT EXISTS payment_methods jsonb DEFAULT '{"cb": true, "wave": true, "orange_money": true, "mtn_momo": true}',
ADD COLUMN IF NOT EXISTS optional_products uuid[],
ADD COLUMN IF NOT EXISTS alternative_products uuid[],
ADD COLUMN IF NOT EXISTS document_templates jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS faqs jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS subscription_form_id uuid REFERENCES form_templates(id);
```

**Ajout de tables de configuration** :

```sql
-- Catégories produit (configurables dans paramètres)
CREATE TABLE product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,  -- "vie" ou "non_vie"
  label text NOT NULL, -- "Vie" ou "Non-Vie"
  created_at timestamptz DEFAULT now()
);

-- Types produit (sous-catégories)
CREATE TABLE product_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES product_categories(id),
  name text NOT NULL,  -- "auto", "habitation", etc.
  label text NOT NULL, -- "Automobile", "Habitation", etc.
  created_at timestamptz DEFAULT now()
);

-- Templates de documents (pour réutilisation)
CREATE TABLE document_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL, -- "conditions_generales", "attestation", "fiche_produit"
  content text, -- Template avec variables {{...}}
  dynamic_fields jsonb DEFAULT '[]',
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

---

### 4. Fichiers à Créer

| Fichier | Description |
|---------|-------------|
| `src/pages/admin/ProductsPage.tsx` | Page liste des produits |
| `src/pages/admin/ProductEditPage.tsx` | Page création/édition |
| `src/components/admin/products/ProductsList.tsx` | Tableau des produits |
| `src/components/admin/products/ProductForm.tsx` | Formulaire principal avec onglets |
| `src/components/admin/products/tabs/GeneralInfoTab.tsx` | Onglet infos générales |
| `src/components/admin/products/tabs/SubscriptionFieldsTab.tsx` | Onglet champs souscription |
| `src/components/admin/products/tabs/CalculationRulesTab.tsx` | Onglet règles de calcul |
| `src/components/admin/products/tabs/BeneficiariesTab.tsx` | Onglet bénéficiaires (Vie) |
| `src/components/admin/products/tabs/PaymentMethodsTab.tsx` | Onglet moyens de paiement |
| `src/components/admin/products/tabs/DocumentsTab.tsx` | Onglet documents |
| `src/components/admin/products/tabs/SalesTab.tsx` | Onglet ventes croisées |
| `src/components/admin/products/tabs/FaqsTab.tsx` | Onglet FAQs |

---

### 5. Modifications à Effectuer

**`src/components/admin/AdminSidebar.tsx`** :
- Ajouter "Produits" dans le groupe Configuration avec icône `Package`

**`src/App.tsx`** :
- Ajouter routes `/admin/products` et `/admin/products/:id`

---

### 6. Relation Produits ↔ Formulaires

Le module "Formulaires" existant reste intact. Un produit pourra être lié à un formulaire via `subscription_form_id`, permettant :
- De réutiliser les formulaires drag & drop existants
- D'assigner un parcours de souscription personnalisé par produit
- De garder la flexibilité de créer des formulaires indépendamment

---

### Section Technique

**Structure JSON des règles de calcul** :
```json
{
  "base_formula": "base_premium * coefficient",
  "variables": [
    { "name": "age_factor", "type": "range", "values": {...} },
    { "name": "bns_factor", "type": "select", "values": {...} }
  ],
  "taxes": { "rate": 0.145, "name": "TVA" },
  "fees": { "accessories": 5000, "fga": 0.02 }
}
```

**Structure JSON des FAQs** :
```json
[
  { "id": "faq_1", "question": "...", "answer": "...", "order": 1 },
  { "id": "faq_2", "question": "...", "answer": "...", "order": 2 }
]
```

**RLS Policies** :
- Admins : CRUD complet sur tous les produits
- Brokers : SELECT sur produits actifs uniquement
- Customers : SELECT sur produits actifs uniquement

