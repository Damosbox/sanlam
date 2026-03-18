

## Analyse du problème

Le flux Pack Obsèques comporte 7 étapes de souscription :
- **Étape 5** : Moyen de prélèvement (banque, solde, APS, e-wallet, ou pas de prélèvement auto)
- **Étape 7** : Paiement — affiche **toujours** les options Mobile Money (Orange, MTN, Wave, Moov)

**Problème** : Quelle que soit la sélection à l'étape 5, l'étape 7 montre systématiquement le paiement Mobile Money. Il n'y a aucune logique conditionnelle.

### Cas métier attendus

| Choix étape 5 | Comportement attendu étape 7 |
|---|---|
| Prélèvement auto = Oui + **Banque** | Pas de paiement mobile → confirmation simple (le prélèvement bancaire est déjà configuré). Seule la **première prime + frais d'adhésion** doit être payée via mobile money. |
| Prélèvement auto = Oui + **Solde** | Idem — le prélèvement est sur salaire. Première prime via mobile. |
| Prélèvement auto = Oui + **APS** | Idem. |
| Prélèvement auto = Oui + **E-Wallet** | Le paiement mobile est logique → afficher les options Mobile Money. |
| Prélèvement auto = **Non** | Paiement ponctuel → afficher les options Mobile Money. |

### Solution proposée

Modifier l'étape 7 dans `PackObsequesSubscriptionFlow.tsx` pour :

1. **Adapter le titre et la description** selon le contexte :
   - Si prélèvement auto activé (banque/solde/APS) : afficher "Paiement de la première prime" avec une note expliquant que les prochaines primes seront prélevées automatiquement.
   - Si prélèvement auto = Non ou e-wallet : afficher "Paiement de la souscription" (comportement actuel).

2. **Toujours afficher le paiement Mobile Money** pour la première prime (car même avec prélèvement bancaire, la première prime + frais d'adhésion se paient généralement via mobile money en Afrique de l'Ouest). Mais ajouter un **message contextuel** clair.

3. **Ajuster la validation `isStep7Valid`** : rester identique (téléphone + méthode requise).

### Fichier modifié
- `src/components/guided-sales/steps/PackObsequesSubscriptionFlow.tsx` — `renderStep7()` : ajouter un message contextuel basé sur `data.prelevementAuto` et `data.typePrelevement`.

