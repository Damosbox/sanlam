

## Plan : 3 fonctionnalités Admin

### 1. Import CSV d'utilisateurs en masse

**Objectif** : Ajouter un bouton "Importer CSV" à côté du bouton "Créer un utilisateur" dans `AdminUsersTable`. Un dialog permet d'uploader un CSV (colonnes : email, firstName, lastName, role, partnerType, password), prévisualiser les lignes, puis lancer la création en batch via l'edge function `create-user` existante.

**Fichiers :**
- `src/components/admin/CsvUserImportDialog.tsx` — **Créer** : Dialog avec upload CSV, parsing client-side (Papa Parse ou FileReader), tableau de prévisualisation, validation (emails, rôles valides), barre de progression, et appel séquentiel de `supabase.functions.invoke('create-user')` par ligne. Résumé final (succès/échecs).
- `src/components/AdminUsersTable.tsx` — **Modifier** : Ajouter le bouton "Importer CSV" à côté de `CreateUserDialog` dans le header.
- `package.json` — **Modifier** : Ajouter `papaparse` + `@types/papaparse` pour le parsing CSV robuste.

### 2. Réorganisation sidebar Admin — Utilisateurs au même niveau que RBAC

**Objectif** : Sortir "Utilisateurs" (Clients, Agents, Admins) du groupe actuel et le placer au même niveau que "Sécurité" (Permissions, Audit), dans un nouveau groupe **"Accès & Utilisateurs"** qui regroupe les deux.

**Fichiers :**
- `src/components/admin/AdminSidebar.tsx` — **Modifier** : Fusionner les groupes `users` et `security` en un seul groupe `access` avec le label **"Accès & Utilisateurs"** contenant : Clients, Agents, Administrateurs, Permissions, Audit.

Nouvelle structure sidebar :
```text
📊 Tableau de Bord
── Opérations (Sinistres, Souscriptions)
── Accès & Utilisateurs (Clients, Agents, Administrateurs, Permissions, Audit)
── Pilotage — Commercial
── Pilotage — Portefeuille
── Pilotage — Risque
── Engagement
── Configuration (+ Templates Documents)
── Développement
```

### 3. Éditeur HTML de templates de documents

**Objectif** : Créer un éditeur WYSIWYG pour les templates de documents (contrats, attestations, etc.) utilisés dans les parcours de vente. L'admin peut créer/éditer des templates HTML avec des variables dynamiques (`{{nom_client}}`, `{{date_souscription}}`, etc.), prévisualiser le rendu, et les sauvegarder en base.

**Fichiers :**
- Table `document_templates` — **Migration** : `id`, `name`, `description`, `category` (contrat/attestation/avenant/autre), `product_id` (nullable FK), `html_content` (text), `variables` (jsonb), `is_active`, `created_at`, `updated_at`, `created_by` (FK auth.users). RLS : admin uniquement.
- `src/components/admin/documents/DocumentTemplateEditor.tsx` — **Créer** : Éditeur HTML rich-text (TipTap/React-Quill) avec toolbar, insertion de variables dynamiques via menu dropdown, mode source HTML, et prévisualisation live.
- `src/components/admin/documents/DocumentTemplatesList.tsx` — **Créer** : Liste des templates avec filtres par catégorie/produit, actions CRUD.
- `src/components/admin/documents/DocumentVariableInserter.tsx` — **Créer** : Composant pour insérer les variables prédéfinies (client, police, produit, dates).
- `src/pages/admin/DocumentTemplatesPage.tsx` — **Créer** : Page admin pour la gestion des templates.
- `src/components/admin/AdminSidebar.tsx` — **Modifier** : Ajouter "Templates Documents" dans le groupe Configuration.
- `src/App.tsx` — **Modifier** : Ajouter route `/admin/document-templates`.
- `package.json` — **Modifier** : Ajouter `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-*` pour l'éditeur rich-text.

**Variables dynamiques prédéfinies :**
- Client : `{{nom_client}}`, `{{prenom_client}}`, `{{email}}`, `{{telephone}}`, `{{adresse}}`
- Police : `{{numero_police}}`, `{{date_effet}}`, `{{date_echeance}}`, `{{prime_ttc}}`
- Produit : `{{nom_produit}}`, `{{formule}}`, `{{garanties}}`
- Système : `{{date_generation}}`, `{{numero_document}}`

### Ordre d'implémentation recommandé

1. **Sidebar** (rapide, 15 min)
2. **Import CSV** (moyen, 1h)
3. **Éditeur de templates** (complexe, 2-3h)

