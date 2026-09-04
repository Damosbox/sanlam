# Compléter l'Espace Zô PME (B2B)

L'espace existe déjà : sélecteur d'espace, sidebar dédiée, 6 vues mockées dans un seul fichier de 1568 lignes. Ce lot le complète sans créer de navigation parallèle et sans toucher aux espaces Courtier/Admin.

## Principes

- Une seule entrée d'espace (SpaceSwitcher), une sidebar Zô PME, navigation par `?vue=`.
- Trois vues métier internes : Direction (lecture seule), Marketing / Animation, Souscription. Le sélecteur « Changer de vue » n'apparaît que pour Admin Zô PME.
- Membres = PME (matricule, contacts rattachés dont le directeur, cycle de vie, fidélité). Jamais une personne.
- Fidélité (score /100 + palier Bronze/Argent/Or/Platine + avantages) et RFM (segmentation analytique) restent deux blocs distincts, jamais fusionnés.
- Tout reste mock, cohérent et interactif. Aucune migration, aucun appel réseau, aucune dépendance ajoutée.

## Découpage des fichiers

Le fichier unique devient un dossier de modules, pour rester lisible.

À créer :
- `src/data/zoPme/` : `members.ts` (PME + contacts), `cards.ts` (10 statuts + SLA), `partners.ts` (partenaires, conventions), `benefits.ts` (avantages, règles d'éligibilité), `subscriptions.ts` (dossiers, checklist, journal de décision), `marketing.ts` (campagnes, événements, WhatsApp), `direction.ts` (KPIs, tendances, alertes, rapports), `roles.ts` (matrice de droits), `types.ts`.
- `src/components/zo-pme/views/` : `DirectionView.tsx`, `MarketingView.tsx`, `SouscriptionView.tsx`, `MembresView.tsx`, `CartesView.tsx`, `PartenairesView.tsx`, `AvantagesView.tsx`, `RapportsView.tsx`, `AdministrationView.tsx`.
- `src/components/zo-pme/shared/` : `ZoPmeHeader.tsx` (titre, sous-titre, période, exports), `KpiCard.tsx`, `TierBadge.tsx`, `SlaBadge.tsx`, `SeverityBadge.tsx`, `EmptyState.tsx`, `LoadingState.tsx`, `ErrorState.tsx`, `ConfirmActionDialog.tsx`.
- `src/components/zo-pme/ViewSwitcher.tsx` (sélecteur « Changer de vue », Admin Zô PME uniquement).
- `src/components/zo-pme/MemberSheet.tsx`, `CardSheet.tsx`, `PartnerSheet.tsx`, `SubscriptionFileSheet.tsx`.
- `src/hooks/useZoPmeRole.ts` (rôle Zô PME mock + helpers `canSee` / `canAct`), `src/hooks/useZoPmeMockQuery.ts` (simule chargement / erreur / vide pour éprouver les états).

À modifier :
- `src/pages/broker/ZoPmePage.tsx` : devient un routeur de vues léger (lecture de `?vue=`, garde de périmètre, rendu de la vue).
- `src/components/zo-pme/ZoPmeSidebar.tsx` : groupes Pilotage / Gestion du programme (Membres, Cartes) / Écosystème (Partenaires, Avantages, Animation) / Souscription / Rapports / Administration, filtrés par droits.
- `src/layouts/ZoPmeLayout.tsx` : point d'insertion du `ViewSwitcher` et des états d'erreur globaux.

Interdit : `src/integrations/supabase/types.ts`, tokens globaux, autres pages.

## Modèles mock (schéma)

- PME : `id`, `matricule`, `raisonSociale`, `secteur`, `ville`, `effectif`, `cycleVie` (prospect, adhesion_en_cours, actif, suspendu, resilie), `fidelite {score, palier, pointsPeriode}`, `rfm {recence, frequence, montant, segment}` marqué « dépend des activations », `contacts[]` (`nom`, `role` dont `directeur`, `email`, `telephone`, `principal`), `cartes[]`, `derniereActivite`.
- Carte : `reference`, `pmeId`, `porteur`, `statut` sur 10 valeurs (demandee, a_produire, en_production, produite, a_envoyer, expediee, a_remettre, remise, activee, bloquee), `slaCible`, `slaRestant`, `priorite`, `historique[]`.
- Partenaire : `nom`, `categorie`, `statut`, `convention {debut, fin, taux, statut}`, `avantagesActifs`, `sla`.
- Avantage : `libelle`, `partenaire`, `categorie`, `valeur`, `paliersEligibles[]`, `regles[]`, `publication` (brouillon, publie, suspendu), `usages`.
- Dossier souscription : `reference`, `pmeId`, `etape` (a_controler, conforme, active), `checklist[]` (`libelle`, `statut`, `obligatoire`), `journal[]` (`date`, `acteur`, `action`, `motif`), `montant`.
- Marketing : campagne (canal WhatsApp/SMS/email, cible par palier, statut, envoyés/lus/clics), événement (date, ville, inscrits, capacité).
- Rôle : `direction | marketing | souscription | commercial | admin_zo_pme` → vues visibles + actions autorisées.

## Ordre d'implémentation

1. Socle : `types.ts`, jeux de données mock, composants partagés, `useZoPmeRole`, découpage du fichier existant en vues (comportement inchangé).
2. Navigation : sidebar par groupes, `ViewSwitcher` restreint à Admin Zô PME, garde de périmètre sur `?vue=` avec redirection vers la première vue autorisée.
3. Cockpit Direction : KPIs + tendances, distribution des 4 paliers, Top 5 partenaires / avantages, alertes (SLA, conventions à renouveler, inactivité, anomalies) avec sévérité, bloc rapports/export en lecture seule (toast de démonstration).
4. Cockpit Marketing : Kanban cartes par statut avec priorités et SLA, catalogue avantages/partenaires filtrable, campagnes et événements, communication WhatsApp en état de démonstration.
5. Cockpit Souscription : table des dossiers en trois étapes, checklist conformité, actions Valider / Demander un complément avec confirmation et motif, journal de décision, historique mensuel des contrats.
6. Gestion opérationnelle : liste PME + fiche PME/contacts, cycle des cartes sur 10 statuts avec alertes SLA, fiche partenaire/convention, catalogue d'avantages et règles d'éligibilité.
7. Administration : matrice de droits en lecture, application effective côté sidebar, vues et actions.
8. Finitions transverses : états vides / chargement / erreur, listes longues paginées 25 lignes via le hook de pagination existant, confirmations, filtres persistés dans l'URL, focus visible et navigation clavier, vérification de compilation.

## Ce qui reste une dépendance métier / back-end

À afficher explicitement comme non finalisé, jamais simulé comme opérationnel :
- Segmentation RFM : nécessite la table d'activations/transactions. Bloc présent, valeurs marquées indicatives.
- Score de fidélité réel et calcul des paliers : dépend du moteur de scoring back-end.
- Production physique et logistique des cartes (imprimeur, transporteur, dates réelles de SLA).
- Envoi WhatsApp / SMS / email : aucune API branchée, boutons en démonstration.
- Exports PDF / Excel réels : toast de démonstration.
- Contrôles de conformité automatisés, pièces justificatives et signature.
- Rôles et droits Zô PME côté base (rôle mock ici ; à porter sur `user_roles` + RLS plus tard).
- Conventions partenaires (contrats, taux, facturation).
