

## Analyse du registre UX Tasks SAZ 2026

### Vue d'ensemble du document
52 tâches UX réparties sur 3 priorités :
- **P0 MVP (16)** — deadline 17 avril : Parcours achat, Dashboard Agent, Claims, Compliance Admin, KYC/Paiement
- **P1 Code Freeze (12)** — deadline 24 avril : Activation police, RBAC, DSAR, Audit
- **P2 LOT 2 (24)** — mai-sept : Profil 360°, Marketing, Mobile Flutter, Portail B2C

### Croisement avec l'état actuel du codebase

| Catégorie | Tâche registre | Statut codebase réel |
|---|---|---|
| **UX.1.1** Fiche produit dans flow | ✅ Partiel — `ProductCard`, `ProductSelectionStep` existent mais fiche détaillée manque |
| **UX.1.2** Badge KYC R/Y/G | ✅ Fait — traffic light dans `ClientKYCSection` + `LeadKYCSection` |
| **UX.1.3** PDF reçu devis | ⚠️ Partiel — `send-policy-documents` existe, template visuel à faire |
| **UX.2.1** Vue Leads pipeline | ✅ Fait — `LeadsDataTable`, `LeadCards`, `LeadInbox` |
| **UX.2.2** KPIs agent | ✅ Fait — `DashboardKPIs`, `KPICard`, `BrokerAnalytics` |
| **UX.2.3** Vue Commissions | ⚠️ Partiel — KPI commission dans `DashboardPage` mais pas de détail/historique filtrable |
| **UX.3.1** FNOL stepper | ✅ Fait — `ClaimNew.tsx`, `ClaimOCRUploader` |
| **UX.3.2** Table sinistres back-office | ✅ Fait — `AdminClaimsTable` |
| **UX.4.1-4.6** Compliance Admin | ✅ Fait — `ComplianceDashboardPage`, `AMLBlockedDialog`, scoring KYC |
| **UX.5.1** OCR Regula validation | ⚠️ Partiel — `ocr-identity` fonctionne, écran validation dédié manque |
| **UX.5.2** Parcours paiement | ✅ Fait (mock) — `PaymentStatusDialog`, `MobilePaymentStep`, `BindingStep` |
| **UX.5.3** Activation police | ✅ Fait — `IssuanceStep`, `SignatureEmissionStep` |
| **UX.6.1** RBAC matrix | ✅ Fait — `AdminPermissions`, `PermissionsPage` |
| **UX.6.2** DSAR | ❌ **RIEN** — pas d'interface export/anonymisation/rectification |
| **UX.6.3** Journal d'audit UI | ✅ Fait — `AdminAuditLogs`, `AuditPage` |
| **UX.7.1** Profil Client 360° onglets | ✅ Fait — `ClientDetailSheet` avec tabs |
| **UX.7.2** Scoring V2 | ✅ Fait — `ClientValueScore`, `ScoreDetailPopover` |
| **UX.7.3-7.4** Claims V2 kanban + SLA | ❌ **RIEN** — pas de kanban, pas de dashboard SLA CIMA |
| **UX.8.1-8.2** Cross-selling + Sales Support | ✅ Fait — `UpsellSidebar`, cross-sell dans `PaymentStatusDialog`, FAQs tab |
| **UX.8.3-8.4** Marketing campagnes | ❌ **Placeholder** — `CampaignsPage` est vide ("en cours de développement") |
| **UX.9.1** BI Dashboard (funnel, NPS) | ⚠️ Partiel — `AdminAnalytics`, `AdminNPSByProduct` existent, funnel manque |
| **UX.9.2** DSAR avancée | ❌ **RIEN** |
| **UX.10.1** Data Observatory | ❌ **RIEN** |
| **UX.10.2** SME Club | ❌ **RIEN** |
| **UX.10.3** Lead Gen V2 landing | ❌ **RIEN** |
| **UX.10.4** Cross-sell V2 IA NBO/NBA | ⚠️ Partiel — `AIRecommendations` dans dashboard broker existe, pas temps réel |
| **UX.10.5** Competitive Analysis | ✅ Fait — `CompetitiveAnalyzer`, `ClientValueNote` |
| **UX.10.6** LMS formations | ⚠️ Placeholder — page `Formation.tsx` existe |
| **UX.M1-M8** Mobile Flutter | ❌ **Hors scope Lovable** — React web uniquement |
| **UX.C1-C8** Portail Client B2C | ❌ **Plateforme repositionnée B2B only** (mémoire `partner-exclusive-platform-ui-redesign`) |

### Synthèse — Ce qui reste à faire côté web Lovable

**Gaps réels implémentables (triés par priorité) :**

1. **P0/P1 — DSAR (UX.6.2)** : Interface admin export données client (JSON/CSV), anonymisation, rectification — conformité Loi CI 2013-450
2. **P0 — Commissions détaillées (UX.2.3)** : Page dédiée avec solde courant, détail par police, historique filtrable, export
3. **P0 — Fiche produit enrichie dans parcours (UX.1.1)** : Sheet/modal d'info produit accessible depuis `ProductSelectionStep` avec garanties, exclusions, FAQ
4. **P0 — Template visuel PDF devis (UX.1.3)** : Amélioration `send-policy-documents` avec template SACI (logo, couleurs, mise en page)
5. **P0 — Écran validation OCR Regula (UX.5.1)** : Dialog post-OCR avec preview document + champs extraits éditables + indicateur authenticité
6. **P1 — Claims V2 (UX.7.3-7.4)** : Kanban assignation sinistres + Dashboard SLA avec alertes CIMA >48h
7. **P1 — Module Marketing (UX.8.3-8.4)** : Création campagne multi-canal + dashboard performance
8. **P2 — BI Funnel (UX.9.1)** : Graphiques funnel vente + cycle sinistre
9. **P2 — Data Observatory (UX.10.1)** : Vue qualité données (doublons, champs manquants, golden record)
10. **P2 — SME Club (UX.10.2)** : Segments PME + avantages + tarifs négociés
11. **P2 — LMS (UX.10.6)** : Catalogue formations + quiz + certificat
12. **P2 — Cross-sell V2 NBO/NBA (UX.10.4)** : Bandeau recommandation IA temps réel dashboard agent
13. **P2 — Lead Gen V2 (UX.10.3)** : Landing pages configurables + formulaires publics

**Hors scope Lovable (à documenter auprès de l'équipe) :**
- UX.M1-M8 (8 tâches Mobile Flutter) — Lovable fait du React web uniquement
- UX.C1-C8 (8 tâches Portail Client B2C) — plateforme volontairement repositionnée B2B only (décision mémoire projet)

### Stratégie d'implémentation recommandée

**Sprint 1 — MVP Compliance & Commercial (1-2j)**
- DSAR Admin Interface (export/anonymisation/rectification)
- Page Commissions détaillée broker
- Fiche produit enrichie (drawer depuis ProductSelectionStep)

**Sprint 2 — Documents & OCR (1j)**
- Template visuel PDF (HTML éditeur déjà en place → créer template "Devis SACI")
- Écran validation OCR Regula (Dialog dédié)

**Sprint 3 — Claims V2 (1-2j)**
- Kanban sinistres (`AdminClaimsKanban`)
- Dashboard SLA CIMA avec alertes

**Sprint 4 — Marketing (1-2j)**
- Module création campagne multi-canal
- Dashboard performance campagnes

**Sprint 5 — LOT 2 Analytics & IA (2-3j)**
- BI Funnel + NPS avancé
- Data Observatory
- Cross-sell NBO/NBA temps réel
- SME Club, LMS, Lead Gen landing

### Questions avant de démarrer

1. **Priorité** : commence-t-on par le **Sprint 1 (DSAR + Commissions + Fiche produit)** comme bloc MVP P0, ou tu préfères attaquer une feature précise ?
2. **Mobile & Portail B2C** : je confirme auprès de ton équipe que ces 16 tâches sont hors scope Lovable (Flutter) et décision produit (B2B only) ?
3. **Découpage** : chaque Sprint = un plan dédié séparé pour garder les livraisons atomiques et testables ?

<lov-actions>
<lov-suggestion message="Démarre le Sprint 1 : DSAR Admin + page Commissions détaillée + Fiche produit enrichie">Démarrer Sprint 1 MVP</lov-suggestion>
<lov-suggestion message="Attaque en priorité la DSAR Admin (export données client, anonymisation, rectification) conformité Loi CI 2013-450">DSAR en priorité</lov-suggestion>
<lov-suggestion message="Implémente le module Claims V2 : kanban assignation sinistres + dashboard SLA CIMA avec alertes >48h">Claims V2 Kanban + SLA</lov-suggestion>
<lov-suggestion message="Crée le module Marketing complet : création campagne multi-canal Email/SMS/WhatsApp + dashboard performance">Module Marketing</lov-suggestion>
<lov-suggestion message="Ajoute un template 'Devis SACI' par défaut dans l'éditeur HTML de documents avec logo et couleurs de marque">Template PDF Devis SACI</lov-suggestion>
</lov-actions>
