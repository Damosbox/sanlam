

## Plan : Screening LCB-FT — Déclenchement automatique, visibilité restreinte, blocage parcours

### Règles métier à implémenter

1. **Déclenchement automatique** : le screening se lance automatiquement après un KYC valide (OCR CNI réussi ou sauvegarde KYC avec identité vérifiée + document valide)
2. **Déclenchement à la demande** : seul le rôle "Conformité" (nouveau rôle `app_role`) peut déclencher un screening manuellement pour n'importe quel client
3. **Visibilité restreinte** : l'agent/courtier ne voit **jamais** les résultats détaillés (PPE, AML, flags). Il voit uniquement un feu tricolore (Vert/Orange/Rouge)
4. **Blocage parcours** : si screening positif (PPE ou risque élevé), le parcours de vente est bloqué avec le message : *"SanlamAllianz reviendra vers le client afin de compléter la transaction ou mettre à jour des informations sur sa fiche"*

### Changements techniques

#### A. Nouveau rôle `compliance` (migration SQL)

```sql
ALTER TYPE public.app_role ADD VALUE 'compliance';
```

Ajouter des permissions `kyc.view_results`, `kyc.trigger_screening` dans la table `permissions` et les associer aux rôles `compliance` et `admin`.

#### B. Modifier `screen-ppe` edge function

- Après le screening, écrire un champ `screening_blocked: true/false` dans `client_kyc_compliance` / `lead_kyc_compliance` (nouveau champ `screening_blocked boolean DEFAULT false`)
- Le screening est bloquant si `isPPE === true` OU `amlRiskLevel === 'high'`
- Retourner uniquement le statut bloquant/non-bloquant dans la réponse (pas les détails PPE/AML) — les détails restent en DB, accessibles uniquement aux rôles autorisés

#### C. Modifier `ClientKYCSection` et `LeadKYCSection`

- **Supprimer** l'affichage des résultats détaillés PPE/AML pour les courtiers (lignes 431-498 de ClientKYCSection, équivalent dans LeadKYCSection)
- **Supprimer** le bouton "Lancer le screening" manuel pour les courtiers
- Afficher uniquement un badge feu tricolore :
  - 🟢 Vert : screening OK, pas de blocage
  - 🟠 Orange : screening en cours ou non effectué
  - 🔴 Rouge : screening bloquant + message "SanlamAllianz reviendra vers le client..."
- Ajouter un `PermissionGate permission="kyc.view_results"` autour des résultats détaillés → visible uniquement pour compliance/admin

#### D. Déclenchement automatique après OCR/sauvegarde KYC

Dans `ClientKYCSection.saveMutation.onSuccess` et `LeadKYCSection.saveMutation.onSuccess` : si `identity_verified === true` et document valide (numéro + type renseignés), appeler automatiquement `screen-ppe` en background.

Dans `ClientIdentificationStep.handleOCRUpload` : après OCR réussi, upsert dans `client_kyc_compliance` / `lead_kyc_compliance` puis déclencher le screening automatiquement.

#### E. Blocage du parcours de vente guidée

Dans `GuidedSalesFlow.finalizeSubscription()` (ligne ~488) et dans `SignatureEmissionStep` : 
- Vérifier `screening_blocked` depuis la table KYC du contact lié
- Si bloqué, afficher une alerte non contournable avec le message SanlamAllianz et empêcher la progression

#### F. Migration DB

```sql
-- Nouveau champ sur les tables KYC
ALTER TABLE client_kyc_compliance ADD COLUMN screening_blocked boolean DEFAULT false;
ALTER TABLE lead_kyc_compliance ADD COLUMN screening_blocked boolean DEFAULT false;

-- Nouveau rôle
ALTER TYPE public.app_role ADD VALUE 'compliance';

-- Permissions KYC
INSERT INTO permissions (name, description, category) VALUES
  ('kyc.view_results', 'Voir les résultats détaillés du screening LCB-FT', 'compliance'),
  ('kyc.trigger_screening', 'Déclencher un screening LCB-FT manuellement', 'compliance');
```

### Fichiers impactés

| Fichier | Modification |
|---------|-------------|
| Migration SQL | Champs `screening_blocked`, rôle `compliance`, permissions |
| `supabase/functions/screen-ppe/index.ts` | Calcul `screening_blocked`, réponse sans détails |
| `src/components/clients/ClientKYCSection.tsx` | Feu tricolore, screening auto, masquer détails |
| `src/components/leads/LeadKYCSection.tsx` | Idem |
| `src/components/guided-sales/steps/ClientIdentificationStep.tsx` | Upsert KYC + screening auto après OCR |
| `src/components/guided-sales/GuidedSalesFlow.tsx` | Vérif `screening_blocked` avant finalisation |
| `src/components/guided-sales/steps/SignatureEmissionStep.tsx` | Afficher alerte si bloqué |

