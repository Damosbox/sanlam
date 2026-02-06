import { describe, it, expect } from "vitest";
import {
  parseFormStructure,
  serializeFormStructure,
  migrateOldStepsToPhases,
  isNewFormStructure,
  createDefaultFormStructure,
  type FormStructure,
} from "@/components/admin/form-builder/types";

describe("Form Builder - parseFormStructure", () => {
  it("should return default structure when input is null", () => {
    const result = parseFormStructure(null);

    expect(result).toBeDefined();
    expect(result.phases).toHaveLength(2);
    expect(result.phases[0].id).toBe("cotation");
    expect(result.phases[1].id).toBe("souscription");
  });

  it("should return default structure when input is undefined", () => {
    const result = parseFormStructure(undefined);

    expect(result).toBeDefined();
    expect(result.phases).toHaveLength(2);
  });

  it("should return default structure for empty object", () => {
    const result = parseFormStructure({});

    expect(result).toBeDefined();
    expect(result.phases).toHaveLength(2);
  });

  it("should recognize and return new format directly", () => {
    const newFormat: FormStructure = {
      phases: [
        {
          id: "cotation",
          name: "Cotation",
          icon: "Calculator",
          steps: [
            {
              id: "step_1",
              title: "Règles",
              type: "calculation_rules",
              calculationRules: {
                baseFormula: "base * 1.2",
                coefficients: [],
                taxes: [],
                fees: [],
                variables: [],
              },
            },
          ],
        },
      ],
    };

    const result = parseFormStructure(newFormat);

    expect(result).toEqual(newFormat);
    expect(result.phases[0].steps[0].type).toBe("calculation_rules");
  });

  it("should migrate legacy flat format to new phases structure", () => {
    const legacyFormat = {
      step1: {
        title: "Informations personnelles",
        fields: [
          { id: "f1", type: "text", label: "Nom", required: true },
          { id: "f2", type: "email", label: "Email", required: false },
        ],
      },
      step2: {
        title: "Adresse",
        fields: [
          { id: "f3", type: "text", label: "Rue", required: true },
        ],
      },
    };

    const result = parseFormStructure(legacyFormat);

    expect(result.phases).toHaveLength(2);
    expect(result.phases[0].id).toBe("cotation");

    // Legacy steps should be in cotation phase
    const cotationSteps = result.phases[0].steps;
    expect(cotationSteps.length).toBeGreaterThan(0);

    // Check that fields are preserved
    const fieldSteps = cotationSteps.filter((s) => s.type === "fields");
    expect(fieldSteps.length).toBe(2);
    expect(fieldSteps[0].title).toBe("Informations personnelles");
    expect(fieldSteps[0].fields).toHaveLength(2);
  });

  it("should preserve field count during migration", () => {
    const legacyFormat = {
      step1: {
        title: "Step 1",
        fields: Array.from({ length: 5 }, (_, i) => ({
          id: `field_${i}`,
          type: "text",
          label: `Field ${i}`,
          required: false,
        })),
      },
    };

    const result = parseFormStructure(legacyFormat);
    const fieldSteps = result.phases[0].steps.filter((s) => s.type === "fields");

    expect(fieldSteps[0].fields).toHaveLength(5);
  });

  it("should handle mixed phase and legacy data gracefully", () => {
    const mixed = {
      phases: [
        {
          id: "cotation",
          name: "Cotation",
          icon: "Calculator",
          steps: [],
        },
      ],
    };

    const result = parseFormStructure(mixed);

    expect(result.phases[0].id).toBe("cotation");
  });

  it("should serialize structure correctly for database storage", () => {
    const structure: FormStructure = {
      phases: [
        {
          id: "cotation",
          name: "Cotation",
          icon: "Calculator",
          steps: [
            {
              id: "step_1",
              title: "Test",
              type: "fields",
              fields: [
                { id: "f1", type: "text", label: "Name", required: true },
              ],
            },
          ],
        },
      ],
    };

    const serialized = serializeFormStructure(structure);

    expect(serialized).toBeDefined();
    expect(typeof serialized).toBe("object");
  });

  it("should detect new format correctly", () => {
    const newFormat = {
      phases: [
        {
          id: "cotation",
          name: "Cotation",
          icon: "Calculator",
          steps: [],
        },
      ],
    };

    expect(isNewFormStructure(newFormat)).toBe(true);
  });

  it("should detect legacy format correctly", () => {
    const legacyFormat = {
      step1: {
        title: "Info",
        fields: [],
      },
    };

    expect(isNewFormStructure(legacyFormat)).toBe(false);
  });

  it("should handle empty legacy format", () => {
    const result = parseFormStructure({});

    expect(result.phases).toBeDefined();
    expect(result.phases.length).toBeGreaterThan(0);
  });

  it("should maintain step IDs during migration", () => {
    const legacyFormat = {
      step1: {
        title: "Step 1",
        fields: [{ id: "f1", type: "text", label: "Field 1", required: false }],
      },
    };

    const result = parseFormStructure(legacyFormat);
    const migratedSteps = result.phases[0].steps;

    expect(migratedSteps.some((s) => s.id.includes("migrated"))).toBe(true);
  });

  it("should create default structure with correct phase order", () => {
    const defaultStructure = createDefaultFormStructure();

    expect(defaultStructure.phases[0].id).toBe("cotation");
    expect(defaultStructure.phases[1].id).toBe("souscription");
  });

  it("should handle deeply nested field configs", () => {
    const legacyFormat = {
      step1: {
        title: "Complex",
        fields: [
          {
            id: "f1",
            type: "select",
            label: "Select",
            required: true,
            options: ["A", "B", "C"],
          } as any,
        ],
      },
    };

    const result = parseFormStructure(legacyFormat);

    expect(result.phases[0].steps.length).toBeGreaterThan(0);
  });
});

describe("Form Builder - migrateOldStepsToPhases", () => {
  it("should create two phases for legacy data", () => {
    const legacySteps = {
      step1: {
        title: "Info",
        fields: [],
      },
    };

    const result = migrateOldStepsToPhases(legacySteps);

    expect(result.phases).toHaveLength(2);
    expect(result.phases[0].id).toBe("cotation");
    expect(result.phases[1].id).toBe("souscription");
  });

  it("should populate cotation phase with legacy steps", () => {
    const legacySteps = {
      step1: { title: "Step 1", fields: [] },
      step2: { title: "Step 2", fields: [] },
    };

    const result = migrateOldStepsToPhases(legacySteps);

    expect(result.phases[0].steps).toHaveLength(2);
    expect(result.phases[0].steps[0].title).toBe("Step 1");
    expect(result.phases[0].steps[1].title).toBe("Step 2");
  });

  it("should leave souscription phase empty after migration", () => {
    const legacySteps = {
      step1: { title: "Info", fields: [] },
    };

    const result = migrateOldStepsToPhases(legacySteps);

    expect(result.phases[1].steps).toHaveLength(0);
  });
});
