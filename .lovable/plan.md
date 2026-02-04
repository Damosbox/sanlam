

# Plan : Sauvegarde des Devis dans l'Onglet Cotations

## Problème Identifié

Actuellement, le composant `BrokerQuotations.tsx` lit **uniquement** les anciens devis depuis `lead_notes` (format legacy avec `[DEVIS]`). Les nouveaux devis sauvegardés dans la table `quotations` n'apparaissent pas dans cet onglet.

## Solution

Fusionner les deux sources de données dans l'onglet "Cotations" :
1. Lire depuis `lead_notes` (legacy)
2. Lire depuis `quotations` (nouvelle table)
3. Afficher tout dans un tableau unifié

---

## Modifications à Effectuer

### 1. GuidedSalesFlow.tsx - Implémenter la Sauvegarde Réelle

Remplacer le mock `handleSaveQuote` par une insertion réelle dans la table `quotations` :

```typescript
const handleSaveQuote = useCallback(async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    toast.error("Veuillez vous connecter");
    return;
  }

  const quotationData = {
    broker_id: user.id,
    lead_id: state.leadId || null,
    product_type: state.product?.toLowerCase() || "auto",
    product_name: state.product || "Assurance Auto",
    premium_amount: state.calculatedPremium.totalAPayer,
    premium_frequency: mapPeriodicity(state.needsAnalysis.contractPeriodicity),
    payment_status: "pending_payment",
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    coverage_details: {
      planTier: state.coverage.planTier,
      vehicleInfo: state.needsAnalysis,
      clientInfo: state.client,
      options: state.coverage.optionalCoverages,
    }
  };

  const { error } = await supabase.from("quotations").insert(quotationData);
  
  if (error) {
    toast.error("Erreur lors de la sauvegarde");
    return;
  }

  toast.success("Devis sauvegardé", {
    description: "Retrouvez-le dans Polices → Cotations",
    action: { label: "Voir", onClick: () => navigate("/b2b/policies?tab=quotations") }
  });
}, [state, navigate]);
```

### 2. BrokerQuotations.tsx - Fusionner les Sources de Données

Modifier le composant pour lire depuis **les deux tables** :

```text
┌─────────────────────────────────────────────────────────────────┐
│ Avant : Lit uniquement lead_notes avec [DEVIS]                  │
├─────────────────────────────────────────────────────────────────┤
│ Après : Lit lead_notes + quotations (table)                     │
│                                                                 │
│ 1. Requête lead_notes (legacy)                                  │
│ 2. Requête quotations (nouvelle table)                          │
│ 3. Mapper les deux vers un format unifié                        │
│ 4. Trier par date décroissante                                  │
│ 5. Afficher avec statuts visuels (En cours, Converti, Expiré)   │
└─────────────────────────────────────────────────────────────────┘
```

Structure unifiée :
```typescript
interface UnifiedQuotation {
  id: string;
  source: "legacy" | "quotations";
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
  productType: string;
  productName: string;
  premiumAmount: number | null;
  status: "pending" | "converted" | "expired" | "cancelled";
  createdAt: string;
  validUntil: string | null;
  leadId: string | null;
  coverageDetails: any;
}
```

### 3. PoliciesPage.tsx - Support URL Tab Parameter

Ajouter le support du paramètre `?tab=quotations` pour navigation directe :

```typescript
import { useSearchParams } from "react-router-dom";

const [searchParams] = useSearchParams();
const initialTab = searchParams.get("tab") || "policies";
const [activeTab, setActiveTab] = useState(initialTab);
```

### 4. Affichage Amélioré dans BrokerQuotations

Ajouter les actions et statuts visuels :

| Statut | Badge | Condition |
|--------|-------|-----------|
| En cours | Bleu | `payment_status = pending_payment` et non expiré |
| Converti | Vert | `payment_status = paid` |
| Expiré | Gris | `valid_until < aujourd'hui` |

Actions par ligne :
- **Consulter** → Ouvre `QuotationDetailDialog`
- **Modifier** → Redirige vers `/b2b/sales` avec données pré-remplies
- **Souscrire** → Lance le processus de paiement
- **Appeler / Email** → Actions rapides

---

## Fichiers à Modifier

| Fichier | Action |
|---------|--------|
| `src/components/guided-sales/GuidedSalesFlow.tsx` | Implémenter `handleSaveQuote` réel |
| `src/components/BrokerQuotations.tsx` | Fusionner lead_notes + quotations |
| `src/pages/broker/PoliciesPage.tsx` | Support `?tab=quotations` URL |

---

## Résultat Attendu

Après implémentation :

1. **Sauvegarde** : Clic sur "Sauvegarder le devis" → insertion dans `quotations`
2. **Affichage** : Le devis apparaît immédiatement dans **Polices → Cotations**
3. **Navigation** : Toast avec bouton "Voir" → redirige vers l'onglet Cotations
4. **Actions** : Consulter, Modifier, Souscrire disponibles pour chaque devis
5. **Statuts visuels** : En cours (bleu), Converti (vert), Expiré (gris)

---

## Distinction des Onglets

| Onglet | Contenu | Table(s) |
|--------|---------|----------|
| **Polices** | Contrats actifs | `subscriptions` |
| **Cotations** | Tous les devis (en cours, convertis, expirés) | `quotations` + `lead_notes` |
| **Renouvellements** | Polices à échéance | `subscriptions` (filtrées) |
| **En attente** | Devis en attente de paiement | `quotations` (pending_payment) |

