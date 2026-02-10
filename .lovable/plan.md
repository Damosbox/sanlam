

# Supprimer le scoring pour les prospects

## Contexte

Le score valeur client (etoiles + note /100) est affiche pour tous les enregistrements du portefeuille, y compris les prospects. Pour les prospects, ce score est base sur des donnees aleatoires simulees (ligne 48 : `Math.random()`) et n'a aucune valeur metier reelle. Il sera conserve uniquement pour les clients.

## Modifications

**Fichier** : `src/components/portfolio/PortfolioDataTable.tsx`

1. **Colonne Score (ligne 176-202)** : Conditionner l'affichage du `ScoreDetailPopover` au type `client`. Pour les prospects, afficher un tiret "—" comme pour les autres colonnes non-applicables (Contrats, Sinistres).

2. **Calcul mock (lignes 46-49)** : Supprimer le bloc prospect dans `calculateMockScore` puisqu'il ne sera plus utilise pour les prospects.

**Fichier** : `src/components/portfolio/ScoreDetailPopover.tsx`

3. Aucune modification necessaire - le composant ne sera simplement plus appele pour les prospects.

## Detail technique

Dans la cellule Score (ligne 176), remplacer le rendu actuel par :

```text
Si item.type === "client" :
  -> Afficher ScoreDetailPopover (etoiles + score)
Si item.type === "prospect" :
  -> Afficher "—" en texte muted (coherent avec Contrats et Sinistres)
```

## Impact

- Les prospects n'affichent plus de score fictif
- Les clients conservent leur scoring complet avec le popover radar
- Aucun changement sur les autres colonnes ou fonctionnalites

