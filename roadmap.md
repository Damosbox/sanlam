# Roadmap — Espace Zô PME

## Terminé
- [x] Couche de données mock (`src/data/zoPme/`) : PME, cartes (10 statuts), partenaires, avantages, dossiers, marketing, direction, rôles
- [x] Provider mock + états (loading / erreur / vide / permission) + journal d'activité
- [x] Composants partagés : badges paliers, KPI, confirmations avec motif, notes de périmètre
- [x] Vues : Direction, Marketing/Animation, Souscription, Membres, Cartes, Partenaires, Avantages, Rapports, Administration des droits
- [x] Sidebar Zô PME filtrée par rôle + `ViewSwitcher` réservé à Admin Zô PME
- [x] Page/route unique `/b2b/zo-pme?vue=…` avec garde d'accès direct par URL
- [x] Compilation TypeScript et build vérifiés
- [x] Lot 2 — Membres : « Nouvelle PME » (Admin/Commercial), matricule `ZoPME-AAMM-######`, contact responsable, palier ajustable manuellement avec motif, périmètre commercial filtré
- [x] Lot 2 — Cartes : « Émettre une carte » depuis la fiche PME, motif/version, état digital, impression/remise, preuve de démonstration, courrier de bienvenue
- [x] Lot 2 — Avantages : création / édition / retrait avec confirmation obligatoire et multi-partenaires
- [x] Lot 2 — Partenaires : création / édition (accord, ciblage, KPI, risque, plan B), renouvellement de convention avec historique
- [x] Lot 2 — Campagnes : « Nouvelle campagne » réservée Marketing/Admin, ajout réel et journalisation
- [x] Lot 2 — Droits alignés sur le cadrage + encart « Référentiel produit à valider » (17 vs 7) dans Administration

## Dépendances back-end restées ouvertes (non simulées comme finalisées)
- Segmentation RFM (table d'activations/transactions à créer)
- Score de fidélité réel (aujourd'hui mock)
- Production physique et logistique des cartes
- Envoi réel WhatsApp / e-mail des campagnes
- Exports PDF / Excel officiels (seul le CSV local est fourni)
- Contrôle automatisé des pièces et signature électronique
- Persistance des rôles Zô PME et RLS
- Contrats/conventions partenaires (signature, facturation des contreparties)
- Import en masse de partenaires et notifications partenaires
- Archivage documentaire (GED) des preuves d'envoi/remise de carte
- Référentiel produit à arbitrer : 17 produits au cadrage vs 7 au fichier produit — bloque production et commissions
