import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen, Code2, FunctionSquare, Lightbulb } from "lucide-react";

const grammar = {
  sections: [
    { label: "Affectation", syntax: "variable = expression" },
    { label: "Opérateurs arithmétiques", syntax: "+, -, *, /, %" },
    { label: "Opérateurs logiques", syntax: "&&, ||, !" },
    { label: "Opérateurs de comparaison", syntax: "==, !=, <, <=, >, >=" },
  ],
};

const functions = [
  { name: "Abs", signature: "Abs(x)", description: "Valeur absolue. Exemple : Abs(-5) = 5", category: "Math" },
  { name: "Pow", signature: "Pow(x, y)", description: "Puissance. Exemple : Pow(2, 3) = 8", category: "Math" },
  { name: "Sqrt", signature: "Sqrt(x)", description: "Racine carrée. Exemple : Sqrt(9) = 3", category: "Math" },
  { name: "Log", signature: "Log(x)", description: "Logarithme naturel. Exemple : Log(1) = 0", category: "Math" },
  { name: "Exp", signature: "Exp(x)", description: "Exponentielle. Exemple : Exp(1) = 2.718...", category: "Math" },
  { name: "Round", signature: "Round(x, n)", description: "Arrondi à n décimales. Exemple : Round(3.14159, 2) = 3.14", category: "Math" },
  { name: "Ceiling", signature: "Ceiling(x)", description: "Arrondi supérieur. Exemple : Ceiling(3.1) = 4", category: "Math" },
  { name: "Floor", signature: "Floor(x)", description: "Arrondi inférieur. Exemple : Floor(3.9) = 3", category: "Math" },
  { name: "Min", signature: "Min(a, b)", description: "Minimum. Exemple : Min(3, 7) = 3", category: "Math" },
  { name: "Max", signature: "Max(a, b)", description: "Maximum. Exemple : Max(3, 7) = 7", category: "Math" },
  { name: "If", signature: "If(condition, vrai, faux)", description: "Conditionnelle. Exemple : If(A > 10, 1, 0)", category: "Logique" },
  { name: "Now", signature: "Now()", description: "Date et heure courante.", category: "Date" },
  { name: "Today", signature: "Today()", description: "Date du jour.", category: "Date" },
  { name: "Year", signature: "Year(date)", description: "Année d'une date. Exemple : Year(Today())", category: "Date" },
  { name: "Month", signature: "Month(date)", description: "Mois d'une date. Exemple : Month(Today())", category: "Date" },
  { name: "Day", signature: "Day(date)", description: "Jour d'une date. Exemple : Day(Today())", category: "Date" },
  { name: "LOOKUP", signature: "LOOKUP(table_code, key)", description: "Recherche une valeur dans une table clé-valeur.", category: "Table" },
  { name: "BRACKET", signature: "BRACKET(table_code, value)", description: "Recherche par tranche dans une table de type brackets.", category: "Table" },
];

const examples = [
  {
    code: "SIMPLE_ASSIGN",
    name: "Affectation simple",
    description: "Affectation d'une valeur constante à une variable.",
    dsl: "AGE = 42",
    params: [{ code: "AGE", type: "int", description: "Âge constant" }],
    tests: [{ input: "{}", expected: "AGE = 42" }],
  },
  {
    code: "COEF_AGE",
    name: "Coefficient selon l'âge",
    description: "Applique un coefficient selon l'âge.",
    dsl: "COEF = If(AGE < 25, 1.5, 1.0)",
    params: [{ code: "AGE", type: "int", description: "Âge calculé" }],
    tests: [
      { input: "AGE = 22", expected: "COEF = 1.5" },
      { input: "AGE = 40", expected: "COEF = 1.0" },
    ],
  },
  {
    code: "MATH_OPS",
    name: "Opérations mathématiques",
    description: "Utilisation des fonctions mathématiques NCalc.",
    dsl: "RESULT = Max(Abs(A), Pow(B, 2))",
    params: [
      { code: "A", type: "int", description: "Valeur A" },
      { code: "B", type: "int", description: "Valeur B" },
    ],
    tests: [{ input: "A = -5, B = 3", expected: "RESULT = 9" }],
  },
  {
    code: "PRIME_AUTO",
    name: "Prime Auto simplifiée",
    description: "Calcul de prime avec coefficient d'usage et table de référence.",
    dsl: "PRIME = valeur_neuve * BRACKET(taux_rc, puissance) * LOOKUP(coef_zone, zone)",
    params: [
      { code: "valeur_neuve", type: "number", description: "Valeur du véhicule" },
      { code: "puissance", type: "int", description: "Puissance fiscale" },
      { code: "zone", type: "string", description: "Zone géographique" },
    ],
    tests: [{ input: "valeur_neuve = 5000000, puissance = 8, zone = A", expected: "PRIME = (dépend des tables)" }],
  },
];

const categoryColors: Record<string, string> = {
  Math: "default",
  Logique: "secondary",
  Date: "outline",
  Table: "destructive",
};

export default function CalcDocsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          Documentation NCalc — Moteur de Calcul
        </h1>
        <p className="text-muted-foreground">
          Référence complète de la syntaxe, des fonctions et des exemples pour les règles de calcul actuarielles.
        </p>
        <Badge variant="outline" className="mt-2">v1.0.0</Badge>
      </div>

      <Tabs defaultValue="syntax" className="space-y-4">
        <TabsList>
          <TabsTrigger value="syntax" className="gap-1.5">
            <Code2 className="h-4 w-4" /> Syntaxe
          </TabsTrigger>
          <TabsTrigger value="functions" className="gap-1.5">
            <FunctionSquare className="h-4 w-4" /> Fonctions
          </TabsTrigger>
          <TabsTrigger value="examples" className="gap-1.5">
            <Lightbulb className="h-4 w-4" /> Exemples
          </TabsTrigger>
        </TabsList>

        {/* --- SYNTAX TAB --- */}
        <TabsContent value="syntax" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Syntaxe générale</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Élément</TableHead>
                      <TableHead>Syntaxe</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grammar.sections.map((s) => (
                      <TableRow key={s.label}>
                        <TableCell className="font-medium">{s.label}</TableCell>
                        <TableCell>
                          <code className="bg-muted px-2 py-1 rounded text-sm font-mono">{s.syntax}</code>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Card className="bg-muted/50 border-dashed">
                <CardContent className="pt-4 space-y-2">
                  <p className="text-sm font-semibold">Exemple de syntaxe :</p>
                  <pre className="bg-background rounded-md p-4 text-sm font-mono overflow-x-auto border">
{`A = 10
B = 20
RESULT = (A + B) * 2
COEF = If(AGE < 25, 1.5, 1.0)`}
                  </pre>
                </CardContent>
              </Card>

              <Card className="bg-muted/50 border-dashed">
                <CardContent className="pt-4 space-y-2">
                  <p className="text-sm font-semibold">Fonctions de table (spécifiques au moteur) :</p>
                  <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                    <li><code className="font-mono text-foreground">LOOKUP(table_code, key)</code> — Recherche clé-valeur dans une table de référence</li>
                    <li><code className="font-mono text-foreground">BRACKET(table_code, value)</code> — Recherche par tranches (min/max) dans une table</li>
                  </ul>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- FUNCTIONS TAB --- */}
        <TabsContent value="functions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fonctions disponibles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fonction</TableHead>
                      <TableHead>Signature</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead className="min-w-[300px]">Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {functions.map((fn) => (
                      <TableRow key={fn.name}>
                        <TableCell className="font-mono font-semibold">{fn.name}</TableCell>
                        <TableCell>
                          <code className="bg-muted px-2 py-1 rounded text-sm font-mono">{fn.signature}</code>
                        </TableCell>
                        <TableCell>
                          <Badge variant={categoryColors[fn.category] as any}>{fn.category}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{fn.description}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- EXAMPLES TAB --- */}
        <TabsContent value="examples" className="space-y-4">
          {examples.map((ex) => (
            <Card key={ex.code}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Badge variant="outline" className="font-mono">{ex.code}</Badge>
                  {ex.name}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{ex.description}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">FORMULE</p>
                  <pre className="bg-muted rounded-md p-3 text-sm font-mono border">{ex.dsl}</pre>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">PARAMÈTRES</p>
                  <div className="flex flex-wrap gap-2">
                    {ex.params.map((p) => (
                      <Badge key={p.code} variant="secondary" className="font-mono">
                        {p.code} <span className="text-muted-foreground ml-1">({p.type})</span>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">TESTS</p>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Entrée</TableHead>
                          <TableHead>Résultat attendu</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ex.tests.map((t, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-mono text-sm">{t.input}</TableCell>
                            <TableCell className="font-mono text-sm font-semibold">{t.expected}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
