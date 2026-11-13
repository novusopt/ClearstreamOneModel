import Ajv2019 from "ajv/dist/2019";
import type { ValidateFunction } from "ajv/dist/2019";
import addFormats from "ajv-formats";
import odcsSchema from "./schemas/odcs-v3.1.0.json";
import odpsSchema from "./schemas/odps-v1.0.0.json";

export interface SchemaIssue {
  path: string;
  message: string;
}

const validators: Partial<Record<"odcs" | "odps", ValidateFunction>> = {};

function validator(kind: "odcs" | "odps"): ValidateFunction {
  if (!validators[kind]) {
    const ajv = new Ajv2019({ allErrors: true, strict: false });
    addFormats(ajv);
    validators[kind] = ajv.compile(kind === "odcs" ? odcsSchema : odpsSchema);
  }
  return validators[kind];
}

/** Validates a document against the official JSON Schema of its standard. */
export function validateAgainstStandard(kind: "odcs" | "odps", doc: unknown): SchemaIssue[] {
  const validate = validator(kind);
  if (validate(doc)) return [];
  const seen = new Set<string>();
  const issues: SchemaIssue[] = [];
  for (const error of validate.errors ?? []) {
    // `oneOf`/`allOf` wrappers repeat what their branches already report.
    if (error.keyword === "oneOf" || error.keyword === "allOf" || error.keyword === "if") continue;
    const issue = { path: error.instancePath || "/", message: error.message ?? "is invalid" };
    const key = `${issue.path} ${issue.message}`;
    if (!seen.has(key)) {
      seen.add(key);
      issues.push(issue);
    }
  }
  return issues;
}
