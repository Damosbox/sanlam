## Objectif

Recentrer les ajustements tarifaires sur des seuils en **%**, clarifier que l'approbation côté **Souscription** concerne la **Réduction** et celle côté **Renouvellement** concerne le **Bonus/Malus**, enrichir le pipeline Renouvellement (sinistres + scoring) et intégrer le bonus/malus au moment de la notification.

---

## 1. Onglet "Ajustements" produit (`DiscountsTab.tsx`)

**Workflow d'approbation — passer en % et dédoubler les seuils**

- Supprimer `threshold_fcfa`.
- Ajouter deux seuils en % :
  - `threshold_reduction_pct` → approbation pour la **Réduction Souscription**.
  - `threshold_bonus_malus_pct` → approbation pour le **Bonus/Malus Renouvellement**.
- Inputs 0–100, libellés explicites, conserver `validator_roles`.

```text
approval: {
  required: boolean
  threshold_reduction_pct: number   // %
  threshold_bonus_malus_pct: number // %
  validator_roles: string[]
}
```

Bonus/Malus et Réduction Souscription restent inchangés (déjà en %).

---

## 2. Page Souscriptions (`SubscriptionsPage.tsx`)

- **Conserver** l'onglet "Approbations en attente" : il concerne uniquement les demandes de **Réduction Souscription** qui dépassent `threshold_reduction_pct`.
- Renommer l'onglet en **"Approbations Réduction"** pour lever l'ambiguïté.
- La table `ApprovalsTable source="subscription"` filtre déjà sur ce flux.

---

## 3. Pipeline Renouvellements (`RenewalsPipelineCard.tsx`)

Deux colonnes dérivées en plus dans la table :

- **Sinistres** : compteur `claims` du client/contrat, affiché en badge (`0`, `2 sinistres`).
- **Scoring** : note `/100` + pastille couleur, lue depuis `client_scores`. Le score guide le bonus/malus (score haut → bonus suggéré, score bas → malus suggéré).

Récupération via joins additionnels dans `useQuery` (`claims(count)`, `client_scores`).

---

## 4. Dialog "Notification de renouvellement" (`RenewalsBulkNotifyDialog.tsx`)

Ajouter un champ **Bonus/Malus appliqué (%)** :

- Slider/Input `-max_malus … +max_bonus` (bornes du produit).
- Valeur suggérée par défaut depuis le scoring du contrat sélectionné.
- Si `|valeur| > approval.threshold_bonus_malus_pct` → bannière "Cette opération sera soumise à approbation" et création d'une demande dans `pricing_adjustment_approvals` (`source = 'renewal'`, `adjustment_pct`) au lieu d'envoyer la notification.
- Sinon, **Confirmer** envoie la notification avec le % choisi.

`RenewalsPipelineCard` transmet le % au `onConfirm` et l'applique aux contrats sélectionnés.

---

## 5. Détails techniques

- `pricing_adjustments` reste un `jsonb` sur `products` — pas de migration. Defaults mis à jour, lecture défensive : si `threshold_fcfa` est présent dans l'ancien JSON, il est ignoré.
- `pricing_adjustment_approvals` : insertion depuis le dialog renouvellement avec `source = 'renewal'`.

---

## Fichiers touchés

- `src/components/admin/products/tabs/DiscountsTab.tsx` — refonte Workflow d'approbation (2 seuils %).
- `src/pages/admin/SubscriptionsPage.tsx` — renommage de l'onglet en "Approbations Réduction" (pas de suppression).
- `src/components/renewals/RenewalsPipelineCard.tsx` — colonnes Sinistres + Scoring, transmission du % au dialog.
- `src/components/renewals/RenewalsBulkNotifyDialog.tsx` — sélecteur Bonus/Malus + déclenchement conditionnel de l'approbation.
