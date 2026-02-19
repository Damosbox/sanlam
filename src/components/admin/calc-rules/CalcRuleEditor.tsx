import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { Plus, Trash2, Save, Loader2, BookOpen, ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type {
  CalcRule, CalcRuleParameter, CalcRuleFormula, CalcRuleGuarantee,
  CalcRuleTax, CalcRuleFee, CalcRuleTableRef,
  CalcRuleOption, CalcRulePackage, CalcRuleCharge,
} from "./types";
import { CalcRuleSimulator } from "./CalcRuleSimulator";

interface CalcRuleEditorProps {
  rule: CalcRule | null;
  onSave: (data: Partial<CalcRule>) => void;
  isSaving: boolean;
}

const buildInitialForm = (rule: CalcRule | null) => ({
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
  options: (rule?.options as CalcRuleOption[]) || [],
  packages: (rule?.packages as CalcRulePackage[]) || [],
  charges: (rule?.charges as CalcRuleCharge[]) || [],
});

export function CalcRuleEditor({ rule, onSave, isSaving }: CalcRuleEditorProps) {
  const { data: catalogueVars = [] } = useQuery({
    queryKey: ["calculation-variables-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calculation_variables" as never)
        .select("*")
        .eq("is_active", true)
        .order("category")
        .order("label");
      if (error) throw error;
      return (data as unknown as Array<{
        id: string; code: string; label: string; type: string;
        options: string[]; category: string; description: string | null;
      }>) || [];
    },
  });
  const [catalogueFilter, setCatalogueFilter] = useState("");
  const [form, setForm] = useState(buildInitialForm(rule));

  useEffect(() => {
    setForm(buildInitialForm(rule));
  }, [rule]);

  // --- Parameter CRUD ---
  const addParameter = () => {
    setForm((f) => ({
      ...f,
      parameters: [...f.parameters, { id: crypto.randomUUID(), code: "", label: "", type: "text", required: true, source: "manual" as const }],
    }));
  };
  const importFromCatalogue = (v: { id: string; code: string; label: string; type: string; options: string[] }) => {
    setForm((f) => ({
      ...f,
      parameters: [
        ...f.parameters,
        {
          id: crypto.randomUUID(), code: v.code, label: v.label,
          type: v.type as CalcRuleParameter["type"], options: v.options,
          required: true, source: "catalogue" as const, variable_id: v.id,
        },
      ],
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

  // --- Charge CRUD ---
  const addCharge = () => {
    setForm((f) => ({
      ...f,
      charges: [...f.charges, { id: crypto.randomUUID(), code: "", name: "", description: "", value: "", category: "CHARGEMENT", displayOrder: f.charges.length }],
    }));
  };
  const updateCharge = (idx: number, updates: Partial<CalcRuleCharge>) => {
    setForm((f) => ({ ...f, charges: f.charges.map((c, i) => (i === idx ? { ...c, ...updates } : c)) }));
  };
  const removeCharge = (idx: number) => {
    setForm((f) => ({ ...f, charges: f.charges.filter((_, i) => i !== idx) }));
  };

  // --- Package CRUD ---
  const addPackage = () => {
    setForm((f) => ({
      ...f,
      packages: [...f.packages, { id: crypto.randomUUID(), code: "", name: "", description: "", configuration: "", displayOrder: f.packages.length, isActive: true }],
    }));
  };
  const updatePackage = (idx: number, updates: Partial<CalcRulePackage>) => {
    setForm((f) => ({ ...f, packages: f.packages.map((p, i) => (i === idx ? { ...p, ...updates } : p)) }));
  };
  const removePackage = (idx: number) => {
    setForm((f) => ({ ...f, packages: f.packages.filter((_, i) => i !== idx) }));
  };

  // --- Option CRUD ---
  const addOption = () => {
    setForm((f) => ({
      ...f,
      options: [...f.options, { id: crypto.randomUUID(), code: "", name: "", description: "", parameters: "", displayOrder: f.options.length, isActive: true }],
    }));
  };
  const updateOption = (idx: number, updates: Partial<CalcRuleOption>) => {
    setForm((f) => ({ ...f, options: f.options.map((o, i) => (i === idx ? { ...o, ...updates } : o)) }));
  };
  const removeOption = (idx: number) => {
    setForm((f) => ({ ...f, options: f.options.filter((_, i) => i !== idx) }));
  };

  const renderTableRefData = (table: CalcRuleTableRef, idx: number) => {
    if (table.type === "key_value") {
      const data = (table.data || {}) as Record<string, number>;
      const entries = Object.entries(data);
      return (
        <div className="space-y-2">
          {entries.map(([key, value], eIdx) => (
            <div key={eIdx} className="flex items-center gap-2">
              <Input placeholder="Clé" value={key} onChange={(e) => {
                const newData = { ...data }; delete newData[key]; newData[e.target.value] = value;
                updateTableRef(idx, { data: newData });
              }} className="w-32" />
              <Input type="number" placeholder="Valeur" value={value} onChange={(e) => {
                updateTableRef(idx, { data: { ...data, [key]: parseFloat(e.target.value) || 0 } });
              }} className="w-28" />
              <Button variant="ghost" size="icon" onClick={() => {
                const newData = { ...data }; delete newData[key]; updateTableRef(idx, { data: newData });
              }}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
            </div>
          ))}
          <Button variant="ghost" size="sm" onClick={() => {
            updateTableRef(idx, { data: { ...data, [`cle_${entries.length + 1}`]: 0 } });
          }}><Plus className="h-3 w-3 mr-1" /> Entrée</Button>
        </div>
      );
    }
    const brackets = (table.data || []) as Array<{ min: number; max: number; value: number }>;
    return (
      <div className="space-y-2">
        {brackets.map((b, bIdx) => (
          <div key={bIdx} className="flex items-center gap-2">
            <Input type="number" placeholder="Min" value={b.min} onChange={(e) => {
              const nb = [...brackets]; nb[bIdx] = { ...b, min: parseFloat(e.target.value) || 0 }; updateTableRef(idx, { data: nb });
            }} className="w-20" />
            <span className="text-xs text-muted-foreground">→</span>
            <Input type="number" placeholder="Max" value={b.max} onChange={(e) => {
              const nb = [...brackets]; nb[bIdx] = { ...b, max: parseFloat(e.target.value) || 0 }; updateTableRef(idx, { data: nb });
            }} className="w-20" />
            <span className="text-xs text-muted-foreground">=</span>
            <Input type="number" placeholder="Valeur" value={b.value} onChange={(e) => {
              const nb = [...brackets]; nb[bIdx] = { ...b, value: parseFloat(e.target.value) || 0 }; updateTableRef(idx, { data: nb });
            }} className="w-24" />
            <Button variant="ghost" size="icon" onClick={() => {
              updateTableRef(idx, { data: brackets.filter((_, i) => i !== bIdx) });
            }}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
          </div>
        ))}
        <Button variant="ghost" size="sm" onClick={() => {
          updateTableRef(idx, { data: [...brackets, { min: 0, max: 0, value: 0 }] });
        }}><Plus className="h-3 w-3 mr-1" /> Tranche</Button>
      </div>
    );
  };

  return (
    <div className="space-y-6 py-6">
      <Accordion type="multiple" defaultValue={["general", "parameters"]} className="space-y-2">
        {/* 1. General Info */}
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

        {/* 2. Parameters (enriched) */}
        <AccordionItem value="parameters" className="border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-semibold">
            <span className="flex items-center gap-2">Paramètres de cotation <Badge variant="secondary">{form.parameters.length}</Badge></span>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4">
            <p className="text-xs text-muted-foreground">Champs obligatoires affichés lors de la cotation</p>
            {form.parameters.map((p, idx) => (
              <div key={p.id} className={`space-y-2 p-3 border rounded-md ${p.source === "catalogue" ? "bg-primary/5 border-primary/20" : "bg-muted/30"}`}>
                <div className="flex items-start gap-2">
                  {p.source === "catalogue" && (
                    <Badge variant="outline" className="text-xs shrink-0 mt-1.5">Catalogue</Badge>
                  )}
                  <div className="flex-1 grid gap-2 grid-cols-3">
                    <Input placeholder="Code" value={p.code} onChange={(e) => updateParameter(idx, { code: e.target.value })} disabled={p.source === "catalogue"} />
                    <Input placeholder="Libellé" value={p.label} onChange={(e) => updateParameter(idx, { label: e.target.value })} />
                    <Select value={p.type} onValueChange={(v) => updateParameter(idx, { type: v as CalcRuleParameter["type"] })} disabled={p.source === "catalogue"}>
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
                {/* Enriched fields - collapsible */}
                <Collapsible>
                  <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                    <ChevronDown className="h-3 w-3" /> Champs avancés
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2">
                    <div className="grid gap-2 grid-cols-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Catégorie</Label>
                        <Select value={p.category || ""} onValueChange={(v) => updateParameter(idx, { category: v })}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TECHNIQUE">Technique</SelectItem>
                            <SelectItem value="CHARGEMENT">Chargement</SelectItem>
                            <SelectItem value="FRAIS">Frais</SelectItem>
                            <SelectItem value="COTATION">Cotation</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Valeur par défaut</Label>
                        <Input className="h-8 text-xs" placeholder="—" value={p.value || ""} onChange={(e) => updateParameter(idx, { value: e.target.value })} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Type valeur</Label>
                        <Input className="h-8 text-xs" type="number" placeholder="—" value={p.valueType ?? ""} onChange={(e) => updateParameter(idx, { valueType: parseInt(e.target.value) || undefined })} />
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            ))}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={addParameter}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter un paramètre
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <BookOpen className="h-3.5 w-3.5 mr-1" /> Importer depuis le catalogue
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-2" align="start">
                  <Input placeholder="Rechercher..." value={catalogueFilter} onChange={(e) => setCatalogueFilter(e.target.value)} className="mb-2" />
                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {catalogueVars
                      .filter((v) => v.label.toLowerCase().includes(catalogueFilter.toLowerCase()) || v.code.toLowerCase().includes(catalogueFilter.toLowerCase()))
                      .map((v) => {
                        const alreadyAdded = form.parameters.some((p) => p.variable_id === v.id);
                        return (
                          <button key={v.id} className="w-full text-left p-2 rounded hover:bg-muted text-sm disabled:opacity-50 flex items-center justify-between" disabled={alreadyAdded} onClick={() => importFromCatalogue(v)}>
                            <div>
                              <p className="font-medium">{v.label}</p>
                              <p className="text-xs text-muted-foreground font-mono">{v.code} • {v.category}</p>
                            </div>
                            {alreadyAdded && <Badge variant="secondary" className="text-xs">Ajouté</Badge>}
                          </button>
                        );
                      })}
                    {catalogueVars.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">Aucune variable dans le catalogue</p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 3. Chargements (NEW) */}
        <AccordionItem value="charges" className="border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-semibold">
            <span className="flex items-center gap-2">Chargements <Badge variant="secondary">{form.charges.length}</Badge></span>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4">
            <p className="text-xs text-muted-foreground">Chargements d'acquisition, de gestion et techniques</p>
            {form.charges.map((c, idx) => (
              <div key={c.id} className="flex items-start gap-2 p-3 border rounded-md bg-muted/30">
                <div className="flex-1 grid gap-2 grid-cols-2">
                  <Input placeholder="Code" value={c.code} onChange={(e) => updateCharge(idx, { code: e.target.value })} />
                  <Input placeholder="Nom" value={c.name} onChange={(e) => updateCharge(idx, { name: e.target.value })} />
                  <Input placeholder="Valeur (ex: 0.2)" value={c.value} onChange={(e) => updateCharge(idx, { value: e.target.value })} />
                  <Select value={c.category} onValueChange={(v) => updateCharge(idx, { category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TECHNIQUE">Technique</SelectItem>
                      <SelectItem value="CHARGEMENT">Chargement</SelectItem>
                      <SelectItem value="FRAIS">Frais</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input placeholder="Description" value={c.description} onChange={(e) => updateCharge(idx, { description: e.target.value })} className="col-span-2" />
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeCharge(idx)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addCharge}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter un chargement
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* 4. Formules de calcul (separated from packs) */}
        <AccordionItem value="formulas" className="border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-semibold">
            <span className="flex items-center gap-2">Formules de calcul <Badge variant="secondary">{form.formulas.length}</Badge></span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <p className="text-xs text-muted-foreground">Expressions mathématiques (PUC, PAC, primes périodiques)</p>
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
                  <Label className="text-xs">Expression de calcul</Label>
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
                        const updated = [...fo.guarantees]; updated[gIdx] = { ...g, code: e.target.value }; updateFormula(fIdx, { guarantees: updated });
                      }} />
                      <Input placeholder="Libellé" value={g.label} onChange={(e) => {
                        const updated = [...fo.guarantees]; updated[gIdx] = { ...g, label: e.target.value }; updateFormula(fIdx, { guarantees: updated });
                      }} />
                      <Input type="number" placeholder="Limite" value={g.limit || ""} onChange={(e) => {
                        const updated = [...fo.guarantees]; updated[gIdx] = { ...g, limit: parseFloat(e.target.value) || 0 }; updateFormula(fIdx, { guarantees: updated });
                      }} />
                      <div className="flex items-center gap-1">
                        <Input type="number" placeholder="Carence (j)" value={g.waitingPeriodDays || ""} onChange={(e) => {
                          const updated = [...fo.guarantees]; updated[gIdx] = { ...g, waitingPeriodDays: parseInt(e.target.value) || 0 }; updateFormula(fIdx, { guarantees: updated });
                        }} className="flex-1" />
                        <Button variant="ghost" size="icon" className="shrink-0" onClick={() => {
                          updateFormula(fIdx, { guarantees: fo.guarantees.filter((_, i) => i !== gIdx) });
                        }}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
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

        {/* 5. Packs commerciaux (NEW, separated from formulas) */}
        <AccordionItem value="packages" className="border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-semibold">
            <span className="flex items-center gap-2">Packs commerciaux <Badge variant="secondary">{form.packages.length}</Badge></span>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4">
            <p className="text-xs text-muted-foreground">Formules commerciales (Bronze, Argent, Or) avec leurs configurations</p>
            {form.packages.map((pkg, idx) => (
              <div key={pkg.id} className="flex items-start gap-2 p-3 border rounded-md bg-muted/30">
                <div className="flex-1 space-y-2">
                  <div className="grid gap-2 grid-cols-2">
                    <Input placeholder="Code (ex: BRONZE)" value={pkg.code} onChange={(e) => updatePackage(idx, { code: e.target.value })} />
                    <Input placeholder="Nom (ex: Formule Bronze)" value={pkg.name} onChange={(e) => updatePackage(idx, { name: e.target.value })} />
                  </div>
                  <Input placeholder="Description" value={pkg.description} onChange={(e) => updatePackage(idx, { description: e.target.value })} />
                  <div className="space-y-1">
                    <Label className="text-xs">Configuration (clé=valeur séparés par ;)</Label>
                    <Textarea
                      placeholder="Ex: CAPITAL_ASSURE=300000;CAPITAL_ENFANT=150000"
                      value={pkg.configuration}
                      onChange={(e) => updatePackage(idx, { configuration: e.target.value })}
                      rows={2}
                      className="font-mono text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={pkg.isActive} onCheckedChange={(v) => updatePackage(idx, { isActive: v })} />
                    <Label className="text-xs">Actif</Label>
                    <Input type="number" placeholder="Ordre" value={pkg.displayOrder} onChange={(e) => updatePackage(idx, { displayOrder: parseInt(e.target.value) || 0 })} className="w-20 h-8 text-xs" />
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removePackage(idx)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addPackage}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter un pack
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* 6. Options (NEW) */}
        <AccordionItem value="options" className="border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-semibold">
            <span className="flex items-center gap-2">Options <Badge variant="secondary">{form.options.length}</Badge></span>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4">
            <p className="text-xs text-muted-foreground">Configurations paramétrables (ex: nombre d'enfants, niveaux de couverture)</p>
            {form.options.map((opt, idx) => (
              <div key={opt.id} className="flex items-start gap-2 p-3 border rounded-md bg-muted/30">
                <div className="flex-1 space-y-2">
                  <div className="grid gap-2 grid-cols-2">
                    <Input placeholder="Code (ex: OPTION_1)" value={opt.code} onChange={(e) => updateOption(idx, { code: e.target.value })} />
                    <Input placeholder="Nom (ex: Option 1)" value={opt.name} onChange={(e) => updateOption(idx, { name: e.target.value })} />
                  </div>
                  <Input placeholder="Description (ex: 3 enfants)" value={opt.description} onChange={(e) => updateOption(idx, { description: e.target.value })} />
                  <div className="space-y-1">
                    <Label className="text-xs">Paramètres (clé=valeur séparés par ;)</Label>
                    <Input placeholder="Ex: NOMBRE_ENFANTS=3" value={opt.parameters} onChange={(e) => updateOption(idx, { parameters: e.target.value })} className="font-mono text-xs" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={opt.isActive} onCheckedChange={(v) => updateOption(idx, { isActive: v })} />
                    <Label className="text-xs">Actif</Label>
                    <Input type="number" placeholder="Ordre" value={opt.displayOrder} onChange={(e) => updateOption(idx, { displayOrder: parseInt(e.target.value) || 0 })} className="w-20 h-8 text-xs" />
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeOption(idx)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addOption}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter une option
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* 7. Base Formula */}
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

        {/* 8. Tables de référence */}
        <AccordionItem value="tables_ref" className="border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-semibold">
            <span className="flex items-center gap-2">Tables de référence <Badge variant="secondary">{form.tables_ref.length}</Badge></span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <p className="text-xs text-muted-foreground">Barèmes et tables utilisés dans les formules via LOOKUP() et BRACKET()</p>
            {form.tables_ref.map((table, idx) => (
              <div key={table.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1 grid gap-2 grid-cols-3">
                    <Input placeholder="Code" value={table.code} onChange={(e) => updateTableRef(idx, { code: e.target.value })} />
                    <Input placeholder="Nom" value={table.name} onChange={(e) => updateTableRef(idx, { name: e.target.value })} />
                    <Select value={table.type} onValueChange={(v) => updateTableRef(idx, { type: v as "key_value" | "brackets", data: v === "key_value" ? {} : [] })}>
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

        {/* 9. Taxes */}
        <AccordionItem value="taxes" className="border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-semibold">
            <span className="flex items-center gap-2">Taxes <Badge variant="secondary">{form.taxes.length}</Badge></span>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4">
            {form.taxes.map((t, idx) => (
              <div key={t.id} className="flex items-center gap-2 p-2 border rounded-md bg-muted/30">
                <Input placeholder="Code" value={t.code} onChange={(e) => updateTax(idx, { code: e.target.value })} className="w-24" />
                <Input placeholder="Nom" value={t.name} onChange={(e) => updateTax(idx, { name: e.target.value })} className="flex-1" />
                <Input type="number" placeholder="%" value={t.rate} onChange={(e) => updateTax(idx, { rate: parseFloat(e.target.value) || 0 })} className="w-20" />
                <Switch checked={t.isActive} onCheckedChange={(v) => updateTax(idx, { isActive: v })} />
                <Button variant="ghost" size="icon" onClick={() => removeTax(idx)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addTax}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter une taxe
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* 10. Fees */}
        <AccordionItem value="fees" className="border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-semibold">
            <span className="flex items-center gap-2">Frais <Badge variant="secondary">{form.fees.length}</Badge></span>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4">
            {form.fees.map((fe, idx) => (
              <div key={fe.id} className="flex items-center gap-2 p-2 border rounded-md bg-muted/30">
                <Input placeholder="Code" value={fe.code} onChange={(e) => updateFee(idx, { code: e.target.value })} className="w-24" />
                <Input placeholder="Nom" value={fe.name} onChange={(e) => updateFee(idx, { name: e.target.value })} className="flex-1" />
                <Input type="number" placeholder="Montant" value={fe.amount} onChange={(e) => updateFee(idx, { amount: parseFloat(e.target.value) || 0 })} className="w-28" />
                <Button variant="ghost" size="icon" onClick={() => removeFee(idx)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addFee}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter un frais
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* 11. Simulation */}
        <AccordionItem value="simulation" className="border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-semibold">🧪 Simulation</AccordionTrigger>
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
