# Onglet « Approbations en attente » — Admin

Ajout d'un onglet dédié dans les deux pages Admin existantes (Renouvellements + Souscriptions) pour traiter les demandes d'approbation (réduction souscription > seuil, bonus/malus renouvellement > seuil, valeur véhicule > 75M FCFA).

UI uniquement — données mockées pour l'instant (la table `pricing_adjustment_approvals` sera créée dans un second temps avec le reste du mécanisme tarifaire).

## Pages modifiées

### 1. `/admin/renewals` — `src/pages/admin/RenewalsPage.tsx`
Refonte avec composant `Tabs` (shadcn) :
- **Onglet « Pipeline »** : contenu actuel (`RenewalsImportCard` + `RenewalsPipelineCard`)
- **Onglet « Approbations en attente »** : nouveau composant `ApprovalsTable` filtré sur `source = 'renewal'`, avec badge compteur sur le titre de l'onglet

### 2. `/admin/subscriptions` — `src/pages/admin/SubscriptionsPage.tsx`
Même refonte :
- **Onglet « Souscriptions »** : `AdminSubscriptionsTable` actuel
- **Onglet « Approbations en attente »** : `ApprovalsTable` filtré sur `source = 'subscription'`, avec badge compteur

## Nouveau composant partagé

`src/components/admin/approvals/ApprovalsTable.tsx`

**Props** : `source: 'renewal' | 'subscription'`

**Colonnes** :
Demandeur · Client · Produit · Type (Réduction / Bonus / Malus) · Montant impacté (FCFA) · Valeur véhicule (FCFA) · Date demande · Statut · Actions

**Filtres header** :
- Statut : `En attente` (défaut) / `Approuvée` / `Refusée` / `Toutes`
- Recherche libre (client, demandeur)

**Actions par ligne (statut `En attente` uniquement)** :
- Bouton **Approuver** (vert) — confirmation simple via `AlertDialog`
- Bouton **Refuser** (rouge) — ouvre `Dialog` avec `Textarea` motif **obligatoire** (min 10 caractères)

Pour les lignes déjà traitées : affichage du décideur + motif (hover/tooltip), pas d'actions.

**État** : `useState` local avec données mockées (5–8 lignes par source mélangeant les 3 statuts) — les handlers `onApprove`/`onReject` modifient l'état local et affichent un `toast` de confirmation. Aucun appel réseau.

## Détails techniques

- Pattern `Tabs` identique à celui déjà utilisé ailleurs dans l'app (shadcn `tabs.tsx`)
- Format FCFA via `formatFCFA` (utilitaire existant)
- Mock data centralisée dans `src/components/admin/approvals/mockApprovals.ts` pour pouvoir réutiliser entre les deux pages et préparer le branchement Supabase futur
- Badge compteur : petit `Badge` shadcn `variant="secondary"` à côté du label d'onglet, affichant le nombre de demandes `En attente`
- Sidebar Admin **non modifiée** (pas de page `/admin/approvals` dédiée, conformément à ta décision de fusionner)

## Hors périmètre

- Création de la table `pricing_adjustment_approvals` (sera faite avec la migration du mécanisme tarifaire complet)
- Branchement réel des actions Approuver/Refuser sur la BDD
- Notifications email au demandeur
- Audit logs

## Ordre d'implémentation

1. `mockApprovals.ts` (types + données)
2. `ApprovalsTable.tsx` (table + dialogs Approuver/Refuser)
3. Refonte `RenewalsPage.tsx` avec `Tabs`
4. Refonte `SubscriptionsPage.tsx` avec `Tabs`
