
# Plan d'Implémentation - Fonctionnalités Non-Partielles Restantes

## Résumé de l'Audit

Après analyse du document `Détails_contenu.xlsx` et de l'état actuel du code, voici les fonctionnalités **non implémentées** (❌) à développer en priorité :

---

## 1. Page Nouveau Sinistre Courtier `/b2b/claims/new`

**Statut actuel** : La route `/b2b/claims/new` n'existe pas côté B2B. Seule `/b2c/claims/new` existe pour les clients.

**Exigences document** :
- Bouton "Nouveau sinistre" dans le tableau des sinistres ✅ (déjà ajouté)
- Ouverture directe de la fiche de déclaration du sinistre
- Formulaire adapté au contexte courtier (sélection du client)

**Implémentation** :
```text
┌────────────────────────────────────────────────────────────────┐
│ Création : src/pages/broker/ClaimNewPage.tsx                   │
├────────────────────────────────────────────────────────────────┤
│ 1. Sélection du client/prospect (searchable dropdown)          │
│ 2. Type de sinistre (Auto/MRH/Santé)                           │
│ 3. Date de survenance                                          │
│ 4. Description du sinistre                                     │
│ 5. Numéro de police concernée                                  │
│ 6. Upload documents justificatifs                              │
│ 7. Bouton "Soumettre la déclaration"                           │
└────────────────────────────────────────────────────────────────┘
```

---

## 2. Renouvellement en Un Clic avec Lien de Paiement

**Statut actuel** : Le tableau des renouvellements existe mais sans :
- Bouton "Renouveler" générant un lien de paiement
- Affichage du projet d'avenant
- Téléchargement des documents post-paiement

**Exigences document** :
- Afficher le détail du renouvellement avec "modifier", "sauvegarder", "renouveler"
- En cas de renouvellement → afficher le lien de paiement
- Après paiement → téléchargement des documents + cross-selling/enquête

**Implémentation** :
```text
┌────────────────────────────────────────────────────────────────┐
│ Modification : RenewalPipelineTable.tsx                        │
├────────────────────────────────────────────────────────────────┤
│ Actions à ajouter dans le menu déroulant :                     │
│ • "Modifier les garanties" → ouvre drawer édition              │
│ • "Générer devis renouvellement" → crée cotation               │
│ • "Renouveler" → génère lien de paiement + PaymentStatusDialog │
│ • "Télécharger documents" (si payé)                            │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ Création : RenewalDetailDialog.tsx                             │
├────────────────────────────────────────────────────────────────┤
│ • Récapitulatif de la police à renouveler                      │
│ • Affichage prime actuelle vs nouvelle prime                   │
│ • Sélection mode de paiement                                   │
│ • Bouton "Envoyer lien de paiement"                            │
│ • Suivi du statut de paiement en temps réel                    │
└────────────────────────────────────────────────────────────────┘
```

---

## 3. Gestion Cotations - Actions Consulter/Modifier/Souscrire

**Statut actuel** : `PendingQuotationsTable.tsx` affiche les cotations mais les actions sont limitées.

**Exigences document** :
- Pour chaque ligne : "Consulter", "Modifier", "Souscrire"
- Statuts : Converti, En cours, Expiré
- Bouton "Devis rapide en un clic"

**Implémentation** :
```text
┌────────────────────────────────────────────────────────────────┐
│ Modification : PendingQuotationsTable.tsx                      │
├────────────────────────────────────────────────────────────────┤
│ Actions dropdown mises à jour :                                │
│ • "Consulter" → ouvre QuotationDetailDialog                    │
│ • "Modifier" → redirige vers /b2b/sales avec données pré-      │
│   remplies                                                     │
│ • "Souscrire" → finalise et génère le contrat                  │
│ • Statuts visuels : vert (converti), bleu (en cours),          │
│   gris (expiré)                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 4. Consultation des Informations de Scoring

**Statut actuel** : Le scoring est affiché dans le tableau mais on ne peut pas voir le détail des dimensions ayant servi au calcul.

**Exigences document** :
- "Laisser le scoring affiché devant chaque client"
- "Prévoir un champ de consultation des informations ayant servi à l'attribution de la note"

**Implémentation** :
```text
┌────────────────────────────────────────────────────────────────┐
│ Modification : PortfolioDataTable.tsx                          │
├────────────────────────────────────────────────────────────────┤
│ • Clic sur le score → ouvre ScoreDetailPopover                 │
│ • Affiche radar chart miniature                                │
│ • Liste les 9 dimensions avec leur valeur                      │
│ • Explication textuelle du score                               │
└────────────────────────────────────────────────────────────────┘
```

---

## 5. Route B2B Claims New

**Fichiers à créer/modifier** :

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/pages/broker/ClaimNewPage.tsx` | CRÉER | Page déclaration sinistre côté courtier |
| `src/App.tsx` | MODIFIER | Ajouter route `/b2b/claims/new` |
| `src/components/policies/RenewalDetailDialog.tsx` | CRÉER | Dialog détail + renouvellement |
| `src/components/policies/RenewalPipelineTable.tsx` | MODIFIER | Ajouter actions renouveler/modifier |
| `src/components/policies/PendingQuotationsTable.tsx` | MODIFIER | Ajouter actions consulter/modifier/souscrire |
| `src/components/portfolio/PortfolioDataTable.tsx` | MODIFIER | Ajouter popover détail scoring |

---

## Ordre d'Implémentation Recommandé

1. **ClaimNewPage.tsx** - Créer la page de déclaration sinistre courtier (priorité haute - route manquante)
2. **Route App.tsx** - Ajouter `/b2b/claims/new`
3. **RenewalDetailDialog** - Créer le dialog de renouvellement avec lien paiement
4. **RenewalPipelineTable** - Ajouter les actions de renouvellement
5. **PendingQuotationsTable** - Améliorer les actions cotations
6. **PortfolioDataTable** - Ajouter le popover de détail scoring

---

## Détails Techniques

### ClaimNewPage.tsx - Structure

```tsx
interface BrokerClaimForm {
  clientId: string;          // Sélection du client
  policyId: string;          // Police concernée
  claimType: "Auto" | "MRH" | "Santé";
  incidentDate: string;
  declarationDate: string;   // Auto = aujourd'hui
  description: string;
  location?: string;
  documents: File[];         // Pièces justificatives
}
```

### RenewalDetailDialog - Structure

```tsx
interface RenewalDetail {
  subscription: Subscription;
  currentPremium: number;
  newPremium: number;
  renewalDate: string;
  paymentLink?: string;
  paymentStatus: "pending" | "sent" | "paid";
}
```

### Statuts Cotations

```tsx
type QuotationStatus = 
  | "pending_payment"  // En cours (bleu)
  | "paid"             // Converti (vert)
  | "expired"          // Expiré (gris)
  | "cancelled";       // Annulé (rouge)
```

---

## Ce Qui Restera Après Cette Implémentation

1. **Performances** - "Contenu à définir très bientôt" (selon document)
2. **Renouvellements Clients** - "Contenu à définir très bientôt"
3. **Cross-selling post-paiement** - Enquête de satisfaction après renouvellement
4. **Connexion clients mobile** - Interface client B2C à finaliser
