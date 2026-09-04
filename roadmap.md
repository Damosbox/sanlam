# Roadmap — Espace Zô PME

## Terminé
- [x] Couche de données mock (`src/data/zoPme/`) : PME, cartes (10 statuts), partenaires, avantages, dossiers, marketing, direction, rôles
- [x] Provider mock + états (loading / erreur / vide / permission) + journal d'activité
- [x] Composants partagés : badges paliers, KPI, confirmations avec motif, notes de périmètre
- [x] Vues : Direction, Marketing/Animation, Souscription, Membres, Cartes, Partenaires, Avantages, Rapports, Administration des droits
- [x] Sidebar Zô PME filtrée par rôle + `ViewSwitcher` réservé à Admin Zô PME
- [x] Page/route unique `/b2b/zo-pme?vue=…` avec garde d'accès direct par URL
- [x] Compilation TypeScript et build vérifiés

## Dépendances back-end restées ouvertes (non simulées comme finalisées)
- Segmentation RFM (table d'activations/transactions à créer)
- Score de fidélité réel (aujourd'hui mock)
- Production physique et logistique des cartes
- Envoi réel WhatsApp / e-mail des campagnes
- Exports PDF / Excel officiels (seul le CSV local est fourni)
- Contrôle automatisé des pièces et signature électronique
- Persistance des rôles Zô PME et RLS
- Contrats/conventions partenaires
