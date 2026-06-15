## Refactor Renouvellements — Admin + Broker

Aligner les pages Renouvellement (Admin et Broker) sur les 3 captures fournies. UI uniquement, mêmes composants partagés, périmètre de données différencié.

### 1. Nouveau layout de page (partagé)

Header sobre :
- Icône `RefreshCw` dans pastille `bg-primary/10`
- Titre "Renouvellements" + sous-titre "Pipeline, suivi et import des renouvellements"
- Pas de KPI cards, pas de toggles Contact/Statut, pas de `ProductSelector`, pas de `PeriodFilter`

### 2. Bloc "Importer des renouvellements" (placeholder UI)

Carte avec :
- Titre + description "Chargez le fichier Excel produit par le système cœur d'assurance (.xlsx ou .xls)."
- Bouton secondaire "Télécharger le modèle" en haut à droite (génère un .xlsx vide côté client via `xlsx`/`exceljs` déjà présent, ou simple toast "Modèle téléchargé" si lib absente)
- Dropzone pointillée : icône upload + "Glissez votre fichier ici ou cliquez pour sélectionner" + "Formats acceptés : .xlsx, .xls — Taille max : 10 Mo"
- Bouton pleine largeur "Lancer l'import" (disabled tant qu'aucun fichier valide n'est sélectionné)
- À la soumission : toast `success` "Import simulé — X lignes détectées" (aucune écriture DB pour l'instant)

### 3. Bloc "Pipeline des Renouvellements" (refactor)

Header de carte :
- Titre "Pipeline des Renouvellements"
- Barre de filtres : `Input` recherche ("Rechercher par client, branche, police"), `Select` "Agence" (Toutes + liste distincte issue des contrats), `Select` "Statut" (Tous / À renouveler / Notifié / Renouvelé / Expiré)
- À droite : compteur "N affichés · page X" + bouton primaire **"Renouveler (N)"** (disabled si aucune ligne cochée)

Tableau refactor (`RenewalPipelineTable`) :
- Colonne checkbox en tête (sélection globale) + checkbox par ligne
- Colonnes : Client (nom + téléphone en sous-ligne) · Produit (badge) · Agence · Police · Échéance (date + badge Expiré/Urgent) · Prime · Statut · Actions
- Actions par ligne : icône `Phone` + icône `MessageCircle` (WhatsApp) uniquement (suppression du menu `MoreHorizontal` complexe pour matcher la capture)
- Suppression des colonnes "Contact" et "Statut dropdown" (remplacées par une seule colonne Statut lecture-seule basée sur `renewal_status`)

### 4. Modal de confirmation "Notification de renouvellement"

Déclenché par le bouton "Renouveler (N)" :
- Titre : "Notification de renouvellement"
- Corps : "{N} Contrat(s) sera/seront notifié(s) pour renouvellement. Confirmer ?"
- Boutons : "Annuler" (outline) / "Confirmer" (primary)
- À la confirmation : toast `success` "{N} notification(s) envoyée(s)" + reset de la sélection (**mockup — aucune écriture DB**)

### 5. Page Admin (création)

- Nouveau fichier `src/pages/admin/RenewalsPage.tsx` (sans préfixe `Admin` pour cohérence avec les autres)
- Route `renewals` ajoutée dans le bloc `/admin` de `src/App.tsx`
- Entrée sidebar Admin : "Renouvellements" dans la section "Opérations", icône `RefreshCw`, juste après "Souscriptions" (cf. capture)
- Périmètre **global** : requête sans filtre `assigned_broker_id`, peut filtrer par agence

### 6. Page Broker (refactor)

- `src/pages/broker/RenewalsPage.tsx` réécrite avec le même layout
- Périmètre conservé : `assigned_broker_id = user.id`
- Suppression du `KPI_CARDS`, de `ProductSelector`, `PeriodFilter`, `RenewalStatusToggles`

### 7. Mutualisation

Pour éviter la duplication, extraire :
- `src/components/renewals/RenewalsImportCard.tsx` (bloc import)
- `src/components/renewals/RenewalsPipelineCard.tsx` (titre + filtres + bouton bulk + table + modal)
- `src/components/renewals/RenewalsBulkNotifyDialog.tsx` (modal de confirmation)
- Refactor de `RenewalPipelineTable` pour accepter `scope: "broker" | "admin"`, `selectedIds`/`onSelectionChange`, et exposer la liste filtrée vers le parent (pour le compteur)

### Détails techniques

```text
src/
├── components/renewals/
│   ├── RenewalsImportCard.tsx          (nouveau)
│   ├── RenewalsPipelineCard.tsx        (nouveau)
│   └── RenewalsBulkNotifyDialog.tsx    (nouveau)
├── components/policies/
│   └── RenewalPipelineTable.tsx        (refactor : checkbox, scope, props sélection)
├── pages/admin/
│   └── RenewalsPage.tsx                (nouveau)
├── pages/broker/
│   └── RenewalsPage.tsx                (réécriture)
├── components/admin/AdminSidebar.tsx   (ajout entrée Renouvellements)
└── App.tsx                             (ajout route /admin/renewals)
```

Hors scope :
- Logique réelle d'import Excel (placeholder UI uniquement)
- Logique réelle d'envoi de notifications (mockup uniquement)
- Modification du schéma DB
- Stats / KPIs (reste accessible via `/b2b/stats`)
