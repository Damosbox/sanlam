# Plan d'avancement — SAZ 2026 (LOT 1 MVP)

_Dernière mise à jour : 24 avril 2026_

## ✅ LOT 1 — MVP (Go-Live 3 mai) — Tâches livrées jusqu'au 24 avril

### Parcours achat (P0 — 17 avril)
| ID | Tâche | Route / Composant | Statut |
|---|---|---|---|
| UX.1.1 | Page infos produit dans flow cotation | `/b2b/sales` → `ProductInfoSheet` | ✅ |
| UX.1.2 | Badge scoring KYC R/Y/G (admin) | `/admin/ocr-validation` → `OCRAuthenticityBadge` | ✅ |
| UX.1.3 | PDF reçu devis branding SACI | `QuoteSummaryCard` → `quotePdfGenerator.ts` | ✅ |

### Dashboard Agent (P0 — 17 avril)
| ID | Tâche | Route / Composant | Statut |
|---|---|---|---|
| UX.2.1 | Vue Leads + pipeline | `/b2b/dashboard` → `LeadsPipeline` | ✅ |
| UX.2.2 | Vue KPIs agent | `/b2b/dashboard` → `DashboardKPIs` | ✅ |
| UX.2.3 | Vue Commissions | `/b2b/commissions` → `CommissionsPage` | ✅ |

### Claims FNOL (P0 — 17 avril)
| ID | Tâche | Route / Composant | Statut |
|---|---|---|---|
| UX.3.1 | Stepper déclaration sinistre | `/b2b/claims/new` → `ClaimNewPage` | ✅ |
| UX.3.2 | Table sinistres back-office | `/admin/claims` → `AdminClaimsTable` | ✅ |

### Compliance Admin (P0 — 17 avril)
| ID | Tâche | Route / Composant | Statut |
|---|---|---|---|
| UX.4.1 | Dashboard Compliance (badges R/Y/G) | `/admin/compliance` → `ComplianceDashboardPage` | ✅ |
| UX.4.2 | Filtres dropdowns + badges | `ComplianceDashboardPage` | ✅ |
| UX.4.3 | Pagination + headers triables | composant `Table` réutilisable | ✅ |
| UX.4.4 | Fiche client compliance 2 colonnes | `ClientKYCSection` / `ClientDetailSheet` | ✅ |
| UX.4.5 | Modal approbation/blocage transaction | `AMLBlockedDialog` | ✅ |
| UX.4.6 | Détail scoring badge admin | `OCRDetailDrawer` + `OCRAuthenticityBadge` | ✅ |

### KYC OCR & Paiement (P0 — 17 avril)
| ID | Tâche | Route / Composant | Statut |
|---|---|---|---|
| UX.5.1 | Résultat OCR Regula validation | `/admin/ocr-validation` + `OCRDetailDrawer` | ✅ |
| UX.5.2 | Parcours paiement Wave/SycaPay | `MobilePaymentStep` + `PaymentStatusDialog` | ✅ |

### Activation & RBAC (P1 — 24 avril)
| ID | Tâche | Route / Composant | Statut |
|---|---|---|---|
| UX.5.3 | Confirmation activation police + PDF | `IssuanceStep` + edge fn `send-policy-documents` | ✅ |
| UX.6.1 | Matrix rôles & permissions | `/admin/permissions` → `AdminPermissions` | ✅ |
| UX.6.2 | DSAR (export/anonymisation/rectif.) | `/admin/dsar` → `DsarPage` | ✅ |
| UX.6.3 | Journal d'audit Admin UI | `/admin/audit` → `AdminAuditLogs` | ✅ |

**Score : 20/20 tâches MVP P0+P1 livrées** ✅

---

## 🛡️ Module Validation OCR Conformité — détail technique

### Contexte
- **Pas de changement côté agent B2B** : OCR KYC reste transparent (`LeadKYCSection`, `ClientKYCSection`).
- **Feature Admin Conformité** : tableau de bord scans OCR avec authenticité + score de confiance.

### Implémenté
- **Table `ocr_scan_results`** (entity_type, document_type, extracted_data, confidence_score, authenticity_status, authenticity_details, agent_id, review_status…) avec RLS admin/compliance/backoffice_conformite.
- **Edge Functions enrichies** : `ocr-identity` et `ocr-vehicle-registration` retournent un score d'authenticité IA (Gemini — cohérence MRZ, qualité, anomalies) et persistent dans `ocr_scan_results`.
- **Page `/admin/ocr-validation`** (`OCRValidationPage.tsx`) : KPIs + filtres + tableau + drawer détail (image, champs extraits, badge authenticité, actions valider/rejeter).
- **Composants** : `OCRScansTable`, `OCRDetailDrawer`, `OCRAuthenticityBadge`.
- **Sidebar Admin** : entrée "Validation OCR" sous Conformité.

---

## 📋 Prochaines étapes — LOT 2 Phase 1

À démarrer après validation visuelle finale du branding SACI sur PDF devis (UX.1.3) :

1. **Profil Client 360°** — onglets Contrats / Sinistres / Paiements / Documents
2. **Claims V2** — Kanban d'assignation + dashboard SLA CIMA (>48h)
3. **Module Marketing** — campagnes multi-canal + dashboard performance
4. **Portail Client B2C** (UX.C5–C8) — souscription autonome, avenant, FNOL B2C, messagerie sécurisée
