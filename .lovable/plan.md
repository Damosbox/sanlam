

## Émission de police : supprimer NPS, garder cross-sell + documents

### Modifications sur `IssuanceStep.tsx`

1. **Supprimer toute la section NPS** : états `npsScore`, `npsComment`, `npsSubmitted`, fonctions `handleNpsSelect`, `handleSubmitNps`, et le bloc JSX NPS (lignes 186-246).
2. **Supprimer les imports inutilisés** : `Textarea`, `cn`, `Separator`.
3. **Garder tel quel** : la bannière de succès, le numéro de police, les documents téléchargeables/renvoyables, le modal UpsellModal (cross-sell), le badge upsell accepté, et les boutons d'action en bas.
4. **Ajuster le déclenchement du modal upsell** : ne plus conditionner sur `upsellDismissed` puisque le NPS n'existe plus — le modal s'affiche toujours après 1.5s comme avant, comportement inchangé.

### Résultat

La page d'émission affiche : confirmation + n° de police → documents téléchargeables → cross-sell modal automatique → actions (partager, espace docs, nouveau devis). Plus d'enquête de satisfaction.

