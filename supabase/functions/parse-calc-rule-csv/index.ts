import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ParsedResult {
  name?: string;
  description?: string;
  type?: string;
  usage_category?: string;
  usage_category_label?: string;
  base_formula?: string;
  parameters?: any[];
  formulas?: any[];
  taxes?: any[];
  fees?: any[];
  tables_ref?: any[];
  charges?: any[];
  packages?: any[];
  options?: any[];
}

function parseSectionFormat(csvContent: string): { data: ParsedResult; warnings: string[] } | null {
  const lines = csvContent.split(/\r?\n/);
  const sectionRegex = /^\[([A-Z_]+)\]$/;

  // Check if file uses section format
  const hasSections = lines.some((l) => sectionRegex.test(l.trim()));
  if (!hasSections) return null;

  const result: ParsedResult = {};
  const warnings: string[] = [];
  let currentSection = "";
  let sectionLines: string[] = [];
  let headerRow: string[] = [];

  const flushSection = () => {
    if (!currentSection || sectionLines.length === 0) return;

    switch (currentSection) {
      case "GENERAL": {
        for (const line of sectionLines) {
          const parts = line.split(";").map((s) => s.trim());
          if (parts.length >= 2) {
            const key = parts[0].toLowerCase();
            const val = parts[1];
            if (key === "name") result.name = val;
            else if (key === "description") result.description = val;
            else if (key === "type") result.type = val;
            else if (key === "usage_category") result.usage_category = val;
            else if (key === "usage_category_label") result.usage_category_label = val;
            else if (key === "base_formula") result.base_formula = val;
          }
        }
        break;
      }
      case "PARAMETERS": {
        headerRow = sectionLines[0]?.split(";").map((s) => s.trim().toLowerCase()) || [];
        result.parameters = [];
        for (let i = 1; i < sectionLines.length; i++) {
          const cols = sectionLines[i].split(";").map((s) => s.trim());
          if (cols.length < 2) continue;
          const param: any = { id: crypto.randomUUID(), source: "manual" };
          headerRow.forEach((h, idx) => {
            if (h === "code") param.code = cols[idx] || "";
            else if (h === "label") param.label = cols[idx] || "";
            else if (h === "type") param.type = cols[idx] || "text";
            else if (h === "required") param.required = cols[idx]?.toLowerCase() === "true";
            else if (h === "category") param.category = cols[idx] || "";
            else if (h === "value") param.value = cols[idx] || "";
            else if (h === "options") param.options = cols[idx] ? cols[idx].split("|") : undefined;
          });
          if (param.code) result.parameters.push(param);
        }
        break;
      }
      case "FORMULAS": {
        headerRow = sectionLines[0]?.split(";").map((s) => s.trim().toLowerCase()) || [];
        result.formulas = [];
        for (let i = 1; i < sectionLines.length; i++) {
          const cols = sectionLines[i].split(";").map((s) => s.trim());
          if (cols.length < 2) continue;
          const formula: any = { id: crypto.randomUUID(), guarantees: [] };
          headerRow.forEach((h, idx) => {
            if (h === "code") formula.code = cols[idx] || "";
            else if (h === "name") formula.name = cols[idx] || "";
            else if (h === "formula") formula.formula = cols[idx] || "";
          });
          if (formula.code) result.formulas.push(formula);
        }
        break;
      }
      case "TAXES": {
        headerRow = sectionLines[0]?.split(";").map((s) => s.trim().toLowerCase()) || [];
        result.taxes = [];
        for (let i = 1; i < sectionLines.length; i++) {
          const cols = sectionLines[i].split(";").map((s) => s.trim());
          if (cols.length < 2) continue;
          const tax: any = { id: crypto.randomUUID() };
          headerRow.forEach((h, idx) => {
            if (h === "code") tax.code = cols[idx] || "";
            else if (h === "name") tax.name = cols[idx] || "";
            else if (h === "rate") tax.rate = parseFloat(cols[idx]) || 0;
            else if (h === "isactive" || h === "is_active") tax.isActive = cols[idx]?.toLowerCase() !== "false";
          });
          if (tax.code) result.taxes.push(tax);
        }
        break;
      }
      case "FEES": {
        headerRow = sectionLines[0]?.split(";").map((s) => s.trim().toLowerCase()) || [];
        result.fees = [];
        for (let i = 1; i < sectionLines.length; i++) {
          const cols = sectionLines[i].split(";").map((s) => s.trim());
          if (cols.length < 2) continue;
          const fee: any = { id: crypto.randomUUID() };
          headerRow.forEach((h, idx) => {
            if (h === "code") fee.code = cols[idx] || "";
            else if (h === "name") fee.name = cols[idx] || "";
            else if (h === "amount") fee.amount = parseFloat(cols[idx]) || 0;
            else if (h === "condition") fee.condition = cols[idx] || "";
          });
          if (fee.code) result.fees.push(fee);
        }
        break;
      }
      case "TABLES": {
        // First line is the table header (code;name;type), then data rows
        const firstLine = sectionLines[0]?.split(";").map((s) => s.trim().toLowerCase()) || [];
        const isHeader = firstLine.includes("code") && firstLine.includes("name");

        if (isHeader) {
          result.tables_ref = result.tables_ref || [];
          let currentTable: any = null;

          for (let i = 1; i < sectionLines.length; i++) {
            const cols = sectionLines[i].split(";").map((s) => s.trim());
            // If line has 3+ cols and third is a type keyword, it's a new table definition
            if (cols.length >= 3 && (cols[2] === "key_value" || cols[2] === "brackets")) {
              if (currentTable) result.tables_ref.push(currentTable);
              currentTable = {
                id: crypto.randomUUID(),
                code: cols[0],
                name: cols[1],
                type: cols[2],
                data: cols[2] === "key_value" ? {} : [],
              };
            } else if (currentTable) {
              // Data row for current table
              if (currentTable.type === "key_value" && cols.length >= 2) {
                (currentTable.data as Record<string, number>)[cols[0]] = parseFloat(cols[1]) || 0;
              } else if (currentTable.type === "brackets" && cols.length >= 3) {
                (currentTable.data as any[]).push({
                  min: parseFloat(cols[0]) || 0,
                  max: parseFloat(cols[1]) || 0,
                  value: parseFloat(cols[2]) || 0,
                });
              }
            }
          }
          if (currentTable) result.tables_ref.push(currentTable);
        }
        break;
      }
      case "CHARGES": {
        headerRow = sectionLines[0]?.split(";").map((s) => s.trim().toLowerCase()) || [];
        result.charges = [];
        for (let i = 1; i < sectionLines.length; i++) {
          const cols = sectionLines[i].split(";").map((s) => s.trim());
          if (cols.length < 2) continue;
          const charge: any = { id: crypto.randomUUID(), displayOrder: i - 1 };
          headerRow.forEach((h, idx) => {
            if (h === "code") charge.code = cols[idx] || "";
            else if (h === "name") charge.name = cols[idx] || "";
            else if (h === "value") charge.value = cols[idx] || "";
            else if (h === "category") charge.category = cols[idx] || "CHARGEMENT";
            else if (h === "description") charge.description = cols[idx] || "";
          });
          if (charge.code) result.charges.push(charge);
        }
        break;
      }
      case "PACKAGES": {
        headerRow = sectionLines[0]?.split(";").map((s) => s.trim().toLowerCase()) || [];
        result.packages = [];
        for (let i = 1; i < sectionLines.length; i++) {
          const cols = sectionLines[i].split(";").map((s) => s.trim());
          if (cols.length < 2) continue;
          const pkg: any = { id: crypto.randomUUID(), displayOrder: i - 1, isActive: true };
          headerRow.forEach((h, idx) => {
            if (h === "code") pkg.code = cols[idx] || "";
            else if (h === "name") pkg.name = cols[idx] || "";
            else if (h === "description") pkg.description = cols[idx] || "";
            else if (h === "configuration") pkg.configuration = cols[idx] || "";
          });
          if (pkg.code) result.packages.push(pkg);
        }
        break;
      }
      case "OPTIONS": {
        headerRow = sectionLines[0]?.split(";").map((s) => s.trim().toLowerCase()) || [];
        result.options = [];
        for (let i = 1; i < sectionLines.length; i++) {
          const cols = sectionLines[i].split(";").map((s) => s.trim());
          if (cols.length < 2) continue;
          const opt: any = { id: crypto.randomUUID(), displayOrder: i - 1, isActive: true };
          headerRow.forEach((h, idx) => {
            if (h === "code") opt.code = cols[idx] || "";
            else if (h === "name") opt.name = cols[idx] || "";
            else if (h === "description") opt.description = cols[idx] || "";
            else if (h === "parameters") opt.parameters = cols[idx] || "";
          });
          if (opt.code) result.options.push(opt);
        }
        break;
      }
      default:
        warnings.push(`Section [${currentSection}] ignorée (format inconnu)`);
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    const match = line.match(sectionRegex);
    if (match) {
      flushSection();
      currentSection = match[1];
      sectionLines = [];
    } else {
      sectionLines.push(line);
    }
  }
  flushSection();

  return { data: result, warnings };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { csvContent } = await req.json();
    if (!csvContent || typeof csvContent !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "csvContent requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try deterministic section parser first
    const deterministicResult = parseSectionFormat(csvContent);
    if (deterministicResult) {
      return new Response(
        JSON.stringify({
          success: true,
          data: deterministicResult.data,
          warnings: deterministicResult.warnings,
          method: "deterministic",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fallback: AI parsing for unstructured CSV
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "AI non disponible" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const schemaDescription = `{
  "name": "string - nom de la règle",
  "description": "string - description",
  "type": "string - 'vie' ou 'non-vie'",
  "usage_category": "string - code catégorie ex: 401",
  "usage_category_label": "string - libellé catégorie",
  "base_formula": "string - formule de base",
  "parameters": [{ "code": "string", "label": "string", "type": "text|number|select|date|boolean", "required": true/false, "category": "string", "value": "string", "options": ["string"] }],
  "formulas": [{ "code": "string", "name": "string", "formula": "string", "guarantees": [] }],
  "taxes": [{ "code": "string", "name": "string", "rate": number, "isActive": true/false }],
  "fees": [{ "code": "string", "name": "string", "amount": number, "condition": "string" }],
  "tables_ref": [{ "code": "string", "name": "string", "type": "key_value|brackets", "data": {} }],
  "charges": [{ "code": "string", "name": "string", "value": "string", "category": "string", "description": "string" }],
  "packages": [{ "code": "string", "name": "string", "description": "string", "configuration": "string" }],
  "options": [{ "code": "string", "name": "string", "description": "string", "parameters": "string" }]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        messages: [
          {
            role: "system",
            content: `Tu es un expert actuariel. Analyse le contenu CSV fourni et retourne un JSON structuré.

SCHÉMA DE SORTIE ATTENDU:
${schemaDescription}

RÈGLES CRITIQUES:
- Chaque élément DOIT avoir TOUS ses champs remplis (code, name/label, type, etc.)
- Génère un UUID v4 pour chaque id
- Si tu ne trouves pas de données pour une section, retourne un tableau vide []
- Les taux de taxes sont en pourcentage (nombre)
- Les montants de frais sont en valeur absolue (nombre)
- Si le type est ambigu, utilise "non-vie" par défaut
- Pour les paramètres: code, label et type sont OBLIGATOIRES
- Pour les formules: code et name sont OBLIGATOIRES
- Pour les taxes: code, name et rate sont OBLIGATOIRES
- Pour les frais: code, name et amount sont OBLIGATOIRES
- Pour les charges: code, name et value sont OBLIGATOIRES

RETOURNE UNIQUEMENT un JSON valide avec cette structure exacte:
{
  "data": { ... le schéma ci-dessus ... },
  "warnings": ["string"] 
}

NE RETOURNE RIEN D'AUTRE QUE LE JSON.`,
          },
          {
            role: "user",
            content: `Analyse ce CSV et retourne le JSON structuré avec TOUS les champs remplis:\n\n${csvContent}`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: "Limite de requêtes IA atteinte, réessayez plus tard." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: "Crédits IA insuffisants." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ success: false, error: "Erreur d'analyse IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    if (!content) {
      return new Response(
        JSON.stringify({ success: false, error: "L'IA n'a pas pu extraire de données structurées" }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      // Try extracting JSON from markdown code block
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1].trim());
      } else {
        throw new Error("Réponse IA invalide (pas de JSON)");
      }
    }

    const data = parsed.data || parsed;

    // Add UUIDs if missing
    const addIds = (arr: any[]) =>
      (arr || []).map((item: any) => ({ ...item, id: item.id || crypto.randomUUID() }));

    if (data.parameters) data.parameters = addIds(data.parameters);
    if (data.formulas) data.formulas = addIds(data.formulas).map((f: any) => ({ ...f, guarantees: f.guarantees || [] }));
    if (data.taxes) data.taxes = addIds(data.taxes);
    if (data.fees) data.fees = addIds(data.fees);
    if (data.tables_ref) data.tables_ref = addIds(data.tables_ref);
    if (data.charges) data.charges = addIds(data.charges);
    if (data.packages) data.packages = addIds(data.packages);
    if (data.options) data.options = addIds(data.options);

    return new Response(
      JSON.stringify({
        success: true,
        data,
        warnings: parsed.warnings || [],
        method: "ai",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("parse-calc-rule-csv error:", e);
    return new Response(
      JSON.stringify({ success: false, error: e instanceof Error ? e.message : "Erreur interne" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
