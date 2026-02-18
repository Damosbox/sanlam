import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";
import type { CalcRule, CalcRuleParameter, CalcRuleFormula, CalcRuleGuarantee, CalcRuleTax, CalcRuleFee, CalcRuleTableRef } from "./types";
import { CalcRuleSimulator } from "./CalcRuleSimulator";

interface CalcRuleEditorProps {
  rule: CalcRule | null;
  onSave: (data: Partial<CalcRule>) => void;
  isSaving: boolean;
}

export function CalcRuleEditor({ rule, onSave, isSaving }: CalcRuleEditorProps) {
  const [form, setForm] = useState({
    id: rule?.id,
    name: rule?.name || "",
    description: rule?.description || "",
    type: rule?.type || "non-vie",
    usage_category: rule?.usage_category || "",
    usage_category_label: rule?.usage_category_label || "",
    parameters: (rule?.parameters as CalcRuleParameter[]) || [],
    formulas: (rule?.formulas as CalcRuleFormula[]) || [],
    taxes: (rule?.taxes as CalcRuleTax[]) || [],
    fees: (rule?.fees as CalcRuleFee[]) || [],
    base_formula: rule?.base_formula || "",
    is_active: rule?.is_active ?? true,
    rules: rule?.rules || {},
    tables_ref: (rule?.tables_ref as CalcRuleTableRef[]) || [],
  });

  useEffect(() => {
    setForm({
      id: rule?.id,
      name: rule?.name || "",
      description: rule?.description || "",
      type: rule?.type || "non-vie",
      usage_category: rule?.usage_category || "",
      usage_category_label: rule?.usage_category_label || "",
      parameters: (rule?.parameters as CalcRuleParameter[]) || [],
      formulas: (rule?.formulas as CalcRuleFormula[]) || [],
      taxes: (rule?.taxes as CalcRuleTax[]) || [],
      fees: (rule?.fees as CalcRuleFee[]) || [],
      base_formula: rule?.base_formula || "",
      is_active: rule?.is_active ?? true,
      rules: rule?.rules || {},
      tables_ref: (rule?.tables_ref as CalcRuleTableRef[]) || [],
    });
  }, [rule]);

  // --- Parameter CRUD ---
  const addParameter = () => {
    setForm((f) => ({
      ...f,
      parameters: [...f.parameters, { id: crypto.randomUUID(), code: "", label: "", type: "text", required: true }],
    }));
  };
  const updateParameter = (idx: number, updates: Partial<CalcRuleParameter>) => {
    setForm((f) => ({ ...f, parameters: f.parameters.map((p, i) => (i === idx ? { ...p, ...updates } : p)) }));
  };
  const removeParameter = (idx: number) => {
    setForm((f) => ({ ...f, parameters: f.parameters.filter((_, i) => i !== idx) }));
  };

  // --- Formula CRUD ---
  const addFormula = () => {
    setForm((f) => ({
      ...f,
      formulas: [...f.formulas, { id: crypto.randomUUID(), code: "", name: "", guarantees: [], formula: "" }],
    }));
  };
  const updateFormula = (idx: number, updates: Partial<CalcRuleFormula>) => {
    setForm((f) => ({ ...f, formulas: f.formulas.map((fo, i) => (i === idx ? { ...fo, ...updates } : fo)) }));
  };
  const removeFormula = (idx: number) => {
    setForm((f) => ({ ...f, formulas: f.formulas.filter((_, i) => i !== idx) }));
  };
  const addGuarantee = (formulaIdx: number) => {
    const newG: CalcRuleGuarantee = { id: crypto.randomUUID(), code: "", label: "", isRequired: false };
    setForm((f) => ({
      ...f,
      formulas: f.formulas.map((fo, i) => (i === formulaIdx ? { ...fo, guarantees: [...fo.guarantees, newG] } : fo)),
    }));
  };

  // --- Tax CRUD ---
  const addTax = () => {
    setForm((f) => ({ ...f, taxes: [...f.taxes, { id: crypto.randomUUID(), code: "", name: "", rate: 0, isActive: true }] }));
  };
  const updateTax = (idx: number, updates: Partial<CalcRuleTax>) => {
    setForm((f) => ({ ...f, taxes: f.taxes.map((t, i) => (i === idx ? { ...t, ...updates } : t)) }));
  };
  const removeTax = (idx: number) => {
    setForm((f) => ({ ...f, taxes: f.taxes.filter((_, i) => i !== idx) }));
  };

  // --- Fee CRUD ---
  const addFee = () => {
    setForm((f) => ({ ...f, fees: [...f.fees, { id: crypto.randomUUID(), code: "", name: "", amount: 0 }] }));
  };
  const updateFee = (idx: number, updates: Partial<CalcRuleFee>) => {
    setForm((f) => ({ ...f, fees: f.fees.map((fe, i) => (i === idx ? { ...fe, ...updates } : fe)) }));
  };
  const removeFee = (idx: number) => {
    setForm((f) => ({ ...f, fees: f.fees.filter((_, i) => i !== idx) }));
  };

  // --- Tables Ref CRUD ---
  const addTableRef = () => {
    setForm((f) => ({
      ...f,
      tables_ref: [...f.tables_ref, { id: crypto.randomUUID(), code: "", name: "", type: "key_value" as const, data: {} }],
    }));
  };
  const updateTableRef = (idx: number, updates: Partial<CalcRuleTableRef>) => {
    setForm((f) => ({ ...f, tables_ref: f.tables_ref.map((t, i) => (i === idx ? { ...t, ...updates } : t)) }));
  };
  const removeTableRef = (idx: number) => {
    setForm((f) => ({ ...f, tables_ref: f.tables_ref.filter((_, i) => i !== idx) }));
  };

  const renderTableRefData = (table: CalcRuleTableRef, idx: number) => {
    if (table.type === "key_value") {
      const data = (table.data || {}) as Record<string, number>;
      const entries = Object.entries(data);
      return (
        <div className="space-y-2">
          {entries.map(([key, value], eIdx) => (
            <div key={eIdx} className="flex items-center gap-2">
              <Input
                placeholder="Clé"
                value={key}
                onChange={(e) => {
                  const newData = { ...data };
                  delete newData[key];
                  newData[e.target.value] = value;
                  updateTableRef(idx, { data: newData });
                }}
                className="w-32"
              />
              <Input
                type="number"
                placeholder="Valeur"
                value={value}
                onChange={(e) => {
                  updateTableRef(idx, { data: { ...data, [key]: parseFloat(e.target.value) || 0 } });
                }}
                className="w-28"
              />
              <Button variant="ghost" size="icon" onClick={() => {
                const newData = { ...data };
                delete newData[key];
                updateTableRef(idx, { data: newData });
              }}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          ))}
          <Button variant="ghost" size="sm" onClick={() => {
            updateTableRef(idx, { data: { ...data, [`cle_${entries.length + 1}`]: 0 } });
          }}>
            <Plus className="h-3 w-3 mr-1" /> Entrée
          </Button>
        </div>
      );
    }

    // Brackets
    const brackets = (table.data || []) as Array<{ min: number; max: number; value: number }>;
    return (
      <div className="space-y-2">
        {brackets.map((b, bIdx) => (
          <div key={bIdx} className="flex items-center gap-2">
            <Input type="number" placeholder="Min" value={b.min} onChange={(e) => {
              const newBrackets = [...brackets];
              newBrackets[bIdx] = { ...b, min: parseFloat(e.target.value) || 0 };
              updateTableRef(idx, { data: newBrackets });
            }} className="w-20" />
            <span className="text-xs text-muted-foreground">→</span>
            <Input type="number" placeholder="Max" value={b.max} onChange={(e) => {
              const newBrackets = [...brackets];
              newBrackets[bIdx] = { ...b, max: parseFloat(e.target.value) || 0 };
              updateTableRef(idx, { data: newBrackets });
            }} className="w-20" />
            <span className="text-xs text-muted-foreground">=</span>
            <Input type="number" placeholder="Valeur" value={b.value} onChange={(e) => {
              const newBrackets = [...brackets];
              newBrackets[bIdx] = { ...b, value: parseFloat(e.target.value) || 0 };
              updateTableRef(idx, { data: newBrackets });
            }} className="w-24" />
            <Button variant="ghost" size="icon" onClick={() => {
              updateTableRef(idx, { data: brackets.filter((_, i) => i !== bIdx) });
            }}>
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        ))}
        <Button variant="ghost" size="sm" onClick={() => {
          updateTableRef(idx, { data: [...brackets, { min: 0, max: 0, value: 0 }] });
        }}>
          <Plus className="h-3 w-3 mr-1" /> Tranche
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6 py-6">
      <Accordion type="multiple" defaultValue={["general", "parameters", "formulas", "taxes", "fees"]} className="space-y-2">
        {/* General Info */}
        <AccordionItem value="general" className="border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-semibold">Informations générales</AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex: Auto 401 - Privée" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vie">Vie</SelectItem>
                    <SelectItem value="non-vie">Non-Vie</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Catégorie d'usage *</Label>
                <Input value={form.usage_category} onChange={(e) => setForm((f) => ({ ...f, usage_category: e.target.value }))} placeholder="Ex: 401" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Libellé catégorie</Label>
              <Input value={form.usage_category_label || ""} onChange={(e) => setForm((f) => ({ ...f, usage_category_label: e.target.value }))} placeholder="Ex: Promenade / Tourisme" />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
              <Label>Règle active</Label>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Parameters */}
        <AccordionItem value="parameters" className="border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-semibold">
            Paramètres de cotation <Badge variant="secondary" className="ml-2">{form.parameters.length}</Badge>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4">
            <p className="text-xs text-muted-foreground">Champs obligatoires affichés lors de la cotation</p>
            {form.parameters.map((p, idx) => (
              <div key={p.id} className="flex items-start gap-2 p-3 border rounded-md bg-muted/30">
                <div className="flex-1 grid gap-2 grid-cols-3">
                  <Input placeholder="Code" value={p.code} onChange={(e) => updateParameter(idx, { code: e.target.value })} />
                  <Input placeholder="Libellé" value={p.label} onChange={(e) => updateParameter(idx, { label: e.target.value })} />
                  <Select value={p.type} onValueChange={(v) => updateParameter(idx, { type: v as CalcRuleParameter["type"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Texte</SelectItem>
                      <SelectItem value="number">Nombre</SelectItem>
                      <SelectItem value="select">Liste</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="boolean">Oui/Non</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeParameter(idx)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addParameter}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter un paramètre
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* Formulas / Packs */}
        <AccordionItem value="formulas" className="border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-semibold">
            Formules / Packs <Badge variant="secondary" className="ml-2">{form.formulas.length}</Badge>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            {form.formulas.map((fo, fIdx) => (
              <div key={fo.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1 grid gap-2 grid-cols-2">
                    <Input placeholder="Code formule" value={fo.code} onChange={(e) => updateFormula(fIdx, { code: e.target.value })} />
                    <Input placeholder="Nom formule" value={fo.name} onChange={(e) => updateFormula(fIdx, { name: e.target.value })} />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeFormula(fIdx)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Formule de calcul</Label>
                  <Input placeholder="Ex: prime_nette * coeff_usage" value={fo.formula || ""} onChange={(e) => updateFormula(fIdx, { formula: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Garanties couvertes ({fo.guarantees.length})</Label>
                    <Button variant="ghost" size="sm" onClick={() => addGuarantee(fIdx)}>
                      <Plus className="h-3 w-3 mr-1" /> Garantie
                    </Button>
                  </div>
                  {fo.guarantees.map((g, gIdx) => (
                    <div key={g.id} className="grid grid-cols-4 gap-2 items-center">
                      <Input placeholder="Code" value={g.code} onChange={(e) => {
                        const updated = [...fo.guarantees];
                        updated[gIdx] = { ...g, code: e.target.value };
                        updateFormula(fIdx, { guarantees: updated });
                      }} />
                      <Input placeholder="Libellé" value={g.label} onChange={(e) => {
                        const updated = [...fo.guarantees];
                        updated[gIdx] = { ...g, label: e.target.value };
                        updateFormula(fIdx, { guarantees: updated });
                      }} />
                      <Input type="number" placeholder="Limite" value={g.limit || ""} onChange={(e) => {
                        const updated = [...fo.guarantees];
                        updated[gIdx] = { ...g, limit: parseFloat(e.target.value) || 0 };
                        updateFormula(fIdx, { guarantees: updated });
                      }} />
                      <div className="flex items-center gap-1">
                        <Input type="number" placeholder="Carence (j)" value={g.waitingPeriodDays || ""} onChange={(e) => {
                          const updated = [...fo.guarantees];
                          updated[gIdx] = { ...g, waitingPeriodDays: parseInt(e.target.value) || 0 };
                          updateFormula(fIdx, { guarantees: updated });
                        }} className="flex-1" />
                        <Button variant="ghost" size="icon" className="shrink-0" onClick={() => {
                          const updated = fo.guarantees.filter((_, i) => i !== gIdx);
                          updateFormula(fIdx, { guarantees: updated });
                        }}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addFormula}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter une formule
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* Base Formula */}
        <AccordionItem value="base_formula" className="border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-semibold">Formule de base</AccordionTrigger>
          <AccordionContent className="pb-4">
            <Textarea
              value={form.base_formula}
              onChange={(e) => setForm((f) => ({ ...f, base_formula: e.target.value }))}
              placeholder="Ex: base_rc * coeff_usage * coeff_energie + LOOKUP(assistance, niveau_assistance)"
              rows={4}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Variables : utilisez les codes des paramètres. Fonctions : IF(), MIN(), MAX(), LOOKUP(), BRACKET()
            </p>
          </AccordionContent>
        </AccordionItem>

        {/* Tables de référence */}
        <AccordionItem value="tables_ref" className="border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-semibold">
            Tables de référence <Badge variant="secondary" className="ml-2">{form.tables_ref.length}</Badge>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <p className="text-xs text-muted-foreground">Barèmes et tables utilisés dans les formules via LOOKUP() et BRACKET()</p>
            {form.tables_ref.map((table, idx) => (
              <div key={table.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1 grid gap-2 grid-cols-3">
                    <Input placeholder="Code" value={table.code} onChange={(e) => updateTableRef(idx, { code: e.target.value })} />
                    <Input placeholder="Nom" value={table.name} onChange={(e) => updateTableRef(idx, { name: e.target.value })} />
                    <Select
                      value={table.type}
                      onValueChange={(v) => updateTableRef(idx, {
                        type: v as "key_value" | "brackets",
                        data: v === "key_value" ? {} : [],
                      })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="key_value">Clé → Valeur</SelectItem>
                        <SelectItem value="brackets">Tranches</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeTableRef(idx)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                {renderTableRefData(table, idx)}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addTableRef}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter une table
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* Taxes */}
        <AccordionItem value="taxes" className="border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-semibold">
            Taxes <Badge variant="secondary" className="ml-2">{form.taxes.length}</Badge>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4">
            {form.taxes.map((t, idx) => (
              <div key={t.id} className="flex items-center gap-2 p-2 border rounded-md bg-muted/30">
                <Input placeholder="Code" value={t.code} onChange={(e) => updateTax(idx, { code: e.target.value })} className="w-24" />
                <Input placeholder="Nom" value={t.name} onChange={(e) => updateTax(idx, { name: e.target.value })} className="flex-1" />
                <Input type="number" placeholder="%" value={t.rate} onChange={(e) => updateTax(idx, { rate: parseFloat(e.target.value) || 0 })} className="w-20" />
                <Switch checked={t.isActive} onCheckedChange={(v) => updateTax(idx, { isActive: v })} />
                <Button variant="ghost" size="icon" onClick={() => removeTax(idx)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addTax}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter une taxe
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* Fees */}
        <AccordionItem value="fees" className="border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-semibold">
            Frais <Badge variant="secondary" className="ml-2">{form.fees.length}</Badge>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4">
            {form.fees.map((fe, idx) => (
              <div key={fe.id} className="flex items-center gap-2 p-2 border rounded-md bg-muted/30">
                <Input placeholder="Code" value={fe.code} onChange={(e) => updateFee(idx, { code: e.target.value })} className="w-24" />
                <Input placeholder="Nom" value={fe.name} onChange={(e) => updateFee(idx, { name: e.target.value })} className="flex-1" />
                <Input type="number" placeholder="Montant" value={fe.amount} onChange={(e) => updateFee(idx, { amount: parseFloat(e.target.value) || 0 })} className="w-28" />
                <Button variant="ghost" size="icon" onClick={() => removeFee(idx)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addFee}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter un frais
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* Simulation */}
        <AccordionItem value="simulation" className="border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-semibold">
            🧪 Simulation
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <CalcRuleSimulator
              ruleId={form.id}
              parameters={form.parameters}
              formulas={form.formulas}
              taxes={form.taxes}
              fees={form.fees}
              tablesRef={form.tables_ref}
              baseFormula={form.base_formula}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Button onClick={() => onSave(form)} disabled={isSaving || !form.name || !form.usage_category} className="w-full">
        {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
        {form.id ? "Mettre à jour" : "Créer la règle"}
      </Button>
    </div>
  );
}
