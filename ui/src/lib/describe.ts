import type { Column, QualityMetric, QualityOperator, QualityRule, SlaProperty, SlaPropertyName } from "@/lib/types";

export const uid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2));

export const METRIC_LABEL: Record<QualityMetric, string> = {
  nullValues: "Null values",
  missingValues: "Missing values",
  invalidValues: "Invalid values",
  duplicateValues: "Duplicate values",
  rowCount: "Row count",
};

export const OPERATOR_LABEL: Record<QualityOperator, string> = {
  mustBe: "is exactly",
  mustNotBe: "is not",
  mustBeGreaterThan: "is more than",
  mustBeGreaterOrEqualTo: "is at least",
  mustBeLessThan: "is less than",
  mustBeLessOrEqualTo: "is at most",
  mustBeBetween: "is between",
};

export function describeRule(rule: QualityRule): string {
  const subject = rule.type === "sql" ? "Query result" : METRIC_LABEL[rule.metric ?? "nullValues"];
  const unit = rule.unit === "percent" ? " %" : "";
  const value = rule.operator === "mustBeBetween" ? `${rule.value}${unit} and ${rule.valueTo ?? rule.value}${unit}` : `${rule.value}${unit}`;
  return `${subject} ${OPERATOR_LABEL[rule.operator]} ${value}`;
}

export const SLA_LABEL: Record<SlaPropertyName, string> = {
  frequency: "Refreshed every",
  latency: "Newest record no older than",
  retention: "Kept for",
  generalAvailability: "Available from",
};

const UNIT_LABEL: Record<string, string> = { h: "hours", d: "days", y: "years" };

export function describeSla(sla: SlaProperty): string {
  const unit = sla.unit ? ` ${UNIT_LABEL[sla.unit] ?? sla.unit}` : "";
  return `${SLA_LABEL[sla.property]} ${sla.value}${unit}${sla.element ? `, measured on ${sla.element.split(".").pop()}` : ""}`;
}

export const newColumn = (partial: Partial<Column> = {}): Column => ({
  id: uid(),
  name: "",
  logicalType: "string",
  description: "",
  required: false,
  unique: false,
  primaryKey: false,
  tags: [],
  quality: [],
  ...partial,
});

export const newRule = (scope: "column" | "table"): QualityRule => ({
  id: uid(),
  name: scope === "table" ? "Table is not empty" : "No null values",
  type: "library",
  metric: scope === "table" ? "rowCount" : "nullValues",
  operator: scope === "table" ? "mustBeGreaterThan" : "mustBe",
  value: 0,
  dimension: "completeness",
  severity: "error",
});

export const toSlug = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
