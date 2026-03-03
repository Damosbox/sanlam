

## Afficher les infos client de la modale dans les cotations en brouillon

### Problème

Quand un brouillon est sauvegardé via la modale "Enregistrer et quitter", les infos client (nom, prénom, email) sont bien stockées dans `coverage_details.clientInfo` et `draft_state.clientIdentification`. Mais le `PendingQuotationsTable` affiche le nom du prospect uniquement depuis la jointure `leads`. Si aucun `lead_id` n'est lié (cas fréquent pour un nouveau devis), la table affiche **"Prospect inconnu"**.

### Solution

Modifier `PendingQuotationsTable.tsx` pour utiliser les infos client stockées dans `coverage_details` comme fallback quand il n'y a pas de lead lié.

### Modifications

**`src/components/policies/PendingQuotationsTable.tsx`**

1. **Ajouter `coverage_details` à l'interface `Quotation`** :
   ```typescript
   coverage_details?: {
     clientInfo?: { firstName?: string; lastName?: string; email?: string };
   } | null;
   ```

2. **Modifier l'affichage du nom du prospect** (lignes 336-344) : au lieu de "Prospect inconnu", utiliser `coverage_details.clientInfo` en fallback :
   ```typescript
   const clientName = quotation.leads 
     ? `${quotation.leads.first_name} ${quotation.leads.last_name}`
     : quotation.coverage_details?.clientInfo?.lastName
       ? `${quotation.coverage_details.clientInfo.firstName || ""} ${quotation.coverage_details.clientInfo.lastName}`
       : "Prospect inconnu";
   
   const clientContact = quotation.leads?.email 
     || quotation.leads?.phone 
     || quotation.coverage_details?.clientInfo?.email 
     || "N/A";
   ```

3. **Mettre à jour le filtre de recherche** (lignes 134-143) : inclure les infos client de `coverage_details` dans la recherche :
   ```typescript
   const cdClient = q.coverage_details?.clientInfo;
   const fullName = q.leads 
     ? `${q.leads.first_name} ${q.leads.last_name}`.toLowerCase()
     : `${cdClient?.firstName || ""} ${cdClient?.lastName || ""}`.toLowerCase();
   ```

### Résultat

Les brouillons afficheront le nom et l'email saisis dans la modale au lieu de "Prospect inconnu".

