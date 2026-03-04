

## Problème identifié

Le flux de vente guidée ne crée **jamais d'enregistrement dans la table `subscriptions`**. Il ne persiste que dans la table `quotations` (avec `payment_status: "pending_payment"`). Quand l'étape d'émission (step 7) est atteinte, aucune police n'est insérée en base. La page "Polices" interroge `subscriptions` → rien ne s'affiche.

## Solution

Créer un enregistrement `subscriptions` quand le paiement est validé (transition step 6 → step 7), et mettre à jour le statut de la quotation associée en `"paid"`.

### Fichier 1 : `src/components/guided-sales/GuidedSalesFlow.tsx`

**Modification de `nextStep()`** : Quand `currentStep === 6` (paiement → émission), avant de passer à l'étape 7, appeler une fonction `finalizeSubscription()` qui :

1. **Cherche le `product_id`** correspondant au produit sélectionné via `supabase.from("products").select("id").eq("name", productName).single()`
2. **Insère dans `subscriptions`** avec :
   - `user_id` : l'ID du client (lead converti ou broker lui-même comme placeholder)
   - `product_id` : trouvé à l'étape 1
   - `policy_number` : généré (format `POL-2024-CI-XXXXXX`)
   - `monthly_premium` : `state.calculatedPremium.totalAPayer`
   - `start_date` : date du paiement
   - `end_date` : +1 an
   - `assigned_broker_id` : l'utilisateur courant (broker)
   - `status` : `"active"`
   - `payment_method` : `state.mobilePayment.paymentMethod`
   - `selected_coverages` : options/plan sélectionnés
   - `object_identifier` : immatriculation ou identifiant objet
3. **Met à jour la quotation** associée (si `draftId` existe) avec `payment_status: "paid"`
4. **Stocke le `policyNumber` et `subscriptionId`** dans le state pour que `IssuanceStep` les affiche

**Même logique pour pack_obseques** (step 4 → step 7) : appeler `finalizeSubscription()` avant le saut.

### Fichier 2 : `src/components/guided-sales/types.ts`

Ajouter au `GuidedSalesState` :
- `finalizedPolicyNumber?: string`
- `finalizedSubscriptionId?: string`

### Fichier 3 : `src/components/guided-sales/steps/IssuanceStep.tsx`

Utiliser `state.finalizedPolicyNumber` au lieu de générer un numéro aléatoire local, et `state.finalizedSubscriptionId` pour le `DocumentResendDialog`.

### Résumé des fichiers impactés (3)
1. `src/components/guided-sales/GuidedSalesFlow.tsx` — logique `finalizeSubscription()` + appel dans `nextStep`
2. `src/components/guided-sales/types.ts` — ajout champs finalized
3. `src/components/guided-sales/steps/IssuanceStep.tsx` — utiliser les données persistées

