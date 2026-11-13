/**
 * Domain model for the authoring UI.
 *
 * The shapes follow the two open standards the platform is built on — the Open Data Product
 * Standard (ODPS v1.0.0) for products and the Open Data Contract Standard (ODCS v3.1.0) for
 * contracts — flattened where that makes forms simpler. `lib/standards/serialize.ts` turns them
 * into standard-conformant documents.
 */

export const LIFECYCLE = ["proposed", "draft", "active", "deprecated", "retired"] as const;
export type LifecycleStatus = (typeof LIFECYCLE)[number];

export const LOGICAL_TYPES = ["string", "integer", "number", "boolean", "date", "timestamp", "time", "object", "array"] as const;
export type LogicalType = (typeof LOGICAL_TYPES)[number];

export type TemplateId = "source-aligned-dbt" | "aggregate-dbt" | "spark-iceberg";

export interface TemplateInfo {
  id: TemplateId;
  name: string;
  productType: "source-aligned" | "aggregate";
  engine: string;
  language: "sql" | "python";
  summary: string;
  takesInputPorts: boolean;
}

export const QUALITY_METRICS = ["nullValues", "missingValues", "invalidValues", "duplicateValues", "rowCount"] as const;
export type QualityMetric = (typeof QUALITY_METRICS)[number];

export const QUALITY_OPERATORS = [
  "mustBe",
  "mustNotBe",
  "mustBeGreaterThan",
  "mustBeGreaterOrEqualTo",
  "mustBeLessThan",
  "mustBeLessOrEqualTo",
  "mustBeBetween",
] as const;
export type QualityOperator = (typeof QUALITY_OPERATORS)[number];

export const QUALITY_DIMENSIONS = ["accuracy", "completeness", "conformity", "consistency", "coverage", "timeliness", "uniqueness"] as const;
export type QualityDimension = (typeof QUALITY_DIMENSIONS)[number];

export interface QualityRule {
  id: string;
  name: string;
  description?: string;
  type: "library" | "sql";
  metric?: QualityMetric;
  query?: string;
  operator: QualityOperator;
  value: number;
  /** Upper bound, only for `mustBeBetween`. */
  valueTo?: number;
  unit?: "rows" | "percent";
  dimension: QualityDimension;
  severity: "error" | "warning";
}

export interface Column {
  /** Stable key for the editor; never serialized. */
  id: string;
  name: string;
  logicalType: LogicalType;
  physicalType?: string;
  description: string;
  required: boolean;
  unique: boolean;
  primaryKey: boolean;
  /** Confidentiality level: the fully qualified name of a classification tag from the vocabulary. */
  classification?: string;
  /** Other tags from the vocabulary, e.g. `PII.Sensitive`, `Tier.Tier1`. */
  tags: string[];
  /** Id of a glossary term from the vocabulary. */
  businessTerm?: string;
  quality: QualityRule[];
}

export const SLA_PROPERTIES = ["frequency", "latency", "retention", "generalAvailability"] as const;
export type SlaPropertyName = (typeof SLA_PROPERTIES)[number];

export interface SlaProperty {
  id: string;
  property: SlaPropertyName;
  value: number | string;
  unit?: string;
  /** Column the SLA is measured on, e.g. the timestamp for `latency`. */
  element?: string;
}

export interface DataContract {
  id: string;
  productId: string;
  /** Name of the output port this contract describes. */
  port: string;
  name: string;
  version: string;
  status: LifecycleStatus;
  purpose: string;
  /** Physical table name of the output port. */
  table: string;
  tableDescription: string;
  columns: Column[];
  /** Table-level quality rules. */
  quality: QualityRule[];
  sla: SlaProperty[];
  tags: string[];
  updatedAt: string;
}

export interface InputPort {
  name: string;
  contractId: string;
  version: string;
}

export interface OutputPort {
  name: string;
  description: string;
  contractId: string;
  version: string;
}

export interface Transformation {
  language: "sql" | "python";
  code: string;
}

export interface DataProduct {
  /** `<domain>.<name>` */
  id: string;
  /** Machine name, kebab-case. */
  name: string;
  title: string;
  domain: string;
  purpose: string;
  usage?: string;
  limitations?: string;
  status: LifecycleStatus;
  version: string;
  team: string;
  owner: string;
  template: TemplateId;
  /** Cron expression; only applied once the product is Active. */
  schedule: string;
  inputPorts: InputPort[];
  outputPorts: OutputPort[];
  tags: string[];
  transformation: Transformation;
  sunsetDate?: string;
  successor?: string;
  createdAt: string;
  updatedAt: string;
}

/* ---------- Vocabulary (defined in the catalog, referenced from contracts) ---------- */

export interface GlossaryTerm {
  id: string;
  name: string;
  glossary: string;
  definition: string;
}

export interface TagDefinition {
  /** Fully qualified name, `<Classification>.<Tag>`. */
  fqn: string;
  group: string;
  name: string;
  description: string;
}

export interface Vocabulary {
  terms: GlossaryTerm[];
  /** Confidentiality levels, usable in a column's `classification`. */
  classifications: TagDefinition[];
  /** Everything else, usable in `tags`. */
  tags: TagDefinition[];
  domains: { id: string; name: string; team: string }[];
}

/* ---------- Pipeline runs and quality results (simulated by the mock backend) ---------- */

export interface PipelineStep {
  key: string;
  label: string;
  detail: string;
  durationMs: number;
}

export interface PipelineRun {
  id: string;
  productId: string;
  kind: "create" | "contract-change" | "lifecycle";
  title: string;
  startedAt: string;
  steps: PipelineStep[];
}

export interface QualityResult {
  contractId: string;
  ruleId: string;
  ruleName: string;
  column?: string;
  severity: "error" | "warning";
  status: "passed" | "failed";
  observed: string;
  /** Oldest first; one entry per simulated run. */
  history: ("passed" | "failed")[];
}

export interface NewProductInput {
  name: string;
  title: string;
  domain: string;
  purpose: string;
  owner: string;
  template: TemplateId;
  schedule: string;
  inputPorts: InputPort[];
  port: string;
  table: string;
  tableDescription: string;
  columns: Column[];
  quality: QualityRule[];
  sla: SlaProperty[];
  transformation: Transformation;
  /** `proposed` registers the idea only; `draft` creates the full product. */
  status: "proposed" | "draft";
}
