import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ============================================================
// SECURE FORMULA INTERPRETER (no eval)
// Supports: +, -, *, /, (), comparisons, IF, MIN, MAX, LOOKUP, BRACKET
// ============================================================

type TokenType = 
  | "NUMBER" | "VARIABLE" | "OPERATOR" | "LPAREN" | "RPAREN" 
  | "COMMA" | "FUNCTION" | "COMPARISON" | "EOF";

interface Token {
  type: TokenType;
  value: string | number;
}

// --- Tokenizer ---
function tokenize(formula: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const s = formula.trim();

  while (i < s.length) {
    // Skip whitespace
    if (/\s/.test(s[i])) { i++; continue; }

    // Numbers (including decimals)
    if (/[0-9]/.test(s[i]) || (s[i] === '.' && i + 1 < s.length && /[0-9]/.test(s[i + 1]))) {
      let num = "";
      while (i < s.length && (/[0-9]/.test(s[i]) || s[i] === '.')) { num += s[i]; i++; }
      tokens.push({ type: "NUMBER", value: parseFloat(num) });
      continue;
    }

    // Comparison operators
    if (s[i] === '>' || s[i] === '<' || s[i] === '=' || s[i] === '!') {
      let op = s[i]; i++;
      if (i < s.length && s[i] === '=') { op += '='; i++; }
      else if (op === '=') { op = '=='; } // single = treated as ==
      tokens.push({ type: "COMPARISON", value: op });
      continue;
    }

    // Arithmetic operators
    if ("+-*/".includes(s[i])) {
      tokens.push({ type: "OPERATOR", value: s[i] }); i++; continue;
    }

    // Parentheses
    if (s[i] === '(') { tokens.push({ type: "LPAREN", value: "(" }); i++; continue; }
    if (s[i] === ')') { tokens.push({ type: "RPAREN", value: ")" }); i++; continue; }

    // Comma
    if (s[i] === ',') { tokens.push({ type: "COMMA", value: "," }); i++; continue; }

    // Identifiers: variables or function names
    if (/[a-zA-Z_]/.test(s[i])) {
      let id = "";
      while (i < s.length && /[a-zA-Z0-9_]/.test(s[i])) { id += s[i]; i++; }
      const upper = id.toUpperCase();
      if (["IF", "MIN", "MAX", "LOOKUP", "BRACKET"].includes(upper)) {
        tokens.push({ type: "FUNCTION", value: upper });
      } else {
        tokens.push({ type: "VARIABLE", value: id });
      }
      continue;
    }

    throw new Error(`Caractère inattendu: '${s[i]}' à la position ${i}`);
  }

  tokens.push({ type: "EOF", value: "" });
  return tokens;
}

// --- AST Nodes ---
type ASTNode =
  | { type: "number"; value: number }
  | { type: "variable"; name: string }
  | { type: "binary"; op: string; left: ASTNode; right: ASTNode }
  | { type: "comparison"; op: string; left: ASTNode; right: ASTNode }
  | { type: "function"; name: string; args: ASTNode[] }
  | { type: "unary"; op: string; operand: ASTNode };

// --- Parser (recursive descent) ---
class Parser {
  private tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) { this.tokens = tokens; }

  private peek(): Token { return this.tokens[this.pos]; }
  private advance(): Token { return this.tokens[this.pos++]; }

  private expect(type: TokenType): Token {
    const t = this.advance();
    if (t.type !== type) throw new Error(`Attendu ${type}, reçu ${t.type} (${t.value})`);
    return t;
  }

  parse(): ASTNode {
    const node = this.parseComparison();
    if (this.peek().type !== "EOF") {
      throw new Error(`Tokens inattendus après la fin de la formule: ${this.peek().value}`);
    }
    return node;
  }

  private parseComparison(): ASTNode {
    let left = this.parseExpression();
    while (this.peek().type === "COMPARISON") {
      const op = this.advance().value as string;
      const right = this.parseExpression();
      left = { type: "comparison", op, left, right };
    }
    return left;
  }

  private parseExpression(): ASTNode {
    let left = this.parseTerm();
    while (this.peek().type === "OPERATOR" && (this.peek().value === "+" || this.peek().value === "-")) {
      const op = this.advance().value as string;
      const right = this.parseTerm();
      left = { type: "binary", op, left, right };
    }
    return left;
  }

  private parseTerm(): ASTNode {
    let left = this.parseUnary();
    while (this.peek().type === "OPERATOR" && (this.peek().value === "*" || this.peek().value === "/")) {
      const op = this.advance().value as string;
      const right = this.parseUnary();
      left = { type: "binary", op, left, right };
    }
    return left;
  }

  private parseUnary(): ASTNode {
    if (this.peek().type === "OPERATOR" && this.peek().value === "-") {
      this.advance();
      const operand = this.parsePrimary();
      return { type: "unary", op: "-", operand };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): ASTNode {
    const t = this.peek();

    if (t.type === "NUMBER") {
      this.advance();
      return { type: "number", value: t.value as number };
    }

    if (t.type === "FUNCTION") {
      const name = this.advance().value as string;
      this.expect("LPAREN");
      const args: ASTNode[] = [];
      if (this.peek().type !== "RPAREN") {
        args.push(this.parseComparison());
        while (this.peek().type === "COMMA") {
          this.advance();
          args.push(this.parseComparison());
        }
      }
      this.expect("RPAREN");
      return { type: "function", name, args };
    }

    if (t.type === "VARIABLE") {
      this.advance();
      return { type: "variable", name: t.value as string };
    }

    if (t.type === "LPAREN") {
      this.advance();
      const expr = this.parseComparison();
      this.expect("RPAREN");
      return expr;
    }

    throw new Error(`Token inattendu: ${t.type} (${t.value})`);
  }
}

// --- Evaluator ---
interface TableRef {
  code: string;
  type: "key_value" | "brackets";
  data: Record<string, number> | Array<{ min: number; max: number; value: number }>;
}

interface EvalContext {
  variables: Record<string, number>;
  tables: TableRef[];
}

function evaluate(node: ASTNode, ctx: EvalContext): number {
  switch (node.type) {
    case "number":
      return node.value;

    case "variable": {
      if (!(node.name in ctx.variables)) {
        throw new Error(`Variable inconnue: '${node.name}'`);
      }
      return ctx.variables[node.name];
    }

    case "unary":
      return -evaluate(node.operand, ctx);

    case "binary": {
      const l = evaluate(node.left, ctx);
      const r = evaluate(node.right, ctx);
      switch (node.op) {
        case "+": return l + r;
        case "-": return l - r;
        case "*": return l * r;
        case "/":
          if (r === 0) throw new Error("Division par zéro");
          return l / r;
        default: throw new Error(`Opérateur inconnu: ${node.op}`);
      }
    }

    case "comparison": {
      const l = evaluate(node.left, ctx);
      const r = evaluate(node.right, ctx);
      switch (node.op) {
        case ">": return l > r ? 1 : 0;
        case "<": return l < r ? 1 : 0;
        case ">=": return l >= r ? 1 : 0;
        case "<=": return l <= r ? 1 : 0;
        case "==": return l === r ? 1 : 0;
        case "!=": return l !== r ? 1 : 0;
        default: throw new Error(`Comparaison inconnue: ${node.op}`);
      }
    }

    case "function": {
      const name = node.name;
      const args = node.args;

      if (name === "MIN") {
        if (args.length < 2) throw new Error("MIN() nécessite au moins 2 arguments");
        return Math.min(...args.map(a => evaluate(a, ctx)));
      }
      if (name === "MAX") {
        if (args.length < 2) throw new Error("MAX() nécessite au moins 2 arguments");
        return Math.max(...args.map(a => evaluate(a, ctx)));
      }
      if (name === "IF") {
        if (args.length !== 3) throw new Error("IF() nécessite exactement 3 arguments");
        const condition = evaluate(args[0], ctx);
        return condition !== 0 ? evaluate(args[1], ctx) : evaluate(args[2], ctx);
      }
      if (name === "LOOKUP") {
        if (args.length !== 2) throw new Error("LOOKUP(table_code, key) nécessite 2 arguments");
        // First arg must be a variable (table code), second arg evaluated for the key
        const tableCodeNode = args[0];
        if (tableCodeNode.type !== "variable") throw new Error("LOOKUP: premier argument doit être le code de la table");
        const tableCode = tableCodeNode.name;
        const table = ctx.tables.find(t => t.code === tableCode);
        if (!table) throw new Error(`Table de référence introuvable: '${tableCode}'`);
        if (table.type !== "key_value") throw new Error(`LOOKUP: la table '${tableCode}' n'est pas de type clé-valeur`);

        // The key can be a variable name
        const keyNode = args[1];
        if (keyNode.type === "variable") {
          const keyValue = ctx.variables[keyNode.name];
          if (keyValue === undefined) throw new Error(`Variable inconnue: '${keyNode.name}'`);
          // Try numeric key first, then string
          const data = table.data as Record<string, number>;
          const strKey = String(keyValue);
          if (strKey in data) return data[strKey];
          // Also try the variable name itself as key (for string-type lookups)
          if (keyNode.name in data) return data[keyNode.name];
          throw new Error(`Clé '${strKey}' introuvable dans la table '${tableCode}'`);
        }
        // Numeric key
        const keyVal = evaluate(keyNode, ctx);
        const data = table.data as Record<string, number>;
        const key = String(keyVal);
        if (!(key in data)) throw new Error(`Clé '${key}' introuvable dans la table '${tableCode}'`);
        return data[key];
      }
      if (name === "BRACKET") {
        if (args.length !== 2) throw new Error("BRACKET(table_code, value) nécessite 2 arguments");
        const tableCodeNode = args[0];
        if (tableCodeNode.type !== "variable") throw new Error("BRACKET: premier argument doit être le code de la table");
        const tableCode = tableCodeNode.name;
        const table = ctx.tables.find(t => t.code === tableCode);
        if (!table) throw new Error(`Table de référence introuvable: '${tableCode}'`);
        if (table.type !== "brackets") throw new Error(`BRACKET: la table '${tableCode}' n'est pas de type tranches`);
        const val = evaluate(args[1], ctx);
        const brackets = table.data as Array<{ min: number; max: number; value: number }>;
        const bracket = brackets.find(b => val >= b.min && val <= b.max);
        if (!bracket) throw new Error(`Aucune tranche trouvée pour la valeur ${val} dans '${tableCode}'`);
        return bracket.value;
      }

      throw new Error(`Fonction inconnue: ${name}`);
    }

    default:
      throw new Error(`Nœud AST inconnu`);
  }
}

// ============================================================
// MAIN HANDLER
// ============================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { calc_rule_id, parameters, selected_formula_code } = await req.json();

    if (!calc_rule_id) {
      return new Response(JSON.stringify({ error: "calc_rule_id est requis" }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Load the rule from database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: rule, error: ruleError } = await supabase
      .from('calculation_rules')
      .select('*')
      .eq('id', calc_rule_id)
      .single();

    if (ruleError || !rule) {
      return new Response(JSON.stringify({ error: `Règle introuvable: ${calc_rule_id}` }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build variables context from parameters
    const variables: Record<string, number> = {};
    const ruleParams = (rule.parameters || []) as Array<{ code: string; type: string }>;
    const inputParams = parameters || {};

    for (const param of ruleParams) {
      const val = inputParams[param.code];
      if (val !== undefined && val !== null && val !== "") {
        variables[param.code] = Number(val);
        if (isNaN(variables[param.code])) {
          return new Response(JSON.stringify({ error: `Paramètre '${param.code}' doit être numérique, reçu: '${val}'` }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }

    // Build tables context
    const tables: TableRef[] = ((rule.tables_ref || []) as Array<{ code: string; type: string; data: unknown }>).map(t => ({
      code: t.code,
      type: t.type as "key_value" | "brackets",
      data: t.data as Record<string, number> | Array<{ min: number; max: number; value: number }>,
    }));

    // Determine which formula to execute
    let formulaStr = rule.base_formula || "";
    
    // If a specific formula code is selected, check if the formula pack has its own formula
    if (selected_formula_code) {
      const formulas = (rule.formulas || []) as Array<{ code: string; formula?: string }>;
      const selectedFormula = formulas.find(f => f.code === selected_formula_code);
      if (selectedFormula?.formula) {
        formulaStr = selectedFormula.formula;
      }
    }

    if (!formulaStr) {
      return new Response(JSON.stringify({ error: "Aucune formule de calcul définie" }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse and evaluate
    const ctx: EvalContext = { variables, tables };
    const tokens = tokenize(formulaStr);
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const primeNette = Math.round(evaluate(ast, ctx));

    // Apply taxes
    const taxesData = (rule.taxes || []) as Array<{ code: string; name: string; rate: number; isActive: boolean }>;
    const activeTaxes = taxesData.filter(t => t.isActive);
    const taxDetails = activeTaxes.map(t => ({
      code: t.code,
      name: t.name,
      rate: t.rate,
      amount: Math.round(primeNette * (t.rate / 100)),
    }));
    const totalTaxes = taxDetails.reduce((sum, t) => sum + t.amount, 0);

    // Apply fees
    const feesData = (rule.fees || []) as Array<{ code: string; name: string; amount: number; condition?: string }>;
    const feeDetails = feesData.map(f => ({
      code: f.code,
      name: f.name,
      amount: Math.round(f.amount),
    }));
    const totalFees = feeDetails.reduce((sum, f) => sum + f.amount, 0);

    const primeTTC = primeNette + totalTaxes;
    const totalAPayer = primeTTC + totalFees;

    const result = {
      primeNette,
      taxes: taxDetails,
      fees: feeDetails,
      totalTaxes,
      totalFees,
      primeTTC,
      totalAPayer,
    };

    console.log("Calcul réussi:", { calc_rule_id, primeNette, totalAPayer });

    return new Response(JSON.stringify(result), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Erreur calcul:", error);
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
