

## Validation OCR — Module Conformité Admin

### Contexte clarifié
- **Pas de changement côté agent B2B** : l'OCR au niveau KYC (depuis `LeadKYCSection` / `ClientKYCSection`) reste transparent pour l'agent.
- **Nouvelle feature côté Admin Conformité uniquement** : l'équipe conformité voit un tableau de bord des scans OCR avec authenticité + score de confiance pour audit et levée de doute.

### Ce qui sera créé

**1. Stockage des résultats OCR (DB)**
Nouvelle table `ocr_scan_results` :
- `id`, `created_at`
- `entity_type` ('lead' | 'client'), `entity_id`
- `document_type` ('CNI' | 'PERMIS' | 'CARTE_GRISE' | 'PASSEPORT')
- `document_image_url` (storage `client-documents`)
- `extracted_data` (jsonb — champs extraits)
- `confidence_score` (numeric 0-100)
- `authenticity_status` ('authentic' | 'suspicious' | 'fake' | 'unverified')
- `authenticity_details` (jsonb — détections : altération, photo recopiée, MRZ valide, etc.)
- `agent_id` (uuid — qui a scanné)
- `reviewed_by`, `reviewed_at`, `review_status` ('pending' | 'validated' | 'rejected'), `review_notes`

RLS : lecture admin + compliance + backoffice_conformite. Insert via Edge Function service role.

**2. Edge Functions enrichies**
Modifier `ocr-identity` et `ocr-vehicle-registration` pour :
- Demander à l'IA un score d'authenticité (cohérence MRZ, qualité image, détection anomalies)
- Persister automatiquement le résultat dans `ocr_scan_results` avec `agent_id` (depuis JWT)
- Uploader l'image source vers `client-documents/ocr-scans/`

**3. Page Admin `/admin/ocr-validation`**
Nouvelle page `OCRValidationPage.tsx` accessible aux rôles `admin`, `compliance`, `backoffice_conformite` :

**KPIs en haut (4 cartes) :**
- Total scans (période)
- Authenticité OK (vert)
- Suspicieux (orange)
- À réviser (rouge)

**Filtres :**
- PeriodFilter, type document, statut authenticité, statut révision, recherche par nom client

**Tableau principal :**
| Date | Agent | Client/Prospect | Document | Confiance | Authenticité | Statut révision | Actions |

**Drawer de détail (clic ligne) :**
- Aperçu image document à gauche
- Champs extraits à droite (lecture seule)
- Score de confiance par champ (badge couleur)
- Indicateur authenticité Regula (🛡️ Authentique / ⚠️ Suspect / ❌ Falsifié)
- Détails techniques (MRZ, anomalies détectées)
- Boutons conformité : **[✓ Valider]** / **[✗ Rejeter + bloquer KYC]** / **Ajouter note**

**4. Intégration sidebar admin**
Ajouter entrée "Validation OCR" dans `AdminSidebar` sous le groupe "Conformité" (à côté de Conformité KYC et Audit).

**5. Lien retour KYC**
Quand conformité rejette un scan → marquer `screening_blocked = true` sur la fiche KYC concernée + créer entrée audit log.

### Fichiers impactés

**Création :**
- Migration DB : table `ocr_scan_results` + RLS + index
- `src/pages/admin/OCRValidationPage.tsx`
- `src/components/admin/ocr/OCRScansTable.tsx`
- `src/components/admin/ocr/OCRDetailDrawer.tsx`
- `src/components/admin/ocr/OCRAuthenticityBadge.tsx`

**Modification :**
- `supabase/functions/ocr-identity/index.ts` (ajout score authenticité + persistence)
- `supabase/functions/ocr-vehicle-registration/index.ts` (idem)
- `src/App.tsx` (route `/admin/ocr-validation`)
- `src/components/admin/AdminSidebar.tsx` (entrée menu)

### Notes techniques
- **Aucun impact** sur `ClientIdentificationStep`, `LeadKYCSection`, `ClientKYCSection`, `ClaimOCRUploader` côté UX agent.
- Score d'authenticité simulé via prompt enrichi à Gemini (analyse cohérence MRZ, qualité image, détection altérations) — pas d'intégration Regula réelle (mock IA crédible).
- Permission RBAC dédiée : `ocr.validate_authenticity` rattachée aux rôles admin/compliance/backoffice_conformite.

