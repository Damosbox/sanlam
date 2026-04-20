import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { GuidedSalesState, ProductType } from "@/components/guided-sales/types";
import { formatFCFA } from "./formatCurrency";

/**
 * Génère un devis PDF brandé Sanlam Allianz (SACI) — Côte d'Ivoire.
 * Branding strict : couleurs Sanlam #0075C9 / Allianz #003781 / Orange #F86200.
 * Footer réglementaire CIMA.
 */

// Brand colors (RGB pour jsPDF)
const SANLAM_BLUE: [number, number, number] = [0, 117, 201]; // #0075C9
const ALLIANZ_BLUE: [number, number, number] = [0, 55, 129]; // #003781
const ORANGE: [number, number, number] = [248, 98, 0]; // #F86200
const GREY_DARK: [number, number, number] = [51, 62, 72]; // #333E48
const GREY_LIGHT: [number, number, number] = [240, 243, 247];

const productLabels: Record<ProductType, string> = {
  auto: "Assurance Automobile",
  vie: "Pack Obsèques",
};

interface PremiumBreakdown {
  primeNette: number;
  fraisAccessoires: number;
  taxes: number;
  primeTTC: number;
  fga: number;
  cedeao: number;
  total: number;
}

function drawHeader(doc: jsPDF, quoteNumber: string) {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Bandeau Allianz Blue
  doc.setFillColor(...ALLIANZ_BLUE);
  doc.rect(0, 0, pageWidth, 32, "F");

  // Bandeau Sanlam Blue (accent)
  doc.setFillColor(...SANLAM_BLUE);
  doc.rect(0, 32, pageWidth, 4, "F");

  // Logo wordmark "SANLAM ALLIANZ" (texte stylisé, le SVG embed nécessiterait raster)
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("SANLAM", 14, 16);
  doc.setTextColor(...SANLAM_BLUE);
  doc.setFillColor(255, 255, 255);
  doc.rect(46, 7, 0.5, 12, "F"); // séparateur
  doc.setTextColor(255, 255, 255);
  doc.text("ALLIANZ", 49, 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(220, 235, 255);
  doc.text("Côte d'Ivoire — Compagnie d'Assurance", 14, 24);

  // Numéro de devis (droite)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("DEVIS N°", pageWidth - 14, 14, { align: "right" });
  doc.setFontSize(11);
  doc.text(quoteNumber, pageWidth - 14, 20, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(220, 235, 255);
  doc.text(
    new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }),
    pageWidth - 14,
    26,
    { align: "right" }
  );
}

function drawFooter(doc: jsPDF) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Bande Sanlam Blue
  doc.setFillColor(...SANLAM_BLUE);
  doc.rect(0, pageHeight - 22, pageWidth, 1.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...ALLIANZ_BLUE);
  doc.text(
    "Sanlam Allianz Côte d'Ivoire (SACI)",
    14,
    pageHeight - 16
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...GREY_DARK);
  doc.text(
    "Société Anonyme au capital de 5 000 000 000 FCFA — Siège : Immeuble Sanlam Allianz, Bd Roume, Plateau, Abidjan",
    14,
    pageHeight - 12
  );
  doc.text(
    "Agréée CIMA n° SA-001 — RCCM : CI-ABJ-2003-B-1234 — Tél : (+225) 27 20 25 97 00 — contact@sanlamallianz.ci",
    14,
    pageHeight - 8
  );
  doc.text(
    "Devis non contractuel, valable 30 jours. Prime susceptible d'évolution selon les pièces justificatives.",
    14,
    pageHeight - 4
  );

  // Page number
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...SANLAM_BLUE);
  doc.text(`Page ${doc.getCurrentPageInfo().pageNumber}`, pageWidth - 14, pageHeight - 8, { align: "right" });
}

function drawSectionTitle(doc: jsPDF, y: number, title: string): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(...ALLIANZ_BLUE);
  doc.rect(14, y, 3, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...ALLIANZ_BLUE);
  doc.text(title.toUpperCase(), 20, y + 4.5);
  doc.setDrawColor(...SANLAM_BLUE);
  doc.setLineWidth(0.3);
  doc.line(20, y + 7, pageWidth - 14, y + 7);
  return y + 12;
}

export function generateQuotePdf(state: GuidedSalesState, premium: PremiumBreakdown): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const productType = state.needsAnalysis.productType;
  const quoteNumber = `Q-${Date.now().toString().slice(-8)}`;

  drawHeader(doc, quoteNumber);

  let y = 46;

  // Titre devis
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...ALLIANZ_BLUE);
  doc.text("Proposition de Devis", 14, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...GREY_DARK);
  doc.text(productLabels[productType], 14, y);
  y += 10;

  // === Section Souscripteur ===
  y = drawSectionTitle(doc, y, "Souscripteur");
  const client = state.clientIdentification;
  const clientRows: [string, string][] = [
    ["Nom complet", `${client.firstName || "—"} ${client.lastName || ""}`.trim()],
    ["Email", client.email || "—"],
    ["Téléphone", client.phone || "—"],
    ["Pièce d'identité", `${client.identityDocumentType || "—"} ${client.identityDocumentNumber || ""}`.trim()],
  ];
  autoTable(doc, {
    startY: y,
    body: clientRows,
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 1.5, textColor: GREY_DARK },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 45, textColor: ALLIANZ_BLUE },
      1: { cellWidth: "auto" },
    },
    margin: { left: 20, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // === Section Caractéristiques ===
  y = drawSectionTitle(doc, y, productType === "auto" ? "Véhicule & Garanties" : "Couverture Pack Obsèques");

  const needs = state.needsAnalysis;
  const sub = state.subscription;
  const obs = state.packObsequesData;
  const charRows: [string, string][] = [];
  if (productType === "auto") {
    charRows.push(
      ["Marque / Modèle", `${sub.vehicleBrand || needs.vehicleBrand || "—"} ${sub.vehicleModel || needs.vehicleModel || ""}`.trim()],
      ["Immatriculation", sub.vehicleRegistrationNumber || "—"],
      ["Puissance fiscale", needs.vehicleFiscalPower ? `${needs.vehicleFiscalPower} CV` : "—"],
      ["Énergie", needs.vehicleEnergy || "—"],
      ["Nombre de places", needs.vehicleSeats ? String(needs.vehicleSeats) : "—"],
      ["Bonus / Malus", needs.bonusMalus || "—"],
      ["Formule choisie", state.coverage?.planTier || "—"]
    );
  } else {
    charRows.push(
      ["Formule", obs?.formula || "—"],
      ["Type d'adhésion", obs?.adhesionType || "—"],
      ["Périodicité", obs?.periodicity || "—"],
      ["Date d'effet", obs?.effectiveDate || "—"],
    );
  }
  autoTable(doc, {
    startY: y,
    body: charRows,
    theme: "striped",
    styles: { fontSize: 9, cellPadding: 2, textColor: GREY_DARK },
    alternateRowStyles: { fillColor: GREY_LIGHT },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 55, textColor: ALLIANZ_BLUE },
      1: { cellWidth: "auto" },
    },
    margin: { left: 20, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // === Section Tarification ===
  y = drawSectionTitle(doc, y, "Détail de la Tarification");
  autoTable(doc, {
    startY: y,
    head: [["Désignation", "Montant (FCFA)"]],
    body: [
      ["Prime nette", formatFCFA(premium.primeNette)],
      ["Frais d'accessoires", formatFCFA(premium.fraisAccessoires)],
      ["Taxes (14,5%)", formatFCFA(premium.taxes)],
      [
        { content: "Prime TTC", styles: { fontStyle: "bold", textColor: ALLIANZ_BLUE } },
        { content: formatFCFA(premium.primeTTC), styles: { fontStyle: "bold", textColor: ALLIANZ_BLUE } },
      ],
      ...(productType === "auto"
        ? [
            ["FGA (Fonds de Garantie Auto)", formatFCFA(premium.fga)],
            ["Carte Brune CEDEAO", formatFCFA(premium.cedeao)],
          ]
        : []),
    ],
    theme: "grid",
    headStyles: { fillColor: ALLIANZ_BLUE, textColor: [255, 255, 255], fontSize: 10, fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { halign: "right", cellWidth: 50 },
    },
    margin: { left: 20, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 4;

  // Total à payer (encadré orange)
  doc.setFillColor(...ORANGE);
  doc.rect(20, y, pageWidth - 34, 14, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text("PRIME TOTALE À PAYER", 24, y + 9);
  doc.setFontSize(15);
  doc.text(formatFCFA(premium.total), pageWidth - 18, y + 9.5, { align: "right" });
  y += 22;

  // Mention validité
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(...GREY_DARK);
  doc.text(
    `Devis valable 30 jours à compter du ${new Date().toLocaleDateString("fr-FR")}.`,
    14,
    y
  );
  y += 4;
  doc.text(
    "Sous réserve de la fourniture des pièces justificatives et de l'acceptation par les services de souscription.",
    14,
    y
  );

  drawFooter(doc);

  doc.save(`Devis_SanlamAllianz_${quoteNumber}.pdf`);
}