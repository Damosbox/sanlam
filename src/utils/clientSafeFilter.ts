/**
 * Sanitizes analysis content for direct client consumption
 * Removes aggressive wording and focuses on factual benefits
 */
export function sanitizeForClient(analysis: any): any {
  if (!analysis) return analysis;

  const sanitized = { ...analysis };

  // Remove competitor name references
  if (sanitized.teaching_insight) {
    sanitized.teaching_insight = {
      ...sanitized.teaching_insight,
      recadrage_probleme: sanitizeText(sanitized.teaching_insight.recadrage_probleme),
      tailoring_segment: sanitizeText(sanitized.teaching_insight.tailoring_segment),
    };
  }

  // Soften commercial arguments
  if (sanitized.commercial_arguments) {
    sanitized.commercial_arguments = sanitized.commercial_arguments.map((arg: any) => ({
      ...arg,
      argument: sanitizeText(arg.argument),
      contexte: sanitizeText(arg.contexte),
    }));
  }

  // Filter objections to keep only professional ones
  if (sanitized.top_3_objections) {
    sanitized.top_3_objections = sanitized.top_3_objections.map((obj: any) => ({
      ...obj,
      objection: sanitizeText(obj.objection),
      reponse: sanitizeText(obj.reponse),
    }));
  }

  // Hide positioning scores (too competitive for client-facing doc)
  delete sanitized.positioning_scores;

  // Keep only positive aspects from weaknesses
  if (sanitized.weaknesses) {
    sanitized.weaknesses = sanitized.weaknesses.map((w: any) => ({
      titre: "Optimisation possible",
      description: sanitizeText(w.opportunite || w.description),
      opportunite: sanitizeText(w.opportunite),
    }));
  }

  return sanitized;
}

function sanitizeText(text: string): string {
  if (!text) return text;

  // Replace aggressive terms
  const replacements: Record<string, string> = {
    'concurrent': 'autre solution',
    'Concurrent': 'Autre solution',
    'faiblesse': 'point d\'amélioration',
    'Faiblesse': 'Point d\'amélioration',
    'inférieur': 'différent',
    'Inférieur': 'Différent',
    'meilleur que': 'comparé à',
    'Meilleur que': 'Comparé à',
    'surpasse': 'se distingue de',
    'Surpasse': 'Se distingue de',
    'écrase': 'se différencie de',
    'Écrase': 'Se différencie de',
  };

  let sanitized = text;
  Object.entries(replacements).forEach(([aggressive, professional]) => {
    const regex = new RegExp(aggressive, 'g');
    sanitized = sanitized.replace(regex, professional);
  });

  return sanitized;
}
