import type { DataContract, DataProduct, LifecycleStatus } from "@/lib/types";

export interface PolicyViolation {
  policyId: string;
  title: string;
  scope: string;
  level: "enforce" | "warn";
  contractId?: string;
  column?: string;
  message: string;
  fix: string;
}

type Finding = Pick<PolicyViolation, "contractId" | "column" | "message">;

export interface Policy {
  id: string;
  title: string;
  /** `global`, or the domain the policy belongs to. */
  scope: string;
  level: "enforce" | "warn";
  /** Lifecycle states in which the policy applies. */
  appliesTo: LifecycleStatus[];
  rationale: string;
  fix: string;
  check: (product: DataProduct, contracts: DataContract[]) => Finding[];
}

const BUILT = ["draft", "active", "deprecated"] satisfies LifecycleStatus[];
const LIVE = ["active", "deprecated"] satisfies LifecycleStatus[];
const SNAKE_CASE = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/;

/**
 * The policies the mock backend evaluates. In the platform these are Open Policy Agent rules kept
 * in Git; here they are plain functions with the same inputs and the same violation shape.
 */
export const POLICIES: Policy[] = [
  {
    id: "G-001",
    title: "Every product has an accountable owner",
    scope: "global",
    level: "enforce",
    appliesTo: ["proposed", ...BUILT],
    rationale: "Consumers and the platform need someone to contact when a product changes or fails.",
    fix: "Set an owner and a team on the product.",
    check: (product) => (product.owner && product.team ? [] : [{ message: "The product has no owner or team" }]),
  },
  {
    id: "G-002",
    title: "Column names are snake_case",
    scope: "global",
    level: "enforce",
    appliesTo: BUILT,
    rationale: "One naming convention keeps products joinable without quoting or guessing.",
    fix: "Rename the column using lower-case letters, digits and underscores.",
    check: (_, contracts) =>
      contracts.flatMap((contract) =>
        contract.columns
          .filter((column) => !SNAKE_CASE.test(column.name))
          .map((column) => ({ contractId: contract.id, column: column.name, message: `"${column.name || "(unnamed)"}" is not snake_case` })),
      ),
  },
  {
    id: "G-003",
    title: "Active columns are described, classified and mapped",
    scope: "global",
    level: "enforce",
    appliesTo: LIVE,
    rationale: "A consumer must be able to tell what a column means and how sensitive it is without asking.",
    fix: "Add the missing description, classification or business term to the column.",
    check: (_, contracts) =>
      contracts.flatMap((contract) =>
        contract.columns.flatMap((column) => {
          const missing = [
            !column.description.trim() && "a description",
            !column.classification && "a classification",
            !column.businessTerm && "a business term",
          ].filter(Boolean);
          return missing.length ? [{ contractId: contract.id, column: column.name, message: `"${column.name}" is missing ${missing.join(", ")}` }] : [];
        }),
      ),
  },
  {
    id: "G-004",
    title: "Active outputs have a key and at least one quality rule",
    scope: "global",
    level: "enforce",
    appliesTo: LIVE,
    rationale: "Without a key and a check, nobody can tell a good load from a bad one.",
    fix: "Mark a primary key column and add a quality rule.",
    check: (_, contracts) =>
      contracts.flatMap((contract) => {
        const findings: Finding[] = [];
        if (!contract.columns.some((column) => column.primaryKey)) {
          findings.push({ contractId: contract.id, message: `"${contract.table}" has no primary key` });
        }
        if (contract.quality.length + contract.columns.reduce((count, column) => count + column.quality.length, 0) === 0) {
          findings.push({ contractId: contract.id, message: `"${contract.table}" has no quality rule` });
        }
        return findings;
      }),
  },
  {
    id: "G-005",
    title: "Active outputs state how fresh they are",
    scope: "global",
    level: "enforce",
    appliesTo: LIVE,
    rationale: "Freshness is the first thing a consumer asks, and the watchdog needs a number to check against.",
    fix: "Add a frequency and a latency service level.",
    check: (_, contracts) =>
      contracts.flatMap((contract) => {
        const declared = new Set(contract.sla.map((sla) => sla.property));
        const missing = (["frequency", "latency"] as const).filter((property) => !declared.has(property));
        return missing.length ? [{ contractId: contract.id, message: `"${contract.table}" declares no ${missing.join(" or ")}` }] : [];
      }),
  },
  {
    id: "G-006",
    title: "Personal data declares its retention",
    scope: "global",
    level: "enforce",
    appliesTo: BUILT,
    rationale: "Personal data may only be kept for a stated period.",
    fix: "Add a retention service level to the contract.",
    check: (_, contracts) =>
      contracts.flatMap((contract) =>
        contract.sla.some((sla) => sla.property === "retention")
          ? []
          : contract.columns
              .filter((column) => column.tags.includes("PII.Sensitive"))
              .map((column) => ({ contractId: contract.id, column: column.name, message: `"${column.name}" is personal data but the contract declares no retention` })),
      ),
  },
  {
    id: "D-SET-001",
    title: "Counterparty data is confidential",
    scope: "settlement",
    level: "warn",
    appliesTo: BUILT,
    rationale: "Counterparty identity is commercially sensitive in the settlement domain.",
    fix: "Classify the column as Confidential or Restricted.",
    check: (_, contracts) =>
      contracts.flatMap((contract) =>
        contract.columns
          .filter(
            (column) =>
              column.businessTerm === "Settlement.Counterparty" &&
              !["Confidentiality.Confidential", "Confidentiality.Restricted"].includes(column.classification ?? ""),
          )
          .map((column) => ({
            contractId: contract.id,
            column: column.name,
            message: `"${column.name}" is mapped to Counterparty but classified ${column.classification?.split(".")[1] ?? "nothing"}`,
          })),
      ),
  },
];

/**
 * Evaluates global policies and the product's domain policies. Pass `asStatus` to ask "what would
 * fail if this product moved to that state?" — which is how lifecycle gates are computed.
 */
export function evaluatePolicies(product: DataProduct, contracts: DataContract[], asStatus: LifecycleStatus = product.status): PolicyViolation[] {
  return POLICIES.filter((policy) => (policy.scope === "global" || policy.scope === product.domain) && policy.appliesTo.includes(asStatus)).flatMap(
    (policy) =>
      policy.check(product, contracts).map((finding) => ({
        policyId: policy.id,
        title: policy.title,
        scope: policy.scope,
        level: policy.level,
        fix: policy.fix,
        ...finding,
      })),
  );
}
