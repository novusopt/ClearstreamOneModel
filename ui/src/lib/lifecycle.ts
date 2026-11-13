import { evaluatePolicies } from "@/lib/policies";
import type { DataContract, DataProduct, LifecycleStatus, QualityResult } from "@/lib/types";

export const LIFECYCLE_META: Record<LifecycleStatus, { label: string; meaning: string; platform: string }> = {
  proposed: { label: "Proposed", meaning: "An idea is registered.", platform: "Listed here. Nothing is deployed." },
  draft: { label: "Draft", meaning: "Being built.", platform: "Built and contract-tested on merge. Not scheduled. Contract may change freely." },
  active: { label: "Active", meaning: "Supported and open to consumers.", platform: "Scheduled. Contract enforced on every run. Breaking changes need a major version." },
  deprecated: { label: "Deprecated", meaning: "Still running, on its way out.", platform: "Still scheduled and enforced. No new consumers." },
  retired: { label: "Retired", meaning: "Switched off.", platform: "Schedule removed. Kept as history." },
};

const NEXT: Record<LifecycleStatus, LifecycleStatus[]> = {
  proposed: ["draft", "retired"],
  draft: ["active", "retired"],
  active: ["deprecated"],
  deprecated: ["retired"],
  retired: [],
};

export const allowedTransitions = (status: LifecycleStatus) => NEXT[status];
/** The forward step on the main path, if there is one. */
export const nextStatus = (status: LifecycleStatus): LifecycleStatus | undefined => NEXT[status].find((candidate) => candidate !== "retired") ?? NEXT[status][0];

export interface Gate {
  label: string;
  ok: boolean;
  detail?: string;
}

export interface GateContext {
  product: DataProduct;
  contracts: DataContract[];
  quality: QualityResult[];
  /** Products that list one of this product's contracts as an input. */
  consumers: DataProduct[];
  sunsetDate?: string;
}

/** What must hold before `product` may move to `target`. */
export function gatesFor(target: LifecycleStatus, { product, contracts, quality, consumers, sunsetDate }: GateContext): Gate[] {
  const blocking = evaluatePolicies(product, contracts, target).filter((violation) => violation.level === "enforce");
  const policyGates = (ids: Record<string, string>): Gate[] =>
    Object.entries(ids).map(([policyId, label]) => {
      const failures = blocking.filter((violation) => violation.policyId === policyId);
      return { label, ok: failures.length === 0, detail: failures.map((failure) => failure.message).join("; ") || undefined };
    });

  switch (target) {
    case "draft":
      return [
        { label: "A template is chosen", ok: Boolean(product.template) },
        ...policyGates({ "G-001": "Owner and team are set" }),
        { label: "At least one output port with a contract", ok: contracts.length > 0, detail: contracts.length ? undefined : "Add an output port" },
      ];
    case "active": {
      const failing = quality.filter((result) => result.status === "failed" && result.severity === "error");
      return [
        ...policyGates({
          "G-003": "Every column is described, classified and mapped to a business term",
          "G-004": "Each output has a primary key and a quality rule",
          "G-005": "Frequency and latency are stated",
          "G-006": "Personal data declares retention",
          "G-002": "Column names follow the convention",
        }),
        {
          label: "Latest contract test passes",
          ok: failing.length === 0,
          detail: failing.map((result) => result.ruleName).join("; ") || undefined,
        },
      ];
    }
    case "deprecated":
      return [{ label: "A sunset date is given", ok: Boolean(sunsetDate ?? product.sunsetDate), detail: "Consumers need a date to plan against" }];
    case "retired": {
      const live = consumers.filter((consumer) => consumer.status === "active");
      const date = sunsetDate ?? product.sunsetDate;
      return [
        { label: "No Active product still consumes it", ok: live.length === 0, detail: live.map((consumer) => consumer.title).join(", ") || undefined },
        ...(product.status === "deprecated"
          ? [{ label: "The sunset date has passed", ok: Boolean(date && new Date(date) <= new Date()), detail: date ? `Sunset is ${date}` : "No sunset date" }]
          : []),
      ];
    }
    default:
      return [];
  }
}
